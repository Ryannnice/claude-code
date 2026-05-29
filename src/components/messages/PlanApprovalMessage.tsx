// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 Markdown 终端界面组件，避免在这里重复拼装显示逻辑。
import { Markdown } from '../../components/Markdown.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 jsonParse 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse } from '../../utils/slowOperations.js';
// 复用 IdleNotificationMessage、isIdleNotification、isPlanApprovalRequest、isPlanApprovalResponse、PlanApprovalRequestMessage、PlanApprovalResponseMessage 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { type IdleNotificationMessage, isIdleNotification, isPlanApprovalRequest, isPlanApprovalResponse, type PlanApprovalRequestMessage, type PlanApprovalResponseMessage } from '../../utils/teammateMailbox.js';
// 引入 getShutdownMessageSummary，将 ./ShutdownMessage.js 中已经封装好的能力接到本文件流程里。
import { getShutdownMessageSummary } from './ShutdownMessage.js';
// 引入 getTaskAssignmentSummary，将 ./TaskAssignmentMessage.js 中已经封装好的能力接到本文件流程里。
import { getTaskAssignmentSummary } from './TaskAssignmentMessage.js';
// PlanApprovalRequestProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PlanApprovalRequestProps = {
  request: PlanApprovalRequestMessage;
};

/**
 * Renders a plan approval request with a planMode-colored border,
 * showing the plan content and instructions for approving/rejecting.
 */
// PlanApprovalRequestDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PlanApprovalRequestDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    request
  } = t0;
  // t1 暂存 `<Box marginBottom={1}><Text color="planMode" bold={true}>...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== request.from) {
    // t1 暂存 `<Box marginBottom={1}><Text color="planMode" bold={true}>...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box marginBottom={1}><Text color="planMode" bold={true}>Plan Approval Request from {request.from}</Text></Box>;
    // $[0] 缓存 `request.from`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = request.from;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<Box borderStyle="dashed" borderColor="subtle" borderLeft...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== request.planContent) {
    // t2 暂存 `<Box borderStyle="dashed" borderColor="subtle" borderLeft...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box borderStyle="dashed" borderColor="subtle" borderLeft={false} borderRight={false} flexDirection="column" paddingX={1} marginBottom={1}><Markdown>{request.planContent}</Markdown></Box>;
    // $[2] 缓存 `request.planContent`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = request.planContent;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Text dimColor={true}>Plan file: {request.planFilePath}</...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== request.planFilePath) {
    // t3 暂存 `<Text dimColor={true}>Plan file: {request.planFilePath}</...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true}>Plan file: {request.planFilePath}</Text>;
    // $[4] 缓存 `request.planFilePath`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = request.planFilePath;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t1 || $[7] !== t2 || $[8] !== t3) {
    // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" marginY={1}><Box borderStyle="round" borderColor="planMode" flexDirection="column" paddingX={1}>{t1}{t2}{t3}</Box></Box>;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// PlanApprovalResponseProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PlanApprovalResponseProps = {
  response: PlanApprovalResponseMessage;
  senderName: string;
};

/**
 * Renders a plan approval response with a success (green) or error (red) border.
 */
// PlanApprovalResponseDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PlanApprovalResponseDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    response,
    senderName
  } = t0;
  // 满足 `response.approved` 时，终端渲染执行该分支。
  if (response.approved) {
    // t1 暂存 `<Box><Text color="success" bold={true}>✓ Plan Approved by...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== senderName) {
      // t1 暂存 `<Box><Text color="success" bold={true}>✓ Plan Approved by...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Box><Text color="success" bold={true}>✓ Plan Approved by {senderName}</Text></Box>;
      // $[0] 缓存 `senderName`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = senderName;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[1];
    }
    // t2 暂存 `<Box marginTop={1}><Text>You can now proceed with impleme...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      // t2 暂存 `<Box marginTop={1}><Text>You can now proceed with impleme...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Box marginTop={1}><Text>You can now proceed with implementation. Your plan mode restrictions have been lifted.</Text></Box>;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // t3 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== t1) {
      // t3 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Box flexDirection="column" marginY={1}><Box borderStyle="round" borderColor="success" flexDirection="column" paddingX={1} paddingY={1}>{t1}{t2}</Box></Box>;
      // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t1;
      // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[4];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // t1 暂存 `<Box><Text color="error" bold={true}>✗ Plan Rejected by {...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== senderName) {
    // t1 暂存 `<Box><Text color="error" bold={true}>✗ Plan Rejected by {...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box><Text color="error" bold={true}>✗ Plan Rejected by {senderName}</Text></Box>;
    // $[5] 缓存 `senderName`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = senderName;
    // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[6];
  }
  // t2 暂存 `response.feedback && <Box marginTop={1} borderStyle="dash...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== response.feedback) {
    // t2 暂存 `response.feedback && <Box marginTop={1} borderStyle="dash...` 生成的渲染片段，后续返回路径直接复用。
    t2 = response.feedback && <Box marginTop={1} borderStyle="dashed" borderColor="subtle" borderLeft={false} borderRight={false} paddingX={1}><Text>Feedback: {response.feedback}</Text></Box>;
    // $[7] 缓存 `response.feedback`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = response.feedback;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[8];
  }
  // t3 暂存 `<Box marginTop={1}><Text dimColor={true}>Please revise yo...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box marginTop={1}><Text dimColor={true}>Please revise yo...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginTop={1}><Text dimColor={true}>Please revise your plan based on the feedback and call ExitPlanMode again.</Text></Box>;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t1 || $[11] !== t2) {
    // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" marginY={1}><Box borderStyle="round" borderColor="error" flexDirection="column" paddingX={1} paddingY={1}>{t1}{t2}{t3}</Box></Box>;
    // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t1;
    // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t2;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}

