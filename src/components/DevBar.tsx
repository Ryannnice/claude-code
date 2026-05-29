// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 引入 getSlowOperations，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getSlowOperations } from '../bootstrap/state.js';
// 引入 Text、useInterval，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text, useInterval } from '../ink.js';

// Show DevBar for dev builds or all ants
// shouldShowDevBar 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldShowDevBar(): boolean {
  // 返回 `"production" === 'development' || "external" === 'ant'`，作为终端渲染这次计算的结果。
  return "production" === 'development' || "external" === 'ant';
}
// DevBar 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DevBar() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // slowOps 集合 由 React state 持有，setSlowOps 会在用户操作或异步结果返回时触发刷新。
  const [slowOps, setSlowOps] = useState(getSlowOperations);
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // setSlowOps 写入新的状态值，使终端渲染后续读取保持一致。
      setSlowOps(getSlowOperations());
    };
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 调用 useInterval，触发终端渲染此处需要的副作用。
  useInterval(t0, shouldShowDevBar() ? 500 : null);
  // !shouldShowDevBar() || slowOps 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (!shouldShowDevBar() || slowOps.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t1 暂存 `slowOps.slice(-3).map(_temp).join(" \xB7 ")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== slowOps) {
    // t1 暂存 `slowOps.slice(-3).map(_temp).join(" \xB7 ")` 生成的渲染片段，后续返回路径直接复用。
    t1 = slowOps.slice(-3).map(_temp).join(" \xB7 ");
    // $[1] 缓存 `slowOps`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = slowOps;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // recentOps 集合保存`t1`，作为后续临时缓存值处理的输入。
  const recentOps = t1;
  // t2 暂存 `<Text wrap="truncate-end" color="warning">[ANT-ONLY] slow...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== recentOps) {
    // t2 暂存 `<Text wrap="truncate-end" color="warning">[ANT-ONLY] slow...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text wrap="truncate-end" color="warning">[ANT-ONLY] slow sync: {recentOps}</Text>;
    // $[3] 缓存 `recentOps`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = recentOps;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(op) {
  // 返回 ``${op.operation} (${Math.round(op.durationMs)}ms)``，作为终端渲染这次计算的结果。
  return `${op.operation} (${Math.round(op.durationMs)}ms)`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiZ2V0U2xvd09wZXJhdGlvbnMiLCJUZXh0IiwidXNlSW50ZXJ2YWwiLCJzaG91bGRTaG93RGV2QmFyIiwiRGV2QmFyIiwiJCIsIl9jIiwic2xvd09wcyIsInNldFNsb3dPcHMiLCJ0MCIsIlN5bWJvbCIsImZvciIsImxlbmd0aCIsInQxIiwic2xpY2UiLCJtYXAiLCJfdGVtcCIsImpvaW4iLCJyZWNlbnRPcHMiLCJ0MiIsIm9wIiwib3BlcmF0aW9uIiwiTWF0aCIsInJvdW5kIiwiZHVyYXRpb25NcyJdLCJzb3VyY2VzIjpbIkRldkJhci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgZ2V0U2xvd09wZXJhdGlvbnMgfSBmcm9tICcuLi9ib290c3RyYXAvc3RhdGUuanMnXG5pbXBvcnQgeyBUZXh0LCB1c2VJbnRlcnZhbCB9IGZyb20gJy4uL2luay5qcydcblxuLy8gU2hvdyBEZXZCYXIgZm9yIGRldiBidWlsZHMgb3IgYWxsIGFudHNcbmZ1bmN0aW9uIHNob3VsZFNob3dEZXZCYXIoKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgXCJwcm9kdWN0aW9uXCIgPT09ICdkZXZlbG9wbWVudCcgfHwgXCJleHRlcm5hbFwiID09PSAnYW50J1xuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBEZXZCYXIoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3Nsb3dPcHMsIHNldFNsb3dPcHNdID1cbiAgICB1c2VTdGF0ZTxcbiAgICAgIFJlYWRvbmx5QXJyYXk8e1xuICAgICAgICBvcGVyYXRpb246IHN0cmluZ1xuICAgICAgICBkdXJhdGlvbk1zOiBudW1iZXJcbiAgICAgICAgdGltZXN0YW1wOiBudW1iZXJcbiAgICAgIH0+XG4gICAgPihnZXRTbG93T3BlcmF0aW9ucylcblxuICB1c2VJbnRlcnZhbChcbiAgICAoKSA9PiB7XG4gICAgICBzZXRTbG93T3BzKGdldFNsb3dPcGVyYXRpb25zKCkpXG4gICAgfSxcbiAgICBzaG91bGRTaG93RGV2QmFyKCkgPyA1MDAgOiBudWxsLFxuICApXG5cbiAgLy8gT25seSBzaG93IHdoZW4gdGhlcmUncyBzb21ldGhpbmcgdG8gZGlzcGxheVxuICBpZiAoIXNob3VsZFNob3dEZXZCYXIoKSB8fCBzbG93T3BzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBTaW5nbGUtbGluZSBmb3JtYXQgc28gc2hvcnQgdGVybWluYWxzIGRvbid0IGxvc2Ugcm93cyB0byBkZXYgbm9pc2UuXG4gIGNvbnN0IHJlY2VudE9wcyA9IHNsb3dPcHNcbiAgICAuc2xpY2UoLTMpXG4gICAgLm1hcChvcCA9PiBgJHtvcC5vcGVyYXRpb259ICgke01hdGgucm91bmQob3AuZHVyYXRpb25Ncyl9bXMpYClcbiAgICAuam9pbignIMK3ICcpXG5cbiAgcmV0dXJuIChcbiAgICA8VGV4dCB3cmFwPVwidHJ1bmNhdGUtZW5kXCIgY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICBbQU5ULU9OTFldIHNsb3cgc3luYzoge3JlY2VudE9wc31cbiAgICA8L1RleHQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxRQUFRLE9BQU87QUFDaEMsU0FBU0MsaUJBQWlCLFFBQVEsdUJBQXVCO0FBQ3pELFNBQVNDLElBQUksRUFBRUMsV0FBVyxRQUFRLFdBQVc7O0FBRTdDO0FBQ0EsU0FBU0MsZ0JBQWdCQSxDQUFBLENBQUUsRUFBRSxPQUFPLENBQUM7RUFDbkMsT0FDRSxZQUFZLEtBQUssYUFBYSxJQUFJLFVBQVUsS0FBSyxLQUFLO0FBRTFEO0FBRUEsT0FBTyxTQUFBQyxPQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0wsT0FBQUMsT0FBQSxFQUFBQyxVQUFBLElBQ0VULFFBQVEsQ0FNTkMsaUJBQWlCLENBQUM7RUFBQSxJQUFBUyxFQUFBO0VBQUEsSUFBQUosQ0FBQSxRQUFBSyxNQUFBLENBQUFDLEdBQUE7SUFHcEJGLEVBQUEsR0FBQUEsQ0FBQTtNQUNFRCxVQUFVLENBQUNSLGlCQUFpQixDQUFDLENBQUMsQ0FBQztJQUFBLENBQ2hDO0lBQUFLLENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBSEhILFdBQVcsQ0FDVE8sRUFFQyxFQUNETixnQkFBZ0IsQ0FBYyxDQUFDLEdBQS9CLEdBQStCLEdBQS9CLElBQ0YsQ0FBQztFQUdELElBQUksQ0FBQ0EsZ0JBQWdCLENBQUMsQ0FBeUIsSUFBcEJJLE9BQU8sQ0FBQUssTUFBTyxLQUFLLENBQUM7SUFBQSxPQUN0QyxJQUFJO0VBQUE7RUFDWixJQUFBQyxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxRQUFBRSxPQUFBO0lBR2lCTSxFQUFBLEdBQUFOLE9BQU8sQ0FBQU8sS0FDakIsQ0FBQyxFQUFFLENBQUMsQ0FBQUMsR0FDTixDQUFDQyxLQUF3RCxDQUFDLENBQUFDLElBQ3pELENBQUMsUUFBSyxDQUFDO0lBQUFaLENBQUEsTUFBQUUsT0FBQTtJQUFBRixDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUhkLE1BQUFhLFNBQUEsR0FBa0JMLEVBR0o7RUFBQSxJQUFBTSxFQUFBO0VBQUEsSUFBQWQsQ0FBQSxRQUFBYSxTQUFBO0lBR1pDLEVBQUEsSUFBQyxJQUFJLENBQU0sSUFBYyxDQUFkLGNBQWMsQ0FBTyxLQUFTLENBQVQsU0FBUyxDQUFDLHNCQUNqQkQsVUFBUSxDQUNqQyxFQUZDLElBQUksQ0FFRTtJQUFBYixDQUFBLE1BQUFhLFNBQUE7SUFBQWIsQ0FBQSxNQUFBYyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBZCxDQUFBO0VBQUE7RUFBQSxPQUZQYyxFQUVPO0FBQUE7QUEvQkosU0FBQUgsTUFBQUksRUFBQTtFQUFBLE9BeUJRLEdBQUdBLEVBQUUsQ0FBQUMsU0FBVSxLQUFLQyxJQUFJLENBQUFDLEtBQU0sQ0FBQ0gsRUFBRSxDQUFBSSxVQUFXLENBQUMsS0FBSztBQUFBIiwiaWdub3JlTGlzdCI6W119