// Union of all concrete task state types
// Use this for components that need to work with any task type

// 类型依赖 { DreamTaskState } 来自 ./DreamTask/DreamTask.js，用于校准types的数据契约。
import type { DreamTaskState } from './DreamTask/DreamTask.js'
// 类型依赖 { InProcessTeammateTaskState } 来自 ./InProcessTeammateTask/types.js，用于校准types的数据契约。
import type { InProcessTeammateTaskState } from './InProcessTeammateTask/types.js'
// 类型依赖 { LocalAgentTaskState } 来自 ./LocalAgentTask/LocalAgentTask.js，用于校准types的数据契约。
import type { LocalAgentTaskState } from './LocalAgentTask/LocalAgentTask.js'
// 类型依赖 { LocalShellTaskState } 来自 ./LocalShellTask/guards.js，用于校准types的数据契约。
import type { LocalShellTaskState } from './LocalShellTask/guards.js'
// 类型依赖 { LocalWorkflowTaskState } 来自 ./LocalWorkflowTask/LocalWorkflowTask.js，用于校准types的数据契约。
import type { LocalWorkflowTaskState } from './LocalWorkflowTask/LocalWorkflowTask.js'
// 类型依赖 { MonitorMcpTaskState } 来自 ./MonitorMcpTask/MonitorMcpTask.js，用于校准types的数据契约。
import type { MonitorMcpTaskState } from './MonitorMcpTask/MonitorMcpTask.js'
// 类型依赖 { RemoteAgentTaskState } 来自 ./RemoteAgentTask/RemoteAgentTask.js，用于校准types的数据契约。
import type { RemoteAgentTaskState } from './RemoteAgentTask/RemoteAgentTask.js'

// TaskState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskState =
  | LocalShellTaskState
  | LocalAgentTaskState
  | RemoteAgentTaskState
  | InProcessTeammateTaskState
  | LocalWorkflowTaskState
  | MonitorMcpTaskState
  | DreamTaskState

// Task types that can appear in the background tasks indicator
// BackgroundTaskState 固化types里传递的数据形状，帮助调用方按同一结构读写字段。
export type BackgroundTaskState =
  | LocalShellTaskState
  | LocalAgentTaskState
  | RemoteAgentTaskState
  | InProcessTeammateTaskState
  | LocalWorkflowTaskState
  | MonitorMcpTaskState
  | DreamTaskState

/**
 * Check if a task should be shown in the background tasks indicator.
 * A task is considered a background task if:
 * 1. It is running or pending
 * 2. It has been explicitly backgrounded (not a foreground task)
 */
// isBackgroundTask 封装types的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBackgroundTask(task: TaskState): task is BackgroundTaskState {
  // `task.status` 与 `'running' && task.status !== 'p...` 不一致时刷新派生状态，避免使用过期结果。
  if (task.status !== 'running' && task.status !== 'pending') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Foreground tasks (isBackgrounded === false) are not yet "background tasks"
  // 组合条件 `'isBackgrounded' in task && task.isBackgrounded =` 成立时，types才启用这条专门路径。
  if ('isBackgrounded' in task && task.isBackgrounded === false) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
