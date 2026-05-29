/**
 * Policy Limits Service
 *
 * Fetches organization-level policy restrictions from the API and uses them
 * to disable CLI features. Follows the same patterns as remote managed settings
 * (fail open, ETag caching, background polling, retry logic).
 *
 * Eligibility:
 * - Console users (API key): All eligible
 * - OAuth users (Claude.ai): Only Team and Enterprise/C4E subscribers are eligible
 * - API fails open (non-blocking) - if fetch fails, continues without restrictions
 * - API returns empty restrictions for users without policy limits
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { readFileSync as fsReadFileSync } from 'fs'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { unlink, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_AI_INFERENCE_SCOPE,
  getOauthConfig,
  OAUTH_BETA_HEADER,
} from '../../constants/oauth.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getAnthropicApiKeyWithSource,
  getClaudeAIOAuthTokens,
} from '../../utils/auth.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../../utils/cleanupRegistry.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 classifyAxiosError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { classifyAxiosError } from '../../utils/errors.js'
// 复用 safeParseJSON 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { safeParseJSON } from '../../utils/json.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from '../../utils/model/providers.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../../utils/privacyLevel.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 引入 getRetryDelay，将 ../api/withRetry.js 中已经封装好的能力接到本文件流程里。
import { getRetryDelay } from '../api/withRetry.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  type PolicyLimitsFetchResult,
  type PolicyLimitsResponse,
  PolicyLimitsResponseSchema,
} from './types.js'

// isNodeError 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isNodeError(e: unknown): e is NodeJS.ErrnoException {
  // 返回 `e instanceof Error`，作为服务层 index这次计算的结果。
  return e instanceof Error
}

// Constants
// CACHE_FILENAME 文件数据固定为 `'policy-limits.json'`，作为服务层 index后续展示或比较的基准。
const CACHE_FILENAME = 'policy-limits.json'
// FETCH_TIMEOUT_MS 集合保存`10000 // 10 seconds`，供后续判断或组装使用。
const FETCH_TIMEOUT_MS = 10000 // 10 seconds
// DEFAULT_MAX_RETRIES 集合保存`5`，供后续判断或组装使用。
const DEFAULT_MAX_RETRIES = 5
// POLLING_INTERVAL_MS 集合保存`60 * 60 * 1000 // 1 hour`，供服务层 index后续判断或输出使用。
const POLLING_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

// Background polling state
// pollingIntervalId初始化为空值，后续分支会在有数据时补齐。
let pollingIntervalId: ReturnType<typeof setInterval> | null = null
// cleanupRegistered标记服务层 index是否启用对应路径。
let cleanupRegistered = false

// Promise that resolves when initial policy limits loading completes
// loadingCompletePromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let loadingCompletePromise: Promise<void> | null = null
// 这个回调绑定到 let loadingCompleteResolve: (() => void) | null = null，负责服务层 index在该局部场景下的响应。
let loadingCompleteResolve: (() => void) | null = null

// Timeout for the loading promise to prevent deadlocks
// LOADING_PROMISE_TIMEOUT_MS 集合 命名 `30000 // 30 seconds`，让后续代码直接表达这个值的用途。
const LOADING_PROMISE_TIMEOUT_MS = 30000 // 30 seconds

// Session-level cache for policy restrictions
// sessionCache 会话数据初始化为空值，后续分支会在有数据时补齐。
let sessionCache: PolicyLimitsResponse['restrictions'] | null = null

/**
 * Test-only sync reset. clearPolicyLimitsCache() does file I/O and is too
 * expensive for preload beforeEach; this only clears the module-level
 * singleton so downstream tests in the same shard see a clean slate.
 */
// _resetPolicyLimitsForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetPolicyLimitsForTesting(): void {
  // 调用 stopBackgroundPolling，触发服务层 index此处需要的副作用。
  stopBackgroundPolling()
  // sessionCache 会话数据更新为 `null`，确保服务层后续读取最新状态。
  sessionCache = null
  // loadingCompletePromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
  loadingCompletePromise = null
  // loadingCompleteResolve更新为 `null`，确保服务层后续读取最新状态。
  loadingCompleteResolve = null
}

/**
 * Initialize the loading promise for policy limits
 * This should be called early (e.g., in init.ts) to allow other systems
 * to await policy limits loading even if loadPolicyLimits() hasn't been called yet.
 *
 * Only creates the promise if the user is eligible for policy limits.
 * Includes a timeout to prevent deadlocks if loadPolicyLimits() is never called.
 */
