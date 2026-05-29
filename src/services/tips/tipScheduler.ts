// 复用 getSettings_DEPRECATED 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED } from '../../utils/settings/settings.js'
// 整理这一组导入，让服务层 tip Scheduler后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 引入 getSessionsSinceLastShown、recordTipShown，将 ./tipHistory.js 中已经封装好的能力接到本文件流程里。
import { getSessionsSinceLastShown, recordTipShown } from './tipHistory.js'
// 引入 getRelevantTips，将 ./tipRegistry.js 中已经封装好的能力接到本文件流程里。
import { getRelevantTips } from './tipRegistry.js'
// 类型依赖 { Tip, TipContext } 来自 ./types.js，用于校准服务层 tip Scheduler的数据契约。
import type { Tip, TipContext } from './types.js'

// selectTipWithLongestTimeSinceShown 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function selectTipWithLongestTimeSinceShown(
  availableTips: Tip[],
): Tip | undefined {
  // availableTips 集合为空时立即返回或跳过，避免服务层 tip Scheduler把空集合当成可处理内容。
  if (availableTips.length === 0) {
    // 返回 `undefined`，作为服务层 tip Scheduler这次计算的结果。
    return undefined
  }

  // 满足 `availableTips.length === 1` 时，服务层 tip Scheduler执行该分支。
  if (availableTips.length === 1) {
    // 返回 `availableTips[0]`，作为服务层 tip Scheduler这次计算的结果。
    return availableTips[0]
  }

  // Sort tips by sessions since last shown (descending) and take the first one
  // This is the tip that hasn't been shown for the longest time
  // tipsWithSessions 会话数据派生`availableTips.map`，供服务层 tip Scheduler后续处理使用。
  const tipsWithSessions = availableTips.map(tip => ({
    tip,
    sessions: getSessionsSinceLastShown(tip.id),
  }))

  // 调用 tipsWithSessions.sort，触发服务层 tip Scheduler此处需要的副作用。
  tipsWithSessions.sort((a, b) => b.sessions - a.sessions)
  // 返回 `tipsWithSessions[0]?.tip`，作为服务层 tip Scheduler这次计算的结果。
  return tipsWithSessions[0]?.tip
}

// getTipToShowOnSpinner 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTipToShowOnSpinner(
  context?: TipContext,
): Promise<Tip | undefined> {
  // Check if tips are disabled (default to true if not set)
  // 满足 `getSettings_DEPRECATED().spinnerTipsEnabled === false` 时，服务层 tip Scheduler执行该分支。
  if (getSettings_DEPRECATED().spinnerTipsEnabled === false) {
    // 返回 `undefined`，作为服务层 tip Scheduler这次计算的结果。
    return undefined
  }

  // tips 集合读取`getRelevantTips`，供服务层 tip Scheduler后续处理使用。
  const tips = await getRelevantTips(context)
  // tips 集合为空时立即返回或跳过，避免服务层 tip Scheduler把空集合当成可处理内容。
  if (tips.length === 0) {
    // 返回 `undefined`，作为服务层 tip Scheduler这次计算的结果。
    return undefined
  }

  // 返回 `selectTipWithLongestTimeSinceShown(tips)`，作为服务层 tip Scheduler这次计算的结果。
  return selectTipWithLongestTimeSinceShown(tips)
}

// recordShownTip 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordShownTip(tip: Tip): void {
  // Record in history
  // 调用 recordTipShown，触发服务层 tip Scheduler此处需要的副作用。
  recordTipShown(tip.id)

  // Log event for analytics
  // 记录服务层 tip Scheduler运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_tip_shown', {
    tipIdLength:
      tip.id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    cooldownSessions: tip.cooldownSessions,
  })
}
