// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 getFeatureValue_CACHED_WITH_REFRESH 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_WITH_REFRESH } from '../services/analytics/growthbook.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_POLL_CONFIG,
  type PollIntervalConfig,
} from './pollConfigDefaults.js'

// .min(100) on the seek-work intervals restores the old Math.max(..., 100)
// defense-in-depth floor against fat-fingered GrowthBook values. Unlike a
// clamp, Zod rejects the whole object on violation — a config with one bad
// field falls back to DEFAULT_POLL_CONFIG entirely rather than being
// partially trusted.
//
// The at_capacity intervals use a 0-or-≥100 refinement: 0 means "disabled"
// (heartbeat-only mode), ≥100 is the fat-finger floor. Values 1–99 are
// rejected so unit confusion (ops thinks seconds, enters 10) doesn't poll
// every 10ms against the VerifyEnvironmentSecretAuth DB path.
//
// The object-level refines require at least one at-capacity liveness
// mechanism enabled: heartbeat OR the relevant poll interval. Without this,
// the hb=0, atCapMs=0 drift config (ops disables heartbeat without
// restoring at_capacity) falls through every throttle site with no sleep —
// tight-looping /poll at HTTP-round-trip speed.
// zeroOrAtLeast100 集中保存远程桥接会话远程桥接 poll Config要一起传递的字段。
const zeroOrAtLeast100 = {
  message: 'must be 0 (disabled) or ≥100ms',
}
// pollIntervalConfigSchema 配置保存`lazySchema`，供远程桥接会话后续处理使用。
const pollIntervalConfigSchema = lazySchema(() =>
  z
    .object({
      poll_interval_ms_not_at_capacity: z.number().int().min(100),
      // 0 = no at-capacity polling. Independent of heartbeat — both can be
      // enabled (heartbeat runs, periodically breaks out to poll).
      poll_interval_ms_at_capacity: z
        .number()
        .int()
        // 链式调用 refine，继续加工上一行在远程桥接会话中产生的数据。
        .refine(v => v === 0 || v >= 100, zeroOrAtLeast100),
      // 0 = disabled; positive value = heartbeat at this interval while at
      // capacity. Runs alongside at-capacity polling, not instead of it.
      // Named non_exclusive to distinguish from the old heartbeat_interval_ms
      // (either-or semantics in pre-#22145 clients). .default(0) so existing
      // GrowthBook configs without this field parse successfully.
      non_exclusive_heartbeat_interval_ms: z.number().int().min(0).default(0),
      // Multisession (bridgeMain.ts) intervals. Defaults match the
      // single-session values so existing configs without these fields
      // preserve current behavior.
      multisession_poll_interval_ms_not_at_capacity: z
        .number()
        .int()
        .min(100)
        .default(
          DEFAULT_POLL_CONFIG.multisession_poll_interval_ms_not_at_capacity,
        ),
      multisession_poll_interval_ms_partial_capacity: z
        .number()
        .int()
        .min(100)
        .default(
          DEFAULT_POLL_CONFIG.multisession_poll_interval_ms_partial_capacity,
        ),
      multisession_poll_interval_ms_at_capacity: z
        .number()
        .int()
        // 链式调用 refine，继续加工上一行在远程桥接会话中产生的数据。
        .refine(v => v === 0 || v >= 100, zeroOrAtLeast100)
        .default(DEFAULT_POLL_CONFIG.multisession_poll_interval_ms_at_capacity),
      // .min(1) matches the server's ge=1 constraint (work_v1.py:230).
      reclaim_older_than_ms: z.number().int().min(1).default(5000),
      session_keepalive_interval_v2_ms: z
        .number()
        .int()
        .min(0)
        .default(120_000),
    })
    .refine(
      // cfg更新为 `>`，确保Bridge 通信后续读取最新状态。
      cfg =>
        cfg.non_exclusive_heartbeat_interval_ms > 0 ||
        cfg.poll_interval_ms_at_capacity > 0,
      {
        message:
          'at-capacity liveness requires non_exclusive_heartbeat_interval_ms > 0 or poll_interval_ms_at_capacity > 0',
      },
    )
    .refine(
      // cfg更新为 `>`，确保Bridge 通信后续读取最新状态。
      cfg =>
        cfg.non_exclusive_heartbeat_interval_ms > 0 ||
        cfg.multisession_poll_interval_ms_at_capacity > 0,
      {
        message:
          'at-capacity liveness requires non_exclusive_heartbeat_interval_ms > 0 or multisession_poll_interval_ms_at_capacity > 0',
      },
    ),
)

/**
 * Fetch the bridge poll interval config from GrowthBook with a 5-minute
 * refresh window. Validates the served JSON against the schema; falls back
 * to defaults if the flag is absent, malformed, or partially-specified.
 *
 * Shared by bridgeMain.ts (standalone) and replBridge.ts (REPL) so ops
 * can tune both poll rates fleet-wide with a single config push.
 */
// getPollIntervalConfig 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPollIntervalConfig(): PollIntervalConfig {
  // 原始文本 命名 `getFeatureValue_CACHED_WITH_REFRESH<unknown>(`，让后续代码直接表达这个值的用途。
  const raw = getFeatureValue_CACHED_WITH_REFRESH<unknown>(
    'tengu_bridge_poll_interval_config',
    DEFAULT_POLL_CONFIG,
    5 * 60 * 1000,
  )
  // 解析结果保存`pollIntervalConfigSchema`，供远程桥接会话后续处理使用。
  const parsed = pollIntervalConfigSchema().safeParse(raw)
  // 返回 `parsed.success ? parsed.data : DEFAULT_POLL_CONFIG`，作为远程桥接会话这次计算的结果。
  return parsed.success ? parsed.data : DEFAULT_POLL_CONFIG
}
