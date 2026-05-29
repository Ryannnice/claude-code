// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 createContext、RefObject、useContext，将 react 中已经封装好的能力接到本文件流程里。
import { createContext, type RefObject, useContext } from 'react';
// 类型依赖 { ScrollBoxHandle } 来自 ../ink/components/ScrollBox.js，用于校准modal Context的数据契约。
import type { ScrollBoxHandle } from '../ink/components/ScrollBox.js';

/**
 * Set by FullscreenLayout when rendering content in its `modal` slot —
 * the absolute-positioned bottom-anchored pane for slash-command dialogs.
 * Consumers use this to:
 *
 * - Suppress top-level framing — `Pane` skips its full-terminal-width
 *   `Divider` (FullscreenLayout already draws the ▔ divider).
 * - Size Select pagination to the available rows — the modal's inner
 *   area is smaller than the terminal (rows minus transcript peek minus
 *   divider), so components that cap their visible option count from
 *   `useTerminalSize().rows` would overflow without this context.
 * - Reset scroll on tab switch — Tabs keys its ScrollBox by
 *   `selectedTabIndex`, remounting on tab switch so scrollTop resets to 0
 *   without scrollTo() timing games.
 *
 * null = not inside the modal slot.
 */
// ModalCtx 固化modal Context里传递的数据形状，帮助调用方按同一结构读写字段。
type ModalCtx = {
  rows: number;
  columns: number;
  scrollRef: RefObject<ScrollBoxHandle | null> | null;
};
// ModalContext构建`createContext<ModalCtx | null>(null)`，供后续判断或组装使用。
export const ModalContext = createContext<ModalCtx | null>(null);
// useIsInsideModal 封装modalContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIsInsideModal() {
  // 返回 `useContext(ModalContext) !== null`，作为modal Context这次计算的结果。
  return useContext(ModalContext) !== null;
}

/**
 * Available content rows/columns when inside a Modal, else falls back to
 * the provided terminal size. Use instead of `useTerminalSize()` when a
 * component caps its visible content height — the modal's inner area is
 * smaller than the terminal.
 */
