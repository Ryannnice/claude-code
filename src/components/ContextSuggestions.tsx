// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 类型依赖 { ContextSuggestion } 来自 ../utils/contextSuggestions.js，用于校准终端渲染的数据契约。
import type { ContextSuggestion } from '../utils/contextSuggestions.js';
// 复用 formatTokens 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatTokens } from '../utils/format.js';
// 引入 StatusIcon，将 ./design-system/StatusIcon.js 中已经封装好的能力接到本文件流程里。
import { StatusIcon } from './design-system/StatusIcon.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  suggestions: ContextSuggestion[];
};
// ContextSuggestions 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ContextSuggestions(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    suggestions
  } = t0;
  // suggestions 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (suggestions.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `<Text bold={true}>Suggestions</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text bold={true}>Suggestions</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true}>Suggestions</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `suggestions.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== suggestions) {
    // t2 暂存 `suggestions.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t2 = suggestions.map(_temp);
    // $[1] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = suggestions;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Box flexDirection="column" marginTop={1}>{t1}{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t2) {
    // t3 暂存 `<Box flexDirection="column" marginTop={1}>{t1}{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" marginTop={1}>{t1}{t2}</Box>;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(suggestion, i) {
  // 返回 `<Box key={i} flexDirection="column" marginTop={i === 0 ? 0 : 1}><Box><S...`，作为终端渲染这次计算的结果。
  return <Box key={i} flexDirection="column" marginTop={i === 0 ? 0 : 1}><Box><StatusIcon status={suggestion.severity} withSpace={true} /><Text bold={true}>{suggestion.title}</Text>{suggestion.savingsTokens ? <Text dimColor={true}>{" "}{figures.arrowRight} save ~{formatTokens(suggestion.savingsTokens)}</Text> : null}</Box><Box marginLeft={2}><Text dimColor={true}>{suggestion.detail}</Text></Box></Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiQ29udGV4dFN1Z2dlc3Rpb24iLCJmb3JtYXRUb2tlbnMiLCJTdGF0dXNJY29uIiwiUHJvcHMiLCJzdWdnZXN0aW9ucyIsIkNvbnRleHRTdWdnZXN0aW9ucyIsInQwIiwiJCIsIl9jIiwibGVuZ3RoIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJ0MiIsIm1hcCIsIl90ZW1wIiwidDMiLCJzdWdnZXN0aW9uIiwiaSIsInNldmVyaXR5IiwidGl0bGUiLCJzYXZpbmdzVG9rZW5zIiwiYXJyb3dSaWdodCIsImRldGFpbCJdLCJzb3VyY2VzIjpbIkNvbnRleHRTdWdnZXN0aW9ucy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBDb250ZXh0U3VnZ2VzdGlvbiB9IGZyb20gJy4uL3V0aWxzL2NvbnRleHRTdWdnZXN0aW9ucy5qcydcbmltcG9ydCB7IGZvcm1hdFRva2VucyB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IFN0YXR1c0ljb24gfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vU3RhdHVzSWNvbi5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgc3VnZ2VzdGlvbnM6IENvbnRleHRTdWdnZXN0aW9uW11cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENvbnRleHRTdWdnZXN0aW9ucyh7IHN1Z2dlc3Rpb25zIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgaWYgKHN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGxcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICA8VGV4dCBib2xkPlN1Z2dlc3Rpb25zPC9UZXh0PlxuICAgICAge3N1Z2dlc3Rpb25zLm1hcCgoc3VnZ2VzdGlvbiwgaSkgPT4gKFxuICAgICAgICA8Qm94IGtleT17aX0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17aSA9PT0gMCA/IDAgOiAxfT5cbiAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgPFN0YXR1c0ljb24gc3RhdHVzPXtzdWdnZXN0aW9uLnNldmVyaXR5fSB3aXRoU3BhY2UgLz5cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+e3N1Z2dlc3Rpb24udGl0bGV9PC9UZXh0PlxuICAgICAgICAgICAge3N1Z2dlc3Rpb24uc2F2aW5nc1Rva2VucyA/IChcbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgeycgJ31cbiAgICAgICAgICAgICAgICB7ZmlndXJlcy5hcnJvd1JpZ2h0fSBzYXZlIH5cbiAgICAgICAgICAgICAgICB7Zm9ybWF0VG9rZW5zKHN1Z2dlc3Rpb24uc2F2aW5nc1Rva2Vucyl9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57c3VnZ2VzdGlvbi5kZXRhaWx9PC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgICkpfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsY0FBY0MsaUJBQWlCLFFBQVEsZ0NBQWdDO0FBQ3ZFLFNBQVNDLFlBQVksUUFBUSxvQkFBb0I7QUFDakQsU0FBU0MsVUFBVSxRQUFRLCtCQUErQjtBQUUxRCxLQUFLQyxLQUFL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