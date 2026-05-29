// 类型依赖 { TaskStateBase } 来自 ../../Task.js，用于校准types的数据契约。
import type { TaskStateBase } from '../../Task.js'
// 类型依赖 { AgentToolResult } 来自 ../../tools/AgentTool/agentToolUtils.js，用于校准types的数据契约。
import type { AgentToolResult } from '../../tools/AgentTool/agentToolUtils.js'
// 类型依赖 { AgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准types的数据契约。
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准types的数据契约。
import type { Message } from '../../types/message.js'
// 类型依赖 { PermissionMode } 来自 ../../utils/permissions/PermissionMode.js，用于校准types的数据契约。
import type { PermissionMode } from '../../utils/permissions/PermissionMode.js'
// 类型依赖 { AgentProgress } 来自 ../LocalAgentTask/LocalAgentTask.js，用于校准types的数据契约。
import type { AgentProgress } from '../LocalAgentTask/LocalAgentTask.js'

/**
 * Teammate identity stored in task state.
 * Same shape as TeammateContext (runtime) but stored as plain data.
 * TeammateContext is for AsyncLocalStorage; this is for AppState persistence.
 */
// TeammateIdentity 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateIdentity = {
  agentId: string // e.g., "researcher@my-team"
  agentName: string // e.g., "researcher"
  teamName: string
  color?: string
  planModeRequired: boolean
  parentSessionId: string // Leader's session ID
}

// InProcessTeammateTaskState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type InProcessTeammateTaskState = TaskStateBase & {
  type: 'in_process_teammate'

  // Identity as sub-object (matches TeammateContext shape for consistency)
  // Stored as plain data in AppState, NOT a reference to AsyncLocalStorage
  identity: TeammateIdentity

  // Execution
  prompt: string
  // Optional model override for this teammate
  model?: string
  // Optional: Only set if teammate uses a specific agent definition
  // Many teammates run as general-purpose agents without a predefined definition
  selectedAgent?: AgentDefinition
  abortController?: AbortController // Runtime only, not serialized to disk - kills WHOLE teammate
  currentWorkAbortController?: AbortController // Runtime only - aborts current turn without killing teammate
  // 这个回调绑定到 unregisterCleanup?: () => void // Runtime only，负责types在该局部场景下的响应。
  unregisterCleanup?: () => void // Runtime only

  // Plan mode approval tracking (planModeRequired is in identity)
  awaitingPlanApproval: boolean

  // Permission mode for this teammate (cycled independently via Shift+Tab when viewing)
  permissionMode: PermissionMode

  // State
  error?: string
  result?: AgentToolResult // Reuse existing type since teammates run via runAgent()
  progress?: AgentProgress

  // Conversation history for zoomed view (NOT mailbox messages)
  // Mailbox messages are stored separately in teamContext.inProcessMailboxes
  messages?: Message[]

  // Tool use IDs currently being executed (for animation in transcript view)
  inProgressToolUseIDs?: Set<string>

  // Queue of user messages to deliver when viewing teammate transcript
  pendingUserMessages: string[]

  // UI: random spinner verbs (stable across re-renders, shared between components)
  spinnerVerb?: string
  pastTenseVerb?: string

  // Lifecycle
  isIdle: boolean
  shutdownRequested: boolean

  // Callbacks to notify when teammate becomes idle (runtime only)
  // Used by leader to efficiently wait without polling
  // 这个回调绑定到 onIdleCallbacks?: Array<() => void>，负责types在该局部场景下的响应。
  onIdleCallbacks?: Array<() => void>

  // Progress tracking (for computing deltas in notifications)
  lastReportedToolCount: number
  lastReportedTokenCount: number
}

// isInProcessTeammateTask 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInProcessTeammateTask(
  task: unknown,
): task is InProcessTeammateTaskState {
  // 返回 `(`，作为types这次计算的结果。
  return (
    typeof task === 'object' &&
    task !== null &&
    'type' in task &&
    task.type === 'in_process_teammate'
  )
}

/**
 * Cap on the number of messages kept in task.messages (the AppState UI mirror).
 *
 * task.messages exists purely for the zoomed transcript dialog, which only
 * needs recent context. The full conversation lives in the local allMessages
 * array (inProcessRunner) and on disk at the agent transcript path.
 *
 * BQ analysis (round 9, 2026-03-20) showed ~20MB RSS per agent at 500+ turn
 * sessions and ~125MB per concurrent agent in swarm bursts. Whale session
 * 9a990de8 launched 292 agents in 2 minutes and reached 36.8GB. The dominant
 * cost is this array holding a second full copy of every message.
 */
// TEAMMATE_MESSAGES_UI_CAP 消息数据保存`50`，供types后续判断或输出使用。
export const TEAMMATE_MESSAGES_UI_CAP = 50

/**
 * Append an item to a message array, capping the result at
 * TEAMMATE_MESSAGES_UI_CAP entries by dropping the oldest. Always returns
 * a new array (AppState immutability).
 */
// appendCappedMessage 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function appendCappedMessage<T>(
  prev: readonly T[] | undefined,
  item: T,
): T[] {
  // prev === undefined || prev为空时立即返回或跳过，避免types把空集合当成可处理内容。
  if (prev === undefined || prev.length === 0) {
    // 返回列表结果，保留types已经排好的条目顺序。
    return [item]
  }
  // 满足 `prev.length >= TEAMMATE_MESSAGES_UI_CAP` 时，types执行该分支。
  if (prev.length >= TEAMMATE_MESSAGES_UI_CAP) {
    // next格式化`prev.slice`，供types后续处理使用。
    const next = prev.slice(-(TEAMMATE_MESSAGES_UI_CAP - 1))
    // next追加新条目，保持收集顺序与输入顺序一致。
    next.push(item)
    // 返回 `next`，作为types这次计算的结果。
    return next
  }
  // 返回列表结果，保留types已经排好的条目顺序。
  return [...prev, item]
}
