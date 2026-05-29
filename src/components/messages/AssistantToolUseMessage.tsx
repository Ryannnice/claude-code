// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 类型依赖 { ToolUseBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准终端渲染的数据契约。
import type { ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 引入 useTerminalSize，将 src/hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from 'src/hooks/useTerminalSize.js';
// 类型依赖 { ThemeName } 来自 src/utils/theme.js，用于校准终端渲染的数据契约。
import type { ThemeName } from 'src/utils/theme.js';
// 类型依赖 { Command } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { Command } from '../../commands.js';
// 引入 BLACK_CIRCLE，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE } from '../../constants/figures.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../../ink/stringWidth.js';
// 引入 Box、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../../ink.js';
// 引入 useAppStateMaybeOutsideOfProvider，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppStateMaybeOutsideOfProvider } from '../../state/AppState.js';
// 引入 findToolByName、Tool、ToolProgressData、Tools，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { findToolByName, type Tool, type ToolProgressData, type Tools } from '../../Tool.js';
// 类型依赖 { ProgressMessage } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { ProgressMessage } from '../../types/message.js';
// 复用 useIsClassifierChecking 工具函数，把通用处理留在 ../../utils/classifierApprovalsHook.js 中维护。
import { useIsClassifierChecking } from '../../utils/classifierApprovalsHook.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 类型依赖 { buildMessageLookups } 来自 ../../utils/messages.js，用于校准终端渲染的数据契约。
import type { buildMessageLookups } from '../../utils/messages.js';
// 引入 MessageResponse，将 ../MessageResponse.js 中已经封装好的能力接到本文件流程里。
import { MessageResponse } from '../MessageResponse.js';
// 引入 useSelectedMessageBg，将 ../messageActions.js 中已经封装好的能力接到本文件流程里。
import { useSelectedMessageBg } from '../messageActions.js';
// 引入 SentryErrorBoundary，将 ../SentryErrorBoundary.js 中已经封装好的能力接到本文件流程里。
import { SentryErrorBoundary } from '../SentryErrorBoundary.js';
// 引入 ToolUseLoader，将 ../ToolUseLoader.js 中已经封装好的能力接到本文件流程里。
import { ToolUseLoader } from '../ToolUseLoader.js';
// 引入 HookProgressMessage，将 ./HookProgressMessage.js 中已经封装好的能力接到本文件流程里。
import { HookProgressMessage } from './HookProgressMessage.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  param: ToolUseBlockParam;
  addMargin: boolean;
  tools: Tools;
  commands: Command[];
  verbose: boolean;
  inProgressToolUseIDs: Set<string>;
  progressMessagesForMessage: ProgressMessage[];
  shouldAnimate: boolean;
  shouldShowDot: boolean;
  inProgressToolCallCount?: number;
  lookups: ReturnType<typeof buildMessageLookups>;
  isTranscriptMode?: boolean;
};
// AssistantToolUseMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AssistantToolUseMessage(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(81);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    param,
    addMargin,
    tools,
    commands,
    verbose,
    inProgressToolUseIDs,
    progressMessagesForMessage,
    shouldAnimate,
    shouldShowDot,
    inProgressToolCallCount,
    lookups,
    isTranscriptMode
  } = t0;
  // terminalSize保存`useTerminalSize`，供终端渲染后续处理使用。
  const terminalSize = useTerminalSize();
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Assistant Tool Use Message分别处理这些返回值。
  const [theme] = useTheme();
  // bg保存`useSelectedMessageBg`，供终端渲染后续处理使用。
  const bg = useSelectedMessageBg();
  // pendingWorkerRequest 请求数据保存`useAppStateMaybeOutsideOfProvider`，供终端渲染后续处理使用。
  const pendingWorkerRequest = useAppStateMaybeOutsideOfProvider(_temp);
  // isClassifierCheckingRaw记录 `useIsClassifierChecking` 是否成立，终端渲染随后按该结果分支。
  const isClassifierCheckingRaw = useIsClassifierChecking(param.id);
  // permissionMode 权限数据保存`useAppStateMaybeOutsideOfProvider`，供终端渲染后续处理使用。
  const permissionMode = useAppStateMaybeOutsideOfProvider(_temp2);
  // hasStrippedRules 集合记录 `useAppStateMaybeOutsideOfProvider` 是否成立，终端渲染随后按该结果分支。
  const hasStrippedRules = useAppStateMaybeOutsideOfProvider(_temp3);
  // isAutoClassifier标记终端 UI Assistant Tool Use M...是否启用对应路径。
  const isAutoClassifier = permissionMode === "auto" || permissionMode === "plan" && hasStrippedRules;
  // isClassifierChecking标记终端 UI Assistant Tool Use M...是否启用对应路径。
  const isClassifierChecking = false && isClassifierCheckingRaw && permissionMode !== "auto";
  // t1 暂存 `null` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== param.input || $[1] !== param.name || $[2] !== tools) {
    // 终端 UI 组件 Assistant Tool Use Message在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // tools 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!tools) {
        // t1 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t1 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 工具筛选`findToolByName`，供终端渲染后续处理使用。
      const tool = findToolByName(tools, param.name);
      // 工具缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!tool) {
        // t1 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t1 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 用户输入保存`inputSchema.safeParse`，供终端渲染后续处理使用。
      const input = tool.inputSchema.safeParse(param.input);
      // data 命名 `input.success ? input.data : undefined`，让后续代码直接表达这个值的用途。
      const data = input.success ? input.data : undefined;
      // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t1 = {
        tool,
        input,
        userFacingToolName: tool.userFacingName(data),
        userFacingToolNameBackgroundColor: tool.userFacingNameBackgroundColor?.(data),
        isTransparentWrapper: tool.isTransparentWrapper?.() ?? false
      };
    }
    // $[0] 缓存 `param.input`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = param.input;
    // $[1] 缓存 `param.name`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = param.name;
    // $[2] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = tools;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // 解析结果保存`t1`，作为后续临时缓存值处理的输入。
  const parsed = t1;
  // 解析结果缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!parsed) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logError(new Error(tools ? `Tool ${param.name} not found` : `Tools array is undefined for tool ${param.name}`));
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tool: tool_0,
    input: input_0,
    userFacingToolName,
    userFacingToolNameBackgroundColor,
    isTransparentWrapper
  } = parsed;
  // t2 暂存 `lookups.resolvedToolUseIDs.has(param.id)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== lookups.resolvedToolUseIDs || $[5] !== param.id) {
    // t2 暂存 `lookups.resolvedToolUseIDs.has(param.id)` 生成的渲染片段，后续返回路径直接复用。
    t2 = lookups.resolvedToolUseIDs.has(param.id);
    // $[4] 缓存 `lookups.resolvedToolUseIDs`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = lookups.resolvedToolUseIDs;
    // $[5] 缓存 `param.id`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = param.id;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // isResolved标记终端 UI Assistant Tool Use M...是否启用对应路径。
  const isResolved = t2;
  // t3 暂存 `!inProgressToolUseIDs.has(param.id) && !isResolved` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== inProgressToolUseIDs || $[8] !== isResolved || $[9] !== param.id) {
    // t3 暂存 `!inProgressToolUseIDs.has(param.id) && !isResolved` 生成的渲染片段，后续返回路径直接复用。
    t3 = !inProgressToolUseIDs.has(param.id) && !isResolved;
    // $[7] 缓存 `inProgressToolUseIDs`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = inProgressToolUseIDs;
    // $[8] 缓存 `isResolved`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = isResolved;
    // $[9] 缓存 `param.id`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = param.id;
    // $[10] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[10];
  }
  // isQueued标记终端 UI Assistant Tool Use M...是否启用对应路径。
  const isQueued = t3;
  // isWaitingForPermission 权限数据标记终端 UI Assistant Tool Use M...是否启用对应路径。
  const isWaitingForPermission = pendingWorkerRequest?.toolUseId === param.id;
  // 满足 `isTransparentWrapper` 时，终端渲染执行该分支。
  if (isTransparentWrapper) {
    // 只有 `isQueued || isResolved` 满足时，终端渲染才执行该分支。
    if (isQueued || isResolved) {
      // 返回 `null`，作为终端渲染这次计算的结果。
      return null;
    }
    // t4 暂存 `renderToolUseProgressMessage(tool_0, tools, lookups, para...` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[11] !== inProgressToolCallCount || $[12] !== isTranscriptMode || $[13] !== lookups || $[14] !== param.id || $[15] !== progressMessagesForMessage || $[16] !== terminalSize || $[17] !== tool_0 || $[18] !== tools || $[19] !== verbose) {
      // t4 暂存 `renderToolUseProgressMessage(tool_0, tools, lookups, para...` 生成的渲染片段，后续返回路径直接复用。
      t4 = renderToolUseProgressMessage(tool_0, tools, lookups, param.id, progressMessagesForMessage, {
        verbose,
        inProgressToolCallCount,
        isTranscriptMode
      }, terminalSize);
      // $[11] 缓存 `inProgressToolCallCount`，下次依赖未变时 React 编译产物可直接复用。
      $[11] = inProgressToolCallCount;
      // $[12] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = isTranscriptMode;
      // $[13] 缓存 `lookups`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = lookups;
      // $[14] 缓存 `param.id`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = param.id;
      // $[15] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = progressMessagesForMessage;
      // $[16] 缓存 `terminalSize`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = terminalSize;
      // $[17] 缓存 `tool_0`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = tool_0;
      // $[18] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = tools;
      // $[19] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = verbose;
      // $[20] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[20];
    }
    // t5 暂存 `<Box flexDirection="column" width="100%" backgroundColor=...` 的派生结果，便于缓存命中时直接复用。
    let t5;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[21] !== bg || $[22] !== t4) {
      // t5 暂存 `<Box flexDirection="column" width="100%" backgroundColor=...` 生成的渲染片段，后续返回路径直接复用。
      t5 = <Box flexDirection="column" width="100%" backgroundColor={bg}>{t4}</Box>;
      // $[21] 缓存 `bg`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = bg;
      // $[22] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t4;
      // $[23] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = t5;
    } else {
      // t5 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
      t5 = $[23];
    }
    // 返回 `t5`，作为终端渲染这次计算的结果。
    return t5;
  }
  // 满足 `userFacingToolName === ""` 时，终端渲染执行该分支。
  if (userFacingToolName === "") {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t4 暂存 `input_0.success ? renderToolUseMessage(tool_0, input_0.da...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== commands || $[25] !== input_0.data || $[26] !== input_0.success || $[27] !== theme || $[28] !== tool_0 || $[29] !== verbose) {
    // t4 暂存 `input_0.success ? renderToolUseMessage(tool_0, input_0.da...` 生成的渲染片段，后续返回路径直接复用。
    t4 = input_0.success ? renderToolUseMessage(tool_0, input_0.data, {
      theme,
      verbose,
      commands
    }) : null;
    // $[24] 缓存 `commands`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = commands;
    // $[25] 缓存 `input_0.data`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = input_0.data;
    // $[26] 缓存 `input_0.success`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = input_0.success;
    // $[27] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = theme;
    // $[28] 缓存 `tool_0`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = tool_0;
    // $[29] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = verbose;
    // $[30] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[30];
  }
  // renderedToolUseMessage 消息数据沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const renderedToolUseMessage = t4;
  // 满足 `renderedToolUseMessage === null` 时，终端渲染执行该分支。
  if (renderedToolUseMessage === null) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t5保存`addMargin ? 1 : 0`，供后续判断或组装使用。
  const t5 = addMargin ? 1 : 0;
  // 临时值 t6保存`stringWidth`，供终端渲染后续处理使用。
  const t6 = stringWidth(userFacingToolName) + (shouldShowDot ? 2 : 0);
  // t7 暂存 `shouldShowDot && (isQueued ? <Box minWidth={2}><Text dimC...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== isQueued || $[32] !== isResolved || $[33] !== lookups.erroredToolUseIDs || $[34] !== param.id || $[35] !== shouldAnimate || $[36] !== shouldShowDot) {
    // t7 暂存 `shouldShowDot && (isQueued ? <Box minWidth={2}><Text dimC...` 生成的渲染片段，后续返回路径直接复用。
    t7 = shouldShowDot && (isQueued ? <Box minWidth={2}><Text dimColor={isQueued}>{BLACK_CIRCLE}</Text></Box> : <ToolUseLoader shouldAnimate={shouldAnimate} isUnresolved={!isResolved} isError={lookups.erroredToolUseIDs.has(param.id)} />);
    // $[31] 缓存 `isQueued`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = isQueued;
    // $[32] 缓存 `isResolved`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = isResolved;
    // $[33] 缓存 `lookups.erroredToolUseIDs`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = lookups.erroredToolUseIDs;
    // $[34] 缓存 `param.id`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = param.id;
    // $[35] 缓存 `shouldAnimate`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = shouldAnimate;
    // $[36] 缓存 `shouldShowDot`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = shouldShowDot;
    // $[37] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[37];
  }
  // 临时值 t8 命名 `userFacingToolNameBackgroundColor ? "inverseText" : undef...`，让后续代码直接表达这个值的用途。
  const t8 = userFacingToolNameBackgroundColor ? "inverseText" : undefined;
  // t9 暂存 `<Box flexShrink={0}><Text bold={true} wrap="truncate-end"...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== t8 || $[39] !== userFacingToolName || $[40] !== userFacingToolNameBackgroundColor) {
    // t9 暂存 `<Box flexShrink={0}><Text bold={true} wrap="truncate-end"...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box flexShrink={0}><Text bold={true} wrap="truncate-end" backgroundColor={userFacingToolNameBackgroundColor} color={t8}>{userFacingToolName}</Text></Box>;
    // $[38] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t8;
    // $[39] 缓存 `userFacingToolName`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = userFacingToolName;
    // $[40] 缓存 `userFacingToolNameBackgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = userFacingToolNameBackgroundColor;
    // $[41] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[41];
  }
  // t10 暂存 `renderedToolUseMessage !== "" && <Box flexWrap="nowrap"><...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== renderedToolUseMessage) {
    // t10 暂存 `renderedToolUseMessage !== "" && <Box flexWrap="nowrap"><...` 生成的渲染片段，后续返回路径直接复用。
    t10 = renderedToolUseMessage !== "" && <Box flexWrap="nowrap"><Text>({renderedToolUseMessage})</Text></Box>;
    // $[42] 缓存 `renderedToolUseMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = renderedToolUseMessage;
    // $[43] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[43];
  }
  // t11 暂存 `input_0.success && tool_0.renderToolUseTag && tool_0.rend...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[44] !== input_0.data || $[45] !== input_0.success || $[46] !== tool_0) {
    // t11 暂存 `input_0.success && tool_0.renderToolUseTag && tool_0.rend...` 生成的渲染片段，后续返回路径直接复用。
    t11 = input_0.success && tool_0.renderToolUseTag && tool_0.renderToolUseTag(input_0.data);
    // $[44] 缓存 `input_0.data`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = input_0.data;
    // $[45] 缓存 `input_0.success`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = input_0.success;
    // $[46] 缓存 `tool_0`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = tool_0;
    // $[47] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[47];
  }
  // t12 暂存 `<Box flexDirection="row" flexWrap="nowrap" minWidth={t6}>...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== t10 || $[49] !== t11 || $[50] !== t6 || $[51] !== t7 || $[52] !== t9) {
    // t12 暂存 `<Box flexDirection="row" flexWrap="nowrap" minWidth={t6}>...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box flexDirection="row" flexWrap="nowrap" minWidth={t6}>{t7}{t9}{t10}{t11}</Box>;
    // $[48] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t10;
    // $[49] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t11;
    // $[50] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t6;
    // $[51] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t7;
    // $[52] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t9;
    // $[53] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[53];
  }
  // t13 暂存 `!isResolved && !isQueued && (isClassifierChecking ? <Mess...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[54] !== inProgressToolCallCount || $[55] !== isAutoClassifier || $[56] !== isClassifierChecking || $[57] !== isQueued || $[58] !== isResolved || $[59] !== isTranscriptMode || $[60] !== isWaitingForPermission || $[61] !== lookups || $[62] !== param.id || $[63] !== progressMessagesForMessage || $[64] !== terminalSize || $[65] !== tool_0 || $[66] !== tools || $[67] !== verbose) {
    // t13 暂存 `!isResolved && !isQueued && (isClassifierChecking ? <Mess...` 生成的渲染片段，后续返回路径直接复用。
    t13 = !isResolved && !isQueued && (isClassifierChecking ? <MessageResponse height={1}><Text dimColor={true}>{isAutoClassifier ? "Auto classifier checking\u2026" : "Bash classifier checking\u2026"}</Text></MessageResponse> : isWaitingForPermission ? <MessageResponse height={1}><Text dimColor={true}>Waiting for permission…</Text></MessageResponse> : renderToolUseProgressMessage(tool_0, tools, lookups, param.id, progressMessagesForMessage, {
      verbose,
      inProgressToolCallCount,
      isTranscriptMode
    }, terminalSize));
    // $[54] 缓存 `inProgressToolCallCount`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = inProgressToolCallCount;
    // $[55] 缓存 `isAutoClassifier`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = isAutoClassifier;
    // $[56] 缓存 `isClassifierChecking`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = isClassifierChecking;
    // $[57] 缓存 `isQueued`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = isQueued;
    // $[58] 缓存 `isResolved`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = isResolved;
    // $[59] 缓存 `isTranscriptMode`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = isTranscriptMode;
    // $[60] 缓存 `isWaitingForPermission`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = isWaitingForPermission;
    // $[61] 缓存 `lookups`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = lookups;
    // $[62] 缓存 `param.id`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = param.id;
    // $[63] 缓存 `progressMessagesForMessage`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = progressMessagesForMessage;
    // $[64] 缓存 `terminalSize`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = terminalSize;
    // $[65] 缓存 `tool_0`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = tool_0;
    // $[66] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = tools;
    // $[67] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = verbose;
    // $[68] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[68] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[68];
  }
  // t14 暂存 `!isResolved && isQueued && renderToolUseQueuedMessage(too...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[69] !== isQueued || $[70] !== isResolved || $[71] !== tool_0) {
    // t14 暂存 `!isResolved && isQueued && renderToolUseQueuedMessage(too...` 生成的渲染片段，后续返回路径直接复用。
    t14 = !isResolved && isQueued && renderToolUseQueuedMessage(tool_0);
    // $[69] 缓存 `isQueued`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = isQueued;
    // $[70] 缓存 `isResolved`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = isResolved;
    // $[71] 缓存 `tool_0`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = tool_0;
    // $[72] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[72];
  }
  // t15 暂存 `<Box flexDirection="column">{t12}{t13}{t14}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[73] !== t12 || $[74] !== t13 || $[75] !== t14) {
    // t15 暂存 `<Box flexDirection="column">{t12}{t13}{t14}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Box flexDirection="column">{t12}{t13}{t14}</Box>;
    // $[73] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = t12;
    // $[74] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = t13;
    // $[75] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t14;
    // $[76] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[76];
  }
  // t16 暂存 `<Box flexDirection="row" justifyContent="space-between" m...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[77] !== bg || $[78] !== t15 || $[79] !== t5) {
    // t16 暂存 `<Box flexDirection="row" justifyContent="space-between" m...` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Box flexDirection="row" justifyContent="space-between" marginTop={t5} width="100%" backgroundColor={bg}>{t15}</Box>;
    // $[77] 缓存 `bg`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = bg;
    // $[78] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = t15;
    // $[79] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = t5;
    // $[80] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[80] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[80];
  }
  // 返回 `t16`，作为终端渲染这次计算的结果。
  return t16;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(state_1) {
  // 返回 `!!state_1.toolPermissionContext.strippedDangerousRules`，作为终端渲染这次计算的结果。
  return !!state_1.toolPermissionContext.strippedDangerousRules;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(state_0) {
  // 返回 `state_0.toolPermissionContext.mode`，作为终端渲染这次计算的结果。
  return state_0.toolPermissionContext.mode;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(state) {
  // 返回 `state.pendingWorkerRequest`，作为终端渲染这次计算的结果。
  return state.pendingWorkerRequest;
}
// renderToolUseMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderToolUseMessage(tool: Tool, input: unknown, {
  theme,
  verbose,
  commands
}: {
  theme: ThemeName;
  verbose: boolean;
  commands: Command[];
}): React.ReactNode {
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果保存`inputSchema.safeParse`，供终端渲染后续处理使用。
    const parsed = tool.inputSchema.safeParse(input);
    // parsed.success 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!parsed.success) {
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return '';
    }
    // 返回 `tool.renderToolUseMessage(parsed.data, {`，作为终端渲染这次计算的结果。
    return tool.renderToolUseMessage(parsed.data, {
      theme,
      verbose,
      commands
    });
  } catch (error) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Error rendering tool use message for ${tool.name}: ${error}`));
    // 返回空字符串表示没有可用文本，调用方会按空输入处理。
    return '';
  }
}
// renderToolUseProgressMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderToolUseProgressMessage(tool: Tool, tools: Tools, lookups: ReturnType<typeof buildMessageLookups>, toolUseID: string, progressMessagesForMessage: ProgressMessage[], {
  verbose,
  inProgressToolCallCount,
  isTranscriptMode
}: {
  verbose: boolean;
  inProgressToolCallCount?: number;
  isTranscriptMode?: boolean;
}, terminalSize: {
  columns: number;
  rows: number;
}): React.ReactNode {
  // toolProgressMessages 消息数据筛选`progressMessagesForMessage.filter`，供终端渲染后续处理使用。
  const toolProgressMessages = progressMessagesForMessage.filter((msg): msg is ProgressMessage<ToolProgressData> => msg.data.type !== 'hook_progress');
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // toolMessages 消息数据保存`tool.renderToolUseProgressMessage?.(toolProgressMessages,...`，供终端 UI Assistant Tool Use M...后续判断或输出使用。
    const toolMessages = tool.renderToolUseProgressMessage?.(toolProgressMessages, {
      tools,
      verbose,
      terminalSize,
      inProgressToolCallCount: inProgressToolCallCount ?? 1,
      isTranscriptMode
    }) ?? null;
    // 返回 `<>`，作为终端渲染这次计算的结果。
    return <>
        <SentryErrorBoundary>
          <HookProgressMessage hookEvent="PreToolUse" lookups={lookups} toolUseID={toolUseID} verbose={verbose} isTranscriptMode={isTranscriptMode} />
        </SentryErrorBoundary>
        {toolMessages}
      </>;
  } catch (error) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Error rendering tool use progress message for ${tool.name}: ${error}`));
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
}
// renderToolUseQueuedMessage 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function renderToolUseQueuedMessage(tool: Tool): React.ReactNode {
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 返回 `tool.renderToolUseQueuedMessage?.()`，作为终端渲染这次计算的结果。
    return tool.renderToolUseQueuedMessage?.();
  } catch (error) {
    // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
    logError(new Error(`Error rendering tool use queued message for ${tool.name}: ${error}`));
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUb29sVXNlQmxvY2tQYXJhbSIsIlJlYWN0IiwidXNlTWVtbyIsInVzZVRlcm1pbmFsU2l6ZSIsIlRoZW1lTmFtZSIsIkNvbW1hbmQiLCJCTEFDS19DSVJDTEUiLCJzdHJpbmdXaWR0aCIsIkJveCIsIlRleHQiLCJ1c2VUaGVtZSIsInVzZUFwcFN0YXRlTWF5YmVPdXRzaWRlT2ZQcm92aWRlciIsImZpbmRUb29sQnlOYW1lIiwiVG9vbCIsIlRvb2xQcm9ncmVzc0RhdGEiLCJUb29scyIsIlByb2dyZXNzTWVzc2FnZSIsInVzZUlzQ2xhc3NpZmllckNoZWNraW5nIiwibG9nRXJyb3IiLCJidWlsZE1lc3NhZ2VMb29rdXBzIiwiTWVzc2FnZVJlc3BvbnNlIiwidXNlU2VsZWN0ZWRNZXNzYWdlQmciLCJTZW50cnlFcnJvckJvdW5kYXJ5IiwiVG9vbFVzZUxvYWRlciIsIkhvb2tQcm9ncmVzc01lc3NhZ2UiLCJQcm9wcyIsInBhcmFtIiwiYWRkTWFyZ2luIiwidG9vbHMiLCJjb21tYW5kcyIsInZlcmJvc2UiLCJpblByb2dyZXNzVG9vbFVzZUlEcyIsIlNldCIsInByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlIiwic2hvdWxkQW5pbWF0ZSIsInNob3VsZFNob3dEb3QiLCJpblByb2dyZXNzVG9vbENhbGxDb3VudCIsImxvb2t1cHMiLCJSZXR1cm5UeXBlIiwiaXNUcmFuc2NyaXB0TW9kZSIsIkFzc2lzdGFudFRvb2xVc2VNZXNzYWdlIiwidDAiLCIkIiwiX2MiLCJ0ZXJtaW5hbFNpemUiLCJ0aGVtZSIsImJnIiwicGVuZGluZ1dvcmtlclJlcXVlc3QiLCJfdGVtcCIsImlzQ2xhc3NpZmllckNoZWNraW5nUmF3IiwiaWQiLCJwZXJtaXNzaW9uTW9kZSIsIl90ZW1wMiIsImhhc1N0cmlwcGVkUnVsZXMiLCJfdGVtcDMiLCJpc0F1dG9DbGFzc2lmaWVyIiwiaXNDbGFzc2lmaWVyQ2hlY2tpbmciLCJ0MSIsImlucHV0IiwibmFtZSIsImJiMCIsInRvb2wiLCJpbnB1dFNjaGVtYSIsInNhZmVQYXJzZSIsImRhdGEiLCJzdWNjZXNzIiwidW5kZWZpbmVkIiwidXNlckZhY2luZ1Rvb2xOYW1lIiwidXNlckZhY2luZ05hbWUiLCJ1c2VyRmFjaW5nVG9vbE5hbWVCYWNrZ3JvdW5kQ29sb3IiLCJ1c2VyRmFjaW5nTmFtZUJhY2tncm91bmRDb2xvciIsImlzVHJhbnNwYXJlbnRXcmFwcGVyIiwicGFyc2VkIiwiRXJyb3IiLCJ0b29sXzAiLCJpbnB1dF8wIiwidDIiLCJyZXNvbHZlZFRvb2xVc2VJRHMiLCJoYXMiLCJpc1Jlc29sdmVkIiwidDMiLCJpc1F1ZXVlZCIsImlzV2FpdGluZ0ZvclBlcm1pc3Npb24iLCJ0b29sVXNlSWQiLCJ0NCIsInJlbmRlclRvb2xVc2VQcm9ncmVzc01lc3NhZ2UiLCJ0NSIsInJlbmRlclRvb2xVc2VNZXNzYWdlIiwicmVuZGVyZWRUb29sVXNlTWVzc2FnZSIsInQ2IiwidDciLCJlcnJvcmVkVG9vbFVzZUlEcyIsInQ4IiwidDkiLCJ0MTAiLCJ0MTEiLCJyZW5kZXJUb29sVXNlVGFnIiwidDEyIiwidDEzIiwidDE0IiwicmVuZGVyVG9vbFVzZVF1ZXVlZE1lc3NhZ2UiLCJ0MTUiLCJ0MTYiLCJzdGF0ZV8xIiwic3RhdGUiLCJ0b29sUGVybWlzc2lvbkNvbnRleHQiLCJzdHJpcHBlZERhbmdlcm91c1J1bGVzIiwic3RhdGVfMCIsIm1vZGUiLCJSZWFjdE5vZGUiLCJlcnJvciIsInRvb2xVc2VJRCIsImNvbHVtbnMiLCJyb3dzIiwidG9vbFByb2dyZXNzTWVzc2FnZXMiLCJmaWx0ZXIiLCJtc2ciLCJ0eXBlIiwidG9vbE1lc3NhZ2VzIl0sInNvdXJjZXMiOlsiQXNzaXN0YW50VG9vbFVzZU1lc3NhZ2UudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVG9vbFVzZUJsb2NrUGFyYW0gfSBmcm9tICdAYW50aHJvcGljLWFpL3Nkay9yZXNvdXJjZXMvaW5kZXgubWpzJ1xuaW1wb3J0IFJlYWN0LCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJ3NyYy9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgdHlwZSB7IFRoZW1lTmFtZSB9IGZyb20gJ3NyYy91dGlscy90aGVtZS5qcydcbmltcG9ydCB0eXBlIHsgQ29tbWFuZCB9IGZyb20gJy4uLy4uL2NvbW1hbmRzLmpzJ1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFIH0gZnJvbSAnLi4vLi4vY29uc3RhbnRzL2ZpZ3VyZXMuanMnXG5pbXBvcnQgeyBzdHJpbmdXaWR0aCB9IGZyb20gJy4uLy4uL2luay9zdHJpbmdXaWR0aC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlVGhlbWUgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZU1heWJlT3V0c2lkZU9mUHJvdmlkZXIgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7XG4gIGZpbmRUb29sQnlOYW1lLFxuICB0eXBlIFRvb2wsXG4gIHR5cGUgVG9vbFByb2dyZXNzRGF0YSxcbiAgdHlwZSBUb29scyxcbn0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgUHJvZ3Jlc3NNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdHlwZXMvbWVzc2FnZS5qcydcbmltcG9ydCB7IHVzZUlzQ2xhc3NpZmllckNoZWNraW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvY2xhc3NpZmllckFwcHJvdmFsc0hvb2suanMnXG5pbXBvcnQgeyBsb2dFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2xvZy5qcydcbmltcG9ydCB0eXBlIHsgYnVpbGRNZXNzYWdlTG9va3VwcyB9IGZyb20gJy4uLy4uL3V0aWxzL21lc3NhZ2VzLmpzJ1xuaW1wb3J0IHsgTWVzc2FnZVJlc3BvbnNlIH0gZnJvbSAnLi4vTWVzc2FnZVJlc3BvbnNlLmpzJ1xuaW1wb3J0IHsgdXNlU2VsZWN0ZWRNZXNzYWdlQmcgfSBmcm9tICcuLi9tZXNzYWdlQWN0aW9ucy5qcydcbmltcG9ydCB7IFNlbnRyeUVycm9yQm91bmRhcnkgfSBmcm9tICcuLi9TZW50cnlFcnJvckJvdW5kYXJ5LmpzJ1xuaW1wb3J0IHsgVG9vbFVzZUxvYWRlciB9IGZyb20gJy4uL1Rvb2xVc2VMb2FkZXIuanMnXG5pbXBvcnQgeyBIb29rUHJvZ3Jlc3NNZXNzYWdlIH0gZnJvbSAnLi9Ib29rUHJvZ3Jlc3NNZXNzYWdlLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBwYXJhbTogVG9vbFVzZUJsb2NrUGFyYW1cbiAgYWRkTWFyZ2luOiBib29sZWFuXG4gIHRvb2xzOiBUb29sc1xuICBjb21tYW5kczogQ29tbWFuZFtdXG4gIHZlcmJvc2U6IGJvb2xlYW5cbiAgaW5Qcm9ncmVzc1Rvb2xVc2VJRHM6IFNldDxzdHJpbmc+XG4gIHByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlOiBQcm9ncmVzc01lc3NhZ2VbXVxuICBzaG91bGRBbmltYXRlOiBib29sZWFuXG4gIHNob3VsZFNob3dEb3Q6IGJvb2xlYW5cbiAgaW5Qcm9ncmVzc1Rvb2xDYWxsQ291bnQ/OiBudW1iZXJcbiAgbG9va3VwczogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRNZXNzYWdlTG9va3Vwcz5cbiAgaXNUcmFuc2NyaXB0TW9kZT86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFzc2lzdGFudFRvb2xVc2VNZXNzYWdlKHtcbiAgcGFyYW0sXG4gIGFkZE1hcmdpbixcbiAgdG9vbHMsXG4gIGNvbW1hbmRzLFxuICB2ZXJib3NlLFxuICBpblByb2dyZXNzVG9vbFVzZUlEcyxcbiAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UsXG4gIHNob3VsZEFuaW1hdGUsXG4gIHNob3VsZFNob3dEb3QsXG4gIGluUHJvZ3Jlc3NUb29sQ2FsbENvdW50LFxuICBsb29rdXBzLFxuICBpc1RyYW5zY3JpcHRNb2RlLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0ZXJtaW5hbFNpemUgPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCBbdGhlbWVdID0gdXNlVGhlbWUoKVxuICBjb25zdCBiZyA9IHVzZVNlbGVjdGVkTWVzc2FnZUJnKClcbiAgY29uc3QgcGVuZGluZ1dvcmtlclJlcXVlc3QgPSB1c2VBcHBTdGF0ZU1heWJlT3V0c2lkZU9mUHJvdmlkZXIoXG4gICAgc3RhdGUgPT4gc3RhdGUucGVuZGluZ1dvcmtlclJlcXVlc3QsXG4gIClcbiAgY29uc3QgaXNDbGFzc2lmaWVyQ2hlY2tpbmdSYXcgPSB1c2VJc0NsYXNzaWZpZXJDaGVja2luZyhwYXJhbS5pZClcbiAgY29uc3QgcGVybWlzc2lvbk1vZGUgPSB1c2VBcHBTdGF0ZU1heWJlT3V0c2lkZU9mUHJvdmlkZXIoXG4gICAgc3RhdGUgPT4gc3RhdGUudG9vbFBlcm1pc3Npb25Db250ZXh0Lm1vZGUsXG4gIClcbiAgLy8gc3RyaXBwZWREYW5nZXJvdXNSdWxlcyBpcyBzZXQgYnkgc3RyaXBEYW5nZXJvdXNQZXJtaXNzaW9uc0ZvckF1dG9Nb2RlXG4gIC8vIChldmVuIHRvIHt9KSB3aGVuZXZlciBhdXRvIGlzIGFjdGl2ZSwgYW5kIGNsZWFyZWQgYnkgcmVzdG9yZURhbmdlcm91c1Blcm1pc3Npb25zXG4gIC8vIG9uIGRlYWN0aXZhdGlvbiDigJQgYSByZWxpYWJsZSBwcm94eSBmb3IgaXNBdXRvTW9kZUFjdGl2ZSgpIGR1cmluZyBwbGFuLlxuICAvLyBwcmVQbGFuTW9kZSB3b3VsZCBiZSBzdGFsZSBhZnRlciB0cmFuc2l0aW9uUGxhbkF1dG9Nb2RlIGRlYWN0aXZhdGVzIG1pZC1wbGFuLlxuICBjb25zdCBoYXNTdHJpcHBlZFJ1bGVzID0gdXNlQXBwU3RhdGVNYXliZU91dHNpZGVPZlByb3ZpZGVyKFxuICAgIHN0YXRlID0+ICEhc3RhdGUudG9vbFBlcm1pc3Npb25Db250ZXh0LnN0cmlwcGVkRGFuZ2Vyb3VzUnVsZXMsXG4gIClcbiAgY29uc3QgaXNBdXRvQ2xhc3NpZmllciA9XG4gICAgcGVybWlzc2lvbk1vZGUgPT09ICdhdXRvJyB8fCAocGVybWlzc2lvbk1vZGUgPT09ICdwbGFuJyAmJiBoYXNTdHJpcHBlZFJ1bGVzKVxuICBjb25zdCBpc0NsYXNzaWZpZXJDaGVja2luZyA9XG4gICAgXCJleHRlcm5hbFwiID09PSAnYW50JyAmJlxuICAgIGlzQ2xhc3NpZmllckNoZWNraW5nUmF3ICYmXG4gICAgcGVybWlzc2lvbk1vZGUgIT09ICdhdXRvJ1xuXG4gIC8vIE1lbW9pemUgb24gcGFyYW0gaWRlbnRpdHkgKHN0YWJsZSDigJQgZnJvbSB0aGUgcGVyc2lzdGVkIG1lc3NhZ2Ugb2JqZWN0KS5cbiAgLy8gWm9kIHNhZmVQYXJzZSBhbGxvY2F0ZXMgcGVyIGNhbGwsIGFuZCBzb21lIHRvb2xzJyB1c2VyRmFjaW5nTmFtZSgpXG4gIC8vIChCYXNoVG9vbCDihpIgc2hvdWxkVXNlU2FuZGJveCDihpIgc2hlbGwtcXVvdGUgcGFyc2UpIGFyZSBleHBlbnNpdmUuIFdpdGhvdXRcbiAgLy8gdGhpcywgfjUwIGJhc2ggbWVzc2FnZXMgw5cgc2hlbGwtcXVvdGUtcGVyLXJlbmRlciBwdXNoZWQgdHJhbnNpdGlvblxuICAvLyByZW5kZXIgcGFzdCB0aGUgc2hpbW1lciB0aWNrIOKGkiBhYm9ydCDihpIgaW5maW5pdGUgcmV0cnkgKCMyMTYwNSkuXG4gIGNvbnN0IHBhcnNlZCA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGlmICghdG9vbHMpIHJldHVybiBudWxsXG4gICAgY29uc3QgdG9vbCA9IGZpbmRUb29sQnlOYW1lKHRvb2xzLCBwYXJhbS5uYW1lKVxuICAgIGlmICghdG9vbCkgcmV0dXJuIG51bGxcbiAgICBjb25zdCBpbnB1dCA9IHRvb2wuaW5wdXRTY2hlbWEuc2FmZVBhcnNlKHBhcmFtLmlucHV0KVxuICAgIGNvbnN0IGRhdGEgPSBpbnB1dC5zdWNjZXNzID8gaW5wdXQuZGF0YSA6IHVuZGVmaW5lZFxuICAgIHJldHVybiB7XG4gICAgICB0b29sLFxuICAgICAgaW5wdXQsXG4gICAgICB1c2VyRmFjaW5nVG9vbE5hbWU6IHRvb2wudXNlckZhY2luZ05hbWUoZGF0YSksXG4gICAgICB1c2VyRmFjaW5nVG9vbE5hbWVCYWNrZ3JvdW5kQ29sb3I6XG4gICAgICAgIHRvb2wudXNlckZhY2luZ05hbWVCYWNrZ3JvdW5kQ29sb3I/LihkYXRhKSxcbiAgICAgIGlzVHJhbnNwYXJlbnRXcmFwcGVyOiB0b29sLmlzVHJhbnNwYXJlbnRXcmFwcGVyPy4oKSA/PyBmYWxzZSxcbiAgICB9XG4gIH0sIFt0b29scywgcGFyYW1dKVxuXG4gIGlmICghcGFyc2VkKSB7XG4gICAgLy8gR3VhcmQgYWdhaW5zdCB1bmRlZmluZWQgdG9vbHMgKHJlcXVpcmVkIHByb3ApIG9yIHVua25vd24gdG9vbCBuYW1lXG4gICAgbG9nRXJyb3IoXG4gICAgICBuZXcgRXJyb3IoXG4gICAgICAgIHRvb2xzXG4gICAgICAgICAgPyBgVG9vbCAke3BhcmFtLm5hbWV9IG5vdCBmb3VuZGBcbiAgICAgICAgICA6IGBUb29scyBhcnJheSBpcyB1bmRlZmluZWQgZm9yIHRvb2wgJHtwYXJhbS5uYW1lfWAsXG4gICAgICApLFxuICAgIClcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3Qge1xuICAgIHRvb2wsXG4gICAgaW5wdXQsXG4gICAgdXNlckZhY2luZ1Rvb2xOYW1lLFxuICAgIHVzZXJGYWNpbmdUb29sTmFtZUJhY2tncm91bmRDb2xvcixcbiAgICBpc1RyYW5zcGFyZW50V3JhcHBlcixcbiAgfSA9IHBhcnNlZFxuXG4gIGNvbnN0IGlzUmVzb2x2ZWQgPSBsb29rdXBzLnJlc29sdmVkVG9vbFVzZUlEcy5oYXMocGFyYW0uaWQpXG4gIGNvbnN0IGlzUXVldWVkID0gIWluUHJvZ3Jlc3NUb29sVXNlSURzLmhhcyhwYXJhbS5pZCkgJiYgIWlzUmVzb2x2ZWRcbiAgY29uc3QgaXNXYWl0aW5nRm9yUGVybWlzc2lvbiA9IHBlbmRpbmdXb3JrZXJSZXF1ZXN0Py50b29sVXNlSWQgPT09IHBhcmFtLmlkXG5cbiAgaWYgKGlzVHJhbnNwYXJlbnRXcmFwcGVyKSB7XG4gICAgaWYgKGlzUXVldWVkIHx8IGlzUmVzb2x2ZWQpIHJldHVybiBudWxsXG4gICAgcmV0dXJuIChcbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIHdpZHRoPVwiMTAwJVwiIGJhY2tncm91bmRDb2xvcj17Ymd9PlxuICAgICAgICB7cmVuZGVyVG9vbFVzZVByb2dyZXNzTWVzc2FnZShcbiAgICAgICAgICB0b29sLFxuICAgICAgICAgIHRvb2xzLFxuICAgICAgICAgIGxvb2t1cHMsXG4gICAgICAgICAgcGFyYW0uaWQsXG4gICAgICAgICAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2UsXG4gICAgICAgICAgeyB2ZXJib3NlLCBpblByb2dyZXNzVG9vbENhbGxDb3VudCwgaXNUcmFuc2NyaXB0TW9kZSB9LFxuICAgICAgICAgIHRlcm1pbmFsU2l6ZSxcbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGlmICh1c2VyRmFjaW5nVG9vbE5hbWUgPT09ICcnKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGNvbnN0IHJlbmRlcmVkVG9vbFVzZU1lc3NhZ2UgPSBpbnB1dC5zdWNjZXNzXG4gICAgPyByZW5kZXJUb29sVXNlTWVzc2FnZSh0b29sLCBpbnB1dC5kYXRhLCB7IHRoZW1lLCB2ZXJib3NlLCBjb21tYW5kcyB9KVxuICAgIDogbnVsbFxuICBpZiAocmVuZGVyZWRUb29sVXNlTWVzc2FnZSA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJyb3dcIlxuICAgICAganVzdGlmeUNvbnRlbnQ9XCJzcGFjZS1iZXR3ZWVuXCJcbiAgICAgIG1hcmdpblRvcD17YWRkTWFyZ2luID8gMSA6IDB9XG4gICAgICB3aWR0aD1cIjEwMCVcIlxuICAgICAgYmFja2dyb3VuZENvbG9yPXtiZ31cbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPEJveFxuICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJyb3dcIlxuICAgICAgICAgIGZsZXhXcmFwPVwibm93cmFwXCJcbiAgICAgICAgICBtaW5XaWR0aD17c3RyaW5nV2lkdGgodXNlckZhY2luZ1Rvb2xOYW1lKSArIChzaG91bGRTaG93RG90ID8gMiA6IDApfVxuICAgICAgICA+XG4gICAgICAgICAge3Nob3VsZFNob3dEb3QgJiZcbiAgICAgICAgICAgIChpc1F1ZXVlZCA/IChcbiAgICAgICAgICAgICAgPEJveCBtaW5XaWR0aD17Mn0+XG4gICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I9e2lzUXVldWVkfT57QkxBQ0tfQ0lSQ0xFfTwvVGV4dD5cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAvLyBXQVJOSU5HOiBUaGUgY29kZSBoZXJlIGFuZCBpbiBUb29sVXNlTG9hZGVyIGlzIHBhcnRpY3VsYXJseVxuICAgICAgICAgICAgICAvLyBzZW5zaXRpdmUgdG8gd2hhdCAqc2hvdWxkKiBqdXN0IGJlIHRyaXZpYWwgcmVmYWN0b3JpbmdzLiBTZWVcbiAgICAgICAgICAgICAgLy8gdGhlIGNvbW1lbnQgaW4gVG9vbFVzZUxvYWRlciBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgICAgICAgICA8VG9vbFVzZUxvYWRlclxuICAgICAgICAgICAgICAgIHNob3VsZEFuaW1hdGU9e3Nob3VsZEFuaW1hdGV9XG4gICAgICAgICAgICAgICAgaXNVbnJlc29sdmVkPXshaXNSZXNvbHZlZH1cbiAgICAgICAgICAgICAgICBpc0Vycm9yPXtsb29rdXBzLmVycm9yZWRUb29sVXNlSURzLmhhcyhwYXJhbS5pZCl9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8Qm94IGZsZXhTaHJpbms9ezB9PlxuICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgYm9sZFxuICAgICAgICAgICAgICB3cmFwPVwidHJ1bmNhdGUtZW5kXCJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yPXt1c2VyRmFjaW5nVG9vbE5hbWVCYWNrZ3JvdW5kQ29sb3J9XG4gICAgICAgICAgICAgIGNvbG9yPXtcbiAgICAgICAgICAgICAgICB1c2VyRmFjaW5nVG9vbE5hbWVCYWNrZ3JvdW5kQ29sb3IgPyAnaW52ZXJzZVRleHQnIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3VzZXJGYWNpbmdUb29sTmFtZX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L0JveD5cbiAgICAgICAgICB7cmVuZGVyZWRUb29sVXNlTWVzc2FnZSAhPT0gJycgJiYgKFxuICAgICAgICAgICAgPEJveCBmbGV4V3JhcD1cIm5vd3JhcFwiPlxuICAgICAgICAgICAgICA8VGV4dD4oe3JlbmRlcmVkVG9vbFVzZU1lc3NhZ2V9KTwvVGV4dD5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICl9XG4gICAgICAgICAgey8qIFJlbmRlciB0b29sLXNwZWNpZmljIHRhZ3MgKHRpbWVvdXQsIG1vZGVsLCByZXN1bWUgSUQsIGV0Yy4pICovfVxuICAgICAgICAgIHtpbnB1dC5zdWNjZXNzICYmXG4gICAgICAgICAgICB0b29sLnJlbmRlclRvb2xVc2VUYWcgJiZcbiAgICAgICAgICAgIHRvb2wucmVuZGVyVG9vbFVzZVRhZyhpbnB1dC5kYXRhKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHshaXNSZXNvbHZlZCAmJlxuICAgICAgICAgICFpc1F1ZXVlZCAmJlxuICAgICAgICAgIChpc0NsYXNzaWZpZXJDaGVja2luZyA/IChcbiAgICAgICAgICAgIDxNZXNzYWdlUmVzcG9uc2UgaGVpZ2h0PXsxfT5cbiAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgICAge2lzQXV0b0NsYXNzaWZpZXJcbiAgICAgICAgICAgICAgICAgID8gJ0F1dG8gY2xhc3NpZmllciBjaGVja2luZ1xcdTIwMjYnXG4gICAgICAgICAgICAgICAgICA6ICdCYXNoIGNsYXNzaWZpZXIgY2hlY2tpbmdcXHUyMDI2J31cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9NZXNzYWdlUmVzcG9uc2U+XG4gICAgICAgICAgKSA6IGlzV2FpdGluZ0ZvclBlcm1pc3Npb24gPyAoXG4gICAgICAgICAgICA8TWVzc2FnZVJlc3BvbnNlIGhlaWdodD17MX0+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPldhaXRpbmcgZm9yIHBlcm1pc3Npb27igKY8L1RleHQ+XG4gICAgICAgICAgICA8L01lc3NhZ2VSZXNwb25zZT5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgcmVuZGVyVG9vbFVzZVByb2dyZXNzTWVzc2FnZShcbiAgICAgICAgICAgICAgdG9vbCxcbiAgICAgICAgICAgICAgdG9vbHMsXG4gICAgICAgICAgICAgIGxvb2t1cHMsXG4gICAgICAgICAgICAgIHBhcmFtLmlkLFxuICAgICAgICAgICAgICBwcm9ncmVzc01lc3NhZ2VzRm9yTWVzc2FnZSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlcmJvc2UsXG4gICAgICAgICAgICAgICAgaW5Qcm9ncmVzc1Rvb2xDYWxsQ291bnQsXG4gICAgICAgICAgICAgICAgaXNUcmFuc2NyaXB0TW9kZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdGVybWluYWxTaXplLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICkpfVxuICAgICAgICB7IWlzUmVzb2x2ZWQgJiYgaXNRdWV1ZWQgJiYgcmVuZGVyVG9vbFVzZVF1ZXVlZE1lc3NhZ2UodG9vbCl9XG4gICAgICA8L0JveD5cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiByZW5kZXJUb29sVXNlTWVzc2FnZShcbiAgdG9vbDogVG9vbCxcbiAgaW5wdXQ6IHVua25vd24sXG4gIHtcbiAgICB0aGVtZSxcbiAgICB2ZXJib3NlLFxuICAgIGNvbW1hbmRzLFxuICB9OiB7IHRoZW1lOiBUaGVtZU5hbWU7IHZlcmJvc2U6IGJvb2xlYW47IGNvbW1hbmRzOiBDb21tYW5kW10gfSxcbik6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gdG9vbC5pbnB1dFNjaGVtYS5zYWZlUGFyc2UoaW5wdXQpXG4gICAgaWYgKCFwYXJzZWQuc3VjY2Vzcykge1xuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICAgIHJldHVybiB0b29sLnJlbmRlclRvb2xVc2VNZXNzYWdlKHBhcnNlZC5kYXRhLCB7IHRoZW1lLCB2ZXJib3NlLCBjb21tYW5kcyB9KVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ0Vycm9yKFxuICAgICAgbmV3IEVycm9yKGBFcnJvciByZW5kZXJpbmcgdG9vbCB1c2UgbWVzc2FnZSBmb3IgJHt0b29sLm5hbWV9OiAke2Vycm9yfWApLFxuICAgIClcbiAgICByZXR1cm4gJydcbiAgfVxufVxuXG5mdW5jdGlvbiByZW5kZXJUb29sVXNlUHJvZ3Jlc3NNZXNzYWdlKFxuICB0b29sOiBUb29sLFxuICB0b29sczogVG9vbHMsXG4gIGxvb2t1cHM6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkTWVzc2FnZUxvb2t1cHM+LFxuICB0b29sVXNlSUQ6IHN0cmluZyxcbiAgcHJvZ3Jlc3NNZXNzYWdlc0Zvck1lc3NhZ2U6IFByb2dyZXNzTWVzc2FnZVtdLFxuICB7XG4gICAgdmVyYm9zZSxcbiAgICBpblByb2dyZXNzVG9vbENhbGxDb3VudCxcbiAgICBpc1RyYW5zY3JpcHRNb2RlLFxuICB9OiB7XG4gICAgdmVyYm9zZTogYm9vbGVhblxuICAgIGluUHJvZ3Jlc3NUb29sQ2FsbENvdW50PzogbnVtYmVyXG4gICAgaXNUcmFuc2NyaXB0TW9kZT86IGJvb2xlYW5cbiAgfSxcbiAgdGVybWluYWxTaXplOiB7IGNvbHVtbnM6IG51bWJlcjsgcm93czogbnVtYmVyIH0sXG4pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0b29sUHJvZ3Jlc3NNZXNzYWdlcyA9IHByb2dyZXNzTWVzc2FnZXNGb3JNZXNzYWdlLmZpbHRlcihcbiAgICAobXNnKTogbXNnIGlzIFByb2dyZXNzTWVzc2FnZTxUb29sUHJvZ3Jlc3NEYXRhPiA9PlxuICAgICAgbXNnLmRhdGEudHlwZSAhPT0gJ2hvb2tfcHJvZ3Jlc3MnLFxuICApXG4gIHRyeSB7XG4gICAgY29uc3QgdG9vbE1lc3NhZ2VzID1cbiAgICAgIHRvb2wucmVuZGVyVG9vbFVzZVByb2dyZXNzTWVzc2FnZT8uKHRvb2xQcm9ncmVzc01lc3NhZ2VzLCB7XG4gICAgICAgIHRvb2xzLFxuICAgICAgICB2ZXJib3NlLFxuICAgICAgICB0ZXJtaW5hbFNpemUsXG4gICAgICAgIGluUHJvZ3Jlc3NUb29sQ2FsbENvdW50OiBpblByb2dyZXNzVG9vbENhbGxDb3VudCA/PyAxLFxuICAgICAgICBpc1RyYW5zY3JpcHRNb2RlLFxuICAgICAgfSkgPz8gbnVsbFxuICAgIHJldHVybiAoXG4gICAgICA8PlxuICAgICAgICA8U2VudHJ5RXJyb3JCb3VuZGFyeT5cbiAgICAgICAgICA8SG9va1Byb2dyZXNzTWVzc2FnZVxuICAgICAgICAgICAgaG9va0V2ZW50PVwiUHJlVG9vbFVzZVwiXG4gICAgICAgICAgICBsb29rdXBzPXtsb29rdXBzfVxuICAgICAgICAgICAgdG9vbFVzZUlEPXt0b29sVXNlSUR9XG4gICAgICAgICAgICB2ZXJib3NlPXt2ZXJib3NlfVxuICAgICAgICAgICAgaXNUcmFuc2NyaXB0TW9kZT17aXNUcmFuc2NyaXB0TW9kZX1cbiAgICAgICAgICAvPlxuICAgICAgICA8L1NlbnRyeUVycm9yQm91bmRhcnk+XG4gICAgICAgIHt0b29sTWVzc2FnZXN9XG4gICAgICA8Lz5cbiAgICApXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nRXJyb3IoXG4gICAgICBuZXcgRXJyb3IoXG4gICAgICAgIGBFcnJvciByZW5kZXJpbmcgdG9vbCB1c2UgcHJvZ3Jlc3MgbWVzc2FnZSBmb3IgJHt0b29sLm5hbWV9OiAke2Vycm9yfWAsXG4gICAgICApLFxuICAgIClcbiAgICByZXR1cm4gbnVsbFxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclRvb2xVc2VRdWV1ZWRNZXNzYWdlKHRvb2w6IFRvb2wpOiBSZWFjdC5SZWFjdE5vZGUge1xuICB0cnkge1xuICAgIHJldHVybiB0b29sLnJlbmRlclRvb2xVc2VRdWV1ZWRNZXNzYWdlPy4oKVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ0Vycm9yKFxuICAgICAgbmV3IEVycm9yKFxuICAgICAgICBgRXJyb3IgcmVuZGVyaW5nIHRvb2wgdXNlIHF1ZXVlZCBtZXNzYWdlIGZvciAke3Rvb2wubmFtZX06ICR7ZXJyb3J9YCxcbiAgICAgICksXG4gICAgKVxuICAgIHJldHVybiBudWxsXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLGNBQWNBLGlCQUFpQixRQUFRLHVDQUF1QztBQUM5RSxPQUFPQyxLQUFLLElBQUlDLE9BQU8sUUFBUSxPQUFPO0FBQ3RDLFNBQVNDLGVBQWUsUUFBUSw4QkFBOEI7QUFDOUQsY0FBY0MsU0FBUyxRQUFRLG9CQUFvQjtBQUNuRCxjQUFjQyxPQUFPLFFBQVEsbUJBQW1CO0FBQ2hELFNBQVNDLFlBQVksUUFBUSw0QkFBNEI7QUFDekQsU0FBU0MsV0FBVyxRQUFRLDBCQUEwQjtBQUN0RCxTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGNBQWM7QUFDbEQsU0FBU0MsaUNBQWlDLFFBQVEseUJBQXlCO0FBQzNFLFNBQ0VDLGNBQWMsRUFDZCxLQUFLQyxJQUFJLEVBQ1QsS0FBS0MsZ0JBQWdCLEVBQ3JCLEtBQUtDLEtBQUssUUFDTCxlQUFlO0FBQ3RCLGNBQWNDLGVBQWUsUUFBUSx3QkFBd0I7QUFDN0QsU0FBU0MsdUJBQXVCLFFBQVEsd0NBQXdDO0FBQ2hGLFNBQVNDLFFBQVEsUUFBUSxvQkFBb0I7QUFDN0MsY0FBY0MsbUJBQW1CLFFBQVEseUJBQXlCO0FBQ2xFLFNBQVNDLGVBQWUsUUFBUSx1QkFBdUI7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