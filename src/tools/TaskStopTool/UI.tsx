// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 truncateToWidthNoEllipsis 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncateToWidthNoEllipsis } from '../../utils/format.js';
// 类型依赖 { Output } 来自 ./TaskStopTool.js，用于校准工具调用的数据契约。
import type { Output } from './TaskStopTool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(): React.ReactNode {
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return '';
}
// MAX_COMMAND_DISPLAY_LINES 命令数据 命名 `2`，让后续代码直接表达这个值的用途。
const MAX_COMMAND_DISPLAY_LINES = 2;
// MAX_COMMAND_DISPLAY_CHARS 命令数据 命名 `160`，让后续代码直接表达这个值的用途。
const MAX_COMMAND_DISPLAY_CHARS = 160;
// truncateCommand 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function truncateCommand(command: string): string {
  // 文本行格式化`command.split`，供工具调用后续处理使用。
  const lines = command.split('\n');
  // truncated保存`command`，供后续判断或组装使用。
  let truncated = command;
  // 满足 `lines.length > MAX_COMMAND_DISPLAY_LINES` 时，工具调用执行该分支。
  if (lines.length > MAX_COMMAND_DISPLAY_LINES) {
    // truncated更新为 `lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n')`，确保工具调用后续读取最新状态。
    truncated = lines.slice(0, MAX_COMMAND_DISPLAY_LINES).join('\n');
  }
  // 满足 `stringWidth(truncated) > MAX_COMMAND_DISPLAY_CHARS` 时，工具调用执行该分支。
  if (stringWidth(truncated) > MAX_COMMAND_DISPLAY_CHARS) {
    // truncated更新为 `truncateToWidthNoEllipsis(truncated, MAX_COMMAND_DISPLAY_...`，确保工具调用后续读取最新状态。
    truncated = truncateToWidthNoEllipsis(truncated, MAX_COMMAND_DISPLAY_CHARS);
  }
  // 返回 `truncated.trim()`，作为工具调用这次计算的结果。
  return truncated.trim();
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(output: Output, _progressMessagesForMessage: unknown[], {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 当 `"external"` 匹配 `'ant'` 时，工具调用执行对应分支。
  if ("external" === 'ant') {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // rawCommand 命令数据 命名 `output.command ?? ''`，让后续代码直接表达这个值的用途。
  const rawCommand = output.command ?? '';
  // 命令保存`truncateCommand`，供工具调用后续处理使用。
  const command = verbose ? rawCommand : truncateCommand(rawCommand);
  // suffix标记工具实现 UI是否启用对应路径。
  const suffix = command !== rawCommand ? '… · stopped' : ' · stopped';
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text>
        {command}
        {suffix}
      </Text>
    </MessageResponse>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsInN0cmluZ1dpZHRoIiwiVGV4dCIsInRydW5jYXRlVG9XaWR0aE5vRWxsaXBzaXMiLCJPdXRwdXQiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsIlJlYWN0Tm9kZSIsIk1BWF9DT01NQU5EX0RJU1BMQVlfTElORVMiLCJNQVhfQ09NTUFORF9ESVNQTEFZX0NIQVJTIiwidHJ1bmNhdGVDb21tYW5kIiwiY29tbWFuZCIsImxpbmVzIiwic3BsaXQiLCJ0cnVuY2F0ZWQiLCJsZW5ndGgiLCJzbGljZSIsImpvaW4iLCJ0cmltIiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJvdXRwdXQiLCJfcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UiLCJ2ZXJib3NlIiwicmF3Q29tbWFuZCIsInN1ZmZpeCJdLCJzb3VyY2VzIjpbIlVJLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IHN0cmluZ1dpZHRoIH0gZnJvbSAnLi4vLi4vaW5rL3N0cmluZ1dpZHRoLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHRydW5jYXRlVG9XaWR0aE5vRWxsaXBzaXMgfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgdHlwZSB7IE91dHB1dCB9IGZyb20gJy4vVGFza1N0b3BUb29sLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFVzZU1lc3NhZ2UoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuICcnXG59XG5cbmNvbnN0IE1BWF9DT01NQU5EX0RJU1BMQVlfTElORVMgPSAyXG5jb25zdCBNQVhfQ09NTUFORF9ESVNQTEFZX0NIQVJTID0gMTYwXG5cbmZ1bmN0aW9uIHRydW5jYXRlQ29tbWFuZChjb21tYW5kOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IGNvbW1hbmQuc3BsaXQoJ1xcbicpXG4gIGxldCB0cnVuY2F0ZWQgPSBjb21tYW5kXG5cbiAgaWYgKGxpbmVzLmxlbmd0aCA+IE1BWF9DT01NQU5EX0RJU1BMQVlfTElORVMpIHtcbiAgICB0cnVuY2F0ZWQgPSBsaW5lcy5zbGljZSgwLCBNQVhfQ09NTUFORF9ESVNQTEFZX0xJTkVTKS5qb2luKCdcXG4nKVxuICB9XG5cbiAgaWYgKHN0cmluZ1dpZHRoKHRydW5jYXRlZCkgPiBNQVhfQ09NTUFORF9ESVNQTEFZX0NIQVJTKSB7XG4gICAgdHJ1bmNhdGVkID0gdHJ1bmNhdGVUb1dpZHRoTm9FbGxpcHNpcyh0cnVuY2F0ZWQsIE1BWF9DT01NQU5EX0RJU1BMQVlfQ0hBUlMpXG4gIH1cblxuICByZXR1cm4gdHJ1bmNhdGVkLnRyaW0oKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UoXG4gIG91dHB1dDogT3V0cHV0LFxuICBfcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IHVua25vd25bXSxcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKFwiZXh0ZXJuYWxcIiA9PT0gJ2FudCcpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgcmF3Q29tbWFuZCA9IG91dHB1dC5jb21tYW5kID8/ICcnXG4gIGNvbnN0IGNvbW1hbmQgPSB2ZXJib3NlID8gcmF3Q29tbWFuZCA6IHRydW5jYXRlQ29tbWFuZChyYXdDb21tYW5kKVxuICBjb25zdCBzdWZmaXggPSBjb21tYW5kICE9PSByYXdDb21tYW5kID8gJ+KApiDCtyBzdG9wcGVkJyA6ICcgwrcgc3RvcHBlZCdcblxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8VGV4dD5cbiAgICAgICAge2NvbW1hbmR9XG4gICAgICAgIHtzdWZmaXh9XG4gICAgICA8L1RleHQ+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsZUFBZSxRQUFRLHFDQUFxQztBQUNyRSxTQUFTQyxXQUFXLFFBQVEsMEJBQTBCO0FBQ3RELFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLFNBQVNDLHlCQUF5QixRQUFRLHVCQUF1QjtBQUNqRSxjQUFjQyxNQUFNLFFBQVEsbUJBQW1CO0FBRS9DLE9BQU8sU0FBU0Msb0JBQW9CQSxDQUFBLENBQUUsRUFBRU4sS0FBSyxDQUFDTyxTQUFTLENBQUM7RUFDdEQsT0FBTyxFQUFFO0FBQ1g7QUFFQSxNQUFNQyx5QkFBeUIsR0FBRyxDQUFDO0FBQ25DLE1BQU1DLHlCQUF5QixHQUFHLEdBQUc7QUFFckMsU0FBU0MsZUFBZUEsQ0FBQ0MsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUNoRCxNQUFNQyxLQUFLLEdBQUdELE9BQU8sQ0FBQ0UsS0FBSyxDQUFDLElBQUksQ0FBQztFQUNqQyxJQUFJQyxTQUFTLEdBQUdILE9BQU87RUFFdkIsSUFBSUMsS0FBSyxDQUFDRyxNQUFNLEdBQUdQLHlCQUF5QixFQUFFO0lBQzVDTSxTQUFTLEdBQUdGLEtBQUssQ0FBQ0ksS0FBSyxDQUFDLENBQUMsRUFBRVIseUJBQXlCLENBQUMsQ0FBQ1MsSUFBSSxDQUFDLElBQUksQ0FBQztFQUNsRTtFQUVBLElBQUlmLFdBQVcsQ0FBQ1ksU0FBUyxDQUFDLEdBQUdMLHlCQUF5QixFQUFFO0lBQ3RESyxTQUFTLEdBQUdWLHlCQUF5QixDQUFDVSxTQUFTLEVBQUVMLHlCQUF5QixDQUFDO0VBQzdFO0VBRUEsT0FBT0ssU0FBUyxDQUFDSSxJQUFJLENBQUMsQ0FBQztBQUN6QjtBQUVBLE9BQU8sU0FBU0MsdUJBQXVCQSxDQUNyQ0MsTUFBTSxFQUFFZixNQUFNLEVBQ2RnQiwyQkFBMkIsRUFBRSxPQUFPLEVBQUUsRUFDdEM7RUFBRUM7QUFBOEIsQ0FBckIsRUFBRTtFQUFFQSxPQUFPLEVBQUUsT0FBTztBQUFDLENBQUMsQ0FDbEMsRUFBRXRCLEtBQUssQ0FBQ08sU0FBUyxDQUFDO0VBQ2pCLElBQUksVUFBVSxLQUFLLEtBQUssRUFBRTtJQUN4QixPQUFPLElBQUk7RUFDYjtFQUVBLE1BQU1nQixVQUFVLEdBQUdILE1BQU0sQ0FBQ1QsT0FBTyxJQUFJLEVBQUU7RUFDdkMsTUFBTUEsT0FBTyxHQUFHVyxPQUFPLEdBQUdDLFVBQVUsR0FBR2IsZUFBZSxDQUFDYSxVQUFVLENBQUM7RUFDbEUsTUFBTUMsTUFBTSxHQUFHYixPQUFPLEtBQUtZLFVBQVUsR0FBRyxhQUFhLEdBQUcsWUFBWTtFQUVwRSxPQUNFLENBQUMsZUFBZTtBQUNwQixNQUFNLENBQUMsSUFBSTtBQUNYLFFBQVEsQ0FBQ1osT0FBTztBQUNoQixRQUFRLENBQUNhLE1BQU07QUFDZixNQUFNLEVBQUUsSUFBSTtBQUNaLElBQUksRUFBRSxlQUFlLENBQUM7QUFFdEIiLCJpZ25vcmVMaXN0IjpbXX0=