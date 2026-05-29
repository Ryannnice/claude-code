// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react'
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js'
// 引入 exitTeammateView，将 ../state/teammateViewHelpers.js 中已经封装好的能力接到本文件流程里。
import { exitTeammateView } from '../state/teammateViewHelpers.js'
// 引入 isInProcessTeammateTask，将 ../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammateTask } from '../tasks/InProcessTeammateTask/types.js'

/**
 * Auto-exits teammate viewing mode when the viewed teammate
 * is killed or encounters an error. Users stay viewing completed
 * teammates so they can review the full transcript.
 */
// useTeammateViewAutoExit 封装useTeammateViewAutoExit的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTeammateViewAutoExit(): void {
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // viewingAgentTaskId保存`useAppState`，供React hook后续处理使用。
  const viewingAgentTaskId = useAppState(s => s.viewingAgentTaskId)
  // Select only the viewed task, not the full tasks map — otherwise every
  // streaming update from any teammate re-renders this hook.
  // task保存`useAppState`，供React hook后续处理使用。
  const task = useAppState(s =>
    s.viewingAgentTaskId ? s.tasks[s.viewingAgentTaskId] : undefined,
  )

  // viewedTask保存`isInProcessTeammateTask`，供React hook后续处理使用。
  const viewedTask = task && isInProcessTeammateTask(task) ? task : undefined
  // viewedStatus 集合保存`viewedTask?.status`，供后续判断或组装使用。
  const viewedStatus = viewedTask?.status
  // viewedError 错误信息保存`viewedTask?.error`，供React hook use Teamma...后续判断或输出使用。
  const viewedError = viewedTask?.error
  // taskExists 集合标记React hook use Teamma...是否启用对应路径。
  const taskExists = task !== undefined

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // Not viewing any teammate
    // viewingAgentTaskId缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!viewingAgentTaskId) {
      // React hook use Teammate View Auto E...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Task no longer exists in the map — evicted out from under us.
    // Check raw `task` not teammate-narrowed `viewedTask`; local_agent
    // tasks exist but narrow to undefined, which would eject immediately.
    // taskExists 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!taskExists) {
      // 调用 exitTeammateView，触发React hook此处需要的副作用。
      exitTeammateView(setAppState)
      // React hook use Teammate View Auto E...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // Status checks below are teammate-only (viewedTask is teammate-narrowed).
    // For local_agent, viewedStatus is undefined → all checks falsy → no eject.
    // viewedTask缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!viewedTask) return

    // Auto-exit if teammate is killed, stopped, has error, or is no longer running
    // This handles shutdown scenarios where teammate becomes inactive
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      viewedStatus === 'killed' ||
      viewedStatus === 'failed' ||
      viewedError ||
      (viewedStatus !== 'running' &&
        viewedStatus !== 'completed' &&
        viewedStatus !== 'pending')
    ) {
      // 调用 exitTeammateView，触发React hook此处需要的副作用。
      exitTeammateView(setAppState)
      // React hook use Teammate View Auto E...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }, [
    viewingAgentTaskId,
    taskExists,
    viewedTask,
    viewedStatus,
    viewedError,
    setAppState,
  ])
}
