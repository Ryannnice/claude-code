// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { useMemo } from 'react';
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准终端渲染的数据契约。
import type { DeepImmutable } from 'src/types/utils.js';
// 引入 useElapsedTime，将 ../../hooks/useElapsedTime.js 中已经封装好的能力接到本文件流程里。
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text、useTheme，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, useTheme } from '../../ink.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// 引入 getEmptyToolPermissionContext，将 ../../Tool.js 中已经封装好的能力接到本文件流程里。
import { getEmptyToolPermissionContext } from '../../Tool.js';
// 类型依赖 { LocalAgentTaskState } 来自 ../../tasks/LocalAgentTask/LocalAgentTask.js，用于校准终端渲染的数据契约。
import type { LocalAgentTaskState } from '../../tasks/LocalAgentTask/LocalAgentTask.js';
// 引入 getTools，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { getTools } from '../../tools.js';
// 复用 formatNumber 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatNumber } from '../../utils/format.js';
// 复用 extractTag 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { extractTag } from '../../utils/messages.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
// 引入 UserPlanMessage，将 ../messages/UserPlanMessage.js 中已经封装好的能力接到本文件流程里。
import { UserPlanMessage } from '../messages/UserPlanMessage.js';
// 引入 renderToolActivity，将 ./renderToolActivity.js 中已经封装好的能力接到本文件流程里。
import { renderToolActivity } from './renderToolActivity.js';
// 引入 getTaskStatusColor、getTaskStatusIcon，将 ./taskStatusUtils.js 中已经封装好的能力接到本文件流程里。
import { getTaskStatusColor, getTaskStatusIcon } from './taskStatusUtils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  agent: DeepImmutable<LocalAgentTaskState>;
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
  onKillAgent?: () => void;
  onBack?: () => void;
};
// AsyncAgentDetailDialog 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AsyncAgentDetailDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(54);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    agent,
    onDone,
    onKillAgent,
    onBack
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 Async Agent Detail Dialog分别处理这些返回值。
  const [theme] = useTheme();
  // t1 暂存 `getTools(getEmptyToolPermissionContext())` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getTools(getEmptyToolPermissionContext())` 生成的渲染片段，后续返回路径直接复用。
    t1 = getTools(getEmptyToolPermissionContext());
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // tools 集合 命名 `t1`，让后续代码直接表达这个值的用途。
  const tools = t1;
  // elapsedTime保存`useElapsedTime`，供终端渲染后续处理使用。
  const elapsedTime = useElapsedTime(agent.startTime, agent.status === "running", 1000, agent.totalPausedMs ?? 0);
  // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== onDone) {
    // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t2 = {
      "confirm:yes": onDone
    };
    // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onDone;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Confirmation"
    };
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t2, t3);
  // t4 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== agent.status || $[5] !== onBack || $[6] !== onDone || $[7] !== onKillAgent) {
    // t4 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = e => {
      // 当 `e.key` 匹配 `" "` 时，终端渲染执行对应分支。
      if (e.key === " ") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone();
      } else {
        // 只有 `e.key === "left" && onBack` 满足时，终端渲染才执行该分支。
        if (e.key === "left" && onBack) {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // 调用 onBack，触发终端渲染此处需要的副作用。
          onBack();
        } else {
          // 只有 `e.key === "x" && agent.status === "running" && on` 满足时，终端渲染才执行该分支。
          if (e.key === "x" && agent.status === "running" && onKillAgent) {
            // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
            e.preventDefault();
            // 调用 onKillAgent，触发终端渲染此处需要的副作用。
            onKillAgent();
          }
        }
      }
    };
    // $[4] 缓存 `agent.status`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = agent.status;
    // $[5] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onBack;
    // $[6] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onDone;
    // $[7] 缓存 `onKillAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onKillAgent;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // handleKeyDown保存`t4`，作为后续临时缓存值处理的输入。
  const handleKeyDown = t4;
  // t5 暂存 `extractTag(agent.prompt, "plan")` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== agent.prompt) {
    // t5 暂存 `extractTag(agent.prompt, "plan")` 生成的渲染片段，后续返回路径直接复用。
    t5 = extractTag(agent.prompt, "plan");
    // $[9] 缓存 `agent.prompt`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = agent.prompt;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // planContent 命名 `t5`，让后续代码直接表达这个值的用途。
  const planContent = t5;
  // displayPrompt格式化`prompt.substring`，供终端渲染后续处理使用。
  const displayPrompt = agent.prompt.length > 300 ? agent.prompt.substring(0, 297) + "\u2026" : agent.prompt;
  // tokenCount 数量保存`agent.result?.totalTokens ?? agent.progress?.tokenCount`，供后续判断或组装使用。
  const tokenCount = agent.result?.totalTokens ?? agent.progress?.tokenCount;
  // toolUseCount 数量 命名 `agent.result?.totalToolUseCount ?? agent.progress?.toolUs...`，让后续代码直接表达这个值的用途。
  const toolUseCount = agent.result?.totalToolUseCount ?? agent.progress?.toolUseCount;
  // 临时值 t6 命名 `agent.selectedAgent?.agentType ?? "agent"`，让后续代码直接表达这个值的用途。
  const t6 = agent.selectedAgent?.agentType ?? "agent";
  // t7标记终端 UI Async Agent Detail D...是否启用对应路径。
  const t7 = agent.description || "Async agent";
  // t8 暂存 `<Text>{t6} ›{" "}{t7}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== t6 || $[12] !== t7) {
    // t8 暂存 `<Text>{t6} ›{" "}{t7}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text>{t6} ›{" "}{t7}</Text>;
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // title 标题 命名 `t8`，让后续代码直接表达这个值的用途。
  const title = t8;
  // t9 暂存 `agent.status !== "running" && <Text color={getTaskStatusC...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== agent.status) {
    // t9 暂存 `agent.status !== "running" && <Text color={getTaskStatusC...` 生成的渲染片段，后续返回路径直接复用。
    t9 = agent.status !== "running" && <Text color={getTaskStatusColor(agent.status)}>{getTaskStatusIcon(agent.status)}{" "}{agent.status === "completed" ? "Completed" : agent.status === "failed" ? "Failed" : "Stopped"}{" \xB7 "}</Text>;
    // $[14] 缓存 `agent.status`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = agent.status;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // t10 暂存 `tokenCount !== undefined && tokenCount > 0 && <> · {forma...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== tokenCount) {
    // t10 暂存 `tokenCount !== undefined && tokenCount > 0 && <> · {forma...` 生成的渲染片段，后续返回路径直接复用。
    t10 = tokenCount !== undefined && tokenCount > 0 && <> · {formatNumber(tokenCount)} tokens</>;
    // $[16] 缓存 `tokenCount`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = tokenCount;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
  }
  // t11 暂存 `toolUseCount !== undefined && toolUseCount > 0 && <>{" "}...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== toolUseCount) {
    // t11 暂存 `toolUseCount !== undefined && toolUseCount > 0 && <>{" "}...` 生成的渲染片段，后续返回路径直接复用。
    t11 = toolUseCount !== undefined && toolUseCount > 0 && <>{" "}· {toolUseCount} {toolUseCount === 1 ? "tool" : "tools"}</>;
    // $[18] 缓存 `toolUseCount`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = toolUseCount;
    // $[19] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[19];
  }
  // t12 暂存 `<Text dimColor={true}>{elapsedTime}{t10}{t11}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== elapsedTime || $[21] !== t10 || $[22] !== t11) {
    // t12 暂存 `<Text dimColor={true}>{elapsedTime}{t10}{t11}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text dimColor={true}>{elapsedTime}{t10}{t11}</Text>;
    // $[20] 缓存 `elapsedTime`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = elapsedTime;
    // $[21] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t10;
    // $[22] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t11;
    // $[23] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[23];
  }
  // t13 暂存 `<Text>{t9}{t12}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== t12 || $[25] !== t9) {
    // t13 暂存 `<Text>{t9}{t12}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Text>{t9}{t12}</Text>;
    // $[24] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t12;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
    // $[26] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[26];
  }
  // subtitle 标题沿用 `t13` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const subtitle = t13;
  // t14 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== agent.status || $[28] !== onBack || $[29] !== onKillAgent) {
    // t14 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 生成的渲染片段，后续返回路径直接复用。
    t14 = exitState => exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline>{onBack && <KeyboardShortcutHint shortcut={"\u2190"} action="go back" />}<KeyboardShortcutHint shortcut="Esc/Enter/Space" action="close" />{agent.status === "running" && onKillAgent && <KeyboardShortcutHint shortcut="x" action="stop" />}</Byline>;
    // $[27] 缓存 `agent.status`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = agent.status;
    // $[28] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = onBack;
    // $[29] 缓存 `onKillAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = onKillAgent;
    // $[30] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[30];
  }
  // t15 暂存 `agent.status === "running" && agent.progress?.recentActiv...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== agent.progress || $[32] !== agent.status || $[33] !== theme) {
    // t15 暂存 `agent.status === "running" && agent.progress?.recentActiv...` 生成的渲染片段，后续返回路径直接复用。
    t15 = agent.status === "running" && agent.progress?.recentActivities && agent.progress.recentActivities.length > 0 && <Box flexDirection="column"><Text bold={true} dimColor={true}>Progress</Text>{agent.progress.recentActivities.map((activity, i) => <Text key={i} dimColor={i < agent.progress.recentActivities.length - 1} wrap="truncate-end">{i === agent.progress.recentActivities.length - 1 ? "\u203A " : "  "}{renderToolActivity(activity, tools, theme)}</Text>)}</Box>;
    // $[31] 缓存 `agent.progress`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = agent.progress;
    // $[32] 缓存 `agent.status`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = agent.status;
    // $[33] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = theme;
    // $[34] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[34];
  }
  // t16 暂存 `planContent ? <Box marginTop={1}><UserPlanMessage addMarg...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== displayPrompt || $[36] !== planContent) {
    // t16 暂存 `planContent ? <Box marginTop={1}><UserPlanMessage addMarg...` 生成的渲染片段，后续返回路径直接复用。
    t16 = planContent ? <Box marginTop={1}><UserPlanMessage addMargin={false} planContent={planContent} /></Box> : <Box flexDirection="column" marginTop={1}><Text bold={true} dimColor={true}>Prompt</Text><Text wrap="wrap">{displayPrompt}</Text></Box>;
    // $[35] 缓存 `displayPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = displayPrompt;
    // $[36] 缓存 `planContent`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = planContent;
    // $[37] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[37];
  }
  // t17 暂存 `agent.status === "failed" && agent.error && <Box flexDire...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== agent.error || $[39] !== agent.status) {
    // t17 暂存 `agent.status === "failed" && agent.error && <Box flexDire...` 生成的渲染片段，后续返回路径直接复用。
    t17 = agent.status === "failed" && agent.error && <Box flexDirection="column" marginTop={1}><Text bold={true} color="error">Error</Text><Text color="error" wrap="wrap">{agent.error}</Text></Box>;
    // $[38] 缓存 `agent.error`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = agent.error;
    // $[39] 缓存 `agent.status`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = agent.status;
    // $[40] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[40];
  }
  // t18 暂存 `<Box flexDirection="column">{t15}{t16}{t17}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[41] !== t15 || $[42] !== t16 || $[43] !== t17) {
    // t18 暂存 `<Box flexDirection="column">{t15}{t16}{t17}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Box flexDirection="column">{t15}{t16}{t17}</Box>;
    // $[41] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t15;
    // $[42] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t16;
    // $[43] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t17;
    // $[44] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[44];
  }
  // t19 暂存 `<Dialog title={title} subtitle={subtitle} onCancel={onDon...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== onDone || $[46] !== subtitle || $[47] !== t14 || $[48] !== t18 || $[49] !== title) {
    // t19 暂存 `<Dialog title={title} subtitle={subtitle} onCancel={onDon...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Dialog title={title} subtitle={subtitle} onCancel={onDone} color="background" inputGuide={t14}>{t18}</Dialog>;
    // $[45] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = onDone;
    // $[46] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = subtitle;
    // $[47] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t14;
    // $[48] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t18;
    // $[49] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = title;
    // $[50] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[50];
  }
  // t20 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[51] !== handleKeyDown || $[52] !== t19) {
    // t20 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Box flexDirection="column" tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t19}</Box>;
    // $[51] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = handleKeyDown;
    // $[52] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t19;
    // $[53] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[53];
  }
  // 返回 `t20`，作为终端渲染这次计算的结果。
  return t20;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJEZWVwSW1tdXRhYmxlIiwidXNlRWxhcHNlZFRpbWUiLCJLZXlib2FyZEV2ZW50IiwiQm94IiwiVGV4dCIsInVzZVRoZW1lIiwidXNlS2V5YmluZGluZ3MiLCJnZXRFbXB0eVRvb2xQZXJtaXNzaW9uQ29udGV4dCIsIkxvY2FsQWdlbnRUYXNrU3RhdGUiLCJnZXRUb29scyIsImZvcm1hdE51bWJlciIsImV4dHJhY3RUYWciLCJCeWxpbmUiLCJEaWFsb2ciLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIlVzZXJQbGFuTWVzc2FnZSIsInJlbmRlclRvb2xBY3Rpdml0eSIsImdldFRhc2tTdGF0dXNDb2xvciIsImdldFRhc2tTdGF0dXNJY29uIiwiUHJvcHMiLCJhZ2VudCIsIm9uRG9uZSIsIm9uS2lsbEFnZW50Iiwib25CYWNrIiwiQXN5bmNBZ2VudERldGFpbERpYWxvZyIsInQwIiwiJCIsIl9jIiwidGhlbWUiLCJ0MSIsIlN5bWJvbCIsImZvciIsInRvb2xzIiwiZWxhcHNlZFRpbWUiLCJzdGFydFRpbWUiLCJzdGF0dXMiLCJ0b3RhbFBhdXNlZE1zIiwidDIiLCJ0MyIsImNvbnRleHQiLCJ0NCIsImUiLCJrZXkiLCJwcmV2ZW50RGVmYXVsdCIsImhhbmRsZUtleURvd24iLCJ0NSIsInByb21wdCIsInBsYW5Db250ZW50IiwiZGlzcGxheVByb21wdCIsImxlbmd0aCIsInN1YnN0cmluZyIsInRva2VuQ291bnQiLCJyZXN1bHQiLCJ0b3RhbFRva2VucyIsInByb2dyZXNzIiwidG9vbFVzZUNvdW50IiwidG90YWxUb29sVXNlQ291bnQiLCJ0NiIsInNlbGVjdGVkQWdlbnQiLCJhZ2VudFR5cGUiLCJ0NyIsImRlc2NyaXB0aW9uIiwidDgiLCJ0aXRsZSIsInQ5IiwidDEwIiwidW5kZWZpbmVkIiwidDExIiwidDEyIiwidDEzIiwic3VidGl0bGUiLCJ0MTQiLCJleGl0U3RhdGUiLCJwZW5kaW5nIiwia2V5TmFtZSIsInQxNSIsInJlY2VudEFjdGl2aXRpZXMiLCJtYXAiLCJhY3Rpdml0eSIsImkiLCJ0MTYiLCJ0MTciLCJlcnJvciIsInQxOCIsInQxOSIsInQyMCJdLCJzb3VyY2VzIjpbIkFzeW5jQWdlbnREZXRhaWxEaWFsb2cudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IERlZXBJbW11dGFibGUgfSBmcm9tICdzcmMvdHlwZXMvdXRpbHMuanMnXG5pbXBvcnQgeyB1c2VFbGFwc2VkVGltZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUVsYXBzZWRUaW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi4vaW5rL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCwgdXNlVGhlbWUgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5ncyB9IGZyb20gJy4uLy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyBnZXRFbXB0eVRvb2xQZXJtaXNzaW9uQ29udGV4dCB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgdHlwZSB7IExvY2FsQWdlbnRUYXNrU3RhdGUgfSBmcm9tICcuLi8uLi90YXNrcy9Mb2NhbEFnZW50VGFzay9Mb2NhbEFnZW50VGFzay5qcydcbmltcG9ydCB7IGdldFRvb2xzIH0gZnJvbSAnLi4vLi4vdG9vbHMuanMnXG5pbXBvcnQgeyBmb3JtYXROdW1iZXIgfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyBleHRyYWN0VGFnIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgVXNlclBsYW5NZXNzYWdlIH0gZnJvbSAnLi4vbWVzc2FnZXMvVXNlclBsYW5NZXNzYWdlLmpzJ1xuaW1wb3J0IHsgcmVuZGVyVG9vbEFjdGl2aXR5IH0gZnJvbSAnLi9yZW5kZXJUb29sQWN0aXZpdHkuanMnXG5pbXBvcnQgeyBnZXRUYXNrU3RhdHVzQ29sb3IsIGdldFRhc2tTdGF0dXNJY29uIH0gZnJvbSAnLi90YXNrU3RhdHVzVXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGFnZW50OiBEZWVwSW1tdXRhYmxlPExvY2FsQWdlbnRUYXNrU3RhdGU+XG4gIG9uRG9uZTogKCkgPT4gdm9pZFxuICBvbktpbGxBZ2VudD86ICgpID0+IHZvaWRcbiAgb25CYWNrPzogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gQXN5bmNBZ2VudERldGFpbERpYWxvZyh7XG4gIGFnZW50LFxuICBvbkRvbmUsXG4gIG9uS2lsbEFnZW50LFxuICBvbkJhY2ssXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG5cbiAgLy8gR2V0IHRvb2xzIGZvciByZW5kZXJpbmcgYWN0aXZpdHkgbWVzc2FnZXNcbiAgY29uc3QgdG9vbHMgPSB1c2VNZW1vKCgpID0+IGdldFRvb2xzKGdldEVtcHR5VG9vbFBlcm1pc3Npb25Db250ZXh0KCkpLCBbXSlcblxuICBjb25zdCBlbGFwc2VkVGltZSA9IHVzZUVsYXBzZWRUaW1lKFxuICAgIGFnZW50LnN0YXJ0VGltZSxcbiAgICBhZ2VudC5zdGF0dXMgPT09ICdydW5uaW5nJyxcbiAgICAxMDAwLFxuICAgIGFnZW50LnRvdGFsUGF1c2VkTXMgPz8gMCxcbiAgKVxuXG4gIC8vIFJlc3RvcmUgY29uZmlybTp5ZXMgKEVudGVyL3kpIGRpc21pc3NhbCDigJQgRGlhbG9nIGhhbmRsZXMgY29uZmlybTpubyAoRXNjKVxuICAvLyBpbnRlcm5hbGx5IGJ1dCBkb2VzIE5PVCBhdXRvLXdpcmUgY29uZmlybTp5ZXMuXG4gIHVzZUtleWJpbmRpbmdzKFxuICAgIHtcbiAgICAgICdjb25maXJtOnllcyc6IG9uRG9uZSxcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSxcbiAgKVxuXG4gIC8vIENvbXBvbmVudC1zcGVjaWZpYyBzaG9ydGN1dHMgc2hvd24gaW4gVUkgaGludHMgKHg9c3RvcCkgYW5kXG4gIC8vIG5hdmlnYXRpb24ga2V5cyAoc3BhY2U9ZGlzbWlzcywgbGVmdD1iYWNrKS4gVGhlc2UgYXJlIGNvbnRleHQtZGVwZW5kZW50XG4gIC8vIGFjdGlvbnMgdGllZCB0byBhZ2VudCBzdGF0ZSwgbm90IHN0YW5kYXJkIGRpYWxvZyBrZXliaW5kaW5ncy5cbiAgLy8gTm90ZTogRGlhbG9nIGNvbXBvbmVudCBhbHJlYWR5IGhhbmRsZXMgRVNDIHZpYSBjb25maXJtOm5vIGtleWJpbmRpbmc7XG4gIC8vIGNvbmZpcm06eWVzIChFbnRlci95KSBpcyBoYW5kbGVkIGJ5IHVzZUtleWJpbmRpbmdzIGFib3ZlLlxuICBjb25zdCBoYW5kbGVLZXlEb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoZS5rZXkgPT09ICcgJykge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBvbkRvbmUoKVxuICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdsZWZ0JyAmJiBvbkJhY2spIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25CYWNrKClcbiAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAneCcgJiYgYWdlbnQuc3RhdHVzID09PSAncnVubmluZycgJiYgb25LaWxsQWdlbnQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25LaWxsQWdlbnQoKVxuICAgIH1cbiAgfVxuXG4gIC8vIEV4dHJhY3QgcGxhbiBmcm9tIHByb21wdCAtIGlmIHByZXNlbnQsIHdlIHNob3cgdGhlIHBsYW4gaW5zdGVhZCBvZiB0aGUgcHJvbXB0XG4gIGNvbnN0IHBsYW5Db250ZW50ID0gZXh0cmFjdFRhZyhhZ2VudC5wcm9tcHQsICdwbGFuJylcblxuICBjb25zdCBkaXNwbGF5UHJvbXB0ID1cbiAgICBhZ2VudC5wcm9tcHQubGVuZ3RoID4gMzAwXG4gICAgICA/IGFnZW50LnByb21wdC5zdWJzdHJpbmcoMCwgMjk3KSArICfigKYnXG4gICAgICA6IGFnZW50LnByb21wdFxuXG4gIC8vIEdldCB0b2tlbnMgYW5kIHRvb2wgdXNlcyAoZnJvbSByZXN1bHQgaWYgY29tcGxldGVkLCBvdGhlcndpc2UgZnJvbSBwcm9ncmVzcylcbiAgY29uc3QgdG9rZW5Db3VudCA9IGFnZW50LnJlc3VsdD8udG90YWxUb2tlbnMgPz8gYWdlbnQucHJvZ3Jlc3M/LnRva2VuQ291bnRcbiAgY29uc3QgdG9vbFVzZUNvdW50ID1cbiAgICBhZ2VudC5yZXN1bHQ/LnRvdGFsVG9vbFVzZUNvdW50ID8/IGFnZW50LnByb2dyZXNzPy50b29sVXNlQ291bnRcblxuICBjb25zdCB0aXRsZSA9IChcbiAgICA8VGV4dD5cbiAgICAgIHthZ2VudC5zZWxlY3RlZEFnZW50Py5hZ2VudFR5cGUgPz8gJ2FnZW50J30g4oC6eycgJ31cbiAgICAgIHthZ2VudC5kZXNjcmlwdGlvbiB8fCAnQXN5bmMgYWdlbnQnfVxuICAgIDwvVGV4dD5cbiAgKVxuXG4gIC8vIEJ1aWxkIHN1YnRpdGxlIHdpdGggc3RhdHVzIGFuZCBzdGF0c1xuICBjb25zdCBzdWJ0aXRsZSA9IChcbiAgICA8VGV4dD5cbiAgICAgIHthZ2VudC5zdGF0dXMgIT09ICdydW5uaW5nJyAmJiAoXG4gICAgICAgIDxUZXh0IGNvbG9yPXtnZXRUYXNrU3RhdHVzQ29sb3IoYWdlbnQuc3RhdHVzKX0+XG4gICAgICAgICAge2dldFRhc2tTdGF0dXNJY29uKGFnZW50LnN0YXR1cyl9eycgJ31cbiAgICAgICAgICB7YWdlbnQuc3RhdHVzID09PSAnY29tcGxldGVkJ1xuICAgICAgICAgICAgPyAnQ29tcGxldGVkJ1xuICAgICAgICAgICAgOiBhZ2VudC5zdGF0dXMgPT09ICdmYWlsZWQnXG4gICAgICAgICAgICAgID8gJ0ZhaWxlZCdcbiAgICAgICAgICAgICAgOiAnU3RvcHBlZCd9XG4gICAgICAgICAgeycgwrcgJ31cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKX1cbiAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICB7ZWxhcHNlZFRpbWV9XG4gICAgICAgIHt0b2tlbkNvdW50ICE9PSB1bmRlZmluZWQgJiYgdG9rZW5Db3VudCA+IDAgJiYgKFxuICAgICAgICAgIDw+IMK3IHtmb3JtYXROdW1iZXIodG9rZW5Db3VudCl9IHRva2VuczwvPlxuICAgICAgICApfVxuICAgICAgICB7dG9vbFVzZUNvdW50ICE9PSB1bmRlZmluZWQgJiYgdG9vbFVzZUNvdW50ID4gMCAmJiAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICDCtyB7dG9vbFVzZUNvdW50fSB7dG9vbFVzZUNvdW50ID09PSAxID8gJ3Rvb2wnIDogJ3Rvb2xzJ31cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKX1cbiAgICAgIDwvVGV4dD5cbiAgICA8L1RleHQ+XG4gIClcblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICBhdXRvRm9jdXNcbiAgICAgIG9uS2V5RG93bj17aGFuZGxlS2V5RG93bn1cbiAgICA+XG4gICAgICA8RGlhbG9nXG4gICAgICAgIHRpdGxlPXt0aXRsZX1cbiAgICAgICAgc3VidGl0bGU9e3N1YnRpdGxlfVxuICAgICAgICBvbkNhbmNlbD17b25Eb25lfVxuICAgICAgICBjb2xvcj1cImJhY2tncm91bmRcIlxuICAgICAgICBpbnB1dEd1aWRlPXtleGl0U3RhdGUgPT5cbiAgICAgICAgICBleGl0U3RhdGUucGVuZGluZyA/IChcbiAgICAgICAgICAgIDxUZXh0PlByZXNzIHtleGl0U3RhdGUua2V5TmFtZX0gYWdhaW4gdG8gZXhpdDwvVGV4dD5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgICAge29uQmFjayAmJiA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCLihpBcIiBhY3Rpb249XCJnbyBiYWNrXCIgLz59XG4gICAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVzYy9FbnRlci9TcGFjZVwiIGFjdGlvbj1cImNsb3NlXCIgLz5cbiAgICAgICAgICAgICAge2FnZW50LnN0YXR1cyA9PT0gJ3J1bm5pbmcnICYmIG9uS2lsbEFnZW50ICYmIChcbiAgICAgICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJ4XCIgYWN0aW9uPVwic3RvcFwiIC8+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgID5cbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgey8qIFJlY2VudCBhY3Rpdml0aWVzIGZvciBydW5uaW5nIGFnZW50cyAqL31cbiAgICAgICAgICB7YWdlbnQuc3RhdHVzID09PSAncnVubmluZycgJiZcbiAgICAgICAgICAgIGFnZW50LnByb2dyZXNzPy5yZWNlbnRBY3Rpdml0aWVzICYmXG4gICAgICAgICAgICBhZ2VudC5wcm9ncmVzcy5yZWNlbnRBY3Rpdml0aWVzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgICAgICA8VGV4dCBib2xkIGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgUHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAge2FnZW50LnByb2dyZXNzLnJlY2VudEFjdGl2aXRpZXMubWFwKChhY3Rpdml0eSwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgICAgICAga2V5PXtpfVxuICAgICAgICAgICAgICAgICAgICBkaW1Db2xvcj17aSA8IGFnZW50LnByb2dyZXNzIS5yZWNlbnRBY3Rpdml0aWVzIS5sZW5ndGggLSAxfVxuICAgICAgICAgICAgICAgICAgICB3cmFwPVwidHJ1bmNhdGUtZW5kXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAge2kgPT09IGFnZW50LnByb2dyZXNzIS5yZWNlbnRBY3Rpdml0aWVzIS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgICAgICAgPyAn4oC6ICdcbiAgICAgICAgICAgICAgICAgICAgICA6ICcgICd9XG4gICAgICAgICAgICAgICAgICAgIHtyZW5kZXJUb29sQWN0aXZpdHkoYWN0aXZpdHksIHRvb2xzLCB0aGVtZSl9XG4gICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgIHsvKiBQbGFuIHNlY3Rpb24gKGlmIHByZXNlbnQpIC0gc2hvd24gaW5zdGVhZCBvZiBwcm9tcHQgKi99XG4gICAgICAgICAge3BsYW5Db250ZW50ID8gKFxuICAgICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgICA8VXNlclBsYW5NZXNzYWdlIGFkZE1hcmdpbj17ZmFsc2V9IHBsYW5Db250ZW50PXtwbGFuQ29udGVudH0gLz5cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAvKiBQcm9tcHQgc2VjdGlvbiAtIG9ubHkgc2hvd24gd2hlbiBubyBwbGFuICovXG4gICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgICA8VGV4dCBib2xkIGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIFByb21wdFxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IHdyYXA9XCJ3cmFwXCI+e2Rpc3BsYXlQcm9tcHR9PC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIHsvKiBFcnJvciBkZXRhaWxzIGlmIGZhaWxlZCAqL31cbiAgICAgICAgICB7YWdlbnQuc3RhdHVzID09PSAnZmFpbGVkJyAmJiBhZ2VudC5lcnJvciAmJiAoXG4gICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgICAgICBFcnJvclxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIiB3cmFwPVwid3JhcFwiPlxuICAgICAgICAgICAgICAgIHthZ2VudC5lcnJvcn1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0RpYWxvZz5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxPQUFPLFFBQVEsT0FBTztBQUN0QyxjQUFjQyxhQUFhLFFBQVEsb0JBQW9CO0FBQ3ZELFNBQVNDLGNBQWMsUUFBUSwrQkFBK0I7QUFDOUQsY0FBY0MsYUFBYSxRQUFRLG9DQUFvQztBQUN2RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksRUFBRUMsUUFBUSxRQUFRLGNBQWM7QUFDbEQsU0FBU0MsY0FBYyxRQUFRLG9DQUFvQztBQUNuRSxTQUFTQyw2QkFBNkIsUUFBUSxlQUFlO0FBQzdELGNBQWNDLG1C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