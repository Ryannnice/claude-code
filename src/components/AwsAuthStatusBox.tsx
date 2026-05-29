// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useState } from 'react';
// 引入 Box、Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../ink.js';
// 复用 AwsAuthStatus、AwsAuthStatusManager 工具函数，把通用处理留在 ../utils/awsAuthStatusManager.js 中维护。
import { type AwsAuthStatus, AwsAuthStatusManager } from '../utils/awsAuthStatusManager.js';
// URL_RE保存`/https?:\/\/\S+/`，供后续判断或组装使用。
const URL_RE = /https?:\/\/\S+/;
// AwsAuthStatusBox 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AwsAuthStatusBox() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // t0 暂存 `AwsAuthStatusManager.getInstance().getStatus()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `AwsAuthStatusManager.getInstance().getStatus()` 生成的渲染片段，后续返回路径直接复用。
    t0 = AwsAuthStatusManager.getInstance().getStatus();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // status 集合 由 React state 持有，setStatus 会在用户操作或异步结果返回时触发刷新。
  const [status, setStatus] = useState(t0);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // unsubscribe读取`AwsAuthStatusManager.getInstance`，供终端渲染后续处理使用。
      const unsubscribe = AwsAuthStatusManager.getInstance().subscribe(setStatus);
      // 返回 `unsubscribe`，作为终端渲染这次计算的结果。
      return unsubscribe;
    };
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // 只有 `!status.isAuthenticating && !status.error && stat` 满足时，终端渲染才执行该分支。
  if (!status.isAuthenticating && !status.error && status.output.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `!status.isAuthenticating && !status.error` 满足时，终端渲染才执行该分支。
  if (!status.isAuthenticating && !status.error) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t3 暂存 `<Text bold={true} color="permission">Cloud Authentication...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text bold={true} color="permission">Cloud Authentication...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true} color="permission">Cloud Authentication</Text>;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // t4 暂存 `status.output.length > 0 && <Box flexDirection="column" m...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== status.output) {
    // t4 暂存 `status.output.length > 0 && <Box flexDirection="column" m...` 生成的渲染片段，后续返回路径直接复用。
    t4 = status.output.length > 0 && <Box flexDirection="column" marginTop={1}>{status.output.slice(-5).map(_temp)}</Box>;
    // $[4] 缓存 `status.output`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = status.output;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `status.error && <Box marginTop={1}><Text color="error">{s...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== status.error) {
    // t5 暂存 `status.error && <Box marginTop={1}><Text color="error">{s...` 生成的渲染片段，后续返回路径直接复用。
    t5 = status.error && <Box marginTop={1}><Text color="error">{status.error}</Text></Box>;
    // $[6] 缓存 `status.error`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = status.error;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `<Box flexDirection="column" borderStyle="round" borderCol...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t4 || $[9] !== t5) {
    // t6 暂存 `<Box flexDirection="column" borderStyle="round" borderCol...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" borderStyle="round" borderColor="permission" paddingX={1} marginY={1}>{t3}{t4}{t5}</Box>;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(line, index) {
  // m匹配`line.match`，供终端渲染后续处理使用。
  const m = line.match(URL_RE);
  // m缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!m) {
    // 返回 `<Text key={index} dimColor={true}>{line}</Text>`，作为终端渲染这次计算的结果。
    return <Text key={index} dimColor={true}>{line}</Text>;
  }
  // URL读取 `m[0]` 对应条目，后续围绕该成员继续处理。
  const url = m[0];
  // start保存`m.index ?? 0`，供后续判断或组装使用。
  const start = m.index ?? 0;
  // before格式化`line.slice`，供终端渲染后续处理使用。
  const before = line.slice(0, start);
  // after格式化`line.slice`，供终端渲染后续处理使用。
  const after = line.slice(start + url.length);
  // 返回 `<Text key={index} dimColor={true}>{before}<Link url={url}>{url}</Link>{...`，作为终端渲染这次计算的结果。
  return <Text key={index} dimColor={true}>{before}<Link url={url}>{url}</Link>{after}</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiQm94IiwiTGluayIsIlRleHQiLCJBd3NBdXRoU3RhdHVzIiwiQXdzQXV0aFN0YXR1c01hbmFnZXIiLCJVUkxfUkUiLCJBd3NBdXRoU3RhdHVzQm94IiwiJCIsIl9jIiwidDAiLCJTeW1ib2wiLCJmb3IiLCJnZXRJbnN0YW5jZSIsImdldFN0YXR1cyIsInN0YXR1cyIsInNldFN0YXR1cyIsInQxIiwidDIiLCJ1bnN1YnNjcmliZSIsInN1YnNjcmliZSIsImlzQXV0aGVudGljYXRpbmciLCJlcnJvciIsIm91dHB1dCIsImxlbmd0aCIsInQzIiwidDQiLCJzbGljZSIsIm1hcCIsIl90ZW1wIiwidDUiLCJ0NiIsImxpbmUiLCJpbmRleCIsIm0iLCJtYXRjaCIsInVybCIsInN0YXJ0IiwiYmVmb3JlIiwiYWZ0ZXIiXSwic291cmNlcyI6WyJBd3NBdXRoU3RhdHVzQm94LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBMaW5rLCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBd3NBdXRoU3RhdHVzLFxuICBBd3NBdXRoU3RhdHVzTWFuYWdlcixcbn0gZnJvbSAnLi4vdXRpbHMvYXdzQXV0aFN0YXR1c01hbmFnZXIuanMnXG5cbmNvbnN0IFVSTF9SRSA9IC9odHRwcz86XFwvXFwvXFxTKy9cblxuZXhwb3J0IGZ1bmN0aW9uIEF3c0F1dGhTdGF0dXNCb3goKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3N0YXR1cywgc2V0U3RhdHVzXSA9IHVzZVN0YXRlPEF3c0F1dGhTdGF0dXM+KFxuICAgIEF3c0F1dGhTdGF0dXNNYW5hZ2VyLmdldEluc3RhbmNlKCkuZ2V0U3RhdHVzKCksXG4gIClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIFN1YnNjcmliZSB0byBzdGF0dXMgdXBkYXRlc1xuICAgIGNvbnN0IHVuc3Vic2NyaWJlID0gQXdzQXV0aFN0YXR1c01hbmFnZXIuZ2V0SW5zdGFuY2UoKS5zdWJzY3JpYmUoc2V0U3RhdHVzKVxuICAgIHJldHVybiB1bnN1YnNjcmliZVxuICB9LCBbXSlcblxuICAvLyBEb24ndCBzaG93IGFueXRoaW5nIGlmIG5vdCBhdXRoZW50aWNhdGluZyBhbmQgbm8gZXJyb3JcbiAgaWYgKCFzdGF0dXMuaXNBdXRoZW50aWNhdGluZyAmJiAhc3RhdHVzLmVycm9yICYmIHN0YXR1cy5vdXRwdXQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIERvbid0IHNob3cgaWYgYXV0aGVudGljYXRpb24gc3VjY2VlZGVkIChubyBlcnJvciBhbmQgbm90IGF1dGhlbnRpY2F0aW5nKVxuICBpZiAoIXN0YXR1cy5pc0F1dGhlbnRpY2F0aW5nICYmICFzdGF0dXMuZXJyb3IpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgYm9yZGVyQ29sb3I9XCJwZXJtaXNzaW9uXCJcbiAgICAgIHBhZGRpbmdYPXsxfVxuICAgICAgbWFyZ2luWT17MX1cbiAgICA+XG4gICAgICA8VGV4dCBib2xkIGNvbG9yPVwicGVybWlzc2lvblwiPlxuICAgICAgICBDbG91ZCBBdXRoZW50aWNhdGlvblxuICAgICAgPC9UZXh0PlxuXG4gICAgICB7c3RhdHVzLm91dHB1dC5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICB7c3RhdHVzLm91dHB1dC5zbGljZSgtNSkubWFwKChsaW5lLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbSA9IGxpbmUubWF0Y2goVVJMX1JFKVxuICAgICAgICAgICAgaWYgKCFtKSB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPFRleHQga2V5PXtpbmRleH0gZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgICB7bGluZX1cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHVybCA9IG1bMF1cbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gbS5pbmRleCA/PyAwXG4gICAgICAgICAgICBjb25zdCBiZWZvcmUgPSBsaW5lLnNsaWNlKDAsIHN0YXJ0KVxuICAgICAgICAgICAgY29uc3QgYWZ0ZXIgPSBsaW5lLnNsaWNlKHN0YXJ0ICsgdXJsLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgIDxUZXh0IGtleT17aW5kZXh9IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIHtiZWZvcmV9XG4gICAgICAgICAgICAgICAgPExpbmsgdXJsPXt1cmx9Pnt1cmx9PC9MaW5rPlxuICAgICAgICAgICAgICAgIHthZnRlcn1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKVxuICAgICAgICAgIH0pfVxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMuZXJyb3IgJiYgKFxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPntzdGF0dXMuZXJyb3J9PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsU0FBUyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNsRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDM0MsU0FDRSxLQUFLQyxhQUFhLEVBQ2xCQyxvQkFBb0Is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