// initializePolicyLimitsLoadingPromise 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializePolicyLimitsLoadingPromise(): void {
  // 满足 `loadingCompletePromise` 时，服务层 index执行该分支。
  if (loadingCompletePromise) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `isPolicyLimitsEligible()` 时，服务层 index执行该分支。
  if (isPolicyLimitsEligible()) {
    // loadingCompletePromise 异步任务更新为 `new Promise(resolve => {`，确保服务层后续读取最新状态。
    loadingCompletePromise = new Promise(resolve => {
      // loadingCompleteResolve更新为 `resolve`，确保服务层后续读取最新状态。
      loadingCompleteResolve = resolve

      // setTimeout 写入新的状态值，使服务层 index后续读取保持一致。
      setTimeout(() => {
        // 满足 `loadingCompleteResolve` 时，服务层 index执行该分支。
        if (loadingCompleteResolve) {
          // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            'Policy limits: Loading promise timed out, resolving anyway',
          )
          // 调用 loadingCompleteResolve，触发服务层 index此处需要的副作用。
          loadingCompleteResolve()
          // loadingCompleteResolve更新为 `null`，确保服务层后续读取最新状态。
          loadingCompleteResolve = null
        }
      }, LOADING_PROMISE_TIMEOUT_MS)
    })
  }
}

/**
 * Get the path to the policy limits cache file
 */
// getCachePath 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCachePath(): string {
  // 返回 `join(getClaudeConfigHomeDir(), CACHE_FILENAME)`，作为服务层 index这次计算的结果。
  return join(getClaudeConfigHomeDir(), CACHE_FILENAME)
}

/**
 * Get the policy limits API endpoint
 */
// getPolicyLimitsEndpoint 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPolicyLimitsEndpoint(): string {
  // 返回 ``${getOauthConfig().BASE_API_URL}/api/claude_code/policy_limits``，作为服务层 index这次计算的结果。
  return `${getOauthConfig().BASE_API_URL}/api/claude_code/policy_limits`
}

/**
 * Recursively sort all keys in an object for consistent hashing
 */
// sortKeysDeep 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function sortKeysDeep(obj: unknown): unknown {
  // 满足 `Array.isArray(obj)` 时，服务层 index执行该分支。
  if (Array.isArray(obj)) {
    // 返回 `obj.map(sortKeysDeep)`，作为服务层 index这次计算的结果。
    return obj.map(sortKeysDeep)
  }
  // 当 `obj !== null && typeof obj` 匹配 `'object'` 时，服务层 index执行对应分支。
  if (obj !== null && typeof obj === 'object') {
    // sorted 从空对象开始收集键值，后续按名称补齐内容。
    const sorted: Record<string, unknown> = {}
    // 循环处理 `const [key, value] of Object.entries(obj).sort(([a], [b]`，让服务层 index把同类条目按顺序走完。
    for (const [key, value] of Object.entries(obj).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      // sorted[key更新为 `sortKeysDeep(value)`，确保服务层 index后续读取最新状态。
      sorted[key] = sortKeysDeep(value)
    }
    // 返回 `sorted`，作为服务层 index这次计算的结果。
    return sorted
  }
  // 返回 `obj`，作为服务层 index这次计算的结果。
  return obj
}

/**
 * Compute a checksum from restrictions content for HTTP caching
 */
// computeChecksum 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeChecksum(
  restrictions: PolicyLimitsResponse['restrictions'],
): string {
  // sorted保存`sortKeysDeep`，供服务层 index后续处理使用。
  const sorted = sortKeysDeep(restrictions)
  // normalized保存`jsonStringify`，供服务层 index后续处理使用。
  const normalized = jsonStringify(sorted)
  // hash构建`createHash`，供服务层 index后续处理使用。
  const hash = createHash('sha256').update(normalized).digest('hex')
  // 返回 ``sha256:${hash}``，作为服务层 index这次计算的结果。
  return `sha256:${hash}`
}

/**
 * Check if the current user is eligible for policy limits.
 *
 * IMPORTANT: This function must NOT call getSettings() or any function that calls
 * getSettings() to avoid circular dependencies during settings loading.
 */
