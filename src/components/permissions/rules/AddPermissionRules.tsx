// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback } from 'react';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from '../../../components/CustomSelect/select.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 类型依赖 { ToolPermissionContext } 来自 ../../../Tool.js，用于校准终端渲染的数据契约。
import type { ToolPermissionContext } from '../../../Tool.js';
// 类型依赖 { PermissionBehavior, PermissionRule, PermissionRuleValue } 来自 ../../../utils/permissions/PermissionRule.js，用于校准终端渲染的数据契约。
import type { PermissionBehavior, PermissionRule, PermissionRuleValue } from '../../../utils/permissions/PermissionRule.js';
// 复用 applyPermissionUpdate、persistPermissionUpdate 工具函数，把通用处理留在 ../../../utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate, persistPermissionUpdate } from '../../../utils/permissions/PermissionUpdate.js';
// 复用 permissionRuleValueToString 工具函数，把通用处理留在 ../../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueToString } from '../../../utils/permissions/permissionRuleParser.js';
// 复用 detectUnreachableRules、UnreachableRule 工具函数，把通用处理留在 ../../../utils/permissions/shadowedRuleDetection.js 中维护。
import { detectUnreachableRules, type UnreachableRule } from '../../../utils/permissions/shadowedRuleDetection.js';
// 复用 SandboxManager 工具函数，把通用处理留在 ../../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../../utils/sandbox/sandbox-adapter.js';
// 复用 EditableSettingSource、SOURCES 工具函数，把通用处理留在 ../../../utils/settings/constants.js 中维护。
import { type EditableSettingSource, SOURCES } from '../../../utils/settings/constants.js';
// 复用 getRelativeSettingsFilePathForSource 工具函数，把通用处理留在 ../../../utils/settings/settings.js 中维护。
import { getRelativeSettingsFilePathForSource } from '../../../utils/settings/settings.js';
// 复用 plural 工具函数，把通用处理留在 ../../../utils/stringUtils.js 中维护。
import { plural } from '../../../utils/stringUtils.js';
// 类型依赖 { OptionWithDescription } 来自 ../../CustomSelect/select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from '../../CustomSelect/select.js';
// 引入 Dialog，将 ../../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../../design-system/Dialog.js';
// 引入 PermissionRuleDescription，将 ./PermissionRuleDescription.js 中已经封装好的能力接到本文件流程里。
import { PermissionRuleDescription } from './PermissionRuleDescription.js';
// optionForPermissionSaveDestination 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function optionForPermissionSaveDestination(saveDestination: EditableSettingSource): OptionWithDescription {
  // 按照 saveDestination 的取值选择终端渲染的具体处理分支。
  switch (saveDestination) {
    case 'localSettings':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        label: 'Project settings (local)',
        description: `Saved in ${getRelativeSettingsFilePathForSource('localSettings')}`,
        value: saveDestination
      };
    case 'projectSettings':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        label: 'Project settings',
        description: `Checked in at ${getRelativeSettingsFilePathForSource('projectSettings')}`,
        value: saveDestination
      };
    case 'userSettings':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        label: 'User settings',
        description: `Saved in at ~/.claude/settings.json`,
        value: saveDestination
      };
  }
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onAddRules: (rules: PermissionRule[], unreachable?: UnreachableRule[]) => void;，负责终端渲染在该局部场景下的响应。
  onAddRules: (rules: PermissionRule[], unreachable?: UnreachableRule[]) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  ruleValues: PermissionRuleValue[];
  ruleBehavior: PermissionBehavior;
  initialContext: ToolPermissionContext;
  // 这个回调绑定到 setToolPermissionContext: (newContext: ToolPermissionContext) => void;，负责终端渲染在该局部场景下的响应。
  setToolPermissionContext: (newContext: ToolPermissionContext) => void;
};
// AddPermissionRules 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AddPermissionRules(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onAddRules,
    onCancel,
    ruleValues,
    ruleBehavior,
    initialContext,
    setToolPermissionContext
  } = t0;
  // t1 暂存 `SOURCES.map(optionForPermissionSaveDestination)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `SOURCES.map(optionForPermissionSaveDestination)` 生成的渲染片段，后续返回路径直接复用。
    t1 = SOURCES.map(optionForPermissionSaveDestination);
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // allOptions 集合 命名 `t1`，让后续代码直接表达这个值的用途。
  const allOptions = t1;
  // t2 暂存 `selectedValue => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== initialContext || $[2] !== onAddRules || $[3] !== onCancel || $[4] !== ruleBehavior || $[5] !== ruleValues || $[6] !== setToolPermissionContext) {
    // t2 暂存 `selectedValue => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = selectedValue => {
      // 当 `selectedValue` 匹配 `"cancel"` 时，终端渲染执行对应分支。
      if (selectedValue === "cancel") {
        // 调用 onCancel，触发终端渲染此处需要的副作用。
        onCancel();
        // 权限确认界面 Add Permission Rules在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      } else {
        // 满足 `(SOURCES as readonly string[]).includes(selectedValue)` 时，终端渲染执行该分支。
        if ((SOURCES as readonly string[]).includes(selectedValue)) {
          // destination保存`selectedValue as EditableSettingSource`，供后续判断或组装使用。
          const destination = selectedValue as EditableSettingSource;
          // updatedContext保存`applyPermissionUpdate`，供终端渲染后续处理使用。
          const updatedContext = applyPermissionUpdate(initialContext, {
            type: "addRules",
            rules: ruleValues,
            behavior: ruleBehavior,
            destination
          });
          // 调用 persistPermissionUpdate，触发终端渲染此处需要的副作用。
          persistPermissionUpdate({
            type: "addRules",
            rules: ruleValues,
            behavior: ruleBehavior,
            destination
          });
          // setToolPermissionContext 写入新的状态值，使终端渲染后续读取保持一致。
          setToolPermissionContext(updatedContext);
          // rules 集合派生`ruleValues.map`，供终端渲染后续处理使用。
          const rules = ruleValues.map(ruleValue => ({
            ruleValue,
            ruleBehavior,
            source: destination
          }));
          // sandboxAutoAllowEnabled保存`SandboxManager.isSandboxingEnabled`，供终端渲染后续处理使用。
          const sandboxAutoAllowEnabled = SandboxManager.isSandboxingEnabled() && SandboxManager.isAutoAllowBashIfSandboxedEnabled();
          // allUnreachable读取`detectUnreachableRules`，供终端渲染后续处理使用。
          const allUnreachable = detectUnreachableRules(updatedContext, {
            sandboxAutoAllowEnabled
          });
          // newUnreachable筛选`allUnreachable.filter`，供终端渲染后续处理使用。
          const newUnreachable = allUnreachable.filter(u => ruleValues.some(rv => rv.toolName === u.rule.ruleValue.toolName && rv.ruleContent === u.rule.ruleValue.ruleContent));
          // 调用 onAddRules，触发终端渲染此处需要的副作用。
          onAddRules(rules, newUnreachable.length > 0 ? newUnreachable : undefined);
        }
      }
    };
    // $[1] 缓存 `initialContext`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = initialContext;
    // $[2] 缓存 `onAddRules`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onAddRules;
    // $[3] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onCancel;
    // $[4] 缓存 `ruleBehavior`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = ruleBehavior;
    // $[5] 缓存 `ruleValues`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = ruleValues;
    // $[6] 缓存 `setToolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = setToolPermissionContext;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
  }
  // onSelect 命名 `t2`，让后续代码直接表达这个值的用途。
  const onSelect = t2;
  // t3 暂存 `plural(ruleValues.length, "rule")` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== ruleValues.length) {
    // t3 暂存 `plural(ruleValues.length, "rule")` 生成的渲染片段，后续返回路径直接复用。
    t3 = plural(ruleValues.length, "rule");
    // $[8] 缓存 `ruleValues.length`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = ruleValues.length;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // title 标题保存``Add ${ruleBehavior} permission ${t3}``，作为后续固定文本处理的输入。
  const title = `Add ${ruleBehavior} permission ${t3}`;
  // t4 暂存 `ruleValues.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== ruleValues) {
    // t4 暂存 `ruleValues.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t4 = ruleValues.map(_temp);
    // $[10] 缓存 `ruleValues`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = ruleValues;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[11];
  }
  // t5 暂存 `<Box flexDirection="column" paddingX={2}>{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t4) {
    // t5 暂存 `<Box flexDirection="column" paddingX={2}>{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column" paddingX={2}>{t4}</Box>;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // t6标记终端渲染权限确认界面 Add Permission Rules是否启用对应路径。
  const t6 = ruleValues.length === 1 ? "Where should this rule be saved?" : "Where should these rules be saved?";
  // t7 暂存 `<Text>{t6}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t6) {
    // t7 暂存 `<Text>{t6}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text>{t6}</Text>;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Select options={allOptions} onChange={onSelect} />` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onSelect) {
    // t8 暂存 `<Select options={allOptions} onChange={onSelect} />` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Select options={allOptions} onChange={onSelect} />;
    // $[16] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onSelect;
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[17];
  }
  // t9 暂存 `<Box flexDirection="column" marginY={1}>{t7}{t8}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t7 || $[19] !== t8) {
    // t9 暂存 `<Box flexDirection="column" marginY={1}>{t7}{t8}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" marginY={1}>{t7}{t8}</Box>;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // t10 暂存 `<Dialog title={title} onCancel={onCancel} color="permissi...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== onCancel || $[22] !== t5 || $[23] !== t9 || $[24] !== title) {
    // t10 暂存 `<Dialog title={title} onCancel={onCancel} color="permissi...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Dialog title={title} onCancel={onCancel} color="permission">{t5}{t9}</Dialog>;
    // $[21] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = onCancel;
    // $[22] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t5;
    // $[23] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t9;
    // $[24] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = title;
    // $[25] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[25];
  }
  // 返回 `t10`，作为终端渲染这次计算的结果。
  return t10;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(ruleValue_0) {
  // 返回 `<Box flexDirection="column" key={permissionRuleValueToString(ruleValue_...`，作为终端渲染这次计算的结果。
  return <Box flexDirection="column" key={permissionRuleValueToString(ruleValue_0)}><Text bold={true}>{permissionRuleValueToString(ruleValue_0)}</Text><PermissionRuleDescription ruleValue={ruleValue_0} /></Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwiU2VsZWN0IiwiQm94IiwiVGV4dCIsIlRvb2xQZXJtaXNzaW9uQ29udGV4dCIsIlBlcm1pc3Npb25CZWhhdmlvciIsIlBlcm1pc3Npb25SdWxlIiwiUGVybWlzc2lvblJ1bGVWYWx1ZSIsImFwcGx5UGVybWlzc2lvblVwZGF0ZSIsInBlcnNpc3RQZXJtaXNzaW9uVXBkYXRlIiwicGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nIiwiZGV0ZWN0VW5yZWFjaGFibGVSdWxlcyIsIlVucmVhY2hhYmxlUnVsZSIsIlNhbmRib3hNYW5hZ2VyIiwiRWRpdGFibGVTZXR0aW5nU291cmNlIiwiU09VUkNFUyIsImdldFJlbGF0aXZlU2V0dGluZ3NGaWxlUGF0aEZvclNvdXJjZSIsInBsdXJhbCIsIk9wdGlvbldpdGhEZXNjcmlwdGlvbiIsIkRpYWxvZyIsIlBlcm1pc3Npb25SdWxlRGVzY3JpcHRpb24iLCJvcHRpb25Gb3JQZXJtaXNzaW9uU2F2ZURlc3RpbmF0aW9uIiwic2F2ZURlc3RpbmF0aW9uIiwibGFiZWwiLCJkZXNjcmlwdGlvbiIsInZhbHVlIiwiUHJvcHMiLCJvbkFkZFJ1bGVzIiwicnVsZXMiLCJ1bnJlYWNoYWJsZSIsIm9uQ2FuY2VsIiwicnVsZVZhbHVlcyIsInJ1bGVCZWhhdmlvciIsImluaXRpYWxDb250ZXh0Iiwic2V0VG9vbFBlcm1pc3Npb25Db250ZXh0IiwibmV3Q29udGV4dCIsIkFkZFBlcm1pc3Npb25SdWxlcyIsInQwIiwiJCIsIl9jIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJtYXAiLCJhbGxPcHRpb25zIiwidDIiLCJzZWxlY3RlZFZhbHVlIiwiaW5jbHVkZXMiLCJkZXN0aW5hdGlvbiIsInVwZGF0ZWRDb250ZXh0IiwidHlwZSIsImJlaGF2aW9yIiwicnVsZVZhbHVlIiwic291cmNlIiwic2FuZGJveEF1dG9BbGxvd0VuYWJsZWQiLCJpc1NhbmRib3hpbmdFbmFibGVkIiwiaXNBdXRvQWxsb3dCYXNoSWZTYW5kYm94ZWRFbmFibGVkIiwiYWxsVW5yZWFjaGFibGUiLCJuZXdVbnJlYWNoYWJsZSIsImZpbHRlciIsInUiLCJzb21lIiwicnYiLCJ0b29sTmFtZSIsInJ1bGUiLCJydWxlQ29udGVudCIsImxlbmd0aCIsInVuZGVmaW5lZCIsIm9uU2VsZWN0IiwidDMiLCJ0aXRsZSIsInQ0IiwiX3RlbXAiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5IiwidDEwIiwicnVsZVZhbHVlXzAiXSwic291cmNlcyI6WyJBZGRQZXJtaXNzaW9uUnVsZXMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uLy4uLy4uL2NvbXBvbmVudHMvQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB0eXBlIHsgVG9vbFBlcm1pc3Npb25Db250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vVG9vbC5qcydcbmltcG9ydCB0eXBlIHtcbiAgUGVybWlzc2lvbkJlaGF2aW9yLFxuICBQZXJtaXNzaW9uUnVsZSxcbiAgUGVybWlzc2lvblJ1bGVWYWx1ZSxcbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblJ1bGUuanMnXG5pbXBvcnQge1xuICBhcHBseVBlcm1pc3Npb25VcGRhdGUsXG4gIHBlcnNpc3RQZXJtaXNzaW9uVXBkYXRlLFxufSBmcm9tICcuLi8uLi8uLi91dGlscy9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uVXBkYXRlLmpzJ1xuaW1wb3J0IHsgcGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvcGVybWlzc2lvblJ1bGVQYXJzZXIuanMnXG5pbXBvcnQge1xuICBkZXRlY3RVbnJlYWNoYWJsZVJ1bGVzLFxuICB0eXBlIFVucmVhY2hhYmxlUnVsZSxcbn0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvc2hhZG93ZWRSdWxlRGV0ZWN0aW9uLmpzJ1xuaW1wb3J0IHsgU2FuZGJveE1hbmFnZXIgfSBmcm9tICcuLi8uLi8uLi91dGlscy9zYW5kYm94L3NhbmRib3gtYWRhcHRlci5qcydcbmltcG9ydCB7XG4gIHR5cGUgRWRpdGFibGVTZXR0aW5nU291cmNlLFxuICBTT1VSQ0VTLFxufSBmcm9tICcuLi8uLi8uLi91dGlscy9zZXR0aW5ncy9jb25zdGFudHMuanMnXG5pbXBvcnQgeyBnZXRSZWxhdGl2ZVNldHRpbmdzRmlsZVBhdGhGb3JTb3VyY2UgfSBmcm9tICcuLi8uLi8uLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB7IHBsdXJhbCB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuaW1wb3J0IHR5cGUgeyBPcHRpb25XaXRoRGVzY3JpcHRpb24gfSBmcm9tICcuLi8uLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vLi4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uUnVsZURlc2NyaXB0aW9uIH0gZnJvbSAnLi9QZXJtaXNzaW9uUnVsZURlc2NyaXB0aW9uLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gb3B0aW9uRm9yUGVybWlzc2lvblNhdmVEZXN0aW5hdGlvbihcbiAgc2F2ZURlc3RpbmF0aW9uOiBFZGl0YWJsZVNldHRpbmdTb3VyY2UsXG4pOiBPcHRpb25XaXRoRGVzY3JpcHRpb24ge1xuICBzd2l0Y2ggKHNhdmVEZXN0aW5hdGlvbikge1xuICAgIGNhc2UgJ2xvY2FsU2V0dGluZ3MnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6ICdQcm9qZWN0IHNldHRpbmdzIChsb2NhbCknLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFNhdmVkIGluICR7Z2V0UmVsYXRpdmVTZXR0aW5nc0ZpbGVQYXRoRm9yU291cmNlKCdsb2NhbFNldHRpbmdzJyl9YCxcbiAgICAgICAgdmFsdWU6IHNhdmVEZXN0aW5hdGlvbixcbiAgICAgIH1cbiAgICBjYXNlICdwcm9qZWN0U2V0dGluZ3MnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6ICdQcm9qZWN0IHNldHRpbmdzJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBDaGVja2VkIGluIGF0ICR7Z2V0UmVsYXRpdmVTZXR0aW5nc0ZpbGVQYXRoRm9yU291cmNlKCdwcm9qZWN0U2V0dGluZ3MnKX1gLFxuICAgICAgICB2YWx1ZTogc2F2ZURlc3RpbmF0aW9uLFxuICAgICAgfVxuICAgIGNhc2UgJ3VzZXJTZXR0aW5ncyc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogJ1VzZXIgc2V0dGluZ3MnLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFNhdmVkIGluIGF0IH4vLmNsYXVkZS9zZXR0aW5ncy5qc29uYCxcbiAgICAgICAgdmFsdWU6IHNhdmVEZXN0aW5hdGlvbixcbiAgICAgIH1cbiAgfVxufVxuXG50eXBlIFByb3BzID0ge1xuICBvbkFkZFJ1bGVzOiAocnVsZXM6IFBlcm1pc3Npb25SdWxlW10sIHVucmVhY2hhYmxlPzogVW5yZWFjaGFibGVSdWxlW10pID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgcnVsZVZhbHVlczogUGVybWlzc2lvblJ1bGVWYWx1ZVtdXG4gIHJ1bGVCZWhhdmlvcjogUGVybWlzc2lvbkJlaGF2aW9yXG4gIGluaXRpYWxDb250ZXh0OiBUb29sUGVybWlzc2lvbkNvbnRleHRcbiAgc2V0VG9vbFBlcm1pc3Npb25Db250ZXh0OiAobmV3Q29udGV4dDogVG9vbFBlcm1pc3Npb25Db250ZXh0KSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBBZGRQZXJtaXNzaW9uUnVsZXMoe1xuICBvbkFkZFJ1bGVzLFxuICBvbkNhbmNlbCxcbiAgcnVsZVZhbHVlcyxcbiAgcnVsZUJlaGF2aW9yLFxuICBpbml0aWFsQ29udGV4dCxcbiAgc2V0VG9vbFBlcm1pc3Npb25Db250ZXh0LFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBhbGxPcHRpb25zID0gU09VUkNFUy5tYXAob3B0aW9uRm9yUGVybWlzc2lvblNhdmVEZXN0aW5hdGlvbilcblxuICBjb25zdCBvblNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgIChzZWxlY3RlZFZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChzZWxlY3RlZFZhbHVlID09PSAnY2FuY2VsJykge1xuICAgICAgICBvbkNhbmNlbCgpXG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIGlmICgoU09VUkNFUyBhcyByZWFkb25seSBzdHJpbmdbXSkuaW5jbHVkZXMoc2VsZWN0ZWRWYWx1ZSkpIHtcbiAgICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBzZWxlY3RlZFZhbHVlIGFzIEVkaXRhYmxlU2V0dGluZ1NvdXJjZVxuXG4gICAgICAgIGNvbnN0IHVwZGF0ZWRDb250ZXh0ID0gYXBwbHlQZXJtaXNzaW9uVXBkYXRlKGluaXRpYWxDb250ZXh0LCB7XG4gICAgICAgICAgdHlwZTogJ2FkZFJ1bGVzJyxcbiAgICAgICAgICBydWxlczogcnVsZVZhbHVlcyxcbiAgICAgICAgICBiZWhhdmlvcjogcnVsZUJlaGF2aW9yLFxuICAgICAgICAgIGRlc3RpbmF0aW9uLFxuICAgICAgICB9KVxuXG4gICAgICAgIC8vIFBlcnNpc3QgdG8gc2V0dGluZ3NcbiAgICAgICAgcGVyc2lzdFBlcm1pc3Npb25VcGRhdGUoe1xuICAgICAgICAgIHR5cGU6ICdhZGRSdWxlcycsXG4gICAgICAgICAgcnVsZXM6IHJ1bGVWYWx1ZXMsXG4gICAgICAgICAgYmVoYXZpb3I6IHJ1bGVCZWhhdmlvcixcbiAgICAgICAgICBkZXN0aW5hdGlvbixcbiAgICAgICAgfSlcblxuICAgICAgICBzZXRUb29sUGVybWlzc2lvbkNvbnRleHQodXBkYXRlZENvbnRleHQpXG5cbiAgICAgICAgY29uc3QgcnVsZXM6IFBlcm1pc3Npb25SdWxlW10gPSBydWxlVmFsdWVzLm1hcChydWxlVmFsdWUgPT4gKHtcbiAgICAgICAgICBydWxlVmFsdWUsXG4gICAgICAgICAgcnVsZUJlaGF2aW9yLFxuICAgICAgICAgIHNvdXJjZTogZGVzdGluYXRpb24sXG4gICAgICAgIH0pKVxuXG4gICAgICAgIC8vIENoZWNrIGZvciB1bnJlYWNoYWJsZSBydWxlcyBhbW9uZyB0aGUgb25lcyB3ZSBqdXN0IGFkZGVkXG4gICAgICAgIGNvbnN0IHNhbmRib3hBdXRvQWxsb3dFbmFibGVkID1cbiAgICAgICAgICBTYW5kYm94TWFuYWdlci5pc1NhbmRib3hpbmdFbmFibGVkKCkgJiZcbiAgICAgICAgICBTYW5kYm94TWFuYWdlci5pc0F1dG9BbGxvd0Jhc2hJZlNhbmRib3hlZEVuYWJsZWQoKVxuICAgICAgICBjb25zdCBhbGxVbnJlYWNoYWJsZSA9IGRldGVjdFVucmVhY2hhYmxlUnVsZXModXBkYXRlZENvbnRleHQsIHtcbiAgICAgICAgICBzYW5kYm94QXV0b0FsbG93RW5hYmxlZCxcbiAgICAgICAgfSlcblxuICAgICAgICAvLyBGaWx0ZXIgdG8gb25seSBydWxlcyB3ZSBqdXN0IGFkZGVkXG4gICAgICAgIGNvbnN0IG5ld1VucmVhY2hhYmxlID0gYWxsVW5yZWFjaGFibGUuZmlsdGVyKHUgPT5cbiAgICAgICAgICBydWxlVmFsdWVzLnNvbWUoXG4gICAgICAgICAgICBydiA9PlxuICAgICAgICAgICAgICBydi50b29sTmFtZSA9PT0gdS5ydWxlLnJ1bGVWYWx1ZS50b29sTmFtZSAmJlxuICAgICAgICAgICAgICBydi5ydWxlQ29udGVudCA9PT0gdS5ydWxlLnJ1bGVWYWx1ZS5ydWxlQ29udGVudCxcbiAgICAgICAgICApLFxuICAgICAgICApXG5cbiAgICAgICAgb25BZGRSdWxlcyhcbiAgICAgICAgICBydWxlcyxcbiAgICAgICAgICBuZXdVbnJlYWNoYWJsZS5sZW5ndGggPiAwID8gbmV3VW5yZWFjaGFibGUgOiB1bmRlZmluZWQsXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9LFxuICAgIFtcbiAgICAgIG9uQWRkUnVsZXMsXG4gICAgICBvbkNhbmNlbCxcbiAgICAgIHJ1bGVWYWx1ZXMsXG4gICAgICBydWxlQmVoYXZpb3IsXG4gICAgICBpbml0aWFsQ29udGV4dCxcbiAgICAgIHNldFRvb2xQZXJtaXNzaW9uQ29udGV4dCxcbiAgICBdLFxuICApXG5cbiAgY29uc3QgdGl0bGUgPSBgQWRkICR7cnVsZUJlaGF2aW9yfSBwZXJtaXNzaW9uICR7cGx1cmFsKHJ1bGVWYWx1ZXMubGVuZ3RoLCAncnVsZScpfWBcblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2cgdGl0bGU9e3RpdGxlfSBvbkNhbmNlbD17b25DYW5jZWx9IGNvbG9yPVwicGVybWlzc2lvblwiPlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1g9ezJ9PlxuICAgICAgICB7cnVsZVZhbHVlcy5tYXAocnVsZVZhbHVlID0+IChcbiAgICAgICAgICA8Qm94XG4gICAgICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgICAgIGtleT17cGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKHJ1bGVWYWx1ZSl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFRleHQgYm9sZD57cGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKHJ1bGVWYWx1ZSl9PC9UZXh0PlxuICAgICAgICAgICAgPFBlcm1pc3Npb25SdWxlRGVzY3JpcHRpb24gcnVsZVZhbHVlPXtydWxlVmFsdWV9IC8+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICkpfVxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblk9ezF9PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7cnVsZVZhbHVlcy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gJ1doZXJlIHNob3VsZCB0aGlzIHJ1bGUgYmUgc2F2ZWQ/J1xuICAgICAgICAgICAgOiAnV2hlcmUgc2hvdWxkIHRoZXNlIHJ1bGVzIGJlIHNhdmVkPyd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFNlbGVjdCBvcHRpb25zPXthbGxPcHRpb25zfSBvbkNoYW5nZT17b25TZWxlY3R9IC8+XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLFFBQVEsT0FBTztBQUNuQyxTQUFTQyxNQUFNLFFBQVEsNENBQTRDO0FBQ25FLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGlCQUFpQjtBQUMzQyxjQUFjQyxxQkFBcUIsUUFBUSxrQkFBa0I7QUFDN0QsY0FDRUMsa0JBQWtCLEVBQ2xCQyxjQUFjLEVBQ2RDLG1CQUFtQixRQUNkLDhDQUE4QztBQUNyRCxTQUNFQyxxQkFBcUIsRUFDckJDLHVCQUF1QixRQUNsQixnREFBZ0Q7QUFDdkQsU0FBU0MsMkJBQTJCLFFBQVEsb0RBQW9EO0FBQ2hHLFNBQ0VDLHNCQUFzQixFQUN0QixLQUFLQyxlQUFlLFFBQ2YscURBQXFEO0FBQzVELFNBQVNDLGNBQWMsUUFBUSwyQ0FBMkM7QUFDMUUsU0FDRSxLQUFLQyxxQkFBcUIsRUFDMUJDLE9BQU8sUUFDRixzQ0FBc0M7QUFDN0MsU0FBU0Msb0NBQW9DLFFBQVEscUNBQXFDO0FBQzFGLFNBQVNDLE1BQU0sUUFBUSwrQkFBK0I7QUFDdEQsY0FBY0MscUJBQXFCLFFBQVEsOEJBQThCO0FBQ3pFLFNBQVNDLE1BQU0sUUFBUSwrQkFBK0I7QUFDdEQsU0FBU0MseUJBQXlCLFFBQVEsZ0NBQWdDO0FBRTFFLE9BQU8sU0FBU0Msa0NBQWtDQSxDQUNoREMsZUFBZSxFQUFFUixxQkFBcUIsQ0FDdkMsRUFBRUkscUJBQXFCLENBQUM7RUFDdkIsUUFBUUksZUFBZTtJQUNyQixLQUFLLGVBQWU7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