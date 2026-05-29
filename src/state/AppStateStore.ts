// 类型依赖 { Notification } 来自 src/context/notifications.js，用于校准应用状态管理的数据契约。
import type { Notification } from 'src/context/notifications.js'
// 类型依赖 { TodoList } 来自 src/utils/todo/types.js，用于校准应用状态管理的数据契约。
import type { TodoList } from 'src/utils/todo/types.js'
// 类型依赖 { BridgePermissionCallbacks } 来自 ../bridge/bridgePermissionCallbacks.js，用于校准应用状态管理的数据契约。
import type { BridgePermissionCallbacks } from '../bridge/bridgePermissionCallbacks.js'
// 类型依赖 { Command } 来自 ../commands.js，用于校准应用状态管理的数据契约。
import type { Command } from '../commands.js'
// 类型依赖 { ChannelPermissionCallbacks } 来自 ../services/mcp/channelPermissions.js，用于校准应用状态管理的数据契约。
import type { ChannelPermissionCallbacks } from '../services/mcp/channelPermissions.js'
// 类型依赖 { ElicitationRequestEvent } 来自 ../services/mcp/elicitationHandler.js，用于校准应用状态管理的数据契约。
import type { ElicitationRequestEvent } from '../services/mcp/elicitationHandler.js'
// 整理这一组导入，让应用状态管理后续逻辑可以直接复用这些外部能力。
import type {
  MCPServerConnection,
  ServerResource,
} from '../services/mcp/types.js'
// 接入 shouldEnablePromptSuggestion 服务层能力，把外部通信或共享状态交给 ../services/PromptSuggestion/promptSuggestion.js 处理。
import { shouldEnablePromptSuggestion } from '../services/PromptSuggestion/promptSuggestion.js'
// 整理这一组导入，让应用状态管理后续逻辑可以直接复用这些外部能力。
import {
  getEmptyToolPermissionContext,
  type Tool,
  type ToolPermissionContext,
} from '../Tool.js'
// 类型依赖 { TaskState } 来自 ../tasks/types.js，用于校准应用状态管理的数据契约。
import type { TaskState } from '../tasks/types.js'
// 类型依赖 { AgentColorName } 来自 ../tools/AgentTool/agentColorManager.js，用于校准应用状态管理的数据契约。
import type { AgentColorName } from '../tools/AgentTool/agentColorManager.js'
// 类型依赖 { AgentDefinitionsResult } 来自 ../tools/AgentTool/loadAgentsDir.js，用于校准应用状态管理的数据契约。
import type { AgentDefinitionsResult } from '../tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { AllowedPrompt } 来自 ../tools/ExitPlanModeTool/ExitPlanModeV2Tool.js，用于校准应用状态管理的数据契约。
import type { AllowedPrompt } from '../tools/ExitPlanModeTool/ExitPlanModeV2Tool.js'
// 类型依赖 { AgentId } 来自 ../types/ids.js，用于校准应用状态管理的数据契约。
import type { AgentId } from '../types/ids.js'
// 类型依赖 { Message, UserMessage } 来自 ../types/message.js，用于校准应用状态管理的数据契约。
import type { Message, UserMessage } from '../types/message.js'
// 类型依赖 { LoadedPlugin, PluginError } 来自 ../types/plugin.js，用于校准应用状态管理的数据契约。
import type { LoadedPlugin, PluginError } from '../types/plugin.js'
// 类型依赖 { DeepImmutable } 来自 ../types/utils.js，用于校准应用状态管理的数据契约。
import type { DeepImmutable } from '../types/utils.js'
// 整理这一组导入，让应用状态管理后续逻辑可以直接复用这些外部能力。
import {
  type AttributionState,
  createEmptyAttributionState,
} from '../utils/commitAttribution.js'
// 类型依赖 { EffortValue } 来自 ../utils/effort.js，用于校准应用状态管理的数据契约。
import type { EffortValue } from '../utils/effort.js'
// 类型依赖 { FileHistoryState } 来自 ../utils/fileHistory.js，用于校准应用状态管理的数据契约。
import type { FileHistoryState } from '../utils/fileHistory.js'
// 类型依赖 { REPLHookContext } 来自 ../utils/hooks/postSamplingHooks.js，用于校准应用状态管理的数据契约。
import type { REPLHookContext } from '../utils/hooks/postSamplingHooks.js'
// 类型依赖 { SessionHooksState } 来自 ../utils/hooks/sessionHooks.js，用于校准应用状态管理的数据契约。
import type { SessionHooksState } from '../utils/hooks/sessionHooks.js'
// 类型依赖 { ModelSetting } 来自 ../utils/model/model.js，用于校准应用状态管理的数据契约。
import type { ModelSetting } from '../utils/model/model.js'
// 类型依赖 { DenialTrackingState } 来自 ../utils/permissions/denialTracking.js，用于校准应用状态管理的数据契约。
import type { DenialTrackingState } from '../utils/permissions/denialTracking.js'
// 类型依赖 { PermissionMode } 来自 ../utils/permissions/PermissionMode.js，用于校准应用状态管理的数据契约。
import type { PermissionMode } from '../utils/permissions/PermissionMode.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../utils/settings/settings.js'
// 类型依赖 { SettingsJson } 来自 ../utils/settings/types.js，用于校准应用状态管理的数据契约。
import type { SettingsJson } from '../utils/settings/types.js'
// 复用 shouldEnableThinkingByDefault 工具函数，把通用处理留在 ../utils/thinking.js 中维护。
import { shouldEnableThinkingByDefault } from '../utils/thinking.js'
// 类型依赖 { Store } 来自 ./store.js，用于校准应用状态管理的数据契约。
import type { Store } from './store.js'

