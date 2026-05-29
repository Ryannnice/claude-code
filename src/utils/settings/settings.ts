// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 mergeWith，将 lodash-es/mergeWith.js 中已经封装好的能力接到本文件流程里。
import mergeWith from 'lodash-es/mergeWith.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join, resolve } from 'path'
// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getFlagSettingsInline,
  getFlagSettingsPath,
  getOriginalCwd,
  getUseCoworkPlugins,
} from '../../bootstrap/state.js'
// 接入 getRemoteManagedSettingsSyncFromCache 服务层能力，把外部通信或共享状态交给 ../../services/remoteManagedSettings/syncCacheState.js 处理。
import { getRemoteManagedSettingsSyncFromCache } from '../../services/remoteManagedSettings/syncCacheState.js'
// 引入 uniq，将 ../array.js 中已经封装好的能力接到本文件流程里。
import { uniq } from '../array.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 logForDiagnosticsNoPII，将 ../diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from '../diagLogs.js'
// 引入 getClaudeConfigHomeDir、isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { getClaudeConfigHomeDir, isEnvTruthy } from '../envUtils.js'
// 引入 getErrnoCode、isENOENT，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { getErrnoCode, isENOENT } from '../errors.js'
// 引入 writeFileSyncAndFlush_DEPRECATED，将 ../file.js 中已经封装好的能力接到本文件流程里。
import { writeFileSyncAndFlush_DEPRECATED } from '../file.js'
// 引入 readFileSync，将 ../fileRead.js 中已经封装好的能力接到本文件流程里。
import { readFileSync } from '../fileRead.js'
// 引入 getFsImplementation、safeResolvePath，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation, safeResolvePath } from '../fsOperations.js'
// 引入 addFileGlobRuleToGitignore，将 ../git/gitignore.js 中已经封装好的能力接到本文件流程里。
import { addFileGlobRuleToGitignore } from '../git/gitignore.js'
// 引入 safeParseJSON，将 ../json.js 中已经封装好的能力接到本文件流程里。
import { safeParseJSON } from '../json.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 getPlatform，将 ../platform.js 中已经封装好的能力接到本文件流程里。
import { getPlatform } from '../platform.js'
// 引入 clone、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { clone, jsonStringify } from '../slowOperations.js'
// 引入 profileCheckpoint，将 ../startupProfiler.js 中已经封装好的能力接到本文件流程里。
import { profileCheckpoint } from '../startupProfiler.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type EditableSettingSource,
  getEnabledSettingSources,
  type SettingSource,
} from './constants.js'
// 引入 markInternalWrite，将 ./internalWrites.js 中已经封装好的能力接到本文件流程里。
import { markInternalWrite } from './internalWrites.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getManagedFilePath,
  getManagedSettingsDropInDir,
} from './managedPath.js'
// 引入 getHkcuSettings、getMdmSettings，将 ./mdm/settings.js 中已经封装好的能力接到本文件流程里。
import { getHkcuSettings, getMdmSettings } from './mdm/settings.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCachedParsedFile,
  getCachedSettingsForSource,
  getPluginSettingsBase,
  getSessionSettingsCache,
  resetSettingsCache,
  setCachedParsedFile,
  setCachedSettingsForSource,
  setSessionSettingsCache,
} from './settingsCache.js'
// 引入 SettingsJson、SettingsSchema，将 ./types.js 中已经封装好的能力接到本文件流程里。
import { type SettingsJson, SettingsSchema } from './types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  filterInvalidPermissionRules,
  formatZodError,
  type SettingsWithErrors,
  type ValidationError,
} from './validation.js'

/**
 * Get the path to the managed settings file based on the current platform
 */
// getManagedSettingsFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getManagedSettingsFilePath(): string {
  // 返回 `join(getManagedFilePath(), 'managed-settings.json')`，作为共享工具这次计算的结果。
  return join(getManagedFilePath(), 'managed-settings.json')
}

/**
 * Load file-based managed settings: managed-settings.json + managed-settings.d/*.json.
 *
 * managed-settings.json is merged first (lowest precedence / base), then drop-in
 * files are sorted alphabetically and merged on top (higher precedence, later
 * files win). This matches the systemd/sudoers drop-in convention: the base
 * file provides defaults, drop-ins customize. Separate teams can ship
 * independent policy fragments (e.g. 10-otel.json, 20-security.json) without
 * coordinating edits to a single admin-owned file.
 *
 * Exported for testing.
 */
// loadManagedFileSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadManagedFileSettings(): {
  settings: SettingsJson | null
  errors: ValidationError[]
} {
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: ValidationError[] = []
  // merged 从空对象开始收集键值，后续按名称补齐内容。
  let merged: SettingsJson = {}
  // found标记共享工具 settings是否启用对应路径。
  let found = false

  // 从 `parseSettingsFile(` 解构 settings、errors，减少共享工具 settings对同一对象的重复访问。
  const { settings, errors: baseErrors } = parseSettingsFile(
    getManagedSettingsFilePath(),
  )
  // 错误列表追加新条目，保持收集顺序与输入顺序一致。
  errors.push(...baseErrors)
  // 只有 `settings && Object.keys(settings).length > 0` 满足时，共享工具才执行该分支。
  if (settings && Object.keys(settings).length > 0) {
    // merged更新为 `mergeWith(merged, settings, settingsMergeCustomizer)`，确保共享工具后续读取最新状态。
    merged = mergeWith(merged, settings, settingsMergeCustomizer)
    // found更新为 `true`，确保共享工具后续读取最新状态。
    found = true
  }

  // dropInDir读取`getManagedSettingsDropInDir`，供共享工具后续处理使用。
  const dropInDir = getManagedSettingsDropInDir()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // entries 集合读取`getFsImplementation`，供共享工具后续处理使用。
    const entries = getFsImplementation()
      .readdirSync(dropInDir)
      .filter(
        // d更新为 `>`，确保共享工具后续读取最新状态。
        d =>
          (d.isFile() || d.isSymbolicLink()) &&
          d.name.endsWith('.json') &&
          !d.name.startsWith('.'),
      )
      // 链式调用 map，继续加工上一行在共享工具中产生的数据。
      .map(d => d.name)
      .sort()
    // 按顺序遍历 `entries` 中的名称，逐个交给共享工具处理。
    for (const name of entries) {
      // 从 `parseSettingsFile(` 解构 settings、errors，减少共享工具 settings对同一对象的重复访问。
      const { settings, errors: fileErrors } = parseSettingsFile(
        join(dropInDir, name),
      )
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(...fileErrors)
      // 只有 `settings && Object.keys(settings).length > 0` 满足时，共享工具才执行该分支。
      if (settings && Object.keys(settings).length > 0) {
        // merged更新为 `mergeWith(merged, settings, settingsMergeCustomizer)`，确保共享工具后续读取最新状态。
        merged = mergeWith(merged, settings, settingsMergeCustomizer)
        // found更新为 `true`，确保共享工具后续读取最新状态。
        found = true
      }
    }
  } catch (e) {
    // code读取`getErrnoCode`，供共享工具后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT' && code !== 'ENOTDIR'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT' && code !== 'ENOTDIR') {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { settings: found ? merged : null, errors }
}

