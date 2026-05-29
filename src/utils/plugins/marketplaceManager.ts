/**
 * Marketplace manager for Claude Code plugins
 *
 * This module provides functionality to:
 * - Manage known marketplace sources (URLs, GitHub repos, npm packages, local files)
 * - Cache marketplace manifests locally for offline access
 * - Install plugins from marketplace entries
 * - Track and update marketplace configurations
 *
 * File structure managed by this module:
 * ~/.claude/
 *   └── plugins/
 *       ├── known_marketplaces.json    # Configuration of all known marketplaces
 *       └── marketplaces/              # Cache directory for marketplace data
 *           ├── my-marketplace.json    # Cached marketplace from URL source
 *           └── github-marketplace/    # Cloned repository for GitHub source
 *               └── .claude-plugin/
 *                   └── marketplace.json
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { writeFile } from 'fs/promises'
// 引入 isEqual，将 lodash-es/isEqual.js 中已经封装好的能力接到本文件流程里。
import isEqual from 'lodash-es/isEqual.js'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, dirname, isAbsolute, join, resolve, sep } from 'path'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  ConfigParseError,
  errorMessage,
  getErrnoCode,
  isENOENT,
  toError,
} from '../errors.js'
// 引入 execFileNoThrow、execFileNoThrowWithCwd，将 ../execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execFileNoThrow, execFileNoThrowWithCwd } from '../execFileNoThrow.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 gitExe，将 ../git.js 中已经封装好的能力接到本文件流程里。
import { gitExe } from '../git.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getInitialSettings,
  getSettingsForSource,
  updateSettingsForSource,
} from '../settings/settings.js'
// 类型依赖 { SettingsJson } 来自 ../settings/types.js，用于校准插件管理的数据契约。
import type { SettingsJson } from '../settings/types.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  jsonParse,
  jsonStringify,
  writeFileSync_DEPRECATED,
} from '../slowOperations.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getAddDirEnabledPlugins,
  getAddDirExtraMarketplaces,
} from './addDirPluginSettings.js'
// 引入 markPluginVersionOrphaned，将 ./cacheUtils.js 中已经封装好的能力接到本文件流程里。
import { markPluginVersionOrphaned } from './cacheUtils.js'
// 引入 classifyFetchError、logPluginFetch，将 ./fetchTelemetry.js 中已经封装好的能力接到本文件流程里。
import { classifyFetchError, logPluginFetch } from './fetchTelemetry.js'
// 引入 removeAllPluginsForMarketplace，将 ./installedPluginsManager.js 中已经封装好的能力接到本文件流程里。
import { removeAllPluginsForMarketplace } from './installedPluginsManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  extractHostFromSource,
  formatSourceForDisplay,
  getHostPatternsFromAllowlist,
  getStrictKnownMarketplaces,
  isSourceAllowedByPolicy,
  isSourceInBlocklist,
} from './marketplaceHelpers.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  OFFICIAL_MARKETPLACE_NAME,
  OFFICIAL_MARKETPLACE_SOURCE,
} from './officialMarketplace.js'
// 引入 fetchOfficialMarketplaceFromGcs，将 ./officialMarketplaceGcs.js 中已经封装好的能力接到本文件流程里。
import { fetchOfficialMarketplaceFromGcs } from './officialMarketplaceGcs.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  deletePluginDataDir,
  getPluginSeedDirs,
  getPluginsDirectory,
} from './pluginDirectories.js'
// 引入 parsePluginIdentifier，将 ./pluginIdentifier.js 中已经封装好的能力接到本文件流程里。
import { parsePluginIdentifier } from './pluginIdentifier.js'
// 引入 deletePluginOptions，将 ./pluginOptionsStorage.js 中已经封装好的能力接到本文件流程里。
import { deletePluginOptions } from './pluginOptionsStorage.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  isLocalMarketplaceSource,
  type KnownMarketplace,
  type KnownMarketplacesFile,
  KnownMarketplacesFileSchema,
  type MarketplaceSource,
  type PluginMarketplace,
  type PluginMarketplaceEntry,
  PluginMarketplaceSchema,
  validateOfficialNameSource,
} from './schemas.js'

/**
 * Result of loading and caching a marketplace
 */
// LoadedPluginMarketplace 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type LoadedPluginMarketplace = {
  marketplace: PluginMarketplace
  cachePath: string
}

/**
 * Get the path to the known marketplaces configuration file
 * Using a function instead of a constant allows proper mocking in tests
 */
// getKnownMarketplacesFile 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getKnownMarketplacesFile(): string {
  // 返回 `join(getPluginsDirectory(), 'known_marketplaces.json')`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), 'known_marketplaces.json')
}

/**
 * Get the path to the marketplaces cache directory
 * Using a function instead of a constant allows proper mocking in tests
 */
// getMarketplacesCacheDir 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMarketplacesCacheDir(): string {
  // 返回 `join(getPluginsDirectory(), 'marketplaces')`，作为插件管理这次计算的结果。
  return join(getPluginsDirectory(), 'marketplaces')
}

/**
 * Memoized inner function to get marketplace data.
 * This caches the marketplace in memory after loading from disk or network.
 */

/**
 * Clear all cached marketplace data (for testing)
 */
// clearMarketplacesCache 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMarketplacesCache(): void {
  // 调用 getMarketplace.cache?.clear?.()，完成这一处局部操作。
  getMarketplace.cache?.clear?.()
}

/**
 * Configuration for known marketplaces
 */
// KnownMarketplacesConfig 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type KnownMarketplacesConfig = KnownMarketplacesFile

/**
 * Declared marketplace entry (intent layer).
 *
 * Structurally compatible with settings `extraKnownMarketplaces` entries, but
 * adds `sourceIsFallback` for implicit built-in declarations. This is NOT a
 * settings-schema field — it's only ever set in code (never parsed from JSON).
 */
// DeclaredMarketplace 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type DeclaredMarketplace = {
  source: MarketplaceSource
  installLocation?: string
  autoUpdate?: boolean
  /**
   * Presence suffices. When set, diffMarketplaces treats an already-materialized
   * entry as upToDate regardless of source shape — never reports sourceChanged.
   *
   * Used for the implicit official-marketplace declaration: we want "clone from
   * GitHub if missing", not "replace with GitHub if present under a different
   * source". Without this, a seed dir that registers the official marketplace
   * under e.g. an internal-mirror source would be stomped by a GitHub re-clone.
   */
  sourceIsFallback?: boolean
}

/**
 * Get declared marketplace intent from merged settings and --add-dir sources.
 * This is what SHOULD exist — used by the reconciler to find gaps.
 *
 * The official marketplace is implicitly declared with `sourceIsFallback: true`
 * when any enabled plugin references it.
 */
// getDeclaredMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDeclaredMarketplaces(): Record<string, DeclaredMarketplace> {
  // implicit 从空对象开始收集键值，后续按名称补齐内容。
  const implicit: Record<string, DeclaredMarketplace> = {}

  // Only the official marketplace can be implicitly declared — it's the one
  // built-in source we know. Other marketplaces have no default source to inject.
  // Explicitly-disabled entries (value: false) don't count.
  // enabledPlugins 插件数据 集中保存插件工具 marketplace Manager要一起传递的字段。
  const enabledPlugins = {
    ...getAddDirEnabledPlugins(),
    ...(getInitialSettings().enabledPlugins ?? {}),
  }
  // 循环处理 `const [pluginId, value] of Object.entries(enabledPlugins)`，让插件管理把同类条目按顺序走完。
  for (const [pluginId, value] of Object.entries(enabledPlugins)) {
    // 插件管理在这里按实际状态进入对应分支。
    if (
      value &&
      parsePluginIdentifier(pluginId).marketplace === OFFICIAL_MARKETPLACE_NAME
    ) {
      // implicit[OFFICIAL_MARKETPLACE_NAME 市场数据更新为 `{`，确保插件工具 marketplace Manager后续读取最新状态。
      implicit[OFFICIAL_MARKETPLACE_NAME] = {
        source: OFFICIAL_MARKETPLACE_SOURCE,
        sourceIsFallback: true,
      }
      // 结束这个分支或循环，避免插件管理继续落入后续路径。
      break
    }
  }

  // Lowest precedence: implicit < --add-dir < merged settings.
  // An explicit extraKnownMarketplaces entry for claude-plugins-official
  // in --add-dir or settings wins.
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    ...implicit,
    ...getAddDirExtraMarketplaces(),
    ...(getInitialSettings().extraKnownMarketplaces ?? {}),
  }
}

/**
 * Find which editable settings source declared a marketplace.
 * Checks in reverse precedence order (highest priority last) so the
 * result is the source that "wins" in the merged view.
 * Returns null if the marketplace isn't declared in any editable source.
 */
// getMarketplaceDeclaringSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMarketplaceDeclaringSource(
  name: string,
): 'userSettings' | 'projectSettings' | 'localSettings' | null {
  // Check highest-precedence editable sources first — the one that wins
  // in the merged view is the one we should write back to.
  // editableSources 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const editableSources: Array<
    'localSettings' | 'projectSettings' | 'userSettings'
  > = ['localSettings', 'projectSettings', 'userSettings']

  // 按顺序遍历 `editableSources` 中的source，逐个交给插件管理处理。
  for (const source of editableSources) {
    // settings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
    const settings = getSettingsForSource(source)
    // 满足 `settings?.extraKnownMarketplaces?.[name]` 时，插件管理执行该分支。
    if (settings?.extraKnownMarketplaces?.[name]) {
      // 返回 `source`，作为插件管理这次计算的结果。
      return source
    }
  }
  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * Save a marketplace entry to settings (intent layer).
 * Does NOT touch known_marketplaces.json (state layer).
 *
 * @param name - The marketplace name
 * @param entry - The marketplace config
 * @param settingSource - Which settings source to write to (defaults to userSettings)
 */
// saveMarketplaceToSettings 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveMarketplaceToSettings(
  name: string,
  entry: DeclaredMarketplace,
  settingSource:
    | 'userSettings'
    | 'projectSettings'
    | 'localSettings' = 'userSettings',
): void {
  // existing读取`getSettingsForSource`，供插件管理后续处理使用。
  const existing = getSettingsForSource(settingSource) ?? {}
  // current 集中保存插件工具 marketplace Manager要一起传递的字段。
  const current = { ...existing.extraKnownMarketplaces }
  // current[name更新为 `entry`，确保插件工具 marketplace Manager后续读取最新状态。
  current[name] = entry
  // 调用 updateSettingsForSource，触发插件管理此处需要的副作用。
  updateSettingsForSource(settingSource, { extraKnownMarketplaces: current })
}

/**
 * Load known marketplaces configuration from disk
 *
 * Reads the configuration file at ~/.claude/plugins/known_marketplaces.json
 * which contains a mapping of marketplace names to their sources and metadata.
 *
 * Example configuration file content:
 * ```json
 * {
 *   "official-marketplace": {
 *     "source": { "source": "url", "url": "https://example.com/marketplace.json" },
 *     "installLocation": "/Users/me/.claude/plugins/marketplaces/official-marketplace.json",
 *     "lastUpdated": "2024-01-15T10:30:00.000Z"
 *   },
 *   "company-plugins": {
 *     "source": { "source": "github", "repo": "mycompany/plugins" },
 *     "installLocation": "/Users/me/.claude/plugins/marketplaces/company-plugins",
 *     "lastUpdated": "2024-01-14T15:45:00.000Z"
 *   }
 * }
 * ```
 *
 * @returns Configuration object mapping marketplace names to their metadata
 */
// loadKnownMarketplacesConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadKnownMarketplacesConfig(): Promise<KnownMarketplacesConfig> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // configFile 文件数据读取`getKnownMarketplacesFile`，供插件管理后续处理使用。
  const configFile = getKnownMarketplacesFile()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
    const content = await fs.readFile(configFile, {
      encoding: 'utf-8',
    })
    // data解析`jsonParse`，供插件管理后续处理使用。
    const data = jsonParse(content)
    // Validate against schema
    // 解析结果保存`KnownMarketplacesFileSchema`，供插件管理后续处理使用。
    const parsed = KnownMarketplacesFileSchema().safeParse(data)
    // parsed.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!parsed.success) {
      // errorMsg 错误信息派生`issues.map`，供插件管理后续处理使用。
      const errorMsg = `Marketplace configuration file is corrupted: ${parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(errorMsg, {
        level: 'error',
      })
      // 抛出 new ConfigParseError(errorMsg, configFile, data)，阻止插件管理在无效状态下继续运行。
      throw new ConfigParseError(errorMsg, configFile, data)
    }
    // 返回 `parsed.data`，作为插件管理这次计算的结果。
    return parsed.data
  } catch (error) {
    // 满足 `isENOENT(error)` 时，插件管理执行该分支。
    if (isENOENT(error)) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {}
    }
    // If it's already a ConfigParseError, re-throw it
    // 满足 `error instanceof ConfigParseError` 时，插件管理执行该分支。
    if (error instanceof ConfigParseError) {
      // 抛出 error，阻止插件管理在无效状态下继续运行。
      throw error
    }
    // For JSON parse errors or I/O errors, throw with helpful message
    // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
    const errorMsg = `Failed to load marketplace configuration: ${errorMessage(error)}`
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(errorMsg, {
      level: 'error',
    })
    // 抛出 new Error(errorMsg)，阻止插件管理在无效状态下继续运行。
    throw new Error(errorMsg)
  }
}

/**
 * Load known marketplaces config, returning {} on any error instead of throwing.
 *
 * Use this on read-only paths (plugin loading, feature checks) where a corrupted
 * config should degrade gracefully rather than crash. DO NOT use on load→mutate→save
 * paths — returning {} there would cause the save to overwrite the corrupted file
 * with just the new entry, permanently destroying the user's other entries. The
 * throwing variant preserves the file so the user can fix the corruption and recover.
 */
// loadKnownMarketplacesConfigSafe 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadKnownMarketplacesConfigSafe(): Promise<KnownMarketplacesConfig> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `loadKnownMarketplacesConfig()`，调用方直接接收异步结果。
    return await loadKnownMarketplacesConfig()
  } catch {
    // Inner function already logged via logForDebugging. Don't logError here —
    // corrupted user config isn't a Claude Code bug, shouldn't hit the error file.
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {}
  }
}

/**
 * Save known marketplaces configuration to disk
 *
 * Writes the configuration to ~/.claude/plugins/known_marketplaces.json,
 * creating the directory structure if it doesn't exist.
 *
 * @param config - The marketplace configuration to save
 */
// saveKnownMarketplacesConfig 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveKnownMarketplacesConfig(
  config: KnownMarketplacesConfig,
): Promise<void> {
  // Validate before saving
  // 解析结果保存`KnownMarketplacesFileSchema`，供插件管理后续处理使用。
  const parsed = KnownMarketplacesFileSchema().safeParse(config)
  // configFile 文件数据读取`getKnownMarketplacesFile`，供插件管理后续处理使用。
  const configFile = getKnownMarketplacesFile()

  // parsed.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!parsed.success) {
    // 抛出 new ConfigParseError(，阻止插件管理在无效状态下继续运行。
    throw new ConfigParseError(
      `Invalid marketplace config: ${parsed.error.message}`,
      configFile,
      config,
    )
  }

  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // Get directory from config file path to ensure consistency
  // dir格式化`join`，供插件管理后续处理使用。
  const dir = join(configFile, '..')
  // 等待 `fs.mkdir(dir)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await fs.mkdir(dir)
  // 调用 writeFileSync_DEPRECATED，触发插件管理此处需要的副作用。
  writeFileSync_DEPRECATED(configFile, jsonStringify(parsed.data, null, 2), {
    encoding: 'utf-8',
    flush: true,
  })
}

