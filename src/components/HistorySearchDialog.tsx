// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useMemo, useState } from 'react';
// 引入 useRegisterOverlay，将 ../context/overlayContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterOverlay } from '../context/overlayContext.js';
// 引入 getTimestampedHistory、TimestampedHistoryEntry，将 ../history.js 中已经封装好的能力接到本文件流程里。
import { getTimestampedHistory, type TimestampedHistoryEntry } from '../history.js';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js';
// 复用 wrapAnsi 终端界面组件，避免在这里重复拼装显示逻辑。
import { wrapAnsi } from '../ink/wrapAnsi.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js';
// 类型依赖 { HistoryEntry } 来自 ../utils/config.js，用于校准终端渲染的数据契约。
import type { HistoryEntry } from '../utils/config.js';
// 复用 formatRelativeTimeAgo、truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatRelativeTimeAgo, truncateToWidth } from '../utils/format.js';
// 引入 FuzzyPicker，将 ./design-system/FuzzyPicker.js 中已经封装好的能力接到本文件流程里。
import { FuzzyPicker } from './design-system/FuzzyPicker.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  initialQuery?: string;
  // 这个回调绑定到 onSelect: (entry: HistoryEntry) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (entry: HistoryEntry) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// PREVIEW_ROWS 集合保存`6`，供终端 UI History Search Dialog后续判断或输出使用。
