// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react'
// 类型依赖 { Key } 来自 ../ink.js，用于校准React hook 状态流的数据契约。
import type { Key } from '../ink.js'
// 类型依赖 { VimInputState, VimMode } 来自 ../types/textInputTypes.js，用于校准React hook 状态流的数据契约。
import type { VimInputState, VimMode } from '../types/textInputTypes.js'
// 复用 Cursor 工具函数，把通用处理留在 ../utils/Cursor.js 中维护。
import { Cursor } from '../utils/Cursor.js'
// 复用 lastGrapheme 工具函数，把通用处理留在 ../utils/intl.js 中维护。
import { lastGrapheme } from '../utils/intl.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  executeIndent,
  executeJoin,
  executeOpenLine,
  executeOperatorFind,
  executeOperatorMotion,
  executeOperatorTextObj,
  executeReplace,
  executeToggleCase,
  executeX,
  type OperatorContext,
} from '../vim/operators.js'
// 引入 TransitionContext、transition，将 ../vim/transitions.js 中已经封装好的能力接到本文件流程里。
import { type TransitionContext, transition } from '../vim/transitions.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  createInitialPersistentState,
  createInitialVimState,
  type PersistentState,
  type RecordedChange,
  type VimState,
} from '../vim/types.js'
// 引入 UseTextInputProps、useTextInput，将 ./useTextInput.js 中已经封装好的能力接到本文件流程里。
import { type UseTextInputProps, useTextInput } from './useTextInput.js'

// UseVimInputProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseVimInputProps = Omit<UseTextInputProps, 'inputFilter'> & {
  onModeChange?: (mode: VimMode) => void
  onUndo?: () => void
  inputFilter?: UseTextInputProps['inputFilter']
}

