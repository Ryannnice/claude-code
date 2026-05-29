/**
 * Background plugin and marketplace installation manager
 *
 * This module handles automatic installation of plugins and marketplaces
 * from trusted sources (repository and user settings) without blocking startup.
 */

// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准服务层 Plugin Installation Manager的数据契约。
import type { AppState } from '../../state/AppState.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让服务层 Plugin Installation Manager后续逻辑可以直接复用这些外部能力。
import {
  clearMarketplacesCache,
  getDeclaredMarketplaces,
  loadKnownMarketplacesConfig,
} from '../../utils/plugins/marketplaceManager.js'
// 复用 clearPluginCache 工具函数，把通用处理留在 ../../utils/plugins/pluginLoader.js 中维护。
import { clearPluginCache } from '../../utils/plugins/pluginLoader.js'
// 整理这一组导入，让服务层 Plugin Installation Manager后续逻辑可以直接复用这些外部能力。
import {
  diffMarketplaces,
  reconcileMarketplaces,
} from '../../utils/plugins/reconciler.js'
// 复用 refreshActivePlugins 工具函数，把通用处理留在 ../../utils/plugins/refresh.js 中维护。
import { refreshActivePlugins } from '../../utils/plugins/refresh.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'

// SetAppState 固化服务层 Plugin Installation Manager里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (f: (prevState: AppState) => AppState) => void

/**
 * Update marketplace installation status in app state
 */
// updateMarketplaceStatus 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function updateMarketplaceStatus(
  setAppState: SetAppState,
  name: string,
  status: 'pending' | 'installing' | 'installed' | 'failed',
  error?: string,
): void {
  // setAppState 写入新的状态值，使服务层 Plugin Installation Manager后续读取保持一致。
  setAppState(prevState => ({
    ...prevState,
    plugins: {
      ...prevState.plugins,
      installationStatus: {
        ...prevState.plugins.installationStatus,
        marketplaces: prevState.plugins.installationStatus.marketplaces.map(
          // m更新为 `> (m.name === name ? { ...m, status, error } : m)`，确保服务层后续读取最新状态。
          m => (m.name === name ? { ...m, status, error } : m),
        ),
      },
    },
  }))
}

/**
 * Perform background plugin startup checks and installations.
 *
 * This is a thin wrapper around reconcileMarketplaces() that maps onProgress
 * events to AppState updates for the REPL UI. After marketplaces are
 * reconciled:
 * - New installs → auto-refresh plugins (fixes "plugin-not-found" errors
 *   from the initial cache-only load on fresh homespace/cleared cache)
 * - Updates only → set needsRefresh, show notification for /reload-plugins
 */
