// 引入 useCallback、useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// 引入 useDynamicConfig，将 src/hooks/useDynamicConfig.js 中已经封装好的能力接到本文件流程里。
import { useDynamicConfig } from 'src/hooks/useDynamicConfig.js';
// 接入 isFeedbackSurveyDisabled 服务层能力，把外部通信或共享状态交给 src/services/analytics/config.js 处理。
import { isFeedbackSurveyDisabled } from 'src/services/analytics/config.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../services/policyLimits/index.js';
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { Message } from '../../types/message.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// 复用 getLastAssistantMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { getLastAssistantMessage } from '../../utils/messages.js';
// 复用 getMainLoopModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { getMainLoopModel } from '../../utils/model/model.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js';
// 复用 logOTelEvent 工具函数，把通用处理留在 ../../utils/telemetry/events.js 中维护。
import { logOTelEvent } from '../../utils/telemetry/events.js';
// 引入 submitTranscriptShare、TranscriptShareTrigger，将 ./submitTranscriptShare.js 中已经封装好的能力接到本文件流程里。
import { submitTranscriptShare, type TranscriptShareTrigger } from './submitTranscriptShare.js';
// 类型依赖 { TranscriptShareResponse } 来自 ./TranscriptSharePrompt.js，用于校准终端渲染的数据契约。
import type { TranscriptShareResponse } from './TranscriptSharePrompt.js';
// 引入 useSurveyState，将 ./useSurveyState.js 中已经封装好的能力接到本文件流程里。
import { useSurveyState } from './useSurveyState.js';
// 类型依赖 { FeedbackSurveyResponse, FeedbackSurveyType } 来自 ./utils.js，用于校准终端渲染的数据契约。
import type { FeedbackSurveyResponse, FeedbackSurveyType } from './utils.js';
// FeedbackSurveyConfig 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type FeedbackSurveyConfig = {
  minTimeBeforeFeedbackMs: number;
  minTimeBetweenFeedbackMs: number;
  minTimeBetweenGlobalFeedbackMs: number;
  minUserTurnsBeforeFeedback: number;
  minUserTurnsBetweenFeedback: number;
  hideThanksAfterMs: number;
  onForModels: string[];
  probability: number;
};
// TranscriptAskConfig 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TranscriptAskConfig = {
  probability: number;
};
// DEFAULT_FEEDBACK_SURVEY_CONFIG 配置 集中保存终端 UI 组件 use Feedback Survey要一起传递的字段。
const DEFAULT_FEEDBACK_SURVEY_CONFIG: FeedbackSurveyConfig = {
  minTimeBeforeFeedbackMs: 600000,
  minTimeBetweenFeedbackMs: 3600000,
  minTimeBetweenGlobalFeedbackMs: 100000000,
  minUserTurnsBeforeFeedback: 5,
  minUserTurnsBetweenFeedback: 10,
  hideThanksAfterMs: 3000,
  onForModels: ['*'],
  probability: 0.005
};
// DEFAULT_TRANSCRIPT_ASK_CONFIG 配置 集中保存终端 UI 组件 use Feedback Survey要一起传递的字段。
const DEFAULT_TRANSCRIPT_ASK_CONFIG: TranscriptAskConfig = {
  probability: 0
};
// useFeedbackSurvey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useFeedbackSurvey(messages: Message[], isLoading: boolean, submitCount: number, surveyType: FeedbackSurveyType = 'session', hasActivePrompt: boolean = false): {
  state: 'closed' | 'open' | 'thanks' | 'transcript_prompt' | 'submitting' | 'submitted';
  lastResponse: FeedbackSurveyResponse | null;
  // 这个回调绑定到 handleSelect: (selected: FeedbackSurveyResponse) => boolean;，负责终端渲染在该局部场景下的响应。
  handleSelect: (selected: FeedbackSurveyResponse) => boolean;
  // 这个回调绑定到 handleTranscriptSelect: (selected: TranscriptShareResponse) => void;，负责终端渲染在该局部场景下的响应。
  handleTranscriptSelect: (selected: TranscriptShareResponse) => void;
} {
  // lastAssistantMessageIdRef 引用保存`useRef`，供终端渲染后续处理使用。
  const lastAssistantMessageIdRef = useRef('unknown');
  // current更新为 `getLastAssistantMessage(messages)?.message?.id || 'unknow...`，确保终端 UI后续读取最新状态。
  lastAssistantMessageIdRef.current = getLastAssistantMessage(messages)?.message?.id || 'unknown';
  // 从 `useState<{` 按位置拆出 feedbackSurvey、setFeedbackSurvey，让终端 UI 组件 use Feedback Survey分别处理这些返回值。
  const [feedbackSurvey, setFeedbackSurvey] = useState<{
    timeLastShown: number | null;
    submitCountAtLastAppearance: number | null;
  // 这个回调绑定到 }>(() => ({，负责终端渲染在该局部场景下的响应。
  }>(() => ({
    timeLastShown: null,
    submitCountAtLastAppearance: null
  }));
  // 配置读取 hook 状态，供终端 UI use Feedback Survey本轮渲染使用。
  const config = useDynamicConfig<FeedbackSurveyConfig>('tengu_feedback_survey_config', DEFAULT_FEEDBACK_SURVEY_CONFIG);
  // badTranscriptAskConfig 配置读取 hook 状态，供终端 UI use Feedback Survey本轮渲染使用。
  const badTranscriptAskConfig = useDynamicConfig<TranscriptAskConfig>('tengu_bad_survey_transcript_ask_config', DEFAULT_TRANSCRIPT_ASK_CONFIG);
  // goodTranscriptAskConfig 配置读取 hook 状态，供终端 UI use Feedback Survey本轮渲染使用。
  const goodTranscriptAskConfig = useDynamicConfig<TranscriptAskConfig>('tengu_good_survey_transcript_ask_config', DEFAULT_TRANSCRIPT_ASK_CONFIG);
  // settingsRate读取`getInitialSettings`，供终端渲染后续处理使用。
  const settingsRate = getInitialSettings().feedbackSurveyRate;
  // sessionStartTime 会话数据保存`useRef`，供终端渲染后续处理使用。
  const sessionStartTime = useRef(Date.now());
  // submitCountAtSessionStart 会话数据保存`useRef`，供终端渲染后续处理使用。
  const submitCountAtSessionStart = useRef(submitCount);
  // submitCountRef 引用保存`useRef`，供终端渲染后续处理使用。
  const submitCountRef = useRef(submitCount);
  // current更新为 `submitCount`，确保终端 UI后续读取最新状态。
  submitCountRef.current = submitCount;
  // messagesRef 引用保存`useRef`，供终端渲染后续处理使用。
  const messagesRef = useRef(messages);
  // current更新为 `messages`，确保终端 UI后续读取最新状态。
  messagesRef.current = messages;
  // Probability gate: roll once when eligibility conditions are met, not on every
  // useMemo re-evaluation. Without this, each dependency change (submitCount,
  // isLoading toggle, etc.) re-rolls Math.random(), making the survey almost
  // certain to appear after enough renders.
  // probabilityPassedRef 引用保存`useRef`，供终端渲染后续处理使用。
  const probabilityPassedRef = useRef(false);
  // lastEligibleSubmitCountRef 引用保存 hook 状态，让终端 UI use Feedback Survey跨渲染复用同一个容器。
  const lastEligibleSubmitCountRef = useRef<number | null>(null);
  // updateLastShownTime保存`useCallback`，供终端渲染后续处理使用。
  const updateLastShownTime = useCallback((timestamp: number, submitCountValue: number) => {
    // setFeedbackSurvey 写入新的状态值，使终端渲染后续读取保持一致。
    setFeedbackSurvey(prev => {
      // 只有 `prev.timeLastShown === timestamp && prev.submitCo` 满足时，终端渲染才执行该分支。
      if (prev.timeLastShown === timestamp && prev.submitCountAtLastAppearance === submitCountValue) {
        // 返回 `prev`，作为终端渲染这次计算的结果。
        return prev;
      }
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        timeLastShown: timestamp,
        submitCountAtLastAppearance: submitCountValue
      };
    });
    // Persist cross-session pacing state (previously done by onChangeAppState observer)
    // `getGlobalConfig().feedbackSurveyState?.last...` 与 `timestamp` 不一致时刷新派生状态，避免使用过期结果。
    if (getGlobalConfig().feedbackSurveyState?.lastShownTime !== timestamp) {
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        feedbackSurveyState: {
          lastShownTime: timestamp
        }
      }));
    }
  }, []);
  // onOpen保存`useCallback`，供终端渲染后续处理使用。
  const onOpen = useCallback((appearanceId: string) => {
    // 调用 updateLastShownTime，触发终端渲染此处需要的副作用。
    updateLastShownTime(Date.now(), submitCountRef.current);
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_feedback_survey_event', {
      event_type: 'appeared' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_assistant_message_id: lastAssistantMessageIdRef.current as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      survey_type: surveyType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 显式忽略 `logOTelEvent('feedback_survey', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('feedback_survey', {
      event_type: 'appeared',
      appearance_id: appearanceId,
      survey_type: surveyType
    });
  }, [updateLastShownTime, surveyType]);
  // onSelect保存`useCallback`，供终端渲染后续处理使用。
  const onSelect = useCallback((appearanceId_0: string, selected: FeedbackSurveyResponse) => {
    // 调用 updateLastShownTime，触发终端渲染此处需要的副作用。
    updateLastShownTime(Date.now(), submitCountRef.current);
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_feedback_survey_event', {
      event_type: 'responded' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId_0 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      response: selected as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_assistant_message_id: lastAssistantMessageIdRef.current as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      survey_type: surveyType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 显式忽略 `logOTelEvent('feedback_survey', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('feedback_survey', {
      event_type: 'responded',
      appearance_id: appearanceId_0,
      response: selected,
      survey_type: surveyType
    });
  }, [updateLastShownTime, surveyType]);
  // shouldShowTranscriptPrompt记录 `useCallback` 是否成立，终端渲染随后按该结果分支。
  const shouldShowTranscriptPrompt = useCallback((selected_0: FeedbackSurveyResponse) => {
    // Only bad and good ratings trigger the transcript ask
    // `selected_0` 与 `'bad' && selected_0 !== 'good'` 不一致时刷新派生状态，避免使用过期结果。
    if (selected_0 !== 'bad' && selected_0 !== 'good') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Don't show if user previously chose "Don't ask again"
    // 满足 `getGlobalConfig().transcriptShareDismissed` 时，终端渲染执行该分支。
    if (getGlobalConfig().transcriptShareDismissed) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Don't show if product feedback is blocked by org policy (ZDR)
    // 满足 `!isPolicyAllowed('allow_product_feedback')` 时，终端渲染执行该分支。
    if (!isPolicyAllowed('allow_product_feedback')) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Probability gate from GrowthBook config (separate per rating)
    // probability标记终端 UI use Feedback Survey是否启用对应路径。
    const probability = selected_0 === 'bad' ? badTranscriptAskConfig.probability : goodTranscriptAskConfig.probability;
    // 返回 `Math.random() <= probability`，作为终端渲染这次计算的结果。
    return Math.random() <= probability;
  }, [badTranscriptAskConfig.probability, goodTranscriptAskConfig.probability]);
  // onTranscriptPromptShown保存`useCallback`，供终端渲染后续处理使用。
  const onTranscriptPromptShown = useCallback((appearanceId_1: string, surveyResponse: FeedbackSurveyResponse) => {
    // trigger标记终端 UI 组件 use Feedback Survey是否启用对应路径。
    const trigger: TranscriptShareTrigger = surveyResponse === 'good' ? 'good_feedback_survey' : 'bad_feedback_survey';
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_feedback_survey_event', {
      event_type: 'transcript_prompt_appeared' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId_1 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_assistant_message_id: lastAssistantMessageIdRef.current as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      survey_type: surveyType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      trigger: trigger as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 显式忽略 `logOTelEvent('feedback_survey', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('feedback_survey', {
      event_type: 'transcript_prompt_appeared',
      appearance_id: appearanceId_1,
      survey_type: surveyType
    });
  }, [surveyType]);
  // onTranscriptSelect保存`useCallback`，供终端渲染后续处理使用。
  const onTranscriptSelect = useCallback(async (appearanceId_2: string, selected_1: TranscriptShareResponse, surveyResponse_0: FeedbackSurveyResponse | null): Promise<boolean> => {
    // trigger_0标记终端 UI 组件 use Feedback Survey是否启用对应路径。
    const trigger_0: TranscriptShareTrigger = surveyResponse_0 === 'good' ? 'good_feedback_survey' : 'bad_feedback_survey';
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_feedback_survey_event', {
      event_type: `transcript_share_${selected_1}` as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId_2 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      last_assistant_message_id: lastAssistantMessageIdRef.current as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      survey_type: surveyType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      trigger: trigger_0 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 当 `selected_1` 匹配 `'dont_ask_again'` 时，终端渲染执行对应分支。
    if (selected_1 === 'dont_ask_again') {
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(current_0 => ({
        ...current_0,
        transcriptShareDismissed: true
      }));
    }
    // 当 `selected_1` 匹配 `'yes'` 时，终端渲染执行对应分支。
    if (selected_1 === 'yes') {
      // 结果保存`submitTranscriptShare`，供终端渲染后续处理使用。
      const result = await submitTranscriptShare(messagesRef.current, trigger_0, appearanceId_2);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_feedback_survey_event', {
        event_type: (result.success ? 'transcript_share_submitted' : 'transcript_share_failed') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        appearance_id: appearanceId_2 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        trigger: trigger_0 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      // 返回 `result.success`，作为终端渲染这次计算的结果。
      return result.success;
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }, [surveyType]);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    state,
    lastResponse,
    open,
    handleSelect,
    handleTranscriptSelect
  } = useSurveyState({
    hideThanksAfterMs: config.hideThanksAfterMs,
    onOpen,
    onSelect,
    shouldShowTranscriptPrompt,
    onTranscriptPromptShown,
    onTranscriptSelect
  });
  // currentModel读取`getMainLoopModel`，供终端渲染后续处理使用。
  const currentModel = getMainLoopModel();
  // isModelAllowed记录 `useMemo` 是否成立，终端渲染随后按该结果分支。
  const isModelAllowed = useMemo(() => {
    // config.onForModels 配置为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (config.onForModels.length === 0) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 满足 `config.onForModels.includes('*')` 时，终端渲染执行该分支。
    if (config.onForModels.includes('*')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true;
    }
    // 返回 `config.onForModels.includes(currentModel)`，作为终端渲染这次计算的结果。
    return config.onForModels.includes(currentModel);
  }, [config.onForModels, currentModel]);
  // shouldOpen记录 `useMemo` 是否成立，终端渲染随后按该结果分支。
  const shouldOpen = useMemo(() => {
    // `state` 与 `'closed'` 不一致时刷新派生状态，避免使用过期结果。
    if (state !== 'closed') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 满足 `isLoading` 时，终端渲染执行该分支。
    if (isLoading) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Don't show survey when permission or ask question prompts are visible
    // 满足 `hasActivePrompt` 时，终端渲染执行该分支。
    if (hasActivePrompt) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Force display for testing
    // 只有 `process.env.CLAUDE_FORCE_DISPLAY_SURVEY && !feedb` 满足时，终端渲染才执行该分支。
    if (process.env.CLAUDE_FORCE_DISPLAY_SURVEY && !feedbackSurvey.timeLastShown) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true;
    }
    // isModelAllowed缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!isModelAllowed) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY)` 时，终端渲染执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 满足 `isFeedbackSurveyDisabled()` 时，终端渲染执行该分支。
    if (isFeedbackSurveyDisabled()) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Check if product feedback is allowed by org policy
    // 满足 `!isPolicyAllowed('allow_product_feedback')` 时，终端渲染执行该分支。
    if (!isPolicyAllowed('allow_product_feedback')) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Check session-local pacing
    // 满足 `feedbackSurvey.timeLastShown` 时，终端渲染执行该分支。
    if (feedbackSurvey.timeLastShown) {
      // Check time elapsed since last appearance in this session
      // timeSinceLastShown记录时间`Date.now`，供终端渲染后续处理使用。
      const timeSinceLastShown = Date.now() - feedbackSurvey.timeLastShown;
      // 满足 `timeSinceLastShown < config.minTimeBetweenFeedbac` 时，终端渲染执行该分支。
      if (timeSinceLastShown < config.minTimeBetweenFeedbackMs) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
      // Check user turn requirement for subsequent appearances
      // `feedbackSurvey.submitCountAtLastAppearance` 与 `nu` 不一致时刷新派生状态，避免使用过期结果。
      if (feedbackSurvey.submitCountAtLastAppearance !== null && submitCount < feedbackSurvey.submitCountAtLastAppearance + config.minUserTurnsBetweenFeedback) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
    } else {
      // First appearance in this session
      // timeSinceSessionStart 会话数据记录时间`Date.now`，供终端渲染后续处理使用。
      const timeSinceSessionStart = Date.now() - sessionStartTime.current;
      // 满足 `timeSinceSessionStart < config.minTimeBeforeFeedb` 时，终端渲染执行该分支。
      if (timeSinceSessionStart < config.minTimeBeforeFeedbackMs) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
      // 满足 `submitCount < submitCountAtSessionStart.current +` 时，终端渲染执行该分支。
      if (submitCount < submitCountAtSessionStart.current + config.minUserTurnsBeforeFeedback) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
    }

    // Probability check: roll once per eligibility window to avoid re-rolling
    // on every useMemo re-evaluation (which would make triggering near-certain).
    // `lastEligibleSubmitCountRef.current` 与 `submitCount` 不一致时刷新派生状态，避免使用过期结果。
    if (lastEligibleSubmitCountRef.current !== submitCount) {
      // current更新为 `submitCount`，确保终端 UI后续读取最新状态。
      lastEligibleSubmitCountRef.current = submitCount;
      // current更新为 `Math.random() <= (settingsRate ?? config.probability)`，确保终端 UI后续读取最新状态。
      probabilityPassedRef.current = Math.random() <= (settingsRate ?? config.probability);
    }
    // probabilityPassedRef.current缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!probabilityPassedRef.current) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }

    // Check global pacing (across all sessions)
    // Leave this till last because it reads from the filesystem which is expensive.
    // globalFeedbackState 状态读取`getGlobalConfig`，供终端渲染后续处理使用。
    const globalFeedbackState = getGlobalConfig().feedbackSurveyState;
    // 满足 `globalFeedbackState?.lastShownTime` 时，终端渲染执行该分支。
    if (globalFeedbackState?.lastShownTime) {
      // timeSinceGlobalLastShown记录时间`Date.now`，供终端渲染后续处理使用。
      const timeSinceGlobalLastShown = Date.now() - globalFeedbackState.lastShownTime;
      // 满足 `timeSinceGlobalLastShown < config.minTimeBetweenG` 时，终端渲染执行该分支。
      if (timeSinceGlobalLastShown < config.minTimeBetweenGlobalFeedbackMs) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  }, [state, isLoading, hasActivePrompt, isModelAllowed, feedbackSurvey.timeLastShown, feedbackSurvey.submitCountAtLastAppearance, submitCount, config.minTimeBetweenFeedbackMs, config.minTimeBetweenGlobalFeedbackMs, config.minUserTurnsBetweenFeedback, config.minTimeBeforeFeedbackMs, config.minUserTurnsBeforeFeedback, config.probability, settingsRate]);
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 满足 `shouldOpen` 时，终端渲染执行该分支。
    if (shouldOpen) {
      // 调用 open，触发终端渲染此处需要的副作用。
      open();
    }
  }, [shouldOpen, open]);
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    state,
    lastResponse,
    handleSelect,
    handleTranscriptSelect
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsInVzZUR5bmFtaWNDb25maWciLCJpc0ZlZWRiYWNrU3VydmV5RGlzYWJsZWQiLCJBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTIiwibG9nRXZlbnQiLCJpc1BvbGljeUFsbG93ZWQiLCJNZXNzYWdlIiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsImlzRW52VHJ1dGh5IiwiZ2V0TGFzdEFzc2lzdGFudE1lc3NhZ2UiLCJnZXRNYWluTG9vcE1vZGVsIiwiZ2V0SW5pdGlhbFNldHRpbmdzIiwibG9nT1RlbEV2ZW50Iiwic3VibWl0VHJhbnNjcmlwdFNoYXJlIiwiVHJhbnNjcmlwdFNoYXJlVHJpZ2dlciIsIlRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlIiwidXNlU3VydmV5U3RhdGUiLCJGZWVkYmFja1N1cnZleVJlc3BvbnNlIiwiRmVlZGJhY2tTdXJ2ZXlUeXBlIiwiRmVlZGJhY2tTdXJ2ZXlDb25maWciLCJtaW5UaW1lQmVmb3JlRmVlZGJhY2tNcyIsIm1pblRpbWVCZXR3ZWVuRmVlZGJhY2tNcyIsIm1pblRpbWVCZXR3ZWVuR2xvYmFsRmVlZGJhY2tNcyIsIm1pblVzZXJUdXJuc0JlZm9yZUZlZWRiYWNrIiwibWluVXNlclR1cm5zQmV0d2VlbkZlZWRiYWNrIiwiaGlkZVRoYW5rc0FmdGVyTXMiLCJvbkZvck1vZGVscyIsInByb2JhYmlsaXR5IiwiVHJhbnNjcmlwdEFza0NvbmZpZyIsIkRFRkFVTFRfRkVFREJBQ0tfU1VSVkVZX0NPTkZJRyIsIkRFRkFVTFRfVFJBTlNDUklQVF9BU0tfQ09ORklHIiwidXNlRmVlZGJhY2tTdXJ2ZXkiLCJtZXNzYWdlcyIsImlzTG9hZGluZyIsInN1Ym1pdENvdW50Iiwic3VydmV5VHlwZSIsImhhc0FjdGl2ZVByb21wdCIsInN0YXRlIiwibGFzdFJlc3BvbnNlIiwiaGFuZGxlU2VsZWN0Iiwic2VsZWN0ZWQiLCJoYW5kbGVUcmFuc2NyaXB0U2VsZWN0IiwibGFzdEFzc2lzdGFudE1lc3NhZ2VJZFJlZiIsImN1cnJlbnQiLCJtZXNzYWdlIiwiaWQiLCJmZWVkYmFja1N1cnZleSIsInNldEZlZWRiYWNrU3VydmV5IiwidGltZUxhc3RTaG93biIsInN1Ym1pdENvdW50QXRMYXN0QXBwZWFyYW5jZSIsImNvbmZpZyIsImJhZFRyYW5zY3JpcHRBc2tDb25maWciLCJnb29kVHJhbnNjcmlwdEFza0NvbmZpZyIsInNldHRpbmdzUmF0ZSIsImZlZWRiYWNrU3VydmV5UmF0ZSIsInNlc3Npb25TdGFydFRpbWUiLCJEYXRlIiwibm93Iiwic3VibWl0Q291bnRBdFNlc3Npb25TdGFydCIsInN1Ym1pdENvdW50UmVmIiwibWVzc2FnZXNSZWYiLCJwcm9iYWJpbGl0eVBhc3NlZFJlZiIsImxhc3RFbGlnaWJsZVN1Ym1pdENvdW50UmVmIiwidXBkYXRlTGFzdFNob3duVGltZSIsInRpbWVzdGFtcCIsInN1Ym1pdENvdW50VmFsdWUiLCJwcmV2IiwiZmVlZGJhY2tTdXJ2ZXlTdGF0ZSIsImxhc3RTaG93blRpbWUiLCJvbk9wZW4iLCJhcHBlYXJhbmNlSWQiLCJldmVudF90eXBlIiwiYXBwZWFyYW5jZV9pZCIsImxhc3RfYXNzaXN0YW50X21lc3NhZ2VfaWQiLCJzdXJ2ZXlfdHlwZSIsIm9uU2VsZWN0IiwicmVzcG9uc2UiLCJzaG91bGRTaG93VHJhbnNjcmlwdFByb21wdCIsInRyYW5zY3JpcHRTaGFyZURpc21pc3NlZCIsIk1hdGgiLCJyYW5kb20iLCJvblRyYW5zY3JpcHRQcm9tcHRTaG93biIsInN1cnZleVJlc3BvbnNlIiwidHJpZ2dlciIsIm9uVHJhbnNjcmlwdFNlbGVjdCIsIlByb21pc2UiLCJyZXN1bHQiLCJzdWNjZXNzIiwib3BlbiIsImN1cnJlbnRNb2RlbCIsImlzTW9kZWxBbGxvd2VkIiwibGVuZ3RoIiwiaW5jbHVkZXMiLCJzaG91bGRPcGVuIiwicHJvY2VzcyIsImVudiIsIkNMQVVERV9GT1JDRV9ESVNQTEFZX1NVUlZFWSIsIkNMQVVERV9DT0RFX0RJU0FCTEVfRkVFREJBQ0tfU1VSVkVZIiwidGltZVNpbmNlTGFzdFNob3duIiwidGltZVNpbmNlU2Vzc2lvblN0YXJ0IiwiZ2xvYmFsRmVlZGJhY2tTdGF0ZSIsInRpbWVTaW5jZUdsb2JhbExhc3RTaG93biJdLCJzb3VyY2VzIjpbInVzZUZlZWRiYWNrU3VydmV5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VEeW5hbWljQ29uZmlnIH0gZnJvbSAnc3JjL2hvb2tzL3VzZUR5bmFtaWNDb25maWcuanMnXG5pbXBvcnQgeyBpc0ZlZWRiYWNrU3VydmV5RGlzYWJsZWQgfSBmcm9tICdzcmMvc2VydmljZXMvYW5hbHl0aWNzL2NvbmZpZy5qcydcbmltcG9ydCB7XG4gIHR5cGUgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgbG9nRXZlbnQsXG59IGZyb20gJ3NyYy9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyBpc1BvbGljeUFsbG93ZWQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9wb2xpY3lMaW1pdHMvaW5kZXguanMnXG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UgfSBmcm9tICcuLi8uLi90eXBlcy9tZXNzYWdlLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgaXNFbnZUcnV0aHkgfSBmcm9tICcuLi8uLi91dGlscy9lbnZVdGlscy5qcydcbmltcG9ydCB7IGdldExhc3RBc3Npc3RhbnRNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBnZXRNYWluTG9vcE1vZGVsIH0gZnJvbSAnLi4vLi4vdXRpbHMvbW9kZWwvbW9kZWwuanMnXG5pbXBvcnQgeyBnZXRJbml0aWFsU2V0dGluZ3MgfSBmcm9tICcuLi8uLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB7IGxvZ09UZWxFdmVudCB9IGZyb20gJy4uLy4uL3V0aWxzL3RlbGVtZXRyeS9ldmVudHMuanMnXG5pbXBvcnQge1xuICBzdWJtaXRUcmFuc2NyaXB0U2hhcmUsXG4gIHR5cGUgVHJhbnNjcmlwdFNoYXJlVHJpZ2dlcixcbn0gZnJvbSAnLi9zdWJtaXRUcmFuc2NyaXB0U2hhcmUuanMnXG5pbXBvcnQgdHlwZSB7IFRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlIH0gZnJvbSAnLi9UcmFuc2NyaXB0U2hhcmVQcm9tcHQuanMnXG5pbXBvcnQgeyB1c2VTdXJ2ZXlTdGF0ZSB9IGZyb20gJy4vdXNlU3VydmV5U3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UsIEZlZWRiYWNrU3VydmV5VHlwZSB9IGZyb20gJy4vdXRpbHMuanMnXG5cbnR5cGUgRmVlZGJhY2tTdXJ2ZXlDb25maWcgPSB7XG4gIG1pblRpbWVCZWZvcmVGZWVkYmFja01zOiBudW1iZXJcbiAgbWluVGltZUJldHdlZW5GZWVkYmFja01zOiBudW1iZXJcbiAgbWluVGltZUJldHdlZW5HbG9iYWxGZWVkYmFja01zOiBudW1iZXJcbiAgbWluVXNlclR1cm5zQmVmb3JlRmVlZGJhY2s6IG51bWJlclxuICBtaW5Vc2VyVHVybnNCZXR3ZWVuRmVlZGJhY2s6IG51bWJlclxuICBoaWRlVGhhbmtzQWZ0ZXJNczogbnVtYmVyXG4gIG9uRm9yTW9kZWxzOiBzdHJpbmdbXVxuICBwcm9iYWJpbGl0eTogbnVtYmVyXG59XG5cbnR5cGUgVHJhbnNjcmlwdEFza0NvbmZpZyA9IHtcbiAgcHJvYmFiaWxpdHk6IG51bWJlclxufVxuXG5jb25zdCBERUZBVUxUX0ZFRURCQUNLX1NVUlZFWV9DT05GSUc6IEZlZWRiYWNrU3VydmV5Q29uZmlnID0ge1xuICBtaW5UaW1lQmVmb3JlRmVlZGJhY2tNczogNjAwMDAwLFxuICBtaW5UaW1lQmV0d2VlbkZlZWRiYWNrTXM6IDM2MDAwMDAsXG4gIG1pblRpbWVCZXR3ZWVuR2xvYmFsRmVlZGJhY2tNczogMTAwMDAwMDAwLFxuICBtaW5Vc2VyVHVybnNCZWZvcmVGZWVkYmFjazogNSxcbiAgbWluVXNlclR1cm5zQmV0d2VlbkZlZWRiYWNrOiAxMCxcbiAgaGlkZVRoYW5rc0FmdGVyTXM6IDMwMDAsXG4gIG9uRm9yTW9kZWxzOiBbJyonXSxcbiAgcHJvYmFiaWxpdHk6IDAuMDA1LFxufVxuXG5jb25zdCBERUZBVUxUX1RSQU5TQ1JJUFRfQVNLX0NPTkZJRzogVHJhbnNjcmlwdEFza0NvbmZpZyA9IHtcbiAgcHJvYmFiaWxpdHk6IDAsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VGZWVkYmFja1N1cnZleShcbiAgbWVzc2FnZXM6IE1lc3NhZ2VbXSxcbiAgaXNMb2FkaW5nOiBib29sZWFuLFxuICBzdWJtaXRDb3VudDogbnVtYmVyLFxuICBzdXJ2ZXlUeXBlOiBGZWVkYmFja1N1cnZleVR5cGUgPSAnc2Vzc2lvbicsXG4gIGhhc0FjdGl2ZVByb21wdDogYm9vbGVhbiA9IGZhbHNlLFxuKToge1xuICBzdGF0ZTpcbiAgICB8ICdjbG9zZWQnXG4gICAgfCAnb3BlbidcbiAgICB8ICd0aGFua3MnXG4gICAgfCAndHJhbnNjcmlwdF9wcm9tcHQnXG4gICAgfCAnc3VibWl0dGluZydcbiAgICB8ICdzdWJtaXR0ZWQnXG4gIGxhc3RSZXNwb25zZTogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSB8IG51bGxcbiAgaGFuZGxlU2VsZWN0OiAoc2VsZWN0ZWQ6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UpID0+IGJvb2xlYW5cbiAgaGFuZGxlVHJhbnNjcmlwdFNlbGVjdDogKHNlbGVjdGVkOiBUcmFuc2NyaXB0U2hhcmVSZXNwb25zZSkgPT4gdm9pZFxufSB7XG4gIGNvbnN0IGxhc3RBc3Npc3RhbnRNZXNzYWdlSWRSZWYgPSB1c2VSZWYoJ3Vua25vd24nKVxuICBsYXN0QXNzaXN0YW50TWVzc2FnZUlkUmVmLmN1cnJlbnQgPVxuICAgIGdldExhc3RBc3Npc3RhbnRNZXNzYWdlKG1lc3NhZ2VzKT8ubWVzc2FnZT8uaWQgfHwgJ3Vua25vd24nXG4gIGNvbnN0IFtmZWVkYmFja1N1cnZleSwgc2V0RmVlZGJhY2tTdXJ2ZXldID0gdXNlU3RhdGU8e1xuICAgIHRpbWVMYXN0U2hvd246IG51bWJlciB8IG51bGxcbiAgICBzdWJtaXRDb3VudEF0TGFzdEFwcGVhcmFuY2U6IG51bWJlciB8IG51bGxcbiAgfT4oKCkgPT4gKHsgdGltZUxhc3RTaG93bjogbnVsbCwgc3VibWl0Q291bnRBdExhc3RBcHBlYXJhbmNlOiBudWxsIH0pKVxuICBjb25zdCBjb25maWcgPSB1c2VEeW5hbWljQ29uZmlnPEZlZWRiYWNrU3VydmV5Q29uZmlnPihcbiAgICAndGVuZ3VfZmVlZGJhY2tfc3VydmV5X2NvbmZpZycsXG4gICAgREVGQVVMVF9GRUVEQkFDS19TVVJWRVlfQ09ORklHLFxuICApXG4gIGNvbnN0IGJhZFRyYW5zY3JpcHRBc2tDb25maWcgPSB1c2VEeW5hbWljQ29uZmlnPFRyYW5zY3JpcHRBc2tDb25maWc+KFxuICAgICd0ZW5ndV9iYWRfc3VydmV5X3RyYW5zY3JpcHRfYXNrX2NvbmZpZycsXG4gICAgREVGQVVMVF9UUkFOU0NSSVBUX0FTS19DT05GSUcsXG4gIClcbiAgY29uc3QgZ29vZFRyYW5zY3JpcHRBc2tDb25maWcgPSB1c2VEeW5hbWljQ29uZmlnPFRyYW5zY3JpcHRBc2tDb25maWc+KFxuICAgICd0ZW5ndV9nb29kX3N1cnZleV90cmFuc2NyaXB0X2Fza19jb25maWcnLFxuICAgIERFRkFVTFRfVFJBTlNDUklQVF9BU0tfQ09ORklHLFxuICApXG4gIGNvbnN0IHNldHRpbmdzUmF0ZSA9IGdldEluaXRpYWxTZXR0aW5ncygpLmZlZWRiYWNrU3VydmV5UmF0ZVxuICBjb25zdCBzZXNzaW9uU3RhcnRUaW1lID0gdXNlUmVmKERhdGUubm93KCkpXG4gIGNvbnN0IHN1Ym1pdENvdW50QXRTZXNzaW9uU3RhcnQgPSB1c2VSZWYoc3VibWl0Q291bnQpXG4gIGNvbnN0IHN1Ym1pdENvdW50UmVmID0gdXNlUmVmKHN1Ym1pdENvdW50KVxuICBzdWJtaXRDb3VudFJlZi5jdXJyZW50ID0gc3VibWl0Q291bnRcbiAgY29uc3QgbWVzc2FnZXNSZWYgPSB1c2VSZWYobWVzc2FnZXMpXG4gIG1lc3NhZ2VzUmVmLmN1cnJlbnQgPSBtZXNzYWdlc1xuICAvLyBQcm9iYWJpbGl0eSBnYXRlOiByb2xsIG9uY2Ugd2hlbiBlbGlnaWJpbGl0eSBjb25kaXRpb25zIGFyZSBtZXQsIG5vdCBvbiBldmVyeVxuICAvLyB1c2VNZW1vIHJlLWV2YWx1YXRpb24uIFdpdGhvdXQgdGhpcywgZWFjaCBkZXBlbmRlbmN5IGNoYW5nZSAoc3VibWl0Q291bnQsXG4gIC8vIGlzTG9hZGluZyB0b2dnbGUsIGV0Yy4pIHJlLXJvbGxzIE1hdGgucmFuZG9tKCksIG1ha2luZyB0aGUgc3VydmV5IGFsbW9zdFxuICAvLyBjZXJ0YWluIHRvIGFwcGVhciBhZnRlciBlbm91Z2ggcmVuZGVycy5cbiAgY29uc3QgcHJvYmFiaWxpdHlQYXNzZWRSZWYgPSB1c2VSZWYoZmFsc2UpXG4gIGNvbnN0IGxhc3RFbGlnaWJsZVN1Ym1pdENvdW50UmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpXG5cbiAgY29uc3QgdXBkYXRlTGFzdFNob3duVGltZSA9IHVzZUNhbGxiYWNrKFxuICAgICh0aW1lc3RhbXA6IG51bWJlciwgc3VibWl0Q291bnRWYWx1ZTogbnVtYmVyKSA9PiB7XG4gICAgICBzZXRGZWVkYmFja1N1cnZleShwcmV2ID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHByZXYudGltZUxhc3RTaG93biA9PT0gdGltZXN0YW1wICYmXG4gICAgICAgICAgcHJldi5zdWJtaXRDb3VudEF0TGFzdEFwcGVhcmFuY2UgPT09IHN1Ym1pdENvdW50VmFsdWVcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRpbWVMYXN0U2hvd246IHRpbWVzdGFtcCxcbiAgICAgICAgICBzdWJtaXRDb3VudEF0TGFzdEFwcGVhcmFuY2U6IHN1Ym1pdENvdW50VmFsdWUsXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAvLyBQZXJzaXN0IGNyb3NzLXNlc3Npb24gcGFjaW5nIHN0YXRlIChwcmV2aW91c2x5IGRvbmUgYnkgb25DaGFuZ2VBcHBTdGF0ZSBvYnNlcnZlcilcbiAgICAgIGlmIChnZXRHbG9iYWxDb25maWcoKS5mZWVkYmFja1N1cnZleVN0YXRlPy5sYXN0U2hvd25UaW1lICE9PSB0aW1lc3RhbXApIHtcbiAgICAgICAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+ICh7XG4gICAgICAgICAgLi4uY3VycmVudCxcbiAgICAgICAgICBmZWVkYmFja1N1cnZleVN0YXRlOiB7XG4gICAgICAgICAgICBsYXN0U2hvd25UaW1lOiB0aW1lc3RhbXAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgfSxcbiAgICBbXSxcbiAgKVxuXG4gIGNvbnN0IG9uT3BlbiA9IHVzZUNhbGxiYWNrKFxuICAgIChhcHBlYXJhbmNlSWQ6IHN0cmluZykgPT4ge1xuICAgICAgdXBkYXRlTGFzdFNob3duVGltZShEYXRlLm5vdygpLCBzdWJtaXRDb3VudFJlZi5jdXJyZW50KVxuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X2ZlZWRiYWNrX3N1cnZleV9ldmVudCcsIHtcbiAgICAgICAgZXZlbnRfdHlwZTpcbiAgICAgICAgICAnYXBwZWFyZWQnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIGFwcGVhcmFuY2VfaWQ6XG4gICAgICAgICAgYXBwZWFyYW5jZUlkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIGxhc3RfYXNzaXN0YW50X21lc3NhZ2VfaWQ6XG4gICAgICAgICAgbGFzdEFzc2lzdGFudE1lc3NhZ2VJZFJlZi5jdXJyZW50IGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHN1cnZleV90eXBlOlxuICAgICAgICAgIHN1cnZleVR5cGUgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgIH0pXG4gICAgICB2b2lkIGxvZ09UZWxFdmVudCgnZmVlZGJhY2tfc3VydmV5Jywge1xuICAgICAgICBldmVudF90eXBlOiAnYXBwZWFyZWQnLFxuICAgICAgICBhcHBlYXJhbmNlX2lkOiBhcHBlYXJhbmNlSWQsXG4gICAgICAgIHN1cnZleV90eXBlOiBzdXJ2ZXlUeXBlLFxuICAgICAgfSlcbiAgICB9LFxuICAgIFt1cGRhdGVMYXN0U2hvd25UaW1lLCBzdXJ2ZXlUeXBlXSxcbiAgKVxuXG4gIGNvbnN0IG9uU2VsZWN0ID0gdXNlQ2FsbGJhY2soXG4gICAgKGFwcGVhcmFuY2VJZDogc3RyaW5nLCBzZWxlY3RlZDogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSkgPT4ge1xuICAgICAgdXBkYXRlTGFzdFNob3duVGltZShEYXRlLm5vdygpLCBzdWJtaXRDb3VudFJlZi5jdXJyZW50KVxuICAgICAgbG9nRXZlbnQoJ3Rlbmd1X2ZlZWRiYWNrX3N1cnZleV9ldmVudCcsIHtcbiAgICAgICAgZXZlbnRfdHlwZTpcbiAgICAgICAgICAncmVzcG9uZGVkJyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBhcHBlYXJhbmNlX2lkOlxuICAgICAgICAgIGFwcGVhcmFuY2VJZCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICByZXNwb25zZTpcbiAgICAgICAgICBzZWxlY3RlZCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBsYXN0X2Fzc2lzdGFudF9tZXNzYWdlX2lkOlxuICAgICAgICAgIGxhc3RBc3Npc3RhbnRNZXNzYWdlSWRSZWYuY3VycmVudCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBzdXJ2ZXlfdHlwZTpcbiAgICAgICAgICBzdXJ2ZXlUeXBlIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICB9KVxuICAgICAgdm9pZCBsb2dPVGVsRXZlbnQoJ2ZlZWRiYWNrX3N1cnZleScsIHtcbiAgICAgICAgZXZlbnRfdHlwZTogJ3Jlc3BvbmRlZCcsXG4gICAgICAgIGFwcGVhcmFuY2VfaWQ6IGFwcGVhcmFuY2VJZCxcbiAgICAgICAgcmVzcG9uc2U6IHNlbGVjdGVkLFxuICAgICAgICBzdXJ2ZXlfdHlwZTogc3VydmV5VHlwZSxcbiAgICAgIH0pXG4gICAgfSxcbiAgICBbdXBkYXRlTGFzdFNob3duVGltZSwgc3VydmV5VHlwZV0sXG4gIClcblxuICBjb25zdCBzaG91bGRTaG93VHJhbnNjcmlwdFByb21wdCA9IHVzZUNhbGxiYWNrKFxuICAgIChzZWxlY3RlZDogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSkgPT4ge1xuICAgICAgLy8gT25seSBiYWQgYW5kIGdvb2QgcmF0aW5ncyB0cmlnZ2VyIHRoZSB0cmFuc2NyaXB0IGFza1xuICAgICAgaWYgKHNlbGVjdGVkICE9PSAnYmFkJyAmJiBzZWxlY3RlZCAhPT0gJ2dvb2QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICAvLyBEb24ndCBzaG93IGlmIHVzZXIgcHJldmlvdXNseSBjaG9zZSBcIkRvbid0IGFzayBhZ2FpblwiXG4gICAgICBpZiAoZ2V0R2xvYmFsQ29uZmlnKCkudHJhbnNjcmlwdFNoYXJlRGlzbWlzc2VkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICAvLyBEb24ndCBzaG93IGlmIHByb2R1Y3QgZmVlZGJhY2sgaXMgYmxvY2tlZCBieSBvcmcgcG9saWN5IChaRFIpXG4gICAgICBpZiAoIWlzUG9saWN5QWxsb3dlZCgnYWxsb3dfcHJvZHVjdF9mZWVkYmFjaycpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuXG4gICAgICAvLyBQcm9iYWJpbGl0eSBnYXRlIGZyb20gR3Jvd3RoQm9vayBjb25maWcgKHNlcGFyYXRlIHBlciByYXRpbmcpXG4gICAgICBjb25zdCBwcm9iYWJpbGl0eSA9XG4gICAgICAgIHNlbGVjdGVkID09PSAnYmFkJ1xuICAgICAgICAgID8gYmFkVHJhbnNjcmlwdEFza0NvbmZpZy5wcm9iYWJpbGl0eVxuICAgICAgICAgIDogZ29vZFRyYW5zY3JpcHRBc2tDb25maWcucHJvYmFiaWxpdHlcbiAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpIDw9IHByb2JhYmlsaXR5XG4gICAgfSxcbiAgICBbYmFkVHJhbnNjcmlwdEFza0NvbmZpZy5wcm9iYWJpbGl0eSwgZ29vZFRyYW5zY3JpcHRBc2tDb25maWcucHJvYmFiaWxpdHldLFxuICApXG5cbiAgY29uc3Qgb25UcmFuc2NyaXB0UHJvbXB0U2hvd24gPSB1c2VDYWxsYmFjayhcbiAgICAoYXBwZWFyYW5jZUlkOiBzdHJpbmcsIHN1cnZleVJlc3BvbnNlOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlKSA9PiB7XG4gICAgICBjb25zdCB0cmlnZ2VyOiBUcmFuc2NyaXB0U2hhcmVUcmlnZ2VyID1cbiAgICAgICAgc3VydmV5UmVzcG9uc2UgPT09ICdnb29kJ1xuICAgICAgICAgID8gJ2dvb2RfZmVlZGJhY2tfc3VydmV5J1xuICAgICAgICAgIDogJ2JhZF9mZWVkYmFja19zdXJ2ZXknXG4gICAgICBsb2dFdmVudCgndGVuZ3VfZmVlZGJhY2tfc3VydmV5X2V2ZW50Jywge1xuICAgICAgICBldmVudF90eXBlOlxuICAgICAgICAgICd0cmFuc2NyaXB0X3Byb21wdF9hcHBlYXJlZCcgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgICAgYXBwZWFyYW5jZV9pZDpcbiAgICAgICAgICBhcHBlYXJhbmNlSWQgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgICAgbGFzdF9hc3Npc3RhbnRfbWVzc2FnZV9pZDpcbiAgICAgICAgICBsYXN0QXNzaXN0YW50TWVzc2FnZUlkUmVmLmN1cnJlbnQgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgICAgc3VydmV5X3R5cGU6XG4gICAgICAgICAgc3VydmV5VHlwZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICB0cmlnZ2VyOlxuICAgICAgICAgIHRyaWdnZXIgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgIH0pXG4gICAgICB2b2lkIGxvZ09UZWxFdmVudCgnZmVlZGJhY2tfc3VydmV5Jywge1xuICAgICAgICBldmVudF90eXBlOiAndHJhbnNjcmlwdF9wcm9tcHRfYXBwZWFyZWQnLFxuICAgICAgICBhcHBlYXJhbmNlX2lkOiBhcHBlYXJhbmNlSWQsXG4gICAgICAgIHN1cnZleV90eXBlOiBzdXJ2ZXlUeXBlLFxuICAgICAgfSlcbiAgICB9LFxuICAgIFtzdXJ2ZXlUeXBlXSxcbiAgKVxuXG4gIGNvbnN0IG9uVHJhbnNjcmlwdFNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIChcbiAgICAgIGFwcGVhcmFuY2VJZDogc3RyaW5nLFxuICAgICAgc2VsZWN0ZWQ6IFRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlLFxuICAgICAgc3VydmV5UmVzcG9uc2U6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UgfCBudWxsLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgICAgY29uc3QgdHJpZ2dlcjogVHJhbnNjcmlwdFNoYXJlVHJpZ2dlciA9XG4gICAgICAgIHN1cnZleVJlc3BvbnNlID09PSAnZ29vZCdcbiAgICAgICAgICA/ICdnb29kX2ZlZWRiYWNrX3N1cnZleSdcbiAgICAgICAgICA6ICdiYWRfZmVlZGJhY2tfc3VydmV5J1xuXG4gICAgICBsb2dFdmVudCgndGVuZ3VfZmVlZGJhY2tfc3VydmV5X2V2ZW50Jywge1xuICAgICAgICBldmVudF90eXBlOlxuICAgICAgICAgIGB0cmFuc2NyaXB0X3NoYXJlXyR7c2VsZWN0ZWR9YCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBhcHBlYXJhbmNlX2lkOlxuICAgICAgICAgIGFwcGVhcmFuY2VJZCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBsYXN0X2Fzc2lzdGFudF9tZXNzYWdlX2lkOlxuICAgICAgICAgIGxhc3RBc3Npc3RhbnRNZXNzYWdlSWRSZWYuY3VycmVudCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBzdXJ2ZXlfdHlwZTpcbiAgICAgICAgICBzdXJ2ZXlUeXBlIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHRyaWdnZXI6XG4gICAgICAgICAgdHJpZ2dlciBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgfSlcblxuICAgICAgaWYgKHNlbGVjdGVkID09PSAnZG9udF9hc2tfYWdhaW4nKSB7XG4gICAgICAgIHNhdmVHbG9iYWxDb25maWcoY3VycmVudCA9PiAoe1xuICAgICAgICAgIC4uLmN1cnJlbnQsXG4gICAgICAgICAgdHJhbnNjcmlwdFNoYXJlRGlzbWlzc2VkOiB0cnVlLFxuICAgICAgICB9KSlcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdGVkID09PSAneWVzJykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdWJtaXRUcmFuc2NyaXB0U2hhcmUoXG4gICAgICAgICAgbWVzc2FnZXNSZWYuY3VycmVudCxcbiAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgIGFwcGVhcmFuY2VJZCxcbiAgICAgICAgKVxuICAgICAgICBsb2dFdmVudCgndGVuZ3VfZmVlZGJhY2tfc3VydmV5X2V2ZW50Jywge1xuICAgICAgICAgIGV2ZW50X3R5cGU6IChyZXN1bHQuc3VjY2Vzc1xuICAgICAgICAgICAgPyAndHJhbnNjcmlwdF9zaGFyZV9zdWJtaXR0ZWQnXG4gICAgICAgICAgICA6ICd0cmFuc2NyaXB0X3NoYXJlX2ZhaWxlZCcpIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgICAgYXBwZWFyYW5jZV9pZDpcbiAgICAgICAgICAgIGFwcGVhcmFuY2VJZCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICAgIHRyaWdnZXI6XG4gICAgICAgICAgICB0cmlnZ2VyIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiByZXN1bHQuc3VjY2Vzc1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxuICAgIFtzdXJ2ZXlUeXBlXSxcbiAgKVxuXG4gIGNvbnN0IHsgc3RhdGUsIGxhc3RSZXNwb25zZSwgb3BlbiwgaGFuZGxlU2VsZWN0LCBoYW5kbGVUcmFuc2NyaXB0U2VsZWN0IH0gPVxuICAgIHVzZVN1cnZleVN0YXRlKHtcbiAgICAgIGhpZGVUaGFua3NBZnRlck1zOiBjb25maWcuaGlkZVRoYW5rc0FmdGVyTXMsXG4gICAgICBvbk9wZW4sXG4gICAgICBvblNlbGVjdCxcbiAgICAgIHNob3VsZFNob3dUcmFuc2NyaXB0UHJvbXB0LFxuICAgICAgb25UcmFuc2NyaXB0UHJvbXB0U2hvd24sXG4gICAgICBvblRyYW5zY3JpcHRTZWxlY3QsXG4gICAgfSlcblxuICBjb25zdCBjdXJyZW50TW9kZWwgPSBnZXRNYWluTG9vcE1vZGVsKClcbiAgY29uc3QgaXNNb2RlbEFsbG93ZWQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoY29uZmlnLm9uRm9yTW9kZWxzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChjb25maWcub25Gb3JNb2RlbHMuaW5jbHVkZXMoJyonKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGNvbmZpZy5vbkZvck1vZGVscy5pbmNsdWRlcyhjdXJyZW50TW9kZWwpXG4gIH0sIFtjb25maWcub25Gb3JNb2RlbHMsIGN1cnJlbnRNb2RlbF0pXG5cbiAgY29uc3Qgc2hvdWxkT3BlbiA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChzdGF0ZSAhPT0gJ2Nsb3NlZCcpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmIChpc0xvYWRpbmcpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIERvbid0IHNob3cgc3VydmV5IHdoZW4gcGVybWlzc2lvbiBvciBhc2sgcXVlc3Rpb24gcHJvbXB0cyBhcmUgdmlzaWJsZVxuICAgIGlmIChoYXNBY3RpdmVQcm9tcHQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIEZvcmNlIGRpc3BsYXkgZm9yIHRlc3RpbmdcbiAgICBpZiAoXG4gICAgICBwcm9jZXNzLmVudi5DTEFVREVfRk9SQ0VfRElTUExBWV9TVVJWRVkgJiZcbiAgICAgICFmZWVkYmFja1N1cnZleS50aW1lTGFzdFNob3duXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIGlmICghaXNNb2RlbEFsbG93ZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmIChpc0VudlRydXRoeShwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9ESVNBQkxFX0ZFRURCQUNLX1NVUlZFWSkpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGlmIChpc0ZlZWRiYWNrU3VydmV5RGlzYWJsZWQoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgcHJvZHVjdCBmZWVkYmFjayBpcyBhbGxvd2VkIGJ5IG9yZyBwb2xpY3lcbiAgICBpZiAoIWlzUG9saWN5QWxsb3dlZCgnYWxsb3dfcHJvZHVjdF9mZWVkYmFjaycpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBDaGVjayBzZXNzaW9uLWxvY2FsIHBhY2luZ1xuICAgIGlmIChmZWVkYmFja1N1cnZleS50aW1lTGFzdFNob3duKSB7XG4gICAgICAvLyBDaGVjayB0aW1lIGVsYXBzZWQgc2luY2UgbGFzdCBhcHBlYXJhbmNlIGluIHRoaXMgc2Vzc2lvblxuICAgICAgY29uc3QgdGltZVNpbmNlTGFzdFNob3duID0gRGF0ZS5ub3coKSAtIGZlZWRiYWNrU3VydmV5LnRpbWVMYXN0U2hvd25cbiAgICAgIGlmICh0aW1lU2luY2VMYXN0U2hvd24gPCBjb25maWcubWluVGltZUJldHdlZW5GZWVkYmFja01zKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgLy8gQ2hlY2sgdXNlciB0dXJuIHJlcXVpcmVtZW50IGZvciBzdWJzZXF1ZW50IGFwcGVhcmFuY2VzXG4gICAgICBpZiAoXG4gICAgICAgIGZlZWRiYWNrU3VydmV5LnN1Ym1pdENvdW50QXRMYXN0QXBwZWFyYW5jZSAhPT0gbnVsbCAmJlxuICAgICAgICBzdWJtaXRDb3VudCA8XG4gICAgICAgICAgZmVlZGJhY2tTdXJ2ZXkuc3VibWl0Q291bnRBdExhc3RBcHBlYXJhbmNlICtcbiAgICAgICAgICAgIGNvbmZpZy5taW5Vc2VyVHVybnNCZXR3ZWVuRmVlZGJhY2tcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmlyc3QgYXBwZWFyYW5jZSBpbiB0aGlzIHNlc3Npb25cbiAgICAgIGNvbnN0IHRpbWVTaW5jZVNlc3Npb25TdGFydCA9IERhdGUubm93KCkgLSBzZXNzaW9uU3RhcnRUaW1lLmN1cnJlbnRcbiAgICAgIGlmICh0aW1lU2luY2VTZXNzaW9uU3RhcnQgPCBjb25maWcubWluVGltZUJlZm9yZUZlZWRiYWNrTXMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIHN1Ym1pdENvdW50IDxcbiAgICAgICAgc3VibWl0Q291bnRBdFNlc3Npb25TdGFydC5jdXJyZW50ICsgY29uZmlnLm1pblVzZXJUdXJuc0JlZm9yZUZlZWRiYWNrXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUHJvYmFiaWxpdHkgY2hlY2s6IHJvbGwgb25jZSBwZXIgZWxpZ2liaWxpdHkgd2luZG93IHRvIGF2b2lkIHJlLXJvbGxpbmdcbiAgICAvLyBvbiBldmVyeSB1c2VNZW1vIHJlLWV2YWx1YXRpb24gKHdoaWNoIHdvdWxkIG1ha2UgdHJpZ2dlcmluZyBuZWFyLWNlcnRhaW4pLlxuICAgIGlmIChsYXN0RWxpZ2libGVTdWJtaXRDb3VudFJlZi5jdXJyZW50ICE9PSBzdWJtaXRDb3VudCkge1xuICAgICAgbGFzdEVsaWdpYmxlU3VibWl0Q291bnRSZWYuY3VycmVudCA9IHN1Ym1pdENvdW50XG4gICAgICBwcm9iYWJpbGl0eVBhc3NlZFJlZi5jdXJyZW50ID1cbiAgICAgICAgTWF0aC5yYW5kb20oKSA8PSAoc2V0dGluZ3NSYXRlID8/IGNvbmZpZy5wcm9iYWJpbGl0eSlcbiAgICB9XG4gICAgaWYgKCFwcm9iYWJpbGl0eVBhc3NlZFJlZi5jdXJyZW50KSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyBDaGVjayBnbG9iYWwgcGFjaW5nIChhY3Jvc3MgYWxsIHNlc3Npb25zKVxuICAgIC8vIExlYXZlIHRoaXMgdGlsbCBsYXN0IGJlY2F1c2UgaXQgcmVhZHMgZnJvbSB0aGUgZmlsZXN5c3RlbSB3aGljaCBpcyBleHBlbnNpdmUuXG4gICAgY29uc3QgZ2xvYmFsRmVlZGJhY2tTdGF0ZSA9IGdldEdsb2JhbENvbmZpZygpLmZlZWRiYWNrU3VydmV5U3RhdGVcbiAgICBpZiAoZ2xvYmFsRmVlZGJhY2tTdGF0ZT8ubGFzdFNob3duVGltZSkge1xuICAgICAgY29uc3QgdGltZVNpbmNlR2xvYmFsTGFzdFNob3duID1cbiAgICAgICAgRGF0ZS5ub3coKSAtIGdsb2JhbEZlZWRiYWNrU3RhdGUubGFzdFNob3duVGltZVxuICAgICAgaWYgKHRpbWVTaW5jZUdsb2JhbExhc3RTaG93biA8IGNvbmZpZy5taW5UaW1lQmV0d2Vlbkdsb2JhbEZlZWRiYWNrTXMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfSwgW1xuICAgIHN0YXRlLFxuICAgIGlzTG9hZGluZyxcbiAgICBoYXNBY3RpdmVQcm9tcHQsXG4gICAgaXNNb2RlbEFsbG93ZWQsXG4gICAgZmVlZGJhY2tTdXJ2ZXkudGltZUxhc3RTaG93bixcbiAgICBmZWVkYmFja1N1cnZleS5zdWJtaXRDb3VudEF0TGFzdEFwcGVhcmFuY2UsXG4gICAgc3VibWl0Q291bnQsXG4gICAgY29uZmlnLm1pblRpbWVCZXR3ZWVuRmVlZGJhY2tNcyxcbiAgICBjb25maWcubWluVGltZUJldHdlZW5HbG9iYWxGZWVkYmFja01zLFxuICAgIGNvbmZpZy5taW5Vc2VyVHVybnNCZXR3ZWVuRmVlZGJhY2ssXG4gICAgY29uZmlnLm1pblRpbWVCZWZvcmVGZWVkYmFja01zLFxuICAgIGNvbmZpZy5taW5Vc2VyVHVybnNCZWZvcmVGZWVkYmFjayxcbiAgICBjb25maWcucHJvYmFiaWxpdHksXG4gICAgc2V0dGluZ3NSYXRlLFxuICBdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHNob3VsZE9wZW4pIHtcbiAgICAgIG9wZW4oKVxuICAgIH1cbiAgfSwgW3Nob3VsZE9wZW4sIG9wZW5dKVxuXG4gIHJldHVybiB7IHN0YXRlLCBsYXN0UmVzcG9uc2UsIGhhbmRsZVNlbGVjdCwgaGFuZGxlVHJhbnNjcmlwdFNlbGVjdCB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLFdBQVcsRUFBRUMsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLE1BQU0sRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDekUsU0FBU0MsZ0JBQWdCLFFBQVEsK0JBQStCO0FBQ2hFLFNBQVNDLHdCQUF3QixRQUFRLGtDQUFrQztBQUMzRSxTQUNFLEtBQUtDLDBEQUEwRCxFQUMvREMsUUFBUSxRQUNILGlDQUFpQztBQUN4QyxTQUFTQyxlQUFlLFFBQVEsc0NBQXNDO0FBQ3RFLGNBQWNDLE9BQU8sUUFBUSx3QkFBd0I7QUFDckQsU0FBU0MsZUFBZSxFQUFFQyxnQkFBZ0IsUUFBUSx1QkFBdUI7QUFDekUsU0FBU0MsV0FBVyxRQUFR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