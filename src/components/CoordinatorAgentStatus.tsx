// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * CoordinatorTaskPanel — Steerable list of background agents.
 *
 * Renders below the prompt input footer whenever local_agent tasks exist.
 * Visibility is driven by evictAfter: undefined (running/retained) shows
 * always; a timestamp shows until passed. Enter to view/steer, x to dismiss.
 */

// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 BLACK_CIRCLE、PAUSE_ICON、PLAY_ICON，将 ../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { BLACK_CIRCLE, PAUSE_ICON, PLAY_ICON } from '../constants/figures.js';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js';
// 引入 Box、Text、wrapText，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text, wrapText } from '../ink.js';
// 引入 AppState、useAppState、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { type AppState, useAppState, useSetAppState } from '../state/AppState.js';
// 引入 enterTeammateView、exitTeammateView，将 ../state/teammateViewHelpers.js 中已经封装好的能力接到本文件流程里。
import { enterTeammateView, exitTeammateView } from '../state/teammateViewHelpers.js';
// 引入 isPanelAgentTask、LocalAgentTaskState，将 ../tasks/LocalAgentTask/LocalAgentTask.js 中已经封装好的能力接到本文件流程里。
import { isPanelAgentTask, type LocalAgentTaskState } from '../tasks/LocalAgentTask/LocalAgentTask.js';
// 复用 formatDuration、formatNumber 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatDuration, formatNumber } from '../utils/format.js';
// 复用 evictTerminalTask 工具函数，把通用处理留在 ../utils/task/framework.js 中维护。
import { evictTerminalTask } from '../utils/task/framework.js';
// 引入 isTerminalStatus，将 ./tasks/taskStatusUtils.js 中已经封装好的能力接到本文件流程里。
import { isTerminalStatus } from './tasks/taskStatusUtils.js';

/**
 * Which panel-managed tasks currently have a visible row.
 * Presence in AppState.tasks IS visibility — the 1s tick in
 * CoordinatorTaskPanel evicts tasks past their evictAfter deadline. The
 * evictAfter !== 0 check handles immediate dismiss (x key) without making
 * the filter time-dependent. Shared by panel render, useCoordinatorTaskCount,
 * and index resolvers so the math can't drift.
 */
// getVisibleAgentTasks 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getVisibleAgentTasks(tasks: AppState['tasks']): LocalAgentTaskState[] {
  // 返回 `Object.values(tasks).filter((t): t is LocalAgentTaskState => isPanelAge...`，作为终端渲染这次计算的结果。
  return Object.values(tasks).filter((t): t is LocalAgentTaskState => isPanelAgentTask(t) && t.evictAfter !== 0).sort((a, b) => a.startTime - b.startTime);
}
// CoordinatorTaskPanel 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function CoordinatorTaskPanel(): React.ReactNode {
  // tasks 集合保存`useAppState`，供终端渲染后续处理使用。
  const tasks = useAppState(s => s.tasks);
  // viewingAgentTaskId保存`useAppState`，供终端渲染后续处理使用。
  const viewingAgentTaskId = useAppState(s_0 => s_0.viewingAgentTaskId);
  // agentNameRegistry保存`useAppState`，供终端渲染后续处理使用。
  const agentNameRegistry = useAppState(s_1 => s_1.agentNameRegistry);
  // coordinatorTaskIndex 索引保存`useAppState`，供终端渲染后续处理使用。
  const coordinatorTaskIndex = useAppState(s_2 => s_2.coordinatorTaskIndex);
  // tasksSelected保存`useAppState`，供终端渲染后续处理使用。
  const tasksSelected = useAppState(s_3 => s_3.footerSelection === 'tasks');
  // 选中索引 命名 `tasksSelected ? coordinatorTaskIndex : undefined`，让后续代码直接表达这个值的用途。
  const selectedIndex = tasksSelected ? coordinatorTaskIndex : undefined;
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // visibleTasks 集合读取`getVisibleAgentTasks`，供终端渲染后续处理使用。
  const visibleTasks = getVisibleAgentTasks(tasks);
  // hasTasks 集合记录 `Object.values` 是否成立，终端渲染随后按该结果分支。
  const hasTasks = Object.values(tasks).some(isPanelAgentTask);

  // 1s tick: re-render for elapsed time + evict tasks past their deadline.
  // The eviction deletes from prev.tasks, which makes useCoordinatorTaskCount
  // (and other consumers) see the updated count without their own tick.
  // tasksRef 引用保存`React.useRef`，供终端渲染后续处理使用。
  const tasksRef = React.useRef(tasks);
  // current更新为 `tasks`，确保终端 UI后续读取最新状态。
  tasksRef.current = tasks;
  // 从 `React.useState(0)` 按位置拆出 setTick，让终端 UI 组件 Coordinator Agent Status分别处理这些返回值。
  const [, setTick] = React.useState(0);
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(() => {
    // hasTasks 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
    if (!hasTasks) return;
    // interval保存`setInterval`，供终端渲染后续处理使用。
    const interval = setInterval((tasksRef_0, setAppState_0, setTick_0) => {
      // now记录时间`Date.now`，供终端渲染后续处理使用。
      const now = Date.now();
      // 逐项读取 `Object.values(tasksRef_0.current)` 中的t，按输入顺序推进终端渲染。
      for (const t of Object.values(tasksRef_0.current)) {
        // 只有 `isPanelAgentTask(t) && (t.evictAfter ?? Infinity) <= now` 满足时，终端渲染才执行该分支。
        if (isPanelAgentTask(t) && (t.evictAfter ?? Infinity) <= now) {
          // 调用 evictTerminalTask，触发终端渲染此处需要的副作用。
          evictTerminalTask(t.id, setAppState_0);
        }
      }
      // setTick_0 写入新的状态值，使终端渲染后续读取保持一致。
      setTick_0((prev: number) => prev + 1);
    }, 1000, tasksRef, setAppState, setTick);
    // 返回 `() => clearInterval(interval)`，作为终端渲染这次计算的结果。
    return () => clearInterval(interval);
  }, [hasTasks, setAppState]);
  // nameByAgentId保存`React.useMemo`，供终端渲染后续处理使用。
  const nameByAgentId = React.useMemo(() => {
    // inv构建`new Map<string, string>()`，供后续判断或组装使用。
    const inv = new Map<string, string>();
    // 循环处理 `const [n, id] of agentNameRegistry) inv.set(id, n`，让终端渲染把同类条目按顺序走完。
    for (const [n, id] of agentNameRegistry) inv.set(id, n);
    // 返回 `inv`，作为终端渲染这次计算的结果。
    return inv;
  }, [agentNameRegistry]);
  // visibleTasks 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (visibleTasks.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 返回 `<Box flexDirection="column" marginTop={1}>`，作为终端渲染这次计算的结果。
  return <Box flexDirection="column" marginTop={1}>
      <MainLine isSelected={selectedIndex === 0} isViewed={viewingAgentTaskId === undefined} onClick={() => exitTeammateView(setAppState)} />
      {/* 这个回调绑定到 {visibleTasks.map((task, i) => <AgentLine key={task.id} task={task} name={nameByAgen…，负责终端渲染在该局部场景下的响应。 */}
      {visibleTasks.map((task, i) => <AgentLine key={task.id} task={task} name={nameByAgentId.get(task.id)} isSelected={selectedIndex === i + 1} isViewed={viewingAgentTaskId === task.id} onClick={() => enterTeammateView(task.id, setAppState)} />)}
    </Box>;
}

