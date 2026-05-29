// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from '../../components/MessageResponse.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 引入 truncateToWidth，将 ../format.js 中已经封装好的能力接到本文件流程里。
import { truncateToWidth } from '../format.js';
// 类型依赖 { MCPToolResult } 来自 ../mcpValidation.js，用于校准共享工具的数据契约。
import type { MCPToolResult } from '../mcpValidation.js';
// CuToolInput 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type CuToolInput = Record<string, unknown> & {
  coordinate?: [number, number];
  start_coordinate?: [number, number];
  text?: string;
  apps?: Array<{
    displayName?: string;
  }>;
  region?: [number, number, number, number];
  direction?: string;
  amount?: number;
  duration?: number;
};
// fmtCoord 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function fmtCoord(c: [number, number] | undefined): string {
  // 返回 `c ? `(${c[0]}, ${c[1]})` : ''`，作为共享工具这次计算的结果。
  return c ? `(${c[0]}, ${c[1]})` : '';
}
// RESULT_SUMMARY 集中保存共享工具 tool Rendering要一起传递的字段。
const RESULT_SUMMARY: Readonly<Partial<Record<string, string>>> = {
  screenshot: 'Captured',
  zoom: 'Captured',
  request_access: 'Access updated',
  left_click: 'Clicked',
  right_click: 'Clicked',
  middle_click: 'Clicked',
  double_click: 'Clicked',
  triple_click: 'Clicked',
  type: 'Typed',
  key: 'Pressed',
  hold_key: 'Pressed',
  scroll: 'Scrolled',
  left_click_drag: 'Dragged',
  open_application: 'Opened'
};

/**
 * Rendering overrides for `mcp__computer-use__*` tools. Spread into the MCP
 * tool object in `client.ts` after the default `userFacingName`, so these win.
 * Mirror of `getClaudeInChromeMCPToolOverrides`.
 */