const PREVIEW_ROWS = 6;
// AGE_WIDTH保存`8`，供终端 UI History Search Dialog后续判断或输出使用。
const AGE_WIDTH = 8;
// Item 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Item = {
  entry: TimestampedHistoryEntry;
  display: string;
  lower: string;
  firstLine: string;
  age: string;
};
// HistorySearchDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function HistorySearchDialog({
  initialQuery,
  onSelect,
  onCancel
}: Props): React.ReactNode {
  // 调用 useRegisterOverlay，触发终端渲染此处需要的副作用。
  useRegisterOverlay('history-search');
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // items 集合 由 React state 持有，setItems 会在用户操作或异步结果返回时触发刷新。
  const [items, setItems] = useState<Item[] | null>(null);
  // query 由 React state 持有，setQuery 会在用户操作或异步结果返回时触发刷新。
  const [query, setQuery] = useState(initialQuery ?? '');
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // cancelled标记终端 UI History Search Dialog是否启用对应路径。
    let cancelled = false;
    // 调用 void，触发终端渲染此处需要的副作用。
    void (async () => {
      // reader读取`getTimestampedHistory`，供终端渲染后续处理使用。
      const reader = getTimestampedHistory();
      // loaded 从空数组开始收集，后续循环会按处理顺序追加条目。
      const loaded: Item[] = [];
      // 逐项读取 `reader` 中的entry，按输入顺序推进终端渲染。
      for await (const entry of reader) {
        // 满足 `cancelled` 时，终端渲染执行该分支。
        if (cancelled) {
          // 显式忽略 `reader.return(undefined)` 的返回值，只保留它触发的副作用。
          void reader.return(undefined);
          // 终端 UI 组件 History Search Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // display保存`entry.display`，供终端 UI History Search Dialog后续判断或输出使用。
        const display = entry.display;
        // nl保存`display.indexOf`，供终端渲染后续处理使用。
        const nl = display.indexOf('\n');
        // age格式化`formatRelativeTimeAgo`，供终端渲染后续处理使用。
        const age = formatRelativeTimeAgo(new Date(entry.timestamp));
        // loaded追加新条目，保持收集顺序与输入顺序一致。
        loaded.push({
          entry,
          display,
          lower: display.toLowerCase(),
          firstLine: nl === -1 ? display : display.slice(0, nl),
          age: age + ' '.repeat(Math.max(0, AGE_WIDTH - stringWidth(age)))
        });
      }
      // 满足 `!cancelled) setItems(loaded` 时，终端渲染执行该分支。
      if (!cancelled) setItems(loaded);
    })();
    // 返回 `() => {`，作为终端渲染这次计算的结果。
    return () => {
      // cancelled更新为 `true`，确保终端 UI后续读取最新状态。
      cancelled = true;
    };
  }, []);
  // filtered保存`useMemo`，供终端渲染后续处理使用。
  const filtered = useMemo(() => {
    // items 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!items) return [];
    // q格式化`query.trim`，供终端渲染后续处理使用。
    const q = query.trim().toLowerCase();
    // q缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!q) return items;
    // exact 从空数组开始收集，后续循环会按处理顺序追加条目。
    const exact: Item[] = [];
    // fuzzy 从空数组开始收集，后续循环会按处理顺序追加条目。
    const fuzzy: Item[] = [];
    // 按顺序遍历 `items` 中的item，逐个交给终端渲染处理。
    for (const item of items) {
      // 满足 `item.lower.includes(q)` 时，终端渲染执行该分支。
      if (item.lower.includes(q)) {
        // exact追加新条目，保持收集顺序与输入顺序一致。
        exact.push(item);
      // 终端 UI 组件 History Search Dialog在这里处理 `} else if (isSubsequence(item.lower, q)) {`，完成这一小步状态转换。
      } else if (isSubsequence(item.lower, q)) {
        // fuzzy追加新条目，保持收集顺序与输入顺序一致。
        fuzzy.push(item);
      }
    }
    // 返回 `exact.concat(fuzzy)`，作为终端渲染这次计算的结果。
    return exact.concat(fuzzy);
  }, [items, query]);
  // previewOnRight保存`columns >= 100`，供后续判断或组装使用。
  const previewOnRight = columns >= 100;
  // listWidth 集合保存`Math.floor`，供终端渲染后续处理使用。
  const listWidth = previewOnRight ? Math.floor((columns - 6) * 0.5) : columns - 6;
  // rowWidth保存`Math.max`，供终端渲染后续处理使用。
  const rowWidth = Math.max(20, listWidth - AGE_WIDTH - 1);
  // previewWidth保存`Math.max`，供终端渲染后续处理使用。
  const previewWidth = previewOnRight ? Math.max(20, columns - listWidth - 12) : Math.max(20, columns - 10);
  // 返回 `<FuzzyPicker title="Search prompts" placeholder="Filter history…" initi...`，作为终端渲染这次计算的结果。
  return <FuzzyPicker title="Search prompts" placeholder="Filter history…" initialQuery={initialQuery} items={filtered} getKey={item_0 => String(item_0.entry.timestamp)} onQueryChange={setQuery} onSelect={item_1 => {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_history_picker_select', {
      result_count: filtered.length,
      query_length: query.length
    });
    // 显式忽略 `item_1.entry.resolve().then(onSelect)` 的返回值，只保留它触发的副作用。
    void item_1.entry.resolve().then(onSelect);
  // 这个回调绑定到 }} onCancel={onCancel} emptyMessage={q_0 => items === null ? 'Loading…' : q_0 ? 'No …，负责终端渲染在该局部场景下的响应。
  }} onCancel={onCancel} emptyMessage={q_0 => items === null ? 'Loading…' : q_0 ? 'No matching prompts' : 'No history yet'} selectAction="use" direction="up" previewPosition={previewOnRight ? 'right' : 'bottom'} renderItem={(item_2, isFocused) => <Text>
          <Text dimColor>{item_2.age}</Text>
          <Text color={isFocused ? 'suggestion' : undefined}>
            {' '}
            {truncateToWidth(item_2.firstLine, rowWidth)}
          </Text>
        {/* 这个回调绑定到 </Text>} renderPreview={item_3 => {，负责终端渲染在该局部场景下的响应。 */}
        </Text>} renderPreview={item_3 => {
    // wrapped保存`wrapAnsi`，供终端渲染后续处理使用。
    const wrapped = wrapAnsi(item_3.display, previewWidth, {
      hard: true
    // 这个回调绑定到 }).split('\n').filter(l => l.trim() !== '');，负责终端渲染在该局部场景下的响应。
    }).split('\n').filter(l => l.trim() !== '');
    // overflow保存 `wrapped.length > PREVIEW_ROWS` 的判断结果，供终端 UI History Search Dialog后续分支直接复用。
    const overflow = wrapped.length > PREVIEW_ROWS;
    // shown格式化`wrapped.slice`，供终端渲染后续处理使用。
    const shown = wrapped.slice(0, overflow ? PREVIEW_ROWS - 1 : PREVIEW_ROWS);
    // more保存 `wrapped.length - shown.length` 的判断结果，供终端 UI History Search Dialog后续分支直接复用。
    const more = wrapped.length - shown.length;
    // 返回 `<Box flexDirection="column" borderStyle="round" borderDimColor paddingX...`，作为终端渲染这次计算的结果。
    return <Box flexDirection="column" borderStyle="round" borderDimColor paddingX={1} height={PREVIEW_ROWS + 2}>
            {/* 这个回调绑定到 {shown.map((row, i) => <Text key={i} dimColor>，负责终端渲染在该局部场景下的响应。 */}
            {shown.map((row, i) => <Text key={i} dimColor>
                {row}
              </Text>)}
            {more > 0 && <Text dimColor>{`… +${more} more lines`}</Text>}
          </Box>;
  }} />;
}
// isSubsequence 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSubsequence(text: string, query: string): boolean {
  // j保存`0`，供终端 UI History Search Dialog后续判断或输出使用。
  let j = 0;
  // 循环处理 `let i = 0; i < text.length && j < query.length; i`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = 0; i < text.length && j < query.length; i++) {
    // 满足 `text[i] === query[j]` 时，终端渲染执行该分支。
    if (text[i] === query[j]) j++;
  }
  // 返回 `j === query.length`，作为终端渲染这次计算的结果。
  return j === query.length;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsInVzZVJlZ2lzdGVyT3ZlcmxheSIsImdldFRpbWVzdGFtcGVkSGlzdG9yeSIsIlRpbWVzdGFtcGVkSGlzdG9yeUVudHJ5IiwidXNlVGVybWluYWxTaXplIiwic3RyaW5nV2lkdGgiLCJ3cmFwQW5zaSIsIkJveCIsIlRleHQiLCJsb2dFdmVudCIsIkhpc3RvcnlFbnRyeSIsImZvcm1hdFJlbGF0aXZlVGltZUFnbyIsInRydW5jYXRlVG9XaWR0aCIsIkZ1enp5UGlja2VyIiwiUHJvcHMiLCJpbml0aWFsUXVlcnkiLCJvblNlbGVjdCIsImVudHJ5Iiwib25DYW5jZWwiLCJQUkVWSUVXX1JPV1MiLCJBR0VfV0lEVEgiLCJJdGVtIiwiZGlzcGxheSIsImxvd2VyIiwiZmlyc3RMaW5lIiwiYWdlIiwiSGlzdG9yeVNlYXJjaERpYWxvZyIsIlJlYWN0Tm9kZSIsImNvbHVtbnMiLCJpdGVtcyIsInNldEl0ZW1zIiwicXVlcnkiLCJzZXRRdWVyeSIsImNhbmNlbGxlZCIsInJlYWRlciIsImxvYWRlZCIsInJldHVybiIsInVuZGVmaW5lZCIsIm5sIiwiaW5kZXhPZiIsIkRhdGUiLCJ0aW1lc3RhbXAiLCJwdXNoIiwidG9Mb3dlckNhc2UiLCJzbGljZSIsInJlcGVhdCIsIk1hdGgiLCJtYXgiLCJmaWx0ZXJlZCIsInEiLCJ0cmltIiwiZXhhY3QiLCJmdXp6eSIsIml0ZW0iLCJpbmNsdWRlcyIsImlzU3Vic2VxdWVuY2UiLCJjb25jYXQiLCJwcmV2aWV3T25SaWdodCIsImxpc3RXaWR0aCIsImZsb29yIiwicm93V2lkdGgiLCJwcmV2aWV3V2lkdGgiLCJTdHJpbmciLCJyZXN1bHRfY291bnQiLCJsZW5ndGgiLCJxdWVyeV9sZW5ndGgiLCJyZXNvbHZlIiwidGhlbiIsImlzRm9jdXNlZCIsIndyYXBwZWQiLCJoYXJkIiwic3BsaXQiLCJmaWx0ZXIiLCJsIiwib3ZlcmZsb3ciLCJzaG93biIsIm1vcmUiLCJtYXAiLCJyb3ciLCJpIiwidGV4dCIsImoiXSwic291cmNlcyI6WyJIaXN0b3J5U2VhcmNoRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVJlZ2lzdGVyT3ZlcmxheSB9IGZyb20gJy4uL2NvbnRleHQvb3ZlcmxheUNvbnRleHQuanMnXG5pbXBvcnQge1xuICBnZXRUaW1lc3RhbXBlZEhpc3RvcnksXG4gIHR5cGUgVGltZXN0YW1wZWRIaXN0b3J5RW50cnksXG59IGZyb20gJy4uL2hpc3RvcnkuanMnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBzdHJpbmdXaWR0aCB9IGZyb20gJy4uL2luay9zdHJpbmdXaWR0aC5qcydcbmltcG9ydCB7IHdyYXBBbnNpIH0gZnJvbSAnLi4vaW5rL3dyYXBBbnNpLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICcuLi9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgdHlwZSB7IEhpc3RvcnlFbnRyeSB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGZvcm1hdFJlbGF0aXZlVGltZUFnbywgdHJ1bmNhdGVUb1dpZHRoIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgRnV6enlQaWNrZXIgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRnV6enlQaWNrZXIuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGluaXRpYWxRdWVyeT86IHN0cmluZ1xuICBvblNlbGVjdDogKGVudHJ5OiBIaXN0b3J5RW50cnkpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbn1cblxuY29uc3QgUFJFVklFV19ST1dTID0gNlxuY29uc3QgQUdFX1dJRFRIID0gOFxuXG50eXBlIEl0ZW0gPSB7XG4gIGVudHJ5OiBUaW1lc3RhbXBlZEhpc3RvcnlFbnRyeVxuICBkaXNwbGF5OiBzdHJpbmdcbiAgbG93ZXI6IHN0cmluZ1xuICBmaXJzdExpbmU6IHN0cmluZ1xuICBhZ2U6IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gSGlzdG9yeVNlYXJjaERpYWxvZyh7XG4gIGluaXRpYWxRdWVyeSxcbiAgb25TZWxlY3QsXG4gIG9uQ2FuY2VsLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICB1c2VSZWdpc3Rlck92ZXJsYXkoJ2hpc3Rvcnktc2VhcmNoJylcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuXG4gIGNvbnN0IFtpdGVtcywgc2V0SXRlbXNdID0gdXNlU3RhdGU8SXRlbVtdIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3F1ZXJ5LCBzZXRRdWVyeV0gPSB1c2VTdGF0ZShpbml0aWFsUXVlcnkgPz8gJycpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgY2FuY2VsbGVkID0gZmFsc2VcbiAgICB2b2lkIChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZWFkZXIgPSBnZXRUaW1lc3RhbXBlZEhpc3RvcnkoKVxuICAgICAgY29uc3QgbG9hZGVkOiBJdGVtW10gPSBbXVxuICAgICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiByZWFkZXIpIHtcbiAgICAgICAgaWYgKGNhbmNlbGxlZCkge1xuICAgICAgICAgIHZvaWQgcmVhZGVyLnJldHVybih1bmRlZmluZWQpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGlzcGxheSA9IGVudHJ5LmRpc3BsYXlcbiAgICAgICAgY29uc3QgbmwgPSBkaXNwbGF5LmluZGV4T2YoJ1xcbicpXG4gICAgICAgIGNvbnN0IGFnZSA9IGZvcm1hdFJlbGF0aXZlVGltZUFnbyhuZXcgRGF0ZShlbnRyeS50aW1lc3RhbXApKVxuICAgICAgICBsb2FkZWQucHVzaCh7XG4gICAgICAgICAgZW50cnksXG4gICAgICAgICAgZGlzcGxheSxcbiAgICAgICAgICBsb3dlcjogZGlzcGxheS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgIGZpcnN0TGluZTogbmwgPT09IC0xID8gZGlzcGxheSA6IGRpc3BsYXkuc2xpY2UoMCwgbmwpLFxuICAgICAgICAgIGFnZTogYWdlICsgJyAnLnJlcGVhdChNYXRoLm1heCgwLCBBR0VfV0lEVEggLSBzdHJpbmdXaWR0aChhZ2UpKSksXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBpZiAoIWNhbmNlbGxlZCkgc2V0SXRlbXMobG9hZGVkKVxuICAgIH0pKClcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY2FuY2VsbGVkID0gdHJ1ZVxuICAgIH1cbiAgfSwgW10pXG5cbiAgY29uc3QgZmlsdGVyZWQgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIWl0ZW1zKSByZXR1cm4gW11cbiAgICBjb25zdCBxID0gcXVlcnkudHJpbSgpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoIXEpIHJldHVybiBpdGVtc1xuICAgIGNvbnN0IGV4YWN0OiBJdGVtW10gPSBbXVxuICAgIGNvbnN0IGZ1enp5OiBJdGVtW10gPSBbXVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgaWYgKGl0ZW0ubG93ZXIuaW5jbHVkZXMocSkpIHtcbiAgICAgICAgZXhhY3QucHVzaChpdGVtKVxuICAgICAgfSBlbHNlIGlmIChpc1N1YnNlcXVlbmNlKGl0ZW0ubG93ZXIsIHEpKSB7XG4gICAgICAgIGZ1enp5LnB1c2goaXRlbSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV4YWN0LmNvbmNhdChmdXp6eSlcbiAgfSwgW2l0ZW1zLCBxdWVyeV0pXG5cbiAgY29uc3QgcHJldmlld09uUmlnaHQgPSBjb2x1bW5zID49IDEwMFxuICBjb25zdCBsaXN0V2lkdGggPSBwcmV2aWV3T25SaWdodFxuICAgID8gTWF0aC5mbG9vcigoY29sdW1ucyAtIDYpICogMC41KVxuICAgIDogY29sdW1ucyAtIDZcbiAgY29uc3Qgcm93V2lkdGggPSBNYXRoLm1heCgyMCwgbGlzdFdpZHRoIC0gQUdFX1dJRFRIIC0gMSlcbiAgY29uc3QgcHJldmlld1dpZHRoID0gcHJldmlld09uUmlnaHRcbiAgICA/IE1hdGgubWF4KDIwLCBjb2x1bW5zIC0gbGlzdFdpZHRoIC0gMTIpXG4gICAgOiBNYXRoLm1heCgyMCwgY29sdW1ucyAtIDEwKVxuXG4gIHJldHVybiAoXG4gICAgPEZ1enp5UGlja2VyXG4gICAgICB0aXRsZT1cIlNlYXJjaCBwcm9tcHRzXCJcbiAgICAgIHBsYWNlaG9sZGVyPVwiRmlsdGVyIGhpc3RvcnnigKZcIlxuICAgICAgaW5pdGlhbFF1ZXJ5PXtpbml0aWFsUXVlcnl9XG4gICAgICBpdGVtcz17ZmlsdGVyZWR9XG4gICAgICBnZXRLZXk9e2l0ZW0gPT4gU3RyaW5nKGl0ZW0uZW50cnkudGltZXN0YW1wKX1cbiAgICAgIG9uUXVlcnlDaGFuZ2U9e3NldFF1ZXJ5fVxuICAgICAgb25TZWxlY3Q9e2l0ZW0gPT4ge1xuICAgICAgICBsb2dFdmVudCgndGVuZ3VfaGlzdG9yeV9waWNrZXJfc2VsZWN0Jywge1xuICAgICAgICAgIHJlc3VsdF9jb3VudDogZmlsdGVyZWQubGVuZ3RoLFxuICAgICAgICAgIHF1ZXJ5X2xlbmd0aDogcXVlcnkubGVuZ3RoLFxuICAgICAgICB9KVxuICAgICAgICB2b2lkIGl0ZW0uZW50cnkucmVzb2x2ZSgpLnRoZW4ob25TZWxlY3QpXG4gICAgICB9fVxuICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgZW1wdHlNZXNzYWdlPXtxID0+XG4gICAgICAgIGl0ZW1zID09PSBudWxsXG4gICAgICAgICAgPyAnTG9hZGluZ+KApidcbiAgICAgICAgICA6IHFcbiAgICAgICAgICAgID8gJ05vIG1hdGNoaW5nIHByb21wdHMnXG4gICAgICAgICAgICA6ICdObyBoaXN0b3J5IHlldCdcbiAgICAgIH1cbiAgICAgIHNlbGVjdEFjdGlvbj1cInVzZVwiXG4gICAgICBkaXJlY3Rpb249XCJ1cFwiXG4gICAgICBwcmV2aWV3UG9zaXRpb249e3ByZXZpZXdPblJpZ2h0ID8gJ3JpZ2h0JyA6ICdib3R0b20nfVxuICAgICAgcmVuZGVySXRlbT17KGl0ZW0sIGlzRm9jdXNlZCkgPT4gKFxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57aXRlbS5hZ2V9PC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXtpc0ZvY3VzZWQgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9PlxuICAgICAgICAgICAgeycgJ31cbiAgICAgICAgICAgIHt0cnVuY2F0ZVRvV2lkdGgoaXRlbS5maXJzdExpbmUsIHJvd1dpZHRoKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgICByZW5kZXJQcmV2aWV3PXtpdGVtID0+IHtcbiAgICAgICAgY29uc3Qgd3JhcHBlZCA9IHdyYXBBbnNpKGl0ZW0uZGlzcGxheSwgcHJldmlld1dpZHRoLCB7IGhhcmQ6IHRydWUgfSlcbiAgICAgICAgICAuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgLmZpbHRlcihsID0+IGwudHJpbSgpICE9PSAnJylcbiAgICAgICAgY29uc3Qgb3ZlcmZsb3cgPSB3cmFwcGVkLmxlbmd0aCA+IFBSRVZJRVdfUk9XU1xuICAgICAgICBjb25zdCBzaG93biA9IHdyYXBwZWQuc2xpY2UoXG4gICAgICAgICAgMCxcbiAgICAgICAgICBvdmVyZmxvdyA/IFBSRVZJRVdfUk9XUyAtIDEgOiBQUkVWSUVXX1JPV1MsXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgbW9yZSA9IHdyYXBwZWQubGVuZ3RoIC0gc2hvd24ubGVuZ3RoXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPEJveFxuICAgICAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgICAgICAgIGJvcmRlckRpbUNvbG9yXG4gICAgICAgICAgICBwYWRkaW5nWD17MX1cbiAgICAgICAgICAgIGhlaWdodD17UFJFVklFV19ST1dTICsgMn1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7c2hvd24ubWFwKChyb3csIGkpID0+IChcbiAgICAgICAgICAgICAgPFRleHQga2V5PXtpfSBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICB7cm93fVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICAgIHttb3JlID4gMCAmJiA8VGV4dCBkaW1Db2xvcj57YOKApiArJHttb3JlfSBtb3JlIGxpbmVzYH08L1RleHQ+fVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApXG4gICAgICB9fVxuICAgIC8+XG4gIClcbn1cblxuZnVuY3Rpb24gaXNTdWJzZXF1ZW5jZSh0ZXh0OiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgbGV0IGogPSAwXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dC5sZW5ndGggJiYgaiA8IHF1ZXJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRleHRbaV0gPT09IHF1ZXJ5W2pdKSBqKytcbiAgfVxuICByZXR1cm4gaiA9PT0gcXVlcnkubGVuZ3RoXG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3BELFNBQVNDLGtCQUFrQixRQUFRLDhCQUE4QjtBQUNqRSxTQUNFQyxxQkFBcUIsRUFDckIsS0FBS0MsdUJBQXVCLFFBQ3ZCLGVBQWU7QUFDdEIsU0FBU0MsZUFBZSxRQUFRLDZCQUE2QjtBQUM3RCxTQUFTQyxXQUFXLFFBQVEsdUJBQXVCO0FBQ25ELFNBQVNDLFFBQVEsUUFBUSxvQkFBb0I7QUFD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