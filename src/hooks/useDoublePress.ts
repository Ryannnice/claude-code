// Creates a function that calls one function on the first call and another
// function on the second call within a certain timeout

// 引入 useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useRef } from 'react'

// DOUBLE_PRESS_TIMEOUT_MS 集合保存`800`，供React hook use Double...后续判断或输出使用。
export const DOUBLE_PRESS_TIMEOUT_MS = 800

// useDoublePress 封装useDoublePress的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDoublePress(
  // 这个回调绑定到 setPending: (pending: boolean) => void,，负责React hook 状态流在该局部场景下的响应。
  setPending: (pending: boolean) => void,
  // 这个回调绑定到 onDoublePress: () => void,，负责React hook 状态流在该局部场景下的响应。
  onDoublePress: () => void,
  onFirstPress?: () => void,
): () => void {
  // lastPressRef 引用保存 hook 状态，让React hook use Double...跨渲染复用同一个容器。
  const lastPressRef = useRef<number>(0)
  // timeoutRef 引用保存 hook 状态，让React hook use Double...跨渲染复用同一个容器。
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // clearTimeoutSafe保存`useCallback`，供React hook后续处理使用。
  const clearTimeoutSafe = useCallback(() => {
    // 满足 `timeoutRef.current` 时，React hook执行该分支。
    if (timeoutRef.current) {
      // 调用 clearTimeout，触发React hook此处需要的副作用。
      clearTimeout(timeoutRef.current)
      // current更新为 `undefined`，确保useDoublePress后续读取最新状态。
      timeoutRef.current = undefined
    }
  }, [])

  // Cleanup timeout on unmount
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 调用 clearTimeoutSafe，触发React hook此处需要的副作用。
      clearTimeoutSafe()
    }
  }, [clearTimeoutSafe])

  // 返回 `useCallback(() => {`，作为React hook 状态流这次计算的结果。
  return useCallback(() => {
    // now记录时间`Date.now`，供React hook后续处理使用。
    const now = Date.now()
    // timeSinceLastPress 集合保存`now - lastPressRef.current`，供后续判断或组装使用。
    const timeSinceLastPress = now - lastPressRef.current
    // isDoublePress 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isDoublePress =
      timeSinceLastPress <= DOUBLE_PRESS_TIMEOUT_MS &&
      timeoutRef.current !== undefined

    // 满足 `isDoublePress` 时，React hook执行该分支。
    if (isDoublePress) {
      // Double press detected
      // 调用 clearTimeoutSafe，触发React hook此处需要的副作用。
      clearTimeoutSafe()
      // setPending 写入新的状态值，使React hook 状态流后续读取保持一致。
      setPending(false)
      // 调用 onDoublePress，触发React hook此处需要的副作用。
      onDoublePress()
    } else {
      // First press
      // 调用 onFirstPress?.()，完成这一处局部操作。
      onFirstPress?.()
      // setPending 写入新的状态值，使React hook 状态流后续读取保持一致。
      setPending(true)

      // Clear any existing timeout and set new one
      // 调用 clearTimeoutSafe，触发React hook此处需要的副作用。
      clearTimeoutSafe()
      // current更新为 `setTimeout(`，确保useDoublePress后续读取最新状态。
      timeoutRef.current = setTimeout(
        // 这个回调绑定到 (setPending, timeoutRef) => {，负责React hook 状态流在该局部场景下的响应。
        (setPending, timeoutRef) => {
          // setPending 写入新的状态值，使React hook 状态流后续读取保持一致。
          setPending(false)
          // current更新为 `undefined`，确保useDoublePress后续读取最新状态。
          timeoutRef.current = undefined
        },
        DOUBLE_PRESS_TIMEOUT_MS,
        setPending,
        timeoutRef,
      )
    }

    // current更新为 `now`，确保useDoublePress后续读取最新状态。
    lastPressRef.current = now
  }, [setPending, onDoublePress, onFirstPress, clearTimeoutSafe])
}
