/**
 * Manages plugin installation metadata stored in installed_plugins.json
 *
 * This module separates plugin installation state (global) from enabled/disabled
 * state (per-repository). The installed_plugins.json file tracks:
 * - Which plugins are installed globally
 * - Installation metadata (version, timestamps, paths)
 *
 * The enabled/disabled state remains in .claude/settings.json for per-repo control.
 *
 * Rationale: Installation is global (a plugin is either on disk or not), while
 * enabled/disabled state is per-repository (different projects may want different
 * plugins active).
 */

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage、isENOENT、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage, isENOENT, toError } from '../errors.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  jsonParse,
  jsonStringify,
  writeFileSync_DEPRECATED,
} from '../slowOperations.js'
// 引入 getPluginsDirectory，将 ./pluginDirectories.js 中已经封装好的能力接到本文件流程里。
import { getPluginsDirectory } from './pluginDirectories.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  type InstalledPlugin,
  InstalledPluginsFileSchemaV1,
  InstalledPluginsFileSchemaV2,
  type InstalledPluginsFileV1,
  type InstalledPluginsFileV2,
  type PluginInstallationEntry,
  type PluginScope,
} from './schemas.js'

// Type alias for V2 plugins map
// InstalledPluginsMapV2 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type InstalledPluginsMapV2 = Record<string, PluginInstallationEntry[]>

// Type for persistable scopes (excludes 'flag' which is session-only)
// PersistableScope 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistableScope = Exclude<PluginScope, never> // All scopes are persistable in the schema

// 引入 getOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../bootstrap/state.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 getHeadForDir，将 ../git/gitFilesystem.js 中已经封装好的能力接到本文件流程里。
import { getHeadForDir } from '../git/gitFilesystem.js'
// 类型依赖 { EditableSettingSource } 来自 ../settings/constants.js，用于校准插件管理的数据契约。
import type { EditableSettingSource } from '../settings/constants.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsForSource,
} from '../settings/settings.js'
// 引入 getPluginById，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { getPluginById } from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  parsePluginIdentifier,
  settingSourceToScope,
} from './pluginIdentifier.js'
// 引入 getPluginCachePath、getVersionedCachePath，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { getPluginCachePath, getVersionedCachePath } from './pluginLoader.js'

// Migration state to prevent running migration multiple times per session
// migrationCompleted标记插件工具 installed Plugins Manager是否启用对应路径。
let migrationCompleted = false

/**
 * Memoized cache of installed plugins data (V2 format)
 * Cleared by clearInstalledPluginsCache() when file is modified.
 * Prevents repeated filesystem reads within a single CLI session.
 */
// installedPluginsCacheV2 插件数据 命名 `null`，让后续代码直接表达这个值的用途。
let installedPluginsCacheV2: InstalledPluginsFileV2 | null = null

/**
 * Session-level snapshot of installed plugins at startup.
 * This is what the running session uses - it's NOT updated by background operations.
 * Background updates modify the disk file only.
 */
// inMemoryInstalledPlugins 插件数据保存`null`，作为后续空值处理的输入。
let inMemoryInstalledPlugins: InstalledPluginsFileV2 | null = null

/**
 * Get the path to the installed_plugins.json file
 */
// getInstalledPluginsFilePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInstalledPluginsFilePath(): string {
  // 返回 `join(getPluginsDirectory(), 'installed_plugins.json')`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), 'installed_plugins.json')
}

/**
 * Get the path to the legacy installed_plugins_v2.json file.
 * Used only during migration to consolidate into single file.
 */
// getInstalledPluginsV2FilePath 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInstalledPluginsV2FilePath(): string {
  // 返回 `join(getPluginsDirectory(), 'installed_plugins_v2.json')`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), 'installed_plugins_v2.json')
}

/**
 * Clear the installed plugins cache
 * Call this when the file is modified to force a reload
 *
 * Note: This also clears the in-memory session state (inMemoryInstalledPlugins).
 * In most cases, this is only called during initialization or testing.
 * For background updates, use updateInstallationPathOnDisk() which preserves
 * the in-memory state.
 */
// clearInstalledPluginsCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearInstalledPluginsCache(): void {
  // installedPluginsCacheV2 插件数据更新为 `null`，确保插件工具后续读取最新状态。
  installedPluginsCacheV2 = null
  // inMemoryInstalledPlugins 插件数据更新为 `null`，确保插件工具后续读取最新状态。
  inMemoryInstalledPlugins = null
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Cleared installed plugins cache')
}

/**
 * Migrate to single plugin file format.
 *
 * This consolidates the V1/V2 dual-file system into a single file:
 * 1. If installed_plugins_v2.json exists: copy to installed_plugins.json (version=2), delete V2 file
 * 2. If only installed_plugins.json exists with version=1: convert to version=2 in-place
 * 3. Clean up legacy non-versioned cache directories
 *
 * This migration runs once per session at startup.
 */
// migrateToSinglePluginFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function migrateToSinglePluginFile(): void {
  // 满足 `migrationCompleted` 时，插件管理执行该分支。
  if (migrationCompleted) {
    // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // mainFilePath 路径数据读取`getInstalledPluginsFilePath`，供插件管理后续处理使用。
  const mainFilePath = getInstalledPluginsFilePath()
  // v2FilePath 路径数据读取`getInstalledPluginsV2FilePath`，供插件管理后续处理使用。
  const v2FilePath = getInstalledPluginsV2FilePath()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Case 1: Try renaming v2→main directly; ENOENT = v2 doesn't exist
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 调用 fs.renameSync，触发插件管理此处需要的副作用。
      fs.renameSync(v2FilePath, mainFilePath)
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Renamed installed_plugins_v2.json to installed_plugins.json`,
      )
      // Clean up legacy cache directories
      // v2Data读取`loadInstalledPluginsV2`，供插件管理后续处理使用。
      const v2Data = loadInstalledPluginsV2()
      // 调用 cleanupLegacyCache，触发插件管理此处需要的副作用。
      cleanupLegacyCache(v2Data)
      // migrationCompleted更新为 `true`，确保插件工具后续读取最新状态。
      migrationCompleted = true
      // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    } catch (e) {
      // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
      if (!isENOENT(e)) throw e
    }

    // Case 2: v2 absent — try reading main; ENOENT = neither exists (case 3)
    // mainContent 先占位，稍后的条件分支会根据实际输入补齐它。
    let mainContent: string
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // mainContent更新为 `fs.readFileSync(mainFilePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
      mainContent = fs.readFileSync(mainFilePath, { encoding: 'utf-8' })
    } catch (e) {
      // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
      if (!isENOENT(e)) throw e
      // Case 3: No file exists - nothing to migrate
      // migrationCompleted更新为 `true`，确保插件工具后续读取最新状态。
      migrationCompleted = true
      // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // mainData解析`jsonParse`，供插件管理后续处理使用。
    const mainData = jsonParse(mainContent)
    // version标记插件工具 installed Plugins Manager是否启用对应路径。
    const version = typeof mainData?.version === 'number' ? mainData.version : 1

    // 满足 `version === 1` 时，插件管理执行该分支。
    if (version === 1) {
      // Convert V1 to V2 format in-place
      // v1Data保存`InstalledPluginsFileSchemaV1`，供插件管理后续处理使用。
      const v1Data = InstalledPluginsFileSchemaV1().parse(mainData)
      // v2Data保存`migrateV1ToV2`，供插件管理后续处理使用。
      const v2Data = migrateV1ToV2(v1Data)

      // 调用 writeFileSync_DEPRECATED，触发插件管理此处需要的副作用。
      writeFileSync_DEPRECATED(mainFilePath, jsonStringify(v2Data, null, 2), {
        encoding: 'utf-8',
        flush: true,
      })
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Converted installed_plugins.json from V1 to V2 format (${Object.keys(v1Data.plugins).length} plugins)`,
      )

      // Clean up legacy cache directories
      // 调用 cleanupLegacyCache，触发插件管理此处需要的副作用。
      cleanupLegacyCache(v2Data)
    }
    // If version=2, already in correct format, no action needed

    // migrationCompleted更新为 `true`，确保插件工具后续读取最新状态。
    migrationCompleted = true
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to migrate plugin files: ${errorMsg}`, {
      level: 'error',
    })
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // Mark as completed to avoid retrying failed migration
    // migrationCompleted更新为 `true`，确保插件工具后续读取最新状态。
    migrationCompleted = true
  }
}

