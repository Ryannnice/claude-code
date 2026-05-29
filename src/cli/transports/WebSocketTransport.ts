// 类型依赖 { StdoutMessage } 来自 src/entrypoints/sdk/controlTypes.js，用于校准Web Socket Transport的数据契约。
import type { StdoutMessage } from 'src/entrypoints/sdk/controlTypes.js'
// 类型依赖 WsWebSocket 来自 ws，用于校准Web Socket Transport的数据契约。
import type WsWebSocket from 'ws'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js'
// 复用 CircularBuffer 工具函数，把通用处理留在 ../../utils/CircularBuffer.js 中维护。
import { CircularBuffer } from '../../utils/CircularBuffer.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 getWebSocketTLSOptions 工具函数，把通用处理留在 ../../utils/mtls.js 中维护。
import { getWebSocketTLSOptions } from '../../utils/mtls.js'
// 整理这一组导入，让Web Socket Transport后续逻辑可以直接复用这些外部能力。
import {
  getWebSocketProxyAgent,
  getWebSocketProxyUrl,
} from '../../utils/proxy.js'
// 整理这一组导入，让Web Socket Transport后续逻辑可以直接复用这些外部能力。
import {
  registerSessionActivityCallback,
  unregisterSessionActivityCallback,
} from '../../utils/sessionActivity.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 类型依赖 { Transport } 来自 ./Transport.js，用于校准Web Socket Transport的数据契约。
import type { Transport } from './Transport.js'

// KEEP_ALIVE_FRAME保存`'{"type":"keep_alive"}\n'`，作为后续固定文本处理的输入。
const KEEP_ALIVE_FRAME = '{"type":"keep_alive"}\n'

// DEFAULT_MAX_BUFFER_SIZE保存`1000`，供Web Socket Transport后续判断或输出使用。
const DEFAULT_MAX_BUFFER_SIZE = 1000
// DEFAULT_BASE_RECONNECT_DELAY保存`1000`，供Web Socket Transport后续判断或输出使用。
const DEFAULT_BASE_RECONNECT_DELAY = 1000
// DEFAULT_MAX_RECONNECT_DELAY 命名 `30000`，让后续代码直接表达这个值的用途。
const DEFAULT_MAX_RECONNECT_DELAY = 30000
/** Time budget for reconnection attempts before giving up (10 minutes). */
// DEFAULT_RECONNECT_GIVE_UP_MS 集合保存`600_000`，供Web Socket Transport后续判断或输出使用。
const DEFAULT_RECONNECT_GIVE_UP_MS = 600_000
// DEFAULT_PING_INTERVAL保存`10000`，供Web Socket Transport后续判断或输出使用。
const DEFAULT_PING_INTERVAL = 10000
// DEFAULT_KEEPALIVE_INTERVAL 命名 `300_000 // 5 minutes`，让后续代码直接表达这个值的用途。
const DEFAULT_KEEPALIVE_INTERVAL = 300_000 // 5 minutes

/**
 * Threshold for detecting system sleep/wake. If the gap between consecutive
 * reconnection attempts exceeds this, the machine likely slept. We reset
 * the reconnection budget and retry — the server will reject with permanent
 * close codes (4001/1002) if the session was reaped during sleep.
 */
// SLEEP_DETECTION_THRESHOLD_MS 集合保存`DEFAULT_MAX_RECONNECT_DELAY * 2 // 60s`，供后续判断或组装使用。
const SLEEP_DETECTION_THRESHOLD_MS = DEFAULT_MAX_RECONNECT_DELAY * 2 // 60s

/**
 * WebSocket close codes that indicate a permanent server-side rejection.
 * The transport transitions to 'closed' immediately without retrying.
 */
// PERMANENT_CLOSE_CODES 集合保存`Set`，供Web Socket Transport后续处理使用。
const PERMANENT_CLOSE_CODES = new Set([
  1002, // protocol error — server rejected handshake (e.g. session reaped)
  4001, // session expired / not found
  4003, // unauthorized
])

// WebSocketTransportOptions 固化Web Socket Transport里传递的数据形状，帮助调用方按同一结构读写字段。
export type WebSocketTransportOptions = {
  /** When false, the transport does not attempt automatic reconnection on
   *  disconnect. Use this when the caller has its own recovery mechanism
   *  (e.g. the REPL bridge poll loop). Defaults to true. */
  autoReconnect?: boolean
  /** Gates the tengu_ws_transport_* telemetry events. Set true at the
   *  REPL-bridge construction site so only Remote Control sessions (the
   *  Cloudflare-idle-timeout population) emit; print-mode workers stay
   *  silent. Defaults to false. */
  isBridge?: boolean
}

// WebSocketTransportState 固化Web Socket Transport里传递的数据形状，帮助调用方按同一结构读写字段。
type WebSocketTransportState =
  | 'idle'
  | 'connected'
  | 'reconnecting'
  | 'closing'
  | 'closed'

// Common interface between globalThis.WebSocket and ws.WebSocket
// WebSocketLike 固化Web Socket Transport里传递的数据形状，帮助调用方按同一结构读写字段。
type WebSocketLike = {
  close(): void
  send(data: string): void
  ping?(): void // Bun & ws both support this
}

// WebSocketTransport 聚合Web Socket Transport相关状态与操作，把同一职责的行为收束到类实例中。
export class WebSocketTransport implements Transport {
  private ws: WebSocketLike | null = null
  private lastSentId: string | null = null
  protected url: URL
  protected state: WebSocketTransportState = 'idle'
  // 这个回调绑定到 protected onData?: (data: string) => void，负责Web Socket Transport在该局部场景下的响应。
  protected onData?: (data: string) => void
  // 这个回调绑定到 private onCloseCallback?: (closeCode?: number) => void，负责Web Socket Transport在该局部场景下的响应。
  private onCloseCallback?: (closeCode?: number) => void
  // 这个回调绑定到 private onConnectCallback?: () => void，负责Web Socket Transport在该局部场景下的响应。
  private onConnectCallback?: () => void
  private headers: Record<string, string>
  private sessionId?: string
  private autoReconnect: boolean
  private isBridge: boolean

  // Reconnection state
  private reconnectAttempts = 0
  private reconnectStartTime: number | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private lastReconnectAttemptTime: number | null = null
  // Wall-clock of last WS data-frame activity (inbound message or outbound
  // ws.send). Used to compute idle time at close — the signal for diagnosing
  // proxy idle-timeout RSTs (e.g. Cloudflare 5-min). Excludes ping/pong
  // control frames (proxies don't count those).
  private lastActivityTime = 0

