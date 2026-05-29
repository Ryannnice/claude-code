// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path'
// 引入 useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef } from 'react'
// 引入 getSessionId，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../../bootstrap/state.js'
// 类型依赖 { Command } 来自 ../../commands.js，用于校准MCP 服务的数据契约。
import type { Command } from '../../commands.js'
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准MCP 服务的数据契约。
import type { Tool } from '../../Tool.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  clearServerCache,
  fetchCommandsForClient,
  fetchResourcesForClient,
  fetchToolsForClient,
  getMcpToolsCommandsAndResources,
  reconnectMcpServerImpl,
} from './client.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import type {
  MCPServerConnection,
  ScopedMcpServerConfig,
  ServerResource,
} from './types.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// fetchMcpSkillsForClient保存`feature`，供MCP 服务后续处理使用。
const fetchMcpSkillsForClient = feature('MCP_SKILLS')
  ? (
      require('../../skills/mcpSkills.js') as typeof import('../../skills/mcpSkills.js')
    ).fetchMcpSkillsForClient
  : null
// clearSkillIndexCache 缓存保存`feature`，供MCP 服务后续处理使用。
const clearSkillIndexCache = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? (
      require('../skillSearch/localSearch.js') as typeof import('../skillSearch/localSearch.js')
    ).clearSkillIndexCache
  : null

// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  PromptListChangedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js'
// 引入 omit，将 lodash-es/omit.js 中已经封装好的能力接到本文件流程里。
import omit from 'lodash-es/omit.js'
// 引入 reject，将 lodash-es/reject.js 中已经封装好的能力接到本文件流程里。
import reject from 'lodash-es/reject.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  dedupClaudeAiMcpServers,
  doesEnterpriseMcpConfigExist,
  filterMcpServersByPolicy,
  getClaudeCodeMcpConfigs,
  isMcpServerDisabled,
  setMcpServerEnabled,
} from 'src/services/mcp/config.js'
// 类型依赖 { AppState } 来自 src/state/AppState.js，用于校准MCP 服务的数据契约。
import type { AppState } from 'src/state/AppState.js'
// 类型依赖 { PluginError } 来自 src/types/plugin.js，用于校准MCP 服务的数据契约。
import type { PluginError } from 'src/types/plugin.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 引入 getAllowedChannels，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAllowedChannels } from '../../bootstrap/state.js'
// 引入 useNotifications，将 ../../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../../context/notifications.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  useAppState,
  useAppStateStore,
  useSetAppState,
} from '../../state/AppState.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 复用 logMCPDebug、logMCPError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug, logMCPError } from '../../utils/log.js'
// 复用 enqueue 工具函数，把通用处理留在 ../../utils/messageQueueManager.js 中维护。
import { enqueue } from '../../utils/messageQueueManager.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  CHANNEL_PERMISSION_METHOD,
  ChannelMessageNotificationSchema,
  ChannelPermissionNotificationSchema,
  findChannelEntry,
  gateChannelServer,
  wrapChannelMessage,
} from './channelNotification.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type ChannelPermissionCallbacks,
  createChannelPermissionCallbacks,
  isChannelPermissionRelayEnabled,
} from './channelPermissions.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  clearClaudeAIMcpConfigsCache,
  fetchClaudeAIMcpConfigsIfEligible,
} from './claudeai.js'
// 引入 registerElicitationHandler，将 ./elicitationHandler.js 中已经封装好的能力接到本文件流程里。
import { registerElicitationHandler } from './elicitationHandler.js'
// 引入 getMcpPrefix，将 ./mcpStringUtils.js 中已经封装好的能力接到本文件流程里。
import { getMcpPrefix } from './mcpStringUtils.js'
// 引入 commandBelongsToServer、excludeStalePluginClients，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { commandBelongsToServer, excludeStalePluginClients } from './utils.js'

// Constants for reconnection with exponential backoff
// MAX_RECONNECT_ATTEMPTS 集合保存`5`，供MCP 服务MCP 服务 use Manage MCPConnec...后续判断或输出使用。
const MAX_RECONNECT_ATTEMPTS = 5
// INITIAL_BACKOFF_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const INITIAL_BACKOFF_MS = 1000
// MAX_BACKOFF_MS 集合保存`30000`，供后续判断或组装使用。
const MAX_BACKOFF_MS = 30000

/**
 * Create a unique key for a plugin error to enable deduplication
 */
// getErrorKey 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getErrorKey(error: PluginError): string {
  // plugin 插件数据保存`'plugin' in error ? error.plugin : 'no-plugin'`，作为后续固定文本处理的输入。
  const plugin = 'plugin' in error ? error.plugin : 'no-plugin'
  // 返回 ``${error.type}:${error.source}:${plugin}``，作为MCP 服务这次计算的结果。
  return `${error.type}:${error.source}:${plugin}`
}

/**
 * Add errors to AppState, deduplicating to avoid showing the same error multiple times
 */
// addErrorsToAppState 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function addErrorsToAppState(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责MCP 服务在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
  newErrors: PluginError[],
): void {
  // newErrors 错误信息为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
  if (newErrors.length === 0) return

  // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
  setAppState(prevState => {
    // Build set of existing error keys
    // existingKeys 集合保存`Set`，供MCP 服务后续处理使用。
    const existingKeys = new Set(
      // 调用 prevState.plugins.errors.map，触发MCP 服务此处需要的副作用。
      prevState.plugins.errors.map(e => getErrorKey(e)),
    )

    // Only add errors that don't already exist
    // uniqueNewErrors 错误信息筛选`newErrors.filter`，供MCP 服务后续处理使用。
    const uniqueNewErrors = newErrors.filter(
      // 错误更新为 `> !existingKeys.has(getErrorKey(error))`，确保MCP 服务后续读取最新状态。
      error => !existingKeys.has(getErrorKey(error)),
    )

    // uniqueNewErrors 错误信息为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
    if (uniqueNewErrors.length === 0) {
      // 返回 `prevState`，作为MCP 服务这次计算的结果。
      return prevState
    }

    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return {
      ...prevState,
      plugins: {
        ...prevState.plugins,
        errors: [...prevState.plugins.errors, ...uniqueNewErrors],
      },
    }
  })
}

/**
 * Hook to manage MCP (Model Context Protocol) server connections and updates
 *
 * This hook:
 * 1. Initializes MCP client connections based on config
 * 2. Sets up handlers for connection lifecycle events and sync with app state
 * 3. Manages automatic reconnection for SSE connections
 * 4. Returns a reconnect function
 */
