/**
 * User keybinding configuration loader with hot-reload support.
 *
 * Loads keybindings from ~/.claude/keybindings.json and watches
 * for changes to reload them automatically.
 *
 * NOTE: User keybinding customization is currently only available for
 * Anthropic employees (USER_TYPE === 'ant'). External users always
 * use the default bindings.
 */

// 引入 chokidar、FSWatcher，将 chokidar 中已经封装好的能力接到本文件流程里。
import chokidar, { type FSWatcher } from 'chokidar'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { readFile, stat } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
// 复用 errorMessage、isENOENT 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage, isENOENT } from '../utils/errors.js'
// 复用 createSignal 工具函数，把通用处理留在 ../utils/signal.js 中维护。
import { createSignal } from '../utils/signal.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse } from '../utils/slowOperations.js'
// 引入 DEFAULT_BINDINGS，将 ./defaultBindings.js 中已经封装好的能力接到本文件流程里。
import { DEFAULT_BINDINGS } from './defaultBindings.js'
// 引入 parseBindings，将 ./parser.js 中已经封装好的能力接到本文件流程里。
import { parseBindings } from './parser.js'
// 类型依赖 { KeybindingBlock, ParsedBinding } 来自 ./types.js，用于校准load User Bindings的数据契约。
import type { KeybindingBlock, ParsedBinding } from './types.js'
// 整理这一组导入，让load User Bindings后续逻辑可以直接复用这些外部能力。
import {
  checkDuplicateKeysInJson,
  type KeybindingWarning,
  validateBindings,
} from './validate.js'

/**
 * Check if keybinding customization is enabled.
 *
 * Returns true if the tengu_keybinding_customization_release GrowthBook gate is enabled.
 *
 * This function is exported so other parts of the codebase (e.g., /doctor)
 * can check the same condition consistently.
 */
// isKeybindingCustomizationEnabled 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isKeybindingCustomizationEnabled(): boolean {
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE(`，作为load User Bindings这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_keybinding_customization_release',
    false,
  )
}

/**
 * Time in milliseconds to wait for file writes to stabilize.
 */
// FILE_STABILITY_THRESHOLD_MS 文件数据保存`500`，供后续判断或组装使用。
const FILE_STABILITY_THRESHOLD_MS = 500

/**
 * Polling interval for checking file stability.
 */
// FILE_STABILITY_POLL_INTERVAL_MS 文件数据保存`200`，供后续判断或组装使用。
const FILE_STABILITY_POLL_INTERVAL_MS = 200

/**
 * Result of loading keybindings, including any validation warnings.
 */
// KeybindingsLoadResult 固化load User Bindings里传递的数据形状，帮助调用方按同一结构读写字段。
export type KeybindingsLoadResult = {
  bindings: ParsedBinding[]
  warnings: KeybindingWarning[]
}

// watcher初始化为空值，后续分支会在有数据时补齐。
let watcher: FSWatcher | null = null
// initialized标记load User Bindings是否启用对应路径。
let initialized = false
// disposed标记load User Bindings是否启用对应路径。
let disposed = false
// cachedBindings 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let cachedBindings: ParsedBinding[] | null = null
// cachedWarnings 缓存 从空数组开始收集，后续循环会按处理顺序追加条目。
let cachedWarnings: KeybindingWarning[] = []
// keybindingsChanged构建`createSignal<[result: KeybindingsLoadResult]>()` 整理出中间结果，供load User Bindings后续步骤使用。
const keybindingsChanged = createSignal<[result: KeybindingsLoadResult]>()

/**
 * Tracks the date (YYYY-MM-DD) when we last logged a custom keybindings load event.
 * Used to ensure we fire the event at most once per day.
 */
// lastCustomBindingsLogDate 命名 `null`，让后续代码直接表达这个值的用途。
let lastCustomBindingsLogDate: string | null = null

/**
 * Log a telemetry event when custom keybindings are loaded, at most once per day.
 * This lets us estimate the percentage of users who customize their keybindings.
 */
// logCustomBindingsLoadedOncePerDay 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logCustomBindingsLoadedOncePerDay(userBindingCount: number): void {
  // today记录时间`Date`，供load User Bindings后续处理使用。
  const today = new Date().toISOString().slice(0, 10)
  // 满足 `lastCustomBindingsLogDate === today` 时，load User Bindings执行该分支。
  if (lastCustomBindingsLogDate === today) return
  // lastCustomBindingsLogDate更新为 `today`，确保loadUserBindings后续读取最新状态。
  lastCustomBindingsLogDate = today
  // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_custom_keybindings_loaded', {
    user_binding_count: userBindingCount,
  })
}

/**
 * Type guard to check if an object is a valid KeybindingBlock.
 */
// isKeybindingBlock 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKeybindingBlock(obj: unknown): obj is KeybindingBlock {
  // `typeof obj` 与 `'object' || obj === null` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof obj !== 'object' || obj === null) return false
  // b保存`obj as Record<string, unknown>`，供load User Bindings后续判断或输出使用。
  const b = obj as Record<string, unknown>
  // 返回 `(`，作为load User Bindings这次计算的结果。
  return (
    typeof b.context === 'string' &&
    typeof b.bindings === 'object' &&
    b.bindings !== null
  )
}

/**
 * Type guard to check if an array contains only valid KeybindingBlocks.
 */
// isKeybindingBlockArray 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKeybindingBlockArray(arr: unknown): arr is KeybindingBlock[] {
  // 返回 `Array.isArray(arr) && arr.every(isKeybindingBlock)`，作为load User Bindings这次计算的结果。
  return Array.isArray(arr) && arr.every(isKeybindingBlock)
}

/**
 * Get the path to the user keybindings file.
 */
// getKeybindingsPath 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKeybindingsPath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), 'keybindings.json')`，作为load User Bindings这次计算的结果。
  return join(getClaudeConfigHomeDir(), 'keybindings.json')
}

/**
 * Parse default bindings (cached for performance).
 */
// getDefaultParsedBindings 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getDefaultParsedBindings(): ParsedBinding[] {
  // 返回 `parseBindings(DEFAULT_BINDINGS)`，作为load User Bindings这次计算的结果。
  return parseBindings(DEFAULT_BINDINGS)
}

