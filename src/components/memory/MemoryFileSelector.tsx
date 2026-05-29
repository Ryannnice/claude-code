// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir } from 'fs/promises';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 use、useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { use, useEffect, useState } from 'react';
// 引入 getOriginalCwd，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../../bootstrap/state.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 引入 getAutoMemPath、isAutoMemoryEnabled，将 ../../memdir/paths.js 中已经封装好的能力接到本文件流程里。
import { getAutoMemPath, isAutoMemoryEnabled } from '../../memdir/paths.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 接入 isAutoDreamEnabled 服务层能力，把外部通信或共享状态交给 ../../services/autoDream/config.js 处理。
import { isAutoDreamEnabled } from '../../services/autoDream/config.js';
// 接入 readLastConsolidatedAt 服务层能力，把外部通信或共享状态交给 ../../services/autoDream/consolidationLock.js 处理。
import { readLastConsolidatedAt } from '../../services/autoDream/consolidationLock.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 接入 getAgentMemoryDir 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getAgentMemoryDir } from '../../tools/AgentTool/agentMemory.js';
// 复用 openPath 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openPath } from '../../utils/browser.js';
// 复用 getMemoryFiles、MemoryFileInfo 工具函数，把通用处理留在 ../../utils/claudemd.js 中维护。
import { getMemoryFiles, type MemoryFileInfo } from '../../utils/claudemd.js';
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js';
// 复用 getDisplayPath 工具函数，把通用处理留在 ../../utils/file.js 中维护。
import { getDisplayPath } from '../../utils/file.js';
// 复用 formatRelativeTimeAgo 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { formatRelativeTimeAgo } from '../../utils/format.js';
// 复用 projectIsInGitRepo 工具函数，把通用处理留在 ../../utils/memory/versions.js 中维护。
import { projectIsInGitRepo } from '../../utils/memory/versions.js';
// 复用 updateSettingsForSource 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { updateSettingsForSource } from '../../utils/settings/settings.js';
// 引入 Select，将 ../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/index.js';
// 引入 ListItem，将 ../design-system/ListItem.js 中已经封装好的能力接到本文件流程里。
import { ListItem } from '../design-system/ListItem.js';

/* eslint-disable @typescript-eslint/no-require-imports */
// teamMemPaths 路径数据保存`feature`，供终端渲染后续处理使用。
const teamMemPaths = feature('TEAMMEM') ? require('../../memdir/teamMemPaths.js') as typeof import('../../memdir/teamMemPaths.js') : null;
/* eslint-enable @typescript-eslint/no-require-imports */

// ExtendedMemoryFileInfo 描述终端渲染需要实现的字段和回调，避免跨模块交互时契约漂移。
interface ExtendedMemoryFileInfo extends MemoryFileInfo {
  isNested?: boolean;
  exists: boolean;
}

