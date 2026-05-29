// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSessionId } from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getOauthAccountInfo,
  getRateLimitTier,
  getSubscriptionType,
} from './auth.js'
// 引入 getGlobalConfig、getOrCreateUserID，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig, getOrCreateUserID } from './config.js'
// 引入 getCwd，将 ./cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from './cwd.js'
// 引入 env、getHostPlatformForAnalytics，将 ./env.js 中已经封装好的能力接到本文件流程里。
import { type env, getHostPlatformForAnalytics } from './env.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

// Cache for email fetched asynchronously at startup
// cachedEmail 缓存读取`null // null means not fetched yet`，供后续判断或组装使用。
let cachedEmail: string | undefined | null = null // null means not fetched yet
// emailFetchPromise 异步任务保存`null`，作为后续空值处理的输入。
let emailFetchPromise: Promise<string | undefined> | null = null

/**
 * GitHub Actions metadata when running in CI
 */
// GitHubActionsMetadata 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type GitHubActionsMetadata = {
  actor?: string
  actorId?: string
  repository?: string
  repositoryId?: string
  repositoryOwner?: string
  repositoryOwnerId?: string
}

/**
 * Core user data used as base for all analytics providers.
 * This is also the format used by GrowthBook.
 */
// CoreUserData 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CoreUserData = {
  deviceId: string
  sessionId: string
  email?: string
  appVersion: string
  platform: typeof env.platform
  organizationUuid?: string
  accountUuid?: string
  userType?: string
  subscriptionType?: string
  rateLimitTier?: string
  firstTokenTime?: number
  githubActionsMetadata?: GitHubActionsMetadata
}

/**
 * Initialize user data asynchronously. Should be called early in startup.
 * This pre-fetches the email so getUser() can remain synchronous.
 */
// initUser 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initUser(): Promise<void> {
  // 只有 `cachedEmail === null && !emailFetchPromise` 满足时，共享工具才执行该分支。
  if (cachedEmail === null && !emailFetchPromise) {
    // emailFetchPromise 异步任务更新为 `getEmailAsync()`，确保共享工具后续读取最新状态。
    emailFetchPromise = getEmailAsync()
    // cachedEmail 缓存更新为 `await emailFetchPromise`，确保共享工具后续读取最新状态。
    cachedEmail = await emailFetchPromise
    // emailFetchPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
    emailFetchPromise = null
    // Clear memoization cache so next call picks up the email
    // 调用 getCoreUserData.cache.clear?.()，完成这一处局部操作。
    getCoreUserData.cache.clear?.()
  }
}

/**
 * Reset all user data caches. Call on auth changes (login/logout/account switch)
 * so the next getCoreUserData() call picks up fresh credentials and email.
 */
// resetUserCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetUserCache(): void {
  // cachedEmail 缓存更新为 `null`，确保共享工具后续读取最新状态。
  cachedEmail = null
  // emailFetchPromise 异步任务更新为 `null`，确保共享工具后续读取最新状态。
  emailFetchPromise = null
  // 调用 getCoreUserData.cache.clear?.()，完成这一处局部操作。
  getCoreUserData.cache.clear?.()
  // 调用 getGitEmail.cache.clear?.()，完成这一处局部操作。
  getGitEmail.cache.clear?.()
}

/**
 * Get core user data.
 * This is the base representation that gets transformed for different analytics providers.
 */
