// 类型依赖 { BetaMessageStreamParams } 来自 @anthropic-ai/sdk/resources/beta/messages/messages.mjs，用于校准state的数据契约。
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 类型依赖 { Attributes, Meter, MetricOptions } 来自 @opentelemetry/api，用于校准state的数据契约。
import type { Attributes, Meter, MetricOptions } from '@opentelemetry/api'
// 类型依赖 { logs } 来自 @opentelemetry/api-logs，用于校准state的数据契约。
import type { logs } from '@opentelemetry/api-logs'
// 类型依赖 { LoggerProvider } 来自 @opentelemetry/sdk-logs，用于校准state的数据契约。
import type { LoggerProvider } from '@opentelemetry/sdk-logs'
// 类型依赖 { MeterProvider } 来自 @opentelemetry/sdk-metrics，用于校准state的数据契约。
import type { MeterProvider } from '@opentelemetry/sdk-metrics'
// 类型依赖 { BasicTracerProvider } 来自 @opentelemetry/sdk-trace-base，用于校准state的数据契约。
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base'
// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { realpathSync } from 'fs'
// 引入 sumBy，将 lodash-es/sumBy.js 中已经封装好的能力接到本文件流程里。
import sumBy from 'lodash-es/sumBy.js'
// 引入 cwd，将 process 中已经封装好的能力接到本文件流程里。
import { cwd } from 'process'
// 类型依赖 { HookEvent, ModelUsage } 来自 src/entrypoints/agentSdkTypes.js，用于校准state的数据契约。
import type { HookEvent, ModelUsage } from 'src/entrypoints/agentSdkTypes.js'
// 类型依赖 { AgentColorName } 来自 src/tools/AgentTool/agentColorManager.js，用于校准state的数据契约。
import type { AgentColorName } from 'src/tools/AgentTool/agentColorManager.js'
// 类型依赖 { HookCallbackMatcher } 来自 src/types/hooks.js，用于校准state的数据契约。
import type { HookCallbackMatcher } from 'src/types/hooks.js'
// Indirection for browser-sdk build (package.json "browser" field swaps
// crypto.ts for crypto.browser.ts). Pure leaf re-export of node:crypto —
// zero circular-dep risk. Path-alias import bypasses bootstrap-isolation
// (rule only checks ./ and / prefixes); explicit disable documents intent.
// eslint-disable-next-line custom-rules/bootstrap-isolation
// 复用 randomUUID 工具函数，把通用处理留在 src/utils/crypto.js 中维护。
import { randomUUID } from 'src/utils/crypto.js'
// 类型依赖 { ModelSetting } 来自 src/utils/model/model.js，用于校准state的数据契约。
import type { ModelSetting } from 'src/utils/model/model.js'
// 类型依赖 { ModelStrings } 来自 src/utils/model/modelStrings.js，用于校准state的数据契约。
import type { ModelStrings } from 'src/utils/model/modelStrings.js'
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准state的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js'
// 复用 resetSettingsCache 工具函数，把通用处理留在 src/utils/settings/settingsCache.js 中维护。
import { resetSettingsCache } from 'src/utils/settings/settingsCache.js'
// 类型依赖 { PluginHookMatcher } 来自 src/utils/settings/types.js，用于校准state的数据契约。
import type { PluginHookMatcher } from 'src/utils/settings/types.js'
// 复用 createSignal 工具函数，把通用处理留在 src/utils/signal.js 中维护。
import { createSignal } from 'src/utils/signal.js'

// Union type for registered hooks - can be SDK callbacks or native plugin hooks
// RegisteredHookMatcher 固化state里传递的数据形状，帮助调用方按同一结构读写字段。
type RegisteredHookMatcher = HookCallbackMatcher | PluginHookMatcher

// 类型依赖 { SessionId } 来自 src/types/ids.js，用于校准state的数据契约。
import type { SessionId } from 'src/types/ids.js'

// DO NOT ADD MORE STATE HERE - BE JUDICIOUS WITH GLOBAL STATE

// dev: true on entries that came via --dangerously-load-development-channels.
// The allowlist gate checks this per-entry (not the session-wide
// hasDevChannels bit) so passing both flags doesn't let the dev dialog's
// acceptance leak allowlist-bypass to the --channels entries.
// ChannelEntry 固化state里传递的数据形状，帮助调用方按同一结构读写字段。
export type ChannelEntry =
  | { kind: 'plugin'; name: string; marketplace: string; dev?: boolean }
  | { kind: 'server'; name: string; dev?: boolean }

// AttributedCounter 固化state里传递的数据形状，帮助调用方按同一结构读写字段。
export type AttributedCounter = {
  add(value: number, additionalAttributes?: Attributes): void
}

// State 固化state里传递的数据形状，帮助调用方按同一结构读写字段。
type State = {
  originalCwd: string
  // Stable project root - set once at startup (including by --worktree flag),
  // never updated by mid-session EnterWorktreeTool.
  // Use for project identity (history, skills, sessions) not file operations.
  projectRoot: string
  totalCostUSD: number
  totalAPIDuration: number
  totalAPIDurationWithoutRetries: number
  totalToolDuration: number
  turnHookDurationMs: number
  turnToolDurationMs: number
  turnClassifierDurationMs: number
  turnToolCount: number
  turnHookCount: number
  turnClassifierCount: number
  startTime: number
  lastInteractionTime: number
  totalLinesAdded: number
  totalLinesRemoved: number
  hasUnknownModelCost: boolean
  cwd: string
  modelUsage: { [modelName: string]: ModelUsage }
  mainLoopModelOverride: ModelSetting | undefined
  initialMainLoopModel: ModelSetting
  modelStrings: ModelStrings | null
  isInteractive: boolean
  kairosActive: boolean
  // When true, ensureToolResultPairing throws on mismatch instead of
  // repairing with synthetic placeholders. HFI opts in at startup so
  // trajectories fail fast rather than conditioning the model on fake
  // tool_results.
  strictToolResultPairing: boolean
  sdkAgentProgressSummariesEnabled: boolean
  userMsgOptIn: boolean
  clientType: string
  sessionSource: string | undefined
  questionPreviewFormat: 'markdown' | 'html' | undefined
  flagSettingsPath: string | undefined
  flagSettingsInline: Record<string, unknown> | null
  allowedSettingSources: SettingSource[]
  sessionIngressToken: string | null | undefined
  oauthTokenFromFd: string | null | undefined
  apiKeyFromFd: string | null | undefined
  // Telemetry state
  meter: Meter | null
  sessionCounter: AttributedCounter | null
  locCounter: AttributedCounter | null
  prCounter: AttributedCounter | null
  commitCounter: AttributedCounter | null
  costCounter: AttributedCounter | null
  tokenCounter: AttributedCounter | null
  codeEditToolDecisionCounter: AttributedCounter | null
  activeTimeCounter: AttributedCounter | null
  // state在这里处理 `statsStore: { observe(name: string, value: number): void } | null`，完成这一小步状态转换。
  statsStore: { observe(name: string, value: number): void } | null
  sessionId: SessionId
  // Parent session ID for tracking session lineage (e.g., plan mode -> implementation)
  parentSessionId: SessionId | undefined
  // Logger state
  loggerProvider: LoggerProvider | null
  eventLogger: ReturnType<typeof logs.getLogger> | null
  // Meter provider state
  meterProvider: MeterProvider | null
  // Tracer provider state
  tracerProvider: BasicTracerProvider | null
  // Agent color state
  agentColorMap: Map<string, AgentColorName>
  agentColorIndex: number
  // Last API request for bug reports
  lastAPIRequest: Omit<BetaMessageStreamParams, 'messages'> | null
  // Messages from the last API request (ant-only; reference, not clone).
  // Captures the exact post-compaction, CLAUDE.md-injected message set sent
  // to the API so /share's serialized_conversation.json reflects reality.
  lastAPIRequestMessages: BetaMessageStreamParams['messages'] | null
  // Last auto-mode classifier request(s) for /share transcript
  lastClassifierRequests: unknown[] | null
  // CLAUDE.md content cached by context.ts for the auto-mode classifier.
  // Breaks the yoloClassifier → claudemd → filesystem → permissions cycle.
  cachedClaudeMdContent: string | null
  // In-memory error log for recent errors
  inMemoryErrorLog: Array<{ error: string; timestamp: string }>
  // Session-only plugins from --plugin-dir flag
  inlinePlugins: Array<string>
  // Explicit --chrome / --no-chrome flag value (undefined = not set on CLI)
  chromeFlagOverride: boolean | undefined
  // Use cowork_plugins directory instead of plugins (--cowork flag or env var)
  useCoworkPlugins: boolean
  // Session-only bypass permissions mode flag (not persisted)
  sessionBypassPermissionsMode: boolean
  // Session-only flag gating the .claude/scheduled_tasks.json watcher
  // (useScheduledTasks). Set by cronScheduler.start() when the JSON has
  // entries, or by CronCreateTool. Not persisted.
  scheduledTasksEnabled: boolean
  // Session-only cron tasks created via CronCreate with durable: false.
  // Fire on schedule like file-backed tasks but are never written to
  // .claude/scheduled_tasks.json — they die with the process. Typed via
  // SessionCronTask below (not importing from cronTasks.ts keeps
  // bootstrap a leaf of the import DAG).
  sessionCronTasks: SessionCronTask[]
  // Teams created this session via TeamCreate. cleanupSessionTeams()
  // removes these on gracefulShutdown so subagent-created teams don't
  // persist on disk forever (gh-32730). TeamDelete removes entries to
  // avoid double-cleanup. Lives here (not teamHelpers.ts) so
  // resetStateForTests() clears it between tests.
  sessionCreatedTeams: Set<string>
  // Session-only trust flag for home directory (not persisted to disk)
  // When running from home dir, trust dialog is shown but not saved to disk.
  // This flag allows features requiring trust to work during the session.
  sessionTrustAccepted: boolean
  // Session-only flag to disable session persistence to disk
  sessionPersistenceDisabled: boolean
  // Track if user has exited plan mode in this session (for re-entry guidance)
  hasExitedPlanMode: boolean
  // Track if we need to show the plan mode exit attachment (one-time notification)
  needsPlanModeExitAttachment: boolean
  // Track if we need to show the auto mode exit attachment (one-time notification)
  needsAutoModeExitAttachment: boolean
  // Track if LSP plugin recommendation has been shown this session (only show once)
  lspRecommendationShownThisSession: boolean
  // SDK init event state - jsonSchema for structured output
  initJsonSchema: Record<string, unknown> | null
  // Registered hooks - SDK callbacks and plugin native hooks
  registeredHooks: Partial<Record<HookEvent, RegisteredHookMatcher[]>> | null
  // Cache for plan slugs: sessionId -> wordSlug
  planSlugCache: Map<string, string>
  // Track teleported session for reliability logging
  teleportedSessionInfo: {
    isTeleported: boolean
    hasLoggedFirstMessage: boolean
    sessionId: string | null
  } | null
  // Track invoked skills for preservation across compaction
  // Keys are composite: `${agentId ?? ''}:${skillName}` to prevent cross-agent overwrites
  invokedSkills: Map<
    string,
    {
      skillName: string
      skillPath: string
      content: string
      invokedAt: number
      agentId: string | null
    }
  >
  // Track slow operations for dev bar display (ant-only)
  slowOperations: Array<{
    operation: string
    durationMs: number
    timestamp: number
  }>
  // SDK-provided betas (e.g., context-1m-2025-08-07)
  sdkBetas: string[] | undefined
  // Main thread agent type (from --agent flag or settings)
  mainThreadAgentType: string | undefined
  // Remote mode (--remote flag)
  isRemoteMode: boolean
  // Direct connect server URL (for display in header)
  directConnectServerUrl: string | undefined
  // System prompt section cache state
  systemPromptSectionCache: Map<string, string | null>
  // Last date emitted to the model (for detecting midnight date changes)
  lastEmittedDate: string | null
  // Additional directories from --add-dir flag (for CLAUDE.md loading)
  additionalDirectoriesForClaudeMd: string[]
  // Channel server allowlist from --channels flag (servers whose channel
  // notifications should register this session). Parsed once in main.tsx —
  // the tag decides trust model: 'plugin' → marketplace verification +
  // allowlist, 'server' → allowlist always fails (schema is plugin-only).
  // Either kind needs entry.dev to bypass allowlist.
  allowedChannels: ChannelEntry[]
  // True if any entry in allowedChannels came from
  // --dangerously-load-development-channels (so ChannelsNotice can name the
  // right flag in policy-blocked messages)
  hasDevChannels: boolean
  // Dir containing the session's `.jsonl`; null = derive from originalCwd.
  sessionProjectDir: string | null
  // Cached prompt cache 1h TTL allowlist from GrowthBook (session-stable)
  promptCache1hAllowlist: string[] | null
  // Cached 1h TTL user eligibility (session-stable). Latched on first
  // evaluation so mid-session overage flips don't change the cache_control
  // TTL, which would bust the server-side prompt cache.
  promptCache1hEligible: boolean | null
  // Sticky-on latch for AFK_MODE_BETA_HEADER. Once auto mode is first
  // activated, keep sending the header for the rest of the session so
  // Shift+Tab toggles don't bust the ~50-70K token prompt cache.
  afkModeHeaderLatched: boolean | null
  // Sticky-on latch for FAST_MODE_BETA_HEADER. Once fast mode is first
  // enabled, keep sending the header so cooldown enter/exit doesn't
  // double-bust the prompt cache. The `speed` body param stays dynamic.
  fastModeHeaderLatched: boolean | null
  // Sticky-on latch for the cache-editing beta header. Once cached
  // microcompact is first enabled, keep sending the header so mid-session
  // GrowthBook/settings toggles don't bust the prompt cache.
  cacheEditingHeaderLatched: boolean | null
  // Sticky-on latch for clearing thinking from prior tool loops. Triggered
  // when >1h since last API call (confirmed cache miss — no cache-hit
  // benefit to keeping thinking). Once latched, stays on so the newly-warmed
  // thinking-cleared cache isn't busted by flipping back to keep:'all'.
  thinkingClearLatched: boolean | null
  // Current prompt ID (UUID) correlating a user prompt with subsequent OTel events
  promptId: string | null
  // Last API requestId for the main conversation chain (not subagents).
  // Updated after each successful API response for main-session queries.
  // Read at shutdown to send cache eviction hints to inference.
  lastMainRequestId: string | undefined
  // Timestamp (Date.now()) of the last successful API call completion.
  // Used to compute timeSinceLastApiCallMs in tengu_api_success for
  // correlating cache misses with idle time (cache TTL is ~5min).
  lastApiCompletionTimestamp: number | null
  // Set to true after compaction (auto or manual /compact). Consumed by
  // logAPISuccess to tag the first post-compaction API call so we can
  // distinguish compaction-induced cache misses from TTL expiry.
  pendingPostCompaction: boolean
}

