// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename } from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useIdeConnectionStatus，将 ../hooks/useIdeConnectionStatus.js 中已经封装好的能力接到本文件流程里。
import { useIdeConnectionStatus } from '../hooks/useIdeConnectionStatus.js';
// 类型依赖 { IDESelection } 来自 ../hooks/useIdeSelection.js，用于校准终端渲染的数据契约。
import type { IDESelection } from '../hooks/useIdeSelection.js';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 类型依赖 { MCPServerConnection } 来自 ../services/mcp/types.js，用于校准终端渲染的数据契约。
import type { MCPServerConnection } from '../services/mcp/types.js';
// IdeStatusIndicatorProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type IdeStatusIndicatorProps = {
  ideSelection: IDESelection | undefined;
  mcpClients?: MCPServerConnection[];
};
// IdeStatusIndicator 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function IdeStatusIndicator(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ideSelection,
    mcpClients
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    status: ideStatus
  } = useIdeConnectionStatus(mcpClients);
  // shouldShowIdeSelection标记终端 UI Ide Status Indicator是否启用对应路径。
  const shouldShowIdeSelection = ideStatus === "connected" && (ideSelection?.filePath || ideSelection?.text && ideSelection.lineCount > 0);
  // 只有 `ideStatus === null || !shouldShowIdeSelection ||` 满足时，终端渲染才执行该分支。
  if (ideStatus === null || !shouldShowIdeSelection || !ideSelection) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `ideSelection.text && ideSelection.lineCount > 0` 满足时，终端渲染才执行该分支。
  if (ideSelection.text && ideSelection.lineCount > 0) {
    // t1标记终端 UI Ide Status Indicator是否启用对应路径。
    const t1 = ideSelection.lineCount === 1 ? "line" : "lines";
    // t2 暂存 `<Text color="ide" key="selection-indicator" wrap="truncat...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== ideSelection.lineCount || $[1] !== t1) {
      // t2 暂存 `<Text color="ide" key="selection-indicator" wrap="truncat...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text color="ide" key="selection-indicator" wrap="truncate">⧉ {ideSelection.lineCount}{" "}{t1} selected</Text>;
      // $[0] 缓存 `ideSelection.lineCount`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = ideSelection.lineCount;
      // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = t1;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 满足 `ideSelection.filePath` 时，终端渲染执行该分支。
  if (ideSelection.filePath) {
    // t1 暂存 `basename(ideSelection.filePath)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== ideSelection.filePath) {
      // t1 暂存 `basename(ideSelection.filePath)` 生成的渲染片段，后续返回路径直接复用。
      t1 = basename(ideSelection.filePath);
      // $[3] 缓存 `ideSelection.filePath`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = ideSelection.filePath;
      // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[4];
    }
    // t2 暂存 `<Text color="ide" key="selection-indicator" wrap="truncat...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== t1) {
      // t2 暂存 `<Text color="ide" key="selection-indicator" wrap="truncat...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Text color="ide" key="selection-indicator" wrap="truncate">⧉ In {t1}</Text>;
      // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = t1;
      // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[6];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsIlJlYWN0IiwidXNlSWRlQ29ubmVjdGlvblN0YXR1cyIsIklERVNlbGVjdGlvbiIsIlRleHQiLCJNQ1BTZXJ2ZXJDb25uZWN0aW9uIiwiSWRlU3RhdHVzSW5kaWNhdG9yUHJvcHMiLCJpZGVTZWxlY3Rpb24iLCJtY3BDbGllbnRzIiwiSWRlU3RhdHVzSW5kaWNhdG9yIiwidDAiLCIkIiwiX2MiLCJzdGF0dXMiLCJpZGVTdGF0dXMiLCJzaG91bGRTaG93SWRlU2VsZWN0aW9uIiwiZmlsZVBhdGgiLCJ0ZXh0IiwibGluZUNvdW50IiwidDEiLCJ0MiJdLCJzb3VyY2VzIjpbIklkZVN0YXR1c0luZGljYXRvci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYmFzZW5hbWUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VJZGVDb25uZWN0aW9uU3RhdHVzIH0gZnJvbSAnLi4vaG9va3MvdXNlSWRlQ29ubmVjdGlvblN0YXR1cy5qcydcbmltcG9ydCB0eXBlIHsgSURFU2VsZWN0aW9uIH0gZnJvbSAnLi4vaG9va3MvdXNlSWRlU2VsZWN0aW9uLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgTUNQU2VydmVyQ29ubmVjdGlvbiB9IGZyb20gJy4uL3NlcnZpY2VzL21jcC90eXBlcy5qcydcblxudHlwZSBJZGVTdGF0dXNJbmRpY2F0b3JQcm9wcyA9IHtcbiAgaWRlU2VsZWN0aW9uOiBJREVTZWxlY3Rpb24gfCB1bmRlZmluZWRcbiAgbWNwQ2xpZW50cz86IE1DUFNlcnZlckNvbm5lY3Rpb25bXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gSWRlU3RhdHVzSW5kaWNhdG9yKHtcbiAgaWRlU2VsZWN0aW9uLFxuICBtY3BDbGllbnRzLFxufTogSWRlU3RhdHVzSW5kaWNhdG9yUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IHN0YXR1czogaWRlU3RhdHVzIH0gPSB1c2VJZGVDb25uZWN0aW9uU3RhdHVzKG1jcENsaWVudHMpXG5cbiAgLy8gQ2hlY2sgaWYgd2Ugc2hvdWxkIHNob3cgdGhlIElERSBzZWxlY3Rpb24gaW5kaWNhdG9yXG4gIGNvbnN0IHNob3VsZFNob3dJZGVTZWxlY3Rpb24gPVxuICAgIGlkZVN0YXR1cyA9PT0gJ2Nvbm5lY3RlZCcgJiZcbiAgICAoaWRlU2VsZWN0aW9uPy5maWxlUGF0aCB8fFxuICAgICAgKGlkZVNlbGVjdGlvbj8udGV4dCAmJiBpZGVTZWxlY3Rpb24ubGluZUNvdW50ID4gMCkpXG5cbiAgaWYgKGlkZVN0YXR1cyA9PT0gbnVsbCB8fCAhc2hvdWxkU2hvd0lkZVNlbGVjdGlvbiB8fCAhaWRlU2VsZWN0aW9uKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmIChpZGVTZWxlY3Rpb24udGV4dCAmJiBpZGVTZWxlY3Rpb24ubGluZUNvdW50ID4gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8VGV4dCBjb2xvcj1cImlkZVwiIGtleT1cInNlbGVjdGlvbi1pbmRpY2F0b3JcIiB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAg4qeJIHtpZGVTZWxlY3Rpb24ubGluZUNvdW50fXsnICd9XG4gICAgICAgIHtpZGVTZWxlY3Rpb24ubGluZUNvdW50ID09PSAxID8gJ2xpbmUnIDogJ2xpbmVzJ30gc2VsZWN0ZWRcbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH1cblxuICBpZiAoaWRlU2VsZWN0aW9uLmZpbGVQYXRoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxUZXh0IGNvbG9yPVwiaWRlXCIga2V5PVwic2VsZWN0aW9uLWluZGljYXRvclwiIHdyYXA9XCJ0cnVuY2F0ZVwiPlxuICAgICAgICDip4kgSW4ge2Jhc2VuYW1lKGlkZVNlbGVjdGlvbi5maWxlUGF0aCl9XG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxRQUFRLFFBQVEs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