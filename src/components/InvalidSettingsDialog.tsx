// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 类型依赖 { ValidationError } 来自 ../utils/settings/validation.js，用于校准终端渲染的数据契约。
import type { ValidationError } from '../utils/settings/validation.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 ValidationErrorsList，将 ./ValidationErrorsList.js 中已经封装好的能力接到本文件流程里。
import { ValidationErrorsList } from './ValidationErrorsList.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  settingsErrors: ValidationError[];
  // 这个回调绑定到 onContinue: () => void;，负责终端渲染在该局部场景下的响应。
  onContinue: () => void;
  // 这个回调绑定到 onExit: () => void;，负责终端渲染在该局部场景下的响应。
  onExit: () => void;
};

/**
 * Dialog shown when settings files have validation errors.
 * User must choose to continue (skipping invalid files) or exit to fix them.
 */
// InvalidSettingsDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function InvalidSettingsDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    settingsErrors,
    onContinue,
    onExit
  } = t0;
  // t1 暂存 `function handleSelect(value) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onContinue || $[1] !== onExit) {
    // t1 暂存 `function handleSelect(value) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function handleSelect(value) {
      // 当 `value` 匹配 `"exit"` 时，终端渲染执行对应分支。
      if (value === "exit") {
        // 调用 onExit，触发终端渲染此处需要的副作用。
        onExit();
      } else {
        // 调用 onContinue，触发终端渲染此处需要的副作用。
        onContinue();
      }
    };
    // $[0] 缓存 `onContinue`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onContinue;
    // $[1] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onExit;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // handleSelect沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t1;
  // t2 暂存 `<ValidationErrorsList errors={settingsErrors} />` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== settingsErrors) {
    // t2 暂存 `<ValidationErrorsList errors={settingsErrors} />` 生成的渲染片段，后续返回路径直接复用。
    t2 = <ValidationErrorsList errors={settingsErrors} />;
    // $[3] 缓存 `settingsErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = settingsErrors;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text dimColor={true}>Files with errors are skipped entir...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text dimColor={true}>Files with errors are skipped entir...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true}>Files with errors are skipped entirely, not just the invalid settings.</Text>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t4 = [{
      label: "Exit and fix manually",
      value: "exit"
    }, {
      label: "Continue without these settings",
      value: "continue"
    }];
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Select options={t4} onChange={handleSelect} />` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== handleSelect) {
    // t5 暂存 `<Select options={t4} onChange={handleSelect} />` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Select options={t4} onChange={handleSelect} />;
    // $[7] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = handleSelect;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Dialog title="Settings Error" onCancel={onExit} color="w...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== onExit || $[10] !== t2 || $[11] !== t5) {
    // t6 暂存 `<Dialog title="Settings Error" onCancel={onExit} color="w...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Dialog title="Settings Error" onCancel={onExit} color="warning">{t2}{t3}{t5}</Dialog>;
    // $[9] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = onExit;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJWYWxpZGF0aW9uRXJyb3IiLCJTZWxlY3QiLCJEaWFsb2ciLCJWYWxpZGF0aW9uRXJyb3JzTGlzdCIsIlByb3BzIiwic2V0dGluZ3NFcnJvcnMiLCJvbkNvbnRpbnVlIiwib25FeGl0IiwiSW52YWxpZFNldHRpbmdzRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsImhhbmRsZVNlbGVjdCIsInZhbHVlIiwidDIiLCJ0MyIsIlN5bWJvbCIsImZvciIsInQ0IiwibGFiZWwiLCJ0NSIsInQ2Il0sInNvdXJjZXMiOlsiSW52YWxpZFNldHRpbmdzRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy92YWxpZGF0aW9uLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yc0xpc3QgfSBmcm9tICcuL1ZhbGlkYXRpb25FcnJvcnNMaXN0LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzZXR0aW5nc0Vycm9yczogVmFsaWRhdGlvbkVycm9yW11cbiAgb25Db250aW51ZTogKCkgPT4gdm9pZFxuICBvbkV4aXQ6ICgpID0+IHZvaWRcbn1cblxuLyoqXG4gKiBEaWFsb2cgc2hvd24gd2hlbiBzZXR0aW5ncyBmaWxlcyBoYXZlIHZhbGlkYXRpb24gZXJyb3JzLlxuICogVXNlciBtdXN0IGNob29zZSB0byBjb250aW51ZSAoc2tpcHBpbmcgaW52YWxpZCBmaWxlcykgb3IgZXhpdCB0byBmaXggdGhlbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEludmFsaWRTZXR0aW5nc0RpYWxvZyh7XG4gIHNldHRpbmdzRXJyb3JzLFxuICBvbkNvbnRpbnVlLFxuICBvbkV4aXQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGZ1bmN0aW9uIGhhbmRsZVNlbGVjdCh2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHZhbHVlID09PSAnZXhpdCcpIHtcbiAgICAgIG9uRXhpdCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIG9uQ29udGludWUoKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPERpYWxvZyB0aXRsZT1cIlNldHRpbmdzIEVycm9yXCIgb25DYW5jZWw9e29uRXhpdH0gY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICA8VmFsaWRhdGlvbkVycm9yc0xpc3QgZXJyb3JzPXtzZXR0aW5nc0Vycm9yc30gLz5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICBGaWxlcyB3aXRoIGVycm9ycyBhcmUgc2tpcHBlZCBlbnRpcmVseSwgbm90IGp1c3QgdGhlIGludmFsaWQgc2V0dGluZ3MuXG4gICAgICA8L1RleHQ+XG4gICAgICA8U2VsZWN0XG4gICAgICAgIG9wdGlvbnM9e1tcbiAgICAgICAgICB7IGxhYmVsOiAnRXhpdCBhbmQgZml4IG1hbnVhbGx5JywgdmFsdWU6ICdleGl0JyB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ29udGludWUgd2l0aG91dCB0aGVzZSBzZXR0aW5ncycsXG4gICAgICAgICAgICB2YWx1ZTogJ2NvbnRpbnVlJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdfVxuICAgICAgICBvbkNoYW5nZT17aGFuZGxlU2VsZWN0fVxuICAgICAgLz5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsSUFBSSxRQUFRLFdBQVc7QUFDaEMsY0FBY0MsZUFBZSxRQUFRLGlDQUFpQztBQUN0RSxTQUFTQyxNQUFNLFFB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