/**
 * Check which file-based managed settings sources are present.
 * Used by /status to show "(file)", "(drop-ins)", or "(file + drop-ins)".
 */
// getManagedFileSettingsPresence 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getManagedFileSettingsPresence(): {
  hasBase: boolean
  hasDropIns: boolean
} {
  // 从 `parseSettingsFile(getManagedSettingsFilePath())` 解构 settings，减少共享工具 settings对同一对象的重复访问。
  const { settings: base } = parseSettingsFile(getManagedSettingsFilePath())
  // hasBase记录 `Object.keys` 是否成立，共享工具随后按该结果分支。
  const hasBase = !!base && Object.keys(base).length > 0

  // hasDropIns 集合标记共享工具 settings是否启用对应路径。
  let hasDropIns = false
  // dropInDir读取`getManagedSettingsDropInDir`，供共享工具后续处理使用。
  const dropInDir = getManagedSettingsDropInDir()
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // hasDropIns 集合更新为 `getFsImplementation()`，确保共享工具后续读取最新状态。
    hasDropIns = getFsImplementation()
      .readdirSync(dropInDir)
      .some(
        // d更新为 `>`，确保共享工具后续读取最新状态。
        d =>
          (d.isFile() || d.isSymbolicLink()) &&
          d.name.endsWith('.json') &&
          !d.name.startsWith('.'),
      )
  } catch {
    // dir doesn't exist
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { hasBase, hasDropIns }
}

/**
 * Handles file system errors appropriately
 * @param error The error to handle
 * @param path The file path that caused the error
 */
