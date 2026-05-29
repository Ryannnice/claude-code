// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 React、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useState } from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 引入 TextInput，将 ./TextInput.js 中已经封装好的能力接到本文件流程里。
import TextInput from './TextInput.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  initialLanguage: string | undefined;
  // 这个回调绑定到 onComplete: (language: string | undefined) => void;，负责终端渲染在该局部场景下的响应。
  onComplete: (language: string | undefined) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// LanguagePicker 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function LanguagePicker(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    initialLanguage,
    onComplete,
    onCancel
  } = t0;
  // language 由 React state 持有，setLanguage 会在用户操作或异步结果返回时触发刷新。
  const [language, setLanguage] = useState(initialLanguage);
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState((initialLanguage ?? "").length);
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      context: "Settings"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t1);
  // t2 暂存 `function handleSubmit() {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== language || $[2] !== onComplete) {
    // t2 暂存 `function handleSubmit() {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function handleSubmit() {
      // trimmed格式化`trim`，供终端渲染后续处理使用。
      const trimmed = language?.trim();
      // 调用 onComplete，触发终端渲染此处需要的副作用。
      onComplete(trimmed || undefined);
    };
    // $[1] 缓存 `language`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = language;
    // $[2] 缓存 `onComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onComplete;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // handleSubmit沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSubmit = t2;
  // t3 暂存 `<Text>Enter your preferred response and voice language:</...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text>Enter your preferred response and voice language:</...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Enter your preferred response and voice language:</Text>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<Text>{figures.pointer}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Text>{figures.pointer}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text>{figures.pointer}</Text>;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // 临时值 t5 命名 `language ?? ""`，让后续代码直接表达这个值的用途。
  const t5 = language ?? "";
  // t6 暂存 `<Box flexDirection="row" gap={1}>{t4}<TextInput value={t5...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== cursorOffset || $[7] !== handleSubmit || $[8] !== t5) {
    // t6 暂存 `<Box flexDirection="row" gap={1}>{t4}<TextInput value={t5...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="row" gap={1}>{t4}<TextInput value={t5} onChange={setLanguage} onSubmit={handleSubmit} focus={true} showCursor={true} placeholder={`e.g., Japanese, 日本語, Español${figures.ellipsis}`} columns={60} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} /></Box>;
    // $[6] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = cursorOffset;
    // $[7] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = handleSubmit;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `<Text dimColor={true}>Leave empty for default (English)</...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text dimColor={true}>Leave empty for default (English)</...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text dimColor={true}>Leave empty for default (English)</Text>;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // t8 暂存 `<Box flexDirection="column" gap={1}>{t3}{t6}{t7}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t6) {
    // t8 暂存 `<Box flexDirection="column" gap={1}>{t3}{t6}{t7}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" gap={1}>{t3}{t6}{t7}</Box>;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
    // $[12] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[12];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VTdGF0ZSIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiVGV4dElucHV0IiwiUHJvcHMiLCJpbml0aWFsTGFuZ3VhZ2UiLCJvbkNvbXBsZXRlIiwibGFuZ3VhZ2UiLCJvbkNhbmNlbCIsIkxhbmd1YWdlUGlja2VyIiwidDAiLCIkIiwiX2MiLCJzZXRMYW5ndWFnZSIsImN1cnNvck9mZnNldCIsInNldEN1cnNvck9mZnNldCIsImxlbmd0aCIsInQxIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQyIiwiaGFuZGxlU3VibWl0IiwidHJpbW1lZCIsInRyaW0iLCJ1bmRlZmluZWQiLCJ0MyIsInQ0IiwicG9pbnRlciIsInQ1IiwidDYiLCJlbGxpcHNpcyIsInQ3IiwidDgiXSwic291cmNlcyI6WyJMYW5ndWFnZVBpY2tlci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgVGV4dElucHV0IGZyb20gJy4vVGV4dElucHV0LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBpbml0aWFsTGFuZ3VhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZFxuICBvbkNvbXBsZXRlOiAobGFuZ3VhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4gdm9pZFxuICBvbkNhbmNlbDogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gTGFuZ3VhZ2VQaWNrZXIoe1xuICBpbml0aWFsTGFuZ3VhZ2UsXG4gIG9uQ29tcGxldGUsXG4gIG9uQ2FuY2VsLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbbGFuZ3VhZ2UsIHNldExhbmd1YWdlXSA9IHVzZVN0YXRlKGluaXRpYWxMYW5ndWFnZSlcbiAgY29uc3QgW2N1cnNvck9mZnNldCwgc2V0Q3Vyc29yT2Zmc2V0XSA9IHVzZVN0YXRlKFxuICAgIChpbml0aWFsTGFuZ3VhZ2UgPz8gJycpLmxlbmd0aCxcbiAgKVxuXG4gIC8vIFVzZSBjb25maWd1cmFibGUga2V5YmluZGluZyBmb3IgRVNDIHRvIGNhbmNlbFxuICAvLyBVc2UgU2V0dGluZ3MgY29udGV4dCBzbyAnbicga2V5IGRvZXNuJ3QgdHJpZ2dlciBjYW5jZWwgKGFsbG93cyB0eXBpbmcgJ24nIGluIGlucHV0KVxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgb25DYW5jZWwsIHsgY29udGV4dDogJ1NldHRpbmdzJyB9KVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdCgpOiB2b2lkIHtcbiAgICBjb25zdCB0cmltbWVkID0gbGFuZ3VhZ2U/LnRyaW0oKVxuICAgIG9uQ29tcGxldGUodHJpbW1lZCB8fCB1bmRlZmluZWQpXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICA8VGV4dD5FbnRlciB5b3VyIHByZWZlcnJlZCByZXNwb25zZSBhbmQgdm9pY2UgbGFuZ3VhZ2U6PC9UZXh0PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsxfT5cbiAgICAgICAgPFRleHQ+e2ZpZ3VyZXMucG9pbnRlcn08L1RleHQ+XG4gICAgICAgIDxUZXh0SW5wdXRcbiAgICAgICAgICB2YWx1ZT17bGFuZ3VhZ2UgPz8gJyd9XG4gICAgICAgICAgb25DaGFuZ2U9e3NldExhbmd1YWdlfVxuICAgICAgICAgIG9uU3VibWl0PXtoYW5kbGVTdWJtaXR9XG4gICAgICAgICAgZm9jdXM9e3RydWV9XG4gICAgICAgICAgc2hvd0N1cnNvcj17dHJ1ZX1cbiAgICAgICAgICBwbGFjZWhvbGRlcj17YGUuZy4sIEphcGFuZXNlLCDml6XmnKzoqp4sIEVzcGHDsW9sJHtmaWd1cmVzLmVsbGlwc2lzfWB9XG4gICAgICAgICAgY29sdW1ucz17NjB9XG4gICAgICAgICAgY3Vyc29yT2Zmc2V0PXtjdXJzb3JPZmZzZXR9XG4gICAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9e3NldEN1cnNvck9mZnNldH1cbiAgICAgICAgLz5cbiAgICAgIDwvQm94PlxuICAgICAgPFRleHQgZGltQ29sb3I+TGVhdmUgZW1wdHkgZm9yIGRlZmF1bHQgKEVuZ2xpc2gpPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPQyxLQUFLLElBQUlDLFFBQVEsUUFBUSxPQUFPO0FBQ3ZDLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0MsYUFBYSxRQUFRLGlDQUFpQztBQUMvRCxPQUFPQyxTQUFTLE1BQU0sZ0JBQWdCO0FBRXRDLEtBQUtDLEtBQUssR0FBRztFQUNYQyxlQUFlLEVBQUUsTUFBTSxHQUFHLFNBQVM7RUFDbkNDLFVBQVUsRUFBRSxDQUFDQyxRQUFRLEVBQUUsTUFBTSxHQUFHLFNBQVMsRUFBRSxHQUFHLElBQUk7RUFDbERDLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtBQUN0QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxlQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXdCO0lBQUFQLGVBQUE7SUFBQUMsVUFBQTtJQUFBRTtFQUFBLElBQUFFLEVBSXZCO0VBQ04sT0FBQUgsUUFBQSxFQUFBTSxXQUFBLElBQWdDZCxRQUFRLENBQUNNLGVBQWUsQ0FBQztFQUN6RCxPQUFBUyxZQUFBLEVBQUFDLGVBQUEsSUFBd0NoQixRQUFRLENBQzlDLENBQUNNLGVBQXFCLElBQXJCLEVBQXFCLEVBQUFXLE1BQ3hCLENBQUM7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBTyxNQUFBLENBQUFDLEdB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