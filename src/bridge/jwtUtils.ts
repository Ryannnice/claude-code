// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 jsonParse 工具函数，把通用处理留在 ../utils/slowOperations.js 中维护。
import { jsonParse } from '../utils/slowOperations.js'

/** Format a millisecond duration as a human-readable string (e.g. "5m 30s"). */
// formatDuration 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatDuration(ms: number): string {
  // 满足 `ms < 60_000) return `${Math.round(ms / 1000` 时，远程桥接会话执行该分支。
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  // m保存`Math.floor`，供远程桥接会话后续处理使用。
  const m = Math.floor(ms / 60_000)
  // s 集合保存`Math.round`，供远程桥接会话后续处理使用。
  const s = Math.round((ms % 60_000) / 1000)
  // 返回 `s > 0 ? `${m}m ${s}s` : `${m}m``，作为远程桥接会话这次计算的结果。
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

/**
 * Decode a JWT's payload segment without verifying the signature.
 * Strips the `sk-ant-si-` session-ingress prefix if present.
 * Returns the parsed JSON payload as `unknown`, or `null` if the
 * token is malformed or the payload is not valid JSON.
 */
// decodeJwtPayload 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decodeJwtPayload(token: string): unknown | null {
  // jwt保存`token.startsWith`，供远程桥接会话后续处理使用。
  const jwt = token.startsWith('sk-ant-si-')
    ? token.slice('sk-ant-si-'.length)
    : token
  // 片段列表格式化`jwt.split`，供远程桥接会话后续处理使用。
  const parts = jwt.split('.')
  // `parts.length` 与 `3 || !parts[1]` 不一致时刷新派生状态，避免使用过期结果。
  if (parts.length !== 3 || !parts[1]) return null
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `jsonParse(Buffer.from(parts[1], 'base64url').toString('utf8'))`，作为远程桥接会话这次计算的结果。
    return jsonParse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
}

/**
 * Decode the `exp` (expiry) claim from a JWT without verifying the signature.
 * @returns The `exp` value in Unix seconds, or `null` if unparseable
 */
// decodeJwtExpiry 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function decodeJwtExpiry(token: string): number | null {
  // payload读取`decodeJwtPayload`，供远程桥接会话后续处理使用。
  const payload = decodeJwtPayload(token)
  // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'exp' in payload &&
    typeof payload.exp === 'number'
  ) {
    // 返回 `payload.exp`，作为远程桥接会话这次计算的结果。
    return payload.exp
  }
  // 返回 `null`，作为远程桥接会话这次计算的结果。
  return null
}

/** Refresh buffer: request a new token before expiry. */
// TOKEN_REFRESH_BUFFER_MS 集合保存`5 * 60 * 1000`，供远程桥接会话远程桥接 jwt Utils后续判断或输出使用。
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

/** Fallback refresh interval when the new token's expiry is unknown. */
// FALLBACK_REFRESH_INTERVAL_MS 集合保存`30 * 60 * 1000 // 30 minutes`，供后续判断或组装使用。
const FALLBACK_REFRESH_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

/** Max consecutive failures before giving up on the refresh chain. */
// MAX_REFRESH_FAILURES 集合保存`3`，供后续判断或组装使用。
const MAX_REFRESH_FAILURES = 3

/** Retry delay when getAccessToken returns undefined. */
// REFRESH_RETRY_DELAY_MS 集合保存`60_000`，供后续判断或组装使用。
const REFRESH_RETRY_DELAY_MS = 60_000

/**
 * Creates a token refresh scheduler that proactively refreshes session tokens
 * before they expire. Used by both the standalone bridge and the REPL bridge.
 *
 * When a token is about to expire, the scheduler calls `onRefresh` with the
 * session ID and the bridge's OAuth access token. The caller is responsible
 * for delivering the token to the appropriate transport (child process stdin
 * for standalone bridge, WebSocket reconnect for REPL bridge).
 */
