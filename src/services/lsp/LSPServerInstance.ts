// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path'
// 引入 pathToFileURL，将 url 中已经封装好的能力接到本文件流程里。
import { pathToFileURL } from 'url'
// 类型依赖 { InitializeParams } 来自 vscode-languageserver-protocol，用于校准服务层 LSPServer Instance的数据契约。
import type { InitializeParams } from 'vscode-languageserver-protocol'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 类型依赖 { createLSPClient as createLSPClientType } 来自 ./LSPClient.js，用于校准服务层 LSPServer Instance的数据契约。
import type { createLSPClient as createLSPClientType } from './LSPClient.js'
// 类型依赖 { LspServerState, ScopedLspServerConfig } 来自 ./types.js，用于校准服务层 LSPServer Instance的数据契约。
import type { LspServerState, ScopedLspServerConfig } from './types.js'

/**
 * LSP error code for "content modified" - indicates the server's state changed
 * during request processing (e.g., rust-analyzer still indexing the project).
 * This is a transient error that can be retried.
 */
// LSP_ERROR_CONTENT_MODIFIED 错误信息保存`-32801`，供后续判断或组装使用。
const LSP_ERROR_CONTENT_MODIFIED = -32801

/**
 * Maximum number of retries for transient LSP errors like "content modified".
 */
// MAX_RETRIES_FOR_TRANSIENT_ERRORS 错误信息 命名 `3`，让后续代码直接表达这个值的用途。
const MAX_RETRIES_FOR_TRANSIENT_ERRORS = 3

/**
 * Base delay in milliseconds for exponential backoff on transient errors.
 * Actual delays: 500ms, 1000ms, 2000ms
 */
// RETRY_BASE_DELAY_MS 集合保存`500`，供服务层 LSPServer Instance后续判断或输出使用。
const RETRY_BASE_DELAY_MS = 500
/**
 * LSP server instance interface returned by createLSPServerInstance.
 * Manages the lifecycle of a single LSP server with state tracking and health monitoring.
 */
// LSPServerInstance 固化服务层 LSPServer Instance里传递的数据形状，帮助调用方按同一结构读写字段。
export type LSPServerInstance = {
  /** Unique server identifier */
  readonly name: string
  /** Server configuration */
  readonly config: ScopedLspServerConfig
  /** Current server state */
  readonly state: LspServerState
  /** When the server was last started */
  readonly startTime: Date | undefined
  /** Last error encountered */
  readonly lastError: Error | undefined
  /** Number of times restart() has been called */
  readonly restartCount: number
  /** Start the server and initialize it */
  // start 使用 无 完成服务层 LSPServer Instance里的对应操作。
  start(): Promise<void>
  /** Stop the server gracefully */
  // stop 使用 无 完成服务层 LSPServer Instance里的对应操作。
  stop(): Promise<void>
  /** Manually restart the server (stop then start) */
  // restart 使用 无 完成服务层 LSPServer Instance里的对应操作。
  restart(): Promise<void>
  /** Check if server is healthy and ready for requests */
  // isHealthy 用 无 判断服务层 LSPServer Instance是否满足条件。
  isHealthy(): boolean
  /** Send an LSP request to the server */
  // 服务层 LSPServer Instance在这里处理 `sendRequest<T>(method: string, params: unknown): Promise<T>`，完成这一小步状态转换。
  sendRequest<T>(method: string, params: unknown): Promise<T>
  /** Send an LSP notification to the server (fire-and-forget) */
  // sendNotification 使用 method: string, params: unknown 完成服务层 LSPServer Instance里的对应操作。
  sendNotification(method: string, params: unknown): Promise<void>
  /** Register a handler for LSP notifications */
  // 调用 onNotification，触发服务层 LSPServer Instance此处需要的副作用。
  onNotification(method: string, handler: (params: unknown) => void): void
  /** Register a handler for LSP requests from the server */
  // 服务层 LSPServer Instance在这里处理 `onRequest<TParams, TResult>(`，完成这一小步状态转换。
  onRequest<TParams, TResult>(
    method: string,
    // 这个回调绑定到 handler: (params: TParams) => TResult | Promise<TResult>,，负责服务层 LSPServer Instance在该局部场景下的响应。
    handler: (params: TParams) => TResult | Promise<TResult>,
  ): void
}

