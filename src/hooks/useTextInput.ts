// 复用 isInputModeCharacter 终端界面组件，避免在这里重复拼装显示逻辑。
import { isInputModeCharacter } from 'src/components/PromptInput/inputModes.js'
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js'
// 引入 stripAnsi，将 strip-ansi 中已经封装好的能力接到本文件流程里。
import stripAnsi from 'strip-ansi'
// 注册 markBackslashReturnUsed 命令实现，后续会把它纳入斜杠命令集合。
import { markBackslashReturnUsed } from '../commands/terminalSetup/terminalSetup.js'
// 引入 addToHistory，将 ../history.js 中已经封装好的能力接到本文件流程里。
import { addToHistory } from '../history.js'
// 类型依赖 { Key } 来自 ../ink.js，用于校准React hook 状态流的数据契约。
import type { Key } from '../ink.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import type {
  InlineGhostText,
  TextInputState,
} from '../types/textInputTypes.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  Cursor,
  getLastKill,
  pushToKillRing,
  recordYank,
  resetKillAccumulation,
  resetYankState,
  updateYankLength,
  yankPop,
} from '../utils/Cursor.js'
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js'
// 复用 isFullscreenEnvEnabled 工具函数，把通用处理留在 ../utils/fullscreen.js 中维护。
import { isFullscreenEnvEnabled } from '../utils/fullscreen.js'
// 类型依赖 { ImageDimensions } 来自 ../utils/imageResizer.js，用于校准React hook 状态流的数据契约。
import type { ImageDimensions } from '../utils/imageResizer.js'
// 复用 isModifierPressed、prewarmModifiers 工具函数，把通用处理留在 ../utils/modifiers.js 中维护。
import { isModifierPressed, prewarmModifiers } from '../utils/modifiers.js'
// 引入 useDoublePress，将 ./useDoublePress.js 中已经封装好的能力接到本文件流程里。
import { useDoublePress } from './useDoublePress.js'

// MaybeCursor 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type MaybeCursor = void | Cursor
// InputHandler 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type InputHandler = (input: string) => MaybeCursor
// InputMapper 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type InputMapper = (input: string) => MaybeCursor
// 这个回调绑定到 const NOOP_HANDLER: InputHandler = () => {}，负责React hook 状态流在该局部场景下的响应。
const NOOP_HANDLER: InputHandler = () => {}
// mapInput 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function mapInput(input_map: Array<[string, InputHandler]>): InputMapper {
  // map保存`Map`，供React hook后续处理使用。
  const map = new Map(input_map)
  // 返回 `function (input: string): MaybeCursor {`，作为React hook 状态流这次计算的结果。
  return function (input: string): MaybeCursor {
    // 返回 `(map.get(input) ?? NOOP_HANDLER)(input)`，作为React hook 状态流这次计算的结果。
    return (map.get(input) ?? NOOP_HANDLER)(input)
  }
}

// UseTextInputProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
export type UseTextInputProps = {
  value: string
  // 这个回调绑定到 onChange: (value: string) => void，负责React hook 状态流在该局部场景下的响应。
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  onExit?: () => void
  onExitMessage?: (show: boolean, key?: string) => void
  onHistoryUp?: () => void
  // 这个回调绑定到 onHistoryDown?: () => void，负责React hook 状态流在该局部场景下的响应。
  onHistoryDown?: () => void
  // 这个回调绑定到 onHistoryReset?: () => void，负责React hook 状态流在该局部场景下的响应。
  onHistoryReset?: () => void
  // 这个回调绑定到 onClearInput?: () => void，负责React hook 状态流在该局部场景下的响应。
  onClearInput?: () => void
  focus?: boolean
  mask?: string
  multiline?: boolean
  cursorChar: string
  highlightPastedText?: boolean
  // 这个回调绑定到 invert: (text: string) => string，负责React hook 状态流在该局部场景下的响应。
  invert: (text: string) => string
  // 这个回调绑定到 themeText: (text: string) => string，负责React hook 状态流在该局部场景下的响应。
  themeText: (text: string) => string
  columns: number
  onImagePaste?: (
    base64Image: string,
    mediaType?: string,
    filename?: string,
    dimensions?: ImageDimensions,
    sourcePath?: string,
  ) => void
  disableCursorMovementForUpDownKeys?: boolean
  disableEscapeDoublePress?: boolean
  maxVisibleLines?: number
  externalOffset: number
  // 这个回调绑定到 onOffsetChange: (offset: number) => void，负责React hook 状态流在该局部场景下的响应。
  onOffsetChange: (offset: number) => void
  inputFilter?: (input: string, key: Key) => string
  inlineGhostText?: InlineGhostText
  dim?: (text: string) => string
}

