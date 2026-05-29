// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 isTaskAssignment、TaskAssignmentMessage 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { isTaskAssignment, type TaskAssignmentMessage } from '../../utils/teammateMailbox.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  assignment: TaskAssignmentMessage;
};

/**
 * Renders a task assignment with a cyan border (team-related color).
 */
// TaskAssignmentDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TaskAssignmentDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    assignment
  } = t0;
  // t1 暂存 `<Box marginBottom={1}><Text color="cyan_FOR_SUBAGENTS_ONL...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== assignment.assignedBy || $[1] !== assignment.taskId) {
    // t1 暂存 `<Box marginBottom={1}><Text color="cyan_FOR_SUBAGENTS_ONL...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box marginBottom={1}><Text color="cyan_FOR_SUBAGENTS_ONLY" bold={true}>Task #{assignment.taskId} assigned by {assignment.assignedBy}</Text></Box>;
    // $[0] 缓存 `assignment.assignedBy`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = assignment.assignedBy;
    // $[1] 缓存 `assignment.taskId`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = assignment.taskId;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<Box><Text bold={true}>{assignment.subject}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== assignment.subject) {
    // t2 暂存 `<Box><Text bold={true}>{assignment.subject}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box><Text bold={true}>{assignment.subject}</Text></Box>;
    // $[3] 缓存 `assignment.subject`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = assignment.subject;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `assignment.description && <Box marginTop={1}><Text dimCol...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== assignment.description) {
    // t3 暂存 `assignment.description && <Box marginTop={1}><Text dimCol...` 生成的渲染片段，后续返回路径直接复用。
    t3 = assignment.description && <Box marginTop={1}><Text dimColor={true}>{assignment.description}</Text></Box>;
    // $[5] 缓存 `assignment.description`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = assignment.description;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t1 || $[8] !== t2 || $[9] !== t3) {
    // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" marginY={1}><Box borderStyle="round" borderColor="cyan_FOR_SUBAGENTS_ONLY" flexDirection="column" paddingX={1} paddingY={1}>{t1}{t2}{t3}</Box></Box>;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}

/**
 * Try to parse and render a task assignment message from raw content.
 */
// tryRenderTaskAssignmentMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryRenderTaskAssignmentMessage(content: string): React.ReactNode | null {
  // assignment保存`isTaskAssignment`，供终端渲染后续处理使用。
  const assignment = isTaskAssignment(content);
  // 满足 `assignment` 时，终端渲染执行该分支。
  if (assignment) {
    // 返回 `<TaskAssignmentDisplay assignment={assignment} />`，作为终端渲染这次计算的结果。
    return <TaskAssignmentDisplay assignment={assignment} />;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}

/**
 * Get a brief summary text for a task assignment message.
 */
