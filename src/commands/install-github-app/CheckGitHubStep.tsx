// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// CheckGitHubStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CheckGitHubStep() {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<Text>Checking GitHub CLI installation…</Text>` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Text>Checking GitHub CLI installation…</Text>` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text>Checking GitHub CLI installation…</Text>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为命令处理这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJDaGVja0dpdEh1YlN0ZXAiLCIkIiwiX2MiLCJ0MCIsIlN5bWJvbCIsImZvciJdLCJzb3VyY2VzIjpbIkNoZWNrR2l0SHViU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIENoZWNrR2l0SHViU3RlcCgpIHtcbiAgcmV0dXJuIDxUZXh0PkNoZWNraW5nIEdpdEh1YiBDTEkgaW5zdGFsbGF0aW9u4oCmPC9UZXh0PlxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsSUFBSSxRQUFRLGNBQWM7QUFFbkMsT0FBTyxTQUFBQyxnQkFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUNFRixFQUFBLElBQUMsSUFBSSxDQUFDLGlDQUFpQyxFQUF0QyxJQUFJLENBQXlDO0lBQUFGLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FBOUNFLEVBQThDO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=