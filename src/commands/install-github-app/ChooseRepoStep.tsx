// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react';
// 复用 TextInput 终端界面组件，避免在这里重复拼装显示逻辑。
import TextInput from '../../components/TextInput.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// ChooseRepoStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ChooseRepoStepProps {
  currentRepo: string | null;
  useCurrentRepo: boolean;
  repoUrl: string;
  // 这个回调绑定到 onRepoUrlChange: (value: string) => void;，负责命令处理在该局部场景下的响应。
  onRepoUrlChange: (value: string) => void;
  // 这个回调绑定到 onToggleUseCurrentRepo: (useCurrentRepo: boolean) => void;，负责命令处理在该局部场景下的响应。
  onToggleUseCurrentRepo: (useCurrentRepo: boolean) => void;
  // 这个回调绑定到 onSubmit: () => void;，负责命令处理在该局部场景下的响应。
  onSubmit: () => void;
}
// ChooseRepoStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ChooseRepoStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(49);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    currentRepo,
    useCurrentRepo,
    repoUrl,
    onRepoUrlChange,
    onSubmit,
    onToggleUseCurrentRepo
  } = t0;
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(0);
  // showEmptyError 错误信息 由 React state 持有，setShowEmptyError 会在用户操作或异步结果返回时触发刷新。
  const [showEmptyError, setShowEmptyError] = useState(false);
  // terminalSize保存`useTerminalSize`，供命令处理后续处理使用。
  const terminalSize = useTerminalSize();
  // textInputColumns 集合保存`terminalSize.columns`，供后续判断或组装使用。
  const textInputColumns = terminalSize.columns;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== currentRepo || $[1] !== onSubmit || $[2] !== repoUrl || $[3] !== useCurrentRepo) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // repoName读取 hook 状态，供命令处理斜杠命令 Choose Repo Step本轮渲染使用。
      const repoName = useCurrentRepo ? currentRepo : repoUrl;
      // 满足 `!repoName?.trim()` 时，命令处理执行该分支。
      if (!repoName?.trim()) {
        // setShowEmptyError 写入新的状态值，使命令处理后续读取保持一致。
        setShowEmptyError(true);
        // 斜杠命令 Choose Repo Step在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 onSubmit，触发命令处理此处需要的副作用。
      onSubmit();
    };
    // $[0] 缓存 `currentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = currentRepo;
    // $[1] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onSubmit;
    // $[2] 缓存 `repoUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = repoUrl;
    // $[3] 缓存 `useCurrentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = useCurrentRepo;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // handleSubmit沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleSubmit = t1;
  // isTextInputVisible标记命令处理斜杠命令 Choose Repo Step是否启用对应路径。
  const isTextInputVisible = !useCurrentRepo || !currentRepo;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== onToggleUseCurrentRepo) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 onToggleUseCurrentRepo，触发命令处理此处需要的副作用。
      onToggleUseCurrentRepo(true);
      // setShowEmptyError 写入新的状态值，使命令处理后续读取保持一致。
      setShowEmptyError(false);
    };
    // $[5] 缓存 `onToggleUseCurrentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onToggleUseCurrentRepo;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // handlePrevious 集合沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handlePrevious = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== onToggleUseCurrentRepo) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 onToggleUseCurrentRepo，触发命令处理此处需要的副作用。
      onToggleUseCurrentRepo(false);
      // setShowEmptyError 写入新的状态值，使命令处理后续读取保持一致。
      setShowEmptyError(false);
    };
    // $[7] 缓存 `onToggleUseCurrentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onToggleUseCurrentRepo;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // handleNext保存`t3`，作为后续临时缓存值处理的输入。
  const handleNext = t3;
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== handleNext || $[10] !== handlePrevious || $[11] !== handleSubmit) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      "confirm:previous": handlePrevious,
      "confirm:next": handleNext,
      "confirm:yes": handleSubmit
    };
    // $[9] 缓存 `handleNext`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = handleNext;
    // $[10] 缓存 `handlePrevious`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = handlePrevious;
    // $[11] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = handleSubmit;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[12];
  }
  // t5标记命令处理斜杠命令 Choose Repo Step是否启用对应路径。
  const t5 = !isTextInputVisible;
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t5) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      context: "Confirmation",
      isActive: t5
    };
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
    // $[14] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[14];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings(t4, t6);
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== handleNext || $[16] !== handlePrevious) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      "confirm:previous": handlePrevious,
      "confirm:next": handleNext
    };
    // $[15] 缓存 `handleNext`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = handleNext;
    // $[16] 缓存 `handlePrevious`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = handlePrevious;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[17];
  }
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== isTextInputVisible) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      context: "Confirmation",
      isActive: isTextInputVisible
    };
    // $[18] 缓存 `isTextInputVisible`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = isTextInputVisible;
    // $[19] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[19];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings(t7, t8);
  // t9 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexDirection="column" marginBottom={1}><Text bold={true}>Install GitHub App</Text><Text dimColor={true}>Select GitHub repository</Text></Box>;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // t10 暂存 `currentRepo && <Box marginBottom={1}><Text bold={useCurre...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== currentRepo || $[22] !== useCurrentRepo) {
    // t10 暂存 `currentRepo && <Box marginBottom={1}><Text bold={useCurre...` 生成的渲染片段，后续返回路径直接复用。
    t10 = currentRepo && <Box marginBottom={1}><Text bold={useCurrentRepo} color={useCurrentRepo ? "permission" : undefined}>{useCurrentRepo ? "> " : "  "}Use current repository: {currentRepo}</Text></Box>;
    // $[21] 缓存 `currentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = currentRepo;
    // $[22] 缓存 `useCurrentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = useCurrentRepo;
    // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[23];
  }
  // t11标记命令处理斜杠命令 Choose Repo Step是否启用对应路径。
  const t11 = !useCurrentRepo || !currentRepo;
  // t12标记命令处理斜杠命令 Choose Repo Step是否启用对应路径。
  const t12 = !useCurrentRepo || !currentRepo ? "permission" : undefined;
  // t13标记命令处理斜杠命令 Choose Repo Step是否启用对应路径。
  const t13 = !useCurrentRepo || !currentRepo ? "> " : "  ";
  // t14保存`currentRepo ? "Enter a different repository" : "Enter rep...`，供后续判断或组装使用。
  const t14 = currentRepo ? "Enter a different repository" : "Enter repository";
  // t15 暂存 `<Box marginBottom={1}><Text bold={t11} color={t12}>{t13}{...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== t11 || $[25] !== t12 || $[26] !== t13 || $[27] !== t14) {
    // t15 暂存 `<Box marginBottom={1}><Text bold={t11} color={t12}>{t13}{...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Box marginBottom={1}><Text bold={t11} color={t12}>{t13}{t14}</Text></Box>;
    // $[24] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t11;
    // $[25] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t12;
    // $[26] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t13;
    // $[27] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t14;
    // $[28] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[28];
  }
  // t16 暂存 `(!useCurrentRepo || !currentRepo) && <Box marginLeft={2} ...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== currentRepo || $[30] !== cursorOffset || $[31] !== handleSubmit || $[32] !== onRepoUrlChange || $[33] !== repoUrl || $[34] !== textInputColumns || $[35] !== useCurrentRepo) {
    // t16 暂存 `(!useCurrentRepo || !currentRepo) && <Box marginLeft={2} ...` 生成的渲染片段，后续返回路径直接复用。
    t16 = (!useCurrentRepo || !currentRepo) && <Box marginLeft={2} marginBottom={1}><TextInput value={repoUrl} onChange={value => {
        // 调用 onRepoUrlChange，触发命令处理此处需要的副作用。
        onRepoUrlChange(value);
        // setShowEmptyError 写入新的状态值，使命令处理后续读取保持一致。
        setShowEmptyError(false);
      }} onSubmit={handleSubmit} focus={true} placeholder={"Enter a repo as owner/repo or https://github.com/owner/repo\u2026"} columns={textInputColumns} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} showCursor={true} /></Box>;
    // $[29] 缓存 `currentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = currentRepo;
    // $[30] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = cursorOffset;
    // $[31] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = handleSubmit;
    // $[32] 缓存 `onRepoUrlChange`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = onRepoUrlChange;
    // $[33] 缓存 `repoUrl`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = repoUrl;
    // $[34] 缓存 `textInputColumns`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = textInputColumns;
    // $[35] 缓存 `useCurrentRepo`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = useCurrentRepo;
    // $[36] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[36];
  }
  // t17 暂存 `<Box flexDirection="column" borderStyle="round" paddingX=...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[37] !== t10 || $[38] !== t15 || $[39] !== t16) {
    // t17 暂存 `<Box flexDirection="column" borderStyle="round" paddingX=...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Box flexDirection="column" borderStyle="round" paddingX={1}>{t9}{t10}{t15}{t16}</Box>;
    // $[37] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t10;
    // $[38] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t15;
    // $[39] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t16;
    // $[40] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[40];
  }
  // t18 暂存 `showEmptyError && <Box marginLeft={3} marginBottom={1}><T...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[41] !== showEmptyError) {
    // t18 暂存 `showEmptyError && <Box marginLeft={3} marginBottom={1}><T...` 生成的渲染片段，后续返回路径直接复用。
    t18 = showEmptyError && <Box marginLeft={3} marginBottom={1}><Text color="error">Please enter a repository name to continue</Text></Box>;
    // $[41] 缓存 `showEmptyError`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = showEmptyError;
    // $[42] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[42];
  }
  // t19保存`currentRepo ? "\u2191/\u2193 to select \xB7 " : ""`，供后续判断或组装使用。
  const t19 = currentRepo ? "\u2191/\u2193 to select \xB7 " : "";
  // t20 暂存 `<Box marginLeft={3}><Text dimColor={true}>{t19}Enter to c...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[43] !== t19) {
    // t20 暂存 `<Box marginLeft={3}><Text dimColor={true}>{t19}Enter to c...` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Box marginLeft={3}><Text dimColor={true}>{t19}Enter to continue</Text></Box>;
    // $[43] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t19;
    // $[44] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[44];
  }
  // t21 暂存 `<>{t17}{t18}{t20}</>` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== t17 || $[46] !== t18 || $[47] !== t20) {
    // t21 暂存 `<>{t17}{t18}{t20}</>` 生成的渲染片段，后续返回路径直接复用。
    t21 = <>{t17}{t18}{t20}</>;
    // $[45] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t17;
    // $[46] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t18;
    // $[47] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t20;
    // $[48] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[48];
  }
  // 返回 `t21`，作为命令处理这次计算的结果。
  return t21;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJUZXh0SW5wdXQiLCJ1c2VUZXJtaW5hbFNpemUiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZ3MiLCJDaG9vc2VSZXBvU3RlcFByb3BzIiwiY3VycmVudFJlcG8iLCJ1c2VDdXJyZW50UmVwbyIsInJlcG9VcmwiLCJvblJlcG9VcmxDaGFuZ2UiLCJ2YWx1ZSIsIm9uVG9nZ2xlVXNlQ3VycmVudFJlcG8iLCJvblN1Ym1pdCIsIkNob29zZVJlcG9TdGVwIiwidDAiLCIkIiwiX2MiLCJjdXJzb3JPZmZzZXQiLCJzZXRDdXJzb3JPZmZzZXQiLCJzaG93RW1wdHlFcnJvciIsInNldFNob3dFbXB0eUVycm9yIiwidGVybWluYWxTaXplIiwidGV4dElucHV0Q29sdW1ucyIsImNvbHVtbnMiLCJ0MSIsInJlcG9OYW1lIiwidHJpbSIsImhhbmRsZVN1Ym1pdCIsImlzVGV4dElucHV0VmlzaWJsZSIsInQyIiwiaGFuZGxlUHJldmlvdXMiLCJ0MyIsImhhbmRsZU5leHQiLCJ0NCIsInQ1IiwidDYiLCJjb250ZXh0IiwiaXNBY3RpdmUiLCJ0NyIsInQ4IiwidDkiLCJTeW1ib2wiLCJmb3IiLCJ0MTAiLCJ1bmRlZmluZWQiLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJ0MTciLCJ0MTgiLCJ0MTkiLCJ0MjAiLCJ0MjEiXSwic291cmNlcyI6WyJDaG9vc2VSZXBvU3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFRleHRJbnB1dCBmcm9tICcuLi8uLi9jb21wb25lbnRzL1RleHRJbnB1dC5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcblxuaW50ZXJmYWNlIENob29zZVJlcG9TdGVwUHJvcHMge1xuICBjdXJyZW50UmVwbzogc3RyaW5nIHwgbnVsbFxuICB1c2VDdXJyZW50UmVwbzogYm9vbGVhblxuICByZXBvVXJsOiBzdHJpbmdcbiAgb25SZXBvVXJsQ2hhbmdlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICBvblRvZ2dsZVVzZUN1cnJlbnRSZXBvOiAodXNlQ3VycmVudFJlcG86IGJvb2xlYW4pID0+IHZvaWRcbiAgb25TdWJtaXQ6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIENob29zZVJlcG9TdGVwKHtcbiAgY3VycmVudFJlcG8sXG4gIHVzZUN1cnJlbnRSZXBvLFxuICByZXBvVXJsLFxuICBvblJlcG9VcmxDaGFuZ2UsXG4gIG9uU3VibWl0LFxuICBvblRvZ2dsZVVzZUN1cnJlbnRSZXBvLFxufTogQ2hvb3NlUmVwb1N0ZXBQcm9wcykge1xuICBjb25zdCBbY3Vyc29yT2Zmc2V0LCBzZXRDdXJzb3JPZmZzZXRdID0gdXNlU3RhdGUoMClcbiAgY29uc3QgW3Nob3dFbXB0eUVycm9yLCBzZXRTaG93RW1wdHlFcnJvcl0gPSB1c2VTdGF0ZShmYWxzZSlcbiAgY29uc3QgdGVybWluYWxTaXplID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgdGV4dElucHV0Q29sdW1ucyA9IHRlcm1pbmFsU2l6ZS5jb2x1bW5zXG5cbiAgY29uc3QgaGFuZGxlU3VibWl0ID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGNvbnN0IHJlcG9OYW1lID0gdXNlQ3VycmVudFJlcG8gPyBjdXJyZW50UmVwbyA6IHJlcG9VcmxcbiAgICBpZiAoIXJlcG9OYW1lPy50cmltKCkpIHtcbiAgICAgIHNldFNob3dFbXB0eUVycm9yKHRydWUpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgb25TdWJtaXQoKVxuICB9LCBbdXNlQ3VycmVudFJlcG8sIGN1cnJlbnRSZXBvLCByZXBvVXJsLCBvblN1Ym1pdF0pXG5cbiAgLy8gV2hlbiB0aGUgdGV4dCBpbnB1dCBpcyB2aXNpYmxlLCBvbWl0IGNvbmZpcm06eWVzIHNvIGJhcmUgJ3knIHBhc3Nlc1xuICAvLyB0aHJvdWdoIHRvIHRoZSBpbnB1dCBpbnN0ZWFkIG9mIHN1Ym1pdHRpbmcuIFRleHRJbnB1dCdzIG9uU3VibWl0IGhhbmRsZXNcbiAgLy8gRW50ZXIuIEtlZXAgdGhlIENvbmZpcm1hdGlvbiBjb250ZXh0IChub3QgU2V0dGluZ3MpIHRvIGF2b2lkIGovayBiaW5kaW5ncy5cbiAgY29uc3QgaXNUZXh0SW5wdXRWaXNpYmxlID0gIXVzZUN1cnJlbnRSZXBvIHx8ICFjdXJyZW50UmVwb1xuICBjb25zdCBoYW5kbGVQcmV2aW91cyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvblRvZ2dsZVVzZUN1cnJlbnRSZXBvKHRydWUpXG4gICAgc2V0U2hvd0VtcHR5RXJyb3IoZmFsc2UpXG4gIH0sIFtvblRvZ2dsZVVzZUN1cnJlbnRSZXBvXSlcbiAgY29uc3QgaGFuZGxlTmV4dCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvblRvZ2dsZVVzZUN1cnJlbnRSZXBvKGZhbHNlKVxuICAgIHNldFNob3dFbXB0eUVycm9yKGZhbHNlKVxuICB9LCBbb25Ub2dnbGVVc2VDdXJyZW50UmVwb10pXG5cbiAgdXNlS2V5YmluZGluZ3MoXG4gICAge1xuICAgICAgJ2NvbmZpcm06cHJldmlvdXMnOiBoYW5kbGVQcmV2aW91cyxcbiAgICAgICdjb25maXJtOm5leHQnOiBoYW5kbGVOZXh0LFxuICAgICAgJ2NvbmZpcm06eWVzJzogaGFuZGxlU3VibWl0LFxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJywgaXNBY3RpdmU6ICFpc1RleHRJbnB1dFZpc2libGUgfSxcbiAgKVxuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnY29uZmlybTpwcmV2aW91cyc6IGhhbmRsZVByZXZpb3VzLFxuICAgICAgJ2NvbmZpcm06bmV4dCc6IGhhbmRsZU5leHQsXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nLCBpc0FjdGl2ZTogaXNUZXh0SW5wdXRWaXNpYmxlIH0sXG4gIClcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBib3JkZXJTdHlsZT1cInJvdW5kXCIgcGFkZGluZ1g9ezF9PlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+SW5zdGFsbCBHaXRIdWIgQXBwPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlNlbGVjdCBHaXRIdWIgcmVwb3NpdG9yeTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtjdXJyZW50UmVwbyAmJiAoXG4gICAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgYm9sZD17dXNlQ3VycmVudFJlcG99XG4gICAgICAgICAgICAgIGNvbG9yPXt1c2VDdXJyZW50UmVwbyA/ICdwZXJtaXNzaW9uJyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3VzZUN1cnJlbnRSZXBvID8gJz4gJyA6ICcgICd9XG4gICAgICAgICAgICAgIFVzZSBjdXJyZW50IHJlcG9zaXRvcnk6IHtjdXJyZW50UmVwb31cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgKX1cbiAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICBib2xkPXshdXNlQ3VycmVudFJlcG8gfHwgIWN1cnJlbnRSZXBvfVxuICAgICAgICAgICAgY29sb3I9eyF1c2VDdXJyZW50UmVwbyB8fCAhY3VycmVudFJlcG8gPyAncGVybWlzc2lvbicgOiB1bmRlZmluZWR9XG4gICAgICAgICAgPlxuICAgICAgICAgICAgeyF1c2VDdXJyZW50UmVwbyB8fCAhY3VycmVudFJlcG8gPyAnPiAnIDogJyAgJ31cbiAgICAgICAgICAgIHtjdXJyZW50UmVwbyA/ICdFbnRlciBhIGRpZmZlcmVudCByZXBvc2l0b3J5JyA6ICdFbnRlciByZXBvc2l0b3J5J31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7KCF1c2VDdXJyZW50UmVwbyB8fCAhY3VycmVudFJlcG8pICYmIChcbiAgICAgICAgICA8Qm94IG1hcmdpbkxlZnQ9ezJ9IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgICA8VGV4dElucHV0XG4gICAgICAgICAgICAgIHZhbHVlPXtyZXBvVXJsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17dmFsdWUgPT4ge1xuICAgICAgICAgICAgICAgIG9uUmVwb1VybENoYW5nZSh2YWx1ZSlcbiAgICAgICAgICAgICAgICBzZXRTaG93RW1wdHlFcnJvcihmYWxzZSlcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgb25TdWJtaXQ9e2hhbmRsZVN1Ym1pdH1cbiAgICAgICAgICAgICAgZm9jdXM9e3RydWV9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiRW50ZXIgYSByZXBvIGFzIG93bmVyL3JlcG8gb3IgaHR0cHM6Ly9naXRodWIuY29tL293bmVyL3JlcG/igKZcIlxuICAgICAgICAgICAgICBjb2x1bW5zPXt0ZXh0SW5wdXRDb2x1bW5zfVxuICAgICAgICAgICAgICBjdXJzb3JPZmZzZXQ9e2N1cnNvck9mZnNldH1cbiAgICAgICAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9e3NldEN1cnNvck9mZnNldH1cbiAgICAgICAgICAgICAgc2hvd0N1cnNvcj17dHJ1ZX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICAgIHtzaG93RW1wdHlFcnJvciAmJiAoXG4gICAgICAgIDxCb3ggbWFyZ2luTGVmdD17M30gbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+UGxlYXNlIGVudGVyIGEgcmVwb3NpdG9yeSBuYW1lIHRvIGNvbnRpbnVlPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG4gICAgICA8Qm94IG1hcmdpbkxlZnQ9ezN9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICB7Y3VycmVudFJlcG8gPyAn4oaRL+KGkyB0byBzZWxlY3QgwrcgJyA6ICcnfUVudGVyIHRvIGNvbnRpbnVlXG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIDwvPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLElBQUlDLFdBQVcsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDcEQsT0FBT0MsU0FBUyxNQUFNLCtCQUErQjtBQUNyRCxTQUFTQyxlQUFlLFFBQVEsZ0NBQWdDO0FBQ2hFLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxRQUFRLGNBQWM7QUFDeEMsU0FBU0MsY0FBYyxRQUFRLG9DQUFvQztBQUVuRSxVQUFVQyxtQkFBbUIsQ0FBQztFQUM1QkMsV0FBVyxFQUFFLE1BQU0sR0FBRyxJQUFJO0VBQzFCQyxjQUFjLEVBQUUsT0FBTztFQUN2QkMsT0FBTyxFQUFFLE1BQU07RUFDZkMsZUFBZSxFQUFFLENBQUNDLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQ3hDQyxzQkFBc0IsRUFBRSxDQUFDSixjQUFjLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSTtFQUN6REssUUFBUSxFQUFFLEdBQUcsR0FBRyxJQUFJO0FBQ3RCO0FBRUEsT0FBTyxTQUFBQyxlQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQXdCO0lBQUFWLFdBQUE7SUFBQUMsY0FBQTtJQUFBQyxPQUFBO0lBQUFD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