// handleFileSystemError 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleFileSystemError(error: unknown, path: string): void {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    error.code === 'ENOENT'
  ) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Broken symlink or missing file encountered for settings.json at path: ${path}`,
    )
  } else {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}

/**
 * Parses a settings file into a structured format
 * @param path The path to the permissions file
 * @param source The source of the settings (optional, for error reporting)
 * @returns Parsed settings data and validation errors
 */
// parseSettingsFile 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSettingsFile(path: string): {
  settings: SettingsJson | null
  errors: ValidationError[]
} {
  // cached 缓存读取`getCachedParsedFile`，供共享工具后续处理使用。
  const cached = getCachedParsedFile(path)
  // 满足 `cached` 时，共享工具执行该分支。
  if (cached) {
    // Clone so callers (e.g. mergeWith in getSettingsForSourceUncached,
    // updateSettingsForSource) can't mutate the cached entry.
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      settings: cached.settings ? clone(cached.settings) : null,
      errors: cached.errors,
    }
  }
  // 结果解析`parseSettingsFileUncached`，供共享工具后续处理使用。
  const result = parseSettingsFileUncached(path)
  // setCachedParsedFile 写入新的状态值，使共享工具后续读取保持一致。
  setCachedParsedFile(path, result)
  // Clone the first return too — the caller may mutate before
  // another caller reads the same cache entry.
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    settings: result.settings ? clone(result.settings) : null,
    errors: result.errors,
  }
}

// parseSettingsFileUncached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseSettingsFileUncached(path: string): {
  settings: SettingsJson | null
  errors: ValidationError[]
} {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `safeResolvePath(getFsImplementation(), path)` 解构 resolvedPath，减少共享工具 settings对同一对象的重复访问。
    const { resolvedPath } = safeResolvePath(getFsImplementation(), path)
    // 文本内容读取`readFileSync`，供共享工具后续处理使用。
    const content = readFileSync(resolvedPath)

    // 满足 `content.trim() === ''` 时，共享工具执行该分支。
    if (content.trim() === '') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { settings: {}, errors: [] }
    }

    // data保存`safeParseJSON`，供共享工具后续处理使用。
    const data = safeParseJSON(content, false)

    // Filter invalid permission rules before schema validation so one bad
    // rule doesn't cause the entire settings file to be rejected.
    // ruleWarnings 警告信息筛选`filterInvalidPermissionRules`，供共享工具后续处理使用。
    const ruleWarnings = filterInvalidPermissionRules(data, path)

    // 结果保存`SettingsSchema`，供共享工具后续处理使用。
    const result = SettingsSchema().safeParse(data)

    // result.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result.success) {
      // 错误列表格式化`formatZodError`，供共享工具后续处理使用。
      const errors = formatZodError(result.error, path)
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { settings: null, errors: [...ruleWarnings, ...errors] }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { settings: result.data, errors: ruleWarnings }
  } catch (error) {
    // 调用 handleFileSystemError，触发共享工具此处需要的副作用。
    handleFileSystemError(error, path)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { settings: null, errors: [] }
  }
}

/**
 * Get the absolute path to the associated file root for a given settings source
 * (e.g. for $PROJ_DIR/.claude/settings.json, returns $PROJ_DIR)
 * @param source The source of the settings
 * @returns The root path of the settings file
 */
// getSettingsRootPathForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsRootPathForSource(source: SettingSource): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `resolve(getClaudeConfigHomeDir())`，作为共享工具这次计算的结果。
      return resolve(getClaudeConfigHomeDir())
    case 'policySettings':
    case 'projectSettings':
    case 'localSettings': {
      // 返回 `resolve(getOriginalCwd())`，作为共享工具这次计算的结果。
      return resolve(getOriginalCwd())
    }
    case 'flagSettings': {
      // 路径读取`getFlagSettingsPath`，供共享工具后续处理使用。
      const path = getFlagSettingsPath()
      // 返回 `path ? dirname(resolve(path)) : resolve(getOriginalCwd())`，作为共享工具这次计算的结果。
      return path ? dirname(resolve(path)) : resolve(getOriginalCwd())
    }
  }
}

/**
 * Get the user settings filename based on cowork mode.
 * Returns 'cowork_settings.json' when in cowork mode, 'settings.json' otherwise.
 *
 * Priority:
 * 1. Session state (set by CLI flag --cowork)
 * 2. Environment variable CLAUDE_CODE_USE_COWORK_PLUGINS
 * 3. Default: 'settings.json'
 */
// getUserSettingsFilePath 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUserSettingsFilePath(): string {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    getUseCoworkPlugins() ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS)
  ) {
    // 返回 `'cowork_settings.json'`，作为共享工具这次计算的结果。
    return 'cowork_settings.json'
  }
  // 返回 `'settings.json'`，作为共享工具这次计算的结果。
  return 'settings.json'
}

// getSettingsFilePathForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsFilePathForSource(
  source: SettingSource,
): string | undefined {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `join(`，作为共享工具这次计算的结果。
      return join(
        getSettingsRootPathForSource(source),
        getUserSettingsFilePath(),
      )
    case 'projectSettings':
    case 'localSettings': {
      // 返回 `join(`，作为共享工具这次计算的结果。
      return join(
        getSettingsRootPathForSource(source),
        getRelativeSettingsFilePathForSource(source),
      )
    }
    case 'policySettings':
      // 返回 `getManagedSettingsFilePath()`，作为共享工具这次计算的结果。
      return getManagedSettingsFilePath()
    case 'flagSettings': {
      // 返回 `getFlagSettingsPath()`，作为共享工具这次计算的结果。
      return getFlagSettingsPath()
    }
  }
}

// getRelativeSettingsFilePathForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRelativeSettingsFilePathForSource(
  source: 'projectSettings' | 'localSettings',
): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'projectSettings':
      // 返回 `join('.claude', 'settings.json')`，作为共享工具这次计算的结果。
      return join('.claude', 'settings.json')
    case 'localSettings':
      // 返回 `join('.claude', 'settings.local.json')`，作为共享工具这次计算的结果。
      return join('.claude', 'settings.local.json')
  }
}

// getSettingsForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsForSource(
  source: SettingSource,
): SettingsJson | null {
  // cached 缓存读取`getCachedSettingsForSource`，供共享工具后续处理使用。
  const cached = getCachedSettingsForSource(source)
  // `cached` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== undefined) return cached
  // 结果读取`getSettingsForSourceUncached`，供共享工具后续处理使用。
  const result = getSettingsForSourceUncached(source)
  // setCachedSettingsForSource 写入新的状态值，使共享工具后续读取保持一致。
  setCachedSettingsForSource(source, result)
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

// getSettingsForSourceUncached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSettingsForSourceUncached(
  source: SettingSource,
): SettingsJson | null {
  // For policySettings: first source wins (remote > HKLM/plist > file > HKCU)
  // 当 `source` 匹配 `'policySettings'` 时，共享工具执行对应分支。
  if (source === 'policySettings') {
    // remoteSettings 集合读取`getRemoteManagedSettingsSyncFromCache`，供共享工具后续处理使用。
    const remoteSettings = getRemoteManagedSettingsSyncFromCache()
    // 只有 `remoteSettings && Object.keys(remoteSettings).length > 0` 满足时，共享工具才执行该分支。
    if (remoteSettings && Object.keys(remoteSettings).length > 0) {
      // 返回 `remoteSettings`，作为共享工具这次计算的结果。
      return remoteSettings
    }

    // mdmResult读取`getMdmSettings`，供共享工具后续处理使用。
    const mdmResult = getMdmSettings()
    // 满足 `Object.keys(mdmResult.settings).length > 0` 时，共享工具执行该分支。
    if (Object.keys(mdmResult.settings).length > 0) {
      // 返回 `mdmResult.settings`，作为共享工具这次计算的结果。
      return mdmResult.settings
    }

    // 从 `loadManagedFileSettings()` 解构 settings，减少共享工具 settings对同一对象的重复访问。
    const { settings: fileSettings } = loadManagedFileSettings()
    // 满足 `fileSettings` 时，共享工具执行该分支。
    if (fileSettings) {
      // 返回 `fileSettings`，作为共享工具这次计算的结果。
      return fileSettings
    }

    // hkcu读取`getHkcuSettings`，供共享工具后续处理使用。
    const hkcu = getHkcuSettings()
    // 满足 `Object.keys(hkcu.settings).length > 0` 时，共享工具执行该分支。
    if (Object.keys(hkcu.settings).length > 0) {
      // 返回 `hkcu.settings`，作为共享工具这次计算的结果。
      return hkcu.settings
    }

    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // settingsFilePath 路径数据读取`getSettingsFilePathForSource`，供共享工具后续处理使用。
  const settingsFilePath = getSettingsFilePathForSource(source)
  // 从 `settingsFilePath` 解构 settings，减少共享工具 settings对同一对象的重复访问。
  const { settings: fileSettings } = settingsFilePath
    ? parseSettingsFile(settingsFilePath)
    : { settings: null }

  // For flagSettings, merge in any inline settings set via the SDK
  // 当 `source` 匹配 `'flagSettings'` 时，共享工具执行对应分支。
  if (source === 'flagSettings') {
    // inlineSettings 集合读取`getFlagSettingsInline`，供共享工具后续处理使用。
    const inlineSettings = getFlagSettingsInline()
    // 满足 `inlineSettings` 时，共享工具执行该分支。
    if (inlineSettings) {
      // 解析结果保存`SettingsSchema`，供共享工具后续处理使用。
      const parsed = SettingsSchema().safeParse(inlineSettings)
      // 满足 `parsed.success` 时，共享工具执行该分支。
      if (parsed.success) {
        // 返回 `mergeWith(`，作为共享工具这次计算的结果。
        return mergeWith(
          fileSettings || {},
          parsed.data,
          settingsMergeCustomizer,
        ) as SettingsJson
      }
    }
  }

  // 返回 `fileSettings`，作为共享工具这次计算的结果。
  return fileSettings
}

/**
 * Get the origin of the highest-priority active policy settings source.
 * Uses "first source wins" — returns the first source that has content.
 * Priority: remote > plist/hklm > file (managed-settings.json) > hkcu
 */
// getPolicySettingsOrigin 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPolicySettingsOrigin():
  | 'remote'
  | 'plist'
  | 'hklm'
  | 'file'
  | 'hkcu'
  | null {
  // 1. Remote (highest)
  // remoteSettings 集合读取`getRemoteManagedSettingsSyncFromCache`，供共享工具后续处理使用。
  const remoteSettings = getRemoteManagedSettingsSyncFromCache()
  // 只有 `remoteSettings && Object.keys(remoteSettings).length > 0` 满足时，共享工具才执行该分支。
  if (remoteSettings && Object.keys(remoteSettings).length > 0) {
    // 返回 `'remote'`，作为共享工具这次计算的结果。
    return 'remote'
  }

  // 2. Admin-only MDM (HKLM / macOS plist)
  // mdmResult读取`getMdmSettings`，供共享工具后续处理使用。
  const mdmResult = getMdmSettings()
  // 满足 `Object.keys(mdmResult.settings).length > 0` 时，共享工具执行该分支。
  if (Object.keys(mdmResult.settings).length > 0) {
    // 返回 `getPlatform() === 'macos' ? 'plist' : 'hklm'`，作为共享工具这次计算的结果。
    return getPlatform() === 'macos' ? 'plist' : 'hklm'
  }

  // 3. managed-settings.json + managed-settings.d/ (file-based, requires admin)
  // 从 `loadManagedFileSettings()` 解构 settings，减少共享工具 settings对同一对象的重复访问。
  const { settings: fileSettings } = loadManagedFileSettings()
  // 满足 `fileSettings` 时，共享工具执行该分支。
  if (fileSettings) {
    // 返回 `'file'`，作为共享工具这次计算的结果。
    return 'file'
  }

  // 4. HKCU (lowest — user-writable)
  // hkcu读取`getHkcuSettings`，供共享工具后续处理使用。
  const hkcu = getHkcuSettings()
  // 满足 `Object.keys(hkcu.settings).length > 0` 时，共享工具执行该分支。
  if (Object.keys(hkcu.settings).length > 0) {
    // 返回 `'hkcu'`，作为共享工具这次计算的结果。
    return 'hkcu'
  }

  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}

/**
 * Merges `settings` into the existing settings for `source` using lodash mergeWith.
 *
 * To delete a key from a record field (e.g. enabledPlugins, extraKnownMarketplaces),
 * set it to `undefined` — do NOT use `delete`. mergeWith only detects deletion when
 * the key is present with an explicit `undefined` value.
 */
// updateSettingsForSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateSettingsForSource(
  source: EditableSettingSource,
  settings: SettingsJson,
): { error: Error | null } {
  // 共享工具在这里按实际状态进入对应分支。
  if (
    (source as unknown) === 'policySettings' ||
    (source as unknown) === 'flagSettings'
  ) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { error: null }
  }

  // Create the folder if needed
  // 文件路径读取`getSettingsFilePathForSource`，供共享工具后续处理使用。
  const filePath = getSettingsFilePathForSource(source)
  // 文件路径缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!filePath) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { error: null }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 调用 getFsImplementation，触发共享工具此处需要的副作用。
    getFsImplementation().mkdirSync(dirname(filePath))

    // Try to get existing settings with validation. Bypass the per-source
    // cache — mergeWith below mutates its target (including nested refs),
    // and mutating the cached object would leak unpersisted state if the
    // write fails before resetSettingsCache().
    // existingSettings 集合读取`getSettingsForSourceUncached`，供共享工具后续处理使用。
    let existingSettings = getSettingsForSourceUncached(source)

    // If validation failed, check if file exists with a JSON syntax error
    // existingSettings 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!existingSettings) {
      // 文本内容保存`null`，作为后续空值处理的输入。
      let content: string | null = null
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 文本内容更新为 `readFileSync(filePath)`，确保共享工具后续读取最新状态。
        content = readFileSync(filePath)
      } catch (e) {
        // 满足 `!isENOENT(e)` 时，共享工具执行该分支。
        if (!isENOENT(e)) {
          // 抛出 e，阻止共享工具在无效状态下继续运行。
          throw e
        }
        // File doesn't exist — fall through to merge with empty settings
      }
      // `content` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (content !== null) {
        // rawData保存`safeParseJSON`，供共享工具后续处理使用。
        const rawData = safeParseJSON(content)
        // 满足 `rawData === null` 时，共享工具执行该分支。
        if (rawData === null) {
          // JSON syntax error - return validation error instead of overwriting
          // safeParseJSON will already log the error, so we'll just return the error here
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return {
            error: new Error(
              `Invalid JSON syntax in settings file at ${filePath}`,
            ),
          }
        }
        // 当 `rawData && typeof rawData` 匹配 `'object'` 时，共享工具执行对应分支。
        if (rawData && typeof rawData === 'object') {
          // existingSettings 集合更新为 `rawData as SettingsJson`，确保共享工具后续读取最新状态。
          existingSettings = rawData as SettingsJson
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Using raw settings from ${filePath} due to validation failure`,
          )
        }
      }
    }

    // updatedSettings 集合保存`mergeWith`，供共享工具后续处理使用。
    const updatedSettings = mergeWith(
      existingSettings || {},
      settings,
      // 共享工具 settings在这里处理 `(`，完成这一小步状态转换。
      (
        _objValue: unknown,
        srcValue: unknown,
        key: string | number | symbol,
        object: Record<string | number | symbol, unknown>,
      ) => {
        // Handle undefined as deletion
        // 只有 `srcValue === undefined && object && typeof key ==` 满足时，共享工具才执行该分支。
        if (srcValue === undefined && object && typeof key === 'string') {
          // 共享工具 settings在这里处理 `delete object[key]`，完成这一小步状态转换。
          delete object[key]
          // 返回 `undefined`，作为共享工具这次计算的结果。
          return undefined
        }
        // For arrays, always replace with the provided array
        // This puts the responsibility on the caller to compute the desired final state
        // 满足 `Array.isArray(srcValue)` 时，共享工具执行该分支。
        if (Array.isArray(srcValue)) {
          // 返回 `srcValue`，作为共享工具这次计算的结果。
          return srcValue
        }
        // For non-arrays, let lodash handle the default merge behavior
        // 返回 `undefined`，作为共享工具这次计算的结果。
        return undefined
      },
    )

    // Mark this as an internal write before writing the file
    // 调用 markInternalWrite，触发共享工具此处需要的副作用。
    markInternalWrite(filePath)

    // 调用 writeFileSyncAndFlush_DEPRECATED，触发共享工具此处需要的副作用。
    writeFileSyncAndFlush_DEPRECATED(
      filePath,
      jsonStringify(updatedSettings, null, 2) + '\n',
    )

    // Invalidate the session cache since settings have been updated
    // 调用 resetSettingsCache，触发共享工具此处需要的副作用。
    resetSettingsCache()

    // 当 `source` 匹配 `'localSettings'` 时，共享工具执行对应分支。
    if (source === 'localSettings') {
      // Okay to add to gitignore async without awaiting
      // 显式忽略 `addFileGlobRuleToGitignore(` 的返回值，只保留它触发的副作用。
      void addFileGlobRuleToGitignore(
        getRelativeSettingsFilePathForSource('localSettings'),
        getOriginalCwd(),
      )
    }
  } catch (e) {
    // 错误保存`Error`，供共享工具后续处理使用。
    const error = new Error(
      `Failed to read raw settings from ${filePath}: ${e}`,
    )
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { error }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { error: null }
}