// useModalOrTerminalSize 封装modalContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useModalOrTerminalSize(fallback) {
  // $保存`_c`，供modal Context后续处理使用。
  const $ = _c(3);
  // ctx保存`useContext`，供modal Context后续处理使用。
  const ctx = useContext(ModalContext);
  // t0 暂存 `ctx ? {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== ctx || $[1] !== fallback) {
    // t0 暂存 `ctx ? {` 生成的渲染片段，后续返回路径直接复用。
    t0 = ctx ? {
      rows: ctx.rows,
      columns: ctx.columns
    } : fallback;
    // $[0] 缓存 `ctx`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = ctx;
    // $[1] 缓存 `fallback`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = fallback;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // 返回 `t0`，作为modal Context这次计算的结果。
  return t0;
}
// useModalScrollRef 封装modalContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useModalScrollRef() {
  // 返回 `useContext(ModalContext)?.scrollRef ?? null`，作为modal Context这次计算的结果。
  return useContext(ModalContext)?.scrollRef ?? null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwiUmVmT2JqZWN0IiwidXNlQ29udGV4dCIsIlNjcm9sbEJveEhhbmRsZSIsIk1vZGFsQ3R4Iiwicm93cyIsImNvbHVtbnMiLCJzY3JvbGxSZWYiLCJNb2RhbENvbnRleHQiLCJ1c2VJc0luc2lkZU1vZGFsIiwidXNlTW9kYWxPclRlcm1pbmFsU2l6ZSIsImZhbGxiYWNrIiwiJCIsIl9jIiwiY3R4IiwidDAiLCJ1c2VNb2RhbFNjcm9sbFJlZiJdLCJzb3VyY2VzIjpbIm1vZGFsQ29udGV4dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ29udGV4dCwgdHlwZSBSZWZPYmplY3QsIHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgU2Nyb2xsQm94SGFuZGxlIH0gZnJvbSAnLi4vaW5rL2NvbXBvbmVudHMvU2Nyb2xsQm94LmpzJ1xuXG4vKipcbiAqIFNldCBieSBGdWxsc2NyZWVuTGF5b3V0IHdoZW4gcmVuZGVyaW5nIGNvbnRlbnQgaW4gaXRzIGBtb2RhbGAgc2xvdCDigJRcbiAqIHRoZSBhYnNvbHV0ZS1wb3NpdGlvbmVkIGJvdHRvbS1hbmNob3JlZCBwYW5lIGZvciBzbGFzaC1jb21tYW5kIGRpYWxvZ3MuXG4gKiBDb25zdW1lcnMgdXNlIHRoaXMgdG86XG4gKlxuICogLSBTdXBwcmVzcyB0b3AtbGV2ZWwgZnJhbWluZyDigJQgYFBhbmVgIHNraXBzIGl0cyBmdWxsLXRlcm1pbmFsLXdpZHRoXG4gKiAgIGBEaXZpZGVyYCAoRnVsbHNjcmVlbkxheW91dCBhbHJlYWR5IGRyYXdzIHRoZSDilpQgZGl2aWRlcikuXG4gKiAtIFNpemUgU2VsZWN0IHBhZ2luYXRpb24gdG8gdGhlIGF2YWlsYWJsZSByb3dzIOKAlCB0aGUgbW9kYWwncyBpbm5lclxuICogICBhcmVhIGlzIHNtYWxsZXIgdGhhbiB0aGUgdGVybWluYWwgKHJvd3MgbWludXMgdHJhbnNjcmlwdCBwZWVrIG1pbnVzXG4gKiAgIGRpdmlkZXIpLCBzbyBjb21wb25lbnRzIHRoYXQgY2FwIHRoZWlyIHZpc2libGUgb3B0aW9uIGNvdW50IGZyb21cbiAqICAgYHVzZVRlcm1pbmFsU2l6ZSgpLnJvd3NgIHdvdWxkIG92ZXJmbG93IHdpdGhvdXQgdGhpcyBjb250ZXh0LlxuICogLSBSZXNldCBzY3JvbGwgb24gdGFiIHN3aXRjaCDigJQgVGFicyBrZXlzIGl0cyBTY3JvbGxCb3ggYnlcbiAqICAgYHNlbGVjdGVkVGFiSW5kZXhgLCByZW1vdW50aW5nIG9uIHRhYiBzd2l0Y2ggc28gc2Nyb2xsVG9wIHJlc2V0cyB0byAwXG4gKiAgIHdpdGhvdXQgc2Nyb2xsVG8oKSB0aW1pbmcgZ2FtZXMuXG4gKlxuICogbnVsbCA9IG5vdCBpbnNpZGUgdGhlIG1vZGFsIHNsb3QuXG4gKi9cbnR5cGUgTW9kYWxDdHggPSB7XG4gIHJvd3M6IG51bWJlclxuICBjb2x1bW5zOiBudW1iZXJcbiAgc2Nyb2xsUmVmOiBSZWZPYmplY3Q8U2Nyb2xsQm94SGFuZGxlIHwgbnVsbD4gfCBudWxsXG59XG5leHBvcnQgY29uc3QgTW9kYWxDb250ZXh0ID0gY3JlYXRlQ29udGV4dDxNb2RhbEN0eCB8IG51bGw+KG51bGwpXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VJc0luc2lkZU1vZGFsKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gdXNlQ29udGV4dChNb2RhbENvbnRleHQpICE9PSBudWxsXG59XG5cbi8qKlxuICogQXZhaWxhYmxlIGNvbnRlbnQgcm93cy9jb2x1bW5zIHdoZW4gaW5zaWRlIGEgTW9kYWwsIGVsc2UgZmFsbHMgYmFjayB0b1xuICogdGhlIHByb3ZpZGVkIHRlcm1pbmFsIHNpemUuIFVzZSBpbnN0ZWFkIG9mIGB1c2VUZXJtaW5hbFNpemUoKWAgd2hlbiBhXG4gKiBjb21wb25lbnQgY2FwcyBpdHMgdmlzaWJsZSBjb250ZW50IGhlaWdodCDigJQgdGhlIG1vZGFsJ3MgaW5uZXIgYXJlYSBpc1xuICogc21hbGxlciB0aGFuIHRoZSB0ZXJtaW5hbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU1vZGFsT3JUZXJtaW5hbFNpemUoZmFsbGJhY2s6IHtcbiAgcm93czogbnVtYmVyXG4gIGNvbHVtbnM6IG51bWJlclxufSk6IHsgcm93czogbnVtYmVyOyBjb2x1bW5zOiBudW1iZXIgfSB7XG4gIGNvbnN0IGN0eCA9IHVzZUNvbnRleHQoTW9kYWxDb250ZXh0KVxuICByZXR1cm4gY3R4ID8geyByb3dzOiBjdHgucm93cywgY29sdW1uczogY3R4LmNvbHVtbnMgfSA6IGZhbGxiYWNrXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VNb2RhbFNjcm9sbFJlZigpOiBSZWZPYmplY3Q8U2Nyb2xsQm94SGFuZGxlIHwgbnVsbD4gfCBudWxsIHtcbiAgcmV0dXJuIHVzZUNvbnRleHQoTW9kYWxDb250ZXh0KT8uc2Nyb2xsUmVmID8/IG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLGFBQWEsRUFBRSxLQUFLQyxTQUFTLEVBQUVDLFVBQVUsUUFBUSxPQUFPO0FBQ2pFLGNBQWNDLGVBQWUsUUFBUSxnQ0FBZ0M7O0FBRXJFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLQyxRQUFRLEdBQUc7RUFDZEMsSUFBSSxFQUFFLE1BQU07RUFDWkMsT0FBTyxFQUFFLE1BQU07RUFDZkMsU0FBUyxFQUFFTixTQUFTLENBQUNFLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJO0FBQ3JELENBQUM7QUFDRCxPQUFPLE1BQU1LLFlBQVksR0FBR1IsYUFBYSxDQUFDSSxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO0FBRWhFLE9BQU8sU0FBQUssaUJBQUE7RUFBQSxPQUNFUCxVQUFVLENBQUNNLFlBQVksQ0FBQyxLQUFLLElBQUk7QUFBQTs7QUFHMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBRSx1QkFBQUMsUUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUlMLE1BQUFDLEdBQUEsR0FBWVosVUFBVSxDQUFDTSxZQUFZLENBQUM7RUFBQSxJQUFBTyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBRSxHQUFBLElBQUFGLENBQUEsUUFBQUQsUUFBQTtJQUM3QkksRUFBQSxHQUFBRCxHQUFHLEdBQUg7TUFBQVQsSUFBQSxFQUFjUyxHQUFHLENBQUFULElBQUs7TUFBQUMsT0FBQSxFQUFXUSxHQUFHLENBQUFSO0lBQW9CLENBQUMsR0FBekRLLFFBQXlEO0lBQUFDLENBQUEsTUFBQUUsR0FBQTtJQUFBRixDQUFBLE1BQUFELFFBQUE7SUFBQUMsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFBQSxPQUF6REcsRUFBeUQ7QUFBQTtBQUdsRSxPQUFPLFNBQUFDLGtCQUFBO0VBQUEsT0FDRWQsVUFBVSxDQUFDTSxZQUF1QixDQUFDLEVBQUFELFNBQVEsSUFBM0MsSUFBMkM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==