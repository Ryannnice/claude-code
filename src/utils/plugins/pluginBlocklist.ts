/**
 * Plugin delisting detection.
 *
 * Compares installed plugins against marketplace manifests to find plugins
 * that have been removed, and auto-uninstalls them.
 *
 * The security.json fetch was removed (see #25447) — ~29.5M/week GitHub hits
 * for UI reason/text only. If re-introduced, serve from downloads.claude.ai.
 */

// 接入 uninstallPluginOp 服务层能力，把外部通信或共享状态交给 ../../services/plugins/pluginOperations.js 处理。
import { uninstallPluginOp } from '../../services/plugins/pluginOperations.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 loadInstalledPluginsV2，将 ./installedPluginsManager.js 中已经封装好的能力接到本文件流程里。
import { loadInstalledPluginsV2 } from './installedPluginsManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  getMarketplace,
  loadKnownMarketplacesConfigSafe,
} from './marketplaceManager.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  addFlaggedPlugin,
  getFlaggedPlugins,
  loadFlaggedPlugins,
} from './pluginFlagging.js'
// 类型依赖 { InstalledPluginsFileV2, PluginMarketplace } 来自 ./schemas.js，用于校准插件管理的数据契约。
import type { InstalledPluginsFileV2, PluginMarketplace } from './schemas.js'

/**
 * Detect plugins installed from a marketplace that are no longer listed there.
 *
 * @param installedPlugins All installed plugins
 * @param marketplace The marketplace to check against
 * @param marketplaceName The marketplace name suffix (e.g. "claude-plugins-official")
 * @returns List of delisted plugin IDs in "name@marketplace" format
 */
// detectDelistedPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectDelistedPlugins(
  installedPlugins: InstalledPluginsFileV2,
  marketplace: PluginMarketplace,
  marketplaceName: string,
): string[] {
  // marketplacePluginNames 插件数据保存`Set`，供插件管理后续处理使用。
  const marketplacePluginNames = new Set(marketplace.plugins.map(p => p.name))
  // suffix保存``@${marketplaceName}``，作为后续固定文本处理的输入。
  const suffix = `@${marketplaceName}`

  // delisted 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const delisted: string[] = []
  // 逐项读取 `Object.keys(installedPlugins.plugins)` 中的pluginId 插件数据，按输入顺序推进插件管理。
  for (const pluginId of Object.keys(installedPlugins.plugins)) {
    // 满足 `!pluginId.endsWith(suffix)` 时，插件管理执行该分支。
    if (!pluginId.endsWith(suffix)) continue

    // pluginName 插件数据格式化`pluginId.slice`，供插件管理后续处理使用。
    const pluginName = pluginId.slice(0, -suffix.length)
    // 满足 `!marketplacePluginNames.has(pluginName)` 时，插件管理执行该分支。
    if (!marketplacePluginNames.has(pluginName)) {
      // delisted 集合追加新条目，保持收集顺序与输入顺序一致。
      delisted.push(pluginId)
    }
  }

  // 返回 `delisted`，作为插件管理这次计算的结果。
  return delisted
}

/**
 * Detect delisted plugins across all marketplaces, auto-uninstall them,
 * and record them as flagged.
 *
 * This is the core delisting enforcement logic, shared between interactive
 * mode (useManagePlugins) and headless mode (main.tsx print path).
 *
 * @returns List of newly flagged plugin IDs
 */
// detectAndUninstallDelistedPlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function detectAndUninstallDelistedPlugins(): Promise<string[]> {
  // 等待 `loadFlaggedPlugins()` 完成，再继续插件工具 plugin Blocklist的异步流程。
  await loadFlaggedPlugins()

  // installedPlugins 插件数据读取`loadInstalledPluginsV2`，供插件管理后续处理使用。
  const installedPlugins = loadInstalledPluginsV2()
  // alreadyFlagged读取`getFlaggedPlugins`，供插件管理后续处理使用。
  const alreadyFlagged = getFlaggedPlugins()
  // Read-only iteration — Safe variant so a corrupted config doesn't throw
  // out of this function (it's called in the same try-block as loadAllPlugins
  // in useManagePlugins, so a throw here would void loadAllPlugins' resilience).
  // knownMarketplaces 市场数据读取`loadKnownMarketplacesConfigSafe`，供插件管理后续处理使用。
  const knownMarketplaces = await loadKnownMarketplacesConfigSafe()
  // newlyFlagged 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newlyFlagged: string[] = []

  // 逐项读取 `Object.keys(knownMarketplaces)` 中的marketplaceName 市场数据，按输入顺序推进插件管理。
  for (const marketplaceName of Object.keys(knownMarketplaces)) {
    // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
    try {
      // marketplace 市场数据读取`getMarketplace`，供插件管理后续处理使用。
      const marketplace = await getMarketplace(marketplaceName)

      // marketplace.forceRemoveDeletedPlugins 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
      if (!marketplace.forceRemoveDeletedPlugins) continue

      // delisted 集合读取`detectDelistedPlugins`，供插件管理后续处理使用。
      const delisted = detectDelistedPlugins(
        installedPlugins,
        marketplace,
        marketplaceName,
      )

      // 按顺序遍历 `delisted` 中的pluginId 插件数据，逐个交给插件管理处理。
      for (const pluginId of delisted) {
        // 满足 `pluginId in alreadyFlagged` 时，插件管理执行该分支。
        if (pluginId in alreadyFlagged) continue

        // Skip managed-only plugins — enterprise admin should handle those
        // installations 集合保存`installedPlugins.plugins[pluginId] ?? []`，供插件工具 plugin Blocklist后续判断或输出使用。
        const installations = installedPlugins.plugins[pluginId] ?? []
        // hasUserInstall记录 `installations.some` 是否成立，插件管理随后按该结果分支。
        const hasUserInstall = installations.some(
          // i更新为 `>`，确保插件工具后续读取最新状态。
          i =>
            i.scope === 'user' || i.scope === 'project' || i.scope === 'local',
        )
        // hasUserInstall缺失时直接走兜底路径，避免插件管理使用无效输入。
        if (!hasUserInstall) continue

        // Auto-uninstall the delisted plugin from all user-controllable scopes
        // 按顺序遍历 `installations` 中的installation，逐个交给插件管理处理。
        for (const installation of installations) {
          // 从 `installation` 解构 scope，减少插件工具 plugin Blocklist对同一对象的重复访问。
          const { scope } = installation
          // `scope` 与 `'user' && scope !== 'project' &...` 不一致时刷新派生状态，避免使用过期结果。
          if (scope !== 'user' && scope !== 'project' && scope !== 'local') {
            // 跳过当前项，继续处理插件管理中的下一轮循环。
            continue
          }
          // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `uninstallPluginOp(pluginId, scope)` 完成，再继续插件工具 plugin Blocklist的异步流程。
            await uninstallPluginOp(pluginId, scope)
          } catch (error) {
            // 记录插件管理运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to auto-uninstall delisted plugin ${pluginId} from ${scope}: ${errorMessage(error)}`,
              { level: 'error' },
            )
          }
        }

        // 等待 `addFlaggedPlugin(pluginId)` 完成，再继续插件工具 plugin Blocklist的异步流程。
        await addFlaggedPlugin(pluginId)
        // newlyFlagged追加新条目，保持收集顺序与输入顺序一致。
        newlyFlagged.push(pluginId)
      }
    } catch (error) {
      // Marketplace may not be available yet — log and continue
      // 记录插件管理运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to check for delisted plugins in "${marketplaceName}": ${errorMessage(error)}`,
        { level: 'warn' },
      )
    }
  }

  // 返回 `newlyFlagged`，作为插件管理这次计算的结果。
  return newlyFlagged
}
