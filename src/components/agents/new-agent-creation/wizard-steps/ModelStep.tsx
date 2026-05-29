// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 引入 ConfigurableShortcutHint，将 ../../../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
// 引入 Byline，将 ../../../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../../../design-system/Byline.js';
// 引入 KeyboardShortcutHint，将 ../../../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
// 引入 useWizard，将 ../../../wizard/index.js 中已经封装好的能力接到本文件流程里。
import { useWizard } from '../../../wizard/index.js';
// 引入 WizardDialogLayout，将 ../../../wizard/WizardDialogLayout.js 中已经封装好的能力接到本文件流程里。
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
// 引入 ModelSelector，将 ../../ModelSelector.js 中已经封装好的能力接到本文件流程里。
import { ModelSelector } from '../../ModelSelector.js';
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// ModelStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ModelStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  // t0 暂存 `model => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== goNext || $[1] !== updateWizardData) {
    // t0 暂存 `model => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = model => {
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        selectedModel: model
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[0] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = goNext;
    // $[1] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = updateWizardData;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // handleComplete保存`t0`，作为后续临时缓存值处理的输入。
  const handleComplete = t0;
  // t1 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="go back" /></Byline>;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // t2 暂存 `<WizardDialogLayout subtitle="Select model" footerText={t...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== goBack || $[5] !== handleComplete || $[6] !== wizardData.selectedModel) {
    // t2 暂存 `<WizardDialogLayout subtitle="Select model" footerText={t...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <WizardDialogLayout subtitle="Select model" footerText={t1}><ModelSelector initialModel={wizardData.selectedModel} onComplete={handleComplete} onCancel={goBack} /></WizardDialogLayout>;
    // $[4] 缓存 `goBack`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = goBack;
    // $[5] 缓存 `handleComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = handleComplete;
    // $[6] 缓存 `wizardData.selectedModel`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = wizardData.selectedModel;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIkJ5bGluZSIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwidXNlV2l6YXJkIiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwiTW9kZWxTZWxlY3RvciIsIkFnZW50V2l6YXJkRGF0YSIsIk1vZGVsU3RlcCIsIiQiLCJfYyIsImdvTmV4dCIsImdvQmFjayIsInVwZGF0ZVdpemFyZERhdGEiLCJ3aXphcmREYXRhIiwidDAiLCJtb2RlbCIsInNlbGVjdGVkTW9kZWwiLCJoYW5kbGVDb21wbGV0ZSIsInQxIiwiU3ltYm9sIiwiZm9yIiwidDIiXSwic291cmNlcyI6WyJNb2RlbFN0ZXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB0eXBlIFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vLi4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vLi4vLi4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyB1c2VXaXphcmQgfSBmcm9tICcuLi8uLi8uLi93aXphcmQvaW5kZXguanMnXG5pbXBvcnQgeyBXaXphcmREaWFsb2dMYXlvdXQgfSBmcm9tICcuLi8uLi8uLi93aXphcmQvV2l6YXJkRGlhbG9nTGF5b3V0LmpzJ1xuaW1wb3J0IHsgTW9kZWxTZWxlY3RvciB9IGZyb20gJy4uLy4uL01vZGVsU2VsZWN0b3IuanMnXG5pbXBvcnQgdHlwZSB7IEFnZW50V2l6YXJkRGF0YSB9IGZyb20gJy4uL3R5cGVzLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gTW9kZWxTdGVwKCk6IFJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgZ29OZXh0LCBnb0JhY2ssIHVwZGF0ZVdpemFyZERhdGEsIHdpemFyZERhdGEgfSA9XG4gICAgdXNlV2l6YXJkPEFnZW50V2l6YXJkRGF0YT4oKVxuXG4gIGNvbnN0IGhhbmRsZUNvbXBsZXRlID0gKG1vZGVsPzogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgdXBkYXRlV2l6YXJkRGF0YSh7IHNlbGVjdGVkTW9kZWw6IG1vZGVsIH0pXG4gICAgZ29OZXh0KClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFdpemFyZERpYWxvZ0xheW91dFxuICAgICAgc3VidGl0bGU9XCJTZWxlY3QgbW9kZWxcIlxuICAgICAgZm9vdGVyVGV4dD17XG4gICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwi4oaR4oaTXCIgYWN0aW9uPVwibmF2aWdhdGVcIiAvPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwic2VsZWN0XCIgLz5cbiAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgIGNvbnRleHQ9XCJDb25maXJtYXRpb25cIlxuICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJnbyBiYWNrXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L0J5bGluZT5cbiAgICAgIH1cbiAgICA+XG4gICAgICA8TW9kZWxTZWxlY3RvclxuICAgICAgICBpbml0aWFsTW9kZWw9e3dpemFyZERhdGEuc2VsZWN0ZWRNb2RlbH1cbiAgICAgICAgb25Db21wbGV0ZT17aGFuZGxlQ29tcGxldGV9XG4gICAgICAgIG9uQ2FuY2VsPXtnb0JhY2t9XG4gICAgICAvPlxuICAgIDwvV2l6YXJkRGlhbG9nTGF5b3V0PlxuICApXG59XG4iXSwi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