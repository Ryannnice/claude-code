// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、useContext、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, useContext, useMemo } from 'react';
// 复用 Mailbox 工具函数，把通用处理留在 ../utils/mailbox.js 中维护。
import { Mailbox } from '../utils/mailbox.js';
// MailboxContext构建`createContext<Mailbox | undefined>(undefined)` 整理出中间结果，供mailbox后续步骤使用。
const MailboxContext = createContext<Mailbox | undefined>(undefined);
// Props 固化mailbox里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: React.ReactNode;
};
// MailboxProvider 封装mailbox的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MailboxProvider(t0) {
  // $保存`_c`，供mailbox后续处理使用。
  const $ = _c(3);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // t1 暂存 `new Mailbox()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `new Mailbox()` 生成的渲染片段，后续返回路径直接复用。
    t1 = new Mailbox();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // mailbox沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const mailbox = t1;
  // t2 暂存 `<MailboxContext.Provider value={mailbox}>{children}</Mail...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== children) {
    // t2 暂存 `<MailboxContext.Provider value={mailbox}>{children}</Mail...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <MailboxContext.Provider value={mailbox}>{children}</MailboxContext.Provider>;
    // $[1] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = children;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 返回 `t2`，作为mailbox这次计算的结果。
  return t2;
}
// useMailbox 封装mailbox的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useMailbox() {
  // mailbox保存`useContext`，供mailbox后续处理使用。
  const mailbox = useContext(MailboxContext);
  // mailbox缺失时提前走兜底路径，避免mailbox继续依赖无效输入。
  if (!mailbox) {
    // 抛出 new Error("useMailbox must be used within a MailboxProvider");，阻止mailbox在无效状态下继续运行。
    throw new Error("useMailbox must be used within a MailboxProvider");
  }
  // 返回 `mailbox`，作为mailbox这次计算的结果。
  return mailbox;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJ1c2VDb250ZXh0IiwidXNlTWVtbyIsIk1haWxib3giLCJNYWlsYm94Q29udGV4dCIsInVuZGVmaW5lZCIsIlByb3BzIiwiY2hpbGRyZW4iLCJSZWFjdE5vZGUiLCJNYWlsYm94UHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwibWFpbGJveCIsInQyIiwidXNlTWFpbGJveCIsIkVycm9yIl0sInNvdXJjZXMiOlsibWFpbGJveC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IGNyZWF0ZUNvbnRleHQsIHVzZUNvbnRleHQsIHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IE1haWxib3ggfSBmcm9tICcuLi91dGlscy9tYWlsYm94LmpzJ1xuXG5jb25zdCBNYWlsYm94Q29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8TWFpbGJveCB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKVxuXG50eXBlIFByb3BzID0ge1xuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBNYWlsYm94UHJvdmlkZXIoeyBjaGlsZHJlbiB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IG1haWxib3ggPSB1c2VNZW1vKCgpID0+IG5ldyBNYWlsYm94KCksIFtdKVxuICByZXR1cm4gKFxuICAgIDxNYWlsYm94Q29udGV4dC5Qcm92aWRlciB2YWx1ZT17bWFpbGJveH0+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9NYWlsYm94Q29udGV4dC5Qcm92aWRlcj5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlTWFpbGJveCgpOiBNYWlsYm94IHtcbiAgY29uc3QgbWFpbGJveCA9IHVzZUNvbnRleHQoTWFpbGJveENvbnRleHQpXG4gIGlmICghbWFpbGJveCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXNlTWFpbGJveCBtdXN0IGJlIHVzZWQgd2l0aGluIGEgTWFpbGJveFByb3ZpZGVyJylcbiAgfVxuICByZXR1cm4gbWFpbGJveFxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxhQUFhLEVBQUVDLFVBQVUsRUFBRUMsT0FBTyxRQUFRLE9BQU87QUFDakUsU0FBU0MsT0FBTyxRQUFRLHFCQUFxQjtBQUU3QyxNQUFNQyxjQUFjLEdBQUdKLGFBQWEsQ0FBQ0csT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDRSxTQUFTLENBQUM7QUFFcEUsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFFBQVEsRUFBRVIsS0FBSyxDQUFDUyxTQUFTO0FBQzNCLENBQUM7QUFFRCxPQUFPLFNBQUFDLGdCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXlCO0lBQUFMO0VBQUEsSUFBQUcsRUFBbUI7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFDbkJGLEVBQUEsT0FBSVYsT0FBTyxDQUFDLENBQUM7SUFBQVEsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBM0MsTUFBQUssT0FBQSxHQUE4QkgsRUFBYTtFQUFLLElBQUFJLEVBQUE7RUFBQSxJQUFBTixDQUFBLFFBQUFKLFFBQUE7SUFFOUNVLEVBQUEsNEJBQWdDRCxLQUFPLENBQVBBLFFBQU0sQ0FBQyxDQUNwQ1QsU0FBTyxDQUNWLDBCQUEwQjtJQUFBSSxDQUFBLE1BQUFKLFFBQUE7SUFBQUksQ0FBQSxNQUFBTSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTixDQUFBO0VBQUE7RUFBQSxPQUYxQk0sRUFFMEI7QUFBQTtBQUk5QixPQUFPLFNBQUFDLFdBQUE7RUFDTCxNQUFBRixPQUFBLEdBQWdCZixVQUFVLENBQUNHLGNBQWMsQ0FBQztFQUMxQyxJQUFJLENBQUNZLE9BQU87SUFDVixNQUFNLElBQUlHLEtBQUssQ0FBQyxrREFBa0QsQ0FBQztFQUFBO0VBQ3BFLE9BQ01ILE9BQU87QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==