// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * SelectMatcherMode shows the configured matchers for a selected hook event.
 *
 * The /hooks menu is read-only: this view no longer offers "add new matcher"
 * and simply lets the user drill into each matcher to see its hooks.
 */
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准终端渲染的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 HookSource、hookSourceInlineDisplayString、IndividualHookConfig 工具函数，把通用处理留在 ../../utils/hooks/hooksSettings.js 中维护。
import { type HookSource, hookSourceInlineDisplayString, type IndividualHookConfig } from '../../utils/hooks/hooksSettings.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// MatcherWithSource 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type MatcherWithSource = {
  matcher: string;
  sources: HookSource[];
  hookCount: number;
};
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  selectedEvent: HookEvent;
  matchersForSelectedEvent: string[];
  hooksByEventAndMatcher: Record<HookEvent, Record<string, IndividualHookConfig[]>>;
  eventDescription: string;
  // 这个回调绑定到 onSelect: (matcher: string) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (matcher: string) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// SelectMatcherMode 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SelectMatcherMode(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    selectedEvent,
    matchersForSelectedEvent,
    hooksByEventAndMatcher,
    eventDescription,
    onSelect,
    onCancel
  } = t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== hooksByEventAndMatcher || $[1] !== matchersForSelectedEvent || $[2] !== selectedEvent) {
    // t2 暂存 `matcher => {` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[4] !== hooksByEventAndMatcher || $[5] !== selectedEvent) {
      // t2 暂存 `matcher => {` 生成的渲染片段，后续返回路径直接复用。
      t2 = matcher => {
        // hooks 集合标记终端 UI Select Matcher Mode是否启用对应路径。
        const hooks = hooksByEventAndMatcher[selectedEvent]?.[matcher] || [];
        // sources 集合保存`Array.from`，供终端渲染后续处理使用。
        const sources = Array.from(new Set(hooks.map(_temp)));
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          matcher,
          sources,
          hookCount: hooks.length
        };
      };
      // $[4] 缓存 `hooksByEventAndMatcher`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = hooksByEventAndMatcher;
      // $[5] 缓存 `selectedEvent`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = selectedEvent;
      // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[6];
    }
    // t1 暂存 `matchersForSelectedEvent.map(t2)` 生成的渲染片段，后续返回路径直接复用。
    t1 = matchersForSelectedEvent.map(t2);
    // $[0] 缓存 `hooksByEventAndMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = hooksByEventAndMatcher;
    // $[1] 缓存 `matchersForSelectedEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = matchersForSelectedEvent;
    // $[2] 缓存 `selectedEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = selectedEvent;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // matchersWithSources 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const matchersWithSources = t1;
  // matchersForSelectedEvent为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (matchersForSelectedEvent.length === 0) {
    // t2固定为 ``${selectedEvent} - Matchers``，作为终端 UI Select Matcher Mode后续展示或比较的基准。
    const t2 = `${selectedEvent} - Matchers`;
    // t3 暂存 `<Box flexDirection="column" gap={1}><Text dimColor={true}...` 的派生结果，便于缓存命中时直接复用。
    let t3;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      // t3 暂存 `<Box flexDirection="column" gap={1}><Text dimColor={true}...` 生成的渲染片段，后续返回路径直接复用。
      t3 = <Box flexDirection="column" gap={1}><Text dimColor={true}>No hooks configured for this event.</Text><Text dimColor={true}>To add hooks, edit settings.json directly or ask Claude.</Text></Box>;
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
    } else {
      // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
      t3 = $[7];
    }
    // t4 暂存 `<Dialog title={t2} subtitle={eventDescription} onCancel={...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[8] !== eventDescription || $[9] !== onCancel || $[10] !== t2) {
      // t4 暂存 `<Dialog title={t2} subtitle={eventDescription} onCancel={...` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Dialog title={t2} subtitle={eventDescription} onCancel={onCancel} inputGuide={_temp2}>{t3}</Dialog>;
      // $[8] 缓存 `eventDescription`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = eventDescription;
      // $[9] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
      $[9] = onCancel;
      // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t2;
      // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[11];
    }
    // 返回 `t4`，作为终端渲染这次计算的结果。
    return t4;
  }
  // t2固定为 ``${selectedEvent} - Matchers``，作为终端 UI Select Matcher Mode后续展示或比较的基准。
  const t2 = `${selectedEvent} - Matchers`;
  // t3 暂存 `matchersWithSources.map(_temp3)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== matchersWithSources) {
    // t3 暂存 `matchersWithSources.map(_temp3)` 生成的渲染片段，后续返回路径直接复用。
    t3 = matchersWithSources.map(_temp3);
    // $[12] 缓存 `matchersWithSources`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = matchersWithSources;
    // $[13] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[13];
  }
  // t4 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== onSelect) {
    // t4 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = value => {
      // 调用 onSelect，触发终端渲染此处需要的副作用。
      onSelect(value);
    };
    // $[14] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = onSelect;
    // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[15];
  }
  // t5 暂存 `<Box flexDirection="column"><Select options={t3} onChange...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onCancel || $[17] !== t3 || $[18] !== t4) {
    // t5 暂存 `<Box flexDirection="column"><Select options={t3} onChange...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column"><Select options={t3} onChange={t4} onCancel={onCancel} /></Box>;
    // $[16] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onCancel;
    // $[17] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t3;
    // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t4;
    // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[19];
  }
  // t6 暂存 `<Dialog title={t2} subtitle={eventDescription} onCancel={...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== eventDescription || $[21] !== onCancel || $[22] !== t2 || $[23] !== t5) {
    // t6 暂存 `<Dialog title={t2} subtitle={eventDescription} onCancel={...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Dialog title={t2} subtitle={eventDescription} onCancel={onCancel}>{t5}</Dialog>;
    // $[20] 缓存 `eventDescription`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = eventDescription;
    // $[21] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = onCancel;
    // $[22] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t2;
    // $[23] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t5;
    // $[24] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[24];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(item) {
  // sourceText派生`sources.map`，供终端渲染后续处理使用。
  const sourceText = item.sources.map(hookSourceInlineDisplayString).join(", ");
  // matcherLabel标记终端 UI Select Matcher Mode是否启用对应路径。
  const matcherLabel = item.matcher || "(all)";
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: `[${sourceText}] ${matcherLabel}`,
    value: item.matcher,
    description: `${item.hookCount} ${plural(item.hookCount, "hook")}`
  };
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2() {
  // 返回 `<Text>Esc to go back</Text>`，作为终端渲染这次计算的结果。
  return <Text>Esc to go back</Text>;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(h) {
  // 返回 `h.source`，作为终端渲染这次计算的结果。
  return h.source;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkhvb2tFdmVudCIsIkJveCIsIlRleHQiLCJIb29rU291cmNlIiwiaG9va1NvdXJjZUlubGluZURpc3BsYXlTdHJpbmciLCJJbmRpdmlkdWFsSG9va0NvbmZpZyIsInBsdXJhbCIsIlNlbGVjdCIsIkRpYWxvZyIsIk1hdGNoZXJXaXRoU291cmNlIiwibWF0Y2hlciIsInNvdXJjZXMiLCJob29rQ291bnQiLCJQcm9wcyIsInNlbGVjdGVkRXZlbnQiLCJtYXRjaGVyc0ZvclNlbGVjdGVkRXZlbnQiLCJob29rc0J5RXZlbnRBbmRNYXRjaGVyIiwiUmVjb3JkIiwiZXZlbnREZXNjcmlwdGlvbiIsIm9uU2VsZWN0Iiwib25DYW5jZWwiLCJTZWxlY3RNYXRjaGVyTW9kZSIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsImhvb2tzIiwiQXJyYXkiLCJmcm9tIiwiU2V0IiwibWFwIiwiX3RlbXAiLCJsZW5ndGgiLCJtYXRjaGVyc1dpdGhTb3VyY2VzIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJ0NCIsIl90ZW1wMiIsIl90ZW1wMyIsInZhbHVlIiwidDUiLCJ0NiIsIml0ZW0iLCJzb3VyY2VUZXh0Iiwiam9pbiIsIm1hdGNoZXJMYWJlbCIsImxhYmVsIiwiZGVzY3JpcHRpb24iLCJoIiwic291cmNlIl0sInNvdXJjZXMiOlsiU2VsZWN0TWF0Y2hlck1vZGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU2VsZWN0TWF0Y2hlck1vZGUgc2hvd3MgdGhlIGNvbmZpZ3VyZWQgbWF0Y2hlcnMgZm9yIGEgc2VsZWN0ZWQgaG9vayBldmVudC5cbiAqXG4gKiBUaGUgL2hvb2tzIG1lbnUgaXMgcmVhZC1vbmx5OiB0aGlzIHZpZXcgbm8gbG9uZ2VyIG9mZmVycyBcImFkZCBuZXcgbWF0Y2hlclwiXG4gKiBhbmQgc2ltcGx5IGxldHMgdGhlIHVzZXIgZHJpbGwgaW50byBlYWNoIG1hdGNoZXIgdG8gc2VlIGl0cyBob29rcy5cbiAqL1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEhvb2tFdmVudCB9IGZyb20gJ3NyYy9lbnRyeXBvaW50cy9hZ2VudFNka1R5cGVzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBIb29rU291cmNlLFxuICBob29rU291cmNlSW5saW5lRGlzcGxheVN0cmluZyxcbiAgdHlwZSBJbmRpdmlkdWFsSG9va0NvbmZpZyxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvaG9va3MvaG9va3NTZXR0aW5ncy5qcydcbmltcG9ydCB7IHBsdXJhbCB9IGZyb20gJy4uLy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG50eXBlIE1hdGNoZXJXaXRoU291cmNlID0ge1xuICBtYXRjaGVyOiBzdHJpbmdcbiAgc291cmNlczogSG9va1NvdXJjZVtdXG4gIGhvb2tDb3VudDogbnVtYmVyXG59XG5cbnR5cGUgUHJvcHMgPSB7XG4gIHNlbGVjdGVkRXZlbnQ6IEhvb2tFdmVudFxuICBtYXRjaGVyc0ZvclNlbGVjdGVkRXZlbnQ6IHN0cmluZ1tdXG4gIGhvb2tzQnlFdmVudEFuZE1hdGNoZXI6IFJlY29yZDxcbiAgICBIb29rRXZlbnQsXG4gICAgUmVjb3JkPHN0cmluZywgSW5kaXZpZHVhbEhvb2tDb25maWdbXT5cbiAgPlxuICBldmVudERlc2NyaXB0aW9uOiBzdHJpbmdcbiAgb25TZWxlY3Q6IChtYXRjaGVyOiBzdHJpbmcpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNlbGVjdE1hdGNoZXJNb2RlKHtcbiAgc2VsZWN0ZWRFdmVudCxcbiAgbWF0Y2hlcnNGb3JTZWxlY3RlZEV2ZW50LFxuICBob29rc0J5RXZlbnRBbmRNYXRjaGVyLFxuICBldmVudERlc2NyaXB0aW9uLFxuICBvblNlbGVjdCxcbiAgb25DYW5jZWwsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIC8vIEdyb3VwIG1hdGNoZXJzIHdpdGggdGhlaXIgc291cmNlcyAoYWxyZWFkeSBzb3J0ZWQgYnkgcHJpb3JpdHkgaW4gcGFyZW50KVxuICBjb25zdCBtYXRjaGVyc1dpdGhTb3VyY2VzOiBNYXRjaGVyV2l0aFNvdXJjZVtdID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgcmV0dXJuIG1hdGNoZXJzRm9yU2VsZWN0ZWRFdmVudC5tYXAobWF0Y2hlciA9PiB7XG4gICAgICBjb25zdCBob29rcyA9IGhvb2tzQnlFdmVudEFuZE1hdGNoZXJbc2VsZWN0ZWRFdmVudF0/LlttYXRjaGVyXSB8fCBbXVxuICAgICAgY29uc3Qgc291cmNlcyA9IEFycmF5LmZyb20obmV3IFNldChob29rcy5tYXAoaCA9PiBoLnNvdXJjZSkpKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWF0Y2hlcixcbiAgICAgICAgc291cmNlcyxcbiAgICAgICAgaG9va0NvdW50OiBob29rcy5sZW5ndGgsXG4gICAgICB9XG4gICAgfSlcbiAgfSwgW21hdGNoZXJzRm9yU2VsZWN0ZWRFdmVudCwgaG9va3NCeUV2ZW50QW5kTWF0Y2hlciwgc2VsZWN0ZWRFdmVudF0pXG5cbiAgaWYgKG1hdGNoZXJzRm9yU2VsZWN0ZWRFdmVudC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gKFxuICAgICAgPERpYWxvZ1xuICAgICAgICB0aXRsZT17YCR7c2VsZWN0ZWRFdmVudH0gLSBNYXRjaGVyc2B9XG4gICAgICAgIHN1YnRpdGxlPXtldmVudERlc2NyaXB0aW9ufVxuICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIGlucHV0R3VpZGU9eygpID0+IDxUZXh0PkVzYyB0byBnbyBiYWNrPC9UZXh0Pn1cbiAgICAgID5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5ObyBob29rcyBjb25maWd1cmVkIGZvciB0aGlzIGV2ZW50LjwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIFRvIGFkZCBob29rcywgZWRpdCBzZXR0aW5ncy5qc29uIGRpcmVjdGx5IG9yIGFzayBDbGF1ZGUuXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvRGlhbG9nPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9e2Ake3NlbGVjdGVkRXZlbnR9IC0gTWF0Y2hlcnNgfVxuICAgICAgc3VidGl0bGU9e2V2ZW50RGVzY3JpcHRpb259XG4gICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXttYXRjaGVyc1dpdGhTb3VyY2VzLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZVRleHQgPSBpdGVtLnNvdXJjZXNcbiAgICAgICAgICAgICAgLm1hcChob29rU291cmNlSW5saW5lRGlzcGxheVN0cmluZylcbiAgICAgICAgICAgICAgLmpvaW4oJywgJylcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoZXJMYWJlbCA9IGl0ZW0ubWF0Y2hlciB8fCAnKGFsbCknXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBsYWJlbDogYFske3NvdXJjZVRleHR9XSAke21hdGNoZXJMYWJlbH1gLFxuICAgICAgICAgICAgICB2YWx1ZTogaXRlbS5tYXRjaGVyLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7aXRlbS5ob29rQ291bnR9ICR7cGx1cmFsKGl0ZW0uaG9va0NvdW50LCAnaG9vaycpfWAsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSl9XG4gICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHtcbiAgICAgICAgICAgIG9uU2VsZWN0KHZhbHVlKVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsY0FBY0MsU0FBUyxRQUFRLGtDQUFrQztBQUNqRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQ0UsS0FBS0MsVUFBVSxFQUNmQyw2QkFBNkIsRUFDN0IsS0FBS0Msb0JBQW9CLFFBQ3BCLG9DQUFvQztBQUMzQyxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBQ25ELFNBQVNDLE1BQU0sUUFBUSwyQkFBMkI7QUFDbEQsU0FBU0MsTUFBTSxRQUFRLDRCQUE0QjtBQUVuRCxLQUFLQyxpQkFBaUIsR0FBRztFQUN2QkMsT0FBTyxFQUFFLE1BQU07RUFDZkMsT0FBTyxFQUFFUixVQUFVLEVBQUU7RUFDckJTLFNBQVMsRUFBRSxNQUFNO0FBQ25CLENBQUM7QUFFRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsYUFBYSxFQUFFZCxTQUFTO0VBQ3hCZSx3QkFBd0IsRUFBRSxNQUFNLEVBQUU7RUFDbENDLHNCQUFzQixFQUFFQyxNQUFNLENBQzVCakIsU0FBUyxFQUNUaUIsTUFBTSxDQUFDLE1BQU0sRUFBRVosb0JBQW9CLEVBQUUsQ0FBQyxDQUN2QztFQUNEYSxnQkFBZ0IsRUFBRSxNQUFNO0VBQ3hCQyxRQUFRLEVBQUUsQ0FBQ1QsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUk7RUFDbkNVLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtBQUN0QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxrQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMs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