// ALSO HERE - THINK THRICE BEFORE MODIFYING
// getInitialState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getInitialState(): State {
  // Resolve symlinks in cwd to match behavior of shell.ts setCwd
  // This ensures consistency with how paths are sanitized for session storage
  // resolvedCwd 命名 `''`，让后续代码直接表达这个值的用途。
  let resolvedCwd = ''
  // state在这里进入条件判断，后续代码按实际状态分流。
  if (
    typeof process !== 'undefined' &&
    typeof process.cwd === 'function' &&
    typeof realpathSync === 'function'
  ) {
    // rawCwd保存`cwd`，供state后续处理使用。
    const rawCwd = cwd()
    // 保护这一段可能失败的state操作，确保异常能进入相邻错误处理。
    try {
      // resolvedCwd更新为 `realpathSync(rawCwd).normalize('NFC')`，确保state后续读取最新状态。
      resolvedCwd = realpathSync(rawCwd).normalize('NFC')
    } catch {
      // File Provider EPERM on CloudStorage mounts (lstat per path component).
      // resolvedCwd更新为 `rawCwd.normalize('NFC')`，确保state后续读取最新状态。
      resolvedCwd = rawCwd.normalize('NFC')
    }
  }
  // 状态 集中保存state要一起传递的字段。
  const state: State = {
    originalCwd: resolvedCwd,
    projectRoot: resolvedCwd,
    totalCostUSD: 0,
    totalAPIDuration: 0,
    totalAPIDurationWithoutRetries: 0,
    totalToolDuration: 0,
    turnHookDurationMs: 0,
    turnToolDurationMs: 0,
    turnClassifierDurationMs: 0,
    turnToolCount: 0,
    turnHookCount: 0,
    turnClassifierCount: 0,
    startTime: Date.now(),
    lastInteractionTime: Date.now(),
    totalLinesAdded: 0,
    totalLinesRemoved: 0,
    hasUnknownModelCost: false,
    cwd: resolvedCwd,
    modelUsage: {},
    mainLoopModelOverride: undefined,
    initialMainLoopModel: null,
    modelStrings: null,
    isInteractive: false,
    kairosActive: false,
    strictToolResultPairing: false,
    sdkAgentProgressSummariesEnabled: false,
    userMsgOptIn: false,
    clientType: 'cli',
    sessionSource: undefined,
    questionPreviewFormat: undefined,
    sessionIngressToken: undefined,
    oauthTokenFromFd: undefined,
    apiKeyFromFd: undefined,
    flagSettingsPath: undefined,
    flagSettingsInline: null,
    allowedSettingSources: [
      'userSettings',
      'projectSettings',
      'localSettings',
      'flagSettings',
      'policySettings',
    ],
    // Telemetry state
    meter: null,
    sessionCounter: null,
    locCounter: null,
    prCounter: null,
    commitCounter: null,
    costCounter: null,
    tokenCounter: null,
    codeEditToolDecisionCounter: null,
    activeTimeCounter: null,
    statsStore: null,
    sessionId: randomUUID() as SessionId,
    parentSessionId: undefined,
    // Logger state
    loggerProvider: null,
    eventLogger: null,
    // Meter provider state
    meterProvider: null,
    tracerProvider: null,
    // Agent color state
    agentColorMap: new Map(),
    agentColorIndex: 0,
    // Last API request for bug reports
    lastAPIRequest: null,
    lastAPIRequestMessages: null,
    // Last auto-mode classifier request(s) for /share transcript
    lastClassifierRequests: null,
    cachedClaudeMdContent: null,
    // In-memory error log for recent errors
    inMemoryErrorLog: [],
    // Session-only plugins from --plugin-dir flag
    inlinePlugins: [],
    // Explicit --chrome / --no-chrome flag value (undefined = not set on CLI)
    chromeFlagOverride: undefined,
    // Use cowork_plugins directory instead of plugins
    useCoworkPlugins: false,
    // Session-only bypass permissions mode flag (not persisted)
    sessionBypassPermissionsMode: false,
    // Scheduled tasks disabled until flag or dialog enables them
    scheduledTasksEnabled: false,
    sessionCronTasks: [],
    sessionCreatedTeams: new Set(),
    // Session-only trust flag (not persisted to disk)
    sessionTrustAccepted: false,
    // Session-only flag to disable session persistence to disk
    sessionPersistenceDisabled: false,
    // Track if user has exited plan mode in this session
    hasExitedPlanMode: false,
    // Track if we need to show the plan mode exit attachment
    needsPlanModeExitAttachment: false,
    // Track if we need to show the auto mode exit attachment
    needsAutoModeExitAttachment: false,
    // Track if LSP plugin recommendation has been shown this session
    lspRecommendationShownThisSession: false,
    // SDK init event state
    initJsonSchema: null,
    registeredHooks: null,
    // Cache for plan slugs
    planSlugCache: new Map(),
    // Track teleported session for reliability logging
    teleportedSessionInfo: null,
    // Track invoked skills for preservation across compaction
    invokedSkills: new Map(),
    // Track slow operations for dev bar display
    slowOperations: [],
    // SDK-provided betas
    sdkBetas: undefined,
    // Main thread agent type
    mainThreadAgentType: undefined,
    // Remote mode
    isRemoteMode: false,
    ...(process.env.USER_TYPE === 'ant'
      ? {
          replBridgeActive: false,
        }
      : {}),
    // Direct connect server URL
    directConnectServerUrl: undefined,
    // System prompt section cache state
    systemPromptSectionCache: new Map(),
    // Last date emitted to the model
    lastEmittedDate: null,
    // Additional directories from --add-dir flag (for CLAUDE.md loading)
    additionalDirectoriesForClaudeMd: [],
    // Channel server allowlist from --channels flag
    allowedChannels: [],
    hasDevChannels: false,
    // Session project dir (null = derive from originalCwd)
    sessionProjectDir: null,
    // Prompt cache 1h allowlist (null = not yet fetched from GrowthBook)
    promptCache1hAllowlist: null,
    // Prompt cache 1h eligibility (null = not yet evaluated)
    promptCache1hEligible: null,
    // Beta header latches (null = not yet triggered)
    afkModeHeaderLatched: null,
    fastModeHeaderLatched: null,
    cacheEditingHeaderLatched: null,
    thinkingClearLatched: null,
    // Current prompt ID
    promptId: null,
    lastMainRequestId: undefined,
    lastApiCompletionTimestamp: null,
    pendingPostCompaction: false,
  }

  // 返回 `state`，作为state这次计算的结果。
  return state
}

// AND ESPECIALLY HERE
// STATE 状态读取`getInitialState()` 整理出中间结果，供state后续步骤使用。
const STATE: State = getInitialState()

// getSessionId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionId(): SessionId {
  // 返回 `STATE.sessionId`，作为state这次计算的结果。
  return STATE.sessionId
}

// regenerateSessionId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function regenerateSessionId(
  options: { setCurrentAsParent?: boolean } = {},
): SessionId {
  // 满足 `options.setCurrentAsParent` 时，state执行该分支。
  if (options.setCurrentAsParent) {
    // parentSessionId 会话数据更新为 `STATE.sessionId`，确保state后续读取最新状态。
    STATE.parentSessionId = STATE.sessionId
  }
  // Drop the outgoing session's plan-slug entry so the Map doesn't
  // accumulate stale keys. Callers that need to carry the slug across
  // (REPL.tsx clearContext) read it before calling clearConversation.
  // 调用 STATE.planSlugCache.delete，触发state此处需要的副作用。
  STATE.planSlugCache.delete(STATE.sessionId)
  // Regenerated sessions live in the current project: reset projectDir to
  // null so getTranscriptPath() derives from originalCwd.
  // sessionId 会话数据更新为 `randomUUID() as SessionId`，确保state后续读取最新状态。
  STATE.sessionId = randomUUID() as SessionId
  // sessionProjectDir 会话数据更新为 `null`，确保state后续读取最新状态。
  STATE.sessionProjectDir = null
  // 返回 `STATE.sessionId`，作为state这次计算的结果。
  return STATE.sessionId
}

// getParentSessionId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getParentSessionId(): SessionId | undefined {
  // 返回 `STATE.parentSessionId`，作为state这次计算的结果。
  return STATE.parentSessionId
}

/**
 * Atomically switch the active session. `sessionId` and `sessionProjectDir`
 * always change together — there is no separate setter for either, so they
 * cannot drift out of sync (CC-34).
 *
 * @param projectDir — directory containing `<sessionId>.jsonl`. Omit (or
 *   pass `null`) for sessions in the current project — the path will derive
 *   from originalCwd at read time. Pass `dirname(transcriptPath)` when the
 *   session lives in a different project directory (git worktrees,
 *   cross-project resume). Every call resets the project dir; it never
 *   carries over from the previous session.
 */
