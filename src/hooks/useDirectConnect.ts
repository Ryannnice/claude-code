// 引入 useCallback、useEffect、useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef } from 'react'
// 类型依赖 { ToolUseConfirm } 来自 ../components/permissions/PermissionRequest.js，用于校准React hook 状态流的数据契约。
import type { ToolUseConfirm } from '../components/permissions/PermissionRequest.js'
// 类型依赖 { RemotePermissionResponse } 来自 ../remote/RemoteSessionManager.js，用于校准React hook 状态流的数据契约。
import type { RemotePermissionResponse } from '../remote/RemoteSessionManager.js'
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
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type DirectConnectConfig,
  DirectConnectSessionManager,
} from '../server/directConnectManager.js'
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

// UseDirectConnectResult 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseDirectConnectResult = {
  isRemoteMode: boolean
  // 这个回调绑定到 sendMessage: (content: RemoteMessageContent) => Promise<boolean>，负责React hook 状态流在该局部场景下的响应。
  sendMessage: (content: RemoteMessageContent) => Promise<boolean>
  // 这个回调绑定到 cancelRequest: () => void，负责React hook 状态流在该局部场景下的响应。
  cancelRequest: () => void
  // 这个回调绑定到 disconnect: () => void，负责React hook 状态流在该局部场景下的响应。
  disconnect: () => void
}

// UseDirectConnectProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseDirectConnectProps = {
  config: DirectConnectConfig | undefined
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>
  // 这个回调绑定到 setIsLoading: (loading: boolean) => void，负责React hook 状态流在该局部场景下的响应。
  setIsLoading: (loading: boolean) => void
  setToolUseConfirmQueue: React.Dispatch<React.SetStateAction<ToolUseConfirm[]>>
  tools: Tool[]
}

