// QueueItem 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type QueueItem<T extends unknown[], R> = {
  args: T
  // 这个回调绑定到 resolve: (value: R) => void，负责共享工具在该局部场景下的响应。
  resolve: (value: R) => void
  // 这个回调绑定到 reject: (reason?: unknown) => void，负责共享工具在该局部场景下的响应。
  reject: (reason?: unknown) => void
  context: unknown
}

/**
 * Creates a sequential execution wrapper for async functions to prevent race conditions.
 * Ensures that concurrent calls to the wrapped function are executed one at a time
 * in the order they were received, while preserving the correct return values.
 *
 * This is useful for operations that must be performed sequentially, such as
 * file writes or database updates that could cause conflicts if executed concurrently.
 *
 * @param fn - The async function to wrap with sequential execution
 * @returns A wrapped version of the function that executes calls sequentially
 */
// sequential 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sequential<T extends unknown[], R>(
  // 这个回调绑定到 fn: (...args: T) => Promise<R>,，负责共享工具在该局部场景下的响应。
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  // queue 从空数组开始收集，后续循环会按处理顺序追加条目。
  const queue: QueueItem<T, R>[] = []
  // processing标记共享工具 sequential是否启用对应路径。
  let processing = false

  // processQueue 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function processQueue(): Promise<void> {
    // 满足 `processing` 时，共享工具执行该分支。
    if (processing) return
    // queue为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
    if (queue.length === 0) return

    // processing更新为 `true`，确保共享工具后续读取最新状态。
    processing = true

    // while 使用 queue.length > 0 完成共享工具里的对应操作。
    while (queue.length > 0) {
      // 从 `queue.shift()!` 解构 args、resolve、reject、context，减少共享工具 sequential对同一对象的重复访问。
      const { args, resolve, reject, context } = queue.shift()!

      // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
      try {
        // 结果保存`fn.apply`，供共享工具后续处理使用。
        const result = await fn.apply(context, args)
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve(result)
      } catch (error) {
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(error)
      }
    }

    // processing更新为 `false`，确保共享工具后续读取最新状态。
    processing = false

    // Check if new items were added while we were processing
    // 满足 `queue.length > 0` 时，共享工具执行该分支。
    if (queue.length > 0) {
      // 显式忽略 `processQueue()` 的返回值，只保留它触发的副作用。
      void processQueue()
    }
  }

  // 返回 `function (this: unknown, ...args: T): Promise<R> {`，作为共享工具这次计算的结果。
  return function (this: unknown, ...args: T): Promise<R> {
    // 返回 `new Promise((resolve, reject) => {`，作为共享工具这次计算的结果。
    return new Promise((resolve, reject) => {
      // queue追加新条目，保持收集顺序与输入顺序一致。
      queue.push({ args, resolve, reject, context: this })
      // 显式忽略 `processQueue()` 的返回值，只保留它触发的副作用。
      void processQueue()
    })
  }
}
