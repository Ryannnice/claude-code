// 引入 useContext，将 react 中已经封装好的能力接到本文件流程里。
import { useContext } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type TerminalSize,
  TerminalSizeContext,
} from 'src/ink/components/TerminalSizeContext.js'

// useTerminalSize 封装useTerminalSize的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTerminalSize(): TerminalSize {
  // size保存`useContext`，供React hook后续处理使用。
  const size = useContext(TerminalSizeContext)

  // size缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
  if (!size) {
    // 抛出 new Error('useTerminalSize must be used within an Ink App component')，阻止React hook 状态流在无效状态下继续运行。
    throw new Error('useTerminalSize must be used within an Ink App component')
  }

  // 返回 `size`，作为React hook 状态流这次计算的结果。
  return size
}
