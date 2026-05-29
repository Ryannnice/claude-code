// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * SelectHookMode shows all hooks configured for a given event+matcher pair.
 *
 * The /hooks menu is read-only: this view no longer offers "add new hook"
 * and selecting a hook shows its read-only details instead of a delete
 * confirmation.
 */
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准终端渲染的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js';
// 类型依赖 { HookEventMetadata } 来自 src/utils/hooks/hooksConfigManager.js，用于校准终端渲染的数据契约。
import type { HookEventMetadata } from 'src/utils/hooks/hooksConfigManager.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getHookDisplayText、hookSourceHeaderDisplayString、IndividualHookConfig 工具函数，把通用处理留在 ../../utils/hooks/hooksSettings.js 中维护。
import { getHookDisplayText, hookSourceHeaderDisplayString, type IndividualHookConfig } from '../../utils/hooks/hooksSettings.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  selectedEvent: HookEvent;
  selectedMatcher: string | null;
  hooksForSelectedMatcher: IndividualHookConfig[];
  hookEventMetadata: HookEventMetadata;
  // 这个回调绑定到 onSelect: (hook: IndividualHookConfig) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (hook: IndividualHookConfig) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// SelectHookMode 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SelectHookMode(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    selectedEvent,
    selectedMatcher,
    hooksForSelectedMatcher,
    hookEventMetadata,
    onSelect,
    onCancel
  } = t0;
  // title 标题标记终端 UI Select Hook Mode是否启用对应路径。
  const title = hookEventMetadata.matcherMetadata !== undefined ? `${selectedEvent} - Matcher: ${selectedMatcher || "(all)"}` : selectedEvent;
  // hooksForSelectedMatcher为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (hooksForSelectedMatcher.length === 0) {
    // t1 暂存 `<Box flexDirection="column" gap={1}><Text dimColor={true}...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Box flexDirection="column" gap={1}><Text dimColor={true}...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Box flexDirection="column" gap={1}><Text dimColor={true}>No hooks configured for this event.</Text><Text dimColor={true}>To add hooks, edit settings.json directly or ask Claude.</Text></Box>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // t2 暂存 `<Dialog title={title} subtitle={hookEventMetadata.descrip...` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== hookEventMetadata.description || $[2] !== onCancel || $[3] !== title) {
      // t2 暂存 `<Dialog title={title} subtitle={hookEventMetadata.descrip...` 生成的渲染片段，后续返回路径直接复用。
      t2 = <Dialog title={title} subtitle={hookEventMetadata.description} onCancel={onCancel} inputGuide={_temp}>{t1}</Dialog>;
      // $[1] 缓存 `hookEventMetadata.description`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = hookEventMetadata.description;
      // $[2] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = onCancel;
      // $[3] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = title;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // t1保存`hookEventMetadata.description`，供后续判断或组装使用。
  const t1 = hookEventMetadata.description;
  // t2 暂存 `hooksForSelectedMatcher.map(_temp2)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== hooksForSelectedMatcher) {
    // t2 暂存 `hooksForSelectedMatcher.map(_temp2)` 生成的渲染片段，后续返回路径直接复用。
    t2 = hooksForSelectedMatcher.map(_temp2);
    // $[5] 缓存 `hooksForSelectedMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = hooksForSelectedMatcher;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // t3 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== hooksForSelectedMatcher || $[8] !== onSelect) {
    // t3 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = value => {
      // index_0 索引解析`parseInt`，供终端渲染后续处理使用。
      const index_0 = parseInt(value, 10);
      // hook_0 命名 `hooksForSelectedMatcher[index_0]`，让后续代码直接表达这个值的用途。
      const hook_0 = hooksForSelectedMatcher[index_0];
      // 满足 `hook_0` 时，终端渲染执行该分支。
      if (hook_0) {
        // 调用 onSelect，触发终端渲染此处需要的副作用。
        onSelect(hook_0);
      }
    };
    // $[7] 缓存 `hooksForSelectedMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = hooksForSelectedMatcher;
    // $[8] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onSelect;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // t4 暂存 `<Box flexDirection="column"><Select options={t2} onChange...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== onCancel || $[11] !== t2 || $[12] !== t3) {
    // t4 暂存 `<Box flexDirection="column"><Select options={t2} onChange...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box flexDirection="column"><Select options={t2} onChange={t3} onCancel={onCancel} /></Box>;
    // $[10] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onCancel;
    // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t2;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[13];
  }
  // t5 暂存 `<Dialog title={title} subtitle={t1} onCancel={onCancel}>{...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== hookEventMetadata.description || $[15] !== onCancel || $[16] !== t4 || $[17] !== title) {
    // t5 暂存 `<Dialog title={title} subtitle={t1} onCancel={onCancel}>{...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Dialog title={title} subtitle={t1} onCancel={onCancel}>{t4}</Dialog>;
    // $[14] 缓存 `hookEventMetadata.description`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = hookEventMetadata.description;
    // $[15] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onCancel;
    // $[16] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t4;
    // $[17] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = title;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[18];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(hook, index) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: `[${hook.config.type}] ${getHookDisplayText(hook.config)}`,
    value: index.toString(),
    description: hook.source === "pluginHook" && hook.pluginName ? `${hookSourceHeaderDisplayString(hook.source)} (${hook.pluginName})` : hookSourceHeaderDisplayString(hook.source)
  };
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `<Text>Esc to go back</Text>`，作为终端渲染这次计算的结果。
  return <Text>Esc to go back</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkhvb2tFdmVudCIsIkhvb2tFdmVudE1ldGFkYXRhIiwiQm94IiwiVGV4dCIsImdldEhvb2tEaXNwbGF5VGV4dCIsImhvb2tTb3VyY2VIZWFkZXJEaXNwbGF5U3RyaW5nIiwiSW5kaXZpZHVhbEhvb2tDb25maWciLCJTZWxlY3QiLCJEaWFsb2ciLCJQcm9wcyIsInNlbGVjdGVkRXZlbnQiLCJzZWxlY3RlZE1hdGNoZXIiLCJob29rc0ZvclNlbGVjdGVkTWF0Y2hlciIsImhvb2tFdmVudE1ldGFkYXRhIiwib25TZWxlY3QiLCJob29rIiwib25DYW5jZWwiLCJTZWxlY3RIb29rTW9kZSIsInQwIiwiJCIsIl9jIiwidGl0bGUiLCJtYXRjaGVyTWV0YWRhdGEiLCJ1bmRlZmluZWQiLCJsZW5ndGgiLCJ0MSIsIlN5bWJvbCIsImZvciIsInQyIiwiZGVzY3JpcHRpb24iLCJfdGVtcCIsIm1hcCIsIl90ZW1wMiIsInQzIiwidmFsdWUiLCJpbmRleF8wIiwicGFyc2VJbnQiLCJob29rXzAiLCJpbmRleCIsInQ0IiwidDUiLCJsYWJlbCIsImNvbmZpZyIsInR5cGUiLCJ0b1N0cmluZyIsInNvdXJjZSIsInBsdWdpbk5hbWUiXSwic291cmNlcyI6WyJTZWxlY3RIb29rTW9kZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTZWxlY3RIb29rTW9kZSBzaG93cyBhbGwgaG9va3MgY29uZmlndXJlZCBmb3IgYSBnaXZlbiBldmVudCttYXRjaGVyIHBhaXIuXG4gKlxuICogVGhlIC9ob29rcyBtZW51IGlzIHJlYWQtb25seTogdGhpcyB2aWV3IG5vIGxvbmdlciBvZmZlcnMgXCJhZGQgbmV3IGhvb2tcIlxuICogYW5kIHNlbGVjdGluZyBhIGhvb2sgc2hvd3MgaXRzIHJlYWQtb25seSBkZXRhaWxzIGluc3RlYWQgb2YgYSBkZWxldGVcbiAqIGNvbmZpcm1hdGlvbi5cbiAqL1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEhvb2tFdmVudCB9IGZyb20gJ3NyYy9lbnRyeXBvaW50cy9hZ2VudFNka1R5cGVzLmpzJ1xuaW1wb3J0IHR5cGUgeyBIb29rRXZlbnRNZXRhZGF0YSB9IGZyb20gJ3NyYy91dGlscy9ob29rcy9ob29rc0NvbmZpZ01hbmFnZXIuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQge1xuICBnZXRIb29rRGlzcGxheVRleHQsXG4gIGhvb2tTb3VyY2VIZWFkZXJEaXNwbGF5U3RyaW5nLFxuICB0eXBlIEluZGl2aWR1YWxIb29rQ29uZmlnLFxufSBmcm9tICcuLi8uLi91dGlscy9ob29rcy9ob29rc1NldHRpbmdzLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzZWxlY3RlZEV2ZW50OiBIb29rRXZlbnRcbiAgc2VsZWN0ZWRNYXRjaGVyOiBzdHJpbmcgfCBudWxsXG4gIGhvb2tzRm9yU2VsZWN0ZWRNYXRjaGVyOiBJbmRpdmlkdWFsSG9va0NvbmZpZ1tdXG4gIGhvb2tFdmVudE1ldGFkYXRhOiBIb29rRXZlbnRNZXRhZGF0YVxuICBvblNlbGVjdDogKGhvb2s6IEluZGl2aWR1YWxIb29rQ29uZmlnKSA9PiB2b2lkXG4gIG9uQ2FuY2VsOiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTZWxlY3RIb29rTW9kZSh7XG4gIHNlbGVjdGVkRXZlbnQsXG4gIHNlbGVjdGVkTWF0Y2hlcixcbiAgaG9va3NGb3JTZWxlY3RlZE1hdGNoZXIsXG4gIGhvb2tFdmVudE1ldGFkYXRhLFxuICBvblNlbGVjdCxcbiAgb25DYW5jZWwsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHRpdGxlID1cbiAgICBob29rRXZlbnRNZXRhZGF0YS5tYXRjaGVyTWV0YWRhdGEgIT09IHVuZGVmaW5lZFxuICAgICAgPyBgJHtzZWxlY3RlZEV2ZW50fSAtIE1hdGNoZXI6ICR7c2VsZWN0ZWRNYXRjaGVyIHx8ICcoYWxsKSd9YFxuICAgICAgOiBzZWxlY3RlZEV2ZW50XG5cbiAgaWYgKGhvb2tzRm9yU2VsZWN0ZWRNYXRjaGVyLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8RGlhbG9nXG4gICAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgICAgc3VidGl0bGU9e2hvb2tFdmVudE1ldGFkYXRhLmRlc2NyaXB0aW9ufVxuICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIGlucHV0R3VpZGU9eygpID0+IDxUZXh0PkVzYyB0byBnbyBiYWNrPC9UZXh0Pn1cbiAgICAgID5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5ObyBob29rcyBjb25maWd1cmVkIGZvciB0aGlzIGV2ZW50LjwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIFRvIGFkZCBob29rcywgZWRpdCBzZXR0aW5ncy5qc29uIGRpcmVjdGx5IG9yIGFzayBDbGF1ZGUuXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvRGlhbG9nPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9e3RpdGxlfVxuICAgICAgc3VidGl0bGU9e2hvb2tFdmVudE1ldGFkYXRhLmRlc2NyaXB0aW9ufVxuICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgb3B0aW9ucz17aG9va3NGb3JTZWxlY3RlZE1hdGNoZXIubWFwKChob29rLCBpbmRleCkgPT4gKHtcbiAgICAgICAgICAgIGxhYmVsOiBgWyR7aG9vay5jb25maWcudHlwZX1dICR7Z2V0SG9va0Rpc3BsYXlUZXh0KGhvb2suY29uZmlnKX1gLFxuICAgICAgICAgICAgdmFsdWU6IGluZGV4LnRvU3RyaW5nKCksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgICAgICAgaG9vay5zb3VyY2UgPT09ICdwbHVnaW5Ib29rJyAmJiBob29rLnBsdWdpbk5hbWVcbiAgICAgICAgICAgICAgICA/IGAke2hvb2tTb3VyY2VIZWFkZXJEaXNwbGF5U3RyaW5nKGhvb2suc291cmNlKX0gKCR7aG9vay5wbHVnaW5OYW1lfSlgXG4gICAgICAgICAgICAgICAgOiBob29rU291cmNlSGVhZGVyRGlzcGxheVN0cmluZyhob29rLnNvdXJjZSksXG4gICAgICAgICAgfSkpfVxuICAgICAgICAgIG9uQ2hhbmdlPXt2YWx1ZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHBhcnNlSW50KHZhbHVlLCAxMClcbiAgICAgICAgICAgIGNvbnN0IGhvb2sgPSBob29rc0ZvclNlbGVjdGVkTWF0Y2hlcltpbmRleF1cbiAgICAgICAgICAgIGlmIChob29rKSB7XG4gICAgICAgICAgICAgIG9uU2VsZWN0KGhvb2spXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfX1cbiAgICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLGNBQWNDLFNBQVMsUUFBUSxrQ0FBa0M7QUFDakUsY0FBY0MsaUJBQWlCLFFBQVEsdUNBQXVDO0FBQzlFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FDRUMsa0JBQWtCLEVBQ2xCQyw2QkFBNkIsRUFDN0IsS0FBS0Msb0JBQW9CLFFB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