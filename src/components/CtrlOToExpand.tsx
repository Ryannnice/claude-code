// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 React、useContext，将 react 中已经封装好的能力接到本文件流程里。
import React, { useContext } from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 引入 getShortcutDisplay，将 ../keybindings/shortcutFormat.js 中已经封装好的能力接到本文件流程里。
import { getShortcutDisplay } from '../keybindings/shortcutFormat.js';
// 引入 useShortcutDisplay，将 ../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 InVirtualListContext，将 ./messageActions.js 中已经封装好的能力接到本文件流程里。
import { InVirtualListContext } from './messageActions.js';

// Context to track if we're inside a sub agent
// Similar to MessageResponseContext, this helps us avoid showing
// too many "(ctrl+o to expand)" hints in sub agent output
// SubAgentContext构建`React.createContext`，供终端渲染后续处理使用。
const SubAgentContext = React.createContext(false);
// SubAgentProvider 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SubAgentProvider(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children
  } = t0;
  // t1 暂存 `<SubAgentContext.Provider value={true}>{children}</SubAge...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children) {
    // t1 暂存 `<SubAgentContext.Provider value={true}>{children}</SubAge...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <SubAgentContext.Provider value={true}>{children}</SubAgentContext.Provider>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
// CtrlOToExpand 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CtrlOToExpand() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(2);
  // isInSubAgent记录 `useContext` 是否成立，终端渲染随后按该结果分支。
  const isInSubAgent = useContext(SubAgentContext);
  // inVirtualList 集合保存`useContext`，供终端渲染后续处理使用。
  const inVirtualList = useContext(InVirtualListContext);
  // expandShortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const expandShortcut = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  // 只有 `isInSubAgent || inVirtualList` 满足时，终端渲染才执行该分支。
  if (isInSubAgent || inVirtualList) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t0 暂存 `<Text dimColor={true}><KeyboardShortcutHint shortcut={exp...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== expandShortcut) {
    // t0 暂存 `<Text dimColor={true}><KeyboardShortcutHint shortcut={exp...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text dimColor={true}><KeyboardShortcutHint shortcut={expandShortcut} action="expand" parens={true} /></Text>;
    // $[0] 缓存 `expandShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = expandShortcut;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// ctrlOToExpand 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ctrlOToExpand(): string {
  // shortcut读取`getShortcutDisplay`，供终端渲染后续处理使用。
  const shortcut = getShortcutDisplay('app:toggleTranscript', 'Global', 'ctrl+o');
  // 返回 `chalk.dim(`(${shortcut} to expand)`)`，作为终端渲染这次计算的结果。
  return chalk.dim(`(${shortcut} to expand)`);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlJlYWN0IiwidXNlQ29udGV4dCIsIlRleHQiLCJnZXRTaG9ydGN1dERpc3BsYXkiLCJ1c2VTaG9ydGN1dERpc3BsYXkiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIkluVmlydHVhbExpc3RDb250ZXh0IiwiU3ViQWdlbnRDb250ZXh0IiwiY3JlYXRlQ29udGV4dCIsIlN1YkFnZW50UHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsImNoaWxkcmVuIiwidDEiLCJDdHJsT1RvRXhwYW5kIiwiaXNJblN1YkFnZW50IiwiaW5WaXJ0dWFsTGlzdCIsImV4cGFuZFNob3J0Y3V0IiwiY3RybE9Ub0V4cGFuZCIsInNob3J0Y3V0IiwiZGltIl0sInNvdXJjZXMiOlsiQ3RybE9Ub0V4cGFuZC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyBnZXRTaG9ydGN1dERpc3BsYXkgfSBmcm9tICcuLi9rZXliaW5kaW5ncy9zaG9ydGN1dEZvcm1hdC5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgSW5WaXJ0dWFsTGlzdENvbnRleHQgfSBmcm9tICcuL21lc3NhZ2VBY3Rpb25zLmpzJ1xuXG4vLyBDb250ZXh0IHRvIHRyYWNrIGlmIHdlJ3JlIGluc2lkZSBhIHN1YiBhZ2VudFxuLy8gU2ltaWxhciB0byBNZXNzYWdlUmVzcG9uc2VDb250ZXh0LCB0aGlzIGhlbHBzIHVzIGF2b2lkIHNob3dpbmdcbi8vIHRvbyBtYW55IFwiKGN0cmwrbyB0byBleHBhbmQpXCIgaGludHMgaW4gc3ViIGFnZW50IG91dHB1dFxuY29uc3QgU3ViQWdlbnRDb250ZXh0ID0gUmVhY3QuY3JlYXRlQ29udGV4dChmYWxzZSlcblxuZXhwb3J0IGZ1bmN0aW9uIFN1YkFnZW50UHJvdmlkZXIoe1xuICBjaGlsZHJlbixcbn06IHtcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPFN1YkFnZW50Q29udGV4dC5Qcm92aWRlciB2YWx1ZT17dHJ1ZX0+e2NoaWxkcmVufTwvU3ViQWdlbnRDb250ZXh0LlByb3ZpZGVyPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDdHJsT1RvRXhwYW5kKCk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGlzSW5TdWJBZ2VudCA9IHVzZUNvbnRleHQoU3ViQWdlbnRDb250ZXh0KVxuICBjb25zdCBpblZpcnR1YWxMaXN0ID0gdXNlQ29udGV4dChJblZpcnR1YWxMaXN0Q29udGV4dClcbiAgY29uc3QgZXhwYW5kU2hvcnRjdXQgPSB1c2VTaG9ydGN1dERpc3BsYXkoXG4gICAgJ2FwcDp0b2dnbGVUcmFuc2NyaXB0JyxcbiAgICAnR2xvYmFsJyxcbiAgICAnY3RybCtvJyxcbiAgKVxuICBpZiAoaXNJblN1YkFnZW50IHx8IGluVmlydHVhbExpc3QpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiAoXG4gICAgPFRleHQgZGltQ29sb3I+XG4gICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9e2V4cGFuZFNob3J0Y3V0fSBhY3Rpb249XCJleHBhbmRcIiBwYXJlbnMgLz5cbiAgICA8L1RleHQ+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN0cmxPVG9FeHBhbmQoKTogc3RyaW5nIHtcbiAgY29uc3Qgc2hvcnRjdXQgPSBnZXRTaG9ydGN1dERpc3BsYXkoXG4gICAgJ2FwcDp0b2dnbGVUcmFuc2NyaXB0JyxcbiAgICAnR2xvYmFsJyxcbiAgICAnY3RybCtvJyxcbiAgKVxuICByZXR1cm4gY2hhbGsuZGltKGAoJHtzaG9ydGN1dH0gdG8gZXhwYW5kKWApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixPQUFPQyxLQUFLLElBQUlDLFVBQVUsUUFBUSxPQUFPO0FBQ3pDLFNBQVNDLElBQUksUUFBUSxXQUFXO0FBQ2hDLFNBQVNDLGtCQUFrQixRQUFRLGtDQUFrQztBQUNyRSxTQUFTQyxrQkFBa0IsUUFBUSxzQ0FBc0M7QUFDekUsU0FBU0Msb0JBQW9CLFFBQVEseUNBQXlDO0FBQzlFLFNBQVNDLG9CQUFvQixRQUFRLHFCQUFxQjs7QUFFMUQ7QUFDQTtBQUNBO0FBQ0EsTUFBTUMsZUFBZSxHQUFHUCxLQUFLLENBQUNRLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFFbEQsT0FBTyxTQUFBQyxpQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUEwQjtJQUFBQztFQUFBLElBQUFILEVBSWhDO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUUsUUFBQTtJQUVHQyxFQUFBLDZCQUFpQyxLQUFJLENBQUosS0FBRyxDQUFDLENBQUdELFNBQU8sQ0FBRSwyQkFBMkI7SUFBQUYsQ0FBQSxNQUFBRSxRQUFBO0lBQUFGLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQUEsT0FBNUVHLEVBQTRFO0FBQUE7QUFJaEYsT0FBTyxTQUFBQyxjQUFBO0VBQUEsTUFBQUosQ0FBQSxHQUFBQyxFQUFBO0VBQ0wsTUFBQUksWUFBQSxHQUFxQmYsVUFBVSxDQUFDTSxlQUFlLENBQUM7RUFDaEQsTUFBQVUsYUFBQSxHQUFzQmhCLFVBQVUsQ0FBQ0ssb0JBQW9CLENBQUM7RUFDdEQsTUFBQVksY0FBQSxHQUF1QmQsa0JBQWtCLENBQ3ZDLHNCQUFzQixFQUN0QixRQUFRLEVBQ1IsUUFDRixDQUFDO0VBQ0QsSUFBSVksWUFBNkIsSUFBN0JDLGFBQTZCO0lBQUEsT0FDeEIsSUFBSTtFQUFBO0VBQ1osSUFBQVAsRUFBQTtFQUFBLElBQUFDLENBQUEsUUFBQU8sY0FBQTtJQUVDUixFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLG9CQUFvQixDQUFXUSxRQUFjLENBQWRBLGVBQWEsQ0FBQyxDQUFTLE1BQVEsQ0FBUixRQUFRLENBQUMsTUFBTSxDQUFOLEtBQUssQ0FBQyxHQUN4RSxFQUZDLElBQUksQ0FFRTtJQUFBUCxDQUFBLE1BQUFPLGNBQUE7SUFBQVAsQ0FBQSxNQUFBRCxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBQyxDQUFBO0VBQUE7RUFBQSxPQUZQRCxFQUVPO0FBQUE7QUFJWCxPQUFPLFNBQVNTLGFBQWFBLENBQUEsQ0FBRSxFQUFFLE1BQU0sQ0FBQztFQUN0QyxNQUFNQyxRQUFRLEdBQUdqQixrQkFBa0IsQ0FDakMsc0JBQXNCLEVBQ3RCLFFBQVEsRUFDUixRQUNGLENBQUM7RUFDRCxPQUFPSixLQUFLLENBQUNzQixHQUFHLENBQUMsSUFBSUQsUUFBUSxhQUFhLENBQUM7QUFDN0MiLCJpZ25vcmVMaXN0IjpbXX0=