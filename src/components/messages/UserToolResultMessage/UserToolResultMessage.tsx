// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { Tools } 来自 ../../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../../Tool.js';
// 类型依赖 { NormalizedUserMessage, ProgressMessage } 来自 ../../../types/message.js，用于校准终端渲染的数据契约。
import type { NormalizedUserMessage, ProgressMessage } from '../../../types/message.js';
// 复用 buildMessageLookups、CANCEL_MESSAGE、INTERRUPT_MESSAGE_FOR_TOOL_USE、REJECT_MESSAGE 工具函数，把通用处理留在 ../../../utils/messages.js 中维护。
import { type buildMessageLookups, CANCEL_MESSAGE, INTERRUPT_MESSAGE_FOR_TOOL_USE, REJECT_MESSAGE } from '../../../utils/messages.js';
// 引入 UserToolCanceledMessage，将 ./UserToolCanceledMessage.js 中已经封装好的能力接到本文件流程里。
import { UserToolCanceledMessage } from './UserToolCanceledMessage.js';
// 引入 UserToolErrorMessage，将 ./UserToolErrorMessage.js 中已经封装好的能力接到本文件流程里。
import { UserToolErrorMessage } from './UserToolErrorMessage.js';
// 引入 UserToolRejectMessage，将 ./UserToolRejectMessage.js 中已经封装好的能力接到本文件流程里。
import { UserToolRejectMessage } from './UserToolRejectMessage.js';
// 引入 UserToolSuccessMessage，将 ./UserToolSuccessMessage.js 中已经封装好的能力接到本文件流程里。
import { UserToolSuccessMessage } from './UserToolSuccessMessage.js';
// 引入 useGetToolFromMessages，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { useGetToolFromMessages } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  param: ToolResultBlockParam;
  message: NormalizedUserMessage;
  lookups: ReturnType<typeof buildMessageLookups>;
  progressMessagesForMessage: ProgressMessage[];
  style?: 'condensed';
  tools: Tools;
  verbose: boolean;
  width: number | string;
  isTranscriptMode?: boolean;
};
// UserToolResultMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserToolResultMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(28);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    param,
    message,
    lookups,
    progressMessagesForMessage,
    style,
    tools,
    verbose,
    width,
    isTranscriptMode
  } = t0;
  // toolUse保存`useGetToolFromMessages`，供终端渲染后续处理使用。
  const toolUse = useGetToolFromMessages(param.tool_use_id, tools, lookups);
  // toolUse缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!toolUse) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `typeof param.content === "string" && param.content.startsWith(CANCEL_MESSAG...` 满足时，终端渲染才执行该分支。
  if (typeof param.content === "string" && param.content.startsWith(CANCEL_MESSAGE)) {
    // t1 暂存 `<UserToolCanceledMessage />` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<UserToolCanceledMessage />` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserToolCanceledMessage />;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // 只有 `typeof param.content === "string" && param.content.startsWith(REJECT_MESSAG...` 满足时，终端渲染才执行该分支。
  if (typeof param.content === "string" && param.content.startsWith(REJECT_MESSAGE) || param.content === INTERRUPT_MESSAGE_FOR_TOOL_USE) {
    // 临时值 t1 命名 `toolUse.toolUse.input as {`，让后续代码直接表达这个值的用途。
    const t1 = toolUse.toolUse.input as {
      [key: string]: unknown;
    };
    // t2 暂存 `<UserToolRejectMessage input={t1} progressMessagesForMess...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== isTranscriptMode || $[2] !== lookups || $[3] !== progressMessagesForMessage || $[4] !== style || $[5] !== t1 || $[6] !== toolUse.tool || $[7] !== tools || $[8] !== verbose) {
      // t2 暂存 `<UserToolRejectMessage input={t1} progressMessagesForMess...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <UserToolRejectMessage input={t1} progressMessagesForMessage={progressMessagesForMessage} tool={toolUse.tool} tools={tools} lookups={lookups} style={style} verbose={verbose} isTranscriptMode={isTranscriptMode} />;
      // $[1] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = isTranscriptMode;
      // $[2] 缓存 `lookups`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = lookups;
      // $[3] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = progressMessagesForMessage;
      // $[4] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = style;
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
      // $[6] 缓存 `toolUse.tool`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = toolUse.tool;
      // $[7] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = tools;
      // $[8] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = verbose;
      // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[9];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 满足 `param.is_error` 时，终端渲染执行该分支。
  if (param.is_error) {
    // t1 暂存 `<UserToolErrorMessage progressMessagesForMessage={progres...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== isTranscriptMode || $[11] !== param || $[12] !== progressMessagesForMessage || $[13] !== toolUse.tool || $[14] !== tools || $[15] !== verbose) {
      // t1 暂存 `<UserToolErrorMessage progressMessagesForMessage={progres...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <UserToolErrorMessage progressMessagesForMessage={progressMessagesForMessage} tool={toolUse.tool} tools={tools} param={param} verbose={verbose} isTranscriptMode={isTranscriptMode} />;
      // $[10] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = isTranscriptMode;
      // $[11] 缓存 `param`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = param;
      // $[12] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = progressMessagesForMessage;
      // $[13] 缓存 `toolUse.tool`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = toolUse.tool;
      // $[14] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = tools;
      // $[15] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = verbose;
      // $[16] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[16];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `<UserToolSuccessMessage message={message} lookups={lookup...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== isTranscriptMode || $[18] !== lookups || $[19] !== message || $[20] !== progressMessagesForMessage || $[21] !== style || $[22] !== toolUse.tool || $[23] !== toolUse.toolUse.id || $[24] !== tools || $[25] !== verbose || $[26] !== width) {
    // t1 暂存 `<UserToolSuccessMessage message={message} lookups={lookup...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <UserToolSuccessMessage message={message} lookups={lookups} toolUseID={toolUse.toolUse.id} progressMessagesForMessage={progressMessagesForMessage} style={style} tool={toolUse.tool} tools={tools} verbose={verbose} width={width} isTranscriptMode={isTranscriptMode} />;
    // $[17] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = isTranscriptMode;
    // $[18] 缓存 `lookups`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = lookups;
    // $[19] 缓存 `message`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = message;
    // $[20] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = progressMessagesForMessage;
    // $[21] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = style;
    // $[22] 缓存 `toolUse.tool`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = toolUse.tool;
    // $[23] 缓存 `toolUse.toolUse.id`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = toolUse.toolUse.id;
    // $[24] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = tools;
    // $[25] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = verbose;
    // $[26] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = width;
    // $[27] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[27];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0IiwiVG9vbHMiLCJOb3JtYWxpemVkVXNlck1lc3NhZ2UiLCJQcm9ncmVzc01lc3NhZ2UiLCJidWlsZE1lc3NhZ2VMb29rdXBzIiwiQ0FOQ0VMX01FU1NBR0UiLCJJTlRFUlJVUFRfTUVTU0FHRV9GT1JfVE9PTF9VU0UiLCJSRUpFQ1RfTUVTU0FHRSIsIlVzZXJUb29sQ2FuY2VsZWRNZXNzYWdlIiwiVXNlclRvb2xFcnJvck1lc3NhZ2UiLCJVc2VyVG9vbFJlamVjdE1lc3NhZ2UiLCJVc2VyVG9vbFN1Y2Nlc3NNZXNzYWdlIiwidXNlR2V0VG9vbEZyb21NZXNzYWdlcyIsIlByb3BzIiwicGFyYW0iLCJtZXNzYWdlIiwibG9va3VwcyIsIlJldHVyblR5cGUiLCJwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSIsInN0eWxlIiwidG9vbHMiLCJ2ZXJib3NlIiwid2lkdGgiLCJpc1RyYW5zY3JpcHRNb2RlIiwiVXNlclRvb2xSZXN1bHRNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJ0b29sVXNlIiwidG9vbF91c2VfaWQiLCJjb250ZW50Iiwic3RhcnRzV2l0aCIsInQxIiwiU3ltYm9sIiwiZm9yIiwiaW5wdXQiLCJrZXkiLCJ0MiIsInRvb2wiLCJpc19lcnJvciIsImlkIl0sInNvdXJjZXMiOlsiVXNlclRvb2xSZXN1bHRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRvb2xSZXN1bHRCbG9ja1BhcmFtIH0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL2luZGV4Lm1qcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBUb29scyB9IGZyb20gJy4uLy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7XG4gIE5vcm1hbGl6ZWRVc2VyTWVzc2FnZSxcbiAgUHJvZ3Jlc3NNZXNzYWdlLFxufSBmcm9tICcuLi8uLi8uLi90eXBlcy9tZXNzYWdlLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBidWlsZE1lc3NhZ2VMb29rdXBzLFxuICBDQU5DRUxfTUVTU0FHRSxcbiAgSU5URVJSVVBUX01FU1NBR0VfRk9SX1RPT0xfVVNFLFxuICBSRUpFQ1RfTUVTU0FHRSxcbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBVc2VyVG9vbENhbmNlbGVkTWVzc2FnZSB9IGZyb20gJy4vVXNlclRvb2xDYW5jZWxlZE1lc3NhZ2UuanMnXG5pbXBvcnQgeyBVc2VyVG9vbEVycm9yTWVzc2FnZSB9IGZyb20gJy4vVXNlclRvb2xFcnJvck1lc3NhZ2UuanMnXG5pbXBvcnQgeyBVc2VyVG9vbFJlamVjdE1lc3NhZ2UgfSBmcm9tICcuL1VzZXJUb29sUmVqZWN0TWVzc2FnZS5qcydcbmltcG9ydCB7IFVzZXJUb29sU3VjY2Vzc01lc3NhZ2UgfSBmcm9tICcuL1VzZXJUb29sU3VjY2Vzc01lc3NhZ2UuanMnXG5pbXBvcnQgeyB1c2VHZXRUb29sRnJvbU1lc3NhZ2VzIH0gZnJvbSAnLi91dGlscy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgcGFyYW06IFRvb2xSZXN1bHRCbG9ja1BhcmFtXG4gIG1lc3NhZ2U6IE5vcm1hbGl6ZWRVc2VyTWVzc2FnZVxuICBsb29rdXBzOiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZE1lc3NhZ2VMb29rdXBzPlxuICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZTogUHJvZ3Jlc3NNZXNzYWdlW11cbiAgc3R5bGU/OiAnY29uZGVuc2VkJ1xuICB0b29sczogVG9vbHNcbiAgdmVyYm9zZTogYm9vbGVhblxuICB3aWR0aDogbnVtYmVyIHwgc3RyaW5nXG4gIGlzVHJhbnNjcmlwdE1vZGU/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBVc2VyVG9vbFJlc3VsdE1lc3NhZ2Uoe1xuICBwYXJhbSxcbiAgbWVzc2FnZSxcbiAgbG9va3VwcyxcbiAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UsXG4gIHN0eWxlLFxuICB0b29scyxcbiAgdmVyYm9zZSxcbiAgd2lkdGgsXG4gIGlzVHJhbnNjcmlwdE1vZGUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHRvb2xVc2UgPSB1c2VHZXRUb29sRnJvbU1lc3NhZ2VzKHBhcmFtLnRvb2xfdXNlX2lkLCB0b29scywgbG9va3VwcylcbiAgaWYgKCF0b29sVXNlKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgcGFyYW0uY29udGVudCA9PT0gJ3N0cmluZycgJiZcbiAgICBwYXJhbS5jb250ZW50LnN0YXJ0c1dpdGgoQ0FOQ0VMX01FU1NBR0UpXG4gICkge1xuICAgIHJldHVybiA8VXNlclRvb2xDYW5jZWxlZE1lc3NhZ2UgLz5cbiAgfVxuXG4gIGlmIChcbiAgICAodHlwZW9mIHBhcmFtLmNvbnRlbnQgPT09ICdzdHJpbmcnICYmXG4gICAgICBwYXJhbS5jb250ZW50LnN0YXJ0c1dpdGgoUkVKRUNUX01FU1NBR0UpKSB8fFxuICAgIHBhcmFtLmNvbnRlbnQgPT09IElOVEVSUlVQVF9NRVNTQUdFX0ZPUl9UT09MX1VTRVxuICApIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFVzZXJUb29sUmVqZWN0TWVzc2FnZVxuICAgICAgICBpbnB1dD17dG9vbFVzZS50b29sVXNlLmlucHV0IGFzIHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9fVxuICAgICAgICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZT17cHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2V9XG4gICAgICAgIHRvb2w9e3Rvb2xVc2UudG9vbH1cbiAgICAgICAgdG9vbHM9e3Rvb2xzfVxuICAgICAgICBsb29rdXBzPXtsb29rdXBzfVxuICAgICAgICBzdHlsZT17c3R5bGV9XG4gICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAgIGlzVHJhbnNjcmlwdE1vZGU9e2lzVHJhbnNjcmlwdE1vZGV9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIGlmIChwYXJhbS5pc19lcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8VXNlclRvb2xFcnJvck1lc3NhZ2VcbiAgICAgICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U9e3Byb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlfVxuICAgICAgICB0b29sPXt0b29sVXNlLnRvb2x9XG4gICAgICAgIHRvb2xzPXt0b29sc31cbiAgICAgICAgcGFyYW09e3BhcmFtfVxuICAgICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgICAgICBpc1RyYW5zY3JpcHRNb2RlPXtpc1RyYW5zY3JpcHRNb2RlfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxVc2VyVG9vbFN1Y2Nlc3NNZXNzYWdlXG4gICAgICBtZXNzYWdlPXttZXNzYWdlfVxuICAgICAgbG9va3Vwcz17bG9va3Vwc31cbiAgICAgIHRvb2xVc2VJRD17dG9vbFVzZS50b29sVXNlLmlkfVxuICAgICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U9e3Byb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlfVxuICAgICAgc3R5bGU9e3N0eWxlfVxuICAgICAgdG9vbD17dG9vbFVzZS50b29sfVxuICAgICAgdG9vbHM9e3Rvb2xzfVxuICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgIGlzVHJhbnNjcmlwdE1vZGU9e2lzVHJhbnNjcmlwdE1vZGV9XG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0Esb0JBQW9CLFFBQVEsdUNBQXVDO0FBQ2pGLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsY0FBY0MsS0FBSyxRQUFRLGtCQUFrQjtBQUM3QyxjQUNFQyxxQkFBcUIsRUFDckJDLGVBQWUsUUFDViwyQkFBMkI7QUFDbEMsU0FDRSxLQUFLQyxtQkFBbUIsRUFDeEJDLGNBQWMsRUFDZEMsOEJBQThCLEVBQzlCQyxjQUFjLFFBQ1QsNEJBQTRCO0FBQ25DLFNBQVNDLHVCQUF1QixRQUFRLDhCQUE4QjtBQUN0RSxTQUFTQyxvQkFBb0IsUUFBUSwyQkFBMkI7QUFDaEUsU0FBU0MscUJBQXFCLFFBQVEsNEJBQTRCO0FBQ2xFLFNBQVNDLHNCQUFzQixRQUFRLDZCQUE2QjtBQUNwRSxTQUFTQyxzQkFBc0IsUUFBUSxZQUFZO0FBRW5ELEtBQUtDLEtBQUssR0FBRztFQUNYQyxLQUFLLEVBQUVmLG9CQUFvQjtFQUMzQmdCLE9BQU8sRUFBRWIscUJBQXFCO0VBQzlCYyxPQUFPLEVBQUVDLFVBQVUsQ0FBQyxPQUFPYixtQkFBbUIsQ0FBQztFQUMvQ2MsMEJBQTBCLEVBQUVmLGVBQWUsRUFBRTtFQUM3Q2dCLEtBQUssQ0FBQyxFQUFFLFdBQVc7RUFDbkJDLEtBQUssRUFBRW5CLEtBQUs7RUFDWm9CLE9BQU8sRUFBRSxPQUFPO0VBQ2hCQyxLQUFLLEVBQUUsTUFBTSxHQUFHLE1BQU07RUFDdEJDLGdCQUFnQixDQUFDLEVBQUUsT0FBTztBQUM1QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxzQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUErQjtJQUFBYixLQUFBO0lBQUFDLE9BQUE7SUFBQUMsT0FBQTtJQUFBRSwwQkFBQTtJQUFBQyxLQUFBO0lBQUFDLEtBQUE7SUFBQUMsT0FBQTtJQUFBQyxLQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFVOUI7RUFDTixNQUFBRyxPQUFBLEdBQWdCaEIsc0JBQXNCLENBQUNFLEtBQUssQ0FBQWUsV0FBWSxFQUFFVCxLQUFLLEVBQUVKLE9BQU8sQ0FBQztFQUN6RSxJQUFJLENBQUNZLE9BQU87SUFBQSxPQUNILElBQUk7RUFBQTtFQUdiLElBQ0UsT0FBT2QsS0FBSyxDQUFBZ0IsT0FBUSxLQUFLLFFBQ2UsSUFBeENoQixLQUFLLENBQUFnQixPQUFRLENBQUFDLFVBQVcsQ0FBQzFCLGNBQWMsQ0FBQztJQUFBLElBQUEyQixFQUFBO0lBQUEsSUFBQU4sQ0FBQSxRQUFBTyxNQUFBLENBQUFDLEdBQUE7TUFFakNGLEVBQUEsSUFBQyx1QkFBdUIsR0FBRztNQUFBTixDQUFBLE1BQUFNLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFOLENBQUE7SUFBQTtJQUFBLE9BQTNCTSxFQUEyQjtFQUFBO0VBR3BDLElBQ0csT0FBT2xCLEtBQUssQ0FBQWdCLE9BQVEsS0FBSyxRQUNnQixJQUF4Q2hCLEtBQUssQ0FBQWdCLE9BQVEsQ0FBQUMsVUFBVyxDQUFDeEIsY0FBYyxDQUNPLElBQWhETyxLQUFLLENBQUFnQixPQUFRLEtBQUt4Qiw4QkFBOEI7SUFJckMsTUFBQTBCLEVBQUEsR0FBQUosT0FBTyxDQUFBQSxPQUFRLENBQUFPLEtBQU0sSUFBSTtNQUFFLENBQUNDLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPO0lBQUMsQ0FBQztJQUFBLElBQUFDLEVBQUE7SUFBQSxJQUFBWCxDQUFBLFFBQUFILGdCQUFBLElBQUFHLENBQUEsUUFBQVYsT0FBQSxJQUFBVSxDQUFBLFFBQUFSLDBCQUFBLElBQUFRLENBQUEsUUFBQVAsS0FBQSxJQUFBTyxDQUFBLFFBQUFNLEVBQUEsSUFBQU4sQ0FBQSxRQUFBRSxPQUFBLENBQUFVLElBQUEsSUFBQVosQ0FBQSxRQUFBTixLQUFBLElBQUFNLENBQUEsUUFBQUwsT0FBQTtNQUQ1RGdCLEVBQUEsSUFBQyxxQkFBcUIsQ0FDYixLQUFtRCxDQUFuRCxDQUFBTCxFQUFrRCxDQUFDLENBQzlCZCwwQkFBMEIsQ0FBMUJBLDJCQUF5QixDQUFDLENBQ2hELElBQVksQ0FBWixDQUFBVSxPQUFPLENBQUFVLElBQUksQ0FBQyxDQUNYbEIsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDSEosT0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FDVEcsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDSEUsT0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FDRUUsZ0JBQWdCLENBQWhCQSxpQkFBZSxDQUFDLEdBQ2xDO01BQUFHLENBQUEsTUFBQUgsZ0JBQUE7TUFBQUcsQ0FBQSxNQUFBVixPQUFBO01BQUFVLENBQUEsTUFBQVIsMEJBQUE7TUFBQVEsQ0FBQSxNQUFBUCxLQUFBO01BQUFPLENBQUEsTUFBQU0sRUFBQTtNQUFBTixDQUFBLE1BQUFFLE9BQUEsQ0FBQVUsSUFBQTtNQUFBWixDQUFBLE1BQUFOLEtBQUE7TUFBQU0sQ0FBQSxNQUFBTCxPQUFBO01BQUFLLENBQUEsTUFBQVcsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQVgsQ0FBQTtJQUFBO0lBQUEsT0FURlcsRUFTRTtFQUFBO0VBSU4sSUFBSXZCLEtBQUssQ0FBQXlCLFFBQVM7SUFBQSxJQUFBUCxFQUFBO0lBQUEsSUFBQU4sQ0FBQSxTQUFBSCxnQkFBQSxJQUFBRyxDQUFBLFNBQUFaLEtBQUEsSUFBQVksQ0FBQSxTQUFBUiwwQkFBQSxJQUFBUSxDQUFBLFNBQUFFLE9BQUEsQ0FBQVUsSUFBQSxJQUFBWixDQUFBLFNBQUFOLEtBQUEsSUFBQU0sQ0FBQSxTQUFBTCxPQUFBO01BRWRXLEVBQUEsSUFBQyxvQkFBb0IsQ0FDU2QsMEJBQTBCLENBQTFCQSwyQkFBeUIsQ0FBQyxDQUNoRCxJQUFZLENBQVosQ0FBQVUsT0FBTyxDQUFBVSxJQUFJLENBQUMsQ0FDWGxCLEtBQUssQ0FBTEEsTUFBSSxDQUFDLENBQ0xOLEtBQUssQ0FBTEEsTUFBSSxDQUFDLENBQ0hPLE9BQU8sQ0FBUEEsUUFBTSxDQUFDLENBQ0VFLGdCQUFnQixDQUFoQkEsaUJBQWUsQ0FBQyxHQUNsQztNQUFBRyxDQUFBLE9BQUFILGdCQUFBO01BQUFHLENBQUEsT0FBQVosS0FBQTtNQUFBWSxDQUFBLE9BQUFSLDBCQUFBO01BQUFRLENBQUEsT0FBQUUsT0FBQSxDQUFBVSxJQUFBO01BQUFaLENBQUEsT0FBQU4sS0FBQTtNQUFBTSxDQUFBLE9BQUFMLE9BQUE7TUFBQUssQ0FBQSxPQUFBTSxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBTixDQUFBO0lBQUE7SUFBQSxPQVBGTSxFQU9FO0VBQUE7RUFFTCxJQUFBQSxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxTQUFBSCxnQkFBQSxJQUFBRyxDQUFBLFNBQUFWLE9BQUEsSUFBQVUsQ0FBQSxTQUFBWCxPQUFBLElBQUFXLENBQUEsU0FBQVIsMEJBQUEsSUFBQVEsQ0FBQSxTQUFBUCxLQUFBLElBQUFPLENBQUEsU0FBQUUsT0FBQSxDQUFBVSxJQUFBLElBQUFaLENBQUEsU0FBQUUsT0FBQSxDQUFBQSxPQUFBLENBQUFZLEVBQUEsSUFBQWQsQ0FBQSxTQUFBTixLQUFBLElBQUFNLENBQUEsU0FBQUwsT0FBQSxJQUFBSyxDQUFBLFNBQUFKLEtBQUE7SUFHQ1UsRUFBQSxJQUFDLHNCQUFzQixDQUNaakIsT0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FDUEMsT0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FDTCxTQUFrQixDQUFsQixDQUFBWSxPQUFPLENBQUFBLE9BQVEsQ0FBQVksRUFBRSxDQUFDLENBQ0R0QiwwQkFBMEIsQ0FBMUJBLDJCQUF5QixDQUFDLENBQy9DQyxLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUNOLElBQVksQ0FBWixDQUFBUyxPQUFPLENBQUFVLElBQUksQ0FBQyxDQUNYbEIsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDSEMsT0FBTyxDQUFQQSxRQUFNLENBQUMsQ0FDVEMsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDTUMsZ0JBQWdCLENBQWhCQSxpQkFBZSxDQUFDLEdBQ2xDO0lBQUFHLENBQUEsT0FBQUgsZ0JBQUE7SUFBQUcsQ0FBQSxPQUFBVixPQUFBO0lBQUFVLENBQUEsT0FBQVgsT0FBQTtJQUFBVyxDQUFBLE9BQUFSLDBCQUFBO0lBQUFRLENBQUEsT0FBQVAsS0FBQTtJQUFBTyxDQUFBLE9BQUFFLE9BQUEsQ0FBQVUsSUFBQTtJQUFBWixDQUFBLE9BQUFFLE9BQUEsQ0FBQUEsT0FBQSxDQUFBWSxFQUFBO0lBQUFkLENBQUEsT0FBQU4sS0FBQTtJQUFBTSxDQUFBLE9BQUFMLE9BQUE7SUFBQUssQ0FBQSxPQUFBSixLQUFBO0lBQUFJLENBQUEsT0FBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQUEsT0FYRk0sRUFXRTtBQUFBIiwiaWdub3JlTGlzdCI6W119