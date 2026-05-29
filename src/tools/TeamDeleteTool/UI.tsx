// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js';
// 类型依赖 { Output } 来自 ./TeamDeleteTool.js，用于校准工具调用的数据契约。
import type { Output } from './TeamDeleteTool.js';
// renderToolUseMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolUseMessage(_input: Record<string, unknown>): React.ReactNode {
  // 返回 `'cleanup team: current'`，作为工具调用这次计算的结果。
  return 'cleanup team: current';
}
// renderToolResultMessage 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function renderToolResultMessage(content: Output | string, _progressMessages: unknown, {
  verbose: _verbose
}: {
  verbose: boolean;
}): React.ReactNode {
  // 结果标记工具实现 UI是否启用对应路径。
  const result: Output = typeof content === 'string' ? jsonParse(content) : content;

  // Suppress cleanup result - the batched shutdown message covers this
  // 只有 `'success' in result && 'team_name' in result && '` 满足时，工具调用才执行该分支。
  if ('success' in result && 'team_name' in result && 'message' in result) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null;
  }
  // 返回 `null`，作为工具调用这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImpzb25QYXJzZSIsIk91dHB1dCIsInJlbmRlclRvb2xVc2VNZXNzYWdlIiwiX2lucHV0IiwiUmVjb3JkIiwiUmVhY3ROb2RlIiwicmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UiLCJjb250ZW50IiwiX3Byb2dyZXNzTWVzc2FnZXMiLCJ2ZXJib3NlIiwiX3ZlcmJvc2UiLCJyZXN1bHQiXSwic291cmNlcyI6WyJVSS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsganNvblBhcnNlIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2xvd09wZXJhdGlvbnMuanMnXG5pbXBvcnQgdHlwZSB7IE91dHB1dCB9IGZyb20gJy4vVGVhbURlbGV0ZVRvb2wuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUb29sVXNlTWVzc2FnZShcbiAgX2lucHV0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAnY2xlYW51cCB0ZWFtOiBjdXJyZW50J1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVG9vbFJlc3VsdE1lc3NhZ2UoXG4gIGNvbnRlbnQ6IE91dHB1dCB8IHN0cmluZyxcbiAgX3Byb2dyZXNzTWVzc2FnZXM6IHVua25vd24sXG4gIHsgdmVyYm9zZTogX3ZlcmJvc2UgfTogeyB2ZXJib3NlOiBib29sZWFuIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCByZXN1bHQ6IE91dHB1dCA9XG4gICAgdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnID8ganNvblBhcnNlKGNvbnRlbnQpIDogY29udGVudFxuXG4gIC8vIFN1cHByZXNzIGNsZWFudXAgcmVzdWx0IC0gdGhlIGJhdGNoZWQgc2h1dGRvd24gbWVzc2FnZSBjb3ZlcnMgdGhpc1xuICBpZiAoJ3N1Y2Nlc3MnIGluIHJlc3VsdCAmJiAndGVhbV9uYW1lJyBpbiByZXN1bHQgJiYgJ21lc3NhZ2UnIGluIHJlc3VsdCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gbnVsbFxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxTQUFTLFFBQVEsK0JBQStCO0FBQ3pELGNBQWNDLE1BQU0sUUFBUSxxQkFBcUI7QUFFakQsT0FBTyxTQUFTQyxvQkFBb0JBLENBQ2xDQyxNQUFNLEVBQUVDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQ2hDLEVBQUVMLEtBQUssQ0FBQ00sU0FBUyxDQUFDO0VBQ2pCLE9BQU8sdUJBQXVCO0FBQ2hDO0FBRUEsT0FBTyxTQUFTQyx1QkFBdUJBLENBQ3JDQyxPQUFPLEVBQUVOLE1BQU0sR0FBRyxNQUFNLEVBQ3hCTyxpQkFBaUIsRUFBRSxPQUFPLEVBQzFCO0VBQUVDLE9BQU8sRUFBRUM7QUFBK0IsQ0FBckIsRUFBRTtFQUFFRCxPQUFPLEVBQUUsT0FBTztBQUFDLENBQUMsQ0FDNUMsRUFBRVYsS0FBSyxDQUFDTSxTQUFTLENBQUM7RUFDakIsTUFBTU0sTUFBTSxFQUFFVixNQUFNLEdBQ2xCLE9BQU9NLE9BQU8sS0FBSyxRQUFRLEdBQUdQLFNBQVMsQ0FBQ08sT0FBTyxDQUFDLEdBQUdBLE9BQU87O0VBRTVEO0VBQ0EsSUFBSSxTQUFTLElBQUlJLE1BQU0sSUFBSSxXQUFXLElBQUlBLE1BQU0sSUFBSSxTQUFTLElBQUlBLE1BQU0sRUFBRTtJQUN2RSxPQUFPLElBQUk7RUFDYjtFQUVBLE9BQU8sSUFBSTtBQUNiIiwiaWdub3JlTGlzdCI6W119