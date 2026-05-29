// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 BLACK_CIRCLE，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../../constants/figures.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 toInkColor 工具函数，把通用处理留在 ../../utils/ink.js 中维护。
import { toInkColor } from '../../utils/ink.js';
// WorkerBadgeProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type WorkerBadgeProps = {
  name: string;
  color: string;
};

/**
 * Renders a colored badge showing the worker's name for permission prompts.
 * Used to indicate which swarm worker is requesting the permission.
 */
// WorkerBadge 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WorkerBadge(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    name,
    color
  } = t0;
  // t1 暂存 `toInkColor(color)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== color) {
    // t1 暂存 `toInkColor(color)` 生成的渲染片段，后续返回路径直接复用。
    t1 = toInkColor(color);
    // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = color;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // inkColor保存`t1`，作为后续临时缓存值处理的输入。
  const inkColor = t1;
  // t2 暂存 `<Text bold={true}>@{name}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== name) {
    // t2 暂存 `<Text bold={true}>@{name}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text bold={true}>@{name}</Text>;
    // $[2] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = name;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Box flexDirection="row" gap={1}><Text color={inkColor}>{...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== inkColor || $[5] !== t2) {
    // t3 暂存 `<Box flexDirection="row" gap={1}><Text color={inkColor}>{...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="row" gap={1}><Text color={inkColor}>{BLACK_CIRCLE} {t2}</Text></Box>;
    // $[4] 缓存 `inkColor`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = inkColor;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJMQUNLX0NJUkNMRSIsIkJveCIsIlRleHQiLCJ0b0lua0NvbG9yIiwiV29ya2VyQmFkZ2VQcm9wcyIsIm5hbWUiLCJjb2xvciIsIldvcmtlckJhZGdlIiwidDAiLCIkIiwiX2MiLCJ0MSIsImlua0NvbG9yIiwidDIiLCJ0MyJdLCJzb3VyY2VzIjpbIldvcmtlckJhZGdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJMQUNLX0NJUkNMRSB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy9maWd1cmVzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdG9JbmtDb2xvciB9IGZyb20gJy4uLy4uL3V0aWxzL2luay5qcydcblxuZXhwb3J0IHR5cGUgV29ya2VyQmFkZ2VQcm9wcyA9IHtcbiAgbmFtZTogc3RyaW5nXG4gIGNvbG9yOiBzdHJpbmdcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGEgY29sb3JlZCBiYWRnZSBzaG93aW5nIHRoZSB3b3JrZXIncyBuYW1lIGZvciBwZXJtaXNzaW9uIHByb21wdHMuXG4gKiBVc2VkIHRvIGluZGljYXRlIHdoaWNoIHN3YXJtIHdvcmtlciBpcyByZXF1ZXN0aW5nIHRoZSBwZXJtaXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gV29ya2VyQmFkZ2Uoe1xuICBuYW1lLFxuICBjb2xvcixcbn06IFdvcmtlckJhZGdlUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBpbmtDb2xvciA9IHRvSW5rQ29sb3IoY29sb3IpXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfT5cbiAgICAgIDxUZXh0IGNvbG9yPXtpbmtDb2xvcn0+XG4gICAgICAgIHtCTEFDS19DSVJDTEV9IDxUZXh0IGJvbGQ+QHtuYW1lfTwvVGV4dD5cbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxZQUFZLFFBQVEsNEJBQTRCO0FBQ3pELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsVUFBVSxRQUFRLG9CQUFvQjtBQUUvQyxPQUFPLEtBQUtDLGdCQUFnQixHQUFHO0VBQzdCQyxJQUFJLEVBQUUsTUFBTTtFQUNaQyxLQUFLLEVBQUUsTUFBTTtBQUNmLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLFlBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBcUI7SUFBQUwsSUFBQTtJQUFBQztFQUFBLElBQUFFLEVBR1Q7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBSCxLQUFBO0lBQ0FLLEVBQUEsR0FBQVIsVUFBVSxDQUFDRyxLQUFLLENBQUM7SUFBQUcsQ0FBQSxNQUFBSCxLQUFBO0lBQUFHLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQWxDLE1BQUFHLFFBQUEsR0FBaUJELEVBQWlCO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQUosSUFBQTtJQUliUSxFQUFBLElBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxDQUFFUixLQUFHLENBQUUsRUFBakIsSUFBSSxDQUFvQjtJQUFBSSxDQUFBLE1BQUFKLElBQUE7SUFBQUksQ0FBQSxNQUFBSSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSixDQUFBO0VBQUE7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBRyxRQUFBLElBQUFILENBQUEsUUFBQUksRUFBQTtJQUY1Q0MsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFLLENBQUwsS0FBSyxDQUFNLEdBQUMsQ0FBRCxHQUFDLENBQzdCLENBQUMsSUFBSSxDQUFRRixLQUFRLENBQVJBLFNBQU8sQ0FBQyxDQUNsQlosYUFBVyxDQUFFLENBQUMsQ0FBQWEsRUFBd0IsQ0FDekMsRUFGQyxJQUFJLENBR1AsRUFKQyxHQUFHLENBSUU7SUFBQUosQ0FBQSxNQUFBRyxRQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtJQUFBSixDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUFBLE9BSk5LLEVBSU07QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==