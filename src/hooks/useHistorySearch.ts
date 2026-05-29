// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 useCallback、useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  getModeFromInput,
  getValueFromInput,
} from '../components/PromptInput/inputModes.js'
// 引入 makeHistoryReader，将 ../history.js 中已经封装好的能力接到本文件流程里。
import { makeHistoryReader } from '../history.js'
// 复用 KeyboardEvent 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeyboardEvent } from '../ink/events/keyboard-event.js'
// eslint-disable-next-line custom-rules/prefer-use-keybindings -- backward-compat bridge until consumers wire handleKeyDown to <Box onKeyDown>
// 引入 useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { useInput } from '../ink.js'
// 引入 useKeybinding、useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding, useKeybindings } from '../keybindings/useKeybinding.js'
// 类型依赖 { PromptInputMode } 来自 ../types/textInputTypes.js，用于校准React hook 状态流的数据契约。
import type { PromptInputMode } from '../types/textInputTypes.js'
// 类型依赖 { HistoryEntry } 来自 ../utils/config.js，用于校准React hook 状态流的数据契约。
import type { HistoryEntry } from '../utils/config.js'

// useHistorySearch 封装useHistorySearch的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useHistorySearch(
  // 这个回调绑定到 onAcceptHistory: (entry: HistoryEntry) => void,，负责React hook 状态流在该局部场景下的响应。
  onAcceptHistory: (entry: HistoryEntry) => void,
  currentInput: string,
  // 这个回调绑定到 onInputChange: (input: string) => void,，负责React hook 状态流在该局部场景下的响应。
  onInputChange: (input: string) => void,
  // 这个回调绑定到 onCursorChange: (cursorOffset: number) => void,，负责React hook 状态流在该局部场景下的响应。
  onCursorChange: (cursorOffset: number) => void,
  currentCursorOffset: number,
  // 这个回调绑定到 onModeChange: (mode: PromptInputMode) => void,，负责React hook 状态流在该局部场景下的响应。
  onModeChange: (mode: PromptInputMode) => void,
  currentMode: PromptInputMode,
  isSearching: boolean,
  // 这个回调绑定到 setIsSearching: (isSearching: boolean) => void,，负责React hook 状态流在该局部场景下的响应。
  setIsSearching: (isSearching: boolean) => void,
  // 这个回调绑定到 setPastedContents: (pastedContents: HistoryEntry['pastedContents']) => void,，负责React hook 状态流在该局部场景下的响应。
  setPastedContents: (pastedContents: HistoryEntry['pastedContents']) => void,
  currentPastedContents: HistoryEntry['pastedContents'],
): {
  historyQuery: string
  // 这个回调绑定到 setHistoryQuery: (query: string) => void，负责React hook 状态流在该局部场景下的响应。
  setHistoryQuery: (query: string) => void
  historyMatch: HistoryEntry | undefined
  historyFailedMatch: boolean
  // 这个回调绑定到 handleKeyDown: (e: KeyboardEvent) => void，负责React hook 状态流在该局部场景下的响应。
  handleKeyDown: (e: KeyboardEvent) => void
} {
  // historyQuery 由 React state 持有，setHistoryQuery 会在用户操作或异步结果返回时触发刷新。
  const [historyQuery, setHistoryQuery] = useState('')
  // historyFailedMatch 由 React state 持有，setHistoryFailedMatch 会在用户操作或异步结果返回时触发刷新。
  const [historyFailedMatch, setHistoryFailedMatch] = useState(false)
  // originalInput 由 React state 持有，setOriginalInput 会在用户操作或异步结果返回时触发刷新。
  const [originalInput, setOriginalInput] = useState('')
  // originalCursorOffset 由 React state 持有，setOriginalCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [originalCursorOffset, setOriginalCursorOffset] = useState(0)
  // originalMode 由 React state 持有，setOriginalMode 会在用户操作或异步结果返回时触发刷新。
  const [originalMode, setOriginalMode] = useState<PromptInputMode>('prompt')
  // 从 `useState<` 按位置拆出 originalPastedContents、setOriginalPastedContents，让React hook use History Search分别处理这些返回值。
  const [originalPastedContents, setOriginalPastedContents] = useState<
    HistoryEntry['pastedContents']
  >({})
  // 从 `useState<HistoryEntry | undefined>(` 按位置拆出 historyMatch、setHistoryMatch，让React hook use History Search分别处理这些返回值。
  const [historyMatch, setHistoryMatch] = useState<HistoryEntry | undefined>(
    undefined,
  )
  // historyReader读取 hook 状态，供React hook use Histor...本轮渲染使用。
  const historyReader = useRef<AsyncGenerator<HistoryEntry> | undefined>(
    undefined,
  )
  // seenPrompts 集合保存`Set`，供React hook后续处理使用。
  const seenPrompts = useRef<Set<string>>(new Set())
  // searchAbortController读取 hook 状态，供React hook use Histor...本轮渲染使用。
  const searchAbortController = useRef<AbortController | null>(null)

  // closeHistoryReader保存`useCallback`，供React hook后续处理使用。
  const closeHistoryReader = useCallback((): void => {
    // 满足 `historyReader.current` 时，React hook执行该分支。
    if (historyReader.current) {
      // Must explicitly call .return() to trigger the finally block in readLinesReverse,
      // which closes the file handle. Without this, file descriptors leak.
      // 显式忽略 `historyReader.current.return(undefined)` 的返回值，只保留它触发的副作用。
      void historyReader.current.return(undefined)
      // current更新为 `undefined`，确保useHistorySearch后续读取最新状态。
      historyReader.current = undefined
    }
  }, [])

  // reset保存`useCallback`，供React hook后续处理使用。
  const reset = useCallback((): void => {
    // setIsSearching 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsSearching(false)
    // setHistoryQuery 写入新的状态值，使React hook 状态流后续读取保持一致。
    setHistoryQuery('')
    // setHistoryFailedMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
    setHistoryFailedMatch(false)
    // setOriginalInput 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalInput('')
    // setOriginalCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalCursorOffset(0)
    // setOriginalMode 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalMode('prompt')
    // setOriginalPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalPastedContents({})
    // setHistoryMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
    setHistoryMatch(undefined)
    // 调用 closeHistoryReader，触发React hook此处需要的副作用。
    closeHistoryReader()
    // 调用 seenPrompts.current.clear，触发React hook此处需要的副作用。
    seenPrompts.current.clear()
  }, [setIsSearching, closeHistoryReader])

  // searchHistory保存`useCallback`，供React hook后续处理使用。
  const searchHistory = useCallback(
    async (resume: boolean, signal?: AbortSignal): Promise<void> => {
      // isSearching缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!isSearching) {
        // React hook use History Search在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // historyQuery为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
      if (historyQuery.length === 0) {
        // 调用 closeHistoryReader，触发React hook此处需要的副作用。
        closeHistoryReader()
        // 调用 seenPrompts.current.clear，触发React hook此处需要的副作用。
        seenPrompts.current.clear()
        // setHistoryMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
        setHistoryMatch(undefined)
        // setHistoryFailedMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
        setHistoryFailedMatch(false)
        // 调用 onInputChange，触发React hook此处需要的副作用。
        onInputChange(originalInput)
        // 调用 onCursorChange，触发React hook此处需要的副作用。
        onCursorChange(originalCursorOffset)
        // 调用 onModeChange，触发React hook此处需要的副作用。
        onModeChange(originalMode)
        // setPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
        setPastedContents(originalPastedContents)
        // React hook use History Search在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // resume缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!resume) {
        // 调用 closeHistoryReader，触发React hook此处需要的副作用。
        closeHistoryReader()
        // current更新为 `makeHistoryReader()`，确保useHistorySearch后续读取最新状态。
        historyReader.current = makeHistoryReader()
        // 调用 seenPrompts.current.clear，触发React hook此处需要的副作用。
        seenPrompts.current.clear()
      }

      // historyReader.current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!historyReader.current) {
        // React hook use History Search在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // while 使用 true 完成React hook 状态流里的对应操作。
      while (true) {
        // 满足 `signal?.aborted` 时，React hook执行该分支。
        if (signal?.aborted) {
          // React hook use History Search在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // item保存`current.next`，供React hook后续处理使用。
        const item = await historyReader.current.next()
        // 满足 `item.done` 时，React hook执行该分支。
        if (item.done) {
          // No match found - keep last match but mark as failed
          // setHistoryFailedMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
          setHistoryFailedMatch(true)
          // React hook use History Search在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // display 命名 `item.value.display`，让后续代码直接表达这个值的用途。
        const display = item.value.display

        // matchPosition保存`display.lastIndexOf`，供React hook后续处理使用。
        const matchPosition = display.lastIndexOf(historyQuery)
        // `matchPosition` 与 `-1 && !seenPrompts.current.has(...` 不一致时刷新派生状态，避免使用过期结果。
        if (matchPosition !== -1 && !seenPrompts.current.has(display)) {
          // 调用 seenPrompts.current.add，触发React hook此处需要的副作用。
          seenPrompts.current.add(display)
          // setHistoryMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
          setHistoryMatch(item.value)
          // setHistoryFailedMatch 写入新的状态值，使React hook 状态流后续读取保持一致。
          setHistoryFailedMatch(false)
          // mode读取`getModeFromInput`，供React hook后续处理使用。
          const mode = getModeFromInput(display)
          // 调用 onModeChange，触发React hook此处需要的副作用。
          onModeChange(mode)
          // 调用 onInputChange，触发React hook此处需要的副作用。
          onInputChange(display)
          // setPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
          setPastedContents(item.value.pastedContents)

          // Position cursor relative to the clean value, not the display
          // 取值读取`getValueFromInput`，供React hook后续处理使用。
          const value = getValueFromInput(display)
          // cleanMatchPosition保存`value.lastIndexOf`，供React hook后续处理使用。
          const cleanMatchPosition = value.lastIndexOf(historyQuery)
          // 调用 onCursorChange，触发React hook此处需要的副作用。
          onCursorChange(
            cleanMatchPosition !== -1 ? cleanMatchPosition : matchPosition,
          )
          // React hook use History Search在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
      }
    },
    [
      isSearching,
      historyQuery,
      closeHistoryReader,
      onInputChange,
      onCursorChange,
      onModeChange,
      setPastedContents,
      originalInput,
      originalCursorOffset,
      originalMode,
      originalPastedContents,
    ],
  )

  // Handler: Start history search (when not searching)
  // handleStartSearch保存`useCallback`，供React hook后续处理使用。
  const handleStartSearch = useCallback(() => {
    // setIsSearching 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsSearching(true)
    // setOriginalInput 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalInput(currentInput)
    // setOriginalCursorOffset 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalCursorOffset(currentCursorOffset)
    // setOriginalMode 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalMode(currentMode)
    // setOriginalPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
    setOriginalPastedContents(currentPastedContents)
    // current更新为 `makeHistoryReader()`，确保useHistorySearch后续读取最新状态。
    historyReader.current = makeHistoryReader()
    // 调用 seenPrompts.current.clear，触发React hook此处需要的副作用。
    seenPrompts.current.clear()
  }, [
    setIsSearching,
    currentInput,
    currentCursorOffset,
    currentMode,
    currentPastedContents,
  ])

  // Handler: Find next match (when searching)
  // handleNextMatch保存`useCallback`，供React hook后续处理使用。
  const handleNextMatch = useCallback(() => {
    // 显式忽略 `searchHistory(true)` 的返回值，只保留它触发的副作用。
    void searchHistory(true)
  }, [searchHistory])

  // Handler: Accept current match and exit search
  // handleAccept保存`useCallback`，供React hook后续处理使用。
  const handleAccept = useCallback(() => {
    // 满足 `historyMatch` 时，React hook执行该分支。
    if (historyMatch) {
      // mode读取`getModeFromInput`，供React hook后续处理使用。
      const mode = getModeFromInput(historyMatch.display)
      // 取值读取`getValueFromInput`，供React hook后续处理使用。
      const value = getValueFromInput(historyMatch.display)
      // 调用 onInputChange，触发React hook此处需要的副作用。
      onInputChange(value)
      // 调用 onModeChange，触发React hook此处需要的副作用。
      onModeChange(mode)
      // setPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
      setPastedContents(historyMatch.pastedContents)
    } else {
      // No match - restore original pasted contents
      // setPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
      setPastedContents(originalPastedContents)
    }
    // 调用 reset，触发React hook此处需要的副作用。
    reset()
  }, [
    historyMatch,
    onInputChange,
    onModeChange,
    setPastedContents,
    originalPastedContents,
    reset,
  ])

  // Handler: Cancel search and restore original input
  // handleCancel保存`useCallback`，供React hook后续处理使用。
  const handleCancel = useCallback(() => {
    // 调用 onInputChange，触发React hook此处需要的副作用。
    onInputChange(originalInput)
    // 调用 onCursorChange，触发React hook此处需要的副作用。
    onCursorChange(originalCursorOffset)
    // setPastedContents 写入新的状态值，使React hook 状态流后续读取保持一致。
    setPastedContents(originalPastedContents)
    // 调用 reset，触发React hook此处需要的副作用。
    reset()
  }, [
    onInputChange,
    onCursorChange,
    setPastedContents,
    originalInput,
    originalCursorOffset,
    originalPastedContents,
    reset,
  ])

  // Handler: Execute (accept and submit)
  // handleExecute保存`useCallback`，供React hook后续处理使用。
  const handleExecute = useCallback(() => {
    // historyQuery为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
    if (historyQuery.length === 0) {
      // 调用 onAcceptHistory，触发React hook此处需要的副作用。
      onAcceptHistory({
        display: originalInput,
        pastedContents: originalPastedContents,
      })
    // React hook use History Search在这里处理 `} else if (historyMatch) {`，完成这一小步状态转换。
    } else if (historyMatch) {
      // mode读取`getModeFromInput`，供React hook后续处理使用。
      const mode = getModeFromInput(historyMatch.display)
      // 取值读取`getValueFromInput`，供React hook后续处理使用。
      const value = getValueFromInput(historyMatch.display)
      // 调用 onModeChange，触发React hook此处需要的副作用。
      onModeChange(mode)
      // 调用 onAcceptHistory，触发React hook此处需要的副作用。
      onAcceptHistory({
        display: value,
        pastedContents: historyMatch.pastedContents,
      })
    }
    // 调用 reset，触发React hook此处需要的副作用。
    reset()
  }, [
    historyQuery,
    historyMatch,
    onAcceptHistory,
    onModeChange,
    originalInput,
    originalPastedContents,
    reset,
  ])

  // Gated off under HISTORY_PICKER — the modal dialog owns ctrl+r there.
  // 调用 useKeybinding，触发React hook此处需要的副作用。
  useKeybinding('history:search', handleStartSearch, {
    context: 'Global',
    isActive: feature('HISTORY_PICKER') ? false : !isSearching,
  })

  // History search context keybindings (only active when searching)
  // historySearchHandlers 集合保存`useMemo`，供React hook后续处理使用。
  const historySearchHandlers = useMemo(
    () => ({
      'historySearch:next': handleNextMatch,
      'historySearch:accept': handleAccept,
      'historySearch:cancel': handleCancel,
      'historySearch:execute': handleExecute,
    }),
    [handleNextMatch, handleAccept, handleCancel, handleExecute],
  )

  // 调用 useKeybindings，触发React hook此处需要的副作用。
  useKeybindings(historySearchHandlers, {
    context: 'HistorySearch',
    isActive: isSearching,
  })

  // Handle backspace when query is empty (cancels search)
  // This is a conditional behavior that doesn't fit the keybinding model
  // well (backspace only cancels when query is empty)
  // handleKeyDown封装成回调，供React hook use Histor...在事件触发或异步步骤中调用。
  const handleKeyDown = (e: KeyboardEvent): void => {
    // isSearching缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!isSearching) return
    // 当 `e.key` 匹配 `'backspace' && historyQuery...` 时，React hook执行对应分支。
    if (e.key === 'backspace' && historyQuery === '') {
      // 调用 e.preventDefault，触发React hook此处需要的副作用。
      e.preventDefault()
      // 调用 handleCancel，触发React hook此处需要的副作用。
      handleCancel()
    }
  }

  // Backward-compat bridge: PromptInput doesn't yet wire handleKeyDown to
  // <Box onKeyDown>. Subscribe via useInput and adapt InputEvent →
  // KeyboardEvent until the consumer is migrated (separate PR).
  // TODO(onKeyDown-migration): remove once PromptInput passes handleKeyDown.
  // 调用 useInput，触发React hook此处需要的副作用。
  useInput(
    // 这个回调绑定到 (_input, _key, event) => {，负责React hook 状态流在该局部场景下的响应。
    (_input, _key, event) => {
      // 调用 handleKeyDown，触发React hook此处需要的副作用。
      handleKeyDown(new KeyboardEvent(event.keypress))
    },
    { isActive: isSearching },
  )

  // Keep a ref to searchHistory to avoid it being a dependency of useEffect
  // searchHistoryRef 引用保存`useRef`，供React hook后续处理使用。
  const searchHistoryRef = useRef(searchHistory)
  // current更新为 `searchHistory`，确保useHistorySearch后续读取最新状态。
  searchHistoryRef.current = searchHistory

  // Reset history search when query changes
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(() => {
    // 调用 searchAbortController.current?.abort()，完成这一处局部操作。
    searchAbortController.current?.abort()
    // controller保存`AbortController`，供React hook后续处理使用。
    const controller = new AbortController()
    // current更新为 `controller`，确保useHistorySearch后续读取最新状态。
    searchAbortController.current = controller
    // 显式忽略 `searchHistoryRef.current(false, controller.signal)` 的返回值，只保留它触发的副作用。
    void searchHistoryRef.current(false, controller.signal)
    // 返回 `() => {`，作为React hook 状态流这次计算的结果。
    return () => {
      // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
      controller.abort()
    }
  }, [historyQuery])

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    historyQuery,
    setHistoryQuery,
    historyMatch,
    historyFailedMatch,
    handleKeyDown,
  }
}
