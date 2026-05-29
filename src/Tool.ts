// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  ToolResultBlockParam,
  ToolUseBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  ElicitRequestURLParams,
  ElicitResult,
} from '@modelcontextprotocol/sdk/types.js'
// 类型依赖 { UUID } 来自 crypto，用于校准工具协议定义的数据契约。
import type { UUID } from 'crypto'
// 类型依赖 { z } 来自 zod/v4，用于校准工具协议定义的数据契约。
import type { z } from 'zod/v4'
// 类型依赖 { Command } 来自 ./commands.js，用于校准工具协议定义的数据契约。
import type { Command } from './commands.js'
// 类型依赖 { CanUseToolFn } 来自 ./hooks/useCanUseTool.js，用于校准工具协议定义的数据契约。
import type { CanUseToolFn } from './hooks/useCanUseTool.js'
// 类型依赖 { ThinkingConfig } 来自 ./utils/thinking.js，用于校准工具协议定义的数据契约。
import type { ThinkingConfig } from './utils/thinking.js'

// ToolInputJSONSchema 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolInputJSONSchema = {
  [x: string]: unknown
  type: 'object'
  properties?: {
    [x: string]: unknown
  }
}

// 类型依赖 { Notification } 来自 ./context/notifications.js，用于校准工具协议定义的数据契约。
import type { Notification } from './context/notifications.js'
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  MCPServerConnection,
  ServerResource,
} from './services/mcp/types.js'
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  AgentDefinition,
  AgentDefinitionsResult,
} from './tools/AgentTool/loadAgentsDir.js'
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  AttachmentMessage,
  Message,
  ProgressMessage,
  SystemLocalCommandMessage,
  SystemMessage,
  UserMessage,
} from './types/message.js'
// Import permission types from centralized location to break import cycles
// Import PermissionResult from centralized location to break import cycles
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  AdditionalWorkingDirectory,
  PermissionMode,
  PermissionResult,
} from './types/permissions.js'
// Import tool progress types from centralized location to break import cycles
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  AgentToolProgress,
  BashProgress,
  MCPProgress,
  REPLToolProgress,
  SkillToolProgress,
  TaskOutputProgress,
  ToolProgressData,
  WebSearchProgress,
} from './types/tools.js'
// 类型依赖 { FileStateCache } 来自 ./utils/fileStateCache.js，用于校准工具协议定义的数据契约。
import type { FileStateCache } from './utils/fileStateCache.js'
// 类型依赖 { DenialTrackingState } 来自 ./utils/permissions/denialTracking.js，用于校准工具协议定义的数据契约。
import type { DenialTrackingState } from './utils/permissions/denialTracking.js'
// 类型依赖 { SystemPrompt } 来自 ./utils/systemPromptType.js，用于校准工具协议定义的数据契约。
import type { SystemPrompt } from './utils/systemPromptType.js'
// 类型依赖 { ContentReplacementState } 来自 ./utils/toolResultStorage.js，用于校准工具协议定义的数据契约。
import type { ContentReplacementState } from './utils/toolResultStorage.js'

// Re-export progress types for backwards compatibility
// 导出类型定义，让其他模块沿用工具协议定义的数据契约。
export type {
  AgentToolProgress,
  BashProgress,
  MCPProgress,
  REPLToolProgress,
  SkillToolProgress,
  TaskOutputProgress,
  WebSearchProgress,
}

// 类型依赖 { SpinnerMode } 来自 ./components/Spinner.js，用于校准工具协议定义的数据契约。
import type { SpinnerMode } from './components/Spinner.js'
// 类型依赖 { QuerySource } 来自 ./constants/querySource.js，用于校准工具协议定义的数据契约。
import type { QuerySource } from './constants/querySource.js'
// 类型依赖 { SDKStatus } 来自 ./entrypoints/agentSdkTypes.js，用于校准工具协议定义的数据契约。
import type { SDKStatus } from './entrypoints/agentSdkTypes.js'
// 类型依赖 { AppState } 来自 ./state/AppState.js，用于校准工具协议定义的数据契约。
import type { AppState } from './state/AppState.js'
// 整理这一组导入，让工具协议定义后续逻辑可以直接复用这些外部能力。
import type {
  HookProgress,
  PromptRequest,
  PromptResponse,
} from './types/hooks.js'
// 类型依赖 { AgentId } 来自 ./types/ids.js，用于校准工具协议定义的数据契约。
import type { AgentId } from './types/ids.js'
// 类型依赖 { DeepImmutable } 来自 ./types/utils.js，用于校准工具协议定义的数据契约。
import type { DeepImmutable } from './types/utils.js'
// 类型依赖 { AttributionState } 来自 ./utils/commitAttribution.js，用于校准工具协议定义的数据契约。
import type { AttributionState } from './utils/commitAttribution.js'
// 类型依赖 { FileHistoryState } 来自 ./utils/fileHistory.js，用于校准工具协议定义的数据契约。
import type { FileHistoryState } from './utils/fileHistory.js'
// 类型依赖 { Theme, ThemeName } 来自 ./utils/theme.js，用于校准工具协议定义的数据契约。
import type { Theme, ThemeName } from './utils/theme.js'