/**
 * Clean up legacy non-versioned cache directories.
 *
 * Legacy cache structure: ~/.claude/plugins/cache/{plugin-name}/
 * Versioned cache structure: ~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/
 *
 * This function removes legacy directories that are not referenced by any installation.
 */
// cleanupLegacyCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cleanupLegacyCache(v2Data: InstalledPluginsFileV2): void {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // cachePath 路径数据读取`getPluginCachePath`，供插件管理后续处理使用。
  const cachePath = getPluginCachePath()
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Collect all install paths that are referenced
    // referencedPaths 路径数据构建`new Set<string>()`，供后续判断或组装使用。
    const referencedPaths = new Set<string>()
    // 逐项读取 `Object.values(v2Data.plugins)` 中的installations 集合，按输入顺序推进插件管理。
    for (const installations of Object.values(v2Data.plugins)) {
      // 按顺序遍历 `installations` 中的entry，逐个交给插件管理处理。
      for (const entry of installations) {
        // 调用 referencedPaths.add，触发插件管理此处需要的副作用。
        referencedPaths.add(entry.installPath)
      }
    }

    // List top-level directories in cache
    // entries 集合读取`fs.readdirSync`，供插件管理后续处理使用。
    const entries = fs.readdirSync(cachePath)

    // 按顺序遍历 `entries` 中的dirent，逐个交给插件管理处理。
    for (const dirent of entries) {
      // 满足 `!dirent.isDirectory()` 时，插件管理执行该分支。
      if (!dirent.isDirectory()) {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // entry保存`dirent.name`，供后续判断或组装使用。
      const entry = dirent.name
      // entryPath 路径数据格式化`join`，供插件管理后续处理使用。
      const entryPath = join(cachePath, entry)

      // Check if this is a versioned cache (marketplace dir with plugin/version subdirs)
      // or a legacy cache (flat plugin directory)
      // subEntries 集合读取`fs.readdirSync`，供插件管理后续处理使用。
      const subEntries = fs.readdirSync(entryPath)
      // hasVersionedStructure记录 `subEntries.some` 是否成立，插件管理随后按该结果分支。
      const hasVersionedStructure = subEntries.some(subDirent => {
        // 满足 `!subDirent.isDirectory()` 时，插件管理执行该分支。
        if (!subDirent.isDirectory()) return false
        // subPath 路径数据格式化`join`，供插件管理后续处理使用。
        const subPath = join(entryPath, subDirent.name)
        // Check if subdir contains version directories (semver-like or hash)
        // versionEntries 集合读取`fs.readdirSync`，供插件管理后续处理使用。
        const versionEntries = fs.readdirSync(subPath)
        // 返回 `versionEntries.some(vDirent => vDirent.isDirectory())`，作为插件管理这次计算的结果。
        return versionEntries.some(vDirent => vDirent.isDirectory())
      })

      // 满足 `hasVersionedStructure` 时，插件管理执行该分支。
      if (hasVersionedStructure) {
        // This is a marketplace directory with versioned structure - skip
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // This is a legacy flat cache directory
      // Check if it's referenced by any installation
      // 满足 `!referencedPaths.has(entryPath)` 时，插件管理执行该分支。
      if (!referencedPaths.has(entryPath)) {
        // Not referenced - safe to delete
        // 调用 fs.rmSync，触发插件管理此处需要的副作用。
        fs.rmSync(entryPath, { recursive: true, force: true })
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Cleaned up legacy cache directory: ${entry}`)
      }
    }
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to clean up legacy cache: ${errorMsg}`, {
      level: 'warn',
    })
  }
}

/**
 * Reset migration state (for testing)
 */
// resetMigrationState 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetMigrationState(): void {
  // migrationCompleted更新为 `false`，确保插件工具后续读取最新状态。
  migrationCompleted = false
}

/**
 * Read raw file data from installed_plugins.json
 * Returns null if file doesn't exist.
 * Throws error if file exists but can't be parsed.
 */
// readInstalledPluginsFileRaw 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function readInstalledPluginsFileRaw(): {
  version: number
  data: unknown
} | null {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // 文件路径读取`getInstalledPluginsFilePath`，供插件管理后续处理使用。
  const filePath = getInstalledPluginsFilePath()

  // fileContent 文件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let fileContent: string
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // fileContent 文件数据更新为 `fs.readFileSync(filePath, { encoding: 'utf-8' })`，确保插件工具后续读取最新状态。
    fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
  } catch (e) {
    // 满足 `isENOENT(e)` 时，插件管理执行该分支。
    if (isENOENT(e)) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // 抛出 e，阻止插件管理在无效状态下继续运行。
    throw e
  }
  // data解析`jsonParse`，供插件管理后续处理使用。
  const data = jsonParse(fileContent)
  // version标记插件工具 installed Plugins Manager是否启用对应路径。
  const version = typeof data?.version === 'number' ? data.version : 1
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { version, data }
}

/**
 * Migrate V1 data to V2 format.
 * All V1 plugins are migrated to 'user' scope since V1 had no scope concept.
 */
// migrateV1ToV2 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function migrateV1ToV2(v1Data: InstalledPluginsFileV1): InstalledPluginsFileV2 {
  // v2Plugins 插件数据 从空对象开始收集键值，后续按名称补齐内容。
  const v2Plugins: InstalledPluginsMapV2 = {}

  // 循环处理 `const [pluginId, plugin] of Object.entries(v1Data.plugins)`，让插件管理把同类条目按顺序走完。
  for (const [pluginId, plugin] of Object.entries(v1Data.plugins)) {
    // V2 format uses versioned cache path: ~/.claude/plugins/cache/{marketplace}/{plugin}/{version}
    // Compute it from pluginId and version instead of using the V1 installPath
    // versionedCachePath 路径数据读取`getVersionedCachePath`，供插件管理后续处理使用。
    const versionedCachePath = getVersionedCachePath(pluginId, plugin.version)

    // v2Plugins[pluginId 插件数据更新为 `[`，确保插件工具 installed Plugins Manager后续读取最新状态。
    v2Plugins[pluginId] = [
      {
        scope: 'user', // Default all existing installs to user scope
        installPath: versionedCachePath,
        version: plugin.version,
        installedAt: plugin.installedAt,
        lastUpdated: plugin.lastUpdated,
        gitCommitSha: plugin.gitCommitSha,
      },
    ]
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { version: 2, plugins: v2Plugins }
}

/**
 * Load installed plugins in V2 format.
 *
 * Reads from installed_plugins.json. If file has version=1,
 * converts to V2 format in memory.
 *
 * @returns V2 format data with array-per-plugin structure
 */
