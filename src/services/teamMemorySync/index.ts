/**
 * Team Memory Sync Service
 *
 * Syncs team memory files between the local filesystem and the server API.
 * Team memory is scoped per-repo (identified by git remote hash) and shared
 * across all authenticated org members.
 *
 * API contract (anthropic/anthropic#250711 + #283027):
 *   GET  /api/claude_code/team_memory?repo={owner/repo}            → TeamMemoryData (includes entryChecksums)
 *   GET  /api/claude_code/team_memory?repo={owner/repo}&view=hashes → metadata + entryChecksums only (no entry bodies)
 *   PUT  /api/claude_code/team_memory?repo={owner/repo}            → upload entries (upsert semantics)
 *   404 = no data exists yet
 *
 * Sync semantics:
 *   - Pull overwrites local files with server content (server wins per-key).
 *   - Push uploads only keys whose content hash differs from serverChecksums
 *     (delta upload). Server uses upsert: keys not in the PUT are preserved.
 *   - File deletions do NOT propagate: deleting a local file won't remove it
 *     from the server, and the next pull will restore it locally.
 *
 * State management:
 *   All mutable state (ETag tracking, watcher suppression) lives in a
 *   SyncState object created by the caller and threaded through every call.
 *   This avoids module-level mutable state and gives tests natural isolation.
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join, relative, sep } from 'path'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  CLAUDE_AI_INFERENCE_SCOPE,
  CLAUDE_AI_PROFILE_SCOPE,
  getOauthConfig,
  OAUTH_BETA_HEADER,
} from '../../constants/oauth.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  getTeamMemPath,
  PathTraversalError,
  validateTeamMemKey,
} from '../../memdir/teamMemPaths.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
} from '../../utils/auth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 classifyAxiosError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { classifyAxiosError } from '../../utils/errors.js'
// 复用 getGithubRepo 工具函数，把通用处理留在 ../../utils/git.js 中维护。
import { getGithubRepo } from '../../utils/git.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from '../../utils/model/providers.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../analytics/metadata.js，用于校准服务层 index的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../analytics/metadata.js'
// 引入 getRetryDelay，将 ../api/withRetry.js 中已经封装好的能力接到本文件流程里。
import { getRetryDelay } from '../api/withRetry.js'
// 引入 scanForSecrets，将 ./secretScanner.js 中已经封装好的能力接到本文件流程里。
import { scanForSecrets } from './secretScanner.js'
// 整理这一组导入，让服务层 index后续逻辑可以直接复用这些外部能力。
import {
  type SkippedSecretFile,
  TeamMemoryDataSchema,
  type TeamMemoryHashesResult,
  type TeamMemorySyncFetchResult,
  type TeamMemorySyncPushResult,
  type TeamMemorySyncUploadResult,
  TeamMemoryTooManyEntriesSchema,
} from './types.js'

// TEAM_MEMORY_SYNC_TIMEOUT_MS 集合 命名 `30_000`，让后续代码直接表达这个值的用途。
const TEAM_MEMORY_SYNC_TIMEOUT_MS = 30_000
// Per-entry size cap — server default from anthropic/anthropic#293258.
// Pre-filtering oversized entries saves bandwidth: the structured 413 for
// this case doesn't give us anything to learn (one file is just too big).
// MAX_FILE_SIZE_BYTES 文件数据保存`250_000`，供后续判断或组装使用。
const MAX_FILE_SIZE_BYTES = 250_000
// No client-side DEFAULT_MAX_ENTRIES: the server's entry-count cap is
// GB-tunable per-org (claude_code_team_memory_limits), so any compile-time
// constant here will drift.  We only truncate after learning the effective
// limit from a structured 413's extra_details.max_entries.
// Gateway body-size cap.  The API gateway rejects PUT bodies over ~256-512KB
// with an unstructured (HTML) 413 before the request reaches the app server —
// distinguishable from the app's structured entry-count 413 only by latency
// (~750ms gateway vs ~2.3s app on comparable payloads).  #21969 removed the
// client entry-count cap; cold pushes from heavy users then sent 300KB-1.4MB
// bodies and hit this.  200KB leaves headroom under the observed threshold
// and keeps a single-entry-at-MAX_FILE_SIZE_BYTES solo batch (~250KB) just
// under the real gateway limit.  Batches larger than this are split into
// sequential PUTs — server upsert-merge semantics make that safe.
// MAX_PUT_BODY_BYTES 集合 命名 `200_000`，让后续代码直接表达这个值的用途。
const MAX_PUT_BODY_BYTES = 200_000
// MAX_RETRIES 集合保存`3`，供后续判断或组装使用。
const MAX_RETRIES = 3
// MAX_CONFLICT_RETRIES 集合保存`2`，供服务层 index后续判断或输出使用。
const MAX_CONFLICT_RETRIES = 2

// ─── Sync state ─────────────────────────────────────────────

/**
 * Mutable state for the team memory sync service.
 * Created once per session by the watcher and passed to all sync functions.
 * Tests create a fresh instance per test for isolation.
 */
// SyncState 固化服务层 index里传递的数据形状，帮助调用方按同一结构读写字段。
export type SyncState = {
  /** Last known server checksum (ETag) for conditional requests. */
  lastKnownChecksum: string | null
  /**
   * Per-key content hash (`sha256:<hex>`) of what we believe the server
   * currently holds. Populated from server-provided entryChecksums on pull
   * and from local hashes on successful push. Used to compute the delta on
   * push — only keys whose local hash differs are uploaded.
   */
  serverChecksums: Map<string, string>
  /**
   * Server-enforced max_entries cap, learned from a structured 413 response
   * (anthropic/anthropic#293258 adds error_code + extra_details.max_entries).
   * Stays null until a 413 is observed — the server's cap is GB-tunable
   * per-org so there is no correct client-side default.  While null,
   * readLocalTeamMemory sends everything and lets the server be
   * authoritative (it rejects atomically).
   */
  serverMaxEntries: number | null
}

// createSyncState 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createSyncState(): SyncState {
  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return {
    lastKnownChecksum: null,
    serverChecksums: new Map(),
    serverMaxEntries: null,
  }
}

/**
 * Compute `sha256:<hex>` over the UTF-8 bytes of the given content.
 * Format matches the server's entryChecksums values (anthropic/anthropic#283027)
 * so local-vs-server comparison works by direct string equality.
 */
// hashContent 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hashContent(content: string): string {
  // 返回 `'sha256:' + createHash('sha256').update(content, 'utf8').digest('hex')`，作为服务层 index这次计算的结果。
  return 'sha256:' + createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Type guard narrowing an unknown error to a Node.js errno-style exception.
 * Uses `in` narrowing so no `as` cast is needed at call sites.
 */
// isErrnoException 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  // 返回 `e instanceof Error && 'code' in e && typeof e.code === 'string'`，作为服务层 index这次计算的结果。
  return e instanceof Error && 'code' in e && typeof e.code === 'string'
}

// ─── Auth & endpoint ─────────────────────────────────────────

