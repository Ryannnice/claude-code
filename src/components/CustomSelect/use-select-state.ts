// 引入 useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useState } from 'react'
// 类型依赖 { OptionWithDescription } 来自 ./select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './select.js'
// 引入 useSelectNavigation，将 ./use-select-navigation.js 中已经封装好的能力接到本文件流程里。
import { useSelectNavigation } from './use-select-navigation.js'

// UseSelectStateProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseSelectStateProps<T> = {
  /**
   * Number of items to display.
   *
   * @default 5
   */
  visibleOptionCount?: number

  /**
   * Options.
   */
  options: OptionWithDescription<T>[]

  /**
   * Initially selected option's value.
   */
  defaultValue?: T

  /**
   * Callback for selecting an option.
   */
  // 这个回调绑定到 onChange?: (value: T) => void，负责终端渲染在该局部场景下的响应。
  onChange?: (value: T) => void

  /**
   * Callback for canceling the select.
   */
  // 这个回调绑定到 onCancel?: () => void，负责终端渲染在该局部场景下的响应。
  onCancel?: () => void

  /**
   * Callback for focusing an option.
   */
  // 这个回调绑定到 onFocus?: (value: T) => void，负责终端渲染在该局部场景下的响应。
  onFocus?: (value: T) => void

  /**
   * Value to focus
   */
  focusValue?: T
}

// SelectState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type SelectState<T> = {
  /**
   * Value of the currently focused option.
   */
  focusedValue: T | undefined

  /**
   * 1-based index of the focused option in the full list.
   * Returns 0 if no option is focused.
   */
  focusedIndex: number

  /**
   * Index of the first visible option.
   */
  visibleFromIndex: number

  /**
   * Index of the last visible option.
   */
  visibleToIndex: number

  /**
   * Value of the selected option.
   */
  value: T | undefined

  /**
   * All options.
   */
  options: OptionWithDescription<T>[]

  /**
   * Visible options.
   */
  visibleOptions: Array<OptionWithDescription<T> & { index: number }>

  /**
   * Whether the focused option is an input type.
   */
  isInInput: boolean

  /**
   * Focus next option and scroll the list down, if needed.
   */
  // 这个回调绑定到 focusNextOption: () => void，负责终端渲染在该局部场景下的响应。
  focusNextOption: () => void

  /**
   * Focus previous option and scroll the list up, if needed.
   */
  // 这个回调绑定到 focusPreviousOption: () => void，负责终端渲染在该局部场景下的响应。
  focusPreviousOption: () => void

  /**
   * Focus next page and scroll the list down by a page.
   */
  // 这个回调绑定到 focusNextPage: () => void，负责终端渲染在该局部场景下的响应。
  focusNextPage: () => void

  /**
   * Focus previous page and scroll the list up by a page.
   */
  // 这个回调绑定到 focusPreviousPage: () => void，负责终端渲染在该局部场景下的响应。
  focusPreviousPage: () => void

  /**
   * Focus a specific option by value.
   */
  // 这个回调绑定到 focusOption: (value: T | undefined) => void，负责终端渲染在该局部场景下的响应。
  focusOption: (value: T | undefined) => void

  /**
   * Select currently focused option.
   */
  // 这个回调绑定到 selectFocusedOption: () => void，负责终端渲染在该局部场景下的响应。
  selectFocusedOption: () => void

  /**
   * Callback for selecting an option.
   */
  // 这个回调绑定到 onChange?: (value: T) => void，负责终端渲染在该局部场景下的响应。
  onChange?: (value: T) => void

  /**
   * Callback for canceling the select.
   */
  // 这个回调绑定到 onCancel?: () => void，负责终端渲染在该局部场景下的响应。
  onCancel?: () => void
}

// useSelectState 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSelectState<T>({
  visibleOptionCount = 5,
  options,
  defaultValue,
  onChange,
  onCancel,
  onFocus,
  focusValue,
}: UseSelectStateProps<T>): SelectState<T> {
  // 取值 由 React state 持有，setValue 会在用户操作或异步结果返回时触发刷新。
  const [value, setValue] = useState<T | undefined>(defaultValue)

  // navigation读取 hook 状态，供终端 UI use select state本轮渲染使用。
  const navigation = useSelectNavigation<T>({
    visibleOptionCount,
    options,
    initialFocusValue: undefined,
    onFocus,
    focusValue,
  })

  // selectFocusedOption保存`useCallback`，供终端渲染后续处理使用。
  const selectFocusedOption = useCallback(() => {
    // setValue 写入新的状态值，使终端渲染后续读取保持一致。
    setValue(navigation.focusedValue)
  }, [navigation.focusedValue])

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...navigation,
    value,
    selectFocusedOption,
    onChange,
    onCancel,
  }
}
