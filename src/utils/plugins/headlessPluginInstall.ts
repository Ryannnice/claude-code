/**
 * Plugin installation for headless/CCR mode.
 *
 * This module provides plugin installation without AppState updates,
 * suitable for non-interactive environments like CCR.
 *
 * When CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE is enabled, plugins are stored as
 * ZIPs on a mounted volume. The storage layer (pluginLoader.ts) handles
 * ZIP creation on install and extraction on load transparently.
 */

// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 引入 registerCleanup，将 ../cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from '../cleanupRegistry.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 withDiagnosticsTiming，将 ../diagLogs.js 中已经封装好的能力接到本文件流程里。
import { withDiagnosticsTiming } from '../diagLogs.js'
// 引入 getFsImplementation，将 ../fsOperations.js 中已经封装好的能力接到本文件流程里。
import { getFsImplementation } from '../fsOperations.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  clearMarketplacesCache,
  getDeclaredMarketplaces,
  registerSeedMarketplaces,
} from './marketplaceManager.js'
// 引入 detectAndUninstallDelistedPlugins，将 ./pluginBlocklist.js 中已经封装好的能力接到本文件流程里。
import { detectAndUninstallDelistedPlugins } from './pluginBlocklist.js'
// 引入 clearPluginCache，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { clearPluginCache } from './pluginLoader.js'
// 引入 reconcileMarketplaces，将 ./reconciler.js 中已经封装好的能力接到本文件流程里。
import { reconcileMarketplaces } from './reconciler.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  cleanupSessionPluginCache,
  getZipCacheMarketplacesDir,
  getZipCachePluginsDir,
  isMarketplaceSourceSupportedByZipCache,
  isPluginZipCacheEnabled,
} from './zipCache.js'
// 引入 syncMarketplacesToZipCache，将 ./zipCacheAdapters.js 中已经封装好的能力接到本文件流程里。
import { syncMarketplacesToZipCache } from './zipCacheAdapters.js'

/**
 * Install plugins for headless/CCR mode.
 *
 * This is the headless equivalent of performBackgroundPluginInstallations(),
 * but without AppState updates (no UI to update in headless mode).
 *
 * @returns true if any plugins were installed (caller should refresh MCP)
 */
