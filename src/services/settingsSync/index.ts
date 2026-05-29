/**
 * Settings Sync Service
 *
 * Syncs user settings and memory files across Claude Code environments.
 *
 * - Interactive CLI: Uploads local settings to remote (incremental, only changed entries)
 * - CCR: Downloads remote settings to local before plugin installation
 *
 * Backend API: anthropic/anthropic#218817
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readFile, stat, writeFile } from 'fs/promises'
// 引入 pickBy，将 lodash-es/pickBy.js 中已经封装好的能力接到本文件流程里。
import pickBy from 'lodash-es/pickBy.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { dirname } from 'path'
// 引入 getIsInteractive，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsInteractive } from '../../bootstrap/state.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_AI_INFERENCE_SCOPE,
  getOauthConfig,
  OAUTH_BETA_HEADER,
} from '../../constants/oauth.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
} from '../../utils/auth.js'
// 复用 clearMemoryFileCaches 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { clearMemoryFileCaches } from '../../utils/claudemd.js'
// 复用 getMemoryPath 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getMemoryPath } from '../../utils/config.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 classifyAxiosError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { classifyAxiosError } from '../../utils/errors.js'
// 复用 getRepoRemoteHash 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getRepoRemoteHash } from '../../utils/git.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from '../../utils/model/providers.js'
// 复用 markInternalWrite 工具函数，把通用处理留在 ../../utils/settings/internalWrites.js 中维护。
import { markInternalWrite } from '../../utils/settings/internalWrites.js'
// 复用 getSettingsFilePathForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettingsFilePathForSource } from '../../utils/settings/settings.js'
// 复用 resetSettingsCache 工具函数，把通用处理留在 ../../utils/settings/settingsCache.js 中维护。
import { resetSettingsCache } from '../../utils/settings/settingsCache.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 引入 getRetryDelay，将 ../api/withRetry.js 中已经封装好的能力接到本文件流程里。
import { getRetryDelay } from '../api/withRetry.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  type SettingsSyncFetchResult,
  type SettingsSyncUploadResult,
  SYNC_KEYS,
  UserSyncDataSchema,
} from './types.js'

// SETTINGS_SYNC_TIMEOUT_MS 集合保存`10000 // 10 seconds`，供后续判断或组装使用。
const SETTINGS_SYNC_TIMEOUT_MS = 10000 // 10 seconds
// DEFAULT_MAX_RETRIES 集合 命名 `3`，让后续代码直接表达这个值的用途。
const DEFAULT_MAX_RETRIES = 3
// MAX_FILE_SIZE_BYTES 文件数据保存`file`，供服务层 index后续处理使用。
const MAX_FILE_SIZE_BYTES = 500 * 1024 // 500 KB per file (matches backend limit)

/**
 * Upload local settings to remote (interactive CLI only).
 * Called from main.tsx preAction.
 * Runs in background - caller should not await unless needed.
 */