/**
 * Load and parse keybindings from user config file.
 * Returns merged default + user bindings along with validation warnings.
 *
 * For external users, always returns default bindings only.
 * User customization is currently gated to Anthropic employees.
 */
// loadKeybindings 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadKeybindings(): Promise<KeybindingsLoadResult> {
  // defaultBindings 集合读取`getDefaultParsedBindings`，供load User Bindings后续处理使用。
  const defaultBindings = getDefaultParsedBindings()

  // Skip user config loading for external users
  // 满足 `!isKeybindingCustomizationEnabled()` 时，load User Bindings执行该分支。
  if (!isKeybindingCustomizationEnabled()) {
    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return { bindings: defaultBindings, warnings: [] }
  }

  // userPath 路径数据读取`getKeybindingsPath`，供load User Bindings后续处理使用。
  const userPath = getKeybindingsPath()

  // 保护这一段可能失败的load User Bindings操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`readFile`，供load User Bindings后续处理使用。
    const content = await readFile(userPath, 'utf-8')
    // 解析结果解析`jsonParse(content)` 整理出中间结果，供load User Bindings后续步骤使用。
    const parsed: unknown = jsonParse(content)

    // Extract bindings array from object wrapper format: { "bindings": [...] }
    // userBlocks 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let userBlocks: unknown
    // `typeof parsed === 'object' && parsed` 与 `null &&` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof parsed === 'object' && parsed !== null && 'bindings' in parsed) {
      // userBlocks 集合更新为 `(parsed as { bindings: unknown }).bindings`，确保loadUserBindings后续读取最新状态。
      userBlocks = (parsed as { bindings: unknown }).bindings
    } else {
      // Invalid format - missing bindings property
      // errorMessage 消息数据固定为 `'keybindings.json must have a "bindings" array'`，作为load User Bindings后续展示或比较的基准。
      const errorMessage = 'keybindings.json must have a "bindings" array'
      // suggestion固定为 `'Use format: { "bindings": [ ... ] }'`，作为load User Bindings后续展示或比较的基准。
      const suggestion = 'Use format: { "bindings": [ ... ] }'
      // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[keybindings] Invalid keybindings.json: ${errorMessage}`)
      // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
      return {
        bindings: defaultBindings,
        warnings: [
          {
            type: 'parse_error',
            severity: 'error',
            message: errorMessage,
            suggestion,
          },
        ],
      }
    }

    // Validate structure - bindings must be an array of valid keybinding blocks
    // 满足 `!isKeybindingBlockArray(userBlocks)` 时，load User Bindings执行该分支。
    if (!isKeybindingBlockArray(userBlocks)) {
      // errorMessage 消息数据保存`Array.isArray`，供load User Bindings后续处理使用。
      const errorMessage = !Array.isArray(userBlocks)
        ? '"bindings" must be an array'
        : 'keybindings.json contains invalid block structure'
      // suggestion保存`Array.isArray`，供load User Bindings后续处理使用。
      const suggestion = !Array.isArray(userBlocks)
        ? 'Set "bindings" to an array of keybinding blocks'
        : 'Each block must have "context" (string) and "bindings" (object)'
      // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[keybindings] Invalid keybindings.json: ${errorMessage}`)
      // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
      return {
        bindings: defaultBindings,
        warnings: [
          {
            type: 'parse_error',
            severity: 'error',
            message: errorMessage,
            suggestion,
          },
        ],
      }
    }

    // userParsed解析`parseBindings`，供load User Bindings后续处理使用。
    const userParsed = parseBindings(userBlocks)
    // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[keybindings] Loaded ${userParsed.length} user bindings from ${userPath}`,
    )

    // User bindings come after defaults, so they override
    // mergedBindings 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const mergedBindings = [...defaultBindings, ...userParsed]

    // 调用 logCustomBindingsLoadedOncePerDay，触发load User Bindings此处需要的副作用。
    logCustomBindingsLoadedOncePerDay(userParsed.length)

    // Run validation on user config
    // First check for duplicate keys in raw JSON (JSON.parse silently drops earlier values)
    // duplicateKeyWarnings 警告信息读取`checkDuplicateKeysInJson`，供load User Bindings后续处理使用。
    const duplicateKeyWarnings = checkDuplicateKeysInJson(content)
    // 警告列表 聚合成有序列表，保持后续遍历顺序稳定。
    const warnings = [
      ...duplicateKeyWarnings,
      ...validateBindings(userBlocks, mergedBindings),
    ]

    // 满足 `warnings.length > 0` 时，load User Bindings执行该分支。
    if (warnings.length > 0) {
      // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[keybindings] Found ${warnings.length} validation issue(s)`,
      )
    }

    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return { bindings: mergedBindings, warnings }
  } catch (error) {
    // File doesn't exist - use defaults (user can run /keybindings to create)
    // 满足 `isENOENT(error)` 时，load User Bindings执行该分支。
    if (isENOENT(error)) {
      // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
      return { bindings: defaultBindings, warnings: [] }
    }

    // Other error - log and return defaults with warning
    // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[keybindings] Error loading ${userPath}: ${errorMessage(error)}`,
    )
    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return {
      bindings: defaultBindings,
      warnings: [
        {
          type: 'parse_error',
          severity: 'error',
          message: `Failed to parse keybindings.json: ${errorMessage(error)}`,
        },
      ],
    }
  }
}

