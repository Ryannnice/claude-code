// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * ViewHookMode shows read-only details for a single configured hook.
 *
 * The /hooks menu is read-only; this view replaces the former delete-hook
 * confirmation screen and directs users to settings.json or Claude for edits.
 */
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 hookSourceDescriptionDisplayString、IndividualHookConfig 工具函数，把通用处理留在 ../../utils/hooks/hooksSettings.js 中维护。
import { hookSourceDescriptionDisplayString, type IndividualHookConfig } from '../../utils/hooks/hooksSettings.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  selectedHook: IndividualHookConfig;
  eventSupportsMatcher: boolean;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// ViewHookMode 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ViewHookMode(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(40);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    selectedHook,
    eventSupportsMatcher,
    onCancel
  } = t0;
  // t1 暂存 `<Text>Event: <Text bold={true}>{selectedHook.event}</Text...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== selectedHook.event) {
    // t1 暂存 `<Text>Event: <Text bold={true}>{selectedHook.event}</Text...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text>Event: <Text bold={true}>{selectedHook.event}</Text></Text>;
    // $[0] 缓存 `selectedHook.event`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = selectedHook.event;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `eventSupportsMatcher && <Text>Matcher: <Text bold={true}>...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== eventSupportsMatcher || $[3] !== selectedHook.matcher) {
    // t2 暂存 `eventSupportsMatcher && <Text>Matcher: <Text bold={true}>...` 生成的渲染片段，后续返回路径直接复用。
    t2 = eventSupportsMatcher && <Text>Matcher: <Text bold={true}>{selectedHook.matcher || "(all)"}</Text></Text>;
    // $[2] 缓存 `eventSupportsMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = eventSupportsMatcher;
    // $[3] 缓存 `selectedHook.matcher`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = selectedHook.matcher;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text>Type: <Text bold={true}>{selectedHook.config.type}<...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== selectedHook.config.type) {
    // t3 暂存 `<Text>Type: <Text bold={true}>{selectedHook.config.type}<...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Type: <Text bold={true}>{selectedHook.config.type}</Text></Text>;
    // $[5] 缓存 `selectedHook.config.type`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = selectedHook.config.type;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // t4 暂存 `hookSourceDescriptionDisplayString(selectedHook.source)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== selectedHook.source) {
    // t4 暂存 `hookSourceDescriptionDisplayString(selectedHook.source)` 生成的渲染片段，后续返回路径直接复用。
    t4 = hookSourceDescriptionDisplayString(selectedHook.source);
    // $[7] 缓存 `selectedHook.source`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = selectedHook.source;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // t5 暂存 `<Text>Source:{" "}<Text dimColor={true}>{t4}</Text></Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t4) {
    // t5 暂存 `<Text>Source:{" "}<Text dimColor={true}>{t4}</Text></Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>Source:{" "}<Text dimColor={true}>{t4}</Text></Text>;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `selectedHook.pluginName && <Text>Plugin: <Text dimColor={...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== selectedHook.pluginName) {
    // t6 暂存 `selectedHook.pluginName && <Text>Plugin: <Text dimColor={...` 生成的渲染片段，后续返回路径直接复用。
    t6 = selectedHook.pluginName && <Text>Plugin: <Text dimColor={true}>{selectedHook.pluginName}</Text></Text>;
    // $[11] 缓存 `selectedHook.pluginName`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = selectedHook.pluginName;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `<Box flexDirection="column">{t1}{t2}{t3}{t5}{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t1 || $[14] !== t2 || $[15] !== t3 || $[16] !== t5 || $[17] !== t6) {
    // t7 暂存 `<Box flexDirection="column">{t1}{t2}{t3}{t5}{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column">{t1}{t2}{t3}{t5}{t6}</Box>;
    // $[13] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t1;
    // $[14] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t2;
    // $[15] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t3;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[18];
  }
  // t8 暂存 `getContentFieldLabel(selectedHook.config)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== selectedHook.config) {
    // t8 暂存 `getContentFieldLabel(selectedHook.config)` 生成的渲染片段，后续返回路径直接复用。
    t8 = getContentFieldLabel(selectedHook.config);
    // $[19] 缓存 `selectedHook.config`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = selectedHook.config;
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
  }
  // t9 暂存 `<Text dimColor={true}>{t8}:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t8) {
    // t9 暂存 `<Text dimColor={true}>{t8}:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text dimColor={true}>{t8}:</Text>;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[22];
  }
  // t10 暂存 `getContentFieldValue(selectedHook.config)` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== selectedHook.config) {
    // t10 暂存 `getContentFieldValue(selectedHook.config)` 生成的渲染片段，后续返回路径直接复用。
    t10 = getContentFieldValue(selectedHook.config);
    // $[23] 缓存 `selectedHook.config`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = selectedHook.config;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // t11 暂存 `<Box borderStyle="round" borderDimColor={true} paddingLef...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== t10) {
    // t11 暂存 `<Box borderStyle="round" borderDimColor={true} paddingLef...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box borderStyle="round" borderDimColor={true} paddingLeft={1} paddingRight={1}><Text>{t10}</Text></Box>;
    // $[25] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t10;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
  }
  // t12 暂存 `<Box flexDirection="column">{t9}{t11}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== t11 || $[28] !== t9) {
    // t12 暂存 `<Box flexDirection="column">{t9}{t11}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box flexDirection="column">{t9}{t11}</Box>;
    // $[27] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t11;
    // $[28] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t9;
    // $[29] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[29];
  }
  // t13 暂存 `"statusMessage" in selectedHook.config && selectedHook.co...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== selectedHook.config) {
    // t13 暂存 `"statusMessage" in selectedHook.config && selectedHook.co...` 生成的渲染片段，后续返回路径直接复用。
    t13 = "statusMessage" in selectedHook.config && selectedHook.config.statusMessage && <Text>Status message:{" "}<Text dimColor={true}>{selectedHook.config.statusMessage}</Text></Text>;
    // $[30] 缓存 `selectedHook.config`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = selectedHook.config;
    // $[31] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[31];
  }
  // t14 暂存 `<Text dimColor={true}>To modify or remove this hook, edit...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
    // t14 暂存 `<Text dimColor={true}>To modify or remove this hook, edit...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text dimColor={true}>To modify or remove this hook, edit settings.json directly or ask Claude to help.</Text>;
    // $[32] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[32];
  }
  // t15 暂存 `<Box flexDirection="column" gap={1}>{t7}{t12}{t13}{t14}</...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[33] !== t12 || $[34] !== t13 || $[35] !== t7) {
    // t15 暂存 `<Box flexDirection="column" gap={1}>{t7}{t12}{t13}{t14}</...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Box flexDirection="column" gap={1}>{t7}{t12}{t13}{t14}</Box>;
    // $[33] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t12;
    // $[34] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t13;
    // $[35] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t7;
    // $[36] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[36];
  }
  // t16 暂存 `<Dialog title="Hook details" onCancel={onCancel} inputGui...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[37] !== onCancel || $[38] !== t15) {
    // t16 暂存 `<Dialog title="Hook details" onCancel={onCancel} inputGui...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Dialog title="Hook details" onCancel={onCancel} inputGuide={_temp}>{t15}</Dialog>;
    // $[37] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = onCancel;
    // $[38] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t15;
    // $[39] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[39];
  }
  // 返回 `t16`，作为终端渲染这次计算的结果。
  return t16;
}

