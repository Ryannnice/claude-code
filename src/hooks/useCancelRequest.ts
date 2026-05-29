/**
 * CancelRequestHandler component for handling cancel/escape keybinding.
 *
 * Must be rendered inside KeybindingSetup to have access to the keybinding context.
 * This component renders nothing - it just registers the cancel keybinding handler.
 */
// 引入 useCallback、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useRef } from 'react'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 src/services/analytics/metadata.js，用于校准React hook 状态流的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from 'src/services/analytics/metadata.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  useAppState,
  useAppStateStore,
  useSetAppState,
} from 'src/state/AppState.js'
// 复用 isVimModeEnabled 终端界面组件，避免在这里重复拼装显示逻辑。
import { isVimModeEnabled } from '../components/PromptInput/utils.js'
// 类型依赖 { ToolUseConfirm } 来自 ../components/permissions/PermissionRequest.js，用于校准React hook 状态流的数据契约。
import type { ToolUseConfirm } from '../components/permissions/PermissionRequest.js'
// 类型依赖 { SpinnerMode } 来自 ../components/Spinner/types.js，用于校准React hook 状态流的数据契约。
import type { SpinnerMode } from '../components/Spinner/types.js'
// 引入 useNotifications，将 ../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../context/notifications.js'
// 引入 useIsOverlayActive，将 ../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useIsOverlayActive } from '../context/overlayContext.js'
// 引入 useCommandQueue，将 ../hooks/useCommandQueue.js 中已经封装好的能力接到本文件流程里。
import { useCommandQueue } from '../hooks/useCommandQueue.js'
// 引入 getShortcutDisplay，将 ../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../keybindings/shortcutFormat.js'
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js'
// 类型依赖 { Screen } 来自 ../screens/REPL.js，用于校准React hook 状态流的数据契约。
import type { Screen } from '../screens/REPL.js'
// 引入 exitTeammateView，将 ../state/teammateViewHelpers.js 中已经封装好的能力接到本文件流程里。
import { exitTeammateView } from '../state/teammateViewHelpers.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  killAllRunningAgentTasks,
  markAgentsNotified,
} from '../tasks/LocalAgentTask/LocalAgentTask.js'
// 类型依赖 { PromptInputMode, VimMode } 来自 ../types/textInputTypes.js，用于校准React hook 状态流的数据契约。
import type { PromptInputMode, VimMode } from '../types/textInputTypes.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  clearCommandQueue,
  enqueuePendingNotification,
  hasCommandsInQueue,
} from '../utils/messageQueueManager.js'
// 复用 emitTaskTerminatedSdk 工具函数，把通用处理留在 ../utils/sdkEventQueue.js 中维护。
import { emitTaskTerminatedSdk } from '../utils/sdkEventQueue.js'

/** Time window in ms during which a second press kills all background agents. */
// KILL_AGENTS_CONFIRM_WINDOW_MS 集合 命名 `3000`，让后续代码直接表达这个值的用途。
const KILL_AGENTS_CONFIRM_WINDOW_MS = 3000

// CancelRequestHandlerProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type CancelRequestHandlerProps = {
  // React hook use Cancel Request在这里处理 `setToolUseConfirmQueue: (`，完成这一小步状态转换。
  setToolUseConfirmQueue: (
    // 这个回调绑定到 f: (toolUseConfirmQueue: ToolUseConfirm[]) => ToolUseConfirm[],，负责React hook 状态流在该局部场景下的响应。
    f: (toolUseConfirmQueue: ToolUseConfirm[]) => ToolUseConfirm[],
  ) => void
  // 这个回调绑定到 onCancel: () => void，负责React hook 状态流在该局部场景下的响应。
  onCancel: () => void
  // 这个回调绑定到 onAgentsKilled: () => void，负责React hook 状态流在该局部场景下的响应。
  onAgentsKilled: () => void
  isMessageSelectorVisible: boolean
  screen: Screen
  abortSignal?: AbortSignal
  popCommandFromQueue?: () => void
  vimMode?: VimMode
  isLocalJSXCommand?: boolean
  isSearchingHistory?: boolean
  isHelpOpen?: boolean
  inputMode?: PromptInputMode
  inputValue?: string
  streamMode?: SpinnerMode
}