// isPolicyLimitsEligible 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPolicyLimitsEligible(): boolean {
  // 满足 `process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETC` 时，服务层 index执行该分支。
  if (process.env.CLAUDE_CODE_LOCAL_SKIP_REMOTE_PREFETCH === '1') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 3p provider users should not hit the policy limits endpoint
  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Custom base URL users should not hit the policy limits endpoint
  // 满足 `!isFirstPartyAnthropicBaseUrl()` 时，服务层 index执行该分支。
  if (!isFirstPartyAnthropicBaseUrl()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Console users (API key) are eligible if we can get the actual key
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 从 `getAnthropicApiKeyWithSource({` 解构 key，减少服务层 index对同一对象的重复访问。
    const { key: apiKey } = getAnthropicApiKeyWithSource({
      skipRetrievingKeyFromApiKeyHelper: true,
    })
    // 满足 `apiKey` 时，服务层 index执行该分支。
    if (apiKey) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  } catch {
    // No API key available - continue to check OAuth
  }

  // For OAuth users, check if they have Claude.ai tokens
  // token 列表读取`getClaudeAIOAuthTokens`，供服务层 index后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 满足 `!tokens?.accessToken` 时，服务层 index执行该分支。
  if (!tokens?.accessToken) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Must have Claude.ai inference scope
  // 满足 `!tokens.scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE)` 时，服务层 index执行该分支。
  if (!tokens.scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Only Team and Enterprise OAuth users are eligible — these orgs have
  // admin-configurable policy restrictions (e.g. allow_remote_sessions)
  // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
  if (
    tokens.subscriptionType !== 'enterprise' &&
    tokens.subscriptionType !== 'team'
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Wait for the initial policy limits loading to complete
 * Returns immediately if user is not eligible or loading has already completed
 */
// waitForPolicyLimitsToLoad 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function waitForPolicyLimitsToLoad(): Promise<void> {
  // 满足 `loadingCompletePromise` 时，服务层 index执行该分支。
  if (loadingCompletePromise) {
    // 等待 `loadingCompletePromise` 完成，再继续服务层 index的异步流程。
    await loadingCompletePromise
  }
}

/**
 * Get auth headers for policy limits without calling getSettings()
 * Supports both API key and OAuth authentication
 */
// getAuthHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAuthHeaders(): {
  headers: Record<string, string>
  error?: string
} {
  // Try API key first (for Console users)
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 从 `getAnthropicApiKeyWithSource({` 解构 key，减少服务层 index对同一对象的重复访问。
    const { key: apiKey } = getAnthropicApiKeyWithSource({
      skipRetrievingKeyFromApiKeyHelper: true,
    })
    // 满足 `apiKey` 时，服务层 index执行该分支。
    if (apiKey) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        headers: {
          'x-api-key': apiKey,
        },
      }
    }
  } catch {
    // No API key available - continue to check OAuth
  }

  // Fall back to OAuth tokens (for Claude.ai users)
  // oauthTokens 集合读取`getClaudeAIOAuthTokens`，供服务层 index后续处理使用。
  const oauthTokens = getClaudeAIOAuthTokens()
  // 满足 `oauthTokens?.accessToken` 时，服务层 index执行该分支。
  if (oauthTokens?.accessToken) {
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      headers: {
        Authorization: `Bearer ${oauthTokens.accessToken}`,
        'anthropic-beta': OAUTH_BETA_HEADER,
      },
    }
  }

  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return {
    headers: {},
    error: 'No authentication available',
  }
}

/**
 * Fetch policy limits with retry logic and exponential backoff
 */
