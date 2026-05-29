// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * HooksConfigMenu is a read-only browser for configured hooks.
 *
 * Users can drill into each hook event, see configured matchers and hooks
 * (of any type: command, prompt, agent, http), and view individual hook
 * details. To add or modify hooks, users should edit settings.json directly
 * or ask Claude — the menu directs them there.
 *
 * The menu is read-only because the old editing UI only supported
 * command-type hooks and duplicating the settings.json editing surface
 * in-menu for all four types would be a maintenance burden.
 */
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useMemo, useState } from 'react';
// 类型依赖 { HookEvent } 来自 src/entrypoints/agentSdkTypes.js，用于校准终端渲染的数据契约。
import type { HookEvent } from 'src/entrypoints/agentSdkTypes.js';
// 引入 useAppState、useAppStateStore，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useAppStateStore } from 'src/state/AppState.js';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 引入 useSettingsChange，将 ../../hooks/useSettingsChange.js 中已经封装好的能力接到本文件流程里。
import { useSettingsChange } from '../../hooks/useSettingsChange.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 复用 getHookEventMetadata、getHooksForMatcher、getMatcherMetadata、getSortedMatchersForEvent、groupHooksByEventAndMatcher 工具函数，把通用处理留在 ../../utils/hooks/hooksConfigManager.js 中维护。
import { getHookEventMetadata, getHooksForMatcher, getMatcherMetadata, getSortedMatchersForEvent, groupHooksByEventAndMatcher } from '../../utils/hooks/hooksConfigManager.js';
// 类型依赖 { IndividualHookConfig } 来自 ../../utils/hooks/hooksSettings.js，用于校准终端渲染的数据契约。
import type { IndividualHookConfig } from '../../utils/hooks/hooksSettings.js';
// 复用 getSettings_DEPRECATED、getSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED, getSettingsForSource } from '../../utils/settings/settings.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 SelectEventMode，将 ./SelectEventMode.js 中已经封装好的能力接到本文件流程里。
import { SelectEventMode } from './SelectEventMode.js';
// 引入 SelectHookMode，将 ./SelectHookMode.js 中已经封装好的能力接到本文件流程里。
import { SelectHookMode } from './SelectHookMode.js';
// 引入 SelectMatcherMode，将 ./SelectMatcherMode.js 中已经封装好的能力接到本文件流程里。
import { SelectMatcherMode } from './SelectMatcherMode.js';
// 引入 ViewHookMode，将 ./ViewHookMode.js 中已经封装好的能力接到本文件流程里。
import { ViewHookMode } from './ViewHookMode.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  toolNames: string[];
  onExit: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// ModeState 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ModeState = {
  mode: 'select-event';
} | {
  mode: 'select-matcher';
  event: HookEvent;
} | {
  mode: 'select-hook';
  event: HookEvent;
  matcher: string;
} | {
  mode: 'view-hook';
  event: HookEvent;
  hook: IndividualHookConfig;
};
// HooksConfigMenu 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function HooksConfigMenu(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(100);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolNames,
    onExit
  } = t0;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      mode: "select-event"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // modeState 状态 由 React state 持有，setModeState 会在用户操作或异步结果返回时触发刷新。
  const [modeState, setModeState] = useState(t1);
  // disabledByPolicy 由 React state 持有，setDisabledByPolicy 会在用户操作或异步结果返回时触发刷新。
  const [disabledByPolicy, setDisabledByPolicy] = useState(_temp);
  // restrictedByPolicy 由 React state 持有，setRestrictedByPolicy 会在用户操作或异步结果返回时触发刷新。
  const [restrictedByPolicy, setRestrictedByPolicy] = useState(_temp2);
  // t2 暂存 `source => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `source => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = source => {
      // 当 `source` 匹配 `"policySettings"` 时，终端渲染执行对应分支。
      if (source === "policySettings") {
        // settings_0读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
        const settings_0 = getSettings_DEPRECATED();
        // hooksDisabled_0标记终端 UI Hooks Config Menu是否启用对应路径。
        const hooksDisabled_0 = settings_0?.disableAllHooks === true;
        // setDisabledByPolicy 写入新的状态值，使终端渲染后续读取保持一致。
        setDisabledByPolicy(hooksDisabled_0 && getSettingsForSource("policySettings")?.disableAllHooks === true);
        // setRestrictedByPolicy 写入新的状态值，使终端渲染后续读取保持一致。
        setRestrictedByPolicy(getSettingsForSource("policySettings")?.allowManagedHooksOnly === true);
      }
    };
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 调用 useSettingsChange，触发终端渲染此处需要的副作用。
  useSettingsChange(t2);
  // mode 命名 `modeState.mode`，让后续代码直接表达这个值的用途。
  const mode = modeState.mode;
  // selectedEvent固定为 `"event" in modeState ? modeState.event : "PreToolUse"`，作为终端 UI Hooks Config Menu后续展示或比较的基准。
  const selectedEvent = "event" in modeState ? modeState.event : "PreToolUse";
  // selectedMatcher 命名 `"matcher" in modeState ? modeState.matcher : null`，让后续代码直接表达这个值的用途。
  const selectedMatcher = "matcher" in modeState ? modeState.matcher : null;
  // mcp保存`useAppState`，供终端渲染后续处理使用。
  const mcp = useAppState(_temp3);
  // appStateStore 状态保存`useAppStateStore`，供终端渲染后续处理使用。
  const appStateStore = useAppStateStore();
  // t3 暂存 `[...toolNames, ...mcp.tools.map(_temp4)]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== mcp.tools || $[3] !== toolNames) {
    // t3 暂存 `[...toolNames, ...mcp.tools.map(_temp4)]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [...toolNames, ...mcp.tools.map(_temp4)];
    // $[2] 缓存 `mcp.tools`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = mcp.tools;
    // $[3] 缓存 `toolNames`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = toolNames;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // combinedToolNames 集合沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const combinedToolNames = t3;
  // t4 暂存 `groupHooksByEventAndMatcher(appStateStore.getState(), com...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== appStateStore || $[6] !== combinedToolNames) {
    // t4 暂存 `groupHooksByEventAndMatcher(appStateStore.getState(), com...` 生成的渲染片段，后续返回路径直接复用。
    t4 = groupHooksByEventAndMatcher(appStateStore.getState(), combinedToolNames);
    // $[5] 缓存 `appStateStore`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = appStateStore;
    // $[6] 缓存 `combinedToolNames`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = combinedToolNames;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // hooksByEventAndMatcher保存`t4`，作为后续临时缓存值处理的输入。
  const hooksByEventAndMatcher = t4;
  // t5 暂存 `getSortedMatchersForEvent(hooksByEventAndMatcher, selecte...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== hooksByEventAndMatcher || $[9] !== selectedEvent) {
    // t5 暂存 `getSortedMatchersForEvent(hooksByEventAndMatcher, selecte...` 生成的渲染片段，后续返回路径直接复用。
    t5 = getSortedMatchersForEvent(hooksByEventAndMatcher, selectedEvent);
    // $[8] 缓存 `hooksByEventAndMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = hooksByEventAndMatcher;
    // $[9] 缓存 `selectedEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = selectedEvent;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // sortedMatchersForSelectedEvent沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const sortedMatchersForSelectedEvent = t5;
  // t6 暂存 `getHooksForMatcher(hooksByEventAndMatcher, selectedEvent,...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== hooksByEventAndMatcher || $[12] !== selectedEvent || $[13] !== selectedMatcher) {
    // t6 暂存 `getHooksForMatcher(hooksByEventAndMatcher, selectedEvent,...` 生成的渲染片段，后续返回路径直接复用。
    t6 = getHooksForMatcher(hooksByEventAndMatcher, selectedEvent, selectedMatcher);
    // $[11] 缓存 `hooksByEventAndMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = hooksByEventAndMatcher;
    // $[12] 缓存 `selectedEvent`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = selectedEvent;
    // $[13] 缓存 `selectedMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = selectedMatcher;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // hooksForSelectedMatcher 命名 `t6`，让后续代码直接表达这个值的用途。
  const hooksForSelectedMatcher = t6;
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== onExit) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 调用 onExit，触发终端渲染此处需要的副作用。
      onExit("Hooks dialog dismissed", {
        display: "system"
      });
    };
    // $[15] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = onExit;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // handleExit 命名 `t7`，让后续代码直接表达这个值的用途。
  const handleExit = t7;
  // t8标记终端 UI Hooks Config Menu是否启用对应路径。
  const t8 = mode === "select-event";
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== t8) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Confirmation",
      isActive: t8
    };
    // $[17] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t8;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", handleExit, t9);
  // t10 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = () => {
      // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
      setModeState({
        mode: "select-event"
      });
    };
    // $[19] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[19];
  }
  // t11标记终端 UI Hooks Config Menu是否启用对应路径。
  const t11 = mode === "select-matcher";
  // t12 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== t11) {
    // t12 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t12 = {
      context: "Confirmation",
      isActive: t11
    };
    // $[20] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t11;
    // $[21] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[21];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", t10, t12);
  // t13 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== combinedToolNames || $[23] !== modeState) {
    // t13 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t13 = () => {
      // 满足 `"event" in modeState` 时，终端渲染执行该分支。
      if ("event" in modeState) {
        // `getMatcherMetadata(modeState.event, combine...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
        if (getMatcherMetadata(modeState.event, combinedToolNames) !== undefined) {
          // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
          setModeState({
            mode: "select-matcher",
            event: modeState.event
          });
        } else {
          // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
          setModeState({
            mode: "select-event"
          });
        }
      }
    };
    // $[22] 缓存 `combinedToolNames`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = combinedToolNames;
    // $[23] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = modeState;
    // $[24] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[24];
  }
  // t14标记终端 UI Hooks Config Menu是否启用对应路径。
  const t14 = mode === "select-hook";
  // t15 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== t14) {
    // t15 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t15 = {
      context: "Confirmation",
      isActive: t14
    };
    // $[25] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t14;
    // $[26] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[26];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", t13, t15);
  // t16 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== modeState) {
    // t16 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t16 = () => {
      // 当 `modeState.mode` 匹配 `"view-hook"` 时，终端渲染执行对应分支。
      if (modeState.mode === "view-hook") {
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          event,
          hook
        } = modeState;
        // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
        setModeState({
          mode: "select-hook",
          event,
          matcher: hook.matcher || ""
        });
      }
    };
    // $[27] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = modeState;
    // $[28] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[28];
  }
  // t17标记终端 UI Hooks Config Menu是否启用对应路径。
  const t17 = mode === "view-hook";
  // t18 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== t17) {
    // t18 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t18 = {
      context: "Confirmation",
      isActive: t17
    };
    // $[29] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t17;
    // $[30] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[30];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", t16, t18);
  // t19 暂存 `getHookEventMetadata(combinedToolNames)` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== combinedToolNames) {
    // t19 暂存 `getHookEventMetadata(combinedToolNames)` 生成的渲染片段，后续返回路径直接复用。
    t19 = getHookEventMetadata(combinedToolNames);
    // $[31] 缓存 `combinedToolNames`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = combinedToolNames;
    // $[32] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[32];
  }
  // hookEventMetadata 命名 `t19`，让后续代码直接表达这个值的用途。
  const hookEventMetadata = t19;
  // settings_1读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
  const settings_1 = getSettings_DEPRECATED();
  // hooksDisabled_1标记终端 UI Hooks Config Menu是否启用对应路径。
  const hooksDisabled_1 = settings_1?.disableAllHooks === true;
  // t20 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[33] !== hooksByEventAndMatcher) {
    // byEvent 从空对象开始收集键值，后续按名称补齐内容。
    const byEvent = {};
    // total保存`0`，供后续判断或组装使用。
    let total = 0;
    // 循环处理 `const [event_0, matchers] of Object.entries(hooksByEventAndMatcher)`，让终端渲染把同类条目按顺序走完。
    for (const [event_0, matchers] of Object.entries(hooksByEventAndMatcher)) {
      // eventCount 数量派生`Object.values`，供终端渲染后续处理使用。
      const eventCount = Object.values(matchers).reduce(_temp5, 0);
      // byEvent[event_0 as HookEvent更新为 `eventCount`，确保终端 UI 组件 Hooks Config Menu后续读取最新状态。
      byEvent[event_0 as HookEvent] = eventCount;
      // total更新为 `total + eventCount`，确保终端 UI后续读取最新状态。
      total = total + eventCount;
    }
    // t20 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t20 = {
      hooksByEvent: byEvent,
      totalHooksCount: total
    };
    // $[33] 缓存 `hooksByEventAndMatcher`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = hooksByEventAndMatcher;
    // $[34] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[34];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    hooksByEvent,
    totalHooksCount
  } = t20;
  // 满足 `hooksDisabled_1` 时，终端渲染执行该分支。
  if (hooksDisabled_1) {
    // t21 暂存 `<Text bold={true}>disabled</Text>` 的派生结果，便于缓存命中时直接复用。
    let t21;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
      // t21 暂存 `<Text bold={true}>disabled</Text>` 生成的渲染片段，后续返回路径直接复用。
      t21 = <Text bold={true}>disabled</Text>;
      // $[35] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = t21;
    } else {
      // t21 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
      t21 = $[35];
    }
    // t22标记终端 UI Hooks Config Menu是否启用对应路径。
    const t22 = disabledByPolicy && " by a managed settings file";
    // t23 暂存 `<Text bold={true}>{totalHooksCount}</Text>` 的派生结果，便于缓存命中时直接复用。
    let t23;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[36] !== totalHooksCount) {
      // t23 暂存 `<Text bold={true}>{totalHooksCount}</Text>` 生成的渲染片段，后续返回路径直接复用。
      t23 = <Text bold={true}>{totalHooksCount}</Text>;
      // $[36] 缓存 `totalHooksCount`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = totalHooksCount;
      // $[37] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[37] = t23;
    } else {
      // t23 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
      t23 = $[37];
    }
    // t24 暂存 `plural(totalHooksCount, "hook")` 的派生结果，便于缓存命中时直接复用。
    let t24;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[38] !== totalHooksCount) {
      // t24 暂存 `plural(totalHooksCount, "hook")` 生成的渲染片段，后续返回路径直接复用。
      t24 = plural(totalHooksCount, "hook");
      // $[38] 缓存 `totalHooksCount`，下次依赖未变时 React 编译产物可直接复用。
      $[38] = totalHooksCount;
      // $[39] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[39] = t24;
    } else {
      // t24 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
      t24 = $[39];
    }
    // t25 暂存 `plural(totalHooksCount, "is", "are")` 的派生结果，便于缓存命中时直接复用。
    let t25;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[40] !== totalHooksCount) {
      // t25 暂存 `plural(totalHooksCount, "is", "are")` 生成的渲染片段，后续返回路径直接复用。
      t25 = plural(totalHooksCount, "is", "are");
      // $[40] 缓存 `totalHooksCount`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = totalHooksCount;
      // $[41] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = t25;
    } else {
      // t25 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
      t25 = $[41];
    }
    // t26 暂存 `<Text>All hooks are currently {t21}{t22}. You have{" "}{t...` 的派生结果，便于缓存命中时直接复用。
    let t26;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[42] !== t22 || $[43] !== t23 || $[44] !== t24 || $[45] !== t25) {
      // t26 暂存 `<Text>All hooks are currently {t21}{t22}. You have{" "}{t...` 生成的渲染片段，后续返回路径直接复用。
      t26 = <Text>All hooks are currently {t21}{t22}. You have{" "}{t23} configured{" "}{t24} that{" "}{t25} not running.</Text>;
      // $[42] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = t22;
      // $[43] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = t23;
      // $[44] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = t24;
      // $[45] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = t25;
      // $[46] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t26;
    } else {
      // t26 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
      t26 = $[46];
    }
    // t27 暂存 `<Box marginTop={1}><Text dimColor={true}>When hooks are d...` 的派生结果，便于缓存命中时直接复用。
    let t27;
    // t28 暂存 `<Text dimColor={true}>· No hook commands will execute</Te...` 的派生结果，便于缓存命中时直接复用。
    let t28;
    // t29 暂存 `<Text dimColor={true}>· StatusLine will not be displayed<...` 的派生结果，便于缓存命中时直接复用。
    let t29;
    // t30 暂存 `<Text dimColor={true}>· Tool operations will proceed with...` 的派生结果，便于缓存命中时直接复用。
    let t30;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[47] === Symbol.for("react.memo_cache_sentinel")) {
      // t27 暂存 `<Box marginTop={1}><Text dimColor={true}>When hooks are d...` 生成的渲染片段，后续返回路径直接复用。
      t27 = <Box marginTop={1}><Text dimColor={true}>When hooks are disabled:</Text></Box>;
      // t28 暂存 `<Text dimColor={true}>· No hook commands will execute</Te...` 生成的渲染片段，后续返回路径直接复用。
      t28 = <Text dimColor={true}>· No hook commands will execute</Text>;
      // t29 暂存 `<Text dimColor={true}>· StatusLine will not be displayed<...` 生成的渲染片段，后续返回路径直接复用。
      t29 = <Text dimColor={true}>· StatusLine will not be displayed</Text>;
      // t30 暂存 `<Text dimColor={true}>· Tool operations will proceed with...` 生成的渲染片段，后续返回路径直接复用。
      t30 = <Text dimColor={true}>· Tool operations will proceed without hook validation</Text>;
      // $[47] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = t27;
      // $[48] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
      $[48] = t28;
      // $[49] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
      $[49] = t29;
      // $[50] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
      $[50] = t30;
    } else {
      // t27 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
      t27 = $[47];
      // t28 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
      t28 = $[48];
      // t29 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
      t29 = $[49];
      // t30 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
      t30 = $[50];
    }
    // t31 暂存 `<Box flexDirection="column">{t26}{t27}{t28}{t29}{t30}</Bo...` 的派生结果，便于缓存命中时直接复用。
    let t31;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[51] !== t26) {
      // t31 暂存 `<Box flexDirection="column">{t26}{t27}{t28}{t29}{t30}</Bo...` 生成的渲染片段，后续返回路径直接复用。
      t31 = <Box flexDirection="column">{t26}{t27}{t28}{t29}{t30}</Box>;
      // $[51] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
      $[51] = t26;
      // $[52] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
      $[52] = t31;
    } else {
      // t31 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
      t31 = $[52];
    }
    // t32 暂存 `!disabledByPolicy && <Text dimColor={true}>To re-enable h...` 的派生结果，便于缓存命中时直接复用。
    let t32;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[53] !== disabledByPolicy) {
      // t32 暂存 `!disabledByPolicy && <Text dimColor={true}>To re-enable h...` 生成的渲染片段，后续返回路径直接复用。
      t32 = !disabledByPolicy && <Text dimColor={true}>To re-enable hooks, remove "disableAllHooks" from settings.json or ask Claude.</Text>;
      // $[53] 缓存 `disabledByPolicy`，下次依赖未变时 React 编译产物可直接复用。
      $[53] = disabledByPolicy;
      // $[54] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
      $[54] = t32;
    } else {
      // t32 从 React 编译缓存槽 $[54] 取回渲染片段，避免依赖未变时重建 JSX。
      t32 = $[54];
    }
    // t33 暂存 `<Box flexDirection="column" gap={1}>{t31}{t32}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t33;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[55] !== t31 || $[56] !== t32) {
      // t33 暂存 `<Box flexDirection="column" gap={1}>{t31}{t32}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t33 = <Box flexDirection="column" gap={1}>{t31}{t32}</Box>;
      // $[55] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
      $[55] = t31;
      // $[56] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
      $[56] = t32;
      // $[57] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
      $[57] = t33;
    } else {
      // t33 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
      t33 = $[57];
    }
    // t34 暂存 `<Dialog title="Hook Configuration - Disabled" onCancel={h...` 的派生结果，便于缓存命中时直接复用。
    let t34;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[58] !== handleExit || $[59] !== t33) {
      // t34 暂存 `<Dialog title="Hook Configuration - Disabled" onCancel={h...` 生成的渲染片段，后续返回路径直接复用。
      t34 = <Dialog title="Hook Configuration - Disabled" onCancel={handleExit} inputGuide={_temp6}>{t33}</Dialog>;
      // $[58] 缓存 `handleExit`，下次依赖未变时 React 编译产物可直接复用。
      $[58] = handleExit;
      // $[59] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
      $[59] = t33;
      // $[60] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
      $[60] = t34;
    } else {
      // t34 从 React 编译缓存槽 $[60] 取回渲染片段，避免依赖未变时重建 JSX。
      t34 = $[60];
    }
    // 返回 `t34`，作为终端渲染这次计算的结果。
    return t34;
  }
  // 按照 modeState.mode 的取值选择终端渲染的具体处理分支。
  switch (modeState.mode) {
    case "select-event":
      {
        // t21 暂存 `event_2 => {` 的派生结果，便于缓存命中时直接复用。
        let t21;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[61] !== combinedToolNames) {
          // t21 暂存 `event_2 => {` 生成的渲染片段，后续返回路径直接复用。
          t21 = event_2 => {
            // `getMatcherMetadata(event_2, combinedToolNam...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (getMatcherMetadata(event_2, combinedToolNames) !== undefined) {
              // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
              setModeState({
                mode: "select-matcher",
                event: event_2
              });
            } else {
              // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
              setModeState({
                mode: "select-hook",
                event: event_2,
                matcher: ""
              });
            }
          };
          // $[61] 缓存 `combinedToolNames`，下次依赖未变时 React 编译产物可直接复用。
          $[61] = combinedToolNames;
          // $[62] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[62] = t21;
        } else {
          // t21 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
          t21 = $[62];
        }
        // t22 暂存 `<SelectEventMode hookEventMetadata={hookEventMetadata} ho...` 的派生结果，便于缓存命中时直接复用。
        let t22;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[63] !== handleExit || $[64] !== hookEventMetadata || $[65] !== hooksByEvent || $[66] !== restrictedByPolicy || $[67] !== t21 || $[68] !== totalHooksCount) {
          // t22 暂存 `<SelectEventMode hookEventMetadata={hookEventMetadata} ho...` 生成的渲染片段，后续返回路径直接复用。
          t22 = <SelectEventMode hookEventMetadata={hookEventMetadata} hooksByEvent={hooksByEvent} totalHooksCount={totalHooksCount} restrictedByPolicy={restrictedByPolicy} onSelectEvent={t21} onCancel={handleExit} />;
          // $[63] 缓存 `handleExit`，下次依赖未变时 React 编译产物可直接复用。
          $[63] = handleExit;
          // $[64] 缓存 `hookEventMetadata`，下次依赖未变时 React 编译产物可直接复用。
          $[64] = hookEventMetadata;
          // $[65] 缓存 `hooksByEvent`，下次依赖未变时 React 编译产物可直接复用。
          $[65] = hooksByEvent;
          // $[66] 缓存 `restrictedByPolicy`，下次依赖未变时 React 编译产物可直接复用。
          $[66] = restrictedByPolicy;
          // $[67] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[67] = t21;
          // $[68] 缓存 `totalHooksCount`，下次依赖未变时 React 编译产物可直接复用。
          $[68] = totalHooksCount;
          // $[69] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[69] = t22;
        } else {
          // t22 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
          t22 = $[69];
        }
        // 返回 `t22`，作为终端渲染这次计算的结果。
        return t22;
      }
    case "select-matcher":
      {
        // t21保存`hookEventMetadata[modeState.event]`，供终端 UI Hooks Config Menu后续判断或输出使用。
        const t21 = hookEventMetadata[modeState.event];
        // t22 暂存 `matcher => {` 的派生结果，便于缓存命中时直接复用。
        let t22;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[70] !== modeState.event) {
          // t22 暂存 `matcher => {` 生成的渲染片段，后续返回路径直接复用。
          t22 = matcher => {
            // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
            setModeState({
              mode: "select-hook",
              event: modeState.event,
              matcher
            });
          };
          // $[70] 缓存 `modeState.event`，下次依赖未变时 React 编译产物可直接复用。
          $[70] = modeState.event;
          // $[71] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[71] = t22;
        } else {
          // t22 从 React 编译缓存槽 $[71] 取回渲染片段，避免依赖未变时重建 JSX。
          t22 = $[71];
        }
        // t23 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
        let t23;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[72] === Symbol.for("react.memo_cache_sentinel")) {
          // t23 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
          t23 = () => {
            // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
            setModeState({
              mode: "select-event"
            });
          };
          // $[72] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[72] = t23;
        } else {
          // t23 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
          t23 = $[72];
        }
        // t24 暂存 `<SelectMatcherMode selectedEvent={modeState.event} matche...` 的派生结果，便于缓存命中时直接复用。
        let t24;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[73] !== hooksByEventAndMatcher || $[74] !== modeState.event || $[75] !== sortedMatchersForSelectedEvent || $[76] !== t21.description || $[77] !== t22) {
          // t24 暂存 `<SelectMatcherMode selectedEvent={modeState.event} matche...` 生成的渲染片段，后续返回路径直接复用。
          t24 = <SelectMatcherMode selectedEvent={modeState.event} matchersForSelectedEvent={sortedMatchersForSelectedEvent} hooksByEventAndMatcher={hooksByEventAndMatcher} eventDescription={t21.description} onSelect={t22} onCancel={t23} />;
          // $[73] 缓存 `hooksByEventAndMatcher`，下次依赖未变时 React 编译产物可直接复用。
          $[73] = hooksByEventAndMatcher;
          // $[74] 缓存 `modeState.event`，下次依赖未变时 React 编译产物可直接复用。
          $[74] = modeState.event;
          // $[75] 缓存 `sortedMatchersForSelectedEvent`，下次依赖未变时 React 编译产物可直接复用。
          $[75] = sortedMatchersForSelectedEvent;
          // $[76] 缓存 `t21.description`，下次依赖未变时 React 编译产物可直接复用。
          $[76] = t21.description;
          // $[77] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[77] = t22;
          // $[78] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[78] = t24;
        } else {
          // t24 从 React 编译缓存槽 $[78] 取回渲染片段，避免依赖未变时重建 JSX。
          t24 = $[78];
        }
        // 返回 `t24`，作为终端渲染这次计算的结果。
        return t24;
      }
    case "select-hook":
      {
        // t21保存`hookEventMetadata[modeState.event]`，供终端 UI Hooks Config Menu后续判断或输出使用。
        const t21 = hookEventMetadata[modeState.event];
        // t22 暂存 `hook_1 => {` 的派生结果，便于缓存命中时直接复用。
        let t22;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[79] !== modeState.event) {
          // t22 暂存 `hook_1 => {` 生成的渲染片段，后续返回路径直接复用。
          t22 = hook_1 => {
            // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
            setModeState({
              mode: "view-hook",
              event: modeState.event,
              hook: hook_1
            });
          };
          // $[79] 缓存 `modeState.event`，下次依赖未变时 React 编译产物可直接复用。
          $[79] = modeState.event;
          // $[80] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[80] = t22;
        } else {
          // t22 从 React 编译缓存槽 $[80] 取回渲染片段，避免依赖未变时重建 JSX。
          t22 = $[80];
        }
        // t23 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
        let t23;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[81] !== combinedToolNames || $[82] !== modeState.event) {
          // t23 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
          t23 = () => {
            // `getMatcherMetadata(modeState.event, combine...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
            if (getMatcherMetadata(modeState.event, combinedToolNames) !== undefined) {
              // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
              setModeState({
                mode: "select-matcher",
                event: modeState.event
              });
            } else {
              // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
              setModeState({
                mode: "select-event"
              });
            }
          };
          // $[81] 缓存 `combinedToolNames`，下次依赖未变时 React 编译产物可直接复用。
          $[81] = combinedToolNames;
          // $[82] 缓存 `modeState.event`，下次依赖未变时 React 编译产物可直接复用。
          $[82] = modeState.event;
          // $[83] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[83] = t23;
        } else {
          // t23 从 React 编译缓存槽 $[83] 取回渲染片段，避免依赖未变时重建 JSX。
          t23 = $[83];
        }
        // t24 暂存 `<SelectHookMode selectedEvent={modeState.event} selectedM...` 的派生结果，便于缓存命中时直接复用。
        let t24;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[84] !== hooksForSelectedMatcher || $[85] !== modeState.event || $[86] !== modeState.matcher || $[87] !== t21 || $[88] !== t22 || $[89] !== t23) {
          // t24 暂存 `<SelectHookMode selectedEvent={modeState.event} selectedM...` 生成的渲染片段，后续返回路径直接复用。
          t24 = <SelectHookMode selectedEvent={modeState.event} selectedMatcher={modeState.matcher} hooksForSelectedMatcher={hooksForSelectedMatcher} hookEventMetadata={t21} onSelect={t22} onCancel={t23} />;
          // $[84] 缓存 `hooksForSelectedMatcher`，下次依赖未变时 React 编译产物可直接复用。
          $[84] = hooksForSelectedMatcher;
          // $[85] 缓存 `modeState.event`，下次依赖未变时 React 编译产物可直接复用。
          $[85] = modeState.event;
          // $[86] 缓存 `modeState.matcher`，下次依赖未变时 React 编译产物可直接复用。
          $[86] = modeState.matcher;
          // $[87] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[87] = t21;
          // $[88] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[88] = t22;
          // $[89] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[89] = t23;
          // $[90] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[90] = t24;
        } else {
          // t24 从 React 编译缓存槽 $[90] 取回渲染片段，避免依赖未变时重建 JSX。
          t24 = $[90];
        }
        // 返回 `t24`，作为终端渲染这次计算的结果。
        return t24;
      }
    case "view-hook":
      {
        // t21保存`modeState.hook`，供终端 UI Hooks Config Menu后续判断或输出使用。
        const t21 = modeState.hook;
        // t22 暂存 `getMatcherMetadata(modeState.event, combinedToolNames)` 的派生结果，便于缓存命中时直接复用。
        let t22;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[91] !== combinedToolNames || $[92] !== modeState.event) {
          // t22 暂存 `getMatcherMetadata(modeState.event, combinedToolNames)` 生成的渲染片段，后续返回路径直接复用。
          t22 = getMatcherMetadata(modeState.event, combinedToolNames);
          // $[91] 缓存 `combinedToolNames`，下次依赖未变时 React 编译产物可直接复用。
          $[91] = combinedToolNames;
          // $[92] 缓存 `modeState.event`，下次依赖未变时 React 编译产物可直接复用。
          $[92] = modeState.event;
          // $[93] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[93] = t22;
        } else {
          // t22 从 React 编译缓存槽 $[93] 取回渲染片段，避免依赖未变时重建 JSX。
          t22 = $[93];
        }
        // t23标记终端 UI Hooks Config Menu是否启用对应路径。
        const t23 = t22 !== undefined;
        // t24 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
        let t24;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[94] !== modeState) {
          // t24 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
          t24 = () => {
            // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
            const {
              event: event_1,
              hook: hook_0
            } = modeState;
            // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
            setModeState({
              mode: "select-hook",
              event: event_1,
              matcher: hook_0.matcher || ""
            });
          };
          // $[94] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
          $[94] = modeState;
          // $[95] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[95] = t24;
        } else {
          // t24 从 React 编译缓存槽 $[95] 取回渲染片段，避免依赖未变时重建 JSX。
          t24 = $[95];
        }
        // t25 暂存 `<ViewHookMode selectedHook={t21} eventSupportsMatcher={t2...` 的派生结果，便于缓存命中时直接复用。
        let t25;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[96] !== modeState.hook || $[97] !== t23 || $[98] !== t24) {
          // t25 暂存 `<ViewHookMode selectedHook={t21} eventSupportsMatcher={t2...` 生成的渲染片段，后续返回路径直接复用。
          t25 = <ViewHookMode selectedHook={t21} eventSupportsMatcher={t23} onCancel={t24} />;
          // $[96] 缓存 `modeState.hook`，下次依赖未变时 React 编译产物可直接复用。
          $[96] = modeState.hook;
          // $[97] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[97] = t23;
          // $[98] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[98] = t24;
          // $[99] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
          $[99] = t25;
        } else {
          // t25 从 React 编译缓存槽 $[99] 取回渲染片段，避免依赖未变时重建 JSX。
          t25 = $[99];
        }
        // 返回 `t25`，作为终端渲染这次计算的结果。
        return t25;
      }
  }
}
// _temp6 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6() {
  // 返回 `<Text>Esc to close</Text>`，作为终端渲染这次计算的结果。
  return <Text>Esc to close</Text>;
}
// _temp5 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(sum, hooks) {
  // 返回 `sum + hooks.length`，作为终端渲染这次计算的结果。
  return sum + hooks.length;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(tool) {
  // 返回 `tool.name`，作为终端渲染这次计算的结果。
  return tool.name;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(s) {
  // 返回 `s.mcp`，作为终端渲染这次计算的结果。
  return s.mcp;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2() {
  // 返回 `getSettingsForSource("policySettings")?.allowManagedHooksOnly === true`，作为终端渲染这次计算的结果。
  return getSettingsForSource("policySettings")?.allowManagedHooksOnly === true;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // settings 集合读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
  const settings = getSettings_DEPRECATED();
  // hooksDisabled标记终端 UI Hooks Config Menu是否启用对应路径。
  const hooksDisabled = settings?.disableAllHooks === true;
  // 返回 `hooksDisabled && getSettingsForSource("policySettings")?.disableAllHook...`，作为终端渲染这次计算的结果。
  return hooksDisabled && getSettingsForSource("policySettings")?.disableAllHooks === true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlTWVtbyIsInVzZVN0YXRlIiwiSG9va0V2ZW50IiwidXNlQXBwU3RhdGUiLCJ1c2VBcHBTdGF0ZVN0b3JlIiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJ1c2VTZXR0aW5nc0NoYW5nZSIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiZ2V0SG9va0V2ZW50TWV0YWRhdGEiLCJnZXRIb29rc0Zvck1hdGNoZXIiLCJnZXRNYXRjaGVyTWV0YWRhdGEiLCJnZXRTb3J0ZWRNYXRjaGVyc0ZvckV2ZW50IiwiZ3JvdXBIb29rc0J5RXZlbnRBbmRNYXRjaGVyIiwiSW5kaXZpZHVhbEhvb2tDb25maWciLCJnZXRTZXR0aW5nc19ERVBSRUNBVEVEIiwiZ2V0U2V0dGluZ3NGb3JTb3VyY2UiLCJwbHVyYWwiLCJEaWFsb2ciLCJTZWxlY3RFdmVudE1vZGUiLCJTZWxlY3RIb29rTW9kZSIsIlNlbGVjdE1hdGNoZXJNb2RlIiwiVmlld0hvb2tNb2RlIiwiUHJvcHMiLCJ0b29sTmFtZXMiLCJvbkV4aXQiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsIk1vZGVTdGF0ZSIsIm1vZGUiLCJldmVudCIsIm1hdGNoZXIiLCJob29rIiwiSG9va3NDb25maWdNZW51IiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsIm1vZGVTdGF0ZSIsInNldE1vZGVTdGF0ZSIsImRpc2FibGVkQnlQb2xpY3kiLCJzZXREaXNhYmxlZEJ5UG9saWN5IiwiX3RlbXAiLCJyZXN0cmljdGVkQnlQb2xpY3kiLCJzZXRSZXN0cmljdGVkQnlQb2xpY3kiLCJfdGVtcDIiLCJ0MiIsInNvdXJjZSIsInNldHRpbmdzXzAiLCJob29rc0Rpc2FibGVkXzAiLCJzZXR0aW5ncyIsImRpc2FibGVBbGxIb29rcyIsImFsbG93TWFuYWdlZEhvb2tzT25seSIsInNlbGVjdGVkRXZlbnQiLCJzZWxlY3RlZE1hdGNoZXIiLCJtY3AiLCJfdGVtcDMiLCJhcHBTdGF0ZVN0b3JlIiwidDMiLCJ0b29scyIsIm1hcCIsIl90ZW1wNCIsImNvbWJpbmVkVG9vbE5hbWVzIiwidDQiLCJnZXRTdGF0ZSIsImhvb2tzQnlFdmVudEFuZE1hdGNoZXIiLCJ0NSIsInNvcnRlZE1hdGNoZXJzRm9yU2VsZWN0ZWRFdmVudCIsInQ2IiwiaG9va3NGb3JTZWxlY3RlZE1hdGNoZXIiLCJ0NyIsImhhbmRsZUV4aXQiLCJ0OCIsInQ5IiwiY29udGV4dCIsImlzQWN0aXZlIiwidDEwIiwidDExIiwidDEyIiwidDEzIiwidW5kZWZpbmVkIiwidDE0IiwidDE1IiwidDE2IiwidDE3IiwidDE4IiwidDE5IiwiaG9va0V2ZW50TWV0YWRhdGEiLCJzZXR0aW5nc18xIiwiaG9va3NEaXNhYmxlZF8xIiwidDIwIiwiYnlFdmVudCIsInRvdGFsIiwiZXZlbnRfMCIsIm1hdGNoZXJzIiwiT2JqZWN0IiwiZW50cmllcyIsImV2ZW50Q291bnQiLCJ2YWx1ZXMiLCJyZWR1Y2UiLCJfdGVtcDUiLCJob29rc0J5RXZlbnQiLCJ0b3RhbEhvb2tzQ291bnQiLCJob29rc0Rpc2FibGVkIiwidDIxIiwidDIyIiwidDIzIiwidDI0IiwidDI1IiwidDI2IiwidDI3IiwidDI4IiwidDI5IiwidDMwIiwidDMxIiwidDMyIiwidDMzIiwidDM0IiwiX3RlbXA2IiwiZXZlbnRfMiIsImRlc2NyaXB0aW9uIiwiaG9va18xIiwiZXZlbnRfMSIsImhvb2tfMCIsInN1bSIsImhvb2tzIiwibGVuZ3RoIiwidG9vbCIsIm5hbWUiLCJzIl0sInNvdXJjZXMiOlsiSG9va3NDb25maWdNZW51LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEhvb2tzQ29uZmlnTWVudSBpcyBhIHJlYWQtb25seSBicm93c2VyIGZvciBjb25maWd1cmVkIGhvb2tzLlxuICpcbiAqIFVzZXJzIGNhbiBkcmlsbCBpbnRvIGVhY2ggaG9vayBldmVudCwgc2VlIGNvbmZpZ3VyZWQgbWF0Y2hlcnMgYW5kIGhvb2tzXG4gKiAob2YgYW55IHR5cGU6IGNvbW1hbmQsIHByb21wdCwgYWdlbnQsIGh0dHApLCBhbmQgdmlldyBpbmRpdmlkdWFsIGhvb2tcbiAqIGRldGFpbHMuIFRvIGFkZCBvciBtb2RpZnkgaG9va3MsIHVzZXJzIHNob3VsZCBlZGl0IHNldHRpbmdzLmpzb24gZGlyZWN0bHlcbiAqIG9yIGFzayBDbGF1ZGUg4oCUIHRoZSBtZW51IGRpcmVjdHMgdGhlbSB0aGVyZS5cbiAqXG4gKiBUaGUgbWVudSBpcyByZWFkLW9ubHkgYmVjYXVzZSB0aGUgb2xkIGVkaXRpbmcgVUkgb25seSBzdXBwb3J0ZWRcbiAqIGNvbW1hbmQtdHlwZSBob29rcyBhbmQgZHVwbGljYXRpbmcgdGhlIHNldHRpbmdzLmpzb24gZWRpdGluZyBzdXJmYWNlXG4gKiBpbi1tZW51IGZvciBhbGwgZm91ciB0eXBlcyB3b3VsZCBiZSBhIG1haW50ZW5hbmNlIGJ1cmRlbi5cbiAqL1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgSG9va0V2ZW50IH0gZnJvbSAnc3JjL2VudHJ5cG9pbnRzL2FnZW50U2RrVHlwZXMuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlQXBwU3RhdGVTdG9yZSB9IGZyb20gJ3NyYy9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IHVzZVNldHRpbmdzQ2hhbmdlIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlU2V0dGluZ3NDaGFuZ2UuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7XG4gIGdldEhvb2tFdmVudE1ldGFkYXRhLFxuICBnZXRIb29rc0Zvck1hdGNoZXIsXG4gIGdldE1hdGNoZXJNZXRhZGF0YSxcbiAgZ2V0U29ydGVkTWF0Y2hlcnNGb3JFdmVudCxcbiAgZ3JvdXBIb29rc0J5RXZlbnRBbmRNYXRjaGVyLFxufSBmcm9tICcuLi8uLi91dGlscy9ob29rcy9ob29rc0NvbmZpZ01hbmFnZXIuanMnXG5pbXBvcnQgdHlwZSB7IEluZGl2aWR1YWxIb29rQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvaG9va3MvaG9va3NTZXR0aW5ncy5qcydcbmltcG9ydCB7XG4gIGdldFNldHRpbmdzX0RFUFJFQ0FURUQsXG4gIGdldFNldHRpbmdzRm9yU291cmNlLFxufSBmcm9tICcuLi8uLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB7IHBsdXJhbCB9IGZyb20gJy4uLy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBTZWxlY3RFdmVudE1vZGUgfSBmcm9tICcuL1NlbGVjdEV2ZW50TW9kZS5qcydcbmltcG9ydCB7IFNlbGVjdEhvb2tNb2RlIH0gZnJvbSAnLi9TZWxlY3RIb29rTW9kZS5qcydcbmltcG9ydCB7IFNlbGVjdE1hdGNoZXJNb2RlIH0gZnJvbSAnLi9TZWxlY3RNYXRjaGVyTW9kZS5qcydcbmltcG9ydCB7IFZpZXdIb29rTW9kZSB9IGZyb20gJy4vVmlld0hvb2tNb2RlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0b29sTmFtZXM6IHN0cmluZ1tdXG4gIG9uRXhpdDogKFxuICAgIHJlc3VsdD86IHN0cmluZyxcbiAgICBvcHRpb25zPzogeyBkaXNwbGF5PzogQ29tbWFuZFJlc3VsdERpc3BsYXkgfSxcbiAgKSA9PiB2b2lkXG59XG5cbnR5cGUgTW9kZVN0YXRlID1cbiAgfCB7IG1vZGU6ICdzZWxlY3QtZXZlbnQnIH1cbiAgfCB7IG1vZGU6ICdzZWxlY3QtbWF0Y2hlcic7IGV2ZW50OiBIb29rRXZlbnQgfVxuICB8IHsgbW9kZTogJ3NlbGVjdC1ob29rJzsgZXZlbnQ6IEhvb2tFdmVudDsgbWF0Y2hlcjogc3RyaW5nIH1cbiAgfCB7IG1vZGU6ICd2aWV3LWhvb2snOyBldmVudDogSG9va0V2ZW50OyBob29rOiBJbmRpdmlkdWFsSG9va0NvbmZpZyB9XG5cbmV4cG9ydCBmdW5jdGlvbiBIb29rc0NvbmZpZ01lbnUoeyB0b29sTmFtZXMsIG9uRXhpdCB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFttb2RlU3RhdGUsIHNldE1vZGVTdGF0ZV0gPSB1c2VTdGF0ZTxNb2RlU3RhdGU+KHtcbiAgICBtb2RlOiAnc2VsZWN0LWV2ZW50JyxcbiAgfSlcbiAgLy8gQ2FjaGUgd2hldGhlciBob29rcyBhcmUgZGlzYWJsZWQgYnkgcG9saWN5IHNldHRpbmdzLlxuICAvLyBnZXRTZXR0aW5nc0ZvclNvdXJjZSgpIGlzIGV4cGVuc2l2ZSAoZmlsZSByZWFkICsgSlNPTiBwYXJzZSArIHZhbGlkYXRpb24pLFxuICAvLyBzbyB3ZSBjb21wdXRlIGl0IG9uY2Ugb24gbW91bnQgYW5kIG9ubHkgcmUtY29tcHV0ZSB3aGVuIHBvbGljeSBzZXR0aW5ncyBjaGFuZ2UuXG4gIC8vIFNob3J0LWNpcmN1aXQgZXZhbHVhdGlvbiBlbnN1cmVzIHdlIHNraXAgdGhlIGV4cGVuc2l2ZSBjaGVjayB3aGVuIGhvb2tzIGFyZW4ndCBkaXNhYmxlZC5cbiAgY29uc3QgW2Rpc2FibGVkQnlQb2xpY3ksIHNldERpc2FibGVkQnlQb2xpY3ldID0gdXNlU3RhdGUoKCkgPT4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gZ2V0U2V0dGluZ3NfREVQUkVDQVRFRCgpXG4gICAgY29uc3QgaG9va3NEaXNhYmxlZCA9IHNldHRpbmdzPy5kaXNhYmxlQWxsSG9va3MgPT09IHRydWVcbiAgICByZXR1cm4gKFxuICAgICAgaG9va3NEaXNhYmxlZCAmJlxuICAgICAgZ2V0U2V0dGluZ3NGb3JTb3VyY2UoJ3BvbGljeVNldHRpbmdzJyk/LmRpc2FibGVBbGxIb29rcyA9PT0gdHJ1ZVxuICAgIClcbiAgfSlcblxuICAvLyBDaGVjayBpZiBob29rcyBhcmUgcmVzdHJpY3RlZCB0byBtYW5hZ2VkLW9ubHkgYnkgcG9saWN5XG4gIGNvbnN0IFtyZXN0cmljdGVkQnlQb2xpY3ksIHNldFJlc3RyaWN0ZWRCeVBvbGljeV0gPSB1c2VTdGF0ZSgoKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIGdldFNldHRpbmdzRm9yU291cmNlKCdwb2xpY3lTZXR0aW5ncycpPy5hbGxvd01hbmFnZWRIb29rc09ubHkgPT09IHRydWVcbiAgICApXG4gIH0pXG5cbiAgLy8gVXBkYXRlIGNhY2hlZCB2YWx1ZXMgd2hlbiBwb2xpY3kgc2V0dGluZ3MgY2hhbmdlXG4gIHVzZVNldHRpbmdzQ2hhbmdlKHNvdXJjZSA9PiB7XG4gICAgaWYgKHNvdXJjZSA9PT0gJ3BvbGljeVNldHRpbmdzJykge1xuICAgICAgY29uc3Qgc2V0dGluZ3MgPSBnZXRTZXR0aW5nc19ERVBSRUNBVEVEKClcbiAgICAgIGNvbnN0IGhvb2tzRGlzYWJsZWQgPSBzZXR0aW5ncz8uZGlzYWJsZUFsbEhvb2tzID09PSB0cnVlXG4gICAgICBzZXREaXNhYmxlZEJ5UG9saWN5KFxuICAgICAgICBob29rc0Rpc2FibGVkICYmXG4gICAgICAgICAgZ2V0U2V0dGluZ3NGb3JTb3VyY2UoJ3BvbGljeVNldHRpbmdzJyk/LmRpc2FibGVBbGxIb29rcyA9PT0gdHJ1ZSxcbiAgICAgIClcbiAgICAgIHNldFJlc3RyaWN0ZWRCeVBvbGljeShcbiAgICAgICAgZ2V0U2V0dGluZ3NGb3JTb3VyY2UoJ3BvbGljeVNldHRpbmdzJyk/LmFsbG93TWFuYWdlZEhvb2tzT25seSA9PT0gdHJ1ZSxcbiAgICAgIClcbiAgICB9XG4gIH0pXG5cbiAgLy8gRXh0cmFjdCBjb21tb25seSB1c2VkIHZhbHVlcyBmcm9tIG1vZGVTdGF0ZSBmb3IgY29udmVuaWVuY2VcbiAgY29uc3QgbW9kZSA9IG1vZGVTdGF0ZS5tb2RlXG4gIGNvbnN0IHNlbGVjdGVkRXZlbnQgPSAnZXZlbnQnIGluIG1vZGVTdGF0ZSA/IG1vZGVTdGF0ZS5ldmVudCA6ICdQcmVUb29sVXNlJ1xuICBjb25zdCBzZWxlY3RlZE1hdGNoZXIgPSAnbWF0Y2hlcicgaW4gbW9kZVN0YXRlID8gbW9kZVN0YXRlLm1hdGNoZXIgOiBudWxsXG5cbiAgY29uc3QgbWNwID0gdXNlQXBwU3RhdGUocyA9PiBzLm1jcClcbiAgY29uc3QgYXBwU3RhdGVTdG9yZSA9IHVzZUFwcFN0YXRlU3RvcmUoKVxuICBjb25zdCBjb21iaW5lZFRvb2xOYW1lcyA9IHVzZU1lbW8oXG4gICAgKCkgPT4gWy4uLnRvb2xOYW1lcywgLi4ubWNwLnRvb2xzLm1hcCh0b29sID0+IHRvb2wubmFtZSldLFxuICAgIFt0b29sTmFtZXMsIG1jcC50b29sc10sXG4gIClcblxuICBjb25zdCBob29rc0J5RXZlbnRBbmRNYXRjaGVyID0gdXNlTWVtbyhcbiAgICAoKSA9PlxuICAgICAgZ3JvdXBIb29rc0J5RXZlbnRBbmRNYXRjaGVyKGFwcFN0YXRlU3RvcmUuZ2V0U3RhdGUoKSwgY29tYmluZWRUb29sTmFtZXMpLFxuICAgIFtjb21iaW5lZFRvb2xOYW1lcywgYXBwU3RhdGVTdG9yZV0sXG4gIClcblxuICBjb25zdCBzb3J0ZWRNYXRjaGVyc0ZvclNlbGVjdGVkRXZlbnQgPSB1c2VNZW1vKFxuICAgICgpID0+IGdldFNvcnRlZE1hdGNoZXJzRm9yRXZlbnQoaG9va3NCeUV2ZW50QW5kTWF0Y2hlciwgc2VsZWN0ZWRFdmVudCksXG4gICAgW2hvb2tzQnlFdmVudEFuZE1hdGNoZXIsIHNlbGVjdGVkRXZlbnRdLFxuICApXG5cbiAgY29uc3QgaG9va3NGb3JTZWxlY3RlZE1hdGNoZXIgPSB1c2VNZW1vKFxuICAgICgpID0+XG4gICAgICBnZXRIb29rc0Zvck1hdGNoZXIoXG4gICAgICAgIGhvb2tzQnlFdmVudEFuZE1hdGNoZXIsXG4gICAgICAgIHNlbGVjdGVkRXZlbnQsXG4gICAgICAgIHNlbGVjdGVkTWF0Y2hlcixcbiAgICAgICksXG4gICAgW2hvb2tzQnlFdmVudEFuZE1hdGNoZXIsIHNlbGVjdGVkRXZlbnQsIHNlbGVjdGVkTWF0Y2hlcl0sXG4gIClcblxuICAvLyBIYW5kbGVyIGZvciBleGl0aW5nIHRoZSBkaWFsb2dcbiAgY29uc3QgaGFuZGxlRXhpdCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvbkV4aXQoJ0hvb2tzIGRpYWxvZyBkaXNtaXNzZWQnLCB7IGRpc3BsYXk6ICdzeXN0ZW0nIH0pXG4gIH0sIFtvbkV4aXRdKVxuXG4gIC8vIEVzY2FwZSBoYW5kbGluZyBmb3Igc2VsZWN0LWV2ZW50IG1vZGUgLSBleGl0IHRoZSBtZW51XG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBoYW5kbGVFeGl0LCB7XG4gICAgY29udGV4dDogJ0NvbmZpcm1hdGlvbicsXG4gICAgaXNBY3RpdmU6IG1vZGUgPT09ICdzZWxlY3QtZXZlbnQnLFxuICB9KVxuXG4gIC8vIEVzY2FwZSBoYW5kbGluZyBmb3Igc2VsZWN0LW1hdGNoZXIgbW9kZSAtIGdvIHRvIHNlbGVjdC1ldmVudFxuICB1c2VLZXliaW5kaW5nKFxuICAgICdjb25maXJtOm5vJyxcbiAgICAoKSA9PiB7XG4gICAgICBzZXRNb2RlU3RhdGUoeyBtb2RlOiAnc2VsZWN0LWV2ZW50JyB9KVxuICAgIH0sXG4gICAge1xuICAgICAgY29udGV4dDogJ0NvbmZpcm1hdGlvbicsXG4gICAgICBpc0FjdGl2ZTogbW9kZSA9PT0gJ3NlbGVjdC1tYXRjaGVyJyxcbiAgICB9LFxuICApXG5cbiAgLy8gRXNjYXBlIGhhbmRsaW5nIGZvciBzZWxlY3QtaG9vayBtb2RlIC0gZ28gdG8gc2VsZWN0LW1hdGNoZXIgb3Igc2VsZWN0LWV2ZW50XG4gIHVzZUtleWJpbmRpbmcoXG4gICAgJ2NvbmZpcm06bm8nLFxuICAgICgpID0+IHtcbiAgICAgIGlmICgnZXZlbnQnIGluIG1vZGVTdGF0ZSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgZ2V0TWF0Y2hlck1ldGFkYXRhKG1vZGVTdGF0ZS5ldmVudCwgY29tYmluZWRUb29sTmFtZXMpICE9PSB1bmRlZmluZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgc2V0TW9kZVN0YXRlKHsgbW9kZTogJ3NlbGVjdC1tYXRjaGVyJywgZXZlbnQ6IG1vZGVTdGF0ZS5ldmVudCB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldE1vZGVTdGF0ZSh7IG1vZGU6ICdzZWxlY3QtZXZlbnQnIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIGNvbnRleHQ6ICdDb25maXJtYXRpb24nLFxuICAgICAgaXNBY3RpdmU6IG1vZGUgPT09ICdzZWxlY3QtaG9vaycsXG4gICAgfSxcbiAgKVxuXG4gIC8vIEVzY2FwZSBoYW5kbGluZyBmb3Igdmlldy1ob29rIG1vZGUgLSBnbyB0byBzZWxlY3QtaG9va1xuICB1c2VLZXliaW5kaW5nKFxuICAgICdjb25maXJtOm5vJyxcbiAgICAoKSA9PiB7XG4gICAgICBpZiAobW9kZVN0YXRlLm1vZGUgPT09ICd2aWV3LWhvb2snKSB7XG4gICAgICAgIGNvbnN0IHsgZXZlbnQsIGhvb2sgfSA9IG1vZGVTdGF0ZVxuICAgICAgICBzZXRNb2RlU3RhdGUoe1xuICAgICAgICAgIG1vZGU6ICdzZWxlY3QtaG9vaycsXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgbWF0Y2hlcjogaG9vay5tYXRjaGVyIHx8ICcnLFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgY29udGV4dDogJ0NvbmZpcm1hdGlvbicsXG4gICAgICBpc0FjdGl2ZTogbW9kZSA9PT0gJ3ZpZXctaG9vaycsXG4gICAgfSxcbiAgKVxuXG4gIGNvbnN0IGhvb2tFdmVudE1ldGFkYXRhID0gZ2V0SG9va0V2ZW50TWV0YWRhdGEoY29tYmluZWRUb29sTmFtZXMpXG5cbiAgLy8gQ2hlY2sgaWYgaG9va3MgYXJlIGRpc2FibGVkXG4gIGNvbnN0IHNldHRpbmdzID0gZ2V0U2V0dGluZ3NfREVQUkVDQVRFRCgpXG4gIGNvbnN0IGhvb2tzRGlzYWJsZWQgPSBzZXR0aW5ncz8uZGlzYWJsZUFsbEhvb2tzID09PSB0cnVlXG5cbiAgLy8gQ291bnQgaG9va3MgcGVyIGV2ZW50IGZvciB0aGUgZXZlbnQtc2VsZWN0aW9uIHZpZXcsIGFuZCB0aGUgdG90YWwuXG4gIGNvbnN0IHsgaG9va3NCeUV2ZW50LCB0b3RhbEhvb2tzQ291bnQgfSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IGJ5RXZlbnQ6IFBhcnRpYWw8UmVjb3JkPEhvb2tFdmVudCwgbnVtYmVyPj4gPSB7fVxuICAgIGxldCB0b3RhbCA9IDBcbiAgICBmb3IgKGNvbnN0IFtldmVudCwgbWF0Y2hlcnNdIG9mIE9iamVjdC5lbnRyaWVzKGhvb2tzQnlFdmVudEFuZE1hdGNoZXIpKSB7XG4gICAgICBjb25zdCBldmVudENvdW50ID0gT2JqZWN0LnZhbHVlcyhtYXRjaGVycykucmVkdWNlKFxuICAgICAgICAoc3VtLCBob29rcykgPT4gc3VtICsgaG9va3MubGVuZ3RoLFxuICAgICAgICAwLFxuICAgICAgKVxuICAgICAgYnlFdmVudFtldmVudCBhcyBIb29rRXZlbnRdID0gZXZlbnRDb3VudFxuICAgICAgdG90YWwgKz0gZXZlbnRDb3VudFxuICAgIH1cbiAgICByZXR1cm4geyBob29rc0J5RXZlbnQ6IGJ5RXZlbnQsIHRvdGFsSG9va3NDb3VudDogdG90YWwgfVxuICB9LCBbaG9va3NCeUV2ZW50QW5kTWF0Y2hlcl0pXG5cbiAgLy8gSWYgaG9va3MgYXJlIGRpc2FibGVkLCBzaG93IGFuIGluZm9ybWF0aW9uYWwgc2NyZWVuLlxuICAvLyBUaGUgbWVudSBpcyByZWFkLW9ubHksIHNvIHdlIGRvbid0IG9mZmVyIGEgcmUtZW5hYmxlIGJ1dHRvbiDigJRcbiAgLy8gdXNlcnMgY2FuIGVkaXQgc2V0dGluZ3MuanNvbiBvciBhc2sgQ2xhdWRlIGluc3RlYWQuXG4gIGlmIChob29rc0Rpc2FibGVkKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxEaWFsb2dcbiAgICAgICAgdGl0bGU9XCJIb29rIENvbmZpZ3VyYXRpb24gLSBEaXNhYmxlZFwiXG4gICAgICAgIG9uQ2FuY2VsPXtoYW5kbGVFeGl0fVxuICAgICAgICBpbnB1dEd1aWRlPXsoKSA9PiA8VGV4dD5Fc2MgdG8gY2xvc2U8L1RleHQ+fVxuICAgICAgPlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICAgIEFsbCBob29rcyBhcmUgY3VycmVudGx5IDxUZXh0IGJvbGQ+ZGlzYWJsZWQ8L1RleHQ+XG4gICAgICAgICAgICAgIHtkaXNhYmxlZEJ5UG9saWN5ICYmICcgYnkgYSBtYW5hZ2VkIHNldHRpbmdzIGZpbGUnfS4gWW91IGhhdmV7JyAnfVxuICAgICAgICAgICAgICA8VGV4dCBib2xkPnt0b3RhbEhvb2tzQ291bnR9PC9UZXh0PiBjb25maWd1cmVkeycgJ31cbiAgICAgICAgICAgICAge3BsdXJhbCh0b3RhbEhvb2tzQ291bnQsICdob29rJyl9IHRoYXR7JyAnfVxuICAgICAgICAgICAgICB7cGx1cmFsKHRvdGFsSG9va3NDb3VudCwgJ2lzJywgJ2FyZScpfSBub3QgcnVubmluZy5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+V2hlbiBob29rcyBhcmUgZGlzYWJsZWQ6PC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7CtyBObyBob29rIGNvbW1hbmRzIHdpbGwgZXhlY3V0ZTwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPsK3IFN0YXR1c0xpbmUgd2lsbCBub3QgYmUgZGlzcGxheWVkPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIMK3IFRvb2wgb3BlcmF0aW9ucyB3aWxsIHByb2NlZWQgd2l0aG91dCBob29rIHZhbGlkYXRpb25cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgICB7IWRpc2FibGVkQnlQb2xpY3kgJiYgKFxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIFRvIHJlLWVuYWJsZSBob29rcywgcmVtb3ZlICZxdW90O2Rpc2FibGVBbGxIb29rcyZxdW90OyBmcm9tXG4gICAgICAgICAgICAgIHNldHRpbmdzLmpzb24gb3IgYXNrIENsYXVkZS5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApfVxuICAgICAgICA8L0JveD5cbiAgICAgIDwvRGlhbG9nPlxuICAgIClcbiAgfVxuXG4gIHN3aXRjaCAobW9kZVN0YXRlLm1vZGUpIHtcbiAgICBjYXNlICdzZWxlY3QtZXZlbnQnOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFNlbGVjdEV2ZW50TW9kZVxuICAgICAgICAgIGhvb2tFdmVudE1ldGFkYXRhPXtob29rRXZlbnRNZXRhZGF0YX1cbiAgICAgICAgICBob29rc0J5RXZlbnQ9e2hvb2tzQnlFdmVudH1cbiAgICAgICAgICB0b3RhbEhvb2tzQ291bnQ9e3RvdGFsSG9va3NDb3VudH1cbiAgICAgICAgICByZXN0cmljdGVkQnlQb2xpY3k9e3Jlc3RyaWN0ZWRCeVBvbGljeX1cbiAgICAgICAgICBvblNlbGVjdEV2ZW50PXtldmVudCA9PiB7XG4gICAgICAgICAgICBpZiAoZ2V0TWF0Y2hlck1ldGFkYXRhKGV2ZW50LCBjb21iaW5lZFRvb2xOYW1lcykgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBzZXRNb2RlU3RhdGUoeyBtb2RlOiAnc2VsZWN0LW1hdGNoZXInLCBldmVudCB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0TW9kZVN0YXRlKHsgbW9kZTogJ3NlbGVjdC1ob29rJywgZXZlbnQsIG1hdGNoZXI6ICcnIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfX1cbiAgICAgICAgICBvbkNhbmNlbD17aGFuZGxlRXhpdH1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICBjYXNlICdzZWxlY3QtbWF0Y2hlcic6XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8U2VsZWN0TWF0Y2hlck1vZGVcbiAgICAgICAgICBzZWxlY3RlZEV2ZW50PXttb2RlU3RhdGUuZXZlbnR9XG4gICAgICAgICAgbWF0Y2hlcnNGb3JTZWxlY3RlZEV2ZW50PXtzb3J0ZWRNYXRjaGVyc0ZvclNlbGVjdGVkRXZlbnR9XG4gICAgICAgICAgaG9va3NCeUV2ZW50QW5kTWF0Y2hlcj17aG9va3NCeUV2ZW50QW5kTWF0Y2hlcn1cbiAgICAgICAgICBldmVudERlc2NyaXB0aW9uPXtob29rRXZlbnRNZXRhZGF0YVttb2RlU3RhdGUuZXZlbnRdLmRlc2NyaXB0aW9ufVxuICAgICAgICAgIG9uU2VsZWN0PXttYXRjaGVyID0+IHtcbiAgICAgICAgICAgIHNldE1vZGVTdGF0ZSh7XG4gICAgICAgICAgICAgIG1vZGU6ICdzZWxlY3QtaG9vaycsXG4gICAgICAgICAgICAgIGV2ZW50OiBtb2RlU3RhdGUuZXZlbnQsXG4gICAgICAgICAgICAgIG1hdGNoZXIsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICAgIHNldE1vZGVTdGF0ZSh7IG1vZGU6ICdzZWxlY3QtZXZlbnQnIH0pXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgIClcbiAgICBjYXNlICdzZWxlY3QtaG9vayc6XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8U2VsZWN0SG9va01vZGVcbiAgICAgICAgICBzZWxlY3RlZEV2ZW50PXttb2RlU3RhdGUuZXZlbnR9XG4gICAgICAgICAgc2VsZWN0ZWRNYXRjaGVyPXttb2RlU3RhdGUubWF0Y2hlcn1cbiAgICAgICAgICBob29rc0ZvclNlbGVjdGVkTWF0Y2hlcj17aG9va3NGb3JTZWxlY3RlZE1hdGNoZXJ9XG4gICAgICAgICAgaG9va0V2ZW50TWV0YWRhdGE9e2hvb2tFdmVudE1ldGFkYXRhW21vZGVTdGF0ZS5ldmVudF19XG4gICAgICAgICAgb25TZWxlY3Q9e2hvb2sgPT4ge1xuICAgICAgICAgICAgc2V0TW9kZVN0YXRlKHtcbiAgICAgICAgICAgICAgbW9kZTogJ3ZpZXctaG9vaycsXG4gICAgICAgICAgICAgIGV2ZW50OiBtb2RlU3RhdGUuZXZlbnQsXG4gICAgICAgICAgICAgIGhvb2ssXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICAgIC8vIEdvIGJhY2sgdG8gbWF0Y2hlciBzZWxlY3Rpb24gb3IgZXZlbnQgc2VsZWN0aW9uXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGdldE1hdGNoZXJNZXRhZGF0YShtb2RlU3RhdGUuZXZlbnQsIGNvbWJpbmVkVG9vbE5hbWVzKSAhPT1cbiAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgc2V0TW9kZVN0YXRlKHtcbiAgICAgICAgICAgICAgICBtb2RlOiAnc2VsZWN0LW1hdGNoZXInLFxuICAgICAgICAgICAgICAgIGV2ZW50OiBtb2RlU3RhdGUuZXZlbnQsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRNb2RlU3RhdGUoeyBtb2RlOiAnc2VsZWN0LWV2ZW50JyB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICApXG4gICAgY2FzZSAndmlldy1ob29rJzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxWaWV3SG9va01vZGVcbiAgICAgICAgICBzZWxlY3RlZEhvb2s9e21vZGVTdGF0ZS5ob29rfVxuICAgICAgICAgIGV2ZW50U3VwcG9ydHNNYXRjaGVyPXtcbiAgICAgICAgICAgIGdldE1hdGNoZXJNZXRhZGF0YShtb2RlU3RhdGUuZXZlbnQsIGNvbWJpbmVkVG9vbE5hbWVzKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB7IGV2ZW50LCBob29rIH0gPSBtb2RlU3RhdGVcbiAgICAgICAgICAgIHNldE1vZGVTdGF0ZSh7XG4gICAgICAgICAgICAgIG1vZGU6ICdzZWxlY3QtaG9vaycsXG4gICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICBtYXRjaGVyOiBob29rLm1hdGNoZXIgfHwgJycsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICApXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsV0FBVyxFQUFFQyxPQUFPLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3RELGNBQWNDLFNBQVMsUUFBUSxrQ0FBa0M7QUFDakUsU0FBU0MsV0FBVyxFQUFFQyxnQkFBZ0IsUUFBUSx1QkFBdUI7QUFDckUsY0FBY0Msb0JBQW9CLFFBQVEsbUJBQW1CO0FBQzdELFNBQVNDLGlCQUFpQixRQUFRLGtDQUFrQztBQUNwRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDbEUsU0FDRUMsb0JBQW9CLEVBQ3BCQyxrQkFBa0IsRUFDbEJDLGtCQUFrQixFQUNsQkMseUJBQXlCLEVBQ3pCQywyQkFBMkIsUUFDdEIseUNBQXlDO0FBQ2hELGNBQWNDLG9CQUFvQixRQUFRLG9DQUFvQztBQUM5RSxTQUNFQyxzQkFBc0IsRUFDdEJDLG9CQUFvQixRQUNmLGtDQUFrQztBQUN6QyxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBQ25ELFNBQVNDLE1BQU0sUUFBUSw0QkFBNEI7QUFDbkQsU0FBU0MsZUFBZSxRQUFRLHNCQUFzQjtBQUN0RCxTQUFTQyxjQUFjLFFBQVEscUJBQXFCO0FBQ3BELFNBQVNDLGlCQUFpQixRQUFRLHdCQUF3QjtBQUMxRCxTQUFTQyxZQUFZLFFBQVEsbUJBQW1CO0FBRWhELEtBQUtDLEtBQUssR0FBRztFQUNYQyxTQUFTLEVBQUUsTUFBTSxFQUFFO0VBQ25CQyxNQUFNLEVBQUUsQ0FDTkMsTUFBZSxDQUFSLEVBQUUsTUFBTSxFQUNmQyxPQUE0QyxDQUFwQyxFQUFFO0lBQUVDLE9BQU8sQ0FBQyxFQUFFeEIsb0JBQW9CO0VBQUMsQ0FBQyxFQUM1QyxHQUFHLElBQUk7QUFDWCxDQUFDO0FBRUQsS0FBS3lCLFNBQVMsR0FDVjtFQUFFQyxJQUFJLEVBQUUsY0FBYztBQUFDLENBQUMsR0FDeEI7RUFBRUEsSUFBSSxFQUFFLGdCQUFnQjtFQUFFQyxLQUFLLEVBQUU5QixTQUFTO0FBQUMsQ0FBQyxHQUM1QztFQUFFNkIsSUFBSSxFQUFFLGFBQWE7RUFBRUMsS0FBSyxFQUFFOUIsU0FBUztFQUFFK0IsT0FBTyxFQUFFLE1BQU07QUFBQyxDQUFDLEdBQzFEO0VBQUVGLElBQUksRUFBRSxXQUFXO0VBQUVDLEtBQUssRUFBRTlCLFNBQVM7RUFBRWdDLElBQUksRUFBRW5CLG9CQUFvQjtBQUFDLENBQUM7QUFFdkUsT0FBTyxTQUFBb0IsZ0JBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBeUI7SUFBQWIsU0FBQTtJQUFBQztFQUFBLElBQUFVLEVBQTRCO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBQ0pGLEVBQUE7TUFBQVIsSUFBQSxFQUM5QztJQUNSLENBQUM7SUFBQU0sQ0FBQSxNQUFBRSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBRixDQUFBO0VBQUE7RUFGRCxPQUFBSyxTQUFBLEVBQUFDLFlBQUEsSUFBa0MxQyxRQUFRLENBQVlzQyxFQUVyRCxDQUFDO0VBS0YsT0FBQUssZ0JBQUEsRUFBQUMsbUJBQUEsSUFBZ0Q1QyxRQUFRLENBQUM2QyxLQU94RCxDQUFDO0VBR0YsT0FBQUMsa0JBQUEsRUFBQUMscUJBQUEsSUFBb0QvQyxRQUFRLENBQUNnRCxNQUk1RCxDQUFDO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFiLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBR2dCUyxFQUFBLEdBQUFDLE1BQUE7TUFDaEIsSUFBSUEsTUFBTSxLQUFLLGdCQUFnQjtRQUM3QixNQUFBQyxVQUFBLEdBQWlCcEMsc0JBQXNCLENBQUMsQ0FBQztRQUN6QyxNQUFBcUMsZUFBQSxHQUFzQkMsVUFBUSxFQUFBQyxlQUFpQixLQUFLLElBQUk7UUFDeERWLG1CQUFtQixDQUNqQlEsZUFDa0UsSUFBaEVwQyxvQkFBb0IsQ0FBQyxnQkFBaUMsQ0FBQyxFQUFBc0MsZUFBQSxLQUFLLElBQ2hFLENBQUM7UUFDRFAscUJBQXFCLENBQ25CL0Isb0JBQW9CLENBQUMsZ0JBQXVDLENBQUMsRUFBQXVDLHFCQUFBLEtBQUssSUFDcEUsQ0FBQztNQUFBO0lBQ0YsQ0FDRjtJQUFBbkIsQ0FBQSxNQUFBYSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBYixDQUFBO0VBQUE7RUFaRC9CLGlCQUFpQixDQUFDNEMsRUFZakIsQ0FBQztFQUdGLE1BQUFuQixJQUFBLEdBQWFXLFNBQVMsQ0FBQVgsSUFBSztFQUMzQixNQUFBMEIsYUFBQSxHQUFzQixPQUFPLElBQUlmLFNBQTBDLEdBQTlCQSxTQUFTLENBQUFWLEtBQXFCLEdBQXJELFlBQXFEO0VBQzNFLE1BQUEwQixlQUFBLEdBQXdCLFNBQVMsSUFBSWhCLFNBQW9DLEdBQXhCQSxTQUFTLENBQUFULE9BQWUsR0FBakQsSUFBaUQ7RUFFekUsTUFBQTBCLEdBQUEsR0FBWXhELFdBQVcsQ0FBQ3lELE1BQVUsQ0FBQztFQUNuQyxNQUFBQyxhQUFBLEdBQXNCekQsZ0JBQWdCLENBQUMsQ0FBQztFQUFBLElBQUEwRCxFQUFBO0VBQUEsSUFBQXpCLENBQUEsUUFBQXNCLEdBQUEsQ0FBQUksS0FBQSxJQUFBMUIsQ0FBQSxRQUFBWixTQUFBO0lBRWhDcUMsRUFBQSxPQUFJckMsU0FBUyxLQUFLa0MsR0FBRyxDQUFBSSxLQUFNLENBQUFDLEdBQUksQ0FBQ0MsTUFBaUIsQ0FBQyxDQUFDO0lBQUE1QixDQUFBLE1BQUFzQixHQUFBLENBQUFJLEtBQUE7SUFBQTFCLENBQUEsTUFBQVosU0FBQTtJQUFBWSxDQUFBLE1BQUF5QixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBekIsQ0FBQTtFQUFBO0VBRDNELE1BQUE2QixpQkFBQSxHQUNRSixFQUFtRDtFQUUxRCxJQUFBSyxFQUFBO0VBQUEsSUFBQTlCLENBQUEsUUFBQXdCLGFBQUEsSUFBQXhCLENBQUEsUUFBQTZCLGlCQUFBO0lBSUdDLEVBQUEsR0FBQXJELDJCQUEyQixDQUFDK0MsYUFBYSxDQUFBTyxRQUFTLENBQUMsQ0FBQyxFQUFFRixpQkFBaUIsQ0FBQztJQUFBN0IsQ0FBQSxNQUFBd0IsYUFBQTtJQUFBeEIsQ0FBQSxNQUFBNkIsaUJBQUE7SUFBQTdCLENBQUEsTUFBQThCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUE5QixDQUFBO0VBQUE7RUFGNUUsTUFBQWdDLHNCQUFBLEdBRUlGLEVBQXdFO0VBRTNFLElBQUFHLEVBQUE7RUFBQSxJQUFBakMsQ0FBQSxRQUFBZ0Msc0JBQUEsSUFBQWhDLENBQUEsUUFBQW9CLGFBQUE7SUFHT2EsRUFBQSxHQUFBekQseUJBQXlCLENBQUN3RCxzQkFBc0IsRUFBRVosYUFBYSxDQUFDO0lBQUFwQixDQUFBLE1BQUFnQyxzQkFBQTtJQUFBaEMsQ0FBQSxNQUFBb0IsYUFBQTtJQUFBcEIsQ0FBQSxPQUFBaUMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWpDLENBQUE7RUFBQTtFQUR4RSxNQUFBa0MsOEJBQUEsR0FDUUQsRUFBZ0U7RUFFdkUsSUFBQUUsRUFBQTtFQUFBLElBQUFuQyxDQUFBLFNBQUFnQyxzQkFBQSxJQUFBaEMsQ0FBQSxTQUFBb0IsYUFBQSxJQUFBcEIsQ0FBQSxTQUFBcUIsZUFBQTtJQUlHYyxFQUFBLEdBQUE3RCxrQkFBa0IsQ0FDaEIwRCxzQkFBc0IsRUFDdEJaLGFBQWEsRUFDYkMsZUFDRixDQUFDO0lBQUFyQixDQUFBLE9BQUFnQyxzQkFBQTtJQUFBaEMsQ0FBQSxPQUFBb0IsYUFBQTtJQUFBcEIsQ0FBQSxPQUFBcUIsZUFBQTtJQUFBckIsQ0FBQSxPQUFBbUMsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5DLENBQUE7RUFBQTtFQU5MLE1BQUFvQyx1QkFBQSxHQUVJRCxFQUlDO0VBRUosSUFBQUUsRUFBQTtFQUFBLElBQUFyQyxDQUFBLFNBQUFYLE1BQUE7SUFHOEJnRCxFQUFBLEdBQUFBLENBQUE7TUFDN0JoRCxNQUFNLENBQUMsd0JBQXdCLEVBQUU7UUFBQUcsT0FBQSxFQUFXO01BQVMsQ0FBQyxDQUFDO0lBQUEsQ0FDeEQ7SUFBQVEsQ0FBQSxPQUFBWCxNQUFBO0lBQUFXLENBQUEsT0FBQXFDLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFyQyxDQUFBO0VBQUE7RUFGRCxNQUFBc0MsVUFBQSxHQUFtQkQsRUFFUDtFQUtBLE1BQUFFLEVBQUEsR0FBQTdDLElBQUksS0FBSyxjQUFjO0VBQUEsSUFBQThDLEVBQUE7RUFBQSxJQUFBeEMsQ0FBQSxTQUFBdUMsRUFBQTtJQUZLQyxFQUFBO01BQUFDLE9BQUEsRUFDN0IsY0FBYztNQUFBQyxRQUFBLEVBQ2JIO0lBQ1osQ0FBQztJQUFBdkMsQ0FBQSxPQUFBdUMsRUFBQTtJQUFBdkMsQ0FBQSxPQUFBd0MsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXhDLENBQUE7RUFBQTtFQUhENUIsYUFBYSxDQUFDLFlBQVksRUFBRWtFLFVBQVUsRUFBRUUsRUFHdkMsQ0FBQztFQUFBLElBQUFHLEdBQUE7RUFBQSxJQUFBM0MsQ0FBQSxTQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFLQXVDLEdBQUEsR0FBQUEsQ0FBQTtNQUNFckMsWUFBWSxDQUFDO1FBQUFaLElBQUEsRUFBUTtNQUFlLENBQUMsQ0FBQztJQUFBLENBQ3ZDO0lBQUFNLENBQUEsT0FBQTJDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUEzQyxDQUFBO0VBQUE7RUFHVyxNQUFBNEMsR0FBQSxHQUFBbEQsSUFBSSxLQUFLLGdCQUFnQjtFQUFBLElBQUFtRCxHQUFBO0VBQUEsSUFBQTdDLENBQUEsU0FBQTRDLEdBQUE7SUFGckNDLEdBQUE7TUFBQUosT0FBQSxFQUNXLGNBQWM7TUFBQUMsUUFBQSxFQUNiRTtJQUNaLENBQUM7SUFBQTVDLENBQUEsT0FBQTRDLEdBQUE7SUFBQTVDLENBQUEsT0FBQTZDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUE3QyxDQUFBO0VBQUE7RUFSSDVCLGFBQWEsQ0FDWCxZQUFZLEVBQ1p1RSxHQUVDLEVBQ0RFLEdBSUYsQ0FBQztFQUFBLElBQUFDLEdBQUE7RUFBQSxJQUFBOUMsQ0FBQSxTQUFBNkIsaUJBQUEsSUFBQTdCLENBQUEsU0FBQUssU0FBQTtJQUtDeUMsR0FBQSxHQUFBQSxDQUFBO01BQ0UsSUFBSSxPQUFPLElBQUl6QyxTQUFTO1FBQ3RCLElBQ0U5QixrQkFBa0IsQ0FBQzhCLFNBQVMsQ0FBQVYsS0FBTSxFQUFFa0MsaUJBQWlCLENBQUMsS0FBS2tCLFNBQVM7VUFFcEV6QyxZQUFZLENBQUM7WUFBQVosSUFBQSxFQUFRLGdCQUFnQjtZQUFBQyxLQUFBLEVBQVNVLFNBQVMsQ0FBQVY7VUFBTyxDQUFDLENBQUM7UUFBQTtVQUVoRVcsWUFBWSxDQUFDO1lBQUFaLElBQUEsRUFBUTtVQUFlLENBQUMsQ0FBQztRQUFBO01BQ3ZDO0lBQ0YsQ0FDRjtJQUFBTSxDQUFBLE9BQUE2QixpQkFBQTtJQUFBN0IsQ0FBQSxPQUFBSyxTQUFBO0lBQUFMLENBQUEsT0FBQThDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUE5QyxDQUFBO0VBQUE7RUFHVyxNQUFBZ0QsR0FBQSxHQUFBdEQsSUFBSSxLQUFLLGFBQWE7RUFBQSxJQUFBdUQsR0FBQTtFQUFBLElBQUFqRCxDQUFBLFNBQUFnRCxHQUFBO0lBRmxDQyxHQUFBO01BQUFSLE9BQUEsRUFDVyxjQUFjO01BQUFDLFFBQUEsRUFDYk07SUFDWixDQUFDO0lBQUFoRCxDQUFBLE9BQUFnRCxHQUFBO0lBQUFoRCxDQUFBLE9BQUFpRCxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBakQsQ0FBQTtFQUFBO0VBaEJINUIsYUFBYSxDQUNYLFlBQVksRUFDWjBFLEdBVUMsRUFDREcsR0FJRixDQUFDO0VBQUEsSUFBQUMsR0FBQTtFQUFBLElBQUFsRCxDQUFBLFNBQUFLLFNBQUE7SUFLQzZDLEdBQUEsR0FBQUEsQ0FBQTtNQUNFLElBQUk3QyxTQUFTLENBQUFYLElBQUssS0FBSyxXQUFXO1FBQ2hDO1VBQUFDLEtBQUE7VUFBQUU7UUFBQSxJQUF3QlEsU0FBUztRQUNqQ0MsWUFBWSxDQUFDO1VBQUFaLElBQUEsRUFDTCxhQUFhO1VBQUFDLEtBQUE7VUFBQUMsT0FBQSxFQUVWQyxJQUFJLENBQUFELE9BQWMsSUFBbEI7UUFDWCxDQUFDLENBQUM7TUFBQTtJQUNILENBQ0Y7SUFBQUksQ0FBQSxPQUFBSyxTQUFBO0lBQUFMLENBQUEsT0FBQWtELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFsRCxDQUFBO0VBQUE7RUFHVyxNQUFBbUQsR0FBQSxHQUFBekQsSUFBSSxLQUFLLFdBQVc7RUFBQSxJQUFBMEQsR0FBQTtFQUFBLElBQUFwRCxDQUFBLFNBQUFtRCxHQUFBO0lBRmhDQyxHQUFBO01BQUFYLE9BQUEsRUFDVyxjQUFjO01BQUFDLFFBQUEsRUFDYlM7SUFDWixDQUFDO0lBQUFuRCxDQUFBLE9BQUFtRCxHQUFBO0lBQUFuRCxDQUFBLE9BQUFvRCxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBcEQsQ0FBQTtFQUFBO0VBZkg1QixhQUFhLENBQ1gsWUFBWSxFQUNaOEUsR0FTQyxFQUNERSxHQUlGLENBQUM7RUFBQSxJQUFBQyxHQUFBO0VBQUEsSUFBQXJELENBQUEsU0FBQTZCLGlCQUFBO0lBRXlCd0IsR0FBQSxHQUFBaEYsb0JBQW9CLENBQUN3RCxpQkFBaUIsQ0FBQztJQUFBN0IsQ0FBQSxPQUFBNkIsaUJBQUE7SUFBQTdCLENBQUEsT0FBQXFELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFyRCxDQUFBO0VBQUE7RUFBakUsTUFBQXNELGlCQUFBLEdBQTBCRCxHQUF1QztFQUdqRSxNQUFBRSxVQUFBLEdBQWlCNUUsc0JBQXNCLENBQUMsQ0FBQztFQUN6QyxNQUFBNkUsZUFBQSxHQUFzQnZDLFVBQVEsRUFBQUMsZUFBaUIsS0FBSyxJQUFJO0VBQUEsSUFBQXVDLEdBQUE7RUFBQSxJQUFBekQsQ0FBQSxTQUFBZ0Msc0JBQUE7SUFJdEQsTUFBQTBCLE9BQUEsR0FBb0QsQ0FBQyxDQUFDO0lBQ3RELElBQUFDLEtBQUEsR0FBWSxDQUFDO0lBQ2IsS0FBSyxPQUFBQyxPQUFBLEVBQUFDLFFBQUEsQ0FBdUIsSUFBSUMsTUFBTSxDQUFBQyxPQUFRLENBQUMvQixzQkFBc0IsQ0FBQztNQUNwRSxNQUFBZ0MsVUFBQSxHQUFtQkYsTUFBTSxDQUFBRyxNQUFPLENBQUNKLFFBQVEsQ0FBQyxDQUFBSyxNQUFPLENBQy9DQyxNQUFrQyxFQUNsQyxDQUNGLENBQUM7TUFDRFQsT0FBTyxDQUFDL0QsT0FBSyxJQUFJOUIsU0FBUyxJQUFJbUcsVUFBSDtNQUMzQkwsS0FBQSxHQUFBQSxLQUFLLEdBQUlLLFVBQVU7SUFBQTtJQUVkUCxHQUFBO01BQUFXLFlBQUEsRUFBZ0JWLE9BQU87TUFBQVcsZUFBQSxFQUFtQlY7SUFBTSxDQUFDO0lBQUEzRCxDQUFBLE9BQUFnQyxzQkFBQTtJQUFBaEMsQ0FBQSxPQUFBeUQsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQXpELENBQUE7RUFBQTtFQVgxRDtJQUFBb0UsWUFBQTtJQUFBQztFQUFBLElBV0VaLEdBQXdEO0VBTTFELElBQUlhLGVBQWE7SUFBQSxJQUFBQyxHQUFBO0lBQUEsSUFBQXZFLENBQUEsU0FBQUcsTUFBQSxDQUFBQyxHQUFBO01BVW1CbUUsR0FBQSxJQUFDLElBQUksQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQUMsUUFBUSxFQUFsQixJQUFJLENBQXFCO01BQUF2RSxDQUFBLE9BQUF1RSxHQUFBO0lBQUE7TUFBQUEsR0FBQSxHQUFBdkUsQ0FBQTtJQUFBO0lBQ2pELE1BQUF3RSxHQUFBLEdBQUFqRSxnQkFBaUQsSUFBakQsNkJBQWlEO0lBQUEsSUFBQWtFLEdBQUE7SUFBQSxJQUFBekUsQ0FBQSxTQUFBcUUsZUFBQTtNQUNsREksR0FBQSxJQUFDLElBQUksQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQUVKLGdCQUFjLENBQUUsRUFBM0IsSUFBSSxDQUE4QjtNQUFBckUsQ0FBQSxPQUFBcUUsZUFBQTtNQUFBckUsQ0FBQSxPQUFBeUUsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQXpFLENBQUE7SUFBQTtJQUFBLElBQUEwRSxHQUFBO0lBQUEsSUFBQTFFLENBQUEsU0FBQXFFLGVBQUE7TUFDbENLLEdBQUEsR0FBQTdGLE1BQU0sQ0FBQ3dGLGVBQWUsRUFBRSxNQUFNLENBQUM7TUFBQXJFLENBQUEsT0FBQXFFLGVBQUE7TUFBQXJFLENBQUEsT0FBQTBFLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUExRSxDQUFBO0lBQUE7SUFBQSxJQUFBMkUsR0FBQTtJQUFBLElBQUEzRSxDQUFBLFNBQUFxRSxlQUFBO01BQy9CTSxHQUFBLEdBQUE5RixNQUFNLENBQUN3RixlQUFlLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztNQUFBckUsQ0FBQSxPQUFBcUUsZUFBQTtNQUFBckUsQ0FBQSxPQUFBMkUsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQTNFLENBQUE7SUFBQTtJQUFBLElBQUE0RSxHQUFBO0lBQUEsSUFBQTVFLENBQUEsU0FBQXdFLEdBQUEsSUFBQXhFLENBQUEsU0FBQXlFLEdBQUEsSUFBQXpFLENBQUEsU0FBQTBFLEdBQUEsSUFBQTFFLENBQUEsU0FBQTJFLEdBQUE7TUFMdkNDLEdBQUEsSUFBQyxJQUFJLENBQUMsd0JBQ29CLENBQUFMLEdBQXlCLENBQ2hELENBQUFDLEdBQWdELENBQUUsVUFBVyxJQUFFLENBQ2hFLENBQUFDLEdBQWtDLENBQUMsV0FBWSxJQUFFLENBQ2hELENBQUFDLEdBQThCLENBQUUsS0FBTSxJQUFFLENBQ3hDLENBQUFDLEdBQW1DLENBQUUsYUFDeEMsRUFOQyxJQUFJLENBTUU7TUFBQTNFLENBQUEsT0FBQXdFLEdBQUE7TUFBQXhFLENBQUEsT0FBQXlFLEdBQUE7TUFBQXpFLENBQUEsT0FBQTBFLEdBQUE7TUFBQTFFLENBQUEsT0FBQTJFLEdBQUE7TUFBQTNFLENBQUEsT0FBQTRFLEdBQUE7SUFBQTtNQUFBQSxHQUFBLEdBQUE1RSxDQUFBO0lBQUE7SUFBQSxJQUFBNkUsR0FBQTtJQUFBLElBQUFDLEdBQUE7SUFBQSxJQUFBQyxHQUFBO0lBQUEsSUFBQUMsR0FBQTtJQUFBLElBQUFoRixDQUFBLFNBQUFHLE1BQUEsQ0FBQUMsR0FBQTtNQUNQeUUsR0FBQSxJQUFDLEdBQUcsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUNmLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyx3QkFBd0IsRUFBdEMsSUFBSSxDQUNQLEVBRkMsR0FBRyxDQUVFO01BQ05DLEdBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLCtCQUErQixFQUE3QyxJQUFJLENBQWdEO01BQ3JEQyxHQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxrQ0FBa0MsRUFBaEQsSUFBSSxDQUFtRDtNQUN4REMsR0FBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsc0RBRWYsRUFGQyxJQUFJLENBRUU7TUFBQWhGLENBQUEsT0FBQTZFLEdBQUE7TUFBQTdFLENBQUEsT0FBQThFLEdBQUE7TUFBQTlFLENBQUEsT0FBQStFLEdBQUE7TUFBQS9FLENBQUEsT0FBQWdGLEdBQUE7SUFBQTtNQUFBSCxHQUFBLEdBQUE3RSxDQUFBO01BQUE4RSxHQUFBLEdBQUE5RSxDQUFBO01BQUErRSxHQUFBLEdBQUEvRSxDQUFBO01BQUFnRixHQUFBLEdBQUFoRixDQUFBO0lBQUE7SUFBQSxJQUFBaUYsR0FBQTtJQUFBLElBQUFqRixDQUFBLFNBQUE0RSxHQUFBO01BZlRLLEdBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUwsR0FNTSxDQUNOLENBQUFDLEdBRUssQ0FDTCxDQUFBQyxHQUFvRCxDQUNwRCxDQUFBQyxHQUF1RCxDQUN2RCxDQUFBQyxHQUVNLENBQ1IsRUFoQkMsR0FBRyxDQWdCRTtNQUFBaEYsQ0FBQSxPQUFBNEUsR0FBQTtNQUFBNUUsQ0FBQSxPQUFBaUYsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQWpGLENBQUE7SUFBQTtJQUFBLElBQUFrRixHQUFBO0lBQUEsSUFBQWxGLENBQUEsU0FBQU8sZ0JBQUE7TUFDTDJFLEdBQUEsSUFBQzNFLGdCQUtELElBSkMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLDhFQUdmLEVBSEMsSUFBSSxDQUlOO01BQUFQLENBQUEsT0FBQU8sZ0JBQUE7TUFBQVAsQ0FBQSxPQUFBa0YsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQWxGLENBQUE7SUFBQTtJQUFBLElBQUFtRixHQUFBO0lBQUEsSUFBQW5GLENBQUEsU0FBQWlGLEdBQUEsSUFBQWpGLENBQUEsU0FBQWtGLEdBQUE7TUF2QkhDLEdBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FBTSxHQUFDLENBQUQsR0FBQyxDQUNoQyxDQUFBRixHQWdCSyxDQUNKLENBQUFDLEdBS0QsQ0FDRixFQXhCQyxHQUFHLENBd0JFO01BQUFsRixDQUFBLE9BQUFpRixHQUFBO01BQUFqRixDQUFBLE9BQUFrRixHQUFBO01BQUFsRixDQUFBLE9BQUFtRixHQUFBO0lBQUE7TUFBQUEsR0FBQSxHQUFBbkYsQ0FBQTtJQUFBO0lBQUEsSUFBQW9GLEdBQUE7SUFBQSxJQUFBcEYsQ0FBQSxTQUFBc0MsVUFBQSxJQUFBdEMsQ0FBQSxTQUFBbUYsR0FBQTtNQTdCUkMsR0FBQSxJQUFDLE1BQU0sQ0FDQyxLQUErQixDQUEvQiwrQkFBK0IsQ0FDM0I5QyxRQUFVLENBQVZBLFdBQVMsQ0FBQyxDQUNSLFVBQStCLENBQS9CLENBQUErQyxNQUE4QixDQUFDLENBRTNDLENBQUFGLEdBd0JLLENBQ1AsRUE5QkMsTUFBTSxDQThCRTtNQUFBbkYsQ0FBQSxPQUFBc0MsVUFBQTtNQUFBdEMsQ0FBQSxPQUFBbUYsR0FBQTtNQUFBbkYsQ0FBQSxPQUFBb0YsR0FBQTtJQUFBO01BQUFBLEdBQUEsR0FBQXBGLENBQUE7SUFBQTtJQUFBLE9BOUJUb0YsR0E4QlM7RUFBQTtFQUliLFFBQVEvRSxTQUFTLENBQUFYLElBQUs7SUFBQSxLQUNmLGNBQWM7TUFBQTtRQUFBLElBQUE2RSxHQUFBO1FBQUEsSUFBQXZFLENBQUEsU0FBQTZCLGlCQUFBO1VBT0UwQyxHQUFBLEdBQUFlLE9BQUE7WUFDYixJQUFJL0csa0JBQWtCLENBQUNvQixPQUFLLEVBQUVrQyxpQkFBaUIsQ0FBQyxLQUFLa0IsU0FBUztjQUM1RHpDLFlBQVksQ0FBQztnQkFBQVosSUFBQSxFQUFRLGdCQUFnQjtnQkFBQUMsS0FBQSxFQUFFQTtjQUFNLENBQUMsQ0FBQztZQUFBO2NBRS9DVyxZQUFZLENBQUM7Z0JBQUFaLElBQUEsRUFBUSxhQUFhO2dCQUFBQyxLQUFBLEVBQUVBLE9BQUs7Z0JBQUFDLE9BQUEsRUFBVztjQUFHLENBQUMsQ0FBQztZQUFBO1VBQzFELENBQ0Y7VUFBQUksQ0FBQSxPQUFBNkIsaUJBQUE7VUFBQTdCLENBQUEsT0FBQXVFLEdBQUE7UUFBQTtVQUFBQSxHQUFBLEdBQUF2RSxDQUFBO1FBQUE7UUFBQSxJQUFBd0UsR0FBQTtRQUFBLElBQUF4RSxDQUFBLFNBQUFzQyxVQUFBLElBQUF0QyxDQUFBLFNBQUFzRCxpQkFBQSxJQUFBdEQsQ0FBQSxTQUFBb0UsWUFBQSxJQUFBcEUsQ0FBQSxTQUFBVSxrQkFBQSxJQUFBVixDQUFBLFNBQUF1RSxHQUFBLElBQUF2RSxDQUFBLFNBQUFxRSxlQUFBO1VBWEhHLEdBQUEsSUFBQyxlQUFlLENBQ0tsQixpQkFBaUIsQ0FBakJBLGtCQUFnQixDQUFDLENBQ3RCYyxZQUFZLENBQVpBLGFBQVcsQ0FBQyxDQUNUQyxlQUFlLENBQWZBLGdCQUFjLENBQUMsQ0FDWjNELGtCQUFrQixDQUFsQkEsbUJBQWlCLENBQUMsQ0FDdkIsYUFNZCxDQU5jLENBQUE2RCxHQU1mLENBQUMsQ0FDU2pDLFFBQVUsQ0FBVkEsV0FBUyxDQUFDLEdBQ3BCO1VBQUF0QyxDQUFBLE9BQUFzQyxVQUFBO1VBQUF0QyxDQUFBLE9BQUFzRCxpQkFBQTtVQUFBdEQsQ0FBQSxPQUFBb0UsWUFBQTtVQUFBcEUsQ0FBQSxPQUFBVSxrQkFBQTtVQUFBVixDQUFBLE9BQUF1RSxHQUFBO1VBQUF2RSxDQUFBLE9BQUFxRSxlQUFBO1VBQUFyRSxDQUFBLE9BQUF3RSxHQUFBO1FBQUE7VUFBQUEsR0FBQSxHQUFBeEUsQ0FBQTtRQUFBO1FBQUEsT0FiRndFLEdBYUU7TUFBQTtJQUFBLEtBRUQsZ0JBQWdCO01BQUE7UUFNRyxNQUFBRCxHQUFBLEdBQUFqQixpQkFBaUIsQ0FBQ2pELFNBQVMsQ0FBQVYsS0FBTSxDQUFDO1FBQUEsSUFBQTZFLEdBQUE7UUFBQSxJQUFBeEUsQ0FBQSxTQUFBSyxTQUFBLENBQUFWLEtBQUE7VUFDMUM2RSxHQUFBLEdBQUE1RSxPQUFBO1lBQ1JVLFlBQVksQ0FBQztjQUFBWixJQUFBLEVBQ0wsYUFBYTtjQUFBQyxLQUFBLEVBQ1pVLFNBQVMsQ0FBQVYsS0FBTTtjQUFBQztZQUV4QixDQUFDLENBQUM7VUFBQSxDQUNIO1VBQUFJLENBQUEsT0FBQUssU0FBQSxDQUFBVixLQUFBO1VBQUFLLENBQUEsT0FBQXdFLEdBQUE7UUFBQTtVQUFBQSxHQUFBLEdBQUF4RSxDQUFBO1FBQUE7UUFBQSxJQUFBeUUsR0FBQTtRQUFBLElBQUF6RSxDQUFBLFNBQUFHLE1BQUEsQ0FBQUMsR0FBQTtVQUNTcUUsR0FBQSxHQUFBQSxDQUFBO1lBQ1JuRSxZQUFZLENBQUM7Y0FBQVosSUFBQSxFQUFRO1lBQWUsQ0FBQyxDQUFDO1VBQUEsQ0FDdkM7VUFBQU0sQ0FBQSxPQUFBeUUsR0FBQTtRQUFBO1VBQUFBLEdBQUEsR0FBQXpFLENBQUE7UUFBQTtRQUFBLElBQUEwRSxHQUFBO1FBQUEsSUFBQTFFLENBQUEsU0FBQWdDLHNCQUFBLElBQUFoQyxDQUFBLFNBQUFLLFNBQUEsQ0FBQVYsS0FBQSxJQUFBSyxDQUFBLFNBQUFrQyw4QkFBQSxJQUFBbEMsQ0FBQSxTQUFBdUUsR0FBQSxDQUFBZ0IsV0FBQSxJQUFBdkYsQ0FBQSxTQUFBd0UsR0FBQTtVQWRIRSxHQUFBLElBQUMsaUJBQWlCLENBQ0QsYUFBZSxDQUFmLENBQUFyRSxTQUFTLENBQUFWLEtBQUssQ0FBQyxDQUNKdUMsd0JBQThCLENBQTlCQSwrQkFBNkIsQ0FBQyxDQUNoQ0Ysc0JBQXNCLENBQXRCQSx1QkFBcUIsQ0FBQyxDQUM1QixnQkFBOEMsQ0FBOUMsQ0FBQXVDLEdBQWtDLENBQUFnQixXQUFXLENBQUMsQ0FDdEQsUUFNVCxDQU5TLENBQUFmLEdBTVYsQ0FBQyxDQUNTLFFBRVQsQ0FGUyxDQUFBQyxHQUVWLENBQUMsR0FDRDtVQUFBekUsQ0FBQSxPQUFBZ0Msc0JBQUE7VUFBQWhDLENBQUEsT0FBQUssU0FBQSxDQUFBVixLQUFBO1VBQUFLLENBQUEsT0FBQWtDLDhCQUFBO1VBQUFsQyxDQUFBLE9BQUF1RSxHQUFBLENBQUFnQixXQUFBO1VBQUF2RixDQUFBLE9BQUF3RSxHQUFBO1VBQUF4RSxDQUFBLE9BQUEwRSxHQUFBO1FBQUE7VUFBQUEsR0FBQSxHQUFBMUUsQ0FBQTtRQUFBO1FBQUEsT0FmRjBFLEdBZUU7TUFBQTtJQUFBLEtBRUQsYUFBYTtNQUFBO1FBTU8sTUFBQUgsR0FBQSxHQUFBakIsaUJBQWlCLENBQUNqRCxTQUFTLENBQUFWLEtBQU0sQ0FBQztRQUFBLElBQUE2RSxHQUFBO1FBQUEsSUFBQXhFLENBQUEsU0FBQUssU0FBQSxDQUFBVixLQUFBO1VBQzNDNkUsR0FBQSxHQUFBZ0IsTUFBQTtZQUNSbEYsWUFBWSxDQUFDO2NBQUFaLElBQUEsRUFDTCxXQUFXO2NBQUFDLEtBQUEsRUFDVlUsU0FBUyxDQUFBVixLQUFNO2NBQUFFLElBQUEsRUFDdEJBO1lBQ0YsQ0FBQyxDQUFDO1VBQUEsQ0FDSDtVQUFBRyxDQUFBLE9BQUFLLFNBQUEsQ0FBQVYsS0FBQTtVQUFBSyxDQUFBLE9BQUF3RSxHQUFBO1FBQUE7VUFBQUEsR0FBQSxHQUFBeEUsQ0FBQTtRQUFBO1FBQUEsSUFBQXlFLEdBQUE7UUFBQSxJQUFBekUsQ0FBQSxTQUFBNkIsaUJBQUEsSUFBQTdCLENBQUEsU0FBQUssU0FBQSxDQUFBVixLQUFBO1VBQ1M4RSxHQUFBLEdBQUFBLENBQUE7WUFFUixJQUNFbEcsa0JBQWtCLENBQUM4QixTQUFTLENBQUFWLEtBQU0sRUFBRWtDLGlCQUFpQixDQUFDLEtBQ3REa0IsU0FBUztjQUVUekMsWUFBWSxDQUFDO2dCQUFBWixJQUFBLEVBQ0wsZ0JBQWdCO2dCQUFBQyxLQUFBLEVBQ2ZVLFNBQVMsQ0FBQVY7Y0FDbEIsQ0FBQyxDQUFDO1lBQUE7Y0FFRlcsWUFBWSxDQUFDO2dCQUFBWixJQUFBLEVBQVE7Y0FBZSxDQUFDLENBQUM7WUFBQTtVQUN2QyxDQUNGO1VBQUFNLENBQUEsT0FBQTZCLGlCQUFBO1VBQUE3QixDQUFBLE9BQUFLLFNBQUEsQ0FBQVYsS0FBQTtVQUFBSyxDQUFBLE9BQUF5RSxHQUFBO1FBQUE7VUFBQUEsR0FBQSxHQUFBekUsQ0FBQTtRQUFBO1FBQUEsSUFBQTBFLEdBQUE7UUFBQSxJQUFBMUUsQ0FBQSxTQUFBb0MsdUJBQUEsSUFBQXBDLENBQUEsU0FBQUssU0FBQSxDQUFBVixLQUFBLElBQUFLLENBQUEsU0FBQUssU0FBQSxDQUFBVCxPQUFBLElBQUFJLENBQUEsU0FBQXVFLEdBQUEsSUFBQXZFLENBQUEsU0FBQXdFLEdBQUEsSUFBQXhFLENBQUEsU0FBQXlFLEdBQUE7VUF6QkhDLEdBQUEsSUFBQyxjQUFjLENBQ0UsYUFBZSxDQUFmLENBQUFyRSxTQUFTLENBQUFWLEtBQUssQ0FBQyxDQUNiLGVBQWlCLENBQWpCLENBQUFVLFNBQVMsQ0FBQVQsT0FBTyxDQUFDLENBQ1R3Qyx1QkFBdUIsQ0FBdkJBLHdCQUFzQixDQUFDLENBQzdCLGlCQUFrQyxDQUFsQyxDQUFBbUMsR0FBaUMsQ0FBQyxDQUMzQyxRQU1ULENBTlMsQ0FBQUMsR0FNVixDQUFDLENBQ1MsUUFhVCxDQWJTLENBQUFDLEdBYVYsQ0FBQyxHQUNEO1VBQUF6RSxDQUFBLE9BQUFvQyx1QkFBQTtVQUFBcEMsQ0FBQSxPQUFBSyxTQUFBLENBQUFWLEtBQUE7VUFBQUssQ0FBQSxPQUFBSyxTQUFBLENBQUFULE9BQUE7VUFBQUksQ0FBQSxPQUFBdUUsR0FBQTtVQUFBdkUsQ0FBQSxPQUFBd0UsR0FBQTtVQUFBeEUsQ0FBQSxPQUFBeUUsR0FBQTtVQUFBekUsQ0FBQSxPQUFBMEUsR0FBQTtRQUFBO1VBQUFBLEdBQUEsR0FBQTFFLENBQUE7UUFBQTtRQUFBLE9BMUJGMEUsR0EwQkU7TUFBQTtJQUFBLEtBRUQsV0FBVztNQUFBO1FBR0ksTUFBQUgsR0FBQSxHQUFBbEUsU0FBUyxDQUFBUixJQUFLO1FBQUEsSUFBQTJFLEdBQUE7UUFBQSxJQUFBeEUsQ0FBQSxTQUFBNkIsaUJBQUEsSUFBQTdCLENBQUEsU0FBQUssU0FBQSxDQUFBVixLQUFBO1VBRTFCNkUsR0FBQSxHQUFBakcsa0JBQWtCLENBQUM4QixTQUFTLENBQUFWLEtBQU0sRUFBRWtDLGlCQUFpQixDQUFDO1VBQUE3QixDQUFBLE9BQUE2QixpQkFBQTtVQUFBN0IsQ0FBQSxPQUFBSyxTQUFBLENBQUFWLEtBQUE7VUFBQUssQ0FBQSxPQUFBd0UsR0FBQTtRQUFBO1VBQUFBLEdBQUEsR0FBQXhFLENBQUE7UUFBQTtRQUF0RCxNQUFBeUUsR0FBQSxHQUFBRCxHQUFzRCxLQUFLekIsU0FBUztRQUFBLElBQUEyQixHQUFBO1FBQUEsSUFBQTFFLENBQUEsU0FBQUssU0FBQTtVQUU1RHFFLEdBQUEsR0FBQUEsQ0FBQTtZQUNSO2NBQUEvRSxLQUFBLEVBQUE4RixPQUFBO2NBQUE1RixJQUFBLEVBQUE2RjtZQUFBLElBQXdCckYsU0FBUztZQUNqQ0MsWUFBWSxDQUFDO2NBQUFaLElBQUEsRUFDTCxhQUFhO2NBQUFDLEtBQUEsRUFDbkJBLE9BQUs7Y0FBQUMsT0FBQSxFQUNJQyxNQUFJLENBQUFELE9BQWMsSUFBbEI7WUFDWCxDQUFDLENBQUM7VUFBQSxDQUNIO1VBQUFJLENBQUEsT0FBQUssU0FBQTtVQUFBTCxDQUFBLE9BQUEwRSxHQUFBO1FBQUE7VUFBQUEsR0FBQSxHQUFBMUUsQ0FBQTtRQUFBO1FBQUEsSUFBQTJFLEdBQUE7UUFBQSxJQUFBM0UsQ0FBQSxTQUFBSyxTQUFBLENBQUFSLElBQUEsSUFBQUcsQ0FBQSxTQUFBeUUsR0FBQSxJQUFBekUsQ0FBQSxTQUFBMEUsR0FBQTtVQVpIQyxHQUFBLElBQUMsWUFBWSxDQUNHLFlBQWMsQ0FBZCxDQUFBSixHQUFhLENBQUMsQ0FFMUIsb0JBQW9FLENBQXBFLENBQUFFLEdBQW1FLENBQUMsQ0FFNUQsUUFPVCxDQVBTLENBQUFDLEdBT1YsQ0FBQyxHQUNEO1VBQUExRSxDQUFBLE9BQUFLLFNBQUEsQ0FBQVIsSUFBQTtVQUFBRyxDQUFBLE9BQUF5RSxHQUFBO1VBQUF6RSxDQUFBLE9BQUEwRSxHQUFBO1VBQUExRSxDQUFBLE9BQUEyRSxHQUFBO1FBQUE7VUFBQUEsR0FBQSxHQUFBM0UsQ0FBQTtRQUFBO1FBQUEsT0FiRjJFLEdBYUU7TUFBQTtFQUVSO0FBQUM7QUF0UkksU0FBQVUsT0FBQTtFQUFBLE9BbUttQixDQUFDLElBQUksQ0FBQyxZQUFZLEVBQWpCLElBQUksQ0FBb0I7QUFBQTtBQW5LNUMsU0FBQWxCLE9BQUF3QixHQUFBLEVBQUFDLEtBQUE7RUFBQSxPQWtKaUJELEdBQUcsR0FBR0MsS0FBSyxDQUFBQyxNQUFPO0FBQUE7QUFsSm5DLFNBQUFqRSxPQUFBa0UsSUFBQTtFQUFBLE9BK0MyQ0EsSUFBSSxDQUFBQyxJQUFLO0FBQUE7QUEvQ3BELFNBQUF4RSxPQUFBeUUsQ0FBQTtFQUFBLE9BNEN3QkEsQ0FBQyxDQUFBMUUsR0FBSTtBQUFBO0FBNUM3QixTQUFBVixPQUFBO0VBQUEsT0FvQkRoQyxvQkFBb0IsQ0FBQyxnQkFBdUMsQ0FBQyxFQUFBdUMscUJBQUEsS0FBSyxJQUFJO0FBQUE7QUFwQnJFLFNBQUFWLE1BQUE7RUFTSCxNQUFBUSxRQUFBLEdBQWlCdEMsc0JBQXNCLENBQUMsQ0FBQztFQUN6QyxNQUFBMkYsYUFBQSxHQUFzQnJELFFBQVEsRUFBQUMsZUFBaUIsS0FBSyxJQUFJO0VBQUEsT0FFdERvRCxhQUNnRSxJQUFoRTFGLG9CQUFvQixDQUFDLGdCQUFpQyxDQUFDLEVBQUFzQyxlQUFBLEtBQUssSUFBSTtBQUFBIiwiaWdub3JlTGlzdCI6W119