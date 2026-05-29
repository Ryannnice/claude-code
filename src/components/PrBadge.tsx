// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Link, Text } from '../ink.js';
// 类型依赖 { PrReviewState } 来自 ../utils/ghPrStatus.js，用于校准终端渲染的数据契约。
import type { PrReviewState } from '../utils/ghPrStatus.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  number: number;
  url: string;
  reviewState?: PrReviewState;
  bold?: boolean;
};
// PrBadge 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PrBadge(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(21);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    number,
    url,
    reviewState,
    bold
  } = t0;
  // t1 暂存 `getPrStatusColor(reviewState)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== reviewState) {
    // t1 暂存 `getPrStatusColor(reviewState)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getPrStatusColor(reviewState);
    // $[0] 缓存 `reviewState`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = reviewState;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // statusColor沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const statusColor = t1;
  // t2标记终端 UI Pr Badge是否启用对应路径。
  const t2 = !statusColor && !bold;
  // t3 暂存 `<Text color={statusColor} dimColor={t2} bold={bold}>#{num...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== bold || $[3] !== number || $[4] !== statusColor || $[5] !== t2) {
    // t3 暂存 `<Text color={statusColor} dimColor={t2} bold={bold}>#{num...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color={statusColor} dimColor={t2} bold={bold}>#{number}</Text>;
    // $[2] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = bold;
    // $[3] 缓存 `number`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = number;
    // $[4] 缓存 `statusColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = statusColor;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // label保存`t3`，作为后续临时缓存值处理的输入。
  const label = t3;
  // t4标记终端 UI Pr Badge是否启用对应路径。
  const t4 = !bold;
  // t5 暂存 `<Text dimColor={t4}>PR</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t4) {
    // t5 暂存 `<Text dimColor={t4}>PR</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={t4}>PR</Text>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6标记终端 UI Pr Badge是否启用对应路径。
  const t6 = !statusColor && !bold;
  // t7 暂存 `<Text color={statusColor} dimColor={t6} underline={true} ...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== bold || $[10] !== number || $[11] !== statusColor || $[12] !== t6) {
    // t7 暂存 `<Text color={statusColor} dimColor={t6} underline={true} ...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text color={statusColor} dimColor={t6} underline={true} bold={bold}>#{number}</Text>;
    // $[9] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = bold;
    // $[10] 缓存 `number`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = number;
    // $[11] 缓存 `statusColor`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = statusColor;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[13];
  }
  // t8 暂存 `<Link url={url} fallback={label}>{t7}</Link>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== label || $[15] !== t7 || $[16] !== url) {
    // t8 暂存 `<Link url={url} fallback={label}>{t7}</Link>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Link url={url} fallback={label}>{t7}</Link>;
    // $[14] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = label;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
    // $[16] 缓存 `url`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = url;
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[17];
  }
  // t9 暂存 `<Text>{t5}{" "}{t8}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t5 || $[19] !== t8) {
    // t9 暂存 `<Text>{t5}{" "}{t8}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text>{t5}{" "}{t8}</Text>;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