// fetchWithRetry 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchWithRetry(
  cachedChecksum?: string,
): Promise<PolicyLimitsFetchResult> {
  // lastResult 命名 `null`，让后续代码直接表达这个值的用途。
  let lastResult: PolicyLimitsFetchResult | null = null

  // 循环处理 `let attempt = 1; attempt <= DEFAULT_MAX_RETRIES +`，让服务层 index逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= DEFAULT_MAX_RETRIES + 1; attempt++) {
    // lastResult更新为 `await fetchPolicyLimits(cachedChecksum)`，确保服务层后续读取最新状态。
    lastResult = await fetchPolicyLimits(cachedChecksum)

    // 满足 `lastResult.success` 时，服务层 index执行该分支。
    if (lastResult.success) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // 满足 `lastResult.skipRetry` 时，服务层 index执行该分支。
    if (lastResult.skipRetry) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // 满足 `attempt > DEFAULT_MAX_RETRIES` 时，服务层 index执行该分支。
    if (attempt > DEFAULT_MAX_RETRIES) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // delayMs 集合读取`getRetryDelay`，供服务层 index后续处理使用。
    const delayMs = getRetryDelay(attempt)
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Policy limits: Retry ${attempt}/${DEFAULT_MAX_RETRIES} after ${delayMs}ms`,
    )
    // 等待 `sleep(delayMs)` 完成，再继续服务层 index的异步流程。
    await sleep(delayMs)
  }

  // 返回 `lastResult!`，作为服务层 index这次计算的结果。
  return lastResult!
}

/**
 * Fetch policy limits (single attempt, no retries)
 */
// fetchPolicyLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchPolicyLimits(
  cachedChecksum?: string,
): Promise<PolicyLimitsFetchResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // authHeaders 集合读取`getAuthHeaders`，供服务层 index后续处理使用。
    const authHeaders = getAuthHeaders()
    // 满足 `authHeaders.error` 时，服务层 index执行该分支。
    if (authHeaders.error) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: 'Authentication required for policy limits',
        skipRetry: true,
      }
    }

    // endpoint读取`getPolicyLimitsEndpoint`，供服务层 index后续处理使用。
    const endpoint = getPolicyLimitsEndpoint()
    // 请求头 集中保存服务层 index要一起传递的字段。
    const headers: Record<string, string> = {
      ...authHeaders.headers,
      'User-Agent': getClaudeCodeUserAgent(),
    }

    // 满足 `cachedChecksum` 时，服务层 index执行该分支。
    if (cachedChecksum) {
      // headers['If-None-Match'更新为 ``"${cachedChecksum}"``，确保服务层 index后续读取最新状态。
      headers['If-None-Match'] = `"${cachedChecksum}"`
    }

    // 接口响应读取`axios.get`，供服务层 index后续处理使用。
    const response = await axios.get(endpoint, {
      headers,
      timeout: FETCH_TIMEOUT_MS,
      // 这个回调绑定到 validateStatus: status =>，负责服务层 index在该局部场景下的响应。
      validateStatus: status =>
        status === 200 || status === 304 || status === 404,
    })

    // Handle 304 Not Modified - cached version is still valid
    // 满足 `response.status === 304` 时，服务层 index执行该分支。
    if (response.status === 304) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: Using cached restrictions (304)')
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        restrictions: null, // Signal that cache is valid
        etag: cachedChecksum,
      }
    }

    // Handle 404 Not Found - no policy limits exist or feature not enabled
    // 满足 `response.status === 404` 时，服务层 index执行该分支。
    if (response.status === 404) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: No restrictions found (404)')
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        restrictions: {},
        etag: undefined,
      }
    }

    // 解析结果保存`PolicyLimitsResponseSchema`，供服务层 index后续处理使用。
    const parsed = PolicyLimitsResponseSchema().safeParse(response.data)
    // parsed.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!parsed.success) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Policy limits: Invalid response format - ${parsed.error.message}`,
      )
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: 'Invalid policy limits format',
      }
    }

    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Policy limits: Fetched successfully')
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      restrictions: parsed.data.restrictions,
    }
  } catch (error) {
    // 404 is handled above via validateStatus, so it won't reach here
    // 从 `classifyAxiosError(error)` 解构 kind、message，减少服务层 index对同一对象的重复访问。
    const { kind, message } = classifyAxiosError(error)
    // 按照 kind 的取值选择服务层 index的具体处理分支。
    switch (kind) {
      case 'auth':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: 'Not authorized for policy limits',
          skipRetry: true,
        }
      case 'timeout':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Policy limits request timeout' }
      case 'network':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Cannot connect to server' }
      default:
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: message }
    }
  }
}

/**
 * Load restrictions from cache file
 */
// sync IO: called from sync context (getRestrictionsFromCache -> isPolicyAllowed)
// loadCachedRestrictions 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function loadCachedRestrictions(): PolicyLimitsResponse['restrictions'] | null {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 文本内容保存`fsReadFileSync`，供服务层 index后续处理使用。
    const content = fsReadFileSync(getCachePath(), 'utf-8')
    // data保存`safeParseJSON`，供服务层 index后续处理使用。
    const data = safeParseJSON(content, false)
    // 解析结果保存`PolicyLimitsResponseSchema`，供服务层 index后续处理使用。
    const parsed = PolicyLimitsResponseSchema().safeParse(data)
    // parsed.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!parsed.success) {
      // 返回 `null`，作为服务层 index这次计算的结果。
      return null
    }

    // 返回 `parsed.data.restrictions`，作为服务层 index这次计算的结果。
    return parsed.data.restrictions
  } catch {
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }
}

