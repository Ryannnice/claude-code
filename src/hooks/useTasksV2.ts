// 使用 Node/Bun 的 fs 能力处理本地运行时资源。
import { type FSWatcher, watch } from 'fs'
// 引入 useEffect、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useSyncExternalStore } from 'react'
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js'
// 复用 createSignal 工具函数，把通用处理留在 ../utils/signal.js 中维护。
import { createSignal } from '../utils/signal.js'
// 类型依赖 { Task } 来自 ../utils/tasks.js，用于校准React hook 状态流的数据契约。
import type { Task } from '../utils/tasks.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getTaskListId,
  getTasksDir,
  isTodoV2Enabled,
  listTasks,
  onTasksUpdated,
  resetTaskList,
} from '../utils/tasks.js'
// 复用 isTeamLead 工具函数，把通用处理留在 ../utils/teammate.js 中维护。
import { isTeamLead } from '../utils/teammate.js'

// HIDE_DELAY_MS 集合保存`5000`，供React hook use Tasks ...后续判断或输出使用。
const HIDE_DELAY_MS = 5000
// DEBOUNCE_MS 集合保存`50`，供后续判断或组装使用。
const DEBOUNCE_MS = 50
// FALLBACK_POLL_MS 集合 命名 `5000 // Fallback in case fs.watch misses events`，让后续代码直接表达这个值的用途。
const FALLBACK_POLL_MS = 5000 // Fallback in case fs.watch misses events

/**
 * Singleton store for the TodoV2 task list. Owns the file watcher, timers,
 * and cached task list. Multiple hook instances (REPL, Spinner,
 * PromptInputFooterLeftSide) subscribe to one shared store instead of each
 * setting up their own fs.watch on the same directory. The Spinner mounts/
 * unmounts every turn — per-hook watchers caused constant watch/unwatch churn.
 *
 * Implements the useSyncExternalStore contract: subscribe/getSnapshot.
 */
// TasksV2Store 聚合React hook 状态流相关状态与操作，把同一职责的行为收束到类实例中。
class TasksV2Store {
  /** Stable array reference; replaced only on fetch. undefined until started. */
  #tasks: Task[] | undefined = undefined
  /**
   * Set when the hide timer has elapsed (all tasks completed for >5s), or
   * when the task list is empty. Starts false so the first fetch runs the
   * "all completed → schedule 5s hide" path (matches original behavior:
   * resuming a session with completed tasks shows them briefly).
   */
  #hidden = false
  #watcher: FSWatcher | null = null
  #watchedDir: string | null = null
  #hideTimer: ReturnType<typeof setTimeout> | null = null
  #debounceTimer: ReturnType<typeof setTimeout> | null = null
  #pollTimer: ReturnType<typeof setTimeout> | null = null
  // getSnapshot更新为 `(): Task[] | undefined => {`，确保useTasksV2后续读取最新状态。
  #unsubscribeTasksUpdated: (() => void) | null = null
  #changed = createSignal()
  #subscriberCount = 0
  #started = false

  /**
   * useSyncExternalStore snapshot. Returns the same Task[] reference between
   * updates (required for Object.is stability). Returns undefined when hidden.
   */
  // getSnapshot更新为 `(): Task[] | undefined => {`，确保useTasksV2后续读取最新状态。
  getSnapshot = (): Task[] | undefined => {
    // 返回 `this.#hidden ? undefined : this.#tasks`，作为React hook 状态流这次计算的结果。
    return this.#hidden ? undefined : this.#tasks
  }

  // subscribe更新为 `(fn: () => void): (() => void) => {`，确保useTasksV2后续读取最新状态。
  subscribe = (fn: () => void): (() => void) => {
    // Lazy init on first subscriber. useSyncExternalStore calls this
    // post-commit, so I/O here is safe (no render-phase side effects).
    // REPL.tsx keeps a subscription alive for the whole session, so
    // Spinner mount/unmount churn never drives the count to zero.
    // unsubscribe保存`changed.subscribe`，供React hook后续处理使用。
    const unsubscribe = this.#changed.subscribe(fn)
    // React hook use Tasks V2在这里处理 `this.#subscriberCount++`，完成这一小步状态转换。
    this.#subscriberCount++
    // 满足 `!this.#started` 时，React hook执行该分支。
    if (!this.#started) {
      // React hook use Tasks V2在这里处理 `this.#started = true`，完成这一小步状态转换。
      this.#started = true
      // React hook use Tasks V2在这里处理 `this.#unsubscribeTasksUpdated = onTasksUpdated(this.#debouncedFetch)`，完成这一小步状态转换。
      this.#unsubscribeTasksUpdated = onTasksUpdated(this.#debouncedFetch)
      // Fire-and-forget: subscribe is called post-commit (not in render),
      // and the store notifies subscribers when the fetch resolves.
      // 显式忽略 `this.#fetch()` 的返回值，只保留它触发的副作用。
      void this.#fetch()
    }
    // unsubscribed标记React hook use Tasks ...是否启用对应路径。
    let unsubscribed = false
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 满足 `unsubscribed` 时，React hook执行该分支。
      if (unsubscribed) return
      // unsubscribed更新为 `true`，确保useTasksV2后续读取最新状态。
      unsubscribed = true
      // 调用 unsubscribe，触发React hook此处需要的副作用。
      unsubscribe()
      // React hook use Tasks V2在这里处理 `this.#subscriberCount--`，完成这一小步状态转换。
      this.#subscriberCount--
      // 满足 `this.#subscriberCount === 0) this.#stop(` 时，React hook执行该分支。
      if (this.#subscriberCount === 0) this.#stop()
    }
  }

