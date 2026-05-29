// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 isShutdownApproved、isShutdownRejected、isShutdownRequest、ShutdownRejectedMessage、ShutdownRequestMessage 工具函数，把通用处理留在 ../../utils/teammateMailbox.js 中维护。
import { isShutdownApproved, isShutdownRejected, isShutdownRequest, type ShutdownRejectedMessage, type ShutdownRequestMessage } from '../../utils/teammateMailbox.js';
// ShutdownRequestProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ShutdownRequestProps = {
  request: ShutdownRequestMessage;
};

/**
 * Renders a shutdown request with a warning-colored border.
 */
// ShutdownRequestDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShutdownRequestDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    request
  } = t0;
  // t1 暂存 `<Box marginBottom={1}><Text color="warning" bold={true}>S...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== request.from) {
    // t1 暂存 `<Box marginBottom={1}><Text color="warning" bold={true}>S...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box marginBottom={1}><Text color="warning" bold={true}>Shutdown request from {request.from}</Text></Box>;
    // $[0] 缓存 `request.from`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = request.from;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `request.reason && <Box><Text>Reason: {request.reason}</Te...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== request.reason) {
    // t2 暂存 `request.reason && <Box><Text>Reason: {request.reason}</Te...` 生成的渲染片段，后续返回路径直接复用。
    t2 = request.reason && <Box><Text>Reason: {request.reason}</Text></Box>;
    // $[2] 缓存 `request.reason`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = request.reason;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t1 || $[5] !== t2) {
    // t3 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" marginY={1}><Box borderStyle="round" borderColor="warning" flexDirection="column" paddingX={1} paddingY={1}>{t1}{t2}</Box></Box>;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// ShutdownRejectedProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ShutdownRejectedProps = {
  response: ShutdownRejectedMessage;
};

/**
 * Renders a shutdown rejected message with a subtle (grey) border.
 */
// ShutdownRejectedDisplay 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShutdownRejectedDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    response
  } = t0;
  // t1 暂存 `<Text color="subtle" bold={true}>Shutdown rejected by {re...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== response.from) {
    // t1 暂存 `<Text color="subtle" bold={true}>Shutdown rejected by {re...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="subtle" bold={true}>Shutdown rejected by {response.from}</Text>;
    // $[0] 缓存 `response.from`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = response.from;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<Box marginTop={1} borderStyle="dashed" borderColor="subt...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== response.reason) {
    // t2 暂存 `<Box marginTop={1} borderStyle="dashed" borderColor="subt...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box marginTop={1} borderStyle="dashed" borderColor="subtle" borderLeft={false} borderRight={false} paddingX={1}><Text>Reason: {response.reason}</Text></Box>;
    // $[2] 缓存 `response.reason`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = response.reason;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Box marginTop={1}><Text dimColor={true}>Teammate is cont...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box marginTop={1}><Text dimColor={true}>Teammate is cont...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box marginTop={1}><Text dimColor={true}>Teammate is continuing to work. You may request shutdown again later.</Text></Box>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t1 || $[6] !== t2) {
    // t4 暂存 `<Box flexDirection="column" marginY={1}><Box borderStyle=...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column" marginY={1}><Box borderStyle="round" borderColor="subtle" flexDirection="column" paddingX={1} paddingY={1}>{t1}{t2}{t3}</Box></Box>;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}

/**
 * Try to parse and render a shutdown message from raw content.
 * Returns the rendered component if it's a shutdown message, null otherwise.
 */
// tryRenderShutdownMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryRenderShutdownMessage(content: string): React.ReactNode | null {
  // request 请求数据保存`isShutdownRequest`，供终端渲染后续处理使用。
  const request = isShutdownRequest(content);
  // 满足 `request` 时，终端渲染执行该分支。
  if (request) {
    // 返回 `<ShutdownRequestDisplay request={request} />`，作为终端渲染这次计算的结果。
    return <ShutdownRequestDisplay request={request} />;
  }

  // Shutdown approved is handled inline by the caller — skip it here
  // 满足 `isShutdownApproved(content)` 时，终端渲染执行该分支。
  if (isShutdownApproved(content)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // rejected保存`isShutdownRejected`，供终端渲染后续处理使用。
  const rejected = isShutdownRejected(content);
  // 满足 `rejected` 时，终端渲染执行该分支。
  if (rejected) {
    // 返回 `<ShutdownRejectedDisplay response={rejected} />`，作为终端渲染这次计算的结果。
    return <ShutdownRejectedDisplay response={rejected} />;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}

/**
 * Get a brief summary text for a shutdown message.
 * Used in places like the inbox queue where we want a short description.
 * Returns null if the content is not a shutdown message.
 */
// getShutdownMessageSummary 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getShutdownMessageSummary(content: string): string | null {
  // request 请求数据保存`isShutdownRequest`，供终端渲染后续处理使用。
  const request = isShutdownRequest(content);
  // 满足 `request` 时，终端渲染执行该分支。
  if (request) {
    // 返回 ``[Shutdown Request from ${request.from}]${request.reason ? ` ${request....`，作为终端渲染这次计算的结果。
    return `[Shutdown Request from ${request.from}]${request.reason ? ` ${request.reason}` : ''}`;
  }
  // approved保存`isShutdownApproved`，供终端渲染后续处理使用。
  const approved = isShutdownApproved(content);
  // 满足 `approved` 时，终端渲染执行该分支。
  if (approved) {
    // 返回 ``[Shutdown Approved] ${approved.from} is now exiting``，作为终端渲染这次计算的结果。
    return `[Shutdown Approved] ${approved.from} is now exiting`;
  }
  // rejected保存`isShutdownRejected`，供终端渲染后续处理使用。
  const rejected = isShutdownRejected(content);
  // 满足 `rejected` 时，终端渲染执行该分支。
  if (rejected) {
    // 返回 ``[Shutdown Rejected] ${rejected.from}: ${rejected.reason}``，作为终端渲染这次计算的结果。
    return `[Shutdown Rejected] ${rejected.from}: ${rejected.reason}`;
  }
  // 返回 `null`，作为终端渲染这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJpc1NodXRkb3duQXBwcm92ZWQiLCJpc1NodXRkb3duUmVqZWN0ZWQiLCJpc1NodXRkb3duUmVxdWVzdCIsIlNodXRkb3duUmVqZWN0ZWRNZXNzYWdlIiwiU2h1dGRvd25SZXF1ZXN0TWVzc2FnZSIsIlNodXRkb3duUmVxdWVzdFByb3BzIiwicmVxdWVzdCIsIlNodXRkb3duUmVxdWVzdERpc3BsYXkiLCJ0MCIsIiQiLCJfYyIsInQxIiwiZnJvbSIsInQyIiwicmVhc29uIiwidDMiLCJTaHV0ZG93blJlamVjdGVkUHJvcHMiLCJyZXNwb25zZSIsIlNodXRkb3duUmVqZWN0ZWREaXNwbGF5IiwiU3ltYm9sIiwiZm9yIiwidDQiLCJ0cnlSZW5kZXJTaHV0ZG93bk1lc3NhZ2UiLCJjb250ZW50IiwiUmVhY3ROb2RlIiwicmVqZWN0ZWQiLCJnZXRTaHV0ZG93bk1lc3NhZ2VTdW1tYXJ5IiwiYXBwcm92ZWQiXSwic291cmNlcyI6WyJTaHV0ZG93bk1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgaXNTaHV0ZG93bkFwcHJvdmVkLFxuICBpc1NodXRkb3duUmVqZWN0ZWQsXG4gIGlzU2h1dGRvd25SZXF1ZXN0LFxuICB0eXBlIFNodXRkb3duUmVqZWN0ZWRNZXNzYWdlLFxuICB0eXBlIFNodXRkb3duUmVxdWVzdE1lc3NhZ2UsXG59IGZyb20gJy4uLy4uL3V0aWxzL3RlYW1tYXRlTWFpbGJveC5qcydcblxudHlwZSBTaHV0ZG93blJlcXVlc3RQcm9wcyA9IHtcbiAgcmVxdWVzdDogU2h1dGRvd25SZXF1ZXN0TWVzc2FnZVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYSBzaHV0ZG93biByZXF1ZXN0IHdpdGggYSB3YXJuaW5nLWNvbG9yZWQgYm9yZGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gU2h1dGRvd25SZXF1ZXN0RGlzcGxheSh7XG4gIHJlcXVlc3QsXG59OiBTaHV0ZG93blJlcXVlc3RQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luWT17MX0+XG4gICAgICA8Qm94XG4gICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICBib3JkZXJDb2xvcj1cIndhcm5pbmdcIlxuICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgcGFkZGluZ1g9ezF9XG4gICAgICAgIHBhZGRpbmdZPXsxfVxuICAgICAgPlxuICAgICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCIgYm9sZD5cbiAgICAgICAgICAgIFNodXRkb3duIHJlcXVlc3QgZnJvbSB7cmVxdWVzdC5mcm9tfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtyZXF1ZXN0LnJlYXNvbiAmJiAoXG4gICAgICAgICAgPEJveD5cbiAgICAgICAgICAgIDxUZXh0PlJlYXNvbjoge3JlcXVlc3QucmVhc29ufTwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG5cbnR5cGUgU2h1dGRvd25SZWplY3RlZFByb3BzID0ge1xuICByZXNwb25zZTogU2h1dGRvd25SZWplY3RlZE1lc3NhZ2Vcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgc2h1dGRvd24gcmVqZWN0ZWQgbWVzc2FnZSB3aXRoIGEgc3VidGxlIChncmV5KSBib3JkZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBTaHV0ZG93blJlamVjdGVkRGlzcGxheSh7XG4gIHJlc3BvbnNlLFxufTogU2h1dGRvd25SZWplY3RlZFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5ZPXsxfT5cbiAgICAgIDxCb3hcbiAgICAgICAgYm9yZGVyU3R5bGU9XCJyb3VuZFwiXG4gICAgICAgIGJvcmRlckNvbG9yPVwic3VidGxlXCJcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIHBhZGRpbmdYPXsxfVxuICAgICAgICBwYWRkaW5nWT17MX1cbiAgICAgID5cbiAgICAgICAgPFRleHQgY29sb3I9XCJzdWJ0bGVcIiBib2xkPlxuICAgICAgICAgIFNodXRkb3duIHJlamVjdGVkIGJ5IHtyZXNwb25zZS5mcm9tfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxCb3hcbiAgICAgICAgICBtYXJnaW5Ub3A9ezF9XG4gICAgICAgICAgYm9yZGVyU3R5bGU9XCJkYXNoZWRcIlxuICAgICAgICAgIGJvcmRlckNvbG9yPVwic3VidGxlXCJcbiAgICAgICAgICBib3JkZXJMZWZ0PXtmYWxzZX1cbiAgICAgICAgICBib3JkZXJSaWdodD17ZmFsc2V9XG4gICAgICAgICAgcGFkZGluZ1g9ezF9XG4gICAgICAgID5cbiAgICAgICAgICA8VGV4dD5SZWFzb246IHtyZXNwb25zZS5yZWFzb259PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgVGVhbW1hdGUgaXMgY29udGludWluZyB0byB3b3JrLiBZb3UgbWF5IHJlcXVlc3Qgc2h1dGRvd24gYWdhaW5cbiAgICAgICAgICAgIGxhdGVyLlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG4vKipcbiAqIFRyeSB0byBwYXJzZSBhbmQgcmVuZGVyIGEgc2h1dGRvd24gbWVzc2FnZSBmcm9tIHJhdyBjb250ZW50LlxuICogUmV0dXJucyB0aGUgcmVuZGVyZWQgY29tcG9uZW50IGlmIGl0J3MgYSBzaHV0ZG93biBtZXNzYWdlLCBudWxsIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeVJlbmRlclNodXRkb3duTWVzc2FnZShcbiAgY29udGVudDogc3RyaW5nLFxuKTogUmVhY3QuUmVhY3ROb2RlIHwgbnVsbCB7XG4gIGNvbnN0IHJlcXVlc3QgPSBpc1NodXRkb3duUmVxdWVzdChjb250ZW50KVxuICBpZiAocmVxdWVzdCkge1xuICAgIHJldHVybiA8U2h1dGRvd25SZXF1ZXN0RGlzcGxheSByZXF1ZXN0PXtyZXF1ZXN0fSAvPlxuICB9XG5cbiAgLy8gU2h1dGRvd24gYXBwcm92ZWQgaXMgaGFuZGxlZCBpbmxpbmUgYnkgdGhlIGNhbGxlciDigJQgc2tpcCBpdCBoZXJlXG4gIGlmIChpc1NodXRkb3duQXBwcm92ZWQoY29udGVudCkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgcmVqZWN0ZWQgPSBpc1NodXRkb3duUmVqZWN0ZWQoY29udGVudClcbiAgaWYgKHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIDxTaHV0ZG93blJlamVjdGVkRGlzcGxheSByZXNwb25zZT17cmVqZWN0ZWR9IC8+XG4gIH1cblxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEdldCBhIGJyaWVmIHN1bW1hcnkgdGV4dCBmb3IgYSBzaHV0ZG93biBtZXNzYWdlLlxuICogVXNlZCBpbiBwbGFjZXMgbGlrZSB0aGUgaW5ib3ggcXVldWUgd2hlcmUgd2Ugd2FudCBhIHNob3J0IGRlc2NyaXB0aW9uLlxuICogUmV0dXJucyBudWxsIGlmIHRoZSBjb250ZW50IGlzIG5vdCBhIHNodXRkb3duIG1lc3NhZ2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTaHV0ZG93bk1lc3NhZ2VTdW1tYXJ5KGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCByZXF1ZXN0ID0gaXNTaHV0ZG93blJlcXVlc3QoY29udGVudClcbiAgaWYgKHJlcXVlc3QpIHtcbiAgICByZXR1cm4gYFtTaHV0ZG93biBSZXF1ZXN0IGZyb20gJHtyZXF1ZXN0LmZyb219XSR7cmVxdWVzdC5yZWFzb24gPyBgICR7cmVxdWVzdC5yZWFzb259YCA6ICcnfWBcbiAgfVxuXG4gIGNvbnN0IGFwcHJvdmVkID0gaXNTaHV0ZG93bkFwcHJvdmVkKGNvbnRlbnQpXG4gIGlmIChhcHByb3ZlZCkge1xuICAgIHJldHVybiBgW1NodXRkb3duIEFwcHJvdmVkXSAke2FwcHJvdmVkLmZyb219IGlzIG5vdyBleGl0aW5nYFxuICB9XG5cbiAgY29uc3QgcmVqZWN0ZWQgPSBpc1NodXRkb3duUmVqZWN0ZWQoY29udGVudClcbiAgaWYgKHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIGBbU2h1dGRvd24gUmVqZWN0ZWRdICR7cmVqZWN0ZWQuZnJvbX06ICR7cmVqZWN0ZWQucmVhc29ufWBcbiAgfVxuXG4gIHJldHVybiBudWxsXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FDRUMsa0JBQWtCLEVBQ2xCQyxrQkFBa0IsRUFDbEJDLGlCQUFpQixFQUNqQixLQUFLQyx1QkFBdUIsRUFDNUIsS0FBS0Msc0JBQXNCLFFBQ3RCLGdDQUFnQztBQUV2QyxLQUFLQyxvQkFBb0IsR0FBRztFQUMxQkMsT0FBTyxFQUFFRixzQkFBc0I7QUFDakMsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFHLHVCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWdDO0lBQUFKO0VBQUEsSUFBQUUsRUFFaEI7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBSCxPQUFBLENBQUFNLElBQUE7SUFVZkQsRUFBQSxJQUFDLEdBQUcsQ0FBZSxZQUFDLENBQUQsR0FBQyxDQUNsQixDQUFDLElBQUksQ0FBTyxLQUFTLENBQVQsU0FBUyxDQUFD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