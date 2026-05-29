// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、isValidElement、ReactNode、useContext，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, isValidElement, type ReactNode, useContext } from 'react';
// 引入 Box，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../ink.js';
// 引入 OrderedListItem、OrderedListItemContext，将 ./OrderedListItem.js 中已经封装好的能力接到本文件流程里。
import { OrderedListItem, OrderedListItemContext } from './OrderedListItem.js';
// OrderedListContext 集合构建`createContext`，供终端渲染后续处理使用。
const OrderedListContext = createContext({
  marker: ''
});
// OrderedListProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type OrderedListProps = {
  children: ReactNode;
};
// OrderedListComponent 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function OrderedListComponent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    marker: parentMarker
  } = useContext(OrderedListContext);
  // numberOfItems 集合保存`0`，供后续判断或组装使用。
  let numberOfItems = 0;
  // 逐项读取 `React.Children.toArray(children)` 中的child，按输入顺序推进终端渲染。
  for (const child of React.Children.toArray(children)) {
    // `!isValidElement(child) || child.type` 与 `OrderedListItem` 不一致时刷新派生状态，避免使用过期结果。
    if (!isValidElement(child) || child.type !== OrderedListItem) {
      // 跳过当前项，继续处理终端渲染中的下一轮循环。
      continue;
    }
    // 终端 UI 组件 Ordered List在这里处理 `numberOfItems++`，完成这一小步状态转换。
    numberOfItems++;
  }
  // maxMarkerWidth保存`String`，供终端渲染后续处理使用。
  const maxMarkerWidth = String(numberOfItems).length;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children || $[1] !== maxMarkerWidth || $[2] !== parentMarker) {
    // t2 暂存 `(child_0, index) => {` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== maxMarkerWidth || $[5] !== parentMarker) {
      // t2 暂存 `(child_0, index) => {` 生成的渲染片段，后续返回路径直接复用。
      t2 = (child_0, index) => {
        // `!isValidElement(child_0) || child_0.type` 与 `OrderedListItem` 不一致时刷新派生状态，避免使用过期结果。
        if (!isValidElement(child_0) || child_0.type !== OrderedListItem) {
          // 返回 `child_0`，作为终端渲染这次计算的结果。
          return child_0;
        }
        // paddedMarker保存`String`，供终端渲染后续处理使用。
        const paddedMarker = `${String(index + 1).padStart(maxMarkerWidth)}.`;
        // marker固定为 ``${parentMarker}${paddedMarker}``，作为终端 UI Ordered List后续展示或比较的基准。
        const marker = `${parentMarker}${paddedMarker}`;
        // 返回 `<OrderedListContext.Provider value={{`，作为终端渲染这次计算的结果。
        return <OrderedListContext.Provider value={{
          marker
        }}><OrderedListItemContext.Provider value={{
            marker
          }}>{child_0}</OrderedListItemContext.Provider></OrderedListContext.Provider>;
      };
      // $[4] 缓存 `maxMarkerWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = maxMarkerWidth;
      // $[5] 缓存 `parentMarker`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = parentMarker;
      // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[6];
    }
    // t1 暂存 `React.Children.map(children, t2)` 生成的渲染片段，后续返回路径直接复用。
    t1 = React.Children.map(children, t2);
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `maxMarkerWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = maxMarkerWidth;
    // $[2] 缓存 `parentMarker`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = parentMarker;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // t2 暂存 `<Box flexDirection="column">{t1}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t1) {
    // t2 暂存 `<Box flexDirection="column">{t1}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexDirection="column">{t1}</Box>;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[8];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}

// eslint-disable-next-line custom-rules/no-top-level-side-effects
// Item更新为 `OrderedListItem`，确保终端 UI后续读取最新状态。
OrderedListComponent.Item = OrderedListItem;
// OrderedList 集合 命名 `OrderedListComponent`，让后续代码直接表达这个值的用途。
export const OrderedList = OrderedListComponent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJpc1ZhbGlkRWxlbWVudCIsIlJlYWN0Tm9kZSIsInVzZUNvbnRleHQiLCJCb3giLCJPcmRlcmVkTGlzdEl0ZW0iLCJPcmRlcmVkTGlzdEl0ZW1Db250ZXh0IiwiT3JkZXJlZExpc3RDb250ZXh0IiwibWFya2VyIiwiT3JkZXJlZExpc3RQcm9wcyIsImNoaWxkcmVuIiwiT3JkZXJlZExpc3RDb21wb25lbnQiLCJ0MCIsIiQiLCJfYyIsInBhcmVudE1hcmtlciIsIm51bWJlck9mSXRlbXMiLCJjaGlsZCIsIkNoaWxkcmVuIiwidG9BcnJheSIsInR5cGUiLCJtYXhNYXJrZXJXaWR0aCIsIlN0cmluZyIsImxlbmd0aCIsInQxIiwidDIiLCJjaGlsZF8wIiwiaW5kZXgiLCJwYWRkZWRNYXJrZXIiLCJwYWRTdGFydCIsIm1hcCIsIkl0ZW0iLCJPcmRlcmVkTGlzdCJdLCJzb3VyY2VzIjpbIk9yZGVyZWRMaXN0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHtcbiAgY3JlYXRlQ29udGV4dCxcbiAgaXNWYWxpZEVsZW1lbnQsXG4gIHR5cGUgUmVhY3ROb2RlLFxuICB1c2VDb250ZXh0LFxufSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IE9yZGVyZWRMaXN0SXRlbSwgT3JkZXJlZExpc3RJdGVtQ29udGV4dCB9IGZyb20gJy4vT3JkZXJlZExpc3RJdGVtLmpzJ1xuXG5jb25zdCBPcmRlcmVkTGlzdENvbnRleHQgPSBjcmVhdGVDb250ZXh0KHsgbWFya2VyOiAnJyB9KVxuXG50eXBlIE9yZGVyZWRMaXN0UHJvcHMgPSB7XG4gIGNoaWxkcmVuOiBSZWFjdE5vZGVcbn1cblxuZnVuY3Rpb24gT3JkZXJlZExpc3RDb21wb25lbnQoeyBjaGlsZHJlbiB9OiBPcmRlcmVkTGlzdFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBtYXJrZXI6IHBhcmVudE1hcmtlciB9ID0gdXNlQ29udGV4dChPcmRlcmVkTGlzdENvbnRleHQpXG5cbiAgbGV0IG51bWJlck9mSXRlbXMgPSAwXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgUmVhY3QuQ2hpbGRyZW4udG9BcnJheShjaGlsZHJlbikpIHtcbiAgICBpZiAoIWlzVmFsaWRFbGVtZW50KGNoaWxkKSB8fCBjaGlsZC50eXBlICE9PSBPcmRlcmVkTGlzdEl0ZW0pIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIG51bWJlck9mSXRlbXMrK1xuICB9XG5cbiAgY29uc3QgbWF4TWFya2VyV2lkdGggPSBTdHJpbmcobnVtYmVyT2ZJdGVtcykubGVuZ3RoXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIHtSZWFjdC5DaGlsZHJlbi5tYXAoY2hpbGRyZW4sIChjaGlsZCwgaW5kZXgpID0+IHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkRWxlbWVudChjaGlsZCkgfHwgY2hpbGQudHlwZSAhPT0gT3JkZXJlZExpc3RJdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGNoaWxkXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYWRkZWRNYXJrZXIgPSBgJHtTdHJpbmcoaW5kZXggKyAxKS5wYWRTdGFydChtYXhNYXJrZXJXaWR0aCl9LmBcbiAgICAgICAgY29uc3QgbWFya2VyID0gYCR7cGFyZW50TWFya2VyfSR7cGFkZGVkTWFya2VyfWBcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxPcmRlcmVkTGlzdENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3sgbWFya2VyIH19PlxuICAgICAgICAgICAgPE9yZGVyZWRMaXN0SXRlbUNvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3sgbWFya2VyIH19PlxuICAgICAgICAgICAgICB7Y2hpbGR9XG4gICAgICAgICAgICA8L09yZGVyZWRMaXN0SXRlbUNvbnRleHQuUHJvdmlkZXI+XG4gICAgICAgICAgPC9PcmRlcmVkTGlzdENvbnRleHQuUHJvdmlkZXI+XG4gICAgICAgIClcbiAgICAgIH0pfVxuICAgIDwvQm94PlxuICApXG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjdXN0b20tcnVsZXMvbm8tdG9wLWxldmVsLXNpZGUtZWZmZWN0c1xuT3JkZXJlZExpc3RDb21wb25lbnQuSXRlbSA9IE9yZGVyZWRMaXN0SXRlbVxuXG5leHBvcnQgY29uc3QgT3JkZXJlZExpc3QgPSBPcmRlcmVkTGlzdENvbXBvbmVudFxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUNWQyxhQUFhLEVBQ2JDLGNBQWMsRUFDZCxLQUFLQyxTQUFTLEVBQ2RDLFVBQVUsUUFDTCxPQUFPO0FBQ2QsU0FBU0MsR0FBRyxRQUFRLGNBQWM7QUFDbEMsU0FBU0MsZUFBZSxFQUFFQyxzQkFBc0IsUUFBUSxzQkFBc0I7QUFFOUUsTUFBTUMsa0JBQWtCLEdBQUdQLGFBQWEsQ0FBQztFQUFFUSxNQUFNLEVBQUU7QUFBRyxDQUFDLENBQUM7QUFFeEQsS0FBS0MsZ0JBQWdCLEdBQUc7RUFDdEJDLFFBQVEsRUFBRVIsU0FBUztBQUNyQixDQUFDO0FBRUQsU0FBQVMscUJBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBOEI7SUFBQUo7RUFBQSxJQUFBRSxFQUE4QjtFQUMxRDtJQUFBSixNQUFBLEVBQUFPO0VBQUEsSUFBaUNaLFVBQVUsQ0FBQ0ksa0JBQWtCLENBQUM7RUFFL0QsSUFBQVMsYUFBQSxHQUFvQixDQUFDO0VBQ3JCLEtBQUssTUFBQUMsS0FBVyxJQUFJbEIsS0FBSyxDQUFBbUIsUUFBUyxDQUFBQyxPQUFRLENBQUNULFFBQVEsQ0FBQztJQUNsRCxJQUFJLENBQUNULGNBQWMsQ0FBQ2dCLEtBQUssQ0FBbUMsSUFBOUJBLEtBQUssQ0FBQUcsSUFBSyxLQUFLZixlQUFlO01BQzFEO0lBQVE7SUFFVlcsYUFBYSxFQUFFO0VBQUE7RUFHakIsTUFBQUssY0FBQSxHQUF1QkMsTUFBTSxDQUFDTixhQUFhLENBQUMsQ0FBQU8sTUFBTztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBWCxDQUFBLFFBQUFILFFBQUEsSUFBQUcsQ0FBQSxRQUFBUSxjQUFBLElBQUFSLENBQUEsUUFBQUUsWUFBQTtJQUFBLElBQUFVLEVBQUE7SUFBQSxJQUFBWixDQUFBLFFBQUFRLGNBQUEsSUFBQVIsQ0FBQSxRQUFBRSxZQUFBO01BSWpCVSxFQUFBLEdBQUFBLENBQUFDLE9BQUEsRUFBQUMsS0FBQTtRQUM1QixJQUFJLENBQUMxQixjQUFjLENBQUNnQixPQUFLLENBQW1DLElBQTlCQSxPQUFLLENBQUFHLElBQUssS0FBS2YsZUFBZTtVQUFBLE9BQ25EWSxPQUFLO1FBQUE7UUFHZCxNQUFBVyxZQUFBLEdBQXFCLEdBQUdOLE1BQU0sQ0FBQ0ssS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFBRSxRQUFTLENBQUNSLGNBQWMsQ0FBQyxHQUFHO1FBQ3JFLE1BQUFiLE1BQUEsR0FBZSxHQUFHTyxZQUFZLEdBQUdhLFlBQVksRUFBRTtRQUFBLE9BRzdDLDZCQUFvQyxLQUFVLENBQVY7VUFBQXBCO1FBQVMsRUFBQyxDQUM1QyxpQ0FBd0MsS0FBVSxDQUFWO1lBQUFBO1VBQVMsRUFBQyxDQUMvQ1MsUUFBSSxDQUNQLGtDQUNGLDhCQUE4QjtNQUFBLENBRWpDO01BQUFKLENBQUEsTUFBQVEsY0FBQTtNQUFBUixDQUFBLE1BQUFFLFlBQUE7TUFBQUYsQ0FBQSxNQUFBWSxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBWixDQUFBO0lBQUE7SUFmQVcsRUFBQSxHQUFBekIsS0FBSyxDQUFBbUIsUUFBUyxDQUFBWSxHQUFJLENBQUNwQixRQUFRLEVBQUVlLEVBZTdCLENBQUM7SUFBQVosQ0FBQSxNQUFBSCxRQUFBO0lBQUFHLENBQUEsTUFBQVEsY0FBQTtJQUFBUixDQUFBLE1BQUFFLFlBQUE7SUFBQUYsQ0FBQSxNQUFBVyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFBQSxJQUFBWSxFQUFBO0VBQUEsSUFBQVosQ0FBQSxRQUFBVyxFQUFBO0lBaEJKQyxFQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3hCLENBQUFELEVBZUEsQ0FDSCxFQWpCQyxHQUFHLENBaUJFO0lBQUFYLENBQUEsTUFBQVcsRUFBQTtJQUFBWCxDQUFBLE1BQUFZLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFaLENBQUE7RUFBQTtFQUFBLE9BakJOWSxFQWlCTTtBQUFBOztBQUlWO0FBQ0FkLG9CQUFvQixDQUFDb0IsSUFBSSxHQUFHMUIsZUFBZTtBQUUzQyxPQUFPLE1BQU0yQixXQUFXLEdBQUdyQixvQkFBb0IiLCJpZ25vcmVMaXN0IjpbXX0=