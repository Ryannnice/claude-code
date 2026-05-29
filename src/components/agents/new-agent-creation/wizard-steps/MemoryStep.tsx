// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode } from 'react';
// 引入 Box，将 ../../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box } from '../../../../ink.js';
// 引入 useKeybinding，将 ../../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
// 引入 isAutoMemoryEnabled，将 ../../../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { isAutoMemoryEnabled } from '../../../../memdir/paths.js';
// 接入 AgentMemoryScope、loadAgentMemoryPrompt 工具实现，后续工具池会按权限和开关决定是否暴露。
import { type AgentMemoryScope, loadAgentMemoryPrompt } from '../../../../tools/AgentTool/agentMemory.js';
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
// MemoryOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type MemoryOption = {
  label: string;
  value: AgentMemoryScope | 'none';
};
// MemoryStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MemoryStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(13);
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
  // isUserScope标记终端 UI Memory Step是否启用对应路径。
  const isUserScope = wizardData.location === "userSettings";
  // t1 暂存 `isUserScope ? [{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== isUserScope) {
    // t1 暂存 `isUserScope ? [{` 生成的渲染片段，后续返回路径直接复用。
    t1 = isUserScope ? [{
      label: "User scope (~/.claude/agent-memory/) (Recommended)",
      value: "user"
    }, {
      label: "None (no persistent memory)",
      value: "none"
    }, {
      label: "Project scope (.claude/agent-memory/)",
      value: "project"
    }, {
      label: "Local scope (.claude/agent-memory-local/)",
      value: "local"
    }] : [{
      label: "Project scope (.claude/agent-memory/) (Recommended)",
      value: "project"
    }, {
      label: "None (no persistent memory)",
      value: "none"
    }, {
      label: "User scope (~/.claude/agent-memory/)",
      value: "user"
    }, {
      label: "Local scope (.claude/agent-memory-local/)",
      value: "local"
    }];
    // $[1] 缓存 `isUserScope`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isUserScope;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // memoryOptions 集合 命名 `t1`，让后续代码直接表达这个值的用途。
  const memoryOptions = t1;
  // t2 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== goNext || $[4] !== updateWizardData || $[5] !== wizardData.finalAgent || $[6] !== wizardData.systemPrompt) {
    // t2 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = value => {
      // memory标记终端 UI Memory Step是否启用对应路径。
      const memory = value === "none" ? undefined : value as AgentMemoryScope;
      // agentType保存`wizardData.finalAgent?.agentType`，供后续判断或组装使用。
      const agentType = wizardData.finalAgent?.agentType;
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        selectedMemory: memory,
        finalAgent: wizardData.finalAgent ? {
          ...wizardData.finalAgent,
          memory,
          // 这个回调绑定到 getSystemPrompt: isAutoMemoryEnabled() && memory && agentType ? () => wizardData.sys…，负责终端渲染在该局部场景下的响应。
          getSystemPrompt: isAutoMemoryEnabled() && memory && agentType ? () => wizardData.systemPrompt + "\n\n" + loadAgentMemoryPrompt(agentType, memory) : () => wizardData.systemPrompt
        } : undefined
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[3] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = goNext;
    // $[4] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = updateWizardData;
    // $[5] 缓存 `wizardData.finalAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = wizardData.finalAgent;
    // $[6] 缓存 `wizardData.systemPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = wizardData.systemPrompt;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // handleSelect 命名 `t2`，让后续代码直接表达这个值的用途。
  const handleSelect = t2;
  // t3 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} a...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Byline><KeyboardShortcutHint shortcut={"\u2191\u2193"} action="navigate" /><KeyboardShortcutHint shortcut="Enter" action="select" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="go back" /></Byline>;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // t4 暂存 `<WizardDialogLayout subtitle="Configure agent memory" foo...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== goBack || $[10] !== handleSelect || $[11] !== memoryOptions) {
    // t4 暂存 `<WizardDialogLayout subtitle="Configure agent memory" foo...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <WizardDialogLayout subtitle="Configure agent memory" footerText={t3}><Box><Select key="memory-select" options={memoryOptions} onChange={handleSelect} onCancel={goBack} /></Box></WizardDialogLayout>;
    // $[9] 缓存 `goBack`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = goBack;
    // $[10] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleSelect;
    // $[11] 缓存 `memoryOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = memoryOptions;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // 返回 `t4`，作为终端渲染这次计算的结果。
  return t4;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsIkJveCIsInVzZUtleWJpbmRpbmciLCJpc0F1dG9NZW1vcnlFbmFibGVkIiwiQWdlbnRNZW1vcnlTY29wZSIsImxvYWRBZ2VudE1lbW9yeVByb21wdCIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIlNlbGVjdCIsIkJ5bGluZSIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwidXNlV2l6YXJkIiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwiQWdlbnRXaXphcmREYXRhIiwiTWVtb3J5T3B0aW9uIiwibGFiZWwiLCJ2YWx1ZSIsIk1lbW9yeVN0ZXAiLCIkIiwiX2MiLCJnb05leHQiLCJnb0JhY2siLCJ1cGRhdGVXaXphcmREYXRhIiwid2l6YXJkRGF0YSIsInQwIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsImlzVXNlclNjb3BlIiwibG9jYXRpb24iLCJ0MSIsIm1lbW9yeU9wdGlvbnMiLCJ0MiIsImZpbmFsQWdlbnQiLCJzeXN0ZW1Qcm9tcHQiLCJtZW1vcnkiLCJ1bmRlZmluZWQiLCJhZ2VudFR5cGUiLCJzZWxlY3RlZE1lbW9yeSIsImdldFN5c3RlbVByb21wdCIsImhhbmRsZVNlbGVjdCIsInQzIiwidDQiXSwic291cmNlcyI6WyJNZW1vcnlTdGVwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdHlwZSBSZWFjdE5vZGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCB9IGZyb20gJy4uLy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi8uLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHsgaXNBdXRvTWVtb3J5RW5hYmxlZCB9IGZyb20gJy4uLy4uLy4uLy4uL21lbWRpci9wYXRocy5qcydcbmltcG9ydCB7XG4gIHR5cGUgQWdlbnRNZW1vcnlTY29wZSxcbiAgbG9hZEFnZW50TWVtb3J5UHJvbXB0LFxufSBmcm9tICcuLi8uLi8uLi8uLi90b29scy9BZ2VudFRvb2wvYWdlbnRNZW1vcnkuanMnXG5pbXBvcnQgeyBDb25maWd1cmFibGVTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi8uLi9Db25maWd1cmFibGVTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi8uLi8uLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vLi4vLi4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyB1c2VXaXphcmQgfSBmcm9tICcuLi8uLi8uLi93aXphcmQvaW5kZXguanMnXG5pbXBvcnQgeyBXaXphcmREaWFsb2dMYXlvdXQgfSBmcm9tICcuLi8uLi8uLi93aXphcmQvV2l6YXJkRGlhbG9nTGF5b3V0LmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudFdpemFyZERhdGEgfSBmcm9tICcuLi90eXBlcy5qcydcblxudHlwZSBNZW1vcnlPcHRpb24gPSB7XG4gIGxhYmVsOiBzdHJpbmdcbiAgdmFsdWU6IEFnZW50TWVtb3J5U2NvcGUgfCAnbm9uZSdcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1lbW9yeVN0ZXAoKTogUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBnb05leHQsIGdvQmFjaywgdXBkYXRlV2l6YXJkRGF0YSwgd2l6YXJkRGF0YSB9ID1cbiAgICB1c2VXaXphcmQ8QWdlbnRXaXphcmREYXRhPigpXG5cbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIGdvQmFjaywgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyB9KVxuXG4gIGNvbnN0IGlzVXNlclNjb3BlID0gd2l6YXJkRGF0YS5sb2NhdGlvbiA9PT0gJ3VzZXJTZXR0aW5ncydcblxuICAvLyBCdWlsZCBvcHRpb25zIHdpdGggdGhlIHJlY29tbWVuZGVkIGRlZmF1bHQgZmlyc3QsIHRoZW4gYWx0ZXJuYXRpdmVzXG4gIC8vIFRoZSByZWNvbW1lbmRlZCBzY29wZSBtYXRjaGVzIHRoZSBhZ2VudCdzIGxvY2F0aW9uIChwcm9qZWN0IGFnZW50IOKGkiBwcm9qZWN0IG1lbW9yeSwgdXNlciBhZ2VudCDihpIgdXNlciBtZW1vcnkpXG4gIGNvbnN0IG1lbW9yeU9wdGlvbnM6IE1lbW9yeU9wdGlvbltdID0gaXNVc2VyU2NvcGVcbiAgICA/IFtcbiAgICAgICAge1xuICAgICAgICAgIGxhYmVsOiAnVXNlciBzY29wZSAofi8uY2xhdWRlL2FnZW50LW1lbW9yeS8pIChSZWNvbW1lbmRlZCknLFxuICAgICAgICAgIHZhbHVlOiAndXNlcicsXG4gICAgICAgIH0sXG4gICAgICAgIHsgbGFiZWw6ICdOb25lIChubyBwZXJzaXN0ZW50IG1lbW9yeSknLCB2YWx1ZTogJ25vbmUnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdQcm9qZWN0IHNjb3BlICguY2xhdWRlL2FnZW50LW1lbW9yeS8pJywgdmFsdWU6ICdwcm9qZWN0JyB9LFxuICAgICAgICB7IGxhYmVsOiAnTG9jYWwgc2NvcGUgKC5jbGF1ZGUvYWdlbnQtbWVtb3J5LWxvY2FsLyknLCB2YWx1ZTogJ2xvY2FsJyB9LFxuICAgICAgXVxuICAgIDogW1xuICAgICAgICB7XG4gICAgICAgICAgbGFiZWw6ICdQcm9qZWN0IHNjb3BlICguY2xhdWRlL2FnZW50LW1lbW9yeS8pIChSZWNvbW1lbmRlZCknLFxuICAgICAgICAgIHZhbHVlOiAncHJvamVjdCcsXG4gICAgICAgIH0sXG4gICAgICAgIHsgbGFiZWw6ICdOb25lIChubyBwZXJzaXN0ZW50IG1lbW9yeSknLCB2YWx1ZTogJ25vbmUnIH0sXG4gICAgICAgIHsgbGFiZWw6ICdVc2VyIHNjb3BlICh+Ly5jbGF1ZGUvYWdlbnQtbWVtb3J5LyknLCB2YWx1ZTogJ3VzZXInIH0sXG4gICAgICAgIHsgbGFiZWw6ICdMb2NhbCBzY29wZSAoLmNsYXVkZS9hZ2VudC1tZW1vcnktbG9jYWwvKScsIHZhbHVlOiAnbG9jYWwnIH0sXG4gICAgICBdXG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0ID0gKHZhbHVlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBjb25zdCBtZW1vcnkgPSB2YWx1ZSA9PT0gJ25vbmUnID8gdW5kZWZpbmVkIDogKHZhbHVlIGFzIEFnZW50TWVtb3J5U2NvcGUpXG4gICAgY29uc3QgYWdlbnRUeXBlID0gd2l6YXJkRGF0YS5maW5hbEFnZW50Py5hZ2VudFR5cGVcbiAgICB1cGRhdGVXaXphcmREYXRhKHtcbiAgICAgIHNlbGVjdGVkTWVtb3J5OiBtZW1vcnksXG4gICAgICAvLyBVcGRhdGUgZmluYWxBZ2VudCB3aXRoIG1lbW9yeSBhbmQgcmV3aXJlIGdldFN5c3RlbVByb21wdCB0byBpbmNsdWRlIG1lbW9yeSBsb2FkaW5nLlxuICAgICAgLy8gRXhwbGljaXRseSBzZXQgbWVtb3J5IChub3QgY29uZGl0aW9uYWwgc3ByZWFkKSBzbyBzZWxlY3RpbmcgJ25vbmUnIGFmdGVyIGdvaW5nIGJhY2sgY2xlYXJzIGl0LlxuICAgICAgZmluYWxBZ2VudDogd2l6YXJkRGF0YS5maW5hbEFnZW50XG4gICAgICAgID8ge1xuICAgICAgICAgICAgLi4ud2l6YXJkRGF0YS5maW5hbEFnZW50LFxuICAgICAgICAgICAgbWVtb3J5LFxuICAgICAgICAgICAgZ2V0U3lzdGVtUHJvbXB0OlxuICAgICAgICAgICAgICBpc0F1dG9NZW1vcnlFbmFibGVkKCkgJiYgbWVtb3J5ICYmIGFnZW50VHlwZVxuICAgICAgICAgICAgICAgID8gKCkgPT5cbiAgICAgICAgICAgICAgICAgICAgd2l6YXJkRGF0YS5zeXN0ZW1Qcm9tcHQhICtcbiAgICAgICAgICAgICAgICAgICAgJ1xcblxcbicgK1xuICAgICAgICAgICAgICAgICAgICBsb2FkQWdlbnRNZW1vcnlQcm9tcHQoYWdlbnRUeXBlLCBtZW1vcnkpXG4gICAgICAgICAgICAgICAgOiAoKSA9PiB3aXphcmREYXRhLnN5c3RlbVByb21wdCEsXG4gICAgICAgICAgfVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9KVxuICAgIGdvTmV4dCgpXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxXaXphcmREaWFsb2dMYXlvdXRcbiAgICAgIHN1YnRpdGxlPVwiQ29uZmlndXJlIGFnZW50IG1lbW9yeVwiXG4gICAgICBmb290ZXJUZXh0PXtcbiAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCLihpHihpNcIiBhY3Rpb249XCJuYXZpZ2F0ZVwiIC8+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiRW50ZXJcIiBhY3Rpb249XCJzZWxlY3RcIiAvPlxuICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgY29udGV4dD1cIkNvbmZpcm1hdGlvblwiXG4gICAgICAgICAgICBmYWxsYmFjaz1cIkVzY1wiXG4gICAgICAgICAgICBkZXNjcmlwdGlvbj1cImdvIGJhY2tcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQnlsaW5lPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBrZXk9XCJtZW1vcnktc2VsZWN0XCJcbiAgICAgICAgICBvcHRpb25zPXttZW1vcnlPcHRpb25zfVxuICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVTZWxlY3R9XG4gICAgICAgICAgb25DYW5jZWw9e2dvQmFja31cbiAgICAgICAgLz5cbiAgICAgIDwvQm94PlxuICAgIDwvV2l6YXJkRGlhbG9nTGF5b3V0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxRQUFRLE9BQU87QUFDN0MsU0FBU0MsR0FBRyxRQUFRLG9CQUFvQjtBQUN4QyxTQUFTQyxhQUFhLFFBQVEs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