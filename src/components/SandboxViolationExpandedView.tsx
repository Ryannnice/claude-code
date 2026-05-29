// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 ReactNode、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { type ReactNode, useEffect, useState } from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 类型依赖 { SandboxViolationEvent } 来自 ../utils/sandbox/sandbox-adapter.js，用于校准终端渲染的数据契约。
import type { SandboxViolationEvent } from '../utils/sandbox/sandbox-adapter.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../utils/sandbox/sandbox-adapter.js';

/**
 * Format a timestamp as "h:mm:ssa" (e.g., "1:30:45pm").
 * Replaces date-fns format() to avoid pulling in a 39MB dependency for one call.
 */
// formatTime 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatTime(date: Date): string {
  // h读取`date.getHours`，供终端渲染后续处理使用。
  const h = date.getHours() % 12 || 12;
  // m保存`String`，供终端渲染后续处理使用。
  const m = String(date.getMinutes()).padStart(2, '0');
  // s 集合保存`String`，供终端渲染后续处理使用。
  const s = String(date.getSeconds()).padStart(2, '0');
  // ampm读取`date.getHours`，供终端渲染后续处理使用。
  const ampm = date.getHours() < 12 ? 'am' : 'pm';
  // 返回 ``${h}:${m}:${s}${ampm}``，作为终端渲染这次计算的结果。
  return `${h}:${m}:${s}${ampm}`;
}
// 复用 getPlatform 工具函数，把通用处理留在 src/utils/platform.js 中维护。
import { getPlatform } from 'src/utils/platform.js';
// SandboxViolationExpandedView 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SandboxViolationExpandedView() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // t0 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t0 = [];
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // violations 集合 由 React state 持有，setViolations 会在用户操作或异步结果返回时触发刷新。
  const [violations, setViolations] = useState(t0);
  // totalCount 数量 由 React state 持有，setTotalCount 会在用户操作或异步结果返回时触发刷新。
  const [totalCount, setTotalCount] = useState(0);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // store读取`SandboxManager.getSandboxViolationStore`，供终端渲染后续处理使用。
      const store = SandboxManager.getSandboxViolationStore();
      // unsubscribe保存`store.subscribe`，供终端渲染后续处理使用。
      const unsubscribe = store.subscribe(allViolations => {
        // setViolations 写入新的状态值，使终端渲染后续读取保持一致。
        setViolations(allViolations.slice(-10));
        // setTotalCount 写入新的状态值，使终端渲染后续读取保持一致。
        setTotalCount(store.getTotalCount());
      });
      // 返回 `unsubscribe`，作为终端渲染这次计算的结果。
      return unsubscribe;
    };
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t1, t2);
  // 当 `!SandboxManager.isSandboxingEnabled() || ge...` 匹配 `"linux"` 时，终端渲染执行对应分支。
  if (!SandboxManager.isSandboxingEnabled() || getPlatform() === "linux") {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 满足 `totalCount === 0` 时，终端渲染执行该分支。
  if (totalCount === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t3标记终端 UI Sandbox Violation Ex...是否启用对应路径。
  const t3 = totalCount === 1 ? "operation" : "operations";
  // t4 暂存 `<Box marginLeft={0}><Text color="permission">⧈ Sandbox bl...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t3 || $[4] !== totalCount) {
    // t4 暂存 `<Box marginLeft={0}><Text color="permission">⧈ Sandbox bl...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginLeft={0}><Text color="permission">⧈ Sandbox blocked {totalCount} total{" "}{t3}</Text></Box>;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
    // $[4] 缓存 `totalCount`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = totalCount;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `violations.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== violations) {
    // t5 暂存 `violations.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t5 = violations.map(_temp);
    // $[6] 缓存 `violations`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = violations;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // 临时值 t6保存`Math.min`，供终端渲染后续处理使用。
  const t6 = Math.min(10, violations.length);
  // t7 暂存 `<Box paddingLeft={2}><Text dimColor={true}>… showing last...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t6 || $[9] !== totalCount) {
    // t7 暂存 `<Box paddingLeft={2}><Text dimColor={true}>… showing last...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box paddingLeft={2}><Text dimColor={true}>… showing last {t6} of {totalCount}</Text></Box>;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
    // $[9] 缓存 `totalCount`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = totalCount;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // t8 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}{t7}</B...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t4 || $[12] !== t5 || $[13] !== t7) {
    // t8 暂存 `<Box flexDirection="column" marginTop={1}>{t4}{t5}{t7}</B...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" marginTop={1}>{t4}{t5}{t7}</Box>;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(v, i) {
  // 返回 `<Box key={`${v.timestamp.getTime()}-${i}`} paddingLeft={2}><Text dimCol...`，作为终端渲染这次计算的结果。
  return <Box key={`${v.timestamp.getTime()}-${i}`} paddingLeft={2}><Text dimColor={true}>{formatTime(v.timestamp)}{v.command ? ` ${v.command}:` : ""} {v.line}</Text></Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsIlNhbmRib3hWaW9sYXRpb25FdmVudCIsIlNhbmRib3hNYW5hZ2VyIiwiZm9ybWF0VGltZSIsImRhdGUiLCJEYXRlIiwiaCIsImdldEhvdXJzIiwibSIsIlN0cmluZyIsImdldE1pbnV0ZXMiLCJwYWRTdGFydCIsInMiLCJnZXRTZWNvbmRzIiwiYW1wbSIsImdldFBsYXRmb3JtIiwiU2FuZGJveFZpb2xhdGlvbkV4cGFuZGVkVmlldyIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIiwidmlvbGF0aW9ucyIsInNldFZpb2xhdGlvbnMiLCJ0b3RhbENvdW50Iiwic2V0VG90YWxDb3VudCIsInQxIiwidDIiLCJzdG9yZSIsImdldFNhbmRib3hWaW9sYXRpb25TdG9yZSIsInVuc3Vic2NyaWJlIiwic3Vic2NyaWJlIiwiYWxsVmlvbGF0aW9ucyIsInNsaWNlIiwiZ2V0VG90YWxDb3VudCIsImlzU2FuZGJveGluZ0VuYWJsZWQiLCJ0MyIsInQ0IiwidDUiLCJtYXAiLCJfdGVtcCIsInQ2IiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInQ3IiwidDgiLCJ2IiwiaSIsInRpbWVzdGFtcCIsImdldFRpbWUiLCJjb21tYW5kIiwibGluZSJdLCJzb3VyY2VzIjpbIlNhbmRib3hWaW9sYXRpb25FeHBhbmRlZFZpZXcudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdHlwZSBSZWFjdE5vZGUsIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgU2FuZGJveFZpb2xhdGlvbkV2ZW50IH0gZnJvbSAnLi4vdXRpbHMvc2FuZGJveC9zYW5kYm94LWFkYXB0ZXIuanMnXG5pbXBvcnQgeyBTYW5kYm94TWFuYWdlciB9IGZyb20gJy4uL3V0aWxzL3NhbmRib3gvc2FuZGJveC1hZGFwdGVyLmpzJ1xuXG4vKipcbiAqIEZvcm1hdCBhIHRpbWVzdGFtcCBhcyBcImg6bW06c3NhXCIgKGUuZy4sIFwiMTozMDo0NXBtXCIpLlxuICogUmVwbGFjZXMgZGF0ZS1mbnMgZm9ybWF0KCkgdG8gYXZvaWQgcHVsbGluZyBpbiBhIDM5TUIgZGVwZW5kZW5jeSBmb3Igb25lIGNhbGwuXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFRpbWUoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gIGNvbnN0IGggPSBkYXRlLmdldEhvdXJzKCkgJSAxMiB8fCAxMlxuICBjb25zdCBtID0gU3RyaW5nKGRhdGUuZ2V0TWludXRlcygpKS5wYWRTdGFydCgyLCAnMCcpXG4gIGNvbnN0IHMgPSBTdHJpbmcoZGF0ZS5nZXRTZWNvbmRzKCkpLnBhZFN0YXJ0KDIsICcwJylcbiAgY29uc3QgYW1wbSA9IGRhdGUuZ2V0SG91cnMoKSA8IDEyID8gJ2FtJyA6ICdwbSdcbiAgcmV0dXJuIGAke2h9OiR7bX06JHtzfSR7YW1wbX1gXG59XG5cbmltcG9ydCB7IGdldFBsYXRmb3JtIH0gZnJvbSAnc3JjL3V0aWxzL3BsYXRmb3JtLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gU2FuZGJveFZpb2xhdGlvbkV4cGFuZGVkVmlldygpOiBSZWFjdE5vZGUge1xuICBjb25zdCBbdmlvbGF0aW9ucywgc2V0VmlvbGF0aW9uc10gPSB1c2VTdGF0ZTxTYW5kYm94VmlvbGF0aW9uRXZlbnRbXT4oW10pXG4gIGNvbnN0IFt0b3RhbENvdW50LCBzZXRUb3RhbENvdW50XSA9IHVzZVN0YXRlKDApXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyBUaGlzIGlzIGhhcm1sZXNzIGlmIHNhbmRib3hpbmcgaXMgbm90IGVuYWJsZWRcbiAgICBjb25zdCBzdG9yZSA9IFNhbmRib3hNYW5hZ2VyLmdldFNhbmRib3hWaW9sYXRpb25TdG9yZSgpXG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBzdG9yZS5zdWJzY3JpYmUoXG4gICAgICAoYWxsVmlvbGF0aW9uczogU2FuZGJveFZpb2xhdGlvbkV2ZW50W10pID0+IHtcbiAgICAgICAgc2V0VmlvbGF0aW9ucyhhbGxWaW9sYXRpb25zLnNsaWNlKC0xMCkpXG4gICAgICAgIHNldFRvdGFsQ291bnQoc3RvcmUuZ2V0VG90YWxDb3VudCgpKVxuICAgICAgfSxcbiAgICApXG4gICAgcmV0dXJuIHVuc3Vic2NyaWJlXG4gIH0sIFtdKVxuXG4gIGlmICghU2FuZGJveE1hbmFnZXIuaXNTYW5kYm94aW5nRW5hYmxlZCgpIHx8IGdldFBsYXRmb3JtKCkgPT09ICdsaW51eCcpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKHRvdGFsQ291bnQgPT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgPEJveCBtYXJnaW5MZWZ0PXswfT5cbiAgICAgICAgPFRleHQgY29sb3I9XCJwZXJtaXNzaW9uXCI+XG4gICAgICAgICAg4qeIIFNhbmRib3ggYmxvY2tlZCB7dG90YWxDb3VudH0gdG90YWx7JyAnfVxuICAgICAgICAgIHt0b3RhbENvdW50ID09PSAxID8gJ29wZXJhdGlvbicgOiAnb3BlcmF0aW9ucyd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgICAge3Zpb2xhdGlvbnMubWFwKCh2LCBpKSA9PiAoXG4gICAgICAgIDxCb3gga2V5PXtgJHt2LnRpbWVzdGFtcC5nZXRUaW1lKCl9LSR7aX1gfSBwYWRkaW5nTGVmdD17Mn0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7Zm9ybWF0VGltZSh2LnRpbWVzdGFtcCl9XG4gICAgICAgICAgICB7di5jb21tYW5kID8gYCAke3YuY29tbWFuZH06YCA6ICcnfSB7di5saW5lfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApKX1cbiAgICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICDigKYgc2hvd2luZyBsYXN0IHtNYXRoLm1pbigxMCwgdmlvbGF0aW9ucy5sZW5ndGgpfSBvZiB7dG90YWxDb3VudH1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBUyxLQUFLQyxTQUFTLEVBQUVDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDM0QsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsV0FBVztBQUNyQyxjQUFjQyxxQkFBcUIsUUFBUSxxQ0FBcUM7QUFDaEYsU0FBU0MsY0FBYyxRQUFRLHFDQUFxQzs7QUFFcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTQyxVQUFVQSxDQUFDQyxJQUFJLEVBQUVDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQztFQUN0QyxNQUFNQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0csUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtFQUNwQyxNQUFNQyxDQUFDLEdBQUdDLE1BQU0sQ0FBQ0wsSUFBSSxDQUFDTSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0VBQ3BELE1BQU1DLENBQUMsR0FBR0gsTUFBTSxDQUFDTCxJQUFJLENBQUNTLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQ0YsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUM7RUFDcEQsTUFBTUcsSUFBSSxHQUFHVixJQUFJLENBQUNHLFFBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJO0VBQy9DLE9BQU8sR0FBR0QsQ0FBQyxJQUFJRSxDQUFDLElBQUlJLENBQUMsR0FBR0UsSUFBSSxFQUFFO0FBQ2hDO0FBRUEs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