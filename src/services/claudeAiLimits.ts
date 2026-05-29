// 引入 APIError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIError } from '@anthropic-ai/sdk'
// 类型依赖 { MessageParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准服务层 claude Ai Limits的数据契约。
import type { MessageParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 引入 isEqual，将 lodash-es/isEqual.js 中已经封装好的能力接到本文件流程里。
import isEqual from 'lodash-es/isEqual.js'
// 引入 getIsNonInteractiveSession，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../utils/auth.js'
// 复用 getModelBetas 工具函数，把通用处理留在 ../utils/betas.js 中维护。
import { getModelBetas } from '../utils/betas.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 logError 工具函数，把通用处理留在 ../utils/log.js 中维护。
import { logError } from '../utils/log.js'
// 复用 getSmallFastModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { getSmallFastModel } from '../utils/model/model.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../utils/privacyLevel.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ./analytics/index.js，用于校准服务层 claude Ai Limits的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from './analytics/index.js'
// 引入 logEvent，将 ./analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from './analytics/index.js'
// 引入 getAPIMetadata，将 ./api/claude.js 中已经封装好的能力接到本文件流程里。
import { getAPIMetadata } from './api/claude.js'
// 引入 getAnthropicClient，将 ./api/client.js 中已经封装好的能力接到本文件流程里。
import { getAnthropicClient } from './api/client.js'
// 整理这一组导入，让服务层 claude Ai Limits后续逻辑可以直接复用这些外部能力。
import {
  processRateLimitHeaders,
  shouldProcessRateLimits,
} from './rateLimitMocking.js'

// Re-export message functions from centralized location
// 重新导出这一组成员，让服务层 claude Ai Limits的公共 API 保持集中入口。
export {
  getRateLimitErrorMessage,
  getRateLimitWarning,
  getUsingOverageText,
} from './rateLimitMessages.js'

// QuotaStatus 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type QuotaStatus = 'allowed' | 'allowed_warning' | 'rejected'

// RateLimitType 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type RateLimitType =
  | 'five_hour'
  | 'seven_day'
  | 'seven_day_opus'
  | 'seven_day_sonnet'
  | 'overage'

// 导出类型定义，让其他模块沿用服务层 claude Ai Limits的数据契约。
export type { RateLimitType }

// EarlyWarningThreshold 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type EarlyWarningThreshold = {
  utilization: number // 0-1 scale: trigger warning when usage >= this
  timePct: number // 0-1 scale: trigger warning when time elapsed <= this
}

// EarlyWarningConfig 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type EarlyWarningConfig = {
  rateLimitType: RateLimitType
  claimAbbrev: '5h' | '7d'
  windowSeconds: number
  thresholds: EarlyWarningThreshold[]
}

// Early warning configurations in priority order (checked first to last)
// Used as fallback when server doesn't send surpassed-threshold header
// Warns users when they're consuming quota faster than the time window allows
// EARLY_WARNING_CONFIGS 配置 聚合成有序列表，保持后续遍历顺序稳定。
const EARLY_WARNING_CONFIGS: EarlyWarningConfig[] = [
  {
    rateLimitType: 'five_hour',
    claimAbbrev: '5h',
    windowSeconds: 5 * 60 * 60,
    thresholds: [{ utilization: 0.9, timePct: 0.72 }],
  },
  {
    rateLimitType: 'seven_day',
    claimAbbrev: '7d',
    windowSeconds: 7 * 24 * 60 * 60,
    thresholds: [
      { utilization: 0.75, timePct: 0.6 },
      { utilization: 0.5, timePct: 0.35 },
      { utilization: 0.25, timePct: 0.15 },
    ],
  },
]

// Maps claim abbreviations to rate limit types for header-based detection
// EARLY_WARNING_CLAIM_MAP 警告信息 集中保存服务层 claude Ai Limits要一起传递的字段。
const EARLY_WARNING_CLAIM_MAP: Record<string, RateLimitType> = {
  '5h': 'five_hour',
  '7d': 'seven_day',
  overage: 'overage',
}

