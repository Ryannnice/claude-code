// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { PromptRequest } 来自 ../../types/hooks.js，用于校准终端渲染的数据契约。
import type { PromptRequest } from '../../types/hooks.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 PermissionDialog，将 ../permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../permissions/PermissionDialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  title: string;
  toolInputSummary?: string | null;
  request: PromptRequest;
  // 这个回调绑定到 onRespond: (key: string) => void;，负责终端渲染在该局部场景下的响应。
  onRespond: (key: string) => void;
  // 这个回调绑定到 onAbort: () => void;，负责终端渲染在该局部场景下的响应。
  onAbort: () => void;
};
// PromptDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    toolInputSummary,
    request,
    onRespond,
    onAbort
  } = t0;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      isActive: true
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("app:interrupt", onAbort, t1);
  // t2 暂存 `request.options.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== request.options) {
    // t2 暂存 `request.options.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t2 = request.options.map(_temp);
    // $[1] 缓存 `request.options`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = request.options;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 选项保存`t2`，作为后续临时缓存值处理的输入。
  const options = t2;
  // t3 暂存 `toolInputSummary ? <Text dimColor={true}>{toolInputSummar...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== toolInputSummary) {
    // t3 暂存 `toolInputSummary ? <Text dimColor={true}>{toolInputSummar...` 生成的渲染片段，后续返回路径直接复用。
    t3 = toolInputSummary ? <Text dimColor={true}>{toolInputSummary}</Text> : undefined;
    // $[3] 缓存 `toolInputSummary`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = toolInputSummary;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== onRespond) {
    // t4 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = value => {
      // 调用 onRespond，触发终端渲染此处需要的副作用。
      onRespond(value);
    };
    // $[5] 缓存 `onRespond`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onRespond;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Box flexDirection="column" paddingY={1}><Select options=...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== options || $[8] !== t4) {
    // t5 暂存 `<Box flexDirection="column" paddingY={1}><Select options=...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" paddingY={1}><Select options={options} onChange={t4} /></Box>;
    // $[7] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = options;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `<PermissionDialog title={title} subtitle={request.message...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== request.message || $[11] !== t3 || $[12] !== t5 || $[13] !== title) {
    // t6 暂存 `<PermissionDialog title={title} subtitle={request.message...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <PermissionDialog title={title} subtitle={request.message} titleRight={t3}>{t5}</PermissionDialog>;
    // $[10] 缓存 `request.message`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = request.message;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = title;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(opt) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: opt.label,
    value: opt.key,
    description: opt.description
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiUHJvbXB0UmVxdWVzdCIsIlNlbGVjdCIsIlBlcm1pc3Npb25EaWFsb2ciLCJQcm9wcyIsInRpdGxlIiwidG9vbElucHV0U3VtbWFyeSIsInJlcXVlc3QiLCJvblJlc3BvbmQiLCJrZXkiLCJvbkFib3J0IiwiUHJvbXB0RGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsImlzQWN0aXZlIiwidDIiLCJvcHRpb25zIiwibWFwIiwiX3RlbXAiLCJ0MyIsInVuZGVmaW5lZCIsInQ0IiwidmFsdWUiLCJ0NSIsInQ2IiwibWVzc2FnZSIsIm9wdCIsImxhYmVsIiwiZGVzY3JpcHRpb24iXSwic291cmNlcyI6WyJQcm9tcHREaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgdHlwZSB7IFByb21wdFJlcXVlc3QgfSBmcm9tICcuLi8uLi90eXBlcy9ob29rcy5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi4vcGVybWlzc2lvbnMvUGVybWlzc2lvbkRpYWxvZy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgdGl0bGU6IHN0cmluZ1xuICB0b29sSW5wdXRTdW1tYXJ5Pzogc3RyaW5nIHwgbnVsbFxuICByZXF1ZXN0OiBQcm9tcHRSZXF1ZXN0XG4gIG9uUmVzcG9uZDogKGtleTogc3RyaW5nKSA9PiB2b2lkXG4gIG9uQWJvcnQ6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByb21wdERpYWxvZyh7XG4gIHRpdGxlLFxuICB0b29sSW5wdXRTdW1tYXJ5LFxuICByZXF1ZXN0LFxuICBvblJlc3BvbmQsXG4gIG9uQWJvcnQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHVzZUtleWJpbmRpbmcoJ2FwcDppbnRlcnJ1cHQnLCBvbkFib3J0LCB7IGlzQWN0aXZlOiB0cnVlIH0pXG5cbiAgY29uc3Qgb3B0aW9ucyA9IHJlcXVlc3Qub3B0aW9ucy5tYXAob3B0ID0+ICh7XG4gICAgbGFiZWw6IG9wdC5sYWJlbCxcbiAgICB2YWx1ZTogb3B0LmtleSxcbiAgICBkZXNjcmlwdGlvbjogb3B0LmRlc2NyaXB0aW9uLFxuICB9KSlcblxuICByZXR1cm4gKFxuICAgIDxQZXJtaXNzaW9uRGlhbG9nXG4gICAgICB0aXRsZT17dGl0bGV9XG4gICAgICBzdWJ0aXRsZT17cmVxdWVzdC5tZXNzYWdlfVxuICAgICAgdGl0bGVSaWdodD17XG4gICAgICAgIHRvb2xJbnB1dFN1bW1hcnkgPyA8VGV4dCBkaW1Db2xvcj57dG9vbElucHV0U3VtbWFyeX08L1RleHQ+IDogdW5kZWZpbmVkXG4gICAgICB9XG4gICAgPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1k9ezF9PlxuICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICBvbkNoYW5nZT17dmFsdWUgPT4ge1xuICAgICAgICAgICAgb25SZXNwb25kKHZhbHVlKVxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICA8L1Blcm1pc3Npb25EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ2xFLGNBQWNDLGFBQWEsUUFBUSxzQkFBc0I7QUFDekQs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