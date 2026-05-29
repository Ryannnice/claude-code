// 引入 useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useSyncExternalStore } from 'react'
// 类型依赖 { QueuedCommand } 来自 ../types/textInputTypes.js，用于校准React hook 状态流的数据契约。
import type { QueuedCommand } from '../types/textInputTypes.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getCommandQueueSnapshot,
  subscribeToCommandQueue,
} from '../utils/messageQueueManager.js'

/**
 * React hook to subscribe to the unified command queue.
 * Returns a frozen array that only changes reference on mutation.
 * Components re-render only when the queue changes.
 */
// useCommandQueue 封装useCommandQueue的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useCommandQueue(): readonly QueuedCommand[] {
  // 返回 `useSyncExternalStore(subscribeToCommandQueue, getCommandQueueSnapshot)`，作为React hook 状态流这次计算的结果。
  return useSyncExternalStore(subscribeToCommandQueue, getCommandQueueSnapshot)
}
