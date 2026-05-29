// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useContext，将 react 中已经封装好的能力接到本文件流程里。
import { useContext } from 'react';

/**
 * Context to indicate that shell output should be shown in full (not truncated).
 * Used to auto-expand the most recent user `!` command output.
 *
 * This follows the same pattern as MessageResponseContext and SubAgentContext -
 * a boolean context that child components can check to modify their behavior.
 */
// ExpandShellOutputContext构建`React.createContext`，供终端渲染后续处理使用。
const ExpandShellOutputContext = React.createContext(false);
// ExpandShellOutputProvider 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ExpandShellOutputProvider(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // t1 暂存 `<ExpandShellOutputContext.Provider value={true}>{children...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children) {
    // t1 暂存 `<ExpandShellOutputContext.Provider value={true}>{children...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <ExpandShellOutputContext.Provider value={true}>{children}</ExpandShellOutputContext.Provider>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}

/**
 * Returns true if this component is rendered inside an ExpandShellOutputProvider,
 * indicating the shell output should be shown in full rather than truncated.
 */
// useExpandShellOutput 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useExpandShellOutput() {
  // 返回 `useContext(ExpandShellOutputContext)`，作为终端渲染这次计算的结果。
  return useContext(ExpandShellOutputContext);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNvbnRleHQiLCJFeHBhbmRTaGVsbE91dHB1dENvbnRleHQiLCJjcmVhdGVDb250ZXh0IiwiRXhwYW5kU2hlbGxPdXRwdXRQcm92aWRlciIsInQwIiwiJCIsIl9jIiwiY2hpbGRyZW4iLCJ0MSIsInVzZUV4cGFuZFNoZWxsT3V0cHV0Il0sInNvdXJjZXMiOlsiRXhwYW5kU2hlbGxPdXRwdXRDb250ZXh0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCdcblxuLyoqXG4gKiBDb250ZXh0IHRvIGluZGljYXRlIHRoYXQgc2hlbGwgb3V0cHV0IHNob3VsZCBiZSBzaG93biBpbiBmdWxsIChub3QgdHJ1bmNhdGVkKS5cbiAqIFVzZWQgdG8gYXV0by1leHBhbmQgdGhlIG1vc3QgcmVjZW50IHVzZXIgYCFgIGNvbW1hbmQgb3V0cHV0LlxuICpcbiAqIFRoaXMgZm9sbG93cyB0aGUgc2FtZSBwYXR0ZXJuIGFzIE1lc3NhZ2VSZXNwb25zZUNvbnRleHQgYW5kIFN1YkFnZW50Q29udGV4dCAtXG4gKiBhIGJvb2xlYW4gY29udGV4dCB0aGF0IGNoaWxkIGNvbXBvbmVudHMgY2FuIGNoZWNrIHRvIG1vZGlmeSB0aGVpciBiZWhhdmlvci5cbiAqL1xuY29uc3QgRXhwYW5kU2hlbGxPdXRwdXRDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dChmYWxzZSlcblxuZXhwb3J0IGZ1bmN0aW9uIEV4cGFuZFNoZWxsT3V0cHV0UHJvdmlkZXIoe1xuICBjaGlsZHJlbixcbn06IHtcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEV4cGFuZFNoZWxsT3V0cHV0Q29udGV4dC5Qcm92aWRlciB2YWx1ZT17dHJ1ZX0+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9FeHBhbmRTaGVsbE91dHB1dENvbnRleHQuUHJvdmlkZXI+XG4gIClcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhpcyBjb21wb25lbnQgaXMgcmVuZGVyZWQgaW5zaWRlIGFuIEV4cGFuZFNoZWxsT3V0cHV0UHJvdmlkZXIsXG4gKiBpbmRpY2F0aW5nIHRoZSBzaGVsbCBvdXRwdXQgc2hvdWxkIGJlIHNob3duIGluIGZ1bGwgcmF0aGVyIHRoYW4gdHJ1bmNhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlRXhwYW5kU2hlbGxPdXRwdXQoKTogYm9vbGVhbiB7XG4gIHJldHVybiB1c2VDb250ZXh0KEV4cGFuZFNoZWxsT3V0cHV0Q29udGV4dClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsVUFBVSxRQUFRLE9BQU87O0FBRWxDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsd0JBQXdCLEdBQUdGLEtBQUssQ0FBQ0csYUFBYSxDQUFDLEtBQUssQ0FBQztBQUUzRCxPQUFPLFNBQUFDLDBCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQW1DO0lBQUFDO0VBQUEsSUFBQUgsRUFJekM7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBRSxRQUFBO0lBRUdDLEVBQUEsc0NBQTBDLEtBQUksQ0FBSixLQUFHLENBQUMsQ0FDM0NELFNBQU8sQ0FDVixvQ0FBb0M7SUFBQUYsQ0FBQSxNQUFBRSxRQUFBO0lBQUFGLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQUEsT0FGcENHLEVBRW9DO0FBQUE7O0FBSXhDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxxQkFBQTtFQUFBLE9BQ0VULFVBQVUsQ0FBQ0Msd0JBQXdCLENBQUM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==