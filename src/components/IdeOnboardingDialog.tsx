// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 复用 envDynamic 工具函数，把通用处理留在 src/utils/envDynamic.js 中维护。
import { envDynamic } from 'src/utils/envDynamic.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../keybindings/useKeybinding.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js';
// 复用 getTerminalIdeType、IDEExtensionInstallationStatus、isJetBrainsIde、toIDEDisplayName 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { getTerminalIdeType, type IDEExtensionInstallationStatus, isJetBrainsIde, toIDEDisplayName } from '../utils/ide.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// Props 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface Props {
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
  installationStatus: IDEExtensionInstallationStatus | null;
}
// IdeOnboardingDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function IdeOnboardingDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(23);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    installationStatus
  } = t0;
  // 调用 markDialogAsShown，触发终端渲染此处需要的副作用。
  markDialogAsShown();
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      "confirm:yes": onDone,
      "confirm:no": onDone
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      context: "Confirmation"
    };
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t1, t2);
  // t3 暂存 `installationStatus?.ideType ?? getTerminalIdeType()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== installationStatus?.ideType) {
    // t3 暂存 `installationStatus?.ideType ?? getTerminalIdeType()` 生成的渲染片段，后续返回路径直接复用。
    t3 = installationStatus?.ideType ?? getTerminalIdeType();
    // $[3] 缓存 `installationStatus?.ideType`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = installationStatus?.ideType;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // ideType保存`t3`，作为后续临时缓存值处理的输入。
  const ideType = t3;
  // isJetBrains 集合记录 `isJetBrainsIde` 是否成立，终端渲染随后按该结果分支。
  const isJetBrains = isJetBrainsIde(ideType);
  // t4 暂存 `toIDEDisplayName(ideType)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== ideType) {
    // t4 暂存 `toIDEDisplayName(ideType)` 生成的渲染片段，后续返回路径直接复用。
    t4 = toIDEDisplayName(ideType);
    // $[5] 缓存 `ideType`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = ideType;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // ideName沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const ideName = t4;
  // installedVersion保存`installationStatus?.installedVersion`，供后续判断或组装使用。
  const installedVersion = installationStatus?.installedVersion;
  // pluginOrExtension 插件数据保存`isJetBrains ? "plugin" : "extension"`，供终端 UI Ide Onboarding Dialog后续判断或输出使用。
  const pluginOrExtension = isJetBrains ? "plugin" : "extension";
  // mentionShortcut标记终端 UI Ide Onboarding Dialog是否启用对应路径。
  const mentionShortcut = env.platform === "darwin" ? "Cmd+Option+K" : "Ctrl+Alt+K";
  // t5 暂存 `<Text color="claude">✻ </Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `<Text color="claude">✻ </Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color="claude">✻ </Text>;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `<>{t5}<Text>Welcome to Claude Code for {ideName}</Text></>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== ideName) {
    // t6 暂存 `<>{t5}<Text>Welcome to Claude Code for {ideName}</Text></>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <>{t5}<Text>Welcome to Claude Code for {ideName}</Text></>;
    // $[8] 缓存 `ideName`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = ideName;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // 临时值 t7 命名 `installedVersion ? `installed ${pluginOrExtension} v${ins...`，让后续代码直接表达这个值的用途。
  const t7 = installedVersion ? `installed ${pluginOrExtension} v${installedVersion}` : undefined;
  // t8 暂存 `<Text color="suggestion">⧉ open files</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Text color="suggestion">⧉ open files</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text color="suggestion">⧉ open files</Text>;
    // $[10] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[10];
  }
  // t9 暂存 `<Text>• Claude has context of {t8}{" "}and <Text color="s...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `<Text>• Claude has context of {t8}{" "}and <Text color="s...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text>• Claude has context of {t8}{" "}and <Text color="suggestion">⧉ selected lines</Text></Text>;
    // $[11] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[11];
  }
  // t10 暂存 `<Text color="diffAddedWord">+11</Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Text color="diffAddedWord">+11</Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text color="diffAddedWord">+11</Text>;
    // $[12] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[12];
  }
  // t11 暂存 `<Text>• Review Claude Code's changes{" "}{t10}{" "}<Text ...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<Text>• Review Claude Code's changes{" "}{t10}{" "}<Text ...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>• Review Claude Code's changes{" "}{t10}{" "}<Text color="diffRemovedWord">-22</Text> in the comfort of your IDE</Text>;
    // $[13] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t11;
  } else {
    // t11从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[13];
  }
  // t12暂存 `<Text>• Cmd+Esc<Text dimColor={true}> for Quick Launch</T...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // 判断 $[14] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t12暂存 `<Text>• Cmd+Esc<Text dimColor={true}> for Quick Launch</T...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text>• Cmd+Esc<Text dimColor={true}> for Quick Launch</Text></Text>;
    // $[14] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t12;
  } else {
    // t12从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[14];
  }
  // t13暂存 `<Box flexDirection="column" gap={1}>{t9}{t11}{t12}<Text>•...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // 判断 $[15] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t13暂存 `<Box flexDirection="column" gap={1}>{t9}{t11}{t12}<Text>•...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box flexDirection="column" gap={1}>{t9}{t11}{t12}<Text>• {mentionShortcut}<Text dimColor={true}> to reference files or lines in your input</Text></Text></Box>;
    // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t13;
  } else {
    // t13从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[15];
  }
  // t14暂存 `<Dialog title={t6} subtitle={t7} color="ide" onCancel={on...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== onDone || $[17] !== t6 || $[18] !== t7) {
    // t14暂存 `<Dialog title={t6} subtitle={t7} color="ide" onCancel={on...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Dialog title={t6} subtitle={t7} color="ide" onCancel={onDone} hideInputGuide={true}>{t13}</Dialog>;
    // $[16] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onDone;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
    // $[19] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t14;
  } else {
    // t14从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[19];
  }
  // t15暂存 `<Box paddingX={1}><Text dimColor={true} italic={true}>Pre...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // 判断 $[20] === Symbol.for("react.memo_cache_sentinel")，将终端渲染分流到只适用于该条件的处理路径。
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    // t15暂存 `<Box paddingX={1}><Text dimColor={true} italic={true}>Pre...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Box paddingX={1}><Text dimColor={true} italic={true}>Press Enter to continue</Text></Box>;
    // $[20] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t15;
  } else {
    // t15从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[20];
  }
  // t16暂存 `<>{t14}{t15}</>` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t14) {
    // t16暂存 `<>{t14}{t15}</>` 生成的渲染片段，后续返回路径直接复用。
    t16 = <>{t14}{t15}</>;
    // $[21] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t14;
    // $[22] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t16;
  } else {
    // t16从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[22];
  }
  // 返回 t16，把终端渲染这个分支的结果交还调用方。
  return t16;
}
// hasIdeOnboardingDialogBeenShown 承担终端渲染中的独立步骤，串起终端 UI 组件 Ide Onboarding Dialog需要的输入整理、状态更新和结果输出。
export function hasIdeOnboardingDialogBeenShown(): boolean {
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 终端名称记录当前扫描状态，终端 UI Ide Onboarding Dia...随后按该状态分支。
  const terminal = envDynamic.terminal || 'unknown';
  // 返回 config.hasIdeOnboardingBeenShown?.[terminal] === true，把终端渲染这个分支的结果交还调用方。
  return config.hasIdeOnboardingBeenShown?.[terminal] === true;
}
// markDialogAsShown 承担终端渲染中的独立步骤，串起终端 UI 组件 Ide Onboarding Dialog需要的输入整理、状态更新和结果输出。
function markDialogAsShown(): void {
  // 判断 hasIdeOnboardingDialogBeenShown()，将终端渲染分流到只适用于该条件的处理路径。
  if (hasIdeOnboardingDialogBeenShown()) {
    // 终端 UI 组件 Ide Onboarding Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
    return;
  }
  // 终端名称记录当前扫描状态，终端 UI Ide Onboarding Dia...随后按该状态分支。
  const terminal = envDynamic.terminal || 'unknown';
  // saveGlobalConfig执行终端渲染在此处需要的副作用或外部交互。
  saveGlobalConfig(current => ({
    ...current,
    hasIdeOnboardingBeenShown: {
      ...current.hasIdeOnboardingBeenShown,
      [terminal]: true
    }
  }));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImVudkR5bmFtaWMiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZ3MiLCJnZXRHbG9iYWxDb25maWciLCJzYXZlR2xvYmFsQ29uZmlnIiwiZW52IiwiZ2V0VGVybWluYWxJZGVUeXBlIiwiSURFRXh0ZW5zaW9uSW5zdGFsbGF0aW9uU3RhdHVzIiwiaXNKZXRCcmFpbnNJZGUiLCJ0b0lERURpc3BsYXlOYW1lIiwiRGlhbG9nIiwiUHJvcHMiLCJvbkRvbmUiLCJpbnN0YWxsYXRpb25TdGF0dXMiLCJJZGVPbmJvYXJkaW5nRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJtYXJrRGlhbG9nQXNTaG93biIsInQxIiwidDIiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwidDMiLCJpZGVUeXBlIiwiaXNKZXRCcmFpbnMiLCJ0NCIsImlkZU5hbWUiLCJpbnN0YWxsZWRWZXJzaW9uIiwicGx1Z2luT3JFeHRlbnNpb24iLCJtZW50aW9uU2hvcnRjdXQiLCJwbGF0Zm9ybSIsInQ1IiwidDYiLCJ0NyIsInVuZGVmaW5lZCIsInQ4IiwidDkiLCJ0MTAiLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJoYXNJZGVPbmJvYXJkaW5nRGlhbG9nQmVlblNob3duIiwiY29uZmlnIiwidGVybWluYWwiLCJoYXNJZGVPbmJvYXJkaW5nQmVlblNob3duIiwiY3VycmVudCJdLCJzb3VyY2VzIjpbIklkZU9uYm9hcmRpbmdEaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGVudkR5bmFtaWMgfSBmcm9tICdzcmMvdXRpbHMvZW52RHluYW1pYy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IGdldEdsb2JhbENvbmZpZywgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGVudiB9IGZyb20gJy4uL3V0aWxzL2Vudi5qcydcbmltcG9ydCB7XG4gIGdldFRlcm1pbmFsSWRlVHlwZSxcbiAgdHlwZSBJREVFeHRlbnNpb25JbnN0YWxsYXRpb25TdGF0dXMsXG4gIGlzSmV0QnJhaW5zSWRlLFxuICB0b0lERURpc3BsYXlOYW1lLFxufSBmcm9tICcuLi91dGlscy9pZGUuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuXG5pbnRlcmZhY2UgUHJvcHMge1xuICBvbkRvbmU6ICgpID0+IHZvaWRcbiAgaW5zdGFsbGF0aW9uU3RhdHVzOiBJREVFeHRlbnNpb25JbnN0YWxsYXRpb25TdGF0dXMgfCBudWxsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJZGVPbmJvYXJkaW5nRGlhbG9nKHtcbiAgb25Eb25lLFxuICBpbnN0YWxsYXRpb25TdGF0dXMsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIG1hcmtEaWFsb2dBc1Nob3duKClcblxuICAvLyBIYW5kbGUgRW50ZXIvRXNjYXBlIHRvIGRpc21pc3NcbiAgdXNlS2V5YmluZGluZ3MoXG4gICAge1xuICAgICAgJ2NvbmZpcm06eWVzJzogb25Eb25lLFxuICAgICAgJ2NvbmZpcm06bm8nOiBvbkRvbmUsXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0sXG4gIClcblxuICBjb25zdCBpZGVUeXBlID0gaW5zdGFsbGF0aW9uU3RhdHVzPy5pZGVUeXBlID8/IGdldFRlcm1pbmFsSWRlVHlwZSgpXG4gIGNvbnN0IGlzSmV0QnJhaW5zID0gaXNKZXRCcmFpbnNJZGUoaWRlVHlwZSlcblxuICBjb25zdCBpZGVOYW1lID0gdG9JREVEaXNwbGF5TmFtZShpZGVUeXBlKVxuICBjb25zdCBpbnN0YWxsZWRWZXJzaW9uID0gaW5zdGFsbGF0aW9uU3RhdHVzPy5pbnN0YWxsZWRWZXJzaW9uXG4gIGNvbnN0IHBsdWdpbk9yRXh0ZW5zaW9uID0gaXNKZXRCcmFpbnMgPyAncGx1Z2luJyA6ICdleHRlbnNpb24nXG4gIGNvbnN0IG1lbnRpb25TaG9ydGN1dCA9XG4gICAgZW52LnBsYXRmb3JtID09PSAnZGFyd2luJyA/ICdDbWQrT3B0aW9uK0snIDogJ0N0cmwrQWx0K0snXG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPERpYWxvZ1xuICAgICAgICB0aXRsZT17XG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+4py7IDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0PldlbGNvbWUgdG8gQ2xhdWRlIENvZGUgZm9yIHtpZGVOYW1lfTwvVGV4dD5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgfVxuICAgICAgICBzdWJ0aXRsZT17XG4gICAgICAgICAgaW5zdGFsbGVkVmVyc2lvblxuICAgICAgICAgICAgPyBgaW5zdGFsbGVkICR7cGx1Z2luT3JFeHRlbnNpb259IHYke2luc3RhbGxlZFZlcnNpb259YFxuICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgICBjb2xvcj1cImlkZVwiXG4gICAgICAgIG9uQ2FuY2VsPXtvbkRvbmV9XG4gICAgICAgIGhpZGVJbnB1dEd1aWRlXG4gICAgICA+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICDigKIgQ2xhdWRlIGhhcyBjb250ZXh0IG9mIDxUZXh0IGNvbG9yPVwic3VnZ2VzdGlvblwiPuKniSBvcGVuIGZpbGVzPC9UZXh0PnsnICd9XG4gICAgICAgICAgICBhbmQgPFRleHQgY29sb3I9XCJzdWdnZXN0aW9uXCI+4qeJIHNlbGVjdGVkIGxpbmVzPC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIOKAoiBSZXZpZXcgQ2xhdWRlIENvZGUmYXBvcztzIGNoYW5nZXN7JyAnfVxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJkaWZmQWRkZWRXb3JkXCI+KzExPC9UZXh0PnsnICd9XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cImRpZmZSZW1vdmVkV29yZFwiPi0yMjwvVGV4dD4gaW4gdGhlIGNvbWZvcnQgb2YgeW91ciBJREVcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICDigKIgQ21kK0VzYzxUZXh0IGRpbUNvbG9yPiBmb3IgUXVpY2sgTGF1bmNoPC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIOKAoiB7bWVudGlvblNob3J0Y3V0fVxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+IHRvIHJlZmVyZW5jZSBmaWxlcyBvciBsaW5lcyBpbiB5b3VyIGlucHV0PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0RpYWxvZz5cbiAgICAgIDxCb3ggcGFkZGluZ1g9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgUHJlc3MgRW50ZXIgdG8gY29udGludWVcbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC8+XG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0lkZU9uYm9hcmRpbmdEaWFsb2dCZWVuU2hvd24oKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gIGNvbnN0IHRlcm1pbmFsID0gZW52RHluYW1pYy50ZXJtaW5hbCB8fCAndW5rbm93bidcbiAgcmV0dXJuIGNvbmZpZy5oYXNJZGVPbmJvYXJkaW5nQmVlblNob3duPy5bdGVybWluYWxdID09PSB0cnVlXG59XG5cbmZ1bmN0aW9uIG1hcmtEaWFsb2dBc1Nob3duKCk6IHZvaWQge1xuICBpZiAoaGFzSWRlT25ib2FyZGluZ0RpYWxvZ0JlZW5TaG93bigpKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgY29uc3QgdGVybWluYWwgPSBlbnZEeW5hbWljLnRlcm1pbmFsIHx8ICd1bmtub3duJ1xuICBzYXZlR2xvYmFsQ29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAuLi5jdXJyZW50LFxuICAgIGhhc0lkZU9uYm9hcmRpbmdCZWVuU2hvd246IHtcbiAgICAgIC4uLmN1cnJlbnQuaGFzSWRlT25ib2FyZGluZ0JlZW5TaG93bixcbiAgICAgIFt0ZXJtaW5hbF06IHRydWUsXG4gICAgfSxcbiAgfSkpXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixTQUFTQyxVQUFVLFFBQVEseUJBQXlCO0FBQ3BELFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLFdBQVc7QUFDckMsU0FBU0MsY0FBYyxRQUFRLGlDQUFpQztBQUNoRSxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLG9CQUFvQjtBQUN0RSxTQUFTQyxHQUFHLFFBQVEsaUJBQWlCO0FBQ3JDLFNBQ0VDLGtCQUFrQixFQUNsQixLQUFLQyw4QkFBOEIsRUFDbkNDLGNBQWMsRUFDZEMsZ0JBQWdCLFFBQ1gsaUJBQWlCO0FBQ3hCLFNBQVNDLE1BQU0sUUFBUSwyQkFBMkI7QUFFbEQsVUFBVUMsS0FBSyxDQUFDO0VBQ2RDLE1BQU0sRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUNsQkMsa0JBQWtCLEVBQUVOLDhCQUE4QixHQUFHLElBQUk7QUFDM0Q7QUFFQSxPQUFPLFNBQUFPLG9CQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQTZCO0lBQUFMLE1BQUE7SUFBQUM7RUFBQSxJQUFBRSxFQUc1QjtFQUNORyxpQkFBaUIsQ0FBQyxDQUFDO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFILENBQUEsUUFBQUosTUFBQTtJQUlqQk8sRUFBQTtNQUFBLGVBQ2lCUCxNQUFNO01BQUEsY0FDUEE7SUFDaEIsQ0FBQztJQUFBSSxDQUFBLE1BQUFK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