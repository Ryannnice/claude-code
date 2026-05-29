// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 useWizard，将 ./useWizard.js 中已经封装好的能力接到本文件流程里。
import { useWizard } from './useWizard.js';
// 引入 WizardNavigationFooter，将 ./WizardNavigationFooter.js 中已经封装好的能力接到本文件流程里。
import { WizardNavigationFooter } from './WizardNavigationFooter.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  title?: string;
  color?: keyof Theme;
  children: ReactNode;
  subtitle?: string;
  footerText?: ReactNode;
};
// WizardDialogLayout 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WizardDialogLayout(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(11);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    title: titleOverride,
    color: t1,
    children,
    subtitle,
    footerText
  } = t0;
  // color标记终端 UI Wizard Dialog Layout是否启用对应路径。
  const color = t1 === undefined ? "suggestion" : t1;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentStepIndex,
    totalSteps,
    title: providerTitle,
    showStepCounter,
    goBack
  } = useWizard();
  // title 标题标记终端 UI Wizard Dialog Layout是否启用对应路径。
  const title = titleOverride || providerTitle || "Wizard";
  // stepSuffix标记终端 UI Wizard Dialog Layout是否启用对应路径。
  const stepSuffix = showStepCounter !== false ? ` (${currentStepIndex + 1}/${totalSteps})` : "";
  // 临时值 t2 命名 ``${title}${stepSuffix}``，让后续代码直接表达这个值的用途。
  const t2 = `${title}${stepSuffix}`;
  // t3 暂存 `<Dialog title={t2} subtitle={subtitle} onCancel={goBack} ...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children || $[1] !== color || $[2] !== goBack || $[3] !== subtitle || $[4] !== t2) {
    // t3 暂存 `<Dialog title={t2} subtitle={subtitle} onCancel={goBack} ...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Dialog title={t2} subtitle={subtitle} onCancel={goBack} color={color} hideInputGuide={true} isCancelActive={false}>{children}</Dialog>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = color;
    // $[2] 缓存 `goBack`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = goBack;
    // $[3] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = subtitle;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<WizardNavigationFooter instructions={footerText} />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== footerText) {
    // t4 暂存 `<WizardNavigationFooter instructions={footerText} />` 生成的渲染片段，后续返回路径直接复用。
    t4 = <WizardNavigationFooter instructions={footerText} />;
    // $[6] 缓存 `footerText`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = footerText;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<>{t3}{t4}</>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t3 || $[9] !== t4) {
    // t5 暂存 `<>{t3}{t4}</>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <>{t3}{t4}</>;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIlRoZW1lIiwiRGlhbG9nIiwidXNlV2l6YXJkIiwiV2l6YXJkTmF2aWdhdGlvbkZvb3RlciIsIlByb3BzIiwidGl0bGUiLCJjb2xvciIsImNoaWxkcmVuIiwic3VidGl0bGUiLCJmb290ZXJUZXh0IiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwidDAiLCIkIiwiX2MiLCJ0aXRsZU92ZXJyaWRlIiwidDEiLCJ1bmRlZmluZWQiLCJjdXJyZW50U3RlcEluZGV4IiwidG90YWxTdGVwcyIsInByb3ZpZGVyVGl0bGUiLCJzaG93U3RlcENvdW50ZXIiLCJnb0JhY2siLCJzdGVwU3VmZml4IiwidDIiLCJ0MyIsInQ0IiwidDUiXSwic291cmNlcyI6WyJXaXphcmREaWFsb2dMYXlvdXQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB0eXBlIFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBUaGVtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyB1c2VXaXphcmQgfSBmcm9tICcuL3VzZVdpemFyZC5qcydcbmltcG9ydCB7IFdpemFyZE5hdmlnYXRpb25Gb290ZXIgfSBmcm9tICcuL1dpemFyZE5hdmlnYXRpb25Gb290ZXIuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHRpdGxlPzogc3RyaW5nXG4gIGNvbG9yPzoga2V5b2YgVGhlbWVcbiAgY2hpbGRyZW46IFJlYWN0Tm9kZVxuICBzdWJ0aXRsZT86IHN0cmluZ1xuICBmb290ZXJUZXh0PzogUmVhY3ROb2RlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBXaXphcmREaWFsb2dMYXlvdXQoe1xuICB0aXRsZTogdGl0bGVPdmVycmlkZSxcbiAgY29sb3IgPSAnc3VnZ2VzdGlvbicsXG4gIGNoaWxkcmVuLFxuICBzdWJ0aXRsZSxcbiAgZm9vdGVyVGV4dCxcbn06IFByb3BzKTogUmVhY3ROb2RlIHtcbiAgY29uc3Qge1xuICAgIGN1cnJlbnRTdGVwSW5kZXgsXG4gICAgdG90YWxTdGVwcyxcbiAgICB0aXRsZTogcHJvdmlkZXJUaXRsZSxcbiAgICBzaG93U3RlcENvdW50ZXIsXG4gICAgZ29CYWNrLFxuICB9ID0gdXNlV2l6YXJkKClcbiAgY29uc3QgdGl0bGUgPSB0aXRsZU92ZXJyaWRlIHx8IHByb3ZpZGVyVGl0bGUgfHwgJ1dpemFyZCdcbiAgY29uc3Qgc3RlcFN1ZmZpeCA9XG4gICAgc2hvd1N0ZXBDb3VudGVyICE9PSBmYWxzZSA/IGAgKCR7Y3VycmVudFN0ZXBJbmRleCArIDF9LyR7dG90YWxTdGVwc30pYCA6ICcnXG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPERpYWxvZ1xuICAgICAgICB0aXRsZT17YCR7dGl0bGV9JHtzdGVwU3VmZml4fWB9XG4gICAgICAgIHN1YnRpdGxlPXtzdWJ0aXRsZX1cbiAgICAgICAgb25DYW5jZWw9e2dvQmFja31cbiAgICAgICAgY29sb3I9e2NvbG9yfVxuICAgICAgICBoaWRlSW5wdXRHdWlkZVxuICAgICAgICBpc0NhbmNlbEFjdGl2ZT17ZmFsc2V9XG4gICAgICA+XG4gICAgICAgIHtjaGlsZHJlbn1cbiAgICAgIDwvRGlhbG9nPlxuICAgICAgPFdpemFyZE5hdmlnYXRpb25Gb290ZXIgaW5zdHJ1Y3Rpb25zPXtmb290ZXJUZXh0fSAvPlxuICAgIDwvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxRQUFRLE9BQU87QUFDN0MsY0FBY0MsS0FBSyxRQUFRLHNCQUFzQjtBQUNqRCxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBQ25ELFNBQVNDLFNBQVMsUUFBUSxnQkFBZ0I7QUFDMUMsU0FBU0Msc0JBQXNCLFFBQVEsNkJBQTZCO0FBRXBFLEtBQUtDLEtBQUssR0FBRztFQUNYQyxLQUFLLENBQUMsRUFBRSxNQUFNO0VBQ2RD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