/**
 * Core plugin operations (install, uninstall, enable, disable, update)
 *
 * This module provides pure library functions that can be used by both:
 * - CLI commands (`claude plugin install/uninstall/enable/disable/update`)
 * - Interactive UI (ManagePlugins.tsx)
 *
 * Functions in this module:
 * - Do NOT call process.exit()
 * - Do NOT write to console
 * - Return result objects indicating success/failure with messages
 * - Can throw errors for unexpected failures
 */
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname, join } from 'path'
// 引入 getOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../bootstrap/state.js'
// 引入 isBuiltinPluginId，将 ../../plugins/builtinPlugins.js 中已经封装好的能力接到本文件流程里。
import { isBuiltinPluginId } from '../../plugins/builtinPlugins.js'
// 类型依赖 { LoadedPlugin, PluginManifest } 来自 ../../types/plugin.js，用于校准服务层 plugin Operations的数据契约。
import type { LoadedPlugin, PluginManifest } from '../../types/plugin.js'
// 复用 isENOENT、toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { isENOENT, toError } from '../../utils/errors.js'
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  clearAllCaches,
  markPluginVersionOrphaned,
} from '../../utils/plugins/cacheUtils.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  findReverseDependents,
  formatReverseDependentsSuffix,
} from '../../utils/plugins/dependencyResolver.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  loadInstalledPluginsFromDisk,
  loadInstalledPluginsV2,
  removePluginInstallation,
  updateInstallationPathOnDisk,
} from '../../utils/plugins/installedPluginsManager.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  getMarketplace,
  getPluginById,
  loadKnownMarketplacesConfig,
} from '../../utils/plugins/marketplaceManager.js'
// 复用 deletePluginDataDir 工具函数，把通用处理留在 ../../utils/plugins/pluginDirectories.js 中维护。
import { deletePluginDataDir } from '../../utils/plugins/pluginDirectories.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  parsePluginIdentifier,
  scopeToSettingSource,
} from '../../utils/plugins/pluginIdentifier.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  formatResolutionError,
  installResolvedPlugin,
} from '../../utils/plugins/pluginInstallationHelpers.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  cachePlugin,
  copyPluginToVersionedCache,
  getVersionedCachePath,
  getVersionedZipCachePath,
  loadAllPlugins,
  loadPluginManifest,
} from '../../utils/plugins/pluginLoader.js'
// 复用 deletePluginOptions 工具函数，把通用处理留在 ../../utils/plugins/pluginOptionsStorage.js 中维护。
import { deletePluginOptions } from '../../utils/plugins/pluginOptionsStorage.js'
// 复用 isPluginBlockedByPolicy 工具函数，把通用处理留在 ../../utils/plugins/pluginPolicy.js 中维护。
import { isPluginBlockedByPolicy } from '../../utils/plugins/pluginPolicy.js'
// 复用 getPluginEditableScopes 工具函数，把通用处理留在 ../../utils/plugins/pluginStartupCheck.js 中维护。
import { getPluginEditableScopes } from '../../utils/plugins/pluginStartupCheck.js'
// 复用 calculatePluginVersion 工具函数，把通用处理留在 ../../utils/plugins/pluginVersioning.js 中维护。
import { calculatePluginVersion } from '../../utils/plugins/pluginVersioning.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import type {
  PluginMarketplaceEntry,
  PluginScope,
} from '../../utils/plugins/schemas.js'
// 整理这一组导入，让服务层 plugin Operations后续逻辑可以直接复用这些外部能力。
import {
  getSettingsForSource,
  updateSettingsForSource,
} from '../../utils/settings/settings.js'
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js'

/** Valid installable scopes (excludes 'managed' which can only be installed from managed-settings.json) */
// VALID_INSTALLABLE_SCOPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const VALID_INSTALLABLE_SCOPES = ['user', 'project', 'local'] as const

/** Installation scope type derived from VALID_INSTALLABLE_SCOPES */
// InstallableScope 固化服务层 plugin Operations里传递的数据形状，帮助调用方按同一结构读写字段。
export type InstallableScope = (typeof VALID_INSTALLABLE_SCOPES)[number]

/** Valid scopes for update operations (includes 'managed' since managed plugins can be updated) */
// VALID_UPDATE_SCOPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const VALID_UPDATE_SCOPES: readonly PluginScope[] = [
  'user',
  'project',
  'local',
  'managed',
] as const

/**
 * Assert that a scope is a valid installable scope at runtime
 * @param scope The scope to validate
 * @throws Error if scope is not a valid installable scope
 */
// assertInstallableScope 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function assertInstallableScope(
  scope: string,
): asserts scope is InstallableScope {
  // 满足 `!VALID_INSTALLABLE_SCOPES.includes(scope as InstallableScope)` 时，服务层 plugin Operations执行该分支。
  if (!VALID_INSTALLABLE_SCOPES.includes(scope as InstallableScope)) {
    // 抛出 new Error(，阻止服务层 plugin Operations在无效状态下继续运行。
    throw new Error(
      `Invalid scope "${scope}". Must be one of: ${VALID_INSTALLABLE_SCOPES.join(', ')}`,
    )
  }
}

/**
 * Type guard to check if a scope is an installable scope (not 'managed').
 * Use this for type narrowing in conditional blocks.
 */
// isInstallableScope 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInstallableScope(
  scope: PluginScope,
): scope is InstallableScope {
  // 返回 `VALID_INSTALLABLE_SCOPES.includes(scope as InstallableScope)`，作为服务层 plugin Operations这次计算的结果。
  return VALID_INSTALLABLE_SCOPES.includes(scope as InstallableScope)
}

/**
 * Get the project path for scopes that are project-specific.
 * Returns the original cwd for 'project' and 'local' scopes, undefined otherwise.
 */
// getProjectPathForScope 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectPathForScope(scope: PluginScope): string | undefined {
  // 返回 `scope === 'project' || scope === 'local' ? getOriginalCwd() : undefined`，作为服务层 plugin Operations这次计算的结果。
  return scope === 'project' || scope === 'local' ? getOriginalCwd() : undefined
}

/**
 * Is this plugin enabled (value === true) in .claude/settings.json?
 *
 * Distinct from V2 installed_plugins.json scope: that file tracks where a
 * plugin was *installed from*, but the same plugin can also be enabled at
 * project scope via settings. The uninstall UI needs to check THIS, because
 * a user-scope install with a project-scope enablement means "uninstall"
 * would succeed at removing the user install while leaving the project
 * enablement active — the plugin keeps running.
 */
// isPluginEnabledAtProjectScope 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPluginEnabledAtProjectScope(pluginId: string): boolean {
  // 返回 `(`，作为服务层 plugin Operations这次计算的结果。
  return (
    getSettingsForSource('projectSettings')?.enabledPlugins?.[pluginId] === true
  )
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of a plugin operation
 */
// PluginOperationResult 固化服务层 plugin Operations里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginOperationResult = {
  success: boolean
  message: string
  pluginId?: string
  pluginName?: string
  scope?: PluginScope
  /** Plugins that declare this plugin as a dependency (warning on uninstall/disable) */
  reverseDependents?: string[]
}

