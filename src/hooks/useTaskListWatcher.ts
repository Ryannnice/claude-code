// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { type FSWatcher, watch } from 'fs'
// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  claimTask,
  DEFAULT_TASKS_MODE_TASK_LIST_ID,
  ensureTasksDir,
  getTasksDir,
  listTasks,
  type Task,
  updateTask,
} from '../utils/tasks.js'

// DEBOUNCE_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const DEBOUNCE_MS = 1000

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  /** When undefined, the hook does nothing. The task list id is also used as the agent ID. */
  taskListId?: string
  isLoading: boolean
  /**
   * Called when a task is ready to be worked on.
   * Returns true if submission succeeded, false if rejected.
   */
  // 这个回调绑定到 onSubmitTask: (prompt: string) => boolean，负责React hook 状态流在该局部场景下的响应。
  onSubmitTask: (prompt: string) => boolean
}

/**
 * Hook that watches a task list directory and automatically picks up
 * open, unowned tasks to work on.
 *
 * This enables "tasks mode" where Claude watches for externally-created
 * tasks and processes them one at a time.
 */
// useTaskListWatcher 封装useTaskListWatcher的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTaskListWatcher({
  taskListId,
  isLoading,
  onSubmitTask,
}: Props): void {
  // currentTaskRef 引用保存 hook 状态，让React hook use Task L...跨渲染复用同一个容器。
  const currentTaskRef = useRef<string | null>(null)
  // debounceTimerRef 引用保存 hook 状态，让React hook use Task L...跨渲染复用同一个容器。
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stabilize unstable props via refs so the watcher effect doesn't depend on
  // them. isLoading flips every turn, and onSubmitTask's identity changes
  // whenever onQuery's deps change. Without this, the watcher effect re-runs
  // on every turn, calling watcher.close() + watch() each time — which is a
  // trigger for Bun's PathWatcherManager deadlock (oven-sh/bun#27469).
  // isLoadingRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const isLoadingRef = useRef(isLoading)
  // current更新为 `isLoading`，确保useTaskListWatcher后续读取最新状态。
  isLoadingRef.current = isLoading
  // onSubmitTaskRef 引用保存`useRef`，供React hook后续处理使用。
  const onSubmitTaskRef = useRef(onSubmitTask)
  // current更新为 `onSubmitTask`，确保useTaskListWatcher后续读取最新状态。
  onSubmitTaskRef.current = onSubmitTask

  // enabled标记React hook use Task L...是否启用对应路径。
  const enabled = taskListId !== undefined
  // agentId保存`taskListId ?? DEFAULT_TASKS_MODE_TASK_LIST_ID`，供React hook use Task L...后续判断或输出使用。
  const agentId = taskListId ?? DEFAULT_TASKS_MODE_TASK_LIST_ID

  // checkForTasks reads isLoading and onSubmitTask from refs — always
  // up-to-date, no stale closure, and doesn't force a new function identity
  // per render. Stored in a ref so the watcher effect can call it without
  // depending on it.
  // checkForTasksRef 引用保存`async`，供React hook后续处理使用。
  const checkForTasksRef = useRef<() => Promise<void>>(async () => {})
  // current更新为 `async () => {`，确保useTaskListWatcher后续读取最新状态。
  checkForTasksRef.current = async () => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) {
      // React hook use Task List Watcher在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Don't need to submit new tasks if we are already working
    // 满足 `isLoadingRef.current` 时，React hook执行该分支。
    if (isLoadingRef.current) {
      // React hook use Task List Watcher在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // tasks 集合保存`listTasks`，供React hook后续处理使用。
    const tasks = await listTasks(taskListId)

    // If we have a current task, check if it's been resolved
    // `currentTaskRef.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (currentTaskRef.current !== null) {
      // currentTask筛选`tasks.find`，供React hook后续处理使用。
      const currentTask = tasks.find(t => t.id === currentTaskRef.current)
      // 当 `!currentTask || currentTask.status` 匹配 `'completed'` 时，React hook执行对应分支。
      if (!currentTask || currentTask.status === 'completed') {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[TaskListWatcher] Task #${currentTaskRef.current} is marked complete, ready for next task`,
        )
        // current更新为 `null`，确保useTaskListWatcher后续读取最新状态。
        currentTaskRef.current = null
      } else {
        // Still working on current task
        // React hook use Task List Watcher在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }

    // Find an open task with no owner that isn't blocked
    // availableTask筛选`findAvailableTask`，供React hook后续处理使用。
    const availableTask = findAvailableTask(tasks)

    // availableTask缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!availableTask) {
      // React hook use Task List Watcher在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TaskListWatcher] Found available task #${availableTask.id}: ${availableTask.subject}`,
    )

    // Claim the task using the task list's agent ID
    // 结果保存`claimTask`，供React hook后续处理使用。
    const result = await claimTask(taskListId, availableTask.id, agentId)

    // result.success 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!result.success) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TaskListWatcher] Failed to claim task #${availableTask.id}: ${result.reason}`,
      )
      // React hook use Task List Watcher在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // current更新为 `availableTask.id`，确保useTaskListWatcher后续读取最新状态。
    currentTaskRef.current = availableTask.id

    // Format the task as a prompt
    // 提示词格式化`formatTaskAsPrompt`，供React hook后续处理使用。
    const prompt = formatTaskAsPrompt(availableTask)

    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[TaskListWatcher] Submitting task #${availableTask.id} as prompt`,
    )

    // submitted保存`onSubmitTaskRef.current`，供React hook后续处理使用。
    const submitted = onSubmitTaskRef.current(prompt)
    // submitted缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!submitted) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[TaskListWatcher] Failed to submit task #${availableTask.id}, releasing claim`,
      )
      // Release the claim
      // 等待 `updateTask(taskListId, availableTask.id, { owner: undefined })` 完成，再继续React hook use Task List Watcher的异步流程。
      await updateTask(taskListId, availableTask.id, { owner: undefined })
      // current更新为 `null`，确保useTaskListWatcher后续读取最新状态。
      currentTaskRef.current = null
    }
  }

  // -- Watcher setup

  // Schedules a check after DEBOUNCE_MS, collapsing rapid fs events.
  // Shared between the watcher callback and the idle-trigger effect below.
  // scheduleCheckRef 引用保存 hook 状态，让React hook use Task L...跨渲染复用同一个容器。
  const scheduleCheckRef = useRef<() => void>(() => {})

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return

    // 显式忽略 `ensureTasksDir(taskListId)` 的返回值，只保留它触发的副作用。
    void ensureTasksDir(taskListId)
    // tasksDir读取`getTasksDir`，供React hook后续处理使用。
    const tasksDir = getTasksDir(taskListId)

    // watcher初始化为空值，后续分支会在有数据时补齐。
    let watcher: FSWatcher | null = null

    // debouncedCheck封装成回调，供React hook use Task L...在事件触发或异步步骤中调用。
    const debouncedCheck = (): void => {
      // 满足 `debounceTimerRef.current` 时，React hook执行该分支。
      if (debounceTimerRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(debounceTimerRef.current)
      }
      // current更新为 `setTimeout(`，确保useTaskListWatcher后续读取最新状态。
      debounceTimerRef.current = setTimeout(
        // ref 引用更新为 `> void ref.current()`，确保useTaskListWatcher后续读取最新状态。
        ref => void ref.current(),
        DEBOUNCE_MS,
        checkForTasksRef,
      )
    }
    // current更新为 `debouncedCheck`，确保useTaskListWatcher后续读取最新状态。
    scheduleCheckRef.current = debouncedCheck

    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // watcher更新为 `watch(tasksDir, debouncedCheck)`，确保useTaskListWatcher后续读取最新状态。
      watcher = watch(tasksDir, debouncedCheck)
      // 调用 watcher.unref，触发React hook此处需要的副作用。
      watcher.unref()
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[TaskListWatcher] Watching for tasks in ${tasksDir}`)
    } catch (error) {
      // fs.watch throws synchronously on ENOENT — ensureTasksDir should have
      // created the dir, but handle the race gracefully
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[TaskListWatcher] Failed to watch ${tasksDir}: ${error}`)
    }

    // Initial check
    // 调用 debouncedCheck，触发React hook此处需要的副作用。
    debouncedCheck()

    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // This cleanup only fires when taskListId changes or on unmount —
      // never per-turn. That keeps watcher.close() out of the Bun
      // PathWatcherManager deadlock window.
      // current更新为 `() => {}`，确保useTaskListWatcher后续读取最新状态。
      scheduleCheckRef.current = () => {}
      // 满足 `watcher` 时，React hook执行该分支。
      if (watcher) {
        // 调用 watcher.close，触发React hook此处需要的副作用。
        watcher.close()
      }
      // 满足 `debounceTimerRef.current` 时，React hook执行该分支。
      if (debounceTimerRef.current) {
        // 调用 clearTimeout，触发React hook此处需要的副作用。
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [enabled, taskListId])

  // Previously, the watcher effect depended on checkForTasks (and transitively
  // isLoading), so going idle triggered a re-setup whose initial debouncedCheck
  // would pick up the next task. Preserve that behavior explicitly: when
  // isLoading drops, schedule a check.
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // enabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!enabled) return
    // 满足 `isLoading` 时，React hook执行该分支。
    if (isLoading) return
    // 调用 scheduleCheckRef.current，触发React hook此处需要的副作用。
    scheduleCheckRef.current()
  }, [enabled, isLoading])
}

