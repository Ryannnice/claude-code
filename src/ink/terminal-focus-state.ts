// Terminal focus state signal — non-React access to DECSET 1004 focus events.
// 'unknown' is the default for terminals that don't support focus reporting;
// consumers treat 'unknown' identically to 'focused' (no throttling).
// Subscribers are notified synchronously when focus changes, used by
// TerminalFocusProvider to avoid polling.
// TerminalFocusState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalFocusState = 'focused' | 'blurred' | 'unknown'

// focusState 状态固定为 `'unknown'`，作为Ink 渲染层 terminal focus state后续展示或比较的基准。
let focusState: TerminalFocusState = 'unknown'
// 这个回调绑定到 const resolvers: Set<() => void> = new Set()，负责终端渲染在该局部场景下的响应。
const resolvers: Set<() => void> = new Set()
// 这个回调绑定到 const subscribers: Set<() => void> = new Set()，负责终端渲染在该局部场景下的响应。
const subscribers: Set<() => void> = new Set()

// setTerminalFocused 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setTerminalFocused(v: boolean): void {
  // focusState 状态更新为 `v ? 'focused' : 'blurred'`，确保Ink 渲染层后续读取最新状态。
  focusState = v ? 'focused' : 'blurred'
  // Notify useSyncExternalStore subscribers
  // 按顺序遍历 `subscribers` 中的cb，逐个交给终端渲染处理。
  for (const cb of subscribers) {
    // 调用 cb，触发终端渲染此处需要的副作用。
    cb()
  }
  // v缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!v) {
    // 按顺序遍历 `resolvers` 中的resolve，逐个交给终端渲染处理。
    for (const resolve of resolvers) {
      // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
      resolve()
    }
    // resolvers.clear 结算当前 Promise，唤醒等待这个异步结果的调用方。
    resolvers.clear()
  }
}

// getTerminalFocused 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalFocused(): boolean {
  // 返回 `focusState !== 'blurred'`，作为终端渲染这次计算的结果。
  return focusState !== 'blurred'
}

// getTerminalFocusState 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTerminalFocusState(): TerminalFocusState {
  // 返回 `focusState`，作为终端渲染这次计算的结果。
  return focusState
}

// For useSyncExternalStore
// subscribeTerminalFocus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function subscribeTerminalFocus(cb: () => void): () => void {
  // 调用 subscribers.add，触发终端渲染此处需要的副作用。
  subscribers.add(cb)
  // 返回 `() => {`，作为终端渲染这次计算的结果。
  return () => {
    // 调用 subscribers.delete，触发终端渲染此处需要的副作用。
    subscribers.delete(cb)
  }
}

// resetTerminalFocusState 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetTerminalFocusState(): void {
  // focusState 状态更新为 `'unknown'`，确保Ink 渲染层后续读取最新状态。
  focusState = 'unknown'
  // 按顺序遍历 `subscribers` 中的cb，逐个交给终端渲染处理。
  for (const cb of subscribers) {
    // 调用 cb，触发终端渲染此处需要的副作用。
    cb()
  }
}
