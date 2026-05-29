// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  /**
   * How much progress to display, between 0 and 1 inclusive
   */
  ratio: number; // [0, 1]

  /**
   * How many characters wide to draw the progress bar
   */
  width: number; // how many characters wide

  /**
   * Optional color for the filled portion of the bar
   */
  fillColor?: keyof Theme;

  /**
   * Optional color for the empty portion of the bar
   */
  emptyColor?: keyof Theme;
};
// BLOCKS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const BLOCKS = [' ', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
// ProgressBar 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ProgressBar(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ratio: inputRatio,
    width,
    fillColor,
    emptyColor
  } = t0;
  // ratio保存`Math.min`，供终端渲染后续处理使用。
  const ratio = Math.min(1, Math.max(0, inputRatio));
  // whole保存`Math.floor`，供终端渲染后续处理使用。
  const whole = Math.floor(ratio * width);
  // t1 暂存 `BLOCKS[BLOCKS.length - 1].repeat(whole)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== whole) {
    // t1 暂存 `BLOCKS[BLOCKS.length - 1].repeat(whole)` 生成的渲染片段，后续返回路径直接复用。
    t1 = BLOCKS[BLOCKS.length - 1].repeat(whole);
    // $[0] 缓存 `whole`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = whole;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // segments 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let segments;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== ratio || $[3] !== t1 || $[4] !== whole || $[5] !== width) {
    // segments 集合更新为 `[t1]`，确保终端 UI后续读取最新状态。
    segments = [t1];
    // 满足 `whole < width` 时，终端渲染执行该分支。
    if (whole < width) {
      // remainder 命名 `ratio * width - whole`，让后续代码直接表达这个值的用途。
      const remainder = ratio * width - whole;
      // middle保存`Math.floor`，供终端渲染后续处理使用。
      const middle = Math.floor(remainder * BLOCKS.length);
      // segments 集合追加新条目，保持收集顺序与输入顺序一致。
      segments.push(BLOCKS[middle]);
      // empty 命名 `width - whole - 1`，让后续代码直接表达这个值的用途。
      const empty = width - whole - 1;
      // 满足 `empty > 0` 时，终端渲染执行该分支。
      if (empty > 0) {
        // t2 暂存 `BLOCKS[0].repeat(empty)` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[7] !== empty) {
          // t2 暂存 `BLOCKS[0].repeat(empty)` 生成的渲染片段，后续返回路径直接复用。
          t2 = BLOCKS[0].repeat(empty);
          // $[7] 缓存 `empty`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = empty;
          // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[8] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[8];
        }
        // segments 集合追加新条目，保持收集顺序与输入顺序一致。
        segments.push(t2);
      }
    }
    // $[2] 缓存 `ratio`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = ratio;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `whole`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = whole;
    // $[5] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = width;
    // $[6] 缓存 `segments`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = segments;
  } else {
    // segments 集合更新为 `$[6]`，确保终端 UI后续读取最新状态。
    segments = $[6];
  }
  // 临时值 t2格式化`segments.join`，供终端渲染后续处理使用。
  const t2 = segments.join("");
  // t3 暂存 `<Text color={fillColor} backgroundColor={emptyColor}>{t2}...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== emptyColor || $[10] !== fillColor || $[11] !== t2) {
    // t3 暂存 `<Text color={fillColor} backgroundColor={emptyColor}>{t2}...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text color={fillColor} backgroundColor={emptyColor}>{t2}</Text>;
    // $[9] 缓存 `emptyColor`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = emptyColor;
    // $[10] 缓存 `fillColor`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = fillColor;
    // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t2;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[12];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJUaGVtZSIsIlByb3BzIiwicmF0aW8iLCJ3aWR0aCIsImZpbGxDb2xvciIsImVtcHR5Q29sb3IiLCJCTE9DS1MiLCJQcm9ncmVzc0JhciIsInQwIiwiJCIsIl9jIiwiaW5wdXRSYXRpbyIsIk1hdGgiLCJtaW4iLCJtYXgiLCJ3aG9sZSIsImZsb29yIiwidDEiLCJsZW5ndGgiLCJyZXBlYXQiLCJzZWdtZW50cyIsInJlbWFpbmRlciIsIm1pZGRsZSIsInB1c2giLCJlbXB0eSIsInQyIiwiam9pbiIsInQzIl0sInNvdXJjZXMiOlsiUHJvZ3Jlc3NCYXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lIH0gZnJvbSAnLi4vLi4vdXRpbHMvdGhlbWUuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIC8qKlxuICAgKiBIb3cgbXVjaCBwcm9ncmVzcyB0byBkaXNwbGF5LCBiZXR3ZWVuIDAgYW5kIDEgaW5jbHVzaXZlXG4gICAqL1xuICByYXRpbzogbnVtYmVyIC8vIFswLCAxXVxuXG4gIC8qKlxuICAgKiBIb3cgbWFueSBjaGFyYWN0ZXJzIHdpZGUgdG8gZHJhdyB0aGUgcHJvZ3Jlc3MgYmFyXG4gICAqL1xuICB3aWR0aDogbnVtYmVyIC8vIGhvdyBtYW55IGNoYXJhY3RlcnMgd2lkZVxuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBjb2xvciBmb3IgdGhlIGZpbGxlZCBwb3J0aW9uIG9mIHRoZSBiYXJcbiAgICovXG4gIGZpbGxDb2xvcj86IGtleW9mIFRoZW1lXG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIGNvbG9yIGZvciB0aGUgZW1wdHkgcG9ydGlvbiBvZiB0aGUgYmFyXG4gICAqL1xuICBlbXB0eUNvbG9yPzoga2V5b2YgVGhlbWVcbn1cblxuY29uc3QgQkxPQ0tTID0gWycgJywgJ+KWjycsICfilo4nLCAn4paNJywgJ+KWjCcsICfilosnLCAn4paKJywgJ+KWiScsICfilognXVxuXG5leHBvcnQgZnVuY3Rpb24gUHJvZ3Jlc3NCYXIoe1xuICByYXRpbzogaW5wdXRSYXRpbyxcbiAgd2lkdGgsXG4gIGZpbGxDb2xvcixcbiAgZW1wdHlDb2xvcixcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcmF0aW8gPSBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCBpbnB1dFJhdGlvKSlcbiAgY29uc3Qgd2hvbGUgPSBNYXRoLmZsb29yKHJhdGlvICogd2lkdGgpXG4gIGNvbnN0IHNlZ21lbnRzID0gW0JMT0NLU1tCTE9DS1MubGVuZ3RoIC0gMV0hLnJlcGVhdCh3aG9sZSldXG4gIGlmICh3aG9sZSA8IHdpZHRoKSB7XG4gICAgY29uc3QgcmVtYWluZGVyID0gcmF0aW8gKiB3aWR0aCAtIHdob2xlXG4gICAgY29uc3QgbWlkZGxlID0gTWF0aC5mbG9vcihyZW1haW5kZXIgKiBCTE9DS1MubGVuZ3RoKVxuICAgIHNlZ21lbnRzLnB1c2goQkxPQ0tTW21pZGRsZV0hKVxuXG4gICAgY29uc3QgZW1wdHkgPSB3aWR0aCAtIHdob2xlIC0gMVxuICAgIGlmIChlbXB0eSA+IDApIHtcbiAgICAgIHNlZ21lbnRzLnB1c2goQkxPQ0tTWzBdIS5yZXBlYXQoZW1wdHkpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFRleHQgY29sb3I9e2ZpbGxDb2xvcn0gYmFja2dyb3VuZENvbG9yPXtlbXB0eUNvbG9yfT5cbiAgICAgIHtzZWdtZW50cy5qb2luKCcnKX1cbiAgICA8L1RleHQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLElBQUksUUFBUSxjQUFjO0FBQ25DLGNBQWNDLEtBQUssUUFBUSxzQkFBc0I7QUFFakQsS0FBS0MsS0FBSyxHQUFHO0VBQ1g7QUFDRjtBQUNBO0VBQ0VDLEtBQUssRUFBRSxNQUFNLEVBQUM7O0VBRWQ7QUFDRjtBQUNBO0VBQ0VDLEtBQUssRUFBRSxNQUFNLEVBQUM7O0VBRWQ7QUFDRjtBQUNBO0VBQ0VDLFNBQVMsQ0FBQyxFQUFFLE1BQU1KLEtBQUs7O0VBRXZCO0FBQ0Y7QUFDQTtFQUNFSyxVQUFVLENBQUMsRUFBRSxNQUFNTCxLQUFLO0FBQzFCLENBQUM7QUFFRCxNQUFNTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztBQUU1RCxPQUFPLFNBQUFDLFlBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBcUI7SUFBQVIsS0FBQSxFQUFBUyxVQUFBO0lBQUFSLEtBQUE7SUFBQUMsU0FBQTtJQUFBQztFQUFBLElBQUFHLEVBS3BCO0VBQ04sTUFBQU4sS0FBQSxHQUFjVSxJQUFJLENBQUFDLEdBQUksQ0FBQyxDQUFDLEVBQUVELElBQUksQ0FBQUUsR0FBSSxDQUFDLENBQUMsRUFBRUgsVUFBVSxDQUFDLENBQUM7RUFDbEQsTUFBQUksS0FBQSxHQUFjSCxJQUFJLENBQUFJLEtBQU0sQ0FBQ2QsS0FBSyxHQUFHQyxLQUFLLENBQUM7RUFBQSxJQUFBYyxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxRQUFBTSxLQUFBO0lBQ3JCRSxFQUFBLEdBQUFYLE1BQU0sQ0FBQ0EsTUFBTSxDQUFBWSxNQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUFDLE1BQVEsQ0FBQ0osS0FBSyxDQUFDO0lBQUFOLENBQUEsTUFBQU0sS0FBQTtJQUFBTixDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFBLElBQUFXLFFBQUE7RUFBQSxJQUFBWCxDQUFBLFFBQUFQLEtBQUEsSUFBQU8sQ0FBQSxRQUFBUSxFQUFBLElBQUFSLENBQUEsUUFBQU0sS0FBQSxJQUFBTixDQUFBLFFBQUFOLEtBQUE7SUFBMURpQixRQUFBLEdBQWlCLENBQUNILEVBQXdDLENBQUM7SUFDM0QsSUFBSUYsS0FBSyxHQUFHWixLQUFLO01BQ2YsTUFBQWtCLFNBQUEsR0FBa0JuQixLQUFLLEdBQUdDLEtBQUssR0FBR1ksS0FBSztNQUN2QyxNQUFBTyxNQUFBLEdBQWVWLElBQUksQ0FBQUksS0FBTSxDQUFDSyxTQUFTLEdBQUdmLE1BQU0sQ0FBQVksTUFBTyxDQUFDO01BQ3BERSxRQUFRLENBQUFHLElBQUssQ0FBQ2pCLE1BQU0sQ0FBQ2dCLE1BQU0sQ0FBRSxDQUFDO01BRTlCLE1BQUFFLEtBQUEsR0FBY3JCLEtBQUssR0FBR1ksS0FBSyxHQUFHLENBQUM7TUFDL0IsSUFBSVMsS0FBSyxHQUFHLENBQUM7UUFBQSxJQUFBQyxFQUFBO1FBQUEsSUFBQWhCLENBQUEsUUFBQWUsS0FBQTtVQUNHQyxFQUFBLEdBQUFuQixNQUFNLEdBQUcsQ0FBQWEsTUFBUSxDQUFDSyxLQUFLLENBQUM7VUFBQWYsQ0FBQSxNQUFBZSxLQUFBO1VBQUFmLENBQUEsTUFBQWdCLEVBQUE7UUFBQTtVQUFBQSxFQUFBLEdBQUFoQixDQUFBO1FBQUE7UUFBdENXLFFBQVEsQ0FBQUcsSUFBSyxDQUFDRSxFQUF3QixDQUFDO01BQUE7SUFDeEM7SUFDRmhCLENBQUEsTUFBQVAsS0FBQTtJQUFBTyxDQUFBLE1BQUFRLEVBQUE7SUFBQVIsQ0FBQSxNQUFBTSxLQUFBO0lBQUFOLENBQUEsTUFBQU4sS0FBQTtJQUFBTSxDQUFBLE1BQUFXLFFBQUE7RUFBQTtJQUFBQSxRQUFBLEdBQUFYLENBQUE7RUFBQTtFQUlJLE1BQUFnQixFQUFBLEdBQUFMLFFBQVEsQ0FBQU0sSUFBSyxDQUFDLEVBQUUsQ0FBQztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBbEIsQ0FBQSxRQUFBSixVQUFBLElBQUFJLENBQUEsU0FBQUwsU0FBQSxJQUFBSyxDQUFBLFNBQUFnQixFQUFBO0lBRHBCRSxFQUFBLElBQUMsSUFBSSxDQUFRdkIsS0FBUyxDQUFUQSxVQUFRLENBQUMsQ0FBbUJDLGVBQVUsQ0FBVkEsV0FBUyxDQUFDLENBQ2hELENBQUFvQixFQUFnQixDQUNuQixFQUZDLElBQUksQ0FFRTtJQUFBaEIsQ0FBQSxNQUFBSixVQUFBO0lBQUFJLENBQUEsT0FBQUwsU0FBQTtJQUFBSyxDQUFBLE9BQUFnQixFQUFBO0lBQUFoQixDQUFBLE9BQUFrQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBbEIsQ0FBQTtFQUFBO0VBQUEsT0FGUGtCLEVBRU87QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==