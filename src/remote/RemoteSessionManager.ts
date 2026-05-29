// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准Remote Session Manager的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让Remote Session Manager后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlCancelRequest,
  SDKControlPermissionRequest,
  SDKControlRequest,
  SDKControlResponse,
} from '../entrypoints/sdk/controlTypes.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 整理这一组导入，让Remote Session Manager后续逻辑可以直接复用这些外部能力。
import {
  type RemoteMessageContent,
  sendEventToRemoteSession,
} from '../utils/teleport/api.js'
// 整理这一组导入，让Remote Session Manager后续逻辑可以直接复用这些外部能力。
import {
  SessionsWebSocket,
  type SessionsWebSocketCallbacks,
} from './SessionsWebSocket.js'

/**
 * Type guard to check if a message is an SDKMessage (not a control message)
 */
// isSDKMessage 封装RemoteSessionManager的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSDKMessage(
  message:
    | SDKMessage
    | SDKControlRequest
    | SDKControlResponse
    | SDKControlCancelRequest,
): message is SDKMessage {
  // 返回 `(`，作为Remote Session Manager这次计算的结果。
  return (
    message.type !== 'control_request' &&
    message.type !== 'control_response' &&
    message.type !== 'control_cancel_request'
  )
}

/**
 * Simple permission response for remote sessions.
 * This is a simplified version of PermissionResult for CCR communication.
 */
// RemotePermissionResponse 固化Remote Session Manager里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemotePermissionResponse =
  | {
      behavior: 'allow'
      updatedInput: Record<string, unknown>
    }
  | {
      behavior: 'deny'
      message: string
    }

// RemoteSessionConfig 固化Remote Session Manager里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteSessionConfig = {
  sessionId: string
  // 这个回调绑定到 getAccessToken: () => string，负责Remote Session Manager在该局部场景下的响应。
  getAccessToken: () => string
  orgUuid: string
  /** True if session was created with an initial prompt that's being processed */
  hasInitialPrompt?: boolean
  /**
   * When true, this client is a pure viewer. Ctrl+C/Escape do NOT send
   * interrupt to the remote agent; 60s reconnect timeout is disabled;
   * session title is never updated. Used by `claude assistant`.
   */
  viewerOnly?: boolean
}

// RemoteSessionCallbacks 固化Remote Session Manager里传递的数据形状，帮助调用方按同一结构读写字段。
export type RemoteSessionCallbacks = {
  /** Called when an SDKMessage is received from the session */
  // 这个回调绑定到 onMessage: (message: SDKMessage) => void，负责Remote Session Manager在该局部场景下的响应。
  onMessage: (message: SDKMessage) => void
  /** Called when a permission request is received from CCR */
  // Remote Session Manager在这里处理 `onPermissionRequest: (`，完成这一小步状态转换。
  onPermissionRequest: (
    request: SDKControlPermissionRequest,
    requestId: string,
  ) => void
  /** Called when the server cancels a pending permission request */
  // Remote Session Manager在这里处理 `onPermissionCancelled?: (`，完成这一小步状态转换。
  onPermissionCancelled?: (
    requestId: string,
    toolUseId: string | undefined,
  ) => void
  /** Called when connection is established */
  // 这个回调绑定到 onConnected?: () => void，负责Remote Session Manager在该局部场景下的响应。
  onConnected?: () => void
  /** Called when connection is lost and cannot be restored */
  // 这个回调绑定到 onDisconnected?: () => void，负责Remote Session Manager在该局部场景下的响应。
  onDisconnected?: () => void
  /** Called on transient WS drop while reconnect backoff is in progress */
  // 这个回调绑定到 onReconnecting?: () => void，负责Remote Session Manager在该局部场景下的响应。
  onReconnecting?: () => void
  /** Called on error */
  // 这个回调绑定到 onError?: (error: Error) => void，负责Remote Session Manager在该局部场景下的响应。
  onError?: (error: Error) => void
}