/**
 * Custom merge function for arrays - concatenate and deduplicate
 */
// mergeArrays 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mergeArrays<T>(targetArray: T[], sourceArray: T[]): T[] {
  // 返回 `uniq([...targetArray, ...sourceArray])`，作为共享工具这次计算的结果。
  return uniq([...targetArray, ...sourceArray])
}

/**
 * Custom merge function for lodash mergeWith when merging settings.
 * Arrays are concatenated and deduplicated; other values use default lodash merge behavior.
 * Exported for testing.
 */
// settingsMergeCustomizer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function settingsMergeCustomizer(
  objValue: unknown,
  srcValue: unknown,
): unknown {
  // 只有 `Array.isArray(objValue) && Array.isArray(srcValue)` 满足时，共享工具才执行该分支。
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    // 返回 `mergeArrays(objValue, srcValue)`，作为共享工具这次计算的结果。
    return mergeArrays(objValue, srcValue)
  }
  // Return undefined to let lodash handle default merge behavior
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Get a list of setting keys from managed settings for logging purposes.
 * For certain nested settings (permissions, sandbox, hooks), expands to show
 * one level of nesting (e.g., "permissions.allow"). For other settings,
 * returns only the top-level key.
 *
 * @param settings The settings object to extract keys from
 * @returns Sorted array of key paths
 */
