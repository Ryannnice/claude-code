// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
/**
 * Env-less Remote Control bridge core.
 *
 * "Env-less" = no Environments API layer. Distinct from "CCR v2" (the
 * /worker/* transport protocol) — the env-based path (replBridge.ts) can also
 * use CCR v2 transport via CLAUDE_CODE_USE_CCR_V2. This file is about removing
 * the poll/dispatch layer, not about which transport protocol is underneath.
 *
 * Unlike initBridgeCore (env-based, ~2400 lines), this connects directly
 * to the session-ingress layer without the Environments API work-dispatch
 * layer:
 *
 *   1. POST /v1/code/sessions              (OAuth, no env_id)  → session.id
 *   2. POST /v1/code/sessions/{id}/bridge  (OAuth)             → {worker_jwt, expires_in, api_base_url, worker_epoch}
 *      Each /bridge call bumps epoch — it IS the register. No separate /worker/register.
 *   3. createV2ReplTransport(worker_jwt, worker_epoch)         → SSE + CCRClient
 *   4. createTokenRefreshScheduler                             → proactive /bridge re-call (new JWT + new epoch)
 *   5. 401 on SSE → rebuild transport with fresh /bridge credentials (same seq-num)
 *
 * No register/poll/ack/stop/heartbeat/deregister environment lifecycle.
 * The Environments API historically existed because CCR's /worker/*
 * endpoints required a session_id+role=worker JWT that only the work-dispatch
 * layer could mint. Server PR #292605 (renamed in #293280) adds the /bridge endpoint as a direct
 * OAuth→worker_jwt exchange, making the env layer optional for REPL sessions.
 *
 * Gated by `tengu_bridge_repl_v2` GrowthBook flag in initReplBridge.ts.
 * REPL-only — daemon/print stay on env-based.
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  createV2ReplTransport,
  type ReplBridgeTransport,
} from './replBridgeTransport.js'
// 引入 buildCCRv2SdkUrl，将 ./workSecret.js 中已经封装好的能力接到本文件流程里。
import { buildCCRv2SdkUrl } from './workSecret.js'
// 引入 toCompatSessionId，将 ./sessionIdCompat.js 中已经封装好的能力接到本文件流程里。
import { toCompatSessionId } from './sessionIdCompat.js'
// 引入 FlushGate，将 ./flushGate.js 中已经封装好的能力接到本文件流程里。
import { FlushGate } from './flushGate.js'
// 引入 createTokenRefreshScheduler，将 ./jwtUtils.js 中已经封装好的能力接到本文件流程里。
import { createTokenRefreshScheduler } from './jwtUtils.js'
// 引入 getTrustedDeviceToken，将 ./trustedDevice.js 中已经封装好的能力接到本文件流程里。
import { getTrustedDeviceToken } from './trustedDevice.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  getEnvLessBridgeConfig,
  type EnvLessBridgeConfig,
} from './envLessBridgeConfig.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  handleIngressMessage,
  handleServerControlRequest,
  makeResultMessage,
  isEligibleBridgeMessage,
  extractTitleText,
  BoundedUUIDSet,
} from './bridgeMessaging.js'
// 引入 logBridgeSkip，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { logBridgeSkip } from './debugUtils.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 复用 isInProtectedNamespace 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isInProtectedNamespace } from '../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 sleep 工具函数，把通用处理留在 ../utils/sleep.js 中维护。
import { sleep } from '../utils/sleep.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 类型依赖 { ReplBridgeHandle, BridgeState } 来自 ./replBridge.js，用于校准远程桥接会话的数据契约。
import type { ReplBridgeHandle, BridgeState } from './replBridge.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准远程桥接会话的数据契约。
import type { Message } from '../types/message.js'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlRequest,
  SDKControlResponse,
} from '../entrypoints/sdk/controlTypes.js'
// 类型依赖 { PermissionMode } 来自 ../utils/permissions/PermissionMode.js，用于校准远程桥接会话的数据契约。
import type { PermissionMode } from '../utils/permissions/PermissionMode.js'

// ANTHROPIC_VERSION保存`'2023-06-01'`，作为后续固定文本处理的输入。
const ANTHROPIC_VERSION = '2023-06-01'

// Telemetry discriminator for ws_connected. 'initial' is the default and
// never passed to rebuildTransport (which can only be called post-init);
// Exclude<> makes that constraint explicit at both signatures.
// ConnectCause 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type ConnectCause = 'initial' | 'proactive_refresh' | 'auth_401_recovery'

// oauthHeaders 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function oauthHeaders(accessToken: string): Record<string, string> {
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'anthropic-version': ANTHROPIC_VERSION,
  }
}

// EnvLessBridgeParams 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type EnvLessBridgeParams = {
  baseUrl: string
  orgUUID: string
  title: string
  // 这个回调绑定到 getAccessToken: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getAccessToken: () => string | undefined
  onAuth401?: (staleAccessToken: string) => Promise<boolean>
  /**
   * Converts internal Message[] → SDKMessage[] for writeMessages() and the
   * initial-flush/drain paths. Injected rather than imported — mappers.ts
   * transitively pulls in src/commands.ts (entire command registry + React
   * tree) which would bloat bundles that don't already have it.
   */
  // 这个回调绑定到 toSDKMessages: (messages: Message[]) => SDKMessage[]，负责远程桥接会话在该局部场景下的响应。
  toSDKMessages: (messages: Message[]) => SDKMessage[]
  initialHistoryCap: number
  initialMessages?: Message[]
  onInboundMessage?: (msg: SDKMessage) => void | Promise<void>
  /**
   * Fired on each title-worthy user message seen in writeMessages() until
   * the callback returns true (done). Mirrors replBridge.ts's onUserMessage —
   * caller derives a title and PATCHes /v1/sessions/{id} so auto-started
   * sessions don't stay at the generic fallback. The caller owns the
   * derive-at-count-1-and-3 policy; the transport just keeps calling until
   * told to stop. sessionId is the raw cse_* — updateBridgeSessionTitle
   * retags internally.
   */
  // 这个回调绑定到 onUserMessage?: (text: string, sessionId: string) => boolean，负责远程桥接会话在该局部场景下的响应。
  onUserMessage?: (text: string, sessionId: string) => boolean
  // 这个回调绑定到 onPermissionResponse?: (response: SDKControlResponse) => void，负责远程桥接会话在该局部场景下的响应。
  onPermissionResponse?: (response: SDKControlResponse) => void
  // 这个回调绑定到 onInterrupt?: () => void，负责远程桥接会话在该局部场景下的响应。
  onInterrupt?: () => void
  // 这个回调绑定到 onSetModel?: (model: string | undefined) => void，负责远程桥接会话在该局部场景下的响应。
  onSetModel?: (model: string | undefined) => void
  // 这个回调绑定到 onSetMaxThinkingTokens?: (maxTokens: number | null) => void，负责远程桥接会话在该局部场景下的响应。
  onSetMaxThinkingTokens?: (maxTokens: number | null) => void
  // 远程桥接 remote Bridge Core在这里处理 `onSetPermissionMode?: (`，完成这一小步状态转换。
  onSetPermissionMode?: (
    mode: PermissionMode,
  ) => { ok: true } | { ok: false; error: string }
  // 这个回调绑定到 onStateChange?: (state: BridgeState, detail?: string) => void，负责远程桥接会话在该局部场景下的响应。
  onStateChange?: (state: BridgeState, detail?: string) => void
  /**
   * When true, skip opening the SSE read stream — only the CCRClient write
   * path is activated. Threaded to createV2ReplTransport and
   * handleServerControlRequest.
   */
  outboundOnly?: boolean
  /** Free-form tags for session categorization (e.g. ['ccr-mirror']). */
  tags?: string[]
}

