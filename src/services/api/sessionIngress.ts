// 引入 axios、AxiosError，将 axios 中已经封装好的能力接到本文件流程里。
import axios, { type AxiosError } from 'axios'
// 类型依赖 { UUID } 来自 crypto，用于校准API 服务 session Ingress的数据契约。
import type { UUID } from 'crypto'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 类型依赖 { Entry, TranscriptMessage } 来自 ../../types/logs.js，用于校准API 服务 session Ingress的数据契约。
import type { Entry, TranscriptMessage } from '../../types/logs.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../../utils/diagLogs.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 sequential 工具函数，把通用处理留在 ../../utils/sequential.js 中维护。
import { sequential } from '../../utils/sequential.js'
// 复用 getSessionIngressAuthToken 工具函数，把通用处理留在 ../../utils/sessionIngressAuth.js 中维护。
import { getSessionIngressAuthToken } from '../../utils/sessionIngressAuth.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 getOAuthHeaders 工具函数，把通用处理留在 ../../utils/teleport/api.js 中维护。
import { getOAuthHeaders } from '../../utils/teleport/api.js'

// SessionIngressError 描述API 服务 session Ingress需要实现的字段和回调，避免跨模块交互时契约漂移。
interface SessionIngressError {
  error?: {
    message?: string
    type?: string
  }
}

// Module-level state
// lastUuidMap 用 Map 保存键值关系，方便API 服务 session Ingress按 key 查找和复用。
const lastUuidMap: Map<string, UUID> = new Map()

// MAX_RETRIES 集合保存`10`，供API 服务 session Ingress后续判断或输出使用。
const MAX_RETRIES = 10
// BASE_DELAY_MS 集合保存`500`，供API 服务 session Ingress后续判断或输出使用。
const BASE_DELAY_MS = 500

// Per-session sequential wrappers to prevent concurrent log writes
// sequentialAppendBySession 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
const sequentialAppendBySession: Map<
  string,
  // API 服务 session Ingress在这里处理 `(`，完成这一小步状态转换。
  (
    entry: TranscriptMessage,
    url: string,
    headers: Record<string, string>,
  ) => Promise<boolean>
> = new Map()

/**
 * Gets or creates a sequential wrapper for a session
 * This ensures that log appends for a session are processed one at a time
 */
// getOrCreateSequentialAppend 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOrCreateSequentialAppend(sessionId: string) {
  // sequentialAppend读取`sequentialAppendBySession.get`，供API 服务 session Ingress后续处理使用。
  let sequentialAppend = sequentialAppendBySession.get(sessionId)
  // sequentialAppend缺失时提前走兜底路径，避免API 服务 session Ingress继续依赖无效输入。
  if (!sequentialAppend) {
    // sequentialAppend更新为 `sequential(`，确保API 服务后续读取最新状态。
    sequentialAppend = sequential(
      async (
        entry: TranscriptMessage,
        url: string,
        headers: Record<string, string>,
      ) => await appendSessionLogImpl(sessionId, entry, url, headers),
    )
    // sequentialAppendBySession.set 写入新的状态值，使API 服务 session Ingress后续读取保持一致。
    sequentialAppendBySession.set(sessionId, sequentialAppend)
  }
  // 返回 `sequentialAppend`，作为API 服务 session Ingress这次计算的结果。
  return sequentialAppend
}

/**
 * Internal implementation of appendSessionLog with retry logic
 * Retries on transient errors (network, 5xx, 429). On 409, adopts the server's
 * last UUID and retries (handles stale state from killed process's in-flight
 * requests). Fails immediately on 401.
 */