// getTaskAssignmentSummary 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getTaskAssignmentSummary(content: string): string | null {
  // assignment保存`isTaskAssignment`，供终端渲染后续处理使用。
  const assignment = isTaskAssignment(content);
  // 满足 `assignment` 时，终端渲染执行该分支。
  if (assignment) {
    // 返回 ``[Task Assigned] #${assignment.taskId} - ${assignment.subject}``，作为终端渲染这次计算的结果。
    return `[Task Assigned] #${assignment.taskId} - ${assignment.subject}`;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJpc1Rhc2tBc3NpZ25tZW50IiwiVGFza0Fzc2lnbm1lbnRNZXNzYWdlIiwiUHJvcHMiLCJhc3NpZ25tZW50IiwiVGFza0Fzc2lnbm1lbnREaXNwbGF5IiwidDAiLCIkIiwiX2MiLCJ0MSIsImFzc2lnbmVkQnkiLCJ0YXNrSWQiLCJ0MiIsInN1YmplY3QiLCJ0MyIsImRlc2NyaXB0aW9uIiwidDQiLCJ0cnlSZW5kZXJUYXNrQXNzaWdubWVudE1lc3NhZ2UiLCJjb250ZW50IiwiUmVhY3ROb2RlIiwiZ2V0VGFza0Fzc2lnbm1lbnRTdW1tYXJ5Il0sInNvdXJjZXMiOlsiVGFza0Fzc2lnbm1lbnRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7XG4gIGlzVGFza0Fzc2lnbm1lbnQsXG4gIHR5cGUgVGFza0Fzc2lnbm1lbnRNZXNzYWdlLFxufSBmcm9tICcuLi8uLi91dGlscy90ZWFtbWF0ZU1haWxib3guanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFzc2lnbm1lbnQ6IFRhc2tBc3NpZ25tZW50TWVzc2FnZVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSB0YXNrIGFzc2lnbm1lbnQgd2l0aCBhIGN5YW4gYm9yZGVyICh0ZWFtLXJlbGF0ZWQgY29sb3IpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gVGFza0Fzc2lnbm1lbnREaXNwbGF5KHsgYXNzaWdubWVudCB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luWT17MX0+XG4gICAgICA8Qm94XG4gICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICBib3JkZXJDb2xvcj1cImN5YW5fRk9SX1NVQkFHRU5UU19PTkxZXCJcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIHBhZGRpbmdYPXsxfVxuICAgICAgICBwYWRkaW5nWT17MX1cbiAgICAgID5cbiAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY3lhbl9GT1JfU1VCQUdFTlRTX09OTFlcIiBib2xkPlxuICAgICAgICAgICAgVGFzayAje2Fzc2lnbm1lbnQudGFza0lkfSBhc3NpZ25lZCBieSB7YXNzaWdubWVudC5hc3NpZ25lZEJ5fVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgYm9sZD57YXNzaWdubWVudC5zdWJqZWN0fTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHthc3NpZ25tZW50LmRlc2NyaXB0aW9uICYmIChcbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57YXNzaWdubWVudC5kZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG4vKipcbiAqIFRyeSB0byBwYXJzZSBhbmQgcmVuZGVyIGEgdGFzayBhc3NpZ25tZW50IG1lc3NhZ2UgZnJvbSByYXcgY29udGVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeVJlbmRlclRhc2tBc3NpZ25tZW50TWVzc2FnZShcbiAgY29udGVudDogc3RyaW5nLFxuKTogUmVhY3QuUmVhY3ROb2RlIHwgbnVsbCB7XG4gIGNvbnN0IGFzc2lnbm1lbnQgPSBpc1Rhc2tBc3NpZ25tZW50KGNvbnRlbnQpXG4gIGlmIChhc3NpZ25tZW50KSB7XG4gICAgcmV0dXJuIDxUYXNrQXNzaWdubWVudERpc3BsYXkgYXNzaWdubWVudD17YXNzaWdubWVudH0gLz5cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEdldCBhIGJyaWVmIHN1bW1hcnkgdGV4dCBmb3IgYSB0YXNrIGFzc2lnbm1lbnQgbWVzc2FnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRhc2tBc3NpZ25tZW50U3VtbWFyeShjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgYXNzaWdubWVudCA9IGlzVGFza0Fzc2lnbm1lbnQoY29udGVudClcbiAgaWYgKGFzc2lnbm1lbnQpIHtcbiAgICByZXR1cm4gYFtUYXNrIEFzc2lnbmVkXSAjJHthc3NpZ25tZW50LnRhc2tJZH0gLSAke2Fzc2lnbm1lbnQuc3ViamVjdH1gXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUNFQyxnQkFBZ0IsRUFDaEIsS0FBS0MscUJBQXFCLFFBQ3JCLGdDQUFnQztBQUV2QyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsVUFBVSxFQUFFRixxQkFBcUI7QUFDbkMsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFHLHNCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQStCO0lBQUFKO0VBQUEsSUFBQUUsRUFBcUI7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBSCxVQUFBLENBQUFNLFVBQUEsSUFBQUgsQ0FBQSxRQUFBSCxVQUFBLENBQUFPLE1BQUE7SUFVbkRGLEVBQUEsSUFBQyxHQUFHLENBQWUsWUFBQyxDQUFELEdBQUMsQ0FDbEIsQ0FBQyxJQUFJLENBQU8sS0FBeUIsQ0FBekIseUJBQXlCLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFDLE1BQ2xDLENBQUFMLFVBQVUsQ0FBQU8sTUFBTSxDQUFFLGFBQWMsQ0FBQVAsVUFBVSxDQUFBTSxVQUFVLENBQzdELEVBRkMsSUFBSSxDQUdQLEVBSkMsR0FBRyxD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