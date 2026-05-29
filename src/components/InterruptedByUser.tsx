// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// InterruptedByUser 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function InterruptedByUser() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<><Text dimColor={true}>Interrupted </Text>{false ? <Text...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<><Text dimColor={true}>Interrupted </Text>{false ? <Text...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <><Text dimColor={true}>Interrupted </Text>{false ? <Text dimColor={true}>· [ANT-ONLY] /issue to report a model issue</Text> : <Text dimColor={true}>· What should Claude do instead?</Text>}</>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJJbnRlcnJ1cHRlZEJ5VXNlciIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIl0sInNvdXJjZXMiOlsiSW50ZXJydXB0ZWRCeVVzZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uL2luay5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIEludGVycnVwdGVkQnlVc2VyKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPkludGVycnVwdGVkIDwvVGV4dD5cbiAgICAgIHtcImV4dGVybmFsXCIgPT09ICdhbnQnID8gKFxuICAgICAgICA8VGV4dCBkaW1Db2xvcj7CtyBbQU5ULU9OTFldIC9pc3N1ZSB0byByZXBvcnQgYSBtb2RlbCBpc3N1ZTwvVGV4dD5cbiAgICAgICkgOiAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPsK3IFdoYXQgc2hvdWxkIENsYXVkZSBkbyBpbnN0ZWFkPzwvVGV4dD5cbiAgICAgICl9XG4gICAgPC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsSUFBSSxRQUFRLFdBQVc7QUFFaEMsT0FBTyxTQUFBQyxrQkFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUVIRixFQUFBLEtBQ0UsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLFlBQVksRUFBMUIsSUFBSSxDQUNKLE1BQW9CLEdBQ25CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQywyQ0FBMkMsRUFBekQsSUFBSSxDQUdOLEdBREMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLGdDQUFnQyxFQUE5QyxJQUFJLENBQ1AsQ0FBQyxHQUNBO0lBQUFGLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FQSEUsRUFPRztBQUFBIiwiaWdub3JlTGlzdCI6W119