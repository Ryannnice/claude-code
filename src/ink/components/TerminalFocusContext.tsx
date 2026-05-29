// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、useMemo、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, useMemo, useSyncExternalStore } from 'react';
// 引入 getTerminalFocused、getTerminalFocusState、subscribeTerminalFocus、TerminalFocusState，将 ../terminal-focus-state.js 中已经封装好的能力接到本文件流程里。
import { getTerminalFocused, getTerminalFocusState, subscribeTerminalFocus, type TerminalFocusState } from '../terminal-focus-state.js';
// 导出类型定义，让其他模块沿用终端 UI 组件 Terminal Focus Context的数据契约。
export type { TerminalFocusState };
// TerminalFocusContextProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type TerminalFocusContextProps = {
  readonly isTerminalFocused: boolean;
  readonly terminalFocusState: TerminalFocusState;
};
// TerminalFocusContext 命名 `createContext<TerminalFocusContextProps>({`，让后续代码直接表达这个值的用途。
const TerminalFocusContext = createContext<TerminalFocusContextProps>({
  isTerminalFocused: true,
  terminalFocusState: 'unknown'
});

// eslint-disable-next-line custom-rules/no-top-level-side-effects
// displayName更新为 `'TerminalFocusContext'`，确保终端 UI后续读取最新状态。
TerminalFocusContext.displayName = 'TerminalFocusContext';

// Separate component so App.tsx doesn't re-render on focus changes.
// Children are a stable prop reference, so they don't re-render either —
// only components that consume the context will re-render.
// TerminalFocusProvider 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TerminalFocusProvider(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // isTerminalFocused记录 `useSyncExternalStore` 是否成立，终端渲染随后按该结果分支。
  const isTerminalFocused = useSyncExternalStore(subscribeTerminalFocus, getTerminalFocused);
  // terminalFocusState 状态保存`useSyncExternalStore`，供终端渲染后续处理使用。
  const terminalFocusState = useSyncExternalStore(subscribeTerminalFocus, getTerminalFocusState);
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== isTerminalFocused || $[1] !== terminalFocusState) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      isTerminalFocused,
      terminalFocusState
    };
    // $[0] 缓存 `isTerminalFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = isTerminalFocused;
    // $[1] 缓存 `terminalFocusState`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = terminalFocusState;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 取值沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const value = t1;
  // t2 暂存 `<TerminalFocusContext.Provider value={value}>{children}</...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== children || $[4] !== value) {
    // t2 暂存 `<TerminalFocusContext.Provider value={value}>{children}</...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <TerminalFocusContext.Provider value={value}>{children}</TerminalFocusContext.Provider>;
    // $[3] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = children;
    // $[4] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = value;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
