// 引入 useCallback、useEffect、useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef } from 'react'
// 引入 BoundedUUIDSet，将 ../bridge/bridgeMessaging.js 中已经封装好的能力接到本文件流程里。
import { BoundedUUIDSet } from '../bridge/bridgeMessaging.js'
// 类型依赖 { ToolUseConfirm } 来自 ../components/permissions/PermissionRequest.js，用于校准React hook 状态流的数据契约。
import type { ToolUseConfirm } from '../components/permissions/PermissionRequest.js'
// 类型依赖 { SpinnerMode } 来自 ../components/Spinner/types.js，用于校准React hook 状态流的数据契约。
import type { SpinnerMode } from '../components/Spinner/types.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type RemotePermissionResponse,
  type RemoteSessionConfig,
  RemoteSessionManager,
} from '../remote/RemoteSessionManager.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  createSyntheticAssistantMessage,
  createToolStub,
} from '../remote/remotePermissionBridge.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  convertSDKMessage,
  isSessionEndMessage,
} from '../remote/sdkMessageAdapter.js'
// 引入 useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useSetAppState } from '../state/AppState.js'
// 类型依赖 { AppState } 来自 ../state/AppStateStore.js，用于校准React hook 状态流的数据契约。
import type { AppState } from '../state/AppStateStore.js'
// 类型依赖 { Tool } 来自 ../Tool.js，用于校准React hook 状态流的数据契约。
import type { Tool } from '../Tool.js'
// 引入 findToolByName，将 ../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName } from '../Tool.js'
// 类型依赖 { Message as MessageType } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message as MessageType } from '../types/message.js'
// 类型依赖 { PermissionAskDecision } 来自 ../types/permissions.js，用于校准React hook 状态流的数据契约。
import type { PermissionAskDecision } from '../types/permissions.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { truncateToWidth } from '../utils/format.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  createSystemMessage,
  extractTextContent,
  handleMessageFromStream,
  type StreamingToolUse,
} from '../utils/messages.js'
// 复用 generateSessionTitle 工具函数，把通用处理留在 ../utils/sessionTitle.js 中维护。
import { generateSessionTitle } from '../utils/sessionTitle.js'
// 类型依赖 { RemoteMessageContent } 来自 ../utils/teleport/api.js，用于校准React hook 状态流的数据契约。
import type { RemoteMessageContent } from '../utils/teleport/api.js'
// 复用 updateSessionTitle 工具函数，把通用处理留在 ../utils/teleport/api.js 中维护。
import { updateSessionTitle } from '../utils/teleport/api.js'

// How long to wait for a response before showing a warning
// RESPONSE_TIMEOUT_MS 响应数据保存`60000 // 60 seconds`，供React hook use Remote...后续判断或输出使用。
const RESPONSE_TIMEOUT_MS = 60000 // 60 seconds
// Extended timeout during compaction — compact API calls take 5-30s and
// block other SDK messages, so the normal 60s timeout isn't enough when
// compaction itself runs close to the edge.
// COMPACTION_TIMEOUT_MS 集合保存`180000 // 3 minutes`，供后续判断或组装使用。
const COMPACTION_TIMEOUT_MS = 180000 // 3 minutes

// UseRemoteSessionProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseRemoteSessionProps = {
  config: RemoteSessionConfig | undefined
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>
  // 这个回调绑定到 setIsLoading: (loading: boolean) => void，负责React hook 状态流在该局部场景下的响应。
  setIsLoading: (loading: boolean) => void
  onInit?: (slashCommands: string[]) => void
  setToolUseConfirmQueue: React.Dispatch<React.SetStateAction<ToolUseConfirm[]>>
  tools: Tool[]
  setStreamingToolUses?: React.Dispatch<
    React.SetStateAction<StreamingToolUse[]>
  >
  setStreamMode?: React.Dispatch<React.SetStateAction<SpinnerMode>>
  // 这个回调绑定到 setInProgressToolUseIDs?: (f: (prev: Set<string>) => Set<string>) => void，负责React hook 状态流在该局部场景下的响应。
  setInProgressToolUseIDs?: (f: (prev: Set<string>) => Set<string>) => void
}

// UseRemoteSessionResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseRemoteSessionResult = {
  isRemoteMode: boolean
  // React hook use Remote Session在这里处理 `sendMessage: (`，完成这一小步状态转换。
  sendMessage: (
    content: RemoteMessageContent,
    opts?: { uuid?: string },
  ) => Promise<boolean>
  // 这个回调绑定到 cancelRequest: () => void，负责React hook 状态流在该局部场景下的响应。
  cancelRequest: () => void
  // 这个回调绑定到 disconnect: () => void，负责React hook 状态流在该局部场景下的响应。
  disconnect: () => void
}

/**
 * Hook for managing a remote CCR session in the REPL.
 *
 * Handles:
 * - WebSocket connection to CCR
 * - Converting SDK messages to REPL messages
 * - Sending user input to CCR via HTTP POST
 * - Permission request/response flow via existing ToolUseConfirm queue
 */
// useRemoteSession 封装useRemoteSession的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useRemoteSession({
  config,
  setMessages,
  setIsLoading,
  onInit,
  setToolUseConfirmQueue,
  tools,
  setStreamingToolUses,
  setStreamMode,
  setInProgressToolUseIDs,
}: UseRemoteSessionProps): UseRemoteSessionResult {
  // isRemoteMode标记React hook use Remote...是否启用对应路径。
  const isRemoteMode = !!config

  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // setConnStatus 集合保存`useCallback`，供React hook后续处理使用。
  const setConnStatus = useCallback(
    (s: AppState['remoteConnectionStatus']) =>
      setAppState(prev =>
        prev.remoteConnectionStatus === s
          ? prev
          : { ...prev, remoteConnectionStatus: s },
      ),
    [setAppState],
  )

  // Event-sourced count of subagents running inside the remote daemon child.
  // The viewer's own AppState.tasks is empty — tasks live in a different
  // process. task_started/task_notification reach us via the bridge WS.
  // runningTaskIdsRef 引用保存`useRef`，供React hook后续处理使用。
  const runningTaskIdsRef = useRef(new Set<string>())
  // writeTaskCount 数量保存`useCallback`，供React hook后续处理使用。
  const writeTaskCount = useCallback(() => {
    // n统计`runningTaskIdsRef.current.size`，供后续判断或组装使用。
    const n = runningTaskIdsRef.current.size
    // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setAppState(prev =>
      prev.remoteBackgroundTaskCount === n
        ? prev
        : { ...prev, remoteBackgroundTaskCount: n },
    )
  }, [setAppState])

  // Timer for detecting stuck sessions
  // responseTimeoutRef 引用保存 hook 状态，让React hook use Remote...跨渲染复用同一个容器。
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track whether the remote session is compacting. During compaction the
  // CLI worker is busy with an API call and won't emit messages for a while;
  // use a longer timeout and suppress spurious "unresponsive" warnings.
  // isCompactingRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isCompactingRef = useRef(false)

  // managerRef 引用保存 hook 状态，让React hook use Remote...跨渲染复用同一个容器。
  const managerRef = useRef<RemoteSessionManager | null>(null)

  // Track whether we've already updated the session title (for no-initial-prompt sessions)
  // hasUpdatedTitleRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasUpdatedTitleRef = useRef(false)

  // UUIDs of user messages we POSTed locally — the WS echoes them back and
  // we must filter them out when convertUserTextMessages is on, or the viewer
  // sees every typed message twice (once from local createUserMessage, once
  // from the echo). A single POST can echo MULTIPLE times with the same uuid:
  // the server may broadcast the POST directly to /subscribe, AND the worker
  // (cowork desktop / CLI daemon) echoes it again on its write path. A
  // delete-on-first-match Set would let the second echo through — use a
  // bounded ring instead. Cap is generous: users don't type 50 messages
  // faster than echoes arrive.
  // NOTE: this does NOT dedup history-vs-live overlap at attach time (nothing
  // seeds the set from history UUIDs; only sendMessage populates it).
  // sentUUIDsRef 引用保存`useRef`，供React hook后续处理使用。
  const sentUUIDsRef = useRef(new BoundedUUIDSet(50))

  // Keep a ref to tools so the WebSocket callback doesn't go stale
  // toolsRef 引用保存`useRef`，供React hook后续处理使用。
  const toolsRef = useRef(tools)
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // current更新为 `tools`，确保useRemoteSession后续读取最新状态。
    toolsRef.current = tools
  }, [tools])

  // Initialize and connect to remote session
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Skip if not in remote mode
    // 配置缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!config) {
      // React hook use Remote Session在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[useRemoteSession] Initializing for session ${config.sessionId}`,
    )

    // manager保存`RemoteSessionManager`，供React hook后续处理使用。
    const manager = new RemoteSessionManager(config, {
      // 这个回调绑定到 onMessage: sdkMessage => {，负责React hook 状态流在该局部场景下的响应。
      onMessage: sdkMessage => {
        // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
        const parts = [`type=${sdkMessage.type}`]
        // 满足 `'subtype' in sdkMessage) parts.push(`subtype=${sdkMessage.subtype}`` 时，React hook执行该分支。
        if ('subtype' in sdkMessage) parts.push(`subtype=${sdkMessage.subtype}`)
        // 当 `sdkMessage.type` 匹配 `'user'` 时，React hook执行对应分支。
        if (sdkMessage.type === 'user') {
          // c 命名 `sdkMessage.message?.content`，让后续代码直接表达这个值的用途。
          const c = sdkMessage.message?.content
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(
            // 这个回调绑定到 `content=${Array.isArray(c) ? c.map(b => b.type).join(',') : typeof c}`,，负责React hook 状态流在该局部场景下的响应。
            `content=${Array.isArray(c) ? c.map(b => b.type).join(',') : typeof c}`,
          )
        }
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[useRemoteSession] Received ${parts.join(' ')}`)

        // Clear response timeout on any message received — including the WS
        // echo of our own POST, which acts as a heartbeat. This must run
        // BEFORE the echo filter, or slow-to-stream agents (compaction, cold
        // start) spuriously trip the 60s unresponsive warning + reconnect.
        // 满足 `responseTimeoutRef.current` 时，React hook执行该分支。
        if (responseTimeoutRef.current) {
          // 调用 clearTimeout，触发React hook此处需要的副作用。
          clearTimeout(responseTimeoutRef.current)
          // current更新为 `null`，确保useRemoteSession后续读取最新状态。
          responseTimeoutRef.current = null
        }

        // Echo filter: drop user messages we already added locally before POST.
        // The server and/or worker round-trip our own send back on the WS with
        // the same uuid we passed to sendEventToRemoteSession. DO NOT delete on
        // match — the same uuid can echo more than once (server broadcast +
        // worker echo), and BoundedUUIDSet already caps growth via its ring.
        // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
        if (
          sdkMessage.type === 'user' &&
          sdkMessage.uuid &&
          sentUUIDsRef.current.has(sdkMessage.uuid)
        ) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[useRemoteSession] Dropping echoed user message ${sdkMessage.uuid}`,
          )
          // React hook use Remote Session在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // Handle init message - extract available slash commands
        // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
        if (
          sdkMessage.type === 'system' &&
          sdkMessage.subtype === 'init' &&
          onInit
        ) {
          // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[useRemoteSession] Init received with ${sdkMessage.slash_commands.length} slash commands`,
          )
          // 调用 onInit，触发React hook此处需要的副作用。
          onInit(sdkMessage.slash_commands)
        }

        // Track remote subagent lifecycle for the "N in background" counter.
        // All task types (Agent/teammate/workflow/bash) flow through
        // registerTask() → task_started, and complete via task_notification.
        // Return early — these are status signals, not renderable messages.
        // 当 `sdkMessage.type` 匹配 `'system'` 时，React hook执行对应分支。
        if (sdkMessage.type === 'system') {
          // 当 `sdkMessage.subtype` 匹配 `'task_started'` 时，React hook执行对应分支。
          if (sdkMessage.subtype === 'task_started') {
            // 调用 runningTaskIdsRef.current.add，触发React hook此处需要的副作用。
            runningTaskIdsRef.current.add(sdkMessage.task_id)
            // 调用 writeTaskCount，触发React hook此处需要的副作用。
            writeTaskCount()
            // React hook use Remote Session在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // 当 `sdkMessage.subtype` 匹配 `'task_notification'` 时，React hook执行对应分支。
          if (sdkMessage.subtype === 'task_notification') {
            // 调用 runningTaskIdsRef.current.delete，触发React hook此处需要的副作用。
            runningTaskIdsRef.current.delete(sdkMessage.task_id)
            // 调用 writeTaskCount，触发React hook此处需要的副作用。
            writeTaskCount()
            // React hook use Remote Session在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // 当 `sdkMessage.subtype` 匹配 `'task_progress'` 时，React hook执行对应分支。
          if (sdkMessage.subtype === 'task_progress') {
            // React hook use Remote Session在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // Track compaction state. The CLI emits status='compacting' at
          // the start and status=null when done; compact_boundary also
          // signals completion. Repeated 'compacting' status messages
          // (keep-alive ticks) update the ref but don't append to messages.
          // 当 `sdkMessage.subtype` 匹配 `'status'` 时，React hook执行对应分支。
          if (sdkMessage.subtype === 'status') {
            // wasCompacting保存`isCompactingRef.current`，供React hook use Remote...后续判断或输出使用。
            const wasCompacting = isCompactingRef.current
            // current更新为 `sdkMessage.status === 'compacting'`，确保useRemoteSession后续读取最新状态。
            isCompactingRef.current = sdkMessage.status === 'compacting'
            // 组合条件 `wasCompacting && isCompactingRef.current` 成立时，React hook 状态流才启用这条专门路径。
            if (wasCompacting && isCompactingRef.current) {
              // React hook use Remote Session在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
          }
          // 当 `sdkMessage.subtype` 匹配 `'compact_boundary'` 时，React hook执行对应分支。
          if (sdkMessage.subtype === 'compact_boundary') {
            // current更新为 `false`，确保useRemoteSession后续读取最新状态。
            isCompactingRef.current = false
          }
        }

        // Check if session ended
        // 满足 `isSessionEndMessage(sdkMessage)` 时，React hook执行该分支。
        if (isSessionEndMessage(sdkMessage)) {
          // current更新为 `false`，确保useRemoteSession后续读取最新状态。
          isCompactingRef.current = false
          // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
          setIsLoading(false)
        }

        // Clear in-progress tool_use IDs when their tool_result arrives.
        // Must read the RAW sdkMessage: in non-viewerOnly mode,
        // convertSDKMessage returns {type:'ignored'} for user messages, so the
        // delete would never fire post-conversion. Mirrors the add site below
        // and inProcessRunner.ts; without this the set grows unbounded for the
        // session lifetime (BQ: CCR cohort shows 5.2x higher RSS slope).
        // 组合条件 `setInProgressToolUseIDs && sdkMessage.type === 'u` 成立时，React hook 状态流才启用这条专门路径。
        if (setInProgressToolUseIDs && sdkMessage.type === 'user') {
          // 文本内容保存`sdkMessage.message?.content`，供后续判断或组装使用。
          const content = sdkMessage.message?.content
          // 满足 `Array.isArray(content)` 时，React hook执行该分支。
          if (Array.isArray(content)) {
            // resultIds 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
            const resultIds: string[] = []
            // 按顺序遍历 `content` 中的block，逐个交给React hook处理。
            for (const block of content) {
              // 当 `block.type` 匹配 `'tool_result'` 时，React hook执行对应分支。
              if (block.type === 'tool_result') {
                // resultIds 集合追加新条目，保持收集顺序与输入顺序一致。
                resultIds.push(block.tool_use_id)
              }
            }
            // 满足 `resultIds.length > 0` 时，React hook执行该分支。
            if (resultIds.length > 0) {
              // setInProgressToolUseIDs 写入新的状态值，使React hook 状态流后续读取保持一致。
              setInProgressToolUseIDs(prev => {
                // next保存`Set`，供React hook后续处理使用。
                const next = new Set(prev)
                // 逐项读取 `resultIds) next.delete(id` 中的标识符，按输入顺序推进React hook 状态流。
                for (const id of resultIds) next.delete(id)
                // 返回 `next.size === prev.size ? prev : next`，作为React hook 状态流这次计算的结果。
                return next.size === prev.size ? prev : next
              })
            }
          }
        }

        // Convert SDK message to REPL message. In viewerOnly mode, the
        // remote agent runs BriefTool (SendUserMessage) — its tool_use block
        // renders empty (userFacingName() === ''), actual content is in the
        // tool_result. So we must convert tool_results to render them.
        // converted保存`convertSDKMessage`，供React hook后续处理使用。
        const converted = convertSDKMessage(
          sdkMessage,
          config.viewerOnly
            ? { convertToolResults: true, convertUserTextMessages: true }
            : undefined,
        )

        // 当 `converted.type` 匹配 `'message'` 时，React hook执行对应分支。
        if (converted.type === 'message') {
          // When we receive a complete message, clear streaming tool uses
          // since the complete message replaces the partial streaming state
          // 这个回调绑定到 setStreamingToolUses?.(prev => (prev.length > 0 ? [] : prev))，负责React hook 状态流在该局部场景下的响应。
          setStreamingToolUses?.(prev => (prev.length > 0 ? [] : prev))

          // Mark tool_use blocks as in-progress so the UI shows the correct
          // spinner state instead of "Waiting…" (queued). In local sessions,
          // toolOrchestration.ts handles this, but remote sessions receive
          // pre-built assistant messages without running local tool execution.
          // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
          if (
            setInProgressToolUseIDs &&
            converted.message.type === 'assistant'
          ) {
            // toolUseIds 集合保存`converted.message.message.content`，供React hook use Remote...后续判断或输出使用。
            const toolUseIds = converted.message.message.content
              // 链式调用 filter，继续加工上一行在React hook 状态流中产生的数据。
              .filter(block => block.type === 'tool_use')
              // 链式调用 map，继续加工上一行在React hook 状态流中产生的数据。
              .map(block => block.id)
            // 满足 `toolUseIds.length > 0` 时，React hook执行该分支。
            if (toolUseIds.length > 0) {
              // setInProgressToolUseIDs 写入新的状态值，使React hook 状态流后续读取保持一致。
              setInProgressToolUseIDs(prev => {
                // next保存`Set`，供React hook后续处理使用。
                const next = new Set(prev)
                // 按顺序遍历 `toolUseIds` 中的标识符，逐个交给React hook处理。
                for (const id of toolUseIds) {
                  // 调用 next.add，触发React hook此处需要的副作用。
                  next.add(id)
                }
                // 返回 `next`，作为React hook 状态流这次计算的结果。
                return next
              })
            }
          }

          // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
          setMessages(prev => [...prev, converted.message])
          // Note: Don't stop loading on assistant messages - the agent may still be
          // working (tool use loops). Loading stops only on session end or permission request.
        // React hook use Remote Session在这里处理 `} else if (converted.type === 'stream_event') {`，完成这一小步状态转换。
        } else if (converted.type === 'stream_event') {
          // Process streaming events to update UI in real-time
          // 组合条件 `setStreamingToolUses && setStreamMode` 成立时，React hook 状态流才启用这条专门路径。
          if (setStreamingToolUses && setStreamMode) {
            // 调用 handleMessageFromStream，触发React hook此处需要的副作用。
            handleMessageFromStream(
              converted.event,
              // 消息更新为 `> setMessages(prev => [...prev, message])`，确保useRemoteSession后续读取最新状态。
              message => setMessages(prev => [...prev, message]),
              // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
              () => {
                // No-op for response length - remote sessions don't track this
              },
              setStreamMode,
              setStreamingToolUses,
            )
          } else {
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[useRemoteSession] Stream event received but streaming callbacks not provided`,
            )
          }
        }
        // 'ignored' messages are silently dropped
      },
      // 这个回调绑定到 onPermissionRequest: (request, requestId) => {，负责React hook 状态流在该局部场景下的响应。
      onPermissionRequest: (request, requestId) => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[useRemoteSession] Permission request for tool: ${request.tool_name}`,
        )

        // Look up the Tool object by name, or create a stub for unknown tools
        // tool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const tool =
          findToolByName(toolsRef.current, request.tool_name) ??
          createToolStub(request.tool_name)

        // syntheticMessage 消息数据构建`createSyntheticAssistantMessage`，供React hook后续处理使用。
        const syntheticMessage = createSyntheticAssistantMessage(
          request,
          requestId,
        )

        // 权限判断结果 集中保存React hook use Remote Session要一起传递的字段。
        const permissionResult: PermissionAskDecision = {
          behavior: 'ask',
          message:
            request.description ?? `${request.tool_name} requires permission`,
          suggestions: request.permission_suggestions,
          blockedPath: request.blocked_path,
        }

        // toolUseConfirm 集中保存React hook use Remote Session要一起传递的字段。
        const toolUseConfirm: ToolUseConfirm = {
          assistantMessage: syntheticMessage,
          tool,
          description:
            request.description ?? `${request.tool_name} requires permission`,
          input: request.input,
          toolUseContext: {} as ToolUseConfirm['toolUseContext'],
          toolUseID: request.tool_use_id,
          permissionResult,
          permissionPromptStartTimeMs: Date.now(),
          // onUserInteraction 使用 无 完成React hook 状态流里的对应操作。
          onUserInteraction() {
            // No-op for remote — classifier runs on the container
          },
          // onAbort 使用 无 完成React hook 状态流里的对应操作。
          onAbort() {
            // 接口响应 集中保存React hook use Remote Session要一起传递的字段。
            const response: RemotePermissionResponse = {
              behavior: 'deny',
              message: 'User aborted',
            }
            // 调用 manager.respondToPermissionRequest，触发React hook此处需要的副作用。
            manager.respondToPermissionRequest(requestId, response)
            // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
            setToolUseConfirmQueue(queue =>
              // 调用 queue.filter，触发React hook此处需要的副作用。
              queue.filter(item => item.toolUseID !== request.tool_use_id),
            )
          },
          // onAllow 使用 updatedInput, _permissionUpdates, _feedback 完成React hook 状态流里的对应操作。
          onAllow(updatedInput, _permissionUpdates, _feedback) {
            // 接口响应 集中保存React hook use Remote Session要一起传递的字段。
            const response: RemotePermissionResponse = {
              behavior: 'allow',
              updatedInput,
            }
            // 调用 manager.respondToPermissionRequest，触发React hook此处需要的副作用。
            manager.respondToPermissionRequest(requestId, response)
            // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
            setToolUseConfirmQueue(queue =>
              // 调用 queue.filter，触发React hook此处需要的副作用。
              queue.filter(item => item.toolUseID !== request.tool_use_id),
            )
            // Resume loading indicator after approving
            // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
            setIsLoading(true)
          },
          // onReject 使用 feedback?: string 完成React hook 状态流里的对应操作。
          onReject(feedback?: string) {
            // 接口响应 集中保存React hook use Remote Session要一起传递的字段。
            const response: RemotePermissionResponse = {
              behavior: 'deny',
              message: feedback ?? 'User denied permission',
            }
            // 调用 manager.respondToPermissionRequest，触发React hook此处需要的副作用。
            manager.respondToPermissionRequest(requestId, response)
            // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
            setToolUseConfirmQueue(queue =>
              // 调用 queue.filter，触发React hook此处需要的副作用。
              queue.filter(item => item.toolUseID !== request.tool_use_id),
            )
          },
          // recheckPermission 使用 无 完成React hook 状态流里的对应操作。
          async recheckPermission() {
            // No-op for remote — permission state is on the container
          },
        }

        // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
        setToolUseConfirmQueue(queue => [...queue, toolUseConfirm])
        // Pause loading indicator while waiting for permission
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
      },
      // 这个回调绑定到 onPermissionCancelled: (requestId, toolUseId) => {，负责React hook 状态流在该局部场景下的响应。
      onPermissionCancelled: (requestId, toolUseId) => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[useRemoteSession] Permission request cancelled: ${requestId}`,
        )
        // idToRemove保存`toolUseId ?? requestId`，供后续判断或组装使用。
        const idToRemove = toolUseId ?? requestId
        // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
        setToolUseConfirmQueue(queue =>
          // 调用 queue.filter，触发React hook此处需要的副作用。
          queue.filter(item => item.toolUseID !== idToRemove),
        )
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(true)
      },
      // 这个回调绑定到 onConnected: () => {，负责React hook 状态流在该局部场景下的响应。
      onConnected: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useRemoteSession] Connected')
        // setConnStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
        setConnStatus('connected')
      },
      // 这个回调绑定到 onReconnecting: () => {，负责React hook 状态流在该局部场景下的响应。
      onReconnecting: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useRemoteSession] Reconnecting')
        // setConnStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
        setConnStatus('reconnecting')
        // WS gap = we may miss task_notification events. Clear rather than
        // drift high forever. Undercounts tasks that span the gap; accepted.
        // 调用 runningTaskIdsRef.current.clear，触发React hook此处需要的副作用。
        runningTaskIdsRef.current.clear()
        // 调用 writeTaskCount，触发React hook此处需要的副作用。
        writeTaskCount()
        // Same for tool_use IDs: missed tool_result during the gap would
        // leave stale spinner state forever.
        // 这个回调绑定到 setInProgressToolUseIDs?.(prev => (prev.size > 0 ? new Set() : prev))，负责React hook 状态流在该局部场景下的响应。
        setInProgressToolUseIDs?.(prev => (prev.size > 0 ? new Set() : prev))
      },
      // 这个回调绑定到 onDisconnected: () => {，负责React hook 状态流在该局部场景下的响应。
      onDisconnected: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useRemoteSession] Disconnected')
        // setConnStatus 写入新的状态值，使React hook 状态流后续读取保持一致。
        setConnStatus('disconnected')
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
        // 调用 runningTaskIdsRef.current.clear，触发React hook此处需要的副作用。
        runningTaskIdsRef.current.clear()
        // 调用 writeTaskCount，触发React hook此处需要的副作用。
        writeTaskCount()
        // 这个回调绑定到 setInProgressToolUseIDs?.(prev => (prev.size > 0 ? new Set() : prev))，负责React hook 状态流在该局部场景下的响应。
        setInProgressToolUseIDs?.(prev => (prev.size > 0 ? new Set() : prev))
      },
      // 这个回调绑定到 onError: error => {，负责React hook 状态流在该局部场景下的响应。
      onError: error => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[useRemoteSession] Error: ${error.message}`)
      },
    })

    // current更新为 `manager`，确保useRemoteSession后续读取最新状态。
    managerRef.current = manager
    // 调用 manager.connect，触发React hook此处需要的副作用。
    manager.connect()

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[useRemoteSession] Cleanup - disconnecting')
      // Clear any pending timeout
      // 满足 `responseTimeoutRef.current` 时，React hook执行该分支。
      if (responseTimeoutRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(responseTimeoutRef.current)
        // current更新为 `null`，确保useRemoteSession后续读取最新状态。
        responseTimeoutRef.current = null
      }
      // 调用 manager.disconnect，触发React hook此处需要的副作用。
      manager.disconnect()
      // current更新为 `null`，确保useRemoteSession后续读取最新状态。
      managerRef.current = null
    }
  }, [
    config,
    setMessages,
    setIsLoading,
    onInit,
    setToolUseConfirmQueue,
    setStreamingToolUses,
    setStreamMode,
    setInProgressToolUseIDs,
    setConnStatus,
    writeTaskCount,
  ])

  // Send a user message to the remote session
  // sendMessage 消息数据保存`useCallback`，供React hook后续处理使用。
  const sendMessage = useCallback(
    async (
      content: RemoteMessageContent,
      opts?: { uuid?: string },
    ): Promise<boolean> => {
      // manager保存`managerRef.current`，供React hook use Remote...后续判断或输出使用。
      const manager = managerRef.current
      // manager缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!manager) {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useRemoteSession] Cannot send - no manager')
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // Clear any existing timeout
      // 满足 `responseTimeoutRef.current` 时，React hook执行该分支。
      if (responseTimeoutRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(responseTimeoutRef.current)
      }

      // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsLoading(true)

      // Track locally-added message UUIDs so the WS echo can be filtered.
      // Must record BEFORE the POST to close the race where the echo arrives
      // before the POST promise resolves.
      // 满足 `opts?.uuid) sentUUIDsRef.current.add(opts.uuid` 时，React hook执行该分支。
      if (opts?.uuid) sentUUIDsRef.current.add(opts.uuid)

      // success 集合保存`manager.sendMessage`，供React hook后续处理使用。
      const success = await manager.sendMessage(content, opts)

      // success 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!success) {
        // No need to undo the pre-POST add — BoundedUUIDSet's ring evicts it.
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // Update the session title after the first message when no initial prompt was provided.
      // This gives the session a meaningful title on claude.ai instead of "Background task".
      // Skip in viewerOnly mode — the remote agent owns the session title.
      // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
      if (
        !hasUpdatedTitleRef.current &&
        config &&
        !config.hasInitialPrompt &&
        !config.viewerOnly
      ) {
        // current更新为 `true`，确保useRemoteSession后续读取最新状态。
        hasUpdatedTitleRef.current = true
        // sessionId 会话数据 命名 `config.sessionId`，让后续代码直接表达这个值的用途。
        const sessionId = config.sessionId
        // Extract plain text from content (may be string or content block array)
        // description 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const description =
          typeof content === 'string'
            ? content
            : extractTextContent(content, ' ')
        // 满足 `description` 时，React hook执行该分支。
        if (description) {
          // generateSessionTitle never rejects (wraps body in try/catch,
          // returns null on failure), so no .catch needed on this chain.
          // 显式忽略 `generateSessionTitle(` 的返回值，只保留它触发的副作用。
          void generateSessionTitle(
            description,
            new AbortController().signal,
          // 这个回调绑定到 ).then(title => {，负责React hook 状态流在该局部场景下的响应。
          ).then(title => {
            // 显式忽略 `updateSessionTitle(` 的返回值，只保留它触发的副作用。
            void updateSessionTitle(
              sessionId,
              title ?? truncateToWidth(description, 75),
            )
          })
        }
      }

      // Start timeout to detect stuck sessions. Skip in viewerOnly mode —
      // the remote agent may be idle-shut and take >60s to respawn.
      // Use a longer timeout when the remote session is compacting, since
      // the CLI worker is busy with an API call and won't emit messages.
      // 满足 `!config?.viewerOnly` 时，React hook执行该分支。
      if (!config?.viewerOnly) {
        // timeoutMs 集合保存`isCompactingRef.current`，供后续判断或组装使用。
        const timeoutMs = isCompactingRef.current
          ? COMPACTION_TIMEOUT_MS
          : RESPONSE_TIMEOUT_MS
        // current更新为 `setTimeout(`，确保useRemoteSession后续读取最新状态。
        responseTimeoutRef.current = setTimeout(
          // 这个回调绑定到 (setMessages, manager) => {，负责React hook 状态流在该局部场景下的响应。
          (setMessages, manager) => {
            // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              '[useRemoteSession] Response timeout - attempting reconnect',
            )
            // Add a warning message to the conversation
            // warningMessage 消息数据构建`createSystemMessage`，供React hook后续处理使用。
            const warningMessage = createSystemMessage(
              'Remote session may be unresponsive. Attempting to reconnect…',
              'warning',
            )
            // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
            setMessages(prev => [...prev, warningMessage])

            // Attempt to reconnect the WebSocket - the subscription may have become stale
            // 调用 manager.reconnect，触发React hook此处需要的副作用。
            manager.reconnect()
          },
          timeoutMs,
          setMessages,
          manager,
        )
      }

      // 返回 `success`，作为React hook 状态流这次计算的结果。
      return success
    },
    [config, setIsLoading, setMessages],
  )

  // Cancel the current request on the remote session
  // cancelRequest 请求数据保存`useCallback`，供React hook后续处理使用。
  const cancelRequest = useCallback(() => {
    // Clear any pending timeout
    // 满足 `responseTimeoutRef.current` 时，React hook执行该分支。
    if (responseTimeoutRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(responseTimeoutRef.current)
      // current更新为 `null`，确保useRemoteSession后续读取最新状态。
      responseTimeoutRef.current = null
    }

    // Send interrupt signal to CCR. Skip in viewerOnly mode — Ctrl+C
    // should never interrupt the remote agent.
    // 满足 `!config?.viewerOnly` 时，React hook执行该分支。
    if (!config?.viewerOnly) {
      // 调用 managerRef.current?.cancelSession()，完成这一处局部操作。
      managerRef.current?.cancelSession()
    }

    // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsLoading(false)
  }, [config, setIsLoading])

  // Disconnect from the session
  // disconnect保存`useCallback`，供React hook后续处理使用。
  const disconnect = useCallback(() => {
    // Clear any pending timeout
    // 满足 `responseTimeoutRef.current` 时，React hook执行该分支。
    if (responseTimeoutRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(responseTimeoutRef.current)
      // current更新为 `null`，确保useRemoteSession后续读取最新状态。
      responseTimeoutRef.current = null
    }
    // 调用 managerRef.current?.disconnect()，完成这一处局部操作。
    managerRef.current?.disconnect()
    // current更新为 `null`，确保useRemoteSession后续读取最新状态。
    managerRef.current = null
  }, [])

  // All four fields are already stable (boolean derived from a prop that
  // doesn't change mid-session, three useCallbacks with stable deps). The
  // result object is consumed by REPL's onSubmit useCallback deps — without
  // memoization the fresh literal invalidates onSubmit on every REPL render,
  // which in turn churns PromptInput's props and downstream memoization.
  // 返回 `useMemo(`，作为React hook 状态流这次计算的结果。
  return useMemo(
    // 这个回调绑定到 () => ({ isRemoteMode, sendMessage, cancelRequest, disconnect }),，负责React hook 状态流在该局部场景下的响应。
    () => ({ isRemoteMode, sendMessage, cancelRequest, disconnect }),
    [isRemoteMode, sendMessage, cancelRequest, disconnect],
  )
}
