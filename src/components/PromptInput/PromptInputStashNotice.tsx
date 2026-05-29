// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  hasStash: boolean;
};
// PromptInputStashNotice 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptInputStashNotice(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hasStash
  } = t0;
  // hasStash缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!hasStash) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `<Box paddingLeft={2}><Text dimColor={true}>{figures.point...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Box paddingLeft={2}><Text dimColor={true}>{figures.point...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Box paddingLeft={2}><Text dimColor={true}>{figures.pointerSmall} Stashed (auto-restores after submit)</Text></Box>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiUHJvcHMiLCJoYXNTdGFzaCIsIlByb21wdElucHV0U3Rhc2hOb3RpY2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwicG9pbnRlclNtYWxsIl0sInNvdXJjZXMiOlsiUHJvbXB0SW5wdXRTdGFzaE5vdGljZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnc3JjL2luay5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgaGFzU3Rhc2g6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByb21wdElucHV0U3Rhc2hOb3RpY2UoeyBoYXNTdGFzaCB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGlmICghaGFzU3Rhc2gpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfT5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICB7ZmlndXJlcy5wb2ludGVyU21hbGx9IFN0YXNoZWQgKGF1dG8tcmVzdG9yZXMgYWZ0ZXIgc3VibWl0KVxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFlBQVk7QUFFdEMsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFFBQVEsRUFBRSxPQUFPO0FBQ25CLENBQUM7QUFFRCxPQUFPLFNBQUFDLHVCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWdDO0lBQUFKO0VBQUEsSUFBQUUsRUFBbUI7RUFDeEQsSUFBSSxDQUFDRixRQUFRO0lBQUEsT0FDSixJQUFJO0VBQUE7RUFDWixJQUFBSyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFHQ0YsRUFBQSxJQUFDLEdBQUcsQ0FBYyxXQUFDLENBQUQsR0FBQyxDQUNqQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQ1gsQ0FBQVYsT0FBTyxDQUFBYSxZQUFZLENBQUUscUNBQ3hCLEVBRkMsSUFBSSxDQUdQLEVBSkMsR0FBRyxDQUlFO0lBQUFMLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FKTkUsRUFJTTtBQUFBIiwiaWdub3JlTGlzdCI6W119