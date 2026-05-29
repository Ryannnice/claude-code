// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 引入 getOauthConfig，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../constants/oauth.js'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准Sessions Web Socket的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让Sessions Web Socket后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlCancelRequest,
  SDKControlRequest,
  SDKControlRequestInner,
  SDKControlResponse,
} from '../entrypoints/sdk/controlTypes.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getWebSocketTLSOptions 工具函数，把通用处理留在 ../utils/mtls.js 中维护。
import { getWebSocketTLSOptions } from '../utils/mtls.js'
// 复用 getWebSocketProxyAgent、getWebSocketProxyUrl 工具函数，把通用处理留在 ../utils/proxy.js 中维护。
import { getWebSocketProxyAgent, getWebSocketProxyUrl } from '../utils/proxy.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'

// RECONNECT_DELAY_MS 集合保存`2000`，供后续判断或组装使用。
const RECONNECT_DELAY_MS = 2000
// MAX_RECONNECT_ATTEMPTS 集合保存`5`，供Sessions Web Socket后续判断或输出使用。
const MAX_RECONNECT_ATTEMPTS = 5
// PING_INTERVAL_MS 集合保存`30000`，供Sessions Web Socket后续判断或输出使用。
const PING_INTERVAL_MS = 30000

/**
 * Maximum retries for 4001 (session not found). During compaction the
 * server may briefly consider the session stale; a short retry window
 * lets the client recover without giving up permanently.
 */
// MAX_SESSION_NOT_FOUND_RETRIES 会话数据保存`3`，供Sessions Web Socket后续判断或输出使用。
const MAX_SESSION_NOT_FOUND_RETRIES = 3

/**
 * WebSocket close codes that indicate a permanent server-side rejection.
 * The client stops reconnecting immediately.
 * Note: 4001 (session not found) is handled separately with limited
 * retries since it can be transient during compaction.
 */
// PERMANENT_CLOSE_CODES 集合保存`Set`，供Sessions Web Socket后续处理使用。
const PERMANENT_CLOSE_CODES = new Set([
  4003, // unauthorized
])

// WebSocketState 固化Sessions Web Socket里传递的数据形状，帮助调用方按同一结构读写字段。
type WebSocketState = 'connecting' | 'connected' | 'closed'

// SessionsMessage 固化Sessions Web Socket里传递的数据形状，帮助调用方按同一结构读写字段。
type SessionsMessage =
  | SDKMessage
  | SDKControlRequest
  | SDKControlResponse
  | SDKControlCancelRequest

// isSessionsMessage 封装SessionsWebSocket的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSessionsMessage(value: unknown): value is SessionsMessage {
  // `typeof value` 与 `'object' || value === null || !...` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Accept any message with a string `type` field. Downstream handlers
  // (sdkMessageAdapter, RemoteSessionManager) decide what to do with
  // unknown types. A hardcoded allowlist here would silently drop new
  // message types the backend starts sending before the client is updated.
  // 返回 `typeof value.type === 'string'`，作为Sessions Web Socket这次计算的结果。
  return typeof value.type === 'string'
}

// SessionsWebSocketCallbacks 固化Sessions Web Socket里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionsWebSocketCallbacks = {
  // 这个回调绑定到 onMessage: (message: SessionsMessage) => void，负责Sessions Web Socket在该局部场景下的响应。
  onMessage: (message: SessionsMessage) => void
  onClose?: () => void
  onError?: (error: Error) => void
  onConnected?: () => void
  /** Fired when a transient close is detected and a reconnect is scheduled.
   *  onClose fires only for permanent close (server ended / attempts exhausted). */
  // 这个回调绑定到 onReconnecting?: () => void，负责Sessions Web Socket在该局部场景下的响应。
  onReconnecting?: () => void
}

// Common interface between globalThis.WebSocket and ws.WebSocket
// WebSocketLike 固化Sessions Web Socket里传递的数据形状，帮助调用方按同一结构读写字段。
type WebSocketLike = {
  close(): void
  send(data: string): void
  ping?(): void // Bun & ws both support this
}

/**
 * WebSocket client for connecting to CCR sessions via /v1/sessions/ws/{id}/subscribe
 *
 * Protocol:
 * 1. Connect to wss://api.anthropic.com/v1/sessions/ws/{sessionId}/subscribe?organization_uuid=...
 * 2. Send auth message: { type: 'auth', credential: { type: 'oauth', token: '...' } }
 * 3. Receive SDKMessage stream from the session
 */
