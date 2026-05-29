// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  teamsSelected: boolean;
  showHint: boolean;
};

/**
 * Footer status indicator showing teammate count
 * Similar to BackgroundTaskStatus but for teammates
 */
// TeamStatus 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeamStatus(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    teamsSelected,
    showHint
  } = t0;
  // teamContext保存`useAppState`，供终端渲染后续处理使用。
  const teamContext = useAppState(_temp);
  // t1 暂存 `teamContext ? Object.values(teamContext.teammates).filter...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== teamContext) {
    // t1 暂存 `teamContext ? Object.values(teamContext.teammates).filter...` 生成的渲染片段，后续返回路径直接复用。
    t1 = teamContext ? Object.values(teamContext.teammates).filter(_temp2).length : 0;
    // $[0] 缓存 `teamContext`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = teamContext;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // totalTeammates 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const totalTeammates = t1;
  // 满足 `totalTeammates === 0` 时，终端渲染执行该分支。
  if (totalTeammates === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t2 暂存 `showHint && teamsSelected ? <><Text dimColor={true}>· </T...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== showHint || $[3] !== teamsSelected) {
    // t2 暂存 `showHint && teamsSelected ? <><Text dimColor={true}>· </T...` 生成的渲染片段，后续返回路径直接复用。
    t2 = showHint && teamsSelected ? <><Text dimColor={true}>· </Text><Text dimColor={true}>Enter to view</Text></> : null;
    // $[2] 缓存 `showHint`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = showHint;
    // $[3] 缓存 `teamsSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = teamsSelected;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // hint 命名 `t2`，让后续代码直接表达这个值的用途。
  const hint = t2;
  // statusText标记终端 UI Team Status是否启用对应路径。
  const statusText = `${totalTeammates} ${totalTeammates === 1 ? "teammate" : "teammates"}`;
  // t3保存`teamsSelected ? "selected" : "normal"`，供终端 UI Team Status后续判断或输出使用。
  const t3 = teamsSelected ? "selected" : "normal";
  // t4 暂存 `<Text key={t3} color="background" inverse={teamsSelected}...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== statusText || $[6] !== t3 || $[7] !== teamsSelected) {
    // t4 暂存 `<Text key={t3} color="background" inverse={teamsSelected}...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text key={t3} color="background" inverse={teamsSelected}>{statusText}</Text>;
    // $[5] 缓存 `statusText`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = statusText;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `teamsSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = teamsSelected;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // t5 暂存 `hint ? <Text> {hint}</Text> : null` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== hint) {
    // t5 暂存 `hint ? <Text> {hint}</Text> : null` 生成的渲染片段，后续返回路径直接复用。
    t5 = hint ? <Text> {hint}</Text> : null;
    // $[9] 缓存 `hint`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = hint;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `<>{t4}{t5}</>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t4 || $[12] !== t5) {
    // t6 暂存 `<>{t4}{t5}</>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <>{t4}{t5}</>;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(t) {
  // 返回 `t.name !== "team-lead"`，作为终端渲染这次计算的结果。
  return t.name !== "team-lead";
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.teamContext`，作为终端渲染这次计算的结果。
  return s.teamContext;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJ1c2VBcHBTdGF0ZSIsIlByb3BzIiwidGVhbXNTZWxlY3RlZCIsInNob3dIaW50IiwiVGVhbVN0YXR1cyIsInQwIiwiJCIsIl9jIiwidGVhbUNvbnRleHQiLCJfdGVtcCIsInQxIiwiT2JqZWN0IiwidmFsdWVzIiwidGVhbW1hdGVzIiwiZmlsdGVyIiwiX3RlbXAyIiwibGVuZ3RoIiwidG90YWxUZWFtbWF0ZXMiLCJ0MiIsImhpbnQiLCJzdGF0dXNUZXh0IiwidDMiLCJ0NCIsInQ1IiwidDYiLCJ0IiwibmFtZSIsInMiXSwic291cmNlcyI6WyJUZWFtU3RhdHVzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0ZWFtc1NlbGVjdGVkOiBib29sZWFuXG4gIHNob3dIaW50OiBib29sZWFuXG59XG5cbi8qKlxuICogRm9vdGVyIHN0YXR1cyBpbmRpY2F0b3Igc2hvd2luZyB0ZWFtbWF0ZSBjb3VudFxuICogU2ltaWxhciB0byBCYWNrZ3JvdW5kVGFza1N0YXR1cyBidXQgZm9yIHRlYW1tYXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gVGVhbVN0YXR1cyh7XG4gIHRlYW1zU2VsZWN0ZWQsXG4gIHNob3dIaW50LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0ZWFtQ29udGV4dCA9IHVzZUFwcFN0YXRlKHMgPT4gcy50ZWFtQ29udGV4dClcblxuICAvLyBEZXJpdmUgdGVhbW1hdGUgY291bnQgZnJvbSB0ZWFtQ29udGV4dCAobm8gZmlsZXN5c3RlbSBJL08gbmVlZGVkKVxuICBjb25zdCB0b3RhbFRlYW1tYXRlcyA9IHRlYW1Db250ZXh0XG4gICAgPyBPYmplY3QudmFsdWVzKHRlYW1Db250ZXh0LnRlYW1tYXRlcykuZmlsdGVyKHQgPT4gdC5uYW1lICE9PSAndGVhbS1sZWFkJylcbiAgICAgICAgLmxlbmd0aFxuICAgIDogMFxuXG4gIGlmICh0b3RhbFRlYW1tYXRlcyA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCBoaW50ID1cbiAgICBzaG93SGludCAmJiB0ZWFtc1NlbGVjdGVkID8gKFxuICAgICAgPD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+wrcgPC9UZXh0PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5FbnRlciB0byB2aWV3PC9UZXh0PlxuICAgICAgPC8+XG4gICAgKSA6IG51bGxcblxuICBjb25zdCBzdGF0dXNUZXh0ID0gYCR7dG90YWxUZWFtbWF0ZXN9ICR7dG90YWxUZWFtbWF0ZXMgPT09IDEgPyAndGVhbW1hdGUnIDogJ3RlYW1tYXRlcyd9YFxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxUZXh0XG4gICAgICAgIGtleT17dGVhbXNTZWxlY3RlZCA/ICdzZWxlY3RlZCcgOiAnbm9ybWFsJ31cbiAgICAgICAgY29sb3I9XCJiYWNrZ3JvdW5kXCJcbiAgICAgICAgaW52ZXJzZT17dGVhbXNTZWxlY3RlZH1cbiAgICAgID5cbiAgICAgICAge3N0YXR1c1RleHR9XG4gICAgICA8L1RleHQ+XG4gICAgICB7aGludCA/IDxUZXh0PiB7aGludH08L1RleHQ+IDogbnVsbH1cbiAgICA8Lz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBRXJELEtBQUtDLEtBQUssR0FBRztFQUNYQyxhQUFhLEVBQUUsT0FBTztFQUN0QkMsUUFBUSxFQUFFLE9BQU87QUFDbkIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBQUMsV0FBQUMsRUFBQTtF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