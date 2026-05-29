// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 CtrlOToExpand 终端界面组件，避免在这里重复拼装显示逻辑。
import { CtrlOToExpand } from '../../components/CtrlOToExpand.js';
// 复用 FallbackToolUseErrorMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 TOOL_SUMMARY_MAX_LENGTH，将 ../../constants/toolLimits.js 中已经封装好的能力接到本文件流程里。
import { TOOL_SUMMARY_MAX_LENGTH } from '../../constants/toolLimits.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { ToolProgressData } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolProgressData } from '../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { ProgressMessage } from '../../types/message.js';
// 复用 FILE_NOT_FOUND_CWD_NOTE、getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { FILE_NOT_FOUND_CWD_NOTE, getDisplayPath } from '../../utils/file.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';

// Reusable component for search result summaries
// SearchResultSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SearchResultSummary(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    count,
    countLabel,
    secondaryCount,
    secondaryLabel,
    content,
    verbose
  } = t0;
  // t1 暂存 `<Text bold={true}>{count} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== count) {
    // t1 暂存 `<Text bold={true}>{count} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>{count} </Text>;
    // $[0] 缓存 `count`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = count;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `count === 0 || count > 1 ? countLabel : countLabel.slice(...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== count || $[3] !== countLabel) {
    // t2 暂存 `count === 0 || count > 1 ? countLabel : countLabel.slice(...` 生成的渲染片段，后续返回路径直接复用。
    t2 = count === 0 || count > 1 ? countLabel : countLabel.slice(0, -1);
    // $[2] 缓存 `count`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = count;
    // $[3] 缓存 `countLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = countLabel;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text>Found {t1}{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t1 || $[6] !== t2) {
    // t3 暂存 `<Text>Found {t1}{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Found {t1}{t2}</Text>;
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
  // primaryText 命名 `t3`，让后续代码直接表达这个值的用途。
  const primaryText = t3;
  // t4 暂存 `secondaryCount !== undefined && secondaryLabel ? <Text>{"...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== secondaryCount || $[9] !== secondaryLabel) {
    // t4 暂存 `secondaryCount !== undefined && secondaryLabel ? <Text>{"...` 生成的渲染片段，后续返回路径直接复用。
    t4 = secondaryCount !== undefined && secondaryLabel ? <Text>{" "}across <Text bold={true}>{secondaryCount} </Text>{secondaryCount === 0 || secondaryCount > 1 ? secondaryLabel : secondaryLabel.slice(0, -1)}</Text> : null;
    // $[8] 缓存 `secondaryCount`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = secondaryCount;
    // $[9] 缓存 `secondaryLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = secondaryLabel;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // secondaryText沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const secondaryText = t4;
  // 满足 `verbose` 时，工具调用执行该分支。
  if (verbose) {
    // t5 暂存 `<Text dimColor={true}> ⎿ </Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
      // t5 暂存 `<Text dimColor={true}> ⎿ </Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={true}>  ⎿  </Text>;
      // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[11];
    }
    // t6 暂存 `<Box flexDirection="row"><Text>{t5}{primaryText}{secondar...` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== primaryText || $[13] !== secondaryText) {
      // t6 暂存 `<Box flexDirection="row"><Text>{t5}{primaryText}{secondar...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box flexDirection="row"><Text>{t5}{primaryText}{secondaryText}</Text></Box>;
      // $[12] 缓存 `primaryText`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = primaryText;
      // $[13] 缓存 `secondaryText`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = secondaryText;
      // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[14];
    }
    // t7 暂存 `<Box marginLeft={5}><Text>{content}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== content) {
      // t7 暂存 `<Box marginLeft={5}><Text>{content}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Box marginLeft={5}><Text>{content}</Text></Box>;
      // $[15] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = content;
      // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[16];
    }
    // t8 暂存 `<Box flexDirection="column">{t6}{t7}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== t6 || $[18] !== t7) {
      // t8 暂存 `<Box flexDirection="column">{t6}{t7}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Box flexDirection="column">{t6}{t7}</Box>;
      // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t6;
      // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t7;
      // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[19];
    }
    // 返回 `t8`，作为工具调用这次计算的结果。
    return t8;
  }
  // t5 暂存 `count > 0 && <CtrlOToExpand />` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== count) {
    // t5 暂存 `count > 0 && <CtrlOToExpand />` 生成的渲染片段，后续返回路径直接复用。
    t5 = count > 0 && <CtrlOToExpand />;
    // $[20] 缓存 `count`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = count;
    // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[21];
  }
  // t6 暂存 `<MessageResponse height={1}><Text>{primaryText}{secondary...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== primaryText || $[23] !== secondaryText || $[24] !== t5) {
    // t6 暂存 `<MessageResponse height={1}><Text>{primaryText}{secondary...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <MessageResponse height={1}><Text>{primaryText}{secondaryText} {t5}</Text></MessageResponse>;
    // $[22] 缓存 `primaryText`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = primaryText;
    // $[23] 缓存 `secondaryText`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = secondaryText;
    // $[24] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t5;
    // $[25] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[25];
  }
  // 返回 `t6`，作为工具调用这次计算的结果。
  return t6;
}
// Output 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type Output = {
  mode?: 'content' | 'files_with_matches' | 'count';
  numFiles: number;
  filenames: string[];
  content?: string;
  numLines?: number; // For content mode
  numMatches?: number; // For count mode
};
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage({
  pattern,
  path
}: Partial<{
  pattern: string;
  path?: string;
}>, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // pattern缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!pattern) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [`pattern: "${pattern}"`];
  // 满足 `path` 时，工具调用执行该分支。
  if (path) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`path: "${verbose ? path : getDisplayPath(path)}"`);
  }
  // 返回 `parts.join(', ')`，作为工具调用这次计算的结果。
  return parts.join(', ');
}
// renderToolUseErrorMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseErrorMessage(result: ToolResultBlockParam['content'], {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 只有 `!verbose && typeof result === 'string' && extractTag(result, 'tool_use_erro...` 满足时，工具调用才执行该分支。
  if (!verbose && typeof result === 'string' && extractTag(result, 'tool_use_error')) {
    // errorMessage 消息数据保存`extractTag`，供工具调用后续处理使用。
    const errorMessage = extractTag(result, 'tool_use_error');
    // 满足 `errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)` 时，工具调用执行该分支。
    if (errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)) {
      // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
      return <MessageResponse>
          <Text color="error">File not found</Text>
        </MessageResponse>;
    }
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text color="error">Error searching files</Text>
      </MessageResponse>;
  }
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage({
  mode = 'files_with_matches',
  filenames,
  numFiles,
  content,
  numLines,
  numMatches
}: Output, _progressMessagesForMessage: ProgressMessage<ToolProgressData>[], {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 当 `mode` 匹配 `'content'` 时，工具调用执行对应分支。
  if (mode === 'content') {
    // 返回 `<SearchResultSummary count={numLines ?? 0} countLabel="lines" content={...`，作为工具调用这次计算的结果。
    return <SearchResultSummary count={numLines ?? 0} countLabel="lines" content={content} verbose={verbose} />;
  }
  // 当 `mode` 匹配 `'count'` 时，工具调用执行对应分支。
  if (mode === 'count') {
    // 返回 `<SearchResultSummary count={numMatches ?? 0} countLabel="matches" secon...`，作为工具调用这次计算的结果。
    return <SearchResultSummary count={numMatches ?? 0} countLabel="matches" secondaryCount={numFiles} secondaryLabel="files" content={content} verbose={verbose} />;
  }

  // files_with_matches mode
  // fileListContent 文件数据派生`filenames.map`，供工具调用后续处理使用。
  const fileListContent = filenames.map(filename => filename).join('\n');
  // 返回 `<SearchResultSummary count={numFiles} countLabel="files" content={fileL...`，作为工具调用这次计算的结果。
  return <SearchResultSummary count={numFiles} countLabel="files" content={fileListContent} verbose={verbose} />;
}
// getToolUseSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseSummary(input: Partial<{
  pattern: string;
  path?: string;
  glob?: string;
  type?: string;
  output_mode?: 'content' | 'files_with_matches' | 'count';
  head_limit?: number;
}> | undefined): string | null {
  // 满足 `!input?.pattern` 时，工具调用执行该分支。
  if (!input?.pattern) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 返回 `truncate(input.pattern, TOOL_SUMMARY_MAX_LENGTH)`，作为工具调用这次计算的结果。
  return truncate(input.pattern, TOOL_SUMMARY_MAX_LENGTH);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0IiwiQ3RybE9Ub0V4cGFuZCIsIkZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSIsIk1lc3NhZ2VSZXNwb25zZSIsIlRPT0xfU1VNTUFSWV9NQVhfTEVOR1RIIiwiQm94IiwiVGV4dCIsIlRvb2xQcm9ncmVzc0RhdGEiLCJQcm9ncmVzc01lc3NhZ2UiLCJGSUxFX05PVF9GT1VORF9DV0RfTk9URSIsImdldERpc3BsYXlQYXRoIiwidHJ1bmNhdGUiLCJleHRyYWN0VGFnIiwiU2VhcmNoUmVzdWx0U3VtbWFyeSIsInQwIiwiJCIsIl9jIiwiY291bnQiLCJjb3VudExhYmVsIiwic2Vjb25kYXJ5Q291bnQiLCJzZWNvbmRhcnlMYWJlbCIsImNvbnRlbnQiLCJ2ZXJib3NlIiwidDEiLCJ0MiIsInNsaWNlIiwidDMiLCJwcmltYXJ5VGV4dCIsInQ0IiwidW5kZWZpbmVkIiwic2Vjb25kYXJ5VGV4dCIsInQ1IiwiU3ltYm9sIiwiZm9yIiwidDYiLCJ0NyIsInQ4IiwiT3V0cHV0IiwibW9kZSIsIm51bUZpbGVzIiwiZmlsZW5hbWVzIiwibnVtTGluZXMiLCJudW1NYXRjaGVzIiwicmVuZGVyVG9vbFVzZU1lc3NhZ2UiLCJwYXR0ZXJuIiwicGF0aCIsIlBhcnRpYWwiLCJSZWFjdE5vZGUiLCJwYXJ0cyIsInB1c2giLCJqb2luIiwicmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSIsInJlc3VsdCIsImVycm9yTWVzc2FnZSIsImluY2x1ZGVzIiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJfcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiLCJmaWxlTGlzdENvbnRlbnQiLCJtYXAiLCJmaWxlbmFtZSIsImdldFRvb2xVc2VTdW1tYXJ5IiwiaW5wdXQiLCJnbG9iIiwidHlwZSIsIm91dHB1dF9tb2RlIiwiaGVhZF9saW1pdCJdLCJzb3VyY2VzIjpbIlVJLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRvb2xSZXN1bHRCbG9ja1BhcmFtIH0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL2luZGV4Lm1qcydcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEN0cmxPVG9FeHBhbmQgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0N0cmxPVG9FeHBhbmQuanMnXG5pbXBvcnQgeyBGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0ZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZS5qcydcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgVE9PTF9TVU1NQVJZX01BWF9MRU5HVEggfSBmcm9tICcuLi8uLi9jb25zdGFudHMvdG9vbExpbWl0cy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVG9vbFByb2dyZXNzRGF0YSB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IFByb2dyZXNzTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgeyBGSUxFX05PVF9GT1VORF9DV0RfTk9URSwgZ2V0RGlzcGxheVBhdGggfSBmcm9tICcuLi8uLi91dGlscy9maWxlLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGUgfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyBleHRyYWN0VGFnIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5cbi8vIFJldXNhYmxlIGNvbXBvbmVudCBmb3Igc2VhcmNoIHJlc3VsdCBzdW1tYXJpZXNcbmZ1bmN0aW9uIFNlYXJjaFJlc3VsdFN1bW1hcnkoe1xuICBjb3VudCxcbiAgY291bnRMYWJlbCxcbiAgc2Vjb25kYXJ5Q291bnQsXG4gIHNlY29uZGFyeUxhYmVsLFxuICBjb250ZW50LFxuICB2ZXJib3NlLFxufToge1xuICBjb3VudDogbnVtYmVyXG4gIGNvdW50TGFiZWw6IHN0cmluZ1xuICBzZWNvbmRhcnlDb3VudD86IG51bWJlclxuICBzZWNvbmRhcnlMYWJlbD86IHN0cmluZ1xuICBjb250ZW50Pzogc3RyaW5nXG4gIHZlcmJvc2U6IGJvb2xlYW5cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBwcmltYXJ5VGV4dCA9IChcbiAgICA8VGV4dD5cbiAgICAgIEZvdW5kIDxUZXh0IGJvbGQ+e2NvdW50fSA8L1RleHQ+XG4gICAgICB7Y291bnQgPT09IDAgfHwgY291bnQgPiAxID8gY291bnRMYWJlbCA6IGNvdW50TGFiZWwuc2xpY2UoMCwgLTEpfVxuICAgIDwvVGV4dD5cbiAgKVxuXG4gIGNvbnN0IHNlY29uZGFyeVRleHQgPVxuICAgIHNlY29uZGFyeUNvdW50ICE9PSB1bmRlZmluZWQgJiYgc2Vjb25kYXJ5TGFiZWwgPyAoXG4gICAgICA8VGV4dD5cbiAgICAgICAgeycgJ31cbiAgICAgICAgYWNyb3NzIDxUZXh0IGJvbGQ+e3NlY29uZGFyeUNvdW50fSA8L1RleHQ+XG4gICAgICAgIHtzZWNvbmRhcnlDb3VudCA9PT0gMCB8fCBzZWNvbmRhcnlDb3VudCA+IDFcbiAgICAgICAgICA/IHNlY29uZGFyeUxhYmVsXG4gICAgICAgICAgOiBzZWNvbmRhcnlMYWJlbC5zbGljZSgwLCAtMSl9XG4gICAgICA8L1RleHQ+XG4gICAgKSA6IG51bGxcblxuICBpZiAodmVyYm9zZSkge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4mbmJzcDsmbmJzcDvijr8gJm5ic3A7PC9UZXh0PlxuICAgICAgICAgICAge3ByaW1hcnlUZXh0fVxuICAgICAgICAgICAge3NlY29uZGFyeVRleHR9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveCBtYXJnaW5MZWZ0PXs1fT5cbiAgICAgICAgICA8VGV4dD57Y29udGVudH08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICA8VGV4dD5cbiAgICAgICAge3ByaW1hcnlUZXh0fVxuICAgICAgICB7c2Vjb25kYXJ5VGV4dH0ge2NvdW50ID4gMCAmJiA8Q3RybE9Ub0V4cGFuZCAvPn1cbiAgICAgIDwvVGV4dD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuXG50eXBlIE91dHB1dCA9IHtcbiAgbW9kZT86ICdjb250ZW50JyB8ICdmaWxlc193aXRoX21hdGNoZXMnIHwgJ2NvdW50J1xuICBudW1GaWxlczogbnVtYmVyXG4gIGZpbGVuYW1lczogc3RyaW5nW11cbiAgY29udGVudD86IHN0cmluZ1xuICBudW1MaW5lcz86IG51bWJlciAvLyBGb3IgY29udGVudCBtb2RlXG4gIG51bU1hdGNoZXM/OiBudW1iZXIgLy8gRm9yIGNvdW50IG1vZGVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VNZXNzYWdlKFxuICB7IHBhdHRlcm4sIHBhdGggfTogUGFydGlhbDx7IHBhdHRlcm46IHN0cmluZzsgcGF0aD86IHN0cmluZyB9PixcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBwYXJ0cyA9IFtgcGF0dGVybjogXCIke3BhdHRlcm59XCJgXVxuXG4gIGlmIChwYXRoKSB7XG4gICAgcGFydHMucHVzaChgcGF0aDogXCIke3ZlcmJvc2UgPyBwYXRoIDogZ2V0RGlzcGxheVBhdGgocGF0aCl9XCJgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJywgJylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UoXG4gIHJlc3VsdDogVG9vbFJlc3VsdEJsb2NrUGFyYW1bJ2NvbnRlbnQnXSxcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKFxuICAgICF2ZXJib3NlICYmXG4gICAgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycgJiZcbiAgICBleHRyYWN0VGFnKHJlc3VsdCwgJ3Rvb2xfdXNlX2Vycm9yJylcbiAgKSB7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXh0cmFjdFRhZyhyZXN1bHQsICd0b29sX3VzZV9lcnJvcicpXG4gICAgaWYgKGVycm9yTWVzc2FnZT8uaW5jbHVkZXMoRklMRV9OT1RfRk9VTkRfQ1dEX05PVEUpKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5GaWxlIG5vdCBmb3VuZDwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+RXJyb3Igc2VhcmNoaW5nIGZpbGVzPC9UZXh0PlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgKVxuICB9XG4gIHJldHVybiA8RmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIHJlc3VsdD17cmVzdWx0fSB2ZXJib3NlPXt2ZXJib3NlfSAvPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UoXG4gIHtcbiAgICBtb2RlID0gJ2ZpbGVzX3dpdGhfbWF0Y2hlcycsXG4gICAgZmlsZW5hbWVzLFxuICAgIG51bUZpbGVzLFxuICAgIGNvbnRlbnQsXG4gICAgbnVtTGluZXMsXG4gICAgbnVtTWF0Y2hlcyxcbiAgfTogT3V0cHV0LFxuICBfcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IFByb2dyZXNzTWVzc2FnZTxUb29sUHJvZ3Jlc3NEYXRhPltdLFxuICB7IHZlcmJvc2UgfTogeyB2ZXJib3NlOiBib29sZWFuIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAobW9kZSA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxTZWFyY2hSZXN1bHRTdW1tYXJ5XG4gICAgICAgIGNvdW50PXtudW1MaW5lcyA/PyAwfVxuICAgICAgICBjb3VudExhYmVsPVwibGluZXNcIlxuICAgICAgICBjb250ZW50PXtjb250ZW50fVxuICAgICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICBpZiAobW9kZSA9PT0gJ2NvdW50Jykge1xuICAgIHJldHVybiAoXG4gICAgICA8U2VhcmNoUmVzdWx0U3VtbWFyeVxuICAgICAgICBjb3VudD17bnVtTWF0Y2hlcyA/PyAwfVxuICAgICAgICBjb3VudExhYmVsPVwibWF0Y2hlc1wiXG4gICAgICAgIHNlY29uZGFyeUNvdW50PXtudW1GaWxlc31cbiAgICAgICAgc2Vjb25kYXJ5TGFiZWw9XCJmaWxlc1wiXG4gICAgICAgIGNvbnRlbnQ9e2NvbnRlbnR9XG4gICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIC8vIGZpbGVzX3dpdGhfbWF0Y2hlcyBtb2RlXG4gIGNvbnN0IGZpbGVMaXN0Q29udGVudCA9IGZpbGVuYW1lcy5tYXAoZmlsZW5hbWUgPT4gZmlsZW5hbWUpLmpvaW4oJ1xcbicpXG4gIHJldHVybiAoXG4gICAgPFNlYXJjaFJlc3VsdFN1bW1hcnlcbiAgICAgIGNvdW50PXtudW1GaWxlc31cbiAgICAgIGNvdW50TGFiZWw9XCJmaWxlc1wiXG4gICAgICBjb250ZW50PXtmaWxlTGlzdENvbnRlbnR9XG4gICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgIC8+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvb2xVc2VTdW1tYXJ5KFxuICBpbnB1dDpcbiAgICB8IFBhcnRpYWw8e1xuICAgICAgICBwYXR0ZXJuOiBzdHJpbmdcbiAgICAgICAgcGF0aD86IHN0cmluZ1xuICAgICAgICBnbG9iPzogc3RyaW5nXG4gICAgICAgIHR5cGU/OiBzdHJpbmdcbiAgICAgICAgb3V0cHV0X21vZGU/OiAnY29udGVudCcgfCAnZmlsZXNfd2l0aF9tYXRjaGVzJyB8ICdjb3VudCdcbiAgICAgICAgaGVhZF9saW1pdD86IG51bWJlclxuICAgICAgfT5cbiAgICB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIWlucHV0Py5wYXR0ZXJuKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gdHJ1bmNhdGUoaW5wdXQucGF0dGVybiwgVE9PTF9TVU1NQVJZX01BWF9MRU5HVEgpXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxjQUFjQSxvQkFBb0IsUUFBUSx1Q0FBdUM7QUFDakYsT0FBT0MsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsYUFBYSxRQUFRLG1DQUFtQztBQUNqRSxTQUFTQywyQkFBMkIsUUFBUSxpREFBaUQ7QUFDN0YsU0FBU0MsZUFBZSxRQUFRLHFDQUFxQztBQUNyRSxTQUFTQyx1QkFBdUIsUUFBUSwrQkFBK0I7QUFDdkUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxjQUFjQyxnQkFBZ0IsUUFBUSxlQUFlO0FBQ3JELGNBQWNDLGVBQWUsUUFBUSx3QkFBd0I7QUFDN0QsU0FBU0MsdUJBQXVCLEVBQUVDLGNBQWMsUUFBUSxxQkFBcUI7QUFDN0UsU0FBU0MsUUFBUSxRQUFRLHVCQUF1QjtBQUNoRCxTQUFTQyxVQUFVLFFBQVEseUJBQXlCOztBQUVwRDtBQUNBLFNBQUFDLG9CQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTZC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