/**
 * Save restrictions to cache file
 */
// saveCachedRestrictions 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveCachedRestrictions(
  restrictions: PolicyLimitsResponse['restrictions'],
): Promise<void> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 路径读取`getCachePath`，供服务层 index后续处理使用。
    const path = getCachePath()
    // data 集中保存服务层 index要一起传递的字段。
    const data: PolicyLimitsResponse = { restrictions }
    // 等待 `writeFile(path, jsonStringify(data, null, 2), {` 完成，再继续服务层 index的异步流程。
    await writeFile(path, jsonStringify(data, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    })
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Policy limits: Saved to ${path}`)
  } catch (error) {
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Policy limits: Failed to save - ${error instanceof Error ? error.message : 'unknown error'}`,
    )
  }
}

/**
 * Fetch and load policy limits with file caching
 * Fails open - returns null if fetch fails and no cache exists
 */
// fetchAndLoadPolicyLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchAndLoadPolicyLimits(): Promise<
  PolicyLimitsResponse['restrictions'] | null
> {
  // 满足 `!isPolicyLimitsEligible()` 时，服务层 index执行该分支。
  if (!isPolicyLimitsEligible()) {
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }

  // cachedRestrictions 缓存读取`loadCachedRestrictions`，供服务层 index后续处理使用。
  const cachedRestrictions = loadCachedRestrictions()

  // cachedChecksum 缓存保存`cachedRestrictions`，供后续判断或组装使用。
  const cachedChecksum = cachedRestrictions
    ? computeChecksum(cachedRestrictions)
    : undefined

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 结果读取`fetchWithRetry`，供服务层 index后续处理使用。
    const result = await fetchWithRetry(cachedChecksum)

    // result.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!result.success) {
      // 满足 `cachedRestrictions` 时，服务层 index执行该分支。
      if (cachedRestrictions) {
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Policy limits: Using stale cache after fetch failure')
        // sessionCache 会话数据更新为 `cachedRestrictions`，确保服务层后续读取最新状态。
        sessionCache = cachedRestrictions
        // 返回 `cachedRestrictions`，作为服务层 index这次计算的结果。
        return cachedRestrictions
      }
      // 返回 `null`，作为服务层 index这次计算的结果。
      return null
    }

    // Handle 304 Not Modified
    // 组合条件 `result.restrictions === null && cachedRestrictions` 成立时，服务层 index才启用这条专门路径。
    if (result.restrictions === null && cachedRestrictions) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: Cache still valid (304 Not Modified)')
      // sessionCache 会话数据更新为 `cachedRestrictions`，确保服务层后续读取最新状态。
      sessionCache = cachedRestrictions
      // 返回 `cachedRestrictions`，作为服务层 index这次计算的结果。
      return cachedRestrictions
    }

    // newRestrictions 集合标记服务层 index是否启用对应路径。
    const newRestrictions = result.restrictions || {}
    // hasContent记录 `Object.keys` 是否成立，服务层 index随后按该结果分支。
    const hasContent = Object.keys(newRestrictions).length > 0

    // 满足 `hasContent` 时，服务层 index执行该分支。
    if (hasContent) {
      // sessionCache 会话数据更新为 `newRestrictions`，确保服务层后续读取最新状态。
      sessionCache = newRestrictions
      // 等待 `saveCachedRestrictions(newRestrictions)` 完成，再继续服务层 index的异步流程。
      await saveCachedRestrictions(newRestrictions)
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: Applied new restrictions successfully')
      // 返回 `newRestrictions`，作为服务层 index这次计算的结果。
      return newRestrictions
    }

    // Empty restrictions (404 response) - delete cached file if it exists
    // sessionCache 会话数据更新为 `newRestrictions`，确保服务层后续读取最新状态。
    sessionCache = newRestrictions
    // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `unlink(getCachePath())` 完成，再继续服务层 index的异步流程。
      await unlink(getCachePath())
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: Deleted cached file (404 response)')
    } catch (e) {
      // `isNodeError(e) && e.code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
      if (isNodeError(e) && e.code !== 'ENOENT') {
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Policy limits: Failed to delete cached file - ${e.message}`,
        )
      }
    }
    // 返回 `newRestrictions`，作为服务层 index这次计算的结果。
    return newRestrictions
  } catch {
    // 满足 `cachedRestrictions` 时，服务层 index执行该分支。
    if (cachedRestrictions) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: Using stale cache after error')
      // sessionCache 会话数据更新为 `cachedRestrictions`，确保服务层后续读取最新状态。
      sessionCache = cachedRestrictions
      // 返回 `cachedRestrictions`，作为服务层 index这次计算的结果。
      return cachedRestrictions
    }
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }
}

/**
 * Policies that default to denied when essential-traffic-only mode is active
 * and the policy cache is unavailable. Without this, a cache miss or network
 * timeout would silently re-enable these features for HIPAA orgs.
 */
// ESSENTIAL_TRAFFIC_DENY_ON_MISS 集合保存`Set`，供服务层 index后续处理使用。
const ESSENTIAL_TRAFFIC_DENY_ON_MISS = new Set(['allow_product_feedback'])

/**
 * Check if a specific policy is allowed
 * Returns true if the policy is unknown, unavailable, or explicitly allowed (fail open).
 * Exception: policies in ESSENTIAL_TRAFFIC_DENY_ON_MISS fail closed when
 * essential-traffic-only mode is active and the cache is unavailable.
 */
// isPolicyAllowed 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPolicyAllowed(policy: string): boolean {
  // restrictions 集合读取`getRestrictionsFromCache`，供服务层 index后续处理使用。
  const restrictions = getRestrictionsFromCache()
  // restrictions 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!restrictions) {
    // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
    if (
      isEssentialTrafficOnly() &&
      ESSENTIAL_TRAFFIC_DENY_ON_MISS.has(policy)
    ) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 返回 `true // fail open`，作为服务层 index这次计算的结果。
    return true // fail open
  }
  // restriction读取 `restrictions[policy]` 对应条目，后续围绕该成员继续处理。
  const restriction = restrictions[policy]
  // restriction缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!restriction) {
    // 返回 `true // unknown policy = allowed`，作为服务层 index这次计算的结果。
    return true // unknown policy = allowed
  }
  // 返回 `restriction.allowed`，作为服务层 index这次计算的结果。
  return restriction.allowed
}

