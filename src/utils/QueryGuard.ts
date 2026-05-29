/**
 * Synchronous state machine for the query lifecycle, compatible with
 * React's `useSyncExternalStore`.
 *
 * Three states:
 *   idle        → no query, safe to dequeue and process
 *   dispatching → an item was dequeued, async chain hasn't reached onQuery yet
 *   running     → onQuery called tryStart(), query is executing
 *
 * Transitions:
 *   idle → dispatching  (reserve)
 *   dispatching → running  (tryStart)
 *   idle → running  (tryStart, for direct user submissions)
 *   running → idle  (end / forceEnd)
 *   dispatching → idle  (cancelReservation, when processQueueIfReady fails)
 *
 * `isActive` returns true for both dispatching and running, preventing
 * re-entry from the queue processor during the async gap.
 *
 * Usage with React:
 *   const queryGuard = useRef(new QueryGuard()).current
 *   const isQueryActive = useSyncExternalStore(
 *     queryGuard.subscribe,
 *     queryGuard.getSnapshot,
 *   )
 */
// 引入 createSignal，将 ./signal.js 中已经封装好的能力接到本文件流程里。
import { createSignal } from './signal.js'

// QueryGuard 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
export class QueryGuard {
  private _status: 'idle' | 'dispatching' | 'running' = 'idle'
  private _generation = 0
  private _changed = createSignal()

  /**
   * Reserve the guard for queue processing. Transitions idle → dispatching.
   * Returns false if not idle (another query or dispatch in progress).
   */
  // reserve 使用 无 完成共享工具里的对应操作。
  reserve(): boolean {
    // `this._status` 与 `'idle'` 不一致时刷新派生状态，避免使用过期结果。
    if (this._status !== 'idle') return false
    // 更新实例字段 _status 为 'dispatching'，同步共享工具的内部状态。
    this._status = 'dispatching'
    // 调用 this._notify，触发共享工具此处需要的副作用。
    this._notify()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  /**
   * Cancel a reservation when processQueueIfReady had nothing to process.
   * Transitions dispatching → idle.
   */
  // cancelReservation 使用 无 完成共享工具里的对应操作。
  cancelReservation(): void {
    // `this._status` 与 `'dispatching'` 不一致时刷新派生状态，避免使用过期结果。
    if (this._status !== 'dispatching') return
    // 更新实例字段 _status 为 'idle'，同步共享工具的内部状态。
    this._status = 'idle'
    // 调用 this._notify，触发共享工具此处需要的副作用。
    this._notify()
  }

  /**
   * Start a query. Returns the generation number on success,
   * or null if a query is already running (concurrent guard).
   * Accepts transitions from both idle (direct user submit)
   * and dispatching (queue processor path).
   */
  // tryStart 使用 无 完成共享工具里的对应操作。
  tryStart(): number | null {
    // 当 `this._status` 匹配 `'running'` 时，共享工具执行对应分支。
    if (this._status === 'running') return null
    // 更新实例字段 _status 为 'running'，同步共享工具的内部状态。
    this._status = 'running'
    // 共享工具 Query Guard在这里处理 `++this._generation`，完成这一小步状态转换。
    ++this._generation
    // 调用 this._notify，触发共享工具此处需要的副作用。
    this._notify()
    // 返回 `this._generation`，作为共享工具这次计算的结果。
    return this._generation
  }

  /**
   * End a query. Returns true if this generation is still current
   * (meaning the caller should perform cleanup). Returns false if a
   * newer query has started (stale finally block from a cancelled query).
   */
  // end 使用 generation: number 完成共享工具里的对应操作。
  end(generation: number): boolean {
    // `this._generation` 与 `generation` 不一致时刷新派生状态，避免使用过期结果。
    if (this._generation !== generation) return false
    // `this._status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
    if (this._status !== 'running') return false
    // 更新实例字段 _status 为 'idle'，同步共享工具的内部状态。
    this._status = 'idle'
    // 调用 this._notify，触发共享工具此处需要的副作用。
    this._notify()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  /**
   * Force-end the current query regardless of generation.
   * Used by onCancel where any running query should be terminated.
   * Increments generation so stale finally blocks from the cancelled
   * query's promise rejection will see a mismatch and skip cleanup.
   */
  // forceEnd 使用 无 完成共享工具里的对应操作。
  forceEnd(): void {
    // 当 `this._status` 匹配 `'idle'` 时，共享工具执行对应分支。
    if (this._status === 'idle') return
    // 更新实例字段 _status 为 'idle'，同步共享工具的内部状态。
    this._status = 'idle'
    // 共享工具 Query Guard在这里处理 `++this._generation`，完成这一小步状态转换。
    ++this._generation
    // 调用 this._notify，触发共享工具此处需要的副作用。
    this._notify()
  }

  /**
   * Is the guard active (dispatching or running)?
   * Always synchronous — not subject to React state batching delays.
   */
  // 共享工具 Query Guard在这里处理 `get isActive(): boolean {`，完成这一小步状态转换。
  get isActive(): boolean {
    // 返回 `this._status !== 'idle'`，作为共享工具这次计算的结果。
    return this._status !== 'idle'
  }

  // 共享工具 Query Guard在这里处理 `get generation(): number {`，完成这一小步状态转换。
  get generation(): number {
    // 返回 `this._generation`，作为共享工具这次计算的结果。
    return this._generation
  }

  // --
  // useSyncExternalStore interface

  /** Subscribe to state changes. Stable reference — safe as useEffect dep. */
  subscribe = this._changed.subscribe

  /** Snapshot for useSyncExternalStore. Returns `isActive`. */
  // getSnapshot更新为 `(): boolean => {`，确保共享工具后续读取最新状态。
  getSnapshot = (): boolean => {
    // 返回 `this._status !== 'idle'`，作为共享工具这次计算的结果。
    return this._status !== 'idle'
  }

  // 共享工具 Query Guard在这里处理 `private _notify(): void {`，完成这一小步状态转换。
  private _notify(): void {
    // 调用 this._changed.emit，触发共享工具此处需要的副作用。
    this._changed.emit()
  }
}
