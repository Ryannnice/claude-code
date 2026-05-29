/* eslint-disable eslint-plugin-n/no-unsupported-features/node-builtins */

// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准direct Connect Manager的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让direct Connect Manager后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlPermissionRequest,
  StdoutMessage,
} from '../entrypoints/sdk/controlTypes.js'
// 类型依赖 { RemotePermissionResponse } 来自 ../remote/RemoteSessionManager.js，用于校准direct Connect Manager的数据契约。
import type { RemotePermissionResponse } from '../remote/RemoteSessionManager.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../utils/slowOperations.js'
// 类型依赖 { RemoteMessageContent } 来自 ../utils/teleport/api.js，用于校准direct Connect Manager的数据契约。
import type { RemoteMessageContent } from '../utils/teleport/api.js'

// DirectConnectConfig 固化direct Connect Manager里传递的数据形状，帮助调用方按同一结构读写字段。
export type DirectConnectConfig = {
  serverUrl: string
  sessionId: string
  wsUrl: string
  authToken?: string
}

// DirectConnectCallbacks 固化direct Connect Manager里传递的数据形状，帮助调用方按同一结构读写字段。
export type DirectConnectCallbacks = {
  // 这个回调绑定到 onMessage: (message: SDKMessage) => void，负责direct Connect Manager在该局部场景下的响应。
  onMessage: (message: SDKMessage) => void
  // direct Connect Manager在这里处理 `onPermissionRequest: (`，完成这一小步状态转换。
  onPermissionRequest: (
    request: SDKControlPermissionRequest,
    requestId: string,
  ) => void
  onConnected?: () => void
  // 这个回调绑定到 onDisconnected?: () => void，负责direct Connect Manager在该局部场景下的响应。
  onDisconnected?: () => void
  // 这个回调绑定到 onError?: (error: Error) => void，负责direct Connect Manager在该局部场景下的响应。
  onError?: (error: Error) => void
}

// isStdoutMessage 封装directConnectManager的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isStdoutMessage(value: unknown): value is StdoutMessage {
  // 返回 `(`，作为direct Connect Manager这次计算的结果。
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string'
  )
}

// DirectConnectSessionManager 聚合direct Connect Manager相关状态与操作，把同一职责的行为收束到类实例中。
export class DirectConnectSessionManager {
  private ws: WebSocket | null = null
  private config: DirectConnectConfig
  private callbacks: DirectConnectCallbacks

  // 构造函数接收 config: DirectConnectConfig, callbacks: DirectCon…，把外部输入整理成实例可复用的内部状态。
  constructor(config: DirectConnectConfig, callbacks: DirectConnectCallbacks) {
    // 更新实例字段 config 为 config，同步direct Connect Manager的内部状态。
    this.config = config
    // 更新实例字段 callbacks 为 callbacks，同步direct Connect Manager的内部状态。
    this.callbacks = callbacks
  }

  // connect 使用 无 完成direct Connect Manager里的对应操作。
  connect(): void {
    // 请求头 从空对象开始收集键值，后续按名称补齐内容。
    const headers: Record<string, string> = {}
    // 满足 `this.config.authToken` 时，direct Connect Manager执行该分支。
    if (this.config.authToken) {
      // headers['authorization'更新为 ``Bearer ${this.config.authToken}``，确保direct Connect Manager后续读取最新状态。
      headers['authorization'] = `Bearer ${this.config.authToken}`
    }
    // Bun's WebSocket supports headers option but the DOM typings don't
    // 更新实例字段 ws 为 new WebSocket(this.config.wsUrl, {，同步direct Connect Manager的内部状态。
    this.ws = new WebSocket(this.config.wsUrl, {
      headers,
    } as unknown as string[])

    // 调用 this.ws.addEventListener，触发direct Connect Manager此处需要的副作用。
    this.ws.addEventListener('open', () => {
      // 调用 this.callbacks.onConnected?.()，完成这一处局部操作。
      this.callbacks.onConnected?.()
    })

    // 调用 this.ws.addEventListener，触发direct Connect Manager此处需要的副作用。
    this.ws.addEventListener('message', event => {
      // data标记direct Connect Manager是否启用对应路径。
      const data = typeof event.data === 'string' ? event.data : ''
      // 文本行格式化`data.split`，供direct Connect Manager后续处理使用。
      const lines = data.split('\n').filter((l: string) => l.trim())

      // 按顺序遍历 `lines` 中的line，逐个交给direct Connect Manager处理。
      for (const line of lines) {
        // 原始文本 先占位，稍后的条件分支会根据实际输入补齐它。
        let raw: unknown
        // 保护这一段可能失败的direct Connect Manager操作，确保异常能进入相邻错误处理。
        try {
          // 原始文本更新为 `jsonParse(line)`，确保directConnectManager后续读取最新状态。
          raw = jsonParse(line)
        } catch {
          // 跳过当前项，继续处理direct Connect Manager中的下一轮循环。
          continue
        }

        // 满足 `!isStdoutMessage(raw)` 时，direct Connect Manager执行该分支。
        if (!isStdoutMessage(raw)) {
          // 跳过当前项，继续处理direct Connect Manager中的下一轮循环。
          continue
        }
        // 解析结果保存`raw`，供后续判断或组装使用。
        const parsed = raw

        // Handle control requests (permission requests)
        // 当 `parsed.type` 匹配 `'control_request'` 时，direct Connect Manager执行对应分支。
        if (parsed.type === 'control_request') {
          // 当 `parsed.request.subtype` 匹配 `'can_use_tool'` 时，direct Connect Manager执行对应分支。
          if (parsed.request.subtype === 'can_use_tool') {
            // 调用 this.callbacks.onPermissionRequest，触发direct Connect Manager此处需要的副作用。
            this.callbacks.onPermissionRequest(
              parsed.request,
              parsed.request_id,
            )
          } else {
            // Send an error response for unrecognized subtypes so the
            // server doesn't hang waiting for a reply that never comes.
            // 记录direct Connect Manager运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[DirectConnect] Unsupported control request subtype: ${parsed.request.subtype}`,
            )
            // 调用 this.sendErrorResponse，触发direct Connect Manager此处需要的副作用。
            this.sendErrorResponse(
              parsed.request_id,
              `Unsupported control request subtype: ${parsed.request.subtype}`,
            )
          }
          // 跳过当前项，继续处理direct Connect Manager中的下一轮循环。
          continue
        }

        // Forward SDK messages (assistant, result, system, etc.)
        // direct Connect Manager在这里进入条件判断，后续代码按实际状态分流。
        if (
          parsed.type !== 'control_response' &&
          parsed.type !== 'keep_alive' &&
          parsed.type !== 'control_cancel_request' &&
          parsed.type !== 'streamlined_text' &&
          parsed.type !== 'streamlined_tool_use_summary' &&
          !(parsed.type === 'system' && parsed.subtype === 'post_turn_summary')
        ) {
          // 调用 this.callbacks.onMessage，触发direct Connect Manager此处需要的副作用。
          this.callbacks.onMessage(parsed)
        }
      }
    })