/**
 * Create a session, fetch a worker JWT, connect the v2 transport.
 *
 * Returns null on any pre-flight failure (session create failed, /bridge
 * failed, transport setup failed). Caller (initReplBridge) surfaces this
 * as a generic "initialization failed" state.
 */
// initEnvLessBridgeCore 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initEnvLessBridgeCore(
  params: EnvLessBridgeParams,
): Promise<ReplBridgeHandle | null> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    baseUrl,
    orgUUID,
    title,
    getAccessToken,
    onAuth401,
    toSDKMessages,
    initialHistoryCap,
    initialMessages,
    onInboundMessage,
    onUserMessage,
    onPermissionResponse,
    onInterrupt,
    onSetModel,
    onSetMaxThinkingTokens,
    onSetPermissionMode,
    onStateChange,
    outboundOnly,
    tags,
  } = params

  // cfg读取`getEnvLessBridgeConfig`，供远程桥接会话后续处理使用。
  const cfg = await getEnvLessBridgeConfig()

  // ── 1. Create session (POST /v1/code/sessions, no env_id) ───────────────
  // accessToken读取`getAccessToken`，供远程桥接会话后续处理使用。
  const accessToken = getAccessToken()
  // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!accessToken) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[remote-bridge] No OAuth token')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // createdSessionId 会话数据保存`withRetry`，供远程桥接会话后续处理使用。
  const createdSessionId = await withRetry(
    // 这个回调绑定到 () =>，负责远程桥接会话在该局部场景下的响应。
    () =>
      createCodeSession(baseUrl, accessToken, title, cfg.http_timeout_ms, tags),
    'createCodeSession',
    cfg,
  )
  // createdSessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!createdSessionId) {
    // 调用 onStateChange?.('failed', 'Session creation failed — see debug log')，完成这一处局部操作。
    onStateChange?.('failed', 'Session creation failed — see debug log')
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('v2_session_create_failed', undefined, true)
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // sessionId 会话数据构建`createdSessionId` 整理出中间结果，供远程桥接 remote Bridge Core后续步骤使用。
  const sessionId: string = createdSessionId
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[remote-bridge] Created session ${sessionId}`)
  // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
  logForDiagnosticsNoPII('info', 'bridge_repl_v2_session_created')

  // ── 2. Fetch bridge credentials (POST /bridge → worker_jwt, expires_in, api_base_url) ──
  // credentials 集合保存`withRetry`，供远程桥接会话后续处理使用。
  const credentials = await withRetry(
    // 这个回调绑定到 () =>，负责远程桥接会话在该局部场景下的响应。
    () =>
      fetchRemoteCredentials(
        sessionId,
        baseUrl,
        accessToken,
        cfg.http_timeout_ms,
      ),
    'fetchRemoteCredentials',
    cfg,
  )
  // credentials 集合缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!credentials) {
    // 调用 onStateChange?.('failed', 'Remote credentials fetch failed — see debug log')，完成这一处局部操作。
    onStateChange?.('failed', 'Remote credentials fetch failed — see debug log')
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('v2_remote_creds_failed', undefined, true)
    // 显式忽略 `archiveSession(` 的返回值，只保留它触发的副作用。
    void archiveSession(
      sessionId,
      baseUrl,
      accessToken,
      orgUUID,
      cfg.http_timeout_ms,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[remote-bridge] Fetched bridge credentials (expires_in=${credentials.expires_in}s)`,
  )

  // ── 3. Build v2 transport (SSETransport + CCRClient) ────────────────────
  // sessionUrl 会话数据构建`buildCCRv2SdkUrl`，供远程桥接会话后续处理使用。
  const sessionUrl = buildCCRv2SdkUrl(credentials.api_base_url, sessionId)
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[remote-bridge] v2 session URL: ${sessionUrl}`)

  // transport 先占位，稍后的条件分支会根据实际输入补齐它。
  let transport: ReplBridgeTransport
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // transport更新为 `await createV2ReplTransport({`，确保Bridge 通信后续读取最新状态。
    transport = await createV2ReplTransport({
      sessionUrl,
      ingressToken: credentials.worker_jwt,
      sessionId,
      epoch: credentials.worker_epoch,
      heartbeatIntervalMs: cfg.heartbeat_interval_ms,
      heartbeatJitterFraction: cfg.heartbeat_jitter_fraction,
      // Per-instance closure — keeps the worker JWT out of
      // process.env.CLAUDE_CODE_SESSION_ACCESS_TOKEN, which mcp/client.ts
      // reads ungatedly and would otherwise send to user-configured ws/http
      // MCP servers. Frozen-at-construction is correct: transport is fully
      // rebuilt on refresh (rebuildTransport below).
      // 这个回调绑定到 getAuthToken: () => credentials.worker_jwt,，负责远程桥接会话在该局部场景下的响应。
      getAuthToken: () => credentials.worker_jwt,
      outboundOnly,
    })
  } catch (err) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[remote-bridge] v2 transport setup failed: ${errorMessage(err)}`,
      { level: 'error' },
    )
    // 调用 onStateChange?.('failed', `Transport setup failed: ${errorMessage(err)}`)，完成这一处局部操作。
    onStateChange?.('failed', `Transport setup failed: ${errorMessage(err)}`)
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('v2_transport_setup_failed', undefined, true)
    // 显式忽略 `archiveSession(` 的返回值，只保留它触发的副作用。
    void archiveSession(
      sessionId,
      baseUrl,
      accessToken,
      orgUUID,
      cfg.http_timeout_ms,
    )
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[remote-bridge] v2 transport created (epoch=${credentials.worker_epoch})`,
  )
  // 调用 onStateChange?.('ready')，完成这一处局部操作。
  onStateChange?.('ready')

  // ── 4. State ────────────────────────────────────────────────────────────

  // Echo dedup: messages we POST come back on the read stream. Seeded with
  // initial message UUIDs so server echoes of flushed history are recognized.
  // Both sets cover initial UUIDs — recentPostedUUIDs is a 2000-cap ring buffer
  // and could evict them after enough live writes; initialMessageUUIDs is the
  // unbounded fallback. Defense-in-depth; mirrors replBridge.ts.
  // recentPostedUUIDs 集合保存`BoundedUUIDSet`，供远程桥接会话后续处理使用。
  const recentPostedUUIDs = new BoundedUUIDSet(cfg.uuid_dedup_buffer_size)
  // initialMessageUUIDs 消息数据 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const initialMessageUUIDs = new Set<string>()
  // 满足 `initialMessages` 时，远程桥接会话执行该分支。
  if (initialMessages) {
    // 按顺序遍历 `initialMessages` 中的消息，逐个交给远程桥接会话处理。
    for (const msg of initialMessages) {
      // 调用 initialMessageUUIDs.add，触发远程桥接会话此处需要的副作用。
      initialMessageUUIDs.add(msg.uuid)
      // 调用 recentPostedUUIDs.add，触发远程桥接会话此处需要的副作用。
      recentPostedUUIDs.add(msg.uuid)
    }
  }

  // Defensive dedup for re-delivered inbound prompts (seq-num negotiation
  // edge cases, server history replay after transport swap).
  // recentInboundUUIDs 集合保存`BoundedUUIDSet`，供远程桥接会话后续处理使用。
  const recentInboundUUIDs = new BoundedUUIDSet(cfg.uuid_dedup_buffer_size)

  // FlushGate: queue live writes while the history flush POST is in flight,
  // so the server receives [history..., live...] in order.
  // flushGate构建`new FlushGate<Message>()`，供后续判断或组装使用。
  const flushGate = new FlushGate<Message>()

  // initialFlushDone标记远程桥接会话远程桥接 remote Bridge Core是否启用对应路径。
  let initialFlushDone = false
  // tornDown标记远程桥接会话远程桥接 remote Bridge Core是否启用对应路径。
  let tornDown = false
  // authRecoveryInFlight标记远程桥接会话远程桥接 remote Bridge Core是否启用对应路径。
  let authRecoveryInFlight = false
  // Latch for onUserMessage — flips true when the callback returns true
  // (policy says "done deriving"). sessionId is const (no re-create path —
  // rebuildTransport swaps JWT/epoch, same session), so no reset needed.
  // userMessageCallbackDone 消息数据标记远程桥接会话远程桥接 remote Bridge Core是否启用对应路径。
  let userMessageCallbackDone = !onUserMessage

  // Telemetry: why did onConnect fire? Set by rebuildTransport before
  // wireTransportCallbacks; read asynchronously by onConnect. Race-safe
  // because authRecoveryInFlight serializes rebuild callers, and a fresh
  // initEnvLessBridgeCore() call gets a fresh closure defaulting to 'initial'.
  // connectCause 命名 `'initial'`，让后续代码直接表达这个值的用途。
  let connectCause: ConnectCause = 'initial'

  // Deadline for onConnect after transport.connect(). Cleared by onConnect
  // (connected) and onClose (got a close — not silent). If neither fires
  // before cfg.connect_timeout_ms, onConnectTimeout emits — the only
  // signal for the `started → (silence)` gap.
  // connectDeadline 先占位，稍后的条件分支会根据实际输入补齐它。
  let connectDeadline: ReturnType<typeof setTimeout> | undefined
  // onConnectTimeout 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onConnectTimeout(cause: ConnectCause): void {
    // 满足 `tornDown` 时，远程桥接会话执行该分支。
    if (tornDown) return
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bridge_repl_connect_timeout', {
      v2: true,
      elapsed_ms: cfg.connect_timeout_ms,
      cause:
        cause as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // ── 5. JWT refresh scheduler ────────────────────────────────────────────
  // Schedule a callback 5min before expiry (per response.expires_in). On fire,
  // re-fetch /bridge with OAuth → rebuild transport with fresh credentials.
  // Each /bridge call bumps epoch server-side, so a JWT-only swap would leave
  // the old CCRClient heartbeating with a stale epoch → 409 within 20s.
  // JWT is opaque — do not decode.
  // refresh构建`createTokenRefreshScheduler`，供远程桥接会话后续处理使用。
  const refresh = createTokenRefreshScheduler({
    refreshBufferMs: cfg.token_refresh_buffer_ms,
    // 这个回调绑定到 getAccessToken: async () => {，负责远程桥接会话在该局部场景下的响应。
    getAccessToken: async () => {
      // Unconditionally refresh OAuth before calling /bridge — getAccessToken()
      // returns expired tokens as non-null strings (doesn't check expiresAt),
      // so truthiness doesn't mean valid. Pass the stale token to onAuth401
      // so handleOAuth401Error's keychain-comparison can detect parallel refresh.
      // stale读取`getAccessToken`，供远程桥接会话后续处理使用。
      const stale = getAccessToken()
      // 满足 `onAuth401) await onAuth401(stale ?? ''` 时，远程桥接会话执行该分支。
      if (onAuth401) await onAuth401(stale ?? '')
      // 返回 `getAccessToken() ?? stale`，作为远程桥接会话这次计算的结果。
      return getAccessToken() ?? stale
    },
    // 这个回调绑定到 onRefresh: (sid, oauthToken) => {，负责远程桥接会话在该局部场景下的响应。
    onRefresh: (sid, oauthToken) => {
      // 调用 void，触发远程桥接会话此处需要的副作用。
      void (async () => {
        // Laptop wake: overdue proactive timer + SSE 401 fire ~simultaneously.
        // Claim the flag BEFORE the /bridge fetch so the other path skips
        // entirely — prevents double epoch bump (each /bridge call bumps; if
        // both fetch, the first rebuild gets a stale epoch and 409s).
        // 组合条件 `authRecoveryInFlight || tornDown` 成立时，远程桥接会话才启用这条专门路径。
        if (authRecoveryInFlight || tornDown) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '[remote-bridge] Recovery already in flight, skipping proactive refresh',
          )
          // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // authRecoveryInFlight更新为 `true`，确保Bridge 通信后续读取最新状态。
        authRecoveryInFlight = true
        // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
        try {
          // fresh保存`withRetry`，供远程桥接会话后续处理使用。
          const fresh = await withRetry(
            // 这个回调绑定到 () =>，负责远程桥接会话在该局部场景下的响应。
            () =>
              fetchRemoteCredentials(
                sid,
                baseUrl,
                oauthToken,
                cfg.http_timeout_ms,
              ),
            'fetchRemoteCredentials (proactive)',
            cfg,
          )
          // 组合条件 `!fresh || tornDown` 成立时，远程桥接会话才启用这条专门路径。
          if (!fresh || tornDown) return
          // 等待 `rebuildTransport(fresh, 'proactive_refresh')` 完成，再继续远程桥接 remote Bridge Core的异步流程。
          await rebuildTransport(fresh, 'proactive_refresh')
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '[remote-bridge] Transport rebuilt (proactive refresh)',
          )
        } catch (err) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[remote-bridge] Proactive refresh rebuild failed: ${errorMessage(err)}`,
            { level: 'error' },
          )
          // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
          logForDiagnosticsNoPII(
            'error',
            'bridge_repl_v2_proactive_refresh_failed',
          )
          // tornDown缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
          if (!tornDown) {
            // 调用 onStateChange?.('failed', `Refresh failed: ${errorMessage(err)}`)，完成这一处局部操作。
            onStateChange?.('failed', `Refresh failed: ${errorMessage(err)}`)
          }
        } finally {
          // authRecoveryInFlight更新为 `false`，确保Bridge 通信后续读取最新状态。
          authRecoveryInFlight = false
        }
      })()
    },
    label: 'remote',
  })
  // 调用 refresh.scheduleFromExpiresIn，触发远程桥接会话此处需要的副作用。
  refresh.scheduleFromExpiresIn(sessionId, credentials.expires_in)

  // ── 6. Wire callbacks (extracted so transport-rebuild can re-wire) ──────
  // wireTransportCallbacks 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function wireTransportCallbacks(): void {
    // transport.setOnConnect 写入新的状态值，使远程桥接会话后续读取保持一致。
    transport.setOnConnect(() => {
      // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
      clearTimeout(connectDeadline)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[remote-bridge] v2 transport connected')
      // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
      logForDiagnosticsNoPII('info', 'bridge_repl_v2_transport_connected')
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_ws_connected', {
        v2: true,
        cause:
          connectCause as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // 组合条件 `!initialFlushDone && initialMessages && initialMe` 成立时，远程桥接会话才启用这条专门路径。
      if (!initialFlushDone && initialMessages && initialMessages.length > 0) {
        // initialFlushDone更新为 `true`，确保Bridge 通信后续读取最新状态。
        initialFlushDone = true
        // Capture current transport — if 401/teardown happens mid-flush,
        // the stale .finally() must not drain the gate or signal connected.
        // (Same guard pattern as replBridge.ts:1119.)
        // flushTransport保存`transport`，供后续判断或组装使用。
        const flushTransport = transport
        // 显式忽略 `flushHistory(initialMessages)` 的返回值，只保留它触发的副作用。
        void flushHistory(initialMessages)
          // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
          .catch(e =>
            logForDebugging(`[remote-bridge] flushHistory failed: ${e}`),
          )
          // 链式调用 finally，继续加工上一行在远程桥接会话中产生的数据。
          .finally(() => {
            // authRecoveryInFlight catches the v1-vs-v2 asymmetry: v1 nulls
            // transport synchronously in setOnClose (replBridge.ts:1175), so
            // transport !== flushTransport trips immediately. v2 doesn't null —
            // transport reassigned only at rebuildTransport:346, 3 awaits deep.
            // authRecoveryInFlight is set synchronously at rebuildTransport entry.
            // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
            if (
              transport !== flushTransport ||
              tornDown ||
              authRecoveryInFlight
            ) {
              // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 调用 drainFlushGate，触发远程桥接会话此处需要的副作用。
            drainFlushGate()
            // 调用 onStateChange?.('connected')，完成这一处局部操作。
            onStateChange?.('connected')
          })
      // 远程桥接 remote Bridge Core在这里处理 `} else if (!flushGate.active) {`，完成这一小步状态转换。
      } else if (!flushGate.active) {
        // 调用 onStateChange?.('connected')，完成这一处局部操作。
        onStateChange?.('connected')
      }
    })

    // transport.setOnData 写入新的状态值，使远程桥接会话后续读取保持一致。
    transport.setOnData((data: string) => {
      // 调用 handleIngressMessage，触发远程桥接会话此处需要的副作用。
      handleIngressMessage(
        data,
        recentPostedUUIDs,
        recentInboundUUIDs,
        onInboundMessage,
        // Remote client answered the permission prompt — the turn resumes.
        // Without this the server stays on requires_action until the next
        // user message or turn-end result.
        onPermissionResponse
          // 这个回调绑定到 ? res => {，负责远程桥接会话在该局部场景下的响应。
          ? res => {
              // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
              transport.reportState('running')
              // 调用 onPermissionResponse，触发远程桥接会话此处需要的副作用。
              onPermissionResponse(res)
            }
          : undefined,
        // req更新为 `>`，确保Bridge 通信后续读取最新状态。
        req =>
          handleServerControlRequest(req, {
            transport,
            sessionId,
            onInterrupt,
            onSetModel,
            onSetMaxThinkingTokens,
            onSetPermissionMode,
            outboundOnly,
          }),
      )
    })

    // transport.setOnClose 写入新的状态值，使远程桥接会话后续读取保持一致。
    transport.setOnClose((code?: number) => {
      // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
      clearTimeout(connectDeadline)
      // 满足 `tornDown` 时，远程桥接会话执行该分支。
      if (tornDown) return
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[remote-bridge] v2 transport closed (code=${code})`)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_ws_closed', { code, v2: true })
      // onClose fires only for TERMINAL failures: 401 (JWT invalid),
      // 4090 (CCR epoch mismatch), 4091 (CCR init failed), or SSE 10-min
      // reconnect budget exhausted. Transient disconnects are handled
      // transparently inside SSETransport. 401 we can recover from (fetch
      // fresh JWT, rebuild transport); all other codes are dead-ends.
      // 组合条件 `code === 401 && !authRecoveryInFlight` 成立时，远程桥接会话才启用这条专门路径。
      if (code === 401 && !authRecoveryInFlight) {
        // 显式忽略 `recoverFromAuthFailure()` 的返回值，只保留它触发的副作用。
        void recoverFromAuthFailure()
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 onStateChange?.('failed', `Transport closed (code ${code})`)，完成这一处局部操作。
      onStateChange?.('failed', `Transport closed (code ${code})`)
    })
  }

  // ── 7. Transport rebuild (shared by proactive refresh + 401 recovery) ──
  // Every /bridge call bumps epoch server-side. Both refresh paths must
  // rebuild the transport with the new epoch — a JWT-only swap leaves the
  // old CCRClient heartbeating stale epoch → 409. SSE resumes from the old
  // transport's high-water-mark seq-num so no server-side replay.
  // Caller MUST set authRecoveryInFlight = true before calling (synchronously,
  // before any await) and clear it in a finally. This function doesn't manage
  // the flag — moving it here would be too late to prevent a double /bridge
  // fetch, and each fetch bumps epoch.
  // rebuildTransport 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function rebuildTransport(
    fresh: RemoteCredentials,
    cause: Exclude<ConnectCause, 'initial'>,
  ): Promise<void> {
    // connectCause更新为 `cause`，确保Bridge 通信后续读取最新状态。
    connectCause = cause
    // Queue writes during rebuild — once /bridge returns, the old transport's
    // epoch is stale and its next write/heartbeat 409s. Without this gate,
    // writeMessages adds UUIDs to recentPostedUUIDs then writeBatch silently
    // no-ops (closed uploader after 409) → permanent silent message loss.
    // 调用 flushGate.start，触发远程桥接会话此处需要的副作用。
    flushGate.start()
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // seq读取`transport.getLastSequenceNum`，供远程桥接会话后续处理使用。
      const seq = transport.getLastSequenceNum()
      // 调用 transport.close，触发远程桥接会话此处需要的副作用。
      transport.close()
      // transport更新为 `await createV2ReplTransport({`，确保Bridge 通信后续读取最新状态。
      transport = await createV2ReplTransport({
        sessionUrl: buildCCRv2SdkUrl(fresh.api_base_url, sessionId),
        ingressToken: fresh.worker_jwt,
        sessionId,
        epoch: fresh.worker_epoch,
        heartbeatIntervalMs: cfg.heartbeat_interval_ms,
        heartbeatJitterFraction: cfg.heartbeat_jitter_fraction,
        initialSequenceNum: seq,
        // 这个回调绑定到 getAuthToken: () => fresh.worker_jwt,，负责远程桥接会话在该局部场景下的响应。
        getAuthToken: () => fresh.worker_jwt,
        outboundOnly,
      })
      // 满足 `tornDown` 时，远程桥接会话执行该分支。
      if (tornDown) {
        // Teardown fired during the async createV2ReplTransport window.
        // Don't wire/connect/schedule — we'd re-arm timers after cancelAll()
        // and fire onInboundMessage into a torn-down bridge.
        // 调用 transport.close，触发远程桥接会话此处需要的副作用。
        transport.close()
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 wireTransportCallbacks，触发远程桥接会话此处需要的副作用。
      wireTransportCallbacks()
      // 调用 transport.connect，触发远程桥接会话此处需要的副作用。
      transport.connect()
      // connectDeadline更新为 `setTimeout(`，确保Bridge 通信后续读取最新状态。
      connectDeadline = setTimeout(
        onConnectTimeout,
        cfg.connect_timeout_ms,
        connectCause,
      )
      // 调用 refresh.scheduleFromExpiresIn，触发远程桥接会话此处需要的副作用。
      refresh.scheduleFromExpiresIn(sessionId, fresh.expires_in)
      // Drain queued writes into the new uploader. Runs before
      // ccr.initialize() resolves (transport.connect() is fire-and-forget),
      // but the uploader serializes behind the initial PUT /worker. If
      // init fails (4091), events drop — but only recentPostedUUIDs
      // (per-instance) is populated, so re-enabling the bridge re-flushes.
      // 调用 drainFlushGate，触发远程桥接会话此处需要的副作用。
      drainFlushGate()
    } finally {
      // End the gate on failure paths too — drainFlushGate already ended
      // it on success. Queued messages are dropped (transport still dead).
      // 调用 flushGate.drop，触发远程桥接会话此处需要的副作用。
      flushGate.drop()
    }
  }

  // ── 8. 401 recovery (OAuth refresh + rebuild) ───────────────────────────
  // recoverFromAuthFailure 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function recoverFromAuthFailure(): Promise<void> {
    // setOnClose already guards `!authRecoveryInFlight` but that check and
    // this set must be atomic against onRefresh — claim synchronously before
    // any await. Laptop wake fires both paths ~simultaneously.
    // 满足 `authRecoveryInFlight` 时，远程桥接会话执行该分支。
    if (authRecoveryInFlight) return
    // authRecoveryInFlight更新为 `true`，确保Bridge 通信后续读取最新状态。
    authRecoveryInFlight = true
    // 调用 onStateChange?.('reconnecting', 'JWT expired — refreshing')，完成这一处局部操作。
    onStateChange?.('reconnecting', 'JWT expired — refreshing')
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[remote-bridge] 401 on SSE — attempting JWT refresh')
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // Unconditionally try OAuth refresh — getAccessToken() returns expired
      // tokens as non-null strings, so !oauthToken doesn't catch expiry.
      // Pass the stale token so handleOAuth401Error's keychain-comparison
      // can detect if another tab already refreshed.
      // stale读取`getAccessToken`，供远程桥接会话后续处理使用。
      const stale = getAccessToken()
      // 满足 `onAuth401) await onAuth401(stale ?? ''` 时，远程桥接会话执行该分支。
      if (onAuth401) await onAuth401(stale ?? '')
      // oauthToken读取`getAccessToken`，供远程桥接会话后续处理使用。
      const oauthToken = getAccessToken() ?? stale
      // 组合条件 `!oauthToken || tornDown` 成立时，远程桥接会话才启用这条专门路径。
      if (!oauthToken || tornDown) {
        // tornDown缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!tornDown) {
          // 调用 onStateChange?.('failed', 'JWT refresh failed: no OAuth token')，完成这一处局部操作。
          onStateChange?.('failed', 'JWT refresh failed: no OAuth token')
        }
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // fresh保存`withRetry`，供远程桥接会话后续处理使用。
      const fresh = await withRetry(
        // 这个回调绑定到 () =>，负责远程桥接会话在该局部场景下的响应。
        () =>
          fetchRemoteCredentials(
            sessionId,
            baseUrl,
            oauthToken,
            cfg.http_timeout_ms,
          ),
        'fetchRemoteCredentials (recovery)',
        cfg,
      )
      // 组合条件 `!fresh || tornDown` 成立时，远程桥接会话才启用这条专门路径。
      if (!fresh || tornDown) {
        // tornDown缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!tornDown) {
          // 调用 onStateChange?.('failed', 'JWT refresh failed after 401')，完成这一处局部操作。
          onStateChange?.('failed', 'JWT refresh failed after 401')
        }
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // If 401 interrupted the initial flush, writeBatch may have silently
      // no-op'd on the closed uploader (ccr.close() ran in the SSE wrapper
      // before our setOnClose callback). Reset so the new onConnect re-flushes.
      // (v1 scopes initialFlushDone inside the per-transport closure at
      // replBridge.ts:1027 so it resets naturally; v2 has it at outer scope.)
      // initialFlushDone更新为 `false`，确保Bridge 通信后续读取最新状态。
      initialFlushDone = false
      // 等待 `rebuildTransport(fresh, 'auth_401_recovery')` 完成，再继续远程桥接 remote Bridge Core的异步流程。
      await rebuildTransport(fresh, 'auth_401_recovery')
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[remote-bridge] Transport rebuilt after 401')
    } catch (err) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[remote-bridge] 401 recovery failed: ${errorMessage(err)}`,
        { level: 'error' },
      )
      // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
      logForDiagnosticsNoPII('error', 'bridge_repl_v2_jwt_refresh_failed')
      // tornDown缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!tornDown) {
        // 调用 onStateChange?.('failed', `JWT refresh failed: ${errorMessage(err)}`)，完成这一处局部操作。
        onStateChange?.('failed', `JWT refresh failed: ${errorMessage(err)}`)
      }
    } finally {
      // authRecoveryInFlight更新为 `false`，确保Bridge 通信后续读取最新状态。
      authRecoveryInFlight = false
    }
  }

  // 调用 wireTransportCallbacks，触发远程桥接会话此处需要的副作用。
  wireTransportCallbacks()

  // Start flushGate BEFORE connect so writeMessages() during handshake
  // queues instead of racing the history POST.
  // 组合条件 `initialMessages && initialMessages.length > 0` 成立时，远程桥接会话才启用这条专门路径。
  if (initialMessages && initialMessages.length > 0) {
    // 调用 flushGate.start，触发远程桥接会话此处需要的副作用。
    flushGate.start()
  }
  // 调用 transport.connect，触发远程桥接会话此处需要的副作用。
  transport.connect()
  // connectDeadline更新为 `setTimeout(`，确保Bridge 通信后续读取最新状态。
  connectDeadline = setTimeout(
    onConnectTimeout,
    cfg.connect_timeout_ms,
    connectCause,
  )

  // ── 8. History flush + drain helpers ────────────────────────────────────
  // drainFlushGate 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function drainFlushGate(): void {
    // msgs 集合保存`flushGate.end`，供远程桥接会话后续处理使用。
    const msgs = flushGate.end()
    // msgs 集合为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
    if (msgs.length === 0) return
    // 逐项读取 `msgs) recentPostedUUIDs.add(msg.uuid` 中的消息，按输入顺序推进远程桥接会话。
    for (const msg of msgs) recentPostedUUIDs.add(msg.uuid)
    // events 集合保存`toSDKMessages`，供远程桥接会话后续处理使用。
    const events = toSDKMessages(msgs).map(m => ({
      ...m,
      session_id: sessionId,
    }))
    // 满足 `msgs.some(m => m.type === 'user')` 时，远程桥接会话执行该分支。
    if (msgs.some(m => m.type === 'user')) {
      // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
      transport.reportState('running')
    }
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[remote-bridge] Drained ${msgs.length} queued message(s) after flush`,
    )
    // 显式忽略 `transport.writeBatch(events)` 的返回值，只保留它触发的副作用。
    void transport.writeBatch(events)
  }

  // flushHistory 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function flushHistory(msgs: Message[]): Promise<void> {
    // v2 always creates a fresh server session (unconditional createCodeSession
    // above) — no session reuse, no double-post risk. Unlike v1, we do NOT
    // filter by previouslyFlushedUUIDs: that set persists across REPL enable/
    // disable cycles (useRef), so it would wrongly suppress history on re-enable.
    // eligible筛选`msgs.filter`，供远程桥接会话后续处理使用。
    const eligible = msgs.filter(isEligibleBridgeMessage)
    // capped 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const capped =
      initialHistoryCap > 0 && eligible.length > initialHistoryCap
        ? eligible.slice(-initialHistoryCap)
        : eligible
    // 满足 `capped.length < eligible.length` 时，远程桥接会话执行该分支。
    if (capped.length < eligible.length) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[remote-bridge] Capped initial flush: ${eligible.length} -> ${capped.length} (cap=${initialHistoryCap})`,
      )
    }
    // events 集合保存`toSDKMessages`，供远程桥接会话后续处理使用。
    const events = toSDKMessages(capped).map(m => ({
      ...m,
      session_id: sessionId,
    }))
    // events 集合为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
    if (events.length === 0) return
    // Mid-turn init: if Remote Control is enabled while a query is running,
    // the last eligible message is a user prompt or tool_result (both 'user'
    // type). Without this the init PUT's 'idle' sticks until the next user-
    // type message forwards via writeMessages — which for a pure-text turn
    // is never (only assistant chunks stream post-init). Check eligible (pre-
    // cap), not capped: the cap may truncate to a user message even when the
    // actual trailing message is assistant.
    // 当 `eligible.at(-1)?.type` 匹配 `'user'` 时，远程桥接会话执行对应分支。
    if (eligible.at(-1)?.type === 'user') {
      // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
      transport.reportState('running')
    }
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[remote-bridge] Flushing ${events.length} history events`)
    // 等待 `transport.writeBatch(events)` 完成，再继续远程桥接 remote Bridge Core的异步流程。
    await transport.writeBatch(events)
  }

  // ── 9. Teardown ───────────────────────────────────────────────────────────
  // On SIGINT/SIGTERM/⁠/exit, gracefulShutdown races runCleanupFunctions()
  // against a 2s cap before forceExit kills the process. Budget accordingly:
  //   - archive: teardown_archive_timeout_ms (default 1500, cap 2000)
  //   - result write: fire-and-forget, archive latency covers the drain
  //   - 401 retry: only if first archive 401s, shares the same budget
  // teardown 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function teardown(): Promise<void> {
    // 满足 `tornDown` 时，远程桥接会话执行该分支。
    if (tornDown) return
    // tornDown更新为 `true`，确保Bridge 通信后续读取最新状态。
    tornDown = true
    // 调用 refresh.cancelAll，触发远程桥接会话此处需要的副作用。
    refresh.cancelAll()
    // 调用 clearTimeout，触发远程桥接会话此处需要的副作用。
    clearTimeout(connectDeadline)
    // 调用 flushGate.drop，触发远程桥接会话此处需要的副作用。
    flushGate.drop()

    // Fire the result message before archive — transport.write() only awaits
    // enqueue (SerialBatchEventUploader resolves once buffered, drain is
    // async). Archiving before close() gives the uploader's drain loop a
    // window (typical archive ≈ 100-500ms) to POST the result without an
    // explicit sleep. close() sets closed=true which interrupts drain at the
    // next while-check, so close-before-archive drops the result.
    // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
    transport.reportState('idle')
    // 显式忽略 `transport.write(makeResultMessage(sessionId))` 的返回值，只保留它触发的副作用。
    void transport.write(makeResultMessage(sessionId))

    // token读取`getAccessToken`，供远程桥接会话后续处理使用。
    let token = getAccessToken()
    // status 集合保存`archiveSession`，供远程桥接会话后续处理使用。
    let status = await archiveSession(
      sessionId,
      baseUrl,
      token,
      orgUUID,
      cfg.teardown_archive_timeout_ms,
    )

    // Token is usually fresh (refresh scheduler runs 5min before expiry) but
    // laptop-wake past the refresh window leaves getAccessToken() returning a
    // stale string. Retry once on 401 — onAuth401 (= handleOAuth401Error)
    // clears keychain cache + force-refreshes. No proactive refresh on the
    // happy path: handleOAuth401Error force-refreshes even valid tokens,
    // which would waste budget 99% of the time. try/catch mirrors
    // recoverFromAuthFailure: keychain reads can throw (macOS locked after
    // wake); an uncaught throw here would skip transport.close + telemetry.
    // 组合条件 `status === 401 && onAuth401` 成立时，远程桥接会话才启用这条专门路径。
    if (status === 401 && onAuth401) {
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `onAuth401(token ?? '')` 完成，再继续远程桥接 remote Bridge Core的异步流程。
        await onAuth401(token ?? '')
        // token更新为 `getAccessToken()`，确保Bridge 通信后续读取最新状态。
        token = getAccessToken()
        // status 集合更新为 `await archiveSession(`，确保Bridge 通信后续读取最新状态。
        status = await archiveSession(
          sessionId,
          baseUrl,
          token,
          orgUUID,
          cfg.teardown_archive_timeout_ms,
        )
      } catch (err) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[remote-bridge] Teardown 401 retry threw: ${errorMessage(err)}`,
          { level: 'error' },
        )
      }
    }

    // 调用 transport.close，触发远程桥接会话此处需要的副作用。
    transport.close()

    // archiveStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    const archiveStatus: ArchiveTelemetryStatus =
      status === 'no_token'
        ? 'skipped_no_token'
        : status === 'timeout' || status === 'error'
          ? 'network_error'
          : status >= 500
            ? 'server_5xx'
            : status >= 400
              ? 'server_4xx'
              : 'ok'

    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[remote-bridge] Torn down (archive=${status})`)
    // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
    logForDiagnosticsNoPII('info', 'bridge_repl_v2_teardown')
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent(
      feature('CCR_MIRROR') && outboundOnly
        ? 'tengu_ccr_mirror_teardown'
        : 'tengu_bridge_repl_teardown',
      {
        v2: true,
        archive_status:
          archiveStatus as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        archive_ok: typeof status === 'number' && status < 400,
        archive_http_status: typeof status === 'number' ? status : undefined,
        archive_timeout: status === 'timeout',
        archive_no_token: status === 'no_token',
      },
    )
  }
  // unregister保存`registerCleanup`，供远程桥接会话后续处理使用。
  const unregister = registerCleanup(teardown)

  // 组合条件 `feature('CCR_MIRROR') && outboundOnly` 成立时，远程桥接会话才启用这条专门路径。
  if (feature('CCR_MIRROR') && outboundOnly) {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_ccr_mirror_started', {
      v2: true,
      expires_in_s: credentials.expires_in,
    })
  } else {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bridge_repl_started', {
      has_initial_messages: !!(initialMessages && initialMessages.length > 0),
      v2: true,
      expires_in_s: credentials.expires_in,
      inProtectedNamespace: isInProtectedNamespace(),
    })
  }

  // ── 10. Handle ──────────────────────────────────────────────────────────
  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    bridgeSessionId: sessionId,
    environmentId: '',
    sessionIngressUrl: credentials.api_base_url,
    // writeMessages 使用 messages 完成远程桥接会话里的对应操作。
    writeMessages(messages) {
      // filtered筛选`messages.filter`，供远程桥接会话后续处理使用。
      const filtered = messages.filter(
        m =>
          isEligibleBridgeMessage(m) &&
          !initialMessageUUIDs.has(m.uuid) &&
          !recentPostedUUIDs.has(m.uuid),
      )
      // filtered为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
      if (filtered.length === 0) return

      // Fire onUserMessage for title derivation. Scan before the flushGate
      // check — prompts are title-worthy even if they queue. Keeps calling
      // on every title-worthy message until the callback returns true; the
      // caller owns the policy (derive at 1st and 3rd, skip if explicit).
      // userMessageCallbackDone 消息数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!userMessageCallbackDone) {
        // 按顺序遍历 `filtered` 中的m，逐个交给远程桥接会话处理。
        for (const m of filtered) {
          // 文本保存`extractTitleText`，供远程桥接会话后续处理使用。
          const text = extractTitleText(m)
          // `text` 与 `undefined && onUserMessage?.(te...` 不一致时刷新派生状态，避免使用过期结果。
          if (text !== undefined && onUserMessage?.(text, sessionId)) {
            // userMessageCallbackDone 消息数据更新为 `true`，确保Bridge 通信后续读取最新状态。
            userMessageCallbackDone = true
            // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
            break
          }
        }
      }

      // 满足 `flushGate.enqueue(...filtered)` 时，远程桥接会话执行该分支。
      if (flushGate.enqueue(...filtered)) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[remote-bridge] Queued ${filtered.length} message(s) during flush`,
        )
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 逐项读取 `filtered) recentPostedUUIDs.add(msg.uuid` 中的消息，按输入顺序推进远程桥接会话。
      for (const msg of filtered) recentPostedUUIDs.add(msg.uuid)
      // events 集合保存`toSDKMessages`，供远程桥接会话后续处理使用。
      const events = toSDKMessages(filtered).map(m => ({
        ...m,
        session_id: sessionId,
      }))
      // v2 does not derive worker_status from events server-side (unlike v1
      // session-ingress session_status_updater.go). Push it from here so the
      // CCR web session list shows Running instead of stuck on Idle. A user
      // message in the batch marks turn start. CCRClient.reportState dedupes
      // consecutive same-state pushes.
      // 满足 `filtered.some(m => m.type === 'user')` 时，远程桥接会话执行该分支。
      if (filtered.some(m => m.type === 'user')) {
        // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
        transport.reportState('running')
      }
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[remote-bridge] Sending ${filtered.length} message(s)`)
      // 显式忽略 `transport.writeBatch(events)` 的返回值，只保留它触发的副作用。
      void transport.writeBatch(events)
    },
    // writeSdkMessages 使用 messages: SDKMessage[] 完成远程桥接会话里的对应操作。
    writeSdkMessages(messages: SDKMessage[]) {
      // filtered筛选`messages.filter`，供远程桥接会话后续处理使用。
      const filtered = messages.filter(
        m => !m.uuid || !recentPostedUUIDs.has(m.uuid),
      )
      // filtered为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
      if (filtered.length === 0) return
      // 按顺序遍历 `filtered` 中的消息，逐个交给远程桥接会话处理。
      for (const msg of filtered) {
        // 满足 `msg.uuid) recentPostedUUIDs.add(msg.uuid` 时，远程桥接会话执行该分支。
        if (msg.uuid) recentPostedUUIDs.add(msg.uuid)
      }
      // events 集合筛选`filtered.map`，供远程桥接会话后续处理使用。
      const events = filtered.map(m => ({ ...m, session_id: sessionId }))
      // 显式忽略 `transport.writeBatch(events)` 的返回值，只保留它触发的副作用。
      void transport.writeBatch(events)
    },
    // sendControlRequest 使用 request: SDKControlRequest 完成远程桥接会话里的对应操作。
    sendControlRequest(request: SDKControlRequest) {
      // 满足 `authRecoveryInFlight` 时，远程桥接会话执行该分支。
      if (authRecoveryInFlight) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[remote-bridge] Dropping control_request during 401 recovery: ${request.request_id}`,
        )
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // event 集中保存远程桥接会话远程桥接 remote Bridge Core要一起传递的字段。
      const event = { ...request, session_id: sessionId }
      // 当 `request.request.subtype` 匹配 `'can_use_tool'` 时，远程桥接会话执行对应分支。
      if (request.request.subtype === 'can_use_tool') {
        // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
        transport.reportState('requires_action')
      }
      // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
      void transport.write(event)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[remote-bridge] Sent control_request request_id=${request.request_id}`,
      )
    },
    // sendControlResponse 使用 response: SDKControlResponse 完成远程桥接会话里的对应操作。
    sendControlResponse(response: SDKControlResponse) {
      // 满足 `authRecoveryInFlight` 时，远程桥接会话执行该分支。
      if (authRecoveryInFlight) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[remote-bridge] Dropping control_response during 401 recovery',
        )
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // event 集中保存远程桥接会话远程桥接 remote Bridge Core要一起传递的字段。
      const event = { ...response, session_id: sessionId }
      // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
      transport.reportState('running')
      // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
      void transport.write(event)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[remote-bridge] Sent control_response')
    },
    // sendControlCancelRequest 使用 requestId: string 完成远程桥接会话里的对应操作。
    sendControlCancelRequest(requestId: string) {
      // 满足 `authRecoveryInFlight` 时，远程桥接会话执行该分支。
      if (authRecoveryInFlight) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[remote-bridge] Dropping control_cancel_request during 401 recovery: ${requestId}`,
        )
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // event 集中保存远程桥接会话远程桥接 remote Bridge Core要一起传递的字段。
      const event = {
        type: 'control_cancel_request' as const,
        request_id: requestId,
        session_id: sessionId,
      }
      // Hook/classifier/channel/recheck resolved the permission locally —
      // interactiveHandler calls only cancelRequest (no sendResponse) on
      // those paths, so without this the server stays on requires_action.
      // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
      transport.reportState('running')
      // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
      void transport.write(event)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[remote-bridge] Sent control_cancel_request request_id=${requestId}`,
      )
    },
    // sendResult 使用 无 完成远程桥接会话里的对应操作。
    sendResult() {
      // 满足 `authRecoveryInFlight` 时，远程桥接会话执行该分支。
      if (authRecoveryInFlight) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[remote-bridge] Dropping result during 401 recovery')
        // 远程桥接 remote Bridge Core在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 transport.reportState，触发远程桥接会话此处需要的副作用。
      transport.reportState('idle')
      // 显式忽略 `transport.write(makeResultMessage(sessionId))` 的返回值，只保留它触发的副作用。
      void transport.write(makeResultMessage(sessionId))
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[remote-bridge] Sent result`)
    },
    // teardown 使用 无 完成远程桥接会话里的对应操作。
    async teardown() {
      // 调用 unregister，触发远程桥接会话此处需要的副作用。
      unregister()
      // 等待 `teardown()` 完成，再继续远程桥接 remote Bridge Core的异步流程。
      await teardown()
    },
  }
}

