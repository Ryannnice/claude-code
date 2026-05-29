// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../ink.js';
// QueuedMessageContextValue 固化Queued Message Context里传递的数据形状，帮助调用方按同一结构读写字段。
type QueuedMessageContextValue = {
  isQueued: boolean;
  isFirst: boolean;
  /** Width reduction for container padding (e.g., 4 for paddingX={2}) */
  paddingWidth: number;
};
// QueuedMessageContext 消息数据构建`React.createContext<QueuedMessageContextValue | undefined...` 整理出中间结果，供Queued Message Context后续步骤使用。
const QueuedMessageContext = React.createContext<QueuedMessageContextValue | undefined>(undefined);
// useQueuedMessage 封装QueuedMessageContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useQueuedMessage() {
  // 返回 `React.useContext(QueuedMessageContext)`，作为Queued Message Context这次计算的结果。
  return React.useContext(QueuedMessageContext);
}
// PADDING_X 命名 `2`，让后续代码直接表达这个值的用途。
const PADDING_X = 2;
// Props 固化Queued Message Context里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  isFirst: boolean;
  useBriefLayout?: boolean;
  children: React.ReactNode;
};
// QueuedMessageProvider 封装QueuedMessageContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function QueuedMessageProvider(t0) {
  // $保存`_c`，供Queued Message Context后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isFirst,
    useBriefLayout,
    children
  } = t0;
  // padding读取 hook 状态，供Queued Message Context本轮渲染使用。
  const padding = useBriefLayout ? 0 : PADDING_X;
  // 临时值 t1 命名 `padding * 2`，让后续代码直接表达这个值的用途。
  const t1 = padding * 2;
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== isFirst || $[1] !== t1) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      isQueued: true,
      isFirst,
      paddingWidth: t1
    };
    // $[0] 缓存 `isFirst`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = isFirst;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 取值沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const value = t2;
  // t3 暂存 `<Box paddingX={padding}>{children}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== children || $[4] !== padding) {
    // t3 暂存 `<Box paddingX={padding}>{children}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box paddingX={padding}>{children}</Box>;
    // $[3] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = children;
    // $[4] 缓存 `padding`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = padding;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<QueuedMessageContext.Provider value={value}>{t3}</Queued...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t3 || $[7] !== value) {
    // t4 暂存 `<QueuedMessageContext.Provider value={value}>{t3}</Queued...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <QueuedMessageContext.Provider value={value}>{t3}</QueuedMessageContext.Provider>;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = value;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // 返回 `t4`，作为Queued Message Context这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlF1ZXVlZE1lc3NhZ2VDb250ZXh0VmFsdWUiLCJpc1F1ZXVlZCIsImlzRmlyc3QiLCJwYWRkaW5nV2lkdGgiLCJRdWV1ZWRNZXNzYWdlQ29udGV4dCIsImNyZWF0ZUNvbnRleHQiLCJ1bmRlZmluZWQiLCJ1c2VRdWV1ZWRNZXNzYWdlIiwidXNlQ29udGV4dCIsIlBBRERJTkdfWCIsIlByb3BzIiwidXNlQnJpZWZMYXlvdXQiLCJjaGlsZHJlbiIsIlJlYWN0Tm9kZSIsIlF1ZXVlZE1lc3NhZ2VQcm92aWRlciIsInQwIiwiJCIsIl9jIiwicGFkZGluZyIsInQxIiwidDIiLCJ2YWx1ZSIsInQzIiwidDQiXSwic291cmNlcyI6WyJRdWV1ZWRNZXNzYWdlQ29udGV4dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3ggfSBmcm9tICcuLi9pbmsuanMnXG5cbnR5cGUgUXVldWVkTWVzc2FnZUNvbnRleHRWYWx1ZSA9IHtcbiAgaXNRdWV1ZWQ6IGJvb2xlYW5cbiAgaXNGaXJzdDogYm9vbGVhblxuICAvKiogV2lkdGggcmVkdWN0aW9uIGZvciBjb250YWluZXIgcGFkZGluZyAoZS5nLiwgNCBmb3IgcGFkZGluZ1g9ezJ9KSAqL1xuICBwYWRkaW5nV2lkdGg6IG51bWJlclxufVxuXG5jb25zdCBRdWV1ZWRNZXNzYWdlQ29udGV4dCA9IFJlYWN0LmNyZWF0ZUNvbnRleHQ8XG4gIFF1ZXVlZE1lc3NhZ2VDb250ZXh0VmFsdWUgfCB1bmRlZmluZWRcbj4odW5kZWZpbmVkKVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlUXVldWVkTWVzc2FnZSgpOiBRdWV1ZWRNZXNzYWdlQ29udGV4dFZhbHVlIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIFJlYWN0LnVzZUNvbnRleHQoUXVldWVkTWVzc2FnZUNvbnRleHQpXG59XG5cbmNvbnN0IFBBRERJTkdfWCA9IDJcblxudHlwZSBQcm9wcyA9IHtcbiAgaXNGaXJzdDogYm9vbGVhblxuICB1c2VCcmllZkxheW91dD86IGJvb2xlYW5cbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUXVldWVkTWVzc2FnZVByb3ZpZGVyKHtcbiAgaXNGaXJzdCxcbiAgdXNlQnJpZWZMYXlvdXQsXG4gIGNoaWxkcmVuLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBCcmllZiBtb2RlIGFscmVhZHkgaW5kZW50cyB2aWEgcGFkZGluZ0xlZnQgaW4gSGlnaGxpZ2h0ZWRUaGlua2luZ1RleHQgL1xuICAvLyBCcmllZlRvb2wgVUkg4oCUIGFkZGluZyBwYWRkaW5nWCBoZXJlIHdvdWxkIGRvdWJsZS1pbmRlbnQgdGhlIHF1ZXVlLlxuICBjb25zdCBwYWRkaW5nID0gdXNlQnJpZWZMYXlvdXQgPyAwIDogUEFERElOR19YXG4gIGNvbnN0IHZhbHVlID0gUmVhY3QudXNlTWVtbyhcbiAgICAoKSA9PiAoeyBpc1F1ZXVlZDogdHJ1ZSwgaXNGaXJzdCwgcGFkZGluZ1dpZHRoOiBwYWRkaW5nICogMiB9KSxcbiAgICBbaXNGaXJzdCwgcGFkZGluZ10sXG4gIClcblxuICByZXR1cm4gKFxuICAgIDxRdWV1ZWRNZXNzYWdlQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17dmFsdWV9PlxuICAgICAgPEJveCBwYWRkaW5nWD17cGFkZGluZ30+e2NoaWxkcmVufTwvQm94PlxuICAgIDwvUXVldWVkTWVzc2FnZUNvbnRleHQuUHJvdmlkZXI+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsR0FBRyxRQUFRLFdBQVc7QUFFL0IsS0FBS0MseUJBQXlCLEdBQUc7RUFDL0JDLFFBQVEsRUFBRSxPQUFPO0VBQ2pCQyxPQUFPLEVBQUUsT0FBTztFQUNoQjtFQUNBQyxZQUFZLEVBQUUsTUFBTTtBQUN0QixDQUFDO0FBRUQsTUFBTUMsb0JBQW9CLEdBQUdOLEtBQUssQ0FBQ08sYUFBYSxDQUM5Q0wseUJBQXlCLEdBQUcsU0FBUyxDQUN0QyxDQUFDTSxTQUFTLENBQUM7QUFFWixPQUFPLFNBQUFDLGlCQUFBO0VBQUEsT0FDRVQsS0FBSyxDQUFBVSxVQUFXLENBQUNKLG9CQUFvQixDQUFDO0FBQUE7QUFHL0MsTUFBTUssU0FBUyxHQUFHLENBQUM7QUFFbkIsS0FBS0MsS0FBSyxHQUFHO0VBQ1hSLE9BQU8sRUFBRSxPQUFPO0VBQ2hCUyxjQUFjLENBQUMsRUFBRSxPQUFPO0VBQ3hCQyxRQUFRLEVBQUVkLEtBQUssQ0FBQ2UsU0FBUztBQUMzQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxzQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUErQjtJQUFBZixPQUFBO0lBQUFTLGNBQUE7SUFBQUM7RUFBQSxJQUFBRyxFQUk5QjtFQUdOLE1BQUFHLE9BQUEsR0FBZ0JQLGNBQWMsR0FBZCxDQUE4QixHQUE5QkYsU0FBOEI7RUFFSSxNQUFBVSxFQUFBLEdBQUFELE9BQU8sR0FBRyxDQUFDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFKLENBQUEsUUFBQWQsT0FBQSxJQUFBYyxDQUFBLFFBQUFHLEVBQUE7SUFBcERDLEVBQUE7TUFBQW5CLFFBQUEsRUFBWSxJQUFJO01BQUFDLE9BQUE7TUFBQUMsWUFBQSxFQUF5QmdCO0lBQVksQ0FBQztJQUFBSCxDQUFBLE1BQUFkLE9BQUE7SUFBQWMsQ0FBQSxNQUFBRyxFQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUosQ0FBQTtFQUFBO0VBRC9ELE1BQUFLLEtBQUEsR0FDU0QsRUFBc0Q7RUFFOUQsSUFBQUUsRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQUosUUFBQSxJQUFBSSxDQUFBLFFBQUFFLE9BQUE7SUFJR0ksRUFBQSxJQUFDLEdBQUcsQ0FBV0osUUFBTyxDQUFQQSxRQUFNLENBQUMsQ0FBR04sU0FBTyxDQUFFLEVBQWpDLEdBQUcsQ0FBb0M7SUFBQUksQ0FBQSxNQUFBSixRQUFBO0lBQUFJLENBQUEsTUFBQUUsT0FBQTtJQUFBRixDQUFBLE1BQUFNLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFOLENBQUE7RUFBQTtFQUFBLElBQUFPLEVBQUE7RUFBQSxJQUFBUCxDQUFBLFFBQUFNLEVBQUEsSUFBQU4sQ0FBQSxRQUFBSyxLQUFBO0lBRDFDRSxFQUFBLGtDQUFzQ0YsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDekMsQ0FBQUMsRUFBdUMsQ0FDekMsZ0NBQWdDO0lBQUFOLENBQUEsTUFBQU0sRUFBQTtJQUFBTixDQUFBLE1BQUFLLEtBQUE7SUFBQUwsQ0FBQSxNQUFBTyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUCxDQUFBO0VBQUE7RUFBQSxPQUZoQ08sRUFFZ0M7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==