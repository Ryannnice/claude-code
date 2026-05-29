// 引入 React、useContext、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useContext, useRef } from 'react';
// 复用 useTerminalViewport 终端界面组件，避免在这里重复拼装显示逻辑。
import { useTerminalViewport } from '../ink/hooks/use-terminal-viewport.js';
// 引入 Box，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../ink.js';
// 引入 InVirtualListContext，将 ./messageActions.js 中已经封装好的能力接到本文件流程里。
import { InVirtualListContext } from './messageActions.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: React.ReactNode;
};

/**
 * Freezes children when they scroll above the terminal viewport (into scrollback).
 *
 * Any content change above the viewport forces log-update.ts into a full terminal
 * reset (it cannot partially update rows that have scrolled out). For content that
 * updates on a timer — spinners, elapsed counters — this produces a reset per tick.
 *
 * When offscreen, returns the same ReactElement reference that was cached during
 * the last visible render. React's reconciler bails on identical element refs, so
 * the subtree never re-renders, producing zero diff.
 *
 * The cache is one slot deep: the first re-render after scrolling back into view
 * picks up the live children. Content still updates normally while visible.
 */
// OffscreenFreeze 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function OffscreenFreeze({
  children
}: Props): React.ReactNode {
  // React Compiler: reading cached.current in the return is the entire
  // freeze mechanism — memoizing this component would defeat it. Opt out.
  // 终端 UI 组件 Offscreen Freeze在这里处理 `'use no memo'`，完成这一小步状态转换。
  'use no memo';

  // inVirtualList 集合保存`useContext`，供终端渲染后续处理使用。
  const inVirtualList = useContext(InVirtualListContext);
  // 终端 UI 组件 Offscreen Freeze先整理这一处局部数据，后续分支可以直接读取。
  const [ref, {
    isVisible
  }] = useTerminalViewport();
  // cached 缓存保存`useRef`，供终端渲染后续处理使用。
  const cached = useRef(children);
  // Virtual list has no terminal scrollback — the ScrollBox clips inside the
  // viewport, so there's nothing to freeze. Freezing there also blocks
  // click-to-expand since useTerminalViewport's visibility calc can disagree
  // with the ScrollBox's virtual scroll position.
  // 只有 `isVisible || inVirtualList` 满足时，终端渲染才执行该分支。
  if (isVisible || inVirtualList) {
    // current更新为 `children`，确保终端 UI后续读取最新状态。
    cached.current = children;
  }
  // 返回 `<Box ref={ref}>{cached.current}</Box>`，作为终端渲染这次计算的结果。
  return <Box ref={ref}>{cached.current}</Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNvbnRleHQiLCJ1c2VSZWYiLCJ1c2VUZXJtaW5hbFZpZXdwb3J0IiwiQm94IiwiSW5WaXJ0dWFsTGlzdENvbnRleHQiLCJQcm9wcyIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwiT2Zmc2NyZWVuRnJlZXplIiwiaW5WaXJ0dWFsTGlzdCIsInJlZiIsImlzVmlzaWJsZSIsImNhY2hlZCIsImN1cnJlbnQiXSwic291cmNlcyI6WyJPZmZzY3JlZW5GcmVlemUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VDb250ZXh0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVRlcm1pbmFsVmlld3BvcnQgfSBmcm9tICcuLi9pbmsvaG9va3MvdXNlLXRlcm1pbmFsLXZpZXdwb3J0LmpzJ1xuaW1wb3J0IHsgQm94IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgSW5WaXJ0dWFsTGlzdENvbnRleHQgfSBmcm9tICcuL21lc3NhZ2VBY3Rpb25zLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG59XG5cbi8qKlxuICogRnJlZXplcyBjaGlsZHJlbiB3aGVuIHRoZXkgc2Nyb2xsIGFib3ZlIHRoZSB0ZXJtaW5hbCB2aWV3cG9ydCAoaW50byBzY3JvbGxiYWNrKS5cbiAqXG4gKiBBbnkgY29udGVudCBjaGFuZ2UgYWJvdmUgdGhlIHZpZXdwb3J0IGZvcmNlcyBsb2ctdXBkYXRlLnRzIGludG8gYSBmdWxsIHRlcm1pbmFsXG4gKiByZXNldCAoaXQgY2Fubm90IHBhcnRpYWxseSB1cGRhdGUgcm93cyB0aGF0IGhhdmUgc2Nyb2xsZWQgb3V0KS4gRm9yIGNvbnRlbnQgdGhhdFxuICogdXBkYXRlcyBvbiBhIHRpbWVyIOKAlCBzcGlubmVycywgZWxhcHNlZCBjb3VudGVycyDigJQgdGhpcyBwcm9kdWNlcyBhIHJlc2V0IHBlciB0aWNrLlxuICpcbiAqIFdoZW4gb2Zmc2NyZWVuLCByZXR1cm5zIHRoZSBzYW1lIFJlYWN0RWxlbWVudCByZWZlcmVuY2UgdGhhdCB3YXMgY2FjaGVkIGR1cmluZ1xuICogdGhlIGxhc3QgdmlzaWJsZSByZW5kZXIuIFJlYWN0J3MgcmVjb25jaWxlciBiYWlscyBvbiBpZGVudGljYWwgZWxlbWVudCByZWZzLCBzb1xuICogdGhlIHN1YnRyZWUgbmV2ZXIgcmUtcmVuZGVycywgcHJvZHVjaW5nIHplcm8gZGlmZi5cbiAqXG4gKiBUaGUgY2FjaGUgaXMgb25lIHNsb3QgZGVlcDogdGhlIGZpcnN0IHJlLXJlbmRlciBhZnRlciBzY3JvbGxpbmcgYmFjayBpbnRvIHZpZXdcbiAqIHBpY2tzIHVwIHRoZSBsaXZlIGNoaWxkcmVuLiBDb250ZW50IHN0aWxsIHVwZGF0ZXMgbm9ybWFsbHkgd2hpbGUgdmlzaWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIE9mZnNjcmVlbkZyZWV6ZSh7IGNoaWxkcmVuIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gUmVhY3QgQ29tcGlsZXI6IHJlYWRpbmcgY2FjaGVkLmN1cnJlbnQgaW4gdGhlIHJldHVybiBpcyB0aGUgZW50aXJlXG4gIC8vIGZyZWV6ZSBtZWNoYW5pc20g4oCUIG1lbW9pemluZyB0aGlzIGNvbXBvbmVudCB3b3VsZCBkZWZlYXQgaXQuIE9wdCBvdXQuXG4gICd1c2Ugbm8gbWVtbydcbiAgY29uc3QgaW5WaXJ0dWFsTGlzdCA9IHVzZUNvbnRleHQoSW5WaXJ0dWFsTGlzdENvbnRleHQpXG4gIGNvbnN0IFtyZWYsIHsgaXNWaXNpYmxlIH1dID0gdXNlVGVybWluYWxWaWV3cG9ydCgpXG4gIGNvbnN0IGNhY2hlZCA9IHVzZVJlZihjaGlsZHJlbilcbiAgLy8gVmlydHVhbCBsaXN0IGhhcyBubyB0ZXJtaW5hbCBzY3JvbGxiYWNrIOKAlCB0aGUgU2Nyb2xsQm94IGNsaXBzIGluc2lkZSB0aGVcbiAgLy8gdmlld3BvcnQsIHNvIHRoZXJlJ3Mgbm90aGluZyB0byBmcmVlemUuIEZyZWV6aW5nIHRoZXJlIGFsc28gYmxvY2tzXG4gIC8vIGNsaWNrLXRvLWV4cGFuZCBzaW5jZSB1c2VUZXJtaW5hbFZpZXdwb3J0J3MgdmlzaWJpbGl0eSBjYWxjIGNhbiBkaXNhZ3JlZVxuICAvLyB3aXRoIHRoZSBTY3JvbGxCb3gncyB2aXJ0dWFsIHNjcm9sbCBwb3NpdGlvbi5cbiAgaWYgKGlzVmlzaWJsZSB8fCBpblZpcnR1YWxMaXN0KSB7XG4gICAgY2FjaGVkLmN1cnJlbnQgPSBjaGlsZHJlblxuICB9XG4gIHJldHVybiA8Qm94IHJlZj17cmVmfT57Y2FjaGVkLmN1cnJlbnR9PC9Cb3g+XG59XG4iXSwibWFwcGluZ3MiOiJBQUFBLE9BQU9BLEtBQUssSUFBSUMsVUFBVSxFQUFFQyxNQUFNLFFBQVEsT0FBTztBQUNqRCxTQUFTQyxtQkFBbUIsUUFBUSx1Q0FBdUM7QUFDM0UsU0FBU0MsR0FBRyxRQUFRLFdBQVc7QUFDL0IsU0FBU0Msb0JBQW9CLFFBQVEscUJBQXFCO0FBRTFELEtBQUtDLEtBQUssR0FBRztFQUNYQyxRQUFRLEVBQUVQLEtBQUssQ0FBQ1EsU0FBUztBQUMzQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQVNDLGVBQWVBLENBQUM7RUFBRUY7QUFBZ0IsQ0FBTixFQUFFRCxLQUFLLENBQUMsRUFBRU4sS0FBSyxDQUFDUSxTQUFTLENBQUM7RUFDcEU7RUFDQTtFQUNBLGFBQWE7O0VBQ2IsTUFBTUUsYUFBYSxHQUFHVCxVQUFVLENBQUNJLG9CQUFvQixDQUFDO0VBQ3RELE1BQU0sQ0FBQ00sR0FBRyxFQUFFO0lBQUVDO0VBQVUsQ0FBQyxDQUFDLEdBQUdULG1CQUFtQixDQUFDLENBQUM7RUFDbEQsTUFBTVUsTUFBTSxHQUFHWCxNQUFNLENBQUNLLFFBQVEsQ0FBQztFQUMvQjtFQUNBO0VBQ0E7RUFDQTtFQUNBLElBQUlLLFNBQVMsSUFBSUYsYUFBYSxFQUFFO0lBQzlCRyxNQUFNLENBQUNDLE9BQU8sR0FBR1AsUUFBUTtFQUMzQjtFQUNBLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUNJLEdBQUcsQ0FBQyxDQUFDLENBQUNFLE1BQU0sQ0FBQ0MsT0FBTyxDQUFDLEVBQUUsR0FBRyxDQUFDO0FBQzlDIiwiaWdub3JlTGlzdCI6W119