// RATE_LIMIT_DISPLAY_NAMES 集合 集中保存服务层 claude Ai Limits要一起传递的字段。
const RATE_LIMIT_DISPLAY_NAMES: Record<RateLimitType, string> = {
  five_hour: 'session limit',
  seven_day: 'weekly limit',
  seven_day_opus: 'Opus limit',
  seven_day_sonnet: 'Sonnet limit',
  overage: 'extra usage limit',
}

// getRateLimitDisplayName 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRateLimitDisplayName(type: RateLimitType): string {
  // 返回 `RATE_LIMIT_DISPLAY_NAMES[type] || type`，作为服务层 claude Ai Limits这次计算的结果。
  return RATE_LIMIT_DISPLAY_NAMES[type] || type
}

/**
 * Calculate what fraction of a time window has elapsed.
 * Used for time-relative early warning fallback.
 * @param resetsAt - Unix epoch timestamp in seconds when the limit resets
 * @param windowSeconds - Duration of the window in seconds
 * @returns fraction (0-1) of the window that has elapsed
 */
// computeTimeProgress 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeTimeProgress(resetsAt: number, windowSeconds: number): number {
  // nowSeconds 集合记录时间`Date.now`，供服务层 claude Ai Limits后续处理使用。
  const nowSeconds = Date.now() / 1000
  // windowStart 命名 `resetsAt - windowSeconds`，让后续代码直接表达这个值的用途。
  const windowStart = resetsAt - windowSeconds
  // elapsed保存`nowSeconds - windowStart`，供服务层 claude Ai Limits后续判断或输出使用。
  const elapsed = nowSeconds - windowStart
  // 返回 `Math.max(0, Math.min(1, elapsed / windowSeconds))`，作为服务层 claude Ai Limits这次计算的结果。
  return Math.max(0, Math.min(1, elapsed / windowSeconds))
}

// Reason why overage is disabled/rejected
// These values come from the API's unified limiter
// OverageDisabledReason 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
export type OverageDisabledReason =
  | 'overage_not_provisioned' // Overage is not provisioned for this org or seat tier
  | 'org_level_disabled' // Organization doesn't have overage enabled
  | 'org_level_disabled_until' // Organization overage temporarily disabled
  | 'out_of_credits' // Organization has insufficient credits
  | 'seat_tier_level_disabled' // Seat tier doesn't have overage enabled
  | 'member_level_disabled' // Account specifically has overage disabled
  | 'seat_tier_zero_credit_limit' // Seat tier has a zero credit limit
  | 'group_zero_credit_limit' // Resolved group limit has a zero credit limit
  | 'member_zero_credit_limit' // Account has a zero credit limit
  | 'org_service_level_disabled' // Org service specifically has overage disabled
  | 'org_service_zero_credit_limit' // Org service has a zero credit limit
  | 'no_limits_configured' // No overage limits configured for account
  | 'unknown' // Unknown reason, should not happen

// ClaudeAILimits 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
export type ClaudeAILimits = {
  status: QuotaStatus
  // unifiedRateLimitFallbackAvailable is currently used to warn users that set
  // their model to Opus whenever they are about to run out of quota. It does
  // not change the actual model that is used.
  unifiedRateLimitFallbackAvailable: boolean
  resetsAt?: number
  rateLimitType?: RateLimitType
  utilization?: number
  overageStatus?: QuotaStatus
  overageResetsAt?: number
  overageDisabledReason?: OverageDisabledReason
  isUsingOverage?: boolean
  surpassedThreshold?: number
}

// Exported for testing only
// currentLimits 集合 集中保存服务层 claude Ai Limits要一起传递的字段。
export let currentLimits: ClaudeAILimits = {
  status: 'allowed',
  unifiedRateLimitFallbackAvailable: false,
  isUsingOverage: false,
}

/**
 * Raw per-window utilization from response headers, tracked on every API
 * response (unlike currentLimits.utilization which is only set when a warning
 * threshold fires). Exposed to statusline scripts via getRawUtilization().
 */
// RawWindowUtilization 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type RawWindowUtilization = {
  utilization: number // 0-1 fraction
  resets_at: number // unix epoch seconds
}
// RawUtilization 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type RawUtilization = {
  five_hour?: RawWindowUtilization
  seven_day?: RawWindowUtilization
}
// rawUtilization 从空对象开始收集键值，后续按名称补齐内容。
let rawUtilization: RawUtilization = {}