// CompletionBoundary 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type CompletionBoundary =
  | { type: 'complete'; completedAt: number; outputTokens: number }
  | { type: 'bash'; command: string; completedAt: number }
  | { type: 'edit'; toolName: string; filePath: string; completedAt: number }
  | {
      type: 'denied_tool'
      toolName: string
      detail: string
      completedAt: number
    }

// SpeculationResult 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type SpeculationResult = {
  messages: Message[]
  boundary: CompletionBoundary | null
  timeSavedMs: number
}

// SpeculationState 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type SpeculationState =
  | { status: 'idle' }
  | {
      status: 'active'
      id: string
      // 这个回调绑定到 abort: () => void，负责应用状态管理在该局部场景下的响应。
      abort: () => void
      startTime: number
      messagesRef: { current: Message[] } // Mutable ref - avoids array spreading per message
      writtenPathsRef: { current: Set<string> } // Mutable ref - relative paths written to overlay
      boundary: CompletionBoundary | null
      suggestionLength: number
      toolUseCount: number
      isPipelined: boolean
      contextRef: { current: REPLHookContext }
      pipelinedSuggestion?: {
        text: string
        promptId: 'user_intent' | 'stated_intent'
        generationRequestId: string | null
      } | null
    }

// IDLE_SPECULATION_STATE 状态 集中保存状态管理 App State Store要一起传递的字段。
export const IDLE_SPECULATION_STATE: SpeculationState = { status: 'idle' }

// FooterItem 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type FooterItem =
  | 'tasks'
  | 'tmux'
  | 'bagel'
  | 'teams'
  | 'bridge'
  | 'companion'