// useTextInput 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useTextInput({
  value: originalValue,
  onChange,
  onSubmit,
  onExit,
  onExitMessage,
  onHistoryUp,
  onHistoryDown,
  onHistoryReset,
  onClearInput,
  mask = '',
  multiline = false,
  cursorChar,
  invert,
  columns,
  onImagePaste: _onImagePaste,
  disableCursorMovementForUpDownKeys = false,
  disableEscapeDoublePress = false,
  maxVisibleLines,
  externalOffset,
  onOffsetChange,
  inputFilter,
  inlineGhostText,
  dim,
}: UseTextInputProps): TextInputState {
  // Pre-warm the modifiers module for Apple Terminal (has internal guard, safe to call multiple times)
  // 当 `env.terminal` 匹配 `'Apple_Terminal'` 时，React hook执行对应分支。
  if (env.terminal === 'Apple_Terminal') {
    // 调用 prewarmModifiers，触发React hook此处需要的副作用。
    prewarmModifiers()
  }

  // offset保存`externalOffset`，供后续判断或组装使用。
  const offset = externalOffset
  // setOffset 命名 `onOffsetChange`，让后续代码直接表达这个值的用途。
  const setOffset = onOffsetChange
  // cursor保存`Cursor.fromText`，供React hook后续处理使用。
  const cursor = Cursor.fromText(originalValue, columns, offset)
  // 从 `useNotifications()` 解构 addNotification、removeNotification，减少React hook use Text Input对同一对象的重复访问。
  const { addNotification, removeNotification } = useNotifications()

  // handleCtrlC保存`useDoublePress`，供React hook后续处理使用。
  const handleCtrlC = useDoublePress(
    // show更新为 `> {`，确保useTextInput后续读取最新状态。
    show => {
      // 调用 onExitMessage?.(show, 'Ctrl-C')，完成这一处局部操作。
      onExitMessage?.(show, 'Ctrl-C')
    },
    // 这个回调绑定到 () => onExit?.(),，负责React hook 状态流在该局部场景下的响应。
    () => onExit?.(),
    // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
    () => {
      // 满足 `originalValue` 时，React hook执行该分支。
      if (originalValue) {
        // 调用 onChange，触发React hook此处需要的副作用。
        onChange('')
        // setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        setOffset(0)
        // 调用 onHistoryReset?.()，完成这一处局部操作。
        onHistoryReset?.()
      }
    },
  )

  // NOTE(keybindings): This escape handler is intentionally NOT migrated to the keybindings system.
  // It's a text-level double-press escape for clearing input, not an action-level keybinding.
  // Double-press Esc clears the input and saves to history - this is text editing behavior,
  // not dialog dismissal, and needs the double-press safety mechanism.
  // handleEscape保存`useDoublePress`，供React hook后续处理使用。
  const handleEscape = useDoublePress(
    // 这个回调绑定到 (show: boolean) => {，负责React hook 状态流在该局部场景下的响应。
    (show: boolean) => {
      // 组合条件 `!originalValue || !show` 成立时，React hook 状态流才启用这条专门路径。
      if (!originalValue || !show) {
        // React hook use Text Input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: 'escape-again-to-clear',
        text: 'Esc again to clear',
        priority: 'immediate',
        timeoutMs: 1000,
      })
    },
    // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
    () => {
      // Remove the "Esc again to clear" notification immediately
      // 调用 removeNotification，触发React hook此处需要的副作用。
      removeNotification('escape-again-to-clear')
      // 调用 onClearInput?.()，完成这一处局部操作。
      onClearInput?.()
      // 满足 `originalValue` 时，React hook执行该分支。
      if (originalValue) {
        // Track double-escape usage for feature discovery
        // Save to history before clearing
        // `originalValue.trim()` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
        if (originalValue.trim() !== '') {
          // 调用 addToHistory，触发React hook此处需要的副作用。
          addToHistory(originalValue)
        }
        // 调用 onChange，触发React hook此处需要的副作用。
        onChange('')
        // setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        setOffset(0)
        // 调用 onHistoryReset?.()，完成这一处局部操作。
        onHistoryReset?.()
      }
    },
  )

  // handleEmptyCtrlD保存`useDoublePress`，供React hook后续处理使用。
  const handleEmptyCtrlD = useDoublePress(
    // show更新为 `> {`，确保useTextInput后续读取最新状态。
    show => {
      // `originalValue` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
      if (originalValue !== '') {
        // React hook use Text Input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 onExitMessage?.(show, 'Ctrl-D')，完成这一处局部操作。
      onExitMessage?.(show, 'Ctrl-D')
    },
    // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
    () => {
      // `originalValue` 与 `''` 不一致时刷新派生状态，避免使用过期结果。
      if (originalValue !== '') {
        // React hook use Text Input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // 调用 onExit?.()，完成这一处局部操作。
      onExit?.()
    },
  )

  // handleCtrlD 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleCtrlD(): MaybeCursor {
    // 满足 `cursor.text === ''` 时，React hook执行该分支。
    if (cursor.text === '') {
      // When input is empty, handle double-press
      // 调用 handleEmptyCtrlD，触发React hook此处需要的副作用。
      handleEmptyCtrlD()
      // 返回 `cursor`，作为React hook 状态流这次计算的结果。
      return cursor
    }
    // When input is not empty, delete forward like iPython
    // 返回 `cursor.del()`，作为React hook 状态流这次计算的结果。
    return cursor.del()
  }

  // killToLineEnd 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function killToLineEnd(): Cursor {
    // 从 `cursor.deleteToLineEnd()` 解构 cursor、killed，减少React hook use Text Input对同一对象的重复访问。
    const { cursor: newCursor, killed } = cursor.deleteToLineEnd()
    // 调用 pushToKillRing，触发React hook此处需要的副作用。
    pushToKillRing(killed, 'append')
    // 返回 `newCursor`，作为React hook 状态流这次计算的结果。
    return newCursor
  }

  // killToLineStart 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function killToLineStart(): Cursor {
    // 从 `cursor.deleteToLineStart()` 解构 cursor、killed，减少React hook use Text Input对同一对象的重复访问。
    const { cursor: newCursor, killed } = cursor.deleteToLineStart()
    // 调用 pushToKillRing，触发React hook此处需要的副作用。
    pushToKillRing(killed, 'prepend')
    // 返回 `newCursor`，作为React hook 状态流这次计算的结果。
    return newCursor
  }

  // killWordBefore 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function killWordBefore(): Cursor {
    // 从 `cursor.deleteWordBefore()` 解构 cursor、killed，减少React hook use Text Input对同一对象的重复访问。
    const { cursor: newCursor, killed } = cursor.deleteWordBefore()
    // 调用 pushToKillRing，触发React hook此处需要的副作用。
    pushToKillRing(killed, 'prepend')
    // 返回 `newCursor`，作为React hook 状态流这次计算的结果。
    return newCursor
  }

  // yank 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function yank(): Cursor {
    // 文本读取`getLastKill`，供React hook后续处理使用。
    const text = getLastKill()
    // 满足 `text.length > 0` 时，React hook执行该分支。
    if (text.length > 0) {
      // startOffset保存`cursor.offset`，供后续判断或组装使用。
      const startOffset = cursor.offset
      // newCursor保存`cursor.insert`，供React hook后续处理使用。
      const newCursor = cursor.insert(text)
      // 调用 recordYank，触发React hook此处需要的副作用。
      recordYank(startOffset, text.length)
      // 返回 `newCursor`，作为React hook 状态流这次计算的结果。
      return newCursor
    }
    // 返回 `cursor`，作为React hook 状态流这次计算的结果。
    return cursor
  }

  // handleYankPop 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleYankPop(): Cursor {
    // popResult保存`yankPop`，供React hook后续处理使用。
    const popResult = yankPop()
    // popResult缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!popResult) {
      // 返回 `cursor`，作为React hook 状态流这次计算的结果。
      return cursor
    }
    // 从 `popResult` 解构 text、start、length，减少React hook use Text Input对同一对象的重复访问。
    const { text, start, length } = popResult
    // Replace the previously yanked text with the new one
    // before格式化`text.slice`，供React hook后续处理使用。
    const before = cursor.text.slice(0, start)
    // after格式化`text.slice`，供React hook后续处理使用。
    const after = cursor.text.slice(start + length)
    // newText保存`before + text + after`，供React hook use Text I...后续判断或输出使用。
    const newText = before + text + after
    // newOffset 命名 `start + text.length`，让后续代码直接表达这个值的用途。
    const newOffset = start + text.length
    // 调用 updateYankLength，触发React hook此处需要的副作用。
    updateYankLength(text.length)
    // 返回 `Cursor.fromText(newText, columns, newOffset)`，作为React hook 状态流这次计算的结果。
    return Cursor.fromText(newText, columns, newOffset)
  }

  // handleCtrl派生`mapInput`，供React hook后续处理使用。
  const handleCtrl = mapInput([
    // 这个回调绑定到 ['a', () => cursor.startOfLine()],，负责React hook 状态流在该局部场景下的响应。
    ['a', () => cursor.startOfLine()],
    // 这个回调绑定到 ['b', () => cursor.left()],，负责React hook 状态流在该局部场景下的响应。
    ['b', () => cursor.left()],
    ['c', handleCtrlC],
    ['d', handleCtrlD],
    // 这个回调绑定到 ['e', () => cursor.endOfLine()],，负责React hook 状态流在该局部场景下的响应。
    ['e', () => cursor.endOfLine()],
    // 这个回调绑定到 ['f', () => cursor.right()],，负责React hook 状态流在该局部场景下的响应。
    ['f', () => cursor.right()],
    // 这个回调绑定到 ['h', () => cursor.deleteTokenBefore() ?? cursor.backspace()],，负责React hook 状态流在该局部场景下的响应。
    ['h', () => cursor.deleteTokenBefore() ?? cursor.backspace()],
    ['k', killToLineEnd],
    // 这个回调绑定到 ['n', () => downOrHistoryDown()],，负责React hook 状态流在该局部场景下的响应。
    ['n', () => downOrHistoryDown()],
    // 这个回调绑定到 ['p', () => upOrHistoryUp()],，负责React hook 状态流在该局部场景下的响应。
    ['p', () => upOrHistoryUp()],
    ['u', killToLineStart],
    ['w', killWordBefore],
    ['y', yank],
  ])

  // handleMeta派生`mapInput`，供React hook后续处理使用。
  const handleMeta = mapInput([
    // 这个回调绑定到 ['b', () => cursor.prevWord()],，负责React hook 状态流在该局部场景下的响应。
    ['b', () => cursor.prevWord()],
    // 这个回调绑定到 ['f', () => cursor.nextWord()],，负责React hook 状态流在该局部场景下的响应。
    ['f', () => cursor.nextWord()],
    // 这个回调绑定到 ['d', () => cursor.deleteWordAfter()],，负责React hook 状态流在该局部场景下的响应。
    ['d', () => cursor.deleteWordAfter()],
    ['y', handleYankPop],
  ])

  // handleEnter 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleEnter(key: Key) {
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      multiline &&
      cursor.offset > 0 &&
      cursor.text[cursor.offset - 1] === '\\'
    ) {
      // Track that the user has used backslash+return
      // 调用 markBackslashReturnUsed，触发React hook此处需要的副作用。
      markBackslashReturnUsed()
      // 返回 `cursor.backspace().insert('\n')`，作为React hook 状态流这次计算的结果。
      return cursor.backspace().insert('\n')
    }
    // Meta+Enter or Shift+Enter inserts a newline
    // 组合条件 `key.meta || key.shift` 成立时，React hook 状态流才启用这条专门路径。
    if (key.meta || key.shift) {
      // 返回 `cursor.insert('\n')`，作为React hook 状态流这次计算的结果。
      return cursor.insert('\n')
    }
    // Apple Terminal doesn't support custom Shift+Enter keybindings,
    // so we use native macOS modifier detection to check if Shift is held
    // 组合条件 `env.terminal === 'Apple_Terminal' && isModifierPressed('shift')` 成立时，React hook 状态流才启用这条专门路径。
    if (env.terminal === 'Apple_Terminal' && isModifierPressed('shift')) {
      // 返回 `cursor.insert('\n')`，作为React hook 状态流这次计算的结果。
      return cursor.insert('\n')
    }
    // 调用 onSubmit?.(originalValue)，完成这一处局部操作。
    onSubmit?.(originalValue)
  }

  // upOrHistoryUp 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function upOrHistoryUp() {
    // 满足 `disableCursorMovementForUpDownKeys` 时，React hook执行该分支。
    if (disableCursorMovementForUpDownKeys) {
      // 调用 onHistoryUp?.()，完成这一处局部操作。
      onHistoryUp?.()
      // 返回 `cursor`，作为React hook 状态流这次计算的结果。
      return cursor
    }
    // Try to move by wrapped lines first
    // cursorUp保存`cursor.up`，供React hook后续处理使用。
    const cursorUp = cursor.up()
    // 满足 `!cursorUp.equals(cursor)` 时，React hook执行该分支。
    if (!cursorUp.equals(cursor)) {
      // 返回 `cursorUp`，作为React hook 状态流这次计算的结果。
      return cursorUp
    }

    // If we can't move by wrapped lines and this is multiline input,
    // try to move by logical lines (to handle paragraph boundaries)
    // 满足 `multiline` 时，React hook执行该分支。
    if (multiline) {
      // cursorUpLogical保存`cursor.upLogicalLine`，供React hook后续处理使用。
      const cursorUpLogical = cursor.upLogicalLine()
      // 满足 `!cursorUpLogical.equals(cursor)` 时，React hook执行该分支。
      if (!cursorUpLogical.equals(cursor)) {
        // 返回 `cursorUpLogical`，作为React hook 状态流这次计算的结果。
        return cursorUpLogical
      }
    }

    // Can't move up at all - trigger history navigation
    // 调用 onHistoryUp?.()，完成这一处局部操作。
    onHistoryUp?.()
    // 返回 `cursor`，作为React hook 状态流这次计算的结果。
    return cursor
  }
  // downOrHistoryDown 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function downOrHistoryDown() {
    // 满足 `disableCursorMovementForUpDownKeys` 时，React hook执行该分支。
    if (disableCursorMovementForUpDownKeys) {
      // 调用 onHistoryDown?.()，完成这一处局部操作。
      onHistoryDown?.()
      // 返回 `cursor`，作为React hook 状态流这次计算的结果。
      return cursor
    }
    // Try to move by wrapped lines first
    // cursorDown保存`cursor.down`，供React hook后续处理使用。
    const cursorDown = cursor.down()
    // 满足 `!cursorDown.equals(cursor)` 时，React hook执行该分支。
    if (!cursorDown.equals(cursor)) {
      // 返回 `cursorDown`，作为React hook 状态流这次计算的结果。
      return cursorDown
    }

    // If we can't move by wrapped lines and this is multiline input,
    // try to move by logical lines (to handle paragraph boundaries)
    // 满足 `multiline` 时，React hook执行该分支。
    if (multiline) {
      // cursorDownLogical保存`cursor.downLogicalLine`，供React hook后续处理使用。
      const cursorDownLogical = cursor.downLogicalLine()
      // 满足 `!cursorDownLogical.equals(cursor)` 时，React hook执行该分支。
      if (!cursorDownLogical.equals(cursor)) {
        // 返回 `cursorDownLogical`，作为React hook 状态流这次计算的结果。
        return cursorDownLogical
      }
    }

    // Can't move down at all - trigger history navigation
    // 调用 onHistoryDown?.()，完成这一处局部操作。
    onHistoryDown?.()
    // 返回 `cursor`，作为React hook 状态流这次计算的结果。
    return cursor
  }

  // mapKey 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function mapKey(key: Key): InputMapper {
    // 按照 true 的取值选择React hook 状态流的具体处理分支。
    switch (true) {
      case key.escape:
        // 返回 `() => {`，作为React hook 状态流这次计算的结果。
        return () => {
          // Skip when a keybinding context (e.g. Autocomplete) owns escape.
          // useKeybindings can't shield us via stopImmediatePropagation —
          // BaseTextInput's useInput registers first (child effects fire
          // before parent effects), so this handler has already run by the
          // time the keybinding's handler stops propagation.
          // 满足 `disableEscapeDoublePress` 时，React hook执行该分支。
          if (disableEscapeDoublePress) return cursor
          // 调用 handleEscape，触发React hook此处需要的副作用。
          handleEscape()
          // Return the current cursor unchanged - handleEscape manages state internally
          // 返回 `cursor`，作为React hook 状态流这次计算的结果。
          return cursor
        }
      case key.leftArrow && (key.ctrl || key.meta || key.fn):
        // 返回 `() => cursor.prevWord()`，作为React hook 状态流这次计算的结果。
        return () => cursor.prevWord()
      case key.rightArrow && (key.ctrl || key.meta || key.fn):
        // 返回 `() => cursor.nextWord()`，作为React hook 状态流这次计算的结果。
        return () => cursor.nextWord()
      case key.backspace:
        // 返回 `key.meta || key.ctrl`，作为React hook 状态流这次计算的结果。
        return key.meta || key.ctrl
          ? killWordBefore
          // 这个回调绑定到 : () => cursor.deleteTokenBefore() ?? cursor.backspace()，负责React hook 状态流在该局部场景下的响应。
          : () => cursor.deleteTokenBefore() ?? cursor.backspace()
      case key.delete:
        // 返回 `key.meta ? killToLineEnd : () => cursor.del()`，作为React hook 状态流这次计算的结果。
        return key.meta ? killToLineEnd : () => cursor.del()
      case key.ctrl:
        // 返回 `handleCtrl`，作为React hook 状态流这次计算的结果。
        return handleCtrl
      case key.home:
        // 返回 `() => cursor.startOfLine()`，作为React hook 状态流这次计算的结果。
        return () => cursor.startOfLine()
      case key.end:
        // 返回 `() => cursor.endOfLine()`，作为React hook 状态流这次计算的结果。
        return () => cursor.endOfLine()
      case key.pageDown:
        // In fullscreen mode, PgUp/PgDn scroll the message viewport instead
        // of moving the cursor — no-op here, ScrollKeybindingHandler handles it.
        // 满足 `isFullscreenEnvEnabled()` 时，React hook执行该分支。
        if (isFullscreenEnvEnabled()) {
          // 返回 `NOOP_HANDLER`，作为React hook 状态流这次计算的结果。
          return NOOP_HANDLER
        }
        // 返回 `() => cursor.endOfLine()`，作为React hook 状态流这次计算的结果。
        return () => cursor.endOfLine()
      case key.pageUp:
        // 满足 `isFullscreenEnvEnabled()` 时，React hook执行该分支。
        if (isFullscreenEnvEnabled()) {
          // 返回 `NOOP_HANDLER`，作为React hook 状态流这次计算的结果。
          return NOOP_HANDLER
        }
        // 返回 `() => cursor.startOfLine()`，作为React hook 状态流这次计算的结果。
        return () => cursor.startOfLine()
      case key.wheelUp:
      case key.wheelDown:
        // Mouse wheel events only exist when fullscreen mouse tracking is on.
        // ScrollKeybindingHandler handles them; no-op here to avoid inserting
        // the raw SGR sequence as text.
        // 返回 `NOOP_HANDLER`，作为React hook 状态流这次计算的结果。
        return NOOP_HANDLER
      case key.return:
        // Must come before key.meta so Option+Return inserts newline
        // 返回 `() => handleEnter(key)`，作为React hook 状态流这次计算的结果。
        return () => handleEnter(key)
      case key.meta:
        // 返回 `handleMeta`，作为React hook 状态流这次计算的结果。
        return handleMeta
      case key.tab:
        // 返回 `() => cursor`，作为React hook 状态流这次计算的结果。
        return () => cursor
      case key.upArrow && !key.shift:
        // 返回 `upOrHistoryUp`，作为React hook 状态流这次计算的结果。
        return upOrHistoryUp
      case key.downArrow && !key.shift:
        // 返回 `downOrHistoryDown`，作为React hook 状态流这次计算的结果。
        return downOrHistoryDown
      case key.leftArrow:
        // 返回 `() => cursor.left()`，作为React hook 状态流这次计算的结果。
        return () => cursor.left()
      case key.rightArrow:
        // 返回 `() => cursor.right()`，作为React hook 状态流这次计算的结果。
        return () => cursor.right()
      default: {
        // 返回 `function (input: string) {`，作为React hook 状态流这次计算的结果。
        return function (input: string) {
          // 按照 true 的取值选择React hook 状态流的具体处理分支。
          switch (true) {
            // Home key
            case input === '\x1b[H' || input === '\x1b[1~':
              // 返回 `cursor.startOfLine()`，作为React hook 状态流这次计算的结果。
              return cursor.startOfLine()
            // End key
            case input === '\x1b[F' || input === '\x1b[4~':
              // 返回 `cursor.endOfLine()`，作为React hook 状态流这次计算的结果。
              return cursor.endOfLine()
            default: {
              // Trailing \r after text is SSH-coalesced Enter ("o\r") —
              // strip it so the Enter isn't inserted as content. Lone \r
              // here is Alt+Enter leaking through (META_KEY_CODE_RE doesn't
              // match \x1b\r) — leave it for the \r→\n below. Embedded \r
              // is multi-line paste from a terminal without bracketed
              // paste — convert to \n. Backslash+\r is a stale VS Code
              // Shift+Enter binding (pre-#8991 /terminal-setup wrote
              // args.text "\\\r\n" to keybindings.json); keep the \r so
              // it becomes \n below (anthropics/claude-code#31316).
              // 文本保存`stripAnsi`，供React hook后续处理使用。
              const text = stripAnsi(input)
                // eslint-disable-next-line custom-rules/no-lookbehind-regex -- .replace(re, str) on 1-2 char keystrokes: no-match returns same string (Object.is), regex never runs
                .replace(/(?<=[^\\\r\n])\r$/, '')
                .replace(/\r/g, '\n')
              // 组合条件 `cursor.isAtStart() && isInputModeCharacter(input)` 成立时，React hook 状态流才启用这条专门路径。
              if (cursor.isAtStart() && isInputModeCharacter(input)) {
                // 返回 `cursor.insert(text).left()`，作为React hook 状态流这次计算的结果。
                return cursor.insert(text).left()
              }
              // 返回 `cursor.insert(text)`，作为React hook 状态流这次计算的结果。
              return cursor.insert(text)
            }
          }
        }
      }
    }
  }

  // Check if this is a kill command (Ctrl+K, Ctrl+U, Ctrl+W, or Meta+Backspace/Delete)
  // isKillKey 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function isKillKey(key: Key, input: string): boolean {
    // 组合条件 `key.ctrl && (input === 'k' || input === 'u' || input === 'w')` 成立时，React hook 状态流才启用这条专门路径。
    if (key.ctrl && (input === 'k' || input === 'u' || input === 'w')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 组合条件 `key.meta && (key.backspace || key.delete)` 成立时，React hook 状态流才启用这条专门路径。
    if (key.meta && (key.backspace || key.delete)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if this is a yank command (Ctrl+Y or Alt+Y)
  // isYankKey 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function isYankKey(key: Key, input: string): boolean {
    // 返回 `(key.ctrl || key.meta) && input === 'y'`，作为React hook 状态流这次计算的结果。
    return (key.ctrl || key.meta) && input === 'y'
  }

  // onInput 封装useTextInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function onInput(input: string, key: Key): void {
    // Note: Image paste shortcut (chat:imagePaste) is handled via useKeybindings in PromptInput

    // Apply filter if provided
    // filteredInput保存`inputFilter`，供React hook后续处理使用。
    const filteredInput = inputFilter ? inputFilter(input, key) : input

    // If the input was filtered out, do nothing
    // 当 `filteredInput` 匹配 `'' && input !== ''` 时，React hook执行对应分支。
    if (filteredInput === '' && input !== '') {
      // React hook use Text Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Fix Issue #1853: Filter DEL characters that interfere with backspace in SSH/tmux
    // In SSH/tmux environments, backspace generates both key events and raw DEL chars
    // 组合条件 `!key.backspace && !key.delete && input.includes('\x7f')` 成立时，React hook 状态流才启用这条专门路径。
    if (!key.backspace && !key.delete && input.includes('\x7f')) {
      // delCount 数量匹配`input.match`，供React hook后续处理使用。
      const delCount = (input.match(/\x7f/g) || []).length

      // Apply all DEL characters as backspace operations synchronously
      // Try to delete tokens first, fall back to character backspace
      // currentCursor保存`cursor`，供后续判断或组装使用。
      let currentCursor = cursor
      // 按索引扫描 `delCount`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < delCount; i++) {
        // React hook use Text Input在这里处理 `currentCursor =`，完成这一小步状态转换。
        currentCursor =
          currentCursor.deleteTokenBefore() ?? currentCursor.backspace()
      }

      // Update state once with the final result
      // 满足 `!cursor.equals(currentCursor)` 时，React hook执行该分支。
      if (!cursor.equals(currentCursor)) {
        // `cursor.text` 与 `currentCursor.text` 不一致时刷新派生状态，避免使用过期结果。
        if (cursor.text !== currentCursor.text) {
          // 调用 onChange，触发React hook此处需要的副作用。
          onChange(currentCursor.text)
        }
        // setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        setOffset(currentCursor.offset)
      }
      // 调用 resetKillAccumulation，触发React hook此处需要的副作用。
      resetKillAccumulation()
      // 调用 resetYankState，触发React hook此处需要的副作用。
      resetYankState()
      // React hook use Text Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Reset kill accumulation for non-kill keys
    // 满足 `!isKillKey(key, filteredInput)` 时，React hook执行该分支。
    if (!isKillKey(key, filteredInput)) {
      // 调用 resetKillAccumulation，触发React hook此处需要的副作用。
      resetKillAccumulation()
    }

    // Reset yank state for non-yank keys (breaks yank-pop chain)
    // 满足 `!isYankKey(key, filteredInput)` 时，React hook执行该分支。
    if (!isYankKey(key, filteredInput)) {
      // 调用 resetYankState，触发React hook此处需要的副作用。
      resetYankState()
    }

    // nextCursor派生`mapKey`，供React hook后续处理使用。
    const nextCursor = mapKey(key)(filteredInput)
    // 满足 `nextCursor` 时，React hook执行该分支。
    if (nextCursor) {
      // 满足 `!cursor.equals(nextCursor)` 时，React hook执行该分支。
      if (!cursor.equals(nextCursor)) {
        // `cursor.text` 与 `nextCursor.text` 不一致时刷新派生状态，避免使用过期结果。
        if (cursor.text !== nextCursor.text) {
          // 调用 onChange，触发React hook此处需要的副作用。
          onChange(nextCursor.text)
        }
        // setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        setOffset(nextCursor.offset)
      }
      // SSH-coalesced Enter: on slow links, "o" + Enter can arrive as one
      // chunk "o\r". parseKeypress only matches s === '\r', so it hit the
      // default handler above (which stripped the trailing \r). Text with
      // exactly one trailing \r is coalesced Enter; lone \r is Alt+Enter
      // (newline); embedded \r is multi-line paste.
      // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
      if (
        filteredInput.length > 1 &&
        filteredInput.endsWith('\r') &&
        !filteredInput.slice(0, -1).includes('\r') &&
        // Backslash+CR is a stale VS Code Shift+Enter binding, not
        // coalesced Enter. See default handler above.
        filteredInput[filteredInput.length - 2] !== '\\'
      ) {
        // 调用 onSubmit?.(nextCursor.text)，完成这一处局部操作。
        onSubmit?.(nextCursor.text)
      }
    }
  }

  // Prepare ghost text for rendering - validate insertPosition matches current
  // cursor offset to prevent stale ghost text from a previous keystroke causing
  // a one-frame jitter (ghost text state is updated via useEffect after render)
  // ghostTextForRender 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const ghostTextForRender =
    inlineGhostText && dim && inlineGhostText.insertPosition === offset
      ? { text: inlineGhostText.text, dim }
      : undefined

  // cursorPos 集合读取`cursor.getPosition`，供React hook后续处理使用。
  const cursorPos = cursor.getPosition()

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    onInput,
    renderedValue: cursor.render(
      cursorChar,
      mask,
      invert,
      ghostTextForRender,
      maxVisibleLines,
    ),
    offset,
    setOffset,
    cursorLine: cursorPos.line - cursor.getViewportStartLine(maxVisibleLines),
    cursorColumn: cursorPos.column,
    viewportCharOffset: cursor.getViewportCharOffset(maxVisibleLines),
    viewportCharEnd: cursor.getViewportCharEnd(maxVisibleLines),
  }
}
