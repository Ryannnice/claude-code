// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js';
// 引入 getViewedTeammateTask，将 ../state/selectors.js 中已经封装好的能力接到本文件流程里。
import { getViewedTeammateTask } from '../state/selectors.js';
// 复用 toInkColor 工具函数，把通用处理留在 ../utils/ink.js 中维护。
import { toInkColor } from '../utils/ink.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 OffscreenFreeze，将 ./OffscreenFreeze.js 中已经封装好的能力接到本文件流程里。
import { OffscreenFreeze } from './OffscreenFreeze.js';

/**
 * Header shown when viewing a teammate's transcript.
 * Displays teammate name (colored), task description, and exit hint.
 */
// TeammateViewHeader 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TeammateViewHeader() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // viewedTeammate保存`useAppState`，供终端渲染后续处理使用。
  const viewedTeammate = useAppState(_temp);
  // viewedTeammate缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!viewedTeammate) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t0 暂存 `toInkColor(viewedTeammate.identity.color)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== viewedTeammate.identity.color) {
    // t0 暂存 `toInkColor(viewedTeammate.identity.color)` 生成的渲染片段，后续返回路径直接复用。
    t0 = toInkColor(viewedTeammate.identity.color);
    // $[0] 缓存 `viewedTeammate.identity.color`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = viewedTeammate.identity.color;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
  }
  // nameColor保存`t0`，作为后续临时缓存值处理的输入。
  const nameColor = t0;
  // t1 暂存 `<Text>Viewing </Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text>Viewing </Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text>Viewing </Text>;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<Text color={nameColor} bold={true}>@{viewedTeammate.iden...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== nameColor || $[4] !== viewedTeammate.identity.agentName) {
    // t2 暂存 `<Text color={nameColor} bold={true}>@{viewedTeammate.iden...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color={nameColor} bold={true}>@{viewedTeammate.identity.agentName}</Text>;
    // $[3] 缓存 `nameColor`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = nameColor;
    // $[4] 缓存 `viewedTeammate.identity.agentName`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = viewedTeammate.identity.agentName;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `<Text dimColor={true}>{" \xB7 "}<KeyboardShortcutHint sho...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text dimColor={true}>{" \xB7 "}<KeyboardShortcutHint sho...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true}>{" \xB7 "}<KeyboardShortcutHint shortcut="esc" action="return" /></Text>;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `<Box>{t1}{t2}{t3}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t2) {
    // t4 暂存 `<Box>{t1}{t2}{t3}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box>{t1}{t2}{t3}</Box>;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // t5 暂存 `<Text dimColor={true}>{viewedTeammate.prompt}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== viewedTeammate.prompt) {
    // t5 暂存 `<Text dimColor={true}>{viewedTeammate.prompt}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text dimColor={true}>{viewedTeammate.prompt}</Text>;
    // $[9] 缓存 `viewedTeammate.prompt`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = viewedTeammate.prompt;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `<OffscreenFreeze><Box flexDirection="column" marginBottom...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t4 || $[12] !== t5) {
    // t6 暂存 `<OffscreenFreeze><Box flexDirection="column" marginBottom...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <OffscreenFreeze><Box flexDirection="column" marginBottom={1}>{t4}{t5}</Box></OffscreenFreeze>;
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
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `getViewedTeammateTask(s)`，作为终端渲染这次计算的结果。
  return getViewedTeammateTask(s);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJ1c2VBcHBTdGF0ZSIsImdldFZpZXdlZFRlYW1tYXRlVGFzayIsInRvSW5rQ29sb3IiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIk9mZnNjcmVlbkZyZWV6ZSIsIlRlYW1tYXRlVmlld0hlYWRlciIsIiQiLCJfYyIsInZpZXdlZFRlYW1tYXRlIiwiX3RlbXAiLCJ0MCIsImlkZW50aXR5IiwiY29sb3IiLCJuYW1lQ29sb3IiLCJ0MSIsIlN5bWJvbCIsImZvciIsInQyIiwiYWdlbnROYW1lIiwidDMiLCJ0NCIsInQ1IiwicHJvbXB0IiwidDYiLCJzIl0sInNvdXJjZXMiOlsiVGVhbW1hdGVWaWV3SGVhZGVyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBnZXRWaWV3ZWRUZWFtbWF0ZVRhc2sgfSBmcm9tICcuLi9zdGF0ZS9zZWxlY3RvcnMuanMnXG5pbXBvcnQgeyB0b0lua0NvbG9yIH0gZnJvbSAnLi4vdXRpbHMvaW5rLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBPZmZzY3JlZW5GcmVlemUgfSBmcm9tICcuL09mZnNjcmVlbkZyZWV6ZS5qcydcblxuLyoqXG4gKiBIZWFkZXIgc2hvd24gd2hlbiB2aWV3aW5nIGEgdGVhbW1hdGUncyB0cmFuc2NyaXB0LlxuICogRGlzcGxheXMgdGVhbW1hdGUgbmFtZSAoY29sb3JlZCksIHRhc2sgZGVzY3JpcHRpb24sIGFuZCBleGl0IGhpbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBUZWFtbWF0ZVZpZXdIZWFkZXIoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgdmlld2VkVGVhbW1hdGUgPSB1c2VBcHBTdGF0ZShzID0+IGdldFZpZXdlZFRlYW1tYXRlVGFzayhzKSlcblxuICBpZiAoIXZpZXdlZFRlYW1tYXRlKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IG5hbWVDb2xvciA9IHRvSW5rQ29sb3Iodmlld2VkVGVhbW1hdGUuaWRlbnRpdHkuY29sb3IpXG5cbiAgcmV0dXJuIChcbiAgICA8T2Zmc2NyZWVuRnJlZXplPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dD5WaWV3aW5nIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj17bmFtZUNvbG9yfSBib2xkPlxuICAgICAgICAgICAgQHt2aWV3ZWRUZWFtbWF0ZS5pZGVudGl0eS5hZ2VudE5hbWV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgeycgwrcgJ31cbiAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cImVzY1wiIGFjdGlvbj1cInJldHVyblwiIC8+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+e3ZpZXdlZFRlYW1tYXRlLnByb21wdH08L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L09mZnNjcmVlbkZyZWV6ZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLFdBQVcsUUFBUSxzQkFBc0I7QUFDbEQsU0FBU0MscUJBQXFCLFFBQVEsdUJBQXVCO0FBQzdELFNBQVNDLFVBQVUsUUFBUSxpQkFBaUI7QUFDNUMsU0FBU0Msb0JBQW9C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