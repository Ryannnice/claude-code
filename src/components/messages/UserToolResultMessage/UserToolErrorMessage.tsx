// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 BULLET_OPERATOR，将 ../../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BULLET_OPERATOR } from '../../../constants/figures.js';
// 引入 Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../../ink.js';
// 引入 filterToolProgressMessages、Tool、Tools，将 ../../../Tool.js 中已经封装好的能力接到本文件流程里。
import { filterToolProgressMessages, type Tool, type Tools } from '../../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../../types/message.js，用于校准终端渲染的数据契约。
import type { ProgressMessage } from '../../../types/message.js';
// 复用 INTERRUPT_MESSAGE_FOR_TOOL_USE、isClassifierDenial、PLAN_REJECTION_PREFIX、REJECT_MESSAGE_WITH_REASON_PREFIX 工具函数，把通用处理留在 ../../../utils/messages.js 中维护。
import { INTERRUPT_MESSAGE_FOR_TOOL_USE, isClassifierDenial, PLAN_REJECTION_PREFIX, REJECT_MESSAGE_WITH_REASON_PREFIX } from '../../../utils/messages.js';
// 引入 FallbackToolUseErrorMessage，将 ../../FallbackToolUseErrorMessage.js 中已经封装好的能力接到本文件流程里。
import { FallbackToolUseErrorMessage } from '../../FallbackToolUseErrorMessage.js';
// 引入 InterruptedByUser，将 ../../InterruptedByUser.js 中已经封装好的能力接到本文件流程里。
import { InterruptedByUser } from '../../InterruptedByUser.js';
// 引入 MessageResponse，将 ../../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../../MessageResponse.js';
// 引入 RejectedPlanMessage，将 ./RejectedPlanMessage.js 中已经封装好的能力接到本文件流程里。
import { RejectedPlanMessage } from './RejectedPlanMessage.js';
// 引入 RejectedToolUseMessage，将 ./RejectedToolUseMessage.js 中已经封装好的能力接到本文件流程里。
import { RejectedToolUseMessage } from './RejectedToolUseMessage.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  progressMessagesForMessage: ProgressMessage[];
  tool?: Tool; // undefined when resuming an old conversation that uses an old tool
  tools: Tools;
  param: ToolResultBlockParam;
  verbose: boolean;
  isTranscriptMode?: boolean;
};
// UserToolErrorMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserToolErrorMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    progressMessagesForMessage,
    tool,
    tools,
    param,
    verbose,
    isTranscriptMode
  } = t0;
  // 只有 `typeof param.content === "string" && param.content.includes(INTERRUPT_MESSA...` 满足时，终端渲染才执行该分支。
  if (typeof param.content === "string" && param.content.includes(INTERRUPT_MESSAGE_FOR_TOOL_USE)) {
    // t1 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <MessageResponse height={1}><InterruptedByUser /></MessageResponse>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `typeof param.content === "string" && param.content.startsWith(PLAN_REJECTIO...` 满足时，终端渲染才执行该分支。
  if (typeof param.content === "string" && param.content.startsWith(PLAN_REJECTION_PREFIX)) {
    // t1 暂存 `param.content.substring(PLAN_REJECTION_PREFIX.length)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== param.content) {
      // t1 暂存 `param.content.substring(PLAN_REJECTION_PREFIX.length)` 生成的渲染片段，后续返回路径直接复用。
      t1 = param.content.substring(PLAN_REJECTION_PREFIX.length);
      // $[1] 缓存 `param.content`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = param.content;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // planContent 命名 `t1`，让后续代码直接表达这个值的用途。
    const planContent = t1;
    // t2 暂存 `<RejectedPlanMessage plan={planContent} />` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== planContent) {
      // t2 暂存 `<RejectedPlanMessage plan={planContent} />` 生成的渲染片段，后续返回路径直接复用。
      t2 = <RejectedPlanMessage plan={planContent} />;
      // $[3] 缓存 `planContent`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = planContent;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 只有 `typeof param.content === "string" && param.content.startsWith(REJECT_MESSAG...` 满足时，终端渲染才执行该分支。
  if (typeof param.content === "string" && param.content.startsWith(REJECT_MESSAGE_WITH_REASON_PREFIX)) {
    // t1 暂存 `<RejectedToolUseMessage />` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<RejectedToolUseMessage />` 生成的渲染片段，后续返回路径直接复用。
      t1 = <RejectedToolUseMessage />;
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[5];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `feature("TRANSCRIPT_CLASSIFIER") && typeof param.content === "string" && is...` 满足时，终端渲染才执行该分支。
  if (feature("TRANSCRIPT_CLASSIFIER") && typeof param.content === "string" && isClassifierDenial(param.content)) {
    // t1 暂存 `<MessageResponse height={1}><Text dimColor={true}>Denied ...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<MessageResponse height={1}><Text dimColor={true}>Denied ...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <MessageResponse height={1}><Text dimColor={true}>Denied by auto mode classifier {BULLET_OPERATOR} /feedback if incorrect</Text></MessageResponse>;
      // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[6];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `tool?.renderToolUseErrorMessage?.(param.content, {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== isTranscriptMode || $[8] !== param.content || $[9] !== progressMessagesForMessage || $[10] !== tool || $[11] !== tools || $[12] !== verbose) {
    // t1 暂存 `tool?.renderToolUseErrorMessage?.(param.content, {` 生成的渲染片段，后续返回路径直接复用。
    t1 = tool?.renderToolUseErrorMessage?.(param.content, {
      progressMessagesForMessage: filterToolProgressMessages(progressMessagesForMessage),
      tools,
      verbose,
      isTranscriptMode
    }) ?? <FallbackToolUseErrorMessage result={param.content} verbose={verbose} />;
    // $[7] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = isTranscriptMode;
    // $[8] 缓存 `param.content`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = param.content;
    // $[9] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = progressMessagesForMessage;
    // $[10] 缓存 `tool`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = tool;
    // $[11] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = tools;
    // $[12] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = verbose;
    // $[13] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[13];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiVG9vbFJlc3VsdEJsb2NrUGFyYW0iLCJSZWFjdCIsIkJVTExFVF9PUEVSQVRPUiIsIlRleHQiLCJmaWx0ZXJUb29sUHJvZ3Jlc3NNZXNzYWdlcyIsIlRvb2wiLCJUb29scyIsIlByb2dyZXNzTWVzc2FnZSIsIklOVEVSUlVQVF9NRVNTQUdFX0ZPUl9UT09MX1VTRSIsImlzQ2xhc3NpZmllckRlbmlhbCIsIlBMQU5fUkVKRUNUSU9OX1BSRUZJWCIsIlJFSkVDVF9NRVNTQUdFX1dJVEhfUkVBU09OX1BSRUZJWCIsIkZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSIsIkludGVycnVwdGVkQnlVc2VyIiwiTWVzc2FnZVJlc3BvbnNlIiwiUmVqZWN0ZWRQbGFuTWVzc2FnZSIsIlJlamVjdGVkVG9vbFVzZU1lc3NhZ2UiLCJQcm9wcyIsInByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlIiwidG9vbCIsInRvb2xzIiwicGFyYW0iLCJ2ZXJib3NlIiwiaXNUcmFuc2NyaXB0TW9kZSIsIlVzZXJUb29sRXJyb3JNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJjb250ZW50IiwiaW5jbHVkZXMiLCJ0MSIsIlN5bWJvbCIsImZvciIsInN0YXJ0c1dpdGgiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJwbGFuQ29udGVudCIsInQyIiwicmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSJdLCJzb3VyY2VzIjpbIlVzZXJUb29sRXJyb3JNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmZWF0dXJlIH0gZnJvbSAnYnVuOmJ1bmRsZSdcbmltcG9ydCB0eXBlIHsgVG9vbFJlc3VsdEJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvaW5kZXgubWpzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCVUxMRVRfT1BFUkFUT1IgfSBmcm9tICcuLi8uLi8uLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQge1xuICBmaWx0ZXJUb29sUHJvZ3Jlc3NNZXNzYWdlcyxcbiAgdHlwZSBUb29sLFxuICB0eXBlIFRvb2xzLFxufSBmcm9tICcuLi8uLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHR5cGUgeyBQcm9ncmVzc01lc3NhZ2UgfSBmcm9tICcuLi8uLi8uLi90eXBlcy9tZXNzYWdlLmpzJ1xuaW1wb3J0IHtcbiAgSU5URVJSVVBUX01FU1NBR0VfRk9SX1RPT0xfVVNFLFxuICBpc0NsYXNzaWZpZXJEZW5pYWwsXG4gIFBMQU5fUkVKRUNUSU9OX1BSRUZJWCxcbiAgUkVKRUNUX01FU1NBR0VfV0lUSF9SRUFTT05fUFJFRklYLFxufSBmcm9tICcuLi8uLi8uLi91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IEZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSB9IGZyb20gJy4uLy4uL0ZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZS5qcydcbmltcG9ydCB7IEludGVycnVwdGVkQnlVc2VyIH0gZnJvbSAnLi4vLi4vSW50ZXJydXB0ZWRCeVVzZXIuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBSZWplY3RlZFBsYW5NZXNzYWdlIH0gZnJvbSAnLi9SZWplY3RlZFBsYW5NZXNzYWdlLmpzJ1xuaW1wb3J0IHsgUmVqZWN0ZWRUb29sVXNlTWVzc2FnZSB9IGZyb20gJy4vUmVqZWN0ZWRUb29sVXNlTWVzc2FnZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IFByb2dyZXNzTWVzc2FnZVtdXG4gIHRvb2w/OiBUb29sIC8vIHVuZGVmaW5lZCB3aGVuIHJlc3VtaW5nIGFuIG9sZCBjb252ZXJzYXRpb24gdGhhdCB1c2VzIGFuIG9sZCB0b29sXG4gIHRvb2xzOiBUb29sc1xuICBwYXJhbTogVG9vbFJlc3VsdEJsb2NrUGFyYW1cbiAgdmVyYm9zZTogYm9vbGVhblxuICBpc1RyYW5zY3JpcHRNb2RlPzogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gVXNlclRvb2xFcnJvck1lc3NhZ2Uoe1xuICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSxcbiAgdG9vbCxcbiAgdG9vbHMsXG4gIHBhcmFtLFxuICB2ZXJib3NlLFxuICBpc1RyYW5zY3JpcHRNb2RlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoXG4gICAgdHlwZW9mIHBhcmFtLmNvbnRlbnQgPT09ICdzdHJpbmcnICYmXG4gICAgcGFyYW0uY29udGVudC5pbmNsdWRlcyhJTlRFUlJVUFRfTUVTU0FHRV9GT1JfVE9PTF9VU0UpXG4gICkge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgIDxJbnRlcnJ1cHRlZEJ5VXNlciAvPlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgKVxuICB9XG5cbiAgaWYgKFxuICAgIHR5cGVvZiBwYXJhbS5jb250ZW50ID09PSAnc3RyaW5nJyAmJlxuICAgIHBhcmFtLmNvbnRlbnQuc3RhcnRzV2l0aChQTEFOX1JFSkVDVElPTl9QUkVGSVgpXG4gICkge1xuICAgIC8vIEV4dHJhY3QgdGhlIHBsYW4gY29udGVudCBmcm9tIHRoZSBlcnJvciBtZXNzYWdlXG4gICAgY29uc3QgcGxhbkNvbnRlbnQgPSBwYXJhbS5jb250ZW50LnN1YnN0cmluZyhQTEFOX1JFSkVDVElPTl9QUkVGSVgubGVuZ3RoKVxuICAgIHJldHVybiA8UmVqZWN0ZWRQbGFuTWVzc2FnZSBwbGFuPXtwbGFuQ29udGVudH0gLz5cbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgcGFyYW0uY29udGVudCA9PT0gJ3N0cmluZycgJiZcbiAgICBwYXJhbS5jb250ZW50LnN0YXJ0c1dpdGgoUkVKRUNUX01FU1NBR0VfV0lUSF9SRUFTT05fUFJFRklYKVxuICApIHtcbiAgICByZXR1cm4gPFJlamVjdGVkVG9vbFVzZU1lc3NhZ2UgLz5cbiAgfVxuXG4gIGlmIChcbiAgICBmZWF0dXJlKCdUUkFOU0NSSVBUX0NMQVNTSUZJRVInKSAmJlxuICAgIHR5cGVvZiBwYXJhbS5jb250ZW50ID09PSAnc3RyaW5nJyAmJlxuICAgIGlzQ2xhc3NpZmllckRlbmlhbChwYXJhbS5jb250ZW50KVxuICApIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBEZW5pZWQgYnkgYXV0byBtb2RlIGNsYXNzaWZpZXIge0JVTExFVF9PUEVSQVRPUn0gL2ZlZWRiYWNrIGlmXG4gICAgICAgICAgaW5jb3JyZWN0XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgdG9vbD8ucmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZT8uKHBhcmFtLmNvbnRlbnQsIHtcbiAgICAgIHByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBmaWx0ZXJUb29sUHJvZ3Jlc3NNZXNzYWdlcyhcbiAgICAgICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UsXG4gICAgICApLFxuICAgICAgdG9vbHMsXG4gICAgICB2ZXJib3NlLFxuICAgICAgaXNUcmFuc2NyaXB0TW9kZSxcbiAgICB9KSA/PyAoXG4gICAgICA8RmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIHJlc3VsdD17cGFyYW0uY29udGVudH0gdmVyYm9zZT17dmVyYm9zZX0gLz5cbiAgICApXG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLE9BQU8sUUFBUSxZQUFZO0FBQ3BDLGNBQWNDLG9CQUFvQixRQUFRLHVDQUF1QztBQUNqRixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLGVBQWUsUUFBUSwrQkFBK0I7QUFDL0QsU0FBU0MsSUFB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