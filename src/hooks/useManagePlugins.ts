// 引入 useCallback、useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect } from 'react'
// 类型依赖 { Command } 来自 ../commands.js，用于校准React hook 状态流的数据契约。
import type { Command } from '../commands.js'
// 引入 useNotifications，将 ../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../context/notifications.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 reinitializeLspServerManager 服务层能力，把外部通信或共享状态交给 ../services/lsp/manager.js 处理。
import { reinitializeLspServerManager } from '../services/lsp/manager.js'
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js'
// 类型依赖 { AgentDefinition } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准React hook 状态流的数据契约。
import type { AgentDefinition } from '../tools/AgentTool/loadAgentsDir.js'
// 复用 count 工具函数，把通用处理留在 ../utils/array.js 中维护。
import { count } from '../utils/array.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 复用 toError 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { toError } from '../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 loadPluginAgents 工具函数，把通用处理留在 ../utils/plugins/loadPluginAgents.js 中维护。
import { loadPluginAgents } from '../utils/plugins/loadPluginAgents.js'
// 复用 getPluginCommands 工具函数，把通用处理留在 ../utils/plugins/loadPluginCommands.js 中维护。
import { getPluginCommands } from '../utils/plugins/loadPluginCommands.js'
// 复用 loadPluginHooks 工具函数，把通用处理留在 ../utils/plugins/loadPluginHooks.js 中维护。
import { loadPluginHooks } from '../utils/plugins/loadPluginHooks.js'
// 复用 loadPluginLspServers 工具函数，把通用处理留在 ../utils/plugins/lspPluginIntegration.js 中维护。
import { loadPluginLspServers } from '../utils/plugins/lspPluginIntegration.js'
// 复用 loadPluginMcpServers 工具函数，把通用处理留在 ../utils/plugins/mcpPluginIntegration.js 中维护。
import { loadPluginMcpServers } from '../utils/plugins/mcpPluginIntegration.js'
// 复用 detectAndUninstallDelistedPlugins 工具函数，把通用处理留在 ../utils/plugins/pluginBlocklist.js 中维护。
import { detectAndUninstallDelistedPlugins } from '../utils/plugins/pluginBlocklist.js'
// 复用 getFlaggedPlugins 工具函数，把通用处理留在 ../utils/plugins/pluginFlagging.js 中维护。
import { getFlaggedPlugins } from '../utils/plugins/pluginFlagging.js'
// 复用 loadAllPlugins 工具函数，把通用处理留在 ../utils/plugins/pluginLoader.js 中维护。
import { loadAllPlugins } from '../utils/plugins/pluginLoader.js'

/**
 * Hook to manage plugin state and synchronize with AppState.
 *
 * On mount: loads all plugins, runs delisting enforcement, surfaces flagged-
 * plugin notifications, populates AppState.plugins. This is the initial
 * Layer-3 load — subsequent refresh goes through /reload-plugins.
 *
 * On needsRefresh: shows a notification directing the user to /reload-plugins.
 * Does NOT auto-refresh. All Layer-3 swap (commands, agents, hooks, MCP)
 * goes through refreshActivePlugins() via /reload-plugins for one consistent
 * mental model. See Outline: declarative-settings-hXHBMDIf4b PR 5c.
 */