// switchSession 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function switchSession(
  sessionId: SessionId,
  projectDir: string | null = null,
): void {
  // Drop the outgoing session's plan-slug entry so the Map stays bounded
  // across repeated /resume. Only the current session's slug is ever read
  // (plans.ts getPlanSlug defaults to getSessionId()).
  // 调用 STATE.planSlugCache.delete，触发state此处需要的副作用。
  STATE.planSlugCache.delete(STATE.sessionId)
  // sessionId 会话数据更新为 `sessionId`，确保state后续读取最新状态。
  STATE.sessionId = sessionId
  // sessionProjectDir 会话数据更新为 `projectDir`，确保state后续读取最新状态。
  STATE.sessionProjectDir = projectDir
  // 调用 sessionSwitched.emit，触发state此处需要的副作用。
  sessionSwitched.emit(sessionId)
}

// sessionSwitched 会话数据 命名 `createSignal<[id: SessionId]>()`，让后续代码直接表达这个值的用途。
const sessionSwitched = createSignal<[id: SessionId]>()

/**
 * Register a callback that fires when switchSession changes the active
 * sessionId. bootstrap can't import listeners directly (DAG leaf), so
 * callers register themselves. concurrentSessions.ts uses this to keep the
 * PID file's sessionId in sync with --resume.
 */
// onSessionSwitch 会话数据保存`sessionSwitched.subscribe`，供后续判断或组装使用。
export const onSessionSwitch = sessionSwitched.subscribe

/**
 * Project directory the current session's transcript lives in, or `null` if
 * the session was created in the current project (common case — derive from
 * originalCwd). See `switchSession()`.
 */
// getSessionProjectDir 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionProjectDir(): string | null {
  // 返回 `STATE.sessionProjectDir`，作为state这次计算的结果。
  return STATE.sessionProjectDir
}

// getOriginalCwd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOriginalCwd(): string {
  // 返回 `STATE.originalCwd`，作为state这次计算的结果。
  return STATE.originalCwd
}

/**
 * Get the stable project root directory.
 * Unlike getOriginalCwd(), this is never updated by mid-session EnterWorktreeTool
 * (so skills/history stay stable when entering a throwaway worktree).
 * It IS set at startup by --worktree, since that worktree is the session's project.
 * Use for project identity (history, skills, sessions) not file operations.
 */
// getProjectRoot 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getProjectRoot(): string {
  // 返回 `STATE.projectRoot`，作为state这次计算的结果。
  return STATE.projectRoot
}

// setOriginalCwd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setOriginalCwd(cwd: string): void {
  // originalCwd更新为 `cwd.normalize('NFC')`，确保state后续读取最新状态。
  STATE.originalCwd = cwd.normalize('NFC')
}

/**
 * Only for --worktree startup flag. Mid-session EnterWorktreeTool must NOT
 * call this — skills/history should stay anchored to where the session started.
 */
// setProjectRoot 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setProjectRoot(cwd: string): void {
  // projectRoot更新为 `cwd.normalize('NFC')`，确保state后续读取最新状态。
  STATE.projectRoot = cwd.normalize('NFC')
}

// getCwdState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCwdState(): string {
  // 返回 `STATE.cwd`，作为state这次计算的结果。
  return STATE.cwd
}

// setCwdState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCwdState(cwd: string): void {
  // cwd更新为 `cwd.normalize('NFC')`，确保state后续读取最新状态。
  STATE.cwd = cwd.normalize('NFC')
}

// getDirectConnectServerUrl 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDirectConnectServerUrl(): string | undefined {
  // 返回 `STATE.directConnectServerUrl`，作为state这次计算的结果。
  return STATE.directConnectServerUrl
}

// setDirectConnectServerUrl 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setDirectConnectServerUrl(url: string): void {
  // directConnectServerUrl更新为 `url`，确保state后续读取最新状态。
  STATE.directConnectServerUrl = url
}

// addToTotalDurationState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToTotalDurationState(
  duration: number,
  durationWithoutRetries: number,
): void {
  // state在这里处理 `STATE.totalAPIDuration += duration`，完成这一小步状态转换。
  STATE.totalAPIDuration += duration
  // state在这里处理 `STATE.totalAPIDurationWithoutRetries += durationWithoutRetries`，完成这一小步状态转换。
  STATE.totalAPIDurationWithoutRetries += durationWithoutRetries
}

// resetTotalDurationStateAndCost_FOR_TESTS_ONLY 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetTotalDurationStateAndCost_FOR_TESTS_ONLY(): void {
  // totalAPIDuration更新为 `0`，确保state后续读取最新状态。
  STATE.totalAPIDuration = 0
  // totalAPIDurationWithoutRetries 集合更新为 `0`，确保state后续读取最新状态。
  STATE.totalAPIDurationWithoutRetries = 0
  // totalCostUSD更新为 `0`，确保state后续读取最新状态。
  STATE.totalCostUSD = 0
}

// addToTotalCostState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToTotalCostState(
  cost: number,
  modelUsage: ModelUsage,
  model: string,
): void {
  // modelUsage[model更新为 `modelUsage`，确保state后续读取最新状态。
  STATE.modelUsage[model] = modelUsage
  // state在这里处理 `STATE.totalCostUSD += cost`，完成这一小步状态转换。
  STATE.totalCostUSD += cost
}

// getTotalCostUSD 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalCostUSD(): number {
  // 返回 `STATE.totalCostUSD`，作为state这次计算的结果。
  return STATE.totalCostUSD
}

// getTotalAPIDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalAPIDuration(): number {
  // 返回 `STATE.totalAPIDuration`，作为state这次计算的结果。
  return STATE.totalAPIDuration
}

// getTotalDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalDuration(): number {
  // 返回 `Date.now() - STATE.startTime`，作为state这次计算的结果。
  return Date.now() - STATE.startTime
}

// getTotalAPIDurationWithoutRetries 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalAPIDurationWithoutRetries(): number {
  // 返回 `STATE.totalAPIDurationWithoutRetries`，作为state这次计算的结果。
  return STATE.totalAPIDurationWithoutRetries
}

// getTotalToolDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalToolDuration(): number {
  // 返回 `STATE.totalToolDuration`，作为state这次计算的结果。
  return STATE.totalToolDuration
}

// addToToolDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToToolDuration(duration: number): void {
  // state在这里处理 `STATE.totalToolDuration += duration`，完成这一小步状态转换。
  STATE.totalToolDuration += duration
  // state在这里处理 `STATE.turnToolDurationMs += duration`，完成这一小步状态转换。
  STATE.turnToolDurationMs += duration
  // state在这里处理 `STATE.turnToolCount++`，完成这一小步状态转换。
  STATE.turnToolCount++
}

// getTurnHookDurationMs 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnHookDurationMs(): number {
  // 返回 `STATE.turnHookDurationMs`，作为state这次计算的结果。
  return STATE.turnHookDurationMs
}

// addToTurnHookDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToTurnHookDuration(duration: number): void {
  // state在这里处理 `STATE.turnHookDurationMs += duration`，完成这一小步状态转换。
  STATE.turnHookDurationMs += duration
  // state在这里处理 `STATE.turnHookCount++`，完成这一小步状态转换。
  STATE.turnHookCount++
}

// resetTurnHookDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetTurnHookDuration(): void {
  // turnHookDurationMs 集合更新为 `0`，确保state后续读取最新状态。
  STATE.turnHookDurationMs = 0
  // turnHookCount 数量更新为 `0`，确保state后续读取最新状态。
  STATE.turnHookCount = 0
}

// getTurnHookCount 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnHookCount(): number {
  // 返回 `STATE.turnHookCount`，作为state这次计算的结果。
  return STATE.turnHookCount
}

// getTurnToolDurationMs 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnToolDurationMs(): number {
  // 返回 `STATE.turnToolDurationMs`，作为state这次计算的结果。
  return STATE.turnToolDurationMs
}

// resetTurnToolDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetTurnToolDuration(): void {
  // turnToolDurationMs 集合更新为 `0`，确保state后续读取最新状态。
  STATE.turnToolDurationMs = 0
  // turnToolCount 数量更新为 `0`，确保state后续读取最新状态。
  STATE.turnToolCount = 0
}

// getTurnToolCount 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnToolCount(): number {
  // 返回 `STATE.turnToolCount`，作为state这次计算的结果。
  return STATE.turnToolCount
}

// getTurnClassifierDurationMs 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnClassifierDurationMs(): number {
  // 返回 `STATE.turnClassifierDurationMs`，作为state这次计算的结果。
  return STATE.turnClassifierDurationMs
}

// addToTurnClassifierDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToTurnClassifierDuration(duration: number): void {
  // state在这里处理 `STATE.turnClassifierDurationMs += duration`，完成这一小步状态转换。
  STATE.turnClassifierDurationMs += duration
  // state在这里处理 `STATE.turnClassifierCount++`，完成这一小步状态转换。
  STATE.turnClassifierCount++
}

// resetTurnClassifierDuration 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetTurnClassifierDuration(): void {
  // turnClassifierDurationMs 集合更新为 `0`，确保state后续读取最新状态。
  STATE.turnClassifierDurationMs = 0
  // turnClassifierCount 数量更新为 `0`，确保state后续读取最新状态。
  STATE.turnClassifierCount = 0
}

// getTurnClassifierCount 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnClassifierCount(): number {
  // 返回 `STATE.turnClassifierCount`，作为state这次计算的结果。
  return STATE.turnClassifierCount
}

// getStatsStore 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStatsStore(): {
  observe(name: string, value: number): void
} | null {
  // 返回 `STATE.statsStore`，作为state这次计算的结果。
  return STATE.statsStore
}

// setStatsStore 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setStatsStore(
  store: { observe(name: string, value: number): void } | null,
): void {
  // statsStore更新为 `store`，确保state后续读取最新状态。
  STATE.statsStore = store
}

/**
 * Marks that an interaction occurred.
 *
 * By default the actual Date.now() call is deferred until the next Ink render
 * frame (via flushInteractionTime()) so we avoid calling Date.now() on every
 * single keypress.
 *
 * Pass `immediate = true` when calling from React useEffect callbacks or
 * other code that runs *after* the Ink render cycle has already flushed.
 * Without it the timestamp stays stale until the next render, which may never
 * come if the user is idle (e.g. permission dialog waiting for input).
 */
// interactionTimeDirty标记state是否启用对应路径。
let interactionTimeDirty = false

// updateLastInteractionTime 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateLastInteractionTime(immediate?: boolean): void {
  // 满足 `immediate` 时，state执行该分支。
  if (immediate) {
    // 调用 flushInteractionTime_inner，触发state此处需要的副作用。
    flushInteractionTime_inner()
  } else {
    // interactionTimeDirty更新为 `true`，确保state后续读取最新状态。
    interactionTimeDirty = true
  }
}

/**
 * If an interaction was recorded since the last flush, update the timestamp
 * now. Called by Ink before each render cycle so we batch many keypresses into
 * a single Date.now() call.
 */
// flushInteractionTime 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function flushInteractionTime(): void {
  // 满足 `interactionTimeDirty` 时，state执行该分支。
  if (interactionTimeDirty) {
    // 调用 flushInteractionTime_inner，触发state此处需要的副作用。
    flushInteractionTime_inner()
  }
}

// flushInteractionTime_inner 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function flushInteractionTime_inner(): void {
  // lastInteractionTime更新为 `Date.now()`，确保state后续读取最新状态。
  STATE.lastInteractionTime = Date.now()
  // interactionTimeDirty更新为 `false`，确保state后续读取最新状态。
  interactionTimeDirty = false
}

// addToTotalLinesChanged 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToTotalLinesChanged(added: number, removed: number): void {
  // state在这里处理 `STATE.totalLinesAdded += added`，完成这一小步状态转换。
  STATE.totalLinesAdded += added
  // state在这里处理 `STATE.totalLinesRemoved += removed`，完成这一小步状态转换。
  STATE.totalLinesRemoved += removed
}

// getTotalLinesAdded 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalLinesAdded(): number {
  // 返回 `STATE.totalLinesAdded`，作为state这次计算的结果。
  return STATE.totalLinesAdded
}

// getTotalLinesRemoved 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalLinesRemoved(): number {
  // 返回 `STATE.totalLinesRemoved`，作为state这次计算的结果。
  return STATE.totalLinesRemoved
}

