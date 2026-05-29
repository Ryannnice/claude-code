// 类型依赖 { AgentColorName } 来自 ../../../tools/AgentTool/agentColorManager.js，用于校准共享工具的数据契约。
import type { AgentColorName } from '../../../tools/AgentTool/agentColorManager.js'

/**
 * Types of backends available for teammate execution.
 * - 'tmux': Uses tmux for pane management (works in tmux or standalone)
 * - 'iterm2': Uses iTerm2 native split panes via the it2 CLI
 * - 'in-process': Runs teammate in the same Node.js process with isolated context
 */
// BackendType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BackendType = 'tmux' | 'iterm2' | 'in-process'

/**
 * Subset of BackendType for pane-based backends only.
 * Used in messages and types that specifically deal with terminal panes.
 */
// PaneBackendType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PaneBackendType = 'tmux' | 'iterm2'

/**
 * Opaque identifier for a pane managed by a backend.
 * For tmux, this is the tmux pane ID (e.g., "%1").
 * For iTerm2, this is the session ID returned by it2.
 */
// PaneId 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PaneId = string

/**
 * Result of creating a new teammate pane.
 */
// CreatePaneResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CreatePaneResult = {
  /** The pane ID for the newly created pane */
  paneId: PaneId
  /** Whether this is the first teammate pane (affects layout strategy) */
  isFirstTeammate: boolean
}

/**
 * Interface for pane management backends.
 * Abstracts operations for creating and managing terminal panes
 * for teammate visualization in swarm mode.
 */
// PaneBackend 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PaneBackend = {
  /** The type identifier for this backend */
  readonly type: BackendType

  /** Human-readable display name for this backend */
  readonly displayName: string

  /** Whether this backend supports hiding and showing panes */
  readonly supportsHideShow: boolean

  /**
   * Checks if this backend is available on the system.
   * For tmux: checks if tmux command exists.
   * For iTerm2: checks if it2 CLI is installed and configured.
   */
  // isAvailable 用 无 判断共享工具是否满足条件。
  isAvailable(): Promise<boolean>

  /**
   * Checks if we're currently running inside this backend's environment.
   * For tmux: checks if we're in a tmux session.
   * For iTerm2: checks if we're running in iTerm2.
   */
  // isRunningInside 用 无 判断共享工具是否满足条件。
  isRunningInside(): Promise<boolean>

  /**
   * Creates a new pane for a teammate in the swarm view.
   * The backend handles layout strategy (with/without leader pane).
   *
   * @param name - The teammate's name for display
   * @param color - The color to use for the pane border/title
   * @returns The pane ID and whether this was the first teammate
   */
  // 调用 createTeammatePaneInSwarmView，触发共享工具此处需要的副作用。
  createTeammatePaneInSwarmView(
    name: string,
    color: AgentColorName,
  ): Promise<CreatePaneResult>

  /**
   * Sends a command to execute in a specific pane.
   *
   * @param paneId - The pane to send the command to
   * @param command - The command string to execute
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   */
  // 调用 sendCommandToPane，触发共享工具此处需要的副作用。
  sendCommandToPane(
    paneId: PaneId,
    command: string,
    useExternalSession?: boolean,
  ): Promise<void>

  /**
   * Sets the border color for a pane.
   *
   * @param paneId - The pane to style
   * @param color - The color to apply to the border
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   */
  // setPaneBorderColor 写入新的状态值，使共享工具后续读取保持一致。
  setPaneBorderColor(
    paneId: PaneId,
    color: AgentColorName,
    useExternalSession?: boolean,
  ): Promise<void>

  /**
   * Sets the title for a pane (displayed in pane border/header).
   *
   * @param paneId - The pane to title
   * @param name - The title to display
   * @param color - The color for the title text
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   */
  // setPaneTitle 写入新的状态值，使共享工具后续读取保持一致。
  setPaneTitle(
    paneId: PaneId,
    name: string,
    color: AgentColorName,
    useExternalSession?: boolean,
  ): Promise<void>

  /**
   * Enables pane border status display (shows titles in borders).
   *
   * @param windowTarget - The window to enable status for (optional)
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   */
  // 调用 enablePaneBorderStatus，触发共享工具此处需要的副作用。
  enablePaneBorderStatus(
    windowTarget?: string,
    useExternalSession?: boolean,
  ): Promise<void>

  /**
   * Rebalances panes to achieve the desired layout.
   *
   * @param windowTarget - The window containing the panes
   * @param hasLeader - Whether there's a leader pane (affects layout strategy)
   */
  // rebalancePanes 使用 windowTarget: string, hasLeader: boolean 完成共享工具里的对应操作。
  rebalancePanes(windowTarget: string, hasLeader: boolean): Promise<void>

  /**
   * Kills/closes a specific pane.
   *
   * @param paneId - The pane to kill
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   * @returns true if the pane was killed successfully, false otherwise
   */
  // killPane 使用 paneId: PaneId, useExternalSession?: boolean 完成共享工具里的对应操作。
  killPane(paneId: PaneId, useExternalSession?: boolean): Promise<boolean>

  /**
   * Hides a pane by breaking it out into a hidden window.
   * The pane remains running but is not visible in the main layout.
   *
   * @param paneId - The pane to hide
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   * @returns true if the pane was hidden successfully, false otherwise
   */
  // hidePane 使用 paneId: PaneId, useExternalSession?: boolean 完成共享工具里的对应操作。
  hidePane(paneId: PaneId, useExternalSession?: boolean): Promise<boolean>

  /**
   * Shows a previously hidden pane by joining it back into the main window.
   *
   * @param paneId - The pane to show
   * @param targetWindowOrPane - The window or pane to join into
   * @param useExternalSession - If true, uses external session socket (tmux-specific)
   * @returns true if the pane was shown successfully, false otherwise
   */
  // 调用 showPane，触发共享工具此处需要的副作用。
  showPane(
    paneId: PaneId,
    targetWindowOrPane: string,
    useExternalSession?: boolean,
  ): Promise<boolean>
}

