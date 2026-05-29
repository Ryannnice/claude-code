// 引入 useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useState } from 'react'
// 复用 KeyboardEvent 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardEvent } from '../ink/events/keyboard-event.js'
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- backward-compat bridge until consumers wire handleKeyDown to <Box onKeyDown>
// 引入 useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { useInput } from '../ink.js'
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
// 引入 useTerminalSize，将 ./useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from './useTerminalSize.js'

// UseSearchInputOptions 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSearchInputOptions = {
  isActive: boolean
  // 这个回调绑定到 onExit: () => void，负责React hook 状态流在该局部场景下的响应。
  onExit: () => void
  /** Esc + Ctrl+C abandon (distinct from onExit = Enter commit). When
   *  provided: single-Esc calls this directly (no clear-first-then-exit
   *  two-press). When absent: current behavior — Esc clears non-empty
   *  query, exits on empty; Ctrl+C silently swallowed (no switch case). */
  // 这个回调绑定到 onCancel?: () => void，负责React hook 状态流在该局部场景下的响应。
  onCancel?: () => void
  // 这个回调绑定到 onExitUp?: () => void，负责React hook 状态流在该局部场景下的响应。
  onExitUp?: () => void
  columns?: number
  passthroughCtrlKeys?: string[]
  initialQuery?: string
  /** Backspace (and ctrl+h) on empty query calls onCancel ?? onExit — the
   *  less/vim "delete past the /" convention. Dialogs that want Esc-only
   *  cancel set this false so a held backspace doesn't eject the user. */
  backspaceExitsOnEmpty?: boolean
}

// UseSearchInputReturn 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseSearchInputReturn = {
  query: string
  // 这个回调绑定到 setQuery: (q: string) => void，负责React hook 状态流在该局部场景下的响应。
  setQuery: (q: string) => void
  cursorOffset: number
  // 这个回调绑定到 handleKeyDown: (e: KeyboardEvent) => void，负责React hook 状态流在该局部场景下的响应。
  handleKeyDown: (e: KeyboardEvent) => void
}

// isKillKey 封装useSearchInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isKillKey(e: KeyboardEvent): boolean {
  // 组合条件 `e.ctrl && (e.key === 'k' || e.key === 'u' || e.key === 'w')` 成立时，React hook 状态流才启用这条专门路径。
  if (e.ctrl && (e.key === 'k' || e.key === 'u' || e.key === 'w')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 当 `e.meta && e.key` 匹配 `'backspace'` 时，React hook执行对应分支。
  if (e.meta && e.key === 'backspace') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// isYankKey 封装useSearchInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isYankKey(e: KeyboardEvent): boolean {
  // 返回 `(e.ctrl || e.meta) && e.key === 'y'`，作为React hook 状态流这次计算的结果。
  return (e.ctrl || e.meta) && e.key === 'y'
}

// Special key names that fall through the explicit handlers above the
// text-input branch (return/escape/arrows/home/end/tab/backspace/delete
// all early-return). Reject these so e.g. PageUp doesn't leak 'pageup'
// as literal text. The length>=1 check below is intentionally loose —
// batched input like stdin.write('abc') arrives as one multi-char e.key,
// matching the old useInput(input) behavior where cursor.insert(input)
// inserted the full chunk.
// UNHANDLED_SPECIAL_KEYS 集合保存`Set`，供React hook后续处理使用。
const UNHANDLED_SPECIAL_KEYS = new Set([
  'pageup',
  'pagedown',
  'insert',
  'wheelup',
  'wheeldown',
  'mouse',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'f6',
  'f7',
  'f8',
  'f9',
  'f10',
  'f11',
  'f12',
])