/**
 * Component that handles cancel requests via keybinding.
 * Renders null but registers the 'chat:cancel' keybinding handler.
 */
// CancelRequestHandler 封装useCancelRequest的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CancelRequestHandler(props: CancelRequestHandlerProps): null {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    setToolUseConfirmQueue,
    onCancel,
    onAgentsKilled,
    isMessageSelectorVisible,
    screen,
    abortSignal,
    popCommandFromQueue,
    vimMode,
    isLocalJSXCommand,
    isSearchingHistory,
    isHelpOpen,
    inputMode,
    inputValue,
    streamMode,
  } = props
  // store保存`useAppStateStore`，供React hook后续处理使用。
  const store = useAppStateStore()
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // queuedCommandsLength 命令数据保存`useCommandQueue`，供React hook后续处理使用。
  const queuedCommandsLength = useCommandQueue().length
  // 从 `useNotifications()` 解构 addNotification、removeNotification，减少React hook use Cancel Request对同一对象的重复访问。
  const { addNotification, removeNotification } = useNotifications()
  // lastKillAgentsPressRef 引用保存 hook 状态，让React hook use Cancel...跨渲染复用同一个容器。
  const lastKillAgentsPressRef = useRef<number>(0)
  // viewSelectionMode保存`useAppState`，供React hook后续处理使用。
  const viewSelectionMode = useAppState(s => s.viewSelectionMode)

  // handleCancel保存`useCallback`，供React hook后续处理使用。
  const handleCancel = useCallback(() => {
    // cancelProps 集合 集中保存React hook use Cancel...要一起传递的字段。
    const cancelProps = {
      source:
        'escape' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      streamMode:
        streamMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    }

    // Priority 1: If there's an active task running, cancel it first
    // This takes precedence over queue management so users can always interrupt Claude
    // `abortSignal` 与 `undefined && !abortSignal.abort...` 不一致时刷新派生状态，避免使用过期结果。
    if (abortSignal !== undefined && !abortSignal.aborted) {
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_cancel', cancelProps)
      // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
      setToolUseConfirmQueue(() => [])
      // 调用 onCancel，触发React hook此处需要的副作用。
      onCancel()
      // React hook use Cancel Request在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Priority 2: Pop queue when Claude is idle (no running task to cancel)
    // 满足 `hasCommandsInQueue()` 时，React hook执行该分支。
    if (hasCommandsInQueue()) {
      // 满足 `popCommandFromQueue` 时，React hook执行该分支。
      if (popCommandFromQueue) {
        // 调用 popCommandFromQueue，触发React hook此处需要的副作用。
        popCommandFromQueue()
        // React hook use Cancel Request在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }

    // Fallback: nothing to cancel or pop (shouldn't reach here if isActive is correct)
    // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_cancel', cancelProps)
    // setToolUseConfirmQueue 写入新的状态值，使React hook 状态流后续读取保持一致。
    setToolUseConfirmQueue(() => [])
    // 调用 onCancel，触发React hook此处需要的副作用。
    onCancel()
  }, [
    abortSignal,
    popCommandFromQueue,
    setToolUseConfirmQueue,
    onCancel,
    streamMode,
  ])

  // Determine if this handler should be active
  // Other contexts (Transcript, HistorySearch, Help) have their own escape handlers
  // Overlays (ModelPicker, ThinkingToggle, etc.) register themselves via useRegisterOverlay
  // Local JSX commands (like /model, /btw) handle their own input
  // isOverlayActive记录 `useIsOverlayActive` 是否成立，React hook随后按该结果分支。
  const isOverlayActive = useIsOverlayActive()
  // canCancelRunningTask标记React hook use Cancel...是否启用对应路径。
  const canCancelRunningTask = abortSignal !== undefined && !abortSignal.aborted
  // hasQueuedCommands 命令数据标记React hook use Cancel...是否启用对应路径。
  const hasQueuedCommands = queuedCommandsLength > 0
  // When in bash/background mode with empty input, escape should exit the mode
  // rather than cancel the request. Let PromptInput handle mode exit.
  // This only applies to Escape, not Ctrl+C which should always cancel.
  // isInSpecialModeWithEmptyInput 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isInSpecialModeWithEmptyInput =
    inputMode !== undefined && inputMode !== 'prompt' && !inputValue
  // When viewing a teammate's transcript, let useBackgroundTaskNavigation handle Escape
  // isViewingTeammate标记React hook use Cancel...是否启用对应路径。
  const isViewingTeammate = viewSelectionMode === 'viewing-agent'
  // Context guards: other screens/overlays handle their own cancel
  // isContextActive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isContextActive =
    screen !== 'transcript' &&
    !isSearchingHistory &&
    !isMessageSelectorVisible &&
    !isLocalJSXCommand &&
    !isHelpOpen &&
    !isOverlayActive &&
    !(isVimModeEnabled() && vimMode === 'INSERT')

  // Escape (chat:cancel) defers to mode-exit when in special mode with empty
  // input, and to useBackgroundTaskNavigation when viewing a teammate
  // isEscapeActive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isEscapeActive =
    isContextActive &&
    (canCancelRunningTask || hasQueuedCommands) &&
    !isInSpecialModeWithEmptyInput &&
    !isViewingTeammate

  // Ctrl+C (app:interrupt): when viewing a teammate, stops everything and
  // returns to main thread. Otherwise just handleCancel. Must NOT claim
  // ctrl+c when main is idle at the prompt — that blocks the copy-selection
  // handler and double-press-to-exit from ever seeing the keypress.
  // isCtrlCActive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isCtrlCActive =
    isContextActive &&
    (canCancelRunningTask || hasQueuedCommands || isViewingTeammate)

  // 调用 useKeybinding，触发React hook此处需要的副作用。
  useKeybinding('chat:cancel', handleCancel, {
    context: 'Chat',
    isActive: isEscapeActive,
  })

  // Shared kill path: stop all agents, suppress per-agent notifications,
  // emit SDK events, enqueue a single aggregate model-facing notification.
  // Returns true if anything was killed.
  // killAllAgentsAndNotify保存`useCallback`，供React hook后续处理使用。
  const killAllAgentsAndNotify = useCallback((): boolean => {
    // tasks 集合读取`store.getState`，供React hook后续处理使用。
    const tasks = store.getState().tasks
    // running派生`Object.entries`，供React hook后续处理使用。
    const running = Object.entries(tasks).filter(
      ([, t]) => t.type === 'local_agent' && t.status === 'running',
    )
    // running为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (running.length === 0) return false
    // 调用 killAllRunningAgentTasks，触发React hook此处需要的副作用。
    killAllRunningAgentTasks(tasks, setAppState)
    // descriptions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const descriptions: string[] = []
    // 循环处理 `const [taskId, task] of running`，让React hook 状态流逐项把同类条目按顺序走完。
    for (const [taskId, task] of running) {
      // 调用 markAgentsNotified，触发React hook此处需要的副作用。
      markAgentsNotified(taskId, setAppState)
      // descriptions 集合追加新条目，保持收集顺序与输入顺序一致。
      descriptions.push(task.description)
      // 调用 emitTaskTerminatedSdk，触发React hook此处需要的副作用。
      emitTaskTerminatedSdk(taskId, 'stopped', {
        toolUseId: task.toolUseId,
        summary: task.description,
      })
    }
    // summary 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const summary =
      descriptions.length === 1
        ? `Background agent "${descriptions[0]}" was stopped by the user.`
        // 这个回调绑定到 : `${descriptions.length} background agents were stopped by the user: ${descriptions…，负责React hook 状态流在该局部场景下的响应。
        : `${descriptions.length} background agents were stopped by the user: ${descriptions.map(d => `"${d}"`).join(', ')}.`
    // 调用 enqueuePendingNotification，触发React hook此处需要的副作用。
    enqueuePendingNotification({ value: summary, mode: 'task-notification' })
    // 调用 onAgentsKilled，触发React hook此处需要的副作用。
    onAgentsKilled()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }, [store, setAppState, onAgentsKilled])

  // Ctrl+C (app:interrupt). Scoped to teammate-view: killing agents from the
  // main prompt stays a deliberate gesture (chat:killAgents), not a
  // side-effect of cancelling a turn.
  // handleInterrupt保存`useCallback`，供React hook后续处理使用。
  const handleInterrupt = useCallback(() => {
    // 满足 `isViewingTeammate` 时，React hook执行该分支。
    if (isViewingTeammate) {
      // 调用 killAllAgentsAndNotify，触发React hook此处需要的副作用。
      killAllAgentsAndNotify()
      // 调用 exitTeammateView，触发React hook此处需要的副作用。
      exitTeammateView(setAppState)
    }
    // 组合条件 `canCancelRunningTask || hasQueuedCommands` 成立时，React hook 状态流才启用这条专门路径。
    if (canCancelRunningTask || hasQueuedCommands) {
      // 调用 handleCancel，触发React hook此处需要的副作用。
      handleCancel()
    }
  }, [
    isViewingTeammate,
    killAllAgentsAndNotify,
    setAppState,
    canCancelRunningTask,
    hasQueuedCommands,
    handleCancel,
  ])

  // 调用 useKeybinding，触发React hook此处需要的副作用。
  useKeybinding('app:interrupt', handleInterrupt, {
    context: 'Global',
    isActive: isCtrlCActive,
  })

  // chat:killAgents uses a two-press pattern: first press shows a
  // confirmation hint, second press within the window actually kills all
  // agents. Reads tasks from the store directly to avoid stale closures.
  // handleKillAgents 集合保存`useCallback`，供React hook后续处理使用。
  const handleKillAgents = useCallback(() => {
    // tasks 集合读取`store.getState`，供React hook后续处理使用。
    const tasks = store.getState().tasks
    // hasRunningAgents 集合记录 `Object.values` 是否成立，React hook随后按该结果分支。
    const hasRunningAgents = Object.values(tasks).some(
      t => t.type === 'local_agent' && t.status === 'running',
    )
    // hasRunningAgents 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!hasRunningAgents) {
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: 'kill-agents-none',
        text: 'No background agents running',
        priority: 'immediate',
        timeoutMs: 2000,
      })
      // React hook use Cancel Request在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // now记录时间`Date.now`，供React hook后续处理使用。
    const now = Date.now()
    // elapsed 命名 `now - lastKillAgentsPressRef.current`，让后续代码直接表达这个值的用途。
    const elapsed = now - lastKillAgentsPressRef.current
    // 满足 `elapsed <= KILL_AGENTS_CONFIRM_WINDOW_MS` 时，React hook执行该分支。
    if (elapsed <= KILL_AGENTS_CONFIRM_WINDOW_MS) {
      // Second press within window -- kill all background agents
      // current更新为 `0`，确保useCancelRequest后续读取最新状态。
      lastKillAgentsPressRef.current = 0
      // 调用 removeNotification，触发React hook此处需要的副作用。
      removeNotification('kill-agents-confirm')
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_cancel', {
        source:
          'kill_agents' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 调用 clearCommandQueue，触发React hook此处需要的副作用。
      clearCommandQueue()
      // 调用 killAllAgentsAndNotify，触发React hook此处需要的副作用。
      killAllAgentsAndNotify()
      // React hook use Cancel Request在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // First press -- show confirmation hint in status bar
    // current更新为 `now`，确保useCancelRequest后续读取最新状态。
    lastKillAgentsPressRef.current = now
    // shortcut读取`getShortcutDisplay`，供React hook后续处理使用。
    const shortcut = getShortcutDisplay(
      'chat:killAgents',
      'Chat',
      'ctrl+x ctrl+k',
    )
    // 调用 addNotification，触发React hook此处需要的副作用。
    addNotification({
      key: 'kill-agents-confirm',
      text: `Press ${shortcut} again to stop background agents`,
      priority: 'immediate',
      timeoutMs: KILL_AGENTS_CONFIRM_WINDOW_MS,
    })
  }, [store, addNotification, removeNotification, killAllAgentsAndNotify])

  // Must stay always-active: ctrl+x is consumed as a chord prefix regardless
  // of isActive (because ctrl+x ctrl+e is always live), so an inactive handler
  // here would leak ctrl+k to readline kill-line. Handler gates internally.
  // 调用 useKeybinding，触发React hook此处需要的副作用。
  useKeybinding('chat:killAgents', handleKillAgents, {
    context: 'Chat',
  })

  // 返回 `null`，作为React hook 状态流这次计算的结果。
  return null
}
