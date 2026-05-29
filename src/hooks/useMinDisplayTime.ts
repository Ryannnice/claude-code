// 本文件集中定义模块常量、转发导出或副作用入口，供项目其他部分复用。
import { useEffect, useRef, useState } from 'react'

/**
 * Throttles a value so each distinct value stays visible for at least `minMs`.
 * Prevents fast-cycling progress text from flickering past before it's readable.
 *
 * Unlike debounce (wait for quiet) or throttle (limit rate), this guarantees
 * each value gets its minimum screen time before being replaced.
 */
// useMinDisplayTime 封装useMinDisplayTime的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMinDisplayTime<T>(value: T, minMs: number): T {
  // displayed 由 React state 持有，setDisplayed 会在用户操作或异步结果返回时触发刷新。
  const [displayed, setDisplayed] = useState(value)
  // lastShownAtRef 引用保存`useRef`，供React hook后续处理使用。
  const lastShownAtRef = useRef(0)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // elapsed记录时间`Date.now`，供React hook后续处理使用。
    const elapsed = Date.now() - lastShownAtRef.current
    // 满足 `elapsed >= minMs` 时，React hook执行该分支。
    if (elapsed >= minMs) {
      // current更新为 `Date.now()`，确保useMinDisplayTime后续读取最新状态。
      lastShownAtRef.current = Date.now()
      // setDisplayed 写入新的状态值，使React hook 状态流后续读取保持一致。
      setDisplayed(value)
      // React hook use Min Display Time在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // timer保存`setTimeout`，供React hook后续处理使用。
    const timer = setTimeout(
      // 这个回调绑定到 (shownAtRef, setFn, v) => {，负责React hook 状态流在该局部场景下的响应。
      (shownAtRef, setFn, v) => {
        // current更新为 `Date.now()`，确保useMinDisplayTime后续读取最新状态。
        shownAtRef.current = Date.now()
        // setFn 写入新的状态值，使React hook 状态流后续读取保持一致。
        setFn(v)
      },
      minMs - elapsed,
      lastShownAtRef,
      setDisplayed,
      value,
    )
    // 返回 `() => clearTimeout(timer)`，作为React hook 状态流这次计算的结果。
    return () => clearTimeout(timer)
  }, [value, minMs])

  // 返回 `displayed`，作为React hook 状态流这次计算的结果。
  return displayed
}