// performBackgroundPluginInstallations 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function performBackgroundPluginInstallations(
  setAppState: SetAppState,
): Promise<void> {
  // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
  logForDebugging('performBackgroundPluginInstallations called')

  // 保护这一段可能失败的服务层 Plugin Installation Manager操作，确保异常能进入相邻错误处理。
  try {
    // Compute diff upfront for initial UI status (pending spinners)
    // declared读取`getDeclaredMarketplaces`，供服务层 Plugin Installation Manager后续处理使用。
    const declared = getDeclaredMarketplaces()
    // materialized读取`loadKnownMarketplacesConfig`，供服务层 Plugin Installation Manager后续处理使用。
    const materialized = await loadKnownMarketplacesConfig().catch(() => ({}))
    // diff保存`diffMarketplaces`，供服务层 Plugin Installation Manager后续处理使用。
    const diff = diffMarketplaces(declared, materialized)

    // pendingNames 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const pendingNames = [
      ...diff.missing,
      // 链式调用 链式方法，继续加工上一行在服务层 Plugin Installation Manager中产生的数据。
      ...diff.sourceChanged.map(c => c.name),
    ]

    // Initialize AppState with pending status. No per-plugin pending status —
    // plugin load is fast (cache hit or local copy); marketplace clone is the
    // slow part worth showing progress for.
    // setAppState 写入新的状态值，使服务层 Plugin Installation Manager后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      plugins: {
        ...prev.plugins,
        installationStatus: {
          // 这个回调绑定到 marketplaces: pendingNames.map(name => ({，负责服务层 Plugin Installation Manager在该局部场景下的响应。
          marketplaces: pendingNames.map(name => ({
            name,
            status: 'pending' as const,
          })),
          plugins: [],
        },
      },
    }))

    // pendingNames 集合为空时立即返回或跳过，避免服务层 Plugin Installation Manager把空集合当成可处理内容。
    if (pendingNames.length === 0) {
      // 服务层 Plugin Installation Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Installing ${pendingNames.length} marketplace(s) in background`,
    )

    // 结果保存`reconcileMarketplaces`，供服务层 Plugin Installation Manager后续处理使用。
    const result = await reconcileMarketplaces({
      // 这个回调绑定到 onProgress: event => {，负责服务层 Plugin Installation Manager在该局部场景下的响应。
      onProgress: event => {
        // 按照 event.type 的取值选择服务层 Plugin Installation Manager的具体处理分支。
        switch (event.type) {
          case 'installing':
            // 调用 updateMarketplaceStatus，触发服务层 Plugin Installation Manager此处需要的副作用。
            updateMarketplaceStatus(setAppState, event.name, 'installing')
            // 结束这个分支或循环，避免服务层 Plugin Installation Manager继续落入后续路径。
            break
          case 'installed':
            // 调用 updateMarketplaceStatus，触发服务层 Plugin Installation Manager此处需要的副作用。
            updateMarketplaceStatus(setAppState, event.name, 'installed')
            // 结束这个分支或循环，避免服务层 Plugin Installation Manager继续落入后续路径。
            break
          case 'failed':
            // 调用 updateMarketplaceStatus，触发服务层 Plugin Installation Manager此处需要的副作用。
            updateMarketplaceStatus(
              setAppState,
              event.name,
              'failed',
              event.error,
            )
            // 结束这个分支或循环，避免服务层 Plugin Installation Manager继续落入后续路径。
            break
        }
      },
    })

    // metrics 集合 集中保存服务层 Plugin Installation Manager要一起传递的字段。
    const metrics = {
      installed_count: result.installed.length,
      updated_count: result.updated.length,
      failed_count: result.failed.length,
      up_to_date_count: result.upToDate.length,
    }
    // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_marketplace_background_install', metrics)
    // 调用 logForDiagnosticsNoPII，触发服务层 Plugin Installation Manager此处需要的副作用。
    logForDiagnosticsNoPII(
      'info',
      'tengu_marketplace_background_install',
      metrics,
    )

    // 满足 `result.installed.length > 0` 时，服务层 Plugin Installation Manager执行该分支。
    if (result.installed.length > 0) {
      // New marketplaces were installed — auto-refresh plugins. This fixes
      // "Plugin not found in marketplace" errors from the initial cache-only
      // load (e.g., fresh homespace where marketplace cache was empty).
      // refreshActivePlugins clears all caches, reloads plugins, and bumps
      // pluginReconnectKey so MCP connections are re-established.
      // 清理相关缓存，确保服务层 Plugin Installation Manager下一次读取时重新加载最新数据。
      clearMarketplacesCache()
      // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Auto-refreshing plugins after ${result.installed.length} new marketplace(s) installed`,
      )
      // 保护这一段可能失败的服务层 Plugin Installation Manager操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `refreshActivePlugins(setAppState)` 完成，再继续服务层 Plugin Installation Manager的异步流程。
        await refreshActivePlugins(setAppState)
      } catch (refreshError) {
        // If auto-refresh fails, fall back to needsRefresh notification so
        // the user can manually run /reload-plugins to recover.
        // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
        logError(refreshError)
        // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Auto-refresh failed, falling back to needsRefresh: ${refreshError}`,
          { level: 'warn' },
        )
        // 清理相关缓存，确保服务层 Plugin Installation Manager下一次读取时重新加载最新数据。
        clearPluginCache(
          'performBackgroundPluginInstallations: auto-refresh failed',
        )
        // setAppState 写入新的状态值，使服务层 Plugin Installation Manager后续读取保持一致。
        setAppState(prev => {
          // 满足 `prev.plugins.needsRefresh` 时，服务层 Plugin Installation Manager执行该分支。
          if (prev.plugins.needsRefresh) return prev
          // 返回结构化结果，集中表达服务层 Plugin Installation Manager已经整理出的状态。
          return {
            ...prev,
            plugins: { ...prev.plugins, needsRefresh: true },
          }
        })
      }
    // 服务层 Plugin Installation Manager在这里处理 `} else if (result.updated.length > 0) {`，完成这一小步状态转换。
    } else if (result.updated.length > 0) {
      // Existing marketplaces updated — notify user to run /reload-plugins.
      // Updates are less urgent and the user should choose when to apply them.
      // 清理相关缓存，确保服务层 Plugin Installation Manager下一次读取时重新加载最新数据。
      clearMarketplacesCache()
      // 清理相关缓存，确保服务层 Plugin Installation Manager下一次读取时重新加载最新数据。
      clearPluginCache(
        'performBackgroundPluginInstallations: marketplaces reconciled',
      )
      // setAppState 写入新的状态值，使服务层 Plugin Installation Manager后续读取保持一致。
      setAppState(prev => {
        // 满足 `prev.plugins.needsRefresh` 时，服务层 Plugin Installation Manager执行该分支。
        if (prev.plugins.needsRefresh) return prev
        // 返回结构化结果，集中表达服务层 Plugin Installation Manager已经整理出的状态。
        return {
          ...prev,
          plugins: { ...prev.plugins, needsRefresh: true },
        }
      })
    }
  } catch (error) {
    // 记录服务层 Plugin Installation Manager运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}