/**
 * Check if user is authenticated with first-party OAuth (required for team memory sync).
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
    tokens?.accessToken &&
      tokens.scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE) &&
      tokens.scopes.includes(CLAUDE_AI_PROFILE_SCOPE),
  )
}

// getTeamMemorySyncEndpoint 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTeamMemorySyncEndpoint(repoSlug: string): string {
  // baseUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const baseUrl =
    process.env.TEAM_MEMORY_SYNC_URL || getOauthConfig().BASE_API_URL
  // 返回 ``${baseUrl}/api/claude_code/team_memory?repo=${encodeURIComponent(repoS...`，作为服务层 index这次计算的结果。
  return `${baseUrl}/api/claude_code/team_memory?repo=${encodeURIComponent(repoSlug)}`
}

// getAuthHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAuthHeaders(): {
  headers?: Record<string, string>
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
        'User-Agent': getClaudeCodeUserAgent(),
      },
    }
  }
  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return { error: 'No OAuth token available for team memory sync' }
}

// ─── Fetch (pull) ────────────────────────────────────────────

// fetchTeamMemoryOnce 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchTeamMemoryOnce(
  state: SyncState,
  repoSlug: string,
  etag?: string | null,
): Promise<TeamMemorySyncFetchResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // auth读取`getAuthHeaders`，供服务层 index后续处理使用。
    const auth = getAuthHeaders()
    // 满足 `auth.error` 时，服务层 index执行该分支。
    if (auth.error) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: auth.error,
        skipRetry: true,
        errorType: 'auth',
      }
    }

    // 请求头 集中保存服务层 index要一起传递的字段。
    const headers: Record<string, string> = { ...auth.headers }
    // 满足 `etag` 时，服务层 index执行该分支。
    if (etag) {
      // headers['If-None-Match'更新为 ``"${etag.replace(/"/g, '')}"``，确保服务层 index后续读取最新状态。
      headers['If-None-Match'] = `"${etag.replace(/"/g, '')}"`
    }

    // endpoint读取`getTeamMemorySyncEndpoint`，供服务层 index后续处理使用。
    const endpoint = getTeamMemorySyncEndpoint(repoSlug)
    // 接口响应读取`axios.get`，供服务层 index后续处理使用。
    const response = await axios.get(endpoint, {
      headers,
      timeout: TEAM_MEMORY_SYNC_TIMEOUT_MS,
      // 这个回调绑定到 validateStatus: status =>，负责服务层 index在该局部场景下的响应。
      validateStatus: status =>
        status === 200 || status === 304 || status === 404,
    })

    // 满足 `response.status === 304` 时，服务层 index执行该分支。
    if (response.status === 304) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('team-memory-sync: not modified (304)', {
        level: 'debug',
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: true, notModified: true, checksum: etag ?? undefined }
    }

    // 满足 `response.status === 404` 时，服务层 index执行该分支。
    if (response.status === 404) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('team-memory-sync: no remote data (404)', {
        level: 'debug',
      })
      // lastKnownChecksum更新为 `null`，确保服务层后续读取最新状态。
      state.lastKnownChecksum = null
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: true, isEmpty: true }
    }

    // 解析结果保存`TeamMemoryDataSchema`，供服务层 index后续处理使用。
    const parsed = TeamMemoryDataSchema().safeParse(response.data)
    // parsed.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!parsed.success) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('team-memory-sync: invalid response format', {
        level: 'warn',
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error: 'Invalid team memory response format',
        skipRetry: true,
        errorType: 'parse',
      }
    }

    // Extract checksum from response data or ETag header
    // responseChecksum 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const responseChecksum =
      parsed.data.checksum ||
      response.headers['etag']?.replace(/^"|"$/g, '') ||
      undefined
    // 满足 `responseChecksum` 时，服务层 index执行该分支。
    if (responseChecksum) {
      // lastKnownChecksum更新为 `responseChecksum`，确保服务层后续读取最新状态。
      state.lastKnownChecksum = responseChecksum
    }

    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-sync: fetched successfully (checksum: ${responseChecksum ?? 'none'})`,
      { level: 'debug' },
    )
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      data: parsed.data,
      isEmpty: false,
      checksum: responseChecksum,
    }
  } catch (error) {
    // 从 `classifyAxiosError(error)` 解构 kind、status、message，减少服务层 index对同一对象的重复访问。
    const { kind, status, message } = classifyAxiosError(error)
    // 请求体保存`axios.isAxiosError`，供服务层 index后续处理使用。
    const body = axios.isAxiosError(error)
      ? JSON.stringify(error.response?.data ?? '')
      : ''
    // `kind` 与 `'other'` 不一致时刷新派生状态，避免使用过期结果。
    if (kind !== 'other') {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`team-memory-sync: fetch error ${status}: ${body}`, {
        level: 'warn',
      })
    }
    // 按照 kind 的取值选择服务层 index的具体处理分支。
    switch (kind) {
      case 'auth':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: `Not authorized for team memory sync: ${body}`,
          skipRetry: true,
          errorType: 'auth',
          httpStatus: status,
        }
      case 'timeout':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: 'Team memory sync request timeout',
          errorType: 'timeout',
        }
      case 'network':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: 'Cannot connect to server',
          errorType: 'network',
        }
      default:
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: message,
          errorType: 'unknown',
          httpStatus: status,
        }
    }
  }
}

/**
 * Fetch only per-key checksums + metadata (no entry bodies).
 * Used for cheap serverChecksums refresh during 412 conflict resolution — avoids
 * downloading ~300KB of content just to learn which keys changed.
 * Requires anthropic/anthropic#283027 deployed; on failure the caller fails the
 * push and the watcher retries on the next edit.
 */
// fetchTeamMemoryHashes 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchTeamMemoryHashes(
  state: SyncState,
  repoSlug: string,
): Promise<TeamMemoryHashesResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()
    // auth读取`getAuthHeaders`，供服务层 index后续处理使用。
    const auth = getAuthHeaders()
    // 满足 `auth.error` 时，服务层 index执行该分支。
    if (auth.error) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: false, error: auth.error, errorType: 'auth' }
    }

    // endpoint读取`getTeamMemorySyncEndpoint`，供服务层 index后续处理使用。
    const endpoint = getTeamMemorySyncEndpoint(repoSlug) + '&view=hashes'
    // 接口响应读取`axios.get`，供服务层 index后续处理使用。
    const response = await axios.get(endpoint, {
      headers: auth.headers,
      timeout: TEAM_MEMORY_SYNC_TIMEOUT_MS,
      // 这个回调绑定到 validateStatus: status => status === 200 || status === 404,，负责服务层 index在该局部场景下的响应。
      validateStatus: status => status === 200 || status === 404,
    })

    // 满足 `response.status === 404` 时，服务层 index执行该分支。
    if (response.status === 404) {
      // lastKnownChecksum更新为 `null`，确保服务层后续读取最新状态。
      state.lastKnownChecksum = null
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: true, entryChecksums: {} }
    }

    // checksum 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const checksum =
      response.data?.checksum || response.headers['etag']?.replace(/^"|"$/g, '')
    // entryChecksums 集合保存`response.data?.entryChecksums`，供后续判断或组装使用。
    const entryChecksums = response.data?.entryChecksums

    // Requires anthropic/anthropic#283027. If entryChecksums is missing,
    // treat as a probe failure — caller fails the push; watcher retries.
    // `!entryChecksums || typeof entryChecksums` 与 `'obj` 不一致时刷新派生状态，避免使用过期结果。
    if (!entryChecksums || typeof entryChecksums !== 'object') {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        error:
          'Server did not return entryChecksums (?view=hashes unsupported)',
        errorType: 'parse',
      }
    }

    // 满足 `checksum` 时，服务层 index执行该分支。
    if (checksum) {
      // lastKnownChecksum更新为 `checksum`，确保服务层后续读取最新状态。
      state.lastKnownChecksum = checksum
    }
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      version: response.data?.version,
      checksum,
      entryChecksums,
    }
  } catch (error) {
    // 从 `classifyAxiosError(error)` 解构 kind、status、message，减少服务层 index对同一对象的重复访问。
    const { kind, status, message } = classifyAxiosError(error)
    // 按照 kind 的取值选择服务层 index的具体处理分支。
    switch (kind) {
      case 'auth':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: 'Not authorized',
          errorType: 'auth',
          httpStatus: status,
        }
      case 'timeout':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Timeout', errorType: 'timeout' }
      case 'network':
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return { success: false, error: 'Network error', errorType: 'network' }
      default:
        // 返回结构化结果，集中表达服务层 index已经整理出的状态。
        return {
          success: false,
          error: message,
          errorType: 'unknown',
          httpStatus: status,
        }
    }
  }
}

// fetchTeamMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchTeamMemory(
  state: SyncState,
  repoSlug: string,
  etag?: string | null,
): Promise<TeamMemorySyncFetchResult> {
  // lastResult 命名 `null`，让后续代码直接表达这个值的用途。
  let lastResult: TeamMemorySyncFetchResult | null = null

  // 循环处理 `let attempt = 1; attempt <= MAX_RETRIES + 1; atte`，让服务层 index逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    // lastResult更新为 `await fetchTeamMemoryOnce(state, repoSlug, etag)`，确保服务层后续读取最新状态。
    lastResult = await fetchTeamMemoryOnce(state, repoSlug, etag)
    // 组合条件 `lastResult.success || lastResult.skipRetry` 成立时，服务层 index才启用这条专门路径。
    if (lastResult.success || lastResult.skipRetry) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }
    // 满足 `attempt > MAX_RETRIES` 时，服务层 index执行该分支。
    if (attempt > MAX_RETRIES) {
      // 返回 `lastResult`，作为服务层 index这次计算的结果。
      return lastResult
    }
    // delayMs 集合读取`getRetryDelay`，供服务层 index后续处理使用。
    const delayMs = getRetryDelay(attempt)
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`team-memory-sync: retry ${attempt}/${MAX_RETRIES}`, {
      level: 'debug',
    })
    // 等待 `sleep(delayMs)` 完成，再继续服务层 index的异步流程。
    await sleep(delayMs)
  }

  // 返回 `lastResult!`，作为服务层 index这次计算的结果。
  return lastResult!
}

// ─── Upload (push) ───────────────────────────────────────────

/**
 * Split a delta into PUT-sized batches under MAX_PUT_BODY_BYTES each.
 *
 * Greedy bin-packing over sorted keys — sorting gives deterministic batches
 * across calls, which matters for ETag stability if the conflict loop retries
 * after a partial commit.  The byte count is the full serialized body
 * including JSON overhead, so what we measure is what axios sends.
 *
 * A single entry exceeding MAX_PUT_BODY_BYTES goes into its own solo batch
 * (MAX_FILE_SIZE_BYTES=250K already caps individual files; a ~250K solo body
 * is above our soft cap but below the gateway's observed real threshold).
 */
// batchDeltaByBytes 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function batchDeltaByBytes(
  delta: Record<string, string>,
): Array<Record<string, string>> {
  // keys 集合派生`Object.keys`，供服务层 index后续处理使用。
  const keys = Object.keys(delta).sort()
  // keys 集合为空时立即返回或跳过，避免服务层 index把空集合当成可处理内容。
  if (keys.length === 0) return []

  // Fixed overhead for `{"entries":{}}` — each entry then adds its marginal
  // bytes.  jsonStringify (≡ JSON.stringify under the hood) on the raw
  // strings handles escaping so the count matches what axios serializes.
  // EMPTY_BODY_BYTES 集合保存`Buffer.byteLength`，供服务层 index后续处理使用。
  const EMPTY_BODY_BYTES = Buffer.byteLength('{"entries":{}}', 'utf8')
  // entryBytes 集合封装成回调，供服务层 index在事件触发或异步步骤中调用。
  const entryBytes = (k: string, v: string): number =>
    Buffer.byteLength(jsonStringify(k), 'utf8') +
    Buffer.byteLength(jsonStringify(v), 'utf8') +
    2 // colon + comma (comma over-counts by 1 on the last entry; harmless slack)

  // batches 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const batches: Array<Record<string, string>> = []
  // current 从空对象开始收集键值，后续按名称补齐内容。
  let current: Record<string, string> = {}
  // currentBytes 集合 命名 `EMPTY_BODY_BYTES`，让后续代码直接表达这个值的用途。
  let currentBytes = EMPTY_BODY_BYTES

  // 按顺序遍历 `keys` 中的key，逐个交给服务层 index处理。
  for (const key of keys) {
    // added保存`entryBytes`，供服务层 index后续处理使用。
    const added = entryBytes(key, delta[key]!)
    // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
    if (
      currentBytes + added > MAX_PUT_BODY_BYTES &&
      Object.keys(current).length > 0
    ) {
      // batches 集合追加新条目，保持收集顺序与输入顺序一致。
      batches.push(current)
      // current更新为 `{}`，确保服务层后续读取最新状态。
      current = {}
      // currentBytes 集合更新为 `EMPTY_BODY_BYTES`，确保服务层后续读取最新状态。
      currentBytes = EMPTY_BODY_BYTES
    }
    // current[key更新为 `delta[key]!`，确保服务层 index后续读取最新状态。
    current[key] = delta[key]!
    // 服务层 index在这里处理 `currentBytes += added`，完成这一小步状态转换。
    currentBytes += added
  }
  // batches 集合追加新条目，保持收集顺序与输入顺序一致。
  batches.push(current)
  // 返回 `batches`，作为服务层 index这次计算的结果。
  return batches
}

// uploadTeamMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function uploadTeamMemory(
  state: SyncState,
  repoSlug: string,
  entries: Record<string, string>,
  ifMatchChecksum?: string | null,
): Promise<TeamMemorySyncUploadResult> {
  // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 index的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // auth读取`getAuthHeaders`，供服务层 index后续处理使用。
    const auth = getAuthHeaders()
    // 满足 `auth.error` 时，服务层 index执行该分支。
    if (auth.error) {
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: false, error: auth.error, errorType: 'auth' }
    }

    // 请求头 集中保存服务层 index要一起传递的字段。
    const headers: Record<string, string> = {
      ...auth.headers,
      'Content-Type': 'application/json',
    }
    // 满足 `ifMatchChecksum` 时，服务层 index执行该分支。
    if (ifMatchChecksum) {
      // headers['If-Match'更新为 ``"${ifMatchChecksum.replace(/"/g, '')}"``，确保服务层 index后续读取最新状态。
      headers['If-Match'] = `"${ifMatchChecksum.replace(/"/g, '')}"`
    }

    // endpoint读取`getTeamMemorySyncEndpoint`，供服务层 index后续处理使用。
    const endpoint = getTeamMemorySyncEndpoint(repoSlug)
    // 接口响应保存`axios.put`，供服务层 index后续处理使用。
    const response = await axios.put(
      endpoint,
      { entries },
      {
        headers,
        timeout: TEAM_MEMORY_SYNC_TIMEOUT_MS,
        // 这个回调绑定到 validateStatus: status => status === 200 || status === 412,，负责服务层 index在该局部场景下的响应。
        validateStatus: status => status === 200 || status === 412,
      },
    )

    // 满足 `response.status === 412` 时，服务层 index执行该分支。
    if (response.status === 412) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging('team-memory-sync: conflict (412 Precondition Failed)', {
        level: 'info',
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return { success: false, conflict: true, error: 'ETag mismatch' }
    }

    // responseChecksum 响应数据读取`response.data?.checksum`，供后续判断或组装使用。
    const responseChecksum = response.data?.checksum
    // 满足 `responseChecksum` 时，服务层 index执行该分支。
    if (responseChecksum) {
      // lastKnownChecksum更新为 `responseChecksum`，确保服务层后续读取最新状态。
      state.lastKnownChecksum = responseChecksum
    }

    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-sync: uploaded ${Object.keys(entries).length} entries (checksum: ${responseChecksum ?? 'none'})`,
      { level: 'debug' },
    )
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: true,
      checksum: responseChecksum,
      lastModified: response.data?.lastModified,
    }
  } catch (error) {
    // 请求体保存`axios.isAxiosError`，供服务层 index后续处理使用。
    const body = axios.isAxiosError(error)
      ? JSON.stringify(error.response?.data ?? '')
      : ''
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-sync: upload failed: ${error instanceof Error ? error.message : ''} ${body}`,
      { level: 'warn' },
    )
    // 从 `classifyAxiosError(error)` 解构 kind、status、message，减少服务层 index对同一对象的重复访问。
    const { kind, status: httpStatus, message } = classifyAxiosError(error)
    // errorType 错误信息标记服务层 index是否启用对应路径。
    const errorType = kind === 'http' || kind === 'other' ? 'unknown' : kind
    // serverErrorCode 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
    let serverErrorCode: 'team_memory_too_many_entries' | undefined
    // serverMaxEntries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let serverMaxEntries: number | undefined
    // serverReceivedEntries 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let serverReceivedEntries: number | undefined
    // Parse structured 413 (anthropic/anthropic#293258). The server's
    // RequestTooLargeException includes error_code + extra_details with
    // the effective max_entries (may be GB-tuned per-org). Cache it so
    // the next push trims to the right value.
    // 组合条件 `httpStatus === 413 && axios.isAxiosError(error)` 成立时，服务层 index才启用这条专门路径。
    if (httpStatus === 413 && axios.isAxiosError(error)) {
      // 解析结果保存`TeamMemoryTooManyEntriesSchema`，供服务层 index后续处理使用。
      const parsed = TeamMemoryTooManyEntriesSchema().safeParse(
        error.response?.data,
      )
      // 满足 `parsed.success` 时，服务层 index执行该分支。
      if (parsed.success) {
        // serverErrorCode 错误信息更新为 `parsed.data.error.details.error_code`，确保服务层后续读取最新状态。
        serverErrorCode = parsed.data.error.details.error_code
        // serverMaxEntries 集合更新为 `parsed.data.error.details.max_entries`，确保服务层后续读取最新状态。
        serverMaxEntries = parsed.data.error.details.max_entries
        // serverReceivedEntries 集合更新为 `parsed.data.error.details.received_entries`，确保服务层后续读取最新状态。
        serverReceivedEntries = parsed.data.error.details.received_entries
      }
    }
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      error: message,
      errorType,
      httpStatus,
      ...(serverErrorCode !== undefined && { serverErrorCode }),
      ...(serverMaxEntries !== undefined && { serverMaxEntries }),
      ...(serverReceivedEntries !== undefined && { serverReceivedEntries }),
    }
  }
}

// ─── Local file operations ───────────────────────────────────

/**
 * Read all team memory files from the local directory into a flat key-value map.
 * Keys are relative paths from the team memory directory.
 * Empty files are included (content will be empty string).
 *
 * PSR M22174: Each file is scanned for credentials before inclusion
 * using patterns from gitleaks. Files containing secrets are SKIPPED
 * (not uploaded) and collected in skippedSecrets so the caller can
 * warn the user.
 */
// readLocalTeamMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function readLocalTeamMemory(maxEntries: number | null): Promise<{
  entries: Record<string, string>
  skippedSecrets: SkippedSecretFile[]
}> {
  // teamDir读取`getTeamMemPath`，供服务层 index后续处理使用。
  const teamDir = getTeamMemPath()
  // entries 集合 从空对象开始收集键值，后续按名称补齐内容。
  const entries: Record<string, string> = {}
  // skippedSecrets 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const skippedSecrets: SkippedSecretFile[] = []

  // walkDir 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function walkDir(dir: string): Promise<void> {
    // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
    try {
      // dirEntries 集合读取`readdir`，供服务层 index后续处理使用。
      const dirEntries = await readdir(dir, { withFileTypes: true })
      // 等待 `Promise.all(` 完成，再继续服务层 index的异步流程。
      await Promise.all(
        dirEntries.map(async entry => {
          // fullPath 路径数据格式化`join`，供服务层 index后续处理使用。
          const fullPath = join(dir, entry.name)
          // 满足 `entry.isDirectory()` 时，服务层 index执行该分支。
          if (entry.isDirectory()) {
            // 等待 `walkDir(fullPath)` 完成，再继续服务层 index的异步流程。
            await walkDir(fullPath)
          // 服务层 index在这里处理 `} else if (entry.isFile()) {`，完成这一小步状态转换。
          } else if (entry.isFile()) {
            // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
            try {
              // stats 集合保存`stat`，供服务层 index后续处理使用。
              const stats = await stat(fullPath)
              // 满足 `stats.size > MAX_FILE_SIZE_BYTES` 时，服务层 index执行该分支。
              if (stats.size > MAX_FILE_SIZE_BYTES) {
                // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `team-memory-sync: skipping oversized file ${entry.name} (${stats.size} > ${MAX_FILE_SIZE_BYTES} bytes)`,
                  { level: 'info' },
                )
                // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }
              // 文本内容读取`readFile`，供服务层 index后续处理使用。
              const content = await readFile(fullPath, 'utf8')
              // relPath 路径数据保存`relative`，供服务层 index后续处理使用。
              const relPath = relative(teamDir, fullPath).replaceAll('\\', '/')

              // PSR M22174: scan for secrets BEFORE adding to the upload
              // payload. If a secret is detected, skip this file entirely
              // so it never leaves the machine.
              // secretMatches 集合保存`scanForSecrets`，供服务层 index后续处理使用。
              const secretMatches = scanForSecrets(content)
              // 满足 `secretMatches.length > 0` 时，服务层 index执行该分支。
              if (secretMatches.length > 0) {
                // Report only the first match per file — one secret is
                // enough to skip the file and we don't want to log more
                // than necessary about credential locations.
                // firstMatch 命名 `secretMatches[0]!`，让后续代码直接表达这个值的用途。
                const firstMatch = secretMatches[0]!
                // skippedSecrets 集合追加新条目，保持收集顺序与输入顺序一致。
                skippedSecrets.push({
                  path: relPath,
                  ruleId: firstMatch.ruleId,
                  label: firstMatch.label,
                })
                // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `team-memory-sync: skipping "${relPath}" — detected ${firstMatch.label}`,
                  { level: 'warn' },
                )
                // 服务层 index在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }

              // entries[relPath 路径数据更新为 `content`，确保服务层 index后续读取最新状态。
              entries[relPath] = content
            } catch {
              // Skip unreadable files
            }
          }
        }),
      )
    } catch (e) {
      // 满足 `isErrnoException(e)` 时，服务层 index执行该分支。
      if (isErrnoException(e)) {
        // `e.code` 与 `'ENOENT' && e.code !== 'EACCES'...` 不一致时刷新派生状态，避免使用过期结果。
        if (e.code !== 'ENOENT' && e.code !== 'EACCES' && e.code !== 'EPERM') {
          // 抛出 e，阻止服务层 index在无效状态下继续运行。
          throw e
        }
      } else {
        // 抛出 e，阻止服务层 index在无效状态下继续运行。
        throw e
      }
    }
  }

  // 等待 `walkDir(teamDir)` 完成，再继续服务层 index的异步流程。
  await walkDir(teamDir)

  // Truncate only if we've LEARNED a cap from the server (via a structured
  // 413's extra_details.max_entries — anthropic/anthropic#293258).  The
  // server's entry-count cap is GB-tunable per-org via
  // claude_code_team_memory_limits; we have no way to know it in advance.
  // Before the first 413 we send everything and let the server be
  // authoritative.  The server validates total stored entries after merge
  // (not PUT body count) and rejects atomically — nothing is written on 413.
  //
  // Sorting before truncation is what makes delta computation work: without
  // it, the parallel walk above picks a different N-of-M subset each push
  // (Promise.all resolves in completion order), serverChecksums misses keys,
  // and the "delta" balloons to near-full snapshot.  With deterministic
  // truncation, the same N keys are compared against the same server state.
  //
  // When disk has more files than the learned cap, alphabetically-last ones
  // consistently never sync.  When the merged (server + delta) count exceeds
  // the cap we still fail — recovering requires soft_delete_keys.
  // keys 集合派生`Object.keys`，供服务层 index后续处理使用。
  const keys = Object.keys(entries).sort()
  // `maxEntries` 与 `null && keys.length > maxEntries` 不一致时刷新派生状态，避免使用过期结果。
  if (maxEntries !== null && keys.length > maxEntries) {
    // dropped格式化`keys.slice`，供服务层 index后续处理使用。
    const dropped = keys.slice(maxEntries)
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-sync: ${keys.length} local entries exceeds server cap of ${maxEntries}; ${dropped.length} file(s) will NOT sync: ${dropped.join(', ')}. Consider consolidating or removing some team memory files.`,
      { level: 'warn' },
    )
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_team_mem_entries_capped', {
      total_entries: keys.length,
      dropped_count: dropped.length,
      max_entries: maxEntries,
    })
    // truncated 从空对象开始收集键值，后续按名称补齐内容。
    const truncated: Record<string, string> = {}
    // 逐项读取 `keys.slice(0, maxEntries)` 中的key，按输入顺序推进服务层 index。
    for (const key of keys.slice(0, maxEntries)) {
      // truncated[key更新为 `entries[key]!`，确保服务层 index后续读取最新状态。
      truncated[key] = entries[key]!
    }
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return { entries: truncated, skippedSecrets }
  }
  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return { entries, skippedSecrets }
}

/**
 * Write remote team memory entries to the local directory.
 * Validates every path against the team memory directory boundary.
 * Skips entries whose on-disk content already matches, so unchanged
 * files keep their mtime and don't spuriously invalidate the
 * getMemoryFiles cache or trigger watcher events.
 *
 * Parallel: each entry is processed independently (validate + read-compare
 * + mkdir + write). Concurrent mkdir on a shared parent is safe with
 * recursive: true (EEXIST is swallowed). The initial pull is the long
 * pole in startTeamMemoryWatcher — p99 was ~22s serial at 50 entries.
 *
 * Returns the number of files actually written.
 */
// writeRemoteEntriesToLocal 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function writeRemoteEntriesToLocal(
  entries: Record<string, string>,
): Promise<number> {
  // 结果列表保存`Promise.all`，供服务层 index后续处理使用。
  const results = await Promise.all(
    Object.entries(entries).map(async ([relPath, content]) => {
      // validatedPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
      let validatedPath: string
      // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
      try {
        // validatedPath 路径数据更新为 `await validateTeamMemKey(relPath)`，确保服务层后续读取最新状态。
        validatedPath = await validateTeamMemKey(relPath)
      } catch (e) {
        // 满足 `e instanceof PathTraversalError` 时，服务层 index执行该分支。
        if (e instanceof PathTraversalError) {
          // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`team-memory-sync: ${e.message}`, { level: 'warn' })
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
        // 抛出 e，阻止服务层 index在无效状态下继续运行。
        throw e
      }

      // sizeBytes 集合保存`Buffer.byteLength`，供服务层 index后续处理使用。
      const sizeBytes = Buffer.byteLength(content, 'utf8')
      // 满足 `sizeBytes > MAX_FILE_SIZE_BYTES` 时，服务层 index执行该分支。
      if (sizeBytes > MAX_FILE_SIZE_BYTES) {
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `team-memory-sync: skipping oversized remote entry "${relPath}"`,
          { level: 'info' },
        )
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }

      // Skip if on-disk content already matches. Handles the common case
      // where pull returns unchanged entries (skipEtagCache path, first
      // pull of a session with warm disk state from prior session).
      // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
      try {
        // existing读取`readFile`，供服务层 index后续处理使用。
        const existing = await readFile(validatedPath, 'utf8')
        // 满足 `existing === content` 时，服务层 index执行该分支。
        if (existing === content) {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
      } catch (e) {
        // 服务层 index在这里进入条件判断，后续代码按实际状态分流。
        if (
          isErrnoException(e) &&
          e.code !== 'ENOENT' &&
          e.code !== 'ENOTDIR'
        ) {
          // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `team-memory-sync: unexpected read error for "${relPath}": ${e.code}`,
            { level: 'debug' },
          )
        }
        // Fall through to write for ENOENT/ENOTDIR (file doesn't exist yet)
      }

      // 保护这一段可能失败的服务层 index操作，确保异常能进入相邻错误处理。
      try {
        // parentDir格式化`validatedPath.substring`，供服务层 index后续处理使用。
        const parentDir = validatedPath.substring(
          0,
          validatedPath.lastIndexOf(sep),
        )
        // 等待 `mkdir(parentDir, { recursive: true })` 完成，再继续服务层 index的异步流程。
        await mkdir(parentDir, { recursive: true })
        // 等待 `writeFile(validatedPath, content, 'utf8')` 完成，再继续服务层 index的异步流程。
        await writeFile(validatedPath, content, 'utf8')
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch (e) {
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `team-memory-sync: failed to write "${relPath}": ${e}`,
          { level: 'warn' },
        )
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }),
  )

  // 返回 `count(results, Boolean)`，作为服务层 index这次计算的结果。
  return count(results, Boolean)
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Check if team memory sync is available (requires first-party OAuth).
 */
// isTeamMemorySyncAvailable 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamMemorySyncAvailable(): boolean {
  // 返回 `isUsingOAuth()`，作为服务层 index这次计算的结果。
  return isUsingOAuth()
}

/**
 * Pull team memory from the server and write to local directory.
 * Returns true if any files were updated.
 */
// pullTeamMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pullTeamMemory(
  state: SyncState,
  options?: { skipEtagCache?: boolean },
): Promise<{
  success: boolean
  filesWritten: number
  /** Number of entries the server returned, regardless of whether they were written to disk. */
  entryCount: number
  notModified?: boolean
  error?: string
}> {
  // skipEtagCache 缓存保存`options?.skipEtagCache ?? false`，供后续判断或组装使用。
  const skipEtagCache = options?.skipEtagCache ?? false
  // startTime记录时间`Date.now`，供服务层 index后续处理使用。
  const startTime = Date.now()

  // 满足 `!isUsingOAuth()` 时，服务层 index执行该分支。
  if (!isUsingOAuth()) {
    // 调用 logPull，触发服务层 index此处需要的副作用。
    logPull(startTime, { success: false, errorType: 'no_oauth' })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesWritten: 0,
      entryCount: 0,
      error: 'OAuth not available',
    }
  }

  // repoSlug读取`getGithubRepo`，供服务层 index后续处理使用。
  const repoSlug = await getGithubRepo()
  // repoSlug缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!repoSlug) {
    // 调用 logPull，触发服务层 index此处需要的副作用。
    logPull(startTime, { success: false, errorType: 'no_repo' })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesWritten: 0,
      entryCount: 0,
      error: 'No git remote found',
    }
  }

  // etag 命名 `skipEtagCache ? null : state.lastKnownChecksum`，让后续代码直接表达这个值的用途。
  const etag = skipEtagCache ? null : state.lastKnownChecksum
  // 结果读取`fetchTeamMemory`，供服务层 index后续处理使用。
  const result = await fetchTeamMemory(state, repoSlug, etag)
  // result.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!result.success) {
    // 调用 logPull，触发服务层 index此处需要的副作用。
    logPull(startTime, {
      success: false,
      errorType: result.errorType,
      status: result.httpStatus,
    })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesWritten: 0,
      entryCount: 0,
      error: result.error,
    }
  }
  // 满足 `result.notModified` 时，服务层 index执行该分支。
  if (result.notModified) {
    // 调用 logPull，触发服务层 index此处需要的副作用。
    logPull(startTime, { success: true, notModified: true })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return { success: true, filesWritten: 0, entryCount: 0, notModified: true }
  }
  // 组合条件 `result.isEmpty || !result.data` 成立时，服务层 index才启用这条专门路径。
  if (result.isEmpty || !result.data) {
    // Server has no data — clear stale serverChecksums so the next push
    // doesn't skip entries it thinks the server already has.
    // 调用 state.serverChecksums.clear，触发服务层 index此处需要的副作用。
    state.serverChecksums.clear()
    // 调用 logPull，触发服务层 index此处需要的副作用。
    logPull(startTime, { success: true })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return { success: true, filesWritten: 0, entryCount: 0 }
  }

  // entries 集合保存`result.data.content.entries`，供后续判断或组装使用。
  const entries = result.data.content.entries
  // responseChecksums 响应数据 命名 `result.data.content.entryChecksums`，让后续代码直接表达这个值的用途。
  const responseChecksums = result.data.content.entryChecksums

  // Refresh serverChecksums from server-provided per-key hashes.
  // Requires anthropic/anthropic#283027 — if the response lacks entryChecksums
  // (pre-deploy server), serverChecksums stays empty and the next push uploads
  // everything; it self-corrects on push success.
  // 调用 state.serverChecksums.clear，触发服务层 index此处需要的副作用。
  state.serverChecksums.clear()
  // 满足 `responseChecksums` 时，服务层 index执行该分支。
  if (responseChecksums) {
    // 循环处理 `const [key, hash] of Object.entries(responseChecksums)`，让服务层 index把同类条目按顺序走完。
    for (const [key, hash] of Object.entries(responseChecksums)) {
      // state.serverChecksums.set 写入新的状态值，使服务层 index后续读取保持一致。
      state.serverChecksums.set(key, hash)
    }
  } else {
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'team-memory-sync: server response missing entryChecksums (pre-#283027 deploy) — next push will be full, not delta',
      { level: 'debug' },
    )
  }

  // filesWritten 文件数据保存`writeRemoteEntriesToLocal`，供服务层 index后续处理使用。
  const filesWritten = await writeRemoteEntriesToLocal(entries)
  // 满足 `filesWritten > 0` 时，服务层 index执行该分支。
  if (filesWritten > 0) {
    // 从 `await import('../../utils/claudemd.js')` 解构 clearMemoryFileCaches，减少服务层 index对同一对象的重复访问。
    const { clearMemoryFileCaches } = await import('../../utils/claudemd.js')
    // 清理相关缓存，确保服务层 index下一次读取时重新加载最新数据。
    clearMemoryFileCaches()
  }
  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`team-memory-sync: pulled ${filesWritten} files`, {
    level: 'info',
  })

  // 调用 logPull，触发服务层 index此处需要的副作用。
  logPull(startTime, { success: true, filesWritten })

  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return {
    success: true,
    filesWritten,
    entryCount: Object.keys(entries).length,
  }
}

/**
 * Push local team memory files to the server with optimistic locking.
 *
 * Uses delta upload: only keys whose local content hash differs from
 * serverChecksums are included in the PUT. On 412 conflict, probes
 * GET ?view=hashes to refresh serverChecksums, recomputes the delta
 * (naturally excluding keys where a teammate's push matches ours),
 * and retries. No merge, no disk writes — server-only new keys from
 * a teammate's concurrent push propagate on the next pull.
 *
 * Local-wins-on-conflict is the opposite of syncTeamMemory's pull-first
 * semantics. This is intentional: pushTeamMemory is triggered by a local edit,
 * and that edit must not be silently discarded just because a teammate pushed
 * in the meantime. Content-level merge (same key, both changed) is not
 * attempted — the local version simply overwrites the server version for that
 * key, and the server's edit to that key is lost. This is the lesser evil:
 * the local user is actively editing and can re-incorporate the teammate's
 * changes, whereas silently discarding the local edit loses work the user
 * just did with no recourse.
 */
// pushTeamMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pushTeamMemory(
  state: SyncState,
): Promise<TeamMemorySyncPushResult> {
  // startTime记录时间`Date.now`，供服务层 index后续处理使用。
  const startTime = Date.now()
  // conflictRetries 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let conflictRetries = 0

  // 满足 `!isUsingOAuth()` 时，服务层 index执行该分支。
  if (!isUsingOAuth()) {
    // 调用 logPush，触发服务层 index此处需要的副作用。
    logPush(startTime, { success: false, errorType: 'no_oauth' })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesUploaded: 0,
      error: 'OAuth not available',
      errorType: 'no_oauth',
    }
  }

  // repoSlug读取`getGithubRepo`，供服务层 index后续处理使用。
  const repoSlug = await getGithubRepo()
  // repoSlug缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!repoSlug) {
    // 调用 logPush，触发服务层 index此处需要的副作用。
    logPush(startTime, { success: false, errorType: 'no_repo' })
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesUploaded: 0,
      error: 'No git remote found',
      errorType: 'no_repo',
    }
  }

  // Read local entries once at the start. Conflict resolution does NOT re-read
  // from disk — the delta computation against a refreshed serverChecksums naturally
  // excludes server-origin content, so the user's local edit cannot be clobbered.
  // Secret scanning (PSR M22174) happens here once — files with detected
  // secrets are excluded from the upload set.
  // localRead读取`readLocalTeamMemory`，供服务层 index后续处理使用。
  const localRead = await readLocalTeamMemory(state.serverMaxEntries)
  // entries 集合 命名 `localRead.entries`，让后续代码直接表达这个值的用途。
  const entries = localRead.entries
  // skippedSecrets 集合保存`localRead.skippedSecrets`，供服务层 index后续判断或输出使用。
  const skippedSecrets = localRead.skippedSecrets
  // 满足 `skippedSecrets.length > 0` 时，服务层 index执行该分支。
  if (skippedSecrets.length > 0) {
    // Log a user-visible warning listing which files were skipped and why.
    // Don't block the push — just exclude those files. The secret VALUE is
    // never logged, only the type label.
    // summary 命名 `skippedSecrets`，让后续代码直接表达这个值的用途。
    const summary = skippedSecrets
      // 链式调用 map，继续加工上一行在服务层 index中产生的数据。
      .map(s => `"${s.path}" (${s.label})`)
      .join(', ')
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-sync: ${skippedSecrets.length} file(s) skipped due to detected secrets: ${summary}. Remove the secret(s) to enable sync for these files.`,
      { level: 'warn' },
    )
    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_team_mem_secret_skipped', {
      file_count: skippedSecrets.length,
      // Only log gitleaks rule IDs (not values, not paths — paths could
      // leak repo structure). Comma-joined for compact single-field analytics.
      rule_ids: skippedSecrets
        // 链式调用 map，继续加工上一行在服务层 index中产生的数据。
        .map(s => s.ruleId)
        .join(
          ',',
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // Hash each local entry once. The loop recomputes the delta each iteration
  // (serverChecksums may change after a 412 probe) but local hashes are stable.
  // localHashes 集合 命名 `new Map<string, string>()`，让后续代码直接表达这个值的用途。
  const localHashes = new Map<string, string>()
  // 循环处理 `const [key, content] of Object.entries(entries)`，让服务层 index把同类条目按顺序走完。
  for (const [key, content] of Object.entries(entries)) {
    // localHashes.set 写入新的状态值，使服务层 index后续读取保持一致。
    localHashes.set(key, hashContent(content))
  }

  // sawConflict标记服务层 index是否启用对应路径。
  let sawConflict = false

  // 调用 for，触发服务层 index此处需要的副作用。
  for (
    let conflictAttempt = 0;
    conflictAttempt <= MAX_CONFLICT_RETRIES;
    conflictAttempt++
  ) {
    // Delta: only upload keys whose content hash differs from what we believe
    // the server holds. On first push after a fresh pull, this is exactly the
    // user's local edits. After a 412 probe, matching hashes are excluded —
    // server-origin content from a teammate's concurrent push is naturally
    // dropped from the delta, so we never re-upload it.
    // delta 从空对象开始收集键值，后续按名称补齐内容。
    const delta: Record<string, string> = {}
    // 循环处理 `const [key, localHash] of localHashes`，让服务层 index逐项把同类条目按顺序走完。
    for (const [key, localHash] of localHashes) {
      // `state.serverChecksums.get(key)` 与 `localHash` 不一致时刷新派生状态，避免使用过期结果。
      if (state.serverChecksums.get(key) !== localHash) {
        // delta[key更新为 `entries[key]!`，确保服务层 index后续读取最新状态。
        delta[key] = entries[key]!
      }
    }
    // deltaCount 数量派生`Object.keys`，供服务层 index后续处理使用。
    const deltaCount = Object.keys(delta).length

    // 满足 `deltaCount === 0` 时，服务层 index执行该分支。
    if (deltaCount === 0) {
      // Nothing to upload. This is the expected fast path after a fresh pull
      // with no local edits, and also the convergence point after a 412 where
      // the teammate's push was a strict superset of ours.
      // 调用 logPush，触发服务层 index此处需要的副作用。
      logPush(startTime, {
        success: true,
        conflict: sawConflict,
        conflictRetries,
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        filesUploaded: 0,
        ...(skippedSecrets.length > 0 && { skippedSecrets }),
      }
    }

    // Split the delta into PUT-sized batches to stay under the gateway's
    // body-size limit.  Typical deltas (1-3 edited files) land in one batch;
    // cold pushes with many files are where this earns its keep.  Each batch
    // is a complete PUT that upserts its keys independently — if batch N
    // fails, batches 1..N-1 are already committed server-side.  Updating
    // serverChecksums after each success means the outer conflict-loop retry
    // naturally resumes from the uncommitted tail (those keys still differ).
    // state.lastKnownChecksum is updated inside uploadTeamMemory on each
    // 200, so the ETag chain threads through the batches automatically.
    // batches 集合保存`batchDeltaByBytes`，供服务层 index后续处理使用。
    const batches = batchDeltaByBytes(delta)
    // filesUploaded 文件数据 命名 `0`，让后续代码直接表达这个值的用途。
    let filesUploaded = 0
    // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
    let result: TeamMemorySyncUploadResult | undefined

    // 按顺序遍历 `batches` 中的batch，逐个交给服务层 index处理。
    for (const batch of batches) {
      // 结果更新为 `await uploadTeamMemory(`，确保服务层后续读取最新状态。
      result = await uploadTeamMemory(
        state,
        repoSlug,
        batch,
        state.lastKnownChecksum,
      )
      // result.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
      if (!result.success) break

      // 逐项读取 `Object.keys(batch)` 中的key，按输入顺序推进服务层 index。
      for (const key of Object.keys(batch)) {
        // state.serverChecksums.set 写入新的状态值，使服务层 index后续读取保持一致。
        state.serverChecksums.set(key, localHashes.get(key)!)
      }
      // 服务层 index在这里处理 `filesUploaded += Object.keys(batch).length`，完成这一小步状态转换。
      filesUploaded += Object.keys(batch).length
    }
    // batches is non-empty (deltaCount > 0 guaranteed by the check above),
    // so the loop executed at least once.
    // 结果更新为 `result!`，确保服务层后续读取最新状态。
    result = result!

    // 满足 `result.success` 时，服务层 index执行该分支。
    if (result.success) {
      // Server-side delta propagation to disk (server-only new keys from a
      // teammate's concurrent push) happens on the next pull — we only
      // fetched hashes during conflict resolution, not bodies.
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        batches.length > 1
          ? `team-memory-sync: pushed ${filesUploaded} of ${localHashes.size} files in ${batches.length} batches`
          : `team-memory-sync: pushed ${filesUploaded} of ${localHashes.size} files (delta)`,
        { level: 'info' },
      )
      // 调用 logPush，触发服务层 index此处需要的副作用。
      logPush(startTime, {
        success: true,
        filesUploaded,
        conflict: sawConflict,
        conflictRetries,
        putBatches: batches.length > 1 ? batches.length : undefined,
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: true,
        filesUploaded,
        checksum: result.checksum,
        ...(skippedSecrets.length > 0 && { skippedSecrets }),
      }
    }

    // result.conflict缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
    if (!result.conflict) {
      // If the server returned a structured 413 with its effective
      // max_entries (anthropic/anthropic#293258), cache it so the next push
      // trims to the right cap. The server may GB-tune this per-org.
      // This push still fails — re-trimming mid-push would require re-reading
      // local entries and re-computing the delta, and we'd need
      // soft_delete_keys to shrink below current server count anyway.
      // `result.serverMaxEntries` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (result.serverMaxEntries !== undefined) {
        // serverMaxEntries 集合更新为 `result.serverMaxEntries`，确保服务层后续读取最新状态。
        state.serverMaxEntries = result.serverMaxEntries
        // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `team-memory-sync: learned server max_entries=${result.serverMaxEntries} from 413; next push will truncate to this`,
          { level: 'warn' },
        )
      }
      // filesUploaded may be nonzero if earlier batches committed before this
      // one failed. Those keys ARE on the server; the push is a failure
      // because it's incomplete, but we don't re-upload them on retry
      // (serverChecksums was updated).
      // 调用 logPush，触发服务层 index此处需要的副作用。
      logPush(startTime, {
        success: false,
        filesUploaded,
        conflictRetries,
        putBatches: batches.length > 1 ? batches.length : undefined,
        errorType: result.errorType,
        status: result.httpStatus,
        // Datadog: filter @error_code:team_memory_too_many_entries to track
        // too-many-files rejections distinct from gateway/unstructured 413s
        errorCode: result.serverErrorCode,
        serverMaxEntries: result.serverMaxEntries,
        serverReceivedEntries: result.serverReceivedEntries,
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        filesUploaded,
        error: result.error,
        errorType: result.errorType,
        httpStatus: result.httpStatus,
      }
    }

    // 412 conflict — refresh serverChecksums and retry with a tighter delta.
    // sawConflict更新为 `true`，确保服务层后续读取最新状态。
    sawConflict = true
    // 满足 `conflictAttempt >= MAX_CONFLICT_RETRIES` 时，服务层 index执行该分支。
    if (conflictAttempt >= MAX_CONFLICT_RETRIES) {
      // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `team-memory-sync: giving up after ${MAX_CONFLICT_RETRIES} conflict retries`,
        { level: 'warn' },
      )
      // 调用 logPush，触发服务层 index此处需要的副作用。
      logPush(startTime, {
        success: false,
        conflict: true,
        conflictRetries,
        errorType: 'conflict',
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        filesUploaded: 0,
        conflict: true,
        error: 'Conflict resolution failed after retries',
      }
    }

    // 服务层 index在这里处理 `conflictRetries++`，完成这一小步状态转换。
    conflictRetries++

    // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `team-memory-sync: conflict (412), probing server hashes (attempt ${conflictAttempt + 1}/${MAX_CONFLICT_RETRIES})`,
      { level: 'info' },
    )

    // Cheap probe: fetch only per-key checksums, no entry bodies. Refreshes
    // serverChecksums so the next iteration's delta drops any keys a teammate just
    // pushed with identical content.
    // probe读取`fetchTeamMemoryHashes`，供服务层 index后续处理使用。
    const probe = await fetchTeamMemoryHashes(state, repoSlug)
    // 组合条件 `!probe.success || !probe.entryChecksums` 成立时，服务层 index才启用这条专门路径。
    if (!probe.success || !probe.entryChecksums) {
      // Requires anthropic/anthropic#283027. A transient probe failure here is
      // fine: the push is failed and the watcher will retry on the next edit.
      // 调用 logPush，触发服务层 index此处需要的副作用。
      logPush(startTime, {
        success: false,
        conflict: true,
        conflictRetries,
        errorType: 'conflict',
      })
      // 返回结构化结果，集中表达服务层 index已经整理出的状态。
      return {
        success: false,
        filesUploaded: 0,
        conflict: true,
        error: `Conflict resolution hashes probe failed: ${probe.error}`,
      }
    }
    // 调用 state.serverChecksums.clear，触发服务层 index此处需要的副作用。
    state.serverChecksums.clear()
    // 循环处理 `const [key, hash] of Object.entries(probe.entryChecksums)`，让服务层 index把同类条目按顺序走完。
    for (const [key, hash] of Object.entries(probe.entryChecksums)) {
      // state.serverChecksums.set 写入新的状态值，使服务层 index后续读取保持一致。
      state.serverChecksums.set(key, hash)
    }
  }

  // 调用 logPush，触发服务层 index此处需要的副作用。
  logPush(startTime, { success: false, conflictRetries })
  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return {
    success: false,
    filesUploaded: 0,
    error: 'Unexpected end of conflict resolution loop',
  }
}

