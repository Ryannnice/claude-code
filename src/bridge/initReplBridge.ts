/**
 * REPL-specific wrapper around initBridgeCore. Owns the parts that read
 * bootstrap state — gates, cwd, session ID, git context, OAuth, title
 * derivation — then delegates to the bootstrap-free core.
 *
 * Split out of replBridge.ts because the sessionStorage import
 * (getCurrentSessionTitle) transitively pulls in src/commands.ts → the
 * entire slash command + React component tree (~1300 modules). Keeping
 * initBridgeCore in a file that doesn't touch sessionStorage lets
 * daemonBridge.ts import the core without bloating the Agent SDK bundle.
 *
 * Called via dynamic import by useReplBridge (auto-start) and print.ts
 * (SDK -p mode via query.enableRemoteControl).
 */

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 hostname，将 os 中已经封装好的能力接到本文件流程里。
import { hostname } from 'os'
// 引入 getOriginalCwd、getSessionId，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd, getSessionId } from '../bootstrap/state.js'
// 类型依赖 { SDKMessage } 来自 ../entrypoints/agentSdkTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKMessage } from '../entrypoints/agentSdkTypes.js'
// 类型依赖 { SDKControlResponse } 来自 ../entrypoints/sdk/controlTypes.js，用于校准远程桥接会话的数据契约。
import type { SDKControlResponse } from '../entrypoints/sdk/controlTypes.js'
// 接入 getFeatureValue_CACHED_WITH_REFRESH 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_WITH_REFRESH } from '../services/analytics/growthbook.js'
// 接入 getOrganizationUUID 服务层能力，把外部通信或共享状态交给 ../services/oauth/client.js 处理。
import { getOrganizationUUID } from '../services/oauth/client.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  isPolicyAllowed,
  waitForPolicyLimitsToLoad,
} from '../services/policyLimits/index.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准远程桥接会话的数据契约。
import type { Message } from '../types/message.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
  handleOAuth401Error,
} from '../utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 复用 stripDisplayTagsAllowEmpty 工具函数，把通用处理留在 ../utils/displayTags.js 中维护。
import { stripDisplayTagsAllowEmpty } from '../utils/displayTags.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../utils/errors.js 中维护。
import { errorMessage } from '../utils/errors.js'
// 复用 getBranch、getRemoteUrl 工具函数，把通用处理留在 ../utils/git.js 中维护。
import { getBranch, getRemoteUrl } from '../utils/git.js'
// 复用 toSDKMessages 工具函数，把通用处理留在 ../utils/messages/mappers.js 中维护。
import { toSDKMessages } from '../utils/messages/mappers.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  getContentText,
  getMessagesAfterCompactBoundary,
  isSyntheticMessage,
} from '../utils/messages.js'
// 类型依赖 { PermissionMode } 来自 ../utils/permissions/PermissionMode.js，用于校准远程桥接会话的数据契约。
import type { PermissionMode } from '../utils/permissions/PermissionMode.js'
// 复用 getCurrentSessionTitle 工具函数，把通用处理留在 ../utils/sessionStorage.js 中维护。
import { getCurrentSessionTitle } from '../utils/sessionStorage.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  extractConversationText,
  generateSessionTitle,
} from '../utils/sessionTitle.js'
// 复用 generateShortWordSlug 工具函数，把通用处理留在 ../utils/words.js 中维护。
import { generateShortWordSlug } from '../utils/words.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  getBridgeAccessToken,
  getBridgeBaseUrl,
  getBridgeTokenOverride,
} from './bridgeConfig.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  checkBridgeMinVersion,
  isBridgeEnabledBlocking,
  isCseShimEnabled,
  isEnvLessBridgeEnabled,
} from './bridgeEnabled.js'
// 整理这一组导入，让远程桥接会话后续逻辑可以直接复用这些外部能力。
import {
  archiveBridgeSession,
  createBridgeSession,
  updateBridgeSessionTitle,
} from './createSession.js'
// 引入 logBridgeSkip，将 ./debugUtils.js 中已经封装好的能力接到本文件流程里。
import { logBridgeSkip } from './debugUtils.js'
// 引入 checkEnvLessBridgeMinVersion，将 ./envLessBridgeConfig.js 中已经封装好的能力接到本文件流程里。
import { checkEnvLessBridgeMinVersion } from './envLessBridgeConfig.js'
// 引入 getPollIntervalConfig，将 ./pollConfig.js 中已经封装好的能力接到本文件流程里。
import { getPollIntervalConfig } from './pollConfig.js'
// 类型依赖 { BridgeState, ReplBridgeHandle } 来自 ./replBridge.js，用于校准远程桥接会话的数据契约。
import type { BridgeState, ReplBridgeHandle } from './replBridge.js'
// 引入 initBridgeCore，将 ./replBridge.js 中已经封装好的能力接到本文件流程里。
import { initBridgeCore } from './replBridge.js'
// 引入 setCseShimGate，将 ./sessionIdCompat.js 中已经封装好的能力接到本文件流程里。
import { setCseShimGate } from './sessionIdCompat.js'
// 类型依赖 { BridgeWorkerType } 来自 ./types.js，用于校准远程桥接会话的数据契约。
import type { BridgeWorkerType } from './types.js'

