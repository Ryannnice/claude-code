// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准工具调用的数据契约。
import type { StructuredPatchHunk } from 'diff';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { isAbsolute, relative, resolve } from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Suspense、use、useState，将 react 中已经封装好的能力接到本文件流程里。
import { Suspense, use, useState } from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from 'src/components/MessageResponse.js';
// 复用 extractTag 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { extractTag } from 'src/utils/messages.js';
// 复用 CtrlOToExpand 终端界面组件，避免在这里重复拼装显示逻辑。
import { CtrlOToExpand } from '../../components/CtrlOToExpand.js';
// 复用 FallbackToolUseErrorMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
// 复用 FileEditToolUpdatedMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FileEditToolUpdatedMessage } from '../../components/FileEditToolUpdatedMessage.js';
// 复用 FileEditToolUseRejectedMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FileEditToolUseRejectedMessage } from '../../components/FileEditToolUseRejectedMessage.js';
// 复用 FilePathLink 终端界面组件，避免在这里重复拼装显示逻辑。
import { FilePathLink } from '../../components/FilePathLink.js';
// 复用 HighlightedCode 终端界面组件，避免在这里重复拼装显示逻辑。
import { HighlightedCode } from '../../components/HighlightedCode.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { ToolProgressData } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolProgressData } from '../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { ProgressMessage } from '../../types/message.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js';
// 复用 getPatchForDisplay 工具函数，把通用处理留在 ../../utils/diff.js 中维护。
import { getPatchForDisplay } from '../../utils/diff.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 复用 getPlansDirectory 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlansDirectory } from '../../utils/plans.js';
// 复用 openForScan、readCapped 工具函数，把通用处理留在 ../../utils/readEditContext.js 中维护。
import { openForScan, readCapped } from '../../utils/readEditContext.js';
// 类型依赖 { Output } 来自 ./FileWriteTool.js，用于校准工具调用的数据契约。
import type { Output } from './FileWriteTool.js';
// MAX_LINES_TO_RENDER保存`10`，供后续判断或组装使用。
const MAX_LINES_TO_RENDER = 10;
// Model output uses \n regardless of platform, so always split on \n.
// os.EOL is \r\n on Windows, which would give numLines=1 for all files.
// EOL 命名 `'\n'`，让后续代码直接表达这个值的用途。
const EOL = '\n';

/**
 * Count visible lines in file content. A trailing newline is treated as a
 * line terminator (not a new empty line), matching editor line numbering.
 */
// countLines 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function countLines(content: string): number {
  // 片段列表格式化`content.split`，供工具调用后续处理使用。
  const parts = content.split(EOL);
  // 返回 `content.endsWith(EOL) ? parts.length - 1 : parts.length`，作为工具调用这次计算的结果。
  return content.endsWith(EOL) ? parts.length - 1 : parts.length;
}
// FileWriteToolCreatedMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function FileWriteToolCreatedMessage(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    content,
    verbose
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // contentWithFallback标记工具实现 UI是否启用对应路径。
  const contentWithFallback = content || "(No content)";
  // numLines 集合统计`countLines`，供工具调用后续处理使用。
  const numLines = countLines(content);
  // plusLines 集合保存`numLines - MAX_LINES_TO_RENDER`，供工具实现 UI后续判断或输出使用。
  const plusLines = numLines - MAX_LINES_TO_RENDER;
  // t1 暂存 `<Text bold={true}>{numLines}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== numLines) {
    // t1 暂存 `<Text bold={true}>{numLines}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>{numLines}</Text>;
    // $[0] 缓存 `numLines`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = numLines;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `verbose ? filePath : relative(getCwd(), filePath)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== filePath || $[3] !== verbose) {
    // t2 暂存 `verbose ? filePath : relative(getCwd(), filePath)` 生成的渲染片段，后续返回路径直接复用。
    t2 = verbose ? filePath : relative(getCwd(), filePath);
    // $[2] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = filePath;
    // $[3] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = verbose;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text bold={true}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t2) {
    // t3 暂存 `<Text bold={true}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true}>{t2}</Text>;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Text>Wrote {t1} lines to{" "}{t3}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t1 || $[8] !== t3) {
    // t4 暂存 `<Text>Wrote {t1} lines to{" "}{t3}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>Wrote {t1} lines to{" "}{t3}</Text>;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `verbose ? contentWithFallback : contentWithFallback.split...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== contentWithFallback || $[11] !== verbose) {
    // t5 暂存 `verbose ? contentWithFallback : contentWithFallback.split...` 生成的渲染片段，后续返回路径直接复用。
    t5 = verbose ? contentWithFallback : contentWithFallback.split("\n").slice(0, MAX_LINES_TO_RENDER).join("\n");
    // $[10] 缓存 `contentWithFallback`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = contentWithFallback;
    // $[11] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = verbose;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // 临时值 t6 命名 `columns - 12`，让后续代码直接表达这个值的用途。
  const t6 = columns - 12;
  // t7 暂存 `<Box flexDirection="column"><HighlightedCode code={t5} fi...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== filePath || $[14] !== t5 || $[15] !== t6) {
    // t7 暂存 `<Box flexDirection="column"><HighlightedCode code={t5} fi...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column"><HighlightedCode code={t5} filePath={filePath} width={t6} /></Box>;
    // $[13] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = filePath;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `!verbose && plusLines > 0 && <Text dimColor={true}>… +{pl...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== numLines || $[18] !== plusLines || $[19] !== verbose) {
    // t8 暂存 `!verbose && plusLines > 0 && <Text dimColor={true}>… +{pl...` 生成的渲染片段，后续返回路径直接复用。
    t8 = !verbose && plusLines > 0 && <Text dimColor={true}>… +{plusLines} {plusLines === 1 ? "line" : "lines"}{" "}{numLines > 0 && <CtrlOToExpand />}</Text>;
    // $[17] 缓存 `numLines`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = numLines;
    // $[18] 缓存 `plusLines`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = plusLines;
    // $[19] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = verbose;
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
  }
  // t9 暂存 `<MessageResponse><Box flexDirection="column">{t4}{t7}{t8}...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t4 || $[22] !== t7 || $[23] !== t8) {
    // t9 暂存 `<MessageResponse><Box flexDirection="column">{t4}{t7}{t8}...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <MessageResponse><Box flexDirection="column">{t4}{t7}{t8}</Box></MessageResponse>;
    // $[21] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t4;
    // $[22] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t7;
    // $[23] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t8;
    // $[24] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[24];
  }
  // 返回 `t9`，作为工具调用这次计算的结果。
  return t9;
}
// userFacingName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function userFacingName(input: Partial<{
  file_path: string;
  content: string;
}> | undefined): string {
  // 满足 `input?.file_path?.startsWith(getPlansDirectory())` 时，工具调用执行该分支。
  if (input?.file_path?.startsWith(getPlansDirectory())) {
    // 返回 `'Updated plan'`，作为工具调用这次计算的结果。
    return 'Updated plan';
  }
  // 返回 `'Write'`，作为工具调用这次计算的结果。
  return 'Write';
}

