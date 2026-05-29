// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { StructuredPatchHunk } 来自 diff，用于校准终端渲染的数据契约。
import type { StructuredPatchHunk } from 'diff';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 memo，将 react 中已经封装好的能力接到本文件流程里。
import { memo } from 'react';
// 引入 useSettings，将 ../hooks/useSettings.js 中已经封装好的能力接到本文件流程里。
import { useSettings } from '../hooks/useSettings.js';
// 引入 Box、NoSelect、RawAnsi、useTheme，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, NoSelect, RawAnsi, useTheme } from '../ink.js';
// 复用 isFullscreenEnvEnabled 工具函数，把通用处理留在 ../utils/fullscreen.js 中维护。
import { isFullscreenEnvEnabled } from '../utils/fullscreen.js';
// 复用 sliceAnsi 工具函数，把通用处理留在 ../utils/sliceAnsi.js 中维护。
import sliceAnsi from '../utils/sliceAnsi.js';
// 引入 expectColorDiff，将 ./StructuredDiff/colorDiff.js 中已经封装好的能力接到本文件流程里。
import { expectColorDiff } from './StructuredDiff/colorDiff.js';
// 引入 StructuredDiffFallback，将 ./StructuredDiff/Fallback.js 中已经封装好的能力接到本文件流程里。
import { StructuredDiffFallback } from './StructuredDiff/Fallback.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  patch: StructuredPatchHunk;
  dim: boolean;
  filePath: string; // File path for language detection
  firstLine: string | null; // First line of file for shebang detection
  fileContent?: string; // Full file content for syntax context (multiline strings, etc.)
  width: number;
  skipHighlighting?: boolean; // Skip syntax highlighting
};

// REPL.tsx renders <Messages> at two disjoint tree positions (transcript
// early-return vs prompt-mode nested in FullscreenLayout), so ctrl+o
// unmounts/remounts the entire message tree and React's memo cache is lost.
// Keep both the NAPI result AND the pre-split gutter/content columns at
// module level so the only work on remount is a WeakMap lookup plus two
// <ink-raw-ansi> leaves — not a fresh syntax highlight, nor N sliceAnsi
// calls + 6N Yoga nodes.
//
// PR #21439 (fullscreen default-on) made gutterWidth>0 the default path,
// reactivating the per-line <DiffLine> branch that PR #20378 had bypassed.
// Caching the split here restores the O(1)-leaves-per-diff invariant.
// CachedRender 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedRender = {
  lines: string[];
  // Two RawAnsi columns replace what was N DiffLine rows. sliceAnsi work
  // moves from per-remount to cold-cache-only; parseToSpans is eliminated
  // entirely (RawAnsi bypasses Ansi parsing).
  gutterWidth: number;
  gutters: string[] | null;
  contents: string[] | null;
};
// RENDER_CACHE 缓存构建`new WeakMap<StructuredPatchHunk, Map<string, CachedRender...` 整理出中间结果，供终端 UI Structured Diff后续步骤使用。
const RENDER_CACHE = new WeakMap<StructuredPatchHunk, Map<string, CachedRender>>();