// getManagedSettingsKeysForLogging 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getManagedSettingsKeysForLogging(
  settings: SettingsJson,
): string[] {
  // Use .strip() to get only valid schema keys
  // validSettings 集合保存`SettingsSchema`，供共享工具后续处理使用。
  const validSettings = SettingsSchema().strip().parse(settings) as Record<
    string,
    unknown
  >
  // keysToExpand 聚合成有序列表，保持后续遍历顺序稳定。
  const keysToExpand = ['permissions', 'sandbox', 'hooks']
  // allKeys 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const allKeys: string[] = []

  // Define valid nested keys for each nested setting we expand
  // validNestedKeys 集合 集中保存共享工具 settings要一起传递的字段。
  const validNestedKeys: Record<string, Set<string>> = {
    permissions: new Set([
      'allow',
      'deny',
      'ask',
      'defaultMode',
      'disableBypassPermissionsMode',
      ...(feature('TRANSCRIPT_CLASSIFIER') ? ['disableAutoMode'] : []),
      'additionalDirectories',
    ]),
    sandbox: new Set([
      'enabled',
      'failIfUnavailable',
      'allowUnsandboxedCommands',
      'network',
      'filesystem',
      'ignoreViolations',
      'excludedCommands',
      'autoAllowBashIfSandboxed',
      'enableWeakerNestedSandbox',
      'enableWeakerNetworkIsolation',
      'ripgrep',
    ]),
    // For hooks, we use z.record with enum keys, so we validate separately
    hooks: new Set([
      'PreToolUse',
      'PostToolUse',
      'Notification',
      'UserPromptSubmit',
      'SessionStart',
      'SessionEnd',
      'Stop',
      'SubagentStop',
      'PreCompact',
      'PostCompact',
      'TeammateIdle',
      'TaskCreated',
      'TaskCompleted',
    ]),
  }

  // 逐项读取 `Object.keys(validSettings)` 中的key，按输入顺序推进共享工具。
  for (const key of Object.keys(validSettings)) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      keysToExpand.includes(key) &&
      validSettings[key] &&
      typeof validSettings[key] === 'object'
    ) {
      // Expand nested keys for these special settings (one level deep only)
      // nestedObj读取 `validSettings[key] as Record<string, unknown>` 对应条目，后续围绕该成员继续处理。
      const nestedObj = validSettings[key] as Record<string, unknown>
      // validKeys 集合保存`validNestedKeys[key]`，供共享工具 settings后续判断或输出使用。
      const validKeys = validNestedKeys[key]

      // 满足 `validKeys` 时，共享工具执行该分支。
      if (validKeys) {
        // 逐项读取 `Object.keys(nestedObj)` 中的nestedKey，按输入顺序推进共享工具。
        for (const nestedKey of Object.keys(nestedObj)) {
          // Only include known valid nested keys
          // 满足 `validKeys.has(nestedKey)` 时，共享工具执行该分支。
          if (validKeys.has(nestedKey)) {
            // allKeys 集合追加新条目，保持收集顺序与输入顺序一致。
            allKeys.push(`${key}.${nestedKey}`)
          }
        }
      }
    } else {
      // For other settings, just use the top-level key
      // allKeys 集合追加新条目，保持收集顺序与输入顺序一致。
      allKeys.push(key)
    }
  }

  // 返回 `allKeys.sort()`，作为共享工具这次计算的结果。
  return allKeys.sort()
}

// Flag to prevent infinite recursion when loading settings
// isLoadingSettings 集合标记共享工具 settings是否启用对应路径。
let isLoadingSettings = false

/**
 * Load settings from disk without using cache
 * This is the original implementation that actually reads from files
 */
