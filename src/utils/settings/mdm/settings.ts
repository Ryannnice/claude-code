/**
 * MDM (Mobile Device Management) profile enforcement for Claude Code managed settings.
 *
 * Reads enterprise settings from OS-level MDM configuration:
 * - macOS: `com.anthropic.claudecode` preference domain
 *   (MDM profiles at /Library/Managed Preferences/ only — not user-writable ~/Library/Preferences/)
 * - Windows: `HKLM\SOFTWARE\Policies\ClaudeCode` (admin-only)
 *   and `HKCU\SOFTWARE\Policies\ClaudeCode` (user-writable, lowest priority)
 * - Linux: No MDM equivalent (uses /etc/claude-code/managed-settings.json instead)
 *
 * Policy settings use "first source wins" — the highest-priority source that exists
 * provides all policy settings. Priority (highest to lowest):
 *   remote → HKLM/plist → managed-settings.json → HKCU
 *
 * Architecture:
 *   constants.ts — shared constants and plist path builder (zero heavy imports)
 *   rawRead.ts   — subprocess I/O only (zero heavy imports, fires at main.tsx evaluation)
 *   settings.ts  — parsing, caching, first-source-wins logic (this file)
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 logForDebugging，将 ../../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../../debug.js'
// 引入 logForDiagnosticsNoPII，将 ../../diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from '../../diagLogs.js'
// 引入 readFileSync，将 ../../fileRead.js 中已经封装好的能力接到本文件流程里。
import { readFileSync } from '../../fileRead.js'
// 引入 getFsImplementation，将 ../../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../../fsOperations.js'
// 引入 safeParseJSON，将 ../../json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from '../../json.js'
// 引入 profileCheckpoint，将 ../../startupProfiler.js 中已经封装好的能力接到本文件流程里。
import { profileCheckpoint } from '../../startupProfiler.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getManagedFilePath,
  getManagedSettingsDropInDir,
} from '../managedPath.js'
// 引入 SettingsJson、SettingsSchema，将 ../types.js 中已经封装好的能力接到本文件流程里。
import { type SettingsJson, SettingsSchema } from '../types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  filterInvalidPermissionRules,
  formatZodError,
  type ValidationError,
} from '../validation.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  WINDOWS_REGISTRY_KEY_PATH_HKCU,
  WINDOWS_REGISTRY_KEY_PATH_HKLM,
  WINDOWS_REGISTRY_VALUE_NAME,
} from './constants.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  fireRawRead,
  getMdmRawReadPromise,
  type RawReadResult,
} from './rawRead.js'

// ---------------------------------------------------------------------------
// Types and cache
// ---------------------------------------------------------------------------

// MdmResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type MdmResult = { settings: SettingsJson; errors: ValidationError[] }
// EMPTY_RESULT 命名 `Object.freeze({ settings: {}, errors: [] })`，让后续代码直接表达这个值的用途。
const EMPTY_RESULT: MdmResult = Object.freeze({ settings: {}, errors: [] })
// mdmCache 缓存初始化为空值，后续分支会在有数据时补齐。
let mdmCache: MdmResult | null = null
// hkcuCache 缓存保存`null`，作为后续空值处理的输入。
let hkcuCache: MdmResult | null = null
// mdmLoadPromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let mdmLoadPromise: Promise<void> | null = null

// ---------------------------------------------------------------------------
// Startup load — fires early, awaited before first settings read
// ---------------------------------------------------------------------------

/**
 * Kick off async MDM/HKCU reads. Call this as early as possible in
 * startup so the subprocess runs in parallel with module loading.
 */
