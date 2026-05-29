// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准工具调用的数据契约。
import type { StructuredPatchHunk } from 'diff';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Suspense、use、useState，将 react 中已经封装好的能力接到本文件流程里。
import { Suspense, use, useState } from 'react';
// 复用 FileEditToolUseRejectedMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FileEditToolUseRejectedMessage } from 'src/components/FileEditToolUseRejectedMessage.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from 'src/components/MessageResponse.js';
// 复用 extractTag 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { extractTag } from 'src/utils/messages.js';
// 复用 FallbackToolUseErrorMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
// 复用 FileEditToolUpdatedMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FileEditToolUpdatedMessage } from '../../components/FileEditToolUpdatedMessage.js';
// 复用 FilePathLink 终端界面组件，避免在这里重复拼装显示逻辑。
import { FilePathLink } from '../../components/FilePathLink.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 类型依赖 { Tools } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tools } from '../../Tool.js';
// 类型依赖 { Message, ProgressMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { Message, ProgressMessage } from '../../types/message.js';
// 复用 adjustHunkLineNumbers、CONTEXT_LINES 工具函数，把通用处理留在 ../../utils/diff.js 中维护。
import { adjustHunkLineNumbers, CONTEXT_LINES } from '../../utils/diff.js';
// 复用 FILE_NOT_FOUND_CWD_NOTE、getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { FILE_NOT_FOUND_CWD_NOTE, getDisplayPath } from '../../utils/file.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 复用 getPlansDirectory 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlansDirectory } from '../../utils/plans.js';
// 复用 readEditContext 工具函数，把通用处理留在 ../../utils/readEditContext.js 中维护。
import { readEditContext } from '../../utils/readEditContext.js';
// 复用 firstLineOf 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { firstLineOf } from '../../utils/stringUtils.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准工具调用的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// 类型依赖 { FileEditOutput } 来自 ./types.js，用于校准工具调用的数据契约。
import type { FileEditOutput } from './types.js';
// 引入 findActualString、getPatchForEdit、preserveQuoteStyle，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { findActualString, getPatchForEdit, preserveQuoteStyle } from './utils.js';
// userFacingName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function userFacingName(input: Partial<{
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all: boolean;
  edits: unknown[];
}> | undefined): string {
  // 用户输入缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!input) {
    // 返回 `'Update'`，作为工具调用这次计算的结果。
    return 'Update';
  }
  // 满足 `input.file_path?.startsWith(getPlansDirectory())` 时，工具调用执行该分支。
  if (input.file_path?.startsWith(getPlansDirectory())) {
    // 返回 `'Updated plan'`，作为工具调用这次计算的结果。
    return 'Updated plan';
  }
  // Hashline edits always modify an existing file (line-ref based)
  // 满足 `input.edits != null` 时，工具调用执行该分支。
  if (input.edits != null) {
    // 返回 `'Update'`，作为工具调用这次计算的结果。
    return 'Update';
  }
  // 满足 `input.old_string === ''` 时，工具调用执行该分支。
  if (input.old_string === '') {
    // 返回 `'Create'`，作为工具调用这次计算的结果。
    return 'Create';
  }
  // 返回 `'Update'`，作为工具调用这次计算的结果。
  return 'Update';
}
// getToolUseSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseSummary(input: Partial<{
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all: boolean;
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
export function renderToolUseMessage({
  file_path
}: {
  file_path?: string;
}, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // file_path 路径数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!file_path) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // For plan files, path is already in userFacingName
  // 满足 `file_path.startsWith(getPlansDirectory())` 时，工具调用执行该分支。
  if (file_path.startsWith(getPlansDirectory())) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return '';
  }
  // 返回 `<FilePathLink filePath={file_path}>`，作为工具调用这次计算的结果。
  return <FilePathLink filePath={file_path}>
      {verbose ? file_path : getDisplayPath(file_path)}
    </FilePathLink>;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage({
  filePath,
  structuredPatch,
  originalFile
}: FileEditOutput, _progressMessagesForMessage: ProgressMessage[], {
  style,
  verbose
}: {
  style?: 'condensed';
  verbose: boolean;
}): React.ReactNode {
  // For plan files, show /plan hint above the diff
  // isPlanFile 文件数据记录 `filePath.startsWith` 是否成立，工具调用随后按该结果分支。
  const isPlanFile = filePath.startsWith(getPlansDirectory());
  // 返回 `<FileEditToolUpdatedMessage filePath={filePath} structuredPatch={struct...`，作为工具调用这次计算的结果。
  return <FileEditToolUpdatedMessage filePath={filePath} structuredPatch={structuredPatch} firstLine={originalFile.split('\n')[0] ?? null} fileContent={originalFile} style={style} verbose={verbose} previewHint={isPlanFile ? '/plan to preview' : undefined} />;
}
// renderToolUseRejectedMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseRejectedMessage(input: {
  file_path: string;
  old_string?: string;
  new_string?: string;
  replace_all?: boolean;
  edits?: unknown[];
}, options: {
  columns: number;
  messages: Message[];
  progressMessagesForMessage: ProgressMessage[];
  style?: 'condensed';
  theme: ThemeName;
  tools: Tools;
  verbose: boolean;
}): React.ReactElement {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    style,
    verbose
  } = options;
  // 文件路径保存`input.file_path`，供工具实现 UI后续判断或输出使用。
  const filePath = input.file_path;
  // oldString 命名 `input.old_string ?? ''`，让后续代码直接表达这个值的用途。
  const oldString = input.old_string ?? '';
  // newString保存`input.new_string ?? ''`，供后续判断或组装使用。
  const newString = input.new_string ?? '';
  // replaceAll格式化`input.replace_all ?? false` 整理出中间结果，供工具实现 UI后续步骤使用。
  const replaceAll = input.replace_all ?? false;

  // Defensive: if input has an unexpected shape, show a simple rejection message
  // 只有 `'edits' in input && input.edits != null` 满足时，工具调用才执行该分支。
  if ('edits' in input && input.edits != null) {
    // 返回 `<FileEditToolUseRejectedMessage file_path={filePath} operation="update"...`，作为工具调用这次计算的结果。
    return <FileEditToolUseRejectedMessage file_path={filePath} operation="update" firstLine={null} verbose={verbose} />;
  }
  // isNewFile 文件数据标记工具实现 UI是否启用对应路径。
  const isNewFile = oldString === '';

  // For new file creation, show content preview instead of diff
  // 满足 `isNewFile` 时，工具调用执行该分支。
  if (isNewFile) {
    // 返回 `<FileEditToolUseRejectedMessage file_path={filePath} operation="write" ...`，作为工具调用这次计算的结果。
    return <FileEditToolUseRejectedMessage file_path={filePath} operation="write" content={newString} firstLine={firstLineOf(newString)} verbose={verbose} />;
  }
  // 返回 `<EditRejectionDiff filePath={filePath} oldString={oldString} newString=...`，作为工具调用这次计算的结果。
  return <EditRejectionDiff filePath={filePath} oldString={oldString} newString={newString} replaceAll={replaceAll} style={style} verbose={verbose} />;
}
// renderToolUseErrorMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseErrorMessage(result: ToolResultBlockParam['content'], options: {
  progressMessagesForMessage: ProgressMessage[];
  tools: Tools;
  verbose: boolean;
}): React.ReactElement {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    verbose
  } = options;
  // 只有 `!verbose && typeof result === 'string' && extractTag(result, 'tool_use_erro...` 满足时，工具调用才执行该分支。
  if (!verbose && typeof result === 'string' && extractTag(result, 'tool_use_error')) {
    // errorMessage 消息数据保存`extractTag`，供工具调用后续处理使用。
    const errorMessage = extractTag(result, 'tool_use_error');
    // Show a less scary message for intended behavior
    // 满足 `errorMessage?.includes('File has not been read yet')` 时，工具调用执行该分支。
    if (errorMessage?.includes('File has not been read yet')) {
      // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
      return <MessageResponse>
          <Text dimColor>File must be read first</Text>
        </MessageResponse>;
    }
    // 满足 `errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)` 时，工具调用执行该分支。
    if (errorMessage?.includes(FILE_NOT_FOUND_CWD_NOTE)) {
      // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
      return <MessageResponse>
          <Text color="error">File not found</Text>
        </MessageResponse>;
    }
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text color="error">Error editing file</Text>
      </MessageResponse>;
  }
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
// RejectionDiffData 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type RejectionDiffData = {
  patch: StructuredPatchHunk[];
  firstLine: string | null;
  fileContent: string | undefined;
};
// EditRejectionDiff 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function EditRejectionDiff(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    filePath,
    oldString,
    newString,
    replaceAll,
    style,
    verbose
  } = t0;
  // t1 暂存 `() => loadRejectionDiff(filePath, oldString, newString, r...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== filePath || $[1] !== newString || $[2] !== oldString || $[3] !== replaceAll) {
    // t1 暂存 `() => loadRejectionDiff(filePath, oldString, newString, r...` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => loadRejectionDiff(filePath, oldString, newString, replaceAll);
    // $[0] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = filePath;
    // $[1] 缓存 `newString`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = newString;
    // $[2] 缓存 `oldString`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = oldString;
    // $[3] 缓存 `replaceAll`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = replaceAll;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // dataPromise 异步任务 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [dataPromise] = useState(t1);
  // t2 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== filePath || $[6] !== verbose) {
    // t2 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <FileEditToolUseRejectedMessage file_path={filePath} operation="update" firstLine={null} verbose={verbose} />;
    // $[5] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = filePath;
    // $[6] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = verbose;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // t3 暂存 `<EditRejectionBody promise={dataPromise} filePath={filePa...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== dataPromise || $[9] !== filePath || $[10] !== style || $[11] !== verbose) {
    // t3 暂存 `<EditRejectionBody promise={dataPromise} filePath={filePa...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <EditRejectionBody promise={dataPromise} filePath={filePath} style={style} verbose={verbose} />;
    // $[8] 缓存 `dataPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = dataPromise;
    // $[9] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = filePath;
    // $[10] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = style;
    // $[11] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = verbose;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[12];
  }
  // t4 暂存 `<Suspense fallback={t2}>{t3}</Suspense>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t2 || $[14] !== t3) {
    // t4 暂存 `<Suspense fallback={t2}>{t3}</Suspense>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Suspense fallback={t2}>{t3}</Suspense>;
    // $[13] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t2;
    // $[14] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t3;
    // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[15];
  }
  // 返回 `t4`，作为工具调用这次计算的结果。
  return t4;
}
// EditRejectionBody 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function EditRejectionBody(t0) {
  // $保存`_c`，供工具调用后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    promise,
    filePath,
    style,
    verbose
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    patch,
    firstLine,
    fileContent
  } = use(promise);
  // t1 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== fileContent || $[1] !== filePath || $[2] !== firstLine || $[3] !== patch || $[4] !== style || $[5] !== verbose) {
    // t1 暂存 `<FileEditToolUseRejectedMessage file_path={filePath} oper...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <FileEditToolUseRejectedMessage file_path={filePath} operation="update" patch={patch} firstLine={firstLine} fileContent={fileContent} style={style} verbose={verbose} />;
    // $[0] 缓存 `fileContent`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = fileContent;
    // $[1] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = filePath;
    // $[2] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = firstLine;
    // $[3] 缓存 `patch`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = patch;
    // $[4] 缓存 `style`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = style;
    // $[5] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = verbose;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[6];
  }
  // 返回 `t1`，作为工具调用这次计算的结果。
  return t1;
}
// loadRejectionDiff 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function loadRejectionDiff(filePath: string, oldString: string, newString: string, replaceAll: boolean): Promise<RejectionDiffData> {
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // Chunked read — context window around the first occurrence. replaceAll
    // still shows matches *within* the window via getPatchForEdit; we accept
    // losing the all-occurrences view to keep the read bounded.
    // ctx读取`readEditContext`，供工具调用后续处理使用。
    const ctx = await readEditContext(filePath, oldString, CONTEXT_LINES);
    // 只有 `ctx === null || ctx.truncated || ctx.content ===` 满足时，工具调用才执行该分支。
    if (ctx === null || ctx.truncated || ctx.content === '') {
      // ENOENT / not found / truncated — diff just the tool inputs.
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        patch
      } = getPatchForEdit({
        filePath,
        fileContents: oldString,
        oldString,
        newString
      });
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        patch,
        firstLine: null,
        fileContent: undefined
      };
    }
    // actualOld筛选`findActualString`，供工具调用后续处理使用。
    const actualOld = findActualString(ctx.content, oldString) || oldString;
    // actualNew保存`preserveQuoteStyle`，供工具调用后续处理使用。
    const actualNew = preserveQuoteStyle(oldString, actualOld, newString);
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      patch
    } = getPatchForEdit({
      filePath,
      fileContents: ctx.content,
      oldString: actualOld,
      newString: actualNew,
      replaceAll
    });
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      patch: adjustHunkLineNumbers(patch, ctx.lineOffset - 1),
      firstLine: ctx.lineOffset === 1 ? firstLineOf(ctx.content) : null,
      fileContent: ctx.content
    };
  } catch (e) {
    // User may have manually applied the change while the diff was shown.
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logError(e as Error);
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      patch: [],
      firstLine: null,
      fileContent: undefined
    };
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlN0cnVjdHVyZWRQYXRjaEh1bmsiLCJSZWFjdCIsIlN1c3BlbnNlIiwidXNlIiwidXNlU3RhdGUiLCJGaWxlRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2UiLCJNZXNzYWdlUmVzcG9uc2UiLCJleHRyYWN0VGFnIiwiRmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIiwiRmlsZUVkaXRUb29sVXBkYXRlZE1lc3NhZ2UiLCJGaWxlUGF0aExpbmsiLCJUZXh0IiwiVG9vbHMiLCJNZXNzYWdlIiwiUHJvZ3Jlc3NNZXNzYWdlIiwiYWRqdXN0SHVua0xpbmVOdW1iZXJzIiwiQ09OVEVYVF9MSU5FUyIsIkZJTEVfTk9UX0ZPVU5EX0NXRF9OT1RFIiwiZ2V0RGlzcGxheVBhdGgiLCJsb2dFcnJvciIsImdldFBsYW5zRGlyZWN0b3J5IiwicmVhZEVkaXRDb250ZXh0IiwiZmlyc3RMaW5lT2YiLCJUaGVtZU5hbWUiLCJGaWxlRWRpdE91dHB1dCIsImZpbmRBY3R1YWxTdHJpbmciLCJnZXRQYXRjaEZvckVkaXQiLCJwcmVzZXJ2ZVF1b3RlU3R5bGUiLCJ1c2VyRmFjaW5nTmFtZSIsImlucHV0IiwiUGFydGlhbCIsImZpbGVfcGF0aCIsIm9sZF9zdHJpbmciLCJuZXdfc3RyaW5nIiwicmVwbGFjZV9hbGwiLCJlZGl0cyIsInN0YXJ0c1dpdGgiLCJnZXRUb29sVXNlU3VtbWFyeSIsInJlbmRlclRvb2xVc2VNZXNzYWdlIiwidmVyYm9zZSIsIlJlYWN0Tm9kZSIsInJlbmRlclRvb2xSZXN1bHRNZXNzYWdlIiwiZmlsZVBhdGgiLCJzdHJ1Y3R1cmVkUGF0Y2giLCJvcmlnaW5hbEZpbGUiLCJfcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiLCJzdHlsZSIsImlzUGxhbkZpbGUiLCJzcGxpdCIsInVuZGVmaW5lZCIsInJlbmRlclRvb2xVc2VSZWplY3RlZE1lc3NhZ2UiLCJvcHRpb25zIiwiY29sdW1ucyIsIm1lc3NhZ2VzIiwicHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiLCJ0aGVtZSIsInRvb2xzIiwiUmVhY3RFbGVtZW50Iiwib2xkU3RyaW5nIiwibmV3U3RyaW5nIiwicmVwbGFjZUFsbCIsImlzTmV3RmlsZSIsInJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UiLCJyZXN1bHQiLCJlcnJvck1lc3NhZ2UiLCJpbmNsdWRlcyIsIlJlamVjdGlvbkRpZmZEYXRhIiwicGF0Y2giLCJmaXJzdExpbmUiLCJmaWxlQ29udGVudCIsIkVkaXRSZWplY3Rpb25EaWZmIiwidDAiLCIkIiwiX2MiLCJ0MSIsImxvYWRSZWplY3Rpb25EaWZmIiwiZGF0YVByb21pc2UiLCJ0MiIsInQzIiwidDQiLCJFZGl0UmVqZWN0aW9uQm9keSIsInByb21pc2UiLCJQcm9taXNlIiwiY3R4IiwidHJ1bmNhdGVkIiwiY29udGVudCIsImZpbGVDb250ZW50cyIsImFjdHVhbE9sZCIsImFjdHVhbE5ldyIsImxpbmVPZmZzZXQiLCJlIiwiRXJyb3IiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUb29sUmVzdWx0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgdHlwZSB7IFN0cnVjdHVyZWRQYXRjaEh1bmsgfSBmcm9tICdkaWZmJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBTdXNwZW5zZSwgdXNlLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgRmlsZUVkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvRmlsZUVkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRhZyB9IGZyb20gJ3NyYy91dGlscy9tZXNzYWdlcy5qcydcbmltcG9ydCB7IEZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvRmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgRmlsZUVkaXRUb29sVXBkYXRlZE1lc3NhZ2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0ZpbGVFZGl0VG9vbFVwZGF0ZWRNZXNzYWdlLmpzJ1xuaW1wb3J0IHsgRmlsZVBhdGhMaW5rIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9GaWxlUGF0aExpbmsuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBUb29scyB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IE1lc3NhZ2UsIFByb2dyZXNzTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgeyBhZGp1c3RIdW5rTGluZU51bWJlcnMsIENPTlRFWFRfTElORVMgfSBmcm9tICcuLi8uLi91dGlscy9kaWZmLmpzJ1xuaW1wb3J0IHsgRklMRV9OT1RfRk9VTkRfQ1dEX05PVEUsIGdldERpc3BsYXlQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7IGxvZ0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvbG9nLmpzJ1xuaW1wb3J0IHsgZ2V0UGxhbnNEaXJlY3RvcnkgfSBmcm9tICcuLi8uLi91dGlscy9wbGFucy5qcydcbmltcG9ydCB7IHJlYWRFZGl0Q29udGV4dCB9IGZyb20gJy4uLy4uL3V0aWxzL3JlYWRFZGl0Q29udGV4dC5qcydcbmltcG9ydCB7IGZpcnN0TGluZU9mIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lTmFtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBGaWxlRWRpdE91dHB1dCB9IGZyb20gJy4vdHlwZXMuanMnXG5pbXBvcnQge1xuICBmaW5kQWN0dWFsU3RyaW5nLFxuICBnZXRQYXRjaEZvckVkaXQsXG4gIHByZXNlcnZlUXVvdGVTdHlsZSxcbn0gZnJvbSAnLi91dGlscy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHVzZXJGYWNpbmdOYW1lKFxuICBpbnB1dDpcbiAgICB8IFBhcnRpYWw8e1xuICAgICAgICBmaWxlX3BhdGg6IHN0cmluZ1xuICAgICAgICBvbGRfc3RyaW5nOiBzdHJpbmdcbiAgICAgICAgbmV3X3N0cmluZzogc3RyaW5nXG4gICAgICAgIHJlcGxhY2VfYWxsOiBib29sZWFuXG4gICAgICAgIGVkaXRzOiB1bmtub3duW11cbiAgICAgIH0+XG4gICAgfCB1bmRlZmluZWQsXG4pOiBzdHJpbmcge1xuICBpZiAoIWlucHV0KSB7XG4gICAgcmV0dXJuICdVcGRhdGUnXG4gIH1cbiAgaWYgKGlucHV0LmZpbGVfcGF0aD8uc3RhcnRzV2l0aChnZXRQbGFuc0RpcmVjdG9yeSgpKSkge1xuICAgIHJldHVybiAnVXBkYXRlZCBwbGFuJ1xuICB9XG4gIC8vIEhhc2hsaW5lIGVkaXRzIGFsd2F5cyBtb2RpZnkgYW4gZXhpc3RpbmcgZmlsZSAobGluZS1yZWYgYmFzZWQpXG4gIGlmIChpbnB1dC5lZGl0cyAhPSBudWxsKSB7XG4gICAgcmV0dXJuICdVcGRhdGUnXG4gIH1cbiAgaWYgKGlucHV0Lm9sZF9zdHJpbmcgPT09ICcnKSB7XG4gICAgcmV0dXJuICdDcmVhdGUnXG4gIH1cbiAgcmV0dXJuICdVcGRhdGUnXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb29sVXNlU3VtbWFyeShcbiAgaW5wdXQ6XG4gICAgfCBQYXJ0aWFsPHtcbiAgICAgICAgZmlsZV9wYXRoOiBzdHJpbmdcbiAgICAgICAgb2xkX3N0cmluZzogc3RyaW5nXG4gICAgICAgIG5ld19zdHJpbmc6IHN0cmluZ1xuICAgICAgICByZXBsYWNlX2FsbDogYm9vbGVhblxuICAgICAgfT5cbiAgICB8IHVuZGVmaW5lZCxcbik6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIWlucHV0Py5maWxlX3BhdGgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBnZXREaXNwbGF5UGF0aChpbnB1dC5maWxlX3BhdGgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlTWVzc2FnZShcbiAgeyBmaWxlX3BhdGggfTogeyBmaWxlX3BhdGg/OiBzdHJpbmcgfSxcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFmaWxlX3BhdGgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIC8vIEZvciBwbGFuIGZpbGVzLCBwYXRoIGlzIGFscmVhZHkgaW4gdXNlckZhY2luZ05hbWVcbiAgaWYgKGZpbGVfcGF0aC5zdGFydHNXaXRoKGdldFBsYW5zRGlyZWN0b3J5KCkpKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgcmV0dXJuIChcbiAgICA8RmlsZVBhdGhMaW5rIGZpbGVQYXRoPXtmaWxlX3BhdGh9PlxuICAgICAge3ZlcmJvc2UgPyBmaWxlX3BhdGggOiBnZXREaXNwbGF5UGF0aChmaWxlX3BhdGgpfVxuICAgIDwvRmlsZVBhdGhMaW5rPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShcbiAgeyBmaWxlUGF0aCwgc3RydWN0dXJlZFBhdGNoLCBvcmlnaW5hbEZpbGUgfTogRmlsZUVkaXRPdXRwdXQsXG4gIF9wcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZTogUHJvZ3Jlc3NNZXNzYWdlW10sXG4gIHsgc3R5bGUsIHZlcmJvc2UgfTogeyBzdHlsZT86ICdjb25kZW5zZWQnOyB2ZXJib3NlOiBib29sZWFuIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBGb3IgcGxhbiBmaWxlcywgc2hvdyAvcGxhbiBoaW50IGFib3ZlIHRoZSBkaWZmXG4gIGNvbnN0IGlzUGxhbkZpbGUgPSBmaWxlUGF0aC5zdGFydHNXaXRoKGdldFBsYW5zRGlyZWN0b3J5KCkpXG5cbiAgcmV0dXJuIChcbiAgICA8RmlsZUVkaXRUb29sVXBkYXRlZE1lc3NhZ2VcbiAgICAgIGZpbGVQYXRoPXtmaWxlUGF0aH1cbiAgICAgIHN0cnVjdHVyZWRQYXRjaD17c3RydWN0dXJlZFBhdGNofVxuICAgICAgZmlyc3RMaW5lPXtvcmlnaW5hbEZpbGUuc3BsaXQoJ1xcbicpWzBdID8/IG51bGx9XG4gICAgICBmaWxlQ29udGVudD17b3JpZ2luYWxGaWxlfVxuICAgICAgc3R5bGU9e3N0eWxlfVxuICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAgIHByZXZpZXdIaW50PXtpc1BsYW5GaWxlID8gJy9wbGFuIHRvIHByZXZpZXcnIDogdW5kZWZpbmVkfVxuICAgIC8+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VSZWplY3RlZE1lc3NhZ2UoXG4gIGlucHV0OiB7XG4gICAgZmlsZV9wYXRoOiBzdHJpbmdcbiAgICBvbGRfc3RyaW5nPzogc3RyaW5nXG4gICAgbmV3X3N0cmluZz86IHN0cmluZ1xuICAgIHJlcGxhY2VfYWxsPzogYm9vbGVhblxuICAgIGVkaXRzPzogdW5rbm93bltdXG4gIH0sXG4gIG9wdGlvbnM6IHtcbiAgICBjb2x1bW5zOiBudW1iZXJcbiAgICBtZXNzYWdlczogTWVzc2FnZVtdXG4gICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IFByb2dyZXNzTWVzc2FnZVtdXG4gICAgc3R5bGU/OiAnY29uZGVuc2VkJ1xuICAgIHRoZW1lOiBUaGVtZU5hbWVcbiAgICB0b29sczogVG9vbHNcbiAgICB2ZXJib3NlOiBib29sZWFuXG4gIH0sXG4pOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCB7IHN0eWxlLCB2ZXJib3NlIH0gPSBvcHRpb25zXG4gIGNvbnN0IGZpbGVQYXRoID0gaW5wdXQuZmlsZV9wYXRoXG4gIGNvbnN0IG9sZFN0cmluZyA9IGlucHV0Lm9sZF9zdHJpbmcgPz8gJydcbiAgY29uc3QgbmV3U3RyaW5nID0gaW5wdXQubmV3X3N0cmluZyA/PyAnJ1xuICBjb25zdCByZXBsYWNlQWxsID0gaW5wdXQucmVwbGFjZV9hbGwgPz8gZmFsc2VcblxuICAvLyBEZWZlbnNpdmU6IGlmIGlucHV0IGhhcyBhbiB1bmV4cGVjdGVkIHNoYXBlLCBzaG93IGEgc2ltcGxlIHJlamVjdGlvbiBtZXNzYWdlXG4gIGlmICgnZWRpdHMnIGluIGlucHV0ICYmIGlucHV0LmVkaXRzICE9IG51bGwpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEZpbGVFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZVxuICAgICAgICBmaWxlX3BhdGg9e2ZpbGVQYXRofVxuICAgICAgICBvcGVyYXRpb249XCJ1cGRhdGVcIlxuICAgICAgICBmaXJzdExpbmU9e251bGx9XG4gICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IGlzTmV3RmlsZSA9IG9sZFN0cmluZyA9PT0gJydcblxuICAvLyBGb3IgbmV3IGZpbGUgY3JlYXRpb24sIHNob3cgY29udGVudCBwcmV2aWV3IGluc3RlYWQgb2YgZGlmZlxuICBpZiAoaXNOZXdGaWxlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxGaWxlRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2VcbiAgICAgICAgZmlsZV9wYXRoPXtmaWxlUGF0aH1cbiAgICAgICAgb3BlcmF0aW9uPVwid3JpdGVcIlxuICAgICAgICBjb250ZW50PXtuZXdTdHJpbmd9XG4gICAgICAgIGZpcnN0TGluZT17Zmlyc3RMaW5lT2YobmV3U3RyaW5nKX1cbiAgICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAgIC8+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8RWRpdFJlamVjdGlvbkRpZmZcbiAgICAgIGZpbGVQYXRoPXtmaWxlUGF0aH1cbiAgICAgIG9sZFN0cmluZz17b2xkU3RyaW5nfVxuICAgICAgbmV3U3RyaW5nPXtuZXdTdHJpbmd9XG4gICAgICByZXBsYWNlQWxsPXtyZXBsYWNlQWxsfVxuICAgICAgc3R5bGU9e3N0eWxlfVxuICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAvPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlRXJyb3JNZXNzYWdlKFxuICByZXN1bHQ6IFRvb2xSZXN1bHRCbG9ja1BhcmFtWydjb250ZW50J10sXG4gIG9wdGlvbnM6IHtcbiAgICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZTogUHJvZ3Jlc3NNZXNzYWdlW11cbiAgICB0b29sczogVG9vbHNcbiAgICB2ZXJib3NlOiBib29sZWFuXG4gIH0sXG4pOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCB7IHZlcmJvc2UgfSA9IG9wdGlvbnNcbiAgaWYgKFxuICAgICF2ZXJib3NlICYmXG4gICAgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycgJiZcbiAgICBleHRyYWN0VGFnKHJlc3VsdCwgJ3Rvb2xfdXNlX2Vycm9yJylcbiAgKSB7XG4gICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXh0cmFjdFRhZyhyZXN1bHQsICd0b29sX3VzZV9lcnJvcicpXG4gICAgLy8gU2hvdyBhIGxlc3Mgc2NhcnkgbWVzc2FnZSBmb3IgaW50ZW5kZWQgYmVoYXZpb3JcbiAgICBpZiAoZXJyb3JNZXNzYWdlPy5pbmNsdWRlcygnRmlsZSBoYXMgbm90IGJlZW4gcmVhZCB5ZXQnKSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5GaWxlIG11c3QgYmUgcmVhZCBmaXJzdDwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICAgIGlmIChlcnJvck1lc3NhZ2U/LmluY2x1ZGVzKEZJTEVfTk9UX0ZPVU5EX0NXRF9OT1RFKSkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+RmlsZSBub3QgZm91bmQ8L1RleHQ+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPkVycm9yIGVkaXRpbmcgZmlsZTwvVGV4dD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuICByZXR1cm4gPEZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSByZXN1bHQ9e3Jlc3VsdH0gdmVyYm9zZT17dmVyYm9zZX0gLz5cbn1cblxudHlwZSBSZWplY3Rpb25EaWZmRGF0YSA9IHtcbiAgcGF0Y2g6IFN0cnVjdHVyZWRQYXRjaEh1bmtbXVxuICBmaXJzdExpbmU6IHN0cmluZyB8IG51bGxcbiAgZmlsZUNvbnRlbnQ6IHN0cmluZyB8IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBFZGl0UmVqZWN0aW9uRGlmZih7XG4gIGZpbGVQYXRoLFxuICBvbGRTdHJpbmcsXG4gIG5ld1N0cmluZyxcbiAgcmVwbGFjZUFsbCxcbiAgc3R5bGUsXG4gIHZlcmJvc2UsXG59OiB7XG4gIGZpbGVQYXRoOiBzdHJpbmdcbiAgb2xkU3RyaW5nOiBzdHJpbmdcbiAgbmV3U3RyaW5nOiBzdHJpbmdcbiAgcmVwbGFjZUFsbDogYm9vbGVhblxuICBzdHlsZT86ICdjb25kZW5zZWQnXG4gIHZlcmJvc2U6IGJvb2xlYW5cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbZGF0YVByb21pc2VdID0gdXNlU3RhdGUoKCkgPT5cbiAgICBsb2FkUmVqZWN0aW9uRGlmZihmaWxlUGF0aCwgb2xkU3RyaW5nLCBuZXdTdHJpbmcsIHJlcGxhY2VBbGwpLFxuICApXG4gIHJldHVybiAoXG4gICAgPFN1c3BlbnNlXG4gICAgICBmYWxsYmFjaz17XG4gICAgICAgIDxGaWxlRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2VcbiAgICAgICAgICBmaWxlX3BhdGg9e2ZpbGVQYXRofVxuICAgICAgICAgIG9wZXJhdGlvbj1cInVwZGF0ZVwiXG4gICAgICAgICAgZmlyc3RMaW5lPXtudWxsfVxuICAgICAgICAgIHZlcmJvc2U9e3ZlcmJvc2V9XG4gICAgICAgIC8+XG4gICAgICB9XG4gICAgPlxuICAgICAgPEVkaXRSZWplY3Rpb25Cb2R5XG4gICAgICAgIHByb21pc2U9e2RhdGFQcm9taXNlfVxuICAgICAgICBmaWxlUGF0aD17ZmlsZVBhdGh9XG4gICAgICAgIHN0eWxlPXtzdHlsZX1cbiAgICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAgIC8+XG4gICAgPC9TdXNwZW5zZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBFZGl0UmVqZWN0aW9uQm9keSh7XG4gIHByb21pc2UsXG4gIGZpbGVQYXRoLFxuICBzdHlsZSxcbiAgdmVyYm9zZSxcbn06IHtcbiAgcHJvbWlzZTogUHJvbWlzZTxSZWplY3Rpb25EaWZmRGF0YT5cbiAgZmlsZVBhdGg6IHN0cmluZ1xuICBzdHlsZT86ICdjb25kZW5zZWQnXG4gIHZlcmJvc2U6IGJvb2xlYW5cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IHBhdGNoLCBmaXJzdExpbmUsIGZpbGVDb250ZW50IH0gPSB1c2UocHJvbWlzZSlcbiAgcmV0dXJuIChcbiAgICA8RmlsZUVkaXRUb29sVXNlUmVqZWN0ZWRNZXNzYWdlXG4gICAgICBmaWxlX3BhdGg9e2ZpbGVQYXRofVxuICAgICAgb3BlcmF0aW9uPVwidXBkYXRlXCJcbiAgICAgIHBhdGNoPXtwYXRjaH1cbiAgICAgIGZpcnN0TGluZT17Zmlyc3RMaW5lfVxuICAgICAgZmlsZUNvbnRlbnQ9e2ZpbGVDb250ZW50fVxuICAgICAgc3R5bGU9e3N0eWxlfVxuICAgICAgdmVyYm9zZT17dmVyYm9zZX1cbiAgICAvPlxuICApXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRSZWplY3Rpb25EaWZmKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBvbGRTdHJpbmc6IHN0cmluZyxcbiAgbmV3U3RyaW5nOiBzdHJpbmcsXG4gIHJlcGxhY2VBbGw6IGJvb2xlYW4sXG4pOiBQcm9taXNlPFJlamVjdGlvbkRpZmZEYXRhPiB7XG4gIHRyeSB7XG4gICAgLy8gQ2h1bmtlZCByZWFkIOKAlCBjb250ZXh0IHdpbmRvdyBhcm91bmQgdGhlIGZpcnN0IG9jY3VycmVuY2UuIHJlcGxhY2VBbGxcbiAgICAvLyBzdGlsbCBzaG93cyBtYXRjaGVzICp3aXRoaW4qIHRoZSB3aW5kb3cgdmlhIGdldFBhdGNoRm9yRWRpdDsgd2UgYWNjZXB0XG4gICAgLy8gbG9zaW5nIHRoZSBhbGwtb2NjdXJyZW5jZXMgdmlldyB0byBrZWVwIHRoZSByZWFkIGJvdW5kZWQuXG4gICAgY29uc3QgY3R4ID0gYXdhaXQgcmVhZEVkaXRDb250ZXh0KGZpbGVQYXRoLCBvbGRTdHJpbmcsIENPTlRFWFRfTElORVMpXG4gICAgaWYgKGN0eCA9PT0gbnVsbCB8fCBjdHgudHJ1bmNhdGVkIHx8IGN0eC5jb250ZW50ID09PSAnJykge1xuICAgICAgLy8gRU5PRU5UIC8gbm90IGZvdW5kIC8gdHJ1bmNhdGVkIOKAlCBkaWZmIGp1c3QgdGhlIHRvb2wgaW5wdXRzLlxuICAgICAgY29uc3QgeyBwYXRjaCB9ID0gZ2V0UGF0Y2hGb3JFZGl0KHtcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIGZpbGVDb250ZW50czogb2xkU3RyaW5nLFxuICAgICAgICBvbGRTdHJpbmcsXG4gICAgICAgIG5ld1N0cmluZyxcbiAgICAgIH0pXG4gICAgICByZXR1cm4geyBwYXRjaCwgZmlyc3RMaW5lOiBudWxsLCBmaWxlQ29udGVudDogdW5kZWZpbmVkIH1cbiAgICB9XG4gICAgY29uc3QgYWN0dWFsT2xkID0gZmluZEFjdHVhbFN0cmluZyhjdHguY29udGVudCwgb2xkU3RyaW5nKSB8fCBvbGRTdHJpbmdcbiAgICBjb25zdCBhY3R1YWxOZXcgPSBwcmVzZXJ2ZVF1b3RlU3R5bGUob2xkU3RyaW5nLCBhY3R1YWxPbGQsIG5ld1N0cmluZylcbiAgICBjb25zdCB7IHBhdGNoIH0gPSBnZXRQYXRjaEZvckVkaXQoe1xuICAgICAgZmlsZVBhdGgsXG4gICAgICBmaWxlQ29udGVudHM6IGN0eC5jb250ZW50LFxuICAgICAgb2xkU3RyaW5nOiBhY3R1YWxPbGQsXG4gICAgICBuZXdTdHJpbmc6IGFjdHVhbE5ldyxcbiAgICAgIHJlcGxhY2VBbGwsXG4gICAgfSlcbiAgICByZXR1cm4ge1xuICAgICAgcGF0Y2g6IGFkanVzdEh1bmtMaW5lTnVtYmVycyhwYXRjaCwgY3R4LmxpbmVPZmZzZXQgLSAxKSxcbiAgICAgIGZpcnN0TGluZTogY3R4LmxpbmVPZmZzZXQgPT09IDEgPyBmaXJzdExpbmVPZihjdHguY29udGVudCkgOiBudWxsLFxuICAgICAgZmlsZUNvbnRlbnQ6IGN0eC5jb250ZW50LFxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFVzZXIgbWF5IGhhdmUgbWFudWFsbHkgYXBwbGllZCB0aGUgY2hhbmdlIHdoaWxlIHRoZSBkaWZmIHdhcyBzaG93bi5cbiAgICBsb2dFcnJvcihlIGFzIEVycm9yKVxuICAgIHJldHVybiB7IHBhdGNoOiBbXSwgZmlyc3RMaW5lOiBudWxsLCBmaWxlQ29udGVudDogdW5kZWZpbmVkIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0Esb0JBQW9CLFFBQVEsdUNBQXVDO0FBQ2pGLGNBQWNDLG1CQUFtQixRQUFRLE1BQU07QUFDL0MsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxRQUFRLEVBQUVDLEdBQUcsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDL0MsU0FBU0MsOEJBQThCLFFBQVEsa0RBQWtEO0FBQ2pHLFNBQVNDLGVBQWUsUUFBUSxtQ0FBbUM7QUFDbkUsU0FBU0MsVUFBVSxRQUFRLHVCQUF1QjtBQUNsRCxTQUFTQywyQkFBMkIsUUFBUSxpREFBaUQ7QUFDN0YsU0FBU0MsMEJBQTBCLFFBQVEsZ0RBQWdEO0FBQzNGLFNBQVNDLFlBQVksUUFBUSxrQ0FBa0M7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QUFDLENBQUM7RUFDNUIsSUFBSTtJQUNGO0lBQ0E7SUFDQTtJQUNBLE1BQU1pQixHQUFHLEdBQUcsTUFBTTlELGVBQWUsQ0FBQ3FCLFFBQVEsRUFBRWdCLFNBQVMsRUFBRTFDLGFBQWEsQ0FBQztJQUNyRSxJQUFJbUUsR0FBRyxLQUFLLElBQUksSUFBSUEsR0FBRyxDQUFDQyxTQUFTLElBQUlELEdBQUcsQ0FBQ0UsT0FBTyxLQUFLLEVBQUUsRUFBRTtNQUN2RDtNQUNBLE1BQU07UUFBRWxCO01BQU0sQ0FBQyxHQUFHekMsZUFBZSxDQUFDO1FBQ2hDZ0IsUUFBUTtRQUNSNEMsWUFBWSxFQUFFNUIsU0FBUztRQUN2QkEsU0FBUztRQUNUQztNQUNGLENBQUMsQ0FBQztNQUNGLE9BQU87UUFBRVEsS0FBSztRQUFFQyxTQUFTLEVBQUUsSUFBSTtRQUFFQyxXQUFXLEVBQUVwQjtNQUFVLENBQUM7SUFDM0Q7SUFDQSxNQUFNc0MsU0FBUyxHQUFHOUQsZ0JBQWdCLENBQUMwRCxHQUFHLENBQUNFLE9BQU8sRUFBRTNCLFNBQVMsQ0FBQyxJQUFJQSxTQUFTO0lBQ3ZFLE1BQU04QixTQUFTLEdBQUc3RCxrQkFBa0IsQ0FBQytCLFNBQVMsRUFBRTZCLFNBQVMsRUFBRTVCLFNBQVMsQ0FBQztJQUNyRSxNQUFNO01BQUVRO0lBQU0sQ0FBQyxHQUFHekMsZUFBZSxDQUFDO01BQ2hDZ0IsUUFBUTtNQUNSNEMsWUFBWSxFQUFFSCxHQUFHLENBQUNFLE9BQU87TUFDekIzQixTQUFTLEVBQUU2QixTQUFTO01BQ3BCNUIsU0FBUyxFQUFFNkIsU0FBUztNQUNwQjVCO0lBQ0YsQ0FBQyxDQUFDO0lBQ0YsT0FBTztNQUNMTyxLQUFLLEVBQUVwRCxxQkFBcUIsQ0FBQ29ELEtBQUssRUFBRWdCLEdBQUcsQ0FBQ00sVUFBVSxHQUFHLENBQUMsQ0FBQztNQUN2RHJCLFNBQVMsRUFBRWUsR0FBRyxDQUFDTSxVQUFVLEtBQUssQ0FBQyxHQUFHbkUsV0FBVyxDQUFDNkQsR0FBRyxDQUFDRSxPQUFPLENBQUMsR0FBRyxJQUFJO01BQ2pFaEIsV0FBVyxFQUFFYyxHQUFHLENBQUNFO0lBQ25CLENBQUM7RUFDSCxDQUFDLENBQUMsT0FBT0ssQ0FBQyxFQUFFO0lBQ1Y7SUFDQXZFLFFBQVEsQ0FBQ3VFLENBQUMsSUFBSUMsS0FBSyxDQUFDO0lBQ3BCLE9BQU87TUFBRXhCLEtBQUssRUFBRSxFQUFFO01BQUVDLFNBQVMsRUFBRSxJQUFJO01BQUVDLFdBQVcsRUFBRXBCO0lBQVUsQ0FBQztFQUMvRDtBQUNGIiwiaWdub3JlTGlzdCI6W119