/**
 * Try to parse and render a plan approval message from raw content.
 * Returns the rendered component if it's a plan approval message, null otherwise.
 */
// tryRenderPlanApprovalMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryRenderPlanApprovalMessage(content: string, senderName: string): React.ReactNode | null {
  // request 请求数据保存`isPlanApprovalRequest`，供终端渲染后续处理使用。
  const request = isPlanApprovalRequest(content);
  // 满足 `request` 时，终端渲染执行该分支。
  if (request) {
    // 返回 `<PlanApprovalRequestDisplay request={request} />`，作为终端渲染这次计算的结果。
    return <PlanApprovalRequestDisplay request={request} />;
  }
  // 接口响应保存`isPlanApprovalResponse`，供终端渲染后续处理使用。
  const response = isPlanApprovalResponse(content);
  // 满足 `response` 时，终端渲染执行该分支。
  if (response) {
    // 返回 `<PlanApprovalResponseDisplay response={response} senderName={senderName...`，作为终端渲染这次计算的结果。
    return <PlanApprovalResponseDisplay response={response} senderName={senderName} />;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}

/**
 * Get a brief summary text for a plan approval message.
 * Used in places like the inbox queue where we want a short description.
 * Returns null if the content is not a plan approval message.
 */
// getPlanApprovalSummary 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPlanApprovalSummary(content: string): string | null {
  // request 请求数据保存`isPlanApprovalRequest`，供终端渲染后续处理使用。
  const request = isPlanApprovalRequest(content);
  // 满足 `request` 时，终端渲染执行该分支。
  if (request) {
    // 返回 ``[Plan Approval Request from ${request.from}]``，作为终端渲染这次计算的结果。
    return `[Plan Approval Request from ${request.from}]`;
  }
  // 接口响应保存`isPlanApprovalResponse`，供终端渲染后续处理使用。
  const response = isPlanApprovalResponse(content);
  // 满足 `response` 时，终端渲染执行该分支。
  if (response) {
    // 满足 `response.approved` 时，终端渲染执行该分支。
    if (response.approved) {
      // 返回 `'[Plan Approved] You can now proceed with implementation'`，作为终端渲染这次计算的结果。
      return '[Plan Approved] You can now proceed with implementation';
    } else {
      // 返回 ``[Plan Rejected] ${response.feedback || 'Please revise your plan'}``，作为终端渲染这次计算的结果。
      return `[Plan Rejected] ${response.feedback || 'Please revise your plan'}`;
    }
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}

/**
 * Get a brief summary text for an idle notification.
 */
// getIdleNotificationSummary 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getIdleNotificationSummary(msg: IdleNotificationMessage): string {
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts: string[] = ['Agent idle'];
  // 满足 `msg.completedTaskId` 时，终端渲染执行该分支。
  if (msg.completedTaskId) {
    // status 集合标记终端 UI Plan Approval Message是否启用对应路径。
    const status = msg.completedStatus || 'completed';
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`Task ${msg.completedTaskId} ${status}`);
  }
  // 满足 `msg.summary` 时，终端渲染执行该分支。
  if (msg.summary) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`Last DM: ${msg.summary}`);
  }
  // 返回 `parts.join(' · ')`，作为终端渲染这次计算的结果。
  return parts.join(' · ');
}

/**
 * Format teammate message content for display.
 * If it's a structured message (plan approval, shutdown, or idle), returns a formatted summary.
 * Otherwise returns the original content.
 */
