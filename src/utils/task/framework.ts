// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  OUTPUT_FILE_TAG,
  STATUS_TAG,
  SUMMARY_TAG,
  TASK_ID_TAG,
  TASK_NOTIFICATION_TAG,
  TASK_TYPE_TAG,
  TOOL_USE_ID_TAG,
} from '../../constants/xml.js'
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../../state/AppState.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isTerminalTaskStatus,
  type TaskStatus,
  type TaskType,
} from '../../Task.js'
// 类型依赖 { TaskState } 来自 ../../tasks/types.js，用于校准共享工具的数据契约。
import type { TaskState } from '../../tasks/types.js'
// 引入 enqueuePendingNotification，将 ../messageQueueManager.js 中已经封装好的能力接到本文件流程里。
import { enqueuePendingNotification } from '../messageQueueManager.js'
// 引入 enqueueSdkEvent，将 ../sdkEventQueue.js 中已经封装好的能力接到本文件流程里。
import { enqueueSdkEvent } from '../sdkEventQueue.js'
// 引入 getTaskOutputDelta、getTaskOutputPath，将 ./diskOutput.js 中已经封装好的能力接到本文件流程里。
import { getTaskOutputDelta, getTaskOutputPath } from './diskOutput.js'

// Standard polling interval for all tasks
// POLL_INTERVAL_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
export const POLL_INTERVAL_MS = 1000

// Duration to display killed tasks before eviction
// STOPPED_DISPLAY_MS 集合保存`3_000`，供后续判断或组装使用。
export const STOPPED_DISPLAY_MS = 3_000

// Grace period for terminal local_agent tasks in the coordinator panel
// PANEL_GRACE_MS 集合保存`30_000`，供共享工具 framework后续判断或输出使用。
export const PANEL_GRACE_MS = 30_000

// Attachment type for task status updates
// TaskAttachment 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type TaskAttachment = {
  type: 'task_status'
  taskId: string
  toolUseId?: string
  taskType: TaskType
  status: TaskStatus
  description: string
  deltaSummary: string | null // New output since last attachment
}

// SetAppState 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (updater: (prev: AppState) => AppState) => void

/**
 * Update a task's state in AppState.
 * Helper function for task implementations.
 * Generic to allow type-safe updates for specific task types.
 */
// updateTaskState 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateTaskState<T extends TaskState>(
  taskId: string,
  setAppState: SetAppState,
  // 这个回调绑定到 updater: (task: T) => T,，负责共享工具在该局部场景下的响应。
  updater: (task: T) => T,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // task读取 `prev.tasks?.[taskId] as T | undefined` 对应条目，后续围绕该成员继续处理。
    const task = prev.tasks?.[taskId] as T | undefined
    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }
    // updated保存`updater`，供共享工具后续处理使用。
    const updated = updater(task)
    // 满足 `updated === task` 时，共享工具执行该分支。
    if (updated === task) {
      // Updater returned the same reference (early-return no-op). Skip the
      // spread so s.tasks subscribers don't re-render on unchanged state.
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: updated,
      },
    }
  })
}

/**
 * Register a new task in AppState.
 */
// registerTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function registerTask(task: TaskState, setAppState: SetAppState): void {
  // isReplacement标记共享工具 framework是否启用对应路径。
  let isReplacement = false
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // existing保存`prev.tasks[task.id]`，供共享工具 framework后续判断或输出使用。
    const existing = prev.tasks[task.id]
    // isReplacement更新为 `existing !== undefined`，确保共享工具后续读取最新状态。
    isReplacement = existing !== undefined
    // Carry forward UI-held state on re-register (resumeAgentBackground
    // replaces the task; user's retain shouldn't reset). startTime keeps
    // the panel sort stable; messages + diskLoaded preserve the viewed
    // transcript across the replace (the user's just-appended prompt lives
    // in messages and isn't on disk yet).
    // merged 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const merged =
      existing && 'retain' in existing
        ? {
            ...task,
            retain: existing.retain,
            startTime: existing.startTime,
            messages: existing.messages,
            diskLoaded: existing.diskLoaded,
            pendingMessages: existing.pendingMessages,
          }
        : task
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ...prev, tasks: { ...prev.tasks, [task.id]: merged } }
  })

  // Replacement (resume) — not a new start. Skip to avoid double-emit.
  // 满足 `isReplacement` 时，共享工具执行该分支。
  if (isReplacement) return

  // 调用 enqueueSdkEvent，触发共享工具此处需要的副作用。
  enqueueSdkEvent({
    type: 'system',
    subtype: 'task_started',
    task_id: task.id,
    tool_use_id: task.toolUseId,
    description: task.description,
    task_type: task.type,
    workflow_name:
      'workflowName' in task
        ? (task.workflowName as string | undefined)
        : undefined,
    prompt: 'prompt' in task ? (task.prompt as string) : undefined,
  })
}

