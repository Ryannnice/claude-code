// 引入 useContext、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useContext, useEffect, useState } from 'react'
// 复用 ClockContext 终端界面组件，避免在这里重复拼装显示逻辑。
import { ClockContext } from '../components/ClockContext.js'
// 类型依赖 { DOMElement } 来自 ../dom.js，用于校准终端渲染的数据契约。
import type { DOMElement } from '../dom.js'
// 引入 useTerminalViewport，将 ./use-terminal-viewport.js 中已经封装好的能力接到本文件流程里。
import { useTerminalViewport } from './use-terminal-viewport.js'

/**
 * Hook for synchronized animations that pause when offscreen.
 *
 * Returns a ref to attach to the animated element and the current animation time.
 * All instances share the same clock, so animations stay in sync.
 * The clock only runs when at least one keepAlive subscriber exists.
 *
 * Pass `null` to pause — unsubscribes from the clock so no ticks fire.
 * Time freezes at the last value and resumes from the current clock time
 * when a number is passed again.
 *
 * @param intervalMs - How often to update, or null to pause
 * @returns [ref, time] - Ref to attach to element, elapsed time in ms
 *
 * @example
 * function Spinner() {
 *   const [ref, time] = useAnimationFrame(120)
 *   const frame = Math.floor(time / 120) % FRAMES.length
 *   return <Box ref={ref}>{FRAMES[frame]}</Box>
 * }
 *
 * The clock automatically slows when the terminal is blurred,
 * so consumers don't need to handle focus state.
 */
// useAnimationFrame 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAnimationFrame(
  intervalMs: number | null = 16,
): [ref: (element: DOMElement | null) => void, time: number] {
  // clock保存`useContext`，供终端渲染后续处理使用。
  const clock = useContext(ClockContext)
  // 从 `useTerminalViewport()` 按位置拆出 viewportRef、{ isVisible }，让Ink 渲染层 use animation frame分别处理这些返回值。
  const [viewportRef, { isVisible }] = useTerminalViewport()
  // 这个回调绑定到 const [time, setTime] = useState(() => clock?.now() ?? 0)，负责终端渲染在该局部场景下的响应。
  const [time, setTime] = useState(() => clock?.now() ?? 0)

  // active标记Ink 渲染层 use animation frame是否启用对应路径。
  const active = isVisible && intervalMs !== null

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 只有 `!clock || !active` 满足时，终端渲染才执行该分支。
    if (!clock || !active) return

    // lastUpdate保存`clock.now`，供终端渲染后续处理使用。
    let lastUpdate = clock.now()

    // onChange封装成回调，供Ink 渲染层 use animation frame在事件触发或异步步骤中调用。
    const onChange = (): void => {
      // now保存`clock.now`，供终端渲染后续处理使用。
      const now = clock.now()
      // 满足 `now - lastUpdate >= intervalMs!` 时，终端渲染执行该分支。
      if (now - lastUpdate >= intervalMs!) {
        // lastUpdate更新为 `now`，确保Ink 渲染层后续读取最新状态。
        lastUpdate = now
        // setTime 写入新的状态值，使终端渲染后续读取保持一致。
        setTime(now)
      }
    }

    // keepAlive: true — visible animations drive the clock
    // 返回 `clock.subscribe(onChange, true)`，作为终端渲染这次计算的结果。
    return clock.subscribe(onChange, true)
  }, [clock, intervalMs, active])

  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [viewportRef, time]
}