// getRawUtilization 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRawUtilization(): RawUtilization {
  // 返回 `rawUtilization`，作为服务层 claude Ai Limits这次计算的结果。
  return rawUtilization
}

// extractRawUtilization 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractRawUtilization(headers: globalThis.Headers): RawUtilization {
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  const result: RawUtilization = {}
  // 调用 for，触发服务层 claude Ai Limits此处需要的副作用。
  for (const [key, abbrev] of [
    ['five_hour', '5h'],
    ['seven_day', '7d'],
  ] as const) {
    // util读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
    const util = headers.get(
      `anthropic-ratelimit-unified-${abbrev}-utilization`,
    )
    // reset读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
    const reset = headers.get(`anthropic-ratelimit-unified-${abbrev}-reset`)
    // `util` 与 `null && reset !== null` 不一致时刷新派生状态，避免使用过期结果。
    if (util !== null && reset !== null) {
      // result[key更新为 `{ utilization: Number(util), resets_at: Number(reset) }`，确保服务层 claude Ai Limits后续读取最新状态。
      result[key] = { utilization: Number(util), resets_at: Number(reset) }
    }
  }
  // 返回 `result`，作为服务层 claude Ai Limits这次计算的结果。
  return result
}

// StatusChangeListener 固化服务层 claude Ai Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type StatusChangeListener = (limits: ClaudeAILimits) => void
// statusListeners 集合 用 Set 去重，后续只需判断成员是否存在。
export const statusListeners: Set<StatusChangeListener> = new Set()

// emitStatusChange 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function emitStatusChange(limits: ClaudeAILimits) {
  // currentLimits 集合更新为 `limits`，确保服务层后续读取最新状态。
  currentLimits = limits
  // 调用 statusListeners.forEach，触发服务层 claude Ai Limits此处需要的副作用。
  statusListeners.forEach(listener => listener(limits))
  // hoursTillReset保存`Math.round`，供服务层 claude Ai Limits后续处理使用。
  const hoursTillReset = Math.round(
    (limits.resetsAt ? limits.resetsAt - Date.now() / 1000 : 0) / (60 * 60),
  )

  // 记录服务层 claude Ai Limits运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_claudeai_limits_status_changed', {
    status:
      limits.status as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    unifiedRateLimitFallbackAvailable: limits.unifiedRateLimitFallbackAvailable,
    hoursTillReset,
  })
}

// makeTestQuery 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function makeTestQuery() {
  // 模型名称读取`getSmallFastModel`，供服务层 claude Ai Limits后续处理使用。
  const model = getSmallFastModel()
  // anthropic读取`getAnthropicClient`，供服务层 claude Ai Limits后续处理使用。
  const anthropic = await getAnthropicClient({
    maxRetries: 0,
    model,
    source: 'quota_check',
  })
  // 对话消息 聚合成有序列表，保持后续遍历顺序稳定。
  const messages: MessageParam[] = [{ role: 'user', content: 'quota' }]
  // betas 集合读取`getModelBetas`，供服务层 claude Ai Limits后续处理使用。
  const betas = getModelBetas(model)
  // biome-ignore lint/plugin: quota check needs raw response access via asResponse()
  // 返回 `anthropic.beta.messages`，作为服务层 claude Ai Limits这次计算的结果。
  return anthropic.beta.messages
    .create({
      model,
      max_tokens: 1,
      messages,
      metadata: getAPIMetadata(),
      ...(betas.length > 0 ? { betas } : {}),
    })
    .asResponse()
}