/**
 * Manages a remote CCR session.
 *
 * Coordinates:
 * - WebSocket subscription for receiving messages from CCR
 * - HTTP POST for sending user messages to CCR
 * - Permission request/response flow
 */
// RemoteSessionManager 聚合Remote Session Manager相关状态与操作，把同一职责的行为收束到类实例中。
export class RemoteSessionManager {
  private websocket: SessionsWebSocket | null = null
  private pendingPermissionRequests: Map<string, SDKControlPermissionRequest> =
    new Map()

  // 构造函数初始化实例状态，确保Remote Session Manager后续方法读取到完整配置。
  constructor(
    private readonly config: RemoteSessionConfig,
    private readonly callbacks: RemoteSessionCallbacks,
  ) {}

  /**
   * Connect to the remote session via WebSocket
   */
  // connect 使用 无 完成Remote Session Manager里的对应操作。
  connect(): void {
    // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[RemoteSessionManager] Connecting to session ${this.config.sessionId}`,
    )

    // wsCallbacks 集合 集中保存Remote Session Manager要一起传递的字段。
    const wsCallbacks: SessionsWebSocketCallbacks = {
      // 这个回调绑定到 onMessage: message => this.handleMessage(message),，负责Remote Session Manager在该局部场景下的响应。
      onMessage: message => this.handleMessage(message),
      // 这个回调绑定到 onConnected: () => {，负责Remote Session Manager在该局部场景下的响应。
      onConnected: () => {
        // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[RemoteSessionManager] Connected')
        // 调用 this.callbacks.onConnected?.()，完成这一处局部操作。
        this.callbacks.onConnected?.()
      },
      // 这个回调绑定到 onClose: () => {，负责Remote Session Manager在该局部场景下的响应。
      onClose: () => {
        // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[RemoteSessionManager] Disconnected')
        // 调用 this.callbacks.onDisconnected?.()，完成这一处局部操作。
        this.callbacks.onDisconnected?.()
      },
      // 这个回调绑定到 onReconnecting: () => {，负责Remote Session Manager在该局部场景下的响应。
      onReconnecting: () => {
        // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[RemoteSessionManager] Reconnecting')
        // 调用 this.callbacks.onReconnecting?.()，完成这一处局部操作。
        this.callbacks.onReconnecting?.()
      },
      // 这个回调绑定到 onError: error => {，负责Remote Session Manager在该局部场景下的响应。
      onError: error => {
        // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
        logError(error)
        // 调用 this.callbacks.onError?.(error)，完成这一处局部操作。
        this.callbacks.onError?.(error)
      },
    }

    // 更新实例字段 websocket 为 new SessionsWebSocket(，同步Remote Session Manager的内部状态。
    this.websocket = new SessionsWebSocket(
      this.config.sessionId,
      this.config.orgUuid,
      this.config.getAccessToken,
      wsCallbacks,
    )