/**
 * Result of a plugin update operation
 */
// PluginUpdateResult 固化服务层 plugin Operations里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginUpdateResult = {
  success: boolean
  message: string
  pluginId?: string
  newVersion?: string
  oldVersion?: string
  alreadyUpToDate?: boolean
  scope?: PluginScope
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Search all editable settings scopes for a plugin ID matching the given input.
 *
 * If `plugin` contains `@`, it's treated as a full pluginId and returned if
 * found in any scope. If `plugin` is a bare name, searches for any key
 * starting with `{plugin}@` in any scope.
 *
 * Returns the most specific scope where the plugin is mentioned (regardless
 * of enabled/disabled state) plus the resolved full pluginId.
 *
 * Precedence: local > project > user (most specific wins).
 */
// findPluginInSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findPluginInSettings(plugin: string): {
  pluginId: string
  scope: InstallableScope
} | null {
  // hasMarketplace 市场数据记录 `plugin.includes` 是否成立，服务层 plugin Operations随后按该结果分支。
  const hasMarketplace = plugin.includes('@')
  // Most specific first — first match wins
  // searchOrder 聚合成有序列表，保持后续遍历顺序稳定。
  const searchOrder: InstallableScope[] = ['local', 'project', 'user']

  // 按顺序遍历 `searchOrder` 中的scope，逐个交给服务层 plugin Operations处理。
  for (const scope of searchOrder) {
    // enabledPlugins 插件数据读取`getSettingsForSource`，供服务层 plugin Operations后续处理使用。
    const enabledPlugins = getSettingsForSource(
      scopeToSettingSource(scope),
    )?.enabledPlugins
    // enabledPlugins 插件数据缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
    if (!enabledPlugins) continue

    // 逐项读取 `Object.keys(enabledPlugins)` 中的key，按输入顺序推进服务层 plugin Operations。
    for (const key of Object.keys(enabledPlugins)) {
      // 满足 `hasMarketplace ? key === plugin : key.startsWith(`${plugin}@`)` 时，服务层 plugin Operations执行该分支。
      if (hasMarketplace ? key === plugin : key.startsWith(`${plugin}@`)) {
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return { pluginId: key, scope }
      }
    }
  }
  // 返回 `null`，作为服务层 plugin Operations这次计算的结果。
  return null
}

/**
 * Helper function to find a plugin from loaded plugins
 */
// findPluginByIdentifier 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findPluginByIdentifier(
  plugin: string,
  plugins: LoadedPlugin[],
): LoadedPlugin | undefined {
  // 从 `parsePluginIdentifier(plugin)` 解构 name、marketplace，减少服务层 plugin Operations对同一对象的重复访问。
  const { name, marketplace } = parsePluginIdentifier(plugin)

  // 返回 `plugins.find(p => {`，作为服务层 plugin Operations这次计算的结果。
  return plugins.find(p => {
    // Check exact name match
    // 组合条件 `p.name === plugin || p.name === name` 成立时，服务层 plugin Operations才启用这条专门路径。
    if (p.name === plugin || p.name === name) return true

    // If marketplace specified, check if it matches the source
    // 组合条件 `marketplace && p.source` 成立时，服务层 plugin Operations才启用这条专门路径。
    if (marketplace && p.source) {
      // 返回 `p.name === name && p.source.includes(`@${marketplace}`)`，作为服务层 plugin Operations这次计算的结果。
      return p.name === name && p.source.includes(`@${marketplace}`)
    }

    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  })
}

/**
 * Resolve a plugin ID from V2 installed plugins data for a plugin that may
 * have been delisted from its marketplace. Returns null if the plugin is not
 * found in V2 data.
 */
// resolveDelistedPluginId 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resolveDelistedPluginId(
  plugin: string,
): { pluginId: string; pluginName: string } | null {
  // 从 `parsePluginIdentifier(plugin)` 解构 name，减少服务层 plugin Operations对同一对象的重复访问。
  const { name } = parsePluginIdentifier(plugin)
  // installedData读取`loadInstalledPluginsV2`，供服务层 plugin Operations后续处理使用。
  const installedData = loadInstalledPluginsV2()

  // Try exact match first, then search by name
  // 满足 `installedData.plugins[plugin]?.length` 时，服务层 plugin Operations执行该分支。
  if (installedData.plugins[plugin]?.length) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return { pluginId: plugin, pluginName: name }
  }

  // matchingKey派生`Object.keys`，供服务层 plugin Operations后续处理使用。
  const matchingKey = Object.keys(installedData.plugins).find(key => {
    // 从 `parsePluginIdentifier(key)` 解构 name，减少服务层 plugin Operations对同一对象的重复访问。
    const { name: keyName } = parsePluginIdentifier(key)
    // 返回 `keyName === name && (installedData.plugins[key]?.length ?? 0) > 0`，作为服务层 plugin Operations这次计算的结果。
    return keyName === name && (installedData.plugins[key]?.length ?? 0) > 0
  })

  // 满足 `matchingKey` 时，服务层 plugin Operations执行该分支。
  if (matchingKey) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return { pluginId: matchingKey, pluginName: name }
  }

  // 返回 `null`，作为服务层 plugin Operations这次计算的结果。
  return null
}

/**
 * Get the most relevant installation for a plugin from V2 data.
 * For project/local scoped plugins, prioritizes installations matching the current project.
 * Priority order: local (matching project) > project (matching project) > user > first available
 */
// getPluginInstallationFromV2 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPluginInstallationFromV2(pluginId: string): {
  scope: PluginScope
  projectPath?: string
} {
  // installedData读取`loadInstalledPluginsV2`，供服务层 plugin Operations后续处理使用。
  const installedData = loadInstalledPluginsV2()
  // installations 集合 命名 `installedData.plugins[pluginId]`，让后续代码直接表达这个值的用途。
  const installations = installedData.plugins[pluginId]

  // !installations || installations 集合为空时立即返回或跳过，避免服务层 plugin Operations把空集合当成可处理内容。
  if (!installations || installations.length === 0) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return { scope: 'user' }
  }

  // currentProjectPath 路径数据读取`getOriginalCwd`，供服务层 plugin Operations后续处理使用。
  const currentProjectPath = getOriginalCwd()

  // Find installations by priority: local > project > user > managed
  // localInstall筛选`installations.find`，供服务层 plugin Operations后续处理使用。
  const localInstall = installations.find(
    // inst更新为 `> inst.scope === 'local' && inst.projectPath === currentP...`，确保服务层后续读取最新状态。
    inst => inst.scope === 'local' && inst.projectPath === currentProjectPath,
  )
  // 满足 `localInstall` 时，服务层 plugin Operations执行该分支。
  if (localInstall) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return { scope: localInstall.scope, projectPath: localInstall.projectPath }
  }

  // projectInstall筛选`installations.find`，供服务层 plugin Operations后续处理使用。
  const projectInstall = installations.find(
    // inst更新为 `> inst.scope === 'project' && inst.projectPath === curren...`，确保服务层后续读取最新状态。
    inst => inst.scope === 'project' && inst.projectPath === currentProjectPath,
  )
  // 满足 `projectInstall` 时，服务层 plugin Operations执行该分支。
  if (projectInstall) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      scope: projectInstall.scope,
      projectPath: projectInstall.projectPath,
    }
  }

  // userInstall筛选`installations.find`，供服务层 plugin Operations后续处理使用。
  const userInstall = installations.find(inst => inst.scope === 'user')
  // 满足 `userInstall` 时，服务层 plugin Operations执行该分支。
  if (userInstall) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return { scope: userInstall.scope }
  }

  // Fall back to first installation (could be managed)
  // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
  return {
    scope: installations[0]!.scope,
    projectPath: installations[0]!.projectPath,
  }
}

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Install a plugin (settings-first).
 *
 * Order of operations:
 *   1. Search materialized marketplaces for the plugin
 *   2. Write settings (THE ACTION — declares intent)
 *   3. Cache plugin + record version hint (materialization)
 *
 * Marketplace reconciliation is NOT this function's responsibility — startup
 * reconcile handles declared-but-not-materialized marketplaces. If the
 * marketplace isn't found, "not found" is the correct error.
 *
 * @param plugin Plugin identifier (name or plugin@marketplace)
 * @param scope Installation scope: user, project, or local (defaults to 'user')
 * @returns Result indicating success/failure
 */
// installPluginOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installPluginOp(
  plugin: string,
  scope: InstallableScope = 'user',
): Promise<PluginOperationResult> {
  // 调用 assertInstallableScope，触发服务层 plugin Operations此处需要的副作用。
  assertInstallableScope(scope)

  // 服务层 plugin Operations先整理这一处局部数据，后续分支可以直接读取。
  const { name: pluginName, marketplace: marketplaceName } =
    parsePluginIdentifier(plugin)

  // ── Search materialized marketplaces for the plugin ──
  // foundPlugin 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let foundPlugin: PluginMarketplaceEntry | undefined
  // foundMarketplace 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let foundMarketplace: string | undefined
  // marketplaceInstallLocation 市场数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let marketplaceInstallLocation: string | undefined

  // 满足 `marketplaceName` 时，服务层 plugin Operations执行该分支。
  if (marketplaceName) {
    // pluginInfo 插件数据读取`getPluginById`，供服务层 plugin Operations后续处理使用。
    const pluginInfo = await getPluginById(plugin)
    // 满足 `pluginInfo` 时，服务层 plugin Operations执行该分支。
    if (pluginInfo) {
      // foundPlugin 插件数据更新为 `pluginInfo.entry`，确保服务层后续读取最新状态。
      foundPlugin = pluginInfo.entry
      // foundMarketplace 市场数据更新为 `marketplaceName`，确保服务层后续读取最新状态。
      foundMarketplace = marketplaceName
      // marketplaceInstallLocation 市场数据更新为 `pluginInfo.marketplaceInstallLocation`，确保服务层后续读取最新状态。
      marketplaceInstallLocation = pluginInfo.marketplaceInstallLocation
    }
  } else {
    // marketplaces 市场数据读取`loadKnownMarketplacesConfig`，供服务层 plugin Operations后续处理使用。
    const marketplaces = await loadKnownMarketplacesConfig()
    // 循环处理 `const [mktName, mktConfig] of Object.entries(marketplaces)`，让服务层 plugin Operations把同类条目按顺序走完。
    for (const [mktName, mktConfig] of Object.entries(marketplaces)) {
      // 保护这一段可能失败的服务层 plugin Operations操作，确保异常能进入相邻错误处理。
      try {
        // marketplace 市场数据读取`getMarketplace`，供服务层 plugin Operations后续处理使用。
        const marketplace = await getMarketplace(mktName)
        // pluginEntry 插件数据筛选`plugins.find`，供服务层 plugin Operations后续处理使用。
        const pluginEntry = marketplace.plugins.find(p => p.name === pluginName)
        // 满足 `pluginEntry` 时，服务层 plugin Operations执行该分支。
        if (pluginEntry) {
          // foundPlugin 插件数据更新为 `pluginEntry`，确保服务层后续读取最新状态。
          foundPlugin = pluginEntry
          // foundMarketplace 市场数据更新为 `mktName`，确保服务层后续读取最新状态。
          foundMarketplace = mktName
          // marketplaceInstallLocation 市场数据更新为 `mktConfig.installLocation`，确保服务层后续读取最新状态。
          marketplaceInstallLocation = mktConfig.installLocation
          // 结束这个分支或循环，避免服务层 plugin Operations继续落入后续路径。
          break
        }
      } catch (error) {
        // 记录服务层 plugin Operations运行诊断，方便排查异常路径或性能问题。
        logError(toError(error))
        // 跳过当前项，继续处理服务层 plugin Operations中的下一轮循环。
        continue
      }
    }
  }

  // 组合条件 `!foundPlugin || !foundMarketplace` 成立时，服务层 plugin Operations才启用这条专门路径。
  if (!foundPlugin || !foundMarketplace) {
    // location保存`marketplaceName`，供服务层 plugin Operations后续判断或输出使用。
    const location = marketplaceName
      ? `marketplace "${marketplaceName}"`
      : 'any configured marketplace'
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${pluginName}" not found in ${location}`,
    }
  }

  // entry保存`foundPlugin`，供服务层 plugin Operations后续判断或输出使用。
  const entry = foundPlugin
  // pluginId 插件数据 命名 ``${entry.name}@${foundMarketplace}``，让后续代码直接表达这个值的用途。
  const pluginId = `${entry.name}@${foundMarketplace}`

  // 结果保存`installResolvedPlugin`，供服务层 plugin Operations后续处理使用。
  const result = await installResolvedPlugin({
    pluginId,
    entry,
    scope,
    marketplaceInstallLocation,
  })

  // result.ok缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
  if (!result.ok) {
    // 按照 result.reason 的取值选择服务层 plugin Operations的具体处理分支。
    switch (result.reason) {
      case 'local-source-no-location':
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Cannot install local plugin "${result.pluginName}" without marketplace install location`,
        }
      case 'settings-write-failed':
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Failed to update settings: ${result.message}`,
        }
      case 'resolution-failed':
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: formatResolutionError(result.resolution),
        }
      case 'blocked-by-policy':
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Plugin "${result.pluginName}" is blocked by your organization's policy and cannot be installed`,
        }
      case 'dependency-blocked-by-policy':
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Plugin "${result.pluginName}" depends on "${result.blockedDependency}", which is blocked by your organization's policy`,
        }
    }
  }

  // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
  return {
    success: true,
    message: `Successfully installed plugin: ${pluginId} (scope: ${scope})${result.depNote}`,
    pluginId,
    pluginName: entry.name,
    scope,
  }
}

/**
 * Uninstall a plugin
 *
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Uninstall from scope: user, project, or local (defaults to 'user')
 * @returns Result indicating success/failure
 */
// uninstallPluginOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function uninstallPluginOp(
  plugin: string,
  scope: InstallableScope = 'user',
  deleteDataDir = true,
): Promise<PluginOperationResult> {
  // Validate scope at runtime for early error detection
  // 调用 assertInstallableScope，触发服务层 plugin Operations此处需要的副作用。
  assertInstallableScope(scope)

  // 从 `await loadAllPlugins()` 解构 enabled、disabled，减少服务层 plugin Operations对同一对象的重复访问。
  const { enabled, disabled } = await loadAllPlugins()
  // allPlugins 插件数据 聚合成有序列表，保持后续遍历顺序稳定。
  const allPlugins = [...enabled, ...disabled]

  // Find the plugin
  // foundPlugin 插件数据筛选`findPluginByIdentifier`，供服务层 plugin Operations后续处理使用。
  const foundPlugin = findPluginByIdentifier(plugin, allPlugins)

  // settingSource保存`scopeToSettingSource`，供服务层 plugin Operations后续处理使用。
  const settingSource = scopeToSettingSource(scope)
  // settings 集合读取`getSettingsForSource`，供服务层 plugin Operations后续处理使用。
  const settings = getSettingsForSource(settingSource)

  // pluginId 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let pluginId: string
  // pluginName 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let pluginName: string

  // 满足 `foundPlugin` 时，服务层 plugin Operations执行该分支。
  if (foundPlugin) {
    // Find the matching settings key for this plugin (may differ from `plugin`
    // if user gave short name but settings has plugin@marketplace)
    // 服务层 plugin Operations在这里处理 `pluginId =`，完成这一小步状态转换。
    pluginId =
      Object.keys(settings?.enabledPlugins ?? {}).find(
        // k更新为 `>`，确保服务层后续读取最新状态。
        k =>
          k === plugin ||
          k === foundPlugin.name ||
          k.startsWith(`${foundPlugin.name}@`),
      ) ?? (plugin.includes('@') ? plugin : foundPlugin.name)
    // pluginName 插件数据更新为 `foundPlugin.name`，确保服务层后续读取最新状态。
    pluginName = foundPlugin.name
  } else {
    // Plugin not found via marketplace lookup — it may have been delisted.
    // Fall back to installed_plugins.json (V2) which tracks installations
    // independently of marketplace state.
    // resolved读取`resolveDelistedPluginId`，供服务层 plugin Operations后续处理使用。
    const resolved = resolveDelistedPluginId(plugin)
    // resolved缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
    if (!resolved) {
      // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
      return {
        success: false,
        message: `Plugin "${plugin}" not found in installed plugins`,
      }
    }
    // pluginId 插件数据更新为 `resolved.pluginId`，确保服务层后续读取最新状态。
    pluginId = resolved.pluginId
    // pluginName 插件数据更新为 `resolved.pluginName`，确保服务层后续读取最新状态。
    pluginName = resolved.pluginName
  }

  // Check if the plugin is installed in this scope (in V2 file)
  // projectPath 路径数据读取`getProjectPathForScope`，供服务层 plugin Operations后续处理使用。
  const projectPath = getProjectPathForScope(scope)
  // installedData读取`loadInstalledPluginsV2`，供服务层 plugin Operations后续处理使用。
  const installedData = loadInstalledPluginsV2()
  // installations 集合 命名 `installedData.plugins[pluginId]`，让后续代码直接表达这个值的用途。
  const installations = installedData.plugins[pluginId]
  // scopeInstallation筛选`find`，供服务层 plugin Operations后续处理使用。
  const scopeInstallation = installations?.find(
    // i更新为 `> i.scope === scope && i.projectPath === projectPath`，确保服务层后续读取最新状态。
    i => i.scope === scope && i.projectPath === projectPath,
  )

  // scopeInstallation缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
  if (!scopeInstallation) {
    // Try to find where the plugin is actually installed to provide a helpful error
    // 从 `getPluginInstallationFromV2(pluginId)` 解构 scope，减少服务层 plugin Operations对同一对象的重复访问。
    const { scope: actualScope } = getPluginInstallationFromV2(pluginId)
    // `actualScope` 与 `scope && installations && insta...` 不一致时刷新派生状态，避免使用过期结果。
    if (actualScope !== scope && installations && installations.length > 0) {
      // Project scope is special: .claude/settings.json is shared with the team.
      // Point users at the local-override escape hatch instead of --scope project.
      // 当 `actualScope` 匹配 `'project'` 时，服务层 plugin Operations执行对应分支。
      if (actualScope === 'project') {
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Plugin "${plugin}" is enabled at project scope (.claude/settings.json, shared with your team). To disable just for you: claude plugin disable ${plugin} --scope local`,
        }
      }
      // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
      return {
        success: false,
        message: `Plugin "${plugin}" is installed in ${actualScope} scope, not ${scope}. Use --scope ${actualScope} to uninstall.`,
      }
    }
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${plugin}" is not installed in ${scope} scope. Use --scope to specify the correct scope.`,
    }
  }

  // installPath 路径数据保存`scopeInstallation.installPath`，供后续判断或组装使用。
  const installPath = scopeInstallation.installPath

  // Remove the plugin from the appropriate settings file (delete key entirely)
  // Use undefined to signal deletion via mergeWith in updateSettingsForSource
  // newEnabledPlugins 插件数据 集中保存服务层 plugin Operations要一起传递的字段。
  const newEnabledPlugins: Record<string, boolean | string[] | undefined> = {
    ...settings?.enabledPlugins,
  }
  // newEnabledPlugins[pluginId 插件数据更新为 `undefined`，确保服务层 plugin Operations后续读取最新状态。
  newEnabledPlugins[pluginId] = undefined
  // 调用 updateSettingsForSource，触发服务层 plugin Operations此处需要的副作用。
  updateSettingsForSource(settingSource, {
    enabledPlugins: newEnabledPlugins,
  })

  // 清理相关缓存，确保服务层 plugin Operations下一次读取时重新加载最新数据。
  clearAllCaches()

  // Remove from installed_plugins_v2.json for this scope
  // 调用 removePluginInstallation，触发服务层 plugin Operations此处需要的副作用。
  removePluginInstallation(pluginId, scope, projectPath)

  // updatedData读取`loadInstalledPluginsV2`，供服务层 plugin Operations后续处理使用。
  const updatedData = loadInstalledPluginsV2()
  // remainingInstallations 集合读取 `updatedData.plugins[pluginId]` 对应条目，后续围绕该成员继续处理。
  const remainingInstallations = updatedData.plugins[pluginId]
  // isLastScope 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isLastScope =
    !remainingInstallations || remainingInstallations.length === 0
  // 组合条件 `isLastScope && installPath` 成立时，服务层 plugin Operations才启用这条专门路径。
  if (isLastScope && installPath) {
    // 等待 `markPluginVersionOrphaned(installPath)` 完成，再继续服务层 plugin Operations的异步流程。
    await markPluginVersionOrphaned(installPath)
  }
  // Separate from the `&& installPath` guard above — deletePluginOptions only
  // needs pluginId, not installPath. Last scope removed → wipe stored options
  // and secrets. Before this, uninstalling left orphaned entries in
  // settings.pluginConfigs (including the legacy ungated mcpServers sub-key
  // from the MCPB Configure flow) and keychain pluginSecrets forever. No
  // feature gate: deletePluginOptions no-ops when nothing is stored, and
  // pluginConfigs.mcpServers is written ungated so its cleanup must run
  // ungated too.
  // 满足 `isLastScope` 时，服务层 plugin Operations执行该分支。
  if (isLastScope) {
    // 调用 deletePluginOptions，触发服务层 plugin Operations此处需要的副作用。
    deletePluginOptions(pluginId)
    // 满足 `deleteDataDir` 时，服务层 plugin Operations执行该分支。
    if (deleteDataDir) {
      // 等待 `deletePluginDataDir(pluginId)` 完成，再继续服务层 plugin Operations的异步流程。
      await deletePluginDataDir(pluginId)
    }
  }

  // Warn (don't block) if other enabled plugins depend on this one.
  // Blocking creates tombstones — can't tear down a graph with a delisted
  // plugin. Load-time verifyAndDemote catches the fallout.
  // reverseDependents 集合筛选`findReverseDependents`，供服务层 plugin Operations后续处理使用。
  const reverseDependents = findReverseDependents(pluginId, allPlugins)
  // depWarn格式化`formatReverseDependentsSuffix`，供服务层 plugin Operations后续处理使用。
  const depWarn = formatReverseDependentsSuffix(reverseDependents)

  // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
  return {
    success: true,
    message: `Successfully uninstalled plugin: ${pluginName} (scope: ${scope})${depWarn}`,
    pluginId,
    pluginName,
    scope,
    reverseDependents:
      reverseDependents.length > 0 ? reverseDependents : undefined,
  }
}

/**
 * Set plugin enabled/disabled status (settings-first).
 *
 * Resolves the plugin ID and scope from settings — does NOT pre-gate on
 * installed_plugins.json. Settings declares intent; if the plugin isn't
 * cached yet, the next load will cache it.
 *
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param enabled true to enable, false to disable
 * @param scope Optional scope. If not provided, auto-detects the most specific
 *   scope where the plugin is mentioned in settings.
 * @returns Result indicating success/failure
 */
// setPluginEnabledOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function setPluginEnabledOp(
  plugin: string,
  enabled: boolean,
  scope?: InstallableScope,
): Promise<PluginOperationResult> {
  // operation保存`enabled ? 'enable' : 'disable'`，供后续判断或组装使用。
  const operation = enabled ? 'enable' : 'disable'

  // Built-in plugins: always use user-scope settings, bypass the normal
  // scope-resolution + installed_plugins lookup (they're not installed).
  // 满足 `isBuiltinPluginId(plugin)` 时，服务层 plugin Operations执行该分支。
  if (isBuiltinPluginId(plugin)) {
    // 从 `updateSettingsForSource('userSettings', {` 解构 error，减少服务层 plugin Operations对同一对象的重复访问。
    const { error } = updateSettingsForSource('userSettings', {
      enabledPlugins: {
        ...getSettingsForSource('userSettings')?.enabledPlugins,
        [plugin]: enabled,
      },
    })
    // 满足 `error` 时，服务层 plugin Operations执行该分支。
    if (error) {
      // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
      return {
        success: false,
        message: `Failed to ${operation} built-in plugin: ${error.message}`,
      }
    }
    // 清理相关缓存，确保服务层 plugin Operations下一次读取时重新加载最新数据。
    clearAllCaches()
    // 从 `parsePluginIdentifier(plugin)` 解构 name，减少服务层 plugin Operations对同一对象的重复访问。
    const { name: pluginName } = parsePluginIdentifier(plugin)
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: true,
      message: `Successfully ${operation}d built-in plugin: ${pluginName}`,
      pluginId: plugin,
      pluginName,
      scope: 'user',
    }
  }

  // 满足 `scope` 时，服务层 plugin Operations执行该分支。
  if (scope) {
    // 调用 assertInstallableScope，触发服务层 plugin Operations此处需要的副作用。
    assertInstallableScope(scope)
  }

  // ── Resolve pluginId and scope from settings ──
  // Search across editable scopes for any mention (enabled or disabled) of
  // this plugin. Does NOT pre-gate on installed_plugins.json.
  // pluginId 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let pluginId: string
  // resolvedScope 先占位，稍后的条件分支会根据实际输入补齐它。
  let resolvedScope: InstallableScope

  // found筛选`findPluginInSettings`，供服务层 plugin Operations后续处理使用。
  const found = findPluginInSettings(plugin)

  // 满足 `scope` 时，服务层 plugin Operations执行该分支。
  if (scope) {
    // Explicit scope: use it. Resolve pluginId from settings if possible,
    // otherwise require a full plugin@marketplace identifier.
    // resolvedScope更新为 `scope`，确保服务层后续读取最新状态。
    resolvedScope = scope
    // 满足 `found` 时，服务层 plugin Operations执行该分支。
    if (found) {
      // pluginId 插件数据更新为 `found.pluginId`，确保服务层后续读取最新状态。
      pluginId = found.pluginId
    // 服务层 plugin Operations在这里处理 `} else if (plugin.includes('@')) {`，完成这一小步状态转换。
    } else if (plugin.includes('@')) {
      // pluginId 插件数据更新为 `plugin`，确保服务层后续读取最新状态。
      pluginId = plugin
    } else {
      // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
      return {
        success: false,
        message: `Plugin "${plugin}" not found in settings. Use plugin@marketplace format.`,
      }
    }
  // 服务层 plugin Operations在这里处理 `} else if (found) {`，完成这一小步状态转换。
  } else if (found) {
    // Auto-detect scope: use the most specific scope where the plugin is
    // mentioned in settings.
    // pluginId 插件数据更新为 `found.pluginId`，确保服务层后续读取最新状态。
    pluginId = found.pluginId
    // resolvedScope更新为 `found.scope`，确保服务层后续读取最新状态。
    resolvedScope = found.scope
  // 服务层 plugin Operations在这里处理 `} else if (plugin.includes('@')) {`，完成这一小步状态转换。
  } else if (plugin.includes('@')) {
    // Not in any settings scope, but full pluginId given — default to user
    // scope (matches install default). This allows enabling a plugin that
    // was cached but never declared.
    // pluginId 插件数据更新为 `plugin`，确保服务层后续读取最新状态。
    pluginId = plugin
    // resolvedScope更新为 `'user'`，确保服务层后续读取最新状态。
    resolvedScope = 'user'
  } else {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${plugin}" not found in any editable settings scope. Use plugin@marketplace format.`,
    }
  }

  // ── Policy guard ──
  // Org-blocked plugins cannot be enabled at any scope. Check after pluginId
  // is resolved so we catch both full identifiers and bare-name lookups.
  // 组合条件 `enabled && isPluginBlockedByPolicy(pluginId)` 成立时，服务层 plugin Operations才启用这条专门路径。
  if (enabled && isPluginBlockedByPolicy(pluginId)) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${pluginId}" is blocked by your organization's policy and cannot be enabled`,
    }
  }

  // settingSource保存`scopeToSettingSource`，供服务层 plugin Operations后续处理使用。
  const settingSource = scopeToSettingSource(resolvedScope)
  // scopeSettingsValue 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const scopeSettingsValue =
    getSettingsForSource(settingSource)?.enabledPlugins?.[pluginId]

  // ── Cross-scope hint: explicit scope given but plugin is elsewhere ──
  // If the plugin is absent from the requested scope but present at a
  // different scope, guide the user to the right --scope — UNLESS they're
  // writing to a higher-precedence scope to override a lower one
  // (e.g. `disable --scope local` to override a project-enabled plugin
  // without touching the shared .claude/settings.json).
  // SCOPE_PRECEDENCE 集中保存服务层 plugin Operations要一起传递的字段。
  const SCOPE_PRECEDENCE: Record<InstallableScope, number> = {
    user: 0,
    project: 1,
    local: 2,
  }
  // isOverride 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isOverride =
    scope && found && SCOPE_PRECEDENCE[scope] > SCOPE_PRECEDENCE[found.scope]
  // 服务层 plugin Operations在这里进入条件判断，后续代码按实际状态分流。
  if (
    scope &&
    scopeSettingsValue === undefined &&
    found &&
    found.scope !== scope &&
    !isOverride
  ) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${plugin}" is installed at ${found.scope} scope, not ${scope}. Use --scope ${found.scope} or omit --scope to auto-detect.`,
    }
  }

  // ── Check current state (for idempotency messaging) ──
  // When explicit scope given: check that scope's settings value directly
  // (merged state can be wrong if plugin is enabled elsewhere but disabled here).
  // When auto-detected: use merged effective state.
  // When overriding a lower scope: check merged state — scopeSettingsValue is
  // undefined (plugin not in this scope yet), which would read as "already
  // disabled", but the whole point of the override is to write an explicit
  // `false` that masks the lower scope's `true`.
  // isCurrentlyEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isCurrentlyEnabled =
    scope && !isOverride
      ? scopeSettingsValue === true
      : getPluginEditableScopes().has(pluginId)
  // 满足 `enabled === isCurrentlyEnabled` 时，服务层 plugin Operations执行该分支。
  if (enabled === isCurrentlyEnabled) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${plugin}" is already ${enabled ? 'enabled' : 'disabled'}${scope ? ` at ${scope} scope` : ''}`,
    }
  }

  // On disable: capture reverse dependents from the PRE-disable snapshot,
  // before we write settings and clear the memoized plugin cache.
  // reverseDependents 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let reverseDependents: string[] | undefined
  // enabled缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
  if (!enabled) {
    // 从 `await loadAllPlugins()` 解构 enabled、disabled，减少服务层 plugin Operations对同一对象的重复访问。
    const { enabled: loadedEnabled, disabled } = await loadAllPlugins()
    // rdeps 集合筛选`findReverseDependents`，供服务层 plugin Operations后续处理使用。
    const rdeps = findReverseDependents(pluginId, [
      ...loadedEnabled,
      ...disabled,
    ])
    // 满足 `rdeps.length > 0` 时，服务层 plugin Operations执行该分支。
    if (rdeps.length > 0) reverseDependents = rdeps
  }

  // ── ACTION: write settings ──
  // 从 `updateSettingsForSource(settingSource, {` 解构 error，减少服务层 plugin Operations对同一对象的重复访问。
  const { error } = updateSettingsForSource(settingSource, {
    enabledPlugins: {
      ...getSettingsForSource(settingSource)?.enabledPlugins,
      [pluginId]: enabled,
    },
  })
  // 满足 `error` 时，服务层 plugin Operations执行该分支。
  if (error) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Failed to ${operation} plugin: ${error.message}`,
    }
  }

  // 清理相关缓存，确保服务层 plugin Operations下一次读取时重新加载最新数据。
  clearAllCaches()

  // 从 `parsePluginIdentifier(pluginId)` 解构 name，减少服务层 plugin Operations对同一对象的重复访问。
  const { name: pluginName } = parsePluginIdentifier(pluginId)
  // depWarn格式化`formatReverseDependentsSuffix`，供服务层 plugin Operations后续处理使用。
  const depWarn = formatReverseDependentsSuffix(reverseDependents)
  // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
  return {
    success: true,
    message: `Successfully ${operation}d plugin: ${pluginName} (scope: ${resolvedScope})${depWarn}`,
    pluginId,
    pluginName,
    scope: resolvedScope,
    reverseDependents,
  }
}

/**
 * Enable a plugin
 *
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Optional scope. If not provided, finds the most specific scope for the current project.
 * @returns Result indicating success/failure
 */
// enablePluginOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function enablePluginOp(
  plugin: string,
  scope?: InstallableScope,
): Promise<PluginOperationResult> {
  // 返回 `setPluginEnabledOp(plugin, true, scope)`，作为服务层 plugin Operations这次计算的结果。
  return setPluginEnabledOp(plugin, true, scope)
}

/**
 * Disable a plugin
 *
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Optional scope. If not provided, finds the most specific scope for the current project.
 * @returns Result indicating success/failure
 */
// disablePluginOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function disablePluginOp(
  plugin: string,
  scope?: InstallableScope,
): Promise<PluginOperationResult> {
  // 返回 `setPluginEnabledOp(plugin, false, scope)`，作为服务层 plugin Operations这次计算的结果。
  return setPluginEnabledOp(plugin, false, scope)
}

/**
 * Disable all enabled plugins
 *
 * @returns Result indicating success/failure with count of disabled plugins
 */
// disableAllPluginsOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function disableAllPluginsOp(): Promise<PluginOperationResult> {
  // enabledPlugins 插件数据读取`getPluginEditableScopes`，供服务层 plugin Operations后续处理使用。
  const enabledPlugins = getPluginEditableScopes()

  // 满足 `enabledPlugins.size === 0` 时，服务层 plugin Operations执行该分支。
  if (enabledPlugins.size === 0) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return { success: true, message: 'No enabled plugins to disable' }
  }

  // disabled 从空数组开始收集，后续循环会按处理顺序追加条目。
  const disabled: string[] = []
  // 错误列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const errors: string[] = []

  // 循环处理 `const [pluginId] of enabledPlugins`，让服务层 plugin Operations逐项把同类条目按顺序走完。
  for (const [pluginId] of enabledPlugins) {
    // 结果保存`setPluginEnabledOp`，供服务层 plugin Operations后续处理使用。
    const result = await setPluginEnabledOp(pluginId, false)
    // 满足 `result.success` 时，服务层 plugin Operations执行该分支。
    if (result.success) {
      // disabled追加新条目，保持收集顺序与输入顺序一致。
      disabled.push(pluginId)
    } else {
      // 错误列表追加新条目，保持收集顺序与输入顺序一致。
      errors.push(`${pluginId}: ${result.message}`)
    }
  }

  // 满足 `errors.length > 0` 时，服务层 plugin Operations执行该分支。
  if (errors.length > 0) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Disabled ${disabled.length} ${plural(disabled.length, 'plugin')}, ${errors.length} failed:\n${errors.join('\n')}`,
    }
  }

  // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
  return {
    success: true,
    message: `Disabled ${disabled.length} ${plural(disabled.length, 'plugin')}`,
  }
}

