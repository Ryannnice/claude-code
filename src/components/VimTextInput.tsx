// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 useClipboardImageHint，将 ../hooks/useClipboardImageHint.js 中已经封装好的能力接到本文件流程里。
import { useClipboardImageHint } from '../hooks/useClipboardImageHint.js';
// 引入 useVimInput，将 ../hooks/useVimInput.js 中已经封装好的能力接到本文件流程里。
import { useVimInput } from '../hooks/useVimInput.js';
// 引入 Box、color、useTerminalFocus、useTheme，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, color, useTerminalFocus, useTheme } from '../ink.js';
// 类型依赖 { VimTextInputProps } 来自 ../types/textInputTypes.js，用于校准终端渲染的数据契约。
import type { VimTextInputProps } from '../types/textInputTypes.js';
// 类型依赖 { TextHighlight } 来自 ../utils/textHighlighting.js，用于校准终端渲染的数据契约。
import type { TextHighlight } from '../utils/textHighlighting.js';
// 引入 BaseTextInput，将 ./BaseTextInput.js 中已经封装好的能力接到本文件流程里。
import { BaseTextInput } from './BaseTextInput.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = VimTextInputProps & {
  highlights?: TextHighlight[];
};
// 终端 UI 组件 Vim Text Input在这里处理 `export default function VimTextInput(props) {`，完成这一小步状态转换。
export default function VimTextInput(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(38);
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Vim Text Input分别处理这些返回值。
  const [theme] = useTheme();
  // isTerminalFocused记录 `useTerminalFocus` 是否成立，终端渲染随后按该结果分支。
  const isTerminalFocused = useTerminalFocus();
  // 调用 useClipboardImageHint，触发终端渲染此处需要的副作用。
  useClipboardImageHint(isTerminalFocused, !!props.onImagePaste);
  // 临时值 t0 命名 `props.value`，让后续代码直接表达这个值的用途。
  const t0 = props.value;
  // 临时值 t1 命名 `props.onChange`，让后续代码直接表达这个值的用途。
  const t1 = props.onChange;
  // 临时值 t2 命名 `props.onSubmit`，让后续代码直接表达这个值的用途。
  const t2 = props.onSubmit;
  // 临时值 t3 命名 `props.onExit`，让后续代码直接表达这个值的用途。
  const t3 = props.onExit;
  // t4保存`props.onExitMessage`，供终端 UI Vim Text Input后续判断或输出使用。
  const t4 = props.onExitMessage;
  // t5保存`props.onHistoryReset`，供后续判断或组装使用。
  const t5 = props.onHistoryReset;
  // t6保存`props.onHistoryUp`，供后续判断或组装使用。
  const t6 = props.onHistoryUp;
  // 临时值 t7 命名 `props.onHistoryDown`，让后续代码直接表达这个值的用途。
  const t7 = props.onHistoryDown;
  // t8保存`props.onClearInput`，供后续判断或组装使用。
  const t8 = props.onClearInput;
  // t9保存`props.focus`，供终端 UI Vim Text Input后续判断或输出使用。
  const t9 = props.focus;
  // t10保存`props.mask`，供后续判断或组装使用。
  const t10 = props.mask;
  // t11保存`props.multiline`，供后续判断或组装使用。
  const t11 = props.multiline;
  // t12保存`props.showCursor ? " " : ""`，供终端 UI Vim Text Input后续判断或输出使用。
  const t12 = props.showCursor ? " " : "";
  // t13保存`props.highlightPastedText`，供后续判断或组装使用。
  const t13 = props.highlightPastedText;
  // 临时值 t14 命名 `isTerminalFocused ? chalk.inverse : _temp`，让后续代码直接表达这个值的用途。
  const t14 = isTerminalFocused ? chalk.inverse : _temp;
  // t15 暂存 `color("text", theme)` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== theme) {
    // t15 暂存 `color("text", theme)` 生成的渲染片段，后续返回路径直接复用。
    t15 = color("text", theme);
    // $[0] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = theme;
    // $[1] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[1];
  }
  // t16 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== props.columns || $[3] !== props.cursorOffset || $[4] !== props.disableCursorMovementForUpDownKeys || $[5] !== props.disableEscapeDoublePress || $[6] !== props.focus || $[7] !== props.highlightPastedText || $[8] !== props.inputFilter || $[9] !== props.mask || $[10] !== props.maxVisibleLines || $[11] !== props.multiline || $[12] !== props.onChange || $[13] !== props.onChangeCursorOffset || $[14] !== props.onClearInput || $[15] !== props.onExit || $[16] !== props.onExitMessage || $[17] !== props.onHistoryDown || $[18] !== props.onHistoryReset || $[19] !== props.onHistoryUp || $[20] !== props.onImagePaste || $[21] !== props.onModeChange || $[22] !== props.onSubmit || $[23] !== props.onUndo || $[24] !== props.value || $[25] !== t12 || $[26] !== t14 || $[27] !== t15) {
    // t16 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t16 = {
      value: t0,
      onChange: t1,
      onSubmit: t2,
      onExit: t3,
      onExitMessage: t4,
      onHistoryReset: t5,
      onHistoryUp: t6,
      onHistoryDown: t7,
      onClearInput: t8,
      focus: t9,
      mask: t10,
      multiline: t11,
      cursorChar: t12,
      highlightPastedText: t13,
      invert: t14,
      themeText: t15,
      columns: props.columns,
      maxVisibleLines: props.maxVisibleLines,
      onImagePaste: props.onImagePaste,
      disableCursorMovementForUpDownKeys: props.disableCursorMovementForUpDownKeys,
      disableEscapeDoublePress: props.disableEscapeDoublePress,
      externalOffset: props.cursorOffset,
      onOffsetChange: props.onChangeCursorOffset,
      inputFilter: props.inputFilter,
      onModeChange: props.onModeChange,
      onUndo: props.onUndo
    };
    // $[2] 缓存 `props.columns`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = props.columns;
    // $[3] 缓存 `props.cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = props.cursorOffset;
    // $[4] 缓存 `props.disableCursorMovementForUpDownKeys`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = props.disableCursorMovementForUpDownKeys;
    // $[5] 缓存 `props.disableEscapeDoublePress`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = props.disableEscapeDoublePress;
    // $[6] 缓存 `props.focus`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = props.focus;
    // $[7] 缓存 `props.highlightPastedText`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = props.highlightPastedText;
    // $[8] 缓存 `props.inputFilter`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = props.inputFilter;
    // $[9] 缓存 `props.mask`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = props.mask;
    // $[10] 缓存 `props.maxVisibleLines`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = props.maxVisibleLines;
    // $[11] 缓存 `props.multiline`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = props.multiline;
    // $[12] 缓存 `props.onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = props.onChange;
    // $[13] 缓存 `props.onChangeCursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = props.onChangeCursorOffset;
    // $[14] 缓存 `props.onClearInput`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = props.onClearInput;
    // $[15] 缓存 `props.onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = props.onExit;
    // $[16] 缓存 `props.onExitMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = props.onExitMessage;
    // $[17] 缓存 `props.onHistoryDown`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = props.onHistoryDown;
    // $[18] 缓存 `props.onHistoryReset`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = props.onHistoryReset;
    // $[19] 缓存 `props.onHistoryUp`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = props.onHistoryUp;
    // $[20] 缓存 `props.onImagePaste`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = props.onImagePaste;
    // $[21] 缓存 `props.onModeChange`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = props.onModeChange;
    // $[22] 缓存 `props.onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = props.onSubmit;
    // $[23] 缓存 `props.onUndo`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = props.onUndo;
    // $[24] 缓存 `props.value`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = props.value;
    // $[25] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t12;
    // $[26] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t14;
    // $[27] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t15;
    // $[28] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[28];
  }
  // vimInputState 状态保存`useVimInput`，供终端渲染后续处理使用。
  const vimInputState = useVimInput(t16);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    mode,
    setMode
  } = vimInputState;
  // t17 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // t18 暂存 `[props.initialMode, mode, setMode]` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== mode || $[30] !== props.initialMode || $[31] !== setMode) {
    // t17 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t17 = () => {
      // `props.initialMode && props.initialMode` 与 `mode` 不一致时刷新派生状态，避免使用过期结果。
      if (props.initialMode && props.initialMode !== mode) {
        // setMode 写入新的状态值，使终端渲染后续读取保持一致。
        setMode(props.initialMode);
      }
    };
    // t18 暂存 `[props.initialMode, mode, setMode]` 生成的渲染片段，后续返回路径直接复用。
    t18 = [props.initialMode, mode, setMode];
    // $[29] 缓存 `mode`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = mode;
    // $[30] 缓存 `props.initialMode`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = props.initialMode;
    // $[31] 缓存 `setMode`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = setMode;
    // $[32] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t17;
    // $[33] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t18;
  } else {
    // t17 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[32];
    // t18 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[33];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t17, t18);
  // t19 暂存 `<Box flexDirection="column"><BaseTextInput inputState={vi...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== isTerminalFocused || $[35] !== props || $[36] !== vimInputState) {
    // t19 暂存 `<Box flexDirection="column"><BaseTextInput inputState={vi...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Box flexDirection="column"><BaseTextInput inputState={vimInputState} terminalFocus={isTerminalFocused} highlights={props.highlights} {...props} /></Box>;
    // $[34] 缓存 `isTerminalFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = isTerminalFocused;
    // $[35] 缓存 `props`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = props;
    // $[36] 缓存 `vimInputState`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = vimInputState;
    // $[37] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[37];
  }
  // 返回 `t19`，作为终端渲染这次计算的结果。
  return t19;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(text) {
  // 返回 `text`，作为终端渲染这次计算的结果。
  return text;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlJlYWN0IiwidXNlQ2xpcGJvYXJkSW1hZ2VIaW50IiwidXNlVmltSW5wdXQiLCJCb3giLCJjb2xvciIsInVzZVRlcm1pbmFsRm9jdXMiLCJ1c2VUaGVtZSIsIlZpbVRleHRJbnB1dFByb3BzIiwiVGV4dEhpZ2hsaWdodCIsIkJhc2VUZXh0SW5wdXQiLCJQcm9wcyIsImhpZ2hsaWdodHMiLCJWaW1UZXh0SW5wdXQiLCJwcm9wcyIsIiQiLCJfYyIsInRoZW1lIiwiaXNUZXJtaW5hbEZvY3VzZWQiLCJvbkltYWdlUGFzdGUiLCJ0MCIsInZhbHVlIiwidDEiLCJvbkNoYW5nZSIsInQyIiwib25TdWJtaXQiLCJ0MyIsIm9uRXhpdCIsInQ0Iiwib25FeGl0TWVzc2FnZSIsInQ1Iiwib25IaXN0b3J5UmVzZXQiLCJ0NiIsIm9uSGlzdG9yeVVwIiwidDciLCJvbkhpc3RvcnlEb3duIiwidDgiLCJvbkNsZWFySW5wdXQiLCJ0OSIsImZvY3VzIiwidDEwIiwibWFzayIsInQxMSIsIm11bHRpbGluZSIsInQxMiIsInNob3dDdXJzb3IiLCJ0MTMiLCJoaWdobGlnaHRQYXN0ZWRUZXh0IiwidDE0IiwiaW52ZXJzZSIsIl90ZW1wIiwidDE1IiwidDE2IiwiY29sdW1ucyIsImN1cnNvck9mZnNldCIsImRpc2FibGVDdXJzb3JNb3ZlbWVudEZvclVwRG93bktleXMiLCJkaXNhYmxlRXNjYXBlRG91YmxlUHJlc3MiLCJpbnB1dEZpbHRlciIsIm1heFZpc2libGVMaW5lcyIsIm9uQ2hhbmdlQ3Vyc29yT2Zmc2V0Iiwib25Nb2RlQ2hhbmdlIiwib25VbmRvIiwiY3Vyc29yQ2hhciIsImludmVydCIsInRoZW1lVGV4dCIsImV4dGVybmFsT2Zmc2V0Iiwib25PZmZzZXRDaGFuZ2UiLCJ2aW1JbnB1dFN0YXRlIiwibW9kZSIsInNldE1vZGUiLCJ0MTciLCJ0MTgiLCJpbml0aWFsTW9kZSIsInVzZUVmZmVjdCIsInQxOSIsInRleHQiXSwic291cmNlcyI6WyJWaW1UZXh0SW5wdXQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUNsaXBib2FyZEltYWdlSGludCB9IGZyb20gJy4uL2hvb2tzL3VzZUNsaXBib2FyZEltYWdlSGludC5qcydcbmltcG9ydCB7IHVzZVZpbUlucHV0IH0gZnJvbSAnLi4vaG9va3MvdXNlVmltSW5wdXQuanMnXG5pbXBvcnQgeyBCb3gsIGNvbG9yLCB1c2VUZXJtaW5hbEZvY3VzLCB1c2VUaGVtZSB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVmltVGV4dElucHV0UHJvcHMgfSBmcm9tICcuLi90eXBlcy90ZXh0SW5wdXRUeXBlcy5qcydcbmltcG9ydCB0eXBlIHsgVGV4dEhpZ2hsaWdodCB9IGZyb20gJy4uL3V0aWxzL3RleHRIaWdobGlnaHRpbmcuanMnXG5pbXBvcnQgeyBCYXNlVGV4dElucHV0IH0gZnJvbSAnLi9CYXNlVGV4dElucHV0LmpzJ1xuXG5leHBvcnQgdHlwZSBQcm9wcyA9IFZpbVRleHRJbnB1dFByb3BzICYge1xuICBoaWdobGlnaHRzPzogVGV4dEhpZ2hsaWdodFtdXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFZpbVRleHRJbnB1dChwcm9wczogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbdGhlbWVdID0gdXNlVGhlbWUoKVxuICBjb25zdCBpc1Rlcm1pbmFsRm9jdXNlZCA9IHVzZVRlcm1pbmFsRm9jdXMoKVxuXG4gIC8vIFNob3cgaGludCB3aGVuIHRlcm1pbmFsIHJlZ2FpbnMgZm9jdXMgYW5kIGNsaXBib2FyZCBoYXMgYW4gaW1hZ2VcbiAgdXNlQ2xpcGJvYXJkSW1hZ2VIaW50KGlzVGVybWluYWxGb2N1c2VkLCAhIXByb3BzLm9uSW1hZ2VQYXN0ZSlcblxuICBjb25zdCB2aW1JbnB1dFN0YXRlID0gdXNlVmltSW5wdXQoe1xuICAgIHZhbHVlOiBwcm9wcy52YWx1ZSxcbiAgICBvbkNoYW5nZTogcHJvcHMub25DaGFuZ2UsXG4gICAgb25TdWJtaXQ6IHByb3BzLm9uU3VibWl0LFxuICAgIG9uRXhpdDogcHJvcHMub25FeGl0LFxuICAgIG9uRXhpdE1lc3NhZ2U6IHByb3BzLm9uRXhpdE1lc3NhZ2UsXG4gICAgb25IaXN0b3J5UmVzZXQ6IHByb3BzLm9uSGlzdG9yeVJlc2V0LFxuICAgIG9uSGlzdG9yeVVwOiBwcm9wcy5vbkhpc3RvcnlVcCxcbiAgICBvbkhpc3RvcnlEb3duOiBwcm9wcy5vbkhpc3RvcnlEb3duLFxuICAgIG9uQ2xlYXJJbnB1dDogcHJvcHMub25DbGVhcklucHV0LFxuICAgIGZvY3VzOiBwcm9wcy5mb2N1cyxcbiAgICBtYXNrOiBwcm9wcy5tYXNrLFxuICAgIG11bHRpbGluZTogcHJvcHMubXVsdGlsaW5lLFxuICAgIGN1cnNvckNoYXI6IHByb3BzLnNob3dDdXJzb3IgPyAnICcgOiAnJyxcbiAgICBoaWdobGlnaHRQYXN0ZWRUZXh0OiBwcm9wcy5oaWdobGlnaHRQYXN0ZWRUZXh0LFxuICAgIGludmVydDogaXNUZXJtaW5hbEZvY3VzZWQgPyBjaGFsay5pbnZlcnNlIDogKHRleHQ6IHN0cmluZykgPT4gdGV4dCxcbiAgICB0aGVtZVRleHQ6IGNvbG9yKCd0ZXh0JywgdGhlbWUpLFxuICAgIGNvbHVtbnM6IHByb3BzLmNvbHVtbnMsXG4gICAgbWF4VmlzaWJsZUxpbmVzOiBwcm9wcy5tYXhWaXNpYmxlTGluZXMsXG4gICAgb25JbWFnZVBhc3RlOiBwcm9wcy5vbkltYWdlUGFzdGUsXG4gICAgZGlzYWJsZUN1cnNvck1vdmVtZW50Rm9yVXBEb3duS2V5czpcbiAgICAgIHByb3BzLmRpc2FibGVDdXJzb3JNb3ZlbWVudEZvclVwRG93bktleXMsXG4gICAgZGlzYWJsZUVzY2FwZURvdWJsZVByZXNzOiBwcm9wcy5kaXNhYmxlRXNjYXBlRG91YmxlUHJlc3MsXG4gICAgZXh0ZXJuYWxPZmZzZXQ6IHByb3BzLmN1cnNvck9mZnNldCxcbiAgICBvbk9mZnNldENoYW5nZTogcHJvcHMub25DaGFuZ2VDdXJzb3JPZmZzZXQsXG4gICAgaW5wdXRGaWx0ZXI6IHByb3BzLmlucHV0RmlsdGVyLFxuICAgIG9uTW9kZUNoYW5nZTogcHJvcHMub25Nb2RlQ2hhbmdlLFxuICAgIG9uVW5kbzogcHJvcHMub25VbmRvLFxuICB9KVxuXG4gIGNvbnN0IHsgbW9kZSwgc2V0TW9kZSB9ID0gdmltSW5wdXRTdGF0ZVxuXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKHByb3BzLmluaXRpYWxNb2RlICYmIHByb3BzLmluaXRpYWxNb2RlICE9PSBtb2RlKSB7XG4gICAgICBzZXRNb2RlKHByb3BzLmluaXRpYWxNb2RlKVxuICAgIH1cbiAgfSwgW3Byb3BzLmluaXRpYWxNb2RlLCBtb2RlLCBzZXRNb2RlXSlcblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgPEJhc2VUZXh0SW5wdXRcbiAgICAgICAgaW5wdXRTdGF0ZT17dmltSW5wdXRTdGF0ZX1cbiAgICAgICAgdGVybWluYWxGb2N1cz17aXNUZXJtaW5hbEZvY3VzZWR9XG4gICAgICAgIGhpZ2hsaWdodHM9e3Byb3BzLmhpZ2hsaWdodHN9XG4gICAgICAgIHsuLi5wcm9wc31cbiAgICAgIC8+XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssTUFBTSxPQUFPO0FBQ3pCLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLHFCQUFxQixRQUFRLG1DQUFtQztBQUN6RSxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBQ3JELFNBQVNDLEdBQUcsRUFBRUMsS0FBSyxFQUFFQyxnQkFBZ0IsRUFBRUMsUUFBUSxRQUFRLFdBQVc7QUFDbEUsY0FBY0MsaUJBQWlCLFFBQVEsNEJBQTRCO0FBQ25FLGNBQWNDLGFBQWEsUUFBUSw4QkFBOEI7QUFDakUsU0FBU0MsYUFBYSxRQUFRLG9CQUFvQjtBQUVsRCxPQUFPLEtB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