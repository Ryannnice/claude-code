// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 getFeatureValue_DEPRECATED 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_DEPRECATED } from '../services/analytics/growthbook.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../utils/lazySchema.js 中维护。
import { lazySchema } from '../utils/lazySchema.js'
// 复用 lt 工具函数，把通用处理留在 ../utils/semver.js 中维护。
import { lt } from '../utils/semver.js'
// 引入 isEnvLessBridgeEnabled，将 ./bridgeEnabled.js 中已经封装好的能力接到本文件流程里。
import { isEnvLessBridgeEnabled } from './bridgeEnabled.js'

// EnvLessBridgeConfig 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvLessBridgeConfig = {
  // withRetry — init-phase backoff (createSession, POST /bridge, recovery /bridge)
  init_retry_max_attempts: number
  init_retry_base_delay_ms: number
  init_retry_jitter_fraction: number
  init_retry_max_delay_ms: number
  // axios timeout for POST /sessions, POST /bridge, POST /archive
  http_timeout_ms: number
  // BoundedUUIDSet ring size (echo + re-delivery dedup)
  uuid_dedup_buffer_size: number
  // CCRClient worker heartbeat cadence. Server TTL is 60s — 20s gives 3× margin.
  heartbeat_interval_ms: number
  // ±fraction of interval — per-beat jitter to spread fleet load.
  heartbeat_jitter_fraction: number
  // Fire proactive JWT refresh this long before expires_in. Larger buffer =
  // more frequent refresh (refresh cadence ≈ expires_in - buffer).
  token_refresh_buffer_ms: number
  // Archive POST timeout in teardown(). Distinct from http_timeout_ms because
  // gracefulShutdown races runCleanupFunctions() against a 2s cap — a 10s
  // axios timeout on a slow/stalled archive burns the whole budget on a
  // request that forceExit will kill anyway.
  teardown_archive_timeout_ms: number
  // Deadline for onConnect after transport.connect(). If neither onConnect
  // nor onClose fires before this, emit tengu_bridge_repl_connect_timeout
  // — the only telemetry for the ~1% of sessions that emit `started` then
  // go silent (no error, no event, just nothing).
  connect_timeout_ms: number
  // Semver floor for the env-less bridge path. Separate from the v1
  // tengu_bridge_min_version config so a v2-specific bug can force upgrades
  // without blocking v1 (env-based) clients, and vice versa.
  min_version: string
  // When true, tell users their claude.ai app may be too old to see v2
  // sessions — lets us roll the v2 bridge before the app ships the new
  // session-list query.
  should_show_app_upgrade_message: boolean
}

// DEFAULT_ENV_LESS_BRIDGE_CONFIG 配置 集中保存远程桥接 env Less Bridge Config要一起传递的字段。
export const DEFAULT_ENV_LESS_BRIDGE_CONFIG: EnvLessBridgeConfig = {
  init_retry_max_attempts: 3,
  init_retry_base_delay_ms: 500,
  init_retry_jitter_fraction: 0.25,
  init_retry_max_delay_ms: 4000,
  http_timeout_ms: 10_000,
  uuid_dedup_buffer_size: 2000,
  heartbeat_interval_ms: 20_000,
  heartbeat_jitter_fraction: 0.1,
  token_refresh_buffer_ms: 300_000,
  teardown_archive_timeout_ms: 1500,
  connect_timeout_ms: 15_000,
  min_version: '0.0.0',
  should_show_app_upgrade_message: false,
}

