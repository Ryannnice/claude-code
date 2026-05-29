// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 InterruptedByUser，将 ./InterruptedByUser.js 中已经封装好的能力接到本文件流程里。
import { InterruptedByUser } from './InterruptedByUser.js';
// 引入 MessageResponse，将 ./MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from './MessageResponse.js';
// FallbackToolUseRejectedMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FallbackToolUseRejectedMessage() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<MessageResponse height={1}><InterruptedByUser /></Messag...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <MessageResponse height={1}><InterruptedByUser /></MessageResponse>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkludGVycnVwdGVkQnlVc2VyIiwiTWVzc2FnZVJlc3BvbnNlIiwiRmFsbGJhY2tUb29sVXNlUmVqZWN0ZWRNZXNzYWdlIiwiJCIsIl9jIiwidDAiLCJTeW1ib2wiLCJmb3IiXSwic291cmNlcyI6WyJGYWxsYmFja1Rvb2xVc2VSZWplY3RlZE1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgSW50ZXJydXB0ZWRCeVVzZXIgfSBmcm9tICcuL0ludGVycnVwdGVkQnlVc2VyLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi9NZXNzYWdlUmVzcG9uc2UuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBGYWxsYmFja1Rvb2xVc2VSZWplY3RlZE1lc3NhZ2UoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICA8SW50ZXJydXB0ZWRCeVVzZXIgLz5cbiAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxpQkFBaUIsUUFBUSx3QkFBd0I7QUFDMUQsU0FBU0MsZUFBZSxRQUFRLHNCQUFzQjtBQUV0RCxPQUFPLFNBQUFDLCtCQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBRUhGLEVBQUEsSUFBQyxlQUFlLENBQVMsTUFBQyxDQUFELEdBQUMsQ0FDeEIsQ0FBQyxpQkFBaUIsR0FDcEIsRUFGQyxlQUFlLENBRUU7SUFBQUYsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxPQUZsQkUsRUFFa0I7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==