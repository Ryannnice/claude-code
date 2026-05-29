// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js';
// 类型依赖 { Input, SendMessageToolOutput } 来自 ./SendMessageTool.js，用于校准工具调用的数据契约。
import type { Input, SendMessageToolOutput } from './SendMessageTool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(input: Partial<Input>): React.ReactNode {
  // `typeof input.message` 与 `'object' || input.messag` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof input.message !== 'object' || input.message === null) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 当 `input.message.type` 匹配 `'plan_approval_response'` 时，工具调用执行对应分支。
  if (input.message.type === 'plan_approval_response') {
    // 返回 `input.message.approve ? `approve plan from: ${input.to}` : `reject plan...`，作为工具调用这次计算的结果。
    return input.message.approve ? `approve plan from: ${input.to}` : `reject plan from: ${input.to}`;
  }
  // 返回 `null`，作为工具调用这次计算的结果。
  return null;
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(content: SendMessageToolOutput | string, _progressMessages: unknown, {
  verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 结果标记工具实现 UI是否启用对应路径。
  const result: SendMessageToolOutput = typeof content === 'string' ? jsonParse(content) : content;
  // 只有 `'routing' in result && result.routing` 满足时，工具调用才执行该分支。
  if ('routing' in result && result.routing) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 只有 `'request_id' in result && 'target' in result` 满足时，工具调用才执行该分支。
  if ('request_id' in result && 'target' in result) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 返回 `<MessageResponse>`，作为工具调用这次计算的结果。
  return <MessageResponse>
      <Text dimColor>{result.message}</Text>
    </MessageResponse>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsIlRleHQiLCJqc29uUGFyc2UiLCJJbnB1dCIsIlNlbmRNZXNzYWdlVG9vbE91dHB1dCIsInJlbmRlclRvb2xVc2VNZXNzYWdlIiwiaW5wdXQiLCJQYXJ0aWFsIiwiUmVhY3ROb2RlIiwibWVzc2FnZSIsInR5cGUiLCJhcHByb3ZlIiwidG8iLCJyZW5kZXJUb29sUmVzdWx0TWVzc2FnZSIsImNvbnRlbnQiLCJfcHJvZ3Jlc3NNZXNzYWdlcyIsInZlcmJvc2UiLCJyZXN1bHQiLCJyb3V0aW5nIl0sInNvdXJjZXMiOlsiVUkudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IE1lc3NhZ2VSZXNwb25zZSB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGpzb25QYXJzZSB9IGZyb20gJy4uLy4uL3V0aWxzL3Nsb3dPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHR5cGUgeyBJbnB1dCwgU2VuZE1lc3NhZ2VUb29sT3V0cHV0IH0gZnJvbSAnLi9TZW5kTWVzc2FnZVRvb2wuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlTWVzc2FnZShpbnB1dDogUGFydGlhbDxJbnB1dD4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAodHlwZW9mIGlucHV0Lm1lc3NhZ2UgIT09ICdvYmplY3QnIHx8IGlucHV0Lm1lc3NhZ2UgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmIChpbnB1dC5tZXNzYWdlLnR5cGUgPT09ICdwbGFuX2FwcHJvdmFsX3Jlc3BvbnNlJykge1xuICAgIHJldHVybiBpbnB1dC5tZXNzYWdlLmFwcHJvdmVcbiAgICAgID8gYGFwcHJvdmUgcGxhbiBmcm9tOiAke2lucHV0LnRvfWBcbiAgICAgIDogYHJlamVjdCBwbGFuIGZyb206ICR7aW5wdXQudG99YFxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShcbiAgY29udGVudDogU2VuZE1lc3NhZ2VUb29sT3V0cHV0IHwgc3RyaW5nLFxuICBfcHJvZ3Jlc3NNZXNzYWdlczogdW5rbm93bixcbiAgeyB2ZXJib3NlIH06IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcmVzdWx0OiBTZW5kTWVzc2FnZVRvb2xPdXRwdXQgPVxuICAgIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGpzb25QYXJzZShjb250ZW50KSA6IGNvbnRlbnRcblxuICBpZiAoJ3JvdXRpbmcnIGluIHJlc3VsdCAmJiByZXN1bHQucm91dGluZykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBpZiAoJ3JlcXVlc3RfaWQnIGluIHJlc3VsdCAmJiAndGFyZ2V0JyBpbiByZXN1bHQpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlPlxuICAgICAgPFRleHQgZGltQ29sb3I+e3Jlc3VsdC5tZXNzYWdlfTwvVGV4dD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxlQUFlLFFBQVEscUNBQXFDO0FBQ3JFLFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLFNBQVNDLFNBQVMsUUFBUSwrQkFBK0I7QUFDekQsY0FBY0MsS0FBSyxFQUFFQyxxQkFBcUIsUUFBUSxzQkFBc0I7QUFFeEUsT0FBTyxTQUFTQyxvQkFBb0JBLENBQUNDLEtBQUssRUFBRUMsT0FBTyxDQUFDSixLQUFLLENBQUMsQ0FBQyxFQUFFSixLQUFLLENBQUNTLFNBQVMsQ0FBQztFQUMzRSxJQUFJLE9BQU9GLEtBQUssQ0FBQ0csT0FBTyxLQUFLLFFBQVEsSUFBSUgsS0FBSyxDQUFDRyxPQUFPLEtBQUssSUFBSSxFQUFFO0lBQy9ELE9BQU8sSUFBSTtFQUNiO0VBQ0EsSUFBSUgsS0FBSyxDQUFDRyxPQUFPLENBQUNDLElBQUksS0FBSyx3QkFBd0IsRUFBRTtJQUNuRCxPQUFPSixLQUFLLENBQUNHLE9BQU8sQ0FBQ0UsT0FBTyxHQUN4QixzQkFBc0JMLEtBQUssQ0FBQ00sRUFBRSxFQUFFLEdBQ2hDLHFCQUFxQk4sS0FBSyxDQUFDTSxFQUFFLEVBQUU7RUFDckM7RUFDQSxPQUFPLElBQUk7QUFDYjtBQUVBLE9BQU8sU0FBU0MsdUJBQXVCQSxDQUNyQ0MsT0FBTyxFQUFFVixxQkFBcUIsR0FBRyxNQUFNLEVBQ3ZDVyxpQkFBaUIsRUFBRSxPQUFPLEVBQzFCO0VBQUVDO0FBQThCLENBQXJCLEVBQUU7RUFBRUEsT0FBTyxFQUFFLE9BQU87QUFBQyxDQUFDLENBQ2xDLEVBQUVqQixLQUFLLENBQUNTLFNBQVMsQ0FBQztFQUNqQixNQUFNUyxNQUFNLEVBQUViLHFCQUFxQixHQUNqQyxPQUFPVSxPQUFPLEtBQUssUUFBUSxHQUFHWixTQUFTLENBQUNZLE9BQU8sQ0FBQyxHQUFHQSxPQUFPO0VBRTVELElBQUksU0FBUyxJQUFJRyxNQUFNLElBQUlBLE1BQU0sQ0FBQ0MsT0FBTyxFQUFFO0lBQ3pDLE9BQU8sSUFBSTtFQUNiO0VBRUEsSUFBSSxZQUFZLElBQUlELE1BQU0sSUFBSSxRQUFRLElBQUlBLE1BQU0sRUFBRTtJQUNoRCxPQUFPLElBQUk7RUFDYjtFQUVBLE9BQ0UsQ0FBQyxlQUFlO0FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUNBLE1BQU0sQ0FBQ1IsT0FBTyxDQUFDLEVBQUUsSUFBSTtBQUMzQyxJQUFJLEVBQUUsZUFBZSxDQUFDO0FBRXRCIiwiaWdub3JlTGlzdCI6W119