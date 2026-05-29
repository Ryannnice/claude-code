// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * SelectEventMode is the entrypoint of the Hooks config menu, where the user
 * sees the list of available hook events.
 *
 * The /hooks menu is read-only: selecting an event lets you browse its
 * configured hooks but not modify them. To add or change hooks, users should
 * edit settings.json directly or ask Claude.
 */

// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准终端渲染的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js';
// 类型依赖 { HookEventMetadata } 来自 src/utils/hooks/hooksConfigManager.js，用于校准终端渲染的数据契约。
import type { HookEventMetadata } from 'src/utils/hooks/hooksConfigManager.js';
// 引入 Box、Link、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../../ink.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  hookEventMetadata: Record<HookEvent, HookEventMetadata>;
  hooksByEvent: Partial<Record<HookEvent, number>>;
  totalHooksCount: number;
  restrictedByPolicy: boolean;
  // 这个回调绑定到 onSelectEvent: (event: HookEvent) => void;，负责终端渲染在该局部场景下的响应。
  onSelectEvent: (event: HookEvent) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// SelectEventMode 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SelectEventMode(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(23);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hookEventMetadata,
    hooksByEvent,
    totalHooksCount,
    restrictedByPolicy,
    onSelectEvent,
    onCancel
  } = t0;
  // t1 暂存 `plural(totalHooksCount, "hook")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== totalHooksCount) {
    // t1 暂存 `plural(totalHooksCount, "hook")` 生成的渲染片段，后续返回路径直接复用。
    t1 = plural(totalHooksCount, "hook");
    // $[0] 缓存 `totalHooksCount`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = totalHooksCount;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // subtitle 标题固定为 ``${totalHooksCount} ${t1} configured``，作为终端 UI Select Event Mode后续展示或比较的基准。
  const subtitle = `${totalHooksCount} ${t1} configured`;
  // t2 暂存 `restrictedByPolicy && <Box flexDirection="column"><Text c...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== restrictedByPolicy) {
    // t2 暂存 `restrictedByPolicy && <Box flexDirection="column"><Text c...` 生成的渲染片段，后续返回路径直接复用。
    t2 = restrictedByPolicy && <Box flexDirection="column"><Text color="suggestion">{figures.info} Hooks Restricted by Policy</Text><Text dimColor={true}>Only hooks from managed settings can run. User-defined hooks from ~/.claude/settings.json, .claude/settings.json, and .claude/settings.local.json are blocked.</Text></Box>;
    // $[2] 缓存 `restrictedByPolicy`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = restrictedByPolicy;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<Box flexDirection="column"><Text dimColor={true}>{figure...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Box flexDirection="column"><Text dimColor={true}>{figure...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column"><Text dimColor={true}>{figures.info} This menu is read-only. To add or modify hooks, edit settings.json directly or ask Claude.{" "}<Link url="https://code.claude.com/docs/en/hooks">Learn more</Link></Text></Box>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== onSelectEvent) {
    // t4 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = value => {
      // 调用 onSelectEvent，触发终端渲染此处需要的副作用。
      onSelectEvent(value as HookEvent);
    };
    // $[5] 缓存 `onSelectEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onSelectEvent;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `Object.entries(hookEventMetadata)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== hookEventMetadata) {
    // t5 暂存 `Object.entries(hookEventMetadata)` 生成的渲染片段，后续返回路径直接复用。
    t5 = Object.entries(hookEventMetadata);
    // $[7] 缓存 `hookEventMetadata`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = hookEventMetadata;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `t5.map(t7 => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== hooksByEvent || $[10] !== t5) {
    // t6 暂存 `t5.map(t7 => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = t5.map(t7 => {
      // 从 `t7` 按位置拆出 name、metadata，让终端 UI 组件 Select Event Mode分别处理这些返回值。
      const [name, metadata] = t7;
      // count 数量标记终端 UI Select Event Mode是否启用对应路径。
      const count = hooksByEvent[name as HookEvent] || 0;
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        label: count > 0 ? <Text>{name} <Text color="suggestion">({count})</Text></Text> : name,
        value: name,
        description: metadata.summary
      };
    });
    // $[9] 缓存 `hooksByEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = hooksByEvent;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // t7 暂存 `<Box flexDirection="column"><Select onChange={t4} onCance...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== onCancel || $[13] !== t4 || $[14] !== t6) {
    // t7 暂存 `<Box flexDirection="column"><Select onChange={t4} onCance...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column"><Select onChange={t4} onCancel={onCancel} options={t6} /></Box>;
    // $[12] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onCancel;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Box flexDirection="column" gap={1}>{t2}{t3}{t7}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t2 || $[17] !== t7) {
    // t8 暂存 `<Box flexDirection="column" gap={1}>{t2}{t3}{t7}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" gap={1}>{t2}{t3}{t7}</Box>;
    // $[16] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t2;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // t9 暂存 `<Dialog title="Hooks" subtitle={subtitle} onCancel={onCan...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== onCancel || $[20] !== subtitle || $[21] !== t8) {
    // t9 暂存 `<Dialog title="Hooks" subtitle={subtitle} onCancel={onCan...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Dialog title="Hooks" subtitle={subtitle} onCancel={onCancel}>{t8}</Dialog>;
    // $[19] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = onCancel;
    // $[20] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = subtitle;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[22];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJIb29rRXZlbnQiLCJIb29rRXZlbnRNZXRhZGF0YSIsIkJveCIsIkxpbmsiLCJUZXh0IiwicGx1cmFsIiwiU2VsZWN0IiwiRGlhbG9nIiwiUHJvcHMiLCJob29rRXZlbnRNZXRhZGF0YSIsIlJlY29yZCIsImhvb2tzQnlFdmVudCIsIlBhcnRpYWwiLCJ0b3RhbEhvb2tzQ291bnQiLCJyZXN0cmljdGVkQnlQb2xpY3kiLCJvblNlbGVjdEV2ZW50IiwiZXZlbnQiLCJvbkNhbmNlbCIsIlNlbGVjdEV2ZW50TW9kZSIsInQwIiwiJCIsIl9jIiwidDEiLCJzdWJ0aXRsZSIsInQyIiwiaW5mbyIsInQzIiwiU3ltYm9sIiwiZm9yIiwidDQiLCJ2YWx1ZSIsInQ1IiwiT2JqZWN0IiwiZW50cmllcyIsInQ2IiwibWFwIiwidDciLCJuYW1lIiwibWV0YWRhdGEiLCJjb3VudCIsImxhYmVsIiwiZGVzY3JpcHRpb24iLCJzdW1tYXJ5IiwidDgiLCJ0OSJdLCJzb3VyY2VzIjpbIlNlbGVjdEV2ZW50TW9kZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTZWxlY3RFdmVudE1vZGUgaXMgdGhlIGVudHJ5cG9pbnQgb2YgdGhlIEhvb2tzIGNvbmZpZyBtZW51LCB3aGVyZSB0aGUgdXNlclxuICogc2VlcyB0aGUgbGlzdCBvZiBhdmFpbGFibGUgaG9vayBldmVudHMuXG4gKlxuICogVGhlIC9ob29rcyBtZW51IGlzIHJlYWQtb25seTogc2VsZWN0aW5nIGFuIGV2ZW50IGxldHMgeW91IGJyb3dzZSBpdHNcbiAqIGNvbmZpZ3VyZWQgaG9va3MgYnV0IG5vdCBtb2RpZnkgdGhlbS4gVG8gYWRkIG9yIGNoYW5nZSBob29rcywgdXNlcnMgc2hvdWxkXG4gKiBlZGl0IHNldHRpbmdzLmpzb24gZGlyZWN0bHkgb3IgYXNrIENsYXVkZS5cbiAqL1xuXG5pbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IEhvb2tFdmVudCB9IGZyb20gJ3NyYy9lbnRyeXBvaW50cy9hZ2VudFNka1R5cGVzLmpzJ1xuaW1wb3J0IHR5cGUgeyBIb29rRXZlbnRNZXRhZGF0YSB9IGZyb20gJ3NyYy91dGlscy9ob29rcy9ob29rc0NvbmZpZ01hbmFnZXIuanMnXG5pbXBvcnQgeyBCb3gsIExpbmssIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBwbHVyYWwgfSBmcm9tICcuLi8uLi91dGlscy9zdHJpbmdVdGlscy5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgaG9va0V2ZW50TWV0YWRhdGE6IFJlY29yZDxIb29rRXZlbnQsIEhvb2tFdmVudE1ldGFkYXRhPlxuICBob29rc0J5RXZlbnQ6IFBhcnRpYWw8UmVjb3JkPEhvb2tFdmVudCwgbnVtYmVyPj5cbiAgdG90YWxIb29rc0NvdW50OiBudW1iZXJcbiAgcmVzdHJpY3RlZEJ5UG9saWN5OiBib29sZWFuXG4gIG9uU2VsZWN0RXZlbnQ6IChldmVudDogSG9va0V2ZW50KSA9PiB2b2lkXG4gIG9uQ2FuY2VsOiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTZWxlY3RFdmVudE1vZGUoe1xuICBob29rRXZlbnRNZXRhZGF0YSxcbiAgaG9va3NCeUV2ZW50LFxuICB0b3RhbEhvb2tzQ291bnQsXG4gIHJlc3RyaWN0ZWRCeVBvbGljeSxcbiAgb25TZWxlY3RFdmVudCxcbiAgb25DYW5jZWwsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHN1YnRpdGxlID0gYCR7dG90YWxIb29rc0NvdW50fSAke3BsdXJhbCh0b3RhbEhvb2tzQ291bnQsICdob29rJyl9IGNvbmZpZ3VyZWRgXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nIHRpdGxlPVwiSG9va3NcIiBzdWJ0aXRsZT17c3VidGl0bGV9IG9uQ2FuY2VsPXtvbkNhbmNlbH0+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICB7cmVzdHJpY3RlZEJ5UG9saWN5ICYmIChcbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPlxuICAgICAgICAgICAgICB7ZmlndXJlcy5pbmZvfSBIb29rcyBSZXN0cmljdGVkIGJ5IFBvbGljeVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIE9ubHkgaG9va3MgZnJvbSBtYW5hZ2VkIHNldHRpbmdzIGNhbiBydW4uIFVzZXItZGVmaW5lZCBob29rcyBmcm9tXG4gICAgICAgICAgICAgIH4vLmNsYXVkZS9zZXR0aW5ncy5qc29uLCAuY2xhdWRlL3NldHRpbmdzLmpzb24sIGFuZFxuICAgICAgICAgICAgICAuY2xhdWRlL3NldHRpbmdzLmxvY2FsLmpzb24gYXJlIGJsb2NrZWQuXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7ZmlndXJlcy5pbmZvfSBUaGlzIG1lbnUgaXMgcmVhZC1vbmx5LiBUbyBhZGQgb3IgbW9kaWZ5IGhvb2tzLCBlZGl0XG4gICAgICAgICAgICBzZXR0aW5ncy5qc29uIGRpcmVjdGx5IG9yIGFzayBDbGF1ZGUueycgJ31cbiAgICAgICAgICAgIDxMaW5rIHVybD1cImh0dHBzOi8vY29kZS5jbGF1ZGUuY29tL2RvY3MvZW4vaG9va3NcIj5MZWFybiBtb3JlPC9MaW5rPlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHtcbiAgICAgICAgICAgICAgb25TZWxlY3RFdmVudCh2YWx1ZSBhcyBIb29rRXZlbnQpXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgICAgICAgb3B0aW9ucz17T2JqZWN0LmVudHJpZXMoaG9va0V2ZW50TWV0YWRhdGEpLm1hcChcbiAgICAgICAgICAgICAgKFtuYW1lLCBtZXRhZGF0YV0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGhvb2tzQnlFdmVudFtuYW1lIGFzIEhvb2tFdmVudF0gfHwgMFxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICBsYWJlbDpcbiAgICAgICAgICAgICAgICAgICAgY291bnQgPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAge25hbWV9IDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPih7Y291bnR9KTwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogbWV0YWRhdGEuc3VtbWFyeSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5n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