// uploadUserSettingsInBackground 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function uploadUserSettingsInBackground(): Promise<void> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
    if (
      !feature('UPLOAD_USER_SETTINGS') ||
      !getFeatureValue_CACHED_MAY_BE_STALE(
        'tengu_enable_settings_sync_push',
        false,
      ) ||
      !getIsInteractive() ||
      !isUsingOAuth()
    ) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_upload_skipped')
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_upload_skipped_ineligible', {})
      // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('info', 'settings_sync_upload_starting')
    // 结果读取`fetchUserSettings`，供服务层 index后续处理使用。
    const result = await fetchUserSettings()
    // result.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!result.success) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'settings_sync_upload_fetch_failed')
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_upload_fetch_failed', {})
      // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // projectId读取`getRepoRemoteHash`，供服务层 index后续处理使用。
    const projectId = await getRepoRemoteHash()
    // localEntries 集合构建`buildEntriesFromLocalFiles`，供服务层 index后续处理使用。
    const localEntries = await buildEntriesFromLocalFiles(projectId)
    // remoteEntries 集合 命名 `result.isEmpty ? {} : result.data!.content.entries`，让后续代码直接表达这个值的用途。
    const remoteEntries = result.isEmpty ? {} : result.data!.content.entries
    // changedEntries 集合保存`pickBy`，供服务层 index后续处理使用。
    const changedEntries = pickBy(
      localEntries,
      // 这个回调绑定到 (value, key) => remoteEntries[key] !== value,，负责服务层 index在该局部场景下的响应。
      (value, key) => remoteEntries[key] !== value,
    )

    // entryCount 数量派生`Object.keys`，供服务层 index后续处理使用。
    const entryCount = Object.keys(changedEntries).length
    // 满足 `entryCount === 0` 时，服务层 index执行该分支。
    if (entryCount === 0) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_upload_no_changes')
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_upload_skipped', {})
      // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // uploadResult读取`uploadUserSettings`，供服务层 index后续处理使用。
    const uploadResult = await uploadUserSettings(changedEntries)
    // 满足 `uploadResult.success` 时，服务层 index执行该分支。
    if (uploadResult.success) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_upload_success')
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_upload_success', { entryCount })
    } else {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'settings_sync_upload_failed')
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_upload_failed', { entryCount })
    }
  } catch {
    // Fail-open: log unexpected errors but don't block startup
    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('error', 'settings_sync_unexpected_error')
  }
}

// Cached so the fire-and-forget at runHeadless entry and the await in
// installPluginsAndApplyMcpInBackground share one fetch.
// downloadPromise 异步任务保存`null`，作为后续空值处理的输入。
let downloadPromise: Promise<boolean> | null = null

/** Test-only: clear the cached download promise between tests. */
// _resetDownloadPromiseForTesting 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function _resetDownloadPromiseForTesting(): void {
  // downloadPromise 异步任务更新为 `null`，确保服务层后续读取最新状态。
  downloadPromise = null
}

/**
 * Download settings from remote for CCR mode.
 * Fired fire-and-forget at the top of print.ts runHeadless(); awaited in
 * installPluginsAndApplyMcpInBackground before plugin install. First call
 * starts the fetch; subsequent calls join it.
 * Returns true if settings were applied, false otherwise.
 */
// downloadUserSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function downloadUserSettings(): Promise<boolean> {
  // 满足 `downloadPromise` 时，服务层 index执行该分支。
  if (downloadPromise) {
    // 返回 `downloadPromise`，作为服务层 index这次计算的结果。
    return downloadPromise
  }
  // downloadPromise 异步任务更新为 `doDownloadUserSettings()`，确保服务层后续读取最新状态。
  downloadPromise = doDownloadUserSettings()
  // 返回 `downloadPromise`，作为服务层 index这次计算的结果。
  return downloadPromise
}

/**
 * Force a fresh download, bypassing the cached startup promise.
 * Called by /reload-plugins in CCR so mid-session settings changes
 * (enabledPlugins, extraKnownMarketplaces) pushed from the user's local
 * CLI are picked up before the plugin-cache sweep.
 *
 * No retries: user-initiated command, one attempt + fail-open. The user
 * can re-run /reload-plugins to retry. Startup path keeps DEFAULT_MAX_RETRIES.
 *
 * Caller is responsible for firing settingsChangeDetector.notifyChange
 * when this returns true — applyRemoteEntriesToLocal uses markInternalWrite
 * to suppress detection (correct for startup, but mid-session needs
 * applySettingsChange to run). Kept out of this module to avoid the
 * settingsSync → changeDetector cycle edge.
 */
// redownloadUserSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function redownloadUserSettings(): Promise<boolean> {
  // downloadPromise 异步任务更新为 `doDownloadUserSettings(0)`，确保服务层后续读取最新状态。
  downloadPromise = doDownloadUserSettings(0)
  // 返回 `downloadPromise`，作为服务层 index这次计算的结果。
  return downloadPromise
}

// doDownloadUserSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function doDownloadUserSettings(
  maxRetries = DEFAULT_MAX_RETRIES,
): Promise<boolean> {
  // 满足 `feature('DOWNLOAD_USER_SETTINGS')` 时，服务层 index执行该分支。
  if (feature('DOWNLOAD_USER_SETTINGS')) {
    // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
    try {
      // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
      if (
        !getFeatureValue_CACHED_MAY_BE_STALE('tengu_strap_foyer', false) ||
        !isUsingOAuth()
      ) {
        // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
        logForDiagnosticsNoPII('info', 'settings_sync_download_skipped')
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_settings_sync_download_skipped', {})
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_download_starting')
      // 结果读取`fetchUserSettings`，供服务层 index后续处理使用。
      const result = await fetchUserSettings(maxRetries)
      // result.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
      if (!result.success) {
        // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
        logForDiagnosticsNoPII('warn', 'settings_sync_download_fetch_failed')
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_settings_sync_download_fetch_failed', {})
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // 满足 `result.isEmpty` 时，服务层 index执行该分支。
      if (result.isEmpty) {
        // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
        logForDiagnosticsNoPII('info', 'settings_sync_download_empty')
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_settings_sync_download_empty', {})
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // entries 集合保存`result.data!.content.entries`，供后续判断或组装使用。
      const entries = result.data!.content.entries
      // projectId读取`getRepoRemoteHash`，供服务层 index后续处理使用。
      const projectId = await getRepoRemoteHash()
      // entryCount 数量派生`Object.keys`，供服务层 index后续处理使用。
      const entryCount = Object.keys(entries).length
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_download_applying', {
        entryCount,
      })
      // 等待 `applyRemoteEntriesToLocal(entries, projectId)` 完成，再继续服务层 index的异步流程。
      await applyRemoteEntriesToLocal(entries, projectId)
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_download_success', { entryCount })
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    } catch {
      // Fail-open: log error but don't block CCR startup
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('error', 'settings_sync_download_error')
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_settings_sync_download_error', {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Check if user is authenticated with first-party OAuth.
 * Required for settings sync in both CLI (upload) and CCR (download) modes.
 *
 * Only checks user:inference (not user:profile) — CCR's file-descriptor token
 * hardcodes scopes to ['user:inference'] only, so requiring profile would make
 * download a no-op there. Upload is independently guarded by getIsInteractive().
 */
// isUsingOAuth 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isUsingOAuth(): boolean {
  // `getAPIProvider()` 与 `'firstParty' || !isFirstPartyAn...` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty' || !isFirstPartyAnthropicBaseUrl()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // token 列表读取`getClaudeAIOAuthTokens`，供服务层 index后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 返回 `Boolean(`，作为服务层 index这次计算的结果。
  return Boolean(
    tokens?.accessToken && tokens.scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE),
  )
}

// getSettingsSyncEndpoint 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSettingsSyncEndpoint(): string {
  // 返回 ``${getOauthConfig().BASE_API_URL}/api/claude_code/user_settings``，作为服务层 index这次计算的结果。
  return `${getOauthConfig().BASE_API_URL}/api/claude_code/user_settings`
}

// getSettingsSyncAuthHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getSettingsSyncAuthHeaders(): {
  headers: Record<string, string>
  error?: string
} {
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
    error: 'No OAuth token available',
  }
}

