// 引入 useCallback、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useMemo, useState } from 'react'
// 复用 useApp 终端界面组件，避免在这里重复拼装显示逻辑。
import useApp from '../ink/hooks/use-app.js'
// 类型依赖 { KeybindingContextName } 来自 ../keybindings/types.js，用于校准React hook 状态流的数据契约。
import type { KeybindingContextName } from '../keybindings/types.js'
// 引入 useDoublePress，将 ./useDoublePress.js 中已经封装好的能力接到本文件流程里。
import { useDoublePress } from './useDoublePress.js'

// ExitState 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExitState = {
  pending: boolean
  keyName: 'Ctrl-C' | 'Ctrl-D' | null
}

// KeybindingOptions 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type KeybindingOptions = {
  context?: KeybindingContextName
  isActive?: boolean
}

// UseKeybindingsHook 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseKeybindingsHook = (
  handlers: Record<string, () => void>,
  options?: KeybindingOptions,
) => void

/**
 * Handle ctrl+c and ctrl+d for exiting the application.
 *
 * Uses a time-based double-press mechanism:
 * - First press: Shows "Press X again to exit" message
 * - Second press within timeout: Exits the application
 *
 * Note: We use time-based double-press rather than the chord system because
 * we want the first ctrl+c to also trigger interrupt (handled elsewhere).
 * The chord system would prevent the first press from firing any action.
 *
 * These keys are hardcoded and cannot be rebound via keybindings.json.
 *
 * @param useKeybindingsHook - The useKeybindings hook to use for registering handlers
 *                            (dependency injection to avoid import cycles)
 * @param onInterrupt - Optional callback for features to handle interrupt (ctrl+c).
 *                      Return true if handled, false to fall through to double-press exit.
 * @param onExit - Optional custom exit handler
 * @param isActive - Whether the keybinding is active (default true). Set false
 *                   while an embedded TextInput is focused — TextInput's own
 *                   ctrl+c/d handlers will manage cancel/exit, and Dialog's
 *                   handler would otherwise double-fire (child useInput runs
 *                   before parent useKeybindings, so both see every keypress).
 */
// useExitOnCtrlCD 封装useExitOnCtrlCD的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useExitOnCtrlCD(
  useKeybindingsHook: UseKeybindingsHook,
  onInterrupt?: () => boolean,
  onExit?: () => void,
  isActive = true,
): ExitState {
  // 从 `useApp()` 解构 exit，减少React hook use Exit On Ctrl CD对同一对象的重复访问。
  const { exit } = useApp()
  // 从 `useState<ExitState>({` 按位置拆出 exitState、setExitState，让React hook use Exit On Ctrl CD分别处理这些返回值。
  const [exitState, setExitState] = useState<ExitState>({
    pending: false,
    keyName: null,
  })

  // exitFn保存`useMemo`，供React hook后续处理使用。
  const exitFn = useMemo(() => onExit ?? exit, [onExit, exit])

  // Double-press handler for ctrl+c
  // handleCtrlCDoublePress 集合保存`useDoublePress`，供React hook后续处理使用。
  const handleCtrlCDoublePress = useDoublePress(
    pending => setExitState({ pending, keyName: 'Ctrl-C' }),
    exitFn,
  )

  // Double-press handler for ctrl+d
  // handleCtrlDDoublePress 集合保存`useDoublePress`，供React hook后续处理使用。
  const handleCtrlDDoublePress = useDoublePress(
    // pending更新为 `> setExitState({ pending, keyName: 'Ctrl-D' })`，确保useExitOnCtrlCD后续读取最新状态。
    pending => setExitState({ pending, keyName: 'Ctrl-D' }),
    exitFn,
  )

  // Handler for app:interrupt (ctrl+c by default)
  // Let features handle interrupt first via callback
  // handleInterrupt保存`useCallback`，供React hook后续处理使用。
  const handleInterrupt = useCallback(() => {
    // 满足 `onInterrupt?.()` 时，React hook执行该分支。
    if (onInterrupt?.()) return // Feature handled it
    // 调用 handleCtrlCDoublePress，触发React hook此处需要的副作用。
    handleCtrlCDoublePress()
  }, [handleCtrlCDoublePress, onInterrupt])

  // Handler for app:exit (ctrl+d by default)
  // This also uses double-press to confirm exit
  // handleExit保存`useCallback`，供React hook后续处理使用。
  const handleExit = useCallback(() => {
    // 调用 handleCtrlDDoublePress，触发React hook此处需要的副作用。
    handleCtrlDDoublePress()
  }, [handleCtrlDDoublePress])

  // handlers 集合保存`useMemo`，供React hook后续处理使用。
  const handlers = useMemo(
    () => ({
      'app:interrupt': handleInterrupt,
      'app:exit': handleExit,
    }),
    [handleInterrupt, handleExit],
  )

  // 调用 useKeybindingsHook，触发React hook此处需要的副作用。
  useKeybindingsHook(handlers, { context: 'Global', isActive })

  // 返回 `exitState`，作为React hook 状态流这次计算的结果。
  return exitState
}
