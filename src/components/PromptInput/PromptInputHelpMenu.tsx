// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from 'src/ink.js';
// 复用 getPlatform 工具函数，把通用处理留在 src/utils/platform.js 中维护。
import { getPlatform } from 'src/utils/platform.js';
// 引入 isKeybindingCustomizationEnabled，将 ../../keybindings/loadUserBindings.js 中已经封装好的能力接到本文件流程里。
import { isKeybindingCustomizationEnabled } from '../../keybindings/loadUserBindings.js';
// 引入 useShortcutDisplay，将 ../../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../../keybindings/useShortcutDisplay.js';
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js';
// 复用 isFastModeAvailable、isFastModeEnabled 工具函数，把通用处理留在 ../../utils/fastMode.js 中维护。
import { isFastModeAvailable, isFastModeEnabled } from '../../utils/fastMode.js';
// 引入 getNewlineInstructions，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getNewlineInstructions } from './utils.js';

/** Format a shortcut for display in the help menu (e.g., "ctrl+o" → "ctrl + o") */
// formatShortcut 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatShortcut(shortcut: string): string {
  // 返回 `shortcut.replace(/\+/g, ' + ')`，作为终端渲染这次计算的结果。
  return shortcut.replace(/\+/g, ' + ');
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  dimColor?: boolean;
  fixedWidth?: boolean;
  gap?: number;
  paddingX?: number;
};
// PromptInputHelpMenu 封装提示输入组件的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PromptInputHelpMenu(props) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(99);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    dimColor,
    fixedWidth,
    gap,
    paddingX
  } = props;
  // 临时值 t0保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t0 = useShortcutDisplay("app:toggleTranscript", "Global", "ctrl+o");
  // t1 暂存 `formatShortcut(t0)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t0) {
    // t1 暂存 `formatShortcut(t0)` 生成的渲染片段，后续返回路径直接复用。
    t1 = formatShortcut(t0);
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // transcriptShortcut保存`t1`，作为后续临时缓存值处理的输入。
  const transcriptShortcut = t1;
  // 临时值 t2保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t2 = useShortcutDisplay("app:toggleTodos", "Global", "ctrl+t");
  // t3 暂存 `formatShortcut(t2)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== t2) {
    // t3 暂存 `formatShortcut(t2)` 生成的渲染片段，后续返回路径直接复用。
    t3 = formatShortcut(t2);
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // todosShortcut保存`t3`，作为后续临时缓存值处理的输入。
  const todosShortcut = t3;
  // 临时值 t4保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t4 = useShortcutDisplay("chat:undo", "Chat", "ctrl+_");
  // t5 暂存 `formatShortcut(t4)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== t4) {
    // t5 暂存 `formatShortcut(t4)` 生成的渲染片段，后续返回路径直接复用。
    t5 = formatShortcut(t4);
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // undoShortcut沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const undoShortcut = t5;
  // 临时值 t6保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t6 = useShortcutDisplay("chat:stash", "Chat", "ctrl+s");
  // t7 暂存 `formatShortcut(t6)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t6) {
    // t7 暂存 `formatShortcut(t6)` 生成的渲染片段，后续返回路径直接复用。
    t7 = formatShortcut(t6);
    // $[6] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t6;
    // $[7] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[7];
  }
  // stashShortcut保存`t7`，作为后续临时缓存值处理的输入。
  const stashShortcut = t7;
  // 临时值 t8保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t8 = useShortcutDisplay("chat:cycleMode", "Chat", "shift+tab");
  // t9 暂存 `formatShortcut(t8)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== t8) {
    // t9 暂存 `formatShortcut(t8)` 生成的渲染片段，后续返回路径直接复用。
    t9 = formatShortcut(t8);
    // $[8] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t8;
    // $[9] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[9];
  }
  // cycleModeShortcut保存`t9`，作为后续临时缓存值处理的输入。
  const cycleModeShortcut = t9;
  // 临时值 t10保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t10 = useShortcutDisplay("chat:modelPicker", "Chat", "alt+p");
  // t11 暂存 `formatShortcut(t10)` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t10) {
    // t11 暂存 `formatShortcut(t10)` 生成的渲染片段，后续返回路径直接复用。
    t11 = formatShortcut(t10);
    // $[10] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t10;
    // $[11] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[11];
  }
  // modelPickerShortcut 命名 `t11`，让后续代码直接表达这个值的用途。
  const modelPickerShortcut = t11;
  // 临时值 t12保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t12 = useShortcutDisplay("chat:fastMode", "Chat", "alt+o");
  // t13 暂存 `formatShortcut(t12)` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t12) {
    // t13 暂存 `formatShortcut(t12)` 生成的渲染片段，后续返回路径直接复用。
    t13 = formatShortcut(t12);
    // $[12] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t12;
    // $[13] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[13];
  }
  // fastModeShortcut保存`t13`，作为后续临时缓存值处理的输入。
  const fastModeShortcut = t13;
  // 临时值 t14保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t14 = useShortcutDisplay("chat:externalEditor", "Chat", "ctrl+g");
  // t15 暂存 `formatShortcut(t14)` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== t14) {
    // t15 暂存 `formatShortcut(t14)` 生成的渲染片段，后续返回路径直接复用。
    t15 = formatShortcut(t14);
    // $[14] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t14;
    // $[15] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[15];
  }
  // externalEditorShortcut沿用 `t15` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const externalEditorShortcut = t15;
  // 临时值 t16保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t16 = useShortcutDisplay("app:toggleTerminal", "Global", "meta+j");
  // t17 暂存 `formatShortcut(t16)` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t16) {
    // t17 暂存 `formatShortcut(t16)` 生成的渲染片段，后续返回路径直接复用。
    t17 = formatShortcut(t16);
    // $[16] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t16;
    // $[17] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[17];
  }
  // terminalShortcut保存`t17`，作为后续临时缓存值处理的输入。
  const terminalShortcut = t17;
  // 临时值 t18保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const t18 = useShortcutDisplay("chat:imagePaste", "Chat", "ctrl+v");
  // t19 暂存 `formatShortcut(t18)` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== t18) {
    // t19 暂存 `formatShortcut(t18)` 生成的渲染片段，后续返回路径直接复用。
    t19 = formatShortcut(t18);
    // $[18] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t18;
    // $[19] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[19];
  }
  // imagePasteShortcut保存`t19`，作为后续临时缓存值处理的输入。
  const imagePasteShortcut = t19;
  // t20 暂存 `feature("TERMINAL_PANEL") ? getFeatureValue_CACHED_MAY_BE...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== dimColor || $[21] !== terminalShortcut) {
    // t20 暂存 `feature("TERMINAL_PANEL") ? getFeatureValue_CACHED_MAY_BE...` 生成的渲染片段，后续返回路径直接复用。
    t20 = feature("TERMINAL_PANEL") ? getFeatureValue_CACHED_MAY_BE_STALE("tengu_terminal_panel", false) ? <Box><Text dimColor={dimColor}>{terminalShortcut} for terminal</Text></Box> : null : null;
    // $[20] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = dimColor;
    // $[21] 缓存 `terminalShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = terminalShortcut;
    // $[22] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[22];
  }
  // terminalShortcutElement 命名 `t20`，让后续代码直接表达这个值的用途。
  const terminalShortcutElement = t20;
  // t21保存`fixedWidth ? 24 : undefined`，供终端渲染提示输入组件 Prompt Input Help Menu后续判断或输出使用。
  const t21 = fixedWidth ? 24 : undefined;
  // t22 暂存 `<Box><Text dimColor={dimColor}>! for bash mode</Text></Bo...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== dimColor) {
    // t22 暂存 `<Box><Text dimColor={dimColor}>! for bash mode</Text></Bo...` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Box><Text dimColor={dimColor}>! for bash mode</Text></Box>;
    // $[23] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = dimColor;
    // $[24] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[24];
  }
  // t23 暂存 `<Box><Text dimColor={dimColor}>/ for commands</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== dimColor) {
    // t23 暂存 `<Box><Text dimColor={dimColor}>/ for commands</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Box><Text dimColor={dimColor}>/ for commands</Text></Box>;
    // $[25] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = dimColor;
    // $[26] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[26];
  }
  // t24 暂存 `<Box><Text dimColor={dimColor}>@ for file paths</Text></B...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== dimColor) {
    // t24 暂存 `<Box><Text dimColor={dimColor}>@ for file paths</Text></B...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Box><Text dimColor={dimColor}>@ for file paths</Text></Box>;
    // $[27] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = dimColor;
    // $[28] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[28];
  }
  // t25 暂存 `<Box><Text dimColor={dimColor}>{"& for background"}</Text...` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== dimColor) {
    // t25 暂存 `<Box><Text dimColor={dimColor}>{"& for background"}</Text...` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Box><Text dimColor={dimColor}>{"& for background"}</Text></Box>;
    // $[29] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = dimColor;
    // $[30] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[30];
  }
  // t26 暂存 `<Box><Text dimColor={dimColor}>/btw for side question</Te...` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== dimColor) {
    // t26 暂存 `<Box><Text dimColor={dimColor}>/btw for side question</Te...` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Box><Text dimColor={dimColor}>/btw for side question</Text></Box>;
    // $[31] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = dimColor;
    // $[32] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[32];
  }
  // t27 暂存 `<Box flexDirection="column" width={t21}>{t22}{t23}{t24}{t...` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[33] !== t21 || $[34] !== t22 || $[35] !== t23 || $[36] !== t24 || $[37] !== t25 || $[38] !== t26) {
    // t27 暂存 `<Box flexDirection="column" width={t21}>{t22}{t23}{t24}{t...` 生成的渲染片段，后续返回路径直接复用。
    t27 = <Box flexDirection="column" width={t21}>{t22}{t23}{t24}{t25}{t26}</Box>;
    // $[33] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t21;
    // $[34] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t22;
    // $[35] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t23;
    // $[36] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t24;
    // $[37] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t25;
    // $[38] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t26;
    // $[39] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t27;
  } else {
    // t27 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[39];
  }
  // t28保存`fixedWidth ? 35 : undefined`，供终端渲染提示输入组件 Prompt Input Help Menu后续判断或输出使用。
  const t28 = fixedWidth ? 35 : undefined;
  // t29 暂存 `<Box><Text dimColor={dimColor}>double tap esc to clear in...` 的派生结果，便于缓存命中时直接复用。
  let t29;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[40] !== dimColor) {
    // t29 暂存 `<Box><Text dimColor={dimColor}>double tap esc to clear in...` 生成的渲染片段，后续返回路径直接复用。
    t29 = <Box><Text dimColor={dimColor}>double tap esc to clear input</Text></Box>;
    // $[40] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = dimColor;
    // $[41] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t29;
  } else {
    // t29 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t29 = $[41];
  }
  // t30 暂存 `<Box><Text dimColor={dimColor}>{cycleModeShortcut}{" "}{f...` 的派生结果，便于缓存命中时直接复用。
  let t30;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== cycleModeShortcut || $[43] !== dimColor) {
    // t30 暂存 `<Box><Text dimColor={dimColor}>{cycleModeShortcut}{" "}{f...` 生成的渲染片段，后续返回路径直接复用。
    t30 = <Box><Text dimColor={dimColor}>{cycleModeShortcut}{" "}{false ? "to cycle modes" : "to auto-accept edits"}</Text></Box>;
    // $[42] 缓存 `cycleModeShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = cycleModeShortcut;
    // $[43] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = dimColor;
    // $[44] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t30;
  } else {
    // t30 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t30 = $[44];
  }
  // t31 暂存 `<Box><Text dimColor={dimColor}>{transcriptShortcut} for v...` 的派生结果，便于缓存命中时直接复用。
  let t31;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== dimColor || $[46] !== transcriptShortcut) {
    // t31 暂存 `<Box><Text dimColor={dimColor}>{transcriptShortcut} for v...` 生成的渲染片段，后续返回路径直接复用。
    t31 = <Box><Text dimColor={dimColor}>{transcriptShortcut} for verbose output</Text></Box>;
    // $[45] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = dimColor;
    // $[46] 缓存 `transcriptShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = transcriptShortcut;
    // $[47] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t31;
  } else {
    // t31 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t31 = $[47];
  }
  // t32 暂存 `<Box><Text dimColor={dimColor}>{todosShortcut} to toggle ...` 的派生结果，便于缓存命中时直接复用。
  let t32;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== dimColor || $[49] !== todosShortcut) {
    // t32 暂存 `<Box><Text dimColor={dimColor}>{todosShortcut} to toggle ...` 生成的渲染片段，后续返回路径直接复用。
    t32 = <Box><Text dimColor={dimColor}>{todosShortcut} to toggle tasks</Text></Box>;
    // $[48] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = dimColor;
    // $[49] 缓存 `todosShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = todosShortcut;
    // $[50] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t32;
  } else {
    // t32 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t32 = $[50];
  }
  // t33 暂存 `getNewlineInstructions()` 的派生结果，便于缓存命中时直接复用。
  let t33;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
    // t33 暂存 `getNewlineInstructions()` 生成的渲染片段，后续返回路径直接复用。
    t33 = getNewlineInstructions();
    // $[51] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t33;
  } else {
    // t33 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t33 = $[51];
  }
  // t34 暂存 `<Box><Text dimColor={dimColor}>{t33}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t34;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[52] !== dimColor) {
    // t34 暂存 `<Box><Text dimColor={dimColor}>{t33}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t34 = <Box><Text dimColor={dimColor}>{t33}</Text></Box>;
    // $[52] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = dimColor;
    // $[53] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t34;
  } else {
    // t34 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t34 = $[53];
  }
  // t35 暂存 `<Box flexDirection="column" width={t28}>{t29}{t30}{t31}{t...` 的派生结果，便于缓存命中时直接复用。
  let t35;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[54] !== t28 || $[55] !== t29 || $[56] !== t30 || $[57] !== t31 || $[58] !== t32 || $[59] !== t34 || $[60] !== terminalShortcutElement) {
    // t35 暂存 `<Box flexDirection="column" width={t28}>{t29}{t30}{t31}{t...` 生成的渲染片段，后续返回路径直接复用。
    t35 = <Box flexDirection="column" width={t28}>{t29}{t30}{t31}{t32}{terminalShortcutElement}{t34}</Box>;
    // $[54] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t28;
    // $[55] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t29;
    // $[56] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t30;
    // $[57] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t31;
    // $[58] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = t32;
    // $[59] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t34;
    // $[60] 缓存 `terminalShortcutElement`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = terminalShortcutElement;
    // $[61] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t35;
  } else {
    // t35 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
    t35 = $[61];
  }
  // t36 暂存 `<Box><Text dimColor={dimColor}>{undoShortcut} to undo</Te...` 的派生结果，便于缓存命中时直接复用。
  let t36;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[62] !== dimColor || $[63] !== undoShortcut) {
    // t36 暂存 `<Box><Text dimColor={dimColor}>{undoShortcut} to undo</Te...` 生成的渲染片段，后续返回路径直接复用。
    t36 = <Box><Text dimColor={dimColor}>{undoShortcut} to undo</Text></Box>;
    // $[62] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = dimColor;
    // $[63] 缓存 `undoShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = undoShortcut;
    // $[64] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = t36;
  } else {
    // t36 从 React 编译缓存槽 $[64] 取回渲染片段，避免依赖未变时重建 JSX。
    t36 = $[64];
  }
  // t37 暂存 `getPlatform() !== "windows" && <Box><Text dimColor={dimCo...` 的派生结果，便于缓存命中时直接复用。
  let t37;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[65] !== dimColor) {
    // t37 暂存 `getPlatform() !== "windows" && <Box><Text dimColor={dimCo...` 生成的渲染片段，后续返回路径直接复用。
    t37 = getPlatform() !== "windows" && <Box><Text dimColor={dimColor}>ctrl + z to suspend</Text></Box>;
    // $[65] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = dimColor;
    // $[66] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = t37;
  } else {
    // t37 从 React 编译缓存槽 $[66] 取回渲染片段，避免依赖未变时重建 JSX。
    t37 = $[66];
  }
  // t38 暂存 `<Box><Text dimColor={dimColor}>{imagePasteShortcut} to pa...` 的派生结果，便于缓存命中时直接复用。
  let t38;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[67] !== dimColor || $[68] !== imagePasteShortcut) {
    // t38 暂存 `<Box><Text dimColor={dimColor}>{imagePasteShortcut} to pa...` 生成的渲染片段，后续返回路径直接复用。
    t38 = <Box><Text dimColor={dimColor}>{imagePasteShortcut} to paste images</Text></Box>;
    // $[67] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = dimColor;
    // $[68] 缓存 `imagePasteShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = imagePasteShortcut;
    // $[69] 缓存 `t38`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t38;
  } else {
    // t38 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
    t38 = $[69];
  }
  // t39 暂存 `<Box><Text dimColor={dimColor}>{modelPickerShortcut} to s...` 的派生结果，便于缓存命中时直接复用。
  let t39;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[70] !== dimColor || $[71] !== modelPickerShortcut) {
    // t39 暂存 `<Box><Text dimColor={dimColor}>{modelPickerShortcut} to s...` 生成的渲染片段，后续返回路径直接复用。
    t39 = <Box><Text dimColor={dimColor}>{modelPickerShortcut} to switch model</Text></Box>;
    // $[70] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = dimColor;
    // $[71] 缓存 `modelPickerShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = modelPickerShortcut;
    // $[72] 缓存 `t39`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t39;
  } else {
    // t39 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
    t39 = $[72];
  }
  // t40 暂存 `isFastModeEnabled() && isFastModeAvailable() && <Box><Tex...` 的派生结果，便于缓存命中时直接复用。
  let t40;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[73] !== dimColor || $[74] !== fastModeShortcut) {
    // t40 暂存 `isFastModeEnabled() && isFastModeAvailable() && <Box><Tex...` 生成的渲染片段，后续返回路径直接复用。
    t40 = isFastModeEnabled() && isFastModeAvailable() && <Box><Text dimColor={dimColor}>{fastModeShortcut} to toggle fast mode</Text></Box>;
    // $[73] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = dimColor;
    // $[74] 缓存 `fastModeShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = fastModeShortcut;
    // $[75] 缓存 `t40`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t40;
  } else {
    // t40 从 React 编译缓存槽 $[75] 取回渲染片段，避免依赖未变时重建 JSX。
    t40 = $[75];
  }
  // t41 暂存 `<Box><Text dimColor={dimColor}>{stashShortcut} to stash p...` 的派生结果，便于缓存命中时直接复用。
  let t41;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[76] !== dimColor || $[77] !== stashShortcut) {
    // t41 暂存 `<Box><Text dimColor={dimColor}>{stashShortcut} to stash p...` 生成的渲染片段，后续返回路径直接复用。
    t41 = <Box><Text dimColor={dimColor}>{stashShortcut} to stash prompt</Text></Box>;
    // $[76] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = dimColor;
    // $[77] 缓存 `stashShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = stashShortcut;
    // $[78] 缓存 `t41`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = t41;
  } else {
    // t41 从 React 编译缓存槽 $[78] 取回渲染片段，避免依赖未变时重建 JSX。
    t41 = $[78];
  }
  // t42 暂存 `<Box><Text dimColor={dimColor}>{externalEditorShortcut} t...` 的派生结果，便于缓存命中时直接复用。
  let t42;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[79] !== dimColor || $[80] !== externalEditorShortcut) {
    // t42 暂存 `<Box><Text dimColor={dimColor}>{externalEditorShortcut} t...` 生成的渲染片段，后续返回路径直接复用。
    t42 = <Box><Text dimColor={dimColor}>{externalEditorShortcut} to edit in $EDITOR</Text></Box>;
    // $[79] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = dimColor;
    // $[80] 缓存 `externalEditorShortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = externalEditorShortcut;
    // $[81] 缓存 `t42`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = t42;
  } else {
    // t42 从 React 编译缓存槽 $[81] 取回渲染片段，避免依赖未变时重建 JSX。
    t42 = $[81];
  }
  // t43 暂存 `isKeybindingCustomizationEnabled() && <Box><Text dimColor...` 的派生结果，便于缓存命中时直接复用。
  let t43;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[82] !== dimColor) {
    // t43 暂存 `isKeybindingCustomizationEnabled() && <Box><Text dimColor...` 生成的渲染片段，后续返回路径直接复用。
    t43 = isKeybindingCustomizationEnabled() && <Box><Text dimColor={dimColor}>/keybindings to customize</Text></Box>;
    // $[82] 缓存 `dimColor`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = dimColor;
    // $[83] 缓存 `t43`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = t43;
  } else {
    // t43 从 React 编译缓存槽 $[83] 取回渲染片段，避免依赖未变时重建 JSX。
    t43 = $[83];
  }
  // t44 暂存 `<Box flexDirection="column">{t36}{t37}{t38}{t39}{t40}{t41...` 的派生结果，便于缓存命中时直接复用。
  let t44;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[84] !== t36 || $[85] !== t37 || $[86] !== t38 || $[87] !== t39 || $[88] !== t40 || $[89] !== t41 || $[90] !== t42 || $[91] !== t43) {
    // t44 暂存 `<Box flexDirection="column">{t36}{t37}{t38}{t39}{t40}{t41...` 生成的渲染片段，后续返回路径直接复用。
    t44 = <Box flexDirection="column">{t36}{t37}{t38}{t39}{t40}{t41}{t42}{t43}</Box>;
    // $[84] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = t36;
    // $[85] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = t37;
    // $[86] 缓存 `t38`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = t38;
    // $[87] 缓存 `t39`，下次依赖未变时 React 编译产物可直接复用。
    $[87] = t39;
    // $[88] 缓存 `t40`，下次依赖未变时 React 编译产物可直接复用。
    $[88] = t40;
    // $[89] 缓存 `t41`，下次依赖未变时 React 编译产物可直接复用。
    $[89] = t41;
    // $[90] 缓存 `t42`，下次依赖未变时 React 编译产物可直接复用。
    $[90] = t42;
    // $[91] 缓存 `t43`，下次依赖未变时 React 编译产物可直接复用。
    $[91] = t43;
    // $[92] 缓存 `t44`，下次依赖未变时 React 编译产物可直接复用。
    $[92] = t44;
  } else {
    // t44 从 React 编译缓存槽 $[92] 取回渲染片段，避免依赖未变时重建 JSX。
    t44 = $[92];
  }
  // t45 暂存 `<Box paddingX={paddingX} flexDirection="row" gap={gap}>{t...` 的派生结果，便于缓存命中时直接复用。
  let t45;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[93] !== gap || $[94] !== paddingX || $[95] !== t27 || $[96] !== t35 || $[97] !== t44) {
    // t45 暂存 `<Box paddingX={paddingX} flexDirection="row" gap={gap}>{t...` 生成的渲染片段，后续返回路径直接复用。
    t45 = <Box paddingX={paddingX} flexDirection="row" gap={gap}>{t27}{t35}{t44}</Box>;
    // $[93] 缓存 `gap`，下次依赖未变时 React 编译产物可直接复用。
    $[93] = gap;
    // $[94] 缓存 `paddingX`，下次依赖未变时 React 编译产物可直接复用。
    $[94] = paddingX;
    // $[95] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[95] = t27;
    // $[96] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[96] = t35;
    // $[97] 缓存 `t44`，下次依赖未变时 React 编译产物可直接复用。
    $[97] = t44;
    // $[98] 缓存 `t45`，下次依赖未变时 React 编译产物可直接复用。
    $[98] = t45;
  } else {
    // t45 从 React 编译缓存槽 $[98] 取回渲染片段，避免依赖未变时重建 JSX。
    t45 = $[98];
  }
  // 返回 `t45`，作为终端渲染这次计算的结果。
  return t45;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJCb3giLCJUZXh0IiwiZ2V0UGxhdGZvcm0iLCJpc0tleWJpbmRpbmdDdXN0b21pemF0aW9uRW5hYmxlZCIsInVzZVNob3J0Y3V0RGlzcGxheSIsImdldEZlYXR1cmVWYWx1ZV9DQUNIRURfTUFZX0JFX1NUQUxFIiwiaXNGYXN0TW9kZUF2YWlsYWJsZSIsImlzRmFzdE1vZGVFbmFibGVkIiwiZ2V0TmV3bGluZUluc3RydWN0aW9ucyIsImZvcm1hdFNob3J0Y3V0Iiwic2hvcnRjdXQiLCJyZXBsYWNlIiwiUHJvcHMiLCJkaW1Db2xvciIsImZpeGVkV2lkdGgiLCJnYXAiLCJwYWRkaW5nWCIsIlByb21wdElucHV0SGVscE1lbnUiLCJwcm9wcyIsIiQiLCJfYyIsInQwIiwidDEiLCJ0cmFuc2NyaXB0U2hvcnRjdXQiLCJ0MiIsInQzIiwidG9kb3NTaG9ydGN1dCIsInQ0IiwidDUiLCJ1bmRvU2hvcnRjdXQiLCJ0NiIsInQ3Iiwic3Rhc2hTaG9ydGN1dCIsInQ4IiwidDkiLCJjeWNsZU1vZGVTaG9ydGN1dCIsInQxMCIsInQxMSIsIm1vZGVsUGlja2VyU2hvcnRjdXQiLCJ0MTIiLCJ0MTMiLCJmYXN0TW9kZVNob3J0Y3V0IiwidDE0IiwidDE1IiwiZXh0ZXJuYWxFZGl0b3JTaG9ydGN1dCIsInQxNiIsInQxNyIsInRlcm1pbmFsU2hvcnRjdXQiLCJ0MTgiLCJ0MTkiLCJpbWFnZVBhc3RlU2hvcnRjdXQiLCJ0MjAiLCJ0ZXJtaW5hbFNob3J0Y3V0RWxlbWVudCIsInQyMSIsInVuZGVmaW5lZCIsInQyMiIsInQyMyIsInQyNCIsInQyNSIsInQyNiIsInQyNyIsInQyOCIsInQyOSIsInQzMCIsInQzMSIsInQzMiIsInQzMyIsIlN5bWJvbCIsImZvciIsInQzNCIsInQzNSIsInQzNiIsInQzNyIsInQzOCIsInQzOSIsInQ0MCIsInQ0MSIsInQ0MiIsInQ0MyIsInQ0NCIsInQ0NSJdLCJzb3VyY2VzIjpbIlByb21wdElucHV0SGVscE1lbnUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGZlYXR1cmUgfSBmcm9tICdidW46YnVuZGxlJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICdzcmMvaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0UGxhdGZvcm0gfSBmcm9tICdzcmMvdXRpbHMvcGxhdGZvcm0uanMnXG5pbXBvcnQgeyBpc0tleWJpbmRpbmdDdXN0b21pemF0aW9uRW5hYmxlZCB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL2xvYWRVc2VyQmluZGluZ3MuanMnXG5pbXBvcnQgeyB1c2VTaG9ydGN1dERpc3BsYXkgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VTaG9ydGN1dERpc3BsYXkuanMnXG5pbXBvcnQgeyBnZXRGZWF0dXJlVmFsdWVfQ0FDSEVEX01BWV9CRV9TVEFMRSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9ncm93dGhib29rLmpzJ1xuaW1wb3J0IHsgaXNGYXN0TW9kZUF2YWlsYWJsZSwgaXNGYXN0TW9kZUVuYWJsZWQgfSBmcm9tICcuLi8uLi91dGlscy9mYXN0TW9kZS5qcydcbmltcG9ydCB7IGdldE5ld2xpbmVJbnN0cnVjdGlvbnMgfSBmcm9tICcuL3V0aWxzLmpzJ1xuXG4vKiogRm9ybWF0IGEgc2hvcnRjdXQgZm9yIGRpc3BsYXkgaW4gdGhlIGhlbHAgbWVudSAoZS5nLiwgXCJjdHJsK29cIiDihpIgXCJjdHJsICsgb1wiKSAqL1xuZnVuY3Rpb24gZm9ybWF0U2hvcnRjdXQoc2hvcnRjdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzaG9ydGN1dC5yZXBsYWNlKC9cXCsvZywgJyArICcpXG59XG5cbnR5cGUgUHJvcHMgPSB7XG4gIGRpbUNvbG9yPzogYm9vbGVhblxuICBmaXhlZFdpZHRoPzogYm9vbGVhblxuICBnYXA/OiBudW1iZXJcbiAgcGFkZGluZ1g/OiBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByb21wdElucHV0SGVscE1lbnUocHJvcHM6IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBkaW1Db2xvciwgZml4ZWRXaWR0aCwgZ2FwLCBwYWRkaW5nWCB9ID0gcHJvcHNcblxuICAvLyBHZXQgY29uZmlndXJlZCBzaG9ydGN1dHMgZnJvbSBrZXliaW5kaW5nIHN5c3RlbVxuICBjb25zdCB0cmFuc2NyaXB0U2hvcnRjdXQgPSBmb3JtYXRTaG9ydGN1dChcbiAgICB1c2VTaG9ydGN1dERpc3BsYXkoJ2FwcDp0b2dnbGVUcmFuc2NyaXB0JywgJ0dsb2JhbCcsICdjdHJsK28nKSxcbiAgKVxuICBjb25zdCB0b2Rvc1Nob3J0Y3V0ID0gZm9ybWF0U2hvcnRjdXQoXG4gICAgdXNlU2hvcnRjdXREaXNwbGF5KCdhcHA6dG9nZ2xlVG9kb3MnLCAnR2xvYmFsJywgJ2N0cmwrdCcpLFxuICApXG4gIGNvbnN0IHVuZG9TaG9ydGN1dCA9IGZvcm1hdFNob3J0Y3V0KFxuICAgIHVzZVNob3J0Y3V0RGlzcGxheSgnY2hhdDp1bmRvJywgJ0NoYXQnLCAnY3RybCtfJyksXG4gIClcbiAgY29uc3Qgc3Rhc2hTaG9ydGN1dCA9IGZvcm1hdFNob3J0Y3V0KFxuICAgIHVzZVNob3J0Y3V0RGlzcGxheSgnY2hhdDpzdGFzaCcsICdDaGF0JywgJ2N0cmwrcycpLFxuICApXG4gIGNvbnN0IGN5Y2xlTW9kZVNob3J0Y3V0ID0gZm9ybWF0U2hvcnRjdXQoXG4gICAgdXNlU2hvcnRjdXREaXNwbGF5KCdjaGF0OmN5Y2xlTW9kZScsICdDaGF0JywgJ3NoaWZ0K3RhYicpLFxuICApXG4gIGNvbnN0IG1vZGVsUGlja2VyU2hvcnRjdXQgPSBmb3JtYXRTaG9ydGN1dChcbiAgICB1c2VTaG9ydGN1dERpc3BsYXkoJ2NoYXQ6bW9kZWxQaWNrZXInLCAnQ2hhdCcsICdhbHQrcCcpLFxuICApXG4gIGNvbnN0IGZhc3RNb2RlU2hvcnRjdXQgPSBmb3JtYXRTaG9ydGN1dChcbiAgICB1c2VTaG9ydGN1dERpc3BsYXkoJ2NoYXQ6ZmFzdE1vZGUnLCAnQ2hhdCcsICdhbHQrbycpLFxuICApXG4gIGNvbnN0IGV4dGVybmFsRWRpdG9yU2hvcnRjdXQgPSBmb3JtYXRTaG9ydGN1dChcbiAgICB1c2VTaG9ydGN1dERpc3BsYXkoJ2NoYXQ6ZXh0ZXJuYWxFZGl0b3InLCAnQ2hhdCcsICdjdHJsK2cnKSxcbiAgKVxuICBjb25zdCB0ZXJtaW5hbFNob3J0Y3V0ID0gZm9ybWF0U2hvcnRjdXQoXG4gICAgdXNlU2hvcnRjdXREaXNwbGF5KCdhcHA6dG9nZ2xlVGVybWluYWwnLCAnR2xvYmFsJywgJ21ldGEraicpLFxuICApXG4gIGNvbnN0IGltYWdlUGFzdGVTaG9ydGN1dCA9IGZvcm1hdFNob3J0Y3V0KFxuICAgIHVzZVNob3J0Y3V0RGlzcGxheSgnY2hhdDppbWFnZVBhc3RlJywgJ0NoYXQnLCAnY3RybCt2JyksXG4gIClcblxuICAvLyBDb21wdXRlIHRlcm1pbmFsIHNob3J0Y3V0IGVsZW1lbnQgb3V0c2lkZSBKU1ggdG8gc2F0aXNmeSBmZWF0dXJlKCkgY29uc3RyYWludFxuICBjb25zdCB0ZXJtaW5hbFNob3J0Y3V0RWxlbWVudCA9IGZlYXR1cmUoJ1RFUk1JTkFMX1BBTkVMJykgPyAoXG4gICAgZ2V0RmVhdHVyZVZhbHVlX0NBQ0hFRF9NQVlfQkVfU1RBTEUoJ3Rlbmd1X3Rlcm1pbmFsX3BhbmVsJywgZmFsc2UpID8gKFxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT57dGVybWluYWxTaG9ydGN1dH0gZm9yIHRlcm1pbmFsPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgKSA6IG51bGxcbiAgKSA6IG51bGxcblxuICByZXR1cm4gKFxuICAgIDxCb3ggcGFkZGluZ1g9e3BhZGRpbmdYfSBmbGV4RGlyZWN0aW9uPVwicm93XCIgZ2FwPXtnYXB9PlxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgd2lkdGg9e2ZpeGVkV2lkdGggPyAyNCA6IHVuZGVmaW5lZH0+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT4hIGZvciBiYXNoIG1vZGU8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPXtkaW1Db2xvcn0+LyBmb3IgY29tbWFuZHM8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPXtkaW1Db2xvcn0+QCBmb3IgZmlsZSBwYXRoczwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT4mIGZvciBiYWNrZ3JvdW5kPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17ZGltQ29sb3J9Pi9idHcgZm9yIHNpZGUgcXVlc3Rpb248L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiB3aWR0aD17Zml4ZWRXaWR0aCA/IDM1IDogdW5kZWZpbmVkfT5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17ZGltQ29sb3J9PmRvdWJsZSB0YXAgZXNjIHRvIGNsZWFyIGlucHV0PC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17ZGltQ29sb3J9PlxuICAgICAgICAgICAge2N5Y2xlTW9kZVNob3J0Y3V0fXsnICd9XG4gICAgICAgICAgICB7XCJleHRlcm5hbFwiID09PSAnYW50J1xuICAgICAgICAgICAgICA/ICd0byBjeWNsZSBtb2RlcydcbiAgICAgICAgICAgICAgOiAndG8gYXV0by1hY2NlcHQgZWRpdHMnfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT5cbiAgICAgICAgICAgIHt0cmFuc2NyaXB0U2hvcnRjdXR9IGZvciB2ZXJib3NlIG91dHB1dFxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT57dG9kb3NTaG9ydGN1dH0gdG8gdG9nZ2xlIHRhc2tzPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAge3Rlcm1pbmFsU2hvcnRjdXRFbGVtZW50fVxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPXtkaW1Db2xvcn0+e2dldE5ld2xpbmVJbnN0cnVjdGlvbnMoKX08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17ZGltQ29sb3J9Pnt1bmRvU2hvcnRjdXR9IHRvIHVuZG88L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7Z2V0UGxhdGZvcm0oKSAhPT0gJ3dpbmRvd3MnICYmIChcbiAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT5jdHJsICsgeiB0byBzdXNwZW5kPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPXtkaW1Db2xvcn0+e2ltYWdlUGFzdGVTaG9ydGN1dH0gdG8gcGFzdGUgaW1hZ2VzPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17ZGltQ29sb3J9Pnttb2RlbFBpY2tlclNob3J0Y3V0fSB0byBzd2l0Y2ggbW9kZWw8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7aXNGYXN0TW9kZUVuYWJsZWQoKSAmJiBpc0Zhc3RNb2RlQXZhaWxhYmxlKCkgJiYgKFxuICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj17ZGltQ29sb3J9PlxuICAgICAgICAgICAgICB7ZmFzdE1vZGVTaG9ydGN1dH0gdG8gdG9nZ2xlIGZhc3QgbW9kZVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuICAgICAgICA8Qm94PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPXtkaW1Db2xvcn0+e3N0YXNoU2hvcnRjdXR9IHRvIHN0YXNoIHByb21wdDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbUNvbG9yfT5cbiAgICAgICAgICAgIHtleHRlcm5hbEVkaXRvclNob3J0Y3V0fSB0byBlZGl0IGluICRFRElUT1JcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7aXNLZXliaW5kaW5nQ3VzdG9taXphdGlvbkVuYWJsZWQoKSAmJiAoXG4gICAgICAgICAgPEJveD5cbiAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPXtkaW1Db2xvcn0+L2tleWJpbmRpbmdzIHRvIGN1c3RvbWl6ZTwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxPQUFPLFFBQVEsWUFBWTtBQUNwQyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFlBQVk7QUFDdEMsU0FBU0MsV0FBVyxRQUFRLHVCQUF1QjtBQUNuRCxTQUFTQyxnQ0FBZ0MsUUFBUSx1Q0FBdUM7QUFDeEYsU0FBU0Msa0JBQWtCLFFBQVEseUNBQXlDO0FBQzVFLFNBQVNDLG1DQUFtQyxR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QUF1RCxHQUFBLElBQUF2RCxDQUFBLFNBQUF3RCxHQUFBLElBQUF4RCxDQUFBLFNBQUF5RCxHQUFBLElBQUF6RCxDQUFBLFNBQUEwRCxHQUFBLElBQUExRCxDQUFBLFNBQUEyRCxHQUFBO0lBbENIQyxHQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUFSLEdBRUssQ0FDSixDQUFBQyxHQUlELENBQ0EsQ0FBQUMsR0FFSyxDQUNMLENBQUFDLEdBRUssQ0FDSixDQUFBQyxHQU1ELENBQ0EsQ0FBQUMsR0FFSyxDQUNMLENBQUFDLEdBSUssQ0FDSixDQUFBQyxHQUlELENBQ0YsRUFuQ0MsR0FBRyxDQW1DRTtJQUFBM0QsQ0FBQSxPQUFBb0QsR0FBQTtJQUFBcEQsQ0FBQSxPQUFBcUQsR0FBQTtJQUFBckQsQ0FBQSxPQUFBc0QsR0FBQTtJQUFBdEQsQ0FBQSxPQUFBdUQsR0FBQTtJQUFBdkQsQ0FBQSxPQUFBd0QsR0FBQTtJQUFBeEQsQ0FBQSxPQUFBeUQsR0FBQTtJQUFBekQsQ0FBQSxPQUFBMEQsR0FBQTtJQUFBMUQsQ0FBQSxPQUFBMkQsR0FBQTtJQUFBM0QsQ0FBQSxPQUFBNEQsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTVELENBQUE7RUFBQTtFQUFBLElBQUE2RCxHQUFBO0VBQUEsSUFBQTdELENBQUEsU0FBQUosR0FBQSxJQUFBSSxDQUFBLFNBQUFILFFBQUEsSUFBQUcsQ0FBQSxTQUFBeUMsR0FBQSxJQUFBekMsQ0FBQSxTQUFBbUQsR0FBQSxJQUFBbkQsQ0FBQSxTQUFBNEQsR0FBQTtJQTlFUkMsR0FBQSxJQUFDLEdBQUcsQ0FBV2hFLFFBQVEsQ0FBUkEsU0FBTyxDQUFDLENBQWdCLGFBQUssQ0FBTCxLQUFLLENBQU1ELEdBQUcsQ0FBSEEsSUFBRSxDQUFDLENBQ25ELENBQUE2QyxHQWdCSyxDQUNMLENBQUFVLEdBd0JLLENBQ0wsQ0FBQVMsR0FtQ0ssQ0FDUCxFQS9FQyxHQUFHLENBK0VFO0lBQUE1RCxDQUFBLE9BQUFKLEdBQUE7SUFBQUksQ0FBQSxPQUFBSCxRQUFBO0lBQUFHLENBQUEsT0FBQXlDLEdBQUE7SUFBQXpDLENBQUEsT0FBQW1ELEdBQUE7SUFBQW5ELENBQUEsT0FBQTRELEdBQUE7SUFBQTVELENBQUEsT0FBQTZELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUE3RCxDQUFBO0VBQUE7RUFBQSxPQS9FTjZELEdBK0VNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=