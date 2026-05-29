// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useMemo, useState } from 'react';
// 引入 useTerminalSize，将 src/hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from 'src/hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from 'src/ink/stringWidth.js';
// 引入 useAppState、useSetAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from 'src/state/AppState.js';
// 引入 enterTeammateView、exitTeammateView，将 src/state/teammateViewHelpers.js 中已经封装好的能力接到本文件流程里。
import { enterTeammateView, exitTeammateView } from 'src/state/teammateViewHelpers.js';
// 引入 isPanelAgentTask，将 src/tasks/LocalAgentTask/LocalAgentTask.js 中已经封装好的能力接到本文件流程里。
import { isPanelAgentTask } from 'src/tasks/LocalAgentTask/LocalAgentTask.js';
// 引入 getPillLabel、pillNeedsCta，将 src/tasks/pillLabel.js 中已经封装好的能力接到本文件流程里。
import { getPillLabel, pillNeedsCta } from 'src/tasks/pillLabel.js';
// 引入 BackgroundTaskState、isBackgroundTask、TaskState，将 src/tasks/types.js 中已经封装好的能力接到本文件流程里。
import { type BackgroundTaskState, isBackgroundTask, type TaskState } from 'src/tasks/types.js';
// 复用 calculateHorizontalScrollWindow 工具函数，把通用处理留在 src/utils/horizontalScroll.js 中维护。
import { calculateHorizontalScrollWindow } from 'src/utils/horizontalScroll.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 接入 AGENT_COLOR_TO_THEME_COLOR、AGENT_COLORS、AgentColorName 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_COLOR_TO_THEME_COLOR, AGENT_COLORS, type AgentColorName } from '../../tools/AgentTool/agentColorManager.js';
// 类型依赖 { Theme } 来自 ../../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../../utils/theme.js';
// 引入 KeyboardShortcutHint，将 ../design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from '../design-system/KeyboardShortcutHint.js';
// 引入 shouldHideTasksFooter，将 ./taskStatusUtils.js 中已经封装好的能力接到本文件流程里。
import { shouldHideTasksFooter } from './taskStatusUtils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  tasksSelected: boolean;
  isViewingTeammate?: boolean;
  teammateFooterIndex?: number;
  isLeaderIdle?: boolean;
  // 这个回调绑定到 onOpenDialog?: (taskId?: string) => void;，负责终端渲染在该局部场景下的响应。
  onOpenDialog?: (taskId?: string) => void;
};
// BackgroundTaskStatus 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function BackgroundTaskStatus(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(48);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tasksSelected,
    isViewingTeammate,
    teammateFooterIndex: t1,
    isLeaderIdle: t2,
    onOpenDialog
  } = t0;
  // teammateFooterIndex 索引标记终端 UI Background Task Stat...是否启用对应路径。
  const teammateFooterIndex = t1 === undefined ? 0 : t1;
  // isLeaderIdle标记终端 UI Background Task Stat...是否启用对应路径。
  const isLeaderIdle = t2 === undefined ? false : t2;
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // tasks 集合保存`useAppState`，供终端渲染后续处理使用。
  const tasks = useAppState(_temp);
  // viewingAgentTaskId保存`useAppState`，供终端渲染后续处理使用。
  const viewingAgentTaskId = useAppState(_temp2);
  // t3 暂存 `(Object.values(tasks ?? {}) as TaskState[]).filter(_temp3)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== tasks) {
    // t3 暂存 `(Object.values(tasks ?? {}) as TaskState[]).filter(_temp3)` 生成的渲染片段，后续返回路径直接复用。
    t3 = (Object.values(tasks ?? {}) as TaskState[]).filter(_temp3);
    // $[0] 缓存 `tasks`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = tasks;
    // $[1] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[1];
  }
  // runningTasks 集合 命名 `t3`，让后续代码直接表达这个值的用途。
  const runningTasks = t3;
  // expandedView保存`useAppState`，供终端渲染后续处理使用。
  const expandedView = useAppState(_temp4);
  // showSpinnerTree标记终端 UI Background Task Stat...是否启用对应路径。
  const showSpinnerTree = expandedView === "teammates";
  // allTeammates 集合筛选`runningTasks.every`，供终端渲染后续处理使用。
  const allTeammates = !showSpinnerTree && runningTasks.length > 0 && runningTasks.every(_temp5);
  // t4 暂存 `runningTasks.filter(_temp6).sort(_temp7)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== runningTasks) {
    // t4 暂存 `runningTasks.filter(_temp6).sort(_temp7)` 生成的渲染片段，后续返回路径直接复用。
    t4 = runningTasks.filter(_temp6).sort(_temp7);
    // $[2] 缓存 `runningTasks`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = runningTasks;
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // teammateEntries 集合沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const teammateEntries = t4;
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== isLeaderIdle) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      name: "main",
      color: undefined as keyof Theme | undefined,
      isIdle: isLeaderIdle,
      taskId: undefined as string | undefined
    };
    // $[4] 缓存 `isLeaderIdle`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = isLeaderIdle;
    // $[5] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[5];
  }
  // mainPill沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const mainPill = t5;
  // t6 暂存 `pills.map(_temp0)` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== mainPill || $[7] !== tasksSelected || $[8] !== teammateEntries) {
    // teammatePills 集合派生`teammateEntries.map`，供终端渲染后续处理使用。
    const teammatePills = teammateEntries.map(_temp8);
    // tasksSelected缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!tasksSelected) {
      // 调用 teammatePills.sort，触发终端渲染此处需要的副作用。
      teammatePills.sort(_temp9);
    }
    // pills 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const pills = [mainPill, ...teammatePills];
    // t6 暂存 `pills.map(_temp0)` 生成的渲染片段，后续返回路径直接复用。
    t6 = pills.map(_temp0);
    // $[6] 缓存 `mainPill`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = mainPill;
    // $[7] 缓存 `tasksSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = tasksSelected;
    // $[8] 缓存 `teammateEntries`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = teammateEntries;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // allPills 集合沿用 `t6` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const allPills = t6;
  // t7 暂存 `allPills.map(_temp1)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== allPills) {
    // t7 暂存 `allPills.map(_temp1)` 生成的渲染片段，后续返回路径直接复用。
    t7 = allPills.map(_temp1);
    // $[10] 缓存 `allPills`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = allPills;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // pillWidths 集合保存`t7`，作为后续临时缓存值处理的输入。
  const pillWidths = t7;
  // 只有 `allTeammates || !showSpinnerTree && isViewingTeam` 满足时，终端渲染才执行该分支。
  if (allTeammates || !showSpinnerTree && isViewingTeammate) {
    // selectedIdx保存`tasksSelected ? teammateFooterIndex : -1`，供终端 UI Background Task Stat...后续判断或输出使用。
    const selectedIdx = tasksSelected ? teammateFooterIndex : -1;
    // t8 暂存 `viewingAgentTaskId ? teammateEntries.findIndex(t_3 => t_3...` 的派生结果，便于缓存命中时直接复用。
    let t8;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[12] !== teammateEntries || $[13] !== viewingAgentTaskId) {
      // t8 暂存 `viewingAgentTaskId ? teammateEntries.findIndex(t_3 => t_3...` 生成的渲染片段，后续返回路径直接复用。
      t8 = viewingAgentTaskId ? teammateEntries.findIndex(t_3 => t_3.id === viewingAgentTaskId) + 1 : 0;
      // $[12] 缓存 `teammateEntries`，下次依赖未变时 React 编译产物可直接复用。
      $[12] = teammateEntries;
      // $[13] 缓存 `viewingAgentTaskId`，下次依赖未变时 React 编译产物可直接复用。
      $[13] = viewingAgentTaskId;
      // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
      $[14] = t8;
    } else {
      // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
      t8 = $[14];
    }
    // viewedIdx 命名 `t8`，让后续代码直接表达这个值的用途。
    const viewedIdx = t8;
    // availableWidth保存`Math.max`，供终端渲染后续处理使用。
    const availableWidth = Math.max(20, columns - 20 - 4);
    // t9保存`selectedIdx >= 0 ? selectedIdx : 0`，供终端 UI Background Task Stat...后续判断或输出使用。
    const t9 = selectedIdx >= 0 ? selectedIdx : 0;
    // t10 暂存 `calculateHorizontalScrollWindow(pillWidths, availableWidt...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[15] !== availableWidth || $[16] !== pillWidths || $[17] !== t9) {
      // t10 暂存 `calculateHorizontalScrollWindow(pillWidths, availableWidt...` 生成的渲染片段，后续返回路径直接复用。
      t10 = calculateHorizontalScrollWindow(pillWidths, availableWidth, 2, t9);
      // $[15] 缓存 `availableWidth`，下次依赖未变时 React 编译产物可直接复用。
      $[15] = availableWidth;
      // $[16] 缓存 `pillWidths`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = pillWidths;
      // $[17] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
      $[17] = t9;
      // $[18] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[18] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[18];
    }
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      startIndex,
      endIndex,
      showLeftArrow,
      showRightArrow
    } = t10;
    // t11 暂存 `allPills.slice(startIndex, endIndex)` 的派生结果，便于缓存命中时直接复用。
    let t11;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[19] !== allPills || $[20] !== endIndex || $[21] !== startIndex) {
      // t11 暂存 `allPills.slice(startIndex, endIndex)` 生成的渲染片段，后续返回路径直接复用。
      t11 = allPills.slice(startIndex, endIndex);
      // $[19] 缓存 `allPills`，下次依赖未变时 React 编译产物可直接复用。
      $[19] = allPills;
      // $[20] 缓存 `endIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[20] = endIndex;
      // $[21] 缓存 `startIndex`，下次依赖未变时 React 编译产物可直接复用。
      $[21] = startIndex;
      // $[22] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
      $[22] = t11;
    } else {
      // t11 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
      t11 = $[22];
    }
    // visiblePills 集合沿用 `t11` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
    const visiblePills = t11;
    // t12 暂存 `showLeftArrow && <Text dimColor={true}>{figures.arrowLeft...` 的派生结果，便于缓存命中时直接复用。
    let t12;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[23] !== showLeftArrow) {
      // t12 暂存 `showLeftArrow && <Text dimColor={true}>{figures.arrowLeft...` 生成的渲染片段，后续返回路径直接复用。
      t12 = showLeftArrow && <Text dimColor={true}>{figures.arrowLeft} </Text>;
      // $[23] 缓存 `showLeftArrow`，下次依赖未变时 React 编译产物可直接复用。
      $[23] = showLeftArrow;
      // $[24] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[24] = t12;
    } else {
      // t12 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
      t12 = $[24];
    }
    // t13 暂存 `visiblePills.map((pill_1, i_1) => {` 的派生结果，便于缓存命中时直接复用。
    let t13;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[25] !== selectedIdx || $[26] !== setAppState || $[27] !== viewedIdx || $[28] !== visiblePills) {
      // t13 暂存 `visiblePills.map((pill_1, i_1) => {` 生成的渲染片段，后续返回路径直接复用。
      t13 = visiblePills.map((pill_1, i_1) => {
        // needsSeparator标记终端 UI Background Task Stat...是否启用对应路径。
        const needsSeparator = i_1 > 0;
        // 返回 `<React.Fragment key={pill_1.name}>{needsSeparator && <Text> </Text>}<Ag...`，作为终端渲染这次计算的结果。
        return <React.Fragment key={pill_1.name}>{needsSeparator && <Text> </Text>}<AgentPill name={pill_1.name} color={pill_1.color} isSelected={selectedIdx === pill_1.idx} isViewed={viewedIdx === pill_1.idx} isIdle={pill_1.isIdle} onClick={() => pill_1.taskId ? enterTeammateView(pill_1.taskId, setAppState) : exitTeammateView(setAppState)} /></React.Fragment>;
      });
      // $[25] 缓存 `selectedIdx`，下次依赖未变时 React 编译产物可直接复用。
      $[25] = selectedIdx;
      // $[26] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
      $[26] = setAppState;
      // $[27] 缓存 `viewedIdx`，下次依赖未变时 React 编译产物可直接复用。
      $[27] = viewedIdx;
      // $[28] 缓存 `visiblePills`，下次依赖未变时 React 编译产物可直接复用。
      $[28] = visiblePills;
      // $[29] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[29] = t13;
    } else {
      // t13 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
      t13 = $[29];
    }
    // t14 暂存 `showRightArrow && <Text dimColor={true}> {figures.arrowRi...` 的派生结果，便于缓存命中时直接复用。
    let t14;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[30] !== showRightArrow) {
      // t14 暂存 `showRightArrow && <Text dimColor={true}> {figures.arrowRi...` 生成的渲染片段，后续返回路径直接复用。
      t14 = showRightArrow && <Text dimColor={true}> {figures.arrowRight}</Text>;
      // $[30] 缓存 `showRightArrow`，下次依赖未变时 React 编译产物可直接复用。
      $[30] = showRightArrow;
      // $[31] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[31] = t14;
    } else {
      // t14 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
      t14 = $[31];
    }
    // t15 暂存 `<Text dimColor={true}>{" \xB7 "}<KeyboardShortcutHint sho...` 的派生结果，便于缓存命中时直接复用。
    let t15;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[32] === Symbol.for("react.memo_cache_sentinel")) {
      // t15 暂存 `<Text dimColor={true}>{" \xB7 "}<KeyboardShortcutHint sho...` 生成的渲染片段，后续返回路径直接复用。
      t15 = <Text dimColor={true}>{" \xB7 "}<KeyboardShortcutHint shortcut={"shift + \u2193"} action="expand" /></Text>;
      // $[32] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
      $[32] = t15;
    } else {
      // t15 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
      t15 = $[32];
    }
    // t16 暂存 `<>{t12}{t13}{t14}{t15}</>` 的派生结果，便于缓存命中时直接复用。
    let t16;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[33] !== t12 || $[34] !== t13 || $[35] !== t14) {
      // t16 暂存 `<>{t12}{t13}{t14}{t15}</>` 生成的渲染片段，后续返回路径直接复用。
      t16 = <>{t12}{t13}{t14}{t15}</>;
      // $[33] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
      $[33] = t12;
      // $[34] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
      $[34] = t13;
      // $[35] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
      $[35] = t14;
      // $[36] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
      $[36] = t16;
    } else {
      // t16 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
      t16 = $[36];
    }
    // 返回 `t16`，作为终端渲染这次计算的结果。
    return t16;
  }
  // 满足 `shouldHideTasksFooter(tasks ?? {}, showSpinnerTree)` 时，终端渲染执行该分支。
  if (shouldHideTasksFooter(tasks ?? {}, showSpinnerTree)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // runningTasks 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (runningTasks.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t8 暂存 `getPillLabel(runningTasks)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[37] !== runningTasks) {
    // t8 暂存 `getPillLabel(runningTasks)` 生成的渲染片段，后续返回路径直接复用。
    t8 = getPillLabel(runningTasks);
    // $[37] 缓存 `runningTasks`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = runningTasks;
    // $[38] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[38];
  }
  // t9 暂存 `<SummaryPill selected={tasksSelected} onClick={onOpenDial...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[39] !== onOpenDialog || $[40] !== t8 || $[41] !== tasksSelected) {
    // t9 暂存 `<SummaryPill selected={tasksSelected} onClick={onOpenDial...` 生成的渲染片段，后续返回路径直接复用。
    t9 = <SummaryPill selected={tasksSelected} onClick={onOpenDialog}>{t8}</SummaryPill>;
    // $[39] 缓存 `onOpenDialog`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = onOpenDialog;
    // $[40] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t8;
    // $[41] 缓存 `tasksSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = tasksSelected;
    // $[42] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[42];
  }
  // t10 暂存 `pillNeedsCta(runningTasks) && <Text dimColor={true}> · {f...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[43] !== runningTasks) {
    // t10 暂存 `pillNeedsCta(runningTasks) && <Text dimColor={true}> · {f...` 生成的渲染片段，后续返回路径直接复用。
    t10 = pillNeedsCta(runningTasks) && <Text dimColor={true}> · {figures.arrowDown} to view</Text>;
    // $[43] 缓存 `runningTasks`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = runningTasks;
    // $[44] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[44];
  }
  // t11 暂存 `<>{t9}{t10}</>` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[45] !== t10 || $[46] !== t9) {
    // t11 暂存 `<>{t9}{t10}</>` 生成的渲染片段，后续返回路径直接复用。
    t11 = <>{t9}{t10}</>;
    // $[45] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t10;
    // $[46] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t9;
    // $[47] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[47];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp1 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp1(pill_0, i_0) {
  // pillText固定为 ``@${pill_0.name}``，作为终端 UI Background Task Stat...后续展示或比较的基准。
  const pillText = `@${pill_0.name}`;
  // 返回 `stringWidth(pillText) + (i_0 > 0 ? 1 : 0)`，作为终端渲染这次计算的结果。
  return stringWidth(pillText) + (i_0 > 0 ? 1 : 0);
}
// _temp0 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp0(pill, i) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...pill,
    idx: i
  };
}
// _temp9 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp9(a_0, b_0) {
  // `a_0.isIdle` 与 `b_0.isIdle` 不一致时刷新派生状态，避免使用过期结果。
  if (a_0.isIdle !== b_0.isIdle) {
    // 返回 `a_0.isIdle ? 1 : -1`，作为终端渲染这次计算的结果。
    return a_0.isIdle ? 1 : -1;
  }
  // 返回 `0`，作为终端渲染这次计算的结果。
  return 0;
}
// _temp8 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8(t_2) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    name: t_2.identity.agentName,
    color: getAgentThemeColor(t_2.identity.color),
    isIdle: t_2.isIdle,
    taskId: t_2.id
  };
}
// _temp7 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(a, b) {
  // 返回 `a.identity.agentName.localeCompare(b.identity.agentName)`，作为终端渲染这次计算的结果。
  return a.identity.agentName.localeCompare(b.identity.agentName);
}
// _temp6 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(t_1) {
  // 返回 `t_1.type === "in_process_teammate"`，作为终端渲染这次计算的结果。
  return t_1.type === "in_process_teammate";
}
// _temp5 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(t_0) {
  // 返回 `t_0.type === "in_process_teammate"`，作为终端渲染这次计算的结果。
  return t_0.type === "in_process_teammate";
}
// _temp4 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(s_1) {
  // 返回 `s_1.expandedView`，作为终端渲染这次计算的结果。
  return s_1.expandedView;
}
// _temp3 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(t) {
  // 返回 `isBackgroundTask(t) && !(false && isPanelAgentTask(t))`，作为终端渲染这次计算的结果。
  return isBackgroundTask(t) && !(false && isPanelAgentTask(t));
}
// _temp2 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.viewingAgentTaskId`，作为终端渲染这次计算的结果。
  return s_0.viewingAgentTaskId;
}
// _temp 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.tasks`，作为终端渲染这次计算的结果。
  return s.tasks;
}
// AgentPillProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type AgentPillProps = {
  name: string;
  color?: keyof Theme;
  isSelected: boolean;
  isViewed: boolean;
  isIdle: boolean;
  // 这个回调绑定到 onClick?: () => void;，负责终端渲染在该局部场景下的响应。
  onClick?: () => void;
};
// AgentPill 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AgentPill(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(19);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    name,
    color,
    isSelected,
    isViewed,
    isIdle,
    onClick
  } = t0;
  // 悬停状态 由 React state 持有，setHover 会在用户操作或异步结果返回时触发刷新。
  const [hover, setHover] = useState(false);
  // highlighted标记终端 UI Background Task Stat...是否启用对应路径。
  const highlighted = isSelected || hover;
  // label 先占位，稍后的条件分支会根据实际输入补齐它。
  let label;
  // 满足 `highlighted` 时，终端渲染执行该分支。
  if (highlighted) {
    // t1 暂存 `color ? <Text backgroundColor={color} color="inverseText"...` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[0] !== color || $[1] !== isViewed || $[2] !== name) {
      // t1 暂存 `color ? <Text backgroundColor={color} color="inverseText"...` 生成的渲染片段，后续返回路径直接复用。
      t1 = color ? <Text backgroundColor={color} color="inverseText" bold={isViewed}>@{name}</Text> : <Text color="background" inverse={true} bold={isViewed}>@{name}</Text>;
      // $[0] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = color;
      // $[1] 缓存 `isViewed`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = isViewed;
      // $[2] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = name;
      // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[3];
    }
    // label更新为 `t1`，确保任务详情界面后续读取最新状态。
    label = t1;
  } else {
    // 满足 `isIdle` 时，终端渲染执行该分支。
    if (isIdle) {
      // t1 暂存 `<Text dimColor={true} bold={isViewed}>@{name}</Text>` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[4] !== isViewed || $[5] !== name) {
        // t1 暂存 `<Text dimColor={true} bold={isViewed}>@{name}</Text>` 生成的渲染片段，后续返回路径直接复用。
        t1 = <Text dimColor={true} bold={isViewed}>@{name}</Text>;
        // $[4] 缓存 `isViewed`，下次依赖未变时 React 编译产物可直接复用。
        $[4] = isViewed;
        // $[5] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
        $[5] = name;
        // $[6] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[6] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[6];
      }
      // label更新为 `t1`，确保任务详情界面后续读取最新状态。
      label = t1;
    } else {
      // 满足 `isViewed` 时，终端渲染执行该分支。
      if (isViewed) {
        // t1 暂存 `<Text color={color} bold={true}>@{name}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[7] !== color || $[8] !== name) {
          // t1 暂存 `<Text color={color} bold={true}>@{name}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t1 = <Text color={color} bold={true}>@{name}</Text>;
          // $[7] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = color;
          // $[8] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
          $[8] = name;
          // $[9] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[9] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[9];
        }
        // label更新为 `t1`，确保任务详情界面后续读取最新状态。
        label = t1;
      } else {
        // t1标记终端 UI Background Task Stat...是否启用对应路径。
        const t1 = !color;
        // t2 暂存 `<Text color={color} dimColor={t1}>@{name}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[10] !== color || $[11] !== name || $[12] !== t1) {
          // t2 暂存 `<Text color={color} dimColor={t1}>@{name}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t2 = <Text color={color} dimColor={t1}>@{name}</Text>;
          // $[10] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
          $[10] = color;
          // $[11] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
          $[11] = name;
          // $[12] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = t1;
          // $[13] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[13] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[13];
        }
        // label更新为 `t2`，确保任务详情界面后续读取最新状态。
        label = t2;
      }
    }
  }
  // onClick缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!onClick) {
    // 返回 `label`，作为终端渲染这次计算的结果。
    return label;
  }
  // t1 暂存 `() => setHover(true)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `() => setHover(false)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => setHover(true)` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => setHover(true);
    // t2 暂存 `() => setHover(false)` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => setHover(false);
    // $[14] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t1;
    // $[15] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[14];
    // t2 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[15];
  }
  // t3 暂存 `<Box onClick={onClick} onMouseEnter={t1} onMouseLeave={t2...` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== label || $[17] !== onClick) {
    // t3 暂存 `<Box onClick={onClick} onMouseEnter={t1} onMouseLeave={t2...` 生成的渲染片段，后续返回路径直接复用。
    t3 = <Box onClick={onClick} onMouseEnter={t1} onMouseLeave={t2}>{label}</Box>;
    // $[16] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = label;
    // $[17] 缓存 `onClick`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onClick;
    // $[18] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[18];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// SummaryPill 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function SummaryPill(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    selected,
    onClick,
    children
  } = t0;
  // 悬停状态 由 React state 持有，setHover 会在用户操作或异步结果返回时触发刷新。
  const [hover, setHover] = useState(false);
  // t1标记终端 UI Background Task Stat...是否启用对应路径。
  const t1 = selected || hover;
  // t2 暂存 `<Text color="background" inverse={t1}>{children}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== children || $[1] !== t1) {
    // t2 暂存 `<Text color="background" inverse={t1}>{children}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text color="background" inverse={t1}>{children}</Text>;
    // $[0] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = children;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // label保存`t2`，作为后续临时缓存值处理的输入。
  const label = t2;
  // onClick缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!onClick) {
    // 返回 `label`，作为终端渲染这次计算的结果。
    return label;
  }
  // t3 暂存 `() => setHover(true)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `() => setHover(false)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `() => setHover(true)` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => setHover(true);
    // t4 暂存 `() => setHover(false)` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => setHover(false);
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `<Box onClick={onClick} onMouseEnter={t3} onMouseLeave={t4...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== label || $[6] !== onClick) {
    // t5 暂存 `<Box onClick={onClick} onMouseEnter={t3} onMouseLeave={t4...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box onClick={onClick} onMouseEnter={t3} onMouseLeave={t4}>{label}</Box>;
    // $[5] 缓存 `label`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = label;
    // $[6] 缓存 `onClick`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = onClick;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// getAgentThemeColor 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAgentThemeColor(colorName: string | undefined): keyof Theme | undefined {
  // colorName缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!colorName) return undefined;
  // 满足 `AGENT_COLORS.includes(colorName as AgentColorName)` 时，终端渲染执行该分支。
  if (AGENT_COLORS.includes(colorName as AgentColorName)) {
    // 返回 `AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName]`，作为终端渲染这次计算的结果。
    return AGENT_COLOR_TO_THEME_COLOR[colorName as AgentColorName];
  }
  // 返回 `undefined`，作为终端渲染这次计算的结果。
  return undefined;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VNZW1vIiwidXNlU3RhdGUiLCJ1c2VUZXJtaW5hbFNpemUiLCJzdHJpbmdXaWR0aCIsInVzZUFwcFN0YXRlIiwidXNlU2V0QXBwU3RhdGUiLCJlbnRlclRlYW1tYXRlVmlldyIsImV4aXRUZWFtbWF0ZVZpZXciLCJpc1BhbmVsQWdlbnRUYXNrIiwiZ2V0UGlsbExhYmVsIiwicGlsbE5lZWRzQ3RhIiwiQmFja2dyb3VuZFRhc2tTdGF0ZSIsImlzQmFja2dyb3VuZFRhc2siLCJUYXNrU3RhdGUiLCJjYWxjdWxhdGVIb3Jpem9udGFsU2Nyb2xsV2luZG93IiwiQm94IiwiVGV4dCIsIkFHRU5UX0NPTE9SX1RPX1RIRU1FX0NPTE9SIiwiQUdFTlRfQ09MT1JTIiwiQWdlbnRDb2xvck5hbWUiLCJUaGVtZSIsIktleWJvYXJkU2hvcnRjdXRIaW50Iiwic2hvdWxkSGlkZVRhc2tzRm9vdGVyIiwiUHJvcHMiLCJ0YXNrc1NlbGVjdGVkIiwiaXNWaWV3aW5nVGVhbW1hdGUiLCJ0ZWFtbWF0ZUZvb3RlckluZGV4IiwiaXNMZWFkZXJJZGxlIiwib25PcGVuRGlhbG9nIiwidGFza0lkIiwiQmFja2dyb3VuZFRhc2tTdGF0dXMiLCJ0MCIsIiQiLCJfYyIsInQxIiwidDIiLCJ1bmRlZmluZWQiLCJzZXRBcHBTdGF0ZSIsImNvbHVtbnMiLCJ0YXNrcyIsIl90ZW1wIiwidmlld2luZ0FnZW50VGFza0lkIiwiX3RlbXAyIiwidDMiLCJPYmplY3QiLCJ2YWx1ZXMiLCJmaWx0ZXIiLCJfdGVtcDMiLCJydW5uaW5nVGFza3MiLCJleHBhbmRlZFZpZXciLCJfdGVtcDQiLCJzaG93U3Bpbm5lclRyZWUiLCJhbGxUZWFtbWF0ZXMiLCJsZW5ndGgiLCJldmVyeSIsIl90ZW1wNSIsInQ0IiwiX3RlbXA2Iiwic29ydCIsIl90ZW1wNyIsInRlYW1tYXRlRW50cmllcyIsInQ1IiwibmFtZSIsImNvbG9yIiwiaXNJZGxlIiwibWFpblBpbGwiLCJ0NiIsInRlYW1tYXRlUGlsbHMiLCJtYXAiLCJfdGVtcDgiLCJfdGVtcDkiLCJwaWxscyIsIl90ZW1wMCIsImFsbFBpbGxzIiwidDciLCJfdGVtcDEiLCJwaWxsV2lkdGhzIiwic2VsZWN0ZWRJZHgiLCJ0OCIsImZpbmRJbmRleCIsInRfMyIsInQiLCJpZCIsInZpZXdlZElkeCIsImF2YWlsYWJsZVdpZHRoIiwiTWF0aCIsIm1heCIsInQ5IiwidDEwIiwic3RhcnRJbmRleCIsImVuZEluZGV4Iiwic2hvd0xlZnRBcnJvdyIsInNob3dSaWdodEFycm93IiwidDExIiwic2xpY2UiLCJ2aXNpYmxlUGlsbHMiLCJ0MTIiLCJhcnJvd0xlZnQiLCJ0MTMiLCJwaWxsXzEiLCJpXzEiLCJuZWVkc1NlcGFyYXRvciIsImkiLCJwaWxsIiwiaWR4IiwidDE0IiwiYXJyb3dSaWdodCIsInQxNSIsIlN5bWJvbCIsImZvciIsInQxNiIsImFycm93RG93biIsInBpbGxfMCIsImlfMCIsInBpbGxUZXh0IiwiYV8wIiwiYl8wIiwiYSIsImIiLCJ0XzIiLCJpZGVudGl0eSIsImFnZW50TmFtZSIsImdldEFnZW50VGhlbWVDb2xvciIsImxvY2FsZUNvbXBhcmUiLCJ0XzEiLCJ0eXBlIiwidF8wIiwic18xIiwicyIsInNfMCIsIkFnZW50UGlsbFByb3BzIiwiaXNTZWxlY3RlZCIsImlzVmlld2VkIiwib25DbGljayIsIkFnZW50UGlsbCIsImhvdmVyIiwic2V0SG92ZXIiLCJoaWdobGlnaHRlZCIsImxhYmVsIiwiU3VtbWFyeVBpbGwiLCJzZWxlY3RlZCIsImNoaWxkcmVuIiwiY29sb3JOYW1lIiwiaW5jbHVkZXMiXSwic291cmNlcyI6WyJCYWNrZ3JvdW5kVGFza1N0YXR1cy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlTWVtbywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJ3NyYy9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBzdHJpbmdXaWR0aCB9IGZyb20gJ3NyYy9pbmsvc3RyaW5nV2lkdGguanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICdzcmMvc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQge1xuICBlbnRlclRlYW1tYXRlVmlldyxcbiAgZXhpdFRlYW1tYXRlVmlldyxcbn0gZnJvbSAnc3JjL3N0YXRlL3RlYW1tYXRlVmlld0hlbHBlcnMuanMnXG5pbXBvcnQgeyBpc1BhbmVsQWdlbnRUYXNrIH0gZnJvbSAnc3JjL3Rhc2tzL0xvY2FsQWdlbnRUYXNrL0xvY2FsQWdlbnRUYXNrLmpzJ1xuaW1wb3J0IHsgZ2V0UGlsbExhYmVsLCBwaWxsTmVlZHNDdGEgfSBmcm9tICdzcmMvdGFza3MvcGlsbExhYmVsLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBCYWNrZ3JvdW5kVGFza1N0YXRlLFxuICBpc0JhY2tncm91bmRUYXNrLFxuICB0eXBlIFRhc2tTdGF0ZSxcbn0gZnJvbSAnc3JjL3Rhc2tzL3R5cGVzLmpzJ1xuaW1wb3J0IHsgY2FsY3VsYXRlSG9yaXpvbnRhbFNjcm9sbFdpbmRvdyB9IGZyb20gJ3NyYy91dGlscy9ob3Jpem9udGFsU2Nyb2xsLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1IsXG4gIEFHRU5UX0NPTE9SUyxcbiAgdHlwZSBBZ2VudENvbG9yTmFtZSxcbn0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50Q29sb3JNYW5hZ2VyLmpzJ1xuaW1wb3J0IHR5cGUgeyBUaGVtZSB9IGZyb20gJy4uLy4uL3V0aWxzL3RoZW1lLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgc2hvdWxkSGlkZVRhc2tzRm9vdGVyIH0gZnJvbSAnLi90YXNrU3RhdHVzVXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHRhc2tzU2VsZWN0ZWQ6IGJvb2xlYW5cbiAgaXNWaWV3aW5nVGVhbW1hdGU/OiBib29sZWFuXG4gIHRlYW1tYXRlRm9vdGVySW5kZXg/OiBudW1iZXJcbiAgaXNMZWFkZXJJZGxlPzogYm9vbGVhblxuICBvbk9wZW5EaWFsb2c/OiAodGFza0lkPzogc3RyaW5nKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBCYWNrZ3JvdW5kVGFza1N0YXR1cyh7XG4gIHRhc2tzU2VsZWN0ZWQsXG4gIGlzVmlld2luZ1RlYW1tYXRlLFxuICB0ZWFtbWF0ZUZvb3RlckluZGV4ID0gMCxcbiAgaXNMZWFkZXJJZGxlID0gZmFsc2UsXG4gIG9uT3BlbkRpYWxvZyxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3Qgc2V0QXBwU3RhdGUgPSB1c2VTZXRBcHBTdGF0ZSgpXG4gIGNvbnN0IHsgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcbiAgY29uc3QgdGFza3MgPSB1c2VBcHBTdGF0ZShzID0+IHMudGFza3MpXG4gIGNvbnN0IHZpZXdpbmdBZ2VudFRhc2tJZCA9IHVzZUFwcFN0YXRlKHMgPT4gcy52aWV3aW5nQWdlbnRUYXNrSWQpXG5cbiAgY29uc3QgcnVubmluZ1Rhc2tzID0gdXNlTWVtbyhcbiAgICAoKSA9PlxuICAgICAgKE9iamVjdC52YWx1ZXModGFza3MgPz8ge30pIGFzIFRhc2tTdGF0ZVtdKS5maWx0ZXIoXG4gICAgICAgIHQgPT5cbiAgICAgICAgICBpc0JhY2tncm91bmRUYXNrKHQpICYmXG4gICAgICAgICAgIShcImV4dGVybmFsXCIgPT09ICdhbnQnICYmIGlzUGFuZWxBZ2VudFRhc2sodCkpLFxuICAgICAgKSxcbiAgICBbdGFza3NdLFxuICApXG5cbiAgLy8gQ2hlY2sgaWYgYWxsIHRhc2tzIGFyZSBpbi1wcm9jZXNzIHRlYW1tYXRlcyAodGVhbSBtb2RlKVxuICAvLyBJbiBzcGlubmVyLXRyZWUgbW9kZSwgZG9uJ3Qgc2hvdyB0ZWFtbWF0ZSBwaWxscyAodGVhbW1hdGVzIGFwcGVhciBpbiB0aGUgc3Bpbm5lciB0cmVlKVxuICBjb25zdCBleHBhbmRlZFZpZXcgPSB1c2VBcHBTdGF0ZShzID0+IHMuZXhwYW5kZWRWaWV3KVxuICBjb25zdCBzaG93U3Bpbm5lclRyZWUgPSBleHBhbmRlZFZpZXcgPT09ICd0ZWFtbWF0ZXMnXG4gIGNvbnN0IGFsbFRlYW1tYXRlcyA9XG4gICAgIXNob3dTcGlubmVyVHJlZSAmJlxuICAgIHJ1bm5pbmdUYXNrcy5sZW5ndGggPiAwICYmXG4gICAgcnVubmluZ1Rhc2tzLmV2ZXJ5KHQgPT4gdC50eXBlID09PSAnaW5fcHJvY2Vzc190ZWFtbWF0ZScpXG5cbiAgLy8gTWVtb2l6ZSB0ZWFtbWF0ZS1yZWxhdGVkIGNvbXB1dGF0aW9ucyBhdCB0aGUgdG9wIGxldmVsIChydWxlcyBvZiBob29rcylcbiAgY29uc3QgdGVhbW1hdGVFbnRyaWVzID0gdXNlTWVtbyhcbiAgICAoKSA9PlxuICAgICAgcnVubmluZ1Rhc2tzXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgKHQpOiB0IGlzIEJhY2tncm91bmRUYXNrU3RhdGUgJiB7IHR5cGU6ICdpbl9wcm9jZXNzX3RlYW1tYXRlJyB9ID0+XG4gICAgICAgICAgICB0LnR5cGUgPT09ICdpbl9wcm9jZXNzX3RlYW1tYXRlJyxcbiAgICAgICAgKVxuICAgICAgICAuc29ydCgoYSwgYikgPT5cbiAgICAgICAgICBhLmlkZW50aXR5LmFnZW50TmFtZS5sb2NhbGVDb21wYXJlKGIuaWRlbnRpdHkuYWdlbnROYW1lKSxcbiAgICAgICAgKSxcbiAgICBbcnVubmluZ1Rhc2tzXSxcbiAgKVxuXG4gIC8vIEJ1aWxkIGFycmF5IG9mIGFsbCBwaWxscyB3aXRoIHRoZWlyIGFjdGl2aXR5IHN0YXRlXG4gIC8vIEVhY2ggcGlsbCBpcyBcIkB7bmFtZX1cIiBhbmQgc2VwYXJhdG9yIGlzIFwiIFwiICgxIGNoYXIpXG4gIC8vIFNvcnQgaWRsZSBhZ2VudHMgdG8gdGhlIGVuZCwgYnV0IG9ubHkgd2hlbiBub3QgaW4gc2VsZWN0aW9uIG1vZGVcbiAgLy8gdG8gYXZvaWQgcmVvcmRlcmluZyB3aGlsZSB1c2VyIGlzIGFycm93aW5nIHRocm91Z2ggdGhlIGxpc3RcbiAgLy8gXCJtYWluXCIgYWx3YXlzIHN0YXlzIGZpcnN0IHJlZ2FyZGxlc3Mgb2YgaWRsZSBzdGF0ZVxuICBjb25zdCBhbGxQaWxscyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IG1haW5QaWxsID0ge1xuICAgICAgbmFtZTogJ21haW4nLFxuICAgICAgY29sb3I6IHVuZGVmaW5lZCBhcyBrZXlvZiBUaGVtZSB8IHVuZGVmaW5lZCxcbiAgICAgIGlzSWRsZTogaXNMZWFkZXJJZGxlLFxuICAgICAgdGFza0lkOiB1bmRlZmluZWQgYXMgc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIH1cblxuICAgIGNvbnN0IHRlYW1tYXRlUGlsbHMgPSB0ZWFtbWF0ZUVudHJpZXMubWFwKHQgPT4gKHtcbiAgICAgIG5hbWU6IHQuaWRlbnRpdHkuYWdlbnROYW1lLFxuICAgICAgY29sb3I6IGdldEFnZW50VGhlbWVDb2xvcih0LmlkZW50aXR5LmNvbG9yKSxcbiAgICAgIGlzSWRsZTogdC5pc0lkbGUsXG4gICAgICB0YXNrSWQ6IHQuaWQsXG4gICAgfSkpXG5cbiAgICAvLyBPbmx5IHNvcnQgdGVhbW1hdGVzIHdoZW4gbm90IHNlbGVjdGluZyB0byBhdm9pZCByZW9yZGVyaW5nIGR1cmluZyBuYXZpZ2F0aW9uXG4gICAgaWYgKCF0YXNrc1NlbGVjdGVkKSB7XG4gICAgICB0ZWFtbWF0ZVBpbGxzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgLy8gQWN0aXZlIGFnZW50cyBmaXJzdCwgaWRsZSBhZ2VudHMgbGFzdFxuICAgICAgICBpZiAoYS5pc0lkbGUgIT09IGIuaXNJZGxlKSByZXR1cm4gYS5pc0lkbGUgPyAxIDogLTFcbiAgICAgICAgcmV0dXJuIDAgLy8gS2VlcCBvcmlnaW5hbCBvcmRlciB3aXRoaW4gZWFjaCBncm91cFxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBtYWluIGFsd2F5cyBmaXJzdCwgdGhlbiBzb3J0ZWQgdGVhbW1hdGVzXG4gICAgY29uc3QgcGlsbHMgPSBbbWFpblBpbGwsIC4uLnRlYW1tYXRlUGlsbHNdXG5cbiAgICAvLyBBZGQgaWR4IGFmdGVyIHNvcnRpbmdcbiAgICByZXR1cm4gcGlsbHMubWFwKChwaWxsLCBpKSA9PiAoeyAuLi5waWxsLCBpZHg6IGkgfSkpXG4gIH0sIFt0ZWFtbWF0ZUVudHJpZXMsIGlzTGVhZGVySWRsZSwgdGFza3NTZWxlY3RlZF0pXG5cbiAgLy8gQ2FsY3VsYXRlIHBpbGwgd2lkdGhzIChpbmNsdWRpbmcgc2VwYXJhdG9yIHNwYWNlLCBleGNlcHQgZmlyc3QpXG4gIGNvbnN0IHBpbGxXaWR0aHMgPSB1c2VNZW1vKFxuICAgICgpID0+XG4gICAgICBhbGxQaWxscy5tYXAoKHBpbGwsIGkpID0+IHtcbiAgICAgICAgY29uc3QgcGlsbFRleHQgPSBgQCR7cGlsbC5uYW1lfWBcbiAgICAgICAgLy8gRmlyc3QgcGlsbCBoYXMgbm8gbGVhZGluZyBzcGFjZSwgb3RoZXJzIGhhdmUgMSBzcGFjZSBzZXBhcmF0b3JcbiAgICAgICAgcmV0dXJuIHN0cmluZ1dpZHRoKHBpbGxUZXh0KSArIChpID4gMCA/IDEgOiAwKVxuICAgICAgfSksXG4gICAgW2FsbFBpbGxzXSxcbiAgKVxuXG4gIGlmIChhbGxUZWFtbWF0ZXMgfHwgKCFzaG93U3Bpbm5lclRyZWUgJiYgaXNWaWV3aW5nVGVhbW1hdGUpKSB7XG4gICAgY29uc3Qgc2VsZWN0ZWRJZHggPSB0YXNrc1NlbGVjdGVkID8gdGVhbW1hdGVGb290ZXJJbmRleCA6IC0xXG4gICAgLy8gV2hpY2ggYWdlbnQgaXMgY3VycmVudGx5IGZvcmVncm91bmRlZCAoYm9sZClcbiAgICBjb25zdCB2aWV3ZWRJZHggPSB2aWV3aW5nQWdlbnRUYXNrSWRcbiAgICAgID8gdGVhbW1hdGVFbnRyaWVzLmZpbmRJbmRleCh0ID0+IHQuaWQgPT09IHZpZXdpbmdBZ2VudFRhc2tJZCkgKyAxXG4gICAgICA6IDAgLy8gMCA9IG1haW4vbGVhZGVyXG5cbiAgICAvLyBDYWxjdWxhdGUgYXZhaWxhYmxlIHdpZHRoIGZvciBwaWxsc1xuICAgIC8vIFJlc2VydmUgc3BhY2UgZm9yOiBhcnJvd3MsIGhpbnQsIGFuZCBtaW5pbWFsIHBhZGRpbmdcbiAgICAvLyBQaWxscyBhcmUgcmVuZGVyZWQgb24gdGhlaXIgb3duIGxpbmUgd2hlbiBpbiB0ZWFtIG1vZGVcbiAgICBjb25zdCBBUlJPV19XSURUSCA9IDIgLy8gYXJyb3cgY2hhciArIHNwYWNlXG4gICAgY29uc3QgSElOVF9XSURUSCA9IDIwIC8vIHNoaWZ0K+KGkyB0byBleHBhbmRcbiAgICBjb25zdCBQQURESU5HID0gNCAvLyBtaW5pbWFsIHNhZmV0eSBtYXJnaW5cbiAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDIwLCBjb2x1bW5zIC0gSElOVF9XSURUSCAtIFBBRERJTkcpXG5cbiAgICAvLyBDYWxjdWxhdGUgdmlzaWJsZSB3aW5kb3cgb2YgcGlsbHNcbiAgICBjb25zdCB7IHN0YXJ0SW5kZXgsIGVuZEluZGV4LCBzaG93TGVmdEFycm93LCBzaG93UmlnaHRBcnJvdyB9ID1cbiAgICAgIGNhbGN1bGF0ZUhvcml6b250YWxTY3JvbGxXaW5kb3coXG4gICAgICAgIHBpbGxXaWR0aHMsXG4gICAgICAgIGF2YWlsYWJsZVdpZHRoLFxuICAgICAgICBBUlJPV19XSURUSCxcbiAgICAgICAgc2VsZWN0ZWRJZHggPj0gMCA/IHNlbGVjdGVkSWR4IDogMCxcbiAgICAgIClcblxuICAgIGNvbnN0IHZpc2libGVQaWxscyA9IGFsbFBpbGxzLnNsaWNlKHN0YXJ0SW5kZXgsIGVuZEluZGV4KVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIHtzaG93TGVmdEFycm93ICYmIDxUZXh0IGRpbUNvbG9yPntmaWd1cmVzLmFycm93TGVmdH0gPC9UZXh0Pn1cbiAgICAgICAge3Zpc2libGVQaWxscy5tYXAoKHBpbGwsIGkpID0+IHtcbiAgICAgICAgICAvLyBGaXJzdCB2aXNpYmxlIHBpbGwgaGFzIG5vIGxlYWRpbmcgc2VwYXJhdG9yXG4gICAgICAgICAgLy8gKGxlZnQgYXJyb3cgYWxyZWFkeSBwcm92aWRlcyBzcGFjaW5nIGlmIHByZXNlbnQpXG4gICAgICAgICAgY29uc3QgbmVlZHNTZXBhcmF0b3IgPSBpID4gMFxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8UmVhY3QuRnJhZ21lbnQga2V5PXtwaWxsLm5hbWV9PlxuICAgICAgICAgICAgICB7bmVlZHNTZXBhcmF0b3IgJiYgPFRleHQ+IDwvVGV4dD59XG4gICAgICAgICAgICAgIDxBZ2VudFBpbGxcbiAgICAgICAgICAgICAgICBuYW1lPXtwaWxsLm5hbWV9XG4gICAgICAgICAgICAgICAgY29sb3I9e3BpbGwuY29sb3J9XG4gICAgICAgICAgICAgICAgaXNTZWxlY3RlZD17c2VsZWN0ZWRJZHggPT09IHBpbGwuaWR4fVxuICAgICAgICAgICAgICAgIGlzVmlld2VkPXt2aWV3ZWRJZHggPT09IHBpbGwuaWR4fVxuICAgICAgICAgICAgICAgIGlzSWRsZT17cGlsbC5pc0lkbGV9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT5cbiAgICAgICAgICAgICAgICAgIHBpbGwudGFza0lkXG4gICAgICAgICAgICAgICAgICAgID8gZW50ZXJUZWFtbWF0ZVZpZXcocGlsbC50YXNrSWQsIHNldEFwcFN0YXRlKVxuICAgICAgICAgICAgICAgICAgICA6IGV4aXRUZWFtbWF0ZVZpZXcoc2V0QXBwU3RhdGUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9SZWFjdC5GcmFnbWVudD5cbiAgICAgICAgICApXG4gICAgICAgIH0pfVxuICAgICAgICB7c2hvd1JpZ2h0QXJyb3cgJiYgPFRleHQgZGltQ29sb3I+IHtmaWd1cmVzLmFycm93UmlnaHR9PC9UZXh0Pn1cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgeycgwrcgJ31cbiAgICAgICAgICA8S2V5Ym9hcmRTaG9ydGN1dEhpbnQgc2hvcnRjdXQ9XCJzaGlmdCArIOKGk1wiIGFjdGlvbj1cImV4cGFuZFwiIC8+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuXG4gIC8vIEluIHNwaW5uZXItdHJlZSBtb2RlLCBkb24ndCBzaG93IGFueSBmb290ZXIgc3RhdHVzIGZvciB0ZWFtbWF0ZXNcbiAgLy8gKHRoZXkgYXBwZWFyIGluIHRoZSBzcGlubmVyIHRyZWUgYWJvdmUpXG4gIGlmIChzaG91bGRIaWRlVGFza3NGb290ZXIodGFza3MgPz8ge30sIHNob3dTcGlubmVyVHJlZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKHJ1bm5pbmdUYXNrcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPFN1bW1hcnlQaWxsIHNlbGVjdGVkPXt0YXNrc1NlbGVjdGVkfSBvbkNsaWNrPXtvbk9wZW5EaWFsb2d9PlxuICAgICAgICB7Z2V0UGlsbExhYmVsKHJ1bm5pbmdUYXNrcyl9XG4gICAgICA8L1N1bW1hcnlQaWxsPlxuICAgICAge3BpbGxOZWVkc0N0YShydW5uaW5nVGFza3MpICYmIChcbiAgICAgICAgPFRleHQgZGltQ29sb3I+IMK3IHtmaWd1cmVzLmFycm93RG93bn0gdG8gdmlldzwvVGV4dD5cbiAgICAgICl9XG4gICAgPC8+XG4gIClcbn1cblxudHlwZSBBZ2VudFBpbGxQcm9wcyA9IHtcbiAgbmFtZTogc3RyaW5nXG4gIGNvbG9yPzoga2V5b2YgVGhlbWVcbiAgaXNTZWxlY3RlZDogYm9vbGVhblxuICBpc1ZpZXdlZDogYm9vbGVhblxuICBpc0lkbGU6IGJvb2xlYW5cbiAgb25DbGljaz86ICgpID0+IHZvaWRcbn1cblxuZnVuY3Rpb24gQWdlbnRQaWxsKHtcbiAgbmFtZSxcbiAgY29sb3IsXG4gIGlzU2VsZWN0ZWQsXG4gIGlzVmlld2VkLFxuICBpc0lkbGUsXG4gIG9uQ2xpY2ssXG59OiBBZ2VudFBpbGxQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtob3Zlciwgc2V0SG92ZXJdID0gdXNlU3RhdGUoZmFsc2UpXG4gIC8vIEhvdmVyIG1pcnJvcnMgdGhlIGtleWJvYXJkLXNlbGVjdGVkIGxvb2sgc28gdGhlIGFmZm9yZGFuY2UgaXMgZmFtaWxpYXIuXG4gIGNvbnN0IGhpZ2hsaWdodGVkID0gaXNTZWxlY3RlZCB8fCBob3ZlclxuXG4gIGxldCBsYWJlbDogUmVhY3QuUmVhY3ROb2RlXG4gIGlmIChoaWdobGlnaHRlZCkge1xuICAgIGxhYmVsID0gY29sb3IgPyAoXG4gICAgICA8VGV4dCBiYWNrZ3JvdW5kQ29sb3I9e2NvbG9yfSBjb2xvcj1cImludmVyc2VUZXh0XCIgYm9sZD17aXNWaWV3ZWR9PlxuICAgICAgICBAe25hbWV9XG4gICAgICA8L1RleHQ+XG4gICAgKSA6IChcbiAgICAgIDxUZXh0IGNvbG9yPVwiYmFja2dyb3VuZFwiIGludmVyc2UgYm9sZD17aXNWaWV3ZWR9PlxuICAgICAgICBAe25hbWV9XG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9IGVsc2UgaWYgKGlzSWRsZSkge1xuICAgIGxhYmVsID0gKFxuICAgICAgPFRleHQgZGltQ29sb3IgYm9sZD17aXNWaWV3ZWR9PlxuICAgICAgICBAe25hbWV9XG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9IGVsc2UgaWYgKGlzVmlld2VkKSB7XG4gICAgbGFiZWwgPSAoXG4gICAgICA8VGV4dCBjb2xvcj17Y29sb3J9IGJvbGQ+XG4gICAgICAgIEB7bmFtZX1cbiAgICAgIDwvVGV4dD5cbiAgICApXG4gIH0gZWxzZSB7XG4gICAgbGFiZWwgPSAoXG4gICAgICA8VGV4dCBjb2xvcj17Y29sb3J9IGRpbUNvbG9yPXshY29sb3J9PlxuICAgICAgICBAe25hbWV9XG4gICAgICA8L1RleHQ+XG4gICAgKVxuICB9XG5cbiAgaWYgKCFvbkNsaWNrKSByZXR1cm4gbGFiZWxcbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBvbkNsaWNrPXtvbkNsaWNrfVxuICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBzZXRIb3Zlcih0cnVlKX1cbiAgICAgIG9uTW91c2VMZWF2ZT17KCkgPT4gc2V0SG92ZXIoZmFsc2UpfVxuICAgID5cbiAgICAgIHtsYWJlbH1cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTdW1tYXJ5UGlsbCh7XG4gIHNlbGVjdGVkLFxuICBvbkNsaWNrLFxuICBjaGlsZHJlbixcbn06IHtcbiAgc2VsZWN0ZWQ6IGJvb2xlYW5cbiAgb25DbGljaz86ICgpID0+IHZvaWRcbiAgY2hpbGRyZW46IFJlYWN0LlJlYWN0Tm9kZVxufSk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtob3Zlciwgc2V0SG92ZXJdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IGxhYmVsID0gKFxuICAgIDxUZXh0IGNvbG9yPVwiYmFja2dyb3VuZFwiIGludmVyc2U9e3NlbGVjdGVkIHx8IGhvdmVyfT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L1RleHQ+XG4gIClcbiAgaWYgKCFvbkNsaWNrKSByZXR1cm4gbGFiZWxcbiAgcmV0dXJuIChcbiAgICA8Qm94XG4gICAgICBvbkNsaWNrPXtvbkNsaWNrfVxuICAgICAgb25Nb3VzZUVudGVyPXsoKSA9PiBzZXRIb3Zlcih0cnVlKX1cbiAgICAgIG9uTW91c2VMZWF2ZT17KCkgPT4gc2V0SG92ZXIoZmFsc2UpfVxuICAgID5cbiAgICAgIHtsYWJlbH1cbiAgICA8L0JveD5cbiAgKVxufVxuXG5mdW5jdGlvbiBnZXRBZ2VudFRoZW1lQ29sb3IoXG4gIGNvbG9yTmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkLFxuKToga2V5b2YgVGhlbWUgfCB1bmRlZmluZWQge1xuICBpZiAoIWNvbG9yTmFtZSkgcmV0dXJuIHVuZGVmaW5lZFxuICBpZiAoQUdFTlRfQ09MT1JTLmluY2x1ZGVzKGNvbG9yTmFtZSBhcyBBZ2VudENvbG9yTmFtZSkpIHtcbiAgICByZXR1cm4gQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1JbY29sb3JOYW1lIGFzIEFnZW50Q29sb3JOYW1lXVxuICB9XG4gIHJldHVybiB1bmRlZmluZWRcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsT0FBTyxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUN6QyxTQUFTQyxlQUFlLFFBQVEsOEJBQThCO0FBQzlELFNBQVNDLFdBQVcsUUFBUSx3QkFBd0I7QUFDcEQsU0FBU0MsV0FBVyxFQUFFQyxjQUFjLFFBQVEsdUJBQXVCO0FBQ25FLFNBQ0VDLGlCQUFpQixFQUNqQkMsZ0JBQWdCLFFBQ1gsa0NBQWtDO0FBQ3pDLFNBQVNDLGdCQUFnQixRQUFRLDRDQUE0QztBQUM3RSxTQUFTQyxZQUFZLEVBQUVDLFlBQVksUUFBUSx3QkFBd0I7QUFDbkUsU0FDRSxLQUFLQyxtQkFBbUIsRUFDeEJDLGdCQUFnQixFQUNoQixLQUFLQyxTQUFTLFFBQ1Qsb0JBQW9CO0FBQzNCLFNBQVNDLCtCQUErQixRQUFRLCtCQUErQjtBQUMvRSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQ0VDLDBCQUEwQixFQUMxQkMsWUFBWSxFQUNaLEtBQUtDLGNBQWMsUUFDZCw0Q0FBNEM7QUFDbkQsY0FBY0MsS0FBSyxRQUFRLHNCQUFzQjtBQUNqRCxTQUFTQyxvQkFBb0IsUUFBUSwwQ0FBMEM7QUFDL0UsU0FBU0MscUJBQXFCLFFBQVEsc0JBQXNCO0FBRTVELEtBQUtDLEtBQUssR0FBRztFQUNYQyxhQUFhLEVBQUUsT0FBTztFQUN0QkMsaUJBQWlCLENBQUMsRUFBRSxPQUFPO0VBQzNCQyxtQkFBbUIsQ0FBQyxFQUFFLE1B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