// QueryChainTracking 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type QueryChainTracking = {
  chainId: string
  depth: number
}

// ValidationResult 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ValidationResult =
  | { result: true }
  | {
      result: false
      message: string
      errorCode: number
    }

// SetToolJSXFn 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type SetToolJSXFn = (
  args: {
    jsx: React.ReactNode | null
    shouldHidePromptInput: boolean
    shouldContinueAnimation?: true
    showSpinner?: boolean
    isLocalJSXCommand?: boolean
    isImmediate?: boolean
    /** Set to true to clear a local JSX command (e.g., from its onDone callback) */
    clearLocalJSX?: boolean
  } | null,
) => void

// Import tool permission types from centralized location to break import cycles
// 类型依赖 { ToolPermissionRulesBySource } 来自 ./types/permissions.js，用于校准工具协议定义的数据契约。
import type { ToolPermissionRulesBySource } from './types/permissions.js'

// Re-export for backwards compatibility
// 导出类型定义，让其他模块沿用工具协议定义的数据契约。
export type { ToolPermissionRulesBySource }

// Apply DeepImmutable to the imported type
// ToolPermissionContext 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolPermissionContext = DeepImmutable<{
  mode: PermissionMode
  additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
  alwaysAllowRules: ToolPermissionRulesBySource
  alwaysDenyRules: ToolPermissionRulesBySource
  alwaysAskRules: ToolPermissionRulesBySource
  isBypassPermissionsModeAvailable: boolean
  isAutoModeAvailable?: boolean
  strippedDangerousRules?: ToolPermissionRulesBySource
  /** When true, permission prompts are auto-denied (e.g., background agents that can't show UI) */
  shouldAvoidPermissionPrompts?: boolean
  /** When true, automated checks (classifier, hooks) are awaited before showing the permission dialog (coordinator workers) */
  awaitAutomatedChecksBeforeDialog?: boolean
  /** Stores the permission mode before model-initiated plan mode entry, so it can be restored on exit */
  prePlanMode?: PermissionMode
}>

// 这个回调绑定到 export const getEmptyToolPermissionContext: () => ToolPermissionContext =，负责工具协议定义在该局部场景下的响应。
export const getEmptyToolPermissionContext: () => ToolPermissionContext =
  // 这个回调绑定到 () => ({，负责工具协议定义在该局部场景下的响应。
  () => ({
    mode: 'default',
    additionalWorkingDirectories: new Map(),
    alwaysAllowRules: {},
    alwaysDenyRules: {},
    alwaysAskRules: {},
    isBypassPermissionsModeAvailable: false,
  })

// CompactProgressEvent 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompactProgressEvent =
  | {
      type: 'hooks_start'
      hookType: 'pre_compact' | 'post_compact' | 'session_start'
    }
  | { type: 'compact_start' }
  | { type: 'compact_end' }

