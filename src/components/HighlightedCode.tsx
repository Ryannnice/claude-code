// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 memo、useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { memo, useEffect, useMemo, useRef, useState } from 'react';
// 引入 useSettings，将 ../hooks/useSettings.js 中已经封装好的能力接到本文件流程里。
import { useSettings } from '../hooks/useSettings.js';
// 引入 Ansi、Box、DOMElement、measureElement、NoSelect、Text、useTheme，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Box, type DOMElement, measureElement, NoSelect, Text, useTheme } from '../ink.js';
// 复用 isFullscreenEnvEnabled 工具函数，把通用处理留在 ../utils/fullscreen.js 中维护。
import { isFullscreenEnvEnabled } from '../utils/fullscreen.js';
// 复用 sliceAnsi 工具函数，把通用处理留在 ../utils/sliceAnsi.js 中维护。
import sliceAnsi from '../utils/sliceAnsi.js';
// 复用 countCharInString 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { countCharInString } from '../utils/stringUtils.js';
// 引入 HighlightedCodeFallback，将 ./HighlightedCode/Fallback.js 中已经封装好的能力接到本文件流程里。
import { HighlightedCodeFallback } from './HighlightedCode/Fallback.js';
// 引入 expectColorFile，将 ./StructuredDiff/colorDiff.js 中已经封装好的能力接到本文件流程里。
import { expectColorFile } from './StructuredDiff/colorDiff.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  code: string;
  filePath: string;
  width?: number;
  dim?: boolean;
};
// DEFAULT_WIDTH保存`80`，供后续判断或组装使用。
const DEFAULT_WIDTH = 80;
// HighlightedCode保存`memo`，供终端渲染后续处理使用。
export const HighlightedCode = memo(function HighlightedCode(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(21);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    code,
    filePath,
    width,
    dim: t1
  } = t0;
  // dim标记终端 UI Highlighted Code是否启用对应路径。
  const dim = t1 === undefined ? false : t1;
  // ref 引用保存`useRef`，供终端渲染后续处理使用。
  const ref = useRef(null);
  // measuredWidth 由 React state 持有，setMeasuredWidth 会在用户操作或异步结果返回时触发刷新。
  const [measuredWidth, setMeasuredWidth] = useState(width || DEFAULT_WIDTH);
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Highlighted Code分别处理这些返回值。
  const [theme] = useTheme();
  // settings 集合保存`useSettings`，供终端渲染后续处理使用。
  const settings = useSettings();
  // syntaxHighlightingDisabled 命名 `settings.syntaxHighlightingDisabled ?? false`，让后续代码直接表达这个值的用途。
  const syntaxHighlightingDisabled = settings.syntaxHighlightingDisabled ?? false;
  // t2 暂存 `null` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // 终端 UI 组件 Highlighted Code在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // 满足 `syntaxHighlightingDisabled` 时，终端渲染执行该分支。
    if (syntaxHighlightingDisabled) {
      // t2 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
      t2 = null;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // t3 暂存 `expectColorFile()` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `expectColorFile()` 生成的渲染片段，后续返回路径直接复用。
      t3 = expectColorFile();
      // $[0] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[0];
    }
    // ColorFile 文件数据沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
    const ColorFile = t3;
    // ColorFile 文件数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!ColorFile) {
      // t2 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
      t2 = null;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // t4 暂存 `new ColorFile(code, filePath)` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== code || $[2] !== filePath) {
      // t4 暂存 `new ColorFile(code, filePath)` 生成的渲染片段，后续返回路径直接复用。
      t4 = new ColorFile(code, filePath);
      // $[1] 缓存 `code`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = code;
      // $[2] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = filePath;
      // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[3];
    }
    // t2 暂存 `t4` 生成的渲染片段，后续返回路径直接复用。
    t2 = t4;
  }
  // colorFile 文件数据沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const colorFile = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== width) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 只有 `!width && ref.current` 满足时，终端渲染才执行该分支。
      if (!width && ref.current) {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          width: elementWidth
        } = measureElement(ref.current);
        // 满足 `elementWidth > 0` 时，终端渲染执行该分支。
        if (elementWidth > 0) {
          // setMeasuredWidth 写入新的状态值，使终端渲染后续读取保持一致。
          setMeasuredWidth(elementWidth - 2);
        }
      }
    };
    // t4 暂存 `[width]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [width];
    // $[4] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = width;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t3, t4);
  // t5 暂存 `null` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // 终端 UI 组件 Highlighted Code在这里处理 `bb1: {`，完成这一小步状态转换。
  bb1: {
    // 满足 `colorFile === null` 时，终端渲染执行该分支。
    if (colorFile === null) {
      // t5 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
      t5 = null;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb1;
    }
    // t6 暂存 `colorFile.render(theme, measuredWidth, dim)` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== colorFile || $[8] !== dim || $[9] !== measuredWidth || $[10] !== theme) {
      // t6 暂存 `colorFile.render(theme, measuredWidth, dim)` 生成的渲染片段，后续返回路径直接复用。
      t6 = colorFile.render(theme, measuredWidth, dim);
      // $[7] 缓存 `colorFile`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = colorFile;
      // $[8] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = dim;
      // $[9] 缓存 `measuredWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = measuredWidth;
      // $[10] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = theme;
      // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[11];
    }
    // t5 暂存 `t6` 生成的渲染片段，后续返回路径直接复用。
    t5 = t6;
  }
  // 文本行 命名 `t5`，让后续代码直接表达这个值的用途。
  const lines = t5;
  // t6 暂存 `0` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // 终端 UI 组件 Highlighted Code在这里处理 `bb2: {`，完成这一小步状态转换。
  bb2: {
    // 满足 `!isFullscreenEnvEnabled()` 时，终端渲染执行该分支。
    if (!isFullscreenEnvEnabled()) {
      // t6 暂存 `0` 生成的渲染片段，后续返回路径直接复用。
      t6 = 0;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb2;
    }
    // lineCount 数量统计`countCharInString`，供终端渲染后续处理使用。
    const lineCount = countCharInString(code, "\n") + 1;
    // t7 暂存 `lineCount.toString()` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== lineCount) {
      // t7 暂存 `lineCount.toString()` 生成的渲染片段，后续返回路径直接复用。
      t7 = lineCount.toString();
      // $[12] 缓存 `lineCount`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = lineCount;
      // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[13];
    }
    // t6 暂存 `t7.length + 2` 生成的渲染片段，后续返回路径直接复用。
    t6 = t7.length + 2;
  }
  // gutterWidth沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const gutterWidth = t6;
  // t7 暂存 `<Box ref={ref}>{lines ? <Box flexDirection="column">{line...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== code || $[15] !== dim || $[16] !== filePath || $[17] !== gutterWidth || $[18] !== lines || $[19] !== syntaxHighlightingDisabled) {
    // t7 暂存 `<Box ref={ref}>{lines ? <Box flexDirection="column">{line...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box ref={ref}>{lines ? <Box flexDirection="column">{lines.map((line, i) => gutterWidth > 0 ? <CodeLine key={i} line={line} gutterWidth={gutterWidth} /> : <Text key={i}><Ansi>{line}</Ansi></Text>)}</Box> : <HighlightedCodeFallback code={code} filePath={filePath} dim={dim} skipColoring={syntaxHighlightingDisabled} />}</Box>;
    // $[14] 缓存 `code`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = code;
    // $[15] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = dim;
    // $[16] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = filePath;
    // $[17] 缓存 `gutterWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = gutterWidth;
    // $[18] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = lines;
    // $[19] 缓存 `syntaxHighlightingDisabled`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = syntaxHighlightingDisabled;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
});
// CodeLine 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function CodeLine(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    line,
    gutterWidth
  } = t0;
  // t1 暂存 `sliceAnsi(line, 0, gutterWidth)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== gutterWidth || $[1] !== line) {
    // t1 暂存 `sliceAnsi(line, 0, gutterWidth)` 生成的渲染片段，后续返回路径直接复用。
    t1 = sliceAnsi(line, 0, gutterWidth);
    // $[0] 缓存 `gutterWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = gutterWidth;
    // $[1] 缓存 `line`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = line;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // gutter保存`t1`，作为后续临时缓存值处理的输入。
  const gutter = t1;
  // t2 暂存 `sliceAnsi(line, gutterWidth)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== gutterWidth || $[4] !== line) {
    // t2 暂存 `sliceAnsi(line, gutterWidth)` 生成的渲染片段，后续返回路径直接复用。
    t2 = sliceAnsi(line, gutterWidth);
    // $[3] 缓存 `gutterWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = gutterWidth;
    // $[4] 缓存 `line`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = line;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 文本内容 命名 `t2`，让后续代码直接表达这个值的用途。
  const content = t2;
  // t3 暂存 `<NoSelect fromLeftEdge={true}><Text><Ansi>{gutter}</Ansi>...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== gutter) {
    // t3 暂存 `<NoSelect fromLeftEdge={true}><Text><Ansi>{gutter}</Ansi>...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <NoSelect fromLeftEdge={true}><Text><Ansi>{gutter}</Ansi></Text></NoSelect>;
    // $[6] 缓存 `gutter`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = gutter;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // t4 暂存 `<Text><Ansi>{content}</Ansi></Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== content) {
    // t4 暂存 `<Text><Ansi>{content}</Ansi></Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text><Ansi>{content}</Ansi></Text>;
    // $[8] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = content;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Box flexDirection="row">{t3}{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t3 || $[11] !== t4) {
    // t5 暂存 `<Box flexDirection="row">{t3}{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="row">{t3}{t4}</Box>;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIm1lbW8iLCJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VTZXR0aW5ncyIsIkFuc2kiLCJCb3giLCJET01FbGVtZW50IiwibWVhc3VyZUVsZW1lbnQiLCJOb1NlbGVjdCIsIlRleHQiLCJ1c2VUaGVtZSIsImlzRnVsbHNjcmVlbkVudkVuYWJsZWQiLCJzbGljZUFuc2kiLCJjb3VudENoYXJJblN0cmluZyIsIkhpZ2hsaWdodGVkQ29kZUZhbGxiYWNrIiwiZXhwZWN0Q29sb3JGaWxlIiwiUHJvcHMiLCJjb2RlIiwiZmlsZVBhdGgiLCJ3aWR0aCIsImRpbSIsIkRFRkFVTFRfV0lEVEgiLCJIaWdobGlnaHRlZENvZGUiLCJ0MCIsIiQiLCJfYyIsInQxIiwidW5kZWZpbmVkIiwicmVmIiwibWVhc3VyZWRXaWR0aCIsInNldE1lYXN1cmVkV2lkdGgiLCJ0aGVtZSIsInNldHRpbmdzIiwic3ludGF4SGlnaGxpZ2h0aW5nRGlzYWJsZWQiLCJ0MiIsImJiMCIsInQzIiwiU3ltYm9sIiwiZm9yIiwiQ29sb3JGaWxlIiwidDQiLCJjb2xvckZpbGUiLCJjdXJyZW50IiwiZWxlbWVudFdpZHRoIiwidDUiLCJiYjEiLCJ0NiIsInJlbmRlciIsImxpbmVzIiwiYmIyIiwibGluZUNvdW50IiwidDciLCJ0b1N0cmluZyIsImxlbmd0aCIsImd1dHRlcldpZHRoIiwibWFwIiwibGluZSIsImkiLCJDb2RlTGluZSIsImd1dHRlciIsImNvbnRlbnQiXSwic291cmNlcyI6WyJIaWdobGlnaHRlZENvZGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgbWVtbywgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VTZXR0aW5ncyB9IGZyb20gJy4uL2hvb2tzL3VzZVNldHRpbmdzLmpzJ1xuaW1wb3J0IHtcbiAgQW5zaSxcbiAgQm94LFxuICB0eXBlIERPTUVsZW1lbnQsXG4gIG1lYXN1cmVFbGVtZW50LFxuICBOb1NlbGVjdCxcbiAgVGV4dCxcbiAgdXNlVGhlbWUsXG59IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGlzRnVsbHNjcmVlbkVudkVuYWJsZWQgfSBmcm9tICcuLi91dGlscy9mdWxsc2NyZWVuLmpzJ1xuaW1wb3J0IHNsaWNlQW5zaSBmcm9tICcuLi91dGlscy9zbGljZUFuc2kuanMnXG5pbXBvcnQgeyBjb3VudENoYXJJblN0cmluZyB9IGZyb20gJy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuaW1wb3J0IHsgSGlnaGxpZ2h0ZWRDb2RlRmFsbGJhY2sgfSBmcm9tICcuL0hpZ2hsaWdodGVkQ29kZS9GYWxsYmFjay5qcydcbmltcG9ydCB7IGV4cGVjdENvbG9yRmlsZSB9IGZyb20gJy4vU3RydWN0dXJlZERpZmYvY29sb3JEaWZmLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBjb2RlOiBzdHJpbmdcbiAgZmlsZVBhdGg6IHN0cmluZ1xuICB3aWR0aD86IG51bWJlclxuICBkaW0/OiBib29sZWFuXG59XG5cbmNvbnN0IERFRkFVTFRfV0lEVEggPSA4MFxuXG5leHBvcnQgY29uc3QgSGlnaGxpZ2h0ZWRDb2RlID0gbWVtbyhmdW5jdGlvbiBIaWdobGlnaHRlZENvZGUoe1xuICBjb2RlLFxuICBmaWxlUGF0aCxcbiAgd2lkdGgsXG4gIGRpbSA9IGZhbHNlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCByZWYgPSB1c2VSZWY8RE9NRWxlbWVudD4obnVsbClcbiAgY29uc3QgW21lYXN1cmVkV2lkdGgsIHNldE1lYXN1cmVkV2lkdGhdID0gdXNlU3RhdGUod2lkdGggfHwgREVGQVVMVF9XSURUSClcbiAgY29uc3QgW3RoZW1lXSA9IHVzZVRoZW1lKClcbiAgY29uc3Qgc2V0dGluZ3MgPSB1c2VTZXR0aW5ncygpXG4gIGNvbnN0IHN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkID1cbiAgICBzZXR0aW5ncy5zeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCA/PyBmYWxzZVxuXG4gIGNvbnN0IGNvbG9yRmlsZSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChzeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgY29uc3QgQ29sb3JGaWxlID0gZXhwZWN0Q29sb3JGaWxlKClcbiAgICBpZiAoIUNvbG9yRmlsZSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2xvckZpbGUoY29kZSwgZmlsZVBhdGgpXG4gIH0sIFtjb2RlLCBmaWxlUGF0aCwgc3ludGF4SGlnaGxpZ2h0aW5nRGlzYWJsZWRdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF3aWR0aCAmJiByZWYuY3VycmVudCkge1xuICAgICAgY29uc3QgeyB3aWR0aDogZWxlbWVudFdpZHRoIH0gPSBtZWFzdXJlRWxlbWVudChyZWYuY3VycmVudClcbiAgICAgIGlmIChlbGVtZW50V2lkdGggPiAwKSB7XG4gICAgICAgIHNldE1lYXN1cmVkV2lkdGgoZWxlbWVudFdpZHRoIC0gMilcbiAgICAgIH1cbiAgICB9XG4gIH0sIFt3aWR0aF0pXG5cbiAgY29uc3QgbGluZXMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoY29sb3JGaWxlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgICByZXR1cm4gY29sb3JGaWxlLnJlbmRlcih0aGVtZSwgbWVhc3VyZWRXaWR0aCwgZGltKVxuICB9LCBbY29sb3JGaWxlLCB0aGVtZSwgbWVhc3VyZWRXaWR0aCwgZGltXSlcblxuICAvLyBHdXR0ZXIgd2lkdGggbWF0Y2hlcyBDb2xvckZpbGUncyBsYXlvdXQgaW4gbGliLnJzOiBzcGFjZSArIHJpZ2h0LWFsaWduZWRcbiAgLy8gbGluZSBudW1iZXIgKG1heF9kaWdpdHMgPSBsaW5lQ291bnQudG9TdHJpbmcoKS5sZW5ndGgpICsgc3BhY2UuIE5vIG1hcmtlclxuICAvLyBjb2x1bW4gbGlrZSB0aGUgZGlmZiBwYXRoLiBXcmFwIGluIDxOb1NlbGVjdD4gc28gZnVsbHNjcmVlbiBzZWxlY3Rpb25cbiAgLy8geWllbGRzIGNsZWFuIGNvZGUgd2l0aG91dCBsaW5lIG51bWJlcnMuIE9ubHkgc3BsaXQgaW4gZnVsbHNjcmVlbiBtb2RlXG4gIC8vICh+NMOXIERPTSBub2RlcyArIHNsaWNlQW5zaSBjb3N0KTsgbm9uLWZ1bGxzY3JlZW4gdXNlcyB0ZXJtaW5hbC1uYXRpdmVcbiAgLy8gc2VsZWN0aW9uIHdoZXJlIG5vU2VsZWN0IGlzIG1lYW5pbmdsZXNzLlxuICBjb25zdCBndXR0ZXJXaWR0aCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghaXNGdWxsc2NyZWVuRW52RW5hYmxlZCgpKSByZXR1cm4gMFxuICAgIGNvbnN0IGxpbmVDb3VudCA9IGNvdW50Q2hhckluU3RyaW5nKGNvZGUsICdcXG4nKSArIDFcbiAgICByZXR1cm4gbGluZUNvdW50LnRvU3RyaW5nKCkubGVuZ3RoICsgMlxuICB9LCBbY29kZV0pXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IHJlZj17cmVmfT5cbiAgICAgIHtsaW5lcyA/IChcbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAge2xpbmVzLm1hcCgobGluZSwgaSkgPT5cbiAgICAgICAgICAgIGd1dHRlcldpZHRoID4gMCA/IChcbiAgICAgICAgICAgICAgPENvZGVMaW5lIGtleT17aX0gbGluZT17bGluZX0gZ3V0dGVyV2lkdGg9e2d1dHRlcldpZHRofSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPFRleHQga2V5PXtpfT5cbiAgICAgICAgICAgICAgICA8QW5zaT57bGluZX08L0Fuc2k+XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICksXG4gICAgICAgICAgKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICApIDogKFxuICAgICAgICA8SGlnaGxpZ2h0ZWRDb2RlRmFsbGJhY2tcbiAgICAgICAgICBjb2RlPXtjb2RlfVxuICAgICAgICAgIGZpbGVQYXRoPXtmaWxlUGF0aH1cbiAgICAgICAgICBkaW09e2RpbX1cbiAgICAgICAgICBza2lwQ29sb3Jpbmc9e3N5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkfVxuICAgICAgICAvPlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKVxufSlcblxuZnVuY3Rpb24gQ29kZUxpbmUoe1xuICBsaW5lLFxuICBndXR0ZXJXaWR0aCxcbn06IHtcbiAgbGluZTogc3RyaW5nXG4gIGd1dHRlcldpZHRoOiBudW1iZXJcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBndXR0ZXIgPSBzbGljZUFuc2kobGluZSwgMCwgZ3V0dGVyV2lkdGgpXG4gIGNvbnN0IGNvbnRlbnQgPSBzbGljZUFuc2kobGluZSwgZ3V0dGVyV2lkdGgpXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCI+XG4gICAgICA8Tm9TZWxlY3QgZnJvbUxlZnRFZGdlPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8QW5zaT57Z3V0dGVyfTwvQW5zaT5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Ob1NlbGVjdD5cbiAgICAgIDxUZXh0PlxuICAgICAgICA8QW5zaT57Y29udGVudH08L0Fuc2k+XG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsSUFBSSxFQUFFQyxTQUFTLEVBQUVDLE9BQU8sRUFBRUMsTUFBTSxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNsRSxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBQ3JELFNBQ0VDLElBQUksRUFDSkMsR0FBRyxFQUNILEtBQUtDLFVBQVUsRUFDZkMsY0FBYyxFQUNkQyxRQUFRLEVBQ1JDLElBQUksRUFD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