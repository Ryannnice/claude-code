// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 BLACK_CIRCLE，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../constants/figures.js';
// 引入 useBlink，将 ../hooks/useBlink.js 中已经封装好的能力接到本文件流程里。
import { useBlink } from '../hooks/useBlink.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  isError: boolean;
  isUnresolved: boolean;
  shouldAnimate: boolean;
};
// ToolUseLoader 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ToolUseLoader(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isError,
    isUnresolved,
    shouldAnimate
  } = t0;
  // 从 `useBlink(shouldAnimate)` 按位置拆出 ref、isBlinking，让终端 UI 组件 Tool Use Loader分别处理这些返回值。
  const [ref, isBlinking] = useBlink(shouldAnimate);
  // color读取`isUnresolved ? undefined : isError ? "error" : "success"` 整理出中间结果，供终端 UI Tool Use Loader后续步骤使用。
  const color = isUnresolved ? undefined : isError ? "error" : "success";
  // t1标记终端 UI Tool Use Loader是否启用对应路径。
  const t1 = !shouldAnimate || isBlinking || isError || !isUnresolved ? BLACK_CIRCLE : " ";
  // t2 暂存 `<Text color={color} dimColor={isUnresolved}>{t1}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color || $[1] !== isUnresolved || $[2] !== t1) {
    // t2 暂存 `<Text color={color} dimColor={isUnresolved}>{t1}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color={color} dimColor={isUnresolved}>{t1}</Text>;
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `isUnresolved`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isUnresolved;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Box ref={ref} minWidth={2}>{t2}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== ref || $[5] !== t2) {
    // t3 暂存 `<Box ref={ref} minWidth={2}>{t2}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box ref={ref} minWidth={2}>{t2}</Box>;
    // $[4] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = ref;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJMQUNLX0NJUkNMRSIsInVzZUJsaW5rIiwiQm94IiwiVGV4dCIsIlByb3BzIiwiaXNFcnJvciIsImlzVW5yZXNvbHZlZCIsInNob3VsZEFuaW1hdGUiLCJUb29sVXNlTG9hZGVyIiwidDAiLCIkIiwiX2MiLCJyZWYiLCJpc0JsaW5raW5nIiwiY29sb3IiLCJ1bmRlZmluZWQiLCJ0MSIsInQyIiwidDMiXSwic291cmNlcyI6WyJUb29sVXNlTG9hZGVyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCTEFDS19DSVJDTEUgfSBmcm9tICcuLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IHVzZUJsaW5rIH0gZnJvbSAnLi4vaG9va3MvdXNlQmxpbmsuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGlzRXJyb3I6IGJvb2xlYW5cbiAgaXNVbnJlc29sdmVkOiBib29sZWFuXG4gIHNob3VsZEFuaW1hdGU6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRvb2xVc2VMb2FkZXIoe1xuICBpc0Vycm9yLFxuICBpc1VucmVzb2x2ZWQsXG4gIHNob3VsZEFuaW1hdGUsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtyZWYsIGlzQmxpbmtpbmddID0gdXNlQmxpbmsoc2hvdWxkQW5pbWF0ZSlcblxuICBjb25zdCBjb2xvciA9IGlzVW5yZXNvbHZlZCA/IHVuZGVmaW5lZCA6IGlzRXJyb3IgPyAnZXJyb3InIDogJ3N1Y2Nlc3MnXG5cbiAgLy8gV0FSTklORzogVGhlIGNvZGUgaGVyZSBhbmQgaW4gQXNzaXN0YW50VG9vbFVzZU1lc3NhZ2UgaXMgcGFydGljdWxhcmx5XG4gIC8vIHNlbnNpdGl2ZSB0byB3aGF0ICpzaG91bGQqIGp1c3QgYmUgdHJpdmlhbCByZWZhY3RvcmluZ3MuIEEgYDxkaW0+eDwvZGltPmBcbiAgLy8gZm9sbG93ZWQgKmltbWVkaWF0ZWx5KiBieSBgPGJvbGQ+eTwvYm9sZD5gIHRhZyBpbmNvcnJlY3RseSByZW5kZXJzIGB5YCBhc1xuICAvLyBkaW0hIFRoaXMgaXMgYmVjYXVzZSBgPC9kaW0+YCBhbmQgYDwvYm9sZD5gIGFyZSBib3RoIHJlc2V0IGJ5IFxceDFiWzIybVxuICAvLyBkdWUgdG8gaGlzdG9yaWNhbCByZWFzb25zLCBhbmQgY2hhbGsgY2FuJ3QgZGlzdGluZ3Vpc2ggYmV0d2VlbiB0aGVtLlxuICAvLyBUaGUgc3ltcHRvbSB5b3UnbGwgc2VlIGlmIHdlIGdldCB0aGlzIHdyb25nIGlzIHRoZSB0b29sIG5hbWUgYmxpbmtzIGFsb25nXG4gIC8vIHdpdGggdGhpcyBsb2FkaW5nIGluZGljYXRvciwgd2hpY2ggbG9va3MgcXVpdGUgYmFkLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vY2hhbGsvY2hhbGsvaXNzdWVzLzI5MFxuICByZXR1cm4gKFxuICAgIDxCb3ggcmVmPXtyZWZ9IG1pbldpZHRoPXsyfT5cbiAgICAgIDxUZXh0IGNvbG9yPXtjb2xvcn0gZGltQ29sb3I9e2lzVW5yZXNvbHZlZH0+XG4gICAgICAgIHshc2hvdWxkQW5pbWF0ZSB8fCBpc0JsaW5raW5nIHx8IGlzRXJyb3IgfHwgIWlzVW5yZXNvbHZlZFxuICAgICAgICAgID8gQkxBQ0tfQ0lSQ0xFXG4gICAgICAgICAgOiAnICd9XG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLFlBQVksUUFBUSx5QkFBeUI7QUFDdEQsU0FBU0MsUUFBUSxRQUFRLHNCQUFzQjtBQUMvQyxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBRXJDLEtBQUtDLEtBQUssR0FBRztFQUNYQyxPQUFPLEVBQUUsT0FBTztFQUNoQkMsWUFBWSxFQUFFLE9BQU87RUFDckJDLGFBQWEsRUFBRSxPQUFPO0FBQ3hCLENBQUM7QUFFRCxPQUFPLFNBQUFDLGNBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBdUI7SUFBQU4sT0FBQTtJQUFBQyxZQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFJdEI7RUFDTixPQUFBRyxHQUFBLEVBQUFDLFVBQUEsSUFBMEJaLFFBQVEsQ0FBQ00sYUFBYSxDQUFDO0VBRWpELE1BQUFPLEtBQUEsR0FBY1IsWUFBWSxHQUFaUyxTQUF3RCxHQUE3QlYsT0FBTyxHQUFQLE9BQTZCLEdBQTdCLFNBQTZCO0VBYS9ELE1BQUFXLEVBQUEsSUFBQ1QsYUFBMkIsSUFBNUJNLFVBQXVDLElBQXZDUixPQUF3RCxJQUF4RCxDQUE0Q0MsWUFFdEMsR0FGTk4sWUFFTSxHQUZOLEdBRU07RUFBQSxJQUFBaUIsRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQUksS0FBQSxJQUFBSixDQUFBLFFBQUFKLFlBQUEsSUFBQUksQ0FBQSxRQUFBTSxFQUFBO0lBSFRDLEVBQUEsSUFBQyxJQUFJLENBQVFILEtBQUssQ0FBTEEsTUFBSSxDQUFDLENBQVlSLFFBQVksQ0FBWkEsYUFBVyxDQUFDLENBQ3ZDLENBQUFVLEVBRUssQ0FDUixFQUpDLElBQUksQ0FJRTtJQUFBTixDQUFBLE1BQUFJLEtBQUE7SUFBQUosQ0FBQSxNQUFBSixZQUFBO0lBQUFJLENBQUEsTUFBQU0sRUFBQTtJQUFBTixDQUFBLE1BQUFPLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFQLENBQUE7RUFBQTtFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFFLEdBQUEsSUFBQUYsQ0FBQSxRQUFBTyxFQUFBO0lBTFRDLEVBQUEsSUFBQyxHQUFHLENBQU1OLEdBQUcsQ0FBSEEsSUFBRSxDQUFDLENBQVksUUFBQyxDQUFELEdBQUMsQ0FDeEIsQ0FBQUssRUFJTSxDQUNSLEVBTkMsR0FBRyxDQU1FO0lBQUFQLENBQUEsTUFBQUUsR0FBQTtJQUFBRixDQUFBLE1BQUFPLEVBQUE7SUFBQVAsQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBQSxPQU5OUSxFQU1NO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=