/**
 * Returns the number of visible coordinator tasks (for selection bounds).
 * The panel's 1s tick evicts expired tasks from prev.tasks, so this count
 * stays accurate without needing its own tick.
 */
// useCoordinatorTaskCount 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useCoordinatorTaskCount() {
  // tasks 集合保存`useAppState`，供终端渲染后续处理使用。
  const tasks = useAppState(_temp);
  // t0 暂存 `0` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t0 暂存 `0` 生成的渲染片段，后续返回路径直接复用。
  t0 = 0;
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.tasks`，作为终端渲染这次计算的结果。
  return s.tasks;
}
// MainLine 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function MainLine(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    isSelected,
    isViewed,
    onClick
  } = t0;
  // 从 `React.useState(false)` 按位置拆出 hover、setHover，让终端 UI 组件 Coordinator Agent Status分别处理这些返回值。
  const [hover, setHover] = React.useState(false);
  // prefix标记终端 UI Coordinator Agent St...是否启用对应路径。
  const prefix = isSelected || hover ? figures.pointer + " " : "  ";
  // bullet保存`isViewed ? BLACK_CIRCLE : figures.circle`，供终端 UI Coordinator Agent St...后续判断或输出使用。
  const bullet = isViewed ? BLACK_CIRCLE : figures.circle;
  // t1 暂存 `() => setHover(true)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `() => setHover(false)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => setHover(true)` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => setHover(true);
    // t2 暂存 `() => setHover(false)` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => setHover(false);
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // t3标记终端 UI Coordinator Agent St...是否启用对应路径。
  const t3 = !isSelected && !isViewed && !hover;
  // t4 暂存 `<Text dimColor={t3} bold={isViewed}>{prefix}{bullet} main...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== bullet || $[3] !== isViewed || $[4] !== prefix || $[5] !== t3) {
    // t4 暂存 `<Text dimColor={t3} bold={isViewed}>{prefix}{bullet} main...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Text dimColor={t3} bold={isViewed}>{prefix}{bullet} main</Text>;
    // $[2] 缓存 `bullet`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = bullet;
    // $[3] 缓存 `isViewed`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = isViewed;
    // $[4] 缓存 `prefix`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = prefix;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `<Box onClick={onClick} onMouseEnter={t1} onMouseLeave={t2...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== onClick || $[8] !== t4) {
    // t5 暂存 `<Box onClick={onClick} onMouseEnter={t1} onMouseLeave={t2...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box onClick={onClick} onMouseEnter={t1} onMouseLeave={t2}>{t4}</Box>;
    // $[7] 缓存 `onClick`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = onClick;
    // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t4;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// AgentLineProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type AgentLineProps = {
  task: LocalAgentTaskState;
  name?: string;
  isSelected?: boolean;
  isViewed?: boolean;
  // 这个回调绑定到 onClick?: () => void;，负责终端渲染在该局部场景下的响应。
  onClick?: () => void;
};
// AgentLine 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function AgentLine(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(32);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    task,
    name,
    isSelected,
    isViewed,
    onClick
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    columns
  } = useTerminalSize();
  // 从 `React.useState(false)` 按位置拆出 hover、setHover，让终端 UI 组件 Coordinator Agent Status分别处理这些返回值。
  const [hover, setHover] = React.useState(false);
  // isRunning记录 `isTerminalStatus` 是否成立，终端渲染随后按该结果分支。
  const isRunning = !isTerminalStatus(task.status);
  // pausedMs 集合 命名 `task.totalPausedMs ?? 0`，让后续代码直接表达这个值的用途。
  const pausedMs = task.totalPausedMs ?? 0;
  // elapsedMs 集合保存`Math.max`，供终端渲染后续处理使用。
  const elapsedMs = Math.max(0, isRunning ? Date.now() - task.startTime - pausedMs : (task.endTime ?? task.startTime) - task.startTime - pausedMs);
  // t1 暂存 `formatDuration(elapsedMs)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== elapsedMs) {
    // t1 暂存 `formatDuration(elapsedMs)` 生成的渲染片段，后续返回路径直接复用。
    t1 = formatDuration(elapsedMs);
    // $[0] 缓存 `elapsedMs`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = elapsedMs;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // elapsed沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const elapsed = t1;
  // tokenCount 数量保存`task.progress?.tokenCount`，供后续判断或组装使用。
  const tokenCount = task.progress?.tokenCount;
  // lastActivity 命名 `task.progress?.lastActivity`，让后续代码直接表达这个值的用途。
  const lastActivity = task.progress?.lastActivity;
  // arrow保存`lastActivity ? figures.arrowDown : figures.arrowUp`，供终端 UI Coordinator Agent St...后续判断或输出使用。
  const arrow = lastActivity ? figures.arrowDown : figures.arrowUp;
  // t2 暂存 `tokenCount !== undefined && tokenCount > 0 ? ` · ${arrow}...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== arrow || $[3] !== tokenCount) {
    // t2 暂存 `tokenCount !== undefined && tokenCount > 0 ? ` · ${arrow}...` 生成的渲染片段，后续返回路径直接复用。
    t2 = tokenCount !== undefined && tokenCount > 0 ? ` · ${arrow} ${formatNumber(tokenCount)} tokens` : "";
    // $[2] 缓存 `arrow`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = arrow;
    // $[3] 缓存 `tokenCount`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = tokenCount;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // tokenText保存`t2`，作为后续临时缓存值处理的输入。
  const tokenText = t2;
  // queuedCount 数量保存 `task.pendingMessages.length` 的判断结果，供终端 UI Coordinator Agent St...后续分支直接复用。
  const queuedCount = task.pendingMessages.length;
  // queuedText保存`queuedCount > 0 ? ` · ${queuedCount} queued` : ""`，供终端 UI Coordinator Agent St...后续判断或输出使用。
  const queuedText = queuedCount > 0 ? ` · ${queuedCount} queued` : "";
  // displayDescription标记终端 UI Coordinator Agent St...是否启用对应路径。
  const displayDescription = task.progress?.summary || task.description;
  // highlighted标记终端 UI Coordinator Agent St...是否启用对应路径。
  const highlighted = isSelected || hover;
  // prefix保存`highlighted ? figures.pointer + " " : " "`，供后续判断或组装使用。
  const prefix = highlighted ? figures.pointer + " " : "  ";
  // bullet保存`isViewed ? BLACK_CIRCLE : figures.circle`，供终端 UI Coordinator Agent St...后续判断或输出使用。
  const bullet = isViewed ? BLACK_CIRCLE : figures.circle;
  // dim标记终端 UI Coordinator Agent St...是否启用对应路径。
  const dim = !highlighted && !isViewed;
  // sep保存`isRunning ? PLAY_ICON : PAUSE_ICON`，供终端 UI Coordinator Agent St...后续判断或输出使用。
  const sep = isRunning ? PLAY_ICON : PAUSE_ICON;
  // namePart保存`name ? `${name}: ` : ""`，供后续判断或组装使用。
  const namePart = name ? `${name}: ` : "";
  // hintPart标记终端 UI Coordinator Agent St...是否启用对应路径。
  const hintPart = isSelected && !isViewed ? ` · x to ${isRunning ? "stop" : "clear"}` : "";
  // suffixPart 命名 `` ${sep} ${elapsed}${tokenText}${queuedText}${hintPart}``，让后续代码直接表达这个值的用途。
  const suffixPart = ` ${sep} ${elapsed}${tokenText}${queuedText}${hintPart}`;
  // availableForDesc保存`stringWidth`，供终端渲染后续处理使用。
  const availableForDesc = columns - stringWidth(prefix) - stringWidth(`${bullet} `) - stringWidth(namePart) - stringWidth(suffixPart);
  // 临时值 t3保存`Math.max`，供终端渲染后续处理使用。
  const t3 = Math.max(0, availableForDesc);
  // t4 暂存 `wrapText(displayDescription, t3, "truncate-end")` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== displayDescription || $[6] !== t3) {
    // t4 暂存 `wrapText(displayDescription, t3, "truncate-end")` 生成的渲染片段，后续返回路径直接复用。
    t4 = wrapText(displayDescription, t3, "truncate-end");
    // $[5] 缓存 `displayDescription`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = displayDescription;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // truncated沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const truncated = t4;
  // t5 暂存 `name && <><Text dimColor={false} bold={true}>{name}</Text...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== name) {
    // t5 暂存 `name && <><Text dimColor={false} bold={true}>{name}</Text...` 生成的渲染片段，后续返回路径直接复用。
    t5 = name && <><Text dimColor={false} bold={true}>{name}</Text>{": "}</>;
    // $[8] 缓存 `name`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = name;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `queuedCount > 0 && <Text color="warning">{queuedText}</Te...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== queuedCount || $[11] !== queuedText) {
    // t6 暂存 `queuedCount > 0 && <Text color="warning">{queuedText}</Te...` 生成的渲染片段，后续返回路径直接复用。
    t6 = queuedCount > 0 && <Text color="warning">{queuedText}</Text>;
    // $[10] 缓存 `queuedCount`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = queuedCount;
    // $[11] 缓存 `queuedText`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = queuedText;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // t7 暂存 `hintPart && <Text dimColor={true}>{hintPart}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== hintPart) {
    // t7 暂存 `hintPart && <Text dimColor={true}>{hintPart}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t7 = hintPart && <Text dimColor={true}>{hintPart}</Text>;
    // $[13] 缓存 `hintPart`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = hintPart;
    // $[14] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[14];
  }
  // t8 暂存 `<Text dimColor={dim} bold={isViewed}>{prefix}{bullet}{" "...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== bullet || $[16] !== dim || $[17] !== elapsed || $[18] !== isViewed || $[19] !== prefix || $[20] !== sep || $[21] !== t5 || $[22] !== t6 || $[23] !== t7 || $[24] !== tokenText || $[25] !== truncated) {
    // t8 暂存 `<Text dimColor={dim} bold={isViewed}>{prefix}{bullet}{" "...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={dim} bold={isViewed}>{prefix}{bullet}{" "}{t5}{truncated} {sep} {elapsed}{tokenText}{t6}{t7}</Text>;
    // $[15] 缓存 `bullet`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = bullet;
    // $[16] 缓存 `dim`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = dim;
    // $[17] 缓存 `elapsed`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = elapsed;
    // $[18] 缓存 `isViewed`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = isViewed;
    // $[19] 缓存 `prefix`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = prefix;
    // $[20] 缓存 `sep`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = sep;
    // $[21] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t5;
    // $[22] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t6;
    // $[23] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t7;
    // $[24] 缓存 `tokenText`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = tokenText;
    // $[25] 缓存 `truncated`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = truncated;
    // $[26] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[26];
  }
  // line保存`t8`，作为后续临时缓存值处理的输入。
  const line = t8;
  // onClick缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!onClick) {
    // 返回 `line`，作为终端渲染这次计算的结果。
    return line;
  }
  // t10 暂存 `() => setHover(false)` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // t9 暂存 `() => setHover(true)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `() => setHover(true)` 生成的渲染片段，后续返回路径直接复用。
    t9 = () => setHover(true);
    // t10 暂存 `() => setHover(false)` 生成的渲染片段，后续返回路径直接复用。
    t10 = () => setHover(false);
    // $[27] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t10;
    // $[28] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t9;
  } else {
    // t10 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[27];
    // t9 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[28];
  }
  // t11 暂存 `<Box onClick={onClick} onMouseEnter={t9} onMouseLeave={t1...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== line || $[30] !== onClick) {
    // t11 暂存 `<Box onClick={onClick} onMouseEnter={t9} onMouseLeave={t1...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box onClick={onClick} onMouseEnter={t9} onMouseLeave={t10}>{line}</Box>;
    // $[29] 缓存 `line`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = line;
    // $[30] 缓存 `onClick`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = onClick;
    // $[31] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[31];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJCTEFDS19DSVJDTEUiLCJQQVVTRV9JQ09OIiwiUExBWV9JQ09OIiwidXNlVGVybWluYWxTaXplIiwic3RyaW5nV2lkdGgiLCJCb3giLCJUZXh0Iiwid3JhcFRleHQiLCJBcHBTdGF0ZSIsInVzZUFwcFN0YXRlIiwidXNlU2V0QXBwU3RhdGUiLCJlbnRlclRlYW1tYXRlVmlldyIsImV4aXRUZWFtbWF0ZVZpZXciLCJpc1BhbmVsQWdlbnRUYXNrIiwiTG9jYWxBZ2VudFRhc2tTdGF0ZSIsImZvcm1hdER1cmF0aW9uIiwiZm9ybWF0TnVtYmVyIiwiZXZpY3RUZXJtaW5hbFRhc2siLCJpc1Rlcm1pbmFsU3RhdHVzIiwiZ2V0VmlzaWJsZUFnZW50VGFza3MiLCJ0YXNrcyIsIk9iamVjdCIsInZhbHVlcyIsImZpbHRlciIsInQiLCJldmljdEFmdGVyIiwic29ydCIsImEiLCJiIiwic3RhcnRUaW1lIiwiQ29vcmRpbmF0b3JUYXNrUGFuZWwiLCJSZWFjdE5vZGUiLCJzIiwidmlld2luZ0FnZW50VGFza0lkIiwiYWdlbnROYW1lUmVnaXN0cnkiLCJjb29yZGluYXRvclRhc2tJbmRleCIsInRhc2tzU2VsZWN0ZWQiLCJmb290ZXJTZWxlY3Rpb24iLCJzZWxlY3RlZEluZGV4IiwidW5kZWZpbmVkIiwic2V0QXBwU3RhdGUiLCJ2aXNpYmxlVGFza3MiLCJoYXNUYXNrcyIsInNvbWUiLCJ0YXNrc1JlZiIsInVzZVJlZiIsImN1cnJlbnQiLCJzZXRUaWNrIiwidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJpbnRlcnZhbCIsInNldEludGVydmFsIiwibm93IiwiRGF0ZSIsIkluZmluaXR5IiwiaWQiLCJwcmV2IiwiY2xlYXJJbnRlcnZhbCIsIm5hbWVCeUFnZW50SWQiLCJ1c2VNZW1vIiwiaW52IiwiTWFwIiwibiIsInNldCIsImxlbmd0aCIsIm1hcCIsInRhc2siLCJpIiwiZ2V0IiwidXNlQ29vcmRpbmF0b3JUYXNrQ291bnQiLCJfdGVtcCIsInQwIiwiTWFpbkxpbmUiLCIkIiwiX2MiLCJpc1NlbGVjdGVkIiwiaXNWaWV3ZWQiLCJvbkNsaWNrIiwiaG92ZXIiLCJzZXRIb3ZlciIsInByZWZpeCIsInBvaW50ZXIiLCJidWxsZXQiLCJjaXJjbGUiLCJ0MSIsInQyIiwiU3ltYm9sIiwiZm9yIiwidDMiLCJ0NCIsInQ1IiwiQWdlbnRMaW5lUHJvcHMiLCJuYW1lIiwiQWdlbnRMaW5lIiwiY29sdW1ucyIsImlzUnVubmluZyIsInN0YXR1cyIsInBhdXNlZE1zIiwidG90YWxQYXVzZWRNcyIsImVsYXBzZWRNcyIsIk1hdGgiLCJtYXgiLCJlbmRUaW1lIiwiZWxhcHNlZCIsInRva2VuQ291bnQiLCJwcm9ncmVzcyIsImxhc3RBY3Rpdml0eSIsImFycm93IiwiYXJyb3dEb3duIiwiYXJyb3dVcCIsInRva2VuVGV4dCIsInF1ZXVlZENvdW50IiwicGVuZGluZ01lc3NhZ2VzIiwicXVldWVkVGV4dCIsImRpc3BsYXlEZXNjcmlwdGlvbiIsInN1bW1hcnkiLCJkZXNjcmlwdGlvbiIsImhpZ2hsaWdodGVkIiwiZGltIiwic2VwIiwibmFtZVBhcnQiLCJoaW50UGFydCIsInN1ZmZpeFBhcnQiLCJhdmFpbGFibGVGb3JEZXNjIiwidHJ1bmNhdGVkIiwidDYiLCJ0NyIsInQ4IiwibGluZSIsInQxMCIsInQ5IiwidDExIl0sInNvdXJjZXMiOlsiQ29vcmRpbmF0b3JBZ2VudFN0YXR1cy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb29yZGluYXRvclRhc2tQYW5lbCDigJQgU3RlZXJhYmxlIGxpc3Qgb2YgYmFja2dyb3VuZCBhZ2VudHMuXG4gKlxuICogUmVuZGVycyBiZWxvdyB0aGUgcHJvbXB0IGlucHV0IGZvb3RlciB3aGVuZXZlciBsb2NhbF9hZ2VudCB0YXNrcyBleGlzdC5cbiAqIFZpc2liaWxpdHkgaXMgZHJpdmVuIGJ5IGV2aWN0QWZ0ZXI6IHVuZGVmaW5lZCAocnVubmluZy9yZXRhaW5lZCkgc2hvd3NcbiAqIGFsd2F5czsgYSB0aW1lc3RhbXAgc2hvd3MgdW50aWwgcGFzc2VkLiBFbnRlciB0byB2aWV3L3N0ZWVyLCB4IHRvIGRpc21pc3MuXG4gKi9cblxuaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQkxBQ0tfQ0lSQ0xFLCBQQVVTRV9JQ09OLCBQTEFZX0lDT04gfSBmcm9tICcuLi9jb25zdGFudHMvZmlndXJlcy5qcydcbmltcG9ydCB7IHVzZVRlcm1pbmFsU2l6ZSB9IGZyb20gJy4uL2hvb2tzL3VzZVRlcm1pbmFsU2l6ZS5qcydcbmltcG9ydCB7IHN0cmluZ1dpZHRoIH0gZnJvbSAnLi4vaW5rL3N0cmluZ1dpZHRoLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0LCB3cmFwVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7XG4gIHR5cGUgQXBwU3RhdGUsXG4gIHVzZUFwcFN0YXRlLFxuICB1c2VTZXRBcHBTdGF0ZSxcbn0gZnJvbSAnLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQge1xuICBlbnRlclRlYW1tYXRlVmlldyxcbiAgZXhpdFRlYW1tYXRlVmlldyxcbn0gZnJvbSAnLi4vc3RhdGUvdGVhbW1hdGVWaWV3SGVscGVycy5qcydcbmltcG9ydCB7XG4gIGlzUGFuZWxBZ2VudFRhc2ssXG4gIHR5cGUgTG9jYWxBZ2VudFRhc2tTdGF0ZSxcbn0gZnJvbSAnLi4vdGFza3MvTG9jYWxBZ2VudFRhc2svTG9jYWxBZ2VudFRhc2suanMnXG5pbXBvcnQgeyBmb3JtYXREdXJhdGlvbiwgZm9ybWF0TnVtYmVyIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgZXZpY3RUZXJtaW5hbFRhc2sgfSBmcm9tICcuLi91dGlscy90YXNrL2ZyYW1ld29yay5qcydcbmltcG9ydCB7IGlzVGVybWluYWxTdGF0dXMgfSBmcm9tICcuL3Rhc2tzL3Rhc2tTdGF0dXNVdGlscy5qcydcblxuLyoqXG4gKiBXaGljaCBwYW5lbC1tYW5hZ2VkIHRhc2tzIGN1cnJlbnRseSBoYXZlIGEgdmlzaWJsZSByb3cuXG4gKiBQcmVzZW5jZSBpbiBBcHBTdGF0ZS50YXNrcyBJUyB2aXNpYmlsaXR5IOKAlCB0aGUgMXMgdGljayBpblxuICogQ29vcmRpbmF0b3JUYXNrUGFuZWwgZXZpY3RzIHRhc2tzIHBhc3QgdGhlaXIgZXZpY3RBZnRlciBkZWFkbGluZS4gVGhlXG4gKiBldmljdEFmdGVyICE9PSAwIGNoZWNrIGhhbmRsZXMgaW1tZWRpYXRlIGRpc21pc3MgKHgga2V5KSB3aXRob3V0IG1ha2luZ1xuICogdGhlIGZpbHRlciB0aW1lLWRlcGVuZGVudC4gU2hhcmVkIGJ5IHBhbmVsIHJlbmRlciwgdXNlQ29vcmRpbmF0b3JUYXNrQ291bnQsXG4gKiBhbmQgaW5kZXggcmVzb2x2ZXJzIHNvIHRoZSBtYXRoIGNhbid0IGRyaWZ0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmlzaWJsZUFnZW50VGFza3MoXG4gIHRhc2tzOiBBcHBTdGF0ZVsndGFza3MnXSxcbik6IExvY2FsQWdlbnRUYXNrU3RhdGVbXSB7XG4gIHJldHVybiBPYmplY3QudmFsdWVzKHRhc2tzKVxuICAgIC5maWx0ZXIoXG4gICAgICAodCk6IHQgaXMgTG9jYWxBZ2VudFRhc2tTdGF0ZSA9PlxuICAgICAgICBpc1BhbmVsQWdlbnRUYXNrKHQpICYmIHQuZXZpY3RBZnRlciAhPT0gMCxcbiAgICApXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuc3RhcnRUaW1lIC0gYi5zdGFydFRpbWUpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDb29yZGluYXRvclRhc2tQYW5lbCgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0YXNrcyA9IHVzZUFwcFN0YXRlKHMgPT4gcy50YXNrcylcbiAgY29uc3Qgdmlld2luZ0FnZW50VGFza0lkID0gdXNlQXBwU3RhdGUocyA9PiBzLnZpZXdpbmdBZ2VudFRhc2tJZClcbiAgY29uc3QgYWdlbnROYW1lUmVnaXN0cnkgPSB1c2VBcHBTdGF0ZShzID0+IHMuYWdlbnROYW1lUmVnaXN0cnkpXG4gIGNvbnN0IGNvb3JkaW5hdG9yVGFza0luZGV4ID0gdXNlQXBwU3RhdGUocyA9PiBzLmNvb3JkaW5hdG9yVGFza0luZGV4KVxuICBjb25zdCB0YXNrc1NlbGVjdGVkID0gdXNlQXBwU3RhdGUocyA9PiBzLmZvb3RlclNlbGVjdGlvbiA9PT0gJ3Rhc2tzJylcbiAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IHRhc2tzU2VsZWN0ZWQgPyBjb29yZGluYXRvclRhc2tJbmRleCA6IHVuZGVmaW5lZFxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcblxuICBjb25zdCB2aXNpYmxlVGFza3MgPSBnZXRWaXNpYmxlQWdlbnRUYXNrcyh0YXNrcylcbiAgY29uc3QgaGFzVGFza3MgPSBPYmplY3QudmFsdWVzKHRhc2tzKS5zb21lKGlzUGFuZWxBZ2VudFRhc2spXG5cbiAgLy8gMXMgdGljazogcmUtcmVuZGVyIGZvciBlbGFwc2VkIHRpbWUgKyBldmljdCB0YXNrcyBwYXN0IHRoZWlyIGRlYWRsaW5lLlxuICAvLyBUaGUgZXZpY3Rpb24gZGVsZXRlcyBmcm9tIHByZXYudGFza3MsIHdoaWNoIG1ha2VzIHVzZUNvb3JkaW5hdG9yVGFza0NvdW50XG4gIC8vIChhbmQgb3RoZXIgY29uc3VtZXJzKSBzZWUgdGhlIHVwZGF0ZWQgY291bnQgd2l0aG91dCB0aGVpciBvd24gdGljay5cbiAgY29uc3QgdGFza3NSZWYgPSBSZWFjdC51c2VSZWYodGFza3MpXG4gIHRhc2tzUmVmLmN1cnJlbnQgPSB0YXNrc1xuICBjb25zdCBbLCBzZXRUaWNrXSA9IFJlYWN0LnVzZVN0YXRlKDApXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFoYXNUYXNrcykgcmV0dXJuXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChcbiAgICAgICh0YXNrc1JlZiwgc2V0QXBwU3RhdGUsIHNldFRpY2spID0+IHtcbiAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKVxuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgT2JqZWN0LnZhbHVlcyh0YXNrc1JlZi5jdXJyZW50KSkge1xuICAgICAgICAgIGlmIChpc1BhbmVsQWdlbnRUYXNrKHQpICYmICh0LmV2aWN0QWZ0ZXIgPz8gSW5maW5pdHkpIDw9IG5vdykge1xuICAgICAgICAgICAgZXZpY3RUZXJtaW5hbFRhc2sodC5pZCwgc2V0QXBwU3RhdGUpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNldFRpY2soKHByZXY6IG51bWJlcikgPT4gcHJldiArIDEpXG4gICAgICB9LFxuICAgICAgMTAwMCxcbiAgICAgIHRhc2tzUmVmLFxuICAgICAgc2V0QXBwU3RhdGUsXG4gICAgICBzZXRUaWNrLFxuICAgIClcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcbiAgfSwgW2hhc1Rhc2tzLCBzZXRBcHBTdGF0ZV0pXG4gIGNvbnN0IG5hbWVCeUFnZW50SWQgPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCBpbnYgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG4gICAgZm9yIChjb25zdCBbbiwgaWRdIG9mIGFnZW50TmFtZVJlZ2lzdHJ5KSBpbnYuc2V0KGlkLCBuKVxuICAgIHJldHVybiBpbnZcbiAgfSwgW2FnZW50TmFtZVJlZ2lzdHJ5XSlcblxuICBpZiAodmlzaWJsZVRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG1hcmdpblRvcD17MX0+XG4gICAgICA8TWFpbkxpbmVcbiAgICAgICAgaXNTZWxlY3RlZD17c2VsZWN0ZWRJbmRleCA9PT0gMH1cbiAgICAgICAgaXNWaWV3ZWQ9e3ZpZXdpbmdBZ2VudFRhc2tJZCA9PT0gdW5kZWZpbmVkfVxuICAgICAgICBvbkNsaWNrPXsoKSA9PiBleGl0VGVhbW1hdGVWaWV3KHNldEFwcFN0YXRlKX1cbiAgICAgIC8+XG4gICAgICB7dmlzaWJsZVRhc2tzLm1hcCgodGFzaywgaSkgPT4gKFxuICAgICAgICA8QWdlbnRMaW5lXG4gICAgICAgICAga2V5PXt0YXNrLmlkfVxuICAgICAgICAgIHRhc2s9e3Rhc2t9XG4gICAgICAgICAgbmFtZT17bmFtZUJ5QWdlbnRJZC5nZXQodGFzay5pZCl9XG4gICAgICAgICAgaXNTZWxlY3RlZD17c2VsZWN0ZWRJbmRleCA9PT0gaSArIDF9XG4gICAgICAgICAgaXNWaWV3ZWQ9e3ZpZXdpbmdBZ2VudFRhc2tJZCA9PT0gdGFzay5pZH1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBlbnRlclRlYW1tYXRlVmlldyh0YXNrLmlkLCBzZXRBcHBTdGF0ZSl9XG4gICAgICAgIC8+XG4gICAgICApKX1cbiAgICA8L0JveD5cbiAgKVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiB2aXNpYmxlIGNvb3JkaW5hdG9yIHRhc2tzIChmb3Igc2VsZWN0aW9uIGJvdW5kcykuXG4gKiBUaGUgcGFuZWwncyAxcyB0aWNrIGV2aWN0cyBleHBpcmVkIHRhc2tzIGZyb20gcHJldi50YXNrcywgc28gdGhpcyBjb3VudFxuICogc3RheXMgYWNjdXJhdGUgd2l0aG91dCBuZWVkaW5nIGl0cyBvd24gdGljay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZUNvb3JkaW5hdG9yVGFza0NvdW50KCk6IG51bWJlciB7XG4gIGNvbnN0IHRhc2tzID0gdXNlQXBwU3RhdGUocyA9PiBzLnRhc2tzKVxuICByZXR1cm4gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgaWYgKFwiZXh0ZXJuYWxcIiAhPT0gJ2FudCcpIHJldHVybiAwXG4gICAgY29uc3QgY291bnQgPSBnZXRWaXNpYmxlQWdlbnRUYXNrcyh0YXNrcykubGVuZ3RoXG4gICAgcmV0dXJuIGNvdW50ID4gMCA/IGNvdW50ICsgMSA6IDBcbiAgfSwgW3Rhc2tzXSlcbn1cblxuZnVuY3Rpb24gTWFpbkxpbmUoe1xuICBpc1NlbGVjdGVkLFxuICBpc1ZpZXdlZCxcbiAgb25DbGljayxcbn06IHtcbiAgaXNTZWxlY3RlZD86IGJvb2xlYW5cbiAgaXNWaWV3ZWQ/OiBib29sZWFuXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWRcbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbaG92ZXIsIHNldEhvdmVyXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBwcmVmaXggPSBpc1NlbGVjdGVkIHx8IGhvdmVyID8gZmlndXJlcy5wb2ludGVyICsgJyAnIDogJyAgJ1xuICBjb25zdCBidWxsZXQgPSBpc1ZpZXdlZCA/IEJMQUNLX0NJUkNMRSA6IGZpZ3VyZXMuY2lyY2xlXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgb25DbGljaz17b25DbGlja31cbiAgICAgIG9uTW91c2VFbnRlcj17KCkgPT4gc2V0SG92ZXIodHJ1ZSl9XG4gICAgICBvbk1vdXNlTGVhdmU9eygpID0+IHNldEhvdmVyKGZhbHNlKX1cbiAgICA+XG4gICAgICA8VGV4dCBkaW1Db2xvcj17IWlzU2VsZWN0ZWQgJiYgIWlzVmlld2VkICYmICFob3Zlcn0gYm9sZD17aXNWaWV3ZWR9PlxuICAgICAgICB7cHJlZml4fVxuICAgICAgICB7YnVsbGV0fSBtYWluXG4gICAgICA8L1RleHQ+XG4gICAgPC9Cb3g+XG4gIClcbn1cblxudHlwZSBBZ2VudExpbmVQcm9wcyA9IHtcbiAgdGFzazogTG9jYWxBZ2VudFRhc2tTdGF0ZVxuICBuYW1lPzogc3RyaW5nXG4gIGlzU2VsZWN0ZWQ/OiBib29sZWFuXG4gIGlzVmlld2VkPzogYm9vbGVhblxuICBvbkNsaWNrPzogKCkgPT4gdm9pZFxufVxuXG5mdW5jdGlvbiBBZ2VudExpbmUoe1xuICB0YXNrLFxuICBuYW1lLFxuICBpc1NlbGVjdGVkLFxuICBpc1ZpZXdlZCxcbiAgb25DbGljayxcbn06IEFnZW50TGluZVByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgeyBjb2x1bW5zIH0gPSB1c2VUZXJtaW5hbFNpemUoKVxuICBjb25zdCBbaG92ZXIsIHNldEhvdmVyXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBpc1J1bm5pbmcgPSAhaXNUZXJtaW5hbFN0YXR1cyh0YXNrLnN0YXR1cylcbiAgY29uc3QgcGF1c2VkTXMgPSB0YXNrLnRvdGFsUGF1c2VkTXMgPz8gMFxuICBjb25zdCBlbGFwc2VkTXMgPSBNYXRoLm1heChcbiAgICAwLFxuICAgIGlzUnVubmluZ1xuICAgICAgPyBEYXRlLm5vdygpIC0gdGFzay5zdGFydFRpbWUgLSBwYXVzZWRNc1xuICAgICAgOiAodGFzay5lbmRUaW1lID8/IHRhc2suc3RhcnRUaW1lKSAtIHRhc2suc3RhcnRUaW1lIC0gcGF1c2VkTXMsXG4gIClcblxuICBjb25zdCBlbGFwc2VkID0gZm9ybWF0RHVyYXRpb24oZWxhcHNlZE1zKVxuICBjb25zdCB0b2tlbkNvdW50ID0gdGFzay5wcm9ncmVzcz8udG9rZW5Db3VudFxuXG4gIC8vIERlcml2ZSBkaXJlY3Rpb24gYXJyb3cgZnJvbSBhY3Rpdml0eSBzdGF0ZSwgc2FtZSBsb2dpYyBhcyBTcGlubmVyXG4gIGNvbnN0IGxhc3RBY3Rpdml0eSA9IHRhc2sucHJvZ3Jlc3M/Lmxhc3RBY3Rpdml0eVxuICBjb25zdCBhcnJvdyA9IGxhc3RBY3Rpdml0eSA/IGZpZ3VyZXMuYXJyb3dEb3duIDogZmlndXJlcy5hcnJvd1VwXG5cbiAgY29uc3QgdG9rZW5UZXh0ID1cbiAgICB0b2tlbkNvdW50ICE9PSB1bmRlZmluZWQgJiYgdG9rZW5Db3VudCA+IDBcbiAgICAgID8gYCDCtyAke2Fycm93fSAke2Zvcm1hdE51bWJlcih0b2tlbkNvdW50KX0gdG9rZW5zYFxuICAgICAgOiAnJ1xuXG4gIGNvbnN0IHF1ZXVlZENvdW50ID0gdGFzay5wZW5kaW5nTWVzc2FnZXMubGVuZ3RoXG4gIGNvbnN0IHF1ZXVlZFRleHQgPSBxdWV1ZWRDb3VudCA+IDAgPyBgIMK3ICR7cXVldWVkQ291bnR9IHF1ZXVlZGAgOiAnJ1xuXG4gIC8vIFByZWNlZGVuY2U6IEFJIHN1bW1hcnkgPiBzdGF0aWMgZGVzY3JpcHRpb24gKG5vIHRvb2wtY2FsbCBhY3Rpdml0eSBub2lzZSlcbiAgY29uc3QgZGlzcGxheURlc2NyaXB0aW9uID0gdGFzay5wcm9ncmVzcz8uc3VtbWFyeSB8fCB0YXNrLmRlc2NyaXB0aW9uXG5cbiAgY29uc3QgaGlnaGxpZ2h0ZWQgPSBpc1NlbGVjdGVkIHx8IGhvdmVyXG4gIGNvbnN0IHByZWZpeCA9IGhpZ2hsaWdodGVkID8gZmlndXJlcy5wb2ludGVyICsgJyAnIDogJyAgJ1xuICBjb25zdCBidWxsZXQgPSBpc1ZpZXdlZCA/IEJMQUNLX0NJUkNMRSA6IGZpZ3VyZXMuY2lyY2xlXG4gIGNvbnN0IGRpbSA9ICFoaWdobGlnaHRlZCAmJiAhaXNWaWV3ZWRcblxuICBjb25zdCBzZXAgPSBpc1J1bm5pbmcgPyBQTEFZX0lDT04gOiBQQVVTRV9JQ09OXG4gIC8vIE5hbWUgaXMgdGhlIHN0ZWVyaW5nIGhhbmRsZSDigJQga2VwdCBvdXQgb2YgdHJ1bmNhdGlvbiBhbmQgdW5kaW1tZWQgc28gaXRcbiAgLy8gc3RheXMgcmVhZGFibGUgZXZlbiB3aGVuIHRoZSByb3cgaXMgaW5hY3RpdmUuIFNob3J0IGJ5IGNvbnZlbnRpb24gKHRoZVxuICAvLyBBZ2VudCB0b29sIHByb21wdCBhc2tzIGZvciBcIm9uZSBvciB0d28gd29yZHMsIGxvd2VyY2FzZVwiKS5cbiAgY29uc3QgbmFtZVBhcnQgPSBuYW1lID8gYCR7bmFtZX06IGAgOiAnJ1xuICBjb25zdCBoaW50UGFydCA9XG4gICAgaXNTZWxlY3RlZCAmJiAhaXNWaWV3ZWQgPyBgIMK3IHggdG8gJHtpc1J1bm5pbmcgPyAnc3RvcCcgOiAnY2xlYXInfWAgOiAnJ1xuICBjb25zdCBzdWZmaXhQYXJ0ID0gYCAke3NlcH0gJHtlbGFwc2VkfSR7dG9rZW5UZXh0fSR7cXVldWVkVGV4dH0ke2hpbnRQYXJ0fWBcbiAgY29uc3QgYXZhaWxhYmxlRm9yRGVzYyA9XG4gICAgY29sdW1ucyAtXG4gICAgc3RyaW5nV2lkdGgocHJlZml4KSAtXG4gICAgc3RyaW5nV2lkdGgoYCR7YnVsbGV0fSBgKSAtXG4gICAgc3RyaW5nV2lkdGgobmFtZVBhcnQpIC1cbiAgICBzdHJpbmdXaWR0aChzdWZmaXhQYXJ0KVxuICBjb25zdCB0cnVuY2F0ZWQgPSB3cmFwVGV4dChcbiAgICBkaXNwbGF5RGVzY3JpcHRpb24sXG4gICAgTWF0aC5tYXgoMCwgYXZhaWxhYmxlRm9yRGVzYyksXG4gICAgJ3RydW5jYXRlLWVuZCcsXG4gIClcblxuICBjb25zdCBsaW5lID0gKFxuICAgIDxUZXh0IGRpbUNvbG9yPXtkaW19IGJvbGQ9e2lzVmlld2VkfT5cbiAgICAgIHtwcmVmaXh9XG4gICAgICB7YnVsbGV0fXsnICd9XG4gICAgICB7bmFtZSAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e2ZhbHNlfSBib2xkPlxuICAgICAgICAgICAge25hbWV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIHsnOiAnfVxuICAgICAgICA8Lz5cbiAgICAgICl9XG4gICAgICB7dHJ1bmNhdGVkfSB7c2VwfSB7ZWxhcHNlZH1cbiAgICAgIHt0b2tlblRleHR9XG4gICAgICB7cXVldWVkQ291bnQgPiAwICYmIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPntxdWV1ZWRUZXh0fTwvVGV4dD59XG4gICAgICB7aGludFBhcnQgJiYgPFRleHQgZGltQ29sb3I+e2hpbnRQYXJ0fTwvVGV4dD59XG4gICAgPC9UZXh0PlxuICApXG5cbiAgaWYgKCFvbkNsaWNrKSByZXR1cm4gbGluZVxuICByZXR1cm4gKFxuICAgIDxCb3hcbiAgICAgIG9uQ2xpY2s9e29uQ2xpY2t9XG4gICAgICBvbk1vdXNlRW50ZXI9eygpID0+IHNldEhvdmVyKHRydWUpfVxuICAgICAgb25Nb3VzZUxlYXZlPXsoKSA9PiBzZXRIb3ZlcihmYWxzZSl9XG4gICAgPlxuICAgICAge2xpbmV9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FB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