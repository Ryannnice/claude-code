// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react';
// 类型依赖 { Workflow } 来自 ../commands/install-github-app/types.js，用于校准终端渲染的数据契约。
import type { Workflow } from '../commands/install-github-app/types.js';
// 类型依赖 { ExitState } 来自 ../hooks/useExitOnCtrlCDWithKeybindings.js，用于校准终端渲染的数据契约。
import type { ExitState } from '../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Link、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../ink.js';
// 引入 ConfigurableShortcutHint，将 ./ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
// 引入 SelectMulti，将 ./CustomSelect/SelectMulti.js 中已经封装好的能力接到本文件流程里。
import { SelectMulti } from './CustomSelect/SelectMulti.js';
// 引入 Byline，将 ./design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './design-system/Byline.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// WorkflowOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type WorkflowOption = {
  value: Workflow;
  label: string;
};
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onSubmit: (selectedWorkflows: Workflow[]) => void;，负责终端渲染在该局部场景下的响应。
  onSubmit: (selectedWorkflows: Workflow[]) => void;
  defaultSelections: Workflow[];
};
// WORKFLOWS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const WORKFLOWS: WorkflowOption[] = [{
  value: 'claude' as const,
  label: '@Claude Code - Tag @claude in issues and PR comments'
}, {
  value: 'claude-review' as const,
  label: 'Claude Code Review - Automated code review on new PRs'
}];
// renderInputGuide 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderInputGuide(exitState: ExitState): React.ReactNode {
  // 满足 `exitState.pending` 时，终端渲染执行该分支。
  if (exitState.pending) {
    // 返回 `<Text>Press {exitState.keyName} again to exit</Text>`，作为终端渲染这次计算的结果。
    return <Text>Press {exitState.keyName} again to exit</Text>;
  }
  // 返回 `<Byline>`，作为终端渲染这次计算的结果。
  return <Byline>
      <KeyboardShortcutHint shortcut="↑↓" action="navigate" />
      <KeyboardShortcutHint shortcut="Space" action="toggle" />
      <KeyboardShortcutHint shortcut="Enter" action="confirm" />
      <ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" />
    </Byline>;
}
// WorkflowMultiselectDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WorkflowMultiselectDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onSubmit,
    defaultSelections
  } = t0;
  // showError 错误信息 由 React state 持有，setShowError 会在用户操作或异步结果返回时触发刷新。
  const [showError, setShowError] = useState(false);
  // t1 暂存 `selectedValues => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onSubmit) {
    // t1 暂存 `selectedValues => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = selectedValues => {
      // selectedValues 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
      if (selectedValues.length === 0) {
        // setShowError 写入新的状态值，使终端渲染后续读取保持一致。
        setShowError(true);
        // 终端 UI 组件 Workflow Multiselect Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setShowError 写入新的状态值，使终端渲染后续读取保持一致。
      setShowError(false);
      // 调用 onSubmit，触发终端渲染此处需要的副作用。
      onSubmit(selectedValues);
    };
    // $[0] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onSubmit;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // handleSubmit 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleSubmit = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // setShowError 写入新的状态值，使终端渲染后续读取保持一致。
      setShowError(false);
    };
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // handleChange 命名 `t2`，让后续代码直接表达这个值的用途。
  const handleChange = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // setShowError 写入新的状态值，使终端渲染后续读取保持一致。
      setShowError(true);
    };
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // handleCancel沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleCancel = t3;
  // t4 暂存 `<Box><Text dimColor={true}>More workflow examples (issue ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box><Text dimColor={true}>More workflow examples (issue ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box><Text dimColor={true}>More workflow examples (issue triage, CI fixes, etc.) at:{" "}<Link url="https://github.com/anthropics/claude-code-action/blob/main/examples/">https://github.com/anthropics/claude-code-action/blob/main/examples/</Link></Text></Box>;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `WORKFLOWS.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `WORKFLOWS.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t5 = WORKFLOWS.map(_temp);
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // t6 暂存 `<SelectMulti options={t5} defaultValue={defaultSelections...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== defaultSelections || $[7] !== handleSubmit) {
    // t6 暂存 `<SelectMulti options={t5} defaultValue={defaultSelections...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <SelectMulti options={t5} defaultValue={defaultSelections} onSubmit={handleSubmit} onChange={handleChange} onCancel={handleCancel} hideIndexes={true} />;
    // $[6] 缓存 `defaultSelections`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = defaultSelections;
    // $[7] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = handleSubmit;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `showError && <Box><Text color="error">You must select at ...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== showError) {
    // t7 暂存 `showError && <Box><Text color="error">You must select at ...` 生成的渲染片段，后续返回路径直接复用。
    t7 = showError && <Box><Text color="error">You must select at least one workflow to continue</Text></Box>;
    // $[9] 缓存 `showError`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = showError;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // t8 暂存 `<Dialog title="Select GitHub workflows to install" subtit...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t6 || $[12] !== t7) {
    // t8 暂存 `<Dialog title="Select GitHub workflows to install" subtit...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Dialog title="Select GitHub workflows to install" subtitle="We'll create a workflow file in your repository for each one you select." onCancel={handleCancel} inputGuide={renderInputGuide}>{t4}{t6}{t7}</Dialog>;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(workflow) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: workflow.label,
    value: workflow.value
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJXb3JrZmxvdyIsIkV4aXRTdGF0ZSIsIkJveCIsIkxpbmsiLCJUZXh0IiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiU2VsZWN0TXVsdGkiLCJCeWxpbmUiLCJEaWFsb2ciLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIldvcmtmbG93T3B0aW9uIiwidmFsdWUiLCJsYWJlbCIsIlByb3BzIiwib25TdWJtaXQiLCJzZWxlY3RlZFdvcmtmbG93cyIsImRlZmF1bHRTZWxlY3Rpb25zIiwiV09SS0ZMT1dTIiwiY29uc3QiLCJyZW5kZXJJbnB1dEd1aWRlIiwiZXhpdFN0YXRlIiwiUmVhY3ROb2RlIiwicGVuZGluZyIsImtleU5hbWUiLCJXb3JrZmxvd011bHRpc2VsZWN0RGlhbG9nIiwidDAiLCIkIiwiX2MiLCJzaG93RXJyb3IiLCJzZXRTaG93RXJyb3IiLCJ0MSIsInNlbGVjdGVkVmFsdWVzIiwibGVuZ3RoIiwiaGFuZGxlU3VibWl0IiwidDIiLCJTeW1ib2wiLCJmb3IiLCJoYW5kbGVDaGFuZ2UiLCJ0MyIsImhhbmRsZUNhbmNlbCIsInQ0IiwidDUiLCJtYXAiLCJfdGVtcCIsInQ2IiwidDciLCJ0OCIsIndvcmtmbG93Il0sInNvdXJjZXMiOlsiV29ya2Zsb3dNdWx0aXNlbGVjdERpYWxvZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBXb3JrZmxvdyB9IGZyb20gJy4uL2NvbW1hbmRzL2luc3RhbGwtZ2l0aHViLWFwcC90eXBlcy5qcydcbmltcG9ydCB0eXBlIHsgRXhpdFN0YXRlIH0gZnJvbSAnLi4vaG9va3MvdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzLmpzJ1xuaW1wb3J0IHsgQm94LCBMaW5rLCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBTZWxlY3RNdWx0aSB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L1NlbGVjdE11bHRpLmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9LZXlib2FyZFNob3J0Y3V0SGludC5qcydcblxudHlwZSBXb3JrZmxvd09wdGlvbiA9IHtcbiAgdmFsdWU6IFdvcmtmbG93XG4gIGxhYmVsOiBzdHJpbmdcbn1cblxudHlwZSBQcm9wcyA9IHtcbiAgb25TdWJtaXQ6IChzZWxlY3RlZFdvcmtmbG93czogV29ya2Zsb3dbXSkgPT4gdm9pZFxuICBkZWZhdWx0U2VsZWN0aW9uczogV29ya2Zsb3dbXVxufVxuXG5jb25zdCBXT1JLRkxPV1M6IFdvcmtmbG93T3B0aW9uW10gPSBbXG4gIHtcbiAgICB2YWx1ZTogJ2NsYXVkZScgYXMgY29uc3QsXG4gICAgbGFiZWw6ICdAQ2xhdWRlIENvZGUgLSBUYWcgQGNsYXVkZSBpbiBpc3N1ZXMgYW5kIFBSIGNvbW1lbnRzJyxcbiAgfSxcbiAge1xuICAgIHZhbHVlOiAnY2xhdWRlLXJldmlldycgYXMgY29uc3QsXG4gICAgbGFiZWw6ICdDbGF1ZGUgQ29kZSBSZXZpZXcgLSBBdXRvbWF0ZWQgY29kZSByZXZpZXcgb24gbmV3IFBScycsXG4gIH0sXG5dXG5cbmZ1bmN0aW9uIHJlbmRlcklucHV0R3VpZGUoZXhpdFN0YXRlOiBFeGl0U3RhdGUpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBpZiAoZXhpdFN0YXRlLnBlbmRpbmcpIHtcbiAgICByZXR1cm4gPFRleHQ+UHJlc3Mge2V4aXRTdGF0ZS5rZXlOYW1lfSBhZ2FpbiB0byBleGl0PC9UZXh0PlxuICB9XG4gIHJldHVybiAoXG4gICAgPEJ5bGluZT5cbiAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIuKGkeKGk1wiIGFjdGlvbj1cIm5hdmlnYXRlXCIgLz5cbiAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIlNwYWNlXCIgYWN0aW9uPVwidG9nZ2xlXCIgLz5cbiAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwiY29uZmlybVwiIC8+XG4gICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICBkZXNjcmlwdGlvbj1cImNhbmNlbFwiXG4gICAgICAvPlxuICAgIDwvQnlsaW5lPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBXb3JrZmxvd011bHRpc2VsZWN0RGlhbG9nKHtcbiAgb25TdWJtaXQsXG4gIGRlZmF1bHRTZWxlY3Rpb25zLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbc2hvd0Vycm9yLCBzZXRTaG93RXJyb3JdID0gdXNlU3RhdGUoZmFsc2UpXG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gdXNlQ2FsbGJhY2soXG4gICAgKHNlbGVjdGVkVmFsdWVzOiBXb3JrZmxvd1tdKSA9PiB7XG4gICAgICBpZiAoc2VsZWN0ZWRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHNldFNob3dFcnJvcih0cnVlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIHNldFNob3dFcnJvcihmYWxzZSlcbiAgICAgIG9uU3VibWl0KHNlbGVjdGVkVmFsdWVzKVxuICAgIH0sXG4gICAgW29uU3VibWl0XSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZUNoYW5nZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRTaG93RXJyb3IoZmFsc2UpXG4gIH0sIFtdKVxuXG4gIC8vIENhbmNlbCBqdXN0IHNob3dzIHRoZSBlcnJvciAtIHVzZXIgbXVzdCBzZWxlY3QgYXQgbGVhc3Qgb25lIHdvcmtmbG93XG4gIGNvbnN0IGhhbmRsZUNhbmNlbCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBzZXRTaG93RXJyb3IodHJ1ZSlcbiAgfSwgW10pXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT1cIlNlbGVjdCBHaXRIdWIgd29ya2Zsb3dzIHRvIGluc3RhbGxcIlxuICAgICAgc3VidGl0bGU9XCJXZSdsbCBjcmVhdGUgYSB3b3JrZmxvdyBmaWxlIGluIHlvdXIgcmVwb3NpdG9yeSBmb3IgZWFjaCBvbmUgeW91IHNlbGVjdC5cIlxuICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbH1cbiAgICAgIGlucHV0R3VpZGU9e3JlbmRlcklucHV0R3VpZGV9XG4gICAgPlxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgTW9yZSB3b3JrZmxvdyBleGFtcGxlcyAoaXNzdWUgdHJpYWdlLCBDSSBmaXhlcywgZXRjLikgYXQ6eycgJ31cbiAgICAgICAgICA8TGluayB1cmw9XCJodHRwczovL2dpdGh1Yi5jb20vYW50aHJvcGljcy9jbGF1ZGUtY29kZS1hY3Rpb24vYmxvYi9tYWluL2V4YW1wbGVzL1wiPlxuICAgICAgICAgICAgaHR0cHM6Ly9naXRodWIuY29tL2FudGhyb3BpY3MvY2xhdWRlLWNvZGUtYWN0aW9uL2Jsb2IvbWFpbi9leGFtcGxlcy9cbiAgICAgICAgICA8L0xpbms+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuXG4gICAgICA8U2VsZWN0TXVsdGlcbiAgICAgICAgb3B0aW9ucz17V09SS0ZMT1dTLm1hcCh3b3JrZmxvdyA9PiAoe1xuICAgICAgICAgIGxhYmVsOiB3b3JrZmxvdy5sYWJlbCxcbiAgICAgICAgICB2YWx1ZTogd29ya2Zsb3cudmFsdWUsXG4gICAgICAgIH0pKX1cbiAgICAgICAgZGVmYXVsdFZhbHVlPXtkZWZhdWx0U2VsZWN0aW9uc31cbiAgICAgICAgb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdH1cbiAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUNoYW5nZX1cbiAgICAgICAgb25DYW5jZWw9e2hhbmRsZUNhbmNlbH1cbiAgICAgICAgaGlkZUluZGV4ZXNcbiAgICAgIC8+XG5cbiAgICAgIHtzaG93RXJyb3IgJiYgKFxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgIFlvdSBtdXN0IHNlbGVjdCBhdCBsZWFzdCBvbmUgd29ya2Zsb3cgdG8gY29udGludWVcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxXQUFXLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3BELGNBQWNDLFFBQVEsUUFBUSx5Q0FBeUM7QUFDdkUsY0FBY0MsU0FBUyxRQUFRLDRDQUE0QztBQUMzRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDM0MsU0FBU0Msd0JBQXdCLFFBQVEsK0JBQStCO0FBQ3hFLFNBQVNDLFdBQVcsUUFBUSwrQkFBK0I7QUFDM0QsU0FBU0MsTUFBTSxRQUFRLDJCQUEyQjtBQUNsRCxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBQ2xELFNBQVNDLG9CQUFvQixRQUFRLHlDQUF5QztBQUU5RSxLQUFLQyxjQUFjLEdBQUc7RUFDcEJDLEtBQUssRUFBRVgsUUFBUTtFQUNmWSxLQUFLLEVBQUUsTUFBTTtBQUNmLENBQUM7QUFFRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsUUFBUSxFQUFFLENBQUNDLGlCQUFpQixFQUFFZixRQUFRLEVBQUUsRUFBRSxHQUFHLElBQUk7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