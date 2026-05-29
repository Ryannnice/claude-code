// 引入 useEffect、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useSyncExternalStore } from 'react'
// 类型依赖 { QueuedCommand } 来自 ../types/textInputTypes.js，用于校准React hook 状态流的数据契约。
import type { QueuedCommand } from '../types/textInputTypes.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getCommandQueueSnapshot,
  subscribeToCommandQueue,
} from '../utils/messageQueueManager.js'
// 类型依赖 { QueryGuard } 来自 ../utils/QueryGuard.js，用于校准React hook 状态流的数据契约。
import type { QueryGuard } from '../utils/QueryGuard.js'
// 复用 processQueueIfReady 工具函数，把通用处理留在 ../utils/queueProcessor.js 中维护。
import { processQueueIfReady } from '../utils/queueProcessor.js'

// UseQueueProcessorParams 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseQueueProcessorParams = {
  // 这个回调绑定到 executeQueuedInput: (commands: QueuedCommand[]) => Promise<void>，负责React hook 状态流在该局部场景下的响应。
  executeQueuedInput: (commands: QueuedCommand[]) => Promise<void>
  hasActiveLocalJsxUI: boolean
  queryGuard: QueryGuard
}

/**
 * Hook that processes queued commands when conditions are met.
 *
 * Uses a single unified command queue (module-level store). Priority determines
 * processing order: 'now' > 'next' (user input) > 'later' (task notifications).
 * The dequeue() function handles priority ordering automatically.
 *
 * Processing triggers when:
 * - No query active (queryGuard — reactive via useSyncExternalStore)
 * - Queue has items
 * - No active local JSX UI blocking input
 */
// useQueueProcessor 封装useQueueProcessor的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useQueueProcessor({
  executeQueuedInput,
  hasActiveLocalJsxUI,
  queryGuard,
}: UseQueueProcessorParams): void {
  // Subscribe to the query guard. Re-renders when a query starts or ends
  // (or when reserve/cancelReservation transitions dispatching state).
  // isQueryActive记录 `useSyncExternalStore` 是否成立，React hook随后按该结果分支。
  const isQueryActive = useSyncExternalStore(
    queryGuard.subscribe,
    queryGuard.getSnapshot,
  )

  // Subscribe to the unified command queue via useSyncExternalStore.
  // This guarantees re-render when the store changes, bypassing
  // React context propagation delays that cause missed notifications in Ink.
  // queueSnapshot保存`useSyncExternalStore`，供React hook后续处理使用。
  const queueSnapshot = useSyncExternalStore(
    subscribeToCommandQueue,
    getCommandQueueSnapshot,
  )

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 满足 `isQueryActive` 时，React hook执行该分支。
    if (isQueryActive) return
    // 满足 `hasActiveLocalJsxUI` 时，React hook执行该分支。
    if (hasActiveLocalJsxUI) return
    // queueSnapshot为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (queueSnapshot.length === 0) return

    // Reservation is now owned by handlePromptSubmit (inside executeUserInput's
    // try block). The sync chain executeQueuedInput → handlePromptSubmit →
    // executeUserInput → queryGuard.reserve() runs before the first real await,
    // so by the time React re-runs this effect (due to the dequeue-triggered
    // snapshot change), isQueryActive is already true (dispatching) and the
    // guard above returns early. handlePromptSubmit's finally releases the
    // reservation via cancelReservation() (no-op if onQuery already ran end()).
    // 调用 processQueueIfReady，触发React hook此处需要的副作用。
    processQueueIfReady({ executeInput: executeQueuedInput })
  }, [
    queueSnapshot,
    isQueryActive,
    executeQueuedInput,
    hasActiveLocalJsxUI,
    queryGuard,
  ])
}
