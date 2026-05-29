// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 Markdown 终端界面组件，避免在这里重复拼装显示逻辑。
import { Markdown } from 'src/components/Markdown.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from 'src/components/MessageResponse.js';
// 复用 RejectedPlanMessage 终端界面组件，避免在这里重复拼装显示逻辑。
import { RejectedPlanMessage } from 'src/components/messages/UserToolResultMessage/RejectedPlanMessage.js';
// 引入 BLACK_CIRCLE，将 src/constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from 'src/constants/figures.js';
// 复用 getModeColor 工具函数，把通用处理留在 src/utils/permissions/PermissionMode.js 中维护。
import { getModeColor } from 'src/utils/permissions/PermissionMode.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { ToolProgressData } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolProgressData } from '../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../types/message.js，用于校准工具调用的数据契约。
import type { ProgressMessage } from '../../types/message.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 复用 getPlan 工具函数，把通用处理留在 ../../utils/plans.js 中维护。
import { getPlan } from '../../utils/plans.js';
// 类型依赖 { ThemeName } 来自 ../../utils/theme.js，用于校准工具调用的数据契约。
import type { ThemeName } from '../../utils/theme.js';
// 类型依赖 { Output } 来自 ./ExitPlanModeV2Tool.js，用于校准工具调用的数据契约。
import type { Output } from './ExitPlanModeV2Tool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(): React.ReactNode {
  // 返回 `null`，作为工具调用这次计算的结果。
  return null;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(output: Output, _progressMessagesForMessage: ProgressMessage<ToolProgressData>[], {
  theme: _theme
}: {
  theme: ThemeName;
}): React.ReactNode {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    plan,
    filePath
  } = output;
  // isEmpty记录 `plan.trim` 是否成立，工具调用随后按该结果分支。
  const isEmpty = !plan || plan.trim() === '';
  // displayPath 路径数据读取`getDisplayPath`，供工具调用后续处理使用。
  const displayPath = filePath ? getDisplayPath(filePath) : '';
  // awaitingLeaderApproval保存`output.awaitingLeaderApproval`，供工具实现 UI后续判断或输出使用。
  const awaitingLeaderApproval = output.awaitingLeaderApproval;

  // Simplified message for empty plans
  // 满足 `isEmpty` 时，工具调用执行该分支。
  if (isEmpty) {
    // 返回 `<Box flexDirection="column" marginTop={1}>`，作为工具调用这次计算的结果。
    return <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="row">
          <Text color={getModeColor('plan')}>{BLACK_CIRCLE}</Text>
          <Text> Exited plan mode</Text>
        </Box>
      </Box>;
  }

  // When awaiting leader approval, show a different message
  // 满足 `awaitingLeaderApproval` 时，工具调用执行该分支。
  if (awaitingLeaderApproval) {
    // 返回 `<Box flexDirection="column" marginTop={1}>`，作为工具调用这次计算的结果。
    return <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="row">
          <Text color={getModeColor('plan')}>{BLACK_CIRCLE}</Text>
          <Text> Plan submitted for team lead approval</Text>
        </Box>
        <MessageResponse>
          <Box flexDirection="column">
            {filePath && <Text dimColor>Plan file: {displayPath}</Text>}
            <Text dimColor>Waiting for team lead to review and approve...</Text>
          </Box>
        </MessageResponse>
      </Box>;
  }
  // 返回 `<Box flexDirection="column" marginTop={1}>`，作为工具调用这次计算的结果。
  return <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row">
        <Text color={getModeColor('plan')}>{BLACK_CIRCLE}</Text>
        <Text> User approved Claude&apos;s plan</Text>
      </Box>
      <MessageResponse>
        <Box flexDirection="column">
          {filePath && <Text dimColor>Plan saved to: {displayPath} · /plan to edit</Text>}
          <Markdown>{plan}</Markdown>
        </Box>
      </MessageResponse>
    </Box>;
}
// renderToolUseRejectedMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseRejectedMessage({
  plan
}: {
  plan?: string;
}, {
  theme: _theme
}: {
  theme: ThemeName;
}): React.ReactNode {
  // planContent读取`getPlan`，供工具调用后续处理使用。
  const planContent = plan ?? getPlan() ?? 'No plan found';
  // 返回 `<Box flexDirection="column">`，作为工具调用这次计算的结果。
  return <Box flexDirection="column">
      <RejectedPlanMessage plan={planContent} />
    </Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1hcmtkb3duIiwiTWVzc2FnZVJlc3BvbnNlIiwiUmVqZWN0ZWRQbGFuTWVzc2FnZSIsIkJMQUNLX0NJUkNMRSIsImdldE1vZGVDb2xvciIsIkJveCIsIlRleHQiLCJUb29sUHJvZ3Jlc3NEYXRhIiwiUHJvZ3Jlc3NNZXNzYWdlIiwiZ2V0RGlzcGxheVBhdGgiLCJnZXRQbGFuIiwiVGhlbWVOYW1lIiwiT3V0cHV0IiwicmVuZGVyVG9vbFVzZU1lc3NhZ2UiLCJSZWFjdE5vZGUiLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsIm91dHB1dCIsIl9wcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSIsInRoZW1lIiwiX3RoZW1lIiwicGxhbiIsImZpbGVQYXRoIiwiaXNFbXB0eSIsInRyaW0iLCJkaXNwbGF5UGF0aCIsImF3YWl0aW5nTGVhZGVyQXBwcm92YWwiLCJyZW5kZXJUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIiwicGxhbkNvbnRlbnQiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNYXJrZG93biB9IGZyb20gJ3NyYy9jb21wb25lbnRzL01hcmtkb3duLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgUmVqZWN0ZWRQbGFuTWVzc2FnZSB9IGZyb20gJ3NyYy9jb21wb25lbnRzL21lc3NhZ2VzL1VzZXJUb29sUmVzdWx0TWVzc2FnZS9SZWplY3RlZFBsYW5NZXNzYWdlLmpzJ1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFIH0gZnJvbSAnc3JjL2NvbnN0YW50cy9maWd1cmVzLmpzJ1xuaW1wb3J0IHsgZ2V0TW9kZUNvbG9yIH0gZnJvbSAnc3JjL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25Nb2RlLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBUb29sUHJvZ3Jlc3NEYXRhIH0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgUHJvZ3Jlc3NNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB7IGdldERpc3BsYXlQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7IGdldFBsYW4gfSBmcm9tICcuLi8uLi91dGlscy9wbGFucy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWVOYW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgdHlwZSB7IE91dHB1dCB9IGZyb20gJy4vRXhpdFBsYW5Nb2RlVjJUb29sLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZU1lc3NhZ2UoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRvb2xSZXN1bHRNZXNzYWdlKFxuICBvdXRwdXQ6IE91dHB1dCxcbiAgX3Byb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBQcm9ncmVzc01lc3NhZ2U8VG9vbFByb2dyZXNzRGF0YT5bXSxcbiAgeyB0aGVtZTogX3RoZW1lIH06IHsgdGhlbWU6IFRoZW1lTmFtZSB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBwbGFuLCBmaWxlUGF0aCB9ID0gb3V0cHV0XG4gIGNvbnN0IGlzRW1wdHkgPSAhcGxhbiB8fCBwbGFuLnRyaW0oKSA9PT0gJydcbiAgY29uc3QgZGlzcGxheVBhdGggPSBmaWxlUGF0aCA/IGdldERpc3BsYXlQYXRoKGZpbGVQYXRoKSA6ICcnXG4gIGNvbnN0IGF3YWl0aW5nTGVhZGVyQXBwcm92YWwgPSBvdXRwdXQuYXdhaXRpbmdMZWFkZXJBcHByb3ZhbFxuXG4gIC8vIFNpbXBsaWZpZWQgbWVzc2FnZSBmb3IgZW1wdHkgcGxhbnNcbiAgaWYgKGlzRW1wdHkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICAgICAgPFRleHQgY29sb3I9e2dldE1vZGVDb2xvcigncGxhbicpfT57QkxBQ0tfQ0lSQ0xFfTwvVGV4dD5cbiAgICAgICAgICA8VGV4dD4gRXhpdGVkIHBsYW4gbW9kZTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICAvLyBXaGVuIGF3YWl0aW5nIGxlYWRlciBhcHByb3ZhbCwgc2hvdyBhIGRpZmZlcmVudCBtZXNzYWdlXG4gIGlmIChhd2FpdGluZ0xlYWRlckFwcHJvdmFsKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXtnZXRNb2RlQ29sb3IoJ3BsYW4nKX0+e0JMQUNLX0NJUkNMRX08L1RleHQ+XG4gICAgICAgICAgPFRleHQ+IFBsYW4gc3VibWl0dGVkIGZvciB0ZWFtIGxlYWQgYXBwcm92YWw8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAge2ZpbGVQYXRoICYmIDxUZXh0IGRpbUNvbG9yPlBsYW4gZmlsZToge2Rpc3BsYXlQYXRofTwvVGV4dD59XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5XYWl0aW5nIGZvciB0ZWFtIGxlYWQgdG8gcmV2aWV3IGFuZCBhcHByb3ZlLi4uPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICA8VGV4dCBjb2xvcj17Z2V0TW9kZUNvbG9yKCdwbGFuJyl9PntCTEFDS19DSVJDTEV9PC9UZXh0PlxuICAgICAgICA8VGV4dD4gVXNlciBhcHByb3ZlZCBDbGF1ZGUmYXBvcztzIHBsYW48L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIHtmaWxlUGF0aCAmJiAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5QbGFuIHNhdmVkIHRvOiB7ZGlzcGxheVBhdGh9IMK3IC9wbGFuIHRvIGVkaXQ8L1RleHQ+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8TWFya2Rvd24+e3BsYW59PC9NYXJrZG93bj5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICA8L0JveD5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZVJlamVjdGVkTWVzc2FnZShcbiAgeyBwbGFuIH06IHsgcGxhbj86IHN0cmluZyB9LFxuICB7IHRoZW1lOiBfdGhlbWUgfTogeyB0aGVtZTogVGhlbWVOYW1lIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBwbGFuQ29udGVudCA9IHBsYW4gPz8gZ2V0UGxhbigpID8/ICdObyBwbGFuIGZvdW5kJ1xuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8UmVqZWN0ZWRQbGFuTWVzc2FnZSBwbGFuPXtwbGFuQ29udGVudH0gLz5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlC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