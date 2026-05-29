/**
 * Teammate utilities for agent swarm coordination
 *
 * These helpers identify whether this Claude Code instance is running as a
 * spawned teammate in a swarm. Teammates receive their identity via CLI
 * arguments (--agent-id, --team-name, etc.) which are stored in dynamicTeamContext.
 *
 * For in-process teammates (running in the same process), AsyncLocalStorage
 * provides isolated context per teammate, preventing concurrent overwrites.
 *
 * Priority order for identity resolution:
 * 1. AsyncLocalStorage (in-process teammates) - via teammateContext.ts
 * 2. dynamicTeamContext (tmux teammates via CLI args)
 */

// Re-export in-process teammate utilities from teammateContext.ts
// 重新导出这一组成员，让共享工具的公共 API 保持集中入口。
export {
  createTeammateContext,
  getTeammateContext,
  isInProcessTeammate,
  runWithTeammateContext,
  type TeammateContext,
} from './teammateContext.js'

// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'
// 引入 getTeammateContext，将 ./teammateContext.js 中已经封装好的能力接到本文件流程里。
import { getTeammateContext } from './teammateContext.js'

/**
 * Returns the parent session ID for this teammate.
 * For in-process teammates, this is the team lead's session ID.
 * Priority: AsyncLocalStorage (in-process) > dynamicTeamContext (tmux teammates).
 */
// getParentSessionId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getParentSessionId(): string | undefined {
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return inProcessCtx.parentSessionId
  // 返回 `dynamicTeamContext?.parentSessionId`，作为共享工具这次计算的结果。
  return dynamicTeamContext?.parentSessionId
}

/**
 * Dynamic team context for runtime team joining.
 * When set, these values take precedence over environment variables.
 */
// dynamicTeamContext 先占位，稍后的条件分支会根据实际输入补齐它。
let dynamicTeamContext: {
  agentId: string
  agentName: string
  teamName: string
  color?: string
  planModeRequired: boolean
  parentSessionId?: string
} | null = null

/**
 * Set the dynamic team context (called when joining a team at runtime)
 */
// setDynamicTeamContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setDynamicTeamContext(
  context: {
    agentId: string
    agentName: string
    teamName: string
    color?: string
    planModeRequired: boolean
    parentSessionId?: string
  } | null,
): void {
  // dynamicTeamContext更新为 `context`，确保共享工具后续读取最新状态。
  dynamicTeamContext = context
}

/**
 * Clear the dynamic team context (called when leaving a team)
 */
// clearDynamicTeamContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearDynamicTeamContext(): void {
  // dynamicTeamContext更新为 `null`，确保共享工具后续读取最新状态。
  dynamicTeamContext = null
}

/**
 * Get the current dynamic team context (for inspection/debugging)
 */
// getDynamicTeamContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDynamicTeamContext(): typeof dynamicTeamContext {
  // 返回 `dynamicTeamContext`，作为共享工具这次计算的结果。
  return dynamicTeamContext
}

/**
 * Returns the agent ID if this session is running as a teammate in a swarm,
 * or undefined if running as a standalone session.
 * Priority: AsyncLocalStorage (in-process) > dynamicTeamContext (tmux via CLI args).
 */
// getAgentId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentId(): string | undefined {
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return inProcessCtx.agentId
  // 返回 `dynamicTeamContext?.agentId`，作为共享工具这次计算的结果。
  return dynamicTeamContext?.agentId
}

/**
 * Returns the agent name if this session is running as a teammate in a swarm.
 * Priority: AsyncLocalStorage (in-process) > dynamicTeamContext (tmux via CLI args).
 */
// getAgentName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAgentName(): string | undefined {
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return inProcessCtx.agentName
  // 返回 `dynamicTeamContext?.agentName`，作为共享工具这次计算的结果。
  return dynamicTeamContext?.agentName
}

/**
 * Returns the team name if this session is part of a team.
 * Priority: AsyncLocalStorage (in-process) > dynamicTeamContext (tmux via CLI args) > passed teamContext.
 * Pass teamContext from AppState to support leaders who don't have dynamicTeamContext set.
 *
 * @param teamContext - Optional team context from AppState (for leaders)
 */