// startMdmSettingsLoad 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startMdmSettingsLoad(): void {
  // 满足 `mdmLoadPromise` 时，共享工具执行该分支。
  if (mdmLoadPromise) return
  // mdmLoadPromise 异步任务更新为 `(async () => {`，确保共享工具后续读取最新状态。
  mdmLoadPromise = (async () => {
    // 调用 profileCheckpoint，触发共享工具此处需要的副作用。
    profileCheckpoint('mdm_load_start')
    // startTime记录时间`Date.now`，供共享工具后续处理使用。
    const startTime = Date.now()

    // Use the startup raw read if cli.tsx fired it, otherwise fire a fresh one.
    // Both paths produce the same RawReadResult; consumeRawReadResult parses it.
    // rawPromise 异步任务保存 `getMdmRawReadPromise` 启动的异步任务，稍后再决定等待还是后台完成。
    const rawPromise = getMdmRawReadPromise() ?? fireRawRead()
    // 从 `consumeRawReadResult(await rawPromise)` 解构 mdm、hkcu，减少共享工具 settings对同一对象的重复访问。
    const { mdm, hkcu } = consumeRawReadResult(await rawPromise)
    // mdmCache 缓存更新为 `mdm`，确保共享工具后续读取最新状态。
    mdmCache = mdm
    // hkcuCache 缓存更新为 `hkcu`，确保共享工具后续读取最新状态。
    hkcuCache = hkcu
    // 调用 profileCheckpoint，触发共享工具此处需要的副作用。
    profileCheckpoint('mdm_load_end')

    // duration记录时间`Date.now`，供共享工具后续处理使用。
    const duration = Date.now() - startTime
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`MDM settings load completed in ${duration}ms`)
    // 满足 `Object.keys(mdm.settings).length > 0` 时，共享工具执行该分支。
    if (Object.keys(mdm.settings).length > 0) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `MDM settings found: ${Object.keys(mdm.settings).join(', ')}`,
      )
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
        logForDiagnosticsNoPII('info', 'mdm_settings_loaded', {
          duration_ms: duration,
          key_count: Object.keys(mdm.settings).length,
          error_count: mdm.errors.length,
        })
      } catch {
        // Diagnostic logging is best-effort
      }
    }
  })()
}

/**
 * Await the in-flight MDM load. Call this before the first settings read.
 * If startMdmSettingsLoad() was called early enough, this resolves immediately.
 */
// ensureMdmSettingsLoaded 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function ensureMdmSettingsLoaded(): Promise<void> {
  // mdmLoadPromise 异步任务缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!mdmLoadPromise) {
    // 调用 startMdmSettingsLoad，触发共享工具此处需要的副作用。
    startMdmSettingsLoad()
  }
  // 等待 `mdmLoadPromise` 完成，再继续共享工具 settings的异步流程。
  await mdmLoadPromise
}

// ---------------------------------------------------------------------------
// Sync cache readers — used by the settings pipeline (loadSettingsFromDisk)
// ---------------------------------------------------------------------------

/**
 * Read admin-controlled MDM settings from the session cache.
 *
 * Returns settings from admin-only sources:
 * - macOS: /Library/Managed Preferences/ (requires root)
 * - Windows: HKLM registry (requires admin)
 *
 * Does NOT include HKCU (user-writable) — use getHkcuSettings() for that.
 */
// getMdmSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMdmSettings(): MdmResult {
  // 返回 `mdmCache ?? EMPTY_RESULT`，作为共享工具这次计算的结果。
  return mdmCache ?? EMPTY_RESULT
}

/**
 * Read HKCU registry settings (user-writable, lowest policy priority).
 * Only relevant on Windows — returns empty on other platforms.
 */
// getHkcuSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHkcuSettings(): MdmResult {
  // 返回 `hkcuCache ?? EMPTY_RESULT`，作为共享工具这次计算的结果。
  return hkcuCache ?? EMPTY_RESULT
}

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

/**
 * Clear the MDM and HKCU settings caches, forcing a fresh read on next load.
 */
// clearMdmSettingsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMdmSettingsCache(): void {
  // mdmCache 缓存更新为 `null`，确保共享工具后续读取最新状态。
  mdmCache = null
  // hkcuCache 缓存更新为 `null`，确保共享工具后续读取最新状态。
  hkcuCache = null
  // mdmLoadPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
  mdmLoadPromise = null
}

/**
 * Update the session caches directly. Used by the change detector poll.
 */
// setMdmSettingsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMdmSettingsCache(mdm: MdmResult, hkcu: MdmResult): void {
  // mdmCache 缓存更新为 `mdm`，确保共享工具后续读取最新状态。
  mdmCache = mdm
  // hkcuCache 缓存更新为 `hkcu`，确保共享工具后续读取最新状态。
  hkcuCache = hkcu
}

// ---------------------------------------------------------------------------
// Refresh — fires a fresh raw read, parses, returns results.
// Used by the 30-minute poll in changeDetector.ts.
// ---------------------------------------------------------------------------

