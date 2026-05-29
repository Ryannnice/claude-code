// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 引入 isTerminalTaskStatus，将 ../Task.js 中已经封装好的能力接到本文件流程里。
import { isTerminalTaskStatus } from '../Task.js'
// 类型依赖 { LocalAgentTaskState } 来自 ../tasks/LocalAgentTask/LocalAgentTask.js，用于校准应用状态管理的数据契约。
import type { LocalAgentTaskState } from '../tasks/LocalAgentTask/LocalAgentTask.js'

// Inlined from framework.ts — importing creates a cycle through
// BackgroundTasksDialog. Keep in sync with PANEL_GRACE_MS there.
// PANEL_GRACE_MS 集合 命名 `30_000`，让后续代码直接表达这个值的用途。
const PANEL_GRACE_MS = 30_000

// 类型依赖 { AppState } 来自 ./AppState.js，用于校准应用状态管理的数据契约。
import type { AppState } from './AppState.js'

// Inline type check instead of importing isLocalAgentTask — breaks the
// teammateViewHelpers → LocalAgentTask runtime edge that creates a cycle
// through BackgroundTasksDialog.
// isLocalAgent 封装teammateViewHelpers的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isLocalAgent(task: unknown): task is LocalAgentTaskState {
  // 返回 `(`，作为应用状态管理这次计算的结果。
  return (
    typeof task === 'object' &&
    task !== null &&
    'type' in task &&
    task.type === 'local_agent'
  )
}

/**
 * Return the task released back to stub form: retain dropped, messages
 * cleared, evictAfter set if terminal. Shared by exitTeammateView and
 * the switch-away path in enterTeammateView.
 */
// release 封装teammateViewHelpers的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function release(task: LocalAgentTaskState): LocalAgentTaskState {
  // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
  return {
    ...task,
    retain: false,
    messages: undefined,
    diskLoaded: false,
    evictAfter: isTerminalTaskStatus(task.status)
      ? Date.now() + PANEL_GRACE_MS
      : undefined,
  }
}

/**
 * Transitions the UI to view a teammate's transcript.
 * Sets viewingAgentTaskId and, for local_agent, retain: true (blocks eviction,
 * enables stream-append, triggers disk bootstrap) and clears evictAfter.
 * If switching from another agent, releases the previous one back to stub.
 */
// enterTeammateView 封装teammateViewHelpers的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function enterTeammateView(
  taskId: string,
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责应用状态管理在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
): void {
  // 记录应用状态管理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_transcript_view_enter', {})
  // setAppState 写入新的状态值，使应用状态管理后续读取保持一致。
  setAppState(prev => {
    // task 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
    const task = prev.tasks[taskId]
    // prevId 命名 `prev.viewingAgentTaskId`，让后续代码直接表达这个值的用途。
    const prevId = prev.viewingAgentTaskId
    // prevTask标记应用状态管理状态管理 teammate View Helpers是否启用对应路径。
    const prevTask = prevId !== undefined ? prev.tasks[prevId] : undefined
    // switching 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const switching =
      prevId !== undefined &&
      prevId !== taskId &&
      isLocalAgent(prevTask) &&
      prevTask.retain
    // needsRetain 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const needsRetain =
      isLocalAgent(task) && (!task.retain || task.evictAfter !== undefined)
    // needsView 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const needsView =
      prev.viewingAgentTaskId !== taskId ||
      prev.viewSelectionMode !== 'viewing-agent'
    // 组合条件 `!needsRetain && !needsView && !switching` 成立时，应用状态管理才启用这条专门路径。
    if (!needsRetain && !needsView && !switching) return prev
    // tasks 集合保存`prev.tasks`，供后续判断或组装使用。
    let tasks = prev.tasks
    // 组合条件 `switching || needsRetain` 成立时，应用状态管理才启用这条专门路径。
    if (switching || needsRetain) {
      // tasks 集合更新为 `{ ...prev.tasks }`，确保teammateViewHelpers后续读取最新状态。
      tasks = { ...prev.tasks }
      // 满足 `switching) tasks[prevId] = release(prevTask` 时，应用状态管理执行该分支。
      if (switching) tasks[prevId] = release(prevTask)
      // 满足 `needsRetain` 时，应用状态管理执行该分支。
      if (needsRetain) {
        // tasks[taskId更新为 `{ ...task, retain: true, evictAfter: undefined }`，确保状态管理 teammate View Helpers后续读取最新状态。
        tasks[taskId] = { ...task, retain: true, evictAfter: undefined }
      }
    }
    // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
    return {
      ...prev,
      viewingAgentTaskId: taskId,
      viewSelectionMode: 'viewing-agent',
      tasks,
    }
  })
}

