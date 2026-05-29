// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 countCharInString 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { countCharInString } from '../../utils/stringUtils.js';
// 类型依赖 { Input, Output } 来自 ./RemoteTriggerTool.js，用于校准工具调用的数据契约。
import type { Input, Output } from './RemoteTriggerTool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(input: Partial<Input>): React.ReactNode {
  // 返回 ``${input.action ?? ''}${input.trigger_id ? ` ${input.trigger_id}` : ''}``，作为工具调用这次计算的结果。
  return `${input.action ?? ''}${input.trigger_id ? ` ${input.trigger_id}` : ''}`;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(output: Output): React.ReactNode {
  // 文本行统计`countCharInString`，供工具调用后续处理使用。
  const lines = countCharInString(output.json, '\n') + 1;
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text>
        HTTP {output.status} <Text dimColor>({lines} lines)</Text>
      </Text>
    </MessageResponse>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsIlRleHQiLCJjb3VudENoYXJJblN0cmluZyIsIklucHV0IiwiT3V0cHV0IiwicmVuZGVyVG9vbFVzZU1lc3NhZ2UiLCJpbnB1dCIsIlBhcnRpYWwiLCJSZWFjdE5vZGUiLCJhY3Rpb24iLCJ0cmlnZ2VyX2lkIiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJvdXRwdXQiLCJsaW5lcyIsImpzb24iLCJzdGF0dXMiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgY291bnRDaGFySW5TdHJpbmcgfSBmcm9tICcuLi8uLi91dGlscy9zdHJpbmdVdGlscy5qcydcbmltcG9ydCB0eXBlIHsgSW5wdXQsIE91dHB1dCB9IGZyb20gJy4vUmVtb3RlVHJpZ2dlclRvb2wuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlTWVzc2FnZShpbnB1dDogUGFydGlhbDxJbnB1dD4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gYCR7aW5wdXQuYWN0aW9uID8/ICcnfSR7aW5wdXQudHJpZ2dlcl9pZCA/IGAgJHtpbnB1dC50cmlnZ2VyX2lkfWAgOiAnJ31gXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShvdXRwdXQ6IE91dHB1dCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGxpbmVzID0gY291bnRDaGFySW5TdHJpbmcob3V0cHV0Lmpzb24sICdcXG4nKSArIDFcbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgPFRleHQ+XG4gICAgICAgIEhUVFAge291dHB1dC5zdGF0dXN9IDxUZXh0IGRpbUNvbG9yPih7bGluZXN9IGxpbmVzKTwvVGV4dD5cbiAgICAgIDwvVGV4dD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxlQUFlLFFBQVEscUNBQXFDO0FBQ3JFLFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLFNBQVNDLGlCQUFpQixRQUFRLDRCQUE0QjtBQUM5RCxjQUFjQyxLQUFLLEVBQUVDLE1BQU0sUUFBUSx3QkFBd0I7QUFFM0QsT0FBTyxTQUFTQyxvQkFBb0JBLENBQUNDLEtBQUssRUFBRUMsT0FBTyxDQUFDSixLQUFLLENBQUMsQ0FBQyxFQUFFSixLQUFLLENBQUNTLFNBQVMsQ0FBQztFQUMzRSxPQUFPLEdBQUdGLEtBQUssQ0FBQ0csTUFBTSxJQUFJLEVBQUUsR0FBR0gsS0FBSyxDQUFDSSxVQUFVLEdBQUcsSUFBSUosS0FBSyxDQUFDSSxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUU7QUFDakY7QUFFQSxPQUFPLFNBQVNDLHVCQUF1QkEsQ0FBQ0MsTUFBTSxFQUFFUixNQUFNLENBQUMsRUFBRUwsS0FBSyxDQUFDUyxTQUFTLENBQUM7RUFDdkUsTUFBTUssS0FBSyxHQUFHWCxpQkFBaUIsQ0FBQ1UsTUFBTSxDQUFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztFQUN0RCxPQUNFLENBQUMsZUFBZTtBQUNwQixNQUFNLENBQUMsSUFBSTtBQUNYLGFBQWEsQ0FBQ0YsTUFBTSxDQUFDRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDRixLQUFLLENBQUMsT0FBTyxFQUFFLElBQUk7QUFDakUsTUFBTSxFQUFFLElBQUk7QUFDWixJQUFJLEVBQUUsZUFBZSxDQUFDO0FBRXRCIiwiaWdub3JlTGlzdCI6W119