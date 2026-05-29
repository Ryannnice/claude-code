/**
 * In-Process Teammate Helpers
 *
 * Helper functions for in-process teammate integration.
 * Provides utilities to:
 * - Find task ID by agent name
 * - Handle plan approval responses
 * - Update awaitingPlanApproval state
 * - Detect permission-related messages
 */

// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type InProcessTeammateTaskState,
  isInProcessTeammateTask,
} from '../tasks/InProcessTeammateTask/types.js'
// 引入 updateTaskState，将 ./task/framework.js 中已经封装好的能力接到本文件流程里。
import { updateTaskState } from './task/framework.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isPermissionResponse,
  isSandboxPermissionResponse,
  type PlanApprovalResponseMessage,
} from './teammateMailbox.js'

// SetAppState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (updater: (prev: AppState) => AppState) => void

/**
 * Find the task ID for an in-process teammate by agent name.
 *
 * @param agentName - The agent name (e.g., "researcher")
 * @param appState - Current AppState
 * @returns Task ID if found, undefined otherwise
 */
// findInProcessTeammateTaskId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findInProcessTeammateTaskId(
  agentName: string,
  appState: AppState,
): string | undefined {
  // 逐项读取 `Object.values(appState.tasks)` 中的task，按输入顺序推进共享工具。
  for (const task of Object.values(appState.tasks)) {
    // 共享工具在这里按实际状态进入对应分支。
    if (
      isInProcessTeammateTask(task) &&
      task.identity.agentName === agentName
    ) {
      // 返回 `task.id`，作为共享工具这次计算的结果。
      return task.id
    }
  }
  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Set awaitingPlanApproval state for an in-process teammate.
 *
 * @param taskId - Task ID of the in-process teammate
 * @param setAppState - AppState setter
 * @param awaiting - Whether teammate is awaiting plan approval
 */
// setAwaitingPlanApproval 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setAwaitingPlanApproval(
  taskId: string,
  setAppState: SetAppState,
  awaiting: boolean,
): void {
  // 这个回调绑定到 updateTaskState<InProcessTeammateTaskState>(taskId, setAppState, task => ({，负责共享工具在该局部场景下的响应。
  updateTaskState<InProcessTeammateTaskState>(taskId, setAppState, task => ({
    ...task,
    awaitingPlanApproval: awaiting,
  }))
}

/**
 * Handle plan approval response for an in-process teammate.
 * Called by the message callback when a plan_approval_response arrives.
 *
 * This resets awaitingPlanApproval to false. The permissionMode from the
 * response is handled separately by the agent loop (Task #11).
 *
 * @param taskId - Task ID of the in-process teammate
 * @param _response - The plan approval response message (for future use)
 * @param setAppState - AppState setter
 */
// handlePlanApprovalResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handlePlanApprovalResponse(
  taskId: string,
  _response: PlanApprovalResponseMessage,
  setAppState: SetAppState,
): void {
  // setAwaitingPlanApproval 写入新的状态值，使共享工具后续读取保持一致。
  setAwaitingPlanApproval(taskId, setAppState, false)
}

// ============ Permission Delegation Helpers ============

/**
 * Check if a message is a permission-related response.
 * Used by in-process teammate message handlers to detect and process
 * permission responses from the team leader.
 *
 * Handles both tool permissions and sandbox (network host) permissions.
 *
 * @param messageText - The raw message text to check
 * @returns true if the message is a permission response
 */
// isPermissionRelatedResponse 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPermissionRelatedResponse(messageText: string): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    !!isPermissionResponse(messageText) ||
    !!isSandboxPermissionResponse(messageText)
  )
}