    // 调用 this.ws.addEventListener，触发direct Connect Manager此处需要的副作用。
    this.ws.addEventListener('close', () => {
      // 调用 this.callbacks.onDisconnected?.()，完成这一处局部操作。
      this.callbacks.onDisconnected?.()
    })

    // 调用 this.ws.addEventListener，触发direct Connect Manager此处需要的副作用。
    this.ws.addEventListener('error', () => {
      // 调用 this.callbacks.onError?.(new Error('WebSocket connection error'))，完成这一处局部操作。
      this.callbacks.onError?.(new Error('WebSocket connection error'))
    })
  }

  // sendMessage 使用 content: RemoteMessageContent 完成direct Connect Manager里的对应操作。
  sendMessage(content: RemoteMessageContent): boolean {
    // `!this.ws || this.ws.readyState` 与 `WebSocket.OPEN` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Must match SDKUserMessage format expected by `--input-format stream-json`
    // 消息保存`jsonStringify`，供direct Connect Manager后续处理使用。
    const message = jsonStringify({
      type: 'user',
      message: {
        role: 'user',
        content: content,
      },
      parent_tool_use_id: null,
      session_id: '',
    })
    // 调用 this.ws.send，触发direct Connect Manager此处需要的副作用。
    this.ws.send(message)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 调用 respondToPermissionRequest，触发direct Connect Manager此处需要的副作用。
  respondToPermissionRequest(
    requestId: string,
    result: RemotePermissionResponse,
  ): void {
    // `!this.ws || this.ws.readyState` 与 `WebSocket.OPEN` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // direct Connect Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Must match SDKControlResponse format expected by StructuredIO
    // 接口响应保存`jsonStringify`，供direct Connect Manager后续处理使用。
    const response = jsonStringify({
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
    })
    // 调用 this.ws.send，触发direct Connect Manager此处需要的副作用。
    this.ws.send(response)
  }

  /**
   * Send an interrupt signal to cancel the current request
   */
  // sendInterrupt 使用 无 完成direct Connect Manager里的对应操作。
  sendInterrupt(): void {
    // `!this.ws || this.ws.readyState` 与 `WebSocket.OPEN` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // direct Connect Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Must match SDKControlRequest format expected by StructuredIO
    // request 请求数据保存`jsonStringify`，供direct Connect Manager后续处理使用。
    const request = jsonStringify({
      type: 'control_request',
      request_id: crypto.randomUUID(),
      request: {
        subtype: 'interrupt',
      },
    })
    // 调用 this.ws.send，触发direct Connect Manager此处需要的副作用。
    this.ws.send(request)
  }

  // direct Connect Manager在这里处理 `private sendErrorResponse(requestId: string, error: string): void {`，完成这一小步状态转换。
  private sendErrorResponse(requestId: string, error: string): void {
    // `!this.ws || this.ws.readyState` 与 `WebSocket.OPEN` 不一致时刷新派生状态，避免使用过期结果。
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // direct Connect Manager在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 接口响应保存`jsonStringify`，供direct Connect Manager后续处理使用。
    const response = jsonStringify({
      type: 'control_response',
      response: {
        subtype: 'error',
        request_id: requestId,
        error,
      },
    })
    // 调用 this.ws.send，触发direct Connect Manager此处需要的副作用。
    this.ws.send(response)
  }

  // disconnect 使用 无 完成direct Connect Manager里的对应操作。
  disconnect(): void {
    // 满足 `this.ws` 时，direct Connect Manager执行该分支。
    if (this.ws) {
      // 调用 this.ws.close，触发direct Connect Manager此处需要的副作用。
      this.ws.close()
      // 更新实例字段 ws 为 null，同步direct Connect Manager的内部状态。
      this.ws = null
    }
  }

  // isConnected 用 无 判断direct Connect Manager是否满足条件。
  isConnected(): boolean {
    // 返回 `this.ws?.readyState === WebSocket.OPEN`，作为direct Connect Manager这次计算的结果。
    return this.ws?.readyState === WebSocket.OPEN
  }
}
