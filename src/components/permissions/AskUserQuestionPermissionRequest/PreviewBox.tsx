// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、Suspense、use、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useMemo } from 'react';
// 引入 useSettings，将 ../../../hooks/useSettings.js 中已经封装好的能力接到本文件流程里。
import { useSettings } from '../../../hooks/useSettings.js';
// 引入 useTerminalSize，将 ../../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../../ink/stringWidth.js';
// 引入 Ansi、Box、Text、useTheme，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Box, Text, useTheme } from '../../../ink.js';
// 复用 CliHighlight、getCliHighlightPromise 工具函数，把通用处理留在 ../../../utils/cliHighlight.js 中维护。
import { type CliHighlight, getCliHighlightPromise } from '../../../utils/cliHighlight.js';
// 复用 applyMarkdown 工具函数，把通用处理留在 ../../../utils/markdown.js 中维护。
import { applyMarkdown } from '../../../utils/markdown.js';
// 复用 sliceAnsi 工具函数，把通用处理留在 ../../../utils/sliceAnsi.js 中维护。
import sliceAnsi from '../../../utils/sliceAnsi.js';
// PreviewBoxProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type PreviewBoxProps = {
  /** The preview content to display. Markdown is rendered with syntax highlighting
   * for code blocks (```ts, ```py, etc.). Also supports plain multi-line text. */
  content: string;
  /** Maximum number of lines to display before truncating. @default 20 */
  maxLines?: number;
  /** Minimum height (in lines) for the preview box. Content will be padded if shorter. */
  minHeight?: number;
  /** Minimum width for the preview box. @default 40 */
  minWidth?: number;
  /** Maximum width available for this box (e.g., the container width). */
  maxWidth?: number;
};
// BOX_CHARS 集合 集中保存终端渲染权限确认界面 Preview Box要一起传递的字段。
const BOX_CHARS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  teeLeft: '├',
  teeRight: '┤'
};

/**
 * A bordered monospace box for displaying preview content.
 * Truncates content that exceeds maxLines with an indicator.
 * The parent component should pass maxLines based on its available height budget.
 */
