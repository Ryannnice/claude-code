// 引入 useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo } from 'react'
// 引入 useRegisterOverlay，将 ../../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterOverlay } from '../../context/overlayContext.js'
// 类型依赖 { InputEvent } 来自 ../../ink/events/input-event.js，用于校准终端渲染的数据契约。
import type { InputEvent } from '../../ink/events/input-event.js'
// 引入 useInput，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { useInput } from '../../ink.js'
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  normalizeFullWidthDigits,
  normalizeFullWidthSpace,
} from '../../utils/stringUtils.js'
// 类型依赖 { OptionWithDescription } 来自 ./select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './select.js'
// 类型依赖 { SelectState } 来自 ./use-select-state.js，用于校准终端渲染的数据契约。
import type { SelectState } from './use-select-state.js'

// UseSelectProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseSelectProps<T> = {
  /**
   * When disabled, user input is ignored.
   *
   * @default false
   */
  isDisabled?: boolean

  /**
   * When true, prevents selection on Enter or number keys, but allows
   * scrolling.
   * When 'numeric', prevents selection on number keys, but allows Enter (and
   * scrolling).
   *
   * @default false
   */
  readonly disableSelection?: boolean | 'numeric'

  /**
   * Select state.
   */
  state: SelectState<T>

  /**
   * Options.
   */
  options: OptionWithDescription<T>[]

  /**
   * Whether this is a multi-select component.
   *
   * @default false
   */
  isMultiSelect?: boolean

  /**
   * Callback when user presses up from the first item.
   * If provided, navigation will not wrap to the last item.
   */
  // 这个回调绑定到 onUpFromFirstItem?: () => void，负责终端渲染在该局部场景下的响应。
  onUpFromFirstItem?: () => void

  /**
   * Callback when user presses down from the last item.
   * If provided, navigation will not wrap to the first item.
   */
  // 这个回调绑定到 onDownFromLastItem?: () => void，负责终端渲染在该局部场景下的响应。
  onDownFromLastItem?: () => void

  /**
   * Callback when input mode should be toggled for an option.
   * Called when Tab is pressed (to enter or exit input mode).
   */
  // 这个回调绑定到 onInputModeToggle?: (value: T) => void，负责终端渲染在该局部场景下的响应。
  onInputModeToggle?: (value: T) => void

  /**
   * Current input values for input-type options.
   * Used to determine if number key should submit an empty input option.
   */
  inputValues?: Map<T, string>

  /**
   * Whether image selection mode is active on the focused input option.
   * When true, arrow key navigation in useInput is suppressed so that
   * Attachments keybindings can handle image navigation instead.
   */
  imagesSelected?: boolean

  /**
   * Callback to attempt entering image selection mode on DOWN arrow.
   * Returns true if image selection was entered (images exist), false otherwise.
   */
  // 这个回调绑定到 onEnterImageSelection?: () => boolean，负责终端渲染在该局部场景下的响应。
  onEnterImageSelection?: () => boolean
}