// loadSettingsFromDisk 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function loadSettingsFromDisk(): SettingsWithErrors {
  // Prevent recursive calls to loadSettingsFromDisk
  // 满足 `isLoadingSettings` 时，共享工具执行该分支。
  if (isLoadingSettings) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { settings: {}, errors: [] }
  }

  // startTime记录时间`Date.now`，供共享工具后续处理使用。
  const startTime = Date.now()
  // 调用 profileCheckpoint，触发共享工具此处需要的副作用。
  profileCheckpoint('loadSettingsFromDisk_start')
  // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
  logForDiagnosticsNoPII('info', 'settings_load_started')

  // isLoadingSettings 集合更新为 `true`，确保共享工具后续读取最新状态。
  isLoadingSettings = true
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Start with plugin settings as the lowest priority base.
    // All file-based sources (user, project, local, flag, policy) override these.
    // Plugin settings only contain allowlisted keys (e.g., agent) that are valid SettingsJson fields.
    // pluginSettings 插件数据读取`getPluginSettingsBase`，供共享工具后续处理使用。
    const pluginSettings = getPluginSettingsBase()
    // mergedSettings 集合 从空对象开始收集键值，后续按名称补齐内容。
    let mergedSettings: SettingsJson = {}
    // 满足 `pluginSettings` 时，共享工具执行该分支。
    if (pluginSettings) {
      // mergedSettings 集合更新为 `mergeWith(`，确保共享工具后续读取最新状态。
      mergedSettings = mergeWith(
        mergedSettings,
        pluginSettings,
        settingsMergeCustomizer,
      )
    }
    // allErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
    const allErrors: ValidationError[] = []
    // seenErrors 错误信息构建`new Set<string>()` 整理出中间结果，供共享工具 settings后续步骤使用。
    const seenErrors = new Set<string>()
    // seenFiles 文件数据构建`new Set<string>()` 整理出中间结果，供共享工具 settings后续步骤使用。
    const seenFiles = new Set<string>()

    // Merge settings from each source in priority order with deep merging
    // 逐项读取 `getEnabledSettingSources()` 中的source，按输入顺序推进共享工具。
    for (const source of getEnabledSettingSources()) {
      // policySettings: "first source wins" — use the highest-priority source
      // that has content. Priority: remote > HKLM/plist > managed-settings.json > HKCU
      // 当 `source` 匹配 `'policySettings'` 时，共享工具执行对应分支。
      if (source === 'policySettings') {
        // policySettings 集合初始化为空值，后续分支会在有数据时补齐。
        let policySettings: SettingsJson | null = null
        // policyErrors 错误信息 从空数组开始收集，后续循环会按处理顺序追加条目。
        const policyErrors: ValidationError[] = []

        // 1. Remote (highest priority)
        // remoteSettings 集合读取`getRemoteManagedSettingsSyncFromCache`，供共享工具后续处理使用。
        const remoteSettings = getRemoteManagedSettingsSyncFromCache()
        // 只有 `remoteSettings && Object.keys(remoteSettings).length > 0` 满足时，共享工具才执行该分支。
        if (remoteSettings && Object.keys(remoteSettings).length > 0) {
          // 结果保存`SettingsSchema`，供共享工具后续处理使用。
          const result = SettingsSchema().safeParse(remoteSettings)
          // 满足 `result.success` 时，共享工具执行该分支。
          if (result.success) {
            // policySettings 集合更新为 `result.data`，确保共享工具后续读取最新状态。
            policySettings = result.data
          } else {
            // Remote exists but is invalid — surface errors even as we fall through
            // policyErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
            policyErrors.push(
              ...formatZodError(result.error, 'remote managed settings'),
            )
          }
        }

        // 2. Admin-only MDM (HKLM / macOS plist)
        // policySettings 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!policySettings) {
          // mdmResult读取`getMdmSettings`，供共享工具后续处理使用。
          const mdmResult = getMdmSettings()
          // 满足 `Object.keys(mdmResult.settings).length > 0` 时，共享工具执行该分支。
          if (Object.keys(mdmResult.settings).length > 0) {
            // policySettings 集合更新为 `mdmResult.settings`，确保共享工具后续读取最新状态。
            policySettings = mdmResult.settings
          }
          // policyErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
          policyErrors.push(...mdmResult.errors)
        }

        // 3. managed-settings.json + managed-settings.d/ (file-based, requires admin)
        // policySettings 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!policySettings) {
          // 从 `loadManagedFileSettings()` 解构 settings、errors，减少共享工具 settings对同一对象的重复访问。
          const { settings, errors } = loadManagedFileSettings()
          // 满足 `settings` 时，共享工具执行该分支。
          if (settings) {
            // policySettings 集合更新为 `settings`，确保共享工具后续读取最新状态。
            policySettings = settings
          }
          // policyErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
          policyErrors.push(...errors)
        }

        // 4. HKCU (lowest — user-writable, only if nothing above exists)
        // policySettings 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
        if (!policySettings) {
          // hkcu读取`getHkcuSettings`，供共享工具后续处理使用。
          const hkcu = getHkcuSettings()
          // 满足 `Object.keys(hkcu.settings).length > 0` 时，共享工具执行该分支。
          if (Object.keys(hkcu.settings).length > 0) {
            // policySettings 集合更新为 `hkcu.settings`，确保共享工具后续读取最新状态。
            policySettings = hkcu.settings
          }
          // policyErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
          policyErrors.push(...hkcu.errors)
        }

        // Merge the winning policy source into the settings chain
        // 满足 `policySettings` 时，共享工具执行该分支。
        if (policySettings) {
          // mergedSettings 集合更新为 `mergeWith(`，确保共享工具后续读取最新状态。
          mergedSettings = mergeWith(
            mergedSettings,
            policySettings,
            settingsMergeCustomizer,
          )
        }
        // 按顺序遍历 `policyErrors` 中的错误，逐个交给共享工具处理。
        for (const error of policyErrors) {
          // errorKey 错误信息保存``${error.file}:${error.path}:${error.message}``，作为后续固定文本处理的输入。
          const errorKey = `${error.file}:${error.path}:${error.message}`
          // 满足 `!seenErrors.has(errorKey)` 时，共享工具执行该分支。
          if (!seenErrors.has(errorKey)) {
            // 调用 seenErrors.add，触发共享工具此处需要的副作用。
            seenErrors.add(errorKey)
            // allErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
            allErrors.push(error)
          }
        }

        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // 文件路径读取`getSettingsFilePathForSource`，供共享工具后续处理使用。
      const filePath = getSettingsFilePathForSource(source)
      // 满足 `filePath` 时，共享工具执行该分支。
      if (filePath) {
        // resolvedPath 路径数据读取`resolve`，供共享工具后续处理使用。
        const resolvedPath = resolve(filePath)

        // Skip if we've already loaded this file from another source
        // 满足 `!seenFiles.has(resolvedPath)` 时，共享工具执行该分支。
        if (!seenFiles.has(resolvedPath)) {
          // 调用 seenFiles.add，触发共享工具此处需要的副作用。
          seenFiles.add(resolvedPath)

          // 从 `parseSettingsFile(filePath)` 解构 settings、errors，减少共享工具 settings对同一对象的重复访问。
          const { settings, errors } = parseSettingsFile(filePath)

          // Add unique errors (deduplication)
          // 按顺序遍历 `errors` 中的错误，逐个交给共享工具处理。
          for (const error of errors) {
            // errorKey 错误信息保存``${error.file}:${error.path}:${error.message}``，作为后续固定文本处理的输入。
            const errorKey = `${error.file}:${error.path}:${error.message}`
            // 满足 `!seenErrors.has(errorKey)` 时，共享工具执行该分支。
            if (!seenErrors.has(errorKey)) {
              // 调用 seenErrors.add，触发共享工具此处需要的副作用。
              seenErrors.add(errorKey)
              // allErrors 错误信息追加新条目，保持收集顺序与输入顺序一致。
              allErrors.push(error)
            }
          }

          // 满足 `settings` 时，共享工具执行该分支。
          if (settings) {
            // mergedSettings 集合更新为 `mergeWith(`，确保共享工具后续读取最新状态。
            mergedSettings = mergeWith(
              mergedSettings,
              settings,
              settingsMergeCustomizer,
            )
          }
        }
      }

      // For flagSettings, also merge any inline settings set via the SDK
      // 当 `source` 匹配 `'flagSettings'` 时，共享工具执行对应分支。
      if (source === 'flagSettings') {
        // inlineSettings 集合读取`getFlagSettingsInline`，供共享工具后续处理使用。
        const inlineSettings = getFlagSettingsInline()
        // 满足 `inlineSettings` 时，共享工具执行该分支。
        if (inlineSettings) {
          // 解析结果保存`SettingsSchema`，供共享工具后续处理使用。
          const parsed = SettingsSchema().safeParse(inlineSettings)
          // 满足 `parsed.success` 时，共享工具执行该分支。
          if (parsed.success) {
            // mergedSettings 集合更新为 `mergeWith(`，确保共享工具后续读取最新状态。
            mergedSettings = mergeWith(
              mergedSettings,
              parsed.data,
              settingsMergeCustomizer,
            )
          }
        }
      }
    }

    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'settings_load_completed', {
      duration_ms: Date.now() - startTime,
      source_count: seenFiles.size,
      error_count: allErrors.length,
    })

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { settings: mergedSettings, errors: allErrors }
  } finally {
    // isLoadingSettings 集合更新为 `false`，确保共享工具后续读取最新状态。
    isLoadingSettings = false
  }
}