/**
 * Eagerly evict a terminal task from AppState.
 * The task must be in a terminal state (completed/failed/killed) with notified=true.
 * This allows memory to be freed without waiting for the next query loop iteration.
 * The lazy GC in generateTaskAttachments() remains as a safety net.
 */
// evictTerminalTask 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function evictTerminalTask(
  taskId: string,
  setAppState: SetAppState,
): void {
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // task保存`prev.tasks?.[taskId]`，供共享工具 framework后续判断或输出使用。
    const task = prev.tasks?.[taskId]
    // task缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task) return prev
    // 满足 `!isTerminalTaskStatus(task.status)` 时，共享工具执行该分支。
    if (!isTerminalTaskStatus(task.status)) return prev
    // task.notified缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!task.notified) return prev
    // Panel grace period — blocks eviction until deadline passes.
    // 'retain' in task narrows to LocalAgentTaskState (the only type with
    // that field); evictAfter is optional so 'evictAfter' in task would
    // miss tasks that haven't had it set yet.
    // 只有 `'retain' in task && (task.evictAfter ?? Infinity) > Date.now()` 满足时，共享工具才执行该分支。
    if ('retain' in task && (task.evictAfter ?? Infinity) > Date.now()) {
      // 返回 `prev`，作为共享工具这次计算的结果。
      return prev
    }
    // 从 `prev.tasks` 解构 [taskId]、其余 remainingTasks，减少共享工具 framework对同一对象的重复访问。
    const { [taskId]: _, ...remainingTasks } = prev.tasks
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { ...prev, tasks: remainingTasks }
  })
}

/**
 * Get all running tasks.
 */
// getRunningTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRunningTasks(state: AppState): TaskState[] {
  // tasks 集合保存`state.tasks ?? {}`，供后续判断或组装使用。
  const tasks = state.tasks ?? {}
  // 返回 `Object.values(tasks).filter(task => task.status === 'running')`，作为共享工具这次计算的结果。
  return Object.values(tasks).filter(task => task.status === 'running')
}

/**
 * Generate attachments for tasks with new output or status changes.
 * Called by the framework to create push notifications.
 */