// appendSessionLogImpl 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function appendSessionLogImpl(
  sessionId: string,
  entry: TranscriptMessage,
  url: string,
  headers: Record<string, string>,
): Promise<boolean> {
  // 循环处理 `let attempt = 1; attempt <= MAX_RETRIES; attempt++`，让API 服务 session Ingress逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // 保护这一段可能失败的API 服务 session Ingress操作，确保异常能进入相邻错误处理。
    try {
      // lastUuid读取`lastUuidMap.get`，供API 服务 session Ingress后续处理使用。
      const lastUuid = lastUuidMap.get(sessionId)
      // requestHeaders 请求数据 集中保存API 服务 session Ingress要一起传递的字段。
      const requestHeaders = { ...headers }
      // 满足 `lastUuid` 时，API 服务 session Ingress执行该分支。
      if (lastUuid) {
        // requestHeaders['Last-Uuid' 请求数据更新为 `lastUuid`，确保API 服务 session Ingress后续读取最新状态。
        requestHeaders['Last-Uuid'] = lastUuid
      }

      // 接口响应保存`axios.put`，供API 服务 session Ingress后续处理使用。
      const response = await axios.put(url, entry, {
        headers: requestHeaders,
        // 这个回调绑定到 validateStatus: status => status < 500,，负责API 服务 session Ingress在该局部场景下的响应。
        validateStatus: status => status < 500,
      })

      // 组合条件 `response.status === 200 || response.status === 201` 成立时，API 服务 session Ingress才启用这条专门路径。
      if (response.status === 200 || response.status === 201) {
        // lastUuidMap.set 写入新的状态值，使API 服务 session Ingress后续读取保持一致。
        lastUuidMap.set(sessionId, entry.uuid)
        // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Successfully persisted session log entry for session ${sessionId}`,
        )
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }

      // 满足 `response.status === 409` 时，API 服务 session Ingress执行该分支。
      if (response.status === 409) {
        // Check if our entry was actually stored (server returned 409 but entry exists)
        // This handles the scenario where entry was stored but client received an error
        // response, causing lastUuidMap to be stale
        // serverLastUuid 命名 `response.headers['x-last-uuid']`，让后续代码直接表达这个值的用途。
        const serverLastUuid = response.headers['x-last-uuid']
        // 满足 `serverLastUuid === entry.uuid` 时，API 服务 session Ingress执行该分支。
        if (serverLastUuid === entry.uuid) {
          // Our entry IS the last entry on server - it was stored successfully previously
          // lastUuidMap.set 写入新的状态值，使API 服务 session Ingress后续读取保持一致。
          lastUuidMap.set(sessionId, entry.uuid)
          // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Session entry ${entry.uuid} already present on server, recovering from stale state`,
          )
          // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
          logForDiagnosticsNoPII('info', 'session_persist_recovered_from_409')
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }

        // Another writer (e.g. in-flight request from a killed process)
        // advanced the server's chain. Try to adopt the server's last UUID
        // from the response header, or re-fetch the session to discover it.
        // 满足 `serverLastUuid` 时，API 服务 session Ingress执行该分支。
        if (serverLastUuid) {
          // lastUuidMap.set 写入新的状态值，使API 服务 session Ingress后续读取保持一致。
          lastUuidMap.set(sessionId, serverLastUuid as UUID)
          // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Session 409: adopting server lastUuid=${serverLastUuid} from header, retrying entry ${entry.uuid}`,
          )
        } else {
          // Server didn't return x-last-uuid (e.g. v1 endpoint). Re-fetch
          // the session to discover the current head of the append chain.
          // logs 集合读取`fetchSessionLogsFromUrl`，供API 服务 session Ingress后续处理使用。
          const logs = await fetchSessionLogsFromUrl(sessionId, url, headers)
          // adoptedUuid筛选`findLastUuid`，供API 服务 session Ingress后续处理使用。
          const adoptedUuid = findLastUuid(logs)
          // 满足 `adoptedUuid` 时，API 服务 session Ingress执行该分支。
          if (adoptedUuid) {
            // lastUuidMap.set 写入新的状态值，使API 服务 session Ingress后续读取保持一致。
            lastUuidMap.set(sessionId, adoptedUuid)
            // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Session 409: re-fetched ${logs!.length} entries, adopting lastUuid=${adoptedUuid}, retrying entry ${entry.uuid}`,
            )
          } else {
            // Can't determine server state — give up
            // errorData 错误信息 命名 `response.data as SessionIngressError`，让后续代码直接表达这个值的用途。
            const errorData = response.data as SessionIngressError
            // errorMessage 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const errorMessage =
              errorData.error?.message || 'Concurrent modification detected'
            // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `Session persistence conflict: UUID mismatch for session ${sessionId}, entry ${entry.uuid}. ${errorMessage}`,
              ),
            )
            // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
            logForDiagnosticsNoPII(
              'error',
              'session_persist_fail_concurrent_modification',
            )
            // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
            return false
          }
        }
        // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
        logForDiagnosticsNoPII('info', 'session_persist_409_adopt_server_uuid')
        // 跳过当前项，继续处理API 服务 session Ingress中的下一轮循环。
        continue // retry with updated lastUuid
      }

      // 满足 `response.status === 401` 时，API 服务 session Ingress执行该分支。
      if (response.status === 401) {
        // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
        logForDebugging('Session token expired or invalid')
        // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
        logForDiagnosticsNoPII('error', 'session_persist_fail_bad_token')
        // 返回 `false // Non-retryable`，作为API 服务 session Ingress这次计算的结果。
        return false // Non-retryable
      }

      // Other 4xx (429, etc.) - retryable
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Failed to persist session log: ${response.status} ${response.statusText}`,
      )
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'session_persist_fail_status', {
        status: response.status,
        attempt,
      })
    } catch (error) {
      // Network errors, 5xx - retryable
      // axiosError 错误信息保存`error as AxiosError<SessionIngressError>`，供API 服务 session Ingress后续判断或输出使用。
      const axiosError = error as AxiosError<SessionIngressError>
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logError(new Error(`Error persisting session log: ${axiosError.message}`))
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'session_persist_fail_status', {
        status: axiosError.status,
        attempt,
      })
    }

    // 满足 `attempt === MAX_RETRIES` 时，API 服务 session Ingress执行该分支。
    if (attempt === MAX_RETRIES) {
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Remote persistence failed after ${MAX_RETRIES} attempts`)
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII(
        'error',
        'session_persist_error_retries_exhausted',
        { attempt },
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // delayMs 集合保存`Math.min`，供API 服务 session Ingress后续处理使用。
    const delayMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 8000)
    // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Remote persistence attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delayMs}ms…`,
    )
    // 等待 `sleep(delayMs)` 完成，再继续API 服务 session Ingress的异步流程。
    await sleep(delayMs)
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Append a log entry to the session using JWT token
 * Uses optimistic concurrency control with Last-Uuid header
 * Ensures sequential execution per session to prevent race conditions
 */