/**
 * Register marketplaces from the read-only seed directories into the primary
 * known_marketplaces.json.
 *
 * The seed's known_marketplaces.json contains installLocation paths pointing
 * into the seed dir itself. Registering those entries into the primary JSON
 * makes them visible to all marketplace readers (getMarketplaceCacheOnly,
 * getPluginByIdCacheOnly, etc.) without any loader changes — they just follow
 * the installLocation wherever it points.
 *
 * Seed entries always win for marketplaces declared in the seed — the seed is
 * admin-managed (baked into the container image). If admin updates the seed
 * in a new image, those changes propagate on next boot. Users opt out of seed
 * plugins via `plugin disable`, not by removing the marketplace.
 *
 * With multiple seed dirs (path-delimiter-separated), first-seed-wins: a
 * marketplace name claimed by an earlier seed is skipped by later seeds.
 *
 * autoUpdate is forced to false since the seed is read-only and git-pull would
 * fail. installLocation is computed from the runtime seedDir, not trusted from
 * the seed's JSON (handles multi-stage Docker mount-path drift).
 *
 * Idempotent: second call with unchanged seed writes nothing.
 *
 * @returns true if any marketplace entries were written/changed (caller should
 *   clear caches so earlier plugin-load passes don't keep stale "marketplace
 *   not found" state)
 */
// registerSeedMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function registerSeedMarketplaces(): Promise<boolean> {
  // seedDirs 集合读取`getPluginSeedDirs`，供插件管理后续处理使用。
  const seedDirs = getPluginSeedDirs()
  // seedDirs 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (seedDirs.length === 0) return false

  // primary读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const primary = await loadKnownMarketplacesConfig()
  // First-seed-wins across this registration pass. Can't use the isEqual check
  // alone — two seeds with the same name will have different installLocations.
  // claimed 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const claimed = new Set<string>()
  // changed保存`0`，供插件工具 marketplace Manager后续判断或输出使用。
  let changed = 0

  // 按顺序遍历 `seedDirs` 中的seedDir，逐个交给插件管理处理。
  for (const seedDir of seedDirs) {
    // seedConfig 配置读取`readSeedKnownMarketplaces`，供插件管理后续处理使用。
    const seedConfig = await readSeedKnownMarketplaces(seedDir)
    // seedConfig 配置缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!seedConfig) continue

    // 循环处理 `const [name, seedEntry] of Object.entries(seedConfig)`，让插件管理把同类条目按顺序走完。
    for (const [name, seedEntry] of Object.entries(seedConfig)) {
      // 满足 `claimed.has(name)` 时，插件管理执行该分支。
      if (claimed.has(name)) continue

      // Compute installLocation relative to THIS seedDir, not the build-time
      // path baked into the seed's JSON. Handles multi-stage Docker builds
      // where the seed is mounted at a different path than where it was built.
      // resolvedLocation筛选`findSeedMarketplaceLocation`，供插件管理后续处理使用。
      const resolvedLocation = await findSeedMarketplaceLocation(seedDir, name)
      // resolvedLocation缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!resolvedLocation) {
        // Seed content missing (incomplete build) — leave primary alone, but
        // don't claim the name either: a later seed may have working content.
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Seed marketplace '${name}' not found under ${seedDir}/marketplaces/, skipping`,
          { level: 'warn' },
        )
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // 调用 claimed.add，触发插件管理此处需要的副作用。
      claimed.add(name)

      // desired 集中保存插件工具 marketplace Manager要一起传递的字段。
      const desired: KnownMarketplace = {
        source: seedEntry.source,
        installLocation: resolvedLocation,
        lastUpdated: seedEntry.lastUpdated,
        autoUpdate: false,
      }

      // Skip if primary already matches — idempotent no-op, no write.
      // 满足 `isEqual(primary[name], desired)` 时，插件管理执行该分支。
      if (isEqual(primary[name], desired)) continue

      // Seed wins — admin-managed. Overwrite any existing primary entry.
      // primary[name更新为 `desired`，确保插件工具 marketplace Manager后续读取最新状态。
      primary[name] = desired
      // 插件工具 marketplace Manager在这里处理 `changed++`，完成这一小步状态转换。
      changed++
    }
  }

  // 满足 `changed > 0` 时，插件管理执行该分支。
  if (changed > 0) {
    // 等待 `saveKnownMarketplacesConfig(primary)` 完成，再继续插件工具 marketplace Manager的异步流程。
    await saveKnownMarketplacesConfig(primary)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Synced ${changed} marketplace(s) from seed dir(s)`)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// readSeedKnownMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readSeedKnownMarketplaces(
  seedDir: string,
): Promise<KnownMarketplacesConfig | null> {
  // seedJsonPath 路径数据格式化`join`，供插件管理后续处理使用。
  const seedJsonPath = join(seedDir, 'known_marketplaces.json')
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`getFsImplementation`，供插件管理后续处理使用。
    const content = await getFsImplementation().readFile(seedJsonPath, {
      encoding: 'utf-8',
    })
    // 解析结果保存`KnownMarketplacesFileSchema`，供插件管理后续处理使用。
    const parsed = KnownMarketplacesFileSchema().safeParse(jsonParse(content))
    // parsed.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!parsed.success) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Seed known_marketplaces.json invalid at ${seedDir}: ${parsed.error.message}`,
        { level: 'warn' },
      )
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // 返回 `parsed.data`，作为插件管理这次计算的结果。
    return parsed.data
  } catch (e) {
    // 满足 `!isENOENT(e)` 时，插件管理执行该分支。
    if (!isENOENT(e)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to read seed known_marketplaces.json at ${seedDir}: ${e}`,
        { level: 'warn' },
      )
    }
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Locate a marketplace in the seed directory by name.
 *
 * Probes the canonical locations under seedDir/marketplaces/ rather than
 * trusting the seed's stored installLocation (which may have a stale absolute
 * path from a different build-time mount point).
 *
 * @returns Readable location, or null if neither format exists/validates
 */
// findSeedMarketplaceLocation 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function findSeedMarketplaceLocation(
  seedDir: string,
  name: string,
): Promise<string | null> {
  // dirCandidate格式化`join`，供插件管理后续处理使用。
  const dirCandidate = join(seedDir, 'marketplaces', name)
  // jsonCandidate格式化`join`，供插件管理后续处理使用。
  const jsonCandidate = join(seedDir, 'marketplaces', `${name}.json`)
  // 按顺序遍历 `[dirCandidate, jsonCandidate]` 中的candidate，逐个交给插件管理处理。
  for (const candidate of [dirCandidate, jsonCandidate]) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `readCachedMarketplace(candidate)` 完成，再继续插件工具 marketplace Manager的异步流程。
      await readCachedMarketplace(candidate)
      // 返回 `candidate`，作为插件管理这次计算的结果。
      return candidate
    } catch {
      // Try next candidate
    }
  }
  // 返回 `null`，作为插件管理这次计算的结果。
  return null
}

/**
 * If installLocation points into a configured seed directory, return that seed
 * directory. Seed-managed entries are admin-controlled — users can't
 * remove/refresh/modify them (they'd be overwritten by registerSeedMarketplaces
 * on next startup). Returning the specific seed lets error messages name it.
 */
// seedDirFor 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function seedDirFor(installLocation: string): string | undefined {
  // 返回 `getPluginSeedDirs().find(`，作为插件管理这次计算的结果。
  return getPluginSeedDirs().find(
    d => installLocation === d || installLocation.startsWith(d + sep),
  )
}

/**
 * Git pull operation (exported for testing)
 *
 * Pulls latest changes with a configurable timeout (default 120s, override via CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS).
 * Provides helpful error messages for common failure scenarios.
 * If a ref is specified, fetches and checks out that specific branch or tag.
 */
// Environment variables to prevent git from prompting for credentials
// GIT_NO_PROMPT_ENV 集中保存插件工具 marketplace Manager要一起传递的字段。
const GIT_NO_PROMPT_ENV = {
  GIT_TERMINAL_PROMPT: '0', // Prevent terminal credential prompts
  GIT_ASKPASS: '', // Disable askpass GUI programs
}

// DEFAULT_PLUGIN_GIT_TIMEOUT_MS 插件数据保存`120 * 1000`，供插件工具 marketplace Manager后续判断或输出使用。
const DEFAULT_PLUGIN_GIT_TIMEOUT_MS = 120 * 1000

// getPluginGitTimeoutMs 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPluginGitTimeoutMs(): number {
  // envValue 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envValue = process.env.CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS
  // 满足 `envValue` 时，插件管理执行该分支。
  if (envValue) {
    // 解析结果解析`parseInt`，供插件管理后续处理使用。
    const parsed = parseInt(envValue, 10)
    // 只有 `!isNaN(parsed) && parsed > 0` 满足时，插件管理才执行该分支。
    if (!isNaN(parsed) && parsed > 0) {
      // 返回 `parsed`，作为插件管理这次计算的结果。
      return parsed
    }
  }
  // 返回 `DEFAULT_PLUGIN_GIT_TIMEOUT_MS`，作为插件管理这次计算的结果。
  return DEFAULT_PLUGIN_GIT_TIMEOUT_MS
}

// gitPull 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function gitPull(
  cwd: string,
  ref?: string,
  options?: { disableCredentialHelper?: boolean; sparsePaths?: string[] },
): Promise<{ code: number; stderr: string }> {
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`git pull: cwd=${cwd} ref=${ref ?? 'default'}`)
  // env 集中保存插件工具 marketplace Manager要一起传递的字段。
  const env = { ...process.env, ...GIT_NO_PROMPT_ENV }
  // credentialArgs 集合 命名 `options?.disableCredentialHelper`，让后续代码直接表达这个值的用途。
  const credentialArgs = options?.disableCredentialHelper
    ? ['-c', 'credential.helper=']
    : []

  // 满足 `ref` 时，插件管理执行该分支。
  if (ref) {
    // fetchResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
    const fetchResult = await execFileNoThrowWithCwd(
      gitExe(),
      [...credentialArgs, 'fetch', 'origin', ref],
      { cwd, timeout: getPluginGitTimeoutMs(), stdin: 'ignore', env },
    )

    // `fetchResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (fetchResult.code !== 0) {
      // 返回 `enhanceGitPullErrorMessages(fetchResult)`，作为插件管理这次计算的结果。
      return enhanceGitPullErrorMessages(fetchResult)
    }

    // checkoutResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
    const checkoutResult = await execFileNoThrowWithCwd(
      gitExe(),
      [...credentialArgs, 'checkout', ref],
      { cwd, timeout: getPluginGitTimeoutMs(), stdin: 'ignore', env },
    )

    // `checkoutResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (checkoutResult.code !== 0) {
      // 返回 `enhanceGitPullErrorMessages(checkoutResult)`，作为插件管理这次计算的结果。
      return enhanceGitPullErrorMessages(checkoutResult)
    }

    // pullResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
    const pullResult = await execFileNoThrowWithCwd(
      gitExe(),
      [...credentialArgs, 'pull', 'origin', ref],
      { cwd, timeout: getPluginGitTimeoutMs(), stdin: 'ignore', env },
    )
    // `pullResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
    if (pullResult.code !== 0) {
      // 返回 `enhanceGitPullErrorMessages(pullResult)`，作为插件管理这次计算的结果。
      return enhanceGitPullErrorMessages(pullResult)
    }
    // 等待 `gitSubmoduleUpdate(cwd, credentialArgs, env, options?.sparsePaths)` 完成，再继续插件工具 marketplace Manager的异步流程。
    await gitSubmoduleUpdate(cwd, credentialArgs, env, options?.sparsePaths)
    // 返回 `pullResult`，作为插件管理这次计算的结果。
    return pullResult
  }

  // 结果保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
  const result = await execFileNoThrowWithCwd(
    gitExe(),
    [...credentialArgs, 'pull', 'origin', 'HEAD'],
    { cwd, timeout: getPluginGitTimeoutMs(), stdin: 'ignore', env },
  )
  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 返回 `enhanceGitPullErrorMessages(result)`，作为插件管理这次计算的结果。
    return enhanceGitPullErrorMessages(result)
  }
  // 等待 `gitSubmoduleUpdate(cwd, credentialArgs, env, options?.sparsePaths)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await gitSubmoduleUpdate(cwd, credentialArgs, env, options?.sparsePaths)
  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

/**
 * Sync submodule working dirs after a successful pull. gitClone() uses
 * --recurse-submodules, but gitPull() didn't — the parent repo's submodule
 * pointer would advance while the working dir stayed at the old commit,
 * making plugin sources in submodules unresolvable after marketplace update.
 * Non-fatal: a failed submodule update logs a warning; most marketplaces
 * don't use submodules at all. (gh-30696)
 *
 * Skipped for sparse clones — gitClone's sparse path intentionally omits
 * --recurse-submodules to preserve partial-clone bandwidth savings, and
 * .gitmodules is a root file that cone-mode sparse-checkout always
 * materializes, so the .gitmodules gate alone can't distinguish sparse repos.
 *
 * Perf: git-submodule is a bash script that spawns ~20 subprocesses (~35ms+)
 * even when no submodules exist. .gitmodules is a tracked file — pull
 * materializes it iff the repo has submodules — so gate on its presence to
 * skip the spawn for the common case.
 *
 * --init performs first-contact clone of newly-added submodules, so maintain
 * parity with gitClone's non-sparse path: StrictHostKeyChecking=yes for
 * fail-closed SSH (unknown hosts reject rather than silently populate
 * known_hosts), and --depth 1 for shallow clone (matching --shallow-submodules).
 * --depth only affects not-yet-initialized submodules; existing shallow
 * submodules are unaffected.
 */
// gitSubmoduleUpdate 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function gitSubmoduleUpdate(
  cwd: string,
  credentialArgs: string[],
  env: NodeJS.ProcessEnv,
  sparsePaths: string[] | undefined,
): Promise<void> {
  // 只有 `sparsePaths && sparsePaths.length > 0` 满足时，插件管理才执行该分支。
  if (sparsePaths && sparsePaths.length > 0) return
  // hasGitmodules 集合记录 `getFsImplementation` 是否成立，插件管理随后按该结果分支。
  const hasGitmodules = await getFsImplementation()
    .stat(join(cwd, '.gitmodules'))
    .then(
      // 这个回调绑定到 () => true,，负责插件管理在该局部场景下的响应。
      () => true,
      // 这个回调绑定到 () => false,，负责插件管理在该局部场景下的响应。
      () => false,
    )
  // hasGitmodules 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!hasGitmodules) return
  // 结果保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
  const result = await execFileNoThrowWithCwd(
    gitExe(),
    [
      '-c',
      'core.sshCommand=ssh -o BatchMode=yes -o StrictHostKeyChecking=yes',
      ...credentialArgs,
      'submodule',
      'update',
      '--init',
      '--recursive',
      '--depth',
      '1',
    ],
    { cwd, timeout: getPluginGitTimeoutMs(), stdin: 'ignore', env },
  )
  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `git submodule update failed (non-fatal): ${result.stderr}`,
      { level: 'warn' },
    )
  }
}

/**
 * Enhance error messages for git pull failures
 */