// ToolUseContext 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolUseContext = {
  options: {
    commands: Command[]
    debug: boolean
    mainLoopModel: string
    tools: Tools
    verbose: boolean
    thinkingConfig: ThinkingConfig
    mcpClients: MCPServerConnection[]
    mcpResources: Record<string, ServerResource[]>
    isNonInteractiveSession: boolean
    agentDefinitions: AgentDefinitionsResult
    maxBudgetUsd?: number
    /** Custom system prompt that replaces the default system prompt */
    customSystemPrompt?: string
    /** Additional system prompt appended after the main system prompt */
    appendSystemPrompt?: string
    /** Override querySource for analytics tracking */
    querySource?: QuerySource
    /** Optional callback to get the latest tools (e.g., after MCP servers connect mid-query) */
    // 这个回调绑定到 refreshTools?: () => Tools，负责工具协议定义在该局部场景下的响应。
    refreshTools?: () => Tools
  }
  abortController: AbortController
  readFileState: FileStateCache
  // getAppState不依赖额外参数，直接计算工具协议定义需要的结果。
  getAppState(): AppState
  // setAppState 写入新的状态值，使工具协议定义后续读取保持一致。
  setAppState(f: (prev: AppState) => AppState): void
  /**
   * Always-shared setAppState for session-scoped infrastructure (background
   * tasks, session hooks). Unlike setAppState, which is no-op for async agents
   * (see createSubagentContext), this always reaches the root store so agents
   * at any nesting depth can register/clean up infrastructure that outlives
   * a single turn. Only set by createSubagentContext; main-thread contexts
   * fall back to setAppState.
   */
  // 这个回调绑定到 setAppStateForTasks?: (f: (prev: AppState) => AppState) => void，负责工具协议定义在该局部场景下的响应。
  setAppStateForTasks?: (f: (prev: AppState) => AppState) => void
  /**
   * Optional handler for URL elicitations triggered by tool call errors (-32042).
   * In print/SDK mode, this delegates to structuredIO.handleElicitation.
   * In REPL mode, this is undefined and the queue-based UI path is used.
   */
  // 工具协议定义在这里处理 `handleElicitation?: (`，完成这一小步状态转换。
  handleElicitation?: (
    serverName: string,
    params: ElicitRequestURLParams,
    signal: AbortSignal,
  ) => Promise<ElicitResult>
  setToolJSX?: SetToolJSXFn
  // 这个回调绑定到 addNotification?: (notif: Notification) => void，负责工具协议定义在该局部场景下的响应。
  addNotification?: (notif: Notification) => void
  /** Append a UI-only system message to the REPL message list. Stripped at the
   *  normalizeMessagesForAPI boundary — the Exclude<> makes that type-enforced. */
  // 工具协议定义在这里处理 `appendSystemMessage?: (`，完成这一小步状态转换。
  appendSystemMessage?: (
    msg: Exclude<SystemMessage, SystemLocalCommandMessage>,
  ) => void
  /** Send an OS-level notification (iTerm2, Kitty, Ghostty, bell, etc.) */
  // 工具协议定义在这里处理 `sendOSNotification?: (opts: {`，完成这一小步状态转换。
  sendOSNotification?: (opts: {
    message: string
    notificationType: string
  }) => void
  nestedMemoryAttachmentTriggers?: Set<string>
  /**
   * CLAUDE.md paths already injected as nested_memory attachments this
   * session. Dedup for memoryFilesToAttachments — readFileState is an LRU
   * that evicts entries in busy sessions, so its .has() check alone can
   * re-inject the same CLAUDE.md dozens of times.
   */
  loadedNestedMemoryPaths?: Set<string>
  dynamicSkillDirTriggers?: Set<string>
  /** Skill names surfaced via skill_discovery this session. Telemetry only (feeds was_discovered). */
  discoveredSkillNames?: Set<string>
  userModified?: boolean
  // 这个回调绑定到 setInProgressToolUseIDs: (f: (prev: Set<string>) => Set<string>) => void，负责工具协议定义在该局部场景下的响应。
  setInProgressToolUseIDs: (f: (prev: Set<string>) => Set<string>) => void
  /** Only wired in interactive (REPL) contexts; SDK/QueryEngine don't set this. */
  setHasInterruptibleToolInProgress?: (v: boolean) => void
  // 这个回调绑定到 setResponseLength: (f: (prev: number) => number) => void，负责工具协议定义在该局部场景下的响应。
  setResponseLength: (f: (prev: number) => number) => void
  /** Ant-only: push a new API metrics entry for OTPS tracking.
   *  Called by subagent streaming when a new API request starts. */
  pushApiMetricsEntry?: (ttftMs: number) => void
  setStreamMode?: (mode: SpinnerMode) => void
  // 这个回调绑定到 onCompactProgress?: (event: CompactProgressEvent) => void，负责工具协议定义在该局部场景下的响应。
  onCompactProgress?: (event: CompactProgressEvent) => void
  // 这个回调绑定到 setSDKStatus?: (status: SDKStatus) => void，负责工具协议定义在该局部场景下的响应。
  setSDKStatus?: (status: SDKStatus) => void
  // 这个回调绑定到 openMessageSelector?: () => void，负责工具协议定义在该局部场景下的响应。
  openMessageSelector?: () => void
  // 工具协议定义在这里处理 `updateFileHistoryState: (`，完成这一小步状态转换。
  updateFileHistoryState: (
    // 这个回调绑定到 updater: (prev: FileHistoryState) => FileHistoryState,，负责工具协议定义在该局部场景下的响应。
    updater: (prev: FileHistoryState) => FileHistoryState,
  ) => void
  // 工具协议定义在这里处理 `updateAttributionState: (`，完成这一小步状态转换。
  updateAttributionState: (
    // 这个回调绑定到 updater: (prev: AttributionState) => AttributionState,，负责工具协议定义在该局部场景下的响应。
    updater: (prev: AttributionState) => AttributionState,
  ) => void
  setConversationId?: (id: UUID) => void
  agentId?: AgentId // Only set for subagents; use getSessionId() for session ID. Hooks use this to distinguish subagent calls.
  agentType?: string // Subagent type name. For the main thread's --agent type, hooks fall back to getMainThreadAgentType().
  /** When true, canUseTool must always be called even when hooks auto-approve.
   *  Used by speculation for overlay file path rewriting. */
  requireCanUseTool?: boolean
  messages: Message[]
  fileReadingLimits?: {
    maxTokens?: number
    maxSizeBytes?: number
  }
  globLimits?: {
    maxResults?: number
  }
  toolDecisions?: Map<
    string,
    {
      source: string
      decision: 'accept' | 'reject'
      timestamp: number
    }
  >
  queryTracking?: QueryChainTracking
  /** Callback factory for requesting interactive prompts from the user.
   * Returns a prompt callback bound to the given source name.
   * Only available in interactive (REPL) contexts. */
  // 工具协议定义在这里处理 `requestPrompt?: (`，完成这一小步状态转换。
  requestPrompt?: (
    sourceName: string,
    toolInputSummary?: string | null,
  // 这个回调绑定到 ) => (request: PromptRequest) => Promise<PromptResponse>，负责工具协议定义在该局部场景下的响应。
  ) => (request: PromptRequest) => Promise<PromptResponse>
  toolUseId?: string
  criticalSystemReminder_EXPERIMENTAL?: string
  /** When true, preserve toolUseResult on messages even for subagents.
   * Used by in-process teammates whose transcripts are viewable by the user. */
  preserveToolUseResults?: boolean
  /** Local denial tracking state for async subagents whose setAppState is a
   *  no-op. Without this, the denial counter never accumulates and the
   *  fallback-to-prompting threshold is never reached. Mutable — the
   *  permissions code updates it in place. */
  localDenialTracking?: DenialTrackingState
  /**
   * Per-conversation-thread content replacement state for the tool result
   * budget. When present, query.ts applies the aggregate tool result budget.
   * Main thread: REPL provisions once (never resets — stale UUID keys
   * are inert). Subagents: createSubagentContext clones the parent's state
   * by default (cache-sharing forks need identical decisions), or
   * resumeAgentBackground threads one reconstructed from sidechain records.
   */
  contentReplacementState?: ContentReplacementState
  /**
   * Parent's rendered system prompt bytes, frozen at turn start.
   * Used by fork subagents to share the parent's prompt cache — re-calling
   * getSystemPrompt() at fork-spawn time can diverge (GrowthBook cold→warm)
   * and bust the cache. See forkSubagent.ts.
   */
  renderedSystemPrompt?: SystemPrompt
}

