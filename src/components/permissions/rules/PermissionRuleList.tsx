// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// 引入 useAppState、useSetAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from 'src/state/AppState.js';
// 复用 applyPermissionUpdate、persistPermissionUpdate 工具函数，把通用处理留在 src/utils/permissions/PermissionUpdate.js 中维护。
import { applyPermissionUpdate, persistPermissionUpdate } from 'src/utils/permissions/PermissionUpdate.js';
// 类型依赖 { PermissionUpdateDestination } 来自 src/utils/permissions/PermissionUpdateSchema.js，用于校准终端渲染的数据契约。
import type { PermissionUpdateDestination } from 'src/utils/permissions/PermissionUpdateSchema.js';
// 类型依赖 { CommandResultDisplay } 来自 ../../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../../commands.js';
// 复用 Select 终端界面组件，避免在这里重复拼装显示逻辑。
import { Select } from '../../../components/CustomSelect/select.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 useSearchInput，将 ../../../hooks/useSearchInput.js 中已经封装好的能力接到本文件流程里。
import { useSearchInput } from '../../../hooks/useSearchInput.js';
// 类型依赖 { KeyboardEvent } 来自 ../../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../../ink/events/keyboard-event.js';
// 引入 Box、Text、useTerminalFocus，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTerminalFocus } from '../../../ink.js';
// 引入 useKeybinding，将 ../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../keybindings/useKeybinding.js';
// 复用 AutoModeDenial、getAutoModeDenials 工具函数，把通用处理留在 ../../../utils/autoModeDenials.js 中维护。
import { type AutoModeDenial, getAutoModeDenials } from '../../../utils/autoModeDenials.js';
// 类型依赖 { PermissionBehavior, PermissionRule, PermissionRuleValue } 来自 ../../../utils/permissions/PermissionRule.js，用于校准终端渲染的数据契约。
import type { PermissionBehavior, PermissionRule, PermissionRuleValue } from '../../../utils/permissions/PermissionRule.js';
// 复用 permissionRuleValueToString 工具函数，把通用处理留在 ../../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueToString } from '../../../utils/permissions/permissionRuleParser.js';
// 复用 deletePermissionRule、getAllowRules、getAskRules、getDenyRules、permissionRuleSourceDisplayString 工具函数，把通用处理留在 ../../../utils/permissions/permissions.js 中维护。
import { deletePermissionRule, getAllowRules, getAskRules, getDenyRules, permissionRuleSourceDisplayString } from '../../../utils/permissions/permissions.js';
// 类型依赖 { UnreachableRule } 来自 ../../../utils/permissions/shadowedRuleDetection.js，用于校准终端渲染的数据契约。
import type { UnreachableRule } from '../../../utils/permissions/shadowedRuleDetection.js';
// 复用 jsonStringify 工具函数，把通用处理留在 ../../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../../utils/slowOperations.js';
// 引入 Pane，将 ../../design-system/Pane.js 中已经封装好的能力接到本文件流程里。
import { Pane } from '../../design-system/Pane.js';
// 引入 Tab、Tabs、useTabHeaderFocus、useTabsWidth，将 ../../design-system/Tabs.js 中已经封装好的能力接到本文件流程里。
import { Tab, Tabs, useTabHeaderFocus, useTabsWidth } from '../../design-system/Tabs.js';
// 引入 SearchBox，将 ../../SearchBox.js 中已经封装好的能力接到本文件流程里。
import { SearchBox } from '../../SearchBox.js';
// 类型依赖 { Option } 来自 ../../ui/option.js，用于校准终端渲染的数据契约。
import type { Option } from '../../ui/option.js';
// 引入 AddPermissionRules，将 ./AddPermissionRules.js 中已经封装好的能力接到本文件流程里。
import { AddPermissionRules } from './AddPermissionRules.js';
// 引入 AddWorkspaceDirectory，将 ./AddWorkspaceDirectory.js 中已经封装好的能力接到本文件流程里。
import { AddWorkspaceDirectory } from './AddWorkspaceDirectory.js';
// 引入 PermissionRuleDescription，将 ./PermissionRuleDescription.js 中已经封装好的能力接到本文件流程里。
import { PermissionRuleDescription } from './PermissionRuleDescription.js';
// 引入 PermissionRuleInput，将 ./PermissionRuleInput.js 中已经封装好的能力接到本文件流程里。
import { PermissionRuleInput } from './PermissionRuleInput.js';
// 引入 RecentDenialsTab，将 ./RecentDenialsTab.js 中已经封装好的能力接到本文件流程里。
import { RecentDenialsTab } from './RecentDenialsTab.js';
// 引入 RemoveWorkspaceDirectory，将 ./RemoveWorkspaceDirectory.js 中已经封装好的能力接到本文件流程里。
import { RemoveWorkspaceDirectory } from './RemoveWorkspaceDirectory.js';
// 引入 WorkspaceTab，将 ./WorkspaceTab.js 中已经封装好的能力接到本文件流程里。
import { WorkspaceTab } from './WorkspaceTab.js';
// TabType 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TabType = 'recent' | 'allow' | 'ask' | 'deny' | 'workspace';
// RuleSourceTextProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type RuleSourceTextProps = {
  rule: PermissionRule;
};
// RuleSourceText 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function RuleSourceText(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rule
  } = t0;
  // t1 暂存 `permissionRuleSourceDisplayString(rule.source)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== rule.source) {
    // t1 暂存 `permissionRuleSourceDisplayString(rule.source)` 生成的渲染片段，后续返回路径直接复用。
    t1 = permissionRuleSourceDisplayString(rule.source);
    // $[0] 缓存 `rule.source`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = rule.source;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 临时值 t2 命名 ``From ${t1}``，让后续代码直接表达这个值的用途。
  const t2 = `From ${t1}`;
  // t3 暂存 `<Text dimColor={true}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t2) {
    // t3 暂存 `<Text dimColor={true}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text dimColor={true}>{t2}</Text>;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}

// Helper function to get the appropriate label for rule behavior
// getRuleBehaviorLabel 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRuleBehaviorLabel(ruleBehavior: PermissionBehavior): string {
  // 按照 ruleBehavior 的取值选择终端渲染的具体处理分支。
  switch (ruleBehavior) {
    case 'allow':
      // 返回 `'allowed'`，作为终端渲染这次计算的结果。
      return 'allowed';
    case 'deny':
      // 返回 `'denied'`，作为终端渲染这次计算的结果。
      return 'denied';
    case 'ask':
      // 返回 `'ask'`，作为终端渲染这次计算的结果。
      return 'ask';
  }
}

// Component for showing tool details and managing the interactive deletion workflow
// RuleDetails 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function RuleDetails(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(42);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rule,
    onDelete,
    onCancel
  } = t0;
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
  useKeybinding("confirm:no", onCancel, t1);
  // t2 暂存 `permissionRuleValueToString(rule.ruleValue)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== rule.ruleValue) {
    // t2 暂存 `permissionRuleValueToString(rule.ruleValue)` 生成的渲染片段，后续返回路径直接复用。
    t2 = permissionRuleValueToString(rule.ruleValue);
    // $[1] 缓存 `rule.ruleValue`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = rule.ruleValue;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Text bold={true}>{t2}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t2) {
    // t3 暂存 `<Text bold={true}>{t2}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Text bold={true}>{t2}</Text>;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // t4 暂存 `<PermissionRuleDescription ruleValue={rule.ruleValue} />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== rule.ruleValue) {
    // t4 暂存 `<PermissionRuleDescription ruleValue={rule.ruleValue} />` 生成的渲染片段，后续返回路径直接复用。
    t4 = <PermissionRuleDescription ruleValue={rule.ruleValue} />;
    // $[5] 缓存 `rule.ruleValue`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = rule.ruleValue;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<RuleSourceText rule={rule} />` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== rule) {
    // t5 暂存 `<RuleSourceText rule={rule} />` 生成的渲染片段，后续返回路径直接复用。
    t5 = <RuleSourceText rule={rule} />;
    // $[7] 缓存 `rule`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = rule;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<Box flexDirection="column" marginX={2}>{t3}{t4}{t5}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== t3 || $[10] !== t4 || $[11] !== t5) {
    // t6 暂存 `<Box flexDirection="column" marginX={2}>{t3}{t4}{t5}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box flexDirection="column" marginX={2}>{t3}{t4}{t5}</Box>;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // ruleDescription保存`t6`，作为后续临时缓存值处理的输入。
  const ruleDescription = t6;
  // t7 暂存 `<Box marginLeft={3}>{exitState.pending ? <Text dimColor={...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== exitState.keyName || $[14] !== exitState.pending) {
    // t7 暂存 `<Box marginLeft={3}>{exitState.pending ? <Text dimColor={...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box marginLeft={3}>{exitState.pending ? <Text dimColor={true}>Press {exitState.keyName} again to exit</Text> : <Text dimColor={true}>Esc to cancel</Text>}</Box>;
    // $[13] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = exitState.keyName;
    // $[14] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = exitState.pending;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // footer沿用 `t7` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const footer = t7;
  // 当 `rule.source` 匹配 `"policySettings"` 时，终端渲染执行对应分支。
  if (rule.source === "policySettings") {
    // t8 暂存 `<Text bold={true} color="permission">Rule details</Text>` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      // t8 暂存 `<Text bold={true} color="permission">Rule details</Text>` 生成的渲染片段，后续返回路径直接复用。
      t8 = <Text bold={true} color="permission">Rule details</Text>;
      // $[16] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[16];
    }
    // t9 暂存 `<Text italic={true}>This rule is configured by managed se...` 的派生结果，便于缓存命中时直接复用。
    let t9;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
      // t9 暂存 `<Text italic={true}>This rule is configured by managed se...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text italic={true}>This rule is configured by managed settings and cannot be modified.{"\n"}Contact your system administrator for more information.</Text>;
      // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[17];
    }
    // t10 暂存 `<Box flexDirection="column" gap={1} borderStyle="round" p...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[18] !== ruleDescription) {
      // t10 暂存 `<Box flexDirection="column" gap={1} borderStyle="round" p...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Box flexDirection="column" gap={1} borderStyle="round" paddingLeft={1} paddingRight={1} borderColor="permission">{t8}{ruleDescription}{t9}</Box>;
      // $[18] 缓存 `ruleDescription`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = ruleDescription;
      // $[19] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[19];
    }
    // t11 暂存 `<>{t10}{footer}</>` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[20] !== footer || $[21] !== t10) {
      // t11 暂存 `<>{t10}{footer}</>` 生成的渲染片段，后续返回路径直接复用。
      t11 = <>{t10}{footer}</>;
      // $[20] 缓存 `footer`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = footer;
      // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = t10;
      // $[22] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[22];
    }
    // 返回 `t11`，作为终端渲染这次计算的结果。
    return t11;
  }
  // t8 暂存 `getRuleBehaviorLabel(rule.ruleBehavior)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== rule.ruleBehavior) {
    // t8 暂存 `getRuleBehaviorLabel(rule.ruleBehavior)` 生成的渲染片段，后续返回路径直接复用。
    t8 = getRuleBehaviorLabel(rule.ruleBehavior);
    // $[23] 缓存 `rule.ruleBehavior`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = rule.ruleBehavior;
    // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[24];
  }
  // t9 暂存 `<Text bold={true} color="error">Delete {t8} tool?</Text>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== t8) {
    // t9 暂存 `<Text bold={true} color="error">Delete {t8} tool?</Text>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text bold={true} color="error">Delete {t8} tool?</Text>;
    // $[25] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t8;
    // $[26] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[26];
  }
  // t10 暂存 `<Text>Are you sure you want to delete this permission rul...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Text>Are you sure you want to delete this permission rul...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text>Are you sure you want to delete this permission rule?</Text>;
    // $[27] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[27];
  }
  // t11 暂存 `_ => _ === "yes" ? onDelete() : onCancel()` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== onCancel || $[29] !== onDelete) {
    // t11 暂存 `_ => _ === "yes" ? onDelete() : onCancel()` 生成的渲染片段，后续返回路径直接复用。
    t11 = _ => _ === "yes" ? onDelete() : onCancel();
    // $[28] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = onCancel;
    // $[29] 缓存 `onDelete`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = onDelete;
    // $[30] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[30];
  }
  // t12 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t12 = [{
      label: "Yes",
      value: "yes"
    }, {
      label: "No",
      value: "no"
    }];
    // $[31] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[31];
  }
  // t13 暂存 `<Select onChange={t11} onCancel={onCancel} options={t12} ...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== onCancel || $[33] !== t11) {
    // t13 暂存 `<Select onChange={t11} onCancel={onCancel} options={t12} ...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Select onChange={t11} onCancel={onCancel} options={t12} />;
    // $[32] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = onCancel;
    // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t11;
    // $[34] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[34];
  }
  // t14 暂存 `<Box flexDirection="column" gap={1} borderStyle="round" p...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== ruleDescription || $[36] !== t13 || $[37] !== t9) {
    // t14 暂存 `<Box flexDirection="column" gap={1} borderStyle="round" p...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Box flexDirection="column" gap={1} borderStyle="round" paddingLeft={1} paddingRight={1} borderColor="error">{t9}{ruleDescription}{t10}{t13}</Box>;
    // $[35] 缓存 `ruleDescription`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = ruleDescription;
    // $[36] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t13;
    // $[37] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t9;
    // $[38] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[38];
  }
  // t15 暂存 `<>{t14}{footer}</>` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== footer || $[40] !== t14) {
    // t15 暂存 `<>{t14}{footer}</>` 生成的渲染片段，后续返回路径直接复用。
    t15 = <>{t14}{footer}</>;
    // $[39] 缓存 `footer`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = footer;
    // $[40] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t14;
    // $[41] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[41];
  }
  // 返回 `t15`，作为终端渲染这次计算的结果。
  return t15;
}
// RulesTabContentProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type RulesTabContentProps = {
  options: Option[];
  searchQuery: string;
  isSearchMode: boolean;
  isFocused: boolean;
  // 这个回调绑定到 onSelect: (value: string) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (value: string) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  lastFocusedRuleKey: string | undefined;
  cursorOffset?: number;
  onHeaderFocusChange?: (focused: boolean) => void;
};

// Component for rendering rules tab content with full width support
// RulesTabContent 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function RulesTabContent(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    options,
    searchQuery,
    isSearchMode,
    isFocused,
    onSelect,
    onCancel,
    lastFocusedRuleKey,
    cursorOffset,
    onHeaderFocusChange
  } = props;
  // tabWidth保存`useTabsWidth`，供终端渲染后续处理使用。
  const tabWidth = useTabsWidth();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    headerFocused,
    focusHeader,
    blurHeader
  } = useTabHeaderFocus();
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 暂存 `[isSearchMode, headerFocused, blurHeader]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== blurHeader || $[1] !== headerFocused || $[2] !== isSearchMode) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 只有 `isSearchMode && headerFocused` 满足时，终端渲染才执行该分支。
      if (isSearchMode && headerFocused) {
        // 调用 blurHeader，触发终端渲染此处需要的副作用。
        blurHeader();
      }
    };
    // t1 暂存 `[isSearchMode, headerFocused, blurHeader]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [isSearchMode, headerFocused, blurHeader];
    // $[0] 缓存 `blurHeader`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = blurHeader;
    // $[1] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = headerFocused;
    // $[2] 缓存 `isSearchMode`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = isSearchMode;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[3];
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t0, t1);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[headerFocused, onHeaderFocusChange]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== headerFocused || $[6] !== onHeaderFocusChange) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 onHeaderFocusChange?.(headerFocused);，完成这一处局部操作。
      onHeaderFocusChange?.(headerFocused);
    };
    // t3 暂存 `[headerFocused, onHeaderFocusChange]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [headerFocused, onHeaderFocusChange];
    // $[5] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = headerFocused;
    // $[6] 缓存 `onHeaderFocusChange`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onHeaderFocusChange;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const t4 = isSearchMode && !headerFocused;
  // t5 暂存 `<Box marginBottom={1} flexDirection="column"><SearchBox q...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== cursorOffset || $[10] !== isFocused || $[11] !== searchQuery || $[12] !== t4 || $[13] !== tabWidth) {
    // t5 暂存 `<Box marginBottom={1} flexDirection="column"><SearchBox q...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box marginBottom={1} flexDirection="column"><SearchBox query={searchQuery} isFocused={t4} isTerminalFocused={isFocused} width={tabWidth} cursorOffset={cursorOffset} /></Box>;
    // $[9] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = cursorOffset;
    // $[10] 缓存 `isFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = isFocused;
    // $[11] 缓存 `searchQuery`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = searchQuery;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `tabWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = tabWidth;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[14];
  }
  // 临时值 t6保存`Math.min`，供终端渲染后续处理使用。
  const t6 = Math.min(10, options.length);
  // t7标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const t7 = isSearchMode || headerFocused;
  // t8 暂存 `<Select options={options} onChange={onSelect} onCancel={o...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== focusHeader || $[16] !== lastFocusedRuleKey || $[17] !== onCancel || $[18] !== onSelect || $[19] !== options || $[20] !== t6 || $[21] !== t7) {
    // t8 暂存 `<Select options={options} onChange={onSelect} onCancel={o...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Select options={options} onChange={onSelect} onCancel={onCancel} visibleOptionCount={t6} isDisabled={t7} defaultFocusValue={lastFocusedRuleKey} onUpFromFirstItem={focusHeader} />;
    // $[15] 缓存 `focusHeader`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = focusHeader;
    // $[16] 缓存 `lastFocusedRuleKey`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = lastFocusedRuleKey;
    // $[17] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onCancel;
    // $[18] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = onSelect;
    // $[19] 缓存 `options`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = options;
    // $[20] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t6;
    // $[21] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t7;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[22];
  }
  // t9 暂存 `<Box flexDirection="column">{t5}{t8}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== t5 || $[24] !== t8) {
    // t9 暂存 `<Box flexDirection="column">{t5}{t8}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column">{t5}{t8}</Box>;
    // $[23] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t5;
    // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t8;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[25];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}

