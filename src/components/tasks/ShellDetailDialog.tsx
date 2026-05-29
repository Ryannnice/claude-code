// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、Suspense、use、useDeferredValue、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useDeferredValue, useEffect, useState } from 'react';
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准终端渲染的数据契约。
import type { DeepImmutable } from 'src/types/utils.js';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 引入 useTerminalSize，将 ../../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../../hooks/useTerminalSize.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// 类型依赖 { LocalShellTaskState } 来自 ../../tasks/LocalShellTask/guards.js，用于校准终端渲染的数据契约。
import type { LocalShellTaskState } from '../../tasks/LocalShellTask/guards.js';
// 复用 formatDuration、formatFileSize、truncateToWidth 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatDuration, formatFileSize, truncateToWidth } from '../../utils/format.js';
// 复用 tailFile 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { tailFile } from '../../utils/fsOperations.js';
// 复用 getTaskOutputPath 工具函数，把通用处理留在 ../../utils/task/diskOutput.js 中维护。
import { getTaskOutputPath } from '../../utils/task/diskOutput.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  shell: DeepImmutable<LocalShellTaskState>;
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
  // 这个回调绑定到 onKillShell?: () => void;，负责终端渲染在该局部场景下的响应。
  onKillShell?: () => void;
  // 这个回调绑定到 onBack?: () => void;，负责终端渲染在该局部场景下的响应。
  onBack?: () => void;
};
// SHELL_DETAIL_TAIL_BYTES 集合 命名 `8192`，让后续代码直接表达这个值的用途。
const SHELL_DETAIL_TAIL_BYTES = 8192;
// TaskOutputResult 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskOutputResult = {
  content: string;
  bytesTotal: number;
};

/**
 * Read the tail of the task output file. Only reads the last few KB,
 * not the entire file.
 */
