// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'

/**
 * Runtime gate for /ultrareview. GB config's `enabled` field controls
 * visibility — isEnabled() on the command filters it from getCommands()
 * when false, so ungated users don't see the command at all.
 */
// isUltrareviewEnabled 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isUltrareviewEnabled(): boolean {
  // cfg读取`getFeatureValue_CACHED_MAY_BE_STALE<Record<`，供后续判断或组装使用。
  const cfg = getFeatureValue_CACHED_MAY_BE_STALE<Record<
    string,
    unknown
  > | null>('tengu_review_bughunter_config', null)
  // 返回 `cfg?.enabled === true`，作为命令处理这次计算的结果。
  return cfg?.enabled === true
}