// getTeamName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeamName(teamContext?: {
  teamName: string
}): string | undefined {
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return inProcessCtx.teamName
  // 满足 `dynamicTeamContext?.teamName` 时，共享工具执行该分支。
  if (dynamicTeamContext?.teamName) return dynamicTeamContext.teamName
  // 返回 `teamContext?.teamName`，作为共享工具这次计算的结果。
  return teamContext?.teamName
}

/**
 * Returns true if this session is running as a teammate in a swarm.
 * Priority: AsyncLocalStorage (in-process) > dynamicTeamContext (tmux via CLI args).
 * For tmux teammates, requires BOTH an agent ID AND a team name.
 */
// isTeammate 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeammate(): boolean {
  // In-process teammates run within the same process
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return true
  // Tmux teammates require both agent ID and team name
  // 返回 `!!(dynamicTeamContext?.agentId && dynamicTeamContext?.teamName)`，作为共享工具这次计算的结果。
  return !!(dynamicTeamContext?.agentId && dynamicTeamContext?.teamName)
}

/**
 * Returns the teammate's assigned color,
 * or undefined if not running as a teammate or no color assigned.
 * Priority: AsyncLocalStorage (in-process) > dynamicTeamContext (tmux teammates).
 */
// getTeammateColor 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTeammateColor(): string | undefined {
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return inProcessCtx.color
  // 返回 `dynamicTeamContext?.color`，作为共享工具这次计算的结果。
  return dynamicTeamContext?.color
}

/**
 * Returns true if this teammate session requires plan mode before implementation.
 * When enabled, the teammate must enter plan mode and get approval before writing code.
 * Priority: AsyncLocalStorage > dynamicTeamContext > env var.
 */
// isPlanModeRequired 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPlanModeRequired(): boolean {
  // inProcessCtx读取`getTeammateContext`，供共享工具后续处理使用。
  const inProcessCtx = getTeammateContext()
  // 满足 `inProcessCtx` 时，共享工具执行该分支。
  if (inProcessCtx) return inProcessCtx.planModeRequired
  // `dynamicTeamContext` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (dynamicTeamContext !== null) {
    // 返回 `dynamicTeamContext.planModeRequired`，作为共享工具这次计算的结果。
    return dynamicTeamContext.planModeRequired
  }
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_PLAN_MODE_REQUIRED)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_PLAN_MODE_REQUIRED)
}

/**
 * Check if this session is a team lead.
 *
 * A session is considered a team lead if:
 * 1. A team context exists with a leadAgentId, AND
 * 2. Either:
 *    - Our CLAUDE_CODE_AGENT_ID matches the leadAgentId, OR
 *    - We have no CLAUDE_CODE_AGENT_ID set (backwards compat: the original
 *      session that created the team before agent IDs were standardized)
 *
 * @param teamContext - The team context from AppState, if any
 * @returns true if this session is the team lead
 */
