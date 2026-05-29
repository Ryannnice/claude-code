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
// 类型依赖 { InProcessTeammateTaskState } 来自 ../../tasks/InProcessTeammateTask/types.js，用于校准终端渲染的数据契约。
import type { InProcessTeammateTaskState } from '../../tasks/InProcessTeammateTask/types.js';
// 引入 getTools，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { getTools } from '../../tools.js';
// 复用 formatNumber、truncateToWidth 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatNumber, truncateToWidth } from '../../utils/format.js';
// 复用 toInkColor 工具函数，把通用处理留在 ../../utils/ink.js 中维护。
import { toInkColor } from '../../utils/ink.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
// 引入 renderToolActivity，将 ./renderToolActivity.js 中已经封装好的能力接到本文件流程里。
import { renderToolActivity } from './renderToolActivity.js';
// 引入 describeTeammateActivity，将 ./taskStatusUtils.js 中已经封装好的能力接到本文件流程里。
import { describeTeammateActivity } from './taskStatusUtils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  teammate: DeepImmutable<InProcessTeammateTaskState>;
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
  onKill?: () => void;
  onBack?: () => void;
  onForeground?: () => void;
};
// InProcessTeammateDetailDialog 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function InProcessTeammateDetailDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(63);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    teammate,
    onDone,
    onKill,
    onBack,
    onForeground
  } = t0;
  // 从 `useTheme()` 按位置拆出 theme，让终端 UI 组件 In Process Teammate Detail...分别处理这些返回值。
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
  // tools 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const tools = t1;
  // elapsedTime保存`useElapsedTime`，供终端渲染后续处理使用。
  const elapsedTime = useElapsedTime(teammate.startTime, teammate.status === "running", 1000, teammate.totalPausedMs ?? 0);
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
  if ($[4] !== onBack || $[5] !== onDone || $[6] !== onForeground || $[7] !== onKill || $[8] !== teammate.status) {
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
          // 只有 `e.key === "x" && teammate.status === "running" &&` 满足时，终端渲染才执行该分支。
          if (e.key === "x" && teammate.status === "running" && onKill) {
            // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
            e.preventDefault();
            // 调用 onKill，触发终端渲染此处需要的副作用。
            onKill();
          } else {
            // 只有 `e.key === "f" && teammate.status === "running" &&` 满足时，终端渲染才执行该分支。
            if (e.key === "f" && teammate.status === "running" && onForeground) {
              // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
              e.preventDefault();
              // 调用 onForeground，触发终端渲染此处需要的副作用。
              onForeground();
            }
          }
        }
      }
    };
    // $[4] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onBack;
    // $[5] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onDone;
    // $[6] 缓存 `onForeground`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onForeground;
    // $[7] 缓存 `onKill`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onKill;
    // $[8] 缓存 `teammate.status`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = teammate.status;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // handleKeyDown 命名 `t4`，让后续代码直接表达这个值的用途。
  const handleKeyDown = t4;
  // t5 暂存 `describeTeammateActivity(teammate)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== teammate) {
    // t5 暂存 `describeTeammateActivity(teammate)` 生成的渲染片段，后续返回路径直接复用。
    t5 = describeTeammateActivity(teammate);
    // $[10] 缓存 `teammate`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = teammate;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[11];
  }
  // activity 命名 `t5`，让后续代码直接表达这个值的用途。
  const activity = t5;
  // tokenCount 数量保存`teammate.result?.totalTokens ?? teammate.progress?.tokenC...`，供后续判断或组装使用。
  const tokenCount = teammate.result?.totalTokens ?? teammate.progress?.tokenCount;
  // toolUseCount 数量保存`teammate.result?.totalToolUseCount ?? teammate.progress?....`，供终端 UI In Process Teammate ...后续判断或输出使用。
  const toolUseCount = teammate.result?.totalToolUseCount ?? teammate.progress?.toolUseCount;
  // t6 暂存 `truncateToWidth(teammate.prompt, 300)` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== teammate.prompt) {
    // t6 暂存 `truncateToWidth(teammate.prompt, 300)` 生成的渲染片段，后续返回路径直接复用。
    t6 = truncateToWidth(teammate.prompt, 300);
    // $[12] 缓存 `teammate.prompt`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = teammate.prompt;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // displayPrompt沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const displayPrompt = t6;
  // t7 暂存 `toInkColor(teammate.identity.color)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== teammate.identity.color) {
    // t7 暂存 `toInkColor(teammate.identity.color)` 生成的渲染片段，后续返回路径直接复用。
    t7 = toInkColor(teammate.identity.color);
    // $[14] 缓存 `teammate.identity.color`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = teammate.identity.color;
    // $[15] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[15];
  }
  // t8 暂存 `<Text color={t7}>@{teammate.identity.agentName}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t7 || $[17] !== teammate.identity.agentName) {
    // t8 暂存 `<Text color={t7}>@{teammate.identity.agentName}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text color={t7}>@{teammate.identity.agentName}</Text>;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
    // $[17] 缓存 `teammate.identity.agentName`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = teammate.identity.agentName;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // t9 暂存 `activity && <Text dimColor={true}> ({activity})</Text>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== activity) {
    // t9 暂存 `activity && <Text dimColor={true}> ({activity})</Text>` 生成的渲染片段，后续返回路径直接复用。
    t9 = activity && <Text dimColor={true}> ({activity})</Text>;
    // $[19] 缓存 `activity`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = activity;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // t10 暂存 `<Text>{t8}{t9}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== t8 || $[22] !== t9) {
    // t10 暂存 `<Text>{t8}{t9}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text>{t8}{t9}</Text>;
    // $[21] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t8;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
    // $[23] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[23];
  }
  // title 标题保存`t10`，作为后续临时缓存值处理的输入。
  const title = t10;
  // t11 暂存 `teammate.status !== "running" && <Text color={teammate.st...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== teammate.status) {
    // t11 暂存 `teammate.status !== "running" && <Text color={teammate.st...` 生成的渲染片段，后续返回路径直接复用。
    t11 = teammate.status !== "running" && <Text color={teammate.status === "completed" ? "success" : teammate.status === "killed" ? "warning" : "error"}>{teammate.status === "completed" ? "Completed" : teammate.status === "failed" ? "Failed" : "Stopped"}{" \xB7 "}</Text>;
    // $[24] 缓存 `teammate.status`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = teammate.status;
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[25];
  }
  // t12 暂存 `tokenCount !== undefined && tokenCount > 0 && <> · {forma...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== tokenCount) {
    // t12 暂存 `tokenCount !== undefined && tokenCount > 0 && <> · {forma...` 生成的渲染片段，后续返回路径直接复用。
    t12 = tokenCount !== undefined && tokenCount > 0 && <> · {formatNumber(tokenCount)} tokens</>;
    // $[26] 缓存 `tokenCount`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = tokenCount;
    // $[27] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[27];
  }
  // t13 暂存 `toolUseCount !== undefined && toolUseCount > 0 && <>{" "}...` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== toolUseCount) {
    // t13 暂存 `toolUseCount !== undefined && toolUseCount > 0 && <>{" "}...` 生成的渲染片段，后续返回路径直接复用。
    t13 = toolUseCount !== undefined && toolUseCount > 0 && <>{" "}· {toolUseCount} {toolUseCount === 1 ? "tool" : "tools"}</>;
    // $[28] 缓存 `toolUseCount`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = toolUseCount;
    // $[29] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[29];
  }
  // t14 暂存 `<Text dimColor={true}>{elapsedTime}{t12}{t13}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== elapsedTime || $[31] !== t12 || $[32] !== t13) {
    // t14 暂存 `<Text dimColor={true}>{elapsedTime}{t12}{t13}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text dimColor={true}>{elapsedTime}{t12}{t13}</Text>;
    // $[30] 缓存 `elapsedTime`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = elapsedTime;
    // $[31] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t12;
    // $[32] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t13;
    // $[33] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[33];
  }
  // t15 暂存 `<Text>{t11}{t14}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t11 || $[35] !== t14) {
    // t15 暂存 `<Text>{t11}{t14}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text>{t11}{t14}</Text>;
    // $[34] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t11;
    // $[35] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t14;
    // $[36] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[36];
  }
  // subtitle 标题沿用 `t15` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const subtitle = t15;
  // t16 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[37] !== onBack || $[38] !== onForeground || $[39] !== onKill || $[40] !== teammate.status) {
    // t16 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 生成的渲染片段，后续返回路径直接复用。
    t16 = exitState => exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline>{onBack && <KeyboardShortcutHint shortcut={"\u2190"} action="go back" />}<KeyboardShortcutHint shortcut="Esc/Enter/Space" action="close" />{teammate.status === "running" && onKill && <KeyboardShortcutHint shortcut="x" action="stop" />}{teammate.status === "running" && onForeground && <KeyboardShortcutHint shortcut="f" action="foreground" />}</Byline>;
    // $[37] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = onBack;
    // $[38] 缓存 `onForeground`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = onForeground;
    // $[39] 缓存 `onKill`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = onKill;
    // $[40] 缓存 `teammate.status`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = teammate.status;
    // $[41] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[41];
  }
  // t17 暂存 `teammate.status === "running" && teammate.progress?.recen...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[42] !== teammate.progress || $[43] !== teammate.status || $[44] !== theme) {
    // t17 暂存 `teammate.status === "running" && teammate.progress?.recen...` 生成的渲染片段，后续返回路径直接复用。
    t17 = teammate.status === "running" && teammate.progress?.recentActivities && teammate.progress.recentActivities.length > 0 && <Box flexDirection="column"><Text bold={true} dimColor={true}>Progress</Text>{teammate.progress.recentActivities.map((activity_0, i) => <Text key={i} dimColor={i < teammate.progress.recentActivities.length - 1} wrap="truncate-end">{i === teammate.progress.recentActivities.length - 1 ? "\u203A " : "  "}{renderToolActivity(activity_0, tools, theme)}</Text>)}</Box>;
    // $[42] 缓存 `teammate.progress`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = teammate.progress;
    // $[43] 缓存 `teammate.status`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = teammate.status;
    // $[44] 缓存 `theme`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = theme;
    // $[45] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[45];
  }
  // t18 暂存 `<Text bold={true} dimColor={true}>Prompt</Text>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
    // t18 暂存 `<Text bold={true} dimColor={true}>Prompt</Text>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Text bold={true} dimColor={true}>Prompt</Text>;
    // $[46] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[46];
  }
  // t19 暂存 `<Box flexDirection="column" marginTop={1}>{t18}<Text wrap...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[47] !== displayPrompt) {
    // t19 暂存 `<Box flexDirection="column" marginTop={1}>{t18}<Text wrap...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Box flexDirection="column" marginTop={1}>{t18}<Text wrap="wrap">{displayPrompt}</Text></Box>;
    // $[47] 缓存 `displayPrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = displayPrompt;
    // $[48] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[48];
  }
  // t20 暂存 `teammate.status === "failed" && teammate.error && <Box fl...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[49] !== teammate.error || $[50] !== teammate.status) {
    // t20 暂存 `teammate.status === "failed" && teammate.error && <Box fl...` 生成的渲染片段，后续返回路径直接复用。
    t20 = teammate.status === "failed" && teammate.error && <Box flexDirection="column" marginTop={1}><Text bold={true} color="error">Error</Text><Text color="error" wrap="wrap">{teammate.error}</Text></Box>;
    // $[49] 缓存 `teammate.error`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = teammate.error;
    // $[50] 缓存 `teammate.status`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = teammate.status;
    // $[51] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[51];
  }
  // t21 暂存 `<Dialog title={title} subtitle={subtitle} onCancel={onDon...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[52] !== onDone || $[53] !== subtitle || $[54] !== t16 || $[55] !== t17 || $[56] !== t19 || $[57] !== t20 || $[58] !== title) {
    // t21 暂存 `<Dialog title={title} subtitle={subtitle} onCancel={onDon...` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Dialog title={title} subtitle={subtitle} onCancel={onDone} color="background" inputGuide={t16}>{t17}{t19}{t20}</Dialog>;
    // $[52] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = onDone;
    // $[53] 缓存 `subtitle`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = subtitle;
    // $[54] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t16;
    // $[55] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t17;
    // $[56] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t19;
    // $[57] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t20;
    // $[58] 缓存 `title`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = title;
    // $[59] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[59];
  }
  // t22 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[60] !== handleKeyDown || $[61] !== t21) {
    // t22 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Box flexDirection="column" tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t21}</Box>;
    // $[60] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = handleKeyDown;
    // $[61] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t21;
    // $[62] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[62];
  }
  // 返回 `t22`，作为终端渲染这次计算的结果。
  return t22;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZU1lbW8iLCJEZWVwSW1tdXRhYmxlIiwidXNlRWxhcHNlZFRpbWUiLCJLZXlib2FyZEV2ZW50IiwiQm94IiwiVGV4dCIsInVzZVRoZW1lIiwidXNlS2V5YmluZGluZ3MiLCJnZXRFbXB0eVRvb2xQZXJtaXNzaW9uQ29udGV4dCIsIkluUHJvY2Vzc1RlYW1tYXRlVGFza1N0YXRlIiwiZ2V0VG9vbHMiLCJmb3JtYXROdW1iZXIiLCJ0cnVuY2F0ZVRvV2lkdGgiLCJ0b0lua0NvbG9yIiwiQnlsaW5lIiwiRGlhbG9nIiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJyZW5kZXJUb29sQWN0aXZpdHkiLCJkZXNjcmliZVRlYW1tYXRlQWN0aXZpdHkiLCJQcm9wcyIsInRlYW1tYXRlIiwib25Eb25lIiwib25LaWxsIiwib25CYWNrIiwib25Gb3JlZ3JvdW5kIiwiSW5Qcm9jZXNzVGVhbW1hdGVEZXRhaWxEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsInRoZW1lIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJ0b29scyIsImVsYXBzZWRUaW1lIiwic3RhcnRUaW1lIiwic3RhdHVzIiwidG90YWxQYXVzZWRNcyIsInQyIiwidDMiLCJjb250ZXh0IiwidDQiLCJlIiwia2V5IiwicHJldmVudERlZmF1bHQiLCJoYW5kbGVLZXlEb3duIiwidDUiLCJhY3Rpdml0eSIsInRva2VuQ291bnQiLCJyZXN1bHQiLCJ0b3RhbFRva2VucyIsInByb2dyZXNzIiwidG9vbFVzZUNvdW50IiwidG90YWxUb29sVXNlQ291bnQiLCJ0NiIsInByb21wdCIsImRpc3BsYXlQcm9tcHQiLCJ0NyIsImlkZW50aXR5IiwiY29sb3IiLCJ0OCIsImFnZW50TmFtZSIsInQ5IiwidDEwIiwidGl0bGUiLCJ0MTEiLCJ0MTIiLCJ1bmRlZmluZWQiLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJzdWJ0aXRsZSIsInQxNiIsImV4aXRTdGF0ZSIsInBlbmRpbmciLCJrZXlOYW1lIiwidDE3IiwicmVjZW50QWN0aXZpdGllcyIsImxlbmd0aCIsIm1hcCIsImFjdGl2aXR5XzAiLCJpIiwidDE4IiwidDE5IiwidDIwIiwiZXJyb3IiLCJ0MjEiLCJ0MjIiXSwic291cmNlcyI6WyJJblByb2Nlc3NUZWFtbWF0ZURldGFpbERpYWxvZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0LCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgRGVlcEltbXV0YWJsZSB9IGZyb20gJ3NyYy90eXBlcy91dGlscy5qcydcbmltcG9ydCB7IHVzZUVsYXBzZWRUaW1lIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlRWxhcHNlZFRpbWUuanMnXG5pbXBvcnQgdHlwZSB7IEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLi9pbmsvZXZlbnRzL2tleWJvYXJkLWV2ZW50LmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0LCB1c2VUaGVtZSB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IGdldEVtcHR5VG9vbFBlcm1pc3Npb25Db250ZXh0IH0gZnJvbSAnLi4vLi4vVG9vbC5qcydcbmltcG9ydCB0eXBlIHsgSW5Qcm9jZXNzVGVhbW1hdGVUYXNrU3RhdGUgfSBmcm9tICcuLi8uLi90YXNrcy9JblByb2Nlc3NUZWFtbWF0ZVRhc2svdHlwZXMuanMnXG5pbXBvcnQgeyBnZXRUb29scyB9IGZyb20gJy4uLy4uL3Rvb2xzLmpzJ1xuaW1wb3J0IHsgZm9ybWF0TnVtYmVyLCB0cnVuY2F0ZVRvV2lkdGggfSBmcm9tICcuLi8uLi91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyB0b0lua0NvbG9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvaW5rLmpzJ1xuaW1wb3J0IHsgQnlsaW5lIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0RpYWxvZy5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9LZXlib2FyZFNob3J0Y3V0SGludC5qcydcbmltcG9ydCB7IHJlbmRlclRvb2xBY3Rpdml0eSB9IGZyb20gJy4vcmVuZGVyVG9vbEFjdGl2aXR5LmpzJ1xuaW1wb3J0IHsgZGVzY3JpYmVUZWFtbWF0ZUFjdGl2aXR5IH0gZnJvbSAnLi90YXNrU3RhdHVzVXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHRlYW1tYXRlOiBEZWVwSW1tdXRhYmxlPEluUHJvY2Vzc1RlYW1tYXRlVGFza1N0YXRlPlxuICBvbkRvbmU6ICgpID0+IHZvaWRcbiAgb25LaWxsPzogKCkgPT4gdm9pZFxuICBvbkJhY2s/OiAoKSA9PiB2b2lkXG4gIG9uRm9yZWdyb3VuZD86ICgpID0+IHZvaWRcbn1cbmV4cG9ydCBmdW5jdGlvbiBJblByb2Nlc3NUZWFtbWF0ZURldGFpbERpYWxvZyh7XG4gIHRlYW1tYXRlLFxuICBvbkRvbmUsXG4gIG9uS2lsbCxcbiAgb25CYWNrLFxuICBvbkZvcmVncm91bmQsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt0aGVtZV0gPSB1c2VUaGVtZSgpXG4gIGNvbnN0IHRvb2xzID0gdXNlTWVtbygoKSA9PiBnZXRUb29scyhnZXRFbXB0eVRvb2xQZXJtaXNzaW9uQ29udGV4dCgpKSwgW10pXG5cbiAgY29uc3QgZWxhcHNlZFRpbWUgPSB1c2VFbGFwc2VkVGltZShcbiAgICB0ZWFtbWF0ZS5zdGFydFRpbWUsXG4gICAgdGVhbW1hdGUuc3RhdHVzID09PSAncnVubmluZycsXG4gICAgMTAwMCxcbiAgICB0ZWFtbWF0ZS50b3RhbFBhdXNlZE1zID8/IDAsXG4gIClcblxuICAvLyBSZXN0b3JlIGNvbmZpcm06eWVzIChFbnRlci95KSBkaXNtaXNzYWwg4oCUIERpYWxvZyBoYW5kbGVzIGNvbmZpcm06bm8gKEVzYylcbiAgdXNlS2V5YmluZGluZ3MoXG4gICAge1xuICAgICAgJ2NvbmZpcm06eWVzJzogb25Eb25lLFxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyB9LFxuICApXG5cbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSAnICcpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25Eb25lKClcbiAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnbGVmdCcgJiYgb25CYWNrKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIG9uQmFjaygpXG4gICAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ3gnICYmIHRlYW1tYXRlLnN0YXR1cyA9PT0gJ3J1bm5pbmcnICYmIG9uS2lsbCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBvbktpbGwoKVxuICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdmJyAmJiB0ZWFtbWF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJyAmJiBvbkZvcmVncm91bmQpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25Gb3JlZ3JvdW5kKClcbiAgICB9XG4gIH1cblxuICBjb25zdCBhY3Rpdml0eSA9IGRlc2NyaWJlVGVhbW1hdGVBY3Rpdml0eSh0ZWFtbWF0ZSlcblxuICBjb25zdCB0b2tlbkNvdW50ID1cbiAgICB0ZWFtbWF0ZS5yZXN1bHQ/LnRvdGFsVG9rZW5zID8/IHRlYW1tYXRlLnByb2dyZXNzPy50b2tlbkNvdW50XG4gIGNvbnN0IHRvb2xVc2VDb3VudCA9XG4gICAgdGVhbW1hdGUucmVzdWx0Py50b3RhbFRvb2xVc2VDb3VudCA/PyB0ZWFtbWF0ZS5wcm9ncmVzcz8udG9vbFVzZUNvdW50XG5cbiAgY29uc3QgZGlzcGxheVByb21wdCA9IHRydW5jYXRlVG9XaWR0aCh0ZWFtbWF0ZS5wcm9tcHQsIDMwMClcblxuICBjb25zdCB0aXRsZSA9IChcbiAgICA8VGV4dD5cbiAgICAgIDxUZXh0IGNvbG9yPXt0b0lua0NvbG9yKHRlYW1tYXRlLmlkZW50aXR5LmNvbG9yKX0+XG4gICAgICAgIEB7dGVhbW1hdGUuaWRlbnRpdHkuYWdlbnROYW1lfVxuICAgICAgPC9UZXh0PlxuICAgICAge2FjdGl2aXR5ICYmIDxUZXh0IGRpbUNvbG9yPiAoe2FjdGl2aXR5fSk8L1RleHQ+fVxuICAgIDwvVGV4dD5cbiAgKVxuXG4gIGNvbnN0IHN1YnRpdGxlID0gKFxuICAgIDxUZXh0PlxuICAgICAge3RlYW1tYXRlLnN0YXR1cyAhPT0gJ3J1bm5pbmcnICYmIChcbiAgICAgICAgPFRleHRcbiAgICAgICAgICBjb2xvcj17XG4gICAgICAgICAgICB0ZWFtbWF0ZS5zdGF0dXMgPT09ICdjb21wbGV0ZWQnXG4gICAgICAgICAgICAgID8gJ3N1Y2Nlc3MnXG4gICAgICAgICAgICAgIDogdGVhbW1hdGUuc3RhdHVzID09PSAna2lsbGVkJ1xuICAgICAgICAgICAgICAgID8gJ3dhcm5pbmcnXG4gICAgICAgICAgICAgICAgOiAnZXJyb3InXG4gICAgICAgICAgfVxuICAgICAgICA+XG4gICAgICAgICAge3RlYW1tYXRlLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCdcbiAgICAgICAgICAgID8gJ0NvbXBsZXRlZCdcbiAgICAgICAgICAgIDogdGVhbW1hdGUuc3RhdHVzID09PSAnZmFpbGVkJ1xuICAgICAgICAgICAgICA/ICdGYWlsZWQnXG4gICAgICAgICAgICAgIDogJ1N0b3BwZWQnfVxuICAgICAgICAgIHsnIMK3ICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAge2VsYXBzZWRUaW1lfVxuICAgICAgICB7dG9rZW5Db3VudCAhPT0gdW5kZWZpbmVkICYmIHRva2VuQ291bnQgPiAwICYmIChcbiAgICAgICAgICA8PiDCtyB7Zm9ybWF0TnVtYmVyKHRva2VuQ291bnQpfSB0b2tlbnM8Lz5cbiAgICAgICAgKX1cbiAgICAgICAge3Rvb2xVc2VDb3VudCAhPT0gdW5kZWZpbmVkICYmIHRvb2xVc2VDb3VudCA+IDAgJiYgKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAgwrcge3Rvb2xVc2VDb3VudH0ge3Rvb2xVc2VDb3VudCA9PT0gMSA/ICd0b29sJyA6ICd0b29scyd9XG4gICAgICAgICAgPC8+XG4gICAgICAgICl9XG4gICAgICA8L1RleHQ+XG4gICAgPC9UZXh0PlxuICApXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgIHRhYkluZGV4PXswfVxuICAgICAgYXV0b0ZvY3VzXG4gICAgICBvbktleURvd249e2hhbmRsZUtleURvd259XG4gICAgPlxuICAgICAgPERpYWxvZ1xuICAgICAgICB0aXRsZT17dGl0bGV9XG4gICAgICAgIHN1YnRpdGxlPXtzdWJ0aXRsZX1cbiAgICAgICAgb25DYW5jZWw9e29uRG9uZX1cbiAgICAgICAgY29sb3I9XCJiYWNrZ3JvdW5kXCJcbiAgICAgICAgaW5wdXRHdWlkZT17ZXhpdFN0YXRlID0+XG4gICAgICAgICAgZXhpdFN0YXRlLnBlbmRpbmcgPyAoXG4gICAgICAgICAgICA8VGV4dD5QcmVzcyB7ZXhpdFN0YXRlLmtleU5hbWV9IGFnYWluIHRvIGV4aXQ8L1RleHQ+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgICAgIHtvbkJhY2sgJiYgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwi4oaQXCIgYWN0aW9uPVwiZ28gYmFja1wiIC8+fVxuICAgICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFc2MvRW50ZXIvU3BhY2VcIiBhY3Rpb249XCJjbG9zZVwiIC8+XG4gICAgICAgICAgICAgIHt0ZWFtbWF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJyAmJiBvbktpbGwgJiYgKFxuICAgICAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cInhcIiBhY3Rpb249XCJzdG9wXCIgLz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge3RlYW1tYXRlLnN0YXR1cyA9PT0gJ3J1bm5pbmcnICYmIG9uRm9yZWdyb3VuZCAmJiAoXG4gICAgICAgICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiZlwiIGFjdGlvbj1cImZvcmVncm91bmRcIiAvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9CeWxpbmU+XG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICA+XG4gICAgICAgIHsvKiBSZWNlbnQgYWN0aXZpdGllcyBmb3IgcnVubmluZyB0ZWFtbWF0ZXMgKi99XG4gICAgICAgIHt0ZWFtbWF0ZS5zdGF0dXMgPT09ICdydW5uaW5nJyAmJlxuICAgICAgICAgIHRlYW1tYXRlLnByb2dyZXNzPy5yZWNlbnRBY3Rpdml0aWVzICYmXG4gICAgICAgICAgdGVhbW1hdGUucHJvZ3Jlc3MucmVjZW50QWN0aXZpdGllcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgICA8VGV4dCBib2xkIGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgIFByb2dyZXNzXG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAge3RlYW1tYXRlLnByb2dyZXNzLnJlY2VudEFjdGl2aXRpZXMubWFwKChhY3Rpdml0eSwgaSkgPT4gKFxuICAgICAgICAgICAgICAgIDxUZXh0XG4gICAgICAgICAgICAgICAgICBrZXk9e2l9XG4gICAgICAgICAgICAgICAgICBkaW1Db2xvcj17aSA8IHRlYW1tYXRlLnByb2dyZXNzIS5yZWNlbnRBY3Rpdml0aWVzIS5sZW5ndGggLSAxfVxuICAgICAgICAgICAgICAgICAgd3JhcD1cInRydW5jYXRlLWVuZFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2kgPT09IHRlYW1tYXRlLnByb2dyZXNzIS5yZWNlbnRBY3Rpdml0aWVzIS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICAgICAgID8gJ+KAuiAnXG4gICAgICAgICAgICAgICAgICAgIDogJyAgJ31cbiAgICAgICAgICAgICAgICAgIHtyZW5kZXJUb29sQWN0aXZpdHkoYWN0aXZpdHksIHRvb2xzLCB0aGVtZSl9XG4gICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgey8qIFByb21wdCBzZWN0aW9uICovfVxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIDxUZXh0IGJvbGQgZGltQ29sb3I+XG4gICAgICAgICAgICBQcm9tcHRcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgd3JhcD1cIndyYXBcIj57ZGlzcGxheVByb21wdH08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuXG4gICAgICAgIHsvKiBFcnJvciBkZXRhaWxzIGlmIGZhaWxlZCAqL31cbiAgICAgICAge3RlYW1tYXRlLnN0YXR1cyA9PT0gJ2ZhaWxlZCcgJiYgdGVhbW1hdGUuZXJyb3IgJiYgKFxuICAgICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICA8VGV4dCBib2xkIGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgICAgRXJyb3JcbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIiB3cmFwPVwid3JhcFwiPlxuICAgICAgICAgICAgICB7dGVhbW1hdGUuZXJyb3J9XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPC9Cb3g+XG4gICAgICAgICl9XG4gICAgICA8L0RpYWxvZz5cbiAgICA8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