/**
 * Load keybindings synchronously (for initial render).
 * Uses cached value if available.
 */
// loadKeybindingsSync 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadKeybindingsSync(): ParsedBinding[] {
  // 满足 `cachedBindings` 时，load User Bindings执行该分支。
  if (cachedBindings) {
    // 返回 `cachedBindings`，作为load User Bindings这次计算的结果。
    return cachedBindings
  }

  // 结果读取`loadKeybindingsSyncWithWarnings`，供load User Bindings后续处理使用。
  const result = loadKeybindingsSyncWithWarnings()
  // 返回 `result.bindings`，作为load User Bindings这次计算的结果。
  return result.bindings
}

/**
 * Load keybindings synchronously with validation warnings.
 * Uses cached values if available.
 *
 * For external users, always returns default bindings only.
 * User customization is currently gated to Anthropic employees.
 */
// loadKeybindingsSyncWithWarnings 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadKeybindingsSyncWithWarnings(): KeybindingsLoadResult {
  // 满足 `cachedBindings` 时，load User Bindings执行该分支。
  if (cachedBindings) {
    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return { bindings: cachedBindings, warnings: cachedWarnings }
  }

  // defaultBindings 集合读取`getDefaultParsedBindings`，供load User Bindings后续处理使用。
  const defaultBindings = getDefaultParsedBindings()

  // Skip user config loading for external users
  // 满足 `!isKeybindingCustomizationEnabled()` 时，load User Bindings执行该分支。
  if (!isKeybindingCustomizationEnabled()) {
    // cachedBindings 缓存更新为 `defaultBindings`，确保loadUserBindings后续读取最新状态。
    cachedBindings = defaultBindings
    // cachedWarnings 缓存更新为 `[]`，确保loadUserBindings后续读取最新状态。
    cachedWarnings = []
    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return { bindings: cachedBindings, warnings: cachedWarnings }
  }

  // userPath 路径数据读取`getKeybindingsPath`，供load User Bindings后续处理使用。
  const userPath = getKeybindingsPath()

  // 保护这一段可能失败的load User Bindings操作，确保异常能进入相邻错误处理。
  try {
    // sync IO: called from sync context (React useState initializer)
    // 文本内容读取`readFileSync`，供load User Bindings后续处理使用。
    const content = readFileSync(userPath, 'utf-8')
    // 解析结果解析`jsonParse(content)` 整理出中间结果，供load User Bindings后续步骤使用。
    const parsed: unknown = jsonParse(content)

    // Extract bindings array from object wrapper format: { "bindings": [...] }
    // userBlocks 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let userBlocks: unknown
    // `typeof parsed === 'object' && parsed` 与 `null &&` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof parsed === 'object' && parsed !== null && 'bindings' in parsed) {
      // userBlocks 集合更新为 `(parsed as { bindings: unknown }).bindings`，确保loadUserBindings后续读取最新状态。
      userBlocks = (parsed as { bindings: unknown }).bindings
    } else {
      // Invalid format - missing bindings property
      // cachedBindings 缓存更新为 `defaultBindings`，确保loadUserBindings后续读取最新状态。
      cachedBindings = defaultBindings
      // cachedWarnings 缓存更新为 `[`，确保loadUserBindings后续读取最新状态。
      cachedWarnings = [
        {
          type: 'parse_error',
          severity: 'error',
          message: 'keybindings.json must have a "bindings" array',
          suggestion: 'Use format: { "bindings": [ ... ] }',
        },
      ]
      // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
      return { bindings: cachedBindings, warnings: cachedWarnings }
    }

    // Validate structure - bindings must be an array of valid keybinding blocks
    // 满足 `!isKeybindingBlockArray(userBlocks)` 时，load User Bindings执行该分支。
    if (!isKeybindingBlockArray(userBlocks)) {
      // errorMessage 消息数据保存`Array.isArray`，供load User Bindings后续处理使用。
      const errorMessage = !Array.isArray(userBlocks)
        ? '"bindings" must be an array'
        : 'keybindings.json contains invalid block structure'
      // suggestion保存`Array.isArray`，供load User Bindings后续处理使用。
      const suggestion = !Array.isArray(userBlocks)
        ? 'Set "bindings" to an array of keybinding blocks'
        : 'Each block must have "context" (string) and "bindings" (object)'
      // cachedBindings 缓存更新为 `defaultBindings`，确保loadUserBindings后续读取最新状态。
      cachedBindings = defaultBindings
      // cachedWarnings 缓存更新为 `[`，确保loadUserBindings后续读取最新状态。
      cachedWarnings = [
        {
          type: 'parse_error',
          severity: 'error',
          message: errorMessage,
          suggestion,
        },
      ]
      // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
      return { bindings: cachedBindings, warnings: cachedWarnings }
    }

    // userParsed解析`parseBindings`，供load User Bindings后续处理使用。
    const userParsed = parseBindings(userBlocks)
    // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[keybindings] Loaded ${userParsed.length} user bindings from ${userPath}`,
    )
    // cachedBindings 缓存更新为 `[...defaultBindings, ...userParsed]`，确保loadUserBindings后续读取最新状态。
    cachedBindings = [...defaultBindings, ...userParsed]

    // 调用 logCustomBindingsLoadedOncePerDay，触发load User Bindings此处需要的副作用。
    logCustomBindingsLoadedOncePerDay(userParsed.length)

    // Run validation - check for duplicate keys in raw JSON first
    // duplicateKeyWarnings 警告信息读取`checkDuplicateKeysInJson`，供load User Bindings后续处理使用。
    const duplicateKeyWarnings = checkDuplicateKeysInJson(content)
    // cachedWarnings 缓存更新为 `[`，确保loadUserBindings后续读取最新状态。
    cachedWarnings = [
      ...duplicateKeyWarnings,
      ...validateBindings(userBlocks, cachedBindings),
    ]
    // 满足 `cachedWarnings.length > 0` 时，load User Bindings执行该分支。
    if (cachedWarnings.length > 0) {
      // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[keybindings] Found ${cachedWarnings.length} validation issue(s)`,
      )
    }

    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return { bindings: cachedBindings, warnings: cachedWarnings }
  } catch {
    // File doesn't exist or error - use defaults (user can run /keybindings to create)
    // cachedBindings 缓存更新为 `defaultBindings`，确保loadUserBindings后续读取最新状态。
    cachedBindings = defaultBindings
    // cachedWarnings 缓存更新为 `[]`，确保loadUserBindings后续读取最新状态。
    cachedWarnings = []
    // 返回结构化结果，集中表达load User Bindings已经整理出的状态。
    return { bindings: cachedBindings, warnings: cachedWarnings }
  }
}

