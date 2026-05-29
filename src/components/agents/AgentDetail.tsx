// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 类型依赖 { KeyboardEvent } 来自 ../../ink/events/keyboard-event.js，用于校准终端渲染的数据契约。
import type { KeyboardEvent } from '../../ink/events/keyboard-event.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 类型依赖 { Tools } 来自 ../../Tool.js，用于校准终端渲染的数据契约。
import type { Tools } from '../../Tool.js';
// 接入 getAgentColor 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getAgentColor } from '../../tools/AgentTool/agentColorManager.js';
// 接入 getMemoryScopeDisplay 工具实现，后续工具池会按权限和开关决定是否暴露。
import { getMemoryScopeDisplay } from '../../tools/AgentTool/agentMemory.js';
// 接入 resolveAgentTools 工具实现，后续工具池会按权限和开关决定是否暴露。
import { resolveAgentTools } from '../../tools/AgentTool/agentToolUtils.js';
// 接入 AgentDefinition、isBuiltInAgent 工具实现，后续工具池会按权限和开关决定是否暴露。
import { type AgentDefinition, isBuiltInAgent } from '../../tools/AgentTool/loadAgentsDir.js';
// 复用 getAgentModelDisplay 工具函数，把通用处理留在 ../../utils/model/agent.js 中维护。
import { getAgentModelDisplay } from '../../utils/model/agent.js';
// 引入 Markdown，将 ../Markdown.js 中已经封装好的能力接到本文件流程里。
import { Markdown } from '../Markdown.js';
// 引入 getActualRelativeAgentFilePath，将 ./agentFileUtils.js 中已经封装好的能力接到本文件流程里。
import { getActualRelativeAgentFilePath } from './agentFileUtils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  agent: AgentDefinition;
  tools: Tools;
  allAgents?: AgentDefinition[];
  // 这个回调绑定到 onBack: () => void;，负责终端渲染在该局部场景下的响应。
  onBack: () => void;
};
// AgentDetail 封装Agent 配置界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AgentDetail(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(48);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    agent,
    tools,
    onBack
  } = t0;
  // resolvedTools 集合读取`resolveAgentTools`，供终端渲染后续处理使用。
  const resolvedTools = resolveAgentTools(agent, tools, false);
  // t1 暂存 `getActualRelativeAgentFilePath(agent)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== agent) {
    // t1 暂存 `getActualRelativeAgentFilePath(agent)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getActualRelativeAgentFilePath(agent);
    // $[0] 缓存 `agent`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = agent;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // 文件路径 命名 `t1`，让后续代码直接表达这个值的用途。
  const filePath = t1;
  // t2 暂存 `getAgentColor(agent.agentType)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== agent.agentType) {
    // t2 暂存 `getAgentColor(agent.agentType)` 生成的渲染片段，后续返回路径直接复用。
    t2 = getAgentColor(agent.agentType);
    // $[2] 缓存 `agent.agentType`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = agent.agentType;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // backgroundColor沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const backgroundColor = t2;
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      context: "Confirmation"
    };
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", onBack, t3);
  // t4 暂存 `e => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== onBack) {
    // t4 暂存 `e => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = e => {
      // 当 `e.key` 匹配 `"return"` 时，终端渲染执行对应分支。
      if (e.key === "return") {
        // 调用 e.preventDefault，触发终端渲染此处需要的副作用。
        e.preventDefault();
        // 调用 onBack，触发终端渲染此处需要的副作用。
        onBack();
      }
    };
    // $[5] 缓存 `onBack`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = onBack;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // handleKeyDown沿用 `t4` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const handleKeyDown = t4;
  // renderToolsList 集合保存`renderToolsList`，供终端渲染后续处理使用。
  const renderToolsList = function renderToolsList() {
    // 满足 `resolvedTools.hasWildcard` 时，终端渲染执行该分支。
    if (resolvedTools.hasWildcard) {
      // 返回 `<Text>All tools</Text>`，作为终端渲染这次计算的结果。
      return <Text>All tools</Text>;
    }
    // !agent.tools || agent.tools 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
    if (!agent.tools || agent.tools.length === 0) {
      // 返回 `<Text>None</Text>`，作为终端渲染这次计算的结果。
      return <Text>None</Text>;
    }
    // 返回 `<>{resolvedTools.validTools.length > 0 && <Text>{resolvedTools.validToo...`，作为终端渲染这次计算的结果。
    return <>{resolvedTools.validTools.length > 0 && <Text>{resolvedTools.validTools.join(", ")}</Text>}{resolvedTools.invalidTools.length > 0 && <Text color="warning">{figures.warning} Unrecognized:{" "}{resolvedTools.invalidTools.join(", ")}</Text>}</>;
  };
  // 临时值 T0保存`Box`，供后续判断或组装使用。
  const T0 = Box;
  // t5保存`"column"`，作为后续固定文本处理的输入。
  const t5 = "column";
  // 临时值 t6 命名 `1`，让后续代码直接表达这个值的用途。
  const t6 = 1;
  // 临时值 t7 命名 `0`，让后续代码直接表达这个值的用途。
  const t7 = 0;
  // t8标记终端 UI Agent Detail是否启用对应路径。
  const t8 = true;
  // t9 暂存 `<Text dimColor={true}>{filePath}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== filePath) {
    // t9 暂存 `<Text dimColor={true}>{filePath}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Text dimColor={true}>{filePath}</Text>;
    // $[7] 缓存 `filePath`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = filePath;
    // $[8] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[8];
  }
  // t10 暂存 `<Text><Text bold={true}>Description</Text> (tells Claude ...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[9] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Text><Text bold={true}>Description</Text> (tells Claude ...` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text><Text bold={true}>Description</Text> (tells Claude when to use this agent):</Text>;
    // $[9] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[9];
  }
  // t11 暂存 `<Box flexDirection="column">{t10}<Box marginLeft={2}><Tex...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== agent.whenToUse) {
    // t11 暂存 `<Box flexDirection="column">{t10}<Box marginLeft={2}><Tex...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexDirection="column">{t10}<Box marginLeft={2}><Text>{agent.whenToUse}</Text></Box></Box>;
    // $[10] 缓存 `agent.whenToUse`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = agent.whenToUse;
    // $[11] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[11];
  }
  // 临时值 T1保存`Box`，供后续判断或组装使用。
  const T1 = Box;
  // t12 暂存 `<Text><Text bold={true}>Tools</Text>:{" "}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[12] === Symbol.for("react.memo_cache_sentinel")) {
    // t12 暂存 `<Text><Text bold={true}>Tools</Text>:{" "}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t12 = <Text><Text bold={true}>Tools</Text>:{" "}</Text>;
    // $[12] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[12];
  }
  // 临时值 t13保存`renderToolsList`，供终端渲染后续处理使用。
  const t13 = renderToolsList();
  // t14 暂存 `<T1>{t12}{t13}</T1>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== T1 || $[14] !== t12 || $[15] !== t13) {
    // t14 暂存 `<T1>{t12}{t13}</T1>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <T1>{t12}{t13}</T1>;
    // $[13] 缓存 `T1`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = T1;
    // $[14] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t12;
    // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t13;
    // $[16] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[16];
  }
  // t15 暂存 `<Text bold={true}>Model</Text>` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    // t15 暂存 `<Text bold={true}>Model</Text>` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text bold={true}>Model</Text>;
    // $[17] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[17];
  }
  // t16 暂存 `getAgentModelDisplay(agent.model)` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== agent.model) {
    // t16 暂存 `getAgentModelDisplay(agent.model)` 生成的渲染片段，后续返回路径直接复用。
    t16 = getAgentModelDisplay(agent.model);
    // $[18] 缓存 `agent.model`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = agent.model;
    // $[19] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t16;
  } else {
    // t16 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[19];
  }
  // t17 暂存 `<Text>{t15}: {t16}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[20] !== t16) {
    // t17 暂存 `<Text>{t15}: {t16}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text>{t15}: {t16}</Text>;
    // $[20] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t16;
    // $[21] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t17;
  } else {
    // t17 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[21];
  }
  // t18 暂存 `agent.permissionMode && <Text><Text bold={true}>Permissio...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[22] !== agent.permissionMode) {
    // t18 暂存 `agent.permissionMode && <Text><Text bold={true}>Permissio...` 生成的渲染片段，后续返回路径直接复用。
    t18 = agent.permissionMode && <Text><Text bold={true}>Permission mode</Text>: {agent.permissionMode}</Text>;
    // $[22] 缓存 `agent.permissionMode`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = agent.permissionMode;
    // $[23] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[23];
  }
  // t19 暂存 `agent.memory && <Text><Text bold={true}>Memory</Text>: {g...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[24] !== agent.memory) {
    // t19 暂存 `agent.memory && <Text><Text bold={true}>Memory</Text>: {g...` 生成的渲染片段，后续返回路径直接复用。
    t19 = agent.memory && <Text><Text bold={true}>Memory</Text>: {getMemoryScopeDisplay(agent.memory)}</Text>;
    // $[24] 缓存 `agent.memory`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = agent.memory;
    // $[25] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[25];
  }
  // t20 暂存 `agent.hooks && Object.keys(agent.hooks).length > 0 && <Te...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[26] !== agent.hooks) {
    // t20 暂存 `agent.hooks && Object.keys(agent.hooks).length > 0 && <Te...` 生成的渲染片段，后续返回路径直接复用。
    t20 = agent.hooks && Object.keys(agent.hooks).length > 0 && <Text><Text bold={true}>Hooks</Text>: {Object.keys(agent.hooks).join(", ")}</Text>;
    // $[26] 缓存 `agent.hooks`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = agent.hooks;
    // $[27] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[27] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[27];
  }
  // t21 暂存 `agent.skills && agent.skills.length > 0 && <Text><Text bo...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[28] !== agent.skills) {
    // t21 暂存 `agent.skills && agent.skills.length > 0 && <Text><Text bo...` 生成的渲染片段，后续返回路径直接复用。
    t21 = agent.skills && agent.skills.length > 0 && <Text><Text bold={true}>Skills</Text>:{" "}{agent.skills.length > 10 ? `${agent.skills.length} skills` : agent.skills.join(", ")}</Text>;
    // $[28] 缓存 `agent.skills`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = agent.skills;
    // $[29] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[29];
  }
  // t22 暂存 `backgroundColor && <Box><Text><Text bold={true}>Color</Te...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== agent.agentType || $[31] !== backgroundColor) {
    // t22 暂存 `backgroundColor && <Box><Text><Text bold={true}>Color</Te...` 生成的渲染片段，后续返回路径直接复用。
    t22 = backgroundColor && <Box><Text><Text bold={true}>Color</Text>:{" "}<Text backgroundColor={backgroundColor} color="inverseText">{" "}{agent.agentType}{" "}</Text></Text></Box>;
    // $[30] 缓存 `agent.agentType`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = agent.agentType;
    // $[31] 缓存 `backgroundColor`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = backgroundColor;
    // $[32] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[32];
  }
  // t23 暂存 `!isBuiltInAgent(agent) && <><Box><Text><Text bold={true}>...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[33] !== agent) {
    // t23 暂存 `!isBuiltInAgent(agent) && <><Box><Text><Text bold={true}>...` 生成的渲染片段，后续返回路径直接复用。
    t23 = !isBuiltInAgent(agent) && <><Box><Text><Text bold={true}>System prompt</Text>:</Text></Box><Box marginLeft={2} marginRight={2}><Markdown>{agent.getSystemPrompt()}</Markdown></Box></>;
    // $[33] 缓存 `agent`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = agent;
    // $[34] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[34] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[34];
  }
  // t24 暂存 `<T0 flexDirection={t5} gap={t6} tabIndex={t7} autoFocus={...` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[35] !== T0 || $[36] !== handleKeyDown || $[37] !== t11 || $[38] !== t14 || $[39] !== t17 || $[40] !== t18 || $[41] !== t19 || $[42] !== t20 || $[43] !== t21 || $[44] !== t22 || $[45] !== t23 || $[46] !== t9) {
    // t24 暂存 `<T0 flexDirection={t5} gap={t6} tabIndex={t7} autoFocus={...` 生成的渲染片段，后续返回路径直接复用。
    t24 = <T0 flexDirection={t5} gap={t6} tabIndex={t7} autoFocus={t8} onKeyDown={handleKeyDown}>{t9}{t11}{t14}{t17}{t18}{t19}{t20}{t21}{t22}{t23}</T0>;
    // $[35] 缓存 `T0`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = T0;
    // $[36] 缓存 `handleKeyDown`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = handleKeyDown;
    // $[37] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t11;
    // $[38] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = t14;
    // $[39] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t17;
    // $[40] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t18;
    // $[41] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t19;
    // $[42] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t20;
    // $[43] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t21;
    // $[44] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t22;
    // $[45] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t23;
    // $[46] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t9;
    // $[47] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[47] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[47];
  }
  // 返回 `t24`，作为终端渲染这次计算的结果。
  return t24;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiUmVhY3QiLCJLZXlib2FyZEV2ZW50IiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmciLCJUb29scyIsImdldEFnZW50Q29sb3IiLCJnZXRNZW1vcnlTY29wZURpc3BsYXkiLCJyZXNvbHZlQWdlbnRUb29scyIsIkFnZW50RGVmaW5pdGlvbiIsImlzQnVpbHRJbkFnZW50IiwiZ2V0QWdlbnRNb2RlbERpc3BsYXkiLCJNYXJrZG93biIsImdldEFjdHVhbFJlbGF0aXZlQWdlbnRGaWxlUGF0aCIsIlByb3BzIiwiYWdlbnQiLCJ0b29scyIsImFsbEFnZW50cyIsIm9uQmFjayIsIkFnZW50RGV0YWlsIiwidDAiLCIkIiwiX2MiLCJyZXNvbHZlZFRvb2xzIiwidDEiLCJmaWxlUGF0aCIsInQyIiwiYWdlbnRUeXBlIiwiYmFja2dyb3VuZENvbG9yIiwidDMiLCJTeW1ib2wiLCJmb3IiLCJjb250ZXh0IiwidDQiLCJlIiwia2V5IiwicHJldmVudERlZmF1bHQiLCJoYW5kbGVLZXlEb3duIiwicmVuZGVyVG9vbHNMaXN0IiwiaGFzV2lsZGNhcmQiLCJsZW5ndGgiLCJ2YWxpZFRvb2xzIiwiam9pbiIsImludmFsaWRUb29scyIsIndhcm5pbmciLCJUMCIsInQ1IiwidDYiLCJ0NyIsInQ4IiwidDkiLCJ0MTAiLCJ0MTEiLCJ3aGVuVG9Vc2UiLCJUMSIsInQxMiIsInQxMyIsInQxNCIsInQxNSIsInQxNiIsIm1vZGVsIiwidDE3IiwidDE4IiwicGVybWlzc2lvbk1vZGUiLCJ0MTkiLCJtZW1vcnkiLCJ0MjAiLCJob29rcyIsIk9iamVjdCIsImtleXMiLCJ0MjEiLCJza2lsbHMiLCJ0MjIiLCJ0MjMiLCJnZXRTeXN0ZW1Qcm9tcHQiLCJ0MjQiXSwic291cmNlcyI6WyJBZ2VudERldGFpbC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHR5cGUgeyBLZXlib2FyZEV2ZW50IH0gZnJvbSAnLi4vLi4vaW5rL2V2ZW50cy9rZXlib2FyZC1ldmVudC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHR5cGUgeyBUb29scyB9IGZyb20gJy4uLy4uL1Rvb2wuanMnXG5pbXBvcnQgeyBnZXRBZ2VudENvbG9yIH0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50Q29sb3JNYW5hZ2VyLmpzJ1xuaW1wb3J0IHsgZ2V0TWVtb3J5U2NvcGVEaXNwbGF5IH0gZnJvbSAnLi4vLi4vdG9vbHMvQWdlbnRUb29sL2FnZW50TWVtb3J5LmpzJ1xuaW1wb3J0IHsgcmVzb2x2ZUFnZW50VG9vbHMgfSBmcm9tICcuLi8uLi90b29scy9BZ2VudFRvb2wvYWdlbnRUb29sVXRpbHMuanMnXG5pbXBvcnQge1xuICB0eXBlIEFnZW50RGVmaW5pdGlvbixcbiAgaXNCdWlsdEluQWdlbnQsXG59IGZyb20gJy4uLy4uL3Rvb2xzL0FnZW50VG9vbC9sb2FkQWdlbnRzRGlyLmpzJ1xuaW1wb3J0IHsgZ2V0QWdlbnRNb2RlbERpc3BsYXkgfSBmcm9tICcuLi8uLi91dGlscy9tb2RlbC9hZ2VudC5qcydcbmltcG9ydCB7IE1hcmtkb3duIH0gZnJvbSAnLi4vTWFya2Rvd24uanMnXG5pbXBvcnQgeyBnZXRBY3R1YWxSZWxhdGl2ZUFnZW50RmlsZVBhdGggfSBmcm9tICcuL2FnZW50RmlsZVV0aWxzLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBhZ2VudDogQWdlbnREZWZpbml0aW9uXG4gIHRvb2xzOiBUb29sc1xuICBhbGxBZ2VudHM/OiBBZ2VudERlZmluaXRpb25bXVxuICBvbkJhY2s6ICgpID0+IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFnZW50RGV0YWlsKHsgYWdlbnQsIHRvb2xzLCBvbkJhY2sgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCByZXNvbHZlZFRvb2xzID0gcmVzb2x2ZUFnZW50VG9vbHMoYWdlbnQsIHRvb2xzLCBmYWxzZSlcbiAgY29uc3QgZmlsZVBhdGggPSBnZXRBY3R1YWxSZWxhdGl2ZUFnZW50RmlsZVBhdGgoYWdlbnQpXG4gIGNvbnN0IGJhY2tncm91bmRDb2xvciA9IGdldEFnZW50Q29sb3IoYWdlbnQuYWdlbnRUeXBlKVxuXG4gIC8vIEhhbmRsZSBFc2MgdG8gZ28gYmFja1xuICB1c2VLZXliaW5kaW5nKCdjb25maXJtOm5vJywgb25CYWNrLCB7IGNvbnRleHQ6ICdDb25maXJtYXRpb24nIH0pXG5cbiAgLy8gSGFuZGxlIEVudGVyIHRvIGdvIGJhY2tcbiAgY29uc3QgaGFuZGxlS2V5RG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSAncmV0dXJuJykge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBvbkJhY2soKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclRvb2xzTGlzdCgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAgIGlmIChyZXNvbHZlZFRvb2xzLmhhc1dpbGRjYXJkKSB7XG4gICAgICByZXR1cm4gPFRleHQ+QWxsIHRvb2xzPC9UZXh0PlxuICAgIH1cblxuICAgIGlmICghYWdlbnQudG9vbHMgfHwgYWdlbnQudG9vbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gPFRleHQ+Tm9uZTwvVGV4dD5cbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAge3Jlc29sdmVkVG9vbHMudmFsaWRUb29scy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICA8VGV4dD57cmVzb2x2ZWRUb29scy52YWxpZFRvb2xzLmpvaW4oJywgJyl9PC9UZXh0PlxuICAgICAgICApfVxuICAgICAgICB7cmVzb2x2ZWRUb29scy5pbnZhbGlkVG9vbHMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSBVbnJlY29nbml6ZWQ6eycgJ31cbiAgICAgICAgICAgIHtyZXNvbHZlZFRvb2xzLmludmFsaWRUb29scy5qb2luKCcsICcpfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKX1cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICBnYXA9ezF9XG4gICAgICB0YWJJbmRleD17MH1cbiAgICAgIGF1dG9Gb2N1c1xuICAgICAgb25LZXlEb3duPXtoYW5kbGVLZXlEb3dufVxuICAgID5cbiAgICAgIDxUZXh0IGRpbUNvbG9yPntmaWxlUGF0aH08L1RleHQ+XG5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dCBib2xkPkRlc2NyaXB0aW9uPC9UZXh0PiAodGVsbHMgQ2xhdWRlIHdoZW4gdG8gdXNlIHRoaXMgYWdlbnQpOlxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0+XG4gICAgICAgICAgPFRleHQ+e2FnZW50LndoZW5Ub1VzZX08L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxCb3g+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+VG9vbHM8L1RleHQ+OnsnICd9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICAge3JlbmRlclRvb2xzTGlzdCgpfVxuICAgICAgPC9Cb3g+XG5cbiAgICAgIDxUZXh0PlxuICAgICAgICA8VGV4dCBib2xkPk1vZGVsPC9UZXh0Pjoge2dldEFnZW50TW9kZWxEaXNwbGF5KGFnZW50Lm1vZGVsKX1cbiAgICAgIDwvVGV4dD5cblxuICAgICAge2FnZW50LnBlcm1pc3Npb25Nb2RlICYmIChcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgPFRleHQgYm9sZD5QZXJtaXNzaW9uIG1vZGU8L1RleHQ+OiB7YWdlbnQucGVybWlzc2lvbk1vZGV9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG5cbiAgICAgIHthZ2VudC5tZW1vcnkgJiYgKFxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICA8VGV4dCBib2xkPk1lbW9yeTwvVGV4dD46IHtnZXRNZW1vcnlTY29wZURpc3BsYXkoYWdlbnQubWVtb3J5KX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKX1cblxuICAgICAge2FnZW50Lmhvb2tzICYmIE9iamVjdC5rZXlzKGFnZW50Lmhvb2tzKS5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPFRleHQ+XG4gICAgICAgICAgPFRleHQgYm9sZD5Ib29rczwvVGV4dD46IHtPYmplY3Qua2V5cyhhZ2VudC5ob29rcykuam9pbignLCAnKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKX1cblxuICAgICAge2FnZW50LnNraWxscyAmJiBhZ2VudC5za2lsbHMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIDxUZXh0IGJvbGQ+U2tpbGxzPC9UZXh0Pjp7JyAnfVxuICAgICAgICAgIHthZ2VudC5za2lsbHMubGVuZ3RoID4gMTBcbiAgICAgICAgICAgID8gYCR7YWdlbnQuc2tpbGxzLmxlbmd0aH0gc2tpbGxzYFxuICAgICAgICAgICAgOiBhZ2VudC5za2lsbHMuam9pbignLCAnKX1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKX1cblxuICAgICAge2JhY2tncm91bmRDb2xvciAmJiAoXG4gICAgICAgIDxCb3g+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICA8VGV4dCBib2xkPkNvbG9yPC9UZXh0Pjp7JyAnfVxuICAgICAgICAgICAgPFRleHQgYmFja2dyb3VuZENvbG9yPXtiYWNrZ3JvdW5kQ29sb3J9IGNvbG9yPVwiaW52ZXJzZVRleHRcIj5cbiAgICAgICAgICAgICAgeycgJ31cbiAgICAgICAgICAgICAge2FnZW50LmFnZW50VHlwZX17JyAnfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuXG4gICAgICB7IWlzQnVpbHRJbkFnZW50KGFnZW50KSAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPEJveD5cbiAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICA8VGV4dCBib2xkPlN5c3RlbSBwcm9tcHQ8L1RleHQ+OlxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICAgIDxCb3ggbWFyZ2luTGVmdD17Mn0gbWFyZ2luUmlnaHQ9ezJ9PlxuICAgICAgICAgICAgPE1hcmtkb3duPnthZ2VudC5nZXRTeXN0ZW1Qcm9tcHQoKX08L01hcmtkb3duPlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU9BLE9BQU8sTUFBTSxTQUFTO0FBQzdCLE9BQU8sS0FBS0MsS0FBSyxNQUFNLE9BQU87QUFDOUIsY0FBY0MsYUFBYSxRQUFRLG9DQUFvQztBQUN2RSxTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQVNDLGFBQWEsUUFBUSxvQ0FBb0M7QUFDbEUsY0FBY0MsS0FBSyxRQUFRLGVBQWU7QUFDMUMsU0FBU0MsYUFBYSxRQUFRLDRDQUE0QztBQUMxRSxTQUFTQyxxQkFBcUIsUUFBUSxzQ0FBc0M7QUFDNUUsU0FBU0MsaUJBQWlCLFFBQVEseUNBQXlDO0FBQzNFLFNBQ0UsS0FBS0MsZUFBZSxFQUNwQkMsY0FBYyxRQUNULHdDQUF3QztBQUMvQyxTQUFTQyxvQkFBb0IsUUFBUSw0QkFBNEI7QUFDakUsU0FBU0MsUUFBUSxRQUFRLGdCQUFnQjtBQUN6QyxTQUFTQyw4QkFBOEIsUUFBUSxxQkFBcUI7QUFF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