// loadInstalledPluginsV2 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadInstalledPluginsV2(): InstalledPluginsFileV2 {
  // Return cached V2 data if available
  // `installedPluginsCacheV2` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (installedPluginsCacheV2 !== null) {
    // 返回 `installedPluginsCacheV2`，作为插件管理这次计算的结果。
    return installedPluginsCacheV2
  }

  // 文件路径读取`getInstalledPluginsFilePath`，供插件管理后续处理使用。
  const filePath = getInstalledPluginsFilePath()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // rawData读取`readInstalledPluginsFileRaw`，供插件管理后续处理使用。
    const rawData = readInstalledPluginsFileRaw()

    // 满足 `rawData` 时，插件管理执行该分支。
    if (rawData) {
      // 满足 `rawData.version === 2` 时，插件管理执行该分支。
      if (rawData.version === 2) {
        // V2 format - validate and return
        // validated保存`InstalledPluginsFileSchemaV2`，供插件管理后续处理使用。
        const validated = InstalledPluginsFileSchemaV2().parse(rawData.data)
        // installedPluginsCacheV2 插件数据更新为 `validated`，确保插件工具后续读取最新状态。
        installedPluginsCacheV2 = validated
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Loaded ${Object.keys(validated.plugins).length} installed plugins from ${filePath}`,
        )
        // 返回 `validated`，作为插件管理这次计算的结果。
        return validated
      }

      // V1 format - convert to V2
      // v1Validated保存`InstalledPluginsFileSchemaV1`，供插件管理后续处理使用。
      const v1Validated = InstalledPluginsFileSchemaV1().parse(rawData.data)
      // v2Data保存`migrateV1ToV2`，供插件管理后续处理使用。
      const v2Data = migrateV1ToV2(v1Validated)
      // installedPluginsCacheV2 插件数据更新为 `v2Data`，确保插件工具后续读取最新状态。
      installedPluginsCacheV2 = v2Data
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Loaded and converted ${Object.keys(v1Validated.plugins).length} plugins from V1 format`,
      )
      // 返回 `v2Data`，作为插件管理这次计算的结果。
      return v2Data
    }

    // File doesn't exist - return empty V2
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `installed_plugins.json doesn't exist, returning empty V2 object`,
    )
    // installedPluginsCacheV2 插件数据更新为 `{ version: 2, plugins: {} }`，确保插件工具后续读取最新状态。
    installedPluginsCacheV2 = { version: 2, plugins: {} }
    // 返回 `installedPluginsCacheV2`，作为插件管理这次计算的结果。
    return installedPluginsCacheV2
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to load installed_plugins.json: ${errorMsg}. Starting with empty state.`,
      { level: 'error' },
    )
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))

    // installedPluginsCacheV2 插件数据更新为 `{ version: 2, plugins: {} }`，确保插件工具后续读取最新状态。
    installedPluginsCacheV2 = { version: 2, plugins: {} }
    // 返回 `installedPluginsCacheV2`，作为插件管理这次计算的结果。
    return installedPluginsCacheV2
  }
}

/**
 * Save installed plugins in V2 format to installed_plugins.json.
 * This is the single source of truth after V1/V2 consolidation.
 */
// saveInstalledPluginsV2 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function saveInstalledPluginsV2(data: InstalledPluginsFileV2): void {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // 文件路径读取`getInstalledPluginsFilePath`，供插件管理后续处理使用。
  const filePath = getInstalledPluginsFilePath()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 调用 fs.mkdirSync，触发插件管理此处需要的副作用。
    fs.mkdirSync(getPluginsDirectory())

    // jsonContent保存`jsonStringify`，供插件管理后续处理使用。
    const jsonContent = jsonStringify(data, null, 2)
    // 调用 writeFileSync_DEPRECATED，触发插件管理此处需要的副作用。
    writeFileSync_DEPRECATED(filePath, jsonContent, {
      encoding: 'utf-8',
      flush: true,
    })

    // Update cache
    // installedPluginsCacheV2 插件数据更新为 `data`，确保插件工具后续读取最新状态。
    installedPluginsCacheV2 = data

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Saved ${Object.keys(data.plugins).length} installed plugins to ${filePath}`,
    )
  } catch (error) {
    // _errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const _errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }
}

/**
 * Add or update a plugin installation entry at a specific scope.
 * Used for V2 format where each plugin has an array of installations.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @param scope - Installation scope (managed/user/project/local)
 * @param installPath - Path to versioned plugin directory
 * @param metadata - Additional installation metadata
 * @param projectPath - Project path (required for project/local scopes)
 */
// addPluginInstallation 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addPluginInstallation(
  pluginId: string,
  scope: PersistableScope,
  installPath: string,
  metadata: Partial<PluginInstallationEntry>,
  projectPath?: string,
): void {
  // data读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const data = loadInstalledPluginsFromDisk()

  // Get or create array for this plugin
  // installations 集合标记插件工具 installed Plugins Manager是否启用对应路径。
  const installations = data.plugins[pluginId] || []

  // Find existing entry for this scope+projectPath
  // existingIndex 索引筛选`installations.findIndex`，供插件管理后续处理使用。
  const existingIndex = installations.findIndex(
    // entry更新为 `> entry.scope === scope && entry.projectPath === projectP...`，确保插件工具后续读取最新状态。
    entry => entry.scope === scope && entry.projectPath === projectPath,
  )

  // newEntry 集中保存插件工具 installed Plugins Manager要一起传递的字段。
  const newEntry: PluginInstallationEntry = {
    scope,
    installPath,
    version: metadata.version,
    installedAt: metadata.installedAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    gitCommitSha: metadata.gitCommitSha,
    ...(projectPath && { projectPath }),
  }

  // 满足 `existingIndex >= 0` 时，插件管理执行该分支。
  if (existingIndex >= 0) {
    // installations[existingIndex 索引更新为 `newEntry`，确保插件工具 installed Plugins Manager后续读取最新状态。
    installations[existingIndex] = newEntry
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Updated installation for ${pluginId} at scope ${scope}`)
  } else {
    // installations 集合追加新条目，保持收集顺序与输入顺序一致。
    installations.push(newEntry)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Added installation for ${pluginId} at scope ${scope}`)
  }

  // plugins[pluginId 插件数据更新为 `installations`，确保插件工具 installed Plugins Manager后续读取最新状态。
  data.plugins[pluginId] = installations
  // 调用 saveInstalledPluginsV2，触发插件管理此处需要的副作用。
  saveInstalledPluginsV2(data)
}

/**
 * Remove a plugin installation entry from a specific scope.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @param scope - Installation scope to remove
 * @param projectPath - Project path (for project/local scopes)
 */
// removePluginInstallation 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removePluginInstallation(
  pluginId: string,
  scope: PersistableScope,
  projectPath?: string,
): void {
  // data读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const data = loadInstalledPluginsFromDisk()
  // installations 集合保存`data.plugins[pluginId]`，供插件工具 installed Plugins Manager后续判断或输出使用。
  const installations = data.plugins[pluginId]

  // installations 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!installations) {
    // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // plugins[pluginId 插件数据更新为 `installations.filter(`，确保插件工具 installed Plugins Manager后续读取最新状态。
  data.plugins[pluginId] = installations.filter(
    // entry更新为 `> !(entry.scope === scope && entry.projectPath === projec...`，确保插件工具后续读取最新状态。
    entry => !(entry.scope === scope && entry.projectPath === projectPath),
  )

  // Remove plugin entirely if no installations left
  // data.plugins[pluginId 插件数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (data.plugins[pluginId].length === 0) {
    // 插件工具 installed Plugins Manager在这里处理 `delete data.plugins[pluginId]`，完成这一小步状态转换。
    delete data.plugins[pluginId]
  }

  // 调用 saveInstalledPluginsV2，触发插件管理此处需要的副作用。
  saveInstalledPluginsV2(data)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Removed installation for ${pluginId} at scope ${scope}`)
}

// =============================================================================
// In-Memory vs Disk State Management (for non-in-place updates)
// =============================================================================

/**
 * Get the in-memory installed plugins (session state).
 * This snapshot is loaded at startup and used for the entire session.
 * It is NOT updated by background operations.
 *
 * @returns V2 format data representing the session's view of installed plugins
 */
// getInMemoryInstalledPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInMemoryInstalledPlugins(): InstalledPluginsFileV2 {
  // 满足 `inMemoryInstalledPlugins === null` 时，插件管理执行该分支。
  if (inMemoryInstalledPlugins === null) {
    // inMemoryInstalledPlugins 插件数据更新为 `loadInstalledPluginsV2()`，确保插件工具后续读取最新状态。
    inMemoryInstalledPlugins = loadInstalledPluginsV2()
  }
  // 返回 `inMemoryInstalledPlugins`，作为插件管理这次计算的结果。
  return inMemoryInstalledPlugins
}

/**
 * Load installed plugins directly from disk, bypassing all caches.
 * Used by background updater to check for changes without affecting
 * the running session's view.
 *
 * @returns V2 format data read fresh from disk
 */
// loadInstalledPluginsFromDisk 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function loadInstalledPluginsFromDisk(): InstalledPluginsFileV2 {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Read from main file
    // rawData读取`readInstalledPluginsFileRaw`，供插件管理后续处理使用。
    const rawData = readInstalledPluginsFileRaw()

    // 满足 `rawData` 时，插件管理执行该分支。
    if (rawData) {
      // 满足 `rawData.version === 2` 时，插件管理执行该分支。
      if (rawData.version === 2) {
        // 返回 `InstalledPluginsFileSchemaV2().parse(rawData.data)`，作为插件管理这次计算的结果。
        return InstalledPluginsFileSchemaV2().parse(rawData.data)
      }
      // V1 format - convert to V2
      // v1Data保存`InstalledPluginsFileSchemaV1`，供插件管理后续处理使用。
      const v1Data = InstalledPluginsFileSchemaV1().parse(rawData.data)
      // 返回 `migrateV1ToV2(v1Data)`，作为插件管理这次计算的结果。
      return migrateV1ToV2(v1Data)
    }

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { version: 2, plugins: {} }
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to load installed plugins from disk: ${errorMsg}`, {
      level: 'error',
    })
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { version: 2, plugins: {} }
  }
}

