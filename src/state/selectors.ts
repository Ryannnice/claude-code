/**
 * Selectors for deriving computed state from AppState.
 * Keep selectors pure and simple - just data extraction, no side effects.
 */

// 类型依赖 { InProcessTeammateTaskState } 来自 ../tasks/InProcessTeammateTask/types.js，用于校准应用状态管理的数据契约。
import type { InProcessTeammateTaskState } from '../tasks/InProcessTeammateTask/types.js'
// 引入 isInProcessTeammateTask，将 ../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammateTask } from '../tasks/InProcessTeammateTask/types.js'
// 类型依赖 { LocalAgentTaskState } 来自 ../tasks/LocalAgentTask/LocalAgentTask.js，用于校准应用状态管理的数据契约。
import type { LocalAgentTaskState } from '../tasks/LocalAgentTask/LocalAgentTask.js'
// 类型依赖 { AppState } 来自 ./AppStateStore.js，用于校准应用状态管理的数据契约。
import type { AppState } from './AppStateStore.js'

/**
 * Get the currently viewed teammate task, if any.
 * Returns undefined if:
 * - No teammate is being viewed (viewingAgentTaskId is undefined)
 * - The task ID doesn't exist in tasks
 * - The task is not an in-process teammate task
 */
// getViewedTeammateTask 封装selectors的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getViewedTeammateTask(
  appState: Pick<AppState, 'viewingAgentTaskId' | 'tasks'>,
): InProcessTeammateTaskState | undefined {
  // 从 `appState` 解构 viewingAgentTaskId、tasks，减少状态管理 selectors对同一对象的重复访问。
  const { viewingAgentTaskId, tasks } = appState

  // Not viewing any teammate
  // viewingAgentTaskId缺失时提前走兜底路径，避免应用状态管理继续依赖无效输入。
  if (!viewingAgentTaskId) {
    // 返回 `undefined`，作为应用状态管理这次计算的结果。
    return undefined
  }

  // Look up the task
  // task 命名 `tasks[viewingAgentTaskId]`，让后续代码直接表达这个值的用途。
  const task = tasks[viewingAgentTaskId]
  // task缺失时提前走兜底路径，避免应用状态管理继续依赖无效输入。
  if (!task) {
    // 返回 `undefined`，作为应用状态管理这次计算的结果。
    return undefined
  }

  // Verify it's an in-process teammate task
  // 满足 `!isInProcessTeammateTask(task)` 时，应用状态管理执行该分支。
  if (!isInProcessTeammateTask(task)) {
    // 返回 `undefined`，作为应用状态管理这次计算的结果。
    return undefined
  }

  // 返回 `task`，作为应用状态管理这次计算的结果。
  return task
}

/**
 * Return type for getActiveAgentForInput selector.
 * Discriminated union for type-safe input routing.
 */
// ActiveAgentForInput 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ActiveAgentForInput =
  | { type: 'leader' }
  | { type: 'viewed'; task: InProcessTeammateTaskState }
  | { type: 'named_agent'; task: LocalAgentTaskState }

/**
 * Determine where user input should be routed.
 * Returns:
 * - { type: 'leader' } when not viewing a teammate (input goes to leader)
 * - { type: 'viewed', task } when viewing an agent (input goes to that agent)
 *
 * Used by input routing logic to direct user messages to the correct agent.
 */
// getActiveAgentForInput 封装selectors的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getActiveAgentForInput(
  appState: AppState,
): ActiveAgentForInput {
  // viewedTask读取`getViewedTeammateTask`，供应用状态管理后续处理使用。
  const viewedTask = getViewedTeammateTask(appState)
  // 满足 `viewedTask` 时，应用状态管理执行该分支。
  if (viewedTask) {
    // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
    return { type: 'viewed', task: viewedTask }
  }

  // 从 `appState` 解构 viewingAgentTaskId、tasks，减少状态管理 selectors对同一对象的重复访问。
  const { viewingAgentTaskId, tasks } = appState
  // 满足 `viewingAgentTaskId` 时，应用状态管理执行该分支。
  if (viewingAgentTaskId) {
    // task 命名 `tasks[viewingAgentTaskId]`，让后续代码直接表达这个值的用途。
    const task = tasks[viewingAgentTaskId]
    // 当 `task?.type` 匹配 `'local_agent'` 时，应用状态管理执行对应分支。
    if (task?.type === 'local_agent') {
      // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
      return { type: 'named_agent', task }
    }
  }

  // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
  return { type: 'leader' }
}
