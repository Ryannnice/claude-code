// Shared logic for stopping a running task.
// Used by TaskStopTool (LLM-invoked) and SDK stop_task control request.

// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准stop Task的数据契约。
import type { AppState } from '../state/AppState.js'
// 类型依赖 { TaskStateBase } 来自 ../Task.js，用于校准stop Task的数据契约。
import type { TaskStateBase } from '../Task.js'
// 引入 getTaskByType，将 ../tasks.js 中已经封装好的能力接到本文件流程里。
import { getTaskByType } from '../tasks.js'
// 复用 emitTaskTerminatedSdk 工具函数，把通用处理留在 ../utils/sdkEventQueue.js 中维护。
import { emitTaskTerminatedSdk } from '../utils/sdkEventQueue.js'
// 引入 isLocalShellTask，将 ./LocalShellTask/guards.js 中已经封装好的能力接到本文件流程里。
import { isLocalShellTask } from './LocalShellTask/guards.js'

// StopTaskError 聚合stop Task相关状态与操作，把同一职责的行为收束到类实例中。
export class StopTaskError extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'not_running' | 'unsupported_type',
  ) {
    // 调用 super，触发stop Task此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'StopTaskError'，同步stop Task的内部状态。
    this.name = 'StopTaskError'
  }
}

// StopTaskContext 固化stop Task里传递的数据形状，帮助调用方按同一结构读写字段。
type StopTaskContext = {
  // 这个回调绑定到 getAppState: () => AppState，负责stop Task在该局部场景下的响应。
  getAppState: () => AppState
  // 这个回调绑定到 setAppState: (f: (prev: AppState) => AppState) => void，负责stop Task在该局部场景下的响应。
  setAppState: (f: (prev: AppState) => AppState) => void
}

// StopTaskResult 固化stop Task里传递的数据形状，帮助调用方按同一结构读写字段。
type StopTaskResult = {
  taskId: string
  taskType: string
  command: string | undefined
}

/**
 * Look up a task by ID, validate it is running, kill it, and mark it as notified.
 *
 * Throws {@link StopTaskError} when the task cannot be stopped (not found,
 * not running, or unsupported type). Callers can inspect `error.code` to
 * distinguish the failure reason.
 */
// stopTask 封装stopTask的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function stopTask(
  taskId: string,
  context: StopTaskContext,
): Promise<StopTaskResult> {
  // 从 `context` 解构 getAppState、setAppState，减少stop Task对同一对象的重复访问。
  const { getAppState, setAppState } = context
  // appState 状态读取`getAppState`，供stop Task后续处理使用。
  const appState = getAppState()
  // task保存`appState.tasks?.[taskId] as TaskStateBase | undefined`，供stop Task后续判断或输出使用。
  const task = appState.tasks?.[taskId] as TaskStateBase | undefined

  // task缺失时提前走兜底路径，避免stop Task继续依赖无效输入。
  if (!task) {
    // 抛出 new StopTaskError(`No task found with ID: ${taskId}`, 'not_found')，阻止stop Task在无效状态下继续运行。
    throw new StopTaskError(`No task found with ID: ${taskId}`, 'not_found')
  }

  // `task.status` 与 `'running'` 不一致时刷新派生状态，避免使用过期结果。
  if (task.status !== 'running') {
    // 抛出 new StopTaskError(，阻止stop Task在无效状态下继续运行。
    throw new StopTaskError(
      `Task ${taskId} is not running (status: ${task.status})`,
      'not_running',
    )
  }

  // taskImpl读取`getTaskByType`，供stop Task后续处理使用。
  const taskImpl = getTaskByType(task.type)
  // taskImpl缺失时提前走兜底路径，避免stop Task继续依赖无效输入。
  if (!taskImpl) {
    // 抛出 new StopTaskError(，阻止stop Task在无效状态下继续运行。
    throw new StopTaskError(
      `Unsupported task type: ${task.type}`,
      'unsupported_type',
    )
  }

  // 等待 `taskImpl.kill(taskId, setAppState)` 完成，再继续stop Task的异步流程。
  await taskImpl.kill(taskId, setAppState)

  // Bash: suppress the "exit code 137" notification (noise). Agent tasks: don't
  // suppress — the AbortError catch sends a notification carrying
  // extractPartialResult(agentMessages), which is the payload not noise.
  // 满足 `isLocalShellTask(task)` 时，stop Task执行该分支。
  if (isLocalShellTask(task)) {
    // suppressed标记stop Task是否启用对应路径。
    let suppressed = false
    // setAppState 写入新的状态值，使stop Task后续读取保持一致。
    setAppState(prev => {
      // prevTask 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
      const prevTask = prev.tasks[taskId]
      // 组合条件 `!prevTask || prevTask.notified` 成立时，stop Task才启用这条专门路径。
      if (!prevTask || prevTask.notified) {
        // 返回 `prev`，作为stop Task这次计算的结果。
        return prev
      }
      // suppressed更新为 `true`，确保stopTask后续读取最新状态。
      suppressed = true
      // 返回结构化结果，集中表达stop Task已经整理出的状态。
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: { ...prevTask, notified: true },
        },
      }
    })
    // Suppressing the XML notification also suppresses print.ts's parsed
    // task_notification SDK event — emit it directly so SDK consumers see
    // the task close.
    // 满足 `suppressed` 时，stop Task执行该分支。
    if (suppressed) {
      // 调用 emitTaskTerminatedSdk，触发stop Task此处需要的副作用。
      emitTaskTerminatedSdk(taskId, 'stopped', {
        toolUseId: task.toolUseId,
        summary: task.description,
      })
    }
  }

  // 命令保存`isLocalShellTask`，供stop Task后续处理使用。
  const command = isLocalShellTask(task) ? task.command : task.description

  // 返回结构化结果，集中表达stop Task已经整理出的状态。
  return { taskId, taskType: task.type, command }
}
