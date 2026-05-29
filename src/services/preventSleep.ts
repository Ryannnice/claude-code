/**
 * Prevents macOS from sleeping while Claude is working.
 *
 * Uses the built-in `caffeinate` command to create a power assertion that
 * prevents idle sleep. This keeps the Mac awake during API requests and
 * tool execution so long-running operations don't get interrupted.
 *
 * The caffeinate process is spawned with a timeout and periodically restarted.
 * This provides self-healing behavior: if the Node process is killed with
 * SIGKILL (which doesn't run cleanup handlers), the orphaned caffeinate will
 * automatically exit after the timeout expires.
 *
 * Only runs on macOS - no-op on other platforms.
 */
// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { type ChildProcess, spawn } from 'child_process'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'

// Caffeinate timeout in seconds. Process auto-exits after this duration.
// We restart it before expiry to maintain continuous sleep prevention.
// CAFFEINATE_TIMEOUT_SECONDS 集合保存`300 // 5 minutes`，供后续判断或组装使用。
const CAFFEINATE_TIMEOUT_SECONDS = 300 // 5 minutes

// Restart interval - restart caffeinate before it expires.
// Use 4 minutes to give plenty of buffer before the 5 minute timeout.
// RESTART_INTERVAL_MS 集合 命名 `4 * 60 * 1000`，让后续代码直接表达这个值的用途。
const RESTART_INTERVAL_MS = 4 * 60 * 1000

// caffeinateProcess 集合保存`null`，作为后续空值处理的输入。
let caffeinateProcess: ChildProcess | null = null
// restartInterval初始化为空值，后续分支会在有数据时补齐。
let restartInterval: ReturnType<typeof setInterval> | null = null
// refCount 数量保存`0`，供后续判断或组装使用。
let refCount = 0
// cleanupRegistered标记服务层 prevent Sleep是否启用对应路径。
let cleanupRegistered = false

/**
 * Increment the reference count and start preventing sleep if needed.
 * Call this when starting work that should keep the Mac awake.
 */
// startPreventSleep 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startPreventSleep(): void {
  // 服务层 prevent Sleep在这里处理 `refCount++`，完成这一小步状态转换。
  refCount++

  // 满足 `refCount === 1` 时，服务层 prevent Sleep执行该分支。
  if (refCount === 1) {
    // 调用 spawnCaffeinate，触发服务层 prevent Sleep此处需要的副作用。
    spawnCaffeinate()
    // 调用 startRestartInterval，触发服务层 prevent Sleep此处需要的副作用。
    startRestartInterval()
  }
}

/**
 * Decrement the reference count and allow sleep if no more work is pending.
 * Call this when work completes.
 */
// stopPreventSleep 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopPreventSleep(): void {
  // 满足 `refCount > 0` 时，服务层 prevent Sleep执行该分支。
  if (refCount > 0) {
    // 服务层 prevent Sleep在这里处理 `refCount--`，完成这一小步状态转换。
    refCount--
  }

  // 满足 `refCount === 0` 时，服务层 prevent Sleep执行该分支。
  if (refCount === 0) {
    // 调用 stopRestartInterval，触发服务层 prevent Sleep此处需要的副作用。
    stopRestartInterval()
    // 调用 killCaffeinate，触发服务层 prevent Sleep此处需要的副作用。
    killCaffeinate()
  }
}

/**
 * Force stop preventing sleep, regardless of reference count.
 * Use this for cleanup on exit.
 */
// forceStopPreventSleep 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function forceStopPreventSleep(): void {
  // refCount 数量更新为 `0`，确保服务层后续读取最新状态。
  refCount = 0
  // 调用 stopRestartInterval，触发服务层 prevent Sleep此处需要的副作用。
  stopRestartInterval()
  // 调用 killCaffeinate，触发服务层 prevent Sleep此处需要的副作用。
  killCaffeinate()
}

// startRestartInterval 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startRestartInterval(): void {
  // Only run on macOS
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // 服务层 prevent Sleep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Already running
  // `restartInterval` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (restartInterval !== null) {
    // 服务层 prevent Sleep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // restartInterval更新为 `setInterval(() => {`，确保服务层后续读取最新状态。
  restartInterval = setInterval(() => {
    // Only restart if we still need sleep prevention
    // 满足 `refCount > 0` 时，服务层 prevent Sleep执行该分支。
    if (refCount > 0) {
      // 记录服务层 prevent Sleep运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Restarting caffeinate to maintain sleep prevention')
      // 调用 killCaffeinate，触发服务层 prevent Sleep此处需要的副作用。
      killCaffeinate()
      // 调用 spawnCaffeinate，触发服务层 prevent Sleep此处需要的副作用。
      spawnCaffeinate()
    }
  }, RESTART_INTERVAL_MS)

  // Don't let the interval keep the Node process alive
  // 调用 restartInterval.unref，触发服务层 prevent Sleep此处需要的副作用。
  restartInterval.unref()
}

