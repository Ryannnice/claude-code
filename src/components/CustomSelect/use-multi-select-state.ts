// 引入 useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useState } from 'react'
// 引入 isDeepStrictEqual，将 util 中已经封装好的能力接到本文件流程里。
import { isDeepStrictEqual } from 'util'
// 引入 useRegisterOverlay，将 ../../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterOverlay } from '../../context/overlayContext.js'
// 类型依赖 { InputEvent } 来自 ../../ink/events/input-event.js，用于校准终端渲染的数据契约。
import type { InputEvent } from '../../ink/events/input-event.js'
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- raw space/arrow multiselect input
// 引入 useInput，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { useInput } from '../../ink.js'
// 整理这一组导入，让终端渲染后续逻辑可以直接复用这些外部能力。
import {
  normalizeFullWidthDigits,
  normalizeFullWidthSpace,
} from '../../utils/stringUtils.js'
// 类型依赖 { OptionWithDescription } 来自 ./select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './select.js'
// 引入 useSelectNavigation，将 ./use-select-navigation.js 中已经封装好的能力接到本文件流程里。
import { useSelectNavigation } from './use-select-navigation.js'

// UseMultiSelectStateProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseMultiSelectStateProps<T> = {
  /**
   * When disabled, user input is ignored.
   *
   * @default false
   */
  isDisabled?: boolean

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
   * Initially selected values.
   */
  defaultValue?: T[]

  /**
   * Callback when selection changes.
   */
  // 这个回调绑定到 onChange?: (values: T[]) => void，负责终端渲染在该局部场景下的响应。
  onChange?: (values: T[]) => void

  /**
   * Callback for canceling the select.
   */
  // 这个回调绑定到 onCancel: () => void，负责终端渲染在该局部场景下的响应。
  onCancel: () => void

  /**
   * Callback for focusing an option.
   */
  // 这个回调绑定到 onFocus?: (value: T) => void，负责终端渲染在该局部场景下的响应。
  onFocus?: (value: T) => void

  /**
   * Value to focus
   */
  focusValue?: T

  /**
   * Text for the submit button. When provided, a submit button is shown and
   * Enter toggles selection (submit only fires when the button is focused).
   * When omitted, Enter submits directly and Space toggles selection.
   */
  submitButtonText?: string

  /**
   * Callback when user submits. Receives the currently selected values.
   */
  // 这个回调绑定到 onSubmit?: (values: T[]) => void，负责终端渲染在该局部场景下的响应。
  onSubmit?: (values: T[]) => void

  /**
   * Callback when user presses down from the last item (submit button).
   * If provided, navigation will not wrap to the first item.
   */
  // 这个回调绑定到 onDownFromLastItem?: () => void，负责终端渲染在该局部场景下的响应。
  onDownFromLastItem?: () => void

  /**
   * Callback when user presses up from the first item.
   * If provided, navigation will not wrap to the last item.
   */
  // 这个回调绑定到 onUpFromFirstItem?: () => void，负责终端渲染在该局部场景下的响应。
  onUpFromFirstItem?: () => void

  /**
   * Focus the last option initially instead of the first.
   */
  initialFocusLast?: boolean

  /**
   * When true, numeric keys (1-9) do not toggle options by index.
   * Mirrors the rendering layer's hideIndexes: if index labels aren't shown,
   * pressing a number shouldn't silently toggle an invisible mapping.
   */
  hideIndexes?: boolean
}

// MultiSelectState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type MultiSelectState<T> = {
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
   * Currently selected values.
   */
  selectedValues: T[]

  /**
   * Current input field values.
   */
  inputValues: Map<T, string>

  /**
   * Whether the submit button is focused.
   */
  isSubmitFocused: boolean

  /**
   * Update an input field value.
   */
  // 这个回调绑定到 updateInputValue: (value: T, inputValue: string) => void，负责终端渲染在该局部场景下的响应。
  updateInputValue: (value: T, inputValue: string) => void

  /**
   * Callback for canceling the select.
   */
  // 这个回调绑定到 onCancel: () => void，负责终端渲染在该局部场景下的响应。
  onCancel: () => void
}