// appendSessionLog 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function appendSessionLog(
  sessionId: string,
  entry: TranscriptMessage,
  url: string,
): Promise<boolean> {
  // sessionToken 会话数据读取`getSessionIngressAuthToken`，供API 服务 session Ingress后续处理使用。
  const sessionToken = getSessionIngressAuthToken()
  // sessionToken 会话数据缺失时提前走兜底路径，避免API 服务 session Ingress继续依赖无效输入。
  if (!sessionToken) {
    // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
    logForDebugging('No session token available for session persistence')
    // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
    logForDiagnosticsNoPII('error', 'session_persist_fail_jwt_no_token')
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 请求头 集中保存API 服务 session Ingress要一起传递的字段。
  const headers: Record<string, string> = {
    Authorization: `Bearer ${sessionToken}`,
    'Content-Type': 'application/json',
  }

  // sequentialAppend读取`getOrCreateSequentialAppend`，供API 服务 session Ingress后续处理使用。
  const sequentialAppend = getOrCreateSequentialAppend(sessionId)
  // 返回 `sequentialAppend(entry, url, headers)`，作为API 服务 session Ingress这次计算的结果。
  return sequentialAppend(entry, url, headers)
}

/**
 * Get all session logs for hydration
 */
// getSessionLogs 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionLogs(
  sessionId: string,
  url: string,
): Promise<Entry[] | null> {
  // sessionToken 会话数据读取`getSessionIngressAuthToken`，供API 服务 session Ingress后续处理使用。
  const sessionToken = getSessionIngressAuthToken()
  // sessionToken 会话数据缺失时提前走兜底路径，避免API 服务 session Ingress继续依赖无效输入。
  if (!sessionToken) {
    // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
    logForDebugging('No session token available for fetching session logs')
    // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
    logForDiagnosticsNoPII('error', 'session_get_fail_no_token')
    // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
    return null
  }

  // 请求头 集中保存API 服务 session Ingress要一起传递的字段。
  const headers = { Authorization: `Bearer ${sessionToken}` }
  // logs 集合读取`fetchSessionLogsFromUrl`，供API 服务 session Ingress后续处理使用。
  const logs = await fetchSessionLogsFromUrl(sessionId, url, headers)

  // 组合条件 `logs && logs.length > 0` 成立时，API 服务 session Ingress才启用这条专门路径。
  if (logs && logs.length > 0) {
    // Update our lastUuid to the last entry's UUID
    // lastEntry保存`logs.at`，供API 服务 session Ingress后续处理使用。
    const lastEntry = logs.at(-1)
    // 组合条件 `lastEntry && 'uuid' in lastEntry && lastEntry.uuid` 成立时，API 服务 session Ingress才启用这条专门路径。
    if (lastEntry && 'uuid' in lastEntry && lastEntry.uuid) {
      // lastUuidMap.set 写入新的状态值，使API 服务 session Ingress后续读取保持一致。
      lastUuidMap.set(sessionId, lastEntry.uuid)
    }
  }

  // 返回 `logs`，作为API 服务 session Ingress这次计算的结果。
  return logs
}