// installPluginsForHeadless 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installPluginsForHeadless(): Promise<boolean> {
  // zipCacheMode 缓存保存`isPluginZipCacheEnabled`，供插件管理后续处理使用。
  const zipCacheMode = isPluginZipCacheEnabled()
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `installPluginsForHeadless: starting${zipCacheMode ? ' (zip cache mode)' : ''}`,
  )

  // Register seed marketplaces (CLAUDE_CODE_PLUGIN_SEED_DIR) before diffing.
  // Idempotent; no-op if seed not configured. Without this, findMissingMarketplaces
  // would see seed entries as missing → clone → defeats seed's purpose.
  //
  // If registration changed state, clear caches so the early plugin-load pass
  // (which runs during CLI startup before this function) doesn't keep stale
  // "marketplace not found" results. Without this clear, a first-boot headless
  // run with a seed-cached plugin would show 0 plugin commands/agents/skills
  // in the init message even though the seed has everything.
  // seedChanged保存`registerSeedMarketplaces`，供插件管理后续处理使用。
  const seedChanged = await registerSeedMarketplaces()
  // 满足 `seedChanged` 时，插件管理执行该分支。
  if (seedChanged) {
    // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
    clearMarketplacesCache()
    // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
    clearPluginCache('headlessPluginInstall: seed marketplaces registered')
  }

  // Ensure zip cache directory structure exists
  // 满足 `zipCacheMode` 时，插件管理执行该分支。
  if (zipCacheMode) {
    // 等待 `getFsImplementation().mkdir(getZipCacheMarketplacesDir())` 完成，再继续插件工具 headless Plugin Install的异步流程。
    await getFsImplementation().mkdir(getZipCacheMarketplacesDir())
    // 等待 `getFsImplementation().mkdir(getZipCachePluginsDir())` 完成，再继续插件工具 headless Plugin Install的异步流程。
    await getFsImplementation().mkdir(getZipCachePluginsDir())
  }

  // Declared now includes an implicit claude-plugins-official entry when any
  // enabled plugin references it (see getDeclaredMarketplaces). This routes
  // the official marketplace through the same reconciler path as any other —
  // which composes correctly with CLAUDE_CODE_PLUGIN_SEED_DIR: seed registers
  // it in known_marketplaces.json, reconciler diff sees it as upToDate, no clone.
  // declaredCount 数量派生`Object.keys`，供插件管理后续处理使用。
  const declaredCount = Object.keys(getDeclaredMarketplaces()).length

  // metrics 集合 集中保存插件工具 headless Plugin Install要一起传递的字段。
  const metrics = {
    marketplaces_installed: 0,
    delisted_count: 0,
  }

  // Initialize from seedChanged so the caller (print.ts) calls
  // refreshPluginState() → clearCommandsCache/clearAgentDefinitionsCache
  // when seed registration added marketplaces. Without this, the caller
  // only refreshes when an actual plugin install happened.
  // pluginsChanged 插件数据保存`seedChanged`，供插件工具 headless Plugin Install后续判断或输出使用。
  let pluginsChanged = seedChanged

  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 满足 `declaredCount === 0` 时，插件管理执行该分支。
    if (declaredCount === 0) {
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging('installPluginsForHeadless: no marketplaces declared')
    } else {
      // Reconcile declared marketplaces (settings intent + implicit official)
      // with materialized state. Zip cache: skip unsupported source types.
      // reconcileResult保存`withDiagnosticsTiming`，供插件管理后续处理使用。
      const reconcileResult = await withDiagnosticsTiming(
        'headless_marketplace_reconcile',
        // 这个回调绑定到 () =>，负责插件管理在该局部场景下的响应。
        () =>
          reconcileMarketplaces({
            skip: zipCacheMode
              // 这个回调绑定到 ? (_name, source) =>，负责插件管理在该局部场景下的响应。
              ? (_name, source) =>
                  !isMarketplaceSourceSupportedByZipCache(source)
              : undefined,
            // 这个回调绑定到 onProgress: event => {，负责插件管理在该局部场景下的响应。
            onProgress: event => {
              // 当 `event.type` 匹配 `'installed'` 时，插件管理执行对应分支。
              if (event.type === 'installed') {
                // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `installPluginsForHeadless: installed marketplace ${event.name}`,
                )
              // 插件工具 headless Plugin Install在这里处理 `} else if (event.type === 'failed') {`，完成这一小步状态转换。
              } else if (event.type === 'failed') {
                // 记录插件管理运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `installPluginsForHeadless: failed to install marketplace ${event.name}: ${event.error}`,
                )
              }
            },
          }),
        // r更新为 `> ({`，确保插件工具后续读取最新状态。
        r => ({
          installed_count: r.installed.length,
          updated_count: r.updated.length,
          failed_count: r.failed.length,
          skipped_count: r.skipped.length,
        }),
      )

      // 满足 `reconcileResult.skipped.length > 0` 时，插件管理执行该分支。
      if (reconcileResult.skipped.length > 0) {
        // 记录插件管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `installPluginsForHeadless: skipped ${reconcileResult.skipped.length} marketplace(s) unsupported by zip cache: ${reconcileResult.skipped.join(', ')}`,
        )
      }

      // marketplacesChanged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const marketplacesChanged =
        reconcileResult.installed.length + reconcileResult.updated.length

      // Clear caches so newly-installed marketplace plugins are discoverable.
      // Plugin caching is the loader's job — after caches clear, the caller's
      // refreshPluginState() → loadAllPlugins() will cache any missing plugins
      // from the newly-materialized marketplaces.
      // 满足 `marketplacesChanged > 0` 时，插件管理执行该分支。
      if (marketplacesChanged > 0) {
        // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
        clearMarketplacesCache()
        // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
        clearPluginCache('headlessPluginInstall: marketplaces reconciled')
        // pluginsChanged 插件数据更新为 `true`，确保插件工具后续读取最新状态。
        pluginsChanged = true
      }

      // marketplaces_installed 市场数据更新为 `marketplacesChanged`，确保插件工具后续读取最新状态。
      metrics.marketplaces_installed = marketplacesChanged
    }

    // Zip cache: save marketplace JSONs for offline access on ephemeral containers.
    // Runs unconditionally so that steady-state containers (all plugins installed)
    // still sync marketplace data that may have been cloned in a previous run.
    // 满足 `zipCacheMode` 时，插件管理执行该分支。
    if (zipCacheMode) {
      // 等待 `syncMarketplacesToZipCache()` 完成，再继续插件工具 headless Plugin Install的异步流程。
      await syncMarketplacesToZipCache()
    }

    // Delisting enforcement
    // newlyDelisted 集合读取`detectAndUninstallDelistedPlugins`，供插件管理后续处理使用。
    const newlyDelisted = await detectAndUninstallDelistedPlugins()
    // delisted_count 数量更新为 `newlyDelisted.length`，确保插件工具后续读取最新状态。
    metrics.delisted_count = newlyDelisted.length
    // 满足 `newlyDelisted.length > 0` 时，插件管理执行该分支。
    if (newlyDelisted.length > 0) {
      // pluginsChanged 插件数据更新为 `true`，确保插件工具后续读取最新状态。
      pluginsChanged = true
    }

    // 满足 `pluginsChanged` 时，插件管理执行该分支。
    if (pluginsChanged) {
      // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
      clearPluginCache('headlessPluginInstall: plugins changed')
    }

    // Zip cache: register session cleanup for extracted plugin temp dirs
    // 满足 `zipCacheMode` 时，插件管理执行该分支。
    if (zipCacheMode) {
      // 调用 registerCleanup，触发插件管理此处需要的副作用。
      registerCleanup(cleanupSessionPluginCache)
    }

    // 返回 `pluginsChanged`，作为插件管理这次计算的结果。
    return pluginsChanged
  } catch (error) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } finally {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_headless_plugin_install', metrics)
  }
}
