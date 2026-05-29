// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { extname } from 'path';
// 引入 React、Suspense、use、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useMemo } from 'react';
// 引入 Ansi、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Ansi, Text } from '../../ink.js';
// 复用 getCliHighlightPromise 工具函数，把通用处理留在 ../../utils/cliHighlight.js 中维护。
import { getCliHighlightPromise } from '../../utils/cliHighlight.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js';
// 复用 convertLeadingTabsToSpaces 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { convertLeadingTabsToSpaces } from '../../utils/file.js';
// 复用 hashPair 工具函数，把通用处理留在 ../../utils/hash.js 中维护。
import { hashPair } from '../../utils/hash.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  code: string;
  filePath: string;
  dim?: boolean;
  skipColoring?: boolean;
};

// Module-level highlight cache — hl.highlight() is the hot cost on virtual-
// scroll remounts. useMemo doesn't survive unmount→remount. Keyed by hash
// of code+language to avoid retaining full source strings (#24180 RSS fix).
// HL_CACHE_MAX 缓存保存`500`，供终端 UI Fallback后续判断或输出使用。
const HL_CACHE_MAX = 500;
// hlCache 缓存构建`new Map<string, string>()`，供后续判断或组装使用。
const hlCache = new Map<string, string>();
// cachedHighlight 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function cachedHighlight(hl: NonNullable<Awaited<ReturnType<typeof getCliHighlightPromise>>>, code: string, language: string): string {
  // 按键保存`hashPair`，供终端渲染后续处理使用。
  const key = hashPair(language, code);
  // hit读取`hlCache.get`，供终端渲染后续处理使用。
  const hit = hlCache.get(key);
  // `hit` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (hit !== undefined) {
    // 调用 hlCache.delete，触发终端渲染此处需要的副作用。
    hlCache.delete(key);
    // hlCache.set 写入新的状态值，使终端渲染后续读取保持一致。
    hlCache.set(key, hit);
    // 返回 `hit`，作为终端渲染这次计算的结果。
    return hit;
  }
  // out保存`hl.highlight`，供终端渲染后续处理使用。
  const out = hl.highlight(code, {
    language
  });
  // 满足 `hlCache.size >= HL_CACHE_MAX` 时，终端渲染执行该分支。
  if (hlCache.size >= HL_CACHE_MAX) {
    // first保存`hlCache.keys`，供终端渲染后续处理使用。
    const first = hlCache.keys().next().value;
    // `first` 与 `undefined) hlCache.delete(first` 不一致时刷新派生状态，避免使用过期结果。
    if (first !== undefined) hlCache.delete(first);
  }
  // hlCache.set 写入新的状态值，使终端渲染后续读取保持一致。
  hlCache.set(key, out);
  // 返回 `out`，作为终端渲染这次计算的结果。
  return out;
}
// HighlightedCodeFallback 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function HighlightedCodeFallback(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    code,
    filePath,
    dim: t1,
    skipColoring: t2
  } = t0;
  // dim标记终端 UI Fallback是否启用对应路径。
  const dim = t1 === undefined ? false : t1;
  // skipColoring标记终端 UI Fallback是否启用对应路径。
  const skipColoring = t2 === undefined ? false : t2;
  // t3 暂存 `convertLeadingTabsToSpaces(code)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== code) {
    // t3 暂存 `convertLeadingTabsToSpaces(code)` 生成的渲染片段，后续返回路径直接复用。
    t3 = convertLeadingTabsToSpaces(code);
    // $[0] 缓存 `code`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = code;
    // $[1] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[1];
  }
  // codeWithSpaces 集合 命名 `t3`，让后续代码直接表达这个值的用途。
  const codeWithSpaces = t3;
  // 满足 `skipColoring` 时，终端渲染执行该分支。
  if (skipColoring) {
    // t4 暂存 `<Ansi>{codeWithSpaces}</Ansi>` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[2] !== codeWithSpaces) {
      // t4 暂存 `<Ansi>{codeWithSpaces}</Ansi>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Ansi>{codeWithSpaces}</Ansi>;
      // $[2] 缓存 `codeWithSpaces`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = codeWithSpaces;
      // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[3];
    }
    // t5 暂存 `<Text dimColor={dim}>{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== dim || $[5] !== t4) {
      // t5 暂存 `<Text dimColor={dim}>{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Text dimColor={dim}>{t4}</Text>;
      // $[4] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = dim;
      // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t4;
      // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[6];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // t4 暂存 `extname(filePath).slice(1)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== filePath) {
    // t4 暂存 `extname(filePath).slice(1)` 生成的渲染片段，后续返回路径直接复用。
    t4 = extname(filePath).slice(1);
    // $[7] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = filePath;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // language 命名 `t4`，让后续代码直接表达这个值的用途。
  const language = t4;
  // t5 暂存 `<Ansi>{codeWithSpaces}</Ansi>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== codeWithSpaces) {
    // t5 暂存 `<Ansi>{codeWithSpaces}</Ansi>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Ansi>{codeWithSpaces}</Ansi>;
    // $[9] 缓存 `codeWithSpaces`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = codeWithSpaces;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `<Highlighted codeWithSpaces={codeWithSpaces} language={la...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== codeWithSpaces || $[12] !== language) {
    // t6 暂存 `<Highlighted codeWithSpaces={codeWithSpaces} language={la...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Highlighted codeWithSpaces={codeWithSpaces} language={language} />;
    // $[11] 缓存 `codeWithSpaces`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = codeWithSpaces;
    // $[12] 缓存 `language`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = language;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // t7 暂存 `<Suspense fallback={t5}>{t6}</Suspense>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t5 || $[15] !== t6) {
    // t7 暂存 `<Suspense fallback={t5}>{t6}</Suspense>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Suspense fallback={t5}>{t6}</Suspense>;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // t8 暂存 `<Text dimColor={dim}>{t7}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== dim || $[18] !== t7) {
    // t8 暂存 `<Text dimColor={dim}>{t7}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={dim}>{t7}</Text>;
    // $[17] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = dim;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// Highlighted 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function Highlighted(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    codeWithSpaces,
    language
  } = t0;
  // t1 暂存 `getCliHighlightPromise()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getCliHighlightPromise()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getCliHighlightPromise();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // hl保存`use`，供终端渲染后续处理使用。
  const hl = use(t1);
  // t2 暂存 `codeWithSpaces` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== codeWithSpaces || $[2] !== hl || $[3] !== language) {
    // 终端 UI 组件 Fallback在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // hl缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!hl) {
        // t2 暂存 `codeWithSpaces` 生成的渲染片段，后续返回路径直接复用。
        t2 = codeWithSpaces;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // highlightLang 命名 `"markdown"`，让后续代码直接表达这个值的用途。
      let highlightLang = "markdown";
      // 满足 `language` 时，终端渲染执行该分支。
      if (language) {
        // 满足 `hl.supportsLanguage(language)` 时，终端渲染执行该分支。
        if (hl.supportsLanguage(language)) {
          // highlightLang更新为 `language`，确保终端 UI后续读取最新状态。
          highlightLang = language;
        } else {
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Language not supported while highlighting code, falling back to markdown: ${language}`);
        }
      }
      // 终端 UI 组件 Fallback在这里处理 ``，完成这一小步状态转换。
      ;
      // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
      try {
        // t2 暂存 `cachedHighlight(hl, codeWithSpaces, highlightLang)` 生成的渲染片段，后续返回路径直接复用。
        t2 = cachedHighlight(hl, codeWithSpaces, highlightLang);
      } catch (t3) {
        // e 命名 `t3`，让后续代码直接表达这个值的用途。
        const e = t3;
        // 只有 `e instanceof Error && e.message.includes("Unknown language")` 满足时，终端渲染才执行该分支。
        if (e instanceof Error && e.message.includes("Unknown language")) {
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`Language not supported while highlighting code, falling back to markdown: ${e}`);
          // t4 暂存 `cachedHighlight(hl, codeWithSpaces, "markdown")` 的派生结果，便于缓存命中时直接复用。
          let t4;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[5] !== codeWithSpaces || $[6] !== hl) {
            // t4 暂存 `cachedHighlight(hl, codeWithSpaces, "markdown")` 生成的渲染片段，后续返回路径直接复用。
            t4 = cachedHighlight(hl, codeWithSpaces, "markdown");
            // $[5] 缓存 `codeWithSpaces`，下次依赖未变时 React 编译产物可直接复用。
            $[5] = codeWithSpaces;
            // $[6] 缓存 `hl`，下次依赖未变时 React 编译产物可直接复用。
            $[6] = hl;
            // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
            $[7] = t4;
          } else {
            // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
            t4 = $[7];
          }
          // t2 暂存 `t4` 生成的渲染片段，后续返回路径直接复用。
          t2 = t4;
          // 结束这个分支或循环，避免终端渲染继续落入后续路径。
          break bb0;
        }
        // t2 暂存 `codeWithSpaces` 生成的渲染片段，后续返回路径直接复用。
        t2 = codeWithSpaces;
      }
    }
    // $[1] 缓存 `codeWithSpaces`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = codeWithSpaces;
    // $[2] 缓存 `hl`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = hl;
    // $[3] 缓存 `language`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = language;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // out 命名 `t2`，让后续代码直接表达这个值的用途。
  const out = t2;
  // t3 暂存 `<Ansi>{out}</Ansi>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== out) {
    // t3 暂存 `<Ansi>{out}</Ansi>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Ansi>{out}</Ansi>;
    // $[8] 缓存 `out`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = out;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJleHRuYW1lIiwiUmVhY3QiLCJTdXNwZW5zZSIsInVzZSIsInVzZU1lbW8iLCJBbnNpIiwiVGV4dCIsImdldENsaUhpZ2hsaWdodFByb21pc2UiLCJsb2dGb3JEZWJ1Z2dpbmciLCJjb252ZXJ0TGVhZGluZ1RhYnNUb1NwYWNlcyIsImhhc2hQYWlyIiwiUHJvcHMiLCJjb2RlIiwiZmlsZVBhdGgiLCJkaW0iLCJza2lwQ29sb3JpbmciLCJITF9DQUNIRV9NQVgiLCJobENhY2hlIiwiTWFwIiwiY2FjaGVkSGlnaGxpZ2h0IiwiaGwiLCJOb25OdWxsYWJsZSIsIkF3YWl0ZWQiLCJSZXR1cm5UeXBlIiwibGFuZ3VhZ2UiLCJrZXkiLCJoaXQiLCJnZXQiLCJ1bmRlZmluZWQiLCJkZWxldGUiLCJzZXQiLCJvdXQiLCJoaWdobGlnaHQiLCJzaXplIiwiZmlyc3QiLCJrZXlzIiwibmV4dCIsInZhbHVlIiwiSGlnaGxpZ2h0ZWRDb2RlRmFsbGJhY2siLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ0MyIsImNvZGVXaXRoU3BhY2VzIiwidDQiLCJ0NSIsInNsaWNlIiwidDYiLCJ0NyIsInQ4IiwiSGlnaGxpZ2h0ZWQiLCJTeW1ib2wiLCJmb3IiLCJiYjAiLCJoaWdobGlnaHRMYW5nIiwic3VwcG9ydHNMYW5ndWFnZSIsImUiLCJFcnJvciIsIm1lc3NhZ2UiLCJpbmNsdWRlcyJdLCJzb3VyY2VzIjpbIkZhbGxiYWNrLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleHRuYW1lIH0gZnJvbSAncGF0aCdcbmltcG9ydCBSZWFjdCwgeyBTdXNwZW5zZSwgdXNlLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBBbnNpLCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0Q2xpSGlnaGxpZ2h0UHJvbWlzZSB9IGZyb20gJy4uLy4uL3V0aWxzL2NsaUhpZ2hsaWdodC5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uLy4uL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHsgY29udmVydExlYWRpbmdUYWJzVG9TcGFjZXMgfSBmcm9tICcuLi8uLi91dGlscy9maWxlLmpzJ1xuaW1wb3J0IHsgaGFzaFBhaXIgfSBmcm9tICcuLi8uLi91dGlscy9oYXNoLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBjb2RlOiBzdHJpbmdcbiAgZmlsZVBhdGg6IHN0cmluZ1xuICBkaW0/OiBib29sZWFuXG4gIHNraXBDb2xvcmluZz86IGJvb2xlYW5cbn1cblxuLy8gTW9kdWxlLWxldmVsIGhpZ2hsaWdodCBjYWNoZSDigJQgaGwuaGlnaGxpZ2h0KCkgaXMgdGhlIGhvdCBjb3N0IG9uIHZpcnR1YWwtXG4vLyBzY3JvbGwgcmVtb3VudHMuIHVzZU1lbW8gZG9lc24ndCBzdXJ2aXZlIHVubW91bnTihpJyZW1vdW50LiBLZXllZCBieSBoYXNoXG4vLyBvZiBjb2RlK2xhbmd1YWdlIHRvIGF2b2lkIHJldGFpbmluZyBmdWxsIHNvdXJjZSBzdHJpbmdzICgjMjQxODAgUlNTIGZpeCkuXG5jb25zdCBITF9DQUNIRV9NQVggPSA1MDBcbmNvbnN0IGhsQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG5mdW5jdGlvbiBjYWNoZWRIaWdobGlnaHQoXG4gIGhsOiBOb25OdWxsYWJsZTxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIGdldENsaUhpZ2hsaWdodFByb21pc2U+Pj4sXG4gIGNvZGU6IHN0cmluZyxcbiAgbGFuZ3VhZ2U6IHN0cmluZyxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGtleSA9IGhhc2hQYWlyKGxhbmd1YWdlLCBjb2RlKVxuICBjb25zdCBoaXQgPSBobENhY2hlLmdldChrZXkpXG4gIGlmIChoaXQgIT09IHVuZGVmaW5lZCkge1xuICAgIGhsQ2FjaGUuZGVsZXRlKGtleSlcbiAgICBobENhY2hlLnNldChrZXksIGhpdClcbiAgICByZXR1cm4gaGl0XG4gIH1cbiAgY29uc3Qgb3V0ID0gaGwuaGlnaGxpZ2h0KGNvZGUsIHsgbGFuZ3VhZ2UgfSlcbiAgaWYgKGhsQ2FjaGUuc2l6ZSA+PSBITF9DQUNIRV9NQVgpIHtcbiAgICBjb25zdCBmaXJzdCA9IGhsQ2FjaGUua2V5cygpLm5leHQoKS52YWx1ZVxuICAgIGlmIChmaXJzdCAhPT0gdW5kZWZpbmVkKSBobENhY2hlLmRlbGV0ZShmaXJzdClcbiAgfVxuICBobENhY2hlLnNldChrZXksIG91dClcbiAgcmV0dXJuIG91dFxufVxuXG5leHBvcnQgZnVuY3Rpb24gSGlnaGxpZ2h0ZWRDb2RlRmFsbGJhY2soe1xuICBjb2RlLFxuICBmaWxlUGF0aCxcbiAgZGltID0gZmFsc2UsXG4gIHNraXBDb2xvcmluZyA9IGZhbHNlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdEVsZW1lbnQge1xuICBjb25zdCBjb2RlV2l0aFNwYWNlcyA9IGNvbnZlcnRMZWFkaW5nVGFic1RvU3BhY2VzKGNvZGUpXG4gIGlmIChza2lwQ29sb3JpbmcpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFRleHQgZGltQ29sb3I9e2RpbX0+XG4gICAgICAgIDxBbnNpPntjb2RlV2l0aFNwYWNlc308L0Fuc2k+XG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9XG4gIGNvbnN0IGxhbmd1YWdlID0gZXh0bmFtZShmaWxlUGF0aCkuc2xpY2UoMSlcbiAgcmV0dXJuIChcbiAgICA8VGV4dCBkaW1Db2xvcj17ZGltfT5cbiAgICAgIDxTdXNwZW5zZSBmYWxsYmFjaz17PEFuc2k+e2NvZGVXaXRoU3BhY2VzfTwvQW5zaT59PlxuICAgICAgICA8SGlnaGxpZ2h0ZWQgY29kZVdpdGhTcGFjZXM9e2NvZGVXaXRoU3BhY2VzfSBsYW5ndWFnZT17bGFuZ3VhZ2V9IC8+XG4gICAgICA8L1N1c3BlbnNlPlxuICAgIDwvVGV4dD5cbiAgKVxufVxuXG5mdW5jdGlvbiBIaWdobGlnaHRlZCh7XG4gIGNvZGVXaXRoU3BhY2VzLFxuICBsYW5ndWFnZSxcbn06IHtcbiAgY29kZVdpdGhTcGFjZXM6IHN0cmluZ1xuICBsYW5ndWFnZTogc3RyaW5nXG59KTogUmVhY3QuUmVhY3RFbGVtZW50IHtcbiAgY29uc3QgaGwgPSB1c2UoZ2V0Q2xpSGlnaGxpZ2h0UHJvbWlzZSgpKVxuICBjb25zdCBvdXQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIWhsKSByZXR1cm4gY29kZVdpdGhTcGFjZXNcbiAgICBsZXQgaGlnaGxpZ2h0TGFuZyA9ICdtYXJrZG93bidcbiAgICBpZiAobGFuZ3VhZ2UpIHtcbiAgICAgIGlmIChobC5zdXBwb3J0c0xhbmd1YWdlKGxhbmd1YWdlKSkge1xuICAgICAgICBoaWdobGlnaHRMYW5nID0gbGFuZ3VhZ2VcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICAgICBgTGFuZ3VhZ2Ugbm90IHN1cHBvcnRlZCB3aGlsZSBoaWdobGlnaHRpbmcgY29kZSwgZmFsbGluZyBiYWNrIHRvIG1hcmtkb3duOiAke2xhbmd1YWdlfWAsXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBjYWNoZWRIaWdobGlnaHQoaGwsIGNvZGVXaXRoU3BhY2VzLCBoaWdobGlnaHRMYW5nKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5tZXNzYWdlLmluY2x1ZGVzKCdVbmtub3duIGxhbmd1YWdlJykpIHtcbiAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgIGBMYW5ndWFnZSBub3Qgc3VwcG9ydGVkIHdoaWxlIGhpZ2hsaWdodGluZyBjb2RlLCBmYWxsaW5nIGJhY2sgdG8gbWFya2Rvd246ICR7ZX1gLFxuICAgICAgICApXG4gICAgICAgIHJldHVybiBjYWNoZWRIaWdobGlnaHQoaGwsIGNvZGVXaXRoU3BhY2VzLCAnbWFya2Rvd24nKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNvZGVXaXRoU3BhY2VzXG4gICAgfVxuICB9LCBbY29kZVdpdGhTcGFjZXMsIGxhbmd1YWdlLCBobF0pXG4gIHJldHVy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