// 引入 useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../keybindings/useKeybinding.js'
// 引入 ExitState、useExitOnCtrlCD，将 ./useExitOnCtrlCD.js 中已经封装好的能力接到本文件流程里。
import { type ExitState, useExitOnCtrlCD } from './useExitOnCtrlCD.js'

// 导出类型定义，让其他模块沿用React hook use Exit On Ctrl CDWith ...的数据契约。
export type { ExitState }

/**
 * Convenience hook that wires up useExitOnCtrlCD with useKeybindings.
 *
 * This is the standard way to use useExitOnCtrlCD in components.
 * The separation exists to avoid import cycles - useExitOnCtrlCD.ts
 * doesn't import from the keybindings module directly.
 *
 * @param onExit - Optional custom exit handler
 * @param onInterrupt - Optional callback for features to handle interrupt (ctrl+c).
 *                      Return true if handled, false to fall through to double-press exit.
 * @param isActive - Whether the keybinding is active (default true).
 */
// useExitOnCtrlCDWithKeybindings 封装useExitOnCtrlCDWithKeybindings的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useExitOnCtrlCDWithKeybindings(
  onExit?: () => void,
  onInterrupt?: () => boolean,
  isActive?: boolean,
): ExitState {
  // 返回 `useExitOnCtrlCD(useKeybindings, onInterrupt, onExit, isActive)`，作为React hook 状态流这次计算的结果。
  return useExitOnCtrlCD(useKeybindings, onInterrupt, onExit, isActive)
}
