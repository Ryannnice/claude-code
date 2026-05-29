// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'

/**
 * Coalescing uploader for PUT /worker (session state + metadata).
 *
 * - 1 in-flight PUT + 1 pending patch
 * - New calls coalesce into pending (never grows beyond 1 slot)
 * - On success: send pending if exists
 * - On failure: exponential backoff (clamped), retries indefinitely
 *   until success or close(). Absorbs any pending patches before each retry.
 * - No backpressure needed — naturally bounded at 2 slots
 *
 * Coalescing rules:
 * - Top-level keys (worker_status, external_metadata) — last value wins
 * - Inside external_metadata / internal_metadata — RFC 7396 merge:
 *   keys are added/overwritten, null values preserved (server deletes)
 */

// WorkerStateUploaderConfig 固化Worker State Uploader里传递的数据形状，帮助调用方按同一结构读写字段。
type WorkerStateUploaderConfig = {
  // 这个回调绑定到 send: (body: Record<string, unknown>) => Promise<boolean>，负责Worker State Uploader在该局部场景下的响应。
  send: (body: Record<string, unknown>) => Promise<boolean>
  /** Base delay for exponential backoff (ms) */
  baseDelayMs: number
  /** Max delay cap (ms) */
  maxDelayMs: number
  /** Random jitter range added to retry delay (ms) */
  jitterMs: number
}

// WorkerStateUploader 聚合Worker State Uploader相关状态与操作，把同一职责的行为收束到类实例中。
export class WorkerStateUploader {
  private inflight: Promise<void> | null = null
  private pending: Record<string, unknown> | null = null
  private closed = false
  private readonly config: WorkerStateUploaderConfig

  // 构造函数接收 config: WorkerStateUploaderConfig，把外部输入整理成实例可复用的内部状态。
  constructor(config: WorkerStateUploaderConfig) {
    // 更新实例字段 config 为 config，同步Worker State Uploader的内部状态。
    this.config = config
  }

  /**
   * Enqueue a patch to PUT /worker. Coalesces with any existing pending
   * patch. Fire-and-forget — callers don't need to await.
   */
  // enqueue 使用 patch: Record<string, unknown> 完成Worker State Uploader里的对应操作。
  enqueue(patch: Record<string, unknown>): void {
    // 满足 `this.closed` 时，Worker State Uploader执行该分支。
    if (this.closed) return
    // 更新实例字段 pending 为 this.pending ? coalescePatches(this.pending, patch) : patch，同步Worker State Uploader的内部状态。
    this.pending = this.pending ? coalescePatches(this.pending, patch) : patch
    // 显式忽略 `this.drain()` 的返回值，只保留它触发的副作用。
    void this.drain()
  }

  // close 使用 无 完成Worker State Uploader里的对应操作。
  close(): void {
    // 更新实例字段 closed 为 true，同步Worker State Uploader的内部状态。
    this.closed = true
    // 更新实例字段 pending 为 null，同步Worker State Uploader的内部状态。
    this.pending = null
  }

  // Worker State Uploader在这里处理 `private async drain(): Promise<void> {`，完成这一小步状态转换。
  private async drain(): Promise<void> {
    // 组合条件 `this.inflight || this.closed` 成立时，Worker State Uploader才启用这条专门路径。
    if (this.inflight || this.closed) return
    // this.pending缺失时提前走兜底路径，避免Worker State Uploader继续依赖无效输入。
    if (!this.pending) return

    // payload保存`this.pending`，供Worker State Uploader后续判断或输出使用。
    const payload = this.pending
    // 更新实例字段 pending 为 null，同步Worker State Uploader的内部状态。
    this.pending = null

    // 更新实例字段 inflight 为 this.sendWithRetry(payload).then(() => {，同步Worker State Uploader的内部状态。
    this.inflight = this.sendWithRetry(payload).then(() => {
      // 更新实例字段 inflight 为 null，同步Worker State Uploader的内部状态。
      this.inflight = null
      // 组合条件 `this.pending && !this.closed` 成立时，Worker State Uploader才启用这条专门路径。
      if (this.pending && !this.closed) {
        // 显式忽略 `this.drain()` 的返回值，只保留它触发的副作用。
        void this.drain()
      }
    })
  }

  /** Retries indefinitely with exponential backoff until success or close(). */
  // Worker State Uploader在这里处理 `private async sendWithRetry(payload: Record<string, unknown>): Promise<...`，完成这一小步状态转换。
  private async sendWithRetry(payload: Record<string, unknown>): Promise<void> {
    // current读取`payload`，供后续判断或组装使用。
    let current = payload
    // failures 集合 命名 `0`，让后续代码直接表达这个值的用途。
    let failures = 0
    // while 使用 !this.closed 完成Worker State Uploader里的对应操作。
    while (!this.closed) {
      // ok保存`config.send`，供Worker State Uploader后续处理使用。
      const ok = await this.config.send(current)
      // 满足 `ok` 时，Worker State Uploader执行该分支。
      if (ok) return

      // Worker State Uploader在这里处理 `failures++`，完成这一小步状态转换。
      failures++
      // 等待 `sleep(this.retryDelay(failures))` 完成，再继续Worker State Uploader的异步流程。
      await sleep(this.retryDelay(failures))

      // Absorb any patches that arrived during the retry
      // 组合条件 `this.pending && !this.closed` 成立时，Worker State Uploader才启用这条专门路径。
      if (this.pending && !this.closed) {
        // current更新为 `coalescePatches(current, this.pending)`，确保CLI后续读取最新状态。
        current = coalescePatches(current, this.pending)
        // 更新实例字段 pending 为 null，同步Worker State Uploader的内部状态。
        this.pending = null
      }
    }
  }

  // Worker State Uploader在这里处理 `private retryDelay(failures: number): number {`，完成这一小步状态转换。
  private retryDelay(failures: number): number {
    // exponential保存`Math.min`，供Worker State Uploader后续处理使用。
    const exponential = Math.min(
      this.config.baseDelayMs * 2 ** (failures - 1),
      this.config.maxDelayMs,
    )
    // jitter保存`Math.random`，供Worker State Uploader后续处理使用。
    const jitter = Math.random() * this.config.jitterMs
    // 返回 `exponential + jitter`，作为Worker State Uploader这次计算的结果。
    return exponential + jitter
  }
}

/**
 * Coalesce two patches for PUT /worker.
 *
 * Top-level keys: overlay replaces base (last value wins).
 * Metadata keys (external_metadata, internal_metadata): RFC 7396 merge
 * one level deep — overlay keys are added/overwritten, null values
 * preserved for server-side delete.
 */
// coalescePatches 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function coalescePatches(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  // merged 集中保存Worker State Uploader要一起传递的字段。
  const merged = { ...base }

  // 循环处理 `const [key, value] of Object.entries(overlay)`，让Worker State Uploader把同类条目按顺序走完。
  for (const [key, value] of Object.entries(overlay)) {
    // Worker State Uploader在这里进入条件判断，后续代码按实际状态分流。
    if (
      (key === 'external_metadata' || key === 'internal_metadata') &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      typeof value === 'object' &&
      value !== null
    ) {
      // RFC 7396 merge — overlay keys win, nulls preserved for server
      // merged[key更新为 `{`，确保Worker State Uploader后续读取最新状态。
      merged[key] = {
        ...(merged[key] as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      }
    } else {
      // merged[key更新为 `value`，确保Worker State Uploader后续读取最新状态。
      merged[key] = value
    }
  }

  // 返回 `merged`，作为Worker State Uploader这次计算的结果。
  return merged
}
