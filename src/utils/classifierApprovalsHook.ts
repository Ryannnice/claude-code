/**
 * React hook for classifierApprovals store.
 * Split from classifierApprovals.ts so pure-state importers (permissions.ts,
 * toolExecution.ts, postCompactCleanup.ts) do not pull React into print.ts.
 */

// 引入 useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useSyncExternalStore } from 'react'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isClassifierChecking,
  subscribeClassifierChecking,
} from './classifierApprovals.js'

// useIsClassifierChecking 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIsClassifierChecking(toolUseID: string): boolean {
  // 返回 `useSyncExternalStore(subscribeClassifierChecking, () =>`，作为共享工具这次计算的结果。
  return useSyncExternalStore(subscribeClassifierChecking, () =>
    isClassifierChecking(toolUseID),
  )
}
