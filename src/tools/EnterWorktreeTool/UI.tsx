// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { ToolProgressData } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolProgressData } from '../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { ProgressMessage } from '../../types/message.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准工具调用的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// 类型依赖 { Output } 来自 ./EnterWorktreeTool.js，用于校准工具调用的数据契约。
import type { Output } from './EnterWorktreeTool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(): React.ReactNode {
  // 返回 `'Creating worktree…'`，作为工具调用这次计算的结果。
  return 'Creating worktree…';
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(output: Output, _progressMessagesForMessage: ProgressMessage<ToolProgressData>[], _options: {
  theme: ThemeName;
}): React.ReactNode {
  // 返回 `<Box flexDirection="column">`，作为工具调用这次计算的结果。
  return <Box flexDirection="column">
      <Text>
        Switched to worktree on branch <Text bold>{output.worktreeBranch}</Text>
      </Text>
      <Text dimColor>{output.worktreePath}</Text>
    </Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJUb29sUHJvZ3Jlc3NEYXRhIiwiUHJvZ3Jlc3NNZXNzYWdlIiwiVGhlbWVOYW1lIiwiT3V0cHV0IiwicmVuZGVyVG9vbFVzZU1lc3NhZ2UiLCJSZWFjdE5vZGUiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsIm91dHB1dCIsIl9wcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSIsIl9vcHRpb25zIiwidGhlbWUiLCJ3b3JrdHJlZUJyYW5jaCIsIndvcmt0cmVlUGF0aCJdLCJzb3VyY2VzIjpbIlVJLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVG9vbFByb2dyZXNzRGF0YSB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IFByb2dyZXNzTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lTmFtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBPdXRwdXQgfSBmcm9tICcuL0VudGVyV29ya3RyZWVUb29sLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZU1lc3NhZ2UoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuICdDcmVhdGluZyB3b3JrdHJlZeKApidcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xSZXN1bHRNZXNzYWdlKFxuICBvdXRwdXQ6IE91dHB1dCxcbiAgX3Byb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBQcm9ncmVzc01lc3NhZ2U8VG9vbFByb2dyZXNzRGF0YT5bXSxcbiAgX29wdGlvbnM6IHsgdGhlbWU6IFRoZW1lTmFtZSB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIDxUZXh0PlxuICAgICAgICBTd2l0Y2hlZCB0byB3b3JrdHJlZSBvbiBicmFuY2ggPFRleHQgYm9sZD57b3V0cHV0Lndvcmt0cmVlQnJhbmNofTwvVGV4dD5cbiAgICAgIDwvVGV4dD5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPntvdXRwdXQud29ya3RyZWVQYXRofTwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsY0FBY0MsZ0JBQWdCLFFBQVEsZUFBZTtBQUNyRCxjQUFjQyxlQUFlLFFBQVEsd0JBQXdCO0FBQzdELGNBQWNDLFNBQVMsUUFBUSxzQkFBc0I7QUFDckQsY0FBY0MsTUFBTSxRQUFRLHdCQUF3QjtBQUVwRCxPQUFPLFNBQVNDLG9CQUFvQkEsQ0FBQSxDQUFFLEVBQUVQLEtBQUssQ0FBQ1EsU0FBUyxDQUFDO0VBQ3RELE9BQU8sb0JBQW9CO0FBQzdCO0FBRUEsT0FBTyxTQUFTQyx1QkFBdUJBLENBQ3JDQyxNQUFNLEVBQUVKLE1BQU0sRUFDZEssMkJBQTJCLEVBQUVQLGVBQWUsQ0FBQ0QsZ0JBQWdCLENBQUMsRUFBRSxFQUNoRVMsUUFBUSxFQUFFO0VBQUVDLEtBQUssRUFBRVIsU0FBUztBQUFDLENBQUMsQ0FDL0IsRUFBRUwsS0FBSyxDQUFDUSxTQUFTLENBQUM7RUFDakIsT0FDRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUTtBQUMvQixNQUFNLENBQUMsSUFBSTtBQUNYLHVDQUF1QyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ0UsTUFBTSxDQUFDSSxjQUFjLENBQUMsRUFBRSxJQUFJO0FBQy9FLE1BQU0sRUFBRSxJQUFJO0FBQ1osTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQ0osTUFBTSxDQUFDSyxZQUFZLENBQUMsRUFBRSxJQUFJO0FBQ2hELElBQUksRUFBRSxHQUFHLENBQUM7QUFFViIsImlnbm9yZUxpc3QiOltdfQ==