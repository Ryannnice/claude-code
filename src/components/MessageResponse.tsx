// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useContext，将 react 中已经封装好的能力接到本文件流程里。
import { useContext } from 'react';
// 引入 Box、NoSelect、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, NoSelect, Text } from '../ink.js';
// 引入 Ratchet，将 ./design-system/Ratchet.js 中已经封装好的能力接到本文件流程里。
import { Ratchet } from './design-system/Ratchet.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: React.ReactNode;
  height?: number;
};
// MessageResponse 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MessageResponse(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    height
  } = t0;
  // isMessageResponse 消息数据记录 `useContext` 是否成立，终端渲染随后按该结果分支。
  const isMessageResponse = useContext(MessageResponseContext);
  // 满足 `isMessageResponse` 时，终端渲染执行该分支。
  if (isMessageResponse) {
    // 返回 `children`，作为终端渲染这次计算的结果。
    return children;
  }
  // t1 暂存 `<NoSelect fromLeftEdge={true} flexShrink={0}><Text dimCol...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<NoSelect fromLeftEdge={true} flexShrink={0}><Text dimCol...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <NoSelect fromLeftEdge={true} flexShrink={0}><Text dimColor={true}>{"  "}⎿  </Text></NoSelect>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `<Box flexShrink={1} flexGrow={1}>{children}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== children) {
    // t2 暂存 `<Box flexShrink={1} flexGrow={1}>{children}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box flexShrink={1} flexGrow={1}>{children}</Box>;
    // $[1] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = children;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<MessageResponseProvider><Box flexDirection="row" height=...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== height || $[4] !== t2) {
    // t3 暂存 `<MessageResponseProvider><Box flexDirection="row" height=...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <MessageResponseProvider><Box flexDirection="row" height={height} overflowY="hidden">{t1}{t2}</Box></MessageResponseProvider>;
    // $[3] 缓存 `height`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = height;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // 文本内容沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const content = t3;
  // `height` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (height !== undefined) {
    // 返回 `content`，作为终端渲染这次计算的结果。
    return content;
  }
  // t4 暂存 `<Ratchet lock="offscreen">{content}</Ratchet>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== content) {
    // t4 暂存 `<Ratchet lock="offscreen">{content}</Ratchet>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Ratchet lock="offscreen">{content}</Ratchet>;
    // $[6] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = content;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}

// This is a context that is used to determine if the message response
// is rendered as a descendant of another MessageResponse. We use it
// to avoid rendering nested ⎿ characters.
// MessageResponseContext 消息数据构建`React.createContext`，供终端渲染后续处理使用。
const MessageResponseContext = React.createContext(false);
// MessageResponseProvider 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MessageResponseProvider(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // t1 暂存 `<MessageResponseContext.Provider value={true}>{children}<...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children) {
    // t1 暂存 `<MessageResponseContext.Provider value={true}>{children}<...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <MessageResponseContext.Provider value={true}>{children}</MessageResponseContext.Provider>;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNvbnRleHQiLCJCb3giLCJOb1NlbGVjdCIsIlRleHQiLCJSYXRjaGV0IiwiUHJvcHMiLCJjaGlsZHJlbiIsIlJlYWN0Tm9kZSIsImhlaWdodCIsIk1lc3NhZ2VSZXNwb25zZSIsInQwIiwiJCIsIl9jIiwiaXNNZXNzYWdlUmVzcG9uc2UiLCJNZXNzYWdlUmVzcG9uc2VDb250ZXh0IiwidDEiLCJTeW1ib2wiLCJmb3IiLCJ0MiIsInQzIiwiY29udGVudCIsInVuZGVmaW5lZCIsInQ0IiwiY3JlYXRlQ29udGV4dCIsIk1lc3NhZ2VSZXNwb25zZVByb3ZpZGVyIl0sInNvdXJjZXMiOlsiTWVzc2FnZVJlc3BvbnNlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgTm9TZWxlY3QsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBSYXRjaGV0IH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL1JhdGNoZXQuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbiAgaGVpZ2h0PzogbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBNZXNzYWdlUmVzcG9uc2UoeyBjaGlsZHJlbiwgaGVpZ2h0IH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaXNNZXNzYWdlUmVzcG9uc2UgPSB1c2VDb250ZXh0KE1lc3NhZ2VSZXNwb25zZUNvbnRleHQpXG4gIGlmIChpc01lc3NhZ2VSZXNwb25zZSkge1xuICAgIHJldHVybiBjaGlsZHJlblxuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSAoXG4gICAgPE1lc3NhZ2VSZXNwb25zZVByb3ZpZGVyPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgaGVpZ2h0PXtoZWlnaHR9IG92ZXJmbG93WT1cImhpZGRlblwiPlxuICAgICAgICA8Tm9TZWxlY3QgZnJvbUxlZnRFZGdlIGZsZXhTaHJpbms9ezB9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPnsnICAnfeKOvyAmbmJzcDs8L1RleHQ+XG4gICAgICAgIDwvTm9TZWxlY3Q+XG4gICAgICAgIDxCb3ggZmxleFNocmluaz17MX0gZmxleEdyb3c9ezF9PlxuICAgICAgICAgIHtjaGlsZHJlbn1cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0JveD5cbiAgICA8L01lc3NhZ2VSZXNwb25zZVByb3ZpZGVyPlxuICApXG4gIGlmIChoZWlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBjb250ZW50XG4gIH1cbiAgcmV0dXJuIDxSYXRjaGV0IGxvY2s9XCJvZmZzY3JlZW5cIj57Y29udGVudH08L1JhdGNoZXQ+XG59XG5cbi8vIFRoaXMgaXMgYSBjb250ZXh0IHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIG1lc3NhZ2UgcmVzcG9uc2Vcbi8vIGlzIHJlbmRlcmVkIGFzIGEgZGVzY2VuZGFudCBvZiBhbm90aGVyIE1lc3NhZ2VSZXNwb25zZS4gV2UgdXNlIGl0XG4vLyB0byBhdm9pZCByZW5kZXJpbmcgbmVzdGVkIOKOvyBjaGFyYWN0ZXJzLlxuY29uc3QgTWVzc2FnZVJlc3BvbnNlQ29udGV4dCA9IFJlYWN0LmNyZWF0ZUNvbnRleHQoZmFsc2UpXG5cbmZ1bmN0aW9uIE1lc3NhZ2VSZXNwb25zZVByb3ZpZGVyKHtcbiAgY2hpbGRyZW4sXG59OiB7XG4gIGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGVcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2VDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt0cnVlfT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L01lc3NhZ2VSZXNwb25zZUNvbnRleHQuUHJvdmlkZXI+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0Es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