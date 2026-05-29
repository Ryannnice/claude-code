// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { SettingsJson } 来自 ../../utils/settings/types.js，用于校准终端渲染的数据契约。
import type { SettingsJson } from '../../utils/settings/types.js';
// 引入 Select，将 ../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/index.js';
// 引入 PermissionDialog，将 ../permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../permissions/PermissionDialog.js';
// 引入 extractDangerousSettings、formatDangerousSettingsList，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { extractDangerousSettings, formatDangerousSettingsList } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  settings: SettingsJson;
  // 这个回调绑定到 onAccept: () => void;，负责终端渲染在该局部场景下的响应。
  onAccept: () => void;
  // 这个回调绑定到 onReject: () => void;，负责终端渲染在该局部场景下的响应。
  onReject: () => void;
};
// ManagedSettingsSecurityDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ManagedSettingsSecurityDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    settings,
    onAccept,
    onReject
  } = t0;
  // dangerous 集合保存`extractDangerousSettings`，供终端渲染后续处理使用。
  const dangerous = extractDangerousSettings(settings);
  // settingsList 集合格式化`formatDangerousSettingsList`，供终端渲染后续处理使用。
  const settingsList = formatDangerousSettingsList(dangerous);
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      context: "Confirmation"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onReject, t1);
  // t2 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onAccept || $[2] !== onReject) {
    // t2 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function onChange(value) {
      // 当 `value` 匹配 `"exit"` 时，终端渲染执行对应分支。
      if (value === "exit") {
        // 调用 onReject，触发终端渲染此处需要的副作用。
        onReject();
        // 终端 UI 组件 Managed Settings Security ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 onAccept，触发终端渲染此处需要的副作用。
      onAccept();
    };
    // $[1] 缓存 `onAccept`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onAccept;
    // $[2] 缓存 `onReject`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onReject;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // onChange沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const onChange = t2;
  // 临时值 T0保存`PermissionDialog`，供后续判断或组装使用。
  const T0 = PermissionDialog;
  // t3保存`"warning"`，作为后续固定文本处理的输入。
  const t3 = "warning";
  // 临时值 t4 命名 `"warning"`，让后续代码直接表达这个值的用途。
  const t4 = "warning";
  // t5固定为 `"Managed settings require approval"`，作为终端 UI Managed Settings Sec...后续展示或比较的基准。
  const t5 = "Managed settings require approval";
  // 临时值 T1保存`Box`，供后续判断或组装使用。
  const T1 = Box;
  // 临时值 t6 命名 `"column"`，让后续代码直接表达这个值的用途。
  const t6 = "column";
  // t7保存`1`，供后续判断或组装使用。
  const t7 = 1;
  // 临时值 t8 命名 `1`，让后续代码直接表达这个值的用途。
  const t8 = 1;
  // t9 暂存 `<Text>Your organization has configured managed settings t...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `<Text>Your organization has configured managed settings t...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text>Your organization has configured managed settings that could allow execution of arbitrary code or interception of your prompts and responses.</Text>;
    // $[4] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[4];
  }
  // 临时值 T2保存`Box`，供后续判断或组装使用。
  const T2 = Box;
  // 临时值 t10 命名 `"column"`，让后续代码直接表达这个值的用途。
  const t10 = "column";
  // t11 暂存 `<Text dimColor={true}>Settings requiring approval:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<Text dimColor={true}>Settings requiring approval:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text dimColor={true}>Settings requiring approval:</Text>;
    // $[5] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[5];
  }
  // 临时值 t12派生`settingsList.map`，供终端渲染后续处理使用。
  const t12 = settingsList.map(_temp);
  // t13 暂存 `<T2 flexDirection={t10}>{t11}{t12}</T2>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== T2 || $[7] !== t11 || $[8] !== t12) {
    // t13 暂存 `<T2 flexDirection={t10}>{t11}{t12}</T2>` 生成的渲染片段，后续返回路径直接复用。
    t13 = <T2 flexDirection={t10}>{t11}{t12}</T2>;
    // $[6] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = T2;
    // $[7] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t11;
    // $[8] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t12;
    // $[9] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[9];
  }
  // t14 暂存 `<Text>Only accept if you trust your organization's IT adm...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t14 暂存 `<Text>Only accept if you trust your organization's IT adm...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text>Only accept if you trust your organization's IT administration and expect these settings to be configured.</Text>;
    // $[10] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t14;
  } else {
    // t14从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[10];
  }
  // t15暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // 判断 $[11] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t15暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t15 = [{
      label: "Yes, I trust these settings",
      value: "accept"
    }, {
      label: "No, exit Claude Code",
      value: "exit"
    }];
    // $[11] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t15;
  } else {
    // t15从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[11];
  }
  // t16暂存 `<Select options={t15} onChange={value_0 => onChange(value...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== onChange) {
    // t16暂存 `<Select options={t15} onChange={value_0 => onChange(value...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Select options={t15} onChange={value_0 => onChange(value_0 as 'accept' | 'exit')} onCancel={() => onChange("exit")} />;
    // $[12] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onChange;
    // $[13] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t16;
  } else {
    // t16从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[13];
  }
  // t17暂存 `<Text dimColor={true}>{exitState.pending ? <>Press {exitS...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== exitState.keyName || $[15] !== exitState.pending) {
    // t17暂存 `<Text dimColor={true}>{exitState.pending ? <>Press {exitS...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text dimColor={true}>{exitState.pending ? <>Press {exitState.keyName} again to exit</> : <>Enter to confirm · Esc to exit</>}</Text>;
    // $[14] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = exitState.keyName;
    // $[15] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = exitState.pending;
    // $[16] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t17;
  } else {
    // t17从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[16];
  }
  // t18暂存 `<T1 flexDirection={t6} gap={t7} paddingTop={t8}>{t9}{t13}...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== T1 || $[18] !== t13 || $[19] !== t16 || $[20] !== t17 || $[21] !== t9) {
    // t18暂存 `<T1 flexDirection={t6} gap={t7} paddingTop={t8}>{t9}{t13}...` 生成的渲染片段，后续返回路径直接复用。
    t18 = <T1 flexDirection={t6} gap={t7} paddingTop={t8}>{t9}{t13}{t14}{t16}{t17}</T1>;
    // $[17] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = T1;
    // $[18] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t13;
    // $[19] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t16;
    // $[20] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t17;
    // $[21] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t9;
    // $[22] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t18;
  } else {
    // t18从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[22];
  }
  // t19暂存 `<T0 color={t3} titleColor={t4} title={t5}>{t18}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== T0 || $[24] !== t18) {
    // t19暂存 `<T0 color={t3} titleColor={t4} title={t5}>{t18}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t19 = <T0 color={t3} titleColor={t4} title={t5}>{t18}</T0>;
    // $[23] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = T0;
    // $[24] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t18;
    // $[25] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t19;
  } else {
    // t19从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[25];
  }
  // 返回 t19，把终端渲染这个分支的结果交还调用方。
  return t19;
}
// _temp 承担终端渲染中的独立步骤，串起终端 UI 组件 Managed Settings Security Dialog需要的输入整理、状态更新和结果输出。
function _temp(item, index) {
  // 返回 <Box key={index} paddingLeft={2}><Text><Text dimColor={true}>· </Text><Text>{item}</Text></Tex…，把终端渲染这个分支的结果交还调用方。
  return <Box key={index} paddingLeft={2}><Text><Text dimColor={true}>· </Text><Text>{item}</Text></Text></Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiU2V0dGluZ3NKc29uIiwiU2VsZWN0IiwiUGVybWlzc2lvbkRpYWxvZyIsImV4dHJhY3REYW5nZXJvdXNTZXR0aW5ncyIsImZvcm1hdERhbmdlcm91c1NldHRpbmdzTGlzdCIsIlByb3BzIiwic2V0dGluZ3MiLCJvbkFjY2VwdCIsIm9uUmVqZWN0IiwiTWFuYWdlZFNldHRpbmdzU2VjdXJpdHlEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsImRhbmdlcm91cyIsInNldHRpbmdzTGlzdCIsImV4aXRTdGF0ZSIsInQxIiwiU3ltYm9sIiwiZm9yIiwiY29udGV4dCIsInQyIiwib25DaGFuZ2UiLCJ2YWx1ZSIsIlQwIiwidDMiLCJ0NCIsInQ1IiwiVDEiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsIlQyIiwidDEwIiwidDExIiwidDEyIiwibWFwIiwiX3RlbXAiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJsYWJlbCIsInQxNiIsInZhbHVlXzAiLCJ0MTciLCJrZXlOYW1lIiwicGVuZGluZyIsInQxOCIsInQxOSIsIml0ZW0iLCJpbmRleCJdLCJzb3VyY2VzIjpbIk1hbmFnZWRTZXR0aW5nc1NlY3VyaXR5RGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NKc29uIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3MvdHlwZXMuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi4vcGVybWlzc2lvbnMvUGVybWlzc2lvbkRpYWxvZy5qcydcbmltcG9ydCB7XG4gIGV4dHJhY3REYW5nZXJvdXNTZXR0aW5ncyxcbiAgZm9ybWF0RGFuZ2Vyb3VzU2V0dGluZ3NMaXN0LFxufSBmcm9tICcuL3V0aWxzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzZXR0aW5nczogU2V0dGluZ3NKc29uXG4gIG9uQWNjZXB0OiAoKSA9PiB2b2lkXG4gIG9uUmVqZWN0OiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBNYW5hZ2VkU2V0dGluZ3NTZWN1cml0eURpYWxvZyh7XG4gIHNldHRpbmdzLFxuICBvbkFjY2VwdCxcbiAgb25SZWplY3QsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGRhbmdlcm91cyA9IGV4dHJhY3REYW5nZXJvdXNTZXR0aW5ncyhzZXR0aW5ncylcbiAgY29uc3Qgc2V0dGluZ3NMaXN0ID0gZm9ybWF0RGFuZ2Vyb3VzU2V0dGluZ3NMaXN0KGRhbmdlcm91cylcblxuICBjb25zdCBleGl0U3RhdGUgPSB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuXG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBvblJlamVjdCwgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyB9KVxuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKHZhbHVlOiAnYWNjZXB0JyB8ICdleGl0Jyk6IHZvaWQge1xuICAgIGlmICh2YWx1ZSA9PT0gJ2V4aXQnKSB7XG4gICAgICBvblJlamVjdCgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgb25BY2NlcHQoKVxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8UGVybWlzc2lvbkRpYWxvZ1xuICAgICAgY29sb3I9XCJ3YXJuaW5nXCJcbiAgICAgIHRpdGxlQ29sb3I9XCJ3YXJuaW5nXCJcbiAgICAgIHRpdGxlPVwiTWFuYWdlZCBzZXR0aW5ncyByZXF1aXJlIGFwcHJvdmFsXCJcbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9IHBhZGRpbmdUb3A9ezF9PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBZb3VyIG9yZ2FuaXphdGlvbiBoYXMgY29uZmlndXJlZCBtYW5hZ2VkIHNldHRpbmdzIHRoYXQgY291bGQgYWxsb3dcbiAgICAgICAgICBleGVjdXRpb24gb2YgYXJiaXRyYXJ5IGNvZGUgb3IgaW50ZXJjZXB0aW9uIG9mIHlvdXIgcHJvbXB0cyBhbmRcbiAgICAgICAgICByZXNwb25zZXMuXG4gICAgICAgIDwvVGV4dD5cblxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5TZXR0aW5ncyByZXF1aXJpbmcgYXBwcm92YWw6PC9UZXh0PlxuICAgICAgICAgIHtzZXR0aW5nc0xpc3QubWFwKChpdGVtLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgPEJveCBrZXk9e2luZGV4fSBwYWRkaW5nTGVmdD17Mn0+XG4gICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPsK3IDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dD57aXRlbX08L1RleHQ+XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICkpfVxuICAgICAgICA8L0JveD5cblxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBPbmx5IGFjY2VwdCBpZiB5b3UgdHJ1c3QgeW91ciBvcmdhbml6YXRpb24mYXBvcztzIElUIGFkbWluaXN0cmF0aW9uXG4gICAgICAgICAgYW5kIGV4cGVjdCB0aGVzZSBzZXR0aW5ncyB0byBiZSBjb25maWd1cmVkLlxuICAgICAgICA8L1RleHQ+XG5cbiAgICAgICAgPFNlbGVjdFxuICAgICAgICAgIG9wdGlvbnM9e1tcbiAgICAgICAgICAgIHsgbGFiZWw6ICdZZXMsIEkgdHJ1c3QgdGhlc2Ugc2V0dGluZ3MnLCB2YWx1ZTogJ2FjY2VwdCcgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6ICdObywgZXhpdCBDbGF1ZGUgQ29kZScsIHZhbHVlOiAnZXhpdCcgfSxcbiAgICAgICAgICBdfVxuICAgICAgICAgIG9uQ2hhbmdlPXt2YWx1ZSA9PiBvbkNoYW5nZSh2YWx1ZSBhcyAnYWNjZXB0JyB8ICdleGl0Jyl9XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IG9uQ2hhbmdlKCdleGl0Jyl9XG4gICAgICAgIC8+XG5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAge2V4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgICAgICAgICAgPD5QcmVzcyB7ZXhpdFN0YXRlLmtleU5hbWV9IGFnYWluIHRvIGV4aXQ8Lz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPD5FbnRlciB0byBjb25maXJtIMK3IEVzYyB0byBleGl0PC8+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9QZXJtaXNzaW9uRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyw4QkFBOEIsUUFBUSwrQ0FBK0M7QUFDOUYsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ2xFLGNBQWNDLFlBQVksUUFBUSwrQkFBK0I7QUFDakUsU0FBU0MsTUFBTSxRQUFRLDBCQUEwQjtBQUNqRCxTQUFTQyxnQkFBZ0IsUUFBUSxvQ0FBb0M7QUFDckUsU0FDRUMsd0JBQXdCLEVBQ3hCQywyQkFBMkIsUUFDdEIsWUFBWTtBQUVuQixLQUFLQyxLQUFLLEdBQUc7RUFDWEMsUUFBUSxFQUFFTixZQUFZO0VB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