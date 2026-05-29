// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 复用 KeyboardEvent 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardEvent } from '../ink/events/keyboard-event.js'
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- backward-compat bridge until REPL wires handleKeyDown to <Box onKeyDown>
// 引入 useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { useInput } from '../ink.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AppState,
  useAppState,
  useSetAppState,
} from '../state/AppState.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  enterTeammateView,
  exitTeammateView,
} from '../state/teammateViewHelpers.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getRunningTeammatesSorted,
  InProcessTeammateTask,
} from '../tasks/InProcessTeammateTask/InProcessTeammateTask.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type InProcessTeammateTaskState,
  isInProcessTeammateTask,
} from '../tasks/InProcessTeammateTask/types.js'
// 引入 isBackgroundTask，将 ../tasks/types.js 中已经封装好的能力接到本文件流程里。
import { isBackgroundTask } from '../tasks/types.js'

// Step teammate selection by delta, wrapping across leader(-1)..teammates(0..n-1)..hide(n).
// First step from a collapsed tree expands it and parks on leader.
// stepTeammateSelection 封装useBackgroundTaskNavigation的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stepTeammateSelection(
  delta: 1 | -1,
  // 这个回调绑定到 setAppState: (updater: (prev: AppState) => AppState) => void,，负责React hook 状态流在该局部场景下的响应。
  setAppState: (updater: (prev: AppState) => AppState) => void,
): void {
  // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
  setAppState(prev => {
    // currentCount 数量读取`getRunningTeammatesSorted`，供React hook后续处理使用。
    const currentCount = getRunningTeammatesSorted(prev.tasks).length
    // 满足 `currentCount === 0` 时，React hook执行该分支。
    if (currentCount === 0) return prev

    // `prev.expandedView` 与 `'teammates'` 不一致时刷新派生状态，避免使用过期结果。
    if (prev.expandedView !== 'teammates') {
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        ...prev,
        expandedView: 'teammates' as const,
        viewSelectionMode: 'selecting-agent',
        selectedIPAgentIndex: -1,
      }
    }

    // maxIdx保存`currentCount // hide row`，供React hook use Backgr...后续判断或输出使用。
    const maxIdx = currentCount // hide row
    // cur保存`prev.selectedIPAgentIndex`，供React hook use Backgr...后续判断或输出使用。
    const cur = prev.selectedIPAgentIndex
    // next 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const next =
      delta === 1
        ? cur >= maxIdx
          ? -1
          : cur + 1
        : cur <= -1
          ? maxIdx
          : cur - 1
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return {
      ...prev,
      selectedIPAgentIndex: next,
      viewSelectionMode: 'selecting-agent',
    }
  })
}

/**
 * Custom hook that handles Shift+Up/Down keyboard navigation for background tasks.
 * When teammates (swarm) are present, navigates between leader and teammates.
 * When only non-teammate background tasks exist, opens the background tasks dialog.
 * Also handles Enter to confirm selection, 'f' to view transcript, and 'k' to kill.
 */