// fetchUserSettingsOnce 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchUserSettingsOnce(): Promise<SettingsSyncFetchResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // authHeaders 集合读取`getSettingsSyncAuthHeaders`，供服务层 index后续处理使用。
    const authHeaders = getSettingsSyncAuthHeaders()
    // 满足 `authHeaders.error` 时，服务层 index执行该分支。
    if (authHeaders.error) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: authHeaders.error,
        skipRetry: true,
      }
    }

    // 请求头 集中保存服务层 index要一起传递的字段。
    const headers: Record<string, string> = {
      ...authHeaders.headers,
      'User-Agent': getClaudeCodeUserAgent(),
    }

    // endpoint读取`getSettingsSyncEndpoint`，供服务层 index后续处理使用。
    const endpoint = getSettingsSyncEndpoint()
    // 接口响应读取`axios.get`，供服务层 index后续处理使用。
    const response = await axios.get(endpoint, {
      headers,
      timeout: SETTINGS_SYNC_TIMEOUT_MS,
      // 这个回调绑定到 validateStatus: status => status === 200 || status === 404,，负责服务层 index在该局部场景下的响应。
      validateStatus: status => status === 200 || status === 404,
    })

    // 404 means no settings exist yet
    // 满足 `response.status === 404` 时，服务层 index执行该分支。
    if (response.status === 404) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_fetch_empty')
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        isEmpty: true,
      }
    }

    // 解析结果保存`UserSyncDataSchema`，供服务层 index后续处理使用。
    const parsed = UserSyncDataSchema().safeParse(response.data)
    // parsed.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!parsed.success) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'settings_sync_fetch_invalid_format')
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: 'Invalid settings sync response format',
      }
    }

    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('info', 'settings_sync_fetch_success')
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      data: parsed.data,
      isEmpty: false,
    }
  } catch (error) {
    // 从 `classifyAxiosError(error)` 解构 kind、message，减少服务层 index对同一对象的重复访问。
    const { kind, message } = classifyAxiosError(error)
    // 按照 kind 的取值选择服务层 index的具体处理分支。
    switch (kind) {
      case 'auth':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: 'Not authorized for settings sync',
          skipRetry: true,
        }
      case 'timeout':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Settings sync request timeout' }
      case 'network':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Cannot connect to server' }
      default:
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: message }
    }
  }
}

// fetchUserSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchUserSettings(
  maxRetries = DEFAULT_MAX_RETRIES,
): Promise<SettingsSyncFetchResult> {
  // lastResult 命名 `null`，让后续代码直接表达这个值的用途。
  let lastResult: SettingsSyncFetchResult | null = null

  // 循环处理 `let attempt = 1; attempt <= maxRetries + 1; attem`，让服务层 index逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    // lastResult更新为 `await fetchUserSettingsOnce()`，确保服务层后续读取最新状态。
    lastResult = await fetchUserSettingsOnce()

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

    // 满足 `attempt > maxRetries` 时，服务层 index执行该分支。
    if (attempt > maxRetries) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }

    // delayMs 集合读取`getRetryDelay`，供服务层 index后续处理使用。
    const delayMs = getRetryDelay(attempt)
    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('info', 'settings_sync_retry', {
      attempt,
      maxRetries,
      delayMs,
    })
    // 等待 `sleep(delayMs)` 完成，再继续服务层 index的异步流程。
    await sleep(delayMs)
  }

  // 返回 `lastResult!`，作为服务层 index这次计算的结果。
  return lastResult!
}

// uploadUserSettings 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function uploadUserSettings(
  entries: Record<string, string>,
): Promise<SettingsSyncUploadResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // authHeaders 集合读取`getSettingsSyncAuthHeaders`，供服务层 index后续处理使用。
    const authHeaders = getSettingsSyncAuthHeaders()
    // 满足 `authHeaders.error` 时，服务层 index执行该分支。
    if (authHeaders.error) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: authHeaders.error,
      }
    }

    // 请求头 集中保存服务层 index要一起传递的字段。
    const headers: Record<string, string> = {
      ...authHeaders.headers,
      'User-Agent': getClaudeCodeUserAgent(),
      'Content-Type': 'application/json',
    }

    // endpoint读取`getSettingsSyncEndpoint`，供服务层 index后续处理使用。
    const endpoint = getSettingsSyncEndpoint()
    // 接口响应保存`axios.put`，供服务层 index后续处理使用。
    const response = await axios.put(
      endpoint,
      { entries },
      {
        headers,
        timeout: SETTINGS_SYNC_TIMEOUT_MS,
      },
    )

    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('info', 'settings_sync_uploaded', {
      entryCount: Object.keys(entries).length,
    })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      checksum: response.data?.checksum,
      lastModified: response.data?.lastModified,
    }
  } catch (error) {
    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('warn', 'settings_sync_upload_error')
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Try to read a file for sync, with size limit and error handling.
 * Returns null if file doesn't exist, is empty, or exceeds size limit.
 */
// tryReadFileForSync 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function tryReadFileForSync(filePath: string): Promise<string | null> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // stats 集合保存`stat`，供服务层 index后续处理使用。
    const stats = await stat(filePath)
    // 满足 `stats.size > MAX_FILE_SIZE_BYTES` 时，服务层 index执行该分支。
    if (stats.size > MAX_FILE_SIZE_BYTES) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_file_too_large')
      // 返回 `null`，作为服务层 index这次计算的结果。
      return null
    }

    // 文本内容读取`readFile`，供服务层 index后续处理使用。
    const content = await readFile(filePath, 'utf8')
    // Check for empty/whitespace-only without allocating a trimmed copy
    // 组合条件 `!content || /^\s*$/.test(content)` 成立时，服务层 index才启用这条专门路径。
    if (!content || /^\s*$/.test(content)) {
      // 返回 `null`，作为服务层 index这次计算的结果。
      return null
    }

    // 返回 `content`，作为服务层 index这次计算的结果。
    return content
  } catch {
    // 返回 `null`，作为服务层 index这次计算的结果。
    return null
  }
}

