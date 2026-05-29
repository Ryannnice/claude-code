// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、ReactNode、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { type ReactNode, useCallback, useState } from 'react';
// 引入 Box、Text，将 ../../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../../ink.js';
// 引入 useKeybinding，将 ../../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../../keybindings/useKeybinding.js';
// 复用 editPromptInEditor 工具函数，把通用处理留在 ../../../../utils/promptEditor.js 中维护。
import { editPromptInEditor } from '../../../../utils/promptEditor.js';
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
// 类型依赖 { AgentWizardData } 来自 ../types.js，用于校准终端渲染的数据契约。
import type { AgentWizardData } from '../types.js';
// PromptStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  // 系统提示词 由 React state 持有，setSystemPrompt 会在用户操作或异步结果返回时触发刷新。
  const [systemPrompt, setSystemPrompt] = useState(wizardData.systemPrompt || "");
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(systemPrompt.length);
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
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
  // t1 暂存 `async () => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== systemPrompt) {
    // t1 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = async () => {
      // 结果保存`editPromptInEditor`，供终端渲染后续处理使用。
      const result = await editPromptInEditor(systemPrompt);
      // `result.content` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (result.content !== null) {
        // setSystemPrompt 写入新的状态值，使终端渲染后续读取保持一致。
        setSystemPrompt(result.content);
        // setCursorOffset 写入新的状态值，使终端渲染后续读取保持一致。
        setCursorOffset(result.content.length);
      }
    };
    // $[1] 缓存 `systemPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = systemPrompt;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // handleExternalEditor沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleExternalEditor = t1;
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      context: "Chat"
    };
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("chat:externalEditor", handleExternalEditor, t2);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== goNext || $[5] !== systemPrompt || $[6] !== updateWizardData) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // trimmedPrompt格式化`systemPrompt.trim`，供终端渲染后续处理使用。
      const trimmedPrompt = systemPrompt.trim();
      // trimmedPrompt缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!trimmedPrompt) {
        // setError 写入新的状态值，使终端渲染后续读取保持一致。
        setError("System prompt is required");
        // 终端 UI 组件 Prompt Step在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setError 写入新的状态值，使终端渲染后续读取保持一致。
      setError(null);
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        systemPrompt: trimmedPrompt
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[4] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = goNext;
    // $[5] 缓存 `systemPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = systemPrompt;
    // $[6] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = updateWizardData;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // handleSubmit保存`t3`，作为后续临时缓存值处理的输入。
  const handleSubmit = t3;
  // t4 暂存 `<Byline><KeyboardShortcutHint shortcut="Type" action="ent...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Byline><KeyboardShortcutHint shortcut="Type" action="ent...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Byline><KeyboardShortcutHint shortcut="Type" action="enter text" /><KeyboardShortcutHint shortcut="Enter" action="continue" /><ConfigurableShortcutHint action="chat:externalEditor" context="Chat" fallback="ctrl+g" description="open in editor" /><ConfigurableShortcutHint action="confirm:no" context="Settings" fallback="Esc" description="go back" /></Byline>;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // t5 暂存 `<Text>Enter the system prompt for your agent:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `<Text dimColor={true}>Be comprehensive for best results</...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text>Enter the system prompt for your agent:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>Enter the system prompt for your agent:</Text>;
    // t6 暂存 `<Text dimColor={true}>Be comprehensive for best results</...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text dimColor={true}>Be comprehensive for best results</Text>;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // t7 暂存 `<Box marginTop={1}><TextInput value={systemPrompt} onChan...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== cursorOffset || $[12] !== handleSubmit || $[13] !== systemPrompt) {
    // t7 暂存 `<Box marginTop={1}><TextInput value={systemPrompt} onChan...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginTop={1}><TextInput value={systemPrompt} onChange={setSystemPrompt} onSubmit={handleSubmit} placeholder="You are a helpful code reviewer who..." columns={80} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} focus={true} showCursor={true} /></Box>;
    // $[11] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = cursorOffset;
    // $[12] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = handleSubmit;
    // $[13] 缓存 `systemPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = systemPrompt;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // t8 暂存 `error && <Box marginTop={1}><Text color="error">{error}</...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== error) {
    // t8 暂存 `error && <Box marginTop={1}><Text color="error">{error}</...` 生成的渲染片段，后续返回路径直接复用。
    t8 = error && <Box marginTop={1}><Text color="error">{error}</Text></Box>;
    // $[15] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = error;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[16];
  }
  // t9 暂存 `<WizardDialogLayout subtitle="System prompt" footerText={...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== t7 || $[18] !== t8) {
    // t9 暂存 `<WizardDialogLayout subtitle="System prompt" footerText={...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <WizardDialogLayout subtitle="System prompt" footerText={t4}><Box flexDirection="column">{t5}{t6}{t7}{t8}</Box></WizardDialogLayout>;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
    // $[19] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[19];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZyIsImVkaXRQcm9tcHRJbkVkaXRvciIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIkJ5bGluZSIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwiVGV4dElucHV0IiwidXNlV2l6YXJkIiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwiQWdlbnRXaXphcmREYXRhIiwiUHJvbXB0U3RlcCIsIiQiLCJfYyIsImdvTmV4dCIsImdvQmFjayIsInVwZGF0ZVdpemFyZERhdGEiLCJ3aXphcmREYXRhIiwic3lzdGVtUHJvbXB0Iiwic2V0U3lzdGVtUHJvbXB0IiwiY3Vyc29yT2Zmc2V0Iiwic2V0Q3Vyc29yT2Zmc2V0IiwibGVuZ3RoIiwiZXJyb3IiLCJzZXRFcnJvciIsInQwIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQxIiwicmVzdWx0IiwiY29udGVudCIsImhhbmRsZUV4dGVybmFsRWRpdG9yIiwidDIiLCJ0MyIsInRyaW1tZWRQcm9tcHQiLCJ0cmltIiwiaGFuZGxlU3VibWl0IiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5Il0sInNvdXJjZXMiOlsiUHJvbXB0U3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHR5cGUgUmVhY3ROb2RlLCB1c2VDYWxsYmFjaywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi8uLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHsgZWRpdFByb21wdEluRWRpdG9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvcHJvbXB0RWRpdG9yLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vLi4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vLi4vLi4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgVGV4dElucHV0IGZyb20gJy4uLy4uLy4uL1RleHRJbnB1dC5qcydcbmltcG9ydCB7IHVzZVdpemFyZCB9IGZyb20gJy4uLy4uLy4uL3dpemFyZC9pbmRleC5qcydcbmltcG9ydCB7IFdpemFyZERpYWxvZ0xheW91dCB9IGZyb20gJy4uLy4uLy4uL3dpemFyZC9XaXphcmREaWFsb2dMYXlvdXQuanMnXG5pbXBvcnQgdHlwZSB7IEFnZW50V2l6YXJkRGF0YSB9IGZyb20gJy4uL3R5cGVzLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gUHJvbXB0U3RlcCgpOiBSZWFjdE5vZGUge1xuICBjb25zdCB7IGdvTmV4dCwgZ29CYWNrLCB1cGRhdGVXaXphcmREYXRhLCB3aXphcmREYXRhIH0gPVxuICAgIHVzZVdpemFyZDxBZ2VudFdpemFyZERhdGE+KClcbiAgY29uc3QgW3N5c3RlbVByb21wdCwgc2V0U3lzdGVtUHJvbXB0XSA9IHVzZVN0YXRlKFxuICAgIHdpemFyZERhdGEuc3lzdGVtUHJvbXB0IHx8ICcnLFxuICApXG4gIGNvbnN0IFtjdXJzb3JPZmZzZXQsIHNldEN1cnNvck9mZnNldF0gPSB1c2VTdGF0ZShzeXN0ZW1Qcm9tcHQubGVuZ3RoKVxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG5cbiAgLy8gSGFuZGxlIGVzY2FwZSBrZXkgLSB1c2UgU2V0dGluZ3MgY29udGV4dCBzbyAnbicga2V5IGRvZXNuJ3QgY2FuY2VsIChhbGxvd3MgdHlwaW5nICduJyBpbiBpbnB1dClcbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIGdvQmFjaywgeyBjb250ZXh0OiAnU2V0dGluZ3MnIH0pXG5cbiAgY29uc3QgaGFuZGxlRXh0ZXJuYWxFZGl0b3IgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZWRpdFByb21wdEluRWRpdG9yKHN5c3RlbVByb21wdClcbiAgICBpZiAocmVzdWx0LmNvbnRlbnQgIT09IG51bGwpIHtcbiAgICAgIHNldFN5c3RlbVByb21wdChyZXN1bHQuY29udGVudClcbiAgICAgIHNldEN1cnNvck9mZnNldChyZXN1bHQuY29udGVudC5sZW5ndGgpXG4gICAgfVxuICB9LCBbc3lzdGVtUHJvbXB0XSlcblxuICB1c2VLZXliaW5kaW5nKCdjaGF0OmV4dGVybmFsRWRpdG9yJywgaGFuZGxlRXh0ZXJuYWxFZGl0b3IsIHtcbiAgICBjb250ZXh0OiAnQ2hhdCcsXG4gIH0pXG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gKCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IHRyaW1tZWRQcm9tcHQgPSBzeXN0ZW1Qcm9tcHQudHJpbSgpXG4gICAgaWYgKCF0cmltbWVkUHJvbXB0KSB7XG4gICAgICBzZXRFcnJvcignU3lzdGVtIHByb21wdCBpcyByZXF1aXJlZCcpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzZXRFcnJvcihudWxsKVxuICAgIHVwZGF0ZVdpemFyZERhdGEoeyBzeXN0ZW1Qcm9tcHQ6IHRyaW1tZWRQcm9tcHQgfSlcbiAgICBnb05leHQoKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8V2l6YXJkRGlhbG9nTGF5b3V0XG4gICAgICBzdWJ0aXRsZT1cIlN5c3RlbSBwcm9tcHRcIlxuICAgICAgZm9vdGVyVGV4dD17XG4gICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiVHlwZVwiIGFjdGlvbj1cImVudGVyIHRleHRcIiAvPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwiY29udGludWVcIiAvPlxuICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgIGFjdGlvbj1cImNoYXQ6ZXh0ZXJuYWxFZGl0b3JcIlxuICAgICAgICAgICAgY29udGV4dD1cIkNoYXRcIlxuICAgICAgICAgICAgZmFsbGJhY2s9XCJjdHJsK2dcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJvcGVuIGluIGVkaXRvclwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgIGNvbnRleHQ9XCJTZXR0aW5nc1wiXG4gICAgICAgICAgICBmYWxsYmFjaz1cIkVzY1wiXG4gICAgICAgICAgICBkZXNjcmlwdGlvbj1cImdvIGJhY2tcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQnlsaW5lPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5FbnRlciB0aGUgc3lzdGVtIHByb21wdCBmb3IgeW91ciBhZ2VudDo8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPkJlIGNvbXByZWhlbnNpdmUgZm9yIGJlc3QgcmVzdWx0czwvVGV4dD5cblxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgdmFsdWU9e3N5c3RlbVByb21wdH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtzZXRTeXN0ZW1Qcm9tcHR9XG4gICAgICAgICAgICBvblN1Ym1pdD17aGFuZGxlU3VibWl0fVxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJZb3UgYXJlIGEgaGVscGZ1bCBjb2RlIHJldmlld2VyIHdoby4uLlwiXG4gICAgICAgICAgICBjb2x1bW5zPXs4MH1cbiAgICAgICAgICAgIGN1cnNvck9mZnNldD17Y3Vyc29yT2Zmc2V0fVxuICAgICAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9e3NldEN1cnNvck9mZnNldH1cbiAgICAgICAgICAgIGZvY3VzXG4gICAgICAgICAgICBzaG93Q3Vyc29yXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAge2Vycm9yICYmIChcbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+e2Vycm9yfTwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvV2l6YXJkRGlhbG9nTGF5b3V0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxFQUFFQyxXQUFXLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3BFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLG9CQUFvQjtBQUM5QyxTQUFTQyxhQUFhLFFBQVEsMENBQTBDO0FBQ3hFLFNBQVNDLGtCQUFrQixRQUFRLG1DQUFtQztBQUN0RSxTQUFTQyx3QkFBd0IsUUFBUSxzQ0FBc0M7QUFDL0UsU0FBU0MsTUFBTSxRQUFRLGtDQUFrQztBQUN6RCxTQUFTQyxvQkFBb0IsUUFBUSxnREFBZ0Q7QUFDckYsT0FBT0MsU0FBUyxNQUFNLHVCQUF1QjtBQUM3QyxTQUFTQyxTQUFTLFFBQVEsMEJBQTBCO0FBQ3BELFNBQVNDLGtCQUFrQixRQUFRLHVDQUF1QztBQUMxRSxjQUFjQyxlQUFlLFFBQVEsYUFBYTtBQUVsRCxPQUFPLFNBQUFDLFdBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFDTDtJQUFBQyxNQUFBO0lBQUFDLE1BQUE7SUFBQUMsZ0JBQUE7SUFBQUM7RUFBQSxJQUNFVCxTQUFTLENBQWtCLENBQUM7RUFDOUIsT0FBQVUsWUFBQSxFQUFBQyxlQUFBLElBQXdD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