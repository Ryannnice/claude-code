// biome-ignore-all lint/suspicious/noConsole: file uses console intentionally
/**
 * Chrome Native Host - Pure TypeScript Implementation
 *
 * This module provides the Chrome native messaging host functionality,
 * previously implemented as a Rust NAPI binding but now in pure TypeScript.
 */

// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  appendFile,
  chmod,
  mkdir,
  readdir,
  rmdir,
  stat,
  unlink,
} from 'fs/promises'
// 引入 createServer、Server、Socket，将 net 中已经封装好的能力接到本文件流程里。
import { createServer, type Server, type Socket } from 'net'
// 引入 homedir、platform，将 os 中已经封装好的能力接到本文件流程里。
import { homedir, platform } from 'os'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 z，将 zod 中已经封装好的能力接到本文件流程里。
import { z } from 'zod'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 jsonParse、jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse, jsonStringify } from '../slowOperations.js'
// 引入 getSecureSocketPath、getSocketDir，将 ./common.js 中已经封装好的能力接到本文件流程里。
import { getSecureSocketPath, getSocketDir } from './common.js'

// VERSION 命名 `'1.0.0'`，让后续代码直接表达这个值的用途。
const VERSION = '1.0.0'
// MAX_MESSAGE_SIZE 消息数据统计`1024 * 1024 // 1MB - Max message size that can be sent to...`，供后续判断或组装使用。
const MAX_MESSAGE_SIZE = 1024 * 1024 // 1MB - Max message size that can be sent to Chrome

// LOG_FILE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const LOG_FILE =
  process.env.USER_TYPE === 'ant'
    ? join(homedir(), '.claude', 'debug', 'chrome-native-host.txt')
    : undefined

// log 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function log(message: string, ...args: unknown[]): void {
  // 满足 `LOG_FILE` 时，共享工具执行该分支。
  if (LOG_FILE) {
    // timestamp记录时间`Date`，供共享工具后续处理使用。
    const timestamp = new Date().toISOString()
    // formattedArgs 集合保存`jsonStringify`，供共享工具后续处理使用。
    const formattedArgs = args.length > 0 ? ' ' + jsonStringify(args) : ''
    // logLine读取 ``[${timestamp}] [Claude Chrome Native Host] ${message}${f...` 对应条目，后续围绕该成员继续处理。
    const logLine = `[${timestamp}] [Claude Chrome Native Host] ${message}${formattedArgs}\n`
    // Fire-and-forget: logging is best-effort and callers (including event
    // handlers) don't await
    // 这个回调绑定到 void appendFile(LOG_FILE, logLine).catch(() => {，负责共享工具在该局部场景下的响应。
    void appendFile(LOG_FILE, logLine).catch(() => {
      // Ignore file write errors
    })
  }
  // 调用 console.error，触发共享工具此处需要的副作用。
  console.error(`[Claude Chrome Native Host] ${message}`, ...args)
}
/**
 * Send a message to stdout (Chrome native messaging protocol)
 */
// sendChromeMessage 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sendChromeMessage(message: string): void {
  // jsonBytes 集合保存`Buffer.from`，供共享工具后续处理使用。
  const jsonBytes = Buffer.from(message, 'utf-8')
  // lengthBuffer 数量保存`Buffer.alloc`，供共享工具后续处理使用。
  const lengthBuffer = Buffer.alloc(4)
  // 调用 lengthBuffer.writeUInt32LE，触发共享工具此处需要的副作用。
  lengthBuffer.writeUInt32LE(jsonBytes.length, 0)

  // 向标准输出写入共享工具要展示给用户的文本。
  process.stdout.write(lengthBuffer)
  // 向标准输出写入共享工具要展示给用户的文本。
  process.stdout.write(jsonBytes)
}

