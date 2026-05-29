// 类型依赖 { ToolResultBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准工具调用的数据契约。
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { Message, ProgressMessage } 来自 src/types/message.js，用于校准工具调用的数据契约。
import type { Message, ProgressMessage } from 'src/types/message.js';
// 复用 extractTag 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { extractTag } from 'src/utils/messages.js';
// 类型依赖 { ThemeName } 来自 src/utils/theme.js，用于校准工具调用的数据契约。
import type { ThemeName } from 'src/utils/theme.js';
// 类型依赖 { z } 来自 zod/v4，用于校准工具调用的数据契约。
import type { z } from 'zod/v4';
// 复用 FallbackToolUseErrorMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { FallbackToolUseErrorMessage } from '../../components/FallbackToolUseErrorMessage.js';
// 复用 FilePathLink 终端界面组件，避免在这里重复拼装显示逻辑。
import { FilePathLink } from '../../components/FilePathLink.js';
// 复用 HighlightedCode 终端界面组件，避免在这里重复拼装显示逻辑。
import { HighlightedCode } from '../../components/HighlightedCode.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 复用 NotebookEditToolUseRejectedMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { NotebookEditToolUseRejectedMessage } from '../../components/NotebookEditToolUseRejectedMessage.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { Tools } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { Tools } from '../../Tool.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 类型依赖 { inputSchema, Output } 来自 ./NotebookEditTool.js，用于校准工具调用的数据契约。
import type { inputSchema, Output } from './NotebookEditTool.js';
// getToolUseSummary 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolUseSummary(input: Partial<z.infer<ReturnType<typeof inputSchema>>> | undefined): string | null {
  // 满足 `!input?.notebook_path` 时，工具调用执行该分支。
  if (!input?.notebook_path) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 返回 `getDisplayPath(input.notebook_path)`，作为工具调用这次计算的结果。
  return getDisplayPath(input.notebook_path);
}
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage({
  notebook_path,
  cell_id,
  new_source,
  cell_type,
  edit_mode
}: Partial<z.infer<ReturnType<typeof inputSchema>>>, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 只有 `!notebook_path || !new_source || !cell_type` 满足时，工具调用才执行该分支。
  if (!notebook_path || !new_source || !cell_type) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // displayPath 路径数据读取`getDisplayPath`，供工具调用后续处理使用。
  const displayPath = verbose ? notebook_path : getDisplayPath(notebook_path);
  // 满足 `verbose` 时，工具调用执行该分支。
  if (verbose) {
    // 返回 `<>`，作为工具调用这次计算的结果。
    return <>
        <FilePathLink filePath={notebook_path}>{displayPath}</FilePathLink>
        {`@${cell_id}, content: ${new_source.slice(0, 30)}…, cell_type: ${cell_type}, edit_mode: ${edit_mode ?? 'replace'}`}
      </>;
  }
  // 返回 `<>`，作为工具调用这次计算的结果。
  return <>
      <FilePathLink filePath={notebook_path}>{displayPath}</FilePathLink>
      {`@${cell_id}`}
    </>;
}
// renderToolUseRejectedMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseRejectedMessage(input: z.infer<ReturnType<typeof inputSchema>>, {
  verbose
}: {
  columns?: number;
  messages?: Message[];
  progressMessagesForMessage?: ProgressMessage[];
  theme?: ThemeName;
  tools?: Tools;
  verbose: boolean;
}): React.ReactNode {
  // 返回 `<NotebookEditToolUseRejectedMessage notebook_path={input.notebook_path}...`，作为工具调用这次计算的结果。
  return <NotebookEditToolUseRejectedMessage notebook_path={input.notebook_path} cell_id={input.cell_id} new_source={input.new_source} cell_type={input.cell_type} edit_mode={input.edit_mode} verbose={verbose} />;
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
        <Text color="error">Error editing notebook</Text>
      </MessageResponse>;
  }
  // 返回 `<FallbackToolUseErrorMessage result={result} verbose={verbose} />`，作为工具调用这次计算的结果。
  return <FallbackToolUseErrorMessage result={result} verbose={verbose} />;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage({
  cell_id,
  new_source,
  error
}: Output): React.ReactNode {
  // 满足 `error` 时，工具调用执行该分支。
  if (error) {
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text color="error">{error}</Text>
      </MessageResponse>;
  }
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Box flexDirection="column">
        <Text>
          Updated cell <Text bold>{cell_id}</Text>:
        </Text>
        <Box marginLeft={2}>
          <HighlightedCode code={new_source} filePath="notebook.py" />
        </Box>
      </Box>
    </MessageResponse>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sUmVzdWx0QmxvY2tQYXJhbSIsIlJlYWN0IiwiTWVzc2FnZSIsIlByb2dyZXNzTWVzc2FnZSIsImV4dHJhY3RUYWciLCJUaGVtZU5hbWUiLCJ6IiwiRmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIiwiRmlsZVBhdGhMaW5rIiwiSGlnaGxpZ2h0ZWRDb2RlIiwiTWVzc2FnZVJlc3BvbnNlIiwiTm90ZWJvb2tFZGl0VG9vbFVzZVJlamVjdGVkTWVzc2FnZSIsIkJveCIsIlRleHQiLCJUb29scyIsImdldERpc3BsYXlQYXRoIiwiaW5wdXRTY2hlbWEiLCJPdXRwdXQiLCJnZXRUb29sVXNlU3VtbWFyeSIsImlucHV0IiwiUGFydGlhbCIsImluZmVyIiwiUmV0dXJuVHlwZSIsIm5vdGVib29rX3BhdGgiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsImNlbGxfaWQiLCJuZXdfc291cmNlIiwiY2VsbF90eXBlIiwiZWRpdF9tb2RlIiwidmVyYm9zZSIsIlJlYWN0Tm9kZSIsImRpc3BsYXlQYXRoIiwic2xpY2UiLCJyZW5kZXJUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIiwiY29sdW1ucyIsIm1lc3NhZ2VzIiwicHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiLCJ0aGVtZSIsInRvb2xzIiwicmVuZGVyVG9vbFVzZUVycm9yTWVzc2FnZSIsInJlc3VsdCIsInJlbmRlclRvb2xSZXN1bHRNZXNzYWdlIiwiZXJyb3IiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUb29sUmVzdWx0QmxvY2tQYXJhbSB9IGZyb20gJ0BhbnRocm9waWMtYWkvc2RrL3Jlc291cmNlcy9pbmRleC5tanMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSwgUHJvZ3Jlc3NNZXNzYWdlIH0gZnJvbSAnc3JjL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgeyBleHRyYWN0VGFnIH0gZnJvbSAnc3JjL3V0aWxzL21lc3NhZ2VzLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZU5hbWUgfSBmcm9tICdzcmMvdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgdHlwZSB7IHogfSBmcm9tICd6b2QvdjQnXG5pbXBvcnQgeyBGYWxsYmFja1Rvb2xVc2VFcnJvck1lc3NhZ2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL0ZhbGxiYWNrVG9vbFVzZUVycm9yTWVzc2FnZS5qcydcbmltcG9ydCB7IEZpbGVQYXRoTGluayB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvRmlsZVBhdGhMaW5rLmpzJ1xuaW1wb3J0IHsgSGlnaGxpZ2h0ZWRDb2RlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9IaWdobGlnaHRlZENvZGUuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IE5vdGVib29rRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL05vdGVib29rRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2UuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFRvb2xzIH0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB7IGdldERpc3BsYXlQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB0eXBlIHsgaW5wdXRTY2hlbWEsIE91dHB1dCB9IGZyb20gJy4vTm90ZWJvb2tFZGl0VG9vbC5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvb2xVc2VTdW1tYXJ5KFxuICBpbnB1dDogUGFydGlhbDx6LmluZmVyPFJldHVyblR5cGU8dHlwZW9mIGlucHV0U2NoZW1hPj4+IHwgdW5kZWZpbmVkLFxuKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghaW5wdXQ/Lm5vdGVib29rX3BhdGgpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBnZXREaXNwbGF5UGF0aChpbnB1dC5ub3RlYm9va19wYXRoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZU1lc3NhZ2UoXG4gIHtcbiAgICBub3RlYm9va19wYXRoLFxuICAgIGNlbGxfaWQsXG4gICAgbmV3X3NvdXJjZSxcbiAgICBjZWxsX3R5cGUsXG4gICAgZWRpdF9tb2RlLFxuICB9OiBQYXJ0aWFsPHouaW5mZXI8UmV0dXJuVHlwZTx0eXBlb2YgaW5wdXRTY2hlbWE+Pj4sXG4gIHsgdmVyYm9zZSB9OiB7IHZlcmJvc2U6IGJvb2xlYW4gfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmICghbm90ZWJvb2tfcGF0aCB8fCAhbmV3X3NvdXJjZSB8fCAhY2VsbF90eXBlKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICBjb25zdCBkaXNwbGF5UGF0aCA9IHZlcmJvc2UgPyBub3RlYm9va19wYXRoIDogZ2V0RGlzcGxheVBhdGgobm90ZWJvb2tfcGF0aClcbiAgaWYgKHZlcmJvc2UpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPEZpbGVQYXRoTGluayBmaWxlUGF0aD17bm90ZWJvb2tfcGF0aH0+e2Rpc3BsYXlQYXRofTwvRmlsZVBhdGhMaW5rPlxuICAgICAgICB7YEAke2NlbGxfaWR9LCBjb250ZW50OiAke25ld19zb3VyY2Uuc2xpY2UoMCwgMzApfeKApiwgY2VsbF90eXBlOiAke2NlbGxfdHlwZX0sIGVkaXRfbW9kZTogJHtlZGl0X21vZGUgPz8gJ3JlcGxhY2UnfWB9XG4gICAgICA8Lz5cbiAgICApXG4gIH1cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPEZpbGVQYXRoTGluayBmaWxlUGF0aD17bm90ZWJvb2tfcGF0aH0+e2Rpc3BsYXlQYXRofTwvRmlsZVBhdGhMaW5rPlxuICAgICAge2BAJHtjZWxsX2lkfWB9XG4gICAgPC8+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VSZWplY3RlZE1lc3NhZ2UoXG4gIGlucHV0OiB6LmluZmVyPFJldHVyblR5cGU8dHlwZW9mIGlucHV0U2NoZW1hPj4sXG4gIHtcbiAgICB2ZXJib3NlLFxuICB9OiB7XG4gICAgY29sdW1ucz86IG51bWJlclxuICAgIG1lc3NhZ2VzPzogTWVzc2FnZVtdXG4gICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U/OiBQcm9ncmVzc01lc3NhZ2VbXVxuICAgIHRoZW1lPzogVGhlbWVOYW1lXG4gICAgdG9vbHM/OiBUb29sc1xuICAgIHZlcmJvc2U6IGJvb2xlYW5cbiAgfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPE5vdGVib29rRWRpdFRvb2xVc2VSZWplY3RlZE1lc3NhZ2VcbiAgICAgIG5vdGVib29rX3BhdGg9e2lucHV0Lm5vdGVib29rX3BhdGh9XG4gICAgICBjZWxsX2lkPXtpbnB1dC5jZWxsX2lkfVxuICAgICAgbmV3X3NvdXJjZT17aW5wdXQubmV3X3NvdXJjZX1cbiAgICAgIGNlbGxfdHlwZT17aW5wdXQuY2VsbF90eXBlfVxuICAgICAgZWRpdF9tb2RlPXtpbnB1dC5lZGl0X21vZGV9XG4gICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgIC8+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xVc2VFcnJvck1lc3NhZ2UoXG4gIHJlc3VsdDogVG9vbFJlc3VsdEJsb2NrUGFyYW1bJ2NvbnRlbnQnXSxcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKFxuICAgICF2ZXJib3NlICYmXG4gICAgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycgJiZcbiAgICBleHRyYWN0VGFnKHJlc3VsdCwgJ3Rvb2xfdXNlX2Vycm9yJylcbiAgKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5FcnJvciBlZGl0aW5nIG5vdGVib29rPC9UZXh0PlxuICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgKVxuICB9XG4gIHJldHVybiA8RmFsbGJhY2tUb29sVXNlRXJyb3JNZXNzYWdlIHJlc3VsdD17cmVzdWx0fSB2ZXJib3NlPXt2ZXJib3NlfSAvPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2Uoe1xuICBjZWxsX2lkLFxuICBuZXdfc291cmNlLFxuICBlcnJvcixcbn06IE91dHB1dCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChlcnJvcikge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+e2Vycm9yfTwvVGV4dD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBVcGRhdGVkIGNlbGwgPFRleHQgYm9sZD57Y2VsbF9pZH08L1RleHQ+OlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgICAgPEhpZ2hsaWdodGVkQ29kZSBjb2RlPXtuZXdfc291cmNlfSBmaWxlUGF0aD1cIm5vdGVib29rLnB5XCIgLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxjQUFjQSxvQkFBb0IsUUFBUSx1Q0FBdUM7QUFDakYsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixjQUFjQyxPQUFPLEVBQUVDLGVBQWUsUUFBUSxzQkFBc0I7QUFDcEUsU0FBU0MsVUFBVSxRQUFRLHVCQUF1QjtBQUNsRCxjQUFjQyxTQUFTLFFBQVEsb0JBQW9CO0FBQ25ELGNBQWND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