// generateTaskAttachments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function generateTaskAttachments(state: AppState): Promise<{
  attachments: TaskAttachment[]
  // Only the offset patch — NOT the full task. The task may transition to
  // completed during getTaskOutputDelta's async disk read, and spreading the
  // full stale snapshot would clobber that transition (zombifying the task).
  updatedTaskOffsets: Record<string, number>
  evictedTaskIds: string[]
}> {
  // attachments 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attachments: TaskAttachment[] = []
  // updatedTaskOffsets 集合 从空对象开始收集键值，后续按名称补齐内容。
  const updatedTaskOffsets: Record<string, number> = {}
  // evictedTaskIds 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const evictedTaskIds: string[] = []
  // tasks 集合保存`state.tasks ?? {}`，供后续判断或组装使用。
  const tasks = state.tasks ?? {}

  // 逐项读取 `Object.values(tasks)` 中的taskState 状态，按输入顺序推进共享工具。
  for (const taskState of Object.values(tasks)) {
    // 满足 `taskState.notified` 时，共享工具执行该分支。
    if (taskState.notified) {
      // 按照 taskState.status 的取值选择共享工具的具体处理分支。
      switch (taskState.status) {
        case 'completed':
        case 'failed':
        case 'killed':
          // Evict terminal tasks — they've been consumed and can be GC'd
          // evictedTaskIds 集合追加新条目，保持收集顺序与输入顺序一致。
          evictedTaskIds.push(taskState.id)
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        case 'pending':
          // Keep in map — hasn't run yet, but parent already knows about it
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        case 'running':
          // Fall through to running logic below
          // 结束这个分支或循环，避免共享工具继续落入后续路径。
          break
      }
    }

    // 当 `taskState.status` 匹配 `'running'` 时，共享工具执行对应分支。
    if (taskState.status === 'running') {
      // delta读取`getTaskOutputDelta`，供共享工具后续处理使用。
      const delta = await getTaskOutputDelta(
        taskState.id,
        taskState.outputOffset,
      )
      // 满足 `delta.content` 时，共享工具执行该分支。
      if (delta.content) {
        // 标识符更新为 `delta.newOffset`，确保共享工具 framework后续读取最新状态。
        updatedTaskOffsets[taskState.id] = delta.newOffset
      }
    }

    // Completed tasks are NOT notified here — each task type handles its own
    // completion notification via enqueuePendingNotification(). Generating
    // attachments here would race with those per-type callbacks, causing
    // dual delivery (one inline attachment + one separate API turn).
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { attachments, updatedTaskOffsets, evictedTaskIds }
}

/**
 * Apply the outputOffset patches and evictions from generateTaskAttachments.
 * Merges patches against FRESH prev.tasks (not the stale pre-await snapshot),
 * so concurrent status transitions aren't clobbered.
 */
// applyTaskOffsetsAndEvictions 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyTaskOffsetsAndEvictions(
  setAppState: SetAppState,
  updatedTaskOffsets: Record<string, number>,
  evictedTaskIds: string[],
): void {
  // offsetIds 集合派生`Object.keys`，供共享工具后续处理使用。
  const offsetIds = Object.keys(updatedTaskOffsets)
  // 只有 `offsetIds.length === 0 && evictedTaskIds.length =` 满足时，共享工具才执行该分支。
  if (offsetIds.length === 0 && evictedTaskIds.length === 0) {
    // 共享工具 framework在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // setAppState 写入新的状态值，使共享工具后续读取保持一致。
  setAppState(prev => {
    // changed标记共享工具 framework是否启用对应路径。
    let changed = false
    // newTasks 集合集中保存共享工具 framework要一起传递的字段。
    const newTasks = { ...prev.tasks }
    // 按顺序遍历 `offsetIds` 中的标识符，逐个交给共享工具处理。
    for (const id of offsetIds) {
      // fresh读取 `newTasks[id]` 对应条目，后续围绕该成员继续处理。
      const fresh = newTasks[id]
      // Re-check status on fresh state — task may have completed during the
      // await. If it's no longer running, the offset update is moot.
      // 当 `fresh?.status` 匹配 `'running'` 时，共享工具执行对应分支。
      if (fresh?.status === 'running') {
        // newTasks[id更新为 `{ ...fresh, outputOffset: updatedTaskOffsets[id]! }`，确保共享工具 framework后续读取最新状态。
        newTasks[id] = { ...fresh, outputOffset: updatedTaskOffsets[id]! }
        // changed更新为 `true`，确保共享工具后续读取最新状态。
        changed = true
      }
    }
    // 按顺序遍历 `evictedTaskIds` 中的标识符，逐个交给共享工具处理。
    for (const id of evictedTaskIds) {
      // fresh读取 `newTasks[id]` 对应条目，后续围绕该成员继续处理。
      const fresh = newTasks[id]
      // Re-check terminal+notified on fresh state (TOCTOU: resume may have
      // replaced the task during the generateTaskAttachments await)
      // 只有 `!fresh || !isTerminalTaskStatus(fresh.status) || !fresh.notified` 满足时，共享工具才执行该分支。
      if (!fresh || !isTerminalTaskStatus(fresh.status) || !fresh.notified) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 只有 `'retain' in fresh && (fresh.evictAfter ?? Infinity) > Date.now()` 满足时，共享工具才执行该分支。
      if ('retain' in fresh && (fresh.evictAfter ?? Infinity) > Date.now()) {
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }
      // 共享工具 framework在这里处理 `delete newTasks[id]`，完成这一小步状态转换。
      delete newTasks[id]
      // changed更新为 `true`，确保共享工具后续读取最新状态。
      changed = true
    }
    // 返回 `changed ? { ...prev, tasks: newTasks } : prev`，作为共享工具这次计算的结果。
    return changed ? { ...prev, tasks: newTasks } : prev
  })
}

/**
 * Poll all running tasks and check for updates.
 * This is the main polling loop called by the framework.
 */
// pollTasks 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function pollTasks(
  // 这个回调绑定到 getAppState: () => AppState,，负责共享工具在该局部场景下的响应。
  getAppState: () => AppState,
  setAppState: SetAppState,
): Promise<void> {
  // 状态读取`getAppState`，供共享工具后续处理使用。
  const state = getAppState()
  // 共享工具 framework先整理这一处局部数据，后续分支可以直接读取。
  const { attachments, updatedTaskOffsets, evictedTaskIds } =
    await generateTaskAttachments(state)

  // 调用 applyTaskOffsetsAndEvictions，触发共享工具此处需要的副作用。
  applyTaskOffsetsAndEvictions(setAppState, updatedTaskOffsets, evictedTaskIds)

  // Send notifications for completed tasks
  // 按顺序遍历 `attachments` 中的attachment，逐个交给共享工具处理。
  for (const attachment of attachments) {
    // 调用 enqueueTaskNotification，触发共享工具此处需要的副作用。
    enqueueTaskNotification(attachment)
  }
}

