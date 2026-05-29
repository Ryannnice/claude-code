// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useState } from 'react';
// 复用 TextInput 终端界面组件，避免在这里重复拼装显示逻辑。
import TextInput from '../../components/TextInput.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 引入 Box、color、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, color, Text, useTheme } from '../../ink.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// ApiKeyStepProps 描述命令处理需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ApiKeyStepProps {
  existingApiKey: string | null;
  useExistingKey: boolean;
  apiKeyOrOAuthToken: string;
  // 这个回调绑定到 onApiKeyChange: (value: string) => void;，负责命令处理在该局部场景下的响应。
  onApiKeyChange: (value: string) => void;
  // 这个回调绑定到 onToggleUseExistingKey: (useExisting: boolean) => void;，负责命令处理在该局部场景下的响应。
  onToggleUseExistingKey: (useExisting: boolean) => void;
  // 这个回调绑定到 onSubmit: () => void;，负责命令处理在该局部场景下的响应。
  onSubmit: () => void;
  onCreateOAuthToken?: () => void;
  selectedOption?: 'existing' | 'new' | 'oauth';
  onSelectOption?: (option: 'existing' | 'new' | 'oauth') => void;
}
// ApiKeyStep 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ApiKeyStep(t0) {
  // $保存`_c`，供命令处理后续处理使用。
  const $ = _c(55);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    existingApiKey,
    apiKeyOrOAuthToken,
    onApiKeyChange,
    onSubmit,
    onToggleUseExistingKey,
    onCreateOAuthToken,
    selectedOption: t1,
    onSelectOption
  } = t0;
  // selectedOption标记命令处理斜杠命令 Api Key Step是否启用对应路径。
  const selectedOption = t1 === undefined ? existingApiKey ? "existing" : onCreateOAuthToken ? "oauth" : "new" : t1;
  // 光标偏移 由 React state 持有，setCursorOffset 会在用户操作或异步结果返回时触发刷新。
  const [cursorOffset, setCursorOffset] = useState(0);
  // terminalSize保存`useTerminalSize`，供命令处理后续处理使用。
  const terminalSize = useTerminalSize();
  // 从 `useTheme()` 按位置拆出 theme，让斜杠命令 Api Key Step分别处理这些返回值。
  const [theme] = useTheme();
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== existingApiKey || $[1] !== onCreateOAuthToken || $[2] !== onSelectOption || $[3] !== onToggleUseExistingKey || $[4] !== selectedOption) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 只有 `selectedOption === "new" && onCreateOAuthToken` 满足时，命令处理才执行该分支。
      if (selectedOption === "new" && onCreateOAuthToken) {
        // 调用 onSelectOption?.("oauth");，完成这一处局部操作。
        onSelectOption?.("oauth");
      } else {
        // 只有 `selectedOption === "oauth" && existingApiKey` 满足时，命令处理才执行该分支。
        if (selectedOption === "oauth" && existingApiKey) {
          // 调用 onSelectOption?.("existing");，完成这一处局部操作。
          onSelectOption?.("existing");
          // 调用 onToggleUseExistingKey，触发命令处理此处需要的副作用。
          onToggleUseExistingKey(true);
        }
      }
    };
    // $[0] 缓存 `existingApiKey`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = existingApiKey;
    // $[1] 缓存 `onCreateOAuthToken`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onCreateOAuthToken;
    // $[2] 缓存 `onSelectOption`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onSelectOption;
    // $[3] 缓存 `onToggleUseExistingKey`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onToggleUseExistingKey;
    // $[4] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = selectedOption;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // handlePrevious 集合保存`t2`，作为后续临时缓存值处理的输入。
  const handlePrevious = t2;
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== onCreateOAuthToken || $[7] !== onSelectOption || $[8] !== onToggleUseExistingKey || $[9] !== selectedOption) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 当 `selectedOption` 匹配 `"existing"` 时，命令处理执行对应分支。
      if (selectedOption === "existing") {
        // 调用 onSelectOption?.(onCreateOAuthToken ? "oauth" : "new");，完成这一处局部操作。
        onSelectOption?.(onCreateOAuthToken ? "oauth" : "new");
        // 调用 onToggleUseExistingKey，触发命令处理此处需要的副作用。
        onToggleUseExistingKey(false);
      } else {
        // 当 `selectedOption` 匹配 `"oauth"` 时，命令处理执行对应分支。
        if (selectedOption === "oauth") {
          // 调用 onSelectOption?.("new");，完成这一处局部操作。
          onSelectOption?.("new");
        }
      }
    };
    // $[6] 缓存 `onCreateOAuthToken`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onCreateOAuthToken;
    // $[7] 缓存 `onSelectOption`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onSelectOption;
    // $[8] 缓存 `onToggleUseExistingKey`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = onToggleUseExistingKey;
    // $[9] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = selectedOption;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[10];
  }
  // handleNext 命名 `t3`，让后续代码直接表达这个值的用途。
  const handleNext = t3;
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onCreateOAuthToken || $[12] !== onSubmit || $[13] !== selectedOption) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 只有 `selectedOption === "oauth" && onCreateOAuthToken` 满足时，命令处理才执行该分支。
      if (selectedOption === "oauth" && onCreateOAuthToken) {
        // 调用 onCreateOAuthToken，触发命令处理此处需要的副作用。
        onCreateOAuthToken();
      } else {
        // 调用 onSubmit，触发命令处理此处需要的副作用。
        onSubmit();
      }
    };
    // $[11] 缓存 `onCreateOAuthToken`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onCreateOAuthToken;
    // $[12] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onSubmit;
    // $[13] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = selectedOption;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[14];
  }
  // handleConfirm沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleConfirm = t4;
  // isTextInputVisible标记命令处理斜杠命令 Api Key Step是否启用对应路径。
  const isTextInputVisible = selectedOption === "new";
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== handleConfirm || $[16] !== handleNext || $[17] !== handlePrevious) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      "confirm:previous": handlePrevious,
      "confirm:next": handleNext,
      "confirm:yes": handleConfirm
    };
    // $[15] 缓存 `handleConfirm`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = handleConfirm;
    // $[16] 缓存 `handleNext`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = handleNext;
    // $[17] 缓存 `handlePrevious`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = handlePrevious;
    // $[18] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[18];
  }
  // t6标记命令处理斜杠命令 Api Key Step是否启用对应路径。
  const t6 = !isTextInputVisible;
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t6) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      context: "Confirmation",
      isActive: t6
    };
    // $[19] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t6;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings(t5, t7);
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== handleNext || $[22] !== handlePrevious) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      "confirm:previous": handlePrevious,
      "confirm:next": handleNext
    };
    // $[21] 缓存 `handleNext`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = handleNext;
    // $[22] 缓存 `handlePrevious`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = handlePrevious;
    // $[23] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[23];
  }
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== isTextInputVisible) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Confirmation",
      isActive: isTextInputVisible
    };
    // $[24] 缓存 `isTextInputVisible`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = isTextInputVisible;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[25];
  }
  // 调用 useKeybindings，触发命令处理此处需要的副作用。
  useKeybindings(t8, t9);
  // t10 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Box flexDirection="column" marginBottom={1}><Text bold={...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box flexDirection="column" marginBottom={1}><Text bold={true}>Install GitHub App</Text><Text dimColor={true}>Choose API key</Text></Box>;
    // $[26] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[26];
  }
  // t11 暂存 `existingApiKey && <Box marginBottom={1}><Text>{selectedOp...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== existingApiKey || $[28] !== selectedOption || $[29] !== theme) {
    // t11 暂存 `existingApiKey && <Box marginBottom={1}><Text>{selectedOp...` 生成的渲染片段，后续返回路径直接复用。
    t11 = existingApiKey && <Box marginBottom={1}><Text>{selectedOption === "existing" ? color("success", theme)("> ") : "  "}Use your existing Claude Code API key</Text></Box>;
    // $[27] 缓存 `existingApiKey`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = existingApiKey;
    // $[28] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = selectedOption;
    // $[29] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = theme;
    // $[30] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[30];
  }
  // t12 暂存 `onCreateOAuthToken && <Box marginBottom={1}><Text>{select...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== onCreateOAuthToken || $[32] !== selectedOption || $[33] !== theme) {
    // t12 暂存 `onCreateOAuthToken && <Box marginBottom={1}><Text>{select...` 生成的渲染片段，后续返回路径直接复用。
    t12 = onCreateOAuthToken && <Box marginBottom={1}><Text>{selectedOption === "oauth" ? color("success", theme)("> ") : "  "}Create a long-lived token with your Claude subscription</Text></Box>;
    // $[31] 缓存 `onCreateOAuthToken`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = onCreateOAuthToken;
    // $[32] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = selectedOption;
    // $[33] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = theme;
    // $[34] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[34];
  }
  // t13 暂存 `selectedOption === "new" ? color("success", theme)("> ") ...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== selectedOption || $[36] !== theme) {
    // t13 暂存 `selectedOption === "new" ? color("success", theme)("> ") ...` 生成的渲染片段，后续返回路径直接复用。
    t13 = selectedOption === "new" ? color("success", theme)("> ") : "  ";
    // $[35] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = selectedOption;
    // $[36] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = theme;
    // $[37] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[37];
  }
  // t14 暂存 `<Box marginBottom={1}><Text>{t13}Enter a new API key</Tex...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== t13) {
    // t14 暂存 `<Box marginBottom={1}><Text>{t13}Enter a new API key</Tex...` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Box marginBottom={1}><Text>{t13}Enter a new API key</Text></Box>;
    // $[38] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t13;
    // $[39] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[39];
  }
  // t15 暂存 `selectedOption === "new" && <TextInput value={apiKeyOrOAu...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[40] !== apiKeyOrOAuthToken || $[41] !== cursorOffset || $[42] !== onApiKeyChange || $[43] !== onSubmit || $[44] !== selectedOption || $[45] !== terminalSize) {
    // t15 暂存 `selectedOption === "new" && <TextInput value={apiKeyOrOAu...` 生成的渲染片段，后续返回路径直接复用。
    t15 = selectedOption === "new" && <TextInput value={apiKeyOrOAuthToken} onChange={onApiKeyChange} onSubmit={onSubmit} onPaste={onApiKeyChange} focus={true} placeholder={"sk-ant\u2026 (Create a new key at https://platform.claude.com/settings/keys)"} mask="*" columns={terminalSize.columns} cursorOffset={cursorOffset} onChangeCursorOffset={setCursorOffset} showCursor={true} />;
    // $[40] 缓存 `apiKeyOrOAuthToken`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = apiKeyOrOAuthToken;
    // $[41] 缓存 `cursorOffset`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = cursorOffset;
    // $[42] 缓存 `onApiKeyChange`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = onApiKeyChange;
    // $[43] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = onSubmit;
    // $[44] 缓存 `selectedOption`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = selectedOption;
    // $[45] 缓存 `terminalSize`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = terminalSize;
    // $[46] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[46];
  }
  // t16 暂存 `<Box flexDirection="column" borderStyle="round" paddingX=...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[47] !== t11 || $[48] !== t12 || $[49] !== t14 || $[50] !== t15) {
    // t16 暂存 `<Box flexDirection="column" borderStyle="round" paddingX=...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Box flexDirection="column" borderStyle="round" paddingX={1}>{t10}{t11}{t12}{t14}{t15}</Box>;
    // $[47] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t11;
    // $[48] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t12;
    // $[49] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t14;
    // $[50] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t15;
    // $[51] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[51];
  }
  // t17 暂存 `<Box marginLeft={3}><Text dimColor={true}>↑/↓ to select ·...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[52] === Symbol.for("react.memo_cache_sentinel")) {
    // t17 暂存 `<Box marginLeft={3}><Text dimColor={true}>↑/↓ to select ·...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Box marginLeft={3}><Text dimColor={true}>↑/↓ to select · Enter to continue</Text></Box>;
    // $[52] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[52];
  }
  // t18 暂存 `<>{t16}{t17}</>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[53] !== t16) {
    // t18 暂存 `<>{t16}{t17}</>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <>{t16}{t17}</>;
    // $[53] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t16;
    // $[54] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[54] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[54];
  }
  // 返回 `t18`，作为命令处理这次计算的结果。
  return t18;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJUZXh0SW5wdXQiLCJ1c2VUZXJtaW5hbFNpemUiLCJCb3giLCJjb2xvciIsIlRleHQiLCJ1c2VUaGVtZSIsInVzZUtleWJpbmRpbmdzIiwiQXBpS2V5U3RlcFByb3BzIiwiZXhpc3RpbmdBcGlLZXkiLCJ1c2VFeGlzdGluZ0tleSIsImFwaUtleU9yT0F1dGhUb2tlbiIsIm9uQXBpS2V5Q2hhbmdlIiwidmFsdWUiLCJvblRvZ2dsZVVzZUV4aXN0aW5nS2V5IiwidXNlRXhpc3RpbmciLCJvblN1Ym1pdCIsIm9uQ3JlYXRlT0F1dGhUb2tlbiIsInNlbGVjdGVkT3B0aW9uIiwib25TZWxlY3RPcHRpb24iLCJvcHRpb24iLCJBcGlLZXlTdGVwIiwidDAiLCIkIiwiX2MiLCJ0MSIsInVuZGVmaW5lZCIsImN1cnNvck9mZnNldCIsInNldEN1cnNvck9mZnNldCIsInRlcm1pbmFsU2l6ZSIsInRoZW1lIiwidDIiLCJoYW5kbGVQcmV2aW91cyIsInQzIiwiaGFuZGxlTmV4dCIsInQ0IiwiaGFuZGxlQ29uZmlybSIsImlzVGV4dElucHV0VmlzaWJsZSIsInQ1IiwidDYiLCJ0NyIsImNvbnRleHQiLCJpc0FjdGl2ZSIsInQ4IiwidDkiLCJ0MTAiLCJTeW1ib2wiLCJmb3IiLCJ0MTEiLCJ0MTIiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJjb2x1bW5zIiwidDE2IiwidDE3IiwidDE4Il0sInNvdXJjZXMiOlsiQXBpS2V5U3RlcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFRleHRJbnB1dCBmcm9tICcuLi8uLi9jb21wb25lbnRzL1RleHRJbnB1dC5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCB7IEJveCwgY29sb3IsIFRleHQsIHVzZVRoZW1lIH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuXG5pbnRlcmZhY2UgQXBpS2V5U3RlcFByb3BzIHtcbiAgZXhpc3RpbmdBcGlLZXk6IHN0cmluZyB8IG51bGxcbiAgdXNlRXhpc3RpbmdLZXk6IGJvb2xlYW5cbiAgYXBpS2V5T3JPQXV0aFRva2VuOiBzdHJpbmdcbiAgb25BcGlLZXlDaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gIG9uVG9nZ2xlVXNlRXhpc3RpbmdLZXk6ICh1c2VFeGlzdGluZzogYm9vbGVhbikgPT4gdm9pZFxuICBvblN1Ym1pdDogKCkgPT4gdm9pZFxuICBvbkNyZWF0ZU9BdXRoVG9rZW4/OiAoKSA9PiB2b2lkXG4gIHNlbGVjdGVkT3B0aW9uPzogJ2V4aXN0aW5nJyB8ICduZXcnIHwgJ29hdXRoJ1xuICBvblNlbGVjdE9wdGlvbj86IChvcHRpb246ICdleGlzdGluZycgfCAnbmV3JyB8ICdvYXV0aCcpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFwaUtleVN0ZXAoe1xuICBleGlzdGluZ0FwaUtleSxcbiAgYXBpS2V5T3JPQXV0aFRva2VuLFxuICBvbkFwaUtleUNoYW5nZSxcbiAgb25TdWJtaXQsXG4gIG9uVG9nZ2xlVXNlRXhpc3RpbmdLZXksXG4gIG9uQ3JlYXRlT0F1dGhUb2tlbixcbiAgc2VsZWN0ZWRPcHRpb24gPSBleGlzdGluZ0FwaUtleVxuICAgID8gJ2V4aXN0aW5nJ1xuICAgIDogb25DcmVhdGVPQXV0aFRva2VuXG4gICAgICA/ICdvYXV0aCdcbiAgICAgIDogJ25ldycsXG4gIG9uU2VsZWN0T3B0aW9uLFxufTogQXBpS2V5U3RlcFByb3BzKSB7XG4gIGNvbnN0IFtjdXJzb3JPZmZzZXQsIHNldEN1cnNvck9mZnNldF0gPSB1c2VTdGF0ZSgwKVxuICBjb25zdCB0ZXJtaW5hbFNpemUgPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCBbdGhlbWVdID0gdXNlVGhlbWUoKVxuXG4gIGNvbnN0IGhhbmRsZVByZXZpb3VzID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChzZWxlY3RlZE9wdGlvbiA9PT0gJ25ldycgJiYgb25DcmVhdGVPQXV0aFRva2VuKSB7XG4gICAgICAvLyBGcm9tICduZXcnIGdvIHVwIHRvICdvYXV0aCdcbiAgICAgIG9uU2VsZWN0T3B0aW9uPy4oJ29hdXRoJylcbiAgICB9IGVsc2UgaWYgKHNlbGVjdGVkT3B0aW9uID09PSAnb2F1dGgnICYmIGV4aXN0aW5nQXBpS2V5KSB7XG4gICAgICAvLyBGcm9tICdvYXV0aCcgZ28gdXAgdG8gJ2V4aXN0aW5nJyAob25seSBpZiBpdCBleGlzdHMpXG4gICAgICBvblNlbGVjdE9wdGlvbj8uKCdleGlzdGluZycpXG4gICAgICBvblRvZ2dsZVVzZUV4aXN0aW5nS2V5KHRydWUpXG4gICAgfVxuICB9LCBbXG4gICAgc2VsZWN0ZWRPcHRpb24sXG4gICAgb25DcmVhdGVPQXV0aFRva2VuLFxuICAgIGV4aXN0aW5nQXBpS2V5LFxuICAgIG9uU2VsZWN0T3B0aW9uLFxuICAgIG9uVG9nZ2xlVXNlRXhpc3RpbmdLZXksXG4gIF0pXG5cbiAgY29uc3QgaGFuZGxlTmV4dCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoc2VsZWN0ZWRPcHRpb24gPT09ICdleGlzdGluZycpIHtcbiAgICAgIC8vIEZyb20gJ2V4aXN0aW5nJyBnbyBkb3duIHRvICdvYXV0aCcgKGlmIGF2YWlsYWJsZSkgb3IgJ25ldydcbiAgICAgIG9uU2VsZWN0T3B0aW9uPy4ob25DcmVhdGVPQXV0aFRva2VuID8gJ29hdXRoJyA6ICduZXcnKVxuICAgICAgb25Ub2dnbGVVc2VFeGlzdGluZ0tleShmYWxzZSlcbiAgICB9IGVsc2UgaWYgKHNlbGVjdGVkT3B0aW9uID09PSAnb2F1dGgnKSB7XG4gICAgICAvLyBGcm9tICdvYXV0aCcgZ28gZG93biB0byAnbmV3J1xuICAgICAgb25TZWxlY3RPcHRpb24/LignbmV3JylcbiAgICB9XG4gIH0sIFtcbiAgICBzZWxlY3RlZE9wdGlvbixcbiAgICBvbkNyZWF0ZU9BdXRoVG9rZW4sXG4gICAgb25TZWxlY3RPcHRpb24sXG4gICAgb25Ub2dnbGVVc2VFeGlzdGluZ0tleSxcbiAgXSlcblxuICBjb25zdCBoYW5kbGVDb25maXJtID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChzZWxlY3RlZE9wdGlvbiA9PT0gJ29hdXRoJyAmJiBvbkNyZWF0ZU9BdXRoVG9rZW4pIHtcbiAgICAgIG9uQ3JlYXRlT0F1dGhUb2tlbigpXG4gICAgfSBlbHNlIHtcbiAgICAgIG9uU3VibWl0KClcbiAgICB9XG4gIH0sIFtzZWxlY3RlZE9wdGlvbiwgb25DcmVhdGVPQXV0aFRva2VuLCBvblN1Ym1pdF0pXG5cbiAgLy8gV2hlbiB0aGUgdGV4dCBpbnB1dCBpcyB2aXNpYmxlLCBvbWl0IGNvbmZpcm06eWVzIHNvIGJhcmUgJ3knIHBhc3Nlc1xuICAvLyB0aHJvdWdoIHRvIHRoZSBpbnB1dCBpbnN0ZWFkIG9mIHN1Ym1pdHRpbmcuIFRleHRJbnB1dCdzIG9uU3VibWl0IGhhbmRsZXNcbiAgLy8gRW50ZXIuIEtlZXAgdGhlIENvbmZpcm1hdGlvbiBjb250ZXh0IChub3QgU2V0dGluZ3MpIHRvIGF2b2lkIGovayBiaW5kaW5ncy5cbiAgY29uc3QgaXNUZXh0SW5wdXRWaXNpYmxlID0gc2VsZWN0ZWRPcHRpb24gPT09ICduZXcnXG4gIHVzZUtleWJpbmRpbmdzKFxuICAgIHtcbiAgICAgICdjb25maXJtOnByZXZpb3VzJzogaGFuZGxlUHJldmlvdXMsXG4gICAgICAnY29uZmlybTpuZXh0JzogaGFuZGxlTmV4dCxcbiAgICAgICdjb25maXJtOnllcyc6IGhhbmRsZUNvbmZpcm0sXG4gICAgfSxcbiAgICB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nLCBpc0FjdGl2ZTogIWlzVGV4dElucHV0VmlzaWJsZSB9LFxuICApXG4gIHVzZUtleWJpbmRpbmdzKFxuICAgIHtcbiAgICAgICdjb25maXJtOnByZXZpb3VzJzogaGFuZGxlUHJldmlvdXMsXG4gICAgICAnY29uZmlybTpuZXh0JzogaGFuZGxlTmV4dCxcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicsIGlzQWN0aXZlOiBpc1RleHRJbnB1dFZpc2libGUgfSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGJvcmRlclN0eWxlPVwicm91bmRcIiBwYWRkaW5nWD17MX0+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgPFRleHQgYm9sZD5JbnN0YWxsIEdpdEh1YiBBcHA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+Q2hvb3NlIEFQSSBrZXk8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7ZXhpc3RpbmdBcGlLZXkgJiYgKFxuICAgICAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICB7c2VsZWN0ZWRPcHRpb24gPT09ICdleGlzdGluZydcbiAgICAgICAgICAgICAgICA/IGNvbG9yKCdzdWNjZXNzJywgdGhlbWUpKCc+ICcpXG4gICAgICAgICAgICAgICAgOiAnICAnfVxuICAgICAgICAgICAgICBVc2UgeW91ciBleGlzdGluZyBDbGF1ZGUgQ29kZSBBUEkga2V5XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICAgIHtvbkNyZWF0ZU9BdXRoVG9rZW4gJiYgKFxuICAgICAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICB7c2VsZWN0ZWRPcHRpb24gPT09ICdvYXV0aCdcbiAgICAgICAgICAgICAgICA/IGNvbG9yKCdzdWNjZXNzJywgdGhlbWUpKCc+ICcpXG4gICAgICAgICAgICAgICAgOiAnICAnfVxuICAgICAgICAgICAgICBDcmVhdGUgYSBsb25nLWxpdmVkIHRva2VuIHdpdGggeW91ciBDbGF1ZGUgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIHtzZWxlY3RlZE9wdGlvbiA9PT0gJ25ldycgPyBjb2xvcignc3VjY2VzcycsIHRoZW1lKSgnPiAnKSA6ICcgICd9XG4gICAgICAgICAgICBFbnRlciBhIG5ldyBBUEkga2V5XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cbiAgICAgICAge3NlbGVjdGVkT3B0aW9uID09PSAnbmV3JyAmJiAoXG4gICAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgICAgdmFsdWU9e2FwaUtleU9yT0F1dGhUb2tlbn1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtvbkFwaUtleUNoYW5nZX1cbiAgICAgICAgICAgIG9uU3VibWl0PXtvblN1Ym1pdH1cbiAgICAgICAgICAgIG9uUGFzdGU9e29uQXBpS2V5Q2hhbmdlfVxuICAgICAgICAgICAgZm9jdXM9e3RydWV9XG4gICAgICAgICAgICBwbGFjZWhvbGRlcj1cInNrLWFudOKApiAoQ3JlYXRlIGEgbmV3IGtleSBhdCBodHRwczovL3BsYXRmb3JtLmNsYXVkZS5jb20vc2V0dGluZ3Mva2V5cylcIlxuICAgICAgICAgICAgbWFzaz1cIipcIlxuICAgICAgICAgICAgY29sdW1ucz17dGVybWluYWxTaXplLmNvbHVtbnN9XG4gICAgICAgICAgICBjdXJzb3JPZmZzZXQ9e2N1cnNvck9mZnNldH1cbiAgICAgICAgICAgIG9uQ2hhbmdlQ3Vyc29yT2Zmc2V0PXtzZXRDdXJzb3JPZmZzZXR9XG4gICAgICAgICAgICBzaG93Q3Vyc29yPXt0cnVlfVxuICAgICAgICAgIC8+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICAgIDxCb3ggbWFyZ2luTGVmdD17M30+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPuKGkS/ihpMgdG8gc2VsZWN0IMK3IEVudGVyIHRvIGNvbnRpbnVlPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFBSUMsV0FBVyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNwRCxPQUFPQyxTQUFTLE1BQU0sK0JBQStCO0FBQ3JELFNBQVNDLGVBQWUsUUFBUSxnQ0FBZ0M7QUFDaEUsU0FBU0MsR0FBRyxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGNBQWM7QUFDekQsU0FBU0MsY0FBYyxRQUFRLG9DQUFvQztBQUVuRSxVQUFVQyxlQUFlLENBQUM7RUFDeEJDLGNBQWMsRUFBRSxNQUFNLEdBQUcsSUFBSTtFQUM3QkMsY0FBYyxFQUFFLE9BQU87RUFDdkJDLGtCQUFrQixFQUFFLE1BQU07RUFDMUJDLGNBQWMsRUFBRSxDQUFDQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSTtFQUN2Q0Msc0JBQXNCLEVBQUUsQ0FBQ0MsV0FBVyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUk7RUFDdERDLFFBQVEsRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUNwQkMsa0JBQWtCLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSTtFQUMvQkMsY0FBYyxDQUFDLEVBQUUsVUFBVSxHQUFHLEtBQUssR0FBRyxPQUFPO0VBQzdDQyxjQUFjLENBQUMsRUFBRSxDQUFDQyxNQUFNLEVBQUUsVUFBVSxHQUFHLEtBQUssR0FBRyxPQUFPLEVBQUUsR0FBRyxJQUFJO0FBQ2pFO0FBRUEsT0FBTyxTQUFBQyxXQUFBQyxFQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQW9CO0lBQUFmLGNBQUE7SUFBQUUsa0JBQUE7SUFBQUMsY0FBQTtJQUFBSSxRQUFBO0lBQUFGLHNCQUFB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