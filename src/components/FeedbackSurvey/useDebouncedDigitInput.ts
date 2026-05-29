// 引入 useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef } from 'react'
// 复用 normalizeFullWidthDigits 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { normalizeFullWidthDigits } from '../../utils/stringUtils.js'

// Delay before accepting a digit as a response, to prevent accidental
// submissions when users start messages with numbers (e.g., numbered lists).
// Short enough to feel instant for intentional presses, long enough to
// cancel when the user types more characters.
// DEFAULT_DEBOUNCE_MS 集合 命名 `400`，让后续代码直接表达这个值的用途。
const DEFAULT_DEBOUNCE_MS = 400

/**
 * Detects when the user types a single valid digit into the prompt input,
 * debounces to avoid accidental submissions (e.g., "1. First item"),
 * trims the digit from the input, and fires a callback.
 *
 * Used by survey components that accept numeric responses typed directly
 * into the main prompt input.
 */
// useDebouncedDigitInput 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useDebouncedDigitInput<T extends string = string>({
  inputValue,
  setInputValue,
  isValidDigit,
  onDigit,
  enabled = true,
  once = false,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: {
  inputValue: string
  // 这个回调绑定到 setInputValue: (value: string) => void，负责终端渲染在该局部场景下的响应。
  setInputValue: (value: string) => void
  // 这个回调绑定到 isValidDigit: (char: string) => char is T，负责终端渲染在该局部场景下的响应。
  isValidDigit: (char: string) => char is T
  // 这个回调绑定到 onDigit: (digit: T) => void，负责终端渲染在该局部场景下的响应。
  onDigit: (digit: T) => void
  enabled?: boolean
  once?: boolean
  debounceMs?: number
}): void {
  // initialInputValue保存`useRef`，供终端渲染后续处理使用。
  const initialInputValue = useRef(inputValue)
  // hasTriggeredRef 引用记录 `useRef` 是否成立，终端渲染随后按该结果分支。
  const hasTriggeredRef = useRef(false)
  // debounceRef 引用保存 hook 状态，让终端 UI use Debounced Digit ...跨渲染复用同一个容器。
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Latest-ref pattern so callers can pass inline callbacks without causing
  // the effect to re-run (which would reset the debounce timer every render).
  // callbacksRef 引用保存`useRef`，供终端渲染后续处理使用。
  const callbacksRef = useRef({ setInputValue, isValidDigit, onDigit })
  // current更新为 `{ setInputValue, isValidDigit, onDigit }`，确保终端 UI后续读取最新状态。
  callbacksRef.current = { setInputValue, isValidDigit, onDigit }

  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 只有 `!enabled || (once && hasTriggeredRef.current)` 满足时，终端渲染才执行该分支。
    if (!enabled || (once && hasTriggeredRef.current)) {
      // 终端 UI 组件 use Debounced Digit Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `debounceRef.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (debounceRef.current !== null) {
      // 调用 clearTimeout，触发终端渲染此处需要的副作用。
      clearTimeout(debounceRef.current)
      // current更新为 `null`，确保终端 UI后续读取最新状态。
      debounceRef.current = null
    }

    // `inputValue` 与 `initialInputValue.current` 不一致时刷新派生状态，避免使用过期结果。
    if (inputValue !== initialInputValue.current) {
      // lastChar保存`normalizeFullWidthDigits`，供终端渲染后续处理使用。
      const lastChar = normalizeFullWidthDigits(inputValue.slice(-1))
      // 满足 `callbacksRef.current.isValidDigit(lastChar)` 时，终端渲染执行该分支。
      if (callbacksRef.current.isValidDigit(lastChar)) {
        // trimmed格式化`inputValue.slice`，供终端渲染后续处理使用。
        const trimmed = inputValue.slice(0, -1)
        // current更新为 `setTimeout(`，确保终端 UI后续读取最新状态。
        debounceRef.current = setTimeout(
          // 这个回调绑定到 (debounceRef, hasTriggeredRef, callbacksRef, trimmed, lastChar) => {，负责终端渲染在该局部场景下的响应。
          (debounceRef, hasTriggeredRef, callbacksRef, trimmed, lastChar) => {
            // current更新为 `null`，确保终端 UI后续读取最新状态。
            debounceRef.current = null
            // current更新为 `true`，确保终端 UI后续读取最新状态。
            hasTriggeredRef.current = true
            // callbacksRef.current.setInputValue 写入新的状态值，使终端渲染后续读取保持一致。
            callbacksRef.current.setInputValue(trimmed)
            // 调用 callbacksRef.current.onDigit，触发终端渲染此处需要的副作用。
            callbacksRef.current.onDigit(lastChar)
          },
          debounceMs,
          debounceRef,
          hasTriggeredRef,
          callbacksRef,
          trimmed,
          lastChar,
        )
      }
    }

    // 返回 `() => {`，作为终端渲染这次计算的结果。
    return () => {
      // `debounceRef.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (debounceRef.current !== null) {
        // 调用 clearTimeout，触发终端渲染此处需要的副作用。
        clearTimeout(debounceRef.current)
        // current更新为 `null`，确保终端 UI后续读取最新状态。
        debounceRef.current = null
      }
    }
  }, [inputValue, enabled, once, debounceMs])
}