// Re-export ToolProgressData from centralized location
// 导出类型定义，让其他模块沿用工具协议定义的数据契约。
export type { ToolProgressData }

// Progress 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type Progress = ToolProgressData | HookProgress

export type ToolProgress<P extends ToolProgressData> = {
  toolUseID: string
  data: P
}

// filterToolProgressMessages 封装Tool的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterToolProgressMessages(
  progressMessagesForMessage: ProgressMessage[],
): ProgressMessage<ToolProgressData>[] {
  // 返回 `progressMessagesForMessage.filter(`，作为工具协议定义这次计算的结果。
  return progressMessagesForMessage.filter(
    (msg): msg is ProgressMessage<ToolProgressData> =>
      msg.data?.type !== 'hook_progress',
  )
}

// ToolResult 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolResult<T> = {
  data: T
  newMessages?: (
    | UserMessage
    | AssistantMessage
    | AttachmentMessage
    | SystemMessage
  )[]
  // contextModifier is only honored for tools that aren't concurrency safe.
  // 这个回调绑定到 contextModifier?: (context: ToolUseContext) => ToolUseContext，负责工具协议定义在该局部场景下的响应。
  contextModifier?: (context: ToolUseContext) => ToolUseContext
  /** MCP protocol metadata (structuredContent, _meta) to pass through to SDK consumers */
  mcpMeta?: {
    _meta?: Record<string, unknown>
    structuredContent?: Record<string, unknown>
  }
}

// ToolCallProgress 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolCallProgress<P extends ToolProgressData = ToolProgressData> = (
  progress: ToolProgress<P>,
) => void

// Type for any schema that outputs an object with string keys
// AnyObject 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnyObject = z.ZodType<{ [key: string]: unknown }>

/**
 * Checks if a tool matches the given name (primary name or alias).
 */
// toolMatchesName 封装Tool的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toolMatchesName(
  tool: { name: string; aliases?: string[] },
  name: string,
): boolean {
  // 返回 `tool.name === name || (tool.aliases?.includes(name) ?? false)`，作为工具协议定义这次计算的结果。
  return tool.name === name || (tool.aliases?.includes(name) ?? false)
}

/**
 * Finds a tool by name or alias from a list of tools.
 */
// findToolByName 封装Tool的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findToolByName(tools: Tools, name: string): Tool | undefined {
  // 返回 `tools.find(t => toolMatchesName(t, name))`，作为工具协议定义这次计算的结果。
  return tools.find(t => toolMatchesName(t, name))
}

