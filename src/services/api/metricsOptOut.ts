// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 复用 hasProfileScope、isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { hasProfileScope, isClaudeAISubscriber } from '../../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 getAuthHeaders、withOAuth401Retry 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getAuthHeaders, withOAuth401Retry } from '../../utils/http.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 memoizeWithTTLAsync 工具函数，把通用处理留在 ../../utils/memoize.js 中维护。
import { memoizeWithTTLAsync } from '../../utils/memoize.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../../utils/privacyLevel.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'

// MetricsEnabledResponse 固化API 服务 metrics Opt Out里传递的数据形状，帮助调用方按同一结构读写字段。
type MetricsEnabledResponse = {
  metrics_logging_enabled: boolean
}

// MetricsStatus 固化API 服务 metrics Opt Out里传递的数据形状，帮助调用方按同一结构读写字段。
type MetricsStatus = {
  enabled: boolean
  hasError: boolean
}

// In-memory TTL — dedupes calls within a single process
// CACHE_TTL_MS 缓存保存`60 * 60 * 1000`，供API 服务 metrics Opt Out后续判断或输出使用。
const CACHE_TTL_MS = 60 * 60 * 1000

// Disk TTL — org settings rarely change. When disk cache is fresher than this,
// we skip the network entirely (no background refresh). This is what collapses
// N `claude -p` invocations into ~1 API call/day.
// DISK_CACHE_TTL_MS 缓存保存`24 * 60 * 60 * 1000`，供API 服务 metrics Opt Out后续判断或输出使用。
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Internal function to call the API and check if metrics are enabled
 * This is wrapped by memoizeWithTTLAsync to add caching behavior
 */
// _fetchMetricsEnabled 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _fetchMetricsEnabled(): Promise<MetricsEnabledResponse> {
  // authResult读取`getAuthHeaders`，供API 服务 metrics Opt Out后续处理使用。
  const authResult = getAuthHeaders()
  // 满足 `authResult.error` 时，API 服务 metrics Opt Out执行该分支。
  if (authResult.error) {
    // 抛出 new Error(`Auth error: ${authResult.error}`)，阻止API 服务 metrics Opt Out在无效状态下继续运行。
    throw new Error(`Auth error: ${authResult.error}`)
  }

  // 请求头 集中保存API 服务 metrics Opt Out要一起传递的字段。
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': getClaudeCodeUserAgent(),
    ...authResult.headers,
  }

  // endpoint 命名 ``https://api.anthropic.com/api/claude_code/organizations/...`，让后续代码直接表达这个值的用途。
  const endpoint = `https://api.anthropic.com/api/claude_code/organizations/metrics_enabled`
  // 接口响应 等待 `axios.get<MetricsEnabledResponse>(endpoint, {`，确保继续执行前已有结果。
  const response = await axios.get<MetricsEnabledResponse>(endpoint, {
    headers,
    timeout: 5000,
  })
  // 返回 `response.data`，作为API 服务 metrics Opt Out这次计算的结果。
  return response.data
}

// _checkMetricsEnabledAPI 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _checkMetricsEnabledAPI(): Promise<MetricsStatus> {
  // Incident kill switch: skip the network call when nonessential traffic is disabled.
  // Returning enabled:false sheds load at the consumer (bigqueryExporter skips
  // export). Matches the non-subscriber early-return shape below.
  // 满足 `isEssentialTrafficOnly()` 时，API 服务 metrics Opt Out执行该分支。
  if (isEssentialTrafficOnly()) {
    // 返回结构化结果，集中表达API 服务 metrics Opt Out已经整理出的状态。
    return { enabled: false, hasError: false }
  }

  // 保护这一段可能失败的API 服务 metrics Opt Out操作，确保异常能进入相邻错误处理。
  try {
    // data保存`withOAuth401Retry`，供API 服务 metrics Opt Out后续处理使用。
    const data = await withOAuth401Retry(_fetchMetricsEnabled, {
      also403Revoked: true,
    })

    // 记录API 服务 metrics Opt Out运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Metrics opt-out API response: enabled=${data.metrics_logging_enabled}`,
    )

    // 返回结构化结果，集中表达API 服务 metrics Opt Out已经整理出的状态。
    return {
      enabled: data.metrics_logging_enabled,
      hasError: false,
    }
  } catch (error) {
    // 记录API 服务 metrics Opt Out运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to check metrics opt-out status: ${errorMessage(error)}`,
    )
    // 记录API 服务 metrics Opt Out运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回结构化结果，集中表达API 服务 metrics Opt Out已经整理出的状态。
    return { enabled: false, hasError: true }
  }
}

