// Listener 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
type Listener = () => void
type OnChange<T> = (args: { newState: T; oldState: T }) => void

export type Store<T> = {
  // 这个回调绑定到 getState: () => T，负责应用状态管理在该局部场景下的响应。
  getState: () => T
  // 这个回调绑定到 setState: (updater: (prev: T) => T) => void，负责应用状态管理在该局部场景下的响应。
  setState: (updater: (prev: T) => T) => void
  // 这个回调绑定到 subscribe: (listener: Listener) => () => void，负责应用状态管理在该局部场景下的响应。
  subscribe: (listener: Listener) => () => void
}

export function createStore<T>(
  initialState: T,
  onChange?: OnChange<T>,
): Store<T> {
  // 状态保存`initialState`，供应用状态管理状态管理 store后续判断或输出使用。
  let state = initialState
  // listeners 集合 命名 `new Set<Listener>()`，让后续代码直接表达这个值的用途。
  const listeners = new Set<Listener>()

  // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
  return {
    // 这个回调绑定到 getState: () => state,，负责应用状态管理在该局部场景下的响应。
    getState: () => state,

    // 这个回调绑定到 setState: (updater: (prev: T) => T) => {，负责应用状态管理在该局部场景下的响应。
    setState: (updater: (prev: T) => T) => {
      // prev保存`state`，供应用状态管理状态管理 store后续判断或输出使用。
      const prev = state
      // next保存`updater`，供应用状态管理后续处理使用。
      const next = updater(prev)
      // 满足 `Object.is(next, prev)` 时，应用状态管理执行该分支。
      if (Object.is(next, prev)) return
      // 状态更新为 `next`，确保store后续读取最新状态。
      state = next
      // 调用 onChange?.({ newState: next, oldState: prev })，完成这一处局部操作。
      onChange?.({ newState: next, oldState: prev })
      // 逐项读取 `listeners) listener(` 中的listener 集合，按输入顺序推进应用状态管理。
      for (const listener of listeners) listener()
    },

    // 这个回调绑定到 subscribe: (listener: Listener) => {，负责应用状态管理在该局部场景下的响应。
    subscribe: (listener: Listener) => {
      // 调用 listeners.add，触发应用状态管理此处需要的副作用。
      listeners.add(listener)
      // 返回 `() => listeners.delete(listener)`，作为应用状态管理这次计算的结果。
      return () => listeners.delete(listener)
    },
  }
}