/**
 * Update a plugin's install path on disk only, without modifying in-memory state.
 * Used by background updater to record new version on disk while session
 * continues using the old version.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @param scope - Installation scope
 * @param projectPath - Project path (for project/local scopes)
 * @param newPath - New install path (to new version directory)
 * @param newVersion - New version string
 */
// updateInstallationPathOnDisk 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateInstallationPathOnDisk(
  pluginId: string,
  scope: PersistableScope,
  projectPath: string | undefined,
  newPath: string,
  newVersion: string,
  gitCommitSha?: string,
): void {
  // diskData读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const diskData = loadInstalledPluginsFromDisk()
  // installations 集合保存`diskData.plugins[pluginId]`，供插件工具 installed Plugins Manager后续判断或输出使用。
  const installations = diskData.plugins[pluginId]

  // installations 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!installations) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cannot update ${pluginId} on disk: plugin not found in installed plugins`,
    )
    // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // entry筛选`installations.find`，供插件管理后续处理使用。
  const entry = installations.find(
    // e更新为 `> e.scope === scope && e.projectPath === projectPath`，确保插件工具后续读取最新状态。
    e => e.scope === scope && e.projectPath === projectPath,
  )

  // 满足 `entry` 时，插件管理执行该分支。
  if (entry) {
    // installPath 路径数据更新为 `newPath`，确保插件工具后续读取最新状态。
    entry.installPath = newPath
    // version更新为 `newVersion`，确保插件工具后续读取最新状态。
    entry.version = newVersion
    // lastUpdated更新为 `new Date().toISOString()`，确保插件工具后续读取最新状态。
    entry.lastUpdated = new Date().toISOString()
    // `gitCommitSha` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (gitCommitSha !== undefined) {
      // gitCommitSha更新为 `gitCommitSha`，确保插件工具后续读取最新状态。
      entry.gitCommitSha = gitCommitSha
    }

    // 文件路径读取`getInstalledPluginsFilePath`，供插件管理后续处理使用。
    const filePath = getInstalledPluginsFilePath()

    // Write to single file (V2 format with version=2)
    // 调用 writeFileSync_DEPRECATED，触发插件管理此处需要的副作用。
    writeFileSync_DEPRECATED(filePath, jsonStringify(diskData, null, 2), {
      encoding: 'utf-8',
      flush: true,
    })

    // Clear cache since disk changed, but do NOT update inMemoryInstalledPlugins
    // installedPluginsCacheV2 插件数据更新为 `null`，确保插件工具后续读取最新状态。
    installedPluginsCacheV2 = null

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Updated ${pluginId} on disk to version ${newVersion} at ${newPath}`,
    )
  } else {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cannot update ${pluginId} on disk: no installation for scope ${scope}`,
    )
  }
  // Note: inMemoryInstalledPlugins is NOT updated
}

/**
 * Check if there are pending updates (disk differs from memory).
 * This happens when background updater has downloaded new versions.
 *
 * @returns true if any plugin has a different install path on disk vs memory
 */
// hasPendingUpdates 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasPendingUpdates(): boolean {
  // memoryState 状态读取`getInMemoryInstalledPlugins`，供插件管理后续处理使用。
  const memoryState = getInMemoryInstalledPlugins()
  // diskState 状态读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const diskState = loadInstalledPluginsFromDisk()

  // 调用 for，触发插件管理此处需要的副作用。
  for (const [pluginId, diskInstallations] of Object.entries(
    diskState.plugins,
  )) {
    // memoryInstallations 集合 命名 `memoryState.plugins[pluginId]`，让后续代码直接表达这个值的用途。
    const memoryInstallations = memoryState.plugins[pluginId]
    // memoryInstallations 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!memoryInstallations) continue

    // 按顺序遍历 `diskInstallations` 中的diskEntry，逐个交给插件管理处理。
    for (const diskEntry of diskInstallations) {
      // memoryEntry筛选`memoryInstallations.find`，供插件管理后续处理使用。
      const memoryEntry = memoryInstallations.find(
        // m更新为 `>`，确保插件工具后续读取最新状态。
        m =>
          m.scope === diskEntry.scope &&
          m.projectPath === diskEntry.projectPath,
      )
      // `memoryEntry && memoryEntry.installPath` 与 `diskEn` 不一致时刷新派生状态，避免使用过期结果。
      if (memoryEntry && memoryEntry.installPath !== diskEntry.installPath) {
        // 返回 `true // Disk has different version than memory`，作为插件管理这次计算的结果。
        return true // Disk has different version than memory
      }
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Get the count of pending updates (installations where disk differs from memory).
 *
 * @returns Number of installations with pending updates
 */
// getPendingUpdateCount 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPendingUpdateCount(): number {
  // count 数量保存`0`，供后续判断或组装使用。
  let count = 0
  // memoryState 状态读取`getInMemoryInstalledPlugins`，供插件管理后续处理使用。
  const memoryState = getInMemoryInstalledPlugins()
  // diskState 状态读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const diskState = loadInstalledPluginsFromDisk()

  // 调用 for，触发插件管理此处需要的副作用。
  for (const [pluginId, diskInstallations] of Object.entries(
    diskState.plugins,
  )) {
    // memoryInstallations 集合 命名 `memoryState.plugins[pluginId]`，让后续代码直接表达这个值的用途。
    const memoryInstallations = memoryState.plugins[pluginId]
    // memoryInstallations 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!memoryInstallations) continue

    // 按顺序遍历 `diskInstallations` 中的diskEntry，逐个交给插件管理处理。
    for (const diskEntry of diskInstallations) {
      // memoryEntry筛选`memoryInstallations.find`，供插件管理后续处理使用。
      const memoryEntry = memoryInstallations.find(
        // m更新为 `>`，确保插件工具后续读取最新状态。
        m =>
          m.scope === diskEntry.scope &&
          m.projectPath === diskEntry.projectPath,
      )
      // `memoryEntry && memoryEntry.installPath` 与 `diskEn` 不一致时刷新派生状态，避免使用过期结果。
      if (memoryEntry && memoryEntry.installPath !== diskEntry.installPath) {
        // 插件工具 installed Plugins Manager在这里处理 `count++`，完成这一小步状态转换。
        count++
      }
    }
  }

  // 返回 `count`，作为插件管理这次计算的结果。
  return count
}

/**
 * Get details about pending updates for display.
 *
 * @returns Array of objects with pluginId, scope, oldVersion, newVersion
 */
// getPendingUpdatesDetails 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPendingUpdatesDetails(): Array<{
  pluginId: string
  scope: string
  oldVersion: string
  newVersion: string
}> {
  // updates 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const updates: Array<{
    pluginId: string
    scope: string
    oldVersion: string
    newVersion: string
  }> = []

  // memoryState 状态读取`getInMemoryInstalledPlugins`，供插件管理后续处理使用。
  const memoryState = getInMemoryInstalledPlugins()
  // diskState 状态读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const diskState = loadInstalledPluginsFromDisk()

  // 调用 for，触发插件管理此处需要的副作用。
  for (const [pluginId, diskInstallations] of Object.entries(
    diskState.plugins,
  )) {
    // memoryInstallations 集合 命名 `memoryState.plugins[pluginId]`，让后续代码直接表达这个值的用途。
    const memoryInstallations = memoryState.plugins[pluginId]
    // memoryInstallations 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!memoryInstallations) continue

    // 按顺序遍历 `diskInstallations` 中的diskEntry，逐个交给插件管理处理。
    for (const diskEntry of diskInstallations) {
      // memoryEntry筛选`memoryInstallations.find`，供插件管理后续处理使用。
      const memoryEntry = memoryInstallations.find(
        // m更新为 `>`，确保插件工具后续读取最新状态。
        m =>
          m.scope === diskEntry.scope &&
          m.projectPath === diskEntry.projectPath,
      )
      // `memoryEntry && memoryEntry.installPath` 与 `diskEn` 不一致时刷新派生状态，避免使用过期结果。
      if (memoryEntry && memoryEntry.installPath !== diskEntry.installPath) {
        // updates 集合追加新条目，保持收集顺序与输入顺序一致。
        updates.push({
          pluginId,
          scope: diskEntry.scope,
          oldVersion: memoryEntry.version || 'unknown',
          newVersion: diskEntry.version || 'unknown',
        })
      }
    }
  }

  // 返回 `updates`，作为插件管理这次计算的结果。
  return updates
}