/**
 * Get merged settings from all sources in priority order
 * Settings are merged from lowest to highest priority:
 * userSettings -> projectSettings -> localSettings -> policySettings
 *
 * This function returns a snapshot of settings at the time of call.
 * For React components, prefer using useSettings() hook for reactive updates
 * when settings change on disk.
 *
 * Uses session-level caching to avoid repeated file I/O.
 * Cache is invalidated when settings files change via resetSettingsCache().
 *
 * @returns Merged settings from all available sources (always returns at least empty object)
 */
// getInitialSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitialSettings(): SettingsJson {
  // 从 `getSettingsWithErrors()` 解构 settings，减少共享工具 settings对同一对象的重复访问。
  const { settings } = getSettingsWithErrors()
  // 返回 `settings || {}`，作为共享工具这次计算的结果。
  return settings || {}
}

/**
 * @deprecated Use getInitialSettings() instead. This alias exists for backwards compatibility.
 */
// getSettings_DEPRECATED 命名 `getInitialSettings`，让后续代码直接表达这个值的用途。
export const getSettings_DEPRECATED = getInitialSettings

// SettingsWithSources 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SettingsWithSources = {
  effective: SettingsJson
  /** Ordered low-to-high priority — later entries override earlier ones. */
  sources: Array<{ source: SettingSource; settings: SettingsJson }>
}

/**
 * Get the effective merged settings alongside the raw per-source settings,
 * in merge-priority order. Only includes sources that are enabled and have
 * non-empty content.
 *
 * Always reads fresh from disk — resets the session cache so that `effective`
 * and `sources` are consistent even if the change detector hasn't fired yet.
 */
// getSettingsWithSources 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsWithSources(): SettingsWithSources {
  // Reset both caches so getSettingsForSource (per-source cache) and
  // getInitialSettings (session cache) agree on the current disk state.
  // 调用 resetSettingsCache，触发共享工具此处需要的副作用。
  resetSettingsCache()
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: SettingsWithSources['sources'] = []
  // 逐项读取 `getEnabledSettingSources()` 中的source，按输入顺序推进共享工具。
  for (const source of getEnabledSettingSources()) {
    // settings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
    const settings = getSettingsForSource(source)
    // 只有 `settings && Object.keys(settings).length > 0` 满足时，共享工具才执行该分支。
    if (settings && Object.keys(settings).length > 0) {
      // sources 集合追加新条目，保持收集顺序与输入顺序一致。
      sources.push({ source, settings })
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { effective: getInitialSettings(), sources }
}

/**
 * Get merged settings and validation errors from all sources
 * This function now uses session-level caching to avoid repeated file I/O.
 * Settings changes require Claude Code restart, so cache is valid for entire session.
 * @returns Merged settings and all validation errors encountered
 */
// getSettingsWithErrors 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingsWithErrors(): SettingsWithErrors {
  // Use cached result if available
  // cached 缓存读取`getSessionSettingsCache`，供共享工具后续处理使用。
  const cached = getSessionSettingsCache()
  // `cached` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== null) {
    // 返回 `cached`，作为共享工具这次计算的结果。
    return cached
  }

  // Load from disk and cache the result
  // 结果读取`loadSettingsFromDisk`，供共享工具后续处理使用。
  const result = loadSettingsFromDisk()
  // 调用 profileCheckpoint，触发共享工具此处需要的副作用。
  profileCheckpoint('loadSettingsFromDisk_end')
  // setSessionSettingsCache 写入新的状态值，使共享工具后续读取保持一致。
  setSessionSettingsCache(result)
  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Check if any raw settings file contains a specific key, regardless of validation.
 * This is useful for detecting user intent even when settings validation fails.
 * For example, if a user set cleanupPeriodDays but has validation errors elsewhere,
 * we can detect they explicitly configured cleanup and skip cleanup rather than
 * falling back to defaults.
 */
/**
 * Returns true if any trusted settings source has accepted the bypass
 * permissions mode dialog. projectSettings is intentionally excluded —
 * a malicious project could otherwise auto-bypass the dialog (RCE risk).
 */
// hasSkipDangerousModePermissionPrompt 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasSkipDangerousModePermissionPrompt(): boolean {
  // 返回 `!!(`，作为共享工具这次计算的结果。
  return !!(
    getSettingsForSource('userSettings')?.skipDangerousModePermissionPrompt ||
    getSettingsForSource('localSettings')?.skipDangerousModePermissionPrompt ||
    getSettingsForSource('flagSettings')?.skipDangerousModePermissionPrompt ||
    getSettingsForSource('policySettings')?.skipDangerousModePermissionPrompt
  )
}

