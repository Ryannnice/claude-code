// 引入 useCallback、useReducer，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useReducer } from 'react'

// AnswerValue 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type AnswerValue = string

// QuestionState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type QuestionState = {
  selectedValue?: string | string[]
  textInputValue: string
}

// State 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type State = {
  currentQuestionIndex: number
  answers: Record<string, AnswerValue>
  questionStates: Record<string, QuestionState>
  isInTextInput: boolean
}

// Action 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Action =
  | { type: 'next-question' }
  | { type: 'prev-question' }
  | {
      type: 'update-question-state'
      questionText: string
      updates: Partial<QuestionState>
      isMultiSelect: boolean
    }
  | {
      type: 'set-answer'
      questionText: string
      answer: string
      shouldAdvance: boolean
    }
  | { type: 'set-text-input-mode'; isInInput: boolean }

// reducer 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function reducer(state: State, action: Action): State {
  // 按照 action.type 的取值选择终端渲染的具体处理分支。
  switch (action.type) {
    case 'next-question':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        isInTextInput: false,
      }

    case 'prev-question':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
        isInTextInput: false,
      }

    case 'update-question-state': {
      // existing读取 `state.questionStates[action.questionText]` 对应条目，后续围绕该成员继续处理。
      const existing = state.questionStates[action.questionText]
      // newState 状态 集中保存权限确认界面 use multiple choice state要一起传递的字段。
      const newState: QuestionState = {
        selectedValue:
          action.updates.selectedValue ??
          existing?.selectedValue ??
          (action.isMultiSelect ? [] : undefined),
        textInputValue:
          action.updates.textInputValue ?? existing?.textInputValue ?? '',
      }

      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        questionStates: {
          ...state.questionStates,
          [action.questionText]: newState,
        },
      }
    }

    case 'set-answer': {
      // newState 状态 集中保存终端渲染权限确认界面 use multiple choice st...要一起传递的字段。
      const newState = {
        ...state,
        answers: {
          ...state.answers,
          [action.questionText]: action.answer,
        },
      }

      // 满足 `action.shouldAdvance` 时，终端渲染执行该分支。
      if (action.shouldAdvance) {
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...newState,
          currentQuestionIndex: newState.currentQuestionIndex + 1,
          isInTextInput: false,
        }
      }

      // 返回 `newState`，作为终端渲染这次计算的结果。
      return newState
    }

    case 'set-text-input-mode':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        ...state,
        isInTextInput: action.isInInput,
      }
  }
}

// INITIAL_STATE 状态 集中保存权限确认界面 use multiple choice state要一起传递的字段。
const INITIAL_STATE: State = {
  currentQuestionIndex: 0,
  answers: {},
  questionStates: {},
  isInTextInput: false,
}

// MultipleChoiceState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type MultipleChoiceState = {
  currentQuestionIndex: number
  answers: Record<string, AnswerValue>
  questionStates: Record<string, QuestionState>
  isInTextInput: boolean
  // 这个回调绑定到 nextQuestion: () => void，负责终端渲染在该局部场景下的响应。
  nextQuestion: () => void
  // 这个回调绑定到 prevQuestion: () => void，负责终端渲染在该局部场景下的响应。
  prevQuestion: () => void
  // 权限确认界面 use multiple choice state在这里处理 `updateQuestionState: (`，完成这一小步状态转换。
  updateQuestionState: (
    questionText: string,
    updates: Partial<QuestionState>,
    isMultiSelect: boolean,
  ) => void
  // 权限确认界面 use multiple choice state在这里处理 `setAnswer: (`，完成这一小步状态转换。
  setAnswer: (
    questionText: string,
    answer: string,
    shouldAdvance?: boolean,
  ) => void
  // 这个回调绑定到 setTextInputMode: (isInInput: boolean) => void，负责终端渲染在该局部场景下的响应。
  setTextInputMode: (isInInput: boolean) => void
}

// useMultipleChoiceState 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMultipleChoiceState(): MultipleChoiceState {
  // 从 `useReducer(reducer, INITIAL_STATE)` 按位置拆出 state、dispatch，让权限确认界面 use multiple choice state分别处理这些返回值。
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  // nextQuestion保存`useCallback`，供终端渲染后续处理使用。
  const nextQuestion = useCallback(() => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({ type: 'next-question' })
  }, [])

  // prevQuestion保存`useCallback`，供终端渲染后续处理使用。
  const prevQuestion = useCallback(() => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({ type: 'prev-question' })
  }, [])

  // updateQuestionState 状态保存`useCallback`，供终端渲染后续处理使用。
  const updateQuestionState = useCallback(
    (
      questionText: string,
      updates: Partial<QuestionState>,
      isMultiSelect: boolean,
    ) => {
      // 调用 dispatch，触发终端渲染此处需要的副作用。
      dispatch({
        type: 'update-question-state',
        questionText,
        updates,
        isMultiSelect,
      })
    },
    [],
  )

  // setAnswer保存`useCallback`，供终端渲染后续处理使用。
  const setAnswer = useCallback(
    (questionText: string, answer: string, shouldAdvance: boolean = true) => {
      // 调用 dispatch，触发终端渲染此处需要的副作用。
      dispatch({
        type: 'set-answer',
        questionText,
        answer,
        shouldAdvance,
      })
    },
    [],
  )

  // setTextInputMode保存`useCallback`，供终端渲染后续处理使用。
  const setTextInputMode = useCallback((isInInput: boolean) => {
    // 调用 dispatch，触发终端渲染此处需要的副作用。
    dispatch({ type: 'set-text-input-mode', isInInput })
  }, [])

  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    questionStates: state.questionStates,
    isInTextInput: state.isInTextInput,
    nextQuestion,
    prevQuestion,
    updateQuestionState,
    setAnswer,
    setTextInputMode,
  }
}
