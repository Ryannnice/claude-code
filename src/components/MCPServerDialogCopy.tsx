// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Link, Text } from '../ink.js';
// MCPServerDialogCopy 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPServerDialogCopy() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<Text>MCP servers may execute code or access system resou...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Text>MCP servers may execute code or access system resou...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text>MCP servers may execute code or access system resources. All tool calls require approval. Learn more in the{" "}<Link url="https://code.claude.com/docs/en/mcp">MCP documentation</Link>.</Text>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkxpbmsiLCJUZXh0IiwiTUNQU2VydmVyRGlhbG9nQ29weSIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIl0sInNvdXJjZXMiOlsiTUNQU2VydmVyRGlhbG9nQ29weS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTGluaywgVGV4dCB9IGZyb20gJy4uL2luay5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIE1DUFNlcnZlckRpYWxvZ0NvcHkoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8VGV4dD5cbiAgICAgIE1DUCBzZXJ2ZXJzIG1heSBleGVjdXRlIGNvZGUgb3IgYWNjZXNzIHN5c3RlbSByZXNvdXJjZXMuIEFsbCB0b29sIGNhbGxzXG4gICAgICByZXF1aXJlIGFwcHJvdmFsLiBMZWFybiBtb3JlIGluIHRoZXsnICd9XG4gICAgICA8TGluayB1cmw9XCJodHRwczovL2NvZGUuY2xhdWRlLmNvbS9kb2NzL2VuL21jcFwiPk1DUCBkb2N1bWVudGF0aW9uPC9MaW5rPi5cbiAgICA8L1RleHQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLElBQUksRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFFdEMsT0FBTyxTQUFBQyxvQkFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUVIRixFQUFBLElBQUMsSUFBSSxDQUFDLDJHQUVnQyxJQUFFLENBQ3RDLENBQUMsSUFBSSxDQUFLLEdBQXFDLENBQXJDLHFDQUFxQyxDQUFDLGlCQUFpQixFQUFoRSxJQUFJLENBQW1FLENBQzFFLEVBSkMsSUFBSSxDQUlFO0lBQUFGLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FKUEUsRUFJTztBQUFBIiwiaWdub3JlTGlzdCI6W119