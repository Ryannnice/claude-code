/**
 * Tiny listener-set primitive for pure event signals (no stored state).
 *
 * Collapses the ~8-line `const listeners = new Set(); function subscribe(){…};
 * function notify(){for(const l of listeners) l()}` boilerplate that was
 * duplicated ~15× across the codebase into a one-liner.
 *
 * Distinct from a store (AppState, createStore) — there is no snapshot, no
 * getState. Use this when subscribers only need to know "something happened",
 * optionally with event args, not "what is the current value".
 *
 * Usage:
 *   const changed = createSignal<[SettingSource]>()
 *   export const subscribe = changed.subscribe
 *   // later: changed.emit('userSettings')
 */

// Signal 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type Signal<Args extends unknown[] = []> = {
  /** Subscribe a listener. Returns an unsubscribe function. */
  // 这个回调绑定到 subscribe: (listener: (...args: Args) => void) => () => void，负责共享工具在该局部场景下的响应。
  subscribe: (listener: (...args: Args) => void) => () => void
  /** Call all subscribed listeners with the given arguments. */
  // 这个回调绑定到 emit: (...args: Args) => void，负责共享工具在该局部场景下的响应。
  emit: (...args: Args) => void
  /** Remove all listeners. Useful in dispose/reset paths. */
  // 这个回调绑定到 clear: () => void，负责共享工具在该局部场景下的响应。
  clear: () => void
}

export function createSignal<Args extends unknown[] = []>(): Signal<Args> {
  // listeners 集合封装成回调，供共享工具 signal在事件触发或异步步骤中调用。
  const listeners = new Set<(...args: Args) => void>()
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // subscribe 使用 listener 完成共享工具里的对应操作。
    subscribe(listener) {
      // 调用 listeners.add，触发共享工具此处需要的副作用。
      listeners.add(listener)
      // 返回 `() => {`，作为共享工具这次计算的结果。
      return () => {
        // 调用 listeners.delete，触发共享工具此处需要的副作用。
        listeners.delete(listener)
      }
    },
    // emit 使用 ...args 完成共享工具里的对应操作。
    emit(...args) {
      // 逐项读取 `listeners) listener(...args` 中的listener 集合，按输入顺序推进共享工具。
      for (const listener of listeners) listener(...args)
    },
    // clear 使用 无 完成共享工具里的对应操作。
    clear() {
      // 调用 listeners.clear，触发共享工具此处需要的副作用。
      listeners.clear()
    },
  }
}
