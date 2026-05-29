// 类型依赖 { Transport } 来自 @modelcontextprotocol/sdk/shared/transport.js，用于校准MCP 服务的数据契约。
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
// 类型依赖 { JSONRPCMessage } 来自 @modelcontextprotocol/sdk/types.js，用于校准MCP 服务的数据契约。
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

/**
 * In-process linked transport pair for running an MCP server and client
 * in the same process without spawning a subprocess.
 *
 * `send()` on one side delivers to `onmessage` on the other.
 * `close()` on either side calls `onclose` on both.
 */
// InProcessTransport 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
class InProcessTransport implements Transport {
  private peer: InProcessTransport | undefined
  private closed = false

  onclose?: () => void
  // 这个回调绑定到 onerror?: (error: Error) => void，负责MCP 服务在该局部场景下的响应。
  onerror?: (error: Error) => void
  // 这个回调绑定到 onmessage?: (message: JSONRPCMessage) => void，负责MCP 服务在该局部场景下的响应。
  onmessage?: (message: JSONRPCMessage) => void

  /** @internal */
  // _setPeer 使用 peer: InProcessTransport 完成MCP 服务里的对应操作。
  _setPeer(peer: InProcessTransport): void {
    // 更新实例字段 peer 为 peer，同步MCP 服务的内部状态。
    this.peer = peer
  }

  // start 使用 无 完成MCP 服务里的对应操作。
  async start(): Promise<void> {}

  // send 使用 message: JSONRPCMessage 完成MCP 服务里的对应操作。
  async send(message: JSONRPCMessage): Promise<void> {
    // 满足 `this.closed` 时，MCP 服务执行该分支。
    if (this.closed) {
      // 抛出 new Error('Transport is closed')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Transport is closed')
    }
    // Deliver to the other side asynchronously to avoid stack depth issues
    // with synchronous request/response cycles
    // 调用 queueMicrotask，触发MCP 服务此处需要的副作用。
    queueMicrotask(() => {
      // 调用 this.peer?.onmessage?.(message)，完成这一处局部操作。
      this.peer?.onmessage?.(message)
    })
  }

  // close 使用 无 完成MCP 服务里的对应操作。
  async close(): Promise<void> {
    // 满足 `this.closed` 时，MCP 服务执行该分支。
    if (this.closed) {
      // MCP 服务 In Process Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 更新实例字段 closed 为 true，同步MCP 服务的内部状态。
    this.closed = true
    // 调用 this.onclose?.()，完成这一处局部操作。
    this.onclose?.()
    // Close the peer if it hasn't already closed
    // 组合条件 `this.peer && !this.peer.closed` 成立时，MCP 服务才启用这条专门路径。
    if (this.peer && !this.peer.closed) {
      // closed更新为 `true`，确保MCP 服务后续读取最新状态。
      this.peer.closed = true
      // 调用 this.peer.onclose?.()，完成这一处局部操作。
      this.peer.onclose?.()
    }
  }
}

/**
 * Creates a pair of linked transports for in-process MCP communication.
 * Messages sent on one transport are delivered to the other's `onmessage`.
 *
 * @returns [clientTransport, serverTransport]
 */
// createLinkedTransportPair 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createLinkedTransportPair(): [Transport, Transport] {
  // a保存`InProcessTransport`，供MCP 服务后续处理使用。
  const a = new InProcessTransport()
  // b保存`InProcessTransport`，供MCP 服务后续处理使用。
  const b = new InProcessTransport()
  // 调用 a._setPeer，触发MCP 服务此处需要的副作用。
  a._setPeer(b)
  // 调用 b._setPeer，触发MCP 服务此处需要的副作用。
  b._setPeer(a)
  // 返回列表结果，保留MCP 服务已经排好的条目顺序。
  return [a, b]
}