// ─── Session API (v2 /code/sessions, no env) ─────────────────────────────────

/** Retry an async init call with exponential backoff + jitter. */
// withRetry 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function withRetry<T>(
  // 这个回调绑定到 fn: () => Promise<T | null>,，负责远程桥接会话在该局部场景下的响应。
  fn: () => Promise<T | null>,
  label: string,
  cfg: EnvLessBridgeConfig,
): Promise<T | null> {
  // max 命名 `cfg.init_retry_max_attempts`，让后续代码直接表达这个值的用途。
  const max = cfg.init_retry_max_attempts
  // 循环处理 `let attempt = 1; attempt <= max; attempt++`，让远程桥接会话逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= max; attempt++) {
    // 结果保存`fn`，供远程桥接会话后续处理使用。
    const result = await fn()
    // `result` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (result !== null) return result
    // 满足 `attempt < max` 时，远程桥接会话执行该分支。
    if (attempt < max) {
      // base保存`cfg.init_retry_base_delay_ms * 2 ** (attempt - 1)`，供后续判断或组装使用。
      const base = cfg.init_retry_base_delay_ms * 2 ** (attempt - 1)
      // jitter 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const jitter =
        base * cfg.init_retry_jitter_fraction * (2 * Math.random() - 1)
      // delay保存`Math.min`，供远程桥接会话后续处理使用。
      const delay = Math.min(base + jitter, cfg.init_retry_max_delay_ms)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[remote-bridge] ${label} failed (attempt ${attempt}/${max}), retrying in ${Math.round(delay)}ms`,
      )
      // 等待 `sleep(delay)` 完成，再继续远程桥接 remote Bridge Core的异步流程。
      await sleep(delay)
    }
  }
  // 返回 `null`，作为远程桥接会话这次计算的结果。
  return null
}

// Moved to codeSessionApi.ts so the SDK /bridge subpath can bundle them
// without pulling in this file's heavy CLI tree (analytics, transport).
// 重新导出这一组成员，让远程桥接会话的公共 API 保持集中入口。
export {
  createCodeSession,
  type RemoteCredentials,
} from './codeSessionApi.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  createCodeSession,
  fetchRemoteCredentials as fetchRemoteCredentialsRaw,
  type RemoteCredentials,
} from './codeSessionApi.js'
// 引入 getBridgeBaseUrlOverride，将 ./bridgeConfig.js 中已经封装好的能力接到本文件流程里。
import { getBridgeBaseUrlOverride } from './bridgeConfig.js'

// CLI-side wrapper that applies the CLAUDE_BRIDGE_BASE_URL dev override and
// injects the trusted-device token (both are env/GrowthBook reads that the
// SDK-facing codeSessionApi.ts export must stay free of).
// fetchRemoteCredentials 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchRemoteCredentials(
  sessionId: string,
  baseUrl: string,
  accessToken: string,
  timeoutMs: number,
): Promise<RemoteCredentials | null> {
  // creds 集合读取`fetchRemoteCredentialsRaw`，供远程桥接会话后续处理使用。
  const creds = await fetchRemoteCredentialsRaw(
    sessionId,
    baseUrl,
    accessToken,
    timeoutMs,
    getTrustedDeviceToken(),
  )
  // creds 集合缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!creds) return null
  // 返回 `getBridgeBaseUrlOverride()`，作为远程桥接会话这次计算的结果。
  return getBridgeBaseUrlOverride()
    ? { ...creds, api_base_url: baseUrl }
    : creds
}

// ArchiveStatus 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type ArchiveStatus = number | 'timeout' | 'error' | 'no_token'

// Single categorical for BQ `GROUP BY archive_status`. The booleans on
// _teardown predate this and are redundant with it (except archive_timeout,
// which distinguishes ECONNABORTED from other network errors — both map to
// 'network_error' here since the dominant cause in a 1.5s window is timeout).
// ArchiveTelemetryStatus 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
type ArchiveTelemetryStatus =
  | 'ok'
  | 'skipped_no_token'
  | 'network_error'
  | 'server_4xx'
  | 'server_5xx'

// archiveSession 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function archiveSession(
  sessionId: string,
  baseUrl: string,
  accessToken: string | undefined,
  orgUUID: string,
  timeoutMs: number,
): Promise<ArchiveStatus> {
  // accessToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!accessToken) return 'no_token'
  // Archive lives at the compat layer (/v1/sessions/*, not /v1/code/sessions).
  // compat.parseSessionID only accepts TagSession (session_*), so retag cse_*.
  // anthropic-beta + x-organization-uuid are required — without them the
  // compat gateway 404s before reaching the handler.
  //
  // Unlike bridgeMain.ts (which caches compatId in sessionCompatIds to keep
  // in-memory titledSessions/logger keys consistent across a mid-session
  // gate flip), this compatId is only a server URL path segment — no
  // in-memory state. Fresh compute matches whatever the server currently
  // validates: if the gate is OFF, the server has been updated to accept
  // cse_* and we correctly send it.
  // compatId保存`toCompatSessionId`，供远程桥接会话后续处理使用。
  const compatId = toCompatSessionId(sessionId)
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应保存`axios.post`，供远程桥接会话后续处理使用。
    const response = await axios.post(
      `${baseUrl}/v1/sessions/${compatId}/archive`,
      {},
      {
        headers: {
          ...oauthHeaders(accessToken),
          'anthropic-beta': 'ccr-byoc-2025-07-29',
          'x-organization-uuid': orgUUID,
        },
        timeout: timeoutMs,
        // 这个回调绑定到 validateStatus: () => true,，负责远程桥接会话在该局部场景下的响应。
        validateStatus: () => true,
      },
    )
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[remote-bridge] Archive ${compatId} status=${response.status}`,
    )
    // 返回 `response.status`，作为远程桥接会话这次计算的结果。
    return response.status
  } catch (err) {
    // 消息保存`errorMessage`，供远程桥接会话后续处理使用。
    const msg = errorMessage(err)
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[remote-bridge] Archive failed: ${msg}`)
    // 返回 `axios.isAxiosError(err) && err.code === 'ECONNABORTED'`，作为远程桥接会话这次计算的结果。
    return axios.isAxiosError(err) && err.code === 'ECONNABORTED'
      ? 'timeout'
      : 'error'
  }
}