/**
 * Get all session logs for hydration via OAuth
 * Used for teleporting sessions from the Sessions API
 */
// getSessionLogsViaOAuth 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getSessionLogsViaOAuth(
  sessionId: string,
  accessToken: string,
  orgUUID: string,
): Promise<Entry[] | null> {
  // URL读取`getOauthConfig`，供API 服务 session Ingress后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/v1/session_ingress/session/${sessionId}`
  // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[session-ingress] Fetching session logs from: ${url}`)
  // 请求头 集中保存API 服务 session Ingress要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }
  // 结果读取`fetchSessionLogsFromUrl`，供API 服务 session Ingress后续处理使用。
  const result = await fetchSessionLogsFromUrl(sessionId, url, headers)
  // 返回 `result`，作为API 服务 session Ingress这次计算的结果。
  return result
}

/**
 * Response shape from GET /v1/code/sessions/{id}/teleport-events.
 * WorkerEvent.payload IS the Entry (TranscriptMessage struct) — the CLI
 * writes it via AddWorkerEvent, the server stores it opaque, we read it
 * back here.
 */
// TeleportEventsResponse 固化API 服务 session Ingress里传递的数据形状，帮助调用方按同一结构读写字段。
type TeleportEventsResponse = {
  data: Array<{
    event_id: string
    event_type: string
    is_compaction: boolean
    payload: Entry | null
    created_at: string
  }>
  // Unset when there are no more pages — this IS the end-of-stream
  // signal (no separate has_more field).
  next_cursor?: string
}

/**
 * Get worker events (transcript) via the CCR v2 Sessions API. Replaces
 * getSessionLogsViaOAuth once session-ingress is retired.
 *
 * The server dispatches per-session: Spanner for v2-native sessions,
 * threadstore for pre-backfill session_* IDs. The cursor is opaque to us —
 * echo it back until next_cursor is unset.
 *
 * Paginated (500/page default, server max 1000). session-ingress's one-shot
 * 50k is gone; we loop.
 */
