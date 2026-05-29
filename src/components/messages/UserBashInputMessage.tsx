// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  addMargin: boolean;
  param: TextBlockParam;
};
// UserBashInputMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserBashInputMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    param: t1,
    addMargin
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text
  } = t1;
  // t2 暂存 `extractTag(text, "bash-input")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== text) {
    // t2 暂存 `extractTag(text, "bash-input")` 生成的渲染片段，后续返回路径直接复用。
    t2 = extractTag(text, "bash-input");
    // $[0] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = text;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 用户输入 命名 `t2`，让后续代码直接表达这个值的用途。
  const input = t2;
  // 用户输入缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!input) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t3保存`addMargin ? 1 : 0`，供终端 UI User Bash Input Mess...后续判断或输出使用。
  const t3 = addMargin ? 1 : 0;
  // t4 暂存 `<Text color="bashBorder">! </Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text color="bashBorder">! </Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text color="bashBorder">! </Text>;
    // $[2] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[2];
  }
  // t5 暂存 `<Text color="text">{input}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== input) {
    // t5 暂存 `<Text color="text">{input}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color="text">{input}</Text>;
    // $[3] 缓存 `input`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = input;
    // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[4];
  }
  // t6 暂存 `<Box flexDirection="row" marginTop={t3} backgroundColor="...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t3 || $[6] !== t5) {
    // t6 暂存 `<Box flexDirection="row" marginTop={t3} backgroundColor="...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="row" marginTop={t3} backgroundColor="bashMessageBackgroundColor" paddingRight={1}>{t4}{t5}</Box>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUZXh0QmxvY2tQYXJhbSIsIlJlYWN0IiwiQm94IiwiVGV4dCIsImV4dHJhY3RUYWciLCJQcm9wcyIsImFkZE1hcmdpbiIsInBhcmFtIiwiVXNlckJhc2hJbnB1dE1lc3NhZ2UiLCJ0MCIsIiQiLCJfYyIsInQxIiwidGV4dCIsInQyIiwiaW5wdXQiLCJ0MyIsInQ0IiwiU3ltYm9sIiwiZm9yIiwidDUiLCJ0NiJdLCJzb3VyY2VzIjpbIlVzZXJCYXNoSW5wdXRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFRleHRCbG9ja1BhcmFtIH0gZnJvbSAnQGFudGhyb3BpYy1haS9zZGsvcmVzb3VyY2VzL2luZGV4Lm1qcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZXh0cmFjdFRhZyB9IGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBhZGRNYXJnaW46IGJvb2xlYW5cbiAgcGFyYW06IFRleHRCbG9ja1BhcmFtXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBVc2VyQmFzaElucHV0TWVzc2FnZSh7XG4gIHBhcmFtOiB7IHRleHQgfSxcbiAgYWRkTWFyZ2luLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBpbnB1dCA9IGV4dHJhY3RUYWcodGV4dCwgJ2Jhc2gtaW5wdXQnKVxuICBpZiAoIWlucHV0KSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJyb3dcIlxuICAgICAgbWFyZ2luVG9wPXthZGRNYXJnaW4gPyAxIDogMH1cbiAgICAgIGJhY2tncm91bmRDb2xvcj1cImJhc2hNZXNzYWdlQmFja2dyb3VuZENvbG9yXCJcbiAgICAgIHBhZGRpbmdSaWdodD17MX1cbiAgICA+XG4gICAgICA8VGV4dCBjb2xvcj1cImJhc2hCb3JkZXJcIj4hIDwvVGV4dD5cbiAgICAgIDxUZXh0IGNvbG9yPVwidGV4dFwiPntpbnB1dH08L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLGNBQWMsUUFBUSx1Q0FBdUM7QUFDM0UsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLFVBQVUsUUFBUSx5QkFBeUI7QUFFcEQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFNBQVMsRUFBRSxPQUFPO0VBQ2xCQyxLQUFLLEVBQUVQLGNBQWM7QUFDdkIsQ0FBQztBQUVELE9BQU8sU0FBQVEscUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBOEI7SUFBQUosS0FBQSxFQUFBSyxFQUFBO0lBQUFOO0VBQUEsSUFBQUcsRUFHN0I7RUFGQztJQUFBSTtFQUFBLElBQUFELEVBQVE7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBRyxJQUFBO0lBR0RDLEVBQUEsR0FBQVYsVUFBVSxDQUFDUyxJQUFJLEVBQUUsWUFBWSxDQUFDO0lBQUFILENBQUEsTUFBQUcsSUFBQTtJQUFBSCxDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUE1QyxNQUFBSyxLQUFBLEdBQWNELEVBQThCO0VBQzVDLElBQUksQ0FBQ0MsS0FBSztJQUFBLE9BQ0QsSUFBSTtFQUFBO0VBS0UsTUFBQUMsRUFBQSxHQUFBVixTQUFTLEdBQVQsQ0FBaUIsR0FBakIsQ0FBaUI7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQVAsQ0FBQSxRQUFBUSxNQUFBLENBQUFDLEdBQUE7SUFJNUJGLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBWSxDQUFaLFlBQVksQ0FBQyxFQUFFLEVBQTFCLElBQUksQ0FBNkI7SUFBQVAsQ0FBQSxNQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFBQSxJQUFBVSxFQUFBO0VBQUEsSUFBQVYsQ0FBQSxRQUFBSyxLQUFBO0lBQ2xDSyxFQUFBLElBQUMsSUFBSSxDQUFPLEtBQU0sQ0FBTixNQUFNLENBQUVMLE1BQUksQ0FBRSxFQUF6QixJQUFJLENBQTRCO0lBQUFMLENBQUEsTUFBQUssS0FBQTtJQUFBTCxDQUFBLE1BQUFVLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFWLENBQUE7RUFBQTtFQUFBLElBQUFXLEVBQUE7RUFBQSxJQUFBWCxDQUFBLFFBQUFNLEVBQUEsSUFBQU4sQ0FBQSxRQUFBVSxFQUFBO0lBUG5DQyxFQUFBLElBQUMsR0FBRyxDQUNZLGFBQUssQ0FBTCxLQUFLLENBQ1IsU0FBaUIsQ0FBakIsQ0FBQUwsRUFBZ0IsQ0FBQyxDQUNaLGVBQTRCLENBQTVCLDRCQUE0QixDQUM5QixZQUFDLENBQUQsR0FBQyxDQUVmLENBQUFDLEVBQWlDLENBQ2pDLENBQUFHLEVBQWdDLENBQ2xDLEVBUkMsR0FBRyxDQVFFO0lBQUFWLENBQUEsTUFBQU0sRUFBQTtJQUFBTixDQUFBLE1BQUFVLEVBQUE7SUFBQVYsQ0FBQSxNQUFBVyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFBQSxPQVJOVyxFQVFNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=