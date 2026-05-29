// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Ansi、Box、Text、useAnimationFrame，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Box, Text, useAnimationFrame } from '../../ink.js';
// 复用 segmentTextByHighlights、TextHighlight 工具函数，把通用处理留在 ../../utils/textHighlighting.js 中维护。
import { segmentTextByHighlights, type TextHighlight } from '../../utils/textHighlighting.js';
// 引入 ShimmerChar，将 ../Spinner/ShimmerChar.js 中已经封装好的能力接到本文件流程里。
import { ShimmerChar } from '../Spinner/ShimmerChar.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  text: string;
  highlights: TextHighlight[];
};
// LinePart 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type LinePart = {
  text: string;
  highlight: TextHighlight | undefined;
  start: number;
};
// HighlightedInput 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function HighlightedInput(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(23);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    text,
    highlights
  } = t0;
  // 文本行 先占位，稍后的条件分支会根据实际输入补齐它。
  let lines;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== highlights || $[1] !== text) {
    // segments 集合保存`segmentTextByHighlights`，供终端渲染后续处理使用。
    const segments = segmentTextByHighlights(text, highlights);
    // 文本行更新为 `[[]]`，确保提示输入组件后续读取最新状态。
    lines = [[]];
    // pos 集合保存`0`，供后续判断或组装使用。
    let pos = 0;
    // 按顺序遍历 `segments` 中的segment，逐个交给终端渲染处理。
    for (const segment of segments) {
      // 片段列表格式化`text.split`，供终端渲染后续处理使用。
      const parts = segment.text.split("\n");
      // 按索引扫描 `parts.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < parts.length; i++) {
        // 满足 `i > 0` 时，终端渲染执行该分支。
        if (i > 0) {
          // 文本行追加新条目，保持收集顺序与输入顺序一致。
          lines.push([]);
          // pos 集合更新为 `pos + 1`，确保提示输入组件后续读取最新状态。
          pos = pos + 1;
        }
        // part保存`parts[i]`，供终端渲染提示输入组件 Shimmered Input后续判断或输出使用。
        const part = parts[i];
        // 满足 `part.length > 0` 时，终端渲染执行该分支。
        if (part.length > 0) {
          // 提示输入组件 Shimmered Input在这里处理 `lines[lines.length - 1].push({`，完成这一小步状态转换。
          lines[lines.length - 1].push({
            text: part,
            highlight: segment.highlight,
            start: pos
          });
        }
        // pos 集合更新为 `pos + part.length`，确保提示输入组件后续读取最新状态。
        pos = pos + part.length;
      }
    }
    // $[0] 缓存 `highlights`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = highlights;
    // $[1] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = text;
    // $[2] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = lines;
  } else {
    // 文本行更新为 `$[2]`，确保提示输入组件后续读取最新状态。
    lines = $[2];
  }
  // t1 暂存 `highlights.some(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== highlights) {
    // t1 暂存 `highlights.some(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t1 = highlights.some(_temp);
    // $[3] 缓存 `highlights`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = highlights;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // hasShimmer标记终端渲染提示输入组件 Shimmered Input是否启用对应路径。
  const hasShimmer = t1;
  // sweepStart保存`0`，供终端渲染提示输入组件 Shimmered Input后续判断或输出使用。
  let sweepStart = 0;
  // cycleLength 数量保存`1`，供后续判断或组装使用。
  let cycleLength = 1;
  // 满足 `hasShimmer` 时，终端渲染执行该分支。
  if (hasShimmer) {
    // lo保存`Infinity`，供后续判断或组装使用。
    let lo = Infinity;
    // hi保存`-Infinity`，供终端渲染提示输入组件 Shimmered Input后续判断或输出使用。
    let hi = -Infinity;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== hi || $[6] !== highlights || $[7] !== lo) {
      // 按顺序遍历 `highlights` 中的h_0，逐个交给终端渲染处理。
      for (const h_0 of highlights) {
        // 满足 `h_0.shimmerColor` 时，终端渲染执行该分支。
        if (h_0.shimmerColor) {
          // lo更新为 `Math.min(lo, h_0.start)`，确保提示输入组件后续读取最新状态。
          lo = Math.min(lo, h_0.start);
          // hi更新为 `Math.max(hi, h_0.end)`，确保提示输入组件后续读取最新状态。
          hi = Math.max(hi, h_0.end);
        }
      }
      // $[5] 缓存 `hi`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = hi;
      // $[6] 缓存 `highlights`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = highlights;
      // $[7] 缓存 `lo`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = lo;
      // $[8] 缓存 `lo`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = lo;
      // $[9] 缓存 `hi`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = hi;
    } else {
      // lo更新为 `$[8]`，确保提示输入组件后续读取最新状态。
      lo = $[8];
      // hi更新为 `$[9]`，确保提示输入组件后续读取最新状态。
      hi = $[9];
    }
    // sweepStart更新为 `lo - 10`，确保提示输入组件后续读取最新状态。
    sweepStart = lo - 10;
    // cycleLength 数量更新为 `hi - lo + 20`，确保提示输入组件后续读取最新状态。
    cycleLength = hi - lo + 20;
  }
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== cycleLength || $[11] !== hasShimmer || $[12] !== lines || $[13] !== sweepStart) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      lines,
      hasShimmer,
      sweepStart,
      cycleLength
    };
    // $[10] 缓存 `cycleLength`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = cycleLength;
    // $[11] 缓存 `hasShimmer`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = hasShimmer;
    // $[12] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = lines;
    // $[13] 缓存 `sweepStart`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = sweepStart;
    // $[14] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[14];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    lines: lines_0,
    hasShimmer: hasShimmer_0,
    sweepStart: sweepStart_0,
    cycleLength: cycleLength_0
  } = t2;
  // 从 `useAnimationFrame(hasShimmer_0 ? 50 : null)` 按位置拆出 ref、time，让提示输入组件 Shimmered Input分别处理这些返回值。
  const [ref, time] = useAnimationFrame(hasShimmer_0 ? 50 : null);
  // glimmerIndex 索引保存`Math.floor`，供终端渲染后续处理使用。
  const glimmerIndex = hasShimmer_0 ? sweepStart_0 + Math.floor(time / 50) % cycleLength_0 : -100;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== glimmerIndex || $[16] !== lines_0) {
    // t4 暂存 `(lineParts, lineIndex) => <Box key={lineIndex}>{lineParts...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[18] !== glimmerIndex) {
      // t4 暂存 `(lineParts, lineIndex) => <Box key={lineIndex}>{lineParts...` 生成的渲染片段，后续返回路径直接复用。
      t4 = (lineParts, lineIndex) => <Box key={lineIndex}>{lineParts.length === 0 ? <Text> </Text> : lineParts.map((part_0, partIndex) => {
          // 只有 `part_0.highlight?.shimmerColor && part_0.highligh` 满足时，终端渲染才执行该分支。
          if (part_0.highlight?.shimmerColor && part_0.highlight.color) {
            // 返回 `<Text key={partIndex}>{part_0.text.split("").map((char, charIndex) => <...`，作为终端渲染这次计算的结果。
            return <Text key={partIndex}>{part_0.text.split("").map((char, charIndex) => <ShimmerChar key={charIndex} char={char} index={part_0.start + charIndex} glimmerIndex={glimmerIndex} messageColor={part_0.highlight.color} shimmerColor={part_0.highlight.shimmerColor} />)}</Text>;
          }
          // 返回 `<Text key={partIndex} color={part_0.highlight?.color} dimColor={part_0....`，作为终端渲染这次计算的结果。
          return <Text key={partIndex} color={part_0.highlight?.color} dimColor={part_0.highlight?.dimColor} inverse={part_0.highlight?.inverse}><Ansi>{part_0.text}</Ansi></Text>;
        })}</Box>;
      // $[18] 缓存 `glimmerIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = glimmerIndex;
      // $[19] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[19];
    }
    // t3 暂存 `lines_0.map(t4)` 生成的渲染片段，后续返回路径直接复用。
    t3 = lines_0.map(t4);
    // $[15] 缓存 `glimmerIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = glimmerIndex;
    // $[16] 缓存 `lines_0`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = lines_0;
    // $[17] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[17];
  }
  // t4 暂存 `<Box ref={ref} flexDirection="column">{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== ref || $[21] !== t3) {
    // t4 暂存 `<Box ref={ref} flexDirection="column">{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box ref={ref} flexDirection="column">{t3}</Box>;
    // $[20] 缓存 `ref`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = ref;
    // $[21] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t3;
    // $[22] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[22];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