// getTeleportEvents 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getTeleportEvents(
  sessionId: string,
  accessToken: string,
  orgUUID: string,
): Promise<Entry[] | null> {
  // baseUrl读取`getOauthConfig`，供API 服务 session Ingress后续处理使用。
  const baseUrl = `${getOauthConfig().BASE_API_URL}/v1/code/sessions/${sessionId}/teleport-events`
  // 请求头 集中保存API 服务 session Ingress要一起传递的字段。
  const headers = {
    ...getOAuthHeaders(accessToken),
    'x-organization-uuid': orgUUID,
  }

  // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[teleport] Fetching events from: ${baseUrl}`)

  // all 从空数组开始收集，后续循环会按处理顺序追加条目。
  const all: Entry[] = []
  // cursor 先占位，稍后的条件分支会根据实际输入补齐它。
  let cursor: string | undefined
  // pages 集合保存`0`，供API 服务 session Ingress后续判断或输出使用。
  let pages = 0

  // Infinite-loop guard: 1000/page × 100 pages = 100k events. Larger than
  // session-ingress's 50k one-shot. If we hit this, something's wrong
  // (server not advancing cursor) — bail rather than hang.
  // maxPages 集合保存`100`，供API 服务 session Ingress后续判断或输出使用。
  const maxPages = 100

  // while 使用 pages < maxPages 完成API 服务 session Ingress里的对应操作。
  while (pages < maxPages) {
    // params 集合 集中保存API 服务 session Ingress要一起传递的字段。
    const params: Record<string, string | number> = { limit: 1000 }
    // `cursor` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (cursor !== undefined) {
      // cursor更新为 `cursor`，确保API 服务后续读取最新状态。
      params.cursor = cursor
    }

    // response 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let response
    // 保护这一段可能失败的API 服务 session Ingress操作，确保异常能进入相邻错误处理。
    try {
      // 接口响应更新为 `await axios.get<TeleportEventsResponse>(baseUrl, {`，确保API 服务后续读取最新状态。
      response = await axios.get<TeleportEventsResponse>(baseUrl, {
        headers,
        params,
        timeout: 20000,
        // 这个回调绑定到 validateStatus: status => status < 500,，负责API 服务 session Ingress在该局部场景下的响应。
        validateStatus: status => status < 500,
      })
    } catch (e) {
      // err保存`e as AxiosError`，供API 服务 session Ingress后续判断或输出使用。
      const err = e as AxiosError
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logError(new Error(`Teleport events fetch failed: ${err.message}`))
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'teleport_events_fetch_fail')
      // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
      return null
    }

    // 满足 `response.status === 404` 时，API 服务 session Ingress执行该分支。
    if (response.status === 404) {
      // 404 on page 0 is ambiguous during the migration window:
      //   (a) Session genuinely not found (not in Spanner AND not in
      //       threadstore) — nothing to fetch.
      //   (b) Route-level 404: endpoint not deployed yet, or session is
      //       a threadstore session not yet backfilled into Spanner.
      // We can't tell them apart from the response alone. Returning null
      // lets the caller fall back to session-ingress, which will correctly
      // return empty for case (a) and data for case (b). Once the backfill
      // is complete and session-ingress is gone, the fallback also returns
      // null → same "Failed to fetch session logs" error as today.
      //
      // 404 mid-pagination (pages > 0) means session was deleted between
      // pages — return what we have.
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[teleport] Session ${sessionId} not found (page ${pages})`,
      )
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'teleport_events_not_found')
      // 返回 `pages === 0 ? null : all`，作为API 服务 session Ingress这次计算的结果。
      return pages === 0 ? null : all
    }

    // 满足 `response.status === 401` 时，API 服务 session Ingress执行该分支。
    if (response.status === 401) {
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'teleport_events_bad_token')
      // 抛出 new Error(，阻止API 服务 session Ingress在无效状态下继续运行。
      throw new Error(
        'Your session has expired. Please run /login to sign in again.',
      )
    }

    // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 200) {
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Teleport events returned ${response.status}: ${jsonStringify(response.data)}`,
        ),
      )
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'teleport_events_bad_status')
      // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
      return null
    }

    // 从 `response.data` 解构 data、next_cursor，减少API 服务 session Ingress对同一对象的重复访问。
    const { data, next_cursor } = response.data
    // 满足 `!Array.isArray(data)` 时，API 服务 session Ingress执行该分支。
    if (!Array.isArray(data)) {
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logError(
        new Error(
          `Teleport events invalid response shape: ${jsonStringify(response.data)}`,
        ),
      )
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'teleport_events_invalid_shape')
      // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
      return null
    }

    // payload IS the Entry. null payload happens for threadstore non-generic
    // events (server skips them) or encryption failures — skip here too.
    // 按顺序遍历 `data` 中的ev，逐个交给API 服务 session Ingress处理。
    for (const ev of data) {
      // `ev.payload` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (ev.payload !== null) {
        // all追加新条目，保持收集顺序与输入顺序一致。
        all.push(ev.payload)
      }
    }

    // API 服务 session Ingress在这里处理 `pages++`，完成这一小步状态转换。
    pages++
    // == null covers both `null` and `undefined` — the proto omits the
    // field at end-of-stream, but some serializers emit `null`. Strict
    // `=== undefined` would loop forever on `null` (cursor=null in query
    // params stringifies to "null", which the server rejects or echoes).
    // 满足 `next_cursor == null` 时，API 服务 session Ingress执行该分支。
    if (next_cursor == null) {
      // 结束这个分支或循环，避免API 服务 session Ingress继续落入后续路径。
      break
    }
    // cursor更新为 `next_cursor`，确保API 服务后续读取最新状态。
    cursor = next_cursor
  }

  // 满足 `pages >= maxPages` 时，API 服务 session Ingress执行该分支。
  if (pages >= maxPages) {
    // Don't fail — return what we have. Better to teleport with a
    // truncated transcript than not at all.
    // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(`Teleport events hit page cap (${maxPages}) for ${sessionId}`),
    )
    // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
    logForDiagnosticsNoPII('warn', 'teleport_events_page_cap')
  }

  // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[teleport] Fetched ${all.length} events over ${pages} page(s) for ${sessionId}`,
  )
  // 返回 `all`，作为API 服务 session Ingress这次计算的结果。
  return all
}