/**
 * Initialize file watching for keybindings.json.
 * Call this once when the app starts.
 *
 * For external users, this is a no-op since user customization is disabled.
 */
// initializeKeybindingWatcher 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initializeKeybindingWatcher(): Promise<void> {
  // 组合条件 `initialized || disposed` 成立时，load User Bindings才启用这条专门路径。
  if (initialized || disposed) return

  // Skip file watching for external users
  // 满足 `!isKeybindingCustomizationEnabled()` 时，load User Bindings执行该分支。
  if (!isKeybindingCustomizationEnabled()) {
    // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[keybindings] Skipping file watcher - user customization disabled',
    )
    // load User Bindings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // userPath 路径数据读取`getKeybindingsPath`，供load User Bindings后续处理使用。
  const userPath = getKeybindingsPath()
  // watchDir保存`dirname`，供load User Bindings后续处理使用。
  const watchDir = dirname(userPath)

  // Only watch if parent directory exists
  // 保护这一段可能失败的load User Bindings操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供load User Bindings后续处理使用。
    const stats = await stat(watchDir)
    // 满足 `!stats.isDirectory()` 时，load User Bindings执行该分支。
    if (!stats.isDirectory()) {
      // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[keybindings] Not watching: ${watchDir} is not a directory`,
      )
      // load User Bindings在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  } catch {
    // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[keybindings] Not watching: ${watchDir} does not exist`)
    // load User Bindings在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Set initialized only after we've confirmed we can watch
  // initialized更新为 `true`，确保loadUserBindings后续读取最新状态。
  initialized = true

  // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[keybindings] Watching for changes to ${userPath}`)

  // watcher更新为 `chokidar.watch(userPath, {`，确保loadUserBindings后续读取最新状态。
  watcher = chokidar.watch(userPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: FILE_STABILITY_THRESHOLD_MS,
      pollInterval: FILE_STABILITY_POLL_INTERVAL_MS,
    },
    ignorePermissionErrors: true,
    usePolling: false,
    atomic: true,
  })

  // 调用 watcher.on，触发load User Bindings此处需要的副作用。
  watcher.on('add', handleChange)
  // 调用 watcher.on，触发load User Bindings此处需要的副作用。
  watcher.on('change', handleChange)
  // 调用 watcher.on，触发load User Bindings此处需要的副作用。
  watcher.on('unlink', handleDelete)

  // Register cleanup
  // 调用 registerCleanup，触发load User Bindings此处需要的副作用。
  registerCleanup(async () => disposeKeybindingWatcher())
}

