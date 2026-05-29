// Pure (non-React) kill helpers for LocalShellTask.
// Extracted so runAgent.ts can kill agent-scoped bash tasks without pulling
// React/Ink into its module graph (same rationale as guards.ts).

// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准kill Shell Tasks的数据契约。
import type { AppState } from '../../state/AppState.js'
// 类型依赖 { AgentId } 来自 ../../types/ids.js，用于校准kill Shell Tasks的数据契约。
import type { AgentId } from '../../types/ids.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 dequeueAllMatching 工具函数，把通用处理留在 ../../utils/messageQueueManager.js 中维护。
import { dequeueAllMatching } from '../../utils/messageQueueManager.js'
// 复用 evictTaskOutput 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { evictTaskOutput } from '../../utils/task/diskOutput.js'
// 复用 updateTaskState 工具函数，把通用处理留在 ../../utils/task/framework.js 中维护。
import { updateTaskState } from '../../utils/task/framework.js'
// 引入 isLocalShellTask，将 ./guards.js 中已经封装好的能力接到本文件流程里。
import { isLocalShellTask } from './guards.js'

// SetAppStateFn 固化kill Shell Tasks里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppStateFn = (updater: (prev: AppState) => AppState) => void

// killTask 封装killShellTasks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function killTask(taskId: string, setAppState: SetAppStateFn): void {
  // 调用 updateTaskState，触发kill Shell Tasks此处需要的副作用。
  updateTaskState(taskId, setAppState, task => {
    // `task.status` 与 `'running' || !isLocalShellTask(...` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'running' || !isLocalShellTask(task)) {
      // 返回 `task`，作为kill Shell Tasks这次计算的结果。
      return task
    }

    // 保护这一段可能失败的kill Shell Tasks操作，确保异常能进入相邻错误处理。
    try {
      // 记录kill Shell Tasks运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LocalShellTask ${taskId} kill requested`)
      // 调用 task.shellCommand?.kill()，完成这一处局部操作。
      task.shellCommand?.kill()
      // 调用 task.shellCommand?.cleanup()，完成这一处局部操作。
      task.shellCommand?.cleanup()
    } catch (error) {
      // 记录kill Shell Tasks运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }

    // 调用 task.unregisterCleanup?.()，完成这一处局部操作。
    task.unregisterCleanup?.()
    // 满足 `task.cleanupTimeoutId` 时，kill Shell Tasks执行该分支。
    if (task.cleanupTimeoutId) {
      // 调用 clearTimeout，触发kill Shell Tasks此处需要的副作用。
      clearTimeout(task.cleanupTimeoutId)
    }

    // 返回结构化结果，集中表达kill Shell Tasks已经整理出的状态。
    return {
      ...task,
      status: 'killed',
      notified: true,
      shellCommand: null,
      unregisterCleanup: undefined,
      cleanupTimeoutId: undefined,
      endTime: Date.now(),
    }
  })
  // 显式忽略 `evictTaskOutput(taskId)` 的返回值，只保留它触发的副作用。
  void evictTaskOutput(taskId)
}

/**
 * Kill all running bash tasks spawned by a given agent.
 * Called from runAgent.ts finally block so background processes don't outlive
 * the agent that started them (prevents 10-day fake-logs.sh zombies).
 */
// killShellTasksForAgent 封装killShellTasks的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function killShellTasksForAgent(
  agentId: AgentId,
  // 这个回调绑定到 getAppState: () => AppState,，负责kill Shell Tasks在该局部场景下的响应。
  getAppState: () => AppState,
  setAppState: SetAppStateFn,
): void {
  // tasks 集合读取`getAppState`，供kill Shell Tasks后续处理使用。
  const tasks = getAppState().tasks ?? {}
  // 循环处理 `const [taskId, task] of Object.entries(tasks)`，让kill Shell Tasks把同类条目按顺序走完。
  for (const [taskId, task] of Object.entries(tasks)) {
    // kill Shell Tasks在这里进入条件判断，后续代码按实际状态分流。
    if (
      isLocalShellTask(task) &&
      task.agentId === agentId &&
      task.status === 'running'
    ) {
      // 记录kill Shell Tasks运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `killShellTasksForAgent: killing orphaned shell task ${taskId} (agent ${agentId} exiting)`,
      )
      // 调用 killTask，触发kill Shell Tasks此处需要的副作用。
      killTask(taskId, setAppState)
    }
  }
  // Purge any queued notifications addressed to this agent — its query loop
  // has exited and won't drain them. killTask fires 'killed' notifications
  // asynchronously; drop the ones already queued and any that land later sit
  // harmlessly (no consumer matches a dead agentId).
  // 调用 dequeueAllMatching，触发kill Shell Tasks此处需要的副作用。
  dequeueAllMatching(cmd => cmd.agentId === agentId)
}
