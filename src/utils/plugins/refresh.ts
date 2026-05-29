/**
 * Layer-3 refresh primitive: swap active plugin components in the running session.
 *
 * Three-layer model (see reconciler.ts for Layer-2):
 * - Layer 1: intent (settings)
 * - Layer 2: materialization (~/.claude/plugins/) — reconcileMarketplaces()
 * - Layer 3: active components (AppState) — this file
 *
 * Called from:
 * - /reload-plugins command (interactive, user-initiated)
 * - print.ts refreshPluginState() (headless, auto before first query with SYNC_PLUGIN_INSTALL)
 * - performBackgroundPluginInstallations() (background, auto after new marketplace install)
 *
 * NOT called from:
 * - useManagePlugins needsRefresh effect — interactive mode shows a notification;
 *   user explicitly runs /reload-plugins (PR 5c)
 * - /plugin menu — sets needsRefresh, user runs /reload-plugins (PR 5b)
 */

// 引入 getOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准插件管理的数据契约。
import type { Command } from '../../commands.js'
// 接入 reinitializeLspServerManager 服务层能力，把外部通信或共享状态交给 ../../services/lsp/manager.js 处理。
import { reinitializeLspServerManager } from '../../services/lsp/manager.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准插件管理的数据契约。
import type { AppState } from '../../state/AppState.js'
// 类型依赖 { AgentDefinitionsResult } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准插件管理的数据契约。
import type { AgentDefinitionsResult } from '../../tools/AgentTool/loadAgentsDir.js'
// 接入 getAgentDefinitionsWithOverrides 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getAgentDefinitionsWithOverrides } from '../../tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { PluginError } 来自 ../../types/plugin.js，用于校准插件管理的数据契约。
import type { PluginError } from '../../types/plugin.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 errorMessage，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 clearAllCaches，将 ./cacheUtils.js 中已经封装好的能力接到本文件流程里。
import { clearAllCaches } from './cacheUtils.js'
// 引入 getPluginCommands，将 ./loadPluginCommands.js 中已经封装好的能力接到本文件流程里。
import { getPluginCommands } from './loadPluginCommands.js'
// 引入 loadPluginHooks，将 ./loadPluginHooks.js 中已经封装好的能力接到本文件流程里。
import { loadPluginHooks } from './loadPluginHooks.js'
// 引入 loadPluginLspServers，将 ./lspPluginIntegration.js 中已经封装好的能力接到本文件流程里。
import { loadPluginLspServers } from './lspPluginIntegration.js'
// 引入 loadPluginMcpServers，将 ./mcpPluginIntegration.js 中已经封装好的能力接到本文件流程里。
import { loadPluginMcpServers } from './mcpPluginIntegration.js'
// 引入 clearPluginCacheExclusions，将 ./orphanedPluginFilter.js 中已经封装好的能力接到本文件流程里。
import { clearPluginCacheExclusions } from './orphanedPluginFilter.js'
// 引入 loadAllPlugins，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { loadAllPlugins } from './pluginLoader.js'

// SetAppState 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (updater: (prev: AppState) => AppState) => void

// RefreshActivePluginsResult 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type RefreshActivePluginsResult = {
  enabled_count: number
  disabled_count: number
  command_count: number
  agent_count: number
  hook_count: number
  mcp_count: number
  /** LSP servers provided by enabled plugins. reinitializeLspServerManager()
   * is called unconditionally so the manager picks these up (no-op if
   * manager was never initialized). */
  lsp_count: number
  error_count: number
  /** The refreshed agent definitions, for callers (e.g. print.ts) that also
   * maintain a local mutable reference outside AppState. */
  agentDefinitions: AgentDefinitionsResult
  /** The refreshed plugin commands, same rationale as agentDefinitions. */
  pluginCommands: Command[]
}

/**
 * Refresh all active plugin components: commands, agents, hooks, MCP-reconnect
 * trigger, AppState plugin arrays. Clears ALL plugin caches (unlike the old
 * needsRefresh path which only cleared loadAllPlugins and returned stale data
 * from downstream memoized loaders).
 *
 * Consumes plugins.needsRefresh (sets to false).
 * Increments mcp.pluginReconnectKey so useManageMCPConnections effects re-run
 * and pick up new plugin MCP servers.
 *
 * LSP: if plugins now contribute LSP servers, reinitializeLspServerManager()
 * re-reads config. Servers are lazy-started so this is just config parsing.
 */