// checkQuotaStatus 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkQuotaStatus(): Promise<void> {
  // Skip network requests if nonessential traffic is disabled
  // 满足 `isEssentialTrafficOnly()` 时，服务层 claude Ai Limits执行该分支。
  if (isEssentialTrafficOnly()) {
    // 服务层 claude Ai Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check if we should process rate limits (real subscriber or mock testing)
  // 满足 `!shouldProcessRateLimits(isClaudeAISubscriber())` 时，服务层 claude Ai Limits执行该分支。
  if (!shouldProcessRateLimits(isClaudeAISubscriber())) {
    // 服务层 claude Ai Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // In non-interactive mode (-p), the real query follows immediately and
  // extractQuotaStatusFromHeaders() will update limits from its response
  // headers (claude.ts), so skip this pre-check API call.
  // 满足 `getIsNonInteractiveSession()` 时，服务层 claude Ai Limits执行该分支。
  if (getIsNonInteractiveSession()) {
    // 服务层 claude Ai Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的服务层 claude Ai Limits操作，确保异常能进入相邻错误处理。
  try {
    // Make a minimal request to check quota
    // 原始文本构建`makeTestQuery`，供服务层 claude Ai Limits后续处理使用。
    const raw = await makeTestQuery()

    // Update limits based on the response
    // 调用 extractQuotaStatusFromHeaders，触发服务层 claude Ai Limits此处需要的副作用。
    extractQuotaStatusFromHeaders(raw.headers)
  } catch (error) {
    // 满足 `error instanceof APIError` 时，服务层 claude Ai Limits执行该分支。
    if (error instanceof APIError) {
      // 调用 extractQuotaStatusFromError，触发服务层 claude Ai Limits此处需要的副作用。
      extractQuotaStatusFromError(error)
    }
  }
}

/**
 * Check if early warning should be triggered based on surpassed-threshold header.
 * Returns ClaudeAILimits if a threshold was surpassed, null otherwise.
 */
// getHeaderBasedEarlyWarning 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getHeaderBasedEarlyWarning(
  headers: globalThis.Headers,
  unifiedRateLimitFallbackAvailable: boolean,
): ClaudeAILimits | null {
  // Check each claim type for surpassed threshold header
  // 调用 for，触发服务层 claude Ai Limits此处需要的副作用。
  for (const [claimAbbrev, rateLimitType] of Object.entries(
    EARLY_WARNING_CLAIM_MAP,
  )) {
    // surpassedThreshold读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
    const surpassedThreshold = headers.get(
      `anthropic-ratelimit-unified-${claimAbbrev}-surpassed-threshold`,
    )

    // If threshold header is present, user has crossed a warning threshold
    // `surpassedThreshold` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (surpassedThreshold !== null) {
      // utilizationHeader读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
      const utilizationHeader = headers.get(
        `anthropic-ratelimit-unified-${claimAbbrev}-utilization`,
      )
      // resetHeader读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
      const resetHeader = headers.get(
        `anthropic-ratelimit-unified-${claimAbbrev}-reset`,
      )

      // utilization保存`utilizationHeader`，供服务层 claude Ai Limits后续判断或输出使用。
      const utilization = utilizationHeader
        ? Number(utilizationHeader)
        : undefined
      // resetsAt保存`Number`，供服务层 claude Ai Limits后续处理使用。
      const resetsAt = resetHeader ? Number(resetHeader) : undefined

      // 返回结构化结果，集中表达服务层 claude Ai Limits已经整理出的状态。
      return {
        status: 'allowed_warning',
        resetsAt,
        rateLimitType: rateLimitType as RateLimitType,
        utilization,
        unifiedRateLimitFallbackAvailable,
        isUsingOverage: false,
        surpassedThreshold: Number(surpassedThreshold),
      }
    }
  }

  // 返回 `null`，作为服务层 claude Ai Limits这次计算的结果。
  return null
}

/**
 * Check if time-relative early warning should be triggered for a rate limit type.
 * Fallback when server doesn't send surpassed-threshold header.
 * Returns ClaudeAILimits if thresholds are exceeded, null otherwise.
 */