// runChromeNativeHost 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function runChromeNativeHost(): Promise<void> {
  // 调用 log，触发共享工具此处需要的副作用。
  log('Initializing...')

  // host保存`ChromeNativeHost`，供共享工具后续处理使用。
  const host = new ChromeNativeHost()
  // messageReader 消息数据保存`ChromeMessageReader`，供共享工具后续处理使用。
  const messageReader = new ChromeMessageReader()

  // Start the native host server
  // 等待 `host.start()` 完成，再继续共享工具 chrome Native Host的异步流程。
  await host.start()

  // Process messages from Chrome until stdin closes
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  // while 使用 true 完成共享工具里的对应操作。
  while (true) {
    // 消息读取`messageReader.read`，供共享工具后续处理使用。
    const message = await messageReader.read()
    // 满足 `message === null` 时，共享工具执行该分支。
    if (message === null) {
      // stdin closed, Chrome disconnected
      // 结束这个分支或循环，避免共享工具继续落入后续路径。
      break
    }

    // 等待 `host.handleMessage(message)` 完成，再继续共享工具 chrome Native Host的异步流程。
    await host.handleMessage(message)
  }

  // Stop the server
  // 等待 `host.stop()` 完成，再继续共享工具 chrome Native Host的异步流程。
  await host.stop()
}

// messageSchema 消息数据保存`lazySchema`，供共享工具后续处理使用。
const messageSchema = lazySchema(() =>
  z
    .object({
      type: z.string(),
    })
    .passthrough(),
)

// ToolRequest 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolRequest = {
  method: string
  params?: unknown
}

// McpClient 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type McpClient = {
  id: number
  socket: Socket
  buffer: Buffer
}