// useSearchInput 封装useSearchInput的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSearchInput({
  isActive,
  onExit,
  onCancel,
  onExitUp,
  columns,
  passthroughCtrlKeys = [],
  initialQuery = '',
  backspaceExitsOnEmpty = true,
}: UseSearchInputOptions): UseSearchInputReturn {
  // 从 `useTerminalSize()` 解构 columns，减少React hook use Search Input对同一对象的重复访问。
  const { columns: terminalColumns } = useTerminalSize()
  // effectiveColumns 集合 命名 `columns ?? terminalColumns`，让后续代码直接表达这个值的用途。
  const effectiveColumns = columns ?? terminalColumns
  // query 由 React state 持有，setQueryState 会在用户操作或异步结果返回时触发刷新。
  const [query, setQueryState] = useState(initialQuery)
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(initialQuery.length)

  // setQuery保存`useCallback`，供React hook后续处理使用。
  const setQuery = useCallback((q: string) => {
    // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setQueryState(q)
    // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
    setCursorOffset(q.length)
  }, [])

  // handleKeyDown封装成回调，供React hook use Search...在事件触发或异步步骤中调用。
  const handleKeyDown = (e: KeyboardEvent): void => {
    // isActive缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!isActive) return

    // cursor保存`Cursor.fromText`，供React hook后续处理使用。
    const cursor = Cursor.fromText(query, effectiveColumns, cursorOffset)

    // Check passthrough ctrl keys
    // 组合条件 `e.ctrl && passthroughCtrlKeys.includes(e.key.toLowerCase())` 成立时，React hook 状态流才启用这条专门路径。
    if (e.ctrl && passthroughCtrlKeys.includes(e.key.toLowerCase())) {
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Reset kill accumulation for non-kill keys
    // 满足 `!isKillKey(e)` 时，React hook执行该分支。
    if (!isKillKey(e)) {
      // 调用 resetKillAccumulation，触发React hook此处需要的副作用。
      resetKillAccumulation()
    }

    // Reset yank state for non-yank keys
    // 满足 `!isYankKey(e)` 时，React hook执行该分支。
    if (!isYankKey(e)) {
      // 调用 resetYankState，触发React hook此处需要的副作用。
      resetYankState()
    }

    // Exit conditions
    // 当 `e.key` 匹配 `'return' || e.key === 'down'` 时，React hook执行对应分支。
    if (e.key === 'return' || e.key === 'down') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 调用 onExit，触发React hook此处需要的副作用。
      onExit()
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 当 `e.key` 匹配 `'up'` 时，React hook执行对应分支。
    if (e.key === 'up') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 满足 `onExitUp` 时，React hook执行该分支。
      if (onExitUp) {
        // 调用 onExitUp，触发React hook此处需要的副作用。
        onExitUp()
      }
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 当 `e.key` 匹配 `'escape'` 时，React hook执行对应分支。
    if (e.key === 'escape') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 满足 `onCancel` 时，React hook执行该分支。
      if (onCancel) {
        // 调用 onCancel，触发React hook此处需要的副作用。
        onCancel()
      // React hook use Search Input在这里处理 `} else if (query.length > 0) {`，完成这一小步状态转换。
      } else if (query.length > 0) {
        // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setQueryState('')
        // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        setCursorOffset(0)
      } else {
        // 调用 onExit，触发React hook此处需要的副作用。
        onExit()
      }
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Backspace/Delete
    // 当 `e.key` 匹配 `'backspace'` 时，React hook执行对应分支。
    if (e.key === 'backspace') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 满足 `e.meta` 时，React hook执行该分支。
      if (e.meta) {
        // Meta+Backspace: kill word before
        // 从 `cursor.deleteWordBefore()` 解构 cursor、killed，减少React hook use Search Input对同一对象的重复访问。
        const { cursor: newCursor, killed } = cursor.deleteWordBefore()
        // 调用 pushToKillRing，触发React hook此处需要的副作用。
        pushToKillRing(killed, 'prepend')
        // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setQueryState(newCursor.text)
        // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
        setCursorOffset(newCursor.offset)
        // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // query为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
      if (query.length === 0) {
        // Backspace past the / — cancel (clear + snap back), not commit.
        // less: same. vim: deletes the / and exits command mode.
        // 满足 `backspaceExitsOnEmpty) (onCancel ?? onExit)(` 时，React hook执行该分支。
        if (backspaceExitsOnEmpty) (onCancel ?? onExit)()
        // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // newCursor保存`cursor.backspace`，供React hook后续处理使用。
      const newCursor = cursor.backspace()
      // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setQueryState(newCursor.text)
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 当 `e.key` 匹配 `'delete'` 时，React hook执行对应分支。
    if (e.key === 'delete') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // newCursor保存`cursor.del`，供React hook后续处理使用。
      const newCursor = cursor.del()
      // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setQueryState(newCursor.text)
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Arrow keys with modifiers (word jump)
    // 组合条件 `e.key === 'left' && (e.ctrl || e.meta || e.fn)` 成立时，React hook 状态流才启用这条专门路径。
    if (e.key === 'left' && (e.ctrl || e.meta || e.fn)) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // newCursor保存`cursor.prevWord`，供React hook后续处理使用。
      const newCursor = cursor.prevWord()
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 组合条件 `e.key === 'right' && (e.ctrl || e.meta || e.fn)` 成立时，React hook 状态流才启用这条专门路径。
    if (e.key === 'right' && (e.ctrl || e.meta || e.fn)) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // newCursor保存`cursor.nextWord`，供React hook后续处理使用。
      const newCursor = cursor.nextWord()
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Plain arrow keys
    // 当 `e.key` 匹配 `'left'` 时，React hook执行对应分支。
    if (e.key === 'left') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // newCursor保存`cursor.left`，供React hook后续处理使用。
      const newCursor = cursor.left()
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 当 `e.key` 匹配 `'right'` 时，React hook执行对应分支。
    if (e.key === 'right') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // newCursor保存`cursor.right`，供React hook后续处理使用。
      const newCursor = cursor.right()
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Home/End
    // 当 `e.key` 匹配 `'home'` 时，React hook执行对应分支。
    if (e.key === 'home') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(0)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 当 `e.key` 匹配 `'end'` 时，React hook执行对应分支。
    if (e.key === 'end') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(query.length)
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Ctrl key bindings
    // 满足 `e.ctrl` 时，React hook执行该分支。
    if (e.ctrl) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 依据 e.key.toLowerCase() 的取值选择React hook 状态流的具体处理分支。
      switch (e.key.toLowerCase()) {
        case 'a':
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(0)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        case 'e':
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(query.length)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        case 'b':
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(cursor.left().offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        case 'f':
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(cursor.right().offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        case 'd': {
          // query为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
          if (query.length === 0) {
            // React hook use Search Input在这里处理 `;(onCancel ?? onExit)()`，完成这一小步状态转换。
            ;(onCancel ?? onExit)()
            // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // newCursor保存`cursor.del`，供React hook后续处理使用。
          const newCursor = cursor.del()
          // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setQueryState(newCursor.text)
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(newCursor.offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'h': {
          // query为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
          if (query.length === 0) {
            // 满足 `backspaceExitsOnEmpty) (onCancel ?? onExit)(` 时，React hook执行该分支。
            if (backspaceExitsOnEmpty) (onCancel ?? onExit)()
            // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
          // newCursor保存`cursor.backspace`，供React hook后续处理使用。
          const newCursor = cursor.backspace()
          // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setQueryState(newCursor.text)
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(newCursor.offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'k': {
          // 从 `cursor.deleteToLineEnd()` 解构 cursor、killed，减少React hook use Search Input对同一对象的重复访问。
          const { cursor: newCursor, killed } = cursor.deleteToLineEnd()
          // 调用 pushToKillRing，触发React hook此处需要的副作用。
          pushToKillRing(killed, 'append')
          // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setQueryState(newCursor.text)
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(newCursor.offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'u': {
          // 从 `cursor.deleteToLineStart()` 解构 cursor、killed，减少React hook use Search Input对同一对象的重复访问。
          const { cursor: newCursor, killed } = cursor.deleteToLineStart()
          // 调用 pushToKillRing，触发React hook此处需要的副作用。
          pushToKillRing(killed, 'prepend')
          // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setQueryState(newCursor.text)
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(newCursor.offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'w': {
          // 从 `cursor.deleteWordBefore()` 解构 cursor、killed，减少React hook use Search Input对同一对象的重复访问。
          const { cursor: newCursor, killed } = cursor.deleteWordBefore()
          // 调用 pushToKillRing，触发React hook此处需要的副作用。
          pushToKillRing(killed, 'prepend')
          // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setQueryState(newCursor.text)
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(newCursor.offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'y': {
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
            // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
            setQueryState(newCursor.text)
            // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
            setCursorOffset(newCursor.offset)
          }
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'g':
        case 'c':
          // Cancel (abandon search). ctrl+g is less's cancel key. Only
          // fires if onCancel provided — otherwise falls through and
          // returns silently (11 call sites, most expect ctrl+c to no-op).
          // 满足 `onCancel` 时，React hook执行该分支。
          if (onCancel) {
            // 调用 onCancel，触发React hook此处需要的副作用。
            onCancel()
            // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }
      }
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Meta key bindings
    // 满足 `e.meta` 时，React hook执行该分支。
    if (e.meta) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 依据 e.key.toLowerCase() 的取值选择React hook 状态流的具体处理分支。
      switch (e.key.toLowerCase()) {
        case 'b':
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(cursor.prevWord().offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        case 'f':
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(cursor.nextWord().offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        case 'd': {
          // newCursor保存`cursor.deleteWordAfter`，供React hook后续处理使用。
          const newCursor = cursor.deleteWordAfter()
          // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
          setQueryState(newCursor.text)
          // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
          setCursorOffset(newCursor.offset)
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        case 'y': {
          // popResult保存`yankPop`，供React hook后续处理使用。
          const popResult = yankPop()
          // 满足 `popResult` 时，React hook执行该分支。
          if (popResult) {
            // 从 `popResult` 解构 text、start、length，减少React hook use Search Input对同一对象的重复访问。
            const { text, start, length } = popResult
            // before格式化`query.slice`，供React hook后续处理使用。
            const before = query.slice(0, start)
            // after格式化`query.slice`，供React hook后续处理使用。
            const after = query.slice(start + length)
            // newText 命名 `before + text + after`，让后续代码直接表达这个值的用途。
            const newText = before + text + after
            // newOffset 命名 `start + text.length`，让后续代码直接表达这个值的用途。
            const newOffset = start + text.length
            // 调用 updateYankLength，触发React hook此处需要的副作用。
            updateYankLength(text.length)
            // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
            setQueryState(newText)
            // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
            setCursorOffset(newOffset)
          }
          // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Tab: ignore
    // 当 `e.key` 匹配 `'tab'` 时，React hook执行对应分支。
    if (e.key === 'tab') {
      // React hook use Search Input在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Regular character input. Accepts multi-char e.key so batched writes
    // (stdin.write('abc') in tests, or paste outside bracketed-paste mode)
    // insert the full chunk — matching the old useInput behavior.
    // 组合条件 `e.key.length >= 1 && !UNHANDLED_SPECIAL_KEYS.has(e.key)` 成立时，React hook 状态流才启用这条专门路径。
    if (e.key.length >= 1 && !UNHANDLED_SPECIAL_KEYS.has(e.key)) {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // newCursor保存`cursor.insert`，供React hook后续处理使用。
      const newCursor = cursor.insert(e.key)
      // setQueryState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setQueryState(newCursor.text)
      // setCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
      setCursorOffset(newCursor.offset)
    }
  }

  // Backward-compat bridge: existing consumers don't yet wire handleKeyDown
  // to <Box onKeyDown>. Subscribe via useInput and adapt InputEvent →
  // KeyboardEvent until all 11 call sites are migrated (separate PRs).
  // TODO(onKeyDown-migration): remove once all consumers pass handleKeyDown.
  // 调用 useInput，触发React hook此处需要的副作用。
  useInput(
    // 这个回调绑定到 (_input, _key, event) => {，负责React hook 状态流在该局部场景下的响应。
    (_input, _key, event) => {
      // 调用 handleKeyDown，触发React hook此处需要的副作用。
      handleKeyDown(new KeyboardEvent(event.keypress))
    },
    { isActive },
  )

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return { query, setQuery, cursorOffset, handleKeyDown }
}
