/**
 * Background plugin autoupdate functionality
 *
 * At startup, this module:
 * 1. First updates marketplaces that have autoUpdate enabled
 * 2. Then checks all installed plugins from those marketplaces and updates them
 *
 * Updates are non-inplace (disk-only), requiring a restart to take effect.
 * Official Anthropic marketplaces have autoUpdate enabled by default,
 * but users can disable it per-marketplace.
 */

// 接入 updatePluginOp 服务层能力，把外部通信或共享状态交给 ../../services/plugins/pluginOperations.js 处理。
import { updatePluginOp } from '../../services/plugins/pluginOperations.js'
// 引入 shouldSkipPluginAutoupdate，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { shouldSkipPluginAutoupdate } from '../config.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getPendingUpdatesDetails,
  hasPendingUpdates,
  isInstallationRelevantToCurrentProject,
  loadInstalledPluginsFromDisk,
} from './installedPluginsManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getDeclaredMarketplaces,
  loadKnownMarketplacesConfig,
  refreshMarketplace,
} from './marketplaceManager.js'
// 引入 parsePluginIdentifier，将 ./pluginIdentifier.js 中已经封装好的能力接到本文件流程里。
import { parsePluginIdentifier } from './pluginIdentifier.js'
// 引入 isMarketplaceAutoUpdate、PluginScope，将 ./schemas.js 中已经封装好的能力接到本文件流程里。
import { isMarketplaceAutoUpdate, type PluginScope } from './schemas.js'

/**
 * Callback type for notifying when plugins have been updated
 */
// PluginAutoUpdateCallback 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PluginAutoUpdateCallback = (updatedPlugins: string[]) => void

// Store callback for plugin update notifications
// pluginUpdateCallback 插件数据初始化为空值，后续分支会在有数据时补齐。
let pluginUpdateCallback: PluginAutoUpdateCallback | null = null

// Store pending updates that occurred before callback was registered
// This handles the race condition where updates complete before REPL mounts
// pendingNotification保存`null`，作为后续空值处理的输入。
let pendingNotification: string[] | null = null

/**
 * Register a callback to be notified when plugins are auto-updated.
 * This is used by the REPL to show restart notifications.
 *
 * If plugins were already updated before the callback was registered,
 * the callback will be invoked immediately with the pending updates.
 */
// onPluginsAutoUpdated 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function onPluginsAutoUpdated(
  callback: PluginAutoUpdateCallback,
): () => void {
  // pluginUpdateCallback 插件数据更新为 `callback`，确保插件工具后续读取最新状态。
  pluginUpdateCallback = callback

  // If there are pending updates that happened before registration, deliver them now
  // `pendingNotification` 与 `null && pendingNotificati` 不一致时刷新派生状态，避免使用过期结果。
  if (pendingNotification !== null && pendingNotification.length > 0) {
    // 调用 callback，触发插件管理此处需要的副作用。
    callback(pendingNotification)
    // pendingNotification更新为 `null`，确保插件工具后续读取最新状态。
    pendingNotification = null
  }

  // 返回 `() => {`，作为插件管理这次计算的结果。
  return () => {
    // pluginUpdateCallback 插件数据更新为 `null`，确保插件工具后续读取最新状态。
    pluginUpdateCallback = null
  }
}

/**
 * Check if pending updates came from autoupdate (for notification purposes).
 * Returns the list of plugin names that have pending updates.
 */
// getAutoUpdatedPluginNames 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoUpdatedPluginNames(): string[] {
  // 满足 `!hasPendingUpdates()` 时，插件管理执行该分支。
  if (!hasPendingUpdates()) {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }
  // 返回 `getPendingUpdatesDetails().map(`，作为插件管理这次计算的结果。
  return getPendingUpdatesDetails().map(
    // d更新为 `> parsePluginIdentifier(d.pluginId).name`，确保插件工具后续读取最新状态。
    d => parsePluginIdentifier(d.pluginId).name,
  )
}

/**
 * Get the set of marketplaces that have autoUpdate enabled.
 * Returns the marketplace names that should be auto-updated.
 */
// getAutoUpdateEnabledMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAutoUpdateEnabledMarketplaces(): Promise<Set<string>> {
  // 配置读取`loadKnownMarketplacesConfig`，供插件管理后续处理使用。
  const config = await loadKnownMarketplacesConfig()
  // declared读取`getDeclaredMarketplaces`，供插件管理后续处理使用。
  const declared = getDeclaredMarketplaces()
  // enabled构建`new Set<string>()` 整理出中间结果，供插件工具 plugin Autoupdate后续步骤使用。
  const enabled = new Set<string>()

  // 循环处理 `const [name, entry] of Object.entries(config)`，让插件管理把同类条目按顺序走完。
  for (const [name, entry] of Object.entries(config)) {
    // Settings-declared autoUpdate takes precedence over JSON state
    // declaredAutoUpdate保存`declared[name]?.autoUpdate`，供插件工具 plugin Autoupdate后续判断或输出使用。
    const declaredAutoUpdate = declared[name]?.autoUpdate
    // autoUpdate 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const autoUpdate =
      declaredAutoUpdate !== undefined
        ? declaredAutoUpdate
        : isMarketplaceAutoUpdate(name, entry)
    // 满足 `autoUpdate` 时，插件管理执行该分支。
    if (autoUpdate) {
      // 调用 enabled.add，触发插件管理此处需要的副作用。
      enabled.add(name.toLowerCase())
    }
  }

  // 返回 `enabled`，作为插件管理这次计算的结果。
  return enabled
}