// enhanceGitPullErrorMessages 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function enhanceGitPullErrorMessages(result: {
  code: number
  stderr: string
  error?: string
}): { code: number; stderr: string } {
  // 满足 `result.code === 0` 时，插件管理执行该分支。
  if (result.code === 0) {
    // 返回 `result`，作为插件管理这次计算的结果。
    return result
  }

  // Detect execa timeout kills via the error field (stderr won't contain "timed out"
  // when the process is killed by SIGTERM — the timeout info is only in error)
  // 满足 `result.error?.includes('timed out')` 时，插件管理执行该分支。
  if (result.error?.includes('timed out')) {
    // timeoutSec保存`Math.round`，供插件管理后续处理使用。
    const timeoutSec = Math.round(getPluginGitTimeoutMs() / 1000)
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...result,
      stderr: `Git pull timed out after ${timeoutSec}s. Try increasing the timeout via CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS environment variable.\n\nOriginal error: ${result.stderr}`,
    }
  }

  // Detect SSH host key verification failures (check before the generic
  // 'Could not read from remote' catch — that string appears in both cases).
  // OpenSSH emits "Host key verification failed" for BOTH host-not-in-known_hosts
  // and host-key-has-changed — the latter also includes the "REMOTE HOST
  // IDENTIFICATION HAS CHANGED" banner, which needs different remediation.
  // 满足 `result.stderr.includes('REMOTE HOST IDENTIFICATION HAS CHANGED')` 时，插件管理执行该分支。
  if (result.stderr.includes('REMOTE HOST IDENTIFICATION HAS CHANGED')) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...result,
      stderr: `SSH host key for this marketplace's git host has changed (server key rotation or possible MITM). Remove the stale entry with: ssh-keygen -R <host>\nThen connect once manually to accept the new key.\n\nOriginal error: ${result.stderr}`,
    }
  }
  // 满足 `result.stderr.includes('Host key verification failed')` 时，插件管理执行该分支。
  if (result.stderr.includes('Host key verification failed')) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...result,
      stderr: `SSH host key verification failed while updating marketplace. The host key is not in your known_hosts file. Connect once manually to add it (e.g., ssh -T git@<host>), or remove and re-add the marketplace with an HTTPS URL.\n\nOriginal error: ${result.stderr}`,
    }
  }

  // Detect SSH authentication failures
  // 插件管理在这里按实际状态进入对应分支。
  if (
    result.stderr.includes('Permission denied (publickey)') ||
    result.stderr.includes('Could not read from remote repository')
  ) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...result,
      stderr: `SSH authentication failed while updating marketplace. Please ensure your SSH keys are configured.\n\nOriginal error: ${result.stderr}`,
    }
  }

  // Detect network issues
  // 插件管理在这里按实际状态进入对应分支。
  if (
    result.stderr.includes('timed out') ||
    result.stderr.includes('Could not resolve host')
  ) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...result,
      stderr: `Network error while updating marketplace. Please check your internet connection.\n\nOriginal error: ${result.stderr}`,
    }
  }

  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

/**
 * Check if SSH is likely to work for GitHub
 * This is a quick heuristic check that avoids the full clone timeout
 *
 * Uses StrictHostKeyChecking=yes (not accept-new) so an unknown github.com
 * host key fails closed rather than being silently added to known_hosts.
 * This prevents a network-level MITM from poisoning known_hosts on first
 * contact. Users who already have github.com in known_hosts see no change;
 * users who don't are routed to the HTTPS clone path.
 *
 * @returns true if SSH auth succeeds and github.com is already trusted
 */
// isGitHubSshLikelyConfigured 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function isGitHubSshLikelyConfigured(): Promise<boolean> {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // Quick SSH connection test with 2 second timeout
    // This fails fast if SSH isn't configured
    // 结果保存`execFileNoThrow`，供插件管理后续处理使用。
    const result = await execFileNoThrow(
      'ssh',
      [
        '-T',
        '-o',
        'BatchMode=yes',
        '-o',
        'ConnectTimeout=2',
        '-o',
        'StrictHostKeyChecking=yes',
        'git@github.com',
      ],
      {
        timeout: 3000, // 3 second total timeout
      },
    )

    // SSH to github.com always returns exit code 1 with "successfully authenticated"
    // or exit code 255 with "Permission denied" - we want the former
    // configured 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const configured =
      result.code === 1 &&
      (result.stderr?.includes('successfully authenticated') ||
        result.stdout?.includes('successfully authenticated'))
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `SSH config check: code=${result.code} configured=${configured}`,
    )
    // 返回 `configured`，作为插件管理这次计算的结果。
    return configured
  } catch (error) {
    // Any error means SSH isn't configured properly
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`SSH configuration check failed: ${errorMessage(error)}`, {
      level: 'warn',
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Check if a git error indicates authentication failure.
 * Used to provide enhanced error messages for auth failures.
 */
// isAuthenticationError 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAuthenticationError(stderr: string): boolean {
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    stderr.includes('Authentication failed') ||
    stderr.includes('could not read Username') ||
    stderr.includes('terminal prompts disabled') ||
    stderr.includes('403') ||
    stderr.includes('401')
  )
}

/**
 * Extract the SSH host from a git URL for error messaging.
 * Matches the SSH format user@host:path (e.g., git@github.com:owner/repo.git).
 */
// extractSshHost 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractSshHost(gitUrl: string): string | null {
  // match匹配`gitUrl.match`，供插件管理后续处理使用。
  const match = gitUrl.match(/^[^@]+@([^:]+):/)
  // 返回 `match?.[1] ?? null`，作为插件管理这次计算的结果。
  return match?.[1] ?? null
}

/**
 * Git clone operation (exported for testing)
 *
 * Clones a git repository with a configurable timeout (default 120s, override via CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS)
 * and larger repositories. Provides helpful error messages for common failure scenarios.
 * Optionally checks out a specific branch or tag.
 *
 * Does NOT disable credential helpers — this allows the user's existing auth setup
 * (gh auth, keychain, git-credential-store, etc.) to work natively for private repos.
 * Interactive prompts are still prevented via GIT_TERMINAL_PROMPT=0, GIT_ASKPASS='',
 * stdin: 'ignore', and BatchMode=yes for SSH.
 *
 * Uses StrictHostKeyChecking=yes (not accept-new): unknown SSH hosts fail closed
 * with a clear message rather than being silently trusted on first contact. For
 * the github source type, the preflight check routes unknown-host users to HTTPS
 * automatically; for explicit git@host:… URLs, users see an actionable error.
 */
// gitClone 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function gitClone(
  gitUrl: string,
  targetPath: string,
  ref?: string,
  sparsePaths?: string[],
): Promise<{ code: number; stderr: string }> {
  // useSparse标记插件工具 marketplace Manager是否启用对应路径。
  const useSparse = sparsePaths && sparsePaths.length > 0
  // 参数列表 聚合成有序列表，保持后续遍历顺序稳定。
  const args = [
    '-c',
    'core.sshCommand=ssh -o BatchMode=yes -o StrictHostKeyChecking=yes',
    'clone',
    '--depth',
    '1',
  ]

  // 满足 `useSparse` 时，插件管理执行该分支。
  if (useSparse) {
    // Partial clone: skip blob download until checkout, defer checkout until
    // after sparse-checkout is configured. Submodules are intentionally dropped
    // for sparse clones — sparse monorepos rarely need them, and recursing
    // submodules would defeat the partial-clone bandwidth savings.
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--filter=blob:none', '--no-checkout')
  } else {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--recurse-submodules', '--shallow-submodules')
  }

  // 满足 `ref` 时，插件管理执行该分支。
  if (ref) {
    // 参数列表追加新条目，保持收集顺序与输入顺序一致。
    args.push('--branch', ref)
  }

  // 参数列表追加新条目，保持收集顺序与输入顺序一致。
  args.push(gitUrl, targetPath)

  // timeoutMs 集合读取`getPluginGitTimeoutMs`，供插件管理后续处理使用。
  const timeoutMs = getPluginGitTimeoutMs()
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `git clone: url=${redactUrlCredentials(gitUrl)} ref=${ref ?? 'default'} timeout=${timeoutMs}ms`,
  )

  // 结果保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
  const result = await execFileNoThrowWithCwd(gitExe(), args, {
    timeout: timeoutMs,
    stdin: 'ignore',
    env: { ...process.env, ...GIT_NO_PROMPT_ENV },
  })

  // Scrub credentials from execa's error/stderr fields before any logging or
  // returning. execa's shortMessage embeds the full command line (including
  // the credentialed URL), and result.stderr may also contain it on some git
  // versions.
  // redacted保存`redactUrlCredentials`，供插件管理后续处理使用。
  const redacted = redactUrlCredentials(gitUrl)
  // `gitUrl` 与 `redacted` 不一致时刷新派生状态，避免使用过期结果。
  if (gitUrl !== redacted) {
    // 满足 `result.error) result.error = result.error.replaceAll(gitUrl, redacted` 时，插件管理执行该分支。
    if (result.error) result.error = result.error.replaceAll(gitUrl, redacted)
    // 满足 `result.stderr` 时，插件管理执行该分支。
    if (result.stderr)
      // stderr更新为 `result.stderr.replaceAll(gitUrl, redacted)`，确保插件工具后续读取最新状态。
      result.stderr = result.stderr.replaceAll(gitUrl, redacted)
  }

  // 满足 `result.code === 0` 时，插件管理执行该分支。
  if (result.code === 0) {
    // 满足 `useSparse` 时，插件管理执行该分支。
    if (useSparse) {
      // Configure the sparse cone, then materialize only those paths.
      // `sparse-checkout set --cone` handles both init and path selection
      // in a single step on git >= 2.25.
      // sparseResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
      const sparseResult = await execFileNoThrowWithCwd(
        gitExe(),
        ['sparse-checkout', 'set', '--cone', '--', ...sparsePaths],
        {
          cwd: targetPath,
          timeout: timeoutMs,
          stdin: 'ignore',
          env: { ...process.env, ...GIT_NO_PROMPT_ENV },
        },
      )
      // `sparseResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (sparseResult.code !== 0) {
        // 返回结构化结果，集中表达插件管理已经整理出的状态。
        return {
          code: sparseResult.code,
          stderr: `git sparse-checkout set failed: ${sparseResult.stderr}`,
        }
      }

      // checkoutResult保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
      const checkoutResult = await execFileNoThrowWithCwd(
        gitExe(),
        // ref was already passed to clone via --branch, so HEAD points to it;
        // if no ref, HEAD points to the remote's default branch.
        ['checkout', 'HEAD'],
        {
          cwd: targetPath,
          timeout: timeoutMs,
          stdin: 'ignore',
          env: { ...process.env, ...GIT_NO_PROMPT_ENV },
        },
      )
      // `checkoutResult.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
      if (checkoutResult.code !== 0) {
        // 返回结构化结果，集中表达插件管理已经整理出的状态。
        return {
          code: checkoutResult.code,
          stderr: `git checkout after sparse-checkout failed: ${checkoutResult.stderr}`,
        }
      }
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`git clone succeeded: ${redactUrlCredentials(gitUrl)}`)
    // 返回 `result`，作为插件管理这次计算的结果。
    return result
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `git clone failed: url=${redactUrlCredentials(gitUrl)} code=${result.code} error=${result.error ?? 'none'} stderr=${result.stderr}`,
    { level: 'warn' },
  )

  // Detect timeout kills — when execFileNoThrowWithCwd kills the process via SIGTERM,
  // stderr may only contain partial output (e.g. "Cloning into '...'") with no
  // "timed out" string. Check the error field from execa which contains the
  // timeout message.
  // 满足 `result.error?.includes('timed out')` 时，插件管理执行该分支。
  if (result.error?.includes('timed out')) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      ...result,
      stderr: `Git clone timed out after ${Math.round(timeoutMs / 1000)}s. The repository may be too large for the current timeout. Set CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS to increase it (e.g., 300000 for 5 minutes).\n\nOriginal error: ${result.stderr}`,
    }
  }

  // Enhance error messages for common scenarios
  // 满足 `result.stderr` 时，插件管理执行该分支。
  if (result.stderr) {
    // Host key verification failure — check FIRST, before the generic
    // 'Could not read from remote repository' catch (that string appears
    // in both stderr outputs, so order matters). OpenSSH emits
    // "Host key verification failed" for BOTH host-not-in-known_hosts and
    // host-key-has-changed; distinguish them by the key-change banner.
    // 满足 `result.stderr.includes('REMOTE HOST IDENTIFICATION HAS CHANGED')` 时，插件管理执行该分支。
    if (result.stderr.includes('REMOTE HOST IDENTIFICATION HAS CHANGED')) {
      // host保存`extractSshHost`，供插件管理后续处理使用。
      const host = extractSshHost(gitUrl)
      // removeHint 命名 `host ? `ssh-keygen -R ${host}` : 'ssh-keygen -R <host>'`，让后续代码直接表达这个值的用途。
      const removeHint = host ? `ssh-keygen -R ${host}` : 'ssh-keygen -R <host>'
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ...result,
        stderr: `SSH host key has changed (server key rotation or possible MITM). Remove the stale known_hosts entry:\n  ${removeHint}\nThen connect once manually to verify and accept the new key.\n\nOriginal error: ${result.stderr}`,
      }
    }
    // 满足 `result.stderr.includes('Host key verification failed')` 时，插件管理执行该分支。
    if (result.stderr.includes('Host key verification failed')) {
      // host保存`extractSshHost`，供插件管理后续处理使用。
      const host = extractSshHost(gitUrl)
      // connectHint 命名 `host ? `ssh -T git@${host}` : 'ssh -T git@<host>'`，让后续代码直接表达这个值的用途。
      const connectHint = host ? `ssh -T git@${host}` : 'ssh -T git@<host>'
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ...result,
        stderr: `SSH host key is not in your known_hosts file. To add it, connect once manually (this will show the fingerprint for you to verify):\n  ${connectHint}\n\nOr use an HTTPS URL instead (recommended for public repos).\n\nOriginal error: ${result.stderr}`,
      }
    }

    // 插件管理在这里按实际状态进入对应分支。
    if (
      result.stderr.includes('Permission denied (publickey)') ||
      result.stderr.includes('Could not read from remote repository')
    ) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ...result,
        stderr: `SSH authentication failed. Please ensure your SSH keys are configured for GitHub, or use an HTTPS URL instead.\n\nOriginal error: ${result.stderr}`,
      }
    }

    // 满足 `isAuthenticationError(result.stderr)` 时，插件管理执行该分支。
    if (isAuthenticationError(result.stderr)) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ...result,
        stderr: `HTTPS authentication failed. Please ensure your credential helper is configured (e.g., gh auth login).\n\nOriginal error: ${result.stderr}`,
      }
    }

    // 插件管理在这里按实际状态进入对应分支。
    if (
      result.stderr.includes('timed out') ||
      result.stderr.includes('timeout') ||
      result.stderr.includes('Could not resolve host')
    ) {
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return {
        ...result,
        stderr: `Network error or timeout while cloning repository. Please check your internet connection and try again.\n\nOriginal error: ${result.stderr}`,
      }
    }
  }

  // Fallback for empty stderr — gh-28373: user saw "Failed to clone
  // marketplace repository:" with nothing after the colon. Git CAN fail
  // without writing to stderr (stdout instead, or output swallowed by
  // credential helper / signal). execa's error field has the execa-level
  // message (command, exit code, signal); exit code is the minimum.
  // result.stderr缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.stderr) {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      code: result.code,
      stderr:
        result.error ||
        `git clone exited with code ${result.code} (no stderr output). Run with --debug to see the full command.`,
    }
  }

  // 返回 `result`，作为插件管理这次计算的结果。
  return result
}

/**
 * Progress callback for marketplace operations.
 *
 * This callback is invoked at various stages during marketplace operations
 * (downloading, git operations, validation, etc.) to provide user feedback.
 *
 * IMPORTANT: Implementations should handle errors internally and not throw exceptions.
 * If a callback throws, it will be caught and logged but won't abort the operation.
 *
 * @param message - Human-readable progress message to display to the user
 */
// MarketplaceProgressCallback 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type MarketplaceProgressCallback = (message: string) => void

/**
 * Safely invoke a progress callback, catching and logging any errors.
 * Prevents callback errors from aborting marketplace operations.
 *
 * @param onProgress - The progress callback to invoke
 * @param message - Progress message to pass to the callback
 */