  // Ping interval for connection health checks
  private pingInterval: NodeJS.Timeout | null = null
  private pongReceived = true

  // Periodic keep_alive data frames to reset proxy idle timers
  private keepAliveInterval: NodeJS.Timeout | null = null

  // Message buffering for replay on reconnection
  private messageBuffer: CircularBuffer<StdoutMessage>
  // Track which runtime's WS we're using so we can detach listeners
  // with the matching API (removeEventListener vs. off).
  private isBunWs = false

  // Captured at connect() time for handleOpenEvent timing. Stored as an
  // instance field so the onOpen handler can be a stable class-property
  // arrow function (removable in doDisconnect) instead of a closure over
  // a local variable.
  private connectStartTime = 0

  // 这个回调绑定到 private refreshHeaders?: () => Record<string, string>，负责Web Socket Transport在该局部场景下的响应。
  private refreshHeaders?: () => Record<string, string>

  // 构造函数初始化实例状态，确保Web Socket Transport后续方法读取到完整配置。
  constructor(
    url: URL,
    headers: Record<string, string> = {},
    sessionId?: string,
    // 这个回调绑定到 refreshHeaders?: () => Record<string, string>,，负责Web Socket Transport在该局部场景下的响应。
    refreshHeaders?: () => Record<string, string>,
    options?: WebSocketTransportOptions,
  ) {
    // 更新实例字段 url 为 url，同步Web Socket Transport的内部状态。
    this.url = url
    // 更新实例字段 headers 为 headers，同步Web Socket Transport的内部状态。
    this.headers = headers
    // 更新实例字段 sessionId 为 sessionId，同步Web Socket Transport的内部状态。
    this.sessionId = sessionId
    // 更新实例字段 refreshHeaders 为 refreshHeaders，同步Web Socket Transport的内部状态。
    this.refreshHeaders = refreshHeaders
    // 更新实例字段 autoReconnect 为 options?.autoReconnect ?? true，同步Web Socket Transport的内部状态。
    this.autoReconnect = options?.autoReconnect ?? true
    // 更新实例字段 isBridge 为 options?.isBridge ?? false，同步Web Socket Transport的内部状态。
    this.isBridge = options?.isBridge ?? false
    // 更新实例字段 messageBuffer 为 new CircularBuffer(DEFAULT_MAX_BUFFER_SIZE)，同步Web Socket Transport的内部状态。
    this.messageBuffer = new CircularBuffer(DEFAULT_MAX_BUFFER_SIZE)
  }

  // Web Socket Transport在这里处理 `public async connect(): Promise<void> {`，完成这一小步状态转换。
  public async connect(): Promise<void> {
    // `this.state` 与 `'idle' && this.state !== 'recon...` 不一致时刷新派生状态，避免使用过期结果。
    if (this.state !== 'idle' && this.state !== 'reconnecting') {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WebSocketTransport: Cannot connect, current state is ${this.state}`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_websocket_connect_failed')
      // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 更新实例字段 state 为 'reconnecting'，同步Web Socket Transport的内部状态。
    this.state = 'reconnecting'

    // 更新实例字段 connectStartTime 为 Date.now()，同步Web Socket Transport的内部状态。
    this.connectStartTime = Date.now()
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`WebSocketTransport: Opening ${this.url.href}`)
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_websocket_connect_opening')

    // Start with provided headers and add runtime headers
    // 请求头 集中保存Web Socket Transport要一起传递的字段。
    const headers = { ...this.headers }
    // 满足 `this.lastSentId` 时，Web Socket Transport执行该分支。
    if (this.lastSentId) {
      // headers['X-Last-Request-Id' 请求数据更新为 `this.lastSentId`，确保Web Socket Transport后续读取最新状态。
      headers['X-Last-Request-Id'] = this.lastSentId
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WebSocketTransport: Adding X-Last-Request-Id header: ${this.lastSentId}`,
      )
    }

    // `typeof Bun` 与 `'undefined'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof Bun !== 'undefined') {
      // Bun's WebSocket supports headers/proxy options but the DOM typings don't
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // ws 集合保存`globalThis.WebSocket`，供Web Socket Transport后续处理使用。
      const ws = new globalThis.WebSocket(this.url.href, {
        headers,
        proxy: getWebSocketProxyUrl(this.url.href),
        tls: getWebSocketTLSOptions() || undefined,
      } as unknown as string[])
      // 更新实例字段 ws 为 ws，同步Web Socket Transport的内部状态。
      this.ws = ws
      // 更新实例字段 isBunWs 为 true，同步Web Socket Transport的内部状态。
      this.isBunWs = true