/**
 * Get a human-readable label for the primary content field of a hook
 * based on its type.
 */
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `<Text>Esc to go back</Text>`，作为终端渲染这次计算的结果。
  return <Text>Esc to go back</Text>;
}
// getContentFieldLabel 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getContentFieldLabel(config: IndividualHookConfig['config']): string {
  // 按照 config.type 的取值选择终端渲染的具体处理分支。
  switch (config.type) {
    case 'command':
      // 返回 `'Command'`，作为终端渲染这次计算的结果。
      return 'Command';
    case 'prompt':
      // 返回 `'Prompt'`，作为终端渲染这次计算的结果。
      return 'Prompt';
    case 'agent':
      // 返回 `'Prompt'`，作为终端渲染这次计算的结果。
      return 'Prompt';
    case 'http':
      // 返回 `'URL'`，作为终端渲染这次计算的结果。
      return 'URL';
  }
}

/**
 * Get the actual content value for a hook's primary field, bypassing
 * statusMessage so the detail view always shows the real command/prompt/URL.
 */
// getContentFieldValue 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getContentFieldValue(config: IndividualHookConfig['config']): string {
  // 按照 config.type 的取值选择终端渲染的具体处理分支。
  switch (config.type) {
    case 'command':
      // 返回 `config.command`，作为终端渲染这次计算的结果。
      return config.command;
    case 'prompt':
      // 返回 `config.prompt`，作为终端渲染这次计算的结果。
      return config.prompt;
    case 'agent':
      // 返回 `config.prompt`，作为终端渲染这次计算的结果。
      return config.prompt;
    case 'http':
      // 返回 `config.url`，作为终端渲染这次计算的结果。
      return config.url;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJob29rU291cmNlRGVzY3JpcHRpb25EaXNwbGF5U3RyaW5nIiwiSW5kaXZpZHVhbEhvb2tDb25maWciLCJEaWFsb2ciLCJQcm9wcyIsInNlbGVjdGVkSG9vayIsImV2ZW50U3VwcG9ydHNNYXRjaGVyIiwib25DYW5jZWwiLCJWaWV3SG9va01vZGUiLCJ0MCIsIiQiLCJfYyIsInQxIiwiZXZlbnQiLCJ0MiIsIm1hdGNoZXIiLCJ0MyIsImNvbmZpZyIsInR5cGUiLCJ0NCIsInNvdXJjZSIsInQ1IiwidDYiLCJwbHVnaW5OYW1lIiwidDciLCJ0OCIsImdldENvbnRlbnRGaWVsZExhYmVsIiwidDkiLCJ0MTAiLCJnZXRDb250ZW50RmllbGRWYWx1ZSIsInQxMSIsInQxMiIsInQxMyIsInN0YXR1c01lc3NhZ2UiLCJ0MTQiLCJTeW1ib2wiLCJmb3IiLCJ0MTUiLCJ0MTYiLCJfdGVtcCIsImNvbW1hbmQiLCJwcm9tcHQiLCJ1cmwiXSwic291cmNlcyI6WyJWaWV3SG9va01vZGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVmlld0hvb2tNb2RlIHNob3dzIHJlYWQtb25seSBkZXRhaWxzIGZvciBhIHNpbmdsZSBjb25maWd1cmVkIGhvb2suXG4gKlxuICogVGhlIC9ob29rcyBtZW51IGlzIHJlYWQtb25seTsgdGhpcyB2aWV3IHJlcGxhY2VzIHRoZSBmb3JtZXIgZGVsZXRlLWhvb2tcbiAqIGNvbmZpcm1hdGlvbiBzY3JlZW4gYW5kIGRpcmVjdHMgdXNlcnMgdG8gc2V0dGluZ3MuanNvbiBvciBDbGF1ZGUgZm9yIGVkaXRzLlxuICovXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7XG4gIGhvb2tTb3VyY2VEZXNjcmlwdGlvbkRpc3BsYXlTdHJpbmcsXG4gIHR5cGUgSW5kaXZpZHVhbEhvb2tDb25maWcsXG59IGZyb20gJy4uLy4uL3V0aWxzL2hvb2tzL2hvb2tzU2V0dGluZ3MuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgc2VsZWN0ZWRIb29rOiBJbmRpdmlkdWFsSG9va0NvbmZpZ1xuICBldmVudFN1cHBvcnRzTWF0Y2hlcjogYm9vbGVhblxuICBvbkNhbmNlbDogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gVmlld0hvb2tNb2RlKHtcbiAgc2VsZWN0ZWRIb29rLFxuICBldmVudFN1cHBvcnRzTWF0Y2hlcixcbiAgb25DYW5jZWwsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPERpYWxvZ1xuICAgICAgdGl0bGU9XCJIb29rIGRldGFpbHNcIlxuICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgaW5wdXRHdWlkZT17KCkgPT4gPFRleHQ+RXNjIHRvIGdvIGJhY2s8L1RleHQ+fVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgRXZlbnQ6IDxUZXh0IGJvbGQ+e3NlbGVjdGVkSG9vay5ldmVudH08L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIHtldmVudFN1cHBvcnRzTWF0Y2hlciAmJiAoXG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgTWF0Y2hlcjogPFRleHQgYm9sZD57c2VsZWN0ZWRIb29rLm1hdGNoZXIgfHwgJyhhbGwpJ308L1RleHQ+XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIFR5cGU6IDxUZXh0IGJvbGQ+e3NlbGVjdGVkSG9vay5jb25maWcudHlwZX08L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgU291cmNlOnsnICd9XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAge2hvb2tTb3VyY2VEZXNjcmlwdGlvbkRpc3BsYXlTdHJpbmcoc2VsZWN0ZWRIb29rLnNvdXJjZSl9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIHtzZWxlY3RlZEhvb2sucGx1Z2luTmFtZSAmJiAoXG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgUGx1Z2luOiA8VGV4dCBkaW1Db2xvcj57c2VsZWN0ZWRIb29rLnBsdWdpbk5hbWV9PC9UZXh0PlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICl9XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57Z2V0Q29udGVudEZpZWxkTGFiZWwoc2VsZWN0ZWRIb29rLmNvbmZpZyl9OjwvVGV4dD5cbiAgICAgICAgICA8Qm94XG4gICAgICAgICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgICAgICAgIGJvcmRlckRpbUNvbG9yXG4gICAgICAgICAgICBwYWRkaW5nTGVmdD17MX1cbiAgICAgICAgICAgIHBhZGRpbmdSaWdodD17MX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8VGV4dD57Z2V0Q29udGVudEZpZWxkVmFsdWUoc2VsZWN0ZWRIb29rLmNvbmZpZyl9PC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgeydzdGF0dXNNZXNzYWdlJyBpbiBzZWxlY3RlZEhvb2suY29uZmlnICYmXG4gICAgICAgICAgc2VsZWN0ZWRIb29rLmNvbmZpZy5zdGF0dXNNZXNzYWdlICYmIChcbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICBTdGF0dXMgbWVzc2FnZTp7JyAnfVxuICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57c2VsZWN0ZWRIb29rLmNvbmZpZy5zdGF0dXNNZXNzYWdlfTwvVGV4dD5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICBUbyBtb2RpZnkgb3IgcmVtb3ZlIHRoaXMgaG9vaywgZWRpdCBzZXR0aW5ncy5qc29uIGRpcmVjdGx5IG9yIGFza1xuICAgICAgICAgIENsYXVkZSB0byBoZWxwLlxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuXG4vKipcbiAqIEdldCBhIGh1bWFuLXJlYWRhYmxlIGxhYmVsIGZvciB0aGUgcHJpbWFyeSBjb250ZW50IGZpZWxkIG9mIGEgaG9va1xuICogYmFzZWQgb24gaXRzIHR5cGUuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRlbnRGaWVsZExhYmVsKGNvbmZpZzogSW5kaXZpZHVhbEhvb2tDb25maWdbJ2NvbmZpZyddKTogc3RyaW5nIHtcbiAgc3dpdGNoIChjb25maWcudHlwZSkge1xuICAgIGNhc2UgJ2NvbW1hbmQnOlxuICAgICAgcmV0dXJuICdDb21tYW5kJ1xuICAgIGNhc2UgJ3Byb21wdCc6XG4gICAgICByZXR1cm4gJ1Byb21wdCdcbiAgICBjYXNlICdhZ2VudCc6XG4gICAgICByZXR1cm4gJ1Byb21wdCdcbiAgICBjYXNlICdodHRwJzpcbiAgICAgIHJldHVybiAnVVJMJ1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBhY3R1YWwgY29udGVudCB2YWx1ZSBmb3IgYSBob29rJ3MgcHJpbWFyeSBmaWVsZCwgYnlwYXNzaW5nXG4gKiBzdGF0dXNNZXNzYWdlIHNvIHRoZSBkZXRhaWwgdmlldyBhbHdheXMgc2hvd3MgdGhlIHJlYWwgY29tbWFuZC9wcm9tcHQvVVJMLlxuICovXG5mdW5jdGlvbiBnZXRDb250ZW50RmllbGRWYWx1ZShjb25maWc6IEluZGl2aWR1YWxIb29rQ29uZmlnWydjb25maWcnXSk6IHN0cmluZyB7XG4gIHN3aXRjaCAoY29uZmlnLnR5cGUpIHtcbiAgICBjYXNlICdjb21tYW5kJzpcbiAgICAgIHJldHVybiBjb25maWcuY29tbWFuZFxuICAgIGNhc2UgJ3Byb21wdCc6XG4gICAgICByZXR1cm4gY29uZmlnLnByb21wdFxuICAgIGNhc2UgJ2FnZW50JzpcbiAgICAgIHJldHVybiBjb25maWcucHJvbXB0XG4gICAgY2FzZSAnaHR0cCc6XG4gICAgICByZXR1cm4gY29uZmlnLnVybFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FDRUMsa0NBQWtDLEVBQ2xDLEtBQUtDLG9CQUFvQixRQUNwQixvQ0FBb0M7QUFDM0MsU0FBU0MsTUFBTSxRQUFRLDRCQUE0QjtBQUVuRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsWUFBWSxFQUFFSCxvQkFBb0I7RUFDbENJLG9CQUFvQixFQUFFLE9BQU87RUFDN0JDLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtBQUN0QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxhQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXNCO0lBQUFOLFlBQUE7SUFBQUMsb0JBQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUlyQjtFQUFBLElBQUFHLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFMLFlBQUEsQ0FBQVEsS0FBQTtJQVNFRCxFQUFBLElBQUMsSUFBSSxDQUFDLE9BQ0csQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFFLENBQUFQLFlBQVksQ0FBQVEsS0FBSyxDQUFFLEVBQTlCLElBQUksQ0FDZCxFQUZDLElBQUksQ0FFRTtJQUFBSCxDQUFBLE1BQUFMLFlBQUEsQ0FBQVEsS0FBQTtJ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