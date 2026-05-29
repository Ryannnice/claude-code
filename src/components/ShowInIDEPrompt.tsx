// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { basename, relative } from 'path';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 getCwd 工具函数，把通用处理留在 ../utils/cwd.js 中维护。
import { getCwd } from '../utils/cwd.js';
// 复用 isSupportedVSCodeTerminal 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { isSupportedVSCodeTerminal } from '../utils/ide.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Pane，将 ./design-system/Pane.js 中已经封装好的能力接到本文件流程里。
import { Pane } from './design-system/Pane.js';
// 类型依赖 { PermissionOption, PermissionOptionWithLabel } 来自 ./permissions/FilePermissionDialog/permissionOptions.js，用于校准终端渲染的数据契约。
import type { PermissionOption, PermissionOptionWithLabel } from './permissions/FilePermissionDialog/permissionOptions.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props<A> = {
  filePath: string;
  input: A;
  // 这个回调绑定到 onChange: (option: PermissionOption, args: A, feedback?: string) => void;，负责终端渲染在该局部场景下的响应。
  onChange: (option: PermissionOption, args: A, feedback?: string) => void;
  options: PermissionOptionWithLabel[];
  ideName: string;
  symlinkTarget?: string | null;
  rejectFeedback: string;
  acceptFeedback: string;
  // 这个回调绑定到 setFocusedOption: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  setFocusedOption: (value: string) => void;
  // 这个回调绑定到 onInputModeToggle: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onInputModeToggle: (value: string) => void;
  focusedOption: string;
  yesInputMode: boolean;
  noInputMode: boolean;
};
// ShowInIDEPrompt 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShowInIDEPrompt(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(36);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onChange,
    options,
    input,
    filePath,
    ideName,
    symlinkTarget,
    rejectFeedback,
    acceptFeedback,
    setFocusedOption,
    onInputModeToggle,
    focusedOption,
    yesInputMode,
    noInputMode
  } = t0;
  // t1 暂存 `<Text bold={true} color="permission">Opened changes in {i...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== ideName) {
    // t1 暂存 `<Text bold={true} color="permission">Opened changes in {i...` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text bold={true} color="permission">Opened changes in {ideName} ⧉</Text>;
    // $[0] 缓存 `ideName`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = ideName;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `symlinkTarget && <Text color="warning">{relative(getCwd()...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== symlinkTarget) {
    // t2 暂存 `symlinkTarget && <Text color="warning">{relative(getCwd()...` 生成的渲染片段，后续返回路径直接复用。
    t2 = symlinkTarget && <Text color="warning">{relative(getCwd(), symlinkTarget).startsWith("..") ? `This will modify ${symlinkTarget} (outside working directory) via a symlink` : `Symlink target: ${symlinkTarget}`}</Text>;
    // $[2] 缓存 `symlinkTarget`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = symlinkTarget;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `isSupportedVSCodeTerminal() && <Text dimColor={true}>Save...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `isSupportedVSCodeTerminal() && <Text dimColor={true}>Save...` 生成的渲染片段，后续返回路径直接复用。
    t3 = isSupportedVSCodeTerminal() && <Text dimColor={true}>Save file to continue…</Text>;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `basename(filePath)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== filePath) {
    // t4 暂存 `basename(filePath)` 生成的渲染片段，后续返回路径直接复用。
    t4 = basename(filePath);
    // $[5] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = filePath;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Text>Do you want to make this edit to{" "}<Text bold={tr...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t4) {
    // t5 暂存 `<Text>Do you want to make this edit to{" "}<Text bold={tr...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text>Do you want to make this edit to{" "}<Text bold={true}>{t4}</Text>?</Text>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== acceptFeedback || $[10] !== input || $[11] !== onChange || $[12] !== options || $[13] !== rejectFeedback) {
    // t6 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = value => {
      // selected筛选`options.find`，供终端渲染后续处理使用。
      const selected = options.find(opt => opt.value === value);
      // 满足 `selected` 时，终端渲染执行该分支。
      if (selected) {
        // 当 `selected.option.type` 匹配 `"reject"` 时，终端渲染执行对应分支。
        if (selected.option.type === "reject") {
          // trimmedFeedback格式化`rejectFeedback.trim`，供终端渲染后续处理使用。
          const trimmedFeedback = rejectFeedback.trim();
          // 调用 onChange，触发终端渲染此处需要的副作用。
          onChange(selected.option, input, trimmedFeedback || undefined);
          // 终端 UI 组件 Show In IDEPrompt在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 当 `selected.option.type` 匹配 `"accept-once"` 时，终端渲染执行对应分支。
        if (selected.option.type === "accept-once") {
          // trimmedFeedback_0格式化`acceptFeedback.trim`，供终端渲染后续处理使用。
          const trimmedFeedback_0 = acceptFeedback.trim();
          // 调用 onChange，触发终端渲染此处需要的副作用。
          onChange(selected.option, input, trimmedFeedback_0 || undefined);
          // 终端 UI 组件 Show In IDEPrompt在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 调用 onChange，触发终端渲染此处需要的副作用。
        onChange(selected.option, input);
      }
    };
    // $[9] 缓存 `acceptFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = acceptFeedback;
    // $[10] 缓存 `input`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = input;
    // $[11] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onChange;
    // $[12] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = options;
    // $[13] 缓存 `rejectFeedback`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = rejectFeedback;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // t7 暂存 `() => onChange({` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== input || $[16] !== onChange) {
    // t7 暂存 `() => onChange({` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => onChange({
      type: "reject"
    }, input);
    // $[15] 缓存 `input`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = input;
    // $[16] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onChange;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[17];
  }
  // t8 暂存 `value_0 => setFocusedOption(value_0)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== setFocusedOption) {
    // t8 暂存 `value_0 => setFocusedOption(value_0)` 生成的渲染片段，后续返回路径直接复用。
    t8 = value_0 => setFocusedOption(value_0);
    // $[18] 缓存 `setFocusedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = setFocusedOption;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // t9 暂存 `<Select options={options} inlineDescriptions={true} onCha...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== onInputModeToggle || $[21] !== options || $[22] !== t6 || $[23] !== t7 || $[24] !== t8) {
    // t9 暂存 `<Select options={options} inlineDescriptions={true} onCha...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Select options={options} inlineDescriptions={true} onChange={t6} onCancel={t7} onFocus={t8} onInputModeToggle={onInputModeToggle} />;
    // $[20] 缓存 `onInputModeToggle`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = onInputModeToggle;
    // $[21] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = options;
    // $[22] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t6;
    // $[23] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t7;
    // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t8;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[25];
  }
  // t10 暂存 `<Box flexDirection="column">{t5}{t9}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== t5 || $[27] !== t9) {
    // t10 暂存 `<Box flexDirection="column">{t5}{t9}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box flexDirection="column">{t5}{t9}</Box>;
    // $[26] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t5;
    // $[27] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t9;
    // $[28] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[28];
  }
  // t11标记终端 UI Show In IDEPrompt是否启用对应路径。
  const t11 = (focusedOption === "yes" && !yesInputMode || focusedOption === "no" && !noInputMode) && " \xB7 Tab to amend";
  // t12 暂存 `<Box marginTop={1}><Text dimColor={true}>Esc to cancel{t1...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== t11) {
    // t12 暂存 `<Box marginTop={1}><Text dimColor={true}>Esc to cancel{t1...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box marginTop={1}><Text dimColor={true}>Esc to cancel{t11}</Text></Box>;
    // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t11;
    // $[30] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[30];
  }
  // t13 暂存 `<Pane color="permission"><Box flexDirection="column" gap=...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== t1 || $[32] !== t10 || $[33] !== t12 || $[34] !== t2) {
    // t13 暂存 `<Pane color="permission"><Box flexDirection="column" gap=...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Pane color="permission"><Box flexDirection="column" gap={1}>{t1}{t2}{t3}{t10}{t12}</Box></Pane>;
    // $[31] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t1;
    // $[32] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t10;
    // $[33] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t12;
    // $[34] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t2;
    // $[35] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[35];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJiYXNlbmFtZSIsInJlbGF0aXZlIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiZ2V0Q3dkIiwiaXNTdXBwb3J0ZWRWU0NvZGVUZXJtaW5hbCIsIlNlbGVjdCIsIlBhbmUiLCJQZXJtaXNzaW9uT3B0aW9uIiwiUGVybWlzc2lvbk9wdGlvbldpdGhMYWJlbCIsIlByb3BzIiwiZmlsZVBhdGgiLCJpbnB1dCIsIkEiLCJvbkNoYW5nZSIsIm9wdGlvbiIsImFyZ3MiLCJmZWVkYmFjayIsIm9wdGlvbnMiLCJpZGVOYW1lIiwic3ltbGlua1RhcmdldCIsInJlamVjdEZlZWRiYWNrIiwiYWNjZXB0RmVlZGJhY2siLCJzZXRGb2N1c2VkT3B0aW9uIiwidmFsdWUiLCJvbklucHV0TW9kZVRvZ2dsZSIsImZvY3VzZWRPcHRpb24iLCJ5ZXNJbnB1dE1vZGUiLCJub0lucHV0TW9kZSIsIlNob3dJbklERVByb21wdCIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInN0YXJ0c1dpdGgiLCJ0MyIsIlN5bWJvbCIsImZvciIsInQ0IiwidDUiLCJ0NiIsInNlbGVjdGVkIiwiZmluZCIsIm9wdCIsInR5cGUiLCJ0cmltbWVkRmVlZGJhY2siLCJ0cmltIiwidW5kZWZpbmVkIiwidHJpbW1lZEZlZWRiYWNrXzAiLCJ0NyIsInQ4IiwidmFsdWVfMCIsInQ5IiwidDEwIiwidDExIiwidDEyIiwidDEzIl0sInNvdXJjZXMiOlsiU2hvd0luSURFUHJvbXB0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBiYXNlbmFtZSwgcmVsYXRpdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0Q3dkIH0gZnJvbSAnLi4vdXRpbHMvY3dkLmpzJ1xuaW1wb3J0IHsgaXNTdXBwb3J0ZWRWU0NvZGVUZXJtaW5hbCB9IGZyb20gJy4uL3V0aWxzL2lkZS5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9QYW5lLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBQZXJtaXNzaW9uT3B0aW9uLFxuICBQZXJtaXNzaW9uT3B0aW9uV2l0aExhYmVsLFxufSBmcm9tICcuL3Blcm1pc3Npb25zL0ZpbGVQZXJtaXNzaW9uRGlhbG9nL3Blcm1pc3Npb25PcHRpb25zLmpzJ1xuXG50eXBlIFByb3BzPEE+ID0ge1xuICBmaWxlUGF0aDogc3RyaW5nXG4gIGlucHV0OiBBXG4gIG9uQ2hhbmdlOiAob3B0aW9uOiBQZXJtaXNzaW9uT3B0aW9uLCBhcmdzOiBBLCBmZWVkYmFjaz86IHN0cmluZykgPT4gdm9pZFxuICBvcHRpb25zOiBQZXJtaXNzaW9uT3B0aW9uV2l0aExhYmVsW11cbiAgaWRlTmFtZTogc3RyaW5nXG4gIHN5bWxpbmtUYXJnZXQ/OiBzdHJpbmcgfCBudWxsXG4gIHJlamVjdEZlZWRiYWNrOiBzdHJpbmdcbiAgYWNjZXB0RmVlZGJhY2s6IHN0cmluZ1xuICBzZXRGb2N1c2VkT3B0aW9uOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICBvbklucHV0TW9kZVRvZ2dsZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgZm9jdXNlZE9wdGlvbjogc3RyaW5nXG4gIHllc0lucHV0TW9kZTogYm9vbGVhblxuICBub0lucHV0TW9kZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gU2hvd0luSURFUHJvbXB0PEE+KHtcbiAgb25DaGFuZ2UsXG4gIG9wdGlvbnMsXG4gIGlucHV0LFxuICBmaWxlUGF0aCxcbiAgaWRlTmFtZSxcbiAgc3ltbGlua1RhcmdldCxcbiAgcmVqZWN0RmVlZGJhY2ssXG4gIGFjY2VwdEZlZWRiYWNrLFxuICBzZXRGb2N1c2VkT3B0aW9uLFxuICBvbklucHV0TW9kZVRvZ2dsZSxcbiAgZm9jdXNlZE9wdGlvbixcbiAgeWVzSW5wdXRNb2RlLFxuICBub0lucHV0TW9kZSxcbn06IFByb3BzPEE+KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8UGFuZSBjb2xvcj1cInBlcm1pc3Npb25cIj5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJwZXJtaXNzaW9uXCI+XG4gICAgICAgICAgT3BlbmVkIGNoYW5nZXMgaW4ge2lkZU5hbWV9IOKniVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIHtzeW1saW5rVGFyZ2V0ICYmIChcbiAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj5cbiAgICAgICAgICAgIHtyZWxhdGl2ZShnZXRDd2QoKSwgc3ltbGlua1RhcmdldCkuc3RhcnRzV2l0aCgnLi4nKVxuICAgICAgICAgICAgICA/IGBUaGlzIHdpbGwgbW9kaWZ5ICR7c3ltbGlua1RhcmdldH0gKG91dHNpZGUgd29ya2luZyBkaXJlY3RvcnkpIHZpYSBhIHN5bWxpbmtgXG4gICAgICAgICAgICAgIDogYFN5bWxpbmsgdGFyZ2V0OiAke3N5bWxpbmtUYXJnZXR9YH1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICAgIHtpc1N1cHBvcnRlZFZTQ29kZVRlcm1pbmFsKCkgJiYgKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlNhdmUgZmlsZSB0byBjb250aW51ZeKApjwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICBEbyB5b3Ugd2FudCB0byBtYWtlIHRoaXMgZWRpdCB0b3snICd9XG4gICAgICAgICAgICA8VGV4dCBib2xkPntiYXNlbmFtZShmaWxlUGF0aCl9PC9UZXh0Pj9cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgIGlubGluZURlc2NyaXB0aW9uc1xuICAgICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSBvcHRpb25zLmZpbmQob3B0ID0+IG9wdC52YWx1ZSA9PT0gdmFsdWUpXG4gICAgICAgICAgICAgIGlmIChzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIC8vIEZvciByZWplY3Qgb3B0aW9uXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkLm9wdGlvbi50eXBlID09PSAncmVqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgdHJpbW1lZEZlZWRiYWNrID0gcmVqZWN0RmVlZGJhY2sudHJpbSgpXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZShzZWxlY3RlZC5vcHRpb24sIGlucHV0LCB0cmltbWVkRmVlZGJhY2sgfHwgdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEZvciBhY2NlcHQtb25jZSBvcHRpb24sIHBhc3MgYWNjZXB0IGZlZWRiYWNrIGlmIHByZXNlbnRcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWQub3B0aW9uLnR5cGUgPT09ICdhY2NlcHQtb25jZScpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRyaW1tZWRGZWVkYmFjayA9IGFjY2VwdEZlZWRiYWNrLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2Uoc2VsZWN0ZWQub3B0aW9uLCBpbnB1dCwgdHJpbW1lZEZlZWRiYWNrIHx8IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZShzZWxlY3RlZC5vcHRpb24sIGlucHV0KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IG9uQ2hhbmdlKHsgdHlwZTogJ3JlamVjdCcgfSwgaW5wdXQpfVxuICAgICAgICAgICAgb25Gb2N1cz17dmFsdWUgPT4gc2V0Rm9jdXNlZE9wdGlvbih2YWx1ZSl9XG4gICAgICAgICAgICBvbklucHV0TW9kZVRvZ2dsZT17b25JbnB1dE1vZGVUb2dnbGV9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIEVzYyB0byBjYW5jZWxcbiAgICAgICAgICAgIHsoKGZvY3VzZWRPcHRpb24gPT09ICd5ZXMnICYmICF5ZXNJbnB1dE1vZGUpIHx8XG4gICAgICAgICAgICAgIChmb2N1c2VkT3B0aW9uID09PSAnbm8nICYmICFub0lucHV0TW9kZSkpICYmXG4gICAgICAgICAgICAgICcgwrcgVGFiIHRvIGFtZW5kJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgPC9QYW5lPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxRQUFRLEVBQUVDLFFBQVEsUUFBUSxNQUFNO0FBQ3pDLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0MsTUFBTSxRQUFRLGlCQUFpQjtBQUN4QyxTQUFTQyx5QkFBeUIsUUFBUSxpQkFBaUI7QUFDM0QsU0FBU0MsTUFBTSxRQUFRLHlCQUF5QjtBQUNoRCxTQUFTQyxJQUFJLFFBQVEseUJBQXlCO0FBQzlDLGNBQ0VDLGdCQUFnQixFQUNoQkMseUJBQXlCLFFBQ3BCLHlEQUF5RDtBQUVoRSxLQUFLQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUc7RUFDZEMsUUFBUSxFQUFFLE1BQU07RUFDaEJDLEtBQUssRUFBRUMsQ0FBQztFQUNSQyxRQUFRLEVBQUUsQ0FBQ0MsTUFBTSxFQUFFUCxnQkFBZ0IsRUFBRVEsSUFBSSxFQUFFSCxDQUFDLEVB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