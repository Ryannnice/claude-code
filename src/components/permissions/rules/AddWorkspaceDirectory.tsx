// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useState } from 'react';
// 引入 useDebounceCallback，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useDebounceCallback } from 'usehooks-ts';
// 注册 addDirHelpMessage、validateDirectoryForWorkspace 命令实现，后续会把它纳入斜杠命令集合。
import { addDirHelpMessage, validateDirectoryForWorkspace } from '../../../commands/add-dir/validation.js';
// 复用 TextInput 终端界面组件，避免在这里重复拼装显示逻辑。
import TextInput from '../../../components/TextInput.js';
// 类型依赖 { KeyboardEvent } 来自 ../../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../../ink.js';
// 引入 useKeybinding，将 ../../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../../keybindings/useKeybinding.js';
// 类型依赖 { ToolPermissionContext } 来自 ../../../Tool.js，用于校准终端渲染的数据契约。
import type { ToolPermissionContext } from '../../../Tool.js';
// 复用 getDirectoryCompletions 工具函数，把通用处理留在 ../../../utils/suggestions/directoryCompletion.js 中维护。
import { getDirectoryCompletions } from '../../../utils/suggestions/directoryCompletion.js';
// 引入 ConfigurableShortcutHint，将 ../../ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from '../../ConfigurableShortcutHint.js';
// 引入 Select，将 ../../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../../CustomSelect/select.js';
// 引入 Byline，将 ../../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../../design-system/Byline.js';
// 引入 Dialog，将 ../../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../../design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ../../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../../design-system/KeyboardShortcutHint.js';
// 引入 PromptInputFooterSuggestions、SuggestionItem，将 ../../PromptInput/PromptInputFooterSuggestions.js 中已经封装好的能力接到本文件流程里。
import { PromptInputFooterSuggestions, type SuggestionItem } from '../../PromptInput/PromptInputFooterSuggestions.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onAddDirectory: (path: string, remember?: boolean) => void;，负责终端渲染在该局部场景下的响应。
  onAddDirectory: (path: string, remember?: boolean) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
  permissionContext: ToolPermissionContext;
  directoryPath?: string; // When directoryPath is provided, show selection options instead of input
};
// RememberDirectoryOption 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type RememberDirectoryOption = 'yes-session' | 'yes-remember' | 'no';
// REMEMBER_DIRECTORY_OPTIONS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const REMEMBER_DIRECTORY_OPTIONS: Array<{
  value: RememberDirectoryOption;
  label: string;
}> = [{
  value: 'yes-session',
  label: 'Yes, for this session'
}, {
  value: 'yes-remember',
  label: 'Yes, and remember this directory'
}, {
  value: 'no',
  label: 'No'
}];
// PermissionDescription 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function PermissionDescription() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<Text dimColor={true}>Claude Code will be able to read fi...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `<Text dimColor={true}>Claude Code will be able to read fi...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text dimColor={true}>Claude Code will be able to read files in this directory and make edits when auto-accept edits is on.</Text>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// DirectoryDisplay 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function DirectoryDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(5);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    path
  } = t0;
  // t1 暂存 `<Text color="permission">{path}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== path) {
    // t1 暂存 `<Text color="permission">{path}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text color="permission">{path}</Text>;
    // $[0] 缓存 `path`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = path;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // t2 暂存 `<PermissionDescription />` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<PermissionDescription />` 生成的渲染片段，后续返回路径直接复用。
    t2 = <PermissionDescription />;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `<Box flexDirection="column" paddingX={2} gap={1}>{t1}{t2}...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== t1) {
    // t3 暂存 `<Box flexDirection="column" paddingX={2} gap={1}>{t1}{t2}...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box flexDirection="column" paddingX={2} gap={1}>{t1}{t2}</Box>;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// DirectoryInput 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function DirectoryInput(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    value,
    onChange,
    onSubmit,
    error,
    suggestions,
    selectedSuggestion
  } = t0;
  // t1 暂存 `<Text>Enter the path to the directory:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `<Text>Enter the path to the directory:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t1 = <Text>Enter the path to the directory:</Text>;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // t2 暂存 `<Box borderDimColor={true} borderStyle="round" marginY={1...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onChange || $[2] !== onSubmit || $[3] !== value) {
    // t2 暂存 `<Box borderDimColor={true} borderStyle="round" marginY={1...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box borderDimColor={true} borderStyle="round" marginY={1} paddingLeft={1}><TextInput showCursor={true} placeholder={`Directory path${figures.ellipsis}`} value={value} onChange={onChange} onSubmit={onSubmit} columns={80} cursorOffset={value.length} onChangeCursorOffset={_temp} /></Box>;
    // $[1] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onChange;
    // $[2] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = onSubmit;
    // $[3] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = value;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `suggestions.length > 0 && <Box marginBottom={1}><PromptIn...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== selectedSuggestion || $[6] !== suggestions) {
    // t3 暂存 `suggestions.length > 0 && <Box marginBottom={1}><PromptIn...` 生成的渲染片段，后续返回路径直接复用。
    t3 = suggestions.length > 0 && <Box marginBottom={1}><PromptInputFooterSuggestions suggestions={suggestions} selectedSuggestion={selectedSuggestion} /></Box>;
    // $[5] 缓存 `selectedSuggestion`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = selectedSuggestion;
    // $[6] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = suggestions;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // t4 暂存 `error && <Text color="error">{error}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== error) {
    // t4 暂存 `error && <Text color="error">{error}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t4 = error && <Text color="error">{error}</Text>;
    // $[8] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = error;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `<Box flexDirection="column">{t1}{t2}{t3}{t4}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
    // t5 暂存 `<Box flexDirection="column">{t1}{t2}{t3}{t4}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box flexDirection="column">{t1}{t2}{t3}{t4}</Box>;
    // $[10] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t2;
    // $[11] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t3;
    // $[12] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t4;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