/**
 * Bidirectional sync: pull from server, merge with local, push back.
 * Server entries take precedence on conflict (last-write-wins by the server).
 * Push uses conflict resolution (retries on 412) via pushTeamMemory.
 */
// syncTeamMemory 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function syncTeamMemory(state: SyncState): Promise<{
  success: boolean
  filesPulled: number
  filesPushed: number
  error?: string
}> {
  // 1. Pull remote → local (skip ETag cache for full sync)
  // pullResult保存`pullTeamMemory`，供服务层 index后续处理使用。
  const pullResult = await pullTeamMemory(state, { skipEtagCache: true })
  // pullResult.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!pullResult.success) {
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesPulled: 0,
      filesPushed: 0,
      error: pullResult.error,
    }
  }

  // 2. Push local → remote (with conflict resolution)
  // pushResult保存`pushTeamMemory`，供服务层 index后续处理使用。
  const pushResult = await pushTeamMemory(state)
  // pushResult.success 集合缺失时提前走兜底路径，避免服务层 index继续依赖无效输入。
  if (!pushResult.success) {
    // 返回结构化结果，集中表达服务层 index已经整理出的状态。
    return {
      success: false,
      filesPulled: pullResult.filesWritten,
      filesPushed: 0,
      error: pushResult.error,
    }
  }

  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `team-memory-sync: synced (pulled ${pullResult.filesWritten}, pushed ${pushResult.filesUploaded})`,
    { level: 'info' },
  )

  // 返回结构化结果，集中表达服务层 index已经整理出的状态。
  return {
    success: true,
    filesPulled: pullResult.filesWritten,
    filesPushed: pushResult.filesUploaded,
  }
}