export function useMultiSelectState<T>({
  isDisabled = false,
  visibleOptionCount = 5,
  options,
  defaultValue = [],
  onChange,
  onCancel,
  onFocus,
  focusValue,
  submitButtonText,
  onSubmit,
  onDownFromLastItem,
  onUpFromFirstItem,
  initialFocusLast,
  hideIndexes = false,
}: UseMultiSelectStateProps<T>): MultiSelectState<T> {
  // selectedValues 集合 由 React state 持有，setSelectedValues 会在用户操作或异步结果返回时触发刷新。
  const [selectedValues, setSelectedValues] = useState<T[]>(defaultValue)
  // isSubmitFocused 由 React state 持有，setIsSubmitFocused 会在用户操作或异步结果返回时触发刷新。
  const [isSubmitFocused, setIsSubmitFocused] = useState(false)

  // Reset selectedValues when options change (e.g. async-loaded data changes
  // defaultValue after mount). Mirrors the reset pattern in use-select-navigation.ts
  // and the deleted ui/useMultiSelectState.ts — without this, MCPServerDesktopImportDialog
  // keeps colliding servers checked after getAllMcpConfigs() resolves.
  // lastOptions 集合 由 React state 持有，setLastOptions 会在用户操作或异步结果返回时触发刷新。
  const [lastOptions, setLastOptions] = useState(options)
  // `options` 与 `lastOptions && !isDeepStrictEqu...` 不一致时刷新派生状态，避免使用过期结果。
  if (options !== lastOptions && !isDeepStrictEqual(options, lastOptions)) {
    // setSelectedValues 写入新的状态值，使终端渲染后续读取保持一致。
    setSelectedValues(defaultValue)
    // setLastOptions 写入新的状态值，使终端渲染后续读取保持一致。
    setLastOptions(options)
  }

  // State for input type options
  // 这个回调绑定到 const [inputValues, setInputValues] = useState<Map<T, string>>(() => {，负责终端渲染在该局部场景下的响应。
  const [inputValues, setInputValues] = useState<Map<T, string>>(() => {
    // initialMap 命名 `new Map<T, string>()`，让后续代码直接表达这个值的用途。
    const initialMap = new Map<T, string>()
    // 调用 options.forEach，触发终端渲染此处需要的副作用。
    options.forEach(option => {
      // 只有 `option.type === 'input' && option.initialValue` 满足时，终端渲染才执行该分支。
      if (option.type === 'input' && option.initialValue) {
        // initialMap.set 写入新的状态值，使终端渲染后续读取保持一致。
        initialMap.set(option.value, option.initialValue)
      }
    })
    // 返回 `initialMap`，作为终端渲染这次计算的结果。
    return initialMap
  })

  // updateSelectedValues 集合保存`useCallback`，供终端渲染后续处理使用。
  const updateSelectedValues = useCallback(
    (values: T[] | ((prev: T[]) => T[])) => {
      // newValues 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const newValues =
        typeof values === 'function' ? values(selectedValues) : values
      // setSelectedValues 写入新的状态值，使终端渲染后续读取保持一致。
      setSelectedValues(newValues)
      // 调用 onChange?.(newValues)，完成这一处局部操作。
      onChange?.(newValues)
    },
    [selectedValues, onChange],
  )

  // navigation读取 hook 状态，供终端 UI use multi select sta...本轮渲染使用。
  const navigation = useSelectNavigation<T>({
    visibleOptionCount,
    options,
    initialFocusValue: initialFocusLast
      ? options[options.length - 1]?.value
      : undefined,
    onFocus,
    focusValue,
  })

  // Automatically register as an overlay.
  // This ensures CancelRequestHandler won't intercept Escape when the multi-select is active.
  // 调用 useRegisterOverlay，触发终端渲染此处需要的副作用。
  useRegisterOverlay('multi-select')

  // updateInputValue保存`useCallback`，供终端渲染后续处理使用。
  const updateInputValue = useCallback(
    (value: T, inputValue: string) => {
      // setInputValues 写入新的状态值，使终端渲染后续读取保持一致。
      setInputValues(prev => {
        // next保存`Map`，供终端渲染后续处理使用。
        const next = new Map(prev)
        // next.set 写入新的状态值，使终端渲染后续读取保持一致。
        next.set(value, inputValue)
        // 返回 `next`，作为终端渲染这次计算的结果。
        return next
      })

      // Find the option and call its onChange
      // option筛选`options.find`，供终端渲染后续处理使用。
      const option = options.find(opt => opt.value === value)
      // 当 `option && option.type` 匹配 `'input'` 时，终端渲染执行对应分支。
      if (option && option.type === 'input') {
        // 调用 option.onChange，触发终端渲染此处需要的副作用。
        option.onChange(inputValue)
      }

      // Update selected values to include/exclude based on input
      // 调用 updateSelectedValues，触发终端渲染此处需要的副作用。
      updateSelectedValues(prev => {
        // 满足 `inputValue` 时，终端渲染执行该分支。
        if (inputValue) {
          // 满足 `!prev.includes(value)` 时，终端渲染执行该分支。
          if (!prev.includes(value)) {
            // 返回列表结果，保留终端渲染已经排好的条目顺序。
            return [...prev, value]
          }
          // 返回 `prev`，作为终端渲染这次计算的结果。
          return prev
        } else {
          // 返回 `prev.filter(v => v !== value)`，作为终端渲染这次计算的结果。
          return prev.filter(v => v !== value)
        }
      })
    },
    [options, updateSelectedValues],
  )

  // Handle all keyboard input
  // 调用 useInput，触发终端渲染此处需要的副作用。
  useInput(
    // 这个回调绑定到 (input, key, event: InputEvent) => {，负责终端渲染在该局部场景下的响应。
    (input, key, event: InputEvent) => {
      // normalizedInput保存`normalizeFullWidthDigits`，供终端渲染后续处理使用。
      const normalizedInput = normalizeFullWidthDigits(input)
      // focusedOption筛选`options.find`，供终端渲染后续处理使用。
      const focusedOption = options.find(
        // opt更新为 `> opt.value === navigation.focusedValue`，确保终端 UI后续读取最新状态。
        opt => opt.value === navigation.focusedValue,
      )
      // isInInput标记终端 UI use multi select sta...是否启用对应路径。
      const isInInput = focusedOption?.type === 'input'

      // When in input field, only allow navigation keys
      // 满足 `isInInput` 时，终端渲染执行该分支。
      if (isInInput) {
        // isAllowedKey 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isAllowedKey =
          key.upArrow ||
          key.downArrow ||
          key.escape ||
          key.tab ||
          key.return ||
          (key.ctrl && (input === 'n' || input === 'p' || key.return))
        // isAllowedKey缺失时直接走兜底路径，避免终端渲染使用无效输入。
        if (!isAllowedKey) return
      }

      // lastOptionValue记录 `options[options.length - 1]?.value` 是否成立，下一步按该结果分支。
      const lastOptionValue = options[options.length - 1]?.value

      // Handle Tab to move forward
      // 只有 `key.tab && !key.shift` 满足时，终端渲染才执行该分支。
      if (key.tab && !key.shift) {
        // 终端渲染在这里按实际状态进入对应分支。
        if (
          submitButtonText &&
          onSubmit &&
          navigation.focusedValue === lastOptionValue &&
          !isSubmitFocused
        ) {
          // setIsSubmitFocused 写入新的状态值，使终端渲染后续读取保持一致。
          setIsSubmitFocused(true)
        // 终端 UI 组件 use multi select state在这里处理 `} else if (!isSubmitFocused) {`，完成这一小步状态转换。
        } else if (!isSubmitFocused) {
          // 调用 navigation.focusNextOption，触发终端渲染此处需要的副作用。
          navigation.focusNextOption()
        }
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle Shift+Tab to move backward
      // 只有 `key.tab && key.shift` 满足时，终端渲染才执行该分支。
      if (key.tab && key.shift) {
        // 只有 `submitButtonText && onSubmit && isSubmitFocused` 满足时，终端渲染才执行该分支。
        if (submitButtonText && onSubmit && isSubmitFocused) {
          // setIsSubmitFocused 写入新的状态值，使终端渲染后续读取保持一致。
          setIsSubmitFocused(false)
          // 调用 navigation.focusOption，触发终端渲染此处需要的副作用。
          navigation.focusOption(lastOptionValue)
        } else {
          // 调用 navigation.focusPreviousOption，触发终端渲染此处需要的副作用。
          navigation.focusPreviousOption()
        }
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle arrow down / Ctrl+N / j
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        key.downArrow ||
        (key.ctrl && input === 'n') ||
        (!key.ctrl && !key.shift && input === 'j')
      ) {
        // 只有 `isSubmitFocused && onDownFromLastItem` 满足时，终端渲染才执行该分支。
        if (isSubmitFocused && onDownFromLastItem) {
          // 调用 onDownFromLastItem，触发终端渲染此处需要的副作用。
          onDownFromLastItem()
        // 终端 UI 组件 use multi select state在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          submitButtonText &&
          onSubmit &&
          navigation.focusedValue === lastOptionValue &&
          !isSubmitFocused
        ) {
          // setIsSubmitFocused 写入新的状态值，使终端渲染后续读取保持一致。
          setIsSubmitFocused(true)
        // 终端 UI 组件 use multi select state在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          !submitButtonText &&
          onDownFromLastItem &&
          navigation.focusedValue === lastOptionValue
        ) {
          // No submit button — exit from the last option
          // 调用 onDownFromLastItem，触发终端渲染此处需要的副作用。
          onDownFromLastItem()
        // 终端 UI 组件 use multi select state在这里处理 `} else if (!isSubmitFocused) {`，完成这一小步状态转换。
        } else if (!isSubmitFocused) {
          // 调用 navigation.focusNextOption，触发终端渲染此处需要的副作用。
          navigation.focusNextOption()
        }
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle arrow up / Ctrl+P / k
      // 终端渲染在这里按实际状态进入对应分支。
      if (
        key.upArrow ||
        (key.ctrl && input === 'p') ||
        (!key.ctrl && !key.shift && input === 'k')
      ) {
        // 只有 `submitButtonText && onSubmit && isSubmitFocused` 满足时，终端渲染才执行该分支。
        if (submitButtonText && onSubmit && isSubmitFocused) {
          // setIsSubmitFocused 写入新的状态值，使终端渲染后续读取保持一致。
          setIsSubmitFocused(false)
          // 调用 navigation.focusOption，触发终端渲染此处需要的副作用。
          navigation.focusOption(lastOptionValue)
        // 终端 UI 组件 use multi select state在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          onUpFromFirstItem &&
          navigation.focusedValue === options[0]?.value
        ) {
          // 调用 onUpFromFirstItem，触发终端渲染此处需要的副作用。
          onUpFromFirstItem()
        } else {
          // 调用 navigation.focusPreviousOption，触发终端渲染此处需要的副作用。
          navigation.focusPreviousOption()
        }
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle page navigation
      // 满足 `key.pageDown` 时，终端渲染执行该分支。
      if (key.pageDown) {
        // 调用 navigation.focusNextPage，触发终端渲染此处需要的副作用。
        navigation.focusNextPage()
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 满足 `key.pageUp` 时，终端渲染执行该分支。
      if (key.pageUp) {
        // 调用 navigation.focusPreviousPage，触发终端渲染此处需要的副作用。
        navigation.focusPreviousPage()
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle Enter or Space for selection/submit
      // 当 `key.return || normalizeFullWidthSpace(input)` 匹配 `' '` 时，终端渲染执行对应分支。
      if (key.return || normalizeFullWidthSpace(input) === ' ') {
        // Ctrl+Enter from input field submits
        // 只有 `key.ctrl && key.return && isInInput && onSubmit` 满足时，终端渲染才执行该分支。
        if (key.ctrl && key.return && isInInput && onSubmit) {
          // 调用 onSubmit，触发终端渲染此处需要的副作用。
          onSubmit(selectedValues)
          // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Enter on submit button submits
        // 只有 `isSubmitFocused && onSubmit` 满足时，终端渲染才执行该分支。
        if (isSubmitFocused && onSubmit) {
          // 调用 onSubmit，触发终端渲染此处需要的副作用。
          onSubmit(selectedValues)
          // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // No submit button: Enter submits directly, Space still toggles
        // 只有 `key.return && !submitButtonText && onSubmit` 满足时，终端渲染才执行该分支。
        if (key.return && !submitButtonText && onSubmit) {
          // 调用 onSubmit，触发终端渲染此处需要的副作用。
          onSubmit(selectedValues)
          // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // Enter or Space toggles selection (including for input fields)
        // `navigation.focusedValue` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (navigation.focusedValue !== undefined) {
          // newValues 集合筛选`selectedValues.includes`，供终端渲染后续处理使用。
          const newValues = selectedValues.includes(navigation.focusedValue)
            // 这个回调绑定到 ? selectedValues.filter(v => v !== navigation.focusedValue)，负责终端渲染在该局部场景下的响应。
            ? selectedValues.filter(v => v !== navigation.focusedValue)
            : [...selectedValues, navigation.focusedValue]
          // 调用 updateSelectedValues，触发终端渲染此处需要的副作用。
          updateSelectedValues(newValues)
        }
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle numeric keys (1-9) for direct selection
      // 只有 `!hideIndexes && /^[0-9]+$/.test(normalizedInput)` 满足时，终端渲染才执行该分支。
      if (!hideIndexes && /^[0-9]+$/.test(normalizedInput)) {
        // index 索引解析`parseInt`，供终端渲染后续处理使用。
        const index = parseInt(normalizedInput) - 1
        // 只有 `index >= 0 && index < options.length` 满足时，终端渲染才执行该分支。
        if (index >= 0 && index < options.length) {
          // 取值保存`options[index]!.value`，供终端 UI use multi select sta...后续判断或输出使用。
          const value = options[index]!.value
          // newValues 集合筛选`selectedValues.includes`，供终端渲染后续处理使用。
          const newValues = selectedValues.includes(value)
            // 这个回调绑定到 ? selectedValues.filter(v => v !== value)，负责终端渲染在该局部场景下的响应。
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value]
          // 调用 updateSelectedValues，触发终端渲染此处需要的副作用。
          updateSelectedValues(newValues)
        }
        // 终端 UI 组件 use multi select state在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // Handle Escape
      // 满足 `key.escape` 时，终端渲染执行该分支。
      if (key.escape) {
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel()
        // 调用 event.stopImmediatePropagation，触发终端渲染此处需要的副作用。
        event.stopImmediatePropagation()
      }
    },
    { isActive: !isDisabled },
  )

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...navigation,
    selectedValues,
    inputValues,
    isSubmitFocused,
    updateInputValue,
    onCancel,
  }
}