      // 调用 ws.addEventListener，触发Web Socket Transport此处需要的副作用。
      ws.addEventListener('open', this.onBunOpen)
      // 调用 ws.addEventListener，触发Web Socket Transport此处需要的副作用。
      ws.addEventListener('message', this.onBunMessage)
      // 调用 ws.addEventListener，触发Web Socket Transport此处需要的副作用。
      ws.addEventListener('error', this.onBunError)
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 调用 ws.addEventListener，触发Web Socket Transport此处需要的副作用。
      ws.addEventListener('close', this.onBunClose)
      // 'pong' is Bun-specific — not in DOM typings.
      // 调用 ws.addEventListener，触发Web Socket Transport此处需要的副作用。
      ws.addEventListener('pong', this.onPong)
    } else {
      // 从 `await import('ws')` 解构 default，减少Web Socket Transport对同一对象的重复访问。
      const { default: WS } = await import('ws')
      // ws 集合保存`WS`，供Web Socket Transport后续处理使用。
      const ws = new WS(this.url.href, {
        headers,
        agent: getWebSocketProxyAgent(this.url.href),
        ...getWebSocketTLSOptions(),
      })
      // 更新实例字段 ws 为 ws，同步Web Socket Transport的内部状态。
      this.ws = ws
      // 更新实例字段 isBunWs 为 false，同步Web Socket Transport的内部状态。
      this.isBunWs = false

      // 调用 ws.on，触发Web Socket Transport此处需要的副作用。
      ws.on('open', this.onNodeOpen)
      // 调用 ws.on，触发Web Socket Transport此处需要的副作用。
      ws.on('message', this.onNodeMessage)
      // 调用 ws.on，触发Web Socket Transport此处需要的副作用。
      ws.on('error', this.onNodeError)
      // 调用 ws.on，触发Web Socket Transport此处需要的副作用。
      ws.on('close', this.onNodeClose)
      // 调用 ws.on，触发Web Socket Transport此处需要的副作用。
      ws.on('pong', this.onPong)
    }
  }

  // --- Bun (native WebSocket) event handlers ---
  // Stored as class-property arrow functions so they can be removed in
  // doDisconnect(). Without removal, each reconnect orphans the old WS
  // object + its 5 closures until GC, which accumulates under network
  // instability. Mirrors the pattern in src/utils/mcpWebSocketTransport.ts.

  // 这个回调绑定到 private onBunOpen = () => {，负责Web Socket Transport在该局部场景下的响应。
  private onBunOpen = () => {
    // 调用 this.handleOpenEvent，触发Web Socket Transport此处需要的副作用。
    this.handleOpenEvent()
    // Bun's WebSocket doesn't expose upgrade response headers,
    // so replay all buffered messages. The server deduplicates by UUID.
    // 满足 `this.lastSentId` 时，Web Socket Transport执行该分支。
    if (this.lastSentId) {
      // 调用 this.replayBufferedMessages，触发Web Socket Transport此处需要的副作用。
      this.replayBufferedMessages('')
    }
  }

  // 这个回调绑定到 private onBunMessage = (event: MessageEvent) => {，负责Web Socket Transport在该局部场景下的响应。
  private onBunMessage = (event: MessageEvent) => {
    // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const message =
      typeof event.data === 'string' ? event.data : String(event.data)
    // 更新实例字段 lastActivityTime 为 Date.now()，同步Web Socket Transport的内部状态。
    this.lastActivityTime = Date.now()
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_websocket_message_received', {
      length: message.length,
    })
    // 满足 `this.onData` 时，Web Socket Transport执行该分支。
    if (this.onData) {
      // 调用 this.onData，触发Web Socket Transport此处需要的副作用。
      this.onData(message)
    }
  }

  // 这个回调绑定到 private onBunError = () => {，负责Web Socket Transport在该局部场景下的响应。
  private onBunError = () => {
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging('WebSocketTransport: Error', {
      level: 'error',
    })
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_websocket_connect_error')
    // close event fires after error — let it call handleConnectionError
  }

  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  // 这个回调绑定到 private onBunClose = (event: CloseEvent) => {，负责Web Socket Transport在该局部场景下的响应。
  private onBunClose = (event: CloseEvent) => {
    // isClean标记Web Socket Transport是否启用对应路径。
    const isClean = event.code === 1000 || event.code === 1001
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `WebSocketTransport: Closed: ${event.code}`,
      isClean ? undefined : { level: 'error' },
    )
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_websocket_connect_closed')
    // 调用 this.handleConnectionError，触发Web Socket Transport此处需要的副作用。
    this.handleConnectionError(event.code)
  }

  // --- Node (ws package) event handlers ---

  // 这个回调绑定到 private onNodeOpen = () => {，负责Web Socket Transport在该局部场景下的响应。
  private onNodeOpen = () => {
    // Capture ws before handleOpenEvent() invokes onConnectCallback — if the
    // callback synchronously closes the transport, this.ws becomes null.
    // The old inline-closure code had this safety implicitly via closure capture.
    // ws 集合保存`this.ws`，供Web Socket Transport后续判断或输出使用。
    const ws = this.ws
    // 调用 this.handleOpenEvent，触发Web Socket Transport此处需要的副作用。
    this.handleOpenEvent()
    // ws 集合缺失时提前走兜底路径，避免Web Socket Transport继续依赖无效输入。
    if (!ws) return
    // Check for last-id in upgrade response headers (ws package only)
    // nws 集合保存`ws as unknown as WsWebSocket & {`，供后续判断或组装使用。
    const nws = ws as unknown as WsWebSocket & {
      upgradeReq?: { headers?: Record<string, string> }
    }
    // upgradeResponse 响应数据保存`nws.upgradeReq`，供Web Socket Transport后续判断或输出使用。
    const upgradeResponse = nws.upgradeReq
    // 满足 `upgradeResponse?.headers?.['x-last-request-id']` 时，Web Socket Transport执行该分支。
    if (upgradeResponse?.headers?.['x-last-request-id']) {
      // serverLastId保存`upgradeResponse.headers['x-last-request-id']`，供Web Socket Transport后续判断或输出使用。
      const serverLastId = upgradeResponse.headers['x-last-request-id']
      // 调用 this.replayBufferedMessages，触发Web Socket Transport此处需要的副作用。
      this.replayBufferedMessages(serverLastId)
    }
  }

  // 这个回调绑定到 private onNodeMessage = (data: Buffer) => {，负责Web Socket Transport在该局部场景下的响应。
  private onNodeMessage = (data: Buffer) => {
    // 消息格式化`data.toString`，供Web Socket Transport后续处理使用。
    const message = data.toString()
    // 更新实例字段 lastActivityTime 为 Date.now()，同步Web Socket Transport的内部状态。
    this.lastActivityTime = Date.now()
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_websocket_message_received', {
      length: message.length,
    })
    // 满足 `this.onData` 时，Web Socket Transport执行该分支。
    if (this.onData) {
      // 调用 this.onData，触发Web Socket Transport此处需要的副作用。
      this.onData(message)
    }
  }

  // 这个回调绑定到 private onNodeError = (err: Error) => {，负责Web Socket Transport在该局部场景下的响应。
  private onNodeError = (err: Error) => {
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`WebSocketTransport: Error: ${err.message}`, {
      level: 'error',
    })
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_websocket_connect_error')
    // close event fires after error — let it call handleConnectionError
  }

  // 这个回调绑定到 private onNodeClose = (code: number, _reason: Buffer) => {，负责Web Socket Transport在该局部场景下的响应。
  private onNodeClose = (code: number, _reason: Buffer) => {
    // isClean标记Web Socket Transport是否启用对应路径。
    const isClean = code === 1000 || code === 1001
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `WebSocketTransport: Closed: ${code}`,
      isClean ? undefined : { level: 'error' },
    )
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('error', 'cli_websocket_connect_closed')
    // 调用 this.handleConnectionError，触发Web Socket Transport此处需要的副作用。
    this.handleConnectionError(code)
  }

  // --- Shared handlers ---

  // 这个回调绑定到 private onPong = () => {，负责Web Socket Transport在该局部场景下的响应。
  private onPong = () => {
    // 更新实例字段 pongReceived 为 true，同步Web Socket Transport的内部状态。
    this.pongReceived = true
  }

  // Web Socket Transport在这里处理 `private handleOpenEvent(): void {`，完成这一小步状态转换。
  private handleOpenEvent(): void {
    // connectDuration记录时间`Date.now`，供Web Socket Transport后续处理使用。
    const connectDuration = Date.now() - this.connectStartTime
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging('WebSocketTransport: Connected')
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_websocket_connect_connected', {
      duration_ms: connectDuration,
    })

    // Reconnect success — capture attempt count + downtime before resetting.
    // reconnectStartTime is null on first connect, non-null on reopen.
    // `this.isBridge && this.reconnectStartTime` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (this.isBridge && this.reconnectStartTime !== null) {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ws_transport_reconnected', {
        attempts: this.reconnectAttempts,
        downtimeMs: Date.now() - this.reconnectStartTime,
      })
    }

    // 更新实例字段 reconnectAttempts 为 0，同步Web Socket Transport的内部状态。
    this.reconnectAttempts = 0
    // 更新实例字段 reconnectStartTime 为 null，同步Web Socket Transport的内部状态。
    this.reconnectStartTime = null
    // 更新实例字段 lastReconnectAttemptTime 为 null，同步Web Socket Transport的内部状态。
    this.lastReconnectAttemptTime = null
    // 更新实例字段 lastActivityTime 为 Date.now()，同步Web Socket Transport的内部状态。
    this.lastActivityTime = Date.now()
    // 更新实例字段 state 为 'connected'，同步Web Socket Transport的内部状态。
    this.state = 'connected'
    // 调用 this.onConnectCallback?.()，完成这一处局部操作。
    this.onConnectCallback?.()

    // Start periodic pings to detect dead connections
    // 调用 this.startPingInterval，触发Web Socket Transport此处需要的副作用。
    this.startPingInterval()

    // Start periodic keep_alive data frames to reset proxy idle timers
    // 调用 this.startKeepaliveInterval，触发Web Socket Transport此处需要的副作用。
    this.startKeepaliveInterval()

    // Register callback for session activity signals
    // 调用 registerSessionActivityCallback，触发Web Socket Transport此处需要的副作用。
    registerSessionActivityCallback(() => {
      // 显式忽略 `this.write({ type: 'keep_alive' })` 的返回值，只保留它触发的副作用。
      void this.write({ type: 'keep_alive' })
    })
  }

  // Web Socket Transport在这里处理 `protected sendLine(line: string): boolean {`，完成这一小步状态转换。
  protected sendLine(line: string): boolean {
    // `!this.ws || this.state` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.state !== 'connected') {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging('WebSocketTransport: Not connected')
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_websocket_send_not_connected')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 保护这一段可能失败的Web Socket Transport操作，确保异常能进入相邻错误处理。
    try {
      // 调用 this.ws.send，触发Web Socket Transport此处需要的副作用。
      this.ws.send(line)
      // 更新实例字段 lastActivityTime 为 Date.now()，同步Web Socket Transport的内部状态。
      this.lastActivityTime = Date.now()
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch (error) {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`WebSocketTransport: Failed to send: ${error}`, {
        level: 'error',
      })
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_websocket_send_error')
      // Don't null this.ws here — let doDisconnect() (via handleConnectionError)
      // handle cleanup so listeners are removed before the WS is released.
      // 调用 this.handleConnectionError，触发Web Socket Transport此处需要的副作用。
      this.handleConnectionError()
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  /**
   * Remove all listeners attached in connect() for the given WebSocket.
   * Without this, each reconnect orphans the old WS object + its closures
   * until GC — these accumulate under network instability. Mirrors the
   * pattern in src/utils/mcpWebSocketTransport.ts.
   */
  // Web Socket Transport在这里处理 `private removeWsListeners(ws: WebSocketLike): void {`，完成这一小步状态转换。
  private removeWsListeners(ws: WebSocketLike): void {
    // 满足 `this.isBunWs` 时，Web Socket Transport执行该分支。
    if (this.isBunWs) {
      // nws 集合保存`ws as unknown as globalThis.WebSocket`，供后续判断或组装使用。
      const nws = ws as unknown as globalThis.WebSocket
      // 调用 nws.removeEventListener，触发Web Socket Transport此处需要的副作用。
      nws.removeEventListener('open', this.onBunOpen)
      // 调用 nws.removeEventListener，触发Web Socket Transport此处需要的副作用。
      nws.removeEventListener('message', this.onBunMessage)
      // 调用 nws.removeEventListener，触发Web Socket Transport此处需要的副作用。
      nws.removeEventListener('error', this.onBunError)
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 调用 nws.removeEventListener，触发Web Socket Transport此处需要的副作用。
      nws.removeEventListener('close', this.onBunClose)
      // 'pong' is Bun-specific — not in DOM typings
      // 调用 nws.removeEventListener，触发Web Socket Transport此处需要的副作用。
      nws.removeEventListener('pong' as 'message', this.onPong)
    } else {
      // nws 集合保存`ws as unknown as WsWebSocket`，供后续判断或组装使用。
      const nws = ws as unknown as WsWebSocket
      // 调用 nws.off，触发Web Socket Transport此处需要的副作用。
      nws.off('open', this.onNodeOpen)
      // 调用 nws.off，触发Web Socket Transport此处需要的副作用。
      nws.off('message', this.onNodeMessage)
      // 调用 nws.off，触发Web Socket Transport此处需要的副作用。
      nws.off('error', this.onNodeError)
      // 调用 nws.off，触发Web Socket Transport此处需要的副作用。
      nws.off('close', this.onNodeClose)
      // 调用 nws.off，触发Web Socket Transport此处需要的副作用。
      nws.off('pong', this.onPong)
    }
  }

  // Web Socket Transport在这里处理 `protected doDisconnect(): void {`，完成这一小步状态转换。
  protected doDisconnect(): void {
    // Stop pinging and keepalive when disconnecting
    // 调用 this.stopPingInterval，触发Web Socket Transport此处需要的副作用。
    this.stopPingInterval()
    // 调用 this.stopKeepaliveInterval，触发Web Socket Transport此处需要的副作用。
    this.stopKeepaliveInterval()

    // Unregister session activity callback
    // 调用 unregisterSessionActivityCallback，触发Web Socket Transport此处需要的副作用。
    unregisterSessionActivityCallback()

    // 满足 `this.ws` 时，Web Socket Transport执行该分支。
    if (this.ws) {
      // Remove listeners BEFORE close() so the old WS + closures can be
      // GC'd promptly instead of lingering until the next mark-and-sweep.
      // 调用 this.removeWsListeners，触发Web Socket Transport此处需要的副作用。
      this.removeWsListeners(this.ws)
      // 调用 this.ws.close，触发Web Socket Transport此处需要的副作用。
      this.ws.close()
      // 更新实例字段 ws 为 null，同步Web Socket Transport的内部状态。
      this.ws = null
    }
  }

  // Web Socket Transport在这里处理 `private handleConnectionError(closeCode?: number): void {`，完成这一小步状态转换。
  private handleConnectionError(closeCode?: number): void {
    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `WebSocketTransport: Disconnected from ${this.url.href}` +
        (closeCode != null ? ` (code ${closeCode})` : ''),
    )
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_websocket_disconnected')
    // 满足 `this.isBridge` 时，Web Socket Transport执行该分支。
    if (this.isBridge) {
      // Fire on every close — including intermediate ones during a reconnect
      // storm (those never surface to the onCloseCallback consumer). For the
      // Cloudflare-5min-idle hypothesis: cluster msSinceLastActivity; if the
      // peak sits at ~300s with closeCode 1006, that's the proxy RST.
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ws_transport_closed', {
        closeCode,
        msSinceLastActivity:
          this.lastActivityTime > 0 ? Date.now() - this.lastActivityTime : -1,
        // 'connected' = healthy drop (the Cloudflare case); 'reconnecting' =
        // connect-rejection mid-storm. State isn't mutated until the branches
        // below, so this reads the pre-close value.
        wasConnected: this.state === 'connected',
        reconnectAttempts: this.reconnectAttempts,
      })
    }
    // 调用 this.doDisconnect，触发Web Socket Transport此处需要的副作用。
    this.doDisconnect()

    // 当 `this.state` 匹配 `'closing' || this.state ===...` 时，Web Socket Transport执行对应分支。
    if (this.state === 'closing' || this.state === 'closed') return

    // Permanent codes: don't retry — server has definitively ended the session.
    // Exception: 4003 (unauthorized) can be retried when refreshHeaders is
    // available and returns a new token (e.g. after the parent process mints
    // a fresh session ingress token during reconnection).
    // headersRefreshed标记Web Socket Transport是否启用对应路径。
    let headersRefreshed = false
    // 组合条件 `closeCode === 4003 && this.refreshHeaders` 成立时，Web Socket Transport才启用这条专门路径。
    if (closeCode === 4003 && this.refreshHeaders) {
      // freshHeaders 集合保存`this.refreshHeaders`，供Web Socket Transport后续处理使用。
      const freshHeaders = this.refreshHeaders()
      // `freshHeaders.Authorization` 与 `this.headers.Autho` 不一致时刷新派生状态，避免使用过期结果。
      if (freshHeaders.Authorization !== this.headers.Authorization) {
        // 调用 Object.assign，触发Web Socket Transport此处需要的副作用。
        Object.assign(this.headers, freshHeaders)
        // headersRefreshed更新为 `true`，确保CLI后续读取最新状态。
        headersRefreshed = true
        // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'WebSocketTransport: 4003 received but headers refreshed, scheduling reconnect',
        )
        // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
        logForDiagnosticsNoPII('info', 'cli_websocket_4003_token_refreshed')
      }
    }

    // Web Socket Transport在这里进入条件判断，后续代码按实际状态分流。
    if (
      closeCode != null &&
      PERMANENT_CLOSE_CODES.has(closeCode) &&
      !headersRefreshed
    ) {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WebSocketTransport: Permanent close code ${closeCode}, not reconnecting`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_websocket_permanent_close', {
        closeCode,
      })
      // 更新实例字段 state 为 'closed'，同步Web Socket Transport的内部状态。
      this.state = 'closed'
      // 调用 this.onCloseCallback?.(closeCode)，完成这一处局部操作。
      this.onCloseCallback?.(closeCode)
      // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // When autoReconnect is disabled, go straight to closed state.
    // The caller (e.g. REPL bridge poll loop) handles recovery.
    // this.autoReconnect缺失时提前走兜底路径，避免Web Socket Transport继续依赖无效输入。
    if (!this.autoReconnect) {
      // 更新实例字段 state 为 'closed'，同步Web Socket Transport的内部状态。
      this.state = 'closed'
      // 调用 this.onCloseCallback?.(closeCode)，完成这一处局部操作。
      this.onCloseCallback?.(closeCode)
      // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Schedule reconnection with exponential backoff and time budget
    // now记录时间`Date.now`，供Web Socket Transport后续处理使用。
    const now = Date.now()
    // this.reconnectStartTime缺失时提前走兜底路径，避免Web Socket Transport继续依赖无效输入。
    if (!this.reconnectStartTime) {
      // 更新实例字段 reconnectStartTime 为 now，同步Web Socket Transport的内部状态。
      this.reconnectStartTime = now
    }

    // Detect system sleep/wake: if the gap since our last reconnection
    // attempt greatly exceeds the max delay, the machine likely slept
    // (e.g. laptop lid closed). Reset the budget and retry from scratch —
    // the server will reject with permanent close codes (4001/1002) if
    // the session was reaped while we were asleep.
    // Web Socket Transport在这里进入条件判断，后续代码按实际状态分流。
    if (
      this.lastReconnectAttemptTime !== null &&
      now - this.lastReconnectAttemptTime > SLEEP_DETECTION_THRESHOLD_MS
    ) {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WebSocketTransport: Detected system sleep (${Math.round((now - this.lastReconnectAttemptTime) / 1000)}s gap), resetting reconnection budget`,
      )
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_websocket_sleep_detected', {
        gapMs: now - this.lastReconnectAttemptTime,
      })
      // 更新实例字段 reconnectStartTime 为 now，同步Web Socket Transport的内部状态。
      this.reconnectStartTime = now
      // 更新实例字段 reconnectAttempts 为 0，同步Web Socket Transport的内部状态。
      this.reconnectAttempts = 0
    }
    // 更新实例字段 lastReconnectAttemptTime 为 now，同步Web Socket Transport的内部状态。
    this.lastReconnectAttemptTime = now

    // elapsed保存`now - this.reconnectStartTime`，供后续判断或组装使用。
    const elapsed = now - this.reconnectStartTime
    // 满足 `elapsed < DEFAULT_RECONNECT_GIVE_UP_MS` 时，Web Socket Transport执行该分支。
    if (elapsed < DEFAULT_RECONNECT_GIVE_UP_MS) {
      // Clear any existing reconnection timer to avoid duplicates
      // 满足 `this.reconnectTimer` 时，Web Socket Transport执行该分支。
      if (this.reconnectTimer) {
        // 调用 clearTimeout，触发Web Socket Transport此处需要的副作用。
        clearTimeout(this.reconnectTimer)
        // 更新实例字段 reconnectTimer 为 null，同步Web Socket Transport的内部状态。
        this.reconnectTimer = null
      }

      // Refresh headers before reconnecting (e.g. to pick up a new session token).
      // Skip if already refreshed by the 4003 path above.
      // 组合条件 `!headersRefreshed && this.refreshHeaders` 成立时，Web Socket Transport才启用这条专门路径。
      if (!headersRefreshed && this.refreshHeaders) {
        // freshHeaders 集合保存`this.refreshHeaders`，供Web Socket Transport后续处理使用。
        const freshHeaders = this.refreshHeaders()
        // 调用 Object.assign，触发Web Socket Transport此处需要的副作用。
        Object.assign(this.headers, freshHeaders)
        // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
        logForDebugging('WebSocketTransport: Refreshed headers for reconnect')
      }

      // 更新实例字段 state 为 'reconnecting'，同步Web Socket Transport的内部状态。
      this.state = 'reconnecting'
      // Web Socket Transport在这里处理 `this.reconnectAttempts++`，完成这一小步状态转换。
      this.reconnectAttempts++

      // baseDelay保存`Math.min`，供Web Socket Transport后续处理使用。
      const baseDelay = Math.min(
        DEFAULT_BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
        DEFAULT_MAX_RECONNECT_DELAY,
      )
      // Add ±25% jitter to avoid thundering herd
      // delay保存`Math.max`，供Web Socket Transport后续处理使用。
      const delay = Math.max(
        0,
        baseDelay + baseDelay * 0.25 * (2 * Math.random() - 1),
      )

      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WebSocketTransport: Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}, ${Math.round(elapsed / 1000)}s elapsed)`,
      )
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_websocket_reconnect_attempt', {
        reconnectAttempts: this.reconnectAttempts,
      })
      // 满足 `this.isBridge` 时，Web Socket Transport执行该分支。
      if (this.isBridge) {
        // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_ws_transport_reconnecting', {
          attempt: this.reconnectAttempts,
          elapsedMs: elapsed,
          delayMs: Math.round(delay),
        })
      }

      // 更新实例字段 reconnectTimer 为 setTimeout(() => {，同步Web Socket Transport的内部状态。
      this.reconnectTimer = setTimeout(() => {
        // 更新实例字段 reconnectTimer 为 null，同步Web Socket Transport的内部状态。
        this.reconnectTimer = null
        // 显式忽略 `this.connect()` 的返回值，只保留它触发的副作用。
        void this.connect()
      }, delay)
    } else {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `WebSocketTransport: Reconnection time budget exhausted after ${Math.round(elapsed / 1000)}s for ${this.url.href}`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('error', 'cli_websocket_reconnect_exhausted', {
        reconnectAttempts: this.reconnectAttempts,
        elapsedMs: elapsed,
      })
      // 更新实例字段 state 为 'closed'，同步Web Socket Transport的内部状态。
      this.state = 'closed'

      // Notify close callback
      // 满足 `this.onCloseCallback` 时，Web Socket Transport执行该分支。
      if (this.onCloseCallback) {
        // 调用 this.onCloseCallback，触发Web Socket Transport此处需要的副作用。
        this.onCloseCallback(closeCode)
      }
    }
  }

  // close 使用 无 完成Web Socket Transport里的对应操作。
  close(): void {
    // Clear any pending reconnection timer
    // 满足 `this.reconnectTimer` 时，Web Socket Transport执行该分支。
    if (this.reconnectTimer) {
      // 调用 clearTimeout，触发Web Socket Transport此处需要的副作用。
      clearTimeout(this.reconnectTimer)
      // 更新实例字段 reconnectTimer 为 null，同步Web Socket Transport的内部状态。
      this.reconnectTimer = null
    }

    // Clear ping and keepalive intervals
    // 调用 this.stopPingInterval，触发Web Socket Transport此处需要的副作用。
    this.stopPingInterval()
    // 调用 this.stopKeepaliveInterval，触发Web Socket Transport此处需要的副作用。
    this.stopKeepaliveInterval()

    // Unregister session activity callback
    // 调用 unregisterSessionActivityCallback，触发Web Socket Transport此处需要的副作用。
    unregisterSessionActivityCallback()

    // 更新实例字段 state 为 'closing'，同步Web Socket Transport的内部状态。
    this.state = 'closing'
    // 调用 this.doDisconnect，触发Web Socket Transport此处需要的副作用。
    this.doDisconnect()
  }

  // Web Socket Transport在这里处理 `private replayBufferedMessages(lastId: string): void {`，完成这一小步状态转换。
  private replayBufferedMessages(lastId: string): void {
    // 对话消息保存`messageBuffer.toArray`，供Web Socket Transport后续处理使用。
    const messages = this.messageBuffer.toArray()
    // 对话消息为空时立即返回或跳过，避免Web Socket Transport把空集合当成可处理内容。
    if (messages.length === 0) return

    // Find where to start replay based on server's last received message
    // startIndex 索引保存`0`，供后续判断或组装使用。
    let startIndex = 0
    // 满足 `lastId` 时，Web Socket Transport执行该分支。
    if (lastId) {
      // lastConfirmedIndex 索引筛选`messages.findIndex`，供Web Socket Transport后续处理使用。
      const lastConfirmedIndex = messages.findIndex(
        // 消息更新为 `> 'uuid' in message && message.uuid === lastId`，确保CLI后续读取最新状态。
        message => 'uuid' in message && message.uuid === lastId,
      )
      // 满足 `lastConfirmedIndex >= 0` 时，Web Socket Transport执行该分支。
      if (lastConfirmedIndex >= 0) {
        // Server confirmed messages up to lastConfirmedIndex — evict them
        // startIndex 索引更新为 `lastConfirmedIndex + 1`，确保CLI后续读取最新状态。
        startIndex = lastConfirmedIndex + 1
        // Rebuild the buffer with only unconfirmed messages
        // remaining格式化`messages.slice`，供Web Socket Transport后续处理使用。
        const remaining = messages.slice(startIndex)
        // 调用 this.messageBuffer.clear，触发Web Socket Transport此处需要的副作用。
        this.messageBuffer.clear()
        // 调用 this.messageBuffer.addAll，触发Web Socket Transport此处需要的副作用。
        this.messageBuffer.addAll(remaining)
        // remaining为空时立即返回或跳过，避免Web Socket Transport把空集合当成可处理内容。
        if (remaining.length === 0) {
          // 更新实例字段 lastSentId 为 null，同步Web Socket Transport的内部状态。
          this.lastSentId = null
        }
        // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `WebSocketTransport: Evicted ${startIndex} confirmed messages, ${remaining.length} remaining`,
        )
        // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
        logForDiagnosticsNoPII(
          'info',
          'cli_websocket_evicted_confirmed_messages',
          {
            evicted: startIndex,
            remaining: remaining.length,
          },
        )
      }
    }

    // messagesToReplay 消息数据格式化`messages.slice`，供Web Socket Transport后续处理使用。
    const messagesToReplay = messages.slice(startIndex)
    // messagesToReplay 消息数据为空时立即返回或跳过，避免Web Socket Transport把空集合当成可处理内容。
    if (messagesToReplay.length === 0) {
      // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
      logForDebugging('WebSocketTransport: No new messages to replay')
      // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_websocket_no_messages_to_replay')
      // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `WebSocketTransport: Replaying ${messagesToReplay.length} buffered messages`,
    )
    // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
    logForDiagnosticsNoPII('info', 'cli_websocket_messages_to_replay', {
      count: messagesToReplay.length,
    })

    // 按顺序遍历 `messagesToReplay` 中的消息，逐个交给Web Socket Transport处理。
    for (const message of messagesToReplay) {
      // line保存`jsonStringify`，供Web Socket Transport后续处理使用。
      const line = jsonStringify(message) + '\n'
      // success 集合保存`this.sendLine`，供Web Socket Transport后续处理使用。
      const success = this.sendLine(line)
      // success 集合缺失时提前走兜底路径，避免Web Socket Transport继续依赖无效输入。
      if (!success) {
        // 调用 this.handleConnectionError，触发Web Socket Transport此处需要的副作用。
        this.handleConnectionError()
        // 结束这个分支或循环，避免Web Socket Transport继续落入后续路径。
        break
      }
    }
    // Do NOT clear the buffer after replay — messages remain buffered until
    // the server confirms receipt on the next reconnection. This prevents
    // message loss if the connection drops after replay but before the server
    // processes the messages.
  }

  // isConnectedStatus 用 无 判断Web Socket Transport是否满足条件。
  isConnectedStatus(): boolean {
    // 返回 `this.state === 'connected'`，作为Web Socket Transport这次计算的结果。
    return this.state === 'connected'
  }

  // isClosedStatus 用 无 判断Web Socket Transport是否满足条件。
  isClosedStatus(): boolean {
    // 返回 `this.state === 'closed'`，作为Web Socket Transport这次计算的结果。
    return this.state === 'closed'
  }

  // setOnData 写入新的状态值，使Web Socket Transport后续读取保持一致。
  setOnData(callback: (data: string) => void): void {
    // 更新实例字段 onData 为 callback，同步Web Socket Transport的内部状态。
    this.onData = callback
  }

  // setOnConnect 写入新的状态值，使Web Socket Transport后续读取保持一致。
  setOnConnect(callback: () => void): void {
    // 更新实例字段 onConnectCallback 为 callback，同步Web Socket Transport的内部状态。
    this.onConnectCallback = callback
  }

  // setOnClose 写入新的状态值，使Web Socket Transport后续读取保持一致。
  setOnClose(callback: (closeCode?: number) => void): void {
    // 更新实例字段 onCloseCallback 为 callback，同步Web Socket Transport的内部状态。
    this.onCloseCallback = callback
  }

  // getStateLabel不依赖额外参数，直接计算Web Socket Transport需要的结果。
  getStateLabel(): string {
    // 返回 `this.state`，作为Web Socket Transport这次计算的结果。
    return this.state
  }

  // write 使用 message: StdoutMessage 完成Web Socket Transport里的对应操作。
  async write(message: StdoutMessage): Promise<void> {
    // 组合条件 `'uuid' in message && typeof message.uuid === 'str` 成立时，Web Socket Transport才启用这条专门路径。
    if ('uuid' in message && typeof message.uuid === 'string') {
      // 调用 this.messageBuffer.add，触发Web Socket Transport此处需要的副作用。
      this.messageBuffer.add(message)
      // 更新实例字段 lastSentId 为 message.uuid，同步Web Socket Transport的内部状态。
      this.lastSentId = message.uuid
    }

    // line保存`jsonStringify`，供Web Socket Transport后续处理使用。
    const line = jsonStringify(message) + '\n'

    // `this.state` 与 `'connected'` 不一致时刷新派生状态，避免使用过期结果。
    if (this.state !== 'connected') {
      // Message buffered for replay when connected (if it has a UUID)
      // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // sessionLabel 会话数据保存`this.sessionId ? ` session=${this.sessionId}` : ''`，供后续判断或组装使用。
    const sessionLabel = this.sessionId ? ` session=${this.sessionId}` : ''
    // detailLabel读取`this.getControlMessageDetailLabel`，供Web Socket Transport后续处理使用。
    const detailLabel = this.getControlMessageDetailLabel(message)

    // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `WebSocketTransport: Sending message type=${message.type}${sessionLabel}${detailLabel}`,
    )

    // 调用 this.sendLine，触发Web Socket Transport此处需要的副作用。
    this.sendLine(line)
  }

  // Web Socket Transport在这里处理 `private getControlMessageDetailLabel(message: StdoutMessage): string {`，完成这一小步状态转换。
  private getControlMessageDetailLabel(message: StdoutMessage): string {
    // 当 `message.type` 匹配 `'control_request'` 时，Web Socket Transport执行对应分支。
    if (message.type === 'control_request') {
      // 从 `message` 解构 request_id、request，减少Web Socket Transport对同一对象的重复访问。
      const { request_id, request } = message
      // toolName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const toolName =
        request.subtype === 'can_use_tool' ? request.tool_name : ''
      // 返回 `` subtype=${request.subtype} request_id=${request_id}${toolName ? ` too...`，作为Web Socket Transport这次计算的结果。
      return ` subtype=${request.subtype} request_id=${request_id}${toolName ? ` tool=${toolName}` : ''}`
    }
    // 当 `message.type` 匹配 `'control_response'` 时，Web Socket Transport执行对应分支。
    if (message.type === 'control_response') {
      // 从 `message.response` 解构 subtype、request_id，减少Web Socket Transport对同一对象的重复访问。
      const { subtype, request_id } = message.response
      // 返回 `` subtype=${subtype} request_id=${request_id}``，作为Web Socket Transport这次计算的结果。
      return ` subtype=${subtype} request_id=${request_id}`
    }
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return ''
  }

  // Web Socket Transport在这里处理 `private startPingInterval(): void {`，完成这一小步状态转换。
  private startPingInterval(): void {
    // Clear any existing interval
    // 调用 this.stopPingInterval，触发Web Socket Transport此处需要的副作用。
    this.stopPingInterval()

    // 更新实例字段 pongReceived 为 true，同步Web Socket Transport的内部状态。
    this.pongReceived = true
    // lastTickTime记录时间`Date.now`，供Web Socket Transport后续处理使用。
    let lastTickTime = Date.now()

    // Send ping periodically to detect dead connections.
    // If the previous ping got no pong, treat the connection as dead.
    // 更新实例字段 pingInterval 为 setInterval(() => {，同步Web Socket Transport的内部状态。
    this.pingInterval = setInterval(() => {
      // 组合条件 `this.state === 'connected' && this.ws` 成立时，Web Socket Transport才启用这条专门路径。
      if (this.state === 'connected' && this.ws) {
        // now记录时间`Date.now`，供Web Socket Transport后续处理使用。
        const now = Date.now()
        // gap保存`now - lastTickTime`，供后续判断或组装使用。
        const gap = now - lastTickTime
        // lastTickTime更新为 `now`，确保CLI后续读取最新状态。
        lastTickTime = now

        // Process-suspension detector. If the wall-clock gap between ticks
        // greatly exceeds the 10s interval, the process was suspended
        // (laptop lid, SIGSTOP, VM pause). setInterval does not queue
        // missed ticks — it coalesces — so on wake this callback fires
        // once with a huge gap. The socket is almost certainly dead:
        // NAT mappings drop in 30s–5min, and the server has been
        // retransmitting into the void. Don't wait for a ping/pong
        // round-trip to confirm (ws.ping() on a dead socket returns
        // immediately with no error — bytes go into the kernel send
        // buffer). Assume dead and reconnect now. A spurious reconnect
        // after a short sleep is cheap — replayBufferedMessages() handles
        // it and the server dedups by UUID.
        // 满足 `gap > SLEEP_DETECTION_THRESHOLD_MS` 时，Web Socket Transport执行该分支。
        if (gap > SLEEP_DETECTION_THRESHOLD_MS) {
          // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `WebSocketTransport: ${Math.round(gap / 1000)}s tick gap detected — process was suspended, forcing reconnect`,
          )
          // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
          logForDiagnosticsNoPII(
            'info',
            'cli_websocket_sleep_detected_on_ping',
            { gapMs: gap },
          )
          // 调用 this.handleConnectionError，触发Web Socket Transport此处需要的副作用。
          this.handleConnectionError()
          // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // this.pongReceived缺失时提前走兜底路径，避免Web Socket Transport继续依赖无效输入。
        if (!this.pongReceived) {
          // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            'WebSocketTransport: No pong received, connection appears dead',
            { level: 'error' },
          )
          // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
          logForDiagnosticsNoPII('error', 'cli_websocket_pong_timeout')
          // 调用 this.handleConnectionError，触发Web Socket Transport此处需要的副作用。
          this.handleConnectionError()
          // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 更新实例字段 pongReceived 为 false，同步Web Socket Transport的内部状态。
        this.pongReceived = false
        // 保护这一段可能失败的Web Socket Transport操作，确保异常能进入相邻错误处理。
        try {
          // 调用 this.ws.ping?.()，完成这一处局部操作。
          this.ws.ping?.()
        } catch (error) {
          // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`WebSocketTransport: Ping failed: ${error}`, {
            level: 'error',
          })
          // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
          logForDiagnosticsNoPII('error', 'cli_websocket_ping_failed')
        }
      }
    }, DEFAULT_PING_INTERVAL)
  }

  // Web Socket Transport在这里处理 `private stopPingInterval(): void {`，完成这一小步状态转换。
  private stopPingInterval(): void {
    // 满足 `this.pingInterval` 时，Web Socket Transport执行该分支。
    if (this.pingInterval) {
      // 调用 clearInterval，触发Web Socket Transport此处需要的副作用。
      clearInterval(this.pingInterval)
      // 更新实例字段 pingInterval 为 null，同步Web Socket Transport的内部状态。
      this.pingInterval = null
    }
  }

  // Web Socket Transport在这里处理 `private startKeepaliveInterval(): void {`，完成这一小步状态转换。
  private startKeepaliveInterval(): void {
    // 调用 this.stopKeepaliveInterval，触发Web Socket Transport此处需要的副作用。
    this.stopKeepaliveInterval()

    // In CCR sessions, session activity heartbeats handle keep-alives
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)` 时，Web Socket Transport执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE)) {
      // Web Socket Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 更新实例字段 keepAliveInterval 为 setInterval(() => {，同步Web Socket Transport的内部状态。
    this.keepAliveInterval = setInterval(() => {
      // 组合条件 `this.state === 'connected' && this.ws` 成立时，Web Socket Transport才启用这条专门路径。
      if (this.state === 'connected' && this.ws) {
        // 保护这一段可能失败的Web Socket Transport操作，确保异常能进入相邻错误处理。
        try {
          // 调用 this.ws.send，触发Web Socket Transport此处需要的副作用。
          this.ws.send(KEEP_ALIVE_FRAME)
          // 更新实例字段 lastActivityTime 为 Date.now()，同步Web Socket Transport的内部状态。
          this.lastActivityTime = Date.now()
          // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            'WebSocketTransport: Sent periodic keep_alive data frame',
          )
        } catch (error) {
          // 记录Web Socket Transport运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `WebSocketTransport: Periodic keep_alive failed: ${error}`,
            { level: 'error' },
          )
          // 调用 logForDiagnosticsNoPII，触发Web Socket Transport此处需要的副作用。
          logForDiagnosticsNoPII('error', 'cli_websocket_keepalive_failed')
        }
      }
    }, DEFAULT_KEEPALIVE_INTERVAL)
  }

  // Web Socket Transport在这里处理 `private stopKeepaliveInterval(): void {`，完成这一小步状态转换。
  private stopKeepaliveInterval(): void {
    // 满足 `this.keepAliveInterval` 时，Web Socket Transport执行该分支。
    if (this.keepAliveInterval) {
      // 调用 clearInterval，触发Web Socket Transport此处需要的副作用。
      clearInterval(this.keepAliveInterval)
      // 更新实例字段 keepAliveInterval 为 null，同步Web Socket Transport的内部状态。
      this.keepAliveInterval = null
    }
  }
}
