// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 整理这一组导入，让API 服务 grove后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 复用 getOauthAccountInfo、isConsumerSubscriber 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { getOauthAccountInfo, isConsumerSubscriber } from 'src/utils/auth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 gracefulShutdown 工具函数，把通用处理留在 src/utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from 'src/utils/gracefulShutdown.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 src/utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from 'src/utils/privacyLevel.js'
// 复用 writeToStderr 工具函数，把通用处理留在 src/utils/process.js 中维护。
import { writeToStderr } from 'src/utils/process.js'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 整理这一组导入，让API 服务 grove后续逻辑可以直接复用这些外部能力。
import {
  getAuthHeaders,
  getUserAgent,
  withOAuth401Retry,
} from '../../utils/http.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'

// Cache expiration: 24 hours
// GROVE_CACHE_EXPIRATION_MS 缓存 命名 `24 * 60 * 60 * 1000`，让后续代码直接表达这个值的用途。
const GROVE_CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000

// AccountSettings 固化API 服务 grove里传递的数据形状，帮助调用方按同一结构读写字段。
export type AccountSettings = {
  grove_enabled: boolean | null
  grove_notice_viewed_at: string | null
}

// GroveConfig 固化API 服务 grove里传递的数据形状，帮助调用方按同一结构读写字段。
export type GroveConfig = {
  grove_enabled: boolean
  domain_excluded: boolean
  notice_is_grace_period: boolean
  notice_reminder_frequency: number | null
}

/**
 * Result type that distinguishes between API failure and success.
 * - success: true means API call succeeded (data may still contain null fields)
 * - success: false means API call failed after retry
 */
// ApiResult 固化API 服务 grove里传递的数据形状，帮助调用方按同一结构读写字段。
export type ApiResult<T> = { success: true; data: T } | { success: false }

/**
 * Get the current Grove settings for the user account.
 * Returns ApiResult to distinguish between API failure and success.
 * Uses existing OAuth 401 retry, then returns failure if that doesn't help.
 *
 * Memoized for the session to avoid redundant per-render requests.
 * Cache is invalidated in updateGroveSettings() so post-toggle reads are fresh.
 */
// getGroveSettings 集合保存`memoize`，供API 服务 grove后续处理使用。
export const getGroveSettings = memoize(
  async (): Promise<ApiResult<AccountSettings>> => {
    // Grove is a notification feature; during an outage, skipping it is correct.
    // 满足 `isEssentialTrafficOnly()` 时，API 服务 grove执行该分支。
    if (isEssentialTrafficOnly()) {
      // 返回结构化结果，集中表达API 服务 grove已经整理出的状态。
      return { success: false }
    }
    // 保护这一段可能失败的API 服务 grove操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应保存`withOAuth401Retry`，供API 服务 grove后续处理使用。
      const response = await withOAuth401Retry(() => {
        // authHeaders 集合读取`getAuthHeaders`，供API 服务 grove后续处理使用。
        const authHeaders = getAuthHeaders()
        // 满足 `authHeaders.error` 时，API 服务 grove执行该分支。
        if (authHeaders.error) {
          // 抛出 new Error(`Failed to get auth headers: ${authHeaders.error}`)，阻止API 服务 grove在无效状态下继续运行。
          throw new Error(`Failed to get auth headers: ${authHeaders.error}`)
        }
        // 返回 `axios.get<AccountSettings>(`，作为API 服务 grove这次计算的结果。
        return axios.get<AccountSettings>(
          `${getOauthConfig().BASE_API_URL}/api/oauth/account/settings`,
          {
            headers: {
              ...authHeaders.headers,
              'User-Agent': getClaudeCodeUserAgent(),
            },
          },
        )
      })
      // 返回结构化结果，集中表达API 服务 grove已经整理出的状态。
      return { success: true, data: response.data }
    } catch (err) {
      // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // Don't cache failures — transient network issues would lock the user
      // out of privacy settings for the entire session (deadlock: dialog needs
      // success to render the toggle, toggle calls updateGroveSettings which
      // is the only other place the cache is cleared).
      // 调用 getGroveSettings.cache.clear?.()，完成这一处局部操作。
      getGroveSettings.cache.clear?.()
      // 返回结构化结果，集中表达API 服务 grove已经整理出的状态。
      return { success: false }
    }
  },
)

/**
 * Mark that the Grove notice has been viewed by the user
 */