// Gutter width matches the Rust module's layout: marker (1) + space +
// right-aligned line number (max_digits) + space. Depends only on patch
// identity (the WeakMap key), so it's cacheable alongside the NAPI output.
// computeGutterWidth 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function computeGutterWidth(patch: StructuredPatchHunk): number {
  // maxLineNumber保存`Math.max`，供终端渲染后续处理使用。
  const maxLineNumber = Math.max(patch.oldStart + patch.oldLines - 1, patch.newStart + patch.newLines - 1, 1);
  // 返回 `maxLineNumber.toString().length + 3; // marker + 2 padding spaces`，作为终端渲染这次计算的结果。
  return maxLineNumber.toString().length + 3; // marker + 2 padding spaces
}
// renderColorDiff 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderColorDiff(patch: StructuredPatchHunk, firstLine: string | null, filePath: string, fileContent: string | null, theme: string, width: number, dim: boolean, splitGutter: boolean): CachedRender | null {
  // ColorDiff保存`expectColorDiff`，供终端渲染后续处理使用。
  const ColorDiff = expectColorDiff();
  // ColorDiff缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!ColorDiff) return null;

  // Defensive: if the gutter would eat the whole render width (narrow
  // terminal), skip the split. Rust already wraps to `width` so the
  // single-column output stays correct; we just lose noSelect. Without
  // this, sliceAnsi(line, gutterWidth) would return empty content and
  // RawAnsi(width<=0) is untested.
  // rawGutterWidth保存`computeGutterWidth`，供终端渲染后续处理使用。
  const rawGutterWidth = splitGutter ? computeGutterWidth(patch) : 0;
  // gutterWidth标记终端 UI Structured Diff是否启用对应路径。
  const gutterWidth = rawGutterWidth > 0 && rawGutterWidth < width ? rawGutterWidth : 0;
  // key 命名 ``${theme}|${width}|${dim ? 1 : 0}|${gutterWidth}|${firstL...`，让后续代码直接表达这个值的用途。
  const key = `${theme}|${width}|${dim ? 1 : 0}|${gutterWidth}|${firstLine ?? ''}|${filePath}`;
  // perHunk读取`RENDER_CACHE.get`，供终端渲染后续处理使用。
  let perHunk = RENDER_CACHE.get(patch);
  // hit读取`get`，供终端渲染后续处理使用。
  const hit = perHunk?.get(key);
  // 满足 `hit` 时，终端渲染执行该分支。
  if (hit) return hit;
  // 文本行保存`ColorDiff`，供终端渲染后续处理使用。
  const lines = new ColorDiff(patch, firstLine, filePath, fileContent).render(theme, width, dim);
  // 满足 `lines === null` 时，终端渲染执行该分支。
  if (lines === null) return null;

  // Pre-split the gutter column once (cold-cache). sliceAnsi preserves
  // styles across the cut; the Rust module already pads the gutter to
  // gutterWidth so the narrow RawAnsi column's width matches its cells.
  // gutters 集合保存`null`，作为后续空值处理的输入。
  let gutters: string[] | null = null;
  // contents 集合 命名 `null`，让后续代码直接表达这个值的用途。
  let contents: string[] | null = null;
  // 满足 `gutterWidth > 0` 时，终端渲染执行该分支。
  if (gutterWidth > 0) {
    // gutters 集合更新为 `lines.map(l => sliceAnsi(l, 0, gutterWidth))`，确保终端 UI后续读取最新状态。
    gutters = lines.map(l => sliceAnsi(l, 0, gutterWidth));
    // contents 集合更新为 `lines.map(l => sliceAnsi(l, gutterWidth))`，确保终端 UI后续读取最新状态。
    contents = lines.map(l => sliceAnsi(l, gutterWidth));
  }
  // entry 集中保存终端 UI 组件 Structured Diff要一起传递的字段。
  const entry: CachedRender = {
    lines,
    gutterWidth,
    gutters,
    contents
  };
  // perHunk缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!perHunk) {
    // perHunk更新为 `new Map()`，确保终端 UI后续读取最新状态。
    perHunk = new Map();
    // RENDER_CACHE.set 写入新的状态值，使终端渲染后续读取保持一致。
    RENDER_CACHE.set(patch, perHunk);
  }
  // Cap the inner map: width is part of the key, so terminal resize while a
  // diff is visible accumulates a full render copy per distinct width. Four
  // variants (two widths × dim on/off) covers the steady state; beyond that
  // the user is actively resizing and old widths are stale.
  // 满足 `perHunk.size >= 4) perHunk.clear(` 时，终端渲染执行该分支。
  if (perHunk.size >= 4) perHunk.clear();
  // perHunk.set 写入新的状态值，使终端渲染后续读取保持一致。
  perHunk.set(key, entry);
  // 返回 `entry`，作为终端渲染这次计算的结果。
  return entry;
}
// StructuredDiff保存`memo`，供终端渲染后续处理使用。
export const StructuredDiff = memo(function StructuredDiff(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    patch,
    dim,
    filePath,
    firstLine,
    fileContent,
    width,
    skipHighlighting: t1
  } = t0;
  // skipHighlighting标记终端 UI Structured Diff是否启用对应路径。
  const skipHighlighting = t1 === undefined ? false : t1;
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Structured Diff分别处理这些返回值。
  const [theme] = useTheme();
  // settings 集合保存`useSettings`，供终端渲染后续处理使用。
  const settings = useSettings();
  // syntaxHighlightingDisabled保存`settings.syntaxHighlightingDisabled ?? false`，供终端 UI Structured Diff后续判断或输出使用。
  const syntaxHighlightingDisabled = settings.syntaxHighlightingDisabled ?? false;
  // safeWidth保存`Math.max`，供终端渲染后续处理使用。
  const safeWidth = Math.max(1, Math.floor(width));
  // t2 暂存 `skipHighlighting || syntaxHighlightingDisabled ? null : r...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== dim || $[1] !== fileContent || $[2] !== filePath || $[3] !== firstLine || $[4] !== patch || $[5] !== safeWidth || $[6] !== skipHighlighting || $[7] !== syntaxHighlightingDisabled || $[8] !== theme) {
    // splitGutter保存`isFullscreenEnvEnabled`，供终端渲染后续处理使用。
    const splitGutter = isFullscreenEnvEnabled();
    // t2 暂存 `skipHighlighting || syntaxHighlightingDisabled ? null : r...` 生成的渲染片段，后续返回路径直接复用。
    t2 = skipHighlighting || syntaxHighlightingDisabled ? null : renderColorDiff(patch, firstLine, filePath, fileContent ?? null, theme, safeWidth, dim, splitGutter);
    // $[0] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = dim;
    // $[1] 缓存 `fileContent`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = fileContent;
    // $[2] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = filePath;
    // $[3] 缓存 `firstLine`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = firstLine;
    // $[4] 缓存 `patch`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = patch;
    // $[5] 缓存 `safeWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = safeWidth;
    // $[6] 缓存 `skipHighlighting`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = skipHighlighting;
    // $[7] 缓存 `syntaxHighlightingDisabled`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = syntaxHighlightingDisabled;
    // $[8] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = theme;
    // $[9] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[9];
  }
  // cached 缓存 命名 `t2`，让后续代码直接表达这个值的用途。
  const cached = t2;
  // cached 缓存缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!cached) {
    // t3 暂存 `<Box><StructuredDiffFallback patch={patch} dim={dim} widt...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[10] !== dim || $[11] !== patch || $[12] !== width) {
      // t3 暂存 `<Box><StructuredDiffFallback patch={patch} dim={dim} widt...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Box><StructuredDiffFallback patch={patch} dim={dim} width={width} /></Box>;
      // $[10] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = dim;
      // $[11] 缓存 `patch`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = patch;
      // $[12] 缓存 `width`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = width;
      // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[13];
    }
    // 返回 `t3`，作为终端渲染这次计算的结果。
    return t3;
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    lines,
    gutterWidth,
    gutters,
    contents
  } = cached;
  // 只有 `gutterWidth > 0 && gutters && contents` 满足时，终端渲染才执行该分支。
  if (gutterWidth > 0 && gutters && contents) {
    // t3 暂存 `<NoSelect fromLeftEdge={true}><RawAnsi lines={gutters} wi...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[14] !== gutterWidth || $[15] !== gutters) {
      // t3 暂存 `<NoSelect fromLeftEdge={true}><RawAnsi lines={gutters} wi...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <NoSelect fromLeftEdge={true}><RawAnsi lines={gutters} width={gutterWidth} /></NoSelect>;
      // $[14] 缓存 `gutterWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = gutterWidth;
      // $[15] 缓存 `gutters`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = gutters;
      // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[16];
    }
    // t4保存`safeWidth - gutterWidth`，供后续判断或组装使用。
    const t4 = safeWidth - gutterWidth;
    // t5 暂存 `<RawAnsi lines={contents} width={t4} />` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[17] !== contents || $[18] !== t4) {
      // t5 暂存 `<RawAnsi lines={contents} width={t4} />` 生成的渲染片段，后续返回路径直接复用。
      t5 = <RawAnsi lines={contents} width={t4} />;
      // $[17] 缓存 `contents`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = contents;
      // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t4;
      // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[19];
    }
    // t6 暂存 `<Box flexDirection="row">{t3}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t6;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[20] !== t3 || $[21] !== t5) {
      // t6 暂存 `<Box flexDirection="row">{t3}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Box flexDirection="row">{t3}{t5}</Box>;
      // $[20] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t3;
      // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t5;
      // $[22] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[22];
    }
    // 返回 `t6`，作为终端渲染这次计算的结果。
    return t6;
  }
  // t3 暂存 `<Box><RawAnsi lines={lines} width={safeWidth} /></Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== lines || $[24] !== safeWidth) {
    // t3 暂存 `<Box><RawAnsi lines={lines} width={safeWidth} /></Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box><RawAnsi lines={lines} width={safeWidth} /></Box>;
    // $[23] 缓存 `lines`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = lines;
    // $[24] 缓存 `safeWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = safeWidth;
    // $[25] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[25];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTdHJ1Y3R1cmVkUGF0Y2hIdW5rIiwiUmVhY3QiLCJtZW1vIiwidXNlU2V0dGluZ3MiLCJCb3giLCJOb1NlbGVjdCIsIlJhd0Fuc2kiLCJ1c2VUaGVtZSIsImlzRnVsbHNjcmVlbkVudkVuYWJsZWQiLCJzbGljZUFuc2kiLCJleHBlY3RDb2xvckRpZmYiLCJTdHJ1Y3R1cmVkRGlmZkZhbGxiYWNrIiwiUHJvcHMiLCJwYXRjaCIsImRpbSIsImZpbGVQYXRoIiwiZmlyc3RMaW5lIiwiZmlsZUNvbnRlbnQiLCJ3aWR0aCIsInNraXBIaWdobGlnaHRpbmciLCJDYWNoZWRSZW5kZXIiLCJsaW5lcyIsImd1dHRlcldpZHRoIiwiZ3V0dGVycyIsImNvbnRlbnRzIiwiUkVOREVSX0NBQ0hFIiwiV2Vha01hcCIsIk1hcCIsImNvbXB1dGVHdXR0ZXJXaWR0aCIsIm1heExpbmVOdW1iZXIiLCJNYXRoIiwibWF4Iiwib2xkU3RhcnQiLCJvbGRMaW5lcyIsIm5ld1N0YXJ0IiwibmV3TGluZXMiLCJ0b1N0cmluZyIsImxlbmd0aCIsInJlbmRlckNvbG9yRGlmZiIsInRoZW1lIiwic3BsaXRHdXR0ZXIiLCJDb2xvckRpZmYiLCJyYXdHdXR0ZXJXaWR0aCIsImtleSIsInBlckh1bmsiLCJnZXQiLCJoaXQiLCJyZW5kZXIiLCJtYXAiLCJsIiwiZW50cnkiLCJzZXQiLCJzaXplIiwiY2xlYXIiLCJTdHJ1Y3R1cmVkRGlmZiIsInQwIiwiJCIsIl9jIiwidDEiLCJ1bmRlZmluZWQiLCJzZXR0aW5ncyIsInN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkIiwic2FmZVdpZHRoIiwiZmxvb3IiLCJ0MiIsImNhY2hlZCIsInQzIiwidDQiLCJ0NSIsInQ2Il0sInNvdXJjZXMiOlsiU3RydWN0dXJlZERpZmYudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU3RydWN0dXJlZFBhdGNoSHVuayB9IGZyb20gJ2RpZmYnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IG1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVNldHRpbmdzIH0gZnJvbSAnLi4vaG9va3MvdXNlU2V0dGluZ3MuanMnXG5pbXBvcnQgeyBCb3gsIE5vU2VsZWN0LCBSYXdBbnNpLCB1c2VUaGVtZSB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGlzRnVsbHNjcmVlbkVudkVuYWJsZWQgfSBmcm9tICcuLi91dGlscy9mdWxsc2NyZWVuLmpzJ1xuaW1wb3J0IHNsaWNlQW5zaSBmcm9tICcuLi91dGlscy9zbGljZUFuc2kuanMnXG5pbXBvcnQgeyBleHBlY3RDb2xvckRpZmYgfSBmcm9tICcuL1N0cnVjdHVyZWREaWZmL2NvbG9yRGlmZi5qcydcbmltcG9ydCB7IFN0cnVjdHVyZWREaWZmRmFsbGJhY2sgfSBmcm9tICcuL1N0cnVjdHVyZWREaWZmL0ZhbGxiYWNrLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBwYXRjaDogU3RydWN0dXJlZFBhdGNoSHVua1xuICBkaW06IGJvb2xlYW5cbiAgZmlsZVBhdGg6IHN0cmluZyAvLyBGaWxlIHBhdGggZm9yIGxhbmd1YWdlIGRldGVjdGlvblxuICBmaXJzdExpbmU6IHN0cmluZyB8IG51bGwgLy8gRmlyc3QgbGluZSBvZiBmaWxlIGZvciBzaGViYW5nIGRldGVjdGlvblxuICBmaWxlQ29udGVudD86IHN0cmluZyAvLyBGdWxsIGZpbGUgY29udGVudCBmb3Igc3ludGF4IGNvbnRleHQgKG11bHRpbGluZSBzdHJpbmdzLCBldGMuKVxuICB3aWR0aDogbnVtYmVyXG4gIHNraXBIaWdobGlnaHRpbmc/OiBib29sZWFuIC8vIFNraXAgc3ludGF4IGhpZ2hsaWdodGluZ1xufVxuXG4vLyBSRVBMLnRzeCByZW5kZXJzIDxNZXNzYWdlcz4gYXQgdHdvIGRpc2pvaW50IHRyZWUgcG9zaXRpb25zICh0cmFuc2NyaXB0XG4vLyBlYXJseS1yZXR1cm4gdnMgcHJvbXB0LW1vZGUgbmVzdGVkIGluIEZ1bGxzY3JlZW5MYXlvdXQpLCBzbyBjdHJsK29cbi8vIHVubW91bnRzL3JlbW91bnRzIHRoZSBlbnRpcmUgbWVzc2FnZSB0cmVlIGFuZCBSZWFjdCdzIG1lbW8gY2FjaGUgaXMgbG9zdC5cbi8vIEtlZXAgYm90aCB0aGUgTkFQSSByZXN1bHQgQU5EIHRoZSBwcmUtc3BsaXQgZ3V0dGVyL2NvbnRlbnQgY29sdW1ucyBhdFxuLy8gbW9kdWxlIGxldmVsIHNvIHRoZSBvbmx5IHdvcmsgb24gcmVtb3VudCBpcyBhIFdlYWtNYXAgbG9va3VwIHBsdXMgdHdvXG4vLyA8aW5rLXJhdy1hbnNpPiBsZWF2ZXMg4oCUIG5vdCBhIGZyZXNoIHN5bnRheCBoaWdobGlnaHQsIG5vciBOIHNsaWNlQW5zaVxuLy8gY2FsbHMgKyA2TiBZb2dhIG5vZGVzLlxuLy9cbi8vIFBSICMyMTQzOSAoZnVsbHNjcmVlbiBkZWZhdWx0LW9uKSBtYWRlIGd1dHRlcldpZHRoPjAgdGhlIGRlZmF1bHQgcGF0aCxcbi8vIHJlYWN0aXZhdGluZyB0aGUgcGVyLWxpbmUgPERpZmZMaW5lPiBicmFuY2ggdGhhdCBQUiAjMjAzNzggaGFkIGJ5cGFzc2VkLlxuLy8gQ2FjaGluZyB0aGUgc3BsaXQgaGVyZSByZXN0b3JlcyB0aGUgTygxKS1sZWF2ZXMtcGVyLWRpZmYgaW52YXJpYW50LlxudHlwZSBDYWNoZWRSZW5kZXIgPSB7XG4gIGxpbmVzOiBzdHJpbmdbXVxuICAvLyBUd28gUmF3QW5zaSBjb2x1bW5zIHJlcGxhY2Ugd2hhdCB3YXMgTiBEaWZmTGluZSByb3dzLiBzbGljZUFuc2kgd29ya1xuICAvLyBtb3ZlcyBmcm9tIHBlci1yZW1vdW50IHRvIGNvbGQtY2FjaGUtb25seTsgcGFyc2VUb1NwYW5zIGlzIGVsaW1pbmF0ZWRcbiAgLy8gZW50aXJlbHkgKFJhd0Fuc2kgYnlwYXNzZXMgQW5zaSBwYXJzaW5nKS5cbiAgZ3V0dGVyV2lkdGg6IG51bWJlclxuICBndXR0ZXJzOiBzdHJpbmdbXSB8IG51bGxcbiAgY29udGVudHM6IHN0cmluZ1tdIHwgbnVsbFxufVxuY29uc3QgUkVOREVSX0NBQ0hFID0gbmV3IFdlYWtNYXA8XG4gIFN0cnVjdHVyZWRQYXRjaEh1bmssXG4gIE1hcDxzdHJpbmcsIENhY2hlZFJlbmRlcj5cbj4oKVxuXG4vLyBHdXR0ZXIgd2lkdGggbWF0Y2hlcyB0aGUgUnVzdCBtb2R1bGUncyBsYXlvdXQ6IG1hcmtlciAoMSkgKyBzcGFjZSArXG4vLyByaWdodC1hbGlnbmVkIGxpbmUgbnVtYmVyIChtYXhfZGlnaXRzKSArIHNwYWNlLiBEZXBlbmRzIG9ubHkgb24gcGF0Y2hcbi8vIGlkZW50aXR5ICh0aGUgV2Vha01hcCBrZXkpLCBzbyBpdCdzIGNhY2hlYWJsZSBhbG9uZ3NpZGUgdGhlIE5BUEkgb3V0cHV0LlxuZnVuY3Rpb24gY29tcHV0ZUd1dHRlcldpZHRoKHBhdGNoOiBTdHJ1Y3R1cmVkUGF0Y2hIdW5rKTogbnVtYmVyIHtcbiAgY29uc3QgbWF4TGluZU51bWJlciA9IE1hdGgubWF4KFxuICAgIHBhdGNoLm9sZFN0YXJ0ICsgcGF0Y2gub2xkTGluZXMgLSAxLFxuICAgIHBhdGNoLm5ld1N0YXJ0ICsgcGF0Y2gubmV3TGluZXMgLSAxLFxuICAgIDEsXG4gIClcbiAgcmV0dXJuIG1heExpbmVOdW1iZXIudG9TdHJpbmcoKS5sZW5ndGggKyAzIC8vIG1hcmtlciArIDIgcGFkZGluZyBzcGFjZXNcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29sb3JEaWZmKFxuICBwYXRjaDogU3RydWN0dXJlZFBhdGNoSHVuayxcbiAgZmlyc3RMaW5lOiBzdHJpbmcgfCBudWxsLFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBmaWxlQ29udGVudDogc3RyaW5nIHwgbnVsbCxcbiAgdGhlbWU6IHN0cmluZyxcbiAgd2lkdGg6IG51bWJlcixcbiAgZGltOiBib29sZWFuLFxuICBzcGxpdEd1dHRlcjogYm9vbGVhbixcbik6IENhY2hlZFJlbmRlciB8IG51bGwge1xuICBjb25zdCBDb2xvckRpZmYgPSBleHBlY3RDb2xvckRpZmYoKVxuICBpZiAoIUNvbG9yRGlmZikgcmV0dXJuIG51bGxcblxuICAvLyBEZWZlbnNpdmU6IGlmIHRoZSBndXR0ZXIgd291bGQgZWF0IHRoZSB3aG9sZSByZW5kZXIgd2lkdGggKG5hcnJvd1xuICAvLyB0ZXJtaW5hbCksIHNraXAgdGhlIHNwbGl0LiBSdXN0IGFscmVhZHkgd3JhcHMgdG8gYHdpZHRoYCBzbyB0aGVcbiAgLy8gc2luZ2xlLWNvbHVtbiBvdXRwdXQgc3RheXMgY29ycmVjdDsgd2UganVzdCBsb3NlIG5vU2VsZWN0LiBXaXRob3V0XG4gIC8vIHRoaXMsIHNsaWNlQW5zaShsaW5lLCBndXR0ZXJXaWR0aCkgd291bGQgcmV0dXJuIGVtcHR5IGNvbnRlbnQgYW5kXG4gIC8vIFJhd0Fuc2kod2lkdGg8PTApIGlzIHVudGVzdGVkLlxuICBjb25zdCByYXdHdXR0ZXJXaWR0aCA9IHNwbGl0R3V0dGVyID8gY29tcHV0ZUd1dHRlcldpZHRoKHBhdGNoKSA6IDBcbiAgY29uc3QgZ3V0dGVyV2lkdGggPVxuICAgIHJhd0d1dHRlcldpZHRoID4gMCAmJiByYXdHdXR0ZXJXaWR0aCA8IHdpZHRoID8gcmF3R3V0dGVyV2lkdGggOiAwXG5cbiAgY29uc3Qga2V5ID0gYCR7dGhlbWV9fCR7d2lkdGh9fCR7ZGltID8gMSA6IDB9fCR7Z3V0dGVyV2lkdGh9fCR7Zmlyc3RMaW5lID8/ICcnfXwke2ZpbGVQYXRofWBcblxuICBsZXQgcGVySHVuayA9IFJFTkRFUl9DQUNIRS5nZXQocGF0Y2gpXG4gIGNvbnN0IGhpdCA9IHBlckh1bms/LmdldChrZXkpXG4gIGlmIChoaXQpIHJldHVybiBoaXRcblxuICBjb25zdCBsaW5lcyA9IG5ldyBDb2xvckRpZmYocGF0Y2gsIGZpcnN0TGluZSwgZmlsZVBhdGgsIGZpbGVDb250ZW50KS5yZW5kZXIoXG4gICAgdGhlbWUsXG4gICAgd2lkdGgsXG4gICAgZGltLFxuICApXG4gIGlmIChsaW5lcyA9PT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAvLyBQcmUtc3BsaXQgdGhlIGd1dHRlciBjb2x1bW4gb25jZSAoY29sZC1jYWNoZSkuIHNsaWNlQW5zaSBwcmVzZXJ2ZXNcbiAgLy8gc3R5bGVzIGFjcm9zcyB0aGUgY3V0OyB0aGUgUnVzdCBtb2R1bGUgYWxyZWFkeSBwYWRzIHRoZSBndXR0ZXIgdG9cbiAgLy8gZ3V0dGVyV2lkdGggc28gdGhlIG5hcnJvdyBSYXdBbnNpIGNvbHVtbidzIHdpZHRoIG1hdGNoZXMgaXRzIGNlbGxzLlxuICBsZXQgZ3V0dGVyczogc3RyaW5nW10gfCBudWxsID0gbnVsbFxuICBsZXQgY29udGVudHM6IHN0cmluZ1tdIHwgbnVsbCA9IG51bGxcbiAgaWYgKGd1dHRlcldpZHRoID4gMCkge1xuICAgIGd1dHRlcnMgPSBsaW5lcy5tYXAobCA9PiBzbGljZUFuc2kobCwgMCwgZ3V0dGVyV2lkdGgpKVxuICAgIGNvbnRlbnRzID0gbGluZXMubWFwKGwgPT4gc2xpY2VBbnNpKGwsIGd1dHRlcldpZHRoKSlcbiAgfVxuXG4gIGNvbnN0IGVudHJ5OiBDYWNoZWRSZW5kZXIgPSB7IGxpbmVzLCBndXR0ZXJXaWR0aCwgZ3V0dGVycywgY29udGVudHMgfVxuXG4gIGlmICghcGVySHVuaykge1xuICAgIHBlckh1bmsgPSBuZXcgTWFwKClcbiAgICBSRU5ERVJfQ0FDSEUuc2V0KHBhdGNoLCBwZXJIdW5rKVxuICB9XG4gIC8vIENhcCB0aGUgaW5uZXIgbWFwOiB3aWR0aCBpcyBwYXJ0IG9mIHRoZSBrZXksIHNvIHRlcm1pbmFsIHJlc2l6ZSB3aGlsZSBhXG4gIC8vIGRpZmYgaXMgdmlzaWJsZSBhY2N1bXVsYXRlcyBhIGZ1bGwgcmVuZGVyIGNvcHkgcGVyIGRpc3RpbmN0IHdpZHRoLiBGb3VyXG4gIC8vIHZhcmlhbnRzICh0d28gd2lkdGhzIMOXIGRpbSBvbi9vZmYpIGNvdmVycyB0aGUgc3RlYWR5IHN0YXRlOyBiZXlvbmQgdGhhdFxuICAvLyB0aGUgdXNlciBpcyBhY3RpdmVseSByZXNpemluZyBhbmQgb2xkIHdpZHRocyBhcmUgc3RhbGUuXG4gIGlmIChwZXJIdW5rLnNpemUgPj0gNCkgcGVySHVuay5jbGVhcigpXG4gIHBlckh1bmsuc2V0KGtleSwgZW50cnkpXG4gIHJldHVybiBlbnRyeVxufVxuXG5leHBvcnQgY29uc3QgU3RydWN0dXJlZERpZmYgPSBtZW1vKGZ1bmN0aW9uIFN0cnVjdHVyZWREaWZmKHtcbiAgcGF0Y2gsXG4gIGRpbSxcbiAgZmlsZVBhdGgsXG4gIGZpcnN0TGluZSxcbiAgZmlsZUNvbnRlbnQsXG4gIHdpZHRoLFxuICBza2lwSGlnaGxpZ2h0aW5nID0gZmFsc2UsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IHNldHRpbmdzID0gdXNlU2V0dGluZ3MoKVxuICBjb25zdCBzeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCA9XG4gICAgc2V0dGluZ3Muc3ludGF4SGlnaGxpZ2h0aW5nRGlzYWJsZWQgPz8gZmFsc2VcblxuICAvLyBFbnN1cmUgd2lkdGggaXMgYXQgbGVhc3QgMSB0byBwcmV2ZW50IGNyYXNoZXMgaW4gdGhlIFJ1c3QgTkFQSSBtb2R1bGVcbiAgLy8gd2hpY2ggZXhwZWN0cyB1MzIgKGNhbid0IGhhbmRsZSBuZWdhdGl2ZSBudW1iZXJzKVxuICBjb25zdCBzYWZlV2lkdGggPSBNYXRoLm1heCgxLCBNYXRoLmZsb29yKHdpZHRoKSlcblxuICAvLyBPbmx5IHNwbGl0IG91dCBhIG5vU2VsZWN0IGd1dHRlciBpbiBmdWxsc2NyZWVuIG1vZGUg4oCUIHRlcm1pbmFsIG5hdGl2ZVxuICAvLyBzZWxlY3Rpb24gaXMgdXNlZCBvdGhlcndpc2UgYW5kIG5vU2VsZWN0IGlzIG1lYW5pbmdsZXNzLiBCb3RoIGJyYW5jaGVzXG4gIC8vIGFyZSBub3cgTygxKSBZb2dhIGxlYXZlcyBwZXIgZGlmZiBvbiByZW1vdW50ICgyIHZzIDEpLCBzbyB0aGlzIGdhdGVcbiAgLy8gb25seSBzYXZlcyBjb2xkLWNhY2hlIHNsaWNlQW5zaSB3b3JrIHdoZW4gZnVsbHNjcmVlbiBpcyBvZmYuXG4gIGNvbnN0IHNwbGl0R3V0dGVyID0gaXNGdWxsc2NyZWVuRW52RW5hYmxlZCgpXG5cbiAgY29uc3QgY2FjaGVkID1cbiAgICBza2lwSGlnaGxpZ2h0aW5nIHx8IHN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkXG4gICAgICA/IG51bGxcbiAgICAgIDogcmVuZGVyQ29sb3JEaWZmKFxuICAgICAgICAgIHBhdGNoLFxuICAgICAgICAgIGZpcnN0TGluZSxcbiAgICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgICBmaWxlQ29udGVudCA/PyBudWxsLFxuICAgICAgICAgIHRoZW1lLFxuICAgICAgICAgIHNhZmVXaWR0aCxcbiAgICAgICAgICBkaW0sXG4gICAgICAgICAgc3BsaXRHdXR0ZXIsXG4gICAgICAgIClcblxuICBpZiAoIWNhY2hlZCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94PlxuICAgICAgICA8U3RydWN0dXJlZERpZmZGYWxsYmFjayBwYXRjaD17cGF0Y2h9IGRpbT17ZGltfSB3aWR0aD17d2lkdGh9IC8+XG4gICAgICA8L0JveD5cbiAgICApXG4gIH1cblxuICBjb25zdCB7IGxpbmVzLCBndXR0ZXJXaWR0aCwgZ3V0dGVycywgY29udGVudHMgfSA9IGNhY2hlZFxuXG4gIC8vIFR3by1jb2x1bW4gbGF5b3V0OiBndXR0ZXIgKG5vU2VsZWN0KSArIGNvbnRlbnQuIE5vU2VsZWN0IG1hcmtzIHRoZVxuICAvLyBCb3gncyBjb21wdXRlZCBib3VuZHMgbm9uLXNlbGVjdGFibGU7IFJhd0Fuc2kncyBtZWFzdXJlIGZ1bmMgc2V0c1xuICAvLyByYXdIZWlnaHQ9bGluZXMubGVuZ3RoLCBzbyBvbmUgdGFsbCBsZWFmIGdldHMgdGhlIHNhbWUgbm9TZWxlY3RcbiAgLy8gY292ZXJhZ2UgTiBwZXItcm93IEJveGVzIHdvdWxkIOKAlCB3aXRob3V0IHRoZSBwZXItcm93IFlvZ2EgY29zdC5cbiAgaWYgKGd1dHRlcldpZHRoID4gMCAmJiBndXR0ZXJzICYmIGNvbnRlbnRzKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cInJvd1wiPlxuICAgICAgICA8Tm9TZWxlY3QgZnJvbUxlZnRFZGdlPlxuICAgICAgICAgIDxSYXdBbnNpIGxpbmVzPXtndXR0ZXJzfSB3aWR0aD17Z3V0dGVyV2lkdGh9IC8+XG4gICAgICAgIDwvTm9TZWxlY3Q+XG4gICAgICAgIDxSYXdBbnNpIGxpbmVzPXtjb250ZW50c30gd2lkdGg9e3NhZmVXaWR0aCAtIGd1dHRlcldpZHRofSAvPlxuICAgICAgPC9Cb3g+XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94PlxuICAgICAgPFJhd0Fuc2kgbGluZXM9e2xpbmVzfSB3aWR0aD17c2FmZVdpZHRofSAvPlxuICAgIDwvQm94PlxuICApXG59KVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsY0FBY0EsbUJBQW1CLFFBQVEsTUFBTTtBQUMvQyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLElBQUksUUFBUSxPQUFPO0FBQzVCLFNBQVNDLFdBQVcsUUFBUSx5QkFBeUI7QUFDckQsU0FBU0MsR0FBRyxFQUFFQyxRQUFRLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxRQUFRLFdBQVc7QUFDNUQsU0FBU0Msc0JBQXNCLFFBQVEsd0JBQXdCO0FBQy9ELE9BQU9DLFNBQVMsTUFBTSx1QkFBdUI7QUFDN0MsU0FBU0MsZUFBZSxRQUFRLCtCQUErQjtBQUMvRCxTQUFTQyxzQkFBc0IsUUFBUSw4QkFBOEI7QUFFckUsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLEtBQUssRUFBRWIsbUJBQW1CO0VBQzFCYyxHQUFHLEVBQUUsT0FBTztFQUNaQyxRQUFRLEVBQUUsTUFBTSxFQUFDO0VBQ2pCQyxTQUFTLEVBQUUsTUFBTSxHQUFHLElBQUksRUFBQztFQUN6QkMsV0FBVyxDQUFDLEVBQUUsTUFBTSxFQUFDO0VBQ3JCQyxLQUFLLEVBQUUsTUFBTTtFQUNiQyxnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sRUFBQztBQUM3QixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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