/** Gates fullscreen click-to-expand. Only `create` truncates (to
 *  MAX_LINES_TO_RENDER); `update` renders the full diff regardless of verbose.
 *  Called per visible message on hover/scroll, so early-exit after finding the
 *  (MAX+1)th line instead of splitting the whole (possibly huge) content. */
// isResultTruncated 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isResultTruncated({
  type,
  content
}: Output): boolean {
  // `type` 与 `'create'` 不一致时刷新派生状态，避免使用过期结果。
  if (type !== 'create') return false;
  // pos 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let pos = 0;
  // 按索引扫描 `MAX_LINES_TO_RENDER`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < MAX_LINES_TO_RENDER; i++) {
    // pos 集合更新为 `content.indexOf(EOL, pos)`，确保工具调用后续读取最新状态。
    pos = content.indexOf(EOL, pos);
    // 满足 `pos === -1` 时，工具调用执行该分支。
    if (pos === -1) return false;
    // 工具实现 UI在这里处理 `pos++`，完成这一小步状态转换。
    pos++;
  }
  // countLines treats a trailing EOL as a terminator, not a new line
  // 返回 `pos < content.length`，作为工具调用这次计算的结果。
  return pos < content.length;
}
// getToolUseSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseSummary(input: Partial<{
  file_path: string;
  content: string;
}> | undefined): string | null {
  // 满足 `!input?.file_path` 时，工具调用执行该分支。
  if (!input?.file_path) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 返回 `getDisplayPath(input.file_path)`，作为工具调用这次计算的结果。
  return getDisplayPath(input.file_path);
}
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(input: Partial<{
  file_path: string;
  content: string;
}>, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // input.file_path 路径数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!input.file_path) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // For plan files, path is already in userFacingName
  // 满足 `input.file_path.startsWith(getPlansDirectory())` 时，工具调用执行该分支。
  if (input.file_path.startsWith(getPlansDirectory())) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return '';
  }
  // 返回 `<FilePathLink filePath={input.file_path}>`，作为工具调用这次计算的结果。
  return <FilePathLink filePath={input.file_path}>
      {verbose ? input.file_path : getDisplayPath(input.file_path)}
    </FilePathLink>;
}
// renderToolUseRejectedMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseRejectedMessage({
  file_path,
  content
}: {
  file_path: string;
  content: string;
}, {
  style,
  verbose
}: {
  style?: 'condensed';
  verbose: boolean;
}): React.ReactNode {
  // 返回 `<WriteRejectionDiff filePath={file_path} content={content} style={style...`，作为工具调用这次计算的结果。
  return <WriteRejectionDiff filePath={file_path} content={content} style={style} verbose={verbose} />;
}
// RejectionDiffData 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type RejectionDiffData = {
  type: 'create';
} | {
  type: 'update';
  patch: StructuredPatchHunk[];
  oldContent: string;
} | {
  type: 'error';
};
// WriteRejectionDiff 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function WriteRejectionDiff(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    content,
    style,
    verbose
  } = t0;
  // t1 暂存 `() => loadRejectionDiff(filePath, content)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== content || $[1] !== filePath) {
    // t1 暂存 `() => loadRejectionDiff(filePath, content)` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => loadRejectionDiff(filePath, content);
    // $[0] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = content;
    // $[1] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = filePath;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // dataPromise 异步任务 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [dataPromise] = useState(t1);
  // t2 暂存 `content.split("\n")[0] ?? null` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== content) {
    // t2 暂存 `content.split("\n")[0] ?? null` 生成的渲染片段，后续返回路径直接复用。
    t2 = content.split("\n")[0] ?? null;
    // $[3] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = content;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // firstLine 命名 `t2`，让后续代码直接表达这个值的用途。
  const firstLine = t2;
  // t3 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== content || $[6] !== filePath || $[7] !== firstLine || $[8] !== verbose) {
    // t3 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <FileEditToolUseRejectedMessage file_path={filePath} operation="write" content={content} firstLine={firstLine} verbose={verbose} />;
    // $[5] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = content;
    // $[6] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = filePath;
    // $[7] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = firstLine;
    // $[8] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = verbose;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // createFallback沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const createFallback = t3;
  // t4 暂存 `<WriteRejectionBody promise={dataPromise} filePath={fileP...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== createFallback || $[11] !== dataPromise || $[12] !== filePath || $[13] !== firstLine || $[14] !== style || $[15] !== verbose) {
    // t4 暂存 `<WriteRejectionBody promise={dataPromise} filePath={fileP...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <WriteRejectionBody promise={dataPromise} filePath={filePath} firstLine={firstLine} createFallback={createFallback} style={style} verbose={verbose} />;
    // $[10] 缓存 `createFallback`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = createFallback;
    // $[11] 缓存 `dataPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = dataPromise;
    // $[12] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = filePath;
    // $[13] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = firstLine;
    // $[14] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = style;
    // $[15] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = verbose;
    // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[16];
  }
  // t5 暂存 `<Suspense fallback={createFallback}>{t4}</Suspense>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== createFallback || $[18] !== t4) {
    // t5 暂存 `<Suspense fallback={createFallback}>{t4}</Suspense>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Suspense fallback={createFallback}>{t4}</Suspense>;
    // $[17] 缓存 `createFallback`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = createFallback;
    // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t4;
    // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[19];
  }
  // 返回 `t5`，作为工具调用这次计算的结果。
  return t5;
}
// WriteRejectionBody 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function WriteRejectionBody(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    promise,
    filePath,
    firstLine,
    createFallback,
    style,
    verbose
  } = t0;
  // data保存`use`，供工具调用后续处理使用。
  const data = use(promise);
  // 当 `data.type` 匹配 `"create"` 时，工具调用执行对应分支。
  if (data.type === "create") {
    // 返回 `createFallback`，作为工具调用这次计算的结果。
    return createFallback;
  }
  // 当 `data.type` 匹配 `"error"` 时，工具调用执行对应分支。
  if (data.type === "error") {
    // t1 暂存 `<MessageResponse><Text>(No changes)</Text></MessageRespon...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<MessageResponse><Text>(No changes)</Text></MessageRespon...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <MessageResponse><Text>(No changes)</Text></MessageResponse>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为工具调用这次计算的结果。
    return t1;
  }
  // t1 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== data.oldContent || $[2] !== data.patch || $[3] !== filePath || $[4] !== firstLine || $[5] !== style || $[6] !== verbose) {
    // t1 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <FileEditToolUseRejectedMessage file_path={filePath} operation="update" patch={data.patch} firstLine={firstLine} fileContent={data.oldContent} style={style} verbose={verbose} />;
    // $[1] 缓存 `data.oldContent`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = data.oldContent;
    // $[2] 缓存 `data.patch`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = data.patch;
    // $[3] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = filePath;
    // $[4] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = firstLine;
    // $[5] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = style;
    // $[6] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = verbose;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[7];
  }
  // 返回 `t1`，作为工具调用这次计算的结果。
  return t1;
}
// loadRejectionDiff 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadRejectionDiff(filePath: string, content: string): Promise<RejectionDiffData> {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // fullFilePath 路径数据保存`isAbsolute`，供工具调用后续处理使用。
    const fullFilePath = isAbsolute(filePath) ? filePath : resolve(getCwd(), filePath);
    // handle保存`openForScan`，供工具调用后续处理使用。
    const handle = await openForScan(fullFilePath);
    // 满足 `handle === null` 时，工具调用执行该分支。
    if (handle === null) return {
      type: 'create'
    };
    // 原始内容 先占位，稍后的条件分支会根据实际输入补齐它。
    let oldContent: string | null;
    // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
    try {
      // 原始内容更新为 `await readCapped(handle)`，确保工具调用后续读取最新状态。
      oldContent = await readCapped(handle);
    } finally {
      // 等待 `handle.close()` 完成，再继续工具实现 UI的异步流程。
      await handle.close();
    }
    // File exceeds MAX_SCAN_BYTES — fall back to the create view rather than
    // OOMing on a diff of a multi-GB file.
    // 满足 `oldContent === null` 时，工具调用执行该分支。
    if (oldContent === null) return {
      type: 'create'
    };
    // patch读取`getPatchForDisplay`，供工具调用后续处理使用。
    const patch = getPatchForDisplay({
      filePath,
      fileContents: oldContent,
      edits: [{
        old_string: oldContent,
        new_string: content,
        replace_all: false
      }]
    });
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'update',
      patch,
      oldContent
    };
  } catch (e) {
    // User may have manually applied the change while the diff was shown.
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(e as Error);
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      type: 'error'
    };
  }
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
        <Text color="error">Error writing file</Text>
      </MessageResponse>;
  }
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage({
  filePath,
  content,
  structuredPatch,
  type,
  originalFile
}: Output, _progressMessagesForMessage: ProgressMessage<ToolProgressData>[], {
  style,
  verbose
}: {
  style?: 'condensed';
  verbose: boolean;
}): React.ReactNode {
  // 按照 type 的取值选择工具调用的具体处理分支。
  switch (type) {
    case 'create':
      {
        // isPlanFile 文件数据记录 `filePath.startsWith` 是否成立，工具调用随后按该结果分支。
        const isPlanFile = filePath.startsWith(getPlansDirectory());

        // Plan files: invert condensed behavior
        // - Regular mode: just show hint (user can type /plan to see full content)
        // - Condensed mode (subagent view): show full content
        // 只有 `isPlanFile && !verbose` 满足时，工具调用才执行该分支。
        if (isPlanFile && !verbose) {
          // `style` 与 `'condensed'` 不一致时刷新派生状态，避免使用过期结果。
          if (style !== 'condensed') {
            // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
            return <MessageResponse>
              <Text dimColor>/plan to preview</Text>
            </MessageResponse>;
          }
        // 工具实现 UI在这里处理 `} else if (style === 'condensed' && !verbose) {`，完成这一小步状态转换。
        } else if (style === 'condensed' && !verbose) {
          // numLines 集合统计`countLines`，供工具调用后续处理使用。
          const numLines = countLines(content);
          // 返回 `<Text>`，作为工具调用这次计算的结果。
          return <Text>
            Wrote <Text bold>{numLines}</Text> lines to{' '}
            <Text bold>{relative(getCwd(), filePath)}</Text>
          </Text>;
        }
        // 返回 `<FileWriteToolCreatedMessage filePath={filePath} content={content} verb...`，作为工具调用这次计算的结果。
        return <FileWriteToolCreatedMessage filePath={filePath} content={content} verbose={verbose} />;
      }
    case 'update':
      {
        // isPlanFile 文件数据记录 `filePath.startsWith` 是否成立，工具调用随后按该结果分支。
        const isPlanFile = filePath.startsWith(getPlansDirectory());
        // 返回 `<FileEditToolUpdatedMessage filePath={filePath} structuredPatch={struct...`，作为工具调用这次计算的结果。
        return <FileEditToolUpdatedMessage filePath={filePath} structuredPatch={structuredPatch} firstLine={content.split('\n')[0] ?? null} fileContent={originalFile ?? undefined} style={style} verbose={verbose} previewHint={isPlanFile ? '/plan to preview' : undefined} />;
      }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlN0cnVjdHVyZWRQYXRjaEh1bmsiLCJpc0Fic29sdXRlIiwicmVsYXRpdmUiLCJyZXNvbHZlIiwiUmVhY3QiLCJTdXNwZW5zZSIsInVzZSIsInVzZVN0YXRlIiwiTWVzc2FnZVJlc3BvbnNlIiwiZXh0cmFjdFRhZyIsIkN0cmxPVG9FeHBhbmQiLCJGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UiLCJGaWxlRWRpdFRvb2xVcGRhdGVkTWVzc2FnZSIsIkZpbGVFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZSIsIkZpbGVQYXRoTGluayIsIkhpZ2hsaWdodGVkQ29kZSIsInVzZVRlcm1pbmFsU2l6ZSIsIkJveCIsIlRleHQiLCJUb29sUHJvZ3Jlc3NEYXRhIiwiUHJvZ3Jlc3NNZXNzYWdlIiwiZ2V0Q3dkIiwiZ2V0UGF0Y2hGb3JEaXNwbGF5IiwiZ2V0RGlzcGxheVBhdGgiLCJsb2dFcnJvciIsImdldFBsYW5zRGlyZWN0b3J5Iiwib3BlbkZvclNjYW4iLCJyZWFkQ2FwcGVkIiwiT3V0cHV0IiwiTUFYX0xJTkVTX1RPX1JFTkRFUiIsIkVPTCIsImNvdW50TGluZXMiLCJjb250ZW50IiwicGFydHMiLCJzcGxpdCIsImVuZHNXaXRoIiwibGVuZ3RoIiwiRmlsZVdyaXRlVG9vbENyZWF0ZWRNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJmaWxlUGF0aCIsInZlcmJvc2UiLCJjb2x1bW5zIiwiY29udGVudFdpdGhGYWxsYmFjayIsIm51bUxpbmVzIiwicGx1c0xpbmVzIiwidDEiLCJ0MiIsInQzIiwidDQiLCJ0NSIsInNsaWNlIiwiam9pbiIsInQ2IiwidDciLCJ0OCIsInQ5IiwidXNlckZhY2luZ05hbWUiLCJpbnB1dCIsIlBhcnRpYWwiLCJmaWxlX3BhdGgiLCJzdGFydHNXaXRoIiwiaXNSZXN1bHRUcnVuY2F0ZWQiLCJ0eXBlIiwicG9zIiwiaSIsImluZGV4T2YiLCJnZXRUb29sVXNlU3VtbWFyeSIsInJlbmRlclRvb2xVc2VNZXNzYWdlIiwiUmVhY3ROb2RlIiwicmVuZGVyVG9vbFVzZVJlamVjdGVkTWVzc2FnZSIsInN0eWxlIiwiUmVqZWN0aW9uRGlmZkRhdGEiLCJwYXRjaCIsIm9sZENvbnRlbnQiLCJXcml0ZVJlamVjdGlvbkRpZmYiLCJsb2FkUmVqZWN0aW9uRGlmZiIsImRhdGFQcm9taXNlIiwiZmlyc3RMaW5lIiwiY3JlYXRlRmFsbGJhY2siLCJXcml0ZVJlamVjdGlvbkJvZHkiLCJwcm9taXNlIiwiZGF0YSIsIlN5bWJvbCIsImZvciIsIlByb21pc2UiLCJmdWxsRmlsZVBhdGgiLCJoYW5kbGUiLCJjbG9zZSIsImZpbGVDb250ZW50cyIsImVkaXRzIiwib2xkX3N0cmluZyIsIm5ld19zdHJpbmciLCJyZXBsYWNlX2FsbCIsImUiLCJFcnJvciIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJyZXN1bHQiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsInN0cnVjdHVyZWRQYXRjaCIsIm9yaWdpbmFsRmlsZSIsIl9wcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSIsImlzUGxhbkZpbGUiLCJ1bmRlZmluZWQiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUb29sUmVzdWx0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRQYXRjaEh1bmsgfSBmcm9tICdkaWZmJ1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSwgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBTdXNwZW5zZSwgdXNlLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRhZyB9IGZyb20gJ3NyYy91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IEN0cmxPVG9FeHBhbmQgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0N0cmxPVG9FeHBhbmQuanMnXG5pbXBvcnQgeyBGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0ZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZS5qcydcbmltcG9ydCB7IEZpbGVFZGl0VG9vbFVwZGF0ZWRNZXNzYWdlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9GaWxlRWRpdFRvb2xVcGRhdGVkTWVzc2FnZS5qcydcbmltcG9ydCB7IEZpbGVFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvRmlsZUVkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgRmlsZVBhdGhMaW5rIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9GaWxlUGF0aExpbmsuanMnXG5pbXBvcnQgeyBIaWdobGlnaHRlZENvZGUgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0hpZ2hsaWdodGVkQ29kZS5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVG9vbFByb2dyZXNzRGF0YSB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IFByb2dyZXNzTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgeyBnZXRDd2QgfSBmcm9tICcuLi8uLi91dGlscy9jd2QuanMnXG5pbXBvcnQgeyBnZXRQYXRjaEZvckRpc3BsYXkgfSBmcm9tICcuLi8uLi91dGlscy9kaWZmLmpzJ1xuaW1wb3J0IHsgZ2V0RGlzcGxheVBhdGggfSBmcm9tICcuLi8uLi91dGlscy9maWxlLmpzJ1xuaW1wb3J0IHsgbG9nRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9sb2cuanMnXG5pbXBvcnQgeyBnZXRQbGFuc0RpcmVjdG9yeSB9IGZyb20gJy4uLy4uL3V0aWxzL3BsYW5zLmpzJ1xuaW1wb3J0IHsgb3BlbkZvclNjYW4sIHJlYWRDYXBwZWQgfSBmcm9tICcuLi8uLi91dGlscy9yZWFkRWRpdENvbnRleHQuanMnXG5pbXBvcnQgdHlwZSB7IE91dHB1dCB9IGZyb20gJy4vRmlsZVdyaXRlVG9vbC5qcydcblxuY29uc3QgTUFYX0xJTkVTX1RPX1JFTkRFUiA9IDEwXG4vLyBNb2RlbCBvdXRwdXQgdXNlcyBcXG4gcmVnYXJkbGVzcyBvZiBwbGF0Zm9ybSwgc28gYWx3YXlzIHNwbGl0IG9uIFxcbi5cbi8vIG9zLkVPTCBpcyBcXHJcXG4gb24gV2luZG93cywgd2hpY2ggd291bGQgZ2l2ZSBudW1MaW5lcz0xIGZvciBhbGwgZmlsZXMuXG5jb25zdCBFT0wgPSAnXFxuJ1xuXG4vKipcbiAqIENvdW50IHZpc2libGUgbGluZXMgaW4gZmlsZSBjb250ZW50LiBBIHRyYWlsaW5nIG5ld2xpbmUgaXMgdHJlYXRlZCBhcyBhXG4gKiBsaW5lIHRlcm1pbmF0b3IgKG5vdCBhIG5ldyBlbXB0eSBsaW5lKSwgbWF0Y2hpbmcgZWRpdG9yIGxpbmUgbnVtYmVyaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY291bnRMaW5lcyhjb250ZW50OiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBwYXJ0cyA9IGNvbnRlbnQuc3BsaXQoRU9MKVxuICByZXR1cm4gY29udGVudC5lbmRzV2l0aChFT0wpID8gcGFydHMubGVuZ3RoIC0gMSA6IHBhcnRzLmxlbmd0aFxufVxuXG5mdW5jdGlvbiBGaWxlV3JpdGVUb29sQ3JlYXRlZE1lc3NhZ2Uoe1xuICBmaWxlUGF0aCxcbiAgY29udGVudCxcbiAgdmVyYm9zZSxcbn06IHtcbiAgZmlsZVBhdGg6IHN0cmluZ1xuICBjb250ZW50OiBzdHJpbmdcbiAgdmVyYm9zZTogYm9vbGVhblxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgY29udGVudFdpdGhGYWxsYmFjayA9IGNvbnRlbnQgfHwgJyhObyBjb250ZW50KSdcbiAgY29uc3QgbnVtTGluZXMgPSBjb3VudExpbmVzKGNvbnRlbnQpXG4gIGNvbnN0IHBsdXNMaW5lcyA9IG51bUxpbmVzIC0gTUFYX0xJTkVTX1RPX1JFTkRFUlxuXG4gIHJldHVybiAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBXcm90ZSA8VGV4dCBib2xkPntudW1MaW5lc308L1RleHQ+IGxpbmVzIHRveycgJ31cbiAgICAgICAgICA8VGV4dCBib2xkPnt2ZXJib3NlID8gZmlsZVBhdGggOiByZWxhdGl2ZShnZXRDd2QoKSwgZmlsZVBhdGgpfTwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8SGlnaGxpZ2h0ZWRDb2RlXG4gICAgICAgICAgICBjb2RlPXtcbiAgICAgICAgICAgICAgdmVyYm9zZVxuICAgICAgICAgICAgICAgID8gY29udGVudFdpdGhGYWxsYmFja1xuICAgICAgICAgICAgICAgIDogY29udGVudFdpdGhGYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBNQVhfTElORVNfVE9fUkVOREVSKVxuICAgICAgICAgICAgICAgICAgICAuam9pbignXFxuJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbGVQYXRoPXtmaWxlUGF0aH1cbiAgICAgICAgICAgIHdpZHRoPXtjb2x1bW5zIC0gMTJ9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHshdmVyYm9zZSAmJiBwbHVzTGluZXMgPiAwICYmIChcbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIOKApiAre3BsdXNMaW5lc30ge3BsdXNMaW5lcyA9PT0gMSA/ICdsaW5lJyA6ICdsaW5lcyd9eycgJ31cbiAgICAgICAgICAgIHtudW1MaW5lcyA+IDAgJiYgPEN0cmxPVG9FeHBhbmQgLz59XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApfVxuICAgICAgPC9Cb3g+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZXJGYWNpbmdOYW1lKFxuICBpbnB1dDogUGFydGlhbDx7IGZpbGVfcGF0aDogc3RyaW5nOyBjb250ZW50OiBzdHJpbmcgfT4gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBpZiAoaW5wdXQ/LmZpbGVfcGF0aD8uc3RhcnRzV2l0aChnZXRQbGFuc0RpcmVjdG9yeSgpKSkge1xuICAgIHJldHVybiAnVXBkYXRlZCBwbGFuJ1xuICB9XG4gIHJldHVybiAnV3JpdGUnXG59XG5cbi8qKiBHYXRlcyBmdWxsc2NyZWVuIGNsaWNrLXRvLWV4cGFuZC4gT25seSBgY3JlYXRlYCB0cnVuY2F0ZXMgKHRvXG4gKiAgTUFYX0xJTkVTX1RPX1JFTkRFUik7IGB1cGRhdGVgIHJlbmRlcnMgdGhlIGZ1bGwgZGlmZiByZWdhcmRsZXNzIG9mIHZlcmJvc2UuXG4gKiAgQ2FsbGVkIHBlciB2aXNpYmxlIG1lc3NhZ2Ugb24gaG92ZXIvc2Nyb2xsLCBzbyBlYXJseS1leGl0IGFmdGVyIGZpbmRpbmcgdGhlXG4gKiAgKE1BWCsxKXRoIGxpbmUgaW5zdGVhZCBvZiBzcGxpdHRpbmcgdGhlIHdob2xlIChwb3NzaWJseSBodWdlKSBjb250ZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUmVzdWx0VHJ1bmNhdGVkKHsgdHlwZSwgY29udGVudCB9OiBPdXRwdXQpOiBib29sZWFuIHtcbiAgaWYgKHR5cGUgIT09ICdjcmVhdGUnKSByZXR1cm4gZmFsc2VcbiAgbGV0IHBvcyA9IDBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNQVhfTElORVNfVE9fUkVOREVSOyBpKyspIHtcbiAgICBwb3MgPSBjb250ZW50LmluZGV4T2YoRU9MLCBwb3MpXG4gICAgaWYgKHBvcyA9PT0gLTEpIHJldHVybiBmYWxzZVxuICAgIHBvcysrXG4gIH1cbiAgLy8gY291bnRMaW5lcyB0cmVhdHMgYSB0cmFpbGluZyBFT0wgYXMgYSB0ZXJtaW5hdG9yLCBub3QgYSBuZXcgbGluZVxuICByZXR1cm4gcG9zIDwgY29udGVudC5sZW5ndGhcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvb2xVc2VTdW1tYXJ5KFxuICBpbnB1dDogUGFydGlhbDx7IGZpbGVfcGF0aDogc3RyaW5nOyBjb250ZW50OiBzdHJpbmcgfT4gfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFpbnB1dD8uZmlsZV9wYXRoKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gZ2V0RGlzcGxheVBhdGgoaW5wdXQuZmlsZV9wYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZU1lc3NhZ2UoXG4gIGlucHV0OiBQYXJ0aWFsPHsgZmlsZV9wYXRoOiBzdHJpbmc7IGNvbnRlbnQ6IHN0cmluZyB9PixcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFpbnB1dC5maWxlX3BhdGgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIC8vIEZvciBwbGFuIGZpbGVzLCBwYXRoIGlzIGFscmVhZHkgaW4gdXNlckZhY2luZ05hbWVcbiAgaWYgKGlucHV0LmZpbGVfcGF0aC5zdGFydHNXaXRoKGdldFBsYW5zRGlyZWN0b3J5KCkpKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgcmV0dXJuIChcbiAgICA8RmlsZVBhdGhMaW5rIGZpbGVQYXRoPXtpbnB1dC5maWxlX3BhdGh9PlxuICAgICAge3ZlcmJvc2UgPyBpbnB1dC5maWxlX3BhdGggOiBnZXREaXNwbGF5UGF0aChpbnB1dC5maWxlX3BhdGgpfVxuICAgIDwvRmlsZVBhdGhMaW5rPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlUmVqZWN0ZWRNZXNzYWdlKFxuICB7IGZpbGVfcGF0aCwgY29udGVudCB9OiB7IGZpbGVfcGF0aDogc3RyaW5nOyBjb250ZW50OiBzdHJpbmcgfSxcbiAgeyBzdHlsZSwgdmVyYm9zZSB9OiB7IHN0eWxlPzogJ2NvbmRlbnNlZCc7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPFdyaXRlUmVqZWN0aW9uRGlmZlxuICAgICAgZmlsZVBhdGg9e2ZpbGVfcGF0aH1cbiAgICAgIGNvbnRlbnQ9e2NvbnRlbnR9XG4gICAgICBzdHlsZT17c3R5bGV9XG4gICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgIC8+XG4gIClcbn1cblxudHlwZSBSZWplY3Rpb25EaWZmRGF0YSA9XG4gIHwgeyB0eXBlOiAnY3JlYXRlJyB9XG4gIHwgeyB0eXBlOiAndXBkYXRlJzsgcGF0Y2g6IFN0cnVjdHVyZWRQYXRjaEh1bmtbXTsgb2xkQ29udGVudDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdlcnJvcicgfVxuXG5mdW5jdGlvbiBXcml0ZVJlamVjdGlvbkRpZmYoe1xuICBmaWxlUGF0aCxcbiAgY29udGVudCxcbiAgc3R5bGUsXG4gIHZlcmJvc2UsXG59OiB7XG4gIGZpbGVQYXRoOiBzdHJpbmdcbiAgY29udGVudDogc3RyaW5nXG4gIHN0eWxlPzogJ2NvbmRlbnNlZCdcbiAgdmVyYm9zZTogYm9vbGVhblxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtkYXRhUHJvbWlzZV0gPSB1c2VTdGF0ZSgoKSA9PiBsb2FkUmVqZWN0aW9uRGlmZihmaWxlUGF0aCwgY29udGVudCkpXG4gIGNvbnN0IGZpcnN0TGluZSA9IGNvbnRlbnQuc3BsaXQoJ1xcbicpWzBdID8/IG51bGxcbiAgY29uc3QgY3JlYXRlRmFsbGJhY2sgPSAoXG4gICAgPEZpbGVFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZVxuICAgICAgZmlsZV9wYXRoPXtmaWxlUGF0aH1cbiAgICAgIG9wZXJhdGlvbj1cIndyaXRlXCJcbiAgICAgIGNvbnRlbnQ9e2NvbnRlbnR9XG4gICAgICBmaXJzdExpbmU9e2ZpcnN0TGluZX1cbiAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgLz5cbiAgKVxuICByZXR1cm4gKFxuICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17Y3JlYXRlRmFsbGJhY2t9PlxuICAgICAgPFdyaXRlUmVqZWN0aW9uQm9keVxuICAgICAgICBwcm9taXNlPXtkYXRhUHJvbWlzZX1cbiAgICAgICAgZmlsZVBhdGg9e2ZpbGVQYXRofVxuICAgICAgICBmaXJzdExpbmU9e2ZpcnN0TGluZX1cbiAgICAgICAgY3JlYXRlRmFsbGJhY2s9e2NyZWF0ZUZhbGxiYWNrfVxuICAgICAgICBzdHlsZT17c3R5bGV9XG4gICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAvPlxuICAgIDwvU3VzcGVuc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gV3JpdGVSZWplY3Rpb25Cb2R5KHtcbiAgcHJvbWlzZSxcbiAgZmlsZVBhdGgsXG4gIGZpcnN0TGluZSxcbiAgY3JlYXRlRmFsbGJhY2ssXG4gIHN0eWxlLFxuICB2ZXJib3NlLFxufToge1xuICBwcm9taXNlOiBQcm9taXNlPFJlamVjdGlvbkRpZmZEYXRhPlxuICBmaWxlUGF0aDogc3RyaW5nXG4gIGZpcnN0TGluZTogc3RyaW5nIHwgbnVsbFxuICBjcmVhdGVGYWxsYmFjazogUmVhY3QuUmVhY3ROb2RlXG4gIHN0eWxlPzogJ2NvbmRlbnNlZCdcbiAgdmVyYm9zZTogYm9vbGVhblxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGRhdGEgPSB1c2UocHJvbWlzZSlcbiAgaWYgKGRhdGEudHlwZSA9PT0gJ2NyZWF0ZScpIHJldHVybiBjcmVhdGVGYWxsYmFja1xuICBpZiAoZGF0YS50eXBlID09PSAnZXJyb3InKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgIDxUZXh0PihObyBjaGFuZ2VzKTwvVGV4dD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuICByZXR1cm4gKFxuICAgIDxGaWxlRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2VcbiAgICAgIGZpbGVfcGF0aD17ZmlsZVBhdGh9XG4gICAgICBvcGVyYXRpb249XCJ1cGRhdGVcIlxuICAgICAgcGF0Y2g9e2RhdGEucGF0Y2h9XG4gICAgICBmaXJzdExpbmU9e2ZpcnN0TGluZX1cbiAgICAgIGZpbGVDb250ZW50PXtkYXRhLm9sZENvbnRlbnR9XG4gICAgICBzdHlsZT17c3R5bGV9XG4gICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgIC8+XG4gIClcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFJlamVjdGlvbkRpZmYoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGNvbnRlbnQ6IHN0cmluZyxcbik6IFByb21pc2U8UmVqZWN0aW9uRGlmZkRhdGE+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBmdWxsRmlsZVBhdGggPSBpc0Fic29sdXRlKGZpbGVQYXRoKVxuICAgICAgPyBmaWxlUGF0aFxuICAgICAgOiByZXNvbHZlKGdldEN3ZCgpLCBmaWxlUGF0aClcbiAgICBjb25zdCBoYW5kbGUgPSBhd2FpdCBvcGVuRm9yU2NhbihmdWxsRmlsZVBhdGgpXG4gICAgaWYgKGhhbmRsZSA9PT0gbnVsbCkgcmV0dXJuIHsgdHlwZTogJ2NyZWF0ZScgfVxuICAgIGxldCBvbGRDb250ZW50OiBzdHJpbmcgfCBudWxsXG4gICAgdHJ5IHtcbiAgICAgIG9sZENvbnRlbnQgPSBhd2FpdCByZWFkQ2FwcGVkKGhhbmRsZSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYXdhaXQgaGFuZGxlLmNsb3NlKClcbiAgICB9XG4gICAgLy8gRmlsZSBleGNlZWRzIE1BWF9TQ0FOX0JZVEVTIOKAlCBmYWxsIGJhY2sgdG8gdGhlIGNyZWF0ZSB2aWV3IHJhdGhlciB0aGFuXG4gICAgLy8gT09NaW5nIG9uIGEgZGlmZiBvZiBhIG11bHRpLUdCIGZpbGUuXG4gICAgaWYgKG9sZENvbnRlbnQgPT09IG51bGwpIHJldHVybiB7IHR5cGU6ICdjcmVhdGUnIH1cbiAgICBjb25zdCBwYXRjaCA9IGdldFBhdGNoRm9yRGlzcGxheSh7XG4gICAgICBmaWxlUGF0aCxcbiAgICAgIGZpbGVDb250ZW50czogb2xkQ29udGVudCxcbiAgICAgIGVkaXRzOiBbXG4gICAgICAgIHsgb2xkX3N0cmluZzogb2xkQ29udGVudCwgbmV3X3N0cmluZzogY29udGVudCwgcmVwbGFjZV9hbGw6IGZhbHNlIH0sXG4gICAgICBdLFxuICAgIH0pXG4gICAgcmV0dXJuIHsgdHlwZTogJ3VwZGF0ZScsIHBhdGNoLCBvbGRDb250ZW50IH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFVzZXIgbWF5IGhhdmUgbWFudWFsbHkgYXBwbGllZCB0aGUgY2hhbmdlIHdoaWxlIHRoZSBkaWZmIHdhcyBzaG93bi5cbiAgICBsb2dFcnJvcihlIGFzIEVycm9yKVxuICAgIHJldHVybiB7IHR5cGU6ICdlcnJvcicgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlRXJyb3JNZXNzYWdlKFxuICByZXN1bHQ6IFRvb2xSZXN1bHRCbG9ja1BhcmFtWydjb250ZW50J10sXG4gIHsgdmVyYm9zZSB9OiB7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChcbiAgICAhdmVyYm9zZSAmJlxuICAgIHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnICYmXG4gICAgZXh0cmFjdFRhZyhyZXN1bHQsICd0b29sX3VzZV9lcnJvcicpXG4gICkge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+RXJyb3Igd3JpdGluZyBmaWxlPC9UZXh0PlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgKVxuICB9XG4gIHJldHVybiA8RmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIHJlc3VsdD17cmVzdWx0fSB2ZXJib3NlPXt2ZXJib3NlfSAvPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UoXG4gIHsgZmlsZVBhdGgsIGNvbnRlbnQsIHN0cnVjdHVyZWRQYXRjaCwgdHlwZSwgb3JpZ2luYWxGaWxlIH06IE91dHB1dCxcbiAgX3Byb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBQcm9ncmVzc01lc3NhZ2U8VG9vbFByb2dyZXNzRGF0YT5bXSxcbiAgeyBzdHlsZSwgdmVyYm9zZSB9OiB7IHN0eWxlPzogJ2NvbmRlbnNlZCc7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ2NyZWF0ZSc6IHtcbiAgICAgIGNvbnN0IGlzUGxhbkZpbGUgPSBmaWxlUGF0aC5zdGFydHNXaXRoKGdldFBsYW5zRGlyZWN0b3J5KCkpXG5cbiAgICAgIC8vIFBsYW4gZmlsZXM6IGludmVydCBjb25kZW5zZWQgYmVoYXZpb3JcbiAgICAgIC8vIC0gUmVndWxhciBtb2RlOiBqdXN0IHNob3cgaGludCAodXNlciBjYW4gdHlwZSAvcGxhbiB0byBzZWUgZnVsbCBjb250ZW50KVxuICAgICAgLy8gLSBDb25kZW5zZWQgbW9kZSAoc3ViYWdlbnQgdmlldyk6IHNob3cgZnVsbCBjb250ZW50XG4gICAgICBpZiAoaXNQbGFuRmlsZSAmJiAhdmVyYm9zZSkge1xuICAgICAgICBpZiAoc3R5bGUgIT09ICdjb25kZW5zZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPi9wbGFuIHRvIHByZXZpZXc8L1RleHQ+XG4gICAgICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc3R5bGUgPT09ICdjb25kZW5zZWQnICYmICF2ZXJib3NlKSB7XG4gICAgICAgIGNvbnN0IG51bUxpbmVzID0gY291bnRMaW5lcyhjb250ZW50KVxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgV3JvdGUgPFRleHQgYm9sZD57bnVtTGluZXN9PC9UZXh0PiBsaW5lcyB0b3snICd9XG4gICAgICAgICAgICA8VGV4dCBib2xkPntyZWxhdGl2ZShnZXRDd2QoKSwgZmlsZVBhdGgpfTwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPEZpbGVXcml0ZVRvb2xDcmVhdGVkTWVzc2FnZVxuICAgICAgICAgIGZpbGVQYXRoPXtmaWxlUGF0aH1cbiAgICAgICAgICBjb250ZW50PXtjb250ZW50fVxuICAgICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAgIC8+XG4gICAgICApXG4gICAgfVxuICAgIGNhc2UgJ3VwZGF0ZSc6IHtcbiAgICAgIGNvbnN0IGlzUGxhbkZpbGUgPSBmaWxlUGF0aC5zdGFydHNXaXRoKGdldFBsYW5zRGlyZWN0b3J5KCkpXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8RmlsZUVkaXRUb29sVXBkYXRlZE1lc3NhZ2VcbiAgICAgICAgICBmaWxlUGF0aD17ZmlsZVBhdGh9XG4gICAgICAgICAgc3RydWN0dXJlZFBhdGNoPXtzdHJ1Y3R1cmVkUGF0Y2h9XG4gICAgICAgICAgZmlyc3RMaW5lPXtjb250ZW50LnNwbGl0KCdcXG4nKVswXSA/PyBudWxsfVxuICAgICAgICAgIGZpbGVDb250ZW50PXtvcmlnaW5hbEZpbGUgPz8gdW5kZWZpbmVkfVxuICAgICAgICAgIHN0eWxlPXtzdHlsZX1cbiAgICAgICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgICAgICAgIHByZXZpZXdIaW50PXtpc1BsYW5GaWxlID8gJy9wbGFuIHRvIHByZXZpZXcnIDogdW5kZWZpbmVkfVxuICAgICAgICAvPlxuICAgICAgKVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0Esb0JBQW9CLFFBQVEsdUNBQXVDO0FBQ2pGLGNBQWNDLG1CQUFtQixRQUFRLE1BQU07QUFDL0MsU0FBU0MsVUFBVSxFQUFFQyxRQUFRLEVBQUVDLE9BQU8sUUFBUSxNQUFNO0FBQ3BELE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxFQUFFQyxHQUFHLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQy9DLFNBQVNDLGVBQWUsUUFBUSxtQ0FBbUM7QUFDbkUsU0FBU0MsVUFBVSxRQUFRLHVCQUF1QjtBQUNsRCxTQUFTQyxhQUFhLFFBQVEsbUNBQW1DO0FBQ2pFLFNBQVNDLDJCQUEyQixRQUFRLGlEQUFpRDtBQUM3RixTQUFTQywwQkFBMEIsUUFBUSxnREFBZ0Q7QUFDM0YsU0FBU0MsOEJBQThCLFFBQVEsb0RBQW9EO0FBQ25HLFNBQVNDLFlBQVksUUFBUSxrQ0FBa0M7QUFDL0QsU0FBU0MsZUFBZSxRQUFRLHFDQUFxQztBQUNyRSxTQUFTQyxlQUFlLFFBQVEsZ0NBQWdDO0FBQ2hFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsY0FBY0MsZ0JBQWdCLFFBQVEsZUFBZTtBQUNyRCxjQUFjQyxlQUFlLFFBQVEsd0JBQXdCO0FBQzdELFNBQVNDLE1BQU0sUUFBUSxvQkFBb0I7QUFDM0MsU0FBU0Msa0JBQWtCLFFBQVEscUJBQXFCO0FBQ3hELFNBQVNDLGNBQWMsUUFBUSxxQkFBcUI7QUFDcEQsU0FBU0MsUUFBUSxRQUFRLG9CQUFvQjtBQUM3QyxTQUFTQyxpQkFBaUIsUUFBUSxzQkFBc0I7QUFDeEQsU0FBU0MsV0FBVyxFQUFFQyxVQUFVLFFBQVEsZ0NBQWdDO0FBQ3hFLGNBQWNDLE1BQU0sUUFB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