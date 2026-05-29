// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { Task, TaskType } 来自 ./Task.js，用于校准tasks的数据契约。
import type { Task, TaskType } from './Task.js'
// 引入 DreamTask，将 ./tasks/DreamTask/DreamTask.js 中已经封装好的能力接到本文件流程里。
import { DreamTask } from './tasks/DreamTask/DreamTask.js'
// 引入 LocalAgentTask，将 ./tasks/LocalAgentTask/LocalAgentTask.js 中已经封装好的能力接到本文件流程里。
import { LocalAgentTask } from './tasks/LocalAgentTask/LocalAgentTask.js'
// 引入 LocalShellTask，将 ./tasks/LocalShellTask/LocalShellTask.js 中已经封装好的能力接到本文件流程里。
import { LocalShellTask } from './tasks/LocalShellTask/LocalShellTask.js'
// 引入 RemoteAgentTask，将 ./tasks/RemoteAgentTask/RemoteAgentTask.js 中已经封装好的能力接到本文件流程里。
import { RemoteAgentTask } from './tasks/RemoteAgentTask/RemoteAgentTask.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// LocalWorkflowTask 通过懒加载取得，避免tasks在启动阶段加载暂时用不到的实现。
const LocalWorkflowTask: Task | null = feature('WORKFLOW_SCRIPTS')
  ? require('./tasks/LocalWorkflowTask/LocalWorkflowTask.js').LocalWorkflowTask
  : null
// MonitorMcpTask 通过懒加载取得，避免tasks在启动阶段加载暂时用不到的实现。
const MonitorMcpTask: Task | null = feature('MONITOR_TOOL')
  ? require('./tasks/MonitorMcpTask/MonitorMcpTask.js').MonitorMcpTask
  : null
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Get all tasks.
 * Mirrors the pattern from tools.ts
 * Note: Returns array inline to avoid circular dependency issues with top-level const
 */
// getAllTasks 封装tasks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllTasks(): Task[] {
  // tasks 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const tasks: Task[] = [
    LocalShellTask,
    LocalAgentTask,
    RemoteAgentTask,
    DreamTask,
  ]
  // 满足 `LocalWorkflowTask) tasks.push(LocalWorkflowTask` 时，tasks执行该分支。
  if (LocalWorkflowTask) tasks.push(LocalWorkflowTask)
  // 满足 `MonitorMcpTask) tasks.push(MonitorMcpTask` 时，tasks执行该分支。
  if (MonitorMcpTask) tasks.push(MonitorMcpTask)
  // 返回 `tasks`，作为tasks这次计算的结果。
  return tasks
}

/**
 * Get a task by its type.
 */
// getTaskByType 封装tasks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTaskByType(type: TaskType): Task | undefined {
  // 返回 `getAllTasks().find(t => t.type === type)`，作为tasks这次计算的结果。
  return getAllTasks().find(t => t.type === type)
}
