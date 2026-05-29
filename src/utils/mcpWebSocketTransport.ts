// 类型依赖 { Transport } 来自 @modelcontextprotocol/sdk/shared/transport.js，用于校准共享工具的数据契约。
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type JSONRPCMessage,
  JSONRPCMessageSchema,
} from '@modelcontextprotocol/sdk/types.js'
// 类型依赖 WsWebSocket 来自 ws，用于校准共享工具的数据契约。
import type WsWebSocket from 'ws'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 toError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { toError } from './errors.js'
// 引入 jsonParse、jsonStringify，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from './slowOperations.js'

// WebSocket readyState constants (same for both native and ws)
// WS_CONNECTING 命名 `0`，让后续代码直接表达这个值的用途。
const WS_CONNECTING = 0
// WS_OPEN保存`1`，供共享工具 mcp Web Socket Transport后续判断或输出使用。
const WS_OPEN = 1

// Minimal interface shared by globalThis.WebSocket and ws.WebSocket
// WebSocketLike 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type WebSocketLike = {
  readonly readyState: number
  close(): void
  send(data: string): void
}

// WebSocketTransport 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class WebSocketTransport implements Transport {
  private started = false
  private opened: Promise<void>
  private isBun = typeof Bun !== 'undefined'

  // 构造函数接收 private ws: WebSocketLike，把外部输入整理成实例可复用的内部状态。
  constructor(private ws: WebSocketLike) {
    // 更新实例字段 opened 为 new Promise((resolve, reject) => {，同步共享工具的内部状态。
    this.opened = new Promise((resolve, reject) => {
      // 满足 `this.ws.readyState === WS_OPEN` 时，共享工具执行该分支。
      if (this.ws.readyState === WS_OPEN) {
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve()
      // 共享工具 mcp Web Socket Transport在这里处理 `} else if (this.isBun) {`，完成这一小步状态转换。
      } else if (this.isBun) {
        // nws 集合保存`this.ws as unknown as globalThis.WebSocket`，供共享工具 mcp Web Socket Transport后续判断或输出使用。
        const nws = this.ws as unknown as globalThis.WebSocket
        // onOpen封装成回调，供共享工具 mcp Web Socket Transport在事件触发或异步步骤中调用。
        const onOpen = () => {
          // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
          nws.removeEventListener('open', onOpen)
          // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
          nws.removeEventListener('error', onError)
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve()
        }
        // onError 错误信息封装成回调，供共享工具 mcp Web Socket Transport在事件触发或异步步骤中调用。
        const onError = (event: Event) => {
          // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
          nws.removeEventListener('open', onOpen)
          // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
          nws.removeEventListener('error', onError)
          // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
          logForDiagnosticsNoPII('error', 'mcp_websocket_connect_fail')
          // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          reject(event)
        }
        // 调用 nws.addEventListener，触发共享工具此处需要的副作用。
        nws.addEventListener('open', onOpen)
        // 调用 nws.addEventListener，触发共享工具此处需要的副作用。
        nws.addEventListener('error', onError)
      } else {
        // nws 集合 命名 `this.ws as unknown as WsWebSocket`，让后续代码直接表达这个值的用途。
        const nws = this.ws as unknown as WsWebSocket
        // 调用 nws.on，触发共享工具此处需要的副作用。
        nws.on('open', () => {
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve()
        })
        // 调用 nws.on，触发共享工具此处需要的副作用。
        nws.on('error', error => {
          // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
          logForDiagnosticsNoPII('error', 'mcp_websocket_connect_fail')
          // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
          reject(error)
        })
      }
    })

    // Attach persistent event handlers
    // 满足 `this.isBun` 时，共享工具执行该分支。
    if (this.isBun) {
      // nws 集合保存`this.ws as unknown as globalThis.WebSocket`，供共享工具 mcp Web Socket Transport后续判断或输出使用。
      const nws = this.ws as unknown as globalThis.WebSocket
      // 调用 nws.addEventListener，触发共享工具此处需要的副作用。
      nws.addEventListener('message', this.onBunMessage)
      // 调用 nws.addEventListener，触发共享工具此处需要的副作用。
      nws.addEventListener('error', this.onBunError)
      // 调用 nws.addEventListener，触发共享工具此处需要的副作用。
      nws.addEventListener('close', this.onBunClose)
    } else {
      // nws 集合 命名 `this.ws as unknown as WsWebSocket`，让后续代码直接表达这个值的用途。
      const nws = this.ws as unknown as WsWebSocket
      // 调用 nws.on，触发共享工具此处需要的副作用。
      nws.on('message', this.onNodeMessage)
      // 调用 nws.on，触发共享工具此处需要的副作用。
      nws.on('error', this.onNodeError)
      // 调用 nws.on，触发共享工具此处需要的副作用。
      nws.on('close', this.onNodeClose)
    }
  }

  // 这个回调绑定到 onclose?: () => void，负责共享工具在该局部场景下的响应。
  onclose?: () => void
  // 这个回调绑定到 onerror?: (error: Error) => void，负责共享工具在该局部场景下的响应。
  onerror?: (error: Error) => void
  // 这个回调绑定到 onmessage?: (message: JSONRPCMessage) => void，负责共享工具在该局部场景下的响应。
  onmessage?: (message: JSONRPCMessage) => void

  // Bun (native WebSocket) event handlers
  // 这个回调绑定到 private onBunMessage = (event: MessageEvent) => {，负责共享工具在该局部场景下的响应。
  private onBunMessage = (event: MessageEvent) => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // data 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const data =
        typeof event.data === 'string' ? event.data : String(event.data)
      // messageObj 消息数据解析`jsonParse`，供共享工具后续处理使用。
      const messageObj = jsonParse(data)
      // 消息解析`JSONRPCMessageSchema.parse`，供共享工具后续处理使用。
      const message = JSONRPCMessageSchema.parse(messageObj)
      // 调用 this.onmessage?.(message)，完成这一处局部操作。
      this.onmessage?.(message)
    } catch (error) {
      // 调用 this.handleError，触发共享工具此处需要的副作用。
      this.handleError(error)
    }
  }

  // 这个回调绑定到 private onBunError = () => {，负责共享工具在该局部场景下的响应。
  private onBunError = () => {
    // 调用 this.handleError，触发共享工具此处需要的副作用。
    this.handleError(new Error('WebSocket error'))
  }

  // 这个回调绑定到 private onBunClose = () => {，负责共享工具在该局部场景下的响应。
  private onBunClose = () => {
    // 调用 this.handleCloseCleanup，触发共享工具此处需要的副作用。
    this.handleCloseCleanup()
  }

  // Node (ws package) event handlers
  // 这个回调绑定到 private onNodeMessage = (data: Buffer) => {，负责共享工具在该局部场景下的响应。
  private onNodeMessage = (data: Buffer) => {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // messageObj 消息数据解析`jsonParse`，供共享工具后续处理使用。
      const messageObj = jsonParse(data.toString('utf-8'))
      // 消息解析`JSONRPCMessageSchema.parse`，供共享工具后续处理使用。
      const message = JSONRPCMessageSchema.parse(messageObj)
      // 调用 this.onmessage?.(message)，完成这一处局部操作。
      this.onmessage?.(message)
    } catch (error) {
      // 调用 this.handleError，触发共享工具此处需要的副作用。
      this.handleError(error)
    }
  }

  // 这个回调绑定到 private onNodeError = (error: unknown) => {，负责共享工具在该局部场景下的响应。
  private onNodeError = (error: unknown) => {
    // 调用 this.handleError，触发共享工具此处需要的副作用。
    this.handleError(error)
  }

  // 这个回调绑定到 private onNodeClose = () => {，负责共享工具在该局部场景下的响应。
  private onNodeClose = () => {
    // 调用 this.handleCloseCleanup，触发共享工具此处需要的副作用。
    this.handleCloseCleanup()
  }

  // Shared error handler
  // 共享工具 mcp Web Socket Transport在这里处理 `private handleError(error: unknown): void {`，完成这一小步状态转换。
  private handleError(error: unknown): void {
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('error', 'mcp_websocket_message_fail')
    // 调用 this.onerror?.(toError(error))，完成这一处局部操作。
    this.onerror?.(toError(error))
  }

  // Shared close handler with listener cleanup
  // 共享工具 mcp Web Socket Transport在这里处理 `private handleCloseCleanup(): void {`，完成这一小步状态转换。
  private handleCloseCleanup(): void {
    // 调用 this.onclose?.()，完成这一处局部操作。
    this.onclose?.()
    // Clean up listeners after close
    // 满足 `this.isBun` 时，共享工具执行该分支。
    if (this.isBun) {
      // nws 集合保存`this.ws as unknown as globalThis.WebSocket`，供共享工具 mcp Web Socket Transport后续判断或输出使用。
      const nws = this.ws as unknown as globalThis.WebSocket
      // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
      nws.removeEventListener('message', this.onBunMessage)
      // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
      nws.removeEventListener('error', this.onBunError)
      // 调用 nws.removeEventListener，触发共享工具此处需要的副作用。
      nws.removeEventListener('close', this.onBunClose)
    } else {
      // nws 集合 命名 `this.ws as unknown as WsWebSocket`，让后续代码直接表达这个值的用途。
      const nws = this.ws as unknown as WsWebSocket
      // 调用 nws.off，触发共享工具此处需要的副作用。
      nws.off('message', this.onNodeMessage)
      // 调用 nws.off，触发共享工具此处需要的副作用。
      nws.off('error', this.onNodeError)
      // 调用 nws.off，触发共享工具此处需要的副作用。
      nws.off('close', this.onNodeClose)
    }
  }

  /**
   * Starts listening for messages on the WebSocket.
   */
  // start 使用 无 完成共享工具里的对应操作。
  async start(): Promise<void> {
    // 满足 `this.started` 时，共享工具执行该分支。
    if (this.started) {
      // 抛出 new Error('Start can only be called once per transport.')，阻止共享工具在无效状态下继续运行。
      throw new Error('Start can only be called once per transport.')
    }
    // 等待 `this.opened` 完成，再继续共享工具 mcp Web Socket Transport的异步流程。
    await this.opened
    // `this.ws.readyState` 与 `WS_OPEN` 不一致时刷新派生状态，避免使用过期结果。
    if (this.ws.readyState !== WS_OPEN) {
      // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
      logForDiagnosticsNoPII('error', 'mcp_websocket_start_not_opened')
      // 抛出 new Error('WebSocket is not open. Cannot start transport.')，阻止共享工具在无效状态下继续运行。
      throw new Error('WebSocket is not open. Cannot start transport.')
    }
    // 更新实例字段 started 为 true，同步共享工具的内部状态。
    this.started = true
    // Unlike stdio, WebSocket connections are typically already established when the transport is created.
    // No explicit connection action needed here, just attaching listeners.
  }

  /**
   * Closes the WebSocket connection.
   */
  // close 使用 无 完成共享工具里的对应操作。
  async close(): Promise<void> {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      this.ws.readyState === WS_OPEN ||
      this.ws.readyState === WS_CONNECTING
    ) {
      // 调用 this.ws.close，触发共享工具此处需要的副作用。
      this.ws.close()
    }
    // Ensure listeners are removed even if close was called externally or connection was already closed
    // 调用 this.handleCloseCleanup，触发共享工具此处需要的副作用。
    this.handleCloseCleanup()
  }

  /**
   * Sends a JSON-RPC message over the WebSocket connection.
   */
  // send 使用 message: JSONRPCMessage 完成共享工具里的对应操作。
  async send(message: JSONRPCMessage): Promise<void> {
    // `this.ws.readyState` 与 `WS_OPEN` 不一致时刷新派生状态，避免使用过期结果。
    if (this.ws.readyState !== WS_OPEN) {
      // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
      logForDiagnosticsNoPII('error', 'mcp_websocket_send_not_opened')
      // 抛出 new Error('WebSocket is not open. Cannot send message.')，阻止共享工具在无效状态下继续运行。
      throw new Error('WebSocket is not open. Cannot send message.')
    }
    // json保存`jsonStringify`，供共享工具后续处理使用。
    const json = jsonStringify(message)

    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `this.isBun` 时，共享工具执行该分支。
      if (this.isBun) {
        // Native WebSocket.send() is synchronous (no callback)
        // 调用 this.ws.send，触发共享工具此处需要的副作用。
        this.ws.send(json)
      } else {
        // 这个回调绑定到 await new Promise<void>((resolve, reject) => {，负责共享工具在该局部场景下的响应。
        await new Promise<void>((resolve, reject) => {
          // 这个回调绑定到 ;(this.ws as unknown as WsWebSocket).send(json, error => {，负责共享工具在该局部场景下的响应。
          ;(this.ws as unknown as WsWebSocket).send(json, error => {
            // 满足 `error` 时，共享工具执行该分支。
            if (error) {
              // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
              reject(error)
            } else {
              // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
              resolve()
            }
          })
        })
      }
    } catch (error) {
      // 调用 this.handleError，触发共享工具此处需要的副作用。
      this.handleError(error)
      // 抛出 error，阻止共享工具在无效状态下继续运行。
      throw error
    }
  }
}
