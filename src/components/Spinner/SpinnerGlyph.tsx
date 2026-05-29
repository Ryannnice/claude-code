// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../../ink.js';
// 复用 getTheme、Theme 工具函数，把通用处理留在 ../../utils/theme.js 中维护。
import { getTheme, type Theme } from '../../utils/theme.js';
// 引入 getDefaultCharacters、interpolateColor、parseRGB、toRGBColor，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getDefaultCharacters, interpolateColor, parseRGB, toRGBColor } from './utils.js';
// DEFAULT_CHARACTERS 集合读取`getDefaultCharacters`，供终端渲染后续处理使用。
const DEFAULT_CHARACTERS = getDefaultCharacters();
// SPINNER_FRAMES 集合保存`reverse`，供终端渲染后续处理使用。
const SPINNER_FRAMES = [...DEFAULT_CHARACTERS, ...[...DEFAULT_CHARACTERS].reverse()];
// REDUCED_MOTION_DOT固定为 `'●'`，作为终端 UI Spinner Glyph后续展示或比较的基准。
const REDUCED_MOTION_DOT = '●';
// REDUCED_MOTION_CYCLE_MS 集合保存`2000; // 2-second cycle: 1s visible, 1s dim`，供终端 UI Spinner Glyph后续判断或输出使用。
const REDUCED_MOTION_CYCLE_MS = 2000; // 2-second cycle: 1s visible, 1s dim
// ERROR_RED 错误信息集中保存终端 UI Spinner Glyph要一起传递的字段。
const ERROR_RED = {
  r: 171,
  g: 43,
  b: 63
};
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  frame: number;
  messageColor: keyof Theme;
  stalledIntensity?: number;
  reducedMotion?: boolean;
  time?: number;
};
// SpinnerGlyph 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SpinnerGlyph(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    frame,
    messageColor,
    stalledIntensity: t1,
    reducedMotion: t2,
    time: t3
  } = t0;
  // stalledIntensity标记终端 UI Spinner Glyph是否启用对应路径。
  const stalledIntensity = t1 === undefined ? 0 : t1;
  // reducedMotion标记终端 UI Spinner Glyph是否启用对应路径。
  const reducedMotion = t2 === undefined ? false : t2;
  // time标记终端 UI Spinner Glyph是否启用对应路径。
  const time = t3 === undefined ? 0 : t3;
  // 从 `useTheme()` 按位置拆出 themeName，让终端 UI 组件 Spinner Glyph分别处理这些返回值。
  const [themeName] = useTheme();
  // 主题读取`getTheme`，供终端渲染后续处理使用。
  const theme = getTheme(themeName);
  // 满足 `reducedMotion` 时，终端渲染执行该分支。
  if (reducedMotion) {
    // isDim记录 `Math.floor` 是否成立，终端渲染随后按该结果分支。
    const isDim = Math.floor(time / (REDUCED_MOTION_CYCLE_MS / 2)) % 2 === 1;
    // t4 暂存 `<Box flexWrap="wrap" height={1} width={2}><Text color={me...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== isDim || $[1] !== messageColor) {
      // t4 暂存 `<Box flexWrap="wrap" height={1} width={2}><Text color={me...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box flexWrap="wrap" height={1} width={2}><Text color={messageColor} dimColor={isDim}>{REDUCED_MOTION_DOT}</Text></Box>;
      // $[0] 缓存 `isDim`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = isDim;
      // $[1] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = messageColor;
      // $[2] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[2];
    }
    // 返回 `t4`，作为终端渲染这次计算的结果。
    return t4;
  }
  // spinnerChar保存 `SPINNER_FRAMES[frame % SPINNER_FRAMES.length]` 的判断结果，供终端 UI Spinner Glyph后续分支直接复用。
  const spinnerChar = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
  // 满足 `stalledIntensity > 0` 时，终端渲染执行该分支。
  if (stalledIntensity > 0) {
    // baseColorStr保存`theme[messageColor]`，供终端 UI Spinner Glyph后续判断或输出使用。
    const baseColorStr = theme[messageColor];
    // baseRGB解析`parseRGB`，供终端渲染后续处理使用。
    const baseRGB = baseColorStr ? parseRGB(baseColorStr) : null;
    // 满足 `baseRGB` 时，终端渲染执行该分支。
    if (baseRGB) {
      // interpolated保存`interpolateColor`，供终端渲染后续处理使用。
      const interpolated = interpolateColor(baseRGB, ERROR_RED, stalledIntensity);
      // 返回 `<Box flexWrap="wrap" height={1} width={2}><Text color={toRGBColor(inter...`，作为终端渲染这次计算的结果。
      return <Box flexWrap="wrap" height={1} width={2}><Text color={toRGBColor(interpolated)}>{spinnerChar}</Text></Box>;
    }
    // color保存`stalledIntensity > 0.5 ? "error" : messageColor`，供后续判断或组装使用。
    const color = stalledIntensity > 0.5 ? "error" : messageColor;
    // t4 暂存 `<Box flexWrap="wrap" height={1} width={2}><Text color={co...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== color || $[4] !== spinnerChar) {
      // t4 暂存 `<Box flexWrap="wrap" height={1} width={2}><Text color={co...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Box flexWrap="wrap" height={1} width={2}><Text color={color}>{spinnerChar}</Text></Box>;
      // $[3] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = color;
      // $[4] 缓存 `spinnerChar`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = spinnerChar;
      // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[5];
    }
    // 返回 `t4`，作为终端渲染这次计算的结果。
    return t4;
  }
  // t4 暂存 `<Box flexWrap="wrap" height={1} width={2}><Text color={me...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== messageColor || $[7] !== spinnerChar) {
    // t4 暂存 `<Box flexWrap="wrap" height={1} width={2}><Text color={me...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexWrap="wrap" height={1} width={2}><Text color={messageColor}>{spinnerChar}</Text></Box>;
    // $[6] 缓存 `messageColor`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = messageColor;
    // $[7] 缓存 `spinnerChar`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = spinnerChar;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJ1c2VUaGVtZSIsImdldFRoZW1lIiwiVGhlbWUiLCJnZXREZWZhdWx0Q2hhcmFjdGVycyIsImludGVycG9sYXRlQ29sb3IiLCJwYXJzZVJHQiIsInRvUkdCQ29sb3IiLCJERUZBVUxUX0NIQVJBQ1RFUlMiLCJTUElOTkVSX0ZSQU1FUyIsInJldmVyc2UiLCJSRURVQ0VEX01PVElPTl9ET1QiLCJSRURVQ0VEX01PVElPTl9DWUNMRV9NUyIsIkVSUk9SX1JFRCIsInIiLCJnIiwiYiIsIlByb3BzIiwiZnJhbWUiLCJtZXNzYWdlQ29sb3IiLCJzdGFsbGVkSW50ZW5zaXR5IiwicmVkdWNlZE1vdGlvbiIsInRpbWUiLCJTcGlubmVyR2x5cGgiLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ0MyIsInVuZGVmaW5lZCIsInRoZW1lTmFtZSIsInRoZW1lIiwiaXNEaW0iLCJNYXRoIiwiZmxvb3IiLCJ0NCIsInNwaW5uZXJDaGFyIiwibGVuZ3RoIiwiYmFzZUNvbG9yU3RyIiwiYmFzZVJHQiIsImludGVycG9sYXRlZCIsImNvbG9yIl0sInNvdXJjZXMiOlsiU3Bpbm5lckdseXBoLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlVGhlbWUgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBnZXRUaGVtZSwgdHlwZSBUaGVtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0RGVmYXVsdENoYXJhY3RlcnMsXG4gIGludGVycG9sYXRlQ29sb3IsXG4gIHBhcnNlUkdCLFxuICB0b1JHQkNvbG9yLFxufSBmcm9tICcuL3V0aWxzLmpzJ1xuXG5jb25zdCBERUZBVUxUX0NIQVJBQ1RFUlMgPSBnZXREZWZhdWx0Q2hhcmFjdGVycygpXG5cbmNvbnN0IFNQSU5ORVJfRlJBTUVTID0gW1xuICAuLi5ERUZBVUxUX0NIQVJBQ1RFUlMsXG4gIC4uLlsuLi5ERUZBVUxUX0NIQVJBQ1RFUlNdLnJldmVyc2UoKSxcbl1cblxuY29uc3QgUkVEVUNFRF9NT1RJT05fRE9UID0gJ+KXjydcbmNvbnN0IFJFRFVDRURfTU9USU9OX0NZQ0xFX01TID0gMjAwMCAvLyAyLXNlY29uZCBjeWNsZTogMXMgdmlzaWJsZSwgMXMgZGltXG5jb25zdCBFUlJPUl9SRUQgPSB7IHI6IDE3MSwgZzogNDMsIGI6IDYzIH1cblxudHlwZSBQcm9wcyA9IHtcbiAgZnJhbWU6IG51bWJlclxuICBtZXNzYWdlQ29sb3I6IGtleW9mIFRoZW1lXG4gIHN0YWxsZWRJbnRlbnNpdHk/OiBudW1iZXJcbiAgcmVkdWNlZE1vdGlvbj86IGJvb2xlYW5cbiAgdGltZT86IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gU3Bpbm5lckdseXBoKHtcbiAgZnJhbWUsXG4gIG1lc3NhZ2VDb2xvcixcbiAgc3RhbGxlZEludGVuc2l0eSA9IDAsXG4gIHJlZHVjZWRNb3Rpb24gPSBmYWxzZSxcbiAgdGltZSA9IDAsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZU5hbWVdID0gdXNlVGhlbWUoKVxuICBjb25zdCB0aGVtZSA9IGdldFRoZW1lKHRoZW1lTmFtZSlcblxuICAvLyBSZWR1Y2VkIG1vdGlvbjogc2xvd2x5IGZsYXNoaW5nIG9yYW5nZSBkb3RcbiAgaWYgKHJlZHVjZWRNb3Rpb24pIHtcbiAgICBjb25zdCBpc0RpbSA9IE1hdGguZmxvb3IodGltZSAvIChSRURVQ0VEX01PVElPTl9DWUNMRV9NUyAvIDIpKSAlIDIgPT09IDFcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4V3JhcD1cIndyYXBcIiBoZWlnaHQ9ezF9IHdpZHRoPXsyfT5cbiAgICAgICAgPFRleHQgY29sb3I9e21lc3NhZ2VDb2xvcn0gZGltQ29sb3I9e2lzRGltfT5cbiAgICAgICAgICB7UkVEVUNFRF9NT1RJT05fRE9UfVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBjb25zdCBzcGlubmVyQ2hhciA9IFNQSU5ORVJfRlJBTUVTW2ZyYW1lICUgU1BJTk5FUl9GUkFNRVMubGVuZ3RoXVxuXG4gIC8vIFNtb290aGx5IGludGVycG9sYXRlIGZyb20gY3VycmVudCBjb2xvciB0byByZWQgd2hlbiBzdGFsbGVkXG4gIGlmIChzdGFsbGVkSW50ZW5zaXR5ID4gMCkge1xuICAgIGNvbnN0IGJhc2VDb2xvclN0ciA9IHRoZW1lW21lc3NhZ2VDb2xvcl1cbiAgICBjb25zdCBiYXNlUkdCID0gYmFzZUNvbG9yU3RyID8gcGFyc2VSR0IoYmFzZUNvbG9yU3RyKSA6IG51bGxcblxuICAgIGlmIChiYXNlUkdCKSB7XG4gICAgICBjb25zdCBpbnRlcnBvbGF0ZWQgPSBpbnRlcnBvbGF0ZUNvbG9yKFxuICAgICAgICBiYXNlUkdCLFxuICAgICAgICBFUlJPUl9SRUQsXG4gICAgICAgIHN0YWxsZWRJbnRlbnNpdHksXG4gICAgICApXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8Qm94IGZsZXhXcmFwPVwid3JhcFwiIGhlaWdodD17MX0gd2lkdGg9ezJ9PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXt0b1JHQkNvbG9yKGludGVycG9sYXRlZCl9PntzcGlubmVyQ2hhcn08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKVxuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrIGZvciBBTlNJIHRoZW1lc1xuICAgIGNvbnN0IGNvbG9yID0gc3RhbGxlZEludGVuc2l0eSA+IDAuNSA/ICdlcnJvcicgOiBtZXNzYWdlQ29sb3JcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4V3JhcD1cIndyYXBcIiBoZWlnaHQ9ezF9IHdpZHRoPXsyfT5cbiAgICAgICAgPFRleHQgY29sb3I9e2NvbG9yfT57c3Bpbm5lckNoYXJ9PC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhXcmFwPVwid3JhcFwiIGhlaWdodD17MX0gd2lkdGg9ezJ9PlxuICAgICAgPFRleHQgY29sb3I9e21lc3NhZ2VDb2xvcn0+e3NwaW5uZXJDaGFyfTwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGNBQWM7QUFDbEQsU0FBU0MsUUFBUSxFQUFFLEtBQUtDLEtBQUssUUFBUSxzQkFBc0I7QUFDM0QsU0FDRUMsb0JBQW9CLEVBQ3BCQyxnQkFBZ0IsRUFDaEJDLFFBQVEsRUFDUkMsVUFBVSxRQUNMLFlBQVk7QUFFbkIsTUFBTUMsa0JBQWtCLEdBQUdKLG9CQUFvQixDQUFDLENBQUM7QUFFakQsTUFBTUssY0FBYyxHQUFHLENBQ3JCLEdBQUdELGtCQUFrQixFQUNyQixHQUFHLENBQUMsR0FBR0Esa0JBQWtCLENBQUMsQ0FBQ0UsT0FBTyxDQUFDLENBQUMsQ0FDckM7QUFFRCxNQUFNQyxrQkFBa0IsR0FBRyxHQUFHO0FBQzlCLE1BQU1DLHVCQUF1QixHQUFHLElBQUksRUFBQztBQUNyQyxNQUFNQyxTQUFTLEdBQUc7RUFBRUMsQ0FBQyxFQUFFLEdBQUc7RUFBRUMsQ0FBQyxFQUFFLEVBQUU7RUFBRUMsQ0FBQyxFQUFFO0FBQUcsQ0FBQztBQUUxQyxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsS0FBSyxFQUFFLE1BQU07RUFDYkMsWUFBWSxFQUFFLE1BQU1oQixLQUFLO0VBQ3pCaUIsZ0JBQWdCLENBQUMsRUFBRSxNQUFNO0VBQ3pCQyxhQUFhLENBQUMsRUFBRSxPQUFPO0VBQ3ZCQyxJQUFJLENBQUMsRUFBRSxNQUFNO0FBQ2YsQ0FBQztBQUVELE9BQU8sU0FBQUMsYUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFzQjtJQUFBUixLQUFBO0lBQUFDLFlBQUE7SUFBQUMsZ0JBQUEsRUFBQU8sRUFBQTtJQUFBTixhQUFBLEVBQUFPLEVB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