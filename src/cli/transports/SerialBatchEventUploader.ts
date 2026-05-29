// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'

/**
 * Serial ordered event uploader with batching, retry, and backpressure.
 *
 * - enqueue() adds events to a pending buffer
 * - At most 1 POST in-flight at a time
 * - Drains up to maxBatchSize items per POST
 * - New events accumulate while in-flight
 * - On failure: exponential backoff (clamped), retries indefinitely
 *   until success or close() — unless maxConsecutiveFailures is set,
 *   in which case the failing batch is dropped and drain advances
 * - flush() blocks until pending is empty and kicks drain if needed
 * - Backpressure: enqueue() blocks when maxQueueSize is reached
 */

/**
 * Throw from config.send() to make the uploader wait a server-supplied
 * duration before retrying (e.g. 429 with Retry-After). When retryAfterMs
 * is set, it overrides exponential backoff for that attempt — clamped to
 * [baseDelayMs, maxDelayMs] and jittered so a misbehaving server can
 * neither hot-loop nor stall the client, and many sessions sharing a rate
 * limit don't all pounce at the same instant. Without retryAfterMs, behaves
 * like any other thrown error (exponential backoff).
 */
// RetryableError 聚合Serial Batch Event Uploader相关状态与操作，把同一职责的行为收束到类实例中。
export class RetryableError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs?: number,
  ) {
    // 调用 super，触发Serial Batch Event Uploader此处需要的副作用。
    super(message)
  }
}

// SerialBatchEventUploaderConfig 固化Serial Batch Event Uploader里传递的数据形状，帮助调用方按同一结构读写字段。
type SerialBatchEventUploaderConfig<T> = {
  /** Max items per POST (1 = no batching) */
  maxBatchSize: number
  /**
   * Max serialized bytes per POST. First item always goes in regardless of
   * size; subsequent items only if cumulative JSON bytes stay under this.
   * Undefined = no byte limit (count-only batching).
   */
  maxBatchBytes?: number
  /** Max pending items before enqueue() blocks */
  maxQueueSize: number
  /** The actual HTTP call — caller controls payload format */
  // 这个回调绑定到 send: (batch: T[]) => Promise<void>，负责Serial Batch Event Uploader在该局部场景下的响应。
  send: (batch: T[]) => Promise<void>
  /** Base delay for exponential backoff (ms) */
  baseDelayMs: number
  /** Max delay cap (ms) */
  maxDelayMs: number
  /** Random jitter range added to retry delay (ms) */
  jitterMs: number
  /**
   * After this many consecutive send() failures, drop the failing batch
   * and move on to the next pending item with a fresh failure budget.
   * Undefined = retry indefinitely (default).
   */
  maxConsecutiveFailures?: number
  /** Called when a batch is dropped for hitting maxConsecutiveFailures. */
  // 这个回调绑定到 onBatchDropped?: (batchSize: number, failures: number) => void，负责Serial Batch Event Uploader在该局部场景下的响应。
  onBatchDropped?: (batchSize: number, failures: number) => void
}

// SerialBatchEventUploader 聚合Serial Batch Event Uploader相关状态与操作，把同一职责的行为收束到类实例中。
export class SerialBatchEventUploader<T> {
  private pending: T[] = []
  private pendingAtClose = 0
  private draining = false
  private closed = false
  // 这个回调绑定到 private backpressureResolvers: Array<() => void> = []，负责Serial Batch Event Uploader在该局部场景下的响应。
  private backpressureResolvers: Array<() => void> = []
  // 这个回调绑定到 private sleepResolve: (() => void) | null = null，负责Serial Batch Event Uploader在该局部场景下的响应。
  private sleepResolve: (() => void) | null = null
  // 这个回调绑定到 private flushResolvers: Array<() => void> = []，负责Serial Batch Event Uploader在该局部场景下的响应。
  private flushResolvers: Array<() => void> = []
  private droppedBatches = 0
  private readonly config: SerialBatchEventUploaderConfig<T>

  // 构造函数接收 config: SerialBatchEventUploaderConfig<T>，把外部输入整理成实例可复用的内部状态。
  constructor(config: SerialBatchEventUploaderConfig<T>) {
    // 更新实例字段 config 为 config，同步Serial Batch Event Uploader的内部状态。
    this.config = config
  }

  /**
   * Monotonic count of batches dropped via maxConsecutiveFailures. Callers
   * can snapshot before flush() and compare after to detect silent drops
   * (flush() resolves normally even when batches were dropped).
   */
  // Serial Batch Event Uploader在这里处理 `get droppedBatchCount(): number {`，完成这一小步状态转换。
  get droppedBatchCount(): number {
    // 返回 `this.droppedBatches`，作为Serial Batch Event Uploader这次计算的结果。
    return this.droppedBatches
  }

