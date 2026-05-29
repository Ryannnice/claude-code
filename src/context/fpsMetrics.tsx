// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、useContext，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, useContext } from 'react';
// 类型依赖 { FpsMetrics } 来自 ../utils/fpsTracker.js，用于校准fps Metrics的数据契约。
import type { FpsMetrics } from '../utils/fpsTracker.js';
// FpsMetricsGetter 固化fps Metrics里传递的数据形状，帮助调用方按同一结构读写字段。
type FpsMetricsGetter = () => FpsMetrics | undefined;
// FpsMetricsContext 命名 `createContext<FpsMetricsGetter | undefined>(undefined)`，让后续代码直接表达这个值的用途。
const FpsMetricsContext = createContext<FpsMetricsGetter | undefined>(undefined);
// Props 固化fps Metrics里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  getFpsMetrics: FpsMetricsGetter;
  children: React.ReactNode;
};
// FpsMetricsProvider 封装fpsMetrics的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FpsMetricsProvider(t0) {
  // $保存`_c`，供fps Metrics后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    getFpsMetrics,
    children
  } = t0;
  // t1 暂存 `<FpsMetricsContext.Provider value={getFpsMetrics}>{childr...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children || $[1] !== getFpsMetrics) {
    // t1 暂存 `<FpsMetricsContext.Provider value={getFpsMetrics}>{childr...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <FpsMetricsContext.Provider value={getFpsMetrics}>{children}</FpsMetricsContext.Provider>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `getFpsMetrics`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = getFpsMetrics;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 返回 `t1`，作为fps Metrics这次计算的结果。
  return t1;
}
// useFpsMetrics 封装fpsMetrics的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useFpsMetrics() {
  // 返回 `useContext(FpsMetricsContext)`，作为fps Metrics这次计算的结果。
  return useContext(FpsMetricsContext);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJ1c2VDb250ZXh0IiwiRnBzTWV0cmljcyIsIkZwc01ldHJpY3NHZXR0ZXIiLCJGcHNNZXRyaWNzQ29udGV4dCIsInVuZGVmaW5lZCIsIlByb3BzIiwiZ2V0RnBzTWV0cmljcyIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwiRnBzTWV0cmljc1Byb3ZpZGVyIiwidDAiLCIkIiwiX2MiLCJ0MSIsInVzZUZwc01ldHJpY3MiXSwic291cmNlcyI6WyJmcHNNZXRyaWNzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBGcHNNZXRyaWNzIH0gZnJvbSAnLi4vdXRpbHMvZnBzVHJhY2tlci5qcydcblxudHlwZSBGcHNNZXRyaWNzR2V0dGVyID0gKCkgPT4gRnBzTWV0cmljcyB8IHVuZGVmaW5lZFxuXG5jb25zdCBGcHNNZXRyaWNzQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8RnBzTWV0cmljc0dldHRlciB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKVxuXG50eXBlIFByb3BzID0ge1xuICBnZXRGcHNNZXRyaWNzOiBGcHNNZXRyaWNzR2V0dGVyXG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEZwc01ldHJpY3NQcm92aWRlcih7XG4gIGdldEZwc01ldHJpY3MsXG4gIGNoaWxkcmVuLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxGcHNNZXRyaWNzQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17Z2V0RnBzTWV0cmljc30+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9GcHNNZXRyaWNzQ29udGV4dC5Qcm92aWRlcj5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlRnBzTWV0cmljcygpOiBGcHNNZXRyaWNzR2V0dGVyIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHVzZUNvbnRleHQoRnBzTWV0cmljc0NvbnRleHQpXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUlDLGFBQWEsRUFBRUMsVUFBVSxRQUFRLE9BQU87QUFDeEQsY0FBY0MsVUFBVSxRQUFRLHdCQUF3QjtBQUV4RCxLQUFLQyxnQkFBZ0IsR0FBRyxHQUFHLEdBQUdELFVBQVUsR0FBRyxTQUFTO0FBRXBELE1BQU1FLGlCQUFpQixHQUFHSixhQUFhLENBQUNHLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxDQUFDRSxTQUFTLENBQUM7QUFFaEYsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLGFBQWEsRUFBRUosZ0JBQWdCO0VBQy9CSyxRQUFRLEVBQUVULEtBQUssQ0FBQ1UsU0FBUztBQUMzQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxtQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE0QjtJQUFBTixhQUFBO0lBQUFDO0VBQUEsSUFBQUcsRUFHM0I7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBSixRQUFBLElBQUFJLENBQUEsUUFBQUwsYUFBQTtJQUVKTyxFQUFBLCtCQUFtQ1AsS0FBYSxDQUFiQSxjQUFZLENBQUMsQ0FDN0NDLFNBQU8sQ0FDViw2QkFBNkI7SUFBQUksQ0FBQSxNQUFBSixRQUFBO0lBQUFJLENBQUEsTUFBQUwsYUFBQTtJQUFBSyxDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUFBLE9BRjdCRSxFQUU2QjtBQUFBO0FBSWpDLE9BQU8sU0FBQUMsY0FBQTtFQUFBLE9BQ0VkLFVBQVUsQ0FBQ0csaUJBQWlCLENBQUM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==