// stopRestartInterval 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stopRestartInterval(): void {
  // `restartInterval` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (restartInterval !== null) {
    // 调用 clearInterval，触发服务层 prevent Sleep此处需要的副作用。
    clearInterval(restartInterval)
    // restartInterval更新为 `null`，确保服务层后续读取最新状态。
    restartInterval = null
  }
}

// spawnCaffeinate 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function spawnCaffeinate(): void {
  // Only run on macOS
  // `process.platform` 与 `'darwin'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.platform !== 'darwin') {
    // 服务层 prevent Sleep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Already running
  // `caffeinateProcess` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (caffeinateProcess !== null) {
    // 服务层 prevent Sleep在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Register cleanup on first use to ensure caffeinate is killed on exit
  // cleanupRegistered缺失时提前走兜底路径，避免服务层 prevent Sleep继续依赖无效输入。
  if (!cleanupRegistered) {
    // cleanupRegistered更新为 `true`，确保服务层后续读取最新状态。
    cleanupRegistered = true
    // 调用 registerCleanup，触发服务层 prevent Sleep此处需要的副作用。
    registerCleanup(async () => {
      // 调用 forceStopPreventSleep，触发服务层 prevent Sleep此处需要的副作用。
      forceStopPreventSleep()
    })
  }

  // 保护这一段可能失败的服务层 prevent Sleep操作，确保异常能进入相邻错误处理。
  try {
    // -i: Create an assertion to prevent idle sleep
    //     This is the least aggressive option - display can still sleep
    // -t: Timeout in seconds - caffeinate exits automatically after this
    //     This provides self-healing if Node is killed with SIGKILL
    // caffeinateProcess 集合更新为 `spawn(`，确保服务层后续读取最新状态。
    caffeinateProcess = spawn(
      'caffeinate',
      ['-i', '-t', String(CAFFEINATE_TIMEOUT_SECONDS)],
      {
        stdio: 'ignore',
      },
    )

    // Don't let caffeinate keep the Node process alive
    // 调用 caffeinateProcess.unref，触发服务层 prevent Sleep此处需要的副作用。
    caffeinateProcess.unref()

    // thisProc保存`caffeinateProcess`，供服务层 prevent Sleep后续判断或输出使用。
    const thisProc = caffeinateProcess
    // 调用 caffeinateProcess.on，触发服务层 prevent Sleep此处需要的副作用。
    caffeinateProcess.on('error', err => {
      // 记录服务层 prevent Sleep运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`caffeinate spawn error: ${err.message}`)
      // 满足 `caffeinateProcess === thisProc` 时，服务层 prevent Sleep执行该分支。
      if (caffeinateProcess === thisProc) caffeinateProcess = null
    })

    // 调用 caffeinateProcess.on，触发服务层 prevent Sleep此处需要的副作用。
    caffeinateProcess.on('exit', () => {
      // 满足 `caffeinateProcess === thisProc` 时，服务层 prevent Sleep执行该分支。
      if (caffeinateProcess === thisProc) caffeinateProcess = null
    })

    // 记录服务层 prevent Sleep运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Started caffeinate to prevent sleep')
  } catch {
    // Silently fail - caffeinate not available or spawn failed
    // caffeinateProcess 集合更新为 `null`，确保服务层后续读取最新状态。
    caffeinateProcess = null
  }
}

// killCaffeinate 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function killCaffeinate(): void {
  // `caffeinateProcess` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (caffeinateProcess !== null) {
    // proc保存`caffeinateProcess`，供服务层 prevent Sleep后续判断或输出使用。
    const proc = caffeinateProcess
    // caffeinateProcess 集合更新为 `null`，确保服务层后续读取最新状态。
    caffeinateProcess = null
    // 保护这一段可能失败的服务层 prevent Sleep操作，确保异常能进入相邻错误处理。
    try {
      // SIGKILL for immediate termination - SIGTERM could be delayed
      // 调用 proc.kill，触发服务层 prevent Sleep此处需要的副作用。
      proc.kill('SIGKILL')
      // 记录服务层 prevent Sleep运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Stopped caffeinate, allowing sleep')
    } catch {
      // Process may have already exited
    }
  }
}
