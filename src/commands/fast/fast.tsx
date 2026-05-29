// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 类型依赖 { CommandResultDisplay, LocalJSXCommandContext } 来自 ../../commands.js，用于校准命令处理的数据契约。
import type { CommandResultDisplay, LocalJSXCommandContext } from '../../commands.js';
// 复用 Dialog 终端界面组件，避免在这里重复拼装显示逻辑。
import { Dialog } from '../../components/design-system/Dialog.js';
// 复用 FastIcon、getFastIconString 终端界面组件，避免在这里重复拼装显示逻辑。
import { FastIcon, getFastIconString } from '../../components/FastIcon.js';
// 引入 Box、Link、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../../ink.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from '../../services/analytics/index.js';
// 引入 AppState、useAppState、useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { type AppState, useAppState, useSetAppState } from '../../state/AppState.js';
// 类型依赖 { LocalJSXCommandOnDone } 来自 ../../types/command.js，用于校准命令处理的数据契约。
import type { LocalJSXCommandOnDone } from '../../types/command.js';
// 复用 clearFastModeCooldown、FAST_MODE_MODEL_DISPLAY、getFastModeModel、getFastModeRuntimeState、getFastModeUnavailableReason、isFastModeEnabled、isFastModeSupportedByModel、prefetchFastModeStatus 工具函数，把通用处理留在 ../../utils/fastMode.js 中维护。
import { clearFastModeCooldown, FAST_MODE_MODEL_DISPLAY, getFastModeModel, getFastModeRuntimeState, getFastModeUnavailableReason, isFastModeEnabled, isFastModeSupportedByModel, prefetchFastModeStatus } from '../../utils/fastMode.js';
// 复用 formatDuration 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatDuration } from '../../utils/format.js';
// 复用 formatModelPricing、getOpus46CostTier 工具函数，把通用处理留在 ../../utils/modelCost.js 中维护。
import { formatModelPricing, getOpus46CostTier } from '../../utils/modelCost.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../../utils/settings/settings.js';
// applyFastMode 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function applyFastMode(enable: boolean, setAppState: (f: (prev: AppState) => AppState) => void): void {
  // 调用 clearFastModeCooldown，触发命令处理此处需要的副作用。
  clearFastModeCooldown();
  // 调用 updateSettingsForSource，触发命令处理此处需要的副作用。
  updateSettingsForSource('userSettings', {
    fastMode: enable ? true : undefined
  });
  // 满足 `enable` 时，命令处理执行该分支。
  if (enable) {
    // setAppState 写入新的状态值，使命令处理后续读取保持一致。
    setAppState(prev => {
      // Only switch model if current model doesn't support fast mode
      // needsModelSwitch记录 `isFastModeSupportedByModel` 是否成立，命令处理随后按该结果分支。
      const needsModelSwitch = !isFastModeSupportedByModel(prev.mainLoopModel);
      // 返回结构化结果，集中表达命令处理已经整理出的状态。
      return {
        ...prev,
        ...(needsModelSwitch ? {
          mainLoopModel: getFastModeModel(),
          mainLoopModelForSession: null
        } : {}),
        fastMode: true
      };
    });
  } else {
    // setAppState 写入新的状态值，使命令处理后续读取保持一致。
    setAppState(prev => ({
      ...prev,
      fastMode: false
    }));
  }
}
// FastModePicker 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function FastModePicker(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(30);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    unavailableReason
  } = t0;
  // 模型名称保存`useAppState`，供命令处理后续处理使用。
  const model = useAppState(_temp);
  // initialFastMode保存`useAppState`，供命令处理后续处理使用。
  const initialFastMode = useAppState(_temp2);
  // setAppState 状态保存`useSetAppState`，供命令处理后续处理使用。
  const setAppState = useSetAppState();
  // enableFastMode 由 React state 持有，setEnableFastMode 会在用户操作或异步结果返回时触发刷新。
  const [enableFastMode, setEnableFastMode] = useState(initialFastMode ?? false);
  // t1 暂存 `getFastModeRuntimeState()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getFastModeRuntimeState()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getFastModeRuntimeState();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // runtimeState 状态保存`t1`，作为后续临时缓存值处理的输入。
  const runtimeState = t1;
  // isCooldown标记命令处理斜杠命令 fast是否启用对应路径。
  const isCooldown = runtimeState.status === "cooldown";
  // isUnavailable标记命令处理斜杠命令 fast是否启用对应路径。
  const isUnavailable = unavailableReason !== null;
  // t2 暂存 `formatModelPricing(getOpus46CostTier(true))` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `formatModelPricing(getOpus46CostTier(true))` 生成的渲染片段，后续返回路径直接复用。
    t2 = formatModelPricing(getOpus46CostTier(true));
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // pricing保存`t2`，作为后续临时缓存值处理的输入。
  const pricing = t2;
  // t3 暂存 `function handleConfirm() {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== enableFastMode || $[3] !== isUnavailable || $[4] !== model || $[5] !== onDone || $[6] !== setAppState) {
    // t3 暂存 `function handleConfirm() {` 生成的渲染片段，后续返回路径直接复用。
    t3 = function handleConfirm() {
      // 满足 `isUnavailable` 时，命令处理执行该分支。
      if (isUnavailable) {
        // 斜杠命令 fast在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 applyFastMode，触发命令处理此处需要的副作用。
      applyFastMode(enableFastMode, setAppState);
      // 记录命令处理运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_fast_mode_toggled", {
        enabled: enableFastMode,
        source: "picker" as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
      });
      // 满足 `enableFastMode` 时，命令处理执行该分支。
      if (enableFastMode) {
        // fastIcon读取`getFastIconString`，供命令处理后续处理使用。
        const fastIcon = getFastIconString(enableFastMode);
        // modelUpdated保存`isFastModeSupportedByModel`，供命令处理后续处理使用。
        const modelUpdated = !isFastModeSupportedByModel(model) ? ` · model set to ${FAST_MODE_MODEL_DISPLAY}` : "";
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone(`${fastIcon} Fast mode ON${modelUpdated} · ${pricing}`);
      } else {
        // setAppState 写入新的状态值，使命令处理后续读取保持一致。
        setAppState(_temp3);
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone("Fast mode OFF");
      }
    };
    // $[2] 缓存 `enableFastMode`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = enableFastMode;
    // $[3] 缓存 `isUnavailable`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = isUnavailable;
    // $[4] 缓存 `model`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = model;
    // $[5] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onDone;
    // $[6] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = setAppState;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // handleConfirm 命名 `t3`，让后续代码直接表达这个值的用途。
  const handleConfirm = t3;
  // t4 暂存 `function handleCancel() {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== initialFastMode || $[9] !== isUnavailable || $[10] !== onDone || $[11] !== setAppState) {
    // t4 暂存 `function handleCancel() {` 生成的渲染片段，后续返回路径直接复用。
    t4 = function handleCancel() {
      // 满足 `isUnavailable` 时，命令处理执行该分支。
      if (isUnavailable) {
        // 满足 `initialFastMode` 时，命令处理执行该分支。
        if (initialFastMode) {
          // 调用 applyFastMode，触发命令处理此处需要的副作用。
          applyFastMode(false, setAppState);
        }
        // 调用 onDone，触发命令处理此处需要的副作用。
        onDone("Fast mode OFF", {
          display: "system"
        });
        // 斜杠命令 fast在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 消息读取`getFastIconString`，供命令处理后续处理使用。
      const message = initialFastMode ? `${getFastIconString()} Kept Fast mode ON` : "Kept Fast mode OFF";
      // 调用 onDone，触发命令处理此处需要的副作用。
      onDone(message, {
        display: "system"
      });
    };
    // $[8] 缓存 `initialFastMode`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = initialFastMode;
    // $[9] 缓存 `isUnavailable`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = isUnavailable;
    // $[10] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onDone;
    // $[11] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = setAppState;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // handleCancel保存`t4`，作为后续临时缓存值处理的输入。
  const handleCancel = t4;
  // t5 暂存 `function handleToggle() {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== isUnavailable) {
    // t5 暂存 `function handleToggle() {` 生成的渲染片段，后续返回路径直接复用。
    t5 = function handleToggle() {
      // 满足 `isUnavailable` 时，命令处理执行该分支。
      if (isUnavailable) {
        // 斜杠命令 fast在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setEnableFastMode 写入新的状态值，使命令处理后续读取保持一致。
      setEnableFastMode(_temp4);
    };
    // $[13] 缓存 `isUnavailable`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = isUnavailable;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[14];
  }
  // handleToggle保存`t5`，作为后续临时缓存值处理的输入。
  const handleToggle = t5;
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== handleConfirm || $[16] !== handleToggle) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      "confirm:yes": handleConfirm,
      "confirm:nextField": handleToggle,
      "confirm:next": handleToggle,
      "confirm:previous": handleToggle,
      "confirm:cycleMode": handleToggle,
      "confirm:toggle": handleToggle
    };
    // $[15] 缓存 `handleConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = handleConfirm;
    // $[16] 缓存 `handleToggle`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = handleToggle;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[17];
  }
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      context: "Confirmation"
    };
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[18];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings(t6, t7);
  // t8 暂存 `<Text><FastIcon cooldown={isCooldown} /> Fast mode (resea...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Text><FastIcon cooldown={isCooldown} /> Fast mode (resea...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text><FastIcon cooldown={isCooldown} /> Fast mode (research preview)</Text>;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // title 标题沿用 `t8` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const title = t8;
  // t9 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== isUnavailable) {
    // t9 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 生成的渲染片段，后续返回路径直接复用。
    t9 = exitState => exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : isUnavailable ? <Text>Esc to cancel</Text> : <Text>Tab to toggle · Enter to confirm · Esc to cancel</Text>;
    // $[20] 缓存 `isUnavailable`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = isUnavailable;
    // $[21] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[21];
  }
  // t10 暂存 `unavailableReason ? <Box marginLeft={2}><Text color="erro...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== enableFastMode || $[23] !== unavailableReason) {
    // t10 暂存 `unavailableReason ? <Box marginLeft={2}><Text color="erro...` 生成的渲染片段，后续返回路径直接复用。
    t10 = unavailableReason ? <Box marginLeft={2}><Text color="error">{unavailableReason}</Text></Box> : <><Box flexDirection="column" gap={0} marginLeft={2}><Box flexDirection="row" gap={2}><Text bold={true}>Fast mode</Text><Text color={enableFastMode ? "fastMode" : undefined} bold={enableFastMode}>{enableFastMode ? "ON " : "OFF"}</Text><Text dimColor={true}>{pricing}</Text></Box></Box>{isCooldown && runtimeState.status === "cooldown" && <Box marginLeft={2}><Text color="warning">{runtimeState.reason === "overloaded" ? "Fast mode overloaded and is temporarily unavailable" : "You've hit your fast limit"}{" \xB7 resets in "}{formatDuration(runtimeState.resetAt - Date.now(), {
            hideTrailingZeros: true
          })}</Text></Box>}</>;
    // $[22] 缓存 `enableFastMode`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = enableFastMode;
    // $[23] 缓存 `unavailableReason`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = unavailableReason;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // t11 暂存 `<Text dimColor={true}>Learn more:{" "}<Link url="https://...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<Text dimColor={true}>Learn more:{" "}<Link url="https://...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text dimColor={true}>Learn more:{" "}<Link url="https://code.claude.com/docs/en/fast-mode">https://code.claude.com/docs/en/fast-mode</Link></Text>;
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[25];
  }
  // t12 暂存 `<Dialog title={title} subtitle={`High-speed mode for ${FA...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== handleCancel || $[27] !== t10 || $[28] !== t9) {
    // t12 暂存 `<Dialog title={title} subtitle={`High-speed mode for ${FA...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Dialog title={title} subtitle={`High-speed mode for ${FAST_MODE_MODEL_DISPLAY}. Billed as extra usage at a premium rate. Separate rate limits apply.`} onCancel={handleCancel} color="fastMode" inputGuide={t9}>{t10}{t11}</Dialog>;
    // $[26] 缓存 `handleCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = handleCancel;
    // $[27] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t10;
    // $[28] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t9;
    // $[29] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[29];
  }
  // 返回 `t12`，作为命令处理这次计算的结果。
  return t12;
}
// _temp4 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(prev_0) {
  // 返回 `!prev_0`，作为命令处理这次计算的结果。
  return !prev_0;
}
// _temp3 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(prev) {
  // 返回结构化结果，集中表达命令处理已经整理出的状态。
  return {
    ...prev,
    fastMode: false
  };
}
// _temp2 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.fastMode`，作为命令处理这次计算的结果。
  return s_0.fastMode;
}
// _temp 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.mainLoopModel`，作为命令处理这次计算的结果。
  return s.mainLoopModel;
}
// handleFastModeShortcut 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleFastModeShortcut(enable: boolean, getAppState: () => AppState, setAppState: (f: (prev: AppState) => AppState) => void): Promise<string> {
  // unavailableReason读取`getFastModeUnavailableReason`，供命令处理后续处理使用。
  const unavailableReason = getFastModeUnavailableReason();
  // 满足 `unavailableReason` 时，命令处理执行该分支。
  if (unavailableReason) {
    // 返回 ``Fast mode unavailable: ${unavailableReason}``，作为命令处理这次计算的结果。
    return `Fast mode unavailable: ${unavailableReason}`;
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    mainLoopModel
  } = getAppState();
  // 调用 applyFastMode，触发命令处理此处需要的副作用。
  applyFastMode(enable, setAppState);
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_fast_mode_toggled', {
    enabled: enable,
    source: 'shortcut' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });
  // 满足 `enable` 时，命令处理执行该分支。
  if (enable) {
    // fastIcon读取`getFastIconString`，供命令处理后续处理使用。
    const fastIcon = getFastIconString(true);
    // modelUpdated保存`isFastModeSupportedByModel`，供命令处理后续处理使用。
    const modelUpdated = !isFastModeSupportedByModel(mainLoopModel) ? ` · model set to ${FAST_MODE_MODEL_DISPLAY}` : '';
    // pricing格式化`formatModelPricing`，供命令处理后续处理使用。
    const pricing = formatModelPricing(getOpus46CostTier(true));
    // 返回 ``${fastIcon} Fast mode ON${modelUpdated} · ${pricing}``，作为命令处理这次计算的结果。
    return `${fastIcon} Fast mode ON${modelUpdated} · ${pricing}`;
  } else {
    // 返回 ``Fast mode OFF``，作为命令处理这次计算的结果。
    return `Fast mode OFF`;
  }
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(onDone: LocalJSXCommandOnDone, context: LocalJSXCommandContext, args?: string): Promise<React.ReactNode | null> {
  // 满足 `!isFastModeEnabled()` 时，命令处理执行该分支。
  if (!isFastModeEnabled()) {
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }

  // Fetch org fast mode status before showing the picker. We must know
  // whether the org has disabled fast mode before allowing any toggle.
  // If a startup prefetch is already in flight, this awaits it.
  // 等待 `prefetchFastModeStatus()` 完成，再继续斜杠命令 fast的异步流程。
  await prefetchFastModeStatus();
  // 当前参数格式化`trim`，供命令处理后续处理使用。
  const arg = args?.trim().toLowerCase();
  // 当 `arg` 匹配 `'on' || arg === 'off'` 时，命令处理执行对应分支。
  if (arg === 'on' || arg === 'off') {
    // 结果保存`handleFastModeShortcut`，供命令处理后续处理使用。
    const result = await handleFastModeShortcut(arg === 'on', context.getAppState, context.setAppState);
    // 调用 onDone，触发命令处理此处需要的副作用。
    onDone(result);
    // 返回 `null`，作为命令处理这次计算的结果。
    return null;
  }
  // unavailableReason读取`getFastModeUnavailableReason`，供命令处理后续处理使用。
  const unavailableReason = getFastModeUnavailableReason();
  // 记录命令处理运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_fast_mode_picker_shown', {
    unavailable_reason: (unavailableReason ?? '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });
  // 返回 `<FastModePicker onDone={onDone} unavailableReason={unavailableReason} />`，作为命令处理这次计算的结果。
  return <FastModePicker onDone={onDone} unavailableReason={unavailableReason} />;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJMb2NhbEpTWENvbW1hbmRDb250ZXh0IiwiRGlhbG9nIiwiRmFzdEljb24iLCJnZXRGYXN0SWNvblN0cmluZyIsIkJveCIsIkxpbmsiLCJUZXh0IiwidXNlS2V5YmluZGluZ3MiLCJBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTIiwibG9nRXZlbnQiLCJBcHBTdGF0ZSIsInVzZUFwcFN0YXRlIiwidXNlU2V0QXBwU3RhdGUiLCJMb2NhbEpTWENvbW1hbmRPbkRvbmUiLCJjbGVhckZhc3RNb2RlQ29vbGRvd24iLCJGQVNUX01PREVfTU9ERUxfRElTUExBWSIsImdldEZhc3RNb2RlTW9kZWwiLCJnZXRGYXN0TW9kZVJ1bnRpbWVTdGF0ZSIsImdldEZhc3RNb2RlVW5hdmFpbGFibGVSZWFzb24iLCJpc0Zhc3RNb2RlRW5hYmxlZCIsImlzRmFzdE1vZGVTdXBwb3J0ZWRCeU1vZGVsIiwicHJlZmV0Y2hGYXN0TW9kZVN0YXR1cyIsImZvcm1hdER1cmF0aW9uIiwiZm9ybWF0TW9kZWxQcmljaW5nIiwiZ2V0T3B1czQ2Q29zdFRpZXIiLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsImFwcGx5RmFzdE1vZGUiLCJlbmFibGUiLCJzZXRBcHBTdGF0ZSIsImYiLCJwcmV2IiwiZmFzdE1vZGUiLCJ1bmRlZmluZWQiLCJuZWVkc01vZGVsU3dpdGNoIiwibWFpbkxvb3BNb2RlbCIsIm1haW5Mb29wTW9kZWxGb3JTZXNzaW9uIiwiRmFzdE1vZGVQaWNrZXIiLCJ0MCIsIiQiLCJfYyIsIm9uRG9uZSIsInVuYXZhaWxhYmxlUmVhc29uIiwibW9kZWwiLCJfdGVtcCIsImluaXRpYWxGYXN0TW9kZSIsIl90ZW1wMiIsImVuYWJsZUZhc3RNb2RlIiwic2V0RW5hYmxlRmFzdE1vZGUiLCJ0MSIsIlN5bWJvbCIsImZvciIsInJ1bnRpbWVTdGF0ZSIsImlzQ29vbGRvd24iLCJzdGF0dXMiLCJpc1VuYXZhaWxhYmxlIiwidDIiLCJwcmljaW5nIiwidDMiLCJoYW5kbGVDb25maXJtIiwiZW5hYmxlZCIsInNvdXJjZSIsImZhc3RJY29uIiwibW9kZWxVcGRhdGVkIiwiX3RlbXAzIiwidDQiLCJoYW5kbGVDYW5jZWwiLCJkaXNwbGF5IiwibWVzc2FnZSIsInQ1IiwiaGFuZGxlVG9nZ2xlIiwiX3RlbXA0IiwidDYiLCJ0NyIsImNvbnRleHQiLCJ0OCIsInRpdGxlIiwidDkiLCJleGl0U3RhdGUiLCJwZW5kaW5nIiwia2V5TmFtZSIsInQxMCIsInJlYXNvbiIsInJlc2V0QXQiLCJEYXRlIiwibm93IiwiaGlkZVRyYWlsaW5nWmVyb3MiLCJ0MTEiLCJ0MTIiLCJwcmV2XzAiLCJzXzAiLCJzIiwiaGFuZGxlRmFzdE1vZGVTaG9ydGN1dCIsImdldEFwcFN0YXRlIiwiUHJvbWlzZSIsImNhbGwiLCJhcmdzIiwiUmVhY3ROb2RlIiwiYXJnIiwidHJpbSIsInRvTG93ZXJDYXNlIiwicmVzdWx0IiwidW5hdmFpbGFibGVfcmVhc29uIl0sInNvdXJjZXMiOlsiZmFzdC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUge1xuICBDb21tYW5kUmVzdWx0RGlzcGxheSxcbiAgTG9jYWxKU1hDb21tYW5kQ29udGV4dCxcbn0gZnJvbSAnLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuLi8uLi9jb21wb25lbnRzL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgRmFzdEljb24sIGdldEZhc3RJY29uU3RyaW5nIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9GYXN0SWNvbi5qcydcbmltcG9ydCB7IEJveCwgTGluaywgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7XG4gIHR5cGUgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgbG9nRXZlbnQsXG59IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7XG4gIHR5cGUgQXBwU3RhdGUsXG4gIHVzZUFwcFN0YXRlLFxuICB1c2VTZXRBcHBTdGF0ZSxcbn0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsSlNYQ29tbWFuZE9uRG9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL2NvbW1hbmQuanMnXG5pbXBvcnQge1xuICBjbGVhckZhc3RNb2RlQ29vbGRvd24sXG4gIEZBU1RfTU9ERV9NT0RFTF9ESVNQTEFZLFxuICBnZXRGYXN0TW9kZU1vZGVsLFxuICBnZXRGYXN0TW9kZVJ1bnRpbWVTdGF0ZSxcbiAgZ2V0RmFzdE1vZGVVbmF2YWlsYWJsZVJlYXNvbixcbiAgaXNGYXN0TW9kZUVuYWJsZWQsXG4gIGlzRmFzdE1vZGVTdXBwb3J0ZWRCeU1vZGVsLFxuICBwcmVmZXRjaEZhc3RNb2RlU3RhdHVzLFxufSBmcm9tICcuLi8uLi91dGlscy9mYXN0TW9kZS5qcydcbmltcG9ydCB7IGZvcm1hdER1cmF0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgZm9ybWF0TW9kZWxQcmljaW5nLCBnZXRPcHVzNDZDb3N0VGllciB9IGZyb20gJy4uLy4uL3V0aWxzL21vZGVsQ29zdC5qcydcbmltcG9ydCB7IHVwZGF0ZVNldHRpbmdzRm9yU291cmNlIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5cbmZ1bmN0aW9uIGFwcGx5RmFzdE1vZGUoXG4gIGVuYWJsZTogYm9vbGVhbixcbiAgc2V0QXBwU3RhdGU6IChmOiAocHJldjogQXBwU3RhdGUpID0+IEFwcFN0YXRlKSA9PiB2b2lkLFxuKTogdm9pZCB7XG4gIGNsZWFyRmFzdE1vZGVDb29sZG93bigpXG4gIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCd1c2VyU2V0dGluZ3MnLCB7XG4gICAgZmFzdE1vZGU6IGVuYWJsZSA/IHRydWUgOiB1bmRlZmluZWQsXG4gIH0pXG4gIGlmIChlbmFibGUpIHtcbiAgICBzZXRBcHBTdGF0ZShwcmV2ID0+IHtcbiAgICAgIC8vIE9ubHkgc3dpdGNoIG1vZGVsIGlmIGN1cnJlbnQgbW9kZWwgZG9lc24ndCBzdXBwb3J0IGZhc3QgbW9kZVxuICAgICAgY29uc3QgbmVlZHNNb2RlbFN3aXRjaCA9ICFpc0Zhc3RNb2RlU3VwcG9ydGVkQnlNb2RlbChwcmV2Lm1haW5Mb29wTW9kZWwpXG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICAuLi4obmVlZHNNb2RlbFN3aXRjaFxuICAgICAgICAgID8geyBtYWluTG9vcE1vZGVsOiBnZXRGYXN0TW9kZU1vZGVsKCksIG1haW5Mb29wTW9kZWxGb3JTZXNzaW9uOiBudWxsIH1cbiAgICAgICAgICA6IHt9KSxcbiAgICAgICAgZmFzdE1vZGU6IHRydWUsXG4gICAgICB9XG4gICAgfSlcbiAgfSBlbHNlIHtcbiAgICBzZXRBcHBTdGF0ZShwcmV2ID0+ICh7IC4uLnByZXYsIGZhc3RNb2RlOiBmYWxzZSB9KSlcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gRmFzdE1vZGVQaWNrZXIoe1xuICBvbkRvbmUsXG4gIHVuYXZhaWxhYmxlUmVhc29uLFxufToge1xuICBvbkRvbmU6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHsgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IH0sXG4gICkgPT4gdm9pZFxuICB1bmF2YWlsYWJsZVJlYXNvbjogc3RyaW5nIHwgbnVsbFxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IG1vZGVsID0gdXNlQXBwU3RhdGUocyA9PiBzLm1haW5Mb29wTW9kZWwpXG4gIGNvbnN0IGluaXRpYWxGYXN0TW9kZSA9IHVzZUFwcFN0YXRlKHMgPT4gcy5mYXN0TW9kZSlcbiAgY29uc3Qgc2V0QXBwU3RhdGUgPSB1c2VTZXRBcHBTdGF0ZSgpXG4gIGNvbnN0IFtlbmFibGVGYXN0TW9kZSwgc2V0RW5hYmxlRmFzdE1vZGVdID0gdXNlU3RhdGUoaW5pdGlhbEZhc3RNb2RlID8/IGZhbHNlKVxuICBjb25zdCBydW50aW1lU3RhdGUgPSBnZXRGYXN0TW9kZVJ1bnRpbWVTdGF0ZSgpXG4gIGNvbnN0IGlzQ29vbGRvd24gPSBydW50aW1lU3RhdGUuc3RhdHVzID09PSAnY29vbGRvd24nXG4gIGNvbnN0IGlzVW5hdmFpbGFibGUgPSB1bmF2YWlsYWJsZVJlYXNvbiAhPT0gbnVsbFxuICBjb25zdCBwcmljaW5nID0gZm9ybWF0TW9kZWxQcmljaW5nKGdldE9wdXM0NkNvc3RUaWVyKHRydWUpKVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUNvbmZpcm0oKTogdm9pZCB7XG4gICAgaWYgKGlzVW5hdmFpbGFibGUpIHJldHVyblxuICAgIGFwcGx5RmFzdE1vZGUoZW5hYmxlRmFzdE1vZGUsIHNldEFwcFN0YXRlKVxuICAgIGxvZ0V2ZW50KCd0ZW5ndV9mYXN0X21vZGVfdG9nZ2xlZCcsIHtcbiAgICAgIGVuYWJsZWQ6IGVuYWJsZUZhc3RNb2RlLFxuICAgICAgc291cmNlOlxuICAgICAgICAncGlja2VyJyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgIH0pXG4gICAgaWYgKGVuYWJsZUZhc3RNb2RlKSB7XG4gICAgICBjb25zdCBmYXN0SWNvbiA9IGdldEZhc3RJY29uU3RyaW5nKGVuYWJsZUZhc3RNb2RlKVxuICAgICAgY29uc3QgbW9kZWxVcGRhdGVkID0gIWlzRmFzdE1vZGVTdXBwb3J0ZWRCeU1vZGVsKG1vZGVsKVxuICAgICAgICA/IGAgwrcgbW9kZWwgc2V0IHRvICR7RkFTVF9NT0RFX01PREVMX0RJU1BMQVl9YFxuICAgICAgICA6ICcnXG4gICAgICBvbkRvbmUoYCR7ZmFzdEljb259IEZhc3QgbW9kZSBPTiR7bW9kZWxVcGRhdGVkfSDCtyAke3ByaWNpbmd9YClcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiAoeyAuLi5wcmV2LCBmYXN0TW9kZTogZmFsc2UgfSkpXG4gICAgICBvbkRvbmUoYEZhc3QgbW9kZSBPRkZgKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUNhbmNlbCgpOiB2b2lkIHtcbiAgICBpZiAoaXNVbmF2YWlsYWJsZSkge1xuICAgICAgLy8gRW5zdXJlIGZhc3QgbW9kZSBpcyBvZmYgaWYgdGhlIG9yZyBoYXMgZGlzYWJsZWQgaXRcbiAgICAgIGlmIChpbml0aWFsRmFzdE1vZGUpIHtcbiAgICAgICAgYXBwbHlGYXN0TW9kZShmYWxzZSwgc2V0QXBwU3RhdGUpXG4gICAgICB9XG4gICAgICBvbkRvbmUoJ0Zhc3QgbW9kZSBPRkYnLCB7IGRpc3BsYXk6ICdzeXN0ZW0nIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgbWVzc2FnZSA9IGluaXRpYWxGYXN0TW9kZVxuICAgICAgPyBgJHtnZXRGYXN0SWNvblN0cmluZygpfSBLZXB0IEZhc3QgbW9kZSBPTmBcbiAgICAgIDogYEtlcHQgRmFzdCBtb2RlIE9GRmBcbiAgICBvbkRvbmUobWVzc2FnZSwgeyBkaXNwbGF5OiAnc3lzdGVtJyB9KVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlKCk6IHZvaWQge1xuICAgIGlmIChpc1VuYXZhaWxhYmxlKSByZXR1cm5cbiAgICBzZXRFbmFibGVGYXN0TW9kZShwcmV2ID0+ICFwcmV2KVxuICB9XG5cbiAgdXNlS2V5YmluZGluZ3MoXG4gICAge1xuICAgICAgJ2NvbmZpcm06eWVzJzogaGFuZGxlQ29uZmlybSxcbiAgICAgICdjb25maXJtOm5leHRGaWVsZCc6IGhhbmRsZVRvZ2dsZSxcbiAgICAgICdjb25maXJtOm5leHQnOiBoYW5kbGVUb2dnbGUsXG4gICAgICAnY29uZmlybTpwcmV2aW91cyc6IGhhbmRsZVRvZ2dsZSxcbiAgICAgICdjb25maXJtOmN5Y2xlTW9kZSc6IGhhbmRsZVRvZ2dsZSxcbiAgICAgICdjb25maXJtOnRvZ2dsZSc6IGhhbmRsZVRvZ2dsZSxcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSxcbiAgKVxuXG4gIGNvbnN0IHRpdGxlID0gKFxuICAgIDxUZXh0PlxuICAgICAgPEZhc3RJY29uIGNvb2xkb3duPXtpc0Nvb2xkb3dufSAvPiBGYXN0IG1vZGUgKHJlc2VhcmNoIHByZXZpZXcpXG4gICAgPC9UZXh0PlxuICApXG5cbiAgcmV0dXJuIChcbiAgICA8RGlhbG9nXG4gICAgICB0aXRsZT17dGl0bGV9XG4gICAgICBzdWJ0aXRsZT17YEhpZ2gtc3BlZWQgbW9kZSBmb3IgJHtGQVNUX01PREVfTU9ERUxfRElTUExBWX0uIEJpbGxlZCBhcyBleHRyYSB1c2FnZSBhdCBhIHByZW1pdW0gcmF0ZS4gU2VwYXJhdGUgcmF0ZSBsaW1pdHMgYXBwbHkuYH1cbiAgICAgIG9uQ2FuY2VsPXtoYW5kbGVDYW5jZWx9XG4gICAgICBjb2xvcj1cImZhc3RNb2RlXCJcbiAgICAgIGlucHV0R3VpZGU9e2V4aXRTdGF0ZSA9PlxuICAgICAgICBleGl0U3RhdGUucGVuZGluZyA/IChcbiAgICAgICAgICA8VGV4dD5QcmVzcyB7ZXhpdFN0YXRlLmtleU5hbWV9IGFnYWluIHRvIGV4aXQ8L1RleHQ+XG4gICAgICAgICkgOiBpc1VuYXZhaWxhYmxlID8gKFxuICAgICAgICAgIDxUZXh0PkVzYyB0byBjYW5jZWw8L1RleHQ+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFRleHQ+VGFiIHRvIHRvZ2dsZSDCtyBFbnRlciB0byBjb25maXJtIMK3IEVzYyB0byBjYW5jZWw8L1RleHQ+XG4gICAgICAgIClcbiAgICAgIH1cbiAgICA+XG4gICAgICB7dW5hdmFpbGFibGVSZWFzb24gPyAoXG4gICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPnt1bmF2YWlsYWJsZVJlYXNvbn08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKSA6IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezB9IG1hcmdpbkxlZnQ9ezJ9PlxuICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXsyfT5cbiAgICAgICAgICAgICAgPFRleHQgYm9sZD5GYXN0IG1vZGU8L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgICAgY29sb3I9e2VuYWJsZUZhc3RNb2RlID8gJ2Zhc3RNb2RlJyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICBib2xkPXtlbmFibGVGYXN0TW9kZX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtlbmFibGVGYXN0TW9kZSA/ICdPTiAnIDogJ09GRid9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e3ByaWNpbmd9PC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICB7aXNDb29sZG93biAmJiBydW50aW1lU3RhdGUuc3RhdHVzID09PSAnY29vbGRvd24nICYmIChcbiAgICAgICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgIHtydW50aW1lU3RhdGUucmVhc29uID09PSAnb3ZlcmxvYWRlZCdcbiAgICAgICAgICAgICAgICAgID8gJ0Zhc3QgbW9kZSBvdmVybG9hZGVkIGFuZCBpcyB0ZW1wb3JhcmlseSB1bmF2YWlsYWJsZSdcbiAgICAgICAgICAgICAgICAgIDogXCJZb3UndmUgaGl0IHlvdXIgZmFzdCBsaW1pdFwifVxuICAgICAgICAgICAgICAgIHsnIMK3IHJlc2V0cyBpbiAnfVxuICAgICAgICAgICAgICAgIHtmb3JtYXREdXJhdGlvbihydW50aW1lU3RhdGUucmVzZXRBdCAtIERhdGUubm93KCksIHtcbiAgICAgICAgICAgICAgICAgIGhpZGVUcmFpbGluZ1plcm9zOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICApfVxuICAgICAgICA8Lz5cbiAgICAgICl9XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgTGVhcm4gbW9yZTp7JyAnfVxuICAgICAgICA8TGluayB1cmw9XCJodHRwczovL2NvZGUuY2xhdWRlLmNvbS9kb2NzL2VuL2Zhc3QtbW9kZVwiPlxuICAgICAgICAgIGh0dHBzOi8vY29kZS5jbGF1ZGUuY29tL2RvY3MvZW4vZmFzdC1tb2RlXG4gICAgICAgIDwvTGluaz5cbiAgICAgIDwvVGV4dD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVGYXN0TW9kZVNob3J0Y3V0KFxuICBlbmFibGU6IGJvb2xlYW4sXG4gIGdldEFwcFN0YXRlOiAoKSA9PiBBcHBTdGF0ZSxcbiAgc2V0QXBwU3RhdGU6IChmOiAocHJldjogQXBwU3RhdGUpID0+IEFwcFN0YXRlKSA9PiB2b2lkLFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgdW5hdmFpbGFibGVSZWFzb24gPSBnZXRGYXN0TW9kZVVuYXZhaWxhYmxlUmVhc29uKClcbiAgaWYgKHVuYXZhaWxhYmxlUmVhc29uKSB7XG4gICAgcmV0dXJuIGBGYXN0IG1vZGUgdW5hdmFpbGFibGU6ICR7dW5hdmFpbGFibGVSZWFzb259YFxuICB9XG5cbiAgY29uc3QgeyBtYWluTG9vcE1vZGVsIH0gPSBnZXRBcHBTdGF0ZSgpXG4gIGFwcGx5RmFzdE1vZGUoZW5hYmxlLCBzZXRBcHBTdGF0ZSlcbiAgbG9nRXZlbnQoJ3Rlbmd1X2Zhc3RfbW9kZV90b2dnbGVkJywge1xuICAgIGVuYWJsZWQ6IGVuYWJsZSxcbiAgICBzb3VyY2U6XG4gICAgICAnc2hvcnRjdXQnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gIH0pXG5cbiAgaWYgKGVuYWJsZSkge1xuICAgIGNvbnN0IGZhc3RJY29uID0gZ2V0RmFzdEljb25TdHJpbmcodHJ1ZSlcbiAgICBjb25zdCBtb2RlbFVwZGF0ZWQgPSAhaXNGYXN0TW9kZVN1cHBvcnRlZEJ5TW9kZWwobWFpbkxvb3BNb2RlbClcbiAgICAgID8gYCDCtyBtb2RlbCBzZXQgdG8gJHtGQVNUX01PREVfTU9ERUxfRElTUExBWX1gXG4gICAgICA6ICcnXG4gICAgY29uc3QgcHJpY2luZyA9IGZvcm1hdE1vZGVsUHJpY2luZyhnZXRPcHVzNDZDb3N0VGllcih0cnVlKSlcbiAgICByZXR1cm4gYCR7ZmFzdEljb259IEZhc3QgbW9kZSBPTiR7bW9kZWxVcGRhdGVkfSDCtyAke3ByaWNpbmd9YFxuICB9IGVsc2Uge1xuICAgIHJldHVybiBgRmFzdCBtb2RlIE9GRmBcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbChcbiAgb25Eb25lOiBMb2NhbEpTWENvbW1hbmRPbkRvbmUsXG4gIGNvbnRleHQ6IExvY2FsSlNYQ29tbWFuZENvbnRleHQsXG4gIGFyZ3M/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZSB8IG51bGw+IHtcbiAgaWYgKCFpc0Zhc3RNb2RlRW5hYmxlZCgpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIEZldGNoIG9yZyBmYXN0IG1vZGUgc3RhdHVzIGJlZm9yZSBzaG93aW5nIHRoZSBwaWNrZXIuIFdlIG11c3Qga25vd1xuICAvLyB3aGV0aGVyIHRoZSBvcmcgaGFzIGRpc2FibGVkIGZhc3QgbW9kZSBiZWZvcmUgYWxsb3dpbmcgYW55IHRvZ2dsZS5cbiAgLy8gSWYgYSBzdGFydHVwIHByZWZldGNoIGlzIGFscmVhZHkgaW4gZmxpZ2h0LCB0aGlzIGF3YWl0cyBpdC5cbiAgYXdhaXQgcHJlZmV0Y2hGYXN0TW9kZVN0YXR1cygpXG5cbiAgY29uc3QgYXJnID0gYXJncz8udHJpbSgpLnRvTG93ZXJDYXNlKClcbiAgaWYgKGFyZyA9PT0gJ29uJyB8fCBhcmcgPT09ICdvZmYnKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlRmFzdE1vZGVTaG9ydGN1dChcbiAgICAgIGFyZyA9PT0gJ29uJyxcbiAgICAgIGNvbnRleHQuZ2V0QXBwU3RhdGUsXG4gICAgICBjb250ZXh0LnNldEFwcFN0YXRlLFxuICAgIClcbiAgICBvbkRvbmUocmVzdWx0KVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCB1bmF2YWlsYWJsZVJlYXNvbiA9IGdldEZhc3RNb2RlVW5hdmFpbGFibGVSZWFzb24oKVxuICBsb2dFdmVudCgndGVuZ3VfZmFzdF9tb2RlX3BpY2tlcl9zaG93bicsIHtcbiAgICB1bmF2YWlsYWJsZV9yZWFzb246ICh1bmF2YWlsYWJsZVJlYXNvbiA/P1xuICAgICAgJycpIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gIH0pXG4gIHJldHVybiAoXG4gICAgPEZhc3RNb2RlUGlja2VyIG9uRG9uZT17b25Eb25lfSB1bmF2YWlsYWJsZVJlYXNvbj17dW5hdmFpbGFibGVSZWFzb259IC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxRQUFRLE9BQU87QUFDaEMsY0FDRUMsb0JBQW9CLEVBQ3BCQyxzQkFBc0IsUUFDakIsbUJBQW1CO0FBQzFCLFNBQVNDLE1BQU0sUUFBUSwwQ0FBMEM7QUFDakUsU0FBU0MsUUFBUSxFQUFFQyxpQkFBaUIsUUFBUSw4QkFBOEI7QUFDMUUsU0FBU0Ms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QUltQixNQUFNLEVBQUU7SUFDVixNQUFNa0MsUUFBUSxHQUFHMUQsaUJBQWlCLENBQUMsSUFBSSxDQUFDO0lBQ3hDLE1BQU0yRCxZQUFZLEdBQUcsQ0FBQzFDLDBCQUEwQixDQUFDYyxhQUFhLENBQUMsR0FDM0QsbUJBQW1CbkIsdUJBQXVCLEVBQUUsR0FDNUMsRUFBRTtJQUNOLE1BQU15QyxPQUFPLEdBQUdqQyxrQkFBa0IsQ0FBQ0MsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0QsT0FBTyxHQUFHcUMsUUFBUSxnQkFBZ0JDLFlBQVksTUFBTU4sT0FBTyxFQUFFO0VBQy9ELENBQUMsTUFBTTtJQUNMLE9BQU8sZUFBZTtFQUN4QjtBQUNGO0FBRUEsT0FBTyxlQUFlc0MsSUFBSUEsQ0FDeEJ0RCxNQUFNLEVBQUUzQixxQkFBcUIsRUFDN0I0RCxPQUFPLEVBQUV6RSxzQkFBc0IsRUFDL0IrRixJQUFhLENBQVIsRUFBRSxNQUFNLENBQ2QsRUFBRUYsT0FBTyxDQUFDaEcsS0FBSyxDQUFDbUcsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO0VBQ2pDLElBQUksQ0FBQzdFLGlCQUFpQixDQUFDLENBQUMsRUFBRTtJQUN4QixPQUFPLElBQUk7RUFDYjs7RUFFQTtFQUNBO0VBQ0E7RUFDQSxNQUFNRSxzQkFBc0IsQ0FBQyxDQUFDO0VBRTlCLE1BQU00RSxHQUFHLEdBQUdGLElBQUksRUFBRUcsSUFBSSxDQUFDLENBQUMsQ0FBQ0MsV0FBVyxDQUFDLENBQUM7RUFDdEMsSUFBSUYsR0FBRyxLQUFLLElBQUksSUFBSUEsR0FBRyxLQUFLLEtBQUssRUFBRTtJQUNqQyxNQUFNRyxNQUFNLEdBQUcsTUFBTVQsc0JBQXNCLENBQ3pDTSxHQUFHLEtBQUssSUFBSSxFQUNaeEIsT0FBTyxDQUFDbUIsV0FBVyxFQUNuQm5CLE9BQU8sQ0FBQzdDLFdBQ1YsQ0FBQztJQUNEWSxNQUFNLENBQUM0RCxNQUFNLENBQUM7SUFDZCxPQUFPLElBQUk7RUFDYjtFQUVBLE1BQU0zRCxpQkFBaUIsR0FBR3ZCLDRCQUE0QixDQUFDLENBQUM7RUFDeERULFFBQVEsQ0FBQyw4QkFBOEIsRUFBRTtJQUN2QzRGLGtCQUFrQixFQUFFLENBQUM1RCxpQkFBaUIsSUFDcEMsRUFBRSxLQUFLakM7RUFDWCxDQUFDLENBQUM7RUFDRixPQUNFLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDZ0MsTUFBTSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQ0MsaUJBQWlCLENBQUMsR0FBRztBQUU1RSIsImlnbm9yZUxpc3QiOltdfQ==