// AppState 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type AppState = DeepImmutable<{
  settings: SettingsJson
  verbose: boolean
  mainLoopModel: ModelSetting
  mainLoopModelForSession: ModelSetting
  statusLineText: string | undefined
  expandedView: 'none' | 'tasks' | 'teammates'
  isBriefOnly: boolean
  // Optional - only present when ENABLE_AGENT_SWARMS is true (for dead code elimination)
  showTeammateMessagePreview?: boolean
  selectedIPAgentIndex: number
  // CoordinatorTaskPanel selection: -1 = pill, 0 = main, 1..N = agent rows.
  // AppState (not local) so the panel can read it directly without prop-drilling
  // through PromptInput → PromptInputFooter.
  coordinatorTaskIndex: number
  viewSelectionMode: 'none' | 'selecting-agent' | 'viewing-agent'
  // Which footer pill is focused (arrow-key navigation below the prompt).
  // Lives in AppState so pill components rendered outside PromptInput
  // (CompanionSprite in REPL.tsx) can read their own focused state.
  footerSelection: FooterItem | null
  toolPermissionContext: ToolPermissionContext
  spinnerTip?: string
  // Agent name from --agent CLI flag or settings (for logo display)
  agent: string | undefined
  // Assistant mode fully enabled (settings + GrowthBook gate + trust).
  // Single source of truth - computed once in main.tsx before option
  // mutation, consumers read this instead of re-calling isAssistantMode().
  kairosEnabled: boolean
  // Remote session URL for --remote mode (shown in footer indicator)
  remoteSessionUrl: string | undefined
  // Remote session WS state (`claude assistant` viewer). 'connected' means the
  // live event stream is open; 'reconnecting' = transient WS drop, backoff
  // in progress; 'disconnected' = permanent close or reconnects exhausted.
  remoteConnectionStatus:
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
  // `claude assistant`: count of background tasks (Agent calls, teammates,
  // workflows) running inside the REMOTE daemon child. Event-sourced from
  // system/task_started and system/task_notification on the WS. The local
  // AppState.tasks is always empty in viewer mode — the tasks live in a
  // different process.
  remoteBackgroundTaskCount: number
  // Always-on bridge: desired state (controlled by /config or footer toggle)
  replBridgeEnabled: boolean
  // Always-on bridge: true when activated via /remote-control command, false when config-driven
  replBridgeExplicit: boolean
  // Outbound-only mode: forward events to CCR but reject inbound prompts/control
  replBridgeOutboundOnly: boolean
  // Always-on bridge: env registered + session created (= "Ready")
  replBridgeConnected: boolean
  // Always-on bridge: ingress WebSocket is open (= "Connected" - user on claude.ai)
  replBridgeSessionActive: boolean
  // Always-on bridge: poll loop is in error backoff (= "Reconnecting")
  replBridgeReconnecting: boolean
  // Always-on bridge: connect URL for Ready state (?bridge=envId)
  replBridgeConnectUrl: string | undefined
  // Always-on bridge: session URL on claude.ai (set when connected)
  replBridgeSessionUrl: string | undefined
  // Always-on bridge: IDs for debugging (shown in dialog when --verbose)
  replBridgeEnvironmentId: string | undefined
  replBridgeSessionId: string | undefined
  // Always-on bridge: error message when connection fails (shown in BridgeDialog)
  replBridgeError: string | undefined
  // Always-on bridge: session name set via `/remote-control <name>` (used as session title)
  replBridgeInitialName: string | undefined
  // Always-on bridge: first-time remote dialog pending (set by /remote-control command)
  showRemoteCallout: boolean
}> & {
  // Unified task state - excluded from DeepImmutable because TaskState contains function types
  tasks: { [taskId: string]: TaskState }
  // Name → AgentId registry populated by Agent tool when `name` is provided.
  // Latest-wins on collision. Used by SendMessage to route by name.
  agentNameRegistry: Map<string, AgentId>
  // Task ID that has been foregrounded - its messages are shown in main view
  foregroundedTaskId?: string
  // Task ID of in-process teammate whose transcript is being viewed (undefined = leader's view)
  viewingAgentTaskId?: string
  // Latest companion reaction from the friend observer (src/buddy/observer.ts)
  companionReaction?: string
  // Timestamp of last /buddy pet — CompanionSprite renders hearts while recent
  companionPetAt?: number
  // TODO (ashwin): see if we can use utility-types DeepReadonly for this
  mcp: {
    clients: MCPServerConnection[]
    tools: Tool[]
    commands: Command[]
    resources: Record<string, ServerResource[]>
    /**
     * Incremented by /reload-plugins to trigger MCP effects to re-run
     * and pick up newly-enabled plugin MCP servers. Effects read this
     * as a dependency; the value itself is not consumed.
     */
    pluginReconnectKey: number
  }
  plugins: {
    enabled: LoadedPlugin[]
    disabled: LoadedPlugin[]
    commands: Command[]
    /**
     * Plugin system errors collected during loading and initialization.
     * See {@link PluginError} type documentation for complete details on error
     * structure, context fields, and display format.
     */
    errors: PluginError[]
    // Installation status for background plugin/marketplace installation
    installationStatus: {
      marketplaces: Array<{
        name: string
        status: 'pending' | 'installing' | 'installed' | 'failed'
        error?: string
      }>
      plugins: Array<{
        id: string
        name: string
        status: 'pending' | 'installing' | 'installed' | 'failed'
        error?: string
      }>
    }
    /**
     * Set to true when plugin state on disk has changed (background reconcile,
     * /plugin menu install, external settings edit) and active components are
     * stale. In interactive mode, user runs /reload-plugins to consume. In
     * headless mode, refreshPluginState() auto-consumes via refreshActivePlugins().
     */
    needsRefresh: boolean
  }
  agentDefinitions: AgentDefinitionsResult
  fileHistory: FileHistoryState
  attribution: AttributionState
  todos: { [agentId: string]: TodoList }
  remoteAgentTaskSuggestions: { summary: string; task: string }[]
  notifications: {
    current: Notification | null
    queue: Notification[]
  }
  elicitation: {
    queue: ElicitationRequestEvent[]
  }
  thinkingEnabled: boolean | undefined
  promptSuggestionEnabled: boolean
  sessionHooks: SessionHooksState
  tungstenActiveSession?: {
    sessionName: string
    socketName: string
    target: string // The tmux target (e.g., "session:window.pane")
  }
  tungstenLastCapturedTime?: number // Timestamp when frame was captured for model
  tungstenLastCommand?: {
    command: string // The command string to display (e.g., "Enter", "echo hello")
    timestamp: number // When the command was sent
  }
  // Sticky tmux panel visibility — mirrors globalConfig.tungstenPanelVisible for reactivity.
  tungstenPanelVisible?: boolean
  // Transient auto-hide at turn end — separate from tungstenPanelVisible so the
  // pill stays in the footer (user can reopen) but the panel content doesn't take
  // screen space when idle. Cleared on next Tmux tool use or user toggle. NOT persisted.
  tungstenPanelAutoHidden?: boolean
  // WebBrowser tool (codename bagel): pill visible in footer
  bagelActive?: boolean
  // WebBrowser tool: current page URL shown in pill label
  bagelUrl?: string
  // WebBrowser tool: sticky panel visibility toggle
  bagelPanelVisible?: boolean
  // chicago MCP session state. Types inlined (not imported from
  // @ant/computer-use-mcp/types) so external typecheck passes without the
  // ant-scoped dep resolved. Shapes match `AppGrant`/`CuGrantFlags`
  // structurally — wrapper.tsx assigns via structural compatibility. Only
  // populated when feature('CHICAGO_MCP') is active.
  computerUseMcpState?: {
    // Session-scoped app allowlist. NOT persisted across resume.
    allowedApps?: readonly {
      bundleId: string
      displayName: string
      grantedAt: number
    }[]
    // Clipboard/system-key grant flags (orthogonal to allowlist).
    grantFlags?: {
      clipboardRead: boolean
      clipboardWrite: boolean
      systemKeyCombos: boolean
    }
    // Dims-only (NOT the blob) for scaleCoord after compaction. The full
    // `ScreenshotResult` including base64 is process-local in wrapper.tsx.
    lastScreenshotDims?: {
      width: number
      height: number
      displayWidth: number
      displayHeight: number
      displayId?: number
      originX?: number
      originY?: number
    }
    // Accumulated by onAppsHidden, cleared + unhidden at turn end.
    hiddenDuringTurn?: ReadonlySet<string>
    // Which display CU targets. Written back by the package's
    // `autoTargetDisplay` resolver via `onResolvedDisplayUpdated`. Persisted
    // across resume so clicks stay on the display the model last saw.
    selectedDisplayId?: number
    // True when the model explicitly picked a display via `switch_display`.
    // Makes `handleScreenshot` skip the resolver chase chain and honor
    // `selectedDisplayId` directly. Cleared on resolver writeback (pinned
    // display unplugged → Swift fell back to main) and on
    // `switch_display("auto")`.
    displayPinnedByModel?: boolean
    // Sorted comma-joined bundle-ID set the display was last auto-resolved
    // for. `handleScreenshot` only re-resolves when the allowed set has
    // changed since — keeps the resolver from yanking on every screenshot.
    displayResolvedForApps?: string
  }
  // REPL tool VM context - persists across REPL calls for state sharing
  replContext?: {
    vmContext: import('vm').Context
    registeredTools: Map<
      string,
      {
        name: string
        description: string
        schema: Record<string, unknown>
        // 这个回调绑定到 handler: (args: Record<string, unknown>) => Promise<unknown>，负责应用状态管理在该局部场景下的响应。
        handler: (args: Record<string, unknown>) => Promise<unknown>
      }
    >
    console: {
      // 这个回调绑定到 log: (...args: unknown[]) => void，负责应用状态管理在该局部场景下的响应。
      log: (...args: unknown[]) => void
      // 这个回调绑定到 error: (...args: unknown[]) => void，负责应用状态管理在该局部场景下的响应。
      error: (...args: unknown[]) => void
      // 这个回调绑定到 warn: (...args: unknown[]) => void，负责应用状态管理在该局部场景下的响应。
      warn: (...args: unknown[]) => void
      // 这个回调绑定到 info: (...args: unknown[]) => void，负责应用状态管理在该局部场景下的响应。
      info: (...args: unknown[]) => void
      // 这个回调绑定到 debug: (...args: unknown[]) => void，负责应用状态管理在该局部场景下的响应。
      debug: (...args: unknown[]) => void
      // 这个回调绑定到 getStdout: () => string，负责应用状态管理在该局部场景下的响应。
      getStdout: () => string
      // 这个回调绑定到 getStderr: () => string，负责应用状态管理在该局部场景下的响应。
      getStderr: () => string
      // 这个回调绑定到 clear: () => void，负责应用状态管理在该局部场景下的响应。
      clear: () => void
    }
  }
  teamContext?: {
    teamName: string
    teamFilePath: string
    leadAgentId: string
    // Self-identity for swarm members (separate processes in tmux panes)
    // Note: This is different from toolUseContext.agentId which is for in-process subagents
    selfAgentId?: string // Swarm member's own ID (same as leadAgentId for leaders)
    selfAgentName?: string // Swarm member's name ('team-lead' for leaders)
    isLeader?: boolean // True if this swarm member is the team leader
    selfAgentColor?: string // Assigned color for UI (used by dynamically joined sessions)
    teammates: {
      [teammateId: string]: {
        name: string
        agentType?: string
        color?: string
        tmuxSessionName: string
        tmuxPaneId: string
        cwd: string
        worktreePath?: string
        spawnedAt: number
      }
    }
  }
  // Standalone agent context for non-swarm sessions with custom name/color
  standaloneAgentContext?: {
    name: string
    color?: AgentColorName
  }
  inbox: {
    messages: Array<{
      id: string
      from: string
      text: string
      timestamp: string
      status: 'pending' | 'processing' | 'processed'
      color?: string
      summary?: string
    }>
  }
  // Worker sandbox permission requests (leader side) - for network access approval
  workerSandboxPermissions: {
    queue: Array<{
      requestId: string
      workerId: string
      workerName: string
      workerColor?: string
      host: string
      createdAt: number
    }>
    selectedIndex: number
  }
  // Pending permission request on worker side (shown while waiting for leader approval)
  pendingWorkerRequest: {
    toolName: string
    toolUseId: string
    description: string
  } | null
  // Pending sandbox permission request on worker side
  pendingSandboxRequest: {
    requestId: string
    host: string
  } | null
  promptSuggestion: {
    text: string | null
    promptId: 'user_intent' | 'stated_intent' | null
    shownAt: number
    acceptedAt: number
    generationRequestId: string | null
  }
  speculation: SpeculationState
  speculationSessionTimeSavedMs: number
  skillImprovement: {
    suggestion: {
      skillName: string
      updates: { section: string; change: string; reason: string }[]
    } | null
  }
  // Auth version - incremented on login/logout to trigger re-fetching of auth-dependent data
  authVersion: number
  // Initial message to process (from CLI args or plan mode exit)
  // When set, REPL will process the message and trigger a query
  initialMessage: {
    message: UserMessage
    clearContext?: boolean
    mode?: PermissionMode
    // Session-scoped permission rules from plan mode (e.g., "run tests", "install dependencies")
    allowedPrompts?: AllowedPrompt[]
  } | null
  // Pending plan verification state (set when exiting plan mode)
  // Used by VerifyPlanExecution tool to trigger background verification
  pendingPlanVerification?: {
    plan: string
    verificationStarted: boolean
    verificationCompleted: boolean
  }
  // Denial tracking for classifier modes (YOLO, headless, etc.) - falls back to prompting when limits exceeded
  denialTracking?: DenialTrackingState
  // Active overlays (Select dialogs, etc.) for Escape key coordination
  activeOverlays: ReadonlySet<string>
  // Fast mode
  fastMode?: boolean
  // Advisor model for server-side advisor tool (undefined = disabled).
  advisorModel?: string
  // Effort value
  effortValue?: EffortValue
  // Set synchronously in launchUltraplan before the detached flow starts.
  // Prevents duplicate launches during the ~5s window before
  // ultraplanSessionUrl is set by teleportToRemote. Cleared by launchDetached
  // once the URL is set or on failure.
  ultraplanLaunching?: boolean
  // Active ultraplan CCR session URL. Set while the RemoteAgentTask runs;
  // truthy disables the keyword trigger + rainbow. Cleared when the poll
  // reaches terminal state.
  ultraplanSessionUrl?: string
  // Approved ultraplan awaiting user choice (implement here vs fresh session).
  // Set by RemoteAgentTask poll on approval; cleared by UltraplanChoiceDialog.
  ultraplanPendingChoice?: { plan: string; sessionId: string; taskId: string }
  // Pre-launch permission dialog. Set by /ultraplan (slash or keyword);
  // cleared by UltraplanLaunchDialog on choice.
  ultraplanLaunchPending?: { blurb: string }
  // Remote-harness side: set via set_permission_mode control_request,
  // pushed to CCR external_metadata.is_ultraplan_mode by onChangeAppState.
  isUltraplanMode?: boolean
  // Always-on bridge: permission callbacks for bidirectional permission checks
  replBridgePermissionCallbacks?: BridgePermissionCallbacks
  // Channel permission callbacks — permission prompts over Telegram/iMessage/etc.
  // Races against local UI + bridge + hooks + classifier via claim() in
  // interactiveHandler.ts. Constructed once in useManageMCPConnections.
  channelPermissionCallbacks?: ChannelPermissionCallbacks
}