// _temp 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(h) {
  // 返回 `h.shimmerColor`，作为终端渲染这次计算的结果。
  return h.shimmerColor;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkFuc2kiLCJCb3giLCJUZXh0IiwidXNlQW5pbWF0aW9uRnJhbWUiLCJzZWdtZW50VGV4dEJ5SGlnaGxpZ2h0cyIsIlRleHRIaWdobGlnaHQiLCJTaGltbWVyQ2hhciIsIlByb3BzIiwidGV4dCIsImhpZ2hsaWdodHMiLCJMaW5lUGFydCIsImhpZ2hsaWdodCIsInN0YXJ0IiwiSGlnaGxpZ2h0ZWRJbnB1dCIsInQwIiwiJCIsIl9jIiwibGluZXMiLCJzZWdtZW50cyIsInBvcyIsInNlZ21lbnQiLCJwYXJ0cyIsInNwbGl0IiwiaSIsImxlbmd0aCIsInB1c2giLCJwYXJ0IiwidDEiLCJzb21lIiwiX3RlbXAiLCJoYXNTaGltbWVyIiwic3dlZXBTdGFydCIsImN5Y2xlTGVuZ3RoIiwibG8iLCJJbmZpbml0eSIsImhpIiwiaF8wIiwiaCIsInNoaW1tZXJDb2xvciIsIk1hdGgiLCJtaW4iLCJtYXgiLCJlbmQiLCJ0MiIsImxpbmVzXzAiLCJoYXNTaGltbWVyXzAiLCJzd2VlcFN0YXJ0XzAiLCJjeWNsZUxlbmd0aF8wIiwicmVmIiwidGltZSIsImdsaW1tZXJJbmRleCIsImZsb29yIiwidDMiLCJ0NCIsImxpbmVQYXJ0cyIsImxpbmVJbmRleCIsIm1hcCIsInBhcnRfMCIsInBhcnRJbmRleCIsImNvbG9yIiwiY2hhciIsImNoYXJJbmRleCIsImRpbUNvbG9yIiwiaW52ZXJzZSJdLCJzb3VyY2VzIjpbIlNoaW1tZXJlZElucHV0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEFuc2ksIEJveCwgVGV4dCwgdXNlQW5pbWF0aW9uRnJhbWUgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQge1xuICBzZWdtZW50VGV4dEJ5SGlnaGxpZ2h0cyxcbiAgdHlwZSBUZXh0SGlnaGxpZ2h0LFxufSBmcm9tICcuLi8uLi91dGlscy90ZXh0SGlnaGxpZ2h0aW5nLmpzJ1xuaW1wb3J0IHsgU2hpbW1lckNoYXIgfSBmcm9tICcuLi9TcGlubmVyL1NoaW1tZXJDaGFyLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0ZXh0OiBzdHJpbmdcbiAgaGlnaGxpZ2h0czogVGV4dEhpZ2hsaWdodFtdXG59XG5cbnR5cGUgTGluZVBhcnQgPSB7XG4gIHRleHQ6IHN0cmluZ1xuICBoaWdobGlnaHQ6IFRleHRIaWdobGlnaHQgfCB1bmRlZmluZWRcbiAgc3RhcnQ6IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gSGlnaGxpZ2h0ZWRJbnB1dCh7IHRleHQsIGhpZ2hsaWdodHMgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBUaGUgc2hpbW1lciBhbmltYXRpb24gKGJlbG93KSByZS1yZW5kZXJzIHRoaXMgY29tcG9uZW50IGF0IDIwZnBzIHdoaWxlIHRoZVxuICAvLyB1bHRyYXRoaW5rIGtleXdvcmQgaXMgcHJlc2VudC4gdGV4dC9oaWdobGlnaHRzIGFyZSByZWZlcmVudGlhbGx5IHN0YWJsZVxuICAvLyBhY3Jvc3MgYW5pbWF0aW9uIHRpY2tzIChwYXJlbnQgZG9lc24ndCByZS1yZW5kZXIpLCBzbyBtZW1vaXplIGV2ZXJ5dGhpbmdcbiAgLy8gdGhhdCBkZXJpdmVzIGZyb20gdGhlbTogc2VnbWVudFRleHRCeUhpZ2hsaWdodHMgYWxvbmUgaXMgfjg1wrVzL2NhbGxcbiAgLy8gKHRva2VuaXplICsgc29ydCArIE8obsKyKSBvdmVybGFwKSwgd2hpY2ggYWRkcyB1cCBmYXN0IGF0IDIwZnBzLlxuICBjb25zdCB7IGxpbmVzLCBoYXNTaGltbWVyLCBzd2VlcFN0YXJ0LCBjeWNsZUxlbmd0aCB9ID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3Qgc2VnbWVudHMgPSBzZWdtZW50VGV4dEJ5SGlnaGxpZ2h0cyh0ZXh0LCBoaWdobGlnaHRzKVxuXG4gICAgLy8gU3BsaXQgc2VnbWVudHMgYnkgbmV3bGluZXMgaW50byBwZXItbGluZSBncm91cHMuIEluaydzIHJvdy1kaXJlY3Rpb24gQm94XG4gICAgLy8gaW5kZW50cyBjb250aW51YXRpb24gbGluZXMgb2YgYSBtdWx0aS1saW5lIGNoaWxkIHRvIHRoYXQgY2hpbGQncyBYIG9mZnNldC5cbiAgICAvLyBCeSBzcGxpdHRpbmcgYXQgbmV3bGluZXMsIGVhY2ggbGluZSByZW5kZXJzIGFzIGl0cyBvd24gcm93LCBhdm9pZGluZyB0aGVcbiAgICAvLyBpbmNvcnJlY3QgaW5kZW50YXRpb24gd2hlbiBoaWdobGlnaHRlZCB0ZXh0IGlzIGZvbGxvd2VkIGJ5IHdyYXBwZWQgY29udGVudC5cbiAgICBjb25zdCBsaW5lczogTGluZVBhcnRbXVtdID0gW1tdXVxuICAgIGxldCBwb3MgPSAwXG4gICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IHNlZ21lbnQudGV4dC5zcGxpdCgnXFxuJylcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgbGluZXMucHVzaChbXSlcbiAgICAgICAgICBwb3MgKz0gMVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXSFcbiAgICAgICAgaWYgKHBhcnQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdIS5wdXNoKHtcbiAgICAgICAgICAgIHRleHQ6IHBhcnQsXG4gICAgICAgICAgICBoaWdobGlnaHQ6IHNlZ21lbnQuaGlnaGxpZ2h0LFxuICAgICAgICAgICAgc3RhcnQ6IHBvcyxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIHBvcyArPSBwYXJ0Lmxlbmd0aFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNjb3BlIHRoZSBzd2VlcCB0byBzaGltbWVyLWhpZ2hsaWdodGVkIHJhbmdlcyBzbyBjeWNsZSB0aW1lIGRvZXNuJ3QgZ3Jvd1xuICAgIC8vIHdpdGggaW5wdXQgbGVuZ3RoLiBQYWRkaW5nIGNyZWF0ZXMgYW4gb2Zmc2NyZWVuIHBhdXNlIGJldHdlZW4gc3dlZXBzLlxuICAgIGNvbnN0IGhhc1NoaW1tZXIgPSBoaWdobGlnaHRzLnNvbWUoaCA9PiBoLnNoaW1tZXJDb2xvcilcbiAgICBsZXQgc3dlZXBTdGFydCA9IDBcbiAgICBsZXQgY3ljbGVMZW5ndGggPSAxXG4gICAgaWYgKGhhc1NoaW1tZXIpIHtcbiAgICAgIGNvbnN0IHBhZGRpbmcgPSAxMFxuICAgICAgbGV0IGxvID0gSW5maW5pdHlcbiAgICAgIGxldCBoaSA9IC1JbmZpbml0eVxuICAgICAgZm9yIChjb25zdCBoIG9mIGhpZ2hsaWdodHMpIHtcbiAgICAgICAgaWYgKGguc2hpbW1lckNvbG9yKSB7XG4gICAgICAgICAgbG8gPSBNYXRoLm1pbihsbywgaC5zdGFydClcbiAgICAgICAgICBoaSA9IE1hdGgubWF4KGhpLCBoLmVuZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3dlZXBTdGFydCA9IGxvIC0gcGFkZGluZ1xuICAgICAgY3ljbGVMZW5ndGggPSBoaSAtIGxvICsgcGFkZGluZyAqIDJcbiAgICB9XG5cbiAgICByZXR1cm4geyBsaW5lcywgaGFzU2hpbW1lciwgc3dlZXBTdGFydCwgY3ljbGVMZW5ndGggfVxuICB9LCBbdGV4dCwgaGlnaGxpZ2h0c10pXG5cbiAgY29uc3QgW3JlZiwgdGltZV0gPSB1c2VBbmltYXRpb25GcmFtZShoYXNTaGltbWVyID8gNTAgOiBudWxsKVxuICBjb25zdCBnbGltbWVySW5kZXggPSBoYXNTaGltbWVyXG4gICAgPyBzd2VlcFN0YXJ0ICsgKE1hdGguZmxvb3IodGltZSAvIDUwKSAlIGN5Y2xlTGVuZ3RoKVxuICAgIDogLTEwMFxuXG4gIHJldHVybiAoXG4gICAgPEJveCByZWY9e3JlZn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAge2xpbmVzLm1hcCgobGluZVBhcnRzLCBsaW5lSW5kZXgpID0+IChcbiAgICAgICAgPEJveCBrZXk9e2xpbmVJbmRleH0+XG4gICAgICAgICAge2xpbmVQYXJ0cy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICA8VGV4dD4gPC9UZXh0PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICBsaW5lUGFydHMubWFwKChwYXJ0LCBwYXJ0SW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHBhcnQuaGlnaGxpZ2h0Py5zaGltbWVyQ29sb3IgJiYgcGFydC5oaWdobGlnaHQuY29sb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPFRleHQga2V5PXtwYXJ0SW5kZXh9PlxuICAgICAgICAgICAgICAgICAgICB7cGFydC50ZXh0LnNwbGl0KCcnKS5tYXAoKGNoYXIsIGNoYXJJbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgIDxTaGltbWVyQ2hhclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjaGFySW5kZXh9XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFyPXtjaGFyfVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg9e3BhcnQuc3RhcnQgKyBjaGFySW5kZXh9XG4gICAgICAgICAgICAgICAgICAgICAgICBnbGltbWVySW5kZXg9e2dsaW1tZXJJbmRleH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VDb2xvcj17cGFydC5oaWdobGlnaHQhLmNvbG9yIX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaW1tZXJDb2xvcj17cGFydC5oaWdobGlnaHQhLnNoaW1tZXJDb2xvciF9XG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgICAgIGtleT17cGFydEluZGV4fVxuICAgICAgICAgICAgICAgICAgY29sb3I9e3BhcnQuaGlnaGxpZ2h0Py5jb2xvcn1cbiAgICAgICAgICAgICAgICAgIGRpbUNvbG9yPXtwYXJ0LmhpZ2hsaWdodD8uZGltQ29sb3J9XG4gICAgICAgICAgICAgICAgICBpbnZlcnNlPXtwYXJ0LmhpZ2hsaWdodD8uaW52ZXJzZX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8QW5zaT57cGFydC50ZXh0fTwvQW5zaT5cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICApKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxJQUFJLEVBQUVDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxpQkFBaUIsUUFBUSxjQUFjO0FBQ2pFLFNBQ0VDLHVCQUF1QixFQUN2QixLQUFLQyxhQUFhLFFBQ2IsaUNBQWlDO0FBQ3hDLFNBQVNDLFdBQVcsUUFBUSwyQkFBMkI7QUFFdkQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLElBQUksRUFBRSxNQUFNO0VBQ1pDLFVBQVUsRUFBRUosYUFBYSxFQUFFO0FBQzdCLENBQUM7QUFFRCxLQUFLSyxRQUFRLEdBQUc7RUFDZEYsSUFBSSxFQUFFLE1BQU07RUFDWkcsU0FBUyxFQUFFTixhQUFhLEdBQUcsU0FBUztFQUNwQ08sS0FBSyxFQUFFLE1BQU07QUFDZixDQUFDO0FBRUQsT0FBTyxTQUFBQyxpQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUEwQjtJQUFBUixJQUFBO0lBQUFDO0VBQUEsSUFBQUssRUFBMkI7RUFBQSxJQUFBRyxLQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBTixVQUFBLElBQUFNLENBQUEsUUFBQVAsSUFBQTtJQU94RCxNQUFBVSxRQUFBLEdBQWlCZCx1QkFB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