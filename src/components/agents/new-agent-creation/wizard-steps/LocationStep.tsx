// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 引入 Box，将 ../../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../../../ink.js';
// 类型依赖 { SettingSource } 来自 ../../../../utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from '../../../../utils/settings/constants.js';
// 引入 ConfigurableShortcutHint，将 ../../../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
// 引入 Select，将 ../../../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../../../CustomSelect/select.js';
// 引入 Byline，将 ../../../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../../../design-system/Byline.js';
// 引入 KeyboardShortcutHint，将 ../../../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
// 引入 useWizard，将 ../../../wizard/index.js 中已经封装好的能力接到本文件流程里。
import { useWizard } from '../../../wizard/index.js';
// 引入 WizardDialogLayout，将 ../../../wizard/WizardDialogLayout.js 中已经封装好的能力接到本文件流程里。
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// LocationStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function LocationStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    updateWizardData,
    cancel
  } = useWizard();
  // t0 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t0 = {
      label: "Project (.claude/agents/)",
      value: "projectSettings" as SettingSource
    };
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // t1 暂存 `[t0, {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[t0, {` 生成的渲染片段，后续返回路径直接复用。
    t1 = [t0, {
      label: "Personal (~/.claude/agents/)",
      value: "userSettings" as SettingSource
    }];
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // locationOptions 集合保存`t1`，作为后续临时缓存值处理的输入。
  const locationOptions = t1;
  // t2 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="cancel" /></Byline>;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== goNext || $[4] !== updateWizardData) {
    // t3 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = value => {
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        location: value as SettingSource
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[3] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = goNext;
    // $[4] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = updateWizardData;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `() => cancel()` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== cancel) {
    // t4 暂存 `() => cancel()` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => cancel();
    // $[6] 缓存 `cancel`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = cancel;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<WizardDialogLayout subtitle="Choose location" footerText...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t3 || $[9] !== t4) {
    // t5 暂存 `<WizardDialogLayout subtitle="Choose location" footerText...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <WizardDialogLayout subtitle="Choose location" footerText={t2}><Box><Select key="location-select" options={locationOptions} onChange={t3} onCancel={t4} /></Box></WizardDialogLayout>;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIkJveCIsIlNldHRpbmdTb3VyY2UiLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJTZWxlY3QiLCJCeWxpbmUiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsInVzZVdpemFyZCIsIldpemFyZERpYWxvZ0xheW91dCIsIkFnZW50V2l6YXJkRGF0YSIsIkxvY2F0aW9uU3RlcCIsIiQiLCJfYyIsImdvTmV4dCIsInVwZGF0ZVdpemFyZERhdGEiLCJjYW5jZWwiLCJ0MCIsIlN5bWJvbCIsImZvciIsImxhYmVsIiwidmFsdWUiLCJ0MSIsImxvY2F0aW9uT3B0aW9ucyIsInQyIiwidDMiLCJsb2NhdGlvbiIsInQ0IiwidDUiXSwic291cmNlcyI6WyJMb2NhdGlvblN0ZXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB0eXBlIFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94IH0gZnJvbSAnLi4vLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nU291cmNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvc2V0dGluZ3MvY29uc3RhbnRzLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vLi4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vLi4vLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi8uLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgdXNlV2l6YXJkIH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL2luZGV4LmpzJ1xuaW1wb3J0IHsgV2l6YXJkRGlhbG9nTGF5b3V0IH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL1dpemFyZERpYWxvZ0xheW91dC5qcydcbmltcG9ydCB0eXBlIHsgQWdlbnRXaXphcmREYXRhIH0gZnJvbSAnLi4vdHlwZXMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBMb2NhdGlvblN0ZXAoKTogUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBnb05leHQsIHVwZGF0ZVdpemFyZERhdGEsIGNhbmNlbCB9ID0gdXNlV2l6YXJkPEFnZW50V2l6YXJkRGF0YT4oKVxuXG4gIGNvbnN0IGxvY2F0aW9uT3B0aW9ucyA9IFtcbiAgICB7XG4gICAgICBsYWJlbDogJ1Byb2plY3QgKC5jbGF1ZGUvYWdlbnRzLyknLFxuICAgICAgdmFsdWU6ICdwcm9qZWN0U2V0dGluZ3MnIGFzIFNldHRpbmdTb3VyY2UsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ1BlcnNvbmFsICh+Ly5jbGF1ZGUvYWdlbnRzLyknLFxuICAgICAgdmFsdWU6ICd1c2VyU2V0dGluZ3MnIGFzIFNldHRpbmdTb3VyY2UsXG4gICAgfSxcbiAgXVxuXG4gIHJldHVybiAoXG4gICAgPFdpemFyZERpYWxvZ0xheW91dFxuICAgICAgc3VidGl0bGU9XCJDaG9vc2UgbG9jYXRpb25cIlxuICAgICAgZm9vdGVyVGV4dD17XG4gICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwi4oaR4oaTXCIgYWN0aW9uPVwibmF2aWdhdGVcIiAvPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwic2VsZWN0XCIgLz5cbiAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgIGNvbnRleHQ9XCJDb25maXJtYXRpb25cIlxuICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJjYW5jZWxcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQnlsaW5lPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBrZXk9XCJsb2NhdGlvbi1zZWxlY3RcIlxuICAgICAgICAgIG9wdGlvbnM9e2xvY2F0aW9uT3B0aW9uc31cbiAgICAgICAgICBvbkNoYW5nZT17KHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIHVwZGF0ZVdpemFyZERhdGEoeyBsb2NhdGlvbjogdmFsdWUgYXMgU2V0dGluZ1NvdXJjZSB9KVxuICAgICAgICAgICAgZ29OZXh0KClcbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBjYW5jZWwoKX1cbiAgICAgICAgLz5cbiAgICAgIDwvQm94PlxuICAgIDwvV2l6YXJkRGlhbG9nTGF5b3V0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxRQUFRLE9BQU87QUFDN0MsU0FBU0MsR0FBRyxRQUFRLG9CQUFvQjtBQUN4QyxjQUFjQyxhQUFhLFFBQVEseUNBQXlDO0FBQzVFLFNBQVNDLHdCQUF3QixRQUFRLHNDQUFzQztBQUMvRSxTQUFTQyxNQUFNLFFBQVEsaUNBQWlDO0FBQ3hELFNBQVNDLE1BQU0sUUFBUSxrQ0FBa0M7QUFDekQsU0FBU0Msb0JBQW9CLFFBQVEsZ0RBQWdEO0FBQ3JGLFNBQVNDLFNBQVMsUUFBUSwwQkFBMEI7QUFDcEQsU0FBU0Msa0JBQWtCLFFBQVEsdUNBQXVDO0FBQzFFLGNBQWNDLGVBQWUsUUFBUSxhQUFhO0FBRWxELE9BQU8sU0FBQUMsYUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUNMO0lBQUFDLE1BQUE7SUFBQUMsZ0JBQUE7SUFBQUM7RUFBQSxJQUE2Q1IsU0FBUyxDQUFrQixDQUFDO0VBQUEsSUFBQVMsRUFBQTtFQUFBLElBQUFMLENBQUEsUUFBQU0s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