// markGroveNoticeViewed 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function markGroveNoticeViewed(): Promise<void> {
  // 保护这一段可能失败的API 服务 grove操作，确保异常能进入相邻错误处理。
  try {
    // 这个回调绑定到 await withOAuth401Retry(() => {，负责API 服务 grove在该局部场景下的响应。
    await withOAuth401Retry(() => {
      // authHeaders 集合读取`getAuthHeaders`，供API 服务 grove后续处理使用。
      const authHeaders = getAuthHeaders()
      // 满足 `authHeaders.error` 时，API 服务 grove执行该分支。
      if (authHeaders.error) {
        // 抛出 new Error(`Failed to get auth headers: ${authHeaders.error}`)，阻止API 服务 grove在无效状态下继续运行。
        throw new Error(`Failed to get auth headers: ${authHeaders.error}`)
      }
      // 返回 `axios.post(`，作为API 服务 grove这次计算的结果。
      return axios.post(
        `${getOauthConfig().BASE_API_URL}/api/oauth/account/grove_notice_viewed`,
        {},
        {
          headers: {
            ...authHeaders.headers,
            'User-Agent': getClaudeCodeUserAgent(),
          },
        },
      )
    })
    // This mutates grove_notice_viewed_at server-side — Grove.tsx:87 reads it
    // to decide whether to show the dialog. Without invalidation a same-session
    // remount would read stale viewed_at:null and re-show the dialog.
    // 调用 getGroveSettings.cache.clear?.()，完成这一处局部操作。
    getGroveSettings.cache.clear?.()
  } catch (err) {
    // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
    logError(err)
  }
}

/**
 * Update Grove settings for the user account
 */
// updateGroveSettings 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function updateGroveSettings(
  groveEnabled: boolean,
): Promise<void> {
  // 保护这一段可能失败的API 服务 grove操作，确保异常能进入相邻错误处理。
  try {
    // 这个回调绑定到 await withOAuth401Retry(() => {，负责API 服务 grove在该局部场景下的响应。
    await withOAuth401Retry(() => {
      // authHeaders 集合读取`getAuthHeaders`，供API 服务 grove后续处理使用。
      const authHeaders = getAuthHeaders()
      // 满足 `authHeaders.error` 时，API 服务 grove执行该分支。
      if (authHeaders.error) {
        // 抛出 new Error(`Failed to get auth headers: ${authHeaders.error}`)，阻止API 服务 grove在无效状态下继续运行。
        throw new Error(`Failed to get auth headers: ${authHeaders.error}`)
      }
      // 返回 `axios.patch(`，作为API 服务 grove这次计算的结果。
      return axios.patch(
        `${getOauthConfig().BASE_API_URL}/api/oauth/account/settings`,
        {
          grove_enabled: groveEnabled,
        },
        {
          headers: {
            ...authHeaders.headers,
            'User-Agent': getClaudeCodeUserAgent(),
          },
        },
      )
    })
    // Invalidate memoized settings so the post-toggle confirmation
    // read in privacy-settings.tsx picks up the new value.
    // 调用 getGroveSettings.cache.clear?.()，完成这一处局部操作。
    getGroveSettings.cache.clear?.()
  } catch (err) {
    // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
    logError(err)
  }
}

/**
 * Check if user is qualified for Grove (non-blocking, cache-first).
 *
 * This function never blocks on network - it returns cached data immediately
 * and fetches in the background if needed. On cold start (no cache), it returns
 * false and the Grove dialog won't show until the next session.
 */
// isQualifiedForGrove 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function isQualifiedForGrove(): Promise<boolean> {
  // 满足 `!isConsumerSubscriber()` 时，API 服务 grove执行该分支。
  if (!isConsumerSubscriber()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // accountId 数量读取`getOauthAccountInfo`，供API 服务 grove后续处理使用。
  const accountId = getOauthAccountInfo()?.accountUuid
  // accountId 数量缺失时提前走兜底路径，避免API 服务 grove继续依赖无效输入。
  if (!accountId) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // globalConfig 配置读取`getGlobalConfig`，供API 服务 grove后续处理使用。
  const globalConfig = getGlobalConfig()
  // cachedEntry 缓存 命名 `globalConfig.groveConfigCache?.[accountId]`，让后续代码直接表达这个值的用途。
  const cachedEntry = globalConfig.groveConfigCache?.[accountId]
  // now记录时间`Date.now`，供API 服务 grove后续处理使用。
  const now = Date.now()

  // No cache - trigger background fetch and return false (non-blocking)
  // The Grove dialog won't show this session, but will next time if eligible
  // cachedEntry 缓存缺失时提前走兜底路径，避免API 服务 grove继续依赖无效输入。
  if (!cachedEntry) {
    // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Grove: No cache, fetching config in background (dialog skipped this session)',
    )
    // 显式忽略 `fetchAndStoreGroveConfig(accountId)` 的返回值，只保留它触发的副作用。
    void fetchAndStoreGroveConfig(accountId)
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Cache exists but is stale - return cached value and refresh in background
  // 满足 `now - cachedEntry.timestamp > GROVE_CACHE_EXPIRAT` 时，API 服务 grove执行该分支。
  if (now - cachedEntry.timestamp > GROVE_CACHE_EXPIRATION_MS) {
    // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Grove: Cache stale, returning cached data and refreshing in background',
    )
    // 显式忽略 `fetchAndStoreGroveConfig(accountId)` 的返回值，只保留它触发的副作用。
    void fetchAndStoreGroveConfig(accountId)
    // 返回 `cachedEntry.grove_enabled`，作为API 服务 grove这次计算的结果。
    return cachedEntry.grove_enabled
  }

  // Cache is fresh - return it immediately
  // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Grove: Using fresh cached config')
  // 返回 `cachedEntry.grove_enabled`，作为API 服务 grove这次计算的结果。
  return cachedEntry.grove_enabled
}

