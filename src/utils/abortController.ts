// 引入 setMaxListeners，将 events 中已经封装好的能力接到本文件流程里。
import { setMaxListeners } from 'events'

/**
 * Default max listeners for standard operations
 */
// DEFAULT_MAX_LISTENERS 集合 命名 `50`，让后续代码直接表达这个值的用途。
const DEFAULT_MAX_LISTENERS = 50

/**
 * Creates an AbortController with proper event listener limits set.
 * This prevents MaxListenersExceededWarning when multiple listeners
 * are attached to the abort signal.
 *
 * @param maxListeners - Maximum number of listeners (default: 50)
 * @returns AbortController with configured listener limit
 */
// createAbortController 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createAbortController(
  maxListeners: number = DEFAULT_MAX_LISTENERS,
): AbortController {
  // controller保存`AbortController`，供共享工具后续处理使用。
  const controller = new AbortController()
  // setMaxListeners 写入新的状态值，使共享工具后续读取保持一致。
  setMaxListeners(maxListeners, controller.signal)
  // 返回 `controller`，作为共享工具这次计算的结果。
  return controller
}

/**
 * Propagates abort from a parent to a weakly-referenced child controller.
 * Both parent and child are weakly held — neither direction creates a
 * strong reference that could prevent GC.
 * Module-scope function avoids per-call closure allocation.
 */
// propagateAbort 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function propagateAbort(
  this: WeakRef<AbortController>,
  weakChild: WeakRef<AbortController>,
): void {
  // parent保存`this.deref`，供共享工具后续处理使用。
  const parent = this.deref()
  // 调用 weakChild.deref，触发共享工具此处需要的副作用。
  weakChild.deref()?.abort(parent?.signal.reason)
}

/**
 * Removes an abort handler from a weakly-referenced parent signal.
 * Both parent and handler are weakly held — if either has been GC'd
 * or the parent already aborted ({once: true}), this is a no-op.
 * Module-scope function avoids per-call closure allocation.
 */
// removeAbortHandler 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function removeAbortHandler(
  this: WeakRef<AbortController>,
  weakHandler: WeakRef<(...args: unknown[]) => void>,
): void {
  // parent保存`this.deref`，供共享工具后续处理使用。
  const parent = this.deref()
  // handler保存`weakHandler.deref`，供共享工具后续处理使用。
  const handler = weakHandler.deref()
  // 只有 `parent && handler` 满足时，共享工具才执行该分支。
  if (parent && handler) {
    // 调用 parent.signal.removeEventListener，触发共享工具此处需要的副作用。
    parent.signal.removeEventListener('abort', handler)
  }
}

/**
 * Creates a child AbortController that aborts when its parent aborts.
 * Aborting the child does NOT affect the parent.
 *
 * Memory-safe: Uses WeakRef so the parent doesn't retain abandoned children.
 * If the child is dropped without being aborted, it can still be GC'd.
 * When the child IS aborted, the parent listener is removed to prevent
 * accumulation of dead handlers.
 *
 * @param parent - The parent AbortController
 * @param maxListeners - Maximum number of listeners (default: 50)
 * @returns Child AbortController
 */
// createChildAbortController 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createChildAbortController(
  parent: AbortController,
  maxListeners?: number,
): AbortController {
  // child构建`createAbortController`，供共享工具后续处理使用。
  const child = createAbortController(maxListeners)

  // Fast path: parent already aborted, no listener setup needed
  // 满足 `parent.signal.aborted` 时，共享工具执行该分支。
  if (parent.signal.aborted) {
    // 触发取消信号，通知共享工具中仍在等待的异步任务尽快停止。
    child.abort(parent.signal.reason)
    // 返回 `child`，作为共享工具这次计算的结果。
    return child
  }

  // WeakRef prevents the parent from keeping an abandoned child alive.
  // If all strong references to child are dropped without aborting it,
  // the child can still be GC'd — the parent only holds a dead WeakRef.
  // weakChild保存`WeakRef`，供共享工具后续处理使用。
  const weakChild = new WeakRef(child)
  // weakParent保存`WeakRef`，供共享工具后续处理使用。
  const weakParent = new WeakRef(parent)
  // handler保存`propagateAbort.bind`，供共享工具后续处理使用。
  const handler = propagateAbort.bind(weakParent, weakChild)

  // 调用 parent.signal.addEventListener，触发共享工具此处需要的副作用。
  parent.signal.addEventListener('abort', handler, { once: true })

  // Auto-cleanup: remove parent listener when child is aborted (from any source).
  // Both parent and handler are weakly held — if either has been GC'd or the
  // parent already aborted ({once: true}), the cleanup is a harmless no-op.
  // 调用 child.signal.addEventListener，触发共享工具此处需要的副作用。
  child.signal.addEventListener(
    'abort',
    removeAbortHandler.bind(weakParent, new WeakRef(handler)),
    { once: true },
  )

  // 返回 `child`，作为共享工具这次计算的结果。
  return child
}
