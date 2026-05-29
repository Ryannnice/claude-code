// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * Portal for content that floats above the prompt so it escapes
 * FullscreenLayout's bottom-slot `overflowY:hidden` clip.
 *
 * The clip is load-bearing (CC-668: tall pastes squash the ScrollBox
 * without it), but floating overlays use `position:absolute
 * bottom="100%"` to float above the prompt — and Ink's clip stack
 * intersects ALL descendants, so they were clipped to ~1 row.
 *
 * Two channels:
 * - `useSetPromptOverlay` — slash-command suggestion data (structured,
 *   written by PromptInputFooter)
 * - `useSetPromptOverlayDialog` — arbitrary dialog node (e.g.
 *   AutoModeOptInDialog, written by PromptInput)
 *
 * FullscreenLayout reads both and renders them outside the clipped slot.
 *
 * Split into data/setter context pairs so writers never re-render on
 * their own writes — the setter contexts are stable.
 */
// 引入 React、createContext、ReactNode、useContext、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
// 类型依赖 { SuggestionItem } 来自 ../components/PromptInput/PromptInputFooterSuggestions.js，用于校准prompt Overlay Context的数据契约。
import type { SuggestionItem } from '../components/PromptInput/PromptInputFooterSuggestions.js';
// PromptOverlayData 固化prompt Overlay Context里传递的数据形状，帮助调用方按同一结构读写字段。
export type PromptOverlayData = {
  suggestions: SuggestionItem[];
  selectedSuggestion: number;
  maxColumnWidth?: number;
};
// Setter 固化prompt Overlay Context里传递的数据形状，帮助调用方按同一结构读写字段。
type Setter<T> = (d: T | null) => void;
// DataContext 命名 `createContext<PromptOverlayData | null>(null)`，让后续代码直接表达这个值的用途。
const DataContext = createContext<PromptOverlayData | null>(null);
// SetContext 命名 `createContext<Setter<PromptOverlayData> | null>(null)`，让后续代码直接表达这个值的用途。
const SetContext = createContext<Setter<PromptOverlayData> | null>(null);
// DialogContext 命名 `createContext<ReactNode>(null)`，让后续代码直接表达这个值的用途。
const DialogContext = createContext<ReactNode>(null);
// SetDialogContext 命名 `createContext<Setter<ReactNode> | null>(null)`，让后续代码直接表达这个值的用途。
const SetDialogContext = createContext<Setter<ReactNode> | null>(null);
// PromptOverlayProvider 封装promptOverlayContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptOverlayProvider(t0) {
  // $保存`_c`，供prompt Overlay Context后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // data 由 React state 持有，setData 会在用户操作或异步结果返回时触发刷新。
  const [data, setData] = useState(null);
  // dialog 由 React state 持有，setDialog 会在用户操作或异步结果返回时触发刷新。
  const [dialog, setDialog] = useState(null);
  // t1 暂存 `<DialogContext.Provider value={dialog}>{children}</Dialog...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children || $[1] !== dialog) {
    // t1 暂存 `<DialogContext.Provider value={dialog}>{children}</Dialog...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <DialogContext.Provider value={dialog}>{children}</DialogContext.Provider>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `dialog`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = dialog;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<SetContext.Provider value={setData}><SetDialogContext.Pr...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== data || $[4] !== t1) {
    // t2 暂存 `<SetContext.Provider value={setData}><SetDialogContext.Pr...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <SetContext.Provider value={setData}><SetDialogContext.Provider value={setDialog}><DataContext.Provider value={data}>{t1}</DataContext.Provider></SetDialogContext.Provider></SetContext.Provider>;
    // $[3] 缓存 `data`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = data;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 返回 `t2`，作为prompt Overlay Context这次计算的结果。
  return t2;
}
// usePromptOverlay 封装promptOverlayContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePromptOverlay() {
  // 返回 `useContext(DataContext)`，作为prompt Overlay Context这次计算的结果。
  return useContext(DataContext);
}
// usePromptOverlayDialog 封装promptOverlayContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePromptOverlayDialog() {
  // 返回 `useContext(DialogContext)`，作为prompt Overlay Context这次计算的结果。
  return useContext(DialogContext);
}