  /**
   * Pending queue depth. After close(), returns the count at close time —
   * close() clears the queue but shutdown diagnostics may read this after.
   */
  // Serial Batch Event Uploader在这里处理 `get pendingCount(): number {`，完成这一小步状态转换。
  get pendingCount(): number {
    // 返回 `this.closed ? this.pendingAtClose : this.pending.length`，作为Serial Batch Event Uploader这次计算的结果。
    return this.closed ? this.pendingAtClose : this.pending.length
  }

  /**
   * Add events to the pending buffer. Returns immediately if space is
   * available. Blocks (awaits) if the buffer is full — caller pauses
   * until drain frees space.
   */
  // enqueue 使用 events: T | T[] 完成Serial Batch Event Uploader里的对应操作。
  async enqueue(events: T | T[]): Promise<void> {
    // 满足 `this.closed` 时，Serial Batch Event Uploader执行该分支。
    if (this.closed) return
    // items 集合保存`Array.isArray`，供Serial Batch Event Uploader后续处理使用。
    const items = Array.isArray(events) ? events : [events]
    // items 集合为空时立即返回或跳过，避免Serial Batch Event Uploader把空集合当成可处理内容。
    if (items.length === 0) return

    // Backpressure: wait until there's space
    // 调用 while，触发Serial Batch Event Uploader此处需要的副作用。
    while (
      this.pending.length + items.length > this.config.maxQueueSize &&
      !this.closed
    ) {
      // 这个回调绑定到 await new Promise<void>(resolve => {，负责Serial Batch Event Uploader在该局部场景下的响应。
      await new Promise<void>(resolve => {
        // backpressureResolvers 集合追加新条目，保持收集顺序与输入顺序一致。
        this.backpressureResolvers.push(resolve)
      })
    }

    // 满足 `this.closed` 时，Serial Batch Event Uploader执行该分支。
    if (this.closed) return
    // pending追加新条目，保持收集顺序与输入顺序一致。
    this.pending.push(...items)
    // 显式忽略 `this.drain()` 的返回值，只保留它触发的副作用。
    void this.drain()
  }

  /**
   * Block until all pending events have been sent.
   * Used at turn boundaries and graceful shutdown.
   */
  // flush 使用 无 完成Serial Batch Event Uploader里的对应操作。
  flush(): Promise<void> {
    // 组合条件 `this.pending.length === 0 && !this.draining` 成立时，Serial Batch Event Uploader才启用这条专门路径。
    if (this.pending.length === 0 && !this.draining) {
      // 返回 `Promise.resolve()`，作为Serial Batch Event Uploader这次计算的结果。
      return Promise.resolve()
    }
    // 显式忽略 `this.drain()` 的返回值，只保留它触发的副作用。
    void this.drain()
    // 返回 `new Promise<void>(resolve => {`，作为Serial Batch Event Uploader这次计算的结果。
    return new Promise<void>(resolve => {
      // flushResolvers 集合追加新条目，保持收集顺序与输入顺序一致。
      this.flushResolvers.push(resolve)
    })
  }

  /**
   * Drop pending events and stop processing.
   * Resolves any blocked enqueue() and flush() callers.
   */
  // close 使用 无 完成Serial Batch Event Uploader里的对应操作。
  close(): void {
    // 满足 `this.closed` 时，Serial Batch Event Uploader执行该分支。
    if (this.closed) return
    // 更新实例字段 closed 为 true，同步Serial Batch Event Uploader的内部状态。
    this.closed = true
    // 更新实例字段 pendingAtClose 为 this.pending.length，同步Serial Batch Event Uploader的内部状态。
    this.pendingAtClose = this.pending.length
    // 更新实例字段 pending 为 []，同步Serial Batch Event Uploader的内部状态。
    this.pending = []
    // 调用 this.sleepResolve?.()，完成这一处局部操作。
    this.sleepResolve?.()
    // 更新实例字段 sleepResolve 为 null，同步Serial Batch Event Uploader的内部状态。
    this.sleepResolve = null
    // 逐项读取 `this.backpressureResolvers) resolve(` 中的resolve，按输入顺序推进Serial Batch Event Uploader。
    for (const resolve of this.backpressureResolvers) resolve()
    // 更新实例字段 backpressureResolvers 为 []，同步Serial Batch Event Uploader的内部状态。
    this.backpressureResolvers = []
    // 逐项读取 `this.flushResolvers) resolve(` 中的resolve，按输入顺序推进Serial Batch Event Uploader。
    for (const resolve of this.flushResolvers) resolve()
    // 更新实例字段 flushResolvers 为 []，同步Serial Batch Event Uploader的内部状态。
    this.flushResolvers = []
  }

