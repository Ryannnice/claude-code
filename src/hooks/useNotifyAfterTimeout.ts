// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getLastInteractionTime,
  updateLastInteractionTime,
} from '../bootstrap/state.js'
// 复用 useTerminalNotification 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTerminalNotification } from '../ink/useTerminalNotification.js'
// 接入 sendNotification 服务层能力，把外部通信或共享状态交给 ../services/notifier.js 处理。
import { sendNotification } from '../services/notifier.js'
// The time threshold in milliseconds for considering an interaction "recent" (6 seconds)
// DEFAULT_INTERACTION_THRESHOLD_MS 集合 命名 `6000`，让后续代码直接表达这个值的用途。
export const DEFAULT_INTERACTION_THRESHOLD_MS = 6000

// getTimeSinceLastInteraction 封装useNotifyAfterTimeout的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTimeSinceLastInteraction(): number {
  // 返回 `Date.now() - getLastInteractionTime()`，作为React hook 状态流这次计算的结果。
  return Date.now() - getLastInteractionTime()
}

// hasRecentInteraction 封装useNotifyAfterTimeout的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasRecentInteraction(threshold: number): boolean {
  // 返回 `getTimeSinceLastInteraction() < threshold`，作为React hook 状态流这次计算的结果。
  return getTimeSinceLastInteraction() < threshold
}

// shouldNotify 封装useNotifyAfterTimeout的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldNotify(threshold: number): boolean {
  // 返回 `process.env.NODE_ENV !== 'test' && !hasRecentInteraction(threshold)`，作为React hook 状态流这次计算的结果。
  return process.env.NODE_ENV !== 'test' && !hasRecentInteraction(threshold)
}

// NOTE: User interaction tracking is now done in App.tsx's processKeysInBatch
// function, which calls updateLastInteractionTime() when any input is received.
// This avoids having a separate stdin 'data' listener that would compete with
// the main 'readable' listener and cause dropped input characters.

/**
 * Hook that manages desktop notifications after a timeout period.
 *
 * Shows a notification in two cases:
 * 1. Immediately if the app has been idle for longer than the threshold
 * 2. After the specified timeout if the user doesn't interact within that time
 *
 * @param message - The notification message to display
 * @param timeout - The timeout in milliseconds (defaults to 6000ms)
 */
// useNotifyAfterTimeout 封装useNotifyAfterTimeout的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useNotifyAfterTimeout(
  message: string,
  notificationType: string,
): void {
  // terminal保存`useTerminalNotification`，供React hook后续处理使用。
  const terminal = useTerminalNotification()

  // Reset interaction time when hook is called to make sure that requests
  // that took a long time to complete don't pop up a notification right away.
  // Must be immediate because useEffect runs after Ink's render cycle has
  // already flushed; without it the timestamp stays stale and a premature
  // notification fires if the user is idle (no subsequent renders to flush).
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 调用 updateLastInteractionTime，触发React hook此处需要的副作用。
    updateLastInteractionTime(true)
  }, [])

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // hasNotified标记React hook use Notify...是否启用对应路径。
    let hasNotified = false
    // timer保存`setInterval`，供React hook后续处理使用。
    const timer = setInterval(() => {
      // 组合条件 `shouldNotify(DEFAULT_INTERACTION_THRESHOLD_MS) && !hasNotified` 成立时，React hook 状态流才启用这条专门路径。
      if (shouldNotify(DEFAULT_INTERACTION_THRESHOLD_MS) && !hasNotified) {
        // hasNotified更新为 `true`，确保useNotifyAfterTimeout后续读取最新状态。
        hasNotified = true
        // 调用 clearInterval，触发React hook此处需要的副作用。
        clearInterval(timer)
        // 显式忽略 `sendNotification({ message, notificationType }, terminal)` 的返回值，只保留它触发的副作用。
        void sendNotification({ message, notificationType }, terminal)
      }
    }, DEFAULT_INTERACTION_THRESHOLD_MS)

    // 返回 `() => clearInterval(timer)`，作为React hook 状态流这次计算的结果。
    return () => clearInterval(timer)
  }, [message, notificationType, terminal])
}
