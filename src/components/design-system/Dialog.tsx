// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 ExitState、useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { type ExitState, useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// 引入 ConfigurableShortcutHint，将 ../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../ConfigurableShortcutHint.js';
// 引入 Byline，将 ./Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './Byline.js';
// 引入 KeyboardShortcutHint，将 ./KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './KeyboardShortcutHint.js';
// 引入 Pane，将 ./Pane.js 中已经封装好的能力接到本文件流程里。
import { Pane } from './Pane.js';
// DialogProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DialogProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  color?: keyof Theme;
  hideInputGuide?: boolean;
  hideBorder?: boolean;
  /** Custom input guide content. Receives exitState for Ctrl+C/D pending display. */
  // 这个回调绑定到 inputGuide?: (exitState: ExitState) => React.ReactNode;，负责终端渲染在该局部场景下的响应。
  inputGuide?: (exitState: ExitState) => React.ReactNode;
  /**
   * Controls whether Dialog's built-in confirm:no (Esc/n) and app:exit/interrupt
   * (Ctrl-C/D) keybindings are active. Set to `false` while an embedded text
   * field is being edited so those keys reach the field instead of being
   * consumed by Dialog. TextInput has its own ctrl+c/d handlers (cancel on
   * press, delete-forward on ctrl+d with text). Defaults to `true`.
   */
  isCancelActive?: boolean;
};
// Dialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Dialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(27);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title,
    subtitle,
    children,
    onCancel,
    color: t1,
    hideInputGuide,
    hideBorder,
    inputGuide,
    isCancelActive: t2
  } = t0;
  // color标记终端 UI Dialog是否启用对应路径。
  const color = t1 === undefined ? "permission" : t1;
  // isCancelActive标记终端 UI Dialog是否启用对应路径。
  const isCancelActive = t2 === undefined ? true : t2;
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings(undefined, undefined, isCancelActive);
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== isCancelActive) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Confirmation",
      isActive: isCancelActive
    };
    // $[0] 缓存 `isCancelActive`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = isCancelActive;
    // $[1] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[1];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t3);
  // t4 暂存 `exitState.pending ? <Text>Press {exitState.keyName} again...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== exitState.keyName || $[3] !== exitState.pending) {
    // t4 暂存 `exitState.pending ? <Text>Press {exitState.keyName} again...` 生成的渲染片段，后续返回路径直接复用。
    t4 = exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline><KeyboardShortcutHint shortcut="Enter" action="confirm" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline>;
    // $[2] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = exitState.keyName;
    // $[3] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = exitState.pending;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // defaultInputGuide 命名 `t4`，让后续代码直接表达这个值的用途。
  const defaultInputGuide = t4;
  // t5 暂存 `<Text bold={true} color={color}>{title}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== color || $[6] !== title) {
    // t5 暂存 `<Text bold={true} color={color}>{title}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text bold={true} color={color}>{title}</Text>;
    // $[5] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = color;
    // $[6] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = title;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `subtitle && <Text dimColor={true}>{subtitle}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== subtitle) {
    // t6 暂存 `subtitle && <Text dimColor={true}>{subtitle}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = subtitle && <Text dimColor={true}>{subtitle}</Text>;
    // $[8] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = subtitle;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `<Box flexDirection="column">{t5}{t6}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t5 || $[11] !== t6) {
    // t7 暂存 `<Box flexDirection="column">{t5}{t6}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box flexDirection="column">{t5}{t6}</Box>;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // t8 暂存 `<Box flexDirection="column" gap={1}>{t7}{children}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== children || $[14] !== t7) {
    // t8 暂存 `<Box flexDirection="column" gap={1}>{t7}{children}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column" gap={1}>{t7}{children}</Box>;
    // $[13] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = children;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[15];
  }
  // t9 暂存 `!hideInputGuide && <Box marginTop={1}><Text dimColor={tru...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== defaultInputGuide || $[17] !== exitState || $[18] !== hideInputGuide || $[19] !== inputGuide) {
    // t9 暂存 `!hideInputGuide && <Box marginTop={1}><Text dimColor={tru...` 生成的渲染片段，后续返回路径直接复用。
    t9 = !hideInputGuide && <Box marginTop={1}><Text dimColor={true} italic={true}>{inputGuide ? inputGuide(exitState) : defaultInputGuide}</Text></Box>;
    // $[16] 缓存 `defaultInputGuide`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = defaultInputGuide;
    // $[17] 缓存 `exitState`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = exitState;
    // $[18] 缓存 `hideInputGuide`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = hideInputGuide;
    // $[19] 缓存 `inputGuide`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = inputGuide;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // t10 暂存 `<>{t8}{t9}</>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t8 || $[22] !== t9) {
    // t10 暂存 `<>{t8}{t9}</>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <>{t8}{t9}</>;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
    // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[23];
  }
  // 文本内容 命名 `t10`，让后续代码直接表达这个值的用途。
  const content = t10;
  // 满足 `hideBorder` 时，终端渲染执行该分支。
  if (hideBorder) {
    // 返回 `content`，作为终端渲染这次计算的结果。
    return content;
  }
  // t11 暂存 `<Pane color={color}>{content}</Pane>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== color || $[25] !== content) {
    // t11 暂存 `<Pane color={color}>{content}</Pane>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Pane color={color}>{content}</Pane>;
    // $[24] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = color;
    // $[25] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = content;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkV4aXRTdGF0ZSIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiVGhlbWUiLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJCeWxpbmUiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIlBhbmUiLCJEaWFsb2dQcm9wcyIsInRpdGxlIiwiUmVhY3ROb2RlIiwic3VidGl0bGUiLCJjaGlsZHJlbiIsIm9uQ2FuY2VsIiwiY29sb3IiLCJoaWRlSW5wdXRHdWlkZSIsImhpZGVCb3JkZXIiLCJpbnB1dEd1aWRlIiwiZXhpdFN0YXRlIiwiaXNDYW5jZWxBY3RpdmUiLCJEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ1bmRlZmluZWQiLCJ0MyIsImNvbnRleHQiLCJpc0FjdGl2ZSIsInQ0Iiwia2V5TmFtZSIsInBlbmRpbmciLCJkZWZhdWx0SW5wdXRHdWlkZSIsInQ1IiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJjb250ZW50IiwidDExIl0sInNvdXJjZXMiOlsiRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQge1xuICB0eXBlIEV4aXRTdGF0ZSxcbiAgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzLFxufSBmcm9tICcuLi8uLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWUgfSBmcm9tICcuLi8uLi91dGlscy90aGVtZS5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4uL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4vUGFuZS5qcydcblxudHlwZSBEaWFsb2dQcm9wcyA9IHtcbiAgdGl0bGU6IFJlYWN0LlJlYWN0Tm9kZVxuICBzdWJ0aXRsZT86IFJlYWN0LlJlYWN0Tm9kZVxuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG4gIG9uQ2FuY2VsOiAoKSA9PiB2b2lkXG4gIGNvbG9yPzoga2V5b2YgVGhlbWVcbiAgaGlkZUlucHV0R3VpZGU/OiBib29sZWFuXG4gIGhpZGVCb3JkZXI/OiBib29sZWFuXG4gIC8qKiBDdXN0b20gaW5wdXQgZ3VpZGUgY29udGVudC4gUmVjZWl2ZXMgZXhpdFN0YXRlIGZvciBDdHJsK0MvRCBwZW5kaW5nIGRpc3BsYXkuICovXG4gIGlucHV0R3VpZGU/OiAoZXhpdFN0YXRlOiBFeGl0U3RhdGUpID0+IFJlYWN0LlJlYWN0Tm9kZVxuICAvKipcbiAgICogQ29udHJvbHMgd2hldGhlciBEaWFsb2cncyBidWlsdC1pbiBjb25maXJtOm5vIChFc2MvbikgYW5kIGFwcDpleGl0L2ludGVycnVwdFxuICAgKiAoQ3RybC1DL0QpIGtleWJpbmRpbmdzIGFyZSBhY3RpdmUuIFNldCB0byBgZmFsc2VgIHdoaWxlIGFuIGVtYmVkZGVkIHRleHRcbiAgICogZmllbGQgaXMgYmVpbmcgZWRpdGVkIHNvIHRob3NlIGtleXMgcmVhY2ggdGhlIGZpZWxkIGluc3RlYWQgb2YgYmVpbmdcbiAgICogY29uc3VtZWQgYnkgRGlhbG9nLiBUZXh0SW5wdXQgaGFzIGl0cyBvd24gY3RybCtjL2QgaGFuZGxlcnMgKGNhbmNlbCBvblxuICAgKiBwcmVzcywgZGVsZXRlLWZvcndhcmQgb24gY3RybCtkIHdpdGggdGV4dCkuIERlZmF1bHRzIHRvIGB0cnVlYC5cbiAgICovXG4gIGlzQ2FuY2VsQWN0aXZlPzogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gRGlhbG9nKHtcbiAgdGl0bGUsXG4gIHN1YnRpdGxlLFxuICBjaGlsZHJlbixcbiAgb25DYW5jZWwsXG4gIGNvbG9yID0gJ3Blcm1pc3Npb24nLFxuICBoaWRlSW5wdXRHdWlkZSxcbiAgaGlkZUJvcmRlcixcbiAgaW5wdXRHdWlkZSxcbiAgaXNDYW5jZWxBY3RpdmUgPSB0cnVlLFxufTogRGlhbG9nUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBleGl0U3RhdGUgPSB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoXG4gICAgdW5kZWZpbmVkLFxuICAgIHVuZGVmaW5lZCxcbiAgICBpc0NhbmNlbEFjdGl2ZSxcbiAgKVxuXG4gIC8vIFVzZSBjb25maWd1cmFibGUga2V5YmluZGluZyBmb3IgRVNDIHRvIGNhbmNlbC5cbiAgLy8gaXNDYW5jZWxBY3RpdmUgbGV0cyBjb25zdW1lcnMgKGUuZy4gRWxpY2l0YXRpb25EaWFsb2cpIGRpc2FibGUgdGhpcyB3aGlsZVxuICAvLyBhbiBlbWJlZGRlZCBUZXh0SW5wdXQgaXMgZm9jdXNlZCwgc28gdGhhdCBrZXlzIGxpa2UgJ24nIHJlYWNoIHRoZSBmaWVsZFxuICAvLyBpbnN0ZWFkIG9mIGJlaW5nIGNvbnN1bWVkIGhlcmUuXG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBvbkNhbmNlbCwge1xuICAgIGNvbnRleHQ6ICdDb25maXJtYXRpb24nLFxuICAgIGlzQWN0aXZlOiBpc0NhbmNlbEFjdGl2ZSxcbiAgfSlcblxuICBjb25zdCBkZWZhdWx0SW5wdXRHdWlkZSA9IGV4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgIDxUZXh0PlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvVGV4dD5cbiAgKSA6IChcbiAgICA8QnlsaW5lPlxuICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiRW50ZXJcIiBhY3Rpb249XCJjb25maXJtXCIgLz5cbiAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgYWN0aW9uPVwiY29uZmlybTpub1wiXG4gICAgICAgIGNvbnRleHQ9XCJDb25maXJtYXRpb25cIlxuICAgICAgICBmYWxsYmFjaz1cIkVzY1wiXG4gICAgICAgIGRlc2NyaXB0aW9uPVwiY2FuY2VsXCJcbiAgICAgIC8+XG4gICAgPC9CeWxpbmU+XG4gIClcblxuICBjb25zdCBjb250ZW50ID0gKFxuICAgIDw+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBib2xkIGNvbG9yPXtjb2xvcn0+XG4gICAgICAgICAgICB7dGl0bGV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIHtzdWJ0aXRsZSAmJiA8VGV4dCBkaW1Db2xvcj57c3VidGl0bGV9PC9UZXh0Pn1cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDwvQm94PlxuICAgICAgeyFoaWRlSW5wdXRHdWlkZSAmJiAoXG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgICB7aW5wdXRHdWlkZSA/IGlucHV0R3VpZGUoZXhpdFN0YXRlKSA6IGRlZmF1bHRJbnB1dEd1aWRlfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgIDwvPlxuICApXG5cbiAgaWYgKGhpZGVCb3JkZXIpIHtcbiAgICByZXR1cm4gY29udGVudFxuICB9XG5cbiAgcmV0dXJuIDxQYW5lIGNvbG9yPXtjb2xvcn0+e2NvbnRlbnR9PC9QYW5lPlxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FDRSxLQUFLQyxTQUFTLEVBQ2RDLDhCQUE4QixRQUN6QiwrQ0FBK0M7QUFDdEQsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ2xFLGNBQWNDLEtBQUssUUFBUSxzQkFBc0I7QUFDakQsU0FBU0Msd0JBQXdCLFFBQVEsZ0NBQWdDO0FBQ3pFLFNBQVNDLE1BQU0sUUFBUSxhQUFhO0FBQ3BDLFNBQVNDLG9CQUFvQixRQUFRLDJCQUEyQjtBQUNoRSxTQUFTQyxJQUFJLFFBQVEsV0FBVztBQUVoQyxLQUFLQyxXQUFXLEdBQUc7RUFDakJDLEtBQUssRUFBRVosS0FBSyxDQUFDYSxTQUFTO0VBQ3RCQyxRQUFRLENBQUMsRUFBRWQsS0FBSyxDQUFDYSxTQUFTO0VBQzFCRSxRQUFRLEVBQUVmLEtBQUssQ0FBQ2EsU0FBUztFQUN6QkcsUUFBUSxFQUFFLEdBQUcsR0FBRyxJQUFJO0VBQ3BCQyxLQUFLLENBQUMsRUFBRSxNQUFNWCxLQUFLO0VBQ25CWSxjQUFjLENBQUMsRUFBRSxPQUFPO0VBQ3hCQyxVQUFVLENBQUMsRUFBRSxPQUFPO0VBQ3BCO0VBQ0FDLFVBQVUsQ0FBQyxFQUFFLENBQUNDLFNBQVMsRUFBRXBCLFNBQVMsRUFBRSxHQUFHRCxLQUFLLENBQUNhLFNBQVM7RUFDdEQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRVMsY0FBYyxDQUFDLEVBQUUsT0FBTztBQUMxQixDQUFDO0FBRUQsT0FBTyxTQUFBQyxPQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQWdCO0lBQUFkLEtBQUE7SUFBQUUsUUFBQTtJQUFBQyxRQUFBO0lBQUFDLFFBQUE7SUFBQUMsS0FBQSxFQUFBVSxFQUFBO0lBQUFULGNBQUE7SUFBQUMsVUFBQTtJQUFBQyxVQUFBO0lBQUFFLGNBQUEsRUFBQU07RUFBQSxJQUFBSixFQVVUO0VBTFosTUFBQVAsS0FBQSxHQUFBVSxFQUFvQixLQUFwQkUsU0FBb0IsR0FBcEIsWUFBb0IsR0FBcEJGLEVBQW9CO0VBSXBCLE1BQUFMLGNBQUEsR0FBQU0sRUFBcUIsS0FBckJDLFNBQXFCLEdBQXJCLElBQXFCLEdBQXJCRCxFQUFxQjtFQUVyQixNQUFBUCxTQUFBLEdBQWtCbkIsOEJBQThCLENBQzlDMkIsU0FBUyxFQUNUQSxTQUFTLEVBQ1RQLGNBQ0YsQ0FBQztFQUFBLElBQUFRLEVBQUE7RUFBQSxJQUFBTCxDQUFBLFFBQUFILGNBQUE7SUFNcUNRLEVBQUE7TUFBQUMsT0FBQSxFQUMzQixjQUFjO01BQUFDLFFBQUEsRUFDYlY7SUFDWixDQUFDO0lBQUFHLENBQUEsTUFBQUgsY0FBQTtJQUFBRyxDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUhEcEIsYUFBYSxDQUFDLFlBQVksRUFBRVcsUUFBUSxFQUFFYyxFQUdyQyxDQUFDO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFSLENBQUEsUUFBQUosU0FBQSxDQUFBYSxPQUFBLElBQUFULENBQUEsUUFBQUosU0FBQSxDQUFBYyxPQUFBO0lBRXdCRixFQUFBLEdBQUFaLFNBQVMsQ0FBQWMsT0FZbEMsR0FYQyxDQUFDLElBQUksQ0FBQyxNQUFPLENBQUFkLFNBQVMsQ0FBQWEsT0FBTyxDQUFFLGNBQWMsRUFBNUMsSUFBSSxDQVdOLEdBVEMsQ0FBQyxNQUFNLENBQ0wsQ0FBQyxvQkFBb0IsQ0FBVSxRQUFPLENBQVAsT0FBTyxDQUFRLE1BQVMsQ0FBVCxTQUFTLEdBQ3ZELENBQUMsd0JBQXdCLENBQ2hCLE1BQVksQ0FBWixZQUFZLENBQ1gsT0FBYyxDQUFkLGNBQWMsQ0FDYixRQUFLLENBQUwsS0FBSyxDQUNGLFdBQVEsQ0FBUixRQUFRLEdBRXhCLEVBUkMsTUFBTSxDQVNSO0lBQUFULENBQUEsTUFBQUosU0FBQSxDQUFBYSxPQUFBO0lBQUFULENBQUEsTUFBQUosU0FBQSxDQUFBYyxPQUFBO0lBQUFWLENBQUEsTUFBQVEsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVIsQ0FBQTtFQUFBO0VBWkQsTUFBQVcsaUJBQUEsR0FBMEJILEVBWXpCO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFaLENBQUEsUUFBQVIsS0FBQSxJQUFBUSxDQUFBLFFBQUFiLEtBQUE7SUFNT3lCLEVBQUEsSUFBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFRcEIsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FDcEJMLE1BQUksQ0FDUCxFQUZDLElBQUksQ0FFRTtJQUFBYSxDQUFBLE1BQUFSLEtBQUE7SUFBQVEsQ0FBQSxNQUFBYixLQUFBO0lBQUFhLENBQUEsTUFBQVksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVosQ0FBQTtFQUFBO0VBQUEsSUFBQWEsRUFBQTtFQUFBLElBQUFiLENBQUEsUUFBQVgsUUFBQTtJQUNOd0IsRUFBQSxHQUFBeEIsUUFBNEMsSUFBaEMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFFQSxTQUFPLENBQUUsRUFBeEIsSUFBSSxDQUEyQjtJQUFBVyxDQUFBLE1BQUFYLFFBQUE7SUFBQVcsQ0FBQSxNQUFBYSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBYixDQUFBO0VBQUE7RUFBQSxJQUFBYyxFQUFBO0VBQUEsSUFBQWQsQ0FBQSxTQUFBWSxFQUFBLElBQUFaLENBQUEsU0FBQWEsRUFBQTtJQUovQ0MsRUFBQSxJQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUN6QixDQUFBRixFQUVNLENBQ0wsQ0FBQUMsRUFBMkMsQ0FDOUMsRUFMQyxHQUFHLENBS0U7SUFBQWIsQ0FBQSxPQUFBWSxFQUFBO0lBQUFaLENBQUEsT0FBQWEsRUFBQTtJQUFBYixDQUFBLE9BQUFjLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQUFBLElBQUFlLEVBQUE7RUFBQSxJQUFBZixDQUFBLFNBQUFWLFFBQUEsSUFBQVUsQ0FBQSxTQUFBYyxFQUFBO0lBTlJDLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FBTSxHQUFDLENBQUQsR0FBQyxDQUNoQyxDQUFBRCxFQUtLLENBQ0p4QixTQUFPLENBQ1YsRUFSQyxHQUFHLENBUUU7SUFBQVUsQ0FBQSxPQUFBVixRQUFBO0lBQUFVLENBQUEsT0FBQWMsRUFBQTtJQUFBZCxDQUFBLE9BQUFlLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFmLENBQUE7RUFBQTtFQUFBLElBQUFnQixFQUFBO0VBQUEsSUFBQWhCLENBQUEsU0FBQVcsaUJBQUEsSUFBQVgsQ0FBQSxTQUFBSixTQUFBLElBQUFJLENBQUEsU0FBQVAsY0FBQSxJQUFBTyxDQUFBLFNBQUFMLFVBQUE7SUFDTHFCLEVBQUEsSUFBQ3ZCLGNBTUQsSUFMQyxDQUFDLEdBQUcsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUNmLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxNQUFNLENBQU4sS0FBSyxDQUFDLENBQ2xCLENBQUFFLFVBQVUsR0FBR0EsVUFBVSxDQUFDQyxTQUE2QixDQUFDLEdBQXREZSxpQkFBcUQsQ0FDeEQsRUFGQyxJQUFJLENBR1AsRUFKQyxHQUFHLENBS0w7SUFBQVgsQ0FBQSxPQUFBVyxpQkFBQTtJQUFBWCxDQUFBLE9BQUFKLFNBQUE7SUFBQUksQ0FBQSxPQUFBUCxjQUFBO0lBQUFPLENBQUEsT0FBQUwsVUFBQTtJQUFBSyxDQUFBLE9BQUFnQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBaEIsQ0FBQTtFQUFBO0VBQUEsSUFBQWlCLEdBQUE7RUFBQSxJQUFBakIsQ0FBQSxTQUFBZSxFQUFBLElBQUFmLENBQUEsU0FBQWdCLEVBQUE7SUFoQkhDLEdBQUEsS0FDRSxDQUFBRixFQVFLLENBQ0osQ0FBQUMsRUFNRCxDQUFDLEdBQ0E7SUFBQWhCLENBQUEsT0FBQWUsRUFBQTtJQUFBZixDQUFBLE9BQUFnQixFQUFBO0lBQUFoQixDQUFBLE9BQUFpQixHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBakIsQ0FBQTtFQUFBO0VBbEJMLE1BQUFrQixPQUFBLEdBQ0VELEdBaUJHO0VBR0wsSUFBSXZCLFVBQVU7SUFBQSxPQUNMd0IsT0FBTztFQUFBO0VBQ2YsSUFBQUMsR0FBQTtFQUFBLElBQUFuQixDQUFBLFNBQUFSLEtBQUEsSUFBQVEsQ0FBQSxTQUFBa0IsT0FBQTtJQUVNQyxHQUFBLElBQUMsSUFBSSxDQUFRM0IsS0FBSyxDQUFMQSxNQUFJLENBQUMsQ0FBRzBCLFFBQU0sQ0FBRSxFQUE1QixJQUFJLENBQStCO0lBQUFsQixDQUFBLE9BQUFSLEtBQUE7SUFBQVEsQ0FBQSxPQUFBa0IsT0FBQTtJQUFBbEIsQ0FBQSxPQUFBbUIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQW5CLENBQUE7RUFBQTtFQUFBLE9BQXBDbUIsR0FBb0M7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==