// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useEffect, useRef } from 'react';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 isMaxSubscriber、isProSubscriber、isTeamSubscriber 工具函数，把通用处理留在 ../utils/auth.js 中维护。
import { isMaxSubscriber, isProSubscriber, isTeamSubscriber } from '../utils/auth.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
// 类型依赖 { EffortLevel } 来自 ../utils/effort.js，用于校准终端渲染的数据契约。
import type { EffortLevel } from '../utils/effort.js';
// 复用 convertEffortValueToLevel、getDefaultEffortForModel、getOpusDefaultEffortConfig、toPersistableEffort 工具函数，把通用处理留在 ../utils/effort.js 中维护。
import { convertEffortValueToLevel, getDefaultEffortForModel, getOpusDefaultEffortConfig, toPersistableEffort } from '../utils/effort.js';
// 复用 parseUserSpecifiedModel 工具函数，把通用处理留在 ../utils/model/model.js 中维护。
import { parseUserSpecifiedModel } from '../utils/model/model.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../utils/settings/settings.js';
// 类型依赖 { OptionWithDescription } 来自 ./CustomSelect/select.js，用于校准终端渲染的数据契约。
import type { OptionWithDescription } from './CustomSelect/select.js';
// 引入 Select，将 ./CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/select.js';
// 引入 effortLevelToSymbol，将 ./EffortIndicator.js 中已经封装好的能力接到本文件流程里。
import { effortLevelToSymbol } from './EffortIndicator.js';
// 引入 PermissionDialog，将 ./permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from './permissions/PermissionDialog.js';
// EffortCalloutSelection 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type EffortCalloutSelection = EffortLevel | undefined | 'dismiss';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  model: string;
  // 这个回调绑定到 onDone: (selection: EffortCalloutSelection) => void;，负责终端渲染在该局部场景下的响应。
  onDone: (selection: EffortCalloutSelection) => void;
};
// AUTO_DISMISS_MS 集合保存`30_000`，供后续判断或组装使用。
const AUTO_DISMISS_MS = 30_000;
// EffortCallout 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function EffortCallout(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(18);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    model,
    onDone
  } = t0;
  // t1 暂存 `getOpusDefaultEffortConfig()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getOpusDefaultEffortConfig()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getOpusDefaultEffortConfig();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // defaultEffortConfig 配置 命名 `t1`，让后续代码直接表达这个值的用途。
  const defaultEffortConfig = t1;
  // onDoneRef 引用保存`useRef`，供终端渲染后续处理使用。
  const onDoneRef = useRef(onDone);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onDone) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // current更新为 `onDone`，确保终端 UI后续读取最新状态。
      onDoneRef.current = onDone;
    };
    // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onDone;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 onDoneRef.current，触发终端渲染此处需要的副作用。
      onDoneRef.current("dismiss");
    };
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // handleCancel沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleCancel = t3;
  // t4 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [];
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(_temp, t4);
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `[handleCancel]` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // timeoutId保存`setTimeout`，供终端渲染后续处理使用。
      const timeoutId = setTimeout(handleCancel, AUTO_DISMISS_MS);
      // 返回 `() => clearTimeout(timeoutId)`，作为终端渲染这次计算的结果。
      return () => clearTimeout(timeoutId);
    };
    // t6 暂存 `[handleCancel]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [handleCancel];
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
    // t6 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t5, t6);
  // t7 暂存 `defaultEffort ? convertEffortValueToLevel(defaultEffort) ...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== model) {
    // defaultEffort读取`getDefaultEffortForModel`，供终端渲染后续处理使用。
    const defaultEffort = getDefaultEffortForModel(model);
    // t7 暂存 `defaultEffort ? convertEffortValueToLevel(defaultEffort) ...` 生成的渲染片段，后续返回路径直接复用。
    t7 = defaultEffort ? convertEffortValueToLevel(defaultEffort) : "high";
    // $[7] 缓存 `model`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = model;
    // $[8] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[8];
  }
  // defaultLevel保存`t7`，作为后续临时缓存值处理的输入。
  const defaultLevel = t7;
  // t8 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== defaultLevel) {
    // t8 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = value => {
      // effortLevel标记终端 UI Effort Callout是否启用对应路径。
      const effortLevel = value === defaultLevel ? undefined : value;
      // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
      updateSettingsForSource("userSettings", {
        effortLevel: toPersistableEffort(effortLevel)
      });
      // 调用 onDoneRef.current，触发终端渲染此处需要的副作用。
      onDoneRef.current(value);
    };
    // $[9] 缓存 `defaultLevel`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = defaultLevel;
    // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[10];
  }
  // handleSelect沿用 `t8` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSelect = t8;
  // t9 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t9 = [{
      label: <EffortOptionLabel level="medium" text="Medium (recommended)" />,
      value: "medium"
    }, {
      label: <EffortOptionLabel level="high" text="High" />,
      value: "high"
    }, {
      label: <EffortOptionLabel level="low" text="Low" />,
      value: "low"
    }];
    // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[11];
  }
  // 选项保存`t9`，作为后续临时缓存值处理的输入。
  const options = t9;
  // t10 暂存 `<Box marginBottom={1} flexDirection="column"><Text>{defau...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Box marginBottom={1} flexDirection="column"><Text>{defau...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box marginBottom={1} flexDirection="column"><Text>{defaultEffortConfig.dialogDescription}</Text></Box>;
    // $[12] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[12];
  }
  // t11 暂存 `<EffortIndicatorSymbol level="low" />` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<EffortIndicatorSymbol level="low" />` 生成的渲染片段，后续返回路径直接复用。
    t11 = <EffortIndicatorSymbol level="low" />;
    // $[13] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[13];
  }
  // t12 暂存 `<EffortIndicatorSymbol level="medium" />` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `<EffortIndicatorSymbol level="medium" />` 生成的渲染片段，后续返回路径直接复用。
    t12 = <EffortIndicatorSymbol level="medium" />;
    // $[14] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[14];
  }
  // t13 暂存 `<Box marginBottom={1}><Text dimColor={true}>{t11} low {"\...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t13 暂存 `<Box marginBottom={1}><Text dimColor={true}>{t11} low {"\...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box marginBottom={1}><Text dimColor={true}>{t11} low {"\xB7"}{" "}{t12} medium {"\xB7"}{" "}<EffortIndicatorSymbol level="high" /> high</Text></Box>;
    // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[15];
  }
  // t14 暂存 `<PermissionDialog title={defaultEffortConfig.dialogTitle}...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== handleSelect) {
    // t14 暂存 `<PermissionDialog title={defaultEffortConfig.dialogTitle}...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <PermissionDialog title={defaultEffortConfig.dialogTitle}><Box flexDirection="column" paddingX={2} paddingY={1}>{t10}{t13}<Select options={options} onChange={handleSelect} onCancel={handleCancel} /></Box></PermissionDialog>;
    // $[16] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = handleSelect;
    // $[17] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[17];
  }
  // 返回 `t14`，作为终端渲染这次计算的结果。
  return t14;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 调用 markV2Dismissed，触发终端渲染此处需要的副作用。
  markV2Dismissed();
}
// EffortIndicatorSymbol 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function EffortIndicatorSymbol(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    level
  } = t0;
  // t1 暂存 `effortLevelToSymbol(level)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== level) {
    // t1 暂存 `effortLevelToSymbol(level)` 生成的渲染片段，后续返回路径直接复用。
    t1 = effortLevelToSymbol(level);
    // $[0] 缓存 `level`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = level;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<Text color="suggestion">{t1}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t1) {
    // t2 暂存 `<Text color="suggestion">{t1}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color="suggestion">{t1}</Text>;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// EffortOptionLabel 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function EffortOptionLabel(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    level,
    text
  } = t0;
  // t1 暂存 `<EffortIndicatorSymbol level={level} />` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== level) {
    // t1 暂存 `<EffortIndicatorSymbol level={level} />` 生成的渲染片段，后续返回路径直接复用。
    t1 = <EffortIndicatorSymbol level={level} />;
    // $[0] 缓存 `level`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = level;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<>{t1} {text}</>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t1 || $[3] !== text) {
    // t2 暂存 `<>{t1} {text}</>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <>{t1} {text}</>;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `text`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = text;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}

