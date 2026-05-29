// 引入 useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useSyncExternalStore } from 'react'
// 引入 compactWarningStore，将 ./compactWarningState.js 中已经封装好的能力接到本文件流程里。
import { compactWarningStore } from './compactWarningState.js'

/**
 * React hook to subscribe to compact warning suppression state.
 *
 * Lives in its own file so that compactWarningState.ts stays React-free:
 * microCompact.ts imports the pure state functions, and pulling React into
 * that module graph would drag it into the print-mode startup path.
 */
// useCompactWarningSuppression 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useCompactWarningSuppression(): boolean {
  // 返回 `useSyncExternalStore(`，作为服务层 compact Warning Hook这次计算的结果。
  return useSyncExternalStore(
    compactWarningStore.subscribe,
    compactWarningStore.getState,
  )
}
