// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准终端渲染的数据契约。
import type { DeepImmutable } from 'src/types/utils.js';
// 引入 useElapsedTime，将 ../../hooks/useElapsedTime.js 中已经封装好的能力接到本文件流程里。
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybindings，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../../keybindings/useKeybinding.js';
// 类型依赖 { DreamTaskState } 来自 ../../tasks/DreamTask/DreamTask.js，用于校准终端渲染的数据契约。
import type { DreamTaskState } from '../../tasks/DreamTask/DreamTask.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// 引入 Byline，将 ../design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from '../design-system/Byline.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  task: DeepImmutable<DreamTaskState>;
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
  onBack?: () => void;
  onKill?: () => void;
};

// How many recent turns to render. Earlier turns collapse to a count.
// VISIBLE_TURNS 集合 命名 `6`，让后续代码直接表达这个值的用途。
const VISIBLE_TURNS = 6;
// DreamDetailDialog 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DreamDetailDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(70);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    task,
    onDone,
    onBack,
    onKill
  } = t0;
  // elapsedTime保存`useElapsedTime`，供终端渲染后续处理使用。
  const elapsedTime = useElapsedTime(task.startTime, task.status === "running", 1000, 0);
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      "confirm:yes": onDone
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
  // t3 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onBack || $[4] !== onDone || $[5] !== onKill || $[6] !== task.status) {
    // t3 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = e => {
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
          // 只有 `e.key === "x" && task.status === "running" && onK` 满足时，终端渲染才执行该分支。
          if (e.key === "x" && task.status === "running" && onKill) {
            // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
            e.preventDefault();
            // 调用 onKill，触发终端渲染此处需要的副作用。
            onKill();
          }
        }
      }
    };
    // $[3] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onBack;
    // $[4] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = onDone;
    // $[5] 缓存 `onKill`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onKill;
    // $[6] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = task.status;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // handleKeyDown 命名 `t3`，让后续代码直接表达这个值的用途。
  const handleKeyDown = t3;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
  // T2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T2;
  // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t10;
  // t11 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t11;
  // t12 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t12;
  // t13 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t13;
  // t14 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t14;
  // t15 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t15;
  // t16 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t16;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // t7 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t7;
  // t8 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t8;
  // t9 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== elapsedTime || $[9] !== handleKeyDown || $[10] !== onBack || $[11] !== onDone || $[12] !== onKill || $[13] !== task.filesTouched.length || $[14] !== task.sessionsReviewing || $[15] !== task.status || $[16] !== task.turns) {
    // visibleTurns 集合筛选`turns.filter`，供终端渲染后续处理使用。
    const visibleTurns = task.turns.filter(_temp);
    // shown格式化`visibleTurns.slice`，供终端渲染后续处理使用。
    const shown = visibleTurns.slice(-VISIBLE_TURNS);
    // hidden记录 `visibleTurns.length - shown.length` 是否成立，下一步按该结果分支。
    const hidden = visibleTurns.length - shown.length;
    // T2 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T2 = Box;
    // t13 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t13 = "column";
    // t14 暂存 `0` 生成的渲染片段，后续返回路径直接复用。
    t14 = 0;
    // t15 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
    t15 = true;
    // t16 暂存 `handleKeyDown` 生成的渲染片段，后续返回路径直接复用。
    t16 = handleKeyDown;
    // T1 暂存 `Dialog` 生成的渲染片段，后续返回路径直接复用。
    T1 = Dialog;
    // t8 暂存 `"Memory consolidation"` 生成的渲染片段，后续返回路径直接复用。
    t8 = "Memory consolidation";
    // t17保存`task.sessionsReviewing`，供终端 UI Dream Detail Dialog后续判断或输出使用。
    const t17 = task.sessionsReviewing;
    // t18 暂存 `plural(task.sessionsReviewing, "session")` 的派生结果，便于缓存命中时直接复用。
    let t18;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[33] !== task.sessionsReviewing) {
      // t18 暂存 `plural(task.sessionsReviewing, "session")` 生成的渲染片段，后续返回路径直接复用。
      t18 = plural(task.sessionsReviewing, "session");
      // $[33] 缓存 `task.sessionsReviewing`，下次依赖未变时 React 编译产物可直接复用。
      $[33] = task.sessionsReviewing;
      // $[34] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[34] = t18;
    } else {
      // t18 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
      t18 = $[34];
    }
    // t19 暂存 `task.filesTouched.length > 0 && <>{" "}· {task.filesTouch...` 的派生结果，便于缓存命中时直接复用。
    let t19;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[35] !== task.filesTouched.length) {
      // t19 暂存 `task.filesTouched.length > 0 && <>{" "}· {task.filesTouch...` 生成的渲染片段，后续返回路径直接复用。
      t19 = task.filesTouched.length > 0 && <>{" "}· {task.filesTouched.length}{" "}{plural(task.filesTouched.length, "file")} touched</>;
      // $[35] 缓存 `task.filesTouched.length`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = task.filesTouched.length;
      // $[36] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = t19;
    } else {
      // t19 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
      t19 = $[36];
    }
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[37] !== elapsedTime || $[38] !== t18 || $[39] !== t19 || $[40] !== task.sessionsReviewing) {
      // t9 暂存 `<Text dimColor={true}>{elapsedTime} · reviewing {t17}{" "...` 生成的渲染片段，后续返回路径直接复用。
      t9 = <Text dimColor={true}>{elapsedTime} · reviewing {t17}{" "}{t18}{t19}</Text>;
      // $[37] 缓存 `elapsedTime`，下次依赖未变时 React 编译产物可直接复用。
      $[37] = elapsedTime;
      // $[38] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
      $[38] = t18;
      // $[39] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
      $[39] = t19;
      // $[40] 缓存 `task.sessionsReviewing`，下次依赖未变时 React 编译产物可直接复用。
      $[40] = task.sessionsReviewing;
      // $[41] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[41] = t9;
    } else {
      // t9 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
      t9 = $[41];
    }
    // t10 暂存 `onDone` 生成的渲染片段，后续返回路径直接复用。
    t10 = onDone;
    // t11 暂存 `"background"` 生成的渲染片段，后续返回路径直接复用。
    t11 = "background";
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[42] !== onBack || $[43] !== onKill || $[44] !== task.status) {
      // t12 暂存 `exitState => exitState.pending ? <Text>Press {exitState.k...` 生成的渲染片段，后续返回路径直接复用。
      t12 = exitState => exitState.pending ? <Text>Press {exitState.keyName} again to exit</Text> : <Byline>{onBack && <KeyboardShortcutHint shortcut={"\u2190"} action="go back" />}<KeyboardShortcutHint shortcut="Esc/Enter/Space" action="close" />{task.status === "running" && onKill && <KeyboardShortcutHint shortcut="x" action="stop" />}</Byline>;
      // $[42] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
      $[42] = onBack;
      // $[43] 缓存 `onKill`，下次依赖未变时 React 编译产物可直接复用。
      $[43] = onKill;
      // $[44] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
      $[44] = task.status;
      // $[45] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[45] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[45];
    }
    // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
    T0 = Box;
    // t4 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
    t4 = "column";
    // t5 暂存 `1` 生成的渲染片段，后续返回路径直接复用。
    t5 = 1;
    // t20 暂存 `<Text bold={true}>Status:</Text>` 的派生结果，便于缓存命中时直接复用。
    let t20;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
      // t20 暂存 `<Text bold={true}>Status:</Text>` 生成的渲染片段，后续返回路径直接复用。
      t20 = <Text bold={true}>Status:</Text>;
      // $[46] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
      $[46] = t20;
    } else {
      // t20 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
      t20 = $[46];
    }
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[47] !== task.status) {
      // t6 暂存 `<Text>{t20}{" "}{task.status === "running" ? <Text color=...` 生成的渲染片段，后续返回路径直接复用。
      t6 = <Text>{t20}{" "}{task.status === "running" ? <Text color="background">running</Text> : task.status === "completed" ? <Text color="success">{task.status}</Text> : <Text color="error">{task.status}</Text>}</Text>;
      // $[47] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
      $[47] = task.status;
      // $[48] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
      $[48] = t6;
    } else {
      // t6 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
      t6 = $[48];
    }
    // t7 暂存 `shown.length === 0 ? <Text dimColor={true}>{task.status =...` 生成的渲染片段，后续返回路径直接复用。
    t7 = shown.length === 0 ? <Text dimColor={true}>{task.status === "running" ? "Starting\u2026" : "(no text output)"}</Text> : <>{hidden > 0 && <Text dimColor={true}>({hidden} earlier {plural(hidden, "turn")})</Text>}{shown.map(_temp2)}</>;
    // $[8] 缓存 `elapsedTime`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = elapsedTime;
    // $[9] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = handleKeyDown;
    // $[10] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onBack;
    // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onDone;
    // $[12] 缓存 `onKill`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onKill;
    // $[13] 缓存 `task.filesTouched.length`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = task.filesTouched.length;
    // $[14] 缓存 `task.sessionsReviewing`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = task.sessionsReviewing;
    // $[15] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = task.status;
    // $[16] 缓存 `task.turns`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = task.turns;
    // $[17] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = T0;
    // $[18] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = T1;
    // $[19] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = T2;
    // $[20] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t10;
    // $[21] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t11;
    // $[22] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t12;
    // $[23] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t13;
    // $[24] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t14;
    // $[25] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t15;
    // $[26] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t16;
    // $[27] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t4;
    // $[28] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t5;
    // $[29] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t6;
    // $[30] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t7;
    // $[31] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t8;
    // $[32] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t9;
  } else {
    // T0 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[17];
    // T1 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[18];
    // T2 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    T2 = $[19];
    // t10 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[20];
    // t11 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[21];
    // t12 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[22];
    // t13 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[23];
    // t14 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[24];
    // t15 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[25];
    // t16 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[26];
    // t4 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[27];
    // t5 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[28];
    // t6 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[29];
    // t7 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[30];
    // t8 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[31];
    // t9 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[32];
  }
  // t17 暂存 `<T0 flexDirection={t4} gap={t5}>{t6}{t7}</T0>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[49] !== T0 || $[50] !== t4 || $[51] !== t5 || $[52] !== t6 || $[53] !== t7) {
    // t17 暂存 `<T0 flexDirection={t4} gap={t5}>{t6}{t7}</T0>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <T0 flexDirection={t4} gap={t5}>{t6}{t7}</T0>;
    // $[49] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = T0;
    // $[50] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t4;
    // $[51] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t5;
    // $[52] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t6;
    // $[53] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t7;
    // $[54] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[54] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[54];
  }
  // t18 暂存 `<T1 title={t8} subtitle={t9} onCancel={t10} color={t11} i...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[55] !== T1 || $[56] !== t10 || $[57] !== t11 || $[58] !== t12 || $[59] !== t17 || $[60] !== t8 || $[61] !== t9) {
    // t18 暂存 `<T1 title={t8} subtitle={t9} onCancel={t10} color={t11} i...` 生成的渲染片段，后续返回路径直接复用。
    t18 = <T1 title={t8} subtitle={t9} onCancel={t10} color={t11} inputGuide={t12}>{t17}</T1>;
    // $[55] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = T1;
    // $[56] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t10;
    // $[57] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t11;
    // $[58] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = t12;
    // $[59] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t17;
    // $[60] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = t8;
    // $[61] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t9;
    // $[62] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[62];
  }
  // t19 暂存 `<T2 flexDirection={t13} tabIndex={t14} autoFocus={t15} on...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[63] !== T2 || $[64] !== t13 || $[65] !== t14 || $[66] !== t15 || $[67] !== t16 || $[68] !== t18) {
    // t19 暂存 `<T2 flexDirection={t13} tabIndex={t14} autoFocus={t15} on...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <T2 flexDirection={t13} tabIndex={t14} autoFocus={t15} onKeyDown={t16}>{t18}</T2>;
    // $[63] 缓存 `T2`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = T2;
    // $[64] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = t13;
    // $[65] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = t14;
    // $[66] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = t15;
    // $[67] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = t16;
    // $[68] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = t18;
    // $[69] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[69];
  }
  // 返回 `t19`，作为终端渲染这次计算的结果。
  return t19;
}
// _temp2 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(turn, i) {
  // 返回 `<Box key={i} flexDirection="column"><Text wrap="wrap">{turn.text}</Text...`，作为终端渲染这次计算的结果。
  return <Box key={i} flexDirection="column"><Text wrap="wrap">{turn.text}</Text>{turn.toolUseCount > 0 && <Text dimColor={true}>{"  "}({turn.toolUseCount}{" "}{plural(turn.toolUseCount, "tool")})</Text>}</Box>;
}
// _temp 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(t) {
  // 返回 `t.text !== ""`，作为终端渲染这次计算的结果。
  return t.text !== "";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkRlZXBJbW11dGFibGUiLCJ1c2VFbGFwc2VkVGltZSIsIktleWJvYXJkRXZlbnQiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZ3MiLCJEcmVhbVRhc2tTdGF0ZSIsInBsdXJhbCIsIkJ5bGluZSIsIkRpYWxvZyIsIktleWJvYXJkU2hvcnRjdXRIaW50IiwiUHJvcHMiLCJ0YXNrIiwib25Eb25lIiwib25CYWNrIiwib25LaWxsIiwiVklTSUJMRV9UVVJOUyIsIkRyZWFtRGV0YWlsRGlhbG9nIiwidDAiLCIkIiwiX2MiLCJlbGFwc2VkVGltZSIsInN0YXJ0VGltZSIsInN0YXR1cyIsInQxIiwidDIiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwidDMiLCJlIiwia2V5IiwicHJldmVudERlZmF1bHQiLCJoYW5kbGVLZXlEb3duIiwiVDAiLCJUMSIsIlQyIiwidDEwIiwidDExIiwidDEyIiwidDEzIiwidDE0IiwidDE1IiwidDE2IiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5IiwiZmlsZXNUb3VjaGVkIiwibGVuZ3RoIiwic2Vzc2lvbnNSZXZpZXdpbmciLCJ0dXJucyIsInZpc2libGVUdXJucyIsImZpbHRlciIsIl90ZW1wIiwic2hvd24iLCJzbGljZSIsImhpZGRlbiIsInQxNyIsInQxOCIsInQxOSIsImV4aXRTdGF0ZSIsInBlbmRpbmciLCJrZXlOYW1lIiwidDIwIiwibWFwIiwiX3RlbXAyIiwidHVybiIsImkiLCJ0ZXh0IiwidG9vbFVzZUNvdW50IiwidCJdLCJzb3VyY2VzIjpbIkRyZWFtRGV0YWlsRGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IERlZXBJbW11dGFibGUgfSBmcm9tICdzcmMvdHlwZXMvdXRpbHMuanMnXG5pbXBvcnQgeyB1c2VFbGFwc2VkVGltZSB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUVsYXBzZWRUaW1lLmpzJ1xuaW1wb3J0IHR5cGUgeyBLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi4vaW5rL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmdzIH0gZnJvbSAnLi4vLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB0eXBlIHsgRHJlYW1UYXNrU3RhdGUgfSBmcm9tICcuLi8uLi90YXNrcy9EcmVhbVRhc2svRHJlYW1UYXNrLmpzJ1xuaW1wb3J0IHsgcGx1cmFsIH0gZnJvbSAnLi4vLi4vdXRpbHMvc3RyaW5nVXRpbHMuanMnXG5pbXBvcnQgeyBCeWxpbmUgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0J5bGluZS5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0YXNrOiBEZWVwSW1tdXRhYmxlPERyZWFtVGFza1N0YXRlPlxuICBvbkRvbmU6ICgpID0+IHZvaWRcbiAgb25CYWNrPzogKCkgPT4gdm9pZFxuICBvbktpbGw/OiAoKSA9PiB2b2lkXG59XG5cbi8vIEhvdyBtYW55IHJlY2VudCB0dXJucyB0byByZW5kZXIuIEVhcmxpZXIgdHVybnMgY29sbGFwc2UgdG8gYSBjb3VudC5cbmNvbnN0IFZJU0lCTEVfVFVSTlMgPSA2XG5cbmV4cG9ydCBmdW5jdGlvbiBEcmVhbURldGFpbERpYWxvZyh7XG4gIHRhc2ssXG4gIG9uRG9uZSxcbiAgb25CYWNrLFxuICBvbktpbGwsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IGVsYXBzZWRUaW1lID0gdXNlRWxhcHNlZFRpbWUoXG4gICAgdGFzay5zdGFydFRpbWUsXG4gICAgdGFzay5zdGF0dXMgPT09ICdydW5uaW5nJyxcbiAgICAxMDAwLFxuICAgIDAsXG4gIClcblxuICAvLyBEaWFsb2cgaGFuZGxlcyBjb25maXJtOm5vIChFc2MpIOKGkiBvbkNhbmNlbC4gV2lyZSBjb25maXJtOnllcyAoRW50ZXIveSkgdG9vLlxuICB1c2VLZXliaW5kaW5ncyh7ICdjb25maXJtOnllcyc6IG9uRG9uZSB9LCB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0pXG5cbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSAnICcpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgb25Eb25lKClcbiAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnbGVmdCcgJiYgb25CYWNrKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIG9uQmFjaygpXG4gICAgfSBlbHNlIGlmIChlLmtleSA9PT0gJ3gnICYmIHRhc2suc3RhdHVzID09PSAncnVubmluZycgJiYgb25LaWxsKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIG9uS2lsbCgpXG4gICAgfVxuICB9XG5cbiAgLy8gVHVybnMgd2l0aCB0ZXh0IHRvIHNob3cuIFRvb2wtb25seSB0dXJucyAodGV4dD0nJykgYXJlIGRyb3BwZWQgZW50aXJlbHkg4oCUXG4gIC8vIHRoZSBwZXItdHVybiB0b29sVXNlQ291bnQgYWxyZWFkeSBjYXB0dXJlcyB0aGF0IHdvcmsuXG4gIGNvbnN0IHZpc2libGVUdXJucyA9IHRhc2sudHVybnMuZmlsdGVyKHQgPT4gdC50ZXh0ICE9PSAnJylcbiAgY29uc3Qgc2hvd24gPSB2aXNpYmxlVHVybnMuc2xpY2UoLVZJU0lCTEVfVFVSTlMpXG4gIGNvbnN0IGhpZGRlbiA9IHZpc2libGVUdXJucy5sZW5ndGggLSBzaG93bi5sZW5ndGhcblxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICBhdXRvRm9jdXNcbiAgICAgIG9uS2V5RG93bj17aGFuZGxlS2V5RG93bn1cbiAgICA+XG4gICAgICA8RGlhbG9nXG4gICAgICAgIHRpdGxlPVwiTWVtb3J5IGNvbnNvbGlkYXRpb25cIlxuICAgICAgICBzdWJ0aXRsZT17XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7ZWxhcHNlZFRpbWV9IMK3IHJldmlld2luZyB7dGFzay5zZXNzaW9uc1Jldmlld2luZ317JyAnfVxuICAgICAgICAgICAge3BsdXJhbCh0YXNrLnNlc3Npb25zUmV2aWV3aW5nLCAnc2Vzc2lvbicpfVxuICAgICAgICAgICAge3Rhc2suZmlsZXNUb3VjaGVkLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICAgICAgwrcge3Rhc2suZmlsZXNUb3VjaGVkLmxlbmd0aH17JyAnfVxuICAgICAgICAgICAgICAgIHtwbHVyYWwodGFzay5maWxlc1RvdWNoZWQubGVuZ3RoLCAnZmlsZScpfSB0b3VjaGVkXG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIH1cbiAgICAgICAgb25DYW5jZWw9e29uRG9uZX1cbiAgICAgICAgY29sb3I9XCJiYWNrZ3JvdW5kXCJcbiAgICAgICAgaW5wdXRHdWlkZT17ZXhpdFN0YXRlID0+XG4gICAgICAgICAgZXhpdFN0YXRlLnBlbmRpbmcgPyAoXG4gICAgICAgICAgICA8VGV4dD5QcmVzcyB7ZXhpdFN0YXRlLmtleU5hbWV9IGFnYWluIHRvIGV4aXQ8L1RleHQ+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxCeWxpbmU+XG4gICAgICAgICAgICAgIHtvbkJhY2sgJiYgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwi4oaQXCIgYWN0aW9uPVwiZ28gYmFja1wiIC8+fVxuICAgICAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJFc2MvRW50ZXIvU3BhY2VcIiBhY3Rpb249XCJjbG9zZVwiIC8+XG4gICAgICAgICAgICAgIHt0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnICYmIG9uS2lsbCAmJiAoXG4gICAgICAgICAgICAgICAgPEtleWJvYXJkU2hvcnRjdXRIaW50IHNob3J0Y3V0PVwieFwiIGFjdGlvbj1cInN0b3BcIiAvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9CeWxpbmU+XG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICA+XG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIGdhcD17MX0+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICA8VGV4dCBib2xkPlN0YXR1czo8L1RleHQ+eycgJ31cbiAgICAgICAgICAgIHt0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnID8gKFxuICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImJhY2tncm91bmRcIj5ydW5uaW5nPC9UZXh0PlxuICAgICAgICAgICAgKSA6IHRhc2suc3RhdHVzID09PSAnY29tcGxldGVkJyA/IChcbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJzdWNjZXNzXCI+e3Rhc2suc3RhdHVzfTwvVGV4dD5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj57dGFzay5zdGF0dXN9PC9UZXh0PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L1RleHQ+XG5cbiAgICAgICAgICB7c2hvd24ubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICAgIHt0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnID8gJ1N0YXJ0aW5n4oCmJyA6ICcobm8gdGV4dCBvdXRwdXQpJ31cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAge2hpZGRlbiA+IDAgJiYgKFxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgKHtoaWRkZW59IGVhcmxpZXIge3BsdXJhbChoaWRkZW4sICd0dXJuJyl9KVxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAge3Nob3duLm1hcCgodHVybiwgaSkgPT4gKFxuICAgICAgICAgICAgICAgIDxCb3gga2V5PXtpfSBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICAgICAgICA8VGV4dCB3cmFwPVwid3JhcFwiPnt0dXJuLnRleHR9PC9UZXh0PlxuICAgICAgICAgICAgICAgICAge3R1cm4udG9vbFVzZUNvdW50ID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgICAgICAgICAgIHsnICAnfSh7dHVybi50b29sVXNlQ291bnR9eycgJ31cbiAgICAgICAgICAgICAgICAgICAgICB7cGx1cmFsKHR1cm4udG9vbFVzZUNvdW50LCAndG9vbCcpfSlcbiAgICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICA8Lz5cbiAgICAgICAgICApfVxuICAgICAgICA8L0JveD5cbiAgICAgIDwvRGlhbG9nPlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxLQUFLLE1BQU0sT0FBTztBQUN6QixjQUFjQyxhQUFhLFFBQVEsb0JBQW9CO0FBQ3ZELFNBQVNDLGNBQWMsUUFBUSwrQkFBK0I7QUFDOUQsY0FBY0MsYUFBYSxRQUFRLG9DQUFvQztBQUN2RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hD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