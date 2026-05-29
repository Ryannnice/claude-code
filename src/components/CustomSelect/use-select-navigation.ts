// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
// 引入 isDeepStrictEqual，将 util 中已经封装好的能力接到本文件流程里。
import { isDeepStrictEqual } from 'util'
// 引入 OptionMap，将 ./option-map.js 中已经封装好的能力接到本文件流程里。
import OptionMap from './option-map.js'
// 类型依赖 { OptionWithDescription } 来自 ./select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './select.js'

// State 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type State<T> = {
  /**
   * Map where key is option's value and value is option's index.
   */
  optionMap: OptionMap<T>

  /**
   * Number of visible options.
   */
  visibleOptionCount: number

  /**
   * Value of the currently focused option.
   */
  focusedValue: T | undefined

  /**
   * Index of the first visible option.
   */
  visibleFromIndex: number

  /**
   * Index of the last visible option.
   */
  visibleToIndex: number
}

// Action 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Action<T> =
  | FocusNextOptionAction
  | FocusPreviousOptionAction
  | FocusNextPageAction
  | FocusPreviousPageAction
  | SetFocusAction<T>
  | ResetAction<T>

// SetFocusAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type SetFocusAction<T> = {
  type: 'set-focus'
  value: T
}

// FocusNextOptionAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FocusNextOptionAction = {
  type: 'focus-next-option'
}

// FocusPreviousOptionAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FocusPreviousOptionAction = {
  type: 'focus-previous-option'
}

// FocusNextPageAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FocusNextPageAction = {
  type: 'focus-next-page'
}

// FocusPreviousPageAction 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FocusPreviousPageAction = {
  type: 'focus-previous-page'
}

type ResetAction<T> = {
  type: 'reset'
  state: State<T>
}

