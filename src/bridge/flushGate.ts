/**
 * State machine for gating message writes during an initial flush.
 *
 * When a bridge session starts, historical messages are flushed to the
 * server via a single HTTP POST. During that flush, new messages must
 * be queued to prevent them from arriving at the server interleaved
 * with the historical messages.
 *
 * Lifecycle:
 *   start() → enqueue() returns true, items are queued
 *   end()   → returns queued items for draining, enqueue() returns false
 *   drop()  → discards queued items (permanent transport close)
 *   deactivate() → clears active flag without dropping items
 *                   (transport replacement — new transport will drain)
 */
// FlushGate 聚合远程桥接会话相关状态与操作，把同一职责的行为收束到类实例中。
export class FlushGate<T> {
  private _active = false
  private _pending: T[] = []

  // 远程桥接 flush Gate在这里处理 `get active(): boolean {`，完成这一小步状态转换。
  get active(): boolean {
    // 返回 `this._active`，作为远程桥接会话这次计算的结果。
    return this._active
  }

  // 远程桥接 flush Gate在这里处理 `get pendingCount(): number {`，完成这一小步状态转换。
  get pendingCount(): number {
    // 返回 `this._pending.length`，作为远程桥接会话这次计算的结果。
    return this._pending.length
  }

  /** Mark flush as in-progress. enqueue() will start queuing items. */
  // start 使用 无 完成远程桥接会话里的对应操作。
  start(): void {
    // 更新实例字段 _active 为 true，同步远程桥接会话的内部状态。
    this._active = true
  }

  /**
   * End the flush and return any queued items for draining.
   * Caller is responsible for sending the returned items.
   */
  // end 使用 无 完成远程桥接会话里的对应操作。
  end(): T[] {
    // 更新实例字段 _active 为 false，同步远程桥接会话的内部状态。
    this._active = false
    // 返回 `this._pending.splice(0)`，作为远程桥接会话这次计算的结果。
    return this._pending.splice(0)
  }

  /**
   * If flush is active, queue the items and return true.
   * If flush is not active, return false (caller should send directly).
   */
  // enqueue 使用 ...items: T[] 完成远程桥接会话里的对应操作。
  enqueue(...items: T[]): boolean {
    // this._active缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!this._active) return false
    // _pending追加新条目，保持收集顺序与输入顺序一致。
    this._pending.push(...items)
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  /**
   * Discard all queued items (permanent transport close).
   * Returns the number of items dropped.
   */
  // drop 使用 无 完成远程桥接会话里的对应操作。
  drop(): number {
    // 更新实例字段 _active 为 false，同步远程桥接会话的内部状态。
    this._active = false
    // count 数量 命名 `this._pending.length`，让后续代码直接表达这个值的用途。
    const count = this._pending.length
    // this._pending被清空，Bridge 通信从干净状态继续。
    this._pending.length = 0
    // 返回 `count`，作为远程桥接会话这次计算的结果。
    return count
  }

  /**
   * Clear the active flag without dropping queued items.
   * Used when the transport is replaced (onWorkReceived) — the new
   * transport's flush will drain the pending items.
   */
  // deactivate 使用 无 完成远程桥接会话里的对应操作。
  deactivate(): void {
    // 更新实例字段 _active 为 false，同步远程桥接会话的内部状态。
    this._active = false
  }
}
