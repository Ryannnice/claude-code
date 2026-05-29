// GrowthBook-backed cron jitter configuration.
//
// Separated from cronScheduler.ts so the scheduler can be bundled in the
// Agent SDK public build without pulling in analytics/growthbook.ts and
// its large transitive dependency set (settings/hooks/config cycle).
//
// Usage:
//   REPL (useScheduledTasks.ts): pass `getJitterConfig: getCronJitterConfig`
//   Daemon/SDK: omit getJitterConfig → DEFAULT_CRON_JITTER_CONFIG applies.

// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 getFeatureValue_CACHED_WITH_REFRESH 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_WITH_REFRESH } from '../services/analytics/growthbook.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type CronJitterConfig,
  DEFAULT_CRON_JITTER_CONFIG,
} from './cronTasks.js'
// 引入 lazySchema，将 ./lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from './lazySchema.js'

// How often to re-fetch tengu_kairos_cron_config from GrowthBook. Short because
// this is an incident lever — when we push a config change to shed :00 load,
// we want the fleet to converge within a minute, not on the next process
// restart. The underlying call is a synchronous cache read; the refresh just
// clears the memoized entry so the next read triggers a background fetch.
// JITTER_CONFIG_REFRESH_MS 配置保存`60 * 1000`，供共享工具 cron Jitter Config后续判断或输出使用。
const JITTER_CONFIG_REFRESH_MS = 60 * 1000

// Upper bounds here are defense-in-depth against fat-fingered GrowthBook
// pushes. Like pollConfig.ts, Zod rejects the whole object on any violation
// rather than partially trusting it — a config with one bad field falls back
// to DEFAULT_CRON_JITTER_CONFIG entirely. oneShotFloorMs shares oneShotMaxMs's
// ceiling (floor > max would invert the jitter range) and is cross-checked in
// the refine; the shared ceiling keeps the individual bound explicit in the
// error path. recurringMaxAgeMs uses .default() so a pre-existing GB config
// without the field doesn't get wholesale-rejected — the other fields were
// added together at config inception and don't need this.
// HALF_HOUR_MS 集合 命名 `30 * 60 * 1000`，让后续代码直接表达这个值的用途。
const HALF_HOUR_MS = 30 * 60 * 1000
// THIRTY_DAYS_MS 集合保存`30 * 24 * 60 * 60 * 1000`，供共享工具 cron Jitter Config后续判断或输出使用。
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
// cronJitterConfigSchema 配置保存`lazySchema`，供共享工具后续处理使用。
const cronJitterConfigSchema = lazySchema(() =>
  z
    .object({
      recurringFrac: z.number().min(0).max(1),
      recurringCapMs: z.number().int().min(0).max(HALF_HOUR_MS),
      oneShotMaxMs: z.number().int().min(0).max(HALF_HOUR_MS),
      oneShotFloorMs: z.number().int().min(0).max(HALF_HOUR_MS),
      oneShotMinuteMod: z.number().int().min(1).max(60),
      recurringMaxAgeMs: z
        .number()
        .int()
        .min(0)
        .max(THIRTY_DAYS_MS)
        .default(DEFAULT_CRON_JITTER_CONFIG.recurringMaxAgeMs),
    })
    // 链式调用 refine，继续加工上一行在共享工具中产生的数据。
    .refine(c => c.oneShotFloorMs <= c.oneShotMaxMs),
)

/**
 * Read `tengu_kairos_cron_config` from GrowthBook, validate, fall back to
 * defaults on absent/malformed/out-of-bounds config. Called from check()
 * every tick via the `getJitterConfig` callback — cheap (synchronous cache
 * hit). Refresh window: JITTER_CONFIG_REFRESH_MS.
 *
 * Exported so ops runbooks can point at a single function when documenting
 * the lever, and so tests can spy on it without mocking GrowthBook itself.
 *
 * Pass this as `getJitterConfig` when calling createCronScheduler in REPL
 * contexts. Daemon/SDK callers omit getJitterConfig and get defaults.
 */
// getCronJitterConfig 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCronJitterConfig(): CronJitterConfig {
  // 原始文本 命名 `getFeatureValue_CACHED_WITH_REFRESH<unknown>(`，让后续代码直接表达这个值的用途。
  const raw = getFeatureValue_CACHED_WITH_REFRESH<unknown>(
    'tengu_kairos_cron_config',
    DEFAULT_CRON_JITTER_CONFIG,
    JITTER_CONFIG_REFRESH_MS,
  )
  // 解析结果保存`cronJitterConfigSchema`，供共享工具后续处理使用。
  const parsed = cronJitterConfigSchema().safeParse(raw)
  // 返回 `parsed.success ? parsed.data : DEFAULT_CRON_JITTER_CONFIG`，作为共享工具这次计算的结果。
  return parsed.success ? parsed.data : DEFAULT_CRON_JITTER_CONFIG
}
