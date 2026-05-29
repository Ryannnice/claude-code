// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 整理这一组导入，让API 服务 referral后续逻辑可以直接复用这些外部能力。
import {
  getOauthAccountInfo,
  getSubscriptionType,
  isClaudeAISubscriber,
} from '../../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../../utils/privacyLevel.js'
// 复用 getOAuthHeaders、prepareApiRequest 工具函数，把通用处理留在 ../../utils/teleport/api.js 中维护。
import { getOAuthHeaders, prepareApiRequest } from '../../utils/teleport/api.js'
// 整理这一组导入，让API 服务 referral后续逻辑可以直接复用这些外部能力。
import type {
  ReferralCampaign,
  ReferralEligibilityResponse,
  ReferralRedemptionsResponse,
  ReferrerRewardInfo,
} from '../oauth/types.js'

// Cache expiration time: 24 hours (eligibility changes only on subscription/experiment changes)
// CACHE_EXPIRATION_MS 缓存保存`24 * 60 * 60 * 1000`，供API 服务 referral后续判断或输出使用。
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000

// Track in-flight fetch to prevent duplicate API calls
// fetchInProgress 集合 命名 `null`，让后续代码直接表达这个值的用途。
let fetchInProgress: Promise<ReferralEligibilityResponse | null> | null = null

// fetchReferralEligibility 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchReferralEligibility(
  campaign: ReferralCampaign = 'claude_code_guest_pass',
): Promise<ReferralEligibilityResponse> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 referral对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // 请求头 集中保存API 服务 referral要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供API 服务 referral后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/referral/eligibility`

  // 接口响应读取`axios.get`，供API 服务 referral后续处理使用。
  const response = await axios.get(url, {
    headers,
    params: { campaign },
    timeout: 5000, // 5 second timeout for background fetch
  })

  // 返回 `response.data`，作为API 服务 referral这次计算的结果。
  return response.data
}

// fetchReferralRedemptions 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchReferralRedemptions(
  campaign: string = 'claude_code_guest_pass',
): Promise<ReferralRedemptionsResponse> {
  // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 referral对同一对象的重复访问。
  const { accessToken, orgUUID } = await prepareApiRequest()

  // 请求头 集中保存API 服务 referral要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // URL读取`getOauthConfig`，供API 服务 referral后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/referral/redemptions`

  // 接口响应 等待 `axios.get<ReferralRedemptionsResponse>(url, {`，确保继续执行前已有结果。
  const response = await axios.get<ReferralRedemptionsResponse>(url, {
    headers,
    params: { campaign },
    timeout: 10000, // 10 second timeout
  })

  // 返回 `response.data`，作为API 服务 referral这次计算的结果。
  return response.data
}

/**
 * Prechecks for if user can access guest passes feature
 */
// shouldCheckForPasses 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldCheckForPasses(): boolean {
  // 返回 `!!(`，作为API 服务 referral这次计算的结果。
  return !!(
    getOauthAccountInfo()?.organizationUuid &&
    isClaudeAISubscriber() &&
    getSubscriptionType() === 'max'
  )
}

/**
 * Check cached passes eligibility from GlobalConfig
 * Returns current cached state and cache status
 */
// checkCachedPassesEligibility 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkCachedPassesEligibility(): {
  eligible: boolean
  needsRefresh: boolean
  hasCache: boolean
} {
  // 满足 `!shouldCheckForPasses()` 时，API 服务 referral执行该分支。
  if (!shouldCheckForPasses()) {
    // 返回结构化结果，集中表达API 服务 referral已经整理出的状态。
    return {
      eligible: false,
      needsRefresh: false,
      hasCache: false,
    }
  }

  // orgId读取`getOauthAccountInfo`，供API 服务 referral后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!orgId) {
    // 返回结构化结果，集中表达API 服务 referral已经整理出的状态。
    return {
      eligible: false,
      needsRefresh: false,
      hasCache: false,
    }
  }

  // 配置读取`getGlobalConfig`，供API 服务 referral后续处理使用。
  const config = getGlobalConfig()
  // cachedEntry 缓存读取 `config.passesEligibilityCache?.[orgId]` 对应条目，后续围绕该成员继续处理。
  const cachedEntry = config.passesEligibilityCache?.[orgId]

  // cachedEntry 缓存缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!cachedEntry) {
    // No cached entry, needs fetch
    // 返回结构化结果，集中表达API 服务 referral已经整理出的状态。
    return {
      eligible: false,
      needsRefresh: true,
      hasCache: false,
    }
  }

  // 从 `cachedEntry` 解构 eligible、timestamp，减少API 服务 referral对同一对象的重复访问。
  const { eligible, timestamp } = cachedEntry
  // now记录时间`Date.now`，供API 服务 referral后续处理使用。
  const now = Date.now()
  // needsRefresh标记API 服务 referral是否启用对应路径。
  const needsRefresh = now - timestamp > CACHE_EXPIRATION_MS

  // 返回结构化结果，集中表达API 服务 referral已经整理出的状态。
  return {
    eligible,
    needsRefresh,
    hasCache: true,
  }
}

