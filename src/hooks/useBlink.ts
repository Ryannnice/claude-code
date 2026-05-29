// 引入 DOMElement、useAnimationFrame、useTerminalFocus，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { type DOMElement, useAnimationFrame, useTerminalFocus } from '../ink.js'

// BLINK_INTERVAL_MS 集合保存`600`，供React hook use Blink后续判断或输出使用。
const BLINK_INTERVAL_MS = 600

/**
 * Hook for synchronized blinking animations that pause when offscreen.
 *
 * Returns a ref to attach to the animated element and the current blink state.
 * All instances blink together because they derive state from the same
 * animation clock. The clock only runs when at least one subscriber is visible.
 * Pauses when the terminal is blurred.
 *
 * @param enabled - Whether blinking is active
 * @returns [ref, isVisible] - Ref to attach to element, true when visible in blink cycle
 *
 * @example
 * function BlinkingDot({ shouldAnimate }) {
 *   const [ref, isVisible] = useBlink(shouldAnimate)
 *   return <Box ref={ref}>{isVisible ? '●' : ' '}</Box>
 * }
 */
// useBlink 封装useBlink的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useBlink(
  enabled: boolean,
  intervalMs: number = BLINK_INTERVAL_MS,
): [ref: (element: DOMElement | null) => void, isVisible: boolean] {
  // focused保存`useTerminalFocus`，供React hook后续处理使用。
  const focused = useTerminalFocus()
  // 从 `useAnimationFrame(enabled && focused ? intervalMs : nul...` 按位置拆出 ref、time，让React hook use Blink分别处理这些返回值。
  const [ref, time] = useAnimationFrame(enabled && focused ? intervalMs : null)

  // 组合条件 `!enabled || !focused` 成立时，React hook 状态流才启用这条专门路径。
  if (!enabled || !focused) return [ref, true]

  // Derive blink state from time - all instances see the same time so they sync
  // isVisible记录 `Math.floor` 是否成立，React hook随后按该结果分支。
  const isVisible = Math.floor(time / intervalMs) % 2 === 0
  // 返回列表结果，保留React hook 状态流已经排好的条目顺序。
  return [ref, isVisible]
}
