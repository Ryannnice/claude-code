// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 引入 Box，将 ../../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../../../ink.js';
// 引入 useKeybinding，将 ../../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
// 类型依赖 { AgentColorName } 来自 ../../../../tools/AgentTool/agentColorManager.js，用于校准终端渲染的数据契约。
import type { AgentColorName } from '../../../../tools/AgentTool/agentColorManager.js';
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
// 引入 ColorPicker，将 ../../ColorPicker.js 中已经封装好的能力接到本文件流程里。
import { ColorPicker } from '../../ColorPicker.js';
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// ColorStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ColorStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  // t0 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t0 = {
      context: "Confirmation"
    };
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", goBack, t0);
  // t1 暂存 `color => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== goNext || $[2] !== updateWizardData || $[3] !== wizardData.agentType || $[4] !== wizardData.location || $[5] !== wizardData.selectedModel || $[6] !== wizardData.selectedTools || $[7] !== wizardData.systemPrompt || $[8] !== wizardData.whenToUse) {
    // t1 暂存 `color => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = color => {
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        selectedColor: color,
        finalAgent: {
          agentType: wizardData.agentType,
          whenToUse: wizardData.whenToUse,
          // 这个回调绑定到 getSystemPrompt: () => wizardData.systemPrompt,，负责终端渲染在该局部场景下的响应。
          getSystemPrompt: () => wizardData.systemPrompt,
          tools: wizardData.selectedTools,
          ...(wizardData.selectedModel ? {
            model: wizardData.selectedModel
          } : {}),
          ...(color ? {
            color: color as AgentColorName
          } : {}),
          source: wizardData.location
        }
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[1] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = goNext;
    // $[2] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = updateWizardData;
    // $[3] 缓存 `wizardData.agentType`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = wizardData.agentType;
    // $[4] 缓存 `wizardData.location`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = wizardData.location;
    // $[5] 缓存 `wizardData.selectedModel`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = wizardData.selectedModel;
    // $[6] 缓存 `wizardData.selectedTools`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = wizardData.selectedTools;
    // $[7] 缓存 `wizardData.systemPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = wizardData.systemPrompt;
    // $[8] 缓存 `wizardData.whenToUse`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = wizardData.whenToUse;
    // $[9] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[9];
  }
  // handleConfirm保存`t1`，作为后续临时缓存值处理的输入。
  const handleConfirm = t1;
  // t2 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="go back" /></Byline>;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[10];
  }
  // t3标记终端 UI Color Step是否启用对应路径。
  const t3 = wizardData.agentType || "agent";
  // t4 暂存 `<WizardDialogLayout subtitle="Choose background color" fo...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== handleConfirm || $[12] !== t3) {
    // t4 暂存 `<WizardDialogLayout subtitle="Choose background color" fo...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <WizardDialogLayout subtitle="Choose background color" footerText={t2}><Box><ColorPicker agentName={t3} currentColor="automatic" onConfirm={handleConfirm} /></Box></WizardDialogLayout>;
    // $[11] 缓存 `handleConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = handleConfirm;
    // $[12] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t3;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[13];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIkJveCIsInVzZUtleWJpbmRpbmciLCJBZ2VudENvbG9yTmFtZSIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIkJ5bGluZSIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwidXNlV2l6YXJkIiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwiQ29sb3JQaWNrZXIiLCJBZ2VudFdpemFyZERhdGEiLCJDb2xvclN0ZXAiLCIkIiwiX2MiLCJnb05leHQiLCJnb0JhY2siLCJ1cGRhdGVXaXphcmREYXRhIiwid2l6YXJkRGF0YSIsInQwIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQxIiwiYWdlbnRUeXBlIiwibG9jYXRpb24iLCJzZWxlY3RlZE1vZGVsIiwic2VsZWN0ZWRUb29scyIsInN5c3RlbVByb21wdCIsIndoZW5Ub1VzZSIsImNvbG9yIiwic2VsZWN0ZWRDb2xvciIsImZpbmFsQWdlbnQiLCJnZXRTeXN0ZW1Qcm9tcHQiLCJ0b29scyIsIm1vZGVsIiwic291cmNlIiwiaGFuZGxlQ29uZmlybSIsInQyIiwidDMiLCJ0NCJdLCJzb3VyY2VzIjpbIkNvbG9yU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHR5cGUgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3ggfSBmcm9tICcuLi8uLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4vLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB0eXBlIHsgQWdlbnRDb2xvck5hbWUgfSBmcm9tICcuLi8uLi8uLi8uLi90b29scy9BZ2VudFRvb2wvYWdlbnRDb2xvck1hbmFnZXIuanMnXG5pbXBvcnQgeyBDb25maWd1cmFibGVTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi8uLi9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi8uLi8uLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vLi4vZGVzaWduLXN5c3RlbS9LZXlib2FyZFNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IHVzZVdpemFyZCB9IGZyb20gJy4uLy4uLy4uL3dpemFyZC9pbmRleC5qcydcbmltcG9ydCB7IFdpemFyZERpYWxvZ0xheW91dCB9IGZyb20gJy4uLy4uLy4uL3dpemFyZC9XaXphcmREaWFsb2dMYXlvdXQuanMnXG5pbXBvcnQgeyBDb2xvclBpY2tlciB9IGZyb20gJy4uLy4uL0NvbG9yUGlja2VyLmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudFdpemFyZERhdGEgfSBmcm9tICcuLi90eXBlcy5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIENvbG9yU3RlcCgpOiBSZWFjdE5vZGUge1xuICBjb25zdCB7IGdvTmV4dCwgZ29CYWNrLCB1cGRhdGVXaXphcmREYXRhLCB3aXphcmREYXRhIH0gPVxuICAgIHVzZVdpemFyZDxBZ2VudFdpemFyZERhdGE+KClcblxuICAvLyBIYW5kbGUgZXNjYXBlIGtleSAtIENvbG9yUGlja2VyIGhhbmRsZXMgaXRzIG93biBlc2NhcGUgaW50ZXJuYWxseVxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgZ29CYWNrLCB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0pXG5cbiAgY29uc3QgaGFuZGxlQ29uZmlybSA9IChjb2xvcj86IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIHVwZGF0ZVdpemFyZERhdGEoe1xuICAgICAgc2VsZWN0ZWRDb2xvcjogY29sb3IsXG4gICAgICAvLyBQcmVwYXJlIGZpbmFsIGFnZW50IGZvciBjb25maXJtYXRpb25cbiAgICAgIGZpbmFsQWdlbnQ6IHtcbiAgICAgICAgYWdlbnRUeXBlOiB3aXphcmREYXRhLmFnZW50VHlwZSEsXG4gICAgICAgIHdoZW5Ub1VzZTogd2l6YXJkRGF0YS53aGVuVG9Vc2UhLFxuICAgICAgICBnZXRTeXN0ZW1Qcm9tcHQ6ICgpID0+IHdpemFyZERhdGEuc3lzdGVtUHJvbXB0ISxcbiAgICAgICAgdG9vbHM6IHdpemFyZERhdGEuc2VsZWN0ZWRUb29scyxcbiAgICAgICAgLi4uKHdpemFyZERhdGEuc2VsZWN0ZWRNb2RlbFxuICAgICAgICAgID8geyBtb2RlbDogd2l6YXJkRGF0YS5zZWxlY3RlZE1vZGVsIH1cbiAgICAgICAgICA6IHt9KSxcbiAgICAgICAgLi4uKGNvbG9yID8geyBjb2xvcjogY29sb3IgYXMgQWdlbnRDb2xvck5hbWUgfSA6IHt9KSxcbiAgICAgICAgc291cmNlOiB3aXphcmREYXRhLmxvY2F0aW9uISxcbiAgICAgIH0sXG4gICAgfSlcbiAgICBnb05leHQoKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8V2l6YXJkRGlhbG9nTGF5b3V0XG4gICAgICBzdWJ0aXRsZT1cIkNob29zZSBiYWNrZ3JvdW5kIGNvbG9yXCJcbiAgICAgIGZvb3RlclRleHQ9e1xuICAgICAgICA8QnlsaW5lPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIuKGkeKGk1wiIGFjdGlvbj1cIm5hdmlnYXRlXCIgLz5cbiAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFbnRlclwiIGFjdGlvbj1cInNlbGVjdFwiIC8+XG4gICAgICAgICAgPENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludFxuICAgICAgICAgICAgYWN0aW9uPVwiY29uZmlybTpub1wiXG4gICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiZ28gYmFja1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9CeWxpbmU+XG4gICAgICB9XG4gICAgPlxuICAgICAgPEJveD5cbiAgICAgICAgPENvbG9yUGlja2VyXG4gICAgICAgICAgYWdlbnROYW1lPXt3aXphcmREYXRhLmFnZW50VHlwZSB8fCAnYWdlbnQnfVxuICAgICAgICAgIGN1cnJlbnRDb2xvcj1cImF1dG9tYXRpY1wiXG4gICAgICAgICAgb25Db25maXJtPXtoYW5kbGVDb25maXJtfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9XaXphcmREaWFsb2dMYXlvdXQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSSxLQUFLQyxTQUFTLFFBQVEsT0FBTztBQUM3QyxTQUFTQyxHQUFHLFFBQVEsb0JBQW9CO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSwwQ0FBMEM7QUFDeEUsY0FBY0MsY0FBYyxRQUFRLGtEQUFrRDtBQUN0RixTQUFTQyx3QkFBd0IsUUFBUSxzQ0FBc0M7QUFDL0UsU0FBU0MsTUFBTSxRQUFRLGtDQUFrQztBQUN6RCxTQUFTQyxvQkFBb0IsUUFBUSxnREFBZ0Q7QUFDckYsU0FBU0MsU0FBUyxRQUFRLDBCQUEwQjtBQUNwRCxTQUFTQyxrQkFBa0IsUUFBUSx1Q0FBdUM7QUFDMUUsU0FBU0MsV0FBVyxRQUFRLHNCQUFzQjtBQUNsRCxjQUFjQyxlQUFlLFFBQVEsYUFBYTtBQUVsRCxPQUFPLFNBQUFDLFVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFDTDtJQUFBQyxNQUFBO0lBQUFDLE1BQUE7SUFBQUMsZ0JBQUE7SUFBQUM7RUFBQSxJQUNFVixTQUFTLENBQWtCLENBQUM7RUFBQSxJQUFBVyxFQUFBO0VBQUEsSUFBQU4sQ0FBQSxRQUFBTyxNQUFBLENBQUFDLEdBQUE7SUFHTUYsRUFBQTtNQUFBRyxPQUFBLEVBQVc7SUFBZSxDQUFDO0lBQUFULENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQS9EVixhQUFhLENBQUMsWUFBWSxFQUFFYSxNQUFNLEVBQUVHLEVBQTJCLENBQUM7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQVYsQ0FBQSxRQUFBRSxNQUFBLElBQUFGLENBQUEsUUFBQUks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