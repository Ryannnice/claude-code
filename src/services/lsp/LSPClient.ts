// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { type ChildProcess, spawn } from 'child_process'
// 整理这一组导入，让服务层 LSPClient后续逻辑可以直接复用这些外部能力。
import {
  createMessageConnection,
  type MessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  Trace,
} from 'vscode-jsonrpc/node.js'
// 整理这一组导入，让服务层 LSPClient后续逻辑可以直接复用这些外部能力。
import type {
  InitializeParams,
  InitializeResult,
  ServerCapabilities,
} from 'vscode-languageserver-protocol'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 subprocessEnv 工具函数，把通用处理留在 ../../utils/subprocessEnv.js 中维护。
import { subprocessEnv } from '../../utils/subprocessEnv.js'
/**
 * LSP client interface.
 */
// LSPClient 固化服务层 LSPClient里传递的数据形状，帮助调用方按同一结构读写字段。
export type LSPClient = {
  readonly capabilities: ServerCapabilities | undefined
  readonly isInitialized: boolean
  // 服务层 LSPClient在这里处理 `start: (`，完成这一小步状态转换。
  start: (
    command: string,
    args: string[],
    options?: {
      env?: Record<string, string>
      cwd?: string
    },
  ) => Promise<void>
  // 这个回调绑定到 initialize: (params: InitializeParams) => Promise<InitializeResult>，负责服务层 LSPClient在该局部场景下的响应。
  initialize: (params: InitializeParams) => Promise<InitializeResult>
  sendRequest: <TResult>(method: string, params: unknown) => Promise<TResult>
  // 这个回调绑定到 sendNotification: (method: string, params: unknown) => Promise<void>，负责服务层 LSPClient在该局部场景下的响应。
  sendNotification: (method: string, params: unknown) => Promise<void>
  // 这个回调绑定到 onNotification: (method: string, handler: (params: unknown) => void) => void，负责服务层 LSPClient在该局部场景下的响应。
  onNotification: (method: string, handler: (params: unknown) => void) => void
  onRequest: <TParams, TResult>(
    method: string,
    // 这个回调绑定到 handler: (params: TParams) => TResult | Promise<TResult>,，负责服务层 LSPClient在该局部场景下的响应。
    handler: (params: TParams) => TResult | Promise<TResult>,
  ) => void
  // 这个回调绑定到 stop: () => Promise<void>，负责服务层 LSPClient在该局部场景下的响应。
  stop: () => Promise<void>
}

/**
 * Create an LSP client wrapper using vscode-jsonrpc.
 * Manages communication with an LSP server process via stdio.
 *
 * @param onCrash - Called when the server process exits unexpectedly (non-zero
 *   exit code during operation, not during intentional stop). Allows the owner
 *   to propagate crash state so the server can be restarted on next use.
 */