/**
 * Clean up the file watcher.
 */
// disposeKeybindingWatcher 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function disposeKeybindingWatcher(): void {
  // disposed更新为 `true`，确保loadUserBindings后续读取最新状态。
  disposed = true
  // 满足 `watcher` 时，load User Bindings执行该分支。
  if (watcher) {
    // 显式忽略 `watcher.close()` 的返回值，只保留它触发的副作用。
    void watcher.close()
    // watcher更新为 `null`，确保loadUserBindings后续读取最新状态。
    watcher = null
  }
  // 调用 keybindingsChanged.clear，触发load User Bindings此处需要的副作用。
  keybindingsChanged.clear()
}

/**
 * Subscribe to keybinding changes.
 * The listener receives the new parsed bindings when the file changes.
 */
// subscribeToKeybindingChanges 集合保存`keybindingsChanged.subscribe`，供load User Bindings后续判断或输出使用。
export const subscribeToKeybindingChanges = keybindingsChanged.subscribe

// handleChange 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleChange(path: string): Promise<void> {
  // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[keybindings] Detected change to ${path}`)

  // 保护这一段可能失败的load User Bindings操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`loadKeybindings`，供load User Bindings后续处理使用。
    const result = await loadKeybindings()
    // cachedBindings 缓存更新为 `result.bindings`，确保loadUserBindings后续读取最新状态。
    cachedBindings = result.bindings
    // cachedWarnings 缓存更新为 `result.warnings`，确保loadUserBindings后续读取最新状态。
    cachedWarnings = result.warnings

    // Notify all listeners with the full result
    // 调用 keybindingsChanged.emit，触发load User Bindings此处需要的副作用。
    keybindingsChanged.emit(result)
  } catch (error) {
    // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[keybindings] Error reloading: ${errorMessage(error)}`)
  }
}