/**
 * Shared implementation for fetching session logs from a URL
 */
// fetchSessionLogsFromUrl 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchSessionLogsFromUrl(
  sessionId: string,
  url: string,
  headers: Record<string, string>,
): Promise<Entry[] | null> {
  // 保护这一段可能失败的API 服务 session Ingress操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应读取`axios.get`，供API 服务 session Ingress后续处理使用。
    const response = await axios.get(url, {
      headers,
      timeout: 20000,
      // 这个回调绑定到 validateStatus: status => status < 500,，负责API 服务 session Ingress在该局部场景下的响应。
      validateStatus: status => status < 500,
      params: isEnvTruthy(process.env.CLAUDE_AFTER_LAST_COMPACT)
        ? { after_last_compact: true }
        : undefined,
    })

    // 满足 `response.status === 200` 时，API 服务 session Ingress执行该分支。
    if (response.status === 200) {
      // data保存`response.data`，供后续判断或组装使用。
      const data = response.data

      // Validate the response structure
      // `!data || typeof data` 与 `'object' || !Array.isArray(data...` 不一致时刷新派生状态，避免使用过期结果。
      if (!data || typeof data !== 'object' || !Array.isArray(data.loglines)) {
        // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Invalid session logs response format: ${jsonStringify(data)}`,
          ),
        )
        // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
        logForDiagnosticsNoPII('error', 'session_get_fail_invalid_response')
        // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
        return null
      }

      // logs 集合 命名 `data.loglines as Entry[]`，让后续代码直接表达这个值的用途。
      const logs = data.loglines as Entry[]
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Fetched ${logs.length} session logs for session ${sessionId}`,
      )
      // 返回 `logs`，作为API 服务 session Ingress这次计算的结果。
      return logs
    }

    // 满足 `response.status === 404` 时，API 服务 session Ingress执行该分支。
    if (response.status === 404) {
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`No existing logs for session ${sessionId}`)
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('warn', 'session_get_no_logs_for_session')
      // 返回列表结果，保留API 服务 session Ingress已经排好的条目顺序。
      return []
    }

    // 满足 `response.status === 401` 时，API 服务 session Ingress执行该分支。
    if (response.status === 401) {
      // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Auth token expired or invalid')
      // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
      logForDiagnosticsNoPII('error', 'session_get_fail_bad_token')
      // 抛出 new Error(，阻止API 服务 session Ingress在无效状态下继续运行。
      throw new Error(
        'Your session has expired. Please run /login to sign in again.',
      )
    }

    // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Failed to fetch session logs: ${response.status} ${response.statusText}`,
    )
    // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
    logForDiagnosticsNoPII('error', 'session_get_fail_status', {
      status: response.status,
    })
    // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
    return null
  } catch (error) {
    // axiosError 错误信息保存`error as AxiosError<SessionIngressError>`，供API 服务 session Ingress后续判断或输出使用。
    const axiosError = error as AxiosError<SessionIngressError>
    // 记录API 服务 session Ingress运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Error fetching session logs: ${axiosError.message}`))
    // 调用 logForDiagnosticsNoPII，触发API 服务 session Ingress此处需要的副作用。
    logForDiagnosticsNoPII('error', 'session_get_fail_status', {
      status: axiosError.status,
    })
    // 返回 `null`，作为API 服务 session Ingress这次计算的结果。
    return null
  }
}