// formatTeammateMessageContent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatTeammateMessageContent(content: string): string {
  // planSummary读取`getPlanApprovalSummary`，供终端渲染后续处理使用。
  const planSummary = getPlanApprovalSummary(content);
  // 满足 `planSummary` 时，终端渲染执行该分支。
  if (planSummary) {
    // 返回 `planSummary`，作为终端渲染这次计算的结果。
    return planSummary;
  }
  // shutdownSummary读取`getShutdownMessageSummary`，供终端渲染后续处理使用。
  const shutdownSummary = getShutdownMessageSummary(content);
  // 满足 `shutdownSummary` 时，终端渲染执行该分支。
  if (shutdownSummary) {
    // 返回 `shutdownSummary`，作为终端渲染这次计算的结果。
    return shutdownSummary;
  }
  // idleMsg保存`isIdleNotification`，供终端渲染后续处理使用。
  const idleMsg = isIdleNotification(content);
  // 满足 `idleMsg` 时，终端渲染执行该分支。
  if (idleMsg) {
    // 返回 `getIdleNotificationSummary(idleMsg)`，作为终端渲染这次计算的结果。
    return getIdleNotificationSummary(idleMsg);
  }
  // taskAssignmentSummary读取`getTaskAssignmentSummary`，供终端渲染后续处理使用。
  const taskAssignmentSummary = getTaskAssignmentSummary(content);
  // 满足 `taskAssignmentSummary` 时，终端渲染执行该分支。
  if (taskAssignmentSummary) {
    // 返回 `taskAssignmentSummary`，作为终端渲染这次计算的结果。
    return taskAssignmentSummary;
  }

  // Check for teammate_terminated message
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果解析`jsonParse`，供终端渲染后续处理使用。
    const parsed = jsonParse(content) as {
      type?: string;
      message?: string;
    };
    // 只有 `parsed?.type === 'teammate_terminated' && parsed.` 满足时，终端渲染才执行该分支。
    if (parsed?.type === 'teammate_terminated' && parsed.message) {
      // 返回 `parsed.message`，作为终端渲染这次计算的结果。
      return parsed.message;
    }
  } catch {
    // Not JSON
  }
  // 返回 `content`，作为终端渲染这次计算的结果。
  return content;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIk1hcmtkb3duIiwiQm94IiwiVGV4dCIsImpzb25QYXJzZSIsIklkbGVOb3RpZmljYXRpb25NZXNzYWdlIiwiaXNJZGxlTm90aWZpY2F0aW9uIiwiaXNQbGFuQXBwcm92YWxSZXF1ZXN0IiwiaXNQbGFuQXBwcm92YWxSZXNwb25zZSIsIlBsYW5BcHByb3ZhbFJlcXVlc3RNZXNzYWdlIiwiUGxhbkFwcHJvdmFsUmVzcG9uc2VNZXNzYWdlIiwiZ2V0U2h1dGRvd25NZXNzYWdlU3VtbWFyeSIsImdldFRhc2tBc3NpZ25tZW50U3VtbWFyeSIsIlBsYW5BcHByb3ZhbFJlcXVlc3RQcm9wcyIsInJlcXVlc3QiLCJQbGFuQXBwcm92YWxSZXF1ZXN0RGlzcGxheSIsInQwIiwiJCIsIl9jIiwidDEiLCJmcm9tIiwidDIiLCJwbGFuQ29udGVudCIsInQzIiwicGxhbkZpbGVQYXRoIiwidDQiLCJQbGFuQXBwcm92YWxSZXNwb25zZVByb3BzIiwicmVzcG9uc2UiLCJzZW5kZXJOYW1lIiwiUGxhbkFwcHJvdmFsUmVzcG9uc2VEaXNwbGF5IiwiYXBwcm92ZWQiLCJTeW1ib2wiLCJmb3IiLCJmZWVkYmFjayIsInRyeVJlbmRlclBsYW5BcHByb3ZhbE1lc3NhZ2UiLCJjb250ZW50IiwiUmVhY3ROb2RlIiwiZ2V0UGxhbkFwcHJvdmFsU3VtbWFyeSIsImdldElkbGVOb3RpZmljYXRpb25TdW1tYXJ5IiwibXNnIiwicGFydHMiLCJjb21wbGV0ZWRUYXNrSWQiLCJzdGF0dXMiLCJjb21wbGV0ZWRTdGF0dXMiLCJwdXNoIiwic3VtbWFyeSIsImpvaW4iLCJmb3JtYXRUZWFtbWF0ZU1lc3NhZ2VDb250ZW50IiwicGxhblN1bW1hcnkiLCJzaHV0ZG93blN1bW1hcnkiLCJpZGxlTXNnIiwidGFza0Fzc2lnbm1lbnRTdW1tYXJ5IiwicGFyc2VkIiwidHlwZSIsIm1lc3NhZ2UiXSwic291cmNlcyI6WyJQbGFuQXBwcm92YWxNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IE1hcmtkb3duIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9NYXJrZG93bi5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGpzb25QYXJzZSB9IGZyb20gJy4uLy4uL3V0aWxzL3Nsb3dPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBJZGxlTm90aWZpY2F0aW9uTWVzc2FnZSxcbiAgaXNJZGxlTm90aWZpY2F0aW9uLFxuICBpc1BsYW5BcHByb3ZhbFJlcXVlc3QsXG4gIGlzUGxhbkFwcHJvdmFsUmVzcG9uc2UsXG4gIHR5cGUgUGxhbkFwcHJvdmFsUmVxdWVzdE1lc3NhZ2UsXG4gIHR5cGUgUGxhbkFwcHJvdmFsUmVzcG9uc2VNZXNzYWdlLFxufSBmcm9tICcuLi8uLi91dGlscy90ZWFtbWF0ZU1haWxib3guanMnXG5pbXBvcnQgeyBnZXRTaHV0ZG93bk1lc3NhZ2VTdW1tYXJ5IH0gZnJvbSAnLi9TaHV0ZG93bk1lc3NhZ2UuanMnXG5pbXBvcnQgeyBnZXRUYXNrQXNzaWdubWVudFN1bW1hcnkgfSBmcm9tICcuL1Rhc2tBc3NpZ25tZW50TWVzc2FnZS5qcydcblxudHlwZSBQbGFuQXBwcm92YWxSZXF1ZXN0UHJvcHMgPSB7XG4gIHJlcXVlc3Q6IFBsYW5BcHByb3ZhbFJlcXVlc3RNZXNzYWdlXG59XG5cbi8qKlxuICogUmVuZGVycyBhIHBsYW4gYXBwcm92YWwgcmVxdWVzdCB3aXRoIGEgcGxhbk1vZGUtY29sb3JlZCBib3JkZXIsXG4gKiBzaG93aW5nIHRoZSBwbGFuIGNvbnRlbnQgYW5kIGluc3RydWN0aW9ucyBmb3IgYXBwcm92aW5nL3JlamVjdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFBsYW5BcHByb3ZhbFJlcXVlc3REaXNwbGF5KHtcbiAgcmVxdWVzdCxcbn06IFBsYW5BcHByb3ZhbFJlcXVlc3RQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luWT17MX0+XG4gICAgICA8Qm94XG4gICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICBib3JkZXJDb2xvcj1cInBsYW5Nb2RlXCJcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIHBhZGRpbmdYPXsxfVxuICAgICAgPlxuICAgICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJwbGFuTW9kZVwiIGJvbGQ+XG4gICAgICAgICAgICBQbGFuIEFwcHJvdmFsIFJlcXVlc3QgZnJvbSB7cmVxdWVzdC5mcm9tfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3hcbiAgICAgICAgICBib3JkZXJTdHlsZT1cImRhc2hlZFwiXG4gICAgICAgICAgYm9yZGVyQ29sb3I9XCJzdWJ0bGVcIlxuICAgICAgICAgIGJvcmRlckxlZnQ9e2ZhbHNlfVxuICAgICAgICAgIGJvcmRlclJpZ2h0PXtmYWxzZX1cbiAgICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgICBwYWRkaW5nWD17MX1cbiAgICAgICAgICBtYXJnaW5Cb3R0b209ezF9XG4gICAgICAgID5cbiAgICAgICAgICA8TWFya2Rvd24+e3JlcXVlc3QucGxhbkNvbnRlbnR9PC9NYXJrZG93bj5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlBsYW4gZmlsZToge3JlcXVlc3QucGxhbkZpbGVQYXRofTwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbnR5cGUgUGxhbkFwcHJvdmFsUmVzcG9uc2VQcm9wcyA9IHtcbiAgcmVzcG9uc2U6IFBsYW5BcHByb3ZhbFJlc3BvbnNlTWVzc2FnZVxuICBzZW5kZXJOYW1lOiBzdHJpbmdcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgcGxhbiBhcHByb3ZhbCByZXNwb25zZSB3aXRoIGEgc3VjY2VzcyAoZ3JlZW4pIG9yIGVycm9yIChyZWQpIGJvcmRlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFBsYW5BcHByb3ZhbFJlc3BvbnNlRGlzcGxheSh7XG4gIHJlc3BvbnNlLFxuICBzZW5kZXJOYW1lLFxufTogUGxhbkFwcHJvdmFsUmVzcG9uc2VQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmIChyZXNwb25zZS5hcHByb3ZlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5ZPXsxfT5cbiAgICAgICAgPEJveFxuICAgICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICAgIGJvcmRlckNvbG9yPVwic3VjY2Vzc1wiXG4gICAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgICAgcGFkZGluZ1g9ezF9XG4gICAgICAgICAgcGFkZGluZ1k9ezF9XG4gICAgICAgID5cbiAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCIgYm9sZD5cbiAgICAgICAgICAgICAg4pyTIFBsYW4gQXBwcm92ZWQgYnkge3NlbmRlck5hbWV9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgIFlvdSBjYW4gbm93IHByb2NlZWQgd2l0aCBpbXBsZW1lbnRhdGlvbi4gWW91ciBwbGFuIG1vZGVcbiAgICAgICAgICAgICAgcmVzdHJpY3Rpb25zIGhhdmUgYmVlbiBsaWZ0ZWQuXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5ZPXsxfT5cbiAgICAgIDxCb3hcbiAgICAgICAgYm9yZGVyU3R5bGU9XCJyb3VuZFwiXG4gICAgICAgIGJvcmRlckNvbG9yPVwiZXJyb3JcIlxuICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgcGFkZGluZ1g9ezF9XG4gICAgICAgIHBhZGRpbmdZPXsxfVxuICAgICAgPlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIiBib2xkPlxuICAgICAgICAgICAg4pyXIFBsYW4gUmVqZWN0ZWQgYnkge3NlbmRlck5hbWV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAge3Jlc3BvbnNlLmZlZWRiYWNrICYmIChcbiAgICAgICAgICA8Qm94XG4gICAgICAgICAgICBtYXJnaW5Ub3A9ezF9XG4gICAgICAgICAgICBib3JkZXJTdHlsZT1cImRhc2hlZFwiXG4gICAgICAgICAgICBib3JkZXJDb2xvcj1cInN1YnRsZVwiXG4gICAgICAgICAgICBib3JkZXJMZWZ0PXtmYWxzZX1cbiAgICAgICAgICAgIGJvcmRlclJpZ2h0PXtmYWxzZX1cbiAgICAgICAgICAgIHBhZGRpbmdYPXsxfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxUZXh0PkZlZWRiYWNrOiB7cmVzcG9uc2UuZmVlZGJhY2t9PC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICBQbGVhc2UgcmV2aXNlIHlvdXIgcGxhbiBiYXNlZCBvbiB0aGUgZmVlZGJhY2sgYW5kIGNhbGwgRXhpdFBsYW5Nb2RlXG4gICAgICAgICAgICBhZ2Fpbi5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuLyoqXG4gKiBUcnkgdG8gcGFyc2UgYW5kIHJlbmRlciBhIHBsYW4gYXBwcm92YWwgbWVzc2FnZSBmcm9tIHJhdyBjb250ZW50LlxuICogUmV0dXJucyB0aGUgcmVuZGVyZWQgY29tcG9uZW50IGlmIGl0J3MgYSBwbGFuIGFwcHJvdmFsIG1lc3NhZ2UsIG51bGwgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ5UmVuZGVyUGxhbkFwcHJvdmFsTWVzc2FnZShcbiAgY29udGVudDogc3RyaW5nLFxuICBzZW5kZXJOYW1lOiBzdHJpbmcsXG4pOiBSZWFjdC5SZWFjdE5vZGUgfCBudWxsIHtcbiAgY29uc3QgcmVxdWVzdCA9IGlzUGxhbkFwcHJvdmFsUmVxdWVzdChjb250ZW50KVxuICBpZiAocmVxdWVzdCkge1xuICAgIHJldHVybiA8UGxhbkFwcHJvdmFsUmVxdWVzdERpc3BsYXkgcmVxdWVzdD17cmVxdWVzdH0gLz5cbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlID0gaXNQbGFuQXBwcm92YWxSZXNwb25zZShjb250ZW50KVxuICBpZiAocmVzcG9uc2UpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFBsYW5BcHByb3ZhbFJlc3BvbnNlRGlzcGxheVxuICAgICAgICByZXNwb25zZT17cmVzcG9uc2V9XG4gICAgICAgIHNlbmRlck5hbWU9e3NlbmRlck5hbWV9XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogR2V0IGEgYnJpZWYgc3VtbWFyeSB0ZXh0IGZvciBhIHBsYW4gYXBwcm92YWwgbWVzc2FnZS5cbiAqIFVzZWQgaW4gcGxhY2VzIGxpa2UgdGhlIGluYm94IHF1ZXVlIHdoZXJlIHdlIHdhbnQgYSBzaG9ydCBkZXNjcmlwdGlvbi5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgY29udGVudCBpcyBub3QgYSBwbGFuIGFwcHJvdmFsIG1lc3NhZ2UuXG4gKi9cbmZ1bmN0aW9uIGdldFBsYW5BcHByb3ZhbFN1bW1hcnkoY29udGVudDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHJlcXVlc3QgPSBpc1BsYW5BcHByb3ZhbFJlcXVlc3QoY29udGVudClcbiAgaWYgKHJlcXVlc3QpIHtcbiAgICByZXR1cm4gYFtQbGFuIEFwcHJvdmFsIFJlcXVlc3QgZnJvbSAke3JlcXVlc3QuZnJvbX1dYFxuICB9XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBpc1BsYW5BcHByb3ZhbFJlc3BvbnNlKGNvbnRlbnQpXG4gIGlmIChyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZS5hcHByb3ZlZCkge1xuICAgICAgcmV0dXJuICdbUGxhbiBBcHByb3ZlZF0gWW91IGNhbiBub3cgcHJvY2VlZCB3aXRoIGltcGxlbWVudGF0aW9uJ1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYFtQbGFuIFJlamVjdGVkXSAke3Jlc3BvbnNlLmZlZWRiYWNrIHx8ICdQbGVhc2UgcmV2aXNlIHlvdXIgcGxhbid9YFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsXG59XG5cbi8qKlxuICogR2V0IGEgYnJpZWYgc3VtbWFyeSB0ZXh0IGZvciBhbiBpZGxlIG5vdGlmaWNhdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0SWRsZU5vdGlmaWNhdGlvblN1bW1hcnkobXNnOiBJZGxlTm90aWZpY2F0aW9uTWVzc2FnZSk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFsnQWdlbnQgaWRsZSddXG4gIGlmIChtc2cuY29tcGxldGVkVGFza0lkKSB7XG4gICAgY29uc3Qgc3RhdHVzID0gbXNnLmNvbXBsZXRlZFN0YXR1cyB8fCAnY29tcGxldGVkJ1xuICAgIHBhcnRzLnB1c2goYFRhc2sgJHttc2cuY29tcGxldGVkVGFza0lkfSAke3N0YXR1c31gKVxuICB9XG4gIGlmIChtc2cuc3VtbWFyeSkge1xuICAgIHBhcnRzLnB1c2goYExhc3QgRE06ICR7bXNnLnN1bW1hcnl9YClcbiAgfVxuICByZXR1cm4gcGFydHMuam9pbignIMK3ICcpXG59XG5cbi8qKlxuICogRm9ybWF0IHRlYW1tYXRlIG1lc3NhZ2UgY29udGVudCBmb3IgZGlzcGxheS5cbiAqIElmIGl0J3MgYSBzdHJ1Y3R1cmVkIG1lc3NhZ2UgKHBsYW4gYXBwcm92YWwsIHNodXRkb3duLCBvciBpZGxlKSwgcmV0dXJucyBhIGZvcm1hdHRlZCBzdW1tYXJ5LlxuICogT3RoZXJ3aXNlIHJldHVybnMgdGhlIG9yaWdpbmFsIGNvbnRlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRUZWFtbWF0ZU1lc3NhZ2VDb250ZW50KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHBsYW5TdW1tYXJ5ID0gZ2V0UGxhbkFwcHJvdmFsU3VtbWFyeShjb250ZW50KVxuICBpZiAocGxhblN1bW1hcnkpIHtcbiAgICByZXR1cm4gcGxhblN1bW1hcnlcbiAgfVxuXG4gIGNvbnN0IHNodXRkb3duU3VtbWFyeSA9IGdldFNodXRkb3duTWVzc2FnZVN1bW1hcnkoY29udGVudClcbiAgaWYgKHNodXRkb3duU3VtbWFyeSkge1xuICAgIHJldHVybiBzaHV0ZG93blN1bW1hcnlcbiAgfVxuXG4gIGNvbnN0IGlkbGVNc2cgPSBpc0lkbGVOb3RpZmljYXRpb24oY29udGVudClcbiAgaWYgKGlkbGVNc2cpIHtcbiAgICByZXR1cm4gZ2V0SWRsZU5vdGlmaWNhdGlvblN1bW1hcnkoaWRsZU1zZylcbiAgfVxuXG4gIGNvbnN0IHRhc2tBc3NpZ25tZW50U3VtbWFyeSA9IGdldFRhc2tBc3NpZ25tZW50U3VtbWFyeShjb250ZW50KVxuICBpZiAodGFza0Fzc2lnbm1lbnRTdW1tYXJ5KSB7XG4gICAgcmV0dXJuIHRhc2tBc3NpZ25tZW50U3VtbWFyeVxuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIHRlYW1tYXRlX3Rlcm1pbmF0ZWQgbWVzc2FnZVxuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IGpzb25QYXJzZShjb250ZW50KSBhcyB7IHR5cGU/OiBzdHJpbmc7IG1lc3NhZ2U/OiBzdHJpbmcgfVxuICAgIGlmIChwYXJzZWQ/LnR5cGUgPT09ICd0ZWFtbWF0ZV90ZXJtaW5hdGVkJyAmJiBwYXJzZWQubWVzc2FnZSkge1xuICAgICAgcmV0dXJuIHBhcnNlZC5tZXNzYWdlXG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBOb3QgSlNPTlxuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnRcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxRQUFRLDhCQUE4QjtBQUN2RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLFNBQVMsUUFBUSwrQkFBK0I7QUFDekQsU0FDRSxLQUFLQyx1QkFBdUIsRUFDNUJDLGtCQUFrQixFQUNsQkMscUJBQXFCLEVBQ3JCQyxzQkFBc0IsRUFDdEIsS0FBS0MsMEJBQTBCLEVBQy9CLEtBQUtDLDJCQUEyQixRQUMzQixnQ0FBZ0M7QUFDdkMsU0FBU0MseUJBQXlCLFFBQVEsc0JBQXNCO0FBQ2hFLFNBQVNDLHdCQUF3QixRQUFRLDRCQUE0QjtBQUVyRSxLQUFLQyx3QkFBd0IsR0FBRztFQUM5QkMsT0FBTyxFQUFFTCwwQkFBMEI7QUFDckMsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBQU0sMkJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBb0M7SUFBQUo7RUFBQSxJQUFBRSxFQUVoQjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFILE9BQUEsQ0FBQU0sSUFBQTtJQVNuQkQsRUFBQSxJQUFDLEdBQUcsQ0FBZSxZQUFDLENBQUQsR0FBQyxDQUNsQixDQUFDLElBQUksQ0FBTyxLQUFVLENBQVYsVUFBVSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQywyQkFDRSxDQUFBTCxPQUFPLENBQUFNLElBQUksQ0FDekMsRUFGQyxJQUFJLENBR1AsRUFKQyxHQUFHLENBSUU7SUFBQUgsQ0FBQSxNQUFBSCxPQUFBLENBQUFNLElBQUE7SUFBQUgsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBSCxPQUFBLENBQUFRLFdBQUE7SUFDTkQsRUFBQSxJQUFDLEdBQUcsQ0FDVSxXQUFRLENBQVIsUUFBUSxDQUNSLFdBQVEsQ0FBUixRQUFRLENBQ1IsVUFBSyxDQUFMLE1BQUksQ0FBQyxDQUNKLFdBQUssQ0FBTCxNQUFJLENBQUMsQ0FDSixhQUFRLENBQVIsUUFBUSxDQUNaLFFBQUMsQ0FBRCxHQUFDLENBQ0csWUFBQyxDQUFELEdBQUMsQ0FFZixDQUFDLFFBQVEsQ0FBRSxDQUFBUCxPQUFPLENBQUFRLFdBQVcsQ0FBRSxFQUE5QixRQUFRLENBQ1gsRUFWQyxHQUFHLENBVUU7SUFBQUwsQ0FBQSxNQUFBSCxPQUFBLENBQUFRLFdBQUE7SUFBQUwsQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBSCxPQUFBLENBQUFVLFlBQUE7SUFDTkQsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsV0FBWSxDQUFBVCxPQUFPLENBQUFVLFlBQVksQ0FBRSxFQUEvQyxJQUFJLENBQWtEO0lBQUFQLENBQUEsTUFBQUgsT0FBQSxDQUFBVSxZQUFBO0lBQUFQLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQUEsSUFBQVEsRUFBQTtFQUFBLElBQUFSLENBQUEsUUFBQUUsRUFBQSxJQUFBRixDQUFBLFFBQUFJLEVBQUEsSUFBQUosQ0FBQSxRQUFBTSxFQUFBO0lBdkIzREUsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFVLE9BQUMsQ0FBRCxHQUFDLENBQ3BDLENBQUMsR0FBRyxDQUNVLFdBQU8sQ0FBUCxPQUFPLENBQ1AsV0FBVSxDQUFWLFVBQVUsQ0FDUixhQUFRLENBQVIsUUFBUSxDQUNaLFFBQUMsQ0FBRCxHQUFDLENBRVgsQ0FBQU4sRUFJSyxDQUNMLENBQUFFLEVBVUssQ0FDTCxDQUFBRSxFQUFzRCxDQUN4RCxFQXZCQyxHQUFHLENBd0JOLEVBekJDLEdBQUcsQ0F5QkU7SUFBQU4sQ0FBQSxNQUFBRSxFQUFBO0lBQUFGLENBQUEsTUFBQUksRUFBQTtJQUFBSixDQUFBLE1BQUFNLEVBQUE7SUFBQU4sQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBQSxPQXpCTlEsRUF5Qk07QUFBQTtBQUlWLEtBQUtDLHlCQUF5QixHQUFHO0VBQy9CQyxRQUFRLEVBQUVqQiwyQkFBMkI7RUFDckNrQixVQUFVLEVBQUUsTUFBTTtBQUNwQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBQUMsNEJBQUFiLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBcUM7SUFBQVMsUUFBQTtJQUFBQztFQUFBLElBQUFaLEVBR2hCO0VBQzFCLElBQUlXLFFBQVEsQ0FBQUcsUUFBUztJQUFBLElBQUFYLEVBQUE7SUFBQSxJQUFBRixDQUFBLFFBQUFXLFVBQUE7TUFVYlQsRUFBQSxJQUFDLEdBQUcsQ0FDRixDQUFDLElBQUksQ0FBTyxLQUFTLENBQVQsU0FBUyxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxtQkFDTFMsV0FBUyxDQUMvQixFQUZDLElBQUksQ0FHUCxFQUpDLEdBQUcsQ0FJRTtNQUFBWCxDQUFBLE1BQUFXLFVBQUE7TUFBQVgsQ0FBQSxNQUFBRSxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBRixDQUFBO0lBQUE7SUFBQSxJQUFBSSxFQUFBO0lBQUEsSUFBQUosQ0FBQSxRQUFBYyxNQUFBLENBQUFDLEdBQUE7TUFDTlgsRUFBQSxJQUFDLEdBQUcsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUNmLENBQUMsSUFBSSxDQUFDLHNGQUdOLEVBSEMsSUFBSSxDQUlQLEVBTEMsR0FBRyxDQUtFO01BQUFKLENBQUEsTUFBQUksRUFBQTtJQUFBO01BQUFBLEVBQUEsR0FBQUosQ0FBQTtJQUFBO0lBQUEsSUFBQU0sRUFBQTtJQUFBLElBQUFOLENBQUEsUUFBQUUsRUFBQTtNQWxCVkksRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFVLE9BQUMsQ0FBRCxHQUFDLENBQ3BDLENBQUMsR0FBRyxDQUNVLFdBQU8sQ0FBUCxPQUFPLENBQ1AsV0FBUyxDQUFULFNBQVMsQ0FDUCxhQUFRLENBQVIsUUFBUSxDQUNaLFFBQUMsQ0FBRCxHQUFDLENBQ0QsUUFBQyxDQUFELEdBQUMsQ0FFWCxDQUFBSixFQUlLLENBQ0wsQ0FBQUUsRUFLSyxDQUNQLEVBbEJDLEdBQUcsQ0FtQk4sRUFwQkMsR0FBRyxDQW9CRTtNQUFBSixDQUFBLE1BQUFFLEVBQUE7TUFBQUYsQ0FBQSxNQUFBTSxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBTixDQUFBO0lBQUE7SUFBQSxPQXBCTk0sRUFvQk07RUFBQTtFQUVULElBQUFKLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFXLFVBQUE7SUFXS1QsRUFBQSxJQUFDLEdBQUcsQ0FDRixDQUFDLElBQUksQ0FBTyxLQUFPLENBQVAsT0FBTyxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxtQkFDSFMsV0FBUyxDQUMvQixFQUZDLElBQUksQ0FHUCxFQUpDLEdBQUcsQ0FJRTtJQUFBWCxDQUFBLE1BQUFXLFVBQUE7SUFBQVgsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBVSxRQUFBLENBQUFNLFFBQUE7SUFDTFosRUFBQSxHQUFBTSxRQUFRLENBQUFNLFFBV1IsSUFWQyxDQUFDLEdBQUcsQ0FDUyxTQUFDLENBQUQsR0FBQyxDQUNBLFdBQVEsQ0FBUixRQUFRLENBQ1IsV0FBUSxDQUFSLFFBQVEsQ0FDUixVQUFLLENBQUwsTUFBSSxDQUFDLENBQ0osV0FBSyxDQUFMLE1BQUksQ0FBQyxDQUNSLFFBQUMsQ0FBRCxHQUFDLENBRVgsQ0FBQyxJQUFJLENBQUMsVUFBVyxDQUFBTixRQUFRLENBQUFNLFFBQVEsQ0FBRSxFQUFsQyxJQUFJLENBQ1AsRUFUQyxHQUFHLENBVUw7SUFBQWhCLENBQUEsTUFBQVUsUUFBQSxDQUFBTSxRQUFBO0lBQUFoQixDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFBLElBQUFNLEVBQUE7RUFBQSxJQUFBTixDQUFBLFFBQUFjLE1BQUEsQ0FBQUMsR0FBQTtJQUNEVCxFQUFBLElBQUMsR0FBRyxDQUFZLFNBQUMsQ0FBRCxHQUFDLENBQ2YsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLDBFQUdmLEVBSEMsSUFBSSxDQUlQLEVBTEMsR0FBRyxDQUtFO0lBQUFOLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQUEsSUFBQVEsRUFBQTtFQUFBLElBQUFSLENBQUEsU0FBQUUsRUFBQSxJQUFBRixDQUFBLFNBQUFJLEVBQUE7SUE5QlZJLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FBVSxPQUFDLENBQUQsR0FBQyxDQUNwQyxDQUFDLEdBQUcsQ0FDVSxXQUFPLENBQVAsT0FBTyxDQUNQLFdBQU8sQ0FBUCxPQUFPLENBQ0wsYUFBUSxDQUFSLFFBQVEsQ0FDWixRQUFDLENBQUQsR0FBQyxDQUNELFFBQUMsQ0FBRCxHQUFDLENBRVgsQ0FBQU4sRUFJSyxDQUNKLENBQUFFLEVBV0QsQ0FDQSxDQUFBRSxFQUtLLENBQ1AsRUE5QkMsR0FBRyxDQStCTixFQWhDQyxHQUFHLENBZ0NFO0lBQUFOLENBQUEsT0FBQUUsRUFBQTtJQUFBRixDQUFBLE9BQUFJLEVBQUE7SUFBQUosQ0FBQSxPQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBQSxPQWhDTlEsRUFnQ007QUFBQTs7QUFJVjtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBU1MsNEJBQTRCQSxDQUMxQ0MsT0FBTyxFQUFFLE1BQU0sRUFDZlAsVUFBVSxFQUFFLE1BQU0sQ0FDbkIsRUFBRTVCLEtBQUssQ0FBQ29DLFNBQVMsR0FBRyxJQUFJLENBQUM7RUFDeEIsTUFBTXRCLE9BQU8sR0FBR1AscUJBQXFCLENBQUM0QixPQUFPLENBQUM7RUFDOUMsSUFBSXJCLE9BQU8sRUFBRTtJQUNYLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQ0EsT0FBTyxDQUFDLEdBQUc7RUFDekQ7RUFFQSxNQUFNYSxRQUFRLEdBQUduQixzQkFBc0IsQ0FBQzJCLE9BQU8sQ0FBQztFQUNoRCxJQUFJUixRQUFRLEVBQUU7SUFDWixPQUNFLENBQUMsMkJBQTJCLENBQzFCLFFBQVEsQ0FBQyxDQUFDQSxRQUFRLENBQUMsQ0FDbkIsVUFBVSxDQUFDLENBQUNDLFVBQVUsQ0FBQyxHQUN2QjtFQUVOO0VBRUEsT0FBTyxJQUFJO0FBQ2I7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNTLHNCQUFzQkEsQ0FBQ0YsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUM7RUFDOUQsTUFBTXJCLE9BQU8sR0FBR1AscUJBQXFCLENBQUM0QixPQUFPLENBQUM7RUFDOUMsSUFBSXJCLE9BQU8sRUFBRTtJQUNYLE9BQU8sK0JBQStCQSxPQUFPLENBQUNNLElBQUksR0FBRztFQUN2RDtFQUVBLE1BQU1PLFFBQVEsR0FBR25CLHNCQUFzQixDQUFDMkIsT0FBTyxDQUFDO0VBQ2hELElBQUlSLFFBQVEsRUFBRTtJQUNaLElBQUlBLFFBQVEsQ0FBQ0csUUFBUSxFQUFFO01BQ3JCLE9BQU8seURBQXlEO0lBQ2xFLENBQUMsTUFBTTtNQUNMLE9BQU8sbUJBQW1CSCxRQUFRLENBQUNNLFFBQVEsSUFBSSx5QkFBeUIsRUFBRTtJQUM1RTtFQUNGO0VBRUEsT0FBTyxJQUFJO0FBQ2I7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBU0ssMEJBQTBCQSxDQUFDQyxHQUFHLEVBQUVsQyx1QkFBdUIsQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUN4RSxNQUFNbUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDO0VBQ3RDLElBQUlELEdBQUcsQ0FBQ0UsZUFBZSxFQUFFO0lBQ3ZCLE1BQU1DLE1BQU0sR0FBR0gsR0FBRyxDQUFDSSxlQUFlLElBQUksV0FBVztJQUNqREgsS0FBSyxDQUFDSSxJQUFJLENBQUMsUUFBUUwsR0FBRyxDQUFDRSxlQUFlLElBQUlDLE1BQU0sRUFBRSxDQUFDO0VBQ3JEO0VBQ0EsSUFBSUgsR0FBRyxDQUFDTSxPQUFPLEVBQUU7SUFDZkwsS0FBSyxDQUFDSSxJQUFJLENBQUMsWUFBWUwsR0FBRyxDQUFDTSxPQUFPLEVBQUUsQ0FBQztFQUN2QztFQUNBLE9BQU9MLEtBQUssQ0FBQ00sSUFBSSxDQUFDLEtBQUssQ0FBQztBQUMxQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFTQyw0QkFBNEJBLENBQUNaLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDcEUsTUFBTWEsV0FBVyxHQUFHWCxzQkFBc0IsQ0FBQ0YsT0FBTyxDQUFDO0VBQ25ELElBQUlhLFdBQVcsRUFBRTtJQUNmLE9BQU9BLFdBQVc7RUFDcEI7RUFFQSxNQUFNQyxlQUFlLEdBQUd0Qyx5QkFBeUIsQ0FBQ3dCLE9BQU8sQ0FBQztFQUMxRCxJQUFJYyxlQUFlLEVBQUU7SUFDbkIsT0FBT0EsZUFBZTtFQUN4QjtFQUVBLE1BQU1DLE9BQU8sR0FBRzVDLGtCQUFrQixDQUFDNkIsT0FBTyxDQUFDO0VBQzNDLElBQUllLE9BQU8sRUFBRTtJQUNYLE9BQU9aLDBCQUEwQixDQUFDWSxPQUFPLENBQUM7RUFDNUM7RUFFQSxNQUFNQyxxQkFBcUIsR0FBR3ZDLHdCQUF3QixDQUFDdUIsT0FBTyxDQUFDO0VBQy9ELElBQUlnQixxQkFBcUIsRUFBRTtJQUN6QixPQUFPQSxxQkFBcUI7RUFDOUI7O0VBRUE7RUFDQSxJQUFJO0lBQ0YsTUFBTUMsTUFBTSxHQUFHaEQsU0FBUyxDQUFDK0IsT0FBTyxDQUFDLElBQUk7TUFBRWtCLElBQUksQ0FBQyxFQUFFLE1BQU07TUFBRUMsT0FBTyxDQUFDLEVBQUUsTUFBTTtJQUFDLENBQUM7SUFDeEUsSUFBSUYsTUFBTSxFQUFFQyxJQUFJLEtBQUsscUJBQXFCLElBQUlELE1BQU0sQ0FBQ0UsT0FBTyxFQUFFO01BQzVELE9BQU9GLE1BQU0sQ0FBQ0UsT0FBTztJQUN2QjtFQUNGLENBQUMsQ0FBQyxNQUFNO0lBQ047RUFBQTtFQUdGLE9BQU9uQixPQUFPO0FBQ2hCIiwiaWdub3JlTGlzdCI6W119