// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js';
// 类型依赖 { Input, Output } 来自 ./ConfigTool.js，用于校准工具调用的数据契约。
import type { Input, Output } from './ConfigTool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(input: Partial<Input>): React.ReactNode {
  // input.setting缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!input.setting) return null;
  // 满足 `input.value === undefined` 时，工具调用执行该分支。
  if (input.value === undefined) {
    // 返回 `<Text dimColor>Getting {input.setting}</Text>`，作为工具调用这次计算的结果。
    return <Text dimColor>Getting {input.setting}</Text>;
  }
  // 返回 `<Text dimColor>`，作为工具调用这次计算的结果。
  return <Text dimColor>
      Setting {input.setting} to {jsonStringify(input.value)}
    </Text>;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(content: Output): React.ReactNode {
  // content.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!content.success) {
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text color="error">Failed: {content.error}</Text>
      </MessageResponse>;
  }
  // 当 `content.operation` 匹配 `'get'` 时，工具调用执行对应分支。
  if (content.operation === 'get') {
    // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
    return <MessageResponse>
        <Text>
          <Text bold>{content.setting}</Text> = {jsonStringify(content.value)}
        </Text>
      </MessageResponse>;
  }
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text>
        Set <Text bold>{content.setting}</Text> to{' '}
        <Text bold>{jsonStringify(content.newValue)}</Text>
      </Text>
    </MessageResponse>;
}
// renderToolUseRejectedMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseRejectedMessage(): React.ReactNode {
  // 返回 `<Text color="warning">Config change rejected</Text>`，作为工具调用这次计算的结果。
  return <Text color="warning">Config change rejected</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsIlRleHQiLCJqc29uU3RyaW5naWZ5IiwiSW5wdXQiLCJPdXRwdXQiLCJyZW5kZXJUb29sVXNlTWVzc2FnZSIsImlucHV0IiwiUGFydGlhbCIsIlJlYWN0Tm9kZSIsInNldHRpbmciLCJ2YWx1ZSIsInVuZGVmaW5lZCIsInJlbmRlclRvb2xSZXN1bHRNZXNzYWdlIiwiY29udGVudCIsInN1Y2Nlc3MiLCJlcnJvciIsIm9wZXJhdGlvbiIsIm5ld1ZhbHVlIiwicmVuZGVyVG9vbFVzZVJlamVjdGVkTWVzc2FnZSJdLCJzb3VyY2VzIjpbIlVJLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL01lc3NhZ2VSZXNwb25zZS5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBqc29uU3RyaW5naWZ5IH0gZnJvbSAnLi4vLi4vdXRpbHMvc2xvd09wZXJhdGlvbnMuanMnXG5pbXBvcnQgdHlwZSB7IElucHV0LCBPdXRwdXQgfSBmcm9tICcuL0NvbmZpZ1Rvb2wuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlTWVzc2FnZShpbnB1dDogUGFydGlhbDxJbnB1dD4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoIWlucHV0LnNldHRpbmcpIHJldHVybiBudWxsXG4gIGlmIChpbnB1dC52YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIDxUZXh0IGRpbUNvbG9yPkdldHRpbmcge2lucHV0LnNldHRpbmd9PC9UZXh0PlxuICB9XG4gIHJldHVybiAoXG4gICAgPFRleHQgZGltQ29sb3I+XG4gICAgICBTZXR0aW5nIHtpbnB1dC5zZXR0aW5nfSB0byB7anNvblN0cmluZ2lmeShpbnB1dC52YWx1ZSl9XG4gICAgPC9UZXh0PlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShjb250ZW50OiBPdXRwdXQpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoIWNvbnRlbnQuc3VjY2Vzcykge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+RmFpbGVkOiB7Y29udGVudC5lcnJvcn08L1RleHQ+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cbiAgaWYgKGNvbnRlbnQub3BlcmF0aW9uID09PSAnZ2V0Jykge1xuICAgIHJldHVybiAoXG4gICAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dCBib2xkPntjb250ZW50LnNldHRpbmd9PC9UZXh0PiA9IHtqc29uU3RyaW5naWZ5KGNvbnRlbnQudmFsdWUpfVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICApXG4gIH1cbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgPFRleHQ+XG4gICAgICAgIFNldCA8VGV4dCBib2xkPntjb250ZW50LnNldHRpbmd9PC9UZXh0PiB0b3snICd9XG4gICAgICAgIDxUZXh0IGJvbGQ+e2pzb25TdHJpbmdpZnkoY29udGVudC5uZXdWYWx1ZSl9PC9UZXh0PlxuICAgICAgPC9UZXh0PlxuICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlUmVqZWN0ZWRNZXNzYWdlKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5Db25maWcgY2hhbmdlIHJlamVjdGVkPC9UZXh0PlxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxlQUFlLFFBQVEscUNBQXFDO0FBQ3JFLFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLFNBQVNDLGFBQWEsUUFBUSwrQkFBK0I7QUFDN0QsY0FBY0MsS0FBSyxFQUFFQyxNQUFNLFFBQVEsaUJBQWlCO0FBRXBELE9BQU8sU0FBU0Msb0JBQW9CQSxDQUFDQyxLQUFLLEVBQUVDLE9BQU8sQ0FBQ0osS0FBSyxDQUFDLENBQUMsRUFBRUosS0FBSyxDQUFDUyxTQUFTLENBQUM7RUFDM0UsSUFBSSxDQUFDRixLQUFLLENBQUNHLE9BQU8sRUFBRSxPQUFPLElBQUk7RUFDL0IsSUFBSUgsS0FBSyxDQUFDSSxLQUFLLEtBQUtDLFNBQVMsRUFBRTtJQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUNMLEtBQUssQ0FBQ0csT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDO0VBQ3REO0VBQ0EsT0FDRSxDQUFDLElBQUksQ0FBQyxRQUFRO0FBQ2xCLGNBQWMsQ0FBQ0gsS0FBSyxDQUFDRyxPQUFPLENBQUMsSUFBSSxDQUFDUCxhQUFhLENBQUNJLEtBQUssQ0FBQ0ksS0FBSyxDQUFDO0FBQzVELElBQUksRUFBRSxJQUFJLENBQUM7QUFFWDtBQUVBLE9BQU8sU0FBU0UsdUJBQXVCQSxDQUFDQyxPQUFPLEVBQUVULE1BQU0sQ0FBQyxFQUFFTCxLQUFLLENBQUNTLFNBQVMsQ0FBQztFQUN4RSxJQUFJLENBQUNLLE9BQU8sQ0FBQ0MsT0FBTyxFQUFFO0lBQ3BCLE9BQ0UsQ0FBQyxlQUFlO0FBQ3RCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUNELE9BQU8sQ0FBQ0UsS0FBSyxDQUFDLEVBQUUsSUFBSTtBQUN6RCxNQUFNLEVBQUUsZUFBZSxDQUFDO0VBRXRCO0VBQ0EsSUFBSUYsT0FBTyxDQUFDRyxTQUFTLEtBQUssS0FBSyxFQUFFO0lBQy9CLE9BQ0UsQ0FBQyxlQUFlO0FBQ3RCLFFBQVEsQ0FBQyxJQUFJO0FBQ2IsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ0gsT0FBTyxDQUFDSixPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDUCxhQUFhLENBQUNXLE9BQU8sQ0FBQ0gsS0FBSyxDQUFDO0FBQzdFLFFBQVEsRUFBRSxJQUFJO0FBQ2QsTUFBTSxFQUFFLGVBQWUsQ0FBQztFQUV0QjtFQUNBLE9BQ0UsQ0FBQyxlQUFlO0FBQ3BCLE1BQU0sQ0FBQyxJQUFJO0FBQ1gsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ0csT0FBTyxDQUFDSixPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUc7QUFDdEQsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ1AsYUFBYSxDQUFDVyxPQUFPLENBQUNJLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSTtBQUMxRCxNQUFNLEVBQUUsSUFBSTtBQUNaLElBQUksRUFBRSxlQUFlLENBQUM7QUFFdEI7QUFFQSxPQUFPLFNBQVNDLDRCQUE0QkEsQ0FBQSxDQUFFLEVBQUVuQixLQUFLLENBQUNTLFNBQVMsQ0FBQztFQUM5RCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDO0FBQzVEIiwiaWdub3JlTGlzdCI6W119