// CURRENCY_SYMBOLS 集合 集中保存API 服务 referral要一起传递的字段。
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BRL: 'R$',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
}

// formatCreditAmount 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatCreditAmount(reward: ReferrerRewardInfo): string {
  // symbol读取 `CURRENCY_SYMBOLS[reward.currency] ?? `${reward.currency} `` 对应条目，后续围绕该成员继续处理。
  const symbol = CURRENCY_SYMBOLS[reward.currency] ?? `${reward.currency} `
  // amount 命名 `reward.amount_minor_units / 100`，让后续代码直接表达这个值的用途。
  const amount = reward.amount_minor_units / 100
  // formatted格式化`amount.toString`，供API 服务 referral后续处理使用。
  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2)
  // 返回 ``${symbol}${formatted}``，作为API 服务 referral这次计算的结果。
  return `${symbol}${formatted}`
}

/**
 * Get cached referrer reward info from eligibility cache
 * Returns the reward info if the user is in a v1 campaign, null otherwise
 */
// getCachedReferrerReward 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedReferrerReward(): ReferrerRewardInfo | null {
  // orgId读取`getOauthAccountInfo`，供API 服务 referral后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!orgId) return null
  // 配置读取`getGlobalConfig`，供API 服务 referral后续处理使用。
  const config = getGlobalConfig()
  // cachedEntry 缓存读取 `config.passesEligibilityCache?.[orgId]` 对应条目，后续围绕该成员继续处理。
  const cachedEntry = config.passesEligibilityCache?.[orgId]
  // 返回 `cachedEntry?.referrer_reward ?? null`，作为API 服务 referral这次计算的结果。
  return cachedEntry?.referrer_reward ?? null
}

/**
 * Get the cached remaining passes count from eligibility cache
 * Returns the number of remaining passes, or null if not available
 */
// getCachedRemainingPasses 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedRemainingPasses(): number | null {
  // orgId读取`getOauthAccountInfo`，供API 服务 referral后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!orgId) return null
  // 配置读取`getGlobalConfig`，供API 服务 referral后续处理使用。
  const config = getGlobalConfig()
  // cachedEntry 缓存读取 `config.passesEligibilityCache?.[orgId]` 对应条目，后续围绕该成员继续处理。
  const cachedEntry = config.passesEligibilityCache?.[orgId]
  // 返回 `cachedEntry?.remaining_passes ?? null`，作为API 服务 referral这次计算的结果。
  return cachedEntry?.remaining_passes ?? null
}

/**
 * Fetch passes eligibility and store in GlobalConfig
 * Returns the fetched response or null on error
 */
// fetchAndStorePassesEligibility 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchAndStorePassesEligibility(): Promise<ReferralEligibilityResponse | null> {
  // Return existing promise if fetch is already in progress
  // 满足 `fetchInProgress` 时，API 服务 referral执行该分支。
  if (fetchInProgress) {
    // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Passes: Reusing in-flight eligibility fetch')
    // 返回 `fetchInProgress`，作为API 服务 referral这次计算的结果。
    return fetchInProgress
  }

  // orgId读取`getOauthAccountInfo`，供API 服务 referral后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid

  // orgId缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!orgId) {
    // 返回 `null`，作为API 服务 referral这次计算的结果。
    return null
  }

  // Store the promise to share with concurrent calls
  // fetchInProgress 集合更新为 `(async () => {`，确保API 服务后续读取最新状态。
  fetchInProgress = (async () => {
    // 保护这一段可能失败的API 服务 referral操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应读取`fetchReferralEligibility`，供API 服务 referral后续处理使用。
      const response = await fetchReferralEligibility()

      // cacheEntry 缓存 集中保存API 服务 referral要一起传递的字段。
      const cacheEntry = {
        ...response,
        timestamp: Date.now(),
      }

      // 调用 saveGlobalConfig，触发API 服务 referral此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        passesEligibilityCache: {
          ...current.passesEligibilityCache,
          [orgId]: cacheEntry,
        },
      }))

      // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Passes eligibility cached for org ${orgId}: ${response.eligible}`,
      )

      // 返回 `response`，作为API 服务 referral这次计算的结果。
      return response
    } catch (error) {
      // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Failed to fetch and cache passes eligibility')
      // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
      logError(error as Error)
      // 返回 `null`，作为API 服务 referral这次计算的结果。
      return null
    } finally {
      // Clear the promise when done
      // fetchInProgress 集合更新为 `null`，确保API 服务后续读取最新状态。
      fetchInProgress = null
    }
  })()

  // 返回 `fetchInProgress`，作为API 服务 referral这次计算的结果。
  return fetchInProgress
}

