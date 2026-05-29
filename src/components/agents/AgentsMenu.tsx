// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useMemo, useState } from 'react';
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js';
// 类型依赖 { CommandResultDisplay } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../../commands.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 useMergedTools，将 ../../hooks/useMergedTools.js 中已经封装好的能力接到本文件流程里。
import { useMergedTools } from '../../hooks/useMergedTools.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useAppState、useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from '../../state/AppState.js';
// 类型依赖 { Tools } 来自 ../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../Tool.js';
// 接入 ResolvedAgent、resolveAgentOverrides 工具实现，后续工具池会按权限和开关决定是否暴露。
import { type ResolvedAgent, resolveAgentOverrides } from '../../tools/AgentTool/agentDisplay.js';
// 接入 AgentDefinition、getActiveAgentsFromList 工具实现，后续工具池会按权限和开关决定是否暴露。
import { type AgentDefinition, getActiveAgentsFromList } from '../../tools/AgentTool/loadAgentsDir.js';
// 复用 toError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { toError } from '../../utils/errors.js';
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 AgentDetail，将 ./AgentDetail.js 中已经封装好的能力接到本文件流程里。
import { AgentDetail } from './AgentDetail.js';
// 引入 AgentEditor，将 ./AgentEditor.js 中已经封装好的能力接到本文件流程里。
import { AgentEditor } from './AgentEditor.js';
// 引入 AgentNavigationFooter，将 ./AgentNavigationFooter.js 中已经封装好的能力接到本文件流程里。
import { AgentNavigationFooter } from './AgentNavigationFooter.js';
// 引入 AgentsList，将 ./AgentsList.js 中已经封装好的能力接到本文件流程里。
import { AgentsList } from './AgentsList.js';
// 引入 deleteAgentFromFile，将 ./agentFileUtils.js 中已经封装好的能力接到本文件流程里。
import { deleteAgentFromFile } from './agentFileUtils.js';
// 引入 CreateAgentWizard，将 ./new-agent-creation/CreateAgentWizard.js 中已经封装好的能力接到本文件流程里。
import { CreateAgentWizard } from './new-agent-creation/CreateAgentWizard.js';
// 类型依赖 { ModeState } 来自 ./types.js，用于校准终端渲染的数据契约。
import type { ModeState } from './types.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  tools: Tools;
  onExit: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// AgentsMenu 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AgentsMenu(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(157);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    tools,
    onExit
  } = t0;
  // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t1 = {
      mode: "list-agents",
      source: "all"
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // modeState 状态 由 React state 持有，setModeState 会在用户操作或异步结果返回时触发刷新。
  const [modeState, setModeState] = useState(t1);
  // agentDefinitions 集合保存`useAppState`，供终端渲染后续处理使用。
  const agentDefinitions = useAppState(_temp);
  // mcpTools 集合保存`useAppState`，供终端渲染后续处理使用。
  const mcpTools = useAppState(_temp2);
  // toolPermissionContext 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContext = useAppState(_temp3);
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    allAgents,
    activeAgents: agents
  } = agentDefinitions;
  // t2 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // changes 集合 由 React state 持有，setChanges 会在用户操作或异步结果返回时触发刷新。
  const [changes, setChanges] = useState(t2);
  // mergedTools 集合保存`useMergedTools`，供终端渲染后续处理使用。
  const mergedTools = useMergedTools(tools, mcpTools, toolPermissionContext);
  // 调用 useExitOnCtrlCDWithKeybindings，触发终端渲染此处需要的副作用。
  useExitOnCtrlCDWithKeybindings();
  // t3 暂存 `allAgents.filter(_temp4)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== allAgents) {
    // t3 暂存 `allAgents.filter(_temp4)` 生成的渲染片段，后续返回路径直接复用。
    t3 = allAgents.filter(_temp4);
    // $[2] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = allAgents;
    // $[3] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[3];
  }
  // t4 暂存 `allAgents.filter(_temp5)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== allAgents) {
    // t4 暂存 `allAgents.filter(_temp5)` 生成的渲染片段，后续返回路径直接复用。
    t4 = allAgents.filter(_temp5);
    // $[4] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = allAgents;
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // t5 暂存 `allAgents.filter(_temp6)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== allAgents) {
    // t5 暂存 `allAgents.filter(_temp6)` 生成的渲染片段，后续返回路径直接复用。
    t5 = allAgents.filter(_temp6);
    // $[6] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = allAgents;
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // t6 暂存 `allAgents.filter(_temp7)` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== allAgents) {
    // t6 暂存 `allAgents.filter(_temp7)` 生成的渲染片段，后续返回路径直接复用。
    t6 = allAgents.filter(_temp7);
    // $[8] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = allAgents;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // t7 暂存 `allAgents.filter(_temp8)` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== allAgents) {
    // t7 暂存 `allAgents.filter(_temp8)` 生成的渲染片段，后续返回路径直接复用。
    t7 = allAgents.filter(_temp8);
    // $[10] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = allAgents;
    // $[11] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[11];
  }
  // t8 暂存 `allAgents.filter(_temp9)` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== allAgents) {
    // t8 暂存 `allAgents.filter(_temp9)` 生成的渲染片段，后续返回路径直接复用。
    t8 = allAgents.filter(_temp9);
    // $[12] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = allAgents;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // t9 暂存 `allAgents.filter(_temp0)` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== allAgents) {
    // t9 暂存 `allAgents.filter(_temp0)` 生成的渲染片段，后续返回路径直接复用。
    t9 = allAgents.filter(_temp0);
    // $[14] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = allAgents;
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // t10 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== allAgents || $[17] !== t3 || $[18] !== t4 || $[19] !== t5 || $[20] !== t6 || $[21] !== t7 || $[22] !== t8 || $[23] !== t9) {
    // t10 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t10 = {
      "built-in": t3,
      userSettings: t4,
      projectSettings: t5,
      policySettings: t6,
      localSettings: t7,
      flagSettings: t8,
      plugin: t9,
      all: allAgents
    };
    // $[16] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = allAgents;
    // $[17] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t3;
    // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t4;
    // $[19] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t5;
    // $[20] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t6;
    // $[21] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t7;
    // $[22] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t8;
    // $[23] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t9;
    // $[24] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[24];
  }
  // agentsBySource沿用 `t10` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const agentsBySource = t10;
  // t11 暂存 `message => {` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
    // t11 暂存 `message => {` 生成的渲染片段，后续返回路径直接复用。
    t11 = message => {
      // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
      setChanges(prev => [...prev, message]);
      // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
      setModeState({
        mode: "list-agents",
        source: "all"
      });
    };
    // $[25] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[25];
  }
  // handleAgentCreated 命名 `t11`，让后续代码直接表达这个值的用途。
  const handleAgentCreated = t11;
  // t12 暂存 `async agent => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== setAppState) {
    // t12 暂存 `async agent => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = async agent => {
      // 终端 UI 组件 Agents Menu在这里处理 ``，完成这一小步状态转换。
      ;
      // 保护这一段可能失败的终端渲染操作，确保异常能进入相邻错误处理。
      try {
        // 等待 `deleteAgentFromFile(agent)` 完成，再继续终端 UI 组件 Agents Menu的异步流程。
        await deleteAgentFromFile(agent);
        // setAppState 写入新的状态值，使终端渲染后续读取保持一致。
        setAppState(state => {
          // allAgents_0筛选`allAgents.filter`，供终端渲染后续处理使用。
          const allAgents_0 = state.agentDefinitions.allAgents.filter(a_6 => !(a_6.agentType === agent.agentType && a_6.source === agent.source));
          // 返回结构化结果，集中表达终端渲染已经整理出的状态。
          return {
            ...state,
            agentDefinitions: {
              ...state.agentDefinitions,
              allAgents: allAgents_0,
              activeAgents: getActiveAgentsFromList(allAgents_0)
            }
          };
        });
        // setChanges 写入新的状态值，使终端渲染后续读取保持一致。
        setChanges(prev_0 => [...prev_0, `Deleted agent: ${chalk.bold(agent.agentType)}`]);
        // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
        setModeState({
          mode: "list-agents",
          source: "all"
        });
      } catch (t13) {
        // 错误保存`t13`，作为后续临时缓存值处理的输入。
        const error = t13;
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logError(toError(error));
      }
    };
    // $[26] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = setAppState;
    // $[27] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[27];
  }
  // handleAgentDeleted沿用 `t12` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleAgentDeleted = t12;
  // 按照 modeState.mode 的取值选择终端渲染的具体处理分支。
  switch (modeState.mode) {
    case "list-agents":
      {
        // t13 暂存 `modeState.source === "all" ? [...agentsBySource["built-in...` 的派生结果，便于缓存命中时直接复用。
        let t13;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[28] !== agentsBySource || $[29] !== modeState.source) {
          // t13 暂存 `modeState.source === "all" ? [...agentsBySource["built-in...` 生成的渲染片段，后续返回路径直接复用。
          t13 = modeState.source === "all" ? [...agentsBySource["built-in"], ...agentsBySource.userSettings, ...agentsBySource.projectSettings, ...agentsBySource.localSettings, ...agentsBySource.policySettings, ...agentsBySource.flagSettings, ...agentsBySource.plugin] : agentsBySource[modeState.source];
          // $[28] 缓存 `agentsBySource`，下次依赖未变时 React 编译产物可直接复用。
          $[28] = agentsBySource;
          // $[29] 缓存 `modeState.source`，下次依赖未变时 React 编译产物可直接复用。
          $[29] = modeState.source;
          // $[30] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
          $[30] = t13;
        } else {
          // t13 从 React 编译缓存槽 $[30] 取回渲染片段，避免依赖未变时重建 JSX。
          t13 = $[30];
        }
        // agentsToShow沿用 `t13` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
        const agentsToShow = t13;
        // t14 暂存 `resolveAgentOverrides(agentsToShow, agents)` 的派生结果，便于缓存命中时直接复用。
        let t14;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[31] !== agents || $[32] !== agentsToShow) {
          // t14 暂存 `resolveAgentOverrides(agentsToShow, agents)` 生成的渲染片段，后续返回路径直接复用。
          t14 = resolveAgentOverrides(agentsToShow, agents);
          // $[31] 缓存 `agents`，下次依赖未变时 React 编译产物可直接复用。
          $[31] = agents;
          // $[32] 缓存 `agentsToShow`，下次依赖未变时 React 编译产物可直接复用。
          $[32] = agentsToShow;
          // $[33] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[33] = t14;
        } else {
          // t14 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
          t14 = $[33];
        }
        // allResolved保存`t14`，作为后续临时缓存值处理的输入。
        const allResolved = t14;
        // resolvedAgents 集合 命名 `allResolved`，让后续代码直接表达这个值的用途。
        const resolvedAgents = allResolved;
        // t15 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
        let t15;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[34] !== changes || $[35] !== onExit) {
          // t15 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
          t15 = () => {
            // exitMessage 消息数据格式化`changes.join`，供终端渲染后续处理使用。
            const exitMessage = changes.length > 0 ? `Agent changes:\n${changes.join("\n")}` : undefined;
            // 调用 onExit，触发终端渲染此处需要的副作用。
            onExit(exitMessage ?? "Agents dialog dismissed", {
              display: changes.length === 0 ? "system" : undefined
            });
          };
          // $[34] 缓存 `changes`，下次依赖未变时 React 编译产物可直接复用。
          $[34] = changes;
          // $[35] 缓存 `onExit`，下次依赖未变时 React 编译产物可直接复用。
          $[35] = onExit;
          // $[36] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[36] = t15;
        } else {
          // t15 从 React 编译缓存槽 $[36] 取回渲染片段，避免依赖未变时重建 JSX。
          t15 = $[36];
        }
        // t16 暂存 `agent_0 => setModeState({` 的派生结果，便于缓存命中时直接复用。
        let t16;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[37] !== modeState) {
          // t16 暂存 `agent_0 => setModeState({` 生成的渲染片段，后续返回路径直接复用。
          t16 = agent_0 => setModeState({
            mode: "agent-menu",
            agent: agent_0,
            previousMode: modeState
          });
          // $[37] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
          $[37] = modeState;
          // $[38] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[38] = t16;
        } else {
          // t16 从 React 编译缓存槽 $[38] 取回渲染片段，避免依赖未变时重建 JSX。
          t16 = $[38];
        }
        // t17 暂存 `() => setModeState({` 的派生结果，便于缓存命中时直接复用。
        let t17;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[39] === Symbol.for("react.memo_cache_sentinel")) {
          // t17 暂存 `() => setModeState({` 生成的渲染片段，后续返回路径直接复用。
          t17 = () => setModeState({
            mode: "create-agent"
          });
          // $[39] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[39] = t17;
        } else {
          // t17 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
          t17 = $[39];
        }
        // t18 暂存 `<AgentsList source={modeState.source} agents={resolvedAge...` 的派生结果，便于缓存命中时直接复用。
        let t18;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[40] !== changes || $[41] !== modeState.source || $[42] !== resolvedAgents || $[43] !== t15 || $[44] !== t16) {
          // t18 暂存 `<AgentsList source={modeState.source} agents={resolvedAge...` 生成的渲染片段，后续返回路径直接复用。
          t18 = <AgentsList source={modeState.source} agents={resolvedAgents} onBack={t15} onSelect={t16} onCreateNew={t17} changes={changes} />;
          // $[40] 缓存 `changes`，下次依赖未变时 React 编译产物可直接复用。
          $[40] = changes;
          // $[41] 缓存 `modeState.source`，下次依赖未变时 React 编译产物可直接复用。
          $[41] = modeState.source;
          // $[42] 缓存 `resolvedAgents`，下次依赖未变时 React 编译产物可直接复用。
          $[42] = resolvedAgents;
          // $[43] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[43] = t15;
          // $[44] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[44] = t16;
          // $[45] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[45] = t18;
        } else {
          // t18 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
          t18 = $[45];
        }
        // t19 暂存 `<AgentNavigationFooter />` 的派生结果，便于缓存命中时直接复用。
        let t19;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
          // t19 暂存 `<AgentNavigationFooter />` 生成的渲染片段，后续返回路径直接复用。
          t19 = <AgentNavigationFooter />;
          // $[46] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[46] = t19;
        } else {
          // t19 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
          t19 = $[46];
        }
        // t20 暂存 `<>{t18}{t19}</>` 的派生结果，便于缓存命中时直接复用。
        let t20;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[47] !== t18) {
          // t20 暂存 `<>{t18}{t19}</>` 生成的渲染片段，后续返回路径直接复用。
          t20 = <>{t18}{t19}</>;
          // $[47] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[47] = t18;
          // $[48] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
          $[48] = t20;
        } else {
          // t20 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
          t20 = $[48];
        }
        // 返回 `t20`，作为终端渲染这次计算的结果。
        return t20;
      }
    case "create-agent":
      {
        // t13 暂存 `() => setModeState({` 的派生结果，便于缓存命中时直接复用。
        let t13;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
          // t13 暂存 `() => setModeState({` 生成的渲染片段，后续返回路径直接复用。
          t13 = () => setModeState({
            mode: "list-agents",
            source: "all"
          });
          // $[49] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
          $[49] = t13;
        } else {
          // t13 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
          t13 = $[49];
        }
        // t14 暂存 `<CreateAgentWizard tools={mergedTools} existingAgents={ag...` 的派生结果，便于缓存命中时直接复用。
        let t14;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[50] !== agents || $[51] !== mergedTools) {
          // t14 暂存 `<CreateAgentWizard tools={mergedTools} existingAgents={ag...` 生成的渲染片段，后续返回路径直接复用。
          t14 = <CreateAgentWizard tools={mergedTools} existingAgents={agents} onComplete={handleAgentCreated} onCancel={t13} />;
          // $[50] 缓存 `agents`，下次依赖未变时 React 编译产物可直接复用。
          $[50] = agents;
          // $[51] 缓存 `mergedTools`，下次依赖未变时 React 编译产物可直接复用。
          $[51] = mergedTools;
          // $[52] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[52] = t14;
        } else {
          // t14 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
          t14 = $[52];
        }
        // 返回 `t14`，作为终端渲染这次计算的结果。
        return t14;
      }
    case "agent-menu":
      {
        // t13 暂存 `allAgents.find(t14)` 的派生结果，便于缓存命中时直接复用。
        let t13;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[53] !== allAgents || $[54] !== modeState.agent.agentType || $[55] !== modeState.agent.source) {
          // t14 暂存 `a_9 => a_9.agentType === modeState.agent.agentType && a_9...` 的派生结果，便于缓存命中时直接复用。
          let t14;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[57] !== modeState.agent.agentType || $[58] !== modeState.agent.source) {
            // t14 暂存 `a_9 => a_9.agentType === modeState.agent.agentType && a_9...` 生成的渲染片段，后续返回路径直接复用。
            t14 = a_9 => a_9.agentType === modeState.agent.agentType && a_9.source === modeState.agent.source;
            // $[57] 缓存 `modeState.agent.agentType`，下次依赖未变时 React 编译产物可直接复用。
            $[57] = modeState.agent.agentType;
            // $[58] 缓存 `modeState.agent.source`，下次依赖未变时 React 编译产物可直接复用。
            $[58] = modeState.agent.source;
            // $[59] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
            $[59] = t14;
          } else {
            // t14 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
            t14 = $[59];
          }
          // t13 暂存 `allAgents.find(t14)` 生成的渲染片段，后续返回路径直接复用。
          t13 = allAgents.find(t14);
          // $[53] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
          $[53] = allAgents;
          // $[54] 缓存 `modeState.agent.agentType`，下次依赖未变时 React 编译产物可直接复用。
          $[54] = modeState.agent.agentType;
          // $[55] 缓存 `modeState.agent.source`，下次依赖未变时 React 编译产物可直接复用。
          $[55] = modeState.agent.source;
          // $[56] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
          $[56] = t13;
        } else {
          // t13 从 React 编译缓存槽 $[56] 取回渲染片段，避免依赖未变时重建 JSX。
          t13 = $[56];
        }
        // freshAgent_1沿用 `t13` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
        const freshAgent_1 = t13;
        // agentToUse标记终端 UI Agents Menu是否启用对应路径。
        const agentToUse = freshAgent_1 || modeState.agent;
        // isEditable标记终端 UI Agents Menu是否启用对应路径。
        const isEditable = agentToUse.source !== "built-in" && agentToUse.source !== "plugin" && agentToUse.source !== "flagSettings";
        // t14 暂存 `{` 的派生结果，便于缓存命中时直接复用。
        let t14;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[60] === Symbol.for("react.memo_cache_sentinel")) {
          // t14 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
          t14 = {
            label: "View agent",
            value: "view"
          };
          // $[60] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[60] = t14;
        } else {
          // t14 从 React 编译缓存槽 $[60] 取回渲染片段，避免依赖未变时重建 JSX。
          t14 = $[60];
        }
        // t15 暂存 `isEditable ? [{` 的派生结果，便于缓存命中时直接复用。
        let t15;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[61] !== isEditable) {
          // t15 暂存 `isEditable ? [{` 生成的渲染片段，后续返回路径直接复用。
          t15 = isEditable ? [{
            label: "Edit agent",
            value: "edit"
          }, {
            label: "Delete agent",
            value: "delete"
          }] : [];
          // $[61] 缓存 `isEditable`，下次依赖未变时 React 编译产物可直接复用。
          $[61] = isEditable;
          // $[62] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[62] = t15;
        } else {
          // t15 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
          t15 = $[62];
        }
        // t16 暂存 `{` 的派生结果，便于缓存命中时直接复用。
        let t16;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
          // t16 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
          t16 = {
            label: "Back",
            value: "back"
          };
          // $[63] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[63] = t16;
        } else {
          // t16 从 React 编译缓存槽 $[63] 取回渲染片段，避免依赖未变时重建 JSX。
          t16 = $[63];
        }
        // t17 暂存 `[t14, ...t15, t16]` 的派生结果，便于缓存命中时直接复用。
        let t17;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[64] !== t15) {
          // t17 暂存 `[t14, ...t15, t16]` 生成的渲染片段，后续返回路径直接复用。
          t17 = [t14, ...t15, t16];
          // $[64] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[64] = t15;
          // $[65] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[65] = t17;
        } else {
          // t17 从 React 编译缓存槽 $[65] 取回渲染片段，避免依赖未变时重建 JSX。
          t17 = $[65];
        }
        // menuItems 集合 命名 `t17`，让后续代码直接表达这个值的用途。
        const menuItems = t17;
        // t18 暂存 `value_0 => {` 的派生结果，便于缓存命中时直接复用。
        let t18;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[66] !== agentToUse || $[67] !== modeState) {
          // t18 暂存 `value_0 => {` 生成的渲染片段，后续返回路径直接复用。
          t18 = value_0 => {
            // 终端 UI 组件 Agents Menu在这里处理 `bb129: switch (value_0) {`，完成这一小步状态转换。
            bb129: switch (value_0) {
              case "view":
                {
                  // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
                  setModeState({
                    mode: "view-agent",
                    agent: agentToUse,
                    previousMode: modeState.previousMode
                  });
                  // 结束这个分支或循环，避免终端渲染继续落入后续路径。
                  break bb129;
                }
              case "edit":
                {
                  // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
                  setModeState({
                    mode: "edit-agent",
                    agent: agentToUse,
                    previousMode: modeState
                  });
                  // 结束这个分支或循环，避免终端渲染继续落入后续路径。
                  break bb129;
                }
              case "delete":
                {
                  // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
                  setModeState({
                    mode: "delete-confirm",
                    agent: agentToUse,
                    previousMode: modeState
                  });
                  // 结束这个分支或循环，避免终端渲染继续落入后续路径。
                  break bb129;
                }
              case "back":
                {
                  // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
                  setModeState(modeState.previousMode);
                }
            }
          };
          // $[66] 缓存 `agentToUse`，下次依赖未变时 React 编译产物可直接复用。
          $[66] = agentToUse;
          // $[67] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
          $[67] = modeState;
          // $[68] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[68] = t18;
        } else {
          // t18 从 React 编译缓存槽 $[68] 取回渲染片段，避免依赖未变时重建 JSX。
          t18 = $[68];
        }
        // handleMenuSelect 命名 `t18`，让后续代码直接表达这个值的用途。
        const handleMenuSelect = t18;
        // t19 暂存 `() => setModeState(modeState.previousMode)` 的派生结果，便于缓存命中时直接复用。
        let t19;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[69] !== modeState.previousMode) {
          // t19 暂存 `() => setModeState(modeState.previousMode)` 生成的渲染片段，后续返回路径直接复用。
          t19 = () => setModeState(modeState.previousMode);
          // $[69] 缓存 `modeState.previousMode`，下次依赖未变时 React 编译产物可直接复用。
          $[69] = modeState.previousMode;
          // $[70] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[70] = t19;
        } else {
          // t19 从 React 编译缓存槽 $[70] 取回渲染片段，避免依赖未变时重建 JSX。
          t19 = $[70];
        }
        // t20 暂存 `() => setModeState(modeState.previousMode)` 的派生结果，便于缓存命中时直接复用。
        let t20;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[71] !== modeState.previousMode) {
          // t20 暂存 `() => setModeState(modeState.previousMode)` 生成的渲染片段，后续返回路径直接复用。
          t20 = () => setModeState(modeState.previousMode);
          // $[71] 缓存 `modeState.previousMode`，下次依赖未变时 React 编译产物可直接复用。
          $[71] = modeState.previousMode;
          // $[72] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
          $[72] = t20;
        } else {
          // t20 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
          t20 = $[72];
        }
        // t21 暂存 `<Select options={menuItems} onChange={handleMenuSelect} o...` 的派生结果，便于缓存命中时直接复用。
        let t21;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[73] !== handleMenuSelect || $[74] !== menuItems || $[75] !== t20) {
          // t21 暂存 `<Select options={menuItems} onChange={handleMenuSelect} o...` 生成的渲染片段，后续返回路径直接复用。
          t21 = <Select options={menuItems} onChange={handleMenuSelect} onCancel={t20} />;
          // $[73] 缓存 `handleMenuSelect`，下次依赖未变时 React 编译产物可直接复用。
          $[73] = handleMenuSelect;
          // $[74] 缓存 `menuItems`，下次依赖未变时 React 编译产物可直接复用。
          $[74] = menuItems;
          // $[75] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
          $[75] = t20;
          // $[76] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[76] = t21;
        } else {
          // t21 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
          t21 = $[76];
        }
        // t22 暂存 `changes.length > 0 && <Box marginTop={1}><Text dimColor={...` 的派生结果，便于缓存命中时直接复用。
        let t22;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[77] !== changes) {
          // t22 暂存 `changes.length > 0 && <Box marginTop={1}><Text dimColor={...` 生成的渲染片段，后续返回路径直接复用。
          t22 = changes.length > 0 && <Box marginTop={1}><Text dimColor={true}>{changes[changes.length - 1]}</Text></Box>;
          // $[77] 缓存 `changes`，下次依赖未变时 React 编译产物可直接复用。
          $[77] = changes;
          // $[78] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[78] = t22;
        } else {
          // t22 从 React 编译缓存槽 $[78] 取回渲染片段，避免依赖未变时重建 JSX。
          t22 = $[78];
        }
        // t23 暂存 `<Box flexDirection="column">{t21}{t22}</Box>` 的派生结果，便于缓存命中时直接复用。
        let t23;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[79] !== t21 || $[80] !== t22) {
          // t23 暂存 `<Box flexDirection="column">{t21}{t22}</Box>` 生成的渲染片段，后续返回路径直接复用。
          t23 = <Box flexDirection="column">{t21}{t22}</Box>;
          // $[79] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[79] = t21;
          // $[80] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[80] = t22;
          // $[81] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[81] = t23;
        } else {
          // t23 从 React 编译缓存槽 $[81] 取回渲染片段，避免依赖未变时重建 JSX。
          t23 = $[81];
        }
        // t24 暂存 `<Dialog title={modeState.agent.agentType} onCancel={t19} ...` 的派生结果，便于缓存命中时直接复用。
        let t24;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[82] !== modeState.agent.agentType || $[83] !== t19 || $[84] !== t23) {
          // t24 暂存 `<Dialog title={modeState.agent.agentType} onCancel={t19} ...` 生成的渲染片段，后续返回路径直接复用。
          t24 = <Dialog title={modeState.agent.agentType} onCancel={t19} hideInputGuide={true}>{t23}</Dialog>;
          // $[82] 缓存 `modeState.agent.agentType`，下次依赖未变时 React 编译产物可直接复用。
          $[82] = modeState.agent.agentType;
          // $[83] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[83] = t19;
          // $[84] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[84] = t23;
          // $[85] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[85] = t24;
        } else {
          // t24 从 React 编译缓存槽 $[85] 取回渲染片段，避免依赖未变时重建 JSX。
          t24 = $[85];
        }
        // t25 暂存 `<AgentNavigationFooter />` 的派生结果，便于缓存命中时直接复用。
        let t25;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[86] === Symbol.for("react.memo_cache_sentinel")) {
          // t25 暂存 `<AgentNavigationFooter />` 生成的渲染片段，后续返回路径直接复用。
          t25 = <AgentNavigationFooter />;
          // $[86] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
          $[86] = t25;
        } else {
          // t25 从 React 编译缓存槽 $[86] 取回渲染片段，避免依赖未变时重建 JSX。
          t25 = $[86];
        }
        // t26 暂存 `<>{t24}{t25}</>` 的派生结果，便于缓存命中时直接复用。
        let t26;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[87] !== t24) {
          // t26 暂存 `<>{t24}{t25}</>` 生成的渲染片段，后续返回路径直接复用。
          t26 = <>{t24}{t25}</>;
          // $[87] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[87] = t24;
          // $[88] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
          $[88] = t26;
        } else {
          // t26 从 React 编译缓存槽 $[88] 取回渲染片段，避免依赖未变时重建 JSX。
          t26 = $[88];
        }
        // 返回 `t26`，作为终端渲染这次计算的结果。
        return t26;
      }
    case "view-agent":
      {
        // t13 暂存 `allAgents.find(t14)` 的派生结果，便于缓存命中时直接复用。
        let t13;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[89] !== allAgents || $[90] !== modeState.agent) {
          // t14 暂存 `a_8 => a_8.agentType === modeState.agent.agentType && a_8...` 的派生结果，便于缓存命中时直接复用。
          let t14;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[92] !== modeState.agent) {
            // t14 暂存 `a_8 => a_8.agentType === modeState.agent.agentType && a_8...` 生成的渲染片段，后续返回路径直接复用。
            t14 = a_8 => a_8.agentType === modeState.agent.agentType && a_8.source === modeState.agent.source;
            // $[92] 缓存 `modeState.agent`，下次依赖未变时 React 编译产物可直接复用。
            $[92] = modeState.agent;
            // $[93] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
            $[93] = t14;
          } else {
            // t14 从 React 编译缓存槽 $[93] 取回渲染片段，避免依赖未变时重建 JSX。
            t14 = $[93];
          }
          // t13 暂存 `allAgents.find(t14)` 生成的渲染片段，后续返回路径直接复用。
          t13 = allAgents.find(t14);
          // $[89] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
          $[89] = allAgents;
          // $[90] 缓存 `modeState.agent`，下次依赖未变时 React 编译产物可直接复用。
          $[90] = modeState.agent;
          // $[91] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
          $[91] = t13;
        } else {
          // t13 从 React 编译缓存槽 $[91] 取回渲染片段，避免依赖未变时重建 JSX。
          t13 = $[91];
        }
        // freshAgent_0保存`t13`，作为后续临时缓存值处理的输入。
        const freshAgent_0 = t13;
        // agentToDisplay标记终端 UI Agents Menu是否启用对应路径。
        const agentToDisplay = freshAgent_0 || modeState.agent;
        // t14 暂存 `() => setModeState({` 的派生结果，便于缓存命中时直接复用。
        let t14;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[94] !== agentToDisplay || $[95] !== modeState.previousMode) {
          // t14 暂存 `() => setModeState({` 生成的渲染片段，后续返回路径直接复用。
          t14 = () => setModeState({
            mode: "agent-menu",
            agent: agentToDisplay,
            previousMode: modeState.previousMode
          });
          // $[94] 缓存 `agentToDisplay`，下次依赖未变时 React 编译产物可直接复用。
          $[94] = agentToDisplay;
          // $[95] 缓存 `modeState.previousMode`，下次依赖未变时 React 编译产物可直接复用。
          $[95] = modeState.previousMode;
          // $[96] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[96] = t14;
        } else {
          // t14 从 React 编译缓存槽 $[96] 取回渲染片段，避免依赖未变时重建 JSX。
          t14 = $[96];
        }
        // t15 暂存 `() => setModeState({` 的派生结果，便于缓存命中时直接复用。
        let t15;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[97] !== agentToDisplay || $[98] !== modeState.previousMode) {
          // t15 暂存 `() => setModeState({` 生成的渲染片段，后续返回路径直接复用。
          t15 = () => setModeState({
            mode: "agent-menu",
            agent: agentToDisplay,
            previousMode: modeState.previousMode
          });
          // $[97] 缓存 `agentToDisplay`，下次依赖未变时 React 编译产物可直接复用。
          $[97] = agentToDisplay;
          // $[98] 缓存 `modeState.previousMode`，下次依赖未变时 React 编译产物可直接复用。
          $[98] = modeState.previousMode;
          // $[99] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[99] = t15;
        } else {
          // t15 从 React 编译缓存槽 $[99] 取回渲染片段，避免依赖未变时重建 JSX。
          t15 = $[99];
        }
        // t16 暂存 `<AgentDetail agent={agentToDisplay} tools={mergedTools} a...` 的派生结果，便于缓存命中时直接复用。
        let t16;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[100] !== agentToDisplay || $[101] !== allAgents || $[102] !== mergedTools || $[103] !== t15) {
          // t16 暂存 `<AgentDetail agent={agentToDisplay} tools={mergedTools} a...` 生成的渲染片段，后续返回路径直接复用。
          t16 = <AgentDetail agent={agentToDisplay} tools={mergedTools} allAgents={allAgents} onBack={t15} />;
          // $[100] 缓存 `agentToDisplay`，下次依赖未变时 React 编译产物可直接复用。
          $[100] = agentToDisplay;
          // $[101] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
          $[101] = allAgents;
          // $[102] 缓存 `mergedTools`，下次依赖未变时 React 编译产物可直接复用。
          $[102] = mergedTools;
          // $[103] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[103] = t15;
          // $[104] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[104] = t16;
        } else {
          // t16 从 React 编译缓存槽 $[104] 取回渲染片段，避免依赖未变时重建 JSX。
          t16 = $[104];
        }
        // t17 暂存 `<Dialog title={agentToDisplay.agentType} onCancel={t14} h...` 的派生结果，便于缓存命中时直接复用。
        let t17;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[105] !== agentToDisplay.agentType || $[106] !== t14 || $[107] !== t16) {
          // t17 暂存 `<Dialog title={agentToDisplay.agentType} onCancel={t14} h...` 生成的渲染片段，后续返回路径直接复用。
          t17 = <Dialog title={agentToDisplay.agentType} onCancel={t14} hideInputGuide={true}>{t16}</Dialog>;
          // $[105] 缓存 `agentToDisplay.agentType`，下次依赖未变时 React 编译产物可直接复用。
          $[105] = agentToDisplay.agentType;
          // $[106] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[106] = t14;
          // $[107] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[107] = t16;
          // $[108] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[108] = t17;
        } else {
          // t17 从 React 编译缓存槽 $[108] 取回渲染片段，避免依赖未变时重建 JSX。
          t17 = $[108];
        }
        // t18 暂存 `<AgentNavigationFooter instructions="Press Enter or Esc t...` 的派生结果，便于缓存命中时直接复用。
        let t18;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[109] === Symbol.for("react.memo_cache_sentinel")) {
          // t18 暂存 `<AgentNavigationFooter instructions="Press Enter or Esc t...` 生成的渲染片段，后续返回路径直接复用。
          t18 = <AgentNavigationFooter instructions="Press Enter or Esc to go back" />;
          // $[109] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[109] = t18;
        } else {
          // t18 从 React 编译缓存槽 $[109] 取回渲染片段，避免依赖未变时重建 JSX。
          t18 = $[109];
        }
        // t19 暂存 `<>{t17}{t18}</>` 的派生结果，便于缓存命中时直接复用。
        let t19;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[110] !== t17) {
          // t19 暂存 `<>{t17}{t18}</>` 生成的渲染片段，后续返回路径直接复用。
          t19 = <>{t17}{t18}</>;
          // $[110] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[110] = t17;
          // $[111] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[111] = t19;
        } else {
          // t19 从 React 编译缓存槽 $[111] 取回渲染片段，避免依赖未变时重建 JSX。
          t19 = $[111];
        }
        // 返回 `t19`，作为终端渲染这次计算的结果。
        return t19;
      }
    case "delete-confirm":
      {
        // t13 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
        let t13;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[112] === Symbol.for("react.memo_cache_sentinel")) {
          // t13 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
          t13 = [{
            label: "Yes, delete",
            value: "yes"
          }, {
            label: "No, cancel",
            value: "no"
          }];
          // $[112] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
          $[112] = t13;
        } else {
          // t13 从 React 编译缓存槽 $[112] 取回渲染片段，避免依赖未变时重建 JSX。
          t13 = $[112];
        }
        // deleteOptions 集合保存`t13`，作为后续临时缓存值处理的输入。
        const deleteOptions = t13;
        // t14 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
        let t14;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[113] !== modeState) {
          // t14 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
          t14 = () => {
            // 满足 `"previousMode" in modeState` 时，终端渲染执行该分支。
            if ("previousMode" in modeState) {
              // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
              setModeState(modeState.previousMode);
            }
          };
          // $[113] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
          $[113] = modeState;
          // $[114] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[114] = t14;
        } else {
          // t14 从 React 编译缓存槽 $[114] 取回渲染片段，避免依赖未变时重建 JSX。
          t14 = $[114];
        }
        // t15 暂存 `<Text>Are you sure you want to delete the agent{" "}<Text...` 的派生结果，便于缓存命中时直接复用。
        let t15;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[115] !== modeState.agent.agentType) {
          // t15 暂存 `<Text>Are you sure you want to delete the agent{" "}<Text...` 生成的渲染片段，后续返回路径直接复用。
          t15 = <Text>Are you sure you want to delete the agent{" "}<Text bold={true}>{modeState.agent.agentType}</Text>?</Text>;
          // $[115] 缓存 `modeState.agent.agentType`，下次依赖未变时 React 编译产物可直接复用。
          $[115] = modeState.agent.agentType;
          // $[116] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[116] = t15;
        } else {
          // t15 从 React 编译缓存槽 $[116] 取回渲染片段，避免依赖未变时重建 JSX。
          t15 = $[116];
        }
        // t16 暂存 `<Box marginTop={1}><Text dimColor={true}>Source: {modeSta...` 的派生结果，便于缓存命中时直接复用。
        let t16;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[117] !== modeState.agent.source) {
          // t16 暂存 `<Box marginTop={1}><Text dimColor={true}>Source: {modeSta...` 生成的渲染片段，后续返回路径直接复用。
          t16 = <Box marginTop={1}><Text dimColor={true}>Source: {modeState.agent.source}</Text></Box>;
          // $[117] 缓存 `modeState.agent.source`，下次依赖未变时 React 编译产物可直接复用。
          $[117] = modeState.agent.source;
          // $[118] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[118] = t16;
        } else {
          // t16 从 React 编译缓存槽 $[118] 取回渲染片段，避免依赖未变时重建 JSX。
          t16 = $[118];
        }
        // t17 暂存 `value => {` 的派生结果，便于缓存命中时直接复用。
        let t17;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[119] !== handleAgentDeleted || $[120] !== modeState) {
          // t17 暂存 `value => {` 生成的渲染片段，后续返回路径直接复用。
          t17 = value => {
            // 当 `value` 匹配 `"yes"` 时，终端渲染执行对应分支。
            if (value === "yes") {
              // 调用 handleAgentDeleted，触发终端渲染此处需要的副作用。
              handleAgentDeleted(modeState.agent);
            } else {
              // 满足 `"previousMode" in modeState` 时，终端渲染执行该分支。
              if ("previousMode" in modeState) {
                // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
                setModeState(modeState.previousMode);
              }
            }
          };
          // $[119] 缓存 `handleAgentDeleted`，下次依赖未变时 React 编译产物可直接复用。
          $[119] = handleAgentDeleted;
          // $[120] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
          $[120] = modeState;
          // $[121] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[121] = t17;
        } else {
          // t17 从 React 编译缓存槽 $[121] 取回渲染片段，避免依赖未变时重建 JSX。
          t17 = $[121];
        }
        // t18 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
        let t18;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[122] !== modeState) {
          // t18 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
          t18 = () => {
            // 满足 `"previousMode" in modeState` 时，终端渲染执行该分支。
            if ("previousMode" in modeState) {
              // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
              setModeState(modeState.previousMode);
            }
          };
          // $[122] 缓存 `modeState`，下次依赖未变时 React 编译产物可直接复用。
          $[122] = modeState;
          // $[123] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[123] = t18;
        } else {
          // t18 从 React 编译缓存槽 $[123] 取回渲染片段，避免依赖未变时重建 JSX。
          t18 = $[123];
        }
        // t19 暂存 `<Box marginTop={1}><Select options={deleteOptions} onChan...` 的派生结果，便于缓存命中时直接复用。
        let t19;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[124] !== t17 || $[125] !== t18) {
          // t19 暂存 `<Box marginTop={1}><Select options={deleteOptions} onChan...` 生成的渲染片段，后续返回路径直接复用。
          t19 = <Box marginTop={1}><Select options={deleteOptions} onChange={t17} onCancel={t18} /></Box>;
          // $[124] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[124] = t17;
          // $[125] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[125] = t18;
          // $[126] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[126] = t19;
        } else {
          // t19 从 React 编译缓存槽 $[126] 取回渲染片段，避免依赖未变时重建 JSX。
          t19 = $[126];
        }
        // t20 暂存 `<Dialog title="Delete agent" onCancel={t14} color="error"...` 的派生结果，便于缓存命中时直接复用。
        let t20;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[127] !== t14 || $[128] !== t15 || $[129] !== t16 || $[130] !== t19) {
          // t20 暂存 `<Dialog title="Delete agent" onCancel={t14} color="error"...` 生成的渲染片段，后续返回路径直接复用。
          t20 = <Dialog title="Delete agent" onCancel={t14} color="error">{t15}{t16}{t19}</Dialog>;
          // $[127] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[127] = t14;
          // $[128] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[128] = t15;
          // $[129] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[129] = t16;
          // $[130] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[130] = t19;
          // $[131] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
          $[131] = t20;
        } else {
          // t20 从 React 编译缓存槽 $[131] 取回渲染片段，避免依赖未变时重建 JSX。
          t20 = $[131];
        }
        // t21 暂存 `<AgentNavigationFooter instructions={"Press \u2191\u2193 ...` 的派生结果，便于缓存命中时直接复用。
        let t21;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[132] === Symbol.for("react.memo_cache_sentinel")) {
          // t21 暂存 `<AgentNavigationFooter instructions={"Press \u2191\u2193 ...` 生成的渲染片段，后续返回路径直接复用。
          t21 = <AgentNavigationFooter instructions={"Press \u2191\u2193 to navigate, Enter to select, Esc to cancel"} />;
          // $[132] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[132] = t21;
        } else {
          // t21 从 React 编译缓存槽 $[132] 取回渲染片段，避免依赖未变时重建 JSX。
          t21 = $[132];
        }
        // t22 暂存 `<>{t20}{t21}</>` 的派生结果，便于缓存命中时直接复用。
        let t22;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[133] !== t20) {
          // t22 暂存 `<>{t20}{t21}</>` 生成的渲染片段，后续返回路径直接复用。
          t22 = <>{t20}{t21}</>;
          // $[133] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
          $[133] = t20;
          // $[134] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
          $[134] = t22;
        } else {
          // t22 从 React 编译缓存槽 $[134] 取回渲染片段，避免依赖未变时重建 JSX。
          t22 = $[134];
        }
        // 返回 `t22`，作为终端渲染这次计算的结果。
        return t22;
      }
    case "edit-agent":
      {
        // t13 暂存 `allAgents.find(t14)` 的派生结果，便于缓存命中时直接复用。
        let t13;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[135] !== allAgents || $[136] !== modeState.agent) {
          // t14 暂存 `a_7 => a_7.agentType === modeState.agent.agentType && a_7...` 的派生结果，便于缓存命中时直接复用。
          let t14;
          // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
          if ($[138] !== modeState.agent) {
            // t14 暂存 `a_7 => a_7.agentType === modeState.agent.agentType && a_7...` 生成的渲染片段，后续返回路径直接复用。
            t14 = a_7 => a_7.agentType === modeState.agent.agentType && a_7.source === modeState.agent.source;
            // $[138] 缓存 `modeState.agent`，下次依赖未变时 React 编译产物可直接复用。
            $[138] = modeState.agent;
            // $[139] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
            $[139] = t14;
          } else {
            // t14 从 React 编译缓存槽 $[139] 取回渲染片段，避免依赖未变时重建 JSX。
            t14 = $[139];
          }
          // t13 暂存 `allAgents.find(t14)` 生成的渲染片段，后续返回路径直接复用。
          t13 = allAgents.find(t14);
          // $[135] 缓存 `allAgents`，下次依赖未变时 React 编译产物可直接复用。
          $[135] = allAgents;
          // $[136] 缓存 `modeState.agent`，下次依赖未变时 React 编译产物可直接复用。
          $[136] = modeState.agent;
          // $[137] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
          $[137] = t13;
        } else {
          // t13 从 React 编译缓存槽 $[137] 取回渲染片段，避免依赖未变时重建 JSX。
          t13 = $[137];
        }
        // freshAgent保存`t13`，作为后续临时缓存值处理的输入。
        const freshAgent = t13;
        // agentToEdit标记终端 UI Agents Menu是否启用对应路径。
        const agentToEdit = freshAgent || modeState.agent;
        // t14固定为 ``Edit agent: ${agentToEdit.agentType}``，作为终端 UI Agents Menu后续展示或比较的基准。
        const t14 = `Edit agent: ${agentToEdit.agentType}`;
        // t15 暂存 `() => setModeState(modeState.previousMode)` 的派生结果，便于缓存命中时直接复用。
        let t15;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[140] !== modeState.previousMode) {
          // t15 暂存 `() => setModeState(modeState.previousMode)` 生成的渲染片段，后续返回路径直接复用。
          t15 = () => setModeState(modeState.previousMode);
          // $[140] 缓存 `modeState.previousMode`，下次依赖未变时 React 编译产物可直接复用。
          $[140] = modeState.previousMode;
          // $[141] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[141] = t15;
        } else {
          // t15 从 React 编译缓存槽 $[141] 取回渲染片段，避免依赖未变时重建 JSX。
          t15 = $[141];
        }
        // t16 暂存 `message_0 => {` 的派生结果，便于缓存命中时直接复用。
        let t16;
        // t17 暂存 `() => setModeState(modeState.previousMode)` 的派生结果，便于缓存命中时直接复用。
        let t17;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[142] !== modeState.previousMode) {
          // t16 暂存 `message_0 => {` 生成的渲染片段，后续返回路径直接复用。
          t16 = message_0 => {
            // 调用 handleAgentCreated，触发终端渲染此处需要的副作用。
            handleAgentCreated(message_0);
            // setModeState 写入新的状态值，使终端渲染后续读取保持一致。
            setModeState(modeState.previousMode);
          };
          // t17 暂存 `() => setModeState(modeState.previousMode)` 生成的渲染片段，后续返回路径直接复用。
          t17 = () => setModeState(modeState.previousMode);
          // $[142] 缓存 `modeState.previousMode`，下次依赖未变时 React 编译产物可直接复用。
          $[142] = modeState.previousMode;
          // $[143] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[143] = t16;
          // $[144] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[144] = t17;
        } else {
          // t16 从 React 编译缓存槽 $[143] 取回渲染片段，避免依赖未变时重建 JSX。
          t16 = $[143];
          // t17 从 React 编译缓存槽 $[144] 取回渲染片段，避免依赖未变时重建 JSX。
          t17 = $[144];
        }
        // t18 暂存 `<AgentEditor agent={agentToEdit} tools={mergedTools} onSa...` 的派生结果，便于缓存命中时直接复用。
        let t18;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[145] !== agentToEdit || $[146] !== mergedTools || $[147] !== t16 || $[148] !== t17) {
          // t18 暂存 `<AgentEditor agent={agentToEdit} tools={mergedTools} onSa...` 生成的渲染片段，后续返回路径直接复用。
          t18 = <AgentEditor agent={agentToEdit} tools={mergedTools} onSaved={t16} onBack={t17} />;
          // $[145] 缓存 `agentToEdit`，下次依赖未变时 React 编译产物可直接复用。
          $[145] = agentToEdit;
          // $[146] 缓存 `mergedTools`，下次依赖未变时 React 编译产物可直接复用。
          $[146] = mergedTools;
          // $[147] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
          $[147] = t16;
          // $[148] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
          $[148] = t17;
          // $[149] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[149] = t18;
        } else {
          // t18 从 React 编译缓存槽 $[149] 取回渲染片段，避免依赖未变时重建 JSX。
          t18 = $[149];
        }
        // t19 暂存 `<Dialog title={t14} onCancel={t15} hideInputGuide={true}>...` 的派生结果，便于缓存命中时直接复用。
        let t19;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[150] !== t14 || $[151] !== t15 || $[152] !== t18) {
          // t19 暂存 `<Dialog title={t14} onCancel={t15} hideInputGuide={true}>...` 生成的渲染片段，后续返回路径直接复用。
          t19 = <Dialog title={t14} onCancel={t15} hideInputGuide={true}>{t18}</Dialog>;
          // $[150] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
          $[150] = t14;
          // $[151] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
          $[151] = t15;
          // $[152] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
          $[152] = t18;
          // $[153] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[153] = t19;
        } else {
          // t19 从 React 编译缓存槽 $[153] 取回渲染片段，避免依赖未变时重建 JSX。
          t19 = $[153];
        }
        // t20 暂存 `<AgentNavigationFooter />` 的派生结果，便于缓存命中时直接复用。
        let t20;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[154] === Symbol.for("react.memo_cache_sentinel")) {
          // t20 暂存 `<AgentNavigationFooter />` 生成的渲染片段，后续返回路径直接复用。
          t20 = <AgentNavigationFooter />;
          // $[154] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
          $[154] = t20;
        } else {
          // t20 从 React 编译缓存槽 $[154] 取回渲染片段，避免依赖未变时重建 JSX。
          t20 = $[154];
        }
        // t21 暂存 `<>{t19}{t20}</>` 的派生结果，便于缓存命中时直接复用。
        let t21;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[155] !== t19) {
          // t21 暂存 `<>{t19}{t20}</>` 生成的渲染片段，后续返回路径直接复用。
          t21 = <>{t19}{t20}</>;
          // $[155] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
          $[155] = t19;
          // $[156] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
          $[156] = t21;
        } else {
          // t21 从 React 编译缓存槽 $[156] 取回渲染片段，避免依赖未变时重建 JSX。
          t21 = $[156];
        }
        // 返回 `t21`，作为终端渲染这次计算的结果。
        return t21;
      }
    default:
      {
        // 返回 `null`，作为终端渲染这次计算的结果。
        return null;
      }
  }
}
// _temp0 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp0(a_5) {
  // 返回 `a_5.source === "plugin"`，作为终端渲染这次计算的结果。
  return a_5.source === "plugin";
}
// _temp9 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp9(a_4) {
  // 返回 `a_4.source === "flagSettings"`，作为终端渲染这次计算的结果。
  return a_4.source === "flagSettings";
}
// _temp8 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8(a_3) {
  // 返回 `a_3.source === "localSettings"`，作为终端渲染这次计算的结果。
  return a_3.source === "localSettings";
}
// _temp7 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(a_2) {
  // 返回 `a_2.source === "policySettings"`，作为终端渲染这次计算的结果。
  return a_2.source === "policySettings";
}
// _temp6 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(a_1) {
  // 返回 `a_1.source === "projectSettings"`，作为终端渲染这次计算的结果。
  return a_1.source === "projectSettings";
}
// _temp5 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(a_0) {
  // 返回 `a_0.source === "userSettings"`，作为终端渲染这次计算的结果。
  return a_0.source === "userSettings";
}
// _temp4 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(a) {
  // 返回 `a.source === "built-in"`，作为终端渲染这次计算的结果。
  return a.source === "built-in";
}
// _temp3 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(s_1) {
  // 返回 `s_1.toolPermissionContext`，作为终端渲染这次计算的结果。
  return s_1.toolPermissionContext;
}
// _temp2 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.mcp.tools`，作为终端渲染这次计算的结果。
  return s_0.mcp.tools;
}
// _temp 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.agentDefinitions`，作为终端渲染这次计算的结果。
  return s.agentDefinitions;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjaGFsayIsIlJlYWN0IiwidXNlQ2FsbGJhY2siLCJ1c2VNZW1vIiwidXNlU3RhdGUiLCJTZXR0aW5nU291cmNlIiwiQ29tbWFuZFJlc3VsdERpc3BsYXkiLCJ1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MiLCJ1c2VNZXJnZWRUb29scyIsIkJveCIsIlRleHQiLCJ1c2VBcHBTdGF0ZSIsInVzZVNldEFwcFN0YXRlIiwiVG9vbHMiLCJSZXNvbHZlZEFnZW50IiwicmVzb2x2ZUFnZW50T3ZlcnJpZGVzIiwiQWdlbnREZWZpbml0aW9uIiwiZ2V0QWN0aXZlQWdlbnRzRnJvbUxpc3QiLCJ0b0Vycm9yIiwibG9nRXJyb3IiLCJTZWxlY3QiLCJEaWFsb2ciLCJBZ2VudERldGFpbCIsIkFnZW50RWRpdG9yIiwiQWdlbnROYXZpZ2F0aW9uRm9vdGVyIiwiQWdlbnRzTGlzdCIsImRlbGV0ZUFnZW50RnJvbUZpbGUiLCJDcmVhdGVBZ2VudFdpemFyZCIsIk1vZGVTdGF0ZSIsIlByb3BzIiwidG9vbHMiLCJvbkV4aXQiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsIkFnZW50c01lbnUiLCJ0MCIsIiQiLCJfYyIsInQxIiwiU3ltYm9sIiwiZm9yIiwibW9kZSIsInNvdXJjZSIsIm1vZGVTdGF0ZSIsInNldE1vZGVTdGF0ZSIsImFnZW50RGVmaW5pdGlvbnMiLCJfdGVtcCIsIm1jcFRvb2xzIiwiX3RlbXAyIiwidG9vbFBlcm1pc3Npb25Db250ZXh0IiwiX3RlbXAzIiwic2V0QXBwU3RhdGUiLCJhbGxBZ2VudHMiLCJhY3RpdmVBZ2VudHMiLCJhZ2VudHMiLCJ0MiIsImNoYW5nZXMiLCJzZXRDaGFuZ2VzIiwibWVyZ2VkVG9vbHMiLCJ0MyIsImZpbHRlciIsIl90ZW1wNCIsInQ0IiwiX3RlbXA1IiwidDUiLCJfdGVtcDYiLCJ0NiIsIl90ZW1wNyIsInQ3IiwiX3RlbXA4IiwidDgiLCJfdGVtcDkiLCJ0OSIsIl90ZW1wMCIsInQxMCIsInVzZXJTZXR0aW5ncyIsInByb2plY3RTZXR0aW5ncyIsInBvbGljeVNldHRpbmdzIiwibG9jYWxTZXR0aW5ncyIsImZsYWdTZXR0aW5ncyIsInBsdWdpbiIsImFsbCIsImFnZW50c0J5U291cmNlIiwidDExIiwibWVzc2FnZSIsInByZXYiLCJoYW5kbGVBZ2VudENyZWF0ZWQiLCJ0MTIiLCJhZ2VudCIsInN0YXRlIiwiYWxsQWdlbnRzXzAiLCJhXzYiLCJhIiwiYWdlbnRUeXBlIiwicHJldl8wIiwiYm9sZCIsInQxMyIsImVycm9yIiwiaGFuZGxlQWdlbnREZWxldGVkIiwiYWdlbnRzVG9TaG93IiwidDE0IiwiYWxsUmVzb2x2ZWQiLCJyZXNvbHZlZEFnZW50cyIsInQxNSIsImV4aXRNZXNzYWdlIiwibGVuZ3RoIiwiam9pbiIsInVuZGVmaW5lZCIsInQxNiIsImFnZW50XzAiLCJwcmV2aW91c01vZGUiLCJ0MTciLCJ0MTgiLCJ0MTkiLCJ0MjAiLCJhXzkiLCJmaW5kIiwiZnJlc2hBZ2VudF8xIiwiYWdlbnRUb1VzZSIsImlzRWRpdGFibGUiLCJsYWJlbCIsInZhbHVlIiwibWVudUl0ZW1zIiwidmFsdWVfMCIsImJiMTI5IiwiaGFuZGxlTWVudVNlbGVjdCIsInQyMSIsInQyMiIsInQyMyIsInQyNCIsInQyNSIsInQyNiIsImFfOCIsImZyZXNoQWdlbnRfMCIsImFnZW50VG9EaXNwbGF5IiwiZGVsZXRlT3B0aW9ucyIsImFfNyIsImZyZXNoQWdlbnQiLCJhZ2VudFRvRWRpdCIsIm1lc3NhZ2VfMCIsImFfNSIsImFfNCIsImFfMyIsImFfMiIsImFfMSIsImFfMCIsInNfMSIsInMiLCJzXzAiLCJtY3AiXSwic291cmNlcyI6WyJBZ2VudHNNZW51LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUNhbGxiYWNrLCB1c2VNZW1vLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nU291cmNlIH0gZnJvbSAnc3JjL3V0aWxzL3NldHRpbmdzL2NvbnN0YW50cy5qcydcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncy5qcydcbmltcG9ydCB7IHVzZU1lcmdlZFRvb2xzIH0gZnJvbSAnLi4vLi4vaG9va3MvdXNlTWVyZ2VkVG9vbHMuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSwgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgVG9vbHMgfSBmcm9tICcuLi8uLi9Ub29sLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBSZXNvbHZlZEFnZW50LFxuICByZXNvbHZlQWdlbnRPdmVycmlkZXMsXG59IGZyb20gJy4uLy4uL3Rvb2xzL0FnZW50VG9vbC9hZ2VudERpc3BsYXkuanMnXG5pbXBvcnQge1xuICB0eXBlIEFnZW50RGVmaW5pdGlvbixcbiAgZ2V0QWN0aXZlQWdlbnRzRnJvbUxpc3QsXG59IGZyb20gJy4uLy4uL3Rvb2xzL0FnZW50VG9vbC9sb2FkQWdlbnRzRGlyLmpzJ1xuaW1wb3J0IHsgdG9FcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9ycy5qcydcbmltcG9ydCB7IGxvZ0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvbG9nLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vQ3VzdG9tU2VsZWN0L3NlbGVjdC5qcydcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gJy4uL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgQWdlbnREZXRhaWwgfSBmcm9tICcuL0FnZW50RGV0YWlsLmpzJ1xuaW1wb3J0IHsgQWdlbnRFZGl0b3IgfSBmcm9tICcuL0FnZW50RWRpdG9yLmpzJ1xuaW1wb3J0IHsgQWdlbnROYXZpZ2F0aW9uRm9vdGVyIH0gZnJvbSAnLi9BZ2VudE5hdmlnYXRpb25Gb290ZXIuanMnXG5pbXBvcnQgeyBBZ2VudHNMaXN0IH0gZnJvbSAnLi9BZ2VudHNMaXN0LmpzJ1xuaW1wb3J0IHsgZGVsZXRlQWdlbnRGcm9tRmlsZSB9IGZyb20gJy4vYWdlbnRGaWxlVXRpbHMuanMnXG5pbXBvcnQgeyBDcmVhdGVBZ2VudFdpemFyZCB9IGZyb20gJy4vbmV3LWFnZW50LWNyZWF0aW9uL0NyZWF0ZUFnZW50V2l6YXJkLmpzJ1xuaW1wb3J0IHR5cGUgeyBNb2RlU3RhdGUgfSBmcm9tICcuL3R5cGVzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICB0b29sczogVG9vbHNcbiAgb25FeGl0OiAoXG4gICAgcmVzdWx0Pzogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IGRpc3BsYXk/OiBDb21tYW5kUmVzdWx0RGlzcGxheSB9LFxuICApID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFnZW50c01lbnUoeyB0b29scywgb25FeGl0IH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW21vZGVTdGF0ZSwgc2V0TW9kZVN0YXRlXSA9IHVzZVN0YXRlPE1vZGVTdGF0ZT4oe1xuICAgIG1vZGU6ICdsaXN0LWFnZW50cycsXG4gICAgc291cmNlOiAnYWxsJyxcbiAgfSlcbiAgY29uc3QgYWdlbnREZWZpbml0aW9ucyA9IHVzZUFwcFN0YXRlKHMgPT4gcy5hZ2VudERlZmluaXRpb25zKVxuICBjb25zdCBtY3BUb29scyA9IHVzZUFwcFN0YXRlKHMgPT4gcy5tY3AudG9vbHMpXG4gIGNvbnN0IHRvb2xQZXJtaXNzaW9uQ29udGV4dCA9IHVzZUFwcFN0YXRlKHMgPT4gcy50b29sUGVybWlzc2lvbkNvbnRleHQpXG4gIGNvbnN0IHNldEFwcFN0YXRlID0gdXNlU2V0QXBwU3RhdGUoKVxuICBjb25zdCB7IGFsbEFnZW50cywgYWN0aXZlQWdlbnRzOiBhZ2VudHMgfSA9IGFnZW50RGVmaW5pdGlvbnNcbiAgY29uc3QgW2NoYW5nZXMsIHNldENoYW5nZXNdID0gdXNlU3RhdGU8c3RyaW5nW10+KFtdKVxuXG4gIC8vIEdldCBNQ1AgdG9vbHMgZnJvbSBhcHAgc3RhdGUgYW5kIG1lcmdlIHdpdGggbG9jYWwgdG9vbHNcbiAgY29uc3QgbWVyZ2VkVG9vbHMgPSB1c2VNZXJnZWRUb29scyh0b29scywgbWNwVG9vbHMsIHRvb2xQZXJtaXNzaW9uQ29udGV4dClcblxuICB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MoKVxuXG4gIGNvbnN0IGFnZW50c0J5U291cmNlOiBSZWNvcmQ8XG4gICAgU2V0dGluZ1NvdXJjZSB8ICdhbGwnIHwgJ2J1aWx0LWluJyB8ICdwbHVnaW4nLFxuICAgIEFnZW50RGVmaW5pdGlvbltdXG4gID4gPSB1c2VNZW1vKFxuICAgICgpID0+ICh7XG4gICAgICAnYnVpbHQtaW4nOiBhbGxBZ2VudHMuZmlsdGVyKGEgPT4gYS5zb3VyY2UgPT09ICdidWlsdC1pbicpLFxuICAgICAgdXNlclNldHRpbmdzOiBhbGxBZ2VudHMuZmlsdGVyKGEgPT4gYS5zb3VyY2UgPT09ICd1c2VyU2V0dGluZ3MnKSxcbiAgICAgIHByb2plY3RTZXR0aW5nczogYWxsQWdlbnRzLmZpbHRlcihhID0+IGEuc291cmNlID09PSAncHJvamVjdFNldHRpbmdzJyksXG4gICAgICBwb2xpY3lTZXR0aW5nczogYWxsQWdlbnRzLmZpbHRlcihhID0+IGEuc291cmNlID09PSAncG9saWN5U2V0dGluZ3MnKSxcbiAgICAgIGxvY2FsU2V0dGluZ3M6IGFsbEFnZW50cy5maWx0ZXIoYSA9PiBhLnNvdXJjZSA9PT0gJ2xvY2FsU2V0dGluZ3MnKSxcbiAgICAgIGZsYWdTZXR0aW5nczogYWxsQWdlbnRzLmZpbHRlcihhID0+IGEuc291cmNlID09PSAnZmxhZ1NldHRpbmdzJyksXG4gICAgICBwbHVnaW46IGFsbEFnZW50cy5maWx0ZXIoYSA9PiBhLnNvdXJjZSA9PT0gJ3BsdWdpbicpLFxuICAgICAgYWxsOiBhbGxBZ2VudHMsXG4gICAgfSksXG4gICAgW2FsbEFnZW50c10sXG4gIClcblxuICBjb25zdCBoYW5kbGVBZ2VudENyZWF0ZWQgPSB1c2VDYWxsYmFjaygobWVzc2FnZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0Q2hhbmdlcyhwcmV2ID0+IFsuLi5wcmV2LCBtZXNzYWdlXSlcbiAgICBzZXRNb2RlU3RhdGUoeyBtb2RlOiAnbGlzdC1hZ2VudHMnLCBzb3VyY2U6ICdhbGwnIH0pXG4gIH0sIFtdKVxuXG4gIGNvbnN0IGhhbmRsZUFnZW50RGVsZXRlZCA9IHVzZUNhbGxiYWNrKFxuICAgIGFzeW5jIChhZ2VudDogQWdlbnREZWZpbml0aW9uKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBkZWxldGVBZ2VudEZyb21GaWxlKGFnZW50KVxuICAgICAgICBzZXRBcHBTdGF0ZShzdGF0ZSA9PiB7XG4gICAgICAgICAgY29uc3QgYWxsQWdlbnRzID0gc3RhdGUuYWdlbnREZWZpbml0aW9ucy5hbGxBZ2VudHMuZmlsdGVyKFxuICAgICAgICAgICAgYSA9PlxuICAgICAgICAgICAgICAhKGEuYWdlbnRUeXBlID09PSBhZ2VudC5hZ2VudFR5cGUgJiYgYS5zb3VyY2UgPT09IGFnZW50LnNvdXJjZSksXG4gICAgICAgICAgKVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgICAgIGFnZW50RGVmaW5pdGlvbnM6IHtcbiAgICAgICAgICAgICAgLi4uc3RhdGUuYWdlbnREZWZpbml0aW9ucyxcbiAgICAgICAgICAgICAgYWxsQWdlbnRzLFxuICAgICAgICAgICAgICBhY3RpdmVBZ2VudHM6IGdldEFjdGl2ZUFnZW50c0Zyb21MaXN0KGFsbEFnZW50cyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICBzZXRDaGFuZ2VzKHByZXYgPT4gW1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgYERlbGV0ZWQgYWdlbnQ6ICR7Y2hhbGsuYm9sZChhZ2VudC5hZ2VudFR5cGUpfWAsXG4gICAgICAgIF0pXG4gICAgICAgIC8vIEdvIGJhY2sgdG8gdGhlIGFnZW50cyBsaXN0IGFmdGVyIGRlbGV0aW9uXG4gICAgICAgIHNldE1vZGVTdGF0ZSh7IG1vZGU6ICdsaXN0LWFnZW50cycsIHNvdXJjZTogJ2FsbCcgfSlcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGxvZ0Vycm9yKHRvRXJyb3IoZXJyb3IpKVxuICAgICAgfVxuICAgIH0sXG4gICAgW3NldEFwcFN0YXRlXSxcbiAgKVxuXG4gIC8vIFJlbmRlciBiYXNlZCBvbiBtb2RlXG4gIHN3aXRjaCAobW9kZVN0YXRlLm1vZGUpIHtcbiAgICBjYXNlICdsaXN0LWFnZW50cyc6IHtcbiAgICAgIGNvbnN0IGFnZW50c1RvU2hvdyA9XG4gICAgICAgIG1vZGVTdGF0ZS5zb3VyY2UgPT09ICdhbGwnXG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIC4uLmFnZW50c0J5U291cmNlWydidWlsdC1pbiddLFxuICAgICAgICAgICAgICAuLi5hZ2VudHNCeVNvdXJjZVsndXNlclNldHRpbmdzJ10sXG4gICAgICAgICAgICAgIC4uLmFnZW50c0J5U291cmNlWydwcm9qZWN0U2V0dGluZ3MnXSxcbiAgICAgICAgICAgICAgLi4uYWdlbnRzQnlTb3VyY2VbJ2xvY2FsU2V0dGluZ3MnXSxcbiAgICAgICAgICAgICAgLi4uYWdlbnRzQnlTb3VyY2VbJ3BvbGljeVNldHRpbmdzJ10sXG4gICAgICAgICAgICAgIC4uLmFnZW50c0J5U291cmNlWydmbGFnU2V0dGluZ3MnXSxcbiAgICAgICAgICAgICAgLi4uYWdlbnRzQnlTb3VyY2VbJ3BsdWdpbiddLFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogYWdlbnRzQnlTb3VyY2VbbW9kZVN0YXRlLnNvdXJjZV1cblxuICAgICAgLy8gUmVzb2x2ZSBvdmVycmlkZXMgYW5kIGZpbHRlciB0byB0aGUgYWdlbnRzIHdlIHdhbnQgdG8gc2hvd1xuICAgICAgY29uc3QgYWxsUmVzb2x2ZWQgPSByZXNvbHZlQWdlbnRPdmVycmlkZXMoYWdlbnRzVG9TaG93LCBhZ2VudHMpXG4gICAgICBjb25zdCByZXNvbHZlZEFnZW50czogUmVzb2x2ZWRBZ2VudFtdID0gYWxsUmVzb2x2ZWRcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8QWdlbnRzTGlzdFxuICAgICAgICAgICAgc291cmNlPXttb2RlU3RhdGUuc291cmNlfVxuICAgICAgICAgICAgYWdlbnRzPXtyZXNvbHZlZEFnZW50c31cbiAgICAgICAgICAgIG9uQmFjaz17KCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBleGl0TWVzc2FnZSA9XG4gICAgICAgICAgICAgICAgY2hhbmdlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICA/IGBBZ2VudCBjaGFuZ2VzOlxcbiR7Y2hhbmdlcy5qb2luKCdcXG4nKX1gXG4gICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgICBvbkV4aXQoZXhpdE1lc3NhZ2UgPz8gJ0FnZW50cyBkaWFsb2cgZGlzbWlzc2VkJywge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGNoYW5nZXMubGVuZ3RoID09PSAwID8gJ3N5c3RlbScgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgb25TZWxlY3Q9e2FnZW50ID0+XG4gICAgICAgICAgICAgIHNldE1vZGVTdGF0ZSh7XG4gICAgICAgICAgICAgICAgbW9kZTogJ2FnZW50LW1lbnUnLFxuICAgICAgICAgICAgICAgIGFnZW50LFxuICAgICAgICAgICAgICAgIHByZXZpb3VzTW9kZTogbW9kZVN0YXRlLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb25DcmVhdGVOZXc9eygpID0+IHNldE1vZGVTdGF0ZSh7IG1vZGU6ICdjcmVhdGUtYWdlbnQnIH0pfVxuICAgICAgICAgICAgY2hhbmdlcz17Y2hhbmdlc31cbiAgICAgICAgICAvPlxuICAgICAgICAgIDxBZ2VudE5hdmlnYXRpb25Gb290ZXIgLz5cbiAgICAgICAgPC8+XG4gICAgICApXG4gICAgfVxuXG4gICAgY2FzZSAnY3JlYXRlLWFnZW50JzpcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxDcmVhdGVBZ2VudFdpemFyZFxuICAgICAgICAgIHRvb2xzPXttZXJnZWRUb29sc31cbiAgICAgICAgICBleGlzdGluZ0FnZW50cz17YWdlbnRzfVxuICAgICAgICAgIG9uQ29tcGxldGU9e2hhbmRsZUFnZW50Q3JlYXRlZH1cbiAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0TW9kZVN0YXRlKHsgbW9kZTogJ2xpc3QtYWdlbnRzJywgc291cmNlOiAnYWxsJyB9KX1cbiAgICAgICAgLz5cbiAgICAgIClcblxuICAgIGNhc2UgJ2FnZW50LW1lbnUnOiB7XG4gICAgICAvLyBBbHdheXMgdXNlIGZyZXNoIGFnZW50IGRhdGFcbiAgICAgIGNvbnN0IGZyZXNoQWdlbnQgPSBhbGxBZ2VudHMuZmluZChcbiAgICAgICAgYSA9PlxuICAgICAgICAgIGEuYWdlbnRUeXBlID09PSBtb2RlU3RhdGUuYWdlbnQuYWdlbnRUeXBlICYmXG4gICAgICAgICAgYS5zb3VyY2UgPT09IG1vZGVTdGF0ZS5hZ2VudC5zb3VyY2UsXG4gICAgICApXG4gICAgICBjb25zdCBhZ2VudFRvVXNlID0gZnJlc2hBZ2VudCB8fCBtb2RlU3RhdGUuYWdlbnRcblxuICAgICAgY29uc3QgaXNFZGl0YWJsZSA9XG4gICAgICAgIGFnZW50VG9Vc2Uuc291cmNlICE9PSAnYnVpbHQtaW4nICYmXG4gICAgICAgIGFnZW50VG9Vc2Uuc291cmNlICE9PSAncGx1Z2luJyAmJlxuICAgICAgICBhZ2VudFRvVXNlLnNvdXJjZSAhPT0gJ2ZsYWdTZXR0aW5ncydcbiAgICAgIGNvbnN0IG1lbnVJdGVtcyA9IFtcbiAgICAgICAgeyBsYWJlbDogJ1ZpZXcgYWdlbnQnLCB2YWx1ZTogJ3ZpZXcnIH0sXG4gICAgICAgIC4uLihpc0VkaXRhYmxlXG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdFZGl0IGFnZW50JywgdmFsdWU6ICdlZGl0JyB9LFxuICAgICAgICAgICAgICB7IGxhYmVsOiAnRGVsZXRlIGFnZW50JywgdmFsdWU6ICdkZWxldGUnIH0sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiBbXSksXG4gICAgICAgIHsgbGFiZWw6ICdCYWNrJywgdmFsdWU6ICdiYWNrJyB9LFxuICAgICAgXVxuXG4gICAgICBjb25zdCBoYW5kbGVNZW51U2VsZWN0ID0gKHZhbHVlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgICAgc3dpdGNoICh2YWx1ZSkge1xuICAgICAgICAgIGNhc2UgJ3ZpZXcnOlxuICAgICAgICAgICAgc2V0TW9kZVN0YXRlKHtcbiAgICAgICAgICAgICAgbW9kZTogJ3ZpZXctYWdlbnQnLFxuICAgICAgICAgICAgICBhZ2VudDogYWdlbnRUb1VzZSxcbiAgICAgICAgICAgICAgcHJldmlvdXNNb2RlOiBtb2RlU3RhdGUucHJldmlvdXNNb2RlLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICBzZXRNb2RlU3RhdGUoe1xuICAgICAgICAgICAgICBtb2RlOiAnZWRpdC1hZ2VudCcsXG4gICAgICAgICAgICAgIGFnZW50OiBhZ2VudFRvVXNlLFxuICAgICAgICAgICAgICBwcmV2aW91c01vZGU6IG1vZGVTdGF0ZSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ2RlbGV0ZSc6XG4gICAgICAgICAgICBzZXRNb2RlU3RhdGUoe1xuICAgICAgICAgICAgICBtb2RlOiAnZGVsZXRlLWNvbmZpcm0nLFxuICAgICAgICAgICAgICBhZ2VudDogYWdlbnRUb1VzZSxcbiAgICAgICAgICAgICAgcHJldmlvdXNNb2RlOiBtb2RlU3RhdGUsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlICdiYWNrJzpcbiAgICAgICAgICAgIHNldE1vZGVTdGF0ZShtb2RlU3RhdGUucHJldmlvdXNNb2RlKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxEaWFsb2dcbiAgICAgICAgICAgIHRpdGxlPXttb2RlU3RhdGUuYWdlbnQuYWdlbnRUeXBlfVxuICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHNldE1vZGVTdGF0ZShtb2RlU3RhdGUucHJldmlvdXNNb2RlKX1cbiAgICAgICAgICAgIGhpZGVJbnB1dEd1aWRlXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgICBvcHRpb25zPXttZW51SXRlbXN9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZU1lbnVTZWxlY3R9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHNldE1vZGVTdGF0ZShtb2RlU3RhdGUucHJldmlvdXNNb2RlKX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAge2NoYW5nZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2NoYW5nZXNbY2hhbmdlcy5sZW5ndGggLSAxXX08L1RleHQ+XG4gICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8L0RpYWxvZz5cbiAgICAgICAgICA8QWdlbnROYXZpZ2F0aW9uRm9vdGVyIC8+XG4gICAgICAgIDwvPlxuICAgICAgKVxuICAgIH1cblxuICAgIGNhc2UgJ3ZpZXctYWdlbnQnOiB7XG4gICAgICAvLyBBbHdheXMgdXNlIGZyZXNoIGFnZW50IGRhdGEgZnJvbSBhbGxBZ2VudHNcbiAgICAgIGNvbnN0IGZyZXNoQWdlbnQgPSBhbGxBZ2VudHMuZmluZChcbiAgICAgICAgYSA9PlxuICAgICAgICAgIGEuYWdlbnRUeXBlID09PSBtb2RlU3RhdGUuYWdlbnQuYWdlbnRUeXBlICYmXG4gICAgICAgICAgYS5zb3VyY2UgPT09IG1vZGVTdGF0ZS5hZ2VudC5zb3VyY2UsXG4gICAgICApXG4gICAgICBjb25zdCBhZ2VudFRvRGlzcGxheSA9IGZyZXNoQWdlbnQgfHwgbW9kZVN0YXRlLmFnZW50XG5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPERpYWxvZ1xuICAgICAgICAgICAgdGl0bGU9e2FnZW50VG9EaXNwbGF5LmFnZW50VHlwZX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PlxuICAgICAgICAgICAgICBzZXRNb2RlU3RhdGUoe1xuICAgICAgICAgICAgICAgIG1vZGU6ICdhZ2VudC1tZW51JyxcbiAgICAgICAgICAgICAgICBhZ2VudDogYWdlbnRUb0Rpc3BsYXksXG4gICAgICAgICAgICAgICAgcHJldmlvdXNNb2RlOiBtb2RlU3RhdGUucHJldmlvdXNNb2RlLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGlkZUlucHV0R3VpZGVcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8QWdlbnREZXRhaWxcbiAgICAgICAgICAgICAgYWdlbnQ9e2FnZW50VG9EaXNwbGF5fVxuICAgICAgICAgICAgICB0b29scz17bWVyZ2VkVG9vbHN9XG4gICAgICAgICAgICAgIGFsbEFnZW50cz17YWxsQWdlbnRzfVxuICAgICAgICAgICAgICBvbkJhY2s9eygpID0+XG4gICAgICAgICAgICAgICAgc2V0TW9kZVN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIG1vZGU6ICdhZ2VudC1tZW51JyxcbiAgICAgICAgICAgICAgICAgIGFnZW50OiBhZ2VudFRvRGlzcGxheSxcbiAgICAgICAgICAgICAgICAgIHByZXZpb3VzTW9kZTogbW9kZVN0YXRlLnByZXZpb3VzTW9kZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvRGlhbG9nPlxuICAgICAgICAgIDxBZ2VudE5hdmlnYXRpb25Gb290ZXIgaW5zdHJ1Y3Rpb25zPVwiUHJlc3MgRW50ZXIgb3IgRXNjIHRvIGdvIGJhY2tcIiAvPlxuICAgICAgICA8Lz5cbiAgICAgIClcbiAgICB9XG5cbiAgICBjYXNlICdkZWxldGUtY29uZmlybSc6IHtcbiAgICAgIGNvbnN0IGRlbGV0ZU9wdGlvbnMgPSBbXG4gICAgICAgIHsgbGFiZWw6ICdZZXMsIGRlbGV0ZScsIHZhbHVlOiAneWVzJyB9LFxuICAgICAgICB7IGxhYmVsOiAnTm8sIGNhbmNlbCcsIHZhbHVlOiAnbm8nIH0sXG4gICAgICBdXG5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPERpYWxvZ1xuICAgICAgICAgICAgdGl0bGU9XCJEZWxldGUgYWdlbnRcIlxuICAgICAgICAgICAgb25DYW5jZWw9eygpID0+IHtcbiAgICAgICAgICAgICAgaWYgKCdwcmV2aW91c01vZGUnIGluIG1vZGVTdGF0ZSlcbiAgICAgICAgICAgICAgICBzZXRNb2RlU3RhdGUobW9kZVN0YXRlLnByZXZpb3VzTW9kZSlcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgICBjb2xvcj1cImVycm9yXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgICAgQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGUgYWdlbnR7JyAnfVxuICAgICAgICAgICAgICA8VGV4dCBib2xkPnttb2RlU3RhdGUuYWdlbnQuYWdlbnRUeXBlfTwvVGV4dD4/XG4gICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlNvdXJjZToge21vZGVTdGF0ZS5hZ2VudC5zb3VyY2V9PC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICA8Qm94IG1hcmdpblRvcD17MX0+XG4gICAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgICBvcHRpb25zPXtkZWxldGVPcHRpb25zfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSAneWVzJykge1xuICAgICAgICAgICAgICAgICAgICB2b2lkIGhhbmRsZUFnZW50RGVsZXRlZChtb2RlU3RhdGUuYWdlbnQpXG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJ3ByZXZpb3VzTW9kZScgaW4gbW9kZVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc2V0TW9kZVN0YXRlKG1vZGVTdGF0ZS5wcmV2aW91c01vZGUpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoJ3ByZXZpb3VzTW9kZScgaW4gbW9kZVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldE1vZGVTdGF0ZShtb2RlU3RhdGUucHJldmlvdXNNb2RlKVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICA8L0RpYWxvZz5cbiAgICAgICAgICA8QWdlbnROYXZpZ2F0aW9uRm9vdGVyIGluc3RydWN0aW9ucz1cIlByZXNzIOKGkeKGkyB0byBuYXZpZ2F0ZSwgRW50ZXIgdG8gc2VsZWN0LCBFc2MgdG8gY2FuY2VsXCIgLz5cbiAgICAgICAgPC8+XG4gICAgICApXG4gICAgfVxuXG4gICAgY2FzZSAnZWRpdC1hZ2VudCc6IHtcbiAgICAgIC8vIEFsd2F5cyB1c2UgZnJlc2ggYWdlbnQgZGF0YVxuICAgICAgY29uc3QgZnJlc2hBZ2VudCA9IGFsbEFnZW50cy5maW5kKFxuICAgICAgICBhID0+XG4gICAgICAgICAgYS5hZ2VudFR5cGUgPT09IG1vZGVTdGF0ZS5hZ2VudC5hZ2VudFR5cGUgJiZcbiAgICAgICAgICBhLnNvdXJjZSA9PT0gbW9kZVN0YXRlLmFnZW50LnNvdXJjZSxcbiAgICAgIClcbiAgICAgIGNvbnN0IGFnZW50VG9FZGl0ID0gZnJlc2hBZ2VudCB8fCBtb2RlU3RhdGUuYWdlbnRcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8RGlhbG9nXG4gICAgICAgICAgICB0aXRsZT17YEVkaXQgYWdlbnQ6ICR7YWdlbnRUb0VkaXQuYWdlbnRUeXBlfWB9XG4gICAgICAgICAgICBvbkNhbmNlbD17KCkgPT4gc2V0TW9kZVN0YXRlKG1vZGVTdGF0ZS5wcmV2aW91c01vZGUpfVxuICAgICAgICAgICAgaGlkZUlucHV0R3VpZGVcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8QWdlbnRFZGl0b3JcbiAgICAgICAgICAgICAgYWdlbnQ9e2FnZW50VG9FZGl0fVxuICAgICAgICAgICAgICB0b29scz17bWVyZ2VkVG9vbHN9XG4gICAgICAgICAgICAgIG9uU2F2ZWQ9e21lc3NhZ2UgPT4ge1xuICAgICAgICAgICAgICAgIGhhbmRsZUFnZW50Q3JlYXRlZChtZXNzYWdlKVxuICAgICAgICAgICAgICAgIHNldE1vZGVTdGF0ZShtb2RlU3RhdGUucHJldmlvdXNNb2RlKVxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBvbkJhY2s9eygpID0+IHNldE1vZGVTdGF0ZShtb2RlU3RhdGUucHJldmlvdXNNb2RlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9EaWFsb2c+XG4gICAgICAgICAgPEFnZW50TmF2aWdhdGlvbkZvb3RlciAvPlxuICAgICAgICA8Lz5cbiAgICAgIClcbiAgICB9XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG51bGxcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxNQUFNLE9BQU87QUFDekIsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxXQUFXLEVBQUVDLE9BQU8sRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDdEQsY0FBY0MsYUFBYSxRQUFRLGlDQUFpQztBQUNwRSxjQUFjQyxvQkFBb0IsUUFBUSxtQkFBbUI7QUFDN0QsU0FBU0MsOEJBQThCLFFBQVEsK0NBQStDO0FBQzlGLFNBQVNDLGNBQWMsUUFBUSwrQkFBK0I7QUFDOUQsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxXQUFXLEVBQUVDLGNBQWMsUUFBUSx5QkFBeUI7QUFDckUsY0FBY0MsS0FBSyxRQUFRLGVBQWU7QUFDMUMsU0FDRSxLQUFLQyxhQUFhLEVBQ2xCQyxxQkFBcUIsUUFDaEIsdUNBQXVDO0FBQzlDLFNBQ0UsS0FBS0MsZUFBZSxFQUNwQkMsdUJBQXVCLFFBQ2xCLHdDQUF3QztBQUMvQyxTQUFTQyxPQUFPLFFBQVEsdUJBQXVCO0FBQy9DLFNBQVNDLFFBQVEsUUFBUSxvQkFBb0I7QUFDN0MsU0FBU0MsTUFBTSxRQUFRLDJCQUEyQjtBQUNsRCxTQUFTQyxNQUFNLFFBQVEsNEJBQTRCO0FBQ25ELFNBQVNDLFdBQVcsUUFBUSxrQkFBa0I7QUFDOUMsU0FBU0MsV0FBVyxRQUFRLGtCQUFrQjtBQUM5QyxTQUFTQyxxQkFBcUIsUUFBUSw0QkFBNEI7QUFDbEUsU0FBU0MsVUFBVSxRQUFRLGlCQUFpQjtBQUM1QyxTQUFTQyxtQkFB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