// refreshActivePlugins 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshActivePlugins(
  setAppState: SetAppState,
): Promise<RefreshActivePluginsResult> {
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging('refreshActivePlugins: clearing all plugin caches')
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearAllCaches()
  // Orphan exclusions are session-frozen by default, but /reload-plugins is
  // an explicit "disk changed, re-read it" signal — recompute them too.
  // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
  clearPluginCacheExclusions()

  // Sequence the full load before cache-only consumers. Before #23693 all
  // three shared loadAllPlugins()'s memoize promise so Promise.all was a
  // no-op race. After #23693 getPluginCommands/getAgentDefinitions call
  // loadAllPluginsCacheOnly (separate memoize) — racing them means they
  // read installed_plugins.json before loadAllPlugins() has cloned+cached
  // the plugin, returning plugin-cache-miss. loadAllPlugins warms the
  // cache-only memoize on completion, so the awaits below are ~free.
  // pluginResult 插件数据读取`loadAllPlugins`，供插件管理后续处理使用。
  const pluginResult = await loadAllPlugins()
  // 并行获取 pluginCommands、agentDefinitions，缩短插件工具 refresh等待多个独立异步任务的时间。
  const [pluginCommands, agentDefinitions] = await Promise.all([
    getPluginCommands(),
    getAgentDefinitionsWithOverrides(getOriginalCwd()),
  ])

  // 从 `pluginResult` 解构 enabled、disabled、errors，减少插件工具 refresh对同一对象的重复访问。
  const { enabled, disabled, errors } = pluginResult

  // Populate mcpServers/lspServers on each enabled plugin. These are lazy
  // cache slots NOT filled by loadAllPlugins() — they're written later by
  // extractMcpServersFromPlugins/getPluginLspServers, which races with this.
  // Loading here gives accurate metrics AND warms the cache slots so the MCP
  // connection manager (triggered by pluginReconnectKey bump) sees the servers
  // without re-parsing manifests. Errors are pushed to the shared errors array.
  // 并行获取 mcpCounts、lspCounts，缩短插件工具 refresh等待多个独立异步任务的时间。
  const [mcpCounts, lspCounts] = await Promise.all([
    Promise.all(
      // 调用 enabled.map，触发插件管理此处需要的副作用。
      enabled.map(async p => {
        // 满足 `p.mcpServers) return Object.keys(p.mcpServers` 时，插件管理执行该分支。
        if (p.mcpServers) return Object.keys(p.mcpServers).length
        // servers 集合读取`loadPluginMcpServers`，供插件管理后续处理使用。
        const servers = await loadPluginMcpServers(p, errors)
        // 满足 `servers` 时，插件管理执行该分支。
        if (servers) p.mcpServers = servers
        // 返回 `servers ? Object.keys(servers).length : 0`，作为插件管理这次计算的结果。
        return servers ? Object.keys(servers).length : 0
      }),
    ),
    Promise.all(
      // 调用 enabled.map，触发插件管理此处需要的副作用。
      enabled.map(async p => {
        // 满足 `p.lspServers) return Object.keys(p.lspServers` 时，插件管理执行该分支。
        if (p.lspServers) return Object.keys(p.lspServers).length
        // servers 集合读取`loadPluginLspServers`，供插件管理后续处理使用。
        const servers = await loadPluginLspServers(p, errors)
        // 满足 `servers` 时，插件管理执行该分支。
        if (servers) p.lspServers = servers
        // 返回 `servers ? Object.keys(servers).length : 0`，作为插件管理这次计算的结果。
        return servers ? Object.keys(servers).length : 0
      }),
    ),
  ])
  // mcp_count 数量派生`mcpCounts.reduce`，供插件管理后续处理使用。
  const mcp_count = mcpCounts.reduce((sum, n) => sum + n, 0)
  // lsp_count 数量派生`lspCounts.reduce`，供插件管理后续处理使用。
  const lsp_count = lspCounts.reduce((sum, n) => sum + n, 0)

  // setAppState 写入新的状态值，使插件管理后续读取保持一致。
  setAppState(prev => ({
    ...prev,
    plugins: {
      ...prev.plugins,
      enabled,
      disabled,
      commands: pluginCommands,
      errors: mergePluginErrors(prev.plugins.errors, errors),
      needsRefresh: false,
    },
    agentDefinitions,
    mcp: {
      ...prev.mcp,
      pluginReconnectKey: prev.mcp.pluginReconnectKey + 1,
    },
  }))

  // Re-initialize LSP manager so newly-loaded plugin LSP servers are picked
  // up. No-op if LSP was never initialized (headless subcommand path).
  // Unconditional so removing the last LSP plugin also clears stale config.
  // Fixes issue #15521: LSP manager previously read a stale memoized
  // loadAllPlugins() result from before marketplaces were reconciled.
  // 调用 reinitializeLspServerManager，触发插件管理此处需要的副作用。
  reinitializeLspServerManager()

  // clearAllCaches() prunes removed-plugin hooks; this does the FULL swap
  // (adds hooks from newly-enabled plugins too). Catching here so
  // hook_load_failed can feed error_count; a failure doesn't lose the
  // plugin/command/agent data above (hooks go to STATE.registeredHooks, not
  // AppState).
  // hook_load_failed标记插件工具 refresh是否启用对应路径。
  let hook_load_failed = false
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `loadPluginHooks()` 完成，再继续插件工具 refresh的异步流程。
    await loadPluginHooks()
  } catch (e) {
    // hook_load_failed更新为 `true`，确保插件工具后续读取最新状态。
    hook_load_failed = true
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logError(e)
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `refreshActivePlugins: loadPluginHooks failed: ${errorMessage(e)}`,
    )
  }

  // hook_count 数量派生`enabled.reduce`，供插件管理后续处理使用。
  const hook_count = enabled.reduce((sum, p) => {
    // p.hooksConfig 配置缺失时直接走兜底路径，避免插件管理使用无效输入。
    if (!p.hooksConfig) return sum
    // 返回 `(`，作为插件管理这次计算的结果。
    return (
      sum +
      Object.values(p.hooksConfig).reduce(
        // 这个回调绑定到 (s, matchers) =>，负责插件管理在该局部场景下的响应。
        (s, matchers) =>
          // 这个回调绑定到 s + (matchers?.reduce((h, m) => h + m.hooks.length, 0) ?? 0),，负责插件管理在该局部场景下的响应。
          s + (matchers?.reduce((h, m) => h + m.hooks.length, 0) ?? 0),
        0,
      )
    )
  }, 0)

  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `refreshActivePlugins: ${enabled.length} enabled, ${pluginCommands.length} commands, ${agentDefinitions.allAgents.length} agents, ${hook_count} hooks, ${mcp_count} MCP, ${lsp_count} LSP`,
  )

  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return {
    enabled_count: enabled.length,
    disabled_count: disabled.length,
    command_count: pluginCommands.length,
    agent_count: agentDefinitions.allAgents.length,
    hook_count,
    mcp_count,
    lsp_count,
    error_count: errors.length + (hook_load_failed ? 1 : 0),
    agentDefinitions,
    pluginCommands,
  }
}

