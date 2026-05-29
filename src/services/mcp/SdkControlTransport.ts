/**
 * SDK MCP Transport Bridge
 *
 * This file implements a transport bridge that allows MCP servers running in the SDK process
 * to communicate with the Claude Code CLI process through control messages.
 *
 * ## Architecture Overview
 *
 * Unlike regular MCP servers that run as separate processes, SDK MCP servers run in-process
 * within the SDK. This requires a special transport mechanism to bridge communication between:
 * - The CLI process (where the MCP client runs)
 * - The SDK process (where the SDK MCP server runs)
 *
 * ## Message Flow
 *
 * ### CLI → SDK (via SdkControlClientTransport)
 * 1. CLI's MCP Client calls a tool → sends JSONRPC request to SdkControlClientTransport
 * 2. Transport wraps the message in a control request with server_name and request_id
 * 3. Control request is sent via stdout to the SDK process
 * 4. SDK's StructuredIO receives the control response and routes it back to the transport
 * 5. Transport unwraps the response and returns it to the MCP Client
 *
 * ### SDK → CLI (via SdkControlServerTransport)
 * 1. Query receives control request with MCP message and calls transport.onmessage
 * 2. MCP server processes the message and calls transport.send() with response
 * 3. Transport calls sendMcpMessage callback with the response
 * 4. Query's callback resolves the pending promise with the response
 * 5. Query returns the response to complete the control request
 *
 * ## Key Design Points
 *
 * - SdkControlClientTransport: StructuredIO tracks pending requests
 * - SdkControlServerTransport: Query tracks pending requests
 * - The control request wrapper includes server_name to route to the correct SDK server
 * - The system supports multiple SDK MCP servers running simultaneously
 * - Message IDs are preserved through the entire flow for proper correlation
 */

// 类型依赖 { Transport } 来自 @modelcontextprotocol/sdk/shared/transport.js，用于校准MCP 服务的数据契约。
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
// 类型依赖 { JSONRPCMessage } 来自 @modelcontextprotocol/sdk/types.js，用于校准MCP 服务的数据契约。
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

/**
 * Callback function to send an MCP message and get the response
 */
// SendMcpMessageCallback 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
export type SendMcpMessageCallback = (
  serverName: string,
  message: JSONRPCMessage,
) => Promise<JSONRPCMessage>

/**
 * CLI-side transport for SDK MCP servers.
 *
 * This transport is used in the CLI process to bridge communication between:
 * - The CLI's MCP Client (which wants to call tools on SDK MCP servers)
 * - The SDK process (where the actual MCP server runs)
 *
 * It converts MCP protocol messages into control requests that can be sent
 * through stdout/stdin to the SDK process.
 */
// SdkControlClientTransport 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class SdkControlClientTransport implements Transport {
  private isClosed = false

  onclose?: () => void
  onerror?: (error: Error) => void
  // 这个回调绑定到 onmessage?: (message: JSONRPCMessage) => void，负责MCP 服务在该局部场景下的响应。
  onmessage?: (message: JSONRPCMessage) => void

  // 构造函数初始化实例状态，确保MCP 服务后续方法读取到完整配置。
  constructor(
    private serverName: string,
    private sendMcpMessage: SendMcpMessageCallback,
  ) {}

  // start 使用 无 完成MCP 服务里的对应操作。
  async start(): Promise<void> {}

  // send 使用 message: JSONRPCMessage 完成MCP 服务里的对应操作。
  async send(message: JSONRPCMessage): Promise<void> {
    // 满足 `this.isClosed` 时，MCP 服务执行该分支。
    if (this.isClosed) {
      // 抛出 new Error('Transport is closed')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Transport is closed')
    }

    // Send the message and wait for the response
    // 接口响应保存`this.sendMcpMessage`，供MCP 服务后续处理使用。
    const response = await this.sendMcpMessage(this.serverName, message)

    // Pass the response back to the MCP client
    // 满足 `this.onmessage` 时，MCP 服务执行该分支。
    if (this.onmessage) {
      // 调用 this.onmessage，触发MCP 服务此处需要的副作用。
      this.onmessage(response)
    }
  }

  // close 使用 无 完成MCP 服务里的对应操作。
  async close(): Promise<void> {
    // 满足 `this.isClosed` 时，MCP 服务执行该分支。
    if (this.isClosed) {
      // MCP 服务 Sdk Control Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 更新实例字段 isClosed 为 true，同步MCP 服务的内部状态。
    this.isClosed = true
    // 调用 this.onclose?.()，完成这一处局部操作。
    this.onclose?.()
  }
}

/**
 * SDK-side transport for SDK MCP servers.
 *
 * This transport is used in the SDK process to bridge communication between:
 * - Control requests coming from the CLI (via stdin)
 * - The actual MCP server running in the SDK process
 *
 * It acts as a simple pass-through that forwards messages to the MCP server
 * and sends responses back via a callback.
 *
 * Note: Query handles all request/response correlation and async flow.
 */
// SdkControlServerTransport 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class SdkControlServerTransport implements Transport {
  private isClosed = false

  // 构造函数接收 private sendMcpMessage: (message: JSONRPCMessage，把外部输入转成实例内部状态。
  constructor(private sendMcpMessage: (message: JSONRPCMessage) => void) {}

  onclose?: () => void
  onerror?: (error: Error) => void
  onmessage?: (message: JSONRPCMessage) => void

  // start 使用 无 完成MCP 服务里的对应操作。
  async start(): Promise<void> {}

  // send 使用 message: JSONRPCMessage 完成MCP 服务里的对应操作。
  async send(message: JSONRPCMessage): Promise<void> {
    // 满足 `this.isClosed` 时，MCP 服务执行该分支。
    if (this.isClosed) {
      // 抛出 new Error('Transport is closed')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Transport is closed')
    }

    // Simply pass the response back through the callback
    // 调用 this.sendMcpMessage，触发MCP 服务此处需要的副作用。
    this.sendMcpMessage(message)
  }

  // close 使用 无 完成MCP 服务里的对应操作。
  async close(): Promise<void> {
    // 满足 `this.isClosed` 时，MCP 服务执行该分支。
    if (this.isClosed) {
      // MCP 服务 Sdk Control Transport在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 更新实例字段 isClosed 为 true，同步MCP 服务的内部状态。
    this.isClosed = true
    // 调用 this.onclose?.()，完成这一处局部操作。
    this.onclose?.()
  }
}
