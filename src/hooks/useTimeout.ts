// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react'

// useTimeout 封装useTimeout的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTimeout(delay: number, resetTrigger?: number): boolean {
  // isElapsed 由 React state 持有，setIsElapsed 会在用户操作或异步结果返回时触发刷新。
  const [isElapsed, setIsElapsed] = useState(false)

  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // setIsElapsed 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsElapsed(false)
    // timer保存`setTimeout`，供React hook后续处理使用。
    const timer = setTimeout(setIsElapsed, delay, true)

    // 返回 `() => clearTimeout(timer)`，作为React hook 状态流这次计算的结果。
    return () => clearTimeout(timer)
  }, [delay, resetTrigger])

  // 返回 `isElapsed`，作为React hook 状态流这次计算的结果。
  return isElapsed
}
