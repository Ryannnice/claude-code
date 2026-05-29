// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// 类型依赖 { CreateOutput } 来自 ./CronCreateTool.js，用于校准工具调用的数据契约。
import type { CreateOutput } from './CronCreateTool.js';
// 类型依赖 { DeleteOutput } 来自 ./CronDeleteTool.js，用于校准工具调用的数据契约。
import type { DeleteOutput } from './CronDeleteTool.js';
// 类型依赖 { ListOutput } 来自 ./CronListTool.js，用于校准工具调用的数据契约。
import type { ListOutput } from './CronListTool.js';

// --- CronCreate -------------------------------------------------------------

// renderCreateToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderCreateToolUseMessage(input: Partial<{
  cron: string;
  prompt: string;
}>): React.ReactNode {
  // 返回 ``${input.cron ?? ''}${input.prompt ? `: ${truncate(input.prompt, 60, tr...`，作为工具调用这次计算的结果。
  return `${input.cron ?? ''}${input.prompt ? `: ${truncate(input.prompt, 60, true)}` : ''}`;
}
// renderCreateResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderCreateResultMessage(output: CreateOutput): React.ReactNode {
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text>
        Scheduled <Text bold>{output.id}</Text>{' '}
        <Text dimColor>({output.humanSchedule})</Text>
      </Text>
    </MessageResponse>;
}

// --- CronDelete -------------------------------------------------------------

// renderDeleteToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderDeleteToolUseMessage(input: Partial<{
  id: string;
}>): React.ReactNode {
  // 返回 `input.id ?? ''`，作为工具调用这次计算的结果。
  return input.id ?? '';
}
// renderDeleteResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderDeleteResultMessage(output: DeleteOutput): React.ReactNode {
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text>
        Cancelled <Text bold>{output.id}</Text>
      </Text>
    </MessageResponse>;
}

// --- CronList ---------------------------------------------------------------

// renderListToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderListToolUseMessage(): React.ReactNode {
  // 返回空字符串表示没有可用文本，调用方会按空输入处理。
  return '';
}
// renderListResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderListResultMessage(output: ListOutput): React.ReactNode {
  // output.jobs 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (output.jobs.length === 0) {
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text dimColor>No scheduled jobs</Text>
      </MessageResponse>;
  }
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      {/* 这个回调绑定到 {output.jobs.map(j => <Text key={j.id}>，负责工具调用在该局部场景下的响应。 */}
      {output.jobs.map(j => <Text key={j.id}>
          <Text bold>{j.id}</Text> <Text dimColor>{j.humanSchedule}</Text>
        </Text>)}
    </MessageResponse>;
}

// --- Shared -----------------------------------------------------------------
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsIlRleHQiLCJ0cnVuY2F0ZSIsIkNyZWF0ZU91dHB1dCIsIkRlbGV0ZU91dHB1dCIsIkxpc3RPdXRwdXQiLCJyZW5kZXJDcmVhdGVUb29sVXNlTWVzc2FnZSIsImlucHV0IiwiUGFydGlhbCIsImNyb24iLCJwcm9tcHQiLCJSZWFjdE5vZGUiLCJyZW5kZXJDcmVhdGVSZXN1bHRNZXNzYWdlIiwib3V0cHV0IiwiaWQiLCJodW1hblNjaGVkdWxlIiwicmVuZGVyRGVsZXRlVG9vbFVzZU1lc3NhZ2UiLCJyZW5kZXJEZWxldGVSZXN1bHRNZXNzYWdlIiwicmVuZGVyTGlzdFRvb2xVc2VNZXNzYWdlIiwicmVuZGVyTGlzdFJlc3VsdE1lc3NhZ2UiLCJqb2JzIiwibGVuZ3RoIiwibWFwIiwiaiJdLCJzb3VyY2VzIjpbIlVJLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB0cnVuY2F0ZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB0eXBlIHsgQ3JlYXRlT3V0cHV0IH0gZnJvbSAnLi9Dcm9uQ3JlYXRlVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgRGVsZXRlT3V0cHV0IH0gZnJvbSAnLi9Dcm9uRGVsZXRlVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgTGlzdE91dHB1dCB9IGZyb20gJy4vQ3Jvbkxpc3RUb29sLmpzJ1xuXG4vLyAtLS0gQ3JvbkNyZWF0ZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDcmVhdGVUb29sVXNlTWVzc2FnZShcbiAgaW5wdXQ6IFBhcnRpYWw8eyBjcm9uOiBzdHJpbmc7IHByb21wdDogc3RyaW5nIH0+LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIGAke2lucHV0LmNyb24gPz8gJyd9JHtpbnB1dC5wcm9tcHQgPyBgOiAke3RydW5jYXRlKGlucHV0LnByb21wdCwgNjAsIHRydWUpfWAgOiAnJ31gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDcmVhdGVSZXN1bHRNZXNzYWdlKFxuICBvdXRwdXQ6IENyZWF0ZU91dHB1dCxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZT5cbiAgICAgIDxUZXh0PlxuICAgICAgICBTY2hlZHVsZWQgPFRleHQgYm9sZD57b3V0cHV0LmlkfTwvVGV4dD57JyAnfVxuICAgICAgICA8VGV4dCBkaW1Db2xvcj4oe291dHB1dC5odW1hblNjaGVkdWxlfSk8L1RleHQ+XG4gICAgICA8L1RleHQ+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cblxuLy8gLS0tIENyb25EZWxldGUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVsZXRlVG9vbFVzZU1lc3NhZ2UoXG4gIGlucHV0OiBQYXJ0aWFsPHsgaWQ6IHN0cmluZyB9Pixcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiBpbnB1dC5pZCA/PyAnJ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRGVsZXRlUmVzdWx0TWVzc2FnZShcbiAgb3V0cHV0OiBEZWxldGVPdXRwdXQsXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICA8VGV4dD5cbiAgICAgICAgQ2FuY2VsbGVkIDxUZXh0IGJvbGQ+e291dHB1dC5pZH08L1RleHQ+XG4gICAgICA8L1RleHQ+XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cblxuLy8gLS0tIENyb25MaXN0IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyTGlzdFRvb2xVc2VNZXNzYWdlKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAnJ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyTGlzdFJlc3VsdE1lc3NhZ2Uob3V0cHV0OiBMaXN0T3V0cHV0KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKG91dHB1dC5qb2JzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5ObyBzY2hlZHVsZWQgam9iczwvVGV4dD5cbiAgICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICAgIClcbiAgfVxuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2U+XG4gICAgICB7b3V0cHV0LmpvYnMubWFwKGogPT4gKFxuICAgICAgICA8VGV4dCBrZXk9e2ouaWR9PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+e2ouaWR9PC9UZXh0PiA8VGV4dCBkaW1Db2xvcj57ai5odW1hblNjaGVkdWxlfTwvVGV4dD5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKSl9XG4gICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gIClcbn1cblxuLy8gLS0tIFNoYXJlZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxlQUFlLFFBQVEscUNBQXFDO0FBQ3JFLFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLFNBQVNDLFFBQVEsUUFBUSx1QkFBdUI7QUFDaEQsY0FBY0MsWUFBWSxRQUFRLHFCQUFxQjtB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