// getComputerUseMCPRenderingOverrides 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getComputerUseMCPRenderingOverrides(toolName: string): {
  // 这个回调绑定到 userFacingName: () => string;，负责共享工具在该局部场景下的响应。
  userFacingName: () => string;
  renderToolUseMessage: (input: Record<string, unknown>, options: {
    verbose: boolean;
  }) => React.ReactNode;
  renderToolResultMessage: (output: MCPToolResult, progressMessages: unknown[], options: {
    verbose: boolean;
  }) => React.ReactNode;
} {
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    // userFacingName 使用 无 完成共享工具里的对应操作。
    userFacingName() {
      // 返回 ``Computer Use[${toolName}]``，作为共享工具这次计算的结果。
      return `Computer Use[${toolName}]`;
    },
    // AssistantToolUseMessage.tsx contract: null hides the ENTIRE row, '' shows
    // the tool name without "(args)". Every path below returns '' when there's
    // nothing to show — never null.
    // renderToolUseMessage 使用 input: CuToolInput 完成共享工具里的对应操作。
    renderToolUseMessage(input: CuToolInput) {
      // 按照 toolName 的取值选择共享工具的具体处理分支。
      switch (toolName) {
        case 'screenshot':
        case 'left_mouse_down':
        case 'left_mouse_up':
        case 'cursor_position':
        case 'list_granted_applications':
        case 'read_clipboard':
          // 返回空字符串表示没有可用文本，调用方会按空输入处理。
          return '';
        case 'left_click':
        case 'right_click':
        case 'middle_click':
        case 'double_click':
        case 'triple_click':
        case 'mouse_move':
          // 返回 `fmtCoord(input.coordinate)`，作为共享工具这次计算的结果。
          return fmtCoord(input.coordinate);
        case 'left_click_drag':
          // 返回 `input.start_coordinate ? `${fmtCoord(input.start_coordinate)} → ${fmtCo...`，作为共享工具这次计算的结果。
          return input.start_coordinate ? `${fmtCoord(input.start_coordinate)} → ${fmtCoord(input.coordinate)}` : `to ${fmtCoord(input.coordinate)}`;
        case 'type':
          // 返回 `typeof input.text === 'string' ? `"${truncateToWidth(input.text, 40)}"`...`，作为共享工具这次计算的结果。
          return typeof input.text === 'string' ? `"${truncateToWidth(input.text, 40)}"` : '';
        case 'key':
        case 'hold_key':
          // 返回 `typeof input.text === 'string' ? input.text : ''`，作为共享工具这次计算的结果。
          return typeof input.text === 'string' ? input.text : '';
        case 'scroll':
          // 返回列表结果，保留共享工具已经排好的条目顺序。
          return [input.direction, input.amount && `×${input.amount}`, input.coordinate && `at ${fmtCoord(input.coordinate)}`].filter(Boolean).join(' ');
        case 'zoom':
          {
            // r 命名 `input.region`，让后续代码直接表达这个值的用途。
            const r = input.region;
            // 返回 `Array.isArray(r) && r.length === 4 ? `[${r[0]}, ${r[1]}, ${r[2]}, ${r[3...`，作为共享工具这次计算的结果。
            return Array.isArray(r) && r.length === 4 ? `[${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}]` : '';
          }
        case 'wait':
          // 返回 `typeof input.duration === 'number' ? `${input.duration}s` : ''`，作为共享工具这次计算的结果。
          return typeof input.duration === 'number' ? `${input.duration}s` : '';
        case 'write_clipboard':
          // 返回 `typeof input.text === 'string' ? `"${truncateToWidth(input.text, 40)}"`...`，作为共享工具这次计算的结果。
          return typeof input.text === 'string' ? `"${truncateToWidth(input.text, 40)}"` : '';
        case 'open_application':
          // 返回 `typeof input.bundle_id === 'string' ? String(input.bundle_id) : ''`，作为共享工具这次计算的结果。
          return typeof input.bundle_id === 'string' ? String(input.bundle_id) : '';
        case 'request_access':
          {
            // apps 集合 命名 `input.apps`，让后续代码直接表达这个值的用途。
            const apps = input.apps;
            // 满足 `!Array.isArray(apps)` 时，共享工具执行该分支。
            if (!Array.isArray(apps)) return '';
            // names 集合派生`apps.map`，供共享工具后续处理使用。
            const names = apps.map(a => typeof a?.displayName === 'string' ? a.displayName : '').filter(Boolean);
            // 返回 `names.join(', ')`，作为共享工具这次计算的结果。
            return names.join(', ');
          }
        case 'computer_batch':
          {
            // actions 集合保存`input.actions`，供后续判断或组装使用。
            const actions = input.actions;
            // 返回 `Array.isArray(actions) ? `${actions.length} actions` : ''`，作为共享工具这次计算的结果。
            return Array.isArray(actions) ? `${actions.length} actions` : '';
          }
        default:
          // 返回空字符串表示没有可用文本，调用方会按空输入处理。
          return '';
      }
    },
    // 调用 renderToolResultMessage，触发共享工具此处需要的副作用。
    renderToolResultMessage(output, _progress, {
      verbose
    }) {
      // `verbose || typeof output` 与 `'object' || output === null` 不一致时刷新派生状态，避免使用过期结果。
      if (verbose || typeof output !== 'object' || output === null) return null;

      // Non-verbose: one-line dim summary, like Chrome's pattern.
      // summary保存`RESULT_SUMMARY[toolName]`，供共享工具 tool Rendering后续判断或输出使用。
      const summary = RESULT_SUMMARY[toolName];
      // summary缺失时直接走兜底路径，避免共享工具使用无效输入。
      if (!summary) return null;
      // 返回 `<MessageResponse height={1}>`，作为共享工具这次计算的结果。
      return <MessageResponse height={1}>
          <Text dimColor>{summary}</Text>
        </MessageResponse>;
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1lc3NhZ2VSZXNwb25zZSIsIlRleHQiLCJ0cnVuY2F0ZVRvV2lkdGgiLCJNQ1BUb29sUmVzdWx0IiwiQ3VUb29sSW5wdXQiLCJSZWNvcmQiLCJjb29yZGluYXRlIiwic3RhcnRfY29vcmRpbmF0ZSIsInRleHQiLCJhcHBzIiwiQXJyYXkiLCJkaXNwbGF5TmFtZSIsInJlZ2lvbiIsImRpcmVjdGlvbiIsImFtb3VudCIsImR1cmF0aW9uIiwiZm10Q29vcmQiLCJjIiwiUkVTVUxUX1NVTU1BUlkiLCJSZWFkb25seSIsIlBhcnRpYWwiLCJzY3JlZW5zaG90Iiwiem9vbSIsInJlcXVlc3RfYWNjZXNzIiwibGVmdF9jbGljayIsInJpZ2h0X2NsaWNrIiwibWlkZGxlX2NsaWNrIiwiZG91YmxlX2NsaWNrIiwidHJpcGxlX2NsaWNrIiwidHlwZSIsImtleSIsImhvbGRfa2V5Iiwic2Nyb2xsIiwibGVmdF9jbGlja19kcmFnIiwib3Blbl9hcHBsaWNhdGlvbiIsImdldENvbXB1dGVyVXNlTUNQUmVuZGVyaW5nT3ZlcnJpZGVzIiwidG9vbE5hbWUiLCJ1c2VyRmFjaW5nTmFtZSIsInJlbmRlclRvb2xVc2VNZXNzYWdlIiwiaW5wdXQiLCJvcHRpb25zIiwidmVyYm9zZSIsIlJlYWN0Tm9kZSIsInJlbmRlclRvb2xSZXN1bHRNZXNzYWdlIiwib3V0cHV0IiwicHJvZ3Jlc3NNZXNzYWdlcyIsImZpbHRlciIsIkJvb2xlYW4iLCJqb2luIiwiciIsImlzQXJyYXkiLCJsZW5ndGgiLCJidW5kbGVfaWQiLCJTdHJpbmciLCJuYW1lcyIsIm1hcCIsImEiLCJhY3Rpb25zIiwiX3Byb2dyZXNzIiwic3VtbWFyeSJdLCJzb3VyY2VzIjpbInRvb2xSZW5kZXJpbmcudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGVUb1dpZHRoIH0gZnJvbSAnLi4vZm9ybWF0LmpzJ1xuaW1wb3J0IHR5cGUgeyBNQ1BUb29sUmVzdWx0IH0gZnJvbSAnLi4vbWNwVmFsaWRhdGlvbi5qcydcblxudHlwZSBDdVRvb2xJbnB1dCA9IFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYge1xuICBjb29yZGluYXRlPzogW251bWJlciwgbnVtYmVyXVxuICBzdGFydF9jb29yZGluYXRlPzogW251bWJlciwgbnVtYmVyXVxuICB0ZXh0Pzogc3RyaW5nXG4gIGFwcHM/OiBBcnJheTx7IGRpc3BsYXlOYW1lPzogc3RyaW5nIH0+XG4gIHJlZ2lvbj86IFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gIGRpcmVjdGlvbj86IHN0cmluZ1xuICBhbW91bnQ/OiBudW1iZXJcbiAgZHVyYXRpb24/OiBudW1iZXJcbn1cblxuZnVuY3Rpb24gZm10Q29vcmQoYzogW251bWJlciwgbnVtYmVyXSB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIHJldHVybiBjID8gYCgke2NbMF19LCAke2NbMV19KWAgOiAnJ1xufVxuXG5jb25zdCBSRVNVTFRfU1VNTUFSWTogUmVhZG9ubHk8UGFydGlhbDxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+Pj4gPSB7XG4gIHNjcmVlbnNob3Q6ICdDYXB0dXJlZCcsXG4gIHpvb206ICdDYXB0dXJlZCcsXG4gIHJlcXVlc3RfYWNjZXNzOiAnQWNjZXNzIHVwZGF0ZWQnLFxuICBsZWZ0X2NsaWNrOiAnQ2xpY2tlZCcsXG4gIHJpZ2h0X2NsaWNrOiAnQ2xpY2tlZCcsXG4gIG1pZGRsZV9jbGljazogJ0NsaWNrZWQnLFxuICBkb3VibGVfY2xpY2s6ICdDbGlja2VkJyxcbiAgdHJpcGxlX2NsaWNrOiAnQ2xpY2tlZCcsXG4gIHR5cGU6ICdUeXBlZCcsXG4gIGtleTogJ1ByZXNzZWQnLFxuICBob2xkX2tleTogJ1ByZXNzZWQnLFxuICBzY3JvbGw6ICdTY3JvbGxlZCcsXG4gIGxlZnRfY2xpY2tfZHJhZzogJ0RyYWdnZWQnLFxuICBvcGVuX2FwcGxpY2F0aW9uOiAnT3BlbmVkJyxcbn1cblxuLyoqXG4gKiBSZW5kZXJpbmcgb3ZlcnJpZGVzIGZvciBgbWNwX19jb21wdXRlci11c2VfXypgIHRvb2xzLiBTcHJlYWQgaW50byB0aGUgTUNQXG4gKiB0b29sIG9iamVjdCBpbiBgY2xpZW50LnRzYCBhZnRlciB0aGUgZGVmYXVsdCBgdXNlckZhY2luZ05hbWVgLCBzbyB0aGVzZSB3aW4uXG4gKiBNaXJyb3Igb2YgYGdldENsYXVkZUluQ2hyb21lTUNQVG9vbE92ZXJyaWRlc2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wdXRlclVzZU1DUFJlbmRlcmluZ092ZXJyaWRlcyh0b29sTmFtZTogc3RyaW5nKToge1xuICB1c2VyRmFjaW5nTmFtZTogKCkgPT4gc3RyaW5nXG4gIHJlbmRlclRvb2xVc2VNZXNzYWdlOiAoXG4gICAgaW5wdXQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIG9wdGlvbnM6IHsgdmVyYm9zZTogYm9vbGVhbiB9LFxuICApID0+IFJlYWN0LlJlYWN0Tm9kZVxuICByZW5kZXJUb29sUmVzdWx0TWVzc2FnZTogKFxuICAgIG91dHB1dDogTUNQVG9vbFJlc3VsdCxcbiAgICBwcm9ncmVzc01lc3NhZ2VzOiB1bmtub3duW10sXG4gICAgb3B0aW9uczogeyB2ZXJib3NlOiBib29sZWFuIH0sXG4gICkgPT4gUmVhY3QuUmVhY3ROb2RlXG59IHtcbiAgcmV0dXJuIHtcbiAgICB1c2VyRmFjaW5nTmFtZSgpIHtcbiAgICAgIHJldHVybiBgQ29tcHV0ZXIgVXNlWyR7dG9vbE5hbWV9XWBcbiAgICB9LFxuXG4gICAgLy8gQXNzaXN0YW50VG9vbFVzZU1lc3NhZ2UudHN4IGNvbnRyYWN0OiBudWxsIGhpZGVzIHRoZSBFTlRJUkUgcm93LCAnJyBzaG93c1xuICAgIC8vIHRoZSB0b29sIG5hbWUgd2l0aG91dCBcIihhcmdzKVwiLiBFdmVyeSBwYXRoIGJlbG93IHJldHVybnMgJycgd2hlbiB0aGVyZSdzXG4gICAgLy8gbm90aGluZyB0byBzaG93IOKAlCBuZXZlciBudWxsLlxuICAgIHJlbmRlclRvb2xVc2VNZXNzYWdlKGlucHV0OiBDdVRvb2xJbnB1dCkge1xuICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICBjYXNlICdzY3JlZW5zaG90JzpcbiAgICAgICAgY2FzZSAnbGVmdF9tb3VzZV9kb3duJzpcbiAgICAgICAgY2FzZSAnbGVmdF9tb3VzZV91cCc6XG4gICAgICAgIGNhc2UgJ2N1cnNvcl9wb3NpdGlvbic6XG4gICAgICAgIGNhc2UgJ2xpc3RfZ3JhbnRlZF9hcHBsaWNhdGlvbnMnOlxuICAgICAgICBjYXNlICdyZWFkX2NsaXBib2FyZCc6XG4gICAgICAgICAgcmV0dXJuICcnXG5cbiAgICAgICAgY2FzZSAnbGVmdF9jbGljayc6XG4gICAgICAgIGNhc2UgJ3JpZ2h0X2NsaWNrJzpcbiAgICAgICAgY2FzZSAnbWlkZGxlX2NsaWNrJzpcbiAgICAgICAgY2FzZSAnZG91YmxlX2NsaWNrJzpcbiAgICAgICAgY2FzZSAndHJpcGxlX2NsaWNrJzpcbiAgICAgICAgY2FzZSAnbW91c2VfbW92ZSc6XG4gICAgICAgICAgcmV0dXJuIGZtdENvb3JkKGlucHV0LmNvb3JkaW5hdGUpXG5cbiAgICAgICAgY2FzZSAnbGVmdF9jbGlja19kcmFnJzpcbiAgICAgICAgICByZXR1cm4gaW5wdXQuc3RhcnRfY29vcmRpbmF0ZVxuICAgICAgICAgICAgPyBgJHtmbXRDb29yZChpbnB1dC5zdGFydF9jb29yZGluYXRlKX0g4oaSICR7Zm10Q29vcmQoaW5wdXQuY29vcmRpbmF0ZSl9YFxuICAgICAgICAgICAgOiBgdG8gJHtmbXRDb29yZChpbnB1dC5jb29yZGluYXRlKX1gXG5cbiAgICAgICAgY2FzZSAndHlwZSc6XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBpbnB1dC50ZXh0ID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgPyBgXCIke3RydW5jYXRlVG9XaWR0aChpbnB1dC50ZXh0LCA0MCl9XCJgXG4gICAgICAgICAgICA6ICcnXG5cbiAgICAgICAgY2FzZSAna2V5JzpcbiAgICAgICAgY2FzZSAnaG9sZF9rZXknOlxuICAgICAgICAgIHJldHVybiB0eXBlb2YgaW5wdXQudGV4dCA9PT0gJ3N0cmluZycgPyBpbnB1dC50ZXh0IDogJydcblxuICAgICAgICBjYXNlICdzY3JvbGwnOlxuICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBpbnB1dC5kaXJlY3Rpb24sXG4gICAgICAgICAgICBpbnB1dC5hbW91bnQgJiYgYMOXJHtpbnB1dC5hbW91bnR9YCxcbiAgICAgICAgICAgIGlucHV0LmNvb3JkaW5hdGUgJiYgYGF0ICR7Zm10Q29vcmQoaW5wdXQuY29vcmRpbmF0ZSl9YCxcbiAgICAgICAgICBdXG4gICAgICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgICAgICAuam9pbignICcpXG5cbiAgICAgICAgY2FzZSAnem9vbSc6IHtcbiAgICAgICAgICBjb25zdCByID0gaW5wdXQucmVnaW9uXG4gICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocikgJiYgci5sZW5ndGggPT09IDRcbiAgICAgICAgICAgID8gYFske3JbMF19LCAke3JbMV19LCAke3JbMl19LCAke3JbM119XWBcbiAgICAgICAgICAgIDogJydcbiAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ3dhaXQnOlxuICAgICAgICAgIHJldHVybiB0eXBlb2YgaW5wdXQuZHVyYXRpb24gPT09ICdudW1iZXInID8gYCR7aW5wdXQuZHVyYXRpb259c2AgOiAnJ1xuXG4gICAgICAgIGNhc2UgJ3dyaXRlX2NsaXBib2FyZCc6XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBpbnB1dC50ZXh0ID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgPyBgXCIke3RydW5jYXRlVG9XaWR0aChpbnB1dC50ZXh0LCA0MCl9XCJgXG4gICAgICAgICAgICA6ICcnXG5cbiAgICAgICAgY2FzZSAnb3Blbl9hcHBsaWNhdGlvbic6XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBpbnB1dC5idW5kbGVfaWQgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICA/IFN0cmluZyhpbnB1dC5idW5kbGVfaWQpXG4gICAgICAgICAgICA6ICcnXG5cbiAgICAgICAgY2FzZSAncmVxdWVzdF9hY2Nlc3MnOiB7XG4gICAgICAgICAgY29uc3QgYXBwcyA9IGlucHV0LmFwcHNcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXBwcykpIHJldHVybiAnJ1xuICAgICAgICAgIGNvbnN0IG5hbWVzID0gYXBwc1xuICAgICAgICAgICAgLm1hcChhID0+ICh0eXBlb2YgYT8uZGlzcGxheU5hbWUgPT09ICdzdHJpbmcnID8gYS5kaXNwbGF5TmFtZSA6ICcnKSlcbiAgICAgICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgICByZXR1cm4gbmFtZXMuam9pbignLCAnKVxuICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnY29tcHV0ZXJfYmF0Y2gnOiB7XG4gICAgICAgICAgY29uc3QgYWN0aW9ucyA9IGlucHV0LmFjdGlvbnNcbiAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhY3Rpb25zKSA/IGAke2FjdGlvbnMubGVuZ3RofSBhY3Rpb25zYCA6ICcnXG4gICAgICAgIH1cblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiAnJ1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXJUb29sUmVzdWx0TWVzc2FnZShvdXRwdXQsIF9wcm9ncmVzcywgeyB2ZXJib3NlIH0pIHtcbiAgICAgIGlmICh2ZXJib3NlIHx8IHR5cGVvZiBvdXRwdXQgIT09ICdvYmplY3QnIHx8IG91dHB1dCA9PT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAgICAgLy8gTm9uLXZlcmJvc2U6IG9uZS1saW5lIGRpbSBzdW1tYXJ5LCBsaWtlIENocm9tZSdzIHBhdHRlcm4uXG4gICAgICBjb25zdCBzdW1tYXJ5ID0gUkVTVUxUX1NVTU1BUllbdG9vbE5hbWVdXG4gICAgICBpZiAoIXN1bW1hcnkpIHJldHVybiBudWxsXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+e3N1bW1hcnl9PC9UZXh0PlxuICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgIClcbiAgICB9LFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsZUFBZSxRQUFRLHFDQUFxQztBQUNyRSxTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUFTQyxlQUFlLFFBQVEsY0FBYztBQUM5QyxjQUFjQyxhQUFhLFFBQVEscUJBQXFCO0FBRXhELEtBQUtDLFdBQVcsR0FBR0MsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRztFQUMzQ0MsVUFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0VBQzdCQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztFQUNuQ0MsSUFBSSxDQUFDLEVBQUUsTUFBTTtFQUNiQyxJQUFJLENBQUMsRUFBRUMsS0FBSyxDQUFDO0lBQUVDLFdBQVcsQ0FBQyxFQUFFLE1BQU07RUFBQyxDQUFDLENBQUM7RUFDdENDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO0VBQ3pDQyxTQUFTLENBQUMsRUFBRSxNQUFNO0VBQ2xCQyxNQUFNLENBQUMsRUFBRSxNQUFNO0VBQ2ZDLFFBQVEsQ0FBQyxFQUFFLE1BQU07QUFDbkIsQ0FBQztBQUVELFNBQVNDLFFBQVFBLENBQUNDLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDekQsT0FB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