// buildEntriesFromLocalFiles 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function buildEntriesFromLocalFiles(
  projectId: string | null,
): Promise<Record<string, string>> {
  // entries 集合 从空对象开始收集键值，后续按名称补齐内容。
  const entries: Record<string, string> = {}

  // Global user settings
  // userSettingsPath 路径数据读取`getSettingsFilePathForSource`，供服务层 index后续处理使用。
  const userSettingsPath = getSettingsFilePathForSource('userSettings')
  // 满足 `userSettingsPath` 时，服务层 index执行该分支。
  if (userSettingsPath) {
    // 文本内容保存`tryReadFileForSync`，供服务层 index后续处理使用。
    const content = await tryReadFileForSync(userSettingsPath)
    // 满足 `content` 时，服务层 index执行该分支。
    if (content) {
      // USER_SETTINGS 集合更新为 `content`，确保服务层 index后续读取最新状态。
      entries[SYNC_KEYS.USER_SETTINGS] = content
    }
  }

  // Global user memory
  // userMemoryPath 路径数据读取`getMemoryPath`，供服务层 index后续处理使用。
  const userMemoryPath = getMemoryPath('User')
  // userMemoryContent保存`tryReadFileForSync`，供服务层 index后续处理使用。
  const userMemoryContent = await tryReadFileForSync(userMemoryPath)
  // 满足 `userMemoryContent` 时，服务层 index执行该分支。
  if (userMemoryContent) {
    // USER_MEMORY更新为 `userMemoryContent`，确保服务层 index后续读取最新状态。
    entries[SYNC_KEYS.USER_MEMORY] = userMemoryContent
  }

  // Project-specific files (only if we have a project ID from git remote)
  // 满足 `projectId` 时，服务层 index执行该分支。
  if (projectId) {
    // Project local settings
    // localSettingsPath 路径数据读取`getSettingsFilePathForSource`，供服务层 index后续处理使用。
    const localSettingsPath = getSettingsFilePathForSource('localSettings')
    // 满足 `localSettingsPath` 时，服务层 index执行该分支。
    if (localSettingsPath) {
      // 文本内容保存`tryReadFileForSync`，供服务层 index后续处理使用。
      const content = await tryReadFileForSync(localSettingsPath)
      // 满足 `content` 时，服务层 index执行该分支。
      if (content) {
        // projectSettings(projectId)更新为 `content`，确保服务层 index后续读取最新状态。
        entries[SYNC_KEYS.projectSettings(projectId)] = content
      }
    }

    // Project local memory
    // localMemoryPath 路径数据读取`getMemoryPath`，供服务层 index后续处理使用。
    const localMemoryPath = getMemoryPath('Local')
    // localMemoryContent保存`tryReadFileForSync`，供服务层 index后续处理使用。
    const localMemoryContent = await tryReadFileForSync(localMemoryPath)
    // 满足 `localMemoryContent` 时，服务层 index执行该分支。
    if (localMemoryContent) {
      // projectMemory(projectId)更新为 `localMemoryContent`，确保服务层 index后续读取最新状态。
      entries[SYNC_KEYS.projectMemory(projectId)] = localMemoryContent
    }
  }

  // 返回 `entries`，作为服务层 index这次计算的结果。
  return entries
}