/**
 * Enqueue a task notification to the message queue.
 */
// enqueueTaskNotification 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function enqueueTaskNotification(attachment: TaskAttachment): void {
  // statusText读取`getStatusText`，供共享工具后续处理使用。
  const statusText = getStatusText(attachment.status)

  // outputPath 路径数据读取`getTaskOutputPath`，供共享工具后续处理使用。
  const outputPath = getTaskOutputPath(attachment.taskId)
  // toolUseIdLine保存`attachment.toolUseId`，供后续判断或组装使用。
  const toolUseIdLine = attachment.toolUseId
    ? `\n<${TOOL_USE_ID_TAG}>${attachment.toolUseId}</${TOOL_USE_ID_TAG}>`
    : ''
  // 消息固定为 ``<${TASK_NOTIFICATION_TAG}>`，作为共享工具 framework后续展示或比较的基准。
  const message = `<${TASK_NOTIFICATION_TAG}>
<${TASK_ID_TAG}>${attachment.taskId}</${TASK_ID_TAG}>${toolUseIdLine}
<${TASK_TYPE_TAG}>${attachment.taskType}</${TASK_TYPE_TAG}>
<${OUTPUT_FILE_TAG}>${outputPath}</${OUTPUT_FILE_TAG}>
<${STATUS_TAG}>${attachment.status}</${STATUS_TAG}>
<${SUMMARY_TAG}>Task "${attachment.description}" ${statusText}</${SUMMARY_TAG}>
</${TASK_NOTIFICATION_TAG}>`

  // 调用 enqueuePendingNotification，触发共享工具此处需要的副作用。
  enqueuePendingNotification({ value: message, mode: 'task-notification' })
}

/**
 * Get human-readable status text.
 */
// getStatusText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStatusText(status: TaskStatus): string {
  // 按照 status 的取值选择共享工具的具体处理分支。
  switch (status) {
    case 'completed':
      // 返回 `'completed successfully'`，作为共享工具这次计算的结果。
      return 'completed successfully'
    case 'failed':
      // 返回 `'failed'`，作为共享工具这次计算的结果。
      return 'failed'
    case 'killed':
      // 返回 `'was stopped'`，作为共享工具这次计算的结果。
      return 'was stopped'
    case 'running':
      // 返回 `'is running'`，作为共享工具这次计算的结果。
      return 'is running'
    case 'pending':
      // 返回 `'is pending'`，作为共享工具这次计算的结果。
      return 'is pending'
  }
}