/**
 * Get restrictions synchronously from session cache or file
 */
// getRestrictionsFromCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRestrictionsFromCache():
  | PolicyLimitsResponse['restrictions']
  | null {
  // 满足 `!isPolicyLimitsEligible()` 时，服务层 index执行该分支。
  if (!isPolicyLimitsEligible()) {
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }

  // 满足 `sessionCache` 时，服务层 index执行该分支。
  if (sessionCache) {
    // 返回 `sessionCache`，作为服务层 index这次计算的结果。
    return sessionCache
  }

  // cachedRestrictions 缓存读取`loadCachedRestrictions`，供服务层 index后续处理使用。
  const cachedRestrictions = loadCachedRestrictions()
  // 满足 `cachedRestrictions` 时，服务层 index执行该分支。
  if (cachedRestrictions) {
    // sessionCache 会话数据更新为 `cachedRestrictions`，确保服务层后续读取最新状态。
    sessionCache = cachedRestrictions
    // 返回 `cachedRestrictions`，作为服务层 index这次计算的结果。
    return cachedRestrictions
  }

  // 返回 `null`，作为服务层 index这次计算的结果。
  return null
}

/**
 * Load policy limits during CLI initialization
 * Fails open - if fetch fails, continues without restrictions
 * Also starts background polling to pick up changes mid-session
 */
// loadPolicyLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadPolicyLimits(): Promise<void> {
  // 组合条件 `isPolicyLimitsEligible() && !loadingCompletePromise` 成立时，服务层 index才启用这条专门路径。
  if (isPolicyLimitsEligible() && !loadingCompletePromise) {
    // loadingCompletePromise 异步任务更新为 `new Promise(resolve => {`，确保服务层后续读取最新状态。
    loadingCompletePromise = new Promise(resolve => {
      // loadingCompleteResolve更新为 `resolve`，确保服务层后续读取最新状态。
      loadingCompleteResolve = resolve
    })
  }

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fetchAndLoadPolicyLimits()` 完成，再继续服务层 index的异步流程。
    await fetchAndLoadPolicyLimits()

    // 满足 `isPolicyLimitsEligible()` 时，服务层 index执行该分支。
    if (isPolicyLimitsEligible()) {
      // 调用 startBackgroundPolling，触发服务层 index此处需要的副作用。
      startBackgroundPolling()
    }
  } finally {
    // 满足 `loadingCompleteResolve` 时，服务层 index执行该分支。
    if (loadingCompleteResolve) {
      // 调用 loadingCompleteResolve，触发服务层 index此处需要的副作用。
      loadingCompleteResolve()
      // loadingCompleteResolve更新为 `null`，确保服务层后续读取最新状态。
      loadingCompleteResolve = null
    }
  }
}

/**
 * Refresh policy limits asynchronously (for auth state changes)
 * Used when login occurs
 */
// refreshPolicyLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshPolicyLimits(): Promise<void> {
  // 等待 `clearPolicyLimitsCache()` 完成，再继续服务层 index的异步流程。
  await clearPolicyLimitsCache()

  // 满足 `!isPolicyLimitsEligible()` 时，服务层 index执行该分支。
  if (!isPolicyLimitsEligible()) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 等待 `fetchAndLoadPolicyLimits()` 完成，再继续服务层 index的异步流程。
  await fetchAndLoadPolicyLimits()
  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Policy limits: Refreshed after auth change')
}

/**
 * Clear all policy limits (session, persistent, and stop polling)
 */
// clearPolicyLimitsCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearPolicyLimitsCache(): Promise<void> {
  // 调用 stopBackgroundPolling，触发服务层 index此处需要的副作用。
  stopBackgroundPolling()

  // sessionCache 会话数据更新为 `null`，确保服务层后续读取最新状态。
  sessionCache = null

  // loadingCompletePromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
  loadingCompletePromise = null
  // loadingCompleteResolve更新为 `null`，确保服务层后续读取最新状态。
  loadingCompleteResolve = null

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `unlink(getCachePath())` 完成，再继续服务层 index的异步流程。
    await unlink(getCachePath())
  } catch {
    // Ignore errors (including ENOENT when file doesn't exist)
  }
}

/**
 * Background polling callback
 */
// pollPolicyLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function pollPolicyLimits(): Promise<void> {
  // 满足 `!isPolicyLimitsEligible()` 时，服务层 index执行该分支。
  if (!isPolicyLimitsEligible()) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // previousCache 缓存保存`jsonStringify`，供服务层 index后续处理使用。
  const previousCache = sessionCache ? jsonStringify(sessionCache) : null

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fetchAndLoadPolicyLimits()` 完成，再继续服务层 index的异步流程。
    await fetchAndLoadPolicyLimits()

    // newCache 缓存保存`jsonStringify`，供服务层 index后续处理使用。
    const newCache = sessionCache ? jsonStringify(sessionCache) : null
    // `newCache` 与 `previousCache` 不一致时刷新派生状态，避免使用过期结果。
    if (newCache !== previousCache) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Policy limits: Changed during background poll')
    }
  } catch {
    // Don't fail closed for background polling
  }
}

/**
 * Start background polling for policy limits
 */
// startBackgroundPolling 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startBackgroundPolling(): void {
  // `pollingIntervalId` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (pollingIntervalId !== null) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `!isPolicyLimitsEligible()` 时，服务层 index执行该分支。
  if (!isPolicyLimitsEligible()) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // pollingIntervalId更新为 `setInterval(() => {`，确保服务层后续读取最新状态。
  pollingIntervalId = setInterval(() => {
    // 显式忽略 `pollPolicyLimits()` 的返回值，只保留它触发的副作用。
    void pollPolicyLimits()
  }, POLLING_INTERVAL_MS)
  // 调用 pollingIntervalId.unref，触发服务层 index此处需要的副作用。
  pollingIntervalId.unref()

  // cleanupRegistered缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!cleanupRegistered) {
    // cleanupRegistered更新为 `true`，确保服务层后续读取最新状态。
    cleanupRegistered = true
    // 调用 registerCleanup，触发服务层 index此处需要的副作用。
    registerCleanup(async () => stopBackgroundPolling())
  }
}

/**
 * Stop background polling for policy limits
 */
// stopBackgroundPolling 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopBackgroundPolling(): void {
  // `pollingIntervalId` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (pollingIntervalId !== null) {
    // 调用 clearInterval，触发服务层 index此处需要的副作用。
    clearInterval(pollingIntervalId)
    // pollingIntervalId更新为 `null`，确保服务层后续读取最新状态。
    pollingIntervalId = null
  }
}