/**
 * Reset the in-memory session state.
 * This should only be called at startup or for testing.
 */
// resetInMemoryState 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetInMemoryState(): void {
  // inMemoryInstalledPlugins 插件数据更新为 `null`，确保插件工具后续读取最新状态。
  inMemoryInstalledPlugins = null
}

/**
 * Initialize the versioned plugins system.
 * This triggers V1→V2 migration and initializes the in-memory session state.
 *
 * This should be called early during startup in all modes (REPL and headless).
 *
 * @returns Promise that resolves when initialization is complete
 */
// initializeVersionedPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initializeVersionedPlugins(): Promise<void> {
  // Step 1: Migrate to single file format (consolidates V1/V2 files, cleans up legacy cache)
  // 调用 migrateToSinglePluginFile，触发插件管理此处需要的副作用。
  migrateToSinglePluginFile()

  // Step 2: Sync enabledPlugins from settings.json to installed_plugins.json
  // This must complete before CLI exits (especially in headless mode)
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `migrateFromEnabledPlugins()` 完成，再继续插件工具 installed Plugins Manager的异步流程。
    await migrateFromEnabledPlugins()
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }

  // Step 3: Initialize in-memory session state
  // Calling getInMemoryInstalledPlugins triggers:
  // 1. Loading from disk
  // 2. Caching in inMemoryInstalledPlugins for session state
  // data读取`getInMemoryInstalledPlugins`，供插件管理后续处理使用。
  const data = getInMemoryInstalledPlugins()
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Initialized versioned plugins system with ${Object.keys(data.plugins).length} plugins`,
  )
}

/**
 * Remove all plugin entries belonging to a specific marketplace from installed_plugins.json.
 *
 * Loads V2 data once, finds all plugin IDs matching the `@{marketplaceName}` suffix,
 * collects their install paths, removes the entries, and saves once.
 *
 * @param marketplaceName - The marketplace name (matched against `@{name}` suffix)
 * @returns orphanedPaths (for markPluginVersionOrphaned) and removedPluginIds
 *   (for deletePluginOptions) from the removed entries
 */
// removeAllPluginsForMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeAllPluginsForMarketplace(marketplaceName: string): {
  orphanedPaths: string[]
  removedPluginIds: string[]
} {
  // marketplaceName 市场数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!marketplaceName) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { orphanedPaths: [], removedPluginIds: [] }
  }

  // data读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const data = loadInstalledPluginsFromDisk()
  // suffix固定为 ``@${marketplaceName}``，作为插件工具 installed Plugins Manager后续展示或比较的基准。
  const suffix = `@${marketplaceName}`
  // orphanedPaths 路径数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const orphanedPaths = new Set<string>()
  // removedPluginIds 插件数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const removedPluginIds: string[] = []

  // 逐项读取 `Object.keys(data.plugins)` 中的pluginId 插件数据，按输入顺序推进插件管理。
  for (const pluginId of Object.keys(data.plugins)) {
    // 满足 `!pluginId.endsWith(suffix)` 时，插件管理执行该分支。
    if (!pluginId.endsWith(suffix)) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }

    // 按顺序遍历 `data.plugins[pluginId] ?? []` 中的entry，逐个交给插件管理处理。
    for (const entry of data.plugins[pluginId] ?? []) {
      // 满足 `entry.installPath` 时，插件管理执行该分支。
      if (entry.installPath) {
        // 调用 orphanedPaths.add，触发插件管理此处需要的副作用。
        orphanedPaths.add(entry.installPath)
      }
    }

    // 插件工具 installed Plugins Manager在这里处理 `delete data.plugins[pluginId]`，完成这一小步状态转换。
    delete data.plugins[pluginId]
    // removedPluginIds 插件数据追加新条目，保持收集顺序与输入顺序一致。
    removedPluginIds.push(pluginId)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Removed installed plugin for marketplace removal: ${pluginId}`,
    )
  }

  // 满足 `removedPluginIds.length > 0` 时，插件管理执行该分支。
  if (removedPluginIds.length > 0) {
    // 调用 saveInstalledPluginsV2，触发插件管理此处需要的副作用。
    saveInstalledPluginsV2(data)
  }

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { orphanedPaths: Array.from(orphanedPaths), removedPluginIds }
}

/**
 * Predicate: is this installation relevant to the current project context?
 *
 * V2 installed_plugins.json may contain project-scoped entries from OTHER
 * projects (a single user-level file tracks all scopes). Callers asking
 * "is this plugin installed" almost always mean "installed in a way that's
 * active here" — not "installed anywhere on this machine". See #29608:
 * DiscoverPlugins.tsx was hiding plugins that were only installed in an
 * unrelated project.
 *
 * - user/managed scopes: always relevant (global)
 * - project/local scopes: only if projectPath matches the current project
 *
 * getOriginalCwd() (not getCwd()) because "current project" is where Claude
 * Code was launched from, not wherever the working directory has drifted to.
 */
// isInstallationRelevantToCurrentProject 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInstallationRelevantToCurrentProject(
  inst: PluginInstallationEntry,
): boolean {
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    inst.scope === 'user' ||
    inst.scope === 'managed' ||
    inst.projectPath === getOriginalCwd()
  )
}

/**
 * Check if a plugin is installed in a way relevant to the current project.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @returns True if the plugin has a user/managed-scoped installation, OR a
 *   project/local-scoped installation whose projectPath matches the current
 *   project. Returns false for plugins only installed in other projects.
 */
// isPluginInstalled 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPluginInstalled(pluginId: string): boolean {
  // v2Data读取`loadInstalledPluginsV2`，供插件管理后续处理使用。
  const v2Data = loadInstalledPluginsV2()
  // installations 集合 命名 `v2Data.plugins[pluginId]`，让后续代码直接表达这个值的用途。
  const installations = v2Data.plugins[pluginId]
  // !installations || installations 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (!installations || installations.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `!installations.some(isInstallationRelevantToCurrentProject)` 时，插件管理执行该分支。
  if (!installations.some(isInstallationRelevantToCurrentProject)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Plugins are loaded from settings.enabledPlugins
  // If settings.enabledPlugins and installed_plugins.json diverge
  // (via settings.json clobber), return false
  // 返回 `getSettings_DEPRECATED().enabledPlugins?.[pluginId] !== undefined`，作为插件管理这次计算的结果。
  return getSettings_DEPRECATED().enabledPlugins?.[pluginId] !== undefined
}

/**
 * True only if the plugin has a USER or MANAGED scope installation.
 *
 * Use this in UI flows that decide whether to offer installation at all.
 * A user/managed-scope install means the plugin is available everywhere —
 * there's nothing the user can add. A project/local-scope install means the
 * user might still want to install at user scope to make it global.
 *
 * gh-29997 / gh-29240 / gh-29392: the browse UI was blocking on
 * isPluginInstalled() which returns true for project-scope installs,
 * preventing users from adding a user-scope entry for the same plugin.
 * The backend (installPluginOp → addInstalledPlugin) already supports
 * multiple scope entries per plugin — only the UI gate was wrong.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 */
