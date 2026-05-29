// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode, useState } from 'react';
// 引入 Box、Text，将 ../../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../../ink.js';
// 引入 useKeybinding，将 ../../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
// 类型依赖 { AgentDefinition } 来自 ../../../../tools/AgentTool/loadAgentsDir.js，用于校准终端渲染的数据契约。
import type { AgentDefinition } from '../../../../tools/AgentTool/loadAgentsDir.js';
// 引入 ConfigurableShortcutHint，将 ../../../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../../../ConfigurableShortcutHint.js';
// 引入 Byline，将 ../../../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../../../design-system/Byline.js';
// 引入 KeyboardShortcutHint，将 ../../../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../../../design-system/KeyboardShortcutHint.js';
// 引入 TextInput，将 ../../../TextInput.js 中已经封装好的能力接到本文件流程里。
import TextInput from '../../../TextInput.js';
// 引入 useWizard，将 ../../../wizard/index.js 中已经封装好的能力接到本文件流程里。
import { useWizard } from '../../../wizard/index.js';
// 引入 WizardDialogLayout，将 ../../../wizard/WizardDialogLayout.js 中已经封装好的能力接到本文件流程里。
import { WizardDialogLayout } from '../../../wizard/WizardDialogLayout.js';
// 引入 validateAgentType，将 ../../validateAgent.js 中已经封装好的能力接到本文件流程里。
import { validateAgentType } from '../../validateAgent.js';
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  existingAgents: AgentDefinition[];
};
// TypeStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TypeStep(_props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  // agentType 由 React state 持有，setAgentType 会在用户操作或异步结果返回时触发刷新。
  const [agentType, setAgentType] = useState(wizardData.agentType || "");
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(agentType.length);
  // t0 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t0 = {
      context: "Settings"
    };
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", goBack, t0);
  // t1 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== goNext || $[2] !== updateWizardData) {
    // t1 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = value => {
      // trimmedValue格式化`value.trim`，供终端渲染后续处理使用。
      const trimmedValue = value.trim();
      // validationError 错误信息读取`validateAgentType`，供终端渲染后续处理使用。
      const validationError = validateAgentType(trimmedValue);
      // 满足 `validationError` 时，终端渲染执行该分支。
      if (validationError) {
        // setError 写入新的状态值，使终端渲染后续读取保持一致。
        setError(validationError);
        // 终端 UI 组件 Type Step在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setError 写入新的状态值，使终端渲染后续读取保持一致。
      setError(null);
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        agentType: trimmedValue
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[1] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = goNext;
    // $[2] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = updateWizardData;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // handleSubmit沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSubmit = t1;
  // t2 暂存 `<Byline><KeyboardShortcutHint shortcut="Type" action="ent...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Byline><KeyboardShortcutHint shortcut="Type" action="ent...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Byline><KeyboardShortcutHint shortcut="Type" action="enter text" /><KeyboardShortcutHint shortcut="Enter" action="continue" /><ConfigurableShortcutHint action="confirm:no" context="Settings" fallback="Esc" description="go back" /></Byline>;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<Text>Enter a unique identifier for your agent:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `<Text>Enter a unique identifier for your agent:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text>Enter a unique identifier for your agent:</Text>;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<Box marginTop={1}><TextInput value={agentType} onChange=...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== agentType || $[7] !== cursorOffset || $[8] !== handleSubmit) {
    // t4 暂存 `<Box marginTop={1}><TextInput value={agentType} onChange=...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginTop={1}><TextInput value={agentType} onChange={setAgentType} onSubmit={handleSubmit} placeholder="e.g., test-runner, tech-lead, etc" columns={60} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} focus={true} showCursor={true} /></Box>;
    // $[6] 缓存 `agentType`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = agentType;
    // $[7] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = cursorOffset;
    // $[8] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = handleSubmit;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `error && <Box marginTop={1}><Text color="error">{error}</...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== error) {
    // t5 暂存 `error && <Box marginTop={1}><Text color="error">{error}</...` 生成的渲染片段，后续返回路径直接复用。
    t5 = error && <Box marginTop={1}><Text color="error">{error}</Text></Box>;
    // $[10] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = error;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // t6 暂存 `<WizardDialogLayout subtitle="Agent type (identifier)" fo...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t4 || $[13] !== t5) {
    // t6 暂存 `<WizardDialogLayout subtitle="Agent type (identifier)" fo...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <WizardDialogLayout subtitle="Agent type (identifier)" footerText={t2}><Box flexDirection="column">{t3}{t4}{t5}</Box></WizardDialogLayout>;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJBZ2VudERlZmluaXRpb24iLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJCeWxpbmUiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIlRleHRJbnB1dCIsInVzZVdpemFyZCIsIldpemFyZERpYWxvZ0xheW91dCIsInZhbGlkYXRlQWdlbnRUeXBlIiwiQWdlbnRXaXphcmREYXRhIiwiUHJvcHMiLCJleGlzdGluZ0FnZW50cyIsIlR5cGVTdGVwIiwiX3Byb3BzIiwiJCIsIl9jIiwiZ29OZXh0IiwiZ29CYWNrIiwidXBkYXRlV2l6YXJkRGF0YSIsIndpemFyZERhdGEiLCJhZ2VudFR5cGUiLCJzZXRBZ2VudFR5cGUiLCJlcnJvciIsInNldEVycm9yIiwiY3Vyc29yT2Zmc2V0Iiwic2V0Q3Vyc29yT2Zmc2V0IiwibGVuZ3RoIiwidDAiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwidDEiLCJ2YWx1ZSIsInRyaW1tZWRWYWx1ZSIsInRyaW0iLCJ2YWxpZGF0aW9uRXJyb3IiLCJoYW5kbGVTdWJtaXQiLCJ0MiIsInQzIiwidDQiLCJ0NSIsInQ2Il0sInNvdXJjZXMiOlsiVHlwZVN0ZXAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB0eXBlIFJlYWN0Tm9kZSwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi8uLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudERlZmluaXRpb24gfSBmcm9tICcuLi8uLi8uLi8uLi90b29scy9BZ2VudFRvb2wvbG9hZEFnZW50c0Rpci5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uLy4uL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vQnlsaW5lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi8uLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IFRleHRJbnB1dCBmcm9tICcuLi8uLi8uLi9UZXh0SW5wdXQuanMnXG5pbXBvcnQgeyB1c2VXaXphcmQgfSBmcm9tICcuLi8uLi8uLi93aXphcmQvaW5kZXguanMnXG5pbXBvcnQgeyBXaXphcmREaWFsb2dMYXlvdXQgfSBmcm9tICcuLi8uLi8uLi93aXphcmQvV2l6YXJkRGlhbG9nTGF5b3V0LmpzJ1xuaW1wb3J0IHsgdmFsaWRhdGVBZ2VudFR5cGUgfSBmcm9tICcuLi8uLi92YWxpZGF0ZUFnZW50LmpzJ1xuaW1wb3J0IHR5cGUgeyBBZ2VudFdpemFyZERhdGEgfSBmcm9tICcuLi90eXBlcy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgZXhpc3RpbmdBZ2VudHM6IEFnZW50RGVmaW5pdGlvbltdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUeXBlU3RlcChfcHJvcHM6IFByb3BzKTogUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBnb05leHQsIGdvQmFjaywgdXBkYXRlV2l6YXJkRGF0YSwgd2l6YXJkRGF0YSB9ID1cbiAgICB1c2VXaXphcmQ8QWdlbnRXaXphcmREYXRhPigpXG4gIGNvbnN0IFthZ2VudFR5cGUsIHNldEFnZW50VHlwZV0gPSB1c2VTdGF0ZSh3aXphcmREYXRhLmFnZW50VHlwZSB8fCAnJylcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbY3Vyc29yT2Zmc2V0LCBzZXRDdXJzb3JPZmZzZXRdID0gdXNlU3RhdGUoYWdlbnRUeXBlLmxlbmd0aClcblxuICAvLyBIYW5kbGUgZXNjYXBlIGtleSAtIEdvIGJhY2sgdG8gTWV0aG9kU3RlcFxuICAvLyBVc2UgU2V0dGluZ3MgY29udGV4dCBzbyAnbicga2V5IGRvZXNuJ3QgY2FuY2VsIChhbGxvd3MgdHlwaW5nICduJyBpbiBpbnB1dClcbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIGdvQmFjaywgeyBjb250ZXh0OiAnU2V0dGluZ3MnIH0pXG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gKHZhbHVlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBjb25zdCB0cmltbWVkVmFsdWUgPSB2YWx1ZS50cmltKClcbiAgICBjb25zdCB2YWxpZGF0aW9uRXJyb3IgPSB2YWxpZGF0ZUFnZW50VHlwZSh0cmltbWVkVmFsdWUpXG5cbiAgICBpZiAodmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICBzZXRFcnJvcih2YWxpZGF0aW9uRXJyb3IpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzZXRFcnJvcihudWxsKVxuICAgIHVwZGF0ZVdpemFyZERhdGEoeyBhZ2VudFR5cGU6IHRyaW1tZWRWYWx1ZSB9KVxuICAgIGdvTmV4dCgpXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxXaXphcmREaWFsb2dMYXlvdXRcbiAgICAgIHN1YnRpdGxlPVwiQWdlbnQgdHlwZSAoaWRlbnRpZmllcilcIlxuICAgICAgZm9vdGVyVGV4dD17XG4gICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiVHlwZVwiIGFjdGlvbj1cImVudGVyIHRleHRcIiAvPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwiY29udGludWVcIiAvPlxuICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgY29udGV4dD1cIlNldHRpbmdzXCJcbiAgICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiZ28gYmFja1wiXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9CeWxpbmU+XG4gICAgICB9XG4gICAgPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxUZXh0PkVudGVyIGEgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHlvdXIgYWdlbnQ6PC9UZXh0PlxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgdmFsdWU9e2FnZW50VHlwZX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtzZXRBZ2VudFR5cGV9XG4gICAgICAgICAgICBvblN1Ym1pdD17aGFuZGxlU3VibWl0fVxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJlLmcuLCB0ZXN0LXJ1bm5lciwgdGVjaC1sZWFkLCBldGNcIlxuICAgICAgICAgICAgY29sdW1ucz17NjB9XG4gICAgICAgICAgICBjdXJzb3JPZmZzZXQ9e2N1cnNvck9mZnNldH1cbiAgICAgICAgICAgIG9uQ2hhbmdlQ3Vyc29yT2Zmc2V0PXtzZXRDdXJzb3JPZmZzZXR9XG4gICAgICAgICAgICBmb2N1c1xuICAgICAgICAgICAgc2hvd0N1cnNvclxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuXG4gICAgICAgIHtlcnJvciAmJiAoXG4gICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPntlcnJvcn08L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L1dpemFyZERpYWxvZ0xheW91dD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJLEtBQUtDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDdkQsU0FBU0MsR0FBRyxFQUFF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