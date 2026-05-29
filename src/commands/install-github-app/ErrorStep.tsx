// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 GITHUB_ACTION_SETUP_DOCS_URL，将 ../../constants/github-app.js 中已经封装好的能力接到本文件流程里。
import { GITHUB_ACTION_SETUP_DOCS_URL } from '../../constants/github-app.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// ErrorStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ErrorStepProps {
  error: string | undefined;
  errorReason?: string;
  errorInstructions?: string[];
}
// ErrorStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ErrorStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    error,
    errorReason,
    errorInstructions
  } = t0;
  // t1 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box flexDirection="column" marginBottom={1}><Text bold={true}>Install GitHub App</Text></Box>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `<Text color="error">Error: {error}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== error) {
    // t2 暂存 `<Text color="error">Error: {error}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color="error">Error: {error}</Text>;
    // $[1] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = error;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `errorReason && <Box marginTop={1}><Text dimColor={true}>R...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== errorReason) {
    // t3 暂存 `errorReason && <Box marginTop={1}><Text dimColor={true}>R...` 生成的渲染片段，后续返回路径直接复用。
    t3 = errorReason && <Box marginTop={1}><Text dimColor={true}>Reason: {errorReason}</Text></Box>;
    // $[3] 缓存 `errorReason`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = errorReason;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `errorInstructions && errorInstructions.length > 0 && <Box...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== errorInstructions) {
    // t4 暂存 `errorInstructions && errorInstructions.length > 0 && <Box...` 生成的渲染片段，后续返回路径直接复用。
    t4 = errorInstructions && errorInstructions.length > 0 && <Box flexDirection="column" marginTop={1}><Text dimColor={true}>How to fix:</Text>{errorInstructions.map(_temp)}</Box>;
    // $[5] 缓存 `errorInstructions`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = errorInstructions;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Box marginTop={1}><Text dimColor={true}>For manual setup...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Box marginTop={1}><Text dimColor={true}>For manual setup...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box marginTop={1}><Text dimColor={true}>For manual setup instructions, see:{" "}<Text color="claude">{GITHUB_ACTION_SETUP_DOCS_URL}</Text></Text></Box>;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `<Box flexDirection="column" borderStyle="round" paddingX=...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t2 || $[9] !== t3 || $[10] !== t4) {
    // t6 暂存 `<Box flexDirection="column" borderStyle="round" paddingX=...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" borderStyle="round" paddingX={1}>{t1}{t2}{t3}{t4}{t5}</Box>;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // t7 暂存 `<Box marginLeft={3}><Text dimColor={true}>Press any key t...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Box marginLeft={3}><Text dimColor={true}>Press any key t...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginLeft={3}><Text dimColor={true}>Press any key to exit</Text></Box>;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // t8 暂存 `<>{t6}{t7}</>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t6) {
    // t8 暂存 `<>{t6}{t7}</>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <>{t6}{t7}</>;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // 返回 `t8`，作为命令处理这次计算的结果。
  return t8;
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(instruction, index) {
  // 返回 `<Box key={index} marginLeft={2}><Text dimColor={true}>• </Text><Text>{i...`，作为命令处理这次计算的结果。
  return <Box key={index} marginLeft={2}><Text dimColor={true}>• </Text><Text>{instruction}</Text></Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkdJVEhVQl9BQ1RJT05fU0VUVVBfRE9DU19VUkwiLCJCb3giLCJUZXh0IiwiRXJyb3JTdGVwUHJvcHMiLCJlcnJvciIsImVycm9yUmVhc29uIiwiZXJyb3JJbnN0cnVjdGlvbnMiLCJFcnJvclN0ZXAiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwidDIiLCJ0MyIsInQ0IiwibGVuZ3RoIiwibWFwIiwiX3RlbXAiLCJ0NSIsInQ2IiwidDciLCJ0OCIsImluc3RydWN0aW9uIiwiaW5kZXgiXSwic291cmNlcyI6WyJFcnJvclN0ZXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEdJVEhVQl9BQ1RJT05fU0VUVVBfRE9DU19VUkwgfSBmcm9tICcuLi8uLi9jb25zdGFudHMvZ2l0aHViLWFwcC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcblxuaW50ZXJmYWNlIEVycm9yU3RlcFByb3BzIHtcbiAgZXJyb3I6IHN0cmluZyB8IHVuZGVmaW5lZFxuICBlcnJvclJlYXNvbj86IHN0cmluZ1xuICBlcnJvckluc3RydWN0aW9ucz86IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBFcnJvclN0ZXAoe1xuICBlcnJvcixcbiAgZXJyb3JSZWFzb24sXG4gIGVycm9ySW5zdHJ1Y3Rpb25zLFxufTogRXJyb3JTdGVwUHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgYm9yZGVyU3R5bGU9XCJyb3VuZFwiIHBhZGRpbmdYPXsxfT5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICA8VGV4dCBib2xkPkluc3RhbGwgR2l0SHViIEFwcDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5FcnJvcjoge2Vycm9yfTwvVGV4dD5cbiAgICAgICAge2Vycm9yUmVhc29uICYmIChcbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5SZWFzb246IHtlcnJvclJlYXNvbn08L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICAgIHtlcnJvckluc3RydWN0aW9ucyAmJiBlcnJvckluc3RydWN0aW9ucy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+SG93IHRvIGZpeDo8L1RleHQ+XG4gICAgICAgICAgICB7ZXJyb3JJbnN0cnVjdGlvbnMubWFwKChpbnN0cnVjdGlvbiwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgPEJveCBrZXk9e2luZGV4fSBtYXJnaW5MZWZ0PXsyfT5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7igKIgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0PntpbnN0cnVjdGlvbn08L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIEZvciBtYW51YWwgc2V0dXAgaW5zdHJ1Y3Rpb25zLCBzZWU6eycgJ31cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+e0dJVEhVQl9BQ1RJT05fU0VUVVBfRE9DU19VUkx9PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICAgIDxCb3ggbWFyZ2luTGVmdD17M30+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlByZXNzIGFueSBrZXkgdG8gZXhpdDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyw0QkFBNEIsUUFBUSwrQkFBK0I7QUFDNUUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUV4QyxVQUFVQyxjQUFjLENBQUM7RUFDdkJDLEtBQUssRUFBRSxNQUFNLEdBQUcsU0FBUztFQUN6QkMsV0FBVyxDQUFDLEVBQUUsTUFBTTtFQUNwQkMsaUJBQWlCLENBQUMsRUFBRSxNQUFNLEVBQUU7QUFDOUI7QUFFQSxPQUFPLFNBQUFDLFVBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBbUI7SUFBQU4sS0FBQTtJQUFBQyxXQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFJVDtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUlURixFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQWUsWUFBQyxDQUFELEdBQUMsQ0FDekMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFDLGtCQUFrQixFQUE1QixJQUFJLENBQ1AsRUFGQyxHQUFHLENBRUU7SUFBQUYsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBTCxLQUFBO0lBQ05VLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBTyxDQUFQLE9BQU8sQ0FBQyxPQUFRVixNQUFJLENBQUUsRUFBakMsSUFBSSxDQUFvQztJQUFBSyxDQUFBLE1BQUFMLEtBQUE7SUFBQUssQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBSixXQUFBO0lBQ3hDVSxFQUFBLEdBQUFWLFdBSUEsSUFIQyxDQUFDLEdBQUcsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUNmLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxRQUFTQSxZQUFVLENBQUUsRUFBbkMsSUFBSSxDQUNQLEVBRkMsR0FBRyxDQUdMO0lBQUFJLENBQUEsTUFBQUosV0FBQTtJQUFBSSxDQUFBLE1BQUFNLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQUFBLElBQUFPLEVBQUE7RUFBQSxJQUFBUCxDQUFBLFFBQUFILGlCQUFBO0lBQ0FVLEVBQUEsR0FBQVYsaUJBQWlELElBQTVCQSxpQkFBaUIsQ0FBQVcsTUFBTyxHQUFHLENBVWhELElBVEMsQ0FBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUN0QyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsV0FBVyxFQUF6QixJQUFJLENBQ0osQ0FBQVgsaUJBQWlCLENBQUFZLEdBQUksQ0FBQ0MsS0FLdEIsRUFDSCxFQVJDLEdBQUcsQ0FTTDtJQUFBVixDQUFBLE1BQUFILGlCQUFBO0lBQUFHLENBQUEsTUFBQU8sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtFQUFBO0VBQUEsSUFBQVcsRUFBQTtFQUFBLElBQUFYLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBQ0RPLEVBQUEsSUFBQyxHQUFHLENBQVksU0FBQyxDQUFELEdBQUMsQ0FDZixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsbUNBQ3VCLElBQUUsQ0FDdEMsQ0FBQyxJQUFJLENBQU8sS0FBUSxDQUFSLFFBQVEsQ0FBRXBCLDZCQUEyQixDQUFFLEVBQWxELElBQUksQ0FDUCxFQUhDLElBQUksQ0FJUCxFQUxDLEdBQUcsQ0FLRTtJQUFBUyxDQUFBLE1BQUFXLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFYLENBQUE7RUFBQTtFQUFBLElBQUFZLEVBQUE7RUFBQSxJQUFBWixDQUFBLFFBQUFLLEVBQUEsSUFBQUwsQ0FBQSxRQUFBTSxFQUFBLElBQUFOLENBQUEsU0FBQU8sRUFBQTtJQTFCUkssRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFhLFdBQU8sQ0FBUCxPQUFPLENBQVcsUUFBQyxDQUFELEdBQUMsQ0FDekQsQ0FBQVYsRUFFSyxDQUNMLENBQUFHLEVBQXdDLENBQ3ZDLENBQUFDLEVBSUQsQ0FDQyxDQUFBQyxFQVVELENBQ0EsQ0FBQUksRUFLSyxDQUNQLEVBM0JDLEdBQUcsQ0EyQkU7SUFBQVgsQ0FBQSxNQUFBSyxFQUFBO0lBQUFMLENBQUEsTUFBQU0sRUFBQTtJQUFBTixDQUFBLE9BQUFPLEVBQUE7SUFBQVAsQ0FBQSxPQUFBWSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWixDQUFBO0VBQUE7RUFBQSxJQUFBYSxFQUFBO0VBQUEsSUFBQWIsQ0FBQSxTQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFDTlMsRUFBQSxJQUFDLEdBQUcsQ0FBYSxVQUFDLENBQUQsR0FBQyxDQUNoQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMscUJBQXFCLEVBQW5DLElBQUksQ0FDUCxFQUZDLEdBQUcsQ0FFRTtJQUFBYixDQUFBLE9BQUFhLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFiLENBQUE7RUFBQTtFQUFBLElBQUFjLEVBQUE7RUFBQSxJQUFBZCxDQUFBLFNBQUFZLEVBQUE7SUEvQlJFLEVBQUEsS0FDRSxDQUFBRixFQTJCSyxDQUNMLENBQUFDLEVBRUssQ0FBQyxHQUNMO0lBQUFiLENBQUEsT0FBQVksRUFBQTtJQUFBWixDQUFBLE9BQUFjLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQUFBLE9BaENIYyxFQWdDRztBQUFBO0FBdENBLFNBQUFKLE1BQUFLLFdBQUEsRUFBQUMsS0FBQTtFQUFBLE9BcUJPLENBQUMsR0FBRyxDQUFNQSxHQUFLLENBQUxBLE1BQUksQ0FBQyxDQUFjLFVBQUMsQ0FBRCxHQUFDLENBQzVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxFQUFFLEVBQWhCLElBQUksQ0FDTCxDQUFDLElBQUksQ0FBRUQsWUFBVSxDQUFFLEVBQWxCLElBQUksQ0FDUCxFQUhDLEdBQUcsQ0FHRTtBQUFBIiwiaWdub3JlTGlzdCI6W119