// Remember last selected path
// lastSelectedPath 路径数据 先占位，稍后的条件分支会根据实际输入补齐它。
let lastSelectedPath: string | undefined;
// OPEN_FOLDER_PREFIX保存`'__open_folder__'`，作为后续固定文本处理的输入。
const OPEN_FOLDER_PREFIX = '__open_folder__';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onSelect: (path: string) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (path: string) => void;
  // 这个回调绑定到 onCancel: () => void;，负责终端渲染在该局部场景下的响应。
  onCancel: () => void;
};
// MemoryFileSelector 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MemoryFileSelector(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(58);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onSelect,
    onCancel
  } = t0;
  // existingMemoryFiles 文件数据保存`use`，供终端渲染后续处理使用。
  const existingMemoryFiles = use(getMemoryFiles());
  // userMemoryPath 路径数据格式化`join`，供终端渲染后续处理使用。
  const userMemoryPath = join(getClaudeConfigHomeDir(), "CLAUDE.md");
  // projectMemoryPath 路径数据格式化`join`，供终端渲染后续处理使用。
  const projectMemoryPath = join(getOriginalCwd(), "CLAUDE.md");
  // hasUserMemory记录 `existingMemoryFiles.some` 是否成立，终端渲染随后按该结果分支。
  const hasUserMemory = existingMemoryFiles.some(f => f.path === userMemoryPath);
  // hasProjectMemory记录 `existingMemoryFiles.some` 是否成立，终端渲染随后按该结果分支。
  const hasProjectMemory = existingMemoryFiles.some(f_0 => f_0.path === projectMemoryPath);
  // allMemoryFiles 文件数据筛选`existingMemoryFiles.filter`，供终端渲染后续处理使用。
  const allMemoryFiles = [...existingMemoryFiles.filter(_temp).map(_temp2), ...(hasUserMemory ? [] : [{
    path: userMemoryPath,
    type: "User" as const,
    content: "",
    exists: false
  }]), ...(hasProjectMemory ? [] : [{
    path: projectMemoryPath,
    type: "Project" as const,
    content: "",
    exists: false
  }])];
  // depths 集合保存`Map`，供终端渲染后续处理使用。
  const depths = new Map();
  // memoryOptions 集合派生`allMemoryFiles.map`，供终端渲染后续处理使用。
  const memoryOptions = allMemoryFiles.map(file => {
    // displayPath 路径数据读取`getDisplayPath`，供终端渲染后续处理使用。
    const displayPath = getDisplayPath(file.path);
    // existsLabel 命名 `file.exists ? "" : " (new)"`，让后续代码直接表达这个值的用途。
    const existsLabel = file.exists ? "" : " (new)";
    // depth读取`depths.get`，供终端渲染后续处理使用。
    const depth = file.parent ? (depths.get(file.parent) ?? 0) + 1 : 0;
    // depths.set 写入新的状态值，使终端渲染后续读取保持一致。
    depths.set(file.path, depth);
    // indent保存`repeat`，供终端渲染后续处理使用。
    const indent = depth > 0 ? "  ".repeat(depth - 1) : "";
    // label 先占位，稍后的条件分支会根据实际输入补齐它。
    let label;
    // 只有 `file.type === "User" && !file.isNested && file.pa` 满足时，终端渲染才执行该分支。
    if (file.type === "User" && !file.isNested && file.path === userMemoryPath) {
      // label更新为 `"User memory"`，确保终端 UI后续读取最新状态。
      label = "User memory";
    } else {
      // 只有 `file.type === "Project" && !file.isNested && file` 满足时，终端渲染才执行该分支。
      if (file.type === "Project" && !file.isNested && file.path === projectMemoryPath) {
        // label更新为 `"Project memory"`，确保终端 UI后续读取最新状态。
        label = "Project memory";
      } else {
        // 满足 `depth > 0` 时，终端渲染执行该分支。
        if (depth > 0) {
          // label更新为 ``${indent}L ${displayPath}${existsLabel}``，确保终端 UI后续读取最新状态。
          label = `${indent}L ${displayPath}${existsLabel}`;
        } else {
          // label更新为 ``${displayPath}``，确保终端 UI后续读取最新状态。
          label = `${displayPath}`;
        }
      }
    }
    // description 先占位，稍后的条件分支会根据实际输入补齐它。
    let description;
    // isGit记录 `projectIsInGitRepo` 是否成立，终端渲染随后按该结果分支。
    const isGit = projectIsInGitRepo(getOriginalCwd());
    // 只有 `file.type === "User" && !file.isNested` 满足时，终端渲染才执行该分支。
    if (file.type === "User" && !file.isNested) {
      // description更新为 `"Saved in ~/.claude/CLAUDE.md"`，确保终端 UI后续读取最新状态。
      description = "Saved in ~/.claude/CLAUDE.md";
    } else {
      // 只有 `file.type === "Project" && !file.isNested && file` 满足时，终端渲染才执行该分支。
      if (file.type === "Project" && !file.isNested && file.path === projectMemoryPath) {
        // description更新为 ``${isGit ? "Checked in at" : "Saved in"} ./CLAUDE.md``，确保终端 UI后续读取最新状态。
        description = `${isGit ? "Checked in at" : "Saved in"} ./CLAUDE.md`;
      } else {
        // 满足 `file.parent` 时，终端渲染执行该分支。
        if (file.parent) {
          // description更新为 `"@-imported"`，确保终端 UI后续读取最新状态。
          description = "@-imported";
        } else {
          // 满足 `file.isNested` 时，终端渲染执行该分支。
          if (file.isNested) {
            // description更新为 `"dynamically loaded"`，确保终端 UI后续读取最新状态。
            description = "dynamically loaded";
          } else {
            // description更新为 `""`，确保终端 UI后续读取最新状态。
            description = "";
          }
        }
      }
    }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      label,
      value: file.path,
      description
    };
  });
  // folderOptions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const folderOptions = [];
  // agentDefinitions 集合保存`useAppState`，供终端渲染后续处理使用。
  const agentDefinitions = useAppState(_temp3);
  // 满足 `isAutoMemoryEnabled()` 时，终端渲染执行该分支。
  if (isAutoMemoryEnabled()) {
    // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t1 = {
        label: "Open auto-memory folder",
        value: `${OPEN_FOLDER_PREFIX}${getAutoMemPath()}`,
        description: ""
      };
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // folderOptions 集合追加新条目，保持收集顺序与输入顺序一致。
    folderOptions.push(t1);
    // 只有 `feature("TEAMMEM") && teamMemPaths.isTeamMemoryEnabled()` 满足时，终端渲染才执行该分支。
    if (feature("TEAMMEM") && teamMemPaths.isTeamMemoryEnabled()) {
      // t2 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t2;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        // t2 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t2 = {
          label: "Open team memory folder",
          value: `${OPEN_FOLDER_PREFIX}${teamMemPaths.getTeamMemPath()}`,
          description: ""
        };
        // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
        $[1] = t2;
      } else {
        // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
        t2 = $[1];
      }
      // folderOptions 集合追加新条目，保持收集顺序与输入顺序一致。
      folderOptions.push(t2);
    }
    // 按顺序遍历 `agentDefinitions.activeAgents` 中的agent，逐个交给终端渲染处理。
    for (const agent of agentDefinitions.activeAgents) {
      // 满足 `agent.memory` 时，终端渲染执行该分支。
      if (agent.memory) {
        // agentDir读取`getAgentMemoryDir`，供终端渲染后续处理使用。
        const agentDir = getAgentMemoryDir(agent.agentType, agent.memory);
        // folderOptions 集合追加新条目，保持收集顺序与输入顺序一致。
        folderOptions.push({
          label: `Open ${chalk.bold(agent.agentType)} agent memory`,
          value: `${OPEN_FOLDER_PREFIX}${agentDir}`,
          description: `${agent.memory} scope`
        });
      }
    }
  }
  // memoryOptions 集合追加新条目，保持收集顺序与输入顺序一致。
  memoryOptions.push(...folderOptions);
  // t1 暂存 `lastSelectedPath && memoryOptions.some(_temp4) ? lastSele...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== memoryOptions) {
    // t1 暂存 `lastSelectedPath && memoryOptions.some(_temp4) ? lastSele...` 生成的渲染片段，后续返回路径直接复用。
    t1 = lastSelectedPath && memoryOptions.some(_temp4) ? lastSelectedPath : memoryOptions[0]?.value || "";
    // $[2] 缓存 `memoryOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = memoryOptions;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // initialPath 路径数据 命名 `t1`，让后续代码直接表达这个值的用途。
  const initialPath = t1;
  // autoMemoryOn 由 React state 持有，setAutoMemoryOn 会在用户操作或异步结果返回时触发刷新。
  const [autoMemoryOn, setAutoMemoryOn] = useState(isAutoMemoryEnabled);
  // autoDreamOn 由 React state 持有，setAutoDreamOn 会在用户操作或异步结果返回时触发刷新。
  const [autoDreamOn, setAutoDreamOn] = useState(isAutoDreamEnabled);
  // showDreamRow 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [showDreamRow] = useState(isAutoMemoryEnabled);
  // isDreamRunning记录 `useAppState` 是否成立，终端渲染随后按该结果分支。
  const isDreamRunning = useAppState(_temp6);
  // lastDreamAt 由 React state 持有，setLastDreamAt 会在用户操作或异步结果返回时触发刷新。
  const [lastDreamAt, setLastDreamAt] = useState(null);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== showDreamRow) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // showDreamRow缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!showDreamRow) {
        // 终端 UI 组件 Memory File Selector在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 readLastConsolidatedAt，触发终端渲染此处需要的副作用。
      readLastConsolidatedAt().then(setLastDreamAt);
    };
    // $[4] 缓存 `showDreamRow`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = showDreamRow;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // t3 暂存 `[showDreamRow, isDreamRunning]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== isDreamRunning || $[7] !== showDreamRow) {
    // t3 暂存 `[showDreamRow, isDreamRunning]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [showDreamRow, isDreamRunning];
    // $[6] 缓存 `isDreamRunning`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = isDreamRunning;
    // $[7] 缓存 `showDreamRow`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = showDreamRow;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `isDreamRunning ? "running" : lastDreamAt === null ? "" : ...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== isDreamRunning || $[10] !== lastDreamAt) {
    // t4 暂存 `isDreamRunning ? "running" : lastDreamAt === null ? "" : ...` 生成的渲染片段，后续返回路径直接复用。
    t4 = isDreamRunning ? "running" : lastDreamAt === null ? "" : lastDreamAt === 0 ? "never" : `last ran ${formatRelativeTimeAgo(new Date(lastDreamAt))}`;
    // $[9] 缓存 `isDreamRunning`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = isDreamRunning;
    // $[10] 缓存 `lastDreamAt`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = lastDreamAt;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[11];
  }
  // dreamStatus 集合保存`t4`，作为后续临时缓存值处理的输入。
  const dreamStatus = t4;
  // focusedToggle 由 React state 持有，setFocusedToggle 会在用户操作或异步结果返回时触发刷新。
  const [focusedToggle, setFocusedToggle] = useState(null);
  // toggleFocused标记终端 UI Memory File Selector是否启用对应路径。
  const toggleFocused = focusedToggle !== null;
  // lastToggleIndex 索引保存`showDreamRow ? 1 : 0`，供后续判断或组装使用。
  const lastToggleIndex = showDreamRow ? 1 : 0;
  // t5 暂存 `function handleToggleAutoMemory() {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== autoMemoryOn) {
    // t5 暂存 `function handleToggleAutoMemory() {` 生成的渲染片段，后续返回路径直接复用。
    t5 = function handleToggleAutoMemory() {
      // newValue标记终端 UI Memory File Selector是否启用对应路径。
      const newValue = !autoMemoryOn;
      // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
      updateSettingsForSource("userSettings", {
        autoMemoryEnabled: newValue
      });
      // setAutoMemoryOn 写入新的状态值，使终端渲染后续读取保持一致。
      setAutoMemoryOn(newValue);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_auto_memory_toggled", {
        enabled: newValue
      });
    };
    // $[12] 缓存 `autoMemoryOn`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = autoMemoryOn;
    // $[13] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[13];
  }
  // handleToggleAutoMemory保存`t5`，作为后续临时缓存值处理的输入。
  const handleToggleAutoMemory = t5;
  // t6 暂存 `function handleToggleAutoDream() {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== autoDreamOn) {
    // t6 暂存 `function handleToggleAutoDream() {` 生成的渲染片段，后续返回路径直接复用。
    t6 = function handleToggleAutoDream() {
      // newValue_0标记终端 UI Memory File Selector是否启用对应路径。
      const newValue_0 = !autoDreamOn;
      // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
      updateSettingsForSource("userSettings", {
        autoDreamEnabled: newValue_0
      });
      // setAutoDreamOn 写入新的状态值，使终端渲染后续读取保持一致。
      setAutoDreamOn(newValue_0);
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_auto_dream_toggled", {
        enabled: newValue_0
      });
    };
    // $[14] 缓存 `autoDreamOn`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = autoDreamOn;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
  }
  // handleToggleAutoDream保存`t6`，作为后续临时缓存值处理的输入。
  const handleToggleAutoDream = t6;
  // 调用 useExitOnCtrlCDWithKeybindings，触发终端渲染此处需要的副作用。
  useExitOnCtrlCDWithKeybindings();
  // t7 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t7 = {
      context: "Confirmation"
    };
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onCancel, t7);
  // t8 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== focusedToggle || $[18] !== handleToggleAutoDream || $[19] !== handleToggleAutoMemory) {
    // t8 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => {
      // 满足 `focusedToggle === 0` 时，终端渲染执行该分支。
      if (focusedToggle === 0) {
        // 调用 handleToggleAutoMemory，触发终端渲染此处需要的副作用。
        handleToggleAutoMemory();
      } else {
        // 满足 `focusedToggle === 1` 时，终端渲染执行该分支。
        if (focusedToggle === 1) {
          // 调用 handleToggleAutoDream，触发终端渲染此处需要的副作用。
          handleToggleAutoDream();
        }
      }
    };
    // $[17] 缓存 `focusedToggle`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = focusedToggle;
    // $[18] 缓存 `handleToggleAutoDream`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = handleToggleAutoDream;
    // $[19] 缓存 `handleToggleAutoMemory`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = handleToggleAutoMemory;
    // $[20] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[20];
  }
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== toggleFocused) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Confirmation",
      isActive: toggleFocused
    };
    // $[21] 缓存 `toggleFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = toggleFocused;
    // $[22] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[22];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:yes", t8, t9);
  // t10 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== lastToggleIndex) {
    // t10 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t10 = () => {
      // setFocusedToggle 写入新的状态值，使终端渲染后续读取保持一致。
      setFocusedToggle(prev => prev !== null && prev < lastToggleIndex ? prev + 1 : null);
    };
    // $[23] 缓存 `lastToggleIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = lastToggleIndex;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // t11 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== toggleFocused) {
    // t11 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t11 = {
      context: "Select",
      isActive: toggleFocused
    };
    // $[25] 缓存 `toggleFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = toggleFocused;
    // $[26] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[26];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("select:next", t10, t11);
  // t12 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = () => {
      // setFocusedToggle 写入新的状态值，使终端渲染后续读取保持一致。
      setFocusedToggle(_temp7);
    };
    // $[27] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[27];
  }
  // t13 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== toggleFocused) {
    // t13 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t13 = {
      context: "Select",
      isActive: toggleFocused
    };
    // $[28] 缓存 `toggleFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = toggleFocused;
    // $[29] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[29];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("select:previous", t12, t13);
  // t14标记终端 UI Memory File Selector是否启用对应路径。
  const t14 = focusedToggle === 0;
  // t15保存`autoMemoryOn ? "on" : "off"`，供后续判断或组装使用。
  const t15 = autoMemoryOn ? "on" : "off";
  // t16 暂存 `<Text>Auto-memory: {t15}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== t15) {
    // t16 暂存 `<Text>Auto-memory: {t15}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Text>Auto-memory: {t15}</Text>;
    // $[30] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t15;
    // $[31] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[31];
  }
  // t17 暂存 `<ListItem isFocused={t14}>{t16}</ListItem>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== t14 || $[33] !== t16) {
    // t17 暂存 `<ListItem isFocused={t14}>{t16}</ListItem>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <ListItem isFocused={t14}>{t16}</ListItem>;
    // $[32] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t14;
    // $[33] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t16;
    // $[34] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[34];
  }
  // t18 暂存 `showDreamRow && <ListItem isFocused={focusedToggle === 1}...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== autoDreamOn || $[36] !== dreamStatus || $[37] !== focusedToggle || $[38] !== isDreamRunning || $[39] !== showDreamRow) {
    // t18 暂存 `showDreamRow && <ListItem isFocused={focusedToggle === 1}...` 生成的渲染片段，后续返回路径直接复用。
    t18 = showDreamRow && <ListItem isFocused={focusedToggle === 1} styled={false}><Text color={focusedToggle === 1 ? "suggestion" : undefined}>Auto-dream: {autoDreamOn ? "on" : "off"}{dreamStatus && <Text dimColor={true}> · {dreamStatus}</Text>}{!isDreamRunning && autoDreamOn && <Text dimColor={true}> · /dream to run</Text>}</Text></ListItem>;
    // $[35] 缓存 `autoDreamOn`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = autoDreamOn;
    // $[36] 缓存 `dreamStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = dreamStatus;
    // $[37] 缓存 `focusedToggle`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = focusedToggle;
    // $[38] 缓存 `isDreamRunning`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = isDreamRunning;
    // $[39] 缓存 `showDreamRow`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = showDreamRow;
    // $[40] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[40] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[40];
  }
  // t19 暂存 `<Box flexDirection="column" marginBottom={1}>{t17}{t18}</...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[41] !== t17 || $[42] !== t18) {
    // t19 暂存 `<Box flexDirection="column" marginBottom={1}>{t17}{t18}</...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Box flexDirection="column" marginBottom={1}>{t17}{t18}</Box>;
    // $[41] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t17;
    // $[42] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t18;
    // $[43] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[43];
  }
  // t20 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[44] !== onSelect) {
    // t20 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
    t20 = value => {
      // 满足 `value.startsWith(OPEN_FOLDER_PREFIX)` 时，终端渲染执行该分支。
      if (value.startsWith(OPEN_FOLDER_PREFIX)) {
        // folderPath 路径数据格式化`value.slice`，供终端渲染后续处理使用。
        const folderPath = value.slice(OPEN_FOLDER_PREFIX.length);
        // 调用 mkdir，触发终端渲染此处需要的副作用。
        mkdir(folderPath, {
          recursive: true
        // 这个回调绑定到 }).catch(_temp8).then(() => openPath(folderPath));，负责终端渲染在该局部场景下的响应。
        }).catch(_temp8).then(() => openPath(folderPath));
        // 终端 UI 组件 Memory File Selector在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // lastSelectedPath 路径数据更新为 `value`，确保终端 UI后续读取最新状态。
      lastSelectedPath = value;
      // 调用 onSelect，触发终端渲染此处需要的副作用。
      onSelect(value);
    };
    // $[44] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = onSelect;
    // $[45] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[45];
  }
  // t21 暂存 `() => setFocusedToggle(lastToggleIndex)` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[46] !== lastToggleIndex) {
    // t21 暂存 `() => setFocusedToggle(lastToggleIndex)` 生成的渲染片段，后续返回路径直接复用。
    t21 = () => setFocusedToggle(lastToggleIndex);
    // $[46] 缓存 `lastToggleIndex`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = lastToggleIndex;
    // $[47] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[47];
  }
  // t22 暂存 `<Select defaultFocusValue={initialPath} options={memoryOp...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[48] !== initialPath || $[49] !== memoryOptions || $[50] !== onCancel || $[51] !== t20 || $[52] !== t21 || $[53] !== toggleFocused) {
    // t22 暂存 `<Select defaultFocusValue={initialPath} options={memoryOp...` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Select defaultFocusValue={initialPath} options={memoryOptions} isDisabled={toggleFocused} onChange={t20} onCancel={onCancel} onUpFromFirstItem={t21} />;
    // $[48] 缓存 `initialPath`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = initialPath;
    // $[49] 缓存 `memoryOptions`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = memoryOptions;
    // $[50] 缓存 `onCancel`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = onCancel;
    // $[51] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t20;
    // $[52] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t21;
    // $[53] 缓存 `toggleFocused`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = toggleFocused;
    // $[54] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[54] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[54];
  }
  // t23 暂存 `<Box flexDirection="column" width="100%">{t19}{t22}</Box>` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[55] !== t19 || $[56] !== t22) {
    // t23 暂存 `<Box flexDirection="column" width="100%">{t19}{t22}</Box>` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Box flexDirection="column" width="100%">{t19}{t22}</Box>;
    // $[55] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t19;
    // $[56] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t22;
    // $[57] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[57];
  }
  // 返回 `t23`，作为终端渲染这次计算的结果。
  return t23;
}
// _temp8 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8() {}
// _temp7 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(prev_0) {
  // 返回 `prev_0 !== null && prev_0 > 0 ? prev_0 - 1 : prev_0`，作为终端渲染这次计算的结果。
  return prev_0 !== null && prev_0 > 0 ? prev_0 - 1 : prev_0;
}
// _temp6 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(s_0) {
  // 返回 `Object.values(s_0.tasks).some(_temp5)`，作为终端渲染这次计算的结果。
  return Object.values(s_0.tasks).some(_temp5);
}
// _temp5 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(t) {
  // 返回 `t.type === "dream" && t.status === "running"`，作为终端渲染这次计算的结果。
  return t.type === "dream" && t.status === "running";
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(opt) {
  // 返回 `opt.value === lastSelectedPath`，作为终端渲染这次计算的结果。
  return opt.value === lastSelectedPath;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(s) {
  // 返回 `s.agentDefinitions`，作为终端渲染这次计算的结果。
  return s.agentDefinitions;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(f_2) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...f_2,
    exists: true
  };
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(f_1) {
  // 返回 `f_1.type !== "AutoMem" && f_1.type !== "TeamMem"`，作为终端渲染这次计算的结果。
  return f_1.type !== "AutoMem" && f_1.type !== "TeamMem";
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiY2hhbGsiLCJta2RpciIsImpvaW4iLCJSZWFjdCIsInVzZSIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiZ2V0T3JpZ2luYWxDd2QiLCJ1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MiLCJCb3giLCJUZXh0IiwidXNlS2V5YmluZGluZyIsImdldEF1dG9NZW1QYXRoIiwiaXNBdXRvTWVtb3J5RW5hYmxlZCIsImxvZ0V2ZW50IiwiaXNBdXRvRHJlYW1FbmFibGVkIiwicmVhZExhc3RDb25zb2xpZGF0ZWRBdCIsInVzZUFwcFN0YXRlIiwiZ2V0QWdlbnRNZW1vcnlEaXIiLCJvcGVuUGF0aCIsImdldE1lbW9yeUZpbGVzIiwiTWVtb3J5RmlsZUluZm8iLCJnZXRDbGF1ZGVDb25maWdIb21lRGlyIiwiZ2V0RGlzcGxheVBhdGgiLCJmb3JtYXRSZWxhdGl2ZVRpbWVBZ28iLCJwcm9qZWN0SXNJbkdpdFJlcG8iLCJ1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSIsIlNlbGVjdCIsIkxpc3RJdGVtIiwidGVhbU1lbVBhdGhzIiwicmVxdWlyZSIsIkV4dGVuZGVkTWVtb3J5RmlsZUluZm8iLCJpc05lc3RlZCIsImV4aXN0cyIsImxhc3RTZWxlY3RlZFBhdGgiLCJPUEVOX0ZPTERFUl9QUkVGSVgiLCJQcm9wcyIsIm9uU2VsZWN0IiwicGF0aCIsIm9uQ2FuY2VsIiwiTWVtb3J5RmlsZVNlbGVjdG9yIiwidDAiLCIkIiwiX2MiLCJleGlzdGluZ01lbW9yeUZpbGVzIiwidXNlck1lbW9yeVBhdGgiLCJwcm9qZWN0TWVtb3J5UGF0aCIsImhhc1VzZXJNZW1vcnkiLCJzb21lIiwiZiIsImhhc1Byb2plY3RNZW1vcnkiLCJmXzAiLCJhbGxNZW1vcnlGaWxlcyIsImZpbHRlciIsIl90ZW1wIiwibWFwIiwiX3RlbXAyIiwidHlwZSIsImNvbnN0IiwiY29udGVudCIsImRlcHRocyIsIk1hcCIsIm1lbW9yeU9wdGlvbnMiLCJmaWxlIiwiZGlzcGxheVBhdGgiLCJleGlzdHNMYWJlbCIsImRlcHRoIiwicGFyZW50IiwiZ2V0Iiwic2V0IiwiaW5kZW50IiwicmVwZWF0IiwibGFiZWwiLCJkZXNjcmlwdGlvbiIsImlzR2l0IiwidmFsdWUiLCJmb2xkZXJPcHRpb25zIiwiYWdlbnREZWZpbml0aW9ucyIsIl90ZW1wMyIsInQxIiwiU3ltYm9sIiwiZm9yIiwicHVzaCIsImlzVGVhbU1lbW9yeUVuYWJsZWQiLCJ0MiIsImdldFRlYW1NZW1QYXRoIiwiYWdlbnQiLCJhY3RpdmVBZ2VudHMiLCJtZW1vcnkiLCJhZ2VudERpciIsImFnZW50VHlwZSIsImJvbGQiLCJfdGVtcDQiLCJpbml0aWFsUGF0aCIsImF1dG9NZW1vcnlPbiIsInNldEF1dG9NZW1vcnlPbiIsImF1dG9EcmVhbU9uIiwic2V0QXV0b0RyZWFtT24iLCJzaG93RHJlYW1Sb3ciLCJpc0RyZWFtUnVubmluZyIsIl90ZW1wNiIsImxhc3REcmVhbUF0Iiwic2V0TGFzdERyZWFtQXQiLCJ0aGVuIiwidDMiLCJ0NCIsIkRhdGUiLCJkcmVhbVN0YXR1cyIsImZvY3VzZWRUb2dnbGUiLCJzZXRGb2N1c2VkVG9nZ2xlIiwidG9nZ2xlRm9jdXNlZCIsImxhc3RUb2dnbGVJbmRleCIsInQ1IiwiaGFuZGxlVG9nZ2xlQXV0b01lbW9yeSIsIm5ld1ZhbHVlIiwiYXV0b01lbW9yeUVuYWJsZWQiLCJlbmFibGVkIiwidDYiLCJoYW5kbGVUb2dnbGVBdXRvRHJlYW0iLCJuZXdWYWx1ZV8wIiwiYXV0b0RyZWFtRW5hYmxlZCIsInQ3IiwiY29udGV4dCIsInQ4IiwidDkiLCJpc0FjdGl2ZSIsInQxMCIsInByZXYiLCJ0MTEiLCJ0MTIiLCJfdGVtcDciLCJ0MTMiLCJ0MTQiLCJ0MTUiLCJ0MTYiLCJ0MTciLCJ0MTgiLCJ1bmRlZmluZWQiLCJ0MTkiLCJ0MjAiLCJzdGFydHNXaXRoIiwiZm9sZGVyUGF0aCIsInNsaWNlIiwibGVuZ3RoIiwicmVjdXJzaXZlIiwiY2F0Y2giLCJfdGVtcDgiLCJ0MjEiLCJ0MjIiLCJ0MjMiLCJwcmV2XzAiLCJzXzAiLCJPYmplY3QiLCJ2YWx1ZXMiLCJzIiwidGFza3MiLCJfdGVtcDUiLCJ0Iiwic3RhdHVzIiwib3B0IiwiZl8yIiwiZl8xIl0sInNvdXJjZXMiOlsiTWVtb3J5RmlsZVNlbGVjdG9yLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmZWF0dXJlIH0gZnJvbSAnYnVuOmJ1bmRsZSdcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsaydcbmltcG9ydCB7IG1rZGlyIH0gZnJvbSAnZnMvcHJvbWlzZXMnXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCdcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBnZXRPcmlnaW5hbEN3ZCB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB7IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncy5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHsgZ2V0QXV0b01lbVBhdGgsIGlzQXV0b01lbW9yeUVuYWJsZWQgfSBmcm9tICcuLi8uLi9tZW1kaXIvcGF0aHMuanMnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IGlzQXV0b0RyZWFtRW5hYmxlZCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2F1dG9EcmVhbS9jb25maWcuanMnXG5pbXBvcnQgeyByZWFkTGFzdENvbnNvbGlkYXRlZEF0IH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXV0b0RyZWFtL2NvbnNvbGlkYXRpb25Mb2NrLmpzJ1xuaW1wb3J0IHsgdXNlQXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IGdldEFnZW50TWVtb3J5RGlyIH0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50TWVtb3J5LmpzJ1xuaW1wb3J0IHsgb3BlblBhdGggfSBmcm9tICcuLi8uLi91dGlscy9icm93c2VyLmpzJ1xuaW1wb3J0IHsgZ2V0TWVtb3J5RmlsZXMsIHR5cGUgTWVtb3J5RmlsZUluZm8gfSBmcm9tICcuLi8uLi91dGlscy9jbGF1ZGVtZC5qcydcbmltcG9ydCB7IGdldENsYXVkZUNvbmZpZ0hvbWVEaXIgfSBmcm9tICcuLi8uLi91dGlscy9lbnZVdGlscy5qcydcbmltcG9ydCB7IGdldERpc3BsYXlQYXRoIH0gZnJvbSAnLi4vLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7IGZvcm1hdFJlbGF0aXZlVGltZUFnbyB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB7IHByb2plY3RJc0luR2l0UmVwbyB9IGZyb20gJy4uLy4uL3V0aWxzL21lbW9yeS92ZXJzaW9ucy5qcydcbmltcG9ydCB7IHVwZGF0ZVNldHRpbmdzRm9yU291cmNlIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3QvaW5kZXguanMnXG5pbXBvcnQgeyBMaXN0SXRlbSB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vTGlzdEl0ZW0uanMnXG5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMgKi9cbmNvbnN0IHRlYW1NZW1QYXRocyA9IGZlYXR1cmUoJ1RFQU1NRU0nKVxuICA/IChyZXF1aXJlKCcuLi8uLi9tZW1kaXIvdGVhbU1lbVBhdGhzLmpzJykgYXMgdHlwZW9mIGltcG9ydCgnLi4vLi4vbWVtZGlyL3RlYW1NZW1QYXRocy5qcycpKVxuICA6IG51bGxcbi8qIGVzbGludC1lbmFibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0cyAqL1xuXG5pbnRlcmZhY2UgRXh0ZW5kZWRNZW1vcnlGaWxlSW5mbyBleHRlbmRzIE1lbW9yeUZpbGVJbmZvIHtcbiAgaXNOZXN0ZWQ/OiBib29sZWFuXG4gIGV4aXN0czogYm9vbGVhblxufVxuXG4vLyBSZW1lbWJlciBsYXN0IHNlbGVjdGVkIHBhdGhcbmxldCBsYXN0U2VsZWN0ZWRQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWRcblxuY29uc3QgT1BFTl9GT0xERVJfUFJFRklYID0gJ19fb3Blbl9mb2xkZXJfXydcblxudHlwZSBQcm9wcyA9IHtcbiAgb25TZWxlY3Q6IChwYXRoOiBzdHJpbmcpID0+IHZvaWRcbiAgb25DYW5jZWw6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1lbW9yeUZpbGVTZWxlY3Rvcih7XG4gIG9uU2VsZWN0LFxuICBvbkNhbmNlbCxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgZXhpc3RpbmdNZW1vcnlGaWxlcyA9IHVzZShnZXRNZW1vcnlGaWxlcygpKVxuXG4gIC8vIENyZWF0ZSBlbnRyaWVzIGZvciBVc2VyIGFuZCBQcm9qZWN0IENMQVVERS5tZCBldmVuIGlmIHRoZXkgZG9uJ3QgZXhpc3RcbiAgY29uc3QgdXNlck1lbW9yeVBhdGggPSBqb2luKGdldENsYXVkZUNvbmZpZ0hvbWVEaXIoKSwgJ0NMQVVERS5tZCcpXG4gIGNvbnN0IHByb2plY3RNZW1vcnlQYXRoID0gam9pbihnZXRPcmlnaW5hbEN3ZCgpLCAnQ0xBVURFLm1kJylcblxuICAvLyBDaGVjayBpZiB0aGVzZSBhcmUgYWxyZWFkeSBpbiB0aGUgZXhpc3RpbmcgZmlsZXNcbiAgY29uc3QgaGFzVXNlck1lbW9yeSA9IGV4aXN0aW5nTWVtb3J5RmlsZXMuc29tZShmID0+IGYucGF0aCA9PT0gdXNlck1lbW9yeVBhdGgpXG4gIGNvbnN0IGhhc1Byb2plY3RNZW1vcnkgPSBleGlzdGluZ01lbW9yeUZpbGVzLnNvbWUoXG4gICAgZiA9PiBmLnBhdGggPT09IHByb2plY3RNZW1vcnlQYXRoLFxuICApXG5cbiAgLy8gRmlsdGVyIG91dCBBdXRvTWVtL1RlYW1NZW0gZW50cnlwb2ludHM6IHRoZXNlIGFyZSBNRU1PUlkubWQgZmlsZXMsIGFuZFxuICAvLyAvbWVtb3J5IGFscmVhZHkgc3VyZmFjZXMgXCJPcGVuIGF1dG8tbWVtb3J5IGZvbGRlclwiIC8gXCJPcGVuIHRlYW0gbWVtb3J5XG4gIC8vIGZvbGRlclwiIG9wdGlvbnMgYmVsb3cuIExpc3RpbmcgdGhlIGVudHJ5cG9pbnQgZmlsZSBzZXBhcmF0ZWx5IGlzIHJlZHVuZGFudC5cbiAgY29uc3QgYWxsTWVtb3J5RmlsZXM6IEV4dGVuZGVkTWVtb3J5RmlsZUluZm9bXSA9IFtcbiAgICAuLi5leGlzdGluZ01lbW9yeUZpbGVzXG4gICAgICAuZmlsdGVyKGYgPT4gZi50eXBlICE9PSAnQXV0b01lbScgJiYgZi50eXBlICE9PSAnVGVhbU1lbScpXG4gICAgICAubWFwKGYgPT4gKHsgLi4uZiwgZXhpc3RzOiB0cnVlIH0pKSxcbiAgICAvLyBBZGQgVXNlciBtZW1vcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIC4uLihoYXNVc2VyTWVtb3J5XG4gICAgICA/IFtdXG4gICAgICA6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwYXRoOiB1c2VyTWVtb3J5UGF0aCxcbiAgICAgICAgICAgIHR5cGU6ICdVc2VyJyBhcyBjb25zdCxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICcnLFxuICAgICAgICAgICAgZXhpc3RzOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdKSxcbiAgICAvLyBBZGQgUHJvamVjdCBtZW1vcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIC4uLihoYXNQcm9qZWN0TWVtb3J5XG4gICAgICA/IFtdXG4gICAgICA6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwYXRoOiBwcm9qZWN0TWVtb3J5UGF0aCxcbiAgICAgICAgICAgIHR5cGU6ICdQcm9qZWN0JyBhcyBjb25zdCxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICcnLFxuICAgICAgICAgICAgZXhpc3RzOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdKSxcbiAgXVxuXG4gIGNvbnN0IGRlcHRocyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KClcblxuICAvLyBDcmVhdGUgb3B0aW9ucyBmb3IgdGhlIHNlbGVjdCBjb21wb25lbnRcbiAgY29uc3QgbWVtb3J5T3B0aW9ucyA9IGFsbE1lbW9yeUZpbGVzLm1hcChmaWxlID0+IHtcbiAgICBjb25zdCBkaXNwbGF5UGF0aCA9IGdldERpc3BsYXlQYXRoKGZpbGUucGF0aClcbiAgICBjb25zdCBleGlzdHNMYWJlbCA9IGZpbGUuZXhpc3RzID8gJycgOiAnIChuZXcpJ1xuXG4gICAgLy8gQ2FsY3VsYXRlIGRlcHRoIGJhc2VkIG9uIHBhcmVudFxuICAgIGNvbnN0IGRlcHRoID0gZmlsZS5wYXJlbnQgPyAoZGVwdGhzLmdldChmaWxlLnBhcmVudCkgPz8gMCkgKyAxIDogMFxuICAgIGRlcHRocy5zZXQoZmlsZS5wYXRoLCBkZXB0aClcbiAgICBjb25zdCBpbmRlbnQgPSBkZXB0aCA+IDAgPyAnICAnLnJlcGVhdChkZXB0aCAtIDEpIDogJydcblxuICAgIC8vIEZvcm1hdCBsYWJlbCBiYXNlZCBvbiB0eXBlXG4gICAgbGV0IGxhYmVsOiBzdHJpbmdcbiAgICBpZiAoXG4gICAgICBmaWxlLnR5cGUgPT09ICdVc2VyJyAmJlxuICAgICAgIWZpbGUuaXNOZXN0ZWQgJiZcbiAgICAgIGZpbGUucGF0aCA9PT0gdXNlck1lbW9yeVBhdGhcbiAgICApIHtcbiAgICAgIGxhYmVsID0gYFVzZXIgbWVtb3J5YFxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBmaWxlLnR5cGUgPT09ICdQcm9qZWN0JyAmJlxuICAgICAgIWZpbGUuaXNOZXN0ZWQgJiZcbiAgICAgIGZpbGUucGF0aCA9PT0gcHJvamVjdE1lbW9yeVBhdGhcbiAgICApIHtcbiAgICAgIGxhYmVsID0gYFByb2plY3QgbWVtb3J5YFxuICAgIH0gZWxzZSBpZiAoZGVwdGggPiAwKSB7XG4gICAgICAvLyBGb3IgY2hpbGQgbm9kZXMgKGltcG9ydGVkIGZpbGVzKSwgc2hvdyBpbmRlbnRlZCB3aXRoIExcbiAgICAgIGxhYmVsID0gYCR7aW5kZW50fUwgJHtkaXNwbGF5UGF0aH0ke2V4aXN0c0xhYmVsfWBcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9yIG90aGVyIG1lbW9yeSBmaWxlcywganVzdCBzaG93IHRoZSBwYXRoXG4gICAgICBsYWJlbCA9IGAke2Rpc3BsYXlQYXRofWBcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgZGVzY3JpcHRpb24gYmFzZWQgb24gdHlwZSAtIGtlZXAgdGhlIG9yaWdpbmFsIGRlc2NyaXB0aW9ucyBmb3IgYnVpbHQtaW4gdHlwZXNcbiAgICBsZXQgZGVzY3JpcHRpb246IHN0cmluZ1xuICAgIGNvbnN0IGlzR2l0ID0gcHJvamVjdElzSW5HaXRSZXBvKGdldE9yaWdpbmFsQ3dkKCkpXG5cbiAgICBpZiAoZmlsZS50eXBlID09PSAnVXNlcicgJiYgIWZpbGUuaXNOZXN0ZWQpIHtcbiAgICAgIGRlc2NyaXB0aW9uID0gJ1NhdmVkIGluIH4vLmNsYXVkZS9DTEFVREUubWQnXG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGZpbGUudHlwZSA9PT0gJ1Byb2plY3QnICYmXG4gICAgICAhZmlsZS5pc05lc3RlZCAmJlxuICAgICAgZmlsZS5wYXRoID09PSBwcm9qZWN0TWVtb3J5UGF0aFxuICAgICkge1xuICAgICAgZGVzY3JpcHRpb24gPSBgJHtpc0dpdCA/ICdDaGVja2VkIGluIGF0JyA6ICdTYXZlZCBpbid9IC4vQ0xBVURFLm1kYFxuICAgIH0gZWxzZSBpZiAoZmlsZS5wYXJlbnQpIHtcbiAgICAgIC8vIEZvciBpbXBvcnRlZCBmaWxlcyAod2l0aCBALWltcG9ydClcbiAgICAgIGRlc2NyaXB0aW9uID0gJ0AtaW1wb3J0ZWQnXG4gICAgfSBlbHNlIGlmIChmaWxlLmlzTmVzdGVkKSB7XG4gICAgICAvLyBGb3IgbmVzdGVkIGZpbGVzIChkeW5hbWljYWxseSBsb2FkZWQpXG4gICAgICBkZXNjcmlwdGlvbiA9ICdkeW5hbWljYWxseSBsb2FkZWQnXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlc2NyaXB0aW9uID0gJydcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGFiZWwsXG4gICAgICB2YWx1ZTogZmlsZS5wYXRoLFxuICAgICAgZGVzY3JpcHRpb24sXG4gICAgfVxuICB9KVxuXG4gIC8vIEFkZCBcIk9wZW4gZm9sZGVyXCIgb3B0aW9ucyBmb3IgYXV0by1tZW1vcnkgYW5kIGFnZW50IG1lbW9yeSBkaXJlY3Rvcmllc1xuICBjb25zdCBmb2xkZXJPcHRpb25zOiBBcnJheTx7XG4gICAgbGFiZWw6IHN0cmluZ1xuICAgIHZhbHVlOiBzdHJpbmdcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nXG4gIH0+ID0gW11cblxuICBjb25zdCBhZ2VudERlZmluaXRpb25zID0gdXNlQXBwU3RhdGUocyA9PiBzLmFnZW50RGVmaW5pdGlvbnMpXG4gIGlmIChpc0F1dG9NZW1vcnlFbmFibGVkKCkpIHtcbiAgICAvLyBBbHdheXMgc2hvdyBhdXRvLW1lbW9yeSBmb2xkZXIgb3B0aW9uXG4gICAgZm9sZGVyT3B0aW9ucy5wdXNoKHtcbiAgICAgIGxhYmVsOiAnT3BlbiBhdXRvLW1lbW9yeSBmb2xkZXInLFxuICAgICAgdmFsdWU6IGAke09QRU5fRk9MREVSX1BSRUZJWH0ke2dldEF1dG9NZW1QYXRoKCl9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICB9KVxuXG4gICAgLy8gVGVhbSBtZW1vcnkgZGlyZWN0bHkgYmVsb3cgYXV0by1tZW1vcnkgKHRlYW0gZGlyIGlzIGEgc3ViZGlyIG9mIGF1dG8gZGlyKVxuICAgIGlmIChmZWF0dXJlKCdURUFNTUVNJykgJiYgdGVhbU1lbVBhdGhzIS5pc1RlYW1NZW1vcnlFbmFibGVkKCkpIHtcbiAgICAgIGZvbGRlck9wdGlvbnMucHVzaCh7XG4gICAgICAgIGxhYmVsOiAnT3BlbiB0ZWFtIG1lbW9yeSBmb2xkZXInLFxuICAgICAgICB2YWx1ZTogYCR7T1BFTl9GT0xERVJfUFJFRklYfSR7dGVhbU1lbVBhdGhzIS5nZXRUZWFtTWVtUGF0aCgpfWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gQWRkIGFnZW50IG1lbW9yeSBmb2xkZXJzIGZvciBhZ2VudHMgdGhhdCBoYXZlIG1lbW9yeSBjb25maWd1cmVkXG4gICAgZm9yIChjb25zdCBhZ2VudCBvZiBhZ2VudERlZmluaXRpb25zLmFjdGl2ZUFnZW50cykge1xuICAgICAgaWYgKGFnZW50Lm1lbW9yeSkge1xuICAgICAgICBjb25zdCBhZ2VudERpciA9IGdldEFnZW50TWVtb3J5RGlyKGFnZW50LmFnZW50VHlwZSwgYWdlbnQubWVtb3J5KVxuICAgICAgICBmb2xkZXJPcHRpb25zLnB1c2goe1xuICAgICAgICAgIGxhYmVsOiBgT3BlbiAke2NoYWxrLmJvbGQoYWdlbnQuYWdlbnRUeXBlKX0gYWdlbnQgbWVtb3J5YCxcbiAgICAgICAgICB2YWx1ZTogYCR7T1BFTl9GT0xERVJfUFJFRklYfSR7YWdlbnREaXJ9YCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7YWdlbnQubWVtb3J5fSBzY29wZWAsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbWVtb3J5T3B0aW9ucy5wdXNoKC4uLmZvbGRlck9wdGlvbnMpXG5cbiAgLy8gSW5pdGlhbGl6ZSB3aXRoIGxhc3Qgc2VsZWN0ZWQgcGF0aCBpZiBpdCdzIHN0aWxsIGluIHRoZSBvcHRpb25zLCBvdGhlcndpc2UgdXNlIGZpcnN0IG9wdGlvblxuICBjb25zdCBpbml0aWFsUGF0aCA9XG4gICAgbGFzdFNlbGVjdGVkUGF0aCAmJlxuICAgIG1lbW9yeU9wdGlvbnMuc29tZShvcHQgPT4gb3B0LnZhbHVlID09PSBsYXN0U2VsZWN0ZWRQYXRoKVxuICAgICAgPyBsYXN0U2VsZWN0ZWRQYXRoXG4gICAgICA6IG1lbW9yeU9wdGlvbnNbMF0/LnZhbHVlIHx8ICcnXG5cbiAgLy8gVG9nZ2xlIHN0YXRlIChsb2NhbCBjb3B5IG9mIHNldHRpbmdzIHNvIHRoZSBVSSB1cGRhdGVzIGltbWVkaWF0ZWx5KVxuICBjb25zdCBbYXV0b01lbW9yeU9uLCBzZXRBdXRvTWVtb3J5T25dID0gdXNlU3RhdGUoaXNBdXRvTWVtb3J5RW5hYmxlZClcbiAgY29uc3QgW2F1dG9EcmVhbU9uLCBzZXRBdXRvRHJlYW1Pbl0gPSB1c2VTdGF0ZShpc0F1dG9EcmVhbUVuYWJsZWQpXG5cbiAgLy8gRHJlYW0gcm93IGlzIG9ubHkgbWVhbmluZ2Z1bCB3aGVuIGF1dG8tbWVtb3J5IGlzIG9uIChkcmVhbSBjb25zb2xpZGF0ZXNcbiAgLy8gdGhhdCBkaXIpLiBTbmFwc2hvdCBhdCBtb3VudCBzbyB0aGUgcm93IGRvZXNuJ3QgdmFuaXNoIG1pZC1uYXZpZ2F0aW9uXG4gIC8vIGlmIHRoZSB1c2VyIHRvZ2dsZXMgYXV0by1tZW1vcnkgb2ZmLlxuICBjb25zdCBbc2hvd0RyZWFtUm93XSA9IHVzZVN0YXRlKGlzQXV0b01lbW9yeUVuYWJsZWQpXG5cbiAgLy8gRHJlYW0gc3RhdHVzOiBwcmVmZXIgbGl2ZSB0YXNrIHN0YXRlICh0aGlzIHNlc3Npb24gZmlyZWQgaXQpLCBmYWxsIGJhY2tcbiAgLy8gdG8gdGhlIGNyb3NzLXByb2Nlc3MgbG9jayBtdGltZS5cbiAgY29uc3QgaXNEcmVhbVJ1bm5pbmcgPSB1c2VBcHBTdGF0ZShzID0+XG4gICAgT2JqZWN0LnZhbHVlcyhzLnRhc2tzKS5zb21lKFxuICAgICAgdCA9PiB0LnR5cGUgPT09ICdkcmVhbScgJiYgdC5zdGF0dXMgPT09ICdydW5uaW5nJyxcbiAgICApLFxuICApXG4gIGNvbnN0IFtsYXN0RHJlYW1BdCwgc2V0TGFzdERyZWFtQXRdID0gdXNlU3RhdGU8bnVtYmVyIHwgbnVsbD4obnVsbClcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXNob3dEcmVhbVJvdykgcmV0dXJuXG4gICAgdm9pZCByZWFkTGFzdENvbnNvbGlkYXRlZEF0KCkudGhlbihzZXRMYXN0RHJlYW1BdClcbiAgfSwgW3Nob3dEcmVhbVJvdywgaXNEcmVhbVJ1bm5pbmddKVxuXG4gIGNvbnN0IGRyZWFtU3RhdHVzID0gaXNEcmVhbVJ1bm5pbmdcbiAgICA/ICdydW5uaW5nJ1xuICAgIDogbGFzdERyZWFtQXQgPT09IG51bGxcbiAgICAgID8gJycgLy8gc3RhdCBpbiBmbGlnaHRcbiAgICAgIDogbGFzdERyZWFtQXQgPT09IDBcbiAgICAgICAgPyAnbmV2ZXInXG4gICAgICAgIDogYGxhc3QgcmFuICR7Zm9ybWF0UmVsYXRpdmVUaW1lQWdvKG5ldyBEYXRlKGxhc3REcmVhbUF0KSl9YFxuXG4gIC8vIG51bGwgPSBTZWxlY3QgaGFzIGZvY3VzLCAwID0gYXV0by1tZW1vcnksIDEgPSBhdXRvLWRyZWFtIChpZiBzaG93RHJlYW1Sb3cpXG4gIGNvbnN0IFtmb2N1c2VkVG9nZ2xlLCBzZXRGb2N1c2VkVG9nZ2xlXSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpXG4gIGNvbnN0IHRvZ2dsZUZvY3VzZWQgPSBmb2N1c2VkVG9nZ2xlICE9PSBudWxsXG4gIGNvbnN0IGxhc3RUb2dnbGVJbmRleCA9IHNob3dEcmVhbVJvdyA/IDEgOiAwXG5cbiAgZnVuY3Rpb24gaGFuZGxlVG9nZ2xlQXV0b01lbW9yeSgpOiB2b2lkIHtcbiAgICBjb25zdCBuZXdWYWx1ZSA9ICFhdXRvTWVtb3J5T25cbiAgICB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSgndXNlclNldHRpbmdzJywgeyBhdXRvTWVtb3J5RW5hYmxlZDogbmV3VmFsdWUgfSlcbiAgICBzZXRBdXRvTWVtb3J5T24obmV3VmFsdWUpXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2F1dG9fbWVtb3J5X3RvZ2dsZWQnLCB7IGVuYWJsZWQ6IG5ld1ZhbHVlIH0pXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVUb2dnbGVBdXRvRHJlYW0oKTogdm9pZCB7XG4gICAgY29uc3QgbmV3VmFsdWUgPSAhYXV0b0RyZWFtT25cbiAgICB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSgndXNlclNldHRpbmdzJywgeyBhdXRvRHJlYW1FbmFibGVkOiBuZXdWYWx1ZSB9KVxuICAgIHNldEF1dG9EcmVhbU9uKG5ld1ZhbHVlKVxuICAgIGxvZ0V2ZW50KCd0ZW5ndV9hdXRvX2RyZWFtX3RvZ2dsZWQnLCB7IGVuYWJsZWQ6IG5ld1ZhbHVlIH0pXG4gIH1cblxuICB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuXG4gIHVzZUtleWJpbmRpbmcoJ2NvbmZpcm06bm8nLCBvbkNhbmNlbCwgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJyB9KVxuXG4gIHVzZUtleWJpbmRpbmcoXG4gICAgJ2NvbmZpcm06eWVzJyxcbiAgICAoKSA9PiB7XG4gICAgICBpZiAoZm9jdXNlZFRvZ2dsZSA9PT0gMCkgaGFuZGxlVG9nZ2xlQXV0b01lbW9yeSgpXG4gICAgICBlbHNlIGlmIChmb2N1c2VkVG9nZ2xlID09PSAxKSBoYW5kbGVUb2dnbGVBdXRvRHJlYW0oKVxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnQ29uZmlybWF0aW9uJywgaXNBY3RpdmU6IHRvZ2dsZUZvY3VzZWQgfSxcbiAgKVxuICB1c2VLZXliaW5kaW5nKFxuICAgICdzZWxlY3Q6bmV4dCcsXG4gICAgKCkgPT4ge1xuICAgICAgc2V0Rm9jdXNlZFRvZ2dsZShwcmV2ID0+XG4gICAgICAgIHByZXYgIT09IG51bGwgJiYgcHJldiA8IGxhc3RUb2dnbGVJbmRleCA/IHByZXYgKyAxIDogbnVsbCxcbiAgICAgIClcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ1NlbGVjdCcsIGlzQWN0aXZlOiB0b2dnbGVGb2N1c2VkIH0sXG4gIClcbiAgdXNlS2V5YmluZGluZyhcbiAgICAnc2VsZWN0OnByZXZpb3VzJyxcbiAgICAoKSA9PiB7XG4gICAgICBzZXRGb2N1c2VkVG9nZ2xlKHByZXYgPT4gKHByZXYgIT09IG51bGwgJiYgcHJldiA+IDAgPyBwcmV2IC0gMSA6IHByZXYpKVxuICAgIH0sXG4gICAgeyBjb250ZXh0OiAnU2VsZWN0JywgaXNBY3RpdmU6IHRvZ2dsZUZvY3VzZWQgfSxcbiAgKVxuXG4gIHJldHVybiAoXG4gICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgd2lkdGg9XCIxMDAlXCI+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICA8TGlzdEl0ZW0gaXNGb2N1c2VkPXtmb2N1c2VkVG9nZ2xlID09PSAwfT5cbiAgICAgICAgICA8VGV4dD5BdXRvLW1lbW9yeToge2F1dG9NZW1vcnlPbiA/ICdvbicgOiAnb2ZmJ308L1RleHQ+XG4gICAgICAgIDwvTGlzdEl0ZW0+XG4gICAgICAgIHtzaG93RHJlYW1Sb3cgJiYgKFxuICAgICAgICAgIDxMaXN0SXRlbSBpc0ZvY3VzZWQ9e2ZvY3VzZWRUb2dnbGUgPT09IDF9IHN0eWxlZD17ZmFsc2V9PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9e2ZvY3VzZWRUb2dnbGUgPT09IDEgPyAnc3VnZ2VzdGlvbicgOiB1bmRlZmluZWR9PlxuICAgICAgICAgICAgICBBdXRvLWRyZWFtOiB7YXV0b0RyZWFtT24gPyAnb24nIDogJ29mZid9XG4gICAgICAgICAgICAgIHtkcmVhbVN0YXR1cyAmJiA8VGV4dCBkaW1Db2xvcj4gwrcge2RyZWFtU3RhdHVzfTwvVGV4dD59XG4gICAgICAgICAgICAgIHshaXNEcmVhbVJ1bm5pbmcgJiYgYXV0b0RyZWFtT24gJiYgKFxuICAgICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPiDCtyAvZHJlYW0gdG8gcnVuPC9UZXh0PlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvTGlzdEl0ZW0+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cblxuICAgICAgPFNlbGVjdFxuICAgICAgICBkZWZhdWx0Rm9jdXNWYWx1ZT17aW5pdGlhbFBhdGh9XG4gICAgICAgIG9wdGlvbnM9e21lbW9yeU9wdGlvbnN9XG4gICAgICAgIGlzRGlzYWJsZWQ9e3RvZ2dsZUZvY3VzZWR9XG4gICAgICAgIG9uQ2hhbmdlPXt2YWx1ZSA9PiB7XG4gICAgICAgICAgaWYgKHZhbHVlLnN0YXJ0c1dpdGgoT1BFTl9GT0xERVJfUFJFRklYKSkge1xuICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IHZhbHVlLnNsaWNlKE9QRU5fRk9MREVSX1BSRUZJWC5sZW5ndGgpXG4gICAgICAgICAgICAvLyBFbnN1cmUgZm9sZGVyIGV4aXN0cyBiZWZvcmUgb3BlbmluZyAoaWRlbXBvdGVudDsgc3dhbGxvd1xuICAgICAgICAgICAgLy8gcGVybWlzc2lvbiBlcnJvcnMgdG8gbWF0Y2ggcHJldmlvdXMgYmVoYXZpb3IpXG4gICAgICAgICAgICB2b2lkIG1rZGlyKGZvbGRlclBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pXG4gICAgICAgICAgICAgIC5jYXRjaCgoKSA9PiB7fSlcbiAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gb3BlblBhdGgoZm9sZGVyUGF0aCkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgbGFzdFNlbGVjdGVkUGF0aCA9IHZhbHVlIC8vIFJlbWVtYmVyIHRoZSBzZWxlY3Rpb25cbiAgICAgICAgICBvblNlbGVjdCh2YWx1ZSlcbiAgICAgICAgfX1cbiAgICAgICAgb25DYW5jZWw9e29uQ2FuY2VsfVxuICAgICAgICBvblVwRnJvbUZpcnN0SXRlbT17KCkgPT4gc2V0Rm9jdXNlZFRvZ2dsZShsYXN0VG9nZ2xlSW5kZXgpfVxuICAgICAgLz5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsT0FBTyxRQUFRLFlBQVk7QUFDcEMsT0FBT0MsS0FBSyxNQUFNLE9BQU87QUFDekIsU0FBU0MsS0FBSyxRQUFRLGFB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QXBFLENBQUEsT0FBQTBHLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUExRyxDQUFBO0VBQUE7RUFBQSxJQUFBMkcsR0FBQTtFQUFBLElBQUEzRyxDQUFBLFNBQUFnRyxHQUFBLElBQUFoRyxDQUFBLFNBQUEwRyxHQUFBO0lBckNKQyxHQUFBLElBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQU8sS0FBTSxDQUFOLE1BQU0sQ0FDdEMsQ0FBQVgsR0FlSyxDQUVMLENBQUFVLEdBbUJDLENBQ0gsRUF0Q0MsR0FBRyxDQXNDRTtJQUFBMUcsQ0FBQSxPQUFBZ0csR0FBQTtJQUFBaEcsQ0FBQSxPQUFBMEcsR0FBQTtJQUFBMUcsQ0FBQSxPQUFBMkcsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTNHLENBQUE7RUFBQTtFQUFBLE9BdENOMkcsR0FzQ007QUFBQTtBQWxSSCxTQUFBSCxPQUFBO0FBQUEsU0FBQWhCLE9BQUFvQixNQUFBO0VBQUEsT0FzT3lCdkIsTUFBSSxLQUFLLElBQWdCLElBQVJBLE1BQUksR0FBRyxDQUFtQixHQUFmQSxNQUFJLEdBQUcsQ0FBUSxHQUEzQ3VCLE1BQTJDO0FBQUE7QUF0T3BFLFNBQUFsRCxPQUFBbUQsR0FBQTtFQUFBLE9BeUtIQyxNQUFNLENBQUFDLE1BQU8sQ0FBQ0MsR0FBQyxDQUFBQyxLQUFNLENBQUMsQ0FBQTNHLElBQUssQ0FDekI0RyxNQUNGLENBQUM7QUFBQTtBQTNLRSxTQUFBQSxPQUFBQyxDQUFBO0VBQUEsT0EwS0lBLENBQUMsQ0FBQXBHLElBQUssS0FBSyxPQUFpQyxJQUF0Qm9HLENBQUMsQ0FBQUMsTUFBTyxLQUFLLFNBQVM7QUFBQTtBQTFLaEQsU0FBQWxFLE9BQUFtRSxHQUFBO0VBQUEsT0F5SnVCQSxHQUFHLENBQUFwRixLQUFNLEtBQUt6QyxnQkFBZ0I7QUFBQTtBQXpKckQsU0FBQTRDLE9BQUE0RSxDQUFBO0VBQUEsT0FxSHFDQSxDQUFDLENBQUE3RSxnQkFBaUI7QUFBQTtBQXJIdkQsU0FBQXJCLE9BQUF3RyxHQUFBO0VBQUEsT0FzQlU7SUFBQSxHQUFLL0csR0FBQztJQUFBaEIsTUFBQSxFQUFVO0VBQUssQ0FBQztBQUFBO0FBdEJoQyxTQUFBcUIsTUFBQTJHLEdBQUE7RUFBQSxPQXFCWWhILEdBQUMsQ0FBQVEsSUFBSyxLQUFLLFNBQWlDLElBQXBCUixHQUFDLENBQUFRLElBQUssS0FBSyxTQUFTO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=