export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = {
  /**
   * Optional aliases for backwards compatibility when a tool is renamed.
   * The tool can be looked up by any of these names in addition to its primary name.
   */
  aliases?: string[]
  /**
   * One-line capability phrase used by ToolSearch for keyword matching.
   * Helps the model find this tool via keyword search when it's deferred.
   * 3–10 words, no trailing period.
   * Prefer terms not already in the tool name (e.g. 'jupyter' for NotebookEdit).
   */
  searchHint?: string
  // 调用 call，触发工具协议定义此处需要的副作用。
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
    onProgress?: ToolCallProgress<P>,
  ): Promise<ToolResult<Output>>
  // 调用 description，触发工具协议定义此处需要的副作用。
  description(
    input: z.infer<Input>,
    options: {
      isNonInteractiveSession: boolean
      toolPermissionContext: ToolPermissionContext
      tools: Tools
    },
  ): Promise<string>
  readonly inputSchema: Input
  // Type for MCP tools that can specify their input schema directly in JSON Schema format
  // rather than converting from Zod schema
  readonly inputJSONSchema?: ToolInputJSONSchema
  // Optional because TungstenTool doesn't define this. TODO: Make it required.
  // When we do that, we can also go through and make this a bit more type-safe.
  outputSchema?: z.ZodType<unknown>
  // 调用 inputsEquivalent?(a: z.infer<Input>, b: z.infer<Input>): boolean，完成这一处局部操作。
  inputsEquivalent?(a: z.infer<Input>, b: z.infer<Input>): boolean
  // isConcurrencySafe 用 input: z.infer<Input> 判断工具协议定义是否满足条件。
  isConcurrencySafe(input: z.infer<Input>): boolean
  // isEnabled 用 无 判断工具协议定义是否满足条件。
  isEnabled(): boolean
  // isReadOnly 用 input: z.infer<Input> 判断工具协议定义是否满足条件。
  isReadOnly(input: z.infer<Input>): boolean
  /** Defaults to false. Only set when the tool performs irreversible operations (delete, overwrite, send). */
  // 调用 isDestructive?(input: z.infer<Input>): boolean，完成这一处局部操作。
  isDestructive?(input: z.infer<Input>): boolean
  /**
   * What should happen when the user submits a new message while this tool
   * is running.
   *
   * - `'cancel'` — stop the tool and discard its result
   * - `'block'`  — keep running; the new message waits
   *
   * Defaults to `'block'` when not implemented.
   */
  // 调用 interruptBehavior?(): 'cancel' | 'block'，完成这一处局部操作。
  interruptBehavior?(): 'cancel' | 'block'
  /**
   * Returns information about whether this tool use is a search or read operation
   * that should be collapsed into a condensed display in the UI. Examples include
   * file searching (Grep, Glob), file reading (Read), and bash commands like find,
   * grep, wc, etc.
   *
   * Returns an object indicating whether the operation is a search or read operation:
   * - `isSearch: true` for search operations (grep, find, glob patterns)
   * - `isRead: true` for read operations (cat, head, tail, file read)
   * - `isList: true` for directory-listing operations (ls, tree, du)
   * - All can be false if the operation shouldn't be collapsed
   */
  // 调用 isSearchOrReadCommand?(input: z.infer<Input>): {，完成这一处局部操作。
  isSearchOrReadCommand?(input: z.infer<Input>): {
    isSearch: boolean
    isRead: boolean
    isList?: boolean
  }
  // 调用 isOpenWorld?(input: z.infer<Input>): boolean，完成这一处局部操作。
  isOpenWorld?(input: z.infer<Input>): boolean
  // 调用 requiresUserInteraction?(): boolean，完成这一处局部操作。
  requiresUserInteraction?(): boolean
  isMcp?: boolean
  isLsp?: boolean
  /**
   * When true, this tool is deferred (sent with defer_loading: true) and requires
   * ToolSearch to be used before it can be called.
   */
  readonly shouldDefer?: boolean
  /**
   * When true, this tool is never deferred — its full schema appears in the
   * initial prompt even when ToolSearch is enabled. For MCP tools, set via
   * `_meta['anthropic/alwaysLoad']`. Use for tools the model must see on
   * turn 1 without a ToolSearch round-trip.
   */
  readonly alwaysLoad?: boolean
  /**
   * For MCP tools: the server and tool names as received from the MCP server (unnormalized).
   * Present on all MCP tools regardless of whether `name` is prefixed (mcp__server__tool)
   * or unprefixed (CLAUDE_AGENT_SDK_MCP_NO_PREFIX mode).
   */
  mcpInfo?: { serverName: string; toolName: string }
  readonly name: string
  /**
   * Maximum size in characters for tool result before it gets persisted to disk.
   * When exceeded, the result is saved to a file and Claude receives a preview
   * with the file path instead of the full content.
   *
   * Set to Infinity for tools whose output must never be persisted (e.g. Read,
   * where persisting creates a circular Read→file→Read loop and the tool
   * already self-bounds via its own limits).
   */
  maxResultSizeChars: number
  /**
   * When true, enables strict mode for this tool, which causes the API to
   * more strictly adhere to tool instructions and parameter schemas.
   * Only applied when the tengu_tool_pear is enabled.
   */
  readonly strict?: boolean

  /**
   * Called on copies of tool_use input before observers see it (SDK stream,
   * transcript, canUseTool, PreToolUse/PostToolUse hooks). Mutate in place
   * to add legacy/derived fields. Must be idempotent. The original API-bound
   * input is never mutated (preserves prompt cache). Not re-applied when a
   * hook/permission returns a fresh updatedInput — those own their shape.
   */
  // 调用 backfillObservableInput?(input: Record<string, unknown>): void，完成这一处局部操作。
  backfillObservableInput?(input: Record<string, unknown>): void

  /**
   * Determines if this tool is allowed to run with this input in the current context.
   * It informs the model of why the tool use failed, and does not directly display any UI.
   * @param input
   * @param context
   */
  // 工具协议定义在这里处理 `validateInput?(`，完成这一小步状态转换。
  validateInput?(
    input: z.infer<Input>,
    context: ToolUseContext,
  ): Promise<ValidationResult>

  /**
   * Determines if the user is asked for permission. Only called after validateInput() passes.
   * General permission logic is in permissions.ts. This method contains tool-specific logic.
   * @param input
   * @param context
   */
  // 调用 checkPermissions，触发工具协议定义此处需要的副作用。
  checkPermissions(
    input: z.infer<Input>,
    context: ToolUseContext,
  ): Promise<PermissionResult>

  // Optional method for tools that operate on a file path
  // 调用 getPath?(input: z.infer<Input>): string，完成这一处局部操作。
  getPath?(input: z.infer<Input>): string

  /**
   * Prepare a matcher for hook `if` conditions (permission-rule patterns like
   * "git *" from "Bash(git *)"). Called once per hook-input pair; any
   * expensive parsing happens here. Returns a closure that is called per
   * hook pattern. If not implemented, only tool-name-level matching works.
   */
  // 工具协议定义在这里处理 `preparePermissionMatcher?(`，完成这一小步状态转换。
  preparePermissionMatcher?(
    input: z.infer<Input>,
  // 这个回调绑定到 ): Promise<(pattern: string) => boolean>，负责工具协议定义在该局部场景下的响应。
  ): Promise<(pattern: string) => boolean>

  // 调用 prompt，触发工具协议定义此处需要的副作用。
  prompt(options: {
    // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>，负责工具协议定义在该局部场景下的响应。
    getToolPermissionContext: () => Promise<ToolPermissionContext>
    tools: Tools
    agents: AgentDefinition[]
    allowedAgentTypes?: string[]
  }): Promise<string>
  // userFacingName 使用 input: Partial<z.infer<Input>> | undefined 完成工具协议定义里的对应操作。
  userFacingName(input: Partial<z.infer<Input>> | undefined): string
  // 工具协议定义在这里处理 `userFacingNameBackgroundColor?(`，完成这一小步状态转换。
  userFacingNameBackgroundColor?(
    input: Partial<z.infer<Input>> | undefined,
  ): keyof Theme | undefined
  /**
   * Transparent wrappers (e.g. REPL) delegate all rendering to their progress
   * handler, which emits native-looking blocks for each inner tool call.
   * The wrapper itself shows nothing.
   */
  // 调用 isTransparentWrapper?(): boolean，完成这一处局部操作。
  isTransparentWrapper?(): boolean
  /**
   * Returns a short string summary of this tool use for display in compact views.
   * @param input The tool input
   * @returns A short string summary, or null to not display
   */
  // 调用 getToolUseSummary?(input: Partial<z.infer<Input>> | undefined): string | null，完成这一处局部操作。
  getToolUseSummary?(input: Partial<z.infer<Input>> | undefined): string | null
  /**
   * Returns a human-readable present-tense activity description for spinner display.
   * Example: "Reading src/foo.ts", "Running bun test", "Searching for pattern"
   * @param input The tool input
   * @returns Activity description string, or null to fall back to tool name
   */
  // 工具协议定义在这里处理 `getActivityDescription?(`，完成这一小步状态转换。
  getActivityDescription?(
    input: Partial<z.infer<Input>> | undefined,
  ): string | null
  /**
   * Returns a compact representation of this tool use for the auto-mode
   * security classifier. Examples: `ls -la` for Bash, `/tmp/x: new content`
   * for Edit. Return '' to skip this tool in the classifier transcript
   * (e.g. tools with no security relevance). May return an object to avoid
   * double-encoding when the caller JSON-wraps the value.
   */
  // toAutoClassifierInput 使用 input: z.infer<Input> 完成工具协议定义里的对应操作。
  toAutoClassifierInput(input: z.infer<Input>): unknown
  // 调用 mapToolResultToToolResultBlockParam，触发工具协议定义此处需要的副作用。
  mapToolResultToToolResultBlockParam(
    content: Output,
    toolUseID: string,
  ): ToolResultBlockParam
  /**
   * Optional. When omitted, the tool result renders nothing (same as returning
   * null). Omit for tools whose results are surfaced elsewhere (e.g., TodoWrite
   * updates the todo panel, not the transcript).
   */
  // 工具协议定义在这里处理 `renderToolResultMessage?(`，完成这一小步状态转换。
  renderToolResultMessage?(
    content: Output,
    progressMessagesForMessage: ProgressMessage<P>[],
    options: {
      style?: 'condensed'
      theme: ThemeName
      tools: Tools
      verbose: boolean
      isTranscriptMode?: boolean
      isBriefOnly?: boolean
      /** Original tool_use input, when available. Useful for compact result
       * summaries that reference what was requested (e.g. "Sent to #foo"). */
      input?: unknown
    },
  ): React.ReactNode
  /**
   * Flattened text of what renderToolResultMessage shows IN TRANSCRIPT
   * MODE (verbose=true, isTranscriptMode=true). For transcript search
   * indexing: the index counts occurrences in this string, the highlight
   * overlay scans the actual screen buffer. For count ≡ highlight, this
   * must return the text that ends up visible — not the model-facing
   * serialization from mapToolResultToToolResultBlockParam (which adds
   * system-reminders, persisted-output wrappers).
   *
   * Chrome can be skipped (under-count is fine). "Found 3 files in 12ms"
   * isn't worth indexing. Phantoms are not fine — text that's claimed
   * here but doesn't render is a count≠highlight bug.
   *
   * Optional: omitted → field-name heuristic in transcriptSearch.ts.
   * Drift caught by test/utils/transcriptSearch.renderFidelity.test.tsx
   * which renders sample outputs and flags text that's indexed-but-not-
   * rendered (phantom) or rendered-but-not-indexed (under-count warning).
   */
  // 调用 extractSearchText?(out: Output): string，完成这一处局部操作。
  extractSearchText?(out: Output): string
  /**
   * Render the tool use message. Note that `input` is partial because we render
   * the message as soon as possible, possibly before tool parameters have fully
   * streamed in.
   */
  // 调用 renderToolUseMessage，触发工具协议定义此处需要的副作用。
  renderToolUseMessage(
    input: Partial<z.infer<Input>>,
    options: { theme: ThemeName; verbose: boolean; commands?: Command[] },
  ): React.ReactNode
  /**
   * Returns true when the non-verbose rendering of this output is truncated
   * (i.e., clicking to expand would reveal more content). Gates
   * click-to-expand in fullscreen — only messages where verbose actually
   * shows more get a hover/click affordance. Unset means never truncated.
   */
  // 调用 isResultTruncated?(output: Output): boolean，完成这一处局部操作。
  isResultTruncated?(output: Output): boolean
  /**
   * Renders an optional tag to display after the tool use message.
   * Used for additional metadata like timeout, model, resume ID, etc.
   * Returns null to not display anything.
   */
  // 调用 renderToolUseTag?(input: Partial<z.infer<Input>>): React.ReactNode，完成这一处局部操作。
  renderToolUseTag?(input: Partial<z.infer<Input>>): React.ReactNode
  /**
   * Optional. When omitted, no progress UI is shown while the tool runs.
   */
  // 工具协议定义在这里处理 `renderToolUseProgressMessage?(`，完成这一小步状态转换。
  renderToolUseProgressMessage?(
    progressMessagesForMessage: ProgressMessage<P>[],
    options: {
      tools: Tools
      verbose: boolean
      terminalSize?: { columns: number; rows: number }
      inProgressToolCallCount?: number
      isTranscriptMode?: boolean
    },
  ): React.ReactNode
  // 调用 renderToolUseQueuedMessage?(): React.ReactNode，完成这一处局部操作。
  renderToolUseQueuedMessage?(): React.ReactNode
  /**
   * Optional. When omitted, falls back to <FallbackToolUseRejectedMessage />.
   * Only define this for tools that need custom rejection UI (e.g., file edits
   * that show the rejected diff).
   */
  // 工具协议定义在这里处理 `renderToolUseRejectedMessage?(`，完成这一小步状态转换。
  renderToolUseRejectedMessage?(
    input: z.infer<Input>,
    options: {
      columns: number
      messages: Message[]
      style?: 'condensed'
      theme: ThemeName
      tools: Tools
      verbose: boolean
      progressMessagesForMessage: ProgressMessage<P>[]
      isTranscriptMode?: boolean
    },
  ): React.ReactNode
  /**
   * Optional. When omitted, falls back to <FallbackToolUseErrorMessage />.
   * Only define this for tools that need custom error UI (e.g., search tools
   * that show "File not found" instead of the raw error).
   */
  // 工具协议定义在这里处理 `renderToolUseErrorMessage?(`，完成这一小步状态转换。
  renderToolUseErrorMessage?(
    result: ToolResultBlockParam['content'],
    options: {
      progressMessagesForMessage: ProgressMessage<P>[]
      tools: Tools
      verbose: boolean
      isTranscriptMode?: boolean
    },
  ): React.ReactNode

  /**
   * Renders multiple parallel instances of this tool as a group.
   * @returns React node to render, or null to fall back to individual rendering
   */
  /**
   * Renders multiple tool uses as a group (non-verbose mode only).
   * In verbose mode, individual tool uses render at their original positions.
   * @returns React node to render, or null to fall back to individual rendering
   */
  // 工具协议定义在这里处理 `renderGroupedToolUse?(`，完成这一小步状态转换。
  renderGroupedToolUse?(
    toolUses: Array<{
      param: ToolUseBlockParam
      isResolved: boolean
      isError: boolean
      isInProgress: boolean
      progressMessages: ProgressMessage<P>[]
      result?: {
        param: ToolResultBlockParam
        output: unknown
      }
    }>,
    options: {
      shouldAnimate: boolean
      tools: Tools
    },
  ): React.ReactNode | null
}

