// 引入 useCallback、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useRef, useState } from 'react'
// 类型依赖 { FeedbackSurveyResponse } 来自 ../components/FeedbackSurvey/utils.js，用于校准React hook 状态流的数据契约。
import type { FeedbackSurveyResponse } from '../components/FeedbackSurvey/utils.js'
// 整理这一组导入，让React hook 状态流后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
  logEvent,
} from '../services/analytics/index.js'
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js'
// 类型依赖 { Message } 来自 ../types/message.js，用于校准React hook 状态流的数据契约。
import type { Message } from '../types/message.js'
// 类型依赖 { SkillUpdate } 来自 ../utils/hooks/skillImprovement.js，用于校准React hook 状态流的数据契约。
import type { SkillUpdate } from '../utils/hooks/skillImprovement.js'
// 复用 applySkillImprovement 工具函数，把通用处理留在 ../utils/hooks/skillImprovement.js 中维护。
import { applySkillImprovement } from '../utils/hooks/skillImprovement.js'
// 复用 createSystemMessage 工具函数，把通用处理留在 ../utils/messages.js 中维护。
import { createSystemMessage } from '../utils/messages.js'

// SkillImprovementSuggestion 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type SkillImprovementSuggestion = {
  skillName: string
  updates: SkillUpdate[]
}

// SetMessages 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type SetMessages = (fn: (prev: Message[]) => Message[]) => void

// useSkillImprovementSurvey 封装useSkillImprovementSurvey的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSkillImprovementSurvey(setMessages: SetMessages): {
  isOpen: boolean
  suggestion: SkillImprovementSuggestion | null
  // 这个回调绑定到 handleSelect: (selected: FeedbackSurveyResponse) => void，负责React hook 状态流在该局部场景下的响应。
  handleSelect: (selected: FeedbackSurveyResponse) => void
} {
  // suggestion保存`useAppState`，供React hook后续处理使用。
  const suggestion = useAppState(s => s.skillImprovement.suggestion)
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState()
  // isOpen 由 React state 持有，setIsOpen 会在用户操作或异步结果返回时触发刷新。
  const [isOpen, setIsOpen] = useState(false)
  // lastSuggestionRef 引用保存`useRef`，供React hook后续处理使用。
  const lastSuggestionRef = useRef(suggestion)
  // loggedAppearanceRef 引用保存`useRef`，供React hook后续处理使用。
  const loggedAppearanceRef = useRef(false)

  // Track the suggestion for display even after clearing AppState
  // 满足 `suggestion` 时，React hook执行该分支。
  if (suggestion) {
    // current更新为 `suggestion`，确保useSkillImprovementSurvey后续读取最新状态。
    lastSuggestionRef.current = suggestion
  }

  // Open when a new suggestion arrives
  // 组合条件 `suggestion && !isOpen` 成立时，React hook 状态流才启用这条专门路径。
  if (suggestion && !isOpen) {
    // setIsOpen 写入新的状态值，使React hook 状态流后续读取保持一致。
    setIsOpen(true)
    // loggedAppearanceRef.current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!loggedAppearanceRef.current) {
      // current更新为 `true`，确保useSkillImprovementSurvey后续读取最新状态。
      loggedAppearanceRef.current = true
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_skill_improvement_survey', {
        event_type:
          'appeared' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        // _PROTO_skill_name routes to the privileged skill_name BQ column.
        // Unredacted names don't go in additional_metadata.
        _PROTO_skill_name: (suggestion.skillName ??
          'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      })
    }
  }

  // handleSelect保存`useCallback`，供React hook后续处理使用。
  const handleSelect = useCallback(
    (selected: FeedbackSurveyResponse) => {
      // current保存`lastSuggestionRef.current`，供后续判断或组装使用。
      const current = lastSuggestionRef.current
      // current缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!current) return

      // applied标记React hook use Skill ...是否启用对应路径。
      const applied = selected !== 'dismissed'

      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_skill_improvement_survey', {
        event_type:
          'responded' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        response: (applied
          ? 'applied'
          : 'dismissed') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        // _PROTO_skill_name routes to the privileged skill_name BQ column.
        // Unredacted names don't go in additional_metadata.
        _PROTO_skill_name:
          current.skillName as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,
      })

      // 满足 `applied` 时，React hook执行该分支。
      if (applied) {
        // 显式忽略 `applySkillImprovement(current.skillName, current.updates).then(` 的返回值，只保留它触发的副作用。
        void applySkillImprovement(current.skillName, current.updates).then(
          // 这个回调绑定到 () => {，负责React hook 状态流在该局部场景下的响应。
          () => {
            // setMessages 写入新的状态值，使React hook 状态流后续读取保持一致。
            setMessages(prev => [
              ...prev,
              createSystemMessage(
                `Skill "${current.skillName}" updated with improvements.`,
                'suggestion',
              ),
            ])
          },
        )
      }

      // Close and clear
      // setIsOpen 写入新的状态值，使React hook 状态流后续读取保持一致。
      setIsOpen(false)
      // current更新为 `false`，确保useSkillImprovementSurvey后续读取最新状态。
      loggedAppearanceRef.current = false
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => {
        // prev.skillImprovement.suggestion缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!prev.skillImprovement.suggestion) return prev
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prev,
          skillImprovement: { suggestion: null },
        }
      })
    },
    [setAppState, setMessages],
  )

  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    isOpen,
    suggestion: lastSuggestionRef.current,
    handleSelect,
  }
}