// Composes the subtitle + search + Select for a single allow/ask/deny tab.
// PermissionRulesTab 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PermissionRulesTab(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(27);
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // handleToolSelect 先占位，稍后的条件分支会根据实际输入补齐它。
  let handleToolSelect;
  // rulesProps 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let rulesProps;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // tab 先占位，稍后的条件分支会根据实际输入补齐它。
  let tab;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      tab: t5,
      getRulesOptions,
      handleToolSelect: t6,
      ...t7
    } = t0;
    // tab更新为 `t5`，确保权限确认界面后续读取最新状态。
    tab = t5;
    // handleToolSelect更新为 `t6`，确保权限确认界面后续读取最新状态。
    handleToolSelect = t6;
    // rulesProps 集合更新为 `t7`，确保权限确认界面后续读取最新状态。
    rulesProps = t7;
    // T1 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T1 = Box;
    // t2 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t2 = "column";
    // t3 暂存 `tab === "allow" ? 0 : undefined` 生成的渲染片段，后续返回路径直接复用。
    t3 = tab === "allow" ? 0 : undefined;
    // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
      // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t8 = {
        allow: "Claude Code won't ask before using allowed tools.",
        ask: "Claude Code will always ask for confirmation before using these tools.",
        deny: "Claude Code will always reject requests to use denied tools."
      };
      // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[10] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[10];
    }
    // 临时值 t9 命名 `t8[tab]`，让后续代码直接表达这个值的用途。
    const t9 = t8[tab];
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== t9) {
      // t4 暂存 `<Text>{t9}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t4 = <Text>{t9}</Text>;
      // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = t9;
      // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[12];
    }
    // T0 暂存 `RulesTabContent` 生成的渲染片段，后续返回路径直接复用。
    T0 = RulesTabContent;
    // t1 暂存 `getRulesOptions(tab, rulesProps.searchQuery)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getRulesOptions(tab, rulesProps.searchQuery);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = T0;
    // $[2] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = T1;
    // $[3] 缓存 `handleToolSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = handleToolSelect;
    // $[4] 缓存 `rulesProps`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = rulesProps;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `tab`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = tab;
  } else {
    // T0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[1];
    // T1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[2];
    // handleToolSelect更新为 `$[3]`，确保权限确认界面后续读取最新状态。
    handleToolSelect = $[3];
    // rulesProps 集合更新为 `$[4]`，确保权限确认界面后续读取最新状态。
    rulesProps = $[4];
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
    // tab更新为 `$[9]`，确保权限确认界面后续读取最新状态。
    tab = $[9];
  }
  // t5 暂存 `v => handleToolSelect(v, tab)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== handleToolSelect || $[14] !== tab) {
    // t5 暂存 `v => handleToolSelect(v, tab)` 生成的渲染片段，后续返回路径直接复用。
    t5 = v => handleToolSelect(v, tab);
    // $[13] 缓存 `handleToolSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = handleToolSelect;
    // $[14] 缓存 `tab`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = tab;
    // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[15];
  }
  // t6 暂存 `<T0 options={t1.options} onSelect={t5} {...rulesProps} />` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== T0 || $[17] !== rulesProps || $[18] !== t1.options || $[19] !== t5) {
    // t6 暂存 `<T0 options={t1.options} onSelect={t5} {...rulesProps} />` 生成的渲染片段，后续返回路径直接复用。
    t6 = <T0 options={t1.options} onSelect={t5} {...rulesProps} />;
    // $[16] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = T0;
    // $[17] 缓存 `rulesProps`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = rulesProps;
    // $[18] 缓存 `t1.options`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t1.options;
    // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t5;
    // $[20] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[20];
  }
  // t7 暂存 `<T1 flexDirection={t2} flexShrink={t3}>{t4}{t6}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== T1 || $[22] !== t2 || $[23] !== t3 || $[24] !== t4 || $[25] !== t6) {
    // t7 暂存 `<T1 flexDirection={t2} flexShrink={t3}>{t4}{t6}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <T1 flexDirection={t2} flexShrink={t3}>{t4}{t6}</T1>;
    // $[21] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = T1;
    // $[22] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t2;
    // $[23] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t3;
    // $[24] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t4;
    // $[25] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t6;
    // $[26] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[26];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onExit: (result?: string, options?: {
    display?: CommandResultDisplay;
    shouldQuery?: boolean;
    metaMessages?: string[];
  }) => void;
  initialTab?: TabType;
  // 这个回调绑定到 onRetryDenials?: (commands: string[]) => void;，负责终端渲染在该局部场景下的响应。
  onRetryDenials?: (commands: string[]) => void;
};
// PermissionRuleList 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PermissionRuleList(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(113);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onExit,
    initialTab,
    onRetryDenials
  } = t0;
  // t1 暂存 `getAutoModeDenials()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getAutoModeDenials()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getAutoModeDenials();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // hasDenials 集合标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const hasDenials = t1.length > 0;
  // defaultTab保存`initialTab ?? (hasDenials ? "recent" : "allow")`，供后续判断或组装使用。
  const defaultTab = initialTab ?? (hasDenials ? "recent" : "allow");
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // changes 集合 由 React state 持有，setChanges 会在用户操作或异步结果返回时触发刷新。
  const [changes, setChanges] = useState(t2);
  // toolPermissionContext 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContext = useAppState(_temp);
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // isTerminalFocused记录 `useTerminalFocus` 是否成立，终端渲染随后按该结果分支。
  const isTerminalFocused = useTerminalFocus();
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      approved: new Set(),
      retry: new Set(),
      denials: []
    };
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // denialStateRef 引用保存`useRef`，供终端渲染后续处理使用。
  const denialStateRef = useRef(t3);
  // t4 暂存 `s_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `s_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = s_0 => {
      // current更新为 `s_0`，确保权限确认界面后续读取最新状态。
      denialStateRef.current = s_0;
    };
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // handleDenialStateChange 状态沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleDenialStateChange = t4;
  // selectedRule 由 React state 持有，setSelectedRule 会在用户操作或异步结果返回时触发刷新。
  const [selectedRule, setSelectedRule] = useState();
  // lastFocusedRuleKey 由 React state 持有，setLastFocusedRuleKey 会在用户操作或异步结果返回时触发刷新。
  const [lastFocusedRuleKey, setLastFocusedRuleKey] = useState();
  // addingRuleToTab 由 React state 持有，setAddingRuleToTab 会在用户操作或异步结果返回时触发刷新。
  const [addingRuleToTab, setAddingRuleToTab] = useState(null);
  // validatedRule 由 React state 持有，setValidatedRule 会在用户操作或异步结果返回时触发刷新。
  const [validatedRule, setValidatedRule] = useState(null);
  // isAddingWorkspaceDirectory 由 React state 持有，setIsAddingWorkspaceDirectory 会在用户操作或异步结果返回时触发刷新。
  const [isAddingWorkspaceDirectory, setIsAddingWorkspaceDirectory] = useState(false);
  // removingDirectory 由 React state 持有，setRemovingDirectory 会在用户操作或异步结果返回时触发刷新。
  const [removingDirectory, setRemovingDirectory] = useState(null);
  // isSearchMode 由 React state 持有，setIsSearchMode 会在用户操作或异步结果返回时触发刷新。
  const [isSearchMode, setIsSearchMode] = useState(false);
  // headerFocused 由 React state 持有，setHeaderFocused 会在用户操作或异步结果返回时触发刷新。
  const [headerFocused, setHeaderFocused] = useState(true);
  // t5 暂存 `focused => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `focused => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = focused => {
      // setHeaderFocused 写入新的状态值，使终端渲染后续读取保持一致。
      setHeaderFocused(focused);
    };
    // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[4];
  }
  // handleHeaderFocusChange沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleHeaderFocusChange = t5;
  // map 先占位，稍后的条件分支会根据实际输入补齐它。
  let map;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== toolPermissionContext) {
    // map更新为 `new Map()`，确保权限确认界面后续读取最新状态。
    map = new Map();
    // 调用 getAllowRules，触发终端渲染此处需要的副作用。
    getAllowRules(toolPermissionContext).forEach(rule => {
      // map.set 写入新的状态值，使终端渲染后续读取保持一致。
      map.set(jsonStringify(rule), rule);
    });
    // $[5] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = toolPermissionContext;
    // $[6] 缓存 `map`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = map;
  } else {
    // map更新为 `$[6]`，确保权限确认界面后续读取最新状态。
    map = $[6];
  }
  // allowRulesByKey 命名 `map`，让后续代码直接表达这个值的用途。
  const allowRulesByKey = map;
  // map_0 先占位，稍后的条件分支会根据实际输入补齐它。
  let map_0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== toolPermissionContext) {
    // map_0更新为 `new Map()`，确保权限确认界面后续读取最新状态。
    map_0 = new Map();
    // 调用 getDenyRules，触发终端渲染此处需要的副作用。
    getDenyRules(toolPermissionContext).forEach(rule_0 => {
      // map_0.set 写入新的状态值，使终端渲染后续读取保持一致。
      map_0.set(jsonStringify(rule_0), rule_0);
    });
    // $[7] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = toolPermissionContext;
    // $[8] 缓存 `map_0`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = map_0;
  } else {
    // map_0更新为 `$[8]`，确保权限确认界面后续读取最新状态。
    map_0 = $[8];
  }
  // denyRulesByKey派生`map_0` 整理出中间结果，供终端渲染权限确认界面 Permission Rule List后续步骤使用。
  const denyRulesByKey = map_0;
  // map_1 先占位，稍后的条件分支会根据实际输入补齐它。
  let map_1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== toolPermissionContext) {
    // map_1更新为 `new Map()`，确保权限确认界面后续读取最新状态。
    map_1 = new Map();
    // 调用 getAskRules，触发终端渲染此处需要的副作用。
    getAskRules(toolPermissionContext).forEach(rule_1 => {
      // map_1.set 写入新的状态值，使终端渲染后续读取保持一致。
      map_1.set(jsonStringify(rule_1), rule_1);
    });
    // $[9] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = toolPermissionContext;
    // $[10] 缓存 `map_1`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = map_1;
  } else {
    // map_1更新为 `$[10]`，确保权限确认界面后续读取最新状态。
    map_1 = $[10];
  }
  // askRulesByKey 命名 `map_1`，让后续代码直接表达这个值的用途。
  const askRulesByKey = map_1;
  // t6 暂存 `(tab, t7) => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== allowRulesByKey || $[12] !== askRulesByKey || $[13] !== denyRulesByKey) {
    // t6 暂存 `(tab, t7) => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = (tab, t7) => {
      // query标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
      const query = t7 === undefined ? "" : t7;
      // rulesByKey封装成回调，供终端渲染权限确认界面 Permission Rule List在事件触发或异步步骤中调用。
      const rulesByKey = (() => {
        // 按照 tab 的取值选择终端渲染的具体处理分支。
        switch (tab) {
          case "allow":
            {
              // 返回 `allowRulesByKey`，作为终端渲染这次计算的结果。
              return allowRulesByKey;
            }
          case "deny":
            {
              // 返回 `denyRulesByKey`，作为终端渲染这次计算的结果。
              return denyRulesByKey;
            }
          case "ask":
            {
              // 返回 `askRulesByKey`，作为终端渲染这次计算的结果。
              return askRulesByKey;
            }
          case "workspace":
          case "recent":
            {
              // 返回 `new Map()`，作为终端渲染这次计算的结果。
              return new Map();
            }
        }
      })();
      // 选项 从空数组开始收集，后续循环会按处理顺序追加条目。
      const options = [];
      // `tab` 与 `"workspace" && tab !== "recent"...` 不一致时刷新派生状态，避免使用过期结果。
      if (tab !== "workspace" && tab !== "recent" && !query) {
        // 选项追加新条目，保持收集顺序与输入顺序一致。
        options.push({
          label: `Add a new rule${figures.ellipsis}`,
          value: "add-new-rule"
        });
      }
      // sortedRuleKeys 集合保存`Array.from`，供终端渲染后续处理使用。
      const sortedRuleKeys = Array.from(rulesByKey.keys()).sort((a, b) => {
        // ruleA读取`rulesByKey.get`，供终端渲染后续处理使用。
        const ruleA = rulesByKey.get(a);
        // ruleB读取`rulesByKey.get`，供终端渲染后续处理使用。
        const ruleB = rulesByKey.get(b);
        // 只有 `ruleA && ruleB` 满足时，终端渲染才执行该分支。
        if (ruleA && ruleB) {
          // ruleAString保存`permissionRuleValueToString`，供终端渲染后续处理使用。
          const ruleAString = permissionRuleValueToString(ruleA.ruleValue).toLowerCase();
          // ruleBString保存`permissionRuleValueToString`，供终端渲染后续处理使用。
          const ruleBString = permissionRuleValueToString(ruleB.ruleValue).toLowerCase();
          // 返回 `ruleAString.localeCompare(ruleBString)`，作为终端渲染这次计算的结果。
          return ruleAString.localeCompare(ruleBString);
        }
        // 返回 `0`，作为终端渲染这次计算的结果。
        return 0;
      });
      // lowerQuery保存`query.toLowerCase`，供终端渲染后续处理使用。
      const lowerQuery = query.toLowerCase();
      // 按顺序遍历 `sortedRuleKeys` 中的ruleKey，逐个交给终端渲染处理。
      for (const ruleKey of sortedRuleKeys) {
        // rule_2读取`rulesByKey.get`，供终端渲染后续处理使用。
        const rule_2 = rulesByKey.get(ruleKey);
        // 满足 `rule_2` 时，终端渲染执行该分支。
        if (rule_2) {
          // ruleString保存`permissionRuleValueToString`，供终端渲染后续处理使用。
          const ruleString = permissionRuleValueToString(rule_2.ruleValue);
          // 只有 `query && !ruleString.toLowerCase().includes(lowerQuery)` 满足时，终端渲染才执行该分支。
          if (query && !ruleString.toLowerCase().includes(lowerQuery)) {
            // 跳过当前项，继续处理终端渲染中的下一轮循环。
            continue;
          }
          // 选项追加新条目，保持收集顺序与输入顺序一致。
          options.push({
            label: ruleString,
            value: ruleKey
          });
        }
      }
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        options,
        rulesByKey
      };
    };
    // $[11] 缓存 `allowRulesByKey`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = allowRulesByKey;
    // $[12] 缓存 `askRulesByKey`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = askRulesByKey;
    // $[13] 缓存 `denyRulesByKey`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = denyRulesByKey;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // getRulesOptions 集合 命名 `t6`，让后续代码直接表达这个值的用途。
  const getRulesOptions = t6;
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings();
  // isSearchModeActive标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const isSearchModeActive = !selectedRule && !addingRuleToTab && !validatedRule && !isAddingWorkspaceDirectory && !removingDirectory;
  // t7标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const t7 = isSearchModeActive && isSearchMode;
  // t8 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => {
      // setIsSearchMode 写入新的状态值，使终端渲染后续读取保持一致。
      setIsSearchMode(false);
    };
    // $[15] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[15];
  }
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t7) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      isActive: t7,
      onExit: t8
    };
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
    // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[17];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    cursorOffset: searchCursorOffset
  } = useSearchInput(t9);
  // t10 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== isSearchMode || $[19] !== isSearchModeActive || $[20] !== setSearchQuery) {
    // t10 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = e => {
      // isSearchModeActive缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!isSearchModeActive) {
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `isSearchMode` 时，终端渲染执行该分支。
      if (isSearchMode) {
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 只有 `e.ctrl || e.meta` 满足时，终端渲染才执行该分支。
      if (e.ctrl || e.meta) {
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 当 `e.key` 匹配 `"/"` 时，终端渲染执行对应分支。
      if (e.key === "/") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // setIsSearchMode 写入新的状态值，使终端渲染后续读取保持一致。
        setIsSearchMode(true);
        // setSearchQuery 写入新的状态值，使终端渲染后续读取保持一致。
        setSearchQuery("");
      } else {
        // `e.key.length === 1 && e.key` 与 `"j" && e.key !==` 不一致时刷新派生状态，避免使用过期结果。
        if (e.key.length === 1 && e.key !== "j" && e.key !== "k" && e.key !== "m" && e.key !== "i" && e.key !== "r" && e.key !== " ") {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // setIsSearchMode 写入新的状态值，使终端渲染后续读取保持一致。
          setIsSearchMode(true);
          // setSearchQuery 写入新的状态值，使终端渲染后续读取保持一致。
          setSearchQuery(e.key);
        }
      }
    };
    // $[18] 缓存 `isSearchMode`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = isSearchMode;
    // $[19] 缓存 `isSearchModeActive`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = isSearchModeActive;
    // $[20] 缓存 `setSearchQuery`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = setSearchQuery;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[21];
  }
  // handleKeyDown保存`t10`，作为后续临时缓存值处理的输入。
  const handleKeyDown = t10;
  // t11 暂存 `(selectedValue, tab_0) => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== getRulesOptions) {
    // t11 暂存 `(selectedValue, tab_0) => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = (selectedValue, tab_0) => {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        rulesByKey: rulesByKey_0
      } = getRulesOptions(tab_0);
      // 当 `selectedValue` 匹配 `"add-new-rule"` 时，终端渲染执行对应分支。
      if (selectedValue === "add-new-rule") {
        // setAddingRuleToTab 写入新的状态值，使终端渲染后续读取保持一致。
        setAddingRuleToTab(tab_0);
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      } else {
        // setSelectedRule 写入新的状态值，使终端渲染后续读取保持一致。
        setSelectedRule(rulesByKey_0.get(selectedValue));
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
    };
    // $[22] 缓存 `getRulesOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = getRulesOptions;
    // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[23];
  }
  // handleToolSelect沿用 `t11` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleToolSelect = t11;
  // t12 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = () => {
      // setAddingRuleToTab 写入新的状态值，使终端渲染后续读取保持一致。
      setAddingRuleToTab(null);
    };
    // $[24] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[24];
  }
  // handleRuleInputCancel保存`t12`，作为后续临时缓存值处理的输入。
  const handleRuleInputCancel = t12;
  // t13 暂存 `(ruleValue, ruleBehavior) => {` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    // t13 暂存 `(ruleValue, ruleBehavior) => {` 生成的渲染片段，后续返回路径直接复用。
    t13 = (ruleValue, ruleBehavior) => {
      // setValidatedRule 写入新的状态值，使终端渲染后续读取保持一致。
      setValidatedRule({
        ruleValue,
        ruleBehavior
      });
      // setAddingRuleToTab 写入新的状态值，使终端渲染后续读取保持一致。
      setAddingRuleToTab(null);
    };
    // $[25] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[25];
  }
  // handleRuleInputSubmit 命名 `t13`，让后续代码直接表达这个值的用途。
  const handleRuleInputSubmit = t13;
  // t14 暂存 `(rules, unreachable) => {` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
    // t14 暂存 `(rules, unreachable) => {` 生成的渲染片段，后续返回路径直接复用。
    t14 = (rules, unreachable) => {
      // setValidatedRule 写入新的状态值，使终端渲染后续读取保持一致。
      setValidatedRule(null);
      // 按顺序遍历 `rules` 中的rule_3，逐个交给终端渲染处理。
      for (const rule_3 of rules) {
        // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
        setChanges(prev => [...prev, `Added ${rule_3.ruleBehavior} rule ${chalk.bold(permissionRuleValueToString(rule_3.ruleValue))}`]);
      }
      // 只有 `unreachable && unreachable.length > 0` 满足时，终端渲染才执行该分支。
      if (unreachable && unreachable.length > 0) {
        // 按顺序遍历 `unreachable` 中的u，逐个交给终端渲染处理。
        for (const u of unreachable) {
          // severity标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
          const severity = u.shadowType === "deny" ? "blocked" : "shadowed";
          // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
          setChanges(prev_0 => [...prev_0, chalk.yellow(`${figures.warning} Warning: ${permissionRuleValueToString(u.rule.ruleValue)} is ${severity}`), chalk.dim(`  ${u.reason}`), chalk.dim(`  Fix: ${u.fix}`)]);
        }
      }
    };
    // $[26] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[26];
  }
  // handleAddRulesSuccess 集合 命名 `t14`，让后续代码直接表达这个值的用途。
  const handleAddRulesSuccess = t14;
  // t15 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t15 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t15 = () => {
      // setValidatedRule 写入新的状态值，使终端渲染后续读取保持一致。
      setValidatedRule(null);
    };
    // $[27] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[27];
  }
  // handleAddRuleCancel保存`t15`，作为后续临时缓存值处理的输入。
  const handleAddRuleCancel = t15;
  // t16 暂存 `() => setIsAddingWorkspaceDirectory(true)` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `() => setIsAddingWorkspaceDirectory(true)` 生成的渲染片段，后续返回路径直接复用。
    t16 = () => setIsAddingWorkspaceDirectory(true);
    // $[28] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[28];
  }
  // handleRequestAddDirectory 请求数据保存`t16`，作为后续临时缓存值处理的输入。
  const handleRequestAddDirectory = t16;
  // t17 暂存 `path => setRemovingDirectory(path)` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[29] === Symbol.for("react.memo_cache_sentinel")) {
    // t17 暂存 `path => setRemovingDirectory(path)` 生成的渲染片段，后续返回路径直接复用。
    t17 = path => setRemovingDirectory(path);
    // $[29] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[29];
  }
  // handleRequestRemoveDirectory 请求数据保存`t17`，作为后续临时缓存值处理的输入。
  const handleRequestRemoveDirectory = t17;
  // t18 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== changes || $[31] !== onExit || $[32] !== onRetryDenials) {
    // t18 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t18 = () => {
      // s_1保存`denialStateRef.current`，供终端渲染权限确认界面 Permission Rule List后续判断或输出使用。
      const s_1 = denialStateRef.current;
      // denialsFor保存`Array.from`，供终端渲染后续处理使用。
      const denialsFor = set => Array.from(set).map(idx => s_1.denials[idx]).filter(_temp2);
      // retryDenials 集合保存`denialsFor`，供终端渲染后续处理使用。
      const retryDenials = denialsFor(s_1.retry);
      // 满足 `retryDenials.length > 0` 时，终端渲染执行该分支。
      if (retryDenials.length > 0) {
        // commands 命令数据派生`retryDenials.map`，供终端渲染后续处理使用。
        const commands = retryDenials.map(_temp3);
        // 调用 onRetryDenials?.(commands);，完成这一处局部操作。
        onRetryDenials?.(commands);
        // 调用 onExit，触发终端渲染此处需要的副作用。
        onExit(undefined, {
          shouldQuery: true,
          metaMessages: [`Permission granted for: ${commands.join(", ")}. You may now retry ${commands.length === 1 ? "this command" : "these commands"} if you would like.`]
        });
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // approvedDenials 集合保存`denialsFor`，供终端渲染后续处理使用。
      const approvedDenials = denialsFor(s_1.approved);
      // 只有 `approvedDenials.length > 0 || changes.length > 0` 满足时，终端渲染才执行该分支。
      if (approvedDenials.length > 0 || changes.length > 0) {
        // approvedMsg派生`approvedDenials.map`，供终端渲染后续处理使用。
        const approvedMsg = approvedDenials.length > 0 ? [`Approved ${approvedDenials.map(_temp4).join(", ")}`] : [];
        // 调用 onExit，触发终端渲染此处需要的副作用。
        onExit([...approvedMsg, ...changes].join("\n"));
      } else {
        // 调用 onExit，触发终端渲染此处需要的副作用。
        onExit("Permissions dialog dismissed", {
          display: "system"
        });
      }
    };
    // $[30] 缓存 `changes`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = changes;
    // $[31] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = onExit;
    // $[32] 缓存 `onRetryDenials`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = onRetryDenials;
    // $[33] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[33];
  }
  // handleRulesCancel沿用 `t18` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleRulesCancel = t18;
  // t19标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const t19 = isSearchModeActive && !isSearchMode;
  // t20 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t19) {
    // t20 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t20 = {
      context: "Settings",
      isActive: t19
    };
    // $[34] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t19;
    // $[35] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[35];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", handleRulesCancel, t20);
  // t21 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== getRulesOptions || $[37] !== selectedRule || $[38] !== setAppState || $[39] !== toolPermissionContext) {
    // t21 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t21 = () => {
      // selectedRule缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!selectedRule) {
        // 权限确认界面 Permission Rule List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        options: options_0
      } = getRulesOptions(selectedRule.ruleBehavior as TabType);
      // selectedKey保存`jsonStringify`，供终端渲染后续处理使用。
      const selectedKey = jsonStringify(selectedRule);
      // ruleKeys 集合筛选`options_0.filter`，供终端渲染后续处理使用。
      const ruleKeys = options_0.filter(_temp5).map(_temp6);
      // currentIndex 索引保存`ruleKeys.indexOf`，供终端渲染后续处理使用。
      const currentIndex = ruleKeys.indexOf(selectedKey);
      // nextFocusKey 先占位，稍后的条件分支会根据实际输入补齐它。
      let nextFocusKey;
      // `currentIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
      if (currentIndex !== -1) {
        // 满足 `currentIndex < ruleKeys.length - 1` 时，终端渲染执行该分支。
        if (currentIndex < ruleKeys.length - 1) {
          // nextFocusKey更新为 `ruleKeys[currentIndex + 1]`，确保权限确认界面后续读取最新状态。
          nextFocusKey = ruleKeys[currentIndex + 1];
        } else {
          // 满足 `currentIndex > 0` 时，终端渲染执行该分支。
          if (currentIndex > 0) {
            // nextFocusKey更新为 `ruleKeys[currentIndex - 1]`，确保权限确认界面后续读取最新状态。
            nextFocusKey = ruleKeys[currentIndex - 1];
          }
        }
      }
      // setLastFocusedRuleKey 写入新的状态值，使终端渲染后续读取保持一致。
      setLastFocusedRuleKey(nextFocusKey);
      // 调用 deletePermissionRule，触发终端渲染此处需要的副作用。
      deletePermissionRule({
        rule: selectedRule,
        initialContext: toolPermissionContext,
        // setToolPermissionContext 根据 toolPermissionContext_0 更新终端渲染的状态。
        setToolPermissionContext(toolPermissionContext_0) {
          // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
          setAppState(prev_1 => ({
            ...prev_1,
            toolPermissionContext: toolPermissionContext_0
          }));
        }
      });
      // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
      setChanges(prev_2 => [...prev_2, `Deleted ${selectedRule.ruleBehavior} rule ${chalk.bold(permissionRuleValueToString(selectedRule.ruleValue))}`]);
      // setSelectedRule 写入新的状态值，使终端渲染后续读取保持一致。
      setSelectedRule(undefined);
    };
    // $[36] 缓存 `getRulesOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = getRulesOptions;
    // $[37] 缓存 `selectedRule`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = selectedRule;
    // $[38] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = setAppState;
    // $[39] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = toolPermissionContext;
    // $[40] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[40];
  }
  // handleDeleteRule保存`t21`，作为后续临时缓存值处理的输入。
  const handleDeleteRule = t21;
  // 满足 `selectedRule` 时，终端渲染执行该分支。
  if (selectedRule) {
    // t22 暂存 `() => setSelectedRule(undefined)` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[41] === Symbol.for("react.memo_cache_sentinel")) {
      // t22 暂存 `() => setSelectedRule(undefined)` 生成的渲染片段，后续返回路径直接复用。
      t22 = () => setSelectedRule(undefined);
      // $[41] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = t22;
    } else {
      // t22 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[41];
    }
    // t23 暂存 `<RuleDetails rule={selectedRule} onDelete={handleDeleteRu...` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[42] !== handleDeleteRule || $[43] !== selectedRule) {
      // t23 暂存 `<RuleDetails rule={selectedRule} onDelete={handleDeleteRu...` 生成的渲染片段，后续返回路径直接复用。
      t23 = <RuleDetails rule={selectedRule} onDelete={handleDeleteRule} onCancel={t22} />;
      // $[42] 缓存 `handleDeleteRule`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = handleDeleteRule;
      // $[43] 缓存 `selectedRule`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = selectedRule;
      // $[44] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[44];
    }
    // 返回 `t23`，作为终端渲染这次计算的结果。
    return t23;
  }
  // `addingRuleToTab && addingRuleToTab` 与 `"workspace` 不一致时刷新派生状态，避免使用过期结果。
  if (addingRuleToTab && addingRuleToTab !== "workspace" && addingRuleToTab !== "recent") {
    // t22 暂存 `<PermissionRuleInput onCancel={handleRuleInputCancel} onS...` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[45] !== addingRuleToTab) {
      // t22 暂存 `<PermissionRuleInput onCancel={handleRuleInputCancel} onS...` 生成的渲染片段，后续返回路径直接复用。
      t22 = <PermissionRuleInput onCancel={handleRuleInputCancel} onSubmit={handleRuleInputSubmit} ruleBehavior={addingRuleToTab} />;
      // $[45] 缓存 `addingRuleToTab`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = addingRuleToTab;
      // $[46] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t22;
    } else {
      // t22 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[46];
    }
    // 返回 `t22`，作为终端渲染这次计算的结果。
    return t22;
  }
  // 满足 `validatedRule` 时，终端渲染执行该分支。
  if (validatedRule) {
    // t22 暂存 `[validatedRule.ruleValue]` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[47] !== validatedRule.ruleValue) {
      // t22 暂存 `[validatedRule.ruleValue]` 生成的渲染片段，后续返回路径直接复用。
      t22 = [validatedRule.ruleValue];
      // $[47] 缓存 `validatedRule.ruleValue`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = validatedRule.ruleValue;
      // $[48] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[48] = t22;
    } else {
      // t22 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[48];
    }
    // t23 暂存 `toolPermissionContext_1 => {` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[49] !== setAppState) {
      // t23 暂存 `toolPermissionContext_1 => {` 生成的渲染片段，后续返回路径直接复用。
      t23 = toolPermissionContext_1 => {
        // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
        setAppState(prev_3 => ({
          ...prev_3,
          toolPermissionContext: toolPermissionContext_1
        }));
      };
      // $[49] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
      $[49] = setAppState;
      // $[50] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[50] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[50];
    }
    // t24 暂存 `<AddPermissionRules onAddRules={handleAddRulesSuccess} on...` 的派生结果，便于缓存命中时直接复用。
    let t24;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[51] !== t22 || $[52] !== t23 || $[53] !== toolPermissionContext || $[54] !== validatedRule.ruleBehavior) {
      // t24 暂存 `<AddPermissionRules onAddRules={handleAddRulesSuccess} on...` 生成的渲染片段，后续返回路径直接复用。
      t24 = <AddPermissionRules onAddRules={handleAddRulesSuccess} onCancel={handleAddRuleCancel} ruleValues={t22} ruleBehavior={validatedRule.ruleBehavior} initialContext={toolPermissionContext} setToolPermissionContext={t23} />;
      // $[51] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[51] = t22;
      // $[52] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[52] = t23;
      // $[53] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
      $[53] = toolPermissionContext;
      // $[54] 缓存 `validatedRule.ruleBehavior`，下次依赖未变时 React 编译产物可直接复用。
      $[54] = validatedRule.ruleBehavior;
      // $[55] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[55] = t24;
    } else {
      // t24 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
      t24 = $[55];
    }
    // 返回 `t24`，作为终端渲染这次计算的结果。
    return t24;
  }
  // 满足 `isAddingWorkspaceDirectory` 时，终端渲染执行该分支。
  if (isAddingWorkspaceDirectory) {
    // t22 暂存 `(path_0, remember) => {` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[56] !== setAppState || $[57] !== toolPermissionContext) {
      // t22 暂存 `(path_0, remember) => {` 生成的渲染片段，后续返回路径直接复用。
      t22 = (path_0, remember) => {
        // destination保存`remember ? "localSettings" : "session"`，供终端渲染权限确认界面 Permission Rule List后续判断或输出使用。
        const destination = remember ? "localSettings" : "session";
        // permissionUpdate 权限数据 集中保存终端渲染权限确认界面 Permission Rule List要一起传递的字段。
        const permissionUpdate = {
          type: "addDirectories" as const,
          directories: [path_0],
          destination
        };
        // updatedContext保存`applyPermissionUpdate`，供终端渲染后续处理使用。
        const updatedContext = applyPermissionUpdate(toolPermissionContext, permissionUpdate);
        // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
        setAppState(prev_4 => ({
          ...prev_4,
          toolPermissionContext: updatedContext
        }));
        // 满足 `remember` 时，终端渲染执行该分支。
        if (remember) {
          // 调用 persistPermissionUpdate，触发终端渲染此处需要的副作用。
          persistPermissionUpdate(permissionUpdate);
        }
        // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
        setChanges(prev_5 => [...prev_5, `Added directory ${chalk.bold(path_0)} to workspace${remember ? " and saved to local settings" : " for this session"}`]);
        // setIsAddingWorkspaceDirectory 写入新的状态值，使终端渲染后续读取保持一致。
        setIsAddingWorkspaceDirectory(false);
      };
      // $[56] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
      $[56] = setAppState;
      // $[57] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
      $[57] = toolPermissionContext;
      // $[58] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[58] = t22;
    } else {
      // t22 从 React 编译缓存槽 $[58] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[58];
    }
    // t23 暂存 `() => setIsAddingWorkspaceDirectory(false)` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[59] === Symbol.for("react.memo_cache_sentinel")) {
      // t23 暂存 `() => setIsAddingWorkspaceDirectory(false)` 生成的渲染片段，后续返回路径直接复用。
      t23 = () => setIsAddingWorkspaceDirectory(false);
      // $[59] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[59] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[59];
    }
    // t24 暂存 `<AddWorkspaceDirectory onAddDirectory={t22} onCancel={t23...` 的派生结果，便于缓存命中时直接复用。
    let t24;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[60] !== t22 || $[61] !== toolPermissionContext) {
      // t24 暂存 `<AddWorkspaceDirectory onAddDirectory={t22} onCancel={t23...` 生成的渲染片段，后续返回路径直接复用。
      t24 = <AddWorkspaceDirectory onAddDirectory={t22} onCancel={t23} permissionContext={toolPermissionContext} />;
      // $[60] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[60] = t22;
      // $[61] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
      $[61] = toolPermissionContext;
      // $[62] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[62] = t24;
    } else {
      // t24 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
      t24 = $[62];
    }
    // 返回 `t24`，作为终端渲染这次计算的结果。
    return t24;
  }
  // 满足 `removingDirectory` 时，终端渲染执行该分支。
  if (removingDirectory) {
    // t22 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
    let t22;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[63] !== removingDirectory) {
      // t22 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
      t22 = () => {
        // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
        setChanges(prev_6 => [...prev_6, `Removed directory ${chalk.bold(removingDirectory)} from workspace`]);
        // setRemovingDirectory 写入新的状态值，使终端渲染后续读取保持一致。
        setRemovingDirectory(null);
      };
      // $[63] 缓存 `removingDirectory`，下次依赖未变时 React 编译产物可直接复用。
      $[63] = removingDirectory;
      // $[64] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[64] = t22;
    } else {
      // t22 从 React 编译缓存槽 $[64] 取回渲染片段，避免依赖未变时重建 JSX。
      t22 = $[64];
    }
    // t23 暂存 `() => setRemovingDirectory(null)` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[65] === Symbol.for("react.memo_cache_sentinel")) {
      // t23 暂存 `() => setRemovingDirectory(null)` 生成的渲染片段，后续返回路径直接复用。
      t23 = () => setRemovingDirectory(null);
      // $[65] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[65] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[65] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[65];
    }
    // t24 暂存 `toolPermissionContext_2 => {` 的派生结果，便于缓存命中时直接复用。
    let t24;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[66] !== setAppState) {
      // t24 暂存 `toolPermissionContext_2 => {` 生成的渲染片段，后续返回路径直接复用。
      t24 = toolPermissionContext_2 => {
        // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
        setAppState(prev_7 => ({
          ...prev_7,
          toolPermissionContext: toolPermissionContext_2
        }));
      };
      // $[66] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
      $[66] = setAppState;
      // $[67] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[67] = t24;
    } else {
      // t24 从 React 编译缓存槽 $[67] 取回渲染片段，避免依赖未变时重建 JSX。
      t24 = $[67];
    }
    // t25 暂存 `<RemoveWorkspaceDirectory directoryPath={removingDirector...` 的派生结果，便于缓存命中时直接复用。
    let t25;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[68] !== removingDirectory || $[69] !== t22 || $[70] !== t24 || $[71] !== toolPermissionContext) {
      // t25 暂存 `<RemoveWorkspaceDirectory directoryPath={removingDirector...` 生成的渲染片段，后续返回路径直接复用。
      t25 = <RemoveWorkspaceDirectory directoryPath={removingDirectory} onRemove={t22} onCancel={t23} permissionContext={toolPermissionContext} setPermissionContext={t24} />;
      // $[68] 缓存 `removingDirectory`，下次依赖未变时 React 编译产物可直接复用。
      $[68] = removingDirectory;
      // $[69] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[69] = t22;
      // $[70] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[70] = t24;
      // $[71] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
      $[71] = toolPermissionContext;
      // $[72] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
      $[72] = t25;
    } else {
      // t25 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
      t25 = $[72];
    }
    // 返回 `t25`，作为终端渲染这次计算的结果。
    return t25;
  }
  // t22 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[73] !== getRulesOptions || $[74] !== handleRulesCancel || $[75] !== handleToolSelect || $[76] !== isSearchMode || $[77] !== isTerminalFocused || $[78] !== lastFocusedRuleKey || $[79] !== searchCursorOffset || $[80] !== searchQuery) {
    // t22 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t22 = {
      searchQuery,
      isSearchMode,
      isFocused: isTerminalFocused,
      onCancel: handleRulesCancel,
      lastFocusedRuleKey,
      cursorOffset: searchCursorOffset,
      getRulesOptions,
      handleToolSelect,
      onHeaderFocusChange: handleHeaderFocusChange
    };
    // $[73] 缓存 `getRulesOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = getRulesOptions;
    // $[74] 缓存 `handleRulesCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = handleRulesCancel;
    // $[75] 缓存 `handleToolSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = handleToolSelect;
    // $[76] 缓存 `isSearchMode`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = isSearchMode;
    // $[77] 缓存 `isTerminalFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = isTerminalFocused;
    // $[78] 缓存 `lastFocusedRuleKey`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = lastFocusedRuleKey;
    // $[79] 缓存 `searchCursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = searchCursorOffset;
    // $[80] 缓存 `searchQuery`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = searchQuery;
    // $[81] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[81] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[81];
  }
  // sharedRulesProps 集合 命名 `t22`，让后续代码直接表达这个值的用途。
  const sharedRulesProps = t22;
  // isHidden标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const isHidden = !!selectedRule || !!addingRuleToTab || !!validatedRule || isAddingWorkspaceDirectory || !!removingDirectory;
  // t23标记终端渲染权限确认界面 Permission Rule List是否启用对应路径。
  const t23 = !isSearchMode;
  // t24 暂存 `<Tab id="recent" title="Recently denied"><RecentDenialsTa...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[82] === Symbol.for("react.memo_cache_sentinel")) {
    // t24 暂存 `<Tab id="recent" title="Recently denied"><RecentDenialsTa...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Tab id="recent" title="Recently denied"><RecentDenialsTab onHeaderFocusChange={handleHeaderFocusChange} onStateChange={handleDenialStateChange} /></Tab>;
    // $[82] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[82] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[82];
  }
  // t25 暂存 `<Tab id="allow" title="Allow"><PermissionRulesTab tab="al...` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[83] !== sharedRulesProps) {
    // t25 暂存 `<Tab id="allow" title="Allow"><PermissionRulesTab tab="al...` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Tab id="allow" title="Allow"><PermissionRulesTab tab="allow" {...sharedRulesProps} /></Tab>;
    // $[83] 缓存 `sharedRulesProps`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = sharedRulesProps;
    // $[84] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[84] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[84];
  }
  // t26 暂存 `<Tab id="ask" title="Ask"><PermissionRulesTab tab="ask" {...` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[85] !== sharedRulesProps) {
    // t26 暂存 `<Tab id="ask" title="Ask"><PermissionRulesTab tab="ask" {...` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Tab id="ask" title="Ask"><PermissionRulesTab tab="ask" {...sharedRulesProps} /></Tab>;
    // $[85] 缓存 `sharedRulesProps`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = sharedRulesProps;
    // $[86] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[86] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[86];
  }
  // t27 暂存 `<Tab id="deny" title="Deny"><PermissionRulesTab tab="deny...` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[87] !== sharedRulesProps) {
    // t27 暂存 `<Tab id="deny" title="Deny"><PermissionRulesTab tab="deny...` 生成的渲染片段，后续返回路径直接复用。
    t27 = <Tab id="deny" title="Deny"><PermissionRulesTab tab="deny" {...sharedRulesProps} /></Tab>;
    // $[87] 缓存 `sharedRulesProps`，下次依赖未变时 React 编译产物可直接复用。
    $[87] = sharedRulesProps;
    // $[88] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[88] = t27;
  } else {
    // t27 从 React 编译缓存槽 $[88] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[88];
  }
  // t28 暂存 `<Text>Claude Code can read files in the workspace, and ma...` 的派生结果，便于缓存命中时直接复用。
  let t28;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[89] === Symbol.for("react.memo_cache_sentinel")) {
    // t28 暂存 `<Text>Claude Code can read files in the workspace, and ma...` 生成的渲染片段，后续返回路径直接复用。
    t28 = <Text>Claude Code can read files in the workspace, and make edits when auto-accept edits is on.</Text>;
    // $[89] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[89] = t28;
  } else {
    // t28 从 React 编译缓存槽 $[89] 取回渲染片段，避免依赖未变时重建 JSX。
    t28 = $[89];
  }
  // t29 暂存 `<Tab id="workspace" title="Workspace"><Box flexDirection=...` 的派生结果，便于缓存命中时直接复用。
  let t29;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[90] !== onExit || $[91] !== toolPermissionContext) {
    // t29 暂存 `<Tab id="workspace" title="Workspace"><Box flexDirection=...` 生成的渲染片段，后续返回路径直接复用。
    t29 = <Tab id="workspace" title="Workspace"><Box flexDirection="column">{t28}<WorkspaceTab onExit={onExit} toolPermissionContext={toolPermissionContext} onRequestAddDirectory={handleRequestAddDirectory} onRequestRemoveDirectory={handleRequestRemoveDirectory} onHeaderFocusChange={handleHeaderFocusChange} /></Box></Tab>;
    // $[90] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[90] = onExit;
    // $[91] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[91] = toolPermissionContext;
    // $[92] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[92] = t29;
  } else {
    // t29 从 React 编译缓存槽 $[92] 取回渲染片段，避免依赖未变时重建 JSX。
    t29 = $[92];
  }
  // t30 暂存 `<Tabs title="Permissions:" color="permission" defaultTab=...` 的派生结果，便于缓存命中时直接复用。
  let t30;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[93] !== defaultTab || $[94] !== isHidden || $[95] !== t23 || $[96] !== t25 || $[97] !== t26 || $[98] !== t27 || $[99] !== t29) {
    // t30 暂存 `<Tabs title="Permissions:" color="permission" defaultTab=...` 生成的渲染片段，后续返回路径直接复用。
    t30 = <Tabs title="Permissions:" color="permission" defaultTab={defaultTab} hidden={isHidden} initialHeaderFocused={!hasDenials} navFromContent={t23}>{t24}{t25}{t26}{t27}{t29}</Tabs>;
    // $[93] 缓存 `defaultTab`，下次依赖未变时 React 编译产物可直接复用。
    $[93] = defaultTab;
    // $[94] 缓存 `isHidden`，下次依赖未变时 React 编译产物可直接复用。
    $[94] = isHidden;
    // $[95] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[95] = t23;
    // $[96] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[96] = t25;
    // $[97] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[97] = t26;
    // $[98] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[98] = t27;
    // $[99] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[99] = t29;
    // $[100] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[100] = t30;
  } else {
    // t30 从 React 编译缓存槽 $[100] 取回渲染片段，避免依赖未变时重建 JSX。
    t30 = $[100];
  }
  // t31 暂存 `<Box marginTop={1} paddingLeft={1}><Text dimColor={true}>...` 的派生结果，便于缓存命中时直接复用。
  let t31;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[101] !== defaultTab || $[102] !== exitState.keyName || $[103] !== exitState.pending || $[104] !== headerFocused || $[105] !== isSearchMode) {
    // t31 暂存 `<Box marginTop={1} paddingLeft={1}><Text dimColor={true}>...` 生成的渲染片段，后续返回路径直接复用。
    t31 = <Box marginTop={1} paddingLeft={1}><Text dimColor={true}>{exitState.pending ? <>Press {exitState.keyName} again to exit</> : headerFocused ? <>←/→ tab switch · ↓ return · Esc cancel</> : isSearchMode ? <>Type to filter · Enter/↓ select · ↑ tabs · Esc clear</> : hasDenials && defaultTab === "recent" ? <>Enter approve · r retry · ↑↓ navigate · ←/→ switch · Esc cancel</> : <>↑↓ navigate · Enter select · Type to search · ←/→ switch · Esc cancel</>}</Text></Box>;
    // $[101] 缓存 `defaultTab`，下次依赖未变时 React 编译产物可直接复用。
    $[101] = defaultTab;
    // $[102] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[102] = exitState.keyName;
    // $[103] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[103] = exitState.pending;
    // $[104] 缓存 `headerFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[104] = headerFocused;
    // $[105] 缓存 `isSearchMode`，下次依赖未变时 React 编译产物可直接复用。
    $[105] = isSearchMode;
    // $[106] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[106] = t31;
  } else {
    // t31 从 React 编译缓存槽 $[106] 取回渲染片段，避免依赖未变时重建 JSX。
    t31 = $[106];
  }
  // t32 暂存 `<Pane color="permission">{t30}{t31}</Pane>` 的派生结果，便于缓存命中时直接复用。
  let t32;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[107] !== t30 || $[108] !== t31) {
    // t32 暂存 `<Pane color="permission">{t30}{t31}</Pane>` 生成的渲染片段，后续返回路径直接复用。
    t32 = <Pane color="permission">{t30}{t31}</Pane>;
    // $[107] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[107] = t30;
    // $[108] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[108] = t31;
    // $[109] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[109] = t32;
  } else {
    // t32 从 React 编译缓存槽 $[109] 取回渲染片段，避免依赖未变时重建 JSX。
    t32 = $[109];
  }
  // t33 暂存 `<Box flexDirection="column" onKeyDown={handleKeyDown}>{t3...` 的派生结果，便于缓存命中时直接复用。
  let t33;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[110] !== handleKeyDown || $[111] !== t32) {
    // t33 暂存 `<Box flexDirection="column" onKeyDown={handleKeyDown}>{t3...` 生成的渲染片段，后续返回路径直接复用。
    t33 = <Box flexDirection="column" onKeyDown={handleKeyDown}>{t32}</Box>;
    // $[110] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[110] = handleKeyDown;
    // $[111] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[111] = t32;
    // $[112] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
    $[112] = t33;
  } else {
    // t33 从 React 编译缓存槽 $[112] 取回渲染片段，避免依赖未变时重建 JSX。
    t33 = $[112];
  }
  // 返回 `t33`，作为终端渲染这次计算的结果。
  return t33;
}
// _temp6 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(opt_0) {
  // 返回 `opt_0.value`，作为终端渲染这次计算的结果。
  return opt_0.value;
}
// _temp5 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(opt) {
  // 返回 `opt.value !== "add-new-rule"`，作为终端渲染这次计算的结果。
  return opt.value !== "add-new-rule";
}
// _temp4 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(d_1) {
  // 返回 `chalk.bold(d_1.display)`，作为终端渲染这次计算的结果。
  return chalk.bold(d_1.display);
}
// _temp3 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(d_0) {
  // 返回 `d_0.display`，作为终端渲染这次计算的结果。
  return d_0.display;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(d) {
  // 返回 `d !== undefined`，作为终端渲染这次计算的结果。
  return d !== undefined;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.toolPermissionContext`，作为终端渲染这次计算的结果。
  return s.toolPermissionContext;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsImZpZ3VyZXMiLCJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlTWVtbyIsInVzZVJlZiIsInVzZVN0YXRlIiwidXNlQXBwU3RhdGUiLCJ1c2VTZXRBcHBTdGF0ZSIsImFwcGx5UGVybWlzc2lvblVwZGF0ZSIsInBlcnNpc3RQZXJtaXNzaW9uVXBkYXRlIiwiUGVybWlzc2lvblVwZGF0ZURlc3RpbmF0aW9uIiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJTZWxlY3QiLCJ1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MiLCJ1c2VTZWFyY2hJbnB1dCIsIktleWJvYXJkRXZlbnQiLCJCb3giLCJUZXh0IiwidXNlVGVybWluYWxGb2N1cyIsInVzZUtleWJpbmRpbmciLCJBdXRvTW9kZURlbmlhbCIsImdldEF1dG9Nb2RlRGVuaWFscyIsIlBlcm1pc3Npb25CZWhhdmlvciIsIlBlcm1pc3Npb25SdWxlIiwiUGVybWlzc2lvblJ1bGVWYWx1ZSIsInBlcm1pc3Npb25SdWxlVmFsdWVUb1N0cmluZyIsImRlbGV0ZVBlcm1pc3Npb25SdWxlIiwiZ2V0QWxsb3dSdWxlcyIsImdldEFza1J1bGVzIiwiZ2V0RGVueVJ1bGVzIiwicGVybWlzc2lvblJ1bGVTb3VyY2VEaXNwbGF5U3RyaW5nIiwiVW5yZWFjaGFibGVSdWxlIiwianNvblN0cmluZ2lmeSIsIlBhbmUiLCJUYWIiLCJUYWJzIiwidXNlVGFiSGVhZGVyRm9jdXMiLCJ1c2VUYWJzV2lkdGgiLCJTZWFyY2hCb3giLCJPcHRpb24iLCJBZGRQZXJtaXNzaW9uUnVsZXMiLCJBZGRXb3Jrc3BhY2VEaXJlY3RvcnkiLCJQZXJtaXNzaW9uUnVsZURlc2NyaXB0aW9uIiwiUGVybWlzc2lvblJ1bGVJbnB1dCIsIlJlY2VudERlbmlhbHNUYWIiLCJSZW1vdmVXb3Jrc3BhY2VEaXJlY3RvcnkiLCJXb3Jrc3BhY2VUYWIiLCJUYWJUeXBlIiwiUnVsZVNvdXJjZVRleHRQcm9wcyIsInJ1bGUiLCJSdWxlU291cmNlVGV4dCIsInQwIiwiJCIsIl9jIiwidDEiLCJzb3VyY2UiLCJ0MiIsInQzIiwiZ2V0UnVsZUJlaGF2aW9yTGFiZWwiLCJydWxlQmVoYXZpb3IiLCJSdWxlRGV0YWlscyIsIm9uRGVsZXRlIiwib25DYW5jZWwiLCJleGl0U3RhdGUiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwicnVsZVZhbHVlIiwidDQiLCJ0NSIsInQ2IiwicnVsZURlc2NyaXB0aW9uIiwidDciLCJrZXlOYW1lIiwicGVuZGluZyIsImZvb3RlciIsInQ4IiwidDkiLCJ0MTAiLCJ0MTEiLCJfIiwidDEyIiwibGFiZWwiLCJ2YWx1ZSIsInQxMyIsInQxNCIsInQxNSIsIlJ1bGVzVGFiQ29udGVudFByb3BzIiwib3B0aW9ucyIsInNlYXJjaFF1ZXJ5IiwiaXNTZWFyY2hNb2RlIiwiaXNGb2N1c2VkIiwib25TZWxlY3QiLCJsYXN0Rm9jdXNlZFJ1bGVLZXkiLCJjdXJzb3JPZmZzZXQiLCJvbkhlYWRlckZvY3VzQ2hhbmdlIiwiZm9jdXNlZCIsIlJ1bGVzVGFiQ29udGVudCIsInByb3BzIiwidGFiV2lkdGgiLCJoZWFkZXJGb2N1c2VkIiwiZm9jdXNIZWFkZXIiLCJibHVySGVhZGVyIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsIlBlcm1pc3Npb25SdWxlc1RhYiIsIlQwIiwiVDEiLCJoYW5kbGVUb29sU2VsZWN0IiwicnVsZXNQcm9wcyIsInRhYiIsImdldFJ1bGVzT3B0aW9ucyIsInVuZGVmaW5lZCIsImFsbG93IiwiYXNrIiwiZGVueSIsInYiLCJQcm9wcyIsIm9uRXhpdCIsInJlc3VsdCIsImRpc3BsYXkiLCJzaG91bGRRdWVyeSIsIm1ldGFNZXNzYWdlcyIsImluaXRpYWxUYWIiLCJvblJldHJ5RGVuaWFscyIsImNvbW1hbmRzIiwiUGVybWlzc2lvblJ1bGVMaXN0IiwiaGFzRGVuaWFscyIsImRlZmF1bHRUYWIiLCJjaGFuZ2VzIiwic2V0Q2hhbmdlcyIsInRvb2xQZXJtaXNzaW9uQ29udGV4dCIsIl90ZW1wIiwic2V0QXBwU3RhdGUiLCJpc1Rlcm1pbmFsRm9jdXNlZCIsImFwcHJvdmVkIiwiU2V0IiwicmV0cnkiLCJkZW5pYWxzIiwiZGVuaWFsU3RhdGVSZWYiLCJzXzAiLCJjdXJyZW50IiwicyIsImhhbmRsZURlbmlhbFN0YXRlQ2hhbmdlIiwic2VsZWN0ZWRSdWxlIiwic2V0U2VsZWN0ZWRSdWxlIiwic2V0TGFzdEZvY3VzZWRSdWxlS2V5IiwiYWRkaW5nUnVsZVRvVGFiIiwic2V0QWRkaW5nUnVsZVRvVGFiIiwidmFsaWRhdGVkUnVsZSIsInNldFZhbGlkYXRlZFJ1bGUiLCJpc0FkZGluZ1dvcmtzcGFjZURpcmVjdG9yeSIsInNldElzQWRkaW5nV29ya3NwYWNlRGlyZWN0b3J5IiwicmVtb3ZpbmdEaXJlY3RvcnkiLCJzZXRSZW1vdmluZ0RpcmVjdG9yeSIsInNldElzU2VhcmNoTW9kZSIsInNldEhlYWRlckZvY3VzZWQiLCJoYW5kbGVIZWFkZXJGb2N1c0NoYW5nZSIsIm1hcCIsIk1hcCIsImZvckVhY2giLCJzZXQiLCJhbGxvd1J1bGVzQnlLZXkiLCJtYXBfMCIsInJ1bGVfMCIsImRlbnlSdWxlc0J5S2V5IiwibWFwXzEiLCJydWxlXzEiLCJhc2tSdWxlc0J5S2V5IiwicXVlcnkiLCJydWxlc0J5S2V5IiwicHVzaCIsImVsbGlwc2lzIiwic29ydGVkUnVsZUtleXMiLCJBcnJheSIsImZyb20iLCJrZXlzIiwic29ydCIsImEiLCJiIiwicnVsZUEiLCJnZXQiLCJydWxlQiIsInJ1bGVBU3RyaW5nIiwidG9Mb3dlckNhc2UiLCJydWxlQlN0cmluZyIsImxvY2FsZUNvbXBhcmUiLCJsb3dlclF1ZXJ5IiwicnVsZUtleSIsInJ1bGVfMiIsInJ1bGVTdHJpbmciLCJpbmNsdWRlcyIsImlzU2VhcmNoTW9kZUFjdGl2ZSIsImlzQWN0aXZlIiwic2V0UXVlcnkiLCJzZXRTZWFyY2hRdWVyeSIsInNlYXJjaEN1cnNvck9mZnNldCIsImUiLCJjdHJsIiwibWV0YSIsImtleSIsInByZXZlbnREZWZhdWx0IiwiaGFuZGxlS2V5RG93biIsInNlbGVjdGVkVmFsdWUiLCJ0YWJfMCIsInJ1bGVzQnlLZXlfMCIsImhhbmRsZVJ1bGVJbnB1dENhbmNlbCIsImhhbmRsZVJ1bGVJbnB1dFN1Ym1pdCIsInJ1bGVzIiwidW5yZWFjaGFibGUiLCJydWxlXzMiLCJwcmV2IiwiYm9sZCIsInUiLCJzZXZlcml0eSIsInNoYWRvd1R5cGUiLCJwcmV2XzAiLCJ5ZWxsb3ciLCJ3YXJuaW5nIiwiZGltIiwicmVhc29uIiwiZml4IiwiaGFuZGxlQWRkUnVsZXNTdWNjZXNzIiwiaGFuZGxlQWRkUnVsZUNhbmNlbCIsInQxNiIsImhhbmRsZVJlcXVlc3RBZGREaXJlY3RvcnkiLCJ0MTciLCJwYXRoIiwiaGFuZGxlUmVxdWVzdFJlbW92ZURpcmVjdG9yeSIsInQxOCIsInNfMSIsImRlbmlhbHNGb3IiLCJpZHgiLCJmaWx0ZXIiLCJfdGVtcDIiLCJyZXRyeURlbmlhbHMiLCJfdGVtcDMiLCJqb2luIiwiYXBwcm92ZWREZW5pYWxzIiwiYXBwcm92ZWRNc2ciLCJfdGVtcDQiLCJoYW5kbGVSdWxlc0NhbmNlbCIsInQxOSIsInQyMCIsInQyMSIsIm9wdGlvbnNfMCIsInNlbGVjdGVkS2V5IiwicnVsZUtleXMiLCJfdGVtcDUiLCJfdGVtcDYiLCJjdXJyZW50SW5kZXgiLCJpbmRleE9mIiwibmV4dEZvY3VzS2V5IiwiaW5pdGlhbENvbnRleHQiLCJzZXRUb29sUGVybWlzc2lvbkNvbnRleHQiLCJ0b29sUGVybWlzc2lvbkNvbnRleHRfMCIsInByZXZfMSIsInByZXZfMiIsImhhbmRsZURlbGV0ZVJ1bGUiLCJ0MjIiLCJ0MjMiLCJ0b29sUGVybWlzc2lvbkNvbnRleHRfMSIsInByZXZfMyIsInQyNCIsInBhdGhfMCIsInJlbWVtYmVyIiwiZGVzdGluYXRpb24iLCJwZXJtaXNzaW9uVXBkYXRlIiwidHlwZSIsImNvbnN0IiwiZGlyZWN0b3JpZXMiLCJ1cGRhdGVkQ29udGV4dCIsInByZXZfNCIsInByZXZfNSIsInByZXZfNiIsInRvb2xQZXJtaXNzaW9uQ29udGV4dF8yIiwicHJldl83IiwidDI1Iiwic2hhcmVkUnVsZXNQcm9wcyIsImlzSGlkZGVuIiwidDI2IiwidDI3IiwidDI4IiwidDI5IiwidDMwIiwidDMxIiwidDMyIiwidDMzIiwib3B0XzAiLCJvcHQiLCJkXzEiLCJkIiwiZF8wIl0sInNvdXJjZXMiOlsiUGVybWlzc2lvblJ1bGVMaXN0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VNZW1vLCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICdzcmMvc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQge1xuICBhcHBseVBlcm1pc3Npb25VcGRhdGUsXG4gIHBlcnNpc3RQZXJtaXNzaW9uVXBkYXRlLFxufSBmcm9tICdzcmMvdXRpbHMvcGVybWlzc2lvbnMvUGVybWlzc2lvblVwZGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgUGVybWlzc2lvblVwZGF0ZURlc3RpbmF0aW9uIH0gZnJvbSAnc3JjL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25VcGRhdGVTY2hlbWEuanMnXG5pbXBvcnQgdHlwZSB7IENvbW1hbmRSZXN1bHREaXNwbGF5IH0gZnJvbSAnLi4vLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi8uLi8uLi9jb21wb25lbnRzL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi8uLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyB1c2VTZWFyY2hJbnB1dCB9IGZyb20gJy4uLy4uLy4uL2hvb2tzL3VzZVNlYXJjaElucHV0LmpzJ1xuaW1wb3J0IHR5cGUgeyBLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi4vLi4vaW5rL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlVGVybWluYWxGb2N1cyB9IGZyb20gJy4uLy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBdXRvTW9kZURlbmlhbCxcbiAgZ2V0QXV0b01vZGVEZW5pYWxzLFxufSBmcm9tICcuLi8uLi8uLi91dGlscy9hdXRvTW9kZURlbmlhbHMuanMnXG5pbXBvcnQgdHlwZSB7XG4gIFBlcm1pc3Npb25CZWhhdmlvcixcbiAgUGVybWlzc2lvblJ1bGUsXG4gIFBlcm1pc3Npb25SdWxlVmFsdWUsXG59IGZyb20gJy4uLy4uLy4uL3V0aWxzL3Blcm1pc3Npb25zL1Blcm1pc3Npb25SdWxlLmpzJ1xuaW1wb3J0IHsgcGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvcGVybWlzc2lvblJ1bGVQYXJzZXIuanMnXG5pbXBvcnQge1xuICBkZWxldGVQZXJtaXNzaW9uUnVsZSxcbiAgZ2V0QWxsb3dSdWxlcyxcbiAgZ2V0QXNrUnVsZXMsXG4gIGdldERlbnlSdWxlcyxcbiAgcGVybWlzc2lvblJ1bGVTb3VyY2VEaXNwbGF5U3RyaW5nLFxufSBmcm9tICcuLi8uLi8uLi91dGlscy9wZXJtaXNzaW9ucy9wZXJtaXNzaW9ucy5qcydcbmltcG9ydCB0eXBlIHsgVW5yZWFjaGFibGVSdWxlIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvcGVybWlzc2lvbnMvc2hhZG93ZWRSdWxlRGV0ZWN0aW9uLmpzJ1xuaW1wb3J0IHsganNvblN0cmluZ2lmeSB9IGZyb20gJy4uLy4uLy4uL3V0aWxzL3Nsb3dPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHsgUGFuZSB9IGZyb20gJy4uLy4uL2Rlc2lnbi1zeXN0ZW0vUGFuZS5qcydcbmltcG9ydCB7XG4gIFRhYixcbiAgVGFicyxcbiAgdXNlVGFiSGVhZGVyRm9jdXMsXG4gIHVzZVRhYnNXaWR0aCxcbn0gZnJvbSAnLi4vLi4vZGVzaWduLXN5c3RlbS9UYWJzLmpzJ1xuaW1wb3J0IHsgU2VhcmNoQm94IH0gZnJvbSAnLi4vLi4vU2VhcmNoQm94LmpzJ1xuaW1wb3J0IHR5cGUgeyBPcHRpb24gfSBmcm9tICcuLi8uLi91aS9vcHRpb24uanMnXG5pbXBvcnQgeyBBZGRQZXJtaXNzaW9uUnVsZXMgfSBmcm9tICcuL0FkZFBlcm1pc3Npb25SdWxlcy5qcydcbmltcG9ydCB7IEFkZFdvcmtzcGFjZURpcmVjdG9yeSB9IGZyb20gJy4vQWRkV29ya3NwYWNlRGlyZWN0b3J5LmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvblJ1bGVEZXNjcmlwdGlvbiB9IGZyb20gJy4vUGVybWlzc2lvblJ1bGVEZXNjcmlwdGlvbi5qcydcbmltcG9ydCB7IFBlcm1pc3Npb25SdWxlSW5wdXQgfSBmcm9tICcuL1Blcm1pc3Npb25SdWxlSW5wdXQuanMnXG5pbXBvcnQgeyBSZWNlbnREZW5pYWxzVGFiIH0gZnJvbSAnLi9SZWNlbnREZW5pYWxzVGFiLmpzJ1xuaW1wb3J0IHsgUmVtb3ZlV29ya3NwYWNlRGlyZWN0b3J5IH0gZnJvbSAnLi9SZW1vdmVXb3Jrc3BhY2VEaXJlY3RvcnkuanMnXG5pbXBvcnQgeyBXb3Jrc3BhY2VUYWIgfSBmcm9tICcuL1dvcmtzcGFjZVRhYi5qcydcblxudHlwZSBUYWJUeXBlID0gJ3JlY2VudCcgfCAnYWxsb3cnIHwgJ2FzaycgfCAnZGVueScgfCAnd29ya3NwYWNlJ1xuXG50eXBlIFJ1bGVTb3VyY2VUZXh0UHJvcHMgPSB7XG4gIHJ1bGU6IFBlcm1pc3Npb25SdWxlXG59XG5mdW5jdGlvbiBSdWxlU291cmNlVGV4dCh7IHJ1bGUgfTogUnVsZVNvdXJjZVRleHRQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPFRleHRcbiAgICAgIGRpbUNvbG9yXG4gICAgPntgRnJvbSAke3Blcm1pc3Npb25SdWxlU291cmNlRGlzcGxheVN0cmluZyhydWxlLnNvdXJjZSl9YH08L1RleHQ+XG4gIClcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgYXBwcm9wcmlhdGUgbGFiZWwgZm9yIHJ1bGUgYmVoYXZpb3JcbmZ1bmN0aW9uIGdldFJ1bGVCZWhhdmlvckxhYmVsKHJ1bGVCZWhhdmlvcjogUGVybWlzc2lvbkJlaGF2aW9yKTogc3RyaW5nIHtcbiAgc3dpdGNoIChydWxlQmVoYXZpb3IpIHtcbiAgICBjYXNlICdhbGxvdyc6XG4gICAgICByZXR1cm4gJ2FsbG93ZWQnXG4gICAgY2FzZSAnZGVueSc6XG4gICAgICByZXR1cm4gJ2RlbmllZCdcbiAgICBjYXNlICdhc2snOlxuICAgICAgcmV0dXJuICdhc2snXG4gIH1cbn1cblxuLy8gQ29tcG9uZW50IGZvciBzaG93aW5nIHRvb2wgZGV0YWlscyBhbmQgbWFuYWdpbmcgdGhlIGludGVyYWN0aXZlIGRlbGV0aW9uIHdvcmtmbG93XG5mdW5jdGlvbiBSdWxlRGV0YWlscyh7XG4gIHJ1bGUsXG4gIG9uRGVsZXRlLFxuICBvbkNhbmNlbCxcbn06IHtcbiAgcnVsZTogUGVybWlzc2lvblJ1bGVcbiAgb25EZWxldGU6ICgpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBleGl0U3RhdGUgPSB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuICAvLyBVc2UgY29uZmlndXJhYmxlIGtleWJpbmRpbmcgZm9yIEVTQyB0byBjYW5jZWxcbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIG9uQ2FuY2VsLCB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0pXG5cbiAgY29uc3QgcnVsZURlc2NyaXB0aW9uID0gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblg9ezJ9PlxuICAgICAgPFRleHQgYm9sZD57cGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKHJ1bGUucnVsZVZhbHVlKX08L1RleHQ+XG4gICAgICA8UGVybWlzc2lvblJ1bGVEZXNjcmlwdGlvbiBydWxlVmFsdWU9e3J1bGUucnVsZVZhbHVlfSAvPlxuICAgICAgPFJ1bGVTb3VyY2VUZXh0IHJ1bGU9e3J1bGV9IC8+XG4gICAgPC9Cb3g+XG4gIClcblxuICBjb25zdCBmb290ZXIgPSAoXG4gICAgPEJveCBtYXJnaW5MZWZ0PXszfT5cbiAgICAgIHtleGl0U3RhdGUucGVuZGluZyA/IChcbiAgICAgICAgPFRleHQgZGltQ29sb3I+UHJlc3Mge2V4aXRTdGF0ZS5rZXlOYW1lfSBhZ2FpbiB0byBleGl0PC9UZXh0PlxuICAgICAgKSA6IChcbiAgICAgICAgPFRleHQgZGltQ29sb3I+RXNjIHRvIGNhbmNlbDwvVGV4dD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcblxuICAvLyBNYW5hZ2VkIHNldHRpbmdzIGNhbid0IGJlIGVkaXRlZFxuICBpZiAocnVsZS5zb3VyY2UgPT09ICdwb2xpY3lTZXR0aW5ncycpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPEJveFxuICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgIGdhcD17MX1cbiAgICAgICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgICAgICBwYWRkaW5nTGVmdD17MX1cbiAgICAgICAgICBwYWRkaW5nUmlnaHQ9ezF9XG4gICAgICAgICAgYm9yZGVyQ29sb3I9XCJwZXJtaXNzaW9uXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJwZXJtaXNzaW9uXCI+XG4gICAgICAgICAgICBSdWxlIGRldGFpbHNcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAge3J1bGVEZXNjcmlwdGlvbn1cbiAgICAgICAgICA8VGV4dCBpdGFsaWM+XG4gICAgICAgICAgICBUaGlzIHJ1bGUgaXMgY29uZmlndXJlZCBieSBtYW5hZ2VkIHNldHRpbmdzIGFuZCBjYW5ub3QgYmUgbW9kaWZpZWQuXG4gICAgICAgICAgICB7J1xcbid9XG4gICAgICAgICAgICBDb250YWN0IHlvdXIgc3lzdGVtIGFkbWluaXN0cmF0b3IgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAge2Zvb3Rlcn1cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxCb3hcbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIGdhcD17MX1cbiAgICAgICAgYm9yZGVyU3R5bGU9XCJyb3VuZFwiXG4gICAgICAgIHBhZGRpbmdMZWZ0PXsxfVxuICAgICAgICBwYWRkaW5nUmlnaHQ9ezF9XG4gICAgICAgIGJvcmRlckNvbG9yPVwiZXJyb3JcIlxuICAgICAgPlxuICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICBEZWxldGUge2dldFJ1bGVCZWhhdmlvckxhYmVsKHJ1bGUucnVsZUJlaGF2aW9yKX0gdG9vbD9cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7cnVsZURlc2NyaXB0aW9ufVxuICAgICAgICA8VGV4dD5BcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgcGVybWlzc2lvbiBydWxlPzwvVGV4dD5cbiAgICAgICAgPFNlbGVjdFxuICAgICAgICAgIG9uQ2hhbmdlPXtfID0+IChfID09PSAneWVzJyA/IG9uRGVsZXRlKCkgOiBvbkNhbmNlbCgpKX1cbiAgICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgICAgb3B0aW9ucz17W1xuICAgICAgICAgICAgeyBsYWJlbDogJ1llcycsIHZhbHVlOiAneWVzJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ05vJywgdmFsdWU6ICdubycgfSxcbiAgICAgICAgICBdfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgICB7Zm9vdGVyfVxuICAgIDwvPlxuICApXG59XG5cbnR5cGUgUnVsZXNUYWJDb250ZW50UHJvcHMgPSB7XG4gIG9wdGlvbnM6IE9wdGlvbltdXG4gIHNlYXJjaFF1ZXJ5OiBzdHJpbmdcbiAgaXNTZWFyY2hNb2RlOiBib29sZWFuXG4gIGlzRm9jdXNlZDogYm9vbGVhblxuICBvblNlbGVjdDogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbiAgbGFzdEZvY3VzZWRSdWxlS2V5OiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgY3Vyc29yT2Zmc2V0PzogbnVtYmVyXG4gIG9uSGVhZGVyRm9jdXNDaGFuZ2U/OiAoZm9jdXNlZDogYm9vbGVhbikgPT4gdm9pZFxufVxuXG4vLyBDb21wb25lbnQgZm9yIHJlbmRlcmluZyBydWxlcyB0YWIgY29udGVudCB3aXRoIGZ1bGwgd2lkdGggc3VwcG9ydFxuZnVuY3Rpb24gUnVsZXNUYWJDb250ZW50KHByb3BzOiBSdWxlc1RhYkNvbnRlbnRQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHtcbiAgICBvcHRpb25zLFxuICAgIHNlYXJjaFF1ZXJ5LFxuICAgIGlzU2VhcmNoTW9kZSxcbiAgICBpc0ZvY3VzZWQsXG4gICAgb25TZWxlY3QsXG4gICAgb25DYW5jZWwsXG4gICAgbGFzdEZvY3VzZWRSdWxlS2V5LFxuICAgIGN1cnNvck9mZnNldCxcbiAgICBvbkhlYWRlckZvY3VzQ2hhbmdlLFxuICB9ID0gcHJvcHNcbiAgY29uc3QgdGFiV2lkdGggPSB1c2VUYWJzV2lkdGgoKVxuICBjb25zdCB7IGhlYWRlckZvY3VzZWQsIGZvY3VzSGVhZGVyLCBibHVySGVhZGVyIH0gPSB1c2VUYWJIZWFkZXJGb2N1cygpXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGlzU2VhcmNoTW9kZSAmJiBoZWFkZXJGb2N1c2VkKSBibHVySGVhZGVyKClcbiAgfSwgW2lzU2VhcmNoTW9kZSwgaGVhZGVyRm9jdXNlZCwgYmx1ckhlYWRlcl0pXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgb25IZWFkZXJGb2N1c0NoYW5nZT8uKGhlYWRlckZvY3VzZWQpXG4gIH0sIFtoZWFkZXJGb2N1c2VkLCBvbkhlYWRlckZvY3VzQ2hhbmdlXSlcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgIDxTZWFyY2hCb3hcbiAgICAgICAgICBxdWVyeT17c2VhcmNoUXVlcnl9XG4gICAgICAgICAgaXNGb2N1c2VkPXtpc1NlYXJjaE1vZGUgJiYgIWhlYWRlckZvY3VzZWR9XG4gICAgICAgICAgaXNUZXJtaW5hbEZvY3VzZWQ9e2lzRm9jdXNlZH1cbiAgICAgICAgICB3aWR0aD17dGFiV2lkdGh9XG4gICAgICAgICAgY3Vyc29yT2Zmc2V0PXtjdXJzb3JPZmZzZXR9XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICAgIDxTZWxlY3RcbiAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgb25DaGFuZ2U9e29uU2VsZWN0fVxuICAgICAgICBvbkNhbmNlbD17b25DYW5jZWx9XG4gICAgICAgIHZpc2libGVPcHRpb25Db3VudD17TWF0aC5taW4oMTAsIG9wdGlvbnMubGVuZ3RoKX1cbiAgICAgICAgaXNEaXNhYmxlZD17aXNTZWFyY2hNb2RlIHx8IGhlYWRlckZvY3VzZWR9XG4gICAgICAgIGRlZmF1bHRGb2N1c1ZhbHVlPXtsYXN0Rm9jdXNlZFJ1bGVLZXl9XG4gICAgICAgIG9uVXBGcm9tRmlyc3RJdGVtPXtmb2N1c0hlYWRlcn1cbiAgICAgIC8+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxuLy8gQ29tcG9zZXMgdGhlIHN1YnRpdGxlICsgc2VhcmNoICsgU2VsZWN0IGZvciBhIHNpbmdsZSBhbGxvdy9hc2svZGVueSB0YWIuXG5mdW5jdGlvbiBQZXJtaXNzaW9uUnVsZXNUYWIoe1xuICB0YWIsXG4gIGdldFJ1bGVzT3B0aW9ucyxcbiAgaGFuZGxlVG9vbFNlbGVjdCxcbiAgLi4ucnVsZXNQcm9wc1xufToge1xuICB0YWI6ICdhbGxvdycgfCAnYXNrJyB8ICdkZW55J1xuICBnZXRSdWxlc09wdGlvbnM6ICh0YWI6IFRhYlR5cGUsIHF1ZXJ5Pzogc3RyaW5nKSA9PiB7IG9wdGlvbnM6IE9wdGlvbltdIH1cbiAgaGFuZGxlVG9vbFNlbGVjdDogKHZhbHVlOiBzdHJpbmcsIHRhYjogVGFiVHlwZSkgPT4gdm9pZFxufSAmIE9taXQ8UnVsZXNUYWJDb250ZW50UHJvcHMsICdvcHRpb25zJyB8ICdvblNlbGVjdCc+KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBmbGV4U2hyaW5rPXt0YWIgPT09ICdhbGxvdycgPyAwIDogdW5kZWZpbmVkfT5cbiAgICAgIDxUZXh0PlxuICAgICAgICB7XG4gICAgICAgICAge1xuICAgICAgICAgICAgYWxsb3c6IFwiQ2xhdWRlIENvZGUgd29uJ3QgYXNrIGJlZm9yZSB1c2luZyBhbGxvd2VkIHRvb2xzLlwiLFxuICAgICAgICAgICAgYXNrOiAnQ2xhdWRlIENvZGUgd2lsbCBhbHdheXMgYXNrIGZvciBjb25maXJtYXRpb24gYmVmb3JlIHVzaW5nIHRoZXNlIHRvb2xzLicsXG4gICAgICAgICAgICBkZW55OiAnQ2xhdWRlIENvZGUgd2lsbCBhbHdheXMgcmVqZWN0IHJlcXVlc3RzIHRvIHVzZSBkZW5pZWQgdG9vbHMuJyxcbiAgICAgICAgICB9W3RhYl1cbiAgICAgICAgfVxuICAgICAgPC9UZXh0PlxuICAgICAgPFJ1bGVzVGFiQ29udGVudFxuICAgICAgICBvcHRpb25zPXtnZXRSdWxlc09wdGlvbnModGFiLCBydWxlc1Byb3BzLnNlYXJjaFF1ZXJ5KS5vcHRpb25zfVxuICAgICAgICBvblNlbGVjdD17diA9PiBoYW5kbGVUb29sU2VsZWN0KHYsIHRhYil9XG4gICAgICAgIHsuLi5ydWxlc1Byb3BzfVxuICAgICAgLz5cbiAgICA8L0JveD5cbiAgKVxufVxuXG50eXBlIFByb3BzID0ge1xuICBvbkV4aXQ6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheVxuICAgICAgc2hvdWxkUXVlcnk/OiBib29sZWFuXG4gICAgICBtZXRhTWVzc2FnZXM/OiBzdHJpbmdbXVxuICAgIH0sXG4gICkgPT4gdm9pZFxuICBpbml0aWFsVGFiPzogVGFiVHlwZVxuICBvblJldHJ5RGVuaWFscz86IChjb21tYW5kczogc3RyaW5nW10pID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFBlcm1pc3Npb25SdWxlTGlzdCh7XG4gIG9uRXhpdCxcbiAgaW5pdGlhbFRhYixcbiAgb25SZXRyeURlbmlhbHMsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGhhc0RlbmlhbHMgPSBnZXRBdXRvTW9kZURlbmlhbHMoKS5sZW5ndGggPiAwXG4gIGNvbnN0IGRlZmF1bHRUYWI6IFRhYlR5cGUgPSBpbml0aWFsVGFiID8/IChoYXNEZW5pYWxzID8gJ3JlY2VudCcgOiAnYWxsb3cnKVxuICBjb25zdCBbY2hhbmdlcywgc2V0Q2hhbmdlc10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pXG4gIGNvbnN0IHRvb2xQZXJtaXNzaW9uQ29udGV4dCA9IHVzZUFwcFN0YXRlKHMgPT4gcy50b29sUGVybWlzc2lvbkNvbnRleHQpXG4gIGNvbnN0IHNldEFwcFN0YXRlID0gdXNlU2V0QXBwU3RhdGUoKVxuICBjb25zdCBpc1Rlcm1pbmFsRm9jdXNlZCA9IHVzZVRlcm1pbmFsRm9jdXMoKVxuXG4gIC8vIFJlZiBub3Qgc3RhdGU6IFJlY2VudERlbmlhbHNUYWIgdXBkYXRlcyBkb24ndCBuZWVkIHRvIHRyaWdnZXIgcGFyZW50XG4gIC8vIHJlLXJlbmRlciAob25seSByZWFkIG9uIGV4aXQpLCBhbmQgcmUtcmVuZGVycyB0cmlwIHRoZSBtb2RhbCBTY3JvbGxCb3hcbiAgLy8gY29sbGFwc2UgYnVnIGZyb20gIzIzNTkyIGluIGZ1bGxzY3JlZW4uXG4gIGNvbnN0IGRlbmlhbFN0YXRlUmVmID0gdXNlUmVmPHtcbiAgICBhcHByb3ZlZDogU2V0PG51bWJlcj5cbiAgICByZXRyeTogU2V0PG51bWJlcj5cbiAgICBkZW5pYWxzOiByZWFkb25seSBBdXRvTW9kZURlbmlhbFtdXG4gIH0+KHsgYXBwcm92ZWQ6IG5ldyBTZXQoKSwgcmV0cnk6IG5ldyBTZXQoKSwgZGVuaWFsczogW10gfSlcbiAgY29uc3QgaGFuZGxlRGVuaWFsU3RhdGVDaGFuZ2UgPSB1c2VDYWxsYmFjayhcbiAgICAoczogdHlwZW9mIGRlbmlhbFN0YXRlUmVmLmN1cnJlbnQpID0+IHtcbiAgICAgIGRlbmlhbFN0YXRlUmVmLmN1cnJlbnQgPSBzXG4gICAgfSxcbiAgICBbXSxcbiAgKVxuXG4gIGNvbnN0IFtzZWxlY3RlZFJ1bGUsIHNldFNlbGVjdGVkUnVsZV0gPSB1c2VTdGF0ZTxQZXJtaXNzaW9uUnVsZSB8IHVuZGVmaW5lZD4oKVxuICAvLyBUcmFjayB0aGUga2V5IG9mIHRoZSBsYXN0IGZvY3VzZWQgcnVsZSB0byByZXN0b3JlIHBvc2l0aW9uIGFmdGVyIGRlbGV0aW9uXG4gIGNvbnN0IFtsYXN0Rm9jdXNlZFJ1bGVLZXksIHNldExhc3RGb2N1c2VkUnVsZUtleV0gPSB1c2VTdGF0ZTxcbiAgICBzdHJpbmcgfCB1bmRlZmluZWRcbiAgPigpXG4gIGNvbnN0IFthZGRpbmdSdWxlVG9UYWIsIHNldEFkZGluZ1J1bGVUb1RhYl0gPSB1c2VTdGF0ZTxUYWJUeXBlIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3ZhbGlkYXRlZFJ1bGUsIHNldFZhbGlkYXRlZFJ1bGVdID0gdXNlU3RhdGU8e1xuICAgIHJ1bGVCZWhhdmlvcjogUGVybWlzc2lvbkJlaGF2aW9yXG4gICAgcnVsZVZhbHVlOiBQZXJtaXNzaW9uUnVsZVZhbHVlXG4gIH0gfCBudWxsPihudWxsKVxuICBjb25zdCBbaXNBZGRpbmdXb3Jrc3BhY2VEaXJlY3RvcnksIHNldElzQWRkaW5nV29ya3NwYWNlRGlyZWN0b3J5XSA9XG4gICAgdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtyZW1vdmluZ0RpcmVjdG9yeSwgc2V0UmVtb3ZpbmdEaXJlY3RvcnldID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4oXG4gICAgbnVsbCxcbiAgKVxuICBjb25zdCBbaXNTZWFyY2hNb2RlLCBzZXRJc1NlYXJjaE1vZGVdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IFtoZWFkZXJGb2N1c2VkLCBzZXRIZWFkZXJGb2N1c2VkXSA9IHVzZVN0YXRlKHRydWUpXG4gIGNvbnN0IGhhbmRsZUhlYWRlckZvY3VzQ2hhbmdlID0gdXNlQ2FsbGJhY2soKGZvY3VzZWQ6IGJvb2xlYW4pID0+IHtcbiAgICBzZXRIZWFkZXJGb2N1c2VkKGZvY3VzZWQpXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGFsbG93UnVsZXNCeUtleSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBQZXJtaXNzaW9uUnVsZT4oKVxuICAgIGdldEFsbG93UnVsZXModG9vbFBlcm1pc3Npb25Db250ZXh0KS5mb3JFYWNoKHJ1bGUgPT4ge1xuICAgICAgbWFwLnNldChqc29uU3RyaW5naWZ5KHJ1bGUpLCBydWxlKVxuICAgIH0pXG4gICAgcmV0dXJuIG1hcFxuICB9LCBbdG9vbFBlcm1pc3Npb25Db250ZXh0XSlcblxuICBjb25zdCBkZW55UnVsZXNCeUtleSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBQZXJtaXNzaW9uUnVsZT4oKVxuICAgIGdldERlbnlSdWxlcyh0b29sUGVybWlzc2lvbkNvbnRleHQpLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICBtYXAuc2V0KGpzb25TdHJpbmdpZnkocnVsZSksIHJ1bGUpXG4gICAgfSlcbiAgICByZXR1cm4gbWFwXG4gIH0sIFt0b29sUGVybWlzc2lvbkNvbnRleHRdKVxuXG4gIGNvbnN0IGFza1J1bGVzQnlLZXkgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBtYXAgPSBuZXcgTWFwPHN0cmluZywgUGVybWlzc2lvblJ1bGU+KClcbiAgICBnZXRBc2tSdWxlcyh0b29sUGVybWlzc2lvbkNvbnRleHQpLmZvckVhY2gocnVsZSA9PiB7XG4gICAgICBtYXAuc2V0KGpzb25TdHJpbmdpZnkocnVsZSksIHJ1bGUpXG4gICAgfSlcbiAgICByZXR1cm4gbWFwXG4gIH0sIFt0b29sUGVybWlzc2lvbkNvbnRleHRdKVxuXG4gIGNvbnN0IGdldFJ1bGVzT3B0aW9ucyA9IHVzZUNhbGxiYWNrKFxuICAgICh0YWI6IFRhYlR5cGUsIHF1ZXJ5OiBzdHJpbmcgPSAnJykgPT4ge1xuICAgICAgY29uc3QgcnVsZXNCeUtleSA9ICgoKSA9PiB7XG4gICAgICAgIHN3aXRjaCAodGFiKSB7XG4gICAgICAgICAgY2FzZSAnYWxsb3cnOlxuICAgICAgICAgICAgcmV0dXJuIGFsbG93UnVsZXNCeUtleVxuICAgICAgICAgIGNhc2UgJ2RlbnknOlxuICAgICAgICAgICAgcmV0dXJuIGRlbnlSdWxlc0J5S2V5XG4gICAgICAgICAgY2FzZSAnYXNrJzpcbiAgICAgICAgICAgIHJldHVybiBhc2tSdWxlc0J5S2V5XG4gICAgICAgICAgY2FzZSAnd29ya3NwYWNlJzpcbiAgICAgICAgICBjYXNlICdyZWNlbnQnOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXA8c3RyaW5nLCBQZXJtaXNzaW9uUnVsZT4oKVxuICAgICAgICB9XG4gICAgICB9KSgpXG5cbiAgICAgIGNvbnN0IG9wdGlvbnM6IE9wdGlvbltdID0gW11cblxuICAgICAgLy8gT25seSBzaG93IFwiQWRkIGEgbmV3IHJ1bGVcIiBmb3IgYWxsb3cgYW5kIGRlbnkgdGFicyAoYW5kIG5vdCB3aGVuIHNlYXJjaGluZylcbiAgICAgIGlmICh0YWIgIT09ICd3b3Jrc3BhY2UnICYmIHRhYiAhPT0gJ3JlY2VudCcgJiYgIXF1ZXJ5KSB7XG4gICAgICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICAgICAgbGFiZWw6IGBBZGQgYSBuZXcgcnVsZSR7ZmlndXJlcy5lbGxpcHNpc31gLFxuICAgICAgICAgIHZhbHVlOiAnYWRkLW5ldy1ydWxlJyxcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IGFsbCBydWxlIGtleXMgYW5kIHNvcnQgdGhlbSBhbHBoYWJldGljYWxseSBiYXNlZCBvbiBydWxlJ3MgZm9ybWF0dGVkIHZhbHVlXG4gICAgICBjb25zdCBzb3J0ZWRSdWxlS2V5cyA9IEFycmF5LmZyb20ocnVsZXNCeUtleS5rZXlzKCkpLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgY29uc3QgcnVsZUEgPSBydWxlc0J5S2V5LmdldChhKVxuICAgICAgICBjb25zdCBydWxlQiA9IHJ1bGVzQnlLZXkuZ2V0KGIpXG4gICAgICAgIGlmIChydWxlQSAmJiBydWxlQikge1xuICAgICAgICAgIGNvbnN0IHJ1bGVBU3RyaW5nID0gcGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKFxuICAgICAgICAgICAgcnVsZUEucnVsZVZhbHVlLFxuICAgICAgICAgICkudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIGNvbnN0IHJ1bGVCU3RyaW5nID0gcGVybWlzc2lvblJ1bGVWYWx1ZVRvU3RyaW5nKFxuICAgICAgICAgICAgcnVsZUIucnVsZVZhbHVlLFxuICAgICAgICAgICkudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIHJldHVybiBydWxlQVN0cmluZy5sb2NhbGVDb21wYXJlKHJ1bGVCU3RyaW5nKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9KVxuXG4gICAgICAvLyBCdWlsZCBvcHRpb25zIGZyb20gc29ydGVkIGtleXMsIGZpbHRlcmluZyBieSBzZWFyY2ggcXVlcnlcbiAgICAgIGNvbnN0IGxvd2VyUXVlcnkgPSBxdWVyeS50b0xvd2VyQ2FzZSgpXG4gICAgICBmb3IgKGNvbnN0IHJ1bGVLZXkgb2Ygc29ydGVkUnVsZUtleXMpIHtcbiAgICAgICAgY29uc3QgcnVsZSA9IHJ1bGVzQnlLZXkuZ2V0KHJ1bGVLZXkpXG4gICAgICAgIGlmIChydWxlKSB7XG4gICAgICAgICAgY29uc3QgcnVsZVN0cmluZyA9IHBlcm1pc3Npb25SdWxlVmFsdWVUb1N0cmluZyhydWxlLnJ1bGVWYWx1ZSlcbiAgICAgICAgICAvLyBGaWx0ZXIgYnkgc2VhcmNoIHF1ZXJ5IGlmIHByb3ZpZGVkXG4gICAgICAgICAgaWYgKHF1ZXJ5ICYmICFydWxlU3RyaW5nLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMobG93ZXJRdWVyeSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIG9wdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogcnVsZVN0cmluZyxcbiAgICAgICAgICAgIHZhbHVlOiBydWxlS2V5LFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHsgb3B0aW9ucywgcnVsZXNCeUtleSB9XG4gICAgfSxcbiAgICBbYWxsb3dSdWxlc0J5S2V5LCBkZW55UnVsZXNCeUtleSwgYXNrUnVsZXNCeUtleV0sXG4gIClcblxuICBjb25zdCBleGl0U3RhdGUgPSB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuXG4gIGNvbnN0IGlzU2VhcmNoTW9kZUFjdGl2ZSA9XG4gICAgIXNlbGVjdGVkUnVsZSAmJlxuICAgICFhZGRpbmdSdWxlVG9UYWIgJiZcbiAgICAhdmFsaWRhdGVkUnVsZSAmJlxuICAgICFpc0FkZGluZ1dvcmtzcGFjZURpcmVjdG9yeSAmJlxuICAgICFyZW1vdmluZ0RpcmVjdG9yeVxuXG4gIGNvbnN0IHtcbiAgICBxdWVyeTogc2VhcmNoUXVlcnksXG4gICAgc2V0UXVlcnk6IHNldFNlYXJjaFF1ZXJ5LFxuICAgIGN1cnNvck9mZnNldDogc2VhcmNoQ3Vyc29yT2Zmc2V0LFxuICB9ID0gdXNlU2VhcmNoSW5wdXQoe1xuICAgIGlzQWN0aXZlOiBpc1NlYXJjaE1vZGVBY3RpdmUgJiYgaXNTZWFyY2hNb2RlLFxuICAgIG9uRXhpdDogKCkgPT4ge1xuICAgICAgc2V0SXNTZWFyY2hNb2RlKGZhbHNlKVxuICAgIH0sXG4gIH0pXG5cbiAgLy8gSGFuZGxlIGVudGVyaW5nIHNlYXJjaCBtb2RlXG4gIGNvbnN0IGhhbmRsZUtleURvd24gPSB1c2VDYWxsYmFjayhcbiAgICAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgaWYgKCFpc1NlYXJjaE1vZGVBY3RpdmUpIHJldHVyblxuICAgICAgaWYgKGlzU2VhcmNoTW9kZSkgcmV0dXJuXG4gICAgICBpZiAoZS5jdHJsIHx8IGUubWV0YSkgcmV0dXJuXG5cbiAgICAgIC8vIEVudGVyIHNlYXJjaCBtb2RlIHdpdGggJy8nIG9yIGFueSBwcmludGFibGUgY2hhcmFjdGVyLlxuICAgICAgLy8gZS5rZXkubGVuZ3RoID09PSAxIGZpbHRlcnMgb3V0IHNwZWNpYWwga2V5cyAoZG93biwgcmV0dXJuLCBlc2NhcGUsXG4gICAgICAvLyBldGMuKSDigJQgcHJldmlvdXNseSB0aGUgcmF3IGVzY2FwZSBzZXF1ZW5jZSBsZWFrZWQgdGhyb3VnaCBhbmRcbiAgICAgIC8vIHRyaWdnZXJlZCBzZWFyY2ggbW9kZSB3aXRoIGdhcmJhZ2Ugb24gYXJyb3cta2V5IHByZXNzLlxuICAgICAgaWYgKGUua2V5ID09PSAnLycpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHNldElzU2VhcmNoTW9kZSh0cnVlKVxuICAgICAgICBzZXRTZWFyY2hRdWVyeSgnJylcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGUua2V5Lmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAvLyBEb24ndCBlbnRlciBzZWFyY2ggbW9kZSBmb3IgdmltLW5hdiAvIHNwYWNlIC8gcmV0cnkga2V5XG4gICAgICAgIGUua2V5ICE9PSAnaicgJiZcbiAgICAgICAgZS5rZXkgIT09ICdrJyAmJlxuICAgICAgICBlLmtleSAhPT0gJ20nICYmXG4gICAgICAgIGUua2V5ICE9PSAnaScgJiZcbiAgICAgICAgZS5rZXkgIT09ICdyJyAmJlxuICAgICAgICBlLmtleSAhPT0gJyAnXG4gICAgICApIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHNldElzU2VhcmNoTW9kZSh0cnVlKVxuICAgICAgICBzZXRTZWFyY2hRdWVyeShlLmtleSlcbiAgICAgIH1cbiAgICB9LFxuICAgIFtpc1NlYXJjaE1vZGVBY3RpdmUsIGlzU2VhcmNoTW9kZSwgc2V0U2VhcmNoUXVlcnldLFxuICApXG5cbiAgY29uc3QgaGFuZGxlVG9vbFNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgIChzZWxlY3RlZFZhbHVlOiBzdHJpbmcsIHRhYjogVGFiVHlwZSkgPT4ge1xuICAgICAgY29uc3QgeyBydWxlc0J5S2V5IH0gPSBnZXRSdWxlc09wdGlvbnModGFiKVxuICAgICAgaWYgKHNlbGVjdGVkVmFsdWUgPT09ICdhZGQtbmV3LXJ1bGUnKSB7XG4gICAgICAgIHNldEFkZGluZ1J1bGVUb1RhYih0YWIpXG4gICAgICAgIHJldHVyblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U2VsZWN0ZWRSdWxlKHJ1bGVzQnlLZXkuZ2V0KHNlbGVjdGVkVmFsdWUpKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9LFxuICAgIFtnZXRSdWxlc09wdGlvbnNdLFxuICApXG5cbiAgY29uc3QgaGFuZGxlUnVsZUlucHV0Q2FuY2VsID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHNldEFkZGluZ1J1bGVUb1RhYihudWxsKVxuICB9LCBbXSlcblxuICBjb25zdCBoYW5kbGVSdWxlSW5wdXRTdWJtaXQgPSB1c2VDYWxsYmFjayhcbiAgICAocnVsZVZhbHVlOiBQZXJtaXNzaW9uUnVsZVZhbHVlLCBydWxlQmVoYXZpb3I6IFBlcm1pc3Npb25CZWhhdmlvcikgPT4ge1xuICAgICAgc2V0VmFsaWRhdGVkUnVsZSh7IHJ1bGVWYWx1ZSwgcnVsZUJlaGF2aW9yIH0pXG4gICAgICBzZXRBZGRpbmdSdWxlVG9UYWIobnVsbClcbiAgICB9LFxuICAgIFtdLFxuICApXG5cbiAgY29uc3QgaGFuZGxlQWRkUnVsZXNTdWNjZXNzID0gdXNlQ2FsbGJhY2soXG4gICAgKHJ1bGVzOiBQZXJtaXNzaW9uUnVsZVtdLCB1bnJlYWNoYWJsZT86IFVucmVhY2hhYmxlUnVsZVtdKSA9PiB7XG4gICAgICBzZXRWYWxpZGF0ZWRSdWxlKG51bGwpXG4gICAgICBmb3IgKGNvbnN0IHJ1bGUgb2YgcnVsZXMpIHtcbiAgICAgICAgc2V0Q2hhbmdlcyhwcmV2ID0+IFtcbiAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgIGBBZGRlZCAke3J1bGUucnVsZUJlaGF2aW9yfSBydWxlICR7Y2hhbGsuYm9sZChwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmcocnVsZS5ydWxlVmFsdWUpKX1gLFxuICAgICAgICBdKVxuICAgICAgfVxuXG4gICAgICAvLyBTaG93IHdhcm5pbmdzIGZvciBhbnkgdW5yZWFjaGFibGUgcnVsZXMgd2UganVzdCBhZGRlZFxuICAgICAgaWYgKHVucmVhY2hhYmxlICYmIHVucmVhY2hhYmxlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChjb25zdCB1IG9mIHVucmVhY2hhYmxlKSB7XG4gICAgICAgICAgY29uc3Qgc2V2ZXJpdHkgPSB1LnNoYWRvd1R5cGUgPT09ICdkZW55JyA/ICdibG9ja2VkJyA6ICdzaGFkb3dlZCdcbiAgICAgICAgICBzZXRDaGFuZ2VzKHByZXYgPT4gW1xuICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgIGNoYWxrLnllbGxvdyhcbiAgICAgICAgICAgICAgYCR7ZmlndXJlcy53YXJuaW5nfSBXYXJuaW5nOiAke3Blcm1pc3Npb25SdWxlVmFsdWVUb1N0cmluZyh1LnJ1bGUucnVsZVZhbHVlKX0gaXMgJHtzZXZlcml0eX1gLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIGNoYWxrLmRpbShgICAke3UucmVhc29ufWApLFxuICAgICAgICAgICAgY2hhbGsuZGltKGAgIEZpeDogJHt1LmZpeH1gKSxcbiAgICAgICAgICBdKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBbXSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZUFkZFJ1bGVDYW5jZWwgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgc2V0VmFsaWRhdGVkUnVsZShudWxsKVxuICB9LCBbXSlcblxuICBjb25zdCBoYW5kbGVSZXF1ZXN0QWRkRGlyZWN0b3J5ID0gdXNlQ2FsbGJhY2soXG4gICAgKCkgPT4gc2V0SXNBZGRpbmdXb3Jrc3BhY2VEaXJlY3RvcnkodHJ1ZSksXG4gICAgW10sXG4gIClcbiAgY29uc3QgaGFuZGxlUmVxdWVzdFJlbW92ZURpcmVjdG9yeSA9IHVzZUNhbGxiYWNrKFxuICAgIChwYXRoOiBzdHJpbmcpID0+IHNldFJlbW92aW5nRGlyZWN0b3J5KHBhdGgpLFxuICAgIFtdLFxuICApXG4gIGNvbnN0IGhhbmRsZVJ1bGVzQ2FuY2VsID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGNvbnN0IHMgPSBkZW5pYWxTdGF0ZVJlZi5jdXJyZW50XG4gICAgY29uc3QgZGVuaWFsc0ZvciA9IChzZXQ6IFNldDxudW1iZXI+KSA9PlxuICAgICAgQXJyYXkuZnJvbShzZXQpXG4gICAgICAgIC5tYXAoaWR4ID0+IHMuZGVuaWFsc1tpZHhdKVxuICAgICAgICAuZmlsdGVyKChkKTogZCBpcyBBdXRvTW9kZURlbmlhbCA9PiBkICE9PSB1bmRlZmluZWQpXG5cbiAgICBjb25zdCByZXRyeURlbmlhbHMgPSBkZW5pYWxzRm9yKHMucmV0cnkpXG4gICAgaWYgKHJldHJ5RGVuaWFscy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBjb21tYW5kcyA9IHJldHJ5RGVuaWFscy5tYXAoZCA9PiBkLmRpc3BsYXkpXG4gICAgICBvblJldHJ5RGVuaWFscz8uKGNvbW1hbmRzKVxuICAgICAgb25FeGl0KHVuZGVmaW5lZCwge1xuICAgICAgICBzaG91bGRRdWVyeTogdHJ1ZSxcbiAgICAgICAgbWV0YU1lc3NhZ2VzOiBbXG4gICAgICAgICAgYFBlcm1pc3Npb24gZ3JhbnRlZCBmb3I6ICR7Y29tbWFuZHMuam9pbignLCAnKX0uIFlvdSBtYXkgbm93IHJldHJ5ICR7Y29tbWFuZHMubGVuZ3RoID09PSAxID8gJ3RoaXMgY29tbWFuZCcgOiAndGhlc2UgY29tbWFuZHMnfSBpZiB5b3Ugd291bGQgbGlrZS5gLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGFwcHJvdmVkRGVuaWFscyA9IGRlbmlhbHNGb3Iocy5hcHByb3ZlZClcbiAgICBpZiAoYXBwcm92ZWREZW5pYWxzLmxlbmd0aCA+IDAgfHwgY2hhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBhcHByb3ZlZE1zZyA9XG4gICAgICAgIGFwcHJvdmVkRGVuaWFscy5sZW5ndGggPiAwXG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIGBBcHByb3ZlZCAke2FwcHJvdmVkRGVuaWFscy5tYXAoZCA9PiBjaGFsay5ib2xkKGQuZGlzcGxheSkpLmpvaW4oJywgJyl9YCxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IFtdXG4gICAgICBvbkV4aXQoWy4uLmFwcHJvdmVkTXNnLCAuLi5jaGFuZ2VzXS5qb2luKCdcXG4nKSlcbiAgICB9IGVsc2Uge1xuICAgICAgb25FeGl0KCdQZXJtaXNzaW9ucyBkaWFsb2cgZGlzbWlzc2VkJywge1xuICAgICAgICBkaXNwbGF5OiAnc3lzdGVtJyxcbiAgICAgIH0pXG4gICAgfVxuICB9LCBbY2hhbmdlcywgb25FeGl0LCBvblJldHJ5RGVuaWFsc10pXG5cbiAgLy8gSGFuZGxlIEVzY2FwZSBhdCB0aGUgdG9wIGxldmVsIHNvIGl0IHdvcmtzIGV2ZW4gd2hlbiBoZWFkZXIgaXMgZm9jdXNlZFxuICAvLyAod2hpY2ggZGlzYWJsZXMgdGhlIFNlbGVjdCBjb21wb25lbnQgYW5kIGl0cyBzZWxlY3Q6Y2FuY2VsIGtleWJpbmRpbmcpLlxuICAvLyBNaXJyb3JzIHRoZSBwYXR0ZXJuIGluIFNldHRpbmdzLnRzeC5cbiAgdXNlS2V5YmluZGluZygnY29uZmlybTpubycsIGhhbmRsZVJ1bGVzQ2FuY2VsLCB7XG4gICAgY29udGV4dDogJ1NldHRpbmdzJyxcbiAgICBpc0FjdGl2ZTogaXNTZWFyY2hNb2RlQWN0aXZlICYmICFpc1NlYXJjaE1vZGUsXG4gIH0pXG5cbiAgY29uc3QgaGFuZGxlRGVsZXRlUnVsZSA9ICgpID0+IHtcbiAgICBpZiAoIXNlbGVjdGVkUnVsZSkgcmV0dXJuXG5cbiAgICAvLyBGaW5kIHRoZSBhZGphY2VudCBydWxlIHRvIGZvY3VzIG9uIGFmdGVyIGRlbGV0aW9uXG4gICAgY29uc3QgeyBvcHRpb25zIH0gPSBnZXRSdWxlc09wdGlvbnMoc2VsZWN0ZWRSdWxlLnJ1bGVCZWhhdmlvciBhcyBUYWJUeXBlKVxuICAgIGNvbnN0IHNlbGVjdGVkS2V5ID0ganNvblN0cmluZ2lmeShzZWxlY3RlZFJ1bGUpXG4gICAgY29uc3QgcnVsZUtleXMgPSBvcHRpb25zXG4gICAgICAuZmlsdGVyKG9wdCA9PiBvcHQudmFsdWUgIT09ICdhZGQtbmV3LXJ1bGUnKVxuICAgICAgLm1hcChvcHQgPT4gb3B0LnZhbHVlKVxuICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHJ1bGVLZXlzLmluZGV4T2Yoc2VsZWN0ZWRLZXkpXG5cbiAgICAvLyBUcnkgdG8gZm9jdXMgb24gdGhlIG5leHQgcnVsZSwgb3IgdGhlIHByZXZpb3VzIGlmIGRlbGV0aW5nIHRoZSBsYXN0IG9uZVxuICAgIGxldCBuZXh0Rm9jdXNLZXk6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgIGlmIChjdXJyZW50SW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoY3VycmVudEluZGV4IDwgcnVsZUtleXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAvLyBGb2N1cyBvbiB0aGUgbmV4dCBydWxlXG4gICAgICAgIG5leHRGb2N1c0tleSA9IHJ1bGVLZXlzW2N1cnJlbnRJbmRleCArIDFdXG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbmRleCA+IDApIHtcbiAgICAgICAgLy8gRm9jdXMgb24gdGhlIHByZXZpb3VzIHJ1bGUgKHdlJ3JlIGRlbGV0aW5nIHRoZSBsYXN0IG9uZSlcbiAgICAgICAgbmV4dEZvY3VzS2V5ID0gcnVsZUtleXNbY3VycmVudEluZGV4IC0gMV1cbiAgICAgIH1cbiAgICB9XG4gICAgc2V0TGFzdEZvY3VzZWRSdWxlS2V5KG5leHRGb2N1c0tleSlcblxuICAgIHZvaWQgZGVsZXRlUGVybWlzc2lvblJ1bGUoe1xuICAgICAgcnVsZTogc2VsZWN0ZWRSdWxlLFxuICAgICAgaW5pdGlhbENvbnRleHQ6IHRvb2xQZXJtaXNzaW9uQ29udGV4dCxcbiAgICAgIHNldFRvb2xQZXJtaXNzaW9uQ29udGV4dCh0b29sUGVybWlzc2lvbkNvbnRleHQpIHtcbiAgICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiAoe1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgdG9vbFBlcm1pc3Npb25Db250ZXh0LFxuICAgICAgICB9KSlcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIHNldENoYW5nZXMocHJldiA9PiBbXG4gICAgICAuLi5wcmV2LFxuICAgICAgYERlbGV0ZWQgJHtzZWxlY3RlZFJ1bGUucnVsZUJlaGF2aW9yfSBydWxlICR7Y2hhbGsuYm9sZChwZXJtaXNzaW9uUnVsZVZhbHVlVG9TdHJpbmcoc2VsZWN0ZWRSdWxlLnJ1bGVWYWx1ZSkpfWAsXG4gICAgXSlcbiAgICBzZXRTZWxlY3RlZFJ1bGUodW5kZWZpbmVkKVxuICB9XG5cbiAgaWYgKHNlbGVjdGVkUnVsZSkge1xuICAgIHJldHVybiAoXG4gICAgICA8UnVsZURldGFpbHNcbiAgICAgICAgcnVsZT17c2VsZWN0ZWRSdWxlfVxuICAgICAgICBvbkRlbGV0ZT17aGFuZGxlRGVsZXRlUnVsZX1cbiAgICAgICAgb25DYW5jZWw9eygpID0+IHNldFNlbGVjdGVkUnVsZSh1bmRlZmluZWQpfVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICBpZiAoXG4gICAgYWRkaW5nUnVsZVRvVGFiICYmXG4gICAgYWRkaW5nUnVsZVRvVGFiICE9PSAnd29ya3NwYWNlJyAmJlxuICAgIGFkZGluZ1J1bGVUb1RhYiAhPT0gJ3JlY2VudCdcbiAgKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxQZXJtaXNzaW9uUnVsZUlucHV0XG4gICAgICAgIG9uQ2FuY2VsPXtoYW5kbGVSdWxlSW5wdXRDYW5jZWx9XG4gICAgICAgIG9uU3VibWl0PXtoYW5kbGVSdWxlSW5wdXRTdWJtaXR9XG4gICAgICAgIHJ1bGVCZWhhdmlvcj17YWRkaW5nUnVsZVRvVGFifVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICBpZiAodmFsaWRhdGVkUnVsZSkge1xuICAgIHJldHVybiAoXG4gICAgICA8QWRkUGVybWlzc2lvblJ1bGVzXG4gICAgICAgIG9uQWRkUnVsZXM9e2hhbmRsZUFkZFJ1bGVzU3VjY2Vzc31cbiAgICAgICAgb25DYW5jZWw9e2hhbmRsZUFkZFJ1bGVDYW5jZWx9XG4gICAgICAgIHJ1bGVWYWx1ZXM9e1t2YWxpZGF0ZWRSdWxlLnJ1bGVWYWx1ZV19XG4gICAgICAgIHJ1bGVCZWhhdmlvcj17dmFsaWRhdGVkUnVsZS5ydWxlQmVoYXZpb3J9XG4gICAgICAgIGluaXRpYWxDb250ZXh0PXt0b29sUGVybWlzc2lvbkNvbnRleHR9XG4gICAgICAgIHNldFRvb2xQZXJtaXNzaW9uQ29udGV4dD17dG9vbFBlcm1pc3Npb25Db250ZXh0ID0+IHtcbiAgICAgICAgICBzZXRBcHBTdGF0ZShwcmV2ID0+ICh7XG4gICAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgICAgdG9vbFBlcm1pc3Npb25Db250ZXh0LFxuICAgICAgICAgIH0pKVxuICAgICAgICB9fVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICBpZiAoaXNBZGRpbmdXb3Jrc3BhY2VEaXJlY3RvcnkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEFkZFdvcmtzcGFjZURpcmVjdG9yeVxuICAgICAgICBvbkFkZERpcmVjdG9yeT17KHBhdGgsIHJlbWVtYmVyKSA9PiB7XG4gICAgICAgICAgLy8gQXBwbHkgdGhlIHBlcm1pc3Npb24gdXBkYXRlIHRvIGFkZCB0aGUgZGlyZWN0b3J5XG4gICAgICAgICAgY29uc3QgZGVzdGluYXRpb246IFBlcm1pc3Npb25VcGRhdGVEZXN0aW5hdGlvbiA9IHJlbWVtYmVyXG4gICAgICAgICAgICA/ICdsb2NhbFNldHRpbmdzJ1xuICAgICAgICAgICAgOiAnc2Vzc2lvbidcblxuICAgICAgICAgIGNvbnN0IHBlcm1pc3Npb25VcGRhdGUgPSB7XG4gICAgICAgICAgICB0eXBlOiAnYWRkRGlyZWN0b3JpZXMnIGFzIGNvbnN0LFxuICAgICAgICAgICAgZGlyZWN0b3JpZXM6IFtwYXRoXSxcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHVwZGF0ZWRDb250ZXh0ID0gYXBwbHlQZXJtaXNzaW9uVXBkYXRlKFxuICAgICAgICAgICAgdG9vbFBlcm1pc3Npb25Db250ZXh0LFxuICAgICAgICAgICAgcGVybWlzc2lvblVwZGF0ZSxcbiAgICAgICAgICApXG4gICAgICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiAoe1xuICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgIHRvb2xQZXJtaXNzaW9uQ29udGV4dDogdXBkYXRlZENvbnRleHQsXG4gICAgICAgICAgfSkpXG5cbiAgICAgICAgICAvLyBQZXJzaXN0IGlmIHJlbWVtYmVyIGlzIHRydWVcbiAgICAgICAgICBpZiAocmVtZW1iZXIpIHtcbiAgICAgICAgICAgIHBlcnNpc3RQZXJtaXNzaW9uVXBkYXRlKHBlcm1pc3Npb25VcGRhdGUpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2V0Q2hhbmdlcyhwcmV2ID0+IFtcbiAgICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgICBgQWRkZWQgZGlyZWN0b3J5ICR7Y2hhbGsuYm9sZChwYXRoKX0gdG8gd29ya3NwYWNlJHtyZW1lbWJlciA/ICcgYW5kIHNhdmVkIHRvIGxvY2FsIHNldHRpbmdzJyA6ICcgZm9yIHRoaXMgc2Vzc2lvbid9YCxcbiAgICAgICAgICBdKVxuICAgICAgICAgIHNldElzQWRkaW5nV29ya3NwYWNlRGlyZWN0b3J5KGZhbHNlKVxuICAgICAgICB9fVxuICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0SXNBZGRpbmdXb3Jrc3BhY2VEaXJlY3RvcnkoZmFsc2UpfVxuICAgICAgICBwZXJtaXNzaW9uQ29udGV4dD17dG9vbFBlcm1pc3Npb25Db250ZXh0fVxuICAgICAgLz5cbiAgICApXG4gIH1cblxuICBpZiAocmVtb3ZpbmdEaXJlY3RvcnkpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPFJlbW92ZVdvcmtzcGFjZURpcmVjdG9yeVxuICAgICAgICBkaXJlY3RvcnlQYXRoPXtyZW1vdmluZ0RpcmVjdG9yeX1cbiAgICAgICAgb25SZW1vdmU9eygpID0+IHtcbiAgICAgICAgICBzZXRDaGFuZ2VzKHByZXYgPT4gW1xuICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgIGBSZW1vdmVkIGRpcmVjdG9yeSAke2NoYWxrLmJvbGQocmVtb3ZpbmdEaXJlY3RvcnkpfSBmcm9tIHdvcmtzcGFjZWAsXG4gICAgICAgICAgXSlcbiAgICAgICAgICBzZXRSZW1vdmluZ0RpcmVjdG9yeShudWxsKVxuICAgICAgICB9fVxuICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0UmVtb3ZpbmdEaXJlY3RvcnkobnVsbCl9XG4gICAgICAgIHBlcm1pc3Npb25Db250ZXh0PXt0b29sUGVybWlzc2lvbkNvbnRleHR9XG4gICAgICAgIHNldFBlcm1pc3Npb25Db250ZXh0PXt0b29sUGVybWlzc2lvbkNvbnRleHQgPT4ge1xuICAgICAgICAgIHNldEFwcFN0YXRlKHByZXYgPT4gKHtcbiAgICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgICB0b29sUGVybWlzc2lvbkNvbnRleHQsXG4gICAgICAgICAgfSkpXG4gICAgICAgIH19XG4gICAgICAvPlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHNoYXJlZFJ1bGVzUHJvcHMgPSB7XG4gICAgc2VhcmNoUXVlcnksXG4gICAgaXNTZWFyY2hNb2RlLFxuICAgIGlzRm9jdXNlZDogaXNUZXJtaW5hbEZvY3VzZWQsXG4gICAgb25DYW5jZWw6IGhhbmRsZVJ1bGVzQ2FuY2VsLFxuICAgIGxhc3RGb2N1c2VkUnVsZUtleSxcbiAgICBjdXJzb3JPZmZzZXQ6IHNlYXJjaEN1cnNvck9mZnNldCxcbiAgICBnZXRSdWxlc09wdGlvbnMsXG4gICAgaGFuZGxlVG9vbFNlbGVjdCxcbiAgICBvbkhlYWRlckZvY3VzQ2hhbmdlOiBoYW5kbGVIZWFkZXJGb2N1c0NoYW5nZSxcbiAgfVxuXG4gIGNvbnN0IGlzSGlkZGVuID1cbiAgICAhIXNlbGVjdGVkUnVsZSB8fFxuICAgICEhYWRkaW5nUnVsZVRvVGFiIHx8XG4gICAgISF2YWxpZGF0ZWRSdWxlIHx8XG4gICAgaXNBZGRpbmdXb3Jrc3BhY2VEaXJlY3RvcnkgfHxcbiAgICAhIXJlbW92aW5nRGlyZWN0b3J5XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBvbktleURvd249e2hhbmRsZUtleURvd259PlxuICAgICAgPFBhbmUgY29sb3I9XCJwZXJtaXNzaW9uXCI+XG4gICAgICAgIDxUYWJzXG4gICAgICAgICAgdGl0bGU9XCJQZXJtaXNzaW9uczpcIlxuICAgICAgICAgIGNvbG9yPVwicGVybWlzc2lvblwiXG4gICAgICAgICAgZGVmYXVsdFRhYj17ZGVmYXVsdFRhYn1cbiAgICAgICAgICBoaWRkZW49e2lzSGlkZGVufVxuICAgICAgICAgIGluaXRpYWxIZWFkZXJGb2N1c2VkPXshaGFzRGVuaWFsc31cbiAgICAgICAgICBuYXZGcm9tQ29udGVudD17IWlzU2VhcmNoTW9kZX1cbiAgICAgICAgPlxuICAgICAgICAgIDxUYWIgaWQ9XCJyZWNlbnRcIiB0aXRsZT1cIlJlY2VudGx5IGRlbmllZFwiPlxuICAgICAgICAgICAgPFJlY2VudERlbmlhbHNUYWJcbiAgICAgICAgICAgICAgb25IZWFkZXJGb2N1c0NoYW5nZT17aGFuZGxlSGVhZGVyRm9jdXNDaGFuZ2V9XG4gICAgICAgICAgICAgIG9uU3RhdGVDaGFuZ2U9e2hhbmRsZURlbmlhbFN0YXRlQ2hhbmdlfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L1RhYj5cbiAgICAgICAgICA8VGFiIGlkPVwiYWxsb3dcIiB0aXRsZT1cIkFsbG93XCI+XG4gICAgICAgICAgICA8UGVybWlzc2lvblJ1bGVzVGFiIHRhYj1cImFsbG93XCIgey4uLnNoYXJlZFJ1bGVzUHJvcHN9IC8+XG4gICAgICAgICAgPC9UYWI+XG4gICAgICAgICAgPFRhYiBpZD1cImFza1wiIHRpdGxlPVwiQXNrXCI+XG4gICAgICAgICAgICA8UGVybWlzc2lvblJ1bGVzVGFiIHRhYj1cImFza1wiIHsuLi5zaGFyZWRSdWxlc1Byb3BzfSAvPlxuICAgICAgICAgIDwvVGFiPlxuICAgICAgICAgIDxUYWIgaWQ9XCJkZW55XCIgdGl0bGU9XCJEZW55XCI+XG4gICAgICAgICAgICA8UGVybWlzc2lvblJ1bGVzVGFiIHRhYj1cImRlbnlcIiB7Li4uc2hhcmVkUnVsZXNQcm9wc30gLz5cbiAgICAgICAgICA8L1RhYj5cbiAgICAgICAgICA8VGFiIGlkPVwid29ya3NwYWNlXCIgdGl0bGU9XCJXb3Jrc3BhY2VcIj5cbiAgICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgICBDbGF1ZGUgQ29kZSBjYW4gcmVhZCBmaWxlcyBpbiB0aGUgd29ya3NwYWNlLCBhbmQgbWFrZSBlZGl0cyB3aGVuXG4gICAgICAgICAgICAgICAgYXV0by1hY2NlcHQgZWRpdHMgaXMgb24uXG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPFdvcmtzcGFjZVRhYlxuICAgICAgICAgICAgICAgIG9uRXhpdD17b25FeGl0fVxuICAgICAgICAgICAgICAgIHRvb2xQZXJtaXNzaW9uQ29udGV4dD17dG9vbFBlcm1pc3Npb25Db250ZXh0fVxuICAgICAgICAgICAgICAgIG9uUmVxdWVzdEFkZERpcmVjdG9yeT17aGFuZGxlUmVxdWVzdEFkZERpcmVjdG9yeX1cbiAgICAgICAgICAgICAgICBvblJlcXVlc3RSZW1vdmVEaXJlY3Rvcnk9e2hhbmRsZVJlcXVlc3RSZW1vdmVEaXJlY3Rvcnl9XG4gICAgICAgICAgICAgICAgb25IZWFkZXJGb2N1c0NoYW5nZT17aGFuZGxlSGVhZGVyRm9jdXNDaGFuZ2V9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8L1RhYj5cbiAgICAgICAgPC9UYWJzPlxuICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0gcGFkZGluZ0xlZnQ9ezF9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAge2V4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgICAgICAgICAgICA8PlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvPlxuICAgICAgICAgICAgKSA6IGhlYWRlckZvY3VzZWQgPyAoXG4gICAgICAgICAgICAgIDw+4oaQL+KGkiB0YWIgc3dpdGNoIMK3IOKGkyByZXR1cm4gwrcgRXNjIGNhbmNlbDwvPlxuICAgICAgICAgICAgKSA6IGlzU2VhcmNoTW9kZSA/IChcbiAgICAgICAgICAgICAgPD5UeXBlIHRvIGZpbHRlciDCtyBFbnRlci/ihpMgc2VsZWN0IMK3IOKGkSB0YWJzIMK3IEVzYyBjbGVhcjwvPlxuICAgICAgICAgICAgKSA6IGhhc0RlbmlhbHMgJiYgZGVmYXVsdFRhYiA9PT0gJ3JlY2VudCcgPyAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgRW50ZXIgYXBwcm92ZSDCtyByIHJldHJ5IMK3IOKGkeKGkyBuYXZpZ2F0ZSDCtyDihpAv4oaSIHN3aXRjaCDCtyBFc2MgY2FuY2VsXG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICDihpHihpMgbmF2aWdhdGUgwrcgRW50ZXIgc2VsZWN0IMK3IFR5cGUgdG8gc2VhcmNoIMK3IOKGkC/ihpIgc3dpdGNoIMK3IEVzY1xuICAgICAgICAgICAgICAgIGNhbmNlbFxuICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgIDwvUGFuZT5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsT0FBT0MsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsT0FBTyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3pFLFNBQVNDLFdBQVcsRUFBRUMsY0FBYyxRQUFRLHVCQUF1QjtBQUNuRSxTQUNFQyxxQkFBcUIsRUFDckJDLHVCQUF1QixRQUNsQiwyQ0FBMkM7QUFDbEQsY0FBY0MsMkJBQTJCLFFBQVEsaURBQWlEO0FBQ2xHLGNBQWNDLG9CQUFvQixRQUFRLHNCQUFzQjtBQUNoRSxTQUFTQyxNQUFNLFFBQVEsNENBQTRDO0FBQ25FLFNBQVNDLDhCQUE4QixRQUFRLGtEQUFrRDtBQUNqRyxTQUFTQyxjQUFjLFFBQVEsa0NBQWtDO0FBQ2pFLGNBQWNDLGFBQWEsUUFBUSx1Q0FBdUM7QUFDMUUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLEVBQUVDLGdCQUFnQixRQUFRLGlCQUFpQjtBQUM3RCxTQUFTQyxhQUFhLFFBQVEsdUNBQXVDO0FBQ3JF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