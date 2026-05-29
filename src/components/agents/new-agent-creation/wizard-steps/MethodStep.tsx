// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 引入 Box，将 ../../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../../../ink.js';
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
// MethodStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MethodStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    goToStep
  } = useWizard();
  // t0 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t0 = [{
      label: "Generate with Claude (recommended)",
      value: "generate"
    }, {
      label: "Manual configuration",
      value: "manual"
    }];
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // methodOptions 集合保存`t0`，作为后续临时缓存值处理的输入。
  const methodOptions = t0;
  // t1 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="go back" /></Byline>;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== goNext || $[3] !== goToStep || $[4] !== updateWizardData) {
    // t2 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = value => {
      // method保存`value as 'generate' | 'manual'`，供终端 UI Method Step后续判断或输出使用。
      const method = value as 'generate' | 'manual';
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        method,
        wasGenerated: method === "generate"
      });
      // 当 `method` 匹配 `"generate"` 时，终端渲染执行对应分支。
      if (method === "generate") {
        // 调用 goNext，触发终端渲染此处需要的副作用。
        goNext();
      } else {
        // 调用 goToStep，触发终端渲染此处需要的副作用。
        goToStep(3);
      }
    };
    // $[2] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = goNext;
    // $[3] 缓存 `goToStep`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = goToStep;
    // $[4] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = updateWizardData;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `() => goBack()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== goBack) {
    // t3 暂存 `() => goBack()` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => goBack();
    // $[6] 缓存 `goBack`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = goBack;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // t4 暂存 `<WizardDialogLayout subtitle="Creation method" footerText...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t2 || $[9] !== t3) {
    // t4 暂存 `<WizardDialogLayout subtitle="Creation method" footerText...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <WizardDialogLayout subtitle="Creation method" footerText={t1}><Box><Select key="method-select" options={methodOptions} onChange={t2} onCancel={t3} /></Box></WizardDialogLayout>;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIkJveCIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIlNlbGVjdCIsIkJ5bGluZSIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwidXNlV2l6YXJkIiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwiQWdlbnRXaXphcmREYXRhIiwiTWV0aG9kU3RlcCIsIiQiLCJfYyIsImdvTmV4dCIsImdvQmFjayIsInVwZGF0ZVdpemFyZERhdGEiLCJnb1RvU3RlcCIsInQwIiwiU3ltYm9sIiwiZm9yIiwibGFiZWwiLCJ2YWx1ZSIsIm1ldGhvZE9wdGlvbnMiLCJ0MSIsInQyIiwibWV0aG9kIiwid2FzR2VuZXJhdGVkIiwidDMiLCJ0NCJdLCJzb3VyY2VzIjpbIk1ldGhvZFN0ZXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB0eXBlIFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94IH0gZnJvbSAnLi4vLi4vLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vLi4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vLi4vLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi8uLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgdXNlV2l6YXJkIH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL2luZGV4LmpzJ1xuaW1wb3J0IHsgV2l6YXJkRGlhbG9nTGF5b3V0IH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL1dpemFyZERpYWxvZ0xheW91dC5qcydcbmltcG9ydCB0eXBlIHsgQWdlbnRXaXphcmREYXRhIH0gZnJvbSAnLi4vdHlwZXMuanMnXG5cbmV4cG9ydCBmdW5jdGlvbiBNZXRob2RTdGVwKCk6IFJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgZ29OZXh0LCBnb0JhY2ssIHVwZGF0ZVdpemFyZERhdGEsIGdvVG9TdGVwIH0gPVxuICAgIHVzZVdpemFyZDxBZ2VudFdpemFyZERhdGE+KClcblxuICBjb25zdCBtZXRob2RPcHRpb25zID0gW1xuICAgIHtcbiAgICAgIGxhYmVsOiAnR2VuZXJhdGUgd2l0aCBDbGF1ZGUgKHJlY29tbWVuZGVkKScsXG4gICAgICB2YWx1ZTogJ2dlbmVyYXRlJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiAnTWFudWFsIGNvbmZpZ3VyYXRpb24nLFxuICAgICAgdmFsdWU6ICdtYW51YWwnLFxuICAgIH0sXG4gIF1cblxuICByZXR1cm4gKFxuICAgIDxXaXphcmREaWFsb2dMYXlvdXRcbiAgICAgIHN1YnRpdGxlPVwiQ3JlYXRpb24gbWV0aG9kXCJcbiAgICAgIGZvb3RlclRleHQ9e1xuICAgICAgICA8QnlsaW5lPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIuKGkeKGk1wiIGFjdGlvbj1cIm5hdmlnYXRlXCIgLz5cbiAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFbnRlclwiIGFjdGlvbj1cInNlbGVjdFwiIC8+XG4gICAgICAgICAgPENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludFxuICAgICAgICAgICAgYWN0aW9uPVwiY29uZmlybTpub1wiXG4gICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiZ28gYmFja1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9CeWxpbmU+XG4gICAgICB9XG4gICAgPlxuICAgICAgPEJveD5cbiAgICAgICAgPFNlbGVjdFxuICAgICAgICAgIGtleT1cIm1ldGhvZC1zZWxlY3RcIlxuICAgICAgICAgIG9wdGlvbnM9e21ldGhvZE9wdGlvbnN9XG4gICAgICAgICAgb25DaGFuZ2U9eyh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtZXRob2QgPSB2YWx1ZSBhcyAnZ2VuZXJhdGUnIHwgJ21hbnVhbCdcbiAgICAgICAgICAgIHVwZGF0ZVdpemFyZERhdGEoe1xuICAgICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICAgIHdhc0dlbmVyYXRlZDogbWV0aG9kID09PSAnZ2VuZXJhdGUnLFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gRHluYW1pYyBuYXZpZ2F0aW9uIGJhc2VkIG9uIG1ldGhvZFxuICAgICAgICAgICAgaWYgKG1ldGhvZCA9PT0gJ2dlbmVyYXRlJykge1xuICAgICAgICAgICAgICBnb05leHQoKSAvLyBHbyB0byBHZW5lcmF0ZVN0ZXAgKGluZGV4IDIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBnb1RvU3RlcCgzKSAvLyBTa2lwIHRvIFR5cGVTdGVwIChpbmRleCAzKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IGdvQmFjaygpfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9XaXphcmREaWFsb2dMYXlvdXQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSSxLQUFLQyxTQUFTLFFBQVEsT0FBTztBQUM3QyxTQUFTQyxHQUFHLFFBQVEsb0JBQW9CO0FBQ3hDLFNBQVNDLHdCQUF3QixRQUFRLHNDQUFzQztBQUMvRSxTQUFTQyxNQUFNLFFBQVEsaUNBQWlDO0FBQ3hELFNBQVNDLE1BQU0sUUFBUSxrQ0FBa0M7QUFDekQsU0FBU0Msb0JBQW9CLFFBQVEsZ0RBQWdEO0FBQ3JGLFNBQVNDLFNBQVMsUUFBUSwwQkFBMEI7QUFDcEQsU0FBU0Msa0JBQWtC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