/**
 * Fire a fresh MDM subprocess read and parse the results.
 * Does NOT update the cache — caller decides whether to apply.
 */
// refreshMdmSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshMdmSettings(): Promise<{
  mdm: MdmResult
  hkcu: MdmResult
}> {
  // 原始文本保存`fireRawRead`，供共享工具后续处理使用。
  const raw = await fireRawRead()
  // 返回 `consumeRawReadResult(raw)`，作为共享工具这次计算的结果。
  return consumeRawReadResult(raw)
}

// ---------------------------------------------------------------------------
// Parsing — converts raw subprocess output to validated MdmResult
// ---------------------------------------------------------------------------

/**
 * Parse JSON command output (plutil stdout or registry JSON value) into SettingsJson.
 * Filters invalid permission rules before schema validation so one bad rule
 * doesn't cause the entire MDM settings to be rejected.
 */
// parseCommandOutputAsSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseCommandOutputAsSettings(
  stdout: string,
  sourcePath: string,
): { settings: SettingsJson; errors: ValidationError[] } {
  // data保存`safeParseJSON`，供共享工具后续处理使用。
  const data = safeParseJSON(stdout, false)
  // `!data || typeof data` 与 `'object'` 不一致时刷新派生状态，避免使用过期结果。
  if (!data || typeof data !== 'object') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { settings: {}, errors: [] }
  }

  // ruleWarnings 警告信息筛选`filterInvalidPermissionRules`，供共享工具后续处理使用。
  const ruleWarnings = filterInvalidPermissionRules(data, sourcePath)
  // parseResult保存`SettingsSchema`，供共享工具后续处理使用。
  const parseResult = SettingsSchema().safeParse(data)
  // parseResult.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parseResult.success) {
    // 错误列表格式化`formatZodError`，供共享工具后续处理使用。
    const errors = formatZodError(parseResult.error, sourcePath)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { settings: {}, errors: [...ruleWarnings, ...errors] }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { settings: parseResult.data, errors: ruleWarnings }
}

/**
 * Parse reg query stdout to extract a registry string value.
 * Matches both REG_SZ and REG_EXPAND_SZ, case-insensitive.
 *
 * Expected format:
 *     Settings    REG_SZ    {"json":"value"}
 */