// getCoreUserData保存`memoize`，供共享工具后续处理使用。
export const getCoreUserData = memoize(
  (includeAnalyticsMetadata?: boolean): CoreUserData => {
    // deviceId读取`getOrCreateUserID`，供共享工具后续处理使用。
    const deviceId = getOrCreateUserID()
    // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const config = getGlobalConfig()

    // subscriptionType 先占位，稍后的条件分支会根据实际输入补齐它。
    let subscriptionType: string | undefined
    // rateLimitTier 先占位，稍后的条件分支会根据实际输入补齐它。
    let rateLimitTier: string | undefined
    // firstTokenTime 先占位，稍后的条件分支会根据实际输入补齐它。
    let firstTokenTime: number | undefined
    // 满足 `includeAnalyticsMetadata` 时，共享工具执行该分支。
    if (includeAnalyticsMetadata) {
      // subscriptionType更新为 `getSubscriptionType() ?? undefined`，确保共享工具后续读取最新状态。
      subscriptionType = getSubscriptionType() ?? undefined
      // rateLimitTier更新为 `getRateLimitTier() ?? undefined`，确保共享工具后续读取最新状态。
      rateLimitTier = getRateLimitTier() ?? undefined
      // 只有 `subscriptionType && config.claudeCodeFirstTokenDa` 满足时，共享工具才执行该分支。
      if (subscriptionType && config.claudeCodeFirstTokenDate) {
        // configFirstTokenTime 配置记录时间`Date`，供共享工具后续处理使用。
        const configFirstTokenTime = new Date(
          config.claudeCodeFirstTokenDate,
        ).getTime()
        // 满足 `!isNaN(configFirstTokenTime)` 时，共享工具执行该分支。
        if (!isNaN(configFirstTokenTime)) {
          // firstTokenTime更新为 `configFirstTokenTime`，确保共享工具后续读取最新状态。
          firstTokenTime = configFirstTokenTime
        }
      }
    }

    // Only include OAuth account data when actively using OAuth authentication
    // oauthAccount 数量读取`getOauthAccountInfo`，供共享工具后续处理使用。
    const oauthAccount = getOauthAccountInfo()
    // organizationUuid统计`oauthAccount?.organizationUuid`，供后续判断或组装使用。
    const organizationUuid = oauthAccount?.organizationUuid
    // accountUuid 数量 命名 `oauthAccount?.accountUuid`，让后续代码直接表达这个值的用途。
    const accountUuid = oauthAccount?.accountUuid

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      deviceId,
      sessionId: getSessionId(),
      email: getEmail(),
      appVersion: MACRO.VERSION,
      platform: getHostPlatformForAnalytics(),
      organizationUuid,
      accountUuid,
      userType: process.env.USER_TYPE,
      subscriptionType,
      rateLimitTier,
      firstTokenTime,
      ...(isEnvTruthy(process.env.GITHUB_ACTIONS) && {
        githubActionsMetadata: {
          actor: process.env.GITHUB_ACTOR,
          actorId: process.env.GITHUB_ACTOR_ID,
          repository: process.env.GITHUB_REPOSITORY,
          repositoryId: process.env.GITHUB_REPOSITORY_ID,
          repositoryOwner: process.env.GITHUB_REPOSITORY_OWNER,
          repositoryOwnerId: process.env.GITHUB_REPOSITORY_OWNER_ID,
        },
      }),
    }
  },
)

/**
 * Get user data for GrowthBook (same as core data with analytics metadata).
 */
// getUserForGrowthBook 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserForGrowthBook(): CoreUserData {
  // 返回 `getCoreUserData(true)`，作为共享工具这次计算的结果。
  return getCoreUserData(true)
}

// getEmail 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEmail(): string | undefined {
  // Return cached email if available (from async initialization)
  // `cachedEmail` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (cachedEmail !== null) {
    // 返回 `cachedEmail`，作为共享工具这次计算的结果。
    return cachedEmail
  }

  // Only include OAuth email when actively using OAuth authentication
  // oauthAccount 数量读取`getOauthAccountInfo`，供共享工具后续处理使用。
  const oauthAccount = getOauthAccountInfo()
  // 满足 `oauthAccount?.emailAddress` 时，共享工具执行该分支。
  if (oauthAccount?.emailAddress) {
    // 返回 `oauthAccount.emailAddress`，作为共享工具这次计算的结果。
    return oauthAccount.emailAddress
  }

  // Ant-only fallbacks below (no execSync)
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 满足 `process.env.COO_CREATOR` 时，共享工具执行该分支。
  if (process.env.COO_CREATOR) {
    // 返回 ``${process.env.COO_CREATOR}@anthropic.com``，作为共享工具这次计算的结果。
    return `${process.env.COO_CREATOR}@anthropic.com`
  }

  // If initUser() wasn't called, we return undefined instead of blocking
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

// getEmailAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getEmailAsync(): Promise<string | undefined> {
  // Only include OAuth email when actively using OAuth authentication
  // oauthAccount 数量读取`getOauthAccountInfo`，供共享工具后续处理使用。
  const oauthAccount = getOauthAccountInfo()
  // 满足 `oauthAccount?.emailAddress` 时，共享工具执行该分支。
  if (oauthAccount?.emailAddress) {
    // 返回 `oauthAccount.emailAddress`，作为共享工具这次计算的结果。
    return oauthAccount.emailAddress
  }

  // Ant-only fallbacks below
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 满足 `process.env.COO_CREATOR` 时，共享工具执行该分支。
  if (process.env.COO_CREATOR) {
    // 返回 ``${process.env.COO_CREATOR}@anthropic.com``，作为共享工具这次计算的结果。
    return `${process.env.COO_CREATOR}@anthropic.com`
  }

  // 返回 `getGitEmail()`，作为共享工具这次计算的结果。
  return getGitEmail()
}

/**
 * Get the user's git email from `git config user.email`.
 * Memoized so the subprocess only spawns once per process.
 */
// getGitEmail保存`memoize`，供共享工具后续处理使用。
export const getGitEmail = memoize(async (): Promise<string | undefined> => {
  // 结果保存`execa`，供共享工具后续处理使用。
  const result = await execa('git config --get user.email', {
    shell: true,
    reject: false,
    cwd: getCwd(),
  })
  // 返回 `result.exitCode === 0 && result.stdout`，作为共享工具这次计算的结果。
  return result.exitCode === 0 && result.stdout
    ? result.stdout.trim()
    : undefined
})