/**
 * A collection of tools. Use this type instead of `Tool[]` to make it easier
 * to track where tool sets are assembled, passed, and filtered across the codebase.
 */
// Tools 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type Tools = readonly Tool[]

/**
 * Methods that `buildTool` supplies a default for. A `ToolDef` may omit these;
 * the resulting `Tool` always has them.
 */
// DefaultableToolKeys 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
type DefaultableToolKeys =
  | 'isEnabled'
  | 'isConcurrencySafe'
  | 'isReadOnly'
  | 'isDestructive'
  | 'checkPermissions'
  | 'toAutoClassifierInput'
  | 'userFacingName'

/**
 * Tool definition accepted by `buildTool`. Same shape as `Tool` but with the
 * defaultable methods optional — `buildTool` fills them in so callers always
 * see a complete `Tool`.
 */
// ToolDef 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
export type ToolDef<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = Omit<Tool<Input, Output, P>, DefaultableToolKeys> &
  Partial<Pick<Tool<Input, Output, P>, DefaultableToolKeys>>

/**
 * Type-level spread mirroring `{ ...TOOL_DEFAULTS, ...def }`. For each
 * defaultable key: if D provides it (required), D's type wins; if D omits
 * it or has it optional (inherited from Partial<> in the constraint), the
 * default fills in. All other keys come from D verbatim — preserving arity,
 * optional presence, and literal types exactly as `satisfies Tool` did.
 */
