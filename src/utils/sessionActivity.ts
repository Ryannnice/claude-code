/**
 * Session activity tracking with refcount-based heartbeat timer.
 *
 * The transport registers its keep-alive sender via registerSessionActivityCallback().
 * Callers (API streaming, tool execution) bracket their work with
 * startSessionActivity() / stopSessionActivity(). When the refcount is >0 a
 * periodic timer fires the registered callback every 30 seconds to keep the
 * container alive.
 *
 * Sending keep-alives is gated behind CLAUDE_CODE_REMOTE_SEND_KEEPALIVES.
 * Diagnostic logging always fires to help diagnose idle gaps.
 */

// 引入 registerCleanup，将 ./cleanupRegistry.js 中已经封装好的能力接到本文件流程里。
import { registerCleanup } from './cleanupRegistry.js'
// 引入 logForDiagnosticsNoPII，将 ./diagLogs.js 中已经封装好的能力接到本文件流程里。
import { logForDiagnosticsNoPII } from './diagLogs.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

// SESSION_ACTIVITY_INTERVAL_MS 会话数据 命名 `30_000`，让后续代码直接表达这个值的用途。
const SESSION_ACTIVITY_INTERVAL_MS = 30_000

// SessionActivityReason 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionActivityReason = 'api_call' | 'tool_exec'

// 这个回调绑定到 let activityCallback: (() => void) | null = null，负责共享工具在该局部场景下的响应。
let activityCallback: (() => void) | null = null
// refcount 数量保存`0`，供共享工具 session Activity后续判断或输出使用。
let refcount = 0
// activeReasons 集合构建`new Map<SessionActivityReason, number>()` 整理出中间结果，供共享工具 session Activity后续步骤使用。
const activeReasons = new Map<SessionActivityReason, number>()
// oldestActivityStartedAt 命名 `null`，让后续代码直接表达这个值的用途。
let oldestActivityStartedAt: number | null = null
// heartbeatTimer初始化为空值，后续分支会在有数据时补齐。
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
// idleTimer保存`null`，作为后续空值处理的输入。
let idleTimer: ReturnType<typeof setTimeout> | null = null
// cleanupRegistered标记共享工具 session Activity是否启用对应路径。
let cleanupRegistered = false

// startHeartbeatTimer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startHeartbeatTimer(): void {
  // 调用 clearIdleTimer，触发共享工具此处需要的副作用。
  clearIdleTimer()
  // heartbeatTimer更新为 `setInterval(() => {`，确保共享工具后续读取最新状态。
  heartbeatTimer = setInterval(() => {
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('debug', 'session_keepalive_heartbeat', {
      refcount,
    })
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE_SEND_KEEPALIVES)` 时，共享工具执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE_SEND_KEEPALIVES)) {
      // 调用 activityCallback?.()，完成这一处局部操作。
      activityCallback?.()
    }
  }, SESSION_ACTIVITY_INTERVAL_MS)
}

// startIdleTimer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function startIdleTimer(): void {
  // 调用 clearIdleTimer，触发共享工具此处需要的副作用。
  clearIdleTimer()
  // 满足 `activityCallback === null` 时，共享工具执行该分支。
  if (activityCallback === null) {
    // 共享工具 session Activity在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // idleTimer更新为 `setTimeout(() => {`，确保共享工具后续读取最新状态。
  idleTimer = setTimeout(() => {
    // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
    logForDiagnosticsNoPII('info', 'session_idle_30s')
    // idleTimer更新为 `null`，确保共享工具后续读取最新状态。
    idleTimer = null
  }, SESSION_ACTIVITY_INTERVAL_MS)
}

// clearIdleTimer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function clearIdleTimer(): void {
  // `idleTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (idleTimer !== null) {
    // 调用 clearTimeout，触发共享工具此处需要的副作用。
    clearTimeout(idleTimer)
    // idleTimer更新为 `null`，确保共享工具后续读取最新状态。
    idleTimer = null
  }
}

// registerSessionActivityCallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerSessionActivityCallback(cb: () => void): void {
  // activityCallback更新为 `cb`，确保共享工具后续读取最新状态。
  activityCallback = cb
  // Restart timer if work is already in progress (e.g. reconnect during streaming)
  // 只有 `refcount > 0 && heartbeatTimer === null` 满足时，共享工具才执行该分支。
  if (refcount > 0 && heartbeatTimer === null) {
    // 调用 startHeartbeatTimer，触发共享工具此处需要的副作用。
    startHeartbeatTimer()
  }
}

// unregisterSessionActivityCallback 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unregisterSessionActivityCallback(): void {
  // activityCallback更新为 `null`，确保共享工具后续读取最新状态。
  activityCallback = null
  // Stop timer if the callback is removed
  // `heartbeatTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (heartbeatTimer !== null) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(heartbeatTimer)
    // heartbeatTimer更新为 `null`，确保共享工具后续读取最新状态。
    heartbeatTimer = null
  }
  // 调用 clearIdleTimer，触发共享工具此处需要的副作用。
  clearIdleTimer()
}