/**
 * Check whether to show the effort callout.
 *
 * Audience:
 * - Pro: already had medium default; show unless they saw v1 (effortCalloutDismissed)
 * - Max/Team: getting medium via tengu_grey_step2 config; show when enabled
 * - Everyone else: mark as dismissed so it never shows
 */
// shouldShowEffortCallout 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowEffortCallout(model: string): boolean {
  // Only show for Opus 4.6 for now
  // 解析结果解析`parseUserSpecifiedModel`，供终端渲染后续处理使用。
  const parsed = parseUserSpecifiedModel(model);
  // 满足 `!parsed.toLowerCase().includes('opus-4-6')` 时，终端渲染执行该分支。
  if (!parsed.toLowerCase().includes('opus-4-6')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 满足 `config.effortCalloutV2Dismissed` 时，终端渲染执行该分支。
  if (config.effortCalloutV2Dismissed) return false;

  // Don't show to brand-new users — they never knew the old default, so this
  // isn't a change for them. Mark as dismissed so it stays suppressed.
  // 满足 `config.numStartups <= 1` 时，终端渲染执行该分支。
  if (config.numStartups <= 1) {
    // 调用 markV2Dismissed，触发终端渲染此处需要的副作用。
    markV2Dismissed();
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }

  // Pro users already had medium default before this PR. Show the new copy,
  // but skip if they already saw the v1 dialog — no point nagging twice.
  // 满足 `isProSubscriber()` 时，终端渲染执行该分支。
  if (isProSubscriber()) {
    // 满足 `config.effortCalloutDismissed` 时，终端渲染执行该分支。
    if (config.effortCalloutDismissed) {
      // 调用 markV2Dismissed，触发终端渲染此处需要的副作用。
      markV2Dismissed();
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    }
    // 返回 `getOpusDefaultEffortConfig().enabled`，作为终端渲染这次计算的结果。
    return getOpusDefaultEffortConfig().enabled;
  }

  // Max/Team are the target of the tengu_grey_step2 config.
  // Don't mark dismissed when config is disabled — they should see the dialog
  // once it's enabled for them.
  // 只有 `isMaxSubscriber() || isTeamSubscriber()` 满足时，终端渲染才执行该分支。
  if (isMaxSubscriber() || isTeamSubscriber()) {
    // 返回 `getOpusDefaultEffortConfig().enabled`，作为终端渲染这次计算的结果。
    return getOpusDefaultEffortConfig().enabled;
  }

  // Everyone else (free tier, API key, non-subscribers): not in scope.
  // 调用 markV2Dismissed，触发终端渲染此处需要的副作用。
  markV2Dismissed();
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false;
}
// markV2Dismissed 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function markV2Dismissed(): void {
  // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
  saveGlobalConfig(current => {
    // 满足 `current.effortCalloutV2Dismissed` 时，终端渲染执行该分支。
    if (current.effortCalloutV2Dismissed) return current;
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      ...current,
      effortCalloutV2Dismissed: true
    };
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlUmVmIiwiQm94IiwiVGV4dCIsImlzTWF4U3Vic2NyaWJlciIsImlzUHJvU3Vic2NyaWJlciIsImlzVGVhbVN1YnNjcmliZXIiLCJnZXRHbG9iYWxDb25maWciLCJzYXZlR2xvYmFsQ29uZmlnIiwiRWZmb3J0TGV2ZWwiLCJjb252ZXJ0RWZmb3J0VmFsdWVUb0xldmVsIiwiZ2V0RGVmYXVsdEVmZm9ydEZvck1vZGVsIiwiZ2V0T3B1c0RlZmF1bHRFZmZvcnRDb25maWciLCJ0b1BlcnNpc3RhYmxlRWZmb3J0IiwicGFyc2VVc2VyU3BlY2lmaWVkTW9kZWwiLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsIk9wdGlvbldpdGhEZXNjcmlwdGlvbiIsIlNlbGVjdCIsImVmZm9ydExldmVsVG9TeW1ib2wiLCJQZXJtaXNzaW9uRGlhbG9nIiwiRWZmb3J0Q2FsbG91dFNlbGVjdGlvbiIsIlByb3BzIiwibW9kZWwiLCJvbkRvbmUiLCJzZWxlY3Rpb24iLCJBVVRPX0RJU01JU1NfTVMiLCJFZmZvcnRDYWxsb3V0IiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsImRlZmF1bHRFZmZvcnRDb25maWciLCJvbkRvbmVSZWYiLCJ0MiIsImN1cnJlbnQiLCJ0MyIsImhhbmRsZUNhbmNlbCIsInQ0IiwiX3RlbXAiLCJ0NSIsInQ2IiwidGltZW91dElkIiwic2V0VGltZW91dCIsImNsZWFyVGltZW91dCIsInQ3IiwiZGVmYXVsdEVmZm9ydCIsImRlZmF1bHRMZXZlbCIsInQ4IiwidmFsdWUiLCJlZmZvcnRMZXZlbCIsInVuZGVmaW5lZCIsImhhbmRsZVNlbGVjdCIsInQ5IiwibGFiZWwiLCJvcHRpb25zIiwidDEwIiwiZGlhbG9nRGVzY3JpcHRpb24iLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJkaWFsb2dUaXRsZSIsIm1hcmtWMkRpc21pc3NlZCIsIkVmZm9ydEluZGljYXRvclN5bWJvbCIsImxldmVsIiwiRWZmb3J0T3B0aW9uTGFiZWwiLCJ0ZXh0Iiwic2hvdWxkU2hvd0VmZm9ydENhbGxvdXQiLCJwYXJzZWQiLCJ0b0xvd2VyQ2FzZSIsImluY2x1ZGVzIiwiY29uZmlnIiwiZWZmb3J0Q2FsbG91dFYyRGlzbWlzc2VkIiwibnVtU3RhcnR1cHMiLCJlZmZvcnRDYWxsb3V0RGlzbWlzc2VkIiwiZW5hYmxlZCJdLCJzb3VyY2VzIjpbIkVmZm9ydENhbGxvdXQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7XG4gIGlzTWF4U3Vic2NyaWJlcixcbiAgaXNQcm9TdWJzY3JpYmVyLFxuICBpc1RlYW1TdWJzY3JpYmVyLFxufSBmcm9tICcuLi91dGlscy9hdXRoLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHR5cGUgeyBFZmZvcnRMZXZlbCB9IGZyb20gJy4uL3V0aWxzL2VmZm9ydC5qcydcbmltcG9ydCB7XG4gIGNvbnZlcnRFZmZvcnRWYWx1ZVRvTGV2ZWwsXG4gIGdldERlZmF1bHRFZmZvcnRGb3JNb2RlbCxcbiAgZ2V0T3B1c0RlZmF1bHRFZmZvcnRDb25maWcsXG4gIHRvUGVyc2lzdGFibGVFZmZvcnQsXG59IGZyb20gJy4uL3V0aWxzL2VmZm9ydC5qcydcbmltcG9ydCB7IHBhcnNlVXNlclNwZWNpZmllZE1vZGVsIH0gZnJvbSAnLi4vdXRpbHMvbW9kZWwvbW9kZWwuanMnXG5pbXBvcnQgeyB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSB9IGZyb20gJy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHR5cGUgeyBPcHRpb25XaXRoRGVzY3JpcHRpb24gfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBlZmZvcnRMZXZlbFRvU3ltYm9sIH0gZnJvbSAnLi9FZmZvcnRJbmRpY2F0b3IuanMnXG5pbXBvcnQgeyBQZXJtaXNzaW9uRGlhbG9nIH0gZnJvbSAnLi9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uRGlhbG9nLmpzJ1xuXG50eXBlIEVmZm9ydENhbGxvdXRTZWxlY3Rpb24gPSBFZmZvcnRMZXZlbCB8IHVuZGVmaW5lZCB8ICdkaXNtaXNzJ1xuXG50eXBlIFByb3BzID0ge1xuICBtb2RlbDogc3RyaW5nXG4gIG9uRG9uZTogKHNlbGVjdGlvbjogRWZmb3J0Q2FsbG91dFNlbGVjdGlvbikgPT4gdm9pZFxufVxuXG5jb25zdCBBVVRPX0RJU01JU1NfTVMgPSAzMF8wMDBcblxuZXhwb3J0IGZ1bmN0aW9uIEVmZm9ydENhbGxvdXQoeyBtb2RlbCwgb25Eb25lIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgZGVmYXVsdEVmZm9ydENvbmZpZyA9IGdldE9wdXNEZWZhdWx0RWZmb3J0Q29uZmlnKClcbiAgLy8gTGF0ZXN0LXJlZiBwYXR0ZXJuIOKAlCB3cml0ZSB2aWEgZWZmZWN0IHNvIFJlYWN0IENvbXBpbGVyIGNhbiBtZW1vaXplLlxuICBjb25zdCBvbkRvbmVSZWYgPSB1c2VSZWYob25Eb25lKVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG9uRG9uZVJlZi5jdXJyZW50ID0gb25Eb25lXG4gIH0pXG5cbiAgY29uc3QgaGFuZGxlQ2FuY2VsID0gdXNlQ2FsbGJhY2soKCk6IHZvaWQgPT4ge1xuICAgIG9uRG9uZVJlZi5jdXJyZW50KCdkaXNtaXNzJylcbiAgfSwgW10pXG5cbiAgLy8gUGVybWFuZW50bHkgZGlzbWlzcyBvbiBtb3VudCBzbyBpdCBvbmx5IHNob3dzIG9uY2VcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtYXJrVjJEaXNtaXNzZWQoKVxuICB9LCBbXSlcblxuICAvLyAzMC1zZWNvbmQgYXV0by1kaXNtaXNzIHRpbWVyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dChoYW5kbGVDYW5jZWwsIEFVVE9fRElTTUlTU19NUylcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcbiAgfSwgW2hhbmRsZUNhbmNlbF0pXG5cbiAgY29uc3QgZGVmYXVsdEVmZm9ydCA9IGdldERlZmF1bHRFZmZvcnRGb3JNb2RlbChtb2RlbClcbiAgY29uc3QgZGVmYXVsdExldmVsID0gZGVmYXVsdEVmZm9ydFxuICAgID8gY29udmVydEVmZm9ydFZhbHVlVG9MZXZlbChkZWZhdWx0RWZmb3J0KVxuICAgIDogJ2hpZ2gnXG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0ID0gdXNlQ2FsbGJhY2soXG4gICAgKHZhbHVlOiBFZmZvcnRMZXZlbCk6IHZvaWQgPT4ge1xuICAgICAgY29uc3QgZWZmb3J0TGV2ZWwgPSB2YWx1ZSA9PT0gZGVmYXVsdExldmVsID8gdW5kZWZpbmVkIDogdmFsdWVcbiAgICAgIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCd1c2VyU2V0dGluZ3MnLCB7XG4gICAgICAgIGVmZm9ydExldmVsOiB0b1BlcnNpc3RhYmxlRWZmb3J0KGVmZm9ydExldmVsKSxcbiAgICAgIH0pXG4gICAgICBvbkRvbmVSZWYuY3VycmVudCh2YWx1ZSlcbiAgICB9LFxuICAgIFtkZWZhdWx0TGV2ZWxdLFxuICApXG5cbiAgY29uc3Qgb3B0aW9uczogT3B0aW9uV2l0aERlc2NyaXB0aW9uPEVmZm9ydExldmVsPltdID0gW1xuICAgIHtcbiAgICAgIGxhYmVsOiA8RWZmb3J0T3B0aW9uTGFiZWwgbGV2ZWw9XCJtZWRpdW1cIiB0ZXh0PVwiTWVkaXVtIChyZWNvbW1lbmRlZClcIiAvPixcbiAgICAgIHZhbHVlOiAnbWVkaXVtJyxcbiAgICB9LFxuICAgIHsgbGFiZWw6IDxFZmZvcnRPcHRpb25MYWJlbCBsZXZlbD1cImhpZ2hcIiB0ZXh0PVwiSGlnaFwiIC8+LCB2YWx1ZTogJ2hpZ2gnIH0sXG4gICAgeyBsYWJlbDogPEVmZm9ydE9wdGlvbkxhYmVsIGxldmVsPVwibG93XCIgdGV4dD1cIkxvd1wiIC8+LCB2YWx1ZTogJ2xvdycgfSxcbiAgXVxuXG4gIHJldHVybiAoXG4gICAgPFBlcm1pc3Npb25EaWFsb2cgdGl0bGU9e2RlZmF1bHRFZmZvcnRDb25maWcuZGlhbG9nVGl0bGV9PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgcGFkZGluZ1g9ezJ9IHBhZGRpbmdZPXsxfT5cbiAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dD57ZGVmYXVsdEVmZm9ydENvbmZpZy5kaWFsb2dEZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICA8RWZmb3J0SW5kaWNhdG9yU3ltYm9sIGxldmVsPVwibG93XCIgLz4gbG93IHsnwrcnfXsnICd9XG4gICAgICAgICAgICA8RWZmb3J0SW5kaWNhdG9yU3ltYm9sIGxldmVsPVwibWVkaXVtXCIgLz4gbWVkaXVtIHsnwrcnfXsnICd9XG4gICAgICAgICAgICA8RWZmb3J0SW5kaWNhdG9yU3ltYm9sIGxldmVsPVwiaGlnaFwiIC8+IGhpZ2hcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlU2VsZWN0fVxuICAgICAgICAgIG9uQ2FuY2VsPXtoYW5kbGVDYW5jZWx9XG4gICAgICAgIC8+XG4gICAgICA8L0JveD5cbiAgICA8L1Blcm1pc3Npb25EaWFsb2c+XG4gIClcbn1cblxuZnVuY3Rpb24gRWZmb3J0SW5kaWNhdG9yU3ltYm9sKHtcbiAgbGV2ZWwsXG59OiB7XG4gIGxldmVsOiBFZmZvcnRMZXZlbFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiA8VGV4dCBjb2xvcj1cInN1Z2dlc3Rpb25cIj57ZWZmb3J0TGV2ZWxUb1N5bWJvbChsZXZlbCl9PC9UZXh0PlxufVxuXG5mdW5jdGlvbiBFZmZvcnRPcHRpb25MYWJlbCh7XG4gIGxldmVsLFxuICB0ZXh0LFxufToge1xuICBsZXZlbDogRWZmb3J0TGV2ZWxcbiAgdGV4dDogc3RyaW5nXG59KTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPEVmZm9ydEluZGljYXRvclN5bWJvbCBsZXZlbD17bGV2ZWx9IC8+IHt0ZXh0fVxuICAgIDwvPlxuICApXG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0byBzaG93IHRoZSBlZmZvcnQgY2FsbG91dC5cbiAqXG4gKiBBdWRpZW5jZTpcbiAqIC0gUHJvOiBhbHJlYWR5IGhhZCBtZWRpdW0gZGVmYXVsdDsgc2hvdyB1bmxlc3MgdGhleSBzYXcgdjEgKGVmZm9ydENhbGxvdXREaXNtaXNzZWQpXG4gKiAtIE1heC9UZWFtOiBnZXR0aW5nIG1lZGl1bSB2aWEgdGVuZ3VfZ3JleV9zdGVwMiBjb25maWc7IHNob3cgd2hlbiBlbmFibGVkXG4gKiAtIEV2ZXJ5b25lIGVsc2U6IG1hcmsgYXMgZGlzbWlzc2VkIHNvIGl0IG5ldmVyIHNob3dzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTaG93RWZmb3J0Q2FsbG91dChtb2RlbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIC8vIE9ubHkgc2hvdyBmb3IgT3B1cyA0LjYgZm9yIG5vd1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZVVzZXJTcGVjaWZpZWRNb2RlbChtb2RlbClcbiAgaWYgKCFwYXJzZWQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnb3B1cy00LTYnKSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgY29uc3QgY29uZmlnID0gZ2V0R2xvYmFsQ29uZmlnKClcbiAgaWYgKGNvbmZpZy5lZmZvcnRDYWxsb3V0VjJEaXNtaXNzZWQpIHJldHVybiBmYWxzZVxuXG4gIC8vIERvbid0IHNob3cgdG8gYnJhbmQtbmV3IHVzZXJzIOKAlCB0aGV5IG5ldmVyIGtuZXcgdGhlIG9sZCBkZWZhdWx0LCBzbyB0aGlzXG4gIC8vIGlzbid0IGEgY2hhbmdlIGZvciB0aGVtLiBNYXJrIGFzIGRpc21pc3NlZCBzbyBpdCBzdGF5cyBzdXBwcmVzc2VkLlxuICBpZiAoY29uZmlnLm51bVN0YXJ0dXBzIDw9IDEpIHtcbiAgICBtYXJrVjJEaXNtaXNzZWQoKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gUHJvIHVzZXJzIGFscmVhZHkgaGFkIG1lZGl1bSBkZWZhdWx0IGJlZm9yZSB0aGlzIFBSLiBTaG93IHRoZSBuZXcgY29weSxcbiAgLy8gYnV0IHNraXAgaWYgdGhleSBhbHJlYWR5IHNhdyB0aGUgdjEgZGlhbG9nIOKAlCBubyBwb2ludCBuYWdnaW5nIHR3aWNlLlxuICBpZiAoaXNQcm9TdWJzY3JpYmVyKCkpIHtcbiAgICBpZiAoY29uZmlnLmVmZm9ydENhbGxvdXREaXNtaXNzZWQpIHtcbiAgICAgIG1hcmtWMkRpc21pc3NlZCgpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIGdldE9wdXNEZWZhdWx0RWZmb3J0Q29uZmlnKCkuZW5hYmxlZFxuICB9XG5cbiAgLy8gTWF4L1RlYW0gYXJlIHRoZSB0YXJnZXQgb2YgdGhlIHRlbmd1X2dyZXlfc3RlcDIgY29uZmlnLlxuICAvLyBEb24ndCBtYXJrIGRpc21pc3NlZCB3aGVuIGNvbmZpZyBpcyBkaXNhYmxlZCDigJQgdGhleSBzaG91bGQgc2VlIHRoZSBkaWFsb2dcbiAgLy8gb25jZSBpdCdzIGVuYWJsZWQgZm9yIHRoZW0uXG4gIGlmIChpc01heFN1YnNjcmliZXIoKSB8fCBpc1RlYW1TdWJzY3JpYmVyKCkpIHtcbiAgICByZXR1cm4gZ2V0T3B1c0RlZmF1bHRFZmZvcnRDb25maWcoKS5lbmFibGVkXG4gIH1cblxuICAvLyBFdmVyeW9uZSBlbHNlIChmcmVlIHRpZXIsIEFQSSBrZXksIG5vbi1zdWJzY3JpYmVycyk6IG5vdCBpbiBzY29wZS5cbiAgbWFya1YyRGlzbWlzc2VkKClcbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIG1hcmtWMkRpc21pc3NlZCgpOiB2b2lkIHtcbiAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+IHtcbiAgICBpZiAoY3VycmVudC5lZmZvcnRDYWxsb3V0VjJEaXNtaXNzZWQpIHJldHVybiBjdXJyZW50XG4gICAgcmV0dXJuIHsgLi4uY3VycmVudCwgZWZmb3J0Q2FsbG91dFYyRGlzbWlzc2VkOiB0cnVlIH1cbiAgfSlcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsV0FBVyxFQUFFQyxTQUFTLEVBQUVDLE1BQU0sUUFBUSxPQUFPO0FBQzdELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FDRUMsZUFBZSxFQUNmQyxlQUFlLEVBQ2ZDLGdCQUFnQixRQUNYLGtCQUFrQjtBQUN6QixTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLG9CQUFvQjtBQUN0RSxjQUFjQyxXQUFXLFFBQVEsb0JBQW9CO0FBQ3JELFNBQ0VDLHlCQUF5QixFQUN6QkMsd0JBQXdCLEVBQ3hCQywwQkFBMEIsRUFDMUJDLG1CQUFtQixRQUNkLG9CQUFvQjtBQUMzQixTQUFTQyx1QkFBdUIsUUFBUSx5QkFBeUI7QUFDakUsU0FBU0MsdUJBQXVCLFFBQVEsK0JBQStCO0FBQ3ZFLGNBQWNDLHFCQUFxQixRQUFRLDBCQUEwQjtBQUNyRSxTQUFTQyxNQUFNLFFBQVEsMEJBQTBCO0FBQ2pELFNBQVNDLG1CQUFtQixRQUFRLHNCQUFzQjtBQUMxRCxTQUFTQyxnQkFBZ0IsUUFBUSxtQ0FBbUM7QUFFcEUsS0FBS0Msc0JBQXNCLEdBQUdYLFdBQVcsR0FBRyxTQUFTLEdBQUcsU0FB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