// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 类型依赖 { Tools } 来自 ../../../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../../../Tool.js';
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
// 引入 ToolSelector，将 ../../ToolSelector.js 中已经封装好的能力接到本文件流程里。
import { ToolSelector } from '../../ToolSelector.js';
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  tools: Tools;
};
// ToolsStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ToolsStep(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tools
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  // t1 暂存 `selectedTools => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== goNext || $[1] !== updateWizardData) {
    // t1 暂存 `selectedTools => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = selectedTools => {
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        selectedTools
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[0] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = goNext;
    // $[1] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = updateWizardData;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // handleComplete沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleComplete = t1;
  // initialTools 集合保存`wizardData.selectedTools`，供后续判断或组装使用。
  const initialTools = wizardData.selectedTools;
  // t2 暂存 `<Byline><KeyboardShortcutHint shortcut="Enter" action="to...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Byline><KeyboardShortcutHint shortcut="Enter" action="to...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Byline><KeyboardShortcutHint shortcut="Enter" action="toggle selection" /><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="go back" /></Byline>;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `<WizardDialogLayout subtitle="Select tools" footerText={t...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== goBack || $[5] !== handleComplete || $[6] !== initialTools || $[7] !== tools) {
    // t3 暂存 `<WizardDialogLayout subtitle="Select tools" footerText={t...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <WizardDialogLayout subtitle="Select tools" footerText={t2}><ToolSelector tools={tools} initialTools={initialTools} onComplete={handleComplete} onCancel={goBack} /></WizardDialogLayout>;
    // $[4] 缓存 `goBack`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = goBack;
    // $[5] 缓存 `handleComplete`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = handleComplete;
    // $[6] 缓存 `initialTools`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = initialTools;
    // $[7] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = tools;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIlRvb2xzIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiQnlsaW5lIiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJ1c2VXaXphcmQiLCJXaXphcmREaWFsb2dMYXlvdXQiLCJUb29sU2VsZWN0b3IiLCJBZ2VudFdpemFyZERhdGEiLCJQcm9wcyIsInRvb2xzIiwiVG9vbHNTdGVwIiwidDAiLCIkIiwiX2MiLCJnb05leHQiLCJnb0JhY2siLCJ1cGRhdGVXaXphcmREYXRhIiwid2l6YXJkRGF0YSIsInQxIiwic2VsZWN0ZWRUb29scyIsImhhbmRsZUNvbXBsZXRlIiwiaW5pdGlhbFRvb2xzIiwidDIiLCJTeW1ib2wiLCJmb3IiLCJ0MyJdLCJzb3VyY2VzIjpbIlRvb2xzU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHR5cGUgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IFRvb2xzIH0gZnJvbSAnLi4vLi4vLi4vLi4vVG9vbC5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uLy4uL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi8uLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgdXNlV2l6YXJkIH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL2luZGV4LmpzJ1xuaW1wb3J0IHsgV2l6YXJkRGlhbG9nTGF5b3V0IH0gZnJvbSAnLi4vLi4vLi4vd2l6YXJkL1dpemFyZERpYWxvZ0xheW91dC5qcydcbmltcG9ydCB7IFRvb2xTZWxlY3RvciB9IGZyb20gJy4uLy4uL1Rvb2xTZWxlY3Rvci5qcydcbmltcG9ydCB0eXBlIHsgQWdlbnRXaXphcmREYXRhIH0gZnJvbSAnLi4vdHlwZXMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHRvb2xzOiBUb29sc1xufVxuXG5leHBvcnQgZnVuY3Rpb24gVG9vbHNTdGVwKHsgdG9vbHMgfTogUHJvcHMpOiBSZWFjdE5vZGUge1xuICBjb25zdCB7IGdvTmV4dCwgZ29CYWNrLCB1cGRhdGVXaXphcmREYXRhLCB3aXphcmREYXRhIH0gPVxuICAgIHVzZVdpemFyZDxBZ2VudFdpemFyZERhdGE+KClcblxuICBjb25zdCBoYW5kbGVDb21wbGV0ZSA9IChzZWxlY3RlZFRvb2xzOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xuICAgIHVwZGF0ZVdpemFyZERhdGEoeyBzZWxlY3RlZFRvb2xzIH0pXG4gICAgZ29OZXh0KClcbiAgfVxuXG4gIC8vIFBhc3MgdGhyb3VnaCB1bmRlZmluZWQgdG8gcHJlc2VydmUgXCJhbGwgdG9vbHNcIiBzZW1hbnRpY1xuICAvLyBUb29sU2VsZWN0b3Igd2lsbCBleHBhbmQgaXQgaW50ZXJuYWxseSBmb3IgZGlzcGxheSBwdXJwb3Nlc1xuICBjb25zdCBpbml0aWFsVG9vbHMgPSB3aXphcmREYXRhLnNlbGVjdGVkVG9vbHNcblxuICByZXR1cm4gKFxuICAgIDxXaXphcmREaWFsb2dMYXlvdXRcbiAgICAgIHN1YnRpdGxlPVwiU2VsZWN0IHRvb2xzXCJcbiAgICAgIGZvb3RlclRleHQ9e1xuICAgICAgICA8QnlsaW5lPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwidG9nZ2xlIHNlbGVjdGlvblwiIC8+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwi4oaR4oaTXCIgYWN0aW9uPVwibmF2aWdhdGVcIiAvPlxuICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgY29udGV4dD1cIkNvbmZpcm1hdGlvblwiXG4gICAgICAgICAgICBmYWxsYmFjaz1cIkVzY1wiXG4gICAgICAgICAgICBkZXNjcmlwdGlvbj1cImdvIGJhY2tcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQnlsaW5lPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxUb29sU2VsZWN0b3JcbiAgICAgICAgdG9vbHM9e3Rvb2xzfVxuICAgICAgICBpbml0aWFsVG9vbHM9e2luaXRpYWxUb29sc31cbiAgICAgICAgb25Db21wbGV0ZT17aGFuZGxlQ29tcGxldGV9XG4gICAgICAgIG9uQ2FuY2VsPXtnb0JhY2t9XG4gICAgICAvPlxuICAgIDwvV2l6YXJkRGlhbG9nTGF5b3V0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxRQUFRLE9BQU87QUFDN0MsY0FBY0MsS0FBSyxRQUFRLHFCQUFxQjtBQUNoRCxTQUFTQyx3QkFBd0IsUUFBUSxzQ0FBc0M7QUFDL0UsU0FBU0MsTUFBTSxRQUFRLGtDQUFrQztBQUN6RCxTQUFTQyxvQkFBb0IsUUFBUSxnREFBZ0Q7QUFDckYsU0FBU0MsU0FBUyxRQUFRLDBCQUEwQjtBQUNwRCxTQUFTQyxrQkFBa0IsUUFBUSx1Q0FBdUM7QUFDMUUsU0FBU0MsWUFBWSxRQUFRLHVCQUF1QjtBQUNwRCxjQUFjQyxlQUFlLFFBQVEsYUFBYTtBQUVsRCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsS0FBSyxFQUFFVCxLQUFLO0FBQ2QsQ0FBQztBQUVELE9BQU8sU0FBQVUsVUFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFtQjtJQUFBSjtFQUFBLElBQUFFLEVBQWdCO0VBQ3hDO0lBQUFHLE1BQUE7SUFBQUMsTUFBQTtJQUFBQyxnQkFBQTtJQUFBQztFQUFBLElBQ0ViLFNBQVMsQ0FBa0IsQ0FBQztFQUFBLElBQUFjLEVBQUE7RUFBQSxJQUFBTixDQUFBLFFBQUFFLE1BQUEsSUFBQUYsQ0FBQSxRQUFBSSxnQkFBQTtJQUVQRSxFQUFBLEdBQUFDLGFBQUE7TUFDckJILGdCQUFnQixDQUFDO1FBQUFHO01BQWdCLENBQUMsQ0FBQztNQUNuQ0wsTUFBTSxDQUFDLENBQUM7SUFBQSxDQUNUO0lBQUFGLENBQUEsTUFBQUUsTUFBQTtJQUFBRixDQUFBLE1BQUFJLGdCQUFBO0lBQUFKLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBSEQsTUFBQVEsY0FBQSxHQUF1QkYsRUFHdEI7RUFJRCxNQUFBRyxZQUFBLEdBQXFCSixVQUFVLENBQUFFLGFBQWM7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQVYsQ0FBQSxRQUFBVyxNQUFBLENBQUFDLEdBQUE7SUFNdkNGLEVBQUEsSUFBQyxNQUFNLENBQ0wsQ0FBQyxvQkFBb0IsQ0FBVSxRQUFPLENBQVAsT0FBTyxDQUFRLE1BQWtCLENBQWxCLGtCQUFrQixHQUNoRSxDQUFDLG9CQUFvQixDQUFVLFFBQUksQ0FBSixlQUFHLENBQUMsQ0FBUSxNQUFVLENBQVYsVUFBVSxHQUNyRCxDQUFDLHdCQUF3QixDQUNoQixNQUFZLENBQVosWUFBWSxDQUNYLE9BQWMsQ0FBZCxjQUFjLENBQ2IsUUFBSyxDQUFMLEtBQUssQ0FDRixXQUFTLENBQVQsU0FBUyxHQUV6QixFQVRDLE1BQU0sQ0FTRTtJQUFBVixDQUFBLE1BQUFVLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFWLENBQUE7RUFBQTtFQUFBLElBQUFhLEVBQUE7RUFBQSxJQUFBYixDQUFBLFFBQUFHLE1BQUEsSUFBQUgsQ0FBQSxRQUFBUSxjQUFBLElBQUFSLENBQUEsUUFBQVMsWUFBQSxJQUFBVCxDQUFBLFFBQUFILEtBQUE7SUFaYmdCLEVBQUEsSUFBQyxrQkFBa0IsQ0FDUixRQUFjLENBQWQsY0FBYyxDQUVyQixVQVNTLENBVFQsQ0FBQUgsRUFTUSxDQUFDLENBR1gsQ0FBQyxZQUFZLENBQ0piLEtBQUssQ0FBTEEsTUFBSSxDQUFDLENBQ0VZLFlBQVksQ0FBWkEsYUFBVyxDQUFDLENBQ2RELFVBQWMsQ0FBZEEsZUFBYSxDQUFDLENBQ2hCTCxRQUFNLENBQU5BLE9BQUssQ0FBQyxHQUVwQixFQXJCQyxrQkFBa0IsQ0FxQkU7SUFBQUgsQ0FBQSxNQUFBRyxNQUFBO0lBQUFILENBQUEsTUFBQVEsY0FBQTtJQUFBUixDQUFBLE1BQUFTLFlBQUE7SUFBQVQsQ0FBQSxNQUFBSCxLQUFBO0lBQUFHLENBQUEsTUFBQWEsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWIsQ0FBQTtFQUFBO0VBQUEsT0FyQnJCYSxFQXFCcUI7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==