// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from 'src/ink.js';
// 类型依赖 { BackgroundTaskState } 来自 src/tasks/types.js，用于校准终端渲染的数据契约。
import type { BackgroundTaskState } from 'src/tasks/types.js';
// 类型依赖 { DeepImmutable } 来自 src/types/utils.js，用于校准终端渲染的数据契约。
import type { DeepImmutable } from 'src/types/utils.js';
// 复用 truncate 工具函数，把通用处理留在 src/utils/format.js 中维护。
import { truncate } from 'src/utils/format.js';
// 复用 toInkColor 工具函数，把通用处理留在 src/utils/ink.js 中维护。
import { toInkColor } from 'src/utils/ink.js';
// 复用 plural 工具函数，把通用处理留在 src/utils/stringUtils.js 中维护。
import { plural } from 'src/utils/stringUtils.js';
// 引入 DIAMOND_FILLED、DIAMOND_OPEN，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { DIAMOND_FILLED, DIAMOND_OPEN } from '../../constants/figures.js';
// 引入 RemoteSessionProgress，将 ./RemoteSessionProgress.js 中已经封装好的能力接到本文件流程里。
import { RemoteSessionProgress } from './RemoteSessionProgress.js';
// 引入 ShellProgress、TaskStatusText，将 ./ShellProgress.js 中已经封装好的能力接到本文件流程里。
import { ShellProgress, TaskStatusText } from './ShellProgress.js';
// 引入 describeTeammateActivity，将 ./taskStatusUtils.js 中已经封装好的能力接到本文件流程里。
import { describeTeammateActivity } from './taskStatusUtils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  task: DeepImmutable<BackgroundTaskState>;
  maxActivityWidth?: number;
};
// BackgroundTask 封装任务详情界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function BackgroundTask(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(92);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    task,
    maxActivityWidth
  } = t0;
  // activityLimit保存`maxActivityWidth ?? 40`，供终端 UI Background Task后续判断或输出使用。
  const activityLimit = maxActivityWidth ?? 40;
  // 按照 task.type 的取值选择终端渲染的具体处理分支。
  switch (task.type) {
    case "local_bash":
      {
        // t1标记终端 UI Background Task是否启用对应路径。
        const t1 = task.kind === "monitor" ? task.description : task.command;
        // t2 暂存 `truncate(t1, activityLimit, true)` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[0] !== activityLimit || $[1] !== t1) {
          // t2 暂存 `truncate(t1, activityLimit, true)` 生成的渲染片段，后续返回路径直接复用。
          t2 = truncate(t1, activityLimit, true);
          // $[0] 缓存 `activityLimit`，下次依赖未变时 React 编译产物可直接复用。
          $[0] = activityLimit;
          // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[1] = t1;
          // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[2] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[2];
        }
        // t3 暂存 `<ShellProgress shell={task} />` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[3] !== task) {
          // t3 暂存 `<ShellProgress shell={task} />` 生成的渲染片段，后续返回路径直接复用。
          t3 = <ShellProgress shell={task} />;
          // $[3] 缓存 `task`，下次依赖未变时 React 编译产物可直接复用。
          $[3] = task;
          // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[4] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[4];
        }
        // t4 暂存 `<Text>{t2}{" "}{t3}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[5] !== t2 || $[6] !== t3) {
          // t4 暂存 `<Text>{t2}{" "}{t3}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t4 = <Text>{t2}{" "}{t3}</Text>;
          // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[5] = t2;
          // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[6] = t3;
          // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[7];
        }
        // 返回 `t4`，作为终端渲染这次计算的结果。
        return t4;
      }
    case "remote_agent":
      {
        // 满足 `task.isRemoteReview` 时，终端渲染执行该分支。
        if (task.isRemoteReview) {
          // t1 暂存 `<Text><RemoteSessionProgress session={task} /></Text>` 的派生结果，便于缓存命中时直接复用。
          let t1;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[8] !== task) {
            // t1 暂存 `<Text><RemoteSessionProgress session={task} /></Text>` 生成的渲染片段，后续返回路径直接复用。
            t1 = <Text><RemoteSessionProgress session={task} /></Text>;
            // $[8] 缓存 `task`，下次依赖未变时 React 编译产物可直接复用。
            $[8] = task;
            // $[9] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
            $[9] = t1;
          } else {
            // t1 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
            t1 = $[9];
          }
          // 返回 `t1`，作为终端渲染这次计算的结果。
          return t1;
        }
        // running标记终端 UI Background Task是否启用对应路径。
        const running = task.status === "running" || task.status === "pending";
        // t1保存`running ? DIAMOND_OPEN : DIAMOND_FILLED`，供终端 UI Background Task后续判断或输出使用。
        const t1 = running ? DIAMOND_OPEN : DIAMOND_FILLED;
        // t2 暂存 `<Text dimColor={true}>{t1} </Text>` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[10] !== t1) {
          // t2 暂存 `<Text dimColor={true}>{t1} </Text>` 生成的渲染片段，后续返回路径直接复用。
          t2 = <Text dimColor={true}>{t1} </Text>;
          // $[10] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[10] = t1;
          // $[11] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[11] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[11];
        }
        // t3 暂存 `truncate(task.title, activityLimit, true)` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[12] !== activityLimit || $[13] !== task.title) {
          // t3 暂存 `truncate(task.title, activityLimit, true)` 生成的渲染片段，后续返回路径直接复用。
          t3 = truncate(task.title, activityLimit, true);
          // $[12] 缓存 `activityLimit`，下次依赖未变时 React 编译产物可直接复用。
          $[12] = activityLimit;
          // $[13] 缓存 `task.title`，下次依赖未变时 React 编译产物可直接复用。
          $[13] = task.title;
          // $[14] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[14] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[14];
        }
        // t4 暂存 `<Text dimColor={true}> · </Text>` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
          // t4 暂存 `<Text dimColor={true}> · </Text>` 生成的渲染片段，后续返回路径直接复用。
          t4 = <Text dimColor={true}> · </Text>;
          // $[15] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[15] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[15];
        }
        // t5 暂存 `<RemoteSessionProgress session={task} />` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[16] !== task) {
          // t5 暂存 `<RemoteSessionProgress session={task} />` 生成的渲染片段，后续返回路径直接复用。
          t5 = <RemoteSessionProgress session={task} />;
          // $[16] 缓存 `task`，下次依赖未变时 React 编译产物可直接复用。
          $[16] = task;
          // $[17] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[17] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[17];
        }
        // t6 暂存 `<Text>{t2}{t3}{t4}{t5}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[18] !== t2 || $[19] !== t3 || $[20] !== t5) {
          // t6 暂存 `<Text>{t2}{t3}{t4}{t5}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Text>{t2}{t3}{t4}{t5}</Text>;
          // $[18] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[18] = t2;
          // $[19] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[19] = t3;
          // $[20] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[20] = t5;
          // $[21] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[21] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[21];
        }
        // 返回 `t6`，作为终端渲染这次计算的结果。
        return t6;
      }
    case "local_agent":
      {
        // t1 暂存 `truncate(task.description, activityLimit, true)` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[22] !== activityLimit || $[23] !== task.description) {
          // t1 暂存 `truncate(task.description, activityLimit, true)` 生成的渲染片段，后续返回路径直接复用。
          t1 = truncate(task.description, activityLimit, true);
          // $[22] 缓存 `activityLimit`，下次依赖未变时 React 编译产物可直接复用。
          $[22] = activityLimit;
          // $[23] 缓存 `task.description`，下次依赖未变时 React 编译产物可直接复用。
          $[23] = task.description;
          // $[24] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[24] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[24];
        }
        // t2标记终端 UI Background Task是否启用对应路径。
        const t2 = task.status === "completed" ? "done" : undefined;
        // t3标记终端 UI Background Task是否启用对应路径。
        const t3 = task.status === "completed" && !task.notified ? ", unread" : undefined;
        // t4 暂存 `<TaskStatusText status={task.status} label={t2} suffix={t...` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[25] !== t2 || $[26] !== t3 || $[27] !== task.status) {
          // t4 暂存 `<TaskStatusText status={task.status} label={t2} suffix={t...` 生成的渲染片段，后续返回路径直接复用。
          t4 = <TaskStatusText status={task.status} label={t2} suffix={t3} />;
          // $[25] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[25] = t2;
          // $[26] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[26] = t3;
          // $[27] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
          $[27] = task.status;
          // $[28] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[28] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[28];
        }
        // t5 暂存 `<Text>{t1}{" "}{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[29] !== t1 || $[30] !== t4) {
          // t5 暂存 `<Text>{t1}{" "}{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t5 = <Text>{t1}{" "}{t4}</Text>;
          // $[29] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[29] = t1;
          // $[30] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[30] = t4;
          // $[31] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[31] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[31];
        }
        // 返回 `t5`，作为终端渲染这次计算的结果。
        return t5;
      }
    case "in_process_teammate":
      {
        // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
        let T0;
        // T1 暂存 `Text` 的派生结果，便于缓存命中时直接复用。
        let T1;
        // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
        let t1;
        // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
        let t2;
        // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
        let t3;
        // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[32] !== activityLimit || $[33] !== task) {
          // activity保存`describeTeammateActivity`，供终端渲染后续处理使用。
          const activity = describeTeammateActivity(task);
          // T1 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
          T1 = Text;
          // t5 暂存 `toInkColor(task.identity.color)` 的派生结果，便于缓存命中时直接复用。
          let t5;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[40] !== task.identity.color) {
            // t5 暂存 `toInkColor(task.identity.color)` 生成的渲染片段，后续返回路径直接复用。
            t5 = toInkColor(task.identity.color);
            // $[40] 缓存 `task.identity.color`，下次依赖未变时 React 编译产物可直接复用。
            $[40] = task.identity.color;
            // $[41] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
            $[41] = t5;
          } else {
            // t5 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
            t5 = $[41];
          }
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[42] !== t5 || $[43] !== task.identity.agentName) {
            // t4 暂存 `<Text color={t5}>@{task.identity.agentName}</Text>` 生成的渲染片段，后续返回路径直接复用。
            t4 = <Text color={t5}>@{task.identity.agentName}</Text>;
            // $[42] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
            $[42] = t5;
            // $[43] 缓存 `task.identity.agentName`，下次依赖未变时 React 编译产物可直接复用。
            $[43] = task.identity.agentName;
            // $[44] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
            $[44] = t4;
          } else {
            // t4 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
            t4 = $[44];
          }
          // T0 暂存 `Text` 生成的渲染片段，后续返回路径直接复用。
          T0 = Text;
          // t1 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
          t1 = true;
          // t2 暂存 `": "` 生成的渲染片段，后续返回路径直接复用。
          t2 = ": ";
          // t3 暂存 `truncate(activity, activityLimit, true)` 生成的渲染片段，后续返回路径直接复用。
          t3 = truncate(activity, activityLimit, true);
          // $[32] 缓存 `activityLimit`，下次依赖未变时 React 编译产物可直接复用。
          $[32] = activityLimit;
          // $[33] 缓存 `task`，下次依赖未变时 React 编译产物可直接复用。
          $[33] = task;
          // $[34] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
          $[34] = T0;
          // $[35] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
          $[35] = T1;
          // $[36] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[36] = t1;
          // $[37] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[37] = t2;
          // $[38] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[38] = t3;
          // $[39] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[39] = t4;
        } else {
          // T0 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
          T0 = $[34];
          // T1 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
          T1 = $[35];
          // t1 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[36];
          // t2 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[37];
          // t3 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[38];
          // t4 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[39];
        }
        // t5 暂存 `<T0 dimColor={t1}>{t2}{t3}</T0>` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[45] !== T0 || $[46] !== t1 || $[47] !== t2 || $[48] !== t3) {
          // t5 暂存 `<T0 dimColor={t1}>{t2}{t3}</T0>` 生成的渲染片段，后续返回路径直接复用。
          t5 = <T0 dimColor={t1}>{t2}{t3}</T0>;
          // $[45] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
          $[45] = T0;
          // $[46] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[46] = t1;
          // $[47] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[47] = t2;
          // $[48] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[48] = t3;
          // $[49] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[49] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[49];
        }
        // t6 暂存 `<T1>{t4}{t5}</T1>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[50] !== T1 || $[51] !== t4 || $[52] !== t5) {
          // t6 暂存 `<T1>{t4}{t5}</T1>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <T1>{t4}{t5}</T1>;
          // $[50] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
          $[50] = T1;
          // $[51] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[51] = t4;
          // $[52] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[52] = t5;
          // $[53] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[53] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[53];
        }
        // 返回 `t6`，作为终端渲染这次计算的结果。
        return t6;
      }
    case "local_workflow":
      {
        // t1保存`task.workflowName ?? task.summary ?? task.description`，供后续判断或组装使用。
        const t1 = task.workflowName ?? task.summary ?? task.description;
        // t2 暂存 `truncate(t1, activityLimit, true)` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[54] !== activityLimit || $[55] !== t1) {
          // t2 暂存 `truncate(t1, activityLimit, true)` 生成的渲染片段，后续返回路径直接复用。
          t2 = truncate(t1, activityLimit, true);
          // $[54] 缓存 `activityLimit`，下次依赖未变时 React 编译产物可直接复用。
          $[54] = activityLimit;
          // $[55] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[55] = t1;
          // $[56] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[56] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[56] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[56];
        }
        // t3 暂存 `task.status === "running" ? `${task.agentCount} ${plural(...` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[57] !== task.agentCount || $[58] !== task.status) {
          // t3 暂存 `task.status === "running" ? `${task.agentCount} ${plural(...` 生成的渲染片段，后续返回路径直接复用。
          t3 = task.status === "running" ? `${task.agentCount} ${plural(task.agentCount, "agent")}` : task.status === "completed" ? "done" : undefined;
          // $[57] 缓存 `task.agentCount`，下次依赖未变时 React 编译产物可直接复用。
          $[57] = task.agentCount;
          // $[58] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
          $[58] = task.status;
          // $[59] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[59] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[59];
        }
        // t4标记终端 UI Background Task是否启用对应路径。
        const t4 = task.status === "completed" && !task.notified ? ", unread" : undefined;
        // t5 暂存 `<TaskStatusText status={task.status} label={t3} suffix={t...` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[60] !== t3 || $[61] !== t4 || $[62] !== task.status) {
          // t5 暂存 `<TaskStatusText status={task.status} label={t3} suffix={t...` 生成的渲染片段，后续返回路径直接复用。
          t5 = <TaskStatusText status={task.status} label={t3} suffix={t4} />;
          // $[60] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[60] = t3;
          // $[61] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[61] = t4;
          // $[62] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
          $[62] = task.status;
          // $[63] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[63] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[63] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[63];
        }
        // t6 暂存 `<Text>{t2}{" "}{t5}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[64] !== t2 || $[65] !== t5) {
          // t6 暂存 `<Text>{t2}{" "}{t5}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Text>{t2}{" "}{t5}</Text>;
          // $[64] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[64] = t2;
          // $[65] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[65] = t5;
          // $[66] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[66] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[66] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[66];
        }
        // 返回 `t6`，作为终端渲染这次计算的结果。
        return t6;
      }
    case "monitor_mcp":
      {
        // t1 暂存 `truncate(task.description, activityLimit, true)` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[67] !== activityLimit || $[68] !== task.description) {
          // t1 暂存 `truncate(task.description, activityLimit, true)` 生成的渲染片段，后续返回路径直接复用。
          t1 = truncate(task.description, activityLimit, true);
          // $[67] 缓存 `activityLimit`，下次依赖未变时 React 编译产物可直接复用。
          $[67] = activityLimit;
          // $[68] 缓存 `task.description`，下次依赖未变时 React 编译产物可直接复用。
          $[68] = task.description;
          // $[69] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[69] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[69] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[69];
        }
        // t2标记终端 UI Background Task是否启用对应路径。
        const t2 = task.status === "completed" ? "done" : undefined;
        // t3标记终端 UI Background Task是否启用对应路径。
        const t3 = task.status === "completed" && !task.notified ? ", unread" : undefined;
        // t4 暂存 `<TaskStatusText status={task.status} label={t2} suffix={t...` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[70] !== t2 || $[71] !== t3 || $[72] !== task.status) {
          // t4 暂存 `<TaskStatusText status={task.status} label={t2} suffix={t...` 生成的渲染片段，后续返回路径直接复用。
          t4 = <TaskStatusText status={task.status} label={t2} suffix={t3} />;
          // $[70] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[70] = t2;
          // $[71] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[71] = t3;
          // $[72] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
          $[72] = task.status;
          // $[73] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[73] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[73] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[73];
        }
        // t5 暂存 `<Text>{t1}{" "}{t4}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[74] !== t1 || $[75] !== t4) {
          // t5 暂存 `<Text>{t1}{" "}{t4}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t5 = <Text>{t1}{" "}{t4}</Text>;
          // $[74] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[74] = t1;
          // $[75] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[75] = t4;
          // $[76] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[76] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[76];
        }
        // 返回 `t5`，作为终端渲染这次计算的结果。
        return t5;
      }
    case "dream":
      {
        // n记录 `task.filesTouched.length` 是否成立，下一步按该结果分支。
        const n = task.filesTouched.length;
        // t1 暂存 `task.phase === "updating" && n > 0 ? `${n} ${plural(n, "f...` 的派生结果，便于缓存命中时直接复用。
        let t1;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[77] !== n || $[78] !== task.phase || $[79] !== task.sessionsReviewing) {
          // t1 暂存 `task.phase === "updating" && n > 0 ? `${n} ${plural(n, "f...` 生成的渲染片段，后续返回路径直接复用。
          t1 = task.phase === "updating" && n > 0 ? `${n} ${plural(n, "file")}` : `${task.sessionsReviewing} ${plural(task.sessionsReviewing, "session")}`;
          // $[77] 缓存 `n`，下次依赖未变时 React 编译产物可直接复用。
          $[77] = n;
          // $[78] 缓存 `task.phase`，下次依赖未变时 React 编译产物可直接复用。
          $[78] = task.phase;
          // $[79] 缓存 `task.sessionsReviewing`，下次依赖未变时 React 编译产物可直接复用。
          $[79] = task.sessionsReviewing;
          // $[80] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
          $[80] = t1;
        } else {
          // t1 从 React 编译缓存槽 $[80] 取回渲染片段，避免依赖未变时重建 JSX。
          t1 = $[80];
        }
        // detail保存`t1`，作为后续临时缓存值处理的输入。
        const detail = t1;
        // t2 暂存 `<Text dimColor={true}>· {task.phase} · {detail}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t2;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[81] !== detail || $[82] !== task.phase) {
          // t2 暂存 `<Text dimColor={true}>· {task.phase} · {detail}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t2 = <Text dimColor={true}>· {task.phase} · {detail}</Text>;
          // $[81] 缓存 `detail`，下次依赖未变时 React 编译产物可直接复用。
          $[81] = detail;
          // $[82] 缓存 `task.phase`，下次依赖未变时 React 编译产物可直接复用。
          $[82] = task.phase;
          // $[83] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[83] = t2;
        } else {
          // t2 从 React 编译缓存槽 $[83] 取回渲染片段，避免依赖未变时重建 JSX。
          t2 = $[83];
        }
        // t3标记终端 UI Background Task是否启用对应路径。
        const t3 = task.status === "completed" ? "done" : undefined;
        // t4标记终端 UI Background Task是否启用对应路径。
        const t4 = task.status === "completed" && !task.notified ? ", unread" : undefined;
        // t5 暂存 `<TaskStatusText status={task.status} label={t3} suffix={t...` 的派生结果，便于缓存命中时直接复用。
        let t5;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[84] !== t3 || $[85] !== t4 || $[86] !== task.status) {
          // t5 暂存 `<TaskStatusText status={task.status} label={t3} suffix={t...` 生成的渲染片段，后续返回路径直接复用。
          t5 = <TaskStatusText status={task.status} label={t3} suffix={t4} />;
          // $[84] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[84] = t3;
          // $[85] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[85] = t4;
          // $[86] 缓存 `task.status`，下次依赖未变时 React 编译产物可直接复用。
          $[86] = task.status;
          // $[87] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[87] = t5;
        } else {
          // t5 从 React 编译缓存槽 $[87] 取回渲染片段，避免依赖未变时重建 JSX。
          t5 = $[87];
        }
        // t6 暂存 `<Text>{task.description}{" "}{t2}{" "}{t5}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t6;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[88] !== t2 || $[89] !== t5 || $[90] !== task.description) {
          // t6 暂存 `<Text>{task.description}{" "}{t2}{" "}{t5}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t6 = <Text>{task.description}{" "}{t2}{" "}{t5}</Text>;
          // $[88] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
          $[88] = t2;
          // $[89] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
          $[89] = t5;
          // $[90] 缓存 `task.description`，下次依赖未变时 React 编译产物可直接复用。
          $[90] = task.description;
          // $[91] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
          $[91] = t6;
        } else {
          // t6 从 React 编译缓存槽 $[91] 取回渲染片段，避免依赖未变时重建 JSX。
          t6 = $[91];
        }
        // 返回 `t6`，作为终端渲染这次计算的结果。
        return t6;
      }
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIlRleHQiLCJCYWNrZ3JvdW5kVGFza1N0YXRlIiwiRGVlcEltbXV0YWJsZSIsInRydW5jYXRlIiwidG9JbmtDb2xvciIsInBsdXJhbCIsIkRJQU1PTkRfRklMTEVEIiwiRElBTU9ORF9PUEVOIiwiUmVtb3RlU2Vzc2lvblByb2dyZXNzIiwiU2hlbGxQcm9ncmVzcyIsIlRhc2tTdGF0dXNUZXh0IiwiZGVzY3JpYmVUZWFtbWF0ZUFjdGl2aXR5IiwiUHJvcHMiLCJ0YXNrIiwibWF4QWN0aXZpdHlXaWR0aCIsIkJhY2tncm91bmRUYXNrIiwidDAiLCIkIiwiX2MiLCJhY3Rpdml0eUxpbWl0IiwidHlwZSIsInQxIiwia2luZCIsImRlc2NyaXB0aW9uIiwiY29tbWFuZCIsInQyIiwidDMiLCJ0NCIsImlzUmVtb3RlUmV2aWV3IiwicnVubmluZyIsInN0YXR1cyIsInRpdGxlIiwiU3ltYm9sIiwiZm9yIiwidDUiLCJ0NiIsInVuZGVmaW5lZCIsIm5vdGlmaWVkIiwiVDAiLCJUMSIsImFjdGl2aXR5IiwiaWRlbnRpdHkiLCJjb2xvciIsImFnZW50TmFtZSIsIndvcmtmbG93TmFtZSIsInN1bW1hcnkiLCJhZ2VudENvdW50IiwibiIsImZpbGVzVG91Y2hlZCIsImxlbmd0aCIsInBoYXNlIiwic2Vzc2lvbnNSZXZpZXdpbmciLCJkZXRhaWwiXSwic291cmNlcyI6WyJCYWNrZ3JvdW5kVGFzay50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnc3JjL2luay5qcydcbmltcG9ydCB0eXBlIHsgQmFja2dyb3VuZFRhc2tTdGF0ZSB9IGZyb20gJ3NyYy90YXNrcy90eXBlcy5qcydcbmltcG9ydCB0eXBlIHsgRGVlcEltbXV0YWJsZSB9IGZyb20gJ3NyYy90eXBlcy91dGlscy5qcydcbmltcG9ydCB7IHRydW5jYXRlIH0gZnJvbSAnc3JjL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IHRvSW5rQ29sb3IgfSBmcm9tICdzcmMvdXRpbHMvaW5rLmpzJ1xuaW1wb3J0IHsgcGx1cmFsIH0gZnJvbSAnc3JjL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuaW1wb3J0IHsgRElBTU9ORF9GSUxMRUQsIERJQU1PTkRfT1BFTiB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy9maWd1cmVzLmpzJ1xuaW1wb3J0IHsgUmVtb3RlU2Vzc2lvblByb2dyZXNzIH0gZnJvbSAnLi9SZW1vdGVTZXNzaW9uUHJvZ3Jlc3MuanMnXG5pbXBvcnQgeyBTaGVsbFByb2dyZXNzLCBUYXNrU3RhdHVzVGV4dCB9IGZyb20gJy4vU2hlbGxQcm9ncmVzcy5qcydcbmltcG9ydCB7IGRlc2NyaWJlVGVhbW1hdGVBY3Rpdml0eSB9IGZyb20gJy4vdGFza1N0YXR1c1V0aWxzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0YXNrOiBEZWVwSW1tdXRhYmxlPEJhY2tncm91bmRUYXNrU3RhdGU+XG4gIG1heEFjdGl2aXR5V2lkdGg/OiBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEJhY2tncm91bmRUYXNrKHtcbiAgdGFzayxcbiAgbWF4QWN0aXZpdHlXaWR0aCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgYWN0aXZpdHlMaW1pdCA9IG1heEFjdGl2aXR5V2lkdGggPz8gNDBcbiAgc3dpdGNoICh0YXNrLnR5cGUpIHtcbiAgICBjYXNlICdsb2NhbF9iYXNoJzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHt0cnVuY2F0ZShcbiAgICAgICAgICAgIHRhc2sua2luZCA9PT0gJ21vbml0b3InID8gdGFzay5kZXNjcmlwdGlvbiA6IHRhc2suY29tbWFuZCxcbiAgICAgICAgICAgIGFjdGl2aXR5TGltaXQsXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICl9eycgJ31cbiAgICAgICAgICA8U2hlbGxQcm9ncmVzcyBzaGVsbD17dGFza30gLz5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKVxuICAgIGNhc2UgJ3JlbW90ZV9hZ2VudCc6IHtcbiAgICAgIC8vIExpdGUtcmV2aWV3IHJlbmRlcnMgaXRzIG93biByYWluYm93IGxpbmUgKHRpdGxlICsgbGl2ZSBjb3VudHMpLFxuICAgICAgLy8gc28gd2UgZG9uJ3QgcHJlZml4IHRoZSB0aXRsZSDigJQgdGhlIHJhaW5ib3cgYWxyZWFkeSBpbmNsdWRlcyBpdC5cbiAgICAgIGlmICh0YXNrLmlzUmVtb3RlUmV2aWV3KSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICA8UmVtb3RlU2Vzc2lvblByb2dyZXNzIHNlc3Npb249e3Rhc2t9IC8+XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICApXG4gICAgICB9XG4gICAgICBjb25zdCBydW5uaW5nID0gdGFzay5zdGF0dXMgPT09ICdydW5uaW5nJyB8fCB0YXNrLnN0YXR1cyA9PT0gJ3BlbmRpbmcnXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57cnVubmluZyA/IERJQU1PTkRfT1BFTiA6IERJQU1PTkRfRklMTEVEfSA8L1RleHQ+XG4gICAgICAgICAge3RydW5jYXRlKHRhc2sudGl0bGUsIGFjdGl2aXR5TGltaXQsIHRydWUpfVxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiDCtyA8L1RleHQ+XG4gICAgICAgICAgPFJlbW90ZVNlc3Npb25Qcm9ncmVzcyBzZXNzaW9uPXt0YXNrfSAvPlxuICAgICAgICA8L1RleHQ+XG4gICAgICApXG4gICAgfVxuICAgIGNhc2UgJ2xvY2FsX2FnZW50JzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHt0cnVuY2F0ZSh0YXNrLmRlc2NyaXB0aW9uLCBhY3Rpdml0eUxpbWl0LCB0cnVlKX17JyAnfVxuICAgICAgICAgIDxUYXNrU3RhdHVzVGV4dFxuICAgICAgICAgICAgc3RhdHVzPXt0YXNrLnN0YXR1c31cbiAgICAgICAgICAgIGxhYmVsPXt0YXNrLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgPyAnZG9uZScgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICBzdWZmaXg9e1xuICAgICAgICAgICAgICB0YXNrLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgJiYgIXRhc2subm90aWZpZWRcbiAgICAgICAgICAgICAgICA/ICcsIHVucmVhZCdcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIClcbiAgICBjYXNlICdpbl9wcm9jZXNzX3RlYW1tYXRlJzoge1xuICAgICAgY29uc3QgYWN0aXZpdHkgPSBkZXNjcmliZVRlYW1tYXRlQWN0aXZpdHkodGFzaylcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPXt0b0lua0NvbG9yKHRhc2suaWRlbnRpdHkuY29sb3IpfT5cbiAgICAgICAgICAgIEB7dGFzay5pZGVudGl0eS5hZ2VudE5hbWV9XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPjoge3RydW5jYXRlKGFjdGl2aXR5LCBhY3Rpdml0eUxpbWl0LCB0cnVlKX08L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIClcbiAgICB9XG4gICAgY2FzZSAnbG9jYWxfd29ya2Zsb3cnOlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAge3RydW5jYXRlKFxuICAgICAgICAgICAgdGFzay53b3JrZmxvd05hbWUgPz8gdGFzay5zdW1tYXJ5ID8/IHRhc2suZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBhY3Rpdml0eUxpbWl0LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICApfXsnICd9XG4gICAgICAgICAgPFRhc2tTdGF0dXNUZXh0XG4gICAgICAgICAgICBzdGF0dXM9e3Rhc2suc3RhdHVzfVxuICAgICAgICAgICAgbGFiZWw9e1xuICAgICAgICAgICAgICB0YXNrLnN0YXR1cyA9PT0gJ3J1bm5pbmcnXG4gICAgICAgICAgICAgICAgPyBgJHt0YXNrLmFnZW50Q291bnR9ICR7cGx1cmFsKHRhc2suYWdlbnRDb3VudCwgJ2FnZW50Jyl9YFxuICAgICAgICAgICAgICAgIDogdGFzay5zdGF0dXMgPT09ICdjb21wbGV0ZWQnXG4gICAgICAgICAgICAgICAgICA/ICdkb25lJ1xuICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1ZmZpeD17XG4gICAgICAgICAgICAgIHRhc2suc3RhdHVzID09PSAnY29tcGxldGVkJyAmJiAhdGFzay5ub3RpZmllZFxuICAgICAgICAgICAgICAgID8gJywgdW5yZWFkJ1xuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKVxuICAgIGNhc2UgJ21vbml0b3JfbWNwJzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIHt0cnVuY2F0ZSh0YXNrLmRlc2NyaXB0aW9uLCBhY3Rpdml0eUxpbWl0LCB0cnVlKX17JyAnfVxuICAgICAgICAgIDxUYXNrU3RhdHVzVGV4dFxuICAgICAgICAgICAgc3RhdHVzPXt0YXNrLnN0YXR1c31cbiAgICAgICAgICAgIGxhYmVsPXt0YXNrLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgPyAnZG9uZScgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICBzdWZmaXg9e1xuICAgICAgICAgICAgICB0YXNrLnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCcgJiYgIXRhc2subm90aWZpZWRcbiAgICAgICAgICAgICAgICA/ICcsIHVucmVhZCdcbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIClcbiAgICBjYXNlICdkcmVhbSc6IHtcbiAgICAgIGNvbnN0IG4gPSB0YXNrLmZpbGVzVG91Y2hlZC5sZW5ndGhcbiAgICAgIGNvbnN0IGRldGFpbCA9XG4gICAgICAgIHRhc2sucGhhc2UgPT09ICd1cGRhdGluZycgJiYgbiA+IDBcbiAgICAgICAgICA/IGAke259ICR7cGx1cmFsKG4sICdmaWxlJyl9YFxuICAgICAgICAgIDogYCR7dGFzay5zZXNzaW9uc1Jldmlld2luZ30gJHtwbHVyYWwodGFzay5zZXNzaW9uc1Jldmlld2luZywgJ3Nlc3Npb24nKX1gXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICB7dGFzay5kZXNjcmlwdGlvbn17JyAnfVxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgwrcge3Rhc2sucGhhc2V9IMK3IHtkZXRhaWx9XG4gICAgICAgICAgPC9UZXh0PnsnICd9XG4gICAgICAgICAgPFRhc2tTdGF0dXNUZXh0XG4gICAgICAgICAgICBzdGF0dXM9e3Rhc2suc3RhdHVzfVxuICAgICAgICAgICAgbGFiZWw9e3Rhc2suc3RhdHVzID09PSAnY29tcGxldGVkJyA/ICdkb25lJyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgIHN1ZmZpeD17XG4gICAgICAgICAgICAgIHRhc2suc3RhdHVzID09PSAnY29tcGxldGVkJyAmJiAhdGFzay5ub3RpZmllZFxuICAgICAgICAgICAgICAgID8gJywgdW5yZWFkJ1xuICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKVxuICAgIH1cbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxJQUFJLFFBQVEsWUFBWTtBQUNqQyxjQUFjQyxtQkFBbUIsUUFBUSxvQkFBb0I7QUFDN0QsY0FBY0MsYUFBYSxRQUFRLG9CQUFvQjtB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