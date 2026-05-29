// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// PressEnterToContinue 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PressEnterToContinue() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<Text color="permission">Press <Text bold={true}>Enter</T...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Text color="permission">Press <Text bold={true}>Enter</T...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text color="permission">Press <Text bold={true}>Enter</Text> to continue…</Text>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJQcmVzc0VudGVyVG9Db250aW51ZSIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIl0sInNvdXJjZXMiOlsiUHJlc3NFbnRlclRvQ29udGludWUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uL2luay5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIFByZXNzRW50ZXJUb0NvbnRpbnVlKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPFRleHQgY29sb3I9XCJwZXJtaXNzaW9uXCI+XG4gICAgICBQcmVzcyA8VGV4dCBib2xkPkVudGVyPC9UZXh0PiB0byBjb250aW51ZeKAplxuICAgIDwvVGV4dD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxJQUFJLFFBQVEsV0FBVztBQUVoQyxPQUFPLFNBQUFDLHFCQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBRUhGLEVBQUEsSUFBQyxJQUFJLENBQU8sS0FBWSxDQUFaLFlBQVksQ0FBQyxNQUNqQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQUMsS0FBSyxFQUFmLElBQUksQ0FBa0IsYUFDL0IsRUFGQyxJQUFJLENBRUU7SUFBQUYsQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFBQSxPQUZQRSxFQUVPO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=