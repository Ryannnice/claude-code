// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { KeybindingAction, KeybindingContextName } 来自 ../keybindings/types.js，用于校准终端渲染的数据契约。
import type { KeybindingAction, KeybindingContextName } from '../keybindings/types.js';
// 引入 useShortcutDisplay，将 ../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  /** The keybinding action (e.g., 'app:toggleTranscript') */
  action: KeybindingAction;
  /** The keybinding context (e.g., 'Global') */
  context: KeybindingContextName;
  /** Default shortcut if keybinding not configured */
  fallback: string;
  /** The action description text (e.g., 'expand') */
  description: string;
  /** Whether to wrap in parentheses */
  parens?: boolean;
  /** Whether to show in bold */
  bold?: boolean;
};

/**
 * KeyboardShortcutHint that displays the user-configured shortcut.
 * Falls back to default if keybinding context is not available.
 *
 * @example
 * <ConfigurableShortcutHint
 *   action="app:toggleTranscript"
 *   context="Global"
 *   fallback="ctrl+o"
 *   description="expand"
 * />
 */
// ConfigurableShortcutHint 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ConfigurableShortcutHint(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    action,
    context,
    fallback,
    description,
    parens,
    bold
  } = t0;
  // shortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const shortcut = useShortcutDisplay(action, context, fallback);
  // t1 暂存 `<KeyboardShortcutHint shortcut={shortcut} action={descrip...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== bold || $[1] !== description || $[2] !== parens || $[3] !== shortcut) {
    // t1 暂存 `<KeyboardShortcutHint shortcut={shortcut} action={descrip...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <KeyboardShortcutHint shortcut={shortcut} action={description} parens={parens} bold={bold} />;
    // $[0] 缓存 `bold`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = bold;
    // $[1] 缓存 `description`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = description;
    // $[2] 缓存 `parens`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = parens;
    // $[3] 缓存 `shortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = shortcut;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIktleWJpbmRpbmdBY3Rpb24iLCJLZXliaW5kaW5nQ29udGV4dE5hbWUiLCJ1c2VTaG9ydGN1dERpc3BsYXkiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIlByb3BzIiwiYWN0aW9uIiwiY29udGV4dCIsImZhbGxiYWNrIiwiZGVzY3JpcHRpb24iLCJwYXJlbnMiLCJib2xkIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwidDAiLCIkIiwiX2MiLCJzaG9ydGN1dCIsInQxIl0sInNvdXJjZXMiOlsiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHtcbiAgS2V5YmluZGluZ0FjdGlvbixcbiAgS2V5YmluZGluZ0NvbnRleHROYW1lLFxufSBmcm9tICcuLi9rZXliaW5kaW5ncy90eXBlcy5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICAvKiogVGhlIGtleWJpbmRpbmcgYWN0aW9uIChlLmcuLCAnYXBwOnRvZ2dsZVRyYW5zY3JpcHQnKSAqL1xuICBhY3Rpb246IEtleWJpbmRpbmdBY3Rpb25cbiAgLyoqIFRoZSBrZXliaW5kaW5nIGNvbnRleHQgKGUuZy4sICdHbG9iYWwnKSAqL1xuICBjb250ZXh0OiBLZXliaW5kaW5nQ29udGV4dE5hbWVcbiAgLyoqIERlZmF1bHQgc2hvcnRjdXQgaWYga2V5YmluZGluZyBub3QgY29uZmlndXJlZCAqL1xuICBmYWxsYmFjazogc3RyaW5nXG4gIC8qKiBUaGUgYWN0aW9uIGRlc2NyaXB0aW9uIHRleHQgKGUuZy4sICdleHBhbmQnKSAqL1xuICBkZXNjcmlwdGlvbjogc3RyaW5nXG4gIC8qKiBXaGV0aGVyIHRvIHdyYXAgaW4gcGFyZW50aGVzZXMgKi9cbiAgcGFyZW5zPzogYm9vbGVhblxuICAvKiogV2hldGhlciB0byBzaG93IGluIGJvbGQgKi9cbiAgYm9sZD86IGJvb2xlYW5cbn1cblxuLyoqXG4gKiBLZXlib2FyZFNob3J0Y3V0SGludCB0aGF0IGRpc3BsYXlzIHRoZSB1c2VyLWNvbmZpZ3VyZWQgc2hvcnRjdXQuXG4gKiBGYWxscyBiYWNrIHRvIGRlZmF1bHQgaWYga2V5YmluZGluZyBjb250ZXh0IGlzIG5vdCBhdmFpbGFibGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAqICAgYWN0aW9uPVwiYXBwOnRvZ2dsZVRyYW5zY3JpcHRcIlxuICogICBjb250ZXh0PVwiR2xvYmFsXCJcbiAqICAgZmFsbGJhY2s9XCJjdHJsK29cIlxuICogICBkZXNjcmlwdGlvbj1cImV4cGFuZFwiXG4gKiAvPlxuICovXG5leHBvcnQgZnVuY3Rpb24gQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50KHtcbiAgYWN0aW9uLFxuICBjb250ZXh0LFxuICBmYWxsYmFjayxcbiAgZGVzY3JpcHRpb24sXG4gIHBhcmVucyxcbiAgYm9sZCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc2hvcnRjdXQgPSB1c2VTaG9ydGN1dERpc3BsYXkoYWN0aW9uLCBjb250ZXh0LCBmYWxsYmFjaylcbiAgcmV0dXJuIChcbiAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnRcbiAgICAgIHNob3J0Y3V0PXtzaG9ydGN1dH1cbiAgICAgIGFjdGlvbj17ZGVzY3JpcHRpb259XG4gICAgICBwYXJlbnM9e3BhcmVuc31cbiAgICAgIGJvbGQ9e2JvbGR9XG4gICAgLz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixjQUNFQyxnQkFBZ0IsRUFDaEJDLHFCQUFxQixRQUNoQix5QkFBeUI7QUFDaEMsU0FBU0Msa0JBQWtCLFFBQVEsc0NBQXNDO0FBQ3pFLFNBQVNDLG9CQUFvQixRQUFRLHlDQUF5QztBQUU5RSxLQUFLQyxLQUFLLEdBQUc7RUFDWDtFQUNBQyxNQUFNLEVBQUVMLGdCQUFnQjtFQUN4QjtFQUNBTSxPQUFPLEVBQUVMLHFCQUFxQjtFQUM5QjtFQUNBTSxRQUFRLEVBQUUsTUFBTTtFQUNoQjtFQUNBQyxXQUFXLEVBQUUsTUFBTTtFQUNuQjtFQUNBQyxNQUFNLENBQUMsRUFBRSxPQUFPO0VBQ2hCO0VBQ0FDLElBQUksQ0FBQyxFQUFFLE9BQU87QUFDaEIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLHlCQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWtDO0lBQUFULE1BQUE7SUFBQUMsT0FBQTtJQUFBQyxRQUFBO0lBQUFDLFdBQUE7SUFBQUMsTUFBQTtJQUFBQztFQUFBLElBQUFFLEVBT2pDO0VBQ04sTUFBQUcsUUFBQSxHQUFpQmIsa0JBQWtCLENBQUNHLE1BQU0sRUFBRUMsT0FBTyxFQUFFQyxRQUFRLENBQUM7RUFBQSxJQUFBUyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBSCxJQUFBLElBQUFHLENBQUEsUUFBQUwsV0FBQSxJQUFBSyxDQUFBLFFBQUFKLE1BQUEsSUFBQUksQ0FBQSxRQUFBRSxRQUFBO0lBRTVEQyxFQUFBLElBQUMsb0JBQW9CLENBQ1RELFFBQVEsQ0FBUkEsU0FBTyxDQUFDLENBQ1ZQLE1BQVcsQ0FBWEEsWUFBVSxDQUFDLENBQ1hDLE1BQU0sQ0FBTkEsT0FBSyxDQUFDLENBQ1JDLElBQUksQ0FBSkEsS0FBRyxDQUFDLEdBQ1Y7SUFBQUcsQ0FBQSxNQUFBSCxJQUFBO0lBQUFHLENBQUEsTUFBQUwsV0FBQTtJQUFBSyxDQUFBLE1BQUFKLE1BQUE7SUFBQUksQ0FBQSxNQUFBRSxRQUFBO0lBQUFGLENBQUEsTUFBQUcsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUgsQ0FBQTtFQUFBO0VBQUEsT0FMRkcsRUFLRTtBQUFBIiwiaWdub3JlTGlzdCI6W119