// useManageMCPConnections 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useManageMCPConnections(
  dynamicMcpConfig: Record<string, ScopedMcpServerConfig> | undefined,
  isStrictMcpConfig = false,
) {
  // store保存`useAppStateStore`，供MCP 服务后续处理使用。
  const store = useAppStateStore()
  // _authVersion保存`useAppState`，供MCP 服务后续处理使用。
  const _authVersion = useAppState(s => s.authVersion)
  // Incremented by /reload-plugins (refreshActivePlugins) to pick up newly
  // enabled plugin MCP servers. getClaudeCodeMcpConfigs() reads loadAllPlugins()
  // which has been cleared by refreshActivePlugins, so the effects below see
  // fresh plugin data on re-run.
  // _pluginReconnectKey 插件数据保存`useAppState`，供MCP 服务后续处理使用。
  const _pluginReconnectKey = useAppState(s => s.mcp.pluginReconnectKey)
  // setAppState 状态保存`useSetAppState`，供MCP 服务后续处理使用。
  const setAppState = useSetAppState()

  // Track active reconnection attempts to allow cancellation
  // reconnectTimersRef 引用保存`Map`，供MCP 服务后续处理使用。
  const reconnectTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Dedup the --channels blocked warning per skip kind so that a user who
  // sees "run /login" (auth skip), logs in, then hits the policy gate
  // gets a second toast.
  // channelWarnedKindsRef 引用保存 hook 状态，让MCP 服务MCP 服务 use Manage MCPConnec...跨渲染复用同一个容器。
  const channelWarnedKindsRef = useRef<
    Set<'disabled' | 'auth' | 'policy' | 'marketplace' | 'allowlist'>
  >(new Set())
  // Channel permission callbacks — constructed once, stable ref. Stored in
  // AppState so interactiveHandler can subscribe. The pending Map lives inside
  // the closure (not module-level, not AppState — functions-in-state is brittle).
  // channelPermCallbacksRef 引用保存 hook 状态，让MCP 服务MCP 服务 use Manage MCPConnec...跨渲染复用同一个容器。
  const channelPermCallbacksRef = useRef<ChannelPermissionCallbacks | null>(
    null,
  )
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    (feature('KAIROS') || feature('KAIROS_CHANNELS')) &&
    channelPermCallbacksRef.current === null
  ) {
    // current更新为 `createChannelPermissionCallbacks()`，确保MCP 服务后续读取最新状态。
    channelPermCallbacksRef.current = createChannelPermissionCallbacks()
  }
  // Store callbacks in AppState so interactiveHandler.ts can reach them via
  // ctx.toolUseContext.getAppState(). One-time set — the ref is stable.
  // 调用 useEffect，触发MCP 服务此处需要的副作用。
  useEffect(() => {
    // 组合条件 `feature('KAIROS') || feature('KAIROS_CHANNELS')` 成立时，MCP 服务才启用这条专门路径。
    if (feature('KAIROS') || feature('KAIROS_CHANNELS')) {
      // callbacks 集合 命名 `channelPermCallbacksRef.current`，让后续代码直接表达这个值的用途。
      const callbacks = channelPermCallbacksRef.current
      // callbacks 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!callbacks) return
      // GrowthBook runtime gate — separate from channels so channels can
      // ship without this. Checked at mount; mid-session flips need restart.
      // If off, callbacks never go into AppState → interactiveHandler sees
      // undefined → never sends → intercept has nothing pending → "yes tbxkq"
      // flows to Claude as normal chat. One gate, full disable.
      // 满足 `!isChannelPermissionRelayEnabled()` 时，MCP 服务执行该分支。
      if (!isChannelPermissionRelayEnabled()) return
      // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
      setAppState(prev => {
        // 满足 `prev.channelPermissionCallbacks === callbacks` 时，MCP 服务执行该分支。
        if (prev.channelPermissionCallbacks === callbacks) return prev
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return { ...prev, channelPermissionCallbacks: callbacks }
      })
      // 返回 `() => {`，作为MCP 服务这次计算的结果。
      return () => {
        // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
        setAppState(prev => {
          // 满足 `prev.channelPermissionCallbacks === undefined` 时，MCP 服务执行该分支。
          if (prev.channelPermissionCallbacks === undefined) return prev
          // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
          return { ...prev, channelPermissionCallbacks: undefined }
        })
      }
    }
  }, [setAppState])
  // 从 `useNotifications()` 解构 addNotification，减少MCP 服务 use Manage MCPConnections对同一对象的重复访问。
  const { addNotification } = useNotifications()

  // Batched MCP state updates: queue individual server updates and flush them
  // in a single setAppState call via setTimeout. Using a time-based window
  // (instead of queueMicrotask) ensures updates are batched even when
  // connection callbacks arrive at different times due to network I/O.
  // MCP_BATCH_FLUSH_MS 集合保存`16`，供MCP 服务MCP 服务 use Manage MCPConnec...后续判断或输出使用。
  const MCP_BATCH_FLUSH_MS = 16
  // PendingUpdate 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
  type PendingUpdate = MCPServerConnection & {
    tools?: Tool[]
    commands?: Command[]
    resources?: ServerResource[]
  }
  // pendingUpdatesRef 引用保存 hook 状态，让MCP 服务MCP 服务 use Manage MCPConnec...跨渲染复用同一个容器。
  const pendingUpdatesRef = useRef<PendingUpdate[]>([])
  // flushTimerRef 引用保存 hook 状态，让MCP 服务MCP 服务 use Manage MCPConnec...跨渲染复用同一个容器。
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // flushPendingUpdates 集合保存`useCallback`，供MCP 服务后续处理使用。
  const flushPendingUpdates = useCallback(() => {
    // current更新为 `null`，确保MCP 服务后续读取最新状态。
    flushTimerRef.current = null
    // updates 集合保存`pendingUpdatesRef.current`，供MCP 服务MCP 服务 use Manage MCPConnec...后续判断或输出使用。
    const updates = pendingUpdatesRef.current
    // updates 集合为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
    if (updates.length === 0) return
    // current更新为 `[]`，确保MCP 服务后续读取最新状态。
    pendingUpdatesRef.current = []

    // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
    setAppState(prevState => {
      // mcp保存`prevState.mcp`，供后续判断或组装使用。
      let mcp = prevState.mcp

      // 按顺序遍历 `updates` 中的update，逐个交给MCP 服务处理。
      for (const update of updates) {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          tools: rawTools,
          commands: rawCmds,
          resources: rawRes,
          ...client
        } = update
        // tools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const tools =
          client.type === 'disabled' || client.type === 'failed'
            ? (rawTools ?? [])
            : rawTools
        // commands 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const commands =
          client.type === 'disabled' || client.type === 'failed'
            ? (rawCmds ?? [])
            : rawCmds
        // resources 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const resources =
          client.type === 'disabled' || client.type === 'failed'
            ? (rawRes ?? [])
            : rawRes

        // prefix读取`getMcpPrefix`，供MCP 服务后续处理使用。
        const prefix = getMcpPrefix(client.name)
        // existingClientIndex 索引筛选`clients.findIndex`，供MCP 服务后续处理使用。
        const existingClientIndex = mcp.clients.findIndex(
          // c更新为 `> c.name === client.name`，确保MCP 服务后续读取最新状态。
          c => c.name === client.name,
        )

        // updatedClients 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const updatedClients =
          existingClientIndex === -1
            ? [...mcp.clients, client]
            // 这个回调绑定到 : mcp.clients.map(c => (c.name === client.name ? client : c))，负责MCP 服务在该局部场景下的响应。
            : mcp.clients.map(c => (c.name === client.name ? client : c))

        // updatedTools 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const updatedTools =
          tools === undefined
            ? mcp.tools
            // 这个回调绑定到 : [...reject(mcp.tools, t => t.name?.startsWith(prefix)), ...tools]，负责MCP 服务在该局部场景下的响应。
            : [...reject(mcp.tools, t => t.name?.startsWith(prefix)), ...tools]

        // updatedCommands 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const updatedCommands =
          commands === undefined
            ? mcp.commands
            : [
                // 链式调用 链式方法，继续加工上一行在MCP 服务中产生的数据。
                ...reject(mcp.commands, c =>
                  commandBelongsToServer(c, client.name),
                ),
                ...commands,
              ]

        // updatedResources 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const updatedResources =
          resources === undefined
            ? mcp.resources
            : {
                ...mcp.resources,
                ...(resources.length > 0
                  ? { [client.name]: resources }
                  : omit(mcp.resources, client.name)),
              }

        // mcp更新为 `{`，确保MCP 服务后续读取最新状态。
        mcp = {
          ...mcp,
          clients: updatedClients,
          tools: updatedTools,
          commands: updatedCommands,
          resources: updatedResources,
        }
      }

      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return { ...prevState, mcp }
    })
  }, [setAppState])

  // Update server state, tools, commands, and resources.
  // When tools, commands, or resources are undefined, the existing values are preserved.
  // When type is 'disabled' or 'failed', tools/commands/resources are automatically cleared.
  // Updates are batched via setTimeout to coalesce updates arriving within MCP_BATCH_FLUSH_MS.
  // updateServer保存`useCallback`，供MCP 服务后续处理使用。
  const updateServer = useCallback(
    (update: PendingUpdate) => {
      // current追加新条目，保持收集顺序与输入顺序一致。
      pendingUpdatesRef.current.push(update)
      // 满足 `flushTimerRef.current === null` 时，MCP 服务执行该分支。
      if (flushTimerRef.current === null) {
        // current更新为 `setTimeout(`，确保MCP 服务后续读取最新状态。
        flushTimerRef.current = setTimeout(
          flushPendingUpdates,
          MCP_BATCH_FLUSH_MS,
        )
      }
    },
    [flushPendingUpdates],
  )

  // onConnectionAttempt保存`useCallback`，供MCP 服务后续处理使用。
  const onConnectionAttempt = useCallback(
    ({
      client,
      tools,
      commands,
      resources,
    }: {
      client: MCPServerConnection
      tools: Tool[]
      commands: Command[]
      resources?: ServerResource[]
    }) => {
      // 调用 updateServer，触发MCP 服务此处需要的副作用。
      updateServer({ ...client, tools, commands, resources })

      // Handle side effects based on client state
      // 按照 client.type 的取值选择MCP 服务的具体处理分支。
      switch (client.type) {
        case 'connected': {
          // Overwrite the default elicitation handler registered in connectToServer
          // with the real one (queues elicitation in AppState for UI). Registering
          // here (once per connect) instead of in a [mcpClients] effect avoids
          // re-running for every already-connected server on each state change.
          // 调用 registerElicitationHandler，触发MCP 服务此处需要的副作用。
          registerElicitationHandler(client.client, client.name, setAppState)

          // onclose更新为 `() => {`，确保MCP 服务后续读取最新状态。
          client.client.onclose = () => {
            // configType 配置保存`client.config.type ?? 'stdio'`，供MCP 服务MCP 服务 use Manage MCPConnec...后续判断或输出使用。
            const configType = client.config.type ?? 'stdio'

            // 清理相关缓存，确保MCP 服务下一次读取时重新加载最新数据。
            clearServerCache(client.name, client.config).catch(() => {
              // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `Failed to invalidate the server cache: ${client.name}`,
              )
            })

            // TODO: This really isn't great: ideally we'd check appstate as the source of truth
            // as to whether it was disconnected due to a disable, but appstate is stale at this
            // point. Getting a live reference to appstate feels a little hacky, so we'll just
            // check the disk state. We may want to refactor some of this.
            // 满足 `isMcpServerDisabled(client.name)` 时，MCP 服务执行该分支。
            if (isMcpServerDisabled(client.name)) {
              // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
              logMCPDebug(
                client.name,
                `Server is disabled, skipping automatic reconnection`,
              )
              // MCP 服务 use Manage MCPConnections在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // Handle automatic reconnection for remote transports
            // Skip stdio (local process) and sdk (internal) - they don't support reconnection
            // `configType` 与 `'stdio' && configType !== 'sdk'` 不一致时刷新派生状态，避免使用过期结果。
            if (configType !== 'stdio' && configType !== 'sdk') {
              // transportType读取`getTransportDisplayName`，供MCP 服务后续处理使用。
              const transportType = getTransportDisplayName(configType)
              // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
              logMCPDebug(
                client.name,
                `${transportType} transport closed/disconnected, attempting automatic reconnection`,
              )

              // Cancel any existing reconnection attempt for this server
              // existingTimer读取`current.get`，供MCP 服务后续处理使用。
              const existingTimer = reconnectTimersRef.current.get(client.name)
              // 满足 `existingTimer` 时，MCP 服务执行该分支。
              if (existingTimer) {
                // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
                clearTimeout(existingTimer)
                // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
                reconnectTimersRef.current.delete(client.name)
              }

              // Attempt reconnection with exponential backoff
              // reconnectWithBackoff保存`async`，供MCP 服务后续处理使用。
              const reconnectWithBackoff = async () => {
                // 调用 for，触发MCP 服务此处需要的副作用。
                for (
                  let attempt = 1;
                  attempt <= MAX_RECONNECT_ATTEMPTS;
                  attempt++
                ) {
                  // Check if server was disabled while we were waiting
                  // 满足 `isMcpServerDisabled(client.name)` 时，MCP 服务执行该分支。
                  if (isMcpServerDisabled(client.name)) {
                    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                    logMCPDebug(
                      client.name,
                      `Server disabled during reconnection, stopping retry`,
                    )
                    // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
                    reconnectTimersRef.current.delete(client.name)
                    // MCP 服务 use Manage MCPConnections在这里结束当前路径，避免继续执行不适用的后续分支。
                    return
                  }

                  // 调用 updateServer，触发MCP 服务此处需要的副作用。
                  updateServer({
                    ...client,
                    type: 'pending',
                    reconnectAttempt: attempt,
                    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
                  })

                  // reconnectStartTime记录时间`Date.now`，供MCP 服务后续处理使用。
                  const reconnectStartTime = Date.now()
                  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                  try {
                    // 结果保存`reconnectMcpServerImpl`，供MCP 服务后续处理使用。
                    const result = await reconnectMcpServerImpl(
                      client.name,
                      client.config,
                    )
                    // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
                    const elapsed = Date.now() - reconnectStartTime

                    // 当 `result.client.type` 匹配 `'connected'` 时，MCP 服务执行对应分支。
                    if (result.client.type === 'connected') {
                      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                      logMCPDebug(
                        client.name,
                        `${transportType} reconnection successful after ${elapsed}ms (attempt ${attempt})`,
                      )
                      // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
                      reconnectTimersRef.current.delete(client.name)
                      // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
                      onConnectionAttempt(result)
                      // MCP 服务 use Manage MCPConnections在这里结束当前路径，避免继续执行不适用的后续分支。
                      return
                    }

                    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                    logMCPDebug(
                      client.name,
                      `${transportType} reconnection attempt ${attempt} completed with status: ${result.client.type}`,
                    )

                    // On final attempt, update state with the result
                    // 满足 `attempt === MAX_RECONNECT_ATTEMPTS` 时，MCP 服务执行该分支。
                    if (attempt === MAX_RECONNECT_ATTEMPTS) {
                      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                      logMCPDebug(
                        client.name,
                        `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`,
                      )
                      // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
                      reconnectTimersRef.current.delete(client.name)
                      // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
                      onConnectionAttempt(result)
                      // MCP 服务 use Manage MCPConnections在这里结束当前路径，避免继续执行不适用的后续分支。
                      return
                    }
                  } catch (error) {
                    // elapsed记录时间`Date.now`，供MCP 服务后续处理使用。
                    const elapsed = Date.now() - reconnectStartTime
                    // 调用 logMCPError，触发MCP 服务此处需要的副作用。
                    logMCPError(
                      client.name,
                      `${transportType} reconnection attempt ${attempt} failed after ${elapsed}ms: ${error}`,
                    )

                    // On final attempt, mark as failed
                    // 满足 `attempt === MAX_RECONNECT_ATTEMPTS` 时，MCP 服务执行该分支。
                    if (attempt === MAX_RECONNECT_ATTEMPTS) {
                      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                      logMCPDebug(
                        client.name,
                        `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`,
                      )
                      // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
                      reconnectTimersRef.current.delete(client.name)
                      // 调用 updateServer，触发MCP 服务此处需要的副作用。
                      updateServer({ ...client, type: 'failed' })
                      // MCP 服务 use Manage MCPConnections在这里结束当前路径，避免继续执行不适用的后续分支。
                      return
                    }
                  }

                  // Schedule next retry with exponential backoff
                  // backoffMs 集合保存`Math.min`，供MCP 服务后续处理使用。
                  const backoffMs = Math.min(
                    INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1),
                    MAX_BACKOFF_MS,
                  )
                  // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                  logMCPDebug(
                    client.name,
                    `Scheduling reconnection attempt ${attempt + 1} in ${backoffMs}ms`,
                  )

                  // 这个回调绑定到 await new Promise<void>(resolve => {，负责MCP 服务在该局部场景下的响应。
                  await new Promise<void>(resolve => {
                    // eslint-disable-next-line no-restricted-syntax -- timer stored in ref for cancellation; sleep() doesn't expose the handle
                    // timer保存`setTimeout`，供MCP 服务后续处理使用。
                    const timer = setTimeout(resolve, backoffMs)
                    // reconnectTimersRef.current.set 写入新的状态值，使MCP 服务后续读取保持一致。
                    reconnectTimersRef.current.set(client.name, timer)
                  })
                }
              }

              // 显式忽略 `reconnectWithBackoff()` 的返回值，只保留它触发的副作用。
              void reconnectWithBackoff()
            } else {
              // 调用 updateServer，触发MCP 服务此处需要的副作用。
              updateServer({ ...client, type: 'failed' })
            }
          }

          // Channel push: notifications/claude/channel → enqueue().
          // Gate decides whether to register the handler; connection stays
          // up either way (allowedMcpServers controls that).
          // 组合条件 `feature('KAIROS') || feature('KAIROS_CHANNELS')` 成立时，MCP 服务才启用这条专门路径。
          if (feature('KAIROS') || feature('KAIROS_CHANNELS')) {
            // gate保存`gateChannelServer`，供MCP 服务后续处理使用。
            const gate = gateChannelServer(
              client.name,
              client.capabilities,
              client.config.pluginSource,
            )
            // entry筛选`findChannelEntry`，供MCP 服务后续处理使用。
            const entry = findChannelEntry(client.name, getAllowedChannels())
            // Plugin identifier for telemetry — log name@marketplace for any
            // plugin-kind entry (same tier as tengu_plugin_installed, which
            // logs arbitrary plugin_id+marketplace_name ungated). server-kind
            // names are MCP-server-name tier; those are opt-in-only elsewhere
            // (see isAnalyticsToolDetailsLoggingEnabled in metadata.ts) and
            // stay unlogged here. is_dev/entry_kind segment the rest.
            // pluginId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const pluginId =
              entry?.kind === 'plugin'
                ? (`${entry.name}@${entry.marketplace}` as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
                : undefined
            // Skip capability-miss — every non-channel MCP server trips it.
            // `gate.action === 'register' || gate.kind` 与 `'capa` 不一致时刷新派生状态，避免使用过期结果。
            if (gate.action === 'register' || gate.kind !== 'capability') {
              // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_mcp_channel_gate', {
                registered: gate.action === 'register',
                skip_kind:
                  gate.action === 'skip'
                    ? (gate.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
                    : undefined,
                entry_kind:
                  entry?.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                is_dev: entry?.dev ?? false,
                plugin: pluginId,
              })
            }
            // 按照 gate.action 的取值选择MCP 服务的具体处理分支。
            switch (gate.action) {
              case 'register':
                // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                logMCPDebug(client.name, 'Channel notifications registered')
                // client.client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
                client.client.setNotificationHandler(
                  ChannelMessageNotificationSchema(),
                  // 这个回调绑定到 async notification => {，负责MCP 服务在该局部场景下的响应。
                  async notification => {
                    // 从 `notification.params` 解构 content、meta，减少MCP 服务 use Manage MCPConnections对同一对象的重复访问。
                    const { content, meta } = notification.params
                    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                    logMCPDebug(
                      client.name,
                      `notifications/claude/channel: ${content.slice(0, 80)}`,
                    )
                    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_mcp_channel_message', {
                      content_length: content.length,
                      meta_key_count: Object.keys(meta ?? {}).length,
                      entry_kind:
                        entry?.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      is_dev: entry?.dev ?? false,
                      plugin: pluginId,
                    })
                    // 调用 enqueue，触发MCP 服务此处需要的副作用。
                    enqueue({
                      mode: 'prompt',
                      value: wrapChannelMessage(client.name, content, meta),
                      priority: 'next',
                      isMeta: true,
                      origin: { kind: 'channel', server: client.name },
                      skipSlashCommands: true,
                    })
                  },
                )
                // Permission-reply handler — separate event, separate
                // capability. Only registers if the server declares
                // claude/channel/permission (same opt-in check as the send
                // path in interactiveHandler.ts). Server parses the user's
                // reply and emits {request_id, behavior}; no regex on our
                // side, text in the general channel can't accidentally match.
                // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
                if (
                  client.capabilities?.experimental?.[
                    'claude/channel/permission'
                  ] !== undefined
                ) {
                  // client.client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
                  client.client.setNotificationHandler(
                    ChannelPermissionNotificationSchema(),
                    // 这个回调绑定到 async notification => {，负责MCP 服务在该局部场景下的响应。
                    async notification => {
                      // 从 `notification.params` 解构 request_id、behavior，减少MCP 服务 use Manage MCPConnections对同一对象的重复访问。
                      const { request_id, behavior } = notification.params
                      // resolved 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
                      const resolved =
                        channelPermCallbacksRef.current?.resolve(
                          request_id,
                          behavior,
                          client.name,
                        ) ?? false
                      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                      logMCPDebug(
                        client.name,
                        `notifications/claude/channel/permission: ${request_id} → ${behavior} (${resolved ? 'matched pending' : 'no pending entry — stale or unknown ID'})`,
                      )
                    },
                  )
                }
                // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
                break
              case 'skip':
                // Idempotent teardown so a register→skip re-gate (e.g.
                // effect re-runs after /logout) actually removes the live
                // handler. Without this, mid-session demotion is one-way:
                // the gate says skip but the earlier handler keeps enqueuing.
                // Map.delete — safe when never registered.
                // 调用 client.client.removeNotificationHandler，触发MCP 服务此处需要的副作用。
                client.client.removeNotificationHandler(
                  'notifications/claude/channel',
                )
                // 调用 client.client.removeNotificationHandler，触发MCP 服务此处需要的副作用。
                client.client.removeNotificationHandler(
                  CHANNEL_PERMISSION_METHOD,
                )
                // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                logMCPDebug(
                  client.name,
                  `Channel notifications skipped: ${gate.reason}`,
                )
                // Surface a once-per-kind toast when a channel server is
                // blocked. This is the only
                // user-visible signal (logMCPDebug above requires --debug).
                // Capability/session skips are expected noise and stay
                // debug-only. marketplace/allowlist run after session — if
                // we're here with those kinds, the user asked for it.
                // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
                if (
                  gate.kind !== 'capability' &&
                  gate.kind !== 'session' &&
                  !channelWarnedKindsRef.current.has(gate.kind) &&
                  (gate.kind === 'marketplace' ||
                    gate.kind === 'allowlist' ||
                    entry !== undefined)
                ) {
                  // 调用 channelWarnedKindsRef.current.add，触发MCP 服务此处需要的副作用。
                  channelWarnedKindsRef.current.add(gate.kind)
                  // disabled/auth/policy get custom toast copy (shorter, actionable);
                  // marketplace/allowlist reuse the gate's reason verbatim
                  // since it already names the mismatch.
                  // text 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
                  const text =
                    gate.kind === 'disabled'
                      ? 'Channels are not currently available'
                      : gate.kind === 'auth'
                        ? 'Channels require claude.ai authentication · run /login'
                        : gate.kind === 'policy'
                          ? 'Channels are not enabled for your org · have an administrator set channelsEnabled: true in managed settings'
                          : gate.reason
                  // 调用 addNotification，触发MCP 服务此处需要的副作用。
                  addNotification({
                    key: `channels-blocked-${gate.kind}`,
                    priority: 'high',
                    text,
                    color: 'warning',
                    timeoutMs: 12000,
                  })
                }
                // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
                break
            }
          }

          // Register notification handlers for list_changed notifications
          // These allow the server to notify us when tools, prompts, or resources change
          // 满足 `client.capabilities?.tools?.listChanged` 时，MCP 服务执行该分支。
          if (client.capabilities?.tools?.listChanged) {
            // client.client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
            client.client.setNotificationHandler(
              ToolListChangedNotificationSchema,
              // 调用 async，触发MCP 服务此处需要的副作用。
              async () => {
                // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                logMCPDebug(
                  client.name,
                  `Received tools/list_changed notification, refreshing tools`,
                )
                // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                try {
                  // Grab cached promise before invalidating to log previous count
                  // previousToolsPromise 异步任务保存 `cache.get` 启动的异步任务，稍后再决定等待还是后台完成。
                  const previousToolsPromise = fetchToolsForClient.cache.get(
                    client.name,
                  )
                  // 调用 fetchToolsForClient.cache.delete，触发MCP 服务此处需要的副作用。
                  fetchToolsForClient.cache.delete(client.name)
                  // newTools 集合读取`fetchToolsForClient`，供MCP 服务后续处理使用。
                  const newTools = await fetchToolsForClient(client)
                  // newCount 数量 命名 `newTools.length`，让后续代码直接表达这个值的用途。
                  const newCount = newTools.length
                  // 满足 `previousToolsPromise` 时，MCP 服务执行该分支。
                  if (previousToolsPromise) {
                    // 调用 previousToolsPromise.then，触发MCP 服务此处需要的副作用。
                    previousToolsPromise.then(
                      // 这个回调绑定到 (previousTools: Tool[]) => {，负责MCP 服务在该局部场景下的响应。
                      (previousTools: Tool[]) => {
                        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                        logEvent('tengu_mcp_list_changed', {
                          type: 'tools' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                          previousCount: previousTools.length,
                          newCount,
                        })
                      },
                      // 这个回调绑定到 () => {，负责MCP 服务在该局部场景下的响应。
                      () => {
                        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                        logEvent('tengu_mcp_list_changed', {
                          type: 'tools' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                          newCount,
                        })
                      },
                    )
                  } else {
                    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_mcp_list_changed', {
                      type: 'tools' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      newCount,
                    })
                  }
                  // 调用 updateServer，触发MCP 服务此处需要的副作用。
                  updateServer({ ...client, tools: newTools })
                } catch (error) {
                  // 调用 logMCPError，触发MCP 服务此处需要的副作用。
                  logMCPError(
                    client.name,
                    `Failed to refresh tools after list_changed notification: ${errorMessage(error)}`,
                  )
                }
              },
            )
          }

          // 满足 `client.capabilities?.prompts?.listChanged` 时，MCP 服务执行该分支。
          if (client.capabilities?.prompts?.listChanged) {
            // client.client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
            client.client.setNotificationHandler(
              PromptListChangedNotificationSchema,
              // 调用 async，触发MCP 服务此处需要的副作用。
              async () => {
                // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                logMCPDebug(
                  client.name,
                  `Received prompts/list_changed notification, refreshing prompts`,
                )
                // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                logEvent('tengu_mcp_list_changed', {
                  type: 'prompts' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                })
                // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                try {
                  // Skills come from resources, not prompts — don't invalidate their
                  // cache here. fetchMcpSkillsForClient returns the cached result.
                  // 调用 fetchCommandsForClient.cache.delete，触发MCP 服务此处需要的副作用。
                  fetchCommandsForClient.cache.delete(client.name)
                  // 并行获取 mcpPrompts、mcpSkills，缩短MCP 服务 use Manage MCPConnections等待多个独立异步任务的时间。
                  const [mcpPrompts, mcpSkills] = await Promise.all([
                    fetchCommandsForClient(client),
                    feature('MCP_SKILLS')
                      ? fetchMcpSkillsForClient!(client)
                      : Promise.resolve([]),
                  ])
                  // 调用 updateServer，触发MCP 服务此处需要的副作用。
                  updateServer({
                    ...client,
                    commands: [...mcpPrompts, ...mcpSkills],
                  })
                  // MCP skills changed — invalidate skill-search index so
                  // next discovery rebuilds with the new set.
                  // 调用 clearSkillIndexCache?.()，完成这一处局部操作。
                  clearSkillIndexCache?.()
                } catch (error) {
                  // 调用 logMCPError，触发MCP 服务此处需要的副作用。
                  logMCPError(
                    client.name,
                    `Failed to refresh prompts after list_changed notification: ${errorMessage(error)}`,
                  )
                }
              },
            )
          }

          // 满足 `client.capabilities?.resources?.listChanged` 时，MCP 服务执行该分支。
          if (client.capabilities?.resources?.listChanged) {
            // client.client.setNotificationHandler 写入新的状态值，使MCP 服务后续读取保持一致。
            client.client.setNotificationHandler(
              ResourceListChangedNotificationSchema,
              // 调用 async，触发MCP 服务此处需要的副作用。
              async () => {
                // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
                logMCPDebug(
                  client.name,
                  `Received resources/list_changed notification, refreshing resources`,
                )
                // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
                logEvent('tengu_mcp_list_changed', {
                  type: 'resources' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                })
                // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
                try {
                  // 调用 fetchResourcesForClient.cache.delete，触发MCP 服务此处需要的副作用。
                  fetchResourcesForClient.cache.delete(client.name)
                  // 满足 `feature('MCP_SKILLS')` 时，MCP 服务执行该分支。
                  if (feature('MCP_SKILLS')) {
                    // Skills are discovered from resources, so refresh them too.
                    // Invalidate prompts cache as well: we write commands here,
                    // and a concurrent prompts/list_changed could otherwise have
                    // us stomp its fresh result with our cached stale one.
                    // MCP 服务 use Manage MCPConnections在这里处理 `fetchMcpSkillsForClient!.cache.delete(client.name)`，完成这一小步状态转换。
                    fetchMcpSkillsForClient!.cache.delete(client.name)
                    // 调用 fetchCommandsForClient.cache.delete，触发MCP 服务此处需要的副作用。
                    fetchCommandsForClient.cache.delete(client.name)
                    // MCP 服务 use Manage MCPConnections先整理这一处局部数据，后续分支可以直接读取。
                    const [newResources, mcpPrompts, mcpSkills] =
                      await Promise.all([
                        fetchResourcesForClient(client),
                        fetchCommandsForClient(client),
                        fetchMcpSkillsForClient!(client),
                      ])
                    // 调用 updateServer，触发MCP 服务此处需要的副作用。
                    updateServer({
                      ...client,
                      resources: newResources,
                      commands: [...mcpPrompts, ...mcpSkills],
                    })
                    // MCP skills changed — invalidate skill-search index so
                    // next discovery rebuilds with the new set.
                    // 调用 clearSkillIndexCache?.()，完成这一处局部操作。
                    clearSkillIndexCache?.()
                  } else {
                    // newResources 集合读取`fetchResourcesForClient`，供MCP 服务后续处理使用。
                    const newResources = await fetchResourcesForClient(client)
                    // 调用 updateServer，触发MCP 服务此处需要的副作用。
                    updateServer({ ...client, resources: newResources })
                  }
                } catch (error) {
                  // 调用 logMCPError，触发MCP 服务此处需要的副作用。
                  logMCPError(
                    client.name,
                    `Failed to refresh resources after list_changed notification: ${errorMessage(error)}`,
                  )
                }
              },
            )
          }
          // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
          break
        }

        case 'needs-auth':
        case 'failed':
        case 'pending':
        case 'disabled':
          // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
          break
      }
    },
    [updateServer],
  )

  // Initialize all servers to pending state if they don't exist in appState.
  // Re-runs on session change (/clear) and on /reload-plugins (pluginReconnectKey).
  // On plugin reload, also disconnects stale plugin MCP servers (scope 'dynamic')
  // that no longer appear in configs — prevents ghost tools from disabled plugins.
  // Skip claude.ai dedup here to avoid blocking on the network fetch; the connect
  // useEffect below runs immediately after and dedups before connecting.
  // sessionId 会话数据读取`getSessionId`，供MCP 服务后续处理使用。
  const sessionId = getSessionId()
  // 调用 useEffect，触发MCP 服务此处需要的副作用。
  useEffect(() => {
    // initializeServersAsPending 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function initializeServersAsPending() {
      // 从 `isStrictMcpConfig` 解构 servers、errors，减少MCP 服务 use Manage MCPConnections对同一对象的重复访问。
      const { servers: existingConfigs, errors: mcpErrors } = isStrictMcpConfig
        ? { servers: {}, errors: [] }
        : await getClaudeCodeMcpConfigs(dynamicMcpConfig)
      // configs 配置集中保存MCP 服务MCP 服务 use Manage MCPConnec...要一起传递的字段。
      const configs = { ...existingConfigs, ...dynamicMcpConfig }

      // Add MCP errors to plugin errors for UI visibility (deduplicated)
      // 调用 addErrorsToAppState，触发MCP 服务此处需要的副作用。
      addErrorsToAppState(setAppState, mcpErrors)

      // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
      setAppState(prevState => {
        // Disconnect MCP servers that are stale: plugin servers removed from
        // config, or any server whose config hash changed (edited .mcp.json).
        // Stale servers get re-added as 'pending' below since their name is
        // now absent from mcpWithoutStale.clients.
        // 从 `excludeStalePluginClients(` 解构 stale、其余 mcpWithoutStale，减少MCP 服务 use Manage MCPConnections对同一对象的重复访问。
        const { stale, ...mcpWithoutStale } = excludeStalePluginClients(
          prevState.mcp,
          configs,
        )
        // Clean up stale connections. Fire-and-forget — state updaters must
        // be synchronous. Three hazards to defuse before calling cleanup:
        //   1. Pending reconnect timer would fire with the OLD config.
        //   2. onclose (set at L254) starts reconnectWithBackoff with the
        //      OLD config from its closure — it checks isMcpServerDisabled
        //      but config-changed servers aren't disabled, so it'd race the
        //      fresh connection and last updateServer wins.
        //   3. clearServerCache internally calls connectToServer (memoized).
        //      For never-connected servers (disabled/pending/failed) the
        //      cache is empty → real connect attempt → spawn/OAuth just to
        //      immediately kill it. Only connected servers need cleanup.
        // 按顺序遍历 `stale` 中的s 集合，逐个交给MCP 服务处理。
        for (const s of stale) {
          // timer读取`current.get`，供MCP 服务后续处理使用。
          const timer = reconnectTimersRef.current.get(s.name)
          // 满足 `timer` 时，MCP 服务执行该分支。
          if (timer) {
            // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
            clearTimeout(timer)
            // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
            reconnectTimersRef.current.delete(s.name)
          }
          // 当 `s.type` 匹配 `'connected'` 时，MCP 服务执行对应分支。
          if (s.type === 'connected') {
            // onclose更新为 `undefined`，确保MCP 服务后续读取最新状态。
            s.client.onclose = undefined
            // 这个回调绑定到 void clearServerCache(s.name, s.config).catch(() => {})，负责MCP 服务在该局部场景下的响应。
            void clearServerCache(s.name, s.config).catch(() => {})
          }
        }

        // existingServerNames 集合保存`Set`，供MCP 服务后续处理使用。
        const existingServerNames = new Set(
          // 调用 mcpWithoutStale.clients.map，触发MCP 服务此处需要的副作用。
          mcpWithoutStale.clients.map(c => c.name),
        )
        // newClients 集合派生`Object.entries`，供MCP 服务后续处理使用。
        const newClients = Object.entries(configs)
          // 链式调用 filter，继续加工上一行在MCP 服务中产生的数据。
          .filter(([name]) => !existingServerNames.has(name))
          // 链式调用 map，继续加工上一行在MCP 服务中产生的数据。
          .map(([name, config]) => ({
            name,
            type: isMcpServerDisabled(name)
              ? ('disabled' as const)
              : ('pending' as const),
            config,
          }))

        // newClients.length === 0 && stale 数量为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
        if (newClients.length === 0 && stale.length === 0) {
          // 返回 `prevState`，作为MCP 服务这次计算的结果。
          return prevState
        }

        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {
          ...prevState,
          mcp: {
            ...prevState.mcp,
            ...mcpWithoutStale,
            clients: [...mcpWithoutStale.clients, ...newClients],
          },
        }
      })
    }

    // 这个回调绑定到 void initializeServersAsPending().catch(error => {，负责MCP 服务在该局部场景下的响应。
    void initializeServersAsPending().catch(error => {
      // 调用 logMCPError，触发MCP 服务此处需要的副作用。
      logMCPError(
        'useManageMCPConnections',
        `Failed to initialize servers as pending: ${errorMessage(error)}`,
      )
    })
  }, [
    isStrictMcpConfig,
    dynamicMcpConfig,
    setAppState,
    sessionId,
    _pluginReconnectKey,
  ])

  // Load MCP configs and connect to servers
  // Two-phase loading: Claude Code configs first (fast), then claude.ai configs (may be slow)
  // 调用 useEffect，触发MCP 服务此处需要的副作用。
  useEffect(() => {
    // cancelled标记MCP 服务MCP 服务 use Manage MCPConnec...是否启用对应路径。
    let cancelled = false

    // loadAndConnectMcpConfigs 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    async function loadAndConnectMcpConfigs() {
      // Clear claude.ai MCP cache so we fetch fresh configs with current auth
      // state. This is important when authVersion changes (e.g., after login/
      // logout). Kick off the fetch now so it overlaps with loadAllPlugins()
      // inside getClaudeCodeMcpConfigs; it's awaited only at the dedup step.
      // Phase 2 below awaits the same promise — no second network call.
      // claudeaiPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
      let claudeaiPromise: Promise<Record<string, ScopedMcpServerConfig>>
      // 组合条件 `isStrictMcpConfig || doesEnterpriseMcpConfigExist()` 成立时，MCP 服务才启用这条专门路径。
      if (isStrictMcpConfig || doesEnterpriseMcpConfigExist()) {
        // claudeaiPromise 异步任务更新为 `Promise.resolve({})`，确保MCP 服务后续读取最新状态。
        claudeaiPromise = Promise.resolve({})
      } else {
        // 清理相关缓存，确保MCP 服务下一次读取时重新加载最新数据。
        clearClaudeAIMcpConfigsCache()
        // claudeaiPromise 异步任务更新为 `fetchClaudeAIMcpConfigsIfEligible()`，确保MCP 服务后续读取最新状态。
        claudeaiPromise = fetchClaudeAIMcpConfigsIfEligible()
      }

      // Phase 1: Load Claude Code configs. Plugin MCP servers that duplicate a
      // --mcp-config entry or a claude.ai connector are suppressed here so they
      // don't connect alongside the connector in Phase 2.
      // MCP 服务 use Manage MCPConnections先整理这一处局部数据，后续分支可以直接读取。
      const { servers: claudeCodeConfigs, errors: mcpErrors } =
        isStrictMcpConfig
          ? { servers: {}, errors: [] }
          : await getClaudeCodeMcpConfigs(dynamicMcpConfig, claudeaiPromise)
      // 满足 `cancelled` 时，MCP 服务执行该分支。
      if (cancelled) return

      // Add MCP errors to plugin errors for UI visibility (deduplicated)
      // 调用 addErrorsToAppState，触发MCP 服务此处需要的副作用。
      addErrorsToAppState(setAppState, mcpErrors)

      // configs 配置集中保存MCP 服务MCP 服务 use Manage MCPConnec...要一起传递的字段。
      const configs = { ...claudeCodeConfigs, ...dynamicMcpConfig }

      // Start connecting to Claude Code servers (don't wait - runs concurrently with Phase 2)
      // Filter out disabled servers to avoid unnecessary connection attempts
      // enabledConfigs 配置保存`Object.fromEntries`，供MCP 服务后续处理使用。
      const enabledConfigs = Object.fromEntries(
        // 调用 Object.entries，触发MCP 服务此处需要的副作用。
        Object.entries(configs).filter(([name]) => !isMcpServerDisabled(name)),
      )
      // 调用 getMcpToolsCommandsAndResources，触发MCP 服务此处需要的副作用。
      getMcpToolsCommandsAndResources(
        onConnectionAttempt,
        enabledConfigs,
      // 这个回调绑定到 ).catch(error => {，负责MCP 服务在该局部场景下的响应。
      ).catch(error => {
        // 调用 logMCPError，触发MCP 服务此处需要的副作用。
        logMCPError(
          'useManageMcpConnections',
          `Failed to get MCP resources: ${errorMessage(error)}`,
        )
      })

      // Phase 2: Await claude.ai configs (started above; memoized — no second fetch)
      // claudeaiConfigs 配置 从空对象开始收集键值，后续按名称补齐内容。
      let claudeaiConfigs: Record<string, ScopedMcpServerConfig> = {}
      // isStrictMcpConfig 配置缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!isStrictMcpConfig) {
        // claudeaiConfigs 配置更新为 `filterMcpServersByPolicy(`，确保MCP 服务后续读取最新状态。
        claudeaiConfigs = filterMcpServersByPolicy(
          await claudeaiPromise,
        ).allowed
        // 满足 `cancelled` 时，MCP 服务执行该分支。
        if (cancelled) return

        // Suppress claude.ai connectors that duplicate an enabled manual server.
        // Keys never collide (`slack` vs `claude.ai Slack`) so the merge below
        // won't catch this — need content-based dedup by URL signature.
        // 满足 `Object.keys(claudeaiConfigs).length > 0` 时，MCP 服务执行该分支。
        if (Object.keys(claudeaiConfigs).length > 0) {
          // 从 `dedupClaudeAiMcpServers(` 解构 servers，减少MCP 服务 use Manage MCPConnections对同一对象的重复访问。
          const { servers: dedupedClaudeAi } = dedupClaudeAiMcpServers(
            claudeaiConfigs,
            configs,
          )
          // claudeaiConfigs 配置更新为 `dedupedClaudeAi`，确保MCP 服务后续读取最新状态。
          claudeaiConfigs = dedupedClaudeAi
        }

        // 满足 `Object.keys(claudeaiConfigs).length > 0` 时，MCP 服务执行该分支。
        if (Object.keys(claudeaiConfigs).length > 0) {
          // Add claude.ai servers as pending immediately so they show up in UI
          // setAppState 写入新的状态值，使MCP 服务后续读取保持一致。
          setAppState(prevState => {
            // existingServerNames 集合保存`Set`，供MCP 服务后续处理使用。
            const existingServerNames = new Set(
              // 调用 prevState.mcp.clients.map，触发MCP 服务此处需要的副作用。
              prevState.mcp.clients.map(c => c.name),
            )
            // newClients 集合派生`Object.entries`，供MCP 服务后续处理使用。
            const newClients = Object.entries(claudeaiConfigs)
              // 链式调用 filter，继续加工上一行在MCP 服务中产生的数据。
              .filter(([name]) => !existingServerNames.has(name))
              // 链式调用 map，继续加工上一行在MCP 服务中产生的数据。
              .map(([name, config]) => ({
                name,
                type: isMcpServerDisabled(name)
                  ? ('disabled' as const)
                  : ('pending' as const),
                config,
              }))
            // newClients 集合为空时立即返回或跳过，避免MCP 服务把空集合当成可处理内容。
            if (newClients.length === 0) return prevState
            // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
            return {
              ...prevState,
              mcp: {
                ...prevState.mcp,
                clients: [...prevState.mcp.clients, ...newClients],
              },
            }
          })

          // Now start connecting (only enabled servers)
          // enabledClaudeaiConfigs 配置保存`Object.fromEntries`，供MCP 服务后续处理使用。
          const enabledClaudeaiConfigs = Object.fromEntries(
            Object.entries(claudeaiConfigs).filter(
              // 这个回调绑定到 ([name]) => !isMcpServerDisabled(name),，负责MCP 服务在该局部场景下的响应。
              ([name]) => !isMcpServerDisabled(name),
            ),
          )
          // 调用 getMcpToolsCommandsAndResources，触发MCP 服务此处需要的副作用。
          getMcpToolsCommandsAndResources(
            onConnectionAttempt,
            enabledClaudeaiConfigs,
          // 这个回调绑定到 ).catch(error => {，负责MCP 服务在该局部场景下的响应。
          ).catch(error => {
            // 调用 logMCPError，触发MCP 服务此处需要的副作用。
            logMCPError(
              'useManageMcpConnections',
              `Failed to get claude.ai MCP resources: ${errorMessage(error)}`,
            )
          })
        }
      }

      // Log server counts after both phases complete
      // allConfigs 配置集中保存MCP 服务MCP 服务 use Manage MCPConnec...要一起传递的字段。
      const allConfigs = { ...configs, ...claudeaiConfigs }
      // counts 数量集中保存MCP 服务MCP 服务 use Manage MCPConnec...要一起传递的字段。
      const counts = {
        enterprise: 0,
        global: 0,
        project: 0,
        user: 0,
        plugin: 0,
        claudeai: 0,
      }
      // Ant-only: collect stdio command basenames to correlate with RSS/FPS
      // metrics. Stdio servers like rust-analyzer can be heavy and we want to
      // know which ones correlate with poor session performance.
      // stdioCommands 命令数据 从空数组开始收集，后续循环会按处理顺序追加条目。
      const stdioCommands: string[] = []
      // 循环处理 `const [name, serverConfig] of Object.entries(allConfigs)`，让MCP 服务把同类条目按顺序走完。
      for (const [name, serverConfig] of Object.entries(allConfigs)) {
        // 当 `serverConfig.scope` 匹配 `'enterprise'` 时，MCP 服务执行对应分支。
        if (serverConfig.scope === 'enterprise') counts.enterprise++
        else if (serverConfig.scope === 'user') counts.global++
        else if (serverConfig.scope === 'project') counts.project++
        else if (serverConfig.scope === 'local') counts.user++
        else if (serverConfig.scope === 'dynamic') counts.plugin++
        else if (serverConfig.scope === 'claudeai') counts.claudeai++

        // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
        if (
          process.env.USER_TYPE === 'ant' &&
          !isMcpServerDisabled(name) &&
          (serverConfig.type === undefined || serverConfig.type === 'stdio') &&
          'command' in serverConfig
        ) {
          // stdioCommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
          stdioCommands.push(basename(serverConfig.command))
        }
      }
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_servers', {
        ...counts,
        ...(process.env.USER_TYPE === 'ant' && stdioCommands.length > 0
          ? {
              stdio_commands: stdioCommands
                .sort()
                .join(
                  ',',
                ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            }
          : {}),
      })
    }

    // 显式忽略 `loadAndConnectMcpConfigs()` 的返回值，只保留它触发的副作用。
    void loadAndConnectMcpConfigs()

    // 返回 `() => {`，作为MCP 服务这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保MCP 服务后续读取最新状态。
      cancelled = true
    }
  }, [
    isStrictMcpConfig,
    dynamicMcpConfig,
    onConnectionAttempt,
    setAppState,
    _authVersion,
    sessionId,
    _pluginReconnectKey,
  ])

  // Cleanup all timers on unmount
  // 调用 useEffect，触发MCP 服务此处需要的副作用。
  useEffect(() => {
    // timers 集合保存`reconnectTimersRef.current`，供后续判断或组装使用。
    const timers = reconnectTimersRef.current
    // 返回 `() => {`，作为MCP 服务这次计算的结果。
    return () => {
      // 逐项读取 `timers.values()` 中的timer，按输入顺序推进MCP 服务。
      for (const timer of timers.values()) {
        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
        clearTimeout(timer)
      }
      // 调用 timers.clear，触发MCP 服务此处需要的副作用。
      timers.clear()
      // Flush any pending batched MCP updates before unmount
      // `flushTimerRef.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (flushTimerRef.current !== null) {
        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
        clearTimeout(flushTimerRef.current)
        // current更新为 `null`，确保MCP 服务后续读取最新状态。
        flushTimerRef.current = null
        // 调用 flushPendingUpdates，触发MCP 服务此处需要的副作用。
        flushPendingUpdates()
      }
    }
  }, [flushPendingUpdates])

  // Expose reconnectMcpServer function for components to use.
  // Reads mcp.clients via store.getState() so this callback stays stable
  // across client state transitions (no need to re-create on every connect).
  // reconnectMcpServer保存`useCallback`，供MCP 服务后续处理使用。
  const reconnectMcpServer = useCallback(
    async (serverName: string) => {
      // API 客户端保存`store`，供后续判断或组装使用。
      const client = store
        .getState()
        .mcp.clients.find(c => c.name === serverName)
      // API 客户端缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!client) {
        // 抛出 new Error(`MCP server ${serverName} not found`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`MCP server ${serverName} not found`)
      }

      // Cancel any pending automatic reconnection attempt
      // existingTimer读取`current.get`，供MCP 服务后续处理使用。
      const existingTimer = reconnectTimersRef.current.get(serverName)
      // 满足 `existingTimer` 时，MCP 服务执行该分支。
      if (existingTimer) {
        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
        clearTimeout(existingTimer)
        // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
        reconnectTimersRef.current.delete(serverName)
      }

      // 结果保存`reconnectMcpServerImpl`，供MCP 服务后续处理使用。
      const result = await reconnectMcpServerImpl(serverName, client.config)

      // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
      onConnectionAttempt(result)

      // Don't throw, just let UI handle the client type in case the reconnect failed
      // (Detailed logs are within the reconnectMcpServerImpl via --debug)
      // 返回 `result`，作为MCP 服务这次计算的结果。
      return result
    },
    [store, onConnectionAttempt],
  )

  // Expose function to toggle server enabled/disabled state
  // toggleMcpServer保存`useCallback`，供MCP 服务后续处理使用。
  const toggleMcpServer = useCallback(
    async (serverName: string): Promise<void> => {
      // API 客户端保存`store`，供后续判断或组装使用。
      const client = store
        .getState()
        .mcp.clients.find(c => c.name === serverName)
      // API 客户端缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!client) {
        // 抛出 new Error(`MCP server ${serverName} not found`)，阻止MCP 服务在无效状态下继续运行。
        throw new Error(`MCP server ${serverName} not found`)
      }

      // isCurrentlyDisabled标记MCP 服务MCP 服务 use Manage MCPConnec...是否启用对应路径。
      const isCurrentlyDisabled = client.type === 'disabled'

      // isCurrentlyDisabled缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!isCurrentlyDisabled) {
        // Cancel any pending automatic reconnection attempt
        // existingTimer读取`current.get`，供MCP 服务后续处理使用。
        const existingTimer = reconnectTimersRef.current.get(serverName)
        // 满足 `existingTimer` 时，MCP 服务执行该分支。
        if (existingTimer) {
          // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
          clearTimeout(existingTimer)
          // 调用 reconnectTimersRef.current.delete，触发MCP 服务此处需要的副作用。
          reconnectTimersRef.current.delete(serverName)
        }

        // Persist disabled state to disk FIRST before clearing cache
        // This is important because the onclose handler checks disk state
        // setMcpServerEnabled 写入新的状态值，使MCP 服务后续读取保持一致。
        setMcpServerEnabled(serverName, false)

        // Disabling: disconnect and clean up if currently connected
        // 当 `client.type` 匹配 `'connected'` 时，MCP 服务执行对应分支。
        if (client.type === 'connected') {
          // 等待 `clearServerCache(serverName, client.config)` 完成，再继续MCP 服务 use Manage MCPConnections的异步流程。
          await clearServerCache(serverName, client.config)
        }

        // Update to disabled state (tools/commands/resources auto-cleared)
        // 调用 updateServer，触发MCP 服务此处需要的副作用。
        updateServer({
          name: serverName,
          type: 'disabled',
          config: client.config,
        })
      } else {
        // Enabling: persist enabled state to disk first
        // setMcpServerEnabled 写入新的状态值，使MCP 服务后续读取保持一致。
        setMcpServerEnabled(serverName, true)

        // Mark as pending and reconnect
        // 调用 updateServer，触发MCP 服务此处需要的副作用。
        updateServer({
          name: serverName,
          type: 'pending',
          config: client.config,
        })

        // Reconnect the server
        // 结果保存`reconnectMcpServerImpl`，供MCP 服务后续处理使用。
        const result = await reconnectMcpServerImpl(serverName, client.config)

        // 调用 onConnectionAttempt，触发MCP 服务此处需要的副作用。
        onConnectionAttempt(result)
      }
    },
    [store, updateServer, onConnectionAttempt],
  )

  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { reconnectMcpServer, toggleMcpServer }
}

// getTransportDisplayName 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTransportDisplayName(type: string): string {
  // 按照 type 的取值选择MCP 服务的具体处理分支。
  switch (type) {
    case 'http':
      // 返回 `'HTTP'`，作为MCP 服务这次计算的结果。
      return 'HTTP'
    case 'ws':
    case 'ws-ide':
      // 返回 `'WebSocket'`，作为MCP 服务这次计算的结果。
      return 'WebSocket'
    default:
      // 返回 `'SSE'`，作为MCP 服务这次计算的结果。
      return 'SSE'
  }
}