// InitBridgeOptions 固化远程桥接会话里传递的数据形状，帮助调用方按同一结构读写字段。
export type InitBridgeOptions = {
  onInboundMessage?: (msg: SDKMessage) => void | Promise<void>
  onPermissionResponse?: (response: SDKControlResponse) => void
  onInterrupt?: () => void
  onSetModel?: (model: string | undefined) => void
  // 这个回调绑定到 onSetMaxThinkingTokens?: (maxTokens: number | null) => void，负责远程桥接会话在该局部场景下的响应。
  onSetMaxThinkingTokens?: (maxTokens: number | null) => void
  // 远程桥接 init Repl Bridge在这里处理 `onSetPermissionMode?: (`，完成这一小步状态转换。
  onSetPermissionMode?: (
    mode: PermissionMode,
  ) => { ok: true } | { ok: false; error: string }
  // 这个回调绑定到 onStateChange?: (state: BridgeState, detail?: string) => void，负责远程桥接会话在该局部场景下的响应。
  onStateChange?: (state: BridgeState, detail?: string) => void
  initialMessages?: Message[]
  // Explicit session name from `/remote-control <name>`. When set, overrides
  // the title derived from the conversation or /rename.
  initialName?: string
  // Fresh view of the full conversation at call time. Used by onUserMessage's
  // count-3 derivation to call generateSessionTitle over the full conversation.
  // Optional — print.ts's SDK enableRemoteControl path has no REPL message
  // array; count-3 falls back to the single message text when absent.
  // 这个回调绑定到 getMessages?: () => Message[]，负责远程桥接会话在该局部场景下的响应。
  getMessages?: () => Message[]
  // UUIDs already flushed in a prior bridge session. Messages with these
  // UUIDs are excluded from the initial flush to avoid poisoning the
  // server (duplicate UUIDs across sessions cause the WS to be killed).
  // Mutated in place — newly flushed UUIDs are added after each flush.
  previouslyFlushedUUIDs?: Set<string>
  /** See BridgeCoreParams.perpetual. */
  perpetual?: boolean
  /**
   * When true, the bridge only forwards events outbound (no SSE inbound
   * stream). Used by CCR mirror mode — local sessions visible on claude.ai
   * without enabling inbound control.
   */
  outboundOnly?: boolean
  tags?: string[]
}