// safeCallProgress 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function safeCallProgress(
  onProgress: MarketplaceProgressCallback | undefined,
  message: string,
): void {
  // onProgress 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!onProgress) return
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 调用 onProgress，触发插件管理此处需要的副作用。
    onProgress(message)
  } catch (callbackError) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Progress callback error: ${errorMessage(callbackError)}`, {
      level: 'warn',
    })
  }
}

/**
 * Reconcile the on-disk sparse-checkout state with the desired config.
 *
 * Runs before gitPull to handle transitions:
 * - Full→Sparse or SparseA→SparseB: run `sparse-checkout set --cone` (idempotent)
 * - Sparse→Full: return non-zero so caller falls back to rm+reclone. Avoids
 *   `sparse-checkout disable` on a --filter=blob:none partial clone, which would
 *   trigger a lazy fetch of every blob in the monorepo.
 * - Full→Full (common case): single local `git config --get` check, no-op.
 *
 * Failures here (ENOENT, not a repo) are harmless — gitPull will also fail and
 * trigger the clone path, which establishes the correct state from scratch.
 */
// reconcileSparseCheckout 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function reconcileSparseCheckout(
  cwd: string,
  sparsePaths: string[] | undefined,
): Promise<{ code: number; stderr: string }> {
  // env 集中保存插件工具 marketplace Manager要一起传递的字段。
  const env = { ...process.env, ...GIT_NO_PROMPT_ENV }

  // 只有 `sparsePaths && sparsePaths.length > 0` 满足时，插件管理才执行该分支。
  if (sparsePaths && sparsePaths.length > 0) {
    // 返回 `execFileNoThrowWithCwd(`，作为插件管理这次计算的结果。
    return execFileNoThrowWithCwd(
      gitExe(),
      ['sparse-checkout', 'set', '--cone', '--', ...sparsePaths],
      { cwd, timeout: getPluginGitTimeoutMs(), stdin: 'ignore', env },
    )
  }

  // check保存`execFileNoThrowWithCwd`，供插件管理后续处理使用。
  const check = await execFileNoThrowWithCwd(
    gitExe(),
    ['config', '--get', 'core.sparseCheckout'],
    { cwd, stdin: 'ignore', env },
  )
  // 当 `check.code === 0 && check.stdout.trim()` 匹配 `'true'` 时，插件管理执行对应分支。
  if (check.code === 0 && check.stdout.trim() === 'true') {
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      code: 1,
      stderr:
        'sparsePaths removed from config but repository is sparse; re-cloning for full checkout',
    }
  }
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { code: 0, stderr: '' }
}

/**
 * Cache a marketplace from a git repository
 *
 * Clones or updates a git repository containing marketplace data.
 * If the repository already exists at cachePath, pulls the latest changes.
 * If pulling fails, removes the directory and re-clones.
 *
 * Example repository structure:
 * ```
 * my-marketplace/
 *   ├── .claude-plugin/
 *   │   └── marketplace.json    # Default location for marketplace manifest
 *   ├── plugins/                # Plugin implementations
 *   └── README.md
 * ```
 *
 * @param gitUrl - The git URL to clone (https or ssh)
 * @param cachePath - Local directory path to clone/update the repository
 * @param ref - Optional git branch or tag to checkout
 * @param onProgress - Optional callback to report progress
 */
// cacheMarketplaceFromGit 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function cacheMarketplaceFromGit(
  gitUrl: string,
  cachePath: string,
  ref?: string,
  sparsePaths?: string[],
  onProgress?: MarketplaceProgressCallback,
  options?: { disableCredentialHelper?: boolean },
): Promise<void> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()

  // Attempt incremental update; fall back to re-clone if the repo is absent,
  // stale, or otherwise not updatable. Using pull-first avoids a stat-before-operate
  // TOCTOU check: gitPull returns non-zero when cachePath is missing or has no .git.
  // timeoutSec保存`Math.round`，供插件管理后续处理使用。
  const timeoutSec = Math.round(getPluginGitTimeoutMs() / 1000)
  // 调用 safeCallProgress，触发插件管理此处需要的副作用。
  safeCallProgress(
    onProgress,
    `Refreshing marketplace cache (timeout: ${timeoutSec}s)…`,
  )

  // Reconcile sparse-checkout config before pulling. If this requires a re-clone
  // (Sparse→Full transition) or fails (missing dir, not a repo), skip straight
  // to the rm+clone fallback.
  // reconcileResult解析`reconcileSparseCheckout`，供插件管理后续处理使用。
  const reconcileResult = await reconcileSparseCheckout(cachePath, sparsePaths)
  // 满足 `reconcileResult.code === 0` 时，插件管理执行该分支。
  if (reconcileResult.code === 0) {
    // pullStarted记录时间`performance.now`，供插件管理后续处理使用。
    const pullStarted = performance.now()
    // pullResult保存`gitPull`，供插件管理后续处理使用。
    const pullResult = await gitPull(cachePath, ref, {
      disableCredentialHelper: options?.disableCredentialHelper,
      sparsePaths,
    })
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch(
      'marketplace_pull',
      gitUrl,
      pullResult.code === 0 ? 'success' : 'failure',
      performance.now() - pullStarted,
      pullResult.code === 0 ? undefined : classifyFetchError(pullResult.stderr),
    )
    // 满足 `pullResult.code === 0` 时，插件管理执行该分支。
    if (pullResult.code === 0) return
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`git pull failed, will re-clone: ${pullResult.stderr}`, {
      level: 'warn',
    })
  } else {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `sparse-checkout reconcile requires re-clone: ${reconcileResult.stderr}`,
    )
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fs.rm(cachePath, { recursive: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
    await fs.rm(cachePath, { recursive: true })
    // rm succeeded — a stale or partially-cloned directory existed; log for diagnostics
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Found stale marketplace directory at ${cachePath}, cleaning up to allow re-clone`,
      { level: 'warn' },
    )
    // 调用 safeCallProgress，触发插件管理此处需要的副作用。
    safeCallProgress(
      onProgress,
      'Found stale directory, cleaning up and re-cloning…',
    )
  } catch (rmError) {
    // 满足 `!isENOENT(rmError)` 时，插件管理执行该分支。
    if (!isENOENT(rmError)) {
      // rmErrorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
      const rmErrorMsg = errorMessage(rmError)
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Failed to clean up existing marketplace directory. Please manually delete the directory at ${cachePath} and try again.\n\nTechnical details: ${rmErrorMsg}`,
      )
    }
    // ENOENT — cachePath didn't exist, this is a fresh install, nothing to clean up
  }

  // Clone the repository (one attempt — no internal retry loop)
  // refMessage 消息数据保存`ref ? ` (ref: ${ref})` : ''`，供后续判断或组装使用。
  const refMessage = ref ? ` (ref: ${ref})` : ''
  // 调用 safeCallProgress，触发插件管理此处需要的副作用。
  safeCallProgress(
    onProgress,
    `Cloning repository (timeout: ${timeoutSec}s): ${redactUrlCredentials(gitUrl)}${refMessage}`,
  )
  // cloneStarted记录时间`performance.now`，供插件管理后续处理使用。
  const cloneStarted = performance.now()
  // 结果保存`gitClone`，供插件管理后续处理使用。
  const result = await gitClone(gitUrl, cachePath, ref, sparsePaths)
  // 调用 logPluginFetch，触发插件管理此处需要的副作用。
  logPluginFetch(
    'marketplace_clone',
    gitUrl,
    result.code === 0 ? 'success' : 'failure',
    performance.now() - cloneStarted,
    result.code === 0 ? undefined : classifyFetchError(result.stderr),
  )
  // `result.code` 与 `0` 不一致时刷新派生状态，避免使用过期结果。
  if (result.code !== 0) {
    // Clean up any partial directory created by the failed clone so the next
    // attempt starts fresh. Best-effort: if this fails, the stale dir will be
    // auto-detected and removed at the top of the next call.
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.rm(cachePath, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
      await fs.rm(cachePath, { recursive: true, force: true })
    } catch {
      // ignore
    }
    // 抛出 new Error(`Failed to clone marketplace repository: ${result.stderr}`)，阻止插件管理在无效状态下继续运行。
    throw new Error(`Failed to clone marketplace repository: ${result.stderr}`)
  }
  // 调用 safeCallProgress，触发插件管理此处需要的副作用。
  safeCallProgress(onProgress, 'Clone complete, validating marketplace…')
}

/**
 * Redact header values for safe logging
 *
 * @param headers - Headers to redact
 * @returns Headers with values replaced by '***REDACTED***'
 */
// redactHeaders 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function redactHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  // 返回 `Object.fromEntries(`，作为插件管理这次计算的结果。
  return Object.fromEntries(
    Object.entries(headers).map(([key]) => [key, '***REDACTED***']),
  )
}

/**
 * Redact userinfo (username:password) in a URL to avoid logging credentials.
 *
 * Marketplace URLs may embed credentials (e.g. GitHub PATs in
 * `https://user:token@github.com/org/repo`). Debug logs and progress output
 * are written to disk and may be included in bug reports, so credentials must
 * be redacted before logging.
 *
 * Redacts all credentials from http(s) URLs:
 *   https://user:token@github.com/repo → https://***:***@github.com/repo
 *   https://:token@github.com/repo     → https://:***@github.com/repo
 *   https://token@github.com/repo      → https://***@github.com/repo
 *
 * Both username and password are redacted unconditionally on http(s) because
 * it is impossible to distinguish `placeholder:secret` (e.g. x-access-token:ghp_...)
 * from `secret:placeholder` (e.g. ghp_...:x-oauth-basic) by parsing alone.
 * Non-http(s) schemes (ssh://git@...) and non-URL inputs (`owner/repo` shorthand)
 * pass through unchanged.
 */
// redactUrlCredentials 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function redactUrlCredentials(urlString: string): string {
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`URL`，供插件管理后续处理使用。
    const parsed = new URL(urlString)
    // isHttp标记插件工具 marketplace Manager是否启用对应路径。
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:'
    // 只有 `isHttp && (parsed.username || parsed.password)` 满足时，插件管理才执行该分支。
    if (isHttp && (parsed.username || parsed.password)) {
      // 满足 `parsed.username` 时，插件管理执行该分支。
      if (parsed.username) parsed.username = '***'
      // 满足 `parsed.password` 时，插件管理执行该分支。
      if (parsed.password) parsed.password = '***'
      // 返回 `parsed.toString()`，作为插件管理这次计算的结果。
      return parsed.toString()
    }
  } catch {
    // Not a valid URL — safe as-is
  }
  // 返回 `urlString`，作为插件管理这次计算的结果。
  return urlString
}

/**
 * Cache a marketplace from a URL
 *
 * Downloads a marketplace.json file from a URL and saves it locally.
 * Creates the cache directory structure if it doesn't exist.
 *
 * Example marketplace.json structure:
 * ```json
 * {
 *   "name": "my-marketplace",
 *   "owner": { "name": "John Doe", "email": "john@example.com" },
 *   "plugins": [
 *     {
 *       "id": "my-plugin",
 *       "name": "My Plugin",
 *       "source": "./plugins/my-plugin.json",
 *       "category": "productivity",
 *       "description": "A helpful plugin"
 *     }
 *   ]
 * }
 * ```
 *
 * @param url - The URL to download the marketplace.json from
 * @param cachePath - Local file path to save the downloaded marketplace
 * @param customHeaders - Optional custom HTTP headers for authentication
 * @param onProgress - Optional callback to report progress
 */
// cacheMarketplaceFromUrl 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function cacheMarketplaceFromUrl(
  url: string,
  cachePath: string,
  customHeaders?: Record<string, string>,
  onProgress?: MarketplaceProgressCallback,
): Promise<void> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()

  // redactedUrl保存`redactUrlCredentials`，供插件管理后续处理使用。
  const redactedUrl = redactUrlCredentials(url)
  // 调用 safeCallProgress，触发插件管理此处需要的副作用。
  safeCallProgress(onProgress, `Downloading marketplace from ${redactedUrl}`)
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Downloading marketplace from URL: ${redactedUrl}`)
  // 只有 `customHeaders && Object.keys(customHeaders).length > 0` 满足时，插件管理才执行该分支。
  if (customHeaders && Object.keys(customHeaders).length > 0) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Using custom headers: ${jsonStringify(redactHeaders(customHeaders))}`,
    )
  }

  // 请求头 集中保存插件工具 marketplace Manager要一起传递的字段。
  const headers = {
    ...customHeaders,
    // User-Agent must come last to prevent override (for consistency with WebFetch)
    'User-Agent': 'Claude-Code-Plugin-Manager',
  }

  // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let response
  // fetchStarted记录时间`performance.now`，供插件管理后续处理使用。
  const fetchStarted = performance.now()
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应更新为 `await axios.get(url, {`，确保插件工具后续读取最新状态。
    response = await axios.get(url, {
      timeout: 10000,
      headers,
    })
  } catch (error) {
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch(
      'marketplace_url',
      url,
      'failure',
      performance.now() - fetchStarted,
      classifyFetchError(error),
    )
    // 满足 `axios.isAxiosError(error)` 时，插件管理执行该分支。
    if (axios.isAxiosError(error)) {
      // 当 `error.code` 匹配 `'ECONNREFUSED' || error.cod...` 时，插件管理执行对应分支。
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Could not connect to ${redactedUrl}. Please check your internet connection and verify the URL is correct.\n\nTechnical details: ${error.message}`,
        )
      }
      // 当 `error.code` 匹配 `'ETIMEDOUT'` 时，插件管理执行对应分支。
      if (error.code === 'ETIMEDOUT') {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Request timed out while downloading marketplace from ${redactedUrl}. The server may be slow or unreachable.\n\nTechnical details: ${error.message}`,
        )
      }
      // 满足 `error.response` 时，插件管理执行该分支。
      if (error.response) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `HTTP ${error.response.status} error while downloading marketplace from ${redactedUrl}. The marketplace file may not exist at this URL.\n\nTechnical details: ${error.message}`,
        )
      }
    }
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Failed to download marketplace from ${redactedUrl}: ${errorMessage(error)}`,
    )
  }

  // 调用 safeCallProgress，触发插件管理此处需要的副作用。
  safeCallProgress(onProgress, 'Validating marketplace data')
  // Validate the response is a valid marketplace
  // 结果保存`PluginMarketplaceSchema`，供插件管理后续处理使用。
  const result = PluginMarketplaceSchema().safeParse(response.data)
  // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.success) {
    // 调用 logPluginFetch，触发插件管理此处需要的副作用。
    logPluginFetch(
      'marketplace_url',
      url,
      'failure',
      performance.now() - fetchStarted,
      'invalid_schema',
    )
    // 抛出 new ConfigParseError(，阻止插件管理在无效状态下继续运行。
    throw new ConfigParseError(
      // 这个回调绑定到 `Invalid marketplace schema from URL: ${result.error.issues.map(e => `${e.path.join(…，负责插件管理在该局部场景下的响应。
      `Invalid marketplace schema from URL: ${result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      redactedUrl,
      response.data,
    )
  }
  // 调用 logPluginFetch，触发插件管理此处需要的副作用。
  logPluginFetch(
    'marketplace_url',
    url,
    'success',
    performance.now() - fetchStarted,
  )

  // 调用 safeCallProgress，触发插件管理此处需要的副作用。
  safeCallProgress(onProgress, 'Saving marketplace to cache')
  // Ensure cache directory exists
  // cacheDir 缓存格式化`join`，供插件管理后续处理使用。
  const cacheDir = join(cachePath, '..')
  // 等待 `fs.mkdir(cacheDir)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await fs.mkdir(cacheDir)

  // Write the validated marketplace file
  // 调用 writeFileSync_DEPRECATED，触发插件管理此处需要的副作用。
  writeFileSync_DEPRECATED(cachePath, jsonStringify(result.data, null, 2), {
    encoding: 'utf-8',
    flush: true,
  })
}

/**
 * Generate a cache path for a marketplace source
 */
// getCachePathForSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCachePathForSource(source: MarketplaceSource): string {
  // tempName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const tempName =
    source.source === 'github'
      ? source.repo.replace('/', '-')
      : source.source === 'npm'
        ? source.package.replace('@', '').replace('/', '-')
        : source.source === 'file'
          ? basename(source.path).replace('.json', '')
          : source.source === 'directory'
            ? basename(source.path)
            : 'temp_' + Date.now()
  // 返回 `tempName`，作为插件管理这次计算的结果。
  return tempName
}

/**
 * Parse and validate JSON file with a Zod schema
 */