/**
 * Fetch Grove config from API and store in cache
 */
// fetchAndStoreGroveConfig 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchAndStoreGroveConfig(accountId: string): Promise<void> {
  // 保护这一段可能失败的API 服务 grove操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`getGroveNoticeConfig`，供API 服务 grove后续处理使用。
    const result = await getGroveNoticeConfig()
    // result.success 集合缺失时提前走兜底路径，避免API 服务 grove继续依赖无效输入。
    if (!result.success) {
      // API 服务 grove在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // groveEnabled 命名 `result.data.grove_enabled`，让后续代码直接表达这个值的用途。
    const groveEnabled = result.data.grove_enabled
    // cachedEntry 缓存读取`getGlobalConfig`，供API 服务 grove后续处理使用。
    const cachedEntry = getGlobalConfig().groveConfigCache?.[accountId]
    // API 服务 grove在这里进入条件判断，后续代码按实际状态分流。
    if (
      cachedEntry?.grove_enabled === groveEnabled &&
      Date.now() - cachedEntry.timestamp <= GROVE_CACHE_EXPIRATION_MS
    ) {
      // API 服务 grove在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 saveGlobalConfig，触发API 服务 grove此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      groveConfigCache: {
        ...current.groveConfigCache,
        [accountId]: {
          grove_enabled: groveEnabled,
          timestamp: Date.now(),
        },
      },
    }))
  } catch (err) {
    // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Grove: Failed to fetch and store config: ${err}`)
  }
}

/**
 * Get Grove Statsig configuration from the API.
 * Returns ApiResult to distinguish between API failure and success.
 * Uses existing OAuth 401 retry, then returns failure if that doesn't help.
 */
// getGroveNoticeConfig 配置保存`memoize`，供API 服务 grove后续处理使用。
export const getGroveNoticeConfig = memoize(
  async (): Promise<ApiResult<GroveConfig>> => {
    // Grove is a notification feature; during an outage, skipping it is correct.
    // 满足 `isEssentialTrafficOnly()` 时，API 服务 grove执行该分支。
    if (isEssentialTrafficOnly()) {
      // 返回结构化结果，集中表达API 服务 grove已经整理出的状态。
      return { success: false }
    }
    // 保护这一段可能失败的API 服务 grove操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应保存`withOAuth401Retry`，供API 服务 grove后续处理使用。
      const response = await withOAuth401Retry(() => {
        // authHeaders 集合读取`getAuthHeaders`，供API 服务 grove后续处理使用。
        const authHeaders = getAuthHeaders()
        // 满足 `authHeaders.error` 时，API 服务 grove执行该分支。
        if (authHeaders.error) {
          // 抛出 new Error(`Failed to get auth headers: ${authHeaders.error}`)，阻止API 服务 grove在无效状态下继续运行。
          throw new Error(`Failed to get auth headers: ${authHeaders.error}`)
        }
        // 返回 `axios.get<GroveConfig>(`，作为API 服务 grove这次计算的结果。
        return axios.get<GroveConfig>(
          `${getOauthConfig().BASE_API_URL}/api/claude_code_grove`,
          {
            headers: {
              ...authHeaders.headers,
              'User-Agent': getUserAgent(),
            },
            timeout: 3000, // Short timeout - if slow, skip Grove dialog
          },
        )
      })

      // Map the API response to the GroveConfig type
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        grove_enabled,
        domain_excluded,
        notice_is_grace_period,
        notice_reminder_frequency,
      } = response.data

      // 返回结构化结果，集中表达API 服务 grove已经整理出的状态。
      return {
        success: true,
        data: {
          grove_enabled,
          domain_excluded: domain_excluded ?? false,
          notice_is_grace_period: notice_is_grace_period ?? true,
          notice_reminder_frequency,
        },
      }
    } catch (err) {
      // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Failed to fetch Grove notice config: ${err}`)
      // 返回结构化结果，集中表达API 服务 grove已经整理出的状态。
      return { success: false }
    }
  },
)