    // 显式忽略 `this.websocket.connect()` 的返回值，只保留它触发的副作用。
    void this.websocket.connect()
  }

  /**
   * Handle messages from WebSocket
   */
  // Remote Session Manager在这里处理 `private handleMessage(`，完成这一小步状态转换。
  private handleMessage(
    message:
      | SDKMessage
      | SDKControlRequest
      | SDKControlResponse
      | SDKControlCancelRequest,
  ): void {
    // Handle control requests (permission prompts from CCR)
    // 当 `message.type` 匹配 `'control_request'` 时，Remote Session Manager执行对应分支。
    if (message.type === 'control_request') {
      // 调用 this.handleControlRequest，触发Remote Session Manager此处需要的副作用。
      this.handleControlRequest(message)
      // Remote Session Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Handle control cancel requests (server cancelling a pending permission prompt)
    // 当 `message.type` 匹配 `'control_cancel_request'` 时，Remote Session Manager执行对应分支。
    if (message.type === 'control_cancel_request') {
      // 从 `message` 解构 request_id，减少Remote Session Manager对同一对象的重复访问。
      const { request_id } = message
      // pendingRequest 请求数据读取`pendingPermissionRequests.get`，供Remote Session Manager后续处理使用。
      const pendingRequest = this.pendingPermissionRequests.get(request_id)
      // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[RemoteSessionManager] Permission request cancelled: ${request_id}`,
      )
      // 调用 this.pendingPermissionRequests.delete，触发Remote Session Manager此处需要的副作用。
      this.pendingPermissionRequests.delete(request_id)
      // Remote Session Manager在这里处理 `this.callbacks.onPermissionCancelled?.(`，完成这一小步状态转换。
      this.callbacks.onPermissionCancelled?.(
        request_id,
        pendingRequest?.tool_use_id,
      )
      // Remote Session Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Handle control responses (acknowledgments)
    // 当 `message.type` 匹配 `'control_response'` 时，Remote Session Manager执行对应分支。
    if (message.type === 'control_response') {
      // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[RemoteSessionManager] Received control response')
      // Remote Session Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Forward SDK messages to callback (type guard ensures proper narrowing)
    // 满足 `isSDKMessage(message)` 时，Remote Session Manager执行该分支。
    if (isSDKMessage(message)) {
      // 调用 this.callbacks.onMessage，触发Remote Session Manager此处需要的副作用。
      this.callbacks.onMessage(message)
    }
  }

  /**
   * Handle control requests from CCR (e.g., permission requests)
   */
  // Remote Session Manager在这里处理 `private handleControlRequest(request: SDKControlRequest): void {`，完成这一小步状态转换。
  private handleControlRequest(request: SDKControlRequest): void {
    // 从 `request` 解构 request_id、request，减少Remote Session Manager对同一对象的重复访问。
    const { request_id, request: inner } = request

    // 当 `inner.subtype` 匹配 `'can_use_tool'` 时，Remote Session Manager执行对应分支。
    if (inner.subtype === 'can_use_tool') {
      // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[RemoteSessionManager] Permission request for tool: ${inner.tool_name}`,
      )
      // this.pendingPermissionRequests.set 写入新的状态值，使Remote Session Manager后续读取保持一致。
      this.pendingPermissionRequests.set(request_id, inner)
      // 调用 this.callbacks.onPermissionRequest，触发Remote Session Manager此处需要的副作用。
      this.callbacks.onPermissionRequest(inner, request_id)
    } else {
      // Send an error response for unrecognized subtypes so the server
      // doesn't hang waiting for a reply that never comes.
      // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[RemoteSessionManager] Unsupported control request subtype: ${inner.subtype}`,
      )
      // 接口响应 集中保存Remote Session Manager要一起传递的字段。
      const response: SDKControlResponse = {
        type: 'control_response',
        response: {
          subtype: 'error',
          request_id,
          error: `Unsupported control request subtype: ${inner.subtype}`,
        },
      }
      // 调用 this.websocket?.sendControlResponse(response)，完成这一处局部操作。
      this.websocket?.sendControlResponse(response)
    }
  }

  /**
   * Send a user message to the remote session via HTTP POST
   */
  // Remote Session Manager在这里处理 `async sendMessage(`，完成这一小步状态转换。
  async sendMessage(
    content: RemoteMessageContent,
    opts?: { uuid?: string },
  ): Promise<boolean> {
    // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[RemoteSessionManager] Sending message to session ${this.config.sessionId}`,
    )

    // success 集合保存`sendEventToRemoteSession`，供Remote Session Manager后续处理使用。
    const success = await sendEventToRemoteSession(
      this.config.sessionId,
      content,
      opts,
    )

    // success 集合缺失时提前走兜底路径，避免Remote Session Manager继续依赖无效输入。
    if (!success) {
      // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `[RemoteSessionManager] Failed to send message to session ${this.config.sessionId}`,
        ),
      )
    }

    // 返回 `success`，作为Remote Session Manager这次计算的结果。
    return success
  }

  /**
   * Respond to a permission request from CCR
   */
  // 调用 respondToPermissionRequest，触发Remote Session Manager此处需要的副作用。
  respondToPermissionRequest(
    requestId: string,
    result: RemotePermissionResponse,
  ): void {
    // pendingRequest 请求数据读取`pendingPermissionRequests.get`，供Remote Session Manager后续处理使用。
    const pendingRequest = this.pendingPermissionRequests.get(requestId)
    // pendingRequest 请求数据缺失时提前走兜底路径，避免Remote Session Manager继续依赖无效输入。
    if (!pendingRequest) {
      // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `[RemoteSessionManager] No pending permission request with ID: ${requestId}`,
        ),
      )
      // Remote Session Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 this.pendingPermissionRequests.delete，触发Remote Session Manager此处需要的副作用。
    this.pendingPermissionRequests.delete(requestId)

    // 接口响应 集中保存Remote Session Manager要一起传递的字段。
    const response: SDKControlResponse = {
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: requestId,
        response: {
          behavior: result.behavior,
          ...(result.behavior === 'allow'
            ? { updatedInput: result.updatedInput }
            : { message: result.message }),
        },
      },
    }

    // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[RemoteSessionManager] Sending permission response: ${result.behavior}`,
    )

    // 调用 this.websocket?.sendControlResponse(response)，完成这一处局部操作。
    this.websocket?.sendControlResponse(response)
  }

  /**
   * Check if connected to the remote session
   */
  // isConnected 用 无 判断Remote Session Manager是否满足条件。
  isConnected(): boolean {
    // 返回 `this.websocket?.isConnected() ?? false`，作为Remote Session Manager这次计算的结果。
    return this.websocket?.isConnected() ?? false
  }

  /**
   * Send an interrupt signal to cancel the current request on the remote session
   */
  // cancelSession 使用 无 完成Remote Session Manager里的对应操作。
  cancelSession(): void {
    // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[RemoteSessionManager] Sending interrupt signal')
    // 调用 this.websocket?.sendControlRequest({ subtype: 'interrupt' })，完成这一处局部操作。
    this.websocket?.sendControlRequest({ subtype: 'interrupt' })
  }

  /**
   * Get the session ID
   */
  // getSessionId不依赖额外参数，直接计算Remote Session Manager需要的结果。
  getSessionId(): string {
    // 返回 `this.config.sessionId`，作为Remote Session Manager这次计算的结果。
    return this.config.sessionId
  }

  /**
   * Disconnect from the remote session
   */
  // disconnect 使用 无 完成Remote Session Manager里的对应操作。
  disconnect(): void {
    // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[RemoteSessionManager] Disconnecting')
    // 调用 this.websocket?.close()，完成这一处局部操作。
    this.websocket?.close()
    // 更新实例字段 websocket 为 null，同步Remote Session Manager的内部状态。
    this.websocket = null
    // 调用 this.pendingPermissionRequests.clear，触发Remote Session Manager此处需要的副作用。
    this.pendingPermissionRequests.clear()
  }

  /**
   * Force reconnect the WebSocket.
   * Useful when the subscription becomes stale after container shutdown.
   */
  // reconnect 使用 无 完成Remote Session Manager里的对应操作。
  reconnect(): void {
    // 记录Remote Session Manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[RemoteSessionManager] Reconnecting WebSocket')
    // 调用 this.websocket?.reconnect()，完成这一处局部操作。
    this.websocket?.reconnect()
  }
}

/**
 * Create a remote session config from OAuth tokens
 */
// createRemoteSessionConfig 封装RemoteSessionManager的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createRemoteSessionConfig(
  sessionId: string,
  // 这个回调绑定到 getAccessToken: () => string,，负责Remote Session Manager在该局部场景下的响应。
  getAccessToken: () => string,
  orgUuid: string,
  hasInitialPrompt = false,
  viewerOnly = false,
): RemoteSessionConfig {
  // 返回结构化结果，集中表达Remote Session Manager已经整理出的状态。
  return {
    sessionId,
    getAccessToken,
    orgUuid,
    hasInitialPrompt,
    viewerOnly,
  }
}
