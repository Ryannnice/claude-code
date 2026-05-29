// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import * as path from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react';
// 引入 useRegisterOverlay，将 ../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterOverlay } from '../context/overlayContext.js';
// 引入 generateFileSuggestions，将 ../hooks/fileSuggestions.js 中已经封装好的能力接到本文件流程里。
import { generateFileSuggestions } from '../hooks/fileSuggestions.js';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js';
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js';
// 复用 openFileInExternalEditor 工具函数，把通用处理留在 ../utils/editor.js 中维护。
import { openFileInExternalEditor } from '../utils/editor.js';
// 复用 truncatePathMiddle、truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { truncatePathMiddle, truncateToWidth } from '../utils/format.js';
// 复用 highlightMatch 工具函数，把通用处理留在 ../utils/highlightMatch.js 中维护。
import { highlightMatch } from '../utils/highlightMatch.js';
// 复用 readFileInRange 工具函数，把通用处理留在 ../utils/readFileInRange.js 中维护。
import { readFileInRange } from '../utils/readFileInRange.js';
// 引入 FuzzyPicker，将 ./design-system/FuzzyPicker.js 中已经封装好的能力接到本文件流程里。
import { FuzzyPicker } from './design-system/FuzzyPicker.js';
// 引入 LoadingState，将 ./design-system/LoadingState.js 中已经封装好的能力接到本文件流程里。
import { LoadingState } from './design-system/LoadingState.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
  // 这个回调绑定到 onInsert: (text: string) => void;，负责终端渲染在该局部场景下的响应。
  onInsert: (text: string) => void;
};
// VISIBLE_RESULTS 集合保存`8`，供终端 UI Quick Open Dialog后续判断或输出使用。
const VISIBLE_RESULTS = 8;
// PREVIEW_LINES 集合保存`20`，供终端 UI Quick Open Dialog后续判断或输出使用。
const PREVIEW_LINES = 20;

/**
 * Quick Open dialog (ctrl+shift+p / cmd+shift+p).
 * Fuzzy file finder with a syntax-highlighted preview of the focused file.
 */
// QuickOpenDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function QuickOpenDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(35);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    onInsert
  } = t0;
  // 调用 useRegisterOverlay，触发终端渲染此处需要的副作用。
  useRegisterOverlay("quick-open");
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns,
    rows
  } = useTerminalSize();
  // visibleResults 集合保存`Math.min`，供终端渲染后续处理使用。
  const visibleResults = Math.min(VISIBLE_RESULTS, Math.max(4, rows - 14));
  // t1 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 结果列表 由 React state 持有，setResults 会在用户操作或异步结果返回时触发刷新。
  const [results, setResults] = useState(t1);
  // query 由 React state 持有，setQuery 会在用户操作或异步结果返回时触发刷新。
  const [query, setQuery] = useState("");
  // focusedPath 路径数据 由 React state 持有，setFocusedPath 会在用户操作或异步结果返回时触发刷新。
  const [focusedPath, setFocusedPath] = useState(undefined);
  // preview 由 React state 持有，setPreview 会在用户操作或异步结果返回时触发刷新。
  const [preview, setPreview] = useState(null);
  // queryGenRef 引用保存`useRef`，供终端渲染后续处理使用。
  const queryGenRef = useRef(0);
  // t2 暂存 `() => () => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => () => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => () => {
      // current更新为 `queryGenRef.current + 1`，确保终端 UI后续读取最新状态。
      queryGenRef.current = queryGenRef.current + 1;
      // 返回 `void queryGenRef.current`，作为终端渲染这次计算的结果。
      return void queryGenRef.current;
    };
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // previewOnRight保存`columns >= 120`，供后续判断或组装使用。
  const previewOnRight = columns >= 120;
  // effectivePreviewLines 集合 命名 `previewOnRight ? VISIBLE_RESULTS - 1 : PREVIEW_LINES`，让后续代码直接表达这个值的用途。
  const effectivePreviewLines = previewOnRight ? VISIBLE_RESULTS - 1 : PREVIEW_LINES;
  // t4 暂存 `q => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `q => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = q => {
      // setQuery 写入新的状态值，使终端渲染后续读取保持一致。
      setQuery(q);
      // gen保存`queryGenRef.current = queryGenRef.current + 1`，供后续判断或组装使用。
      const gen = queryGenRef.current = queryGenRef.current + 1;
      // 满足 `!q.trim()` 时，终端渲染执行该分支。
      if (!q.trim()) {
        // setResults 写入新的状态值，使终端渲染后续读取保持一致。
        setResults([]);
        // 终端 UI 组件 Quick Open Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 generateFileSuggestions，触发终端渲染此处需要的副作用。
      generateFileSuggestions(q, true).then(items => {
        // `gen` 与 `queryGenRef.current` 不一致时刷新派生状态，避免使用过期结果。
        if (gen !== queryGenRef.current) {
          // 终端 UI 组件 Quick Open Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 路径列表筛选`items.filter`，供终端渲染后续处理使用。
        const paths = items.filter(_temp).map(_temp2).filter(_temp3).map(_temp4);
        // setResults 写入新的状态值，使终端渲染后续读取保持一致。
        setResults(paths);
      });
    };
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // handleQueryChange沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleQueryChange = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== effectivePreviewLines || $[5] !== focusedPath) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // focusedPath 路径数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!focusedPath) {
        // setPreview 写入新的状态值，使终端渲染后续读取保持一致。
        setPreview(null);
        // 终端 UI 组件 Quick Open Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // controller保存`AbortController`，供终端渲染后续处理使用。
      const controller = new AbortController();
      // absolute读取`path.resolve`，供终端渲染后续处理使用。
      const absolute = path.resolve(getCwd(), focusedPath);
      // 调用 readFileInRange，触发终端渲染此处需要的副作用。
      readFileInRange(absolute, 0, effectivePreviewLines, undefined, controller.signal).then(r => {
        // 满足 `controller.signal.aborted` 时，终端渲染执行该分支。
        if (controller.signal.aborted) {
          // 终端 UI 组件 Quick Open Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setPreview 写入新的状态值，使终端渲染后续读取保持一致。
        setPreview({
          path: focusedPath,
          content: r.content
        });
      // 这个回调绑定到 }).catch(() => {，负责终端渲染在该局部场景下的响应。
      }).catch(() => {
        // 满足 `controller.signal.aborted` 时，终端渲染执行该分支。
        if (controller.signal.aborted) {
          // 终端 UI 组件 Quick Open Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setPreview 写入新的状态值，使终端渲染后续读取保持一致。
        setPreview({
          path: focusedPath,
          content: "(preview unavailable)"
        });
      });
      // 返回 `() => controller.abort()`，作为终端渲染这次计算的结果。
      return () => controller.abort();
    };
    // t6 暂存 `[focusedPath, effectivePreviewLines]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [focusedPath, effectivePreviewLines];
    // $[4] 缓存 `effectivePreviewLines`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = effectivePreviewLines;
    // $[5] 缓存 `focusedPath`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = focusedPath;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
    // $[7] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
    // t6 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[7];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t5, t6);
  // maxPathWidth 路径数据保存`Math.max`，供终端渲染后续处理使用。
  const maxPathWidth = previewOnRight ? Math.max(20, Math.floor((columns - 10) * 0.4)) : Math.max(20, columns - 8);
  // previewWidth保存`Math.max`，供终端渲染后续处理使用。
  const previewWidth = previewOnRight ? Math.max(40, columns - maxPathWidth - 14) : columns - 6;
  // t7 暂存 `p_1 => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== onDone || $[9] !== results.length) {
    // t7 暂存 `p_1 => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = p_1 => {
      // opened保存`openFileInExternalEditor`，供终端渲染后续处理使用。
      const opened = openFileInExternalEditor(path.resolve(getCwd(), p_1));
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_quick_open_select", {
        result_count: results.length,
        opened_editor: opened
      });
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[8] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onDone;
    // $[9] 缓存 `results.length`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = results.length;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // handleOpen保存`t7`，作为后续临时缓存值处理的输入。
  const handleOpen = t7;
  // t8 暂存 `(p_2, mention) => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onDone || $[12] !== onInsert || $[13] !== results.length) {
    // t8 暂存 `(p_2, mention) => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = (p_2, mention) => {
      // 调用 onInsert，触发终端渲染此处需要的副作用。
      onInsert(mention ? `@${p_2} ` : `${p_2} `);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_quick_open_insert", {
        result_count: results.length,
        mention
      });
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onDone;
    // $[12] 缓存 `onInsert`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onInsert;
    // $[13] 缓存 `results.length`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = results.length;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // handleInsert沿用 `t8` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleInsert = t8;
  // t9保存`previewOnRight ? "right" : "bottom"`，供后续判断或组装使用。
  const t9 = previewOnRight ? "right" : "bottom";
  // t10 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== handleInsert) {
    // t10 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t10 = {
      action: "mention",
      // 这个回调绑定到 handler: p_4 => handleInsert(p_4, true)，负责终端渲染在该局部场景下的响应。
      handler: p_4 => handleInsert(p_4, true)
    };
    // $[15] 缓存 `handleInsert`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = handleInsert;
    // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[16];
  }
  // t11 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== handleInsert) {
    // t11 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t11 = {
      action: "insert path",
      // 这个回调绑定到 handler: p_5 => handleInsert(p_5, false)，负责终端渲染在该局部场景下的响应。
      handler: p_5 => handleInsert(p_5, false)
    };
    // $[17] 缓存 `handleInsert`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = handleInsert;
    // $[18] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[18];
  }
  // t12 暂存 `(p_6, isFocused) => <Text color={isFocused ? "suggestion"...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== maxPathWidth) {
    // t12 暂存 `(p_6, isFocused) => <Text color={isFocused ? "suggestion"...` 生成的渲染片段，后续返回路径直接复用。
    t12 = (p_6, isFocused) => <Text color={isFocused ? "suggestion" : undefined}>{truncatePathMiddle(p_6, maxPathWidth)}</Text>;
    // $[19] 缓存 `maxPathWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = maxPathWidth;
    // $[20] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[20];
  }
  // t13 暂存 `p_7 => preview ? <><Text dimColor={true}>{truncatePathMid...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== preview || $[22] !== previewWidth || $[23] !== query) {
    // t13 暂存 `p_7 => preview ? <><Text dimColor={true}>{truncatePathMid...` 生成的渲染片段，后续返回路径直接复用。
    t13 = p_7 => preview ? <><Text dimColor={true}>{truncatePathMiddle(p_7, previewWidth)}{preview.path !== p_7 ? " \xB7 loading\u2026" : ""}</Text>{preview.content.split("\n").map((line, i_1) => <Text key={i_1}>{highlightMatch(truncateToWidth(line, previewWidth), query)}</Text>)}</> : <LoadingState message={"Loading preview\u2026"} dimColor={true} />;
    // $[21] 缓存 `preview`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = preview;
    // $[22] 缓存 `previewWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = previewWidth;
    // $[23] 缓存 `query`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = query;
    // $[24] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[24];
  }
  // t14 暂存 `<FuzzyPicker title="Quick Open" placeholder={"Type to sea...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== handleOpen || $[26] !== onDone || $[27] !== results || $[28] !== t10 || $[29] !== t11 || $[30] !== t12 || $[31] !== t13 || $[32] !== t9 || $[33] !== visibleResults) {
    // t14 暂存 `<FuzzyPicker title="Quick Open" placeholder={"Type to sea...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <FuzzyPicker title="Quick Open" placeholder={"Type to search files\u2026"} items={results} getKey={_temp5} visibleCount={visibleResults} direction="up" previewPosition={t9} onQueryChange={handleQueryChange} onFocus={setFocusedPath} onSelect={handleOpen} onTab={t10} onShiftTab={t11} onCancel={onDone} emptyMessage={_temp6} selectAction="open in editor" renderItem={t12} renderPreview={t13} />;
    // $[25] 缓存 `handleOpen`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = handleOpen;
    // $[26] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = onDone;
    // $[27] 缓存 `results`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = results;
    // $[28] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t10;
    // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t11;
    // $[30] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t12;
    // $[31] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t13;
    // $[32] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t9;
    // $[33] 缓存 `visibleResults`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = visibleResults;
    // $[34] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[34];
  }
  // 返回 `t14`，作为终端渲染这次计算的结果。
  return t14;
}
// _temp6 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(q_0) {
  // 返回 `q_0 ? "No matching files" : "Start typing to search\u2026"`，作为终端渲染这次计算的结果。
  return q_0 ? "No matching files" : "Start typing to search\u2026";
}
// _temp5 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(p_3) {
  // 返回 `p_3`，作为终端渲染这次计算的结果。
  return p_3;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(p_0) {
  // 返回 `p_0.split(path.sep).join("/")`，作为终端渲染这次计算的结果。
  return p_0.split(path.sep).join("/");
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(p) {
  // 返回 `!p.endsWith(path.sep)`，作为终端渲染这次计算的结果。
  return !p.endsWith(path.sep);
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(i_0) {
  // 返回 `i_0.displayText`，作为终端渲染这次计算的结果。
  return i_0.displayText;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(i) {
  // 返回 `i.id.startsWith("file-")`，作为终端渲染这次计算的结果。
  return i.id.startsWith("file-");
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXRoIiwiUmVhY3QiLCJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsInVzZVJlZ2lzdGVyT3ZlcmxheSIsImdlbmVyYXRlRmlsZVN1Z2dlc3Rpb25zIiwidXNlVGVybWluYWxTaXplIiwiVGV4dCIsImxvZ0V2ZW50IiwiZ2V0Q3dkIiwib3BlbkZpbGVJbkV4dGVybmFsRWRpdG9yIiwidHJ1bmNhdGVQYXRoTWlkZGxlIiwidHJ1bmNhdGVUb1dpZHRoIiwiaGlnaGxpZ2h0TWF0Y2giLCJyZWFkRmlsZUluUmFuZ2UiLCJGdXp6eVBpY2tlciIsIkxvYWRpbmdTdGF0ZSIsIlByb3BzIiwib25Eb25lIiwib25JbnNlcnQiLCJ0ZXh0IiwiVklTSUJMRV9SRVNVTFRTIiwiUFJFVklFV19MSU5FUyIsIlF1aWNrT3BlbkRpYWxvZyIsInQwIiwiJCIsIl9jIiwiY29sdW1ucyIsInJvd3MiLCJ2aXNpYmxlUmVzdWx0cyIsIk1hdGgiLCJtaW4iLCJtYXgiLCJ0MSIsIlN5bWJvbCIsImZvciIsInJlc3VsdHMiLCJzZXRSZXN1bHRzIiwicXVlcnkiLCJzZXRRdWVyeSIsImZvY3VzZWRQYXRoIiwic2V0Rm9jdXNlZFBhdGgiLCJ1bmRlZmluZWQiLCJwcmV2aWV3Iiwic2V0UHJldmlldyIsInF1ZXJ5R2VuUmVmIiwidDIiLCJ0MyIsImN1cnJlbnQiLCJwcmV2aWV3T25SaWdodCIsImVmZmVjdGl2ZVByZXZpZXdMaW5lcyIsInQ0IiwicSIsImdlbiIsInRyaW0iLCJ0aGVuIiwiaXRlbXMiLCJwYXRocyIsImZpbHRlciIsIl90ZW1wIiwibWFwIiwiX3RlbXAyIiwiX3RlbXAzIiwiX3RlbXA0IiwiaGFuZGxlUXVlcnlDaGFuZ2UiLCJ0NSIsInQ2IiwiY29udHJvbGxlciIsIkFib3J0Q29udHJvbGxlciIsImFic29sdXRlIiwicmVzb2x2ZSIsInNpZ25hbCIsInIiLCJhYm9ydGVkIiwiY29udGVudCIsImNhdGNoIiwiYWJvcnQiLCJtYXhQYXRoV2lkdGgiLCJmbG9vciIsInByZXZpZXdXaWR0aCIsInQ3IiwibGVuZ3RoIiwicF8xIiwib3BlbmVkIiwicCIsInJlc3VsdF9jb3VudCIsIm9wZW5lZF9lZGl0b3IiLCJoYW5kbGVPcGVuIiwidDgiLCJwXzIiLCJtZW50aW9uIiwiaGFuZGxlSW5zZXJ0IiwidDkiLCJ0MTAiLCJhY3Rpb24iLCJoYW5kbGVyIiwicF80IiwidDExIiwicF81IiwidDEyIiwicF82IiwiaXNGb2N1c2VkIiwidDEzIiwicF83Iiwic3BsaXQiLCJsaW5lIiwiaV8xIiwiaSIsInQxNCIsIl90ZW1wNSIsIl90ZW1wNiIsInFfMCIsInBfMyIsInBfMCIsInNlcCIsImpvaW4iLCJlbmRzV2l0aCIsImlfMCIsImRpc3BsYXlUZXh0IiwiaWQiLCJzdGFydHNXaXRoIl0sInNvdXJjZXMiOlsiUXVpY2tPcGVuRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlUmVnaXN0ZXJPdmVybGF5IH0gZnJvbSAnLi4vY29udGV4dC9vdmVybGF5Q29udGV4dC5qcydcbmltcG9ydCB7IGdlbmVyYXRlRmlsZVN1Z2dlc3Rpb25zIH0gZnJvbSAnLi4vaG9va3MvZmlsZVN1Z2dlc3Rpb25zLmpzJ1xuaW1wb3J0IHsgdXNlVGVybWluYWxTaXplIH0gZnJvbSAnLi4vaG9va3MvdXNlVGVybWluYWxTaXplLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnLi4vc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgZ2V0Q3dkIH0gZnJvbSAnLi4vdXRpbHMvY3dkLmpzJ1xuaW1wb3J0IHsgb3BlbkZpbGVJbkV4dGVybmFsRWRpdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGVQYXRoTWlkZGxlLCB0cnVuY2F0ZVRvV2lkdGggfSBmcm9tICcuLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyBoaWdobGlnaHRNYXRjaCB9IGZyb20gJy4uL3V0aWxzL2hpZ2hsaWdodE1hdGNoLmpzJ1xuaW1wb3J0IHsgcmVhZEZpbGVJblJhbmdlIH0gZnJvbSAnLi4vdXRpbHMvcmVhZEZpbGVJblJhbmdlLmpzJ1xuaW1wb3J0IHsgRnV6enlQaWNrZXIgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRnV6enlQaWNrZXIuanMnXG5pbXBvcnQgeyBMb2FkaW5nU3RhdGUgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vTG9hZGluZ1N0YXRlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6ICgpID0+IHZvaWRcbiAgb25JbnNlcnQ6ICh0ZXh0OiBzdHJpbmcpID0+IHZvaWRcbn1cblxuY29uc3QgVklTSUJMRV9SRVNVTFRTID0gOFxuY29uc3QgUFJFVklFV19MSU5FUyA9IDIwXG5cbi8qKlxuICogUXVpY2sgT3BlbiBkaWFsb2cgKGN0cmwrc2hpZnQrcCAvIGNtZCtzaGlmdCtwKS5cbiAqIEZ1enp5IGZpbGUgZmluZGVyIHdpdGggYSBzeW50YXgtaGlnaGxpZ2h0ZWQgcHJldmlldyBvZiB0aGUgZm9jdXNlZCBmaWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gUXVpY2tPcGVuRGlhbG9nKHsgb25Eb25lLCBvbkluc2VydCB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHVzZVJlZ2lzdGVyT3ZlcmxheSgncXVpY2stb3BlbicpXG4gIGNvbnN0IHsgY29sdW1ucywgcm93cyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgLy8gQ2hyb21lICh0aXRsZSArIHNlYXJjaCArIGhpbnRzICsgcGFuZSBib3JkZXIgKyBnYXBzKSBlYXRzIH4xNCByb3dzLlxuICAvLyBTaHJpbmsgdGhlIGxpc3Qgb24gc2hvcnQgdGVybWluYWxzIHNvIHRoZSBkaWFsb2cgZG9lc24ndCBjbGlwLlxuICBjb25zdCB2aXNpYmxlUmVzdWx0cyA9IE1hdGgubWluKFZJU0lCTEVfUkVTVUxUUywgTWF0aC5tYXgoNCwgcm93cyAtIDE0KSlcblxuICBjb25zdCBbcmVzdWx0cywgc2V0UmVzdWx0c10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pXG4gIGNvbnN0IFtxdWVyeSwgc2V0UXVlcnldID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtmb2N1c2VkUGF0aCwgc2V0Rm9jdXNlZFBhdGhdID0gdXNlU3RhdGU8c3RyaW5nIHwgdW5kZWZpbmVkPih1bmRlZmluZWQpXG4gIGNvbnN0IFtwcmV2aWV3LCBzZXRQcmV2aWV3XSA9IHVzZVN0YXRlPHtcbiAgICBwYXRoOiBzdHJpbmdcbiAgICBjb250ZW50OiBzdHJpbmdcbiAgfSB8IG51bGw+KG51bGwpXG4gIGNvbnN0IHF1ZXJ5R2VuUmVmID0gdXNlUmVmKDApXG4gIHVzZUVmZmVjdCgoKSA9PiAoKSA9PiB2b2lkIHF1ZXJ5R2VuUmVmLmN1cnJlbnQrKywgW10pXG5cbiAgY29uc3QgcHJldmlld09uUmlnaHQgPSBjb2x1bW5zID49IDEyMFxuICAvLyBTaWRlIHByZXZpZXcgc2l0cyBpbiBhIGZpeGVkLWhlaWdodCByb3cgYWxvbmdzaWRlIHRoZSBsaXN0ICh2aXNpYmxlQ291bnRcbiAgLy8gcm93cyksIHNvIG92ZXJmbG93aW5nIHRoYXQgaGVpZ2h0IGdhcmJsZXMgdGhlIGxheW91dCDigJQgY2FwIHRvIGZpdCwgbWludXNcbiAgLy8gb25lIGZvciB0aGUgcGF0aCBoZWFkZXIgbGluZS5cbiAgY29uc3QgZWZmZWN0aXZlUHJldmlld0xpbmVzID0gcHJldmlld09uUmlnaHRcbiAgICA/IFZJU0lCTEVfUkVTVUxUUyAtIDFcbiAgICA6IFBSRVZJRVdfTElORVNcblxuICAvLyBBIGdlbmVyYXRpb24gY291bnRlciBpbnZhbGlkYXRlcyBzdGFsZSByZXN1bHRzIGlmIHRoZSB1c2VyIHR5cGVzIGZhc3RlclxuICAvLyB0aGFuIHRoZSBpbmRleCBjYW4gcmVzcG9uZC5cbiAgY29uc3QgaGFuZGxlUXVlcnlDaGFuZ2UgPSAocTogc3RyaW5nKSA9PiB7XG4gICAgc2V0UXVlcnkocSlcbiAgICBjb25zdCBnZW4gPSArK3F1ZXJ5R2VuUmVmLmN1cnJlbnRcbiAgICBpZiAoIXEudHJpbSgpKSB7XG4gICAgICAvLyBnZW5lcmF0ZUZpbGVTdWdnZXN0aW9ucygnJykgcmV0dXJucyByYXcgcmVhZGRpcigpIG9mIGN3ZCAoZGVzaWduZWQgZm9yXG4gICAgICAvLyBALW1lbnRpb25zKS4gRm9yIFF1aWNrIE9wZW4gdGhhdCdzIGp1c3Qgbm9pc2Ug4oCUIHNob3cgdGhlIGVtcHR5IHN0YXRlLlxuICAgICAgc2V0UmVzdWx0cyhbXSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2b2lkIGdlbmVyYXRlRmlsZVN1Z2dlc3Rpb25zKHEsIHRydWUpLnRoZW4oaXRlbXMgPT4ge1xuICAgICAgaWYgKGdlbiAhPT0gcXVlcnlHZW5SZWYuY3VycmVudCkgcmV0dXJuXG4gICAgICAvLyBGaWx0ZXIgb3V0IGRpcmVjdG9yeSBlbnRyaWVzIOKAlCB0aGV5IGNvbWUgYmFjayB3aXRoIGEgdHJhaWxpbmcgcGF0aC5zZXBcbiAgICAgIC8vIGZyb20gZ2V0VG9wTGV2ZWxQYXRocygpIGFuZCB3b3VsZCBjYXVzZSByZWFkRmlsZUluUmFuZ2UgdG8gdGhyb3cgRUlTRElSLFxuICAgICAgLy8gbGVhdmluZyB0aGUgcHJldmlldyBwYW5lIHN0dWNrIG9uIFwiTG9hZGluZyBwcmV2aWV34oCmXCIuXG4gICAgICAvLyBOb3JtYWxpemUgc2VwYXJhdG9ycyB0byAnLycgc28gdHJ1bmNhdGVQYXRoTWlkZGxlICh3aGljaCB1c2VzXG4gICAgICAvLyBsYXN0SW5kZXhPZignLycpKSBjYW4gZmluZCB0aGUgZmlsZW5hbWUgb24gV2luZG93cyB0b28uXG4gICAgICBjb25zdCBwYXRocyA9IGl0ZW1zXG4gICAgICAgIC5maWx0ZXIoaSA9PiBpLmlkLnN0YXJ0c1dpdGgoJ2ZpbGUtJykpXG4gICAgICAgIC5tYXAoaSA9PiBpLmRpc3BsYXlUZXh0KVxuICAgICAgICAuZmlsdGVyKHAgPT4gIXAuZW5kc1dpdGgocGF0aC5zZXApKVxuICAgICAgICAubWFwKHAgPT4gcC5zcGxpdChwYXRoLnNlcCkuam9pbignLycpKVxuICAgICAgc2V0UmVzdWx0cyhwYXRocylcbiAgICB9KVxuICB9XG5cbiAgLy8gTG9hZCBhIHNob3J0IHByZXZpZXcgb2YgdGhlIGZvY3VzZWQgZmlsZS4gRWFjaCBuYXZpZ2F0aW9uIGFib3J0cyB0aGVcbiAgLy8gcHJldmlvdXMgcmVhZCBzbyBob2xkaW5nIOKGkyBkb2Vzbid0IHBpbGUgdXAgd2hvbGUtZmlsZSByZWFkcyBhbmQgc28gYVxuICAvLyBzbG93IGVhcmx5IHJlYWQgY2FuJ3Qgb3ZlcndyaXRlIGEgZmFzdGVyIGxhdGVyIG9uZS4gVGhlIHN0YWxlIHByZXZpZXdcbiAgLy8gc3RheXMgdmlzaWJsZSB1bnRpbCB0aGUgbmV3IG9uZSBhcnJpdmVzIOKAlCByZW5kZXJQcmV2aWV3IG92ZXJsYXlzIGEgZGltXG4gIC8vIGxvYWRpbmcgaW5kaWNhdG9yIHJhdGhlciB0aGFuIGJsYW5raW5nIHRoZSBwYW5lLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZm9jdXNlZFBhdGgpIHtcbiAgICAgIC8vIE5vIHJlc3VsdHMg4oCUIGNsZWFyIHNvIHRoZSBlbXB0eS1zdGF0ZSByZW5kZXJzIGluc3RlYWQgb2YgYSBzdGFsZVxuICAgICAgLy8gcHJldmlldyBmcm9tIGEgcHJldmlvdXMgcXVlcnkuXG4gICAgICBzZXRQcmV2aWV3KG51bGwpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKVxuICAgIGNvbnN0IGFic29sdXRlID0gcGF0aC5yZXNvbHZlKGdldEN3ZCgpLCBmb2N1c2VkUGF0aClcbiAgICB2b2lkIHJlYWRGaWxlSW5SYW5nZShcbiAgICAgIGFic29sdXRlLFxuICAgICAgMCxcbiAgICAgIGVmZmVjdGl2ZVByZXZpZXdMaW5lcyxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIClcbiAgICAgIC50aGVuKHIgPT4ge1xuICAgICAgICBpZiAoY29udHJvbGxlci5zaWduYWwuYWJvcnRlZCkgcmV0dXJuXG4gICAgICAgIHNldFByZXZpZXcoeyBwYXRoOiBmb2N1c2VkUGF0aCwgY29udGVudDogci5jb250ZW50IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHJldHVyblxuICAgICAgICBzZXRQcmV2aWV3KHsgcGF0aDogZm9jdXNlZFBhdGgsIGNvbnRlbnQ6ICcocHJldmlldyB1bmF2YWlsYWJsZSknIH0pXG4gICAgICB9KVxuICAgIHJldHVybiAoKSA9PiBjb250cm9sbGVyLmFib3J0KClcbiAgfSwgW2ZvY3VzZWRQYXRoLCBlZmZlY3RpdmVQcmV2aWV3TGluZXNdKVxuXG4gIGNvbnN0IG1heFBhdGhXaWR0aCA9IHByZXZpZXdPblJpZ2h0XG4gICAgPyBNYXRoLm1heCgyMCwgTWF0aC5mbG9vcigoY29sdW1ucyAtIDEwKSAqIDAuNCkpXG4gICAgOiBNYXRoLm1heCgyMCwgY29sdW1ucyAtIDgpXG4gIGNvbnN0IHByZXZpZXdXaWR0aCA9IHByZXZpZXdPblJpZ2h0XG4gICAgPyBNYXRoLm1heCg0MCwgY29sdW1ucyAtIG1heFBhdGhXaWR0aCAtIDE0KVxuICAgIDogY29sdW1ucyAtIDZcblxuICBjb25zdCBoYW5kbGVPcGVuID0gKHA6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG9wZW5lZCA9IG9wZW5GaWxlSW5FeHRlcm5hbEVkaXRvcihwYXRoLnJlc29sdmUoZ2V0Q3dkKCksIHApKVxuICAgIGxvZ0V2ZW50KCd0ZW5ndV9xdWlja19vcGVuX3NlbGVjdCcsIHtcbiAgICAgIHJlc3VsdF9jb3VudDogcmVzdWx0cy5sZW5ndGgsXG4gICAgICBvcGVuZWRfZWRpdG9yOiBvcGVuZWQsXG4gICAgfSlcbiAgICBvbkRvbmUoKVxuICB9XG5cbiAgY29uc3QgaGFuZGxlSW5zZXJ0ID0gKHA6IHN0cmluZywgbWVudGlvbjogYm9vbGVhbikgPT4ge1xuICAgIG9uSW5zZXJ0KG1lbnRpb24gPyBgQCR7cH0gYCA6IGAke3B9IGApXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X3F1aWNrX29wZW5faW5zZXJ0Jywge1xuICAgICAgcmVzdWx0X2NvdW50OiByZXN1bHRzLmxlbmd0aCxcbiAgICAgIG1lbnRpb24sXG4gICAgfSlcbiAgICBvbkRvbmUoKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8RnV6enlQaWNrZXJcbiAgICAgIHRpdGxlPVwiUXVpY2sgT3BlblwiXG4gICAgICBwbGFjZWhvbGRlcj1cIlR5cGUgdG8gc2VhcmNoIGZpbGVz4oCmXCJcbiAgICAgIGl0ZW1zPXtyZXN1bHRzfVxuICAgICAgZ2V0S2V5PXtwID0+IHB9XG4gICAgICB2aXNpYmxlQ291bnQ9e3Zpc2libGVSZXN1bHRzfVxuICAgICAgZGlyZWN0aW9uPVwidXBcIlxuICAgICAgcHJldmlld1Bvc2l0aW9uPXtwcmV2aWV3T25SaWdodCA/ICdyaWdodCcgOiAnYm90dG9tJ31cbiAgICAgIG9uUXVlcnlDaGFuZ2U9e2hhbmRsZVF1ZXJ5Q2hhbmdlfVxuICAgICAgb25Gb2N1cz17c2V0Rm9jdXNlZFBhdGh9XG4gICAgICBvblNlbGVjdD17aGFuZGxlT3Blbn1cbiAgICAgIG9uVGFiPXt7IGFjdGlvbjogJ21lbnRpb24nLCBoYW5kbGVyOiBwID0+IGhhbmRsZUluc2VydChwLCB0cnVlKSB9fVxuICAgICAgb25TaGlmdFRhYj17e1xuICAgICAgICBhY3Rpb246ICdpbnNlcnQgcGF0aCcsXG4gICAgICAgIGhhbmRsZXI6IHAgPT4gaGFuZGxlSW5zZXJ0KHAsIGZhbHNlKSxcbiAgICAgIH19XG4gICAgICBvbkNhbmNlbD17b25Eb25lfVxuICAgICAgZW1wdHlNZXNzYWdlPXtxID0+IChxID8gJ05vIG1hdGNoaW5nIGZpbGVzJyA6ICdTdGFydCB0eXBpbmcgdG8gc2VhcmNo4oCmJyl9XG4gICAgICBzZWxlY3RBY3Rpb249XCJvcGVuIGluIGVkaXRvclwiXG4gICAgICByZW5kZXJJdGVtPXsocCwgaXNGb2N1c2VkKSA9PiAoXG4gICAgICAgIDxUZXh0IGNvbG9yPXtpc0ZvY3VzZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9PlxuICAgICAgICAgIHt0cnVuY2F0ZVBhdGhNaWRkbGUocCwgbWF4UGF0aFdpZHRoKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKX1cbiAgICAgIHJlbmRlclByZXZpZXc9e3AgPT5cbiAgICAgICAgcHJldmlldyA/IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIHt0cnVuY2F0ZVBhdGhNaWRkbGUocCwgcHJldmlld1dpZHRoKX1cbiAgICAgICAgICAgICAge3ByZXZpZXcucGF0aCAhPT0gcCA/ICcgwrcgbG9hZGluZ+KApicgOiAnJ31cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIHtwcmV2aWV3LmNvbnRlbnQuc3BsaXQoJ1xcbicpLm1hcCgobGluZSwgaSkgPT4gKFxuICAgICAgICAgICAgICA8VGV4dCBrZXk9e2l9PlxuICAgICAgICAgICAgICAgIHtoaWdobGlnaHRNYXRjaCh0cnVuY2F0ZVRvV2lkdGgobGluZSwgcHJldmlld1dpZHRoKSwgcXVlcnkpfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8TG9hZGluZ1N0YXRlIG1lc3NhZ2U9XCJMb2FkaW5nIHByZXZpZXfigKZcIiBkaW1Db2xvciAvPlxuICAgICAgICApXG4gICAgICB9XG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxJQUFJLE1BQU0sTUFBTTtBQUM1QixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFNBQVMsRUFBRUMsTUFBTSxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNuRCxTQUFTQyxrQkFBa0IsUUFBUSw4QkFBOEI7QUFDakUsU0FBU0MsdUJBQXVCLFFBQVEsNkJBQTZCO0FBQ3JFLFNBQVNDLGVBQWUsUUFBUSw2QkFBNkI7QUFDN0QsU0FBU0MsSUFBSSxRQUFRLFdBQVc7QUFDaEMsU0FBU0MsUUFBUSxRQUFRLGdDQUFnQztBQUN6RCxTQUFTQyxNQUFNLFFBQVEsaUJBQWlCO0FBQ3hDLFNBQVNDLHdCQUF3QixRQUFRLG9CQUFvQjtBQUM3RCxTQUFTQyxrQkFBa0IsRUFBRUMsZUFBZSxRQUFRLG9CQUFvQjtBQUN4RSxTQUFTQyxjQUFjLFFBQVEsNEJBQTRCO0FBQzNELFNBQVNDLGVBQWUsUUFBUSw2QkFBNkI7QUFDN0QsU0FBU0MsV0FBVyxRQUFRLGdDQUFnQztBQUM1RCxTQUFTQyxZQUFZLFFBQVEsaUNBQWlDO0FBRTlELEtBQUtDLEtBQUssR0FBRztFQUNYQyxNQUFNLEVBQUUsR0FBRyxHQUFHLElBQUk7RUFDbEJDLFFBQVEsRUFBRSxDQUFDQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSTtBQUNsQyxDQUFDO0FBRUQsTUFBTUMsZUFBZSxHQUFHLENBQUM7QUFDekIsTUFBTUMsYUFBYSxHQUFHLEVBQUU7O0FBRXhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxnQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUF5QjtJQUFBUixNQUFBO0lBQUFDO0VBQUEsSUFBQUssRUFBMkI7RUFDekRwQixrQkFBa0IsQ0FBQyxZQUFZLENBQUM7RUFDaEM7SUFBQXVCLE9BQUE7SUFBQUM7RUFBQSxJQUEwQnRCLGVBQWUsQ0FBQyxDQUFDO0VBRzNDLE1BQUF1QixjQUFBLEdBQXVCQyxJQUFJLENBQUFDLEdBQUksQ0FBQ1YsZUFBZSxFQUFFUyxJQUFJLENBQUFFLEdBQUksQ0FBQyxDQUFDLEVBQUVKLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztFQUFBLElBQUFLLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFTLE1BQUEsQ0FBQUMsR0FBQTtJQUV2QkYsRUFBQSxLQUFFO0lBQUFSLENBQUEsTUFBQVEsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVIsQ0FBQTtFQUFBO0VBQW5ELE9BQUFXLE9BQUEsRUFBQUMsVUFBQSxJQUE4QmxDLFFBQVEsQ0FBVzhCLEVBQUUsQ0FBQztFQUNwRCxPQUFBSyxLQUFBLEVBQUFDLFFBQUEsSUFBMEJwQyxRQUFRLENBQUMsRUFBRSxDQUFDO0VBQ3RDLE9BQUFxQyxXQUFBLEVBQUFDLGNBQUEsSUFBc0N0QyxRQUFRLENBQXFCdUMsU0FBUyxDQUFDO0VBQzdFLE9BQUFDLE9BQUEsRUFBQUMsVUFBQSxJQUE4QnpDLFFBQVEsQ0FHNUIsSUFBSSxDQUFDO0VBQ2YsTUFBQTBDLFdBQUEsR0FBb0IzQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQUEsSUFBQTRDLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQXRCLENBQUEsUUFBQVMsTUFBQSxDQUFBQyxHQUFBO0lBQ25CVyxFQUFBLEdBQUFBLENBQUEsS0FBTTtNQUFXRCxXQUFXLENBQUFHLE9BQUEsR0FBWEgsV0FBVyxDQUFBRyxPQUFRO01BQUEsT0FBeEIsS0FBS0gsV0FBVyxDQUFBRyxPQUFVO0lBQUE7SUFBRUQsRUFBQSxLQUFFO0lBQUF0QixDQUFBLE1BQUFxQixFQUFBO0lBQUFyQixDQUFBLE1BQUFzQixFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBckIsQ0FBQTtJQUFBc0IsRUFBQSxHQUFBdEIsQ0FBQTtFQUFBO0VBQXBEeEIsU0FBUyxDQUFDNkMsRUFBc0MsRUFBRUMsRUFBRSxDQUFDO0VBRXJELE1BQUFFLGNBQUEsR0FBdUJ0QixPQUFPLElBQUksR0FBRztFQUlyQyxNQUFBdUIscUJBQUEsR0FBOEJELGNBQWMsR0FDeEM1QixlQUFlLEdBQUcsQ0FDTCxHQUZhQyxhQUViO0VBQUEsSUFBQTZCLEVBQUE7RUFBQSxJQUFBMUIsQ0FBQSxRQUFBUyxNQUFBLENBQUFDLEdBQUE7SUFJU2dCLEVBQUEsR0FBQUMsQ0FBQTtNQUN4QmIsUUFBUSxDQUFDYSxDQUFDLENBQUM7TUFDWCxNQUFBQyxHQUFBLEdBQWNSLFdBQVcsQ0FBQUcsT0FBQSxHQUFYSCxXQUFXLENBQUFHLE9BQVE7TUFDakMsSUFBSSxDQUFDSSxDQUFDLENBQUFFLElBQUssQ0FBQyxDQUFDO1FBR1hqQixVQUFVLENBQUMsRUFBRSxDQUFDO1FBQUE7TUFBQTtNQUdYaEMsdUJBQXVCLENBQUMrQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUFHLElBQUssQ0FBQ0MsS0FBQTtRQUN6QyxJQUFJSCxHQUFHLEtBQUtSLFdBQVcsQ0FBQUcsT0FBUTtVQUFBO1FBQUE7UUFNL0IsTUFBQVMsS0FBQSxHQUFjRCxLQUFLLENBQUFFLE1BQ1YsQ0FBQ0MsS0FBNkIsQ0FBQyxDQUFBQyxHQUNsQyxDQUFDQyxNQUFrQixDQUFDLENBQUFILE1BQ2pCLENBQUNJLE1BQTBCLENBQUMsQ0FBQUYsR0FDL0IsQ0FBQ0csTUFBZ0MsQ0FBQztRQUN4QzFCLFVBQVUsQ0FBQ29CLEtBQUssQ0FBQztNQUFBLENBQ2xCLENBQUM7SUFBQSxDQUNIO0lBQUFoQyxDQUFBLE1BQUEwQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBMUIsQ0FBQTtFQUFBO0VBdkJELE1BQUF1QyxpQkFBQSxHQUEwQmIsRUF1QnpCO0VBQUEsSUFBQWMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBekMsQ0FBQSxRQUFBeUIscUJBQUEsSUFBQXpCLENBQUEsUUFBQWUsV0FBQTtJQU9TeUIsRUFBQSxHQUFBQSxDQUFBO01BQ1IsSUFBSSxDQUFDekIsV0FBVztRQUdkSSxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQUE7TUFBQTtNQUdsQixNQUFBdUIsVUFBQSxHQUFtQixJQUFJQyxlQUFlLENBQUMsQ0FBQztNQUN4QyxNQUFBQyxRQUFBLEdBQWlCdEUsSUFBSSxDQUFBdUUsT0FBUSxDQUFDN0QsTUFBTSxDQUFDLENBQUMsRUFBRStCLFdBQVcsQ0FBQztNQUMvQzFCLGVBQWUsQ0FDbEJ1RCxRQUFRLEVBQ1IsQ0FBQyxFQUNEbkIscUJBQXFCLEVBQ3JCUixTQUFTLEVBQ1R5QixVQUFVLENBQUFJLE1BQ1osQ0FBQyxDQUFBaEIsSUFDTSxDQUFDaUIsQ0FBQTtRQUNKLElBQUlMLFVBQVUsQ0FBQUksTUFBTyxDQUFBRSxPQUFRO1VBQUE7UUFBQTtRQUM3QjdCLFVBQVUsQ0FBQztVQUFBN0MsSUFBQSxFQUFReUMsV0FBVztVQUFBa0MsT0FBQSxFQUFXRixDQUFDLENBQUFFO1FBQVMsQ0FBQyxDQUFDO01BQUEsQ0FDdEQsQ0FBQyxDQUFBQyxLQUNJLENBQUM7UUFDTCxJQUFJUixVQUFVLENBQUFJLE1BQU8sQ0FBQUUsT0FBUTtVQUFBO1FBQUE7UUFDN0I3QixVQUFVLENBQUM7VUFBQTdDLElBQUEsRUFBUXlDLFdBQVc7VUFBQWtDLE9BQUEsRUFBVztRQUF3QixDQUFDLENBQUM7TUFBQSxDQUNwRSxDQUFDO01BQUEsT0FDRyxNQUFNUCxVQUFVLENBQUFTLEtBQU0sQ0FBQyxDQUFDO0lBQUEsQ0FDaEM7SUFBRVYsRUFBQSxJQUFDMUIsV0FBVyxFQUFFVSxxQkFBcUIsQ0FBQztJQUFBekIsQ0FBQSxNQUFBeUIscUJBQUE7SUFBQXpCLENBQUEsTUFBQWUsV0FBQTtJQUFBZixDQUFBLE1BQUF3QyxFQUFBO0lBQUF4QyxDQUFBLE1BQUF5QyxFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBeEMsQ0FBQTtJQUFBeUMsRUFBQSxHQUFBekMsQ0FBQTtFQUFBO0VBekJ2Q3hCLFNBQVMsQ0FBQ2dFLEVBeUJULEVBQUVDLEVBQW9DLENBQUM7RUFFeEMsTUFBQVcsWUFBQSxHQUFxQjVCLGNBQWMsR0FDL0JuQixJQUFJLENBQUFFLEdBQUksQ0FBQyxFQUFFLEVBQUVGLElBQUksQ0FBQWdELEtBQU0sQ0FBQyxDQUFDbkQsT0FBTyxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQ3BCLENBQUMsR0FBekJHLElBQUksQ0FBQUUsR0FBSSxDQUFDLEVBQUUsRUFBRUwsT0FBTyxHQUFHLENBQUMsQ0FBQztFQUM3QixNQUFBb0QsWUFBQSxHQUFxQjlCLGNBQWMsR0FDL0JuQixJQUFJLENBQUFFLEdBQUksQ0FBQyxFQUFFLEVBQUVMLE9BQU8sR0FBR2tELFlBQVksR0FBRyxFQUM1QixDQUFDLEdBQVhsRCxPQUFPLEdBQUcsQ0FBQztFQUFBLElBQUFxRCxFQUFBO0VBQUEsSUFBQXZELENBQUEsUUFBQVAsTUFBQSxJQUFBTyxDQUFBLFFBQUFXLE9BQUEsQ0FBQTZDLE1BQUE7SUFFSUQsRUFBQSxHQUFBRSxHQUFBO01BQ2pCLE1BQUFDLE1BQUEsR0FBZXpFLHdCQUF3QixDQUFDWCxJQUFJLENBQUF1RSxPQUFRLENBQUM3RCxNQUFNLENBQUMsQ0FBQyxFQUFFMkUsR0FBQyxDQUFDLENBQUM7TUFDbEU1RSxRQUFRLENBQUMseUJBQXlCLEVBQUU7UUFBQTZFLFlBQUEsRUFDcEJqRCxPQUFPLENBQUE2QyxNQUFPO1FBQUFLLGFBQUEsRUFDYkg7TUFDakIsQ0FBQyxDQUFDO01BQ0ZqRSxNQUFNLENBQUMsQ0FBQztJQUFBLENBQ1Q7SUFBQU8sQ0FBQSxNQUFBUCxNQUFBO0lBQUFPLENBQUEsTUFBQVcsT0FBQSxDQUFBNkMsTUFBQTtJQUFBeEQsQ0FBQSxPQUFBdUQsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXZELENBQUE7RUFBQTtFQVBELE1BQUE4RCxVQUFBLEdBQW1CUCxFQU9sQjtFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBL0QsQ0FBQSxTQUFBUCxNQUFBLElBQUFPLENBQUEsU0FBQU4sUUFBQSxJQUFBTSxDQUFBLFNBQUFXLE9BQUEsQ0FBQTZDLE1BQUE7SUFFb0JPLEVBQUEsR0FBQUEsQ0FBQUMsR0FBQSxFQUFBQyxPQUFBO01BQ25CdkUsUUFBUSxDQUFDdUUsT0FBTyxHQUFQLElBQWNOLEdBQUMsR0FBYSxHQUE1QixHQUF3QkEsR0FBQyxHQUFHLENBQUM7TUFDdEM1RSxRQUFRLENBQUMseUJBQXlCLEVBQUU7UUFBQTZFLFlBQUEsRUFDcEJqRCxPQUFPLENBQUE2QyxNQUFPO1FBQUFTO01BRTlCLENBQUMsQ0FBQztNQUNGeEUsTUFBTSxDQUFDLENBQUM7SUFBQSxDQUNUO0lBQUFPLENBQUEsT0FBQVAsTUFBQTtJQUFBTyxDQUFBLE9BQUFOLFFBQUE7SUFBQU0sQ0FBQSxPQUFBVyxPQUFBLENBQUE2QyxNQUFBO0lBQUF4RCxDQUFBLE9BQUErRCxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBL0QsQ0FBQTtFQUFBO0VBUEQsTUFBQWtFLFlBQUEsR0FBcUJILEVBT3BCO0VBVW9CLE1BQUFJLEVBQUEsR0FBQTNDLGNBQWMsR0FBZCxPQUFtQyxHQUFuQyxRQUFtQztFQUFBLElBQUE0QyxHQUFBO0VBQUEsSUFBQXBFLENBQUEsU0FBQWtFLFlBQUE7SUFJN0NFLEdBQUE7TUFBQUMsTUFBQSxFQUFVLFNBQVM7TUFBQUMsT0FBQSxFQUFXQyxHQUFBLElBQUtMLFlBQVksQ0FBQ1AsR0FBQyxFQUFFLElBQUk7SUFBRSxDQUFDO0lBQUEzRCxDQUFBLE9BQUFrRSxZQUFBO0lBQUFsRSxDQUFBLE9BQUFvRSxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBcEUsQ0FBQTtFQUFBO0VBQUEsSUFBQXdFLEdBQUE7RUFBQSxJQUFBeEUsQ0FBQSxTQUFBa0UsWUFBQTtJQUNyRE0sR0FBQTtNQUFBSCxNQUFBLEVBQ0YsYUFBYTtNQUFBQyxPQUFBLEVBQ1pHLEdBQUEsSUFBS1AsWUFBWSxDQUFDUCxHQUFDLEVBQUUsS0FBSztJQUNyQyxDQUFDO0lBQUEzRCxDQUFBLE9BQUFrRSxZQUFBO0lBQUFsRSxDQUFBLE9BQUF3RSxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBeEUsQ0FBQTtFQUFBO0VBQUEsSUFBQTBFLEdBQUE7RUFBQSxJQUFBMUUsQ0FBQSxTQUFBb0QsWUFBQTtJQUlXc0IsR0FBQSxHQUFBQSxDQUFBQyxHQUFBLEVBQUFDLFNBQUEsS0FDVixDQUFDLElBQUksQ0FBUSxLQUFvQyxDQUFwQyxDQUFBQSxTQUFTLEdBQVQsWUFBb0MsR0FBcEMzRCxTQUFtQyxDQUFDLENBQzlDLENBQUEvQixrQkFBa0IsQ0FBQ3lFLEdBQUMsRUFBRVAsWUFBWSxFQUNyQyxFQUZDLElBQUksQ0FHTjtJQUFBcEQsQ0FBQSxPQUFBb0QsWUFBQTtJQUFBcEQsQ0FBQSxPQUFBMEUsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTFFLENBQUE7RUFBQTtFQUFBLElBQUE2RSxHQUFBO0VBQUEsSUFBQTdFLENBQUEsU0FBQWtCLE9BQUEsSUFBQWxCLENBQUEsU0FBQXNELFlBQUEsSUFBQXRELENBQUEsU0FBQWEsS0FBQTtJQUNjZ0UsR0FBQSxHQUFBQyxHQUFBLElBQ2I1RCxPQUFPLEdBQVAsRUFFSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQ1gsQ0FBQWhDLGtCQUFrQixDQUFDeUUsR0FBQyxFQUFFTCxZQUFZLEVBQ2xDLENBQUFwQyxPQUFPLENBQUE1QyxJQUFLLEtBQUtxRixHQUFzQixHQUF2QyxxQkFBdUMsR0FBdkMsRUFBc0MsQ0FDekMsRUFIQyxJQUFJLENBSUosQ0FBQXpDLE9BQU8sQ0FBQStCLE9BQVEsQ0FBQThCLEtBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTVDLEdBQUksQ0FBQyxDQUFBNkMsSUFBQSxFQUFBQyxHQUFBLEtBQy9CLENBQUMsSUFBSSxDQUFNQyxHQUFDLENBQURBLElBQUEsQ0FBQyxDQUNULENBQUE5RixjQUFjLENBQUNELGVBQWUsQ0FBQzZGLElBQUksRUFBRTFCLFlBQVksQ0FBQyxFQUFFekMsS0FBSyxFQUM1RCxFQUZDLElBQUksQ0FHTixFQUFDLEdBSUwsR0FEQyxDQUFDLFlBQVksQ0FBUyxPQUFrQixDQUFsQix3QkFBaUIsQ0FBQyxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsR0FDbEQ7SUFBQWIsQ0FBQSxPQUFBa0IsT0FBQTtJQUFBbEIsQ0FBQSxPQUFBc0QsWUFBQTtJQUFBdEQsQ0FBQSxPQUFBYSxLQUFBO0lBQUFiLENBQUEsT0FBQTZFLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUE3RSxDQUFBO0VBQUE7RUFBQSxJQUFBbUYsR0FBQTtFQUFBLElBQUFuRixDQUFBLFNBQUE4RCxVQUFBLElBQUE5RCxDQUFBLFNBQUFQLE1BQUEsSUFBQU8sQ0FBQSxTQUFBVyxPQUFBLElBQUFYLENBQUEsU0FBQW9FLEdBQUEsSUFBQXBFLENBQUEsU0FBQXdFLEdBQUEsSUFBQXhFLENBQUEsU0FBQTBFLEdBQUEsSUFBQTFFLENBQUEsU0FBQTZFLEdBQUEsSUFBQTdFLENBQUEsU0FBQW1FLEVBQUEsSUFBQW5FLENBQUEsU0FBQUksY0FBQTtJQXZDTCtFLEdBQUEsSUFBQyxXQUFXLENBQ0osS0FBWSxDQUFaLFlBQVksQ0FDTixXQUF1QixDQUF2Qiw2QkFBc0IsQ0FBQyxDQUM1QnhFLEtBQU8sQ0FBUEEsUUFBTSxDQUFDLENBQ04sTUFBTSxDQUFOLENBQUF5RSxNQUFLLENBQUMsQ0FDQWhGLFlBQWMsQ0FBZEEsZUFBYSxDQUFDLENBQ2xCLFNBQUksQ0FBSixJQUFJLENBQ0csZUFBbUMsQ0FBbkMsQ0FBQStELEVBQWtDLENBQUMsQ0FDckM1QixhQUFpQixDQUFqQkEsa0JBQWdCLENBQUMsQ0FDdkJ2QixPQUFjLENBQWRBLGVBQWEsQ0FBQyxDQUNiOEMsUUFBVSxDQUFWQSxXQUFTLENBQUMsQ0FDYixLQUEwRCxDQUExRCxDQUFBTSxHQUF5RCxDQUFDLENBQ3JELFVBR1gsQ0FIVyxDQUFBSSxHQUdaLENBQUMsQ0FDUy9FLFFBQU0sQ0FBTkEsT0FBSyxDQUFDLENBQ0YsWUFBMEQsQ0FBMUQsQ0FBQTRGLE1BQXlELENBQUMsQ0FDM0QsWUFBZ0IsQ0FBaEIsZ0JBQWdCLENBQ2pCLFVBSVgsQ0FKVyxDQUFBWCxHQUlaLENBQUMsQ0FDYyxhQWVaLENBZlksQ0FBQUcsR0FlYixDQUFDLEdBRUg7SUFBQTdFLENBQUEsT0FBQThELFVBQUE7SUFBQTlELENBQUEsT0FBQVAsTUFBQTtJQUFBTyxDQUFBLE9BQUFXLE9BQUE7SUFBQVgsQ0FBQSxPQUFBb0UsR0FBQTtJQUFBcEUsQ0FBQSxPQUFBd0UsR0FBQTtJQUFBeEUsQ0FBQSxPQUFBMEUsR0FBQTtJQUFBMUUsQ0FBQSxPQUFBNkUsR0FBQTtJQUFBN0UsQ0FBQSxPQUFBbUUsRUFBQTtJQUFBbkUsQ0FBQSxPQUFBSSxjQUFBO0lBQUFKLENBQUEsT0FBQW1GLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFuRixDQUFBO0VBQUE7RUFBQSxPQXpDRm1GLEdBeUNFO0FBQUE7QUF2SkMsU0FBQUUsT0FBQUMsR0FBQTtFQUFBLE9BK0htQjNELEdBQUMsR0FBRCxtQkFBbUQsR0FBbkQsOEJBQW1EO0FBQUE7QUEvSHRFLFNBQUF5RCxPQUFBRyxHQUFBO0VBQUEsT0FrSFk1QixHQUFDO0FBQUE7QUFsSGIsU0FBQXJCLE9BQUFrRCxHQUFBO0VBQUEsT0ErQ1c3QixHQUFDLENBQUFvQixLQUFNLENBQUN6RyxJQUFJLENBQUFtSCxHQUFJLENBQUMsQ0FBQUMsSUFBSyxDQUFDLEdBQUcsQ0FBQztBQUFBO0FBL0N0QyxTQUFBckQsT0FBQXNCLENBQUE7RUFBQSxPQThDYyxDQUFDQSxDQUFDLENBQUFnQyxRQUFTLENBQUNySCxJQUFJLENBQUFtSCxHQUFJLENBQUM7QUFBQTtBQTlDbkMsU0FBQXJELE9BQUF3RCxHQUFBO0VBQUEsT0E2Q1dWLEdBQUMsQ0FBQVcsV0FBWTtBQUFBO0FBN0N4QixTQUFBM0QsTUFBQWdELENBQUE7RUFBQSxPQTRDY0EsQ0FBQyxDQUFBWSxFQUFHLENBQUFDLFVBQVcsQ0FBQyxPQUFPLENBQUM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==