// sendSessionActivitySignal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sendSessionActivitySignal(): void {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE_SEND_KEEPALIVES)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_REMOTE_SEND_KEEPALIVES)) {
    // 调用 activityCallback?.()，完成这一处局部操作。
    activityCallback?.()
  }
}

// isSessionActivityTrackingActive 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSessionActivityTrackingActive(): boolean {
  // 返回 `activityCallback !== null`，作为共享工具这次计算的结果。
  return activityCallback !== null
}

/**
 * Increment the activity refcount. When it transitions from 0→1 and a callback
 * is registered, start a periodic heartbeat timer.
 */
// startSessionActivity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startSessionActivity(reason: SessionActivityReason): void {
  // 共享工具 session Activity在这里处理 `refcount++`，完成这一小步状态转换。
  refcount++
  // activeReasons.set 写入新的状态值，使共享工具后续读取保持一致。
  activeReasons.set(reason, (activeReasons.get(reason) ?? 0) + 1)
  // 满足 `refcount === 1` 时，共享工具执行该分支。
  if (refcount === 1) {
    // oldestActivityStartedAt更新为 `Date.now()`，确保共享工具后续读取最新状态。
    oldestActivityStartedAt = Date.now()
    // `activityCallback` 与 `null && heartbeatTimer === n` 不一致时刷新派生状态，避免使用过期结果。
    if (activityCallback !== null && heartbeatTimer === null) {
      // 调用 startHeartbeatTimer，触发共享工具此处需要的副作用。
      startHeartbeatTimer()
    }
  }
  // cleanupRegistered缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!cleanupRegistered) {
    // cleanupRegistered更新为 `true`，确保共享工具后续读取最新状态。
    cleanupRegistered = true
    // 调用 registerCleanup，触发共享工具此处需要的副作用。
    registerCleanup(async () => {
      // 调用 logForDiagnosticsNoPII，触发共享工具此处需要的副作用。
      logForDiagnosticsNoPII('info', 'session_activity_at_shutdown', {
        refcount,
        active: Object.fromEntries(activeReasons),
        // Only meaningful while work is in-flight; stale otherwise.
        oldest_activity_ms:
          refcount > 0 && oldestActivityStartedAt !== null
            ? Date.now() - oldestActivityStartedAt
            : null,
      })
    })
  }
}

/**
 * Decrement the activity refcount. When it reaches 0, stop the heartbeat timer
 * and start an idle timer that logs after 30s of inactivity.
 */
// stopSessionActivity 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopSessionActivity(reason: SessionActivityReason): void {
  // 满足 `refcount > 0` 时，共享工具执行该分支。
  if (refcount > 0) {
    // 共享工具 session Activity在这里处理 `refcount--`，完成这一小步状态转换。
    refcount--
  }
  // n读取`activeReasons.get`，供共享工具后续处理使用。
  const n = (activeReasons.get(reason) ?? 0) - 1
  // 满足 `n > 0) activeReasons.set(reason, n` 时，共享工具执行该分支。
  if (n > 0) activeReasons.set(reason, n)
  else activeReasons.delete(reason)
  // `refcount === 0 && heartbeatTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (refcount === 0 && heartbeatTimer !== null) {
    // 调用 clearInterval，触发共享工具此处需要的副作用。
    clearInterval(heartbeatTimer)
    // heartbeatTimer更新为 `null`，确保共享工具后续读取最新状态。
    heartbeatTimer = null
    // 调用 startIdleTimer，触发共享工具此处需要的副作用。
    startIdleTimer()
  }
}
