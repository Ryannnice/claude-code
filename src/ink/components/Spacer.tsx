// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box，将 ./Box.js 中已经封装好的能力接到本文件流程里。
import Box from './Box.js';

/**
 * A flexible space that expands along the major axis of its containing layout.
 * It's useful as a shortcut for filling all the available spaces between elements.
 */
// 终端 UI 组件 Spacer在这里处理 `export default function Spacer() {`，完成这一小步状态转换。
export default function Spacer() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<Box flexGrow={1} />` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Box flexGrow={1} />` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Box flexGrow={1} />;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlNwYWNlciIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIl0sInNvdXJjZXMiOlsiU3BhY2VyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgQm94IGZyb20gJy4vQm94LmpzJ1xuXG4vKipcbiAqIEEgZmxleGlibGUgc3BhY2UgdGhhdCBleHBhbmRzIGFsb25nIHRoZSBtYWpvciBheGlzIG9mIGl0cyBjb250YWluaW5nIGxheW91dC5cbiAqIEl0J3MgdXNlZnVsIGFzIGEgc2hvcnRjdXQgZm9yIGZpbGxpbmcgYWxsIHRoZSBhdmFpbGFibGUgc3BhY2VzIGJldHdlZW4gZWxlbWVudHMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNwYWNlcigpIHtcbiAgcmV0dXJuIDxCb3ggZmxleEdyb3c9ezF9IC8+XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixPQUFPQyxHQUFHLE1BQU0sVUFBVTs7QUFFMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLFNBQUFDLE9BQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFDTkYsRUFBQSxJQUFDLEdBQUcsQ0FBVyxRQUFDLENBQUQsR0FBQyxHQUFJO0lBQUFGLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FBcEJFLEVBQW9CO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=