/**
 * Register suggestion data for the floating overlay. Clears on unmount.
 * No-op outside the provider (non-fullscreen renders inline instead).
 */
// useSetPromptOverlay 封装promptOverlayContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSetPromptOverlay(data) {
  // $保存`_c`，供prompt Overlay Context后续处理使用。
  const $ = _c(4);
  // set保存`useContext`，供prompt Overlay Context后续处理使用。
  const set = useContext(SetContext);
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 暂存 `[set, data]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== data || $[1] !== set) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // set缺失时提前走兜底路径，避免prompt Overlay Context继续依赖无效输入。
      if (!set) {
        // prompt Overlay Context在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 set，触发prompt Overlay Context此处需要的副作用。
      set(data);
      // 返回 `() => set(null)`，作为prompt Overlay Context这次计算的结果。
      return () => set(null);
    };
    // t1 暂存 `[set, data]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [set, data];
    // $[0] 缓存 `data`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = data;
    // $[1] 缓存 `set`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = set;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 调用 useEffect，触发prompt Overlay Context此处需要的副作用。
  useEffect(t0, t1);
}

/**
 * Register a dialog node to float above the prompt. Clears on unmount.
 * No-op outside the provider (non-fullscreen renders inline instead).
 */
// useSetPromptOverlayDialog 封装promptOverlayContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSetPromptOverlayDialog(node) {
  // $保存`_c`，供prompt Overlay Context后续处理使用。
  const $ = _c(4);
  // set保存`useContext`，供prompt Overlay Context后续处理使用。
  const set = useContext(SetDialogContext);
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 暂存 `[set, node]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== node || $[1] !== set) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // set缺失时提前走兜底路径，避免prompt Overlay Context继续依赖无效输入。
      if (!set) {
        // prompt Overlay Context在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 set，触发prompt Overlay Context此处需要的副作用。
      set(node);
      // 返回 `() => set(null)`，作为prompt Overlay Context这次计算的结果。
      return () => set(null);
    };
    // t1 暂存 `[set, node]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [set, node];
    // $[0] 缓存 `node`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = node;
    // $[1] 缓存 `set`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = set;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 调用 useEffect，触发prompt Overlay Context此处需要的副作用。
  useEffect(t0, t1);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJSZWFjdE5vZGUiLCJ1c2VDb250ZXh0IiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJTdWdnZXN0aW9uSXRlbSIsIlByb21wdE92ZXJsYXlEYXRhIiwic3VnZ2VzdGlvbnMiLCJzZWxlY3RlZFN1Z2dlc3Rpb24iLCJtYXhDb2x1bW5XaWR0aCIsIlNldHRlciIsImQiLCJUIiwiRGF0YUNvbnRleHQiLCJTZXRDb250ZXh0IiwiRGlhbG9nQ29udGV4dCIsIlNldERpYWxvZ0NvbnRleHQiLCJQcm9tcHRPdmVybGF5UHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsImNoaWxkcmVuIiwiZGF0YSIsInNldERhdGEiLCJkaWFsb2ciLCJzZXREaWFsb2ciLCJ0MSIsInQyIiwidXNlUHJvbXB0T3ZlcmxheSIsInVzZVByb21wdE92ZXJsYXlEaWFsb2ciLCJ1c2VTZXRQcm9tcHRPdmVybGF5Iiwic2V0IiwidXNlU2V0UHJvbXB0T3ZlcmxheURpYWxvZyIsIm5vZGUiXSwic291cmNlcyI6WyJwcm9tcHRPdmVybGF5Q29udGV4dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQb3J0YWwgZm9yIGNvbnRlbnQgdGhhdCBmbG9hdHMgYWJvdmUgdGhlIHByb21wdCBzbyBpdCBlc2NhcGVzXG4gKiBGdWxsc2NyZWVuTGF5b3V0J3MgYm90dG9tLXNsb3QgYG92ZXJmbG93WTpoaWRkZW5gIGNsaXAuXG4gKlxuICogVGhlIGNsaXAgaXMgbG9hZC1iZWFyaW5nIChDQy02Njg6IHRhbGwgcGFzdGVzIHNxdWFzaCB0aGUgU2Nyb2xsQm94XG4gKiB3aXRob3V0IGl0KSwgYnV0IGZsb2F0aW5nIG92ZXJsYXlzIHVzZSBgcG9zaXRpb246YWJzb2x1dGVcbiAqIGJvdHRvbT1cIjEwMCVcImAgdG8gZmxvYXQgYWJvdmUgdGhlIHByb21wdCDigJQgYW5kIEluaydzIGNsaXAgc3RhY2tcbiAqIGludGVyc2VjdHMgQUxMIGRlc2NlbmRhbnRzLCBzbyB0aGV5IHdlcmUgY2xpcHBlZCB0byB+MSByb3cuXG4gKlxuICogVHdvIGNoYW5uZWxzOlxuICogLSBgdXNlU2V0UHJvbXB0T3ZlcmxheWAg4oCUIHNsYXNoLWNvbW1hbmQgc3VnZ2VzdGlvbiBkYXRhIChzdHJ1Y3R1cmVkLFxuICogICB3cml0dGVuIGJ5IFByb21wdElucHV0Rm9vdGVyKVxuICogLSBgdXNlU2V0UHJvbXB0T3ZlcmxheURpYWxvZ2Ag4oCUIGFyYml0cmFyeSBkaWFsb2cgbm9kZSAoZS5nLlxuICogICBBdXRvTW9kZU9wdEluRGlhbG9nLCB3cml0dGVuIGJ5IFByb21wdElucHV0KVxuICpcbiAqIEZ1bGxzY3JlZW5MYXlvdXQgcmVhZHMgYm90aCBhbmQgcmVuZGVycyB0aGVtIG91dHNpZGUgdGhlIGNsaXBwZWQgc2xvdC5cbiAqXG4gKiBTcGxpdCBpbnRvIGRhdGEvc2V0dGVyIGNvbnRleHQgcGFpcnMgc28gd3JpdGVycyBuZXZlciByZS1yZW5kZXIgb25cbiAqIHRoZWlyIG93biB3cml0ZXMg4oCUIHRoZSBzZXR0ZXIgY29udGV4dHMgYXJlIHN0YWJsZS5cbiAqL1xuaW1wb3J0IFJlYWN0LCB7XG4gIGNyZWF0ZUNvbnRleHQsXG4gIHR5cGUgUmVhY3ROb2RlLFxuICB1c2VDb250ZXh0LFxuICB1c2VFZmZlY3QsXG4gIHVzZVN0YXRlLFxufSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgU3VnZ2VzdGlvbkl0ZW0gfSBmcm9tICcuLi9jb21wb25lbnRzL1Byb21wdElucHV0L1Byb21wdElucHV0Rm9vdGVyU3VnZ2VzdGlvbnMuanMnXG5cbmV4cG9ydCB0eXBlIFByb21wdE92ZXJsYXlEYXRhID0ge1xuICBzdWdnZXN0aW9uczogU3VnZ2VzdGlvbkl0ZW1bXVxuICBzZWxlY3RlZFN1Z2dlc3Rpb246IG51bWJlclxuICBtYXhDb2x1bW5XaWR0aD86IG51bWJlclxufVxuXG50eXBlIFNldHRlcjxUPiA9IChkOiBUIHwgbnVsbCkgPT4gdm9pZFxuXG5jb25zdCBEYXRhQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8UHJvbXB0T3ZlcmxheURhdGEgfCBudWxsPihudWxsKVxuY29uc3QgU2V0Q29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8U2V0dGVyPFByb21wdE92ZXJsYXlEYXRhPiB8IG51bGw+KG51bGwpXG5jb25zdCBEaWFsb2dDb250ZXh0ID0gY3JlYXRlQ29udGV4dDxSZWFjdE5vZGU+KG51bGwpXG5jb25zdCBTZXREaWFsb2dDb250ZXh0ID0gY3JlYXRlQ29udGV4dDxTZXR0ZXI8UmVhY3ROb2RlPiB8IG51bGw+KG51bGwpXG5cbmV4cG9ydCBmdW5jdGlvbiBQcm9tcHRPdmVybGF5UHJvdmlkZXIoe1xuICBjaGlsZHJlbixcbn06IHtcbiAgY2hpbGRyZW46IFJlYWN0Tm9kZVxufSk6IFJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtkYXRhLCBzZXREYXRhXSA9IHVzZVN0YXRlPFByb21wdE92ZXJsYXlEYXRhIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2RpYWxvZywgc2V0RGlhbG9nXSA9IHVzZVN0YXRlPFJlYWN0Tm9kZT4obnVsbClcbiAgcmV0dXJuIChcbiAgICA8U2V0Q29udGV4dC5Qcm92aWRlciB2YWx1ZT17c2V0RGF0YX0+XG4gICAgICA8U2V0RGlhbG9nQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17c2V0RGlhbG9nfT5cbiAgICAgICAgPERhdGFDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXtkYXRhfT5cbiAgICAgICAgICA8RGlhbG9nQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17ZGlhbG9nfT5cbiAgICAgICAgICAgIHtjaGlsZHJlbn1cbiAgICAgICAgICA8L0RpYWxvZ0NvbnRleHQuUHJvdmlkZXI+XG4gICAgICAgIDwvRGF0YUNvbnRleHQuUHJvdmlkZXI+XG4gICAgICA8L1NldERpYWxvZ0NvbnRleHQuUHJvdmlkZXI+XG4gICAgPC9TZXRDb250ZXh0LlByb3ZpZGVyPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VQcm9tcHRPdmVybGF5KCk6IFByb21wdE92ZXJsYXlEYXRhIHwgbnVsbCB7XG4gIHJldHVybiB1c2VDb250ZXh0KERhdGFDb250ZXh0KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlUHJvbXB0T3ZlcmxheURpYWxvZygpOiBSZWFjdE5vZGUge1xuICByZXR1cm4gdXNlQ29udGV4dChEaWFsb2dDb250ZXh0KVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIHN1Z2dlc3Rpb24gZGF0YSBmb3IgdGhlIGZsb2F0aW5nIG92ZXJsYXkuIENsZWFycyBvbiB1bm1vdW50LlxuICogTm8tb3Agb3V0c2lkZSB0aGUgcHJvdmlkZXIgKG5vbi1mdWxsc2NyZWVuIHJlbmRlcnMgaW5saW5lIGluc3RlYWQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlU2V0UHJvbXB0T3ZlcmxheShkYXRhOiBQcm9tcHRPdmVybGF5RGF0YSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3Qgc2V0ID0gdXNlQ29udGV4dChTZXRDb250ZXh0KVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghc2V0KSByZXR1cm5cbiAgICBzZXQoZGF0YSlcbiAgICByZXR1cm4gKCkgPT4gc2V0KG51bGwpXG4gIH0sIFtzZXQsIGRhdGFdKVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgZGlhbG9nIG5vZGUgdG8gZmxvYXQgYWJvdmUgdGhlIHByb21wdC4gQ2xlYXJzIG9uIHVubW91bnQuXG4gKiBOby1vcCBvdXRzaWRlIHRoZSBwcm92aWRlciAobm9uLWZ1bGxzY3JlZW4gcmVuZGVycyBpbmxpbmUgaW5zdGVhZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VTZXRQcm9tcHRPdmVybGF5RGlhbG9nKG5vZGU6IFJlYWN0Tm9kZSk6IHZvaWQge1xuICBjb25zdCBzZXQgPSB1c2VDb250ZXh0KFNldERpYWxvZ0NvbnRleHQpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFzZXQpIHJldHVyblxuICAgIHNldChub2RlKVxuICAgIHJldHVybiAoKSA9PiBzZXQobnVsbClcbiAgfSwgW3NldCwgbm9kZV0pXG59XG4i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