// writeFileForSync 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeFileForSync(
  filePath: string,
  content: string,
): Promise<boolean> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // parentDir保存`dirname`，供服务层 index后续处理使用。
    const parentDir = dirname(filePath)
    // 满足 `parentDir` 时，服务层 index执行该分支。
    if (parentDir) {
      // 等待 `mkdir(parentDir, { recursive: true })` 完成，再继续服务层 index的异步流程。
      await mkdir(parentDir, { recursive: true })
    }

    // 等待 `writeFile(filePath, content, 'utf8')` 完成，再继续服务层 index的异步流程。
    await writeFile(filePath, content, 'utf8')
    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('info', 'settings_sync_file_written')
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
    logForDiagnosticsNoPII('warn', 'settings_sync_file_write_failed')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/**
 * Apply remote entries to local files (CCR pull pattern).
 * Only writes files that match expected keys.
 *
 * After writing, invalidates relevant caches:
 * - resetSettingsCache() for settings files
 * - clearMemoryFileCaches() for memory files (CLAUDE.md)
 */
// applyRemoteEntriesToLocal 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function applyRemoteEntriesToLocal(
  entries: Record<string, string>,
  projectId: string | null,
): Promise<void> {
  // appliedCount 数量保存`0`，供服务层 index后续判断或输出使用。
  let appliedCount = 0
  // settingsWritten标记服务层 index是否启用对应路径。
  let settingsWritten = false
  // memoryWritten标记服务层 index是否启用对应路径。
  let memoryWritten = false

  // Helper to check size limit (defense-in-depth, matches backend limit)
  // exceedsSizeLimit封装成回调，供服务层 index在事件触发或异步步骤中调用。
  const exceedsSizeLimit = (content: string, _path: string): boolean => {
    // sizeBytes 集合保存`Buffer.byteLength`，供服务层 index后续处理使用。
    const sizeBytes = Buffer.byteLength(content, 'utf8')
    // 满足 `sizeBytes > MAX_FILE_SIZE_BYTES` 时，服务层 index执行该分支。
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
      logForDiagnosticsNoPII('info', 'settings_sync_file_too_large', {
        sizeBytes,
        maxBytes: MAX_FILE_SIZE_BYTES,
      })
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Apply global user settings
  // userSettingsContent读取 `entries[SYNC_KEYS.USER_SETTINGS]` 对应条目，后续围绕该成员继续处理。
  const userSettingsContent = entries[SYNC_KEYS.USER_SETTINGS]
  // 满足 `userSettingsContent` 时，服务层 index执行该分支。
  if (userSettingsContent) {
    // userSettingsPath 路径数据读取`getSettingsFilePathForSource`，供服务层 index后续处理使用。
    const userSettingsPath = getSettingsFilePathForSource('userSettings')
    // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
    if (
      userSettingsPath &&
      !exceedsSizeLimit(userSettingsContent, userSettingsPath)
    ) {
      // Mark as internal write to prevent spurious change detection
      // 调用 markInternalWrite，触发服务层 index此处需要的副作用。
      markInternalWrite(userSettingsPath)
      // 满足 `await writeFileForSync(userSettingsPath, userSettingsContent)` 时，服务层 index执行该分支。
      if (await writeFileForSync(userSettingsPath, userSettingsContent)) {
        // 服务层 index在这里处理 `appliedCount++`，完成这一小步状态转换。
        appliedCount++
        // settingsWritten更新为 `true`，确保服务层后续读取最新状态。
        settingsWritten = true
      }
    }
  }

  // Apply global user memory
  // userMemoryContent保存`entries[SYNC_KEYS.USER_MEMORY]`，供服务层 index后续判断或输出使用。
  const userMemoryContent = entries[SYNC_KEYS.USER_MEMORY]
  // 满足 `userMemoryContent` 时，服务层 index执行该分支。
  if (userMemoryContent) {
    // userMemoryPath 路径数据读取`getMemoryPath`，供服务层 index后续处理使用。
    const userMemoryPath = getMemoryPath('User')
    // 满足 `!exceedsSizeLimit(userMemoryContent, userMemoryPath)` 时，服务层 index执行该分支。
    if (!exceedsSizeLimit(userMemoryContent, userMemoryPath)) {
      // 满足 `await writeFileForSync(userMemoryPath, userMemoryContent)` 时，服务层 index执行该分支。
      if (await writeFileForSync(userMemoryPath, userMemoryContent)) {
        // 服务层 index在这里处理 `appliedCount++`，完成这一小步状态转换。
        appliedCount++
        // memoryWritten更新为 `true`，确保服务层后续读取最新状态。
        memoryWritten = true
      }
    }
  }

  // Apply project-specific files (only if project ID matches)
  // 满足 `projectId` 时，服务层 index执行该分支。
  if (projectId) {
    // projectSettingsKey保存`SYNC_KEYS.projectSettings`，供服务层 index后续处理使用。
    const projectSettingsKey = SYNC_KEYS.projectSettings(projectId)
    // projectSettingsContent读取 `entries[projectSettingsKey]` 对应条目，后续围绕该成员继续处理。
    const projectSettingsContent = entries[projectSettingsKey]
    // 满足 `projectSettingsContent` 时，服务层 index执行该分支。
    if (projectSettingsContent) {
      // localSettingsPath 路径数据读取`getSettingsFilePathForSource`，供服务层 index后续处理使用。
      const localSettingsPath = getSettingsFilePathForSource('localSettings')
      // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
      if (
        localSettingsPath &&
        !exceedsSizeLimit(projectSettingsContent, localSettingsPath)
      ) {
        // Mark as internal write to prevent spurious change detection
        // 调用 markInternalWrite，触发服务层 index此处需要的副作用。
        markInternalWrite(localSettingsPath)
        // 满足 `await writeFileForSync(localSettingsPath, projectSettingsContent)` 时，服务层 index执行该分支。
        if (await writeFileForSync(localSettingsPath, projectSettingsContent)) {
          // 服务层 index在这里处理 `appliedCount++`，完成这一小步状态转换。
          appliedCount++
          // settingsWritten更新为 `true`，确保服务层后续读取最新状态。
          settingsWritten = true
        }
      }
    }

    // projectMemoryKey保存`SYNC_KEYS.projectMemory`，供服务层 index后续处理使用。
    const projectMemoryKey = SYNC_KEYS.projectMemory(projectId)
    // projectMemoryContent 命名 `entries[projectMemoryKey]`，让后续代码直接表达这个值的用途。
    const projectMemoryContent = entries[projectMemoryKey]
    // 满足 `projectMemoryContent` 时，服务层 index执行该分支。
    if (projectMemoryContent) {
      // localMemoryPath 路径数据读取`getMemoryPath`，供服务层 index后续处理使用。
      const localMemoryPath = getMemoryPath('Local')
      // 满足 `!exceedsSizeLimit(projectMemoryContent, localMemoryPath)` 时，服务层 index执行该分支。
      if (!exceedsSizeLimit(projectMemoryContent, localMemoryPath)) {
        // 满足 `await writeFileForSync(localMemoryPath, projectMemoryContent)` 时，服务层 index执行该分支。
        if (await writeFileForSync(localMemoryPath, projectMemoryContent)) {
          // 服务层 index在这里处理 `appliedCount++`，完成这一小步状态转换。
          appliedCount++
          // memoryWritten更新为 `true`，确保服务层后续读取最新状态。
          memoryWritten = true
        }
      }
    }
  }

  // Invalidate caches so subsequent reads pick up new content
  // 满足 `settingsWritten` 时，服务层 index执行该分支。
  if (settingsWritten) {
    // 调用 resetSettingsCache，触发服务层 index此处需要的副作用。
    resetSettingsCache()
  }
  // 满足 `memoryWritten` 时，服务层 index执行该分支。
  if (memoryWritten) {
    // 清理相关缓存，确保服务层 index下一次读取时重新加载最新数据。
    clearMemoryFileCaches()
  }

  // 调用 logForDiagnosticsNoPII，触发服务层 index此处需要的副作用。
  logForDiagnosticsNoPII('info', 'settings_sync_applied', {
    appliedCount,
  })
}