// parseFileWithSchema 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function parseFileWithSchema<T>(
  filePath: string,
  schema: {
    // 这个回调绑定到 safeParse: (data: unknown) => {，负责插件管理在该局部场景下的响应。
    safeParse: (data: unknown) => {
      success: boolean
      data?: T
      error?: {
        issues: Array<{ path: PropertyKey[]; message: string }>
      }
    }
  },
): Promise<T> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
  const content = await fs.readFile(filePath, { encoding: 'utf-8' })
  // data 先占位，稍后的条件分支会根据实际输入补齐它。
  let data: unknown
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // data更新为 `jsonParse(content)`，确保插件工具后续读取最新状态。
    data = jsonParse(content)
  } catch (error) {
    // 抛出 new ConfigParseError(，阻止插件管理在无效状态下继续运行。
    throw new ConfigParseError(
      `Invalid JSON in ${filePath}: ${errorMessage(error)}`,
      filePath,
      content,
    )
  }
  // 结果保存`schema.safeParse`，供插件管理后续处理使用。
  const result = schema.safeParse(data)
  // result.success 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!result.success) {
    // 抛出 new ConfigParseError(，阻止插件管理在无效状态下继续运行。
    throw new ConfigParseError(
      // 这个回调绑定到 `Invalid schema: ${filePath} ${result.error?.issues.map(e => `${e.path.join('.')}: $…，负责插件管理在该局部场景下的响应。
      `Invalid schema: ${filePath} ${result.error?.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      filePath,
      data,
    )
  }
  // 返回 `result.data!`，作为插件管理这次计算的结果。
  return result.data!
}

/**
 * Load and cache a marketplace from its source
 *
 * Handles different source types:
 * - URL: Downloads marketplace.json directly
 * - GitHub: Clones repo and looks for .claude-plugin/marketplace.json
 * - Git: Clones repository from git URL
 * - NPM: (Not yet implemented) Would fetch from npm package
 * - File: Reads from local filesystem
 *
 * After loading, validates the marketplace schema and renames the cache
 * to match the marketplace's actual name from the manifest.
 *
 * Cache structure:
 * ~/.claude/plugins/marketplaces/
 *   ├── official-marketplace.json     # From URL source
 *   ├── github-marketplace/          # From GitHub/Git source
 *   │   └── .claude-plugin/
 *   │       └── marketplace.json
 *   └── local-marketplace.json       # From file source
 *
 * @param source - The marketplace source to load from
 * @param onProgress - Optional callback to report progress
 * @returns Object containing the validated marketplace and its cache path
 * @throws If marketplace file not found or validation fails
 */
// loadAndCacheMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadAndCacheMarketplace(
  source: MarketplaceSource,
  onProgress?: MarketplaceProgressCallback,
): Promise<LoadedPluginMarketplace> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // cacheDir 缓存读取`getMarketplacesCacheDir`，供插件管理后续处理使用。
  const cacheDir = getMarketplacesCacheDir()

  // Ensure cache directory exists
  // 等待 `fs.mkdir(cacheDir)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await fs.mkdir(cacheDir)

  // temporaryCachePath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let temporaryCachePath: string
  // marketplacePath 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let marketplacePath: string
  // cleanupNeeded标记插件工具 marketplace Manager是否启用对应路径。
  let cleanupNeeded = false

  // Generate a temp name for the cache path
  // tempName读取`getCachePathForSource`，供插件管理后续处理使用。
  const tempName = getCachePathForSource(source)

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 按照 source.source 的取值选择插件管理的具体处理分支。
    switch (source.source) {
      case 'url': {
        // Direct URL to marketplace.json
        // temporaryCachePath 路径数据更新为 `join(cacheDir, `${tempName}.json`)`，确保插件工具后续读取最新状态。
        temporaryCachePath = join(cacheDir, `${tempName}.json`)
        // cleanupNeeded更新为 `true`，确保插件工具后续读取最新状态。
        cleanupNeeded = true
        // 等待 `cacheMarketplaceFromUrl(` 完成，再继续插件工具 marketplace Manager的异步流程。
        await cacheMarketplaceFromUrl(
          source.url,
          temporaryCachePath,
          source.headers,
          onProgress,
        )
        // marketplacePath 市场数据更新为 `temporaryCachePath`，确保插件工具后续读取最新状态。
        marketplacePath = temporaryCachePath
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      }

      case 'github': {
        // Smart SSH/HTTPS selection: check if SSH is configured before trying it
        // This avoids waiting for timeout on SSH when it's not configured
        // sshUrl 命名 ``git@github.com:${source.repo}.git``，让后续代码直接表达这个值的用途。
        const sshUrl = `git@github.com:${source.repo}.git`
        // httpsUrl保存``https://github.com/${source.repo}.git``，作为后续固定文本处理的输入。
        const httpsUrl = `https://github.com/${source.repo}.git`
        // temporaryCachePath 路径数据更新为 `join(cacheDir, tempName)`，确保插件工具后续读取最新状态。
        temporaryCachePath = join(cacheDir, tempName)
        // cleanupNeeded更新为 `true`，确保插件工具后续读取最新状态。
        cleanupNeeded = true

        // lastError 错误信息初始化为空值，后续分支会在有数据时补齐。
        let lastError: Error | null = null

        // Quick check if SSH is likely to work
        // sshConfigured 配置保存`isGitHubSshLikelyConfigured`，供插件管理后续处理使用。
        const sshConfigured = await isGitHubSshLikelyConfigured()

        // 满足 `sshConfigured` 时，插件管理执行该分支。
        if (sshConfigured) {
          // SSH looks good, try it first
          // 调用 safeCallProgress，触发插件管理此处需要的副作用。
          safeCallProgress(onProgress, `Cloning via SSH: ${sshUrl}`)
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
            await cacheMarketplaceFromGit(
              sshUrl,
              temporaryCachePath,
              source.ref,
              source.sparsePaths,
              onProgress,
            )
          } catch (err) {
            // lastError 错误信息更新为 `toError(err)`，确保插件工具后续读取最新状态。
            lastError = toError(err)

            // Log SSH failure for monitoring
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(lastError)

            // SSH failed despite being configured, try HTTPS fallback
            // 调用 safeCallProgress，触发插件管理此处需要的副作用。
            safeCallProgress(
              onProgress,
              `SSH clone failed, retrying with HTTPS: ${httpsUrl}`,
            )

            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `SSH clone failed for ${source.repo} despite SSH being configured, falling back to HTTPS`,
              { level: 'info' },
            )

            // Clean up failed SSH attempt if it created anything
            // 等待 `fs.rm(temporaryCachePath, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
            await fs.rm(temporaryCachePath, { recursive: true, force: true })

            // Try HTTPS
            // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
            try {
              // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
              await cacheMarketplaceFromGit(
                httpsUrl,
                temporaryCachePath,
                source.ref,
                source.sparsePaths,
                onProgress,
              )
              // lastError 错误信息更新为 `null // Success!`，确保插件工具后续读取最新状态。
              lastError = null // Success!
            } catch (httpsErr) {
              // HTTPS also failed - use HTTPS error as the final error
              // lastError 错误信息更新为 `toError(httpsErr)`，确保插件工具后续读取最新状态。
              lastError = toError(httpsErr)

              // Log HTTPS failure for monitoring (both SSH and HTTPS failed)
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logError(lastError)
            }
          }
        } else {
          // SSH not configured, go straight to HTTPS
          // 调用 safeCallProgress，触发插件管理此处需要的副作用。
          safeCallProgress(
            onProgress,
            `SSH not configured, cloning via HTTPS: ${httpsUrl}`,
          )

          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `SSH not configured for GitHub, using HTTPS for ${source.repo}`,
            { level: 'info' },
          )

          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
            await cacheMarketplaceFromGit(
              httpsUrl,
              temporaryCachePath,
              source.ref,
              source.sparsePaths,
              onProgress,
            )
          } catch (err) {
            // lastError 错误信息更新为 `toError(err)`，确保插件工具后续读取最新状态。
            lastError = toError(err)

            // Always try SSH as fallback for ANY HTTPS failure
            // Log HTTPS failure for monitoring
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logError(lastError)

            // HTTPS failed, try SSH as fallback
            // 调用 safeCallProgress，触发插件管理此处需要的副作用。
            safeCallProgress(
              onProgress,
              `HTTPS clone failed, retrying with SSH: ${sshUrl}`,
            )

            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `HTTPS clone failed for ${source.repo} (${lastError.message}), falling back to SSH`,
              { level: 'info' },
            )

            // Clean up failed HTTPS attempt if it created anything
            // 等待 `fs.rm(temporaryCachePath, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
            await fs.rm(temporaryCachePath, { recursive: true, force: true })

            // Try SSH
            // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
            try {
              // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
              await cacheMarketplaceFromGit(
                sshUrl,
                temporaryCachePath,
                source.ref,
                source.sparsePaths,
                onProgress,
              )
              // lastError 错误信息更新为 `null // Success!`，确保插件工具后续读取最新状态。
              lastError = null // Success!
            } catch (sshErr) {
              // SSH also failed - use SSH error as the final error
              // lastError 错误信息更新为 `toError(sshErr)`，确保插件工具后续读取最新状态。
              lastError = toError(sshErr)

              // Log SSH failure for monitoring (both HTTPS and SSH failed)
              // 记录插件管理运行诊断，方便排查异常路径或性能问题。
              logError(lastError)
            }
          }
        }

        // If we still have an error, throw it
        // 满足 `lastError` 时，插件管理执行该分支。
        if (lastError) {
          // 抛出 lastError，阻止插件管理在无效状态下继续运行。
          throw lastError
        }

        // marketplacePath 市场数据更新为 `join(`，确保插件工具后续读取最新状态。
        marketplacePath = join(
          temporaryCachePath,
          source.path || '.claude-plugin/marketplace.json',
        )
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      }

      case 'git': {
        // temporaryCachePath 路径数据更新为 `join(cacheDir, tempName)`，确保插件工具后续读取最新状态。
        temporaryCachePath = join(cacheDir, tempName)
        // cleanupNeeded更新为 `true`，确保插件工具后续读取最新状态。
        cleanupNeeded = true
        // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
        await cacheMarketplaceFromGit(
          source.url,
          temporaryCachePath,
          source.ref,
          source.sparsePaths,
          onProgress,
        )
        // marketplacePath 市场数据更新为 `join(`，确保插件工具后续读取最新状态。
        marketplacePath = join(
          temporaryCachePath,
          source.path || '.claude-plugin/marketplace.json',
        )
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      }

      case 'npm': {
        // TODO: Implement npm package support
        // 抛出 new Error('NPM marketplace sources not yet implemented')，阻止插件管理在无效状态下继续运行。
        throw new Error('NPM marketplace sources not yet implemented')
      }

      case 'file': {
        // For local files, resolve paths relative to marketplace root directory
        // File sources point to .claude-plugin/marketplace.json, so the marketplace
        // root is two directories up (parent of .claude-plugin/)
        // Resolve to absolute so error messages show the actual path checked
        // (legacy known_marketplaces.json entries may have relative paths)
        // absPath 路径数据读取`resolve`，供插件管理后续处理使用。
        const absPath = resolve(source.path)
        // marketplacePath 市场数据更新为 `absPath`，确保插件工具后续读取最新状态。
        marketplacePath = absPath
        // temporaryCachePath 路径数据更新为 `dirname(dirname(absPath))`，确保插件工具后续读取最新状态。
        temporaryCachePath = dirname(dirname(absPath))
        // cleanupNeeded更新为 `false`，确保插件工具后续读取最新状态。
        cleanupNeeded = false
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      }

      case 'directory': {
        // For directories, look for .claude-plugin/marketplace.json
        // Resolve to absolute so error messages show the actual path checked
        // (legacy known_marketplaces.json entries may have relative paths)
        // absPath 路径数据读取`resolve`，供插件管理后续处理使用。
        const absPath = resolve(source.path)
        // marketplacePath 市场数据更新为 `join(absPath, '.claude-plugin', 'marketplace.json')`，确保插件工具后续读取最新状态。
        marketplacePath = join(absPath, '.claude-plugin', 'marketplace.json')
        // temporaryCachePath 路径数据更新为 `absPath`，确保插件工具后续读取最新状态。
        temporaryCachePath = absPath
        // cleanupNeeded更新为 `false`，确保插件工具后续读取最新状态。
        cleanupNeeded = false
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      }

      case 'settings': {
        // Inline manifest from settings.json — no fetch. Synthesize the
        // marketplace.json on disk so getMarketplaceCacheOnly reads it
        // like any other source. The plugins array already passed
        // PluginMarketplaceEntrySchema validation when settings were parsed;
        // the post-switch parseFileWithSchema re-validates the full
        // PluginMarketplaceSchema (catches schema drift between the two).
        //
        // Writing to source.name up front means the rename below is a no-op
        // (temporaryCachePath === finalCachePath). known_marketplaces.json
        // stores this source object including the plugins array, so
        // diffMarketplaces detects settings edits via isEqual — no special
        // dirty-tracking needed.
        // temporaryCachePath 路径数据更新为 `join(cacheDir, source.name)`，确保插件工具后续读取最新状态。
        temporaryCachePath = join(cacheDir, source.name)
        // marketplacePath 市场数据更新为 `join(`，确保插件工具后续读取最新状态。
        marketplacePath = join(
          temporaryCachePath,
          '.claude-plugin',
          'marketplace.json',
        )
        // cleanupNeeded更新为 `false`，确保插件工具后续读取最新状态。
        cleanupNeeded = false
        // 等待 `fs.mkdir(dirname(marketplacePath))` 完成，再继续插件工具 marketplace Manager的异步流程。
        await fs.mkdir(dirname(marketplacePath))
        // No `satisfies PluginMarketplace` here: source.plugins is the narrow
        // SettingsMarketplacePlugin type (no strict/.default(), no manifest
        // fields). The parseFileWithSchema(PluginMarketplaceSchema()) call
        // below widens and validates — that's the real check.
        // 等待 `writeFile(` 完成，再继续插件工具 marketplace Manager的异步流程。
        await writeFile(
          marketplacePath,
          jsonStringify(
            {
              name: source.name,
              owner: source.owner ?? { name: 'settings' },
              plugins: source.plugins,
            },
            null,
            2,
          ),
        )
        // 结束这个分支或循环，避免插件管理继续落入后续路径。
        break
      }

      default:
        // 抛出 new Error(`Unsupported marketplace source type`)，阻止插件管理在无效状态下继续运行。
        throw new Error(`Unsupported marketplace source type`)
    }

    // Load and validate the marketplace
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Reading marketplace from ${marketplacePath}`)
    // marketplace 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let marketplace: PluginMarketplace
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // marketplace 市场数据更新为 `await parseFileWithSchema(`，确保插件工具后续读取最新状态。
      marketplace = await parseFileWithSchema(
        marketplacePath,
        PluginMarketplaceSchema(),
      )
    } catch (e) {
      // 满足 `isENOENT(e)` 时，插件管理执行该分支。
      if (isENOENT(e)) {
        // 抛出 new Error(`Marketplace file not found at ${marketplacePath}`)，阻止插件管理在无效状态下继续运行。
        throw new Error(`Marketplace file not found at ${marketplacePath}`)
      }
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Failed to parse marketplace file at ${marketplacePath}: ${errorMessage(e)}`,
      )
    }

    // Now rename the cache path to use the marketplace's actual name
    // finalCachePath 路径数据格式化`join`，供插件管理后续处理使用。
    const finalCachePath = join(cacheDir, marketplace.name)
    // Defense-in-depth: the schema rejects path separators, .., and . in marketplace.name,
    // but verify the computed path is a strict subdirectory of cacheDir before fs.rm.
    // A malicious marketplace.json with a crafted name must never cause us to rm outside
    // cacheDir, nor rm cacheDir itself (e.g. name "." → join normalizes to cacheDir).
    // resolvedFinal读取`resolve`，供插件管理后续处理使用。
    const resolvedFinal = resolve(finalCachePath)
    // resolvedCacheDir 缓存读取`resolve`，供插件管理后续处理使用。
    const resolvedCacheDir = resolve(cacheDir)
    // 满足 `!resolvedFinal.startsWith(resolvedCacheDir + sep)` 时，插件管理执行该分支。
    if (!resolvedFinal.startsWith(resolvedCacheDir + sep)) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Marketplace name '${marketplace.name}' resolves to a path outside the cache directory`,
      )
    }
    // Don't rename if it's a local file or directory, or already has the right name
    // 插件管理在这里按实际状态进入对应分支。
    if (
      temporaryCachePath !== finalCachePath &&
      !isLocalMarketplaceSource(source)
    ) {
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // Remove the destination if it already exists, then rename
        // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
        try {
          // 调用 onProgress?.('Cleaning up old marketplace cache…')，完成这一处局部操作。
          onProgress?.('Cleaning up old marketplace cache…')
        } catch (callbackError) {
          // 记录插件管理运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Progress callback error: ${errorMessage(callbackError)}`,
            { level: 'warn' },
          )
        }
        // 等待 `fs.rm(finalCachePath, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
        await fs.rm(finalCachePath, { recursive: true, force: true })
        // Rename temp cache to final name
        // 等待 `fs.rename(temporaryCachePath, finalCachePath)` 完成，再继续插件工具 marketplace Manager的异步流程。
        await fs.rename(temporaryCachePath, finalCachePath)
        // temporaryCachePath 路径数据更新为 `finalCachePath`，确保插件工具后续读取最新状态。
        temporaryCachePath = finalCachePath
        // cleanupNeeded更新为 `false // Successfully renamed, no cleanup needed`，确保插件工具后续读取最新状态。
        cleanupNeeded = false // Successfully renamed, no cleanup needed
      } catch (error) {
        // errorMsg 错误信息保存`errorMessage`，供插件管理后续处理使用。
        const errorMsg = errorMessage(error)
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Failed to finalize marketplace cache. Please manually delete the directory at ${finalCachePath} if it exists and try again.\n\nTechnical details: ${errorMsg}`,
        )
      }
    }

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { marketplace, cachePath: temporaryCachePath }
  } catch (error) {
    // Clean up any temporary files/directories on error
    // 插件管理在这里按实际状态进入对应分支。
    if (
      cleanupNeeded &&
      temporaryCachePath! &&
      !isLocalMarketplaceSource(source)
    ) {
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `fs.rm(temporaryCachePath!, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
        await fs.rm(temporaryCachePath!, { recursive: true, force: true })
      } catch (cleanupError) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Warning: Failed to clean up temporary marketplace cache at ${temporaryCachePath}: ${errorMessage(cleanupError)}`,
          { level: 'warn' },
        )
      }
    }
    // 抛出 error，阻止插件管理在无效状态下继续运行。
    throw error
  }
}

/**
 * Add a marketplace source to the known marketplaces
 *
 * The marketplace is fetched, validated, and cached locally.
 * The configuration is saved to ~/.claude/plugins/known_marketplaces.json.
 *
 * @param source - MarketplaceSource object representing the marketplace source.
 *                 Callers should parse user input into MarketplaceSource format
 *                 (see AddMarketplace.parseMarketplaceInput for handling shortcuts like "owner/repo").
 * @param onProgress - Optional callback for progress updates during marketplace installation
 * @throws If source format is invalid or marketplace cannot be loaded
 */
// addMarketplaceSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function addMarketplaceSource(
  source: MarketplaceSource,
  onProgress?: MarketplaceProgressCallback,
): Promise<{
  name: string
  alreadyMaterialized: boolean
  resolvedSource: MarketplaceSource
}> {
  // Resolve relative directory/file paths to absolute so state is cwd-independent
  // resolvedSource 命名 `source`，让后续代码直接表达这个值的用途。
  let resolvedSource = source
  // 只有 `isLocalMarketplaceSource(source) && !isAbsolute(source.path)` 满足时，插件管理才执行该分支。
  if (isLocalMarketplaceSource(source) && !isAbsolute(source.path)) {
    // resolvedSource更新为 `{ ...source, path: resolve(source.path) }`，确保插件工具后续读取最新状态。
    resolvedSource = { ...source, path: resolve(source.path) }
  }

  // Check policy FIRST, before any network/filesystem operations
  // This prevents downloading/cloning when the source is blocked
  // 满足 `!isSourceAllowedByPolicy(resolvedSource)` 时，插件管理执行该分支。
  if (!isSourceAllowedByPolicy(resolvedSource)) {
    // Check if explicitly blocked vs not in allowlist for better error messages
    // 满足 `isSourceInBlocklist(resolvedSource)` 时，插件管理执行该分支。
    if (isSourceInBlocklist(resolvedSource)) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Marketplace source '${formatSourceForDisplay(resolvedSource)}' is blocked by enterprise policy.`,
      )
    }
    // Not in allowlist - build helpful error message
    // allowlist 集合读取`getStrictKnownMarketplaces`，供插件管理后续处理使用。
    const allowlist = getStrictKnownMarketplaces() || []
    // hostPatterns 集合读取`getHostPatternsFromAllowlist`，供插件管理后续处理使用。
    const hostPatterns = getHostPatternsFromAllowlist()
    // sourceHost保存`extractHostFromSource`，供插件管理后续处理使用。
    const sourceHost = extractHostFromSource(resolvedSource)

    // errorMessage 消息数据格式化`formatSourceForDisplay`，供插件管理后续处理使用。
    let errorMessage = `Marketplace source '${formatSourceForDisplay(resolvedSource)}'`
    // 满足 `sourceHost` 时，插件管理执行该分支。
    if (sourceHost) {
      // 插件工具 marketplace Manager在这里处理 `errorMessage += ` (${sourceHost})``，完成这一小步状态转换。
      errorMessage += ` (${sourceHost})`
    }
    // 插件工具 marketplace Manager在这里处理 `errorMessage += ' is blocked by enterprise policy.'`，完成这一小步状态转换。
    errorMessage += ' is blocked by enterprise policy.'

    // 满足 `allowlist.length > 0` 时，插件管理执行该分支。
    if (allowlist.length > 0) {
      // 这个回调绑定到 errorMessage += ` Allowed sources: ${allowlist.map(s => formatSourceForDisplay(s)).j…，负责插件管理在该局部场景下的响应。
      errorMessage += ` Allowed sources: ${allowlist.map(s => formatSourceForDisplay(s)).join(', ')}`
    } else {
      // 插件工具 marketplace Manager在这里处理 `errorMessage += ' No external marketplaces are allowed.'`，完成这一小步状态转换。
      errorMessage += ' No external marketplaces are allowed.'
    }

    // If source is a github shorthand and there are hostPatterns, suggest using full URL
    // 只有 `resolvedSource.source === 'github' && hostPattern` 满足时，插件管理才执行该分支。
    if (resolvedSource.source === 'github' && hostPatterns.length > 0) {
      // 插件工具 marketplace Manager在这里处理 `errorMessage +=`，完成这一小步状态转换。
      errorMessage +=
        `\n\nTip: The shorthand "${resolvedSource.repo}" assumes github.com. ` +
        `For internal GitHub Enterprise, use the full URL:\n` +
        `  git@your-github-host.com:${resolvedSource.repo}.git`
    }

    // 抛出 new Error(errorMessage)，阻止插件管理在无效状态下继续运行。
    throw new Error(errorMessage)
  }

  // Source-idempotency: if this exact source already exists, skip clone
  // existingConfig 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const existingConfig = await loadKnownMarketplacesConfig()
  // 循环处理 `const [existingName, existingEntry] of Object.entries(existingConfig)`，让插件管理把同类条目按顺序走完。
  for (const [existingName, existingEntry] of Object.entries(existingConfig)) {
    // 满足 `isEqual(existingEntry.source, resolvedSource)` 时，插件管理执行该分支。
    if (isEqual(existingEntry.source, resolvedSource)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Source already materialized as '${existingName}', skipping clone`,
      )
      // 返回结构化结果，集中表达插件管理已经整理出的状态。
      return { name: existingName, alreadyMaterialized: true, resolvedSource }
    }
  }

  // Load and cache the marketplace to validate it and get its name
  // 从 `await loadAndCacheMarketplace(` 解构 marketplace、cachePath，减少插件工具 marketplace Manager对同一对象的重复访问。
  const { marketplace, cachePath } = await loadAndCacheMarketplace(
    resolvedSource,
    onProgress,
  )

  // Validate that reserved names come from official sources
  // sourceValidationError 错误信息读取`validateOfficialNameSource`，供插件管理后续处理使用。
  const sourceValidationError = validateOfficialNameSource(
    marketplace.name,
    resolvedSource,
  )
  // 满足 `sourceValidationError` 时，插件管理执行该分支。
  if (sourceValidationError) {
    // 抛出 new Error(sourceValidationError)，阻止插件管理在无效状态下继续运行。
    throw new Error(sourceValidationError)
  }

  // Name collision with different source: overwrite (settings intent wins).
  // Seed-managed entries are admin-controlled and cannot be overwritten.
  // Re-read config after clone (may take a while; another process may have written).
  // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const config = await loadKnownMarketplacesConfig()
  // oldEntry读取 `config[marketplace.name]` 对应条目，后续围绕该成员继续处理。
  const oldEntry = config[marketplace.name]
  // 满足 `oldEntry` 时，插件管理执行该分支。
  if (oldEntry) {
    // seedDir保存`seedDirFor`，供插件管理后续处理使用。
    const seedDir = seedDirFor(oldEntry.installLocation)
    // 满足 `seedDir` 时，插件管理执行该分支。
    if (seedDir) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Marketplace '${marketplace.name}' is seed-managed (${seedDir}). ` +
          `To use a different source, ask your admin to update the seed, ` +
          `or use a different marketplace name.`,
      )
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Marketplace '${marketplace.name}' exists with different source — overwriting`,
    )
    // Clean up the old cache if it's not a user-owned local path AND it
    // actually differs from the new cachePath. loadAndCacheMarketplace writes
    // to cachePath BEFORE we get here — rm-ing the same dir deletes the fresh
    // write. Settings sources always land on the same dir (name → path);
    // git sources hit this latently when the source repo changes but the
    // fetched marketplace.json declares the same name. Only rm when locations
    // genuinely differ (the only case where there's a stale dir to clean).
    //
    // Defensively validate the stored path before rm: a corrupted
    // installLocation (gh-32793, gh-32661) could point at the user's project
    // dir. If it's outside the cache dir, skip cleanup — the stale dir (if
    // any) is harmless, and blocking the re-add would prevent the user from
    // fixing the corruption.
    // 满足 `!isLocalMarketplaceSource(oldEntry.source)` 时，插件管理执行该分支。
    if (!isLocalMarketplaceSource(oldEntry.source)) {
      // cacheDir 缓存读取`resolve`，供插件管理后续处理使用。
      const cacheDir = resolve(getMarketplacesCacheDir())
      // resolvedOld读取`resolve`，供插件管理后续处理使用。
      const resolvedOld = resolve(oldEntry.installLocation)
      // resolvedNew读取`resolve`，供插件管理后续处理使用。
      const resolvedNew = resolve(cachePath)
      // 满足 `resolvedOld === resolvedNew` 时，插件管理执行该分支。
      if (resolvedOld === resolvedNew) {
        // Same dir — loadAndCacheMarketplace already overwrote in place.
        // Nothing to clean.
      // 插件工具 marketplace Manager在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        resolvedOld === cacheDir ||
        resolvedOld.startsWith(cacheDir + sep)
      ) {
        // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
        const fs = getFsImplementation()
        // 等待 `fs.rm(oldEntry.installLocation, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
        await fs.rm(oldEntry.installLocation, { recursive: true, force: true })
      } else {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping cleanup of old installLocation (${oldEntry.installLocation}) — ` +
            `outside ${cacheDir}. The path is corrupted; leaving it alone and ` +
            `overwriting the config entry.`,
          { level: 'warn' },
        )
      }
    }
  }

  // Update config using the marketplace's actual name
  // 名称更新为 `{`，确保插件工具 marketplace Manager后续读取最新状态。
  config[marketplace.name] = {
    source: resolvedSource,
    installLocation: cachePath,
    lastUpdated: new Date().toISOString(),
  }
  // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await saveKnownMarketplacesConfig(config)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Added marketplace source: ${marketplace.name}`)

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { name: marketplace.name, alreadyMaterialized: false, resolvedSource }
}

/**
 * Remove a marketplace source from known marketplaces
 *
 * Removes the marketplace configuration and cleans up cached files.
 * Deletes both directory caches (for git sources) and file caches (for URL sources).
 * Also cleans up the marketplace from settings.json (extraKnownMarketplaces) and
 * removes related plugin entries from enabledPlugins.
 *
 * @param name - The marketplace name to remove
 * @throws If marketplace with given name is not found
 */
// removeMarketplaceSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeMarketplaceSource(name: string): Promise<void> {
  // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const config = await loadKnownMarketplacesConfig()

  // 满足 `!config[name]` 时，插件管理执行该分支。
  if (!config[name]) {
    // 抛出 new Error(`Marketplace '${name}' not found`)，阻止插件管理在无效状态下继续运行。
    throw new Error(`Marketplace '${name}' not found`)
  }

  // Seed-registered marketplaces are admin-baked into the container — removing
  // them is a category error. They'd resurrect on next startup anyway. Guide
  // the user to the right action instead.
  // entry保存`config[name]`，供插件工具 marketplace Manager后续判断或输出使用。
  const entry = config[name]
  // seedDir保存`seedDirFor`，供插件管理后续处理使用。
  const seedDir = seedDirFor(entry.installLocation)
  // 满足 `seedDir` 时，插件管理执行该分支。
  if (seedDir) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Marketplace '${name}' is registered from the read-only seed directory ` +
        `(${seedDir}) and will be re-registered on next startup. ` +
        `To stop using its plugins: claude plugin disable <plugin>@${name}`,
    )
  }

  // Remove from config
  // 插件工具 marketplace Manager在这里处理 `delete config[name]`，完成这一小步状态转换。
  delete config[name]
  // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await saveKnownMarketplacesConfig(config)

  // Clean up cached files (both directory and JSON formats)
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // cacheDir 缓存读取`getMarketplacesCacheDir`，供插件管理后续处理使用。
  const cacheDir = getMarketplacesCacheDir()
  // cachePath 路径数据格式化`join`，供插件管理后续处理使用。
  const cachePath = join(cacheDir, name)
  // 等待 `fs.rm(cachePath, { recursive: true, force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
  await fs.rm(cachePath, { recursive: true, force: true })
  // jsonCachePath 路径数据格式化`join`，供插件管理后续处理使用。
  const jsonCachePath = join(cacheDir, `${name}.json`)
  // 等待 `fs.rm(jsonCachePath, { force: true })` 完成，再继续插件工具 marketplace Manager的异步流程。
  await fs.rm(jsonCachePath, { force: true })

  // Clean up settings.json - remove marketplace from extraKnownMarketplaces
  // and remove related plugin entries from enabledPlugins

  // Check each editable settings source
  // editableSources 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const editableSources: Array<
    'userSettings' | 'projectSettings' | 'localSettings'
  > = ['userSettings', 'projectSettings', 'localSettings']

  // 按顺序遍历 `editableSources` 中的source，逐个交给插件管理处理。
  for (const source of editableSources) {
    // settings 集合读取`getSettingsForSource`，供插件管理后续处理使用。
    const settings = getSettingsForSource(source)
    // settings 集合缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!settings) continue

    // needsUpdate标记插件工具 marketplace Manager是否启用对应路径。
    let needsUpdate = false
    // updates 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const updates: {
      extraKnownMarketplaces?: typeof settings.extraKnownMarketplaces
      enabledPlugins?: typeof settings.enabledPlugins
    } = {}

    // Remove from extraKnownMarketplaces if present
    // 满足 `settings.extraKnownMarketplaces?.[name]` 时，插件管理执行该分支。
    if (settings.extraKnownMarketplaces?.[name]) {
      // updatedMarketplaces 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
      const updatedMarketplaces: Partial<
        SettingsJson['extraKnownMarketplaces']
      > = { ...settings.extraKnownMarketplaces }
      // Use undefined values (NOT delete) to signal key removal via mergeWith
      // updatedMarketplaces[name 市场数据更新为 `undefined`，确保插件工具 marketplace Manager后续读取最新状态。
      updatedMarketplaces[name] = undefined
      // 插件工具 marketplace Manager在这里处理 `updates.extraKnownMarketplaces =`，完成这一小步状态转换。
      updates.extraKnownMarketplaces =
        updatedMarketplaces as SettingsJson['extraKnownMarketplaces']
      // needsUpdate更新为 `true`，确保插件工具后续读取最新状态。
      needsUpdate = true
    }

    // Remove related plugins from enabledPlugins (format: "plugin@marketplace")
    // 满足 `settings.enabledPlugins` 时，插件管理执行该分支。
    if (settings.enabledPlugins) {
      // marketplaceSuffix 市场数据固定为 ``@${name}``，作为插件工具 marketplace Manager后续展示或比较的基准。
      const marketplaceSuffix = `@${name}`
      // updatedPlugins 插件数据 集中保存插件工具 marketplace Manager要一起传递的字段。
      const updatedPlugins = { ...settings.enabledPlugins }
      // removedPlugins 插件数据标记插件工具 marketplace Manager是否启用对应路径。
      let removedPlugins = false

      // 循环处理 `const pluginId in updatedPlugins`，让插件管理逐项把同类条目按顺序走完。
      for (const pluginId in updatedPlugins) {
        // 满足 `pluginId.endsWith(marketplaceSuffix)` 时，插件管理执行该分支。
        if (pluginId.endsWith(marketplaceSuffix)) {
          // updatedPlugins[pluginId 插件数据更新为 `undefined`，确保插件工具 marketplace Manager后续读取最新状态。
          updatedPlugins[pluginId] = undefined
          // removedPlugins 插件数据更新为 `true`，确保插件工具后续读取最新状态。
          removedPlugins = true
        }
      }

      // 满足 `removedPlugins` 时，插件管理执行该分支。
      if (removedPlugins) {
        // enabledPlugins 插件数据更新为 `updatedPlugins`，确保插件工具后续读取最新状态。
        updates.enabledPlugins = updatedPlugins
        // needsUpdate更新为 `true`，确保插件工具后续读取最新状态。
        needsUpdate = true
      }
    }

    // Update settings if changes were made
    // 满足 `needsUpdate` 时，插件管理执行该分支。
    if (needsUpdate) {
      // 结果保存`updateSettingsForSource`，供插件管理后续处理使用。
      const result = updateSettingsForSource(source, updates)
      // 满足 `result.error` 时，插件管理执行该分支。
      if (result.error) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logError(result.error)
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to clean up marketplace '${name}' from ${source} settings: ${result.error.message}`,
        )
      } else {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Cleaned up marketplace '${name}' from ${source} settings`,
        )
      }
    }
  }

  // Remove plugins from installed_plugins.json and mark orphaned paths.
  // Also wipe their stored options/secrets — after marketplace removal
  // zero installations remain, same "last scope gone" condition as
  // uninstallPluginOp.
  // 插件工具 marketplace Manager先整理这一处局部数据，后续分支可以直接读取。
  const { orphanedPaths, removedPluginIds } =
    removeAllPluginsForMarketplace(name)
  // 按顺序遍历 `orphanedPaths` 中的installPath 路径数据，逐个交给插件管理处理。
  for (const installPath of orphanedPaths) {
    // 等待 `markPluginVersionOrphaned(installPath)` 完成，再继续插件工具 marketplace Manager的异步流程。
    await markPluginVersionOrphaned(installPath)
  }
  // 按顺序遍历 `removedPluginIds` 中的pluginId 插件数据，逐个交给插件管理处理。
  for (const pluginId of removedPluginIds) {
    // 调用 deletePluginOptions，触发插件管理此处需要的副作用。
    deletePluginOptions(pluginId)
    // 等待 `deletePluginDataDir(pluginId)` 完成，再继续插件工具 marketplace Manager的异步流程。
    await deletePluginDataDir(pluginId)
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Removed marketplace source: ${name}`)
}

/**
 * Read a cached marketplace from disk without updating it
 *
 * @param installLocation - Path to the cached marketplace
 * @returns The marketplace object
 * @throws If marketplace file not found or invalid
 */
// readCachedMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readCachedMarketplace(
  installLocation: string,
): Promise<PluginMarketplace> {
  // For git-sourced directories, the manifest lives at .claude-plugin/marketplace.json.
  // For url/file/directory sources it is the installLocation itself.
  // Try the nested path first; fall back to installLocation when it is a plain file
  // (ENOTDIR) or the nested file is simply missing (ENOENT).
  // nestedPath 路径数据格式化`join`，供插件管理后续处理使用。
  const nestedPath = join(installLocation, '.claude-plugin', 'marketplace.json')
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `parseFileWithSchema(nestedPath, PluginMarketplaceSchema())`，调用方直接接收异步结果。
    return await parseFileWithSchema(nestedPath, PluginMarketplaceSchema())
  } catch (e) {
    // 满足 `e instanceof ConfigParseError` 时，插件管理执行该分支。
    if (e instanceof ConfigParseError) throw e
    // code读取`getErrnoCode`，供插件管理后续处理使用。
    const code = getErrnoCode(e)
    // `code` 与 `'ENOENT' && code !== 'ENOTDIR'` 不一致时刷新派生状态，避免使用过期结果。
    if (code !== 'ENOENT' && code !== 'ENOTDIR') throw e
  }
  // 等待并返回 `parseFileWithSchema(installLocation, PluginMarketplaceSchema(...`，调用方直接接收异步结果。
  return await parseFileWithSchema(installLocation, PluginMarketplaceSchema())
}

/**
 * Get a specific marketplace by name from cache only (no network).
 * Returns null if cache is missing or corrupted.
 * Use this for startup paths that should never block on network.
 */
// getMarketplaceCacheOnly 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getMarketplaceCacheOnly(
  name: string,
): Promise<PluginMarketplace | null> {
  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // configFile 文件数据读取`getKnownMarketplacesFile`，供插件管理后续处理使用。
  const configFile = getKnownMarketplacesFile()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
    const content = await fs.readFile(configFile, { encoding: 'utf-8' })
    // 配置解析`jsonParse`，供插件管理后续处理使用。
    const config = jsonParse(content) as KnownMarketplacesConfig
    // entry保存`config[name]`，供插件工具 marketplace Manager后续判断或输出使用。
    const entry = config[name]

    // entry缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!entry) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // 等待并返回 `readCachedMarketplace(entry.installLocation)`，调用方直接接收异步结果。
    return await readCachedMarketplace(entry.installLocation)
  } catch (error) {
    // 满足 `isENOENT(error)` 时，插件管理执行该分支。
    if (isENOENT(error)) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to read cached marketplace ${name}: ${errorMessage(error)}`,
      { level: 'warn' },
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Get a specific marketplace by name
 *
 * First attempts to read from cache. Only fetches from source if:
 * - No cached version exists
 * - Cache is invalid/corrupted
 *
 * This avoids unnecessary network/git operations on every access.
 * Use refreshMarketplace() to explicitly update from source.
 *
 * @param name - The marketplace name to fetch
 * @returns The marketplace object or null if not found/failed
 */
// getMarketplace 市场数据保存`memoize`，供插件管理后续处理使用。
export const getMarketplace = memoize(
  async (name: string): Promise<PluginMarketplace> => {
    // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
    const config = await loadKnownMarketplacesConfig()
    // entry保存`config[name]`，供插件工具 marketplace Manager后续判断或输出使用。
    const entry = config[name]

    // entry缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!entry) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Marketplace '${name}' not found in configuration. Available marketplaces: ${Object.keys(config).join(', ')}`,
      )
    }

    // Legacy entries (pre-#19708) may have relative paths in global config.
    // These are meaningless outside the project that wrote them — resolving
    // against process.cwd() produces the wrong path. Give actionable guidance
    // instead of a misleading ENOENT.
    // 插件管理在这里按实际状态进入对应分支。
    if (
      isLocalMarketplaceSource(entry.source) &&
      !isAbsolute(entry.source.path)
    ) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Marketplace "${name}" has a relative source path (${entry.source.path}) ` +
          `in known_marketplaces.json — this is stale state from an older ` +
          `Claude Code version. Run 'claude marketplace remove ${name}' and ` +
          `re-add it from the original project directory.`,
      )
    }

    // Try to read from disk cache
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `readCachedMarketplace(entry.installLocation)`，调用方直接接收异步结果。
      return await readCachedMarketplace(entry.installLocation)
    } catch (error) {
      // Log cache corruption before re-fetching
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Cache corrupted or missing for marketplace ${name}, re-fetching from source: ${errorMessage(error)}`,
        {
          level: 'warn',
        },
      )
    }

    // Cache doesn't exist or is invalid, fetch from source
    // marketplace 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let marketplace: PluginMarketplace
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 插件工具 marketplace Manager在这里处理 `;({ marketplace } = await loadAndCacheMarketplace(entry.source))`，完成这一小步状态转换。
      ;({ marketplace } = await loadAndCacheMarketplace(entry.source))
    } catch (error) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Failed to load marketplace "${name}" from source (${entry.source.source}): ${errorMessage(error)}`,
      )
    }

    // Update lastUpdated only when we actually fetch
    // 插件工具 marketplace Manager在这里处理 `config[name]!.lastUpdated = new Date().toISOString()`，完成这一小步状态转换。
    config[name]!.lastUpdated = new Date().toISOString()
    // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
    await saveKnownMarketplacesConfig(config)

    // 返回 `marketplace`，作为插件管理这次计算的结果。
    return marketplace
  },
)

/**
 * Get plugin by ID from cache only (no network calls).
 * Returns null if marketplace cache is missing or corrupted.
 * Use this for startup paths that should never block on network.
 *
 * @param pluginId - The plugin ID in format "name@marketplace"
 * @returns The plugin entry or null if not found/cache missing
 */
// getPluginByIdCacheOnly 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPluginByIdCacheOnly(pluginId: string): Promise<{
  entry: PluginMarketplaceEntry
  marketplaceInstallLocation: string
} | null> {
  // 插件工具 marketplace Manager先整理这一处局部数据，后续分支可以直接读取。
  const { name: pluginName, marketplace: marketplaceName } =
    parsePluginIdentifier(pluginId)
  // 只有 `!pluginName || !marketplaceName` 满足时，插件管理才执行该分支。
  if (!pluginName || !marketplaceName) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // fs 集合读取`getFsImplementation`，供插件管理后续处理使用。
  const fs = getFsImplementation()
  // configFile 文件数据读取`getKnownMarketplacesFile`，供插件管理后续处理使用。
  const configFile = getKnownMarketplacesFile()

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容读取`fs.readFile`，供插件管理后续处理使用。
    const content = await fs.readFile(configFile, { encoding: 'utf-8' })
    // 配置解析`jsonParse`，供插件管理后续处理使用。
    const config = jsonParse(content) as KnownMarketplacesConfig
    // marketplaceConfig 市场数据 命名 `config[marketplaceName]`，让后续代码直接表达这个值的用途。
    const marketplaceConfig = config[marketplaceName]

    // marketplaceConfig 市场数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!marketplaceConfig) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // marketplace 市场数据读取`getMarketplaceCacheOnly`，供插件管理后续处理使用。
    const marketplace = await getMarketplaceCacheOnly(marketplaceName)
    // marketplace 市场数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!marketplace) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // plugin 插件数据筛选`plugins.find`，供插件管理后续处理使用。
    const plugin = marketplace.plugins.find(p => p.name === pluginName)
    // plugin 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!plugin) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      entry: plugin,
      marketplaceInstallLocation: marketplaceConfig.installLocation,
    }
  } catch {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Get plugin by ID from a specific marketplace
 *
 * First tries cache-only lookup. If cache is missing/corrupted,
 * falls back to fetching from source.
 *
 * @param pluginId - The plugin ID in format "name@marketplace"
 * @returns The plugin entry or null if not found
 */
// getPluginById 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getPluginById(pluginId: string): Promise<{
  entry: PluginMarketplaceEntry
  marketplaceInstallLocation: string
} | null> {
  // Try cache-only first (fast path)
  // cached 缓存读取`getPluginByIdCacheOnly`，供插件管理后续处理使用。
  const cached = await getPluginByIdCacheOnly(pluginId)
  // 满足 `cached` 时，插件管理执行该分支。
  if (cached) {
    // 返回 `cached`，作为插件管理这次计算的结果。
    return cached
  }

  // Cache miss - try fetching from source
  // 插件工具 marketplace Manager先整理这一处局部数据，后续分支可以直接读取。
  const { name: pluginName, marketplace: marketplaceName } =
    parsePluginIdentifier(pluginId)
  // 只有 `!pluginName || !marketplaceName` 满足时，插件管理才执行该分支。
  if (!pluginName || !marketplaceName) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
    const config = await loadKnownMarketplacesConfig()
    // marketplaceConfig 市场数据 命名 `config[marketplaceName]`，让后续代码直接表达这个值的用途。
    const marketplaceConfig = config[marketplaceName]
    // marketplaceConfig 市场数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!marketplaceConfig) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // marketplace 市场数据读取`getMarketplace`，供插件管理后续处理使用。
    const marketplace = await getMarketplace(marketplaceName)
    // plugin 插件数据筛选`plugins.find`，供插件管理后续处理使用。
    const plugin = marketplace.plugins.find(p => p.name === pluginName)

    // plugin 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!plugin) {
      // 返回 `null`，作为插件管理这次计算的结果。
      return null
    }

    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return {
      entry: plugin,
      marketplaceInstallLocation: marketplaceConfig.installLocation,
    }
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Could not find plugin ${pluginId}: ${errorMessage(error)}`,
      { level: 'debug' },
    )
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
}

