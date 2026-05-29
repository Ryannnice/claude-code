// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  char: string;
  index: number;
  glimmerIndex: number;
  messageColor: keyof Theme;
  shimmerColor: keyof Theme;
};
// ShimmerChar 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShimmerChar(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    char,
    index,
    glimmerIndex,
    messageColor,
    shimmerColor
  } = t0;
  // isHighlighted标记终端 UI Shimmer Char是否启用对应路径。
  const isHighlighted = index === glimmerIndex;
  // isNearHighlight记录 `Math.abs` 是否成立，终端渲染随后按该结果分支。
  const isNearHighlight = Math.abs(index - glimmerIndex) === 1;
  // shouldUseShimmer标记终端 UI Shimmer Char是否启用对应路径。
  const shouldUseShimmer = isHighlighted || isNearHighlight;
  // 临时值 t1 命名 `shouldUseShimmer ? shimmerColor : messageColor`，让后续代码直接表达这个值的用途。
  const t1 = shouldUseShimmer ? shimmerColor : messageColor;
  // t2 暂存 `<Text color={t1}>{char}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== char || $[1] !== t1) {
    // t2 暂存 `<Text color={t1}>{char}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color={t1}>{char}</Text>;
    // $[0] 缓存 `char`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = char;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJUaGVtZSIsIlByb3BzIiwiY2hhciIsImluZGV4IiwiZ2xpbW1lckluZGV4IiwibWVzc2FnZUNvbG9yIiwic2hpbW1lckNvbG9yIiwiU2hpbW1lckNoYXIiLCJ0MCIsIiQiLCJfYyIsImlzSGlnaGxpZ2h0ZWQiLCJpc05lYXJIaWdobGlnaHQiLCJNYXRoIiwiYWJzIiwic2hvdWxkVXNlU2hpbW1lciIsInQxIiwidDIiXSwic291cmNlcyI6WyJTaGltbWVyQ2hhci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBjaGFyOiBzdHJpbmdcbiAgaW5kZXg6IG51bWJlclxuICBnbGltbWVySW5kZXg6IG51bWJlclxuICBtZXNzYWdlQ29sb3I6IGtleW9mIFRoZW1lXG4gIHNoaW1tZXJDb2xvcjoga2V5b2YgVGhlbWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNoaW1tZXJDaGFyKHtcbiAgY2hhcixcbiAgaW5kZXgsXG4gIGdsaW1tZXJJbmRleCxcbiAgbWVzc2FnZUNvbG9yLFxuICBzaGltbWVyQ29sb3IsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlzSGlnaGxpZ2h0ZWQgPSBpbmRleCA9PT0gZ2xpbW1lckluZGV4XG4gIGNvbnN0IGlzTmVhckhpZ2hsaWdodCA9IE1hdGguYWJzKGluZGV4IC0gZ2xpbW1lckluZGV4KSA9PT0gMVxuICBjb25zdCBzaG91bGRVc2VTaGltbWVyID0gaXNIaWdobGlnaHRlZCB8fCBpc05lYXJIaWdobGlnaHRcblxuICByZXR1cm4gKFxuICAgIDxUZXh0IGNvbG9yPXtzaG91bGRVc2VTaGltbWVyID8gc2hpbW1lckNvbG9yIDogbWVzc2FnZUNvbG9yfT57Y2hhcn08L1RleHQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsSUFBSSxRQUFRLGNBQWM7QUFDbkMsY0FBY0MsS0FBSyxRQUFRLHNCQUFzQjtBQUVqRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsSUFBSSxFQUFFLE1BQU07RUFDWkMsS0FBSyxFQUFFLE1BQU07RUFDYkMsWUFBWSxFQUFFLE1BQU07RUFDcEJDLFlBQVksRUFBRSxNQUFNTCxLQUFLO0VBQ3pCTSxZQUFZLEVBQUUsTUFBTU4sS0FBSztBQUMzQixDQUFDO0FBRUQsT0FBTyxTQUFBTyxZQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXFCO0lBQUFSLElBQUE7SUFBQUMsS0FBQTtJQUFBQyxZQUFBO0lBQUFDLFlBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQU1wQjtFQUNOLE1BQUFHLGFBQUEsR0FBc0JSLEtBQUssS0FBS0MsWUFBWTtFQUM1QyxNQUFBUSxlQUFBLEdBQXdCQyxJQUFJLENBQUFDLEdBQUksQ0FBQ1gsS0FBSyxHQUFHQyxZQUFZLENBQUMsS0FBSyxDQUFDO0VBQzVELE1BQUFXLGdCQUFBLEdBQXlCSixhQUFnQyxJQUFoQ0MsZUFBZ0M7RUFHMUMsTUFBQUksRUFBQSxHQUFBRCxnQkFBZ0IsR0FBaEJULFlBQThDLEdBQTlDRCxZQUE4QztFQUFBLElBQUFZLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFQLElBQUEsSUFBQU8sQ0FBQSxRQUFBTyxFQUFBO0lBQTNEQyxFQUFBLElBQUMsSUFBSSxDQUFRLEtBQThDLENBQTlDLENBQUFELEVBQTZDLENBQUMsQ0FBR2QsS0FBRyxDQUFFLEVBQWxFLElBQUksQ0FBcUU7SUFBQU8sQ0FBQSxNQUFBUCxJQUFBO0lBQUFPLENBQUEsTUFBQU8sRUFBQTtJQUFBUCxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLE9BQTFFUSxFQUEwRTtBQUFBIiwiaWdub3JlTGlzdCI6W119