/**
 * Get cached passes eligibility data or fetch if needed
 * Main entry point for all eligibility checks
 *
 * This function never blocks on network - it returns cached data immediately
 * and fetches in the background if needed. On cold start (no cache), it returns
 * null and the passes command won't be available until the next session.
 */
// getCachedOrFetchPassesEligibility 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getCachedOrFetchPassesEligibility(): Promise<ReferralEligibilityResponse | null> {
  // 满足 `!shouldCheckForPasses()` 时，API 服务 referral执行该分支。
  if (!shouldCheckForPasses()) {
    // 返回 `null`，作为API 服务 referral这次计算的结果。
    return null
  }

  // orgId读取`getOauthAccountInfo`，供API 服务 referral后续处理使用。
  const orgId = getOauthAccountInfo()?.organizationUuid
  // orgId缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!orgId) {
    // 返回 `null`，作为API 服务 referral这次计算的结果。
    return null
  }

  // 配置读取`getGlobalConfig`，供API 服务 referral后续处理使用。
  const config = getGlobalConfig()
  // cachedEntry 缓存读取 `config.passesEligibilityCache?.[orgId]` 对应条目，后续围绕该成员继续处理。
  const cachedEntry = config.passesEligibilityCache?.[orgId]
  // now记录时间`Date.now`，供API 服务 referral后续处理使用。
  const now = Date.now()

  // No cache - trigger background fetch and return null (non-blocking)
  // The passes command won't be available this session, but will be next time
  // cachedEntry 缓存缺失时提前走兜底路径，避免API 服务 referral继续依赖无效输入。
  if (!cachedEntry) {
    // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Passes: No cache, fetching eligibility in background (command unavailable this session)',
    )
    // 显式忽略 `fetchAndStorePassesEligibility()` 的返回值，只保留它触发的副作用。
    void fetchAndStorePassesEligibility()
    // 返回 `null`，作为API 服务 referral这次计算的结果。
    return null
  }

  // Cache exists but is stale - return stale cache and trigger background refresh
  // 满足 `now - cachedEntry.timestamp > CACHE_EXPIRATION_MS` 时，API 服务 referral执行该分支。
  if (now - cachedEntry.timestamp > CACHE_EXPIRATION_MS) {
    // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Passes: Cache stale, returning cached data and refreshing in background',
    )
    // 显式忽略 `fetchAndStorePassesEligibility() // Background refresh` 的返回值，只保留它触发的副作用。
    void fetchAndStorePassesEligibility() // Background refresh
    // 从 `cachedEntry` 解构 timestamp、其余 response，减少API 服务 referral对同一对象的重复访问。
    const { timestamp, ...response } = cachedEntry
    // 返回 `response as ReferralEligibilityResponse`，作为API 服务 referral这次计算的结果。
    return response as ReferralEligibilityResponse
  }

  // Cache is fresh - return it immediately
  // 记录API 服务 referral运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Passes: Using fresh cached eligibility data')
  // 从 `cachedEntry` 解构 timestamp、其余 response，减少API 服务 referral对同一对象的重复访问。
  const { timestamp, ...response } = cachedEntry
  // 返回 `response as ReferralEligibilityResponse`，作为API 服务 referral这次计算的结果。
  return response as ReferralEligibilityResponse
}

/**
 * Prefetch passes eligibility on startup
 */
// prefetchPassesEligibility 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function prefetchPassesEligibility(): Promise<void> {
  // Skip network requests if nonessential traffic is disabled
  // 满足 `isEssentialTrafficOnly()` 时，API 服务 referral执行该分支。
  if (isEssentialTrafficOnly()) {
    // API 服务 referral在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 显式忽略 `getCachedOrFetchPassesEligibility()` 的返回值，只保留它触发的副作用。
  void getCachedOrFetchPassesEligibility()
}