// reducer封装成回调，供终端 UI use select navigation在事件触发或异步步骤中调用。
const reducer = <T>(state: State<T>, action: Action<T>): State<T> => {
  // 按照 action.type 的取值选择终端渲染的具体处理分支。
  switch (action.type) {
    case 'focus-next-option': {
      // 满足 `state.focusedValue === undefined` 时，终端渲染执行该分支。
      if (state.focusedValue === undefined) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // item读取`optionMap.get`，供终端渲染后续处理使用。
      const item = state.optionMap.get(state.focusedValue)

      // item缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!item) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Wrap to first item if at the end
      // next标记终端 UI use select navigation是否启用对应路径。
      const next = item.next || state.optionMap.first

      // next缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!next) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // When wrapping to first, reset viewport to start
      // 只有 `!item.next && next === state.optionMap.first` 满足时，终端渲染才执行该分支。
      if (!item.next && next === state.optionMap.first) {
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...state,
          focusedValue: next.value,
          visibleFromIndex: 0,
          visibleToIndex: state.visibleOptionCount,
        }
      }

      // needsToScroll标记终端 UI use select navigation是否启用对应路径。
      const needsToScroll = next.index >= state.visibleToIndex

      // needsToScroll缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!needsToScroll) {
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...state,
          focusedValue: next.value,
        }
      }

      // nextVisibleToIndex 索引保存`Math.min`，供终端渲染后续处理使用。
      const nextVisibleToIndex = Math.min(
        state.optionMap.size,
        state.visibleToIndex + 1,
      )

      // nextVisibleFromIndex 索引 命名 `nextVisibleToIndex - state.visibleOptionCount`，让后续代码直接表达这个值的用途。
      const nextVisibleFromIndex = nextVisibleToIndex - state.visibleOptionCount

      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        focusedValue: next.value,
        visibleFromIndex: nextVisibleFromIndex,
        visibleToIndex: nextVisibleToIndex,
      }
    }

    case 'focus-previous-option': {
      // 满足 `state.focusedValue === undefined` 时，终端渲染执行该分支。
      if (state.focusedValue === undefined) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // item读取`optionMap.get`，供终端渲染后续处理使用。
      const item = state.optionMap.get(state.focusedValue)

      // item缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!item) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Wrap to last item if at the beginning
      // previous 集合标记终端 UI use select navigation是否启用对应路径。
      const previous = item.previous || state.optionMap.last

      // previous 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!previous) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // When wrapping to last, reset viewport to end
      // 只有 `!item.previous && previous === state.optionMap.la` 满足时，终端渲染才执行该分支。
      if (!item.previous && previous === state.optionMap.last) {
        // nextVisibleToIndex 索引统计`state.optionMap.size` 整理出中间结果，供终端 UI use select navigation后续步骤使用。
        const nextVisibleToIndex = state.optionMap.size
        // nextVisibleFromIndex 索引保存`Math.max`，供终端渲染后续处理使用。
        const nextVisibleFromIndex = Math.max(
          0,
          nextVisibleToIndex - state.visibleOptionCount,
        )
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...state,
          focusedValue: previous.value,
          visibleFromIndex: nextVisibleFromIndex,
          visibleToIndex: nextVisibleToIndex,
        }
      }

      // needsToScroll标记终端 UI use select navigation是否启用对应路径。
      const needsToScroll = previous.index <= state.visibleFromIndex

      // needsToScroll缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!needsToScroll) {
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...state,
          focusedValue: previous.value,
        }
      }

      // nextVisibleFromIndex 索引保存`Math.max`，供终端渲染后续处理使用。
      const nextVisibleFromIndex = Math.max(0, state.visibleFromIndex - 1)

      // nextVisibleToIndex 索引保存`nextVisibleFromIndex + state.visibleOptionCount`，供后续判断或组装使用。
      const nextVisibleToIndex = nextVisibleFromIndex + state.visibleOptionCount

      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        focusedValue: previous.value,
        visibleFromIndex: nextVisibleFromIndex,
        visibleToIndex: nextVisibleToIndex,
      }
    }

    case 'focus-next-page': {
      // 满足 `state.focusedValue === undefined` 时，终端渲染执行该分支。
      if (state.focusedValue === undefined) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // item读取`optionMap.get`，供终端渲染后续处理使用。
      const item = state.optionMap.get(state.focusedValue)

      // item缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!item) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Move by a full page (visibleOptionCount items)
      // targetIndex 索引保存`Math.min`，供终端渲染后续处理使用。
      const targetIndex = Math.min(
        state.optionMap.size - 1,
        item.index + state.visibleOptionCount,
      )

      // Find the item at the target index
      // targetItem保存`state.optionMap.first`，供终端 UI use select navigation后续判断或输出使用。
      let targetItem = state.optionMap.first
      // while 使用 targetItem && targetItem.index < targetIndex 完成终端渲染里的对应操作。
      while (targetItem && targetItem.index < targetIndex) {
        // 满足 `targetItem.next` 时，终端渲染执行该分支。
        if (targetItem.next) {
          // targetItem更新为 `targetItem.next`，确保终端 UI后续读取最新状态。
          targetItem = targetItem.next
        } else {
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        }
      }

      // targetItem缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!targetItem) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Update the visible range to include the new focused item
      // nextVisibleToIndex 索引保存`Math.min`，供终端渲染后续处理使用。
      const nextVisibleToIndex = Math.min(
        state.optionMap.size,
        targetItem.index + 1,
      )
      // nextVisibleFromIndex 索引保存`Math.max`，供终端渲染后续处理使用。
      const nextVisibleFromIndex = Math.max(
        0,
        nextVisibleToIndex - state.visibleOptionCount,
      )

      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        focusedValue: targetItem.value,
        visibleFromIndex: nextVisibleFromIndex,
        visibleToIndex: nextVisibleToIndex,
      }
    }

    case 'focus-previous-page': {
      // 满足 `state.focusedValue === undefined` 时，终端渲染执行该分支。
      if (state.focusedValue === undefined) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // item读取`optionMap.get`，供终端渲染后续处理使用。
      const item = state.optionMap.get(state.focusedValue)

      // item缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!item) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Move by a full page (visibleOptionCount items)
      // targetIndex 索引保存`Math.max`，供终端渲染后续处理使用。
      const targetIndex = Math.max(0, item.index - state.visibleOptionCount)

      // Find the item at the target index
      // targetItem保存`state.optionMap.first`，供终端 UI use select navigation后续判断或输出使用。
      let targetItem = state.optionMap.first
      // while 使用 targetItem && targetItem.index < targetIndex 完成终端渲染里的对应操作。
      while (targetItem && targetItem.index < targetIndex) {
        // 满足 `targetItem.next` 时，终端渲染执行该分支。
        if (targetItem.next) {
          // targetItem更新为 `targetItem.next`，确保终端 UI后续读取最新状态。
          targetItem = targetItem.next
        } else {
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break
        }
      }

      // targetItem缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!targetItem) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Update the visible range to include the new focused item
      // nextVisibleFromIndex 索引保存`Math.max`，供终端渲染后续处理使用。
      const nextVisibleFromIndex = Math.max(0, targetItem.index)
      // nextVisibleToIndex 索引保存`Math.min`，供终端渲染后续处理使用。
      const nextVisibleToIndex = Math.min(
        state.optionMap.size,
        nextVisibleFromIndex + state.visibleOptionCount,
      )

      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        focusedValue: targetItem.value,
        visibleFromIndex: nextVisibleFromIndex,
        visibleToIndex: nextVisibleToIndex,
      }
    }

    case 'reset': {
      // 返回 `action.state`，作为终端渲染这次计算的结果。
      return action.state
    }

    case 'set-focus': {
      // Early return if already focused on this value
      // 满足 `state.focusedValue === action.value` 时，终端渲染执行该分支。
      if (state.focusedValue === action.value) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // item读取`optionMap.get`，供终端渲染后续处理使用。
      const item = state.optionMap.get(action.value)
      // item缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!item) {
        // 返回 `state`，作为终端渲染这次计算的结果。
        return state
      }

      // Check if the item is already in view
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        item.index >= state.visibleFromIndex &&
        item.index < state.visibleToIndex
      ) {
        // Already visible, just update focus
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...state,
          focusedValue: action.value,
        }
      }

      // Need to scroll to make the item visible
      // Scroll as little as possible - put item at edge of viewport
      // nextVisibleFromIndex 索引 先占位，稍后的条件分支会根据实际输入补齐它。
      let nextVisibleFromIndex: number
      // nextVisibleToIndex 索引 先占位，稍后的条件分支会根据实际输入补齐它。
      let nextVisibleToIndex: number

      // 满足 `item.index < state.visibleFromIndex` 时，终端渲染执行该分支。
      if (item.index < state.visibleFromIndex) {
        // Item is above viewport - scroll up to put it at the top
        // nextVisibleFromIndex 索引更新为 `item.index`，确保终端 UI后续读取最新状态。
        nextVisibleFromIndex = item.index
        // nextVisibleToIndex 索引更新为 `Math.min(`，确保终端 UI后续读取最新状态。
        nextVisibleToIndex = Math.min(
          state.optionMap.size,
          nextVisibleFromIndex + state.visibleOptionCount,
        )
      } else {
        // Item is below viewport - scroll down to put it at the bottom
        // nextVisibleToIndex 索引更新为 `Math.min(state.optionMap.size, item.index + 1)`，确保终端 UI后续读取最新状态。
        nextVisibleToIndex = Math.min(state.optionMap.size, item.index + 1)
        // nextVisibleFromIndex 索引更新为 `Math.max(`，确保终端 UI后续读取最新状态。
        nextVisibleFromIndex = Math.max(
          0,
          nextVisibleToIndex - state.visibleOptionCount,
        )
      }

      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        focusedValue: action.value,
        visibleFromIndex: nextVisibleFromIndex,
        visibleToIndex: nextVisibleToIndex,
      }
    }
  }
}

// UseSelectNavigationProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseSelectNavigationProps<T> = {
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
   * Initially focused option's value.
   */
  initialFocusValue?: T

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

// SelectNavigation 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type SelectNavigation<T> = {
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
}

// createDefaultState 状态保存`<T>({`，供后续判断或组装使用。
const createDefaultState = <T>({
  visibleOptionCount: customVisibleOptionCount,
  options,
  initialFocusValue,
  currentViewport,
}: Pick<UseSelectNavigationProps<T>, 'visibleOptionCount' | 'options'> & {
  initialFocusValue?: T
  currentViewport?: { visibleFromIndex: number; visibleToIndex: number }
}): State<T> => {
  // visibleOptionCount 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const visibleOptionCount =
    typeof customVisibleOptionCount === 'number'
      ? Math.min(customVisibleOptionCount, options.length)
      : options.length

  // optionMap构建`new OptionMap<T>(options)` 整理出中间结果，供终端 UI use select navigation后续步骤使用。
  const optionMap = new OptionMap<T>(options)
  // focusedItem 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const focusedItem =
    initialFocusValue !== undefined && optionMap.get(initialFocusValue)
  // focusedValue保存`focusedItem ? initialFocusValue : optionMap.first?.value`，供终端 UI use select navigation后续判断或输出使用。
  const focusedValue = focusedItem ? initialFocusValue : optionMap.first?.value

  // visibleFromIndex 索引保存`0`，供终端 UI use select navigation后续判断或输出使用。
  let visibleFromIndex = 0
  // visibleToIndex 索引 命名 `visibleOptionCount`，让后续代码直接表达这个值的用途。
  let visibleToIndex = visibleOptionCount

  // When there's a valid focused item, adjust viewport to show it
  // 满足 `focusedItem` 时，终端渲染执行该分支。
  if (focusedItem) {
    // focusedIndex 索引保存`focusedItem.index`，供终端 UI use select navigation后续判断或输出使用。
    const focusedIndex = focusedItem.index

    // 满足 `currentViewport` 时，终端渲染执行该分支。
    if (currentViewport) {
      // If focused item is already in the current viewport range, try to preserve it
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        focusedIndex >= currentViewport.visibleFromIndex &&
        focusedIndex < currentViewport.visibleToIndex
      ) {
        // Keep the same viewport if it's valid
        // visibleFromIndex 索引更新为 `currentViewport.visibleFromIndex`，确保终端 UI后续读取最新状态。
        visibleFromIndex = currentViewport.visibleFromIndex
        // visibleToIndex 索引更新为 `Math.min(`，确保终端 UI后续读取最新状态。
        visibleToIndex = Math.min(
          optionMap.size,
          currentViewport.visibleToIndex,
        )
      } else {
        // Need to adjust viewport to show focused item
        // Use minimal scrolling - put item at edge of viewport
        // 满足 `focusedIndex < currentViewport.visibleFromIndex` 时，终端渲染执行该分支。
        if (focusedIndex < currentViewport.visibleFromIndex) {
          // Item is above current viewport - scroll up to put it at the top
          // visibleFromIndex 索引更新为 `focusedIndex`，确保终端 UI后续读取最新状态。
          visibleFromIndex = focusedIndex
          // visibleToIndex 索引更新为 `Math.min(`，确保终端 UI后续读取最新状态。
          visibleToIndex = Math.min(
            optionMap.size,
            visibleFromIndex + visibleOptionCount,
          )
        } else {
          // Item is below current viewport - scroll down to put it at the bottom
          // visibleToIndex 索引更新为 `Math.min(optionMap.size, focusedIndex + 1)`，确保终端 UI后续读取最新状态。
          visibleToIndex = Math.min(optionMap.size, focusedIndex + 1)
          // visibleFromIndex 索引更新为 `Math.max(0, visibleToIndex - visibleOptionCount)`，确保终端 UI后续读取最新状态。
          visibleFromIndex = Math.max(0, visibleToIndex - visibleOptionCount)
        }
      }
    // 终端 UI 组件 use select navigation在这里处理 `} else if (focusedIndex >= visibleOptionCount) {`，完成这一小步状态转换。
    } else if (focusedIndex >= visibleOptionCount) {
      // No current viewport but focused item is outside default viewport
      // Scroll to show the focused item at the bottom of the viewport
      // visibleToIndex 索引更新为 `Math.min(optionMap.size, focusedIndex + 1)`，确保终端 UI后续读取最新状态。
      visibleToIndex = Math.min(optionMap.size, focusedIndex + 1)
      // visibleFromIndex 索引更新为 `Math.max(0, visibleToIndex - visibleOptionCount)`，确保终端 UI后续读取最新状态。
      visibleFromIndex = Math.max(0, visibleToIndex - visibleOptionCount)
    }

    // Ensure viewport bounds are valid
    // visibleFromIndex 索引更新为 `Math.max(`，确保终端 UI后续读取最新状态。
    visibleFromIndex = Math.max(
      0,
      Math.min(visibleFromIndex, optionMap.size - 1),
    )
    // visibleToIndex 索引更新为 `Math.min(`，确保终端 UI后续读取最新状态。
    visibleToIndex = Math.min(
      optionMap.size,
      Math.max(visibleOptionCount, visibleToIndex),
    )
  }

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    optionMap,
    visibleOptionCount,
    focusedValue,
    visibleFromIndex,
    visibleToIndex,
  }
}