// isPluginGloballyInstalled 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPluginGloballyInstalled(pluginId: string): boolean {
  // v2Data读取`loadInstalledPluginsV2`，供插件管理后续处理使用。
  const v2Data = loadInstalledPluginsV2()
  // installations 集合 命名 `v2Data.plugins[pluginId]`，让后续代码直接表达这个值的用途。
  const installations = v2Data.plugins[pluginId]
  // !installations || installations 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (!installations || installations.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // hasGlobalEntry记录 `installations.some` 是否成立，插件管理随后按该结果分支。
  const hasGlobalEntry = installations.some(
    // entry更新为 `> entry.scope === 'user' || entry.scope === 'managed'`，确保插件工具后续读取最新状态。
    entry => entry.scope === 'user' || entry.scope === 'managed',
  )
  // hasGlobalEntry缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!hasGlobalEntry) return false
  // Same settings divergence guard as isPluginInstalled — if enabledPlugins
  // was clobbered, treat as not-installed so the user can re-enable.
  // 返回 `getSettings_DEPRECATED().enabledPlugins?.[pluginId] !== undefined`，作为插件管理这次计算的结果。
  return getSettings_DEPRECATED().enabledPlugins?.[pluginId] !== undefined
}

/**
 * Add or update a plugin's installation metadata
 *
 * Implements double-write: updates both V1 and V2 files.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @param metadata - Installation metadata
 * @param scope - Installation scope (defaults to 'user' for backward compatibility)
 * @param projectPath - Project path (for project/local scopes)
 */
// addInstalledPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addInstalledPlugin(
  pluginId: string,
  metadata: InstalledPlugin,
  scope: PersistableScope = 'user',
  projectPath?: string,
): void {
  // v2Data读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const v2Data = loadInstalledPluginsFromDisk()
  // v2Entry 集中保存插件工具 installed Plugins Manager要一起传递的字段。
  const v2Entry: PluginInstallationEntry = {
    scope,
    installPath: metadata.installPath,
    version: metadata.version,
    installedAt: metadata.installedAt,
    lastUpdated: metadata.lastUpdated,
    gitCommitSha: metadata.gitCommitSha,
    ...(projectPath && { projectPath }),
  }

  // Get or create array for this plugin (preserves other scope installations)
  // installations 集合标记插件工具 installed Plugins Manager是否启用对应路径。
  const installations = v2Data.plugins[pluginId] || []

  // Find existing entry for this scope+projectPath
  // existingIndex 索引筛选`installations.findIndex`，供插件管理后续处理使用。
  const existingIndex = installations.findIndex(
    // entry更新为 `> entry.scope === scope && entry.projectPath === projectP...`，确保插件工具后续读取最新状态。
    entry => entry.scope === scope && entry.projectPath === projectPath,
  )

  // isUpdate标记插件工具 installed Plugins Manager是否启用对应路径。
  const isUpdate = existingIndex >= 0
  // 满足 `isUpdate` 时，插件管理执行该分支。
  if (isUpdate) {
    // installations[existingIndex 索引更新为 `v2Entry`，确保插件工具 installed Plugins Manager后续读取最新状态。
    installations[existingIndex] = v2Entry
  } else {
    // installations 集合追加新条目，保持收集顺序与输入顺序一致。
    installations.push(v2Entry)
  }

  // plugins[pluginId 插件数据更新为 `installations`，确保插件工具 installed Plugins Manager后续读取最新状态。
  v2Data.plugins[pluginId] = installations
  // 调用 saveInstalledPluginsV2，触发插件管理此处需要的副作用。
  saveInstalledPluginsV2(v2Data)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `${isUpdate ? 'Updated' : 'Added'} installed plugin: ${pluginId} (scope: ${scope})`,
  )
}

/**
 * Remove a plugin from the installed plugins registry
 * This should be called when a plugin is uninstalled.
 *
 * Note: This function only updates the registry file. To fully uninstall,
 * call deletePluginCache() afterward to remove the physical files.
 *
 * @param pluginId - Plugin ID in "plugin@marketplace" format
 * @returns The removed plugin metadata, or undefined if it wasn't installed
 */
// removeInstalledPlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeInstalledPlugin(
  pluginId: string,
): InstalledPlugin | undefined {
  // v2Data读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const v2Data = loadInstalledPluginsFromDisk()
  // installations 集合 命名 `v2Data.plugins[pluginId]`，让后续代码直接表达这个值的用途。
  const installations = v2Data.plugins[pluginId]

  // !installations || installations 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (!installations || installations.length === 0) {
    // 返回 `undefined`，作为插件管理这次计算的结果。
    return undefined
  }

  // Extract V1-compatible metadata from first installation for return value
  // firstInstall读取 `installations[0]` 对应条目，后续围绕该成员继续处理。
  const firstInstall = installations[0]
  // metadata 命名 `firstInstall`，让后续代码直接表达这个值的用途。
  const metadata: InstalledPlugin | undefined = firstInstall
    ? {
        version: firstInstall.version || 'unknown',
        installedAt: firstInstall.installedAt || new Date().toISOString(),
        lastUpdated: firstInstall.lastUpdated,
        installPath: firstInstall.installPath,
        gitCommitSha: firstInstall.gitCommitSha,
      }
    : undefined

  // 插件工具 installed Plugins Manager在这里处理 `delete v2Data.plugins[pluginId]`，完成这一小步状态转换。
  delete v2Data.plugins[pluginId]
  // 调用 saveInstalledPluginsV2，触发插件管理此处需要的副作用。
  saveInstalledPluginsV2(v2Data)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Removed installed plugin: ${pluginId}`)

  // 返回 `metadata`，作为插件管理这次计算的结果。
  return metadata
}

/**
 * Delete a plugin's cache directory
 * This physically removes the plugin files from disk
 *
 * @param installPath - Absolute path to the plugin's cache directory
 */
/**
 * Export getGitCommitSha for use by pluginInstallationHelpers
 */
// 重新导出这一组成员，让插件管理的公共 API 保持集中入口。
export { getGitCommitSha }

// deletePluginCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function deletePluginCache(installPath: string): void {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 调用 fs.rmSync，触发插件管理此处需要的副作用。
    fs.rmSync(installPath, { recursive: true, force: true })
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Deleted plugin cache at ${installPath}`)

    // Clean up empty parent plugin directory (cache/{marketplace}/{plugin})
    // Versioned paths have structure: cache/{marketplace}/{plugin}/{version}
    // cachePath 路径数据读取`getPluginCachePath`，供插件管理后续处理使用。
    const cachePath = getPluginCachePath()
    // 只有 `installPath.includes('/cache/') && installPath.startsWith(cachePath)` 满足时，插件管理才执行该分支。
    if (installPath.includes('/cache/') && installPath.startsWith(cachePath)) {
      // pluginDir 插件数据保存`dirname`，供插件管理后续处理使用。
      const pluginDir = dirname(installPath) // e.g., cache/{marketplace}/{plugin}
      // `pluginDir` 与 `cachePath && pluginDir.startsWi...` 不一致时刷新派生状态，避免使用过期结果。
      if (pluginDir !== cachePath && pluginDir.startsWith(cachePath)) {
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // contents 集合读取`fs.readdirSync`，供插件管理后续处理使用。
          const contents = fs.readdirSync(pluginDir)
          // contents 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
          if (contents.length === 0) {
            // 调用 fs.rmdirSync，触发插件管理此处需要的副作用。
            fs.rmdirSync(pluginDir)
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`Deleted empty plugin directory at ${pluginDir}`)
          }
        } catch {
          // Parent dir doesn't exist or isn't readable — skip cleanup
        }
      }
    }
  } catch (error) {
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = errorMessage(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(toError(error))
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Failed to delete plugin cache at ${installPath}: ${errorMsg}`,
    )
  }
}

/**
 * Get the git commit SHA from a git repository directory
 * Returns undefined if not a git repo or if operation fails
 */
// getGitCommitSha 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getGitCommitSha(dirPath: string): Promise<string | undefined> {
  // sha读取`getHeadForDir`，供插件管理后续处理使用。
  const sha = await getHeadForDir(dirPath)
  // 返回 `sha ?? undefined`，作为插件管理这次计算的结果。
  return sha ?? undefined
}

/**
 * Try to read version from plugin manifest
 */
// getPluginVersionFromManifest 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPluginVersionFromManifest(
  pluginCachePath: string,
  pluginId: string,
): string {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // manifestPath 路径数据格式化`join`，供插件管理后续处理使用。
  const manifestPath = join(pluginCachePath, '.claude-plugin', 'plugin.json')

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // manifestContent读取`fs.readFileSync`，供插件管理后续处理使用。
    const manifestContent = fs.readFileSync(manifestPath, { encoding: 'utf-8' })
    // manifest解析`jsonParse`，供插件管理后续处理使用。
    const manifest = jsonParse(manifestContent)
    // 返回 `manifest.version || 'unknown'`，作为插件管理这次计算的结果。
    return manifest.version || 'unknown'
  } catch {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Could not read version from manifest for ${pluginId}`)
    // 返回 `'unknown'`，作为插件管理这次计算的结果。
    return 'unknown'
  }
}

