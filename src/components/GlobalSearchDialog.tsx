// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { resolve as resolvePath } from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react';
// 引入 useRegisterOverlay，将 ../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterOverlay } from '../context/overlayContext.js';
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
// 复用 relativePath 工具函数，把通用处理留在 ../utils/permissions/filesystem.js 中维护。
import { relativePath } from '../utils/permissions/filesystem.js';
// 复用 readFileInRange 工具函数，把通用处理留在 ../utils/readFileInRange.js 中维护。
import { readFileInRange } from '../utils/readFileInRange.js';
// 复用 ripGrepStream 工具函数，把通用处理留在 ../utils/ripgrep.js 中维护。
import { ripGrepStream } from '../utils/ripgrep.js';
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
// Match 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Match = {
  file: string;
  line: number;
  text: string;
};
// VISIBLE_RESULTS 集合 命名 `12`，让后续代码直接表达这个值的用途。
const VISIBLE_RESULTS = 12;
// DEBOUNCE_MS 集合保存`100`，供后续判断或组装使用。
const DEBOUNCE_MS = 100;
// PREVIEW_CONTEXT_LINES 集合 命名 `4`，让后续代码直接表达这个值的用途。
const PREVIEW_CONTEXT_LINES = 4;
// rg -m is per-file; we also cap the parsed array to keep memory bounded.
// MAX_MATCHES_PER_FILE 文件数据 命名 `10`，让后续代码直接表达这个值的用途。
const MAX_MATCHES_PER_FILE = 10;
// MAX_TOTAL_MATCHES 集合 命名 `500`，让后续代码直接表达这个值的用途。
const MAX_TOTAL_MATCHES = 500;

/**
 * Global Search dialog (ctrl+shift+f / cmd+shift+f).
 * Debounced ripgrep search across the workspace.
 */
// GlobalSearchDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function GlobalSearchDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(40);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    onInsert
  } = t0;
  // 调用 useRegisterOverlay，触发终端渲染此处需要的副作用。
  useRegisterOverlay("global-search");
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns,
    rows
  } = useTerminalSize();
  // previewOnRight保存`columns >= 140`，供终端 UI Global Search Dialog后续判断或输出使用。
  const previewOnRight = columns >= 140;
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
  // matches 集合 由 React state 持有，setMatches 会在用户操作或异步结果返回时触发刷新。
  const [matches, setMatches] = useState(t1);
  // truncated 由 React state 持有，setTruncated 会在用户操作或异步结果返回时触发刷新。
  const [truncated, setTruncated] = useState(false);
  // isSearching 由 React state 持有，setIsSearching 会在用户操作或异步结果返回时触发刷新。
  const [isSearching, setIsSearching] = useState(false);
  // query 由 React state 持有，setQuery 会在用户操作或异步结果返回时触发刷新。
  const [query, setQuery] = useState("");
  // focused 由 React state 持有，setFocused 会在用户操作或异步结果返回时触发刷新。
  const [focused, setFocused] = useState(undefined);
  // preview 由 React state 持有，setPreview 会在用户操作或异步结果返回时触发刷新。
  const [preview, setPreview] = useState(null);
  // abortRef 引用保存`useRef`，供终端渲染后续处理使用。
  const abortRef = useRef(null);
  // timeoutRef 引用保存`useRef`，供终端渲染后续处理使用。
  const timeoutRef = useRef(null);
  // t2 暂存 `() => () => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => () => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => () => {
      // 满足 `timeoutRef.current` 时，终端渲染执行该分支。
      if (timeoutRef.current) {
        // 调用 clearTimeout，触发终端渲染此处需要的副作用。
        clearTimeout(timeoutRef.current);
      }
      // 调用 abortRef.current?.abort();，完成这一处局部操作。
      abortRef.current?.abort();
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
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== focused) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // focused缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!focused) {
        // setPreview 写入新的状态值，使终端渲染后续读取保持一致。
        setPreview(null);
        // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // controller保存`AbortController`，供终端渲染后续处理使用。
      const controller = new AbortController();
      // absolute读取`resolvePath`，供终端渲染后续处理使用。
      const absolute = resolvePath(getCwd(), focused.file);
      // start保存`Math.max`，供终端渲染后续处理使用。
      const start = Math.max(0, focused.line - PREVIEW_CONTEXT_LINES - 1);
      // 调用 readFileInRange，触发终端渲染此处需要的副作用。
      readFileInRange(absolute, start, PREVIEW_CONTEXT_LINES * 2 + 1, undefined, controller.signal).then(r => {
        // 满足 `controller.signal.aborted` 时，终端渲染执行该分支。
        if (controller.signal.aborted) {
          // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setPreview 写入新的状态值，使终端渲染后续读取保持一致。
        setPreview({
          file: focused.file,
          line: focused.line,
          content: r.content
        });
      // 这个回调绑定到 }).catch(() => {，负责终端渲染在该局部场景下的响应。
      }).catch(() => {
        // 满足 `controller.signal.aborted` 时，终端渲染执行该分支。
        if (controller.signal.aborted) {
          // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setPreview 写入新的状态值，使终端渲染后续读取保持一致。
        setPreview({
          file: focused.file,
          line: focused.line,
          content: "(preview unavailable)"
        });
      });
      // 返回 `() => controller.abort()`，作为终端渲染这次计算的结果。
      return () => controller.abort();
    };
    // t5 暂存 `[focused]` 生成的渲染片段，后续返回路径直接复用。
    t5 = [focused];
    // $[3] 缓存 `focused`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = focused;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t4, t5);
  // t6 暂存 `q => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `q => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = q => {
      // setQuery 写入新的状态值，使终端渲染后续读取保持一致。
      setQuery(q);
      // 满足 `timeoutRef.current` 时，终端渲染执行该分支。
      if (timeoutRef.current) {
        // 调用 clearTimeout，触发终端渲染此处需要的副作用。
        clearTimeout(timeoutRef.current);
      }
      // 调用 abortRef.current?.abort();，完成这一处局部操作。
      abortRef.current?.abort();
      // 满足 `!q.trim()` 时，终端渲染执行该分支。
      if (!q.trim()) {
        // setMatches 写入新的状态值，使终端渲染后续读取保持一致。
        setMatches(_temp);
        // setIsSearching 写入新的状态值，使终端渲染后续读取保持一致。
        setIsSearching(false);
        // setTruncated 写入新的状态值，使终端渲染后续读取保持一致。
        setTruncated(false);
        // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // controller_0保存`AbortController`，供终端渲染后续处理使用。
      const controller_0 = new AbortController();
      // current更新为 `controller_0`，确保终端 UI后续读取最新状态。
      abortRef.current = controller_0;
      // setIsSearching 写入新的状态值，使终端渲染后续读取保持一致。
      setIsSearching(true);
      // setTruncated 写入新的状态值，使终端渲染后续读取保持一致。
      setTruncated(false);
      // queryLower保存`q.toLowerCase`，供终端渲染后续处理使用。
      const queryLower = q.toLowerCase();
      // setMatches 写入新的状态值，使终端渲染后续读取保持一致。
      setMatches(m_0 => {
        // filtered筛选`m_0.filter`，供终端渲染后续处理使用。
        const filtered = m_0.filter(match => match.text.toLowerCase().includes(queryLower));
        // 返回 `filtered.length === m_0.length ? m_0 : filtered`，作为终端渲染这次计算的结果。
        return filtered.length === m_0.length ? m_0 : filtered;
      });
      // current更新为 `setTimeout(_temp4, DEBOUNCE_MS, q, controller_0, setMatch...`，确保终端 UI后续读取最新状态。
      timeoutRef.current = setTimeout(_temp4, DEBOUNCE_MS, q, controller_0, setMatches, setTruncated, setIsSearching);
    };
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[6];
  }
  // handleQueryChange沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleQueryChange = t6;
  // listWidth 集合保存`Math.floor`，供终端渲染后续处理使用。
  const listWidth = previewOnRight ? Math.floor((columns - 10) * 0.5) : columns - 8;
  // maxPathWidth 路径数据保存`Math.max`，供终端渲染后续处理使用。
  const maxPathWidth = Math.max(20, Math.floor(listWidth * 0.4));
  // maxTextWidth保存`Math.max`，供终端渲染后续处理使用。
  const maxTextWidth = Math.max(20, listWidth - maxPathWidth - 4);
  // previewWidth保存`Math.max`，供终端渲染后续处理使用。
  const previewWidth = previewOnRight ? Math.max(40, columns - listWidth - 14) : columns - 6;
  // t7 暂存 `m_3 => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== matches.length || $[8] !== onDone) {
    // t7 暂存 `m_3 => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = m_3 => {
      // opened保存`openFileInExternalEditor`，供终端渲染后续处理使用。
      const opened = openFileInExternalEditor(resolvePath(getCwd(), m_3.file), m_3.line);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_global_search_select", {
        result_count: matches.length,
        opened_editor: opened
      });
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[7] 缓存 `matches.length`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = matches.length;
    // $[8] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onDone;
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // handleOpen 命名 `t7`，让后续代码直接表达这个值的用途。
  const handleOpen = t7;
  // t8 暂存 `(m_4, mention) => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== matches.length || $[11] !== onDone || $[12] !== onInsert) {
    // t8 暂存 `(m_4, mention) => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = (m_4, mention) => {
      // 调用 onInsert，触发终端渲染此处需要的副作用。
      onInsert(mention ? `@${m_4.file}#L${m_4.line} ` : `${m_4.file}:${m_4.line} `);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_global_search_insert", {
        result_count: matches.length,
        mention
      });
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[10] 缓存 `matches.length`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = matches.length;
    // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onDone;
    // $[12] 缓存 `onInsert`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onInsert;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // handleInsert 命名 `t8`，让后续代码直接表达这个值的用途。
  const handleInsert = t8;
  // matchLabel 命名 `matches.length > 0 ? `${matches.length}${truncated ? "+" ...`，让后续代码直接表达这个值的用途。
  const matchLabel = matches.length > 0 ? `${matches.length}${truncated ? "+" : ""} matches${isSearching ? "\u2026" : ""}` : " ";
  // 临时值 t9 命名 `previewOnRight ? "right" : "bottom"`，让后续代码直接表达这个值的用途。
  const t9 = previewOnRight ? "right" : "bottom";
  // t10 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== handleInsert) {
    // t10 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t10 = {
      action: "mention",
      // 这个回调绑定到 handler: m_5 => handleInsert(m_5, true)，负责终端渲染在该局部场景下的响应。
      handler: m_5 => handleInsert(m_5, true)
    };
    // $[14] 缓存 `handleInsert`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = handleInsert;
    // $[15] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[15];
  }
  // t11 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== handleInsert) {
    // t11 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t11 = {
      action: "insert path",
      // 这个回调绑定到 handler: m_6 => handleInsert(m_6, false)，负责终端渲染在该局部场景下的响应。
      handler: m_6 => handleInsert(m_6, false)
    };
    // $[16] 缓存 `handleInsert`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = handleInsert;
    // $[17] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[17];
  }
  // t12 暂存 `q_0 => isSearching ? "Searching\u2026" : q_0 ? "No matche...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== isSearching) {
    // t12 暂存 `q_0 => isSearching ? "Searching\u2026" : q_0 ? "No matche...` 生成的渲染片段，后续返回路径直接复用。
    t12 = q_0 => isSearching ? "Searching\u2026" : q_0 ? "No matches" : "Type to search\u2026";
    // $[18] 缓存 `isSearching`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = isSearching;
    // $[19] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[19];
  }
  // t13 暂存 `(m_7, isFocused) => <Text color={isFocused ? "suggestion"...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== maxPathWidth || $[21] !== maxTextWidth || $[22] !== query) {
    // t13 暂存 `(m_7, isFocused) => <Text color={isFocused ? "suggestion"...` 生成的渲染片段，后续返回路径直接复用。
    t13 = (m_7, isFocused) => <Text color={isFocused ? "suggestion" : undefined}><Text dimColor={true}>{truncatePathMiddle(m_7.file, maxPathWidth)}:{m_7.line}</Text>{" "}{highlightMatch(truncateToWidth(m_7.text.trimStart(), maxTextWidth), query)}</Text>;
    // $[20] 缓存 `maxPathWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = maxPathWidth;
    // $[21] 缓存 `maxTextWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = maxTextWidth;
    // $[22] 缓存 `query`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = query;
    // $[23] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[23];
  }
  // t14 暂存 `m_8 => preview?.file === m_8.file && preview.line === m_8...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== preview || $[25] !== previewWidth || $[26] !== query) {
    // t14 暂存 `m_8 => preview?.file === m_8.file && preview.line === m_8...` 生成的渲染片段，后续返回路径直接复用。
    t14 = m_8 => preview?.file === m_8.file && preview.line === m_8.line ? <><Text dimColor={true}>{truncatePathMiddle(m_8.file, previewWidth)}:{m_8.line}</Text>{preview.content.split("\n").map((line_0, i) => <Text key={i}>{highlightMatch(truncateToWidth(line_0, previewWidth), query)}</Text>)}</> : <LoadingState message={"Loading\u2026"} dimColor={true} />;
    // $[24] 缓存 `preview`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = preview;
    // $[25] 缓存 `previewWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = previewWidth;
    // $[26] 缓存 `query`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = query;
    // $[27] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[27];
  }
  // t15 暂存 `<FuzzyPicker title="Global Search" placeholder={"Type to ...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== handleOpen || $[29] !== matchLabel || $[30] !== matches || $[31] !== onDone || $[32] !== t10 || $[33] !== t11 || $[34] !== t12 || $[35] !== t13 || $[36] !== t14 || $[37] !== t9 || $[38] !== visibleResults) {
    // t15 暂存 `<FuzzyPicker title="Global Search" placeholder={"Type to ...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <FuzzyPicker title="Global Search" placeholder={"Type to search\u2026"} items={matches} getKey={matchKey} visibleCount={visibleResults} direction="up" previewPosition={t9} onQueryChange={handleQueryChange} onFocus={setFocused} onSelect={handleOpen} onTab={t10} onShiftTab={t11} onCancel={onDone} emptyMessage={t12} matchLabel={matchLabel} selectAction="open in editor" renderItem={t13} renderPreview={t14} />;
    // $[28] 缓存 `handleOpen`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = handleOpen;
    // $[29] 缓存 `matchLabel`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = matchLabel;
    // $[30] 缓存 `matches`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = matches;
    // $[31] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = onDone;
    // $[32] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t10;
    // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t11;
    // $[34] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t12;
    // $[35] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t13;
    // $[36] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t14;
    // $[37] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t9;
    // $[38] 缓存 `visibleResults`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = visibleResults;
    // $[39] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[39];
  }
  // 返回 `t15`，作为终端渲染这次计算的结果。
  return t15;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(query_0, controller_1, setMatches_0, setTruncated_0, setIsSearching_0) {
  // cwd读取`getCwd`，供终端渲染后续处理使用。
  const cwd = getCwd();
  // collected 命名 `0`，让后续代码直接表达这个值的用途。
  let collected = 0;
  // 调用 ripGrepStream，触发终端渲染此处需要的副作用。
  ripGrepStream(["-n", "--no-heading", "-i", "-m", String(MAX_MATCHES_PER_FILE), "-F", "-e", query_0], cwd, controller_1.signal, lines => {
    // 满足 `controller_1.signal.aborted` 时，终端渲染执行该分支。
    if (controller_1.signal.aborted) {
      // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 解析结果 从空数组开始收集，后续循环会按处理顺序追加条目。
    const parsed = [];
    // 按顺序遍历 `lines` 中的line，逐个交给终端渲染处理。
    for (const line of lines) {
      // m_1解析`parseRipgrepLine`，供终端渲染后续处理使用。
      const m_1 = parseRipgrepLine(line);
      // m_1缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!m_1) {
        // 跳过当前项，继续处理终端渲染中的下一轮循环。
        continue;
      }
      // rel保存`relativePath`，供终端渲染后续处理使用。
      const rel = relativePath(cwd, m_1.file);
      // 解析结果追加新条目，保持收集顺序与输入顺序一致。
      parsed.push({
        ...m_1,
        file: rel.startsWith("..") ? m_1.file : rel
      });
    }
    // parsed.length 数量缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!parsed.length) {
      // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // collected更新为 `collected + parsed.length`，确保终端 UI后续读取最新状态。
    collected = collected + parsed.length;
    // 终端 UI 组件 Global Search Dialog在这里处理 `collected`，完成这一小步状态转换。
    collected;
    // setMatches_0 写入新的状态值，使终端渲染后续读取保持一致。
    setMatches_0(prev => {
      // seen保存`Set`，供终端渲染后续处理使用。
      const seen = new Set(prev.map(matchKey));
      // fresh解析`parsed.filter`，供终端渲染后续处理使用。
      const fresh = parsed.filter(p => !seen.has(matchKey(p)));
      // fresh.length 数量缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!fresh.length) {
        // 返回 `prev`，作为终端渲染这次计算的结果。
        return prev;
      }
      // next保存`prev.concat`，供终端渲染后续处理使用。
      const next = prev.concat(fresh);
      // 返回 `next.length > MAX_TOTAL_MATCHES ? next.slice(0, MAX_TOTAL_MATCHES) : ne...`，作为终端渲染这次计算的结果。
      return next.length > MAX_TOTAL_MATCHES ? next.slice(0, MAX_TOTAL_MATCHES) : next;
    });
    // 满足 `collected >= MAX_TOTAL_MATCHES` 时，终端渲染执行该分支。
    if (collected >= MAX_TOTAL_MATCHES) {
      // 触发取消信号，通知终端渲染中仍在等待的异步任务尽快停止。
      controller_1.abort();
      // setTruncated_0 写入新的状态值，使终端渲染后续读取保持一致。
      setTruncated_0(true);
      // setIsSearching_0 写入新的状态值，使终端渲染后续读取保持一致。
      setIsSearching_0(false);
    }
  // 这个回调绑定到 }).catch(_temp2).finally(() => {，负责终端渲染在该局部场景下的响应。
  }).catch(_temp2).finally(() => {
    // 满足 `controller_1.signal.aborted` 时，终端渲染执行该分支。
    if (controller_1.signal.aborted) {
      // 终端 UI 组件 Global Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 满足 `collected === 0` 时，终端渲染执行该分支。
    if (collected === 0) {
      // setMatches_0 写入新的状态值，使终端渲染后续读取保持一致。
      setMatches_0(_temp3);
    }
    // setIsSearching_0 写入新的状态值，使终端渲染后续读取保持一致。
    setIsSearching_0(false);
  });
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(m_2) {
  // 返回 `m_2.length ? [] : m_2`，作为终端渲染这次计算的结果。
  return m_2.length ? [] : m_2;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2() {}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(m) {
  // 返回 `m.length ? [] : m`，作为终端渲染这次计算的结果。
  return m.length ? [] : m;
}
// matchKey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function matchKey(m: Match): string {
  // 返回 ``${m.file}:${m.line}``，作为终端渲染这次计算的结果。
  return `${m.file}:${m.line}`;
}

/**
 * Parse a ripgrep -n --no-heading output line: "path:line:text".
 * Windows paths may contain a drive letter ("C:\..."), so a simple split on
 * the first colon would mangle the path — use a regex that captures up to
 * the first :<digits>: instead.
 * @internal exported for testing
 */
// parseRipgrepLine 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseRipgrepLine(line: string): Match | null {
  // m保存`exec`，供终端渲染后续处理使用。
  const m = /^(.*?):(\d+):(.*)$/.exec(line);
  // m缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!m) return null;
  // 从 `m` 按位置拆出 file、lineStr、text，让终端 UI 组件 Global Search Dialog分别处理这些返回值。
  const [, file, lineStr, text] = m;
  // lineNum保存`Number`，供终端渲染后续处理使用。
  const lineNum = Number(lineStr);
  // 只有 `!file || !Number.isFinite(lineNum)` 满足时，终端渲染才执行该分支。
  if (!file || !Number.isFinite(lineNum)) return null;
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    file,
    line: lineNum,
    text: text ?? ''
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZXNvbHZlIiwicmVzb2x2ZVBhdGgiLCJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwidXNlUmVnaXN0ZXJPdmVybGF5IiwidXNlVGVybWluYWxTaXplIiwiVGV4dCIsImxvZ0V2ZW50IiwiZ2V0Q3dkIiwib3BlbkZpbGVJbkV4dGVybmFsRWRpdG9yIiwidHJ1bmNhdGVQYXRoTWlkZGxlIiwidHJ1bmNhdGVUb1dpZHRoIiwiaGlnaGxpZ2h0TWF0Y2giLCJyZWxhdGl2ZVBhdGgiLCJyZWFkRmlsZUluUmFuZ2UiLCJyaXBHcmVwU3RyZWFtIiwiRnV6enlQaWNrZXIiLCJMb2FkaW5nU3RhdGUiLCJQcm9wcyIsIm9uRG9uZSIsIm9uSW5zZXJ0IiwidGV4dCIsIk1hdGNoIiwiZmlsZSIsImxpbmUiLCJWSVNJQkxFX1JFU1VMVFMiLCJERUJPVU5DRV9NUyIsIlBSRVZJRVdfQ09OVEVYVF9MSU5FUyIsIk1BWF9NQVRDSEVTX1BFUl9GSUxFIiwiTUFYX1RPVEFMX01BVENIRVMiLCJHbG9iYWxTZWFyY2hEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsImNvbHVtbnMiLCJyb3dzIiwicHJldmlld09uUmlnaHQiLCJ2aXNpYmxlUmVzdWx0cyIsIk1hdGgiLCJtaW4iLCJtYXgiLCJ0MSIsIlN5bWJvbCIsImZvciIsIm1hdGNoZXMiLCJzZXRNYXRjaGVzIiwidHJ1bmNhdGVkIiwic2V0VHJ1bmNhdGVkIiwiaXNTZWFyY2hpbmciLCJzZXRJc1NlYXJjaGluZyIsInF1ZXJ5Iiwic2V0UXVlcnkiLCJmb2N1c2VkIiwic2V0Rm9jdXNlZCIsInVuZGVmaW5lZCIsInByZXZpZXciLCJzZXRQcmV2aWV3IiwiYWJvcnRSZWYiLCJ0aW1lb3V0UmVmIiwidDIiLCJ0MyIsImN1cnJlbnQiLCJjbGVhclRpbWVvdXQiLCJhYm9ydCIsInQ0IiwidDUiLCJjb250cm9sbGVyIiwiQWJvcnRDb250cm9sbGVyIiwiYWJzb2x1dGUiLCJzdGFydCIsInNpZ25hbCIsInRoZW4iLCJyIiwiYWJvcnRlZCIsImNvbnRlbnQiLCJjYXRjaCIsInQ2IiwicSIsInRyaW0iLCJfdGVtcCIsImNvbnRyb2xsZXJfMCIsInF1ZXJ5TG93ZXIiLCJ0b0xvd2VyQ2FzZSIsIm1fMCIsImZpbHRlcmVkIiwibSIsImZpbHRlciIsIm1hdGNoIiwiaW5jbHVkZXMiLCJsZW5ndGgiLCJzZXRUaW1lb3V0IiwiX3RlbXA0IiwiaGFuZGxlUXVlcnlDaGFuZ2UiLCJsaXN0V2lkdGgiLCJmbG9vciIsIm1heFBhdGhXaWR0aCIsIm1heFRleHRXaWR0aCIsInByZXZpZXdXaWR0aCIsInQ3IiwibV8zIiwib3BlbmVkIiwicmVzdWx0X2NvdW50Iiwib3BlbmVkX2VkaXRvciIsImhhbmRsZU9wZW4iLCJ0OCIsIm1fNCIsIm1lbnRpb24iLCJoYW5kbGVJbnNlcnQiLCJtYXRjaExhYmVsIiwidDkiLCJ0MTAiLCJhY3Rpb24iLCJoYW5kbGVyIiwibV81IiwidDExIiwibV82IiwidDEyIiwicV8wIiwidDEzIiwibV83IiwiaXNGb2N1c2VkIiwidHJpbVN0YXJ0IiwidDE0IiwibV84Iiwic3BsaXQiLCJtYXAiLCJsaW5lXzAiLCJpIiwidDE1IiwibWF0Y2hLZXkiLCJxdWVyeV8wIiwiY29udHJvbGxlcl8xIiwic2V0TWF0Y2hlc18wIiwic2V0VHJ1bmNhdGVkXzAiLCJzZXRJc1NlYXJjaGluZ18wIiwiY3dkIiwiY29sbGVjdGVkIiwiU3RyaW5nIiwibGluZXMiLCJwYXJzZWQiLCJtXzEiLCJwYXJzZVJpcGdyZXBMaW5lIiwicmVsIiwicHVzaCIsInN0YXJ0c1dpdGgiLCJwcmV2Iiwic2VlbiIsIlNldCIsImZyZXNoIiwicCIsImhhcyIsIm5leHQiLCJjb25jYXQiLCJzbGljZSIsIl90ZW1wMiIsImZpbmFsbHkiLCJfdGVtcDMiLCJtXzIiLCJleGVjIiwibGluZVN0ciIsImxpbmVOdW0iLCJOdW1iZXIiLCJpc0Zpbml0ZSJdLCJzb3VyY2VzIjpbIkdsb2JhbFNlYXJjaERpYWxvZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVzb2x2ZSBhcyByZXNvbHZlUGF0aCB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlUmVnaXN0ZXJPdmVybGF5IH0gZnJvbSAnLi4vY29udGV4dC9vdmVybGF5Q29udGV4dC5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IGdldEN3ZCB9IGZyb20gJy4uL3V0aWxzL2N3ZC5qcydcbmltcG9ydCB7IG9wZW5GaWxlSW5FeHRlcm5hbEVkaXRvciB9IGZyb20gJy4uL3V0aWxzL2VkaXRvci5qcydcbmltcG9ydCB7IHRydW5jYXRlUGF0aE1pZGRsZSwgdHJ1bmNhdGVUb1dpZHRoIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgaGlnaGxpZ2h0TWF0Y2ggfSBmcm9tICcuLi91dGlscy9oaWdobGlnaHRNYXRjaC5qcydcbmltcG9ydCB7IHJlbGF0aXZlUGF0aCB9IGZyb20gJy4uL3V0aWxzL3Blcm1pc3Npb25zL2ZpbGVzeXN0ZW0uanMnXG5pbXBvcnQgeyByZWFkRmlsZUluUmFuZ2UgfSBmcm9tICcuLi91dGlscy9yZWFkRmlsZUluUmFuZ2UuanMnXG5pbXBvcnQgeyByaXBHcmVwU3RyZWFtIH0gZnJvbSAnLi4vdXRpbHMvcmlwZ3JlcC5qcydcbmltcG9ydCB7IEZ1enp5UGlja2VyIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0Z1enp5UGlja2VyLmpzJ1xuaW1wb3J0IHsgTG9hZGluZ1N0YXRlIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0xvYWRpbmdTdGF0ZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Eb25lOiAoKSA9PiB2b2lkXG4gIG9uSW5zZXJ0OiAodGV4dDogc3RyaW5nKSA9PiB2b2lkXG59XG5cbnR5cGUgTWF0Y2ggPSB7XG4gIGZpbGU6IHN0cmluZ1xuICBsaW5lOiBudW1iZXJcbiAgdGV4dDogc3RyaW5nXG59XG5cbmNvbnN0IFZJU0lCTEVfUkVTVUxUUyA9IDEyXG5jb25zdCBERUJPVU5DRV9NUyA9IDEwMFxuY29uc3QgUFJFVklFV19DT05URVhUX0xJTkVTID0gNFxuLy8gcmcgLW0gaXMgcGVyLWZpbGU7IHdlIGFsc28gY2FwIHRoZSBwYXJzZWQgYXJyYXkgdG8ga2VlcCBtZW1vcnkgYm91bmRlZC5cbmNvbnN0IE1BWF9NQVRDSEVTX1BFUl9GSUxFID0gMTBcbmNvbnN0IE1BWF9UT1RBTF9NQVRDSEVTID0gNTAwXG5cbi8qKlxuICogR2xvYmFsIFNlYXJjaCBkaWFsb2cgKGN0cmwrc2hpZnQrZiAvIGNtZCtzaGlmdCtmKS5cbiAqIERlYm91bmNlZCByaXBncmVwIHNlYXJjaCBhY3Jvc3MgdGhlIHdvcmtzcGFjZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEdsb2JhbFNlYXJjaERpYWxvZyh7XG4gIG9uRG9uZSxcbiAgb25JbnNlcnQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHVzZVJlZ2lzdGVyT3ZlcmxheSgnZ2xvYmFsLXNlYXJjaCcpXG4gIGNvbnN0IHsgY29sdW1ucywgcm93cyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgcHJldmlld09uUmlnaHQgPSBjb2x1bW5zID49IDE0MFxuICAvLyBDaHJvbWUgKHRpdGxlICsgc2VhcmNoICsgbWF0Y2hMYWJlbCArIGhpbnRzICsgcGFuZSBib3JkZXIgKyBnYXBzKSBlYXRzXG4gIC8vIH4xNCByb3dzLiBTaHJpbmsgdGhlIGxpc3Qgb24gc2hvcnQgdGVybWluYWxzIHNvIHRoZSBkaWFsb2cgZG9lc24ndCBjbGlwLlxuICBjb25zdCB2aXNpYmxlUmVzdWx0cyA9IE1hdGgubWluKFZJU0lCTEVfUkVTVUxUUywgTWF0aC5tYXgoNCwgcm93cyAtIDE0KSlcblxuICBjb25zdCBbbWF0Y2hlcywgc2V0TWF0Y2hlc10gPSB1c2VTdGF0ZTxNYXRjaFtdPihbXSlcbiAgY29uc3QgW3RydW5jYXRlZCwgc2V0VHJ1bmNhdGVkXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbaXNTZWFyY2hpbmcsIHNldElzU2VhcmNoaW5nXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbcXVlcnksIHNldFF1ZXJ5XSA9IHVzZVN0YXRlKCcnKVxuICBjb25zdCBbZm9jdXNlZCwgc2V0Rm9jdXNlZF0gPSB1c2VTdGF0ZTxNYXRjaCB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKVxuICBjb25zdCBbcHJldmlldywgc2V0UHJldmlld10gPSB1c2VTdGF0ZTx7XG4gICAgZmlsZTogc3RyaW5nXG4gICAgbGluZTogbnVtYmVyXG4gICAgY29udGVudDogc3RyaW5nXG4gIH0gfCBudWxsPihudWxsKVxuICBjb25zdCBhYm9ydFJlZiA9IHVzZVJlZjxBYm9ydENvbnRyb2xsZXIgfCBudWxsPihudWxsKVxuICBjb25zdCB0aW1lb3V0UmVmID0gdXNlUmVmPFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbD4obnVsbClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAodGltZW91dFJlZi5jdXJyZW50KSBjbGVhclRpbWVvdXQodGltZW91dFJlZi5jdXJyZW50KVxuICAgICAgYWJvcnRSZWYuY3VycmVudD8uYWJvcnQoKVxuICAgIH1cbiAgfSwgW10pXG5cbiAgLy8gTG9hZCBjb250ZXh0IGxpbmVzIGFyb3VuZCB0aGUgZm9jdXNlZCBtYXRjaC4gQWJvcnRDb250cm9sbGVyIHByZXZlbnRzXG4gIC8vIGhvbGRpbmcg4oaTIGZyb20gcGlsaW5nIHVwIHJlYWRzLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZm9jdXNlZCkge1xuICAgICAgc2V0UHJldmlldyhudWxsKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgICBjb25zdCBhYnNvbHV0ZSA9IHJlc29sdmVQYXRoKGdldEN3ZCgpLCBmb2N1c2VkLmZpbGUpXG4gICAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBmb2N1c2VkLmxpbmUgLSBQUkVWSUVXX0NPTlRFWFRfTElORVMgLSAxKVxuICAgIHZvaWQgcmVhZEZpbGVJblJhbmdlKFxuICAgICAgYWJzb2x1dGUsXG4gICAgICBzdGFydCxcbiAgICAgIFBSRVZJRVdfQ09OVEVYVF9MSU5FUyAqIDIgKyAxLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgY29udHJvbGxlci5zaWduYWwsXG4gICAgKVxuICAgICAgLnRoZW4ociA9PiB7XG4gICAgICAgIGlmIChjb250cm9sbGVyLnNpZ25hbC5hYm9ydGVkKSByZXR1cm5cbiAgICAgICAgc2V0UHJldmlldyh7XG4gICAgICAgICAgZmlsZTogZm9jdXNlZC5maWxlLFxuICAgICAgICAgIGxpbmU6IGZvY3VzZWQubGluZSxcbiAgICAgICAgICBjb250ZW50OiByLmNvbnRlbnQsXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHJldHVyblxuICAgICAgICBzZXRQcmV2aWV3KHtcbiAgICAgICAgICBmaWxlOiBmb2N1c2VkLmZpbGUsXG4gICAgICAgICAgbGluZTogZm9jdXNlZC5saW5lLFxuICAgICAgICAgIGNvbnRlbnQ6ICcocHJldmlldyB1bmF2YWlsYWJsZSknLFxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICByZXR1cm4gKCkgPT4gY29udHJvbGxlci5hYm9ydCgpXG4gIH0sIFtmb2N1c2VkXSlcblxuICBjb25zdCBoYW5kbGVRdWVyeUNoYW5nZSA9IChxOiBzdHJpbmcpID0+IHtcbiAgICBzZXRRdWVyeShxKVxuICAgIGlmICh0aW1lb3V0UmVmLmN1cnJlbnQpIGNsZWFyVGltZW91dCh0aW1lb3V0UmVmLmN1cnJlbnQpXG4gICAgYWJvcnRSZWYuY3VycmVudD8uYWJvcnQoKVxuXG4gICAgaWYgKCFxLnRyaW0oKSkge1xuICAgICAgc2V0TWF0Y2hlcyhtID0+IChtLmxlbmd0aCA/IFtdIDogbSkpXG4gICAgICBzZXRJc1NlYXJjaGluZyhmYWxzZSlcbiAgICAgIHNldFRydW5jYXRlZChmYWxzZSlcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpXG4gICAgYWJvcnRSZWYuY3VycmVudCA9IGNvbnRyb2xsZXJcbiAgICBzZXRJc1NlYXJjaGluZyh0cnVlKVxuICAgIHNldFRydW5jYXRlZChmYWxzZSlcbiAgICAvLyBDbGllbnQtZmlsdGVyIGV4aXN0aW5nIHJlc3VsdHMgd2hpbGUgcmcgd2Fsa3Mg4oCUIGtlZXBzIHNvbWV0aGluZyBvblxuICAgIC8vIHNjcmVlbiBpbnN0ZWFkIG9mIGZsYXNoaW5nIGJsYW5rLiByZyByZXN1bHRzIGFyZSBtZXJnZWQgaW4gKGRlZHVwZWQgYnlcbiAgICAvLyBmaWxlOmxpbmUpIHJhdGhlciB0aGFuIHJlcGxhY2VkLCBzbyB0aGUgY291bnQgaXMgbW9ub3RvbmljIHdpdGhpbiBhXG4gICAgLy8gcXVlcnk6IGl0IG9ubHkgZ3Jvd3MgYXMgcmcgc3RyZWFtcywgbmV2ZXIgZGlwcyB0byB0aGUgZmlyc3QgY2h1bmsnc1xuICAgIC8vIHNpemUuIE5hcnJvd2luZyAobmV3IHF1ZXJ5IGV4dGVuZHMgb2xkKTogZmlsdGVyIGlzIGV4YWN0IOKAlCBhbnkgbGluZVxuICAgIC8vIHRoYXQgbWF0Y2hlZCB0aGUgb2xkIC1GIC1pIGxpdGVyYWwgY29udGFpbnMgdGhlIG5ldyBvbmUgaWZmIGl0cyB0ZXh0XG4gICAgLy8gaW5jbHVkZXMgdGhlIG5ldyBxdWVyeSBsb3dlcmVkLiBOb24tbmFycm93aW5nIChicm9hZGVuaW5nL2RpZmZlcmVudCk6XG4gICAgLy8gZmlsdGVyIGlzIGJlc3QtZWZmb3J0IOKAlCBtYXkgYnJpZWZseSBzaG93IGEgc3Vic2V0IHVudGlsIHJnIGZpbGxzIGluXG4gICAgLy8gdGhlIHJlc3QuXG4gICAgY29uc3QgcXVlcnlMb3dlciA9IHEudG9Mb3dlckNhc2UoKVxuICAgIHNldE1hdGNoZXMobSA9PiB7XG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IG0uZmlsdGVyKG1hdGNoID0+XG4gICAgICAgIG1hdGNoLnRleHQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeUxvd2VyKSxcbiAgICAgIClcbiAgICAgIHJldHVybiBmaWx0ZXJlZC5sZW5ndGggPT09IG0ubGVuZ3RoID8gbSA6IGZpbHRlcmVkXG4gICAgfSlcblxuICAgIHRpbWVvdXRSZWYuY3VycmVudCA9IHNldFRpbWVvdXQoXG4gICAgICAocXVlcnksIGNvbnRyb2xsZXIsIHNldE1hdGNoZXMsIHNldFRydW5jYXRlZCwgc2V0SXNTZWFyY2hpbmcpID0+IHtcbiAgICAgICAgLy8gcmlwZ3JlcCBvdXRwdXRzIGFic29sdXRlIHBhdGhzIHdoZW4gZ2l2ZW4gYW4gYWJzb2x1dGUgdGFyZ2V0LCBzb1xuICAgICAgICAvLyByZWxhdGl2aXplIGFnYWluc3QgY3dkIHRvIHByZXNlcnZlIGRpcmVjdG9yeSBjb250ZXh0IGluIHRoZSB0cnVuY2F0ZWRcbiAgICAgICAgLy8gZGlzcGxheSAob3RoZXJ3aXNlIHRoZSBjd2QgcHJlZml4IGVhdHMgdGhlIHdpZHRoIGJ1ZGdldCkuXG4gICAgICAgIC8vIHJlbGF0aXZlUGF0aCgpIHJldHVybnMgUE9TSVgtbm9ybWFsaXplZCBvdXRwdXQgc28gdHJ1bmNhdGVQYXRoTWlkZGxlXG4gICAgICAgIC8vICh3aGljaCB1c2VzIGxhc3RJbmRleE9mKCcvJykpIHdvcmtzIG9uIFdpbmRvd3MgdG9vLlxuICAgICAgICBjb25zdCBjd2QgPSBnZXRDd2QoKVxuICAgICAgICBsZXQgY29sbGVjdGVkID0gMFxuICAgICAgICB2b2lkIHJpcEdyZXBTdHJlYW0oXG4gICAgICAgICAgLy8gLWUgZGlzYW1iaWd1YXRlcyBwYXR0ZXJuIGZyb20gb3B0aW9ucyB3aGVuIHRoZSBxdWVyeSBzdGFydHMgd2l0aCAnLSdcbiAgICAgICAgICAvLyAoZS5nLiBzZWFyY2hpbmcgZm9yIFwiLS12ZXJib3NlXCIgb3IgXCItcmZcIikuIFNlZSBHcmVwVG9vbC50cyBmb3IgdGhlXG4gICAgICAgICAgLy8gc2FtZSBwcmVjYXV0aW9uLlxuICAgICAgICAgIFtcbiAgICAgICAgICAgICctbicsXG4gICAgICAgICAgICAnLS1uby1oZWFkaW5nJyxcbiAgICAgICAgICAgICctaScsXG4gICAgICAgICAgICAnLW0nLFxuICAgICAgICAgICAgU3RyaW5nKE1BWF9NQVRDSEVTX1BFUl9GSUxFKSxcbiAgICAgICAgICAgICctRicsXG4gICAgICAgICAgICAnLWUnLFxuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgXSxcbiAgICAgICAgICBjd2QsXG4gICAgICAgICAgY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgICAgbGluZXMgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQpIHJldHVyblxuICAgICAgICAgICAgY29uc3QgcGFyc2VkOiBNYXRjaFtdID0gW11cbiAgICAgICAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICAgICAgICBjb25zdCBtID0gcGFyc2VSaXBncmVwTGluZShsaW5lKVxuICAgICAgICAgICAgICBpZiAoIW0pIGNvbnRpbnVlXG4gICAgICAgICAgICAgIGNvbnN0IHJlbCA9IHJlbGF0aXZlUGF0aChjd2QsIG0uZmlsZSlcbiAgICAgICAgICAgICAgcGFyc2VkLnB1c2goeyAuLi5tLCBmaWxlOiByZWwuc3RhcnRzV2l0aCgnLi4nKSA/IG0uZmlsZSA6IHJlbCB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwYXJzZWQubGVuZ3RoKSByZXR1cm5cbiAgICAgICAgICAgIGNvbGxlY3RlZCArPSBwYXJzZWQubGVuZ3RoXG4gICAgICAgICAgICBzZXRNYXRjaGVzKHByZXYgPT4ge1xuICAgICAgICAgICAgICAvLyBBcHBlbmQrZGVkdXBlIGluc3RlYWQgb2YgcmVwbGFjZTogcHJldiBtYXkgaG9sZCBjbGllbnQtXG4gICAgICAgICAgICAgIC8vIGZpbHRlcmVkIHJlc3VsdHMgdGhhdCBhcmUgdmFsaWQgbWF0Y2hlcyBmb3IgdGhpcyBxdWVyeS5cbiAgICAgICAgICAgICAgLy8gUmVwbGFjaW5nIHdvdWxkIGRyb3AgdGhlIGNvdW50IHRvIHRoaXMgY2h1bmsncyBzaXplIHRoZW5cbiAgICAgICAgICAgICAgLy8gZ3JvdyBpdCBiYWNrIOKAlCB2aXNpYmxlIGFzIGEgZmxpY2tlci5cbiAgICAgICAgICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQocHJldi5tYXAobWF0Y2hLZXkpKVxuICAgICAgICAgICAgICBjb25zdCBmcmVzaCA9IHBhcnNlZC5maWx0ZXIocCA9PiAhc2Vlbi5oYXMobWF0Y2hLZXkocCkpKVxuICAgICAgICAgICAgICBpZiAoIWZyZXNoLmxlbmd0aCkgcmV0dXJuIHByZXZcbiAgICAgICAgICAgICAgY29uc3QgbmV4dCA9IHByZXYuY29uY2F0KGZyZXNoKVxuICAgICAgICAgICAgICByZXR1cm4gbmV4dC5sZW5ndGggPiBNQVhfVE9UQUxfTUFUQ0hFU1xuICAgICAgICAgICAgICAgID8gbmV4dC5zbGljZSgwLCBNQVhfVE9UQUxfTUFUQ0hFUylcbiAgICAgICAgICAgICAgICA6IG5leHRcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBpZiAoY29sbGVjdGVkID49IE1BWF9UT1RBTF9NQVRDSEVTKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuYWJvcnQoKVxuICAgICAgICAgICAgICBzZXRUcnVuY2F0ZWQodHJ1ZSlcbiAgICAgICAgICAgICAgc2V0SXNTZWFyY2hpbmcoZmFsc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgKVxuICAgICAgICAgIC5jYXRjaCgoKSA9PiB7fSlcbiAgICAgICAgICAvLyBTdHJlYW0gY2xvc2VkIHdpdGggemVybyBjaHVua3Mg4oCUIGNsZWFyIHN0YWxlIHJlc3VsdHMgc29cbiAgICAgICAgICAvLyBcIk5vIG1hdGNoZXNcIiByZW5kZXJzIGluc3RlYWQgb2YgdGhlIHByZXZpb3VzIHF1ZXJ5J3MgbGlzdC5cbiAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY29udHJvbGxlci5zaWduYWwuYWJvcnRlZCkgcmV0dXJuXG4gICAgICAgICAgICBpZiAoY29sbGVjdGVkID09PSAwKSBzZXRNYXRjaGVzKG0gPT4gKG0ubGVuZ3RoID8gW10gOiBtKSlcbiAgICAgICAgICAgIHNldElzU2VhcmNoaW5nKGZhbHNlKVxuICAgICAgICAgIH0pXG4gICAgICB9LFxuICAgICAgREVCT1VOQ0VfTVMsXG4gICAgICBxLFxuICAgICAgY29udHJvbGxlcixcbiAgICAgIHNldE1hdGNoZXMsXG4gICAgICBzZXRUcnVuY2F0ZWQsXG4gICAgICBzZXRJc1NlYXJjaGluZyxcbiAgICApXG4gIH1cblxuICBjb25zdCBsaXN0V2lkdGggPSBwcmV2aWV3T25SaWdodFxuICAgID8gTWF0aC5mbG9vcigoY29sdW1ucyAtIDEwKSAqIDAuNSlcbiAgICA6IGNvbHVtbnMgLSA4XG4gIGNvbnN0IG1heFBhdGhXaWR0aCA9IE1hdGgubWF4KDIwLCBNYXRoLmZsb29yKGxpc3RXaWR0aCAqIDAuNCkpXG4gIGNvbnN0IG1heFRleHRXaWR0aCA9IE1hdGgubWF4KDIwLCBsaXN0V2lkdGggLSBtYXhQYXRoV2lkdGggLSA0KVxuICBjb25zdCBwcmV2aWV3V2lkdGggPSBwcmV2aWV3T25SaWdodFxuICAgID8gTWF0aC5tYXgoNDAsIGNvbHVtbnMgLSBsaXN0V2lkdGggLSAxNClcbiAgICA6IGNvbHVtbnMgLSA2XG5cbiAgY29uc3QgaGFuZGxlT3BlbiA9IChtOiBNYXRjaCkgPT4ge1xuICAgIGNvbnN0IG9wZW5lZCA9IG9wZW5GaWxlSW5FeHRlcm5hbEVkaXRvcihcbiAgICAgIHJlc29sdmVQYXRoKGdldEN3ZCgpLCBtLmZpbGUpLFxuICAgICAgbS5saW5lLFxuICAgIClcbiAgICBsb2dFdmVudCgndGVuZ3VfZ2xvYmFsX3NlYXJjaF9zZWxlY3QnLCB7XG4gICAgICByZXN1bHRfY291bnQ6IG1hdGNoZXMubGVuZ3RoLFxuICAgICAgb3BlbmVkX2VkaXRvcjogb3BlbmVkLFxuICAgIH0pXG4gICAgb25Eb25lKClcbiAgfVxuXG4gIGNvbnN0IGhhbmRsZUluc2VydCA9IChtOiBNYXRjaCwgbWVudGlvbjogYm9vbGVhbikgPT4ge1xuICAgIG9uSW5zZXJ0KG1lbnRpb24gPyBgQCR7bS5maWxlfSNMJHttLmxpbmV9IGAgOiBgJHttLmZpbGV9OiR7bS5saW5lfSBgKVxuICAgIGxvZ0V2ZW50KCd0ZW5ndV9nbG9iYWxfc2VhcmNoX2luc2VydCcsIHtcbiAgICAgIHJlc3VsdF9jb3VudDogbWF0Y2hlcy5sZW5ndGgsXG4gICAgICBtZW50aW9uLFxuICAgIH0pXG4gICAgb25Eb25lKClcbiAgfVxuXG4gIC8vIEFsd2F5cyBwYXNzIGEgbm9uLWVtcHR5IHN0cmluZyBzbyB0aGUgbGluZSBpcyByZXNlcnZlZCDigJQgcHJldmVudHMgdGhlXG4gIC8vIHNlYXJjaEJveCBmcm9tIGJvdW5jaW5nIHdoZW4gdGhlIGNvdW50IGFwcGVhcnMvZGlzYXBwZWFycy5cbiAgY29uc3QgbWF0Y2hMYWJlbCA9XG4gICAgbWF0Y2hlcy5sZW5ndGggPiAwXG4gICAgICA/IGAke21hdGNoZXMubGVuZ3RofSR7dHJ1bmNhdGVkID8gJysnIDogJyd9IG1hdGNoZXMke2lzU2VhcmNoaW5nID8gJ+KApicgOiAnJ31gXG4gICAgICA6ICcgJ1xuXG4gIHJldHVybiAoXG4gICAgPEZ1enp5UGlja2VyXG4gICAgICB0aXRsZT1cIkdsb2JhbCBTZWFyY2hcIlxuICAgICAgcGxhY2Vob2xkZXI9XCJUeXBlIHRvIHNlYXJjaOKAplwiXG4gICAgICBpdGVtcz17bWF0Y2hlc31cbiAgICAgIGdldEtleT17bWF0Y2hLZXl9XG4gICAgICB2aXNpYmxlQ291bnQ9e3Zpc2libGVSZXN1bHRzfVxuICAgICAgZGlyZWN0aW9uPVwidXBcIlxuICAgICAgcHJldmlld1Bvc2l0aW9uPXtwcmV2aWV3T25SaWdodCA/ICdyaWdodCcgOiAnYm90dG9tJ31cbiAgICAgIG9uUXVlcnlDaGFuZ2U9e2hhbmRsZVF1ZXJ5Q2hhbmdlfVxuICAgICAgb25Gb2N1cz17c2V0Rm9jdXNlZH1cbiAgICAgIG9uU2VsZWN0PXtoYW5kbGVPcGVufVxuICAgICAgb25UYWI9e3sgYWN0aW9uOiAnbWVudGlvbicsIGhhbmRsZXI6IG0gPT4gaGFuZGxlSW5zZXJ0KG0sIHRydWUpIH19XG4gICAgICBvblNoaWZ0VGFiPXt7XG4gICAgICAgIGFjdGlvbjogJ2luc2VydCBwYXRoJyxcbiAgICAgICAgaGFuZGxlcjogbSA9PiBoYW5kbGVJbnNlcnQobSwgZmFsc2UpLFxuICAgICAgfX1cbiAgICAgIG9uQ2FuY2VsPXtvbkRvbmV9XG4gICAgICBlbXB0eU1lc3NhZ2U9e3EgPT5cbiAgICAgICAgaXNTZWFyY2hpbmcgPyAnU2VhcmNoaW5n4oCmJyA6IHEgPyAnTm8gbWF0Y2hlcycgOiAnVHlwZSB0byBzZWFyY2jigKYnXG4gICAgICB9XG4gICAgICBtYXRjaExhYmVsPXttYXRjaExhYmVsfVxuICAgICAgc2VsZWN0QWN0aW9uPVwib3BlbiBpbiBlZGl0b3JcIlxuICAgICAgcmVuZGVySXRlbT17KG0sIGlzRm9jdXNlZCkgPT4gKFxuICAgICAgICA8VGV4dCBjb2xvcj17aXNGb2N1c2VkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIHt0cnVuY2F0ZVBhdGhNaWRkbGUobS5maWxlLCBtYXhQYXRoV2lkdGgpfTp7bS5saW5lfVxuICAgICAgICAgIDwvVGV4dD57JyAnfVxuICAgICAgICAgIHtoaWdobGlnaHRNYXRjaChcbiAgICAgICAgICAgIHRydW5jYXRlVG9XaWR0aChtLnRleHQudHJpbVN0YXJ0KCksIG1heFRleHRXaWR0aCksXG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICApfVxuICAgICAgICA8L1RleHQ+XG4gICAgICApfVxuICAgICAgcmVuZGVyUHJldmlldz17bSA9PlxuICAgICAgICBwcmV2aWV3Py5maWxlID09PSBtLmZpbGUgJiYgcHJldmlldy5saW5lID09PSBtLmxpbmUgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICB7dHJ1bmNhdGVQYXRoTWlkZGxlKG0uZmlsZSwgcHJldmlld1dpZHRoKX06e20ubGluZX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIHtwcmV2aWV3LmNvbnRlbnQuc3BsaXQoJ1xcbicpLm1hcCgobGluZSwgaSkgPT4gKFxuICAgICAgICAgICAgICA8VGV4dCBrZXk9e2l9PlxuICAgICAgICAgICAgICAgIHtoaWdobGlnaHRNYXRjaCh0cnVuY2F0ZVRvV2lkdGgobGluZSwgcHJldmlld1dpZHRoKSwgcXVlcnkpfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8TG9hZGluZ1N0YXRlIG1lc3NhZ2U9XCJMb2FkaW5n4oCmXCIgZGltQ29sb3IgLz5cbiAgICAgICAgKVxuICAgICAgfVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gbWF0Y2hLZXkobTogTWF0Y2gpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7bS5maWxlfToke20ubGluZX1gXG59XG5cbi8qKlxuICogUGFyc2UgYSByaXBncmVwIC1uIC0tbm8taGVhZGluZyBvdXRwdXQgbGluZTogXCJwYXRoOmxpbmU6dGV4dFwiLlxuICogV2luZG93cyBwYXRocyBtYXkgY29udGFpbiBhIGRyaXZlIGxldHRlciAoXCJDOlxcLi4uXCIpLCBzbyBhIHNpbXBsZSBzcGxpdCBvblxuICogdGhlIGZpcnN0IGNvbG9uIHdvdWxkIG1hbmdsZSB0aGUgcGF0aCDigJQgdXNlIGEgcmVnZXggdGhhdCBjYXB0dXJlcyB1cCB0b1xuICogdGhlIGZpcnN0IDo8ZGlnaXRzPjogaW5zdGVhZC5cbiAqIEBpbnRlcm5hbCBleHBvcnRlZCBmb3IgdGVzdGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSaXBncmVwTGluZShsaW5lOiBzdHJpbmcpOiBNYXRjaCB8IG51bGwge1xuICBjb25zdCBtID0gL14oLio/KTooXFxkKyk6KC4qKSQvLmV4ZWMobGluZSlcbiAgaWYgKCFtKSByZXR1cm4gbnVsbFxuICBjb25zdCBbLCBmaWxlLCBsaW5lU3RyLCB0ZXh0XSA9IG1cbiAgY29uc3QgbGluZU51bSA9IE51bWJlcihsaW5lU3RyKVxuICBpZiAoIWZpbGUgfHwgIU51bWJlci5pc0Zpbml0ZShsaW5lTnVtKSkgcmV0dXJuIG51bGxcbiAgcmV0dXJuIHsgZmlsZSwgbGluZTogbGluZU51bSwgdGV4dDogdGV4dCA/PyAnJyB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxPQUFPLElBQUlDLFdBQVcsUUFBUSxNQUFNO0FBQzdDLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ25ELFNBQVNDLGtCQUFrQixRQUFRLDhCQUE4QjtBQUNqRSxTQUFTQyxlQUFlLFFBQVEsNkJBQTZCO0FBQzdELFNBQVNDLElBQUksUUFBUSxXQUFXO0FBQ2hDLFNBQVNDLFFBQVEsUUFBUSxnQ0FBZ0M7QUFDekQsU0FBU0MsTUFBTSxRQUFRLGlCQUFpQjtBQUN4QyxTQUFTQyx3QkFBd0IsUUFBUSxvQkFBb0I7QUFDN0QsU0FBU0Msa0JBQWtCLEVBQUVDLGVBQWUsUUFBUSxvQkFBb0I7QUFDeEUsU0FBU0MsY0FBYyxRQUFRLDRCQUE0QjtBQUMzRCxTQUFTQyxZQUFZLFFBQVEsb0NBQW9D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