export default TerminalFocusContext;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJ1c2VNZW1vIiwidXNlU3luY0V4dGVybmFsU3RvcmUiLCJnZXRUZXJtaW5hbEZvY3VzZWQiLCJnZXRUZXJtaW5hbEZvY3VzU3RhdGUiLCJzdWJzY3JpYmVUZXJtaW5hbEZvY3VzIiwiVGVybWluYWxGb2N1c1N0YXRlIiwiVGVybWluYWxGb2N1c0NvbnRleHRQcm9wcyIsImlzVGVybWluYWxGb2N1c2VkIiwidGVybWluYWxGb2N1c1N0YXRlIiwiVGVybWluYWxGb2N1c0NvbnRleHQiLCJkaXNwbGF5TmFtZSIsIlRlcm1pbmFsRm9jdXNQcm92aWRlciIsInQwIiwiJCIsIl9jIiwiY2hpbGRyZW4iLCJ0MSIsInZhbHVlIiwidDIiXSwic291cmNlcyI6WyJUZXJtaW5hbEZvY3VzQ29udGV4dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IGNyZWF0ZUNvbnRleHQsIHVzZU1lbW8sIHVzZVN5bmNFeHRlcm5hbFN0b3JlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQge1xuICBnZXRUZXJtaW5hbEZvY3VzZWQsXG4gIGdldFRlcm1pbmFsRm9jdXNTdGF0ZSxcbiAgc3Vic2NyaWJlVGVybWluYWxGb2N1cyxcbiAgdHlwZSBUZXJtaW5hbEZvY3VzU3RhdGUsXG59IGZyb20gJy4uL3Rlcm1pbmFsLWZvY3VzLXN0YXRlLmpzJ1xuXG5leHBvcnQgdHlwZSB7IFRlcm1pbmFsRm9jdXNTdGF0ZSB9XG5cbmV4cG9ydCB0eXBlIFRlcm1pbmFsRm9jdXNDb250ZXh0UHJvcHMgPSB7XG4gIHJlYWRvbmx5IGlzVGVybWluYWxGb2N1c2VkOiBib29sZWFuXG4gIHJlYWRvbmx5IHRlcm1pbmFsRm9jdXNTdGF0ZTogVGVybWluYWxGb2N1c1N0YXRlXG59XG5cbmNvbnN0IFRlcm1pbmFsRm9jdXNDb250ZXh0ID0gY3JlYXRlQ29udGV4dDxUZXJtaW5hbEZvY3VzQ29udGV4dFByb3BzPih7XG4gIGlzVGVybWluYWxGb2N1c2VkOiB0cnVlLFxuICB0ZXJtaW5hbEZvY3VzU3RhdGU6ICd1bmtub3duJyxcbn0pXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjdXN0b20tcnVsZXMvbm8tdG9wLWxldmVsLXNpZGUtZWZmZWN0c1xuVGVybWluYWxGb2N1c0NvbnRleHQuZGlzcGxheU5hbWUgPSAnVGVybWluYWxGb2N1c0NvbnRleHQnXG5cbi8vIFNlcGFyYXRlIGNvbXBvbmVudCBzbyBBcHAudHN4IGRvZXNuJ3QgcmUtcmVuZGVyIG9uIGZvY3VzIGNoYW5nZXMuXG4vLyBDaGlsZHJlbiBhcmUgYSBzdGFibGUgcHJvcCByZWZlcmVuY2UsIHNvIHRoZXkgZG9uJ3QgcmUtcmVuZGVyIGVpdGhlciDigJRcbi8vIG9ubHkgY29tcG9uZW50cyB0aGF0IGNvbnN1bWUgdGhlIGNvbnRleHQgd2lsbCByZS1yZW5kZXIuXG5leHBvcnQgZnVuY3Rpb24gVGVybWluYWxGb2N1c1Byb3ZpZGVyKHtcbiAgY2hpbGRyZW4sXG59OiB7XG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBpc1Rlcm1pbmFsRm9jdXNlZCA9IHVzZVN5bmNFeHRlcm5hbFN0b3JlKFxuICAgIHN1YnNjcmliZVRlcm1pbmFsRm9jdXMsXG4gICAgZ2V0VGVybWluYWxGb2N1c2VkLFxuICApXG4gIGNvbnN0IHRlcm1pbmFsRm9jdXNTdGF0ZSA9IHVzZVN5bmNFeHRlcm5hbFN0b3JlKFxuICAgIHN1YnNjcmliZVRlcm1pbmFsRm9jdXMsXG4gICAgZ2V0VGVybWluYWxGb2N1c1N0YXRlLFxuICApXG5cbiAgY29uc3QgdmFsdWUgPSB1c2VNZW1vKFxuICAgICgpID0+ICh7IGlzVGVybWluYWxGb2N1c2VkLCB0ZXJtaW5hbEZvY3VzU3RhdGUgfSksXG4gICAgW2lzVGVybWluYWxGb2N1c2VkLCB0ZXJtaW5hbEZvY3VzU3RhdGVdLFxuICApXG5cbiAgcmV0dXJuIChcbiAgICA8VGVybWluYWxGb2N1c0NvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3ZhbHVlfT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L1Rlcm1pbmFsRm9jdXNDb250ZXh0LlByb3ZpZGVyPlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IFRlcm1pbmFsRm9jdXNDb250ZXh0XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUlDLGFBQWEsRUFBRUMsT0FBTyxFQUFFQyxvQkFBb0IsUUFBUSxPQUFPO0FBQzNFLFNBQ0VDLGtCQUFrQixFQUNsQkMscUJBQXFCLEVBQ3JCQyxzQkFBc0IsRUFDdEIsS0FBS0Msa0JBQWtCLFFBQ2xCLDRCQUE0QjtBQUVuQyxjQUFjQSxrQkFBa0I7QUFFaEMsT0FBTyxLQUFLQyx5QkFBeUIsR0FBRztFQUN0QyxTQUFTQyxpQkFBaUIsRUFBRSxPQUFPO0VBQ25DLFNBQVNDLGtCQUFrQixFQUFFSCxrQkFBa0I7QUFDakQsQ0FBQztBQUVELE1BQU1JLG9CQUFvQixHQUFHVixhQUFhLENBQUNPLHlCQUF5QixDQUFDLENBQUM7RUFDcEVDLGlCQUFpQixFQUFFLElBQUk7RUFDdkJDLGtCQUFrQixFQUFFO0FBQ3RCLENBQUMsQ0FBQzs7QUFFRjtBQUNBQyxvQkFBb0IsQ0FBQ0MsV0FBVyxHQUFHLHNCQUFzQjs7QUFFekQ7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyxzQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUErQjtJQUFBQztFQUFBLElBQUFILEVBSXJDO0VBQ0MsTUFBQUwsaUJBQUEsR0FBMEJOLG9CQUFvQixDQUM1Q0csc0JBQXNCLEVBQ3RCRixrQkFDRixDQUFDO0VBQ0QsTUFBQU0sa0JBQUEsR0FBMkJQLG9CQUFvQixDQUM3Q0csc0JBQXNCLEVBQ3RCRCxxQkFDRixDQUFDO0VBQUEsSUFBQWEsRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQU4saUJBQUEsSUFBQU0sQ0FBQSxRQUFBTCxrQkFBQTtJQUdRUSxFQUFBO01BQUFULGlCQUFBO01BQUFDO0lBQXdDLENBQUM7SUFBQUssQ0FBQSxNQUFBTixpQkFBQTtJQUFBTSxDQUFBLE1BQUFMLGtCQUFBO0lBQUFLLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBRGxELE1BQUFJLEtBQUEsR0FDU0QsRUFBeUM7RUFFakQsSUFBQUUsRUFBQTtFQUFBLElBQUFMLENBQUEsUUFBQUUsUUFBQSxJQUFBRixDQUFBLFFBQUFJLEtBQUE7SUFHQ0MsRUFBQSxrQ0FBc0NELEtBQUssQ0FBTEEsTUFBSSxDQUFDLENBQ3hDRixTQUFPLENBQ1YsZ0NBQWdDO0lBQUFGLENBQUEsTUFBQUUsUUFBQTtJQUFBRixDQUFBLE1BQUFJLEtBQUE7SUFBQUosQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFBQSxPQUZoQ0ssRUFFZ0M7QUFBQTtBQUlwQyxlQUFlVCxvQkFBb0IiLCJpZ25vcmVMaXN0IjpbXX0=