/**
 * Result from backend detection.
 */
// BackendDetectionResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type BackendDetectionResult = {
  /** The backend that should be used */
  backend: PaneBackend
  /** Whether we're running inside the backend's native environment */
  isNative: boolean
  /** If iTerm2 is detected but it2 not installed, this will be true */
  needsIt2Setup?: boolean
}

// =============================================================================
// In-Process Teammate Types
// =============================================================================

/**
 * Identity fields for a teammate.
 * This is a subset shared with TeammateContext (Task #4) to avoid circular deps.
 * lifecycle-specialist defines the full TeammateContext with additional fields.
 */
// TeammateIdentity 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateIdentity = {
  /** Agent name (e.g., "researcher", "tester") */
  name: string
  /** Team name this teammate belongs to */
  teamName: string
  /** Assigned color for UI differentiation */
  color?: AgentColorName
  /** Whether plan mode approval is required before implementation */
  planModeRequired?: boolean
}

/**
 * Configuration for spawning a teammate (any execution mode).
 */
// TeammateSpawnConfig 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateSpawnConfig = TeammateIdentity & {
  /** Initial prompt to send to the teammate */
  prompt: string
  /** Working directory for the teammate */
  cwd: string
  /** Model to use for this teammate */
  model?: string
  /** System prompt for this teammate (resolved from workflow config) */
  systemPrompt?: string
  /** How to apply the system prompt: 'replace' or 'append' to default */
  systemPromptMode?: 'default' | 'replace' | 'append'
  /** Optional git worktree path */
  worktreePath?: string
  /** Parent session ID (for context linking) */
  parentSessionId: string
  /** Tool permissions to grant this teammate */
  permissions?: string[]
  /** Whether this teammate can show permission prompts for unlisted tools.
   * When false (default), unlisted tools are auto-denied. */
  allowPermissionPrompts?: boolean
}

/**
 * Result from spawning a teammate.
 */
// TeammateSpawnResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateSpawnResult = {
  /** Whether spawn was successful */
  success: boolean
  /** Unique agent ID (format: agentName@teamName) */
  agentId: string
  /** Error message if spawn failed */
  error?: string

  /**
   * Abort controller for lifecycle management (in-process only).
   * Leader uses this to cancel/kill the teammate.
   * For pane-based teammates, use kill() method instead.
   */
  abortController?: AbortController

  /**
   * Task ID in AppState.tasks (in-process only).
   * Used for UI rendering and progress tracking.
   * agentId is the logical identifier; taskId is for AppState indexing.
   */
  taskId?: string

  /** Pane ID (pane-based only) */
  paneId?: PaneId
}

/**
 * Message to send to a teammate.
 */
// TeammateMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateMessage = {
  /** Message content */
  text: string
  /** Sender agent ID */
  from: string
  /** Sender display color */
  color?: string
  /** Message timestamp (ISO string) */
  timestamp?: string
  /** 5-10 word summary shown as preview in the UI */
  summary?: string
}

/**
 * Common interface for teammate execution backends.
 * Abstracts the differences between pane-based (tmux/iTerm2) and in-process execution.
 *
 * PaneBackend handles low-level pane operations; TeammateExecutor handles
 * high-level teammate lifecycle operations that work across all backends.
 */
// TeammateExecutor 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateExecutor = {
  /** Backend type identifier */
  readonly type: BackendType

  /** Check if this executor is available on the system */
  // isAvailable 用 无 判断共享工具是否满足条件。
  isAvailable(): Promise<boolean>

  /** Spawn a new teammate with the given configuration */
  // spawn 使用 config: TeammateSpawnConfig 完成共享工具里的对应操作。
  spawn(config: TeammateSpawnConfig): Promise<TeammateSpawnResult>

  /** Send a message to a teammate */
  // sendMessage 使用 agentId: string, message: TeammateMessage 完成共享工具里的对应操作。
  sendMessage(agentId: string, message: TeammateMessage): Promise<void>

  /** Terminate a teammate (graceful shutdown request) */
  // terminate 使用 agentId: string, reason?: string 完成共享工具里的对应操作。
  terminate(agentId: string, reason?: string): Promise<boolean>

  /** Force kill a teammate (immediate termination) */
  // kill 使用 agentId: string 完成共享工具里的对应操作。
  kill(agentId: string): Promise<boolean>

  /** Check if a teammate is still active */
  // isActive 用 agentId: string 判断共享工具是否满足条件。
  isActive(agentId: string): Promise<boolean>
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if a backend type uses terminal panes.
 */
// isPaneBackend 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPaneBackend(type: BackendType): type is 'tmux' | 'iterm2' {
  // 返回 `type === 'tmux' || type === 'iterm2'`，作为共享工具这次计算的结果。
  return type === 'tmux' || type === 'iterm2'
}