/**
 * Update a plugin to the latest version.
 *
 * This function performs a NON-INPLACE update:
 * 1. Gets the plugin info from the marketplace
 * 2. For remote plugins: downloads to temp dir and calculates version
 * 3. For local plugins: calculates version from marketplace source
 * 4. If version differs from currently installed, copies to new versioned cache directory
 * 5. Updates installation in V2 file (memory stays unchanged until restart)
 * 6. Cleans up old version if no longer referenced by any installation
 *
 * @param plugin Plugin name or plugin@marketplace identifier
 * @param scope Scope to update. Unlike install/uninstall/enable/disable, managed scope IS allowed.
 * @returns Result indicating success/failure with version info
 */
// updatePluginOp 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updatePluginOp(
  plugin: string,
  scope: PluginScope,
): Promise<PluginUpdateResult> {
  // Parse the plugin identifier to get the full plugin ID
  // 服务层 plugin Operations先整理这一处局部数据，后续分支可以直接读取。
  const { name: pluginName, marketplace: marketplaceName } =
    parsePluginIdentifier(plugin)
  // pluginId 插件数据保存`marketplaceName ? `${pluginName}@${marketplaceName}` : pl...`，供服务层 plugin Operations后续判断或输出使用。
  const pluginId = marketplaceName ? `${pluginName}@${marketplaceName}` : plugin

  // Get plugin info from marketplace
  // pluginInfo 插件数据读取`getPluginById`，供服务层 plugin Operations后续处理使用。
  const pluginInfo = await getPluginById(plugin)
  // pluginInfo 插件数据缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
  if (!pluginInfo) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${pluginName}" not found`,
      pluginId,
      scope,
    }
  }

  // 从 `pluginInfo` 解构 entry、marketplaceInstallLocation，减少服务层 plugin Operations对同一对象的重复访问。
  const { entry, marketplaceInstallLocation } = pluginInfo

  // Get installations from disk
  // diskData读取`loadInstalledPluginsFromDisk`，供服务层 plugin Operations后续处理使用。
  const diskData = loadInstalledPluginsFromDisk()
  // installations 集合读取 `diskData.plugins[pluginId]` 对应条目，后续围绕该成员继续处理。
  const installations = diskData.plugins[pluginId]

  // !installations || installations 集合为空时立即返回或跳过，避免服务层 plugin Operations把空集合当成可处理内容。
  if (!installations || installations.length === 0) {
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${pluginName}" is not installed`,
      pluginId,
      scope,
    }
  }

  // Determine projectPath based on scope
  // projectPath 路径数据读取`getProjectPathForScope`，供服务层 plugin Operations后续处理使用。
  const projectPath = getProjectPathForScope(scope)

  // Find the installation for this scope
  // installation筛选`installations.find`，供服务层 plugin Operations后续处理使用。
  const installation = installations.find(
    // inst更新为 `> inst.scope === scope && inst.projectPath === projectPath`，确保服务层后续读取最新状态。
    inst => inst.scope === scope && inst.projectPath === projectPath,
  )
  // installation缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
  if (!installation) {
    // scopeDesc 命名 `projectPath ? `${scope} (${projectPath})` : scope`，让后续代码直接表达这个值的用途。
    const scopeDesc = projectPath ? `${scope} (${projectPath})` : scope
    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: false,
      message: `Plugin "${pluginName}" is not installed at scope ${scopeDesc}`,
      pluginId,
      scope,
    }
  }

  // 返回 `performPluginUpdate({`，作为服务层 plugin Operations这次计算的结果。
  return performPluginUpdate({
    pluginId,
    pluginName,
    entry,
    marketplaceInstallLocation,
    installation,
    scope,
    projectPath,
  })
}

