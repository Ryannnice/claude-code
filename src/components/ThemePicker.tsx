// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 引入 Box、Text、usePreviewTheme、useTheme、useThemeSetting，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, usePreviewTheme, useTheme, useThemeSetting } from '../ink.js';
// 引入 useRegisterKeybindingContext，将 ../keybindings/KeybindingContext.js 中已经封装好的能力接到本文件流程里。
import { useRegisterKeybindingContext } from '../keybindings/KeybindingContext.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 引入 useShortcutDisplay，将 ../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
// 引入 useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../state/AppState.js';
// 复用 gracefulShutdown 工具函数，把通用处理留在 ../utils/gracefulShutdown.js 中维护。
import { gracefulShutdown } from '../utils/gracefulShutdown.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../utils/settings/settings.js';
// 类型依赖 { ThemeSetting } 来自 ../utils/theme.js，用于校准终端渲染的数据契约。
import type { ThemeSetting } from '../utils/theme.js';
// 引入 Select，将 ./CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from './CustomSelect/index.js';
// 引入 Byline，将 ./design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './design-system/Byline.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 getColorModuleUnavailableReason、getSyntaxTheme，将 ./StructuredDiff/colorDiff.js 中已经封装好的能力接到本文件流程里。
import { getColorModuleUnavailableReason, getSyntaxTheme } from './StructuredDiff/colorDiff.js';
// 引入 StructuredDiff，将 ./StructuredDiff.js 中已经封装好的能力接到本文件流程里。
import { StructuredDiff } from './StructuredDiff.js';
// ThemePickerProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
export type ThemePickerProps = {
  // 这个回调绑定到 onThemeSelect: (setting: ThemeSetting) => void;，负责终端渲染在该局部场景下的响应。
  onThemeSelect: (setting: ThemeSetting) => void;
  showIntroText?: boolean;
  helpText?: string;
  showHelpTextBelow?: boolean;
  hideEscToCancel?: boolean;
  /** Skip exit handling when running in a context that already has it (e.g., onboarding) */
  skipExitHandling?: boolean;
  /** Called when the user cancels (presses Escape). If skipExitHandling is true and this is provided, it will be called instead of just saving the preview. */
  // 这个回调绑定到 onCancel?: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel?: () => void;
};
// ThemePicker 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ThemePicker(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(59);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onThemeSelect,
    showIntroText: t1,
    helpText: t2,
    showHelpTextBelow: t3,
    hideEscToCancel: t4,
    skipExitHandling: t5,
    onCancel: onCancelProp
  } = t0;
  // showIntroText标记终端 UI Theme Picker是否启用对应路径。
  const showIntroText = t1 === undefined ? false : t1;
  // helpText标记终端 UI Theme Picker是否启用对应路径。
  const helpText = t2 === undefined ? "" : t2;
  // showHelpTextBelow标记终端 UI Theme Picker是否启用对应路径。
  const showHelpTextBelow = t3 === undefined ? false : t3;
  // hideEscToCancel标记终端 UI Theme Picker是否启用对应路径。
  const hideEscToCancel = t4 === undefined ? false : t4;
  // skipExitHandling标记终端 UI Theme Picker是否启用对应路径。
  const skipExitHandling = t5 === undefined ? false : t5;
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Theme Picker分别处理这些返回值。
  const [theme] = useTheme();
  // themeSetting保存`useThemeSetting`，供终端渲染后续处理使用。
  const themeSetting = useThemeSetting();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t6 暂存 `getColorModuleUnavailableReason()` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `getColorModuleUnavailableReason()` 生成的渲染片段，后续返回路径直接复用。
    t6 = getColorModuleUnavailableReason();
    // $[0] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[0];
  }
  // colorModuleUnavailableReason 命名 `t6`，让后续代码直接表达这个值的用途。
  const colorModuleUnavailableReason = t6;
  // t7 暂存 `colorModuleUnavailableReason === null ? getSyntaxTheme(th...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== theme) {
    // t7 暂存 `colorModuleUnavailableReason === null ? getSyntaxTheme(th...` 生成的渲染片段，后续返回路径直接复用。
    t7 = colorModuleUnavailableReason === null ? getSyntaxTheme(theme) : null;
    // $[1] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = theme;
    // $[2] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[2];
  }
  // syntaxTheme保存`t7`，作为后续临时缓存值处理的输入。
  const syntaxTheme = t7;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    setPreviewTheme,
    savePreview,
    cancelPreview
  } = usePreviewTheme();
  // syntaxHighlightingDisabled保存`useAppState`，供终端渲染后续处理使用。
  const syntaxHighlightingDisabled = useAppState(_temp) ?? false;
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // 调用 useRegisterKeybindingContext，触发终端渲染此处需要的副作用。
  useRegisterKeybindingContext("ThemePicker");
  // syntaxToggleShortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const syntaxToggleShortcut = useShortcutDisplay("theme:toggleSyntaxHighlighting", "ThemePicker", "ctrl+t");
  // t8 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== setAppState || $[4] !== syntaxHighlightingDisabled) {
    // t8 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => {
      // 满足 `colorModuleUnavailableReason === null` 时，终端渲染执行该分支。
      if (colorModuleUnavailableReason === null) {
        // newValue标记终端 UI Theme Picker是否启用对应路径。
        const newValue = !syntaxHighlightingDisabled;
        // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
        updateSettingsForSource("userSettings", {
          syntaxHighlightingDisabled: newValue
        });
        // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
        setAppState(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            syntaxHighlightingDisabled: newValue
          }
        }));
      }
    };
    // $[3] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setAppState;
    // $[4] 缓存 `syntaxHighlightingDisabled`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = syntaxHighlightingDisabled;
    // $[5] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[5];
  }
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "ThemePicker"
    };
    // $[6] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[6];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("theme:toggleSyntaxHighlighting", t8, t9);
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings(skipExitHandling ? _temp2 : undefined);
  // t10 暂存 `[...(feature("AUTO_THEME") ? [{` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `[...(feature("AUTO_THEME") ? [{` 生成的渲染片段，后续返回路径直接复用。
    t10 = [...(feature("AUTO_THEME") ? [{
      label: "Auto (match terminal)",
      value: "auto" as const
    }] : []), {
      label: "Dark mode",
      value: "dark"
    }, {
      label: "Light mode",
      value: "light"
    }, {
      label: "Dark mode (colorblind-friendly)",
      value: "dark-daltonized"
    }, {
      label: "Light mode (colorblind-friendly)",
      value: "light-daltonized"
    }, {
      label: "Dark mode (ANSI colors only)",
      value: "dark-ansi"
    }, {
      label: "Light mode (ANSI colors only)",
      value: "light-ansi"
    }];
    // $[7] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[7];
  }
  // themeOptions 集合 命名 `t10`，让后续代码直接表达这个值的用途。
  const themeOptions = t10;
  // t11 暂存 `showIntroText ? <Text>Let's get started.</Text> : <Text b...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== showIntroText) {
    // t11 暂存 `showIntroText ? <Text>Let's get started.</Text> : <Text b...` 生成的渲染片段，后续返回路径直接复用。
    t11 = showIntroText ? <Text>Let's get started.</Text> : <Text bold={true} color="permission">Theme</Text>;
    // $[8] 缓存 `showIntroText`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = showIntroText;
    // $[9] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t11;
  } else {
    // t11从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[9];
  }
  // t12暂存 `<Text bold={true}>Choose the text style that looks best w...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // 判断 $[10] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t12暂存 `<Text bold={true}>Choose the text style that looks best w...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text bold={true}>Choose the text style that looks best with your terminal</Text>;
    // $[10] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t12;
  } else {
    // t12从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[10];
  }
  // t13暂存 `helpText && !showHelpTextBelow && <Text dimColor={true}>{...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== helpText || $[12] !== showHelpTextBelow) {
    // t13暂存 `helpText && !showHelpTextBelow && <Text dimColor={true}>{...` 生成的渲染片段，后续返回路径直接复用。
    t13 = helpText && !showHelpTextBelow && <Text dimColor={true}>{helpText}</Text>;
    // $[11] 缓存 `helpText`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = helpText;
    // $[12] 缓存 `showHelpTextBelow`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = showHelpTextBelow;
    // $[13] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t13;
  } else {
    // t13从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[13];
  }
  // t14暂存 `<Box flexDirection="column">{t12}{t13}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t13) {
    // t14暂存 `<Box flexDirection="column">{t12}{t13}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Box flexDirection="column">{t12}{t13}</Box>;
    // $[14] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t13;
    // $[15] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t14;
  } else {
    // t14从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[15];
  }
  // t15暂存 `setting => {` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== setPreviewTheme) {
    // t15暂存 `setting => {` 生成的渲染片段，后续返回路径直接复用。
    t15 = setting => {
      // setPreviewTheme写入新的状态值，使终端渲染后续读取保持一致。
      setPreviewTheme(setting as ThemeSetting);
    };
    // $[16] 缓存 `setPreviewTheme`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = setPreviewTheme;
    // $[17] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t15;
  } else {
    // t15从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[17];
  }
  // t16暂存 `setting_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== onThemeSelect || $[19] !== savePreview) {
    // t16暂存 `setting_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t16 = setting_0 => {
      // savePreview执行终端渲染在此处需要的副作用或外部交互。
      savePreview();
      // onThemeSelect执行终端渲染在此处需要的副作用或外部交互。
      onThemeSelect(setting_0 as ThemeSetting);
    };
    // $[18] 缓存 `onThemeSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = onThemeSelect;
    // $[19] 缓存 `savePreview`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = savePreview;
    // $[20] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t16;
  } else {
    // t16从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[20];
  }
  // t17暂存 `skipExitHandling ? () => {` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== cancelPreview || $[22] !== onCancelProp || $[23] !== skipExitHandling) {
    // t17暂存 `skipExitHandling ? () => {` 生成的渲染片段，后续返回路径直接复用。
    t17 = skipExitHandling ? () => {
      // cancelPreview执行终端渲染在此处需要的副作用或外部交互。
      cancelPreview();
      // 调用 onCancelProp?.();，完成这一处局部操作。
      onCancelProp?.();
    // 这个回调绑定到 } : async () => {，负责终端渲染在该局部场景下的响应。
    } : async () => {
      // cancelPreview执行终端渲染在此处需要的副作用或外部交互。
      cancelPreview();
      // 等待 `gracefulShutdown(0)` 完成，再继续终端 UI 组件 Theme Picker的异步流程。
      await gracefulShutdown(0);
    };
    // $[21] 缓存 `cancelPreview`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = cancelPreview;
    // $[22] 缓存 `onCancelProp`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = onCancelProp;
    // $[23] 缓存 `skipExitHandling`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = skipExitHandling;
    // $[24] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t17;
  } else {
    // t17从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[24];
  }
  // t18暂存 `<Select options={themeOptions} onFocus={t15} onChange={t1...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== t15 || $[26] !== t16 || $[27] !== t17 || $[28] !== themeSetting) {
    // t18暂存 `<Select options={themeOptions} onFocus={t15} onChange={t1...` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Select options={themeOptions} onFocus={t15} onChange={t16} onCancel={t17} visibleOptionCount={themeOptions.length} defaultValue={themeSetting} defaultFocusValue={themeSetting} />;
    // $[25] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t15;
    // $[26] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t16;
    // $[27] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t17;
    // $[28] 缓存 `themeSetting`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = themeSetting;
    // $[29] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t18;
  } else {
    // t18从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[29];
  }
  // t19暂存 `<Box flexDirection="column" gap={1}>{t11}{t14}{t18}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== t11 || $[31] !== t14 || $[32] !== t18) {
    // t19暂存 `<Box flexDirection="column" gap={1}>{t11}{t14}{t18}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Box flexDirection="column" gap={1}>{t11}{t14}{t18}</Box>;
    // $[30] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t11;
    // $[31] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t14;
    // $[32] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t18;
    // $[33] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t19;
  } else {
    // t19从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[33];
  }
  // t20暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // 判断 $[34] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
    // t20暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t20 = {
      oldStart: 1,
      newStart: 1,
      oldLines: 3,
      newLines: 3,
      lines: [" function greet() {", "-  console.log(\"Hello, World!\");", "+  console.log(\"Hello, Claude!\");", " }"]
    };
    // $[34] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t20;
  } else {
    // t20从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[34];
  }
  // t21暂存 `<Box flexDirection="column" borderTop={true} borderBottom...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== columns) {
    // t21暂存 `<Box flexDirection="column" borderTop={true} borderBottom...` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Box flexDirection="column" borderTop={true} borderBottom={true} borderLeft={false} borderRight={false} borderStyle="dashed" borderColor="subtle"><StructuredDiff patch={t20} dim={false} filePath="demo.js" firstLine={null} width={columns} /></Box>;
    // $[35] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = columns;
    // $[36] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t21;
  } else {
    // t21从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[36];
  }
  // 临时值 t22保存`disabled`，供终端渲染后续处理使用。
  const t22 = colorModuleUnavailableReason === "env" ? `Syntax highlighting disabled (via CLAUDE_CODE_SYNTAX_HIGHLIGHT=${process.env.CLAUDE_CODE_SYNTAX_HIGHLIGHT})` : syntaxHighlightingDisabled ? `Syntax highlighting disabled (${syntaxToggleShortcut} to enable)` : syntaxTheme ? `Syntax theme: ${syntaxTheme.theme}${syntaxTheme.source ? ` (from ${syntaxTheme.source})` : ""} (${syntaxToggleShortcut} to disable)` : `Syntax highlighting enabled (${syntaxToggleShortcut} to disable)`;
  // t23暂存 `<Text dimColor={true}>{" "}{t22}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[37] !== t22) {
    // t23暂存 `<Text dimColor={true}>{" "}{t22}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Text dimColor={true}>{" "}{t22}</Text>;
    // $[37] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t22;
    // $[38] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t23;
  } else {
    // t23从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[38];
  }
  // t24暂存 `<Box flexDirection="column" width="100%">{t21}{t23}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== t21 || $[40] !== t23) {
    // t24暂存 `<Box flexDirection="column" width="100%">{t21}{t23}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Box flexDirection="column" width="100%">{t21}{t23}</Box>;
    // $[39] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t21;
    // $[40] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t23;
    // $[41] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t24;
  } else {
    // t24从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[41];
  }
  // t25暂存 `<Box flexDirection="column" gap={1}>{t19}{t24}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== t19 || $[43] !== t24) {
    // t25暂存 `<Box flexDirection="column" gap={1}>{t19}{t24}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Box flexDirection="column" gap={1}>{t19}{t24}</Box>;
    // $[42] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t19;
    // $[43] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t24;
    // $[44] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t25;
  } else {
    // t25从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[44];
  }
  // content保存`t25`，供终端 UI Theme Picker后续步骤使用。
  const content = t25;
  // showIntroText缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!showIntroText) {
    // t26暂存 `<Box flexDirection="column">{content}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t26;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[45] !== content) {
      // t26暂存 `<Box flexDirection="column">{content}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t26 = <Box flexDirection="column">{content}</Box>;
      // $[45] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = content;
      // $[46] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t26;
    } else {
      // t26从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
      t26 = $[46];
    }
    // t27暂存 `showHelpTextBelow && helpText && <Box marginLeft={3}><Tex...` 的派生结果，便于缓存命中时直接复用。
    let t27;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[47] !== helpText || $[48] !== showHelpTextBelow) {
      // t27暂存 `showHelpTextBelow && helpText && <Box marginLeft={3}><Tex...` 生成的渲染片段，后续返回路径直接复用。
      t27 = showHelpTextBelow && helpText && <Box marginLeft={3}><Text dimColor={true}>{helpText}</Text></Box>;
      // $[47] 缓存 `helpText`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = helpText;
      // $[48] 缓存 `showHelpTextBelow`，下次依赖未变时 React 编译产物可直接复用。
      $[48] = showHelpTextBelow;
      // $[49] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
      $[49] = t27;
    } else {
      // t27从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
      t27 = $[49];
    }
    // t28暂存 `!hideEscToCancel && <Box><Text dimColor={true} italic={tr...` 的派生结果，便于缓存命中时直接复用。
    let t28;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[50] !== exitState || $[51] !== hideEscToCancel) {
      // t28暂存 `!hideEscToCancel && <Box><Text dimColor={true} italic={tr...` 生成的渲染片段，后续返回路径直接复用。
      t28 = !hideEscToCancel && <Box><Text dimColor={true} italic={true}>{exitState.pending ? <>Press {exitState.keyName} again to exit</> : <Byline><KeyboardShortcutHint shortcut="Enter" action="select" /><KeyboardShortcutHint shortcut="Esc" action="cancel" /></Byline>}</Text></Box>;
      // $[50] 缓存 `exitState`，下次依赖未变时 React 编译产物可直接复用。
      $[50] = exitState;
      // $[51] 缓存 `hideEscToCancel`，下次依赖未变时 React 编译产物可直接复用。
      $[51] = hideEscToCancel;
      // $[52] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
      $[52] = t28;
    } else {
      // t28从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
      t28 = $[52];
    }
    // t29暂存 `<Box marginTop={1}>{t27}{t28}</Box>` 的派生结果，便于缓存命中时直接复用。
    let t29;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[53] !== t27 || $[54] !== t28) {
      // t29暂存 `<Box marginTop={1}>{t27}{t28}</Box>` 生成的渲染片段，后续返回路径直接复用。
      t29 = <Box marginTop={1}>{t27}{t28}</Box>;
      // $[53] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
      $[53] = t27;
      // $[54] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
      $[54] = t28;
      // $[55] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
      $[55] = t29;
    } else {
      // t29从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
      t29 = $[55];
    }
    // t30暂存 `<>{t26}{t29}</>` 的派生结果，便于缓存命中时直接复用。
    let t30;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[56] !== t26 || $[57] !== t29) {
      // t30暂存 `<>{t26}{t29}</>` 生成的渲染片段，后续返回路径直接复用。
      t30 = <>{t26}{t29}</>;
      // $[56] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
      $[56] = t26;
      // $[57] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
      $[57] = t29;
      // $[58] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
      $[58] = t30;
    } else {
      // t30从 React 编译缓存槽 $[58] 取回渲染片段，避免依赖未变时重建 JSX。
      t30 = $[58];
    }
    // 返回 t30，把终端渲染这个分支的结果交还调用方。
    return t30;
  }
  // 返回 content，把终端渲染这个分支的结果交还调用方。
  return content;
}
// _temp2 承担终端渲染中的独立步骤，串起终端 UI 组件 Theme Picker需要的输入整理、状态更新和结果输出。
function _temp2() {}
// _temp 承担终端渲染中的独立步骤，串起终端 UI 组件 Theme Picker需要的输入整理、状态更新和结果输出。
function _temp(s) {
  // 返回 s.settings.syntaxHighlightingDisabled，把终端渲染这个分支的结果交还调用方。
  return s.settings.syntaxHighlightingDisabled;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJ1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MiLCJ1c2VUZXJtaW5hbFNpemUiLCJCb3giLCJUZXh0IiwidXNlUHJldmlld1RoZW1lIiwidXNlVGhlbWUiLCJ1c2VUaGVtZVNldHRpbmciLCJ1c2VSZWdpc3RlcktleWJpbmRpbmdDb250ZXh0IiwidXNlS2V5YmluZGluZyIsInVzZVNob3J0Y3V0RGlzcGxheSIsInVzZUFwcFN0YXRlIiwidXNlU2V0QXBwU3RhdGUiLCJncmFjZWZ1bFNodXRkb3duIiwidXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UiLCJUaGVtZVNldHRpbmciLCJTZWxlY3QiLCJCeWxpbmUiLCJLZXlib2FyZFNob3J0Y3V0SGludCIsImdldENvbG9yTW9kdWxlVW5hdmFpbGFibGVSZWFzb24iLCJnZXRTeW50YXhUaGVtZSIsIlN0cnVjdHVyZWREaWZmIiwiVGhlbWVQaWNrZXJQcm9wcyIsIm9uVGhlbWVTZWxlY3QiLCJzZXR0aW5nIiwic2hvd0ludHJvVGV4dCIsImhlbHBUZXh0Iiwic2hvd0hlbHBUZXh0QmVsb3ciLCJoaWRlRXNjVG9DYW5jZWwiLCJza2lwRXhpdEhhbmRsaW5nIiwib25DYW5jZWwiLCJUaGVtZVBpY2tlciIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsInQzIiwidDQiLCJ0NSIsIm9uQ2FuY2VsUHJvcCIsInVuZGVmaW5lZCIsInRoZW1lIiwidGhlbWVTZXR0aW5nIiwiY29sdW1ucyIsInQ2IiwiU3ltYm9sIiwiZm9yIiwiY29sb3JNb2R1bGVVbmF2YWlsYWJsZVJlYXNvbiIsInQ3Iiwic3ludGF4VGhlbWUiLCJzZXRQcmV2aWV3VGhlbWUiLCJzYXZlUHJldmlldyIsImNhbmNlbFByZXZpZXciLCJzeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCIsIl90ZW1wIiwic2V0QXBwU3RhdGUiLCJzeW50YXhUb2dnbGVTaG9ydGN1dCIsInQ4IiwibmV3VmFsdWUiLCJwcmV2Iiwic2V0dGluZ3MiLCJ0OSIsImNvbnRleHQiLCJleGl0U3RhdGUiLCJfdGVtcDIiLCJ0MTAiLCJsYWJlbCIsInZhbHVlIiwiY29uc3QiLCJ0aGVtZU9wdGlvbnMiLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJzZXR0aW5nXzAiLCJ0MTciLCJ0MTgiLCJsZW5ndGgiLCJ0MTkiLCJ0MjAiLCJvbGRTdGFydCIsIm5ld1N0YXJ0Iiwib2xkTGluZXMiLCJuZXdMaW5lcyIsImxpbmVzIiwidDIxIiwidDIyIiwicHJvY2VzcyIsImVudiIsIkNMQVVERV9DT0RFX1NZTlRBWF9ISUdITElHSFQiLCJzb3VyY2UiLCJ0MjMiLCJ0MjQiLCJ0MjUiLCJjb250ZW50IiwidDI2IiwidDI3IiwidDI4IiwicGVuZGluZyIsImtleU5hbWUiLCJ0MjkiLCJ0MzAiLCJzIl0sInNvdXJjZXMiOlsiVGhlbWVQaWNrZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZlYXR1cmUgfSBmcm9tICdidW46YnVuZGxlJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MgfSBmcm9tICcuLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQge1xuICBCb3gsXG4gIFRleHQsXG4gIHVzZVByZXZpZXdUaGVtZSxcbiAgdXNlVGhlbWUsXG4gIHVzZVRoZW1lU2V0dGluZyxcbn0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlUmVnaXN0ZXJLZXliaW5kaW5nQ29udGV4dCB9IGZyb20gJy4uL2tleWJpbmRpbmdzL0tleWJpbmRpbmdDb250ZXh0LmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyB1c2VTaG9ydGN1dERpc3BsYXkgfSBmcm9tICcuLi9rZXliaW5kaW5ncy91c2VTaG9ydGN1dERpc3BsYXkuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IGdyYWNlZnVsU2h1dGRvd24gfSBmcm9tICcuLi91dGlscy9ncmFjZWZ1bFNodXRkb3duLmpzJ1xuaW1wb3J0IHsgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UgfSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWVTZXR0aW5nIH0gZnJvbSAnLi4vdXRpbHMvdGhlbWUuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9pbmRleC5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBLZXlib2FyZFNob3J0Y3V0SGludCB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9LZXlib2FyZFNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7XG4gIGdldENvbG9yTW9kdWxlVW5hdmFpbGFibGVSZWFzb24sXG4gIGdldFN5bnRheFRoZW1lLFxufSBmcm9tICcuL1N0cnVjdHVyZWREaWZmL2NvbG9yRGlmZi5qcydcbmltcG9ydCB7IFN0cnVjdHVyZWREaWZmIH0gZnJvbSAnLi9TdHJ1Y3R1cmVkRGlmZi5qcydcblxuZXhwb3J0IHR5cGUgVGhlbWVQaWNrZXJQcm9wcyA9IHtcbiAgb25UaGVtZVNlbGVjdDogKHNldHRpbmc6IFRoZW1lU2V0dGluZykgPT4gdm9pZFxuICBzaG93SW50cm9UZXh0PzogYm9vbGVhblxuICBoZWxwVGV4dD86IHN0cmluZ1xuICBzaG93SGVscFRleHRCZWxvdz86IGJvb2xlYW5cbiAgaGlkZUVzY1RvQ2FuY2VsPzogYm9vbGVhblxuICAvKiogU2tpcCBleGl0IGhhbmRsaW5nIHdoZW4gcnVubmluZyBpbiBhIGNvbnRleHQgdGhhdCBhbHJlYWR5IGhhcyBpdCAoZS5nLiwgb25ib2FyZGluZykgKi9cbiAgc2tpcEV4aXRIYW5kbGluZz86IGJvb2xlYW5cbiAgLyoqIENhbGxlZCB3aGVuIHRoZSB1c2VyIGNhbmNlbHMgKHByZXNzZXMgRXNjYXBlKS4gSWYgc2tpcEV4aXRIYW5kbGluZyBpcyB0cnVlIGFuZCB0aGlzIGlzIHByb3ZpZGVkLCBpdCB3aWxsIGJlIGNhbGxlZCBpbnN0ZWFkIG9mIGp1c3Qgc2F2aW5nIHRoZSBwcmV2aWV3LiAqL1xuICBvbkNhbmNlbD86ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRoZW1lUGlja2VyKHtcbiAgb25UaGVtZVNlbGVjdCxcbiAgc2hvd0ludHJvVGV4dCA9IGZhbHNlLFxuICBoZWxwVGV4dCA9ICcnLFxuICBzaG93SGVscFRleHRCZWxvdyA9IGZhbHNlLFxuICBoaWRlRXNjVG9DYW5jZWwgPSBmYWxzZSxcbiAgc2tpcEV4aXRIYW5kbGluZyA9IGZhbHNlLFxuICBvbkNhbmNlbDogb25DYW5jZWxQcm9wLFxufTogVGhlbWVQaWNrZXJQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IHRoZW1lU2V0dGluZyA9IHVzZVRoZW1lU2V0dGluZygpXG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgY29sb3JNb2R1bGVVbmF2YWlsYWJsZVJlYXNvbiA9IGdldENvbG9yTW9kdWxlVW5hdmFpbGFibGVSZWFzb24oKVxuICBjb25zdCBzeW50YXhUaGVtZSA9XG4gICAgY29sb3JNb2R1bGVVbmF2YWlsYWJsZVJlYXNvbiA9PT0gbnVsbCA/IGdldFN5bnRheFRoZW1lKHRoZW1lKSA6IG51bGxcbiAgY29uc3QgeyBzZXRQcmV2aWV3VGhlbWUsIHNhdmVQcmV2aWV3LCBjYW5jZWxQcmV2aWV3IH0gPSB1c2VQcmV2aWV3VGhlbWUoKVxuICBjb25zdCBzeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZCA9XG4gICAgdXNlQXBwU3RhdGUocyA9PiBzLnNldHRpbmdzLnN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkKSA/PyBmYWxzZVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcblxuICAvLyBSZWdpc3RlciBUaGVtZVBpY2tlciBjb250ZXh0IHNvIGl0cyBrZXliaW5kaW5ncyB0YWtlIHByZWNlZGVuY2Ugb3ZlciBHbG9iYWxcbiAgdXNlUmVnaXN0ZXJLZXliaW5kaW5nQ29udGV4dCgnVGhlbWVQaWNrZXInKVxuXG4gIGNvbnN0IHN5bnRheFRvZ2dsZVNob3J0Y3V0ID0gdXNlU2hvcnRjdXREaXNwbGF5KFxuICAgICd0aGVtZTp0b2dnbGVTeW50YXhIaWdobGlnaHRpbmcnLFxuICAgICdUaGVtZVBpY2tlcicsXG4gICAgJ2N0cmwrdCcsXG4gIClcblxuICB1c2VLZXliaW5kaW5nKFxuICAgICd0aGVtZTp0b2dnbGVTeW50YXhIaWdobGlnaHRpbmcnLFxuICAgICgpID0+IHtcbiAgICAgIGlmIChjb2xvck1vZHVsZVVuYXZhaWxhYmxlUmVhc29uID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gIXN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkXG4gICAgICAgIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCd1c2VyU2V0dGluZ3MnLCB7XG4gICAgICAgICAgc3ludGF4SGlnaGxpZ2h0aW5nRGlzYWJsZWQ6IG5ld1ZhbHVlLFxuICAgICAgICB9KVxuICAgICAgICBzZXRBcHBTdGF0ZShwcmV2ID0+ICh7XG4gICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICBzZXR0aW5nczogeyAuLi5wcmV2LnNldHRpbmdzLCBzeW50YXhIaWdobGlnaHRpbmdEaXNhYmxlZDogbmV3VmFsdWUgfSxcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdUaGVtZVBpY2tlcicgfSxcbiAgKVxuICAvLyBBbHdheXMgY2FsbCB0aGUgaG9vayB0byBmb2xsb3cgUmVhY3QgcnVsZXMsIGJ1dCBjb25kaXRpb25hbGx5IGFzc2lnbiB0aGUgZXhpdCBoYW5kbGVyXG4gIGNvbnN0IGV4aXRTdGF0ZSA9IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyhcbiAgICBza2lwRXhpdEhhbmRsaW5nID8gKCkgPT4ge30gOiB1bmRlZmluZWQsXG4gIClcblxuICBjb25zdCB0aGVtZU9wdGlvbnM6IHsgbGFiZWw6IHN0cmluZzsgdmFsdWU6IFRoZW1lU2V0dGluZyB9W10gPSBbXG4gICAgLi4uKGZlYXR1cmUoJ0FVVE9fVEhFTUUnKVxuICAgICAgPyBbeyBsYWJlbDogJ0F1dG8gKG1hdGNoIHRlcm1pbmFsKScsIHZhbHVlOiAnYXV0bycgYXMgY29uc3QgfV1cbiAgICAgIDogW10pLFxuICAgIHsgbGFiZWw6ICdEYXJrIG1vZGUnLCB2YWx1ZTogJ2RhcmsnIH0sXG4gICAgeyBsYWJlbDogJ0xpZ2h0IG1vZGUnLCB2YWx1ZTogJ2xpZ2h0JyB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiAnRGFyayBtb2RlIChjb2xvcmJsaW5kLWZyaWVuZGx5KScsXG4gICAgICB2YWx1ZTogJ2RhcmstZGFsdG9uaXplZCcsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ0xpZ2h0IG1vZGUgKGNvbG9yYmxpbmQtZnJpZW5kbHkpJyxcbiAgICAgIHZhbHVlOiAnbGlnaHQtZGFsdG9uaXplZCcsXG4gICAgfSxcbiAgICB7XG4gICAgICBsYWJlbDogJ0RhcmsgbW9kZSAoQU5TSSBjb2xvcnMgb25seSknLFxuICAgICAgdmFsdWU6ICdkYXJrLWFuc2knLFxuICAgIH0sXG4gICAge1xuICAgICAgbGFiZWw6ICdMaWdodCBtb2RlIChBTlNJIGNvbG9ycyBvbmx5KScsXG4gICAgICB2YWx1ZTogJ2xpZ2h0LWFuc2knLFxuICAgIH0sXG4gIF1cblxuICBjb25zdCBjb250ZW50ID0gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9PlxuICAgICAgICB7c2hvd0ludHJvVGV4dCA/IChcbiAgICAgICAgICA8VGV4dD5MZXQmYXBvcztzIGdldCBzdGFydGVkLjwvVGV4dD5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwicGVybWlzc2lvblwiPlxuICAgICAgICAgICAgVGhlbWVcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGJvbGQ+XG4gICAgICAgICAgICBDaG9vc2UgdGhlIHRleHQgc3R5bGUgdGhhdCBsb29rcyBiZXN0IHdpdGggeW91ciB0ZXJtaW5hbFxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICB7aGVscFRleHQgJiYgIXNob3dIZWxwVGV4dEJlbG93ICYmIDxUZXh0IGRpbUNvbG9yPntoZWxwVGV4dH08L1RleHQ+fVxuICAgICAgICA8L0JveD5cbiAgICAgICAgPFNlbGVjdFxuICAgICAgICAgIG9wdGlvbnM9e3RoZW1lT3B0aW9uc31cbiAgICAgICAgICBvbkZvY3VzPXtzZXR0aW5nID0+IHtcbiAgICAgICAgICAgIHNldFByZXZpZXdUaGVtZShzZXR0aW5nIGFzIFRoZW1lU2V0dGluZylcbiAgICAgICAgICB9fVxuICAgICAgICAgIG9uQ2hhbmdlPXsoc2V0dGluZzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBzYXZlUHJldmlldygpXG4gICAgICAgICAgICBvblRoZW1lU2VsZWN0KHNldHRpbmcgYXMgVGhlbWVTZXR0aW5nKVxuICAgICAgICAgIH19XG4gICAgICAgICAgb25DYW5jZWw9e1xuICAgICAgICAgICAgc2tpcEV4aXRIYW5kbGluZ1xuICAgICAgICAgICAgICA/ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNhbmNlbFByZXZpZXcoKVxuICAgICAgICAgICAgICAgICAgb25DYW5jZWxQcm9wPy4oKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBjYW5jZWxQcmV2aWV3KClcbiAgICAgICAgICAgICAgICAgIGF3YWl0IGdyYWNlZnVsU2h1dGRvd24oMClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZpc2libGVPcHRpb25Db3VudD17dGhlbWVPcHRpb25zLmxlbmd0aH1cbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e3RoZW1lU2V0dGluZ31cbiAgICAgICAgICBkZWZhdWx0Rm9jdXNWYWx1ZT17dGhlbWVTZXR0aW5nfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiB3aWR0aD1cIjEwMCVcIj5cbiAgICAgICAgPEJveFxuICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgIGJvcmRlclRvcFxuICAgICAgICAgIGJvcmRlckJvdHRvbVxuICAgICAgICAgIGJvcmRlckxlZnQ9e2ZhbHNlfVxuICAgICAgICAgIGJvcmRlclJpZ2h0PXtmYWxzZX1cbiAgICAgICAgICBib3JkZXJTdHlsZT1cImRhc2hlZFwiXG4gICAgICAgICAgYm9yZGVyQ29sb3I9XCJzdWJ0bGVcIlxuICAgICAgICA+XG4gICAgICAgICAgPFN0cnVjdHVyZWREaWZmXG4gICAgICAgICAgICBwYXRjaD17e1xuICAgICAgICAgICAgICBvbGRTdGFydDogMSxcbiAgICAgICAgICAgICAgbmV3U3RhcnQ6IDEsXG4gICAgICAgICAgICAgIG9sZExpbmVzOiAzLFxuICAgICAgICAgICAgICBuZXdMaW5lczogMyxcbiAgICAgICAgICAgICAgbGluZXM6IFtcbiAgICAgICAgICAgICAgICAnIGZ1bmN0aW9uIGdyZWV0KCkgeycsXG4gICAgICAgICAgICAgICAgJy0gIGNvbnNvbGUubG9nKFwiSGVsbG8sIFdvcmxkIVwiKTsnLFxuICAgICAgICAgICAgICAgICcrICBjb25zb2xlLmxvZyhcIkhlbGxvLCBDbGF1ZGUhXCIpOycsXG4gICAgICAgICAgICAgICAgJyB9JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBkaW09e2ZhbHNlfVxuICAgICAgICAgICAgZmlsZVBhdGg9XCJkZW1vLmpzXCJcbiAgICAgICAgICAgIGZpcnN0TGluZT17bnVsbH1cbiAgICAgICAgICAgIHdpZHRoPXtjb2x1bW5zfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICB7JyAnfVxuICAgICAgICAgIHtjb2xvck1vZHVsZVVuYXZhaWxhYmxlUmVhc29uID09PSAnZW52J1xuICAgICAgICAgICAgPyBgU3ludGF4IGhpZ2hsaWdodGluZyBkaXNhYmxlZCAodmlhIENMQVVERV9DT0RFX1NZTlRBWF9ISUdITElHSFQ9JHtwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9TWU5UQVhfSElHSExJR0hUfSlgXG4gICAgICAgICAgICA6IHN5bnRheEhpZ2hsaWdodGluZ0Rpc2FibGVkXG4gICAgICAgICAgICAgID8gYFN5bnRheCBoaWdobGlnaHRpbmcgZGlzYWJsZWQgKCR7c3ludGF4VG9nZ2xlU2hvcnRjdXR9IHRvIGVuYWJsZSlgXG4gICAgICAgICAgICAgIDogc3ludGF4VGhlbWVcbiAgICAgICAgICAgICAgICA/IGBTeW50YXggdGhlbWU6ICR7c3ludGF4VGhlbWUudGhlbWV9JHtzeW50YXhUaGVtZS5zb3VyY2UgPyBgIChmcm9tICR7c3ludGF4VGhlbWUuc291cmNlfSlgIDogJyd9ICgke3N5bnRheFRvZ2dsZVNob3J0Y3V0fSB0byBkaXNhYmxlKWBcbiAgICAgICAgICAgICAgICA6IGBTeW50YXggaGlnaGxpZ2h0aW5nIGVuYWJsZWQgKCR7c3ludGF4VG9nZ2xlU2hvcnRjdXR9IHRvIGRpc2FibGUpYH1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC9Cb3g+XG4gIClcblxuICAvLyBPbmx5IHdyYXAgaW4gYSBib3ggd2hlbiBub3QgaW4gb25ib2FyZGluZ1xuICBpZiAoIXNob3dJbnRyb1RleHQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+e2NvbnRlbnR9PC9Cb3g+XG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICB7c2hvd0hlbHBUZXh0QmVsb3cgJiYgaGVscFRleHQgJiYgKFxuICAgICAgICAgICAgPEJveCBtYXJnaW5MZWZ0PXszfT5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2hlbHBUZXh0fTwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICl9XG4gICAgICAgICAgeyFoaWRlRXNjVG9DYW5jZWwgJiYgKFxuICAgICAgICAgICAgPEJveD5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICAgICAgICAgIHtleGl0U3RhdGUucGVuZGluZyA/IChcbiAgICAgICAgICAgICAgICAgIDw+UHJlc3Mge2V4aXRTdGF0ZS5rZXlOYW1lfSBhZ2FpbiB0byBleGl0PC8+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwic2VsZWN0XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiRXNjXCIgYWN0aW9uPVwiY2FuY2VsXCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvQnlsaW5lPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICl9XG4gICAgICAg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