// parseRegQueryStdout 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseRegQueryStdout(
  stdout: string,
  valueName = 'Settings',
): string | null {
  // 文本行格式化`stdout.split`，供共享工具后续处理使用。
  const lines = stdout.split(/\r?\n/)
  // escaped格式化`valueName.replace`，供共享工具后续处理使用。
  const escaped = valueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // re匹配`RegExp`，供共享工具后续处理使用。
  const re = new RegExp(`^\\s+${escaped}\\s+REG_(?:EXPAND_)?SZ\\s+(.*)$`, 'i')
  // 按顺序遍历 `lines` 中的line，逐个交给共享工具处理。
  for (const line of lines) {
    // match匹配`line.match`，供共享工具后续处理使用。
    const match = line.match(re)
    // 只有 `match && match[1]` 满足时，共享工具才执行该分支。
    if (match && match[1]) {
      // 返回 `match[1].trimEnd()`，作为共享工具这次计算的结果。
      return match[1].trimEnd()
    }
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Convert raw subprocess output into parsed MDM and HKCU results,
 * applying the first-source-wins policy.
 */
// consumeRawReadResult 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function consumeRawReadResult(raw: RawReadResult): {
  mdm: MdmResult
  hkcu: MdmResult
} {
  // macOS: plist result (first source wins — already filtered in mdmRawRead)
  // 只有 `raw.plistStdouts && raw.plistStdouts.length > 0` 满足时，共享工具才执行该分支。
  if (raw.plistStdouts && raw.plistStdouts.length > 0) {
    // 从 `raw.plistStdouts[0]!` 解构 stdout、label，减少共享工具 settings对同一对象的重复访问。
    const { stdout, label } = raw.plistStdouts[0]!
    // 结果解析`parseCommandOutputAsSettings`，供共享工具后续处理使用。
    const result = parseCommandOutputAsSettings(stdout, label)
    // 满足 `Object.keys(result.settings).length > 0` 时，共享工具执行该分支。
    if (Object.keys(result.settings).length > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { mdm: result, hkcu: EMPTY_RESULT }
    }
  }

  // Windows: HKLM result
  // 满足 `raw.hklmStdout` 时，共享工具执行该分支。
  if (raw.hklmStdout) {
    // jsonString解析`parseRegQueryStdout`，供共享工具后续处理使用。
    const jsonString = parseRegQueryStdout(raw.hklmStdout)
    // 满足 `jsonString` 时，共享工具执行该分支。
    if (jsonString) {
      // 结果解析`parseCommandOutputAsSettings`，供共享工具后续处理使用。
      const result = parseCommandOutputAsSettings(
        jsonString,
        `Registry: ${WINDOWS_REGISTRY_KEY_PATH_HKLM}\\${WINDOWS_REGISTRY_VALUE_NAME}`,
      )
      // 满足 `Object.keys(result.settings).length > 0` 时，共享工具执行该分支。
      if (Object.keys(result.settings).length > 0) {
        // 返回结构化结果，集中表达共享工具已经整理出的状态。
        return { mdm: result, hkcu: EMPTY_RESULT }
      }
    }
  }

  // No admin MDM — check managed-settings.json before using HKCU
  // 满足 `hasManagedSettingsFile()` 时，共享工具执行该分支。
  if (hasManagedSettingsFile()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { mdm: EMPTY_RESULT, hkcu: EMPTY_RESULT }
  }

  // Fall through to HKCU (already read in parallel)
  // 满足 `raw.hkcuStdout` 时，共享工具执行该分支。
  if (raw.hkcuStdout) {
    // jsonString解析`parseRegQueryStdout`，供共享工具后续处理使用。
    const jsonString = parseRegQueryStdout(raw.hkcuStdout)
    // 满足 `jsonString` 时，共享工具执行该分支。
    if (jsonString) {
      // 结果解析`parseCommandOutputAsSettings`，供共享工具后续处理使用。
      const result = parseCommandOutputAsSettings(
        jsonString,
        `Registry: ${WINDOWS_REGISTRY_KEY_PATH_HKCU}\\${WINDOWS_REGISTRY_VALUE_NAME}`,
      )
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { mdm: EMPTY_RESULT, hkcu: result }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { mdm: EMPTY_RESULT, hkcu: EMPTY_RESULT }
}

/**
 * Check if file-based managed settings (managed-settings.json or any
 * managed-settings.d/*.json) exist and have content. Cheap sync check
 * used to skip HKCU when a higher-priority file-based source exists.
 */
// hasManagedSettingsFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasManagedSettingsFile(): boolean {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 文件路径格式化`join`，供共享工具后续处理使用。
    const filePath = join(getManagedFilePath(), 'managed-settings.json')
    // 文本内容读取`readFileSync`，供共享工具后续处理使用。
    const content = readFileSync(filePath)
    // data保存`safeParseJSON`，供共享工具后续处理使用。
    const data = safeParseJSON(content, false)
    // 只有 `data && typeof data === 'object' && Object.keys(data).length > 0` 满足时，共享工具才执行该分支。
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  } catch {
    // fall through to drop-in check
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // dropInDir读取`getManagedSettingsDropInDir`，供共享工具后续处理使用。
    const dropInDir = getManagedSettingsDropInDir()
    // entries 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const entries = getFsImplementation().readdirSync(dropInDir)
    // 按顺序遍历 `entries` 中的d，逐个交给共享工具处理。
    for (const d of entries) {
      // 共享工具在这里按实际状态进入对应分支。
      if (
        !(d.isFile() || d.isSymbolicLink()) ||
        !d.name.endsWith('.json') ||
        d.name.startsWith('.')
      ) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容读取`readFileSync`，供共享工具后续处理使用。
        const content = readFileSync(join(dropInDir, d.name))
        // data保存`safeParseJSON`，供共享工具后续处理使用。
        const data = safeParseJSON(content, false)
        // 只有 `data && typeof data === 'object' && Object.keys(data).length > 0` 满足时，共享工具才执行该分支。
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      } catch {
        // skip unreadable/malformed file
      }
    }
  } catch {
    // drop-in dir doesn't exist
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