/**
 * Creates and manages a single LSP server instance.
 *
 * Uses factory function pattern with closures for state encapsulation (avoiding classes).
 * Provides state tracking, health monitoring, and request forwarding for an LSP server.
 * Supports manual restart with configurable retry limits.
 *
 * State machine transitions:
 * - stopped → starting → running
 * - running → stopping → stopped
 * - any → error (on failure)
 * - error → starting (on retry)
 *
 * @param name - Unique identifier for this server instance
 * @param config - Server configuration including command, args, and limits
 * @returns LSP server instance with lifecycle management methods
 *
 * @example
 * const instance = createLSPServerInstance('my-server', config)
 * await instance.start()
 * const result = await instance.sendRequest('textDocument/definition', params)
 * await instance.stop()
 */
// createLSPServerInstance 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createLSPServerInstance(
  name: string,
  config: ScopedLspServerConfig,
): LSPServerInstance {
  // Validate that unimplemented fields are not set
  // `config.restartOnCrash` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (config.restartOnCrash !== undefined) {
    // 抛出 new Error(，阻止服务层 LSPServer Instance在无效状态下继续运行。
    throw new Error(
      `LSP server '${name}': restartOnCrash is not yet implemented. Remove this field from the configuration.`,
    )
  }
  // `config.shutdownTimeout` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (config.shutdownTimeout !== undefined) {
    // 抛出 new Error(，阻止服务层 LSPServer Instance在无效状态下继续运行。
    throw new Error(
      `LSP server '${name}': shutdownTimeout is not yet implemented. Remove this field from the configuration.`,
    )
  }

  // Private state encapsulated via closures. Lazy-require LSPClient so
  // vscode-jsonrpc (~129KB) only loads when an LSP server is actually
  // instantiated, not when the static import chain reaches this module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  // 从 `require('./LSPClient.js') as {` 解构 createLSPClient，减少服务层 LSPServer Instance对同一对象的重复访问。
  const { createLSPClient } = require('./LSPClient.js') as {
    createLSPClient: typeof createLSPClientType
  }
  // 状态固定为 `'stopped'`，作为服务层 LSPServer Instance后续展示或比较的基准。
  let state: LspServerState = 'stopped'
  // startTime 先占位，稍后的条件分支会根据实际输入补齐它。
  let startTime: Date | undefined
  // lastError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastError: Error | undefined
  // restartCount 数量保存`0`，供后续判断或组装使用。
  let restartCount = 0
  // crashRecoveryCount 数量保存`0`，供后续判断或组装使用。
  let crashRecoveryCount = 0
  // Propagate crash state so ensureServerStarted can restart on next use.
  // Without this, state stays 'running' after crash and the server is never
  // restarted (zombie state).
  // API 客户端构建`createLSPClient`，供服务层 LSPServer Instance后续处理使用。
  const client = createLSPClient(name, error => {
    // 状态更新为 `'error'`，确保服务层后续读取最新状态。
    state = 'error'
    // lastError 错误信息更新为 `error`，确保服务层后续读取最新状态。
    lastError = error
    // 服务层 LSPServer Instance在这里处理 `crashRecoveryCount++`，完成这一小步状态转换。
    crashRecoveryCount++
  })

  /**
   * Starts the LSP server and initializes it with workspace information.
   *
   * If the server is already running or starting, this method returns immediately.
   * On failure, sets state to 'error', logs for monitoring, and throws.
   *
   * @throws {Error} If server fails to start or initialize
   */
  // start 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function start(): Promise<void> {
    // 当 `state` 匹配 `'running' || state === 'sta...` 时，服务层 LSPServer Instance执行对应分支。
    if (state === 'running' || state === 'starting') {
      // 服务层 LSPServer Instance在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Cap crash-recovery attempts so a persistently crashing server doesn't
    // spawn unbounded child processes on every incoming request.
    // maxRestarts 集合保存`config.maxRestarts ?? 3`，供服务层 LSPServer Instance后续判断或输出使用。
    const maxRestarts = config.maxRestarts ?? 3
    // 组合条件 `state === 'error' && crashRecoveryCount > maxRest` 成立时，服务层 LSPServer Instance才启用这条专门路径。
    if (state === 'error' && crashRecoveryCount > maxRestarts) {
      // 错误保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const error = new Error(
        `LSP server '${name}' exceeded max crash recovery attempts (${maxRestarts})`,
      )
      // lastError 错误信息更新为 `error`，确保服务层后续读取最新状态。
      lastError = error
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw error
    }

    // initPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
    let initPromise: Promise<unknown> | undefined
    // 保护这一段可能失败的服务层 LSPServer Instance操作，确保异常能进入相邻错误处理。
    try {
      // 状态更新为 `'starting'`，确保服务层后续读取最新状态。
      state = 'starting'
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Starting LSP server instance: ${name}`)

      // Start the client
      // 等待 `client.start(config.command, config.args || [], {` 完成，再继续服务层 LSPServer Instance的异步流程。
      await client.start(config.command, config.args || [], {
        env: config.env,
        cwd: config.workspaceFolder,
      })

      // Initialize with workspace info
      // workspaceFolder读取`getCwd`，供服务层 LSPServer Instance后续处理使用。
      const workspaceFolder = config.workspaceFolder || getCwd()
      // workspaceUri保存`pathToFileURL`，供服务层 LSPServer Instance后续处理使用。
      const workspaceUri = pathToFileURL(workspaceFolder).href

      // initParams 集合 集中保存服务层 LSPServer Instance要一起传递的字段。
      const initParams: InitializeParams = {
        processId: process.pid,

        // Pass server-specific initialization options from plugin config
        // Required by vue-language-server, optional for others
        // Provide empty object as default to avoid undefined errors in servers
        // that expect this field to exist
        initializationOptions: config.initializationOptions ?? {},

        // Modern approach (LSP 3.16+) - required for Pyright, gopls
        workspaceFolders: [
          {
            uri: workspaceUri,
            name: path.basename(workspaceFolder),
          },
        ],

        // Deprecated fields - some servers still need these for proper URI resolution
        rootPath: workspaceFolder, // Deprecated in LSP 3.8 but needed by some servers
        rootUri: workspaceUri, // Deprecated in LSP 3.16 but needed by typescript-language-server for goToDefinition

        // Client capabilities - declare what features we support
        capabilities: {
          workspace: {
            // Don't claim to support workspace/configuration since we don't implement it
            // This prevents servers from requesting config we can't provide
            configuration: false,
            // Don't claim to support workspace folders changes since we don't handle
            // workspace/didChangeWorkspaceFolders notifications
            workspaceFolders: false,
          },
          textDocument: {
            synchronization: {
              dynamicRegistration: false,
              willSave: false,
              willSaveWaitUntil: false,
              didSave: true,
            },
            publishDiagnostics: {
              relatedInformation: true,
              tagSupport: {
                valueSet: [1, 2], // Unnecessary (1), Deprecated (2)
              },
              versionSupport: false,
              codeDescriptionSupport: true,
              dataSupport: false,
            },
            hover: {
              dynamicRegistration: false,
              contentFormat: ['markdown', 'plaintext'],
            },
            definition: {
              dynamicRegistration: false,
              linkSupport: true,
            },
            references: {
              dynamicRegistration: false,
            },
            documentSymbol: {
              dynamicRegistration: false,
              hierarchicalDocumentSymbolSupport: true,
            },
            callHierarchy: {
              dynamicRegistration: false,
            },
          },
          general: {
            positionEncodings: ['utf-16'],
          },
        },
      }

      // initPromise 异步任务更新为 `client.initialize(initParams)`，确保服务层后续读取最新状态。
      initPromise = client.initialize(initParams)
      // `config.startupTimeout` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (config.startupTimeout !== undefined) {
        // 等待 `withTimeout(` 完成，再继续服务层 LSPServer Instance的异步流程。
        await withTimeout(
          initPromise,
          config.startupTimeout,
          `LSP server '${name}' timed out after ${config.startupTimeout}ms during initialization`,
        )
      } else {
        // 等待 `initPromise` 完成，再继续服务层 LSPServer Instance的异步流程。
        await initPromise
      }

      // 状态更新为 `'running'`，确保服务层后续读取最新状态。
      state = 'running'
      // startTime更新为 `new Date()`，确保服务层后续读取最新状态。
      startTime = new Date()
      // crashRecoveryCount 数量更新为 `0`，确保服务层后续读取最新状态。
      crashRecoveryCount = 0
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LSP server instance started: ${name}`)
    } catch (error) {
      // Clean up the spawned child process on timeout/error
      // 调用 client.stop，触发服务层 LSPServer Instance此处需要的副作用。
      client.stop().catch(() => {})
      // Prevent unhandled rejection from abandoned initialize promise
      // 这个回调绑定到 initPromise?.catch(() => {})，负责服务层 LSPServer Instance在该局部场景下的响应。
      initPromise?.catch(() => {})
      // 状态更新为 `'error'`，确保服务层后续读取最新状态。
      state = 'error'
      // lastError 错误信息更新为 `error as Error`，确保服务层后续读取最新状态。
      lastError = error as Error
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw error
    }
  }

  /**
   * Stops the LSP server gracefully.
   *
   * If already stopped or stopping, returns immediately.
   * On failure, sets state to 'error', logs for monitoring, and throws.
   *
   * @throws {Error} If server fails to stop
   */
  // stop 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function stop(): Promise<void> {
    // 当 `state` 匹配 `'stopped' || state === 'sto...` 时，服务层 LSPServer Instance执行对应分支。
    if (state === 'stopped' || state === 'stopping') {
      // 服务层 LSPServer Instance在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 保护这一段可能失败的服务层 LSPServer Instance操作，确保异常能进入相邻错误处理。
    try {
      // 状态更新为 `'stopping'`，确保服务层后续读取最新状态。
      state = 'stopping'
      // 等待 `client.stop()` 完成，再继续服务层 LSPServer Instance的异步流程。
      await client.stop()
      // 状态更新为 `'stopped'`，确保服务层后续读取最新状态。
      state = 'stopped'
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LSP server instance stopped: ${name}`)
    } catch (error) {
      // 状态更新为 `'error'`，确保服务层后续读取最新状态。
      state = 'error'
      // lastError 错误信息更新为 `error as Error`，确保服务层后续读取最新状态。
      lastError = error as Error
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw error
    }
  }

  /**
   * Manually restarts the server by stopping and starting it.
   *
   * Increments restartCount and enforces maxRestarts limit.
   * Note: This is NOT automatic - must be called explicitly.
   *
   * @throws {Error} If stop or start fails, or if restartCount exceeds config.maxRestarts (default: 3)
   */
  // restart 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function restart(): Promise<void> {
    // 保护这一段可能失败的服务层 LSPServer Instance操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `stop()` 完成，再继续服务层 LSPServer Instance的异步流程。
      await stop()
    } catch (error) {
      // stopError 错误信息保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const stopError = new Error(
        `Failed to stop LSP server '${name}' during restart: ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(stopError)
      // 抛出 stopError，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw stopError
    }

    // 服务层 LSPServer Instance在这里处理 `restartCount++`，完成这一小步状态转换。
    restartCount++

    // maxRestarts 集合保存`config.maxRestarts ?? 3`，供服务层 LSPServer Instance后续判断或输出使用。
    const maxRestarts = config.maxRestarts ?? 3
    // 满足 `restartCount > maxRestarts` 时，服务层 LSPServer Instance执行该分支。
    if (restartCount > maxRestarts) {
      // 错误保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const error = new Error(
        `Max restart attempts (${maxRestarts}) exceeded for server '${name}'`,
      )
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw error
    }

    // 保护这一段可能失败的服务层 LSPServer Instance操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `start()` 完成，再继续服务层 LSPServer Instance的异步流程。
      await start()
    } catch (error) {
      // startError 错误信息保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const startError = new Error(
        `Failed to start LSP server '${name}' during restart (attempt ${restartCount}/${maxRestarts}): ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(startError)
      // 抛出 startError，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw startError
    }
  }

  /**
   * Checks if the server is healthy and ready to handle requests.
   *
   * @returns true if state is 'running' AND the client has completed initialization
   */
  // isHealthy 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function isHealthy(): boolean {
    // 返回 `state === 'running' && client.isInitialized`，作为服务层 LSPServer Instance这次计算的结果。
    return state === 'running' && client.isInitialized
  }

  /**
   * Sends an LSP request to the server with retry logic for transient errors.
   *
   * Checks server health before sending and wraps errors with context.
   * Automatically retries on "content modified" errors (code -32801) which occur
   * when servers like rust-analyzer are still indexing. This is expected LSP behavior
   * and clients should retry silently per the LSP specification.
   *
   * @param method - LSP method name (e.g., 'textDocument/definition')
   * @param params - Method-specific parameters
   * @returns The server's response
   * @throws {Error} If server is not healthy or request fails after all retries
   */
  // sendRequest 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function sendRequest<T>(method: string, params: unknown): Promise<T> {
    // 满足 `!isHealthy()` 时，服务层 LSPServer Instance执行该分支。
    if (!isHealthy()) {
      // 错误保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const error = new Error(
        `Cannot send request to LSP server '${name}': server is ${state}` +
          `${lastError ? `, last error: ${lastError.message}` : ''}`,
      )
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw error
    }

    // lastAttemptError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
    let lastAttemptError: Error | undefined

    // 调用 for，触发服务层 LSPServer Instance此处需要的副作用。
    for (
      let attempt = 0;
      attempt <= MAX_RETRIES_FOR_TRANSIENT_ERRORS;
      attempt++
    ) {
      // 保护这一段可能失败的服务层 LSPServer Instance操作，确保异常能进入相邻错误处理。
      try {
        // 等待并返回 `client.sendRequest(method, params)`，调用方直接接收异步结果。
        return await client.sendRequest(method, params)
      } catch (error) {
        // lastAttemptError 错误信息更新为 `error as Error`，确保服务层后续读取最新状态。
        lastAttemptError = error as Error

        // Check if this is a transient "content modified" error that we should retry
        // This commonly happens with rust-analyzer during initial project indexing.
        // We use duck typing instead of instanceof because there may be multiple
        // versions of vscode-jsonrpc in the dependency tree (8.2.0 vs 8.2.1).
        // errorCode 错误信息 命名 `(error as { code?: number }).code`，让后续代码直接表达这个值的用途。
        const errorCode = (error as { code?: number }).code
        // isContentModifiedError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isContentModifiedError =
          typeof errorCode === 'number' &&
          errorCode === LSP_ERROR_CONTENT_MODIFIED

        // 服务层 LSPServer Instance在这里进入条件判断，后续代码按实际状态分流。
        if (
          isContentModifiedError &&
          attempt < MAX_RETRIES_FOR_TRANSIENT_ERRORS
        ) {
          // delay保存`Math.pow`，供服务层 LSPServer Instance后续处理使用。
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
          // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `LSP request '${method}' to '${name}' got ContentModified error, ` +
              `retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES_FOR_TRANSIENT_ERRORS})…`,
          )
          // 等待 `sleep(delay)` 完成，再继续服务层 LSPServer Instance的异步流程。
          await sleep(delay)
          // 跳过当前项，继续处理服务层 LSPServer Instance中的下一轮循环。
          continue
        }

        // Non-retryable error or max retries exceeded
        // 结束这个分支或循环，避免服务层 LSPServer Instance继续落入后续路径。
        break
      }
    }

    // All retries failed or non-retryable error
    // requestError 请求数据保存`Error`，供服务层 LSPServer Instance后续处理使用。
    const requestError = new Error(
      `LSP request '${method}' failed for server '${name}': ${lastAttemptError?.message ?? 'unknown error'}`,
    )
    // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
    logError(requestError)
    // 抛出 requestError，阻止服务层 LSPServer Instance在无效状态下继续运行。
    throw requestError
  }

  /**
   * Send a notification to the LSP server (fire-and-forget).
   * Used for file synchronization (didOpen, didChange, didClose).
   */
  // sendNotification 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function sendNotification(
    method: string,
    params: unknown,
  ): Promise<void> {
    // 满足 `!isHealthy()` 时，服务层 LSPServer Instance执行该分支。
    if (!isHealthy()) {
      // 错误保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const error = new Error(
        `Cannot send notification to LSP server '${name}': server is ${state}`,
      )
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(error)
      // 抛出 error，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw error
    }

    // 保护这一段可能失败的服务层 LSPServer Instance操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `client.sendNotification(method, params)` 完成，再继续服务层 LSPServer Instance的异步流程。
      await client.sendNotification(method, params)
    } catch (error) {
      // notificationError 错误信息保存`Error`，供服务层 LSPServer Instance后续处理使用。
      const notificationError = new Error(
        `LSP notification '${method}' failed for server '${name}': ${errorMessage(error)}`,
      )
      // 记录服务层 LSPServer Instance运行诊断，方便排查异常路径或性能问题。
      logError(notificationError)
      // 抛出 notificationError，阻止服务层 LSPServer Instance在无效状态下继续运行。
      throw notificationError
    }
  }

  /**
   * Registers a handler for LSP notifications from the server.
   *
   * @param method - LSP notification method (e.g., 'window/logMessage')
   * @param handler - Callback function to handle the notification
   */
  // onNotification 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onNotification(
    method: string,
    // 这个回调绑定到 handler: (params: unknown) => void,，负责服务层 LSPServer Instance在该局部场景下的响应。
    handler: (params: unknown) => void,
  ): void {
    // 调用 client.onNotification，触发服务层 LSPServer Instance此处需要的副作用。
    client.onNotification(method, handler)
  }

  /**
   * Registers a handler for LSP requests from the server.
   *
   * Some LSP servers send requests TO the client (reverse direction).
   * This allows registering handlers for such requests.
   *
   * @param method - LSP request method (e.g., 'workspace/configuration')
   * @param handler - Callback function to handle the request and return a response
   */
  // onRequest 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onRequest<TParams, TResult>(
    method: string,
    // 这个回调绑定到 handler: (params: TParams) => TResult | Promise<TResult>,，负责服务层 LSPServer Instance在该局部场景下的响应。
    handler: (params: TParams) => TResult | Promise<TResult>,
  ): void {
    // 调用 client.onRequest，触发服务层 LSPServer Instance此处需要的副作用。
    client.onRequest(method, handler)
  }

  // Return public API
  // 返回结构化结果，集中表达服务层 LSPServer Instance已经整理出的状态。
  return {
    name,
    config,
    // 服务层 LSPServer Instance在这里处理 `get state() {`，完成这一小步状态转换。
    get state() {
      // 返回 `state`，作为服务层 LSPServer Instance这次计算的结果。
      return state
    },
    // 服务层 LSPServer Instance在这里处理 `get startTime() {`，完成这一小步状态转换。
    get startTime() {
      // 返回 `startTime`，作为服务层 LSPServer Instance这次计算的结果。
      return startTime
    },
    // 服务层 LSPServer Instance在这里处理 `get lastError() {`，完成这一小步状态转换。
    get lastError() {
      // 返回 `lastError`，作为服务层 LSPServer Instance这次计算的结果。
      return lastError
    },
    // 服务层 LSPServer Instance在这里处理 `get restartCount() {`，完成这一小步状态转换。
    get restartCount() {
      // 返回 `restartCount`，作为服务层 LSPServer Instance这次计算的结果。
      return restartCount
    },
    start,
    stop,
    restart,
    isHealthy,
    sendRequest,
    sendNotification,
    onNotification,
    onRequest,
  }
}

/**
 * Race a promise against a timeout. Cleans up the timer regardless of outcome
 * to avoid unhandled rejections from orphaned setTimeout callbacks.
 */
// withTimeout 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  // timer 先占位，稍后的条件分支会根据实际输入补齐它。
  let timer: ReturnType<typeof setTimeout>
  // timeoutPromise 异步任务封装成回调，供服务层 LSPServer Instance在事件触发或异步步骤中调用。
  const timeoutPromise = new Promise<never>((_, reject) => {
    // timer更新为 `setTimeout((rej, msg) => rej(new Error(msg)), ms, reject,...`，确保服务层后续读取最新状态。
    timer = setTimeout((rej, msg) => rej(new Error(msg)), ms, reject, message)
  })
  // 返回 `Promise.race([promise, timeoutPromise]).finally(() =>`，作为服务层 LSPServer Instance这次计算的结果。
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timer!),
  )
}
