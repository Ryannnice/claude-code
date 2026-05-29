/**
 * Agent context for analytics attribution using AsyncLocalStorage.
 *
 * This module provides a way to track agent identity across async operations
 * without parameter drilling. Supports two agent types:
 *
 * 1. Subagents (Agent tool): Run in-process for quick, delegated tasks.
 *    Context: SubagentContext with agentType: 'subagent'
 *
 * 2. In-process teammates: Part of a swarm with team coordination.
 *    Context: TeammateAgentContext with agentType: 'teammate'
 *
 * For swarm teammates in separate processes (tmux/iTerm2), use environment
 * variables instead: CLAUDE_CODE_AGENT_ID, CLAUDE_CODE_PARENT_SESSION_ID
 *
 * WHY AsyncLocalStorage (not AppState):
 * When agents are backgrounded (ctrl+b), multiple agents can run concurrently
 * in the same process. AppState is a single shared state that would be
 * overwritten, causing Agent A's events to incorrectly use Agent B's context.
 * AsyncLocalStorage isolates each async execution chain, so concurrent agents
 * don't interfere with each other.
 */

// 引入 AsyncLocalStorage，将 async_hooks 中已经封装好的能力接到本文件流程里。
import { AsyncLocalStorage } from 'async_hooks'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../services/analytics/index.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../services/analytics/index.js'
// 引入 isAgentSwarmsEnabled，将 ./agentSwarmsEnabled.js 中已经封装好的能力接到本文件流程里。
import { isAgentSwarmsEnabled } from './agentSwarmsEnabled.js'

/**
 * Context for subagents (Agent tool agents).
 * Subagents run in-process for quick, delegated tasks.
 */
// SubagentContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SubagentContext = {
  /** The subagent's UUID (from createAgentId()) */
  agentId: string
  /** The team lead's session ID (from CLAUDE_CODE_PARENT_SESSION_ID env var), undefined for main REPL subagents */
  parentSessionId?: string
  /** Agent type - 'subagent' for Agent tool agents */
  agentType: 'subagent'
  /** The subagent's type name (e.g., "Explore", "Bash", "code-reviewer") */
  subagentName?: string
  /** Whether this is a built-in agent (vs user-defined custom agent) */
  isBuiltIn?: boolean
  /** The request_id in the invoking agent that spawned or resumed this agent.
   *  For nested subagents this is the immediate invoker, not the root —
   *  session_id already bundles the whole tree. Updated on each resume. */
  invokingRequestId?: string
  /** Whether this invocation is the initial spawn or a subsequent resume
   *  via SendMessage. Undefined when invokingRequestId is absent. */
  invocationKind?: 'spawn' | 'resume'
  /** Mutable flag: has this invocation's edge been emitted to telemetry yet?
   *  Reset to false on each spawn/resume; flipped true by
   *  consumeInvokingRequestId() on the first terminal API event. */
  invocationEmitted?: boolean
}

/**
 * Context for in-process teammates.
 * Teammates are part of a swarm and have team coordination.
 */
// TeammateAgentContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateAgentContext = {
  /** Full agent ID, e.g., "researcher@my-team" */
  agentId: string
  /** Display name, e.g., "researcher" */
  agentName: string
  /** Team name this teammate belongs to */
  teamName: string
  /** UI color assigned to this teammate */
  agentColor?: string
  /** Whether teammate must enter plan mode before implementing */
  planModeRequired: boolean
  /** The team lead's session ID for transcript correlation */
  parentSessionId: string
  /** Whether this agent is the team lead */
  isTeamLead: boolean
  /** Agent type - 'teammate' for swarm teammates */
  agentType: 'teammate'
  /** The request_id in the invoking agent that spawned or resumed this
   *  teammate. Undefined for teammates started outside a tool call
   *  (e.g. session start). Updated on each resume. */
  invokingRequestId?: string
  /** See SubagentContext.invocationKind. */
  invocationKind?: 'spawn' | 'resume'
  /** Mutable flag: see SubagentContext.invocationEmitted. */
  invocationEmitted?: boolean
}