// isTeamLead 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamLead(
  teamContext:
    | {
        leadAgentId: string
      }
    | undefined,
): boolean {
  // 满足 `!teamContext?.leadAgentId` 时，共享工具执行该分支。
  if (!teamContext?.leadAgentId) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Use getAgentId() for AsyncLocalStorage support (in-process teammates)
  // myAgentId读取`getAgentId`，供共享工具后续处理使用。
  const myAgentId = getAgentId()
  // leadAgentId保存`teamContext.leadAgentId`，供共享工具 teammate后续判断或输出使用。
  const leadAgentId = teamContext.leadAgentId

  // If my agent ID matches the lead agent ID, I'm the lead
  // 满足 `myAgentId === leadAgentId` 时，共享工具执行该分支。
  if (myAgentId === leadAgentId) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Backwards compat: if no agent ID is set and we have a team context,
  // this is the original session that created the team (the lead)
  // myAgentId缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!myAgentId) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if there are any active in-process teammates running.
 * Used by headless/print mode to determine if we should wait for teammates
 * before exiting.
 */
// hasActiveInProcessTeammates 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasActiveInProcessTeammates(appState: AppState): boolean {
  // Check for running in-process teammate tasks
  // 逐项读取 `Object.values(appState.tasks)` 中的task，按输入顺序推进共享工具。
  for (const task of Object.values(appState.tasks)) {
    // 只有 `task.type === 'in_process_teammate' && task.statu` 满足时，共享工具才执行该分支。
    if (task.type === 'in_process_teammate' && task.status === 'running') {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if there are in-process teammates still actively working on tasks.
 * Returns true if any teammate is running but NOT idle (still processing).
 * Used to determine if we should wait before sending shutdown prompts.
 */
// hasWorkingInProcessTeammates 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasWorkingInProcessTeammates(appState: AppState): boolean {
  // 逐项读取 `Object.values(appState.tasks)` 中的task，按输入顺序推进共享工具。
  for (const task of Object.values(appState.tasks)) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      task.type === 'in_process_teammate' &&
      task.status === 'running' &&
      !task.isIdle
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Returns a promise that resolves when all working in-process teammates become idle.
 * Registers callbacks on each working teammate's task - they call these when idle.
 * Returns immediately if no teammates are working.
 */
// waitForTeammatesToBecomeIdle 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function waitForTeammatesToBecomeIdle(
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void,，负责共享工具在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void,
  appState: AppState,
): Promise<void> {
  // workingTaskIds 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const workingTaskIds: string[] = []

  // 循环处理 `const [taskId, task] of Object.entries(appState.tasks)`，让共享工具把同类条目按顺序走完。
  for (const [taskId, task] of Object.entries(appState.tasks)) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      task.type === 'in_process_teammate' &&
      task.status === 'running' &&
      !task.isIdle
    ) {
      // workingTaskIds 集合追加新条目，保持收集顺序与输入顺序一致。
      workingTaskIds.push(taskId)
    }
  }

  // workingTaskIds 集合为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (workingTaskIds.length === 0) {
    // 返回 `Promise.resolve()`，作为共享工具这次计算的结果。
    return Promise.resolve()
  }

  // Create a promise that resolves when all working teammates become idle
  // 返回 `new Promise<void>(resolve => {`，作为共享工具这次计算的结果。
  return new Promise<void>(resolve => {
    // remaining记录 `workingTaskIds.length` 是否成立，下一步按该结果分支。
    let remaining = workingTaskIds.length

    // onIdle封装成回调，供共享工具 teammate在事件触发或异步步骤中调用。
    const onIdle = (): void => {
      // 共享工具 teammate在这里处理 `remaining--`，完成这一小步状态转换。
      remaining--
      // 满足 `remaining === 0` 时，共享工具执行该分支。
      if (remaining === 0) {
        // biome-ignore lint/nursery/noFloatingPromises: resolve is a callback, not a Promise
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve()
      }
    }

    // Register callback on each working teammate
    // Check current isIdle state to handle race where teammate became idle
    // between our initial snapshot and this callback registration
    // setAppState 写入新的状态值，使共享工具后续读取保持一致。
    setAppState(prev => {
      // newTasks 集合集中保存共享工具 teammate要一起传递的字段。
      const newTasks = { ...prev.tasks }
      // 按顺序遍历 `workingTaskIds` 中的taskId，逐个交给共享工具处理。
      for (const taskId of workingTaskIds) {
        // task保存`newTasks[taskId]`，供共享工具 teammate后续判断或输出使用。
        const task = newTasks[taskId]
        // 当 `task && task.type` 匹配 `'in_process_teammate'` 时，共享工具执行对应分支。
        if (task && task.type === 'in_process_teammate') {
          // If task is already idle, call onIdle immediately
          // 满足 `task.isIdle` 时，共享工具执行该分支。
          if (task.isIdle) {
            // 调用 onIdle，触发共享工具此处需要的副作用。
            onIdle()
          } else {
            // newTasks[taskId更新为 `{`，确保共享工具 teammate后续读取最新状态。
            newTasks[taskId] = {
              ...task,
              onIdleCallbacks: [...(task.onIdleCallbacks ?? []), onIdle],
            }
          }
        }
      }
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { ...prev, tasks: newTasks }
    })
  })
}
