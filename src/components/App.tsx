// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 FpsMetricsProvider，将 ../context/fpsMetrics.js 中已经封装好的能力接到本文件流程里。
import { FpsMetricsProvider } from '../context/fpsMetrics.js';
// 引入 StatsProvider、StatsStore，将 ../context/stats.js 中已经封装好的能力接到本文件流程里。
import { StatsProvider, type StatsStore } from '../context/stats.js';
// 引入 AppState、AppStateProvider，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { type AppState, AppStateProvider } from '../state/AppState.js';
// 引入 onChangeAppState，将 ../state/onChangeAppState.js 中已经封装好的能力接到本文件流程里。
import { onChangeAppState } from '../state/onChangeAppState.js';
// 类型依赖 { FpsMetrics } 来自 ../utils/fpsTracker.js，用于校准终端渲染的数据契约。
import type { FpsMetrics } from '../utils/fpsTracker.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 getFpsMetrics: () => FpsMetrics | undefined;，负责终端渲染在该局部场景下的响应。
  getFpsMetrics: () => FpsMetrics | undefined;
  stats?: StatsStore;
  initialState: AppState;
  children: React.ReactNode;
};

/**
 * Top-level wrapper for interactive sessions.
 * Provides FPS metrics, stats context, and app state to the component tree.
 */
