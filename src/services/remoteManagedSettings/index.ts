/**
 * Remote Managed Settings Service
 *
 * Manages fetching, caching, and validation of remote-managed settings
 * for enterprise customers. Uses checksum-based validation to minimize
 * network traffic and provides graceful degradation on failures.
 *
 * Eligibility:
 * - Console users (API key): All eligible
 * - OAuth users (Claude.ai): Only Enterprise/C4E and Team subscribers are eligible
 * - API fails open (non-blocking) - if fetch fails, continues without remote settings
 * - API returns empty settings for users without managed settings
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { open, unlink } from 'fs/promises'
// 引入 getOauthConfig、OAUTH_BETA_HEADER，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig, OAUTH_BETA_HEADER } from '../../constants/oauth.js'
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
// 复用 classifyAxiosError、getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { classifyAxiosError, getErrnoCode } from '../../utils/errors.js'
// 复用 settingsChangeDetector 工具函数，把通用处理留在 ../../utils/settings/changeDetector.js 中维护。
import { settingsChangeDetector } from '../../utils/settings/changeDetector.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  type SettingsJson,
  SettingsSchema,
} from '../../utils/settings/types.js'
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
  checkManagedSettingsSecurity,
  handleSecurityCheckResult,
} from './securityCheck.jsx'
// 引入 isRemoteManagedSettingsEligible、resetSyncCache，将 ./syncCache.js 中已经封装好的能力接到本文件流程里。
import { isRemoteManagedSettingsEligible, resetSyncCache } from './syncCache.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  getRemoteManagedSettingsSyncFromCache,
  getSettingsPath,
  setSessionCache,
} from './syncCacheState.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  type RemoteManagedSettingsFetchResult,
  RemoteManagedSettingsResponseSchema,
} from './types.js'

// Constants
// SETTINGS_TIMEOUT_MS 集合 命名 `10000 // 10 seconds for settings fetch`，让后续代码直接表达这个值的用途。
const SETTINGS_TIMEOUT_MS = 10000 // 10 seconds for settings fetch
// DEFAULT_MAX_RETRIES 集合保存`5`，供后续判断或组装使用。
const DEFAULT_MAX_RETRIES = 5
// POLLING_INTERVAL_MS 集合保存`60 * 60 * 1000 // 1 hour`，供服务层 index后续判断或输出使用。
const POLLING_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

// Background polling state
// pollingIntervalId初始化为空值，后续分支会在有数据时补齐。
let pollingIntervalId: ReturnType<typeof setInterval> | null = null

// Promise that resolves when initial remote settings loading completes
// This allows other systems to wait for remote settings before initializing
// loadingCompletePromise 异步任务 命名 `null`，让后续代码直接表达这个值的用途。
let loadingCompletePromise: Promise<void> | null = null
// 这个回调绑定到 let loadingCompleteResolve: (() => void) | null = null，负责服务层 index在该局部场景下的响应。
let loadingCompleteResolve: (() => void) | null = null

// Timeout for the loading promise to prevent deadlocks if loadRemoteManagedSettings() is never called
// (e.g., in Agent SDK tests that don't go through main.tsx)
// LOADING_PROMISE_TIMEOUT_MS 集合 命名 `30000 // 30 seconds`，让后续代码直接表达这个值的用途。
const LOADING_PROMISE_TIMEOUT_MS = 30000 // 30 seconds

/**
 * Initialize the loading promise for remote managed settings
 * This should be called early (e.g., in init.ts) to allow other systems
 * to await remote settings loading even if loadRemoteManagedSettings()
 * hasn't been called yet.
 *
 * Only creates the promise if the user is eligible for remote settings.
 * Includes a timeout to prevent deadlocks if loadRemoteManagedSettings() is never called.
 */