// PreviewBox 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PreviewBox(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // settings 集合保存`useSettings`，供终端渲染后续处理使用。
  const settings = useSettings();
  // 满足 `settings.syntaxHighlightingDisabled` 时，终端渲染执行该分支。
  if (settings.syntaxHighlightingDisabled) {
    // t0 暂存 `<PreviewBoxBody {...props} highlight={null} />` 的派生结果，便于缓存命中时直接复用。
    let t0;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== props) {
      // t0 暂存 `<PreviewBoxBody {...props} highlight={null} />` 生成的渲染片段，后续返回路径直接复用。
      t0 = <PreviewBoxBody {...props} highlight={null} />;
      // $[0] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = props;
      // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t0;
    } else {
      // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
      t0 = $[1];
    }
    // 返回 `t0`，作为终端渲染这次计算的结果。
    return t0;
  }
  // t0 暂存 `<Suspense fallback={<PreviewBoxBody {...props} highlight=...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== props) {
    // t0 暂存 `<Suspense fallback={<PreviewBoxBody {...props} highlight=...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Suspense fallback={<PreviewBoxBody {...props} highlight={null} />}><PreviewBoxWithHighlight {...props} /></Suspense>;
    // $[2] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[3];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// PreviewBoxWithHighlight 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PreviewBoxWithHighlight(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // t0 暂存 `getCliHighlightPromise()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `getCliHighlightPromise()` 生成的渲染片段，后续返回路径直接复用。
    t0 = getCliHighlightPromise();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // highlight保存`use`，供终端渲染后续处理使用。
  const highlight = use(t0);
  // t1 暂存 `<PreviewBoxBody {...props} highlight={highlight} />` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== highlight || $[2] !== props) {
    // t1 暂存 `<PreviewBoxBody {...props} highlight={highlight} />` 生成的渲染片段，后续返回路径直接复用。
    t1 = <PreviewBoxBody {...props} highlight={highlight} />;
    // $[1] 缓存 `highlight`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = highlight;
    // $[2] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// PreviewBoxBody 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PreviewBoxBody(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(34);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    content,
    maxLines,
    minHeight,
    minWidth: t1,
    maxWidth,
    highlight
  } = t0;
  // minWidth标记终端渲染权限确认界面 Preview Box是否启用对应路径。
  const minWidth = t1 === undefined ? 40 : t1;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns: terminalWidth
  } = useTerminalSize();
  // 从 `useTheme()` 按位置拆出 theme，让权限确认界面 Preview Box分别处理这些返回值。
  const [theme] = useTheme();
  // effectiveMaxWidth保存`maxWidth ?? terminalWidth - 4`，供后续判断或组装使用。
  const effectiveMaxWidth = maxWidth ?? terminalWidth - 4;
  // effectiveMaxLines 集合保存`maxLines ?? 20`，供后续判断或组装使用。
  const effectiveMaxLines = maxLines ?? 20;
  // t2 暂存 `applyMarkdown(content, theme, highlight)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== content || $[1] !== highlight || $[2] !== theme) {
    // t2 暂存 `applyMarkdown(content, theme, highlight)` 生成的渲染片段，后续返回路径直接复用。
    t2 = applyMarkdown(content, theme, highlight);
    // $[0] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = content;
    // $[1] 缓存 `highlight`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = highlight;
    // $[2] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = theme;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // rendered 命名 `t2`，让后续代码直接表达这个值的用途。
  const rendered = t2;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // bottomBorder 先占位，稍后的条件分支会根据实际输入补齐它。
  let bottomBorder;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // truncationBar 先占位，稍后的条件分支会根据实际输入补齐它。
  let truncationBar;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== effectiveMaxLines || $[5] !== effectiveMaxWidth || $[6] !== minHeight || $[7] !== minWidth || $[8] !== rendered) {
    // contentLines 集合格式化`rendered.split`，供终端渲染后续处理使用。
    const contentLines = rendered.split("\n");
    // isTruncated标记终端渲染权限确认界面 Preview Box是否启用对应路径。
    const isTruncated = contentLines.length > effectiveMaxLines;
    // truncatedLines 集合格式化`contentLines.slice`，供终端渲染后续处理使用。
    const truncatedLines = isTruncated ? contentLines.slice(0, effectiveMaxLines) : contentLines;
    // effectiveMinHeight保存`Math.min`，供终端渲染后续处理使用。
    const effectiveMinHeight = Math.min(minHeight ?? 0, effectiveMaxLines);
    // paddingNeeded保存`Math.max`，供终端渲染后续处理使用。
    const paddingNeeded = Math.max(0, effectiveMinHeight - truncatedLines.length - (isTruncated ? 1 : 0));
    // 文本行保存`Array`，供终端渲染后续处理使用。
    const lines = paddingNeeded > 0 ? [...truncatedLines, ...Array(paddingNeeded).fill("")] : truncatedLines;
    // contentWidth保存`Math.max`，供终端渲染后续处理使用。
    const contentWidth = Math.max(minWidth, ...lines.map(_temp));
    // boxWidth保存`Math.min`，供终端渲染后续处理使用。
    const boxWidth = Math.min(contentWidth + 4, effectiveMaxWidth);
    // innerWidth 命名 `boxWidth - 4`，让后续代码直接表达这个值的用途。
    const innerWidth = boxWidth - 4;
    // t6 暂存 `BOX_CHARS.horizontal.repeat(boxWidth - 2)` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== boxWidth) {
      // t6 暂存 `BOX_CHARS.horizontal.repeat(boxWidth - 2)` 生成的渲染片段，后续返回路径直接复用。
      t6 = BOX_CHARS.horizontal.repeat(boxWidth - 2);
      // $[15] 缓存 `boxWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = boxWidth;
      // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[16];
    }
    // topBorder保存``${BOX_CHARS.topLeft}${t6}${BOX_CHARS.topRight}``，作为后续固定文本处理的输入。
    const topBorder = `${BOX_CHARS.topLeft}${t6}${BOX_CHARS.topRight}`;
    // t7 暂存 `BOX_CHARS.horizontal.repeat(boxWidth - 2)` 的派生结果，便于缓存命中时直接复用。
    let t7;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== boxWidth) {
      // t7 暂存 `BOX_CHARS.horizontal.repeat(boxWidth - 2)` 生成的渲染片段，后续返回路径直接复用。
      t7 = BOX_CHARS.horizontal.repeat(boxWidth - 2);
      // $[17] 缓存 `boxWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = boxWidth;
      // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t7;
    } else {
      // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t7 = $[18];
    }
    // bottomBorder更新为 ``${BOX_CHARS.bottomLeft}${t7}${BOX_CHARS.bottomRight}``，确保权限确认界面后续读取最新状态。
    bottomBorder = `${BOX_CHARS.bottomLeft}${t7}${BOX_CHARS.bottomRight}`;
    // truncationBar更新为 `isTruncated ? (() => {`，确保权限确认界面后续读取最新状态。
    truncationBar = isTruncated ? (() => {
      // hiddenCount 数量记录 `contentLines.length - effectiveMaxLines` 是否成立，下一步按该结果分支。
      const hiddenCount = contentLines.length - effectiveMaxLines;
      // label保存`horizontal.repeat`，供终端渲染后续处理使用。
      const label = `${BOX_CHARS.horizontal.repeat(3)} \u2702 ${BOX_CHARS.horizontal.repeat(3)} ${hiddenCount} lines hidden `;
      // labelWidth保存`stringWidth`，供终端渲染后续处理使用。
      const labelWidth = stringWidth(label);
      // fillWidth保存`Math.max`，供终端渲染后续处理使用。
      const fillWidth = Math.max(0, boxWidth - 2 - labelWidth);
      // 返回 ``${BOX_CHARS.teeLeft}${label}${BOX_CHARS.horizontal.repeat(fillWidth)}$...`，作为终端渲染这次计算的结果。
      return `${BOX_CHARS.teeLeft}${label}${BOX_CHARS.horizontal.repeat(fillWidth)}${BOX_CHARS.teeRight}`;
    })() : null;
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t3 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t3 = "column";
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== topBorder) {
      // t4 暂存 `<Text dimColor={true}>{topBorder}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text dimColor={true}>{topBorder}</Text>;
      // $[19] 缓存 `topBorder`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = topBorder;
      // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[20];
    }
    // t8 暂存 `(line_0, index) => {` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[21] !== innerWidth) {
      // t8 暂存 `(line_0, index) => {` 生成的渲染片段，后续返回路径直接复用。
      t8 = (line_0, index) => {
        // lineWidth保存`stringWidth`，供终端渲染后续处理使用。
        const lineWidth = stringWidth(line_0);
        // displayLine格式化`sliceAnsi`，供终端渲染后续处理使用。
        const displayLine = lineWidth > innerWidth ? sliceAnsi(line_0, 0, innerWidth) : line_0;
        // padding保存`repeat`，供终端渲染后续处理使用。
        const padding = " ".repeat(Math.max(0, innerWidth - stringWidth(displayLine)));
        // 返回 `<Box key={index} flexDirection="row"><Text dimColor={true}>{BOX_CHARS.v...`，作为终端渲染这次计算的结果。
        return <Box key={index} flexDirection="row"><Text dimColor={true}>{BOX_CHARS.vertical} </Text><Ansi>{displayLine}</Ansi><Text dimColor={true}>{padding} {BOX_CHARS.vertical}</Text></Box>;
      };
      // $[21] 缓存 `innerWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = innerWidth;
      // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[22];
    }
    // t5 暂存 `lines.map(t8)` 生成的渲染片段，后续返回路径直接复用。
    t5 = lines.map(t8);
    // $[4] 缓存 `effectiveMaxLines`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = effectiveMaxLines;
    // $[5] 缓存 `effectiveMaxWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = effectiveMaxWidth;
    // $[6] 缓存 `minHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = minHeight;
    // $[7] 缓存 `minWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = minWidth;
    // $[8] 缓存 `rendered`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = rendered;
    // $[9] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = T0;
    // $[10] 缓存 `bottomBorder`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = bottomBorder;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `truncationBar`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = truncationBar;
  } else {
    // T0 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[9];
    // bottomBorder更新为 `$[10]`，确保权限确认界面后续读取最新状态。
    bottomBorder = $[10];
    // t3 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[11];
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
    // truncationBar更新为 `$[14]`，确保权限确认界面后续读取最新状态。
    truncationBar = $[14];
  }
  // t6 暂存 `truncationBar && <Text color="warning">{truncationBar}</T...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== truncationBar) {
    // t6 暂存 `truncationBar && <Text color="warning">{truncationBar}</T...` 生成的渲染片段，后续返回路径直接复用。
    t6 = truncationBar && <Text color="warning">{truncationBar}</Text>;
    // $[23] 缓存 `truncationBar`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = truncationBar;
    // $[24] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[24];
  }
  // t7 暂存 `<Text dimColor={true}>{bottomBorder}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== bottomBorder) {
    // t7 暂存 `<Text dimColor={true}>{bottomBorder}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text dimColor={true}>{bottomBorder}</Text>;
    // $[25] 缓存 `bottomBorder`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = bottomBorder;
    // $[26] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[26];
  }
  // t8 暂存 `<T0 flexDirection={t3}>{t4}{t5}{t6}{t7}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== T0 || $[28] !== t3 || $[29] !== t4 || $[30] !== t5 || $[31] !== t6 || $[32] !== t7) {
    // t8 暂存 `<T0 flexDirection={t3}>{t4}{t5}{t6}{t7}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <T0 flexDirection={t3}>{t4}{t5}{t6}{t7}</T0>;
    // $[27] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = T0;
    // $[28] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t3;
    // $[29] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t4;
    // $[30] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t5;
    // $[31] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t6;
    // $[32] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t7;
    // $[33] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[33];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(line) {
  // 返回 `stringWidth(line)`，作为终端渲染这次计算的结果。
  return stringWidth(line);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlN1c3BlbnNlIiwidXNlIiwidXNlTWVtbyIsInVzZVNldHRpbmdzIiwidXNlVGVybWluYWxTaXplIiwic3RyaW5nV2lkdGgiLCJBbnNpIiwiQm94IiwiVGV4dCIsInVzZVRoZW1lIiwiQ2xpSGlnaGxpZ2h0IiwiZ2V0Q2xpSGlnaGxpZ2h0UHJvbWlzZSIsImFwcGx5TWFya2Rvd24iLCJzbGljZUFuc2kiLCJQcmV2aWV3Qm94UHJvcHMiLCJjb250ZW50IiwibWF4TGluZXMiLCJtaW5IZWlnaHQiLCJtaW5XaWR0aCIsIm1heFdpZHRoIiwiQk9YX0NIQVJTIiwidG9wTGVmdCIsInRvcFJpZ2h0IiwiYm90dG9tTGVmdCIsImJvdHRvbVJpZ2h0IiwiaG9yaXpvbnRhbCIsInZlcnRpY2FsIiwidGVlTGVmdCIsInRlZVJpZ2h0IiwiUHJldmlld0JveCIsInByb3BzIiwiJCIsIl9jIiwic2V0dGluZ3MiLCJzeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCIsInQwIiwiUHJldmlld0JveFdpdGhIaWdobGlnaHQiLCJTeW1ib2wiLCJmb3IiLCJoaWdobGlnaHQiLCJ0MSIsIlByZXZpZXdCb3hCb2R5IiwidW5kZWZpbmVkIiwiY29sdW1ucyIsInRlcm1pbmFsV2lkdGgiLCJ0aGVtZSIsImVmZmVjdGl2ZU1heFdpZHRoIiwiZWZmZWN0aXZlTWF4TGluZXMiLCJ0MiIsInJlbmRlcmVkIiwiVDAiLCJib3R0b21Cb3JkZXIiLCJ0MyIsInQ0IiwidDUiLCJ0cnVuY2F0aW9uQmFyIiwiY29udGVudExpbmVzIiwic3BsaXQiLCJpc1RydW5jYXRlZCIsImxlbmd0aCIsInRydW5jYXRlZExpbmVzIiwic2xpY2UiLCJlZmZlY3RpdmVNaW5IZWlnaHQiLCJNYXRoIiwibWluIiwicGFkZGluZ05lZWRlZCIsIm1heCIsImxpbmVzIiwiQXJyYXkiLCJmaWxsIiwiY29udGVudFdpZHRoIiwibWFwIiwiX3RlbXAiLCJib3hXaWR0aCIsImlubmVyV2lkdGgiLCJ0NiIsInJlcGVhdCIsInRvcEJvcmRlciIsInQ3IiwiaGlkZGVuQ291bnQiLCJsYWJlbCIsImxhYmVsV2lkdGgiLCJmaWxsV2lkdGgiLCJ0OCIsImxpbmVfMCIsImluZGV4IiwibGluZVdpZHRoIiwibGluZSIsImRpc3BsYXlMaW5lIiwicGFkZGluZyJdLCJzb3VyY2VzIjpbIlByZXZpZXdCb3gudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyBTdXNwZW5zZSwgdXNlLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VTZXR0aW5ncyB9IGZyb20gJy4uLy4uLy4uL2hvb2tzL3VzZVNldHRpbmdzLmpzJ1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vLi4vLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgc3RyaW5nV2lkdGggfSBmcm9tICcuLi8uLi8uLi9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyBBbnNpLCBCb3gsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBDbGlIaWdobGlnaHQsXG4gIGdldENsaUhpZ2hsaWdodFByb21pc2UsXG59IGZyb20gJy4uLy4uLy4uL3V0aWxzL2NsaUhpZ2hsaWdodC5qcydcbmltcG9ydCB7IGFwcGx5TWFya2Rvd24gfSBmcm9tICcuLi8uLi8uLi91dGlscy9tYXJrZG93bi5qcydcbmltcG9ydCBzbGljZUFuc2kgZnJvbSAnLi4vLi4vLi4vdXRpbHMvc2xpY2VBbnNpLmpzJ1xuXG50eXBlIFByZXZpZXdCb3hQcm9wcyA9IHtcbiAgLyoqIFRoZSBwcmV2aWV3IGNvbnRlbnQgdG8gZGlzcGxheS4gTWFya2Rvd24gaXMgcmVuZGVyZWQgd2l0aCBzeW50YXggaGlnaGxpZ2h0aW5nXG4gICAqIGZvciBjb2RlIGJsb2NrcyAoYGBgdHMsIGBgYHB5LCBldGMuKS4gQWxzbyBzdXBwb3J0cyBwbGFpbiBtdWx0aS1saW5lIHRleHQuICovXG4gIGNvbnRlbnQ6IHN0cmluZ1xuICAvKiogTWF4aW11bSBudW1iZXIgb2YgbGluZXMgdG8gZGlzcGxheSBiZWZvcmUgdHJ1bmNhdGluZy4gQGRlZmF1bHQgMjAgKi9cbiAgbWF4TGluZXM/OiBudW1iZXJcbiAgLyoqIE1pbmltdW0gaGVpZ2h0IChpbiBsaW5lcykgZm9yIHRoZSBwcmV2aWV3IGJveC4gQ29udGVudCB3aWxsIGJlIHBhZGRlZCBpZiBzaG9ydGVyLiAqL1xuICBtaW5IZWlnaHQ/OiBudW1iZXJcbiAgLyoqIE1pbmltdW0gd2lkdGggZm9yIHRoZSBwcmV2aWV3IGJveC4gQGRlZmF1bHQgNDAgKi9cbiAgbWluV2lkdGg/OiBudW1iZXJcbiAgLyoqIE1heGltdW0gd2lkdGggYXZhaWxhYmxlIGZvciB0aGlzIGJveCAoZS5nLiwgdGhlIGNvbnRhaW5lciB3aWR0aCkuICovXG4gIG1heFdpZHRoPzogbnVtYmVyXG59XG5cbmNvbnN0IEJPWF9DSEFSUyA9IHtcbiAgdG9wTGVmdDogJ+KUjCcsXG4gIHRvcFJpZ2h0OiAn4pSQJyxcbiAgYm90dG9tTGVmdDogJ+KUlCcsXG4gIGJvdHRvbVJpZ2h0OiAn4pSYJyxcbiAgaG9yaXpvbnRhbDogJ+KUgCcsXG4gIHZlcnRpY2FsOiAn4pSCJyxcbiAgdGVlTGVmdDogJ+KUnCcsXG4gIHRlZVJpZ2h0OiAn4pSkJyxcbn1cblxuLyoqXG4gKiBBIGJvcmRlcmVkIG1vbm9zcGFjZSBib3ggZm9yIGRpc3BsYXlpbmcgcHJldmlldyBjb250ZW50LlxuICogVHJ1bmNhdGVzIGNvbnRlbnQgdGhhdCBleGNlZWRzIG1heExpbmVzIHdpdGggYW4gaW5kaWNhdG9yLlxuICogVGhlIHBhcmVudCBjb21wb25lbnQgc2hvdWxkIHBhc3MgbWF4TGluZXMgYmFzZWQgb24gaXRzIGF2YWlsYWJsZSBoZWlnaHQgYnVkZ2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gUHJldmlld0JveChwcm9wczogUHJldmlld0JveFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc2V0dGluZ3MgPSB1c2VTZXR0aW5ncygpXG4gIGlmIChzZXR0aW5ncy5zeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCkge1xuICAgIHJldHVybiA8UHJldmlld0JveEJvZHkgey4uLnByb3BzfSBoaWdobGlnaHQ9e251bGx9IC8+XG4gIH1cbiAgcmV0dXJuIChcbiAgICA8U3VzcGVuc2UgZmFsbGJhY2s9ezxQcmV2aWV3Qm94Qm9keSB7Li4ucHJvcHN9IGhpZ2hsaWdodD17bnVsbH0gLz59PlxuICAgICAgPFByZXZpZXdCb3hXaXRoSGlnaGxpZ2h0IHsuLi5wcm9wc30gLz5cbiAgICA8L1N1c3BlbnNlPlxuICApXG59XG5cbmZ1bmN0aW9uIFByZXZpZXdCb3hXaXRoSGlnaGxpZ2h0KHByb3BzOiBQcmV2aWV3Qm94UHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBoaWdobGlnaHQgPSB1c2UoZ2V0Q2xpSGlnaGxpZ2h0UHJvbWlzZSgpKVxuICByZXR1cm4gPFByZXZpZXdCb3hCb2R5IHsuLi5wcm9wc30gaGlnaGxpZ2h0PXtoaWdobGlnaHR9IC8+XG59XG5cbmZ1bmN0aW9uIFByZXZpZXdCb3hCb2R5KHtcbiAgY29udGVudCxcbiAgbWF4TGluZXMsXG4gIG1pbkhlaWdodCxcbiAgbWluV2lkdGggPSA0MCxcbiAgbWF4V2lkdGgsXG4gIGhpZ2hsaWdodCxcbn06IFByZXZpZXdCb3hQcm9wcyAmIHsgaGlnaGxpZ2h0OiBDbGlIaWdobGlnaHQgfCBudWxsIH0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IGNvbHVtbnM6IHRlcm1pbmFsV2lkdGggfSA9IHVzZVRlcm1pbmFsU2l6ZSgpXG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IGVmZmVjdGl2ZU1heFdpZHRoID0gbWF4V2lkdGggPz8gdGVybWluYWxXaWR0aCAtIDRcblxuICAvLyBVc2UgcHJvdmlkZWQgbWF4TGluZXMsIG9yIGEgcmVhc29uYWJsZSBkZWZhdWx0XG4gIGNvbnN0IGVmZmVjdGl2ZU1heExpbmVzID0gbWF4TGluZXMgPz8gMjBcblxuICAvLyBSZW5kZXIgbWFya2Rvd24gd2l0aCBzeW50YXggaGlnaGxpZ2h0aW5nIGZvciBjb2RlIGJsb2Nrcy4gYXBwbHlNYXJrZG93blxuICAvLyByZXR1cm5zIGFuIEFOU0ktc3R5bGVkIHN0cmluZyAoYm9sZCwgY29sb3JzLCBldGMuKSB0aGF0IHdlIHNwbGl0IGludG9cbiAgLy8gbGluZXMuIHN0cmluZ1dpZHRoIGFuZCBzbGljZUFuc2kgYmVsb3cgY29ycmVjdGx5IGhhbmRsZSBBTlNJIGNvZGVzLlxuICBjb25zdCByZW5kZXJlZCA9IHVzZU1lbW8oXG4gICAgKCkgPT4gYXBwbHlNYXJrZG93bihjb250ZW50LCB0aGVtZSwgaGlnaGxpZ2h0KSxcbiAgICBbY29udGVudCwgdGhlbWUsIGhpZ2hsaWdodF0sXG4gIClcbiAgY29uc3QgY29udGVudExpbmVzID0gcmVuZGVyZWQuc3BsaXQoJ1xcbicpXG4gIGNvbnN0IGlzVHJ1bmNhdGVkID0gY29udGVudExpbmVzLmxlbmd0aCA+IGVmZmVjdGl2ZU1heExpbmVzXG5cbiAgLy8gVHJ1bmNhdGUgdG8gZWZmZWN0aXZlTWF4TGluZXNcbiAgY29uc3QgdHJ1bmNhdGVkTGluZXMgPSBpc1RydW5jYXRlZFxuICAgID8gY29udGVudExpbmVzLnNsaWNlKDAsIGVmZmVjdGl2ZU1heExpbmVzKVxuICAgIDogY29udGVudExpbmVzXG5cbiAgLy8gUGFkIGNvbnRlbnQgd2l0aCBlbXB0eSBsaW5lcyBpZiBzaG9ydGVyIHRoYW4gbWluSGVpZ2h0LCBidXQgbmV2ZXIgZXhjZWVkXG4gIC8vIHRoZSB0cnVuY2F0aW9uIGxpbWl0IOKAlCBvdGhlcndpc2UgcGFkZGluZyB1bmRvZXMgdGhlIHRydW5jYXRpb25cbiAgY29uc3QgZWZmZWN0aXZlTWluSGVpZ2h0ID0gTWF0aC5taW4obWluSGVpZ2h0ID8/IDAsIGVmZmVjdGl2ZU1heExpbmVzKVxuICBjb25zdCBwYWRkaW5nTmVlZGVkID0gTWF0aC5tYXgoXG4gICAgMCxcbiAgICBlZmZlY3RpdmVNaW5IZWlnaHQgLSB0cnVuY2F0ZWRMaW5lcy5sZW5ndGggLSAoaXNUcnVuY2F0ZWQgPyAxIDogMCksXG4gIClcbiAgY29uc3QgbGluZXMgPVxuICAgIHBhZGRpbmdOZWVkZWQgPiAwXG4gICAgICA/IFsuLi50cnVuY2F0ZWRMaW5lcywgLi4uQXJyYXk8c3RyaW5nPihwYWRkaW5nTmVlZGVkKS5maWxsKCcnKV1cbiAgICAgIDogdHJ1bmNhdGVkTGluZXNcblxuICAvLyBDYWxjdWxhdGUgY29udGVudCB3aWR0aCAobWF4IHZpc3VhbCBsaW5lIHdpZHRoLCBoYW5kbGluZyB1bmljb2RlL2Vtb2ppL0NKSylcbiAgY29uc3QgY29udGVudFdpZHRoID0gTWF0aC5tYXgoXG4gICAgbWluV2lkdGgsXG4gICAgLi4ubGluZXMubWFwKGxpbmUgPT4gc3RyaW5nV2lkdGgobGluZSkpLFxuICApXG4gIC8vIEFkZCAyIGZvciBib3JkZXIgcGFkZGluZywgY2FwIGF0IHRoZSBjb250YWluZXIgd2lkdGggdG8gcHJldmVudCBsaW5lIHdyYXBwaW5nXG4gIGNvbnN0IGJveFdpZHRoID0gTWF0aC5taW4oY29udGVudFdpZHRoICsgNCwgZWZmZWN0aXZlTWF4V2lkdGgpXG4gIGNvbnN0IGlubmVyV2lkdGggPSBib3hXaWR0aCAtIDQgLy8gQWNjb3VudCBmb3IgYm9yZGVycyBhbmQgcGFkZGluZ1xuXG4gIC8vIFJlbmRlciB0b3AgYm9yZGVyXG4gIGNvbnN0IHRvcEJvcmRlciA9IGAke0JPWF9DSEFSUy50b3BMZWZ0fSR7Qk9YX0NIQVJTLmhvcml6b250YWwucmVwZWF0KGJveFdpZHRoIC0gMil9JHtCT1hfQ0hBUlMudG9wUmlnaHR9YFxuXG4gIC8vIFJlbmRlciBib3R0b20gYm9yZGVyXG4gIGNvbnN0IGJvdHRvbUJvcmRlciA9IGAke0JPWF9DSEFSUy5ib3R0b21MZWZ0fSR7Qk9YX0NIQVJTLmhvcml6b250YWwucmVwZWF0KGJveFdpZHRoIC0gMil9JHtCT1hfQ0hBUlMuYm90dG9tUmlnaHR9YFxuXG4gIC8vIEJ1aWxkIHRoZSB0cnVuY2F0aW9uIHNlcGFyYXRvciBiYXIgKGUuZy4g4pSc4pSA4pSA4pSAIOKcgiDilIDilIDilIAgNDIgbGluZXMgaGlkZGVuIOKUgOKUgOKUgOKUgOKUgOKUgOKUpClcbiAgY29uc3QgdHJ1bmNhdGlvbkJhciA9IGlzVHJ1bmNhdGVkXG4gICAgPyAoKCkgPT4ge1xuICAgICAgICBjb25zdCBoaWRkZW5Db3VudCA9IGNvbnRlbnRMaW5lcy5sZW5ndGggLSBlZmZlY3RpdmVNYXhMaW5lc1xuICAgICAgICBjb25zdCBsYWJlbCA9IGAke0JPWF9DSEFSUy5ob3Jpem9udGFsLnJlcGVhdCgzKX0gXFx1MjcwMiAke0JPWF9DSEFSUy5ob3Jpem9udGFsLnJlcGVhdCgzKX0gJHtoaWRkZW5Db3VudH0gbGluZXMgaGlkZGVuIGBcbiAgICAgICAgY29uc3QgbGFiZWxXaWR0aCA9IHN0cmluZ1dpZHRoKGxhYmVsKVxuICAgICAgICBjb25zdCBmaWxsV2lkdGggPSBNYXRoLm1heCgwLCBib3hXaWR0aCAtIDIgLSBsYWJlbFdpZHRoKVxuICAgICAgICByZXR1cm4gYCR7Qk9YX0NIQVJTLnRlZUxlZnR9JHtsYWJlbH0ke0JPWF9DSEFSUy5ob3Jpem9udGFsLnJlcGVhdChmaWxsV2lkdGgpfSR7Qk9YX0NIQVJTLnRlZVJpZ2h0fWBcbiAgICAgIH0pKClcbiAgICA6IG51bGxcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPFRleHQgZGltQ29sb3I+e3RvcEJvcmRlcn08L1RleHQ+XG5cbiAgICAgIHtsaW5lcy5tYXAoKGxpbmUsIGluZGV4KSA9PiB7XG4gICAgICAgIC8vIFBhZCBvciB0cnVuY2F0ZSBsaW5lIHRvIGZpdCBpbm5lciB3aWR0aCAodXNpbmcgdmlzdWFsIHdpZHRoIGZvciB1bmljb2RlL2Vtb2ppL0NKSykuXG4gICAgICAgIC8vIHNsaWNlQW5zaSBoYW5kbGVzIEFOU0kgZXNjYXBlIGNvZGVzIGNvcnJlY3RseTsgc3RyaW5nV2lkdGggc3RyaXBzIHRoZW0gYmVmb3JlIG1lYXN1cmluZy5cbiAgICAgICAgY29uc3QgbGluZVdpZHRoID0gc3RyaW5nV2lkdGgobGluZSlcbiAgICAgICAgY29uc3QgZGlzcGxheUxpbmUgPVxuICAgICAgICAgIGxpbmVXaWR0aCA+IGlubmVyV2lkdGggPyBzbGljZUFuc2kobGluZSwgMCwgaW5uZXJXaWR0aCkgOiBsaW5lXG4gICAgICAgIGNvbnN0IHBhZGRpbmcgPSAnICcucmVwZWF0KFxuICAgICAgICAgIE1hdGgubWF4KDAsIGlubmVyV2lkdGggLSBzdHJpbmdXaWR0aChkaXNwbGF5TGluZSkpLFxuICAgICAgICApXG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICA8Qm94IGtleT17aW5kZXh9IGZsZXhEaXJlY3Rpb249XCJyb3dcIj5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPntCT1hfQ0hBUlMudmVydGljYWx9IDwvVGV4dD5cbiAgICAgICAgICAgIDxBbnNpPntkaXNwbGF5TGluZX08L0Fuc2k+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAge3BhZGRpbmd9IHtCT1hfQ0hBUlMudmVydGljYWx9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgIClcbiAgICAgIH0pfVxuXG4gICAgICB7dHJ1bmNhdGlvbkJhciAmJiA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj57dHJ1bmNhdGlvbkJhcn08L1RleHQ+fVxuXG4gICAgICA8VGV4dCBkaW1Db2xvcj57Ym90dG9tQm9yZGVyfTwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxRQUFRLEVBQUVDLEdBQUcsRUFBRUMsT0FBTyxRQUFRLE9BQU87QUFDckQsU0FBU0MsV0FBVyxRQUFRLCtCQUErQjtBQUMzRCxTQUFTQyxlQUFlLFFBQVEsbUNBQW1DO0FBQ25FLFNBQVNDLFdBQVcsUUFBUSw2QkFBNkI7QUFDekQsU0FB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