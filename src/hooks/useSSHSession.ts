/**
 * REPL integration hook for `claude ssh` sessions.
 *
 * Sibling to useDirectConnect — same shape (isRemoteMode/sendMessage/
 * cancelRequest/disconnect), same REPL wiring, but drives an SSH child
 * process instead of a WebSocket. Kept separate rather than generalizing
 * useDirectConnect because the lifecycle differs: the ssh process and auth
 * proxy are created BEFORE this hook runs (during startup, in main.tsx) and
 * handed in; useDirectConnect creates its WebSocket inside the effect.
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 useCallback、useEffect、useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef } from 'react'
// 类型依赖 { ToolUseConfirm } 来自 ../components/permissions/PermissionRequest.js，用于校准React hook 状态流的数据契约。
import type { ToolUseConfirm } from '../components/permissions/PermissionRequest.js'
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
// 类型依赖 { SSHSession } 来自 ../ssh/createSSHSession.js，用于校准React hook 状态流的数据契约。
import type { SSHSession } from '../ssh/createSSHSession.js'
// 类型依赖 { SSHSessionManager } 来自 ../ssh/SSHSessionManager.js，用于校准React hook 状态流的数据契约。
import type { SSHSessionManager } from '../ssh/SSHSessionManager.js'
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
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../utils/gracefulShutdown.js'
// 类型依赖 { RemoteMessageContent } 来自 ../utils/teleport/api.js，用于校准React hook 状态流的数据契约。
import type { RemoteMessageContent } from '../utils/teleport/api.js'

// UseSSHSessionResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSSHSessionResult = {
  isRemoteMode: boolean
  // 这个回调绑定到 sendMessage: (content: RemoteMessageContent) => Promise<boolean>，负责React hook 状态流在该局部场景下的响应。
  sendMessage: (content: RemoteMessageContent) => Promise<boolean>
  // 这个回调绑定到 cancelRequest: () => void，负责React hook 状态流在该局部场景下的响应。
  cancelRequest: () => void
  // 这个回调绑定到 disconnect: () => void，负责React hook 状态流在该局部场景下的响应。
  disconnect: () => void
}

// UseSSHSessionProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSSHSessionProps = {
  session: SSHSession | undefined
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>
  // 这个回调绑定到 setIsLoading: (loading: boolean) => void，负责React hook 状态流在该局部场景下的响应。
  setIsLoading: (loading: boolean) => void
  setToolUseConfirmQueue: React.Dispatch<React.SetStateAction<ToolUseConfirm[]>>
  tools: Tool[]
}

// useSSHSession 封装useSSHSession的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSSHSession({
  session,
  setMessages,
  setIsLoading,
  setToolUseConfirmQueue,
  tools,
}: UseSSHSessionProps): UseSSHSessionResult {
  // isRemoteMode标记React hook use SSHSes...是否启用对应路径。
  const isRemoteMode = !!session

  // managerRef 引用保存 hook 状态，让React hook use SSHSes...跨渲染复用同一个容器。
  const managerRef = useRef<SSHSessionManager | null>(null)
  // hasReceivedInitRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasReceivedInitRef = useRef(false)
  // isConnectedRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isConnectedRef = useRef(false)

  // toolsRef 引用保存`useRef`，供React hook后续处理使用。
  const toolsRef = useRef(tools)
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // current更新为 `tools`，确保useSSHSession后续读取最新状态。
    toolsRef.current = tools
  }, [tools])

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // session 会话数据缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!session) return

    // current更新为 `false`，确保useSSHSession后续读取最新状态。
    hasReceivedInitRef.current = false
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[useSSHSession] wiring SSH session manager')

    // manager构建`session.createManager`，供React hook后续处理使用。
    const manager = session.createManager({
      // 这个回调绑定到 onMessage: sdkMessage => {，负责React hook 状态流在该局部场景下的响应。
      onMessage: sdkMessage => {
        // 满足 `isSessionEndMessage(sdkMessage)` 时，React hook执行该分支。
        if (isSessionEndMessage(sdkMessage)) {
          // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
          setIsLoading(false)
        }

        // Skip duplicate init messages (one per turn from stream-json mode).
        // 组合条件 `sdkMessage.type === 'system' && sdkMessage.subtyp` 成立时，React hook 状态流才启用这条专门路径。
        if (sdkMessage.type === 'system' && sdkMessage.subtype === 'init') {
          // 满足 `hasReceivedInitRef.current` 时，React hook执行该分支。
          if (hasReceivedInitRef.current) return
          // current更新为 `true`，确保useSSHSession后续读取最新状态。
          hasReceivedInitRef.current = true
        }

        // converted保存`convertSDKMessage`，供React hook后续处理使用。
        const converted = convertSDKMessage(sdkMessage, {
          convertToolResults: true,
        })
        // 当 `converted.type` 匹配 `'message'` 时，React hook执行对应分支。
        if (converted.type === 'message') {
          // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
          setMessages(prev => [...prev, converted.message])
        }
      },
      // 这个回调绑定到 onPermissionRequest: (request, requestId) => {，负责React hook 状态流在该局部场景下的响应。
      onPermissionRequest: (request, requestId) => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[useSSHSession] permission request: ${request.tool_name}`,
        )

        // tool 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const tool =
          findToolByName(toolsRef.current, request.tool_name) ??
          createToolStub(request.tool_name)

        // syntheticMessage 消息数据构建`createSyntheticAssistantMessage`，供React hook后续处理使用。
        const syntheticMessage = createSyntheticAssistantMessage(
          request,
          requestId,
        )

        // 权限判断结果 集中保存React hook use SSHSession要一起传递的字段。
        const permissionResult: PermissionAskDecision = {
          behavior: 'ask',
          message:
            request.description ?? `${request.tool_name} requires permission`,
          suggestions: request.permission_suggestions,
          blockedPath: request.blocked_path,
        }

        // toolUseConfirm 集中保存React hook use SSHSession要一起传递的字段。
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
          onUserInteraction() {},
          // onAbort 使用 无 完成React hook 状态流里的对应操作。
          onAbort() {
            // 调用 manager.respondToPermissionRequest，触发React hook此处需要的副作用。
            manager.respondToPermissionRequest(requestId, {
              behavior: 'deny',
              message: 'User aborted',
            })
            // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
            setToolUseConfirmQueue(q =>
              // 调用 q.filter，触发React hook此处需要的副作用。
              q.filter(i => i.toolUseID !== request.tool_use_id),
            )
          },
          // onAllow 使用 updatedInput 完成React hook 状态流里的对应操作。
          onAllow(updatedInput) {
            // 调用 manager.respondToPermissionRequest，触发React hook此处需要的副作用。
            manager.respondToPermissionRequest(requestId, {
              behavior: 'allow',
              updatedInput,
            })
            // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
            setToolUseConfirmQueue(q =>
              // 调用 q.filter，触发React hook此处需要的副作用。
              q.filter(i => i.toolUseID !== request.tool_use_id),
            )
            // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
            setIsLoading(true)
          },
          // onReject 使用 feedback 完成React hook 状态流里的对应操作。
          onReject(feedback) {
            // 调用 manager.respondToPermissionRequest，触发React hook此处需要的副作用。
            manager.respondToPermissionRequest(requestId, {
              behavior: 'deny',
              message: feedback ?? 'User denied permission',
            })
            // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
            setToolUseConfirmQueue(q =>
              // 调用 q.filter，触发React hook此处需要的副作用。
              q.filter(i => i.toolUseID !== request.tool_use_id),
            )
          },
          // recheckPermission 使用 无 完成React hook 状态流里的对应操作。
          async recheckPermission() {},
        }

        // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
        setToolUseConfirmQueue(q => [...q, toolUseConfirm])
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
      },
      // 这个回调绑定到 onConnected: () => {，负责React hook 状态流在该局部场景下的响应。
      onConnected: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useSSHSession] connected')
        // current更新为 `true`，确保useSSHSession后续读取最新状态。
        isConnectedRef.current = true
      },
      // 这个回调绑定到 onReconnecting: (attempt, max) => {，负责React hook 状态流在该局部场景下的响应。
      onReconnecting: (attempt, max) => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[useSSHSession] ssh dropped, reconnecting (${attempt}/${max})`,
        )
        // current更新为 `false`，确保useSSHSession后续读取最新状态。
        isConnectedRef.current = false
        // Surface a transient system message in the transcript so the user
        // knows what's happening — the next onConnected clears the state.
        // Any in-flight request is lost; the remote's --continue reloads
        // history but there's no turn in progress to resume.
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
        // 消息 集中保存React hook use SSHSession要一起传递的字段。
        const msg: MessageType = {
          type: 'system',
          subtype: 'informational',
          content: `SSH connection dropped — reconnecting (attempt ${attempt}/${max})...`,
          timestamp: new Date().toISOString(),
          uuid: randomUUID(),
          level: 'warning',
        }
        // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
        setMessages(prev => [...prev, msg])
      },
      // 这个回调绑定到 onDisconnected: () => {，负责React hook 状态流在该局部场景下的响应。
      onDisconnected: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useSSHSession] ssh process exited (giving up)')
        // stderr读取`session.getStderrTail`，供React hook后续处理使用。
        const stderr = session.getStderrTail().trim()
        // connected保存`isConnectedRef.current`，供React hook use SSHSes...后续判断或输出使用。
        const connected = isConnectedRef.current
        // exitCode 命名 `session.proc.exitCode`，让后续代码直接表达这个值的用途。
        const exitCode = session.proc.exitCode
        // current更新为 `false`，确保useSSHSession后续读取最新状态。
        isConnectedRef.current = false
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)

        // 消息保存`connected`，供React hook use SSHSes...后续判断或输出使用。
        let msg = connected
          ? 'Remote session ended.'
          : 'SSH session failed before connecting.'
        // Surface remote stderr if it looks like an error (pre-connect always,
        // post-connect only on nonzero exit — normal --verbose noise otherwise).
        // `stderr && (!connected || exitCode` 与 `0)` 不一致时刷新派生状态，避免使用过期结果。
        if (stderr && (!connected || exitCode !== 0)) {
          // React hook use SSHSession在这里处理 `msg += `\nRemote stderr (exit ${exitCode ?? 'signal ' + session.proc.si...`，完成这一小步状态转换。
          msg += `\nRemote stderr (exit ${exitCode ?? 'signal ' + session.proc.signalCode}):\n${stderr}`
        }
        // 显式忽略 `gracefulShutdown(1, 'other', { finalMessage: msg })` 的返回值，只保留它触发的副作用。
        void gracefulShutdown(1, 'other', { finalMessage: msg })
      },
      // 这个回调绑定到 onError: error => {，负责React hook 状态流在该局部场景下的响应。
      onError: error => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[useSSHSession] error: ${error.message}`)
      },
    })

    // current更新为 `manager`，确保useSSHSession后续读取最新状态。
    managerRef.current = manager
    // 调用 manager.connect，触发React hook此处需要的副作用。
    manager.connect()

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[useSSHSession] cleanup')
      // 调用 manager.disconnect，触发React hook此处需要的副作用。
      manager.disconnect()
      // 调用 session.proxy.stop，触发React hook此处需要的副作用。
      session.proxy.stop()
      // current更新为 `null`，确保useSSHSession后续读取最新状态。
      managerRef.current = null
    }
  }, [session, setMessages, setIsLoading, setToolUseConfirmQueue])

  // sendMessage 消息数据保存`useCallback`，供React hook后续处理使用。
  const sendMessage = useCallback(
    async (content: RemoteMessageContent): Promise<boolean> => {
      // m保存`managerRef.current`，供后续判断或组装使用。
      const m = managerRef.current
      // m缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!m) return false
      // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsLoading(true)
      // 返回 `m.sendMessage(content)`，作为React hook 状态流这次计算的结果。
      return m.sendMessage(content)
    },
    [setIsLoading],
  )

  // cancelRequest 请求数据保存`useCallback`，供React hook后续处理使用。
  const cancelRequest = useCallback(() => {
    // 调用 managerRef.current?.sendInterrupt()，完成这一处局部操作。
    managerRef.current?.sendInterrupt()
    // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsLoading(false)
  }, [setIsLoading])

  // disconnect保存`useCallback`，供React hook后续处理使用。
  const disconnect = useCallback(() => {
    // 调用 managerRef.current?.disconnect()，完成这一处局部操作。
    managerRef.current?.disconnect()
    // current更新为 `null`，确保useSSHSession后续读取最新状态。
    managerRef.current = null
    // current更新为 `false`，确保useSSHSession后续读取最新状态。
    isConnectedRef.current = false
  }, [])

  // 返回 `useMemo(`，作为React hook 状态流这次计算的结果。
  return useMemo(
    // 这个回调绑定到 () => ({ isRemoteMode, sendMessage, cancelRequest, disconnect }),，负责React hook 状态流在该局部场景下的响应。
    () => ({ isRemoteMode, sendMessage, cancelRequest, disconnect }),
    [isRemoteMode, sendMessage, cancelRequest, disconnect],
  )
}
