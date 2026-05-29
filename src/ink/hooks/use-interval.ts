// 引入 useContext、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useContext, useEffect, useRef, useState } from 'react'
// 复用 ClockContext 终端界面组件，避免在这里重复拼装显示逻辑。
import { ClockContext } from '../components/ClockContext.js'

/**
 * Returns the clock time, updating at the given interval.
 * Subscribes as non-keepAlive — won't keep the clock alive on its own,
 * but updates whenever a keepAlive subscriber (e.g. the spinner)
 * is driving the clock.
 *
 * Use this to drive pure time-based computations (shimmer position,
 * frame index) from the shared clock.
 */
// useAnimationTimer 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAnimationTimer(intervalMs: number): number {
  // clock保存`useContext`，供终端渲染后续处理使用。
  const clock = useContext(ClockContext)
  // 这个回调绑定到 const [time, setTime] = useState(() => clock?.now() ?? 0)，负责终端渲染在该局部场景下的响应。
  const [time, setTime] = useState(() => clock?.now() ?? 0)

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // clock缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!clock) return

    // lastUpdate保存`clock.now`，供终端渲染后续处理使用。
    let lastUpdate = clock.now()

    // onChange封装成回调，供Ink 渲染层 use interval在事件触发或异步步骤中调用。
    const onChange = (): void => {
      // now保存`clock.now`，供终端渲染后续处理使用。
      const now = clock.now()
      // 满足 `now - lastUpdate >= intervalMs` 时，终端渲染执行该分支。
      if (now - lastUpdate >= intervalMs) {
        // lastUpdate更新为 `now`，确保Ink 渲染层后续读取最新状态。
        lastUpdate = now
        // setTime 写入新的状态值，使终端渲染后续读取保持一致。
        setTime(now)
      }
    }

    // 返回 `clock.subscribe(onChange, false)`，作为终端渲染这次计算的结果。
    return clock.subscribe(onChange, false)
  }, [clock, intervalMs])

  // 返回 `time`，作为终端渲染这次计算的结果。
  return time
}

/**
 * Interval hook backed by the shared Clock.
 *
 * Unlike `useInterval` from `usehooks-ts` (which creates its own setInterval),
 * this piggybacks on the single shared clock so all timers consolidate into
 * one wake-up. Pass `null` for intervalMs to pause.
 */
// useInterval 封装Ink 渲染层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useInterval(
  // 这个回调绑定到 callback: () => void,，负责终端渲染在该局部场景下的响应。
  callback: () => void,
  intervalMs: number | null,
): void {
  // callbackRef 引用保存`useRef`，供终端渲染后续处理使用。
  const callbackRef = useRef(callback)
  // current更新为 `callback`，确保Ink 渲染层后续读取最新状态。
  callbackRef.current = callback

  // clock保存`useContext`，供终端渲染后续处理使用。
  const clock = useContext(ClockContext)

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 只有 `!clock || intervalMs === null` 满足时，终端渲染才执行该分支。
    if (!clock || intervalMs === null) return

    // lastUpdate保存`clock.now`，供终端渲染后续处理使用。
    let lastUpdate = clock.now()

    // onChange封装成回调，供Ink 渲染层 use interval在事件触发或异步步骤中调用。
    const onChange = (): void => {
      // now保存`clock.now`，供终端渲染后续处理使用。
      const now = clock.now()
      // 满足 `now - lastUpdate >= intervalMs` 时，终端渲染执行该分支。
      if (now - lastUpdate >= intervalMs) {
        // lastUpdate更新为 `now`，确保Ink 渲染层后续读取最新状态。
        lastUpdate = now
        // 调用 callbackRef.current，触发终端渲染此处需要的副作用。
        callbackRef.current()
      }
    }

    // 返回 `clock.subscribe(onChange, false)`，作为终端渲染这次计算的结果。
    return clock.subscribe(onChange, false)
  }, [clock, intervalMs])
}