  // React hook use Tasks V2在这里处理 `#notify(): void {`，完成这一小步状态转换。
  #notify(): void {
    // React hook use Tasks V2在这里处理 `this.#changed.emit()`，完成这一小步状态转换。
    this.#changed.emit()
  }

  /**
   * Point the file watcher at the current tasks directory. Called on start
   * and whenever #fetch detects the task list ID has changed (e.g. when
   * TeamCreateTool sets leaderTeamName mid-session).
   */
  // `dir === this.#watchedDir && this.#watcher` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  #rewatch(dir: string): void {
    // Retry even on same dir if the previous watch attempt failed (dir
    // didn't exist yet). Once the watcher is established, same-dir is a no-op.
    // `dir === this.#watchedDir && this.#watcher` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (dir === this.#watchedDir && this.#watcher !== null) return
    // React hook use Tasks V2在这里处理 `this.#watcher?.close()`，完成这一小步状态转换。
    this.#watcher?.close()
    // React hook use Tasks V2在这里处理 `this.#watcher = null`，完成这一小步状态转换。
    this.#watcher = null
    // React hook use Tasks V2在这里处理 `this.#watchedDir = dir`，完成这一小步状态转换。
    this.#watchedDir = dir
    // 保护这一段可能失败的React hook 状态流操作，确保异常能进入相邻错误处理。
    try {
      // React hook use Tasks V2在这里处理 `this.#watcher = watch(dir, this.#debouncedFetch)`，完成这一小步状态转换。
      this.#watcher = watch(dir, this.#debouncedFetch)
      // React hook use Tasks V2在这里处理 `this.#watcher.unref()`，完成这一小步状态转换。
      this.#watcher.unref()
    } catch {
      // Directory may not exist yet (ensureTasksDir is called by writers).
      // Not critical — onTasksUpdated covers in-process updates and the
      // poll timer covers cross-process updates.
    }
  }

  // 满足 `this.#debounceTimer) clearTimeout(this.#debounceTimer` 时，React hook执行该分支。
  #debouncedFetch = (): void => {
    // 满足 `this.#debounceTimer) clearTimeout(this.#debounceTimer` 时，React hook执行该分支。
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
    // 这个回调绑定到 this.#debounceTimer = setTimeout(() => void this.#fetch(), DEBOUNCE_MS)，负责React hook 状态流在该局部场景下的响应。
    this.#debounceTimer = setTimeout(() => void this.#fetch(), DEBOUNCE_MS)
    // React hook use Tasks V2在这里处理 `this.#debounceTimer.unref()`，完成这一小步状态转换。
    this.#debounceTimer.unref()
  }

  // taskListId 集合读取`getTaskListId`，供React hook后续处理使用。
  #fetch = async (): Promise<void> => {
    // taskListId 集合读取`getTaskListId`，供React hook后续处理使用。
    const taskListId = getTaskListId()
    // Task list ID can change mid-session (TeamCreateTool sets
    // leaderTeamName) — point the watcher at the current dir.
    // React hook use Tasks V2在这里处理 `this.#rewatch(getTasksDir(taskListId))`，完成这一小步状态转换。
    this.#rewatch(getTasksDir(taskListId))
    // current保存`listTasks`，供React hook后续处理使用。
    const current = (await listTasks(taskListId)).filter(
      // t更新为 `> !t.metadata?._internal`，确保useTasksV2后续读取最新状态。
      t => !t.metadata?._internal,
    )
    // React hook use Tasks V2在这里处理 `this.#tasks = current`，完成这一小步状态转换。
    this.#tasks = current

    // hasIncomplete记录 `current.some` 是否成立，React hook随后按该结果分支。
    const hasIncomplete = current.some(t => t.status !== 'completed')

    // hasIncomplete || current为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (hasIncomplete || current.length === 0) {
      // Has unresolved tasks (open/in_progress) or empty — reset hide state
      // React hook use Tasks V2在这里处理 `this.#hidden = current.length === 0`，完成这一小步状态转换。
      this.#hidden = current.length === 0
      // React hook use Tasks V2在这里处理 `this.#clearHideTimer()`，完成这一小步状态转换。
      this.#clearHideTimer()
    // React hook use Tasks V2在这里处理 `} else if (this.#hideTimer === null && !this.#hidden) {`，完成这一小步状态转换。
    } else if (this.#hideTimer === null && !this.#hidden) {
      // All tasks just became completed — schedule clear
      // React hook use Tasks V2在这里处理 `this.#hideTimer = setTimeout(`，完成这一小步状态转换。
      this.#hideTimer = setTimeout(
        this.#onHideTimerFired.bind(this, taskListId),
        HIDE_DELAY_MS,
      )
      // React hook use Tasks V2在这里处理 `this.#hideTimer.unref()`，完成这一小步状态转换。
      this.#hideTimer.unref()
    }

    // React hook use Tasks V2在这里处理 `this.#notify()`，完成这一小步状态转换。
    this.#notify()

    // Schedule fallback poll only when there are incomplete tasks that
    // need monitoring. When all tasks are completed (or there are none),
    // the fs.watch watcher and onTasksUpdated callback are sufficient to
    // detect new activity — no need to keep polling and re-rendering.
    // 满足 `this.#pollTimer` 时，React hook执行该分支。
    if (this.#pollTimer) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(this.#pollTimer)
      // React hook use Tasks V2在这里处理 `this.#pollTimer = null`，完成这一小步状态转换。
      this.#pollTimer = null
    }
    // 满足 `hasIncomplete` 时，React hook执行该分支。
    if (hasIncomplete) {
      // React hook use Tasks V2在这里处理 `this.#pollTimer = setTimeout(this.#debouncedFetch, FALLBACK_POLL_MS)`，完成这一小步状态转换。
      this.#pollTimer = setTimeout(this.#debouncedFetch, FALLBACK_POLL_MS)
      // React hook use Tasks V2在这里处理 `this.#pollTimer.unref()`，完成这一小步状态转换。
      this.#pollTimer.unref()
    }
  }

  // React hook use Tasks V2在这里处理 `#onHideTimerFired(scheduledForTaskListId: string): void {`，完成这一小步状态转换。
  #onHideTimerFired(scheduledForTaskListId: string): void {
    // React hook use Tasks V2在这里处理 `this.#hideTimer = null`，完成这一小步状态转换。
    this.#hideTimer = null
    // Bail if the task list ID changed since scheduling (team created/deleted
    // during the 5s window) — don't reset the wrong list.
    // currentId读取`getTaskListId`，供React hook后续处理使用。
    const currentId = getTaskListId()
    // `currentId` 与 `scheduledForTaskListId` 不一致时刷新派生状态，避免使用过期结果。
    if (currentId !== scheduledForTaskListId) return
    // Verify all tasks are still completed before clearing
    // 这个回调绑定到 void listTasks(currentId).then(async tasksToCheck => {，负责React hook 状态流在该局部场景下的响应。
    void listTasks(currentId).then(async tasksToCheck => {
      // allStillCompleted 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const allStillCompleted =
        tasksToCheck.length > 0 &&
        // 调用 tasksToCheck.every，触发React hook此处需要的副作用。
        tasksToCheck.every(t => t.status === 'completed')
      // 满足 `allStillCompleted` 时，React hook执行该分支。
      if (allStillCompleted) {
        // 等待 `resetTaskList(currentId)` 完成，再继续React hook use Tasks V2的异步流程。
        await resetTaskList(currentId)
        // React hook use Tasks V2在这里处理 `this.#tasks = []`，完成这一小步状态转换。
        this.#tasks = []
        // React hook use Tasks V2在这里处理 `this.#hidden = true`，完成这一小步状态转换。
        this.#hidden = true
      }
      // React hook use Tasks V2在这里处理 `this.#notify()`，完成这一小步状态转换。
      this.#notify()
    })
  }

  // 满足 `this.#hideTimer` 时，React hook执行该分支。
  #clearHideTimer(): void {
    // 满足 `this.#hideTimer` 时，React hook执行该分支。
    if (this.#hideTimer) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(this.#hideTimer)
      // React hook use Tasks V2在这里处理 `this.#hideTimer = null`，完成这一小步状态转换。
      this.#hideTimer = null
    }
  }

  /**
   * Tear down the watcher, timers, and in-process subscription. Called when
   * the last subscriber unsubscribes. Preserves #tasks/#hidden cache so a
   * subsequent re-subscribe renders the last known state immediately.
   */
  // React hook use Tasks V2在这里处理 `#stop(): void {`，完成这一小步状态转换。
  #stop(): void {
    // React hook use Tasks V2在这里处理 `this.#watcher?.close()`，完成这一小步状态转换。
    this.#watcher?.close()
    // React hook use Tasks V2在这里处理 `this.#watcher = null`，完成这一小步状态转换。
    this.#watcher = null
    // React hook use Tasks V2在这里处理 `this.#watchedDir = null`，完成这一小步状态转换。
    this.#watchedDir = null
    // React hook use Tasks V2在这里处理 `this.#unsubscribeTasksUpdated?.()`，完成这一小步状态转换。
    this.#unsubscribeTasksUpdated?.()
    // React hook use Tasks V2在这里处理 `this.#unsubscribeTasksUpdated = null`，完成这一小步状态转换。
    this.#unsubscribeTasksUpdated = null
    // React hook use Tasks V2在这里处理 `this.#clearHideTimer()`，完成这一小步状态转换。
    this.#clearHideTimer()
    // 满足 `this.#debounceTimer) clearTimeout(this.#debounceTimer` 时，React hook执行该分支。
    if (this.#debounceTimer) clearTimeout(this.#debounceTimer)
    // 满足 `this.#pollTimer) clearTimeout(this.#pollTimer` 时，React hook执行该分支。
    if (this.#pollTimer) clearTimeout(this.#pollTimer)
    // React hook use Tasks V2在这里处理 `this.#debounceTimer = null`，完成这一小步状态转换。
    this.#debounceTimer = null
    // React hook use Tasks V2在这里处理 `this.#pollTimer = null`，完成这一小步状态转换。
    this.#pollTimer = null
    // React hook use Tasks V2在这里处理 `this.#started = false`，完成这一小步状态转换。
    this.#started = false
  }
}