// createLSPClient 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createLSPClient(
  serverName: string,
  onCrash?: (error: Error) => void,
): LSPClient {
  // State variables in closure
  // process 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let process: ChildProcess | undefined
  // connection 先占位，稍后的条件分支会根据实际输入补齐它。
  let connection: MessageConnection | undefined
  // capabilities 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let capabilities: ServerCapabilities | undefined
  // isInitialized标记服务层 LSPClient是否启用对应路径。
  let isInitialized = false
  // startFailed标记服务层 LSPClient是否启用对应路径。
  let startFailed = false
  // startError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let startError: Error | undefined
  // isStopping标记服务层 LSPClient是否启用对应路径。
  let isStopping = false // Track intentional shutdown to avoid spurious error logging
  // Queue handlers registered before connection ready (lazy initialization support)
  // pendingHandlers 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  const pendingHandlers: Array<{
    method: string
    // 这个回调绑定到 handler: (params: unknown) => void，负责服务层 LSPClient在该局部场景下的响应。
    handler: (params: unknown) => void
  }> = []
  // pendingRequestHandlers 请求数据 先占位，稍后的条件分支会根据实际输入补齐它。
  const pendingRequestHandlers: Array<{
    method: string
    // 这个回调绑定到 handler: (params: unknown) => unknown | Promise<unknown>，负责服务层 LSPClient在该局部场景下的响应。
    handler: (params: unknown) => unknown | Promise<unknown>
  }> = []

  // checkStartFailed 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function checkStartFailed(): void {
    // 满足 `startFailed` 时，服务层 LSPClient执行该分支。
    if (startFailed) {
      // 抛出 startError || new Error(`LSP server ${serverName} failed to start`)，阻止服务层 LSPClient在无效状态下继续运行。
      throw startError || new Error(`LSP server ${serverName} failed to start`)
    }
  }

  // 返回结构化结果，集中表达服务层 LSPClient已经整理出的状态。
  return {
    // 服务层 LSPClient在这里处理 `get capabilities(): ServerCapabilities | undefined {`，完成这一小步状态转换。
    get capabilities(): ServerCapabilities | undefined {
      // 返回 `capabilities`，作为服务层 LSPClient这次计算的结果。
      return capabilities
    },

    // 服务层 LSPClient在这里处理 `get isInitialized(): boolean {`，完成这一小步状态转换。
    get isInitialized(): boolean {
      // 返回 `isInitialized`，作为服务层 LSPClient这次计算的结果。
      return isInitialized
    },

    async start(
      command: string,
      args: string[],
      options?: {
        env?: Record<string, string>
        cwd?: string
      },
    ): Promise<void> {
      // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
      try {
        // 1. Spawn LSP server process
        // process 集合更新为 `spawn(command, args, {`，确保服务层后续读取最新状态。
        process = spawn(command, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...subprocessEnv(), ...options?.env },
          cwd: options?.cwd,
          // Prevent visible console window on Windows (no-op on other platforms)
          windowsHide: true,
        })

        // 组合条件 `!process.stdout || !process.stdin` 成立时，服务层 LSPClient才启用这条专门路径。
        if (!process.stdout || !process.stdin) {
          // 抛出 new Error('LSP server process stdio not available')，阻止服务层 LSPClient在无效状态下继续运行。
          throw new Error('LSP server process stdio not available')
        }

        // 1.5. Wait for process to successfully spawn before using streams
        // This is CRITICAL: spawn() returns immediately, but the 'error' event
        // (e.g., ENOENT for command not found) fires asynchronously.
        // If we use the streams before confirming spawn succeeded, we get
        // unhandled promise rejections when writes fail on invalid streams.
        // spawnedProcess 集合保存`process // Capture for closure`，供服务层 LSPClient后续判断或输出使用。
        const spawnedProcess = process // Capture for closure
        // 这个回调绑定到 await new Promise<void>((resolve, reject) => {，负责服务层 LSPClient在该局部场景下的响应。
        await new Promise<void>((resolve, reject) => {
          // onSpawn封装成回调，供服务层 LSPClient在事件触发或异步步骤中调用。
          const onSpawn = (): void => {
            // 调用 cleanup，触发服务层 LSPClient此处需要的副作用。
            cleanup()
            // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolve()
          }
          // onError 错误信息封装成回调，供服务层 LSPClient在事件触发或异步步骤中调用。
          const onError = (error: Error): void => {
            // 调用 cleanup，触发服务层 LSPClient此处需要的副作用。
            cleanup()
            // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
            reject(error)
          }
          // cleanup封装成回调，供服务层 LSPClient在事件触发或异步步骤中调用。
          const cleanup = (): void => {
            // 调用 spawnedProcess.removeListener，触发服务层 LSPClient此处需要的副作用。
            spawnedProcess.removeListener('spawn', onSpawn)
            // 调用 spawnedProcess.removeListener，触发服务层 LSPClient此处需要的副作用。
            spawnedProcess.removeListener('error', onError)
          }
          // 调用 spawnedProcess.once，触发服务层 LSPClient此处需要的副作用。
          spawnedProcess.once('spawn', onSpawn)
          // 调用 spawnedProcess.once，触发服务层 LSPClient此处需要的副作用。
          spawnedProcess.once('error', onError)
        })

        // Capture stderr for server diagnostics and errors
        // 满足 `process.stderr` 时，服务层 LSPClient执行该分支。
        if (process.stderr) {
          // 调用 process.stderr.on，触发服务层 LSPClient此处需要的副作用。
          process.stderr.on('data', (data: Buffer) => {
            // output格式化`data.toString`，供服务层 LSPClient后续处理使用。
            const output = data.toString().trim()
            // 满足 `output` 时，服务层 LSPClient执行该分支。
            if (output) {
              // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
              logForDebugging(`[LSP SERVER ${serverName}] ${output}`)
            }
          })
        }

        // Handle process errors (after successful spawn, e.g., crash during operation)
        // 调用 process.on，触发服务层 LSPClient此处需要的副作用。
        process.on('error', error => {
          // isStopping缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
          if (!isStopping) {
            // startFailed更新为 `true`，确保服务层后续读取最新状态。
            startFailed = true
            // startError 错误信息更新为 `error`，确保服务层后续读取最新状态。
            startError = error
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `LSP server ${serverName} failed to start: ${error.message}`,
              ),
            )
          }
        })

        // 调用 process.on，触发服务层 LSPClient此处需要的副作用。
        process.on('exit', (code, _signal) => {
          // `code` 与 `0 && code !== null && !isStoppi...` 不一致时刷新派生状态，避免使用过期结果。
          if (code !== 0 && code !== null && !isStopping) {
            // isInitialized更新为 `false`，确保服务层后续读取最新状态。
            isInitialized = false
            // startFailed更新为 `false`，确保服务层后续读取最新状态。
            startFailed = false
            // startError 错误信息更新为 `undefined`，确保服务层后续读取最新状态。
            startError = undefined
            // crashError 错误信息保存`Error`，供服务层 LSPClient后续处理使用。
            const crashError = new Error(
              `LSP server ${serverName} crashed with exit code ${code}`,
            )
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logError(crashError)
            // 调用 onCrash?.(crashError)，完成这一处局部操作。
            onCrash?.(crashError)
          }
        })

        // Handle stdin stream errors to prevent unhandled promise rejections
        // when the LSP server process exits before we finish writing
        // 调用 process.stdin.on，触发服务层 LSPClient此处需要的副作用。
        process.stdin.on('error', (error: Error) => {
          // isStopping缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
          if (!isStopping) {
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `LSP server ${serverName} stdin error: ${error.message}`,
            )
          }
          // Error is logged but not thrown - the connection error handler will catch this
        })

        // 2. Create JSON-RPC connection
        // reader保存`StreamMessageReader`，供服务层 LSPClient后续处理使用。
        const reader = new StreamMessageReader(process.stdout)
        // writer保存`StreamMessageWriter`，供服务层 LSPClient后续处理使用。
        const writer = new StreamMessageWriter(process.stdin)
        // connection更新为 `createMessageConnection(reader, writer)`，确保服务层后续读取最新状态。
        connection = createMessageConnection(reader, writer)

        // 2.5. Register error/close handlers BEFORE listen() to catch all errors
        // This prevents unhandled promise rejections when the server crashes or closes unexpectedly
        // 调用 connection.onError，触发服务层 LSPClient此处需要的副作用。
        connection.onError(([error, _message, _code]) => {
          // Only log if not intentionally stopping (avoid spurious errors during shutdown)
          // isStopping缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
          if (!isStopping) {
            // startFailed更新为 `true`，确保服务层后续读取最新状态。
            startFailed = true
            // startError 错误信息更新为 `error`，确保服务层后续读取最新状态。
            startError = error
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `LSP server ${serverName} connection error: ${error.message}`,
              ),
            )
          }
        })

        // 调用 connection.onClose，触发服务层 LSPClient此处需要的副作用。
        connection.onClose(() => {
          // Only treat as error if not intentionally stopping
          // isStopping缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
          if (!isStopping) {
            // isInitialized更新为 `false`，确保服务层后续读取最新状态。
            isInitialized = false
            // Don't set startFailed here - the connection may close after graceful shutdown
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`LSP server ${serverName} connection closed`)
          }
        })

        // 3. Start listening for messages
        // 调用 connection.listen，触发服务层 LSPClient此处需要的副作用。
        connection.listen()

        // 3.5. Enable protocol tracing for debugging
        // Note: trace() sends a $/setTrace notification which can fail if the server
        // process has already exited. We catch and log the error rather than letting
        // it become an unhandled promise rejection.
        // 服务层 LSPClient在这里处理 `connection`，完成这一小步状态转换。
        connection
          .trace(Trace.Verbose, {
            // 这个回调绑定到 log: (message: string) => {，负责服务层 LSPClient在该局部场景下的响应。
            log: (message: string) => {
              // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
              logForDebugging(`[LSP PROTOCOL ${serverName}] ${message}`)
            },
          })
          .catch((error: Error) => {
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Failed to enable tracing for ${serverName}: ${error.message}`,
            )
          })

        // 4. Apply any queued notification handlers
        // 循环处理 `const { method, handler } of pendingHandlers`，让服务层 LSPClient逐项把同类条目按顺序走完。
        for (const { method, handler } of pendingHandlers) {
          // 调用 connection.onNotification，触发服务层 LSPClient此处需要的副作用。
          connection.onNotification(method, handler)
          // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Applied queued notification handler for ${serverName}.${method}`,
          )
        }
        // length 数量更新为 `0 // Clear the queue`，确保服务层后续读取最新状态。
        pendingHandlers.length = 0 // Clear the queue

        // 5. Apply any queued request handlers
        // 循环处理 `const { method, handler } of pendingRequestHandle`，让服务层 LSPClient逐项把同类条目按顺序走完。
        for (const { method, handler } of pendingRequestHandlers) {
          // 调用 connection.onRequest，触发服务层 LSPClient此处需要的副作用。
          connection.onRequest(method, handler)
          // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Applied queued request handler for ${serverName}.${method}`,
          )
        }
        // length 数量更新为 `0 // Clear the queue`，确保服务层后续读取最新状态。
        pendingRequestHandlers.length = 0 // Clear the queue

        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`LSP client started for ${serverName}`)
      } catch (error) {
        // err保存`error as Error`，供后续判断或组装使用。
        const err = error as Error
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(`LSP server ${serverName} failed to start: ${err.message}`),
        )
        // 抛出 error，阻止服务层 LSPClient在无效状态下继续运行。
        throw error
      }
    },

    // initialize 使用 params: InitializeParams 完成服务层 LSPClient里的对应操作。
    async initialize(params: InitializeParams): Promise<InitializeResult> {
      // connection缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
      if (!connection) {
        // 抛出 new Error('LSP client not started')，阻止服务层 LSPClient在无效状态下继续运行。
        throw new Error('LSP client not started')
      }

      // 调用 checkStartFailed，触发服务层 LSPClient此处需要的副作用。
      checkStartFailed()

      // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
      try {
        // 结果 等待 `connection.sendRequest(`，确保继续执行前已有结果。
        const result: InitializeResult = await connection.sendRequest(
          'initialize',
          params,
        )

        // capabilities 集合更新为 `result.capabilities`，确保服务层后续读取最新状态。
        capabilities = result.capabilities

        // Send initialized notification
        // 等待 `connection.sendNotification('initialized', {})` 完成，再继续服务层 LSPClient的异步流程。
        await connection.sendNotification('initialized', {})

        // isInitialized更新为 `true`，确保服务层后续读取最新状态。
        isInitialized = true
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`LSP server ${serverName} initialized`)

        // 返回 `result`，作为服务层 LSPClient这次计算的结果。
        return result
      } catch (error) {
        // err保存`error as Error`，供后续判断或组装使用。
        const err = error as Error
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server ${serverName} initialize failed: ${err.message}`,
          ),
        )
        // 抛出 error，阻止服务层 LSPClient在无效状态下继续运行。
        throw error
      }
    },

    // 服务层 LSPClient在这里处理 `async sendRequest<TResult>(`，完成这一小步状态转换。
    async sendRequest<TResult>(
      method: string,
      params: unknown,
    ): Promise<TResult> {
      // connection缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
      if (!connection) {
        // 抛出 new Error('LSP client not started')，阻止服务层 LSPClient在无效状态下继续运行。
        throw new Error('LSP client not started')
      }

      // 调用 checkStartFailed，触发服务层 LSPClient此处需要的副作用。
      checkStartFailed()

      // isInitialized缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
      if (!isInitialized) {
        // 抛出 new Error('LSP server not initialized')，阻止服务层 LSPClient在无效状态下继续运行。
        throw new Error('LSP server not initialized')
      }

      // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
      try {
        // 等待并返回 `connection.sendRequest(method, params)`，调用方直接接收异步结果。
        return await connection.sendRequest(method, params)
      } catch (error) {
        // err保存`error as Error`，供后续判断或组装使用。
        const err = error as Error
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server ${serverName} request ${method} failed: ${err.message}`,
          ),
        )
        // 抛出 error，阻止服务层 LSPClient在无效状态下继续运行。
        throw error
      }
    },

    // sendNotification 使用 method: string, params: unknown 完成服务层 LSPClient里的对应操作。
    async sendNotification(method: string, params: unknown): Promise<void> {
      // connection缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
      if (!connection) {
        // 抛出 new Error('LSP client not started')，阻止服务层 LSPClient在无效状态下继续运行。
        throw new Error('LSP client not started')
      }

      // 调用 checkStartFailed，触发服务层 LSPClient此处需要的副作用。
      checkStartFailed()

      // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `connection.sendNotification(method, params)` 完成，再继续服务层 LSPClient的异步流程。
        await connection.sendNotification(method, params)
      } catch (error) {
        // err保存`error as Error`，供后续判断或组装使用。
        const err = error as Error
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `LSP server ${serverName} notification ${method} failed: ${err.message}`,
          ),
        )
        // Don't re-throw for notifications - they're fire-and-forget
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Notification ${method} failed but continuing`)
      }
    },

    // 调用 onNotification，触发服务层 LSPClient此处需要的副作用。
    onNotification(method: string, handler: (params: unknown) => void): void {
      // connection缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
      if (!connection) {
        // Queue handler for application when connection is ready (lazy initialization)
        // pendingHandlers 集合追加新条目，保持收集顺序与输入顺序一致。
        pendingHandlers.push({ method, handler })
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Queued notification handler for ${serverName}.${method} (connection not ready)`,
        )
        // 服务层 LSPClient在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 调用 checkStartFailed，触发服务层 LSPClient此处需要的副作用。
      checkStartFailed()

      // 调用 connection.onNotification，触发服务层 LSPClient此处需要的副作用。
      connection.onNotification(method, handler)
    },

    // 服务层 LSPClient在这里处理 `onRequest<TParams, TResult>(`，完成这一小步状态转换。
    onRequest<TParams, TResult>(
      method: string,
      // 这个回调绑定到 handler: (params: TParams) => TResult | Promise<TResult>,，负责服务层 LSPClient在该局部场景下的响应。
      handler: (params: TParams) => TResult | Promise<TResult>,
    ): void {
      // connection缺失时提前走兜底路径，避免服务层 LSPClient继续依赖无效输入。
      if (!connection) {
        // Queue handler for application when connection is ready (lazy initialization)
        // pendingRequestHandlers 请求数据追加新条目，保持收集顺序与输入顺序一致。
        pendingRequestHandlers.push({
          method,
          // 这个回调绑定到 handler: handler as (params: unknown) => unknown | Promise<unknown>,，负责服务层 LSPClient在该局部场景下的响应。
          handler: handler as (params: unknown) => unknown | Promise<unknown>,
        })
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Queued request handler for ${serverName}.${method} (connection not ready)`,
        )
        // 服务层 LSPClient在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 调用 checkStartFailed，触发服务层 LSPClient此处需要的副作用。
      checkStartFailed()

      // 调用 connection.onRequest，触发服务层 LSPClient此处需要的副作用。
      connection.onRequest(method, handler)
    },

    // stop 使用 无 完成服务层 LSPClient里的对应操作。
    async stop(): Promise<void> {
      // shutdownError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
      let shutdownError: Error | undefined

      // Mark as stopping to prevent error handlers from logging spurious errors
      // isStopping更新为 `true`，确保服务层后续读取最新状态。
      isStopping = true

      // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
      try {
        // 满足 `connection` 时，服务层 LSPClient执行该分支。
        if (connection) {
          // Try to send shutdown request and exit notification
          // 等待 `connection.sendRequest('shutdown', {})` 完成，再继续服务层 LSPClient的异步流程。
          await connection.sendRequest('shutdown', {})
          // 等待 `connection.sendNotification('exit', {})` 完成，再继续服务层 LSPClient的异步流程。
          await connection.sendNotification('exit', {})
        }
      } catch (error) {
        // err保存`error as Error`，供后续判断或组装使用。
        const err = error as Error
        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(`LSP server ${serverName} stop failed: ${err.message}`),
        )
        // shutdownError 错误信息更新为 `err`，确保服务层后续读取最新状态。
        shutdownError = err
        // Continue to cleanup despite shutdown failure
      } finally {
        // Always cleanup resources, even if shutdown/exit failed
        // 满足 `connection` 时，服务层 LSPClient执行该分支。
        if (connection) {
          // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
          try {
            // 调用 connection.dispose，触发服务层 LSPClient此处需要的副作用。
            connection.dispose()
          } catch (error) {
            // Log but don't throw - disposal errors are less critical
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Connection disposal failed for ${serverName}: ${errorMessage(error)}`,
            )
          }
          // connection更新为 `undefined`，确保服务层后续读取最新状态。
          connection = undefined
        }

        // 满足 `process` 时，服务层 LSPClient执行该分支。
        if (process) {
          // Remove event listeners to prevent memory leaks
          // 调用 process.removeAllListeners，触发服务层 LSPClient此处需要的副作用。
          process.removeAllListeners('error')
          // 调用 process.removeAllListeners，触发服务层 LSPClient此处需要的副作用。
          process.removeAllListeners('exit')
          // 满足 `process.stdin` 时，服务层 LSPClient执行该分支。
          if (process.stdin) {
            // 调用 process.stdin.removeAllListeners，触发服务层 LSPClient此处需要的副作用。
            process.stdin.removeAllListeners('error')
          }
          // 满足 `process.stderr` 时，服务层 LSPClient执行该分支。
          if (process.stderr) {
            // 调用 process.stderr.removeAllListeners，触发服务层 LSPClient此处需要的副作用。
            process.stderr.removeAllListeners('data')
          }

          // 保护这一段可能失败的服务层 LSPClient操作，确保异常能进入相邻错误处理。
          try {
            // 调用 process.kill，触发服务层 LSPClient此处需要的副作用。
            process.kill()
          } catch (error) {
            // Process might already be dead, which is fine
            // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Process kill failed for ${serverName} (may already be dead): ${errorMessage(error)}`,
            )
          }
          // process 集合更新为 `undefined`，确保服务层后续读取最新状态。
          process = undefined
        }

        // isInitialized更新为 `false`，确保服务层后续读取最新状态。
        isInitialized = false
        // capabilities 集合更新为 `undefined`，确保服务层后续读取最新状态。
        capabilities = undefined
        // isStopping更新为 `false // Reset for potential restart`，确保服务层后续读取最新状态。
        isStopping = false // Reset for potential restart
        // Don't reset startFailed - preserve error state for diagnostics
        // startFailed and startError remain as-is
        // 满足 `shutdownError` 时，服务层 LSPClient执行该分支。
        if (shutdownError) {
          // startFailed更新为 `true`，确保服务层后续读取最新状态。
          startFailed = true
          // startError 错误信息更新为 `shutdownError`，确保服务层后续读取最新状态。
          startError = shutdownError
        }

        // 记录服务层 LSPClient运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`LSP client stopped for ${serverName}`)
      }

      // Re-throw shutdown error after cleanup is complete
      // 满足 `shutdownError` 时，服务层 LSPClient执行该分支。
      if (shutdownError) {
        // 抛出 shutdownError，阻止服务层 LSPClient在无效状态下继续运行。
        throw shutdownError
      }
    },
  }
}
