// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useLayoutEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 复用 useTerminalViewport 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTerminalViewport } from '../../ink/hooks/use-terminal-viewport.js';
// 引入 Box、DOMElement、measureElement，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, type DOMElement, measureElement } from '../../ink.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: React.ReactNode;
  lock?: 'always' | 'offscreen';
};
// Ratchet 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Ratchet(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    lock: t1
  } = t0;
  // lock标记终端 UI Ratchet是否启用对应路径。
  const lock = t1 === undefined ? "always" : t1;
  // 从 `useTerminalViewport()` 按位置拆出 viewportRef、t2，让终端 UI 组件 Ratchet分别处理这些返回值。
  const [viewportRef, t2] = useTerminalViewport();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isVisible
  } = t2;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rows
  } = useTerminalSize();
  // innerRef 引用保存`useRef`，供终端渲染后续处理使用。
  const innerRef = useRef(null);
  // maxHeight保存`useRef`，供终端渲染后续处理使用。
  const maxHeight = useRef(0);
  // minHeight 由 React state 持有，setMinHeight 会在用户操作或异步结果返回时触发刷新。
  const [minHeight, setMinHeight] = useState(0);
  // t3 暂存 `el => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== viewportRef) {
    // t3 暂存 `el => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = el => {
      // 调用 viewportRef，触发终端渲染此处需要的副作用。
      viewportRef(el);
    };
    // $[0] 缓存 `viewportRef`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = viewportRef;
    // $[1] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[1];
  }
  // outerRef 引用沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const outerRef = t3;
  // engaged标记终端 UI Ratchet是否启用对应路径。
  const engaged = lock === "always" || !isVisible;
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== rows) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // innerRef.current缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!innerRef.current) {
        // 终端 UI 组件 Ratchet在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        height
      } = measureElement(innerRef.current);
      // 满足 `height > maxHeight.current` 时，终端渲染执行该分支。
      if (height > maxHeight.current) {
        // current更新为 `Math.min(height, rows)`，确保终端 UI后续读取最新状态。
        maxHeight.current = Math.min(height, rows);
        // setMinHeight 写入新的状态值，使终端渲染后续读取保持一致。
        setMinHeight(maxHeight.current);
      }
    };
    // $[2] 缓存 `rows`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = rows;
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // 调用 useLayoutEffect，触发终端渲染此处需要的副作用。
  useLayoutEffect(t4);
  // 临时值 t5 命名 `engaged ? minHeight : undefined`，让后续代码直接表达这个值的用途。
  const t5 = engaged ? minHeight : undefined;
  // t6 暂存 `<Box ref={innerRef} flexDirection="column">{children}</Bo...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== children) {
    // t6 暂存 `<Box ref={innerRef} flexDirection="column">{children}</Bo...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box ref={innerRef} flexDirection="column">{children}</Box>;
    // $[4] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = children;
    // $[5] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[5];
  }
  // t7 暂存 `<Box minHeight={t5} ref={outerRef}>{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== outerRef || $[7] !== t5 || $[8] !== t6) {
    // t7 暂存 `<Box minHeight={t5} ref={outerRef}>{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box minHeight={t5} ref={outerRef}>{t6}</Box>;
    // $[6] 缓存 `outerRef`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = outerRef;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlTGF5b3V0RWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VUZXJtaW5hbFNpemUiLCJ1c2VUZXJtaW5hbFZpZXdwb3J0IiwiQm94IiwiRE9NRWxlbWVudCIsIm1lYXN1cmVFbGVtZW50IiwiUHJvcHMiLCJjaGlsZHJlbiIsIlJlYWN0Tm9kZSIsImxvY2siLCJSYXRjaGV0IiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsInZpZXdwb3J0UmVmIiwidDIiLCJpc1Zpc2libGUiLCJyb3dzIiwiaW5uZXJSZWYiLCJtYXhIZWlnaHQiLCJtaW5IZWlnaHQiLCJzZXRNaW5IZWlnaHQiLCJ0MyIsImVsIiwib3V0ZXJSZWYiLCJlbmdhZ2VkIiwidDQiLCJjdXJyZW50IiwiaGVpZ2h0IiwiTWF0aCIsIm1pbiIsInQ1IiwidDYiLCJ0NyJdLCJzb3VyY2VzIjpbIlJhdGNoZXQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlTGF5b3V0RWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFZpZXdwb3J0IH0gZnJvbSAnLi4vLi4vaW5rL2hvb2tzL3VzZS10ZXJtaW5hbC12aWV3cG9ydC5qcydcbmltcG9ydCB7IEJveCwgdHlwZSBET01FbGVtZW50LCBtZWFzdXJlRWxlbWVudCB9IGZyb20gJy4uLy4uL2luay5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxuICBsb2NrPzogJ2Fsd2F5cycgfCAnb2Zmc2NyZWVuJ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gUmF0Y2hldCh7IGNoaWxkcmVuLCBsb2NrID0gJ2Fsd2F5cycgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbdmlld3BvcnRSZWYsIHsgaXNWaXNpYmxlIH1dID0gdXNlVGVybWluYWxWaWV3cG9ydCgpXG4gIGNvbnN0IHsgcm93cyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgaW5uZXJSZWYgPSB1c2VSZWY8RE9NRWxlbWVudCB8IG51bGw+KG51bGwpXG4gIGNvbnN0IG1heEhlaWdodCA9IHVzZVJlZigwKVxuICBjb25zdCBbbWluSGVpZ2h0LCBzZXRNaW5IZWlnaHRdID0gdXNlU3RhdGUoMClcblxuICBjb25zdCBvdXRlclJlZiA9IHVzZUNhbGxiYWNrKFxuICAgIChlbDogRE9NRWxlbWVudCB8IG51bGwpID0+IHtcbiAgICAgIHZpZXdwb3J0UmVmKGVsKVxuICAgIH0sXG4gICAgW3ZpZXdwb3J0UmVmXSxcbiAgKVxuXG4gIGNvbnN0IGVuZ2FnZWQgPSBsb2NrID09PSAnYWx3YXlzJyB8fCAhaXNWaXNpYmxlXG5cbiAgdXNlTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWlubmVyUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCB7IGhlaWdodCB9ID0gbWVhc3VyZUVsZW1lbnQoaW5uZXJSZWYuY3VycmVudClcbiAgICBpZiAoaGVpZ2h0ID4gbWF4SGVpZ2h0LmN1cnJlbnQpIHtcbiAgICAgIG1heEhlaWdodC5jdXJyZW50ID0gTWF0aC5taW4oaGVpZ2h0LCByb3dzKVxuICAgICAgc2V0TWluSGVpZ2h0KG1heEhlaWdodC5jdXJyZW50KVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gKFxuICAgIDxCb3ggbWluSGVpZ2h0PXtlbmdhZ2VkID8gbWluSGVpZ2h0IDogdW5kZWZpbmVkfSByZWY9e291dGVyUmVmfT5cbiAgICAgIDxCb3ggcmVmPXtpbm5lclJlZn0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICB7Y2hpbGRyZW59XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1h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