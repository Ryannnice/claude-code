// 引入 useCallback、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useRef } from 'react'
// 复用 useTerminalFocus 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTerminalFocus } from '../ink/hooks/use-terminal-focus.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../services/analytics/index.js'
// 接入 abortSpeculation 服务层能力，把外部通信或共享状态交给 ../services/PromptSuggestion/speculation.js 处理。
import { abortSpeculation } from '../services/PromptSuggestion/speculation.js'
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js'

// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  inputValue: string
  isAssistantResponding: boolean
}

// usePromptSuggestion 封装usePromptSuggestion的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePromptSuggestion({
  inputValue,
  isAssistantResponding,
}: Props): {
  suggestion: string | null
  // 这个回调绑定到 markAccepted: () => void，负责React hook 状态流在该局部场景下的响应。
  markAccepted: () => void
  // 这个回调绑定到 markShown: () => void，负责React hook 状态流在该局部场景下的响应。
  markShown: () => void
  // React hook use Prompt Suggestion在这里处理 `logOutcomeAtSubmission: (`，完成这一小步状态转换。
  logOutcomeAtSubmission: (
    finalInput: string,
    opts?: { skipReset: boolean },
  ) => void
} {
  // promptSuggestion保存`useAppState`，供React hook后续处理使用。
  const promptSuggestion = useAppState(s => s.promptSuggestion)
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // isTerminalFocused记录 `useTerminalFocus` 是否成立，React hook随后按该结果分支。
  const isTerminalFocused = useTerminalFocus()
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text: suggestionText,
    promptId,
    shownAt,
    acceptedAt,
    generationRequestId,
  } = promptSuggestion

  // suggestion 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const suggestion =
    isAssistantResponding || inputValue.length > 0 ? null : suggestionText

  // isValidSuggestion标记React hook use Prompt...是否启用对应路径。
  const isValidSuggestion = suggestionText && shownAt > 0

  // Track engagement depth for telemetry
  // firstKeystrokeAt读取 hook 状态，供React hook use Prompt...本轮渲染使用。
  const firstKeystrokeAt = useRef<number>(0)
  // wasFocusedWhenShown读取 hook 状态，供React hook use Prompt...本轮渲染使用。
  const wasFocusedWhenShown = useRef<boolean>(true)
  // prevShownAt读取 hook 状态，供React hook use Prompt...本轮渲染使用。
  const prevShownAt = useRef<number>(0)

  // Capture focus state when a new suggestion appears (shownAt changes)
  // `shownAt > 0 && shownAt` 与 `prevShownAt.current` 不一致时刷新派生状态，避免使用过期结果。
  if (shownAt > 0 && shownAt !== prevShownAt.current) {
    // current更新为 `shownAt`，确保usePromptSuggestion后续读取最新状态。
    prevShownAt.current = shownAt
    // current更新为 `isTerminalFocused`，确保usePromptSuggestion后续读取最新状态。
    wasFocusedWhenShown.current = isTerminalFocused
    // current更新为 `0`，确保usePromptSuggestion后续读取最新状态。
    firstKeystrokeAt.current = 0
  // React hook use Prompt Suggestion在这里处理 `} else if (shownAt === 0) {`，完成这一小步状态转换。
  } else if (shownAt === 0) {
    // current更新为 `0`，确保usePromptSuggestion后续读取最新状态。
    prevShownAt.current = 0
  }

  // Record first keystroke while suggestion is visible
  // React hook 状态流在这里进入条件判断，后续代码按实际状态分流。
  if (
    inputValue.length > 0 &&
    firstKeystrokeAt.current === 0 &&
    isValidSuggestion
  ) {
    // current更新为 `Date.now()`，确保usePromptSuggestion后续读取最新状态。
    firstKeystrokeAt.current = Date.now()
  }

  // resetSuggestion保存`useCallback`，供React hook后续处理使用。
  const resetSuggestion = useCallback(() => {
    // 触发取消信号，通知React hook 状态流中仍在等待的异步任务尽快停止。
    abortSpeculation(setAppState)

    // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      promptSuggestion: {
        text: null,
        promptId: null,
        shownAt: 0,
        acceptedAt: 0,
        generationRequestId: null,
      },
    }))
  }, [setAppState])

  // markAccepted保存`useCallback`，供React hook后续处理使用。
  const markAccepted = useCallback(() => {
    // isValidSuggestion缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!isValidSuggestion) return
    // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      promptSuggestion: {
        ...prev.promptSuggestion,
        acceptedAt: Date.now(),
      },
    }))
  }, [isValidSuggestion, setAppState])

  // markShown保存`useCallback`，供React hook后续处理使用。
  const markShown = useCallback(() => {
    // Check shownAt inside setAppState callback to avoid depending on it
    // (depending on shownAt causes infinite loop when this callback is called)
    // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
    setAppState(prev => {
      // Only mark shown if not already shown and suggestion exists
      // `prev.promptSuggestion.shownAt` 与 `0 || !prev.prom` 不一致时刷新派生状态，避免使用过期结果。
      if (prev.promptSuggestion.shownAt !== 0 || !prev.promptSuggestion.text) {
        // 返回 `prev`，作为React hook 状态流这次计算的结果。
        return prev
      }
      // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
      return {
        ...prev,
        promptSuggestion: {
          ...prev.promptSuggestion,
          shownAt: Date.now(),
        },
      }
    })
  }, [setAppState])

  // logOutcomeAtSubmission保存`useCallback`，供React hook后续处理使用。
  const logOutcomeAtSubmission = useCallback(
    (finalInput: string, opts?: { skipReset: boolean }) => {
      // isValidSuggestion缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!isValidSuggestion) return

      // Determine if accepted: either Tab was pressed (acceptedAt set) OR
      // final input matches suggestion (empty Enter case)
      // tabWasPressed 命名 `acceptedAt > shownAt`，让后续代码直接表达这个值的用途。
      const tabWasPressed = acceptedAt > shownAt
      // wasAccepted标记React hook use Prompt...是否启用对应路径。
      const wasAccepted = tabWasPressed || finalInput === suggestionText
      // timeMs 集合记录时间`Date.now`，供React hook后续处理使用。
      const timeMs = wasAccepted ? acceptedAt || Date.now() : Date.now()

      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_prompt_suggestion', {
        source:
          'cli' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        outcome: (wasAccepted
          ? 'accepted'
          : 'ignored') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        prompt_id:
          promptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...(generationRequestId && {
          generationRequestId:
            generationRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(wasAccepted && {
          acceptMethod: (tabWasPressed
            ? 'tab'
            : 'enter') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
        ...(wasAccepted && {
          timeToAcceptMs: timeMs - shownAt,
        }),
        ...(!wasAccepted && {
          timeToIgnoreMs: timeMs - shownAt,
        }),
        ...(firstKeystrokeAt.current > 0 && {
          timeToFirstKeystrokeMs: firstKeystrokeAt.current - shownAt,
        }),
        wasFocusedWhenShown: wasFocusedWhenShown.current,
        similarity:
          Math.round(
            (finalInput.length / (suggestionText?.length || 1)) * 100,
          ) / 100,
        ...(process.env.USER_TYPE === 'ant' && {
          suggestion:
            suggestionText as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          userInput:
            finalInput as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }),
      })
      // 满足 `!opts?.skipReset) resetSuggestion(` 时，React hook执行该分支。
      if (!opts?.skipReset) resetSuggestion()
    },
    [
      isValidSuggestion,
      acceptedAt,
      shownAt,
      suggestionText,
      promptId,
      generationRequestId,
      resetSuggestion,
    ],
  )

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    suggestion,
    markAccepted,
    markShown,
    logOutcomeAtSubmission,
  }
}
