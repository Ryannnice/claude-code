/**
 * Abort-responsive sleep. Resolves after `ms` milliseconds, or immediately
 * when `signal` aborts (so backoff loops don't block shutdown).
 *
 * By default, abort resolves silently; the caller should check
 * `signal.aborted` after the await. Pass `throwOnAbort: true` to have
 * abort reject — useful when the sleep is deep inside a retry loop
 * and you want the rejection to bubble up and cancel the whole operation.
 *
 * Pass `abortError` to customize the rejection error (implies
 * `throwOnAbort: true`). Useful for retry loops that catch a specific
 * error class (e.g. `APIUserAbortError`).
 */
// sleep 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sleep(
  ms: number,
  signal?: AbortSignal,
  opts?: { throwOnAbort?: boolean; abortError?: () => Error; unref?: boolean },
): Promise<void> {
  // 返回 `new Promise((resolve, reject) => {`，作为共享工具这次计算的结果。
  return new Promise((resolve, reject) => {
    // Check aborted state BEFORE setting up the timer. If we defined
    // onAbort first and called it synchronously here, it would reference
    // `timer` while still in the Temporal Dead Zone.
    // 满足 `signal?.aborted` 时，共享工具执行该分支。
    if (signal?.aborted) {
      // 只有 `opts?.throwOnAbort || opts?.abortError` 满足时，共享工具才执行该分支。
      if (opts?.throwOnAbort || opts?.abortError) {
        // 显式忽略 `reject(opts.abortError?.() ?? new Error('aborted'))` 的返回值，只保留它触发的副作用。
        void reject(opts.abortError?.() ?? new Error('aborted'))
      } else {
        // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
        void resolve()
      }
      // 共享工具 sleep在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // timer保存`setTimeout`，供共享工具后续处理使用。
    const timer = setTimeout(
      // 这个回调绑定到 (signal, onAbort, resolve) => {，负责共享工具在该局部场景下的响应。
      (signal, onAbort, resolve) => {
        // 调用 signal?.removeEventListener('abort', onAbort)，完成这一处局部操作。
        signal?.removeEventListener('abort', onAbort)
        // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
        void resolve()
      },
      ms,
      signal,
      onAbort,
      resolve,
    )
    // onAbort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function onAbort(): void {
      // 调用 clearTimeout，触发共享工具此处需要的副作用。
      clearTimeout(timer)
      // 只有 `opts?.throwOnAbort || opts?.abortError` 满足时，共享工具才执行该分支。
      if (opts?.throwOnAbort || opts?.abortError) {
        // 显式忽略 `reject(opts.abortError?.() ?? new Error('aborted'))` 的返回值，只保留它触发的副作用。
        void reject(opts.abortError?.() ?? new Error('aborted'))
      } else {
        // 显式忽略 `resolve()` 的返回值，只保留它触发的副作用。
        void resolve()
      }
    }
    // 调用 signal?.addEventListener('abort', onAbort, { once: true })，完成这一处局部操作。
    signal?.addEventListener('abort', onAbort, { once: true })
    // 满足 `opts?.unref` 时，共享工具执行该分支。
    if (opts?.unref) {
      // 调用 timer.unref，触发共享工具此处需要的副作用。
      timer.unref()
    }
  })
}

// rejectWithTimeout 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function rejectWithTimeout(reject: (e: Error) => void, message: string): void {
  // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
  reject(new Error(message))
}

/**
 * Race a promise against a timeout. Rejects with `Error(message)` if the
 * promise doesn't settle within `ms`. The timeout timer is cleared when
 * the promise settles (no dangling timer) and unref'd so it doesn't
 * block process exit.
 *
 * Note: this doesn't cancel the underlying work — if the promise is
 * backed by a runaway async operation, that keeps running. This just
 * returns control to the caller.
 */
// withTimeout 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  // timer 先占位，稍后的条件分支会根据实际输入补齐它。
  let timer: ReturnType<typeof setTimeout> | undefined
  // timeoutPromise 异步任务封装成回调，供共享工具 sleep在事件触发或异步步骤中调用。
  const timeoutPromise = new Promise<never>((_, reject) => {
    // eslint-disable-next-line no-restricted-syntax -- not a sleep: REJECTS after ms (timeout guard)
    // timer更新为 `setTimeout(rejectWithTimeout, ms, reject, message)`，确保共享工具后续读取最新状态。
    timer = setTimeout(rejectWithTimeout, ms, reject, message)
    // 满足 `typeof timer === 'object') timer.unref?.(` 时，共享工具执行该分支。
    if (typeof timer === 'object') timer.unref?.()
  })
  // 返回 `Promise.race([promise, timeoutPromise]).finally(() => {`，作为共享工具这次计算的结果。
  return Promise.race([promise, timeoutPromise]).finally(() => {
    // `timer` 与 `undefined) clearTimeout(timer` 不一致时刷新派生状态，避免使用过期结果。
    if (timer !== undefined) clearTimeout(timer)
  })
}