/**
 * Returns true if any trusted settings source has accepted the auto
 * mode opt-in dialog. projectSettings is intentionally excluded —
 * a malicious project could otherwise auto-bypass the dialog (RCE risk).
 */
// hasAutoModeOptIn 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasAutoModeOptIn(): boolean {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，共享工具执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // user读取`getSettingsForSource`，供共享工具后续处理使用。
    const user = getSettingsForSource('userSettings')?.skipAutoPermissionPrompt
    // local 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const local =
      getSettingsForSource('localSettings')?.skipAutoPermissionPrompt
    // flag读取`getSettingsForSource`，供共享工具后续处理使用。
    const flag = getSettingsForSource('flagSettings')?.skipAutoPermissionPrompt
    // policy 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const policy =
      getSettingsForSource('policySettings')?.skipAutoPermissionPrompt
    // 结果标记共享工具 settings是否启用对应路径。
    const result = !!(user || local || flag || policy)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[auto-mode] hasAutoModeOptIn=${result} skipAutoPermissionPrompt: user=${user} local=${local} flag=${flag} policy=${policy}`,
    )
    // 返回 `result`，作为共享工具这次计算的结果。
    return result
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Returns whether plan mode should use auto mode semantics. Default true
 * (opt-out). Returns false if any trusted source explicitly sets false.
 * projectSettings is excluded so a malicious project can't control this.
 */
// getUseAutoModeDuringPlan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUseAutoModeDuringPlan(): boolean {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，共享工具执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // 返回 `(`，作为共享工具这次计算的结果。
    return (
      getSettingsForSource('policySettings')?.useAutoModeDuringPlan !== false &&
      getSettingsForSource('flagSettings')?.useAutoModeDuringPlan !== false &&
      getSettingsForSource('userSettings')?.useAutoModeDuringPlan !== false &&
      getSettingsForSource('localSettings')?.useAutoModeDuringPlan !== false
    )
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Returns the merged autoMode config from trusted settings sources.
 * Only available when TRANSCRIPT_CLASSIFIER is active; returns undefined otherwise.
 * projectSettings is intentionally excluded — a malicious project could
 * otherwise inject classifier allow/deny rules (RCE risk).
 */
// getAutoModeConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeConfig():
  | { allow?: string[]; soft_deny?: string[]; environment?: string[] }
  | undefined {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，共享工具执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // schema保存`z.object`，供共享工具后续处理使用。
    const schema = z.object({
      allow: z.array(z.string()).optional(),
      soft_deny: z.array(z.string()).optional(),
      deny: z.array(z.string()).optional(),
      environment: z.array(z.string()).optional(),
    })

    // allow 从空数组开始收集，后续循环会按处理顺序追加条目。
    const allow: string[] = []
    // soft_deny 从空数组开始收集，后续循环会按处理顺序追加条目。
    const soft_deny: string[] = []
    // environment 从空数组开始收集，后续循环会按处理顺序追加条目。
    const environment: string[] = []

    // 调用 for，触发共享工具此处需要的副作用。
    for (const source of [
      'userSettings',
      'localSettings',
      'flagSettings',
      'policySettings',
    ] as const) {
      // settings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
      const settings = getSettingsForSource(source)
      // settings 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!settings) continue
      // 结果保存`schema.safeParse`，供共享工具后续处理使用。
      const result = schema.safeParse(
        (settings as Record<string, unknown>).autoMode,
      )
      // 满足 `result.success` 时，共享工具执行该分支。
      if (result.success) {
        // 满足 `result.data.allow) allow.push(...result.data.allow` 时，共享工具执行该分支。
        if (result.data.allow) allow.push(...result.data.allow)
        // 满足 `result.data.soft_deny) soft_deny.push(...result.data.soft_deny` 时，共享工具执行该分支。
        if (result.data.soft_deny) soft_deny.push(...result.data.soft_deny)
        // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
        if (process.env.USER_TYPE === 'ant') {
          // 满足 `result.data.deny) soft_deny.push(...result.data.deny` 时，共享工具执行该分支。
          if (result.data.deny) soft_deny.push(...result.data.deny)
        }
        // 满足 `result.data.environment` 时，共享工具执行该分支。
        if (result.data.environment)
          // environment追加新条目，保持收集顺序与输入顺序一致。
          environment.push(...result.data.environment)
      }
    }

    // 只有 `allow.length > 0 || soft_deny.length > 0 || envir` 满足时，共享工具才执行该分支。
    if (allow.length > 0 || soft_deny.length > 0 || environment.length > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        ...(allow.length > 0 && { allow }),
        ...(soft_deny.length > 0 && { soft_deny }),
        ...(environment.length > 0 && { environment }),
      }
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// rawSettingsContainsKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function rawSettingsContainsKey(key: string): boolean {
  // 逐项读取 `getEnabledSettingSources()` 中的source，按输入顺序推进共享工具。
  for (const source of getEnabledSettingSources()) {
    // Skip policySettings - we only care about user-configured settings
    // 当 `source` 匹配 `'policySettings'` 时，共享工具执行对应分支。
    if (source === 'policySettings') {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 文件路径读取`getSettingsFilePathForSource`，供共享工具后续处理使用。
    const filePath = getSettingsFilePathForSource(source)
    // 文件路径缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!filePath) {
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 从 `safeResolvePath(getFsImplementation(), filePath)` 解构 resolvedPath，减少共享工具 settings对同一对象的重复访问。
      const { resolvedPath } = safeResolvePath(getFsImplementation(), filePath)
      // 文本内容读取`readFileSync`，供共享工具后续处理使用。
      const content = readFileSync(resolvedPath)
      // 满足 `!content.trim()` 时，共享工具执行该分支。
      if (!content.trim()) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // rawData保存`safeParseJSON`，供共享工具后续处理使用。
      const rawData = safeParseJSON(content, false)
      // 只有 `rawData && typeof rawData === 'object' && key in` 满足时，共享工具才执行该分支。
      if (rawData && typeof rawData === 'object' && key in rawData) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    } catch (error) {
      // File not found is expected - not all settings files exist
      // Other errors (permissions, I/O) should be tracked
      // 调用 handleFileSystemError，触发共享工具此处需要的副作用。
      handleFileSystemError(error, filePath)
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