/**
 * Discriminated union for agent context.
 * Use agentType to distinguish between subagent and teammate contexts.
 */
// AgentContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentContext = SubagentContext | TeammateAgentContext

// agentContextStorage 命名 `new AsyncLocalStorage<AgentContext>()`，让后续代码直接表达这个值的用途。
const agentContextStorage = new AsyncLocalStorage<AgentContext>()

/**
 * Get the current agent context, if any.
 * Returns undefined if not running within an agent context (subagent or teammate).
 * Use type guards isSubagentContext() or isTeammateAgentContext() to narrow the type.
 */
// getAgentContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentContext(): AgentContext | undefined {
  // 返回 `agentContextStorage.getStore()`，作为共享工具这次计算的结果。
  return agentContextStorage.getStore()
}

/**
 * Run an async function with the given agent context.
 * All async operations within the function will have access to this context.
 */
// runWithAgentContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function runWithAgentContext<T>(context: AgentContext, fn: () => T): T {
  // 返回 `agentContextStorage.run(context, fn)`，作为共享工具这次计算的结果。
  return agentContextStorage.run(context, fn)
}

/**
 * Type guard to check if context is a SubagentContext.
 */
// isSubagentContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSubagentContext(
  context: AgentContext | undefined,
): context is SubagentContext {
  // 返回 `context?.agentType === 'subagent'`，作为共享工具这次计算的结果。
  return context?.agentType === 'subagent'
}

/**
 * Type guard to check if context is a TeammateAgentContext.
 */
// isTeammateAgentContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeammateAgentContext(
  context: AgentContext | undefined,
): context is TeammateAgentContext {
  // 满足 `isAgentSwarmsEnabled()` 时，共享工具执行该分支。
  if (isAgentSwarmsEnabled()) {
    // 返回 `context?.agentType === 'teammate'`，作为共享工具这次计算的结果。
    return context?.agentType === 'teammate'
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Get the subagent name suitable for analytics logging.
 * Returns the agent type name for built-in agents, "user-defined" for custom agents,
 * or undefined if not running within a subagent context.
 *
 * Safe for analytics metadata: built-in agent names are code constants,
 * and custom agents are always mapped to the literal "user-defined".
 */
// getSubagentLogName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSubagentLogName():
  | AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  | undefined {
  // 上下文读取`getAgentContext`，供共享工具后续处理使用。
  const context = getAgentContext()
  // 只有 `!isSubagentContext(context) || !context.subagentName` 满足时，共享工具才执行该分支。
  if (!isSubagentContext(context) || !context.subagentName) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    context.isBuiltIn ? context.subagentName : 'user-defined'
  ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Get the invoking request_id for the current agent context — once per
 * invocation. Returns the id on the first call after a spawn/resume, then
 * undefined until the next boundary. Also undefined on the main thread or
 * when the spawn path had no request_id.
 *
 * Sparse edge semantics: invokingRequestId appears on exactly one
 * tengu_api_success/error per invocation, so a non-NULL value downstream
 * marks a spawn/resume boundary.
 */
// consumeInvokingRequestId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function consumeInvokingRequestId():
  | {
      invokingRequestId: string
      invocationKind: 'spawn' | 'resume' | undefined
    }
  | undefined {
  // 上下文读取`getAgentContext`，供共享工具后续处理使用。
  const context = getAgentContext()
  // 只有 `!context?.invokingRequestId || context.invocation` 满足时，共享工具才执行该分支。
  if (!context?.invokingRequestId || context.invocationEmitted) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // invocationEmitted更新为 `true`，确保共享工具后续读取最新状态。
  context.invocationEmitted = true
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    invokingRequestId: context.invokingRequestId,
    invocationKind: context.invocationKind,
  }
}
