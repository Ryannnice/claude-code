// 引入 useCallback、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useSyncExternalStore } from 'react'
// 复用 formatDuration 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatDuration } from '../utils/format.js'

/**
 * Hook that returns formatted elapsed time since startTime.
 * Uses useSyncExternalStore with interval-based updates for efficiency.
 *
 * @param startTime - Unix timestamp in ms
 * @param isRunning - Whether to actively update the timer
 * @param ms - How often should we trigger updates?
 * @param pausedMs - Total paused duration to subtract
 * @param endTime - If set, freezes the duration at this timestamp (for
 *   terminal tasks). Without this, viewing a 2-min task 30 min after
 *   completion would show "32m".
 * @returns Formatted duration string (e.g., "1m 23s")
 */
// useElapsedTime 封装useElapsedTime的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useElapsedTime(
  startTime: number,
  isRunning: boolean,
  ms: number = 1000,
  pausedMs: number = 0,
  endTime?: number,
): string {
  // get封装成回调，供React hook use Elapse...在事件触发或异步步骤中调用。
  const get = () =>
    formatDuration(Math.max(0, (endTime ?? Date.now()) - startTime - pausedMs))

  // subscribe保存`useCallback`，供React hook后续处理使用。
  const subscribe = useCallback(
    (notify: () => void) => {
      // 满足 `!isRunning) return (` 时，React hook执行该分支。
      if (!isRunning) return () => {}
      // interval保存`setInterval`，供React hook后续处理使用。
      const interval = setInterval(notify, ms)
      // 返回 `() => clearInterval(interval)`，作为React hook 状态流这次计算的结果。
      return () => clearInterval(interval)
    },
    [isRunning, ms],
  )

  // 返回 `useSyncExternalStore(subscribe, get, get)`，作为React hook 状态流这次计算的结果。
  return useSyncExternalStore(subscribe, get, get)
}