// SessionsWebSocket 聚合Sessions Web Socket相关状态与操作，把同一职责的行为收束到类实例中。
export class SessionsWebSocket {
  private ws: WebSocketLike | null = null
  private state: WebSocketState = 'closed'
  private reconnectAttempts = 0
  private sessionNotFoundRetries = 0
  private pingInterval: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null

  // 构造函数初始化实例状态，确保Sessions Web Socket后续方法读取到完整配置。
  constructor(
    private readonly sessionId: string,
    private readonly orgUuid: string,
    // 这个回调绑定到 private readonly getAccessToken: () => string,，负责Sessions Web Socket在该局部场景下的响应。
    private readonly getAccessToken: () => string,
    private readonly callbacks: SessionsWebSocketCallbacks,
  ) {}

  /**
   * Connect to the sessions WebSocket endpoint
   */
  // connect 使用 无 完成Sessions Web Socket里的对应操作。
  async connect(): Promise<void> {
    // 当 `this.state` 匹配 `'connecting'` 时，Sessions Web Socket执行对应分支。
    if (this.state === 'connecting') {
      // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[SessionsWebSocket] Already connecting')
      // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 更新实例字段 state 为 'connecting'，同步Sessions Web Socket的内部状态。
    this.state = 'connecting'

    // baseUrl读取`getOauthConfig`，供Sessions Web Socket后续处理使用。
    const baseUrl = getOauthConfig().BASE_API_URL.replace('https://', 'wss://')
    // URL保存``${baseUrl}/v1/sessions/ws/${this.sessionId}/subscribe?or...`，作为后续固定文本处理的输入。
    const url = `${baseUrl}/v1/sessions/ws/${this.sessionId}/subscribe?organization_uuid=${this.orgUuid}`

    // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[SessionsWebSocket] Connecting to ${url}`)

    // Get fresh token for each connection attempt
    // accessToken读取`this.getAccessToken`，供Sessions Web Socket后续处理使用。
    const accessToken = this.getAccessToken()
    // 请求头 集中保存Sessions Web Socket要一起传递的字段。
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'anthropic-version': '2023-06-01',
    }

    // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof Bun !== 'undefined') {
      // Bun's WebSocket supports headers/proxy options but the DOM typings don't
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // ws 集合保存`globalThis.WebSocket`，供Sessions Web Socket后续处理使用。
      const ws = new globalThis.WebSocket(url, {
        headers,
        proxy: getWebSocketProxyUrl(url),
        tls: getWebSocketTLSOptions() || undefined,
      } as unknown as string[])
      // 更新实例字段 ws 为 ws，同步Sessions Web Socket的内部状态。
      this.ws = ws

      // 调用 ws.addEventListener，触发Sessions Web Socket此处需要的副作用。
      ws.addEventListener('open', () => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[SessionsWebSocket] Connection opened, authenticated via headers',
        )
        // 更新实例字段 state 为 'connected'，同步Sessions Web Socket的内部状态。
        this.state = 'connected'
        // 更新实例字段 reconnectAttempts 为 0，同步Sessions Web Socket的内部状态。
        this.reconnectAttempts = 0
        // 更新实例字段 sessionNotFoundRetries 为 0，同步Sessions Web Socket的内部状态。
        this.sessionNotFoundRetries = 0
        // 调用 this.startPingInterval，触发Sessions Web Socket此处需要的副作用。
        this.startPingInterval()
        // 调用 this.callbacks.onConnected?.()，完成这一处局部操作。
        this.callbacks.onConnected?.()
      })

      // 调用 ws.addEventListener，触发Sessions Web Socket此处需要的副作用。
      ws.addEventListener('message', (event: MessageEvent) => {
        // data 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const data =
          typeof event.data === 'string' ? event.data : String(event.data)
        // 调用 this.handleMessage，触发Sessions Web Socket此处需要的副作用。
        this.handleMessage(data)
      })

      // 调用 ws.addEventListener，触发Sessions Web Socket此处需要的副作用。
      ws.addEventListener('error', () => {
        // err保存`Error`，供Sessions Web Socket后续处理使用。
        const err = new Error('[SessionsWebSocket] WebSocket error')
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logError(err)
        // 调用 this.callbacks.onError?.(err)，完成这一处局部操作。
        this.callbacks.onError?.(err)
      })

      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 调用 ws.addEventListener，触发Sessions Web Socket此处需要的副作用。
      ws.addEventListener('close', (event: CloseEvent) => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SessionsWebSocket] Closed: code=${event.code} reason=${event.reason}`,
        )
        // 调用 this.handleClose，触发Sessions Web Socket此处需要的副作用。
        this.handleClose(event.code)
      })

      // 调用 ws.addEventListener，触发Sessions Web Socket此处需要的副作用。
      ws.addEventListener('pong', () => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[SessionsWebSocket] Pong received')
      })
    } else {
      // 从 `await import('ws')` 解构 default，减少Sessions Web Socket对同一对象的重复访问。
      const { default: WS } = await import('ws')
      // ws 集合保存`WS`，供Sessions Web Socket后续处理使用。
      const ws = new WS(url, {
        headers,
        agent: getWebSocketProxyAgent(url),
        ...getWebSocketTLSOptions(),
      })
      // 更新实例字段 ws 为 ws，同步Sessions Web Socket的内部状态。
      this.ws = ws

      // 调用 ws.on，触发Sessions Web Socket此处需要的副作用。
      ws.on('open', () => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[SessionsWebSocket] Connection opened, authenticated via headers',
        )
        // Auth is handled via headers, so we're immediately connected
        // 更新实例字段 state 为 'connected'，同步Sessions Web Socket的内部状态。
        this.state = 'connected'
        // 更新实例字段 reconnectAttempts 为 0，同步Sessions Web Socket的内部状态。
        this.reconnectAttempts = 0
        // 更新实例字段 sessionNotFoundRetries 为 0，同步Sessions Web Socket的内部状态。
        this.sessionNotFoundRetries = 0
        // 调用 this.startPingInterval，触发Sessions Web Socket此处需要的副作用。
        this.startPingInterval()
        // 调用 this.callbacks.onConnected?.()，完成这一处局部操作。
        this.callbacks.onConnected?.()
      })

      // 调用 ws.on，触发Sessions Web Socket此处需要的副作用。
      ws.on('message', (data: Buffer) => {
        // 调用 this.handleMessage，触发Sessions Web Socket此处需要的副作用。
        this.handleMessage(data.toString())
      })

      // 调用 ws.on，触发Sessions Web Socket此处需要的副作用。
      ws.on('error', (err: Error) => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logError(new Error(`[SessionsWebSocket] Error: ${err.message}`))
        // 调用 this.callbacks.onError?.(err)，完成这一处局部操作。
        this.callbacks.onError?.(err)
      })

      // 调用 ws.on，触发Sessions Web Socket此处需要的副作用。
      ws.on('close', (code: number, reason: Buffer) => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SessionsWebSocket] Closed: code=${code} reason=${reason.toString()}`,
        )
        // 调用 this.handleClose，触发Sessions Web Socket此处需要的副作用。
        this.handleClose(code)
      })

      // 调用 ws.on，触发Sessions Web Socket此处需要的副作用。
      ws.on('pong', () => {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[SessionsWebSocket] Pong received')
      })
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  // Sessions Web Socket在这里处理 `private handleMessage(data: string): void {`，完成这一小步状态转换。
  private handleMessage(data: string): void {
    // 保护这一段可能失败的Sessions Web Socket操作，确保异常能进入相邻错误处理。
    try {
      // 消息 命名 `jsonParse(data)`，让后续代码直接表达这个值的用途。
      const message: unknown = jsonParse(data)

      // Forward SDK messages to callback
      // 满足 `isSessionsMessage(message)` 时，Sessions Web Socket执行该分支。
      if (isSessionsMessage(message)) {
        // 调用 this.callbacks.onMessage，触发Sessions Web Socket此处需要的副作用。
        this.callbacks.onMessage(message)
      } else {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SessionsWebSocket] Ignoring message type: ${typeof message === 'object' && message !== null && 'type' in message ? String(message.type) : 'unknown'}`,
        )
      }
    } catch (error) {
      // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `[SessionsWebSocket] Failed to parse message: ${errorMessage(error)}`,
        ),
      )
    }
  }

  /**
   * Handle WebSocket close
   */
  // Sessions Web Socket在这里处理 `private handleClose(closeCode: number): void {`，完成这一小步状态转换。
  private handleClose(closeCode: number): void {
    // 调用 this.stopPingInterval，触发Sessions Web Socket此处需要的副作用。
    this.stopPingInterval()

    // 当 `this.state` 匹配 `'closed'` 时，Sessions Web Socket执行对应分支。
    if (this.state === 'closed') {
      // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 更新实例字段 ws 为 null，同步Sessions Web Socket的内部状态。
    this.ws = null

    // previousState 状态 命名 `this.state`，让后续代码直接表达这个值的用途。
    const previousState = this.state
    // 更新实例字段 state 为 'closed'，同步Sessions Web Socket的内部状态。
    this.state = 'closed'

    // Permanent codes: stop reconnecting — server has definitively ended the session
    // 满足 `PERMANENT_CLOSE_CODES.has(closeCode)` 时，Sessions Web Socket执行该分支。
    if (PERMANENT_CLOSE_CODES.has(closeCode)) {
      // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[SessionsWebSocket] Permanent close code ${closeCode}, not reconnecting`,
      )
      // 调用 this.callbacks.onClose?.()，完成这一处局部操作。
      this.callbacks.onClose?.()
      // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 4001 (session not found) can be transient during compaction: the
    // server may briefly consider the session stale while the CLI worker
    // is busy with the compaction API call and not emitting events.
    // 满足 `closeCode === 4001` 时，Sessions Web Socket执行该分支。
    if (closeCode === 4001) {
      // Sessions Web Socket在这里处理 `this.sessionNotFoundRetries++`，完成这一小步状态转换。
      this.sessionNotFoundRetries++
      // 满足 `this.sessionNotFoundRetries > MAX_SESSION_NOT_FOU` 时，Sessions Web Socket执行该分支。
      if (this.sessionNotFoundRetries > MAX_SESSION_NOT_FOUND_RETRIES) {
        // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[SessionsWebSocket] 4001 retry budget exhausted (${MAX_SESSION_NOT_FOUND_RETRIES}), not reconnecting`,
        )
        // 调用 this.callbacks.onClose?.()，完成这一处局部操作。
        this.callbacks.onClose?.()
        // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 this.scheduleReconnect，触发Sessions Web Socket此处需要的副作用。
      this.scheduleReconnect(
        RECONNECT_DELAY_MS * this.sessionNotFoundRetries,
        `4001 attempt ${this.sessionNotFoundRetries}/${MAX_SESSION_NOT_FOUND_RETRIES}`,
      )
      // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Attempt reconnection if we were connected
    // Sessions Web Socket在这里进入条件判断，后续代码按实际状态分流。
    if (
      previousState === 'connected' &&
      this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
    ) {
      // Sessions Web Socket在这里处理 `this.reconnectAttempts++`，完成这一小步状态转换。
      this.reconnectAttempts++
      // 调用 this.scheduleReconnect，触发Sessions Web Socket此处需要的副作用。
      this.scheduleReconnect(
        RECONNECT_DELAY_MS,
        `attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`,
      )
    } else {
      // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[SessionsWebSocket] Not reconnecting')
      // 调用 this.callbacks.onClose?.()，完成这一处局部操作。
      this.callbacks.onClose?.()
    }
  }

  // Sessions Web Socket在这里处理 `private scheduleReconnect(delay: number, label: string): void {`，完成这一小步状态转换。
  private scheduleReconnect(delay: number, label: string): void {
    // 调用 this.callbacks.onReconnecting?.()，完成这一处局部操作。
    this.callbacks.onReconnecting?.()
    // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SessionsWebSocket] Scheduling reconnect (${label}) in ${delay}ms`,
    )
    // 更新实例字段 reconnectTimer 为 setTimeout(() => {，同步Sessions Web Socket的内部状态。
    this.reconnectTimer = setTimeout(() => {
      // 更新实例字段 reconnectTimer 为 null，同步Sessions Web Socket的内部状态。
      this.reconnectTimer = null
      // 显式忽略 `this.connect()` 的返回值，只保留它触发的副作用。
      void this.connect()
    }, delay)
  }

  // Sessions Web Socket在这里处理 `private startPingInterval(): void {`，完成这一小步状态转换。
  private startPingInterval(): void {
    // 调用 this.stopPingInterval，触发Sessions Web Socket此处需要的副作用。
    this.stopPingInterval()

    // 更新实例字段 pingInterval 为 setInterval(() => {，同步Sessions Web Socket的内部状态。
    this.pingInterval = setInterval(() => {
      // 当 `this.ws && this.state` 匹配 `'connected'` 时，Sessions Web Socket执行对应分支。
      if (this.ws && this.state === 'connected') {
        // 保护这一段可能失败的Sessions Web Socket操作，确保异常能进入相邻错误处理。
        try {
          // 调用 this.ws.ping?.()，完成这一处局部操作。
          this.ws.ping?.()
        } catch {
          // Ignore ping errors, close handler will deal with connection issues
        }
      }
    }, PING_INTERVAL_MS)
  }

  /**
   * Stop ping interval
   */
  // Sessions Web Socket在这里处理 `private stopPingInterval(): void {`，完成这一小步状态转换。
  private stopPingInterval(): void {
    // 满足 `this.pingInterval` 时，Sessions Web Socket执行该分支。
    if (this.pingInterval) {
      // 调用 clearInterval，触发Sessions Web Socket此处需要的副作用。
      clearInterval(this.pingInterval)
      // 更新实例字段 pingInterval 为 null，同步Sessions Web Socket的内部状态。
      this.pingInterval = null
    }
  }

  /**
   * Send a control response back to the session
   */
  // sendControlResponse 使用 response: SDKControlResponse 完成Sessions Web Socket里的对应操作。
  sendControlResponse(response: SDKControlResponse): void {
    // `!this.ws || this.state` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.state !== 'connected') {
      // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
      logError(new Error('[SessionsWebSocket] Cannot send: not connected'))
      // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[SessionsWebSocket] Sending control response')
    // 调用 this.ws.send，触发Sessions Web Socket此处需要的副作用。
    this.ws.send(jsonStringify(response))
  }

  /**
   * Send a control request to the session (e.g., interrupt)
   */
  // sendControlRequest 使用 request: SDKControlRequestInner 完成Sessions Web Socket里的对应操作。
  sendControlRequest(request: SDKControlRequestInner): void {
    // `!this.ws || this.state` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.state !== 'connected') {
      // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
      logError(new Error('[SessionsWebSocket] Cannot send: not connected'))
      // Sessions Web Socket在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // controlRequest 请求数据 集中保存Sessions Web Socket要一起传递的字段。
    const controlRequest: SDKControlRequest = {
      type: 'control_request',
      request_id: randomUUID(),
      request,
    }

    // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[SessionsWebSocket] Sending control request: ${request.subtype}`,
    )
    // 调用 this.ws.send，触发Sessions Web Socket此处需要的副作用。
    this.ws.send(jsonStringify(controlRequest))
  }

  /**
   * Check if connected
   */
  // isConnected 用 无 判断Sessions Web Socket是否满足条件。
  isConnected(): boolean {
    // 返回 `this.state === 'connected'`，作为Sessions Web Socket这次计算的结果。
    return this.state === 'connected'
  }

  /**
   * Close the WebSocket connection
   */
  // close 使用 无 完成Sessions Web Socket里的对应操作。
  close(): void {
    // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[SessionsWebSocket] Closing connection')
    // 更新实例字段 state 为 'closed'，同步Sessions Web Socket的内部状态。
    this.state = 'closed'
    // 调用 this.stopPingInterval，触发Sessions Web Socket此处需要的副作用。
    this.stopPingInterval()

    // 满足 `this.reconnectTimer` 时，Sessions Web Socket执行该分支。
    if (this.reconnectTimer) {
      // 调用 clearTimeout，触发Sessions Web Socket此处需要的副作用。
      clearTimeout(this.reconnectTimer)
      // 更新实例字段 reconnectTimer 为 null，同步Sessions Web Socket的内部状态。
      this.reconnectTimer = null
    }

    // 满足 `this.ws` 时，Sessions Web Socket执行该分支。
    if (this.ws) {
      // Null out event handlers to prevent race conditions during reconnect.
      // Under Bun (native WebSocket), onX handlers are the clean way to detach.
      // Under Node (ws package), the listeners were attached with .on() in connect(),
      // but since we're about to close and null out this.ws, no cleanup is needed.
      // 调用 this.ws.close，触发Sessions Web Socket此处需要的副作用。
      this.ws.close()
      // 更新实例字段 ws 为 null，同步Sessions Web Socket的内部状态。
      this.ws = null
    }
  }

  /**
   * Force reconnect - closes existing connection and establishes a new one.
   * Useful when the subscription becomes stale (e.g., after container shutdown).
   */
  // reconnect 使用 无 完成Sessions Web Socket里的对应操作。
  reconnect(): void {
    // 记录Sessions Web Socket运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[SessionsWebSocket] Force reconnecting')
    // 更新实例字段 reconnectAttempts 为 0，同步Sessions Web Socket的内部状态。
    this.reconnectAttempts = 0
    // 更新实例字段 sessionNotFoundRetries 为 0，同步Sessions Web Socket的内部状态。
    this.sessionNotFoundRetries = 0
    // 调用 this.close，触发Sessions Web Socket此处需要的副作用。
    this.close()
    // Small delay before reconnecting (stored in reconnectTimer so it can be cancelled)
    // 更新实例字段 reconnectTimer 为 setTimeout(() => {，同步Sessions Web Socket的内部状态。
    this.reconnectTimer = setTimeout(() => {
      // 更新实例字段 reconnectTimer 为 null，同步Sessions Web Socket的内部状态。
      this.reconnectTimer = null
      // 显式忽略 `this.connect()` 的返回值，只保留它触发的副作用。
      void this.connect()
    }, 500)
  }
}
