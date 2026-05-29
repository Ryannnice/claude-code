// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'

/**
 * GrowthBook config for time-based microcompact.
 *
 * Triggers content-clearing microcompact when the gap since the last main-loop
 * assistant message exceeds a threshold — the server-side prompt cache has
 * almost certainly expired, so the full prefix will be rewritten anyway.
 * Clearing old tool results before the request shrinks what gets rewritten.
 *
 * Runs BEFORE the API call (in microcompactMessages, upstream of callModel)
 * so the shrunk prompt is what actually gets sent. Running after the first
 * miss would only help subsequent turns.
 *
 * Main thread only — subagents have short lifetimes where gap-based eviction
 * doesn't apply.
 */
// TimeBasedMCConfig 固化服务层 time Based MCConfig里传递的数据形状，帮助调用方按同一结构读写字段。
export type TimeBasedMCConfig = {
  /** Master switch. When false, time-based microcompact is a no-op. */
  enabled: boolean
  /** Trigger when (now − last assistant timestamp) exceeds this many minutes.
   *  60 is the safe choice: the server's 1h cache TTL is guaranteed expired
   *  for all users, so we never force a miss that wouldn't have happened. */
  gapThresholdMinutes: number
  /** Keep this many most-recent compactable tool results.
   *  When set, takes priority over any default; older results are cleared. */
  keepRecent: number
}

// TIME_BASED_MC_CONFIG_DEFAULTS 配置 集中保存服务层 time Based MCConfig要一起传递的字段。
const TIME_BASED_MC_CONFIG_DEFAULTS: TimeBasedMCConfig = {
  enabled: false,
  gapThresholdMinutes: 60,
  keepRecent: 5,
}

// getTimeBasedMCConfig 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTimeBasedMCConfig(): TimeBasedMCConfig {
  // Hoist the GB read so exposure fires on every eval path, not just when
  // the caller's other conditions (querySource, messages.length) pass.
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE<TimeBasedMCConfig>(`，作为服务层 time Based MCConfig这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE<TimeBasedMCConfig>(
    'tengu_slate_heron',
    TIME_BASED_MC_CONFIG_DEFAULTS,
  )
}