/**
 * Update a single plugin's installations.
 * Returns the plugin ID if any installation was updated, null otherwise.
 */
// updatePlugin 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updatePlugin(
  pluginId: string,
  installations: Array<{ scope: PluginScope; projectPath?: string }>,
): Promise<string | null> {
  // wasUpdated标记插件工具 plugin Autoupdate是否启用对应路径。
  let wasUpdated = false

  // 循环处理 `const { scope } of installations`，让插件管理逐项把同类条目按顺序走完。
  for (const { scope } of installations) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // 结果保存`updatePluginOp`，供插件管理后续处理使用。
      const result = await updatePluginOp(pluginId, scope)

      // 只有 `result.success && !result.alreadyUpToDate` 满足时，插件管理才执行该分支。
      if (result.success && !result.alreadyUpToDate) {
        // wasUpdated更新为 `true`，确保插件工具后续读取最新状态。
        wasUpdated = true
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin autoupdate: updated ${pluginId} from ${result.oldVersion} to ${result.newVersion}`,
        )
      // 插件工具 plugin Autoupdate在这里处理 `} else if (!result.alreadyUpToDate) {`，完成这一小步状态转换。
      } else if (!result.alreadyUpToDate) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin autoupdate: failed to update ${pluginId}: ${result.message}`,
          { level: 'warn' },
        )
      }
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Plugin autoupdate: error updating ${pluginId}: ${errorMessage(error)}`,
        { level: 'warn' },
      )
    }
  }

  // 返回 `wasUpdated ? pluginId : null`，作为插件管理这次计算的结果。
  return wasUpdated ? pluginId : null
}

/**
 * Update all project-relevant installed plugins from the given marketplaces.
 *
 * Iterates installed_plugins.json, filters to plugins whose marketplace is in
 * the set, further filters each plugin's installations to those relevant to
 * the current project (user/managed scope, or project/local scope matching
 * cwd — see isInstallationRelevantToCurrentProject), then calls updatePluginOp
 * per installation. Already-up-to-date plugins are silently skipped.
 *
 * Called by:
 * - updatePlugins() below — background autoupdate path (autoUpdate-enabled
 *   marketplaces only; third-party marketplaces default autoUpdate: false)
 * - ManageMarketplaces.tsx applyChanges() — user-initiated /plugin marketplace
 *   update. Before #29512 this path only called refreshMarketplace() (git
 *   pull on the marketplace clone), so the loader would create the new
 *   version cache dir but installed_plugins.json stayed on the old version,
 *   and the orphan GC stamped the NEW dir with .orphaned_at on next startup.
 *
 * @param marketplaceNames - lowercase marketplace names to update plugins from
 * @returns plugin IDs that were actually updated (not already up-to-date)
 */
// updatePluginsForMarketplaces 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updatePluginsForMarketplaces(
  marketplaceNames: Set<string>,
): Promise<string[]> {
  // installedPlugins 插件数据读取`loadInstalledPluginsFromDisk`，供插件管理后续处理使用。
  const installedPlugins = loadInstalledPluginsFromDisk()
  // pluginIds 插件数据派生`Object.keys`，供插件管理后续处理使用。
  const pluginIds = Object.keys(installedPlugins.plugins)

  // pluginIds 插件数据为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
  if (pluginIds.length === 0) {
    // 返回列表结果，保留插件管理已经排好的条目顺序。
    return []
  }

  // 结果列表保存`Promise.allSettled`，供插件管理后续处理使用。
  const results = await Promise.allSettled(
    // 调用 pluginIds.map，触发插件管理此处需要的副作用。
    pluginIds.map(async pluginId => {
      // 从 `parsePluginIdentifier(pluginId)` 解构 marketplace，减少插件工具 plugin Autoupdate对同一对象的重复访问。
      const { marketplace } = parsePluginIdentifier(pluginId)
      // 只有 `!marketplace || !marketplaceNames.has(marketplace.toLowerCase())` 满足时，插件管理才执行该分支。
      if (!marketplace || !marketplaceNames.has(marketplace.toLowerCase())) {
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

      // allInstallations 集合读取 `installedPlugins.plugins[pluginId]` 对应条目，后续围绕该成员继续处理。
      const allInstallations = installedPlugins.plugins[pluginId]
      // !allInstallations || allInstall...为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
      if (!allInstallations || allInstallations.length === 0) {
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

      // relevantInstallations 集合筛选`allInstallations.filter`，供插件管理后续处理使用。
      const relevantInstallations = allInstallations.filter(
        isInstallationRelevantToCurrentProject,
      )
      // relevantInstallations 集合为空时立即返回或跳过，避免插件管理把空集合当成可处理内容。
      if (relevantInstallations.length === 0) {
        // 返回 `null`，作为插件管理这次计算的结果。
        return null
      }

      // 返回 `updatePlugin(pluginId, relevantInstallations)`，作为插件管理这次计算的结果。
      return updatePlugin(pluginId, relevantInstallations)
    }),
  )

  // 返回 `results`，作为插件管理这次计算的结果。
  return results
    .filter(
      // 这个回调绑定到 (r): r is PromiseFulfilledResult<string> =>，负责插件管理在该局部场景下的响应。
      (r): r is PromiseFulfilledResult<string> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    // 链式调用 map，继续加工上一行在插件管理中产生的数据。
    .map(r => r.value)
}

/**
 * Update plugins from marketplaces that have autoUpdate enabled.
 * Returns the list of plugin IDs that were updated.
 */
// updatePlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function updatePlugins(
  autoUpdateEnabledMarketplaces: Set<string>,
): Promise<string[]> {
  // 返回 `updatePluginsForMarketplaces(autoUpdateEnabledMarketplaces)`，作为插件管理这次计算的结果。
  return updatePluginsForMarketplaces(autoUpdateEnabledMarketplaces)
}

/**
 * Auto-update marketplaces and plugins in the background.
 *
 * This function:
 * 1. Checks which marketplaces have autoUpdate enabled
 * 2. Refreshes only those marketplaces (git pull/re-download)
 * 3. Updates installed plugins from those marketplaces
 * 4. If any plugins were updated, notifies via the registered callback
 *
 * Official Anthropic marketplaces have autoUpdate enabled by default,
 * but users can disable it per-marketplace in the UI.
 *
 * This function runs silently without blocking user interaction.
 * Called from main.tsx during startup as a background job.
 */
// autoUpdateMarketplacesAndPluginsInBackground 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function autoUpdateMarketplacesAndPluginsInBackground(): void {
  // 调用 void，触发插件管理此处需要的副作用。
  void (async () => {
    // 满足 `shouldSkipPluginAutoupdate()` 时，插件管理执行该分支。
    if (shouldSkipPluginAutoupdate()) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Plugin autoupdate: skipped (auto-updater disabled)')
      // 插件工具 plugin Autoupdate在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // Get marketplaces with autoUpdate enabled
      // autoUpdateEnabledMarketplaces 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const autoUpdateEnabledMarketplaces =
        await getAutoUpdateEnabledMarketplaces()

      // 满足 `autoUpdateEnabledMarketplaces.size === 0` 时，插件管理执行该分支。
      if (autoUpdateEnabledMarketplaces.size === 0) {
        // 插件工具 plugin Autoupdate在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Refresh only marketplaces with autoUpdate enabled
      // refreshResults 集合保存`Promise.allSettled`，供插件管理后续处理使用。
      const refreshResults = await Promise.allSettled(
        // 调用 Array.from，触发插件管理此处需要的副作用。
        Array.from(autoUpdateEnabledMarketplaces).map(async name => {
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `refreshMarketplace(name, undefined, {` 完成，再继续插件工具 plugin Autoupdate的异步流程。
            await refreshMarketplace(name, undefined, {
              disableCredentialHelper: true,
            })
          } catch (error) {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Plugin autoupdate: failed to refresh marketplace ${name}: ${errorMessage(error)}`,
              { level: 'warn' },
            )
          }
        }),
      )

      // Log any refresh failures
      // failures 集合筛选`refreshResults.filter`，供插件管理后续处理使用。
      const failures = refreshResults.filter(r => r.status === 'rejected')
      // 满足 `failures.length > 0` 时，插件管理执行该分支。
      if (failures.length > 0) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Plugin autoupdate: ${failures.length} marketplace refresh(es) failed`,
          { level: 'warn' },
        )
      }

      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Plugin autoupdate: checking installed plugins')
      // updatedPlugins 插件数据保存`updatePlugins`，供插件管理后续处理使用。
      const updatedPlugins = await updatePlugins(autoUpdateEnabledMarketplaces)

      // 满足 `updatedPlugins.length > 0` 时，插件管理执行该分支。
      if (updatedPlugins.length > 0) {
        // 满足 `pluginUpdateCallback` 时，插件管理执行该分支。
        if (pluginUpdateCallback) {
          // Callback is already registered, invoke it immediately
          // 调用 pluginUpdateCallback，触发插件管理此处需要的副作用。
          pluginUpdateCallback(updatedPlugins)
        } else {
          // Callback not yet registered (REPL not mounted), store for later delivery
          // pendingNotification更新为 `updatedPlugins`，确保插件工具后续读取最新状态。
          pendingNotification = updatedPlugins
        }
      }
    } catch (error) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
  })()
}