/**
 * Find an available task that can be worked on:
 * - Status is 'pending'
 * - No owner assigned
 * - Not blocked by any unresolved tasks
 */
// findAvailableTask 封装useTaskListWatcher的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findAvailableTask(tasks: Task[]): Task | undefined {
  // unresolvedTaskIds 集合保存`Set`，供React hook后续处理使用。
  const unresolvedTaskIds = new Set(
    tasks.filter(t => t.status !== 'completed').map(t => t.id),
  )

  // 返回 `tasks.find(task => {`，作为React hook 状态流这次计算的结果。
  return tasks.find(task => {
    // `task.status` 与 `'pending'` 不一致时刷新派生状态，避免使用过期结果。
    if (task.status !== 'pending') return false
    // 满足 `task.owner` 时，React hook执行该分支。
    if (task.owner) return false
    // Check all blockers are completed
    // 返回 `task.blockedBy.every(id => !unresolvedTaskIds.has(id))`，作为React hook 状态流这次计算的结果。
    return task.blockedBy.every(id => !unresolvedTaskIds.has(id))
  })
}

/**
 * Format a task as a prompt for Claude to work on.
 */
// formatTaskAsPrompt 封装useTaskListWatcher的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatTaskAsPrompt(task: Task): string {
  // 提示词固定为 ``Complete all open tasks. Start with task #${task.id}: \n...`，作为React hook use Task L...后续展示或比较的基准。
  let prompt = `Complete all open tasks. Start with task #${task.id}: \n\n ${task.subject}`

  // 满足 `task.description` 时，React hook执行该分支。
  if (task.description) {
    // React hook use Task List Watcher在这里处理 `prompt += `\n\n${task.description}``，完成这一小步状态转换。
    prompt += `\n\n${task.description}`
  }

  // 返回 `prompt`，作为React hook 状态流这次计算的结果。
  return prompt
}