// initReplBridge 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initReplBridge(
  options?: InitBridgeOptions,
): Promise<ReplBridgeHandle | null> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onInboundMessage,
    onPermissionResponse,
    onInterrupt,
    onSetModel,
    onSetMaxThinkingTokens,
    onSetPermissionMode,
    onStateChange,
    initialMessages,
    getMessages,
    previouslyFlushedUUIDs,
    initialName,
    perpetual,
    outboundOnly,
    tags,
  } = options ?? {}

  // Wire the cse_ shim kill switch so toCompatSessionId respects the
  // GrowthBook gate. Daemon/SDK paths skip this — shim defaults to active.
  // setCseShimGate 写入新的状态值，使远程桥接会话后续读取保持一致。
  setCseShimGate(isCseShimEnabled)

  // 1. Runtime gate
  // 满足 `!(await isBridgeEnabledBlocking())` 时，远程桥接会话执行该分支。
  if (!(await isBridgeEnabledBlocking())) {
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('not_enabled', '[bridge:repl] Skipping: bridge not enabled')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 1b. Minimum version check — deferred to after the v1/v2 branch below,
  // since each implementation has its own floor (tengu_bridge_min_version
  // for v1, tengu_bridge_repl_v2_config.min_version for v2).

  // 2. Check OAuth — must be signed in with claude.ai. Runs before the
  // policy check so console-auth users get the actionable "/login" hint
  // instead of a misleading policy error from a stale/wrong-org cache.
  // 满足 `!getBridgeAccessToken()` 时，远程桥接会话执行该分支。
  if (!getBridgeAccessToken()) {
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('no_oauth', '[bridge:repl] Skipping: no OAuth tokens')
    // 调用 onStateChange?.('failed', '/login')，完成这一处局部操作。
    onStateChange?.('failed', '/login')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // 3. Check organization policy — remote control may be disabled
  // 等待 `waitForPolicyLimitsToLoad()` 完成，再继续远程桥接 init Repl Bridge的异步流程。
  await waitForPolicyLimitsToLoad()
  // 满足 `!isPolicyAllowed('allow_remote_control')` 时，远程桥接会话执行该分支。
  if (!isPolicyAllowed('allow_remote_control')) {
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip(
      'policy_denied',
      '[bridge:repl] Skipping: allow_remote_control policy not allowed',
    )
    // 调用 onStateChange?.('failed', "disabled by your organization's policy")，完成这一处局部操作。
    onStateChange?.('failed', "disabled by your organization's policy")
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // When CLAUDE_BRIDGE_OAUTH_TOKEN is set (ant-only local dev), the bridge
  // uses that token directly via getBridgeAccessToken() — keychain state is
  // irrelevant. Skip 2b/2c to preserve that decoupling: an expired keychain
  // token shouldn't block a bridge connection that doesn't use it.
  // 满足 `!getBridgeTokenOverride()` 时，远程桥接会话执行该分支。
  if (!getBridgeTokenOverride()) {
    // 2a. Cross-process backoff. If N prior processes already saw this exact
    // dead token (matched by expiresAt), skip silently — no event, no refresh
    // attempt. The count threshold tolerates transient refresh failures (auth
    // server 5xx, lockfile errors per auth.ts:1437/1444/1485): each process
    // independently retries until 3 consecutive failures prove the token dead.
    // Mirrors useReplBridge's MAX_CONSECUTIVE_INIT_FAILURES for in-process.
    // The expiresAt key is content-addressed: /login → new token → new expiresAt
    // → this stops matching without any explicit clear.
    // cfg读取`getGlobalConfig`，供远程桥接会话后续处理使用。
    const cfg = getGlobalConfig()
    // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
    if (
      cfg.bridgeOauthDeadExpiresAt != null &&
      (cfg.bridgeOauthDeadFailCount ?? 0) >= 3 &&
      getClaudeAIOAuthTokens()?.expiresAt === cfg.bridgeOauthDeadExpiresAt
    ) {
      // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[bridge:repl] Skipping: cross-process backoff (dead token seen ${cfg.bridgeOauthDeadFailCount} times)`,
      )
      // 返回 `null`，作为远程桥接会话这次计算的结果。
      return null
    }

    // 2b. Proactively refresh if expired. Mirrors bridgeMain.ts:2096 — the REPL
    // bridge fires at useEffect mount BEFORE any v1/messages call, making this
    // usually the first OAuth request of the session. Without this, ~9% of
    // registrations hit the server with a >8h-expired token → 401 → withOAuthRetry
    // recovers, but the server logs a 401 we can avoid. VPN egress IPs observed
    // at 30:1 401:200 when many unrelated users cluster at the 8h TTL boundary.
    //
    // Fresh-token cost: one memoized read + one Date.now() comparison (~µs).
    // checkAndRefreshOAuthTokenIfNeeded clears its own cache in every path that
    // touches the keychain (refresh success, lockfile race, throw), so no
    // explicit clearOAuthTokenCache() here — that would force a blocking
    // keychain spawn on the 91%+ fresh-token path.
    // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续远程桥接 init Repl Bridge的异步流程。
    await checkAndRefreshOAuthTokenIfNeeded()

    // 2c. Skip if token is still expired post-refresh-attempt. Env-var / FD
    // tokens (auth.ts:894-917) have expiresAt=null → never trip this. But a
    // keychain token whose refresh token is dead (password change, org left,
    // token GC'd) has expiresAt<now AND refresh just failed — the client would
    // otherwise loop 401 forever: withOAuthRetry → handleOAuth401Error →
    // refresh fails again → retry with same stale token → 401 again.
    // Datadog 2026-03-08: single IPs generating 2,879 such 401s/day. Skip the
    // guaranteed-fail API call; useReplBridge surfaces the failure.
    //
    // Intentionally NOT using isOAuthTokenExpired here — that has a 5-minute
    // proactive-refresh buffer, which is the right heuristic for "should
    // refresh soon" but wrong for "provably unusable". A token with 3min left
    // + transient refresh endpoint blip (5xx/timeout/wifi-reconnect) would
    // falsely trip a buffered check; the still-valid token would connect fine.
    // Check actual expiry instead: past-expiry AND refresh-failed → truly dead.
    // token 列表读取`getClaudeAIOAuthTokens`，供远程桥接会话后续处理使用。
    const tokens = getClaudeAIOAuthTokens()
    // `tokens && tokens.expiresAt` 与 `null && tokens.expiresAt <= Dat...` 不一致时刷新派生状态，避免使用过期结果。
    if (tokens && tokens.expiresAt !== null && tokens.expiresAt <= Date.now()) {
      // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
      logBridgeSkip(
        'oauth_expired_unrefreshable',
        '[bridge:repl] Skipping: OAuth token expired and refresh failed (re-login required)',
      )
      // 调用 onStateChange?.('failed', '/login')，完成这一处局部操作。
      onStateChange?.('failed', '/login')
      // Persist for the next process. Increments failCount when re-discovering
      // the same dead token (matched by expiresAt); resets to 1 for a different
      // token. Once count reaches 3, step 2a's early-return fires and this path
      // is never reached again — writes are capped at 3 per dead token.
      // Local const captures the narrowed type (closure loses !==null narrowing).
      // deadExpiresAt保存`tokens.expiresAt`，供远程桥接会话远程桥接 init Repl Bridge后续判断或输出使用。
      const deadExpiresAt = tokens.expiresAt
      // 调用 saveGlobalConfig，触发远程桥接会话此处需要的副作用。
      saveGlobalConfig(c => ({
        ...c,
        bridgeOauthDeadExpiresAt: deadExpiresAt,
        bridgeOauthDeadFailCount:
          c.bridgeOauthDeadExpiresAt === deadExpiresAt
            ? (c.bridgeOauthDeadFailCount ?? 0) + 1
            : 1,
      }))
      // 返回 `null`，作为远程桥接会话这次计算的结果。
      return null
    }
  }

  // 4. Compute baseUrl — needed by both v1 (env-based) and v2 (env-less)
  // paths. Hoisted above the v2 gate so both can use it.
  // baseUrl读取`getBridgeBaseUrl`，供远程桥接会话后续处理使用。
  const baseUrl = getBridgeBaseUrl()

  // 5. Derive session title. Precedence: explicit initialName → /rename
  // (session storage) → last meaningful user message → generated slug.
  // Cosmetic only (claude.ai session list); the model never sees it.
  // Two flags: `hasExplicitTitle` (initialName or /rename — never auto-
  // overwrite) vs. `hasTitle` (any title, including auto-derived — blocks
  // the count-1 re-derivation but not count-3). The onUserMessage callback
  // (wired to both v1 and v2 below) derives from the 1st prompt and again
  // from the 3rd so mobile/web show a title that reflects more context.
  // The slug fallback (e.g. "remote-control-graceful-unicorn") makes
  // auto-started sessions distinguishable in the claude.ai list before the
  // first prompt.
  // title 标题保存`generateShortWordSlug`，供远程桥接会话后续处理使用。
  let title = `remote-control-${generateShortWordSlug()}`
  // hasTitle 标题标记远程桥接会话远程桥接 init Repl Bridge是否启用对应路径。
  let hasTitle = false
  // hasExplicitTitle 标题标记远程桥接会话远程桥接 init Repl Bridge是否启用对应路径。
  let hasExplicitTitle = false
  // 满足 `initialName` 时，远程桥接会话执行该分支。
  if (initialName) {
    // title 标题更新为 `initialName`，确保Bridge 通信后续读取最新状态。
    title = initialName
    // hasTitle 标题更新为 `true`，确保Bridge 通信后续读取最新状态。
    hasTitle = true
    // hasExplicitTitle 标题更新为 `true`，确保Bridge 通信后续读取最新状态。
    hasExplicitTitle = true
  } else {
    // sessionId 会话数据读取`getSessionId`，供远程桥接会话后续处理使用。
    const sessionId = getSessionId()
    // customTitle 标题 命名 `sessionId`，让后续代码直接表达这个值的用途。
    const customTitle = sessionId
      ? getCurrentSessionTitle(sessionId)
      : undefined
    // 满足 `customTitle` 时，远程桥接会话执行该分支。
    if (customTitle) {
      // title 标题更新为 `customTitle`，确保Bridge 通信后续读取最新状态。
      title = customTitle
      // hasTitle 标题更新为 `true`，确保Bridge 通信后续读取最新状态。
      hasTitle = true
      // hasExplicitTitle 标题更新为 `true`，确保Bridge 通信后续读取最新状态。
      hasExplicitTitle = true
    // 远程桥接 init Repl Bridge在这里处理 `} else if (initialMessages && initialMessages.length > 0) {`，完成这一小步状态转换。
    } else if (initialMessages && initialMessages.length > 0) {
      // Find the last user message that has meaningful content. Skip meta
      // (nudges), tool results, compact summaries ("This session is being
      // continued…"), non-human origins (task notifications, channel pushes),
      // and synthetic interrupts ([Request interrupted by user]) — none are
      // human-authored. Same filter as extractTitleText + isSyntheticMessage.
      // 循环处理 `let i = initialMessages.length - 1; i >= 0; i--`，让远程桥接会话逐项把同类条目按顺序走完。
      for (let i = initialMessages.length - 1; i >= 0; i--) {
        // 消息读取 `initialMessages[i]!` 对应条目，后续围绕该成员继续处理。
        const msg = initialMessages[i]!
        // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
        if (
          msg.type !== 'user' ||
          msg.isMeta ||
          msg.toolUseResult ||
          msg.isCompactSummary ||
          (msg.origin && msg.origin.kind !== 'human') ||
          isSyntheticMessage(msg)
        )
          // 跳过当前项，继续处理远程桥接会话中的下一轮循环。
          continue
        // rawContent读取`getContentText`，供远程桥接会话后续处理使用。
        const rawContent = getContentText(msg.message.content)
        // rawContent缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!rawContent) continue
        // derived保存`deriveTitle`，供远程桥接会话后续处理使用。
        const derived = deriveTitle(rawContent)
        // derived缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
        if (!derived) continue
        // title 标题更新为 `derived`，确保Bridge 通信后续读取最新状态。
        title = derived
        // hasTitle 标题更新为 `true`，确保Bridge 通信后续读取最新状态。
        hasTitle = true
        // 结束这个分支或循环，避免远程桥接会话继续落入后续路径。
        break
      }
    }
  }

  // Shared by both v1 and v2 — fires on every title-worthy user message until
  // it returns true. At count 1: deriveTitle placeholder immediately, then
  // generateSessionTitle (Haiku, sentence-case) fire-and-forget upgrade. At
  // count 3: re-generate over the full conversation. Skips entirely if the
  // title is explicit (/remote-control <name> or /rename) — re-checks
  // sessionStorage at call time so /rename between messages isn't clobbered.
  // Skips count 1 if initialMessages already derived (that title is fresh);
  // still refreshes at count 3. v2 passes cse_*; updateBridgeSessionTitle
  // retags internally.
  // userMessageCount 消息数据保存`0`，供后续判断或组装使用。
  let userMessageCount = 0
  // lastBridgeSessionId 会话数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastBridgeSessionId: string | undefined
  // genSeq 命名 `0`，让后续代码直接表达这个值的用途。
  let genSeq = 0
  // patch保存`(`，供远程桥接会话远程桥接 init Repl Bridge后续判断或输出使用。
  const patch = (
    derived: string,
    bridgeSessionId: string,
    atCount: number,
  ): void => {
    // hasTitle 标题更新为 `true`，确保Bridge 通信后续读取最新状态。
    hasTitle = true
    // title 标题更新为 `derived`，确保Bridge 通信后续读取最新状态。
    title = derived
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[bridge:repl] derived title from message ${atCount}: ${derived}`,
    )
    // 显式忽略 `updateBridgeSessionTitle(bridgeSessionId, derived, {` 的返回值，只保留它触发的副作用。
    void updateBridgeSessionTitle(bridgeSessionId, derived, {
      baseUrl,
      getAccessToken: getBridgeAccessToken,
    // 这个回调绑定到 }).catch(() => {})，负责远程桥接会话在该局部场景下的响应。
    }).catch(() => {})
  }
  // Fire-and-forget Haiku generation with post-await guards. Re-checks /rename
  // (sessionStorage), v1 env-lost (lastBridgeSessionId), and same-session
  // out-of-order resolution (genSeq — count-1's Haiku resolving after count-3
  // would clobber the richer title). generateSessionTitle never rejects.
  // generateAndPatch封装成回调，供远程桥接会话远程桥接 init Repl Bridge在事件触发或异步步骤中调用。
  const generateAndPatch = (input: string, bridgeSessionId: string): void => {
    // gen 命名 `++genSeq`，让后续代码直接表达这个值的用途。
    const gen = ++genSeq
    // atCount 数量保存`userMessageCount`，供远程桥接会话远程桥接 init Repl Bridge后续判断或输出使用。
    const atCount = userMessageCount
    // 显式忽略 `generateSessionTitle(input, AbortSignal.timeout(15_000)).then(` 的返回值，只保留它触发的副作用。
    void generateSessionTitle(input, AbortSignal.timeout(15_000)).then(
      // generated更新为 `> {`，确保Bridge 通信后续读取最新状态。
      generated => {
        // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
        if (
          generated &&
          gen === genSeq &&
          lastBridgeSessionId === bridgeSessionId &&
          !getCurrentSessionTitle(getSessionId())
        ) {
          // 调用 patch，触发远程桥接会话此处需要的副作用。
          patch(generated, bridgeSessionId, atCount)
        }
      },
    )
  }
  // onUserMessage 消息数据封装成回调，供远程桥接会话远程桥接 init Repl Bridge在事件触发或异步步骤中调用。
  const onUserMessage = (text: string, bridgeSessionId: string): boolean => {
    // 组合条件 `hasExplicitTitle || getCurrentSessionTitle(getSessionId())` 成立时，远程桥接会话才启用这条专门路径。
    if (hasExplicitTitle || getCurrentSessionTitle(getSessionId())) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // v1 env-lost re-creates the session with a new ID. Reset the count so
    // the new session gets its own count-3 derivation; hasTitle stays true
    // (new session was created via getCurrentTitle(), which reads the count-1
    // title from this closure), so count-1 of the fresh cycle correctly skips.
    // 远程桥接会话在这里进入条件判断，后续代码按实际状态分流。
    if (
      lastBridgeSessionId !== undefined &&
      lastBridgeSessionId !== bridgeSessionId
    ) {
      // userMessageCount 消息数据更新为 `0`，确保Bridge 通信后续读取最新状态。
      userMessageCount = 0
    }
    // lastBridgeSessionId 会话数据更新为 `bridgeSessionId`，确保Bridge 通信后续读取最新状态。
    lastBridgeSessionId = bridgeSessionId
    // 远程桥接 init Repl Bridge在这里处理 `userMessageCount++`，完成这一小步状态转换。
    userMessageCount++
    // 组合条件 `userMessageCount === 1 && !hasTitle` 成立时，远程桥接会话才启用这条专门路径。
    if (userMessageCount === 1 && !hasTitle) {
      // placeholder保存`deriveTitle`，供远程桥接会话后续处理使用。
      const placeholder = deriveTitle(text)
      // 满足 `placeholder) patch(placeholder, bridgeSessionId, userMessageCount` 时，远程桥接会话执行该分支。
      if (placeholder) patch(placeholder, bridgeSessionId, userMessageCount)
      // 调用 generateAndPatch，触发远程桥接会话此处需要的副作用。
      generateAndPatch(text, bridgeSessionId)
    // 远程桥接 init Repl Bridge在这里处理 `} else if (userMessageCount === 3) {`，完成这一小步状态转换。
    } else if (userMessageCount === 3) {
      // msgs 集合 命名 `getMessages?.()`，让后续代码直接表达这个值的用途。
      const msgs = getMessages?.()
      // 用户输入 命名 `msgs`，让后续代码直接表达这个值的用途。
      const input = msgs
        ? extractConversationText(getMessagesAfterCompactBoundary(msgs))
        : text
      // 调用 generateAndPatch，触发远程桥接会话此处需要的副作用。
      generateAndPatch(input, bridgeSessionId)
    }
    // Also re-latches if v1 env-lost resets the transport's done flag past 3.
    // 返回 `userMessageCount >= 3`，作为远程桥接会话这次计算的结果。
    return userMessageCount >= 3
  }

  // initialHistoryCap读取`getFeatureValue_CACHED_WITH_REFRESH`，供远程桥接会话后续处理使用。
  const initialHistoryCap = getFeatureValue_CACHED_WITH_REFRESH(
    'tengu_bridge_initial_history_cap',
    200,
    5 * 60 * 1000,
  )

  // Fetch orgUUID before the v1/v2 branch — both paths need it. v1 for
  // environment registration; v2 for archive (which lives at the compat
  // /v1/sessions/{id}/archive, not /v1/code/sessions). Without it, v2
  // archive 404s and sessions stay alive in CCR after /exit.
  // orgUUID读取`getOrganizationUUID`，供远程桥接会话后续处理使用。
  const orgUUID = await getOrganizationUUID()
  // orgUUID缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!orgUUID) {
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('no_org_uuid', '[bridge:repl] Skipping: no org UUID')
    // 调用 onStateChange?.('failed', '/login')，完成这一处局部操作。
    onStateChange?.('failed', '/login')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // ── GrowthBook gate: env-less bridge ──────────────────────────────────
  // When enabled, skips the Environments API layer entirely (no register/
  // poll/ack/heartbeat) and connects directly via POST /bridge → worker_jwt.
  // See server PR #292605 (renamed in #293280). REPL-only — daemon/print stay
  // on env-based.
  //
  // NAMING: "env-less" is distinct from "CCR v2" (the /worker/* transport).
  // The env-based path below can ALSO use CCR v2 via CLAUDE_CODE_USE_CCR_V2.
  // tengu_bridge_repl_v2 gates env-less (no poll loop), not transport version.
  //
  // perpetual (assistant-mode session continuity via bridge-pointer.json) is
  // env-coupled and not yet implemented here — fall back to env-based when set
  // so KAIROS users don't silently lose cross-restart continuity.
  // 组合条件 `isEnvLessBridgeEnabled() && !perpetual` 成立时，远程桥接会话才启用这条专门路径。
  if (isEnvLessBridgeEnabled() && !perpetual) {
    // versionError 错误信息读取`checkEnvLessBridgeMinVersion`，供远程桥接会话后续处理使用。
    const versionError = await checkEnvLessBridgeMinVersion()
    // 满足 `versionError` 时，远程桥接会话执行该分支。
    if (versionError) {
      // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
      logBridgeSkip(
        'version_too_old',
        `[bridge:repl] Skipping: ${versionError}`,
        true,
      )
      // 调用 onStateChange?.('failed', 'run `claude update` to upgrade')，完成这一处局部操作。
      onStateChange?.('failed', 'run `claude update` to upgrade')
      // 返回 `null`，作为远程桥接会话这次计算的结果。
      return null
    }
    // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      '[bridge:repl] Using env-less bridge path (tengu_bridge_repl_v2)',
    )
    // 从 `await import('./remoteBridgeCore.js')` 解构 initEnvLessBridgeCore，减少远程桥接 init Repl Bridge对同一对象的重复访问。
    const { initEnvLessBridgeCore } = await import('./remoteBridgeCore.js')
    // 返回 `initEnvLessBridgeCore({`，作为远程桥接会话这次计算的结果。
    return initEnvLessBridgeCore({
      baseUrl,
      orgUUID,
      title,
      getAccessToken: getBridgeAccessToken,
      onAuth401: handleOAuth401Error,
      toSDKMessages,
      initialHistoryCap,
      initialMessages,
      // v2 always creates a fresh server session (new cse_* id), so
      // previouslyFlushedUUIDs is not passed — there's no cross-session
      // UUID collision risk, and the ref persists across enable→disable→
      // re-enable cycles which would cause the new session to receive zero
      // history (all UUIDs already in the set from the prior enable).
      // v1 handles this by calling previouslyFlushedUUIDs.clear() on fresh
      // session creation (replBridge.ts:768); v2 skips the param entirely.
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
    })
  }

  // ── v1 path: env-based (register/poll/ack/heartbeat) ──────────────────

  // versionError 错误信息读取`checkBridgeMinVersion`，供远程桥接会话后续处理使用。
  const versionError = checkBridgeMinVersion()
  // 满足 `versionError` 时，远程桥接会话执行该分支。
  if (versionError) {
    // 调用 logBridgeSkip，触发远程桥接会话此处需要的副作用。
    logBridgeSkip('version_too_old', `[bridge:repl] Skipping: ${versionError}`)
    // 调用 onStateChange?.('failed', 'run `claude update` to upgrade')，完成这一处局部操作。
    onStateChange?.('failed', 'run `claude update` to upgrade')
    // 返回 `null`，作为远程桥接会话这次计算的结果。
    return null
  }

  // Gather git context — this is the bootstrap-read boundary.
  // Everything from here down is passed explicitly to bridgeCore.
  // branch读取`getBranch`，供远程桥接会话后续处理使用。
  const branch = await getBranch()
  // gitRepoUrl读取`getRemoteUrl`，供远程桥接会话后续处理使用。
  const gitRepoUrl = await getRemoteUrl()
  // sessionIngressUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const sessionIngressUrl =
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_BRIDGE_SESSION_INGRESS_URL
      ? process.env.CLAUDE_BRIDGE_SESSION_INGRESS_URL
      : baseUrl

  // Assistant-mode sessions advertise a distinct worker_type so the web UI
  // can filter them into a dedicated picker. KAIROS guard keeps the
  // assistant module out of external builds entirely.
  // workerType固定为 `'claude_code'`，作为远程桥接 init Repl Bridge后续展示或比较的基准。
  let workerType: BridgeWorkerType = 'claude_code'
  // 满足 `feature('KAIROS')` 时，远程桥接会话执行该分支。
  if (feature('KAIROS')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    // 远程桥接 init Repl Bridge先整理这一处局部数据，后续分支可以直接读取。
    const { isAssistantMode } =
      require('../assistant/index.js') as typeof import('../assistant/index.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    // 满足 `isAssistantMode()` 时，远程桥接会话执行该分支。
    if (isAssistantMode()) {
      // workerType更新为 `'claude_code_assistant'`，确保Bridge 通信后续读取最新状态。
      workerType = 'claude_code_assistant'
    }
  }

  // 6. Delegate. BridgeCoreHandle is a structural superset of
  // ReplBridgeHandle (adds writeSdkMessages which REPL callers don't use),
  // so no adapter needed — just the narrower type on the way out.
  // 返回 `initBridgeCore({`，作为远程桥接会话这次计算的结果。
  return initBridgeCore({
    dir: getOriginalCwd(),
    machineName: hostname(),
    branch,
    gitRepoUrl,
    title,
    baseUrl,
    sessionIngressUrl,
    workerType,
    getAccessToken: getBridgeAccessToken,
    // 这个回调绑定到 createSession: opts =>，负责远程桥接会话在该局部场景下的响应。
    createSession: opts =>
      createBridgeSession({
        ...opts,
        events: [],
        baseUrl,
        getAccessToken: getBridgeAccessToken,
      }),
    // 这个回调绑定到 archiveSession: sessionId =>，负责远程桥接会话在该局部场景下的响应。
    archiveSession: sessionId =>
      archiveBridgeSession(sessionId, {
        baseUrl,
        getAccessToken: getBridgeAccessToken,
        // gracefulShutdown.ts:407 races runCleanupFunctions against 2s.
        // Teardown also does stopWork (parallel) + deregister (sequential),
        // so archive can't have the full budget. 1.5s matches v2's
        // teardown_archive_timeout_ms default.
        timeoutMs: 1500,
      // 这个回调绑定到 }).catch((err: unknown) => {，负责远程桥接会话在该局部场景下的响应。
      }).catch((err: unknown) => {
        // archiveBridgeSession has no try/catch — 5xx/timeout/network throw
        // straight through. Previously swallowed silently, making archive
        // failures BQ-invisible and undiagnosable from debug logs.
        // 记录远程桥接会话运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[bridge:repl] archiveBridgeSession threw: ${errorMessage(err)}`,
          { level: 'error' },
        )
      }),
    // getCurrentTitle is read on reconnect-after-env-lost to re-title the new
    // session. /rename writes to session storage; onUserMessage mutates
    // `title` directly — both paths are picked up here.
    // 这个回调绑定到 getCurrentTitle: () => getCurrentSessionTitle(getSessionId()) ?? title,，负责远程桥接会话在该局部场景下的响应。
    getCurrentTitle: () => getCurrentSessionTitle(getSessionId()) ?? title,
    onUserMessage,
    toSDKMessages,
    onAuth401: handleOAuth401Error,
    getPollIntervalConfig,
    initialHistoryCap,
    initialMessages,
    previouslyFlushedUUIDs,
    onInboundMessage,
    onPermissionResponse,
    onInterrupt,
    onSetModel,
    onSetMaxThinkingTokens,
    onSetPermissionMode,
    onStateChange,
    perpetual,
  })
}

// TITLE_MAX_LEN 标题保存`50`，供远程桥接会话远程桥接 init Repl Bridge后续判断或输出使用。
const TITLE_MAX_LEN = 50

/**
 * Quick placeholder title: strip display tags, take the first sentence,
 * collapse whitespace, truncate to 50 chars. Returns undefined if the result
 * is empty (e.g. message was only <local-command-stdout>). Replaced by
 * generateSessionTitle once Haiku resolves (~1-15s).
 */
// deriveTitle 封装Bridge 通信的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function deriveTitle(raw: string): string | undefined {
  // Strip <ide_opened_file>, <session-start-hook>, etc. — these appear in
  // user messages when IDE/hooks inject context. stripDisplayTagsAllowEmpty
  // returns '' (not the original) so pure-tag messages are skipped.
  // clean保存`stripDisplayTagsAllowEmpty`，供远程桥接会话后续处理使用。
  const clean = stripDisplayTagsAllowEmpty(raw)
  // First sentence is usually the intent; rest is often context/detail.
  // Capture group instead of lookbehind — keeps YARR JIT happy.
  // firstSentence保存`exec`，供远程桥接会话后续处理使用。
  const firstSentence = /^(.*?[.!?])\s/.exec(clean)?.[1] ?? clean
  // Collapse newlines/tabs — titles are single-line in the claude.ai list.
  // flat格式化`firstSentence.replace`，供远程桥接会话后续处理使用。
  const flat = firstSentence.replace(/\s+/g, ' ').trim()
  // flat缺失时提前走兜底路径，避免远程桥接会话继续依赖无效输入。
  if (!flat) return undefined
  // 返回 `flat.length > TITLE_MAX_LEN`，作为远程桥接会话这次计算的结果。
  return flat.length > TITLE_MAX_LEN
    ? flat.slice(0, TITLE_MAX_LEN - 1) + '\u2026'
    : flat
}