// _store 命名 `null`，让后续代码直接表达这个值的用途。
let _store: TasksV2Store | null = null
// getStore 封装useTasksV2的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getStore(): TasksV2Store {
  // 返回 `(_store ??= new TasksV2Store())`，作为React hook 状态流这次计算的结果。
  return (_store ??= new TasksV2Store())
}

// Stable no-ops for the disabled path so useSyncExternalStore doesn't
// churn its subscription on every render.
// NOOP封装成回调，供React hook use Tasks ...在事件触发或异步步骤中调用。
const NOOP = (): void => {}
// NOOP_SUBSCRIBE封装成回调，供React hook use Tasks ...在事件触发或异步步骤中调用。
const NOOP_SUBSCRIBE = (): (() => void) => NOOP
// NOOP_SNAPSHOT封装成回调，供React hook use Tasks ...在事件触发或异步步骤中调用。
const NOOP_SNAPSHOT = (): undefined => undefined

/**
 * Hook to get the current task list for the persistent UI display.
 * Returns tasks when TodoV2 is enabled, otherwise returns undefined.
 * All hook instances share a single file watcher via TasksV2Store.
 * Hides the list after 5 seconds if there are no open tasks.
 */
// useTasksV2 封装useTasksV2的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTasksV2(): Task[] | undefined {
  // teamContext保存`useAppState`，供React hook后续处理使用。
  const teamContext = useAppState(s => s.teamContext)

  // enabled保存`isTodoV2Enabled`，供React hook后续处理使用。
  const enabled = isTodoV2Enabled() && (!teamContext || isTeamLead(teamContext))

  // store读取`getStore`，供React hook后续处理使用。
  const store = enabled ? getStore() : null

  // 返回 `useSyncExternalStore(`，作为React hook 状态流这次计算的结果。
  return useSyncExternalStore(
    store ? store.subscribe : NOOP_SUBSCRIBE,
    store ? store.getSnapshot : NOOP_SNAPSHOT,
  )
}

/**
 * Same as useTasksV2, plus collapses the expanded task view when the list
 * becomes hidden. Call this from exactly one always-mounted component (REPL)
 * so the collapse effect runs once instead of N× per consumer.
 */
// useTasksV2WithCollapseEffect 封装useTasksV2的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTasksV2WithCollapseEffect(): Task[] | undefined {
  // tasks 集合保存`useTasksV2`，供React hook后续处理使用。
  const tasks = useTasksV2()
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()

  // hidden标记React hook use Tasks ...是否启用对应路径。
  const hidden = tasks === undefined
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // hidden缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!hidden) return
    // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setAppState(prev => {
      // `prev.expandedView` 与 `'tasks'` 不一致时刷新派生状态，避免使用过期结果。
      if (prev.expandedView !== 'tasks') return prev
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return { ...prev, expandedView: 'none' as const }
    })
  }, [hidden, setAppState])

  // 返回 `tasks`，作为React hook 状态流这次计算的结果。
  return tasks
}