/**
 * Perform the actual plugin update: fetch source, calculate version, copy to cache, update disk.
 * This is the core update execution extracted from updatePluginOp.
 */
// performPluginUpdate 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function performPluginUpdate({
  pluginId,
  pluginName,
  entry,
  marketplaceInstallLocation,
  installation,
  scope,
  projectPath,
}: {
  pluginId: string
  pluginName: string
  entry: PluginMarketplaceEntry
  marketplaceInstallLocation: string
  installation: { version?: string; installPath: string }
  scope: PluginScope
  projectPath: string | undefined
}): Promise<PluginUpdateResult> {
  // fs 集合读取`getFsImplementation`，供服务层 plugin Operations后续处理使用。
  const fs = getFsImplementation()
  // oldVersion保存`installation.version`，供服务层 plugin Operations后续判断或输出使用。
  const oldVersion = installation.version

  // sourcePath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let sourcePath: string
  // newVersion 先占位，稍后的条件分支会根据实际输入补齐它。
  let newVersion: string
  // shouldCleanupSource标记服务层 plugin Operations是否启用对应路径。
  let shouldCleanupSource = false
  // gitCommitSha 先占位，稍后的条件分支会根据实际输入补齐它。
  let gitCommitSha: string | undefined

  // Handle remote vs local plugins
  // `typeof entry.source` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof entry.source !== 'string') {
    // Remote plugin: download to temp directory first
    // cacheResult 缓存保存`cachePlugin`，供服务层 plugin Operations后续处理使用。
    const cacheResult = await cachePlugin(entry.source, {
      manifest: { name: entry.name },
    })
    // sourcePath 路径数据更新为 `cacheResult.path`，确保服务层后续读取最新状态。
    sourcePath = cacheResult.path
    // shouldCleanupSource更新为 `true`，确保服务层后续读取最新状态。
    shouldCleanupSource = true
    // gitCommitSha更新为 `cacheResult.gitCommitSha`，确保服务层后续读取最新状态。
    gitCommitSha = cacheResult.gitCommitSha

    // Calculate version from downloaded plugin. For git-subdir sources,
    // cachePlugin captured the commit SHA before discarding the ephemeral
    // clone (the extracted subdir has no .git, so the installPath-based
    // fallback in calculatePluginVersion can't recover it).
    // newVersion更新为 `await calculatePluginVersion(`，确保服务层后续读取最新状态。
    newVersion = await calculatePluginVersion(
      pluginId,
      entry.source,
      cacheResult.manifest,
      cacheResult.path,
      entry.version,
      cacheResult.gitCommitSha,
    )
  } else {
    // Local plugin: use path from marketplace
    // Stat directly — handle ENOENT inline rather than pre-checking existence
    // marketplaceStats 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let marketplaceStats
    // 保护这一段可能失败的服务层 plugin Operations操作，确保异常能进入相邻错误处理。
    try {
      // marketplaceStats 市场数据更新为 `await fs.stat(marketplaceInstallLocation)`，确保服务层后续读取最新状态。
      marketplaceStats = await fs.stat(marketplaceInstallLocation)
    } catch (e: unknown) {
      // 满足 `isENOENT(e)` 时，服务层 plugin Operations执行该分支。
      if (isENOENT(e)) {
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Marketplace directory not found at ${marketplaceInstallLocation}`,
          pluginId,
          scope,
        }
      }
      // 抛出 e，阻止服务层 plugin Operations在无效状态下继续运行。
      throw e
    }
    // marketplaceDir 市场数据保存`marketplaceStats.isDirectory`，供服务层 plugin Operations后续处理使用。
    const marketplaceDir = marketplaceStats.isDirectory()
      ? marketplaceInstallLocation
      : dirname(marketplaceInstallLocation)
    // sourcePath 路径数据更新为 `join(marketplaceDir, entry.source)`，确保服务层后续读取最新状态。
    sourcePath = join(marketplaceDir, entry.source)

    // Verify sourcePath exists. This stat is required — neither downstream
    // op reliably surfaces ENOENT:
    //   1. calculatePluginVersion → findGitRoot walks UP past a missing dir
    //      to the marketplace .git, returning the same SHA as install-time →
    //      silent false-positive {success: true, alreadyUpToDate: true}.
    //   2. copyPluginToVersionedCache (when versions differ) throws a raw
    //      ENOENT with no friendly message.
    // TOCTOU is negligible for a user-managed local dir.
    // 保护这一段可能失败的服务层 plugin Operations操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `fs.stat(sourcePath)` 完成，再继续服务层 plugin Operations的异步流程。
      await fs.stat(sourcePath)
    } catch (e: unknown) {
      // 满足 `isENOENT(e)` 时，服务层 plugin Operations执行该分支。
      if (isENOENT(e)) {
        // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
        return {
          success: false,
          message: `Plugin source not found at ${sourcePath}`,
          pluginId,
          scope,
        }
      }
      // 抛出 e，阻止服务层 plugin Operations在无效状态下继续运行。
      throw e
    }

    // Try to load manifest from plugin directory (for version info)
    // pluginManifest 插件数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let pluginManifest: PluginManifest | undefined
    // manifestPath 路径数据格式化`join`，供服务层 plugin Operations后续处理使用。
    const manifestPath = join(sourcePath, '.claude-plugin', 'plugin.json')
    // 保护这一段可能失败的服务层 plugin Operations操作，确保异常能进入相邻错误处理。
    try {
      // pluginManifest 插件数据更新为 `await loadPluginManifest(`，确保服务层后续读取最新状态。
      pluginManifest = await loadPluginManifest(
        manifestPath,
        entry.name,
        entry.source,
      )
    } catch {
      // Failed to load - will use other version sources
    }

    // Calculate version from plugin source path
    // newVersion更新为 `await calculatePluginVersion(`，确保服务层后续读取最新状态。
    newVersion = await calculatePluginVersion(
      pluginId,
      entry.source,
      pluginManifest,
      sourcePath,
      entry.version,
    )
  }

  // Use try/finally to ensure temp directory cleanup on any error
  // 保护这一段可能失败的服务层 plugin Operations操作，确保异常能进入相邻错误处理。
  try {
    // Check if this version already exists in cache
    // versionedPath 路径数据读取`getVersionedCachePath`，供服务层 plugin Operations后续处理使用。
    let versionedPath = getVersionedCachePath(pluginId, newVersion)

    // Check if installation is already at the new version
    // zipPath 路径数据读取`getVersionedZipCachePath`，供服务层 plugin Operations后续处理使用。
    const zipPath = getVersionedZipCachePath(pluginId, newVersion)
    // isUpToDate 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isUpToDate =
      installation.version === newVersion ||
      installation.installPath === versionedPath ||
      installation.installPath === zipPath
    // 满足 `isUpToDate` 时，服务层 plugin Operations执行该分支。
    if (isUpToDate) {
      // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
      return {
        success: true,
        message: `${pluginName} is already at the latest version (${newVersion}).`,
        pluginId,
        newVersion,
        oldVersion,
        alreadyUpToDate: true,
        scope,
      }
    }

    // Copy to versioned cache (returns actual path, which may be .zip)
    // versionedPath 路径数据更新为 `await copyPluginToVersionedCache(`，确保服务层后续读取最新状态。
    versionedPath = await copyPluginToVersionedCache(
      sourcePath,
      pluginId,
      newVersion,
      entry,
    )

    // Store old version path for potential cleanup
    // oldVersionPath 路径数据 命名 `installation.installPath`，让后续代码直接表达这个值的用途。
    const oldVersionPath = installation.installPath

    // Update disk JSON file for this installation
    // (memory stays unchanged until restart)
    // 调用 updateInstallationPathOnDisk，触发服务层 plugin Operations此处需要的副作用。
    updateInstallationPathOnDisk(
      pluginId,
      scope,
      projectPath,
      versionedPath,
      newVersion,
      gitCommitSha,
    )

    // `oldVersionPath && oldVersionPath` 与 `versionedPath` 不一致时刷新派生状态，避免使用过期结果。
    if (oldVersionPath && oldVersionPath !== versionedPath) {
      // updatedDiskData读取`loadInstalledPluginsFromDisk`，供服务层 plugin Operations后续处理使用。
      const updatedDiskData = loadInstalledPluginsFromDisk()
      // isOldVersionStillReferenced记录 `Object.values` 是否成立，服务层 plugin Operations随后按该结果分支。
      const isOldVersionStillReferenced = Object.values(
        updatedDiskData.plugins,
      // 这个回调绑定到 ).some(pluginInstallations =>，负责服务层 plugin Operations在该局部场景下的响应。
      ).some(pluginInstallations =>
        // 调用 pluginInstallations.some，触发服务层 plugin Operations此处需要的副作用。
        pluginInstallations.some(inst => inst.installPath === oldVersionPath),
      )

      // isOldVersionStillReferenced缺失时提前走兜底路径，避免服务层 plugin Operations继续依赖无效输入。
      if (!isOldVersionStillReferenced) {
        // 等待 `markPluginVersionOrphaned(oldVersionPath)` 完成，再继续服务层 plugin Operations的异步流程。
        await markPluginVersionOrphaned(oldVersionPath)
      }
    }

    // scopeDesc 命名 `projectPath ? `${scope} (${projectPath})` : scope`，让后续代码直接表达这个值的用途。
    const scopeDesc = projectPath ? `${scope} (${projectPath})` : scope
    // 消息标记服务层 plugin Operations是否启用对应路径。
    const message = `Plugin "${pluginName}" updated from ${oldVersion || 'unknown'} to ${newVersion} for scope ${scopeDesc}. Restart to apply changes.`

    // 返回结构化结果，集中表达服务层 plugin Operations已经整理出的状态。
    return {
      success: true,
      message,
      pluginId,
      newVersion,
      oldVersion,
      scope,
    }
  } finally {
    // Clean up temp source if it was a remote download
    // 服务层 plugin Operations在这里进入条件判断，后续代码按实际状态分流。
    if (
      shouldCleanupSource &&
      sourcePath !== getVersionedCachePath(pluginId, newVersion)
    ) {
      // 等待 `fs.rm(sourcePath, { recursive: true, force: true })` 完成，再继续服务层 plugin Operations的异步流程。
      await fs.rm(sourcePath, { recursive: true, force: true })
    }
  }
}