// handleDelete 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleDelete(path: string): void {
  // 记录load User Bindings运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[keybindings] Detected deletion of ${path}`)

  // Reset to defaults when file is deleted
  // defaultBindings 集合读取`getDefaultParsedBindings`，供load User Bindings后续处理使用。
  const defaultBindings = getDefaultParsedBindings()
  // cachedBindings 缓存更新为 `defaultBindings`，确保loadUserBindings后续读取最新状态。
  cachedBindings = defaultBindings
  // cachedWarnings 缓存更新为 `[]`，确保loadUserBindings后续读取最新状态。
  cachedWarnings = []

  // 调用 keybindingsChanged.emit，触发load User Bindings此处需要的副作用。
  keybindingsChanged.emit({ bindings: defaultBindings, warnings: [] })
}

/**
 * Get the cached keybinding warnings.
 * Returns empty array if no warnings or bindings haven't been loaded yet.
 */
// getCachedKeybindingWarnings 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedKeybindingWarnings(): KeybindingWarning[] {
  // 返回 `cachedWarnings`，作为load User Bindings这次计算的结果。
  return cachedWarnings
}

/**
 * Reset internal state for testing.
 */
// resetKeybindingLoaderForTesting 封装loadUserBindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetKeybindingLoaderForTesting(): void {
  // initialized更新为 `false`，确保loadUserBindings后续读取最新状态。
  initialized = false
  // disposed更新为 `false`，确保loadUserBindings后续读取最新状态。
  disposed = false
  // cachedBindings 缓存更新为 `null`，确保loadUserBindings后续读取最新状态。
  cachedBindings = null
  // cachedWarnings 缓存更新为 `[]`，确保loadUserBindings后续读取最新状态。
  cachedWarnings = []
  // lastCustomBindingsLogDate更新为 `null`，确保loadUserBindings后续读取最新状态。
  lastCustomBindingsLogDate = null
  // 满足 `watcher` 时，load User Bindings执行该分支。
  if (watcher) {
    // 显式忽略 `watcher.close()` 的返回值，只保留它触发的副作用。
    void watcher.close()
    // watcher更新为 `null`，确保loadUserBindings后续读取最新状态。
    watcher = null
  }
  // 调用 keybindingsChanged.clear，触发load User Bindings此处需要的副作用。
  keybindingsChanged.clear()
}
