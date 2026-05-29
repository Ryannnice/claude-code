// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react'

// HINT_DISPLAY_DURATION_MS 集合 命名 `5000`，让后续代码直接表达这个值的用途。
const HINT_DISPLAY_DURATION_MS = 5000

// hasShownThisSession 会话数据标记终端渲染提示输入组件 use Show Fast Icon Hint是否启用对应路径。
let hasShownThisSession = false

/**
 * Hook to manage the /fast hint display next to the fast icon.
 * Shows the hint for 5 seconds once per session.
 */
// useShowFastIconHint 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useShowFastIconHint(showFastIcon: boolean): boolean {
  // showHint 由 React state 持有，setShowHint 会在用户操作或异步结果返回时触发刷新。
  const [showHint, setShowHint] = useState(false)

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 只有 `hasShownThisSession || !showFastIcon` 满足时，终端渲染才执行该分支。
    if (hasShownThisSession || !showFastIcon) {
      // 提示输入组件 use Show Fast Icon Hint在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // hasShownThisSession 会话数据更新为 `true`，确保提示输入组件后续读取最新状态。
    hasShownThisSession = true
    // setShowHint 写入新的状态值，使终端渲染后续读取保持一致。
    setShowHint(true)

    // timer保存`setTimeout`，供终端渲染后续处理使用。
    const timer = setTimeout(setShowHint, HINT_DISPLAY_DURATION_MS, false)

    // 返回 `() => {`，作为终端渲染这次计算的结果。
    return () => {
      // 调用 clearTimeout，触发终端渲染此处需要的副作用。
      clearTimeout(timer)
      // setShowHint 写入新的状态值，使终端渲染后续读取保持一致。
      setShowHint(false)
    }
  }, [showFastIcon])

  // 返回 `showHint`，作为终端渲染这次计算的结果。
  return showHint
}