// ─── Telemetry helpers ───────────────────────────────────────

// logPull 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logPull(
  startTime: number,
  outcome: {
    success: boolean
    filesWritten?: number
    notModified?: boolean
    errorType?: string
    status?: number
  },
): void {
  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_team_mem_sync_pull', {
    success: outcome.success,
    files_written: outcome.filesWritten ?? 0,
    not_modified: outcome.notModified ?? false,
    duration_ms: Date.now() - startTime,
    ...(outcome.errorType && {
      errorType:
        outcome.errorType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...(outcome.status && { status: outcome.status }),
  })
}

// logPush 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logPush(
  startTime: number,
  outcome: {
    success: boolean
    filesUploaded?: number
    conflict?: boolean
    conflictRetries?: number
    errorType?: string
    status?: number
    putBatches?: number
    errorCode?: string
    serverMaxEntries?: number
    serverReceivedEntries?: number
  },
): void {
  // 记录服务层 index运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_team_mem_sync_push', {
    success: outcome.success,
    files_uploaded: outcome.filesUploaded ?? 0,
    conflict: outcome.conflict ?? false,
    conflict_retries: outcome.conflictRetries ?? 0,
    duration_ms: Date.now() - startTime,
    ...(outcome.errorType && {
      errorType:
        outcome.errorType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...(outcome.status && { status: outcome.status }),
    ...(outcome.putBatches && { put_batches: outcome.putBatches }),
    ...(outcome.errorCode && {
      error_code:
        outcome.errorCode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }),
    ...(outcome.serverMaxEntries !== undefined && {
      server_max_entries: outcome.serverMaxEntries,
    }),
    ...(outcome.serverReceivedEntries !== undefined && {
      server_received_entries: outcome.serverReceivedEntries,
    }),
  })
}