/**
 * Walk backward through entries to find the last one with a uuid.
 * Some entry types (SummaryMessage, TagMessage) don't have one.
 */
// findLastUuid 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findLastUuid(logs: Entry[] | null): UUID | undefined {
  // logs 集合缺失时提前走兜底路径，避免API 服务 session Ingress继续依赖无效输入。
  if (!logs) {
    // 返回 `undefined`，作为API 服务 session Ingress这次计算的结果。
    return undefined
  }
  // entry筛选`logs.findLast`，供API 服务 session Ingress后续处理使用。
  const entry = logs.findLast(e => 'uuid' in e && e.uuid)
  // 返回 `entry && 'uuid' in entry ? (entry.uuid as UUID) : undefined`，作为API 服务 session Ingress这次计算的结果。
  return entry && 'uuid' in entry ? (entry.uuid as UUID) : undefined
}

/**
 * Clear cached state for a session
 */
// clearSession 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSession(sessionId: string): void {
  // 调用 lastUuidMap.delete，触发API 服务 session Ingress此处需要的副作用。
  lastUuidMap.delete(sessionId)
  // 调用 sequentialAppendBySession.delete，触发API 服务 session Ingress此处需要的副作用。
  sequentialAppendBySession.delete(sessionId)
}

/**
 * Clear all cached session state (all sessions).
 * Use this on /clear to free sub-agent session entries.
 */
// clearAllSessions 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAllSessions(): void {
  // 调用 lastUuidMap.clear，触发API 服务 session Ingress此处需要的副作用。
  lastUuidMap.clear()
  // 调用 sequentialAppendBySession.clear，触发API 服务 session Ingress此处需要的副作用。
  sequentialAppendBySession.clear()
}
