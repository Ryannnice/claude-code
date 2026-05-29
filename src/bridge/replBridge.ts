// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  createBridgeApiClient,
  BridgeFatalError,
  isExpiredErrorType,
  isSuppressible403,
} from './bridgeApi.js'
// 类型依赖 { BridgeConfig, BridgeApiClient } 来自 ./types.js，用于校准远程桥接会话的数据契约。
import type { BridgeConfig, BridgeApiClient } from './types.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 ../utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from '../utils/diagLogs.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 复用 registerCleanup 工具函数，把通用处理留在 ../utils/cleanupRegistry.js 中维护。
import { registerCleanup } from '../utils/cleanupRegistry.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  handleIngressMessage,
  handleServerControlRequest,
  makeResultMessage,
  isEligibleBridgeMessage,
  extractTitleText,
  BoundedUUIDSet,
} from './bridgeMessaging.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  decodeWorkSecret,
  buildSdkUrl,
  buildCCRv2SdkUrl,
  sameSessionId,
} from './workSecret.js'
// 引入 toCompatSessionId、toInfraSessionId，将 ./sessionIdCompat.js 中已经封装好的能力接到本文件流程里。
import { toCompatSessionId, toInfraSessionId } from './sessionIdCompat.js'
// 复用 updateSessionBridgeId 工具函数，把通用处理留在 ../utils/concurrentSessions.js 中维护。
import { updateSessionBridgeId } from '../utils/concurrentSessions.js'
// 引入 getTrustedDeviceToken，将 ./trustedDevice.js 中已经封装好的能力接到本文件流程里。
import { getTrustedDeviceToken } from './trustedDevice.js'
// 引入 HybridTransport，将 ../cli/transports/HybridTransport.js 中已经封装好的能力接到本文件流程里。
import { HybridTransport } from '../cli/transports/HybridTransport.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  type ReplBridgeTransport,
  createV1ReplTransport,
  createV2ReplTransport,
} from './replBridgeTransport.js'
// 复用 updateSessionIngressAuthToken 工具函数，把通用处理留在 ../utils/sessionIngressAuth.js 中维护。
import { updateSessionIngressAuthToken } from '../utils/sessionIngressAuth.js'
// 复用 isEnvTruthy、isInProtectedNamespace 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy, isInProtectedNamespace } from '../utils/envUtils.js'
// 引入 validateBridgeId，将 ./bridgeApi.js 中已经封装好的能力接到本文件流程里。
import { validateBridgeId } from './bridgeApi.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  describeAxiosError,
  extractHttpStatus,
  logBridgeSkip,
} from './debugUtils.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准远程桥接会话的数据契约。
import type { Message } from '../types/message.js'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 类型依赖 { PermissionMode } 来自 ../utils/permissions/PermissionMode.js，用于校准远程桥接会话的数据契约。
import type { PermissionMode } from '../utils/permissions/PermissionMode.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import type {
  SDKControlRequest,
  SDKControlResponse,
} from '../entrypoints/sdk/controlTypes.js'
// 引入 createCapacityWake、CapacitySignal，将 ./capacityWake.js 中已经封装好的能力接到本文件流程里。
import { createCapacityWake, type CapacitySignal } from './capacityWake.js'
// 引入 FlushGate，将 ./flushGate.js 中已经封装好的能力接到本文件流程里。
import { FlushGate } from './flushGate.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  DEFAULT_POLL_CONFIG,
  type PollIntervalConfig,
} from './pollConfigDefaults.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 sleep 工具函数，把通用处理留在 ../utils/sleep.js 中维护。
import { sleep } from '../utils/sleep.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  wrapApiForFaultInjection,
  registerBridgeDebugHandle,
  clearBridgeDebugHandle,
  injectBridgeFault,
} from './bridgeDebug.js'

// ReplBridgeHandle 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type ReplBridgeHandle = {
  bridgeSessionId: string
  environmentId: string
  sessionIngressUrl: string
  writeMessages(messages: Message[]): void
  // writeSdkMessages 使用 messages: SDKMessage[] 完成远程桥接会话里的对应操作。
  writeSdkMessages(messages: SDKMessage[]): void
  // sendControlRequest 使用 request: SDKControlRequest 完成远程桥接会话里的对应操作。
  sendControlRequest(request: SDKControlRequest): void
  // sendControlResponse 使用 response: SDKControlResponse 完成远程桥接会话里的对应操作。
  sendControlResponse(response: SDKControlResponse): void
  // sendControlCancelRequest 使用 requestId: string 完成远程桥接会话里的对应操作。
  sendControlCancelRequest(requestId: string): void
  // sendResult 使用 无 完成远程桥接会话里的对应操作。
  sendResult(): void
  // teardown 使用 无 完成远程桥接会话里的对应操作。
  teardown(): Promise<void>
}

// BridgeState 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BridgeState = 'ready' | 'connected' | 'reconnecting' | 'failed'

/**
 * Explicit-param input to initBridgeCore. Everything initReplBridge reads
 * from bootstrap state (cwd, session ID, git, OAuth) becomes a field here.
 * A daemon caller (Agent SDK, PR 4) that never runs main.tsx fills these
 * in itself.
 */
// BridgeCoreParams 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BridgeCoreParams = {
  dir: string
  machineName: string
  branch: string
  gitRepoUrl: string | null
  title: string
  baseUrl: string
  sessionIngressUrl: string
  /**
   * Opaque string sent as metadata.worker_type. Use BridgeWorkerType for
   * the two CLI-originated values; daemon callers may send any string the
   * backend recognizes (it's just a filter key on the web side).
   */
  workerType: string
  // 这个回调绑定到 getAccessToken: () => string | undefined，负责远程桥接会话在该局部场景下的响应。
  getAccessToken: () => string | undefined
  /**
   * POST /v1/sessions. Injected because `createSession.ts` lazy-loads
   * `auth.ts`/`model.ts`/`oauth/client.ts` and `bun --outfile` inlines
   * dynamic imports — the lazy-load doesn't help, the whole REPL tree ends
   * up in the Agent SDK bundle.
   *
   * REPL wrapper passes `createBridgeSession` from `createSession.ts`.
   * Daemon wrapper passes `createBridgeSessionLean` from `sessionApi.ts`
   * (HTTP-only, orgUUID+model supplied by the daemon caller).
   *
   * Receives `gitRepoUrl`+`branch` so the REPL wrapper can build the git
   * source/outcome for claude.ai's session card. Daemon ignores them.
   */
  // 远程桥接 repl Bridge在这里处理 `createSession: (opts: {`，完成这一小步状态转换。
  createSession: (opts: {
    environmentId: string
    title: string
    gitRepoUrl: string | null
    branch: string
    signal: AbortSignal
  }) => Promise<string | null>
  /**
   * POST /v1/sessions/{id}/archive. Same injection rationale. Best-effort;
   * the callback MUST NOT throw.
   */
  // 这个回调绑定到 archiveSession: (sessionId: string) => Promise<void>，负责远程桥接会话在该局部场景下的响应。
  archiveSession: (sessionId: string) => Promise<void>
  /**
   * Invoked on reconnect-after-env-lost to refresh the title. REPL wrapper
   * reads session storage (picks up /rename); daemon returns the static
   * title. Defaults to () => title.
   */
  // 这个回调绑定到 getCurrentTitle?: () => string，负责远程桥接会话在该局部场景下的响应。
  getCurrentTitle?: () => string
  /**
   * Converts internal Message[] → SDKMessage[] for writeMessages() and the
   * initial-flush/drain paths. REPL wrapper passes the real toSDKMessages
   * from utils/messages/mappers.ts. Daemon callers that only use
   * writeSdkMessages() and pass no initialMessages can omit this — those
   * code paths are unreachable.
   *
   * Injected rather than imported because mappers.ts transitively pulls in
   * src/commands.ts via messages.ts → api.ts → prompts.ts, dragging the
   * entire command registry + React tree into the Agent SDK bundle.
   */
  // 这个回调绑定到 toSDKMessages?: (messages: Message[]) => SDKMessage[]，负责远程桥接会话在该局部场景下的响应。
  toSDKMessages?: (messages: Message[]) => SDKMessage[]
  /**
   * OAuth 401 refresh handler passed to createBridgeApiClient. REPL wrapper
   * passes handleOAuth401Error; daemon passes its AuthManager's handler.
   * Injected because utils/auth.ts transitively pulls in the command
   * registry via config.ts → file.ts → permissions/filesystem.ts →
   * sessionStorage.ts → commands.ts.
   */
  // 这个回调绑定到 onAuth401?: (staleAccessToken: string) => Promise<boolean>，负责远程桥接会话在该局部场景下的响应。
  onAuth401?: (staleAccessToken: string) => Promise<boolean>
  /**
   * Poll interval config getter for the work-poll heartbeat loop. REPL
   * wrapper passes the GrowthBook-backed getPollIntervalConfig (allows ops
   * to live-tune poll rates fleet-wide). Daemon passes a static config
   * with a 60s heartbeat (5× headroom under the 300s work-lease TTL).
   * Injected because growthbook.ts transitively pulls in the command
   * registry via the same config.ts chain.
   */
  // 这个回调绑定到 getPollIntervalConfig?: () => PollIntervalConfig，负责远程桥接会话在该局部场景下的响应。
  getPollIntervalConfig?: () => PollIntervalConfig
  /**
   * Max initial messages to replay on connect. REPL wrapper reads from the
   * tengu_bridge_initial_history_cap GrowthBook flag. Daemon passes no
   * initialMessages so this is never read. Default 200 matches the flag
   * default.
   */
  initialHistoryCap?: number
  // Same REPL-flush machinery as InitBridgeOptions — daemon omits these.
  initialMessages?: Message[]
  previouslyFlushedUUIDs?: Set<string>
  // 这个回调绑定到 onInboundMessage?: (msg: SDKMessage) => void，负责远程桥接会话在该局部场景下的响应。
  onInboundMessage?: (msg: SDKMessage) => void
  // 这个回调绑定到 onPermissionResponse?: (response: SDKControlResponse) => void，负责远程桥接会话在该局部场景下的响应。
  onPermissionResponse?: (response: SDKControlResponse) => void
  // 这个回调绑定到 onInterrupt?: () => void，负责远程桥接会话在该局部场景下的响应。
  onInterrupt?: () => void
  // 这个回调绑定到 onSetModel?: (model: string | undefined) => void，负责远程桥接会话在该局部场景下的响应。
  onSetModel?: (model: string | undefined) => void
  // 这个回调绑定到 onSetMaxThinkingTokens?: (maxTokens: number | null) => void，负责远程桥接会话在该局部场景下的响应。
  onSetMaxThinkingTokens?: (maxTokens: number | null) => void
  /**
   * Returns a policy verdict so this module can emit an error control_response
   * without importing the policy checks itself (bootstrap-isolation constraint).
   * The callback must guard `auto` (isAutoModeGateEnabled) and
   * `bypassPermissions` (isBypassPermissionsModeDisabled AND
   * isBypassPermissionsModeAvailable) BEFORE calling transitionPermissionMode —
   * that function's internal auto-gate check is a defensive throw, not a
   * graceful guard, and its side-effect order is setAutoModeActive(true) then
   * throw, which corrupts the 3-way invariant documented in src/CLAUDE.md if
   * the callback lets the throw escape here.
   */
  // 远程桥接 repl Bridge在这里处理 `onSetPermissionMode?: (`，完成这一小步状态转换。
  onSetPermissionMode?: (
    mode: PermissionMode,
  ) => { ok: true } | { ok: false; error: string }
  // 这个回调绑定到 onStateChange?: (state: BridgeState, detail?: string) => void，负责远程桥接会话在该局部场景下的响应。
  onStateChange?: (state: BridgeState, detail?: string) => void
  /**
   * Fires on each real user message to flow through writeMessages() until
   * the callback returns true (done). Mirrors remoteBridgeCore.ts's
   * onUserMessage so the REPL bridge can derive a session title from early
   * prompts when none was set at init time (e.g. user runs /remote-control
   * on an empty conversation, then types). Tool-result wrappers, meta
   * messages, and display-tag-only messages are skipped. Receives
   * currentSessionId so the wrapper can PATCH the title without a closure
   * dance to reach the not-yet-returned handle. The caller owns the
   * derive-at-count-1-and-3 policy; the transport just keeps calling until
   * told to stop. Not fired for the writeSdkMessages daemon path (daemon
   * sets its own title at init). Distinct from SessionSpawnOpts's
   * onFirstUserMessage (spawn-bridge, PR #21250), which stays fire-once.
   */
  // 这个回调绑定到 onUserMessage?: (text: string, sessionId: string) => boolean，负责远程桥接会话在该局部场景下的响应。
  onUserMessage?: (text: string, sessionId: string) => boolean
  /** See InitBridgeOptions.perpetual. */
  perpetual?: boolean
  /**
   * Seeds lastTransportSequenceNum — the SSE event-stream high-water mark
   * that's carried across transport swaps within one process. Daemon callers
   * pass the value they persisted at shutdown so the FIRST SSE connect of a
   * fresh process sends from_sequence_num and the server doesn't replay full
   * history. REPL callers omit (fresh session each run → 0 is correct).
   */
  initialSSESequenceNum?: number
}

/**
 * Superset of ReplBridgeHandle. Adds getSSESequenceNum for daemon callers
 * that persist the SSE seq-num across process restarts and pass it back as
 * initialSSESequenceNum on the next start.
 */
// BridgeCoreHandle 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type BridgeCoreHandle = ReplBridgeHandle & {
  /**
   * Current SSE sequence-number high-water mark. Updates as transports
   * swap. Daemon callers persist this on shutdown and pass it back as
   * initialSSESequenceNum on next start.
   */
  // getSSESequenceNum不依赖额外参数，直接计算远程桥接会话需要的结果。
  getSSESequenceNum(): number
}

/**
 * Poll error recovery constants. When the work poll starts failing (e.g.
 * server 500s), we use exponential backoff and give up after this timeout.
 * This is deliberately long — the server is the authority on when a session
 * is truly dead. As long as the server accepts our poll, we keep waiting
 * for it to re-dispatch the work item.
 */
// POLL_ERROR_INITIAL_DELAY_MS 错误信息保存`2_000`，供后续判断或组装使用。
const POLL_ERROR_INITIAL_DELAY_MS = 2_000
// POLL_ERROR_MAX_DELAY_MS 错误信息保存`60_000`，供后续判断或组装使用。
const POLL_ERROR_MAX_DELAY_MS = 60_000
// POLL_ERROR_GIVE_UP_MS 错误信息保存`15 * 60 * 1000`，供后续判断或组装使用。
const POLL_ERROR_GIVE_UP_MS = 15 * 60 * 1000

// Monotonically increasing counter for distinguishing init calls in logs
// initSequence 命名 `0`，让后续代码直接表达这个值的用途。
let initSequence = 0

/**
 * Bootstrap-free core: env registration → session creation → poll loop →
 * ingress WS → teardown. Reads nothing from bootstrap/state or
 * sessionStorage — all context comes from params. Caller (initReplBridge
 * below, or a daemon in PR 4) has already passed entitlement gates and
 * gathered git/auth/title.
 *
 * Returns null on registration or session-creation failure.
 */