// getTotalInputTokens 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalInputTokens(): number {
  // 返回 `sumBy(Object.values(STATE.modelUsage), 'inputTokens')`，作为state这次计算的结果。
  return sumBy(Object.values(STATE.modelUsage), 'inputTokens')
}

// getTotalOutputTokens 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalOutputTokens(): number {
  // 返回 `sumBy(Object.values(STATE.modelUsage), 'outputTokens')`，作为state这次计算的结果。
  return sumBy(Object.values(STATE.modelUsage), 'outputTokens')
}

// getTotalCacheReadInputTokens 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalCacheReadInputTokens(): number {
  // 返回 `sumBy(Object.values(STATE.modelUsage), 'cacheReadInputTokens')`，作为state这次计算的结果。
  return sumBy(Object.values(STATE.modelUsage), 'cacheReadInputTokens')
}

// getTotalCacheCreationInputTokens 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalCacheCreationInputTokens(): number {
  // 返回 `sumBy(Object.values(STATE.modelUsage), 'cacheCreationInputTokens')`，作为state这次计算的结果。
  return sumBy(Object.values(STATE.modelUsage), 'cacheCreationInputTokens')
}

// getTotalWebSearchRequests 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTotalWebSearchRequests(): number {
  // 返回 `sumBy(Object.values(STATE.modelUsage), 'webSearchRequests')`，作为state这次计算的结果。
  return sumBy(Object.values(STATE.modelUsage), 'webSearchRequests')
}

// outputTokensAtTurnStart保存`0`，供state后续判断或输出使用。
let outputTokensAtTurnStart = 0
// currentTurnTokenBudget保存`null`，作为后续空值处理的输入。
let currentTurnTokenBudget: number | null = null
// getTurnOutputTokens 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTurnOutputTokens(): number {
  // 返回 `getTotalOutputTokens() - outputTokensAtTurnStart`，作为state这次计算的结果。
  return getTotalOutputTokens() - outputTokensAtTurnStart
}
// getCurrentTurnTokenBudget 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentTurnTokenBudget(): number | null {
  // 返回 `currentTurnTokenBudget`，作为state这次计算的结果。
  return currentTurnTokenBudget
}
// budgetContinuationCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
let budgetContinuationCount = 0
// snapshotOutputTokensForTurn 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function snapshotOutputTokensForTurn(budget: number | null): void {
  // outputTokensAtTurnStart更新为 `getTotalOutputTokens()`，确保state后续读取最新状态。
  outputTokensAtTurnStart = getTotalOutputTokens()
  // currentTurnTokenBudget更新为 `budget`，确保state后续读取最新状态。
  currentTurnTokenBudget = budget
  // budgetContinuationCount 数量更新为 `0`，确保state后续读取最新状态。
  budgetContinuationCount = 0
}
// getBudgetContinuationCount 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBudgetContinuationCount(): number {
  // 返回 `budgetContinuationCount`，作为state这次计算的结果。
  return budgetContinuationCount
}
// incrementBudgetContinuationCount 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function incrementBudgetContinuationCount(): void {
  // state在这里处理 `budgetContinuationCount++`，完成这一小步状态转换。
  budgetContinuationCount++
}

// setHasUnknownModelCost 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setHasUnknownModelCost(): void {
  // hasUnknownModelCost更新为 `true`，确保state后续读取最新状态。
  STATE.hasUnknownModelCost = true
}

// hasUnknownModelCost 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasUnknownModelCost(): boolean {
  // 返回 `STATE.hasUnknownModelCost`，作为state这次计算的结果。
  return STATE.hasUnknownModelCost
}

// getLastMainRequestId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastMainRequestId(): string | undefined {
  // 返回 `STATE.lastMainRequestId`，作为state这次计算的结果。
  return STATE.lastMainRequestId
}

// setLastMainRequestId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastMainRequestId(requestId: string): void {
  // lastMainRequestId 请求数据更新为 `requestId`，确保state后续读取最新状态。
  STATE.lastMainRequestId = requestId
}

// getLastApiCompletionTimestamp 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastApiCompletionTimestamp(): number | null {
  // 返回 `STATE.lastApiCompletionTimestamp`，作为state这次计算的结果。
  return STATE.lastApiCompletionTimestamp
}

// setLastApiCompletionTimestamp 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastApiCompletionTimestamp(timestamp: number): void {
  // lastApiCompletionTimestamp更新为 `timestamp`，确保state后续读取最新状态。
  STATE.lastApiCompletionTimestamp = timestamp
}

/** Mark that a compaction just occurred. The next API success event will
 *  include isPostCompaction=true, then the flag auto-resets. */
// markPostCompaction 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markPostCompaction(): void {
  // pendingPostCompaction更新为 `true`，确保state后续读取最新状态。
  STATE.pendingPostCompaction = true
}

/** Consume the post-compaction flag. Returns true once after compaction,
 *  then returns false until the next compaction. */
// consumePostCompaction 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumePostCompaction(): boolean {
  // was 集合保存`STATE.pendingPostCompaction`，供后续判断或组装使用。
  const was = STATE.pendingPostCompaction
  // pendingPostCompaction更新为 `false`，确保state后续读取最新状态。
  STATE.pendingPostCompaction = false
  // 返回 `was`，作为state这次计算的结果。
  return was
}

// getLastInteractionTime 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastInteractionTime(): number {
  // 返回 `STATE.lastInteractionTime`，作为state这次计算的结果。
  return STATE.lastInteractionTime
}

// Scroll drain suspension — background intervals check this before doing work
// so they don't compete with scroll frames for the event loop. Set by
// ScrollBox scrollBy/scrollTo, cleared SCROLL_DRAIN_IDLE_MS after the last
// scroll event. Module-scope (not in STATE) — ephemeral hot-path flag, no
// test-reset needed since the debounce timer self-clears.
// scrollDraining标记state是否启用对应路径。
let scrollDraining = false
// scrollDrainTimer 先占位，稍后的条件分支会根据实际输入补齐它。
let scrollDrainTimer: ReturnType<typeof setTimeout> | undefined
// SCROLL_DRAIN_IDLE_MS 集合 命名 `150`，让后续代码直接表达这个值的用途。
const SCROLL_DRAIN_IDLE_MS = 150

/** Mark that a scroll event just happened. Background intervals gate on
 *  getIsScrollDraining() and skip their work until the debounce clears. */
// markScrollActivity 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markScrollActivity(): void {
  // scrollDraining更新为 `true`，确保state后续读取最新状态。
  scrollDraining = true
  // 满足 `scrollDrainTimer) clearTimeout(scrollDrainTimer` 时，state执行该分支。
  if (scrollDrainTimer) clearTimeout(scrollDrainTimer)
  // scrollDrainTimer更新为 `setTimeout(() => {`，确保state后续读取最新状态。
  scrollDrainTimer = setTimeout(() => {
    // scrollDraining更新为 `false`，确保state后续读取最新状态。
    scrollDraining = false
    // scrollDrainTimer更新为 `undefined`，确保state后续读取最新状态。
    scrollDrainTimer = undefined
  }, SCROLL_DRAIN_IDLE_MS)
  // 调用 scrollDrainTimer.unref?.()，完成这一处局部操作。
  scrollDrainTimer.unref?.()
}

/** True while scroll is actively draining (within 150ms of last event).
 *  Intervals should early-return when this is set — the work picks up next
 *  tick after scroll settles. */
// getIsScrollDraining 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getIsScrollDraining(): boolean {
  // 返回 `scrollDraining`，作为state这次计算的结果。
  return scrollDraining
}

/** Await this before expensive one-shot work (network, subprocess) that could
 *  coincide with scroll. Resolves immediately if not scrolling; otherwise
 *  polls at the idle interval until the flag clears. */
// waitForScrollIdle 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function waitForScrollIdle(): Promise<void> {
  // while 使用 scrollDraining 完成state里的对应操作。
  while (scrollDraining) {
    // bootstrap-isolation forbids importing sleep() from src/utils/
    // eslint-disable-next-line no-restricted-syntax
    // 这个回调绑定到 await new Promise(r => setTimeout(r, SCROLL_DRAIN_IDLE_MS).unref?.())，负责state在该局部场景下的响应。
    await new Promise(r => setTimeout(r, SCROLL_DRAIN_IDLE_MS).unref?.())
  }
}

// getModelUsage 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelUsage(): { [modelName: string]: ModelUsage } {
  // 返回 `STATE.modelUsage`，作为state这次计算的结果。
  return STATE.modelUsage
}

// getUsageForModel 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUsageForModel(model: string): ModelUsage | undefined {
  // 返回 `STATE.modelUsage[model]`，作为state这次计算的结果。
  return STATE.modelUsage[model]
}

/**
 * Gets the model override set from the --model CLI flag or after the user
 * updates their configured model.
 */
// getMainLoopModelOverride 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMainLoopModelOverride(): ModelSetting | undefined {
  // 返回 `STATE.mainLoopModelOverride`，作为state这次计算的结果。
  return STATE.mainLoopModelOverride
}

// getInitialMainLoopModel 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitialMainLoopModel(): ModelSetting {
  // 返回 `STATE.initialMainLoopModel`，作为state这次计算的结果。
  return STATE.initialMainLoopModel
}

// setMainLoopModelOverride 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMainLoopModelOverride(
  model: ModelSetting | undefined,
): void {
  // mainLoopModelOverride更新为 `model`，确保state后续读取最新状态。
  STATE.mainLoopModelOverride = model
}

// setInitialMainLoopModel 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setInitialMainLoopModel(model: ModelSetting): void {
  // initialMainLoopModel更新为 `model`，确保state后续读取最新状态。
  STATE.initialMainLoopModel = model
}

// getSdkBetas 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSdkBetas(): string[] | undefined {
  // 返回 `STATE.sdkBetas`，作为state这次计算的结果。
  return STATE.sdkBetas
}

// setSdkBetas 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSdkBetas(betas: string[] | undefined): void {
  // sdkBetas 集合更新为 `betas`，确保state后续读取最新状态。
  STATE.sdkBetas = betas
}

// resetCostState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetCostState(): void {
  // totalCostUSD更新为 `0`，确保state后续读取最新状态。
  STATE.totalCostUSD = 0
  // totalAPIDuration更新为 `0`，确保state后续读取最新状态。
  STATE.totalAPIDuration = 0
  // totalAPIDurationWithoutRetries 集合更新为 `0`，确保state后续读取最新状态。
  STATE.totalAPIDurationWithoutRetries = 0
  // totalToolDuration更新为 `0`，确保state后续读取最新状态。
  STATE.totalToolDuration = 0
  // startTime更新为 `Date.now()`，确保state后续读取最新状态。
  STATE.startTime = Date.now()
  // totalLinesAdded更新为 `0`，确保state后续读取最新状态。
  STATE.totalLinesAdded = 0
  // totalLinesRemoved更新为 `0`，确保state后续读取最新状态。
  STATE.totalLinesRemoved = 0
  // hasUnknownModelCost更新为 `false`，确保state后续读取最新状态。
  STATE.hasUnknownModelCost = false
  // modelUsage更新为 `{}`，确保state后续读取最新状态。
  STATE.modelUsage = {}
  // promptId更新为 `null`，确保state后续读取最新状态。
  STATE.promptId = null
}

/**
 * Sets cost state values for session restore.
 * Called by restoreCostStateForSession in cost-tracker.ts.
 */