// Create memoized version with custom error handling
// memoizedCheckMetrics 集合保存`memoizeWithTTLAsync`，供API 服务 metrics Opt Out后续处理使用。
const memoizedCheckMetrics = memoizeWithTTLAsync(
  _checkMetricsEnabledAPI,
  CACHE_TTL_MS,
)

/**
 * Fetch (in-memory memoized) and persist to disk on change.
 * Errors are not persisted — a transient failure should not overwrite a
 * known-good disk value.
 */
// refreshMetricsStatus 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function refreshMetricsStatus(): Promise<MetricsStatus> {
  // 结果保存`memoizedCheckMetrics`，供API 服务 metrics Opt Out后续处理使用。
  const result = await memoizedCheckMetrics()
  // 满足 `result.hasError` 时，API 服务 metrics Opt Out执行该分支。
  if (result.hasError) {
    // 返回 `result`，作为API 服务 metrics Opt Out这次计算的结果。
    return result
  }

  // cached 缓存读取`getGlobalConfig`，供API 服务 metrics Opt Out后续处理使用。
  const cached = getGlobalConfig().metricsStatusCache
  // unchanged标记API 服务 metrics Opt Out是否启用对应路径。
  const unchanged = cached !== undefined && cached.enabled === result.enabled
  // Skip write when unchanged AND timestamp still fresh — avoids config churn
  // when concurrent callers race past a stale disk entry and all try to write.
  // 组合条件 `unchanged && Date.now() - cached.timestamp < DISK_CACHE_TTL_MS` 成立时，API 服务 metrics Opt Out才启用这条专门路径。
  if (unchanged && Date.now() - cached.timestamp < DISK_CACHE_TTL_MS) {
    // 返回 `result`，作为API 服务 metrics Opt Out这次计算的结果。
    return result
  }

  // 调用 saveGlobalConfig，触发API 服务 metrics Opt Out此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    metricsStatusCache: {
      enabled: result.enabled,
      timestamp: Date.now(),
    },
  }))
  // 返回 `result`，作为API 服务 metrics Opt Out这次计算的结果。
  return result
}

/**
 * Check if metrics are enabled for the current organization.
 *
 * Two-tier cache:
 * - Disk (24h TTL): survives process restarts. Fresh disk cache → zero network.
 * - In-memory (1h TTL): dedupes the background refresh within a process.
 *
 * The caller (bigqueryExporter) tolerates stale reads — a missed export or
 * an extra one during the 24h window is acceptable.
 */
// checkMetricsEnabled 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkMetricsEnabled(): Promise<MetricsStatus> {
  // Service key OAuth sessions lack user:profile scope → would 403.
  // API key users (non-subscribers) fall through and use x-api-key auth.
  // This check runs before the disk read so we never persist auth-state-derived
  // answers — only real API responses go to disk. Otherwise a service-key
  // session would poison the cache for a later full-OAuth session.
  // 组合条件 `isClaudeAISubscriber() && !hasProfileScope()` 成立时，API 服务 metrics Opt Out才启用这条专门路径。
  if (isClaudeAISubscriber() && !hasProfileScope()) {
    // 返回结构化结果，集中表达API 服务 metrics Opt Out已经整理出的状态。
    return { enabled: false, hasError: false }
  }

  // cached 缓存读取`getGlobalConfig`，供API 服务 metrics Opt Out后续处理使用。
  const cached = getGlobalConfig().metricsStatusCache
  // 满足 `cached` 时，API 服务 metrics Opt Out执行该分支。
  if (cached) {
    // 满足 `Date.now() - cached.timestamp > DISK_CACHE_TTL_MS` 时，API 服务 metrics Opt Out执行该分支。
    if (Date.now() - cached.timestamp > DISK_CACHE_TTL_MS) {
      // saveGlobalConfig's fallback path (config.ts:731) can throw if both
      // locked and fallback writes fail — catch here so fire-and-forget
      // doesn't become an unhandled rejection.
      // 显式忽略 `refreshMetricsStatus().catch(logError)` 的返回值，只保留它触发的副作用。
      void refreshMetricsStatus().catch(logError)
    }
    // 返回结构化结果，集中表达API 服务 metrics Opt Out已经整理出的状态。
    return {
      enabled: cached.enabled,
      hasError: false,
    }
  }

  // First-ever run on this machine: block on the network to populate disk.
  // 返回 `refreshMetricsStatus()`，作为API 服务 metrics Opt Out这次计算的结果。
  return refreshMetricsStatus()
}

// Export for testing purposes only
// _clearMetricsEnabledCacheForTesting 缓存封装成回调，供API 服务 metrics Opt Out在事件触发或异步步骤中调用。
export const _clearMetricsEnabledCacheForTesting = (): void => {
  // 调用 memoizedCheckMetrics.cache.clear，触发API 服务 metrics Opt Out此处需要的副作用。
  memoizedCheckMetrics.cache.clear()
}