// AddWorkspaceDirectory 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AddWorkspaceDirectory(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(34);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onAddDirectory,
    onCancel,
    permissionContext,
    directoryPath
  } = t0;
  // directoryInput 由 React state 持有，setDirectoryInput 会在用户操作或异步结果返回时触发刷新。
  const [directoryInput, setDirectoryInput] = useState("");
  // 错误 由 React state 持有，setError 会在用户操作或异步结果返回时触发刷新。
  const [error, setError] = useState(null);
  // t1 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // suggestions 集合 由 React state 持有，setSuggestions 会在用户操作或异步结果返回时触发刷新。
  const [suggestions, setSuggestions] = useState(t1);
  // selectedSuggestion 由 React state 持有，setSelectedSuggestion 会在用户操作或异步结果返回时触发刷新。
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  // t2 暂存 `async path => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `async path => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = async path => {
      // 路径缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!path) {
        // setSuggestions 写入新的状态值，使终端渲染后续读取保持一致。
        setSuggestions([]);
        // setSelectedSuggestion 写入新的状态值，使终端渲染后续读取保持一致。
        setSelectedSuggestion(0);
        // 权限确认界面 Add Workspace Directory在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // completions 集合读取`getDirectoryCompletions`，供终端渲染后续处理使用。
      const completions = await getDirectoryCompletions(path);
      // setSuggestions 写入新的状态值，使终端渲染后续读取保持一致。
      setSuggestions(completions);
      // setSelectedSuggestion 写入新的状态值，使终端渲染后续读取保持一致。
      setSelectedSuggestion(0);
    };
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // fetchSuggestions 集合沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const fetchSuggestions = t2;
  // debouncedFetchSuggestions 集合保存`useDebounceCallback`，供终端渲染后续处理使用。
  const debouncedFetchSuggestions = useDebounceCallback(fetchSuggestions, 100);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `[directoryInput, debouncedFetchSuggestions]` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== debouncedFetchSuggestions || $[3] !== directoryInput) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 调用 debouncedFetchSuggestions，触发终端渲染此处需要的副作用。
      debouncedFetchSuggestions(directoryInput);
    };
    // t4 暂存 `[directoryInput, debouncedFetchSuggestions]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [directoryInput, debouncedFetchSuggestions];
    // $[2] 缓存 `debouncedFetchSuggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = debouncedFetchSuggestions;
    // $[3] 缓存 `directoryInput`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = directoryInput;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t3, t4);
  // t5 暂存 `suggestion => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `suggestion => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = suggestion => {
      // newPath 路径数据 命名 `suggestion.id + "/"`，让后续代码直接表达这个值的用途。
      const newPath = suggestion.id + "/";
      // setDirectoryInput 写入新的状态值，使终端渲染后续读取保持一致。
      setDirectoryInput(newPath);
      // setError 写入新的状态值，使终端渲染后续读取保持一致。
      setError(null);
    };
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // applySuggestion保存`t5`，作为后续临时缓存值处理的输入。
  const applySuggestion = t5;
  // t6 暂存 `async newPath_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== onAddDirectory || $[8] !== permissionContext) {
    // t6 暂存 `async newPath_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = async newPath_0 => {
      // 结果读取`validateDirectoryForWorkspace`，供终端渲染后续处理使用。
      const result = await validateDirectoryForWorkspace(newPath_0, permissionContext);
      // 当 `result.resultType` 匹配 `"success"` 时，终端渲染执行对应分支。
      if (result.resultType === "success") {
        // 调用 onAddDirectory，触发终端渲染此处需要的副作用。
        onAddDirectory(result.absolutePath, false);
      } else {
        // setError 写入新的状态值，使终端渲染后续读取保持一致。
        setError(addDirHelpMessage(result));
      }
    };
    // $[7] 缓存 `onAddDirectory`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onAddDirectory;
    // $[8] 缓存 `permissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = permissionContext;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // handleSubmit 命名 `t6`，让后续代码直接表达这个值的用途。
  const handleSubmit = t6;
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      context: "Settings"
    };
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t7);
  // t8 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== handleSubmit || $[12] !== selectedSuggestion || $[13] !== suggestions) {
    // t8 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = e => {
      // 满足 `suggestions.length > 0` 时，终端渲染执行该分支。
      if (suggestions.length > 0) {
        // 当 `e.key` 匹配 `"tab"` 时，终端渲染执行对应分支。
        if (e.key === "tab") {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // suggestion_0 命名 `suggestions[selectedSuggestion]`，让后续代码直接表达这个值的用途。
          const suggestion_0 = suggestions[selectedSuggestion];
          // 满足 `suggestion_0` 时，终端渲染执行该分支。
          if (suggestion_0) {
            // 调用 applySuggestion，触发终端渲染此处需要的副作用。
            applySuggestion(suggestion_0);
          }
          // 权限确认界面 Add Workspace Directory在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 当 `e.key` 匹配 `"return"` 时，终端渲染执行对应分支。
        if (e.key === "return") {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // suggestion_1 命名 `suggestions[selectedSuggestion]`，让后续代码直接表达这个值的用途。
          const suggestion_1 = suggestions[selectedSuggestion];
          // 满足 `suggestion_1` 时，终端渲染执行该分支。
          if (suggestion_1) {
            // 调用 handleSubmit，触发终端渲染此处需要的副作用。
            handleSubmit(suggestion_1.id + "/");
          }
          // 权限确认界面 Add Workspace Directory在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 当 `e.key` 匹配 `"up" || e.ctrl && e.key ===...` 时，终端渲染执行对应分支。
        if (e.key === "up" || e.ctrl && e.key === "p") {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // setSelectedSuggestion 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedSuggestion(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
          // 权限确认界面 Add Workspace Directory在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // 当 `e.key` 匹配 `"down" || e.ctrl && e.key =...` 时，终端渲染执行对应分支。
        if (e.key === "down" || e.ctrl && e.key === "n") {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // setSelectedSuggestion 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedSuggestion(prev_0 => prev_0 >= suggestions.length - 1 ? 0 : prev_0 + 1);
          // 权限确认界面 Add Workspace Directory在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
      }
    };
    // $[11] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = handleSubmit;
    // $[12] 缓存 `selectedSuggestion`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = selectedSuggestion;
    // $[13] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = suggestions;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // handleKeyDown保存`t8`，作为后续临时缓存值处理的输入。
  const handleKeyDown = t8;
  // t9 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== directoryPath || $[16] !== onAddDirectory || $[17] !== onCancel) {
    // t9 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = value => {
      // directoryPath 路径数据缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!directoryPath) {
        // 权限确认界面 Add Workspace Directory在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // selectionValue 命名 `value as RememberDirectoryOption`，让后续代码直接表达这个值的用途。
      const selectionValue = value as RememberDirectoryOption;
      // 权限确认界面 Add Workspace Directory在这里处理 `bb64: switch (selectionValue) {`，完成这一小步状态转换。
      bb64: switch (selectionValue) {
        case "yes-session":
          {
            // 调用 onAddDirectory，触发终端渲染此处需要的副作用。
            onAddDirectory(directoryPath, false);
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb64;
          }
        case "yes-remember":
          {
            // 调用 onAddDirectory，触发终端渲染此处需要的副作用。
            onAddDirectory(directoryPath, true);
            // 结束这个分支或循环，避免终端渲染继续落入后续路径。
            break bb64;
          }
        case "no":
          {
            // 调用 onCancel，触发终端渲染此处需要的副作用。
            onCancel();
          }
      }
    };
    // $[15] 缓存 `directoryPath`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = directoryPath;
    // $[16] 缓存 `onAddDirectory`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = onAddDirectory;
    // $[17] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onCancel;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // handleSelect保存`t9`，作为后续临时缓存值处理的输入。
  const handleSelect = t9;
  // t10保存`directoryPath ? undefined : _temp2`，供后续判断或组装使用。
  const t10 = directoryPath ? undefined : _temp2;
  // t11 暂存 `directoryPath ? <Box flexDirection="column" gap={1}><Dire...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== directoryInput || $[20] !== directoryPath || $[21] !== error || $[22] !== handleSelect || $[23] !== handleSubmit || $[24] !== selectedSuggestion || $[25] !== suggestions) {
    // t11 暂存 `directoryPath ? <Box flexDirection="column" gap={1}><Dire...` 生成的渲染片段，后续返回路径直接复用。
    t11 = directoryPath ? <Box flexDirection="column" gap={1}><DirectoryDisplay path={directoryPath} /><Select options={REMEMBER_DIRECTORY_OPTIONS} onChange={handleSelect} onCancel={() => handleSelect("no")} /></Box> : <Box flexDirection="column" gap={1} marginX={2}><PermissionDescription /><DirectoryInput value={directoryInput} onChange={setDirectoryInput} onSubmit={handleSubmit} error={error} suggestions={suggestions} selectedSuggestion={selectedSuggestion} /></Box>;
    // $[19] 缓存 `directoryInput`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = directoryInput;
    // $[20] 缓存 `directoryPath`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = directoryPath;
    // $[21] 缓存 `error`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = error;
    // $[22] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = handleSelect;
    // $[23] 缓存 `handleSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = handleSubmit;
    // $[24] 缓存 `selectedSuggestion`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = selectedSuggestion;
    // $[25] 缓存 `suggestions`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = suggestions;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
  }
  // t12 暂存 `<Dialog title="Add directory to workspace" onCancel={onCa...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== onCancel || $[28] !== t10 || $[29] !== t11) {
    // t12 暂存 `<Dialog title="Add directory to workspace" onCancel={onCa...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Dialog title="Add directory to workspace" onCancel={onCancel} color="permission" isCancelActive={false} inputGuide={t10}>{t11}</Dialog>;
    // $[27] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = onCancel;
    // $[28] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t10;
    // $[29] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t11;
    // $[30] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[30];
  }
  // t13 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== handleKeyDown || $[32] !== t12) {
    // t13 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Box flexDirection="column" tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t12}</Box>;
    // $[31] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = handleKeyDown;
    // $[32] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t12;
    // $[33] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[33];
  }
  // 返回 `t13`，作为终端渲染这次计算的结果。
  return t13;
}
// _temp2 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(exitState) {
  // 返回 `exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text...`，作为终端渲染这次计算的结果。
  return exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline><KeyboardShortcutHint shortcut="Tab" action="complete" /><KeyboardShortcutHint shortcut="Enter" action="add" /><ConfigurableShortcutHint action="confirm:no" context="Settings" fallback="Esc" description="cancel" /></Byline>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsInVzZURlYm91bmNlQ2FsbGJhY2siLCJhZGREaXJIZWxwTWVzc2FnZSIsInZhbGlkYXRlRGlyZWN0b3J5Rm9yV29ya3NwYWNlIiwiVGV4dElucHV0IiwiS2V5Ym9hcmRFdmVudCIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwiVG9vbFBlcm1pc3Npb25Db250ZXh0IiwiZ2V0RGlyZWN0b3J5Q29tcGxldGlvbnMiLCJDb25maWd1cmFibGVTaG9ydGN1dEhpbnQiLCJTZWxlY3QiLCJCeWxpbmUiLCJEaWFsb2ciLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIlByb21wdElucHV0Rm9vdGVyU3VnZ2VzdGlvbnMiLCJTdWdnZXN0aW9uSXRlbSIsIlByb3BzIiwib25BZGREaXJlY3RvcnkiLCJwYXRoIiwicmVtZW1iZXIiLCJvbkNhbmNlbCIsInBlcm1pc3Npb25Db250ZXh0IiwiZGlyZWN0b3J5UGF0aCIsIlJlbWVtYmVyRGlyZWN0b3J5T3B0aW9uIiwiUkVNRU1CRVJfRElSRUNUT1JZX09QVElPTlMiLCJBcnJheSIsInZhbHVlIiwibGFiZWwiLCJQZXJtaXNzaW9uRGVzY3JpcHRpb24iLCIkIiwiX2MiLCJ0MCIsIlN5bWJvbCIsImZvciIsIkRpcmVjdG9yeURpc3BsYXkiLCJ0MSIsInQyIiwidDMiLCJEaXJlY3RvcnlJbnB1dCIsIm9uQ2hhbmdlIiwib25TdWJtaXQiLCJlcnJvciIsInN1Z2dlc3Rpb25zIiwic2VsZWN0ZWRTdWdnZXN0aW9uIiwiZWxsaXBzaXMiLCJsZW5ndGgiLCJfdGVtcCIsInQ0IiwidDUiLCJBZGRXb3Jrc3BhY2VEaXJlY3RvcnkiLCJkaXJlY3RvcnlJbnB1dCIsInNldERpcmVjdG9yeUlucHV0Iiwic2V0RXJyb3IiLCJzZXRTdWdnZXN0aW9ucyIsInNldFNlbGVjdGVkU3VnZ2VzdGlvbiIsImNvbXBsZXRpb25zIiwiZmV0Y2hTdWdnZXN0aW9ucyIsImRlYm91bmNlZEZldGNoU3VnZ2VzdGlvbnMiLCJzdWdnZXN0aW9uIiwibmV3UGF0aCIsImlkIiwiYXBwbHlTdWdnZXN0aW9uIiwidDYiLCJuZXdQYXRoXzAiLCJyZXN1bHQiLCJyZXN1bHRUeXBlIiwiYWJzb2x1dGVQYXRoIiwiaGFuZGxlU3VibWl0IiwidDciLCJjb250ZXh0IiwidDgiLCJlIiwia2V5IiwicHJldmVudERlZmF1bHQiLCJzdWdnZXN0aW9uXzAiLCJzdWdnZXN0aW9uXzEiLCJjdHJsIiwicHJldiIsInByZXZfMCIsImhhbmRsZUtleURvd24iLCJ0OSIsInNlbGVjdGlvblZhbHVlIiwiYmI2NCIsImhhbmRsZVNlbGVjdCIsInQxMCIsInVuZGVmaW5lZCIsIl90ZW1wMiIsInQxMSIsIm9wdGlvbnMiLCJ0MTIiLCJ0MTMiLCJleGl0U3RhdGUiLCJwZW5kaW5nIiwia2V5TmFtZSJdLCJzb3VyY2VzIjpbIkFkZFdvcmtzcGFjZURpcmVjdG9yeS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZURlYm91bmNlQ2FsbGJhY2sgfSBmcm9tICd1c2Vob29rcy10cydcbmltcG9ydCB7XG4gIGFkZERpckhlbHBNZXNzYWdlLFxuICB2YWxpZGF0ZURpcmVjdG9yeUZvcldvcmtzcGFjZSxcbn0gZnJvbSAnLi4vLi4vLi4vY29tbWFuZHMvYWRkLWRpci92YWxpZGF0aW9uLmpzJ1xuaW1wb3J0IFRleHRJbnB1dCBmcm9tICcuLi8uLi8uLi9jb21wb25lbnRzL1RleHRJbnB1dC5qcydcbmltcG9ydCB0eXBlIHsgS2V5Ym9hcmRFdmVudCB9IGZyb20gJy4uLy4uLy4uL2luay9ldmVudHMva2V5Ym9hcmQtZXZlbnQuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4vLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB0eXBlIHsgVG9vbFBlcm1pc3Npb25Db250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vVG9vbC5qcydcbmltcG9ydCB7IGdldERpcmVjdG9yeUNvbXBsZXRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvc3VnZ2VzdGlvbnMvZGlyZWN0b3J5Q29tcGxldGlvbi5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4uLy4uL0NvbmZpZ3VyYWJsZVNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IFNlbGVjdCB9IGZyb20gJy4uLy4uL0N1c3RvbVNlbGVjdC9zZWxlY3QuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi8uLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uLy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi8uLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHtcbiAgUHJvbXB0SW5wdXRGb290ZXJTdWdnZXN0aW9ucyxcbiAgdHlwZSBTdWdnZXN0aW9uSXRlbSxcbn0gZnJvbSAnLi4vLi4vUHJvbXB0SW5wdXQvUHJvbXB0SW5wdXRGb290ZXJTdWdnZXN0aW9ucy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25BZGREaXJlY3Rvcnk6IChwYXRoOiBzdHJpbmcsIHJlbWVtYmVyPzogYm9vbGVhbikgPT4gdm9pZFxuICBvbkNhbmNlbDogKCkgPT4gdm9pZFxuICBwZXJtaXNzaW9uQ29udGV4dDogVG9vbFBlcm1pc3Npb25Db250ZXh0XG4gIGRpcmVjdG9yeVBhdGg/OiBzdHJpbmcgLy8gV2hlbiBkaXJlY3RvcnlQYXRoIGlzIHByb3ZpZGVkLCBzaG93IHNlbGVjdGlvbiBvcHRpb25zIGluc3RlYWQgb2YgaW5wdXRcbn1cblxudHlwZSBSZW1lbWJlckRpcmVjdG9yeU9wdGlvbiA9ICd5ZXMtc2Vzc2lvbicgfCAneWVzLXJlbWVtYmVyJyB8ICdubydcblxuY29uc3QgUkVNRU1CRVJfRElSRUNUT1JZX09QVElPTlM6IEFycmF5PHtcbiAgdmFsdWU6IFJlbWVtYmVyRGlyZWN0b3J5T3B0aW9uXG4gIGxhYmVsOiBzdHJpbmdcbn0+ID0gW1xuICB7XG4gICAgdmFsdWU6ICd5ZXMtc2Vzc2lvbicsXG4gICAgbGFiZWw6ICdZZXMsIGZvciB0aGlzIHNlc3Npb24nLFxuICB9LFxuICB7XG4gICAgdmFsdWU6ICd5ZXMtcmVtZW1iZXInLFxuICAgIGxhYmVsOiAnWWVzLCBhbmQgcmVtZW1iZXIgdGhpcyBkaXJlY3RvcnknLFxuICB9LFxuICB7XG4gICAgdmFsdWU6ICdubycsXG4gICAgbGFiZWw6ICdObycsXG4gIH0sXG5dXG5cbmZ1bmN0aW9uIFBlcm1pc3Npb25EZXNjcmlwdGlvbigpOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgQ2xhdWRlIENvZGUgd2lsbCBiZSBhYmxlIHRvIHJlYWQgZmlsZXMgaW4gdGhpcyBkaXJlY3RvcnkgYW5kIG1ha2UgZWRpdHNcbiAgICAgIHdoZW4gYXV0by1hY2NlcHQgZWRpdHMgaXMgb24uXG4gICAgPC9UZXh0PlxuICApXG59XG5cbmZ1bmN0aW9uIERpcmVjdG9yeURpc3BsYXkoeyBwYXRoIH06IHsgcGF0aDogc3RyaW5nIH0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHBhZGRpbmdYPXsyfSBnYXA9ezF9PlxuICAgICAgPFRleHQgY29sb3I9XCJwZXJtaXNzaW9uXCI+e3BhdGh9PC9UZXh0PlxuICAgICAgPFBlcm1pc3Npb25EZXNjcmlwdGlvbiAvPlxuICAgIDwvQm94PlxuICApXG59XG5cbmZ1bmN0aW9uIERpcmVjdG9yeUlucHV0KHtcbiAgdmFsdWUsXG4gIG9uQ2hhbmdlLFxuICBvblN1Ym1pdCxcbiAgZXJyb3IsXG4gIHN1Z2dlc3Rpb25zLFxuICBzZWxlY3RlZFN1Z2dlc3Rpb24sXG59OiB7XG4gIHZhbHVlOiBzdHJpbmdcbiAgb25DaGFuZ2U6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkXG4gIG9uU3VibWl0OiAodmFsdWU6IHN0cmluZykgPT4gdm9pZFxuICBlcnJvcjogc3RyaW5nIHwgbnVsbFxuICBzdWdnZXN0aW9uczogU3VnZ2VzdGlvbkl0ZW1bXVxuICBzZWxlY3RlZFN1Z2dlc3Rpb246IG51bWJlclxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8VGV4dD5FbnRlciB0aGUgcGF0aCB0byB0aGUgZGlyZWN0b3J5OjwvVGV4dD5cbiAgICAgIDxCb3ggYm9yZGVyRGltQ29sb3IgYm9yZGVyU3R5bGU9XCJyb3VuZFwiIG1hcmdpblk9ezF9IHBhZGRpbmdMZWZ0PXsxfT5cbiAgICAgICAgPFRleHRJbnB1dFxuICAgICAgICAgIHNob3dDdXJzb3JcbiAgICAgICAgICBwbGFjZWhvbGRlcj17YERpcmVjdG9yeSBwYXRoJHtmaWd1cmVzLmVsbGlwc2lzfWB9XG4gICAgICAgICAgdmFsdWU9e3ZhbHVlfVxuICAgICAgICAgIG9uQ2hhbmdlPXtvbkNoYW5nZX1cbiAgICAgICAgICBvblN1Ym1pdD17b25TdWJtaXR9XG4gICAgICAgICAgY29sdW1ucz17ODB9XG4gICAgICAgICAgY3Vyc29yT2Zmc2V0PXt2YWx1ZS5sZW5ndGh9XG4gICAgICAgICAgb25DaGFuZ2VDdXJzb3JPZmZzZXQ9eygpID0+IHt9fVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgICB7c3VnZ2VzdGlvbnMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICA8UHJvbXB0SW5wdXRGb290ZXJTdWdnZXN0aW9uc1xuICAgICAgICAgICAgc3VnZ2VzdGlvbnM9e3N1Z2dlc3Rpb25zfVxuICAgICAgICAgICAgc2VsZWN0ZWRTdWdnZXN0aW9uPXtzZWxlY3RlZFN1Z2dlc3Rpb259XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAge2Vycm9yICYmIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj57ZXJyb3J9PC9UZXh0Pn1cbiAgICA8L0JveD5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gQWRkV29ya3NwYWNlRGlyZWN0b3J5KHtcbiAgb25BZGREaXJlY3RvcnksXG4gIG9uQ2FuY2VsLFxuICBwZXJtaXNzaW9uQ29udGV4dCxcbiAgZGlyZWN0b3J5UGF0aCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW2RpcmVjdG9yeUlucHV0LCBzZXREaXJlY3RvcnlJbnB1dF0gPSB1c2VTdGF0ZSgnJylcbiAgY29uc3QgW2Vycm9yLCBzZXRFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKVxuICBjb25zdCBbc3VnZ2VzdGlvbnMsIHNldFN1Z2dlc3Rpb25zXSA9IHVzZVN0YXRlPFN1Z2dlc3Rpb25JdGVtW10+KFtdKVxuICBjb25zdCBbc2VsZWN0ZWRTdWdnZXN0aW9uLCBzZXRTZWxlY3RlZFN1Z2dlc3Rpb25dID0gdXNlU3RhdGUoMClcbiAgY29uc3Qgb3B0aW9ucyA9IHVzZU1lbW8oKCkgPT4gUkVNRU1CRVJfRElSRUNUT1JZX09QVElPTlMsIFtdKVxuXG4gIC8vIEZldGNoIGRpcmVjdG9yeSBjb21wbGV0aW9uc1xuICBjb25zdCBmZXRjaFN1Z2dlc3Rpb25zID0gdXNlQ2FsbGJhY2soYXN5bmMgKHBhdGg6IHN0cmluZykgPT4ge1xuICAgIGlmICghcGF0aCkge1xuICAgICAgc2V0U3VnZ2VzdGlvbnMoW10pXG4gICAgICBzZXRTZWxlY3RlZFN1Z2dlc3Rpb24oMClcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBjb21wbGV0aW9ucyA9IGF3YWl0IGdldERpcmVjdG9yeUNvbXBsZXRpb25zKHBhdGgpXG4gICAgc2V0U3VnZ2VzdGlvbnMoY29tcGxldGlvbnMpXG4gICAgc2V0U2VsZWN0ZWRTdWdnZXN0aW9uKDApXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGRlYm91bmNlZEZldGNoU3VnZ2VzdGlvbnMgPSB1c2VEZWJvdW5jZUNhbGxiYWNrKGZldGNoU3VnZ2VzdGlvbnMsIDEwMClcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgZGVib3VuY2VkRmV0Y2hTdWdnZXN0aW9ucyhkaXJlY3RvcnlJbnB1dClcbiAgfSwgW2RpcmVjdG9yeUlucHV0LCBkZWJvdW5jZWRGZXRjaFN1Z2dlc3Rpb25zXSlcblxuICBjb25zdCBhcHBseVN1Z2dlc3Rpb24gPSB1c2VDYWxsYmFjaygoc3VnZ2VzdGlvbjogU3VnZ2VzdGlvbkl0ZW0pID0+IHtcbiAgICBjb25zdCBuZXdQYXRoID0gc3VnZ2VzdGlvbi5pZCArICcvJ1xuICAgIHNldERpcmVjdG9yeUlucHV0KG5ld1BhdGgpXG4gICAgc2V0RXJyb3IobnVsbClcbiAgICAvLyBTdWdnZXN0aW9ucyB3aWxsIHVwZGF0ZSB2aWEgdGhlIHVzZUVmZmVjdFxuICB9LCBbXSlcblxuICAvLyBIYW5kbGUgZGlyZWN0b3J5IHN1Ym1pc3Npb24gZnJvbSBpbnB1dFxuICBjb25zdCBoYW5kbGVTdWJtaXQgPSB1c2VDYWxsYmFjayhcbiAgICBhc3luYyAobmV3UGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB2YWxpZGF0ZURpcmVjdG9yeUZvcldvcmtzcGFjZShcbiAgICAgICAgbmV3UGF0aCxcbiAgICAgICAgcGVybWlzc2lvbkNvbnRleHQsXG4gICAgICApXG5cbiAgICAgIGlmIChyZXN1bHQucmVzdWx0VHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgIG9uQWRkRGlyZWN0b3J5KHJlc3VsdC5hYnNvbHV0ZVBhdGgsIGZhbHNlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0RXJyb3IoYWRkRGlySGVscE1lc3NhZ2UocmVzdWx0KSlcbiAgICAgIH1cbiAgICB9LFxuICAgIFtwZXJtaXNzaW9uQ29udGV4dCwgb25BZGREaXJlY3RvcnldLFxuICApXG5cbiAgLy8gSGFuZGxlIEVzYyB0byBjYW5jZWwgKEN0cmwrQyBoYW5kbGVkIGJ5IGdsb2JhbCBrZXliaW5kaW5ncylcbiAgLy8gVXNlIFNldHRpbmdzIGNvbnRleHQgc28gJ24nIGtleSBkb2Vzbid0IGNhbmNlbCAoYWxsb3dzIHR5cGluZyAnbicgaW4gaW5wdXQpXG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBvbkNhbmNlbCwgeyBjb250ZXh0OiAnU2V0dGluZ3MnIH0pXG5cbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IHVzZUNhbGxiYWNrKFxuICAgIChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgICBpZiAoc3VnZ2VzdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBUYWI6IGFjY2VwdCBzZWxlY3RlZCBzdWdnZXN0aW9uIGFuZCBjb250aW51ZSAoZm9yIGRyaWxsaW5nIGludG8gc3ViZGlycylcbiAgICAgICAgaWYgKGUua2V5ID09PSAndGFiJykge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBzdWdnZXN0aW9uc1tzZWxlY3RlZFN1Z2dlc3Rpb25dXG4gICAgICAgICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgICAgICAgIGFwcGx5U3VnZ2VzdGlvbihzdWdnZXN0aW9uKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVudGVyOiBhcHBseSBzZWxlY3RlZCBzdWdnZXN0aW9uIGFuZCBzdWJtaXRcbiAgICAgICAgaWYgKGUua2V5ID09PSAncmV0dXJuJykge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBzdWdnZXN0aW9uc1tzZWxlY3RlZFN1Z2dlc3Rpb25dXG4gICAgICAgICAgaWYgKHN1Z2dlc3Rpb24pIHtcbiAgICAgICAgICAgIHZvaWQgaGFuZGxlU3VibWl0KHN1Z2dlc3Rpb24uaWQgKyAnLycpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGUua2V5ID09PSAndXAnIHx8IChlLmN0cmwgJiYgZS5rZXkgPT09ICdwJykpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBzZXRTZWxlY3RlZFN1Z2dlc3Rpb24ocHJldiA9PlxuICAgICAgICAgICAgcHJldiA8PSAwID8gc3VnZ2VzdGlvbnMubGVuZ3RoIC0gMSA6IHByZXYgLSAxLFxuICAgICAgICAgIClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLmtleSA9PT0gJ2Rvd24nIHx8IChlLmN0cmwgJiYgZS5rZXkgPT09ICduJykpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBzZXRTZWxlY3RlZFN1Z2dlc3Rpb24ocHJldiA9PlxuICAgICAgICAgICAgcHJldiA+PSBzdWdnZXN0aW9ucy5sZW5ndGggLSAxID8gMCA6IHByZXYgKyAxLFxuICAgICAgICAgIClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgW3N1Z2dlc3Rpb25zLCBzZWxlY3RlZFN1Z2dlc3Rpb24sIGFwcGx5U3VnZ2VzdGlvbiwgaGFuZGxlU3VibWl0XSxcbiAgKVxuXG4gIGNvbnN0IGhhbmRsZVNlbGVjdCA9IHVzZUNhbGxiYWNrKFxuICAgICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIWRpcmVjdG9yeVBhdGgpIHJldHVyblxuXG4gICAgICBjb25zdCBzZWxlY3Rpb25WYWx1ZSA9IHZhbHVlIGFzIFJlbWVtYmVyRGlyZWN0b3J5T3B0aW9uXG5cbiAgICAgIHN3aXRjaCAoc2VsZWN0aW9uVmFsdWUpIHtcbiAgICAgICAgY2FzZSAneWVzLXNlc3Npb24nOlxuICAgICAgICAgIG9uQWRkRGlyZWN0b3J5KGRpcmVjdG9yeVBhdGgsIGZhbHNlKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3llcy1yZW1lbWJlcic6XG4gICAgICAgICAgb25BZGREaXJlY3RvcnkoZGlyZWN0b3J5UGF0aCwgdHJ1ZSlcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdubyc6XG4gICAgICAgICAgb25DYW5jZWwoKVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfSxcbiAgICBbZGlyZWN0b3J5UGF0aCwgb25BZGREaXJlY3RvcnksIG9uQ2FuY2VsXSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICB0YWJJbmRleD17MH1cbiAgICAgIGF1dG9Gb2N1c1xuICAgICAgb25LZXlEb3duPXtoYW5kbGVLZXlEb3dufVxuICAgID5cbiAgICAgIDxEaWFsb2dcbiAgICAgICAgdGl0bGU9XCJBZGQgZGlyZWN0b3J5IHRvIHdvcmtzcGFjZVwiXG4gICAgICAgIG9uQ2FuY2VsPXtvbkNhbmNlbH1cbiAgICAgICAgY29sb3I9XCJwZXJtaXNzaW9uXCJcbiAgICAgICAgaXNDYW5jZWxBY3RpdmU9e2ZhbHNlfVxuICAgICAgICBpbnB1dEd1aWRlPXtcbiAgICAgICAgICBkaXJlY3RvcnlQYXRoXG4gICAgICAgICAgICA/IHVuZGVmaW5lZFxuICAgICAgICAgICAgOiBleGl0U3RhdGUgPT5cbiAgICAgICAgICAgICAgICBleGl0U3RhdGUucGVuZGluZyA/IChcbiAgICAgICAgICAgICAgICAgIDxUZXh0PlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvVGV4dD5cbiAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiVGFiXCIgYWN0aW9uPVwiY29tcGxldGVcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFbnRlclwiIGFjdGlvbj1cImFkZFwiIC8+XG4gICAgICAgICAgICAgICAgICAgIDxDb25maWd1cmFibGVTaG9ydGN1dEhpbnRcbiAgICAgICAgICAgICAgICAgICAgICBhY3Rpb249XCJjb25maXJtOm5vXCJcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0PVwiU2V0dGluZ3NcIlxuICAgICAgICAgICAgICAgICAgICAgIGZhbGxiYWNrPVwiRXNjXCJcbiAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cImNhbmNlbFwiXG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgID5cbiAgICAgICAge2RpcmVjdG9yeVBhdGggPyAoXG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgZ2FwPXsxfT5cbiAgICAgICAgICAgIDxEaXJlY3RvcnlEaXNwbGF5IHBhdGg9e2RpcmVjdG9yeVBhdGh9IC8+XG4gICAgICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgICAgIG9wdGlvbnM9e29wdGlvbnN9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVTZWxlY3R9XG4gICAgICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiBoYW5kbGVTZWxlY3QoJ25vJyl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0gbWFyZ2luWD17Mn0+XG4gICAgICAgICAgICA8UGVybWlzc2lvbkRlc2NyaXB0aW9uIC8+XG4gICAgICAgICAgICA8RGlyZWN0b3J5SW5wdXRcbiAgICAgICAgICAgICAgdmFsdWU9e2RpcmVjdG9yeUlucHV0fVxuICAgICAgICAgICAgICBvbkNoYW5nZT17c2V0RGlyZWN0b3J5SW5wdXR9XG4gICAgICAgICAgICAgIG9uU3VibWl0PXtoYW5kbGVTdWJtaXR9XG4gICAgICAgICAgICAgIGVycm9yPXtlcnJvcn1cbiAgICAgICAgICAgICAgc3VnZ2VzdGlvbnM9e3N1Z2dlc3Rpb25zfVxuICAgICAgICAgICAgICBzZWxlY3RlZFN1Z2dlc3Rpb249e3NlbGVjdGVkU3VnZ2VzdGlvbn1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0RpYWxvZz5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLFNBQVMsRUFBRUMsT0FBTyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUNqRSxTQUFTQyxtQkFBbUIsUUFBUSxhQUFhO0FBQ2pELFNBQ0VDLGlCQUFpQixFQUNqQkMsNkJBQTZCLFFBQ3hCLHlDQUF5QztBQUNoRCxPQUFPQyxTQUFTLE1BQU0sa0NBQWtDO0FBQ3hELGNBQWNDLGFBQWEsUUFBUSx1Q0FBdUM7QUFDMUUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsaUJBQWlCO0FBQzNDLFNBQVNDLGFBQWEsUUFBUSx1Q0FBdUM7QUFDckUsY0FBY0MscUJBQXFCLFFBQVEsa0JBQWtCO0FBQzdELFNBQVNDLHVCQUF1QixRQUFRLG1EQUFtRDtBQUMzRixTQUFTQyx3QkFBd0IsUUFBUSxtQ0FBbUM7QUFDNUUsU0FBU0MsTUFBTSxRQUFRLDhCQUE4QjtBQUNyRCxTQUFTQyxNQUFNLFFBQVEsK0JBQStCO0FBQ3RE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