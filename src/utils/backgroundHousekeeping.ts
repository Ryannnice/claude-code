// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 initAutoDream 服务层能力，把外部通信或共享状态交给 ../services/autoDream/autoDream.js 处理。
import { initAutoDream } from '../services/autoDream/autoDream.js'
// 接入 initMagicDocs 服务层能力，把外部通信或共享状态交给 ../services/MagicDocs/magicDocs.js 处理。
import { initMagicDocs } from '../services/MagicDocs/magicDocs.js'
// 引入 initSkillImprovement，将 ./hooks/skillImprovement.js 中已经封装好的能力接到本文件流程里。
import { initSkillImprovement } from './hooks/skillImprovement.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// extractMemoriesModule保存`feature`，供共享工具后续处理使用。
const extractMemoriesModule = feature('EXTRACT_MEMORIES')
  ? (require('../services/extractMemories/extractMemories.js') as typeof import('../services/extractMemories/extractMemories.js'))
  : null
// registerProtocolModule保存`feature`，供共享工具后续处理使用。
const registerProtocolModule = feature('LODESTONE')
  ? (require('./deepLink/registerProtocol.js') as typeof import('./deepLink/registerProtocol.js'))
  : null

/* eslint-enable @typescript-eslint/no-require-imports */

// 引入 getIsInteractive、getLastInteractionTime，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsInteractive, getLastInteractionTime } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  cleanupNpmCacheForAnthropicPackages,
  cleanupOldMessageFilesInBackground,
  cleanupOldVersionsThrottled,
} from './cleanup.js'
// 引入 cleanupOldVersions，将 ./nativeInstaller/index.js 中已经封装好的能力接到本文件流程里。
import { cleanupOldVersions } from './nativeInstaller/index.js'
// 引入 autoUpdateMarketplacesAndPluginsInBackground，将 ./plugins/pluginAutoupdate.js 中已经封装好的能力接到本文件流程里。
import { autoUpdateMarketplacesAndPluginsInBackground } from './plugins/pluginAutoupdate.js'

// 24 hours in milliseconds
// RECURRING_CLEANUP_INTERVAL_MS 集合 命名 `24 * 60 * 60 * 1000`，让后续代码直接表达这个值的用途。
const RECURRING_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

// 10 minutes after start.
// DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION 会话数据 命名 `10 * 60 * 1000`，让后续代码直接表达这个值的用途。
const DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION = 10 * 60 * 1000

// startBackgroundHousekeeping 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startBackgroundHousekeeping(): void {
  // 显式忽略 `initMagicDocs()` 的返回值，只保留它触发的副作用。
  void initMagicDocs()
  // 显式忽略 `initSkillImprovement()` 的返回值，只保留它触发的副作用。
  void initSkillImprovement()
  // 满足 `feature('EXTRACT_MEMORIES')` 时，共享工具执行该分支。
  if (feature('EXTRACT_MEMORIES')) {
    // 共享工具 background Housekeeping在这里处理 `extractMemoriesModule!.initExtractMemories()`，完成这一小步状态转换。
    extractMemoriesModule!.initExtractMemories()
  }
  // 调用 initAutoDream，触发共享工具此处需要的副作用。
  initAutoDream()
  // 显式忽略 `autoUpdateMarketplacesAndPluginsInBackground()` 的返回值，只保留它触发的副作用。
  void autoUpdateMarketplacesAndPluginsInBackground()
  // 只有 `feature('LODESTONE') && getIsInteractive()` 满足时，共享工具才执行该分支。
  if (feature('LODESTONE') && getIsInteractive()) {
    // 显式忽略 `registerProtocolModule!.ensureDeepLinkProtocolRegistered()` 的返回值，只保留它触发的副作用。
    void registerProtocolModule!.ensureDeepLinkProtocolRegistered()
  }

  // needsCleanup标记共享工具 background Housekeeping是否启用对应路径。
  let needsCleanup = true
  // runVerySlowOps 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function runVerySlowOps(): Promise<void> {
    // If the user did something in the last minute, don't make them wait for these slow operations to run.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      getIsInteractive() &&
      getLastInteractionTime() > Date.now() - 1000 * 60
    ) {
      // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
      setTimeout(
        runVerySlowOps,
        DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION,
      ).unref()
      // 共享工具 background Housekeeping在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 满足 `needsCleanup` 时，共享工具执行该分支。
    if (needsCleanup) {
      // needsCleanup更新为 `false`，确保共享工具后续读取最新状态。
      needsCleanup = false
      // 等待 `cleanupOldMessageFilesInBackground()` 完成，再继续共享工具 background Housekeeping的异步流程。
      await cleanupOldMessageFilesInBackground()
    }

    // If the user did something in the last minute, don't make them wait for these slow operations to run.
    // 共享工具在这里按实际状态进入对应分支。
    if (
      getIsInteractive() &&
      getLastInteractionTime() > Date.now() - 1000 * 60
    ) {
      // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
      setTimeout(
        runVerySlowOps,
        DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION,
      ).unref()
      // 共享工具 background Housekeeping在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 等待 `cleanupOldVersions()` 完成，再继续共享工具 background Housekeeping的异步流程。
    await cleanupOldVersions()
  }

  // setTimeout 写入新的状态值，使共享工具后续读取保持一致。
  setTimeout(
    runVerySlowOps,
    DELAY_VERY_SLOW_OPERATIONS_THAT_HAPPEN_EVERY_SESSION,
  ).unref()

  // For long-running sessions, schedule recurring cleanup every 24 hours.
  // Both cleanup functions use marker files and locks to throttle to once per day
  // and skip immediately if another process holds the lock.
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // interval保存`setInterval`，供共享工具后续处理使用。
    const interval = setInterval(() => {
      // 显式忽略 `cleanupNpmCacheForAnthropicPackages()` 的返回值，只保留它触发的副作用。
      void cleanupNpmCacheForAnthropicPackages()
      // 显式忽略 `cleanupOldVersionsThrottled()` 的返回值，只保留它触发的副作用。
      void cleanupOldVersionsThrottled()
    }, RECURRING_CLEANUP_INTERVAL_MS)

    // Don't let this interval keep the process alive
    // 调用 interval.unref，触发共享工具此处需要的副作用。
    interval.unref()
  }
}
