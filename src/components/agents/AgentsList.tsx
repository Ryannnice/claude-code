// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 类型依赖 { ResolvedAgent } 来自 ../../tools/AgentTool/agentDisplay.js，用于校准终端渲染的数据契约。
import type { ResolvedAgent } from '../../tools/AgentTool/agentDisplay.js';
// 接入 AGENT_SOURCE_GROUPS、compareAgentsByName、getOverrideSourceLabel、resolveAgentModelDisplay 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_SOURCE_GROUPS, compareAgentsByName, getOverrideSourceLabel, resolveAgentModelDisplay } from '../../tools/AgentTool/agentDisplay.js';
// 类型依赖 { AgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准终端渲染的数据契约。
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js';
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js';
// 引入 Dialog，将 ../design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from '../design-system/Dialog.js';
// 引入 Divider，将 ../design-system/Divider.js 中已经封装好的能力接到本文件流程里。
import { Divider } from '../design-system/Divider.js';
// 引入 getAgentSourceDisplayName，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getAgentSourceDisplayName } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  source: SettingSource | 'all' | 'built-in' | 'plugin';
  agents: ResolvedAgent[];
  // 这个回调绑定到 onBack: () => void;，负责终端渲染在该局部场景下的响应。
  onBack: () => void;
  // 这个回调绑定到 onSelect: (agent: AgentDefinition) => void;，负责终端渲染在该局部场景下的响应。
  onSelect: (agent: AgentDefinition) => void;
  onCreateNew?: () => void;
  changes?: string[];
};
// AgentsList 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AgentsList(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(96);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    source,
    agents,
    onBack,
    onSelect,
    onCreateNew,
    changes
  } = t0;
  // 从 `React.useState(null)` 按位置拆出 selectedAgent、setSelectedAgent，让终端 UI 组件 Agents List分别处理这些返回值。
  const [selectedAgent, setSelectedAgent] = React.useState(null);
  // 从 `React.useState(true)` 按位置拆出 isCreateNewSelected、setIsCreateNewSelected，让终端 UI 组件 Agents List分别处理这些返回值。
  const [isCreateNewSelected, setIsCreateNewSelected] = React.useState(true);
  // t1 暂存 `[...agents].sort(compareAgentsByName)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== agents) {
    // t1 暂存 `[...agents].sort(compareAgentsByName)` 生成的渲染片段，后续返回路径直接复用。
    t1 = [...agents].sort(compareAgentsByName);
    // $[0] 缓存 `agents`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = agents;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // sortedAgents 集合保存`t1`，作为后续临时缓存值处理的输入。
  const sortedAgents = t1;
  // getOverrideInfo保存`_temp`，供终端 UI Agents List后续判断或输出使用。
  const getOverrideInfo = _temp;
  // t2 暂存 `() => <Box><Text color={isCreateNewSelected ? "suggestion...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== isCreateNewSelected) {
    // t2 暂存 `() => <Box><Text color={isCreateNewSelected ? "suggestion...` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => <Box><Text color={isCreateNewSelected ? "suggestion" : undefined}>{isCreateNewSelected ? `${figures.pointer} ` : "  "}</Text><Text color={isCreateNewSelected ? "suggestion" : undefined}>Create new agent</Text></Box>;
    // $[2] 缓存 `isCreateNewSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = isCreateNewSelected;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // renderCreateNewOption 命名 `t2`，让后续代码直接表达这个值的用途。
  const renderCreateNewOption = t2;
  // t3 暂存 `agent_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== isCreateNewSelected || $[5] !== selectedAgent?.agentType || $[6] !== selectedAgent?.source) {
    // t3 暂存 `agent_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = agent_0 => {
      // isBuiltIn标记终端 UI Agents List是否启用对应路径。
      const isBuiltIn = agent_0.source === "built-in";
      // isSelected标记终端 UI Agents List是否启用对应路径。
      const isSelected = !isBuiltIn && !isCreateNewSelected && selectedAgent?.agentType === agent_0.agentType && selectedAgent?.source === agent_0.source;
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        isOverridden,
        overriddenBy
      } = getOverrideInfo(agent_0);
      // dimmed标记终端 UI Agents List是否启用对应路径。
      const dimmed = isBuiltIn || isOverridden;
      // textColor标记终端 UI Agents List是否启用对应路径。
      const textColor = !isBuiltIn && isSelected ? "suggestion" : undefined;
      // resolvedModel读取`resolveAgentModelDisplay`，供终端渲染后续处理使用。
      const resolvedModel = resolveAgentModelDisplay(agent_0);
      // 返回 `<Box key={`${agent_0.agentType}-${agent_0.source}`}><Text dimColor={dim...`，作为终端渲染这次计算的结果。
      return <Box key={`${agent_0.agentType}-${agent_0.source}`}><Text dimColor={dimmed && !isSelected} color={textColor}>{isBuiltIn ? "" : isSelected ? `${figures.pointer} ` : "  "}</Text><Text dimColor={dimmed && !isSelected} color={textColor}>{agent_0.agentType}</Text>{resolvedModel && <Text dimColor={true} color={textColor}>{" \xB7 "}{resolvedModel}</Text>}{agent_0.memory && <Text dimColor={true} color={textColor}>{" \xB7 "}{agent_0.memory} memory</Text>}{overriddenBy && <Text dimColor={!isSelected} color={isSelected ? "warning" : undefined}>{" "}{figures.warning} shadowed by {getOverrideSourceLabel(overriddenBy)}</Text>}</Box>;
    };
    // $[4] 缓存 `isCreateNewSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = isCreateNewSelected;
    // $[5] 缓存 `selectedAgent?.agentType`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = selectedAgent?.agentType;
    // $[6] 缓存 `selectedAgent?.source`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = selectedAgent?.source;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // renderAgent 命名 `t3`，让后续代码直接表达这个值的用途。
  const renderAgent = t3;
  // t4 暂存 `AGENT_SOURCE_GROUPS.filter(_temp3).flatMap(t5 => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== sortedAgents || $[9] !== source) {
    // 终端 UI 组件 Agents List在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // nonBuiltIn筛选`sortedAgents.filter`，供终端渲染后续处理使用。
      const nonBuiltIn = sortedAgents.filter(_temp2);
      // 当 `source` 匹配 `"all"` 时，终端渲染执行对应分支。
      if (source === "all") {
        // t4 暂存 `AGENT_SOURCE_GROUPS.filter(_temp3).flatMap(t5 => {` 生成的渲染片段，后续返回路径直接复用。
        t4 = AGENT_SOURCE_GROUPS.filter(_temp3).flatMap(t5 => {
          // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
          const {
            source: groupSource
          } = t5;
          // 返回 `nonBuiltIn.filter(a_0 => a_0.source === groupSource)`，作为终端渲染这次计算的结果。
          return nonBuiltIn.filter(a_0 => a_0.source === groupSource);
        });
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // t4 暂存 `nonBuiltIn` 生成的渲染片段，后续返回路径直接复用。
      t4 = nonBuiltIn;
    }
    // $[8] 缓存 `sortedAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = sortedAgents;
    // $[9] 缓存 `source`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = source;
    // $[10] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[10];
  }
  // selectableAgentsInOrder保存`t4`，作为后续临时缓存值处理的输入。
  const selectableAgentsInOrder = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 暂存 `[selectableAgentsInOrder, selectedAgent, isCreateNewSelec...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== isCreateNewSelected || $[12] !== onCreateNew || $[13] !== selectableAgentsInOrder || $[14] !== selectedAgent) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 只有 `!selectedAgent && !isCreateNewSelected && selecta` 满足时，终端渲染才执行该分支。
      if (!selectedAgent && !isCreateNewSelected && selectableAgentsInOrder.length > 0) {
        // 满足 `onCreateNew` 时，终端渲染执行该分支。
        if (onCreateNew) {
          // setIsCreateNewSelected 写入新的状态值，使终端渲染后续读取保持一致。
          setIsCreateNewSelected(true);
        } else {
          // setSelectedAgent 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedAgent(selectableAgentsInOrder[0] || null);
        }
      }
    };
    // t6 暂存 `[selectableAgentsInOrder, selectedAgent, isCreateNewSelec...` 生成的渲染片段，后续返回路径直接复用。
    t6 = [selectableAgentsInOrder, selectedAgent, isCreateNewSelected, onCreateNew];
    // $[11] 缓存 `isCreateNewSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = isCreateNewSelected;
    // $[12] 缓存 `onCreateNew`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = onCreateNew;
    // $[13] 缓存 `selectableAgentsInOrder`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = selectableAgentsInOrder;
    // $[14] 缓存 `selectedAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = selectedAgent;
    // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t5;
    // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[15];
    // t6 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[16];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t5, t6);
  // t7 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[17] !== isCreateNewSelected || $[18] !== onCreateNew || $[19] !== onSelect || $[20] !== selectableAgentsInOrder || $[21] !== selectedAgent) {
    // t7 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = e => {
      // 当 `e.key` 匹配 `"return"` 时，终端渲染执行对应分支。
      if (e.key === "return") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 只有 `isCreateNewSelected && onCreateNew` 满足时，终端渲染才执行该分支。
        if (isCreateNewSelected && onCreateNew) {
          // 调用 onCreateNew，触发终端渲染此处需要的副作用。
          onCreateNew();
        } else {
          // 满足 `selectedAgent` 时，终端渲染执行该分支。
          if (selectedAgent) {
            // 调用 onSelect，触发终端渲染此处需要的副作用。
            onSelect(selectedAgent);
          }
        }
        // 终端 UI 组件 Agents List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // `e.key` 与 `"up" && e.key !== "down"` 不一致时刷新派生状态，避免使用过期结果。
      if (e.key !== "up" && e.key !== "down") {
        // 终端 UI 组件 Agents List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
      e.preventDefault();
      // hasCreateOption标记终端 UI Agents List是否启用对应路径。
      const hasCreateOption = !!onCreateNew;
      // totalItems 集合保存 `selectableAgentsInOrder.length + (hasCreateOption ? 1 : 0)` 的判断结果，供终端 UI Agents List后续分支直接复用。
      const totalItems = selectableAgentsInOrder.length + (hasCreateOption ? 1 : 0);
      // 满足 `totalItems === 0` 时，终端渲染执行该分支。
      if (totalItems === 0) {
        // 终端 UI 组件 Agents List在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // currentPosition保存`0`，供终端 UI Agents List后续判断或输出使用。
      let currentPosition = 0;
      // 只有 `!isCreateNewSelected && selectedAgent` 满足时，终端渲染才执行该分支。
      if (!isCreateNewSelected && selectedAgent) {
        // agentIndex 索引筛选`selectableAgentsInOrder.findIndex`，供终端渲染后续处理使用。
        const agentIndex = selectableAgentsInOrder.findIndex(a_1 => a_1.agentType === selectedAgent.agentType && a_1.source === selectedAgent.source);
        // 满足 `agentIndex >= 0` 时，终端渲染执行该分支。
        if (agentIndex >= 0) {
          // currentPosition更新为 `hasCreateOption ? agentIndex + 1 : agentIndex`，确保Agent 配置界面后续读取最新状态。
          currentPosition = hasCreateOption ? agentIndex + 1 : agentIndex;
        }
      }
      // newPosition标记终端 UI Agents List是否启用对应路径。
      const newPosition = e.key === "up" ? currentPosition === 0 ? totalItems - 1 : currentPosition - 1 : currentPosition === totalItems - 1 ? 0 : currentPosition + 1;
      // 只有 `hasCreateOption && newPosition === 0` 满足时，终端渲染才执行该分支。
      if (hasCreateOption && newPosition === 0) {
        // setIsCreateNewSelected 写入新的状态值，使终端渲染后续读取保持一致。
        setIsCreateNewSelected(true);
        // setSelectedAgent 写入新的状态值，使终端渲染后续读取保持一致。
        setSelectedAgent(null);
      } else {
        // agentIndex_0 索引保存`hasCreateOption ? newPosition - 1 : newPosition`，供终端 UI Agents List后续判断或输出使用。
        const agentIndex_0 = hasCreateOption ? newPosition - 1 : newPosition;
        // newAgent 命名 `selectableAgentsInOrder[agentIndex_0]`，让后续代码直接表达这个值的用途。
        const newAgent = selectableAgentsInOrder[agentIndex_0];
        // 满足 `newAgent` 时，终端渲染执行该分支。
        if (newAgent) {
          // setIsCreateNewSelected 写入新的状态值，使终端渲染后续读取保持一致。
          setIsCreateNewSelected(false);
          // setSelectedAgent 写入新的状态值，使终端渲染后续读取保持一致。
          setSelectedAgent(newAgent);
        }
      }
    };
    // $[17] 缓存 `isCreateNewSelected`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = isCreateNewSelected;
    // $[18] 缓存 `onCreateNew`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = onCreateNew;
    // $[19] 缓存 `onSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = onSelect;
    // $[20] 缓存 `selectableAgentsInOrder`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = selectableAgentsInOrder;
    // $[21] 缓存 `selectedAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = selectedAgent;
    // $[22] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[22];
  }
  // handleKeyDown保存`t7`，作为后续临时缓存值处理的输入。
  const handleKeyDown = t7;
  // t8 暂存 `t9 => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== renderAgent || $[24] !== sortedAgents) {
    // t8 暂存 `t9 => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = t9 => {
      // title 标题保存`in`，供终端渲染后续处理使用。
      const title = t9 === undefined ? "Built-in (always available):" : t9;
      // builtInAgents 集合筛选`sortedAgents.filter`，供终端渲染后续处理使用。
      const builtInAgents = sortedAgents.filter(_temp4);
      // 返回 `<Box flexDirection="column" marginBottom={1} paddingLeft={2}><Text bold...`，作为终端渲染这次计算的结果。
      return <Box flexDirection="column" marginBottom={1} paddingLeft={2}><Text bold={true} dimColor={true}>{title}</Text>{builtInAgents.map(renderAgent)}</Box>;
    };
    // $[23] 缓存 `renderAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = renderAgent;
    // $[24] 缓存 `sortedAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = sortedAgents;
    // $[25] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[25];
  }
  // renderBuiltInAgentsSection保存`t8`，作为后续临时缓存值处理的输入。
  const renderBuiltInAgentsSection = t8;
  // t9 暂存 `(title_0, groupAgents) => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== renderAgent) {
    // t9 暂存 `(title_0, groupAgents) => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = (title_0, groupAgents) => {
      // groupAgents.length 数量缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!groupAgents.length) {
        // 返回 `null`，作为终端渲染这次计算的结果。
        return null;
      }
      // folderPath 路径数据读取 `groupAgents[0]?.baseDir` 对应条目，后续围绕该成员继续处理。
      const folderPath = groupAgents[0]?.baseDir;
      // 返回 `<Box flexDirection="column" marginBottom={1}><Box paddingLeft={2}><Text...`，作为终端渲染这次计算的结果。
      return <Box flexDirection="column" marginBottom={1}><Box paddingLeft={2}><Text bold={true} dimColor={true}>{title_0}</Text>{folderPath && <Text dimColor={true}> ({folderPath})</Text>}</Box>{groupAgents.map(agent_1 => renderAgent(agent_1))}</Box>;
    };
    // $[26] 缓存 `renderAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = renderAgent;
    // $[27] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[27];
  }
  // renderAgentGroup保存`t9`，作为后续临时缓存值处理的输入。
  const renderAgentGroup = t9;
  // t10 暂存 `getAgentSourceDisplayName(source)` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== source) {
    // t10 暂存 `getAgentSourceDisplayName(source)` 生成的渲染片段，后续返回路径直接复用。
    t10 = getAgentSourceDisplayName(source);
    // $[28] 缓存 `source`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = source;
    // $[29] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[29];
  }
  // sourceTitle 标题 命名 `t10`，让后续代码直接表达这个值的用途。
  const sourceTitle = t10;
  // T0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T0;
  // T1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let T1;
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
  // t17 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t17;
  // t18 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t18;
  // t19 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t19;
  // t20 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t20;
  // t21 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t21;
  // t22 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== changes || $[31] !== handleKeyDown || $[32] !== onBack || $[33] !== onCreateNew || $[34] !== renderAgent || $[35] !== renderAgentGroup || $[36] !== renderBuiltInAgentsSection || $[37] !== renderCreateNewOption || $[38] !== sortedAgents || $[39] !== source || $[40] !== sourceTitle) {
    // t22 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t22 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 Agents List在这里处理 `bb1: {`，完成这一小步状态转换。
    bb1: {
      // builtInAgents_0筛选`sortedAgents.filter`，供终端渲染后续处理使用。
      const builtInAgents_0 = sortedAgents.filter(_temp5);
      // hasNoAgents 集合记录 `sortedAgents.some` 是否成立，终端渲染随后按该结果分支。
      const hasNoAgents = !sortedAgents.length || source !== "built-in" && !sortedAgents.some(_temp6);
      // 满足 `hasNoAgents` 时，终端渲染执行该分支。
      if (hasNoAgents) {
        // t23 暂存 `onCreateNew && <Box>{renderCreateNewOption()}</Box>` 的派生结果，便于缓存命中时直接复用。
        let t23;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[55] !== onCreateNew || $[56] !== renderCreateNewOption) {
          // t23 暂存 `onCreateNew && <Box>{renderCreateNewOption()}</Box>` 生成的渲染片段，后续返回路径直接复用。
          t23 = onCreateNew && <Box>{renderCreateNewOption()}</Box>;
          // $[55] 缓存 `onCreateNew`，下次依赖未变时 React 编译产物可直接复用。
          $[55] = onCreateNew;
          // $[56] 缓存 `renderCreateNewOption`，下次依赖未变时 React 编译产物可直接复用。
          $[56] = renderCreateNewOption;
          // $[57] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[57] = t23;
        } else {
          // t23 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
          t23 = $[57];
        }
        // t24 暂存 `<Text dimColor={true}>No agents found. Create specialized...` 的派生结果，便于缓存命中时直接复用。
        let t24;
        // t25 暂存 `<Text dimColor={true}>Each subagent has its own context w...` 的派生结果，便于缓存命中时直接复用。
        let t25;
        // t26 暂存 `<Text dimColor={true}>Try creating: Code Reviewer, Code S...` 的派生结果，便于缓存命中时直接复用。
        let t26;
        // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
        if ($[58] === Symbol.for("react.memo_cache_sentinel")) {
          // t24 暂存 `<Text dimColor={true}>No agents found. Create specialized...` 生成的渲染片段，后续返回路径直接复用。
          t24 = <Text dimColor={true}>No agents found. Create specialized subagents that Claude can delegate to.</Text>;
          // t25 暂存 `<Text dimColor={true}>Each subagent has its own context w...` 生成的渲染片段，后续返回路径直接复用。
          t25 = <Text dimColor={true}>Each subagent has its own context window, custom system prompt, and specific tools.</Text>;
          // t26 暂存 `<Text dimColor={true}>Try creating: Code Reviewer, Code S...` 生成的渲染片段，后续返回路径直接复用。
          t26 = <Text dimColor={true}>Try creating: Code Reviewer, Code Simplifier, Security Reviewer, Tech Lead, or UX Reviewer.</Text>;
          // $[58] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
          $[58] = t24;
          // $[59] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
          $[59] = t25;
          // $[60] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
          $[60] = t26;
        } else {
          // t24 从 React 编译缓存槽 $[58] 取回渲染片段，避免依赖未变时重建 JSX。
          t24 = $[58];
          // t25 从 React 编译缓存槽 $[59] 取回渲染片段，避免依赖未变时重建 JSX。
          t25 = $[59];
          // t26 从 React 编译缓存槽 $[60] 取回渲染片段，避免依赖未变时重建 JSX。
          t26 = $[60];
        }
        // t27 暂存 `source !== "built-in" && sortedAgents.some(_temp7) && <><...` 的派生结果，便于缓存命中时直接复用。
        let t27;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[61] !== renderBuiltInAgentsSection || $[62] !== sortedAgents || $[63] !== source) {
          // t27 暂存 `source !== "built-in" && sortedAgents.some(_temp7) && <><...` 生成的渲染片段，后续返回路径直接复用。
          t27 = source !== "built-in" && sortedAgents.some(_temp7) && <><Divider />{renderBuiltInAgentsSection()}</>;
          // $[61] 缓存 `renderBuiltInAgentsSection`，下次依赖未变时 React 编译产物可直接复用。
          $[61] = renderBuiltInAgentsSection;
          // $[62] 缓存 `sortedAgents`，下次依赖未变时 React 编译产物可直接复用。
          $[62] = sortedAgents;
          // $[63] 缓存 `source`，下次依赖未变时 React 编译产物可直接复用。
          $[63] = source;
          // $[64] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
          $[64] = t27;
        } else {
          // t27 从 React 编译缓存槽 $[64] 取回渲染片段，避免依赖未变时重建 JSX。
          t27 = $[64];
        }
        // t28 暂存 `<Box flexDirection="column" gap={1} tabIndex={0} autoFocu...` 的派生结果，便于缓存命中时直接复用。
        let t28;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[65] !== handleKeyDown || $[66] !== t23 || $[67] !== t27) {
          // t28 暂存 `<Box flexDirection="column" gap={1} tabIndex={0} autoFocu...` 生成的渲染片段，后续返回路径直接复用。
          t28 = <Box flexDirection="column" gap={1} tabIndex={0} autoFocus={true} onKeyDown={handleKeyDown}>{t23}{t24}{t25}{t26}{t27}</Box>;
          // $[65] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
          $[65] = handleKeyDown;
          // $[66] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
          $[66] = t23;
          // $[67] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
          $[67] = t27;
          // $[68] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
          $[68] = t28;
        } else {
          // t28 从 React 编译缓存槽 $[68] 取回渲染片段，避免依赖未变时重建 JSX。
          t28 = $[68];
        }
        // t29 暂存 `<Dialog title={sourceTitle} subtitle="No agents found" on...` 的派生结果，便于缓存命中时直接复用。
        let t29;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[69] !== onBack || $[70] !== sourceTitle || $[71] !== t28) {
          // t29 暂存 `<Dialog title={sourceTitle} subtitle="No agents found" on...` 生成的渲染片段，后续返回路径直接复用。
          t29 = <Dialog title={sourceTitle} subtitle="No agents found" onCancel={onBack} hideInputGuide={true}>{t28}</Dialog>;
          // $[69] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
          $[69] = onBack;
          // $[70] 缓存 `sourceTitle`，下次依赖未变时 React 编译产物可直接复用。
          $[70] = sourceTitle;
          // $[71] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
          $[71] = t28;
          // $[72] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
          $[72] = t29;
        } else {
          // t29 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
          t29 = $[72];
        }
        // t22 暂存 `t29` 生成的渲染片段，后续返回路径直接复用。
        t22 = t29;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb1;
      }
      // T1 暂存 `Dialog` 生成的渲染片段，后续返回路径直接复用。
      T1 = Dialog;
      // t17 暂存 `sourceTitle` 生成的渲染片段，后续返回路径直接复用。
      t17 = sourceTitle;
      // t23 暂存 `count(sortedAgents, _temp8)` 的派生结果，便于缓存命中时直接复用。
      let t23;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[73] !== sortedAgents) {
        // t23 暂存 `count(sortedAgents, _temp8)` 生成的渲染片段，后续返回路径直接复用。
        t23 = count(sortedAgents, _temp8);
        // $[73] 缓存 `sortedAgents`，下次依赖未变时 React 编译产物可直接复用。
        $[73] = sortedAgents;
        // $[74] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
        $[74] = t23;
      } else {
        // t23 从 React 编译缓存槽 $[74] 取回渲染片段，避免依赖未变时重建 JSX。
        t23 = $[74];
      }
      // t18 暂存 ``${t23} agents`` 生成的渲染片段，后续返回路径直接复用。
      t18 = `${t23} agents`;
      // t19 暂存 `onBack` 生成的渲染片段，后续返回路径直接复用。
      t19 = onBack;
      // t20 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
      t20 = true;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[75] !== changes) {
        // t21 暂存 `changes && changes.length > 0 && <Box marginTop={1}><Text...` 生成的渲染片段，后续返回路径直接复用。
        t21 = changes && changes.length > 0 && <Box marginTop={1}><Text dimColor={true}>{changes[changes.length - 1]}</Text></Box>;
        // $[75] 缓存 `changes`，下次依赖未变时 React 编译产物可直接复用。
        $[75] = changes;
        // $[76] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
        $[76] = t21;
      } else {
        // t21 从 React 编译缓存槽 $[76] 取回渲染片段，避免依赖未变时重建 JSX。
        t21 = $[76];
      }
      // T0 暂存 `Box` 生成的渲染片段，后续返回路径直接复用。
      T0 = Box;
      // t11 暂存 `"column"` 生成的渲染片段，后续返回路径直接复用。
      t11 = "column";
      // t12 暂存 `0` 生成的渲染片段，后续返回路径直接复用。
      t12 = 0;
      // t13 暂存 `true` 生成的渲染片段，后续返回路径直接复用。
      t13 = true;
      // t14 暂存 `handleKeyDown` 生成的渲染片段，后续返回路径直接复用。
      t14 = handleKeyDown;
      // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
      if ($[77] !== onCreateNew || $[78] !== renderCreateNewOption) {
        // t15 暂存 `onCreateNew && <Box marginBottom={1}>{renderCreateNewOpti...` 生成的渲染片段，后续返回路径直接复用。
        t15 = onCreateNew && <Box marginBottom={1}>{renderCreateNewOption()}</Box>;
        // $[77] 缓存 `onCreateNew`，下次依赖未变时 React 编译产物可直接复用。
        $[77] = onCreateNew;
        // $[78] 缓存 `renderCreateNewOption`，下次依赖未变时 React 编译产物可直接复用。
        $[78] = renderCreateNewOption;
        // $[79] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
        $[79] = t15;
      } else {
        // t15 从 React 编译缓存槽 $[79] 取回渲染片段，避免依赖未变时重建 JSX。
        t15 = $[79];
      }
      // t16 暂存 `source === "all" ? <>{AGENT_SOURCE_GROUPS.filter(_temp9)....` 生成的渲染片段，后续返回路径直接复用。
      t16 = source === "all" ? <>{AGENT_SOURCE_GROUPS.filter(_temp9).map(t24 => {
          // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
          const {
            label,
            source: groupSource_0
          } = t24;
          {/* 返回 <React.Fragment key={groupSource_0}>{renderAgentGroup(label, sortedAgents.filter(a_7 => a_7.so…，把终端渲染这个分支的结果交还调用方。 */}
          return <React.Fragment key={groupSource_0}>{renderAgentGroup(label, sortedAgents.filter(a_7 => a_7.source === groupSource_0))}</React.Fragment>;
        // 这个回调绑定到 })}{builtInAgents_0.length > 0 && <Box flexDirection="column" marginBottom={1} paddi…，负责终端渲染在该局部场景下的响应。
        })}{builtInAgents_0.length > 0 && <Box flexDirection="column" marginBottom={1} paddingLeft={2}><Text dimColor={true}><Text bold={true}>Built-in agents</Text> (always available)</Text>{builtInAgents_0.map(renderAgent)}</Box>}</> : source === "built-in" ? <><Text dimColor={true} italic={true}>Built-in agents are provided by default and cannot be modified.</Text><Box marginTop={1} flexDirection="column">{sortedAgents.map(agent_2 => renderAgent(agent_2))}</Box></> : <>{sortedAgents.filter(_temp0).map(agent_3 => renderAgent(agent_3))}{sortedAgents.some(_temp1) && <><Divider />{renderBuiltInAgentsSection()}</>}</>;
    }
    // $[30] 缓存 `changes`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = changes;
    // $[31] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = handleKeyDown;
    // $[32] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = onBack;
    // $[33] 缓存 `onCreateNew`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = onCreateNew;
    // $[34] 缓存 `renderAgent`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = renderAgent;
    // $[35] 缓存 `renderAgentGroup`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = renderAgentGroup;
    // $[36] 缓存 `renderBuiltInAgentsSection`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = renderBuiltInAgentsSection;
    // $[37] 缓存 `renderCreateNewOption`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = renderCreateNewOption;
    // $[38] 缓存 `sortedAgents`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = sortedAgents;
    // $[39] 缓存 `source`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = source;
    // $[40] 缓存 `sourceTitle`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = sourceTitle;
    // $[41] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = T0;
    // $[42] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = T1;
    // $[43] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t11;
    // $[44] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t12;
    // $[45] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t13;
    // $[46] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t14;
    // $[47] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t15;
    // $[48] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t16;
    // $[49] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t17;
    // $[50] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t18;
    // $[51] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t19;
    // $[52] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t20;
    // $[53] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t21;
    // $[54] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = t22;
  } else {
    // T0 从 React 编译缓存槽 $[41] 取回渲染片段，避免依赖未变时重建 JSX。
    T0 = $[41];
    // T1 从 React 编译缓存槽 $[42] 取回渲染片段，避免依赖未变时重建 JSX。
    T1 = $[42];
    // t11 从 React 编译缓存槽 $[43] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[43];
    // t12 从 React 编译缓存槽 $[44] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[44];
    // t13 从 React 编译缓存槽 $[45] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[45];
    // t14 从 React 编译缓存槽 $[46] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[46];
    // t15 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[47];
    // t16 从 React 编译缓存槽 $[48] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[48];
    // t17 从 React 编译缓存槽 $[49] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[49];
    // t18 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[50];
    // t19 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[51];
    // t20 从 React 编译缓存槽 $[52] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[52];
    // t21 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[53];
    // t22 从 React 编译缓存槽 $[54] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[54];
  }
  // `t22` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t22 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t22`，作为终端渲染这次计算的结果。
    return t22;
  }
  // t23 暂存 `<T0 flexDirection={t11} tabIndex={t12} autoFocus={t13} on...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[80] !== T0 || $[81] !== t11 || $[82] !== t12 || $[83] !== t13 || $[84] !== t14 || $[85] !== t15 || $[86] !== t16) {
    // t23 暂存 `<T0 flexDirection={t11} tabIndex={t12} autoFocus={t13} on...` 生成的渲染片段，后续返回路径直接复用。
    t23 = <T0 flexDirection={t11} tabIndex={t12} autoFocus={t13} onKeyDown={t14}>{t15}{t16}</T0>;
    // $[80] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = T0;
    // $[81] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = t11;
    // $[82] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = t12;
    // $[83] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = t13;
    // $[84] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[84] = t14;
    // $[85] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[85] = t15;
    // $[86] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[86] = t16;
    // $[87] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[87] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[87] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[87];
  }
  // t24 暂存 `<T1 title={t17} subtitle={t18} onCancel={t19} hideInputGu...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[88] !== T1 || $[89] !== t17 || $[90] !== t18 || $[91] !== t19 || $[92] !== t20 || $[93] !== t21 || $[94] !== t23) {
    // t24 暂存 `<T1 title={t17} subtitle={t18} onCancel={t19} hideInputGu...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <T1 title={t17} subtitle={t18} onCancel={t19} hideInputGuide={t20}>{t21}{t23}</T1>;
    // $[88] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[88] = T1;
    // $[89] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[89] = t17;
    // $[90] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[90] = t18;
    // $[91] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[91] = t19;
    // $[92] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[92] = t20;
    // $[93] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[93] = t21;
    // $[94] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[94] = t23;
    // $[95] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[95] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[95] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[95];
  }
  // 返回 `t24`，作为终端渲染这次计算的结果。
  return t24;
}
// _temp1 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp1(a_9) {
  // 返回 `a_9.source === "built-in"`，作为终端渲染这次计算的结果。
  return a_9.source === "built-in";
}
// _temp0 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp0(a_8) {
  // 返回 `a_8.source !== "built-in"`，作为终端渲染这次计算的结果。
  return a_8.source !== "built-in";
}
// _temp9 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp9(g_0) {
  // 返回 `g_0.source !== "built-in"`，作为终端渲染这次计算的结果。
  return g_0.source !== "built-in";
}
// _temp8 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8(a_6) {
  // 返回 `!a_6.overriddenBy`，作为终端渲染这次计算的结果。
  return !a_6.overriddenBy;
}
// _temp7 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(a_5) {
  // 返回 `a_5.source === "built-in"`，作为终端渲染这次计算的结果。
  return a_5.source === "built-in";
}
// _temp6 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(a_4) {
  // 返回 `a_4.source !== "built-in"`，作为终端渲染这次计算的结果。
  return a_4.source !== "built-in";
}
// _temp5 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(a_3) {
  // 返回 `a_3.source === "built-in"`，作为终端渲染这次计算的结果。
  return a_3.source === "built-in";
}
// _temp4 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(a_2) {
  // 返回 `a_2.source === "built-in"`，作为终端渲染这次计算的结果。
  return a_2.source === "built-in";
}
// _temp3 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(g) {
  // 返回 `g.source !== "built-in"`，作为终端渲染这次计算的结果。
  return g.source !== "built-in";
}
// _temp2 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(a) {
  // 返回 `a.source !== "built-in"`，作为终端渲染这次计算的结果。
  return a.source !== "built-in";
}
// _temp 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(agent) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    isOverridden: !!agent.overriddenBy,
    overriddenBy: agent.overriddenBy || null
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJTZXR0aW5nU291cmNlIiwiS2V5Ym9hcmRFdmVudCIsIkJveCIsIlRleHQiLCJSZXNvbHZlZEFnZW50IiwiQUdFTlRfU09VUkNFX0dST1VQUyIsImNvbXBhcmVBZ2VudHNCeU5hbWUiLCJnZXRPdmVycmlkZVNvdXJjZUxhYmVsIiwicmVzb2x2ZUFnZW50TW9kZWxEaXNwbGF5IiwiQWdlbnREZWZpbml0aW9uIiwiY291bnQiLCJEaWFsb2ciLCJEaXZpZGVyIiwiZ2V0QWdlbnRTb3VyY2VEaXNwbGF5TmFtZSIsIlByb3BzIiwic291cmNlIiwiYWdlbnRzIiwib25CYWNrIiwib25TZWxlY3QiLCJhZ2VudCIsIm9uQ3JlYXRlTmV3IiwiY2hhbmdlcyIsIkFnZW50c0xpc3QiLCJ0MCIsIiQiLCJfYyIsInNlbGVjdGVkQWdlbnQiLCJzZXRTZWxlY3RlZEFnZW50IiwidXNlU3RhdGUiLCJpc0NyZWF0ZU5ld1NlbGVjdGVkIiwic2V0SXNDcmVhdGVOZXdTZWxlY3RlZCIsInQxIiwic29ydCIsInNvcnRlZEFnZW50cyIsImdldE92ZXJyaWRlSW5mbyIsIl90ZW1wIiwidDIiLCJ1bmRlZmluZWQiLCJwb2ludGVyIiwicmVuZGVyQ3JlYXRlTmV3T3B0aW9uIiwidDMiLCJhZ2VudFR5cGUiLCJhZ2VudF8wIiwiaXNCdWlsdEluIiwiaXNTZWxlY3RlZCIsImlzT3ZlcnJpZGRlbiIsIm92ZXJyaWRkZW5CeSIsImRpbW1lZCIsInRleHRDb2xvciIsInJlc29sdmVkTW9kZWwiLCJtZW1vcnkiLCJ3YXJuaW5nIiwicmVuZGVyQWdlbnQiLCJ0NCIsImJiMCIsIm5vbkJ1aWx0SW4iLCJmaWx0ZXIiLCJfdGVtcDIiLCJfdGVtcDMiLCJmbGF0TWFwIiwidDUiLCJncm91cFNvdXJjZSIsImFfMCIsImEiLCJzZWxlY3RhYmxlQWdlbnRzSW5PcmRlciIsInQ2IiwibGVuZ3RoIiwidXNlRWZmZWN0IiwidDciLCJlIiwia2V5IiwicHJldmVudERlZmF1bHQiLCJoYXNDcmVhdGVPcHRpb24iLCJ0b3RhbEl0ZW1zIiwiY3VycmVudFBvc2l0aW9uIiwiYWdlbnRJbmRleCIsImZpbmRJbmRleCIsImFfMSIsIm5ld1Bvc2l0aW9uIiwiYWdlbnRJbmRleF8wIiwibmV3QWdlbnQiLCJoYW5kbGVLZXlEb3duIiwidDgiLCJ0OSIsInRpdGxlIiwiYnVpbHRJbkFnZW50cyIsIl90ZW1wNCIsIm1hcCIsInJlbmRlckJ1aWx0SW5BZ2VudHNTZWN0aW9uIiwidGl0bGVfMCIsImdyb3VwQWdlbnRzIiwiZm9sZGVyUGF0aCIsImJhc2VEaXIiLCJhZ2VudF8xIiwicmVuZGVyQWdlbnRHcm91cCIsInQxMCIsInNvdXJjZVRpdGxlIiwiVDAiLCJUMSIsInQxMSIsInQxMiIsInQxMyIsInQxNCIsInQxNSIsInQxNiIsInQxNyIsInQxOCIsInQxOSIsInQyMCIsInQyMSIsInQyMiIsIlN5bWJvbCIsImZvciIsImJiMSIsImJ1aWx0SW5BZ2VudHNfMCIsIl90ZW1wNSIsImhhc05vQWdlbnRzIiwic29tZSIsIl90ZW1wNiIsInQyMyIsInQyNCIsInQyNSIsInQyNiIsInQyNyIsIl90ZW1wNyIsInQyOCIsInQyOSIsIl90ZW1wOCIsIl90ZW1wOSIsImxhYmVsIiwiZ3JvdXBTb3VyY2VfMCIsImFfNyIsImFnZW50XzIiLCJfdGVtcDAiLCJhZ2VudF8zIiwiX3RlbXAxIiwiYV85IiwiYV84IiwiZ18wIiwiZyIsImFfNiIsImFfNSIsImFfNCIsImFfMyIsImFfMiJdLCJzb3VyY2VzIjpbIkFnZW50c0xpc3QudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmaWd1cmVzIGZyb20gJ2ZpZ3VyZXMnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgU2V0dGluZ1NvdXJjZSB9IGZyb20gJ3NyYy91dGlscy9zZXR0aW5ncy9jb25zdGFudHMuanMnXG5pbXBvcnQgdHlwZSB7IEtleWJvYXJkRXZlbnQgfSBmcm9tICcuLi8uLi9pbmsvZXZlbnRzL2tleWJvYXJkLWV2ZW50LmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHR5cGUgeyBSZXNvbHZlZEFnZW50IH0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50RGlzcGxheS5qcydcbmltcG9ydCB7XG4gIEFHRU5UX1NPVVJDRV9HUk9VUFMsXG4gIGNvbXBhcmVBZ2VudHNCeU5hbWUsXG4gIGdldE92ZXJyaWRlU291cmNlTGFiZWwsXG4gIHJlc29sdmVBZ2VudE1vZGVsRGlzcGxheSxcbn0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50RGlzcGxheS5qcydcbmltcG9ydCB0eXBlIHsgQWdlbnREZWZpbml0aW9uIH0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2xvYWRBZ2VudHNEaXIuanMnXG5pbXBvcnQgeyBjb3VudCB9IGZyb20gJy4uLy4uL3V0aWxzL2FycmF5LmpzJ1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9EaWFsb2cuanMnXG5pbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSAnLi4vZGVzaWduLXN5c3RlbS9EaXZpZGVyLmpzJ1xuaW1wb3J0IHsgZ2V0QWdlbnRTb3VyY2VEaXNwbGF5TmFtZSB9IGZyb20gJy4vdXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIHNvdXJjZTogU2V0dGluZ1NvdXJjZSB8ICdhbGwnIHwgJ2J1aWx0LWluJyB8ICdwbHVnaW4nXG4gIGFnZW50czogUmVzb2x2ZWRBZ2VudFtdXG4gIG9uQmFjazogKCkgPT4gdm9pZFxuICBvblNlbGVjdDogKGFnZW50OiBBZ2VudERlZmluaXRpb24pID0+IHZvaWRcbiAgb25DcmVhdGVOZXc/OiAoKSA9PiB2b2lkXG4gIGNoYW5nZXM/OiBzdHJpbmdbXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gQWdlbnRzTGlzdCh7XG4gIHNvdXJjZSxcbiAgYWdlbnRzLFxuICBvbkJhY2ssXG4gIG9uU2VsZWN0LFxuICBvbkNyZWF0ZU5ldyxcbiAgY2hhbmdlcyxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3NlbGVjdGVkQWdlbnQsIHNldFNlbGVjdGVkQWdlbnRdID1cbiAgICBSZWFjdC51c2VTdGF0ZTxSZXNvbHZlZEFnZW50IHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2lzQ3JlYXRlTmV3U2VsZWN0ZWQsIHNldElzQ3JlYXRlTmV3U2VsZWN0ZWRdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSlcblxuICAvLyBTb3J0IGFnZW50cyBhbHBoYWJldGljYWxseSBieSBuYW1lIHdpdGhpbiBlYWNoIHNvdXJjZSBncm91cFxuICBjb25zdCBzb3J0ZWRBZ2VudHMgPSBSZWFjdC51c2VNZW1vKFxuICAgICgpID0+IFsuLi5hZ2VudHNdLnNvcnQoY29tcGFyZUFnZW50c0J5TmFtZSksXG4gICAgW2FnZW50c10sXG4gIClcblxuICBjb25zdCBnZXRPdmVycmlkZUluZm8gPSAoYWdlbnQ6IFJlc29sdmVkQWdlbnQpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNPdmVycmlkZGVuOiAhIWFnZW50Lm92ZXJyaWRkZW5CeSxcbiAgICAgIG92ZXJyaWRkZW5CeTogYWdlbnQub3ZlcnJpZGRlbkJ5IHx8IG51bGwsXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmVuZGVyQ3JlYXRlTmV3T3B0aW9uID0gKCkgPT4ge1xuICAgIHJldHVybiAoXG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBjb2xvcj17aXNDcmVhdGVOZXdTZWxlY3RlZCA/ICdzdWdnZXN0aW9uJyA6IHVuZGVmaW5lZH0+XG4gICAgICAgICAge2lzQ3JlYXRlTmV3U2VsZWN0ZWQgPyBgJHtmaWd1cmVzLnBvaW50ZXJ9IGAgOiAnICAnfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGNvbG9yPXtpc0NyZWF0ZU5ld1NlbGVjdGVkID8gJ3N1Z2dlc3Rpb24nIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICBDcmVhdGUgbmV3IGFnZW50XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHJlbmRlckFnZW50ID0gKGFnZW50OiBSZXNvbHZlZEFnZW50KSA9PiB7XG4gICAgY29uc3QgaXNCdWlsdEluID0gYWdlbnQuc291cmNlID09PSAnYnVpbHQtaW4nXG4gICAgY29uc3QgaXNTZWxlY3RlZCA9XG4gICAgICAhaXNCdWlsdEluICYmXG4gICAgICAhaXNDcmVhdGVOZXdTZWxlY3RlZCAmJlxuICAgICAgc2VsZWN0ZWRBZ2VudD8uYWdlbnRUeXBlID09PSBhZ2VudC5hZ2VudFR5cGUgJiZcbiAgICAgIHNlbGVjdGVkQWdlbnQ/LnNvdXJjZSA9PT0gYWdlbnQuc291cmNlXG5cbiAgICBjb25zdCB7IGlzT3ZlcnJpZGRlbiwgb3ZlcnJpZGRlbkJ5IH0gPSBnZXRPdmVycmlkZUluZm8oYWdlbnQpXG4gICAgY29uc3QgZGltbWVkID0gaXNCdWlsdEluIHx8IGlzT3ZlcnJpZGRlblxuICAgIGNvbnN0IHRleHRDb2xvciA9ICFpc0J1aWx0SW4gJiYgaXNTZWxlY3RlZCA/ICdzdWdnZXN0aW9uJyA6IHVuZGVmaW5lZFxuXG4gICAgY29uc3QgcmVzb2x2ZWRNb2RlbCA9IHJlc29sdmVBZ2VudE1vZGVsRGlzcGxheShhZ2VudClcblxuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGtleT17YCR7YWdlbnQuYWdlbnRUeXBlfS0ke2FnZW50LnNvdXJjZX1gfT5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbW1lZCAmJiAhaXNTZWxlY3RlZH0gY29sb3I9e3RleHRDb2xvcn0+XG4gICAgICAgICAge2lzQnVpbHRJbiA/ICcnIDogaXNTZWxlY3RlZCA/IGAke2ZpZ3VyZXMucG9pbnRlcn0gYCA6ICcgICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I9e2RpbW1lZCAmJiAhaXNTZWxlY3RlZH0gY29sb3I9e3RleHRDb2xvcn0+XG4gICAgICAgICAge2FnZW50LmFnZW50VHlwZX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7cmVzb2x2ZWRNb2RlbCAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e3RydWV9IGNvbG9yPXt0ZXh0Q29sb3J9PlxuICAgICAgICAgICAgeycgwrcgJ31cbiAgICAgICAgICAgIHtyZXNvbHZlZE1vZGVsfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgICAge2FnZW50Lm1lbW9yeSAmJiAoXG4gICAgICAgICAgPFRleHQgZGltQ29sb3I9e3RydWV9IGNvbG9yPXt0ZXh0Q29sb3J9PlxuICAgICAgICAgICAgeycgwrcgJ31cbiAgICAgICAgICAgIHthZ2VudC5tZW1vcnl9IG1lbW9yeVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgICAge292ZXJyaWRkZW5CeSAmJiAoXG4gICAgICAgICAgPFRleHRcbiAgICAgICAgICAgIGRpbUNvbG9yPXshaXNTZWxlY3RlZH1cbiAgICAgICAgICAgIGNvbG9yPXtpc1NlbGVjdGVkID8gJ3dhcm5pbmcnIDogdW5kZWZpbmVkfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHsnICd9XG4gICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSBzaGFkb3dlZCBieSB7Z2V0T3ZlcnJpZGVTb3VyY2VMYWJlbChvdmVycmlkZGVuQnkpfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdGFibGVBZ2VudHNJbk9yZGVyID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3Qgbm9uQnVpbHRJbiA9IHNvcnRlZEFnZW50cy5maWx0ZXIoYSA9PiBhLnNvdXJjZSAhPT0gJ2J1aWx0LWluJylcbiAgICBpZiAoc291cmNlID09PSAnYWxsJykge1xuICAgICAgcmV0dXJuIEFHRU5UX1NPVVJDRV9HUk9VUFMuZmlsdGVyKGcgPT4gZy5zb3VyY2UgIT09ICdidWlsdC1pbicpLmZsYXRNYXAoXG4gICAgICAgICh7IHNvdXJjZTogZ3JvdXBTb3VyY2UgfSkgPT5cbiAgICAgICAgICBub25CdWlsdEluLmZpbHRlcihhID0+IGEuc291cmNlID09PSBncm91cFNvdXJjZSksXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBub25CdWlsdEluXG4gIH0sIFtzb3J0ZWRBZ2VudHMsIHNvdXJjZV0pXG5cbiAgLy8gU2V0IGluaXRpYWwgc2VsZWN0aW9uXG4gIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKFxuICAgICAgIXNlbGVjdGVkQWdlbnQgJiZcbiAgICAgICFpc0NyZWF0ZU5ld1NlbGVjdGVkICYmXG4gICAgICBzZWxlY3RhYmxlQWdlbnRzSW5PcmRlci5sZW5ndGggPiAwXG4gICAgKSB7XG4gICAgICBpZiAob25DcmVhdGVOZXcpIHtcbiAgICAgICAgc2V0SXNDcmVhdGVOZXdTZWxlY3RlZCh0cnVlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U2VsZWN0ZWRBZ2VudChzZWxlY3RhYmxlQWdlbnRzSW5PcmRlclswXSB8fCBudWxsKVxuICAgICAgfVxuICAgIH1cbiAgfSwgW3NlbGVjdGFibGVBZ2VudHNJbk9yZGVyLCBzZWxlY3RlZEFnZW50LCBpc0NyZWF0ZU5ld1NlbGVjdGVkLCBvbkNyZWF0ZU5ld10pXG5cbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSAncmV0dXJuJykge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBpZiAoaXNDcmVhdGVOZXdTZWxlY3RlZCAmJiBvbkNyZWF0ZU5ldykge1xuICAgICAgICBvbkNyZWF0ZU5ldygpXG4gICAgICB9IGVsc2UgaWYgKHNlbGVjdGVkQWdlbnQpIHtcbiAgICAgICAgb25TZWxlY3Qoc2VsZWN0ZWRBZ2VudClcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChlLmtleSAhPT0gJ3VwJyAmJiBlLmtleSAhPT0gJ2Rvd24nKSByZXR1cm5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIC8vIEhhbmRsZSBuYXZpZ2F0aW9uIHdpdGggXCJDcmVhdGUgTmV3IEFnZW50XCIgb3B0aW9uXG4gICAgY29uc3QgaGFzQ3JlYXRlT3B0aW9uID0gISFvbkNyZWF0ZU5ld1xuICAgIGNvbnN0IHRvdGFsSXRlbXMgPVxuICAgICAgc2VsZWN0YWJsZUFnZW50c0luT3JkZXIubGVuZ3RoICsgKGhhc0NyZWF0ZU9wdGlvbiA/IDEgOiAwKVxuXG4gICAgaWYgKHRvdGFsSXRlbXMgPT09IDApIHJldHVyblxuXG4gICAgLy8gQ2FsY3VsYXRlIGN1cnJlbnQgcG9zaXRpb24gaW4gbGlzdCAoMCA9IGNyZWF0ZSBuZXcsIDErID0gYWdlbnRzKVxuICAgIGxldCBjdXJyZW50UG9zaXRpb24gPSAwXG4gICAgaWYgKCFpc0NyZWF0ZU5ld1NlbGVjdGVkICYmIHNlbGVjdGVkQWdlbnQpIHtcbiAgICAgIGNvbnN0IGFnZW50SW5kZXggPSBzZWxlY3RhYmxlQWdlbnRzSW5PcmRlci5maW5kSW5kZXgoXG4gICAgICAgIGEgPT5cbiAgICAgICAgICBhLmFnZW50VHlwZSA9PT0gc2VsZWN0ZWRBZ2VudC5hZ2VudFR5cGUgJiZcbiAgICAgICAgICBhLnNvdXJjZSA9PT0gc2VsZWN0ZWRBZ2VudC5zb3VyY2UsXG4gICAgICApXG4gICAgICBpZiAoYWdlbnRJbmRleCA+PSAwKSB7XG4gICAgICAgIGN1cnJlbnRQb3NpdGlvbiA9IGhhc0NyZWF0ZU9wdGlvbiA/IGFnZW50SW5kZXggKyAxIDogYWdlbnRJbmRleFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSBuZXcgcG9zaXRpb24gd2l0aCB3cmFwLWFyb3VuZFxuICAgIGNvbnN0IG5ld1Bvc2l0aW9uID1cbiAgICAgIGUua2V5ID09PSAndXAnXG4gICAgICAgID8gY3VycmVudFBvc2l0aW9uID09PSAwXG4gICAgICAgICAgPyB0b3RhbEl0ZW1zIC0gMVxuICAgICAgICAgIDogY3VycmVudFBvc2l0aW9uIC0gMVxuICAgICAgICA6IGN1cnJlbnRQb3NpdGlvbiA9PT0gdG90YWxJdGVtcyAtIDFcbiAgICAgICAgICA/IDBcbiAgICAgICAgICA6IGN1cnJlbnRQb3NpdGlvbiArIDFcblxuICAgIC8vIFVwZGF0ZSBzZWxlY3Rpb24gYmFzZWQgb24gbmV3IHBvc2l0aW9uXG4gICAgaWYgKGhhc0NyZWF0ZU9wdGlvbiAmJiBuZXdQb3NpdGlvbiA9PT0gMCkge1xuICAgICAgc2V0SXNDcmVhdGVOZXdTZWxlY3RlZCh0cnVlKVxuICAgICAgc2V0U2VsZWN0ZWRBZ2VudChudWxsKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhZ2VudEluZGV4ID0gaGFzQ3JlYXRlT3B0aW9uID8gbmV3UG9zaXRpb24gLSAxIDogbmV3UG9zaXRpb25cbiAgICAgIGNvbnN0IG5ld0FnZW50ID0gc2VsZWN0YWJsZUFnZW50c0luT3JkZXJbYWdlbnRJbmRleF1cbiAgICAgIGlmIChuZXdBZ2VudCkge1xuICAgICAgICBzZXRJc0NyZWF0ZU5ld1NlbGVjdGVkKGZhbHNlKVxuICAgICAgICBzZXRTZWxlY3RlZEFnZW50KG5ld0FnZW50KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlbmRlckJ1aWx0SW5BZ2VudHNTZWN0aW9uID0gKFxuICAgIHRpdGxlID0gJ0J1aWx0LWluIChhbHdheXMgYXZhaWxhYmxlKTonLFxuICApID0+IHtcbiAgICBjb25zdCBidWlsdEluQWdlbnRzID0gc29ydGVkQWdlbnRzLmZpbHRlcihhID0+IGEuc291cmNlID09PSAnYnVpbHQtaW4nKVxuICAgIHJldHVybiAoXG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9IHBhZGRpbmdMZWZ0PXsyfT5cbiAgICAgICAgPFRleHQgYm9sZCBkaW1Db2xvcj5cbiAgICAgICAgICB7dGl0bGV9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAge2J1aWx0SW5BZ2VudHMubWFwKHJlbmRlckFnZW50KX1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHJlbmRlckFnZW50R3JvdXAgPSAodGl0bGU6IHN0cmluZywgZ3JvdXBBZ2VudHM6IFJlc29sdmVkQWdlbnRbXSkgPT4ge1xuICAgIGlmICghZ3JvdXBBZ2VudHMubGVuZ3RoKSByZXR1cm4gbnVsbFxuXG4gICAgY29uc3QgZm9sZGVyUGF0aCA9IGdyb3VwQWdlbnRzWzBdPy5iYXNlRGlyXG5cbiAgICByZXR1cm4gKFxuICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgPEJveCBwYWRkaW5nTGVmdD17Mn0+XG4gICAgICAgICAgPFRleHQgYm9sZCBkaW1Db2xvcj5cbiAgICAgICAgICAgIHt0aXRsZX1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAge2ZvbGRlclBhdGggJiYgPFRleHQgZGltQ29sb3I+ICh7Zm9sZGVyUGF0aH0pPC9UZXh0Pn1cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIHtncm91cEFnZW50cy5tYXAoYWdlbnQgPT4gcmVuZGVyQWdlbnQoYWdlbnQpKX1cbiAgICAgIDwvQm94PlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHNvdXJjZVRpdGxlID0gZ2V0QWdlbnRTb3VyY2VEaXNwbGF5TmFtZShzb3VyY2UpXG5cbiAgY29uc3QgYnVpbHRJbkFnZW50cyA9IHNvcnRlZEFnZW50cy5maWx0ZXIoYSA9PiBhLnNvdXJjZSA9PT0gJ2J1aWx0LWluJylcblxuICBjb25zdCBoYXNOb0FnZW50cyA9XG4gICAgIXNvcnRlZEFnZW50cy5sZW5ndGggfHxcbiAgICAoc291cmNlICE9PSAnYnVpbHQtaW4nICYmICFzb3J0ZWRBZ2VudHMuc29tZShhID0+IGEuc291cmNlICE9PSAnYnVpbHQtaW4nKSlcblxuICBpZiAoaGFzTm9BZ2VudHMpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPERpYWxvZ1xuICAgICAgICB0aXRsZT17c291cmNlVGl0bGV9XG4gICAgICAgIHN1YnRpdGxlPVwiTm8gYWdlbnRzIGZvdW5kXCJcbiAgICAgICAgb25DYW5jZWw9e29uQmFja31cbiAgICAgICAgaGlkZUlucHV0R3VpZGVcbiAgICAgID5cbiAgICAgICAgPEJveFxuICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgIGdhcD17MX1cbiAgICAgICAgICB0YWJJbmRleD17MH1cbiAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICBvbktleURvd249e2hhbmRsZUtleURvd259XG4gICAgICAgID5cbiAgICAgICAgICB7b25DcmVhdGVOZXcgJiYgPEJveD57cmVuZGVyQ3JlYXRlTmV3T3B0aW9uKCl9PC9Cb3g+fVxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgTm8gYWdlbnRzIGZvdW5kLiBDcmVhdGUgc3BlY2lhbGl6ZWQgc3ViYWdlbnRzIHRoYXQgQ2xhdWRlIGNhblxuICAgICAgICAgICAgZGVsZWdhdGUgdG8uXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgRWFjaCBzdWJhZ2VudCBoYXMgaXRzIG93biBjb250ZXh0IHdpbmRvdywgY3VzdG9tIHN5c3RlbSBwcm9tcHQsIGFuZFxuICAgICAgICAgICAgc3BlY2lmaWMgdG9vbHMuXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgVHJ5IGNyZWF0aW5nOiBDb2RlIFJldmlld2VyLCBDb2RlIFNpbXBsaWZpZXIsIFNlY3VyaXR5IFJldmlld2VyLFxuICAgICAgICAgICAgVGVjaCBMZWFkLCBvciBVWCBSZXZpZXdlci5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAge3NvdXJjZSAhPT0gJ2J1aWx0LWluJyAmJlxuICAgICAgICAgICAgc29ydGVkQWdlbnRzLnNvbWUoYSA9PiBhLnNvdXJjZSA9PT0gJ2J1aWx0LWluJykgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIDxEaXZpZGVyIC8+XG4gICAgICAgICAgICAgICAge3JlbmRlckJ1aWx0SW5BZ2VudHNTZWN0aW9uKCl9XG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICA8L0RpYWxvZz5cbiAgICApXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxEaWFsb2dcbiAgICAgIHRpdGxlPXtzb3VyY2VUaXRsZX1cbiAgICAgIHN1YnRpdGxlPXtgJHtjb3VudChzb3J0ZWRBZ2VudHMsIGEgPT4gIWEub3ZlcnJpZGRlbkJ5KX0gYWdlbnRzYH1cbiAgICAgIG9uQ2FuY2VsPXtvbkJhY2t9XG4gICAgICBoaWRlSW5wdXRHdWlkZVxuICAgID5cbiAgICAgIHtjaGFuZ2VzICYmIGNoYW5nZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxCb3ggbWFyZ2luVG9wPXsxfT5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj57Y2hhbmdlc1tjaGFuZ2VzLmxlbmd0aCAtIDFdfTwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuICAgICAgPEJveFxuICAgICAgICBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCJcbiAgICAgICAgdGFiSW5kZXg9ezB9XG4gICAgICAgIGF1dG9Gb2N1c1xuICAgICAgICBvbktleURvd249e2hhbmRsZUtleURvd259XG4gICAgICA+XG4gICAgICAgIHtvbkNyZWF0ZU5ldyAmJiA8Qm94IG1hcmdpbkJvdHRvbT17MX0+e3JlbmRlckNyZWF0ZU5ld09wdGlvbigpfTwvQm94Pn1cbiAgICAgICAge3NvdXJjZSA9PT0gJ2FsbCcgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIHtBR0VOVF9TT1VSQ0VfR1JPVVBTLmZpbHRlcihnID0+IGcuc291cmNlICE9PSAnYnVpbHQtaW4nKS5tYXAoXG4gICAgICAgICAgICAgICh7IGxhYmVsLCBzb3VyY2U6IGdyb3VwU291cmNlIH0pID0+IChcbiAgICAgICAgICAgICAgICA8UmVhY3QuRnJhZ21lbnQga2V5PXtncm91cFNvdXJjZX0+XG4gICAgICAgICAgICAgICAgICB7cmVuZGVyQWdlbnRHcm91cChcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgIHNvcnRlZEFnZW50cy5maWx0ZXIoYSA9PiBhLnNvdXJjZSA9PT0gZ3JvdXBTb3VyY2UpLFxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIHtidWlsdEluQWdlbnRzLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBtYXJnaW5Cb3R0b209ezF9IHBhZGRpbmdMZWZ0PXsyfT5cbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGJvbGQ+QnVpbHQtaW4gYWdlbnRzPC9UZXh0PiAoYWx3YXlzIGF2YWlsYWJsZSlcbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAge2J1aWx0SW5BZ2VudHMubWFwKHJlbmRlckFnZW50KX1cbiAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogc291cmNlID09PSAnYnVpbHQtaW4nID8gKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgICAgIEJ1aWx0LWluIGFnZW50cyBhcmUgcHJvdmlkZWQgYnkgZGVmYXVsdCBhbmQgY2Fubm90IGJlIG1vZGlmaWVkLlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgICAge3NvcnRlZEFnZW50cy5tYXAoYWdlbnQgPT4gcmVuZGVyQWdlbnQoYWdlbnQpKX1cbiAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDwvPlxuICAgICAgICApIDogKFxuICAgICAgICAgIDw+XG4gICAgICAgICAgICB7c29ydGVkQWdlbnRzXG4gICAgICAgICAgICAgIC5maWx0ZXIoYSA9PiBhLnNvdXJjZSAhPT0gJ2J1aWx0LWluJylcbiAgICAgICAgICAgICAgLm1hcChhZ2VudCA9PiByZW5kZXJBZ2VudChhZ2VudCkpfVxuICAgICAgICAgICAge3NvcnRlZEFnZW50cy5zb21lKGEgPT4gYS5zb3VyY2UgPT09ICdidWlsdC1pbicpICYmIChcbiAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICA8RGl2aWRlciAvPlxuICAgICAgICAgICAgICAgIHtyZW5kZXJCdWlsdEluQWdlbnRzU2VjdGlvbigpfVxuICAgICAgICAgICAgICA8Lz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC8+XG4gICAgICAgICl9XG4gICAgICA8L0JveD5cbiAgICA8L0RpYWxvZz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsT0FBTyxLQUFLQyxLQUFLLE1BQU0sT0FBTztBQUM5QixjQUFjQyxhQUFhLFFBQVEsaUNBQWlDO0FBQ3BFLGNBQWNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDdkUsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxjQUFjQyxhQUFhLFFBQVEsdUNBQXVDO0FBQzFFLFNBQ0VDLG1CQUFtQixFQUNuQkMsbUJBQW1CLEVBQ25CQyxzQkFBc0IsRUFDdEJDLHdCQUF3QixRQUNuQix1Q0FBdUM7QUFDOUMsY0FBY0MsZUFBZSxRQUFRLHdDQUF3QztBQUM3RSxTQUFTQyxLQUFLLFFBQVEsc0JBQXNCO0FBQzVDLFNBQVNDLE1BQU0sUUFBUSw0QkFBNEI7QUFDbkQsU0FBU0MsT0FBTyxRQUFRLDZCQUE2QjtBQUNyRCxTQUFTQyx5QkFBeUIsUUFBUSxZQUFZO0FBRXRE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