// useSelectInput 命名 `<T>({`，让后续代码直接表达这个值的用途。
export const useSelectInput = <T>({
  isDisabled = false,
  disableSelection = false,
  state,
  options,
  isMultiSelect = false,
  onUpFromFirstItem,
  onDownFromLastItem,
  onInputModeToggle,
  inputValues,
  imagesSelected = false,
  onEnterImageSelection,
}: UseSelectProps<T>) => {
  // Automatically register as an overlay when onCancel is provided.
  // This ensures CancelRequestHandler won't intercept Escape when the select is active.
  // 调用 useRegisterOverlay，触发终端渲染此处需要的副作用。
  useRegisterOverlay('select', !!state.onCancel)

  // Determine if the focused option is an input type
  // isInInput记录 `useMemo` 是否成立，终端渲染随后按该结果分支。
  const isInInput = useMemo(() => {
    // focusedOption筛选`options.find`，供终端渲染后续处理使用。
    const focusedOption = options.find(opt => opt.value === state.focusedValue)
    // 返回 `focusedOption?.type === 'input'`，作为终端渲染这次计算的结果。
    return focusedOption?.type === 'input'
  }, [options, state.focusedValue])

  // Core navigation via keybindings (up/down/enter/escape)
  // When in input mode, exclude navigation/accept keybindings so that
  // j/k/enter pass through to the TextInput instead of being intercepted.
  // keybindingHandlers 集合保存`useMemo`，供终端渲染后续处理使用。
  const keybindingHandlers = useMemo(() => {
    // 这个回调绑定到 const handlers: Record<string, () => void> = {}，负责终端渲染在该局部场景下的响应。
    const handlers: Record<string, () => void> = {}

    // isInInput缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!isInInput) {
      // 这个回调绑定到 handlers['select:next'] = () => {，负责终端渲染在该局部场景下的响应。
      handlers['select:next'] = () => {
        // 满足 `onDownFromLastItem` 时，终端渲染执行该分支。
        if (onDownFromLastItem) {
          // lastOption 命名 `options[options.length - 1]`，让后续代码直接表达这个值的用途。
          const lastOption = options[options.length - 1]
          // 只有 `lastOption && state.focusedValue === lastOption.v` 满足时，终端渲染才执行该分支。
          if (lastOption && state.focusedValue === lastOption.value) {
            // 调用 onDownFromLastItem，触发终端渲染此处需要的副作用。
            onDownFromLastItem()
            // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
        }
        // 调用 state.focusNextOption，触发终端渲染此处需要的副作用。
        state.focusNextOption()
      }
      // 这个回调绑定到 handlers['select:previous'] = () => {，负责终端渲染在该局部场景下的响应。
      handlers['select:previous'] = () => {
        // 只有 `onUpFromFirstItem && state.visibleFromIndex === 0` 满足时，终端渲染才执行该分支。
        if (onUpFromFirstItem && state.visibleFromIndex === 0) {
          // firstOption读取 `options[0]` 对应条目，后续围绕该成员继续处理。
          const firstOption = options[0]
          // 只有 `firstOption && state.focusedValue === firstOption` 满足时，终端渲染才执行该分支。
          if (firstOption && state.focusedValue === firstOption.value) {
            // 调用 onUpFromFirstItem，触发终端渲染此处需要的副作用。
            onUpFromFirstItem()
            // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
        }
        // 调用 state.focusPreviousOption，触发终端渲染此处需要的副作用。
        state.focusPreviousOption()
      }
      // 这个回调绑定到 handlers['select:accept'] = () => {，负责终端渲染在该局部场景下的响应。
      handlers['select:accept'] = () => {
        // 满足 `disableSelection === true` 时，终端渲染执行该分支。
        if (disableSelection === true) return
        // 满足 `state.focusedValue === undefined` 时，终端渲染执行该分支。
        if (state.focusedValue === undefined) return

        // focusedOption筛选`options.find`，供终端渲染后续处理使用。
        const focusedOption = options.find(
          // opt更新为 `> opt.value === state.focusedValue`，确保终端 UI后续读取最新状态。
          opt => opt.value === state.focusedValue,
        )
        // 满足 `focusedOption?.disabled === true` 时，终端渲染执行该分支。
        if (focusedOption?.disabled === true) return

        // 调用 state.selectFocusedOption?.()，完成这一处局部操作。
        state.selectFocusedOption?.()
        // 调用 state.onChange?.(state.focusedValue)，完成这一处局部操作。
        state.onChange?.(state.focusedValue)
      }
    }

    // 满足 `state.onCancel` 时，终端渲染执行该分支。
    if (state.onCancel) {
      // 这个回调绑定到 handlers['select:cancel'] = () => {，负责终端渲染在该局部场景下的响应。
      handlers['select:cancel'] = () => {
        // 终端 UI 组件 use select input在这里处理 `state.onCancel!()`，完成这一小步状态转换。
        state.onCancel!()
      }
    }

    // 返回 `handlers`，作为终端渲染这次计算的结果。
    return handlers
  }, [
    options,
    state,
    onDownFromLastItem,
    onUpFromFirstItem,
    isInInput,
    disableSelection,
  ])

  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(keybindingHandlers, {
    context: 'Select',
    isActive: !isDisabled,
  })

  // Remaining keys that stay as useInput: number keys, pageUp/pageDown, tab, space,
  // and arrow key navigation when in input mode
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(
    // 这个回调绑定到 (input, key, event: InputEvent) => {，负责终端渲染在该局部场景下的响应。
    (input, key, event: InputEvent) => {
      // normalizedInput保存`normalizeFullWidthDigits`，供终端渲染后续处理使用。
      const normalizedInput = normalizeFullWidthDigits(input)
      // focusedOption筛选`options.find`，供终端渲染后续处理使用。
      const focusedOption = options.find(
        // opt更新为 `> opt.value === state.focusedValue`，确保终端 UI后续读取最新状态。
        opt => opt.value === state.focusedValue,
      )
      // currentIsInInput标记终端 UI use select input是否启用对应路径。
      const currentIsInInput = focusedOption?.type === 'input'

      // Handle Tab key for input mode toggling
      // 只有 `key.tab && onInputModeToggle && state.focusedValu` 满足时，终端渲染才执行该分支。
      if (key.tab && onInputModeToggle && state.focusedValue !== undefined) {
        // 调用 onInputModeToggle，触发终端渲染此处需要的副作用。
        onInputModeToggle(state.focusedValue)
        // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `currentIsInInput` 时，终端渲染执行该分支。
      if (currentIsInInput) {
        // When in image selection mode, suppress all input handling so
        // Attachments keybindings can handle navigation/deletion instead
        // 满足 `imagesSelected` 时，终端渲染执行该分支。
        if (imagesSelected) return

        // DOWN arrow enters image selection mode if images exist
        // 只有 `key.downArrow && onEnterImageSelection?.()` 满足时，终端渲染才执行该分支。
        if (key.downArrow && onEnterImageSelection?.()) {
          // 调用 event.stopImmediatePropagation，触发终端渲染此处需要的副作用。
          event.stopImmediatePropagation()
          // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Arrow keys still navigate the select even while in input mode
        // 只有 `key.downArrow || (key.ctrl && input === 'n')` 满足时，终端渲染才执行该分支。
        if (key.downArrow || (key.ctrl && input === 'n')) {
          // 满足 `onDownFromLastItem` 时，终端渲染执行该分支。
          if (onDownFromLastItem) {
            // lastOption 命名 `options[options.length - 1]`，让后续代码直接表达这个值的用途。
            const lastOption = options[options.length - 1]
            // 只有 `lastOption && state.focusedValue === lastOption.v` 满足时，终端渲染才执行该分支。
            if (lastOption && state.focusedValue === lastOption.value) {
              // 调用 onDownFromLastItem，触发终端渲染此处需要的副作用。
              onDownFromLastItem()
              // 调用 event.stopImmediatePropagation，触发终端渲染此处需要的副作用。
              event.stopImmediatePropagation()
              // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
          }
          // 调用 state.focusNextOption，触发终端渲染此处需要的副作用。
          state.focusNextOption()
          // 调用 event.stopImmediatePropagation，触发终端渲染此处需要的副作用。
          event.stopImmediatePropagation()
          // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 只有 `key.upArrow || (key.ctrl && input === 'p')` 满足时，终端渲染才执行该分支。
        if (key.upArrow || (key.ctrl && input === 'p')) {
          // 只有 `onUpFromFirstItem && state.visibleFromIndex === 0` 满足时，终端渲染才执行该分支。
          if (onUpFromFirstItem && state.visibleFromIndex === 0) {
            // firstOption读取 `options[0]` 对应条目，后续围绕该成员继续处理。
            const firstOption = options[0]
            // 只有 `firstOption && state.focusedValue === firstOption` 满足时，终端渲染才执行该分支。
            if (firstOption && state.focusedValue === firstOption.value) {
              // 调用 onUpFromFirstItem，触发终端渲染此处需要的副作用。
              onUpFromFirstItem()
              // 调用 event.stopImmediatePropagation，触发终端渲染此处需要的副作用。
              event.stopImmediatePropagation()
              // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
          }
          // 调用 state.focusPreviousOption，触发终端渲染此处需要的副作用。
          state.focusPreviousOption()
          // 调用 event.stopImmediatePropagation，触发终端渲染此处需要的副作用。
          event.stopImmediatePropagation()
          // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // All other keys (including digits) pass through to TextInput.
        // Digits should type literally into the input rather than select
        // options — the user has focused a text field and expects typing
        // to insert characters, not jump to a different option.
        // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `key.pageDown` 时，终端渲染执行该分支。
      if (key.pageDown) {
        // 调用 state.focusNextPage，触发终端渲染此处需要的副作用。
        state.focusNextPage()
      }

      // 满足 `key.pageUp` 时，终端渲染执行该分支。
      if (key.pageUp) {
        // 调用 state.focusPreviousPage，触发终端渲染此处需要的副作用。
        state.focusPreviousPage()
      }

      // `disableSelection` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
      if (disableSelection !== true) {
        // Space for multi-select toggle
        // 终端渲染在这里按实际状态进入对应分支。
        if (
          isMultiSelect &&
          normalizeFullWidthSpace(input) === ' ' &&
          state.focusedValue !== undefined
        ) {
          // isFocusedOptionDisabled标记终端 UI use select input是否启用对应路径。
          const isFocusedOptionDisabled = focusedOption?.disabled === true
          // isFocusedOptionDisabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
          if (!isFocusedOptionDisabled) {
            // 调用 state.selectFocusedOption?.()，完成这一处局部操作。
            state.selectFocusedOption?.()
            // 调用 state.onChange?.(state.focusedValue)，完成这一处局部操作。
            state.onChange?.(state.focusedValue)
          }
        }

        // 终端渲染在这里按实际状态进入对应分支。
        if (
          disableSelection !== 'numeric' &&
          /^[0-9]+$/.test(normalizedInput)
        ) {
          // index 索引解析`parseInt`，供终端渲染后续处理使用。
          const index = parseInt(normalizedInput) - 1
          // 只有 `index >= 0 && index < state.options.length` 满足时，终端渲染才执行该分支。
          if (index >= 0 && index < state.options.length) {
            // selectedOption 命名 `state.options[index]!`，让后续代码直接表达这个值的用途。
            const selectedOption = state.options[index]!
            // 满足 `selectedOption.disabled === true` 时，终端渲染执行该分支。
            if (selectedOption.disabled === true) {
              // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 当 `selectedOption.type` 匹配 `'input'` 时，终端渲染执行对应分支。
            if (selectedOption.type === 'input') {
              // currentValue读取`get`，供终端渲染后续处理使用。
              const currentValue = inputValues?.get(selectedOption.value) ?? ''
              // 满足 `currentValue.trim()` 时，终端渲染执行该分支。
              if (currentValue.trim()) {
                // Pre-filled input: auto-submit (user can Tab to edit instead)
                // 调用 state.onChange?.(selectedOption.value)，完成这一处局部操作。
                state.onChange?.(selectedOption.value)
                // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }
              // 满足 `selectedOption.allowEmptySubmitToCancel` 时，终端渲染执行该分支。
              if (selectedOption.allowEmptySubmitToCancel) {
                // 调用 state.onChange?.(selectedOption.value)，完成这一处局部操作。
                state.onChange?.(selectedOption.value)
                // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
                return
              }
              // 调用 state.focusOption，触发终端渲染此处需要的副作用。
              state.focusOption(selectedOption.value)
              // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }
            // 调用 state.onChange?.(selectedOption.value)，完成这一处局部操作。
            state.onChange?.(selectedOption.value)
            // 终端 UI 组件 use select input在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
        }
      }
    },
    { isActive: !isDisabled },
  )
}
