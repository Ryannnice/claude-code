// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 extractTag 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { extractTag } from 'src/utils/messages.js';
// 复用 FallbackToolUseErrorMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
// 复用 FilePathLink 终端界面组件，避免在这里重复拼装显示逻辑。
import { FilePathLink } from '../../components/FilePathLink.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 FILE_NOT_FOUND_CWD_NOTE、getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { FILE_NOT_FOUND_CWD_NOTE, getDisplayPath } from '../../utils/file.js';
// 复用 formatFileSize 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatFileSize } from '../../utils/format.js';
// 复用 getPlansDirectory 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlansDirectory } from '../../utils/plans.js';
// 复用 getTaskOutputDir 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { getTaskOutputDir } from '../../utils/task/diskOutput.js';
// 类型依赖 { Input, Output } 来自 ./FileReadTool.js，用于校准工具调用的数据契约。
import type { Input, Output } from './FileReadTool.js';

/**
 * Check if a file path is an agent output file and extract the task ID.
 * Agent output files follow the pattern: {projectTempDir}/tasks/{taskId}.output
 */
// getAgentOutputTaskId 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAgentOutputTaskId(filePath: string): string | null {
  // prefix读取`getTaskOutputDir`，供工具调用后续处理使用。
  const prefix = `${getTaskOutputDir()}/`;
  // suffix保存`'.output'`，作为后续固定文本处理的输入。
  const suffix = '.output';
  // 只有 `filePath.startsWith(prefix) && filePath.endsWith(suffix)` 满足时，工具调用才执行该分支。
  if (filePath.startsWith(prefix) && filePath.endsWith(suffix)) {
    // taskId格式化`filePath.slice`，供工具调用后续处理使用。
    const taskId = filePath.slice(prefix.length, -suffix.length);
    // Validate it looks like a task ID (alphanumeric, reasonable length)
    // 只有 `taskId.length > 0 && taskId.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(taskId)` 满足时，工具调用才执行该分支。
    if (taskId.length > 0 && taskId.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(taskId)) {
      // 返回 `taskId`，作为工具调用这次计算的结果。
      return taskId;
    }
  }
  // 返回 `null`，作为工具调用这次计算的结果。
  return null;
}
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage({
  file_path,
  offset,
  limit,
  pages
}: Partial<Input>, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // file_path 路径数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!file_path) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }

  // For agent output files, return empty string so no parentheses are shown
  // The task ID is displayed separately by AssistantToolUseMessage
  // 满足 `getAgentOutputTaskId(file_path)` 时，工具调用执行该分支。
  if (getAgentOutputTaskId(file_path)) {
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return '';
  }
  // displayPath 路径数据读取`getDisplayPath`，供工具调用后续处理使用。
  const displayPath = verbose ? file_path : getDisplayPath(file_path);
  // 满足 `pages` 时，工具调用执行该分支。
  if (pages) {
    // 返回 `<>`，作为工具调用这次计算的结果。
    return <>
        <FilePathLink filePath={file_path}>{displayPath}</FilePathLink>
        {` · pages ${pages}`}
      </>;
  }
  // 只有 `verbose && (offset || limit)` 满足时，工具调用才执行该分支。
  if (verbose && (offset || limit)) {
    // startLine保存`offset ?? 1`，供工具实现 UI后续判断或输出使用。
    const startLine = offset ?? 1;
    // lineRange保存`limit ? `lines ${startLine}-${startLine + limit - 1}` : `...`，供后续判断或组装使用。
    const lineRange = limit ? `lines ${startLine}-${startLine + limit - 1}` : `from line ${startLine}`;
    // 返回 `<>`，作为工具调用这次计算的结果。
    return <>
        <FilePathLink filePath={file_path}>{displayPath}</FilePathLink>
        {` · ${lineRange}`}
      </>;
  }
  // 返回 `<FilePathLink filePath={file_path}>{displayPath}</FilePathLink>`，作为工具调用这次计算的结果。
  return <FilePathLink filePath={file_path}>{displayPath}</FilePathLink>;
}
// renderToolUseTag 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseTag({
  file_path
}: Partial<Input>): React.ReactNode {
  // agentTaskId读取`getAgentOutputTaskId`，供工具调用后续处理使用。
  const agentTaskId = file_path ? getAgentOutputTaskId(file_path) : null;

  // Show agent task ID for Read tool when reading agent output
  // agentTaskId缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!agentTaskId) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 返回 `<Text dimColor> {agentTaskId}</Text>`，作为工具调用这次计算的结果。
  return <Text dimColor> {agentTaskId}</Text>;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(output: Output): React.ReactNode {
  // TODO: Render recursively
  // 按照 output.type 的取值选择工具调用的具体处理分支。
  switch (output.type) {
    case 'image':
      {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          originalSize
        } = output.file;
        // formattedSize格式化`formatFileSize`，供工具调用后续处理使用。
        const formattedSize = formatFileSize(originalSize);
        // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
        return <MessageResponse height={1}>
          <Text>Read image ({formattedSize})</Text>
        </MessageResponse>;
      }
    case 'notebook':
      {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          cells
        } = output.file;
        // 只有 `!cells || cells.length < 1` 满足时，工具调用才执行该分支。
        if (!cells || cells.length < 1) {
          // 返回 `<Text color="error">No cells found in notebook</Text>`，作为工具调用这次计算的结果。
          return <Text color="error">No cells found in notebook</Text>;
        }
        // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
        return <MessageResponse height={1}>
          <Text>
            Read <Text bold>{cells.length}</Text> cells
          </Text>
        </MessageResponse>;
      }
    case 'pdf':
      {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          originalSize
        } = output.file;
        // formattedSize格式化`formatFileSize`，供工具调用后续处理使用。
        const formattedSize = formatFileSize(originalSize);
        // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
        return <MessageResponse height={1}>
          <Text>Read PDF ({formattedSize})</Text>
        </MessageResponse>;
      }
    case 'parts':
      {
        // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
        return <MessageResponse height={1}>
          <Text>
            Read <Text bold>{output.file.count}</Text>{' '}
            {output.file.count === 1 ? 'page' : 'pages'} (
            {formatFileSize(output.file.originalSize)})
          </Text>
        </MessageResponse>;
      }
    case 'text':
      {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          numLines
        } = output.file;
        // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
        return <MessageResponse height={1}>
          <Text>
            Read <Text bold>{numLines}</Text>{' '}
            {numLines === 1 ? 'line' : 'lines'}
          </Text>
        </MessageResponse>;
      }
    case 'file_unchanged':
      {
        // 返回 `<MessageResponse height={1}>`，作为工具调用这次计算的结果。
        return <MessageResponse height={1}>
          <Text dimColor>Unchanged since last read</Text>
        </MessageResponse>;
      }
  }
}
// renderToolUseErrorMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseErrorMessage(result: ToolResultBlockParam['content'], {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 当 `!verbose && typeof result` 匹配 `'string'` 时，工具调用执行对应分支。
  if (!verbose && typeof result === 'string') {
    // FileReadTool throws from call() so errors lack <tool_use_error> wrapping —
    // check the raw string directly for the cwd note marker.
    // 满足 `result.includes(FILE_NOT_FOUND_CWD_NOTE)` 时，工具调用执行该分支。
    if (result.includes(FILE_NOT_FOUND_CWD_NOTE)) {
      // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
      return <MessageResponse>
          <Text color="error">File not found</Text>
        </MessageResponse>;
    }
    // 满足 `extractTag(result, 'tool_use_error')` 时，工具调用执行该分支。
    if (extractTag(result, 'tool_use_error')) {
      // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
      return <MessageResponse>
          <Text color="error">Error reading file</Text>
        </MessageResponse>;
    }
  }
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
// userFacingName 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function userFacingName(input: Partial<Input> | undefined): string {
  // 满足 `input?.file_path?.startsWith(getPlansDirectory())` 时，工具调用执行该分支。
  if (input?.file_path?.startsWith(getPlansDirectory())) {
    // 返回 `'Reading Plan'`，作为工具调用这次计算的结果。
    return 'Reading Plan';
  }
  // 只有 `input?.file_path && getAgentOutputTaskId(input.file_path)` 满足时，工具调用才执行该分支。
  if (input?.file_path && getAgentOutputTaskId(input.file_path)) {
    // 返回 `'Read agent output'`，作为工具调用这次计算的结果。
    return 'Read agent output';
  }
  // 返回 `'Read'`，作为工具调用这次计算的结果。
  return 'Read';
}
// getToolUseSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseSummary(input: Partial<Input> | undefined): string | null {
  // 满足 `!input?.file_path` 时，工具调用执行该分支。
  if (!input?.file_path) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // For agent output files, just show the task ID
  // agentTaskId读取`getAgentOutputTaskId`，供工具调用后续处理使用。
  const agentTaskId = getAgentOutputTaskId(input.file_path);
  // 满足 `agentTaskId` 时，工具调用执行该分支。
  if (agentTaskId) {
    // 返回 `agentTaskId`，作为工具调用这次计算的结果。
    return agentTaskId;
  }
  // 返回 `getDisplayPath(input.file_path)`，作为工具调用这次计算的结果。
  return getDisplayPath(input.file_path);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0IiwiZXh0cmFjdFRhZyIsIkZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZSIsIkZpbGVQYXRoTGluayIsIk1lc3NhZ2VSZXNwb25zZSIsIlRleHQiLCJGSUxFX05PVF9GT1VORF9DV0RfTk9URSIsImdldERpc3BsYXlQYXRoIiwiZm9ybWF0RmlsZVNpemUiLCJnZXRQbGFuc0RpcmVjdG9yeSIsImdldFRhc2tPdXRwdXREaXIiLCJJbnB1dCIsIk91dHB1dCIsImdldEFnZW50T3V0cHV0VGFza0lkIiwiZmlsZVBhdGgiLCJwcmVmaXgiLCJzdWZmaXgiLCJzdGFydHNXaXRoIiwiZW5kc1dpdGgiLCJ0YXNrSWQiLCJzbGljZSIsImxlbmd0aCIsInRlc3QiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsImZpbGVfcGF0aCIsIm9mZnNldCIsImxpbWl0IiwicGFnZXMiLCJQYXJ0aWFsIiwidmVyYm9zZSIsIlJlYWN0Tm9kZSIsImRpc3BsYXlQYXRoIiwic3RhcnRMaW5lIiwibGluZVJhbmdlIiwicmVuZGVyVG9vbFVzZVRhZyIsImFnZW50VGFza0lkIiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJvdXRwdXQiLCJ0eXBlIiwib3JpZ2luYWxTaXplIiwiZmlsZSIsImZvcm1hdHRlZFNpemUiLCJjZWxscyIsImNvdW50IiwibnVtTGluZXMiLCJyZW5kZXJUb29sVXNlRXJyb3JNZXNzYWdlIiwicmVzdWx0IiwiaW5jbHVkZXMiLCJ1c2VyRmFjaW5nTmFtZSIsImlucHV0IiwiZ2V0VG9vbFVzZVN1bW1hcnkiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUb29sUmVzdWx0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGV4dHJhY3RUYWcgfSBmcm9tICdzcmMvdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0ZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZS5qcydcbmltcG9ydCB7IEZpbGVQYXRoTGluayB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvRmlsZVBhdGhMaW5rLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgRklMRV9OT1RfRk9VTkRfQ1dEX05PVEUsIGdldERpc3BsYXlQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7IGZvcm1hdEZpbGVTaXplIH0gZnJvbSAnLi4vLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgZ2V0UGxhbnNEaXJlY3RvcnkgfSBmcm9tICcuLi8uLi91dGlscy9wbGFucy5qcydcbmltcG9ydCB7IGdldFRhc2tPdXRwdXREaXIgfSBmcm9tICcuLi8uLi91dGlscy90YXNrL2Rpc2tPdXRwdXQuanMnXG5pbXBvcnQgdHlwZSB7IElucHV0LCBPdXRwdXQgfSBmcm9tICcuL0ZpbGVSZWFkVG9vbC5qcydcblxuLyoqXG4gKiBDaGVjayBpZiBhIGZpbGUgcGF0aCBpcyBhbiBhZ2VudCBvdXRwdXQgZmlsZSBhbmQgZXh0cmFjdCB0aGUgdGFzayBJRC5cbiAqIEFnZW50IG91dHB1dCBmaWxlcyBmb2xsb3cgdGhlIHBhdHRlcm46IHtwcm9qZWN0VGVtcERpcn0vdGFza3Mve3Rhc2tJZH0ub3V0cHV0XG4gKi9cbmZ1bmN0aW9uIGdldEFnZW50T3V0cHV0VGFza0lkKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgcHJlZml4ID0gYCR7Z2V0VGFza091dHB1dERpcigpfS9gXG4gIGNvbnN0IHN1ZmZpeCA9ICcub3V0cHV0J1xuICBpZiAoZmlsZVBhdGguc3RhcnRzV2l0aChwcmVmaXgpICYmIGZpbGVQYXRoLmVuZHNXaXRoKHN1ZmZpeCkpIHtcbiAgICBjb25zdCB0YXNrSWQgPSBmaWxlUGF0aC5zbGljZShwcmVmaXgubGVuZ3RoLCAtc3VmZml4Lmxlbmd0aClcbiAgICAvLyBWYWxpZGF0ZSBpdCBsb29rcyBsaWtlIGEgdGFzayBJRCAoYWxwaGFudW1lcmljLCByZWFzb25hYmxlIGxlbmd0aClcbiAgICBpZiAoXG4gICAgICB0YXNrSWQubGVuZ3RoID4gMCAmJlxuICAgICAgdGFza0lkLmxlbmd0aCA8PSAyMCAmJlxuICAgICAgL15bYS16QS1aMC05Xy1dKyQvLnRlc3QodGFza0lkKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRhc2tJZFxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZU1lc3NhZ2UoXG4gIHsgZmlsZV9wYXRoLCBvZmZzZXQsIGxpbWl0LCBwYWdlcyB9OiBQYXJ0aWFsPElucHV0PixcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCFmaWxlX3BhdGgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgLy8gRm9yIGFnZW50IG91dHB1dCBmaWxlcywgcmV0dXJuIGVtcHR5IHN0cmluZyBzbyBubyBwYXJlbnRoZXNlcyBhcmUgc2hvd25cbiAgLy8gVGhlIHRhc2sgSUQgaXMgZGlzcGxheWVkIHNlcGFyYXRlbHkgYnkgQXNzaXN0YW50VG9vbFVzZU1lc3NhZ2VcbiAgaWYgKGdldEFnZW50T3V0cHV0VGFza0lkKGZpbGVfcGF0aCkpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGNvbnN0IGRpc3BsYXlQYXRoID0gdmVyYm9zZSA/IGZpbGVfcGF0aCA6IGdldERpc3BsYXlQYXRoKGZpbGVfcGF0aClcbiAgaWYgKHBhZ2VzKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxGaWxlUGF0aExpbmsgZmlsZVBhdGg9e2ZpbGVfcGF0aH0+e2Rpc3BsYXlQYXRofTwvRmlsZVBhdGhMaW5rPlxuICAgICAgICB7YCDCtyBwYWdlcyAke3BhZ2VzfWB9XG4gICAgICA8Lz5cbiAgICApXG4gIH1cbiAgaWYgKHZlcmJvc2UgJiYgKG9mZnNldCB8fCBsaW1pdCkpIHtcbiAgICBjb25zdCBzdGFydExpbmUgPSBvZmZzZXQgPz8gMVxuICAgIGNvbnN0IGxpbmVSYW5nZSA9IGxpbWl0XG4gICAgICA/IGBsaW5lcyAke3N0YXJ0TGluZX0tJHtzdGFydExpbmUgKyBsaW1pdCAtIDF9YFxuICAgICAgOiBgZnJvbSBsaW5lICR7c3RhcnRMaW5lfWBcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPEZpbGVQYXRoTGluayBmaWxlUGF0aD17ZmlsZV9wYXRofT57ZGlzcGxheVBhdGh9PC9GaWxlUGF0aExpbms+XG4gICAgICAgIHtgIMK3ICR7bGluZVJhbmdlfWB9XG4gICAgICA8Lz5cbiAgICApXG4gIH1cbiAgcmV0dXJuIDxGaWxlUGF0aExpbmsgZmlsZVBhdGg9e2ZpbGVfcGF0aH0+e2Rpc3BsYXlQYXRofTwvRmlsZVBhdGhMaW5rPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZVRhZyh7XG4gIGZpbGVfcGF0aCxcbn06IFBhcnRpYWw8SW5wdXQ+KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgYWdlbnRUYXNrSWQgPSBmaWxlX3BhdGggPyBnZXRBZ2VudE91dHB1dFRhc2tJZChmaWxlX3BhdGgpIDogbnVsbFxuXG4gIC8vIFNob3cgYWdlbnQgdGFzayBJRCBmb3IgUmVhZCB0b29sIHdoZW4gcmVhZGluZyBhZ2VudCBvdXRwdXRcbiAgaWYgKCFhZ2VudFRhc2tJZCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPiB7YWdlbnRUYXNrSWR9PC9UZXh0PlxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2Uob3V0cHV0OiBPdXRwdXQpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBUT0RPOiBSZW5kZXIgcmVjdXJzaXZlbHlcbiAgc3dpdGNoIChvdXRwdXQudHlwZSkge1xuICAgIGNhc2UgJ2ltYWdlJzoge1xuICAgICAgY29uc3QgeyBvcmlnaW5hbFNpemUgfSA9IG91dHB1dC5maWxlXG4gICAgICBjb25zdCBmb3JtYXR0ZWRTaXplID0gZm9ybWF0RmlsZVNpemUob3JpZ2luYWxTaXplKVxuXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgPFRleHQ+UmVhZCBpbWFnZSAoe2Zvcm1hdHRlZFNpemV9KTwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICAgIGNhc2UgJ25vdGVib29rJzoge1xuICAgICAgY29uc3QgeyBjZWxscyB9ID0gb3V0cHV0LmZpbGVcbiAgICAgIGlmICghY2VsbHMgfHwgY2VsbHMubGVuZ3RoIDwgMSkge1xuICAgICAgICByZXR1cm4gPFRleHQgY29sb3I9XCJlcnJvclwiPk5vIGNlbGxzIGZvdW5kIGluIG5vdGVib29rPC9UZXh0PlxuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgUmVhZCA8VGV4dCBib2xkPntjZWxscy5sZW5ndGh9PC9UZXh0PiBjZWxsc1xuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICAgIGNhc2UgJ3BkZic6IHtcbiAgICAgIGNvbnN0IHsgb3JpZ2luYWxTaXplIH0gPSBvdXRwdXQuZmlsZVxuICAgICAgY29uc3QgZm9ybWF0dGVkU2l6ZSA9IGZvcm1hdEZpbGVTaXplKG9yaWdpbmFsU2l6ZSlcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPE1lc3NhZ2VSZXNwb25zZSBoZWlnaHQ9ezF9PlxuICAgICAgICAgIDxUZXh0PlJlYWQgUERGICh7Zm9ybWF0dGVkU2l6ZX0pPC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcbiAgICB9XG4gICAgY2FzZSAncGFydHMnOiB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICBSZWFkIDxUZXh0IGJvbGQ+e291dHB1dC5maWxlLmNvdW50fTwvVGV4dD57JyAnfVxuICAgICAgICAgICAge291dHB1dC5maWxlLmNvdW50ID09PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJ30gKFxuICAgICAgICAgICAge2Zvcm1hdEZpbGVTaXplKG91dHB1dC5maWxlLm9yaWdpbmFsU2l6ZSl9KVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICAgIGNhc2UgJ3RleHQnOiB7XG4gICAgICBjb25zdCB7IG51bUxpbmVzIH0gPSBvdXRwdXQuZmlsZVxuXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICBSZWFkIDxUZXh0IGJvbGQ+e251bUxpbmVzfTwvVGV4dD57JyAnfVxuICAgICAgICAgICAge251bUxpbmVzID09PSAxID8gJ2xpbmUnIDogJ2xpbmVzJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgICAgKVxuICAgIH1cbiAgICBjYXNlICdmaWxlX3VuY2hhbmdlZCc6IHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5VbmNoYW5nZWQgc2luY2UgbGFzdCByZWFkPC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UoXG4gIHJlc3VsdDogVG9vbFJlc3VsdEJsb2NrUGFyYW1bJ2NvbnRlbnQnXSxcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKCF2ZXJib3NlICYmIHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgLy8gRmlsZVJlYWRUb29sIHRocm93cyBmcm9tIGNhbGwoKSBzbyBlcnJvcnMgbGFjayA8dG9vbF91c2VfZXJyb3I+IHdyYXBwaW5nIOKAlFxuICAgIC8vIGNoZWNrIHRoZSByYXcgc3RyaW5nIGRpcmVjdGx5IGZvciB0aGUgY3dkIG5vdGUgbWFya2VyLlxuICAgIGlmIChyZXN1bHQuaW5jbHVkZXMoRklMRV9OT1RfRk9VTkRfQ1dEX05PVEUpKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5GaWxlIG5vdCBmb3VuZDwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICAgIGlmIChleHRyYWN0VGFnKHJlc3VsdCwgJ3Rvb2xfdXNlX2Vycm9yJykpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPkVycm9yIHJlYWRpbmcgZmlsZTwvVGV4dD5cbiAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICApXG4gICAgfVxuICB9XG4gIHJldHVybiA8RmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIHJlc3VsdD17cmVzdWx0fSB2ZXJib3NlPXt2ZXJib3NlfSAvPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlckZhY2luZ05hbWUoaW5wdXQ6IFBhcnRpYWw8SW5wdXQ+IHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKGlucHV0Py5maWxlX3BhdGg/LnN0YXJ0c1dpdGgoZ2V0UGxhbnNEaXJlY3RvcnkoKSkpIHtcbiAgICByZXR1cm4gJ1JlYWRpbmcgUGxhbidcbiAgfVxuICBpZiAoaW5wdXQ/LmZpbGVfcGF0aCAmJiBnZXRBZ2VudE91dHB1dFRhc2tJZChpbnB1dC5maWxlX3BhdGgpKSB7XG4gICAgcmV0dXJuICdSZWFkIGFnZW50IG91dHB1dCdcbiAgfVxuICByZXR1cm4gJ1JlYWQnXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb29sVXNlU3VtbWFyeShcbiAgaW5wdXQ6IFBhcnRpYWw8SW5wdXQ+IHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghaW5wdXQ/LmZpbGVfcGF0aCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgLy8gRm9yIGFnZW50IG91dHB1dCBmaWxlcywganVzdCBzaG93IHRoZSB0YXNrIElEXG4gIGNvbnN0IGFnZW50VGFza0lkID0gZ2V0QWdlbnRPdXRwdXRUYXNrSWQoaW5wdXQuZmlsZV9wYXRoKVxuICBpZiAoYWdlbnRUYXNrSWQpIHtcbiAgICByZXR1cm4gYWdlbnRUYXNrSWRcbiAgfVxuICByZXR1cm4gZ2V0RGlzcGxheVBhdGgoaW5wdXQuZmlsZV9wYXRoKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxjQUFjQSxvQkFBb0IsUUFBUSx1Q0FBdUM7QUFDakYsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxVQUFVLFFBQVEsdUJBQXVCO0FBQ2xELFNBQVNDLDJCQUEyQixRQUFRLGlEQUFpRDtBQUM3RixTQUFTQyxZQUFZLFFBQVEsa0NBQWtDO0FBQy9ELFNBQVNDLGVBQWUsUUFBUSxxQ0FBcUM7QUFDckUsU0FBU0MsSUFBSSxRQUFRLGNBQWM7QUFDbkMsU0FBU0MsdUJBQXVCLEVBQUVDLGNB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