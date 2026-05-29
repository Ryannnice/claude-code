// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isBareMode 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isBareMode } from '../../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 整理这一组导入，让服务层 manager后续逻辑可以直接复用这些外部能力。
import {
  createLSPServerManager,
  type LSPServerManager,
} from './LSPServerManager.js'
// 引入 registerLSPNotificationHandlers，将 ./passiveFeedback.js 中已经封装好的能力接到本文件流程里。
import { registerLSPNotificationHandlers } from './passiveFeedback.js'

/**
 * Initialization state of the LSP server manager
 */
// InitializationState 固化服务层 manager里传递的数据形状，帮助调用方按同一结构读写字段。
type InitializationState = 'not-started' | 'pending' | 'success' | 'failed'

/**
 * Global singleton instance of the LSP server manager.
 * Initialized during Claude Code startup.
 */
// lspManagerInstance 先占位，稍后的条件分支会根据实际输入补齐它。
let lspManagerInstance: LSPServerManager | undefined

/**
 * Current initialization state
 */
// initializationState 状态 命名 `'not-started'`，让后续代码直接表达这个值的用途。
let initializationState: InitializationState = 'not-started'

/**
 * Error from last initialization attempt, if any
 */
// initializationError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
let initializationError: Error | undefined

/**
 * Generation counter to prevent stale initialization promises from updating state
 */
// initializationGeneration保存`0`，供服务层 manager后续判断或输出使用。
let initializationGeneration = 0

/**
 * Promise that resolves when initialization completes (success or failure)
 */
// initializationPromise 异步任务 先占位，稍后的条件分支会根据实际输入补齐它。
let initializationPromise: Promise<void> | undefined

/**
 * Test-only sync reset. shutdownLspServerManager() is async and tears down
 * real connections; this only clears the module-scope singleton state so
 * reinitializeLspServerManager() early-returns on 'not-started' in downstream
 * tests on the same shard.
 */
// _resetLspManagerForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetLspManagerForTesting(): void {
  // initializationState 状态更新为 `'not-started'`，确保服务层后续读取最新状态。
  initializationState = 'not-started'
  // initializationError 错误信息更新为 `undefined`，确保服务层后续读取最新状态。
  initializationError = undefined
  // initializationPromise 异步任务更新为 `undefined`，确保服务层后续读取最新状态。
  initializationPromise = undefined
  // 服务层 manager在这里处理 `initializationGeneration++`，完成这一小步状态转换。
  initializationGeneration++
}

/**
 * Get the singleton LSP server manager instance.
 * Returns undefined if not yet initialized, initialization failed, or still pending.
 *
 * Callers should check for undefined and handle gracefully, as initialization happens
 * asynchronously during Claude Code startup. Use getInitializationStatus() to
 * distinguish between pending, failed, and not-started states.
 */
// getLspServerManager 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLspServerManager(): LSPServerManager | undefined {
  // Don't return a broken instance if initialization failed
  // 当 `initializationState` 匹配 `'failed'` 时，服务层 manager执行对应分支。
  if (initializationState === 'failed') {
    // 返回 `undefined`，作为服务层 manager这次计算的结果。
    return undefined
  }
  // 返回 `lspManagerInstance`，作为服务层 manager这次计算的结果。
  return lspManagerInstance
}

/**
 * Get the current initialization status of the LSP server manager.
 *
 * @returns Status object with current state and error (if failed)
 */
// getInitializationStatus 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitializationStatus():
  | { status: 'not-started' }
  | { status: 'pending' }
  | { status: 'success' }
  | { status: 'failed'; error: Error } {
  // 当 `initializationState` 匹配 `'failed'` 时，服务层 manager执行对应分支。
  if (initializationState === 'failed') {
    // 返回结构化结果，集中表达服务层 manager已经整理出的状态。
    return {
      status: 'failed',
      error: initializationError || new Error('Initialization failed'),
    }
  }
  // 当 `initializationState` 匹配 `'not-started'` 时，服务层 manager执行对应分支。
  if (initializationState === 'not-started') {
    // 返回结构化结果，集中表达服务层 manager已经整理出的状态。
    return { status: 'not-started' }
  }
  // 当 `initializationState` 匹配 `'pending'` 时，服务层 manager执行对应分支。
  if (initializationState === 'pending') {
    // 返回结构化结果，集中表达服务层 manager已经整理出的状态。
    return { status: 'pending' }
  }
  // 返回结构化结果，集中表达服务层 manager已经整理出的状态。
  return { status: 'success' }
}

/**
 * Check whether at least one language server is connected and healthy.
 * Backs LSPTool.isEnabled().
 */
