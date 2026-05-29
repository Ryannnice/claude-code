// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 复用 TextInput 终端界面组件，避免在这里重复拼装显示逻辑。
import TextInput from '../../../components/TextInput.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 useTerminalSize，将 ../../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
// 引入 Box、Newline、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Newline, Text } from '../../../ink.js';
// 引入 useKeybinding，将 ../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../keybindings/useKeybinding.js';
// 接入 BashTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BashTool } from '../../../tools/BashTool/BashTool.js';
// 接入 WebFetchTool 工具实现，后续工具池会按权限和开关决定是否暴露。
import { WebFetchTool } from '../../../tools/WebFetchTool/WebFetchTool.js';
// 类型依赖 { PermissionBehavior, PermissionRuleValue } 来自 ../../../utils/permissions/PermissionRule.js，用于校准终端渲染的数据契约。
import type { PermissionBehavior, PermissionRuleValue } from '../../../utils/permissions/PermissionRule.js';
// 复用 permissionRuleValueFromString、permissionRuleValueToString 工具函数，把通用处理留在 ../../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueFromString, permissionRuleValueToString } from '../../../utils/permissions/permissionRuleParser.js';
// PermissionRuleInputProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type PermissionRuleInputProps = {
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  // 这个回调绑定到 onSubmit: (ruleValue: PermissionRuleValue, ruleBehavior: PermissionBehavior) => void;，负责终端渲染在该局部场景下的响应。
  onSubmit: (ruleValue: PermissionRuleValue, ruleBehavior: PermissionBehavior) => void;
  ruleBehavior: PermissionBehavior;
};
// PermissionRuleInput 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionRuleInput(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(24);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onCancel,
    onSubmit,
    ruleBehavior
  } = t0;
  // inputValue 由 React state 持有，setInputValue 会在用户操作或异步结果返回时触发刷新。
  const [inputValue, setInputValue] = useState("");
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(0);
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      context: "Settings"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t1);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // textInputColumns 集合保存`columns - 6`，供后续判断或组装使用。
  const textInputColumns = columns - 6;
  // t2 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onSubmit || $[2] !== ruleBehavior) {
    // t2 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = value => {
      // trimmedValue格式化`value.trim`，供终端渲染后续处理使用。
      const trimmedValue = value.trim();
      // trimmedValue为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
      if (trimmedValue.length === 0) {
        // 权限确认界面 Permission Rule Input在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // ruleValue保存`permissionRuleValueFromString`，供终端渲染后续处理使用。
      const ruleValue = permissionRuleValueFromString(trimmedValue);
      // 调用 onSubmit，触发终端渲染此处需要的副作用。
      onSubmit(ruleValue, ruleBehavior);
    };
    // $[1] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onSubmit;
    // $[2] 缓存 `ruleBehavior`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = ruleBehavior;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // handleSubmit沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSubmit = t2;
  // t3 暂存 `<Text bold={true} color="permission">Add {ruleBehavior} p...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== ruleBehavior) {
    // t3 暂存 `<Text bold={true} color="permission">Add {ruleBehavior} p...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true} color="permission">Add {ruleBehavior} permission rule</Text>;
    // $[4] 缓存 `ruleBehavior`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = ruleBehavior;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `<Newline />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Newline />` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Newline />;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Text bold={true}>{permissionRuleValueToString({` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `<Text bold={false}> or </Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text bold={true}>{permissionRuleValueToString({` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text bold={true}>{permissionRuleValueToString({
        toolName: WebFetchTool.name
      })}</Text>;
    // t6 暂存 `<Text bold={false}> or </Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text bold={false}> or </Text>;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `<Text>Permission rules are a tool name, optionally follow...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `<Text>Permission rules are a tool name, optionally follow...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text>Permission rules are a tool name, optionally followed by a specifier in parentheses.{t4}e.g.,{" "}{t5}{t6}<Text bold={true}>{permissionRuleValueToString({
          toolName: BashTool.name,
          ruleContent: "ls:*"
        })}</Text></Text>;
    // $[9] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[9];
  }
  // t8 暂存 `<Box flexDirection="column">{t7}<Box borderDimColor={true...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== cursorOffset || $[11] !== handleSubmit || $[12] !== inputValue || $[13] !== textInputColumns) {
    // t8 暂存 `<Box flexDirection="column">{t7}<Box borderDimColor={true...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box flexDirection="column">{t7}<Box borderDimColor={true} borderStyle="round" marginY={1} paddingLeft={1}><TextInput showCursor={true} value={inputValue} onChange={setInputValue} onSubmit={handleSubmit} placeholder={`Enter permission rule${figures.ellipsis}`} columns={textInputColumns} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} /></Box></Box>;
    // $[10] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = cursorOffset;
    // $[11] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = handleSubmit;
    // $[12] 缓存 `inputValue`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = inputValue;
    // $[13] 缓存 `textInputColumns`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = textInputColumns;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // t9 暂存 `<Box flexDirection="column" gap={1} borderStyle="round" p...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== t3 || $[16] !== t8) {
    // t9 暂存 `<Box flexDirection="column" gap={1} borderStyle="round" p...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" gap={1} borderStyle="round" paddingLeft={1} paddingRight={1} borderColor="permission">{t3}{t8}</Box>;
    // $[15] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t3;
    // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t8;
    // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[17];
  }
  // t10 暂存 `<Box marginLeft={3}>{exitState.pending ? <Text dimColor={...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== exitState.keyName || $[19] !== exitState.pending) {
    // t10 暂存 `<Box marginLeft={3}>{exitState.pending ? <Text dimColor={...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box marginLeft={3}>{exitState.pending ? <Text dimColor={true}>Press {exitState.keyName} again to exit</Text> : <Text dimColor={true}>Enter to submit · Esc to cancel</Text>}</Box>;
    // $[18] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = exitState.keyName;
    // $[19] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = exitState.pending;
    // $[20] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[20];
  }
  // t11 暂存 `<>{t9}{t10}</>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t10 || $[22] !== t9) {
    // t11 暂存 `<>{t9}{t10}</>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <>{t9}{t10}</>;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
    // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[23];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VTdGF0ZSIsIlRleHRJbnB1dCIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsInVzZVRlcm1pbmFsU2l6ZSIsIkJveCIsIk5ld2xpbmUiLCJUZXh0IiwidXNlS2V5YmluZGluZyIsIkJhc2hUb29sIiwiV2ViRmV0Y2hUb29sIiwiUGVybWlzc2lvbkJlaGF2aW9yIiwiUGVybWlzc2lvblJ1bGVWYWx1ZSIsInBlcm1pc3Npb25SdWxlVmFsdWVGcm9tU3RyaW5nIiwicGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nIiwiUGVybWlzc2lvblJ1bGVJbnB1dFByb3BzIiwib25DYW5jZWwiLCJvblN1Ym1pdCIsInJ1bGVWYWx1ZSIsInJ1bGVCZWhhdmlvciIsIlBlcm1pc3Npb25SdWxlSW5wdXQiLCJ0MCIsIiQiLCJfYyIsImlucHV0VmFsdWUiLCJzZXRJbnB1dFZhbHVlIiwiY3Vyc29yT2Zmc2V0Iiwic2V0Q3Vyc29yT2Zmc2V0IiwiZXhpdFN0YXRlIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwiY29sdW1ucyIsInRleHRJbnB1dENvbHVtbnMiLCJ0MiIsInZhbHVlIiwidHJpbW1lZFZhbHVlIiwidHJpbSIsImxlbmd0aCIsImhhbmRsZVN1Ym1pdCIsInQzIiwidDQiLCJ0NSIsInQ2IiwidG9vbE5hbWUiLCJuYW1lIiwidDciLCJydWxlQ29udGVudCIsInQ4IiwiZWxsaXBzaXMiLCJ0OSIsInQxMCIsImtleU5hbWUiLCJwZW5kaW5nIiwidDExIl0sInNvdXJjZXMiOlsiUGVybWlzc2lvblJ1bGVJbnB1dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCBUZXh0SW5wdXQgZnJvbSAnLi4vLi4vLi4vY29tcG9uZW50cy9UZXh0SW5wdXQuanMnXG5pbXBvcnQgeyB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi8uLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBCb3gsIE5ld2xpbmUsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IEJhc2hUb29sIH0gZnJvbSAnLi4vLi4vLi4vdG9vbHMvQmFzaFRvb2wvQmFzaFRvb2wuanMnXG5pbXBvcnQgeyBXZWJGZXRjaFRvb2wgfSBmcm9tICcuLi8uLi8uLi90b29scy9XZWJGZXRjaFRvb2wvV2ViRmV0Y2hUb29sLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBQZXJtaXNzaW9uQmVoYXZpb3IsXG4gIFBlcm1pc3Npb25SdWxlVmFsdWUsXG59IGZyb20gJy4uLy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25SdWxlLmpzJ1xuaW1wb3J0IHtcbiAgcGVybWlzc2lvblJ1bGVWYWx1ZUZyb21TdHJpbmcsXG4gIHBlcm1pc3Npb25SdWxlVmFsdWVUb1N0cmluZyxcbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvcGVybWlzc2lvblJ1bGVQYXJzZXIuanMnXG5cbmV4cG9ydCB0eXBlIFBlcm1pc3Npb25SdWxlSW5wdXRQcm9wcyA9IHtcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgb25TdWJtaXQ6IChcbiAgICBydWxlVmFsdWU6IFBlcm1pc3Npb25SdWxlVmFsdWUsXG4gICAgcnVsZUJlaGF2aW9yOiBQZXJtaXNzaW9uQmVoYXZpb3IsXG4gICkgPT4gdm9pZFxuICBydWxlQmVoYXZpb3I6IFBlcm1pc3Npb25CZWhhdmlvclxufVxuXG5leHBvcnQgZnVuY3Rpb24gUGVybWlzc2lvblJ1bGVJbnB1dCh7XG4gIG9uQ2FuY2VsLFxuICBvblN1Ym1pdCxcbiAgcnVsZUJlaGF2aW9yLFxufTogUGVybWlzc2lvblJ1bGVJbnB1dFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW2lucHV0VmFsdWUsIHNldElucHV0VmFsdWVdID0gdXNlU3RhdGUoJycpXG4gIGNvbnN0IFtjdXJzb3JPZmZzZXQsIHNldEN1cnNvck9mZnNldF0gPSB1c2VTdGF0ZSgwKVxuICBjb25zdCBleGl0U3RhdGUgPSB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuXG4gIC8vIFVzZSBjb25maWd1cmFibGUga2V5YmluZGluZyBmb3IgRVNDIHRvIGNhbmNlbFxuICAvLyBVc2UgU2V0dGluZ3MgY29udGV4dCBzbyAnbicga2V5IGRvZXNuJ3QgY2FuY2VsIChhbGxvd3MgdHlwaW5nICduJyBpbiBpbnB1dClcbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIG9uQ2FuY2VsLCB7IGNvbnRleHQ6ICdTZXR0aW5ncycgfSlcblxuICBjb25zdCB7IGNvbHVtbnMgfSA9IHVzZVRlcm1pbmFsU2l6ZSgpXG4gIGNvbnN0IHRleHRJbnB1dENvbHVtbnMgPSBjb2x1bW5zIC0gNlxuXG4gIGNvbnN0IGhhbmRsZVN1Ym1pdCA9ICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdHJpbW1lZFZhbHVlID0gdmFsdWUudHJpbSgpXG4gICAgaWYgKHRyaW1tZWRWYWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBydWxlVmFsdWUgPSBwZXJtaXNzaW9uUnVsZVZhbHVlRnJvbVN0cmluZyh0cmltbWVkVmFsdWUpXG4gICAgb25TdWJtaXQocnVsZVZhbHVlLCBydWxlQmVoYXZpb3IpXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8Qm94XG4gICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICBnYXA9ezF9XG4gICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICBwYWRkaW5nTGVmdD17MX1cbiAgICAgICAgcGFkZGluZ1JpZ2h0PXsxfVxuICAgICAgICBib3JkZXJDb2xvcj1cInBlcm1pc3Npb25cIlxuICAgICAgPlxuICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwicGVybWlzc2lvblwiPlxuICAgICAgICAgIEFkZCB7cnVsZUJlaGF2aW9yfSBwZXJtaXNzaW9uIHJ1bGVcbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIFBlcm1pc3Npb24gcnVsZXMgYXJlIGEgdG9vbCBuYW1lLCBvcHRpb25hbGx5IGZvbGxvd2VkIGJ5IGEgc3BlY2lmaWVyXG4gICAgICAgICAgICBpbiBwYXJlbnRoZXNlcy5cbiAgICAgICAgICAgIDxOZXdsaW5lIC8+XG4gICAgICAgICAgICBlLmcuLHsnICd9XG4gICAgICAgICAgICA8VGV4dCBib2xkPlxuICAgICAgICAgICAgICB7cGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKHsgdG9vbE5hbWU6IFdlYkZldGNoVG9vbC5uYW1lIH0pfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgYm9sZD17ZmFsc2V9PiBvciA8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBib2xkPlxuICAgICAgICAgICAgICB7cGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKHtcbiAgICAgICAgICAgICAgICB0b29sTmFtZTogQmFzaFRvb2wubmFtZSxcbiAgICAgICAgICAgICAgICBydWxlQ29udGVudDogJ2xzOionLFxuICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPEJveCBib3JkZXJEaW1Db2xvciBib3JkZXJTdHlsZT1cInJvdW5kXCIgbWFyZ2luWT17MX0gcGFkZGluZ0xlZnQ9ezF9PlxuICAgICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgICBzaG93Q3Vyc29yXG4gICAgICAgICAgICAgIHZhbHVlPXtpbnB1dFZhbHVlfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17c2V0SW5wdXRWYWx1ZX1cbiAgICAgICAgICAgICAgb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2BFbnRlciBwZXJtaXNzaW9uIHJ1bGUke2ZpZ3VyZXMuZWxsaXBzaXN9YH1cbiAgICAgICAgICAgICAgY29sdW1ucz17dGV4dElucHV0Q29sdW1uc31cbiAgICAgICAgICAgICAgY3Vyc29yT2Zmc2V0PXtjdXJzb3JPZmZzZXR9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlQ3Vyc29yT2Zmc2V0PXtzZXRDdXJzb3JPZmZzZXR9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvQm94PlxuICAgICAgPEJveCBtYXJnaW5MZWZ0PXszfT5cbiAgICAgICAge2V4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5FbnRlciB0byBzdWJtaXQgwrcgRXNjIHRvIGNhbmNlbDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFFBQVEsUUFBUSxPQUFPO0FBQ2hDLE9BQU9DLFNBQVMsTUFBTSxrQ0FBa0M7QUFDeEQsU0FBU0MsOEJBQThCLFFBQVEsa0RBQWtEO0FBQ2pH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