// useVimInput 封装useVimInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useVimInput(props: UseVimInputProps): VimInputState {
  // vimStateRef 引用构建`createInitialVimState`，供React hook后续处理使用。
  const vimStateRef = React.useRef<VimState>(createInitialVimState())
  // mode 由 React state 持有，setMode 会在用户操作或异步结果返回时触发刷新。
  const [mode, setMode] = useState<VimMode>('INSERT')

  // persistentRef 引用保存`React.useRef<PersistentState>(`，供后续判断或组装使用。
  const persistentRef = React.useRef<PersistentState>(
    createInitialPersistentState(),
  )

  // inputFilter is applied once at the top of handleVimInput (not here) so
  // vim-handled paths that return without calling textInput.onInput still
  // run the filter — otherwise a stateful filter (e.g. lazy-space-after-
  // pill) stays armed across an Escape → NORMAL → INSERT round-trip.
  // textInput保存`useTextInput`，供React hook后续处理使用。
  const textInput = useTextInput({ ...props, inputFilter: undefined })
  // 从 `props` 解构 onModeChange、inputFilter，减少React hook use Vim Input对同一对象的重复访问。
  const { onModeChange, inputFilter } = props

  // switchToInsertMode保存`useCallback`，供React hook后续处理使用。
  const switchToInsertMode = useCallback(
    (offset?: number): void => {
      // `offset` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (offset !== undefined) {
        // textInput.setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        textInput.setOffset(offset)
      }
      // current更新为 `{ mode: 'INSERT', insertedText: '' }`，确保useVimInput后续读取最新状态。
      vimStateRef.current = { mode: 'INSERT', insertedText: '' }
      // setMode 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMode('INSERT')
      // 调用 onModeChange?.('INSERT')，完成这一处局部操作。
      onModeChange?.('INSERT')
    },
    [textInput, onModeChange],
  )

  // switchToNormalMode保存`useCallback`，供React hook后续处理使用。
  const switchToNormalMode = useCallback((): void => {
    // current保存`vimStateRef.current`，供后续判断或组装使用。
    const current = vimStateRef.current
    // 组合条件 `current.mode === 'INSERT' && current.insertedText` 成立时，React hook 状态流才启用这条专门路径。
    if (current.mode === 'INSERT' && current.insertedText) {
      // lastChange更新为 `{`，确保useVimInput后续读取最新状态。
      persistentRef.current.lastChange = {
        type: 'insert',
        text: current.insertedText,
      }
    }

    // Vim behavior: move cursor left by 1 when exiting insert mode
    // (unless at beginning of line or at offset 0)
    // offset保存`textInput.offset`，供后续判断或组装使用。
    const offset = textInput.offset
    // `offset > 0 && props.value[offset - 1]` 与 `'\n'` 不一致时刷新派生状态，避免使用过期结果。
    if (offset > 0 && props.value[offset - 1] !== '\n') {
      // textInput.setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      textInput.setOffset(offset - 1)
    }

    // current更新为 `{ mode: 'NORMAL', command: { type: 'idle' } }`，确保useVimInput后续读取最新状态。
    vimStateRef.current = { mode: 'NORMAL', command: { type: 'idle' } }
    // setMode 写入新的状态值，使React hook 状态流后续读取保持一致。
    setMode('NORMAL')
    // 调用 onModeChange?.('NORMAL')，完成这一处局部操作。
    onModeChange?.('NORMAL')
  }, [onModeChange, textInput, props.value])

  // createOperatorContext 封装useVimInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function createOperatorContext(
    cursor: Cursor,
    isReplay: boolean = false,
  ): OperatorContext {
    // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
    return {
      cursor,
      text: props.value,
      // 这个回调绑定到 setText: (newText: string) => props.onChange(newText),，负责React hook 状态流在该局部场景下的响应。
      setText: (newText: string) => props.onChange(newText),
      // 这个回调绑定到 setOffset: (offset: number) => textInput.setOffset(offset),，负责React hook 状态流在该局部场景下的响应。
      setOffset: (offset: number) => textInput.setOffset(offset),
      // 这个回调绑定到 enterInsert: (offset: number) => switchToInsertMode(offset),，负责React hook 状态流在该局部场景下的响应。
      enterInsert: (offset: number) => switchToInsertMode(offset),
      // 这个回调绑定到 getRegister: () => persistentRef.current.register,，负责React hook 状态流在该局部场景下的响应。
      getRegister: () => persistentRef.current.register,
      // 这个回调绑定到 setRegister: (content: string, linewise: boolean) => {，负责React hook 状态流在该局部场景下的响应。
      setRegister: (content: string, linewise: boolean) => {
        // register更新为 `content`，确保useVimInput后续读取最新状态。
        persistentRef.current.register = content
        // registerIsLinewise更新为 `linewise`，确保useVimInput后续读取最新状态。
        persistentRef.current.registerIsLinewise = linewise
      },
      // 这个回调绑定到 getLastFind: () => persistentRef.current.lastFind,，负责React hook 状态流在该局部场景下的响应。
      getLastFind: () => persistentRef.current.lastFind,
      // 这个回调绑定到 setLastFind: (type, char) => {，负责React hook 状态流在该局部场景下的响应。
      setLastFind: (type, char) => {
        // lastFind更新为 `{ type, char }`，确保useVimInput后续读取最新状态。
        persistentRef.current.lastFind = { type, char }
      },
      recordChange: isReplay
        ? () => {}
        // 这个回调绑定到 : (change: RecordedChange) => {，负责React hook 状态流在该局部场景下的响应。
        : (change: RecordedChange) => {
            // lastChange更新为 `change`，确保useVimInput后续读取最新状态。
            persistentRef.current.lastChange = change
          },
    }
  }

  // replayLastChange 封装useVimInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function replayLastChange(): void {
    // change保存`persistentRef.current.lastChange`，供后续判断或组装使用。
    const change = persistentRef.current.lastChange
    // change缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!change) return

    // cursor保存`Cursor.fromText`，供React hook后续处理使用。
    const cursor = Cursor.fromText(props.value, props.columns, textInput.offset)
    // ctx构建`createOperatorContext`，供React hook后续处理使用。
    const ctx = createOperatorContext(cursor, true)

    // 按照 change.type 的取值选择React hook 状态流的具体处理分支。
    switch (change.type) {
      case 'insert':
        // 满足 `change.text` 时，React hook执行该分支。
        if (change.text) {
          // newCursor保存`cursor.insert`，供React hook后续处理使用。
          const newCursor = cursor.insert(change.text)
          // 调用 props.onChange，触发React hook此处需要的副作用。
          props.onChange(newCursor.text)
          // textInput.setOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          textInput.setOffset(newCursor.offset)
        }
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'x':
        // 调用 executeX，触发React hook此处需要的副作用。
        executeX(change.count, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'replace':
        // 调用 executeReplace，触发React hook此处需要的副作用。
        executeReplace(change.char, change.count, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'toggleCase':
        // 调用 executeToggleCase，触发React hook此处需要的副作用。
        executeToggleCase(change.count, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'indent':
        // 调用 executeIndent，触发React hook此处需要的副作用。
        executeIndent(change.dir, change.count, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'join':
        // 调用 executeJoin，触发React hook此处需要的副作用。
        executeJoin(change.count, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'openLine':
        // 调用 executeOpenLine，触发React hook此处需要的副作用。
        executeOpenLine(change.direction, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'operator':
        // 调用 executeOperatorMotion，触发React hook此处需要的副作用。
        executeOperatorMotion(change.op, change.motion, change.count, ctx)
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'operatorFind':
        // 调用 executeOperatorFind，触发React hook此处需要的副作用。
        executeOperatorFind(
          change.op,
          change.find,
          change.char,
          change.count,
          ctx,
        )
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break

      case 'operatorTextObj':
        // 调用 executeOperatorTextObj，触发React hook此处需要的副作用。
        executeOperatorTextObj(
          change.op,
          change.scope,
          change.objType,
          change.count,
          ctx,
        )
        // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
        break
    }
  }

  // handleVimInput 封装useVimInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function handleVimInput(rawInput: string, key: Key): void {
    // 状态 命名 `vimStateRef.current`，让后续代码直接表达这个值的用途。
    const state = vimStateRef.current
    // Run inputFilter in all modes so stateful filters disarm on any key,
    // but only apply the transformed input in INSERT — NORMAL-mode command
    // lookups expect single chars and a prepended space would break them.
    // filtered保存`inputFilter`，供React hook后续处理使用。
    const filtered = inputFilter ? inputFilter(rawInput, key) : rawInput
    // 用户输入标记React hook use Vim In...是否启用对应路径。
    const input = state.mode === 'INSERT' ? filtered : rawInput
    // cursor保存`Cursor.fromText`，供React hook后续处理使用。
    const cursor = Cursor.fromText(props.value, props.columns, textInput.offset)

    // 满足 `key.ctrl` 时，React hook执行该分支。
    if (key.ctrl) {
      // 调用 textInput.onInput，触发React hook此处需要的副作用。
      textInput.onInput(input, key)
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // NOTE(keybindings): This escape handler is intentionally NOT migrated to the keybindings system.
    // It's vim's standard INSERT->NORMAL mode switch - a vim-specific behavior that should not be
    // configurable via keybindings. Vim users expect Esc to always exit INSERT mode.
    // 当 `key.escape && state.mode` 匹配 `'INSERT'` 时，React hook执行对应分支。
    if (key.escape && state.mode === 'INSERT') {
      // 调用 switchToNormalMode，触发React hook此处需要的副作用。
      switchToNormalMode()
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Escape in NORMAL mode cancels any pending command (replace, operator, etc.)
    // 当 `key.escape && state.mode` 匹配 `'NORMAL'` 时，React hook执行对应分支。
    if (key.escape && state.mode === 'NORMAL') {
      // current更新为 `{ mode: 'NORMAL', command: { type: 'idle' } }`，确保useVimInput后续读取最新状态。
      vimStateRef.current = { mode: 'NORMAL', command: { type: 'idle' } }
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Pass Enter to base handler regardless of mode (allows submission from NORMAL)
    // 满足 `key.return` 时，React hook执行该分支。
    if (key.return) {
      // 调用 textInput.onInput，触发React hook此处需要的副作用。
      textInput.onInput(input, key)
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 当 `state.mode` 匹配 `'INSERT'` 时，React hook执行对应分支。
    if (state.mode === 'INSERT') {
      // Track inserted text for dot-repeat
      // 组合条件 `key.backspace || key.delete` 成立时，React hook 状态流才启用这条专门路径。
      if (key.backspace || key.delete) {
        // 满足 `state.insertedText.length > 0` 时，React hook执行该分支。
        if (state.insertedText.length > 0) {
          // current更新为 `{`，确保useVimInput后续读取最新状态。
          vimStateRef.current = {
            mode: 'INSERT',
            insertedText: state.insertedText.slice(
              0,
              -(lastGrapheme(state.insertedText).length || 1),
            ),
          }
        }
      } else {
        // current更新为 `{`，确保useVimInput后续读取最新状态。
        vimStateRef.current = {
          mode: 'INSERT',
          insertedText: state.insertedText + input,
        }
      }
      // 调用 textInput.onInput，触发React hook此处需要的副作用。
      textInput.onInput(input, key)
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // `state.mode` 与 `'NORMAL'` 不一致时刷新派生状态，避免使用过期结果。
    if (state.mode !== 'NORMAL') {
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // In idle state, delegate arrow keys to base handler for cursor movement
    // and history fallback (upOrHistoryUp / downOrHistoryDown)
    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      state.command.type === 'idle' &&
      (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow)
    ) {
      // 调用 textInput.onInput，触发React hook此处需要的副作用。
      textInput.onInput(input, key)
      // React hook use Vim Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // ctx 集中保存React hook use Vim Input要一起传递的字段。
    const ctx: TransitionContext = {
      ...createOperatorContext(cursor, false),
      onUndo: props.onUndo,
      onDotRepeat: replayLastChange,
    }

    // Backspace/Delete are only mapped in motion-expecting states. In
    // literal-char states (replace, find, operatorFind), mapping would turn
    // r+Backspace into "replace with h" and df+Delete into "delete to next x".
    // Delete additionally skips count state: in vim, N<Del> removes a count
    // digit rather than executing Nx; we don't implement digit removal but
    // should at least not turn a cancel into a destructive Nx.
    // expectsMotion 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const expectsMotion =
      state.command.type === 'idle' ||
      state.command.type === 'count' ||
      state.command.type === 'operator' ||
      state.command.type === 'operatorCount'

    // Map arrow keys to vim motions in NORMAL mode
    // vimInput保存`input`，供React hook use Vim In...后续判断或输出使用。
    let vimInput = input
    // 满足 `key.leftArrow` 时，React hook执行该分支。
    if (key.leftArrow) vimInput = 'h'
    else if (key.rightArrow) vimInput = 'l'
    else if (key.upArrow) vimInput = 'k'
    else if (key.downArrow) vimInput = 'j'
    else if (expectsMotion && key.backspace) vimInput = 'h'
    else if (expectsMotion && state.command.type !== 'count' && key.delete)
      // vimInput更新为 `'x'`，确保useVimInput后续读取最新状态。
      vimInput = 'x'

    // 结果保存`transition`，供React hook后续处理使用。
    const result = transition(state.command, vimInput, ctx)

    // 满足 `result.execute` 时，React hook执行该分支。
    if (result.execute) {
      // 调用 result.execute，触发React hook此处需要的副作用。
      result.execute()
    }

    // Update command state (only if execute didn't switch to INSERT)
    // 当 `vimStateRef.current.mode` 匹配 `'NORMAL'` 时，React hook执行对应分支。
    if (vimStateRef.current.mode === 'NORMAL') {
      // 满足 `result.next` 时，React hook执行该分支。
      if (result.next) {
        // current更新为 `{ mode: 'NORMAL', command: result.next }`，确保useVimInput后续读取最新状态。
        vimStateRef.current = { mode: 'NORMAL', command: result.next }
      // React hook use Vim Input在这里处理 `} else if (result.execute) {`，完成这一小步状态转换。
      } else if (result.execute) {
        // current更新为 `{ mode: 'NORMAL', command: { type: 'idle' } }`，确保useVimInput后续读取最新状态。
        vimStateRef.current = { mode: 'NORMAL', command: { type: 'idle' } }
      }
    }

    // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
    if (
      input === '?' &&
      state.mode === 'NORMAL' &&
      state.command.type === 'idle'
    ) {
      // 调用 props.onChange，触发React hook此处需要的副作用。
      props.onChange('?')
    }
  }

  // setModeExternal保存`useCallback`，供React hook后续处理使用。
  const setModeExternal = useCallback(
    (newMode: VimMode) => {
      // 当 `newMode` 匹配 `'INSERT'` 时，React hook执行对应分支。
      if (newMode === 'INSERT') {
        // current更新为 `{ mode: 'INSERT', insertedText: '' }`，确保useVimInput后续读取最新状态。
        vimStateRef.current = { mode: 'INSERT', insertedText: '' }
      } else {
        // current更新为 `{ mode: 'NORMAL', command: { type: 'idle' } }`，确保useVimInput后续读取最新状态。
        vimStateRef.current = { mode: 'NORMAL', command: { type: 'idle' } }
      }
      // setMode 写入新的状态值，使React hook 状态流后续读取保持一致。
      setMode(newMode)
      // 调用 onModeChange?.(newMode)，完成这一处局部操作。
      onModeChange?.(newMode)
    },
    [onModeChange],
  )

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    ...textInput,
    onInput: handleVimInput,
    mode,
    setMode: setModeExternal,
  }
}