// AppStateStore 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type AppStateStore = Store<AppState>

// getDefaultAppState 封装AppStateStore的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultAppState(): AppState {
  // Determine initial permission mode for teammates spawned with plan_mode_required
  // Use lazy require to avoid circular dependency with teammate.ts
  /* eslint-disable @typescript-eslint/no-require-imports */
  // teammateUtils 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const teammateUtils =
    require('../utils/teammate.js') as typeof import('../utils/teammate.js')
  /* eslint-enable @typescript-eslint/no-require-imports */
  // initialMode 先占位，稍后的条件分支会根据实际输入补齐它。
  const initialMode: PermissionMode =
    teammateUtils.isTeammate() && teammateUtils.isPlanModeRequired()
      ? 'plan'
      : 'default'

  // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
  return {
    settings: getInitialSettings(),
    tasks: {},
    agentNameRegistry: new Map(),
    verbose: false,
    mainLoopModel: null, // alias, full name (as with --model or env var), or null (default)
    mainLoopModelForSession: null,
    statusLineText: undefined,
    expandedView: 'none',
    isBriefOnly: false,
    showTeammateMessagePreview: false,
    selectedIPAgentIndex: -1,
    coordinatorTaskIndex: -1,
    viewSelectionMode: 'none',
    footerSelection: null,
    kairosEnabled: false,
    remoteSessionUrl: undefined,
    remoteConnectionStatus: 'connecting',
    remoteBackgroundTaskCount: 0,
    replBridgeEnabled: false,
    replBridgeExplicit: false,
    replBridgeOutboundOnly: false,
    replBridgeConnected: false,
    replBridgeSessionActive: false,
    replBridgeReconnecting: false,
    replBridgeConnectUrl: undefined,
    replBridgeSessionUrl: undefined,
    replBridgeEnvironmentId: undefined,
    replBridgeSessionId: undefined,
    replBridgeError: undefined,
    replBridgeInitialName: undefined,
    showRemoteCallout: false,
    toolPermissionContext: {
      ...getEmptyToolPermissionContext(),
      mode: initialMode,
    },
    agent: undefined,
    agentDefinitions: { activeAgents: [], allAgents: [] },
    fileHistory: {
      snapshots: [],
      trackedFiles: new Set(),
      snapshotSequence: 0,
    },
    attribution: createEmptyAttributionState(),
    mcp: {
      clients: [],
      tools: [],
      commands: [],
      resources: {},
      pluginReconnectKey: 0,
    },
    plugins: {
      enabled: [],
      disabled: [],
      commands: [],
      errors: [],
      installationStatus: {
        marketplaces: [],
        plugins: [],
      },
      needsRefresh: false,
    },
    todos: {},
    remoteAgentTaskSuggestions: [],
    notifications: {
      current: null,
      queue: [],
    },
    elicitation: {
      queue: [],
    },
    thinkingEnabled: shouldEnableThinkingByDefault(),
    promptSuggestionEnabled: shouldEnablePromptSuggestion(),
    sessionHooks: new Map(),
    inbox: {
      messages: [],
    },
    workerSandboxPermissions: {
      queue: [],
      selectedIndex: 0,
    },
    pendingWorkerRequest: null,
    pendingSandboxRequest: null,
    promptSuggestion: {
      text: null,
      promptId: null,
      shownAt: 0,
      acceptedAt: 0,
      generationRequestId: null,
    },
    speculation: IDLE_SPECULATION_STATE,
    speculationSessionTimeSavedMs: 0,
    skillImprovement: {
      suggestion: null,
    },
    authVersion: 0,
    initialMessage: null,
    effortValue: undefined,
    activeOverlays: new Set<string>(),
    fastMode: false,
  }
}
