/**
 * TeammateContext - Runtime context for in-process teammates
 *
 * This module provides AsyncLocalStorage-based context for in-process teammates,
 * enabling concurrent teammate execution without global state conflicts.
 *
 * Relationship with other teammate identity mechanisms:
 * - Env vars (CLAUDE_CODE_AGENT_ID): Process-based teammates spawned via tmux
 * - dynamicTeamContext (teammate.ts): Process-based teammates joining at runtime
 * - TeammateContext (this file): In-process teammates via AsyncLocalStorage
 *
 * The helper functions in teammate.ts check AsyncLocalStorage first, then
 * dynamicTeamContext, then env vars.
 */

// 引入 AsyncLocalStorage，将 async_hooks 中已经封装好的能力接到本文件流程里。
import { AsyncLocalStorage } from 'async_hooks'

/**
 * Runtime context for in-process teammates.
 * Stored in AsyncLocalStorage for concurrent access.
 */
// TeammateContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TeammateContext = {
  /** Full agent ID, e.g., "researcher@my-team" */
  agentId: string
  /** Display name, e.g., "researcher" */
  agentName: string
  /** Team name this teammate belongs to */
  teamName: string
  /** UI color assigned to this teammate */
  color?: string
  /** Whether teammate must enter plan mode before implementing */
  planModeRequired: boolean
  /** Leader's session ID (for transcript correlation) */
  parentSessionId: string
  /** Discriminator - always true for in-process teammates */
  isInProcess: true
  /** Abort controller for lifecycle management (linked to parent) */
  abortController: AbortController
}

// teammateContextStorage构建`new AsyncLocalStorage<TeammateContext>()`，供后续判断或组装使用。
const teammateContextStorage = new AsyncLocalStorage<TeammateContext>()

/**
 * Get the current in-process teammate context, if running as one.
 * Returns undefined if not running within an in-process teammate context.
 */
// getTeammateContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeammateContext(): TeammateContext | undefined {
  // 返回 `teammateContextStorage.getStore()`，作为共享工具这次计算的结果。
  return teammateContextStorage.getStore()
}

/**
 * Run a function with teammate context set.
 * Used when spawning an in-process teammate to establish its execution context.
 *
 * @param context - The teammate context to set
 * @param fn - The function to run with the context
 * @returns The return value of fn
 */
// runWithTeammateContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function runWithTeammateContext<T>(
  context: TeammateContext,
  // 这个回调绑定到 fn: () => T,，负责共享工具在该局部场景下的响应。
  fn: () => T,
): T {
  // 返回 `teammateContextStorage.run(context, fn)`，作为共享工具这次计算的结果。
  return teammateContextStorage.run(context, fn)
}

/**
 * Check if current execution is within an in-process teammate.
 * This is faster than getTeammateContext() !== undefined for simple checks.
 */
// isInProcessTeammate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isInProcessTeammate(): boolean {
  // 返回 `teammateContextStorage.getStore() !== undefined`，作为共享工具这次计算的结果。
  return teammateContextStorage.getStore() !== undefined
}

/**
 * Create a TeammateContext from spawn configuration.
 * The abortController is passed in by the caller. For in-process teammates,
 * this is typically an independent controller (not linked to parent) so teammates
 * continue running when the leader's query is interrupted.
 *
 * @param config - Configuration for the teammate context
 * @returns A complete TeammateContext with isInProcess: true
 */
// createTeammateContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createTeammateContext(config: {
  agentId: string
  agentName: string
  teamName: string
  color?: string
  planModeRequired: boolean
  parentSessionId: string
  abortController: AbortController
}): TeammateContext {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    ...config,
    isInProcess: true,
  }
}