/**
 * Merge fresh plugin-load errors with existing errors, preserving LSP and
 * plugin-component errors that were recorded by other systems and
 * deduplicating. Same logic as refreshPlugins()/updatePluginState(), extracted
 * so refresh.ts doesn't leave those errors stranded.
 */
// mergePluginErrors 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mergePluginErrors(
  existing: PluginError[],
  fresh: PluginError[],
): PluginError[] {
  // preserved筛选`existing.filter`，供插件管理后续处理使用。
  const preserved = existing.filter(
    // e更新为 `> e.source === 'lsp-manager' || e.source.startsWith('plug...`，确保插件工具后续读取最新状态。
    e => e.source === 'lsp-manager' || e.source.startsWith('plugin:'),
  )
  // freshKeys 集合保存`Set`，供插件管理后续处理使用。
  const freshKeys = new Set(fresh.map(errorKey))
  // deduped筛选`preserved.filter`，供插件管理后续处理使用。
  const deduped = preserved.filter(e => !freshKeys.has(errorKey(e)))
  // 返回列表结果，保留插件管理已经排好的条目顺序。
  return [...deduped, ...fresh]
}

// errorKey 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function errorKey(e: PluginError): string {
  // 返回 `e.type === 'generic-error'`，作为插件管理这次计算的结果。
  return e.type === 'generic-error'
    ? `generic-error:${e.source}:${e.error}`
    : `${e.type}:${e.source}`
}
