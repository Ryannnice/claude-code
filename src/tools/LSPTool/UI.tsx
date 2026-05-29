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
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// 类型依赖 { Input, Output } 来自 ./LSPTool.js，用于校准工具调用的数据契约。
import type { Input, Output } from './LSPTool.js';
// 引入 getSymbolAtPosition，将 ./symbolContext.js 中已经封装好的能力接到本文件流程里。
import { getSymbolAtPosition } from './symbolContext.js';

// Lookup map for operation-specific labels
// OPERATION_LABELS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const OPERATION_LABELS: Record<Input['operation'], {
  singular: string;
  plural: string;
  special?: string;
}> = {
  goToDefinition: {
    singular: 'definition',
    plural: 'definitions'
  },
  findReferences: {
    singular: 'reference',
    plural: 'references'
  },
  documentSymbol: {
    singular: 'symbol',
    plural: 'symbols'
  },
  workspaceSymbol: {
    singular: 'symbol',
    plural: 'symbols'
  },
  hover: {
    singular: 'hover info',
    plural: 'hover info',
    special: 'available'
  },
  goToImplementation: {
    singular: 'implementation',
    plural: 'implementations'
  },
  prepareCallHierarchy: {
    singular: 'call item',
    plural: 'call items'
  },
  incomingCalls: {
    singular: 'caller',
    plural: 'callers'
  },
  outgoingCalls: {
    singular: 'callee',
    plural: 'callees'
  }
};

/**
 * Reusable component for LSP result summaries with collapsed/expanded views
 */
// LSPResultSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function LSPResultSummary(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(24);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    operation,
    resultCount,
    fileCount,
    content,
    verbose
  } = t0;
  // t1 暂存 `OPERATION_LABELS[operation] || {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== operation) {
    // t1 暂存 `OPERATION_LABELS[operation] || {` 生成的渲染片段，后续返回路径直接复用。
    t1 = OPERATION_LABELS[operation] || {
      singular: "result",
      plural: "results"
    };
    // $[0] 缓存 `operation`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = operation;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // labelConfig 配置保存`t1`，作为后续临时缓存值处理的输入。
  const labelConfig = t1;
  // countLabel 数量标记工具实现 UI是否启用对应路径。
  const countLabel = resultCount === 1 ? labelConfig.singular : labelConfig.plural;
  // t2 暂存 `operation === "hover" && resultCount > 0 && labelConfig.s...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== countLabel || $[3] !== labelConfig.special || $[4] !== operation || $[5] !== resultCount) {
    // t2 暂存 `operation === "hover" && resultCount > 0 && labelConfig.s...` 生成的渲染片段，后续返回路径直接复用。
    t2 = operation === "hover" && resultCount > 0 && labelConfig.special ? <Text>Hover info {labelConfig.special}</Text> : <Text>Found <Text bold={true}>{resultCount} </Text>{countLabel}</Text>;
    // $[2] 缓存 `countLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = countLabel;
    // $[3] 缓存 `labelConfig.special`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = labelConfig.special;
    // $[4] 缓存 `operation`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = operation;
    // $[5] 缓存 `resultCount`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = resultCount;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // primaryText保存`t2`，作为后续临时缓存值处理的输入。
  const primaryText = t2;
  // t3 暂存 `fileCount > 1 ? <Text>{" "}across <Text bold={true}>{file...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== fileCount) {
    // t3 暂存 `fileCount > 1 ? <Text>{" "}across <Text bold={true}>{file...` 生成的渲染片段，后续返回路径直接复用。
    t3 = fileCount > 1 ? <Text>{" "}across <Text bold={true}>{fileCount} </Text>files</Text> : null;
    // $[7] 缓存 `fileCount`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = fileCount;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // secondaryText保存`t3`，作为后续临时缓存值处理的输入。
  const secondaryText = t3;
  // 满足 `verbose` 时，工具调用执行该分支。
  if (verbose) {
    // t4 暂存 `<Text dimColor={true}> ⎿ </Text>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
      // t4 暂存 `<Text dimColor={true}> ⎿ </Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text dimColor={true}>  ⎿  </Text>;
      // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[9];
    }
    // t5 暂存 `<Box flexDirection="row"><Text>{t4}{primaryText}{secondar...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== primaryText || $[11] !== secondaryText) {
      // t5 暂存 `<Box flexDirection="row"><Text>{t4}{primaryText}{secondar...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Box flexDirection="row"><Text>{t4}{primaryText}{secondaryText}</Text></Box>;
      // $[10] 缓存 `primaryText`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = primaryText;
      // $[11] 缓存 `secondaryText`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = secondaryText;
      // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[12];
    }
    // t6 暂存 `<Box marginLeft={5}><Text>{content}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[13] !== content) {
      // t6 暂存 `<Box marginLeft={5}><Text>{content}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box marginLeft={5}><Text>{content}</Text></Box>;
      // $[13] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = content;
      // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[14];
    }
    // t7 暂存 `<Box flexDirection="column">{t5}{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== t5 || $[16] !== t6) {
      // t7 暂存 `<Box flexDirection="column">{t5}{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t7 = <Box flexDirection="column">{t5}{t6}</Box>;
      // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = t5;
      // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t6;
      // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[17];
    }
    // 返回 `t7`，作为工具调用这次计算的结果。
    return t7;
  }
  // t4 暂存 `resultCount > 0 && <CtrlOToExpand />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== resultCount) {
    // t4 暂存 `resultCount > 0 && <CtrlOToExpand />` 生成的渲染片段，后续返回路径直接复用。
    t4 = resultCount > 0 && <CtrlOToExpand />;
    // $[18] 缓存 `resultCount`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = resultCount;
    // $[19] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[19];
  }
  // t5 暂存 `<MessageResponse height={1}><Text>{primaryText}{secondary...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== primaryText || $[21] !== secondaryText || $[22] !== t4) {
    // t5 暂存 `<MessageResponse height={1}><Text>{primaryText}{secondary...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <MessageResponse height={1}><Text>{primaryText}{secondaryText} {t4}</Text></MessageResponse>;
    // $[20] 缓存 `primaryText`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = primaryText;
    // $[21] 缓存 `secondaryText`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = secondaryText;
    // $[22] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t4;
    // $[23] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[23];
  }
  // 返回 `t5`，作为工具调用这次计算的结果。
  return t5;
}
// userFacingName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function userFacingName(): string {
  // 返回 `'LSP'`，作为工具调用这次计算的结果。
  return 'LSP';
}
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(input: Partial<Input>, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // input.operation缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!input.operation) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = [];

  // For position-based operations (goToDefinition, findReferences, hover, goToImplementation),
  // show the symbol at the position for better context
  // 只有 `(input.operation === 'goToDefinition' || input.operation === 'findReference...` 满足时，工具调用才执行该分支。
  if ((input.operation === 'goToDefinition' || input.operation === 'findReferences' || input.operation === 'hover' || input.operation === 'goToImplementation') && input.filePath && input.line !== undefined && input.character !== undefined) {
    // Convert from 1-based (user input) to 0-based (internal file reading)
    // symbol读取`getSymbolAtPosition`，供工具调用后续处理使用。
    const symbol = getSymbolAtPosition(input.filePath, input.line - 1, input.character - 1);
    // displayPath 路径数据读取`getDisplayPath`，供工具调用后续处理使用。
    const displayPath = verbose ? input.filePath : getDisplayPath(input.filePath);
    // 满足 `symbol` 时，工具调用执行该分支。
    if (symbol) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`operation: "${input.operation}"`);
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`symbol: "${symbol}"`);
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`in: "${displayPath}"`);
    } else {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`operation: "${input.operation}"`);
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`file: "${displayPath}"`);
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`position: ${input.line}:${input.character}`);
    }
    // 返回 `parts.join(', ')`，作为工具调用这次计算的结果。
    return parts.join(', ');
  }

  // For other operations (documentSymbol, workspaceSymbol),
  // show operation and file without position details
  // 片段列表追加新条目，保持收集顺序与输入顺序一致。
  parts.push(`operation: "${input.operation}"`);
  // 满足 `input.filePath` 时，工具调用执行该分支。
  if (input.filePath) {
    // displayPath 路径数据读取`getDisplayPath`，供工具调用后续处理使用。
    const displayPath = verbose ? input.filePath : getDisplayPath(input.filePath);
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`file: "${displayPath}"`);
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
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text color="error">LSP operation failed</Text>
      </MessageResponse>;
  }
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(output: Output, _progressMessages: unknown[], {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // Use collapsed/expanded view if we have count information
  // `output.resultCount` 与 `undefined && output.fileCo` 不一致时刷新派生状态，避免使用过期结果。
  if (output.resultCount !== undefined && output.fileCount !== undefined) {
    // 返回 `<LSPResultSummary operation={output.operation} resultCount={output.resu...`，作为工具调用这次计算的结果。
    return <LSPResultSummary operation={output.operation} resultCount={output.resultCount} fileCount={output.fileCount} content={output.result} verbose={verbose} />;
  }

  // Fallback for error cases where counts aren't available
  // (e.g., LSP server initialization failures, request errors)
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text>{output.result}</Text>
    </MessageResponse>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0IiwiQ3RybE9Ub0V4cGFuZCIsIkZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSIsIk1lc3NhZ2VSZXNwb25zZSIsIkJveCIsIlRleHQiLCJnZXREaXNwbGF5UGF0aCIsImV4dHJhY3RUYWciLCJJbnB1dCIsIk91dHB1dCIsImdldFN5bWJvbEF0UG9zaXRpb24iLCJPUEVSQVRJT05fTEFCRUxTIiwiUmVjb3JkIiwic2luZ3VsYXIiLCJwbHVyYWwiLCJzcGVjaWFsIiwiZ29Ub0RlZmluaXRpb24iLCJmaW5kUmVmZXJlbmNlcyIsImRvY3VtZW50U3ltYm9sIiwid29ya3NwYWNlU3ltYm9sIiwiaG92ZXIiLCJnb1RvSW1wbGVtZW50YXRpb24iLCJwcmVwYXJlQ2FsbEhpZXJhcmNoeSIsImluY29taW5nQ2FsbHMiLCJvdXRnb2luZ0NhbGxzIiwiTFNQUmVzdWx0U3VtbWFyeSIsInQwIiwiJCIsIl9jIiwib3BlcmF0aW9uIiwicmVzdWx0Q291bnQiLCJmaWxlQ291bnQiLCJjb250ZW50IiwidmVyYm9zZSIsInQxIiwibGFiZWxDb25maWciLCJjb3VudExhYmVsIiwidDIiLCJwcmltYXJ5VGV4dCIsInQzIiwic2Vjb25kYXJ5VGV4dCIsInQ0IiwiU3ltYm9sIiwiZm9yIiwidDUiLCJ0NiIsInQ3IiwidXNlckZhY2luZ05hbWUiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsImlucHV0IiwiUGFydGlhbCIsIlJlYWN0Tm9kZSIsInBhcnRzIiwiZmlsZVBhdGgiLCJsaW5lIiwidW5kZWZpbmVkIiwiY2hhcmFjdGVyIiwic3ltYm9sIiwiZGlzcGxheVBhdGgiLCJwdXNoIiwiam9pbiIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJyZXN1bHQiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsIm91dHB1dCIsIl9wcm9ncmVzc01lc3NhZ2VzIl0sInNvdXJjZXMiOlsiVUkudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVG9vbFJlc3VsdEJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvaW5kZXgubWpzJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQ3RybE9Ub0V4cGFuZCB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvQ3RybE9Ub0V4cGFuZC5qcydcbmltcG9ydCB7IEZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvRmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBnZXREaXNwbGF5UGF0aCB9IGZyb20gJy4uLy4uL3V0aWxzL2ZpbGUuanMnXG5pbXBvcnQgeyBleHRyYWN0VGFnIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgdHlwZSB7IElucHV0LCBPdXRwdXQgfSBmcm9tICcuL0xTUFRvb2wuanMnXG5pbXBvcnQgeyBnZXRTeW1ib2xBdFBvc2l0aW9uIH0gZnJvbSAnLi9zeW1ib2xDb250ZXh0LmpzJ1xuXG4vLyBMb29rdXAgbWFwIGZvciBvcGVyYXRpb24tc3BlY2lmaWMgbGFiZWxzXG5jb25zdCBPUEVSQVRJT05fTEFCRUxTOiBSZWNvcmQ8XG4gIElucHV0WydvcGVyYXRpb24nXSxcbiAgeyBzaW5ndWxhcjogc3RyaW5nOyBwbHVyYWw6IHN0cmluZzsgc3BlY2lhbD86IHN0cmluZyB9XG4+ID0ge1xuICBnb1RvRGVmaW5pdGlvbjogeyBzaW5ndWxhcjogJ2RlZmluaXRpb24nLCBwbHVyYWw6ICdkZWZpbml0aW9ucycgfSxcbiAgZmluZFJlZmVyZW5jZXM6IHsgc2luZ3VsYXI6ICdyZWZlcmVuY2UnLCBwbHVyYWw6ICdyZWZlcmVuY2VzJyB9LFxuICBkb2N1bWVudFN5bWJvbDogeyBzaW5ndWxhcjogJ3N5bWJvbCcsIHBsdXJhbDogJ3N5bWJvbHMnIH0sXG4gIHdvcmtzcGFjZVN5bWJvbDogeyBzaW5ndWxhcjogJ3N5bWJvbCcsIHBsdXJhbDogJ3N5bWJvbHMnIH0sXG4gIGhvdmVyOiB7IHNpbmd1bGFyOiAnaG92ZXIgaW5mbycsIHBsdXJhbDogJ2hvdmVyIGluZm8nLCBzcGVjaWFsOiAnYXZhaWxhYmxlJyB9LFxuICBnb1RvSW1wbGVtZW50YXRpb246IHsgc2luZ3VsYXI6ICdpbXBsZW1lbnRhdGlvbicsIHBsdXJhbDogJ2ltcGxlbWVudGF0aW9ucycgfSxcbiAgcHJlcGFyZUNhbGxIaWVyYXJjaHk6IHsgc2luZ3VsYXI6ICdjYWxsIGl0ZW0nLCBwbHVyYWw6ICdjYWxsIGl0ZW1zJyB9LFxuICBpbmNvbWluZ0NhbGxzOiB7IHNpbmd1bGFyOiAnY2FsbGVyJywgcGx1cmFsOiAnY2FsbGVycycgfSxcbiAgb3V0Z29pbmdDYWxsczogeyBzaW5ndWxhcjogJ2NhbGxlZScsIHBsdXJhbDogJ2NhbGxlZXMnIH0sXG59XG5cbi8qKlxuICogUmV1c2FibGUgY29tcG9uZW50IGZvciBMU1AgcmVzdWx0IHN1bW1hcmllcyB3aXRoIGNvbGxhcHNlZC9leHBhbmRlZCB2aWV3c1xuICovXG5mdW5jdGlvbiBMU1BSZXN1bHRTdW1tYXJ5KHtcbiAgb3BlcmF0aW9uLFxuICByZXN1bHRDb3VudCxcbiAgZmlsZUNvdW50LFxuICBjb250ZW50LFxuICB2ZXJib3NlLFxufToge1xuICBvcGVyYXRpb246IElucHV0WydvcGVyYXRpb24nXVxuICByZXN1bHRDb3VudDogbnVtYmVyXG4gIGZpbGVDb3VudDogbnVtYmVyXG4gIGNvbnRlbnQ6IHN0cmluZ1xuICB2ZXJib3NlOiBib29sZWFuXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gR2V0IGxhYmVsIGNvbmZpZ3VyYXRpb24gZm9yIHRoaXMgb3BlcmF0aW9uXG4gIGNvbnN0IGxhYmVsQ29uZmlnID0gT1BFUkFUSU9OX0xBQkVMU1tvcGVyYXRpb25dIHx8IHtcbiAgICBzaW5ndWxhcjogJ3Jlc3VsdCcsXG4gICAgcGx1cmFsOiAncmVzdWx0cycsXG4gIH1cbiAgY29uc3QgY291bnRMYWJlbCA9XG4gICAgcmVzdWx0Q291bnQgPT09IDEgPyBsYWJlbENvbmZpZy5zaW5ndWxhciA6IGxhYmVsQ29uZmlnLnBsdXJhbFxuXG4gIGNvbnN0IHByaW1hcnlUZXh0ID1cbiAgICBvcGVyYXRpb24gPT09ICdob3ZlcicgJiYgcmVzdWx0Q291bnQgPiAwICYmIGxhYmVsQ29uZmlnLnNwZWNpYWwgPyAoXG4gICAgICA8VGV4dD5Ib3ZlciBpbmZvIHtsYWJlbENvbmZpZy5zcGVjaWFsfTwvVGV4dD5cbiAgICApIDogKFxuICAgICAgPFRleHQ+XG4gICAgICAgIEZvdW5kIDxUZXh0IGJvbGQ+e3Jlc3VsdENvdW50fSA8L1RleHQ+XG4gICAgICAgIHtjb3VudExhYmVsfVxuICAgICAgPC9UZXh0PlxuICAgIClcblxuICBjb25zdCBzZWNvbmRhcnlUZXh0ID1cbiAgICBmaWxlQ291bnQgPiAxID8gKFxuICAgICAgPFRleHQ+XG4gICAgICAgIHsnICd9XG4gICAgICAgIGFjcm9zcyA8VGV4dCBib2xkPntmaWxlQ291bnR9IDwvVGV4dD5cbiAgICAgICAgZmlsZXNcbiAgICAgIDwvVGV4dD5cbiAgICApIDogbnVsbFxuXG4gIGlmICh2ZXJib3NlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiZuYnNwOyZuYnNwO+KOvyAmbmJzcDs8L1RleHQ+XG4gICAgICAgICAgICB7cHJpbWFyeVRleHR9XG4gICAgICAgICAgICB7c2Vjb25kYXJ5VGV4dH1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94IG1hcmdpbkxlZnQ9ezV9PlxuICAgICAgICAgIDxUZXh0Pntjb250ZW50fTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgIDxUZXh0PlxuICAgICAgICB7cHJpbWFyeVRleHR9XG4gICAgICAgIHtzZWNvbmRhcnlUZXh0fSB7cmVzdWx0Q291bnQgPiAwICYmIDxDdHJsT1RvRXhwYW5kIC8+fVxuICAgICAgPC9UZXh0PlxuICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VyRmFjaW5nTmFtZSgpOiBzdHJpbmcge1xuICByZXR1cm4gJ0xTUCdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VNZXNzYWdlKFxuICBpbnB1dDogUGFydGlhbDxJbnB1dD4sXG4gIHsgdmVyYm9zZSB9OiB7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmICghaW5wdXQub3BlcmF0aW9uKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdXG5cbiAgLy8gRm9yIHBvc2l0aW9uLWJhc2VkIG9wZXJhdGlvbnMgKGdvVG9EZWZpbml0aW9uLCBmaW5kUmVmZXJlbmNlcywgaG92ZXIsIGdvVG9JbXBsZW1lbnRhdGlvbiksXG4gIC8vIHNob3cgdGhlIHN5bWJvbCBhdCB0aGUgcG9zaXRpb24gZm9yIGJldHRlciBjb250ZXh0XG4gIGlmIChcbiAgICAoaW5wdXQub3BlcmF0aW9uID09PSAnZ29Ub0RlZmluaXRpb24nIHx8XG4gICAgICBpbnB1dC5vcGVyYXRpb24gPT09ICdmaW5kUmVmZXJlbmNlcycgfHxcbiAgICAgIGlucHV0Lm9wZXJhdGlvbiA9PT0gJ2hvdmVyJyB8fFxuICAgICAgaW5wdXQub3BlcmF0aW9uID09PSAnZ29Ub0ltcGxlbWVudGF0aW9uJykgJiZcbiAgICBpbnB1dC5maWxlUGF0aCAmJlxuICAgIGlucHV0LmxpbmUgIT09IHVuZGVmaW5lZCAmJlxuICAgIGlucHV0LmNoYXJhY3RlciAhPT0gdW5kZWZpbmVkXG4gICkge1xuICAgIC8vIENvbnZlcnQgZnJvbSAxLWJhc2VkICh1c2VyIGlucHV0KSB0byAwLWJhc2VkIChpbnRlcm5hbCBmaWxlIHJlYWRpbmcpXG4gICAgY29uc3Qgc3ltYm9sID0gZ2V0U3ltYm9sQXRQb3NpdGlvbihcbiAgICAgIGlucHV0LmZpbGVQYXRoLFxuICAgICAgaW5wdXQubGluZSAtIDEsXG4gICAgICBpbnB1dC5jaGFyYWN0ZXIgLSAxLFxuICAgIClcbiAgICBjb25zdCBkaXNwbGF5UGF0aCA9IHZlcmJvc2VcbiAgICAgID8gaW5wdXQuZmlsZVBhdGhcbiAgICAgIDogZ2V0RGlzcGxheVBhdGgoaW5wdXQuZmlsZVBhdGgpXG5cbiAgICBpZiAoc3ltYm9sKSB7XG4gICAgICBwYXJ0cy5wdXNoKGBvcGVyYXRpb246IFwiJHtpbnB1dC5vcGVyYXRpb259XCJgKVxuICAgICAgcGFydHMucHVzaChgc3ltYm9sOiBcIiR7c3ltYm9sfVwiYClcbiAgICAgIHBhcnRzLnB1c2goYGluOiBcIiR7ZGlzcGxheVBhdGh9XCJgKVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXJ0cy5wdXNoKGBvcGVyYXRpb246IFwiJHtpbnB1dC5vcGVyYXRpb259XCJgKVxuICAgICAgcGFydHMucHVzaChgZmlsZTogXCIke2Rpc3BsYXlQYXRofVwiYClcbiAgICAgIHBhcnRzLnB1c2goYHBvc2l0aW9uOiAke2lucHV0LmxpbmV9OiR7aW5wdXQuY2hhcmFjdGVyfWApXG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oJywgJylcbiAgfVxuXG4gIC8vIEZvciBvdGhlciBvcGVyYXRpb25zIChkb2N1bWVudFN5bWJvbCwgd29ya3NwYWNlU3ltYm9sKSxcbiAgLy8gc2hvdyBvcGVyYXRpb24gYW5kIGZpbGUgd2l0aG91dCBwb3NpdGlvbiBkZXRhaWxzXG4gIHBhcnRzLnB1c2goYG9wZXJhdGlvbjogXCIke2lucHV0Lm9wZXJhdGlvbn1cImApXG5cbiAgaWYgKGlucHV0LmZpbGVQYXRoKSB7XG4gICAgY29uc3QgZGlzcGxheVBhdGggPSB2ZXJib3NlXG4gICAgICA/IGlucHV0LmZpbGVQYXRoXG4gICAgICA6IGdldERpc3BsYXlQYXRoKGlucHV0LmZpbGVQYXRoKVxuICAgIHBhcnRzLnB1c2goYGZpbGU6IFwiJHtkaXNwbGF5UGF0aH1cImApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignLCAnKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZShcbiAgcmVzdWx0OiBUb29sUmVzdWx0QmxvY2tQYXJhbVsnY29udGVudCddLFxuICB7IHZlcmJvc2UgfTogeyB2ZXJib3NlOiBib29sZWFuIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoXG4gICAgIXZlcmJvc2UgJiZcbiAgICB0eXBlb2YgcmVzdWx0ID09PSAnc3RyaW5nJyAmJlxuICAgIGV4dHJhY3RUYWcocmVzdWx0LCAndG9vbF91c2VfZXJyb3InKVxuICApIHtcbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPkxTUCBvcGVyYXRpb24gZmFpbGVkPC9UZXh0PlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgKVxuICB9XG4gIHJldHVybiA8RmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIHJlc3VsdD17cmVzdWx0fSB2ZXJib3NlPXt2ZXJib3NlfSAvPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UoXG4gIG91dHB1dDogT3V0cHV0LFxuICBfcHJvZ3Jlc3NNZXNzYWdlczogdW5rbm93bltdLFxuICB7IHZlcmJvc2UgfTogeyB2ZXJib3NlOiBib29sZWFuIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBVc2UgY29sbGFwc2VkL2V4cGFuZGVkIHZpZXcgaWYgd2UgaGF2ZSBjb3VudCBpbmZvcm1hdGlvblxuICBpZiAob3V0cHV0LnJlc3VsdENvdW50ICE9PSB1bmRlZmluZWQgJiYgb3V0cHV0LmZpbGVDb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxMU1BSZXN1bHRTdW1tYXJ5XG4gICAgICAgIG9wZXJhdGlvbj17b3V0cHV0Lm9wZXJhdGlvbn1cbiAgICAgICAgcmVzdWx0Q291bnQ9e291dHB1dC5yZXN1bHRDb3VudH1cbiAgICAgICAgZmlsZUNvdW50PXtvdXRwdXQuZmlsZUNvdW50fVxuICAgICAgICBjb250ZW50PXtvdXRwdXQucmVzdWx0fVxuICAgICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICAvLyBGYWxsYmFjayBmb3IgZXJyb3IgY2FzZXMgd2hlcmUgY291bnRzIGFyZW4ndCBhdmFpbGFibGVcbiAgLy8gKGUuZy4sIExTUCBzZXJ2ZXIgaW5pdGlhbGl6YXRpb24gZmFpbHVyZXMsIHJlcXVlc3QgZXJyb3JzKVxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8VGV4dD57b3V0cHV0LnJlc3VsdH08L1RleHQ+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLG9CQUFvQixRQUFRLHVDQUF1QztBQUNqRixPQUFPQyxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxhQUFhLFFBQVEsbUNBQW1DO0FBQ2pFLFNBQVNDLDJCQUEyQixRQUFRLGlEQUFpRDtBQUM3RixTQUFTQyxlQUFlLFFBQVEscUNBQXFDO0FBQ3JFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsY0FBYyxRQUFRLHFCQUFxQjtBQUNwRCxTQUFTQyxVQUFVLFFBQVEseUJBQXlCO0FBQ3BELGNBQWNDLEtBQUssRUFBRUMsTUFBTSxRQUFRLGNBQWM7QUFDakQsU0FBU0MsbUJBQW1CLFFBQVEsb0JBQW9COztBQUV4RDtBQUNBLE1BQU1DLGdCQUFnQixFQUFFQyxNQUFNLENBQzVCSixLQUFLLENBQUMsV0FBVyxDQUFDLEVBQ2xCO0VBQUVLLFFBQVEsRUFBRSxNQUFNO0VBQUVDLE1BQU0sRUFBRSxNQUFNO0VBQUVDLE9BQU8sQ0FBQyxFQUFFLE1BQU07QUFBQyxDQUFDLENBQ3ZELEdBQUc7RUFDRkMsY0FBYyxFQUFFO0lBQUVILFFBQVEsRUFBRSxZQUFZO0lBQUVDLE1BQU0sRUFBRTtFQUFjLENBQUM7RUFDakVHLGNBQWMsRUFBRTtJQUFFSixRQUFRLEVBQUUsV0FBVztJQUFFQyxNQUFNLEVBQUU7RUFBYSxDQUFDO0VBQy9ESSxjQUFjLEVBQUU7SUFBRUwsUUFBUSxFQUFFLFFBQVE7SUFBRUMsTUFBTSxFQUFFO0VBQVUsQ0FBQztFQUN6REssZUFBZSxFQUFFO0lBQUVOLFFBQVEsRUFBRSxRQUFRO0lBQUVDLE1BQU0sRUFBRTtFQUFVLENBQUM7RUFDMURNLEtBQUssRUFBRTtJQUFFUCxRQUFRLEVBQUUsWUFBWTtJQUFFQyxNQUFNLEVBQUUsWUFBWTtJQUFFQyxPQUFPLEVBQUU7RUFBWSxDQUFDO0VBQzdFTSxrQkFBa0IsRUFBRTtJQUFFUixRQUFRLEVBQUUsZ0JBQWdCO0lBQUVDLE1BQU0sRUFBRTtFQUFrQixDQUFDO0VBQzdFUSxvQkFBb0IsRUFBRTtJQUFFVCxRQUFRLEVBQUUsV0FBVztJQUFFQyxNQUFNLEVBQUU7RUFBYSxDQUFDO0VBQ3JFUyxhQUFhLEVBQUU7SUFBRVYsUUFBUSxFQUFFLFFBQVE7SUFBRUMsTUFBTSxFQUFFO0VBQVUsQ0FBQztFQUN4RFUsYUFBYSxFQUFFO0lBQUVYLFFBQVEsRUFBRSxRQUFRO0lBQUVDLE1BQU0sRUFBRTtFQUFVO0FBQ3pELENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0EsU0FBQVcsaUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBMEI7SUFBQUMsU0FBQTtJQUFBQyxXQUFBO0lBQUFDLFNBQUE7SUFBQUMsT0FBQTtJQUFBQztFQUFBLElBQUFQLEVBWXpCO0VBQUEsSUFBQVEsRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQUUsU0FBQTtJQUVxQkssRUFBQSxHQUFBdkIsZ0JBQWdCLENBQUNrQixTQUFTLENBRzdDLElBSG1CO01BQUFoQixRQUFBLEVBQ1IsUUFBUTtNQUFBQyxNQUFBLEVBQ1Y7SUFDVixDQUFDO0lBQUFhLENBQUEsTUFBQUUsU0FBQTtJQUFBRixDQUFBLE1BQUFPLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFQLENBQUE7RUFBQTtFQUhELE1BQUFRLFdBQUEsR0FBb0JELEVBR25CO0VBQ0QsTUFBQUUsVUFBQSxHQUNFTixXQUFXLEtBQUssQ0FBNkMsR0FBekNLLFdBQVcsQ0FBQXRCLFFBQThCLEdBQWxCc0IsV0FBVyxDQUFBckIsTUFBTztFQUFBLElBQUF1QixFQUFBO0VBQUEsSUFBQVYsQ0FBQSxRQUFBUyxVQUFBLElBQUFULENBQUEsUUFBQVEsV0FBQSxDQUFBcEIsT0FBQSxJQUFBWSxDQUFBLFFBQUFFLFNBQUEsSUFBQUYsQ0FBQSxRQUFBRyxXQUFBO0lBRzdETyxFQUFBLEdBQUFSLFNBQVMsS0FBSyxPQUEwQixJQUFmQyxXQUFXLEdBQUcsQ0FBd0IsSUFBbkJLLFdBQVcsQ0FBQXBCLE9BT3RELEdBTkMsQ0FBQyxJQUFJLENBQUMsV0FBWSxDQUFBb0IsV0FBVyxDQUFBcEIsT0FBTyxDQUFFLEVBQXJDLElBQUksQ0FNTixHQUpDLENBQUMsSUFBSSxDQUFDLE1BQ0UsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFFZSxZQUFVLENBQUUsQ0FBQyxFQUF4QixJQUFJLENBQ1ZNLFdBQVMsQ0FDWixFQUhDLElBQUksQ0FJTjtJQUFBVCxDQUFBLE1BQUFTLFVBQUE7SUFBQVQsQ0FBQSxNQUFBUSxXQUFBLENBQUFwQixPQUFBO0lBQUFZLENBQUEsTUFBQUUsU0FBQTtJQUFBRixDQUFBLE1BQUFHLFdBQUE7SUFBQUgsQ0FBQSxNQUFBVSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBVixDQUFBO0VBQUE7RUFSSCxNQUFBVyxXQUFBLEdBQ0VELEVBT0M7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQVosQ0FBQSxRQUFBSSxTQUFBO0lBR0RRLEVBQUEsR0FBQVIsU0FBUyxHQUFHLENBTUosR0FMTixDQUFDLElBQUksQ0FDRixJQUFFLENBQUUsT0FDRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQUVBLFVBQVEsQ0FBRSxDQUFDLEVBQXRCLElBQUksQ0FBeUIsS0FFdkMsRUFKQyxJQUFJLENBS0MsR0FOUixJQU1RO0lBQUFKLENBQUEsTUFBQUksU0FBQTtJQUFBSixDQUFBLE1BQUFZLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFaLENBQUE7RUFBQTtFQVBWLE1BQUFhLGFBQUEsR0FDRUQsRUFNUTtFQUVWLElBQUlOLE9BQU87SUFBQSxJQUFBUSxFQUFBO0lBQUEsSUFBQWQsQ0FBQSxRQUFBZSxNQUFBLENBQUFDLEdBQUE7TUFLREYsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsS0FBb0IsRUFBbEMsSUFBSSxDQUFxQztNQUFBZCxDQUFBLE1BQUFjLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFkLENBQUE7SUFBQTtJQUFBLElBQUFpQixFQUFBO0lBQUEsSUFBQWpCLENBQUEsU0FBQVcsV0FBQSxJQUFBWCxDQUFBLFNBQUFhLGFBQUE7TUFGOUNJLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBSyxDQUFMLEtBQUssQ0FDdEIsQ0FBQyxJQUFJLENBQ0gsQ0FBQUgsRUFBeUMsQ0FDeENILFlBQVUsQ0FDVkUsY0FBWSxDQUNmLEVBSkMsSUFBSSxDQUtQLEVBTkMsR0FBRyxDQU1FO01BQUFiLENBQUEsT0FBQVcsV0FBQTtNQUFBWCxDQUFBLE9BQUFhLGFBQUE7TUFBQWIsQ0FBQSxPQUFBaUIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQWpCLENBQUE7SUFBQTtJQUFBLElBQUFrQixFQUFBO0lBQUEsSUFBQWxCLENBQUEsU0FBQUssT0FBQTtNQUNOYSxFQUFBLElBQUMsR0FBRyxDQUFhLFVBQUMsQ0FBRCxHQUFDLENBQ2hCLENBQUMsSUFBSSxDQUFFYixRQUFNLENBQUUsRUFBZCxJQUFJLENBQ1AsRUFGQyxHQUFHLENBRUU7TUFBQUwsQ0FBQSxPQUFBSyxPQUFBO01BQUFMLENBQUEsT0FBQWtCLEVBQUE7SUFBQTtNQUFBQSxFQUFBLEdBQUFsQixDQUFBO0lBQUE7SUFBQSxJQUFBbUIsRUFBQTtJQUFBLElBQUFuQixDQUFBLFNBQUFpQixFQUFBLElBQUFqQixDQUFBLFNBQUFrQixFQUFBO01BVlJDLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUYsRUFNSyxDQUNMLENBQUFDLEVBRUssQ0FDUCxFQVhDLEdBQUcsQ0FXRTtNQUFBbEIsQ0FBQSxPQUFBaUIsRUFBQTtNQUFBakIsQ0FBQSxPQUFBa0IsRUFBQTtNQUFBbEIsQ0FBQSxPQUFBbUIsRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQW5CLENBQUE7SUFBQTtJQUFBLE9BWE5tQixFQVdNO0VBQUE7RUFFVCxJQUFBTCxFQUFBO0VBQUEsSUFBQWQsQ0FBQSxTQUFBRyxXQUFBO0lBTXNCVyxFQUFBLEdBQUFYLFdBQVcsR0FBRyxDQUFzQixJQUFqQixDQUFDLGFBQWEsR0FBRztJQUFBSCxDQUFBLE9BQUFHLFdBQUE7SUFBQUgsQ0FBQSxPQUFBYyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBZCxDQUFBO0VBQUE7RUFBQSxJQUFBaUIsRUFBQTtFQUFBLElBQUFqQixDQUFBLFNBQUFXLFdBQUEsSUFBQVgsQ0FBQSxTQUFBYSxhQUFBLElBQUFiLENBQUEsU0FBQWMsRUFBQTtJQUh6REcsRUFBQSxJQUFDLGVBQWUsQ0FBUyxNQUFDLENBQUQsR0FBQyxDQUN4QixDQUFDLElBQUksQ0FDRk4sWUFBVSxDQUNWRSxjQUFZLENBQUUsQ0FBRSxDQUFBQyxFQUFtQyxDQUN0RCxFQUhDLElBQUksQ0FJUCxFQUxDLGVBQWUsQ0FLRTtJQUFBZCxDQUFBLE9BQUFXLFdBQUE7SUFBQVgsQ0FBQSxPQUFBYSxhQUFBO0lBQUFiLENBQUEsT0FBQWMsRUFBQTtJQUFBZCxDQUFBLE9BQUFpQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBakIsQ0FBQTtFQUFBO0VBQUEsT0FMbEJpQixFQUtrQjtBQUFBO0FBSXRCLE9BQU8sU0FBU0csY0FBY0EsQ0FBQSxDQUFFLEVBQUUsTUFBTSxDQUFDO0VBQ3ZDLE9BQU8sS0FBSztBQUNkO0FBRUEsT0FBTyxTQUFTQyxvQkFBb0JBLENBQ2xDQyxLQUFLLEVBQUVDLE9BQU8sQ0FBQzFDLEtBQUssQ0FBQyxFQUNyQjtFQUFFeUI7QUFBOEIsQ0FBckIsRUFBRTtFQUFFQSxPQUFPLEVBQUUsT0FBTztBQUFDLENBQUMsQ0FDbEMsRUFBRWpDLEtBQUssQ0FBQ21ELFNBQVMsQ0FBQztFQUNqQixJQUFJLENBQUNGLEtBQUssQ0FBQ3BCLFNBQVMsRUFBRTtJQUNwQixPQUFPLElBQUk7RUFDYjtFQUVBLE1BQU11QixLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRTs7RUFFMUI7RUFDQTtFQUNBLElBQ0UsQ0FBQ0gsS0FBSyxDQUFDcEIsU0FBUyxLQUFLLGdCQUFnQixJQUNuQ29CLEtBQUssQ0FBQ3BCLFNBQVMsS0FBSyxnQkFBZ0IsSUFDcENvQixLQUFLLENBQUNwQixTQUFTLEtBQUssT0FBTyxJQUMzQm9CLEtBQUssQ0FBQ3BCLFNBQVMsS0FBSyxvQkFBb0IsS0FDMUNvQixLQUFLLENBQUNJLFFBQVEsSUFDZEosS0FBSyxDQUFDSyxJQUFJLEtBQUtDLFNBQVMsSUFDeEJOLEtBQUssQ0FBQ08sU0FBUyxLQUFLRCxTQUFTLEVBQzdCO0lBQ0E7SUFDQSxNQUFNRSxNQUFNLEdBQUcvQyxtQkFBbUIsQ0FDaEN1QyxLQUFLLENBQUNJLFFBQVEsRUFDZEosS0FBSyxDQUFDSyxJQUFJLEdBQUcsQ0FBQyxFQUNkTCxLQUFLLENBQUNPLFNBQVMsR0FBRyxDQUNwQixDQUFDO0lBQ0QsTUFBTUUsV0FBVyxHQUFHekIsT0FBTyxHQUN2QmdCLEtBQUssQ0FBQ0ksUUFBUSxHQUNkL0MsY0FBYyxDQUFDMkMsS0FBSyxDQUFDSSxRQUFRLENBQUM7SUFFbEMsSUFBSUksTUFBTSxFQUFFO01BQ1ZMLEtBQUssQ0FBQ08sSUFBSSxDQUFDLGVBQWVWLEtBQUssQ0FBQ3BCLFNBQVMsR0FBRyxDQUFDO01BQzdDdUIsS0FBSyxDQUFDTyxJQUFJLENBQUMsWUFBWUYsTUFBTSxHQUFHLENBQUM7TUFDakNMLEtBQUssQ0FBQ08sSUFBSSxDQUFDLFFBQVFELFdBQVcsR0FBRyxDQUFDO0lBQ3BDLENBQUMsTUFBTTtNQUNMTixLQUFLLENBQUNPLElBQUksQ0FBQyxlQUFlVixLQUFLLENBQUNwQixTQUFTLEdBQUcsQ0FBQztNQUM3Q3VCLEtBQUssQ0FBQ08sSUFBSSxDQUFDLFVBQVVELFdBQVcsR0FBRyxDQUFDO01BQ3BDTixLQUFLLENBQUNPLElBQUksQ0FBQyxhQUFhVixLQUFLLENBQUNLLElBQUksSUFBSUwsS0FBSyxDQUFDTyxTQUFTLEVBQUUsQ0FBQztJQUMxRDtJQUVBLE9BQU9KLEtBQUssQ0FBQ1EsSUFBSSxDQUFDLElBQUksQ0FBQztFQUN6Qjs7RUFFQTtFQUNBO0VBQ0FSLEtBQUssQ0FBQ08sSUFBSSxDQUFDLGVBQWVWLEtBQUssQ0FBQ3BCLFNBQVMsR0FBRyxDQUFDO0VBRTdDLElBQUlvQixLQUFLLENBQUNJLFFBQVEsRUFBRTtJQUNsQixNQUFNSyxXQUFXLEdBQUd6QixPQUFPLEdBQ3ZCZ0IsS0FBSyxDQUFDSSxRQUFRLEdBQ2QvQyxjQUFjLENBQUMyQyxLQUFLLENBQUNJLFFBQVEsQ0FBQztJQUNsQ0QsS0FBSyxDQUFDTyxJQUFJLENBQUMsVUFBVUQsV0FBVyxHQUFHLENBQUM7RUFDdEM7RUFFQSxPQUFPTixLQUFLLENBQUNRLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDekI7QUFFQSxPQUFPLFNBQVNDLHlCQUF5QkEsQ0FDdkNDLE1BQU0sRUFBRS9ELG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxFQUN2QztFQUFFa0M7QUFBOEIsQ0FBckIsRUFBRTtFQUFFQSxPQUFPLEVBQUUsT0FBTztBQUFDLENBQUMsQ0FDbEMsRUFBRWpDLEtBQUssQ0FBQ21ELFNBQVMsQ0FBQztFQUNqQixJQUNFLENBQUNsQixPQUFPLElBQ1IsT0FBTzZCLE1BQU0sS0FBSyxRQUFRLElBQzFCdkQsVUFBVSxDQUFDdUQsTUFBTSxFQUFFLGdCQUFnQixDQUFDLEVBQ3BDO0lBQ0EsT0FDRSxDQUFDLGVBQWU7QUFDdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG9CQUFvQixFQUFFLElBQUk7QUFDdEQsTUFBTSxFQUFFLGVBQWUsQ0FBQztFQUV0QjtFQUNBLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQ0EsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM3QixPQUFPLENBQUMsR0FBRztBQUMxRTtBQUVBLE9BQU8sU0FBUzhCLHVCQUF1QkEsQ0FDckNDLE1BQU0sRUFBRXZELE1BQU0sRUFDZHdELGlCQUFpQixFQUFFLE9BQU8sRUFBRSxFQUM1QjtFQUFFaEM7QUFBOEIsQ0FBckIsRUFBRTtFQUFFQSxPQUFPLEVBQUUsT0FBTztBQUFDLENBQUMsQ0FDbEMsRUFBRWpDLEtBQUssQ0FBQ21ELFNBQVMsQ0FBQztFQUNqQjtFQUNBLElBQUlhLE1BQU0sQ0FBQ2xDLFdBQVcsS0FBS3lCLFNBQVMsSUFBSVMsTUFBTSxDQUFDakMsU0FBUyxLQUFLd0IsU0FBUyxFQUFFO0lBQ3RFLE9BQ0UsQ0FBQyxnQkFBZ0IsQ0FDZixTQUFTLENBQUMsQ0FBQ1MsTUFBTSxDQUFDbkMsU0FBUyxDQUFDLENBQzVCLFdBQVcsQ0FBQyxDQUFDbUMsTUFBTSxDQUFDbEMsV0FBVyxDQUFDLENBQ2hDLFNBQVMsQ0FBQyxDQUFDa0MsTUFBTSxDQUFDakMsU0FBUyxDQUFDLENBQzVCLE9BQU8sQ0FBQyxDQUFDaUMsTUFBTSxDQUFDRixNQUFNLENBQUMsQ0FDdkIsT0FBTyxDQUFDLENBQUM3QixPQUFPLENBQUMsR0FDakI7RUFFTjs7RUFFQTtFQUNBO0VBQ0EsT0FDRSxDQUFDLGVBQWU7QUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDK0IsTUFBTSxDQUFDRixNQUFNLENBQUMsRUFBRSxJQUFJO0FBQ2pDLElBQUksRUFBRSxlQUFlLENBQUM7QUFFdEIiLCJpZ25vcmVMaXN0IjpbXX0=