// setCostStateForRestore 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCostStateForRestore({
  totalCostUSD,
  totalAPIDuration,
  totalAPIDurationWithoutRetries,
  totalToolDuration,
  totalLinesAdded,
  totalLinesRemoved,
  lastDuration,
  modelUsage,
}: {
  totalCostUSD: number
  totalAPIDuration: number
  totalAPIDurationWithoutRetries: number
  totalToolDuration: number
  totalLinesAdded: number
  totalLinesRemoved: number
  lastDuration: number | undefined
  modelUsage: { [modelName: string]: ModelUsage } | undefined
}): void {
  // totalCostUSD更新为 `totalCostUSD`，确保state后续读取最新状态。
  STATE.totalCostUSD = totalCostUSD
  // totalAPIDuration更新为 `totalAPIDuration`，确保state后续读取最新状态。
  STATE.totalAPIDuration = totalAPIDuration
  // totalAPIDurationWithoutRetries 集合更新为 `totalAPIDurationWithoutRetries`，确保state后续读取最新状态。
  STATE.totalAPIDurationWithoutRetries = totalAPIDurationWithoutRetries
  // totalToolDuration更新为 `totalToolDuration`，确保state后续读取最新状态。
  STATE.totalToolDuration = totalToolDuration
  // totalLinesAdded更新为 `totalLinesAdded`，确保state后续读取最新状态。
  STATE.totalLinesAdded = totalLinesAdded
  // totalLinesRemoved更新为 `totalLinesRemoved`，确保state后续读取最新状态。
  STATE.totalLinesRemoved = totalLinesRemoved

  // Restore per-model usage breakdown
  // 满足 `modelUsage` 时，state执行该分支。
  if (modelUsage) {
    // modelUsage更新为 `modelUsage`，确保state后续读取最新状态。
    STATE.modelUsage = modelUsage
  }

  // Adjust startTime to make wall duration accumulate
  // 满足 `lastDuration` 时，state执行该分支。
  if (lastDuration) {
    // startTime更新为 `Date.now() - lastDuration`，确保state后续读取最新状态。
    STATE.startTime = Date.now() - lastDuration
  }
}

// Only used in tests
// resetStateForTests 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetStateForTests(): void {
  // `process.env.NODE_ENV` 与 `'test'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.NODE_ENV !== 'test') {
    // 抛出 new Error('resetStateForTests can only be called in tests')，阻止state在无效状态下继续运行。
    throw new Error('resetStateForTests can only be called in tests')
  }
  // 调用 Object.entries，触发state此处需要的副作用。
  Object.entries(getInitialState()).forEach(([key, value]) => {
    // STATE[key as keyof State 状态更新为 `value as never`，确保state后续读取最新状态。
    STATE[key as keyof State] = value as never
  })
  // outputTokensAtTurnStart更新为 `0`，确保state后续读取最新状态。
  outputTokensAtTurnStart = 0
  // currentTurnTokenBudget更新为 `null`，确保state后续读取最新状态。
  currentTurnTokenBudget = null
  // budgetContinuationCount 数量更新为 `0`，确保state后续读取最新状态。
  budgetContinuationCount = 0
  // 调用 sessionSwitched.clear，触发state此处需要的副作用。
  sessionSwitched.clear()
}

// You shouldn't use this directly. See src/utils/model/modelStrings.ts::getModelStrings()
// getModelStrings 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getModelStrings(): ModelStrings | null {
  // 返回 `STATE.modelStrings`，作为state这次计算的结果。
  return STATE.modelStrings
}

// You shouldn't use this directly. See src/utils/model/modelStrings.ts
// setModelStrings 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setModelStrings(modelStrings: ModelStrings): void {
  // modelStrings 集合更新为 `modelStrings`，确保state后续读取最新状态。
  STATE.modelStrings = modelStrings
}

// Test utility function to reset model strings for re-initialization.
// Separate from setModelStrings because we only want to accept 'null' in tests.
// resetModelStringsForTestingOnly 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetModelStringsForTestingOnly() {
  // modelStrings 集合更新为 `null`，确保state后续读取最新状态。
  STATE.modelStrings = null
}

// setMeter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMeter(
  meter: Meter,
  // 这个回调绑定到 createCounter: (name: string, options: MetricOptions) => AttributedCounter,，负责state在该局部场景下的响应。
  createCounter: (name: string, options: MetricOptions) => AttributedCounter,
): void {
  // meter更新为 `meter`，确保state后续读取最新状态。
  STATE.meter = meter

  // Initialize all counters using the provided factory
  // sessionCounter 会话数据更新为 `createCounter('claude_code.session.count', {`，确保state后续读取最新状态。
  STATE.sessionCounter = createCounter('claude_code.session.count', {
    description: 'Count of CLI sessions started',
  })
  // locCounter 数量更新为 `createCounter('claude_code.lines_of_code.count', {`，确保state后续读取最新状态。
  STATE.locCounter = createCounter('claude_code.lines_of_code.count', {
    description:
      "Count of lines of code modified, with the 'type' attribute indicating whether lines were added or removed",
  })
  // prCounter 数量更新为 `createCounter('claude_code.pull_request.count', {`，确保state后续读取最新状态。
  STATE.prCounter = createCounter('claude_code.pull_request.count', {
    description: 'Number of pull requests created',
  })
  // commitCounter 数量更新为 `createCounter('claude_code.commit.count', {`，确保state后续读取最新状态。
  STATE.commitCounter = createCounter('claude_code.commit.count', {
    description: 'Number of git commits created',
  })
  // costCounter 数量更新为 `createCounter('claude_code.cost.usage', {`，确保state后续读取最新状态。
  STATE.costCounter = createCounter('claude_code.cost.usage', {
    description: 'Cost of the Claude Code session',
    unit: 'USD',
  })
  // tokenCounter 数量更新为 `createCounter('claude_code.token.usage', {`，确保state后续读取最新状态。
  STATE.tokenCounter = createCounter('claude_code.token.usage', {
    description: 'Number of tokens used',
    unit: 'tokens',
  })
  // codeEditToolDecisionCounter 数量更新为 `createCounter(`，确保state后续读取最新状态。
  STATE.codeEditToolDecisionCounter = createCounter(
    'claude_code.code_edit_tool.decision',
    {
      description:
        'Count of code editing tool permission decisions (accept/reject) for Edit, Write, and NotebookEdit tools',
    },
  )
  // activeTimeCounter 数量更新为 `createCounter('claude_code.active_time.total', {`，确保state后续读取最新状态。
  STATE.activeTimeCounter = createCounter('claude_code.active_time.total', {
    description: 'Total active time in seconds',
    unit: 's',
  })
}

// getMeter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMeter(): Meter | null {
  // 返回 `STATE.meter`，作为state这次计算的结果。
  return STATE.meter
}

// getSessionCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionCounter(): AttributedCounter | null {
  // 返回 `STATE.sessionCounter`，作为state这次计算的结果。
  return STATE.sessionCounter
}

// getLocCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLocCounter(): AttributedCounter | null {
  // 返回 `STATE.locCounter`，作为state这次计算的结果。
  return STATE.locCounter
}

// getPrCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPrCounter(): AttributedCounter | null {
  // 返回 `STATE.prCounter`，作为state这次计算的结果。
  return STATE.prCounter
}

// getCommitCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCommitCounter(): AttributedCounter | null {
  // 返回 `STATE.commitCounter`，作为state这次计算的结果。
  return STATE.commitCounter
}

// getCostCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCostCounter(): AttributedCounter | null {
  // 返回 `STATE.costCounter`，作为state这次计算的结果。
  return STATE.costCounter
}

// getTokenCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTokenCounter(): AttributedCounter | null {
  // 返回 `STATE.tokenCounter`，作为state这次计算的结果。
  return STATE.tokenCounter
}

// getCodeEditToolDecisionCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCodeEditToolDecisionCounter(): AttributedCounter | null {
  // 返回 `STATE.codeEditToolDecisionCounter`，作为state这次计算的结果。
  return STATE.codeEditToolDecisionCounter
}

// getActiveTimeCounter 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getActiveTimeCounter(): AttributedCounter | null {
  // 返回 `STATE.activeTimeCounter`，作为state这次计算的结果。
  return STATE.activeTimeCounter
}

// getLoggerProvider 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLoggerProvider(): LoggerProvider | null {
  // 返回 `STATE.loggerProvider`，作为state这次计算的结果。
  return STATE.loggerProvider
}

// setLoggerProvider 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLoggerProvider(provider: LoggerProvider | null): void {
  // loggerProvider更新为 `provider`，确保state后续读取最新状态。
  STATE.loggerProvider = provider
}

// getEventLogger 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEventLogger(): ReturnType<typeof logs.getLogger> | null {
  // 返回 `STATE.eventLogger`，作为state这次计算的结果。
  return STATE.eventLogger
}

// setEventLogger 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setEventLogger(
  logger: ReturnType<typeof logs.getLogger> | null,
): void {
  // eventLogger更新为 `logger`，确保state后续读取最新状态。
  STATE.eventLogger = logger
}

// getMeterProvider 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMeterProvider(): MeterProvider | null {
  // 返回 `STATE.meterProvider`，作为state这次计算的结果。
  return STATE.meterProvider
}

// setMeterProvider 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMeterProvider(provider: MeterProvider | null): void {
  // meterProvider更新为 `provider`，确保state后续读取最新状态。
  STATE.meterProvider = provider
}
// getTracerProvider 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTracerProvider(): BasicTracerProvider | null {
  // 返回 `STATE.tracerProvider`，作为state这次计算的结果。
  return STATE.tracerProvider
}
// setTracerProvider 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setTracerProvider(provider: BasicTracerProvider | null): void {
  // tracerProvider更新为 `provider`，确保state后续读取最新状态。
  STATE.tracerProvider = provider
}

// getIsNonInteractiveSession 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getIsNonInteractiveSession(): boolean {
  // 返回 `!STATE.isInteractive`，作为state这次计算的结果。
  return !STATE.isInteractive
}

// getIsInteractive 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getIsInteractive(): boolean {
  // 返回 `STATE.isInteractive`，作为state这次计算的结果。
  return STATE.isInteractive
}

// setIsInteractive 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setIsInteractive(value: boolean): void {
  // isInteractive更新为 `value`，确保state后续读取最新状态。
  STATE.isInteractive = value
}

// getClientType 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getClientType(): string {
  // 返回 `STATE.clientType`，作为state这次计算的结果。
  return STATE.clientType
}

// setClientType 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setClientType(type: string): void {
  // clientType更新为 `type`，确保state后续读取最新状态。
  STATE.clientType = type
}

// getSdkAgentProgressSummariesEnabled 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSdkAgentProgressSummariesEnabled(): boolean {
  // 返回 `STATE.sdkAgentProgressSummariesEnabled`，作为state这次计算的结果。
  return STATE.sdkAgentProgressSummariesEnabled
}

// setSdkAgentProgressSummariesEnabled 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSdkAgentProgressSummariesEnabled(value: boolean): void {
  // sdkAgentProgressSummariesEnabled更新为 `value`，确保state后续读取最新状态。
  STATE.sdkAgentProgressSummariesEnabled = value
}

// getKairosActive 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getKairosActive(): boolean {
  // 返回 `STATE.kairosActive`，作为state这次计算的结果。
  return STATE.kairosActive
}

// setKairosActive 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setKairosActive(value: boolean): void {
  // kairosActive更新为 `value`，确保state后续读取最新状态。
  STATE.kairosActive = value
}

// getStrictToolResultPairing 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStrictToolResultPairing(): boolean {
  // 返回 `STATE.strictToolResultPairing`，作为state这次计算的结果。
  return STATE.strictToolResultPairing
}

// setStrictToolResultPairing 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setStrictToolResultPairing(value: boolean): void {
  // strictToolResultPairing更新为 `value`，确保state后续读取最新状态。
  STATE.strictToolResultPairing = value
}

// Field name 'userMsgOptIn' avoids excluded-string substrings ('BriefTool',
// 'SendUserMessage' — case-insensitive). All callers are inside feature()
// guards so these accessors don't need their own (matches getKairosActive).
// getUserMsgOptIn 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserMsgOptIn(): boolean {
  // 返回 `STATE.userMsgOptIn`，作为state这次计算的结果。
  return STATE.userMsgOptIn
}

// setUserMsgOptIn 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setUserMsgOptIn(value: boolean): void {
  // userMsgOptIn更新为 `value`，确保state后续读取最新状态。
  STATE.userMsgOptIn = value
}

// getSessionSource 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionSource(): string | undefined {
  // 返回 `STATE.sessionSource`，作为state这次计算的结果。
  return STATE.sessionSource
}

// setSessionSource 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionSource(source: string): void {
  // sessionSource 会话数据更新为 `source`，确保state后续读取最新状态。
  STATE.sessionSource = source
}