// BuiltTool 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
type BuiltTool<D> = Omit<D, DefaultableToolKeys> & {
  [K in DefaultableToolKeys]-?: K extends keyof D
    ? undefined extends D[K]
      ? ToolDefaults[K]
      : D[K]
    : ToolDefaults[K]
}

/**
 * Build a complete `Tool` from a partial definition, filling in safe defaults
 * for the commonly-stubbed methods. All tool exports should go through this so
 * that defaults live in one place and callers never need `?.() ?? default`.
 *
 * Defaults (fail-closed where it matters):
 * - `isEnabled` → `true`
 * - `isConcurrencySafe` → `false` (assume not safe)
 * - `isReadOnly` → `false` (assume writes)
 * - `isDestructive` → `false`
 * - `checkPermissions` → `{ behavior: 'allow', updatedInput }` (defer to general permission system)
 * - `toAutoClassifierInput` → `''` (skip classifier — security-relevant tools must override)
 * - `userFacingName` → `name`
 */
// TOOL_DEFAULTS 集合 集中保存工具协议定义要一起传递的字段。
const TOOL_DEFAULTS = {
  // 这个回调绑定到 isEnabled: () => true,，负责工具协议定义在该局部场景下的响应。
  isEnabled: () => true,
  // 这个回调绑定到 isConcurrencySafe: (_input?: unknown) => false,，负责工具协议定义在该局部场景下的响应。
  isConcurrencySafe: (_input?: unknown) => false,
  // 这个回调绑定到 isReadOnly: (_input?: unknown) => false,，负责工具协议定义在该局部场景下的响应。
  isReadOnly: (_input?: unknown) => false,
  // 这个回调绑定到 isDestructive: (_input?: unknown) => false,，负责工具协议定义在该局部场景下的响应。
  isDestructive: (_input?: unknown) => false,
  checkPermissions: (
    input: { [key: string]: unknown },
    _ctx?: ToolUseContext,
  ): Promise<PermissionResult> =>
    Promise.resolve({ behavior: 'allow', updatedInput: input }),
  // 这个回调绑定到 toAutoClassifierInput: (_input?: unknown) => '',，负责工具协议定义在该局部场景下的响应。
  toAutoClassifierInput: (_input?: unknown) => '',
  // 这个回调绑定到 userFacingName: (_input?: unknown) => '',，负责工具协议定义在该局部场景下的响应。
  userFacingName: (_input?: unknown) => '',
}