// isLspConnected 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLspConnected(): boolean {
  // 当 `initializationState` 匹配 `'failed'` 时，服务层 manager执行对应分支。
  if (initializationState === 'failed') return false
  // manager读取`getLspServerManager`，供服务层 manager后续处理使用。
  const manager = getLspServerManager()
  // manager缺失时提前走兜底路径，避免服务层 manager继续依赖无效输入。
  if (!manager) return false
  // servers 集合读取`manager.getAllServers`，供服务层 manager后续处理使用。
  const servers = manager.getAllServers()
  // 满足 `servers.size === 0` 时，服务层 manager执行该分支。
  if (servers.size === 0) return false
  // 逐项读取 `servers.values()` 中的server，按输入顺序推进服务层 manager。
  for (const server of servers.values()) {
    // `server.state` 与 `'error'` 不一致时刷新派生状态，避免使用过期结果。
    if (server.state !== 'error') return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Wait for LSP server manager initialization to complete.
 *
 * Returns immediately if initialization has already completed (success or failure).
 * If initialization is pending, waits for it to complete.
 * If initialization hasn't started, returns immediately.
 *
 * @returns Promise that resolves when initialization is complete
 */
// waitForInitialization 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function waitForInitialization(): Promise<void> {
  // If already initialized or failed, return immediately
  // 组合条件 `initializationState === 'success' || initializati` 成立时，服务层 manager才启用这条专门路径。
  if (initializationState === 'success' || initializationState === 'failed') {
    // 服务层 manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // If pending and we have a promise, wait for it
  // 组合条件 `initializationState === 'pending' && initializati` 成立时，服务层 manager才启用这条专门路径。
  if (initializationState === 'pending' && initializationPromise) {
    // 等待 `initializationPromise` 完成，再继续服务层 manager的异步流程。
    await initializationPromise
  }

  // If not started, return immediately (nothing to wait for)
}

/**
 * Initialize the LSP server manager singleton.
 *
 * This function is called during Claude Code startup. It synchronously creates
 * the manager instance, then starts async initialization (loading LSP configs)
 * in the background without blocking the startup process.
 *
 * Safe to call multiple times - will only initialize once (idempotent).
 * However, if initialization previously failed, calling again will retry.
 */
// initializeLspServerManager 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeLspServerManager(): void {
  // --bare / SIMPLE: no LSP. LSP is for editor integration (diagnostics,
  // hover, go-to-def in the REPL). Scripted -p calls have no use for it.
  // 满足 `isBareMode()` 时，服务层 manager执行该分支。
  if (isBareMode()) {
    // 服务层 manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[LSP MANAGER] initializeLspServerManager() called')

  // Skip if already initialized or currently initializing
  // `lspManagerInstance` 与 `undefined && initializatio` 不一致时刷新派生状态，避免使用过期结果。
  if (lspManagerInstance !== undefined && initializationState !== 'failed') {
    // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[LSP MANAGER] Already initialized or initializing, skipping',
    )
    // 服务层 manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Reset state for retry if previous initialization failed
  // 当 `initializationState` 匹配 `'failed'` 时，服务层 manager执行对应分支。
  if (initializationState === 'failed') {
    // lspManagerInstance更新为 `undefined`，确保服务层后续读取最新状态。
    lspManagerInstance = undefined
    // initializationError 错误信息更新为 `undefined`，确保服务层后续读取最新状态。
    initializationError = undefined
  }

  // Create the manager instance and mark as pending
  // lspManagerInstance更新为 `createLSPServerManager()`，确保服务层后续读取最新状态。
  lspManagerInstance = createLSPServerManager()
  // initializationState 状态更新为 `'pending'`，确保服务层后续读取最新状态。
  initializationState = 'pending'
  // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[LSP MANAGER] Created manager instance, state=pending')

  // Increment generation to invalidate any pending initializations
  // currentGeneration保存`++initializationGeneration`，供服务层 manager后续判断或输出使用。
  const currentGeneration = ++initializationGeneration
  // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[LSP MANAGER] Starting async initialization (generation ${currentGeneration})`,
  )

  // Start initialization asynchronously without blocking
  // Store the promise so callers can await it via waitForInitialization()
  // initializationPromise 异步任务更新为 `lspManagerInstance`，确保服务层后续读取最新状态。
  initializationPromise = lspManagerInstance
    .initialize()
    // 链式调用 then，继续加工上一行在服务层 manager中产生的数据。
    .then(() => {
      // Only update state if this is still the current initialization
      // 满足 `currentGeneration === initializationGeneration` 时，服务层 manager执行该分支。
      if (currentGeneration === initializationGeneration) {
        // initializationState 状态更新为 `'success'`，确保服务层后续读取最新状态。
        initializationState = 'success'
        // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
        logForDebugging('LSP server manager initialized successfully')

        // Register passive notification handlers for diagnostics
        // 满足 `lspManagerInstance` 时，服务层 manager执行该分支。
        if (lspManagerInstance) {
          // 调用 registerLSPNotificationHandlers，触发服务层 manager此处需要的副作用。
          registerLSPNotificationHandlers(lspManagerInstance)
        }
      }
    })
    // 链式调用 catch，继续加工上一行在服务层 manager中产生的数据。
    .catch((error: unknown) => {
      // Only update state if this is still the current initialization
      // 满足 `currentGeneration === initializationGeneration` 时，服务层 manager执行该分支。
      if (currentGeneration === initializationGeneration) {
        // initializationState 状态更新为 `'failed'`，确保服务层后续读取最新状态。
        initializationState = 'failed'
        // initializationError 错误信息更新为 `error as Error`，确保服务层后续读取最新状态。
        initializationError = error as Error
        // Clear the instance since it's not usable
        // lspManagerInstance更新为 `undefined`，确保服务层后续读取最新状态。
        lspManagerInstance = undefined

        // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
        logError(error as Error)
        // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Failed to initialize LSP server manager: ${errorMessage(error)}`,
        )
      }
    })
}

