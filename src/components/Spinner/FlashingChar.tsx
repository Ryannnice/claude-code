// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text, useTheme } from '../../ink.js';
// 复用 getTheme、Theme 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { getTheme, type Theme } from '../../utils/theme.js';
// 引入 interpolateColor、parseRGB、toRGBColor，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { interpolateColor, parseRGB, toRGBColor } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  char: string;
  flashOpacity: number;
  messageColor: keyof Theme;
  shimmerColor: keyof Theme;
};
// FlashingChar 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FlashingChar(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    char,
    flashOpacity,
    messageColor,
    shimmerColor
  } = t0;
  // 从 `useTheme()` 按位置拆出 themeName，让终端 UI 组件 Flashing Char分别处理这些返回值。
  const [themeName] = useTheme();
  // t1 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== char || $[1] !== flashOpacity || $[2] !== messageColor || $[3] !== shimmerColor || $[4] !== themeName) {
    // t1 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t1 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 Flashing Char在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // 主题读取`getTheme`，供终端渲染后续处理使用。
      const theme = getTheme(themeName);
      // baseColorStr 命名 `theme[messageColor]`，让后续代码直接表达这个值的用途。
      const baseColorStr = theme[messageColor];
      // shimmerColorStr 命名 `theme[shimmerColor]`，让后续代码直接表达这个值的用途。
      const shimmerColorStr = theme[shimmerColor];
      // baseRGB解析`parseRGB`，供终端渲染后续处理使用。
      const baseRGB = baseColorStr ? parseRGB(baseColorStr) : null;
      // shimmerRGB解析`parseRGB`，供终端渲染后续处理使用。
      const shimmerRGB = shimmerColorStr ? parseRGB(shimmerColorStr) : null;
      // 只有 `baseRGB && shimmerRGB` 满足时，终端渲染才执行该分支。
      if (baseRGB && shimmerRGB) {
        // interpolated保存`interpolateColor`，供终端渲染后续处理使用。
        const interpolated = interpolateColor(baseRGB, shimmerRGB, flashOpacity);
        // t1 暂存 `<Text color={toRGBColor(interpolated)}>{char}</Text>` 生成的渲染片段，后续返回路径直接复用。
        t1 = <Text color={toRGBColor(interpolated)}>{char}</Text>;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
    }
    // $[0] 缓存 `char`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = char;
    // $[1] 缓存 `flashOpacity`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = flashOpacity;
    // $[2] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = messageColor;
    // $[3] 缓存 `shimmerColor`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = shimmerColor;
    // $[4] 缓存 `themeName`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = themeName;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
  }
  // `t1` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // shouldUseShimmer标记终端 UI Flashing Char是否启用对应路径。
  const shouldUseShimmer = flashOpacity > 0.5;
  // t2保存`shouldUseShimmer ? shimmerColor : messageColor`，供后续判断或组装使用。
  const t2 = shouldUseShimmer ? shimmerColor : messageColor;
  // t3 暂存 `<Text color={t2}>{char}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== char || $[7] !== t2) {
    // t3 暂存 `<Text color={t2}>{char}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color={t2}>{char}</Text>;
    // $[6] 缓存 `char`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = char;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJ1c2VUaGVtZSIsImdldFRoZW1lIiwiVGhlbWUiLCJpbnRlcnBvbGF0ZUNvbG9yIiwicGFyc2VSR0IiLCJ0b1JHQkNvbG9yIiwiUHJvcHMiLCJjaGFyIiwiZmxhc2hPcGFjaXR5IiwibWVzc2FnZUNvbG9yIiwic2hpbW1lckNvbG9yIiwiRmxhc2hpbmdDaGFyIiwidDAiLCIkIiwiX2MiLCJ0aGVtZU5hbWUiLCJ0MSIsIlN5bWJvbCIsImZvciIsImJiMCIsInRoZW1lIiwiYmFzZUNvbG9yU3RyIiwic2hpbW1lckNvbG9yU3RyIiwiYmFzZVJHQiIsInNoaW1tZXJSR0IiLCJpbnRlcnBvbGF0ZWQiLCJzaG91bGRVc2VTaGltbWVyIiwidDIiLCJ0MyJdLCJzb3VyY2VzIjpbIkZsYXNoaW5nQ2hhci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0LCB1c2VUaGVtZSB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGdldFRoZW1lLCB0eXBlIFRoZW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgeyBpbnRlcnBvbGF0ZUNvbG9yLCBwYXJzZVJHQiwgdG9SR0JDb2xvciB9IGZyb20gJy4vdXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGNoYXI6IHN0cmluZ1xuICBmbGFzaE9wYWNpdHk6IG51bWJlclxuICBtZXNzYWdlQ29sb3I6IGtleW9mIFRoZW1lXG4gIHNoaW1tZXJDb2xvcjoga2V5b2YgVGhlbWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZsYXNoaW5nQ2hhcih7XG4gIGNoYXIsXG4gIGZsYXNoT3BhY2l0eSxcbiAgbWVzc2FnZUNvbG9yLFxuICBzaGltbWVyQ29sb3IsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZU5hbWVdID0gdXNlVGhlbWUoKVxuICBjb25zdCB0aGVtZSA9IGdldFRoZW1lKHRoZW1lTmFtZSlcblxuICBjb25zdCBiYXNlQ29sb3JTdHIgPSB0aGVtZVttZXNzYWdlQ29sb3JdXG4gIGNvbnN0IHNoaW1tZXJDb2xvclN0ciA9IHRoZW1lW3NoaW1tZXJDb2xvcl1cblxuICBjb25zdCBiYXNlUkdCID0gYmFzZUNvbG9yU3RyID8gcGFyc2VSR0IoYmFzZUNvbG9yU3RyKSA6IG51bGxcbiAgY29uc3Qgc2hpbW1lclJHQiA9IHNoaW1tZXJDb2xvclN0ciA/IHBhcnNlUkdCKHNoaW1tZXJDb2xvclN0cikgOiBudWxsXG5cbiAgaWYgKGJhc2VSR0IgJiYgc2hpbW1lclJHQikge1xuICAgIC8vIFNtb290aCBpbnRlcnBvbGF0aW9uIGJldHdlZW4gY29sb3JzXG4gICAgY29uc3QgaW50ZXJwb2xhdGVkID0gaW50ZXJwb2xhdGVDb2xvcihiYXNlUkdCLCBzaGltbWVyUkdCLCBmbGFzaE9wYWNpdHkpXG4gICAgcmV0dXJuIDxUZXh0IGNvbG9yPXt0b1JHQkNvbG9yKGludGVycG9sYXRlZCl9PntjaGFyfTwvVGV4dD5cbiAgfVxuXG4gIC8vIEZhbGxiYWNrIGZvciBBTlNJIHRoZW1lczogYmluYXJ5IHN3aXRjaFxuICBjb25zdCBzaG91bGRVc2VTaGltbWVyID0gZmxhc2hPcGFjaXR5ID4gMC41XG4gIHJldHVybiAoXG4gICAgPFRleHQgY29sb3I9e3Nob3VsZFVzZVNoaW1tZXIgPyBzaGltbWVyQ29sb3IgOiBtZXNzYWdlQ29sb3J9PntjaGFyfTwvVGV4dD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxJQUFJLEVBQUVDLFFBQVEsUUFBUSxjQUFjO0FBQzdDLFNBQVNDLFFBQVEsRUFBRSxLQUFLQyxLQUFLLFFBQVEsc0JBQXNCO0FBQzNELFNBQVNDLGdCQUFnQixFQUFFQyxRQUFRLEVBQUVDLFVBQVUsUUFBUSxZQUFZO0FBRW5FLEtBQUtDLEtBQUssR0FBRztFQUNYQyxJQUFJLEVBQUUsTUFBTTtFQUNa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