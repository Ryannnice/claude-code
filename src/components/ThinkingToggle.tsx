// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 引入 useExitOnCtrlCDWithKeybindings，将 src/hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from 'src/hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 引入 ConfigurableShortcutHint，将 ./ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Byline，将 ./design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './design-system/Byline.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 Pane，将 ./design-system/Pane.js 中已经封装好的能力接到本文件流程里。
import { Pane } from './design-system/Pane.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type Props = {
  currentValue: boolean;
  // 这个回调绑定到 onSelect: (enabled: boolean) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (enabled: boolean) => void;
  onCancel?: () => void;
  isMidConversation?: boolean;
};
// ThinkingToggle 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ThinkingToggle(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(27);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentValue,
    onSelect,
    onCancel,
    isMidConversation
  } = t0;
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // confirmationPending 由 React state 持有，setConfirmationPending 会在用户操作或异步结果返回时触发刷新。
  const [confirmationPending, setConfirmationPending] = useState(null);
  // t1 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t1 = [{
      value: "true",
      label: "Enabled",
      description: "Claude will think before responding"
    }, {
      value: "false",
      label: "Disabled",
      description: "Claude will respond without extended thinking"
    }];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 选项保存`t1`，作为后续临时缓存值处理的输入。
  const options = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== confirmationPending || $[2] !== onCancel) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // `confirmationPending` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (confirmationPending !== null) {
        // setConfirmationPending 写入新的状态值，使终端渲染后续读取保持一致。
        setConfirmationPending(null);
      } else {
        // 调用 onCancel?.();，完成这一处局部操作。
        onCancel?.();
      }
    };
    // $[1] 缓存 `confirmationPending`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = confirmationPending;
    // $[2] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onCancel;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Confirmation"
    };
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", t2, t3);
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== confirmationPending || $[6] !== onSelect) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // `confirmationPending` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (confirmationPending !== null) {
        // 调用 onSelect，触发终端渲染此处需要的副作用。
        onSelect(confirmationPending);
      }
    };
    // $[5] 缓存 `confirmationPending`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = confirmationPending;
    // $[6] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onSelect;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5标记终端 UI Thinking Toggle是否启用对应路径。
  const t5 = confirmationPending !== null;
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t5) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      context: "Confirmation",
      isActive: t5
    };
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:yes", t4, t6);
  // t7 暂存 `function handleSelectChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== currentValue || $[11] !== isMidConversation || $[12] !== onSelect) {
    // t7 暂存 `function handleSelectChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t7 = function handleSelectChange(value) {
      // selected标记终端 UI Thinking Toggle是否启用对应路径。
      const selected = value === "true";
      // `isMidConversation && selected` 与 `currentValue` 不一致时刷新派生状态，避免使用过期结果。
      if (isMidConversation && selected !== currentValue) {
        // setConfirmationPending 写入新的状态值，使终端渲染后续读取保持一致。
        setConfirmationPending(selected);
      } else {
        // 调用 onSelect，触发终端渲染此处需要的副作用。
        onSelect(selected);
      }
    };
    // $[10] 缓存 `currentValue`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = currentValue;
    // $[11] 缓存 `isMidConversation`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = isMidConversation;
    // $[12] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onSelect;
    // $[13] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[13];
  }
  // handleSelectChange 命名 `t7`，让后续代码直接表达这个值的用途。
  const handleSelectChange = t7;
  // t8 暂存 `<Box marginBottom={1} flexDirection="column"><Text color=...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Box marginBottom={1} flexDirection="column"><Text color=...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box marginBottom={1} flexDirection="column"><Text color="remember" bold={true}>Toggle thinking mode</Text><Text dimColor={true}>Enable or disable thinking for this session.</Text></Box>;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // t9 暂存 `<Box flexDirection="column">{t8}{confirmationPending !== ...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== confirmationPending || $[16] !== currentValue || $[17] !== handleSelectChange || $[18] !== onCancel) {
    // t9 暂存 `<Box flexDirection="column">{t8}{confirmationPending !== ...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column">{t8}{confirmationPending !== null ? <Box flexDirection="column" marginBottom={1} gap={1}><Text color="warning">Changing thinking mode mid-conversation will increase latency and may reduce quality. For best results, set this at the start of a session.</Text><Text color="warning">Do you want to proceed?</Text></Box> : <Box flexDirection="column" marginBottom={1}><Select defaultValue={currentValue ? "true" : "false"} defaultFocusValue={currentValue ? "true" : "false"} options={options} onChange={handleSelectChange} onCancel={onCancel ?? _temp} visibleOptionCount={2} /></Box>}</Box>;
    // $[15] 缓存 `confirmationPending`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = confirmationPending;
    // $[16] 缓存 `currentValue`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = currentValue;
    // $[17] 缓存 `handleSelectChange`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = handleSelectChange;
    // $[18] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = onCancel;
    // $[19] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[19];
  }
  // t10 暂存 `<Text dimColor={true} italic={true}>{exitState.pending ? ...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== confirmationPending || $[21] !== exitState.keyName || $[22] !== exitState.pending) {
    // t10 暂存 `<Text dimColor={true} italic={true}>{exitState.pending ? ...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text dimColor={true} italic={true}>{exitState.pending ? <>Press {exitState.keyName} again to exit</> : confirmationPending !== null ? <Byline><KeyboardShortcutHint shortcut="Enter" action="confirm" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline> : <Byline><KeyboardShortcutHint shortcut="Enter" action="confirm" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="exit" /></Byline>}</Text>;
    // $[20] 缓存 `confirmationPending`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = confirmationPending;
    // $[21] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = exitState.keyName;
    // $[22] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = exitState.pending;
    // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[23];
  }
  // t11 暂存 `<Pane color="permission">{t9}{t10}</Pane>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== t10 || $[25] !== t9) {
    // t11 暂存 `<Pane color="permission">{t9}{t10}</Pane>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Pane color="permission">{t9}{t10}</Pane>;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJTZWxlY3QiLCJCeWxpbmUiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIlBhbmUiLCJQcm9wcyIsImN1cnJlbnRWYWx1ZSIsIm9uU2VsZWN0IiwiZW5hYmxlZCIsIm9uQ2FuY2VsIiwiaXNNaWRDb252ZXJzYXRpb24iLCJUaGlua2luZ1RvZ2dsZSIsInQwIiwiJCIsIl9jIiwiZXhpdFN0YXRlIiwiY29uZmlybWF0aW9uUGVuZGluZyIsInNldENvbmZpcm1hdGlvblBlbmRpbmciLCJ0MSIsIlN5bWJvbCIsImZvciIsInZhbHVlIiwibGFiZWwiLCJkZXNjcmlwdGlvbiIsIm9wdGlvbnMiLCJ0MiIsInQzIiwiY29udGV4dCIsInQ0IiwidDUiLCJ0NiIsImlzQWN0aXZlIiwidDciLCJoYW5kbGVTZWxlY3RDaGFuZ2UiLCJzZWxlY3RlZCIsInQ4IiwidDkiLCJfdGVtcCIsInQxMCIsImtleU5hbWUiLCJwZW5kaW5nIiwidDExIl0sInNvdXJjZXMiOlsiVGhpbmtpbmdUb2dnbGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyB9IGZyb20gJ3NyYy9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBQYW5lIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL1BhbmUuanMnXG5cbmV4cG9ydCB0eXBlIFByb3BzID0ge1xuICBjdXJyZW50VmFsdWU6IGJvb2xlYW5cbiAgb25TZWxlY3Q6IChlbmFibGVkOiBib29sZWFuKSA9PiB2b2lkXG4gIG9uQ2FuY2VsPzogKCkgPT4gdm9pZFxuICBpc01pZENvbnZlcnNhdGlvbj86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRoaW5raW5nVG9nZ2xlKHtcbiAgY3VycmVudFZhbHVlLFxuICBvblNlbGVjdCxcbiAgb25DYW5jZWwsXG4gIGlzTWlkQ29udmVyc2F0aW9uLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBleGl0U3RhdGUgPSB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuICBjb25zdCBbY29uZmlybWF0aW9uUGVuZGluZywgc2V0Q29uZmlybWF0aW9uUGVuZGluZ10gPSB1c2VTdGF0ZTxcbiAgICBib29sZWFuIHwgbnVsbFxuICA+KG51bGwpXG5cbiAgY29uc3Qgb3B0aW9ucyA9IFtcbiAgICB7XG4gICAgICB2YWx1ZTogJ3RydWUnLFxuICAgICAgbGFiZWw6ICdFbmFibGVkJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xhdWRlIHdpbGwgdGhpbmsgYmVmb3JlIHJlc3BvbmRpbmcnLFxuICAgIH0sXG4gICAge1xuICAgICAgdmFsdWU6ICdmYWxzZScsXG4gICAgICBsYWJlbDogJ0Rpc2FibGVkJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xhdWRlIHdpbGwgcmVzcG9uZCB3aXRob3V0IGV4dGVuZGVkIHRoaW5raW5nJyxcbiAgICB9LFxuICBdXG5cbiAgLy8gVXNlIGNvbmZpZ3VyYWJsZSBrZXliaW5kaW5nIGZvciBFU0MgdG8gY2FuY2VsL2dvIGJhY2tcbiAgdXNlS2V5YmluZGluZyhcbiAgICAnY29uZmlybTpubycsXG4gICAgKCkgPT4ge1xuICAgICAgaWYgKGNvbmZpcm1hdGlvblBlbmRpbmcgIT09IG51bGwpIHtcbiAgICAgICAgc2V0Q29uZmlybWF0aW9uUGVuZGluZyhudWxsKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25DYW5jZWw/LigpXG4gICAgICB9XG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0sXG4gIClcblxuICAvLyBVc2UgY29uZmlndXJhYmxlIGtleWJpbmRpbmcgZm9yIEVudGVyIHRvIGNvbmZpcm0gaW4gY29uZmlybWF0aW9uIG1vZGVcbiAgdXNlS2V5YmluZGluZyhcbiAgICAnY29uZmlybTp5ZXMnLFxuICAgICgpID0+IHtcbiAgICAgIGlmIChjb25maXJtYXRpb25QZW5kaW5nICE9PSBudWxsKSB7XG4gICAgICAgIG9uU2VsZWN0KGNvbmZpcm1hdGlvblBlbmRpbmcpXG4gICAgICB9XG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nLCBpc0FjdGl2ZTogY29uZmlybWF0aW9uUGVuZGluZyAhPT0gbnVsbCB9LFxuICApXG5cbiAgZnVuY3Rpb24gaGFuZGxlU2VsZWN0Q2hhbmdlKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBzZWxlY3RlZCA9IHZhbHVlID09PSAndHJ1ZSdcbiAgICBpZiAoaXNNaWRDb252ZXJzYXRpb24gJiYgc2VsZWN0ZWQgIT09IGN1cnJlbnRWYWx1ZSkge1xuICAgICAgc2V0Q29uZmlybWF0aW9uUGVuZGluZyhzZWxlY3RlZClcbiAgICB9IGVsc2Uge1xuICAgICAgb25TZWxlY3Qoc2VsZWN0ZWQpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8UGFuZSBjb2xvcj1cInBlcm1pc3Npb25cIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwicmVtZW1iZXJcIiBib2xkPlxuICAgICAgICAgICAgVG9nZ2xlIHRoaW5raW5nIG1vZGVcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+RW5hYmxlIG9yIGRpc2FibGUgdGhpbmtpbmcgZm9yIHRoaXMgc2Vzc2lvbi48L1RleHQ+XG4gICAgICAgIDwvQm94PlxuXG4gICAgICAgIHtjb25maXJtYXRpb25QZW5kaW5nICE9PSBudWxsID8gKFxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkJvdHRvbT17MX0gZ2FwPXsxfT5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICBDaGFuZ2luZyB0aGlua2luZyBtb2RlIG1pZC1jb252ZXJzYXRpb24gd2lsbCBpbmNyZWFzZSBsYXRlbmN5IGFuZFxuICAgICAgICAgICAgICBtYXkgcmVkdWNlIHF1YWxpdHkuIEZvciBiZXN0IHJlc3VsdHMsIHNldCB0aGlzIGF0IHRoZSBzdGFydCBvZiBhXG4gICAgICAgICAgICAgIHNlc3Npb24uXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5EbyB5b3Ugd2FudCB0byBwcm9jZWVkPzwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e2N1cnJlbnRWYWx1ZSA/ICd0cnVlJyA6ICdmYWxzZSd9XG4gICAgICAgICAgICAgIGRlZmF1bHRGb2N1c1ZhbHVlPXtjdXJyZW50VmFsdWUgPyAndHJ1ZScgOiAnZmFsc2UnfVxuICAgICAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlU2VsZWN0Q2hhbmdlfVxuICAgICAgICAgICAgICBvbkNhbmNlbD17b25DYW5jZWwgPz8gKCgpID0+IHt9KX1cbiAgICAgICAgICAgICAgdmlzaWJsZU9wdGlvbkNvdW50PXsyfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICB7ZXhpdFN0YXRlLnBlbmRpbmcgPyAoXG4gICAgICAgICAgPD5QcmVzcyB7ZXhpdFN0YXRlLmtleU5hbWV9IGFnYWluIHRvIGV4aXQ8Lz5cbiAgICAgICAgKSA6IGNvbmZpcm1hdGlvblBlbmRpbmcgIT09IG51bGwgPyAoXG4gICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwiY29uZmlybVwiIC8+XG4gICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cImNhbmNlbFwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvQnlsaW5lPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFbnRlclwiIGFjdGlvbj1cImNvbmZpcm1cIiAvPlxuICAgICAgICAgICAgPENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludFxuICAgICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgICAgY29udGV4dD1cIkNvbmZpcm1hdGlvblwiXG4gICAgICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb249XCJleGl0XCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9CeWxpbmU+XG4gICAgICAgICl9XG4gICAgICA8L1RleHQ+XG4gICAgPC9QYW5lPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFFBQVEsUUFBUSxPQUFPO0FBQ2hDLFNBQVNDLDhCQUE4QixRQUFRLDZDQUE2QztBQUM1RixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLGFBQWEsUUFBUSxpQ0FBaUM7QUFDL0QsU0FBU0Msd0JBQXdCLFFBQVEsK0JBQStCO0FBQ3hFLFNBQVNDLE1BQU0sUUFBUSx5QkFBeUI7QUFDaEQsU0FBU0MsTUFBTSxRQUFRLDJCQUEyQjtBQUNsRCxTQUFTQyxvQkFBb0IsUUFBUSx5Q0FBeUM7QUFDOUUsU0FBU0MsSUFBSSxRQUFRLHlCQUF5QjtBQUU5QyxPQUFPLEtBQUtDLEtBQUssR0FBRztFQUNsQkMsWUFBWSxFQUFFLE9BQU87RUFDckJDLFFBQVEsRUFBRSxDQUFDQyxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSTtFQUNwQ0MsUUFBUSxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUk7RUFDckJDLGlCQUFpQixDQUFDLEVBQUUsT0FBTztBQUM3QixDQUFDO0FBRUQsT0FBTyxTQUFBQyxlQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXdCO0lBQUFSLFlBQUE7SUFBQUMsUUFBQTtJQUFBRSxRQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFLdkI7RUFDTixNQUFBRyxTQUFBLEdBQWtCbkIsOEJBQThCLENBQUMsQ0FBQztFQUNsRCxPQUFBb0IsbUJBQUEsRUFBQUMsc0JBQUEsSUFBc0R0QixRQUFRLENBRTVELElBQUksQ0FBQztFQUFBLElBQUF1QixFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBTSxNQUFBLENBQUFDLEdBQUE7SUFFU0YsRUFBQSxJQUNkO01BQUFHLEtBQUEsRUFDUyxNQUFNO01BQUFDLEtBQUEsRUFDTixTQUFTO01BQUFDLFdBQUEsRUFDSDtJQUNmLENBQUMsRUFDRDtNQUFBRixLQUFBLEVBQ1MsT0FBTztNQUFBQyxLQUFBLEVBQ1AsVUFBVTtNQUFBQyxXQUFBLEVBQ0o7SUFDZixDQUFDLENBQ0Y7SUFBQVYsQ0FBQSxNQUFBSyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBTCxDQUFBO0VBQUE7RUFYRCxNQUFBVyxPQUFBLEdBQWdCTixFQVdmO0VBQUEsSUFBQU8sRUFBQTtFQUFBLElBQUFaLENBQUEsUUFBQUcsbUJBQUEsSUFBQUgsQ0FBQSxRQUFBSixRQUFBO0lBS0NnQixFQUFBLEdBQUFBLENBQUE7TUFDRSxJQUFJVCxtQkFBbUIsS0FBSyxJQUFJO1FBQzlCQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7TUFBQTtRQUU1QlIsUUFBUSxHQUFHLENBQUM7TUFBQTtJQUNiLENBQ0Y7SUFBQUksQ0FBQSxNQUFBRyxtQkFBQTtJQUFBSCxDQUFBLE1BQUFKLFFBQUE7SUFBQUksQ0FBQSxNQUFBWSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWixDQUFBO0VBQUE7RUFBQSxJQUFBYSxFQUFBO0VBQUEsSUFBQWIsQ0FBQSxRQUFBTSxNQUFBLENBQUFDLEdBQUE7SUFDRE0sRUFBQTtNQUFBQyxPQUFBLEVBQVc7SUFBZSxDQUFDO0lBQUFkLENBQUEsTUFBQWEsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWIsQ0FBQTtFQUFBO0VBVDdCZCxhQUFhLENBQ1gsWUFBWSxFQUNaMEIsRUFNQyxFQUNEQyxFQUNGLENBQUM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQWYsQ0FBQSxRQUFBRyxtQkFBQSxJQUFBSCxDQUFBLFFBQUFOLFFBQUE7SUFLQ3FCLEVBQUEsR0FBQUEsQ0FBQTtNQUNFLElBQUlaLG1CQUFtQixLQUFLLElBQUk7UUFDOUJULFFBQVEsQ0FBQ1MsbUJBQW1CLENBQUM7TUFBQTtJQUM5QixDQUNGO0lBQUFILENBQUEsTUFBQUcsbUJBQUE7SUFBQUgsQ0FBQSxNQUFBTixRQUFBO0lBQUFNLENBQUEsTUFBQWUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWYsQ0FBQTtFQUFBO0VBQ29DLE1BQUFnQixFQUFBLEdBQUFiLG1CQUFtQixLQUFLLElBQUk7RUFBQSxJQUFBYyxFQUFBO0VBQUEsSUFBQWpCLENBQUEsUUFBQWdCLEVBQUE7SUFBakVDLEVBQUE7TUFBQUgsT0FBQSxFQUFXLGNBQWM7TUFBQUksUUFBQSxFQUFZRjtJQUE2QixDQUFDO0lBQUFoQixDQUFBLE1BQUFnQixFQUFBO0lBQUFoQixDQUFBLE1BQUFpQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBakIsQ0FBQTtFQUFBO0VBUHJFZCxhQUFhLENBQ1gsYUFBYSxFQUNiNkIsRUFJQyxFQUNERSxFQUNGLENBQUM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQW5CLENBQUEsU0FBQVAsWUFBQSxJQUFBTyxDQUFBLFNBQUFILGlCQUFBLElBQUFHLENBQUEsU0FBQU4sUUFBQTtJQUVEeUIsRUFBQSxZQUFBQyxtQkFBQVosS0FBQTtNQUNFLE1BQUFhLFFBQUEsR0FBaUJiLEtBQUssS0FBSyxNQUFNO01BQ2pDLElBQUlYLGlCQUE4QyxJQUF6QndCLFFBQVEsS0FBSzVCLFlBQVk7UUFDaERXLHNCQUFzQixDQUFDaUIsUUFBUSxDQUFDO01BQUE7UUFFaEMzQixRQUFRLENBQUMyQixRQUFRLENBQUM7TUFBQTtJQUNuQixDQUNGO0lBQUFyQixDQUFBLE9BQUFQLFlBQUE7SUFBQU8sQ0FBQSxPQUFBSCxpQkFBQTtJQUFBRyxDQUFBLE9BQUFOLFFBQUE7SUFBQU0sQ0FBQSxPQUFBbUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQVBELE1BQUFvQixrQkFBQSxHQUFBRCxFQU9DO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUF0QixDQUFBLFNBQUFNLE1BQUEsQ0FBQUMsR0FBQTtJQUtLZSxFQUFBLElBQUMsR0FBRyxDQUFlLFlBQUMsQ0FBRCxHQUFDLENBQWdCLGFBQVEsQ0FBUixRQUFRLENBQzFDLENBQUMsSUFBSSxDQUFPLEtBQVUsQ0FBVixVQUFVLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFDLG9CQUU1QixFQUZDLElBQUksQ0FHTCxDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsNENBQTRDLEVBQTFELElBQUksQ0FDUCxFQUxDLEdBQUcsQ0FLRTtJQUFBdEIsQ0FBQSxPQUFBc0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXRCLENBQUE7RUFBQTtFQUFBLElBQUF1QixFQUFBO0VBQUEsSUFBQXZCLENBQUEsU0FBQUcsbUJBQUEsSUFBQUgsQ0FBQSxTQUFBUCxZQUFBLElBQUFPLENBQUEsU0FBQW9CLGtCQUFBLElBQUFwQixDQUFBLFNBQUFKLFFBQUE7SUFOUjJCLEVBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUQsRUFLSyxDQUVKLENBQUFuQixtQkFBbUIsS0FBSyxJQW9CeEIsR0FuQkMsQ0FBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FBZSxZQUFDLENBQUQsR0FBQyxDQUFPLEdBQUMsQ0FBRCxHQUFDLENBQ2pELENBQUMsSUFBSSxDQUFPLEtBQVMsQ0FBVCxTQUFTLENBQUMsMklBSXRCLEVBSkMsSUFBSSxDQUtMLENBQUMsSUFBSSxDQUFPLEtBQVMsQ0FBVCxTQUFTLENBQUMsdUJBQXVCLEVBQTVDLElBQUksQ0FDUCxFQVBDLEdBQUcsQ0FtQkwsR0FWQyxDQUFDLEdBQUcsQ0FBZSxhQUFRLENBQVIsUUFBUSxDQUFlLFlBQUMsQ0FBRCxHQUFDLENBQ3pDLENBQUMsTUFBTSxDQUNTLFlBQStCLENBQS9CLENBQUFWLFlBQVksR0FBWixNQUErQixHQUEvQixPQUE4QixDQUFDLENBQzFCLGlCQUErQixDQUEvQixDQUFBQSxZQUFZLEdBQVosTUFBK0IsR0FBL0IsT0FBOEIsQ0FBQyxDQUN6Q2tCLE9BQU8sQ0FBUEEsUUFBTSxDQUFDLENBQ05TLFFBQWtCLENBQWxCQSxtQkFBaUIsQ0FBQyxDQUNsQixRQUFzQixDQUF0QixDQUFBeEIsUUFBc0IsSUFBdEI0QixLQUFxQixDQUFDLENBQ1osa0JBQUMsQ0FBRCxHQUFDLEdBRXpCLEVBVEMsR0FBRyxDQVVOLENBQ0YsRUE3QkMsR0FBRyxDQTZCRTtJQUFBeEIsQ0FBQSxPQUFBRyxtQkFBQTtJQUFBSCxDQUFBLE9BQUFQLFlBQUE7SUFBQU8sQ0FBQSxPQUFBb0Isa0JBQUE7SUFBQXBCLENBQUEsT0FBQUosUUFBQTtJQUFBSSxDQUFBLE9BQUF1QixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBdkIsQ0FBQTtFQUFBO0VBQUEsSUFBQXlCLEdBQUE7RUFBQSxJQUFBekIsQ0FBQSxTQUFBRyxtQkFBQSxJQUFBSCxDQUFBLFNBQUFFLFNBQUEsQ0FBQXdCLE9BQUEsSUFBQTFCLENBQUEsU0FBQUUsU0FBQSxDQUFBeUIsT0FBQTtJQUNORixHQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxNQUFNLENBQU4sS0FBSyxDQUFDLENBQ2xCLENBQUF2QixTQUFTLENBQUF5QixPQXNCVCxHQXRCQSxFQUNHLE1BQU8sQ0FBQXpCLFNBQVMsQ0FBQXdCLE9BQU8sQ0FBRSxjQUFjLEdBcUIxQyxHQXBCR3ZCLG1CQUFtQixLQUFLLElBb0IzQixHQW5CQyxDQUFDLE1BQU0sQ0FDTCxDQUFDLG9CQUFvQixDQUFVLFFBQU8sQ0FBUCxPQUFPLENBQVEsTUFBUyxDQUFULFNBQVMsR0FDdkQsQ0FBQyx3QkFBd0IsQ0FDaEIsTUFBWSxDQUFaLFlBQVksQ0FDWCxPQUFjLENBQWQsY0FBYyxDQUNiLFFBQUssQ0FBTCxLQUFLLENBQ0YsV0FBUSxDQUFSLFFBQVEsR0FFeEIsRUFSQyxNQUFNLENBbUJSLEdBVEMsQ0FBQyxNQUFNLENBQ0wsQ0FBQyxvQkFBb0IsQ0FBVSxRQUFPLENBQVAsT0FBTyxDQUFRLE1BQVMsQ0FBVCxTQUFTLEdBQ3ZELENBQUMsd0JBQXdCLENBQ2hCLE1BQVksQ0FBWixZQUFZLENBQ1gsT0FBYyxDQUFkLGNBQWMsQ0FDYixRQUFLLENBQUwsS0FBSyxDQUNGLFdBQU0sQ0FBTixNQUFNLEdBRXRCLEVBUkMsTUFBTSxDQVNULENBQ0YsRUF4QkMsSUFBSSxDQXdCRTtJQUFBSCxDQUFBLE9BQUFHLG1CQUFBO0lBQUFILENBQUEsT0FBQUUsU0FBQSxDQUFBd0IsT0FBQTtJQUFBMUIsQ0FBQSxPQUFBRSxTQUFBLENBQUF5QixPQUFBO0lBQUEzQixDQUFBLE9BQUF5QixHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBekIsQ0FBQTtFQUFBO0VBQUEsSUFBQTRCLEdBQUE7RUFBQSxJQUFBNUIsQ0FBQSxTQUFBeUIsR0FBQSxJQUFBekIsQ0FBQSxTQUFBdUIsRUFBQTtJQXZEVEssR0FBQSxJQUFDLElBQUksQ0FBTyxLQUFZLENBQVosWUFBWSxDQUN0QixDQUFBTCxFQTZCSyxDQUNMLENBQUFFLEdBd0JNLENBQ1IsRUF4REMsSUFBSSxDQXdERTtJQUFBekIsQ0FBQSxPQUFBeUIsR0FBQTtJQUFBekIsQ0FBQSxPQUFBdUIsRUFBQTtJQUFBdkIsQ0FBQSxPQUFBNEIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTVCLENBQUE7RUFBQTtFQUFBLE9BeERQNEIsR0F3RE87QUFBQTtBQWxISixTQUFBSixNQUFBIiwiaWdub3JlTGlzdCI6W119