/**
 * Refresh all marketplace caches
 *
 * Updates all configured marketplaces from their sources.
 * Continues refreshing even if some marketplaces fail.
 * Updates lastUpdated timestamps for successful refreshes.
 *
 * This is useful for:
 * - Periodic updates to get new plugins
 * - Syncing after network connectivity is restored
 * - Ensuring caches are up-to-date before browsing
 *
 * @returns Promise that resolves when all refresh attempts complete
 */
// refreshAllMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshAllMarketplaces(): Promise<void> {
  // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const config = await loadKnownMarketplacesConfig()

  // 循环处理 `const [name, entry] of Object.entries(config)`，让插件管理把同类条目按顺序走完。
  for (const [name, entry] of Object.entries(config)) {
    // Seed-managed marketplaces are controlled by the seed image — refreshing
    // them is pointless (registerSeedMarketplaces overwrites on next startup).
    // 满足 `seedDirFor(entry.installLocation)` 时，插件管理执行该分支。
    if (seedDirFor(entry.installLocation)) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Skipping seed-managed marketplace '${name}' in bulk refresh`,
      )
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // settings-sourced marketplaces have no upstream — see refreshMarketplace.
    // 当 `entry.source.source` 匹配 `'settings'` 时，插件管理执行对应分支。
    if (entry.source.source === 'settings') {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // inc-5046: same GCS intercept as refreshMarketplace() — bulk update
    // hits this path on `claude plugin marketplace update` (no name arg).
    // 满足 `name === OFFICIAL_MARKETPLACE_NAME` 时，插件管理执行该分支。
    if (name === OFFICIAL_MARKETPLACE_NAME) {
      // sha读取`fetchOfficialMarketplaceFromGcs`，供插件管理后续处理使用。
      const sha = await fetchOfficialMarketplaceFromGcs(
        entry.installLocation,
        getMarketplacesCacheDir(),
      )
      // `sha` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (sha !== null) {
        // 插件工具 marketplace Manager在这里处理 `config[name]!.lastUpdated = new Date().toISOString()`，完成这一小步状态转换。
        config[name]!.lastUpdated = new Date().toISOString()
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // 插件管理在这里按实际状态进入对应分支。
      if (
        !getFeatureValue_CACHED_MAY_BE_STALE(
          'tengu_plugin_official_mkt_git_fallback',
          true,
        )
      ) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping official marketplace bulk refresh: GCS failed, git fallback disabled`,
        )
        // 跳过当前项，继续处理插件管理中的下一轮循环。
        continue
      }
      // fall through to git
    }
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 从 `await loadAndCacheMarketplace(entry.source)` 解构 cachePath，减少插件工具 marketplace Manager对同一对象的重复访问。
      const { cachePath } = await loadAndCacheMarketplace(entry.source)
      // 插件工具 marketplace Manager在这里处理 `config[name]!.lastUpdated = new Date().toISOString()`，完成这一小步状态转换。
      config[name]!.lastUpdated = new Date().toISOString()
      // 插件工具 marketplace Manager在这里处理 `config[name]!.installLocation = cachePath`，完成这一小步状态转换。
      config[name]!.installLocation = cachePath
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to refresh marketplace ${name}: ${errorMessage(error)}`,
        {
          level: 'error',
        },
      )
    }
  }

  // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await saveKnownMarketplacesConfig(config)
}

/**
 * Refresh a single marketplace cache
 *
 * Updates a specific marketplace from its source by doing an in-place update.
 * For git sources, runs git pull in the existing directory.
 * For URL sources, re-downloads to the existing file.
 * Clears the memoization cache and updates the lastUpdated timestamp.
 *
 * @param name - The name of the marketplace to refresh
 * @param onProgress - Optional callback to report progress
 * @throws If marketplace not found or refresh fails
 */
// refreshMarketplace 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshMarketplace(
  name: string,
  onProgress?: MarketplaceProgressCallback,
  options?: { disableCredentialHelper?: boolean },
): Promise<void> {
  // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const config = await loadKnownMarketplacesConfig()
  // entry保存`config[name]`，供插件工具 marketplace Manager后续判断或输出使用。
  const entry = config[name]

  // entry缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!entry) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Marketplace '${name}' not found. Available marketplaces: ${Object.keys(config).join(', ')}`,
    )
  }

  // Clear the memoization cache for this specific marketplace
  // 调用 getMarketplace.cache?.delete?.(name)，完成这一处局部操作。
  getMarketplace.cache?.delete?.(name)

  // settings-sourced marketplaces have no upstream to pull. Edits to the
  // inline plugins array surface as sourceChanged in the reconciler, which
  // re-materializes via addMarketplaceSource — refresh is not the vehicle.
  // 当 `entry.source.source` 匹配 `'settings'` 时，插件管理执行对应分支。
  if (entry.source.source === 'settings') {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Skipping refresh for settings-sourced marketplace '${name}' — no upstream`,
    )
    // 插件工具 marketplace Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // For updates, use the existing installLocation directly (in-place update)
    // installLocation 命名 `entry.installLocation`，让后续代码直接表达这个值的用途。
    const installLocation = entry.installLocation
    // source保存`entry.source`，供插件工具 marketplace Manager后续判断或输出使用。
    const source = entry.source

    // Seed-managed marketplaces are controlled by the seed image. Refreshing
    // would be pointless — registerSeedMarketplaces() overwrites installLocation
    // back to seed on next startup. Error with guidance instead.
    // seedDir保存`seedDirFor`，供插件管理后续处理使用。
    const seedDir = seedDirFor(installLocation)
    // 满足 `seedDir` 时，插件管理执行该分支。
    if (seedDir) {
      // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
      throw new Error(
        `Marketplace '${name}' is seed-managed (${seedDir}) and its content is ` +
          `controlled by the seed image. To update: ask your admin to update the seed.`,
      )
    }

    // For remote sources (github/git/url), installLocation must be inside the
    // marketplaces cache dir. A corrupted value (gh-32793, gh-32661 — e.g.
    // Windows path read on WSL, literal tilde, manual edit) can point at the
    // user's project. cacheMarketplaceFromGit would then run git ops with that
    // cwd (git walks up to the user's .git) and fs.rm it on pull failure.
    // Refuse instead of auto-fixing so the user knows their state is corrupted.
    // 满足 `!isLocalMarketplaceSource(source)` 时，插件管理执行该分支。
    if (!isLocalMarketplaceSource(source)) {
      // cacheDir 缓存读取`resolve`，供插件管理后续处理使用。
      const cacheDir = resolve(getMarketplacesCacheDir())
      // resolvedLoc读取`resolve`，供插件管理后续处理使用。
      const resolvedLoc = resolve(installLocation)
      // `resolvedLoc` 与 `cacheDir && !resolvedLoc.starts...` 不一致时刷新派生状态，避免使用过期结果。
      if (resolvedLoc !== cacheDir && !resolvedLoc.startsWith(cacheDir + sep)) {
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `Marketplace '${name}' has a corrupted installLocation ` +
            `(${installLocation}) — expected a path inside ${cacheDir}. ` +
            `This can happen after cross-platform path writes or manual edits ` +
            `to known_marketplaces.json. ` +
            `Run: claude plugin marketplace remove "${name}" and re-add it.`,
        )
      }
    }

    // inc-5046: official marketplace fetches from a GCS mirror instead of
    // git-cloning GitHub. Special-cased by NAME (not a new source type) so
    // no data migration is needed — existing known_marketplaces.json entries
    // still say source:'github', which is true (GCS is a mirror).
    // 满足 `name === OFFICIAL_MARKETPLACE_NAME` 时，插件管理执行该分支。
    if (name === OFFICIAL_MARKETPLACE_NAME) {
      // sha读取`fetchOfficialMarketplaceFromGcs`，供插件管理后续处理使用。
      const sha = await fetchOfficialMarketplaceFromGcs(
        installLocation,
        getMarketplacesCacheDir(),
      )
      // `sha` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (sha !== null) {
        // config[name 配置更新为 `{ ...entry, lastUpdated: new Date().toISOString() }`，确保插件工具 marketplace Manager后续读取最新状态。
        config[name] = { ...entry, lastUpdated: new Date().toISOString() }
        // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
        await saveKnownMarketplacesConfig(config)
        // 插件工具 marketplace Manager在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // GCS failed — fall through to git ONLY if the kill-switch allows.
      // Default true (backend write perms are pending as of inc-5046); flip
      // to false via GrowthBook once the backend is confirmed live so new
      // clients NEVER hit GitHub for the official marketplace.
      // 插件管理在这里按实际状态进入对应分支。
      if (
        !getFeatureValue_CACHED_MAY_BE_STALE(
          'tengu_plugin_official_mkt_git_fallback',
          true,
        )
      ) {
        // Throw, don't return — every other failure path in this function
        // throws, and callers like ManageMarketplaces.tsx:259 increment
        // updatedCount on any non-throwing return. A silent return would
        // report "Updated 1 marketplace" when nothing was refreshed.
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          'Official marketplace GCS fetch failed and git fallback is disabled',
        )
      }
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Official marketplace GCS failed; falling back to git', {
        level: 'warn',
      })
      // ...falls through to source.source === 'github' branch below
    }

    // Update based on source type
    // 当 `source.source` 匹配 `'github' || source.source =...` 时，插件管理执行对应分支。
    if (source.source === 'github' || source.source === 'git') {
      // Git sources: do in-place git pull
      // 当 `source.source` 匹配 `'github'` 时，插件管理执行对应分支。
      if (source.source === 'github') {
        // Same SSH/HTTPS fallback as loadAndCacheMarketplace: if the pull
        // succeeds the remote URL in .git/config is used, but a re-clone
        // needs a URL — pick the right protocol up-front and fall back.
        // sshUrl 命名 ``git@github.com:${source.repo}.git``，让后续代码直接表达这个值的用途。
        const sshUrl = `git@github.com:${source.repo}.git`
        // httpsUrl保存``https://github.com/${source.repo}.git``，作为后续固定文本处理的输入。
        const httpsUrl = `https://github.com/${source.repo}.git`

        // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)` 时，插件管理执行该分支。
        if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
          // CCR: always HTTPS (no SSH keys available)
          // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
          await cacheMarketplaceFromGit(
            httpsUrl,
            installLocation,
            source.ref,
            source.sparsePaths,
            onProgress,
            options,
          )
        } else {
          // sshConfigured 配置保存`isGitHubSshLikelyConfigured`，供插件管理后续处理使用。
          const sshConfigured = await isGitHubSshLikelyConfigured()
          // primaryUrl 命名 `sshConfigured ? sshUrl : httpsUrl`，让后续代码直接表达这个值的用途。
          const primaryUrl = sshConfigured ? sshUrl : httpsUrl
          // fallbackUrl保存`sshConfigured ? httpsUrl : sshUrl`，供插件工具 marketplace Manager后续判断或输出使用。
          const fallbackUrl = sshConfigured ? httpsUrl : sshUrl

          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
            await cacheMarketplaceFromGit(
              primaryUrl,
              installLocation,
              source.ref,
              source.sparsePaths,
              onProgress,
              options,
            )
          } catch {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Marketplace refresh failed with ${sshConfigured ? 'SSH' : 'HTTPS'} for ${source.repo}, falling back to ${sshConfigured ? 'HTTPS' : 'SSH'}`,
              { level: 'info' },
            )
            // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
            await cacheMarketplaceFromGit(
              fallbackUrl,
              installLocation,
              source.ref,
              source.sparsePaths,
              onProgress,
              options,
            )
          }
        }
      } else {
        // Explicit git URL: use as-is (no fallback available)
        // 等待 `cacheMarketplaceFromGit(` 完成，再继续插件工具 marketplace Manager的异步流程。
        await cacheMarketplaceFromGit(
          source.url,
          installLocation,
          source.ref,
          source.sparsePaths,
          onProgress,
          options,
        )
      }
      // Validate that marketplace.json still exists after update
      // The repo may have been restructured or deprecated
      // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `readCachedMarketplace(installLocation)` 完成，再继续插件工具 marketplace Manager的异步流程。
        await readCachedMarketplace(installLocation)
      } catch {
        // sourceDisplay 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const sourceDisplay =
          source.source === 'github'
            ? source.repo
            : redactUrlCredentials(source.url)
        // reason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const reason =
          name === 'claude-code-plugins'
            ? `We've deprecated "claude-code-plugins" in favor of "claude-plugins-official".`
            : `This marketplace may have been deprecated or moved to a new location.`
        // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
        throw new Error(
          `The marketplace.json file is no longer present in this repository.\n\n` +
            `${reason}\n` +
            `Source: ${sourceDisplay}\n\n` +
            `You can remove this marketplace with: claude plugin marketplace remove "${name}"`,
        )
      }
    // 插件工具 marketplace Manager在这里处理 `} else if (source.source === 'url') {`，完成这一小步状态转换。
    } else if (source.source === 'url') {
      // URL sources: re-download to existing file
      // 等待 `cacheMarketplaceFromUrl(` 完成，再继续插件工具 marketplace Manager的异步流程。
      await cacheMarketplaceFromUrl(
        source.url,
        installLocation,
        source.headers,
        onProgress,
      )
    // 插件工具 marketplace Manager在这里处理 `} else if (isLocalMarketplaceSource(source)) {`，完成这一小步状态转换。
    } else if (isLocalMarketplaceSource(source)) {
      // Local sources: no remote to update from, but validate the file still exists and is valid
      // 调用 safeCallProgress，触发插件管理此处需要的副作用。
      safeCallProgress(onProgress, 'Validating local marketplace')
      // Read and validate to ensure the marketplace file is still valid
      // 等待 `readCachedMarketplace(installLocation)` 完成，再继续插件工具 marketplace Manager的异步流程。
      await readCachedMarketplace(installLocation)
    } else {
      // 抛出 new Error(`Unsupported marketplace source type for refresh`)，阻止插件管理在无效状态下继续运行。
      throw new Error(`Unsupported marketplace source type for refresh`)
    }

    // Update lastUpdated timestamp
    // 插件工具 marketplace Manager在这里处理 `config[name]!.lastUpdated = new Date().toISOString()`，完成这一小步状态转换。
    config[name]!.lastUpdated = new Date().toISOString()
    // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
    await saveKnownMarketplacesConfig(config)

    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Successfully refreshed marketplace: ${name}`)
  } catch (error) {
    // errorMessage 消息数据保存`String`，供插件管理后续处理使用。
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Failed to refresh marketplace ${name}: ${errorMessage}`, {
      level: 'error',
    })
    // 抛出 new Error(`Failed to refresh marketplace '${name}': ${errorMessage}`)，阻止插件管理在无效状态下继续运行。
    throw new Error(`Failed to refresh marketplace '${name}': ${errorMessage}`)
  }
}