/**
 * Force re-initialization of the LSP server manager, even after a prior
 * successful init. Called from refreshActivePlugins() after plugin caches
 * are cleared, so newly-loaded plugin LSP servers are picked up.
 *
 * Fixes https://github.com/anthropics/claude-code/issues/15521:
 * loadAllPlugins() is memoized and can be called very early in startup
 * (via getCommands prefetch in setup.ts) before marketplaces are reconciled,
 * caching an empty plugin list. initializeLspServerManager() then reads that
 * stale memoized result and initializes with 0 servers. Unlike commands/agents/
 * hooks/MCP, LSP was never re-initialized on plugin refresh.
 *
 * Safe to call when no LSP plugins changed: initialize() is just config
 * parsing (servers are lazy-started on first use). Also safe during pending
 * init: the generation counter invalidates the in-flight promise.
 */
// reinitializeLspServerManager 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function reinitializeLspServerManager(): void {
  // 当 `initializationState` 匹配 `'not-started'` 时，服务层 manager执行对应分支。
  if (initializationState === 'not-started') {
    // initializeLspServerManager() was never called (e.g. headless subcommand
    // path). Don't start it now.
    // 服务层 manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[LSP MANAGER] reinitializeLspServerManager() called')

  // Best-effort shutdown of any running servers on the old instance so
  // /reload-plugins doesn't leak child processes. Fire-and-forget: the
  // primary use case (issue #15521) has 0 servers so this is usually a no-op.
  // 满足 `lspManagerInstance` 时，服务层 manager执行该分支。
  if (lspManagerInstance) {
    // 这个回调绑定到 void lspManagerInstance.shutdown().catch(err => {，负责服务层 manager在该局部场景下的响应。
    void lspManagerInstance.shutdown().catch(err => {
      // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[LSP MANAGER] old instance shutdown during reinit failed: ${errorMessage(err)}`,
      )
    })
  }

  // Force the idempotence check in initializeLspServerManager() to fall
  // through. Generation counter handles invalidating any in-flight init.
  // lspManagerInstance更新为 `undefined`，确保服务层后续读取最新状态。
  lspManagerInstance = undefined
  // initializationState 状态更新为 `'not-started'`，确保服务层后续读取最新状态。
  initializationState = 'not-started'
  // initializationError 错误信息更新为 `undefined`，确保服务层后续读取最新状态。
  initializationError = undefined

  // 调用 initializeLspServerManager，触发服务层 manager此处需要的副作用。
  initializeLspServerManager()
}

/**
 * Shutdown the LSP server manager and clean up resources.
 *
 * This should be called during Claude Code shutdown. Stops all running LSP servers
 * and clears internal state. Safe to call when not initialized (no-op).
 *
 * NOTE: Errors during shutdown are logged for monitoring but NOT propagated to the caller.
 * State is always cleared even if shutdown fails, to prevent resource accumulation.
 * This is acceptable during application exit when recovery is not possible.
 *
 * @returns Promise that resolves when shutdown completes (errors are swallowed)
 */
// shutdownLspServerManager 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function shutdownLspServerManager(): Promise<void> {
  // 满足 `lspManagerInstance === undefined` 时，服务层 manager执行该分支。
  if (lspManagerInstance === undefined) {
    // 服务层 manager在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的服务层 manager操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `lspManagerInstance.shutdown()` 完成，再继续服务层 manager的异步流程。
    await lspManagerInstance.shutdown()
    // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging('LSP server manager shut down successfully')
  } catch (error: unknown) {
    // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
    // 记录服务层 manager运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to shutdown LSP server manager: ${errorMessage(error)}`,
    )
  } finally {
    // Always clear state even if shutdown failed
    // lspManagerInstance更新为 `undefined`，确保服务层后续读取最新状态。
    lspManagerInstance = undefined
    // initializationState 状态更新为 `'not-started'`，确保服务层后续读取最新状态。
    initializationState = 'not-started'
    // initializationError 错误信息更新为 `undefined`，确保服务层后续读取最新状态。
    initializationError = undefined
    // initializationPromise 异步任务更新为 `undefined`，确保服务层后续读取最新状态。
    initializationPromise = undefined
    // Increment generation to invalidate any pending initializations
    // 服务层 manager在这里处理 `initializationGeneration++`，完成这一小步状态转换。
    initializationGeneration++
  }
}