// initBridgeCore 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initBridgeCore(
  params: BridgeCoreParams,
): Promise<BridgeCoreHandle | null> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    dir,
    machineName,
    branch,
    gitRepoUrl,
    title,
    baseUrl,
    sessionIngressUrl,
    workerType,
    getAccessToken,
    createSession,
    archiveSession,
    // getCurrentTitle 标题更新为 `() => title`，确保Bridge 通信后续读取最新状态。
    getCurrentTitle = () => title,
    // toSDKMessages 消息数据更新为 `() => {`，确保Bridge 通信后续读取最新状态。
    toSDKMessages = () => {
      // 抛出 new Error(，阻止远程桥接会话在无效状态下继续运行。
      throw new Error(
        'BridgeCoreParams.toSDKMessages not provided. Pass it if you use writeMessages() or initialMessages — daemon callers that only use writeSdkMessages() never hit this path.',
      )
    },
    onAuth401,
    // getPollIntervalConfig 配置更新为 `() => DEFAULT_POLL_CONFIG`，确保Bridge 通信后续读取最新状态。
    getPollIntervalConfig = () => DEFAULT_POLL_CONFIG,
    initialHistoryCap = 200,
    initialMessages,
    previouslyFlushedUUIDs,
    onInboundMessage,
    onPermissionResponse,
    onInterrupt,
    onSetModel,
    onSetMaxThinkingTokens,
    onSetPermissionMode,
    onStateChange,
    onUserMessage,
    perpetual,
    initialSSESequenceNum = 0,
  } = params

  // seq保存`++initSequence`，供后续判断或组装使用。
  const seq = ++initSequence

  // bridgePointer import hoisted: perpetual mode reads it before register;
  // non-perpetual writes it after session create; both use clear at teardown.
  // 远程桥接 repl Bridge先整理这一处局部数据，后续分支可以直接读取。
  const { writeBridgePointer, clearBridgePointer, readBridgePointer } =
    await import('./bridgePointer.js')

  // Perpetual mode: read the crash-recovery pointer and treat it as prior
  // state. The pointer is written unconditionally after session create
  // (crash-recovery for all sessions); perpetual mode just skips the
  // teardown clear so it survives clean exits too. Only reuse 'repl'
  // pointers — a crashed standalone bridge (`claude remote-control`)
  // writes source:'standalone' with a different workerType.
  // rawPrior读取`readBridgePointer`，供远程桥接会话后续处理使用。
  const rawPrior = perpetual ? await readBridgePointer(dir) : null
  // prior标记远程桥接会话远程桥接 repl Bridge是否启用对应路径。
  const prior = rawPrior?.source === 'repl' ? rawPrior : null

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:repl] initBridgeCore #${seq} starting (initialMessages=${initialMessages?.length ?? 0}${prior ? ` perpetual prior=env:${prior.environmentId}` : ''})`,
  )

  // 5. Register bridge environment
  // rawApi构建`createBridgeApiClient`，供远程桥接会话后续处理使用。
  const rawApi = createBridgeApiClient({
    baseUrl,
    getAccessToken,
    runnerVersion: MACRO.VERSION,
    onDebug: logForDebugging,
    onAuth401,
    getTrustedDeviceToken,
  })
  // Ant-only: interpose so /bridge-kick can inject poll/register/heartbeat
  // failures. Zero cost in external builds (rawApi passes through unchanged).
  // api 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const api =
    process.env.USER_TYPE === 'ant' ? wrapApiForFaultInjection(rawApi) : rawApi

  // bridgeConfig 配置 集中保存远程桥接 repl Bridge要一起传递的字段。
  const bridgeConfig: BridgeConfig = {
    dir,
    machineName,
    branch,
    gitRepoUrl,
    maxSessions: 1,
    spawnMode: 'single-session',
    verbose: false,
    sandbox: false,
    bridgeId: randomUUID(),
    workerType,
    environmentId: randomUUID(),
    reuseEnvironmentId: prior?.environmentId,
    apiBaseUrl: baseUrl,
    sessionIngressUrl,
  }

  // environmentId 先占位，稍后的条件分支会根据实际输入补齐它。
  let environmentId: string
  // environmentSecret 先占位，稍后的条件分支会根据实际输入补齐它。
  let environmentSecret: string
  // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
  try {
    // reg保存`api.registerBridgeEnvironment`，供远程桥接会话后续处理使用。
    const reg = await api.registerBridgeEnvironment(bridgeConfig)
    // environmentId更新为 `reg.environment_id`，确保Bridge 通信后续读取最新状态。
    environmentId = reg.environment_id
    // environmentSecret更新为 `reg.environment_secret`，确保Bridge 通信后续读取最新状态。
    environmentSecret = reg.environment_secret
  } catch (err) {
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip(
      'registration_failed',
      `[bridge:repl] Environment registration failed: ${errorMessage(err)}`,
    )
    // Stale pointer may be the cause (expired/deleted env) — clear it so
    // the next start doesn't retry the same dead ID.
    // 满足 `prior` 时，远程桥接会话执行该分支。
    if (prior) {
      // 等待 `clearBridgePointer(dir)` 完成，再继续远程桥接 repl Bridge的异步流程。
      await clearBridgePointer(dir)
    }
    // 调用 onStateChange?.('failed', errorMessage(err))，完成这一处局部操作。
    onStateChange?.('failed', errorMessage(err))
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(`[bridge:repl] Environment registered: ${environmentId}`)
  // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
  logForDiagnosticsNoPII('info', 'bridge_repl_env_registered')
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_bridge_repl_env_registered', {})

  /**
   * Reconnect-in-place: if the just-registered environmentId matches what
   * was requested, call reconnectSession to force-stop stale workers and
   * re-queue the session. Used at init (perpetual mode — env is alive but
   * idle after clean teardown) and in doReconnect() Strategy 1 (env lost
   * then resurrected). Returns true on success; caller falls back to
   * fresh session creation on false.
   */
  // tryReconnectInPlace 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function tryReconnectInPlace(
    requestedEnvId: string,
    sessionId: string,
  ): Promise<boolean> {
    // `environmentId` 与 `requestedEnvId` 不一致时刷新派生状态，避免使用过期结果。
    if (environmentId !== requestedEnvId) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Env mismatch (requested ${requestedEnvId}, got ${environmentId}) — cannot reconnect in place`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // The pointer stores what createBridgeSession returned (session_*,
    // compat/convert.go:41). /bridge/reconnect is an environments-layer
    // endpoint — once the server's ccr_v2_compat_enabled gate is on it
    // looks sessions up by their infra tag (cse_*) and returns "Session
    // not found" for the session_* costume. We don't know the gate state
    // pre-poll, so try both; the re-tag is a no-op if the ID is already
    // cse_* (doReconnect Strategy 1 path — currentSessionId never mutates
    // to cse_* but future-proof the check).
    // infraId保存`toInfraSessionId`，供远程桥接会话后续处理使用。
    const infraId = toInfraSessionId(sessionId)
    // candidates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const candidates =
      infraId === sessionId ? [sessionId] : [sessionId, infraId]
    // 按顺序遍历 `candidates` 中的标识符，逐个交给远程桥接会话处理。
    for (const id of candidates) {
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `api.reconnectSession(environmentId, id)` 完成，再继续远程桥接 repl Bridge的异步流程。
        await api.reconnectSession(environmentId, id)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Reconnected session ${id} in place on env ${environmentId}`,
        )
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      } catch (err) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] reconnectSession(${id}) failed: ${errorMessage(err)}`,
        )
      }
    }
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[bridge:repl] reconnectSession exhausted — falling through to fresh session',
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Perpetual init: env is alive but has no queued work after clean
  // teardown. reconnectSession re-queues it. doReconnect() has the same
  // call but only fires on poll 404 (env dead);
  // here the env is alive but idle.
  // reusedPriorSession 会话数据保存`prior`，供后续判断或组装使用。
  const reusedPriorSession = prior
    ? await tryReconnectInPlace(prior.environmentId, prior.sessionId)
    : false
  // 组合条件 `prior && !reusedPriorSession` 成立时，远程桥接会话才启用这条专门路径。
  if (prior && !reusedPriorSession) {
    // 等待 `clearBridgePointer(dir)` 完成，再继续远程桥接 repl Bridge的异步流程。
    await clearBridgePointer(dir)
  }

  // 6. Create session on the bridge. Initial messages are NOT included as
  // session creation events because those use STREAM_ONLY persistence and
  // are published before the CCR UI subscribes, so they get lost. Instead,
  // initial messages are flushed via the ingress WebSocket once it connects.

  // Mutable session ID — updated when the environment+session pair is
  // re-created after a connection loss.
  // currentSessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let currentSessionId: string


  // 组合条件 `reusedPriorSession && prior` 成立时，远程桥接会话才启用这条专门路径。
  if (reusedPriorSession && prior) {
    // currentSessionId 会话数据更新为 `prior.sessionId`，确保Bridge 通信后续读取最新状态。
    currentSessionId = prior.sessionId
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Perpetual session reused: ${currentSessionId}`,
    )
    // Server already has all initialMessages from the prior CLI run. Mark
    // them as previously-flushed so the initial flush filter excludes them
    // (previouslyFlushedUUIDs is a fresh Set on every CLI start). Duplicate
    // UUIDs cause the server to kill the WebSocket.
    // 组合条件 `initialMessages && previouslyFlushedUUIDs` 成立时，远程桥接会话才启用这条专门路径。
    if (initialMessages && previouslyFlushedUUIDs) {
      // 按顺序遍历 `initialMessages` 中的消息，逐个交给远程桥接会话处理。
      for (const msg of initialMessages) {
        // 调用 previouslyFlushedUUIDs.add，触发远程桥接会话此处需要的副作用。
        previouslyFlushedUUIDs.add(msg.uuid)
      }
    }
  } else {
    // createdSessionId 会话数据构建`createSession`，供远程桥接会话后续处理使用。
    const createdSessionId = await createSession({
      environmentId,
      title,
      gitRepoUrl,
      branch,
      signal: AbortSignal.timeout(15_000),
    })

    // createdSessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!createdSessionId) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] Session creation failed, deregistering environment',
      )
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_session_failed', {})
      // 这个回调绑定到 await api.deregisterEnvironment(environmentId).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
      await api.deregisterEnvironment(environmentId).catch(() => {})
      // 调用 onStateChange?.('failed', 'Session creation failed')，完成这一处局部操作。
      onStateChange?.('failed', 'Session creation failed')
      // 返回 `null`，作为远程桥接会话这次计算的结果。
      return null
    }

    // currentSessionId 会话数据更新为 `createdSessionId`，确保Bridge 通信后续读取最新状态。
    currentSessionId = createdSessionId
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:repl] Session created: ${currentSessionId}`)
  }

  // Crash-recovery pointer: written now so a kill -9 at any point after
  // this leaves a recoverable trail. Cleared in teardown (non-perpetual)
  // or left alone (perpetual mode — pointer survives clean exit too).
  // `claude remote-control --continue` from the same directory will detect
  // it and offer to resume.
  // 等待 `writeBridgePointer(dir, {` 完成，再继续远程桥接 repl Bridge的异步流程。
  await writeBridgePointer(dir, {
    sessionId: currentSessionId,
    environmentId,
    source: 'repl',
  })
  // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
  logForDiagnosticsNoPII('info', 'bridge_repl_session_created')
  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_bridge_repl_started', {
    has_initial_messages: !!(initialMessages && initialMessages.length > 0),
    inProtectedNamespace: isInProtectedNamespace(),
  })

  // UUIDs of initial messages. Used for dedup in writeMessages to avoid
  // re-sending messages that were already flushed on WebSocket open.
  // initialMessageUUIDs 消息数据构建`new Set<string>()`，供后续判断或组装使用。
  const initialMessageUUIDs = new Set<string>()
  // 满足 `initialMessages` 时，远程桥接会话执行该分支。
  if (initialMessages) {
    // 按顺序遍历 `initialMessages` 中的消息，逐个交给远程桥接会话处理。
    for (const msg of initialMessages) {
      // 调用 initialMessageUUIDs.add，触发远程桥接会话此处需要的副作用。
      initialMessageUUIDs.add(msg.uuid)
    }
  }

  // Bounded ring buffer of UUIDs for messages we've already sent to the
  // server via the ingress WebSocket. Serves two purposes:
  //  1. Echo filtering — ignore our own messages bouncing back on the WS.
  //  2. Secondary dedup in writeMessages — catch race conditions where
  //     the hook's index-based tracking isn't sufficient.
  //
  // Seeded with initialMessageUUIDs so that when the server echoes back
  // the initial conversation context over the ingress WebSocket, those
  // messages are recognized as echoes and not re-injected into the REPL.
  //
  // Capacity of 2000 covers well over any realistic echo window (echoes
  // arrive within milliseconds) and any messages that might be re-encountered
  // after compaction. The hook's lastWrittenIndexRef is the primary dedup;
  // this is a safety net.
  // recentPostedUUIDs 集合保存`BoundedUUIDSet`，供远程桥接会话后续处理使用。
  const recentPostedUUIDs = new BoundedUUIDSet(2000)
  // 按顺序遍历 `initialMessageUUIDs` 中的uuid，逐个交给远程桥接会话处理。
  for (const uuid of initialMessageUUIDs) {
    // 调用 recentPostedUUIDs.add，触发远程桥接会话此处需要的副作用。
    recentPostedUUIDs.add(uuid)
  }

  // Bounded set of INBOUND prompt UUIDs we've already forwarded to the REPL.
  // Defensive dedup for when the server re-delivers prompts (seq-num
  // negotiation failure, server edge cases, transport swap races). The
  // seq-num carryover below is the primary fix; this is the safety net.
  // recentInboundUUIDs 集合保存`BoundedUUIDSet`，供远程桥接会话后续处理使用。
  const recentInboundUUIDs = new BoundedUUIDSet(2000)

  // 7. Start poll loop for work items — this is what makes the session
  // "live" on claude.ai. When a user types there, the backend dispatches
  // a work item to our environment. We poll for it, get the ingress token,
  // and connect the ingress WebSocket.
  //
  // The poll loop keeps running: when work arrives it connects the ingress
  // WebSocket, and if the WebSocket drops unexpectedly (code != 1000) it
  // resumes polling to get a fresh ingress token and reconnect.
  // pollController保存`AbortController`，供远程桥接会话后续处理使用。
  const pollController = new AbortController()
  // Adapter over either HybridTransport (v1: WS reads + POST writes to
  // Session-Ingress) or SSETransport+CCRClient (v2: SSE reads + POST
  // writes to CCR /worker/*). The v1/v2 choice is made in onWorkReceived:
  // server-driven via secret.use_code_sessions, with CLAUDE_BRIDGE_USE_CCR_V2
  // as an ant-dev override.
  // transport 命名 `null`，让后续代码直接表达这个值的用途。
  let transport: ReplBridgeTransport | null = null
  // Bumped on every onWorkReceived. Captured in createV2ReplTransport's .then()
  // closure to detect stale resolutions: if two calls race while transport is
  // null, both registerWorker() (bumping server epoch), and whichever resolves
  // SECOND is the correct one — but the transport !== null check gets this
  // backwards (first-to-resolve installs, second discards). The generation
  // counter catches it independent of transport state.
  // v2Generation保存`0`，供后续判断或组装使用。
  let v2Generation = 0
  // SSE sequence-number high-water mark carried across transport swaps.
  // Without this, each new SSETransport starts at 0, sends no
  // from_sequence_num / Last-Event-ID on its first connect, and the server
  // replays the entire session event history — every prompt ever sent
  // re-delivered as fresh inbound messages on every onWorkReceived.
  //
  // Seed only when we actually reconnected the prior session. If
  // `reusedPriorSession` is false we fell through to `createSession()` —
  // the caller's persisted seq-num belongs to a dead session and applying
  // it to the fresh stream (starting at 1) silently drops events. Same
  // hazard as doReconnect Strategy 2; same fix as the reset there.
  // lastTransportSequenceNum 命名 `reusedPriorSession ? initialSSESequenceNum : 0`，让后续代码直接表达这个值的用途。
  let lastTransportSequenceNum = reusedPriorSession ? initialSSESequenceNum : 0
  // Track the current work ID so teardown can call stopWork
  // currentWorkId保存`null`，作为后续空值处理的输入。
  let currentWorkId: string | null = null
  // Session ingress JWT for the current work item — used for heartbeat auth.
  // currentIngressToken初始化为空值，后续分支会在有数据时补齐。
  let currentIngressToken: string | null = null
  // Signal to wake the at-capacity sleep early when the transport is lost,
  // so the poll loop immediately switches back to fast polling for new work.
  // capacityWake构建`createCapacityWake`，供远程桥接会话后续处理使用。
  const capacityWake = createCapacityWake(pollController.signal)
  // wakePollLoop保存`capacityWake.wake`，供后续判断或组装使用。
  const wakePollLoop = capacityWake.wake
  // capacitySignal保存`capacityWake.signal`，供后续判断或组装使用。
  const capacitySignal = capacityWake.signal
  // Gates message writes during the initial flush to prevent ordering
  // races where new messages arrive at the server interleaved with history.
  // flushGate 命名 `new FlushGate<Message>()`，让后续代码直接表达这个值的用途。
  const flushGate = new FlushGate<Message>()

  // Latch for onUserMessage — flips true when the callback returns true
  // (policy says "done deriving"). If no callback, skip scanning entirely
  // (daemon path — no title derivation needed).
  // userMessageCallbackDone 消息数据标记远程桥接会话远程桥接 repl Bridge是否启用对应路径。
  let userMessageCallbackDone = !onUserMessage

  // Shared counter for environment re-creations, used by both
  // onEnvironmentLost and the abnormal-close handler.
  // MAX_ENVIRONMENT_RECREATIONS 集合 命名 `3`，让后续代码直接表达这个值的用途。
  const MAX_ENVIRONMENT_RECREATIONS = 3
  // environmentRecreations 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let environmentRecreations = 0
  // reconnectPromise 异步任务初始化为空值，后续分支会在有数据时补齐。
  let reconnectPromise: Promise<boolean> | null = null

  /**
   * Recover from onEnvironmentLost (poll returned 404 — env was reaped
   * server-side). Tries two strategies in order:
   *
   *   1. Reconnect-in-place: idempotent re-register with reuseEnvironmentId
   *      → if the backend returns the same env ID, call reconnectSession()
   *      to re-queue the existing session. currentSessionId stays the same;
   *      the URL on the user's phone stays valid; previouslyFlushedUUIDs is
   *      preserved so history isn't re-sent.
   *
   *   2. Fresh session fallback: if the backend returns a different env ID
   *      (original TTL-expired, e.g. laptop slept >4h) or reconnectSession()
   *      throws, archive the old session and create a new one on the
   *      now-registered env. Old behavior before #20460 primitives landed.
   *
   * Uses a promise-based reentrancy guard so concurrent callers share the
   * same reconnection attempt.
   */
  // reconnectEnvironmentWithSession 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function reconnectEnvironmentWithSession(): Promise<boolean> {
    // 满足 `reconnectPromise` 时，远程桥接会话执行该分支。
    if (reconnectPromise) {
      // 返回 `reconnectPromise`，作为远程桥接会话这次计算的结果。
      return reconnectPromise
    }
    // reconnectPromise 异步任务更新为 `doReconnect()`，确保Bridge 通信后续读取最新状态。
    reconnectPromise = doReconnect()
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // 等待并返回 `reconnectPromise`，调用方直接接收异步结果。
      return await reconnectPromise
    } finally {
      // reconnectPromise 异步任务更新为 `null`，确保Bridge 通信后续读取最新状态。
      reconnectPromise = null
    }
  }

  // doReconnect 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  async function doReconnect(): Promise<boolean> {
    // 远程桥接 repl Bridge在这里处理 `environmentRecreations++`，完成这一小步状态转换。
    environmentRecreations++
    // Invalidate any in-flight v2 handshake — the environment is being
    // recreated, so a stale transport arriving post-reconnect would be
    // pointed at a dead session.
    // 远程桥接 repl Bridge在这里处理 `v2Generation++`，完成这一小步状态转换。
    v2Generation++
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Reconnecting after env lost (attempt ${environmentRecreations}/${MAX_ENVIRONMENT_RECREATIONS})`,
    )

    // 满足 `environmentRecreations > MAX_ENVIRONMENT_RECREATI` 时，远程桥接会话执行该分支。
    if (environmentRecreations > MAX_ENVIRONMENT_RECREATIONS) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Environment reconnect limit reached (${MAX_ENVIRONMENT_RECREATIONS}), giving up`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Close the stale transport. Capture seq BEFORE close — if Strategy 1
    // (tryReconnectInPlace) succeeds we keep the SAME session, and the
    // next transport must resume where this one left off, not replay from
    // the last transport-swap checkpoint.
    // 满足 `transport` 时，远程桥接会话执行该分支。
    if (transport) {
      // seq读取`transport.getLastSequenceNum`，供远程桥接会话后续处理使用。
      const seq = transport.getLastSequenceNum()
      // 满足 `seq > lastTransportSequenceNum` 时，远程桥接会话执行该分支。
      if (seq > lastTransportSequenceNum) {
        // lastTransportSequenceNum更新为 `seq`，确保Bridge 通信后续读取最新状态。
        lastTransportSequenceNum = seq
      }
      // 调用 transport.close，触发远程桥接会话此处需要的副作用。
      transport.close()
      // transport更新为 `null`，确保Bridge 通信后续读取最新状态。
      transport = null
    }
    // Transport is gone — wake the poll loop out of its at-capacity
    // heartbeat sleep so it can fast-poll for re-dispatched work.
    // 调用 wakePollLoop，触发远程桥接会话此处需要的副作用。
    wakePollLoop()
    // Reset flush gate so writeMessages() hits the !transport guard
    // instead of silently queuing into a dead buffer.
    // 调用 flushGate.drop，触发远程桥接会话此处需要的副作用。
    flushGate.drop()

    // Release the current work item (force=false — we may want the session
    // back). Best-effort: the env is probably gone, so this likely 404s.
    // 满足 `currentWorkId` 时，远程桥接会话执行该分支。
    if (currentWorkId) {
      // workIdBeingCleared保存`currentWorkId`，供远程桥接会话远程桥接 repl Bridge后续判断或输出使用。
      const workIdBeingCleared = currentWorkId
      // 等待 `api` 完成，再继续远程桥接 repl Bridge的异步流程。
      await api
        .stopWork(environmentId, workIdBeingCleared, false)
        // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
        .catch(() => {})
      // When doReconnect runs concurrently with the poll loop (ws_closed
      // handler case — void-called, unlike the awaited onEnvironmentLost
      // path), onWorkReceived can fire during the stopWork await and set
      // a fresh currentWorkId. If it did, the poll loop has already
      // recovered on its own — defer to it rather than proceeding to
      // archiveSession, which would destroy the session its new
      // transport is connected to.
      // `currentWorkId` 与 `workIdBeingCleared` 不一致时刷新派生状态，避免使用过期结果。
      if (currentWorkId !== workIdBeingCleared) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[bridge:repl] Poll loop recovered during stopWork await — deferring to it',
        )
        // environmentRecreations 集合更新为 `0`，确保Bridge 通信后续读取最新状态。
        environmentRecreations = 0
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
      // currentWorkId更新为 `null`，确保Bridge 通信后续读取最新状态。
      currentWorkId = null
      // currentIngressToken更新为 `null`，确保Bridge 通信后续读取最新状态。
      currentIngressToken = null
    }

    // Bail out if teardown started while we were awaiting
    // 满足 `pollController.signal.aborted` 时，远程桥接会话执行该分支。
    if (pollController.signal.aborted) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[bridge:repl] Reconnect aborted by teardown')
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Strategy 1: idempotent re-register with the server-issued env ID.
    // If the backend resurrects the same env (fresh secret), we can
    // reconnect the existing session. If it hands back a different ID, the
    // original env is truly gone and we fall through to a fresh session.
    // requestedEnvId 请求数据保存`environmentId`，供远程桥接会话远程桥接 repl Bridge后续判断或输出使用。
    const requestedEnvId = environmentId
    // reuseEnvironmentId更新为 `requestedEnvId`，确保Bridge 通信后续读取最新状态。
    bridgeConfig.reuseEnvironmentId = requestedEnvId
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // reg保存`api.registerBridgeEnvironment`，供远程桥接会话后续处理使用。
      const reg = await api.registerBridgeEnvironment(bridgeConfig)
      // environmentId更新为 `reg.environment_id`，确保Bridge 通信后续读取最新状态。
      environmentId = reg.environment_id
      // environmentSecret更新为 `reg.environment_secret`，确保Bridge 通信后续读取最新状态。
      environmentSecret = reg.environment_secret
    } catch (err) {
      // reuseEnvironmentId更新为 `undefined`，确保Bridge 通信后续读取最新状态。
      bridgeConfig.reuseEnvironmentId = undefined
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Environment re-registration failed: ${errorMessage(err)}`,
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // Clear before any await — a stale value would poison the next fresh
    // registration if doReconnect runs again.
    // reuseEnvironmentId更新为 `undefined`，确保Bridge 通信后续读取最新状态。
    bridgeConfig.reuseEnvironmentId = undefined

    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Re-registered: requested=${requestedEnvId} got=${environmentId}`,
    )

    // Bail out if teardown started while we were registering
    // 满足 `pollController.signal.aborted` 时，远程桥接会话执行该分支。
    if (pollController.signal.aborted) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] Reconnect aborted after env registration, cleaning up',
      )
      // 这个回调绑定到 await api.deregisterEnvironment(environmentId).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
      await api.deregisterEnvironment(environmentId).catch(() => {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Same race as above, narrower window: poll loop may have set up a
    // transport during the registerBridgeEnvironment await. Bail before
    // tryReconnectInPlace/archiveSession kill it server-side.
    // `transport` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (transport !== null) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] Poll loop recovered during registerBridgeEnvironment await — deferring to it',
      )
      // environmentRecreations 集合更新为 `0`，确保Bridge 通信后续读取最新状态。
      environmentRecreations = 0
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Strategy 1: same helper as perpetual init. currentSessionId stays
    // the same on success; URL on mobile/web stays valid;
    // previouslyFlushedUUIDs preserved (no re-flush).
    // 满足 `await tryReconnectInPlace(requestedEnvId, currentSessionId)` 时，远程桥接会话执行该分支。
    if (await tryReconnectInPlace(requestedEnvId, currentSessionId)) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_reconnected_in_place', {})
      // environmentRecreations 集合更新为 `0`，确保Bridge 通信后续读取最新状态。
      environmentRecreations = 0
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Env differs → TTL-expired/reaped; or reconnect failed.
    // Don't deregister — we have a fresh secret for this env either way.
    // `environmentId` 与 `requestedEnvId` 不一致时刷新派生状态，避免使用过期结果。
    if (environmentId !== requestedEnvId) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_env_expired_fresh_session', {})
    }

    // Strategy 2: fresh session on the now-registered environment.
    // Archive the old session first — it's orphaned (bound to a dead env,
    // or reconnectSession rejected it). Don't deregister the env — we just
    // got a fresh secret for it and are about to use it.
    // 等待 `archiveSession(currentSessionId)` 完成，再继续远程桥接 repl Bridge的异步流程。
    await archiveSession(currentSessionId)

    // Bail out if teardown started while we were archiving
    // 满足 `pollController.signal.aborted` 时，远程桥接会话执行该分支。
    if (pollController.signal.aborted) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] Reconnect aborted after archive, cleaning up',
      )
      // 这个回调绑定到 await api.deregisterEnvironment(environmentId).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
      await api.deregisterEnvironment(environmentId).catch(() => {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Re-read the current title in case the user renamed the session.
    // REPL wrapper reads session storage; daemon wrapper returns the
    // original title (nothing to refresh).
    // currentTitle 标题读取`getCurrentTitle`，供远程桥接会话后续处理使用。
    const currentTitle = getCurrentTitle()

    // Create a new session on the now-registered environment
    // newSessionId 会话数据构建`createSession`，供远程桥接会话后续处理使用。
    const newSessionId = await createSession({
      environmentId,
      title: currentTitle,
      gitRepoUrl,
      branch,
      signal: AbortSignal.timeout(15_000),
    })

    // newSessionId 会话数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!newSessionId) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] Session creation failed during reconnection',
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // Bail out if teardown started during session creation (up to 15s)
    // 满足 `pollController.signal.aborted` 时，远程桥接会话执行该分支。
    if (pollController.signal.aborted) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] Reconnect aborted after session creation, cleaning up',
      )
      // 等待 `archiveSession(newSessionId)` 完成，再继续远程桥接 repl Bridge的异步流程。
      await archiveSession(newSessionId)
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // currentSessionId 会话数据更新为 `newSessionId`，确保Bridge 通信后续读取最新状态。
    currentSessionId = newSessionId
    // Re-publish to the PID file so peer dedup (peerRegistry.ts) picks up the
    // new ID — setReplBridgeHandle only fires at init/teardown, not reconnect.
    // 这个回调绑定到 void updateSessionBridgeId(toCompatSessionId(newSessionId)).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
    void updateSessionBridgeId(toCompatSessionId(newSessionId)).catch(() => {})
    // Reset per-session transport state IMMEDIATELY after the session swap,
    // before any await. If this runs after `await writeBridgePointer` below,
    // there's a window where handle.bridgeSessionId already returns session B
    // but getSSESequenceNum() still returns session A's seq — a daemon
    // persistState() in that window writes {bridgeSessionId: B, seq: OLD_A},
    // which PASSES the session-ID validation check and defeats it entirely.
    //
    // The SSE seq-num is scoped to the session's event stream — carrying it
    // over leaves the transport's lastSequenceNum stuck high (seq only
    // advances when received > last), and its next internal reconnect would
    // send from_sequence_num=OLD_SEQ against a stream starting at 1 → all
    // events in the gap silently dropped. Inbound UUID dedup is also
    // session-scoped.
    // lastTransportSequenceNum更新为 `0`，确保Bridge 通信后续读取最新状态。
    lastTransportSequenceNum = 0
    // 调用 recentInboundUUIDs.clear，触发远程桥接会话此处需要的副作用。
    recentInboundUUIDs.clear()
    // Title derivation is session-scoped too: if the user typed during the
    // createSession await above, the callback fired against the OLD archived
    // session ID (PATCH lost) and the new session got `currentTitle` captured
    // BEFORE they typed. Reset so the next prompt can re-derive. Self-
    // correcting: if the caller's policy is already done (explicit title or
    // count ≥ 3), it returns true on the first post-reset call and re-latches.
    // userMessageCallbackDone 消息数据更新为 `!onUserMessage`，确保Bridge 通信后续读取最新状态。
    userMessageCallbackDone = !onUserMessage
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[bridge:repl] Re-created session: ${currentSessionId}`)

    // Rewrite the crash-recovery pointer with the new IDs so a crash after
    // this point resumes the right session. (The reconnect-in-place path
    // above doesn't touch the pointer — same session, same env.)
    // 等待 `writeBridgePointer(dir, {` 完成，再继续远程桥接 repl Bridge的异步流程。
    await writeBridgePointer(dir, {
      sessionId: currentSessionId,
      environmentId,
      source: 'repl',
    })

    // Clear flushed UUIDs so initial messages are re-sent to the new session.
    // UUIDs are scoped per-session on the server, so re-flushing is safe.
    // 调用 previouslyFlushedUUIDs?.clear()，完成这一处局部操作。
    previouslyFlushedUUIDs?.clear()


    // Reset the counter so independent reconnections hours apart don't
    // exhaust the limit — it guards against rapid consecutive failures,
    // not lifetime total.
    // environmentRecreations 集合更新为 `0`，确保Bridge 通信后续读取最新状态。
    environmentRecreations = 0

    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Helper: get the current OAuth access token for session ingress auth.
  // Unlike the JWT path, OAuth tokens are refreshed by the standard OAuth
  // flow — no proactive scheduler needed.
  // getOAuthToken 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function getOAuthToken(): string | undefined {
    // 返回 `getAccessToken()`，作为远程桥接会话这次计算的结果。
    return getAccessToken()
  }

  // Drain any messages that were queued during the initial flush.
  // Called after writeBatch completes (or fails) so queued messages
  // are sent in order after the historical messages.
  // drainFlushGate 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function drainFlushGate(): void {
    // msgs 集合保存`flushGate.end`，供远程桥接会话后续处理使用。
    const msgs = flushGate.end()
    // msgs 集合为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
    if (msgs.length === 0) return
    // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
    if (!transport) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Cannot drain ${msgs.length} pending message(s): no transport`,
      )
      // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 按顺序遍历 `msgs` 中的消息，逐个交给远程桥接会话处理。
    for (const msg of msgs) {
      // 调用 recentPostedUUIDs.add，触发远程桥接会话此处需要的副作用。
      recentPostedUUIDs.add(msg.uuid)
    }
    // sdkMessages 消息数据保存`toSDKMessages`，供远程桥接会话后续处理使用。
    const sdkMessages = toSDKMessages(msgs)
    // events 集合派生`sdkMessages.map`，供远程桥接会话后续处理使用。
    const events = sdkMessages.map(sdkMsg => ({
      ...sdkMsg,
      session_id: currentSessionId,
    }))
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Drained ${msgs.length} pending message(s) after flush`,
    )
    // 显式忽略 `transport.writeBatch(events)` 的返回值，只保留它触发的副作用。
    void transport.writeBatch(events)
  }

  // Teardown reference — set after definition below. All callers are async
  // callbacks that run after assignment, so the reference is always valid.
  // 这个回调绑定到 let doTeardownImpl: (() => Promise<void>) | null = null，负责远程桥接会话在该局部场景下的响应。
  let doTeardownImpl: (() => Promise<void>) | null = null
  // triggerTeardown 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function triggerTeardown(): void {
    // 显式忽略 `doTeardownImpl?.()` 的返回值，只保留它触发的副作用。
    void doTeardownImpl?.()
  }

  /**
   * Body of the transport's setOnClose callback, hoisted to initBridgeCore
   * scope so /bridge-kick can fire it directly. setOnClose wraps this with
   * a stale-transport guard; debugFireClose calls it bare.
   *
   * With autoReconnect:true, this only fires on: clean close (1000),
   * permanent server rejection (4001/1002/4003), or 10-min budget
   * exhaustion. Transient drops are retried internally by the transport.
   */
  // handleTransportPermanentClose 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleTransportPermanentClose(closeCode: number | undefined): void {
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Transport permanently closed: code=${closeCode}`,
    )
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bridge_repl_ws_closed', {
      code: closeCode,
    })
    // Capture SSE seq high-water mark before nulling. When called from
    // setOnClose the guard guarantees transport !== null; when fired from
    // /bridge-kick it may already be null (e.g. fired twice) — skip.
    // 满足 `transport` 时，远程桥接会话执行该分支。
    if (transport) {
      // closedSeq读取`transport.getLastSequenceNum`，供远程桥接会话后续处理使用。
      const closedSeq = transport.getLastSequenceNum()
      // 满足 `closedSeq > lastTransportSequenceNum` 时，远程桥接会话执行该分支。
      if (closedSeq > lastTransportSequenceNum) {
        // lastTransportSequenceNum更新为 `closedSeq`，确保Bridge 通信后续读取最新状态。
        lastTransportSequenceNum = closedSeq
      }
      // transport更新为 `null`，确保Bridge 通信后续读取最新状态。
      transport = null
    }
    // Transport is gone — wake the poll loop out of its at-capacity
    // heartbeat sleep so it's fast-polling by the time the reconnect
    // below completes and the server re-queues work.
    // 调用 wakePollLoop，触发远程桥接会话此处需要的副作用。
    wakePollLoop()
    // Reset flush state so writeMessages() hits the !transport guard
    // (with a warning log) instead of silently queuing into a buffer
    // that will never be drained. Unlike onWorkReceived (which
    // preserves pending messages for the new transport), onClose is
    // a permanent close — no new transport will drain these.
    // dropped保存`flushGate.drop`，供远程桥接会话后续处理使用。
    const dropped = flushGate.drop()
    // 满足 `dropped > 0` 时，远程桥接会话执行该分支。
    if (dropped > 0) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Dropping ${dropped} pending message(s) on transport close (code=${closeCode})`,
        { level: 'warn' },
      )
    }

    // 满足 `closeCode === 1000` 时，远程桥接会话执行该分支。
    if (closeCode === 1000) {
      // Clean close — session ended normally. Tear down the bridge.
      // 调用 onStateChange?.('failed', 'session ended')，完成这一处局部操作。
      onStateChange?.('failed', 'session ended')
      // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
      pollController.abort()
      // 调用 triggerTeardown，触发远程桥接会话此处需要的副作用。
      triggerTeardown()
      // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Transport reconnect budget exhausted or permanent server
    // rejection. By this point the env has usually been reaped
    // server-side (BQ 2026-03-12: ~98% of ws_closed never recover
    // via poll alone). stopWork(force=false) can't re-dispatch work
    // from an archived env; reconnectEnvironmentWithSession can
    // re-activate it via POST /bridge/reconnect, or fall through
    // to a fresh session if the env is truly gone. The poll loop
    // (already woken above) picks up the re-queued work once
    // doReconnect completes.
    // 远程桥接 repl Bridge在这里处理 `onStateChange?.(`，完成这一小步状态转换。
    onStateChange?.(
      'reconnecting',
      `Remote Control connection lost (code ${closeCode})`,
    )
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Transport reconnect budget exhausted (code=${closeCode}), attempting env reconnect`,
    )
    // 这个回调绑定到 void reconnectEnvironmentWithSession().then(success => {，负责远程桥接会话在该局部场景下的响应。
    void reconnectEnvironmentWithSession().then(success => {
      // 满足 `success` 时，远程桥接会话执行该分支。
      if (success) return
      // doReconnect has four abort-check return-false sites for
      // teardown-in-progress. Don't pollute the BQ failure signal
      // or double-teardown when the user just quit.
      // 满足 `pollController.signal.aborted` 时，远程桥接会话执行该分支。
      if (pollController.signal.aborted) return
      // doReconnect returns false (never throws) on genuine failure.
      // The dangerous case: registerBridgeEnvironment succeeded (so
      // environmentId now points at a fresh valid env) but
      // createSession failed — poll loop would poll a sessionless
      // env getting null work with no errors, never hitting any
      // give-up path. Tear down explicitly.
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] reconnectEnvironmentWithSession resolved false — tearing down',
      )
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_reconnect_failed', {
        close_code: closeCode,
      })
      // 调用 onStateChange?.('failed', 'reconnection failed')，完成这一处局部操作。
      onStateChange?.('failed', 'reconnection failed')
      // 调用 triggerTeardown，触发远程桥接会话此处需要的副作用。
      triggerTeardown()
    })
  }

  // Ant-only: SIGUSR2 → force doReconnect() for manual testing. Skips the
  // ~30s poll wait — fire-and-observe in the debug log immediately.
  // Windows has no USR signals; `process.on` would throw there.
  // 这个回调绑定到 let sigusr2Handler: (() => void) | undefined，负责远程桥接会话在该局部场景下的响应。
  let sigusr2Handler: (() => void) | undefined
  // 组合条件 `process.env.USER_TYPE === 'ant' && process.platfo` 成立时，远程桥接会话才启用这条专门路径。
  if (process.env.USER_TYPE === 'ant' && process.platform !== 'win32') {
    // sigusr2Handler更新为 `() => {`，确保Bridge 通信后续读取最新状态。
    sigusr2Handler = () => {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        '[bridge:repl] SIGUSR2 received — forcing doReconnect() for testing',
      )
      // 显式忽略 `reconnectEnvironmentWithSession()` 的返回值，只保留它触发的副作用。
      void reconnectEnvironmentWithSession()
    }
    // 调用 process.on，触发远程桥接会话此处需要的副作用。
    process.on('SIGUSR2', sigusr2Handler)
  }

  // Ant-only: /bridge-kick fault injection. handleTransportPermanentClose
  // is defined below and assigned into this slot so the slash command can
  // invoke it directly — the real setOnClose callback is buried inside
  // wireTransport which is itself inside onWorkReceived.
  // 这个回调绑定到 let debugFireClose: ((code: number) => void) | null = null，负责远程桥接会话在该局部场景下的响应。
  let debugFireClose: ((code: number) => void) | null = null
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，远程桥接会话执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 调用 registerBridgeDebugHandle，触发远程桥接会话此处需要的副作用。
    registerBridgeDebugHandle({
      // 这个回调绑定到 fireClose: code => {，负责远程桥接会话在该局部场景下的响应。
      fireClose: code => {
        // debugFireClose缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!debugFireClose) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging('[bridge:debug] fireClose: no transport wired yet')
          // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[bridge:debug] fireClose(${code}) — injecting`)
        // 调用 debugFireClose，触发远程桥接会话此处需要的副作用。
        debugFireClose(code)
      },
      // 这个回调绑定到 forceReconnect: () => {，负责远程桥接会话在该局部场景下的响应。
      forceReconnect: () => {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[bridge:debug] forceReconnect — injecting')
        // 显式忽略 `reconnectEnvironmentWithSession()` 的返回值，只保留它触发的副作用。
        void reconnectEnvironmentWithSession()
      },
      injectFault: injectBridgeFault,
      wakePollLoop,
      // 这个回调绑定到 describe: () =>，负责远程桥接会话在该局部场景下的响应。
      describe: () =>
        `env=${environmentId} session=${currentSessionId} transport=${transport?.getStateLabel() ?? 'null'} workId=${currentWorkId ?? 'null'}`,
    })
  }

  // pollOpts 集合 集中保存远程桥接会话远程桥接 repl Bridge要一起传递的字段。
  const pollOpts = {
    api,
    // 这个回调绑定到 getCredentials: () => ({ environmentId, environmentSecret }),，负责远程桥接会话在该局部场景下的响应。
    getCredentials: () => ({ environmentId, environmentSecret }),
    signal: pollController.signal,
    getPollIntervalConfig,
    onStateChange,
    // 这个回调绑定到 getWsState: () => transport?.getStateLabel() ?? 'null',，负责远程桥接会话在该局部场景下的响应。
    getWsState: () => transport?.getStateLabel() ?? 'null',
    // REPL bridge is single-session: having any transport == at capacity.
    // No need to check isConnectedStatus() — even while the transport is
    // auto-reconnecting internally (up to 10 min), poll is heartbeat-only.
    // 这个回调绑定到 isAtCapacity: () => transport !== null,，负责远程桥接会话在该局部场景下的响应。
    isAtCapacity: () => transport !== null,
    capacitySignal,
    onFatalError: triggerTeardown,
    // 这个回调绑定到 getHeartbeatInfo: () => {，负责远程桥接会话在该局部场景下的响应。
    getHeartbeatInfo: () => {
      // 组合条件 `!currentWorkId || !currentIngressToken` 成立时，远程桥接会话才启用这条专门路径。
      if (!currentWorkId || !currentIngressToken) {
        // 返回 `null`，作为远程桥接会话这次计算的结果。
        return null
      }
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return {
        environmentId,
        workId: currentWorkId,
        sessionToken: currentIngressToken,
      }
    },
    // Work-item JWT expired (or work gone). The transport is useless —
    // SSE reconnects and CCR writes use the same stale token. Without
    // this callback the poll loop would do a 10-min at-capacity backoff,
    // during which the work lease (300s TTL) expires and the server stops
    // forwarding prompts → ~25-min dead window observed in daemon logs.
    // Kill the transport + work state so isAtCapacity()=false; the loop
    // fast-polls and picks up the server's re-dispatched work in seconds.
    // 这个回调绑定到 onHeartbeatFatal: (err: BridgeFatalError) => {，负责远程桥接会话在该局部场景下的响应。
    onHeartbeatFatal: (err: BridgeFatalError) => {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] heartbeatWork fatal (status=${err.status}) — tearing down work item for fast re-dispatch`,
      )
      // 满足 `transport` 时，远程桥接会话执行该分支。
      if (transport) {
        // seq读取`transport.getLastSequenceNum`，供远程桥接会话后续处理使用。
        const seq = transport.getLastSequenceNum()
        // 满足 `seq > lastTransportSequenceNum` 时，远程桥接会话执行该分支。
        if (seq > lastTransportSequenceNum) {
          // lastTransportSequenceNum更新为 `seq`，确保Bridge 通信后续读取最新状态。
          lastTransportSequenceNum = seq
        }
        // 调用 transport.close，触发远程桥接会话此处需要的副作用。
        transport.close()
        // transport更新为 `null`，确保Bridge 通信后续读取最新状态。
        transport = null
      }
      // 调用 flushGate.drop，触发远程桥接会话此处需要的副作用。
      flushGate.drop()
      // force=false → server re-queues. Likely already expired, but
      // idempotent and makes re-dispatch immediate if not.
      // 满足 `currentWorkId` 时，远程桥接会话执行该分支。
      if (currentWorkId) {
        // 显式忽略 `api` 的返回值，只保留它触发的副作用。
        void api
          .stopWork(environmentId, currentWorkId, false)
          // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
          .catch((e: unknown) => {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[bridge:repl] stopWork after heartbeat fatal: ${errorMessage(e)}`,
            )
          })
      }
      // currentWorkId更新为 `null`，确保Bridge 通信后续读取最新状态。
      currentWorkId = null
      // currentIngressToken更新为 `null`，确保Bridge 通信后续读取最新状态。
      currentIngressToken = null
      // 调用 wakePollLoop，触发远程桥接会话此处需要的副作用。
      wakePollLoop()
      // 远程桥接 repl Bridge在这里处理 `onStateChange?.(`，完成这一小步状态转换。
      onStateChange?.(
        'reconnecting',
        'Work item lease expired, fetching fresh token',
      )
    },
    // onEnvironmentLost 使用 无 完成远程桥接会话里的对应操作。
    async onEnvironmentLost() {
      // success 集合保存`reconnectEnvironmentWithSession`，供远程桥接会话后续处理使用。
      const success = await reconnectEnvironmentWithSession()
      // success 集合缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!success) {
        // 返回 `null`，作为远程桥接会话这次计算的结果。
        return null
      }
      // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
      return { environmentId, environmentSecret }
    },
    // 远程桥接 repl Bridge在这里处理 `onWorkReceived: (`，完成这一小步状态转换。
    onWorkReceived: (
      workSessionId: string,
      ingressToken: string,
      workId: string,
      serverUseCcrV2: boolean,
    ) => {
      // When new work arrives while a transport is already open, the
      // server has decided to re-dispatch (e.g. token rotation, server
      // restart). Close the existing transport and reconnect — discarding
      // the work causes a stuck 'reconnecting' state if the old WS dies
      // shortly after (the server won't re-dispatch a work item it
      // already delivered).
      // ingressToken (JWT) is stored for heartbeat auth (both v1 and v2).
      // Transport auth diverges — see the v1/v2 split below.
      // 满足 `transport?.isConnectedStatus()` 时，远程桥接会话执行该分支。
      if (transport?.isConnectedStatus()) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Work received while transport connected, replacing with fresh token (workId=${workId})`,
        )
      }

      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Work received: workId=${workId} workSessionId=${workSessionId} currentSessionId=${currentSessionId} match=${sameSessionId(workSessionId, currentSessionId)}`,
      )

      // Refresh the crash-recovery pointer's mtime. Staleness checks file
      // mtime (not embedded timestamp) so this re-write bumps the clock —
      // a 5h+ session that crashes still has a fresh pointer. Fires once
      // per work dispatch (infrequent — bounded by user message rate).
      // 显式忽略 `writeBridgePointer(dir, {` 的返回值，只保留它触发的副作用。
      void writeBridgePointer(dir, {
        sessionId: currentSessionId,
        environmentId,
        source: 'repl',
      })

      // Reject foreign session IDs — the server shouldn't assign sessions
      // from other environments. Since we create env+session as a pair,
      // a mismatch indicates an unexpected server-side reassignment.
      //
      // Compare by underlying UUID, not by tagged-ID prefix. When CCR
      // v2's compat layer serves the session, createBridgeSession gets
      // session_* from the v1-facing API (compat/convert.go:41) but the
      // infrastructure layer delivers cse_* in the work queue
      // (container_manager.go:129). Same UUID, different tag.
      // 满足 `!sameSessionId(workSessionId, currentSessionId)` 时，远程桥接会话执行该分支。
      if (!sameSessionId(workSessionId, currentSessionId)) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Rejecting foreign session: expected=${currentSessionId} got=${workSessionId}`,
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // currentWorkId更新为 `workId`，确保Bridge 通信后续读取最新状态。
      currentWorkId = workId
      // currentIngressToken更新为 `ingressToken`，确保Bridge 通信后续读取最新状态。
      currentIngressToken = ingressToken

      // Server decides per-session (secret.use_code_sessions from the work
      // secret, threaded through runWorkPollLoop). The env var is an ant-dev
      // override for forcing v2 before the server flag is on for your user —
      // requires ccr_v2_compat_enabled server-side or registerWorker 404s.
      //
      // Kept separate from CLAUDE_CODE_USE_CCR_V2 (the child-SDK transport
      // selector set by sessionRunner/environment-manager) to avoid the
      // inheritance hazard in spawn mode where the parent's orchestrator
      // var would leak into a v1 child.
      // useCcrV2 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const useCcrV2 =
        serverUseCcrV2 || isEnvTruthy(process.env.CLAUDE_BRIDGE_USE_CCR_V2)

      // Auth is the one place v1 and v2 diverge hard:
      //
      // - v1 (Session-Ingress): accepts OAuth OR JWT. We prefer OAuth
      //   because the standard OAuth refresh flow handles expiry — no
      //   separate JWT refresh scheduler needed.
      //
      // - v2 (CCR /worker/*): REQUIRES the JWT. register_worker.go:32
      //   validates the session_id claim, which OAuth tokens don't carry.
      //   The JWT from the work secret has both that claim and the worker
      //   role (environment_auth.py:856). JWT refresh: when it expires the
      //   server re-dispatches work with a fresh one, and onWorkReceived
      //   fires again. createV2ReplTransport stores it via
      //   updateSessionIngressAuthToken() before touching the network.
      // v1OauthToken 先占位，稍后的条件分支会根据实际输入补齐它。
      let v1OauthToken: string | undefined
      // useCcrV2缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!useCcrV2) {
        // v1OauthToken更新为 `getOAuthToken()`，确保Bridge 通信后续读取最新状态。
        v1OauthToken = getOAuthToken()
        // v1OauthToken缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!v1OauthToken) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            '[bridge:repl] No OAuth token available for session ingress, skipping work',
          )
          // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 调用 updateSessionIngressAuthToken，触发远程桥接会话此处需要的副作用。
        updateSessionIngressAuthToken(v1OauthToken)
      }
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_work_received', {})

      // Close the previous transport. Nullify BEFORE calling close() so
      // the close callback doesn't treat the programmatic close as
      // "session ended normally" and trigger a full teardown.
      // 满足 `transport` 时，远程桥接会话执行该分支。
      if (transport) {
        // oldTransport 命名 `transport`，让后续代码直接表达这个值的用途。
        const oldTransport = transport
        // transport更新为 `null`，确保Bridge 通信后续读取最新状态。
        transport = null
        // Capture the SSE sequence high-water mark so the next transport
        // resumes the stream instead of replaying from seq 0. Use max() —
        // a transport that died early (never received any frames) would
        // otherwise reset a non-zero mark back to 0.
        // oldSeq读取`oldTransport.getLastSequenceNum`，供远程桥接会话后续处理使用。
        const oldSeq = oldTransport.getLastSequenceNum()
        // 满足 `oldSeq > lastTransportSequenceNum` 时，远程桥接会话执行该分支。
        if (oldSeq > lastTransportSequenceNum) {
          // lastTransportSequenceNum更新为 `oldSeq`，确保Bridge 通信后续读取最新状态。
          lastTransportSequenceNum = oldSeq
        }
        // 调用 oldTransport.close，触发远程桥接会话此处需要的副作用。
        oldTransport.close()
      }
      // Reset flush state — the old flush (if any) is no longer relevant.
      // Preserve pending messages so they're drained after the new
      // transport's flush completes (the hook has already advanced its
      // lastWrittenIndex and won't re-send them).
      // 调用 flushGate.deactivate，触发远程桥接会话此处需要的副作用。
      flushGate.deactivate()

      // Closure adapter over the shared handleServerControlRequest —
      // captures transport/currentSessionId so the transport.setOnData
      // callback below doesn't need to thread them through.
      // onServerControlRequest 请求数据封装成回调，供远程桥接会话远程桥接 repl Bridge在事件触发或异步步骤中调用。
      const onServerControlRequest = (request: SDKControlRequest): void =>
        handleServerControlRequest(request, {
          transport,
          sessionId: currentSessionId,
          onInterrupt,
          onSetModel,
          onSetMaxThinkingTokens,
          onSetPermissionMode,
        })

      // initialFlushDone标记远程桥接会话远程桥接 repl Bridge是否启用对应路径。
      let initialFlushDone = false

      // Wire callbacks onto a freshly constructed transport and connect.
      // Extracted so the (sync) v1 and (async) v2 construction paths can
      // share the identical callback + flush machinery.
      // wireTransport封装成回调，供远程桥接会话远程桥接 repl Bridge在事件触发或异步步骤中调用。
      const wireTransport = (newTransport: ReplBridgeTransport): void => {
        // transport更新为 `newTransport`，确保Bridge 通信后续读取最新状态。
        transport = newTransport

        // newTransport.setOnConnect 写入新的状态值，使远程桥接会话后续读取保持一致。
        newTransport.setOnConnect(() => {
          // Guard: if transport was replaced by a newer onWorkReceived call
          // while the WS was connecting, ignore this stale callback.
          // `transport` 与 `newTransport` 不一致时刷新派生状态，避免使用过期结果。
          if (transport !== newTransport) return

          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging('[bridge:repl] Ingress transport connected')
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_bridge_repl_ws_connected', {})

          // Update the env var with the latest OAuth token so POST writes
          // (which read via getSessionIngressAuthToken()) use a fresh token.
          // v2 skips this — createV2ReplTransport already stored the JWT,
          // and overwriting it with OAuth would break subsequent /worker/*
          // requests (session_id claim check).
          // useCcrV2缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
          if (!useCcrV2) {
            // freshToken读取`getOAuthToken`，供远程桥接会话后续处理使用。
            const freshToken = getOAuthToken()
            // 满足 `freshToken` 时，远程桥接会话执行该分支。
            if (freshToken) {
              // 调用 updateSessionIngressAuthToken，触发远程桥接会话此处需要的副作用。
              updateSessionIngressAuthToken(freshToken)
            }
          }

          // Reset teardownStarted so future teardowns are not blocked.
          // teardownStarted更新为 `false`，确保Bridge 通信后续读取最新状态。
          teardownStarted = false

          // Flush initial messages only on first connect, not on every
          // WS reconnection. Re-flushing would cause duplicate messages.
          // IMPORTANT: onStateChange('connected') is deferred until the
          // flush completes. This prevents writeMessages() from sending
          // new messages that could arrive at the server interleaved with
          // the historical messages, and delays the web UI from showing
          // the session as active until history is persisted.
          // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
          if (
            !initialFlushDone &&
            initialMessages &&
            initialMessages.length > 0
          ) {
            // initialFlushDone更新为 `true`，确保Bridge 通信后续读取最新状态。
            initialFlushDone = true

            // Cap the initial flush to the most recent N messages. The full
            // history is UI-only (model doesn't see it) and large replays cause
            // slow session-ingress persistence (each event is a threadstore write)
            // plus elevated Firestore pressure. A 0 or negative cap disables it.
            // historyCap保存`initialHistoryCap`，供后续判断或组装使用。
            const historyCap = initialHistoryCap
            // eligibleMessages 消息数据筛选`initialMessages.filter`，供远程桥接会话后续处理使用。
            const eligibleMessages = initialMessages.filter(
              // m更新为 `>`，确保Bridge 通信后续读取最新状态。
              m =>
                isEligibleBridgeMessage(m) &&
                !previouslyFlushedUUIDs?.has(m.uuid),
            )
            // cappedMessages 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const cappedMessages =
              historyCap > 0 && eligibleMessages.length > historyCap
                ? eligibleMessages.slice(-historyCap)
                : eligibleMessages
            // 满足 `cappedMessages.length < eligibleMessages.length` 时，远程桥接会话执行该分支。
            if (cappedMessages.length < eligibleMessages.length) {
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[bridge:repl] Capped initial flush: ${eligibleMessages.length} -> ${cappedMessages.length} (cap=${historyCap})`,
              )
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_bridge_repl_history_capped', {
                eligible_count: eligibleMessages.length,
                capped_count: cappedMessages.length,
              })
            }
            // sdkMessages 消息数据保存`toSDKMessages`，供远程桥接会话后续处理使用。
            const sdkMessages = toSDKMessages(cappedMessages)
            // 满足 `sdkMessages.length > 0` 时，远程桥接会话执行该分支。
            if (sdkMessages.length > 0) {
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[bridge:repl] Flushing ${sdkMessages.length} initial message(s) via transport`,
              )
              // events 集合派生`sdkMessages.map`，供远程桥接会话后续处理使用。
              const events = sdkMessages.map(sdkMsg => ({
                ...sdkMsg,
                session_id: currentSessionId,
              }))
              // dropsBefore 命名 `newTransport.droppedBatchCount`，让后续代码直接表达这个值的用途。
              const dropsBefore = newTransport.droppedBatchCount
              // 显式忽略 `newTransport` 的返回值，只保留它触发的副作用。
              void newTransport
                .writeBatch(events)
                // 链式调用 then，继续加工上一行在远程桥接会话中产生的数据。
                .then(() => {
                  // If any batch was dropped during this flush (SI down for
                  // maxConsecutiveFailures attempts), flush() still resolved
                  // normally but the events were NOT delivered. Don't mark
                  // UUIDs as flushed — keep them eligible for re-send on the
                  // next onWorkReceived (JWT refresh re-dispatch, line ~1144).
                  // 满足 `newTransport.droppedBatchCount > dropsBefore` 时，远程桥接会话执行该分支。
                  if (newTransport.droppedBatchCount > dropsBefore) {
                    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                    logForDebugging(
                      `[bridge:repl] Initial flush dropped ${newTransport.droppedBatchCount - dropsBefore} batch(es) — not marking ${sdkMessages.length} UUID(s) as flushed`,
                    )
                    // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
                    return
                  }
                  // 满足 `previouslyFlushedUUIDs` 时，远程桥接会话执行该分支。
                  if (previouslyFlushedUUIDs) {
                    // 按顺序遍历 `sdkMessages` 中的sdkMsg，逐个交给远程桥接会话处理。
                    for (const sdkMsg of sdkMessages) {
                      // 满足 `sdkMsg.uuid` 时，远程桥接会话执行该分支。
                      if (sdkMsg.uuid) {
                        // 调用 previouslyFlushedUUIDs.add，触发远程桥接会话此处需要的副作用。
                        previouslyFlushedUUIDs.add(sdkMsg.uuid)
                      }
                    }
                  }
                })
                // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
                .catch(e =>
                  logForDebugging(`[bridge:repl] Initial flush failed: ${e}`),
                )
                // 链式调用 finally，继续加工上一行在远程桥接会话中产生的数据。
                .finally(() => {
                  // Guard: if transport was replaced during the flush,
                  // don't signal connected or drain — the new transport
                  // owns the lifecycle now.
                  // `transport` 与 `newTransport` 不一致时刷新派生状态，避免使用过期结果。
                  if (transport !== newTransport) return
                  // 调用 drainFlushGate，触发远程桥接会话此处需要的副作用。
                  drainFlushGate()
                  // 调用 onStateChange?.('connected')，完成这一处局部操作。
                  onStateChange?.('connected')
                })
            } else {
              // All initial messages were already flushed (filtered by
              // previouslyFlushedUUIDs). No flush POST needed — clear
              // the flag and signal connected immediately. This is the
              // first connect for this transport (inside !initialFlushDone),
              // so no flush POST is in-flight — the flag was set before
              // connect() and must be cleared here.
              // 调用 drainFlushGate，触发远程桥接会话此处需要的副作用。
              drainFlushGate()
              // 调用 onStateChange?.('connected')，完成这一处局部操作。
              onStateChange?.('connected')
            }
          // 远程桥接 repl Bridge在这里处理 `} else if (!flushGate.active) {`，完成这一小步状态转换。
          } else if (!flushGate.active) {
            // No initial messages or already flushed on first connect.
            // WS auto-reconnect path — only signal connected if no flush
            // POST is in-flight. If one is, .finally() owns the lifecycle.
            // 调用 onStateChange?.('connected')，完成这一处局部操作。
            onStateChange?.('connected')
          }
        })

        // newTransport.setOnData 写入新的状态值，使远程桥接会话后续读取保持一致。
        newTransport.setOnData(data => {
          // 调用 handleIngressMessage，触发远程桥接会话此处需要的副作用。
          handleIngressMessage(
            data,
            recentPostedUUIDs,
            recentInboundUUIDs,
            onInboundMessage,
            onPermissionResponse,
            onServerControlRequest,
          )
        })

        // Body lives at initBridgeCore scope so /bridge-kick can call it
        // directly via debugFireClose. All referenced closures (transport,
        // wakePollLoop, flushGate, reconnectEnvironmentWithSession, etc.)
        // are already at that scope. The only lexical dependency on
        // wireTransport was `newTransport.getLastSequenceNum()` — but after
        // the guard below passes we know transport === newTransport.
        // debugFireClose更新为 `handleTransportPermanentClose`，确保Bridge 通信后续读取最新状态。
        debugFireClose = handleTransportPermanentClose
        // newTransport.setOnClose 写入新的状态值，使远程桥接会话后续读取保持一致。
        newTransport.setOnClose(closeCode => {
          // Guard: if transport was replaced, ignore stale close.
          // `transport` 与 `newTransport` 不一致时刷新派生状态，避免使用过期结果。
          if (transport !== newTransport) return
          // 调用 handleTransportPermanentClose，触发远程桥接会话此处需要的副作用。
          handleTransportPermanentClose(closeCode)
        })

        // Start the flush gate before connect() to cover the WS handshake
        // window. Between transport assignment and setOnConnect firing,
        // writeMessages() could send messages via HTTP POST before the
        // initial flush starts. Starting the gate here ensures those
        // calls are queued. If there are no initial messages, the gate
        // stays inactive.
        // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
        if (
          !initialFlushDone &&
          initialMessages &&
          initialMessages.length > 0
        ) {
          // 调用 flushGate.start，触发远程桥接会话此处需要的副作用。
          flushGate.start()
        }

        // 调用 newTransport.connect，触发远程桥接会话此处需要的副作用。
        newTransport.connect()
      } // end wireTransport

      // Bump unconditionally — ANY new transport (v1 or v2) invalidates an
      // in-flight v2 handshake. Also bumped in doReconnect().
      // 远程桥接 repl Bridge在这里处理 `v2Generation++`，完成这一小步状态转换。
      v2Generation++

      // 满足 `useCcrV2` 时，远程桥接会话执行该分支。
      if (useCcrV2) {
        // workSessionId is the cse_* form (infrastructure-layer ID from the
        // work queue), which is what /v1/code/sessions/{id}/worker/* wants.
        // The session_* form (currentSessionId) is NOT usable here —
        // handler/convert.go:30 validates TagCodeSession.
        // sessionUrl 会话数据构建`buildCCRv2SdkUrl`，供远程桥接会话后续处理使用。
        const sessionUrl = buildCCRv2SdkUrl(baseUrl, workSessionId)
        // thisGen 命名 `v2Generation`，让后续代码直接表达这个值的用途。
        const thisGen = v2Generation
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] CCR v2: sessionUrl=${sessionUrl} session=${workSessionId} gen=${thisGen}`,
        )
        // 显式忽略 `createV2ReplTransport({` 的返回值，只保留它触发的副作用。
        void createV2ReplTransport({
          sessionUrl,
          ingressToken,
          sessionId: workSessionId,
          initialSequenceNum: lastTransportSequenceNum,
        }).then(
          // t更新为 `> {`，确保Bridge 通信后续读取最新状态。
          t => {
            // Teardown started while registerWorker was in flight. Teardown
            // saw transport === null and skipped close(); installing now
            // would leak CCRClient heartbeat timers and reset
            // teardownStarted via wireTransport's side effects.
            // 满足 `pollController.signal.aborted` 时，远程桥接会话执行该分支。
            if (pollController.signal.aborted) {
              // 调用 t.close，触发远程桥接会话此处需要的副作用。
              t.close()
              // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // onWorkReceived may have fired again while registerWorker()
            // was in flight (server re-dispatch with a fresh JWT). The
            // transport !== null check alone gets the race wrong when BOTH
            // attempts saw transport === null — it keeps the first resolver
            // (stale epoch) and discards the second (correct epoch). The
            // generation check catches it regardless of transport state.
            // `thisGen` 与 `v2Generation` 不一致时刷新派生状态，避免使用过期结果。
            if (thisGen !== v2Generation) {
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[bridge:repl] CCR v2: discarding stale handshake gen=${thisGen} current=${v2Generation}`,
              )
              // 调用 t.close，触发远程桥接会话此处需要的副作用。
              t.close()
              // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 调用 wireTransport，触发远程桥接会话此处需要的副作用。
            wireTransport(t)
          },
          // 这个回调绑定到 (err: unknown) => {，负责远程桥接会话在该局部场景下的响应。
          (err: unknown) => {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[bridge:repl] CCR v2: createV2ReplTransport failed: ${errorMessage(err)}`,
              { level: 'error' },
            )
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_bridge_repl_ccr_v2_init_failed', {})
            // If a newer attempt is in flight or already succeeded, don't
            // touch its work item — our failure is irrelevant.
            // `thisGen` 与 `v2Generation` 不一致时刷新派生状态，避免使用过期结果。
            if (thisGen !== v2Generation) return
            // Release the work item so the server re-dispatches immediately
            // instead of waiting for its own timeout. currentWorkId was set
            // above; without this, the session looks stuck to the user.
            // 满足 `currentWorkId` 时，远程桥接会话执行该分支。
            if (currentWorkId) {
              // 显式忽略 `api` 的返回值，只保留它触发的副作用。
              void api
                .stopWork(environmentId, currentWorkId, false)
                // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
                .catch((e: unknown) => {
                  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(
                    `[bridge:repl] stopWork after v2 init failure: ${errorMessage(e)}`,
                  )
                })
              // currentWorkId更新为 `null`，确保Bridge 通信后续读取最新状态。
              currentWorkId = null
              // currentIngressToken更新为 `null`，确保Bridge 通信后续读取最新状态。
              currentIngressToken = null
            }
            // 调用 wakePollLoop，触发远程桥接会话此处需要的副作用。
            wakePollLoop()
          },
        )
      } else {
        // v1: HybridTransport (WS reads + POST writes to Session-Ingress).
        // autoReconnect is true (default) — when the WS dies, the transport
        // reconnects automatically with exponential backoff. POST writes
        // continue during reconnection (they use getSessionIngressAuthToken()
        // independently of WS state). The poll loop remains as a secondary
        // fallback if the reconnect budget is exhausted (10 min).
        //
        // Auth: uses OAuth tokens directly instead of the JWT from the work
        // secret. refreshHeaders picks up the latest OAuth token on each
        // WS reconnect attempt.
        // wsUrl构建`buildSdkUrl`，供远程桥接会话后续处理使用。
        const wsUrl = buildSdkUrl(sessionIngressUrl, workSessionId)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`[bridge:repl] Ingress URL: ${wsUrl}`)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Creating HybridTransport: session=${workSessionId}`,
        )
        // v1OauthToken was validated non-null above (we'd have returned early).
        // oauthToken 命名 `v1OauthToken ?? ''`，让后续代码直接表达这个值的用途。
        const oauthToken = v1OauthToken ?? ''
        // 调用 wireTransport，触发远程桥接会话此处需要的副作用。
        wireTransport(
          createV1ReplTransport(
            new HybridTransport(
              new URL(wsUrl),
              {
                Authorization: `Bearer ${oauthToken}`,
                'anthropic-version': '2023-06-01',
              },
              workSessionId,
              // 这个回调绑定到 () => ({，负责远程桥接会话在该局部场景下的响应。
              () => ({
                Authorization: `Bearer ${getOAuthToken() ?? oauthToken}`,
                'anthropic-version': '2023-06-01',
              }),
              // Cap retries so a persistently-failing session-ingress can't
              // pin the uploader drain loop for the lifetime of the bridge.
              // 50 attempts ≈ 20 min (15s POST timeout + 8s backoff + jitter
              // per cycle at steady state). Bridge-only — 1P keeps indefinite.
              {
                maxConsecutiveFailures: 50,
                isBridge: true,
                // 这个回调绑定到 onBatchDropped: () => {，负责远程桥接会话在该局部场景下的响应。
                onBatchDropped: () => {
                  // 远程桥接 repl Bridge在这里处理 `onStateChange?.(`，完成这一小步状态转换。
                  onStateChange?.(
                    'reconnecting',
                    'Lost sync with Remote Control — events could not be delivered',
                  )
                  // SI has been down ~20 min. Wake the poll loop so that when
                  // SI recovers, next poll → onWorkReceived → fresh transport
                  // → initial flush succeeds → onStateChange('connected') at
                  // ~line 1420. Without this, state stays 'reconnecting' even
                  // after SI recovers — daemon.ts:437 denies all permissions,
                  // useReplBridge.ts:311 keeps replBridgeSessionActive=false.
                  // If the env was archived during the outage, poll 404 →
                  // onEnvironmentLost recovery path handles it.
                  // 调用 wakePollLoop，触发远程桥接会话此处需要的副作用。
                  wakePollLoop()
                },
              },
            ),
          ),
        )
      }
    },
  }
  // 显式忽略 `startWorkPollLoop(pollOpts)` 的返回值，只保留它触发的副作用。
  void startWorkPollLoop(pollOpts)

  // Perpetual mode: hourly mtime refresh of the crash-recovery pointer.
  // The onWorkReceived refresh only fires per user prompt — a
  // daemon idle for >4h would have a stale pointer, and the next restart
  // would clear it (readBridgePointer TTL check) → fresh session. The
  // standalone bridge (bridgeMain.ts) has an identical hourly timer.
  // pointerRefreshTimer保存`perpetual`，供后续判断或组装使用。
  const pointerRefreshTimer = perpetual
    // 这个回调绑定到 ? setInterval(() => {，负责远程桥接会话在该局部场景下的响应。
    ? setInterval(() => {
        // doReconnect() reassigns currentSessionId/environmentId non-
        // atomically (env at ~:634, session at ~:719, awaits in between).
        // If this timer fires in that window, its fire-and-forget write can
        // race with (and overwrite) doReconnect's own pointer write at ~:740,
        // leaving the pointer at the now-archived old session. doReconnect
        // writes the pointer itself, so skipping here is free.
        // 满足 `reconnectPromise` 时，远程桥接会话执行该分支。
        if (reconnectPromise) return
        // 显式忽略 `writeBridgePointer(dir, {` 的返回值，只保留它触发的副作用。
        void writeBridgePointer(dir, {
          sessionId: currentSessionId,
          environmentId,
          source: 'repl',
        })
      }, 60 * 60_000)
    : null
  // 调用 pointerRefreshTimer?.unref?.()，完成这一处局部操作。
  pointerRefreshTimer?.unref?.()

  // Push a silent keep_alive frame on a fixed interval so upstream proxies
  // and the session-ingress layer don't GC an otherwise-idle remote control
  // session. The keep_alive type is filtered before reaching any client UI
  // (Query.ts drops it; web/iOS/Android never see it in their message loop).
  // Interval comes from GrowthBook (tengu_bridge_poll_interval_config
  // session_keepalive_interval_v2_ms, default 120s); 0 = disabled.
  // keepAliveIntervalMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const keepAliveIntervalMs =
    getPollIntervalConfig().session_keepalive_interval_v2_ms
  // keepAliveTimer 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const keepAliveTimer =
    keepAliveIntervalMs > 0
      // 这个回调绑定到 ? setInterval(() => {，负责远程桥接会话在该局部场景下的响应。
      ? setInterval(() => {
          // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
          if (!transport) return
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging('[bridge:repl] keep_alive sent')
          // 这个回调绑定到 void transport.write({ type: 'keep_alive' }).catch((err: unknown) => {，负责远程桥接会话在该局部场景下的响应。
          void transport.write({ type: 'keep_alive' }).catch((err: unknown) => {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[bridge:repl] keep_alive write failed: ${errorMessage(err)}`,
            )
          })
        }, keepAliveIntervalMs)
      : null
  // 调用 keepAliveTimer?.unref?.()，完成这一处局部操作。
  keepAliveTimer?.unref?.()

  // Shared teardown sequence used by both cleanup registration and
  // the explicit teardown() method on the returned handle.
  // teardownStarted标记远程桥接会话远程桥接 repl Bridge是否启用对应路径。
  let teardownStarted = false
  // doTeardownImpl更新为 `async (): Promise<void> => {`，确保Bridge 通信后续读取最新状态。
  doTeardownImpl = async (): Promise<void> => {
    // 满足 `teardownStarted` 时，远程桥接会话执行该分支。
    if (teardownStarted) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Teardown already in progress, skipping duplicate call env=${environmentId} session=${currentSessionId}`,
      )
      // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // teardownStarted更新为 `true`，确保Bridge 通信后续读取最新状态。
    teardownStarted = true
    // teardownStart记录时间`Date.now`，供远程桥接会话后续处理使用。
    const teardownStart = Date.now()
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Teardown starting: env=${environmentId} session=${currentSessionId} workId=${currentWorkId ?? 'none'} transportState=${transport?.getStateLabel() ?? 'null'}`,
    )

    // `pointerRefreshTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (pointerRefreshTimer !== null) {
      // 调用 clearInterval，触发远程桥接会话此处需要的副作用。
      clearInterval(pointerRefreshTimer)
    }
    // `keepAliveTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (keepAliveTimer !== null) {
      // 调用 clearInterval，触发远程桥接会话此处需要的副作用。
      clearInterval(keepAliveTimer)
    }
    // 满足 `sigusr2Handler` 时，远程桥接会话执行该分支。
    if (sigusr2Handler) {
      // 调用 process.off，触发远程桥接会话此处需要的副作用。
      process.off('SIGUSR2', sigusr2Handler)
    }
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，远程桥接会话执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // 调用 clearBridgeDebugHandle，触发远程桥接会话此处需要的副作用。
      clearBridgeDebugHandle()
      // debugFireClose更新为 `null`，确保Bridge 通信后续读取最新状态。
      debugFireClose = null
    }
    // 触发取消信号，通知远程桥接会话中仍在等待的异步任务尽快停止。
    pollController.abort()
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge:repl] Teardown: poll loop aborted')

    // Capture the live transport's seq BEFORE close() — close() is sync
    // (just aborts the SSE fetch) and does NOT invoke onClose, so the
    // setOnClose capture path never runs for explicit teardown.
    // Without this, getSSESequenceNum() after teardown returns the stale
    // lastTransportSequenceNum (captured at the last transport swap), and
    // daemon callers persisting that value lose all events since then.
    // 满足 `transport` 时，远程桥接会话执行该分支。
    if (transport) {
      // finalSeq读取`transport.getLastSequenceNum`，供远程桥接会话后续处理使用。
      const finalSeq = transport.getLastSequenceNum()
      // 满足 `finalSeq > lastTransportSequenceNum` 时，远程桥接会话执行该分支。
      if (finalSeq > lastTransportSequenceNum) {
        // lastTransportSequenceNum更新为 `finalSeq`，确保Bridge 通信后续读取最新状态。
        lastTransportSequenceNum = finalSeq
      }
    }

    // 满足 `perpetual` 时，远程桥接会话执行该分支。
    if (perpetual) {
      // Perpetual teardown is LOCAL-ONLY — do not send result, do not call
      // stopWork, do not close the transport. All of those signal the
      // server (and any mobile/attach subscribers) that the session is
      // ending. Instead: stop polling, let the socket die with the
      // process; the backend times the work-item lease back to pending on
      // its own (TTL 300s). Next daemon start reads the pointer and
      // reconnectSession re-queues work.
      // transport更新为 `null`，确保Bridge 通信后续读取最新状态。
      transport = null
      // 调用 flushGate.drop，触发远程桥接会话此处需要的副作用。
      flushGate.drop()
      // Refresh the pointer mtime so that sessions lasting longer than
      // BRIDGE_POINTER_TTL_MS (4h) don't appear stale on next start.
      // 等待 `writeBridgePointer(dir, {` 完成，再继续远程桥接 repl Bridge的异步流程。
      await writeBridgePointer(dir, {
        sessionId: currentSessionId,
        environmentId,
        source: 'repl',
      })
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Teardown (perpetual): leaving env=${environmentId} session=${currentSessionId} alive on server, duration=${Date.now() - teardownStart}ms`,
      )
      // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Fire the result message, then archive, THEN close. transport.write()
    // only enqueues (SerialBatchEventUploader resolves on buffer-add); the
    // stopWork/archive latency (~200-500ms) is the drain window for the
    // result POST. Closing BEFORE archive meant relying on HybridTransport's
    // void-ed 3s grace period, which nothing awaits — forceExit can kill the
    // socket mid-POST. Same reorder as remoteBridgeCore.ts teardown (#22803).
    // teardownTransport 命名 `transport`，让后续代码直接表达这个值的用途。
    const teardownTransport = transport
    // transport更新为 `null`，确保Bridge 通信后续读取最新状态。
    transport = null
    // 调用 flushGate.drop，触发远程桥接会话此处需要的副作用。
    flushGate.drop()
    // 满足 `teardownTransport` 时，远程桥接会话执行该分支。
    if (teardownTransport) {
      // 显式忽略 `teardownTransport.write(makeResultMessage(currentSessionId))` 的返回值，只保留它触发的副作用。
      void teardownTransport.write(makeResultMessage(currentSessionId))
    }

    // stopWorkP保存`currentWorkId`，供后续判断或组装使用。
    const stopWorkP = currentWorkId
      ? api
          .stopWork(environmentId, currentWorkId, true)
          // 链式调用 then，继续加工上一行在远程桥接会话中产生的数据。
          .then(() => {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging('[bridge:repl] Teardown: stopWork completed')
          })
          // 链式调用 catch，继续加工上一行在远程桥接会话中产生的数据。
          .catch((err: unknown) => {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `[bridge:repl] Teardown stopWork failed: ${errorMessage(err)}`,
            )
          })
      : Promise.resolve()

    // Run stopWork and archiveSession in parallel. gracefulShutdown.ts:407
    // races runCleanupFunctions() against 2s (NOT the 5s outer failsafe),
    // so archive is capped at 1.5s at the injection site to stay under budget.
    // archiveSession is contractually no-throw; the injected implementations
    // log their own success/failure internally.
    // 等待 `Promise.all([stopWorkP, archiveSession(currentSessionId)])` 完成，再继续远程桥接 repl Bridge的异步流程。
    await Promise.all([stopWorkP, archiveSession(currentSessionId)])

    // 调用 teardownTransport?.close()，完成这一处局部操作。
    teardownTransport?.close()
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[bridge:repl] Teardown: transport closed')

    // 这个回调绑定到 await api.deregisterEnvironment(environmentId).catch((err: unknown) => {，负责远程桥接会话在该局部场景下的响应。
    await api.deregisterEnvironment(environmentId).catch((err: unknown) => {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Teardown deregister failed: ${errorMessage(err)}`,
      )
    })

    // Clear the crash-recovery pointer — explicit disconnect or clean REPL
    // exit means the user is done with this session. Crash/kill-9 never
    // reaches this line, leaving the pointer for next-launch recovery.
    // 等待 `clearBridgePointer(dir)` 完成，再继续远程桥接 repl Bridge的异步流程。
    await clearBridgePointer(dir)

    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] Teardown complete: env=${environmentId} duration=${Date.now() - teardownStart}ms`,
    )
  }

  // 8. Register cleanup for graceful shutdown
  // unregister保存`registerCleanup`，供远程桥接会话后续处理使用。
  const unregister = registerCleanup(() => doTeardownImpl?.())

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:repl] Ready: env=${environmentId} session=${currentSessionId}`,
  )
  // 调用 onStateChange?.('ready')，完成这一处局部操作。
  onStateChange?.('ready')

  // 返回结构化结果，集中表达远程桥接会话已经整理出的状态。
  return {
    // 远程桥接 repl Bridge在这里处理 `get bridgeSessionId() {`，完成这一小步状态转换。
    get bridgeSessionId() {
      // 返回 `currentSessionId`，作为远程桥接会话这次计算的结果。
      return currentSessionId
    },
    // 远程桥接 repl Bridge在这里处理 `get environmentId() {`，完成这一小步状态转换。
    get environmentId() {
      // 返回 `environmentId`，作为远程桥接会话这次计算的结果。
      return environmentId
    },
    // getSSESequenceNum不依赖额外参数，直接计算远程桥接会话需要的结果。
    getSSESequenceNum() {
      // lastTransportSequenceNum only updates when a transport is CLOSED
      // (captured at swap/onClose). During normal operation the CURRENT
      // transport's live seq isn't reflected there. Merge both so callers
      // (e.g. daemon persistState()) get the actual high-water mark.
      // live读取`getLastSequenceNum`，供远程桥接会话后续处理使用。
      const live = transport?.getLastSequenceNum() ?? 0
      // 返回 `Math.max(lastTransportSequenceNum, live)`，作为远程桥接会话这次计算的结果。
      return Math.max(lastTransportSequenceNum, live)
    },
    sessionIngressUrl,
    // writeMessages 使用 messages 完成远程桥接会话里的对应操作。
    writeMessages(messages) {
      // Filter to user/assistant messages that haven't already been sent.
      // Two layers of dedup:
      //  - initialMessageUUIDs: messages sent as session creation events
      //  - recentPostedUUIDs: messages recently sent via POST
      // filtered筛选`messages.filter`，供远程桥接会话后续处理使用。
      const filtered = messages.filter(
        // m更新为 `>`，确保Bridge 通信后续读取最新状态。
        m =>
          isEligibleBridgeMessage(m) &&
          !initialMessageUUIDs.has(m.uuid) &&
          !recentPostedUUIDs.has(m.uuid),
      )
      // filtered为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
      if (filtered.length === 0) return

      // Fire onUserMessage for title derivation. Scan before the flushGate
      // check — prompts are title-worthy even if they queue behind the
      // initial history flush. Keeps calling on every title-worthy message
      // until the callback returns true; the caller owns the policy.
      // userMessageCallbackDone 消息数据缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!userMessageCallbackDone) {
        // 按顺序遍历 `filtered` 中的m，逐个交给远程桥接会话处理。
        for (const m of filtered) {
          // 文本保存`extractTitleText`，供远程桥接会话后续处理使用。
          const text = extractTitleText(m)
          // `text` 与 `undefined && onUserMessage?.(te...` 不一致时刷新派生状态，避免使用过期结果。
          if (text !== undefined && onUserMessage?.(text, currentSessionId)) {
            // userMessageCallbackDone 消息数据更新为 `true`，确保Bridge 通信后续读取最新状态。
            userMessageCallbackDone = true
            // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
            break
          }
        }
      }

      // Queue messages while the initial flush is in progress to prevent
      // them from arriving at the server interleaved with history.
      // 满足 `flushGate.enqueue(...filtered)` 时，远程桥接会话执行该分支。
      if (flushGate.enqueue(...filtered)) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Queued ${filtered.length} message(s) during initial flush`,
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!transport) {
        // types 集合筛选`filtered.map`，供远程桥接会话后续处理使用。
        const types = filtered.map(m => m.type).join(',')
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Transport not configured, dropping ${filtered.length} message(s) [${types}] for session=${currentSessionId}`,
          { level: 'warn' },
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Track in the bounded ring buffer for echo filtering and dedup.
      // 按顺序遍历 `filtered` 中的消息，逐个交给远程桥接会话处理。
      for (const msg of filtered) {
        // 调用 recentPostedUUIDs.add，触发远程桥接会话此处需要的副作用。
        recentPostedUUIDs.add(msg.uuid)
      }

      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Sending ${filtered.length} message(s) via transport`,
      )

      // Convert to SDK format and send via HTTP POST (HybridTransport).
      // The web UI receives them via the subscribe WebSocket.
      // sdkMessages 消息数据保存`toSDKMessages`，供远程桥接会话后续处理使用。
      const sdkMessages = toSDKMessages(filtered)
      // events 集合派生`sdkMessages.map`，供远程桥接会话后续处理使用。
      const events = sdkMessages.map(sdkMsg => ({
        ...sdkMsg,
        session_id: currentSessionId,
      }))
      // 显式忽略 `transport.writeBatch(events)` 的返回值，只保留它触发的副作用。
      void transport.writeBatch(events)
    },
    // writeSdkMessages 使用 messages 完成远程桥接会话里的对应操作。
    writeSdkMessages(messages) {
      // Daemon path: query() already yields SDKMessage, skip conversion.
      // Still run echo dedup (server bounces writes back on the WS).
      // No initialMessageUUIDs filter — daemon has no initial messages.
      // No flushGate — daemon never starts it (no initial flush).
      // filtered筛选`messages.filter`，供远程桥接会话后续处理使用。
      const filtered = messages.filter(
        // m更新为 `> !m.uuid || !recentPostedUUIDs.has(m.uuid)`，确保Bridge 通信后续读取最新状态。
        m => !m.uuid || !recentPostedUUIDs.has(m.uuid),
      )
      // filtered为空时立即返回或跳过，避免远程桥接会话把空集合当成可处理内容。
      if (filtered.length === 0) return
      // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!transport) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Transport not configured, dropping ${filtered.length} SDK message(s) for session=${currentSessionId}`,
          { level: 'warn' },
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 按顺序遍历 `filtered` 中的消息，逐个交给远程桥接会话处理。
      for (const msg of filtered) {
        // 满足 `msg.uuid) recentPostedUUIDs.add(msg.uuid` 时，远程桥接会话执行该分支。
        if (msg.uuid) recentPostedUUIDs.add(msg.uuid)
      }
      // events 集合筛选`filtered.map`，供远程桥接会话后续处理使用。
      const events = filtered.map(m => ({ ...m, session_id: currentSessionId }))
      // 显式忽略 `transport.writeBatch(events)` 的返回值，只保留它触发的副作用。
      void transport.writeBatch(events)
    },
    // sendControlRequest 使用 request: SDKControlRequest 完成远程桥接会话里的对应操作。
    sendControlRequest(request: SDKControlRequest) {
      // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!transport) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[bridge:repl] Transport not configured, skipping control_request',
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // event 集中保存远程桥接会话远程桥接 repl Bridge要一起传递的字段。
      const event = { ...request, session_id: currentSessionId }
      // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
      void transport.write(event)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Sent control_request request_id=${request.request_id}`,
      )
    },
    // sendControlResponse 使用 response: SDKControlResponse 完成远程桥接会话里的对应操作。
    sendControlResponse(response: SDKControlResponse) {
      // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!transport) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[bridge:repl] Transport not configured, skipping control_response',
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // event 集中保存远程桥接会话远程桥接 repl Bridge要一起传递的字段。
      const event = { ...response, session_id: currentSessionId }
      // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
      void transport.write(event)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[bridge:repl] Sent control_response')
    },
    // sendControlCancelRequest 使用 requestId: string 完成远程桥接会话里的对应操作。
    sendControlCancelRequest(requestId: string) {
      // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!transport) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          '[bridge:repl] Transport not configured, skipping control_cancel_request',
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // event 集中保存远程桥接会话远程桥接 repl Bridge要一起传递的字段。
      const event = {
        type: 'control_cancel_request' as const,
        request_id: requestId,
        session_id: currentSessionId,
      }
      // 显式忽略 `transport.write(event)` 的返回值，只保留它触发的副作用。
      void transport.write(event)
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Sent control_cancel_request request_id=${requestId}`,
      )
    },
    // sendResult 使用 无 完成远程桥接会话里的对应操作。
    sendResult() {
      // transport缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!transport) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] sendResult: skipping, transport not configured session=${currentSessionId}`,
        )
        // 远程桥接 repl Bridge在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 显式忽略 `transport.write(makeResultMessage(currentSessionId))` 的返回值，只保留它触发的副作用。
      void transport.write(makeResultMessage(currentSessionId))
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Sent result for session=${currentSessionId}`,
      )
    },
    // teardown 使用 无 完成远程桥接会话里的对应操作。
    async teardown() {
      // 调用 unregister，触发远程桥接会话此处需要的副作用。
      unregister()
      // 等待 `doTeardownImpl?.()` 完成，再继续远程桥接 repl Bridge的异步流程。
      await doTeardownImpl?.()
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[bridge:repl] Torn down')
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_teardown', {})
    },
  }
}

/**
 * Persistent poll loop for work items. Runs in the background for the
 * lifetime of the bridge connection.
 *
 * When a work item arrives, acknowledges it and calls onWorkReceived
 * with the session ID and ingress token (which connects the ingress
 * WebSocket). Then continues polling — the server will dispatch a new
 * work item if the ingress WebSocket drops, allowing automatic
 * reconnection without tearing down the bridge.
 */
// startWorkPollLoop 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function startWorkPollLoop({
  api,
  getCredentials,
  signal,
  onStateChange,
  onWorkReceived,
  onEnvironmentLost,
  getWsState,
  isAtCapacity,
  capacitySignal,
  onFatalError,
  // getPollIntervalConfig 配置更新为 `() => DEFAULT_POLL_CONFIG`，确保Bridge 通信后续读取最新状态。
  getPollIntervalConfig = () => DEFAULT_POLL_CONFIG,
  getHeartbeatInfo,
  onHeartbeatFatal,
}: {
  api: BridgeApiClient
  // 这个回调绑定到 getCredentials: () => { environmentId: string; environmentSecret: string }，负责远程桥接会话在该局部场景下的响应。
  getCredentials: () => { environmentId: string; environmentSecret: string }
  signal: AbortSignal
  onStateChange?: (state: BridgeState, detail?: string) => void
  // 远程桥接 repl Bridge在这里处理 `onWorkReceived: (`，完成这一小步状态转换。
  onWorkReceived: (
    sessionId: string,
    ingressToken: string,
    workId: string,
    useCodeSessions: boolean,
  ) => void
  /** Called when the environment has been deleted. Returns new credentials or null. */
  // 这个回调绑定到 onEnvironmentLost?: () => Promise<{，负责远程桥接会话在该局部场景下的响应。
  onEnvironmentLost?: () => Promise<{
    environmentId: string
    environmentSecret: string
  } | null>
  /** Returns the current WebSocket readyState label for diagnostic logging. */
  // 这个回调绑定到 getWsState?: () => string，负责远程桥接会话在该局部场景下的响应。
  getWsState?: () => string
  /**
   * Returns true when the caller cannot accept new work (transport already
   * connected). When true, the loop polls at the configured at-capacity
   * interval as a heartbeat only. Server-side BRIDGE_LAST_POLL_TTL is
   * 4 hours — anything shorter than that is sufficient for liveness.
   */
  // 这个回调绑定到 isAtCapacity?: () => boolean，负责远程桥接会话在该局部场景下的响应。
  isAtCapacity?: () => boolean
  /**
   * Produces a signal that aborts when capacity frees up (transport lost),
   * merged with the loop signal. Used to interrupt the at-capacity sleep
   * so recovery polling starts immediately.
   */
  // 这个回调绑定到 capacitySignal?: () => CapacitySignal，负责远程桥接会话在该局部场景下的响应。
  capacitySignal?: () => CapacitySignal
  /** Called on unrecoverable errors (e.g. server-side expiry) to trigger full teardown. */
  // 这个回调绑定到 onFatalError?: () => void，负责远程桥接会话在该局部场景下的响应。
  onFatalError?: () => void
  /** Poll interval config getter — defaults to DEFAULT_POLL_CONFIG. */
  // 这个回调绑定到 getPollIntervalConfig?: () => PollIntervalConfig，负责远程桥接会话在该局部场景下的响应。
  getPollIntervalConfig?: () => PollIntervalConfig
  /**
   * Returns the current work ID and session ingress token for heartbeat.
   * When null, heartbeat is not possible (no active work item).
   */
  // 这个回调绑定到 getHeartbeatInfo?: () => {，负责远程桥接会话在该局部场景下的响应。
  getHeartbeatInfo?: () => {
    environmentId: string
    workId: string
    sessionToken: string
  } | null
  /**
   * Called when heartbeatWork throws BridgeFatalError (401/403/404/410 —
   * JWT expired or work item gone). Caller should tear down the transport
   * + work state so isAtCapacity() flips to false and the loop fast-polls
   * for the server's re-dispatched work item. When provided, the loop
   * SKIPS the at-capacity backoff sleep (which would otherwise cause a
   * ~10-minute dead window before recovery). When omitted, falls back to
   * the backoff sleep to avoid a tight poll+heartbeat loop.
   */
  // 这个回调绑定到 onHeartbeatFatal?: (err: BridgeFatalError) => void，负责远程桥接会话在该局部场景下的响应。
  onHeartbeatFatal?: (err: BridgeFatalError) => void
}): Promise<void> {
  // MAX_ENVIRONMENT_RECREATIONS 集合 命名 `3`，让后续代码直接表达这个值的用途。
  const MAX_ENVIRONMENT_RECREATIONS = 3

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:repl] Starting work poll loop for env=${getCredentials().environmentId}`,
  )

  // consecutiveErrors 错误信息保存`0`，供后续判断或组装使用。
  let consecutiveErrors = 0
  // firstErrorTime 错误信息保存`null`，作为后续空值处理的输入。
  let firstErrorTime: number | null = null
  // lastPollErrorTime 错误信息 命名 `null`，让后续代码直接表达这个值的用途。
  let lastPollErrorTime: number | null = null
  // environmentRecreations 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let environmentRecreations = 0
  // Set when the at-capacity sleep overruns its deadline by a large margin
  // (process suspension). Consumed at the top of the next iteration to
  // force one fast-poll cycle — isAtCapacity() is `transport !== null`,
  // which stays true while the transport auto-reconnects, so the poll
  // loop would otherwise go straight back to a 10-minute sleep on a
  // transport that may be pointed at a dead socket.
  // suspensionDetected标记远程桥接会话远程桥接 repl Bridge是否启用对应路径。
  let suspensionDetected = false

  // while 使用 !signal.aborted 完成远程桥接会话里的对应操作。
  while (!signal.aborted) {
    // Capture credentials outside try so the catch block can detect
    // whether a concurrent reconnection replaced the environment.
    // 远程桥接 repl Bridge先整理这一处局部数据，后续分支可以直接读取。
    const { environmentId: envId, environmentSecret: envSecret } =
      getCredentials()
    // pollConfig 配置读取`getPollIntervalConfig`，供远程桥接会话后续处理使用。
    const pollConfig = getPollIntervalConfig()
    // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
    try {
      // work保存`api.pollForWork`，供远程桥接会话后续处理使用。
      const work = await api.pollForWork(
        envId,
        envSecret,
        signal,
        pollConfig.reclaim_older_than_ms,
      )

      // A successful poll proves the env is genuinely healthy — reset the
      // env-loss counter so events hours apart each start fresh. Outside
      // the state-change guard below because onEnvLost's success path
      // already emits 'ready'; emitting again here would be a duplicate.
      // (onEnvLost returning creds does NOT reset this — that would break
      // oscillation protection when the new env immediately dies.)
      // environmentRecreations 集合更新为 `0`，确保Bridge 通信后续读取最新状态。
      environmentRecreations = 0

      // Reset error tracking on successful poll
      // 满足 `consecutiveErrors > 0` 时，远程桥接会话执行该分支。
      if (consecutiveErrors > 0) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Poll recovered after ${consecutiveErrors} consecutive error(s)`,
        )
        // consecutiveErrors 错误信息更新为 `0`，确保Bridge 通信后续读取最新状态。
        consecutiveErrors = 0
        // firstErrorTime 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
        firstErrorTime = null
        // lastPollErrorTime 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
        lastPollErrorTime = null
        // 调用 onStateChange?.('ready')，完成这一处局部操作。
        onStateChange?.('ready')
      }

      // work缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
      if (!work) {
        // Read-and-clear: after a detected suspension, skip the at-capacity
        // branch exactly once. The pollForWork above already refreshed the
        // server's BRIDGE_LAST_POLL_TTL; this fast cycle gives any
        // re-dispatched work item a chance to land before we go back under.
        // skipAtCapacityOnce保存`suspensionDetected`，供后续判断或组装使用。
        const skipAtCapacityOnce = suspensionDetected
        // suspensionDetected更新为 `false`，确保Bridge 通信后续读取最新状态。
        suspensionDetected = false
        // 组合条件 `isAtCapacity?.() && capacitySignal && !skipAtCapacityOnce` 成立时，远程桥接会话才启用这条专门路径。
        if (isAtCapacity?.() && capacitySignal && !skipAtCapacityOnce) {
          // atCapMs 集合保存`pollConfig.poll_interval_ms_at_capacity`，供后续判断或组装使用。
          const atCapMs = pollConfig.poll_interval_ms_at_capacity
          // Heartbeat loops WITHOUT polling. When at-capacity polling is also
          // enabled (atCapMs > 0), the loop tracks a deadline and breaks out
          // to poll at that interval — heartbeat and poll compose instead of
          // one suppressing the other. Breaks out when:
          //   - Poll deadline reached (atCapMs > 0 only)
          //   - Auth fails (JWT expired → poll refreshes tokens)
          //   - Capacity wake fires (transport lost → poll for new work)
          //   - Heartbeat config disabled (GrowthBook update)
          //   - Loop aborted (shutdown)
          // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
          if (
            pollConfig.non_exclusive_heartbeat_interval_ms > 0 &&
            getHeartbeatInfo
          ) {
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_bridge_heartbeat_mode_entered', {
              heartbeat_interval_ms:
                pollConfig.non_exclusive_heartbeat_interval_ms,
            })
            // Deadline computed once at entry — GB updates to atCapMs don't
            // shift an in-flight deadline (next entry picks up the new value).
            // pollDeadline记录时间`Date.now`，供远程桥接会话后续处理使用。
            const pollDeadline = atCapMs > 0 ? Date.now() + atCapMs : null
            // needsBackoff标记远程桥接会话远程桥接 repl Bridge是否启用对应路径。
            let needsBackoff = false
            // hbCycles 集合 命名 `0`，让后续代码直接表达这个值的用途。
            let hbCycles = 0
            // 调用 while，触发远程桥接会话此处需要的副作用。
            while (
              !signal.aborted &&
              isAtCapacity() &&
              (pollDeadline === null || Date.now() < pollDeadline)
            ) {
              // hbConfig 配置读取`getPollIntervalConfig`，供远程桥接会话后续处理使用。
              const hbConfig = getPollIntervalConfig()
              // 满足 `hbConfig.non_exclusive_heartbeat_interval_ms <= 0` 时，远程桥接会话执行该分支。
              if (hbConfig.non_exclusive_heartbeat_interval_ms <= 0) break

              // info读取`getHeartbeatInfo`，供远程桥接会话后续处理使用。
              const info = getHeartbeatInfo()
              // info缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
              if (!info) break

              // Capture capacity signal BEFORE the async heartbeat call so
              // a transport loss during the HTTP request is caught by the
              // subsequent sleep.
              // cap保存`capacitySignal`，供远程桥接会话后续处理使用。
              const cap = capacitySignal()

              // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
              try {
                // 等待 `api.heartbeatWork(` 完成，再继续远程桥接 repl Bridge的异步流程。
                await api.heartbeatWork(
                  info.environmentId,
                  info.workId,
                  info.sessionToken,
                )
              } catch (err) {
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[bridge:repl:heartbeat] Failed: ${errorMessage(err)}`,
                )
                // 满足 `err instanceof BridgeFatalError` 时，远程桥接会话执行该分支。
                if (err instanceof BridgeFatalError) {
                  // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
                  cap.cleanup()
                  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                  logEvent('tengu_bridge_heartbeat_error', {
                    status:
                      err.status as unknown as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    error_type: (err.status === 401 || err.status === 403
                      ? 'auth_failed'
                      : 'fatal') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                  })
                  // JWT expired (401/403) or work item gone (404/410).
                  // Either way the current transport is dead — SSE
                  // reconnects and CCR writes will fail on the same
                  // stale token. If the caller gave us a recovery hook,
                  // tear down work state and skip backoff: isAtCapacity()
                  // flips to false, next outer-loop iteration fast-polls
                  // for the server's re-dispatched work item. Without
                  // the hook, backoff to avoid tight poll+heartbeat loop.
                  // 满足 `onHeartbeatFatal` 时，远程桥接会话执行该分支。
                  if (onHeartbeatFatal) {
                    // 调用 onHeartbeatFatal，触发远程桥接会话此处需要的副作用。
                    onHeartbeatFatal(err)
                    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                    logForDebugging(
                      `[bridge:repl:heartbeat] Fatal (status=${err.status}), work state cleared — fast-polling for re-dispatch`,
                    )
                  } else {
                    // needsBackoff更新为 `true`，确保Bridge 通信后续读取最新状态。
                    needsBackoff = true
                  }
                  // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
                  break
                }
              }

              // 远程桥接 repl Bridge在这里处理 `hbCycles++`，完成这一小步状态转换。
              hbCycles++
              // 等待 `sleep(` 完成，再继续远程桥接 repl Bridge的异步流程。
              await sleep(
                hbConfig.non_exclusive_heartbeat_interval_ms,
                cap.signal,
              )
              // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
              cap.cleanup()
            }

            // exitReason保存`needsBackoff`，供后续判断或组装使用。
            const exitReason = needsBackoff
              ? 'error'
              : signal.aborted
                ? 'shutdown'
                : !isAtCapacity()
                  ? 'capacity_changed'
                  : pollDeadline !== null && Date.now() >= pollDeadline
                    ? 'poll_due'
                    : 'config_disabled'
            // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_bridge_heartbeat_mode_exited', {
              reason:
                exitReason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              heartbeat_cycles: hbCycles,
            })

            // On auth_failed or fatal, backoff before polling to avoid a
            // tight poll+heartbeat loop. Fall through to the shared sleep
            // below — it's the same capacitySignal-wrapped sleep the legacy
            // path uses, and both need the suspension-overrun check.
            // needsBackoff缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
            if (!needsBackoff) {
              // 当 `exitReason` 匹配 `'poll_due'` 时，远程桥接会话执行对应分支。
              if (exitReason === 'poll_due') {
                // bridgeApi throttles empty-poll logs (EMPTY_POLL_LOG_INTERVAL=100)
                // so the once-per-10min poll_due poll is invisible at counter=2.
                // Log it here so verification runs see both endpoints in the debug log.
                // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
                logForDebugging(
                  `[bridge:repl] Heartbeat poll_due after ${hbCycles} cycles — falling through to pollForWork`,
                )
              }
              // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
              continue
            }
          }
          // At-capacity sleep — reached by both the legacy path (heartbeat
          // disabled) and the heartbeat-backoff path (needsBackoff=true).
          // Merged so the suspension detector covers both; previously the
          // backoff path had no overrun check and could go straight back
          // under for 10 min after a laptop wake. Use atCapMs when enabled,
          // else the heartbeat interval as a floor (guaranteed > 0 on the
          // backoff path) so heartbeat-only configs don't tight-loop.
          // sleepMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const sleepMs =
            atCapMs > 0
              ? atCapMs
              : pollConfig.non_exclusive_heartbeat_interval_ms
          // 满足 `sleepMs > 0` 时，远程桥接会话执行该分支。
          if (sleepMs > 0) {
            // cap保存`capacitySignal`，供远程桥接会话后续处理使用。
            const cap = capacitySignal()
            // sleepStart记录时间`Date.now`，供远程桥接会话后续处理使用。
            const sleepStart = Date.now()
            // 等待 `sleep(sleepMs, cap.signal)` 完成，再继续远程桥接 repl Bridge的异步流程。
            await sleep(sleepMs, cap.signal)
            // 调用 cap.cleanup，触发远程桥接会话此处需要的副作用。
            cap.cleanup()
            // Process-suspension detector. A setTimeout overshooting its
            // deadline by 60s means the process was suspended (laptop lid,
            // SIGSTOP, VM pause) — even a pathological GC pause is seconds,
            // not minutes. Early aborts (wakePollLoop → cap.signal) produce
            // overrun < 0 and fall through. Note: this only catches sleeps
            // that outlast their deadline; WebSocketTransport's ping
            // interval (10s granularity) is the primary detector for shorter
            // suspensions. This is the backstop for when that detector isn't
            // running (transport mid-reconnect, interval stopped).
            // overrun记录时间`Date.now`，供远程桥接会话后续处理使用。
            const overrun = Date.now() - sleepStart - sleepMs
            // 满足 `overrun > 60_000` 时，远程桥接会话执行该分支。
            if (overrun > 60_000) {
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logForDebugging(
                `[bridge:repl] At-capacity sleep overran by ${Math.round(overrun / 1000)}s — process suspension detected, forcing one fast-poll cycle`,
              )
              // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_bridge_repl_suspension_detected', {
                overrun_ms: overrun,
              })
              // suspensionDetected更新为 `true`，确保Bridge 通信后续读取最新状态。
              suspensionDetected = true
            }
          }
        } else {
          // 等待 `sleep(pollConfig.poll_interval_ms_not_at_capacity, signal)` 完成，再继续远程桥接 repl Bridge的异步流程。
          await sleep(pollConfig.poll_interval_ms_not_at_capacity, signal)
        }
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }

      // Decode before type dispatch — need the JWT for the explicit ack.
      // secret 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let secret
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // secret更新为 `decodeWorkSecret(work.secret)`，确保Bridge 通信后续读取最新状态。
        secret = decodeWorkSecret(work.secret)
      } catch (err) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Failed to decode work secret: ${errorMessage(err)}`,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_repl_work_secret_failed', {})
        // Can't ack (needs the JWT we failed to decode). stopWork uses OAuth.
        // Prevents XAUTOCLAIM re-delivering this poisoned item every cycle.
        // 这个回调绑定到 await api.stopWork(envId, work.id, false).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
        await api.stopWork(envId, work.id, false).catch(() => {})
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }

      // Explicitly acknowledge to prevent redelivery. Non-fatal on failure:
      // server re-delivers, and the onWorkReceived callback handles dedup.
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[bridge:repl] Acknowledging workId=${work.id}`)
      // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `api.acknowledgeWork(envId, work.id, secret.session_ingress_token)` 完成，再继续远程桥接 repl Bridge的异步流程。
        await api.acknowledgeWork(envId, work.id, secret.session_ingress_token)
      } catch (err) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Acknowledge failed workId=${work.id}: ${errorMessage(err)}`,
        )
      }

      // 当 `work.data.type` 匹配 `'healthcheck'` 时，远程桥接会话执行对应分支。
      if (work.data.type === 'healthcheck') {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[bridge:repl] Healthcheck received')
        // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
        continue
      }

      // 当 `work.data.type` 匹配 `'session'` 时，远程桥接会话执行对应分支。
      if (work.data.type === 'session') {
        // workSessionId 会话数据 命名 `work.data.id`，让后续代码直接表达这个值的用途。
        const workSessionId = work.data.id
        // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
        try {
          // 调用 validateBridgeId，触发远程桥接会话此处需要的副作用。
          validateBridgeId(workSessionId, 'session_id')
        } catch {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:repl] Invalid session_id in work: ${workSessionId}`,
          )
          // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
          continue
        }

        // 调用 onWorkReceived，触发远程桥接会话此处需要的副作用。
        onWorkReceived(
          workSessionId,
          secret.session_ingress_token,
          work.id,
          secret.use_code_sessions === true,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[bridge:repl] Work accepted, continuing poll loop')
      }
    } catch (err) {
      // 满足 `signal.aborted` 时，远程桥接会话执行该分支。
      if (signal.aborted) break

      // Detect permanent "environment deleted" error — no amount of
      // retrying will recover. Re-register a new environment instead.
      // Checked BEFORE the generic BridgeFatalError bail. pollForWork uses
      // validateStatus: s => s < 500, so 404 is always wrapped into a
      // BridgeFatalError by handleErrorStatus() — never an axios-shaped
      // error. The poll endpoint's only path param is the env ID; 404
      // unambiguously means env-gone (no-work is a 200 with null body).
      // The server sends error.type='not_found_error' (standard Anthropic
      // API shape), not a bridge-specific string — but status===404 is
      // the real signal and survives body-shape changes.
      // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
      if (
        err instanceof BridgeFatalError &&
        err.status === 404 &&
        onEnvironmentLost
      ) {
        // If credentials have already been refreshed by a concurrent
        // reconnection (e.g. WS close handler), the stale poll's error
        // is expected — skip onEnvironmentLost and retry with fresh creds.
        // currentEnvId读取`getCredentials`，供远程桥接会话后续处理使用。
        const currentEnvId = getCredentials().environmentId
        // `envId` 与 `currentEnvId` 不一致时刷新派生状态，避免使用过期结果。
        if (envId !== currentEnvId) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:repl] Stale poll error for old env=${envId}, current env=${currentEnvId} — skipping onEnvironmentLost`,
          )
          // consecutiveErrors 错误信息更新为 `0`，确保Bridge 通信后续读取最新状态。
          consecutiveErrors = 0
          // firstErrorTime 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
          firstErrorTime = null
          // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
          continue
        }

        // 远程桥接 repl Bridge在这里处理 `environmentRecreations++`，完成这一小步状态转换。
        environmentRecreations++
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Environment deleted, attempting re-registration (attempt ${environmentRecreations}/${MAX_ENVIRONMENT_RECREATIONS})`,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_repl_env_lost', {
          attempt: environmentRecreations,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)

        // 满足 `environmentRecreations > MAX_ENVIRONMENT_RECREATI` 时，远程桥接会话执行该分支。
        if (environmentRecreations > MAX_ENVIRONMENT_RECREATIONS) {
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:repl] Environment re-registration limit reached (${MAX_ENVIRONMENT_RECREATIONS}), giving up`,
          )
          // 远程桥接 repl Bridge在这里处理 `onStateChange?.(`，完成这一小步状态转换。
          onStateChange?.(
            'failed',
            'Environment deleted and re-registration limit reached',
          )
          // 调用 onFatalError?.()，完成这一处局部操作。
          onFatalError?.()
          // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
          break
        }

        // 调用 onStateChange?.('reconnecting', 'environment lost, recreating session')，完成这一处局部操作。
        onStateChange?.('reconnecting', 'environment lost, recreating session')
        // newCreds 集合保存`onEnvironmentLost`，供远程桥接会话后续处理使用。
        const newCreds = await onEnvironmentLost()
        // doReconnect() makes several sequential network calls (1-5s).
        // If the user triggered teardown during that window, its internal
        // abort checks return false — but we need to re-check here to
        // avoid emitting a spurious 'failed' + onFatalError() during
        // graceful shutdown.
        // 满足 `signal.aborted` 时，远程桥接会话执行该分支。
        if (signal.aborted) break
        // 满足 `newCreds` 时，远程桥接会话执行该分支。
        if (newCreds) {
          // Credentials are updated in the outer scope via
          // reconnectEnvironmentWithSession — getCredentials() will
          // return the fresh values on the next poll iteration.
          // Do NOT reset environmentRecreations here — onEnvLost returning
          // creds only proves we tried to fix it, not that the env is
          // healthy. A successful poll (above) is the reset point; if the
          // new env immediately dies again we still want the limit to fire.
          // consecutiveErrors 错误信息更新为 `0`，确保Bridge 通信后续读取最新状态。
          consecutiveErrors = 0
          // firstErrorTime 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
          firstErrorTime = null
          // 调用 onStateChange?.('ready')，完成这一处局部操作。
          onStateChange?.('ready')
          // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `[bridge:repl] Re-registered environment: ${newCreds.environmentId}`,
          )
          // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
          continue
        }

        // 远程桥接 repl Bridge在这里处理 `onStateChange?.(`，完成这一小步状态转换。
        onStateChange?.(
          'failed',
          'Environment deleted and re-registration failed',
        )
        // 调用 onFatalError?.()，完成这一处局部操作。
        onFatalError?.()
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }

      // Fatal errors (401/403/404/410) — no point retrying
      // 满足 `err instanceof BridgeFatalError` 时，远程桥接会话执行该分支。
      if (err instanceof BridgeFatalError) {
        // isExpiry记录 `isExpiredErrorType` 是否成立，远程桥接会话随后按该结果分支。
        const isExpiry = isExpiredErrorType(err.errorType)
        // isSuppressible记录 `isSuppressible403` 是否成立，远程桥接会话随后按该结果分支。
        const isSuppressible = isSuppressible403(err)
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Fatal poll error: ${err.message} (status=${err.status}, type=${err.errorType ?? 'unknown'})${isSuppressible ? ' (suppressed)' : ''}`,
        )
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_repl_fatal_error', {
          status: err.status,
          error_type:
            err.errorType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
        logForDiagnosticsNoPII(
          isExpiry ? 'info' : 'error',
          'bridge_repl_fatal_error',
          { status: err.status, error_type: err.errorType },
        )
        // Cosmetic 403 errors (e.g., external_poll_sessions scope,
        // environments:manage permission) — suppress user-visible error
        // but always trigger teardown so cleanup runs.
        // isSuppressible缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!isSuppressible) {
          // 远程桥接 repl Bridge在这里处理 `onStateChange?.(`，完成这一小步状态转换。
          onStateChange?.(
            'failed',
            isExpiry
              ? 'session expired · /remote-control to reconnect'
              : err.message,
          )
        }
        // Always trigger teardown — matches bridgeMain.ts where fatalExit=true
        // is unconditional and post-loop cleanup always runs.
        // 调用 onFatalError?.()，完成这一处局部操作。
        onFatalError?.()
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }

      // now记录时间`Date.now`，供远程桥接会话后续处理使用。
      const now = Date.now()

      // Detect system sleep/wake: if the gap since the last poll error
      // greatly exceeds the max backoff delay, the machine likely slept.
      // Reset error tracking so we retry with a fresh budget instead of
      // immediately giving up.
      // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
      if (
        lastPollErrorTime !== null &&
        now - lastPollErrorTime > POLL_ERROR_MAX_DELAY_MS * 2
      ) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Detected system sleep (${Math.round((now - lastPollErrorTime) / 1000)}s gap), resetting poll error budget`,
        )
        // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
        logForDiagnosticsNoPII('info', 'bridge_repl_poll_sleep_detected', {
          gapMs: now - lastPollErrorTime,
        })
        // consecutiveErrors 错误信息更新为 `0`，确保Bridge 通信后续读取最新状态。
        consecutiveErrors = 0
        // firstErrorTime 错误信息更新为 `null`，确保Bridge 通信后续读取最新状态。
        firstErrorTime = null
      }
      // lastPollErrorTime 错误信息更新为 `now`，确保Bridge 通信后续读取最新状态。
      lastPollErrorTime = now

      // 远程桥接 repl Bridge在这里处理 `consecutiveErrors++`，完成这一小步状态转换。
      consecutiveErrors++
      // 满足 `firstErrorTime === null` 时，远程桥接会话执行该分支。
      if (firstErrorTime === null) {
        // firstErrorTime 错误信息更新为 `now`，确保Bridge 通信后续读取最新状态。
        firstErrorTime = now
      }
      // elapsed保存`now - firstErrorTime`，供远程桥接会话远程桥接 repl Bridge后续判断或输出使用。
      const elapsed = now - firstErrorTime
      // httpStatus 集合保存`extractHttpStatus`，供远程桥接会话后续处理使用。
      const httpStatus = extractHttpStatus(err)
      // errMsg保存`describeAxiosError`，供远程桥接会话后续处理使用。
      const errMsg = describeAxiosError(err)
      // wsLabel读取`getWsState?.() ?? 'unknown'`，供后续判断或组装使用。
      const wsLabel = getWsState?.() ?? 'unknown'

      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Poll error (attempt ${consecutiveErrors}, elapsed ${Math.round(elapsed / 1000)}s, ws=${wsLabel}): ${errMsg}`,
      )
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bridge_repl_poll_error', {
        status: httpStatus,
        consecutiveErrors,
        elapsedMs: elapsed,
      } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)

      // Only transition to 'reconnecting' on the first error — stay
      // there until a successful poll (avoid flickering the UI state).
      // 满足 `consecutiveErrors === 1` 时，远程桥接会话执行该分支。
      if (consecutiveErrors === 1) {
        // 调用 onStateChange?.('reconnecting', errMsg)，完成这一处局部操作。
        onStateChange?.('reconnecting', errMsg)
      }

      // Give up after continuous failures
      // 满足 `elapsed >= POLL_ERROR_GIVE_UP_MS` 时，远程桥接会话执行该分支。
      if (elapsed >= POLL_ERROR_GIVE_UP_MS) {
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] Poll failures exceeded ${POLL_ERROR_GIVE_UP_MS / 1000}s (${consecutiveErrors} errors), giving up`,
        )
        // 调用 logForDiagnosticsNoPII，触发远程桥接会话此处需要的副作用。
        logForDiagnosticsNoPII('info', 'bridge_repl_poll_give_up')
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bridge_repl_poll_give_up', {
          consecutiveErrors,
          elapsedMs: elapsed,
          lastStatus: httpStatus,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
        // 调用 onStateChange?.('failed', 'connection to server lost')，完成这一处局部操作。
        onStateChange?.('failed', 'connection to server lost')
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }

      // Exponential backoff: 2s → 4s → 8s → 16s → 32s → 60s (cap)
      // backoff保存`Math.min`，供远程桥接会话后续处理使用。
      const backoff = Math.min(
        POLL_ERROR_INITIAL_DELAY_MS * 2 ** (consecutiveErrors - 1),
        POLL_ERROR_MAX_DELAY_MS,
      )
      // The poll_due heartbeat-loop exit leaves a healthy lease exposed to
      // this backoff path. Heartbeat before each sleep so /poll outages
      // (the VerifyEnvironmentSecretAuth DB path heartbeat was introduced to
      // avoid) don't kill the 300s lease TTL.
      // 满足 `getPollIntervalConfig().non_exclusive_heartbeat_interval_ms > 0` 时，远程桥接会话执行该分支。
      if (getPollIntervalConfig().non_exclusive_heartbeat_interval_ms > 0) {
        // info 命名 `getHeartbeatInfo?.()`，让后续代码直接表达这个值的用途。
        const info = getHeartbeatInfo?.()
        // 满足 `info` 时，远程桥接会话执行该分支。
        if (info) {
          // 保护这一段可能失败的远程桥接会话操作，确保异常能进入相邻错误处理。
          try {
            // 等待 `api.heartbeatWork(` 完成，再继续远程桥接 repl Bridge的异步流程。
            await api.heartbeatWork(
              info.environmentId,
              info.workId,
              info.sessionToken,
            )
          } catch {
            // Best-effort — if heartbeat also fails the lease dies, same as
            // pre-poll_due behavior (where the only heartbeat-loop exits were
            // ones where the lease was already dying).
          }
        }
      }
      // 等待 `sleep(backoff, signal)` 完成，再继续远程桥接 repl Bridge的异步流程。
      await sleep(backoff, signal)
    }
  }

  // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[bridge:repl] Work poll loop ended (aborted=${signal.aborted}) env=${getCredentials().environmentId}`,
  )
}

// Exported for testing only
// 重新导出这一组成员，让远程桥接会话的公共 API 保持集中入口。
export {
  startWorkPollLoop as _startWorkPollLoopForTesting,
  POLL_ERROR_INITIAL_DELAY_MS as _POLL_ERROR_INITIAL_DELAY_MS_ForTesting,
  POLL_ERROR_MAX_DELAY_MS as _POLL_ERROR_MAX_DELAY_MS_ForTesting,
  POLL_ERROR_GIVE_UP_MS as _POLL_ERROR_GIVE_UP_MS_ForTesting,
}