/**
 * Sync installed_plugins.json with enabledPlugins from settings
 *
 * Checks the schema version and only updates if:
 * - File doesn't exist (version 0 → current)
 * - Schema version is outdated (old version → current)
 * - New plugins appear in enabledPlugins
 *
 * This version-based approach makes it easy to add new fields in the future:
 * 1. Increment CURRENT_SCHEMA_VERSION
 * 2. Add migration logic for the new version
 * 3. File is automatically updated on next startup
 *
 * For each plugin in enabledPlugins that's not in installed_plugins.json:
 * - Queries marketplace to get actual install path
 * - Extracts version from manifest if available
 * - Captures git commit SHA for git-based plugins
 *
 * Being present in enabledPlugins (whether true or false) indicates the plugin
 * has been installed. The enabled/disabled state remains in settings.json.
 */
// migrateFromEnabledPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function migrateFromEnabledPlugins(): Promise<void> {
  // Use merged settings for shouldSkipSync check
  // settings 集合读取`getSettings_DEPRECATED`，供插件管理后续处理使用。
  const settings = getSettings_DEPRECATED()
  // enabledPlugins 插件数据标记插件工具 installed Plugins Manager是否启用对应路径。
  const enabledPlugins = settings.enabledPlugins || {}

  // No plugins in settings = nothing to sync
  // Object.keys(enabledPlugins) 插件数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (Object.keys(enabledPlugins).length === 0) {
    // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check if main file exists and has V2 format
  // rawFileData 文件数据读取`readInstalledPluginsFileRaw`，供插件管理后续处理使用。
  const rawFileData = readInstalledPluginsFileRaw()
  // 文件存在标记标记插件工具 installed Plugins Manager是否启用对应路径。
  const fileExists = rawFileData !== null
  // isV2Format标记插件工具 installed Plugins Manager是否启用对应路径。
  const isV2Format = fileExists && rawFileData?.version === 2

  // If file exists with V2 format, check if we can skip the expensive migration
  // 只有 `isV2Format && rawFileData` 满足时，插件管理才执行该分支。
  if (isV2Format && rawFileData) {
    // Check if all plugins from settings already exist
    // (The expensive getPluginById/getGitCommitSha only runs for missing plugins)
    // existingData保存`InstalledPluginsFileSchemaV2`，供插件管理后续处理使用。
    const existingData = InstalledPluginsFileSchemaV2().safeParse(
      rawFileData.data,
    )

    // 满足 `existingData?.success` 时，插件管理执行该分支。
    if (existingData?.success) {
      // plugins 插件数据保存`existingData.data.plugins`，供后续判断或组装使用。
      const plugins = existingData.data.plugins
      // allPluginsExist 插件数据派生`Object.keys`，供插件管理后续处理使用。
      const allPluginsExist = Object.keys(enabledPlugins)
        // 链式调用 filter，继续加工上一行在插件管理中产生的数据。
        .filter(id => id.includes('@'))
        // 链式调用 every，继续加工上一行在插件管理中产生的数据。
        .every(id => {
          // installations 集合读取 `plugins[id]` 对应条目，后续围绕该成员继续处理。
          const installations = plugins[id]
          // 返回 `installations && installations.length > 0`，作为插件管理这次计算的结果。
          return installations && installations.length > 0
        })

      // 满足 `allPluginsExist` 时，插件管理执行该分支。
      if (allPluginsExist) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging('All plugins already exist, skipping migration')
        // 插件工具 installed Plugins Manager在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    fileExists
      ? 'Syncing installed_plugins.json with enabledPlugins from all settings.json files'
      : 'Creating installed_plugins.json from settings.json files',
  )

  // now记录时间`Date`，供插件管理后续处理使用。
  const now = new Date().toISOString()
  // projectPath 路径数据读取`getCwd`，供插件管理后续处理使用。
  const projectPath = getCwd()

  // Step 1: Build a map of pluginId -> scope from all settings.json files
  // Settings.json is the source of truth for scope
  // pluginScopeFromSettings 插件数据 命名 `new Map<`，让后续代码直接表达这个值的用途。
  const pluginScopeFromSettings = new Map<
    string,
    {
      scope: 'user' | 'project' | 'local'
      projectPath: string | undefined
    }
  >()

  // Iterate through each editable settings source (order matters: user first)
  // settingSources 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const settingSources: EditableSettingSource[] = [
    'userSettings',
    'projectSettings',
    'localSettings',
  ]

  // 按顺序遍历 `settingSources` 中的source，逐个交给插件管理处理。
  for (const source of settingSources) {
    // sourceSettings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
    const sourceSettings = getSettingsForSource(source)
    // sourceEnabledPlugins 插件数据标记插件工具 installed Plugins Manager是否启用对应路径。
    const sourceEnabledPlugins = sourceSettings?.enabledPlugins || {}

    // 逐项读取 `Object.keys(sourceEnabledPlugins)` 中的pluginId 插件数据，按输入顺序推进插件管理。
    for (const pluginId of Object.keys(sourceEnabledPlugins)) {
      // Skip non-standard plugin IDs
      // 满足 `!pluginId.includes('@')` 时，插件管理执行该分支。
      if (!pluginId.includes('@')) continue

      // Settings.json is source of truth - always update scope
      // Use the most specific scope (last one wins: local > project > user)
      // scope保存`settingSourceToScope`，供插件管理后续处理使用。
      const scope = settingSourceToScope(source)
      // pluginScopeFromSettings.set 写入新的状态值，使插件管理后续读取保持一致。
      pluginScopeFromSettings.set(pluginId, {
        scope,
        projectPath: scope === 'user' ? undefined : projectPath,
      })
    }
  }

  // Step 2: Start with existing data (or start empty if no file exists)
  // v2Plugins 插件数据 从空对象开始收集键值，后续按名称补齐内容。
  let v2Plugins: InstalledPluginsMapV2 = {}

  // 满足 `fileExists` 时，插件管理执行该分支。
  if (fileExists) {
    // File exists - load existing data
    // existingData读取`loadInstalledPluginsV2`，供插件管理后续处理使用。
    const existingData = loadInstalledPluginsV2()
    // v2Plugins 插件数据更新为 `{ ...existingData.plugins }`，确保插件工具后续读取最新状态。
    v2Plugins = { ...existingData.plugins }
  }

  // Step 3: Update V2 scopes based on settings.json (settings is source of truth)
  // updatedCount 数量保存`0`，供插件工具 installed Plugins Manager后续判断或输出使用。
  let updatedCount = 0
  // addedCount 数量保存`0`，供后续判断或组装使用。
  let addedCount = 0

  // 循环处理 `const [pluginId, scopeInfo] of pluginScopeFromSet`，让插件管理逐项把同类条目按顺序走完。
  for (const [pluginId, scopeInfo] of pluginScopeFromSettings) {
    // existingInstallations 集合 命名 `v2Plugins[pluginId]`，让后续代码直接表达这个值的用途。
    const existingInstallations = v2Plugins[pluginId]

    // 只有 `existingInstallations && existingInstallations.le` 满足时，插件管理才执行该分支。
    if (existingInstallations && existingInstallations.length > 0) {
      // Plugin exists in V2 - update scope if different (settings is source of truth)
      // existingEntry保存`existingInstallations[0]`，供插件工具 installed Plugins Manager后续判断或输出使用。
      const existingEntry = existingInstallations[0]
      // 插件管理在这里按实际状态进入对应分支。
      if (
        existingEntry &&
        (existingEntry.scope !== scopeInfo.scope ||
          existingEntry.projectPath !== scopeInfo.projectPath)
      ) {
        // scope更新为 `scopeInfo.scope`，确保插件工具后续读取最新状态。
        existingEntry.scope = scopeInfo.scope
        // 满足 `scopeInfo.projectPath` 时，插件管理执行该分支。
        if (scopeInfo.projectPath) {
          // projectPath 路径数据更新为 `scopeInfo.projectPath`，确保插件工具后续读取最新状态。
          existingEntry.projectPath = scopeInfo.projectPath
        } else {
          // 插件工具 installed Plugins Manager在这里处理 `delete existingEntry.projectPath`，完成这一小步状态转换。
          delete existingEntry.projectPath
        }
        // lastUpdated更新为 `now`，确保插件工具后续读取最新状态。
        existingEntry.lastUpdated = now
        // 插件工具 installed Plugins Manager在这里处理 `updatedCount++`，完成这一小步状态转换。
        updatedCount++
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Updated ${pluginId} scope to ${scopeInfo.scope} (settings.json is source of truth)`,
        )
      }
    } else {
      // Plugin not in V2 - try to add it by looking up in marketplace
      // 从 `parsePluginIdentifier(pluginId)` 解构 name、marketplace，减少插件工具 installed Plugins Manager对同一对象的重复访问。
      const { name: pluginName, marketplace } = parsePluginIdentifier(pluginId)

      // 只有 `!pluginName || !marketplace` 满足时，插件管理才执行该分支。
      if (!pluginName || !marketplace) {
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }

      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Looking up plugin ${pluginId} in marketplace ${marketplace}`,
        )
        // pluginInfo 插件数据读取`getPluginById`，供插件管理后续处理使用。
        const pluginInfo = await getPluginById(pluginId)
        // pluginInfo 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
        if (!pluginInfo) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Plugin ${pluginId} not found in any marketplace, skipping`,
          )
          // 跳过当前项，继续处理插件管理中的下一轮循环。
          continue
        }

        // 从 `pluginInfo` 解构 entry、marketplaceInstallLocation，减少插件工具 installed Plugins Manager对同一对象的重复访问。
        const { entry, marketplaceInstallLocation } = pluginInfo

        // installPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
        let installPath: string
        // version保存`'unknown'`，作为后续固定文本处理的输入。
        let version = 'unknown'
        // gitCommitSha保存`undefined`，作为后续未定义值处理的输入。
        let gitCommitSha: string | undefined = undefined

        // 当 `typeof entry.source` 匹配 `'string'` 时，插件管理执行对应分支。
        if (typeof entry.source === 'string') {
          // installPath 路径数据更新为 `join(marketplaceInstallLocation, entry.source)`，确保插件工具后续读取最新状态。
          installPath = join(marketplaceInstallLocation, entry.source)
          // version更新为 `getPluginVersionFromManifest(installPath, pluginId)`，确保插件工具后续读取最新状态。
          version = getPluginVersionFromManifest(installPath, pluginId)
          // gitCommitSha更新为 `await getGitCommitSha(installPath)`，确保插件工具后续读取最新状态。
          gitCommitSha = await getGitCommitSha(installPath)
        } else {
          // cachePath 路径数据读取`getPluginCachePath`，供插件管理后续处理使用。
          const cachePath = getPluginCachePath()
          // sanitizedName格式化`pluginName.replace`，供插件管理后续处理使用。
          const sanitizedName = pluginName.replace(/[^a-zA-Z0-9-_]/g, '-')
          // pluginCachePath 插件数据格式化`join`，供插件管理后续处理使用。
          const pluginCachePath = join(cachePath, sanitizedName)

          // Read the cache directory directly — readdir is the first real
          // operation, not a pre-check. Its ENOENT tells us the cache
          // doesn't exist; its result gates the manifest read below.
          // Not a TOCTOU — downstream operations handle ENOENT gracefully,
          // so a race (dir removed between readdir and read) degrades to
          // version='unknown', not a crash.
          // dirEntries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
          let dirEntries: string[]
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // dirEntries 集合更新为 `(`，确保插件工具后续读取最新状态。
            dirEntries = (
              await getFsImplementation().readdir(pluginCachePath)
            // 这个回调绑定到 ).map(e => (typeof e === 'string' ? e : e.name))，负责插件管理在该局部场景下的响应。
            ).map(e => (typeof e === 'string' ? e : e.name))
          } catch (e) {
            // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
            if (!isENOENT(e)) throw e
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `External plugin ${pluginId} not in cache, skipping`,
            )
            // 跳过当前项，继续处理插件管理中的下一轮循环。
            continue
          }

          // installPath 路径数据更新为 `pluginCachePath`，确保插件工具后续读取最新状态。
          installPath = pluginCachePath

          // Only read manifest if the .claude-plugin dir is present
          // 满足 `dirEntries.includes('.claude-plugin')` 时，插件管理执行该分支。
          if (dirEntries.includes('.claude-plugin')) {
            // version更新为 `getPluginVersionFromManifest(pluginCachePath, pluginId)`，确保插件工具后续读取最新状态。
            version = getPluginVersionFromManifest(pluginCachePath, pluginId)
          }

          // gitCommitSha更新为 `await getGitCommitSha(pluginCachePath)`，确保插件工具后续读取最新状态。
          gitCommitSha = await getGitCommitSha(pluginCachePath)
        }

        // 只有 `version === 'unknown' && entry.version` 满足时，插件管理才执行该分支。
        if (version === 'unknown' && entry.version) {
          // version更新为 `entry.version`，确保插件工具后续读取最新状态。
          version = entry.version
        }
        // 只有 `version === 'unknown' && gitCommitSha` 满足时，插件管理才执行该分支。
        if (version === 'unknown' && gitCommitSha) {
          // version更新为 `gitCommitSha.substring(0, 12)`，确保插件工具后续读取最新状态。
          version = gitCommitSha.substring(0, 12)
        }

        // v2Plugins[pluginId 插件数据更新为 `[`，确保插件工具 installed Plugins Manager后续读取最新状态。
        v2Plugins[pluginId] = [
          {
            scope: scopeInfo.scope,
            installPath: getVersionedCachePath(pluginId, version),
            version,
            installedAt: now,
            lastUpdated: now,
            gitCommitSha,
            ...(scopeInfo.projectPath && {
              projectPath: scopeInfo.projectPath,
            }),
          },
        ]

        // 插件工具 installed Plugins Manager在这里处理 `addedCount++`，完成这一小步状态转换。
        addedCount++
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Added ${pluginId} with scope ${scopeInfo.scope}`)
      } catch (error) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Failed to add plugin ${pluginId}: ${error}`)
      }
    }
  }

  // Step 4: Save to single file (V2 format)
  // 只有 `!fileExists || updatedCount > 0 || addedCount > 0` 满足时，插件管理才执行该分支。
  if (!fileExists || updatedCount > 0 || addedCount > 0) {
    // v2Data 集中保存插件工具 installed Plugins Manager要一起传递的字段。
    const v2Data: InstalledPluginsFileV2 = { version: 2, plugins: v2Plugins }
    // 调用 saveInstalledPluginsV2，触发插件管理此处需要的副作用。
    saveInstalledPluginsV2(v2Data)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Sync completed: ${addedCount} added, ${updatedCount} updated in installed_plugins.json`,
    )
  }
}
