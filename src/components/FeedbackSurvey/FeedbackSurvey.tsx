// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 FeedbackSurveyView、isValidResponseInput，将 ./FeedbackSurveyView.js 中已经封装好的能力接到本文件流程里。
import { FeedbackSurveyView, isValidResponseInput } from './FeedbackSurveyView.js';
// 类型依赖 { TranscriptShareResponse } 来自 ./TranscriptSharePrompt.js，用于校准终端渲染的数据契约。
import type { TranscriptShareResponse } from './TranscriptSharePrompt.js';
// 引入 TranscriptSharePrompt，将 ./TranscriptSharePrompt.js 中已经封装好的能力接到本文件流程里。
import { TranscriptSharePrompt } from './TranscriptSharePrompt.js';
// 引入 useDebouncedDigitInput，将 ./useDebouncedDigitInput.js 中已经封装好的能力接到本文件流程里。
import { useDebouncedDigitInput } from './useDebouncedDigitInput.js';
// 类型依赖 { FeedbackSurveyResponse } 来自 ./utils.js，用于校准终端渲染的数据契约。
import type { FeedbackSurveyResponse } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  state: 'closed' | 'open' | 'thanks' | 'transcript_prompt' | 'submitting' | 'submitted';
  lastResponse: FeedbackSurveyResponse | null;
  // 这个回调绑定到 handleSelect: (selected: FeedbackSurveyResponse) => void;，负责终端渲染在该局部场景下的响应。
  handleSelect: (selected: FeedbackSurveyResponse) => void;
  handleTranscriptSelect?: (selected: TranscriptShareResponse) => void;
  inputValue: string;
  // 这个回调绑定到 setInputValue: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  setInputValue: (value: string) => void;
  onRequestFeedback?: () => void;
  message?: string;
};
// FeedbackSurvey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FeedbackSurvey(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    state,
    lastResponse,
    handleSelect,
    handleTranscriptSelect,
    inputValue,
    setInputValue,
    onRequestFeedback,
    message
  } = t0;
  // 当 `state` 匹配 `"closed"` 时，终端渲染执行对应分支。
  if (state === "closed") {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 当 `state` 匹配 `"thanks"` 时，终端渲染执行对应分支。
  if (state === "thanks") {
    // t1 暂存 `<FeedbackSurveyThanks lastResponse={lastResponse} inputVa...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== inputValue || $[1] !== lastResponse || $[2] !== onRequestFeedback || $[3] !== setInputValue) {
      // t1 暂存 `<FeedbackSurveyThanks lastResponse={lastResponse} inputVa...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <FeedbackSurveyThanks lastResponse={lastResponse} inputValue={inputValue} setInputValue={setInputValue} onRequestFeedback={onRequestFeedback} />;
      // $[0] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = inputValue;
      // $[1] 缓存 `lastResponse`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = lastResponse;
      // $[2] 缓存 `onRequestFeedback`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = onRequestFeedback;
      // $[3] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = setInputValue;
      // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[4];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 当 `state` 匹配 `"submitted"` 时，终端渲染执行对应分支。
  if (state === "submitted") {
    // t1 暂存 `<Box marginTop={1}><Text color="success">{"\u2713"} Thank...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Box marginTop={1}><Text color="success">{"\u2713"} Thank...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Box marginTop={1}><Text color="success">{"\u2713"} Thanks for sharing your transcript!</Text></Box>;
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[5];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 当 `state` 匹配 `"submitting"` 时，终端渲染执行对应分支。
  if (state === "submitting") {
    // t1 暂存 `<Box marginTop={1}><Text dimColor={true}>Sharing transcri...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Box marginTop={1}><Text dimColor={true}>Sharing transcri...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Box marginTop={1}><Text dimColor={true}>Sharing transcript{"\u2026"}</Text></Box>;
      // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[6];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 当 `state` 匹配 `"transcript_prompt"` 时，终端渲染执行对应分支。
  if (state === "transcript_prompt") {
    // handleTranscriptSelect缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!handleTranscriptSelect) {
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null;
    }
    // 只有 `inputValue && !["1", "2", "3"].includes(inputValue)` 满足时，终端渲染才执行该分支。
    if (inputValue && !["1", "2", "3"].includes(inputValue)) {
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null;
    }
    // t1 暂存 `<TranscriptSharePrompt onSelect={handleTranscriptSelect} ...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== handleTranscriptSelect || $[8] !== inputValue || $[9] !== setInputValue) {
      // t1 暂存 `<TranscriptSharePrompt onSelect={handleTranscriptSelect} ...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <TranscriptSharePrompt onSelect={handleTranscriptSelect} inputValue={inputValue} setInputValue={setInputValue} />;
      // $[7] 缓存 `handleTranscriptSelect`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = handleTranscriptSelect;
      // $[8] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = inputValue;
      // $[9] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = setInputValue;
      // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[10];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `inputValue && !isValidResponseInput(inputValue)` 满足时，终端渲染才执行该分支。
  if (inputValue && !isValidResponseInput(inputValue)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `<FeedbackSurveyView onSelect={handleSelect} inputValue={i...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== handleSelect || $[12] !== inputValue || $[13] !== message || $[14] !== setInputValue) {
    // t1 暂存 `<FeedbackSurveyView onSelect={handleSelect} inputValue={i...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <FeedbackSurveyView onSelect={handleSelect} inputValue={inputValue} setInputValue={setInputValue} message={message} />;
    // $[11] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = handleSelect;
    // $[12] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = inputValue;
    // $[13] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = message;
    // $[14] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = setInputValue;
    // $[15] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[15];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// ThanksProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ThanksProps = {
  lastResponse: FeedbackSurveyResponse | null;
  inputValue: string;
  // 这个回调绑定到 setInputValue: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  setInputValue: (value: string) => void;
  onRequestFeedback?: () => void;
};
// isFollowUpDigit封装成回调，供终端 UI Feedback Survey在事件触发或异步步骤中调用。
const isFollowUpDigit = (char: string): char is '1' => char === '1';
// FeedbackSurveyThanks 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function FeedbackSurveyThanks(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(12);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    lastResponse,
    inputValue,
    setInputValue,
    onRequestFeedback
  } = t0;
  // showFollowUp标记终端 UI Feedback Survey是否启用对应路径。
  const showFollowUp = onRequestFeedback && lastResponse === "good";
  // 临时值 t1保存`Boolean`，供终端渲染后续处理使用。
  const t1 = Boolean(showFollowUp);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== lastResponse || $[1] !== onRequestFeedback) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_feedback_survey_event", {
        event_type: "followup_accepted" as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        response: lastResponse as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      // 调用 onRequestFeedback?.();，完成这一处局部操作。
      onRequestFeedback?.();
    };
    // $[0] 缓存 `lastResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = lastResponse;
    // $[1] 缓存 `onRequestFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onRequestFeedback;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== inputValue || $[4] !== setInputValue || $[5] !== t1 || $[6] !== t2) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      inputValue,
      setInputValue,
      isValidDigit: isFollowUpDigit,
      enabled: t1,
      once: true,
      onDigit: t2
    };
    // $[3] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = inputValue;
    // $[4] 缓存 `setInputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = setInputValue;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // 调用 useDebouncedDigitInput，触发终端渲染此处需要的副作用。
  useDebouncedDigitInput(t3);
  // feedbackCommand 命令数据保存`false ? "/issue" : "/feedback"`，供后续判断或组装使用。
  const feedbackCommand = false ? "/issue" : "/feedback";
  // t4 暂存 `<Text color="success">Thanks for the feedback!</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text color="success">Thanks for the feedback!</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text color="success">Thanks for the feedback!</Text>;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // t5 暂存 `<Box marginTop={1} flexDirection="column">{t4}{showFollow...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== lastResponse || $[10] !== showFollowUp) {
    // t5 暂存 `<Box marginTop={1} flexDirection="column">{t4}{showFollow...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box marginTop={1} flexDirection="column">{t4}{showFollowUp ? <Text dimColor={true}>(Optional) Press [<Text color="ansi:cyan">1</Text>] to tell us what went well {" \xB7 "}{feedbackCommand}</Text> : lastResponse === "bad" ? <Text dimColor={true}>Use /issue to report model behavior issues.</Text> : <Text dimColor={true}>Use {feedbackCommand} to share detailed feedback anytime.</Text>}</Box>;
    // $[9] 缓存 `lastResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = lastResponse;
    // $[10] 缓存 `showFollowUp`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = showFollowUp;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMiLCJsb2dFdmVudCIsIkJveCIsIlRleHQiLCJGZWVkYmFja1N1cnZleVZpZXciLCJpc1ZhbGlkUmVzcG9uc2VJbnB1dCIsIlRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlIiwiVHJhbnNjcmlwdFNoYXJlUHJvbXB0IiwidXNlRGVib3VuY2VkRGlnaXRJbnB1dCIsIkZlZWRiYWNrU3VydmV5UmVzcG9uc2UiLCJQcm9wcyIsInN0YXRlIiwibGFzdFJlc3BvbnNlIiwiaGFuZGxlU2VsZWN0Iiwic2VsZWN0ZWQiLCJoYW5kbGVUcmFuc2NyaXB0U2VsZWN0IiwiaW5wdXRWYWx1ZSIsInNldElucHV0VmFsdWUiLCJ2YWx1ZSIsIm9uUmVxdWVzdEZlZWRiYWNrIiwibWVzc2FnZSIsIkZlZWRiYWNrU3VydmV5IiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsImluY2x1ZGVzIiwiVGhhbmtzUHJvcHMiLCJpc0ZvbGxvd1VwRGlnaXQiLCJjaGFyIiwiRmVlZGJhY2tTdXJ2ZXlUaGFua3MiLCJzaG93Rm9sbG93VXAiLCJCb29sZWFuIiwidDIiLCJldmVudF90eXBlIiwicmVzcG9uc2UiLCJ0MyIsImlzVmFsaWREaWdpdCIsImVuYWJsZWQiLCJvbmNlIiwib25EaWdpdCIsImZlZWRiYWNrQ29tbWFuZCIsInQ0IiwidDUiXSwic291cmNlcyI6WyJGZWVkYmFja1N1cnZleS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7XG4gIEZlZWRiYWNrU3VydmV5VmlldyxcbiAgaXNWYWxpZFJlc3BvbnNlSW5wdXQsXG59IGZyb20gJy4vRmVlZGJhY2tTdXJ2ZXlWaWV3LmpzJ1xuaW1wb3J0IHR5cGUgeyBUcmFuc2NyaXB0U2hhcmVSZXNwb25zZSB9IGZyb20gJy4vVHJhbnNjcmlwdFNoYXJlUHJvbXB0LmpzJ1xuaW1wb3J0IHsgVHJhbnNjcmlwdFNoYXJlUHJvbXB0IH0gZnJvbSAnLi9UcmFuc2NyaXB0U2hhcmVQcm9tcHQuanMnXG5pbXBvcnQgeyB1c2VEZWJvdW5jZWREaWdpdElucHV0IH0gZnJvbSAnLi91c2VEZWJvdW5jZWREaWdpdElucHV0LmpzJ1xuaW1wb3J0IHR5cGUgeyBGZWVkYmFja1N1cnZleVJlc3BvbnNlIH0gZnJvbSAnLi91dGlscy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgc3RhdGU6XG4gICAgfCAnY2xvc2VkJ1xuICAgIHwgJ29wZW4nXG4gICAgfCAndGhhbmtzJ1xuICAgIHwgJ3RyYW5zY3JpcHRfcHJvbXB0J1xuICAgIHwgJ3N1Ym1pdHRpbmcnXG4gICAgfCAnc3VibWl0dGVkJ1xuICBsYXN0UmVzcG9uc2U6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UgfCBudWxsXG4gIGhhbmRsZVNlbGVjdDogKHNlbGVjdGVkOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlKSA9PiB2b2lkXG4gIGhhbmRsZVRyYW5zY3JpcHRTZWxlY3Q/OiAoc2VsZWN0ZWQ6IFRyYW5zY3JpcHRTaGFyZVJlc3BvbnNlKSA9PiB2b2lkXG4gIGlucHV0VmFsdWU6IHN0cmluZ1xuICBzZXRJbnB1dFZhbHVlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICBvblJlcXVlc3RGZWVkYmFjaz86ICgpID0+IHZvaWRcbiAgbWVzc2FnZT86IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRmVlZGJhY2tTdXJ2ZXkoe1xuICBzdGF0ZSxcbiAgbGFzdFJlc3BvbnNlLFxuICBoYW5kbGVTZWxlY3QsXG4gIGhhbmRsZVRyYW5zY3JpcHRTZWxlY3QsXG4gIGlucHV0VmFsdWUsXG4gIHNldElucHV0VmFsdWUsXG4gIG9uUmVxdWVzdEZlZWRiYWNrLFxuICBtZXNzYWdlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoc3RhdGUgPT09ICdjbG9zZWQnKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmIChzdGF0ZSA9PT0gJ3RoYW5rcycpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEZlZWRiYWNrU3VydmV5VGhhbmtzXG4gICAgICAgIGxhc3RSZXNwb25zZT17bGFzdFJlc3BvbnNlfVxuICAgICAgICBpbnB1dFZhbHVlPXtpbnB1dFZhbHVlfVxuICAgICAgICBzZXRJbnB1dFZhbHVlPXtzZXRJbnB1dFZhbHVlfVxuICAgICAgICBvblJlcXVlc3RGZWVkYmFjaz17b25SZXF1ZXN0RmVlZGJhY2t9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIGlmIChzdGF0ZSA9PT0gJ3N1Ym1pdHRlZCcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIj5cbiAgICAgICAgICB7J1xcdTI3MTMnfSBUaGFua3MgZm9yIHNoYXJpbmcgeW91ciB0cmFuc2NyaXB0IVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBpZiAoc3RhdGUgPT09ICdzdWJtaXR0aW5nJykge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlNoYXJpbmcgdHJhbnNjcmlwdHsnXFx1MjAyNid9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXRlID09PSAndHJhbnNjcmlwdF9wcm9tcHQnKSB7XG4gICAgaWYgKCFoYW5kbGVUcmFuc2NyaXB0U2VsZWN0KSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICAvLyBIaWRlIHByb21wdCBpZiB1c2VyIGlzIHR5cGluZyBub24tcmVzcG9uc2UgY2hhcmFjdGVyc1xuICAgIGlmIChpbnB1dFZhbHVlICYmICFbJzEnLCAnMicsICczJ10uaW5jbHVkZXMoaW5wdXRWYWx1ZSkpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8VHJhbnNjcmlwdFNoYXJlUHJvbXB0XG4gICAgICAgIG9uU2VsZWN0PXtoYW5kbGVUcmFuc2NyaXB0U2VsZWN0fVxuICAgICAgICBpbnB1dFZhbHVlPXtpbnB1dFZhbHVlfVxuICAgICAgICBzZXRJbnB1dFZhbHVlPXtzZXRJbnB1dFZhbHVlfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICAvLyBzdGF0ZSA9PT0gJ29wZW4nXG4gIC8vIEhpZGUgdGhlIHN1cnZleSBpZiB0aGUgdXNlciBpcyB0eXBpbmcgYW55dGhpbmcgb3RoZXIgdGhhbiBhIHN1cnZleSByZXNwb25zZS5cbiAgLy8gVGhpcyBwcmV2ZW50cyB0aGUgc3VydmV5IGZyb20gc2hvd2luZyB1cCB3aGVuIHRoZSB1c2VyIGlzIHR5cGluZyBhIG1lc3NhZ2UsXG4gIC8vIHdoaWNoIGNhbiByZXN1bHQgaW4gYWNjaWRlbnRhbCBzdXJ2ZXkgc3VibWlzc2lvbnMgKGUuZy4gXCJzM2NtZFwiKS5cbiAgaWYgKGlucHV0VmFsdWUgJiYgIWlzVmFsaWRSZXNwb25zZUlucHV0KGlucHV0VmFsdWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEZlZWRiYWNrU3VydmV5Vmlld1xuICAgICAgb25TZWxlY3Q9e2hhbmRsZVNlbGVjdH1cbiAgICAgIGlucHV0VmFsdWU9e2lucHV0VmFsdWV9XG4gICAgICBzZXRJbnB1dFZhbHVlPXtzZXRJbnB1dFZhbHVlfVxuICAgICAgbWVzc2FnZT17bWVzc2FnZX1cbiAgICAvPlxuICApXG59XG5cbnR5cGUgVGhhbmtzUHJvcHMgPSB7XG4gIGxhc3RSZXNwb25zZTogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSB8IG51bGxcbiAgaW5wdXRWYWx1ZTogc3RyaW5nXG4gIHNldElucHV0VmFsdWU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gIG9uUmVxdWVzdEZlZWRiYWNrPzogKCkgPT4gdm9pZFxufVxuXG5jb25zdCBpc0ZvbGxvd1VwRGlnaXQgPSAoY2hhcjogc3RyaW5nKTogY2hhciBpcyAnMScgPT4gY2hhciA9PT0gJzEnXG5cbmZ1bmN0aW9uIEZlZWRiYWNrU3VydmV5VGhhbmtzKHtcbiAgbGFzdFJlc3BvbnNlLFxuICBpbnB1dFZhbHVlLFxuICBzZXRJbnB1dFZhbHVlLFxuICBvblJlcXVlc3RGZWVkYmFjayxcbn06IFRoYW5rc1Byb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc2hvd0ZvbGxvd1VwID0gb25SZXF1ZXN0RmVlZGJhY2sgJiYgbGFzdFJlc3BvbnNlID09PSAnZ29vZCdcblxuICAvLyBMaXN0ZW4gZm9yIFwiMVwiIGtleXByZXNzIHRvIGxhdW5jaCAvZmVlZGJhY2tcbiAgdXNlRGVib3VuY2VkRGlnaXRJbnB1dCh7XG4gICAgaW5wdXRWYWx1ZSxcbiAgICBzZXRJbnB1dFZhbHVlLFxuICAgIGlzVmFsaWREaWdpdDogaXNGb2xsb3dVcERpZ2l0LFxuICAgIGVuYWJsZWQ6IEJvb2xlYW4oc2hvd0ZvbGxvd1VwKSxcbiAgICBvbmNlOiB0cnVlLFxuICAgIG9uRGlnaXQ6ICgpID0+IHtcbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9mZWVkYmFja19zdXJ2ZXlfZXZlbnQnLCB7XG4gICAgICAgIGV2ZW50X3R5cGU6XG4gICAgICAgICAgJ2ZvbGxvd3VwX2FjY2VwdGVkJyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICByZXNwb25zZTpcbiAgICAgICAgICBsYXN0UmVzcG9uc2UgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgIH0pXG4gICAgICBvblJlcXVlc3RGZWVkYmFjaz8uKClcbiAgICB9LFxuICB9KVxuXG4gIGNvbnN0IGZlZWRiYWNrQ29tbWFuZCA9XG4gICAgXCJleHRlcm5hbFwiID09PSAnYW50JyA/ICcvaXNzdWUnIDogJy9mZWVkYmFjaydcblxuICByZXR1cm4gKFxuICAgIDxCb3ggbWFyZ2luVG9wPXsxfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIj5UaGFua3MgZm9yIHRoZSBmZWVkYmFjayE8L1RleHQ+XG4gICAgICB7c2hvd0ZvbGxvd1VwID8gKFxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAoT3B0aW9uYWwpIFByZXNzIFs8VGV4dCBjb2xvcj1cImFuc2k6Y3lhblwiPjE8L1RleHQ+XSB0byB0ZWxsIHVzIHdoYXRcbiAgICAgICAgICB3ZW50IHdlbGwgeycgXFx1MDBiNyAnfVxuICAgICAgICAgIHtmZWVkYmFja0NvbW1hbmR9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICkgOiBsYXN0UmVzcG9uc2UgPT09ICdiYWQnID8gKFxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5Vc2UgL2lzc3VlIHRvIHJlcG9ydCBtb2RlbCBiZWhhdmlvciBpc3N1ZXMuPC9UZXh0PlxuICAgICAgKSA6IChcbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgVXNlIHtmZWVkYmFja0NvbW1hbmR9IHRvIHNoYXJlIGRldGFpbGVkIGZlZWRiYWNrIGFueXRpbWUuXG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQ0UsS0FBS0MsMERBQTBELEVBQy9EQyxRQUFRLFFBQ0gsaUNBQWlDO0FBQ3hDLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FDRUMsa0JB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