/**
 * Set the autoUpdate flag for a marketplace
 *
 * When autoUpdate is enabled, the marketplace and its installed plugins
 * will be automatically updated on startup.
 *
 * @param name - The name of the marketplace to update
 * @param autoUpdate - Whether to enable auto-update
 * @throws If marketplace not found
 */
// setMarketplaceAutoUpdate 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setMarketplaceAutoUpdate(
  name: string,
  autoUpdate: boolean,
): Promise<void> {
  // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const config = await loadKnownMarketplacesConfig()
  // entry保存`config[name]`，供插件工具 marketplace Manager后续判断或输出使用。
  const entry = config[name]

  // entry缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!entry) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Marketplace '${name}' not found. Available marketplaces: ${Object.keys(config).join(', ')}`,
    )
  }

  // Seed-managed marketplaces always have autoUpdate: false (read-only, git-pull
  // would fail). Toggle appears to work but registerSeedMarketplaces overwrites
  // it on next startup. Error with guidance instead of silent revert.
  // seedDir保存`seedDirFor`，供插件管理后续处理使用。
  const seedDir = seedDirFor(entry.installLocation)
  // 满足 `seedDir` 时，插件管理执行该分支。
  if (seedDir) {
    // 抛出 new Error(，阻止插件管理在无效状态下继续运行。
    throw new Error(
      `Marketplace '${name}' is seed-managed (${seedDir}) and ` +
        `auto-update is always disabled for seed content. ` +
        `To update: ask your admin to update the seed.`,
    )
  }

  // Only update if the value is actually changing
  // 满足 `entry.autoUpdate === autoUpdate` 时，插件管理执行该分支。
  if (entry.autoUpdate === autoUpdate) {
    // 插件工具 marketplace Manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // config[name 配置更新为 `{`，确保插件工具 marketplace Manager后续读取最新状态。
  config[name] = {
    ...entry,
    autoUpdate,
  }
  // 等待 `saveKnownMarketplacesConfig(config)` 完成，再继续插件工具 marketplace Manager的异步流程。
  await saveKnownMarketplacesConfig(config)

  // Also update intent in settings if declared there — write to the SAME
  // source that declared it to avoid creating duplicates at wrong scope
  // declaringSource读取`getMarketplaceDeclaringSource`，供插件管理后续处理使用。
  const declaringSource = getMarketplaceDeclaringSource(name)
  // 满足 `declaringSource` 时，插件管理执行该分支。
  if (declaringSource) {
    // declared 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const declared =
      getSettingsForSource(declaringSource)?.extraKnownMarketplaces?.[name]
    // 满足 `declared` 时，插件管理执行该分支。
    if (declared) {
      // 调用 saveMarketplaceToSettings，触发插件管理此处需要的副作用。
      saveMarketplaceToSettings(
        name,
        { source: declared.source, autoUpdate },
        declaringSource,
      )
    }
  }

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`Set autoUpdate=${autoUpdate} for marketplace: ${name}`)
}

// _test 集中保存插件工具 marketplace Manager要一起传递的字段。
export const _test = {
  redactUrlCredentials,
}