// initializeRemoteManagedSettingsLoadingPromise 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initializeRemoteManagedSettingsLoadingPromise(): void {
  // 满足 `loadingCompletePromise` 时，服务层 index执行该分支。
  if (loadingCompletePromise) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `isRemoteManagedSettingsEligible()` 时，服务层 index执行该分支。
  if (isRemoteManagedSettingsEligible()) {
    // loadingCompletePromise 异步任务更新为 `new Promise(resolve => {`，确保服务层后续读取最新状态。
    loadingCompletePromise = new Promise(resolve => {
      // loadingCompleteResolve更新为 `resolve`，确保服务层后续读取最新状态。
      loadingCompleteResolve = resolve

      // Set a timeout to resolve the promise even if loadRemoteManagedSettings() is never called
      // This prevents deadlocks in Agent SDK tests and other non-CLI contexts
      // setTimeout 写入新的状态值，使服务层 index后续读取保持一致。
      setTimeout(() => {
        // 满足 `loadingCompleteResolve` 时，服务层 index执行该分支。
        if (loadingCompleteResolve) {
          // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            'Remote settings: Loading promise timed out, resolving anyway',
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
 * Get the remote settings API endpoint
 * Uses the OAuth config base API URL
 */
// getRemoteManagedSettingsEndpoint 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRemoteManagedSettingsEndpoint() {
  // 返回 ``${getOauthConfig().BASE_API_URL}/api/claude_code/settings``，作为服务层 index这次计算的结果。
  return `${getOauthConfig().BASE_API_URL}/api/claude_code/settings`
}

/**
 * Recursively sort all keys in an object to match Python's json.dumps(sort_keys=True)
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
    // 逐项读取 `Object.keys(obj).sort()` 中的key，按输入顺序推进服务层 index。
    for (const key of Object.keys(obj).sort()) {
      // sorted[key更新为 `sortKeysDeep((obj as Record<string, unknown>)[key])`，确保服务层 index后续读取最新状态。
      sorted[key] = sortKeysDeep((obj as Record<string, unknown>)[key])
    }
    // 返回 `sorted`，作为服务层 index这次计算的结果。
    return sorted
  }
  // 返回 `obj`，作为服务层 index这次计算的结果。
  return obj
}

/**
 * Compute checksum from settings content for HTTP caching
 * Must match server's Python: json.dumps(settings, sort_keys=True, separators=(",", ":"))
 * Exported for testing to verify compatibility with server-side implementation
 */
// computeChecksumFromSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function computeChecksumFromSettings(settings: SettingsJson): string {
  // sorted保存`sortKeysDeep`，供服务层 index后续处理使用。
  const sorted = sortKeysDeep(settings)
  // No spaces after separators to match Python's separators=(",", ":")
  // normalized保存`jsonStringify`，供服务层 index后续处理使用。
  const normalized = jsonStringify(sorted)
  // hash构建`createHash`，供服务层 index后续处理使用。
  const hash = createHash('sha256').update(normalized).digest('hex')
  // 返回 ``sha256:${hash}``，作为服务层 index这次计算的结果。
  return `sha256:${hash}`
}

/**
 * Check if the current user is eligible for remote managed settings
 * This is the public API for other systems to check eligibility
 * Used to determine if they should wait for remote settings to load
 */
// isEligibleForRemoteManagedSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEligibleForRemoteManagedSettings(): boolean {
  // 返回 `isRemoteManagedSettingsEligible()`，作为服务层 index这次计算的结果。
  return isRemoteManagedSettingsEligible()
}

/**
 * Wait for the initial remote settings loading to complete
 * Returns immediately if:
 * - User is not eligible for remote settings
 * - Loading has already completed
 * - Loading was never started
 */
// waitForRemoteManagedSettingsToLoad 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function waitForRemoteManagedSettingsToLoad(): Promise<void> {
  // 满足 `loadingCompletePromise` 时，服务层 index执行该分支。
  if (loadingCompletePromise) {
    // 等待 `loadingCompletePromise` 完成，再继续服务层 index的异步流程。
    await loadingCompletePromise
  }
}

/**
 * Get auth headers for remote settings without calling getSettings()
 * This avoids circular dependencies during settings loading
 * Supports both API key and OAuth authentication
 */
// getRemoteSettingsAuthHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRemoteSettingsAuthHeaders(): {
  headers: Record<string, string>
  error?: string
} {
  // Try API key first (for Console users)
  // Skip apiKeyHelper to avoid circular dependency with getSettings()
  // Wrap in try-catch because getAnthropicApiKeyWithSource throws in CI/test environments
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
 * Fetch remote settings with retry logic and exponential backoff
 * Uses existing codebase retry utilities for consistency
 */
// fetchWithRetry 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchWithRetry(
  cachedChecksum?: string,
): Promise<RemoteManagedSettingsFetchResult> {
  // lastResult 命名 `null`，让后续代码直接表达这个值的用途。
  let lastResult: RemoteManagedSettingsFetchResult | null = null

  // 循环处理 `let attempt = 1; attempt <= DEFAULT_MAX_RETRIES +`，让服务层 index逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= DEFAULT_MAX_RETRIES + 1; attempt++) {
    // lastResult更新为 `await fetchRemoteManagedSettings(cachedChecksum)`，确保服务层后续读取最新状态。
    lastResult = await fetchRemoteManagedSettings(cachedChecksum)

    // Return immediately on success
    // 满足 `lastResult.success` 时，服务层 index执行该分支。
    if (lastResult.success) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // Don't retry if the error is not retryable (e.g., auth errors)
    // 满足 `lastResult.skipRetry` 时，服务层 index执行该分支。
    if (lastResult.skipRetry) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // If we've exhausted retries, return the last error
    // 满足 `attempt > DEFAULT_MAX_RETRIES` 时，服务层 index执行该分支。
    if (attempt > DEFAULT_MAX_RETRIES) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // Calculate delay and wait before next retry
    // delayMs 集合读取`getRetryDelay`，供服务层 index后续处理使用。
    const delayMs = getRetryDelay(attempt)
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Remote settings: Retry ${attempt}/${DEFAULT_MAX_RETRIES} after ${delayMs}ms`,
    )
    // 等待 `sleep(delayMs)` 完成，再继续服务层 index的异步流程。
    await sleep(delayMs)
  }

  // Should never reach here, but TypeScript needs it
  // 返回 `lastResult!`，作为服务层 index这次计算的结果。
  return lastResult!
}

/**
 * Fetch the full remote settings (single attempt, no retries)
 * Optionally pass a cached checksum for ETag-based caching
 */
// fetchRemoteManagedSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchRemoteManagedSettings(
  cachedChecksum?: string,
): Promise<RemoteManagedSettingsFetchResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // Ensure OAuth token is fresh before fetching settings
    // This prevents 401 errors from stale cached tokens
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // Use local auth header getter to avoid circular dependency with getSettings()
    // authHeaders 集合读取`getRemoteSettingsAuthHeaders`，供服务层 index后续处理使用。
    const authHeaders = getRemoteSettingsAuthHeaders()
    // 满足 `authHeaders.error` 时，服务层 index执行该分支。
    if (authHeaders.error) {
      // Auth errors should not be retried - return a special flag to skip retries
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: `Authentication required for remote settings`,
        skipRetry: true,
      }
    }

    // endpoint读取`getRemoteManagedSettingsEndpoint`，供服务层 index后续处理使用。
    const endpoint = getRemoteManagedSettingsEndpoint()
    // 请求头 集中保存服务层 index要一起传递的字段。
    const headers: Record<string, string> = {
      ...authHeaders.headers,
      'User-Agent': getClaudeCodeUserAgent(),
    }

    // Add If-None-Match header for ETag-based caching
    // 满足 `cachedChecksum` 时，服务层 index执行该分支。
    if (cachedChecksum) {
      // headers['If-None-Match'更新为 ``"${cachedChecksum}"``，确保服务层 index后续读取最新状态。
      headers['If-None-Match'] = `"${cachedChecksum}"`
    }

    // 接口响应读取`axios.get`，供服务层 index后续处理使用。
    const response = await axios.get(endpoint, {
      headers,
      timeout: SETTINGS_TIMEOUT_MS,
      // Allow 204, 304, and 404 responses without treating them as errors.
      // 204/404 are returned when no settings exist for the user or the feature flag is off.
      // 这个回调绑定到 validateStatus: status =>，负责服务层 index在该局部场景下的响应。
      validateStatus: status =>
        status === 200 || status === 204 || status === 304 || status === 404,
    })

    // Handle 304 Not Modified - cached version is still valid
    // 满足 `response.status === 304` 时，服务层 index执行该分支。
    if (response.status === 304) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Remote settings: Using cached settings (304)')
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        settings: null, // Signal that cache is valid
        checksum: cachedChecksum,
      }
    }

    // Handle 204 No Content / 404 Not Found - no settings exist or feature flag is off.
    // Return empty object (not null) so callers don't fall back to cached settings.
    // 组合条件 `response.status === 204 || response.status === 404` 成立时，服务层 index才启用这条专门路径。
    if (response.status === 204 || response.status === 404) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Remote settings: No settings found (${response.status})`)
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        settings: {},
        checksum: undefined,
      }
    }

    // 解析结果保存`RemoteManagedSettingsResponseSchema`，供服务层 index后续处理使用。
    const parsed = RemoteManagedSettingsResponseSchema().safeParse(
      response.data,
    )
    // parsed.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!parsed.success) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Remote settings: Invalid response format - ${parsed.error.message}`,
      )
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: 'Invalid remote settings format',
      }
    }

    // Full validation of settings structure
    // settingsValidation保存`SettingsSchema`，供服务层 index后续处理使用。
    const settingsValidation = SettingsSchema().safeParse(parsed.data.settings)
    // settingsValidation.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!settingsValidation.success) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Remote settings: Settings validation failed - ${settingsValidation.error.message}`,
      )
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: 'Invalid settings structure',
      }
    }

    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Remote settings: Fetched successfully')
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      settings: settingsValidation.data,
      checksum: parsed.data.checksum,
    }
  } catch (error) {
    // 从 `classifyAxiosError(error)` 解构 kind、status、message，减少服务层 index对同一对象的重复访问。
    const { kind, status, message } = classifyAxiosError(error)
    // 满足 `status === 404` 时，服务层 index执行该分支。
    if (status === 404) {
      // 404 means no remote settings configured
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: true, settings: {}, checksum: '' }
    }
    // 按照 kind 的取值选择服务层 index的具体处理分支。
    switch (kind) {
      case 'auth':
        // Auth errors (401, 403) should not be retried - the API key doesn't have access
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: 'Not authorized for remote settings',
          skipRetry: true,
        }
      case 'timeout':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Remote settings request timeout' }
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
 * Save remote settings to file
 * Stores raw settings JSON (checksum is computed on-demand when needed)
 */
// saveSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function saveSettings(settings: SettingsJson): Promise<void> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 路径读取`getSettingsPath`，供服务层 index后续处理使用。
    const path = getSettingsPath()
    // handle保存`open`，供服务层 index后续处理使用。
    const handle = await open(path, 'w', 0o600)
    // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
    try {
      // 等待 `handle.writeFile(jsonStringify(settings, null, 2), {` 完成，再继续服务层 index的异步流程。
      await handle.writeFile(jsonStringify(settings, null, 2), {
        encoding: 'utf-8',
      })
      // 等待 `handle.datasync()` 完成，再继续服务层 index的异步流程。
      await handle.datasync()
    } finally {
      // 等待 `handle.close()` 完成，再继续服务层 index的异步流程。
      await handle.close()
    }
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Remote settings: Saved to ${path}`)
  } catch (error) {
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Remote settings: Failed to save - ${error instanceof Error ? error.message : 'unknown error'}`,
    )
    // Ignore save errors - we'll refetch on next startup
  }
}

/**
 * Clear all remote settings (session, persistent, and stop polling)
 */
// clearRemoteManagedSettingsCache 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearRemoteManagedSettingsCache(): Promise<void> {
  // Stop background polling
  // 调用 stopBackgroundPolling，触发服务层 index此处需要的副作用。
  stopBackgroundPolling()

  // Clear session cache
  // 调用 resetSyncCache，触发服务层 index此处需要的副作用。
  resetSyncCache()

  // Clear loading promise state
  // loadingCompletePromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
  loadingCompletePromise = null
  // loadingCompleteResolve更新为 `null`，确保服务层后续读取最新状态。
  loadingCompleteResolve = null

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 路径读取`getSettingsPath`，供服务层 index后续处理使用。
    const path = getSettingsPath()
    // 等待 `unlink(path)` 完成，再继续服务层 index的异步流程。
    await unlink(path)
  } catch {
    // Ignore errors when clearing file (ENOENT is expected)
  }
}