// ChromeNativeHost 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class ChromeNativeHost {
  private mcpClients = new Map<number, McpClient>()
  private nextClientId = 1
  private server: Server | null = null
  private running = false
  private socketPath: string | null = null

  // start 使用 无 完成共享工具里的对应操作。
  async start(): Promise<void> {
    // 满足 `this.running` 时，共享工具执行该分支。
    if (this.running) {
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 更新实例字段 socketPath 为 getSecureSocketPath()，同步共享工具的内部状态。
    this.socketPath = getSecureSocketPath()

    // `platform()` 与 `'win32'` 不一致时刷新派生状态，避免使用过期结果。
    if (platform() !== 'win32') {
      // socketDir读取`getSocketDir`，供共享工具后续处理使用。
      const socketDir = getSocketDir()

      // Migrate legacy socket: if socket dir path exists as a file/socket, remove it
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // dirStats 集合保存`stat`，供共享工具后续处理使用。
        const dirStats = await stat(socketDir)
        // 满足 `!dirStats.isDirectory()` 时，共享工具执行该分支。
        if (!dirStats.isDirectory()) {
          // 等待 `unlink(socketDir)` 完成，再继续共享工具 chrome Native Host的异步流程。
          await unlink(socketDir)
        }
      } catch {
        // Doesn't exist, that's fine
      }

      // Create socket directory with secure permissions
      // 等待 `mkdir(socketDir, { recursive: true, mode: 0o700 })` 完成，再继续共享工具 chrome Native Host的异步流程。
      await mkdir(socketDir, { recursive: true, mode: 0o700 })

      // Fix perms if directory already existed
      // 这个回调绑定到 await chmod(socketDir, 0o700).catch(() => {，负责共享工具在该局部场景下的响应。
      await chmod(socketDir, 0o700).catch(() => {
        // Ignore
      })

      // Clean up stale sockets
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // files 文件数据读取`readdir`，供共享工具后续处理使用。
        const files = await readdir(socketDir)
        // 按顺序遍历 `files` 中的file 文件数据，逐个交给共享工具处理。
        for (const file of files) {
          // 满足 `!file.endsWith('.sock')` 时，共享工具执行该分支。
          if (!file.endsWith('.sock')) {
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // pid解析`parseInt`，供共享工具后续处理使用。
          const pid = parseInt(file.replace('.sock', ''), 10)
          // 满足 `isNaN(pid)` 时，共享工具执行该分支。
          if (isNaN(pid)) {
            // 跳过当前项，继续处理共享工具中的下一轮循环。
            continue
          }
          // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
          try {
            // 调用 process.kill，触发共享工具此处需要的副作用。
            process.kill(pid, 0)
            // Process is alive, leave it
          } catch {
            // Process is dead, remove stale socket
            // 这个回调绑定到 await unlink(join(socketDir, file)).catch(() => {，负责共享工具在该局部场景下的响应。
            await unlink(join(socketDir, file)).catch(() => {
              // Ignore
            })
            // 调用 log，触发共享工具此处需要的副作用。
            log(`Removed stale socket for PID ${pid}`)
          }
        }
      } catch {
        // Ignore errors scanning directory
      }
    }

    // 调用 log，触发共享工具此处需要的副作用。
    log(`Creating socket listener: ${this.socketPath}`)

    // 更新实例字段 server 为 createServer(socket => this.handleMcpClient(socket))，同步共享工具的内部状态。
    this.server = createServer(socket => this.handleMcpClient(socket))

    // 这个回调绑定到 await new Promise<void>((resolve, reject) => {，负责共享工具在该局部场景下的响应。
    await new Promise<void>((resolve, reject) => {
      // 这个回调绑定到 this.server!.listen(this.socketPath!, () => {，负责共享工具在该局部场景下的响应。
      this.server!.listen(this.socketPath!, () => {
        // 调用 log，触发共享工具此处需要的副作用。
        log('Socket server listening for connections')
        // 更新实例字段 running 为 true，同步共享工具的内部状态。
        this.running = true
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve()
      })

      // 这个回调绑定到 this.server!.on('error', err => {，负责共享工具在该局部场景下的响应。
      this.server!.on('error', err => {
        // 调用 log，触发共享工具此处需要的副作用。
        log('Socket server error:', err)
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(err)
      })
    })

    // Set permissions on Unix (after listen resolves so socket file exists)
    // `platform()` 与 `'win32'` 不一致时刷新派生状态，避免使用过期结果。
    if (platform() !== 'win32') {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `chmod(this.socketPath!, 0o600)` 完成，再继续共享工具 chrome Native Host的异步流程。
        await chmod(this.socketPath!, 0o600)
        // 调用 log，触发共享工具此处需要的副作用。
        log('Socket permissions set to 0600')
      } catch (e) {
        // 调用 log，触发共享工具此处需要的副作用。
        log('Failed to set socket permissions:', e)
      }
    }
  }

  // stop 使用 无 完成共享工具里的对应操作。
  async stop(): Promise<void> {
    // this.running缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.running) {
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Close all MCP clients
    // 循环处理 `const [, client] of this.mcpClients`，让共享工具逐项把同类条目按顺序走完。
    for (const [, client] of this.mcpClients) {
      // 调用 client.socket.destroy，触发共享工具此处需要的副作用。
      client.socket.destroy()
    }
    // 调用 this.mcpClients.clear，触发共享工具此处需要的副作用。
    this.mcpClients.clear()

    // Close server
    // 满足 `this.server` 时，共享工具执行该分支。
    if (this.server) {
      // 这个回调绑定到 await new Promise<void>(resolve => {，负责共享工具在该局部场景下的响应。
      await new Promise<void>(resolve => {
        // 这个回调绑定到 this.server!.close(() => resolve())，负责共享工具在该局部场景下的响应。
        this.server!.close(() => resolve())
      })
      // 更新实例字段 server 为 null，同步共享工具的内部状态。
      this.server = null
    }

    // Cleanup socket file
    // `platform()` 与 `'win32' && this.socketPath` 不一致时刷新派生状态，避免使用过期结果。
    if (platform() !== 'win32' && this.socketPath) {
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `unlink(this.socketPath)` 完成，再继续共享工具 chrome Native Host的异步流程。
        await unlink(this.socketPath)
        // 调用 log，触发共享工具此处需要的副作用。
        log('Cleaned up socket file')
      } catch {
        // ENOENT is fine, ignore
      }

      // Remove directory if empty
      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // socketDir读取`getSocketDir`，供共享工具后续处理使用。
        const socketDir = getSocketDir()
        // remaining读取`readdir`，供共享工具后续处理使用。
        const remaining = await readdir(socketDir)
        // remaining为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
        if (remaining.length === 0) {
          // 等待 `rmdir(socketDir)` 完成，再继续共享工具 chrome Native Host的异步流程。
          await rmdir(socketDir)
          // 调用 log，触发共享工具此处需要的副作用。
          log('Removed empty socket directory')
        }
      } catch {
        // Ignore
      }
    }

    // 更新实例字段 running 为 false，同步共享工具的内部状态。
    this.running = false
  }

  // isRunning 用 无 判断共享工具是否满足条件。
  async isRunning(): Promise<boolean> {
    // 返回 `this.running`，作为共享工具这次计算的结果。
    return this.running
  }

  // getClientCount不依赖额外参数，直接计算共享工具需要的结果。
  async getClientCount(): Promise<number> {
    // 返回 `this.mcpClients.size`，作为共享工具这次计算的结果。
    return this.mcpClients.size
  }

  // handleMessage 使用 messageJson: string 完成共享工具里的对应操作。
  async handleMessage(messageJson: string): Promise<void> {
    // rawMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
    let rawMessage: unknown
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // rawMessage 消息数据更新为 `jsonParse(messageJson)`，确保共享工具后续读取最新状态。
      rawMessage = jsonParse(messageJson)
    } catch (e) {
      // 调用 log，触发共享工具此处需要的副作用。
      log('Invalid JSON from Chrome:', (e as Error).message)
      // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
      sendChromeMessage(
        jsonStringify({
          type: 'error',
          error: 'Invalid message format',
        }),
      )
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 解析结果保存`messageSchema`，供共享工具后续处理使用。
    const parsed = messageSchema().safeParse(rawMessage)
    // parsed.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!parsed.success) {
      // 调用 log，触发共享工具此处需要的副作用。
      log('Invalid message from Chrome:', parsed.error.message)
      // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
      sendChromeMessage(
        jsonStringify({
          type: 'error',
          error: 'Invalid message format',
        }),
      )
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 消息解析`parsed.data` 整理出中间结果，供共享工具 chrome Native Host后续步骤使用。
    const message = parsed.data

    // 调用 log，触发共享工具此处需要的副作用。
    log(`Handling Chrome message type: ${message.type}`)

    // 按照 message.type 的取值选择共享工具的具体处理分支。
    switch (message.type) {
      case 'ping':
        // 调用 log，触发共享工具此处需要的副作用。
        log('Responding to ping')

        // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
        sendChromeMessage(
          jsonStringify({
            type: 'pong',
            timestamp: Date.now(),
          }),
        )
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break

      case 'get_status':
        // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
        sendChromeMessage(
          jsonStringify({
            type: 'status_response',
            native_host_version: VERSION,
          }),
        )
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break

      case 'tool_response': {
        // 满足 `this.mcpClients.size > 0` 时，共享工具执行该分支。
        if (this.mcpClients.size > 0) {
          // 调用 log，触发共享工具此处需要的副作用。
          log(`Forwarding tool response to ${this.mcpClients.size} MCP clients`)

          // Extract the data portion (everything except 'type')
          // 从 `message` 解构 type、其余 data，减少共享工具 chrome Native Host对同一对象的重复访问。
          const { type: _, ...data } = message
          // responseData 响应数据保存`Buffer.from`，供共享工具后续处理使用。
          const responseData = Buffer.from(jsonStringify(data), 'utf-8')
          // lengthBuffer 数量保存`Buffer.alloc`，供共享工具后续处理使用。
          const lengthBuffer = Buffer.alloc(4)
          // 调用 lengthBuffer.writeUInt32LE，触发共享工具此处需要的副作用。
          lengthBuffer.writeUInt32LE(responseData.length, 0)
          // responseMsg 响应数据保存`Buffer.concat`，供共享工具后续处理使用。
          const responseMsg = Buffer.concat([lengthBuffer, responseData])

          // 循环处理 `const [id, client] of this.mcpClients`，让共享工具逐项把同类条目按顺序走完。
          for (const [id, client] of this.mcpClients) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // 调用 client.socket.write，触发共享工具此处需要的副作用。
              client.socket.write(responseMsg)
            } catch (e) {
              // 调用 log，触发共享工具此处需要的副作用。
              log(`Failed to send to MCP client ${id}:`, e)
            }
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      case 'notification': {
        // 满足 `this.mcpClients.size > 0` 时，共享工具执行该分支。
        if (this.mcpClients.size > 0) {
          // 调用 log，触发共享工具此处需要的副作用。
          log(`Forwarding notification to ${this.mcpClients.size} MCP clients`)

          // Extract the data portion (everything except 'type')
          // 从 `message` 解构 type、其余 data，减少共享工具 chrome Native Host对同一对象的重复访问。
          const { type: _, ...data } = message
          // notificationData保存`Buffer.from`，供共享工具后续处理使用。
          const notificationData = Buffer.from(jsonStringify(data), 'utf-8')
          // lengthBuffer 数量保存`Buffer.alloc`，供共享工具后续处理使用。
          const lengthBuffer = Buffer.alloc(4)
          // 调用 lengthBuffer.writeUInt32LE，触发共享工具此处需要的副作用。
          lengthBuffer.writeUInt32LE(notificationData.length, 0)
          // notificationMsg保存`Buffer.concat`，供共享工具后续处理使用。
          const notificationMsg = Buffer.concat([
            lengthBuffer,
            notificationData,
          ])

          // 循环处理 `const [id, client] of this.mcpClients`，让共享工具逐项把同类条目按顺序走完。
          for (const [id, client] of this.mcpClients) {
            // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
            try {
              // 调用 client.socket.write，触发共享工具此处需要的副作用。
              client.socket.write(notificationMsg)
            } catch (e) {
              // 调用 log，触发共享工具此处需要的副作用。
              log(`Failed to send notification to MCP client ${id}:`, e)
            }
          }
        }
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      }

      default:
        // 调用 log，触发共享工具此处需要的副作用。
        log(`Unknown message type: ${message.type}`)

        // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
        sendChromeMessage(
          jsonStringify({
            type: 'error',
            error: `Unknown message type: ${message.type}`,
          }),
        )
    }
  }

  // 共享工具 chrome Native Host在这里处理 `private handleMcpClient(socket: Socket): void {`，完成这一小步状态转换。
  private handleMcpClient(socket: Socket): void {
    // clientId保存`this.nextClientId++`，供后续判断或组装使用。
    const clientId = this.nextClientId++
    // API 客户端 集中保存共享工具 chrome Native Host要一起传递的字段。
    const client: McpClient = {
      id: clientId,
      socket,
      buffer: Buffer.alloc(0),
    }

    // this.mcpClients.set 写入新的状态值，使共享工具后续读取保持一致。
    this.mcpClients.set(clientId, client)
    // 调用 log，触发共享工具此处需要的副作用。
    log(
      `MCP client ${clientId} connected. Total clients: ${this.mcpClients.size}`,
    )

    // Notify Chrome of connection
    // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
    sendChromeMessage(
      jsonStringify({
        type: 'mcp_connected',
      }),
    )

    // 调用 socket.on，触发共享工具此处需要的副作用。
    socket.on('data', (data: Buffer) => {
      // buffer更新为 `Buffer.concat([client.buffer, data])`，确保共享工具后续读取最新状态。
      client.buffer = Buffer.concat([client.buffer, data])

      // Process complete messages
      // while 使用 client.buffer.length >= 4 完成共享工具里的对应操作。
      while (client.buffer.length >= 4) {
        // length 数量读取`buffer.readUInt32LE`，供共享工具后续处理使用。
        const length = client.buffer.readUInt32LE(0)

        // 只有 `length === 0 || length > MAX_MESSAGE_SIZE` 满足时，共享工具才执行该分支。
        if (length === 0 || length > MAX_MESSAGE_SIZE) {
          // 调用 log，触发共享工具此处需要的副作用。
          log(`Invalid message length from MCP client ${clientId}: ${length}`)
          // 调用 socket.destroy，触发共享工具此处需要的副作用。
          socket.destroy()
          // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 满足 `client.buffer.length < 4 + length` 时，共享工具执行该分支。
        if (client.buffer.length < 4 + length) {
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break // Wait for more data
        }

        // messageBytes 消息数据格式化`buffer.slice`，供共享工具后续处理使用。
        const messageBytes = client.buffer.slice(4, 4 + length)
        // buffer更新为 `client.buffer.slice(4 + length)`，确保共享工具后续读取最新状态。
        client.buffer = client.buffer.slice(4 + length)

        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // request 请求数据解析`jsonParse`，供共享工具后续处理使用。
          const request = jsonParse(
            messageBytes.toString('utf-8'),
          ) as ToolRequest
          // 调用 log，触发共享工具此处需要的副作用。
          log(
            `Forwarding tool request from MCP client ${clientId}: ${request.method}`,
          )

          // Forward to Chrome
          // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
          sendChromeMessage(
            jsonStringify({
              type: 'tool_request',
              method: request.method,
              params: request.params,
            }),
          )
        } catch (e) {
          // 调用 log，触发共享工具此处需要的副作用。
          log(`Failed to parse tool request from MCP client ${clientId}:`, e)
        }
      }
    })

    // 调用 socket.on，触发共享工具此处需要的副作用。
    socket.on('error', err => {
      // 调用 log，触发共享工具此处需要的副作用。
      log(`MCP client ${clientId} error: ${err}`)
    })

    // 调用 socket.on，触发共享工具此处需要的副作用。
    socket.on('close', () => {
      // 调用 log，触发共享工具此处需要的副作用。
      log(
        `MCP client ${clientId} disconnected. Remaining clients: ${this.mcpClients.size - 1}`,
      )
      // 调用 this.mcpClients.delete，触发共享工具此处需要的副作用。
      this.mcpClients.delete(clientId)

      // Notify Chrome of disconnection
      // 调用 sendChromeMessage，触发共享工具此处需要的副作用。
      sendChromeMessage(
        jsonStringify({
          type: 'mcp_disconnected',
        }),
      )
    })
  }
}