// getTaskOutput 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getTaskOutput(shell: DeepImmutable<LocalShellTaskState>): Promise<TaskOutputResult> {
  // 路径读取`getTaskOutputPath`，供终端渲染后续处理使用。
  const path = getTaskOutputPath(shell.id);
  // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`tailFile`，供终端渲染后续处理使用。
    const result = await tailFile(path, SHELL_DETAIL_TAIL_BYTES);
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      content: result.content,
      bytesTotal: result.bytesTotal
    };
  } catch {
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      content: '',
      bytesTotal: 0
    };
  }
}
// ShellDetailDialog 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function ShellDetailDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(57);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    shell,
    onDone,
    onKillShell,
    onBack
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // t1 暂存 `() => getTaskOutput(shell)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== shell) {
    // t1 暂存 `() => getTaskOutput(shell)` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => getTaskOutput(shell);
    // $[0] 缓存 `shell`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = shell;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // outputPromise 异步任务 由 React state 持有，setOutputPromise 会在用户操作或异步结果返回时触发刷新。
  const [outputPromise, setOutputPromise] = useState(t1);
  // deferredOutputPromise 异步任务保存 `useDeferredValue` 启动的异步任务，稍后再决定等待还是后台完成。
  const deferredOutputPromise = useDeferredValue(outputPromise);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== shell) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // `shell.status` 与 `"running"` 不一致时刷新派生状态，避免使用过期结果。
      if (shell.status !== "running") {
        // 终端 UI 组件 Shell Detail Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // timer保存`setInterval`，供终端渲染后续处理使用。
      const timer = setInterval(_temp, 1000, setOutputPromise, shell);
      // 返回 `() => clearInterval(timer)`，作为终端渲染这次计算的结果。
      return () => clearInterval(timer);
    };
    // $[2] 缓存 `shell`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = shell;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // t3 暂存 `[shell.id, shell.status]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== shell.id || $[5] !== shell.status) {
    // t3 暂存 `[shell.id, shell.status]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [shell.id, shell.status];
    // $[4] 缓存 `shell.id`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = shell.id;
    // $[5] 缓存 `shell.status`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = shell.status;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `() => onDone("Shell details dismissed", {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== onDone) {
    // t4 暂存 `() => onDone("Shell details dismissed", {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => onDone("Shell details dismissed", {
      display: "system"
    });
    // $[7] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onDone;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[8];
  }
  // handleClose沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleClose = t4;
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== handleClose) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      "confirm:yes": handleClose
    };
    // $[9] 缓存 `handleClose`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = handleClose;
    // $[10] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[10];
  }
  // t6 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t6 = {
      context: "Confirmation"
    };
    // $[11] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[11];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t5, t6);
  // t7 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== onBack || $[13] !== onDone || $[14] !== onKillShell || $[15] !== shell.status) {
    // t7 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = e => {
      // 当 `e.key` 匹配 `" "` 时，终端渲染执行对应分支。
      if (e.key === " ") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 调用 onDone，触发终端渲染此处需要的副作用。
        onDone("Shell details dismissed", {
          display: "system"
        });
      } else {
        // 只有 `e.key === "left" && onBack` 满足时，终端渲染才执行该分支。
        if (e.key === "left" && onBack) {
          // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
          e.preventDefault();
          // 调用 onBack，触发终端渲染此处需要的副作用。
          onBack();
        } else {
          // 只有 `e.key === "x" && shell.status === "running" && on` 满足时，终端渲染才执行该分支。
          if (e.key === "x" && shell.status === "running" && onKillShell) {
            // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
            e.preventDefault();
            // 调用 onKillShell，触发终端渲染此处需要的副作用。
            onKillShell();
          }
        }
      }
    };
    // $[12] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onBack;
    // $[13] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = onDone;
    // $[14] 缓存 `onKillShell`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = onKillShell;
    // $[15] 缓存 `shell.status`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = shell.status;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // handleKeyDown 命名 `t7`，让后续代码直接表达这个值的用途。
  const handleKeyDown = t7;
  // isMonitor标记终端 UI Shell Detail Dialog是否启用对应路径。
  const isMonitor = shell.kind === "monitor";
  // t8 暂存 `truncateToWidth(shell.command, 280)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== shell.command) {
    // t8 暂存 `truncateToWidth(shell.command, 280)` 生成的渲染片段，后续返回路径直接复用。
    t8 = truncateToWidth(shell.command, 280);
    // $[17] 缓存 `shell.command`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = shell.command;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // displayCommand 命令数据 命名 `t8`，让后续代码直接表达这个值的用途。
  const displayCommand = t8;
  // t9保存`isMonitor ? "Monitor details" : "Shell details"`，供后续判断或组装使用。
  const t9 = isMonitor ? "Monitor details" : "Shell details";
  // t10 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== onBack || $[20] !== onKillShell || $[21] !== shell.status) {
    // t10 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 生成的渲染片段，后续返回路径直接复用。
    t10 = exitState => exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline>{onBack && <KeyboardShortcutHint shortcut={"\u2190"} action="go back" />}<KeyboardShortcutHint shortcut="Esc/Enter/Space" action="close" />{shell.status === "running" && onKillShell && <KeyboardShortcutHint shortcut="x" action="stop" />}</Byline>;
    // $[19] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = onBack;
    // $[20] 缓存 `onKillShell`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = onKillShell;
    // $[21] 缓存 `shell.status`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = shell.status;
    // $[22] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[22];
  }
  // t11 暂存 `<Text bold={true}>Status:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `<Text bold={true}>Status:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text bold={true}>Status:</Text>;
    // $[23] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[23];
  }
  // t12 暂存 `<Text>{t11}{" "}{shell.status === "running" ? <Text color...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== shell.result || $[25] !== shell.status) {
    // t12 暂存 `<Text>{t11}{" "}{shell.status === "running" ? <Text color...` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text>{t11}{" "}{shell.status === "running" ? <Text color="background">{shell.status}{shell.result?.code !== undefined && ` (exit code: ${shell.result.code})`}</Text> : shell.status === "completed" ? <Text color="success">{shell.status}{shell.result?.code !== undefined && ` (exit code: ${shell.result.code})`}</Text> : <Text color="error">{shell.status}{shell.result?.code !== undefined && ` (exit code: ${shell.result.code})`}</Text>}</Text>;
    // $[24] 缓存 `shell.result`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = shell.result;
    // $[25] 缓存 `shell.status`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = shell.status;
    // $[26] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[26];
  }
  // t13 暂存 `<Text bold={true}>Runtime:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t13 暂存 `<Text bold={true}>Runtime:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Text bold={true}>Runtime:</Text>;
    // $[27] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[27];
  }
  // t14 暂存 `shell.endTime ?? Date.now()` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== shell.endTime) {
    // t14 暂存 `shell.endTime ?? Date.now()` 生成的渲染片段，后续返回路径直接复用。
    t14 = shell.endTime ?? Date.now();
    // $[28] 缓存 `shell.endTime`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = shell.endTime;
    // $[29] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[29];
  }
  // t15保存`t14 - shell.startTime`，供后续判断或组装使用。
  const t15 = t14 - shell.startTime;
  // t16 暂存 `formatDuration(t15)` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== t15) {
    // t16 暂存 `formatDuration(t15)` 生成的渲染片段，后续返回路径直接复用。
    t16 = formatDuration(t15);
    // $[30] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t15;
    // $[31] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[31];
  }
  // t17 暂存 `<Text>{t13}{" "}{t16}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== t16) {
    // t17 暂存 `<Text>{t13}{" "}{t16}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text>{t13}{" "}{t16}</Text>;
    // $[32] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t16;
    // $[33] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[33];
  }
  // t18保存`isMonitor ? "Script:" : "Command:"`，供终端 UI Shell Detail Dialog后续判断或输出使用。
  const t18 = isMonitor ? "Script:" : "Command:";
  // t19 暂存 `<Text bold={true}>{t18}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t18) {
    // t19 暂存 `<Text bold={true}>{t18}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Text bold={true}>{t18}</Text>;
    // $[34] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t18;
    // $[35] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[35];
  }
  // t20 暂存 `<Text wrap="wrap">{t19}{" "}{displayCommand}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== displayCommand || $[37] !== t19) {
    // t20 暂存 `<Text wrap="wrap">{t19}{" "}{displayCommand}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t20 = <Text wrap="wrap">{t19}{" "}{displayCommand}</Text>;
    // $[36] 缓存 `displayCommand`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = displayCommand;
    // $[37] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t19;
    // $[38] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[38];
  }
  // t21 暂存 `<Box flexDirection="column">{t12}{t17}{t20}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== t12 || $[40] !== t17 || $[41] !== t20) {
    // t21 暂存 `<Box flexDirection="column">{t12}{t17}{t20}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Box flexDirection="column">{t12}{t17}{t20}</Box>;
    // $[39] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t12;
    // $[40] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t17;
    // $[41] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t20;
    // $[42] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[42];
  }
  // t22 暂存 `<Text bold={true}>Output:</Text>` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[43] === Symbol.for("react.memo_cache_sentinel")) {
    // t22 暂存 `<Text bold={true}>Output:</Text>` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Text bold={true}>Output:</Text>;
    // $[43] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[43];
  }
  // t23 暂存 `<Text dimColor={true}>Loading output…</Text>` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[44] === Symbol.for("react.memo_cache_sentinel")) {
    // t23 暂存 `<Text dimColor={true}>Loading output…</Text>` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Text dimColor={true}>Loading output…</Text>;
    // $[44] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[44];
  }
  // t24 暂存 `<Box flexDirection="column">{t22}<Suspense fallback={t23}...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== columns || $[46] !== deferredOutputPromise) {
    // t24 暂存 `<Box flexDirection="column">{t22}<Suspense fallback={t23}...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Box flexDirection="column">{t22}<Suspense fallback={t23}><ShellOutputContent outputPromise={deferredOutputPromise} columns={columns} /></Suspense></Box>;
    // $[45] 缓存 `columns`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = columns;
    // $[46] 缓存 `deferredOutputPromise`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = deferredOutputPromise;
    // $[47] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[47];
  }
  // t25 暂存 `<Dialog title={t9} onCancel={handleClose} color="backgrou...` 的派生结果，便于缓存命中时直接复用。
  let t25;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== handleClose || $[49] !== t10 || $[50] !== t21 || $[51] !== t24 || $[52] !== t9) {
    // t25 暂存 `<Dialog title={t9} onCancel={handleClose} color="backgrou...` 生成的渲染片段，后续返回路径直接复用。
    t25 = <Dialog title={t9} onCancel={handleClose} color="background" inputGuide={t10}>{t21}{t24}</Dialog>;
    // $[48] 缓存 `handleClose`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = handleClose;
    // $[49] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t10;
    // $[50] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t21;
    // $[51] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t24;
    // $[52] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t9;
    // $[53] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t25;
  } else {
    // t25 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t25 = $[53];
  }
  // t26 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[54] !== handleKeyDown || $[55] !== t25) {
    // t26 暂存 `<Box flexDirection="column" tabIndex={0} autoFocus={true}...` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Box flexDirection="column" tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t25}</Box>;
    // $[54] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = handleKeyDown;
    // $[55] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t25;
    // $[56] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[56] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[56];
  }
  // 返回 `t26`，作为终端渲染这次计算的结果。
  return t26;
}
// _temp 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(setOutputPromise_0, shell_0) {
  // 返回 `setOutputPromise_0(getTaskOutput(shell_0))`，作为终端渲染这次计算的结果。
  return setOutputPromise_0(getTaskOutput(shell_0));
}
// ShellOutputContentProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type ShellOutputContentProps = {
  outputPromise: Promise<TaskOutputResult>;
  columns: number;
};
// ShellOutputContent 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ShellOutputContent(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    outputPromise,
    columns
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    content,
    bytesTotal
  } = use(outputPromise);
  // 文本内容缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!content) {
    // t1 暂存 `<Text dimColor={true}>No output available</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Text dimColor={true}>No output available</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text dimColor={true}>No output available</Text>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // isIncomplete 先占位，稍后的条件分支会根据实际输入补齐它。
  let isIncomplete;
  // rendered 先占位，稍后的条件分支会根据实际输入补齐它。
  let rendered;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== bytesTotal || $[2] !== content) {
    // starts 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const starts = [];
    // pos 集合记录 `content.length` 是否成立，下一步按该结果分支。
    let pos = content.length;
    // 按索引扫描 `10 && pos > 0`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < 10 && pos > 0; i++) {
      // prev保存`content.lastIndexOf`，供终端渲染后续处理使用。
      const prev = content.lastIndexOf("\n", pos - 1);
      // starts 集合追加新条目，保持收集顺序与输入顺序一致。
      starts.push(prev + 1);
      // pos 集合更新为 `prev`，确保任务详情界面后续读取最新状态。
      pos = prev;
    }
    // 调用 starts.reverse，触发终端渲染此处需要的副作用。
    starts.reverse();
    // isIncomplete更新为 `bytesTotal > content.length`，确保任务详情界面后续读取最新状态。
    isIncomplete = bytesTotal > content.length;
    // rendered更新为 `[]`，确保任务详情界面后续读取最新状态。
    rendered = [];
    // 按索引扫描 `starts.length`，需要消费相邻参数时可以精确移动游标。
    for (let i_0 = 0; i_0 < starts.length; i_0++) {
      // start 命名 `starts[i_0]`，让后续代码直接表达这个值的用途。
      const start = starts[i_0];
      // end保存 `i_0 < starts.length - 1 ? starts[i_0 + 1] - 1 : content.l...` 的判断结果，供终端 UI Shell Detail Dialog后续分支直接复用。
      const end = i_0 < starts.length - 1 ? starts[i_0 + 1] - 1 : content.length;
      // line格式化`content.slice`，供终端渲染后续处理使用。
      const line = content.slice(start, end);
      // 满足 `line` 时，终端渲染执行该分支。
      if (line) {
        // rendered追加新条目，保持收集顺序与输入顺序一致。
        rendered.push(line);
      }
    }
    // $[1] 缓存 `bytesTotal`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = bytesTotal;
    // $[2] 缓存 `content`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = content;
    // $[3] 缓存 `isIncomplete`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = isIncomplete;
    // $[4] 缓存 `rendered`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = rendered;
  } else {
    // isIncomplete更新为 `$[3]`，确保任务详情界面后续读取最新状态。
    isIncomplete = $[3];
    // rendered更新为 `$[4]`，确保任务详情界面后续读取最新状态。
    rendered = $[4];
  }
  // 临时值 t1 命名 `columns - 6`，让后续代码直接表达这个值的用途。
  const t1 = columns - 6;
  // t2 暂存 `rendered.map(_temp2)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== rendered) {
    // t2 暂存 `rendered.map(_temp2)` 生成的渲染片段，后续返回路径直接复用。
    t2 = rendered.map(_temp2);
    // $[5] 缓存 `rendered`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = rendered;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // t3 暂存 `<Box borderStyle="round" paddingX={1} flexDirection="colu...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t1 || $[8] !== t2) {
    // t3 暂存 `<Box borderStyle="round" paddingX={1} flexDirection="colu...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box borderStyle="round" paddingX={1} flexDirection="column" height={12} maxWidth={t1}>{t2}</Box>;
    // $[7] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t1;
    // $[8] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t2;
    // $[9] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[9];
  }
  // t4记录 ``Showing ${rendered.length} lines`` 的数量，后续用它判断是否需要继续处理。
  const t4 = `Showing ${rendered.length} lines`;
  // t5 暂存 `isIncomplete ? ` of ${formatFileSize(bytesTotal)}` : ""` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== bytesTotal || $[11] !== isIncomplete) {
    // t5 暂存 `isIncomplete ? ` of ${formatFileSize(bytesTotal)}` : ""` 生成的渲染片段，后续返回路径直接复用。
    t5 = isIncomplete ? ` of ${formatFileSize(bytesTotal)}` : "";
    // $[10] 缓存 `bytesTotal`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = bytesTotal;
    // $[11] 缓存 `isIncomplete`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = isIncomplete;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // t6 暂存 `<Text dimColor={true} italic={true}>{t4}{t5}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== t4 || $[14] !== t5) {
    // t6 暂存 `<Text dimColor={true} italic={true}>{t4}{t5}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text dimColor={true} italic={true}>{t4}{t5}</Text>;
    // $[13] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t4;
    // $[14] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t5;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // t7 暂存 `<>{t3}{t6}</>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== t3 || $[17] !== t6) {
    // t7 暂存 `<>{t3}{t6}</>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <>{t3}{t6}</>;
    // $[16] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t3;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[18];
  }
  // 返回 `t7`，作为终端渲染这次计算的结果。
  return t7;
}
// _temp2 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(line_0, i_1) {
  // 返回 `<Text key={i_1} wrap="truncate-end">{line_0}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_1} wrap="truncate-end">{line_0}</Text>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlN1c3BlbnNlIiwidXNlIiwidXNlRGVmZXJyZWRWYWx1ZSIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiRGVlcEltbXV0YWJsZSIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwidXNlVGVybWluYWxTaXplIiwiS2V5Ym9hcmRFdmVudCIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5ncyIsIkxvY2FsU2hlbGxUYXNrU3RhdGUiLCJmb3JtYXREdXJhdGlvbiIsImZvcm1hdEZpbGVTaXplIiwidHJ1bmNhdGVUb1dpZHRoIiwidGFpbEZpbGUiLCJnZXRUYXNrT3V0cHV0UGF0aCIsIkJ5bGluZSIsIkRpYWxvZyIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwiUHJvcHMiLCJzaGVsbCIsIm9uRG9uZSIsInJlc3VsdCIsIm9wdGlvbnMiLCJkaXNwbGF5Iiwib25LaWxsU2hlbGwiLCJvbkJhY2siLCJTSEVMTF9ERVRBSUxfVEFJTF9CWVRFUyIsIlRhc2tPdXRwdXRSZXN1bHQiLCJjb250ZW50IiwiYnl0ZXNUb3RhbCIsImdldFRhc2tPdXRwdXQiLCJQcm9taXNlIiwicGF0aCIsImlkIiwiU2hlbGxEZXRhaWxEaWFsb2ciLCJ0MCIsIiQiLCJfYyIsImNvbHVtbnMiLCJ0MSIsIm91dHB1dFByb21pc2UiLCJzZXRPdXRwdXRQcm9taXNlIiwiZGVmZXJyZWRPdXRwdXRQcm9taXNlIiwidDIiLCJzdGF0dXMiLCJ0aW1lciIsInNldEludGVydmFsIiwiX3RlbXAiLCJjbGVhckludGVydmFsIiwidDMiLCJ0NCIsImhhbmRsZUNsb3NlIiwidDUiLCJ0NiIsIlN5bWJvbCIsImZvciIsImNvbnRleHQiLCJ0NyIsImUiLCJrZXkiLCJwcmV2ZW50RGVmYXVsdCIsImhhbmRsZUtleURvd24iLCJpc01vbml0b3IiLCJraW5kIiwidDgiLCJjb21tYW5kIiwiZGlzcGxheUNvbW1hbmQiLCJ0OSIsInQxMCIsImV4aXRTdGF0ZSIsInBlbmRpbmciLCJrZXlOYW1lIiwidDExIiwidDEyIiwiY29kZSIsInVuZGVmaW5lZCIsInQxMyIsInQxNCIsImVuZFRpbWUiLCJEYXRlIiwibm93IiwidDE1Iiwic3RhcnRUaW1lIiwidDE2IiwidDE3IiwidDE4IiwidDE5IiwidDIwIiwidDIxIiwidDIyIiwidDIzIiwidDI0IiwidDI1IiwidDI2Iiwic2V0T3V0cHV0UHJvbWlzZV8wIiwic2hlbGxfMCIsIlNoZWxsT3V0cHV0Q29udGVudFByb3BzIiwiU2hlbGxPdXRwdXRDb250ZW50IiwiaXNJbmNvbXBsZXRlIiwicmVuZGVyZWQiLCJzdGFydHMiLCJwb3MiLCJsZW5ndGgiLCJpIiwicHJldiIsImxhc3RJbmRleE9mIiwicHVzaCIsInJldmVyc2UiLCJpXzAiLCJzdGFydCIsImVuZCIsImxpbmUiLCJzbGljZSIsIm1hcCIsIl90ZW1wMiIsImxpbmVfMCIsImlfMSJdLCJzb3VyY2VzIjpbIlNoZWxsRGV0YWlsRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHtcbiAgU3VzcGVuc2UsXG4gIHVzZSxcbiAgdXNlRGVmZXJyZWRWYWx1ZSxcbiAgdXNlRWZmZWN0LFxuICB1c2VTdGF0ZSxcbn0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IERlZXBJbW11dGFibGUgfSBmcm9tICdzcmMvdHlwZXMvdXRpbHMuanMnXG5pbXBvcnQgdHlwZSB7IENvbW1hbmRSZXN1bHREaXNwbGF5IH0gZnJvbSAnLi4vLi4vY29tbWFuZHMuanMnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi8uLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgdHlwZSB7IEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLi9pbmsvZXZlbnRzL2tleWJvYXJkLWV2ZW50LmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgdXNlS2V5YmluZGluZ3MgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHR5cGUgeyBMb2NhbFNoZWxsVGFza1N0YXRlIH0gZnJvbSAnLi4vLi4vdGFza3MvTG9jYWxTaGVsbFRhc2svZ3VhcmRzLmpzJ1xuaW1wb3J0IHtcbiAgZm9ybWF0RHVyYXRpb24sXG4gIGZvcm1hdEZpbGVTaXplLFxuICB0cnVuY2F0ZVRvV2lkdGgsXG59IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IHRhaWxGaWxlIH0gZnJvbSAnLi4vLi4vdXRpbHMvZnNPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHsgZ2V0VGFza091dHB1dFBhdGggfSBmcm9tICcuLi8uLi91dGlscy90YXNrL2Rpc2tPdXRwdXQuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzaGVsbDogRGVlcEltbXV0YWJsZTxMb2NhbFNoZWxsVGFza1N0YXRlPlxuICBvbkRvbmU6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHsgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IH0sXG4gICkgPT4gdm9pZFxuICBvbktpbGxTaGVsbD86ICgpID0+IHZvaWRcbiAgb25CYWNrPzogKCkgPT4gdm9pZFxufVxuXG5jb25zdCBTSEVMTF9ERVRBSUxfVEFJTF9CWVRFUyA9IDgxOTJcblxudHlwZSBUYXNrT3V0cHV0UmVzdWx0ID0ge1xuICBjb250ZW50OiBzdHJpbmdcbiAgYnl0ZXNUb3RhbDogbnVtYmVyXG59XG5cbi8qKlxuICogUmVhZCB0aGUgdGFpbCBvZiB0aGUgdGFzayBvdXRwdXQgZmlsZS4gT25seSByZWFkcyB0aGUgbGFzdCBmZXcgS0IsXG4gKiBub3QgdGhlIGVudGlyZSBmaWxlLlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRUYXNrT3V0cHV0KFxuICBzaGVsbDogRGVlcEltbXV0YWJsZTxMb2NhbFNoZWxsVGFza1N0YXRlPixcbik6IFByb21pc2U8VGFza091dHB1dFJlc3VsdD4ge1xuICBjb25zdCBwYXRoID0gZ2V0VGFza091dHB1dFBhdGgoc2hlbGwuaWQpXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGFpbEZpbGUocGF0aCwgU0hFTExfREVUQUlMX1RBSUxfQllURVMpXG4gICAgcmV0dXJuIHsgY29udGVudDogcmVzdWx0LmNvbnRlbnQsIGJ5dGVzVG90YWw6IHJlc3VsdC5ieXRlc1RvdGFsIH1cbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgY29udGVudDogJycsIGJ5dGVzVG90YWw6IDAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTaGVsbERldGFpbERpYWxvZyh7XG4gIHNoZWxsLFxuICBvbkRvbmUsXG4gIG9uS2lsbFNoZWxsLFxuICBvbkJhY2ssXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcblxuICAvLyBQcm9taXNlIGNyZWF0ZWQgaW4gaW5pdGlhbGl6ZXIgKG5vdCBkdXJpbmcgcmVuZGVyKS4gRm9yIHJ1bm5pbmcgc2hlbGxzLFxuICAvLyB0aGUgZWZmZWN0IHRpbWVyIHJlcGxhY2VzIGl0IHBlcmlvZGljYWxseSB0byBwaWNrIHVwIG5ldyBvdXRwdXQuXG4gIC8vIHVzZURlZmVycmVkVmFsdWUga2VlcHMgc2hvd2luZyB0aGUgcHJldmlvdXMgb3V0cHV0IHdoaWxlIHRoZSBuZXcgcHJvbWlzZVxuICAvLyByZXNvbHZlcywgcHJldmVudGluZyB0aGUgU3VzcGVuc2UgZmFsbGJhY2sgZnJvbSBmbGlja2VyaW5nLlxuICBjb25zdCBbb3V0cHV0UHJvbWlzZSwgc2V0T3V0cHV0UHJvbWlzZV0gPSB1c2VTdGF0ZTxQcm9taXNlPFRhc2tPdXRwdXRSZXN1bHQ+PihcbiAgICAoKSA9PiBnZXRUYXNrT3V0cHV0KHNoZWxsKSxcbiAgKVxuICBjb25zdCBkZWZlcnJlZE91dHB1dFByb21pc2UgPSB1c2VEZWZlcnJlZFZhbHVlKG91dHB1dFByb21pc2UpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoc2hlbGwuc3RhdHVzICE9PSAncnVubmluZycpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKFxuICAgICAgKHNldE91dHB1dFByb21pc2UsIHNoZWxsKSA9PiBzZXRPdXRwdXRQcm9taXNlKGdldFRhc2tPdXRwdXQoc2hlbGwpKSxcbiAgICAgIDEwMDAsXG4gICAgICBzZXRPdXRwdXRQcm9taXNlLFxuICAgICAgc2hlbGwsXG4gICAgKVxuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKVxuICB9LCBbc2hlbGwuaWQsIHNoZWxsLnN0YXR1c10pXG5cbiAgLy8gSGFuZGxlIHN0YW5kYXJkIGNsb3NlIGFjdGlvblxuICBjb25zdCBoYW5kbGVDbG9zZSA9ICgpID0+XG4gICAgb25Eb25lKCdTaGVsbCBkZXRhaWxzIGRpc21pc3NlZCcsIHsgZGlzcGxheTogJ3N5c3RlbScgfSlcblxuICAvLyBIYW5kbGUgYWRkaXRpb25hbCBjbG9zZSBhY3Rpb25zIGJleW9uZCBEaWFsb2cncyBidWlsdC1pbiBFc2MgaGFuZGxlclxuICB1c2VLZXliaW5kaW5ncyhcbiAgICB7XG4gICAgICAnY29uZmlybTp5ZXMnOiBoYW5kbGVDbG9zZSxcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSxcbiAgKVxuXG4gIC8vIEhhbmRsZSBkaWFsb2ctc3BlY2lmaWMga2V5c1xuICBjb25zdCBoYW5kbGVLZXlEb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoZS5rZXkgPT09ICcgJykge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBvbkRvbmUoJ1NoZWxsIGRldGFpbHMgZGlzbWlzc2VkJywgeyBkaXNwbGF5OiAnc3lzdGVtJyB9KVxuICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09ICdsZWZ0JyAmJiBvbkJhY2spIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25CYWNrKClcbiAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAneCcgJiYgc2hlbGwuc3RhdHVzID09PSAncnVubmluZycgJiYgb25LaWxsU2hlbGwpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25LaWxsU2hlbGwoKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRydW5jYXRlIGNvbW1hbmQgaWYgdG9vIGxvbmcgKGZvciBkaXNwbGF5IHB1cnBvc2VzKVxuICBjb25zdCBpc01vbml0b3IgPSBzaGVsbC5raW5kID09PSAnbW9uaXRvcidcbiAgY29uc3QgZGlzcGxheUNvbW1hbmQgPSB0cnVuY2F0ZVRvV2lkdGgoc2hlbGwuY29tbWFuZCwgMjgwKVxuXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICB0YWJJbmRleD17MH1cbiAgICAgIGF1dG9Gb2N1c1xuICAgICAgb25LZXlEb3duPXtoYW5kbGVLZXlEb3dufVxuICAgID5cbiAgICAgIDxEaWFsb2dcbiAgICAgICAgdGl0bGU9e2lzTW9uaXRvciA/ICdNb25pdG9yIGRldGFpbHMnIDogJ1NoZWxsIGRldGFpbHMnfVxuICAgICAgICBvbkNhbmNlbD17aGFuZGxlQ2xvc2V9XG4gICAgICAgIGNvbG9yPVwiYmFja2dyb3VuZFwiXG4gICAgICAgIGlucHV0R3VpZGU9e2V4aXRTdGF0ZSA9PlxuICAgICAgICAgIGV4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgICAgICAgICAgPFRleHQ+UHJlc3Mge2V4aXRTdGF0ZS5rZXlOYW1lfSBhZ2FpbiB0byBleGl0PC9UZXh0PlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8QnlsaW5lPlxuICAgICAgICAgICAgICB7b25CYWNrICYmIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIuKGkFwiIGFjdGlvbj1cImdvIGJhY2tcIiAvPn1cbiAgICAgICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwiRXNjL0VudGVyL1NwYWNlXCIgYWN0aW9uPVwiY2xvc2VcIiAvPlxuICAgICAgICAgICAgICB7c2hlbGwuc3RhdHVzID09PSAncnVubmluZycgJiYgb25LaWxsU2hlbGwgJiYgKFxuICAgICAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cInhcIiBhY3Rpb249XCJzdG9wXCIgLz5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDwvQnlsaW5lPlxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgPlxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+U3RhdHVzOjwvVGV4dD57JyAnfVxuICAgICAgICAgICAge3NoZWxsLnN0YXR1cyA9PT0gJ3J1bm5pbmcnID8gKFxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImJhY2tncm91bmRcIj5cbiAgICAgICAgICAgICAgICB7c2hlbGwuc3RhdHVzfVxuICAgICAgICAgICAgICAgIHtzaGVsbC5yZXN1bHQ/LmNvZGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgICAgYCAoZXhpdCBjb2RlOiAke3NoZWxsLnJlc3VsdC5jb2RlfSlgfVxuICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICApIDogc2hlbGwuc3RhdHVzID09PSAnY29tcGxldGVkJyA/IChcbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+XG4gICAgICAgICAgICAgICAge3NoZWxsLnN0YXR1c31cbiAgICAgICAgICAgICAgICB7c2hlbGwucmVzdWx0Py5jb2RlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgICAgICAgIGAgKGV4aXQgY29kZTogJHtzaGVsbC5yZXN1bHQuY29kZX0pYH1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgICAgICAgIHtzaGVsbC5zdGF0dXN9XG4gICAgICAgICAgICAgICAge3NoZWxsLnJlc3VsdD8uY29kZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgICBgIChleGl0IGNvZGU6ICR7c2hlbGwucmVzdWx0LmNvZGV9KWB9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgYm9sZD5SdW50aW1lOjwvVGV4dD57JyAnfVxuICAgICAgICAgICAge2Zvcm1hdER1cmF0aW9uKChzaGVsbC5lbmRUaW1lID8/IERhdGUubm93KCkpIC0gc2hlbGwuc3RhcnRUaW1lKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgd3JhcD1cIndyYXBcIj5cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+e2lzTW9uaXRvciA/ICdTY3JpcHQ6JyA6ICdDb21tYW5kOid9PC9UZXh0PnsnICd9XG4gICAgICAgICAgICB7ZGlzcGxheUNvbW1hbmR9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICA8L0JveD5cblxuICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICA8VGV4dCBib2xkPk91dHB1dDo8L1RleHQ+XG4gICAgICAgICAgPFN1c3BlbnNlIGZhbGxiYWNrPXs8VGV4dCBkaW1Db2xvcj5Mb2FkaW5nIG91dHB1dOKApjwvVGV4dD59PlxuICAgICAgICAgICAgPFNoZWxsT3V0cHV0Q29udGVudFxuICAgICAgICAgICAgICBvdXRwdXRQcm9taXNlPXtkZWZlcnJlZE91dHB1dFByb21pc2V9XG4gICAgICAgICAgICAgIGNvbHVtbnM9e2NvbHVtbnN9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvU3VzcGVuc2U+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9EaWFsb2c+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxudHlwZSBTaGVsbE91dHB1dENvbnRlbnRQcm9wcyA9IHtcbiAgb3V0cHV0UHJvbWlzZTogUHJvbWlzZTxUYXNrT3V0cHV0UmVzdWx0PlxuICBjb2x1bW5zOiBudW1iZXJcbn1cblxuZnVuY3Rpb24gU2hlbGxPdXRwdXRDb250ZW50KHtcbiAgb3V0cHV0UHJvbWlzZSxcbiAgY29sdW1ucyxcbn06IFNoZWxsT3V0cHV0Q29udGVudFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBjb250ZW50LCBieXRlc1RvdGFsIH0gPSB1c2Uob3V0cHV0UHJvbWlzZSlcblxuICBpZiAoIWNvbnRlbnQpIHtcbiAgICByZXR1cm4gPFRleHQgZGltQ29sb3I+Tm8gb3V0cHV0IGF2YWlsYWJsZTwvVGV4dD5cbiAgfVxuXG4gIC8vIEZpbmQgbGFzdCAxMCBsaW5lIGJvdW5kYXJpZXMgdmlhIGxhc3RJbmRleE9mXG4gIGNvbnN0IHN0YXJ0czogbnVtYmVyW10gPSBbXVxuICBsZXQgcG9zID0gY29udGVudC5sZW5ndGhcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMCAmJiBwb3MgPiAwOyBpKyspIHtcbiAgICBjb25zdCBwcmV2ID0gY29udGVudC5sYXN0SW5kZXhPZignXFxuJywgcG9zIC0gMSlcbiAgICBzdGFydHMucHVzaChwcmV2ICsgMSlcbiAgICBwb3MgPSBwcmV2XG4gIH1cbiAgc3RhcnRzLnJldmVyc2UoKVxuICBjb25zdCBpc0luY29tcGxldGUgPSBieXRlc1RvdGFsID4gY29udGVudC5sZW5ndGhcblxuICAvLyBCdWlsZCBsaW5lcywgc2tpcCBlbXB0eSB0cmFpbGluZy9sZWFkaW5nIHNlZ21lbnRzXG4gIGNvbnN0IHJlbmRlcmVkOiBzdHJpbmdbXSA9IFtdXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBzdGFydHNbaV0hXG4gICAgY29uc3QgZW5kID0gaSA8IHN0YXJ0cy5sZW5ndGggLSAxID8gc3RhcnRzW2kgKyAxXSEgLSAxIDogY29udGVudC5sZW5ndGhcbiAgICBjb25zdCBsaW5lID0gY29udGVudC5zbGljZShzdGFydCwgZW5kKVxuICAgIGlmIChsaW5lKSByZW5kZXJlZC5wdXNoKGxpbmUpXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8Qm94XG4gICAgICAgIGJvcmRlclN0eWxlPVwicm91bmRcIlxuICAgICAgICBwYWRkaW5nWD17MX1cbiAgICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICAgIGhlaWdodD17MTJ9XG4gICAgICAgIG1heFdpZHRoPXtjb2x1bW5zIC0gNn1cbiAgICAgID5cbiAgICAgICAge3JlbmRlcmVkLm1hcCgobGluZSwgaSkgPT4gKFxuICAgICAgICAgIDxUZXh0IGtleT17aX0gd3JhcD1cInRydW5jYXRlLWVuZFwiPlxuICAgICAgICAgICAge2xpbmV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApKX1cbiAgICAgIDwvQm94PlxuICAgICAgPFRleHQgZGltQ29sb3IgaXRhbGljPlxuICAgICAgICB7YFNob3dpbmcgJHtyZW5kZXJlZC5sZW5ndGh9IGxpbmVzYH1cbiAgICAgICAge2lzSW5jb21wbGV0ZSA/IGAgb2YgJHtmb3JtYXRGaWxlU2l6ZShieXRlc1RvdGFsKX1gIDogJyd9XG4gICAgICA8L1RleHQ+XG4gICAgPC8+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLEtBQUssSUFDVkMsUUFBUSxFQUNSQyxHQUFHLEVBQ0hDLGdCQUFnQixFQUNoQkMsU0FBUyxFQUNUQyxRQUFRLFFBQ0gsT0FBTztBQUNkLGNBQWNDLGFBQWEsUUFBUSxvQkFBb0I7QUFDdkQsY0FBY0Msb0JBQW9CLFFBQVEsbUJBQW1CO0FBQzdELFNBQVNDLGVBQWUsUUFBUSxnQ0FBZ0M7QUFDaEUsY0FBY0MsYUFBYSxRQUFRLG9DQUFvQztBQUN2RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGNBQWMsUUFBUSxvQ0FBb0M7QUFDbkUsY0FBY0MsbUJBQW1CLFFBQVEsc0NBQXNDO0FBQy9FLFNBQ0VDLGNBQWMsRUFDZEMsY0FBYyxFQUNkQyxlQUFlLFFBQ1YsdUJBQXVCO0FBQzlCLFNBQVNDLFFBQVEsUUFBUSw2QkFBNkI7QUFDdEQsU0FBU0MsaUJBQWlCLFFBQVEsZ0NBQWdDO0FBQ2xFLFNBQVNDLE1BQU0sUUFBUSw0QkFBNEI7QUFDbkQsU0FBU0MsTUFBTSxRQUFRLDRCQUE0QjtBQUNuRCxTQUFTQyxvQkFBb0IsUUFBUSwwQ0FBMEM7QUFFL0UsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLEtBQUssRUFBRWpCLGFBQWEsQ0FBQ08sbUJBQW1CLENBQUM7RUFDekNXLE1BQU0sRUFBRSxDQUNOQyxNQUFlLENBQVIsRUFBRSxNQUFNLEVBQ2ZDLE9BQTRDLENBQXBDLEVBQUU7SUFBRUMsT0FBTyxDQUFDLEVBQUVwQixvQkFBb0I7RUFBQyxDQUFDLEVBQzVDLEdBQUcsSUFBSTtFQUNUcUIsV0FBVyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUk7RUFDeEJDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJO0FBQ3JCLENBQUM7QUFFRCxNQUFNQyx1QkFBdUIsR0FBRyxJQUFJO0FBRXBDLEtBQUtDLGdCQUFnQixHQUFHO0VBQ3RCQyxPQUFPLEVBQUUsTUFBTTtFQUNmQyxVQUFVLEVBQUUsTUFBTTtBQUNwQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZUMsYUFBYUEsQ0FDMUJYLEtBQUssRUFBRWpCLGFBQWEsQ0FBQ08sbUJBQW1CLENBQUMsQ0FDMUMsRUFBRXNCLE9BQU8sQ0FBQ0osZ0JBQWdCLENBQUMsQ0FBQztFQUMzQixNQUFNSyxJQUFJLEdBQUdsQixpQkFBaUIsQ0FBQ0ssS0FBSyxDQUFDYyxFQUFFLENBQUM7RUFDeEMsSUFBSTtJQUNGLE1BQU1aLE1BQU0sR0FBRyxNQUFNUixRQUFRLENBQUNtQixJQUFJLEVBQUVOLHVCQUF1QixDQUFDO0lBQzVELE9BQU87TUFBRUUsT0FBTyxFQUFFUCxNQUFNLENBQUNPLE9BQU87TUFBRUMsVUFBVSxFQUFFUixNQUFNLENBQUNRO0lBQVcsQ0FBQztFQUNuRSxDQUFDLENBQUMsTUFBTTtJQUNOLE9BQU87TUFBRUQsT0FBTyxFQUFFLEVBQUU7TUFBRUMsVUFBVSxFQUFFO0lBQUUsQ0FBQztFQUN2QztBQUNGO0FBRUEsT0FBTyxTQUFBSyxrQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUEyQjtJQUFBbEIsS0FBQTtJQUFBQyxNQUFBO0lBQUFJLFdBQUE7SUFBQUM7RUFBQSxJQUFBVSxFQUsxQjtFQUNOO0lBQUFHO0VBQUEsSUFBb0JsQyxlQUFlLENBQUMsQ0FBQztFQUFBLElBQUFtQyxFQUFBO0VBQUEsSUFBQUgsQ0FBQSxRQUFBakIsS0FBQTtJQU9uQ29CLEVBQUEsR0FBQUEsQ0FBQSxLQUFNVCxhQUFhLENBQUNYLEtBQUssQ0FBQztJQUFBaUIsQ0FBQSxNQUFBakIsS0FBQTtJQUFBaUIsQ0FBQSxNQUFBRyxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBSCxDQUFBO0VBQUE7RUFENUIsT0FBQUksYUFBQSxFQUFBQyxnQkFBQSxJQUEwQ3hDLFFBQVEsQ0FDaERzQyxFQUNGLENBQUM7RUFDRCxNQUFBRyxxQkFBQSxHQUE4QjNDLGdCQUFnQixDQUFDeUMsYUFBYSxDQUFDO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQWpCLEtBQUE7SUFFbkR3QixFQUFBLEdBQUFBLENBQUE7TUFDUixJQUFJeEIsS0FBSyxDQUFBeUIsTUFBTyxLQUFLLFNBQVM7UUFBQTtNQUFBO01BRzlCLE1BQUFDLEtBQUEsR0FBY0MsV0FBVyxDQUN2QkMsS0FBbUUsRUFDbkUsSUFBSSxFQUNKTixnQkFBZ0IsRUFDaEJ0QixLQUNGLENBQUM7TUFBQSxPQUNNLE1BQU02QixhQUFhLENBQUNILEtBQUssQ0FBQztJQUFBLENBQ2xDO0lBQUFULENBQUEsTUFBQWpCLEtBQUE7SUFBQWlCLENBQUEsTUFBQU8sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtFQUFBO0VBQUEsSUFBQWEsRUFBQTtFQUFBLElBQUFiLENBQUEsUUFBQWpCLEtBQUEsQ0FBQWMsRUFBQSxJQUFBRyxDQUFBLFFBQUFqQixLQUFBLENBQUF5QixNQUFBO0lBQUVLLEVBQUEsSUFBQzlCLEtBQUssQ0FBQWMsRUFBRyxFQUFFZCxLQUFLLENBQUF5QixNQUFPLENBQUM7SUFBQVIsQ0FBQSxNQUFBakIsS0FBQSxDQUFBYyxFQUFBO0lBQUFHLENBQUEsTUFBQWpCLEtBQUEsQ0FBQXlCLE1BQUE7SUFBQVIsQ0FBQSxNQUFBYSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBYixDQUFBO0VBQUE7RUFYM0JwQyxTQUFTLENBQUMyQyxFQVdULEVBQUVNLEVBQXdCLENBQUM7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQWQsQ0FBQSxRQUFBaEIsTUFBQTtJQUdSOEIsRUFBQSxHQUFBQSxDQUFBLEtBQ2xCOUIsTUFBTSxDQUFDLHlCQUF5QixFQUFFO01BQUFHLE9BQUEsRUFBVztJQUFTLENBQUMsQ0FBQztJQUFBYSxDQUFBLE1BQUFoQixNQUFBO0lBQUFnQixDQUFBLE1BQUFjLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQUQxRCxNQUFBZSxXQUFBLEdBQW9CRCxFQUNzQztFQUFBLElBQUFFLEVBQUE7RUFBQSxJQUFBaEIsQ0FBQSxRQUFBZSxXQUFBO0lBSXhEQyxFQUFBO01BQUEsZUFDaUJEO0lBQ2pCLENBQUM7SUFBQWYsQ0FBQSxNQUFBZSxXQUFBO0lBQUFmLENBQUEsT0FBQWdCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFoQixDQUFBO0VBQUE7RUFBQSxJQUFBaUIsRUFBQTtFQUFBLElBQUFqQixDQUFBLFNBQUFrQixNQUFBLENBQUFDLEdBQUE7SUFDREYsRUFBQTtNQUFBRyxPQUFBLEVBQVc7SUFBZSxDQUFDO0lBQUFwQixDQUFBLE9BQUFpQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBakIsQ0FBQTtFQUFBO0VBSjdCNUIsY0FBYyxDQUNaNEMsRUFFQyxFQUNEQyxFQUNGLENBQUM7RUFBQSxJQUFBSSxFQUFBO0VBQUEsSUFBQXJCLENBQUEsU0FBQVgsTUFBQSxJQUFBVyxDQUFBLFNBQUFoQixNQUFBLElBQUFnQixDQUFBLFNBQUFaLFdBQUEsSUFBQVksQ0FBQSxTQUFBakIsS0FBQSxDQUFBeUIsTUFBQTtJQUdxQmEsRUFBQSxHQUFBQyxDQUFBO01BQ3BCLElBQUlBLENBQUMsQ0FBQUMsR0FBSSxLQUFLLEdBQUc7UUFDZkQsQ0FBQyxDQUFBRSxjQUFlLENBQUMsQ0FBQztRQUNsQnhDLE1BQU0sQ0FBQyx5QkFBeUIsRUFBRTtVQUFBRyxPQUFBLEVBQVc7UUFBUyxDQUFDLENBQUM7TUFBQTtRQUNuRCxJQUFJbUMsQ0FBQyxDQUFBQyxHQUFJLEtBQUssTUFBZ0IsSUFBMUJsQyxNQUEwQjtVQUNuQ2lDLENBQUMsQ0FBQUUsY0FBZSxDQUFDLENBQUM7VUFDbEJuQyxNQUFNLENBQUMsQ0FBQztRQUFBO1VBQ0gsSUFBSWlDLENBQUMsQ0FBQUMsR0FBSSxLQUFLLEdBQWlDLElBQTFCeEMsS0FBSyxDQUFBeUIsTUFBTyxLQUFLLFNBQXdCLElBQTFEcEIsV0FBMEQ7WUFDbkVrQyxDQUFDLENBQUFFLGNBQWUsQ0FBQyxDQUFDO1lBQ2xCcEMsV0FBVyxDQUFDLENBQUM7VUFBQTtRQUNkO01BQUE7SUFBQSxDQUNGO0lBQUFZLENBQUEsT0FBQVgsTUFBQTtJQUFBVyxDQUFBLE9BQUFoQixNQUFBO0lBQUFnQixDQUFBLE9BQUFaLFdBQUE7SUFBQVksQ0FBQSxPQUFBakIsS0FBQSxDQUFBeUIsTUFBQTtJQUFBUixDQUFBLE9BQUFxQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBckIsQ0FBQTtFQUFBO0VBWEQsTUFBQXlCLGFBQUEsR0FBc0JKLEVBV3JCO0VBR0QsTUFBQUssU0FBQSxHQUFrQjNDLEtBQUssQ0FBQTRDLElBQUssS0FBSyxTQUFTO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUE1QixDQUFBLFNBQUFqQixLQUFBLENBQUE4QyxPQUFBO0lBQ25CRCxFQUFBLEdBQUFwRCxlQUFlLENBQUNPLEtBQUssQ0FBQThDLE9BQVEsRUFBRSxHQUFHLENBQUM7SUFBQTdCLENBQUEsT0FBQWpCLEtBQUEsQ0FBQThDLE9BQUE7SUFBQTdCLENBQUEsT0FBQTRCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUE1QixDQUFBO0VBQUE7RUFBMUQsTUFBQThCLGNBQUEsR0FBdUJGLEVBQW1DO0VBVTdDLE1BQUFHLEVBQUEsR0FBQUwsU0FBUyxHQUFULGlCQUErQyxHQUEvQyxlQUErQztFQUFBLElBQUFNLEdBQUE7RUFBQSxJQUFBaEMsQ0FBQSxTQUFBWCxNQUFBLElBQUFXLENBQUEsU0FBQVosV0FBQSxJQUFBWSxDQUFBLFNBQUFqQixLQUFBLENBQUF5QixNQUFBO0lBRzFDd0IsR0FBQSxHQUFBQyxTQUFBLElBQ1ZBLFNBQVMsQ0FBQUMsT0FVUixHQVRDLENBQUMsSUFBSSxDQUFDLE1BQU8sQ0FBQUQsU0FBUyxDQUFBRSxPQUFPLENBQUUsY0FBYyxFQUE1QyxJQUFJLENBU04sR0FQQyxDQUFDLE1BQU0sQ0FDSixDQUFBOUMsTUFBZ0UsSUFBdEQsQ0FBQyxvQkFBb0IsQ0FBVSxRQUFHLENBQUgsU0FBRSxDQUFDLENBQVEsTUFBUyxDQUFULFNBQVMsR0FBRSxDQUNoRSxDQUFDLG9CQUFvQixDQUFVLFFBQWlCLENBQWpCLGlCQUFpQixDQUFRLE1BQU8sQ0FBUCxPQUFPLEdBQzlELENBQUFOLEtBQUssQ0FBQXlCLE1BQU8sS0FBSyxTQUF3QixJQUF6Q3BCLFdBRUEsSUFEQyxDQUFDLG9CQUFvQixDQUFVLFFBQUcsQ0FBSCxHQUFHLENBQVEsTUFBTSxDQUFOLE1BQU0sR0FDbEQsQ0FDRixFQU5DLE1BQU0sQ0FPUjtJQUFBWSxDQUFBLE9BQUFYLE1BQUE7SUFBQVcsQ0FBQSxPQUFBWixXQUFBO0lBQUFZLENBQUEsT0FBQWpCLEtBQUEsQ0FBQXlCLE1BQUE7SUFBQVIsQ0FBQSxPQUFBZ0MsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQWhDLENBQUE7RUFBQTtFQUFBLElBQUFvQyxHQUFBO0VBQUEsSUFBQXBDLENBQUEsU0FBQWtCLE1BQUEsQ0FBQUMsR0FBQTtJQUtDaUIsR0FBQSxJQUFDLElBQUksQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQUMsT0FBTyxFQUFqQixJQUFJLENBQW9CO0lBQUFwQyxDQUFBLE9BQUFvQyxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBcEMsQ0FBQTtFQUFBO0VBQUEsSUFBQXFDLEdBQUE7RUFBQSxJQUFBckMsQ0FBQSxTQUFBakIsS0FBQSxDQUFBRSxNQUFBLElBQUFlLENBQUEsU0FBQWpCLEtBQUEsQ0FBQXlCLE1BQUE7SUFEM0I2QixHQUFBLElBQUMsSUFBSSxDQUNILENBQUFELEdBQXdCLENBQUUsSUFBRSxDQUMzQixDQUFBckQsS0FBSyxDQUFBeUIsTUFBTyxLQUFLLFNBa0JqQixHQWpCQyxDQUFDLElBQUksQ0FBTyxLQUFZLENBQVosWUFBWSxDQUNyQixDQUFBekIsS0FBSyxDQUFBeUIsTUFBTSxDQUNYLENBQUF6QixLQUFLLENBQUFFLE1BQWEsRUFBQXFELElBQUEsS0FBS0MsU0FDYyxJQURyQyxnQkFDaUJ4RCxLQUFLLENBQUFFLE1BQU8sQ0FBQXFELElBQUssR0FBRSxDQUN2QyxFQUpDLElBQUksQ0FpQk4sR0FaR3ZELEtBQUssQ0FBQXlCLE1BQU8sS0FBSyxXQVlwQixHQVhDLENBQUMsSUFBSSxDQUFPLEtBQVMsQ0FBVCxTQUFTLENBQ2xCLENBQUF6QixLQUFLLENBQUF5QixNQUFNLENBQ1gsQ0FBQXpCLEtBQUssQ0FBQUUsTUFBYSxFQUFBcUQsSUFBQSxLQUFLQyxTQUNjLElBRHJDLGdCQUNpQnhELEtBQUssQ0FBQUUsTUFBTyxDQUFBcUQsSUFBSyxHQUFFLENBQ3ZDLEVBSkMsSUFBSSxDQVdOLEdBTEMsQ0FBQyxJQUFJLENBQU8sS0FBTyxDQUFQLE9BQU8sQ0FDaEIsQ0FBQXZELEtBQUssQ0FBQXlCLE1BQU0sQ0FDWCxDQUFBekIsS0FBSyxDQUFBRSxNQUFhLEVBQUFxRCxJQUFBLEtBQUtDLFNBQ2MsSUFEckMsZ0JBQ2lCeEQsS0FBSyxDQUFBRSxNQUFPLENBQUFxRCxJQUFLLEdBQUUsQ0FDdkMsRUFKQyxJQUFJLENBS1AsQ0FDRixFQXJCQyxJQUFJLENBcUJFO0lBQUF0QyxDQUFBLE9BQUFqQixLQUFBLENBQUFFLE1BQUE7SUFBQWUsQ0FBQSxPQUFBakIsS0FBQSxDQUFBeUIsTUFBQTtJQUFBUixDQUFBLE9BQUFxQyxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBckMsQ0FBQTtFQUFBO0VBQUEsSUFBQXdDLEdBQUE7RUFBQSxJQUFBeEMsQ0FBQSxTQUFBa0IsTUFBQSxDQUFBQyxHQUFBO0lBRUxxQixHQUFBLElBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBQyxRQUFRLEVBQWxCLElBQUksQ0FBcUI7SUFBQXhDLENBQUEsT0FBQXdDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUF4QyxDQUFBO0VBQUE7RUFBQSxJQUFBeUMsR0FBQTtFQUFBLElBQUF6QyxDQUFBLFNBQUFqQixLQUFBLENBQUEyRCxPQUFBO0lBQ1RELEdBQUEsR0FBQTFELEtBQUssQ0FBQTJELE9BQXNCLElBQVZDLElBQUksQ0FBQUMsR0FBSSxDQUFDLENBQUM7SUFBQTVDLENBQUEsT0FBQWpCLEtBQUEsQ0FBQTJELE9BQUE7SUFBQTFDLENBQUEsT0FBQXlDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUF6QyxDQUFBO0VBQUE7RUFBNUIsTUFBQTZDLEdBQUEsR0FBQ0osR0FBMkIsR0FBSTFELEtBQUssQ0FBQStELFNBQVU7RUFBQSxJQUFBQyxHQUFBO0VBQUEsSUFBQS9DLENBQUEsU0FBQTZDLEdBQUE7SUFBOURFLEdBQUEsR0FBQXpFLGNBQWMsQ0FBQ3VFLEdBQStDLENBQUM7SUFBQTdDLENBQUEsT0FBQTZDLEdBQUE7SUFBQTdDLENBQUEsT0FBQStDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUEvQyxDQUFBO0VBQUE7RUFBQSxJQUFBZ0QsR0FBQTtFQUFBLElBQUFoRCxDQUFBLFNBQUErQyxHQUFBO0lBRmxFQyxHQUFBLElBQUMsSUFBSSxDQUNILENBQUFSLEdBQXlCLENBQUUsSUFBRSxDQUM1QixDQUFBTyxHQUE4RCxDQUNqRSxFQUhDLElBQUksQ0FHRTtJQUFBL0MsQ0FBQSxPQUFBK0MsR0FBQTtJQUFBL0MsQ0FBQSxPQUFBZ0QsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQWhELENBQUE7RUFBQTtFQUVPLE1BQUFpRCxHQUFBLEdBQUF2QixTQUFTLEdBQVQsU0FBa0MsR0FBbEMsVUFBa0M7RUFBQSxJQUFBd0IsR0FBQTtFQUFBLElBQUFsRCxDQUFBLFNBQUFpRCxHQUFBO0lBQTlDQyxHQUFBLElBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBRSxDQUFBRCxHQUFpQyxDQUFFLEVBQTlDLElBQUksQ0FBaUQ7SUFBQWpELENBQUEsT0FBQWlELEdBQUE7SUFBQWpELENBQUEsT0FBQWtELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFsRCxDQUFBO0VBQUE7RUFBQSxJQUFBbUQsR0FBQTtFQUFBLElBQUFuRCxDQUFBLFNBQUE4QixjQUFBLElBQUE5QixDQUFBLFNBQUFrRCxHQUFBO0lBRHhEQyxHQUFBLElBQUMsSUFBSSxDQUFNLElBQU0sQ0FBTixNQUFNLENBQ2YsQ0FBQUQsR0FBcUQsQ0FBRSxJQUFFLENBQ3hEcEIsZUFBYSxDQUNoQixFQUhDLElBQUksQ0FHRTtJQUFBOUIsQ0FBQSxPQUFBOEIsY0FBQTtJQUFBOUIsQ0FBQSxPQUFBa0QsR0FBQTtJQUFBbEQsQ0FBQSxPQUFBbUQsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQW5ELENBQUE7RUFBQTtFQUFBLElBQUFvRCxHQUFBO0VBQUEsSUFBQXBELENBQUEsU0FBQXFDLEdBQUEsSUFBQXJDLENBQUEsU0FBQWdELEdBQUEsSUFBQWhELENBQUEsU0FBQW1ELEdBQUE7SUE5QlRDLEdBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQWYsR0FxQk0sQ0FDTixDQUFBVyxHQUdNLENBQ04sQ0FBQUcsR0FHTSxDQUNSLEVBL0JDLEdBQUcsQ0ErQkU7SUFBQW5ELENBQUEsT0FBQXFDLEdBQUE7SUFBQXJDLENBQUEsT0FBQWdELEdBQUE7SUFBQWhELENBQUEsT0FBQW1ELEdBQUE7SUFBQW5ELENBQUEsT0FBQW9ELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFwRCxDQUFBO0VBQUE7RUFBQSxJQUFBcUQsR0FBQTtFQUFBLElBQUFyRCxDQUFBLFNBQUFrQixNQUFBLENBQUFDLEdBQUE7SUFHSmtDLEdBQUEsSUFBQyxJQUFJLENBQUMsSUFBSSxDQUFKLEtBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBakIsSUFBSSxDQUFvQjtJQUFBckQsQ0FBQSxPQUFBcUQsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQXJELENBQUE7RUFBQTtFQUFBLElBQUFzRCxHQUFBO0VBQUEsSUFBQXRELENBQUEsU0FBQWtCLE1BQUEsQ0FBQUMsR0FBQTtJQUNMbUMsR0FBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsZUFBZSxFQUE3QixJQUFJLENBQWdDO0lBQUF0RCxDQUFBLE9BQUFzRCxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBdEQsQ0FBQTtFQUFBO0VBQUEsSUFBQXVELEdBQUE7RUFBQSxJQUFBdkQsQ0FBQSxTQUFBRSxPQUFBLElBQUFGLENBQUEsU0FBQU0scUJBQUE7SUFGM0RpRCxHQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQ3pCLENBQUFGLEdBQXdCLENBQ3hCLENBQUMsUUFBUSxDQUFXLFFBQXFDLENBQXJDLENBQUFDLEdBQW9DLENBQUMsQ0FDdkQsQ0FBQyxrQkFBa0IsQ0FDRmhELGFBQXFCLENBQXJCQSxzQkFBb0IsQ0FBQyxDQUMzQkosT0FBTyxDQUFQQSxRQUFNLENBQUMsR0FFcEIsRUFMQyxRQUFRLENBTVgsRUFSQyxHQUFHLENBUUU7SUFBQUYsQ0FBQSxPQUFBRSxPQUFBO0lBQUFGLENBQUEsT0FBQU0scUJBQUE7SUFBQU4sQ0FBQSxPQUFBdUQsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQXZELENBQUE7RUFBQTtFQUFBLElBQUF3RCxHQUFBO0VBQUEsSUFBQXhELENBQUEsU0FBQWUsV0FBQSxJQUFBZixDQUFBLFNBQUFnQyxHQUFBLElBQUFoQyxDQUFBLFNBQUFvRCxHQUFBLElBQUFwRCxDQUFBLFNBQUF1RCxHQUFBLElBQUF2RCxDQUFBLFNBQUErQixFQUFBO0lBM0RSeUIsR0FBQSxJQUFDLE1BQU0sQ0FDRSxLQUErQyxDQUEvQyxDQUFBekIsRUFBOEMsQ0FBQyxDQUM1Q2hCLFFBQVcsQ0FBWEEsWUFBVSxDQUFDLENBQ2YsS0FBWSxDQUFaLFlBQVksQ0FDTixVQVdULENBWFMsQ0FBQWlCLEdBV1YsQ0FBQyxDQUdILENBQUFvQixHQStCSyxDQUVMLENBQUFHLEdBUUssQ0FDUCxFQTVEQyxNQUFNLENBNERFO0lBQUF2RCxDQUFBLE9BQUFlLFdBQUE7SUFBQWYsQ0FBQSxPQUFBZ0MsR0FBQTtJQUFBaEMsQ0FBQSxPQUFBb0QsR0FBQTtJQUFBcEQsQ0FBQSxPQUFBdUQsR0FBQTtJQUFBdkQsQ0FBQSxPQUFBK0IsRUFBQTtJQUFBL0IsQ0FBQSxPQUFBd0QsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQXhELENBQUE7RUFBQTtFQUFBLElBQUF5RCxHQUFBO0VBQUEsSUFBQXpELENBQUEsU0FBQXlCLGFBQUEsSUFBQXpCLENBQUEsU0FBQXdELEdBQUE7SUFsRVhDLEdBQUEsSUFBQyxHQUFHLENBQ1ksYUFBUSxDQUFSLFFBQVEsQ0FDWixRQUFDLENBQUQsR0FBQyxDQUNYLFNBQVMsQ0FBVCxLQUFRLENBQUMsQ0FDRWhDLFNBQWEsQ0FBYkEsY0FBWSxDQUFDLENBRXhCLENBQUErQixHQTREUSxDQUNWLEVBbkVDLEdBQUcsQ0FtRUU7SUFBQXhELENBQUEsT0FBQXlCLGFBQUE7SUFBQXpCLENBQUEsT0FBQXdELEdBQUE7SUFBQXhELENBQUEsT0FBQXlELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUF6RCxDQUFBO0VBQUE7RUFBQSxPQW5FTnlELEdBbUVNO0FBQUE7QUFoSUgsU0FBQTlDLE1BQUErQyxrQkFBQSxFQUFBQyxPQUFBO0VBQUEsT0FzQjRCdEQsa0JBQWdCLENBQUNYLGFBQWEsQ0FBQ1gsT0FBSyxDQUFDLENBQUM7QUFBQTtBQThHekUsS0FBSzZFLHVCQUF1QixHQUFHO0VBQzdCeEQsYUFBYSxFQUFFVCxPQUFPLENBQUNKLGdCQUFnQixDQUFDO0VBQ3hDVyxPQUFPLEVBQUUsTUFBTTtBQUNqQixDQUFDO0FBRUQsU0FBQTJELG1CQUFBOUQsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUE0QjtJQUFBRyxhQUFBO0lBQUFGO0VBQUEsSUFBQUgsRUFHRjtFQUN4QjtJQUFBUCxPQUFBO0lBQUFDO0VBQUEsSUFBZ0MvQixHQUFHLENBQUMwQyxhQUFhLENBQUM7RUFFbEQsSUFBSSxDQUFDWixPQUFPO0lBQUEsSUFBQVcsRUFBQTtJQUFBLElBQUFILENBQUEsUUFBQWtCLE1BQUEsQ0FBQUMsR0FBQTtNQUNIaEIsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsbUJBQW1CLEVBQWpDLElBQUksQ0FBb0M7TUFBQUgsQ0FBQSxNQUFBRyxFQUFBO0lBQUE7TUFBQUEsRUFBQSxHQUFBSCxDQUFBO0lBQUE7SUFBQSxPQUF6Q0csRUFBeUM7RUFBQTtFQUNqRCxJQUFBMkQsWUFBQTtFQUFBLElBQUFDLFFBQUE7RUFBQSxJQUFBL0QsQ0FBQSxRQUFBUCxVQUFBLElBQUFPLENBQUEsUUFBQVIsT0FBQTtJQUdELE1BQUF3RSxNQUFBLEdBQXlCLEVBQUU7SUFDM0IsSUFBQUMsR0FBQSxHQUFVekUsT0FBTyxDQUFBMEUsTUFBTztJQUN4QixTQUFBQyxDQUFBLEdBQWEsQ0FBQyxFQUFFQSxDQUFDLEdBQUcsRUFBYSxJQUFQRixHQUFHLEdBQUcsQ0FJL0IsRUFKa0NFLENBQUMsRUFBRTtNQUNwQyxNQUFBQyxJQUFBLEdBQWE1RSxPQUFPLENBQUE2RSxXQUFZLENBQUMsSUFBSSxFQUFFSixHQUFHLEdBQUcsQ0FBQyxDQUFDO01BQy9DRCxNQUFNLENBQUFNLElBQUssQ0FBQ0YsSUFBSSxHQUFHLENBQUMsQ0FBQztNQUNyQkgsR0FBQSxDQUFBQSxDQUFBLENBQU1HLElBQUk7SUFBUDtJQUVMSixNQUFNLENBQUFPLE9BQVEsQ0FBQyxDQUFDO0lBQ2hCVCxZQUFBLEdBQXFCckUsVUFBVSxHQUFHRCxPQUFPLENBQUEwRSxNQUFPO0lBR2hESCxRQUFBLEdBQTJCLEVBQUU7SUFDN0IsU0FBQVMsR0FBQSxHQUFhLENBQUMsRUFBRUwsR0FBQyxHQUFHSCxNQUFNLENBQUFFLE1BS3pCLEVBTGtDQyxHQUFDLEVBQUU7TUFDcEMsTUFBQU0sS0FBQSxHQUFjVCxNQUFNLENBQUNHLEdBQUMsQ0FBQztNQUN2QixNQUFBTyxHQUFBLEdBQVlQLEdBQUMsR0FBR0gsTUFBTSxDQUFBRSxNQUFPLEdBQUcsQ0FBdUMsR0FBbkNGLE1BQU0sQ0FBQ0csR0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFJLENBQWtCLEdBQWQzRSxPQUFPLENBQUEwRSxNQUFPO01BQ3ZFLE1BQUFTLElBQUEsR0FBYW5GLE9BQU8sQ0FBQW9GLEtBQU0sQ0FBQ0gsS0FBSyxFQUFFQyxHQUFHLENBQUM7TUFDdEMsSUFBSUMsSUFBSTtRQUFFWixRQUFRLENBQUFPLElBQUssQ0FBQ0ssSUFBSSxDQUFDO01BQUE7SUFBQTtJQUM5QjNFLENBQUEsTUFBQVAsVUFBQTtJQUFBTyxDQUFBLE1BQUFSLE9BQUE7SUFBQVEsQ0FBQSxNQUFBOEQsWUFBQTtJQUFBOUQsQ0FBQSxNQUFBK0QsUUFBQTtFQUFBO0lBQUFELFlBQUEsR0FBQTlELENBQUE7SUFBQStELFFBQUEsR0FBQS9ELENBQUE7RUFBQTtFQVNlLE1BQUFHLEVBQUEsR0FBQUQsT0FBTyxHQUFHLENBQUM7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQVAsQ0FBQSxRQUFBK0QsUUFBQTtJQUVwQnhELEVBQUEsR0FBQXdELFFBQVEsQ0FBQWMsR0FBSSxDQUFDQyxNQUliLENBQUM7SUFBQTlFLENBQUEsTUFBQStELFFBQUE7SUFBQS9ELENBQUEsTUFBQU8sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtFQUFBO0VBQUEsSUFBQWEsRUFBQTtFQUFBLElBQUFiLENBQUEsUUFBQUcsRUFBQSxJQUFBSCxDQUFBLFFBQUFPLEVBQUE7SUFYSk0sRUFBQSxJQUFDLEdBQUcsQ0FDVSxXQUFPLENBQVAsT0FBTyxDQUNULFFBQUMsQ0FBRCxHQUFDLENBQ0csYUFBUSxDQUFSLFFBQVEsQ0FDZCxNQUFFLENBQUYsR0FBQyxDQUFDLENBQ0EsUUFBVyxDQUFYLENBQUFWLEVBQVUsQ0FBQyxDQUVwQixDQUFBSSxFQUlBLENBQ0gsRUFaQyxHQUFHLENBWUU7SUFBQVAsQ0FBQSxNQUFBRyxFQUFBO0lBQUFILENBQUEsTUFBQU8sRUFBQTtJQUFBUCxDQUFBLE1BQUFhLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFiLENBQUE7RUFBQTtFQUVILE1BQUFjLEVBQUEsY0FBV2lELFFBQVEsQ0FBQUcsTUFBTyxRQUFRO0VBQUEsSUFBQWxELEVBQUE7RUFBQSxJQUFBaEIsQ0FBQSxTQUFBUCxVQUFBLElBQUFPLENBQUEsU0FBQThELFlBQUE7SUFDbEM5QyxFQUFBLEdBQUE4QyxZQUFZLEdBQVosT0FBc0J2RixjQUFjLENBQUNrQixVQUFVLENBQUMsRUFBTyxHQUF2RCxFQUF1RDtJQUFBTyxDQUFBLE9BQUFQLFVBQUE7SUFBQU8sQ0FBQSxPQUFBOEQsWUFBQTtJQUFBOUQsQ0FBQSxPQUFBZ0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWhCLENBQUE7RUFBQTtFQUFBLElBQUFpQixFQUFBO0VBQUEsSUFBQWpCLENBQUEsU0FBQWMsRUFBQSxJQUFBZCxDQUFBLFNBQUFnQixFQUFBO0lBRjFEQyxFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxNQUFNLENBQU4sS0FBSyxDQUFDLENBQ2xCLENBQUFILEVBQWlDLENBQ2pDLENBQUFFLEVBQXNELENBQ3pELEVBSEMsSUFBSSxDQUdFO0lBQUFoQixDQUFBLE9BQUFjLEVBQUE7SUFBQWQsQ0FBQSxPQUFBZ0IsRUFBQTtJQUFBaEIsQ0FBQSxPQUFBaUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWpCLENBQUE7RUFBQTtFQUFBLElBQUFxQixFQUFBO0VBQUEsSUFBQXJCLENBQUEsU0FBQWEsRUFBQSxJQUFBYixDQUFBLFNBQUFpQixFQUFBO0lBakJUSSxFQUFBLEtBQ0UsQ0FBQVIsRUFZSyxDQUNMLENBQUFJLEVBR00sQ0FBQyxHQUNOO0lBQUFqQixDQUFBLE9BQUFhLEVBQUE7SUFBQWIsQ0FBQSxPQUFBaUIsRUFBQTtJQUFBakIsQ0FBQSxPQUFBcUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXJCLENBQUE7RUFBQTtFQUFBLE9BbEJIcUIsRUFrQkc7QUFBQTtBQWpEUCxTQUFBeUQsT0FBQUMsTUFBQSxFQUFBQyxHQUFBO0VBQUEsT0F3Q1UsQ0FBQyxJQUFJLENBQU1iLEdBQUMsQ0FBREEsSUFBQSxDQUFDLENBQU8sSUFBYyxDQUFkLGNBQWMsQ0FDOUJRLE9BQUcsQ0FDTixFQUZDLElBQUksQ0FFRTtBQUFBIiwiaWdub3JlTGlzdCI6W119