// 引入 logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from './debug.js'
// 引入 gracefulShutdownSync，将 ./gracefulShutdown.js 中已经封装好的能力接到本文件流程里。
import { gracefulShutdownSync } from './gracefulShutdown.js'

/**
 * Creates an idle timeout manager for SDK mode.
 * Automatically exits the process after the specified idle duration.
 *
 * @param isIdle Function that returns true if the system is currently idle
 * @returns Object with start/stop methods to control the idle timer
 */
// createIdleTimeoutManager 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createIdleTimeoutManager(isIdle: () => boolean): {
  // 这个回调绑定到 start: () => void，负责共享工具在该局部场景下的响应。
  start: () => void
  // 这个回调绑定到 stop: () => void，负责共享工具在该局部场景下的响应。
  stop: () => void
} {
  // Parse CLAUDE_CODE_EXIT_AFTER_STOP_DELAY environment variable
  // exitAfterStopDelay 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const exitAfterStopDelay = process.env.CLAUDE_CODE_EXIT_AFTER_STOP_DELAY
  // delayMs 集合解析`parseInt`，供共享工具后续处理使用。
  const delayMs = exitAfterStopDelay ? parseInt(exitAfterStopDelay, 10) : null
  // isValidDelay记录 `isNaN` 是否成立，共享工具随后按该结果分支。
  const isValidDelay = delayMs && !isNaN(delayMs) && delayMs > 0

  // timer 命名 `null`，让后续代码直接表达这个值的用途。
  let timer: NodeJS.Timeout | null = null
  // lastIdleTime保存`0`，供共享工具 idle Timeout后续判断或输出使用。
  let lastIdleTime = 0

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // start 使用 无 完成共享工具里的对应操作。
    start() {
      // Clear any existing timer
      // 满足 `timer` 时，共享工具执行该分支。
      if (timer) {
        // 调用 clearTimeout，触发共享工具此处需要的副作用。
        clearTimeout(timer)
        // timer更新为 `null`，确保共享工具后续读取最新状态。
        timer = null
      }

      // Only start timer if delay is configured and valid
      // 满足 `isValidDelay` 时，共享工具执行该分支。
      if (isValidDelay) {
        // lastIdleTime更新为 `Date.now()`，确保共享工具后续读取最新状态。
        lastIdleTime = Date.now()

        // timer更新为 `setTimeout(() => {`，确保共享工具后续读取最新状态。
        timer = setTimeout(() => {
          // Check if we've been continuously idle for the full duration
          // idleDuration记录时间`Date.now`，供共享工具后续处理使用。
          const idleDuration = Date.now() - lastIdleTime
          // 只有 `isIdle() && idleDuration >= delayMs` 满足时，共享工具才执行该分支。
          if (isIdle() && idleDuration >= delayMs) {
            // 记录共享工具运行诊断，方便排查异常路径或性能问题。
            logForDebugging(`Exiting after ${delayMs}ms of idle time`)
            // 调用 gracefulShutdownSync，触发共享工具此处需要的副作用。
            gracefulShutdownSync()
          }
        }, delayMs)
      }
    },

    // stop 使用 无 完成共享工具里的对应操作。
    stop() {
      // 满足 `timer` 时，共享工具执行该分支。
      if (timer) {
        // 调用 clearTimeout，触发共享工具此处需要的副作用。
        clearTimeout(timer)
        // timer更新为 `null`，确保共享工具后续读取最新状态。
        timer = null
      }
    },
  }
}