/**
 * Exit teammate transcript view and return to leader's view.
 * Drops retain and clears messages back to stub form; if terminal,
 * schedules eviction via evictAfter so the row lingers briefly.
 */
// exitTeammateView 封装teammateViewHelpers的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function exitTeammateView(
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责应用状态管理在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
): void {
  // 记录应用状态管理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_transcript_view_exit', {})
  // setAppState 写入新的状态值，使应用状态管理后续读取保持一致。
  setAppState(prev => {
    // 标识符 命名 `prev.viewingAgentTaskId`，让后续代码直接表达这个值的用途。
    const id = prev.viewingAgentTaskId
    // cleared 集中保存应用状态管理状态管理 teammate View Helpers要一起传递的字段。
    const cleared = {
      ...prev,
      viewingAgentTaskId: undefined,
      viewSelectionMode: 'none' as const,
    }
    // 满足 `id === undefined` 时，应用状态管理执行该分支。
    if (id === undefined) {
      // 返回 `prev.viewSelectionMode === 'none' ? prev : cleared`，作为应用状态管理这次计算的结果。
      return prev.viewSelectionMode === 'none' ? prev : cleared
    }
    // task读取 `prev.tasks[id]` 对应条目，后续围绕该成员继续处理。
    const task = prev.tasks[id]
    // 组合条件 `!isLocalAgent(task) || !task.retain` 成立时，应用状态管理才启用这条专门路径。
    if (!isLocalAgent(task) || !task.retain) return cleared
    // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
    return {
      ...cleared,
      tasks: { ...prev.tasks, [id]: release(task) },
    }
  })
}

/**
 * Context-sensitive x: running → abort, terminal → dismiss.
 * Dismiss sets evictAfter=0 so the filter hides immediately.
 * If viewing the dismissed agent, also exits to leader.
 */
// stopOrDismissAgent 封装teammateViewHelpers的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stopOrDismissAgent(
  taskId: string,
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责应用状态管理在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
): void {
  // setAppState 写入新的状态值，使应用状态管理后续读取保持一致。
  setAppState(prev => {
    // task 命名 `prev.tasks[taskId]`，让后续代码直接表达这个值的用途。
    const task = prev.tasks[taskId]
    // 满足 `!isLocalAgent(task)` 时，应用状态管理执行该分支。
    if (!isLocalAgent(task)) return prev
    // 当 `task.status` 匹配 `'running'` 时，应用状态管理执行对应分支。
    if (task.status === 'running') {
      // 调用 task.abortController?.abort()，完成这一处局部操作。
      task.abortController?.abort()
      // 返回 `prev`，作为应用状态管理这次计算的结果。
      return prev
    }
    // 满足 `task.evictAfter === 0` 时，应用状态管理执行该分支。
    if (task.evictAfter === 0) return prev
    // viewingThis 集合标记应用状态管理状态管理 teammate View Helpers是否启用对应路径。
    const viewingThis = prev.viewingAgentTaskId === taskId
    // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
    return {
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: { ...release(task), evictAfter: 0 },
      },
      ...(viewingThis && {
        viewingAgentTaskId: undefined,
        viewSelectionMode: 'none',
      }),
    }
  })
}