/**
 * Fetch and load remote settings with file caching
 * Internal function that handles the full load/fetch logic
 * Fails open - returns null if fetch fails and no cache exists
 */
// fetchAndLoadRemoteManagedSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchAndLoadRemoteManagedSettings(): Promise<SettingsJson | null> {
  // 满足 `!isRemoteManagedSettingsEligible()` 时，服务层 index执行该分支。
  if (!isRemoteManagedSettingsEligible()) {
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }

  // Load cached settings from file
  // cachedSettings 缓存读取`getRemoteManagedSettingsSyncFromCache`，供服务层 index后续处理使用。
  const cachedSettings = getRemoteManagedSettingsSyncFromCache()

  // Compute checksum locally from cached settings for HTTP caching validation
  // cachedChecksum 缓存保存`cachedSettings`，供后续判断或组装使用。
  const cachedChecksum = cachedSettings
    ? computeChecksumFromSettings(cachedSettings)
    : undefined

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // Fetch settings from API with retry logic
    // 结果读取`fetchWithRetry`，供服务层 index后续处理使用。
    const result = await fetchWithRetry(cachedChecksum)

    // result.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!result.success) {
      // On fetch failure, use stale file if available (graceful degradation)
      // 满足 `cachedSettings` 时，服务层 index执行该分支。
      if (cachedSettings) {
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Remote settings: Using stale cache after fetch failure',
        )
        // setSessionCache 写入新的状态值，使服务层 index后续读取保持一致。
        setSessionCache(cachedSettings)
        // 返回 `cachedSettings`，作为服务层 index这次计算的结果。
        return cachedSettings
      }
      // No cache available - fail open, continue without remote settings
      // 返回 `null`，作为服务层 index这次计算的结果。
      return null
    }

    // Handle 304 Not Modified - cached settings are still valid
    // 组合条件 `result.settings === null && cachedSettings` 成立时，服务层 index才启用这条专门路径。
    if (result.settings === null && cachedSettings) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Remote settings: Cache still valid (304 Not Modified)')
      // setSessionCache 写入新的状态值，使服务层 index后续读取保持一致。
      setSessionCache(cachedSettings)
      // 返回 `cachedSettings`，作为服务层 index这次计算的结果。
      return cachedSettings
    }

    // Save new settings to file (only if non-empty)
    // newSettings 集合标记服务层 index是否启用对应路径。
    const newSettings = result.settings || {}
    // hasContent记录 `Object.keys` 是否成立，服务层 index随后按该结果分支。
    const hasContent = Object.keys(newSettings).length > 0

    // 满足 `hasContent` 时，服务层 index执行该分支。
    if (hasContent) {
      // Check for dangerous settings changes before applying
      // securityResult读取`checkManagedSettingsSecurity`，供服务层 index后续处理使用。
      const securityResult = await checkManagedSettingsSecurity(
        cachedSettings,
        newSettings,
      )
      // 满足 `!handleSecurityCheckResult(securityResult)` 时，服务层 index执行该分支。
      if (!handleSecurityCheckResult(securityResult)) {
        // User rejected - don't apply settings, return cached or null
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Remote settings: User rejected new settings, using cached settings',
        )
        // 返回 `cachedSettings`，作为服务层 index这次计算的结果。
        return cachedSettings
      }

      // setSessionCache 写入新的状态值，使服务层 index后续读取保持一致。
      setSessionCache(newSettings)
      // 等待 `saveSettings(newSettings)` 完成，再继续服务层 index的异步流程。
      await saveSettings(newSettings)
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Remote settings: Applied new settings successfully')
      // 返回 `newSettings`，作为服务层 index这次计算的结果。
      return newSettings
    }

    // Empty settings (404 response) - delete cached file if it exists
    // This ensures stale settings don't persist when a user's remote settings are removed
    // setSessionCache 写入新的状态值，使服务层 index后续读取保持一致。
    setSessionCache(newSettings)
    // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
    try {
      // 路径读取`getSettingsPath`，供服务层 index后续处理使用。
      const path = getSettingsPath()
      // 等待 `unlink(path)` 完成，再继续服务层 index的异步流程。
      await unlink(path)
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Remote settings: Deleted cached file (404 response)')
    } catch (e) {
      // code读取`getErrnoCode`，供服务层 index后续处理使用。
      const code = getErrnoCode(e)
      // `code` 与 `'ENOENT'` 不一致时刷新派生状态，避免使用过期结果。
      if (code !== 'ENOENT') {
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Remote settings: Failed to delete cached file - ${e instanceof Error ? e.message : 'unknown error'}`,
        )
      }
    }
    // 返回 `newSettings`，作为服务层 index这次计算的结果。
    return newSettings
  } catch {
    // On any error, use stale file if available (graceful degradation)
    // 满足 `cachedSettings` 时，服务层 index执行该分支。
    if (cachedSettings) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Remote settings: Using stale cache after error')
      // setSessionCache 写入新的状态值，使服务层 index后续读取保持一致。
      setSessionCache(cachedSettings)
      // 返回 `cachedSettings`，作为服务层 index这次计算的结果。
      return cachedSettings
    }

    // No cache available - fail open, continue without remote settings
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }
}

/**
 * Load remote settings during CLI initialization
 * Fails open - if fetch fails, continues without remote settings
 * Also starts background polling to pick up settings changes mid-session
 *
 * This function sets up a promise that other systems can await via
 * waitForRemoteManagedSettingsToLoad() to ensure they don't initialize
 * until remote settings have been fetched.
 */
// loadRemoteManagedSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function loadRemoteManagedSettings(): Promise<void> {
  // Set up the promise for other systems to wait on
  // Only if the user is eligible for remote settings AND promise not already set up
  // (initializeRemoteManagedSettingsLoadingPromise may have been called earlier)
  // 组合条件 `isRemoteManagedSettingsEligible() && !loadingCompletePromise` 成立时，服务层 index才启用这条专门路径。
  if (isRemoteManagedSettingsEligible() && !loadingCompletePromise) {
    // loadingCompletePromise 异步任务更新为 `new Promise(resolve => {`，确保服务层后续读取最新状态。
    loadingCompletePromise = new Promise(resolve => {
      // loadingCompleteResolve更新为 `resolve`，确保服务层后续读取最新状态。
      loadingCompleteResolve = resolve
    })
  }

  // Cache-first: if we have cached settings on disk, apply them and unblock
  // waiters immediately. The fetch still runs below; notifyChange fires once,
  // after the fetch, as before. Saves the ~77ms fetch-wait on print-mode startup.
  // getRemoteManagedSettingsSyncFromCache has the eligibility guard and populates
  // the session cache internally — no need to call setSessionCache here.
  // 组合条件 `getRemoteManagedSettingsSyncFromCache() && loadingCompleteResolve` 成立时，服务层 index才启用这条专门路径。
  if (getRemoteManagedSettingsSyncFromCache() && loadingCompleteResolve) {
    // 调用 loadingCompleteResolve，触发服务层 index此处需要的副作用。
    loadingCompleteResolve()
    // loadingCompleteResolve更新为 `null`，确保服务层后续读取最新状态。
    loadingCompleteResolve = null
  }

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // settings 集合读取`fetchAndLoadRemoteManagedSettings`，供服务层 index后续处理使用。
    const settings = await fetchAndLoadRemoteManagedSettings()

    // Start background polling to pick up settings changes mid-session
    // 满足 `isRemoteManagedSettingsEligible()` 时，服务层 index执行该分支。
    if (isRemoteManagedSettingsEligible()) {
      // 调用 startBackgroundPolling，触发服务层 index此处需要的副作用。
      startBackgroundPolling()
    }

    // Trigger hot-reload if settings were loaded (new or from cache).
    // notifyChange resets the settings cache internally before iterating
    // listeners — env vars, telemetry, and permissions update on next read.
    // `settings` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (settings !== null) {
      // 调用 settingsChangeDetector.notifyChange，触发服务层 index此处需要的副作用。
      settingsChangeDetector.notifyChange('policySettings')
    }
  } finally {
    // Always resolve the promise, even if fetch failed (fail-open)
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
 * Refresh remote settings asynchronously (for auth state changes)
 * This is used when login/logout occurs
 * Fails open - if fetch fails, continues without remote settings
 */
// refreshRemoteManagedSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshRemoteManagedSettings(): Promise<void> {
  // Clear caches first
  // 等待 `clearRemoteManagedSettingsCache()` 完成，再继续服务层 index的异步流程。
  await clearRemoteManagedSettingsCache()

  // If not enabled, notify that policy settings changed (to empty)
  // 满足 `!isRemoteManagedSettingsEligible()` 时，服务层 index执行该分支。
  if (!isRemoteManagedSettingsEligible()) {
    // 调用 settingsChangeDetector.notifyChange，触发服务层 index此处需要的副作用。
    settingsChangeDetector.notifyChange('policySettings')
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Try to load new settings (fails open if fetch fails)
  // 等待 `fetchAndLoadRemoteManagedSettings()` 完成，再继续服务层 index的异步流程。
  await fetchAndLoadRemoteManagedSettings()
  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Remote settings: Refreshed after auth change')

  // Notify listeners. notifyChange resets the settings cache internally;
  // this triggers hot-reload (AppState update, env var application, etc.)
  // 调用 settingsChangeDetector.notifyChange，触发服务层 index此处需要的副作用。
  settingsChangeDetector.notifyChange('policySettings')
}

/**
 * Background polling callback - fetches settings and triggers hot-reload if changed
 */
// pollRemoteSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function pollRemoteSettings(): Promise<void> {
  // 满足 `!isRemoteManagedSettingsEligible()` 时，服务层 index执行该分支。
  if (!isRemoteManagedSettingsEligible()) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Get current cached settings for comparison
  // prevCache 缓存读取`getRemoteManagedSettingsSyncFromCache`，供服务层 index后续处理使用。
  const prevCache = getRemoteManagedSettingsSyncFromCache()
  // previousSettings 集合保存`jsonStringify`，供服务层 index后续处理使用。
  const previousSettings = prevCache ? jsonStringify(prevCache) : null

  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `fetchAndLoadRemoteManagedSettings()` 完成，再继续服务层 index的异步流程。
    await fetchAndLoadRemoteManagedSettings()

    // Check if settings actually changed
    // newCache 缓存读取`getRemoteManagedSettingsSyncFromCache`，供服务层 index后续处理使用。
    const newCache = getRemoteManagedSettingsSyncFromCache()
    // newSettings 集合保存`jsonStringify`，供服务层 index后续处理使用。
    const newSettings = newCache ? jsonStringify(newCache) : null
    // `newSettings` 与 `previousSettings` 不一致时刷新派生状态，避免使用过期结果。
    if (newSettings !== previousSettings) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Remote settings: Changed during background poll')
      // 调用 settingsChangeDetector.notifyChange，触发服务层 index此处需要的副作用。
      settingsChangeDetector.notifyChange('policySettings')
    }
  } catch {
    // Don't fail closed for background polling - just continue
  }
}

/**
 * Start background polling for remote settings
 * Polls every hour to pick up settings changes mid-session
 */
// startBackgroundPolling 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function startBackgroundPolling(): void {
  // `pollingIntervalId` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (pollingIntervalId !== null) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `!isRemoteManagedSettingsEligible()` 时，服务层 index执行该分支。
  if (!isRemoteManagedSettingsEligible()) {
    // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // pollingIntervalId更新为 `setInterval(() => {`，确保服务层后续读取最新状态。
  pollingIntervalId = setInterval(() => {
    // 显式忽略 `pollRemoteSettings()` 的返回值，只保留它触发的副作用。
    void pollRemoteSettings()
  }, POLLING_INTERVAL_MS)
  // 调用 pollingIntervalId.unref，触发服务层 index此处需要的副作用。
  pollingIntervalId.unref()

  // Register cleanup to stop polling on shutdown
  // 调用 registerCleanup，触发服务层 index此处需要的副作用。
  registerCleanup(async () => stopBackgroundPolling())
}

/**
 * Stop background polling for remote settings
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