// getTimeRelativeEarlyWarning 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTimeRelativeEarlyWarning(
  headers: globalThis.Headers,
  config: EarlyWarningConfig,
  unifiedRateLimitFallbackAvailable: boolean,
): ClaudeAILimits | null {
  // 从 `config` 解构 rateLimitType、claimAbbrev、windowSeconds、thresholds，减少服务层 claude Ai Limits对同一对象的重复访问。
  const { rateLimitType, claimAbbrev, windowSeconds, thresholds } = config

  // utilizationHeader读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const utilizationHeader = headers.get(
    `anthropic-ratelimit-unified-${claimAbbrev}-utilization`,
  )
  // resetHeader读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const resetHeader = headers.get(
    `anthropic-ratelimit-unified-${claimAbbrev}-reset`,
  )

  // 组合条件 `utilizationHeader === null || resetHeader === null` 成立时，服务层 claude Ai Limits才启用这条专门路径。
  if (utilizationHeader === null || resetHeader === null) {
    // 返回 `null`，作为服务层 claude Ai Limits这次计算的结果。
    return null
  }

  // utilization保存`Number`，供服务层 claude Ai Limits后续处理使用。
  const utilization = Number(utilizationHeader)
  // resetsAt保存`Number`，供服务层 claude Ai Limits后续处理使用。
  const resetsAt = Number(resetHeader)
  // timeProgress 集合保存`computeTimeProgress`，供服务层 claude Ai Limits后续处理使用。
  const timeProgress = computeTimeProgress(resetsAt, windowSeconds)

  // Check if any threshold is exceeded: high usage early in the window
  // shouldWarn记录 `thresholds.some` 是否成立，服务层 claude Ai Limits随后按该结果分支。
  const shouldWarn = thresholds.some(
    // t更新为 `> utilization >= t.utilization && timeProgress <= t.timeP...`，确保服务层后续读取最新状态。
    t => utilization >= t.utilization && timeProgress <= t.timePct,
  )

  // shouldWarn缺失时提前走兜底路径，避免服务层 claude Ai Limits继续依赖无效输入。
  if (!shouldWarn) {
    // 返回 `null`，作为服务层 claude Ai Limits这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达服务层 claude Ai Limits已经整理出的状态。
  return {
    status: 'allowed_warning',
    resetsAt,
    rateLimitType,
    utilization,
    unifiedRateLimitFallbackAvailable,
    isUsingOverage: false,
  }
}

/**
 * Get early warning limits using header-based detection with time-relative fallback.
 * 1. First checks for surpassed-threshold header (new server-side approach)
 * 2. Falls back to time-relative thresholds (client-side calculation)
 */
// getEarlyWarningFromHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEarlyWarningFromHeaders(
  headers: globalThis.Headers,
  unifiedRateLimitFallbackAvailable: boolean,
): ClaudeAILimits | null {
  // Try header-based detection first (preferred when API sends the header)
  // headerBasedWarning 警告信息读取`getHeaderBasedEarlyWarning`，供服务层 claude Ai Limits后续处理使用。
  const headerBasedWarning = getHeaderBasedEarlyWarning(
    headers,
    unifiedRateLimitFallbackAvailable,
  )
  // 满足 `headerBasedWarning` 时，服务层 claude Ai Limits执行该分支。
  if (headerBasedWarning) {
    // 返回 `headerBasedWarning`，作为服务层 claude Ai Limits这次计算的结果。
    return headerBasedWarning
  }

  // Fallback: Use time-relative thresholds (client-side calculation)
  // This catches users burning quota faster than sustainable
  // 按顺序遍历 `EARLY_WARNING_CONFIGS` 中的配置，逐个交给服务层 claude Ai Limits处理。
  for (const config of EARLY_WARNING_CONFIGS) {
    // timeRelativeWarning 警告信息读取`getTimeRelativeEarlyWarning`，供服务层 claude Ai Limits后续处理使用。
    const timeRelativeWarning = getTimeRelativeEarlyWarning(
      headers,
      config,
      unifiedRateLimitFallbackAvailable,
    )
    // 满足 `timeRelativeWarning` 时，服务层 claude Ai Limits执行该分支。
    if (timeRelativeWarning) {
      // 返回 `timeRelativeWarning`，作为服务层 claude Ai Limits这次计算的结果。
      return timeRelativeWarning
    }
  }

  // 返回 `null`，作为服务层 claude Ai Limits这次计算的结果。
  return null
}

// computeNewLimitsFromHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeNewLimitsFromHeaders(
  headers: globalThis.Headers,
): ClaudeAILimits {
  // status 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const status =
    (headers.get('anthropic-ratelimit-unified-status') as QuotaStatus) ||
    'allowed'
  // resetsAtHeader读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const resetsAtHeader = headers.get('anthropic-ratelimit-unified-reset')
  // resetsAt保存`Number`，供服务层 claude Ai Limits后续处理使用。
  const resetsAt = resetsAtHeader ? Number(resetsAtHeader) : undefined
  // unifiedRateLimitFallbackAvailable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const unifiedRateLimitFallbackAvailable =
    headers.get('anthropic-ratelimit-unified-fallback') === 'available'

  // Headers for rate limit type and overage support
  // rateLimitType读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const rateLimitType = headers.get(
    'anthropic-ratelimit-unified-representative-claim',
  ) as RateLimitType | null
  // overageStatus 集合读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const overageStatus = headers.get(
    'anthropic-ratelimit-unified-overage-status',
  ) as QuotaStatus | null
  // overageResetsAtHeader读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const overageResetsAtHeader = headers.get(
    'anthropic-ratelimit-unified-overage-reset',
  )
  // overageResetsAt 命名 `overageResetsAtHeader`，让后续代码直接表达这个值的用途。
  const overageResetsAt = overageResetsAtHeader
    ? Number(overageResetsAtHeader)
    : undefined

  // Reason why overage is disabled (spending cap or wallet empty)
  // overageDisabledReason读取`headers.get`，供服务层 claude Ai Limits后续处理使用。
  const overageDisabledReason = headers.get(
    'anthropic-ratelimit-unified-overage-disabled-reason',
  ) as OverageDisabledReason | null

  // Determine if we're using overage (standard limits rejected but overage allowed)
  // isUsingOverage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isUsingOverage =
    status === 'rejected' &&
    (overageStatus === 'allowed' || overageStatus === 'allowed_warning')

  // Check for early warning based on surpassed-threshold header
  // If status is allowed/allowed_warning and we find a surpassed threshold, show warning
  // finalStatus 集合 命名 `status`，让后续代码直接表达这个值的用途。
  let finalStatus: QuotaStatus = status
  // 组合条件 `status === 'allowed' || status === 'allowed_warni` 成立时，服务层 claude Ai Limits才启用这条专门路径。
  if (status === 'allowed' || status === 'allowed_warning') {
    // earlyWarning 警告信息读取`getEarlyWarningFromHeaders`，供服务层 claude Ai Limits后续处理使用。
    const earlyWarning = getEarlyWarningFromHeaders(
      headers,
      unifiedRateLimitFallbackAvailable,
    )
    // 满足 `earlyWarning` 时，服务层 claude Ai Limits执行该分支。
    if (earlyWarning) {
      // 返回 `earlyWarning`，作为服务层 claude Ai Limits这次计算的结果。
      return earlyWarning
    }
    // No early warning threshold surpassed
    // finalStatus 集合更新为 `'allowed'`，确保服务层后续读取最新状态。
    finalStatus = 'allowed'
  }

  // 返回结构化结果，集中表达服务层 claude Ai Limits已经整理出的状态。
  return {
    status: finalStatus,
    resetsAt,
    unifiedRateLimitFallbackAvailable,
    ...(rateLimitType && { rateLimitType }),
    ...(overageStatus && { overageStatus }),
    ...(overageResetsAt && { overageResetsAt }),
    ...(overageDisabledReason && { overageDisabledReason }),
    isUsingOverage,
  }
}

/**
 * Cache the extra usage disabled reason from API headers.
 */
// cacheExtraUsageDisabledReason 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cacheExtraUsageDisabledReason(headers: globalThis.Headers): void {
  // A null reason means extra usage is enabled (no disabled reason header)
  // reason 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const reason =
    headers.get('anthropic-ratelimit-unified-overage-disabled-reason') ?? null
  // cached 缓存读取`getGlobalConfig`，供服务层 claude Ai Limits后续处理使用。
  const cached = getGlobalConfig().cachedExtraUsageDisabledReason
  // `cached` 与 `reason` 不一致时刷新派生状态，避免使用过期结果。
  if (cached !== reason) {
    // 调用 saveGlobalConfig，触发服务层 claude Ai Limits此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      cachedExtraUsageDisabledReason: reason,
    }))
  }
}

// extractQuotaStatusFromHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractQuotaStatusFromHeaders(
  headers: globalThis.Headers,
): void {
  // Check if we need to process rate limits
  // isSubscriber记录 `isClaudeAISubscriber` 是否成立，服务层 claude Ai Limits随后按该结果分支。
  const isSubscriber = isClaudeAISubscriber()

  // 满足 `!shouldProcessRateLimits(isSubscriber)` 时，服务层 claude Ai Limits执行该分支。
  if (!shouldProcessRateLimits(isSubscriber)) {
    // If we have any rate limit state, clear it
    // rawUtilization更新为 `{}`，确保服务层后续读取最新状态。
    rawUtilization = {}
    // `currentLimits.status` 与 `'allowed' || currentLimi` 不一致时刷新派生状态，避免使用过期结果。
    if (currentLimits.status !== 'allowed' || currentLimits.resetsAt) {
      // defaultLimits 集合 集中保存服务层 claude Ai Limits要一起传递的字段。
      const defaultLimits: ClaudeAILimits = {
        status: 'allowed',
        unifiedRateLimitFallbackAvailable: false,
        isUsingOverage: false,
      }
      // 调用 emitStatusChange，触发服务层 claude Ai Limits此处需要的副作用。
      emitStatusChange(defaultLimits)
    }
    // 服务层 claude Ai Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Process headers (applies mocks from /mock-limits command if active)
  // headersToUse保存`processRateLimitHeaders`，供服务层 claude Ai Limits后续处理使用。
  const headersToUse = processRateLimitHeaders(headers)
  // rawUtilization更新为 `extractRawUtilization(headersToUse)`，确保服务层后续读取最新状态。
  rawUtilization = extractRawUtilization(headersToUse)
  // newLimits 集合保存`computeNewLimitsFromHeaders`，供服务层 claude Ai Limits后续处理使用。
  const newLimits = computeNewLimitsFromHeaders(headersToUse)

  // Cache extra usage status (persists across sessions)
  // 调用 cacheExtraUsageDisabledReason，触发服务层 claude Ai Limits此处需要的副作用。
  cacheExtraUsageDisabledReason(headersToUse)

  // 满足 `!isEqual(currentLimits, newLimits)` 时，服务层 claude Ai Limits执行该分支。
  if (!isEqual(currentLimits, newLimits)) {
    // 调用 emitStatusChange，触发服务层 claude Ai Limits此处需要的副作用。
    emitStatusChange(newLimits)
  }
}

// extractQuotaStatusFromError 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractQuotaStatusFromError(error: APIError): void {
  // 服务层 claude Ai Limits在这里进入条件判断，后续代码按实际状态分流。
  if (
    !shouldProcessRateLimits(isClaudeAISubscriber()) ||
    error.status !== 429
  ) {
    // 服务层 claude Ai Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 保护这一段可能失败的服务层 claude Ai Limits操作，确保异常能进入相邻错误处理。
  try {
    // newLimits 集合 集中保存服务层 claude Ai Limits要一起传递的字段。
    let newLimits = { ...currentLimits }
    // 满足 `error.headers` 时，服务层 claude Ai Limits执行该分支。
    if (error.headers) {
      // Process headers (applies mocks from /mock-limits command if active)
      // headersToUse保存`processRateLimitHeaders`，供服务层 claude Ai Limits后续处理使用。
      const headersToUse = processRateLimitHeaders(error.headers)
      // rawUtilization更新为 `extractRawUtilization(headersToUse)`，确保服务层后续读取最新状态。
      rawUtilization = extractRawUtilization(headersToUse)
      // newLimits 集合更新为 `computeNewLimitsFromHeaders(headersToUse)`，确保服务层后续读取最新状态。
      newLimits = computeNewLimitsFromHeaders(headersToUse)

      // Cache extra usage status (persists across sessions)
      // 调用 cacheExtraUsageDisabledReason，触发服务层 claude Ai Limits此处需要的副作用。
      cacheExtraUsageDisabledReason(headersToUse)
    }
    // For errors, always set status to rejected even if headers are not present.
    // status 集合更新为 `'rejected'`，确保服务层后续读取最新状态。
    newLimits.status = 'rejected'

    // 满足 `!isEqual(currentLimits, newLimits)` 时，服务层 claude Ai Limits执行该分支。
    if (!isEqual(currentLimits, newLimits)) {
      // 调用 emitStatusChange，触发服务层 claude Ai Limits此处需要的副作用。
      emitStatusChange(newLimits)
    }
  } catch (e) {
    // 记录服务层 claude Ai Limits运行诊断，方便排查异常路径或性能问题。
    logError(e as Error)
  }
}
