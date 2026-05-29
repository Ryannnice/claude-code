// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useTerminalSize，将 ../../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
// 引入 useTheme，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { useTheme } from '../../../ink.js';
// 引入 filterToolProgressMessages、Tool、Tools，将 ../../../Tool.js 中已经封装好的能力接到本文件流程里。
import { filterToolProgressMessages, type Tool, type Tools } from '../../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../../types/message.js，用于校准终端渲染的数据契约。
import type { ProgressMessage } from '../../../types/message.js';
// 类型依赖 { buildMessageLookups } 来自 ../../../utils/messages.js，用于校准终端渲染的数据契约。
import type { buildMessageLookups } from '../../../utils/messages.js';
// 引入 FallbackToolUseRejectedMessage，将 ../../FallbackToolUseRejectedMessage.js 中已经封装好的能力接到本文件流程里。
import { FallbackToolUseRejectedMessage } from '../../FallbackToolUseRejectedMessage.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  input: {
    [key: string]: unknown;
  };
  progressMessagesForMessage: ProgressMessage[];
  style?: 'condensed';
  tool?: Tool;
  tools: Tools;
  lookups: ReturnType<typeof buildMessageLookups>;
  verbose: boolean;
  isTranscriptMode?: boolean;
};
// UserToolRejectMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserToolRejectMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    input,
    progressMessagesForMessage,
    style,
    tool,
    tools,
    verbose,
    isTranscriptMode
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 User Tool Reject Message分别处理这些返回值。
  const [theme] = useTheme();
  // 只有 `!tool || !tool.renderToolUseRejectedMessage` 满足时，终端渲染才执行该分支。
  if (!tool || !tool.renderToolUseRejectedMessage) {
    // t1 暂存 `<FallbackToolUseRejectedMessage />` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<FallbackToolUseRejectedMessage />` 生成的渲染片段，后续返回路径直接复用。
      t1 = <FallbackToolUseRejectedMessage />;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1保存`tool.inputSchema`，供终端 UI User Tool Reject Mes...后续判断或输出使用。
  const t1 = tool.inputSchema;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // t3 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== columns || $[2] !== input || $[3] !== isTranscriptMode || $[4] !== progressMessagesForMessage || $[5] !== style || $[6] !== theme || $[7] !== tool || $[8] !== tools || $[9] !== verbose) {
    // t3 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t3 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 User Tool Reject Message在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // parsedInput保存`t1.safeParse`，供终端渲染后续处理使用。
      const parsedInput = t1.safeParse(input);
      // parsedInput.success 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!parsedInput.success) {
        // t4 暂存 `<FallbackToolUseRejectedMessage />` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
          // t4 暂存 `<FallbackToolUseRejectedMessage />` 生成的渲染片段，后续返回路径直接复用。
          t4 = <FallbackToolUseRejectedMessage />;
          // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[12];
        }
        // t3 暂存 `t4` 生成的渲染片段，后续返回路径直接复用。
        t3 = t4;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t2 暂存 `tool.renderToolUseRejectedMessage(parsedInput.data, {` 生成的渲染片段，后续返回路径直接复用。
      t2 = tool.renderToolUseRejectedMessage(parsedInput.data, {
        columns,
        messages: [],
        tools,
        verbose,
        progressMessagesForMessage: filterToolProgressMessages(progressMessagesForMessage),
        style,
        theme,
        isTranscriptMode
      }) ?? <FallbackToolUseRejectedMessage />;
    }
    // $[1] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = columns;
    // $[2] 缓存 `input`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = input;
    // $[3] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = isTranscriptMode;
    // $[4] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = progressMessagesForMessage;
    // $[5] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = style;
    // $[6] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = theme;
    // $[7] 缓存 `tool`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = tool;
    // $[8] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = tools;
    // $[9] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = verbose;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[10];
    // t3 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[11];
  }
  // `t3` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t3 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVRlcm1pbmFsU2l6ZSIsInVzZVRoZW1lIiwiZmlsdGVyVG9vbFByb2dyZXNzTWVzc2FnZXMiLCJUb29sIiwiVG9vbHMiLCJQcm9ncmVzc01lc3NhZ2UiLCJidWlsZE1lc3NhZ2VMb29rdXBzIiwiRmFsbGJhY2tUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIiwiUHJvcHMiLCJpbnB1dCIsImtleSIsInByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlIiwic3R5bGUiLCJ0b29sIiwidG9vbHMiLCJsb29rdXBzIiwiUmV0dXJuVHlwZSIsInZlcmJvc2UiLCJpc1RyYW5zY3JpcHRNb2RlIiwiVXNlclRvb2xSZWplY3RNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJjb2x1bW5zIiwidGhlbWUiLCJyZW5kZXJUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJpbnB1dFNjaGVtYSIsInQyIiwidDMiLCJiYjAiLCJwYXJzZWRJbnB1dCIsInNhZmVQYXJzZSIsInN1Y2Nlc3MiLCJ0NCIsImRhdGEiLCJtZXNzYWdlcyJdLCJzb3VyY2VzIjpbIlVzZXJUb29sUmVqZWN0TWVzc2FnZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyB1c2VUaGVtZSB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7XG4gIGZpbHRlclRvb2xQcm9ncmVzc01lc3NhZ2VzLFxuICB0eXBlIFRvb2wsXG4gIHR5cGUgVG9vbHMsXG59IGZyb20gJy4uLy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IFByb2dyZXNzTWVzc2FnZSB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgdHlwZSB7IGJ1aWxkTWVzc2FnZUxvb2t1cHMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IEZhbGxiYWNrVG9vbFVzZVJlamVjdGVkTWVzc2FnZSB9IGZyb20gJy4uLy4uL0ZhbGxiYWNrVG9vbFVzZVJlamVjdGVkTWVzc2FnZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgaW5wdXQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9XG4gIHByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBQcm9ncmVzc01lc3NhZ2VbXVxuICBzdHlsZT86ICdjb25kZW5zZWQnXG4gIHRvb2w/OiBUb29sXG4gIHRvb2xzOiBUb29sc1xuICBsb29rdXBzOiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZE1lc3NhZ2VMb29rdXBzPlxuICB2ZXJib3NlOiBib29sZWFuXG4gIGlzVHJhbnNjcmlwdE1vZGU/OiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBVc2VyVG9vbFJlamVjdE1lc3NhZ2Uoe1xuICBpbnB1dCxcbiAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UsXG4gIHN0eWxlLFxuICB0b29sLFxuICB0b29scyxcbiAgdmVyYm9zZSxcbiAgaXNUcmFuc2NyaXB0TW9kZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCBbdGhlbWVdID0gdXNlVGhlbWUoKVxuXG4gIGlmICghdG9vbCB8fCAhdG9vbC5yZW5kZXJUb29sVXNlUmVqZWN0ZWRNZXNzYWdlKSB7XG4gICAgcmV0dXJuIDxGYWxsYmFja1Rvb2xVc2VSZWplY3RlZE1lc3NhZ2UgLz5cbiAgfVxuXG4gIGNvbnN0IHBhcnNlZElucHV0ID0gdG9vbC5pbnB1dFNjaGVtYS5zYWZlUGFyc2UoaW5wdXQpXG4gIGlmICghcGFyc2VkSW5wdXQuc3VjY2Vzcykge1xuICAgIHJldHVybiA8RmFsbGJhY2tUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIC8+XG4gIH1cblxuICByZXR1cm4gKFxuICAgIHRvb2wucmVuZGVyVG9vbFVzZVJlamVjdGVkTWVzc2FnZShwYXJzZWRJbnB1dC5kYXRhLCB7XG4gICAgICBjb2x1bW5zLFxuICAgICAgbWVzc2FnZXM6IFtdLFxuICAgICAgdG9vbHMsXG4gICAgICB2ZXJib3NlLFxuICAgICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IGZpbHRlclRvb2xQcm9ncmVzc01lc3NhZ2VzKFxuICAgICAgICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSxcbiAgICAgICksXG4gICAgICBzdHlsZSxcbiAgICAgIHRoZW1lLFxuICAgICAgaXNUcmFuc2NyaXB0TW9kZSxcbiAgICB9KSA/PyA8RmFsbGJhY2tUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsZUFBZSxRQUFRLG1DQUFtQztBQUNuRSxTQUFTQyxRQUFRLFFBQVEsaUJBQWlCO0FBQzFDLFNBQ0VDLDBCQUEwQixFQUMxQixLQUFLQyxJQUFJLEVBQ1QsS0FBS0MsS0FBSyxRQUNMLGtCQUFrQjtBQUN6QixjQUFjQyxlQUFlLFFBQVEsMkJBQTJCO0FBQ2hFLGNBQWNDLG1CQUFtQixRQUFRLDRCQUE0QjtBQUNyRSxTQUFTQyw4QkFBOEIsUUFBUSx5Q0FBeUM7QUFFeEYsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLEtBQUssRUFBRTtJQUFFLENBQUNDLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPO0VBQUMsQ0FBQztFQUNqQ0MsMEJBQTBCLEVBQUVOLGVBQWUsRUFBRTtFQUM3Q08sS0FBSyxDQUFDLEVBQUUsV0FBVztFQUNuQkMsSUFBSSxDQUFDLEVBQUVWLElBQUk7RUFDWFcsS0FBSyxFQUFFVixLQUFLO0VBQ1pXLE9BQU8sRUFBRUMsVUFBVSxDQUFDLE9BQU9WLG1CQUFtQixDQUFDO0VBQy9DVyxPQUFPLEVBQUUsT0FBTztFQUNoQkMsZ0JBQWdCLENBQUMsRUFBRSxPQUFPO0FBQzVC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