// getQuestionPreviewFormat 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getQuestionPreviewFormat(): 'markdown' | 'html' | undefined {
  // 返回 `STATE.questionPreviewFormat`，作为state这次计算的结果。
  return STATE.questionPreviewFormat
}

// setQuestionPreviewFormat 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setQuestionPreviewFormat(format: 'markdown' | 'html'): void {
  // questionPreviewFormat更新为 `format`，确保state后续读取最新状态。
  STATE.questionPreviewFormat = format
}

// getAgentColorMap 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentColorMap(): Map<string, AgentColorName> {
  // 返回 `STATE.agentColorMap`，作为state这次计算的结果。
  return STATE.agentColorMap
}

// getFlagSettingsPath 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFlagSettingsPath(): string | undefined {
  // 返回 `STATE.flagSettingsPath`，作为state这次计算的结果。
  return STATE.flagSettingsPath
}

// setFlagSettingsPath 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setFlagSettingsPath(path: string | undefined): void {
  // flagSettingsPath 路径数据更新为 `path`，确保state后续读取最新状态。
  STATE.flagSettingsPath = path
}

// getFlagSettingsInline 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFlagSettingsInline(): Record<string, unknown> | null {
  // 返回 `STATE.flagSettingsInline`，作为state这次计算的结果。
  return STATE.flagSettingsInline
}

// setFlagSettingsInline 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setFlagSettingsInline(
  settings: Record<string, unknown> | null,
): void {
  // flagSettingsInline更新为 `settings`，确保state后续读取最新状态。
  STATE.flagSettingsInline = settings
}

// getSessionIngressToken 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionIngressToken(): string | null | undefined {
  // 返回 `STATE.sessionIngressToken`，作为state这次计算的结果。
  return STATE.sessionIngressToken
}

// setSessionIngressToken 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionIngressToken(token: string | null): void {
  // sessionIngressToken 会话数据更新为 `token`，确保state后续读取最新状态。
  STATE.sessionIngressToken = token
}

// getOauthTokenFromFd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOauthTokenFromFd(): string | null | undefined {
  // 返回 `STATE.oauthTokenFromFd`，作为state这次计算的结果。
  return STATE.oauthTokenFromFd
}

// setOauthTokenFromFd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setOauthTokenFromFd(token: string | null): void {
  // oauthTokenFromFd更新为 `token`，确保state后续读取最新状态。
  STATE.oauthTokenFromFd = token
}

// getApiKeyFromFd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getApiKeyFromFd(): string | null | undefined {
  // 返回 `STATE.apiKeyFromFd`，作为state这次计算的结果。
  return STATE.apiKeyFromFd
}

// setApiKeyFromFd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setApiKeyFromFd(key: string | null): void {
  // apiKeyFromFd更新为 `key`，确保state后续读取最新状态。
  STATE.apiKeyFromFd = key
}

// setLastAPIRequest 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastAPIRequest(
  params: Omit<BetaMessageStreamParams, 'messages'> | null,
): void {
  // lastAPIRequest 请求数据更新为 `params`，确保state后续读取最新状态。
  STATE.lastAPIRequest = params
}

// getLastAPIRequest 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastAPIRequest(): Omit<
  BetaMessageStreamParams,
  'messages'
> | null {
  // 返回 `STATE.lastAPIRequest`，作为state这次计算的结果。
  return STATE.lastAPIRequest
}

// setLastAPIRequestMessages 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastAPIRequestMessages(
  messages: BetaMessageStreamParams['messages'] | null,
): void {
  // lastAPIRequestMessages 消息数据更新为 `messages`，确保state后续读取最新状态。
  STATE.lastAPIRequestMessages = messages
}

// getLastAPIRequestMessages 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastAPIRequestMessages():
  | BetaMessageStreamParams['messages']
  | null {
  // 返回 `STATE.lastAPIRequestMessages`，作为state这次计算的结果。
  return STATE.lastAPIRequestMessages
}

// setLastClassifierRequests 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastClassifierRequests(requests: unknown[] | null): void {
  // lastClassifierRequests 请求数据更新为 `requests`，确保state后续读取最新状态。
  STATE.lastClassifierRequests = requests
}

// getLastClassifierRequests 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastClassifierRequests(): unknown[] | null {
  // 返回 `STATE.lastClassifierRequests`，作为state这次计算的结果。
  return STATE.lastClassifierRequests
}

// setCachedClaudeMdContent 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCachedClaudeMdContent(content: string | null): void {
  // cachedClaudeMdContent 缓存更新为 `content`，确保state后续读取最新状态。
  STATE.cachedClaudeMdContent = content
}

// getCachedClaudeMdContent 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCachedClaudeMdContent(): string | null {
  // 返回 `STATE.cachedClaudeMdContent`，作为state这次计算的结果。
  return STATE.cachedClaudeMdContent
}

// addToInMemoryErrorLog 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addToInMemoryErrorLog(errorInfo: {
  error: string
  timestamp: string
}): void {
  // MAX_IN_MEMORY_ERRORS 错误信息保存`100`，供state后续判断或输出使用。
  const MAX_IN_MEMORY_ERRORS = 100
  // 满足 `STATE.inMemoryErrorLog.length >= MAX_IN_MEMORY_ER` 时，state执行该分支。
  if (STATE.inMemoryErrorLog.length >= MAX_IN_MEMORY_ERRORS) {
    // 调用 STATE.inMemoryErrorLog.shift，触发state此处需要的副作用。
    STATE.inMemoryErrorLog.shift() // Remove oldest error
  }
  // inMemoryErrorLog 错误信息追加新条目，保持收集顺序与输入顺序一致。
  STATE.inMemoryErrorLog.push(errorInfo)
}

// getAllowedSettingSources 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllowedSettingSources(): SettingSource[] {
  // 返回 `STATE.allowedSettingSources`，作为state这次计算的结果。
  return STATE.allowedSettingSources
}

// setAllowedSettingSources 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAllowedSettingSources(sources: SettingSource[]): void {
  // allowedSettingSources 集合更新为 `sources`，确保state后续读取最新状态。
  STATE.allowedSettingSources = sources
}

// preferThirdPartyAuthentication 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function preferThirdPartyAuthentication(): boolean {
  // IDE extension should behave as 1P for authentication reasons.
  // 返回 `getIsNonInteractiveSession() && STATE.clientType !== 'claude-vscode'`，作为state这次计算的结果。
  return getIsNonInteractiveSession() && STATE.clientType !== 'claude-vscode'
}

// setInlinePlugins 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setInlinePlugins(plugins: Array<string>): void {
  // inlinePlugins 插件数据更新为 `plugins`，确保state后续读取最新状态。
  STATE.inlinePlugins = plugins
}

// getInlinePlugins 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInlinePlugins(): Array<string> {
  // 返回 `STATE.inlinePlugins`，作为state这次计算的结果。
  return STATE.inlinePlugins
}

// setChromeFlagOverride 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setChromeFlagOverride(value: boolean | undefined): void {
  // chromeFlagOverride更新为 `value`，确保state后续读取最新状态。
  STATE.chromeFlagOverride = value
}

// getChromeFlagOverride 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getChromeFlagOverride(): boolean | undefined {
  // 返回 `STATE.chromeFlagOverride`，作为state这次计算的结果。
  return STATE.chromeFlagOverride
}

// setUseCoworkPlugins 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setUseCoworkPlugins(value: boolean): void {
  // useCoworkPlugins 插件数据更新为 `value`，确保state后续读取最新状态。
  STATE.useCoworkPlugins = value
  // 调用 resetSettingsCache，触发state此处需要的副作用。
  resetSettingsCache()
}

// getUseCoworkPlugins 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUseCoworkPlugins(): boolean {
  // 返回 `STATE.useCoworkPlugins`，作为state这次计算的结果。
  return STATE.useCoworkPlugins
}

// setSessionBypassPermissionsMode 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionBypassPermissionsMode(enabled: boolean): void {
  // sessionBypassPermissionsMode 权限数据更新为 `enabled`，确保state后续读取最新状态。
  STATE.sessionBypassPermissionsMode = enabled
}

// getSessionBypassPermissionsMode 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionBypassPermissionsMode(): boolean {
  // 返回 `STATE.sessionBypassPermissionsMode`，作为state这次计算的结果。
  return STATE.sessionBypassPermissionsMode
}

// setScheduledTasksEnabled 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setScheduledTasksEnabled(enabled: boolean): void {
  // scheduledTasksEnabled更新为 `enabled`，确保state后续读取最新状态。
  STATE.scheduledTasksEnabled = enabled
}

// getScheduledTasksEnabled 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getScheduledTasksEnabled(): boolean {
  // 返回 `STATE.scheduledTasksEnabled`，作为state这次计算的结果。
  return STATE.scheduledTasksEnabled
}

// SessionCronTask 固化state里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionCronTask = {
  id: string
  cron: string
  prompt: string
  createdAt: number
  recurring?: boolean
  /**
   * When set, the task was created by an in-process teammate (not the team lead).
   * The scheduler routes fires to that teammate's pendingUserMessages queue
   * instead of the main REPL command queue. Session-only — never written to disk.
   */
  agentId?: string
}

// getSessionCronTasks 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionCronTasks(): SessionCronTask[] {
  // 返回 `STATE.sessionCronTasks`，作为state这次计算的结果。
  return STATE.sessionCronTasks
}

// addSessionCronTask 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addSessionCronTask(task: SessionCronTask): void {
  // sessionCronTasks 会话数据追加新条目，保持收集顺序与输入顺序一致。
  STATE.sessionCronTasks.push(task)
}

/**
 * Returns the number of tasks actually removed. Callers use this to skip
 * downstream work (e.g. the disk read in removeCronTasks) when all ids
 * were accounted for here.
 */
// removeSessionCronTasks 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeSessionCronTasks(ids: readonly string[]): number {
  // ids 集合为空时立即返回或跳过，避免state把空集合当成可处理内容。
  if (ids.length === 0) return 0
  // idSet保存`Set`，供state后续处理使用。
  const idSet = new Set(ids)
  // remaining筛选`sessionCronTasks.filter`，供state后续处理使用。
  const remaining = STATE.sessionCronTasks.filter(t => !idSet.has(t.id))
  // removed记录 `STATE.sessionCronTasks.length - remaining.length` 是否成立，下一步按该结果分支。
  const removed = STATE.sessionCronTasks.length - remaining.length
  // 满足 `removed === 0` 时，state执行该分支。
  if (removed === 0) return 0
  // sessionCronTasks 会话数据更新为 `remaining`，确保state后续读取最新状态。
  STATE.sessionCronTasks = remaining
  // 返回 `removed`，作为state这次计算的结果。
  return removed
}

// setSessionTrustAccepted 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionTrustAccepted(accepted: boolean): void {
  // sessionTrustAccepted 会话数据更新为 `accepted`，确保state后续读取最新状态。
  STATE.sessionTrustAccepted = accepted
}

// getSessionTrustAccepted 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionTrustAccepted(): boolean {
  // 返回 `STATE.sessionTrustAccepted`，作为state这次计算的结果。
  return STATE.sessionTrustAccepted
}

// setSessionPersistenceDisabled 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSessionPersistenceDisabled(disabled: boolean): void {
  // sessionPersistenceDisabled 会话数据更新为 `disabled`，确保state后续读取最新状态。
  STATE.sessionPersistenceDisabled = disabled
}

// isSessionPersistenceDisabled 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSessionPersistenceDisabled(): boolean {
  // 返回 `STATE.sessionPersistenceDisabled`，作为state这次计算的结果。
  return STATE.sessionPersistenceDisabled
}

// hasExitedPlanModeInSession 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasExitedPlanModeInSession(): boolean {
  // 返回 `STATE.hasExitedPlanMode`，作为state这次计算的结果。
  return STATE.hasExitedPlanMode
}

// setHasExitedPlanMode 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setHasExitedPlanMode(value: boolean): void {
  // hasExitedPlanMode更新为 `value`，确保state后续读取最新状态。
  STATE.hasExitedPlanMode = value
}