// createTokenRefreshScheduler 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createTokenRefreshScheduler({
  getAccessToken,
  onRefresh,
  label,
  refreshBufferMs = TOKEN_REFRESH_BUFFER_MS,
}: {
  // 这个回调绑定到 getAccessToken: () => string | undefined | Promise<string | undefined>，负责远程桥接会话在该局部场景下的响应。
  getAccessToken: () => string | undefined | Promise<string | undefined>
  // 这个回调绑定到 onRefresh: (sessionId: string, oauthToken: string) => void，负责远程桥接会话在该局部场景下的响应。
  onRefresh: (sessionId: string, oauthToken: string) => void
  label: string
  /** How long before expiry to fire refresh. Defaults to 5 min. */
  refreshBufferMs?: number
}): {
  // 这个回调绑定到 schedule: (sessionId: string, token: string) => void，负责远程桥接会话在该局部场景下的响应。
  schedule: (sessionId: string, token: string) => void
  // 这个回调绑定到 scheduleFromExpiresIn: (sessionId: string, expiresInSeconds: number) => void，负责远程桥接会话在该局部场景下的响应。
  scheduleFromExpiresIn: (sessionId: string, expiresInSeconds: number) => void
  // 这个回调绑定到 cancel: (sessionId: string) => void，负责远程桥接会话在该局部场景下的响应。
  cancel: (sessionId: string) => void
  // 这个回调绑定到 cancelAll: () => void，负责远程桥接会话在该局部场景下的响应。
  cancelAll: () => void
} {
  // timers 集合构建`new Map<string, ReturnType<typeof setTimeout>>()` 整理出中间结果，供远程桥接会话远程桥接 jwt Utils后续步骤使用。
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  // failureCounts 数量 命名 `new Map<string, number>()`，让后续代码直接表达这个值的用途。
  const failureCounts = new Map<string, number>()
  // Generation counter per session — incremented by schedule() and cancel()
  // so that in-flight async doRefresh() calls can detect when they've been
  // superseded and should skip setting follow-up timers.
  // generations 集合构建`new Map<string, number>()` 整理出中间结果，供远程桥接会话远程桥接 jwt Utils后续步骤使用。
  const generations = new Map<string, number>()

  // nextGeneration 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function nextGeneration(sessionId: string): number {
    // gen读取`generations.get`，供远程桥接会话后续处理使用。
    const gen = (generations.get(sessionId) ?? 0) + 1
    // generations.set 写入新的状态值，使远程桥接会话后续读取保持一致。
    generations.set(sessionId, gen)
    // 返回 `gen`，作为远程桥接会话这次计算的结果。
    return gen
  }

  // schedule 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function schedule(sessionId: string, token: string): void {
    // expiry保存`decodeJwtExpiry`，供远程桥接会话后续处理使用。
    const expiry = decodeJwtExpiry(token)
    // expiry缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!expiry) {
      // Token is not a decodable JWT (e.g. an OAuth token passed from the
      // REPL bridge WebSocket open handler).  Preserve any existing timer
      // (such as the follow-up refresh set by doRefresh) so the refresh
      // chain is not broken.
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[${label}:token] Could not decode JWT expiry for sessionId=${sessionId}, token prefix=${token.slice(0, 15)}…, keeping existing timer`,
      )
      // 远程桥接 jwt Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Clear any existing refresh timer — we have a concrete expiry to replace it.
    // existing读取`timers.get`，供远程桥接会话后续处理使用。
    const existing = timers.get(sessionId)
    // 满足 `existing` 时，远程桥接会话执行该分支。
    if (existing) {
      // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
      clearTimeout(existing)
    }

    // Bump generation to invalidate any in-flight async doRefresh.
    // gen保存`nextGeneration`，供远程桥接会话后续处理使用。
    const gen = nextGeneration(sessionId)

    // expiryDate记录时间`Date`，供远程桥接会话后续处理使用。
    const expiryDate = new Date(expiry * 1000).toISOString()
    // delayMs 集合记录时间`Date.now`，供远程桥接会话后续处理使用。
    const delayMs = expiry * 1000 - Date.now() - refreshBufferMs
    // 满足 `delayMs <= 0` 时，远程桥接会话执行该分支。
    if (delayMs <= 0) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[${label}:token] Token for sessionId=${sessionId} expires=${expiryDate} (past or within buffer), refreshing immediately`,
      )
      // 显式忽略 `doRefresh(sessionId, gen)` 的返回值，只保留它触发的副作用。
      void doRefresh(sessionId, gen)
      // 远程桥接 jwt Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[${label}:token] Scheduled token refresh for sessionId=${sessionId} in ${formatDuration(delayMs)} (expires=${expiryDate}, buffer=${refreshBufferMs / 1000}s)`,
    )

    // timer保存`setTimeout`，供远程桥接会话后续处理使用。
    const timer = setTimeout(doRefresh, delayMs, sessionId, gen)
    // timers.set 写入新的状态值，使远程桥接会话后续读取保持一致。
    timers.set(sessionId, timer)
  }

  /**
   * Schedule refresh using an explicit TTL (seconds until expiry) rather
   * than decoding a JWT's exp claim. Used by callers whose JWT is opaque
   * (e.g. POST /v1/code/sessions/{id}/bridge returns expires_in directly).
   */
  // scheduleFromExpiresIn 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function scheduleFromExpiresIn(
    sessionId: string,
    expiresInSeconds: number,
  ): void {
    // existing读取`timers.get`，供远程桥接会话后续处理使用。
    const existing = timers.get(sessionId)
    // 满足 `existing) clearTimeout(existing` 时，远程桥接会话执行该分支。
    if (existing) clearTimeout(existing)
    // gen保存`nextGeneration`，供远程桥接会话后续处理使用。
    const gen = nextGeneration(sessionId)
    // Clamp to 30s floor — if refreshBufferMs exceeds the server's expires_in
    // (e.g. very large buffer for frequent-refresh testing, or server shortens
    // expires_in unexpectedly), unclamped delayMs ≤ 0 would tight-loop.
    // delayMs 集合保存`Math.max`，供远程桥接会话后续处理使用。
    const delayMs = Math.max(expiresInSeconds * 1000 - refreshBufferMs, 30_000)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[${label}:token] Scheduled token refresh for sessionId=${sessionId} in ${formatDuration(delayMs)} (expires_in=${expiresInSeconds}s, buffer=${refreshBufferMs / 1000}s)`,
    )
    // timer保存`setTimeout`，供远程桥接会话后续处理使用。
    const timer = setTimeout(doRefresh, delayMs, sessionId, gen)
    // timers.set 写入新的状态值，使远程桥接会话后续读取保持一致。
    timers.set(sessionId, timer)
  }

  // doRefresh 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function doRefresh(sessionId: string, gen: number): Promise<void> {
    // oauthToken 先占位，稍后的条件分支会根据实际输入补齐它。
    let oauthToken: string | undefined
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // oauthToken更新为 `await getAccessToken()`，确保Bridge 通信后续读取最新状态。
      oauthToken = await getAccessToken()
    } catch (err) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[${label}:token] getAccessToken threw for sessionId=${sessionId}: ${errorMessage(err)}`,
        { level: 'error' },
      )
    }

    // If the session was cancelled or rescheduled while we were awaiting,
    // the generation will have changed — bail out to avoid orphaned timers.
    // `generations.get(sessionId)` 与 `gen` 不一致时刷新派生状态，避免使用过期结果。
    if (generations.get(sessionId) !== gen) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[${label}:token] doRefresh for sessionId=${sessionId} stale (gen ${gen} vs ${generations.get(sessionId)}), skipping`,
      )
      // 远程桥接 jwt Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // oauthToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!oauthToken) {
      // failures 集合读取`failureCounts.get`，供远程桥接会话后续处理使用。
      const failures = (failureCounts.get(sessionId) ?? 0) + 1
      // failureCounts.set 写入新的状态值，使远程桥接会话后续读取保持一致。
      failureCounts.set(sessionId, failures)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[${label}:token] No OAuth token available for refresh, sessionId=${sessionId} (failure ${failures}/${MAX_REFRESH_FAILURES})`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
      logForDiagnosticsNoPII('error', 'bridge_token_refresh_no_oauth')
      // Schedule a retry so the refresh chain can recover if the token
      // becomes available again (e.g. transient cache clear during refresh).
      // Cap retries to avoid spamming on genuine failures.
      // 满足 `failures < MAX_REFRESH_FAILURES` 时，远程桥接会话执行该分支。
      if (failures < MAX_REFRESH_FAILURES) {
        // retryTimer保存`setTimeout`，供远程桥接会话后续处理使用。
        const retryTimer = setTimeout(
          doRefresh,
          REFRESH_RETRY_DELAY_MS,
          sessionId,
          gen,
        )
        // timers.set 写入新的状态值，使远程桥接会话后续读取保持一致。
        timers.set(sessionId, retryTimer)
      }
      // 远程桥接 jwt Utils在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Reset failure counter on successful token retrieval
    // 调用 failureCounts.delete，触发远程桥接会话此处需要的副作用。
    failureCounts.delete(sessionId)

    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[${label}:token] Refreshing token for sessionId=${sessionId}: new token prefix=${oauthToken.slice(0, 15)}…`,
    )
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bridge_token_refreshed', {})
    // 调用 onRefresh，触发远程桥接会话此处需要的副作用。
    onRefresh(sessionId, oauthToken)

    // Schedule a follow-up refresh so long-running sessions stay authenticated.
    // Without this, the initial one-shot timer leaves the session vulnerable
    // to token expiry if it runs past the first refresh window.
    // timer保存`setTimeout`，供远程桥接会话后续处理使用。
    const timer = setTimeout(
      doRefresh,
      FALLBACK_REFRESH_INTERVAL_MS,
      sessionId,
      gen,
    )
    // timers.set 写入新的状态值，使远程桥接会话后续读取保持一致。
    timers.set(sessionId, timer)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[${label}:token] Scheduled follow-up refresh for sessionId=${sessionId} in ${formatDuration(FALLBACK_REFRESH_INTERVAL_MS)}`,
    )
  }

  // cancel 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function cancel(sessionId: string): void {
    // Bump generation to invalidate any in-flight async doRefresh.
    // 调用 nextGeneration，触发远程桥接会话此处需要的副作用。
    nextGeneration(sessionId)
    // timer读取`timers.get`，供远程桥接会话后续处理使用。
    const timer = timers.get(sessionId)
    // 满足 `timer` 时，远程桥接会话执行该分支。
    if (timer) {
      // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
      clearTimeout(timer)
      // 调用 timers.delete，触发远程桥接会话此处需要的副作用。
      timers.delete(sessionId)
    }
    // 调用 failureCounts.delete，触发远程桥接会话此处需要的副作用。
    failureCounts.delete(sessionId)
  }

  // cancelAll 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function cancelAll(): void {
    // Bump all generations so in-flight doRefresh calls are invalidated.
    // 逐项读取 `generations.keys()` 中的sessionId 会话数据，按输入顺序推进远程桥接会话。
    for (const sessionId of generations.keys()) {
      // 调用 nextGeneration，触发远程桥接会话此处需要的副作用。
      nextGeneration(sessionId)
    }
    // 逐项读取 `timers.values()` 中的timer，按输入顺序推进远程桥接会话。
    for (const timer of timers.values()) {
      // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
      clearTimeout(timer)
    }
    // 调用 timers.clear，触发远程桥接会话此处需要的副作用。
    timers.clear()
    // 调用 failureCounts.clear，触发远程桥接会话此处需要的副作用。
    failureCounts.clear()
  }

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return { schedule, scheduleFromExpiresIn, cancel, cancelAll }
}
