// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useShortcutDisplay，将 ../../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
// CompactBoundaryMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CompactBoundaryMessage() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // historyShortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const historyShortcut = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  // t0 暂存 `<Box marginY={1}><Text dimColor={true}>✻ Conversation com...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== historyShortcut) {
    // t0 暂存 `<Box marginY={1}><Text dimColor={true}>✻ Conversation com...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Box marginY={1}><Text dimColor={true}>✻ Conversation compacted ({historyShortcut} for history)</Text></Box>;
    // $[0] 缓存 `historyShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = historyShortcut;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJ1c2VTaG9ydGN1dERpc3BsYXkiLCJDb21wYWN0Qm91bmRhcnlNZXNzYWdlIiwiJCIsIl9jIiwiaGlzdG9yeVNob3J0Y3V0IiwidDAiXSwic291cmNlcyI6WyJDb21wYWN0Qm91bmRhcnlNZXNzYWdlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIENvbXBhY3RCb3VuZGFyeU1lc3NhZ2UoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaGlzdG9yeVNob3J0Y3V0ID0gdXNlU2hvcnRjdXREaXNwbGF5KFxuICAgICdhcHA6dG9nZ2xlVHJhbnNjcmlwdCcsXG4gICAgJ0dsb2JhbCcsXG4gICAgJ2N0cmwrbycsXG4gIClcblxuICByZXR1cm4gKFxuICAgIDxCb3ggbWFyZ2luWT17MX0+XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAg4py7IENvbnZlcnNhdGlvbiBjb21wYWN0ZWQgKHtoaXN0b3J5U2hvcnRjdXR9IGZvciBoaXN0b3J5KVxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0Msa0JBQWtCLFFBQVEseUNBQXlDO0FBRTVFLE9BQU8sU0FBQUMsdUJBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFDTCxNQUFBQyxlQUFBLEdBQXdCSixrQkFBa0IsQ0FDeEMsc0JBQXNCLEVBQ3RCLFFBQVEsRUFDUixRQUNGLENBQUM7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBRSxlQUFBO0lBR0NDLEVBQUEsSUFBQyxHQUFHLENBQVUsT0FBQyxDQUFELEdBQUMsQ0FDYixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsMEJBQ2NELGdCQUFjLENBQUUsYUFDN0MsRUFGQyxJQUFJLENBR1AsRUFKQyxHQUFHLENBSUU7SUFBQUYsQ0FBQSxNQUFBRSxlQUFBO0lBQUFGLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQUEsT0FKTkcsRUFJTTtBQUFBIiwiaWdub3JlTGlzdCI6W119