// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Suspense、useState，将 react 中已经封装好的能力接到本文件流程里。
import { Suspense, useState } from 'react';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 引入 useIsInsideModal、useModalOrTerminalSize，将 ../../context/modalContext.js 中已经封装好的能力接到本文件流程里。
import { useIsInsideModal, useModalOrTerminalSize } from '../../context/modalContext.js';
// 引入 Pane，将 ../design-system/Pane.js 中已经封装好的能力接到本文件流程里。
import { Pane } from '../design-system/Pane.js';
// 引入 Tabs、Tab，将 ../design-system/Tabs.js 中已经封装好的能力接到本文件流程里。
import { Tabs, Tab } from '../design-system/Tabs.js';
// 引入 Status、buildDiagnostics，将 ./Status.js 中已经封装好的能力接到本文件流程里。
import { Status, buildDiagnostics } from './Status.js';
// 引入 Config，将 ./Config.js 中已经封装好的能力接到本文件流程里。
import { Config } from './Config.js';
// 引入 Usage，将 ./Usage.js 中已经封装好的能力接到本文件流程里。
import { Usage } from './Usage.js';
// 类型依赖 { LocalJSXCommandContext, CommandResultDisplay } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { LocalJSXCommandContext, CommandResultDisplay } from '../../commands.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onClose: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
  context: LocalJSXCommandContext;
  defaultTab: 'Status' | 'Config' | 'Usage' | 'Gates';
};
// Settings 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Settings(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(25);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onClose,
    context,
    defaultTab
  } = t0;
  // selectedTab 由 React state 持有，setSelectedTab 会在用户操作或异步结果返回时触发刷新。
  const [selectedTab, setSelectedTab] = useState(defaultTab);
  // tabsHidden 由 React state 持有，setTabsHidden 会在用户操作或异步结果返回时触发刷新。
  const [tabsHidden, setTabsHidden] = useState(false);
  // configOwnsEsc 配置 由 React state 持有，setConfigOwnsEsc 会在用户操作或异步结果返回时触发刷新。
  const [configOwnsEsc, setConfigOwnsEsc] = useState(false);
  // gatesOwnsEsc 由 React state 持有，setGatesOwnsEsc 会在用户操作或异步结果返回时触发刷新。
  const [gatesOwnsEsc, setGatesOwnsEsc] = useState(false);
  // insideModal保存`useIsInsideModal`，供终端渲染后续处理使用。
  const insideModal = useIsInsideModal();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rows
  } = useModalOrTerminalSize(useTerminalSize());
  // contentHeight保存`Math.max`，供终端渲染后续处理使用。
  const contentHeight = insideModal ? rows + 1 : Math.max(15, Math.min(Math.floor(rows * 0.8), 30));
  // diagnosticsPromise 异步任务 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [diagnosticsPromise] = useState(_temp2);
  // 调用 useExitOnCtrlCDWithKeybindings，触发终端渲染此处需要的副作用。
  useExitOnCtrlCDWithKeybindings();
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onClose || $[1] !== tabsHidden) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `tabsHidden` 时，终端渲染执行该分支。
      if (tabsHidden) {
        // 终端 UI 组件 Settings在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 onClose，触发终端渲染此处需要的副作用。
      onClose("Status dialog dismissed", {
        display: "system"
      });
    };
    // $[0] 缓存 `onClose`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onClose;
    // $[1] 缓存 `tabsHidden`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = tabsHidden;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // handleEscape沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleEscape = t1;
  // t2标记终端 UI Settings是否启用对应路径。
  const t2 = !tabsHidden && !(selectedTab === "Config" && configOwnsEsc) && !(selectedTab === "Gates" && gatesOwnsEsc);
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t2) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Settings",
      isActive: t2
    };
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", handleEscape, t3);
  // t4 暂存 `<Tab key="status" title="Status"><Status context={context...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== context || $[6] !== diagnosticsPromise) {
    // t4 暂存 `<Tab key="status" title="Status"><Status context={context...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Tab key="status" title="Status"><Status context={context} diagnosticsPromise={diagnosticsPromise} /></Tab>;
    // $[5] 缓存 `context`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = context;
    // $[6] 缓存 `diagnosticsPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = diagnosticsPromise;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Tab key="config" title="Config"><Suspense fallback={null...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== contentHeight || $[9] !== context || $[10] !== onClose) {
    // t5 暂存 `<Tab key="config" title="Config"><Suspense fallback={null...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Tab key="config" title="Config"><Suspense fallback={null}><Config context={context} onClose={onClose} setTabsHidden={setTabsHidden} onIsSearchModeChange={setConfigOwnsEsc} contentHeight={contentHeight} /></Suspense></Tab>;
    // $[8] 缓存 `contentHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = contentHeight;
    // $[9] 缓存 `context`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = context;
    // $[10] 缓存 `onClose`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onClose;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<Tab key="usage" title="Usage"><Usage /></Tab>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Tab key="usage" title="Usage"><Usage /></Tab>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Tab key="usage" title="Usage"><Usage /></Tab>;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `false ? [<Tab key="gates" title="Gates"><Gates onOwnsEscC...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== contentHeight) {
    // t7 暂存 `false ? [<Tab key="gates" title="Gates"><Gates onOwnsEscC...` 生成的渲染片段，后续返回路径直接复用。
    t7 = false ? [<Tab key="gates" title="Gates"><Gates onOwnsEscChange={setGatesOwnsEsc} contentHeight={contentHeight} /></Tab>] : [];
    // $[13] 缓存 `contentHeight`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = contentHeight;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // t8 暂存 `[t4, t5, t6, ...t7]` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== t4 || $[16] !== t5 || $[17] !== t7) {
    // t8 暂存 `[t4, t5, t6, ...t7]` 生成的渲染片段，后续返回路径直接复用。
    t8 = [t4, t5, t6, ...t7];
    // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t4;
    // $[16] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t5;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // tabs 集合沿用 `t8` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const tabs = t8;
  // t9标记终端 UI Settings是否启用对应路径。
  const t9 = defaultTab !== "Config" && defaultTab !== "Gates";
  // t10标记终端 UI Settings是否启用对应路径。
  const t10 = tabsHidden || insideModal ? undefined : contentHeight;
  // t11 暂存 `<Pane color="permission"><Tabs color="permission" selecte...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== selectedTab || $[20] !== t10 || $[21] !== t9 || $[22] !== tabs || $[23] !== tabsHidden) {
    // t11 暂存 `<Pane color="permission"><Tabs color="permission" selecte...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Pane color="permission"><Tabs color="permission" selectedTab={selectedTab} onTabChange={setSelectedTab} hidden={tabsHidden} initialHeaderFocused={t9} contentHeight={t10}>{tabs}</Tabs></Pane>;
    // $[19] 缓存 `selectedTab`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = selectedTab;
    // $[20] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t10;
    // $[21] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t9;
    // $[22] 缓存 `tabs`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = tabs;
    // $[23] 缓存 `tabsHidden`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = tabsHidden;
    // $[24] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[24];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2() {
  // 返回 `buildDiagnostics().catch(_temp)`，作为终端渲染这次计算的结果。
  return buildDiagnostics().catch(_temp);
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回列表结果，保留终端渲染已经排好的条目顺序。
  return [];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlN1c3BlbnNlIiwidXNlU3RhdGUiLCJ1c2VLZXliaW5kaW5nIiwidXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIiwidXNlVGVybWluYWxTaXplIiwidXNlSXNJbnNpZGVNb2RhbCIsInVzZU1vZGFsT3JUZXJtaW5hbFNpemUiLCJQYW5lIiwiVGFicyIsIlRhYiIsIlN0YXR1cyIsImJ1aWxkRGlhZ25vc3RpY3MiLCJDb25maWciLCJVc2FnZSIsIkxvY2FsSlNYQ29tbWFuZENvbnRleHQiLCJDb21tYW5kUmVzdWx0RGlzcGxheSIsIlByb3BzIiwib25DbG9zZSIsInJlc3VsdCIsIm9wdGlvbnMiLCJkaXNwbGF5IiwiY29udGV4dCIsImRlZmF1bHRUYWIiLCJTZXR0aW5ncyIsInQwIiwiJCIsIl9jIiwic2VsZWN0ZWRUYWIiLCJzZXRTZWxlY3RlZFRhYiIsInRhYnNIaWRkZW4iLCJzZXRUYWJzSGlkZGVuIiwiY29uZmlnT3duc0VzYyIsInNldENvbmZpZ093bnNFc2MiLCJnYXRlc093bnNFc2MiLCJzZXRHYXRlc093bnNFc2MiLCJpbnNpZGVNb2RhbCIsInJvd3MiLCJjb250ZW50SGVpZ2h0IiwiTWF0aCIsIm1heCIsIm1pbiIsImZsb29yIiwiZGlhZ25vc3RpY3NQcm9taXNlIiwiX3RlbXAyIiwidDEiLCJoYW5kbGVFc2NhcGUiLCJ0MiIsInQzIiwiaXNBY3RpdmUiLCJ0NCIsInQ1IiwidDYiLCJTeW1ib2wiLCJmb3IiLCJ0NyIsInQ4IiwidGFicyIsInQ5IiwidDEwIiwidW5kZWZpbmVkIiwidDExIiwiY2F0Y2giLCJfdGVtcCJdLCJzb3VyY2VzIjpbIlNldHRpbmdzLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBiaW9tZS1pZ25vcmUtYWxsIGFzc2lzdC9zb3VyY2Uvb3JnYW5pemVJbXBvcnRzOiBBTlQtT05MWSBpbXBvcnQgbWFya2VycyBtdXN0IG5vdCBiZSByZW9yZGVyZWRcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgU3VzcGVuc2UsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncy5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCB7XG4gIHVzZUlzSW5zaWRlTW9kYWwsXG4gIHVzZU1vZGFsT3JUZXJtaW5hbFNpemUsXG59IGZyb20gJy4uLy4uL2NvbnRleHQvbW9kYWxDb250ZXh0LmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vUGFuZS5qcydcbmltcG9ydCB7IFRhYnMsIFRhYiB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vVGFicy5qcydcbmltcG9ydCB7IFN0YXR1cywgYnVpbGREaWFnbm9zdGljcyB9IGZyb20gJy4vU3RhdHVzLmpzJ1xuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSAnLi9Db25maWcuanMnXG5pbXBvcnQgeyBVc2FnZSB9IGZyb20gJy4vVXNhZ2UuanMnXG5pbXBvcnQgdHlwZSB7XG4gIExvY2FsSlNYQ29tbWFuZENvbnRleHQsXG4gIENvbW1hbmRSZXN1bHREaXNwbGF5LFxufSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25DbG9zZTogKFxuICAgIHJlc3VsdD86IHN0cmluZyxcbiAgICBvcHRpb25zPzogeyBkaXNwbGF5PzogQ29tbWFuZFJlc3VsdERpc3BsYXkgfSxcbiAgKSA9PiB2b2lkXG4gIGNvbnRleHQ6IExvY2FsSlNYQ29tbWFuZENvbnRleHRcbiAgZGVmYXVsdFRhYjogJ1N0YXR1cycgfCAnQ29uZmlnJyB8ICdVc2FnZScgfCAnR2F0ZXMnXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTZXR0aW5ncyh7XG4gIG9uQ2xvc2UsXG4gIGNvbnRleHQsXG4gIGRlZmF1bHRUYWIsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtzZWxlY3RlZFRhYiwgc2V0U2VsZWN0ZWRUYWJdID0gdXNlU3RhdGU8c3RyaW5nPihkZWZhdWx0VGFiKVxuICBjb25zdCBbdGFic0hpZGRlbiwgc2V0VGFic0hpZGRlbl0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgLy8gVHJ1ZSB3aGlsZSBDb25maWcncyBvd24gRXNjIGhhbmRsZXIgaXMgYWN0aXZlIChzZWFyY2ggbW9kZSB3aXRoIGNvbnRlbnRcbiAgLy8gZm9jdXNlZCkuIFNldHRpbmdzIG11c3QgY2VkZSBFc2Mgc28gc2VhcmNoIGNhbiBjbGVhci9leGl0IGZpcnN0LlxuICBjb25zdCBbY29uZmlnT3duc0VzYywgc2V0Q29uZmlnT3duc0VzY10gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgW2dhdGVzT3duc0VzYywgc2V0R2F0ZXNPd25zRXNjXSA9IHVzZVN0YXRlKGZhbHNlKVxuICAvLyBGaXhlZCBjb250ZW50IGhlaWdodCBzbyBzd2l0Y2hpbmcgdGFicyBkb2Vzbid0IHNoaWZ0IHRoZSBwYW5lIGhlaWdodC5cbiAgLy8gT3V0c2lkZSBtb2RhbHMgY2FwIGF0IG1pbig4MCUgdmlld3BvcnQsIDMwKS4gSW5zaWRlIGEgTW9kYWwgdGhlIG1vZGFsJ3NcbiAgLy8gaW5uZXJTaXplLnJvd3MgSVMgdGhlIFNjcm9sbEJveCB2aWV3cG9ydCDigJQgdGhlIDAuOCBtdWx0aXBsaWVyIG92ZXItXG4gIC8vIHNocmlua3MsIGxlYXZpbmcgZW1wdHkgcm93cyB3aGlsZSBDb25maWcgc2hvd3MgXCLihpMgTiBtb3JlIGJlbG93XCIuXG4gIC8vXG4gIC8vIEluc2lkZS1tb2RhbCBtYXRoOiBDb25maWcncyBwYW5lQ2FwLTEwIGNocm9tZSBlc3RpbWF0ZSB3YXMgdHVuZWQgZm9yXG4gIC8vIG1hcmdpblk9ezF9ICgyIHJvd3MpIHdoaWNoIGlzIHN0cmlwcGVkIGluc2lkZSBtb2RhbHMg4oaSICsyIHRvIHJlY292ZXIuXG4gIC8vIFRoZW4gLTIgZm9yIFRhYnMnIGhlYWRlciByb3cgKyBpdHMgbWFyZ2luVG9wPTEuIFBsdXMgKzEgb2JzZXJ2ZWQgZ2FwXG4gIC8vIGZyb20gdGhlIHBhbmVDYXAtMTAgZXN0aW1hdGUgYmVpbmcgc2xpZ2h0bHkgZ2VuZXJvdXMuIE5ldDogcm93cyArIDEuXG4gIGNvbnN0IGluc2lkZU1vZGFsID0gdXNlSXNJbnNpZGVNb2RhbCgpXG4gIGNvbnN0IHsgcm93cyB9ID0gdXNlTW9kYWxPclRlcm1pbmFsU2l6ZSh1c2VUZXJtaW5hbFNpemUoKSlcbiAgY29uc3QgY29udGVudEhlaWdodCA9IGluc2lkZU1vZGFsXG4gICAgPyByb3dzICsgMVxuICAgIDogTWF0aC5tYXgoMTUsIE1hdGgubWluKE1hdGguZmxvb3Iocm93cyAqIDAuOCksIDMwKSlcbiAgLy8gS2ljayBvZmYgZGlhZ25vc3RpY3Mgb25jZSB3aGVuIHRoZSBwYW5lIG9wZW5zLiBTdGF0dXMgdXNlKClzIHRoaXMgc29cbiAgLy8gaXQgcmVzb2x2ZXMgb25jZSBwZXIgL2NvbmZpZyBpbnZvY2F0aW9uIOKAlCBubyByZS1mZXRjaCBmbGFzaCB3aGVuXG4gIC8vIHRhYmJpbmcgYmFjayB0byBTdGF0dXMgKFRhYiB1bm1vdW50cyBjaGlsZHJlbiB3aGVuIG5vdCBzZWxlY3RlZCkuXG4gIGNvbnN0IFtkaWFnbm9zdGljc1Byb21pc2VdID0gdXNlU3RhdGUoKCkgPT5cbiAgICBidWlsZERpYWdub3N0aWNzKCkuY2F0Y2goKCkgPT4gW10pLFxuICApXG5cbiAgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzKClcblxuICAvLyBIYW5kbGUgZXNjYXBlIHZpYSBrZXliaW5kaW5nIC0gb25seSB3aGVuIG5vdCBpbiBzdWJtZW51XG4gIGNvbnN0IGhhbmRsZUVzY2FwZSA9ICgpID0+IHtcbiAgICAvLyBEb24ndCBoYW5kbGUgZXNjYXBlIHdoZW4gYSBzdWJtZW51IGlzIHNob3dpbmcgKHRhYnNIaWRkZW4gbWVhbnMgc3VibWVudSBpcyBvcGVuKVxuICAgIC8vIExldCB0aGUgc3VibWVudSBoYW5kbGUgZXNjYXBlIHRvIHJldHVybiB0byB0aGUgbWFpbiBtZW51XG4gICAgaWYgKHRhYnNIaWRkZW4pIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBUT0RPOiBVcGRhdGUgdG8gXCJTZXR0aW5nc1wiIGRpYWxvZyBvbmNlIHdlIGRlZmluZSAnL3NldHRpbmdzJy5cbiAgICBvbkNsb3NlKCdTdGF0dXMgZGlhbG9nIGRpc21pc3NlZCcsIHsgZGlzcGxheTogJ3N5c3RlbScgfSlcbiAgfVxuXG4gIC8vIERpc2FibGUgd2hlbiBzdWJtZW51IGlzIG9wZW4gc28gdGhlIHN1Ym1lbnUncyBEaWFsb2cgY2FuIGhhbmRsZSBFU0MsXG4gIC8vIGFuZCB3aGVuIENvbmZpZydzIHNlYXJjaCBtb2RlIGlzIGFjdGl2ZSBzbyBpdHMgdXNlSW5wdXQgaGFuZGxlclxuICAvLyAoY2xlYXIgcXVlcnkg4oaSIGV4aXQgc2VhcmNoKSBwcm9jZXNzZXMgRXNjYXBlIGZpcnN0LlxuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgaGFuZGxlRXNjYXBlLCB7XG4gICAgY29udGV4dDogJ1NldHRpbmdzJyxcbiAgICBpc0FjdGl2ZTpcbiAgICAgICF0YWJzSGlkZGVuICYmXG4gICAgICAhKHNlbGVjdGVkVGFiID09PSAnQ29uZmlnJyAmJiBjb25maWdPd25zRXNjKSAmJlxuICAgICAgIShzZWxlY3RlZFRhYiA9PT0gJ0dhdGVzJyAmJiBnYXRlc093bnNFc2MpLFxuICB9KVxuXG4gIGNvbnN0IHRhYnMgPSBbXG4gICAgPFRhYiBrZXk9XCJzdGF0dXNcIiB0aXRsZT1cIlN0YXR1c1wiPlxuICAgICAgPFN0YXR1cyBjb250ZXh0PXtjb250ZXh0fSBkaWFnbm9zdGljc1Byb21pc2U9e2RpYWdub3N0aWNzUHJvbWlzZX0gLz5cbiAgICA8L1RhYj4sXG4gICAgPFRhYiBrZXk9XCJjb25maWdcIiB0aXRsZT1cIkNvbmZpZ1wiPlxuICAgICAgPFN1c3BlbnNlIGZhbGxiYWNrPXtudWxsfT5cbiAgICAgICAgPENvbmZpZ1xuICAgICAgICAgIGNvbnRleHQ9e2NvbnRleHR9XG4gICAgICAgICAgb25DbG9zZT17b25DbG9zZX1cbiAgICAgICAgICBzZXRUYWJzSGlkZGVuPXtzZXRUYWJzSGlkZGVufVxuICAgICAgICAgIG9uSXNTZWFyY2hNb2RlQ2hhbmdlPXtzZXRDb25maWdPd25zRXNjfVxuICAgICAgICAgIGNvbnRlbnRIZWlnaHQ9e2NvbnRlbnRIZWlnaHR9XG4gICAgICAgIC8+XG4gICAgICA8L1N1c3BlbnNlPlxuICAgIDwvVGFiPixcbiAgICA8VGFiIGtleT1cInVzYWdlXCIgdGl0bGU9XCJVc2FnZVwiPlxuICAgICAgPFVzYWdlIC8+XG4gICAgPC9UYWI+LFxuICAgIC4uLihcImV4dGVybmFsXCIgPT09ICdhbnQnXG4gICAgICA/IFtcbiAgICAgICAgICA8VGFiIGtleT1cImdhdGVzXCIgdGl0bGU9XCJHYXRlc1wiPlxuICAgICAgICAgICAgPEdhdGVzXG4gICAgICAgICAgICAgIG9uT3duc0VzY0NoYW5nZT17c2V0R2F0ZXNPd25zRXNjfVxuICAgICAgICAgICAgICBjb250ZW50SGVpZ2h0PXtjb250ZW50SGVpZ2h0fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L1RhYj4sXG4gICAgICAgIF1cbiAgICAgIDogW10pLFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8UGFuZSBjb2xvcj1cInBlcm1pc3Npb25cIj5cbiAgICAgIDxUYWJzXG4gICAgICAgIGNvbG9yPVwicGVybWlzc2lvblwiXG4gICAgICAgIHNlbGVjdGVkVGFiPXtzZWxlY3RlZFRhYn1cbiAgICAgICAgb25UYWJDaGFuZ2U9e3NldFNlbGVjdGVkVGFifVxuICAgICAgICBoaWRkZW49e3RhYnNIaWRkZW59XG4gICAgICAgIC8vIENvbmZpZyBoYXMgaW50ZXJhY3RpdmUgY29udGVudCDigJQgc3RhcnQgd2l0aCBoZWFkZXIgdW5mb2N1c2VkIHNvXG4gICAgICAgIC8vIGxlZnQvcmlnaHQvdGFiIGN5Y2xlIG9wdGlvbiB2YWx1ZXMgaW5zdGVhZCBvZiBzd2l0Y2hpbmcgdGFicy5cbiAgICAgICAgaW5pdGlhbEhlYWRlckZvY3VzZWQ9e2RlZmF1bHRUYWIgIT09ICdDb25maWcnICYmIGRlZmF1bHRUYWIgIT09ICdHYXRlcyd9XG4gICAgICAgIC8vIEluc2lkZSBhIE1vZGFsLCBza2lwIHRoZSBUYWJzLWxldmVsIGNhcCBzbyB0YWxsIHRhYnMgKFN0YXR1cydzXG4gICAgICAgIC8vIE1DUCBsaXN0KSBmbG93IHRvIHRoZWlyIG5hdHVyYWwgaGVpZ2h0IGZvciB0aGUgTW9kYWwncyBTY3JvbGxCb3hcbiAgICAgICAgLy8gdG8gc2Nyb2xsLiBDb25maWcvR2F0ZXMgc3RpbGwgZ2V0IGNvbnRlbnRIZWlnaHQgYWJvdmUg4oCUIHRoZXlcbiAgICAgICAgLy8gcGFnaW5hdGUgaW50ZXJuYWxseSBzbyB0aGlzIG9ubHkgYWZmZWN0cyBTdGF0dXMvVXNhZ2UuXG4gICAgICAgIGNvbnRlbnRIZWlnaHQ9e3RhYnNIaWRkZW4gfHwgaW5zaWRlTW9kYWwgPyB1bmRlZmluZWQgOiBjb250ZW50SGVpZ2h0fVxuICAgICAgPlxuICAgICAgICB7dGFic31cbiAgICAgIDwvVGFicz5cbiAgICA8L1BhbmU+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0EsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxRQUFRLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQzFDLFNBQVNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDbEUsU0FBU0MsOEJBQThCLFFBQVEsK0NBQStDO0FBQzlGLFNBQVNDLGVBQWUsUUFBUSxnQ0FBZ0M7QUFDaEUsU0FDRUMsZ0JBQWdCLEVBQ2hCQyxzQkFBc0IsUUFDakIsK0JBQStCO0FBQ3RDLFNBQVNDLElBQUksUUFBUSwwQkFBMEI7QUFDL0MsU0FBU0MsSUFB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