// useManagePlugins 封装useManagePlugins的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useManagePlugins({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // needsRefresh记录 `useAppState` 是否成立，React hook随后按该结果分支。
  const needsRefresh = useAppState(s => s.plugins.needsRefresh)
  // 从 `useNotifications()` 解构 addNotification，减少React hook use Manage Plugins对同一对象的重复访问。
  const { addNotification } = useNotifications()

  // Initial plugin load. Runs once on mount. NOT used for refresh — all
  // post-mount refresh goes through /reload-plugins → refreshActivePlugins().
  // Unlike refreshActivePlugins, this also runs delisting enforcement and
  // flagged-plugin notifications (session-start concerns), and does NOT bump
  // mcp.pluginReconnectKey (MCP effects fire on their own mount).
  // initialPluginLoad 插件数据保存`useCallback`，供React hook后续处理使用。
  const initialPluginLoad = useCallback(async () => {
    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // Load all plugins - capture errors array
      // 从 `await loadAllPlugins()` 解构 enabled、disabled、errors，减少React hook use Manage Plugins对同一对象的重复访问。
      const { enabled, disabled, errors } = await loadAllPlugins()

      // Detect delisted plugins, auto-uninstall them, and record as flagged.
      // 等待 `detectAndUninstallDelistedPlugins()` 完成，再继续React hook use Manage Plugins的异步流程。
      await detectAndUninstallDelistedPlugins()

      // Notify if there are flagged plugins pending dismissal
      // flagged读取`getFlaggedPlugins`，供React hook后续处理使用。
      const flagged = getFlaggedPlugins()
      // 满足 `Object.keys(flagged).length > 0` 时，React hook执行该分支。
      if (Object.keys(flagged).length > 0) {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: 'plugin-delisted-flagged',
          text: 'Plugins flagged. Check /plugins',
          color: 'warning',
          priority: 'high',
        })
      }

      // Load commands, agents, and hooks with individual error handling
      // Errors are added to the errors array for user visibility in Doctor UI
      // commands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      let commands: Command[] = []
      // agents 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
      let agents: AgentDefinition[] = []

      // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
      try {
        // commands 命令数据更新为 `await getPluginCommands()`，确保useManagePlugins后续读取最新状态。
        commands = await getPluginCommands()
      } catch (error) {
        // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'generic-error',
          source: 'plugin-commands',
          error: `Failed to load plugin commands: ${errorMessage}`,
        })
      }

      // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
      try {
        // agents 集合更新为 `await loadPluginAgents()`，确保useManagePlugins后续读取最新状态。
        agents = await loadPluginAgents()
      } catch (error) {
        // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'generic-error',
          source: 'plugin-agents',
          error: `Failed to load plugin agents: ${errorMessage}`,
        })
      }

      // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `loadPluginHooks()` 完成，再继续React hook use Manage Plugins的异步流程。
        await loadPluginHooks()
      } catch (error) {
        // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // 错误列表追加新条目，保持收集顺序与输入顺序一致。
        errors.push({
          type: 'generic-error',
          source: 'plugin-hooks',
          error: `Failed to load plugin hooks: ${errorMessage}`,
        })
      }

      // Load MCP server configs per plugin to get an accurate count.
      // LoadedPlugin.mcpServers is not populated by loadAllPlugins — it's a
      // cache slot that extractMcpServersFromPlugins fills later, which races
      // with this metric. Calling loadPluginMcpServers directly (as
      // cli/handlers/plugins.ts does) gives the correct count and also
      // warms the cache for the MCP connection manager.
      //
      // Runs BEFORE setAppState so any errors pushed by these loaders make it
      // into AppState.plugins.errors (Doctor UI), not just telemetry.
      // mcpServerCounts 数量保存`Promise.all`，供React hook后续处理使用。
      const mcpServerCounts = await Promise.all(
        // 调用 enabled.map，触发React hook此处需要的副作用。
        enabled.map(async p => {
          // 满足 `p.mcpServers) return Object.keys(p.mcpServers` 时，React hook执行该分支。
          if (p.mcpServers) return Object.keys(p.mcpServers).length
          // servers 集合读取`loadPluginMcpServers`，供React hook后续处理使用。
          const servers = await loadPluginMcpServers(p, errors)
          // 满足 `servers` 时，React hook执行该分支。
          if (servers) p.mcpServers = servers
          // 返回 `servers ? Object.keys(servers).length : 0`，作为React hook 状态流这次计算的结果。
          return servers ? Object.keys(servers).length : 0
        }),
      )
      // mcp_count 数量派生`mcpServerCounts.reduce`，供React hook后续处理使用。
      const mcp_count = mcpServerCounts.reduce((sum, n) => sum + n, 0)

      // LSP: the primary fix for issue #15521 is in refresh.ts (via
      // performBackgroundPluginInstallations → refreshActivePlugins, which
      // clears caches first). This reinit is defensive — it reads the same
      // memoized loadAllPlugins() result as the original init unless a cache
      // invalidation happened between main.tsx:3203 and REPL mount (e.g.
      // seed marketplace registration or policySettings hot-reload).
      // lspServerCounts 数量保存`Promise.all`，供React hook后续处理使用。
      const lspServerCounts = await Promise.all(
        // 调用 enabled.map，触发React hook此处需要的副作用。
        enabled.map(async p => {
          // 满足 `p.lspServers) return Object.keys(p.lspServers` 时，React hook执行该分支。
          if (p.lspServers) return Object.keys(p.lspServers).length
          // servers 集合读取`loadPluginLspServers`，供React hook后续处理使用。
          const servers = await loadPluginLspServers(p, errors)
          // 满足 `servers` 时，React hook执行该分支。
          if (servers) p.lspServers = servers
          // 返回 `servers ? Object.keys(servers).length : 0`，作为React hook 状态流这次计算的结果。
          return servers ? Object.keys(servers).length : 0
        }),
      )
      // lsp_count 数量派生`lspServerCounts.reduce`，供React hook后续处理使用。
      const lsp_count = lspServerCounts.reduce((sum, n) => sum + n, 0)
      // 调用 reinitializeLspServerManager，触发React hook此处需要的副作用。
      reinitializeLspServerManager()

      // Update AppState - merge errors to preserve LSP errors
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prevState => {
        // Keep existing LSP/non-plugin-loading errors (source 'lsp-manager' or 'plugin:*')
        // existingLspErrors 错误信息筛选`errors.filter`，供React hook后续处理使用。
        const existingLspErrors = prevState.plugins.errors.filter(
          // e更新为 `> e.source === 'lsp-manager' || e.source.startsWith('plug...`，确保useManagePlugins后续读取最新状态。
          e => e.source === 'lsp-manager' || e.source.startsWith('plugin:'),
        )
        // Deduplicate: remove existing LSP errors that are also in new errors
        // newErrorKeys 错误信息保存`Set`，供React hook后续处理使用。
        const newErrorKeys = new Set(
          // 调用 errors.map，触发React hook此处需要的副作用。
          errors.map(e =>
            e.type === 'generic-error'
              ? `generic-error:${e.source}:${e.error}`
              : `${e.type}:${e.source}`,
          ),
        )
        // filteredExisting筛选`existingLspErrors.filter`，供React hook后续处理使用。
        const filteredExisting = existingLspErrors.filter(e => {
          // key 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const key =
            e.type === 'generic-error'
              ? `generic-error:${e.source}:${e.error}`
              : `${e.type}:${e.source}`
          // 返回 `!newErrorKeys.has(key)`，作为React hook 状态流这次计算的结果。
          return !newErrorKeys.has(key)
        })
        // mergedErrors 错误信息 聚合成有序列表，保持后续遍历顺序稳定。
        const mergedErrors = [...filteredExisting, ...errors]

        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prevState,
          plugins: {
            ...prevState.plugins,
            enabled,
            disabled,
            commands,
            errors: mergedErrors,
          },
        }
      })

      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Loaded plugins - Enabled: ${enabled.length}, Disabled: ${disabled.length}, Commands: ${commands.length}, Agents: ${agents.length}, Errors: ${errors.length}`,
      )

      // Count component types across enabled plugins
      // hook_count 数量派生`enabled.reduce`，供React hook后续处理使用。
      const hook_count = enabled.reduce((sum, p) => {
        // p.hooksConfig 配置缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!p.hooksConfig) return sum
        // 返回 `(`，作为React hook 状态流这次计算的结果。
        return (
          sum +
          Object.values(p.hooksConfig).reduce(
            // 这个回调绑定到 (s, matchers) =>，负责React hook 状态流在该局部场景下的响应。
            (s, matchers) =>
              // 这个回调绑定到 s + (matchers?.reduce((h, m) => h + m.hooks.length, 0) ?? 0),，负责React hook 状态流在该局部场景下的响应。
              s + (matchers?.reduce((h, m) => h + m.hooks.length, 0) ?? 0),
            0,
          )
        )
      }, 0)

      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        enabled_count: enabled.length,
        disabled_count: disabled.length,
        // 这个回调绑定到 inline_count: count(enabled, p => p.source.endsWith('@inline')),，负责React hook 状态流在该局部场景下的响应。
        inline_count: count(enabled, p => p.source.endsWith('@inline')),
        // 这个回调绑定到 marketplace_count: count(enabled, p => !p.source.endsWith('@inline')),，负责React hook 状态流在该局部场景下的响应。
        marketplace_count: count(enabled, p => !p.source.endsWith('@inline')),
        error_count: errors.length,
        skill_count: commands.length,
        agent_count: agents.length,
        hook_count,
        mcp_count,
        lsp_count,
        // Ant-only: which plugins are enabled, to correlate with RSS/FPS.
        // Kept separate from base metrics so it doesn't flow into
        // logForDiagnosticsNoPII.
        ant_enabled_names:
          process.env.USER_TYPE === 'ant' && enabled.length > 0
            ? (enabled
                // 链式调用 map，继续加工上一行在React hook 状态流中产生的数据。
                .map(p => p.name)
                .sort()
                .join(
                  ',',
                ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
            : undefined,
      }
    } catch (error) {
      // Only plugin loading errors should reach here - log for monitoring
      // errorObj 错误信息保存`toError`，供React hook后续处理使用。
      const errorObj = toError(error)
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logError(errorObj)
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Error loading plugins: ${error}`)
      // Set empty state on error, but preserve LSP errors and add the new error
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prevState => {
        // Keep existing LSP/non-plugin-loading errors
        // existingLspErrors 错误信息筛选`errors.filter`，供React hook后续处理使用。
        const existingLspErrors = prevState.plugins.errors.filter(
          // e更新为 `> e.source === 'lsp-manager' || e.source.startsWith('plug...`，确保useManagePlugins后续读取最新状态。
          e => e.source === 'lsp-manager' || e.source.startsWith('plugin:'),
        )
        // newError 错误信息 集中保存React hook use Manage...要一起传递的字段。
        const newError = {
          type: 'generic-error' as const,
          source: 'plugin-system',
          error: errorObj.message,
        }
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prevState,
          plugins: {
            ...prevState.plugins,
            enabled: [],
            disabled: [],
            commands: [],
            errors: [...existingLspErrors, newError],
          },
        }
      })

      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        enabled_count: 0,
        disabled_count: 0,
        inline_count: 0,
        marketplace_count: 0,
        error_count: 1,
        skill_count: 0,
        agent_count: 0,
        hook_count: 0,
        mcp_count: 0,
        lsp_count: 0,
        load_failed: true,
        ant_enabled_names: undefined,
      }
    }
  }, [setAppState, addNotification])

  // Load plugins on mount and emit telemetry
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return
    // 这个回调绑定到 void initialPluginLoad().then(metrics => {，负责React hook 状态流在该局部场景下的响应。
    void initialPluginLoad().then(metrics => {
      // 从 `metrics` 解构 ant_enabled_names、其余 baseMetrics，减少React hook use Manage Plugins对同一对象的重复访问。
      const { ant_enabled_names, ...baseMetrics } = metrics
      // allMetrics 集合 集中保存React hook use Manage...要一起传递的字段。
      const allMetrics = {
        ...baseMetrics,
        has_custom_plugin_cache_dir: !!process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR,
      }
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_plugins_loaded', {
        ...allMetrics,
        ...(ant_enabled_names !== undefined && {
          enabled_names: ant_enabled_names,
        }),
      })
      // 调用 logForDiagnosticsNoPII，触发React hook此处需要的副作用。
      logForDiagnosticsNoPII('info', 'tengu_plugins_loaded', allMetrics)
    })
  }, [initialPluginLoad, enabled])

  // Plugin state changed on disk (background reconcile, /plugin menu,
  // external settings edit). Show a notification; user runs /reload-plugins
  // to apply. The previous auto-refresh here had a stale-cache bug (only
  // cleared loadAllPlugins, downstream memoized loaders returned old data)
  // and was incomplete (no MCP, no agentDefinitions). /reload-plugins
  // handles all of that correctly via refreshActivePlugins().
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 组合条件 `!enabled || !needsRefresh` 成立时，React hook 状态流才启用这条专门路径。
    if (!enabled || !needsRefresh) return
    // 调用 addNotification，触发React hook此处需要的副作用。
    addNotification({
      key: 'plugin-reload-pending',
      text: 'Plugins changed. Run /reload-plugins to activate.',
      color: 'suggestion',
      priority: 'low',
    })
    // Do NOT auto-refresh. Do NOT reset needsRefresh — /reload-plugins
    // consumes it via refreshActivePlugins().
  }, [enabled, needsRefresh, addNotification])
}
