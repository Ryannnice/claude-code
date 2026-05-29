// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 接入 extractMcpToolDisplayName、getMcpDisplayName 服务层能力，把外部通信或共享状态交给 ../../services/mcp/mcpStringUtils.js 处理。
import { extractMcpToolDisplayName, getMcpDisplayName } from '../../services/mcp/mcpStringUtils.js';
// 接入 filterToolsByServer 服务层能力，把外部通信或共享状态交给 ../../services/mcp/utils.js 处理。
import { filterToolsByServer } from '../../services/mcp/utils.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 类型依赖 { Tool } 来自 ../../Tool.js，用于校准终端渲染的数据契约。
import type { Tool } from '../../Tool.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 引入 ConfigurableShortcutHint，将 ../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
// 引入 Select，将 ../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/index.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
// 类型依赖 { ServerInfo } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { ServerInfo } from './types.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  server: ServerInfo;
  // 这个回调绑定到 onSelectTool: (tool: Tool, index: number) => void;，负责终端渲染在该局部场景下的响应。
  onSelectTool: (tool: Tool, index: number) => void;
  // 这个回调绑定到 onBack: () => void;，负责终端渲染在该局部场景下的响应。
  onBack: () => void;
};
// MCPToolListView 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPToolListView(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(21);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    server,
    onSelectTool,
    onBack
  } = t0;
  // mcpTools 集合保存`useAppState`，供终端渲染后续处理使用。
  const mcpTools = useAppState(_temp);
  // t1 暂存 `t2` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // MCP 界面组件 MCPTool List View在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // `server.client.type` 与 `"connected"` 不一致时刷新派生状态，避免使用过期结果。
    if (server.client.type !== "connected") {
      // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
        t2 = [];
        // $[0] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[0] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[0];
      }
      // t1 暂存 `t2` 生成的渲染片段，后续返回路径直接复用。
      t1 = t2;
      // 结束这个分支或循环，避免终端渲染继续落入后续路径。
      break bb0;
    }
    // t2 暂存 `filterToolsByServer(mcpTools, server.name)` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== mcpTools || $[2] !== server.name) {
      // t2 暂存 `filterToolsByServer(mcpTools, server.name)` 生成的渲染片段，后续返回路径直接复用。
      t2 = filterToolsByServer(mcpTools, server.name);
      // $[1] 缓存 `mcpTools`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = mcpTools;
      // $[2] 缓存 `server.name`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = server.name;
      // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[3];
    }
    // t1 暂存 `t2` 生成的渲染片段，后续返回路径直接复用。
    t1 = t2;
  }
  // serverTools 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const serverTools = t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== server.name || $[5] !== serverTools) {
    // t3 暂存 `(tool, index) => {` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[7] !== server.name) {
      // t3 暂存 `(tool, index) => {` 生成的渲染片段，后续返回路径直接复用。
      t3 = (tool, index) => {
        // toolName读取`getMcpDisplayName`，供终端渲染后续处理使用。
        const toolName = getMcpDisplayName(tool.name, server.name);
        // fullDisplayName保存`tool.userFacingName`，供终端渲染后续处理使用。
        const fullDisplayName = tool.userFacingName ? tool.userFacingName({}) : toolName;
        // displayName保存`extractMcpToolDisplayName`，供终端渲染后续处理使用。
        const displayName = extractMcpToolDisplayName(fullDisplayName);
        // isReadOnly标记终端渲染MCP 界面组件 MCPTool List View是否启用对应路径。
        const isReadOnly = tool.isReadOnly?.({}) ?? false;
        // isDestructive标记终端渲染MCP 界面组件 MCPTool List View是否启用对应路径。
        const isDestructive = tool.isDestructive?.({}) ?? false;
        // isOpenWorld标记终端渲染MCP 界面组件 MCPTool List View是否启用对应路径。
        const isOpenWorld = tool.isOpenWorld?.({}) ?? false;
        // annotations 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
        const annotations = [];
        // 满足 `isReadOnly` 时，终端渲染执行该分支。
        if (isReadOnly) {
          // annotations 集合追加新条目，保持收集顺序与输入顺序一致。
          annotations.push("read-only");
        }
        // 满足 `isDestructive` 时，终端渲染执行该分支。
        if (isDestructive) {
          // annotations 集合追加新条目，保持收集顺序与输入顺序一致。
          annotations.push("destructive");
        }
        // 满足 `isOpenWorld` 时，终端渲染执行该分支。
        if (isOpenWorld) {
          // annotations 集合追加新条目，保持收集顺序与输入顺序一致。
          annotations.push("open-world");
        }
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          label: displayName,
          value: index.toString(),
          description: annotations.length > 0 ? annotations.join(", ") : undefined,
          descriptionColor: isDestructive ? "error" : isReadOnly ? "success" : undefined
        };
      };
      // $[7] 缓存 `server.name`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = server.name;
      // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[8];
    }
    // t2 暂存 `serverTools.map(t3)` 生成的渲染片段，后续返回路径直接复用。
    t2 = serverTools.map(t3);
    // $[4] 缓存 `server.name`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = server.name;
    // $[5] 缓存 `serverTools`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = serverTools;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // toolOptions 集合 命名 `t2`，让后续代码直接表达这个值的用途。
  const toolOptions = t2;
  // 临时值 t3 命名 ``Tools for ${server.name}``，让后续代码直接表达这个值的用途。
  const t3 = `Tools for ${server.name}`;
  // t4保存 `serverTools.length` 的判断结果，供终端渲染MCP 界面组件 MCPTool List View后续分支直接复用。
  const t4 = serverTools.length;
  // t5 暂存 `plural(serverTools.length, "tool")` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== serverTools.length) {
    // t5 暂存 `plural(serverTools.length, "tool")` 生成的渲染片段，后续返回路径直接复用。
    t5 = plural(serverTools.length, "tool");
    // $[9] 缓存 `serverTools.length`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = serverTools.length;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6固定为 ``${t4} ${t5}``，作为终端渲染MCP 界面组件 MCPTool List View后续展示或比较的基准。
  const t6 = `${t4} ${t5}`;
  // t7 暂存 `serverTools.length === 0 ? <Text dimColor={true}>No tools...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onBack || $[12] !== onSelectTool || $[13] !== serverTools || $[14] !== toolOptions) {
    // t7 暂存 `serverTools.length === 0 ? <Text dimColor={true}>No tools...` 生成的渲染片段，后续返回路径直接复用。
    t7 = serverTools.length === 0 ? <Text dimColor={true}>No tools available</Text> : <Select options={toolOptions} onChange={value => {
      // index_0 索引解析`parseInt`，供终端渲染后续处理使用。
      const index_0 = parseInt(value);
      // tool_0保存`serverTools[index_0]`，供终端渲染MCP 界面组件 MCPTool List View后续判断或输出使用。
      const tool_0 = serverTools[index_0];
      // 满足 `tool_0` 时，终端渲染执行该分支。
      if (tool_0) {
        // 调用 onSelectTool，触发终端渲染此处需要的副作用。
        onSelectTool(tool_0, index_0);
      }
    }} onCancel={onBack} />;
    // $[11] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onBack;
    // $[12] 缓存 `onSelectTool`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onSelectTool;
    // $[13] 缓存 `serverTools`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = serverTools;
    // $[14] 缓存 `toolOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = toolOptions;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Dialog title={t3} subtitle={t6} onCancel={onBack} inputG...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onBack || $[17] !== t3 || $[18] !== t6 || $[19] !== t7) {
    // t8 暂存 `<Dialog title={t3} subtitle={t6} onCancel={onBack} inputG...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Dialog title={t3} subtitle={t6} onCancel={onBack} inputGuide={_temp2}>{t7}</Dialog>;
    // $[16] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onBack;
    // $[17] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t3;
    // $[18] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t6;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp2 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(exitState) {
  // 返回 `exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text...`，作为终端渲染这次计算的结果。
  return exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="back" /></Byline>;
}
// _temp 封装MCP 界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.mcp.tools`，作为终端渲染这次计算的结果。
  return s.mcp.tools;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJleHRyYWN0TWNwVG9vbERpc3BsYXlOYW1lIiwiZ2V0TWNwRGlzcGxheU5hbWUiLCJmaWx0ZXJUb29sc0J5U2VydmVyIiwidXNlQXBwU3RhdGUiLCJUb29sIiwicGx1cmFsIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiU2VsZWN0IiwiQnlsaW5lIiwiRGlhbG9nIiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJTZXJ2ZXJJbmZvIiwiUHJvcHMiLCJzZXJ2ZXIiLCJvblNlbGVjdFRvb2wiLCJ0b29sIiwiaW5kZXgiLCJvbkJhY2siLCJNQ1BUb29sTGlzdFZpZXciLCJ0MCIsIiQiLCJfYyIsIm1jcFRvb2xzIiwiX3RlbXAiLCJ0MSIsImJiMCIsImNsaWVudCIsInR5cGUiLCJ0MiIsIlN5bWJvbCIsImZvciIsIm5hbWUiLCJzZXJ2ZXJUb29scyIsInQzIiwidG9vbE5hbWUiLCJmdWxsRGlzcGxheU5hbWUiLCJ1c2VyRmFjaW5nTmFtZSIsImRpc3BsYXlOYW1lIiwiaXNSZWFkT25seSIsImlzRGVzdHJ1Y3RpdmUiLCJpc09wZW5Xb3JsZCIsImFubm90YXRpb25zIiwicHVzaCIsImxhYmVsIiwidmFsdWUiLCJ0b1N0cmluZyIsImRlc2NyaXB0aW9uIiwibGVuZ3RoIiwiam9pbiIsInVuZGVmaW5lZCIsImRlc2NyaXB0aW9uQ29sb3IiLCJtYXAiLCJ0b29sT3B0aW9ucyIsInQ0IiwidDUiLCJ0NiIsInQ3IiwiaW5kZXhfMCIsInBhcnNlSW50IiwidG9vbF8wIiwidDgiLCJfdGVtcDIiLCJleGl0U3RhdGUiLCJwZW5kaW5nIiwia2V5TmFtZSIsInMiLCJtY3AiLCJ0b29scyJdLCJzb3VyY2VzIjpbIk1DUFRvb2xMaXN0Vmlldy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7XG4gIGV4dHJhY3RNY3BUb29sRGlzcGxheU5hbWUsXG4gIGdldE1jcERpc3BsYXlOYW1lLFxufSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvbWNwU3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgeyBmaWx0ZXJUb29sc0J5U2VydmVyIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvbWNwL3V0aWxzLmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgVG9vbCB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBwbHVyYWwgfSBmcm9tICcuLi8uLi91dGlscy9zdHJpbmdVdGlscy5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4uL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgdHlwZSB7IFNlcnZlckluZm8gfSBmcm9tICcuL3R5cGVzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzZXJ2ZXI6IFNlcnZlckluZm9cbiAgb25TZWxlY3RUb29sOiAodG9vbDogVG9vbCwgaW5kZXg6IG51bWJlcikgPT4gdm9pZFxuICBvbkJhY2s6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1DUFRvb2xMaXN0Vmlldyh7XG4gIHNlcnZlcixcbiAgb25TZWxlY3RUb29sLFxuICBvbkJhY2ssXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IG1jcFRvb2xzID0gdXNlQXBwU3RhdGUocyA9PiBzLm1jcC50b29scylcblxuICBjb25zdCBzZXJ2ZXJUb29scyA9IFJlYWN0LnVzZU1lbW8oKCkgPT4ge1xuICAgIGlmIChzZXJ2ZXIuY2xpZW50LnR5cGUgIT09ICdjb25uZWN0ZWQnKSByZXR1cm4gW11cbiAgICByZXR1cm4gZmlsdGVyVG9vbHNCeVNlcnZlcihtY3BUb29scywgc2VydmVyLm5hbWUpXG4gIH0sIFtzZXJ2ZXIsIG1jcFRvb2xzXSlcblxuICBjb25zdCB0b29sT3B0aW9ucyA9IHNlcnZlclRvb2xzLm1hcCgodG9vbCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCB0b29sTmFtZSA9IGdldE1jcERpc3BsYXlOYW1lKHRvb2wubmFtZSwgc2VydmVyLm5hbWUpXG4gICAgY29uc3QgZnVsbERpc3BsYXlOYW1lID0gdG9vbC51c2VyRmFjaW5nTmFtZVxuICAgICAgPyB0b29sLnVzZXJGYWNpbmdOYW1lKHt9KVxuICAgICAgOiB0b29sTmFtZVxuICAgIC8vIEV4dHJhY3QganVzdCB0aGUgdG9vbCBkaXNwbGF5IG5hbWUgd2l0aG91dCBzZXJ2ZXIgcHJlZml4XG4gICAgY29uc3QgZGlzcGxheU5hbWUgPSBleHRyYWN0TWNwVG9vbERpc3BsYXlOYW1lKGZ1bGxEaXNwbGF5TmFtZSlcblxuICAgIGNvbnN0IGlzUmVhZE9ubHkgPSB0b29sLmlzUmVhZE9ubHk/Lih7fSkgPz8gZmFsc2VcbiAgICBjb25zdCBpc0Rlc3RydWN0aXZlID0gdG9vbC5pc0Rlc3RydWN0aXZlPy4oe30pID8/IGZhbHNlXG4gICAgY29uc3QgaXNPcGVuV29ybGQgPSB0b29sLmlzT3BlbldvcmxkPy4oe30pID8/IGZhbHNlXG5cbiAgICBjb25zdCBhbm5vdGF0aW9ucyA9IFtdXG4gICAgaWYgKGlzUmVhZE9ubHkpIGFubm90YXRpb25zLnB1c2goJ3JlYWQtb25seScpXG4gICAgaWYgKGlzRGVzdHJ1Y3RpdmUpIGFubm90YXRpb25zLnB1c2goJ2Rlc3RydWN0aXZlJylcbiAgICBpZiAoaXNPcGVuV29ybGQpIGFubm90YXRpb25zLnB1c2goJ29wZW4td29ybGQnKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxhYmVsOiBkaXNwbGF5TmFtZSxcbiAgICAgIHZhbHVlOiBpbmRleC50b1N0cmluZygpLFxuICAgICAgZGVzY3JpcHRpb246IGFubm90YXRpb25zLmxlbmd0aCA+IDAgPyBhbm5vdGF0aW9ucy5qb2luKCcsICcpIDogdW5kZWZpbmVkLFxuICAgICAgZGVzY3JpcHRpb25Db2xvcjogaXNEZXN0cnVjdGl2ZVxuICAgICAgICA/ICdlcnJvcidcbiAgICAgICAgOiBpc1JlYWRPbmx5XG4gICAgICAgICAgPyAnc3VjY2VzcydcbiAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT17YFRvb2xzIGZvciAke3NlcnZlci5uYW1lfWB9XG4gICAgICBzdWJ0aXRsZT17YCR7c2VydmVyVG9vbHMubGVuZ3RofSAke3BsdXJhbChzZXJ2ZXJUb29scy5sZW5ndGgsICd0b29sJyl9YH1cbiAgICAgIG9uQ2FuY2VsPXtvbkJhY2t9XG4gICAgICBpbnB1dEd1aWRlPXtleGl0U3RhdGUgPT5cbiAgICAgICAgZXhpdFN0YXRlLnBlbmRpbmcgPyAoXG4gICAgICAgICAgPFRleHQ+UHJlc3Mge2V4aXRTdGF0ZS5rZXlOYW1lfSBhZ2FpbiB0byBleGl0PC9UZXh0PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCLihpHihpNcIiBhY3Rpb249XCJuYXZpZ2F0ZVwiIC8+XG4gICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFbnRlclwiIGFjdGlvbj1cInNlbGVjdFwiIC8+XG4gICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cImJhY2tcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgKVxuICAgICAgfVxuICAgID5cbiAgICAgIHtzZXJ2ZXJUb29scy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPk5vIHRvb2xzIGF2YWlsYWJsZTwvVGV4dD5cbiAgICAgICkgOiAoXG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXt0b29sT3B0aW9uc31cbiAgICAgICAgICBvbkNoYW5nZT17dmFsdWUgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwYXJzZUludCh2YWx1ZSlcbiAgICAgICAgICAgIGNvbnN0IHRvb2wgPSBzZXJ2ZXJUb29sc1tpbmRleF1cbiAgICAgICAgICAgIGlmICh0b29sKSB7XG4gICAgICAgICAgICAgIG9uU2VsZWN0VG9vbCh0b29sLCBpbmRleClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uQ2FuY2VsPXtvbkJhY2t9XG4gICAgICAgIC8+XG4gICAgICApfVxuICAgIDwvRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUNFQyx5QkFBeUIsRUFDekJDLGlCQUFpQixRQUNaLHNDQUFzQztBQUM3QyxTQUFTQyxtQkFBbUIsUUFBUSw2QkFBNkI7QUFDakUsU0FBU0MsV0FBVyxRQUFRLHlCQUF5QjtBQUNyRCxjQUFjQyxJQUFJLFFBQVEsZUFBZTtBQUN6QyxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBQ25ELFNBQVNDLHdCQUF3QixRQUFRLGdDQUFnQztBQUN6RSxTQUFTQyxNQUFNLFFBQVEsMEJBQTBCO0FB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