/**
 * Chrome message reader using async stdin. Synchronous reads can crash Bun, so we use
 * async reads with a buffer.
 */
// ChromeMessageReader 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class ChromeMessageReader {
  private buffer = Buffer.alloc(0)
  private pendingResolve: ((value: string | null) => void) | null = null
  private closed = false

  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 调用 process.stdin.on，触发共享工具此处需要的副作用。
    process.stdin.on('data', (chunk: Buffer) => {
      // 更新实例字段 buffer 为 Buffer.concat([this.buffer, chunk])，同步共享工具的内部状态。
      this.buffer = Buffer.concat([this.buffer, chunk])
      // 调用 this.tryProcessMessage，触发共享工具此处需要的副作用。
      this.tryProcessMessage()
    })

    // 调用 process.stdin.on，触发共享工具此处需要的副作用。
    process.stdin.on('end', () => {
      // 更新实例字段 closed 为 true，同步共享工具的内部状态。
      this.closed = true
      // 满足 `this.pendingResolve` 时，共享工具执行该分支。
      if (this.pendingResolve) {
        // 调用 this.pendingResolve，触发共享工具此处需要的副作用。
        this.pendingResolve(null)
        // 更新实例字段 pendingResolve 为 null，同步共享工具的内部状态。
        this.pendingResolve = null
      }
    })

    // 调用 process.stdin.on，触发共享工具此处需要的副作用。
    process.stdin.on('error', () => {
      // 更新实例字段 closed 为 true，同步共享工具的内部状态。
      this.closed = true
      // 满足 `this.pendingResolve` 时，共享工具执行该分支。
      if (this.pendingResolve) {
        // 调用 this.pendingResolve，触发共享工具此处需要的副作用。
        this.pendingResolve(null)
        // 更新实例字段 pendingResolve 为 null，同步共享工具的内部状态。
        this.pendingResolve = null
      }
    })
  }

  // 共享工具 chrome Native Host在这里处理 `private tryProcessMessage(): void {`，完成这一小步状态转换。
  private tryProcessMessage(): void {
    // this.pendingResolve缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!this.pendingResolve) {
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Need at least 4 bytes for length prefix
    // 满足 `this.buffer.length < 4` 时，共享工具执行该分支。
    if (this.buffer.length < 4) {
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // length 数量读取`buffer.readUInt32LE`，供共享工具后续处理使用。
    const length = this.buffer.readUInt32LE(0)

    // 只有 `length === 0 || length > MAX_MESSAGE_SIZE` 满足时，共享工具才执行该分支。
    if (length === 0 || length > MAX_MESSAGE_SIZE) {
      // 调用 log，触发共享工具此处需要的副作用。
      log(`Invalid message length: ${length}`)
      // 调用 this.pendingResolve，触发共享工具此处需要的副作用。
      this.pendingResolve(null)
      // 更新实例字段 pendingResolve 为 null，同步共享工具的内部状态。
      this.pendingResolve = null
      // 共享工具 chrome Native Host在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Check if we have the full message
    // 满足 `this.buffer.length < 4 + length` 时，共享工具执行该分支。
    if (this.buffer.length < 4 + length) {
      // 返回 `// Wait for more data`，作为共享工具这次计算的结果。
      return // Wait for more data
    }

    // Extract the message
    // messageBytes 消息数据保存`buffer.subarray`，供共享工具后续处理使用。
    const messageBytes = this.buffer.subarray(4, 4 + length)
    // 更新实例字段 buffer 为 this.buffer.subarray(4 + length)，同步共享工具的内部状态。
    this.buffer = this.buffer.subarray(4 + length)

    // 消息格式化`messageBytes.toString`，供共享工具后续处理使用。
    const message = messageBytes.toString('utf-8')
    // 调用 this.pendingResolve，触发共享工具此处需要的副作用。
    this.pendingResolve(message)
    // 更新实例字段 pendingResolve 为 null，同步共享工具的内部状态。
    this.pendingResolve = null
  }

  // read 使用 无 完成共享工具里的对应操作。
  async read(): Promise<string | null> {
    // 满足 `this.closed` 时，共享工具执行该分支。
    if (this.closed) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // Check if we already have a complete message buffered
    // 满足 `this.buffer.length >= 4` 时，共享工具执行该分支。
    if (this.buffer.length >= 4) {
      // length 数量读取`buffer.readUInt32LE`，供共享工具后续处理使用。
      const length = this.buffer.readUInt32LE(0)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        length > 0 &&
        length <= MAX_MESSAGE_SIZE &&
        this.buffer.length >= 4 + length
      ) {
        // messageBytes 消息数据保存`buffer.subarray`，供共享工具后续处理使用。
        const messageBytes = this.buffer.subarray(4, 4 + length)
        // 更新实例字段 buffer 为 this.buffer.subarray(4 + length)，同步共享工具的内部状态。
        this.buffer = this.buffer.subarray(4 + length)
        // 返回 `messageBytes.toString('utf-8')`，作为共享工具这次计算的结果。
        return messageBytes.toString('utf-8')
      }
    }

    // Wait for more data
    // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
    return new Promise(resolve => {
      // 更新实例字段 pendingResolve 为 resolve，同步共享工具的内部状态。
      this.pendingResolve = resolve
      // In case data arrived between check and setting pendingResolve
      // 调用 this.tryProcessMessage，触发共享工具此处需要的副作用。
      this.tryProcessMessage()
    })
  }
}