  /**
   * Drain loop. At most one instance runs at a time (guarded by this.draining).
   * Sends batches serially. On failure, backs off and retries indefinitely.
   */
  // Serial Batch Event Uploader在这里处理 `private async drain(): Promise<void> {`，完成这一小步状态转换。
  private async drain(): Promise<void> {
    // 组合条件 `this.draining || this.closed` 成立时，Serial Batch Event Uploader才启用这条专门路径。
    if (this.draining || this.closed) return
    // 更新实例字段 draining 为 true，同步Serial Batch Event Uploader的内部状态。
    this.draining = true
    // failures 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let failures = 0

    // 保护这一段可能失败的Serial Batch Event Uploader操作，确保异常能进入相邻错误处理。
    try {
      // while 使用 this.pending.length > 0 && !this.closed 完成Serial Batch Event Uploader里的对应操作。
      while (this.pending.length > 0 && !this.closed) {
        // batch保存`this.takeBatch`，供Serial Batch Event Uploader后续处理使用。
        const batch = this.takeBatch()
        // batch为空时立即返回或跳过，避免Serial Batch Event Uploader把空集合当成可处理内容。
        if (batch.length === 0) continue

        // 保护这一段可能失败的Serial Batch Event Uploader操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `this.config.send(batch)` 完成，再继续Serial Batch Event Uploader的异步流程。
          await this.config.send(batch)
          // failures 集合更新为 `0`，确保CLI后续读取最新状态。
          failures = 0
        } catch (err) {
          // Serial Batch Event Uploader在这里处理 `failures++`，完成这一小步状态转换。
          failures++
          // Serial Batch Event Uploader在这里进入条件判断，后续代码按实际状态分流。
          if (
            this.config.maxConsecutiveFailures !== undefined &&
            failures >= this.config.maxConsecutiveFailures
          ) {
            // Serial Batch Event Uploader在这里处理 `this.droppedBatches++`，完成这一小步状态转换。
            this.droppedBatches++
            // 调用 this.config.onBatchDropped?.(batch.length, failures)，完成这一处局部操作。
            this.config.onBatchDropped?.(batch.length, failures)
            // failures 集合更新为 `0`，确保CLI后续读取最新状态。
            failures = 0
            // 调用 this.releaseBackpressure，触发Serial Batch Event Uploader此处需要的副作用。
            this.releaseBackpressure()
            // 跳过当前项，继续处理Serial Batch Event Uploader中的下一轮循环。
            continue
          }
          // Re-queue the failed batch at the front. Use concat (single
          // allocation) instead of unshift(...batch) which shifts every
          // pending item batch.length times. Only hit on failure path.
          // 更新实例字段 pending 为 batch.concat(this.pending)，同步Serial Batch Event Uploader的内部状态。
          this.pending = batch.concat(this.pending)
          // retryAfterMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const retryAfterMs =
            err instanceof RetryableError ? err.retryAfterMs : undefined
          // 等待 `this.sleep(this.retryDelay(failures, retryAfterMs))` 完成，再继续Serial Batch Event Uploader的异步流程。
          await this.sleep(this.retryDelay(failures, retryAfterMs))
          // 跳过当前项，继续处理Serial Batch Event Uploader中的下一轮循环。
          continue
        }

        // Release backpressure waiters if space opened up
        // 调用 this.releaseBackpressure，触发Serial Batch Event Uploader此处需要的副作用。
        this.releaseBackpressure()
      }
    } finally {
      // 更新实例字段 draining 为 false，同步Serial Batch Event Uploader的内部状态。
      this.draining = false
      // Notify flush waiters if queue is empty
      // this.pending为空时立即返回或跳过，避免Serial Batch Event Uploader把空集合当成可处理内容。
      if (this.pending.length === 0) {
        // 逐项读取 `this.flushResolvers) resolve(` 中的resolve，按输入顺序推进Serial Batch Event Uploader。
        for (const resolve of this.flushResolvers) resolve()
        // 更新实例字段 flushResolvers 为 []，同步Serial Batch Event Uploader的内部状态。
        this.flushResolvers = []
      }
    }
  }

  /**
   * Pull the next batch from pending. Respects both maxBatchSize and
   * maxBatchBytes. The first item is always taken; subsequent items only
   * if adding them keeps the cumulative JSON size under maxBatchBytes.
   *
   * Un-serializable items (BigInt, circular refs, throwing toJSON) are
   * dropped in place — they can never be sent and leaving them at
   * pending[0] would poison the queue and hang flush() forever.
   */
  // Serial Batch Event Uploader在这里处理 `private takeBatch(): T[] {`，完成这一小步状态转换。
  private takeBatch(): T[] {
    // 从 `this.config` 解构 maxBatchSize、maxBatchBytes，减少Serial Batch Event Uploader对同一对象的重复访问。
    const { maxBatchSize, maxBatchBytes } = this.config
    // 满足 `maxBatchBytes === undefined` 时，Serial Batch Event Uploader执行该分支。
    if (maxBatchBytes === undefined) {
      // 返回 `this.pending.splice(0, maxBatchSize)`，作为Serial Batch Event Uploader这次计算的结果。
      return this.pending.splice(0, maxBatchSize)
    }
    // bytes 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let bytes = 0
    // count 数量保存`0`，供Serial Batch Event Uploader后续判断或输出使用。
    let count = 0
    // while 使用 count < this.pending.length && count < maxBatchSi… 完成Serial Batch Event Uploader里的对应操作。
    while (count < this.pending.length && count < maxBatchSize) {
      // itemBytes 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let itemBytes: number
      // 保护这一段可能失败的Serial Batch Event Uploader操作，确保异常能进入相邻错误处理。
      try {
        // itemBytes 集合更新为 `Buffer.byteLength(jsonStringify(this.pending[count]))`，确保CLI后续读取最新状态。
        itemBytes = Buffer.byteLength(jsonStringify(this.pending[count]))
      } catch {
        // 调用 this.pending.splice，触发Serial Batch Event Uploader此处需要的副作用。
        this.pending.splice(count, 1)
        // 跳过当前项，继续处理Serial Batch Event Uploader中的下一轮循环。
        continue
      }
      // 组合条件 `count > 0 && bytes + itemBytes > maxBatchBytes` 成立时，Serial Batch Event Uploader才启用这条专门路径。
      if (count > 0 && bytes + itemBytes > maxBatchBytes) break
      // Serial Batch Event Uploader在这里处理 `bytes += itemBytes`，完成这一小步状态转换。
      bytes += itemBytes
      // Serial Batch Event Uploader在这里处理 `count++`，完成这一小步状态转换。
      count++
    }
    // 返回 `this.pending.splice(0, count)`，作为Serial Batch Event Uploader这次计算的结果。
    return this.pending.splice(0, count)
  }

  // Serial Batch Event Uploader在这里处理 `private retryDelay(failures: number, retryAfterMs?: number): number {`，完成这一小步状态转换。
  private retryDelay(failures: number, retryAfterMs?: number): number {
    // jitter保存`Math.random`，供Serial Batch Event Uploader后续处理使用。
    const jitter = Math.random() * this.config.jitterMs
    // `retryAfterMs` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (retryAfterMs !== undefined) {
      // Jitter on top of the server's hint prevents thundering herd when
      // many sessions share a rate limit and all receive the same
      // Retry-After. Clamp first, then spread — same shape as the
      // exponential path (effective ceiling is maxDelayMs + jitterMs).
      // clamped保存`Math.max`，供Serial Batch Event Uploader后续处理使用。
      const clamped = Math.max(
        this.config.baseDelayMs,
        Math.min(retryAfterMs, this.config.maxDelayMs),
      )
      // 返回 `clamped + jitter`，作为Serial Batch Event Uploader这次计算的结果。
      return clamped + jitter
    }
    // exponential保存`Math.min`，供Serial Batch Event Uploader后续处理使用。
    const exponential = Math.min(
      this.config.baseDelayMs * 2 ** (failures - 1),
      this.config.maxDelayMs,
    )
    // 返回 `exponential + jitter`，作为Serial Batch Event Uploader这次计算的结果。
    return exponential + jitter
  }

  // Serial Batch Event Uploader在这里处理 `private releaseBackpressure(): void {`，完成这一小步状态转换。
  private releaseBackpressure(): void {
    // resolvers 集合 命名 `this.backpressureResolvers`，让后续代码直接表达这个值的用途。
    const resolvers = this.backpressureResolvers
    // 更新实例字段 backpressureResolvers 为 []，同步Serial Batch Event Uploader的内部状态。
    this.backpressureResolvers = []
    // 逐项读取 `resolvers) resolve(` 中的resolve，按输入顺序推进Serial Batch Event Uploader。
    for (const resolve of resolvers) resolve()
  }

  // Serial Batch Event Uploader在这里处理 `private sleep(ms: number): Promise<void> {`，完成这一小步状态转换。
  private sleep(ms: number): Promise<void> {
    // 返回 `new Promise(resolve => {`，作为Serial Batch Event Uploader这次计算的结果。
    return new Promise(resolve => {
      // 更新实例字段 sleepResolve 为 resolve，同步Serial Batch Event Uploader的内部状态。
      this.sleepResolve = resolve
      // setTimeout 写入新的状态值，使Serial Batch Event Uploader后续读取保持一致。
      setTimeout(
        (self, resolve) => {
          // sleepResolve更新为 `null`，确保CLI后续读取最新状态。
          self.sleepResolve = null
          // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
          resolve()
        },
        ms,
        this,
        resolve,
      )
    })
  }
}
