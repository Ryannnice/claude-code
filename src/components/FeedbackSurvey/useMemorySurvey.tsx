// 引入 useCallback、useEffect、useMemo、useRef，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef } from 'react';
// 接入 isFeedbackSurveyDisabled 服务层能力，把外部通信或共享状态交给 src/services/analytics/config.js 处理。
import { isFeedbackSurveyDisabled } from 'src/services/analytics/config.js';
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 引入 isAutoMemoryEnabled，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled } from '../../memdir/paths.js';
// 接入 isPolicyAllowed 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { isPolicyAllowed } from '../../services/policyLimits/index.js';
// 接入 FILE_READ_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { FILE_READ_TOOL_NAME } from '../../tools/FileReadTool/prompt.js';
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { Message } from '../../types/message.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// 复用 isAutoManagedMemoryFile 工具函数，把通用处理留在 ../../utils/memoryFileDetection.js 中维护。
import { isAutoManagedMemoryFile } from '../../utils/memoryFileDetection.js';
// 复用 extractTextContent、getLastAssistantMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTextContent, getLastAssistantMessage } from '../../utils/messages.js';
// 复用 logOTelEvent 工具函数，把通用处理留在 ../../utils/telemetry/events.js 中维护。
import { logOTelEvent } from '../../utils/telemetry/events.js';
// 引入 submitTranscriptShare，将 ./submitTranscriptShare.js 中已经封装好的能力接到本文件流程里。
import { submitTranscriptShare } from './submitTranscriptShare.js';
// 类型依赖 { TranscriptShareResponse } 来自 ./TranscriptSharePrompt.js，用于校准终端渲染的数据契约。
import type { TranscriptShareResponse } from './TranscriptSharePrompt.js';
// 引入 useSurveyState，将 ./useSurveyState.js 中已经封装好的能力接到本文件流程里。
import { useSurveyState } from './useSurveyState.js';
// 类型依赖 { FeedbackSurveyResponse } 来自 ./utils.js，用于校准终端渲染的数据契约。
import type { FeedbackSurveyResponse } from './utils.js';
// HIDE_THANKS_AFTER_MS 集合 命名 `3000`，让后续代码直接表达这个值的用途。
const HIDE_THANKS_AFTER_MS = 3000;
// MEMORY_SURVEY_GATE保存`'tengu_dunwich_bell'`，作为后续固定文本处理的输入。
const MEMORY_SURVEY_GATE = 'tengu_dunwich_bell';
// MEMORY_SURVEY_EVENT保存`'tengu_memory_survey_event'`，作为后续固定文本处理的输入。
const MEMORY_SURVEY_EVENT = 'tengu_memory_survey_event';
// SURVEY_PROBABILITY保存`0.2`，供后续判断或组装使用。
const SURVEY_PROBABILITY = 0.2;
// TRANSCRIPT_SHARE_TRIGGER保存`'memory_survey'`，作为后续固定文本处理的输入。
const TRANSCRIPT_SHARE_TRIGGER = 'memory_survey';
// MEMORY_WORD_RE保存`bmemor`，供终端渲染后续处理使用。
const MEMORY_WORD_RE = /\bmemor(?:y|ies)\b/i;
// hasMemoryFileRead 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasMemoryFileRead(messages: Message[]): boolean {
  // 按顺序遍历 `messages` 中的消息，逐个交给终端渲染处理。
  for (const message of messages) {
    // `message.type` 与 `'assistant'` 不一致时刷新派生状态，避免使用过期结果。
    if (message.type !== 'assistant') {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue;
    }
    // 文本内容保存`message.message.content`，供后续判断或组装使用。
    const content = message.message.content;
    // 满足 `!Array.isArray(content)` 时，终端渲染执行该分支。
    if (!Array.isArray(content)) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue;
    }
    // 按顺序遍历 `content` 中的block，逐个交给终端渲染处理。
    for (const block of content) {
      // `block.type` 与 `'tool_use' || block.name !== FI...` 不一致时刷新派生状态，避免使用过期结果。
      if (block.type !== 'tool_use' || block.name !== FILE_READ_TOOL_NAME) {
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue;
      }
      // 用户输入 命名 `block.input as {`，让后续代码直接表达这个值的用途。
      const input = block.input as {
        file_path?: unknown;
      };
      // 只有 `typeof input.file_path === 'string' && isAutoManagedMemoryFile(input.file_p...` 满足时，终端渲染才执行该分支。
      if (typeof input.file_path === 'string' && isAutoManagedMemoryFile(input.file_path)) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true;
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false;
}
// useMemorySurvey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMemorySurvey(messages: Message[], isLoading: boolean, hasActivePrompt = false, {
  enabled = true
}: {
  enabled?: boolean;
} = {}): {
  state: 'closed' | 'open' | 'thanks' | 'transcript_prompt' | 'submitting' | 'submitted';
  lastResponse: FeedbackSurveyResponse | null;
  // 这个回调绑定到 handleSelect: (selected: FeedbackSurveyResponse) => void;，负责终端渲染在该局部场景下的响应。
  handleSelect: (selected: FeedbackSurveyResponse) => void;
  // 这个回调绑定到 handleTranscriptSelect: (selected: TranscriptShareResponse) => void;，负责终端渲染在该局部场景下的响应。
  handleTranscriptSelect: (selected: TranscriptShareResponse) => void;
} {
  // Track assistant message UUIDs that were already evaluated so we don't
  // re-roll probability on re-renders or re-scan messages for the same turn.
  // seenAssistantUuids 集合保存`Set`，供终端渲染后续处理使用。
  const seenAssistantUuids = useRef<Set<string>>(new Set());
  // Once a memory file read is observed it stays true for the session —
  // skip the O(n) scan on subsequent turns.
  // memoryReadSeen保存`useRef`，供终端渲染后续处理使用。
  const memoryReadSeen = useRef(false);
  // messagesRef 引用保存`useRef`，供终端渲染后续处理使用。
  const messagesRef = useRef(messages);
  // current更新为 `messages`，确保终端 UI后续读取最新状态。
  messagesRef.current = messages;
  // onOpen保存`useCallback`，供终端渲染后续处理使用。
  const onOpen = useCallback((appearanceId: string) => {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent(MEMORY_SURVEY_EVENT, {
      event_type: 'appeared' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 显式忽略 `logOTelEvent('feedback_survey', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('feedback_survey', {
      event_type: 'appeared',
      appearance_id: appearanceId,
      survey_type: 'memory'
    });
  }, []);
  // onSelect保存`useCallback`，供终端渲染后续处理使用。
  const onSelect = useCallback((appearanceId_0: string, selected: FeedbackSurveyResponse) => {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent(MEMORY_SURVEY_EVENT, {
      event_type: 'responded' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId_0 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      response: selected as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 显式忽略 `logOTelEvent('feedback_survey', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('feedback_survey', {
      event_type: 'responded',
      appearance_id: appearanceId_0,
      response: selected,
      survey_type: 'memory'
    });
  }, []);
  // shouldShowTranscriptPrompt记录 `useCallback` 是否成立，终端渲染随后按该结果分支。
  const shouldShowTranscriptPrompt = useCallback((selected_0: FeedbackSurveyResponse) => {
    // `"external"` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
    if ("external" !== 'ant') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // `selected_0` 与 `'bad' && selected_0 !== 'good'` 不一致时刷新派生状态，避免使用过期结果。
    if (selected_0 !== 'bad' && selected_0 !== 'good') {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 满足 `getGlobalConfig().transcriptShareDismissed` 时，终端渲染执行该分支。
    if (getGlobalConfig().transcriptShareDismissed) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 满足 `!isPolicyAllowed('allow_product_feedback')` 时，终端渲染执行该分支。
    if (!isPolicyAllowed('allow_product_feedback')) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true;
  }, []);
  // onTranscriptPromptShown保存`useCallback`，供终端渲染后续处理使用。
  const onTranscriptPromptShown = useCallback((appearanceId_1: string) => {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent(MEMORY_SURVEY_EVENT, {
      event_type: 'transcript_prompt_appeared' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId_1 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      trigger: TRANSCRIPT_SHARE_TRIGGER as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 显式忽略 `logOTelEvent('feedback_survey', {` 的返回值，只保留它触发的副作用。
    void logOTelEvent('feedback_survey', {
      event_type: 'transcript_prompt_appeared',
      appearance_id: appearanceId_1,
      survey_type: 'memory'
    });
  }, []);
  // onTranscriptSelect保存`useCallback`，供终端渲染后续处理使用。
  const onTranscriptSelect = useCallback(async (appearanceId_2: string, selected_1: TranscriptShareResponse): Promise<boolean> => {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent(MEMORY_SURVEY_EVENT, {
      event_type: `transcript_share_${selected_1}` as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      appearance_id: appearanceId_2 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      trigger: TRANSCRIPT_SHARE_TRIGGER as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
    });
    // 当 `selected_1` 匹配 `'dont_ask_again'` 时，终端渲染执行对应分支。
    if (selected_1 === 'dont_ask_again') {
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(current => ({
        ...current,
        transcriptShareDismissed: true
      }));
    }
    // 当 `selected_1` 匹配 `'yes'` 时，终端渲染执行对应分支。
    if (selected_1 === 'yes') {
      // 结果保存`submitTranscriptShare`，供终端渲染后续处理使用。
      const result = await submitTranscriptShare(messagesRef.current, TRANSCRIPT_SHARE_TRIGGER, appearanceId_2);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent(MEMORY_SURVEY_EVENT, {
        event_type: (result.success ? 'transcript_share_submitted' : 'transcript_share_failed') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        appearance_id: appearanceId_2 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        trigger: TRANSCRIPT_SHARE_TRIGGER as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      // 返回 `result.success`，作为终端渲染这次计算的结果。
      return result.success;
    }
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }, []);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    state,
    lastResponse,
    open,
    handleSelect,
    handleTranscriptSelect
  } = useSurveyState({
    hideThanksAfterMs: HIDE_THANKS_AFTER_MS,
    onOpen,
    onSelect,
    shouldShowTranscriptPrompt,
    onTranscriptPromptShown,
    onTranscriptSelect
  });
  // lastAssistant保存`useMemo`，供终端渲染后续处理使用。
  const lastAssistant = useMemo(() => getLastAssistantMessage(messages), [messages]);
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // enabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!enabled) return;

    // /clear resets messages but REPL stays mounted — reset refs so a memory
    // read from the previous conversation doesn't leak into the new one.
    // 对话消息为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (messages.length === 0) {
      // current更新为 `false`，确保终端 UI后续读取最新状态。
      memoryReadSeen.current = false;
      // 调用 seenAssistantUuids.current.clear，触发终端渲染此处需要的副作用。
      seenAssistantUuids.current.clear();
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // `state` 与 `'closed' || isLoading || hasAct...` 不一致时刷新派生状态，避免使用过期结果。
    if (state !== 'closed' || isLoading || hasActivePrompt) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }

    // 3P default: survey off (no GrowthBook on Bedrock/Vertex/Foundry).
    // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE(MEMORY_SURVEY_GATE, false)` 时，终端渲染执行该分支。
    if (!getFeatureValue_CACHED_MAY_BE_STALE(MEMORY_SURVEY_GATE, false)) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 满足 `!isAutoMemoryEnabled()` 时，终端渲染执行该分支。
    if (!isAutoMemoryEnabled()) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 满足 `isFeedbackSurveyDisabled()` 时，终端渲染执行该分支。
    if (isFeedbackSurveyDisabled()) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 满足 `!isPolicyAllowed('allow_product_feedback')` 时，终端渲染执行该分支。
    if (!isPolicyAllowed('allow_product_feedback')) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY)` 时，终端渲染执行该分支。
    if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY)) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 只有 `!lastAssistant || seenAssistantUuids.current.has(lastAssistant.uuid)` 满足时，终端渲染才执行该分支。
    if (!lastAssistant || seenAssistantUuids.current.has(lastAssistant.uuid)) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 文本保存`extractTextContent`，供终端渲染后续处理使用。
    const text = extractTextContent(lastAssistant.message.content, ' ');
    // 满足 `!MEMORY_WORD_RE.test(text)` 时，终端渲染执行该分支。
    if (!MEMORY_WORD_RE.test(text)) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }

    // Mark as evaluated before the memory-read scan so a turn that mentions
    // "memory" but has no memory read doesn't trigger repeated O(n) scans
    // on subsequent renders with the same last assistant message.
    // 调用 seenAssistantUuids.current.add，触发终端渲染此处需要的副作用。
    seenAssistantUuids.current.add(lastAssistant.uuid);
    // memoryReadSeen.current缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!memoryReadSeen.current) {
      // current更新为 `hasMemoryFileRead(messages)`，确保终端 UI后续读取最新状态。
      memoryReadSeen.current = hasMemoryFileRead(messages);
    }
    // memoryReadSeen.current缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!memoryReadSeen.current) {
      // 终端 UI 组件 use Memory Survey在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 满足 `Math.random() < SURVEY_PROBABILITY` 时，终端渲染执行该分支。
    if (Math.random() < SURVEY_PROBABILITY) {
      // 调用 open，触发终端渲染此处需要的副作用。
      open();
    }
  }, [enabled, state, isLoading, hasActivePrompt, lastAssistant, messages, open]);
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    state,
    lastResponse,
    handleSelect,
    handleTranscriptSelect
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VSZWYiLCJpc0ZlZWRiYWNrU3VydmV5RGlzYWJsZWQiLCJnZXRGZWF0dXJlVmFsdWVfQ0FDSEVEX01BWV9CRV9TVEFMRSIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsImlzQXV0b01lbW9yeUVuYWJsZWQiLCJpc1BvbGljeUFsbG93ZWQiLCJGSUxFX1JFQURfVE9PTF9OQU1FIiwiTWVzc2FnZSIsImdldEdsb2JhbENvbmZpZyIsInNhdmVHbG9iYWxDb25maWciLCJpc0VudlRydXRoeSIsImlzQXV0b01hbmFnZWRNZW1vcnlGaWxlIiwiZXh0cmFjdFRleHRDb250ZW50IiwiZ2V0TGFzdEFzc2lzdGFudE1lc3NhZ2UiLCJsb2dPVGVsRXZlbnQiLCJzdWJtaXRUcmFuc2NyaXB0U2hhcmUiLCJUcmFuc2NyaXB0U2hhcmVSZXNwb25zZSIsInVzZVN1cnZleVN0YXRlIiwiRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSIsIkhJREVfVEhBTktTX0FGVEVSX01TIiwiTUVNT1JZX1NVUlZFWV9HQVRFIiwiTUVNT1JZX1NVUlZFWV9FVkVOVCIsIlNVUlZFWV9QUk9CQUJJTElUWSIsIlRSQU5TQ1JJUFRfU0hBUkVfVFJJR0dFUiIsIk1FTU9SWV9XT1JEX1JFIiwiaGFzTWVtb3J5RmlsZVJlYWQiLCJtZXNzYWdlcyIsIm1lc3NhZ2UiLCJ0eXBlIiwiY29udGVudCIsIkFycmF5IiwiaXNBcnJheSIsImJsb2NrIiwibmFtZSIsImlucHV0IiwiZmlsZV9wYXRoIiwidXNlTWVtb3J5U3VydmV5IiwiaXNMb2FkaW5nIiwiaGFzQWN0aXZlUHJvbXB0IiwiZW5hYmxlZCIsInN0YXRlIiwibGFzdFJlc3BvbnNlIiwiaGFuZGxlU2VsZWN0Iiwic2VsZWN0ZWQiLCJoYW5kbGVUcmFuc2NyaXB0U2VsZWN0Iiwic2VlbkFzc2lzdGFudFV1aWRzIiwiU2V0IiwibWVtb3J5UmVhZFNlZW4iLCJtZXNzYWdlc1JlZiIsImN1cnJlbnQiLCJvbk9wZW4iLCJhcHBlYXJhbmNlSWQiLCJldmVudF90eXBlIiwiYXBwZWFyYW5jZV9pZCIsInN1cnZleV90eXBlIiwib25TZWxlY3QiLCJyZXNwb25zZSIsInNob3VsZFNob3dUcmFuc2NyaXB0UHJvbXB0IiwidHJhbnNjcmlwdFNoYXJlRGlzbWlzc2VkIiwib25UcmFuc2NyaXB0UHJvbXB0U2hvd24iLCJ0cmlnZ2VyIiwib25UcmFuc2NyaXB0U2VsZWN0IiwiUHJvbWlzZSIsInJlc3VsdCIsInN1Y2Nlc3MiLCJvcGVuIiwiaGlkZVRoYW5rc0FmdGVyTXMiLCJsYXN0QXNzaXN0YW50IiwibGVuZ3RoIiwiY2xlYXIiLCJwcm9jZXNzIiwiZW52IiwiQ0xBVURFX0NPREVfRElTQUJMRV9GRUVEQkFDS19TVVJWRVkiLCJoYXMiLCJ1dWlkIiwidGV4dCIsInRlc3QiLCJhZGQiLCJNYXRoIiwicmFuZG9tIl0sInNvdXJjZXMiOlsidXNlTWVtb3J5U3VydmV5LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGlzRmVlZGJhY2tTdXJ2ZXlEaXNhYmxlZCB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9hbmFseXRpY3MvY29uZmlnLmpzJ1xuaW1wb3J0IHsgZ2V0RmVhdHVyZVZhbHVlX0NBQ0hFRF9NQVlfQkVfU1RBTEUgfSBmcm9tICdzcmMvc2VydmljZXMvYW5hbHl0aWNzL2dyb3d0aGJvb2suanMnXG5pbXBvcnQge1xuICB0eXBlIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gIGxvZ0V2ZW50LFxufSBmcm9tICdzcmMvc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgaXNBdXRvTWVtb3J5RW5hYmxlZCB9IGZyb20gJy4uLy4uL21lbWRpci9wYXRocy5qcydcbmltcG9ydCB7IGlzUG9saWN5QWxsb3dlZCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3BvbGljeUxpbWl0cy9pbmRleC5qcydcbmltcG9ydCB7IEZJTEVfUkVBRF9UT09MX05BTUUgfSBmcm9tICcuLi8uLi90b29scy9GaWxlUmVhZFRvb2wvcHJvbXB0LmpzJ1xuaW1wb3J0IHR5cGUgeyBNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB7IGdldEdsb2JhbENvbmZpZywgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGlzRW52VHJ1dGh5IH0gZnJvbSAnLi4vLi4vdXRpbHMvZW52VXRpbHMuanMnXG5pbXBvcnQgeyBpc0F1dG9NYW5hZ2VkTWVtb3J5RmlsZSB9IGZyb20gJy4uLy4uL3V0aWxzL21lbW9yeUZpbGVEZXRlY3Rpb24uanMnXG5pbXBvcnQge1xuICBleHRyYWN0VGV4dENvbnRlbnQsXG4gIGdldExhc3RBc3Npc3RhbnRNZXNzYWdlLFxufSBmcm9tICcuLi8uLi91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IGxvZ09UZWxFdmVudCB9IGZyb20gJy4uLy4uL3V0aWxzL3RlbGVtZXRyeS9ldmVudHMuanMnXG5pbXBvcnQgeyBzdWJtaXRUcmFuc2NyaXB0U2hhcmUgfSBmcm9tICcuL3N1Ym1pdFRyYW5zY3JpcHRTaGFyZS5qcydcbmltcG9ydCB0eXBlIHsgVHJhbnNjcmlwdFNoYXJlUmVzcG9uc2UgfSBmcm9tICcuL1RyYW5zY3JpcHRTaGFyZVByb21wdC5qcydcbmltcG9ydCB7IHVzZVN1cnZleVN0YXRlIH0gZnJvbSAnLi91c2VTdXJ2ZXlTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSB9IGZyb20gJy4vdXRpbHMuanMnXG5cbmNvbnN0IEhJREVfVEhBTktTX0FGVEVSX01TID0gMzAwMFxuY29uc3QgTUVNT1JZX1NVUlZFWV9HQVRFID0gJ3Rlbmd1X2R1bndpY2hfYmVsbCdcbmNvbnN0IE1FTU9SWV9TVVJWRVlfRVZFTlQgPSAndGVuZ3VfbWVtb3J5X3N1cnZleV9ldmVudCdcbmNvbnN0IFNVUlZFWV9QUk9CQUJJTElUWSA9IDAuMlxuY29uc3QgVFJBTlNDUklQVF9TSEFSRV9UUklHR0VSID0gJ21lbW9yeV9zdXJ2ZXknXG5cbmNvbnN0IE1FTU9SWV9XT1JEX1JFID0gL1xcYm1lbW9yKD86eXxpZXMpXFxiL2lcblxuZnVuY3Rpb24gaGFzTWVtb3J5RmlsZVJlYWQobWVzc2FnZXM6IE1lc3NhZ2VbXSk6IGJvb2xlYW4ge1xuICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgbWVzc2FnZXMpIHtcbiAgICBpZiAobWVzc2FnZS50eXBlICE9PSAnYXNzaXN0YW50Jykge1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgY29uc3QgY29udGVudCA9IG1lc3NhZ2UubWVzc2FnZS5jb250ZW50XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbnRlbnQpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIGNvbnRlbnQpIHtcbiAgICAgIGlmIChibG9jay50eXBlICE9PSAndG9vbF91c2UnIHx8IGJsb2NrLm5hbWUgIT09IEZJTEVfUkVBRF9UT09MX05BTUUpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlucHV0ID0gYmxvY2suaW5wdXQgYXMgeyBmaWxlX3BhdGg/OiB1bmtub3duIH1cbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGlucHV0LmZpbGVfcGF0aCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgaXNBdXRvTWFuYWdlZE1lbW9yeUZpbGUoaW5wdXQuZmlsZV9wYXRoKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlTWVtb3J5U3VydmV5KFxuICBtZXNzYWdlczogTWVzc2FnZVtdLFxuICBpc0xvYWRpbmc6IGJvb2xlYW4sXG4gIGhhc0FjdGl2ZVByb21wdCA9IGZhbHNlLFxuICB7IGVuYWJsZWQgPSB0cnVlIH06IHsgZW5hYmxlZD86IGJvb2xlYW4gfSA9IHt9LFxuKToge1xuICBzdGF0ZTpcbiAgICB8ICdjbG9zZWQnXG4gICAgfCAnb3BlbidcbiAgICB8ICd0aGFua3MnXG4gICAgfCAndHJhbnNjcmlwdF9wcm9tcHQnXG4gICAgfCAnc3VibWl0dGluZydcbiAgICB8ICdzdWJtaXR0ZWQnXG4gIGxhc3RSZXNwb25zZTogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSB8IG51bGxcbiAgaGFuZGxlU2VsZWN0OiAoc2VsZWN0ZWQ6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UpID0+IHZvaWRcbiAgaGFuZGxlVHJhbnNjcmlwdFNlbGVjdDogKHNlbGVjdGVkOiBUcmFuc2NyaXB0U2hhcmVSZXNwb25zZSkgPT4gdm9pZFxufSB7XG4gIC8vIFRyYWNrIGFzc2lzdGFudCBtZXNzYWdlIFVVSURzIHRoYXQgd2VyZSBhbHJlYWR5IGV2YWx1YXRlZCBzbyB3ZSBkb24ndFxuICAvLyByZS1yb2xsIHByb2JhYmlsaXR5IG9uIHJlLXJlbmRlcnMgb3IgcmUtc2NhbiBtZXNzYWdlcyBmb3IgdGhlIHNhbWUgdHVybi5cbiAgY29uc3Qgc2VlbkFzc2lzdGFudFV1aWRzID0gdXNlUmVmPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpXG4gIC8vIE9uY2UgYSBtZW1vcnkgZmlsZSByZWFkIGlzIG9ic2VydmVkIGl0IHN0YXlzIHRydWUgZm9yIHRoZSBzZXNzaW9uIOKAlFxuICAvLyBza2lwIHRoZSBPKG4pIHNjYW4gb24gc3Vic2VxdWVudCB0dXJucy5cbiAgY29uc3QgbWVtb3J5UmVhZFNlZW4gPSB1c2VSZWYoZmFsc2UpXG4gIGNvbnN0IG1lc3NhZ2VzUmVmID0gdXNlUmVmKG1lc3NhZ2VzKVxuICBtZXNzYWdlc1JlZi5jdXJyZW50ID0gbWVzc2FnZXNcblxuICBjb25zdCBvbk9wZW4gPSB1c2VDYWxsYmFjaygoYXBwZWFyYW5jZUlkOiBzdHJpbmcpID0+IHtcbiAgICBsb2dFdmVudChNRU1PUllfU1VSVkVZX0VWRU5ULCB7XG4gICAgICBldmVudF90eXBlOlxuICAgICAgICAnYXBwZWFyZWQnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICBhcHBlYXJhbmNlX2lkOlxuICAgICAgICBhcHBlYXJhbmNlSWQgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICB9KVxuICAgIHZvaWQgbG9nT1RlbEV2ZW50KCdmZWVkYmFja19zdXJ2ZXknLCB7XG4gICAgICBldmVudF90eXBlOiAnYXBwZWFyZWQnLFxuICAgICAgYXBwZWFyYW5jZV9pZDogYXBwZWFyYW5jZUlkLFxuICAgICAgc3VydmV5X3R5cGU6ICdtZW1vcnknLFxuICAgIH0pXG4gIH0sIFtdKVxuXG4gIGNvbnN0IG9uU2VsZWN0ID0gdXNlQ2FsbGJhY2soXG4gICAgKGFwcGVhcmFuY2VJZDogc3RyaW5nLCBzZWxlY3RlZDogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSkgPT4ge1xuICAgICAgbG9nRXZlbnQoTUVNT1JZX1NVUlZFWV9FVkVOVCwge1xuICAgICAgICBldmVudF90eXBlOlxuICAgICAgICAgICdyZXNwb25kZWQnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIGFwcGVhcmFuY2VfaWQ6XG4gICAgICAgICAgYXBwZWFyYW5jZUlkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHJlc3BvbnNlOlxuICAgICAgICAgIHNlbGVjdGVkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICB9KVxuICAgICAgdm9pZCBsb2dPVGVsRXZlbnQoJ2ZlZWRiYWNrX3N1cnZleScsIHtcbiAgICAgICAgZXZlbnRfdHlwZTogJ3Jlc3BvbmRlZCcsXG4gICAgICAgIGFwcGVhcmFuY2VfaWQ6IGFwcGVhcmFuY2VJZCxcbiAgICAgICAgcmVzcG9uc2U6IHNlbGVjdGVkLFxuICAgICAgICBzdXJ2ZXlfdHlwZTogJ21lbW9yeScsXG4gICAgICB9KVxuICAgIH0sXG4gICAgW10sXG4gIClcblxuICBjb25zdCBzaG91bGRTaG93VHJhbnNjcmlwdFByb21wdCA9IHVzZUNhbGxiYWNrKFxuICAgIChzZWxlY3RlZDogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKFwiZXh0ZXJuYWxcIiAhPT0gJ2FudCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBpZiAoc2VsZWN0ZWQgIT09ICdiYWQnICYmIHNlbGVjdGVkICE9PSAnZ29vZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBpZiAoZ2V0R2xvYmFsQ29uZmlnKCkudHJhbnNjcmlwdFNoYXJlRGlzbWlzc2VkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgaWYgKCFpc1BvbGljeUFsbG93ZWQoJ2FsbG93X3Byb2R1Y3RfZmVlZGJhY2snKSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSxcbiAgICBbXSxcbiAgKVxuXG4gIGNvbnN0IG9uVHJhbnNjcmlwdFByb21wdFNob3duID0gdXNlQ2FsbGJhY2soKGFwcGVhcmFuY2VJZDogc3RyaW5nKSA9PiB7XG4gICAgbG9nRXZlbnQoTUVNT1JZX1NVUlZFWV9FVkVOVCwge1xuICAgICAgZXZlbnRfdHlwZTpcbiAgICAgICAgJ3RyYW5zY3JpcHRfcHJvbXB0X2FwcGVhcmVkJyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgYXBwZWFyYW5jZV9pZDpcbiAgICAgICAgYXBwZWFyYW5jZUlkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICB0cmlnZ2VyOlxuICAgICAgICBUUkFOU0NSSVBUX1NIQVJFX1RSSUdHRVIgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICB9KVxuICAgIHZvaWQgbG9nT1RlbEV2ZW50KCdmZWVkYmFja19zdXJ2ZXknLCB7XG4gICAgICBldmVudF90eXBlOiAndHJhbnNjcmlwdF9wcm9tcHRfYXBwZWFyZWQnLFxuICAgICAgYXBwZWFyYW5jZV9pZDogYXBwZWFyYW5jZUlkLFxuICAgICAgc3VydmV5X3R5cGU6ICdtZW1vcnknLFxuICAgIH0pXG4gIH0sIFtdKVxuXG4gIGNvbnN0IG9uVHJhbnNjcmlwdFNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIChcbiAgICAgIGFwcGVhcmFuY2VJZDogc3RyaW5nLFxuICAgICAgc2VsZWN0ZWQ6IFRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgICAgbG9nRXZlbnQoTUVNT1JZX1NVUlZFWV9FVkVOVCwge1xuICAgICAgICBldmVudF90eXBlOlxuICAgICAgICAgIGB0cmFuc2NyaXB0X3NoYXJlXyR7c2VsZWN0ZWR9YCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICBhcHBlYXJhbmNlX2lkOlxuICAgICAgICAgIGFwcGVhcmFuY2VJZCBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICB0cmlnZ2VyOlxuICAgICAgICAgIFRSQU5TQ1JJUFRfU0hBUkVfVFJJR0dFUiBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgfSlcblxuICAgICAgaWYgKHNlbGVjdGVkID09PSAnZG9udF9hc2tfYWdhaW4nKSB7XG4gICAgICAgIHNhdmVHbG9iYWxDb25maWcoY3VycmVudCA9PiAoe1xuICAgICAgICAgIC4uLmN1cnJlbnQsXG4gICAgICAgICAgdHJhbnNjcmlwdFNoYXJlRGlzbWlzc2VkOiB0cnVlLFxuICAgICAgICB9KSlcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdGVkID09PSAneWVzJykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdWJtaXRUcmFuc2NyaXB0U2hhcmUoXG4gICAgICAgICAgbWVzc2FnZXNSZWYuY3VycmVudCxcbiAgICAgICAgICBUUkFOU0NSSVBUX1NIQVJFX1RSSUdHRVIsXG4gICAgICAgICAgYXBwZWFyYW5jZUlkLFxuICAgICAgICApXG4gICAgICAgIGxvZ0V2ZW50KE1FTU9SWV9TVVJWRVlfRVZFTlQsIHtcbiAgICAgICAgICBldmVudF90eXBlOiAocmVzdWx0LnN1Y2Nlc3NcbiAgICAgICAgICAgID8gJ3RyYW5zY3JpcHRfc2hhcmVfc3VibWl0dGVkJ1xuICAgICAgICAgICAgOiAndHJhbnNjcmlwdF9zaGFyZV9mYWlsZWQnKSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICAgIGFwcGVhcmFuY2VfaWQ6XG4gICAgICAgICAgICBhcHBlYXJhbmNlSWQgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgICAgICB0cmlnZ2VyOlxuICAgICAgICAgICAgVFJBTlNDUklQVF9TSEFSRV9UUklHR0VSIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiByZXN1bHQuc3VjY2Vzc1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxuICAgIFtdLFxuICApXG5cbiAgY29uc3QgeyBzdGF0ZSwgbGFzdFJlc3BvbnNlLCBvcGVuLCBoYW5kbGVTZWxlY3QsIGhhbmRsZVRyYW5zY3JpcHRTZWxlY3QgfSA9XG4gICAgdXNlU3VydmV5U3RhdGUoe1xuICAgICAgaGlkZVRoYW5rc0FmdGVyTXM6IEhJREVfVEhBTktTX0FGVEVSX01TLFxuICAgICAgb25PcGVuLFxuICAgICAgb25TZWxlY3QsXG4gICAgICBzaG91bGRTaG93VHJhbnNjcmlwdFByb21wdCxcbiAgICAgIG9uVHJhbnNjcmlwdFByb21wdFNob3duLFxuICAgICAgb25UcmFuc2NyaXB0U2VsZWN0LFxuICAgIH0pXG5cbiAgY29uc3QgbGFzdEFzc2lzdGFudCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gZ2V0TGFzdEFzc2lzdGFudE1lc3NhZ2UobWVzc2FnZXMpLFxuICAgIFttZXNzYWdlc10sXG4gIClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCkgcmV0dXJuXG5cbiAgICAvLyAvY2xlYXIgcmVzZXRzIG1lc3NhZ2VzIGJ1dCBSRVBMIHN0YXlzIG1vdW50ZWQg4oCUIHJlc2V0IHJlZnMgc28gYSBtZW1vcnlcbiAgICAvLyByZWFkIGZyb20gdGhlIHByZXZpb3VzIGNvbnZlcnNhdGlvbiBkb2Vzbid0IGxlYWsgaW50byB0aGUgbmV3IG9uZS5cbiAgICBpZiAobWVzc2FnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBtZW1vcnlSZWFkU2Vlbi5jdXJyZW50ID0gZmFsc2VcbiAgICAgIHNlZW5Bc3Npc3RhbnRVdWlkcy5jdXJyZW50LmNsZWFyKClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChzdGF0ZSAhPT0gJ2Nsb3NlZCcgfHwgaXNMb2FkaW5nIHx8IGhhc0FjdGl2ZVByb21wdCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gM1AgZGVmYXVsdDogc3VydmV5IG9mZiAobm8gR3Jvd3RoQm9vayBvbiBCZWRyb2NrL1ZlcnRleC9Gb3VuZHJ5KS5cbiAgICBpZiAoIWdldEZlYXR1cmVWYWx1ZV9DQUNIRURfTUFZX0JFX1NUQUxFKE1FTU9SWV9TVVJWRVlfR0FURSwgZmFsc2UpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoIWlzQXV0b01lbW9yeUVuYWJsZWQoKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGlzRmVlZGJhY2tTdXJ2ZXlEaXNhYmxlZCgpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoIWlzUG9saWN5QWxsb3dlZCgnYWxsb3dfcHJvZHVjdF9mZWVkYmFjaycpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoaXNFbnZUcnV0aHkocHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfRElTQUJMRV9GRUVEQkFDS19TVVJWRVkpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoIWxhc3RBc3Npc3RhbnQgfHwgc2VlbkFzc2lzdGFudFV1aWRzLmN1cnJlbnQuaGFzKGxhc3RBc3Npc3RhbnQudXVpZCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSBleHRyYWN0VGV4dENvbnRlbnQobGFzdEFzc2lzdGFudC5tZXNzYWdlLmNvbnRlbnQsICcgJylcbiAgICBpZiAoIU1FTU9SWV9XT1JEX1JFLnRlc3QodGV4dCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIE1hcmsgYXMgZXZhbHVhdGVkIGJlZm9yZSB0aGUgbWVtb3J5LXJlYWQgc2NhbiBzbyBhIHR1cm4gdGhhdCBtZW50aW9uc1xuICAgIC8vIFwibWVtb3J5XCIgYnV0IGhhcyBubyBtZW1vcnkgcmVhZCBkb2Vzbid0IHRyaWdnZXIgcmVwZWF0ZWQgTyhuKSBzY2Fuc1xuICAgIC8vIG9uIHN1YnNlcXVlbnQgcmVuZGVycyB3aXRoIHRoZSBzYW1lIGxhc3QgYXNzaXN0YW50IG1lc3NhZ2UuXG4gICAgc2VlbkFzc2lzdGFudFV1aWRzLmN1cnJlbnQuYWRkKGxhc3RBc3Npc3RhbnQudXVpZClcblxuICAgIGlmICghbWVtb3J5UmVhZFNlZW4uY3VycmVudCkge1xuICAgICAgbWVtb3J5UmVhZFNlZW4uY3VycmVudCA9IGhhc01lbW9yeUZpbGVSZWFkKG1lc3NhZ2VzKVxuICAgIH1cbiAgICBpZiAoIW1lbW9yeVJlYWRTZWVuLmN1cnJlbnQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChNYXRoLnJhbmRvbSgpIDwgU1VSVkVZX1BST0JBQklMSVRZKSB7XG4gICAgICBvcGVuKClcbiAgICB9XG4gIH0sIFtcbiAgICBlbmFibGVkLFxuICAgIHN0YXRlLFxuICAgIGlzTG9hZGluZyxcbiAgICBoYXNBY3RpdmVQcm9tcHQsXG4gICAgbGFzdEFzc2lzdGFudCxcbiAgICBtZXNzYWdlcyxcbiAgICBvcGVuLFxuICBdKVxuXG4gIHJldHVybiB7IHN0YXRlLCBsYXN0UmVzcG9uc2UsIGhhbmRsZVNlbGVjdCwgaGFuZGxlVHJhbnNjcmlwdFNlbGVjdCB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLFdBQVcsRUFBRUMsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLE1BQU0sUUFBUSxPQUFPO0FBQy9ELFNBQVNDLHdCQUF3QixRQUFRLGtDQUFrQztBQUMzRSxTQUFTQyxtQ0FBbUMsUUFBUSxzQ0FBc0M7QUFDMUYsU0FDRSxLQUFLQywwREFBMEQsRUFDL0RDLFFBQVEsUUFDSCxpQ0FBaUM7QUFDeEMsU0FBU0MsbUJBQW1CLFFBQVEsdUJBQXVCO0FBQzNELFNBQVNDLGVBQWUsUUFBUSxzQ0FBc0M7QUFDdEUsU0FBU0MsbUJBQW1CLFFBQVEsb0NBQW9DO0FBQ3hFLGNBQWNDLE9BQU8sUUFBUSx3QkFBd0I7QUFDckQs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O0lBQ0Y7SUFFQSxJQUFJN0IsS0FBSyxLQUFLLFFBQVEsSUFBSUgsU0FBUyxJQUFJQyxlQUFlLEVBQUU7TUFDdEQ7SUFDRjs7SUFFQTtJQUNBLElBQUksQ0FBQ3JDLG1DQUFtQyxDQUFDbUIsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLEVBQUU7TUFDbkU7SUFDRjtJQUVBLElBQUksQ0FBQ2hCLG1CQUFtQixDQUFDLENBQUMsRUFBRTtNQUMxQjtJQUNGO0lBRUEsSUFBSUosd0JBQXdCLENBQUMsQ0FBQyxFQUFFO01BQzlCO0lBQ0Y7SUFFQSxJQUFJLENBQUNLLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFO01BQzlDO0lBQ0Y7SUFFQSxJQUFJSyxXQUFXLENBQUM0RCxPQUFPLENBQUNDLEdBQUcsQ0FBQ0MsbUNBQW1DLENBQUMsRUFBRTtNQUNoRTtJQUNGO0lBRUEsSUFBSSxDQUFDTCxhQUFhLElBQUl0QixrQkFBa0IsQ0FBQ0ksT0FBTyxDQUFDd0IsR0FBRyxDQUFDTixhQUFhLENBQUNPLElBQUksQ0FBQyxFQUFFO01BQ3hFO0lBQ0Y7SUFFQSxNQUFNQyxJQUFJLEdBQUcvRCxrQkFBa0IsQ0FBQ3VELGFBQWEsQ0FBQ3hDLE9BQU8sQ0FBQ0UsT0FBTyxFQUFFLEdBQUcsQ0FBQztJQUNuRSxJQUFJLENBQUNMLGNBQWMsQ0FBQ29ELElBQUksQ0FBQ0QsSUFBSSxDQUFDLEVBQUU7TUFDOUI7SUFDRjs7SUFFQTtJQUNBO0lBQ0E7SUFDQTlCLGtCQUFrQixDQUFDSSxPQUFPLENBQUM0QixHQUFHLENBQUNWLGFBQWEsQ0FBQ08sSUFBSSxDQUFDO0lBRWxELElBQUksQ0FBQzNCLGNBQWMsQ0FBQ0UsT0FBTyxFQUFFO01BQzNCRixjQUFjLENBQUNFLE9BQU8sR0FBR3hCLGlCQUFpQixDQUFDQyxRQUFRLENBQUM7SUFDdEQ7SUFDQSxJQUFJLENBQUNxQixjQUFjLENBQUNFLE9BQU8sRUFBRTtNQUMzQjtJQUNGO0lBRUEsSUFBSTZCLElBQUksQ0FBQ0MsTUFBTSxDQUFDLENBQUMsR0FBR3pELGtCQUFrQixFQUFFO01BQ3RDMkMsSUFBSSxDQUFDLENBQUM7SUFDUjtFQUNGLENBQUMsRUFBRSxDQUNEMUIsT0FBTyxFQUNQQyxLQUFLLEVBQ0xILFNBQVMsRUFDVEMsZUFBZSxFQUNmNkIsYUFBYSxFQUNiekMsUUFBUSxFQUNSdUMsSUFBSSxDQUNMLENBQUM7RUFFRixPQUFPO0lBQUV6QixLQUFLO0lBQUVDLFlBQVk7SUFBRUMsWUFBWTtJQUFFRTtFQUF1QixDQUFDO0FBQ3RFIiwiaWdub3JlTGlzdCI6W119