// useDirectConnect 封装useDirectConnect的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDirectConnect({
  config,
  setMessages,
  setIsLoading,
  setToolUseConfirmQueue,
  tools,
}: UseDirectConnectProps): UseDirectConnectResult {
  // isRemoteMode标记React hook use Direct...是否启用对应路径。
  const isRemoteMode = !!config

  // managerRef 引用保存 hook 状态，让React hook use Direct...跨渲染复用同一个容器。
  const managerRef = useRef<DirectConnectSessionManager | null>(null)
  // hasReceivedInitRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasReceivedInitRef = useRef(false)
  // isConnectedRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isConnectedRef = useRef(false)

  // Keep a ref to tools so the WebSocket callback doesn't go stale
  // toolsRef 引用保存`useRef`，供React hook后续处理使用。
  const toolsRef = useRef(tools)
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // current更新为 `tools`，确保useDirectConnect后续读取最新状态。
    toolsRef.current = tools
  }, [tools])

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 配置缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!config) {
      // React hook use Direct Connect在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // current更新为 `false`，确保useDirectConnect后续读取最新状态。
    hasReceivedInitRef.current = false
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[useDirectConnect] Connecting to ${config.wsUrl}`)

    // manager保存`DirectConnectSessionManager`，供React hook后续处理使用。
    const manager = new DirectConnectSessionManager(config, {
      // 这个回调绑定到 onMessage: sdkMessage => {，负责React hook 状态流在该局部场景下的响应。
      onMessage: sdkMessage => {
        // 满足 `isSessionEndMessage(sdkMessage)` 时，React hook执行该分支。
        if (isSessionEndMessage(sdkMessage)) {
          // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
          setIsLoading(false)
        }

        // Skip duplicate init messages (server sends one per turn)
        // 组合条件 `sdkMessage.type === 'system' && sdkMessage.subtyp` 成立时，React hook 状态流才启用这条专门路径。
        if (sdkMessage.type === 'system' && sdkMessage.subtype === 'init') {
          // 满足 `hasReceivedInitRef.current` 时，React hook执行该分支。
          if (hasReceivedInitRef.current) {
            // React hook use Direct Connect在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // current更新为 `true`，确保useDirectConnect后续读取最新状态。
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
          `[useDirectConnect] Permission request for tool: ${request.tool_name}`,
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

        // 权限判断结果 集中保存React hook use Direct Connect要一起传递的字段。
        const permissionResult: PermissionAskDecision = {
          behavior: 'ask',
          message:
            request.description ?? `${request.tool_name} requires permission`,
          suggestions: request.permission_suggestions,
          blockedPath: request.blocked_path,
        }

        // toolUseConfirm 集中保存React hook use Direct Connect要一起传递的字段。
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
            // No-op for remote
          },
          // onAbort 使用 无 完成React hook 状态流里的对应操作。
          onAbort() {
            // 接口响应 集中保存React hook use Direct Connect要一起传递的字段。
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
            // 接口响应 集中保存React hook use Direct Connect要一起传递的字段。
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
            // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
            setIsLoading(true)
          },
          // onReject 使用 feedback?: string 完成React hook 状态流里的对应操作。
          onReject(feedback?: string) {
            // 接口响应 集中保存React hook use Direct Connect要一起传递的字段。
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
            // No-op for remote
          },
        }

        // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
        setToolUseConfirmQueue(queue => [...queue, toolUseConfirm])
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
      },
      // 这个回调绑定到 onConnected: () => {，负责React hook 状态流在该局部场景下的响应。
      onConnected: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useDirectConnect] Connected')
        // current更新为 `true`，确保useDirectConnect后续读取最新状态。
        isConnectedRef.current = true
      },
      // 这个回调绑定到 onDisconnected: () => {，负责React hook 状态流在该局部场景下的响应。
      onDisconnected: () => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[useDirectConnect] Disconnected')
        // isConnectedRef.current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!isConnectedRef.current) {
          // Never connected — connection failure (e.g. auth rejected)
          // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
          process.stderr.write(
            `\nFailed to connect to server at ${config.wsUrl}\n`,
          )
        } else {
          // Was connected then lost — server process exited or network dropped
          // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
          process.stderr.write('\nServer disconnected.\n')
        }
        // current更新为 `false`，确保useDirectConnect后续读取最新状态。
        isConnectedRef.current = false
        // 显式忽略 `gracefulShutdown(1)` 的返回值，只保留它触发的副作用。
        void gracefulShutdown(1)
        // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
        setIsLoading(false)
      },
      // 这个回调绑定到 onError: error => {，负责React hook 状态流在该局部场景下的响应。
      onError: error => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[useDirectConnect] Error: ${error.message}`)
      },
    })

    // current更新为 `manager`，确保useDirectConnect后续读取最新状态。
    managerRef.current = manager
    // 调用 manager.connect，触发React hook此处需要的副作用。
    manager.connect()

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[useDirectConnect] Cleanup - disconnecting')
      // 调用 manager.disconnect，触发React hook此处需要的副作用。
      manager.disconnect()
      // current更新为 `null`，确保useDirectConnect后续读取最新状态。
      managerRef.current = null
    }
  }, [config, setMessages, setIsLoading, setToolUseConfirmQueue])

  // sendMessage 消息数据保存`useCallback`，供React hook后续处理使用。
  const sendMessage = useCallback(
    async (content: RemoteMessageContent): Promise<boolean> => {
      // manager保存`managerRef.current`，供React hook use Direct...后续判断或输出使用。
      const manager = managerRef.current
      // manager缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!manager) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsLoading(true)

      // 返回 `manager.sendMessage(content)`，作为React hook 状态流这次计算的结果。
      return manager.sendMessage(content)
    },
    [setIsLoading],
  )

  // Cancel the current request
  // cancelRequest 请求数据保存`useCallback`，供React hook后续处理使用。
  const cancelRequest = useCallback(() => {
    // Send interrupt signal to the server
    // 调用 managerRef.current?.sendInterrupt()，完成这一处局部操作。
    managerRef.current?.sendInterrupt()

    // setIsLoading 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsLoading(false)
  }, [setIsLoading])

  // disconnect保存`useCallback`，供React hook后续处理使用。
  const disconnect = useCallback(() => {
    // 调用 managerRef.current?.disconnect()，完成这一处局部操作。
    managerRef.current?.disconnect()
    // current更新为 `null`，确保useDirectConnect后续读取最新状态。
    managerRef.current = null
    // current更新为 `false`，确保useDirectConnect后续读取最新状态。
    isConnectedRef.current = false
  }, [])

  // Same stability concern as useRemoteSession — memoize so consumers
  // that depend on the result object don't see a fresh reference per render.
  // 返回 `useMemo(`，作为React hook 状态流这次计算的结果。
  return useMemo(
    // 这个回调绑定到 () => ({ isRemoteMode, sendMessage, cancelRequest, disconnect }),，负责React hook 状态流在该局部场景下的响应。
    () => ({ isRemoteMode, sendMessage, cancelRequest, disconnect }),
    [isRemoteMode, sendMessage, cancelRequest, disconnect],
  )
}