// getPrStatusColor 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPrStatusColor(state?: PrReviewState): 'success' | 'error' | 'warning' | 'merged' | undefined {
  // 按照 state 的取值选择终端渲染的具体处理分支。
  switch (state) {
    case 'approved':
      // 返回 `'success'`，作为终端渲染这次计算的结果。
      return 'success';
    case 'changes_requested':
      // 返回 `'error'`，作为终端渲染这次计算的结果。
      return 'error';
    case 'pending':
      // 返回 `'warning'`，作为终端渲染这次计算的结果。
      return 'warning';
    case 'merged':
      // 返回 `'merged'`，作为终端渲染这次计算的结果。
      return 'merged';
    default:
      // 返回 `undefined`，作为终端渲染这次计算的结果。
      return undefined;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkxpbmsiLCJUZXh0IiwiUHJSZXZpZXdTdGF0ZSIsIlByb3BzIiwibnVtYmVyIiwidXJsIiwicmV2aWV3U3RhdGUiLCJib2xkIiwiUHJCYWRnZSIsInQwIiwiJCIsIl9jIiwidDEiLCJnZXRQclN0YXR1c0NvbG9yIiwic3RhdHVzQ29sb3IiLCJ0MiIsInQzIiwibGFiZWwiLCJ0NCIsInQ1IiwidDYiLCJ0NyIsInQ4IiwidDkiLCJzdGF0ZSIsInVuZGVmaW5lZCJdLCJzb3VyY2VzIjpbIlByQmFkZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IExpbmssIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFByUmV2aWV3U3RhdGUgfSBmcm9tICcuLi91dGlscy9naFByU3RhdHVzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBudW1iZXI6IG51bWJlclxuICB1cmw6IHN0cmluZ1xuICByZXZpZXdTdGF0ZT86IFByUmV2aWV3U3RhdGVcbiAgYm9sZD86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByQmFkZ2Uoe1xuICBudW1iZXIsXG4gIHVybCxcbiAgcmV2aWV3U3RhdGUsXG4gIGJvbGQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHN0YXR1c0NvbG9yID0gZ2V0UHJTdGF0dXNDb2xvcihyZXZpZXdTdGF0ZSlcbiAgY29uc3QgbGFiZWwgPSAoXG4gICAgPFRleHQgY29sb3I9e3N0YXR1c0NvbG9yfSBkaW1Db2xvcj17IXN0YXR1c0NvbG9yICYmICFib2xkfSBib2xkPXtib2xkfT5cbiAgICAgICN7bnVtYmVyfVxuICAgIDwvVGV4dD5cbiAgKVxuICByZXR1cm4gKFxuICAgIDxUZXh0PlxuICAgICAgPFRleHQgZGltQ29sb3I9eyFib2xkfT5QUjwvVGV4dD57JyAnfVxuICAgICAgPExpbmsgdXJsPXt1cmx9IGZhbGxiYWNrPXtsYWJlbH0+XG4gICAgICAgIDxUZXh0XG4gICAgICAgICAgY29sb3I9e3N0YXR1c0NvbG9yfVxuICAgICAgICAgIGRpbUNvbG9yPXshc3RhdHVzQ29sb3IgJiYgIWJvbGR9XG4gICAgICAgICAgdW5kZXJsaW5lXG4gICAgICAgICAgYm9sZD17Ym9sZH1cbiAgICAgICAgPlxuICAgICAgICAgICN7bnVtYmVyfVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0xpbms+XG4gICAgPC9UZXh0PlxuICApXG59XG5cbmZ1bmN0aW9uIGdldFByU3RhdHVzQ29sb3IoXG4gIHN0YXRlPzogUHJSZXZpZXdTdGF0ZSxcbik6ICdzdWNjZXNzJyB8ICdlcnJvcicgfCAnd2FybmluZycgfCAnbWVyZ2VkJyB8IHVuZGVmaW5lZCB7XG4gIHN3aXRjaCAoc3RhdGUpIHtcbiAgICBjYXNlICdhcHByb3ZlZCc6XG4gICAgICByZXR1cm4gJ3N1Y2Nlc3MnXG4gICAgY2FzZSAnY2hhbmdlc19yZXF1ZXN0ZWQnOlxuICAgICAgcmV0dXJuICdlcnJvcidcbiAgICBjYXNlICdwZW5kaW5nJzpcbiAgICAgIHJldHVybiAnd2FybmluZydcbiAgICBjYXNlICdtZXJnZWQnOlxuICAgICAgcmV0dXJuICdtZXJnZWQnXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsSUFBSSxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUN0QyxjQUFjQyxhQUFhLFFBQVEsd0JBQXdCO0FBRTNELEtBQUtDLEtBQUssR0FBRztFQUNYQyxNQUFNLEVBQUUsTUFBTTtFQUNkQyxHQUFHLEVBQUUsTUFBTTtFQUNYQyxXQUFXLENBQUMsRUFBRUosYUFBYTtFQUMzQkssSUFBSSxDQUFDLEVBQUUsT0FBTztBQUNoQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxRQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWlCO0lBQUFQ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