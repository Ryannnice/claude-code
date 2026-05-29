// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 复用 InterruptedByUser 终端界面组件，避免在这里重复拼装显示逻辑。
import { InterruptedByUser } from 'src/components/InterruptedByUser.js';
// 复用 MessageResponse 终端界面组件，避免在这里重复拼装显示逻辑。
import { MessageResponse } from 'src/components/MessageResponse.js';
// UserToolCanceledMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function UserToolCanceledMessage() {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkludGVycnVwdGVkQnlVc2VyIiwiTWVzc2FnZVJlc3BvbnNlIiwiVXNlclRvb2xDYW5jZWxlZE1lc3NhZ2UiLCIkIiwiX2MiLCJ0MCIsIlN5bWJvbCIsImZvciJdLCJzb3VyY2VzIjpbIlVzZXJUb29sQ2FuY2VsZWRNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEludGVycnVwdGVkQnlVc2VyIH0gZnJvbSAnc3JjL2NvbXBvbmVudHMvSW50ZXJydXB0ZWRCeVVzZXIuanMnXG5pbXBvcnQgeyBNZXNzYWdlUmVzcG9uc2UgfSBmcm9tICdzcmMvY29tcG9uZW50cy9NZXNzYWdlUmVzcG9uc2UuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBVc2VyVG9vbENhbmNlbGVkTWVzc2FnZSgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgIDxJbnRlcnJ1cHRlZEJ5VXNlciAvPlxuICAgIDwvTWVzc2FnZVJlc3BvbnNlPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLGlCQUFpQixRQUFRLHFDQUFxQztBQUN2RSxTQUFTQyxlQUFlLFFBQVEsbUNBQW1DO0FBRW5FLE9BQU8sU0FBQUMsd0JBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFFSEYsRUFBQSxJQUFDLGVBQWUsQ0FBUyxNQUFDLENBQUQsR0FBQyxDQUN4QixDQUFDLGlCQUFpQixHQUNwQixFQUZDLGVBQWUsQ0FFRTtJQUFBRixDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUFBLE9BRmxCRSxFQUVrQjtBQUFBIiwiaWdub3JlTGlzdCI6W119