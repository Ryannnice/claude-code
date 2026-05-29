// 引入 createAbortController，将 ./abortController.js 中已经封装好的能力接到本文件流程里。
import { createAbortController } from './abortController.js'

/**
 * Creates a combined AbortSignal that aborts when the input signal aborts,
 * an optional second signal aborts, or an optional timeout elapses.
 * Returns both the signal and a cleanup function that removes event listeners
 * and clears the internal timeout timer.
 *
 * Use `timeoutMs` instead of passing `AbortSignal.timeout(ms)` as a signal —
 * under Bun, `AbortSignal.timeout` timers are finalized lazily and accumulate
 * in native memory until they fire (measured ~2.4KB/call held for the full
 * timeout duration). This implementation uses `setTimeout` + `clearTimeout`
 * so the timer is freed immediately on cleanup.
 */
// createCombinedAbortSignal 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createCombinedAbortSignal(
  signal: AbortSignal | undefined,
  opts?: { signalB?: AbortSignal; timeoutMs?: number },
): { signal: AbortSignal; cleanup: () => void } {
  // 从 `opts ?? {}` 解构 signalB、timeoutMs，减少共享工具 combined Abort Signal对同一对象的重复访问。
  const { signalB, timeoutMs } = opts ?? {}
  // combined构建`createAbortController`，供共享工具后续处理使用。
  const combined = createAbortController()

  // 只有 `signal?.aborted || signalB?.aborted` 满足时，共享工具才执行该分支。
  if (signal?.aborted || signalB?.aborted) {
    // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
    combined.abort()
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { signal: combined.signal, cleanup: () => {} }
  }

  // timer 先占位，稍后的条件分支会根据实际输入补齐它。
  let timer: ReturnType<typeof setTimeout> | undefined
  // abortCombined封装成回调，供共享工具 combined Abort Signal在事件触发或异步步骤中调用。
  const abortCombined = () => {
    // `timer` 与 `undefined) clearTimeout(timer` 不一致时刷新派生状态，避免使用过期结果。
    if (timer !== undefined) clearTimeout(timer)
    // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
    combined.abort()
  }

  // `timeoutMs` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (timeoutMs !== undefined) {
    // timer更新为 `setTimeout(abortCombined, timeoutMs)`，确保共享工具后续读取最新状态。
    timer = setTimeout(abortCombined, timeoutMs)
    // 调用 timer.unref?.()，完成这一处局部操作。
    timer.unref?.()
  }
  // 调用 signal?.addEventListener('abort', abortCombined)，完成这一处局部操作。
  signal?.addEventListener('abort', abortCombined)
  // 调用 signalB?.addEventListener('abort', abortCombined)，完成这一处局部操作。
  signalB?.addEventListener('abort', abortCombined)

  // cleanup封装成回调，供共享工具 combined Abort Signal在事件触发或异步步骤中调用。
  const cleanup = () => {
    // `timer` 与 `undefined) clearTimeout(timer` 不一致时刷新派生状态，避免使用过期结果。
    if (timer !== undefined) clearTimeout(timer)
    // 调用 signal?.removeEventListener('abort', abortCombined)，完成这一处局部操作。
    signal?.removeEventListener('abort', abortCombined)
    // 调用 signalB?.removeEventListener('abort', abortCombined)，完成这一处局部操作。
    signalB?.removeEventListener('abort', abortCombined)
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { signal: combined.signal, cleanup }
}
