// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 ReactNode、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { type ReactNode, useEffect, useRef, useState } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useShortcutDisplay，将 ../../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js';
// SandboxPromptFooterHint 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SandboxPromptFooterHint() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // recentViolationCount 数量 由 React state 持有，setRecentViolationCount 会在用户操作或异步结果返回时触发刷新。
  const [recentViolationCount, setRecentViolationCount] = useState(0);
  // timerRef 引用保存`useRef`，供终端渲染后续处理使用。
  const timerRef = useRef(null);
  // detailsShortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const detailsShortcut = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 满足 `!SandboxManager.isSandboxingEnabled()` 时，终端渲染执行该分支。
      if (!SandboxManager.isSandboxingEnabled()) {
        // 提示输入组件 Sandbox Prompt Footer Hint在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // store读取`SandboxManager.getSandboxViolationStore`，供终端渲染后续处理使用。
      const store = SandboxManager.getSandboxViolationStore();
      // lastCount 数量读取`store.getTotalCount`，供终端渲染后续处理使用。
      let lastCount = store.getTotalCount();
      // unsubscribe保存`store.subscribe`，供终端渲染后续处理使用。
      const unsubscribe = store.subscribe(() => {
        // currentCount 数量读取`store.getTotalCount`，供终端渲染后续处理使用。
        const currentCount = store.getTotalCount();
        // newViolations 集合保存`currentCount - lastCount`，供终端渲染提示输入组件 Sandbox Prompt Footer ...后续判断或输出使用。
        const newViolations = currentCount - lastCount;
        // 满足 `newViolations > 0` 时，终端渲染执行该分支。
        if (newViolations > 0) {
          // setRecentViolationCount 写入新的状态值，使终端渲染后续读取保持一致。
          setRecentViolationCount(newViolations);
          // lastCount 数量更新为 `currentCount`，确保提示输入组件后续读取最新状态。
          lastCount = currentCount;
          // 满足 `timerRef.current` 时，终端渲染执行该分支。
          if (timerRef.current) {
            // 调用 clearTimeout，触发终端渲染此处需要的副作用。
            clearTimeout(timerRef.current);
          }
          // current更新为 `setTimeout(setRecentViolationCount, 5000, 0)`，确保提示输入组件后续读取最新状态。
          timerRef.current = setTimeout(setRecentViolationCount, 5000, 0);
        }
      });
      // 返回 `() => {`，作为终端渲染这次计算的结果。
      return () => {
        // 调用 unsubscribe，触发终端渲染此处需要的副作用。
        unsubscribe();
        // 满足 `timerRef.current` 时，终端渲染执行该分支。
        if (timerRef.current) {
          // 调用 clearTimeout，触发终端渲染此处需要的副作用。
          clearTimeout(timerRef.current);
        }
      };
    };
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t0, t1);
  // 只有 `!SandboxManager.isSandboxingEnabled() || recentViolationCount === 0` 满足时，终端渲染才执行该分支。
  if (!SandboxManager.isSandboxingEnabled() || recentViolationCount === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t2标记终端渲染提示输入组件 Sandbox Prompt Footer ...是否启用对应路径。
  const t2 = recentViolationCount === 1 ? "operation" : "operations";
  // t3 暂存 `<Box paddingX={0} paddingY={0}><Text color="inactive" wra...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== detailsShortcut || $[3] !== recentViolationCount || $[4] !== t2) {
    // t3 暂存 `<Box paddingX={0} paddingY={0}><Text color="inactive" wra...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box paddingX={0} paddingY={0}><Text color="inactive" wrap="truncate">⧈ Sandbox blocked {recentViolationCount}{" "}{t2} ·{" "}{detailsShortcut} for details · /sandbox to disable</Text></Box>;
    // $[2] 缓存 `detailsShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = detailsShortcut;
    // $[3] 缓存 `recentViolationCount`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = recentViolationCount;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsInVzZVNob3J0Y3V0RGlzcGxheSIsIlNhbmRib3hNYW5hZ2VyIiwiU2FuZGJveFByb21wdEZvb3RlckhpbnQiLCIkIiwiX2MiLCJyZWNlbnRWaW9sYXRpb25Db3VudCIsInNldFJlY2VudFZpb2xhdGlvbkNvdW50IiwidGltZXJSZWYiLCJkZXRhaWxzU2hvcnRjdXQiLCJ0MCIsInQxIiwiU3ltYm9sIiwiZm9yIiwiaXNTYW5kYm94aW5nRW5hYmxlZCIsInN0b3JlIiwiZ2V0U2FuZGJveFZpb2xhdGlvblN0b3JlIiwibGFzdENvdW50IiwiZ2V0VG90YWxDb3VudCIsInVuc3Vic2NyaWJlIiwic3Vic2NyaWJlIiwiY3VycmVudENvdW50IiwibmV3VmlvbGF0aW9ucyIsImN1cnJlbnQiLCJjbGVhclRpbWVvdXQiLCJzZXRUaW1lb3V0IiwidDIiLCJ0MyJdLCJzb3VyY2VzIjpbIlNhbmRib3hQcm9tcHRGb290ZXJIaW50LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHR5cGUgUmVhY3ROb2RlLCB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcbmltcG9ydCB7IFNhbmRib3hNYW5hZ2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2FuZGJveC9zYW5kYm94LWFkYXB0ZXIuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBTYW5kYm94UHJvbXB0Rm9vdGVySGludCgpOiBSZWFjdE5vZGUge1xuICBjb25zdCBbcmVjZW50VmlvbGF0aW9uQ291bnQsIHNldFJlY2VudFZpb2xhdGlvbkNvdW50XSA9IHVzZVN0YXRlKDApXG4gIGNvbnN0IHRpbWVyUmVmID0gdXNlUmVmPE5vZGVKUy5UaW1lb3V0IHwgbnVsbD4obnVsbClcbiAgY29uc3QgZGV0YWlsc1Nob3J0Y3V0ID0gdXNlU2hvcnRjdXREaXNwbGF5KFxuICAgICdhcHA6dG9nZ2xlVHJhbnNjcmlwdCcsXG4gICAgJ0dsb2JhbCcsXG4gICAgJ2N0cmwrbycsXG4gIClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghU2FuZGJveE1hbmFnZXIuaXNTYW5kYm94aW5nRW5hYmxlZCgpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBzdG9yZSA9IFNhbmRib3hNYW5hZ2VyLmdldFNhbmRib3hWaW9sYXRpb25TdG9yZSgpXG4gICAgbGV0IGxhc3RDb3VudCA9IHN0b3JlLmdldFRvdGFsQ291bnQoKVxuXG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBzdG9yZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudENvdW50ID0gc3RvcmUuZ2V0VG90YWxDb3VudCgpXG4gICAgICBjb25zdCBuZXdWaW9sYXRpb25zID0gY3VycmVudENvdW50IC0gbGFzdENvdW50XG5cbiAgICAgIGlmIChuZXdWaW9sYXRpb25zID4gMCkge1xuICAgICAgICBzZXRSZWNlbnRWaW9sYXRpb25Db3VudChuZXdWaW9sYXRpb25zKVxuICAgICAgICBsYXN0Q291bnQgPSBjdXJyZW50Q291bnRcblxuICAgICAgICBpZiAodGltZXJSZWYuY3VycmVudCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lclJlZi5jdXJyZW50KVxuICAgICAgICB9XG5cbiAgICAgICAgdGltZXJSZWYuY3VycmVudCA9IHNldFRpbWVvdXQoc2V0UmVjZW50VmlvbGF0aW9uQ291bnQsIDUwMDAsIDApXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB1bnN1YnNjcmliZSgpXG4gICAgICBpZiAodGltZXJSZWYuY3VycmVudCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXJSZWYuY3VycmVudClcbiAgICAgIH1cbiAgICB9XG4gIH0sIFtdKVxuXG4gIGlmICghU2FuZGJveE1hbmFnZXIuaXNTYW5kYm94aW5nRW5hYmxlZCgpIHx8IHJlY2VudFZpb2xhdGlvbkNvdW50ID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBwYWRkaW5nWD17MH0gcGFkZGluZ1k9ezB9PlxuICAgICAgPFRleHQgY29sb3I9XCJpbmFjdGl2ZVwiIHdyYXA9XCJ0cnVuY2F0ZVwiPlxuICAgICAgICDip4ggU2FuZGJveCBibG9ja2VkIHtyZWNlbnRWaW9sYXRpb25Db3VudH17JyAnfVxuICAgICAgICB7cmVjZW50VmlvbGF0aW9uQ291bnQgPT09IDEgPyAnb3BlcmF0aW9uJyA6ICdvcGVyYXRpb25zJ30gwrd7JyAnfVxuICAgICAgICB7ZGV0YWlsc1Nob3J0Y3V0fSBmb3IgZGV0YWlscyDCtyAvc2FuZGJveCB0byBkaXNhYmxlXG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBUyxLQUFLQyxTQUFTLEVBQUVDLFNBQVMsRUFBRUMsTUFBTSxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNuRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGtCQUFrQixRQUFRLHlDQUF5QztBQUM1RSxTQUFTQyxjQUFjLFFBQVEsd0NBQXdDO0FBRXZFLE9BQU8sU0FBQUMsd0JBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFDTCxPQUFBQyxvQkFBQSxFQUFBQyx1QkFBQSxJQUF3RFQsUUFBUSxDQUFDLENBQUMsQ0FBQztFQUNuRSxNQUFBVSxRQUFBLEdBQWlCWCxNQUFNLENBQXdCLElBQUksQ0FBQztFQUNwRCxNQUFB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