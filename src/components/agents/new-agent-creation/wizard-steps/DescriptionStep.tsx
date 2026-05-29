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
// DescriptionStep 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DescriptionStep() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    goNext,
    goBack,
    updateWizardData,
    wizardData
  } = useWizard();
  // whenToUse 由 React state 持有，setWhenToUse 会在用户操作或异步结果返回时触发刷新。
  const [whenToUse, setWhenToUse] = useState(wizardData.whenToUse || "");
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(whenToUse.length);
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
  if ($[1] !== whenToUse) {
    // t1 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = async () => {
      // 结果保存`editPromptInEditor`，供终端渲染后续处理使用。
      const result = await editPromptInEditor(whenToUse);
      // `result.content` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (result.content !== null) {
        // setWhenToUse 写入新的状态值，使终端渲染后续读取保持一致。
        setWhenToUse(result.content);
        // setCursorOffset 写入新的状态值，使终端渲染后续读取保持一致。
        setCursorOffset(result.content.length);
      }
    };
    // $[1] 缓存 `whenToUse`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = whenToUse;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // handleExternalEditor保存`t1`，作为后续临时缓存值处理的输入。
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
  // t3 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== goNext || $[5] !== updateWizardData) {
    // t3 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = value => {
      // trimmedValue格式化`value.trim`，供终端渲染后续处理使用。
      const trimmedValue = value.trim();
      // trimmedValue缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!trimmedValue) {
        // setError 写入新的状态值，使终端渲染后续读取保持一致。
        setError("Description is required");
        // 终端 UI 组件 Description Step在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setError 写入新的状态值，使终端渲染后续读取保持一致。
      setError(null);
      // 调用 updateWizardData，触发终端渲染此处需要的副作用。
      updateWizardData({
        whenToUse: trimmedValue
      });
      // 调用 goNext，触发终端渲染此处需要的副作用。
      goNext();
    };
    // $[4] 缓存 `goNext`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = goNext;
    // $[5] 缓存 `updateWizardData`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = updateWizardData;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // handleSubmit保存`t3`，作为后续临时缓存值处理的输入。
  const handleSubmit = t3;
  // t4 暂存 `<Byline><KeyboardShortcutHint shortcut="Type" action="ent...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Byline><KeyboardShortcutHint shortcut="Type" action="ent...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Byline><KeyboardShortcutHint shortcut="Type" action="enter text" /><KeyboardShortcutHint shortcut="Enter" action="continue" /><ConfigurableShortcutHint action="chat:externalEditor" context="Chat" fallback="ctrl+g" description="open in editor" /><ConfigurableShortcutHint action="confirm:no" context="Settings" fallback="Esc" description="go back" /></Byline>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // t5 暂存 `<Text>When should Claude use this agent?</Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text>When should Claude use this agent?</Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>When should Claude use this agent?</Text>;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Box marginTop={1}><TextInput value={whenToUse} onChange=...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== cursorOffset || $[10] !== handleSubmit || $[11] !== whenToUse) {
    // t6 暂存 `<Box marginTop={1}><TextInput value={whenToUse} onChange=...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box marginTop={1}><TextInput value={whenToUse} onChange={setWhenToUse} onSubmit={handleSubmit} placeholder="e.g., use this agent after you're done writing code..." columns={80} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} focus={true} showCursor={true} /></Box>;
    // $[9] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = cursorOffset;
    // $[10] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handleSubmit;
    // $[11] 缓存 `whenToUse`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = whenToUse;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `error && <Box marginTop={1}><Text color="error">{error}</...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== error) {
    // t7 暂存 `error && <Box marginTop={1}><Text color="error">{error}</...` 生成的渲染片段，后续返回路径直接复用。
    t7 = error && <Box marginTop={1}><Text color="error">{error}</Text></Box>;
    // $[13] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = error;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // t8 暂存 `<WizardDialogLayout subtitle="Description (tell Claude wh...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== t6 || $[16] !== t7) {
    // t8 暂存 `<WizardDialogLayout subtitle="Description (tell Claude wh...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <WizardDialogLayout subtitle="Description (tell Claude when to use this agent)" footerText={t4}><Box flexDirection="column">{t5}{t6}{t7}</Box></WizardDialogLayout>;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[17];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlJlYWN0Tm9kZSIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZyIsImVkaXRQcm9tcHRJbkVkaXRvciIsIkNvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCIsIkJ5bGluZSIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwiVGV4dElucHV0IiwidXNlV2l6YXJkIiwiV2l6YXJkRGlhbG9nTGF5b3V0IiwiQWdlbnRXaXphcmREYXRhIiwiRGVzY3JpcHRpb25TdGVwIiwiJCIsIl9jIiwiZ29OZXh0IiwiZ29CYWNrIiwidXBkYXRlV2l6YXJkRGF0YSIsIndpemFyZERhdGEiLCJ3aGVuVG9Vc2UiLCJzZXRXaGVuVG9Vc2UiLCJjdXJzb3JPZmZzZXQiLCJzZXRDdXJzb3JPZmZzZXQiLCJsZW5ndGgiLCJlcnJvciIsInNldEVycm9yIiwidDAiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwidDEiLCJyZXN1bHQiLCJjb250ZW50IiwiaGFuZGxlRXh0ZXJuYWxFZGl0b3IiLCJ0MiIsInQzIiwidmFsdWUiLCJ0cmltbWVkVmFsdWUiLCJ0cmltIiwiaGFuZGxlU3VibWl0IiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCJdLCJzb3VyY2VzIjpbIkRlc2NyaXB0aW9uU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHR5cGUgUmVhY3ROb2RlLCB1c2VDYWxsYmFjaywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi8uLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHsgZWRpdFByb21wdEluRWRpdG9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vdXRpbHMvcHJvbXB0RWRpdG9yLmpzJ1xuaW1wb3J0IHsgQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vLi4vLi4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vLi4vLi4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uLy4uL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgVGV4dElucHV0IGZyb20gJy4uLy4uLy4uL1RleHRJbnB1dC5qcydcbmltcG9ydCB7IHVzZVdpemFyZCB9IGZyb20gJy4uLy4uLy4uL3dpemFyZC9pbmRleC5qcydcbmltcG9ydCB7IFdpemFyZERpYWxvZ0xheW91dCB9IGZyb20gJy4uLy4uLy4uL3dpemFyZC9XaXphcmREaWFsb2dMYXlvdXQuanMnXG5pbXBvcnQgdHlwZSB7IEFnZW50V2l6YXJkRGF0YSB9IGZyb20gJy4uL3R5cGVzLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gRGVzY3JpcHRpb25TdGVwKCk6IFJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgZ29OZXh0LCBnb0JhY2ssIHVwZGF0ZVdpemFyZERhdGEsIHdpemFyZERhdGEgfSA9XG4gICAgdXNlV2l6YXJkPEFnZW50V2l6YXJkRGF0YT4oKVxuICBjb25zdCBbd2hlblRvVXNlLCBzZXRXaGVuVG9Vc2VdID0gdXNlU3RhdGUod2l6YXJkRGF0YS53aGVuVG9Vc2UgfHwgJycpXG4gIGNvbnN0IFtjdXJzb3JPZmZzZXQsIHNldEN1cnNvck9mZnNldF0gPSB1c2VTdGF0ZSh3aGVuVG9Vc2UubGVuZ3RoKVxuICBjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG5cbiAgLy8gSGFuZGxlIGVzY2FwZSBrZXkgLSB1c2UgU2V0dGluZ3MgY29udGV4dCBzbyAnbicga2V5IGRvZXNuJ3QgY2FuY2VsIChhbGxvd3MgdHlwaW5nICduJyBpbiBpbnB1dClcbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIGdvQmFjaywgeyBjb250ZXh0OiAnU2V0dGluZ3MnIH0pXG5cbiAgY29uc3QgaGFuZGxlRXh0ZXJuYWxFZGl0b3IgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZWRpdFByb21wdEluRWRpdG9yKHdoZW5Ub1VzZSlcbiAgICBpZiAocmVzdWx0LmNvbnRlbnQgIT09IG51bGwpIHtcbiAgICAgIHNldFdoZW5Ub1VzZShyZXN1bHQuY29udGVudClcbiAgICAgIHNldEN1cnNvck9mZnNldChyZXN1bHQuY29udGVudC5sZW5ndGgpXG4gICAgfVxuICB9LCBbd2hlblRvVXNlXSlcblxuICB1c2VLZXliaW5kaW5nKCdjaGF0OmV4dGVybmFsRWRpdG9yJywgaGFuZGxlRXh0ZXJuYWxFZGl0b3IsIHtcbiAgICBjb250ZXh0OiAnQ2hhdCcsXG4gIH0pXG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gKHZhbHVlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBjb25zdCB0cmltbWVkVmFsdWUgPSB2YWx1ZS50cmltKClcbiAgICBpZiAoIXRyaW1tZWRWYWx1ZSkge1xuICAgICAgc2V0RXJyb3IoJ0Rlc2NyaXB0aW9uIGlzIHJlcXVpcmVkJylcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHNldEVycm9yKG51bGwpXG4gICAgdXBkYXRlV2l6YXJkRGF0YSh7IHdoZW5Ub1VzZTogdHJpbW1lZFZhbHVlIH0pXG4gICAgZ29OZXh0KClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFdpemFyZERpYWxvZ0xheW91dFxuICAgICAgc3VidGl0bGU9XCJEZXNjcmlwdGlvbiAodGVsbCBDbGF1ZGUgd2hlbiB0byB1c2UgdGhpcyBhZ2VudClcIlxuICAgICAgZm9vdGVyVGV4dD17XG4gICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiVHlwZVwiIGFjdGlvbj1cImVudGVyIHRleHRcIiAvPlxuICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwiY29udGludWVcIiAvPlxuICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgIGFjdGlvbj1cImNoYXQ6ZXh0ZXJuYWxFZGl0b3JcIlxuICAgICAgICAgICAgY29udGV4dD1cIkNoYXRcIlxuICAgICAgICAgICAgZmFsbGJhY2s9XCJjdHJsK2dcIlxuICAgICAgICAgICAgZGVzY3JpcHRpb249XCJvcGVuIGluIGVkaXRvclwiXG4gICAgICAgICAgLz5cbiAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgIGNvbnRleHQ9XCJTZXR0aW5nc1wiXG4gICAgICAgICAgICBmYWxsYmFjaz1cIkVzY1wiXG4gICAgICAgICAgICBkZXNjcmlwdGlvbj1cImdvIGJhY2tcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQnlsaW5lPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5XaGVuIHNob3VsZCBDbGF1ZGUgdXNlIHRoaXMgYWdlbnQ/PC9UZXh0PlxuXG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dElucHV0XG4gICAgICAgICAgICB2YWx1ZT17d2hlblRvVXNlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e3NldFdoZW5Ub1VzZX1cbiAgICAgICAgICAgIG9uU3VibWl0PXtoYW5kbGVTdWJtaXR9XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cImUuZy4sIHVzZSB0aGlzIGFnZW50IGFmdGVyIHlvdSdyZSBkb25lIHdyaXRpbmcgY29kZS4uLlwiXG4gICAgICAgICAgICBjb2x1bW5zPXs4MH1cbiAgICAgICAgICAgIGN1cnNvck9mZnNldD17Y3Vyc29yT2Zmc2V0fVxuICAgICAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9e3NldEN1cnNvck9mZnNldH1cbiAgICAgICAgICAgIGZvY3VzXG4gICAgICAgICAgICBzaG93Q3Vyc29yXG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAge2Vycm9yICYmIChcbiAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+e2Vycm9yfTwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvV2l6YXJkRGlhbG9nTGF5b3V0PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUksS0FBS0MsU0FBUyxFQUFFQyxXQUFXLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3BFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLG9CQUFvQjtBQUM5QyxTQUFTQyxhQUFhLFFBQVEsMENBQTBDO0FBQ3hFLFNBQVNDLGtCQUFrQixRQUFRLG1DQUFtQztBQUN0RSxTQUFTQyx3QkFBd0IsUUFBUSxzQ0FBc0M7QUFDL0UsU0FBU0MsTUFBTSxRQUFRLGtDQUFrQztBQUN6RCxTQUFTQyxvQkFBb0IsUUFBUSxnREFBZ0Q7QUFDckYsT0FBT0MsU0FBUyxNQUFNLHVCQUF1QjtBQUM3QyxTQUFTQyxTQUFTLFFBQVEsMEJBQTBCO0FBQ3BELFNBQVNDLGtCQUFrQixRQUFRLHVDQUF1QztBQUMxRSxjQUFjQyxlQUFlLFFBQVEsYUFBYTtBQUVsRCxPQUFPLFNBQUFDLGdCQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0w7SUFBQUMsTUFBQTtJQUFBQyxNQUFBO0lBQUFDLGdCQUFBO0lBQUFDO0VBQUEsSUFDRVQsU0FBUyxDQUFrQixDQUFDO0VBQzlCLE9BQUFVLFNBQUEsRUFBQUMsWUFBQSxJQUFrQ3BCLFFBQVEsQ0FBQ2tCLFVBQVUsQ0FBQUMsU0FBZ0IsSUFBMUIsRUFBMEIsQ0FB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