/**
 * Determines whether the Grove dialog should be shown.
 * Returns false if either API call failed (after retry) - we hide the dialog on API failure.
 */
// calculateShouldShowGrove 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateShouldShowGrove(
  settingsResult: ApiResult<AccountSettings>,
  configResult: ApiResult<GroveConfig>,
  showIfAlreadyViewed: boolean,
): boolean {
  // Hide dialog on API failure (after retry)
  // 组合条件 `!settingsResult.success || !configResult.success` 成立时，API 服务 grove才启用这条专门路径。
  if (!settingsResult.success || !configResult.success) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // settings 集合 命名 `settingsResult.data`，让后续代码直接表达这个值的用途。
  const settings = settingsResult.data
  // 配置 命名 `configResult.data`，让后续代码直接表达这个值的用途。
  const config = configResult.data

  // hasChosen标记API 服务 grove是否启用对应路径。
  const hasChosen = settings.grove_enabled !== null
  // 满足 `hasChosen` 时，API 服务 grove执行该分支。
  if (hasChosen) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `showIfAlreadyViewed` 时，API 服务 grove执行该分支。
  if (showIfAlreadyViewed) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // config.notice_is_grace_period 配置缺失时提前走兜底路径，避免API 服务 grove继续依赖无效输入。
  if (!config.notice_is_grace_period) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Check if we need to remind the user to accept the terms and choose
  // whether to help improve Claude.
  // reminderFrequency保存`config.notice_reminder_frequency`，供API 服务 grove后续判断或输出使用。
  const reminderFrequency = config.notice_reminder_frequency
  // `reminderFrequency` 与 `null && settings.grove_noti` 不一致时刷新派生状态，避免使用过期结果。
  if (reminderFrequency !== null && settings.grove_notice_viewed_at) {
    // daysSinceViewed保存`Math.floor`，供API 服务 grove后续处理使用。
    const daysSinceViewed = Math.floor(
      (Date.now() - new Date(settings.grove_notice_viewed_at).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    // 返回 `daysSinceViewed >= reminderFrequency`，作为API 服务 grove这次计算的结果。
    return daysSinceViewed >= reminderFrequency
  } else {
    // Show if never viewed before
    // viewedAt保存`settings.grove_notice_viewed_at`，供后续判断或组装使用。
    const viewedAt = settings.grove_notice_viewed_at
    // 返回 `viewedAt === null || viewedAt === undefined`，作为API 服务 grove这次计算的结果。
    return viewedAt === null || viewedAt === undefined
  }
}

// checkGroveForNonInteractive 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkGroveForNonInteractive(): Promise<void> {
  // 并行获取 settingsResult、configResult，缩短API 服务 grove等待多个独立异步任务的时间。
  const [settingsResult, configResult] = await Promise.all([
    getGroveSettings(),
    getGroveNoticeConfig(),
  ])

  // Check if user hasn't made a choice yet (returns false on API failure)
  // shouldShowGrove记录 `calculateShouldShowGrove` 是否成立，API 服务 grove随后按该结果分支。
  const shouldShowGrove = calculateShouldShowGrove(
    settingsResult,
    configResult,
    false,
  )

  // 满足 `shouldShowGrove` 时，API 服务 grove执行该分支。
  if (shouldShowGrove) {
    // shouldShowGrove is only true if both API calls succeeded
    // 配置保存`configResult.success ? configResult.data : null`，供后续判断或组装使用。
    const config = configResult.success ? configResult.data : null
    // 记录API 服务 grove运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_grove_print_viewed', {
      dismissable:
        config?.notice_is_grace_period as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 组合条件 `config === null || config.notice_is_grace_period` 成立时，API 服务 grove才启用这条专门路径。
    if (config === null || config.notice_is_grace_period) {
      // Grace period is still active - show informational message and continue
      // 调用 writeToStderr，触发API 服务 grove此处需要的副作用。
      writeToStderr(
        '\nAn update to our Consumer Terms and Privacy Policy will take effect on October 8, 2025. Run `claude` to review the updated terms.\n\n',
      )
      // 等待 `markGroveNoticeViewed()` 完成，再继续API 服务 grove的异步流程。
      await markGroveNoticeViewed()
    } else {
      // Grace period has ended - show error message and exit
      // 调用 writeToStderr，触发API 服务 grove此处需要的副作用。
      writeToStderr(
        '\n[ACTION REQUIRED] An update to our Consumer Terms and Privacy Policy has taken effect on October 8, 2025. You must run `claude` to review the updated terms.\n\n',
      )
      // 等待 `gracefulShutdown(1)` 完成，再继续API 服务 grove的异步流程。
      await gracefulShutdown(1)
    }
  }
}
