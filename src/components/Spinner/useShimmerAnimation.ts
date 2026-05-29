// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js'
// 引入 DOMElement、useAnimationFrame，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { type DOMElement, useAnimationFrame } from '../../ink.js'
// 类型依赖 { SpinnerMode } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { SpinnerMode } from './types.js'

// useShimmerAnimation 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useShimmerAnimation(
  mode: SpinnerMode,
  message: string,
  isStalled: boolean,
): [ref: (element: DOMElement | null) => void, glimmerIndex: number] {
  // glimmerSpeed标记终端 UI use Shimmer Animation是否启用对应路径。
  const glimmerSpeed = mode === 'requesting' ? 50 : 200
  // Pass null when stalled to unsubscribe from the clock — otherwise the
  // setInterval keeps firing at 20fps even when the shimmer isn't visible.
  // Notably, if the caller never attaches `ref` (e.g. conditional JSX),
  // useTerminalViewport stays at its initial isVisible:true and the
  // viewport-pause never kicks in, so this is the only stop mechanism.
  // 从 `useAnimationFrame(isStalled ? null : glimmerSpeed)` 按位置拆出 ref、time，让终端 UI 组件 use Shimmer Animation分别处理这些返回值。
  const [ref, time] = useAnimationFrame(isStalled ? null : glimmerSpeed)
  // messageWidth 消息数据保存`useMemo`，供终端渲染后续处理使用。
  const messageWidth = useMemo(() => stringWidth(message), [message])

  // 满足 `isStalled` 时，终端渲染执行该分支。
  if (isStalled) {
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return [ref, -100]
  }

  // cyclePosition保存`Math.floor`，供终端渲染后续处理使用。
  const cyclePosition = Math.floor(time / glimmerSpeed)
  // cycleLength 数量 命名 `messageWidth + 20`，让后续代码直接表达这个值的用途。
  const cycleLength = messageWidth + 20

  // 当 `mode` 匹配 `'requesting'` 时，终端渲染执行对应分支。
  if (mode === 'requesting') {
    // 返回列表结果，保留终端渲染已经排好的条目顺序。
    return [ref, (cyclePosition % cycleLength) - 10]
  }
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [ref, messageWidth + 10 - (cyclePosition % cycleLength)]
}