// Floors reject the whole object on violation (fall back to DEFAULT) rather
// than partially trusting — same defense-in-depth as pollConfig.ts.
// envLessBridgeConfigSchema 配置保存`lazySchema`，供远程桥接会话后续处理使用。
const envLessBridgeConfigSchema = lazySchema(() =>
  z.object({
    init_retry_max_attempts: z.number().int().min(1).max(10).default(3),
    init_retry_base_delay_ms: z.number().int().min(100).default(500),
    init_retry_jitter_fraction: z.number().min(0).max(1).default(0.25),
    init_retry_max_delay_ms: z.number().int().min(500).default(4000),
    http_timeout_ms: z.number().int().min(2000).default(10_000),
    uuid_dedup_buffer_size: z.number().int().min(100).max(50_000).default(2000),
    // Server TTL is 60s. Floor 5s prevents thrash; cap 30s keeps ≥2× margin.
    heartbeat_interval_ms: z
      .number()
      .int()
      .min(5000)
      .max(30_000)
      .default(20_000),
    // ±fraction per beat. Cap 0.5: at max interval (30s) × 1.5 = 45s worst case,
    // still under the 60s TTL.
    heartbeat_jitter_fraction: z.number().min(0).max(0.5).default(0.1),
    // Floor 30s prevents tight-looping. Cap 30min rejects buffer-vs-delay
    // semantic inversion: ops entering expires_in-5min (the *delay until
    // refresh*) instead of 5min (the *buffer before expiry*) yields
    // delayMs = expires_in - buffer ≈ 5min instead of ≈4h. Both are positive
    // durations so .min() alone can't distinguish; .max() catches the
    // inverted value since buffer ≥ 30min is nonsensical for a multi-hour JWT.
    token_refresh_buffer_ms: z
      .number()
      .int()
      .min(30_000)
      .max(1_800_000)
      .default(300_000),
    // Cap 2000 keeps this under gracefulShutdown's 2s cleanup race — a higher
    // timeout just lies to axios since forceExit kills the socket regardless.
    teardown_archive_timeout_ms: z
      .number()
      .int()
      .min(500)
      .max(2000)
      .default(1500),
    // Observed p99 connect is ~2-3s; 15s is ~5× headroom. Floor 5s bounds
    // false-positive rate under transient slowness; cap 60s bounds how long
    // a truly-stalled session stays dark.
    connect_timeout_ms: z.number().int().min(5_000).max(60_000).default(15_000),
    min_version: z
      .string()
      // 链式调用 refine，继续加工上一行在远程桥接会话中产生的数据。
      .refine(v => {
        // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
        try {
          // 调用 lt，触发远程桥接会话此处需要的副作用。
          lt(v, '0.0.0')
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        } catch {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
      })
      .default('0.0.0'),
    should_show_app_upgrade_message: z.boolean().default(false),
  }),
)

/**
 * Fetch the env-less bridge timing config from GrowthBook. Read once per
 * initEnvLessBridgeCore call — config is fixed for the lifetime of a bridge
 * session.
 *
 * Uses the blocking getter (not _CACHED_MAY_BE_STALE) because /remote-control
 * runs well after GrowthBook init — initializeGrowthBook() resolves instantly,
 * so there's no startup penalty, and we get the fresh in-memory remoteEval
 * value instead of the stale-on-first-read disk cache. The _DEPRECATED suffix
 * warns against startup-path usage, which this isn't.
 */
// getEnvLessBridgeConfig 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getEnvLessBridgeConfig(): Promise<EnvLessBridgeConfig> {
  // 原始文本 等待 `getFeatureValue_DEPRECATED<unknown>(`，确保继续执行前已有结果。
  const raw = await getFeatureValue_DEPRECATED<unknown>(
    'tengu_bridge_repl_v2_config',
    DEFAULT_ENV_LESS_BRIDGE_CONFIG,
  )
  // 解析结果保存`envLessBridgeConfigSchema`，供远程桥接会话后续处理使用。
  const parsed = envLessBridgeConfigSchema().safeParse(raw)
  // 返回 `parsed.success ? parsed.data : DEFAULT_ENV_LESS_BRIDGE_CONFIG`，作为远程桥接会话这次计算的结果。
  return parsed.success ? parsed.data : DEFAULT_ENV_LESS_BRIDGE_CONFIG
}

/**
 * Returns an error message if the current CLI version is below the minimum
 * required for the env-less (v2) bridge path, or null if the version is fine.
 *
 * v2 analogue of checkBridgeMinVersion() — reads from tengu_bridge_repl_v2_config
 * instead of tengu_bridge_min_version so the two implementations can enforce
 * independent floors.
 */
// checkEnvLessBridgeMinVersion 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkEnvLessBridgeMinVersion(): Promise<string | null> {
  // cfg读取`getEnvLessBridgeConfig`，供远程桥接会话后续处理使用。
  const cfg = await getEnvLessBridgeConfig()
  // 组合条件 `cfg.min_version && lt(MACRO.VERSION, cfg.min_version)` 成立时，远程桥接会话才启用这条专门路径。
  if (cfg.min_version && lt(MACRO.VERSION, cfg.min_version)) {
    // 返回 ``Your version of Claude Code (${MACRO.VERSION}) is too old for Remote C...`，作为远程桥接会话这次计算的结果。
    return `Your version of Claude Code (${MACRO.VERSION}) is too old for Remote Control.\nVersion ${cfg.min_version} or higher is required. Run \`claude update\` to update.`
  }
  // 返回 `null`，作为远程桥接会话这次计算的结果。
  return null
}

/**
 * Whether to nudge users toward upgrading their claude.ai app when a
 * Remote Control session starts. True only when the v2 bridge is active
 * AND the should_show_app_upgrade_message config bit is set — lets us
 * roll the v2 bridge before the app ships the new session-list query.
 */
// shouldShowAppUpgradeMessage 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function shouldShowAppUpgradeMessage(): Promise<boolean> {
  // 满足 `!isEnvLessBridgeEnabled()` 时，远程桥接会话执行该分支。
  if (!isEnvLessBridgeEnabled()) return false
  // cfg读取`getEnvLessBridgeConfig`，供远程桥接会话后续处理使用。
  const cfg = await getEnvLessBridgeConfig()
  // 返回 `cfg.should_show_app_upgrade_message`，作为远程桥接会话这次计算的结果。
  return cfg.should_show_app_upgrade_message
}