// App 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function App(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    getFpsMetrics,
    stats,
    initialState,
    children
  } = t0;
  // t1 暂存 `<AppStateProvider initialState={initialState} onChangeApp...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children || $[1] !== initialState) {
    // t1 暂存 `<AppStateProvider initialState={initialState} onChangeApp...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <AppStateProvider initialState={initialState} onChangeAppState={onChangeAppState}>{children}</AppStateProvider>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `initialState`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = initialState;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<StatsProvider store={stats}>{t1}</StatsProvider>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== stats || $[4] !== t1) {
    // t2 暂存 `<StatsProvider store={stats}>{t1}</StatsProvider>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <StatsProvider store={stats}>{t1}</StatsProvider>;
    // $[3] 缓存 `stats`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = stats;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `<FpsMetricsProvider getFpsMetrics={getFpsMetrics}>{t2}</F...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== getFpsMetrics || $[7] !== t2) {
    // t3 暂存 `<FpsMetricsProvider getFpsMetrics={getFpsMetrics}>{t2}</F...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <FpsMetricsProvider getFpsMetrics={getFpsMetrics}>{t2}</FpsMetricsProvider>;
    // $[6] 缓存 `getFpsMetrics`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = getFpsMetrics;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkZwc01ldHJpY3NQcm92aWRlciIsIlN0YXRzUHJvdmlkZXIiLCJTdGF0c1N0b3JlIiwiQXBwU3RhdGUiLCJBcHBTdGF0ZVByb3ZpZGVyIiwib25DaGFuZ2VBcHBTdGF0ZSIsIkZwc01ldHJpY3MiLCJQcm9wcyIsImdldEZwc01ldHJpY3MiLCJzdGF0cyIsImluaXRpYWxTdGF0ZSIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwiQXBwIiwidDAiLCIkIiwiX2MiLCJ0MSIsInQyIiwidDMiXSwic291cmNlcyI6WyJBcHAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEZwc01ldHJpY3NQcm92aWRlciB9IGZyb20gJy4uL2NvbnRleHQvZnBzTWV0cmljcy5qcydcbmltcG9ydCB7IFN0YXRzUHJvdmlkZXIsIHR5cGUgU3RhdHNTdG9yZSB9IGZyb20gJy4uL2NvbnRleHQvc3RhdHMuanMnXG5pbXBvcnQgeyB0eXBlIEFwcFN0YXRlLCBBcHBTdGF0ZVByb3ZpZGVyIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBvbkNoYW5nZUFwcFN0YXRlIH0gZnJvbSAnLi4vc3RhdGUvb25DaGFuZ2VBcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgRnBzTWV0cmljcyB9IGZyb20gJy4uL3V0aWxzL2Zwc1RyYWNrZXIuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGdldEZwc01ldHJpY3M6ICgpID0+IEZwc01ldHJpY3MgfCB1bmRlZmluZWRcbiAgc3RhdHM/OiBTdGF0c1N0b3JlXG4gIGluaXRpYWxTdGF0ZTogQXBwU3RhdGVcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufVxuXG4vKipcbiAqIFRvcC1sZXZlbCB3cmFwcGVyIGZvciBpbnRlcmFjdGl2ZSBzZXNzaW9ucy5cbiAqIFByb3ZpZGVzIEZQUyBtZXRyaWNzLCBzdGF0cyBjb250ZXh0LCBhbmQgYXBwIHN0YXRlIHRvIHRoZSBjb21wb25lbnQgdHJlZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEFwcCh7XG4gIGdldEZwc01ldHJpY3MsXG4gIHN0YXRzLFxuICBpbml0aWFsU3RhdGUsXG4gIGNoaWxkcmVuLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxGcHNNZXRyaWNzUHJvdmlkZXIgZ2V0RnBzTWV0cmljcz17Z2V0RnBzTWV0cmljc30+XG4gICAgICA8U3RhdHNQcm92aWRlciBzdG9yZT17c3RhdHN9PlxuICAgICAgICA8QXBwU3RhdGVQcm92aWRlclxuICAgICAgICAgIGluaXRpYWxTdGF0ZT17aW5pdGlhbFN0YXRlfVxuICAgICAgICAgIG9uQ2hhbmdlQXBwU3RhdGU9e29uQ2hhbmdlQXBwU3RhdGV9XG4gICAgICAgID5cbiAgICAgICAgICB7Y2hpbGRyZW59XG4gICAgICAgIDwvQXBwU3RhdGVQcm92aWRlcj5cbiAgICAgIDwvU3RhdHNQcm92aWRlcj5cbiAgICA8L0Zwc01ldHJpY3NQcm92aWRlcj5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0Msa0JBQWtCLFFBQVEsMEJBQTBCO0FBQzdELFNBQVNDLGFBQWEsRUFBRSxLQUFLQyxVQUFVLFFBQVEscUJBQXFCO0FBQ3BFLFNBQVMsS0FBS0MsUUFBUSxFQUFFQyxnQkFBZ0IsUUFBUSxzQkFBc0I7QUFDdEUsU0FBU0MsZ0JBQWdCLFFBQVEsOEJBQThCO0FBQy9ELGNBQWNDLFVBQVUsUUFBUSx3QkFBd0I7QUFFeEQsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLGFBQWEsRUFBRSxHQUFHLEdBQUdGLFVBQVUsR0FBRyxTQUFTO0VBQzNDRyxLQUFLLENBQUMsRUFBRVAsVUFBVTtFQUNsQlEsWUFBWSxFQUFFUCxRQUFRO0VBQ3RCUSxRQUFRLEVBQUVaLEtBQUssQ0FBQ2EsU0FBUztBQUMzQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxJQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWE7SUFBQVIsYUFBQTtJQUFBQyxLQUFBO0lBQUFDLFlBQUE7SUFBQUM7RUFBQSxJQUFBRyxFQUtaO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUosUUFBQSxJQUFBSSxDQUFBLFFBQUFMLFlBQUE7SUFJQU8sRUFBQSxJQUFDLGdCQUFnQixDQUNEUCxZQUFZLENBQVpBLGFBQVcsQ0FBQyxDQUNSTCxnQkFBZ0IsQ0FBaEJBLGlCQUFlLENBQUMsQ0FFakNNLFNBQU8sQ0FDVixFQUxDLGdCQUFnQixDQUtFO0lBQUFJLENBQUEsTUFBQUosUUFBQTtJQUFBSSxDQUFBLE1BQUFMLFlBQUE7SUFBQUssQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBTixLQUFBLElBQUFNLENBQUEsUUFBQUUsRUFBQTtJQU5yQkMsRUFBQSxJQUFDLGFBQWEsQ0FBUVQsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDekIsQ0FBQVEsRUFLa0IsQ0FDcEIsRUFQQyxhQUFhLENBT0U7SUFBQUYsQ0FBQSxNQUFBTixLQUFBO0lBQUFNLENBQUEsTUFBQUUsRUFBQTtJQUFBRixDQUFBLE1BQUFHLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFILENBQUE7RUFBQTtFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFQLGFBQUEsSUFBQU8sQ0FBQSxRQUFBRyxFQUFBO0lBUmxCQyxFQUFBLElBQUMsa0JBQWtCLENBQWdCWCxhQUFhLENBQWJBLGNBQVksQ0FBQyxDQUM5QyxDQUFBVSxFQU9lLENBQ2pCLEVBVEMsa0JBQWtCLENBU0U7SUFBQUgsQ0FBQSxNQUFBUCxhQUFBO0lBQUFPLENBQUEsTUFBQUcsRUFBQTtJQUFBSCxDQUFBLE1BQUFJLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQUFBLE9BVHJCSSxFQVNxQjtBQUFBIiwiaWdub3JlTGlzdCI6W119