// The defaults type is the ACTUAL shape of TOOL_DEFAULTS (optional params so
// both 0-arg and full-arg call sites type-check — stubs varied in arity and
// tests relied on that), not the interface's strict signatures.
// ToolDefaults 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolDefaults = typeof TOOL_DEFAULTS

// D infers the concrete object-literal type from the call site. The
// constraint provides contextual typing for method parameters; `any` in
// constraint position is structural and never leaks into the return type.
// BuiltTool<D> mirrors runtime `{...TOOL_DEFAULTS, ...def}` at the type level.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// AnyToolDef 固化工具协议定义里传递的数据形状，帮助调用方按同一结构读写字段。
type AnyToolDef = ToolDef<any, any, any>

export function buildTool<D extends AnyToolDef>(def: D): BuiltTool<D> {
  // The runtime spread is straightforward; the `as` bridges the gap between
  // the structural-any constraint and the precise BuiltTool<D> return. The
  // type semantics are proven by the 0-error typecheck across all 60+ tools.
  // 返回结构化结果，集中表达工具协议定义已经整理出的状态。
  return {
    ...TOOL_DEFAULTS,
    // 这个回调绑定到 userFacingName: () => def.name,，负责工具协议定义在该局部场景下的响应。
    userFacingName: () => def.name,
    ...def,
  } as BuiltTool<D>
}