// useBackgroundTaskNavigation 封装useBackgroundTaskNavigation的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useBackgroundTaskNavigation(options?: {
  onOpenBackgroundTasks?: () => void
}): { handleKeyDown: (e: KeyboardEvent) => void } {
  // tasks 集合保存`useAppState`，供React hook后续处理使用。
  const tasks = useAppState(s => s.tasks)
  // viewSelectionMode保存`useAppState`，供React hook后续处理使用。
  const viewSelectionMode = useAppState(s => s.viewSelectionMode)
  // viewingAgentTaskId保存`useAppState`，供React hook后续处理使用。
  const viewingAgentTaskId = useAppState(s => s.viewingAgentTaskId)
  // selectedIPAgentIndex 索引保存`useAppState`，供React hook后续处理使用。
  const selectedIPAgentIndex = useAppState(s => s.selectedIPAgentIndex)
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()

  // Filter to running teammates and sort alphabetically to match TeammateSpinnerTree display
  // teammateTasks 集合读取`getRunningTeammatesSorted`，供React hook后续处理使用。
  const teammateTasks = getRunningTeammatesSorted(tasks)
  // teammateCount 数量保存 `teammateTasks.length` 的判断结果，供React hook use Backgr...后续分支直接复用。
  const teammateCount = teammateTasks.length

  // Check for non-teammate background tasks (local_agent, local_bash, etc.)
  // hasNonTeammateBackgroundTasks 集合记录 `Object.values` 是否成立，React hook随后按该结果分支。
  const hasNonTeammateBackgroundTasks = Object.values(tasks).some(
    // t更新为 `> isBackgroundTask(t) && t.type !== 'in_process_teammate'`，确保useBackgroundTaskNavigation后续读取最新状态。
    t => isBackgroundTask(t) && t.type !== 'in_process_teammate',
  )

  // Track previous teammate count to detect when teammates are removed
  // prevTeammateCountRef 引用保存 hook 状态，让React hook use Backgr...跨渲染复用同一个容器。
  const prevTeammateCountRef = useRef<number>(teammateCount)

  // Clamp selection index if teammates are removed or reset when count becomes 0
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // prevCount 数量保存`prevTeammateCountRef.current`，供后续判断或组装使用。
    const prevCount = prevTeammateCountRef.current
    // current更新为 `teammateCount`，确保useBackgroundTaskNavigation后续读取最新状态。
    prevTeammateCountRef.current = teammateCount

    // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setAppState(prev => {
      // currentTeammates 集合读取`getRunningTeammatesSorted`，供React hook后续处理使用。
      const currentTeammates = getRunningTeammatesSorted(prev.tasks)
      // currentCount 数量保存 `currentTeammates.length` 的判断结果，供React hook use Backgr...后续分支直接复用。
      const currentCount = currentTeammates.length

      // When teammates are removed (count goes from >0 to 0), reset selection
      // Only reset if we previously had teammates (not on initial mount with 0)
      // Don't clobber viewSelectionMode if actively viewing a teammate transcript —
      // the user may be reviewing a completed teammate and needs escape to exit
      // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
      if (
        currentCount === 0 &&
        prevCount > 0 &&
        prev.selectedIPAgentIndex !== -1
      ) {
        // 当 `prev.viewSelectionMode` 匹配 `'viewing-agent'` 时，React hook执行对应分支。
        if (prev.viewSelectionMode === 'viewing-agent') {
          // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
          return {
            ...prev,
            selectedIPAgentIndex: -1,
          }
        }
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prev,
          selectedIPAgentIndex: -1,
          viewSelectionMode: 'none',
        }
      }

      // Clamp if index is out of bounds
      // Max valid index is currentCount (the "hide" row) when spinner tree is shown
      // maxIndex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const maxIndex =
        prev.expandedView === 'teammates' ? currentCount : currentCount - 1
      // 组合条件 `currentCount > 0 && prev.selectedIPAgentIndex > m` 成立时，React hook 状态流才启用这条专门路径。
      if (currentCount > 0 && prev.selectedIPAgentIndex > maxIndex) {
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prev,
          selectedIPAgentIndex: maxIndex,
        }
      }

      // 返回 `prev`，作为React hook 状态流这次计算的结果。
      return prev
    })
  }, [teammateCount, setAppState])

  // Get the selected teammate's task info
  // getSelectedTeammate保存`(): {`，供后续判断或组装使用。
  const getSelectedTeammate = (): {
    taskId: string
    task: InProcessTeammateTaskState
  } | null => {
    // 满足 `teammateCount === 0` 时，React hook执行该分支。
    if (teammateCount === 0) return null
    // 选中索引保存`selectedIPAgentIndex`，供React hook use Backgr...后续判断或输出使用。
    const selectedIndex = selectedIPAgentIndex
    // task读取 `teammateTasks[selectedIndex]` 对应条目，后续围绕该成员继续处理。
    const task = teammateTasks[selectedIndex]
    // task缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!task) return null

    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return { taskId: task.id, task }
  }

  // handleKeyDown封装成回调，供React hook use Backgr...在事件触发或异步步骤中调用。
  const handleKeyDown = (e: KeyboardEvent): void => {
    // Escape in viewing mode:
    // - If teammate is running: abort current work only (stops current turn, teammate stays alive)
    // - If teammate is not running (completed/killed/failed): exit the view back to leader
    // 组合条件 `e.key === 'escape' && viewSelectionMode === 'view` 成立时，React hook 状态流才启用这条专门路径。
    if (e.key === 'escape' && viewSelectionMode === 'viewing-agent') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // taskId 命名 `viewingAgentTaskId`，让后续代码直接表达这个值的用途。
      const taskId = viewingAgentTaskId
      // 满足 `taskId` 时，React hook执行该分支。
      if (taskId) {
        // task读取 `tasks[taskId]` 对应条目，后续围绕该成员继续处理。
        const task = tasks[taskId]
        // 当 `isInProcessTeammateTask(task) && task.status` 匹配 `'running'` 时，React hook执行对应分支。
        if (isInProcessTeammateTask(task) && task.status === 'running') {
          // Abort currentWorkAbortController (stops current turn) NOT abortController (kills teammate)
          // 调用 task.currentWorkAbortController?.abort()，完成这一处局部操作。
          task.currentWorkAbortController?.abort()
          // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }
      // Teammate is not running or task doesn't exist — exit the view
      // 调用 exitTeammateView，触发React hook此处需要的副作用。
      exitTeammateView(setAppState)
      // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Escape in selection mode: exit selection without aborting leader
    // 组合条件 `e.key === 'escape' && viewSelectionMode === 'sele` 成立时，React hook 状态流才启用这条专门路径。
    if (e.key === 'escape' && viewSelectionMode === 'selecting-agent') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => ({
        ...prev,
        viewSelectionMode: 'none',
        selectedIPAgentIndex: -1,
      }))
      // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Shift+Up/Down for teammate transcript switching (with wrapping)
    // Index -1 represents the leader, 0+ are teammates
    // When showSpinnerTree is true, index === teammateCount is the "hide" row
    // 组合条件 `e.shift && (e.key === 'up' || e.key === 'down')` 成立时，React hook 状态流才启用这条专门路径。
    if (e.shift && (e.key === 'up' || e.key === 'down')) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 满足 `teammateCount > 0` 时，React hook执行该分支。
      if (teammateCount > 0) {
        // 调用 stepTeammateSelection，触发React hook此处需要的副作用。
        stepTeammateSelection(e.key === 'down' ? 1 : -1, setAppState)
      // React hook use Background Task Navi...在这里处理 `} else if (hasNonTeammateBackgroundTasks) {`，完成这一小步状态转换。
      } else if (hasNonTeammateBackgroundTasks) {
        // 调用 options?.onOpenBackgroundTasks?.()，完成这一处局部操作。
        options?.onOpenBackgroundTasks?.()
      }
      // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 'f' to view selected teammate's transcript (only in selecting mode)
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      e.key === 'f' &&
      viewSelectionMode === 'selecting-agent' &&
      teammateCount > 0
    ) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // selected读取`getSelectedTeammate`，供React hook后续处理使用。
      const selected = getSelectedTeammate()
      // 满足 `selected` 时，React hook执行该分支。
      if (selected) {
        // 调用 enterTeammateView，触发React hook此处需要的副作用。
        enterTeammateView(selected.taskId, setAppState)
      }
      // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Enter to confirm selection (only when in selecting mode)
    // 组合条件 `e.key === 'return' && viewSelectionMode === 'sele` 成立时，React hook 状态流才启用这条专门路径。
    if (e.key === 'return' && viewSelectionMode === 'selecting-agent') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 满足 `selectedIPAgentIndex === -1` 时，React hook执行该分支。
      if (selectedIPAgentIndex === -1) {
        // 调用 exitTeammateView，触发React hook此处需要的副作用。
        exitTeammateView(setAppState)
      // React hook use Background Task Navi...在这里处理 `} else if (selectedIPAgentIndex >= teammateCount) {`，完成这一小步状态转换。
      } else if (selectedIPAgentIndex >= teammateCount) {
        // "Hide" row selected - collapse the spinner tree
        // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          expandedView: 'none' as const,
          viewSelectionMode: 'none',
          selectedIPAgentIndex: -1,
        }))
      } else {
        // selected读取`getSelectedTeammate`，供React hook后续处理使用。
        const selected = getSelectedTeammate()
        // 满足 `selected` 时，React hook执行该分支。
        if (selected) {
          // 调用 enterTeammateView，触发React hook此处需要的副作用。
          enterTeammateView(selected.taskId, setAppState)
        }
      }
      // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // k to kill selected teammate (only in selecting mode)
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      e.key === 'k' &&
      viewSelectionMode === 'selecting-agent' &&
      selectedIPAgentIndex >= 0
    ) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // selected读取`getSelectedTeammate`，供React hook后续处理使用。
      const selected = getSelectedTeammate()
      // 当 `selected && selected.task.status` 匹配 `'running'` 时，React hook执行对应分支。
      if (selected && selected.task.status === 'running') {
        // 显式忽略 `InProcessTeammateTask.kill(selected.taskId, setAppState)` 的返回值，只保留它触发的副作用。
        void InProcessTeammateTask.kill(selected.taskId, setAppState)
      }
      // React hook use Background Task Navi...在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // Backward-compat bridge: REPL.tsx doesn't yet wire handleKeyDown to
  // <Box onKeyDown>. Subscribe via useInput and adapt InputEvent →
  // KeyboardEvent until the consumer is migrated (separate PR).
  // TODO(onKeyDown-migration): remove once REPL passes handleKeyDown.
  // 调用 useInput，触发React hook此处需要的副作用。
  useInput((_input, _key, event) => {
    // 调用 handleKeyDown，触发React hook此处需要的副作用。
    handleKeyDown(new KeyboardEvent(event.keypress))
  })

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return { handleKeyDown }
}