// needsPlanModeExitAttachment 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function needsPlanModeExitAttachment(): boolean {
  // 返回 `STATE.needsPlanModeExitAttachment`，作为state这次计算的结果。
  return STATE.needsPlanModeExitAttachment
}

// setNeedsPlanModeExitAttachment 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setNeedsPlanModeExitAttachment(value: boolean): void {
  // needsPlanModeExitAttachment更新为 `value`，确保state后续读取最新状态。
  STATE.needsPlanModeExitAttachment = value
}

// handlePlanModeTransition 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handlePlanModeTransition(
  fromMode: string,
  toMode: string,
): void {
  // If switching TO plan mode, clear any pending exit attachment
  // This prevents sending both plan_mode and plan_mode_exit when user toggles quickly
  // 当 `toMode` 匹配 `'plan' && fromMode !== 'pla...` 时，state执行对应分支。
  if (toMode === 'plan' && fromMode !== 'plan') {
    // needsPlanModeExitAttachment更新为 `false`，确保state后续读取最新状态。
    STATE.needsPlanModeExitAttachment = false
  }

  // If switching out of plan mode, trigger the plan_mode_exit attachment
  // 当 `fromMode` 匹配 `'plan' && toMode !== 'plan'` 时，state执行对应分支。
  if (fromMode === 'plan' && toMode !== 'plan') {
    // needsPlanModeExitAttachment更新为 `true`，确保state后续读取最新状态。
    STATE.needsPlanModeExitAttachment = true
  }
}

// needsAutoModeExitAttachment 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function needsAutoModeExitAttachment(): boolean {
  // 返回 `STATE.needsAutoModeExitAttachment`，作为state这次计算的结果。
  return STATE.needsAutoModeExitAttachment
}

// setNeedsAutoModeExitAttachment 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setNeedsAutoModeExitAttachment(value: boolean): void {
  // needsAutoModeExitAttachment更新为 `value`，确保state后续读取最新状态。
  STATE.needsAutoModeExitAttachment = value
}

// handleAutoModeTransition 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleAutoModeTransition(
  fromMode: string,
  toMode: string,
): void {
  // Auto↔plan transitions are handled by prepareContextForPlanMode (auto may
  // stay active through plan if opted in) and ExitPlanMode (restores mode).
  // Skip both directions so this function only handles direct auto transitions.
  // state在这里进入条件判断，后续代码按实际状态分流。
  if (
    (fromMode === 'auto' && toMode === 'plan') ||
    (fromMode === 'plan' && toMode === 'auto')
  ) {
    // state在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // fromIsAuto标记state是否启用对应路径。
  const fromIsAuto = fromMode === 'auto'
  // toIsAuto标记state是否启用对应路径。
  const toIsAuto = toMode === 'auto'

  // If switching TO auto mode, clear any pending exit attachment
  // This prevents sending both auto_mode and auto_mode_exit when user toggles quickly
  // 组合条件 `toIsAuto && !fromIsAuto` 成立时，state才启用这条专门路径。
  if (toIsAuto && !fromIsAuto) {
    // needsAutoModeExitAttachment更新为 `false`，确保state后续读取最新状态。
    STATE.needsAutoModeExitAttachment = false
  }

  // If switching out of auto mode, trigger the auto_mode_exit attachment
  // 组合条件 `fromIsAuto && !toIsAuto` 成立时，state才启用这条专门路径。
  if (fromIsAuto && !toIsAuto) {
    // needsAutoModeExitAttachment更新为 `true`，确保state后续读取最新状态。
    STATE.needsAutoModeExitAttachment = true
  }
}

// LSP plugin recommendation session tracking
// hasShownLspRecommendationThisSession 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasShownLspRecommendationThisSession(): boolean {
  // 返回 `STATE.lspRecommendationShownThisSession`，作为state这次计算的结果。
  return STATE.lspRecommendationShownThisSession
}

// setLspRecommendationShownThisSession 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLspRecommendationShownThisSession(value: boolean): void {
  // lspRecommendationShownThisSession 会话数据更新为 `value`，确保state后续读取最新状态。
  STATE.lspRecommendationShownThisSession = value
}

// SDK init event state
// setInitJsonSchema 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setInitJsonSchema(schema: Record<string, unknown>): void {
  // initJsonSchema更新为 `schema`，确保state后续读取最新状态。
  STATE.initJsonSchema = schema
}

// getInitJsonSchema 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInitJsonSchema(): Record<string, unknown> | null {
  // 返回 `STATE.initJsonSchema`，作为state这次计算的结果。
  return STATE.initJsonSchema
}

// registerHookCallbacks 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerHookCallbacks(
  hooks: Partial<Record<HookEvent, RegisteredHookMatcher[]>>,
): void {
  // STATE.registeredHooks 状态缺失时提前走兜底路径，避免state继续依赖无效输入。
  if (!STATE.registeredHooks) {
    // registeredHooks 集合更新为 `{}`，确保state后续读取最新状态。
    STATE.registeredHooks = {}
  }

  // `registerHookCallbacks` may be called multiple times, so we need to merge (not overwrite)
  // 循环处理 `const [event, matchers] of Object.entries(hooks)`，让state把同类条目按顺序走完。
  for (const [event, matchers] of Object.entries(hooks)) {
    // eventKey 命名 `event as HookEvent`，让后续代码直接表达这个值的用途。
    const eventKey = event as HookEvent
    // 满足 `!STATE.registeredHooks[eventKey]` 时，state执行该分支。
    if (!STATE.registeredHooks[eventKey]) {
      // registeredHooks[eventKey更新为 `[]`，确保state后续读取最新状态。
      STATE.registeredHooks[eventKey] = []
    }
    // state在这里处理 `STATE.registeredHooks[eventKey]!.push(...matchers)`，完成这一小步状态转换。
    STATE.registeredHooks[eventKey]!.push(...matchers)
  }
}

// getRegisteredHooks 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRegisteredHooks(): Partial<
  Record<HookEvent, RegisteredHookMatcher[]>
> | null {
  // 返回 `STATE.registeredHooks`，作为state这次计算的结果。
  return STATE.registeredHooks
}

// clearRegisteredHooks 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearRegisteredHooks(): void {
  // registeredHooks 集合更新为 `null`，确保state后续读取最新状态。
  STATE.registeredHooks = null
}

// clearRegisteredPluginHooks 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearRegisteredPluginHooks(): void {
  // STATE.registeredHooks 状态缺失时提前走兜底路径，避免state继续依赖无效输入。
  if (!STATE.registeredHooks) {
    // state在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // filtered 从空对象开始收集键值，后续按名称补齐内容。
  const filtered: Partial<Record<HookEvent, RegisteredHookMatcher[]>> = {}
  // 循环处理 `const [event, matchers] of Object.entries(STATE.registeredHooks)`，让state把同类条目按顺序走完。
  for (const [event, matchers] of Object.entries(STATE.registeredHooks)) {
    // Keep only callback hooks (those without pluginRoot)
    // callbackHooks 集合筛选`matchers.filter`，供state后续处理使用。
    const callbackHooks = matchers.filter(m => !('pluginRoot' in m))
    // 满足 `callbackHooks.length > 0` 时，state执行该分支。
    if (callbackHooks.length > 0) {
      // filtered[event as HookEvent更新为 `callbackHooks`，确保state后续读取最新状态。
      filtered[event as HookEvent] = callbackHooks
    }
  }

  // registeredHooks 集合更新为 `Object.keys(filtered).length > 0 ? filtered : null`，确保state后续读取最新状态。
  STATE.registeredHooks = Object.keys(filtered).length > 0 ? filtered : null
}

// resetSdkInitState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function resetSdkInitState(): void {
  // initJsonSchema更新为 `null`，确保state后续读取最新状态。
  STATE.initJsonSchema = null
  // registeredHooks 集合更新为 `null`，确保state后续读取最新状态。
  STATE.registeredHooks = null
}

// getPlanSlugCache 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlanSlugCache(): Map<string, string> {
  // 返回 `STATE.planSlugCache`，作为state这次计算的结果。
  return STATE.planSlugCache
}

// getSessionCreatedTeams 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSessionCreatedTeams(): Set<string> {
  // 返回 `STATE.sessionCreatedTeams`，作为state这次计算的结果。
  return STATE.sessionCreatedTeams
}

// Teleported session tracking for reliability logging
// setTeleportedSessionInfo 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setTeleportedSessionInfo(info: {
  sessionId: string | null
}): void {
  // teleportedSessionInfo 会话数据更新为 `{`，确保state后续读取最新状态。
  STATE.teleportedSessionInfo = {
    isTeleported: true,
    hasLoggedFirstMessage: false,
    sessionId: info.sessionId,
  }
}

// getTeleportedSessionInfo 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeleportedSessionInfo(): {
  isTeleported: boolean
  hasLoggedFirstMessage: boolean
  sessionId: string | null
} | null {
  // 返回 `STATE.teleportedSessionInfo`，作为state这次计算的结果。
  return STATE.teleportedSessionInfo
}

// markFirstTeleportMessageLogged 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markFirstTeleportMessageLogged(): void {
  // 满足 `STATE.teleportedSessionInfo` 时，state执行该分支。
  if (STATE.teleportedSessionInfo) {
    // 更新为 `true`，确保state后续读取最新状态。
    STATE.teleportedSessionInfo.hasLoggedFirstMessage = true
  }
}

// Invoked skills tracking for preservation across compaction
// InvokedSkillInfo 固化state里传递的数据形状，帮助调用方按同一结构读写字段。
export type InvokedSkillInfo = {
  skillName: string
  skillPath: string
  content: string
  invokedAt: number
  agentId: string | null
}

// addInvokedSkill 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addInvokedSkill(
  skillName: string,
  skillPath: string,
  content: string,
  agentId: string | null = null,
): void {
  // key 命名 ``${agentId ?? ''}:${skillName}``，让后续代码直接表达这个值的用途。
  const key = `${agentId ?? ''}:${skillName}`
  // STATE.invokedSkills.set 写入新的状态值，使state后续读取保持一致。
  STATE.invokedSkills.set(key, {
    skillName,
    skillPath,
    content,
    invokedAt: Date.now(),
    agentId,
  })
}

// getInvokedSkills 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInvokedSkills(): Map<string, InvokedSkillInfo> {
  // 返回 `STATE.invokedSkills`，作为state这次计算的结果。
  return STATE.invokedSkills
}

// getInvokedSkillsForAgent 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getInvokedSkillsForAgent(
  agentId: string | undefined | null,
): Map<string, InvokedSkillInfo> {
  // normalizedId保存`agentId ?? null`，供后续判断或组装使用。
  const normalizedId = agentId ?? null
  // filtered构建`new Map<string, InvokedSkillInfo>()` 整理出中间结果，供state后续步骤使用。
  const filtered = new Map<string, InvokedSkillInfo>()
  // 循环处理 `const [key, skill] of STATE.invokedSkills`，让state逐项把同类条目按顺序走完。
  for (const [key, skill] of STATE.invokedSkills) {
    // 满足 `skill.agentId === normalizedId` 时，state执行该分支。
    if (skill.agentId === normalizedId) {
      // filtered.set 写入新的状态值，使state后续读取保持一致。
      filtered.set(key, skill)
    }
  }
  // 返回 `filtered`，作为state这次计算的结果。
  return filtered
}