// useSelectNavigation 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSelectNavigation<T>({
  visibleOptionCount = 5,
  options,
  initialFocusValue,
  onFocus,
  focusValue,
}: UseSelectNavigationProps<T>): SelectNavigation<T> {
  // 从 `useReducer(` 按位置拆出 state、dispatch，让终端 UI 组件 use select navigation分别处理这些返回值。
  const [state, dispatch] = useReducer(
    reducer<T>,
    {
      visibleOptionCount,
      options,
      initialFocusValue: focusValue || initialFocusValue,
    } as Parameters<typeof createDefaultState<T>>[0],
    createDefaultState<T>,
  )

  // Store onFocus in a ref to avoid re-running useEffect when callback changes
  // onFocusRef 引用保存`useRef`，供终端渲染后续处理使用。
  const onFocusRef = useRef(onFocus)
  // current更新为 `onFocus`，确保终端 UI后续读取最新状态。
  onFocusRef.current = onFocus

  // lastOptions 集合 由 React state 持有，setLastOptions 会在用户操作或异步结果返回时触发刷新。
  const [lastOptions, setLastOptions] = useState(options)

  // `options` 与 `lastOptions && !isDeepStrictEqu...` 不一致时刷新派生状态，避免使用过期结果。
  if (options !== lastOptions && !isDeepStrictEqual(options, lastOptions)) {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({
      type: 'reset',
      state: createDefaultState({
        visibleOptionCount,
        options,
        initialFocusValue:
          focusValue ?? state.focusedValue ?? initialFocusValue,
        currentViewport: {
          visibleFromIndex: state.visibleFromIndex,
          visibleToIndex: state.visibleToIndex,
        },
      }),
    })

    // setLastOptions 写入新的状态值，使终端渲染后续读取保持一致。
    setLastOptions(options)
  }

  // focusNextOption保存`useCallback`，供终端渲染后续处理使用。
  const focusNextOption = useCallback(() => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({
      type: 'focus-next-option',
    })
  }, [])

  // focusPreviousOption保存`useCallback`，供终端渲染后续处理使用。
  const focusPreviousOption = useCallback(() => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({
      type: 'focus-previous-option',
    })
  }, [])

  // focusNextPage保存`useCallback`，供终端渲染后续处理使用。
  const focusNextPage = useCallback(() => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({
      type: 'focus-next-page',
    })
  }, [])

  // focusPreviousPage保存`useCallback`，供终端渲染后续处理使用。
  const focusPreviousPage = useCallback(() => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({
      type: 'focus-previous-page',
    })
  }, [])

  // focusOption保存`useCallback`，供终端渲染后续处理使用。
  const focusOption = useCallback((value: T | undefined) => {
    // `value` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== undefined) {
      // 调用 dispatch，触发终端渲染此处需要的副作用。
      dispatch({
        type: 'set-focus',
        value,
      })
    }
  }, [])

  // visibleOptions 集合保存`useMemo`，供终端渲染后续处理使用。
  const visibleOptions = useMemo(() => {
    // 返回 `options`，作为终端渲染这次计算的结果。
    return options
      .map((option, index) => ({
        ...option,
        index,
      }))
      .slice(state.visibleFromIndex, state.visibleToIndex)
  }, [options, state.visibleFromIndex, state.visibleToIndex])

  // Validate that focusedValue exists in current options.
  // This handles the case where options change during render but the reset
  // action hasn't been processed yet - without this, the cursor would disappear
  // because focusedValue points to an option that no longer exists.
  // validatedFocusedValue保存`useMemo`，供终端渲染后续处理使用。
  const validatedFocusedValue = useMemo(() => {
    // 满足 `state.focusedValue === undefined` 时，终端渲染执行该分支。
    if (state.focusedValue === undefined) {
      // 返回 `undefined`，作为终端渲染这次计算的结果。
      return undefined
    }
    // exists 集合筛选`options.some`，供终端渲染后续处理使用。
    const exists = options.some(opt => opt.value === state.focusedValue)
    // 满足 `exists` 时，终端渲染执行该分支。
    if (exists) {
      // 返回 `state.focusedValue`，作为终端渲染这次计算的结果。
      return state.focusedValue
    }
    // Fall back to first option if focused value doesn't exist
    // 返回 `options[0]?.value`，作为终端渲染这次计算的结果。
    return options[0]?.value
  }, [state.focusedValue, options])

  // isInInput记录 `useMemo` 是否成立，终端渲染随后按该结果分支。
  const isInInput = useMemo(() => {
    // focusedOption筛选`options.find`，供终端渲染后续处理使用。
    const focusedOption = options.find(
      opt => opt.value === validatedFocusedValue,
    )
    // 返回 `focusedOption?.type === 'input'`，作为终端渲染这次计算的结果。
    return focusedOption?.type === 'input'
  }, [validatedFocusedValue, options])

  // Call onFocus with the validated value (what's actually displayed),
  // not the internal state value which may be stale if options changed.
  // Use ref to avoid re-running when callback reference changes.
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // `validatedFocusedValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (validatedFocusedValue !== undefined) {
      // 调用 onFocusRef.current?.(validatedFocusedValue)，完成这一处局部操作。
      onFocusRef.current?.(validatedFocusedValue)
    }
  }, [validatedFocusedValue])

  // Allow parent to programmatically set focus via focusValue prop
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // `focusValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (focusValue !== undefined) {
      // 调用 dispatch，触发终端渲染此处需要的副作用。
      dispatch({
        type: 'set-focus',
        value: focusValue,
      })
    }
  }, [focusValue])

  // Compute 1-based focused index for scroll position display
  // focusedIndex 索引保存`useMemo`，供终端渲染后续处理使用。
  const focusedIndex = useMemo(() => {
    // 满足 `validatedFocusedValue === undefined` 时，终端渲染执行该分支。
    if (validatedFocusedValue === undefined) {
      // 返回 `0`，作为终端渲染这次计算的结果。
      return 0
    }
    // index 索引筛选`options.findIndex`，供终端渲染后续处理使用。
    const index = options.findIndex(opt => opt.value === validatedFocusedValue)
    // 返回 `index >= 0 ? index + 1 : 0`，作为终端渲染这次计算的结果。
    return index >= 0 ? index + 1 : 0
  }, [validatedFocusedValue, options])

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    focusedValue: validatedFocusedValue,
    focusedIndex,
    visibleFromIndex: state.visibleFromIndex,
    visibleToIndex: state.visibleToIndex,
    visibleOptions,
    isInInput: isInInput ?? false,
    focusNextOption,
    focusPreviousOption,
    focusNextPage,
    focusPreviousPage,
    focusOption,
    options,
  }
}
