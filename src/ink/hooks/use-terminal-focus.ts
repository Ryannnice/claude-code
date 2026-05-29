// 引入 useContext，将 react 中已经封装好的能力接到本文件流程里。
import { useContext } from 'react'
// 复用 TerminalFocusContext 终端界面组件，避免在这里重复拼装显示逻辑。
import TerminalFocusContext from '../components/TerminalFocusContext.js'

/**
 * Hook to check if the terminal has focus.
 *
 * Uses DECSET 1004 focus reporting - the terminal sends escape sequences
 * when it gains or loses focus. These are handled automatically
 * by Ink and filtered from useInput.
 *
 * @returns true if the terminal is focused (or focus state is unknown)
 */
// useTerminalFocus 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTerminalFocus(): boolean {
  // 从 `useContext(TerminalFocusContext)` 解构 isTerminalFocused，减少Ink 渲染层 use terminal focus对同一对象的重复访问。
  const { isTerminalFocused } = useContext(TerminalFocusContext)
  // 返回 `isTerminalFocused`，作为终端渲染这次计算的结果。
  return isTerminalFocused
}