// clearInvokedSkills 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearInvokedSkills(
  preservedAgentIds?: ReadonlySet<string>,
): void {
  // 组合条件 `!preservedAgentIds || preservedAgentIds.size === 0` 成立时，state才启用这条专门路径。
  if (!preservedAgentIds || preservedAgentIds.size === 0) {
    // 调用 STATE.invokedSkills.clear，触发state此处需要的副作用。
    STATE.invokedSkills.clear()
    // state在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 循环处理 `const [key, skill] of STATE.invokedSkills`，让state逐项把同类条目按顺序走完。
  for (const [key, skill] of STATE.invokedSkills) {
    // 组合条件 `skill.agentId === null || !preservedAgentIds.has(skill.agentId)` 成立时，state才启用这条专门路径。
    if (skill.agentId === null || !preservedAgentIds.has(skill.agentId)) {
      // 调用 STATE.invokedSkills.delete，触发state此处需要的副作用。
      STATE.invokedSkills.delete(key)
    }
  }
}

// clearInvokedSkillsForAgent 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearInvokedSkillsForAgent(agentId: string): void {
  // 循环处理 `const [key, skill] of STATE.invokedSkills`，让state逐项把同类条目按顺序走完。
  for (const [key, skill] of STATE.invokedSkills) {
    // 满足 `skill.agentId === agentId` 时，state执行该分支。
    if (skill.agentId === agentId) {
      // 调用 STATE.invokedSkills.delete，触发state此处需要的副作用。
      STATE.invokedSkills.delete(key)
    }
  }
}

// Slow operations tracking for dev bar
// MAX_SLOW_OPERATIONS 集合保存`10`，供state后续判断或输出使用。
const MAX_SLOW_OPERATIONS = 10
// SLOW_OPERATION_TTL_MS 集合 命名 `10000`，让后续代码直接表达这个值的用途。
const SLOW_OPERATION_TTL_MS = 10000

// addSlowOperation 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addSlowOperation(operation: string, durationMs: number): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') return
  // Skip tracking for editor sessions (user editing a prompt file in $EDITOR)
  // These are intentionally slow since the user is drafting text
  // 组合条件 `operation.includes('exec') && operation.includes('claude-prompt-')` 成立时，state才启用这条专门路径。
  if (operation.includes('exec') && operation.includes('claude-prompt-')) {
    // state在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // now记录时间`Date.now`，供state后续处理使用。
  const now = Date.now()
  // Remove stale operations
  // slowOperations 集合更新为 `STATE.slowOperations.filter(`，确保state后续读取最新状态。
  STATE.slowOperations = STATE.slowOperations.filter(
    // op更新为 `> now - op.timestamp < SLOW_OPERATION_TTL_MS`，确保state后续读取最新状态。
    op => now - op.timestamp < SLOW_OPERATION_TTL_MS,
  )
  // Add new operation
  // slowOperations 集合追加新条目，保持收集顺序与输入顺序一致。
  STATE.slowOperations.push({ operation, durationMs, timestamp: now })
  // Keep only the most recent operations
  // 满足 `STATE.slowOperations.length > MAX_SLOW_OPERATIONS` 时，state执行该分支。
  if (STATE.slowOperations.length > MAX_SLOW_OPERATIONS) {
    // slowOperations 集合更新为 `STATE.slowOperations.slice(-MAX_SLOW_OPERATIONS)`，确保state后续读取最新状态。
    STATE.slowOperations = STATE.slowOperations.slice(-MAX_SLOW_OPERATIONS)
  }
}

// EMPTY_SLOW_OPERATIONS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const EMPTY_SLOW_OPERATIONS: ReadonlyArray<{
  operation: string
  durationMs: number
  timestamp: number
}> = []

// getSlowOperations 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSlowOperations(): ReadonlyArray<{
  operation: string
  durationMs: number
  timestamp: number
}> {
  // Most common case: nothing tracked. Return a stable reference so the
  // caller's setState() can bail via Object.is instead of re-rendering at 2fps.
  // STATE.slowOperations 状态为空时立即返回或跳过，避免state把空集合当成可处理内容。
  if (STATE.slowOperations.length === 0) {
    // 返回 `EMPTY_SLOW_OPERATIONS`，作为state这次计算的结果。
    return EMPTY_SLOW_OPERATIONS
  }
  // now记录时间`Date.now`，供state后续处理使用。
  const now = Date.now()
  // Only allocate a new array when something actually expired; otherwise keep
  // the reference stable across polls while ops are still fresh.
  // state在这里进入条件判断，后续代码按实际状态分流。
  if (
    // 调用 STATE.slowOperations.some，触发state此处需要的副作用。
    STATE.slowOperations.some(op => now - op.timestamp >= SLOW_OPERATION_TTL_MS)
  ) {
    // slowOperations 集合更新为 `STATE.slowOperations.filter(`，确保state后续读取最新状态。
    STATE.slowOperations = STATE.slowOperations.filter(
      // op更新为 `> now - op.timestamp < SLOW_OPERATION_TTL_MS`，确保state后续读取最新状态。
      op => now - op.timestamp < SLOW_OPERATION_TTL_MS,
    )
    // STATE.slowOperations 状态为空时立即返回或跳过，避免state把空集合当成可处理内容。
    if (STATE.slowOperations.length === 0) {
      // 返回 `EMPTY_SLOW_OPERATIONS`，作为state这次计算的结果。
      return EMPTY_SLOW_OPERATIONS
    }
  }
  // Safe to return directly: addSlowOperation() reassigns STATE.slowOperations
  // before pushing, so the array held in React state is never mutated.
  // 返回 `STATE.slowOperations`，作为state这次计算的结果。
  return STATE.slowOperations
}

// getMainThreadAgentType 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMainThreadAgentType(): string | undefined {
  // 返回 `STATE.mainThreadAgentType`，作为state这次计算的结果。
  return STATE.mainThreadAgentType
}

// setMainThreadAgentType 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMainThreadAgentType(agentType: string | undefined): void {
  // mainThreadAgentType更新为 `agentType`，确保state后续读取最新状态。
  STATE.mainThreadAgentType = agentType
}

// getIsRemoteMode 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getIsRemoteMode(): boolean {
  // 返回 `STATE.isRemoteMode`，作为state这次计算的结果。
  return STATE.isRemoteMode
}

// setIsRemoteMode 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setIsRemoteMode(value: boolean): void {
  // isRemoteMode更新为 `value`，确保state后续读取最新状态。
  STATE.isRemoteMode = value
}

// System prompt section accessors

// getSystemPromptSectionCache 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSystemPromptSectionCache(): Map<string, string | null> {
  // 返回 `STATE.systemPromptSectionCache`，作为state这次计算的结果。
  return STATE.systemPromptSectionCache
}

// setSystemPromptSectionCacheEntry 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setSystemPromptSectionCacheEntry(
  name: string,
  value: string | null,
): void {
  // STATE.systemPromptSectionCache.set 写入新的状态值，使state后续读取保持一致。
  STATE.systemPromptSectionCache.set(name, value)
}

// clearSystemPromptSectionState 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearSystemPromptSectionState(): void {
  // 调用 STATE.systemPromptSectionCache.clear，触发state此处需要的副作用。
  STATE.systemPromptSectionCache.clear()
}

// Last emitted date accessors (for detecting midnight date changes)

// getLastEmittedDate 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLastEmittedDate(): string | null {
  // 返回 `STATE.lastEmittedDate`，作为state这次计算的结果。
  return STATE.lastEmittedDate
}

// setLastEmittedDate 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setLastEmittedDate(date: string | null): void {
  // lastEmittedDate更新为 `date`，确保state后续读取最新状态。
  STATE.lastEmittedDate = date
}

// getAdditionalDirectoriesForClaudeMd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAdditionalDirectoriesForClaudeMd(): string[] {
  // 返回 `STATE.additionalDirectoriesForClaudeMd`，作为state这次计算的结果。
  return STATE.additionalDirectoriesForClaudeMd
}

// setAdditionalDirectoriesForClaudeMd 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAdditionalDirectoriesForClaudeMd(
  directories: string[],
): void {
  // additionalDirectoriesForClaudeMd更新为 `directories`，确保state后续读取最新状态。
  STATE.additionalDirectoriesForClaudeMd = directories
}

// getAllowedChannels 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllowedChannels(): ChannelEntry[] {
  // 返回 `STATE.allowedChannels`，作为state这次计算的结果。
  return STATE.allowedChannels
}

// setAllowedChannels 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAllowedChannels(entries: ChannelEntry[]): void {
  // allowedChannels 集合更新为 `entries`，确保state后续读取最新状态。
  STATE.allowedChannels = entries
}

// getHasDevChannels 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHasDevChannels(): boolean {
  // 返回 `STATE.hasDevChannels`，作为state这次计算的结果。
  return STATE.hasDevChannels
}

// setHasDevChannels 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setHasDevChannels(value: boolean): void {
  // hasDevChannels 集合更新为 `value`，确保state后续读取最新状态。
  STATE.hasDevChannels = value
}

// getPromptCache1hAllowlist 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPromptCache1hAllowlist(): string[] | null {
  // 返回 `STATE.promptCache1hAllowlist`，作为state这次计算的结果。
  return STATE.promptCache1hAllowlist
}

// setPromptCache1hAllowlist 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPromptCache1hAllowlist(allowlist: string[] | null): void {
  // promptCache1hAllowlist 缓存更新为 `allowlist`，确保state后续读取最新状态。
  STATE.promptCache1hAllowlist = allowlist
}

// getPromptCache1hEligible 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPromptCache1hEligible(): boolean | null {
  // 返回 `STATE.promptCache1hEligible`，作为state这次计算的结果。
  return STATE.promptCache1hEligible
}

// setPromptCache1hEligible 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPromptCache1hEligible(eligible: boolean | null): void {
  // promptCache1hEligible 缓存更新为 `eligible`，确保state后续读取最新状态。
  STATE.promptCache1hEligible = eligible
}

// getAfkModeHeaderLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAfkModeHeaderLatched(): boolean | null {
  // 返回 `STATE.afkModeHeaderLatched`，作为state这次计算的结果。
  return STATE.afkModeHeaderLatched
}

// setAfkModeHeaderLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAfkModeHeaderLatched(v: boolean): void {
  // afkModeHeaderLatched更新为 `v`，确保state后续读取最新状态。
  STATE.afkModeHeaderLatched = v
}

// getFastModeHeaderLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFastModeHeaderLatched(): boolean | null {
  // 返回 `STATE.fastModeHeaderLatched`，作为state这次计算的结果。
  return STATE.fastModeHeaderLatched
}

// setFastModeHeaderLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setFastModeHeaderLatched(v: boolean): void {
  // fastModeHeaderLatched更新为 `v`，确保state后续读取最新状态。
  STATE.fastModeHeaderLatched = v
}

// getCacheEditingHeaderLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCacheEditingHeaderLatched(): boolean | null {
  // 返回 `STATE.cacheEditingHeaderLatched`，作为state这次计算的结果。
  return STATE.cacheEditingHeaderLatched
}

// setCacheEditingHeaderLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setCacheEditingHeaderLatched(v: boolean): void {
  // cacheEditingHeaderLatched 缓存更新为 `v`，确保state后续读取最新状态。
  STATE.cacheEditingHeaderLatched = v
}

// getThinkingClearLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getThinkingClearLatched(): boolean | null {
  // 返回 `STATE.thinkingClearLatched`，作为state这次计算的结果。
  return STATE.thinkingClearLatched
}

// setThinkingClearLatched 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setThinkingClearLatched(v: boolean): void {
  // thinkingClearLatched更新为 `v`，确保state后续读取最新状态。
  STATE.thinkingClearLatched = v
}

/**
 * Reset beta header latches to null. Called on /clear and /compact so a
 * fresh conversation gets fresh header evaluation.
 */
// clearBetaHeaderLatches 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearBetaHeaderLatches(): void {
  // afkModeHeaderLatched更新为 `null`，确保state后续读取最新状态。
  STATE.afkModeHeaderLatched = null
  // fastModeHeaderLatched更新为 `null`，确保state后续读取最新状态。
  STATE.fastModeHeaderLatched = null
  // cacheEditingHeaderLatched 缓存更新为 `null`，确保state后续读取最新状态。
  STATE.cacheEditingHeaderLatched = null
  // thinkingClearLatched更新为 `null`，确保state后续读取最新状态。
  STATE.thinkingClearLatched = null
}

// getPromptId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPromptId(): string | null {
  // 返回 `STATE.promptId`，作为state这次计算的结果。
  return STATE.promptId
}

// setPromptId 封装state的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setPromptId(id: string | null): void {
  // promptId更新为 `id`，确保state后续读取最新状态。
  STATE.promptId = id
}

