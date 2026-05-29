// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useTerminalSize，将 ../hooks/useTerminalSize.js 中已经封装好的能力接到本文件流程里。
import { useTerminalSize } from '../hooks/useTerminalSize.js';
// 复用 stringWidth 终端界面组件，避免在这里重复拼装显示逻辑。
import { stringWidth } from '../ink/stringWidth.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js';
// 引入 isInProcessTeammateTask，将 ../tasks/InProcessTeammateTask/types.js 中已经封装好的能力接到本文件流程里。
import { isInProcessTeammateTask } from '../tasks/InProcessTeammateTask/types.js';
// 接入 AGENT_COLOR_TO_THEME_COLOR、AgentColorName 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_COLOR_TO_THEME_COLOR, type AgentColorName } from '../tools/AgentTool/agentColorManager.js';
// 复用 isAgentSwarmsEnabled 工具函数，把通用处理留在 ../utils/agentSwarmsEnabled.js 中维护。
import { isAgentSwarmsEnabled } from '../utils/agentSwarmsEnabled.js';
// 复用 count 工具函数，把通用处理留在 ../utils/array.js 中维护。
import { count } from '../utils/array.js';
// 复用 summarizeRecentActivities 工具函数，把通用处理留在 ../utils/collapseReadSearch.js 中维护。
import { summarizeRecentActivities } from '../utils/collapseReadSearch.js';
// 复用 truncateToWidth 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { truncateToWidth } from '../utils/format.js';
// 复用 isTodoV2Enabled、Task 工具函数，把通用处理留在 ../utils/tasks.js 中维护。
import { isTodoV2Enabled, type Task } from '../utils/tasks.js';
// 类型依赖 { Theme } 来自 ../utils/theme.js，用于校准终端渲染的数据契约。
import type { Theme } from '../utils/theme.js';
// 引入 ThemedText，将 ./design-system/ThemedText.js 中已经封装好的能力接到本文件流程里。
import ThemedText from './design-system/ThemedText.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  tasks: Task[];
  isStandalone?: boolean;
};
// RECENT_COMPLETED_TTL_MS 集合保存`30_000`，供后续判断或组装使用。
const RECENT_COMPLETED_TTL_MS = 30_000;
// byIdAsc 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function byIdAsc(a: Task, b: Task): number {
  // aNum解析`parseInt`，供终端渲染后续处理使用。
  const aNum = parseInt(a.id, 10);
  // bNum解析`parseInt`，供终端渲染后续处理使用。
  const bNum = parseInt(b.id, 10);
  // 只有 `!isNaN(aNum) && !isNaN(bNum)` 满足时，终端渲染才执行该分支。
  if (!isNaN(aNum) && !isNaN(bNum)) {
    // 返回 `aNum - bNum`，作为终端渲染这次计算的结果。
    return aNum - bNum;
  }
  // 返回 `a.id.localeCompare(b.id)`，作为终端渲染这次计算的结果。
  return a.id.localeCompare(b.id);
}
// TaskListV2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TaskListV2({
  tasks,
  isStandalone = false
}: Props): React.ReactNode {
  // teamContext保存`useAppState`，供终端渲染后续处理使用。
  const teamContext = useAppState(s => s.teamContext);
  // appStateTasks 状态保存`useAppState`，供终端渲染后续处理使用。
  const appStateTasks = useAppState(s_0 => s_0.tasks);
  // 从 `React.useState(0)` 按位置拆出 forceUpdate，让终端 UI 组件 Task List V2分别处理这些返回值。
  const [, forceUpdate] = React.useState(0);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    rows,
    columns
  } = useTerminalSize();

  // Track when each task was last observed transitioning to completed
  // completionTimestampsRef 引用保存`React.useRef`，供终端渲染后续处理使用。
  const completionTimestampsRef = React.useRef(new Map<string, number>());
  // previousCompletedIdsRef 引用 命名 `React.useRef<Set<string> | null>(null)`，让后续代码直接表达这个值的用途。
  const previousCompletedIdsRef = React.useRef<Set<string> | null>(null);
  // 满足 `previousCompletedIdsRef.current === null` 时，终端渲染执行该分支。
  if (previousCompletedIdsRef.current === null) {
    // current更新为 `new Set(tasks.filter(t => t.status === 'completed').map(t...`，确保终端 UI后续读取最新状态。
    previousCompletedIdsRef.current = new Set(tasks.filter(t => t.status === 'completed').map(t_0 => t_0.id));
  }
  // maxDisplay保存`Math.min`，供终端渲染后续处理使用。
  const maxDisplay = rows <= 10 ? 0 : Math.min(10, Math.max(3, rows - 14));

  // Update completion timestamps: reset when a task transitions to completed
  // currentCompletedIds 集合保存`Set`，供终端渲染后续处理使用。
  const currentCompletedIds = new Set(tasks.filter(t_1 => t_1.status === 'completed').map(t_2 => t_2.id));
  // now记录时间`Date.now`，供终端渲染后续处理使用。
  const now = Date.now();
  // 按顺序遍历 `currentCompletedIds` 中的标识符，逐个交给终端渲染处理。
  for (const id of currentCompletedIds) {
    // 满足 `!previousCompletedIdsRef.current.has(id)` 时，终端渲染执行该分支。
    if (!previousCompletedIdsRef.current.has(id)) {
      // completionTimestampsRef.current.set 写入新的状态值，使终端渲染后续读取保持一致。
      completionTimestampsRef.current.set(id, now);
    }
  }
  // 逐项读取 `completionTimestampsRef.current.keys()` 中的id_0，按输入顺序推进终端渲染。
  for (const id_0 of completionTimestampsRef.current.keys()) {
    // 满足 `!currentCompletedIds.has(id_0)` 时，终端渲染执行该分支。
    if (!currentCompletedIds.has(id_0)) {
      // 调用 completionTimestampsRef.current.delete，触发终端渲染此处需要的副作用。
      completionTimestampsRef.current.delete(id_0);
    }
  }
  // current更新为 `currentCompletedIds`，确保终端 UI后续读取最新状态。
  previousCompletedIdsRef.current = currentCompletedIds;

  // Schedule re-render when the next recent completion expires.
  // Depend on `tasks` so the timer is only reset when the task list changes,
  // not on every render (which was causing unnecessary work).
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(() => {
    // 满足 `completionTimestampsRef.current.size === 0` 时，终端渲染执行该分支。
    if (completionTimestampsRef.current.size === 0) {
      // 终端 UI 组件 Task List V2在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // currentNow记录时间`Date.now`，供终端渲染后续处理使用。
    const currentNow = Date.now();
    // earliestExpiry保存`Infinity`，供终端 UI Task List V2后续判断或输出使用。
    let earliestExpiry = Infinity;
    // 逐项读取 `completionTimestampsRef.current.values()` 中的ts 集合，按输入顺序推进终端渲染。
    for (const ts of completionTimestampsRef.current.values()) {
      // expiry保存`ts + RECENT_COMPLETED_TTL_MS`，供终端 UI Task List V2后续判断或输出使用。
      const expiry = ts + RECENT_COMPLETED_TTL_MS;
      // 只有 `expiry > currentNow && expiry < earliestExpiry` 满足时，终端渲染才执行该分支。
      if (expiry > currentNow && expiry < earliestExpiry) {
        // earliestExpiry更新为 `expiry`，确保终端 UI后续读取最新状态。
        earliestExpiry = expiry;
      }
    }
    // 满足 `earliestExpiry === Infinity` 时，终端渲染执行该分支。
    if (earliestExpiry === Infinity) {
      // 终端 UI 组件 Task List V2在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // timer保存`setTimeout`，供终端渲染后续处理使用。
    const timer = setTimeout(forceUpdate_0 => forceUpdate_0((n: number) => n + 1), earliestExpiry - currentNow, forceUpdate);
    // 返回 `() => clearTimeout(timer)`，作为终端渲染这次计算的结果。
    return () => clearTimeout(timer);
  }, [tasks]);
  // 满足 `!isTodoV2Enabled()` 时，终端渲染执行该分支。
  if (!isTodoV2Enabled()) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // tasks 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (tasks.length === 0) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }

  // Build a map of teammate name -> theme color
  // teammateColors 集合 从空对象开始收集键值，后续按名称补齐内容。
  const teammateColors: Record<string, keyof Theme> = {};
  // 只有 `isAgentSwarmsEnabled() && teamContext?.teammates` 满足时，终端渲染才执行该分支。
  if (isAgentSwarmsEnabled() && teamContext?.teammates) {
    // 逐项读取 `Object.values(teamContext.teammates)` 中的teammate，按输入顺序推进终端渲染。
    for (const teammate of Object.values(teamContext.teammates)) {
      // 满足 `teammate.color` 时，终端渲染执行该分支。
      if (teammate.color) {
        // themeColor读取 `AGENT_COLOR_TO_THEME_COLOR[teammate.color as AgentColorNa...` 对应条目，后续围绕该成员继续处理。
        const themeColor = AGENT_COLOR_TO_THEME_COLOR[teammate.color as AgentColorName];
        // 满足 `themeColor` 时，终端渲染执行该分支。
        if (themeColor) {
          // 名称更新为 `themeColor`，确保终端 UI 组件 Task List V2后续读取最新状态。
          teammateColors[teammate.name] = themeColor;
        }
      }
    }
  }

  // Build a map of teammate name -> current activity description
  // Map both agentName ("researcher") and agentId ("researcher@team") so
  // task owners match regardless of which format the model used.
  // Rolls up consecutive search/read tool uses into a compact summary.
  // Also track which teammates are still running (not shut down).
  // teammateActivity 从空对象开始收集键值，后续按名称补齐内容。
  const teammateActivity: Record<string, string> = {};
  // activeTeammates 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const activeTeammates = new Set<string>();
  // 满足 `isAgentSwarmsEnabled()` 时，终端渲染执行该分支。
  if (isAgentSwarmsEnabled()) {
    // 逐项读取 `Object.values(appStateTasks)` 中的bgTask，按输入顺序推进终端渲染。
    for (const bgTask of Object.values(appStateTasks)) {
      // 当 `isInProcessTeammateTask(bgTask) && bgTask.s...` 匹配 `'running'` 时，终端渲染执行对应分支。
      if (isInProcessTeammateTask(bgTask) && bgTask.status === 'running') {
        // 调用 activeTeammates.add，触发终端渲染此处需要的副作用。
        activeTeammates.add(bgTask.identity.agentName);
        // 调用 activeTeammates.add，触发终端渲染此处需要的副作用。
        activeTeammates.add(bgTask.identity.agentId);
        // activities 集合保存`bgTask.progress?.recentActivities`，供终端 UI Task List V2后续判断或输出使用。
        const activities = bgTask.progress?.recentActivities;
        // desc保存`summarizeRecentActivities`，供终端渲染后续处理使用。
        const desc = (activities && summarizeRecentActivities(activities)) ?? bgTask.progress?.lastActivity?.activityDescription;
        // 满足 `desc` 时，终端渲染执行该分支。
        if (desc) {
          // agentName更新为 `desc`，确保终端 UI 组件 Task List V2后续读取最新状态。
          teammateActivity[bgTask.identity.agentName] = desc;
          // agentId更新为 `desc`，确保终端 UI 组件 Task List V2后续读取最新状态。
          teammateActivity[bgTask.identity.agentId] = desc;
        }
      }
    }
  }

  // Get task counts for display
  // completedCount 数量统计`count`，供终端渲染后续处理使用。
  const completedCount = count(tasks, t_3 => t_3.status === 'completed');
  // pendingCount 数量统计`count`，供终端渲染后续处理使用。
  const pendingCount = count(tasks, t_4 => t_4.status === 'pending');
  // inProgressCount 数量记录 `tasks.length - completedCount - pendingCount` 是否成立，下一步按该结果分支。
  const inProgressCount = tasks.length - completedCount - pendingCount;
  // Unresolved tasks (open or in_progress) block dependent tasks
  // unresolvedTaskIds 集合保存`Set`，供终端渲染后续处理使用。
  const unresolvedTaskIds = new Set(tasks.filter(t_5 => t_5.status !== 'completed').map(t_6 => t_6.id));

  // Check if we need to truncate
  // needsTruncation标记终端 UI Task List V2是否启用对应路径。
  const needsTruncation = tasks.length > maxDisplay;
  // visibleTasks 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let visibleTasks: Task[];
  // hiddenTasks 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let hiddenTasks: Task[];
  // 满足 `needsTruncation` 时，终端渲染执行该分支。
  if (needsTruncation) {
    // Prioritize: recently completed (within 30s), in-progress, pending, older completed
    // recentCompleted 从空数组开始收集，后续循环会按处理顺序追加条目。
    const recentCompleted: Task[] = [];
    // olderCompleted 从空数组开始收集，后续循环会按处理顺序追加条目。
    const olderCompleted: Task[] = [];
    // 逐项读取 `tasks.filter(t_7 => t_7.status === 'completed')` 中的task，按输入顺序推进终端渲染。
    for (const task of tasks.filter(t_7 => t_7.status === 'completed')) {
      // ts_0读取`current.get`，供终端渲染后续处理使用。
      const ts_0 = completionTimestampsRef.current.get(task.id);
      // 只有 `ts_0 && now - ts_0 < RECENT_COMPLETED_TTL_MS` 满足时，终端渲染才执行该分支。
      if (ts_0 && now - ts_0 < RECENT_COMPLETED_TTL_MS) {
        // recentCompleted追加新条目，保持收集顺序与输入顺序一致。
        recentCompleted.push(task);
      } else {
        // olderCompleted追加新条目，保持收集顺序与输入顺序一致。
        olderCompleted.push(task);
      }
    }
    // 调用 recentCompleted.sort，触发终端渲染此处需要的副作用。
    recentCompleted.sort(byIdAsc);
    // 调用 olderCompleted.sort，触发终端渲染此处需要的副作用。
    olderCompleted.sort(byIdAsc);
    // inProgress 集合筛选`tasks.filter`，供终端渲染后续处理使用。
    const inProgress = tasks.filter(t_8 => t_8.status === 'in_progress').sort(byIdAsc);
    // pending筛选`tasks.filter`，供终端渲染后续处理使用。
    const pending = tasks.filter(t_9 => t_9.status === 'pending').sort((a, b) => {
      // aBlocked筛选`blockedBy.some`，供终端渲染后续处理使用。
      const aBlocked = a.blockedBy.some(id_1 => unresolvedTaskIds.has(id_1));
      // bBlocked筛选`blockedBy.some`，供终端渲染后续处理使用。
      const bBlocked = b.blockedBy.some(id_2 => unresolvedTaskIds.has(id_2));
      // `aBlocked` 与 `bBlocked` 不一致时刷新派生状态，避免使用过期结果。
      if (aBlocked !== bBlocked) {
        // 返回 `aBlocked ? 1 : -1`，作为终端渲染这次计算的结果。
        return aBlocked ? 1 : -1;
      }
      // 返回 `byIdAsc(a, b)`，作为终端渲染这次计算的结果。
      return byIdAsc(a, b);
    });
    // prioritized 聚合成有序列表，保持后续遍历顺序稳定。
    const prioritized = [...recentCompleted, ...inProgress, ...pending, ...olderCompleted];
    // visibleTasks 集合更新为 `prioritized.slice(0, maxDisplay)`，确保终端 UI后续读取最新状态。
    visibleTasks = prioritized.slice(0, maxDisplay);
    // hiddenTasks 集合更新为 `prioritized.slice(maxDisplay)`，确保终端 UI后续读取最新状态。
    hiddenTasks = prioritized.slice(maxDisplay);
  } else {
    // No truncation needed — sort by ID for stable ordering
    // visibleTasks 集合更新为 `[...tasks].sort(byIdAsc)`，确保终端 UI后续读取最新状态。
    visibleTasks = [...tasks].sort(byIdAsc);
    // hiddenTasks 集合更新为 `[]`，确保终端 UI后续读取最新状态。
    hiddenTasks = [];
  }
  // hiddenSummary保存`''`，作为后续固定文本处理的输入。
  let hiddenSummary = '';
  // 满足 `hiddenTasks.length > 0` 时，终端渲染执行该分支。
  if (hiddenTasks.length > 0) {
    // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
    const parts: string[] = [];
    // hiddenPending统计`count`，供终端渲染后续处理使用。
    const hiddenPending = count(hiddenTasks, t_10 => t_10.status === 'pending');
    // hiddenInProgress 集合统计`count`，供终端渲染后续处理使用。
    const hiddenInProgress = count(hiddenTasks, t_11 => t_11.status === 'in_progress');
    // hiddenCompleted统计`count`，供终端渲染后续处理使用。
    const hiddenCompleted = count(hiddenTasks, t_12 => t_12.status === 'completed');
    // 满足 `hiddenInProgress > 0` 时，终端渲染执行该分支。
    if (hiddenInProgress > 0) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`${hiddenInProgress} in progress`);
    }
    // 满足 `hiddenPending > 0` 时，终端渲染执行该分支。
    if (hiddenPending > 0) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`${hiddenPending} pending`);
    }
    // 满足 `hiddenCompleted > 0` 时，终端渲染执行该分支。
    if (hiddenCompleted > 0) {
      // 片段列表追加新条目，保持收集顺序与输入顺序一致。
      parts.push(`${hiddenCompleted} completed`);
    }
    // hiddenSummary更新为 `` … +${parts.join(', ')}``，确保终端 UI后续读取最新状态。
    hiddenSummary = ` … +${parts.join(', ')}`;
  }
  // 文本内容保存`<>`，供后续判断或组装使用。
  const content = <>
      {/* 这个回调绑定到 {visibleTasks.map(task_0 => <TaskItem key={task_0.id} task={task_0} ownerColor={task…，负责终端渲染在该局部场景下的响应。 */}
      {visibleTasks.map(task_0 => <TaskItem key={task_0.id} task={task_0} ownerColor={task_0.owner ? teammateColors[task_0.owner] : undefined} openBlockers={task_0.blockedBy.filter(id_3 => unresolvedTaskIds.has(id_3))} activity={task_0.owner ? teammateActivity[task_0.owner] : undefined} ownerActive={task_0.owner ? activeTeammates.has(task_0.owner) : false} columns={columns} />)}
      {maxDisplay > 0 && hiddenSummary && <Text dimColor>{hiddenSummary}</Text>}
    </>;
  // 满足 `isStandalone` 时，终端渲染执行该分支。
  if (isStandalone) {
    // 返回 `<Box flexDirection="column" marginTop={1} marginLeft={2}>`，作为终端渲染这次计算的结果。
    return <Box flexDirection="column" marginTop={1} marginLeft={2}>
        <Box>
          <Text dimColor>
            <Text bold>{tasks.length}</Text>
            {' tasks ('}
            <Text bold>{completedCount}</Text>
            {' done, '}
            {inProgressCount > 0 && <>
                <Text bold>{inProgressCount}</Text>
                {' in progress, '}
              </>}
            <Text bold>{pendingCount}</Text>
            {' open)'}
          </Text>
        </Box>
        {content}
      </Box>;
  }
  // 返回 `<Box flexDirection="column">{content}</Box>`，作为终端渲染这次计算的结果。
  return <Box flexDirection="column">{content}</Box>;
}
// TaskItemProps 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskItemProps = {
  task: Task;
  ownerColor?: keyof Theme;
  openBlockers: string[];
  activity?: string;
  ownerActive: boolean;
  columns: number;
};
// getTaskIcon 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getTaskIcon(status: Task['status']): {
  icon: string;
  color: keyof Theme | undefined;
} {
  // 按照 status 的取值选择终端渲染的具体处理分支。
  switch (status) {
    case 'completed':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        icon: figures.tick,
        color: 'success'
      };
    case 'in_progress':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        icon: figures.squareSmallFilled,
        color: 'claude'
      };
    case 'pending':
      // 返回结构化结果，集中表达终端渲染已经整理出的状态。
      return {
        icon: figures.squareSmall,
        color: undefined
      };
  }
}
// TaskItem 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function TaskItem(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(37);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    task,
    ownerColor,
    openBlockers,
    activity,
    ownerActive,
    columns
  } = t0;
  // isCompleted标记终端 UI Task List V2是否启用对应路径。
  const isCompleted = task.status === "completed";
  // isInProgress 集合标记终端 UI Task List V2是否启用对应路径。
  const isInProgress = task.status === "in_progress";
  // isBlocked标记终端 UI Task List V2是否启用对应路径。
  const isBlocked = openBlockers.length > 0;
  // t1 暂存 `getTaskIcon(task.status)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== task.status) {
    // t1 暂存 `getTaskIcon(task.status)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getTaskIcon(task.status);
    // $[0] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = task.status;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    icon,
    color
  } = t1;
  // showActivity标记终端 UI Task List V2是否启用对应路径。
  const showActivity = isInProgress && !isBlocked && activity;
  // showOwner标记终端 UI Task List V2是否启用对应路径。
  const showOwner = columns >= 60 && task.owner && ownerActive;
  // t2 暂存 `showOwner ? stringWidth(` (@${task.owner})`) : 0` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== showOwner || $[3] !== task.owner) {
    // t2 暂存 `showOwner ? stringWidth(` (@${task.owner})`) : 0` 生成的渲染片段，后续返回路径直接复用。
    t2 = showOwner ? stringWidth(` (@${task.owner})`) : 0;
    // $[2] 缓存 `showOwner`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = showOwner;
    // $[3] 缓存 `task.owner`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = task.owner;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // ownerWidth 命名 `t2`，让后续代码直接表达这个值的用途。
  const ownerWidth = t2;
  // maxSubjectWidth保存`Math.max`，供终端渲染后续处理使用。
  const maxSubjectWidth = Math.max(15, columns - 15 - ownerWidth);
  // t3 暂存 `truncateToWidth(task.subject, maxSubjectWidth)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== maxSubjectWidth || $[6] !== task.subject) {
    // t3 暂存 `truncateToWidth(task.subject, maxSubjectWidth)` 生成的渲染片段，后续返回路径直接复用。
    t3 = truncateToWidth(task.subject, maxSubjectWidth);
    // $[5] 缓存 `maxSubjectWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = maxSubjectWidth;
    // $[6] 缓存 `task.subject`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = task.subject;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // displaySubject沿用 `t3` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const displaySubject = t3;
  // maxActivityWidth保存`Math.max`，供终端渲染后续处理使用。
  const maxActivityWidth = Math.max(15, columns - 15);
  // t4 暂存 `activity ? truncateToWidth(activity, maxActivityWidth) : ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== activity || $[9] !== maxActivityWidth) {
    // t4 暂存 `activity ? truncateToWidth(activity, maxActivityWidth) : ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = activity ? truncateToWidth(activity, maxActivityWidth) : undefined;
    // $[8] 缓存 `activity`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = activity;
    // $[9] 缓存 `maxActivityWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = maxActivityWidth;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // displayActivity保存`t4`，作为后续临时缓存值处理的输入。
  const displayActivity = t4;
  // t5 暂存 `<Text color={color}>{icon} </Text>` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== color || $[12] !== icon) {
    // t5 暂存 `<Text color={color}>{icon} </Text>` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color={color}>{icon} </Text>;
    // $[11] 缓存 `color`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = color;
    // $[12] 缓存 `icon`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = icon;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // t6标记终端 UI Task List V2是否启用对应路径。
  const t6 = isCompleted || isBlocked;
  // t7 暂存 `<Text bold={isInProgress} strikethrough={isCompleted} dim...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== displaySubject || $[15] !== isCompleted || $[16] !== isInProgress || $[17] !== t6) {
    // t7 暂存 `<Text bold={isInProgress} strikethrough={isCompleted} dim...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Text bold={isInProgress} strikethrough={isCompleted} dimColor={t6}>{displaySubject}</Text>;
    // $[14] 缓存 `displaySubject`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = displaySubject;
    // $[15] 缓存 `isCompleted`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = isCompleted;
    // $[16] 缓存 `isInProgress`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = isInProgress;
    // $[17] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t6;
    // $[18] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[18];
  }
  // t8 暂存 `showOwner && <Text dimColor={true}>{" ("}{ownerColor ? <T...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== ownerColor || $[20] !== showOwner || $[21] !== task.owner) {
    // t8 暂存 `showOwner && <Text dimColor={true}>{" ("}{ownerColor ? <T...` 生成的渲染片段，后续返回路径直接复用。
    t8 = showOwner && <Text dimColor={true}>{" ("}{ownerColor ? <ThemedText color={ownerColor}>@{task.owner}</ThemedText> : `@${task.owner}`}{")"}</Text>;
    // $[19] 缓存 `ownerColor`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = ownerColor;
    // $[20] 缓存 `showOwner`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = showOwner;
    // $[21] 缓存 `task.owner`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = task.owner;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[22];
  }
  // t9 暂存 `isBlocked && <Text dimColor={true}>{" "}{figures.pointerS...` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== isBlocked || $[24] !== openBlockers) {
    // t9 暂存 `isBlocked && <Text dimColor={true}>{" "}{figures.pointerS...` 生成的渲染片段，后续返回路径直接复用。
    t9 = isBlocked && <Text dimColor={true}>{" "}{figures.pointerSmall} blocked by{" "}{[...openBlockers].sort(_temp).map(_temp2).join(", ")}</Text>;
    // $[23] 缓存 `isBlocked`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = isBlocked;
    // $[24] 缓存 `openBlockers`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = openBlockers;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[25];
  }
  // t10 暂存 `<Box>{t5}{t7}{t8}{t9}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== t5 || $[27] !== t7 || $[28] !== t8 || $[29] !== t9) {
    // t10 暂存 `<Box>{t5}{t7}{t8}{t9}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Box>{t5}{t7}{t8}{t9}</Box>;
    // $[26] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t5;
    // $[27] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t7;
    // $[28] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t8;
    // $[29] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t9;
    // $[30] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[30];
  }
  // t11 暂存 `showActivity && displayActivity && <Box><Text dimColor={t...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[31] !== displayActivity || $[32] !== showActivity) {
    // t11 暂存 `showActivity && displayActivity && <Box><Text dimColor={t...` 生成的渲染片段，后续返回路径直接复用。
    t11 = showActivity && displayActivity && <Box><Text dimColor={true}>{"  "}{displayActivity}{figures.ellipsis}</Text></Box>;
    // $[31] 缓存 `displayActivity`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = displayActivity;
    // $[32] 缓存 `showActivity`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = showActivity;
    // $[33] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[33];
  }
  // t12 暂存 `<Box flexDirection="column">{t10}{t11}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== t10 || $[35] !== t11) {
    // t12 暂存 `<Box flexDirection="column">{t10}{t11}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Box flexDirection="column">{t10}{t11}</Box>;
    // $[34] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t10;
    // $[35] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t11;
    // $[36] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[36];
  }
  // 返回 `t12`，作为终端渲染这次计算的结果。
  return t12;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(id) {
  // 返回 ``#${id}``，作为终端渲染这次计算的结果。
  return `#${id}`;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(a, b) {
  // 返回 `parseInt(a, 10) - parseInt(b, 10)`，作为终端渲染这次计算的结果。
  return parseInt(a, 10) - parseInt(b, 10);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJ1c2VUZXJtaW5hbFNpemUiLCJzdHJpbmdXaWR0aCIsIkJveCIsIlRleHQiLCJ1c2VBcHBTdGF0ZSIsImlzSW5Qcm9jZXNzVGVhbW1hdGVUYXNrIiwiQUdFTlRfQ09MT1JfVE9fVEhFTUVfQ09MT1IiLCJBZ2VudENvbG9yTmFtZSIsImlzQWdlbnRTd2FybXNFbmFibGVkIiwiY291bnQiLCJzdW1tYXJpemVSZWNlbnRBY3Rpdml0aWVzIiwidHJ1bmNhdGVUb1dpZHRoIiwiaXNUb2RvVjJFbmFibGVkIiwiVGFzayIsIlRoZW1lIiwiVGhlbWVkVGV4dCIsIlByb3BzIiwidGFza3MiLCJpc1N0YW5kYWxvbmUiLCJSRUNFTlRfQ09NUExFVEVEX1RUTF9NUyIsImJ5SWRBc2MiLCJhIiwiYiIsImFOdW0iLCJwYXJzZUludCIsImlkIiwiYk51bSIsImlzTmFOIiwibG9jYWxlQ29tcGFyZSIsIlRhc2tMaXN0VjIiLCJSZWFjdE5vZGUiLCJ0ZWFtQ29udGV4dCIsInMiLCJhcHBTdGF0ZVRhc2tzIiwiZm9yY2VVcGRhdGUiLCJ1c2VTdGF0ZSIsInJvd3MiLCJjb2x1bW5zIiwiY29tcGxldGlvblRpbWVzdGFtcHNSZWYiLCJ1c2VSZWYiLCJNYXAiLCJwcmV2aW91c0NvbXBsZXRlZElkc1JlZiIsIlNldCIsImN1cnJlbnQiLCJmaWx0ZXIiLCJ0Iiwic3RhdHVzIiwibWFwIiwibWF4RGlzcGxheSIsIk1hdGgiLCJtaW4iLCJtYXgiLCJjdXJyZW50Q29tcGxldGVkSWRzIiwibm93IiwiRGF0ZSIsImhhcyIsInNldCIsImtleXMiLCJkZWxldGUiLCJ1c2VFZmZlY3QiLCJzaXplIiwiY3VycmVudE5vdyIsImVhcmxpZXN0RXhwaXJ5IiwiSW5maW5pdHkiLCJ0cyIsInZhbHVlcyIsImV4cGlyeSIsInRpbWVyIiwic2V0VGltZW91dCIsIm4iLCJjbGVhclRpbWVvdXQiLCJsZW5ndGgiLCJ0ZWFtbWF0ZUNvbG9ycyIsIlJlY29yZCIsInRlYW1tYXRlcyIsInRlYW1tYXRlIiwiT2JqZWN0IiwiY29sb3IiLCJ0aGVtZUNvbG9yIiwibmFtZSIsInRlYW1tYXRlQWN0aXZpdHkiLCJhY3RpdmVUZWFtbWF0ZXMiLCJiZ1Rhc2siLCJhZGQiLCJpZGVudGl0eSIsImFnZW50TmFtZSIsImFnZW50SWQiLCJhY3Rpdml0aWVzIiwicHJvZ3Jlc3MiLCJyZWNlbnRBY3Rpdml0aWVzIiwiZGVzYyIsImxhc3RBY3Rpdml0eSIsImFjdGl2aXR5RGVzY3JpcHRpb24iLCJjb21wbGV0ZWRDb3VudCIsInBlbmRpbmdDb3VudCIsImluUHJvZ3Jlc3NDb3VudCIsInVucmVzb2x2ZWRUYXNrSWRzIiwibmVlZHNUcnVuY2F0aW9uIiwidmlzaWJsZVRhc2tzIiwiaGlkZGVuVGFza3MiLCJyZWNlbnRDb21wbGV0ZWQiLCJvbGRlckNvbXBsZXRlZCIsInRhc2siLCJnZXQiLCJwdXNoIiwic29ydCIsImluUHJvZ3Jlc3MiLCJwZW5kaW5nIiwiYUJsb2NrZWQiLCJibG9ja2VkQnkiLCJzb21lIiwiYkJsb2NrZWQiLCJwcmlvcml0aXplZCIsInNsaWNlIiwiaGlkZGVuU3VtbWFyeSIsInBhcnRzIiwiaGlkZGVuUGVuZGluZyIsImhpZGRlbkluUHJvZ3Jlc3MiLCJoaWRkZW5Db21wbGV0ZWQiLCJqb2luIiwiY29udGVudCIsIm93bmVyIiwidW5kZWZpbmVkIiwiVGFza0l0ZW1Qcm9wcyIsIm93bmVyQ29sb3IiLCJvcGVuQmxvY2tlcnMiLCJhY3Rpdml0eSIsIm93bmVyQWN0aXZlIiwiZ2V0VGFza0ljb24iLCJpY29uIiwidGljayIsInNxdWFyZVNtYWxsRmlsbGVkIiwic3F1YXJlU21hbGwiLCJUYXNrSXRlbSIsInQwIiwiJCIsIl9jIiwiaXNDb21wbGV0ZWQiLCJpc0luUHJvZ3Jlc3MiLCJpc0Jsb2NrZWQiLCJ0MSIsInNob3dBY3Rpdml0eSIsInNob3dPd25lciIsInQyIiwib3duZXJXaWR0aCIsIm1heFN1YmplY3RXaWR0aCIsInQzIiwic3ViamVjdCIsImRpc3BsYXlTdWJqZWN0IiwibWF4QWN0aXZpdHlXaWR0aCIsInQ0IiwiZGlzcGxheUFjdGl2aXR5IiwidDUiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsInBvaW50ZXJTbWFsbCIsIl90ZW1wIiwiX3RlbXAyIiwidDEwIiwidDExIiwiZWxsaXBzaXMiLCJ0MTIiXSwic291cmNlcyI6WyJUYXNrTGlzdFYyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmlndXJlcyBmcm9tICdmaWd1cmVzJ1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VUZXJtaW5hbFNpemUgfSBmcm9tICcuLi9ob29rcy91c2VUZXJtaW5hbFNpemUuanMnXG5pbXBvcnQgeyBzdHJpbmdXaWR0aCB9IGZyb20gJy4uL2luay9zdHJpbmdXaWR0aC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBpc0luUHJvY2Vzc1RlYW1tYXRlVGFzayB9IGZyb20gJy4uL3Rhc2tzL0luUHJvY2Vzc1RlYW1tYXRlVGFzay90eXBlcy5qcydcbmltcG9ydCB7XG4gIEFHRU5UX0NPTE9SX1RPX1RIRU1FX0NPTE9SLFxuICB0eXBlIEFnZW50Q29sb3JOYW1lLFxufSBmcm9tICcuLi90b29scy9BZ2VudFRvb2wvYWdlbnRDb2xvck1hbmFnZXIuanMnXG5pbXBvcnQgeyBpc0FnZW50U3dhcm1zRW5hYmxlZCB9IGZyb20gJy4uL3V0aWxzL2FnZW50U3dhcm1zRW5hYmxlZC5qcydcbmltcG9ydCB7IGNvdW50IH0gZnJvbSAnLi4vdXRpbHMvYXJyYXkuanMnXG5pbXBvcnQgeyBzdW1tYXJpemVSZWNlbnRBY3Rpdml0aWVzIH0gZnJvbSAnLi4vdXRpbHMvY29sbGFwc2VSZWFkU2VhcmNoLmpzJ1xuaW1wb3J0IHsgdHJ1bmNhdGVUb1dpZHRoIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0LmpzJ1xuaW1wb3J0IHsgaXNUb2RvVjJFbmFibGVkLCB0eXBlIFRhc2sgfSBmcm9tICcuLi91dGlscy90YXNrcy5qcydcbmltcG9ydCB0eXBlIHsgVGhlbWUgfSBmcm9tICcuLi91dGlscy90aGVtZS5qcydcbmltcG9ydCBUaGVtZWRUZXh0IGZyb20gJy4vZGVzaWduLXN5c3RlbS9UaGVtZWRUZXh0LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0YXNrczogVGFza1tdXG4gIGlzU3RhbmRhbG9uZT86IGJvb2xlYW5cbn1cblxuY29uc3QgUkVDRU5UX0NPTVBMRVRFRF9UVExfTVMgPSAzMF8wMDBcblxuZnVuY3Rpb24gYnlJZEFzYyhhOiBUYXNrLCBiOiBUYXNrKTogbnVtYmVyIHtcbiAgY29uc3QgYU51bSA9IHBhcnNlSW50KGEuaWQsIDEwKVxuICBjb25zdCBiTnVtID0gcGFyc2VJbnQoYi5pZCwgMTApXG4gIGlmICghaXNOYU4oYU51bSkgJiYgIWlzTmFOKGJOdW0pKSB7XG4gICAgcmV0dXJuIGFOdW0gLSBiTnVtXG4gIH1cbiAgcmV0dXJuIGEuaWQubG9jYWxlQ29tcGFyZShiLmlkKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gVGFza0xpc3RWMih7XG4gIHRhc2tzLFxuICBpc1N0YW5kYWxvbmUgPSBmYWxzZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgdGVhbUNvbnRleHQgPSB1c2VBcHBTdGF0ZShzID0+IHMudGVhbUNvbnRleHQpXG4gIGNvbnN0IGFwcFN0YXRlVGFza3MgPSB1c2VBcHBTdGF0ZShzID0+IHMudGFza3MpXG4gIGNvbnN0IFssIGZvcmNlVXBkYXRlXSA9IFJlYWN0LnVzZVN0YXRlKDApXG4gIGNvbnN0IHsgcm93cywgY29sdW1ucyB9ID0gdXNlVGVybWluYWxTaXplKClcblxuICAvLyBUcmFjayB3aGVuIGVhY2ggdGFzayB3YXMgbGFzdCBvYnNlcnZlZCB0cmFuc2l0aW9uaW5nIHRvIGNvbXBsZXRlZFxuICBjb25zdCBjb21wbGV0aW9uVGltZXN0YW1wc1JlZiA9IFJlYWN0LnVzZVJlZihuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpKVxuICBjb25zdCBwcmV2aW91c0NvbXBsZXRlZElkc1JlZiA9IFJlYWN0LnVzZVJlZjxTZXQ8c3RyaW5nPiB8IG51bGw+KG51bGwpXG4gIGlmIChwcmV2aW91c0NvbXBsZXRlZElkc1JlZi5jdXJyZW50ID09PSBudWxsKSB7XG4gICAgcHJldmlvdXNDb21wbGV0ZWRJZHNSZWYuY3VycmVudCA9IG5ldyBTZXQoXG4gICAgICB0YXNrcy5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpLm1hcCh0ID0+IHQuaWQpLFxuICAgIClcbiAgfVxuICBjb25zdCBtYXhEaXNwbGF5ID0gcm93cyA8PSAxMCA/IDAgOiBNYXRoLm1pbigxMCwgTWF0aC5tYXgoMywgcm93cyAtIDE0KSlcblxuICAvLyBVcGRhdGUgY29tcGxldGlvbiB0aW1lc3RhbXBzOiByZXNldCB3aGVuIGEgdGFzayB0cmFuc2l0aW9ucyB0byBjb21wbGV0ZWRcbiAgY29uc3QgY3VycmVudENvbXBsZXRlZElkcyA9IG5ldyBTZXQoXG4gICAgdGFza3MuZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKS5tYXAodCA9PiB0LmlkKSxcbiAgKVxuICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gIGZvciAoY29uc3QgaWQgb2YgY3VycmVudENvbXBsZXRlZElkcykge1xuICAgIGlmICghcHJldmlvdXNDb21wbGV0ZWRJZHNSZWYuY3VycmVudC5oYXMoaWQpKSB7XG4gICAgICBjb21wbGV0aW9uVGltZXN0YW1wc1JlZi5jdXJyZW50LnNldChpZCwgbm93KVxuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGlkIG9mIGNvbXBsZXRpb25UaW1lc3RhbXBzUmVmLmN1cnJlbnQua2V5cygpKSB7XG4gICAgaWYgKCFjdXJyZW50Q29tcGxldGVkSWRzLmhhcyhpZCkpIHtcbiAgICAgIGNvbXBsZXRpb25UaW1lc3RhbXBzUmVmLmN1cnJlbnQuZGVsZXRlKGlkKVxuICAgIH1cbiAgfVxuICBwcmV2aW91c0NvbXBsZXRlZElkc1JlZi5jdXJyZW50ID0gY3VycmVudENvbXBsZXRlZElkc1xuXG4gIC8vIFNjaGVkdWxlIHJlLXJlbmRlciB3aGVuIHRoZSBuZXh0IHJlY2VudCBjb21wbGV0aW9uIGV4cGlyZXMuXG4gIC8vIERlcGVuZCBvbiBgdGFza3NgIHNvIHRoZSB0aW1lciBpcyBvbmx5IHJlc2V0IHdoZW4gdGhlIHRhc2sgbGlzdCBjaGFuZ2VzLFxuICAvLyBub3Qgb24gZXZlcnkgcmVuZGVyICh3aGljaCB3YXMgY2F1c2luZyB1bm5lY2Vzc2FyeSB3b3JrKS5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoY29tcGxldGlvblRpbWVzdGFtcHNSZWYuY3VycmVudC5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgY3VycmVudE5vdyA9IERhdGUubm93KClcbiAgICBsZXQgZWFybGllc3RFeHBpcnkgPSBJbmZpbml0eVxuICAgIGZvciAoY29uc3QgdHMgb2YgY29tcGxldGlvblRpbWVzdGFtcHNSZWYuY3VycmVudC52YWx1ZXMoKSkge1xuICAgICAgY29uc3QgZXhwaXJ5ID0gdHMgKyBSRUNFTlRfQ09NUExFVEVEX1RUTF9NU1xuICAgICAgaWYgKGV4cGlyeSA+IGN1cnJlbnROb3cgJiYgZXhwaXJ5IDwgZWFybGllc3RFeHBpcnkpIHtcbiAgICAgICAgZWFybGllc3RFeHBpcnkgPSBleHBpcnlcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVhcmxpZXN0RXhwaXJ5ID09PSBJbmZpbml0eSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dChcbiAgICAgIGZvcmNlVXBkYXRlID0+IGZvcmNlVXBkYXRlKChuOiBudW1iZXIpID0+IG4gKyAxKSxcbiAgICAgIGVhcmxpZXN0RXhwaXJ5IC0gY3VycmVudE5vdyxcbiAgICAgIGZvcmNlVXBkYXRlLFxuICAgIClcbiAgICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKVxuICB9LCBbdGFza3NdKVxuXG4gIGlmICghaXNUb2RvVjJFbmFibGVkKCkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgaWYgKHRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBCdWlsZCBhIG1hcCBvZiB0ZWFtbWF0ZSBuYW1lIC0+IHRoZW1lIGNvbG9yXG4gIGNvbnN0IHRlYW1tYXRlQ29sb3JzOiBSZWNvcmQ8c3RyaW5nLCBrZXlvZiBUaGVtZT4gPSB7fVxuICBpZiAoaXNBZ2VudFN3YXJtc0VuYWJsZWQoKSAmJiB0ZWFtQ29udGV4dD8udGVhbW1hdGVzKSB7XG4gICAgZm9yIChjb25zdCB0ZWFtbWF0ZSBvZiBPYmplY3QudmFsdWVzKHRlYW1Db250ZXh0LnRlYW1tYXRlcykpIHtcbiAgICAgIGlmICh0ZWFtbWF0ZS5jb2xvcikge1xuICAgICAgICBjb25zdCB0aGVtZUNvbG9yID1cbiAgICAgICAgICBBR0VOVF9DT0xPUl9UT19USEVNRV9DT0xPUlt0ZWFtbWF0ZS5jb2xvciBhcyBBZ2VudENvbG9yTmFtZV1cbiAgICAgICAgaWYgKHRoZW1lQ29sb3IpIHtcbiAgICAgICAgICB0ZWFtbWF0ZUNvbG9yc1t0ZWFtbWF0ZS5uYW1lXSA9IHRoZW1lQ29sb3JcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEJ1aWxkIGEgbWFwIG9mIHRlYW1tYXRlIG5hbWUgLT4gY3VycmVudCBhY3Rpdml0eSBkZXNjcmlwdGlvblxuICAvLyBNYXAgYm90aCBhZ2VudE5hbWUgKFwicmVzZWFyY2hlclwiKSBhbmQgYWdlbnRJZCAoXCJyZXNlYXJjaGVyQHRlYW1cIikgc29cbiAgLy8gdGFzayBvd25lcnMgbWF0Y2ggcmVnYXJkbGVzcyBvZiB3aGljaCBmb3JtYXQgdGhlIG1vZGVsIHVzZWQuXG4gIC8vIFJvbGxzIHVwIGNvbnNlY3V0aXZlIHNlYXJjaC9yZWFkIHRvb2wgdXNlcyBpbnRvIGEgY29tcGFjdCBzdW1tYXJ5LlxuICAvLyBBbHNvIHRyYWNrIHdoaWNoIHRlYW1tYXRlcyBhcmUgc3RpbGwgcnVubmluZyAobm90IHNodXQgZG93bikuXG4gIGNvbnN0IHRlYW1tYXRlQWN0aXZpdHk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICBjb25zdCBhY3RpdmVUZWFtbWF0ZXMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICBpZiAoaXNBZ2VudFN3YXJtc0VuYWJsZWQoKSkge1xuICAgIGZvciAoY29uc3QgYmdUYXNrIG9mIE9iamVjdC52YWx1ZXMoYXBwU3RhdGVUYXNrcykpIHtcbiAgICAgIGlmIChpc0luUHJvY2Vzc1RlYW1tYXRlVGFzayhiZ1Rhc2spICYmIGJnVGFzay5zdGF0dXMgPT09ICdydW5uaW5nJykge1xuICAgICAgICBhY3RpdmVUZWFtbWF0ZXMuYWRkKGJnVGFzay5pZGVudGl0eS5hZ2VudE5hbWUpXG4gICAgICAgIGFjdGl2ZVRlYW1tYXRlcy5hZGQoYmdUYXNrLmlkZW50aXR5LmFnZW50SWQpXG4gICAgICAgIGNvbnN0IGFjdGl2aXRpZXMgPSBiZ1Rhc2sucHJvZ3Jlc3M/LnJlY2VudEFjdGl2aXRpZXNcbiAgICAgICAgY29uc3QgZGVzYyA9XG4gICAgICAgICAgKGFjdGl2aXRpZXMgJiYgc3VtbWFyaXplUmVjZW50QWN0aXZpdGllcyhhY3Rpdml0aWVzKSkgPz9cbiAgICAgICAgICBiZ1Rhc2sucHJvZ3Jlc3M/Lmxhc3RBY3Rpdml0eT8uYWN0aXZpdHlEZXNjcmlwdGlvblxuICAgICAgICBpZiAoZGVzYykge1xuICAgICAgICAgIHRlYW1tYXRlQWN0aXZpdHlbYmdUYXNrLmlkZW50aXR5LmFnZW50TmFtZV0gPSBkZXNjXG4gICAgICAgICAgdGVhbW1hdGVBY3Rpdml0eVtiZ1Rhc2suaWRlbnRpdHkuYWdlbnRJZF0gPSBkZXNjXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBHZXQgdGFzayBjb3VudHMgZm9yIGRpc3BsYXlcbiAgY29uc3QgY29tcGxldGVkQ291bnQgPSBjb3VudCh0YXNrcywgdCA9PiB0LnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpXG4gIGNvbnN0IHBlbmRpbmdDb3VudCA9IGNvdW50KHRhc2tzLCB0ID0+IHQuc3RhdHVzID09PSAncGVuZGluZycpXG4gIGNvbnN0IGluUHJvZ3Jlc3NDb3VudCA9IHRhc2tzLmxlbmd0aCAtIGNvbXBsZXRlZENvdW50IC0gcGVuZGluZ0NvdW50XG4gIC8vIFVucmVzb2x2ZWQgdGFza3MgKG9wZW4gb3IgaW5fcHJvZ3Jlc3MpIGJsb2NrIGRlcGVuZGVudCB0YXNrc1xuICBjb25zdCB1bnJlc29sdmVkVGFza0lkcyA9IG5ldyBTZXQoXG4gICAgdGFza3MuZmlsdGVyKHQgPT4gdC5zdGF0dXMgIT09ICdjb21wbGV0ZWQnKS5tYXAodCA9PiB0LmlkKSxcbiAgKVxuXG4gIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gdHJ1bmNhdGVcbiAgY29uc3QgbmVlZHNUcnVuY2F0aW9uID0gdGFza3MubGVuZ3RoID4gbWF4RGlzcGxheVxuXG4gIGxldCB2aXNpYmxlVGFza3M6IFRhc2tbXVxuICBsZXQgaGlkZGVuVGFza3M6IFRhc2tbXVxuXG4gIGlmIChuZWVkc1RydW5jYXRpb24pIHtcbiAgICAvLyBQcmlvcml0aXplOiByZWNlbnRseSBjb21wbGV0ZWQgKHdpdGhpbiAzMHMpLCBpbi1wcm9ncmVzcywgcGVuZGluZywgb2xkZXIgY29tcGxldGVkXG4gICAgY29uc3QgcmVjZW50Q29tcGxldGVkOiBUYXNrW10gPSBbXVxuICAgIGNvbnN0IG9sZGVyQ29tcGxldGVkOiBUYXNrW10gPSBbXVxuICAgIGZvciAoY29uc3QgdGFzayBvZiB0YXNrcy5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcpKSB7XG4gICAgICBjb25zdCB0cyA9IGNvbXBsZXRpb25UaW1lc3RhbXBzUmVmLmN1cnJlbnQuZ2V0KHRhc2suaWQpXG4gICAgICBpZiAodHMgJiYgbm93IC0gdHMgPCBSRUNFTlRfQ09NUExFVEVEX1RUTF9NUykge1xuICAgICAgICByZWNlbnRDb21wbGV0ZWQucHVzaCh0YXNrKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2xkZXJDb21wbGV0ZWQucHVzaCh0YXNrKVxuICAgICAgfVxuICAgIH1cbiAgICByZWNlbnRDb21wbGV0ZWQuc29ydChieUlkQXNjKVxuICAgIG9sZGVyQ29tcGxldGVkLnNvcnQoYnlJZEFzYylcbiAgICBjb25zdCBpblByb2dyZXNzID0gdGFza3NcbiAgICAgIC5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gJ2luX3Byb2dyZXNzJylcbiAgICAgIC5zb3J0KGJ5SWRBc2MpXG4gICAgY29uc3QgcGVuZGluZyA9IHRhc2tzXG4gICAgICAuZmlsdGVyKHQgPT4gdC5zdGF0dXMgPT09ICdwZW5kaW5nJylcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIGNvbnN0IGFCbG9ja2VkID0gYS5ibG9ja2VkQnkuc29tZShpZCA9PiB1bnJlc29sdmVkVGFza0lkcy5oYXMoaWQpKVxuICAgICAgICBjb25zdCBiQmxvY2tlZCA9IGIuYmxvY2tlZEJ5LnNvbWUoaWQgPT4gdW5yZXNvbHZlZFRhc2tJZHMuaGFzKGlkKSlcbiAgICAgICAgaWYgKGFCbG9ja2VkICE9PSBiQmxvY2tlZCkge1xuICAgICAgICAgIHJldHVybiBhQmxvY2tlZCA/IDEgOiAtMVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBieUlkQXNjKGEsIGIpXG4gICAgICB9KVxuXG4gICAgY29uc3QgcHJpb3JpdGl6ZWQgPSBbXG4gICAgICAuLi5yZWNlbnRDb21wbGV0ZWQsXG4gICAgICAuLi5pblByb2dyZXNzLFxuICAgICAgLi4ucGVuZGluZyxcbiAgICAgIC4uLm9sZGVyQ29tcGxldGVkLFxuICAgIF1cbiAgICB2aXNpYmxlVGFza3MgPSBwcmlvcml0aXplZC5zbGljZSgwLCBtYXhEaXNwbGF5KVxuICAgIGhpZGRlblRhc2tzID0gcHJpb3JpdGl6ZWQuc2xpY2UobWF4RGlzcGxheSlcbiAgfSBlbHNlIHtcbiAgICAvLyBObyB0cnVuY2F0aW9uIG5lZWRlZCDigJQgc29ydCBieSBJRCBmb3Igc3RhYmxlIG9yZGVyaW5nXG4gICAgdmlzaWJsZVRhc2tzID0gWy4uLnRhc2tzXS5zb3J0KGJ5SWRBc2MpXG4gICAgaGlkZGVuVGFza3MgPSBbXVxuICB9XG5cbiAgbGV0IGhpZGRlblN1bW1hcnkgPSAnJ1xuICBpZiAoaGlkZGVuVGFza3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgaGlkZGVuUGVuZGluZyA9IGNvdW50KGhpZGRlblRhc2tzLCB0ID0+IHQuc3RhdHVzID09PSAncGVuZGluZycpXG4gICAgY29uc3QgaGlkZGVuSW5Qcm9ncmVzcyA9IGNvdW50KGhpZGRlblRhc2tzLCB0ID0+IHQuc3RhdHVzID09PSAnaW5fcHJvZ3Jlc3MnKVxuICAgIGNvbnN0IGhpZGRlbkNvbXBsZXRlZCA9IGNvdW50KGhpZGRlblRhc2tzLCB0ID0+IHQuc3RhdHVzID09PSAnY29tcGxldGVkJylcbiAgICBpZiAoaGlkZGVuSW5Qcm9ncmVzcyA+IDApIHtcbiAgICAgIHBhcnRzLnB1c2goYCR7aGlkZGVuSW5Qcm9ncmVzc30gaW4gcHJvZ3Jlc3NgKVxuICAgIH1cbiAgICBpZiAoaGlkZGVuUGVuZGluZyA+IDApIHtcbiAgICAgIHBhcnRzLnB1c2goYCR7aGlkZGVuUGVuZGluZ30gcGVuZGluZ2ApXG4gICAgfVxuICAgIGlmIChoaWRkZW5Db21wbGV0ZWQgPiAwKSB7XG4gICAgICBwYXJ0cy5wdXNoKGAke2hpZGRlbkNvbXBsZXRlZH0gY29tcGxldGVkYClcbiAgICB9XG4gICAgaGlkZGVuU3VtbWFyeSA9IGAg4oCmICske3BhcnRzLmpvaW4oJywgJyl9YFxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IChcbiAgICA8PlxuICAgICAge3Zpc2libGVUYXNrcy5tYXAodGFzayA9PiAoXG4gICAgICAgIDxUYXNrSXRlbVxuICAgICAgICAgIGtleT17dGFzay5pZH1cbiAgICAgICAgICB0YXNrPXt0YXNrfVxuICAgICAgICAgIG93bmVyQ29sb3I9e3Rhc2sub3duZXIgPyB0ZWFtbWF0ZUNvbG9yc1t0YXNrLm93bmVyXSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICBvcGVuQmxvY2tlcnM9e3Rhc2suYmxvY2tlZEJ5LmZpbHRlcihpZCA9PiB1bnJlc29sdmVkVGFza0lkcy5oYXMoaWQpKX1cbiAgICAgICAgICBhY3Rpdml0eT17dGFzay5vd25lciA/IHRlYW1tYXRlQWN0aXZpdHlbdGFzay5vd25lcl0gOiB1bmRlZmluZWR9XG4gICAgICAgICAgb3duZXJBY3RpdmU9e3Rhc2sub3duZXIgPyBhY3RpdmVUZWFtbWF0ZXMuaGFzKHRhc2sub3duZXIpIDogZmFsc2V9XG4gICAgICAgICAgY29sdW1ucz17Y29sdW1uc31cbiAgICAgICAgLz5cbiAgICAgICkpfVxuICAgICAge21heERpc3BsYXkgPiAwICYmIGhpZGRlblN1bW1hcnkgJiYgPFRleHQgZGltQ29sb3I+e2hpZGRlblN1bW1hcnl9PC9UZXh0Pn1cbiAgICA8Lz5cbiAgKVxuXG4gIGlmIChpc1N0YW5kYWxvbmUpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfSBtYXJnaW5MZWZ0PXsyfT5cbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+e3Rhc2tzLmxlbmd0aH08L1RleHQ+XG4gICAgICAgICAgICB7JyB0YXNrcyAoJ31cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+e2NvbXBsZXRlZENvdW50fTwvVGV4dD5cbiAgICAgICAgICAgIHsnIGRvbmUsICd9XG4gICAgICAgICAgICB7aW5Qcm9ncmVzc0NvdW50ID4gMCAmJiAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgPFRleHQgYm9sZD57aW5Qcm9ncmVzc0NvdW50fTwvVGV4dD5cbiAgICAgICAgICAgICAgICB7JyBpbiBwcm9ncmVzcywgJ31cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgICAgPFRleHQgYm9sZD57cGVuZGluZ0NvdW50fTwvVGV4dD5cbiAgICAgICAgICAgIHsnIG9wZW4pJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgICB7Y29udGVudH1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIHJldHVybiA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj57Y29udGVudH08L0JveD5cbn1cblxudHlwZSBUYXNrSXRlbVByb3BzID0ge1xuICB0YXNrOiBUYXNrXG4gIG93bmVyQ29sb3I/OiBrZXlvZiBUaGVtZVxuICBvcGVuQmxvY2tlcnM6IHN0cmluZ1tdXG4gIGFjdGl2aXR5Pzogc3RyaW5nXG4gIG93bmVyQWN0aXZlOiBib29sZWFuXG4gIGNvbHVtbnM6IG51bWJlclxufVxuXG5mdW5jdGlvbiBnZXRUYXNrSWNvbihzdGF0dXM6IFRhc2tbJ3N0YXR1cyddKToge1xuICBpY29uOiBzdHJpbmdcbiAgY29sb3I6IGtleW9mIFRoZW1lIHwgdW5kZWZpbmVkXG59IHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdjb21wbGV0ZWQnOlxuICAgICAgcmV0dXJuIHsgaWNvbjogZmlndXJlcy50aWNrLCBjb2xvcjogJ3N1Y2Nlc3MnIH1cbiAgICBjYXNlICdpbl9wcm9ncmVzcyc6XG4gICAgICByZXR1cm4geyBpY29uOiBmaWd1cmVzLnNxdWFyZVNtYWxsRmlsbGVkLCBjb2xvcjogJ2NsYXVkZScgfVxuICAgIGNhc2UgJ3BlbmRpbmcnOlxuICAgICAgcmV0dXJuIHsgaWNvbjogZmlndXJlcy5zcXVhcmVTbWFsbCwgY29sb3I6IHVuZGVmaW5lZCB9XG4gIH1cbn1cblxuZnVuY3Rpb24gVGFza0l0ZW0oe1xuICB0YXNrLFxuICBvd25lckNvbG9yLFxuICBvcGVuQmxvY2tlcnMsXG4gIGFjdGl2aXR5LFxuICBvd25lckFjdGl2ZSxcbiAgY29sdW1ucyxcbn06IFRhc2tJdGVtUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBpc0NvbXBsZXRlZCA9IHRhc2suc3RhdHVzID09PSAnY29tcGxldGVkJ1xuICBjb25zdCBpc0luUHJvZ3Jlc3MgPSB0YXNrLnN0YXR1cyA9PT0gJ2luX3Byb2dyZXNzJ1xuICBjb25zdCBpc0Jsb2NrZWQgPSBvcGVuQmxvY2tlcnMubGVuZ3RoID4gMFxuXG4gIGNvbnN0IHsgaWNvbiwgY29sb3IgfSA9IGdldFRhc2tJY29uKHRhc2suc3RhdHVzKVxuXG4gIGNvbnN0IHNob3dBY3Rpdml0eSA9IGlzSW5Qcm9ncmVzcyAmJiAhaXNCbG9ja2VkICYmIGFjdGl2aXR5XG5cbiAgLy8gUmVzcG9uc2l2ZSBsYXlvdXQ6IGhpZGUgb3duZXIgb24gbmFycm93IHNjcmVlbnMgKDw2MCBjb2xzKVxuICAvLyBUcnVuY2F0ZSBzdWJqZWN0IGJhc2VkIG9uIGF2YWlsYWJsZSBzcGFjZVxuICBjb25zdCBzaG93T3duZXIgPSBjb2x1bW5zID49IDYwICYmIHRhc2sub3duZXIgJiYgb3duZXJBY3RpdmVcbiAgY29uc3Qgb3duZXJXaWR0aCA9IHNob3dPd25lciA/IHN0cmluZ1dpZHRoKGAgKEAke3Rhc2sub3duZXJ9KWApIDogMFxuICAvLyBBY2NvdW50IGZvcjogaWNvbigyKSArIGluZGVudGF0aW9uKH44IHdoZW4gbmVzdGVkIHVuZGVyIHNwaW5uZXIpICsgb3duZXIgKyBzYWZldHlcbiAgLy8gVXNlIGNvbHVtbnMgLSAxNSBhcyBhIGNvbnNlcnZhdGl2ZSBlc3RpbWF0ZSBmb3IgbmVzdGVkIGxheW91dHNcbiAgY29uc3QgbWF4U3ViamVjdFdpZHRoID0gTWF0aC5tYXgoMTUsIGNvbHVtbnMgLSAxNSAtIG93bmVyV2lkdGgpXG4gIGNvbnN0IGRpc3BsYXlTdWJqZWN0ID0gdHJ1bmNhdGVUb1dpZHRoKHRhc2suc3ViamVjdCwgbWF4U3ViamVjdFdpZHRoKVxuXG4gIC8vIFRydW5jYXRlIGFjdGl2aXR5IGZvciBuYXJyb3cgc2NyZWVuc1xuICBjb25zdCBtYXhBY3Rpdml0eVdpZHRoID0gTWF0aC5tYXgoMTUsIGNvbHVtbnMgLSAxNSlcbiAgY29uc3QgZGlzcGxheUFjdGl2aXR5ID0gYWN0aXZpdHlcbiAgICA/IHRydW5jYXRlVG9XaWR0aChhY3Rpdml0eSwgbWF4QWN0aXZpdHlXaWR0aClcbiAgICA6IHVuZGVmaW5lZFxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBjb2xvcj17Y29sb3J9PntpY29ufSA8L1RleHQ+XG4gICAgICAgIDxUZXh0XG4gICAgICAgICAgYm9sZD17aXNJblByb2dyZXNzfVxuICAgICAgICAgIHN0cmlrZXRocm91Z2g9e2lzQ29tcGxldGVkfVxuICAgICAgICAgIGRpbUNvbG9yPXtpc0NvbXBsZXRlZCB8fCBpc0Jsb2NrZWR9XG4gICAgICAgID5cbiAgICAgICAgICB7ZGlzcGxheVN1YmplY3R9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAge3Nob3dPd25lciAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7JyAoJ31cbiAgICAgICAgICAgIHtvd25lckNvbG9yID8gKFxuICAgICAgICAgICAgICA8VGhlbWVkVGV4dCBjb2xvcj17b3duZXJDb2xvcn0+QHt0YXNrLm93bmVyfTwvVGhlbWVkVGV4dD5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIGBAJHt0YXNrLm93bmVyfWBcbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICB7JyknfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgICAge2lzQmxvY2tlZCAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAgICB7JyAnfVxuICAgICAgICAgICAge2ZpZ3VyZXMucG9pbnRlclNtYWxsfSBibG9ja2VkIGJ5eycgJ31cbiAgICAgICAgICAgIHtbLi4ub3BlbkJsb2NrZXJzXVxuICAgICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gcGFyc2VJbnQoYSwgMTApIC0gcGFyc2VJbnQoYiwgMTApKVxuICAgICAgICAgICAgICAubWFwKGlkID0+IGAjJHtpZH1gKVxuICAgICAgICAgICAgICAuam9pbignLCAnKX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICAgIHtzaG93QWN0aXZpdHkgJiYgZGlzcGxheUFjdGl2aXR5ICYmIChcbiAgICAgICAgPEJveD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgIHsnICAnfVxuICAgICAgICAgICAge2Rpc3BsYXlBY3Rpdml0eX1cbiAgICAgICAgICAgIHtmaWd1cmVzLmVsbGlwc2lzfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPQSxPQUFPLE1BQU0sU0FBUztBQUM3QixPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLGVBQWUsUUFBUSw2QkFBNkI7QUFDN0QsU0FBU0MsV0FBVyxRQUFRLHVCQUF1QjtBQUNuRCxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxXQUFXO0FBQ3JDLFNBQVNDLFdBQVcsUUFBUSxzQkFBc0I7QUFDbEQsU0FBU0MsdUJBQXVCLFFBQVEseUNBQXlDO0FBQ2pGLFNBQ0VDLDBCQUEwQixFQUMxQixLQUFLQyxjQUFjLFFBQ2QseUNBQXlDO0FBQ2hELFNBQVNDLG9CQUFvQixRQUFRLGdDQUFnQztBQUNyRSxTQUFTQyxLQUFLLFFBQVEsbUJBQW1CO0FBQ3pDLFNBQVNDLHlCQUF5QixRQUFRLGdDQUFnQztBQUMxRSxTQUFTQyxlQUFlLFFBQVEsb0JBQW9CO0FBQ3BELFNBQVNDLGVBQWUsRUFBRSxLQUFLQyxJQUFJLFFBQVEsbUJBQW1CO0FBQzlELGNBQWNDLEtBQUssUUFBUSxtQkFBbUI7QUFDOUMsT0FBT0MsVUFBVSxNQUFNLCtCQUErQjtBQUV0RCxLQUFLQyxLQUFLLEdBQUc7RUFDWEMsS0FBSyxFQUFFSixJQUFJLEVBQUU7RUFDYkssWUFBWSxDQUFDLEVBQUUsT0FBTztBQUN4QixDQUFDO0FBRUQsTUFBTUMsdUJBQXVCLEdBQUcsTUFBTTtBQUV0QyxTQUFTQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUVSLElBQUksRUFBRVMsQ0FBQyxFQUFFVCxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUM7RUFDekMsTUFBTVUsSUFBSSxHQUFHQyxRQUFRLENBQUNILENBQUMsQ0FBQ0ksRUFBRSxFQUFFLEVBQUUsQ0FBQztFQUMvQixNQUFNQyxJQUFJLEdBQUdGLFFBQVEsQ0FBQ0YsQ0FBQyxDQUFDRyxFQUFFLEVBQUUsRUFBRSxDQUFDO0VBQy9CLElBQUksQ0FBQ0UsS0FBSyxDQUFDSixJQUFJLENBQUMsSUFBSSxDQUFDSSxLQUFLLENBQUNELElBQUksQ0FBQyxFQUFFO0lBQ2hDLE9BQU9ILElBQUksR0FBR0csSUFBSTtFQUNwQjtFQUNBLE9BQU9MLENBQUMsQ0FBQ0ksRUFBRSxDQUFDRyxhQUFhLENBQUNOLENBQUMsQ0FBQ0csRUFBRSxDQUFDO0FBQ2pDO0FBRUEsT0FBTyxTQUFTSSxVQUFVQSxDQUFDO0VBQ3pCWixLQUFLO0VBQ0xDLFlBQVksR0FBRztBQUNWLENBQU4sRUFBRUYsS0FBSyxDQUFDLEVBQUVqQixLQUFLLENBQUMrQixTQUFTLENBQUM7RUFDekIsTUFBTUMsV0FBVyxHQUFHM0IsV0FBVyxDQUFDNEIsQ0FBQyxJQUFJQSxDQUFDLENBQUNELFdBQVcsQ0FBQztFQUNuRCxNQUFNRSxhQUFhLEdBQUc3QixXQUFXLENBQUM0QixHQUFDLElBQUlBLEdBQUMsQ0FBQ2YsS0FBSyxDQUFDO0VBQy9DLE1BQU0sR0FBR2lCLFdBQVcsQ0FBQyxHQUFHbkMsS0FBSyxDQUFDb0MsUUFBUSxDQUFDLENBQUMsQ0FBQztFQUN6QyxNQUFNO0lBQUVDLElBQUk7SUFBRUM7RUFBUSxDQUFDLEdBQUdyQyxlQUFlLENBQUMsQ0FBQzs7RUFFM0M7RUFDQSxNQUFNc0MsdUJBQXVCLEdBQUd2QyxLQUFLLENBQUN3QyxNQUFNLENBQUMsSUFBSUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDdkUsTUFBTUMsdUJBQXVCLEdBQUcxQyxLQUFLLENBQUN3QyxNQUFNLENBQUNHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDdEUsSUFBSUQsdUJBQXVCLENBQUNFLE9BQU8sS0FBSyxJQUFJLEVBQUU7SUFDNUNGLHVCQUF1QixDQUFDRSxPQUFPLEdBQUcsSUFBSUQsR0FBRyxDQUN2Q3pCLEtBQUssQ0FBQzJCLE1BQU0sQ0FBQ0MsQ0FBQyxJQUFJQSxDQUFDLENBQUNDLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQ0MsR0FBRyxDQUFDRixHQUFDLElBQUlBLEdBQUMsQ0FBQ3BCLEVBQUUsQ0FDM0QsQ0FBQztFQUNIO0VBQ0EsTUFBTXVCLFVBQVUsR0FBR1osSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUdhLElBQUksQ0FBQ0MsR0FBRyxDQUFDLEVBQUUsRUFBRUQsSUFBSSxDQUFDRSxHQUFHLENBQUMsQ0FBQyxFQUFFZixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7O0VBRXhFO0VBQ0EsTUFBTWdCLG1CQUFtQixHQUFHLElBQUlWLEdBQUcsQ0FDakN6QixLQUFLLENBQUMyQixNQUFNLENBQUNDLEdBQUMsSUFBSUEsR0FBQyxDQUFDQyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUNDLEdBQUcsQ0FBQ0YsR0FBQyxJQUFJQSxHQUFDLENBQUNwQixFQUFFLENBQzNELENBQUM7RUFDRCxNQUFNNEIsR0FBRyxHQUFHQyxJQUFJLENBQUNELEdBQUcsQ0FBQyxDQUFDO0VBQ3RCLEtBQUssTUFBTTVCLEVBQUUsSUFBSTJCLG1CQUFtQixFQUFFO0lBQ3BDLElBQUksQ0FBQ1gsdUJBQXVCLENBQUNFLE9BQU8sQ0FBQ1ksR0FBRyxDQUFDOUIsRUFBRSxDQUFDLEVBQUU7TUFDNUNhLHVCQUF1QixDQUFDSyxPQUFPLENBQUNhLEdBQUcsQ0FBQy9CLEVBQUUsRUFBRTRCLEdBQUcsQ0FBQztJQUM5QztFQUNGO0VBQ0EsS0FBSyxNQUFNNUIsSUFBRSxJQUFJYSx1QkFBdUIsQ0FBQ0ssT0FBTyxDQUFDYyxJQUFJLENBQUMsQ0FBQyxFQUFFO0lBQ3ZELElBQUksQ0FBQ0wsbUJBQW1CLENBQUNHLEdBQUcsQ0FBQzlCLElBQUUsQ0FBQyxFQUFFO01BQ2hDYSx1QkFBdUIsQ0FBQ0ssT0FBTyxDQUFDZSxNQUFNLENBQUNqQyxJQUFFLENBQUM7SUFDNUM7RUFDRjtFQUNBZ0IsdUJBQXVCLENBQUNFLE9BQU8sR0FBR1MsbUJBQW1COztFQUVyRDtFQUNBO0VBQ0E7RUFDQXJELEtBQUssQ0FBQzRELFNBQVMsQ0FBQyxNQUFNO0lBQ3BCLElBQUlyQix1QkFBdUIsQ0FBQ0ssT0FBTyxDQUFDaUIsSUFBSSxLQUFLLENBQUMsRUFBRTtNQUM5QztJQUNGO0lBQ0EsTUFBTUMsVUFBVSxHQUFHUCxJQUFJLENBQUNELEdBQUcsQ0FBQyxDQUFDO0lBQzdCLElBQUlTLGNBQWMsR0FBR0MsUUFBUTtJQUM3QixLQUFLLE1BQU1DLEVBQUUsSUFBSTFCLHVCQUF1QixDQUFDSyxPQUFPLENBQUNzQixNQUFNLENBQUMsQ0FBQyxFQUFFO01BQ3pELE1BQU1DLE1BQU0sR0FBR0YsRUFBRSxHQUFHN0MsdUJBQXVCO01BQzNDLElBQUkrQyxNQUFNLEdBQUdMLFVBQVUsSUFBSUssTUFBTSxHQUFHSixjQUFjLEVBQUU7UUFDbERBLGNBQWMsR0FBR0ksTUFBTTtNQUN6QjtJQUNGO0lBQ0EsSUFBSUosY0FBYyxLQUFLQyxRQUFRLEVBQUU7TUFDL0I7SUFDRjtJQUNBLE1BQU1JLEtBQUssR0FBR0MsVUFBVSxDQUN0QmxDLGFBQVcsSUFBSUEsYUFBVyxDQUFDLENBQUNtQyxDQUFDLEVBQUUsTUFBTSxLQUFLQSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQ2hEUCxjQUFjLEdBQUdELFVBQVUsRUFDM0IzQixXQUNGLENBQUM7SUFDRCxPQUFPLE1BQU1vQyxZQUFZLENBQUNILEtBQUssQ0FBQztFQUNsQyxDQUFDLEVBQUUsQ0FBQ2xELEtBQUssQ0FBQyxDQUFDO0VBRVgsSUFBSSxDQUFDTCxlQUFlLENBQUMsQ0FBQyxFQUFFO0lBQ3RCLE9BQU8sSUFBSTtFQUNiO0VBRUEsSUFBSUssS0FBSyxDQUFDc0QsTUFBTSxLQUFLLENBQUMsRUFBRTtJQUN0QixPQUFPLElBQUk7RUFDYjs7RUFFQTtFQUNBLE1BQU1DLGNBQWMsRUFBRUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3RELElBQUlOLG9CQUFvQixDQUFDLENBQUMsSUFBSXVCLFdBQVcsRUFBRTJDLFNBQVMsRUFBRTtJQUNwRCxLQUFLLE1BQU1DLFFBQVEsSUFBSUMsTUFBTSxDQUFDWCxNQUFNLENBQUNsQyxXQUFXLENBQUMyQyxTQUFTLENBQUMsRUFBRTtNQUMzRCxJQUFJQyxRQUFRLENBQUNFLEtBQUssRUFBRTtRQUNsQixNQUFNQyxVQUFVLEdBQ2R4RSwwQkFBMEIsQ0FBQ3FFLFFBQVEsQ0FBQ0UsS0FBSyxJQUFJdEUsY0FBYyxDQUFDO1FBQzlELElBQUl1RSxVQUFVLEVBQUU7VUFDZE4sY0FBYyxDQUFDRyxRQUFRLENBQUNJLElBQUksQ0FBQyxHQUFHRCxVQUFVO1FBQzVDO01BQ0Y7SUFDRjtFQUNGOztFQUVBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxNQUFNRSxnQkFBZ0IsRUFBRVAsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDbkQsTUFBTVEsZUFBZSxHQUFHLElBQUl2QyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUN6QyxJQUFJbEMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFO0lBQzFCLEtBQUssTUFBTTBFLE1BQU0sSUFBSU4sTUFBTSxDQUFDWCxNQUFNLENBQUNoQyxhQUFhLENBQUMsRUFBRTtNQUNqRCxJQUFJNUIsdUJBQXVCLENBQUM2RSxNQUFNLENBQUMsSUFBSUEsTUFBTSxDQUFDcEMsTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUNsRW1DLGVBQWUsQ0FBQ0UsR0FBRyxDQUFDRCxNQUFNLENBQUNFLFFBQVEsQ0FBQ0MsU0FBUyxDQUFDO1FBQzlDSixlQUFlLENBQUNFLEdBQUcsQ0FBQ0QsTUFBTSxDQUFDRSxRQUFRLENBQUNFLE9BQU8sQ0FBQztRQUM1QyxNQUFNQyxVQUFVLEdBQUdMLE1BQU0sQ0FBQ00sUUFBUSxFQUFFQyxnQkFBZ0I7UUFDcEQsTUFBTUMsSUFBSSxHQUNSLENBQUNILFVBQVUsSUFBSTdFLHlCQUF5QixDQUFDNkUsVUFBVSxDQUFDLEtBQ3BETCxNQUFNLENBQUNNLFFBQVEsRUFBRUcsWUFBWSxFQUFFQyxtQkFBbUI7UUFDcEQsSUFBSUYsSUFBSSxFQUFFO1VBQ1JWLGdCQUFnQixDQUFDRSxNQUFNLENBQUNFLFFBQVEsQ0FBQ0MsU0FBUyxDQUFDLEdBQUdLLElBQUk7VUFDbERWLGdCQUFnQixDQUFDRSxNQUFNLENBQUNFLFFBQVEsQ0FBQ0UsT0FBTyxDQUFDLEdBQUdJLElBQUk7UUFDbEQ7TUFDRjtJQUNGO0VBQ0Y7O0VBRUE7RUFDQSxNQUFNRyxjQUFjLEdBQUdwRixLQUFLLENBQUNRLEtBQUssRUFBRTRCLEdBQUMsSUFBSUEsR0FBQyxDQUFDQyxNQUFNLEtBQUssV0FBVyxDQUFDO0VBQ2xFLE1BQU1nRCxZQUFZLEdBQUdyRixLQUFLLENBQUNRLEtBQUssRUFBRTRCLEdBQUMsSUFBSUEsR0FBQyxDQUFDQyxNQUFNLEtBQUssU0FBUyxDQUFDO0VBQzlELE1BQU1pRCxlQUFlLEdBQUc5RSxLQUFLLENBQUNzRCxNQUFNLEdBQUdzQixjQUFjLEdBQUdDLFlBQVk7RUFDcEU7RUFDQSxNQUFNRSxpQkFBaUIsR0FBRyxJQUFJdEQsR0FBRyxDQUMvQnpCLEtBQUssQ0FBQzJCLE1BQU0sQ0FBQ0MsR0FBQyxJQUFJQSxHQUFDLENBQUNDLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQ0MsR0FBRyxDQUFDRixHQUFDLElBQUlBLEdBQUMsQ0FBQ3BCLEVBQUUsQ0FDM0QsQ0FBQzs7RUFFRDtFQUNBLE1BQU13RSxlQUFlLEdBQUdoRixLQUFLLENBQUNzRCxNQUFNLEdBQUd2QixVQUFVO0VBRWpELElBQUlrRCxZQUFZLEVBQUVyRixJQUFJLEVBQUU7RUFDeEIsSUFBSXNGLFdBQVcsRUFBRXRGLElBQUksRUFBRTtFQUV2QixJQUFJb0YsZUFBZSxFQUFFO0lBQ25CO0lBQ0EsTUFBTUcsZUFBZSxFQUFFdkYsSUFBSSxFQUFFLEdBQUcsRUFBRTtJQUNsQyxNQUFNd0YsY0FBYyxFQUFFeEYsSUFBSSxFQUFFLEdBQUcsRUFBRTtJQUNqQyxLQUFLLE1BQU15RixJQUFJLElBQUlyRixLQUFLLENBQUMyQixNQUFNLENBQUNDLEdBQUMsSUFBSUEsR0FBQyxDQUFDQyxNQUFNLEtBQUssV0FBVyxDQUFDLEVBQUU7TUFDOUQsTUFBTWtCLElBQUUsR0FBRzFCLHVCQUF1QixDQUFDSyxPQUFPLENBQUM0RCxHQUFHLENBQUNELElBQUksQ0FBQzdFLEVBQUUsQ0FBQztNQUN2RCxJQUFJdUMsSUFBRSxJQUFJWCxHQUFHLEdBQUdXLElBQUUsR0FBRzdDLHVCQUF1QixFQUFFO1FBQzVDaUYsZUFBZSxDQUFDSSxJQUFJLENBQUNGLElBQUksQ0FBQztNQUM1QixDQUFDLE1BQU07UUFDTEQsY0FBYyxDQUFDRyxJQUFJLENBQUNGLElBQUksQ0FBQztNQUMzQjtJQUNGO0lBQ0FGLGVBQWUsQ0FBQ0ssSUFBSSxDQUFDckYsT0FBTyxDQUFDO0lBQzdCaUYsY0FBYyxDQUFDSSxJQUFJLENBQUNyRixPQUFPLENBQUM7SUFDNUIsTUFBTXNGLFVBQVUsR0FBR3pGLEtBQUssQ0FDckIyQixNQUFNLENBQUNDLEdBQUMsSUFBSUEsR0FBQyxDQUFDQyxNQUFNLEtBQUssYUFBYSxDQUFDLENBQ3ZDMkQsSUFBSSxDQUFDckYsT0FBTyxDQUFDO0lBQ2hCLE1BQU11RixPQUFPLEdBQUcxRixLQUFLLENBQ2xCMkIsTUFBTSxDQUFDQyxHQUFDLElBQUlBLEdBQUMsQ0FBQ0MsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUNuQzJELElBQUksQ0FBQyxDQUFDcEYsQ0FBQyxFQUFFQyxDQUFDLEtBQUs7TUFDZCxNQUFNc0YsUUFBUSxHQUFHdkYsQ0FBQyxDQUFDd0YsU0FBUyxDQUFDQyxJQUFJLENBQUNyRixJQUFFLElBQUl1RSxpQkFBaUIsQ0FBQ3pDLEdBQUcsQ0FBQzlCLElBQUUsQ0FBQyxDQUFDO01BQ2xFLE1BQU1zRixRQUFRLEdBQUd6RixDQUFDLENBQUN1RixTQUFTLENBQUNDLElBQUksQ0FBQ3JGLElBQUUsSUFBSXVFLGlCQUFpQixDQUFDekMsR0FBRyxDQUFDOUIsSUFBRSxDQUFDLENBQUM7TUFDbEUsSUFBSW1GLFFBQVEsS0FBS0csUUFBUSxFQUFFO1FBQ3pCLE9BQU9ILFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO01BQzFCO01BQ0EsT0FBT3hGLE9BQU8sQ0FBQ0MsQ0FBQyxFQUFFQyxDQUFDLENBQUM7SUFDdEIsQ0FBQyxDQUFDO0lBRUosTUFBTTBGLFdBQVcsR0FBRyxDQUNsQixHQUFHWixlQUFlLEVBQ2xCLEdBQUdNLFVBQVUsRUFDYixHQUFHQyxPQUFPLEVBQ1YsR0FBR04sY0FBYyxDQUNsQjtJQUNESCxZQUFZLEdBQUdjLFdBQVcsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsRUFBRWpFLFVBQVUsQ0FBQztJQUMvQ21ELFdBQVcsR0FBR2EsV0FBVyxDQUFDQyxLQUFLLENBQUNqRSxVQUFVLENBQUM7RUFDN0MsQ0FBQyxNQUFNO0lBQ0w7SUFDQWtELFlBQVksR0FBRyxDQUFDLEdBQUdqRixLQUFLLENBQUMsQ0FBQ3dGLElBQUksQ0FBQ3JGLE9BQU8sQ0FBQztJQUN2QytFLFdBQVcsR0FBRyxFQUFFO0VBQ2xCO0VBRUEsSUFBSWUsYUFBYSxHQUFHLEVBQUU7RUFDdEIsSUFBSWYsV0FBVyxDQUFDNUIsTUFBTSxHQUFHLENBQUMsRUFBRTtJQUMxQixNQUFNNEMsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUU7SUFDMUIsTUFBTUMsYUFBYSxHQUFHM0csS0FBSyxDQUFDMEYsV0FBVyxFQUFFdEQsSUFBQyxJQUFJQSxJQUFDLENBQUNDLE1BQU0sS0FBSyxTQUFTLENBQUM7SUFDckUsTUFBTXVFLGdCQUFnQixHQUFHNUcsS0FBSyxDQUFDMEYsV0FBVyxFQUFFdEQsSUFBQyxJQUFJQSxJQUFDLENBQUNDLE1BQU0sS0FBSyxhQUFhLENBQUM7SUFDNUUsTUFBTXdFLGVBQWUsR0FBRzdHLEtBQUssQ0FBQzBGLFdBQVcsRUFBRXRELElBQUMsSUFBSUEsSUFBQyxDQUFDQyxNQUFNLEtBQUssV0FBVyxDQUFDO0lBQ3pFLElBQUl1RSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUU7TUFDeEJGLEtBQUssQ0FBQ1gsSUFBSSxDQUFDLEdBQUdhLGdCQUFnQixjQUFjLENBQUM7SUFDL0M7SUFDQSxJQUFJRCxhQUFhLEdBQUcsQ0FBQyxFQUFFO01BQ3JCRCxLQUFLLENBQUNYLElBQUksQ0FBQyxHQUFHWSxhQUFhLFVBQVUsQ0FBQztJQUN4QztJQUNBLElBQUlFLGVBQWUsR0FBRyxDQUFDLEVBQUU7TUFDdkJILEtBQUssQ0FBQ1gsSUFBSSxDQUFDLEdBQUdjLGVBQWUsWUFBWSxDQUFDO0lBQzVDO0lBQ0FKLGFBQWEsR0FBRyxPQUFPQyxLQUFLLENBQUNJLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUMzQztFQUVBLE1BQU1DLE9BQU8sR0FDWDtBQUNKLE1BQU0sQ0FBQ3RCLFlBQVksQ0FBQ25ELEdBQUcsQ0FBQ3VELE1BQUksSUFDcEIsQ0FBQyxRQUFRLENBQ1AsR0FBRyxDQUFDLENBQUNBLE1BQUksQ0FBQzdFLEVBQUUsQ0FBQyxDQUNiLElBQUksQ0FBQyxDQUFDNkUsTUFBSSxDQUFDLENBQ1gsVUFBVSxDQUFDLENBQUNBLE1BQUksQ0FBQ21CLEtBQUssR0FBR2pELGNBQWMsQ0FBQzhCLE1BQUksQ0FBQ21CLEtBQUssQ0FBQyxHQUFHQyxTQUFTLENBQUMsQ0FDaEUsWUFBWSxDQUFDLENBQUNwQixNQUFJLENBQUNPLFNBQVMsQ0FBQ2pFLE1BQU0sQ0FBQ25CLElBQUUsSUFBSXVFLGlCQUFpQixDQUFDekMsR0FBRyxDQUFDOUIsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNyRSxRQUFRLENBQUMsQ0FBQzZFLE1BQUksQ0FBQ21CLEtBQUssR0FBR3pDLGdCQUFnQixDQUFDc0IsTUFBSSxDQUFDbUIsS0FBSyxDQUFDLEdBQUdDLFNBQVMsQ0FBQyxDQUNoRSxXQUFXLENBQUMsQ0FBQ3BCLE1BQUksQ0FBQ21CLEtBQUssR0FBR3hDLGVBQWUsQ0FBQzFCLEdBQUcsQ0FBQytDLE1BQUksQ0FBQ21CLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUNsRSxPQUFPLENBQUMsQ0FBQ3BGLE9BQU8sQ0FBQyxHQUVwQixDQUFDO0FBQ1IsTUFBTSxDQUFDVyxVQUFVLEdBQUcsQ0FBQyxJQUFJa0UsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDQSxhQUFhLENBQUMsRUFBRSxJQUFJLENBQUM7QUFDL0UsSUFBSSxHQUNEO0VBRUQsSUFBSWhHLFlBQVksRUFBRTtJQUNoQixPQUNFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlELFFBQVEsQ0FBQyxHQUFHO0FBQ1osVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRO0FBQ3hCLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUNELEtBQUssQ0FBQ3NELE1BQU0sQ0FBQyxFQUFFLElBQUk7QUFDM0MsWUFBWSxDQUFDLFVBQVU7QUFDdkIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ3NCLGNBQWMsQ0FBQyxFQUFFLElBQUk7QUFDN0MsWUFBWSxDQUFDLFNBQVM7QUFDdEIsWUFBWSxDQUFDRSxlQUFlLEdBQUcsQ0FBQyxJQUNsQjtBQUNkLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ0EsZUFBZSxDQUFDLEVBQUUsSUFBSTtBQUNsRCxnQkFBZ0IsQ0FBQyxnQkFBZ0I7QUFDakMsY0FBYyxHQUNEO0FBQ2IsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQ0QsWUFBWSxDQUFDLEVBQUUsSUFBSTtBQUMzQyxZQUFZLENBQUMsUUFBUTtBQUNyQixVQUFVLEVBQUUsSUFBSTtBQUNoQixRQUFRLEVBQUUsR0FBRztBQUNiLFFBQVEsQ0FBQzBCLE9BQU87QUFDaEIsTUFBTSxFQUFFLEdBQUcsQ0FBQztFQUVWO0VBRUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUNBLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUNwRDtBQUVBLEtBQUtHLGFBQWEsR0FBRztFQUNuQnJCLElBQUksRUFBRXpGLElBQUk7RUFDVitHLFVBQVUsQ0FBQyxFQUFFLE1BQU05RyxLQUFLO0VBQ3hCK0csWUFBWSxFQUFFLE1BQU0sRUFBRTtFQUN0QkMsUUFBUSxDQUFDLEVBQUUsTUFBTTtFQUNqQkMsV0FBVyxFQUFFLE9BQU87RUFDcEIxRixPQUFPLEVBQUUsTUFBTTtBQUNqQixDQUFDO0FBRUQsU0FBUzJGLFdBQVdBLENBQUNsRixNQUFNLEVBQUVqQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtFQUM1Q29ILElBQUksRUFBRSxNQUFNO0VBQ1pwRCxLQUFLLEVBQUUsTUFBTS9ELEtBQUssR0FBRyxTQUFTO0FBQ2hDLENBQUMsQ0FBQztFQUNBLFFBQVFnQyxNQUFNO0lBQ1osS0FBSyxXQUFXO01BQ2QsT0FBTztRQUFFbUYsSUFBSSxFQUFFbkksT0FBTyxDQUFDb0ksSUFBSTtRQUFFckQsS0FBSyxFQUFFO01BQVUsQ0FBQztJQUNqRCxLQUFLLGFBQWE7TUFDaEIsT0FBTztRQUFFb0QsSUFBSSxFQUFFbkksT0FBTyxDQUFDcUksaUJBQWlCO1FBQUV0RCxLQUFLLEVBQUU7TUFBUyxDQUFDO0lBQzdELEtBQUssU0FBUztNQUNaLE9BQU87UUFBRW9ELElBQUksRUFBRW5JLE9BQU8sQ0FBQ3NJLFdBQVc7UUFBRXZELEtBQUssRUFBRTZDO01BQVUsQ0FBQztFQUMxRDtBQUNGO0FBRUEsU0FBQVcsU0FBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFrQjtJQUFBbEMsSUFBQTtJQUFBc0IsVUFBQTtJQUFBQyxZQUFBO0lBQUFDLFFBQUE7SUFBQUMsV0FBQTtJQUFBMUY7RUFBQSxJQUFBaUcsRUFPRjtFQUNkLE1BQUFHLFdBQUEsR0FBb0JuQyxJQUFJLENBQUF4RCxNQUFPLEtBQUssV0FBVztFQUMvQyxNQUFBNEYsWUFBQSxHQUFxQnBDLElBQUksQ0FBQXhELE1BQU8sS0FBSyxhQUFhO0VBQ2xELE1BQUE2RixTQUFBLEdBQWtCZCxZQUFZLENBQUF0RCxNQUFPLEdBQUcsQ0FBQztFQUFBLElBQUFxRSxFQUFBO0VBQUEsSUFBQUwsQ0FBQSxRQUFBakMsSUFBQSxDQUFBeEQsTUFBQTtJQUVqQjhGLEVBQUEsR0FBQVosV0FBVyxDQUFDMUIsSUFBSSxDQUFBeEQsTUFBTyxDQUFDO0lBQUF5RixDQUFBLE1BQUFqQyxJQUFBLENBQUF4RCxNQUFBO0lBQUF5RixDQUFBLE1BQUFLLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFMLENBQUE7RUFBQTtFQUFoRDtJQUFBTixJQUFBO0lBQUFwRDtFQUFBLElBQXdCK0QsRUFBd0I7RUFFaEQsTUFBQUMsWUFBQSxHQUFxQkgsWUFBMEIsSUFBMUIsQ0FBaUJDLFNBQXFCLElBQXRDYixRQUFzQztFQUkzRCxNQUFBZ0IsU0FBQSxHQUFrQnpHLE9BQU8sSUFBSSxFQUFnQixJQUFWaUUsSUFBSSxDQUFBbUIsS0FBcUIsSUFBMUNNLFdBQTBDO0VBQUEsSUFBQWdCLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFPLFNBQUEsSUFBQVAsQ0FBQSxRQUFBakMsSUFBQSxDQUFBbUIsS0FBQTtJQUN6Q3NCLEVBQUEsR0FBQUQsU0FBUyxHQUFHN0ksV0FBVyxDQUFDLE1BQU1xRyxJQUFJLENBQUFtQixLQUFNLEdBQU8sQ0FBQyxHQUFoRCxDQUFnRDtJQUFBYyxDQUFBLE1BQUFPLFNBQUE7SUFBQVAsQ0FBQSxNQUFBakMsSUFBQSxDQUFBbUIsS0FBQTtJQUFBYyxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFuRSxNQUFBUyxVQUFBLEdBQW1CRCxFQUFnRDtFQUduRSxNQUFBRSxlQUFBLEdBQXdCaEcsSUFBSSxDQUFBRSxHQUFJLENBQUMsRUFBRSxFQUFFZCxPQUFPLEdBQUcsRUFBRSxHQUFHMkcsVUFBVSxDQUFDO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFYLENBQUEsUUFBQVUsZUFBQSxJQUFBVixDQUFBLFFBQUFqQyxJQUFBLENBQUE2QyxPQUFBO0lBQ3hDRCxFQUFBLEdBQUF2SSxlQUFlLENBQUMyRixJQUFJLENBQUE2QyxPQUFRLEVBQUVGLGVBQWUsQ0FBQztJQUFBVixDQUFBLE1BQUFVLGVBQUE7SUFBQVYsQ0FBQSxNQUFBakMsSUFBQSxDQUFBNkMsT0FBQTtJQUFBWixDQUFBLE1BQUFXLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFYLENBQUE7RUFBQTtFQUFyRSxNQUFBYSxjQUFBLEdBQXVCRixFQUE4QztFQUdyRSxNQUFBRyxnQkFBQSxHQUF5QnBHLElBQUksQ0FBQUUsR0FBSSxDQUFDLEVBQUUsRUFBRWQsT0FBTyxHQUFHLEVBQUUsQ0FBQztFQUFBLElBQUFpSCxFQUFBO0VBQUEsSUFBQWYsQ0FBQSxRQUFBVCxRQUFBLElBQUFTLENBQUEsUUFBQWMsZ0JBQUE7SUFDM0JDLEVBQUEsR0FBQXhCLFFBQVEsR0FDNUJuSCxlQUFlLENBQUNtSCxRQUFRLEVBQUV1QixnQkFDbEIsQ0FBQyxHQUZXM0IsU0FFWDtJQUFBYSxDQUFBLE1BQUFULFFBQUE7SUFBQVMsQ0FBQSxNQUFBYyxnQkFBQTtJQUFBZCxDQUFBLE9BQUFlLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFmLENBQUE7RUFBQTtFQUZiLE1BQUFnQixlQUFBLEdBQXdCRCxFQUVYO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFqQixDQUFBLFNBQUExRCxLQUFBLElBQUEwRCxDQUFBLFNBQUFOLElBQUE7SUFLUHVCLEVBQUEsSUFBQyxJQUFJLENBQVEzRSxLQUFLLENBQUxBLE1BQUksQ0FBQyxDQUFHb0QsS0FBRyxDQUFFLENBQUMsRUFBMUIsSUFBSSxDQUE2QjtJQUFBTSxDQUFBLE9BQUExRCxLQUFBO0lBQUEwRCxDQUFBLE9BQUFOLElBQUE7SUFBQU0sQ0FBQSxPQUFBaUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWpCLENBQUE7RUFBQTtFQUl0QixNQUFBa0IsRUFBQSxHQUFBaEIsV0FBd0IsSUFBeEJFLFNBQXdCO0VBQUEsSUFBQWUsRUFBQTtFQUFBLElBQUFuQixDQUFBLFNBQUFhLGNBQUEsSUFBQWIsQ0FBQSxTQUFBRSxXQUFBLElBQUFGLENBQUEsU0FBQUcsWUFBQSxJQUFBSCxDQUFBLFNBQUFrQixFQUFBO0lBSHBDQyxFQUFBLElBQUMsSUFBSSxDQUNHaEIsSUFBWSxDQUFaQSxhQUFXLENBQUMsQ0FDSEQsYUFBVyxDQUFYQSxZQUFVLENBQUMsQ0FDaEIsUUFBd0IsQ0FBeEIsQ0FBQWdCLEVBQXVCLENBQUMsQ0FFakNMLGVBQWEsQ0FDaEIsRUFOQyxJQUFJLENBTUU7SUFBQWIsQ0FBQSxPQUFBYSxjQUFBO0lBQUFiLENBQUEsT0FBQUUsV0FBQTtJQUFBRixDQUFBLE9BQUFHLFlBQUE7SUFBQUgsQ0FBQSxPQUFBa0IsRUFBQTtJQUFBbEIsQ0FBQSxPQUFBbUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQUFBLElBQUFvQixFQUFBO0VBQUEsSUFBQXBCLENBQUEsU0FBQVgsVUFBQSxJQUFBVyxDQUFBLFNBQUFPLFNBQUEsSUFBQVAsQ0FBQSxTQUFBakMsSUFBQSxDQUFBbUIsS0FBQTtJQUNOa0MsRUFBQSxHQUFBYixTQVVBLElBVEMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUNYLEtBQUcsQ0FDSCxDQUFBbEIsVUFBVSxHQUNULENBQUMsVUFBVSxDQUFRQSxLQUFVLENBQVZBLFdBQVMsQ0FBQyxDQUFFLENBQUUsQ0FBQXRCLElBQUksQ0FBQW1CLEtBQUssQ0FBRSxFQUEzQyxVQUFVLENBR1osR0FKQSxJQUdLbkIsSUFBSSxDQUFBbUIsS0FBTSxFQUNoQixDQUNDLElBQUUsQ0FDTCxFQVJDLElBQUksQ0FTTjtJQUFBYyxDQUFBLE9BQUFYLFVBQUE7SUFBQVcsQ0FBQSxPQUFBTyxTQUFBO0lBQUFQLENBQUEsT0FBQWpDLElBQUEsQ0FBQW1CLEtBQUE7SUFBQWMsQ0FBQSxPQUFBb0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXBCLENBQUE7RUFBQTtFQUFBLElBQUFxQixFQUFBO0VBQUEsSUFBQXJCLENBQUEsU0FBQUksU0FBQSxJQUFBSixDQUFBLFNBQUFWLFlBQUE7SUFDQStCLEVBQUEsR0FBQWpCLFNBU0EsSUFSQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQ1gsSUFBRSxDQUNGLENBQUE3SSxPQUFPLENBQUErSixZQUFZLENBQUUsV0FBWSxJQUFFLENBQ25DLEtBQUloQyxZQUFZLENBQUMsQ0FBQXBCLElBQ1gsQ0FBQ3FELEtBQTJDLENBQUMsQ0FBQS9HLEdBQzlDLENBQUNnSCxNQUFjLENBQUMsQ0FBQXhDLElBQ2YsQ0FBQyxJQUFJLEVBQ2QsRUFQQyxJQUFJLENBUU47SUFBQWdCLENBQUEsT0FBQUksU0FBQTtJQUFBSixDQUFBLE9BQUFWLFlBQUE7SUFBQVUsQ0FBQSxPQUFBcUIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXJCLENBQUE7RUFBQTtFQUFBLElBQUF5QixHQUFBO0VBQUEsSUFBQXpCLENBQUEsU0FBQWlCLEVBQUEsSUFBQWpCLENBQUEsU0FBQW1CLEVBQUEsSUFBQW5CLENBQUEsU0FBQW9CLEVBQUEsSUFBQXBCLENBQUEsU0FBQXFCLEVBQUE7SUE3QkhJLEdBQUEsSUFBQyxHQUFHLENBQ0YsQ0FBQVIsRUFBaUMsQ0FDakMsQ0FBQUUsRUFNTSxDQUNMLENBQUFDLEVBVUQsQ0FDQyxDQUFBQyxFQVNELENBQ0YsRUE5QkMsR0FBRyxDQThCRTtJQUFBckIsQ0FBQSxPQUFBaUIsRUFBQTtJQUFBakIsQ0FBQSxPQUFBbUIsRUFBQTtJQUFBbkIsQ0FBQSxPQUFBb0IsRUFBQTtJQUFBcEIsQ0FBQSxPQUFBcUIsRUFBQTtJQUFBckIsQ0FBQSxPQUFBeUIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQXpCLENBQUE7RUFBQTtFQUFBLElBQUEwQixHQUFBO0VBQUEsSUFBQTFCLENBQUEsU0FBQWdCLGVBQUEsSUFBQWhCLENBQUEsU0FBQU0sWUFBQTtJQUNMb0IsR0FBQSxHQUFBcEIsWUFBK0IsSUFBL0JVLGVBUUEsSUFQQyxDQUFDLEdBQUcsQ0FDRixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQ1gsS0FBRyxDQUNIQSxnQkFBYyxDQUNkLENBQUF6SixPQUFPLENBQUFvSyxRQUFRLENBQ2xCLEVBSkMsSUFBSSxDQUtQLEVBTkMsR0FBRyxDQU9MO0lBQUEzQixDQUFBLE9BQUFnQixlQUFBO0lBQUFoQixDQUFBLE9BQUFNLFlBQUE7SUFBQU4sQ0FBQSxPQUFBMEIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTFCLENBQUE7RUFBQTtFQUFBLElBQUE0QixHQUFBO0VBQUEsSUFBQTVCLENBQUEsU0FBQXlCLEdBQUEsSUFBQXpCLENBQUEsU0FBQTBCLEdBQUE7SUF4Q0hFLEdBQUEsSUFBQyxHQUFHLENBQWUsYUFBUSxDQUFSLFFBQVEsQ0FDekIsQ0FBQUgsR0E4QkssQ0FDSixDQUFBQyxHQVFELENBQ0YsRUF6Q0MsR0FBRyxDQXlDRTtJQUFBMUIsQ0FBQSxPQUFBeUIsR0FBQTtJQUFBekIsQ0FBQSxPQUFBMEIsR0FBQTtJQUFBMUIsQ0FBQSxPQUFBNEIsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTVCLENBQUE7RUFBQTtFQUFBLE9BekNONEIsR0F5Q007QUFBQTtBQXpFVixTQUFBSixPQUFBdEksRUFBQTtFQUFBLE9BMkR5QixJQUFJQSxFQUFFLEVBQUU7QUFBQTtBQTNEakMsU0FBQXFJLE1BQUF6SSxDQUFBLEVBQUFDLENBQUE7RUFBQSxPQTBEOEJFLFFBQVEsQ0FBQ0gsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHRyxRQUFRLENBQUNGLENBQUMsRUFBRSxFQUFFLENBQUM7QUFBQSIsImlnbm9yZUxpc3QiOltdfQ==