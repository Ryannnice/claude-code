// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 homedir，将 os 中已经封装好的能力接到本文件流程里。
import { homedir } from 'os';
// 引入 React，将 react 中已经封装好的能力接到本文件流程里。
import React from 'react';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// 引入 setSessionTrustAccepted，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { setSessionTrustAccepted } from '../../bootstrap/state.js';
// 类型依赖 { Command } 来自 ../../commands.js，用于校准终端渲染的数据契约。
import type { Command } from '../../commands.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Link、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Link, Text } from '../../ink.js';
// 引入 useKeybinding，将 ../../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../../keybindings/useKeybinding.js';
// 接入 getMcpConfigsByScope 服务层能力，把外部通信或共享状态交给 ../../services/mcp/config.js 处理。
import { getMcpConfigsByScope } from '../../services/mcp/config.js';
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js';
// 复用 checkHasTrustDialogAccepted、saveCurrentProjectConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { checkHasTrustDialogAccepted, saveCurrentProjectConfig } from '../../utils/config.js';
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js';
// 复用 getFsImplementation 工具函数，把通用处理留在 ../../utils/fsOperations.js 中维护。
import { getFsImplementation } from '../../utils/fsOperations.js';
// 复用 gracefulShutdownSync 工具函数，把通用处理留在 ../../utils/gracefulShutdown.js 中维护。
import { gracefulShutdownSync } from '../../utils/gracefulShutdown.js';
// 引入 Select，将 ../CustomSelect/index.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/index.js';
// 引入 PermissionDialog，将 ../permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../permissions/PermissionDialog.js';
// 引入 getApiKeyHelperSources、getAwsCommandsSources、getBashPermissionSources、getDangerousEnvVarsSources、getGcpCommandsSources、getHooksSources、getOtelHeadersHelperSources，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getApiKeyHelperSources, getAwsCommandsSources, getBashPermissionSources, getDangerousEnvVarsSources, getGcpCommandsSources, getHooksSources, getOtelHeadersHelperSources } from './utils.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone(): void;
  commands?: Command[];
};
// TrustDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function TrustDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(33);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone,
    commands
  } = t0;
  // t1 暂存 `getMcpConfigsByScope("project")` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getMcpConfigsByScope("project")` 生成的渲染片段，后续返回路径直接复用。
    t1 = getMcpConfigsByScope("project");
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    servers: projectServers
  } = t1;
  // t2 暂存 `Object.keys(projectServers)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `Object.keys(projectServers)` 生成的渲染片段，后续返回路径直接复用。
    t2 = Object.keys(projectServers);
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // hasMcpServers 集合标记终端 UI Trust Dialog是否启用对应路径。
  const hasMcpServers = t2.length > 0;
  // t3 暂存 `getHooksSources()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `getHooksSources()` 生成的渲染片段，后续返回路径直接复用。
    t3 = getHooksSources();
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // hooksSettingSources 集合 命名 `t3`，让后续代码直接表达这个值的用途。
  const hooksSettingSources = t3;
  // hasHooks 集合标记终端 UI Trust Dialog是否启用对应路径。
  const hasHooks = hooksSettingSources.length > 0;
  // t4 暂存 `getBashPermissionSources()` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `getBashPermissionSources()` 生成的渲染片段，后续返回路径直接复用。
    t4 = getBashPermissionSources();
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
  }
  // bashSettingSources 集合 命名 `t4`，让后续代码直接表达这个值的用途。
  const bashSettingSources = t4;
  // t5 暂存 `getApiKeyHelperSources()` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `getApiKeyHelperSources()` 生成的渲染片段，后续返回路径直接复用。
    t5 = getApiKeyHelperSources();
    // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[4];
  }
  // apiKeyHelperSources 集合沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const apiKeyHelperSources = t5;
  // hasApiKeyHelper标记终端 UI Trust Dialog是否启用对应路径。
  const hasApiKeyHelper = apiKeyHelperSources.length > 0;
  // t6 暂存 `getAwsCommandsSources()` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `getAwsCommandsSources()` 生成的渲染片段，后续返回路径直接复用。
    t6 = getAwsCommandsSources();
    // $[5] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[5];
  }
  // awsCommandsSources 命令数据 命名 `t6`，让后续代码直接表达这个值的用途。
  const awsCommandsSources = t6;
  // hasAwsCommands 命令数据标记终端 UI Trust Dialog是否启用对应路径。
  const hasAwsCommands = awsCommandsSources.length > 0;
  // t7 暂存 `getGcpCommandsSources()` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t7 暂存 `getGcpCommandsSources()` 生成的渲染片段，后续返回路径直接复用。
    t7 = getGcpCommandsSources();
    // $[6] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[6];
  }
  // gcpCommandsSources 命令数据保存`t7`，作为后续临时缓存值处理的输入。
  const gcpCommandsSources = t7;
  // hasGcpCommands 命令数据标记终端 UI Trust Dialog是否启用对应路径。
  const hasGcpCommands = gcpCommandsSources.length > 0;
  // t8 暂存 `getOtelHeadersHelperSources()` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `getOtelHeadersHelperSources()` 生成的渲染片段，后续返回路径直接复用。
    t8 = getOtelHeadersHelperSources();
    // $[7] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[7];
  }
  // otelHeadersHelperSources 集合 命名 `t8`，让后续代码直接表达这个值的用途。
  const otelHeadersHelperSources = t8;
  // hasOtelHeadersHelper标记终端 UI Trust Dialog是否启用对应路径。
  const hasOtelHeadersHelper = otelHeadersHelperSources.length > 0;
  // t9 暂存 `getDangerousEnvVarsSources()` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `getDangerousEnvVarsSources()` 生成的渲染片段，后续返回路径直接复用。
    t9 = getDangerousEnvVarsSources();
    // $[8] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[8];
  }
  // dangerousEnvVarsSources 集合 命名 `t9`，让后续代码直接表达这个值的用途。
  const dangerousEnvVarsSources = t9;
  // hasDangerousEnvVars 集合标记终端 UI Trust Dialog是否启用对应路径。
  const hasDangerousEnvVars = dangerousEnvVarsSources.length > 0;
  // t10 暂存 `commands?.some(_temp2) ?? false` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== commands) {
    // t10 暂存 `commands?.some(_temp2) ?? false` 生成的渲染片段，后续返回路径直接复用。
    t10 = commands?.some(_temp2) ?? false;
    // $[9] 缓存 `commands`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = commands;
    // $[10] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[10];
  }
  // hasSlashCommandBash 命令数据标记终端 UI Trust Dialog是否启用对应路径。
  const hasSlashCommandBash = t10;
  // t11 暂存 `commands?.some(_temp4) ?? false` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== commands) {
    // t11 暂存 `commands?.some(_temp4) ?? false` 生成的渲染片段，后续返回路径直接复用。
    t11 = commands?.some(_temp4) ?? false;
    // $[11] 缓存 `commands`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = commands;
    // $[12] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[12];
  }
  // hasSkillsBash标记终端 UI Trust Dialog是否启用对应路径。
  const hasSkillsBash = t11;
  // hasAnyBashExecution标记终端 UI Trust Dialog是否启用对应路径。
  const hasAnyBashExecution = bashSettingSources.length > 0 || hasSlashCommandBash || hasSkillsBash;
  // hasTrustDialogAccepted记录 `checkHasTrustDialogAccepted` 是否成立，终端渲染随后按该结果分支。
  const hasTrustDialogAccepted = checkHasTrustDialogAccepted();
  // t12 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // t13 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== hasAnyBashExecution) {
    // t12 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t12 = () => {
      // isHomeDir记录 `homedir` 是否成立，终端渲染随后按该结果分支。
      const isHomeDir = homedir() === getCwd();
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_trust_dialog_shown", {
        isHomeDir,
        hasMcpServers,
        hasHooks,
        hasBashExecution: hasAnyBashExecution,
        hasApiKeyHelper,
        hasAwsCommands,
        hasGcpCommands,
        hasOtelHeadersHelper,
        hasDangerousEnvVars
      });
    };
    // t13 暂存 `[hasMcpServers, hasHooks, hasAnyBashExecution, hasApiKeyH...` 生成的渲染片段，后续返回路径直接复用。
    t13 = [hasMcpServers, hasHooks, hasAnyBashExecution, hasApiKeyHelper, hasAwsCommands, hasGcpCommands, hasOtelHeadersHelper, hasDangerousEnvVars];
    // $[13] 缓存 `hasAnyBashExecution`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = hasAnyBashExecution;
    // $[14] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t12;
    // $[15] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t13;
  } else {
    // t12 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[14];
    // t13 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[15];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t12, t13);
  // t14 暂存 `function onChange(value) {` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== hasAnyBashExecution || $[17] !== onDone) {
    // t14 暂存 `function onChange(value) {` 生成的渲染片段，后续返回路径直接复用。
    t14 = function onChange(value) {
      // 当 `value` 匹配 `"exit"` 时，终端渲染执行对应分支。
      if (value === "exit") {
        // 调用 gracefulShutdownSync，触发终端渲染此处需要的副作用。
        gracefulShutdownSync(1);
        // 终端 UI 组件 Trust Dialog在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // isHomeDir_0记录 `homedir` 是否成立，终端渲染随后按该结果分支。
      const isHomeDir_0 = homedir() === getCwd();
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_trust_dialog_accept", {
        isHomeDir: isHomeDir_0,
        hasMcpServers,
        hasHooks,
        hasBashExecution: hasAnyBashExecution,
        hasApiKeyHelper,
        hasAwsCommands,
        hasGcpCommands,
        hasOtelHeadersHelper,
        hasDangerousEnvVars
      });
      // 满足 `isHomeDir_0` 时，终端渲染执行该分支。
      if (isHomeDir_0) {
        // setSessionTrustAccepted 写入新的状态值，使终端渲染后续读取保持一致。
        setSessionTrustAccepted(true);
      } else {
        // 调用 saveCurrentProjectConfig，触发终端渲染此处需要的副作用。
        saveCurrentProjectConfig(_temp5);
      }
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[16] 缓存 `hasAnyBashExecution`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = hasAnyBashExecution;
    // $[17] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = onDone;
    // $[18] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[18];
  }
  // onChange保存`t14`，作为后续临时缓存值处理的输入。
  const onChange = t14;
  // exitState 状态保存`useExitOnCtrlCDWithKeybindings`，供终端渲染后续处理使用。
  const exitState = useExitOnCtrlCDWithKeybindings(_temp6);
  // t15 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
    // t15 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t15 = {
      context: "Confirmation"
    };
    // $[19] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[19];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("confirm:no", _temp7, t15);
  // 满足 `hasTrustDialogAccepted` 时，终端渲染执行该分支。
  if (hasTrustDialogAccepted) {
    // setTimeout 写入新的状态值，使终端渲染后续读取保持一致。
    setTimeout(onDone);
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t16 暂存 `<Text bold={true}>{getFsImplementation().cwd()}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t16;
  // t17 暂存 `<Text>Quick safety check: Is this a project you created o...` 的派生结果，便于缓存命中时直接复用。
  let t17;
  // t18 暂存 `<Text>Claude Code{"'"}ll be able to read, edit, and execu...` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
    // t16 暂存 `<Text bold={true}>{getFsImplementation().cwd()}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t16 = <Text bold={true}>{getFsImplementation().cwd()}</Text>;
    // t17 暂存 `<Text>Quick safety check: Is this a project you created o...` 生成的渲染片段，后续返回路径直接复用。
    t17 = <Text>Quick safety check: Is this a project you created or one you trust? (Like your own code, a well-known open source project, or work from your team). If not, take a moment to review what{"'"}s in this folder first.</Text>;
    // t18 暂存 `<Text>Claude Code{"'"}ll be able to read, edit, and execu...` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Text>Claude Code{"'"}ll be able to read, edit, and execute files here.</Text>;
    // $[20] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t16;
    // $[21] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = t17;
    // $[22] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t18;
  } else {
    // t16 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t16 = $[20];
    // t17 从 React 编译缓存槽 $[21] 取回渲染片段，避免依赖未变时重建 JSX。
    t17 = $[21];
    // t18 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[22];
  }
  // t19 暂存 `<Text dimColor={true}><Link url="https://code.claude.com/...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[23] === Symbol.for("react.memo_cache_sentinel")) {
    // t19 暂存 `<Text dimColor={true}><Link url="https://code.claude.com/...` 生成的渲染片段，后续返回路径直接复用。
    t19 = <Text dimColor={true}><Link url="https://code.claude.com/docs/en/security">Security guide</Link></Text>;
    // $[23] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[23];
  }
  // t20 暂存 `[{` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
    // t20 暂存 `[{` 生成的渲染片段，后续返回路径直接复用。
    t20 = [{
      label: "Yes, I trust this folder",
      value: "enable_all"
    }, {
      label: "No, exit",
      value: "exit"
    }];
    // $[24] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[24];
  }
  // t21 暂存 `<Select options={t20} onChange={value_0 => onChange(value...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== onChange) {
    // t21 暂存 `<Select options={t20} onChange={value_0 => onChange(value...` 生成的渲染片段，后续返回路径直接复用。
    t21 = <Select options={t20} onChange={value_0 => onChange(value_0 as 'enable_all' | 'exit')} onCancel={() => onChange("exit")} />;
    // $[25] 缓存 `onChange`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = onChange;
    // $[26] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[26];
  }
  // t22 暂存 `<Text dimColor={true}>{exitState.pending ? <>Press {exitS...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== exitState.keyName || $[28] !== exitState.pending) {
    // t22 暂存 `<Text dimColor={true}>{exitState.pending ? <>Press {exitS...` 生成的渲染片段，后续返回路径直接复用。
    t22 = <Text dimColor={true}>{exitState.pending ? <>Press {exitState.keyName} again to exit</> : <>Enter to confirm · Esc to cancel</>}</Text>;
    // $[27] 缓存 `exitState.keyName`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = exitState.keyName;
    // $[28] 缓存 `exitState.pending`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = exitState.pending;
    // $[29] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[29] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[29];
  }
  // t23 暂存 `<PermissionDialog color="warning" titleColor="warning" ti...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[30] !== t21 || $[31] !== t22) {
    // t23 暂存 `<PermissionDialog color="warning" titleColor="warning" ti...` 生成的渲染片段，后续返回路径直接复用。
    t23 = <PermissionDialog color="warning" titleColor="warning" title="Accessing workspace:"><Box flexDirection="column" gap={1} paddingTop={1}>{t16}{t17}{t18}{t19}{t21}{t22}</Box></PermissionDialog>;
    // $[30] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t21;
    // $[31] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t22;
    // $[32] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[32] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[32];
  }
  // 返回 `t23`，作为终端渲染这次计算的结果。
  return t23;
}
// _temp7 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7() {
  // 调用 gracefulShutdownSync，触发终端渲染此处需要的副作用。
  gracefulShutdownSync(0);
}
// _temp6 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6() {
  // 返回 `gracefulShutdownSync(1)`，作为终端渲染这次计算的结果。
  return gracefulShutdownSync(1);
}
// _temp5 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5(current) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...current,
    hasTrustDialogAccepted: true
  };
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(command_0) {
  // 返回 `command_0.type === "prompt" && (command_0.loadedFrom === "skills" || co...`，作为终端渲染这次计算的结果。
  return command_0.type === "prompt" && (command_0.loadedFrom === "skills" || command_0.loadedFrom === "plugin") && (command_0.source === "projectSettings" || command_0.source === "localSettings" || command_0.source === "plugin") && command_0.allowedTools?.some(_temp3);
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(tool_0) {
  // 返回 `tool_0 === BASH_TOOL_NAME || tool_0.startsWith(BASH_TOOL_NAME + "(")`，作为终端渲染这次计算的结果。
  return tool_0 === BASH_TOOL_NAME || tool_0.startsWith(BASH_TOOL_NAME + "(");
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(command) {
  // 返回 `command.type === "prompt" && command.loadedFrom === "commands_DEPRECATE...`，作为终端渲染这次计算的结果。
  return command.type === "prompt" && command.loadedFrom === "commands_DEPRECATED" && (command.source === "projectSettings" || command.source === "localSettings") && command.allowedTools?.some(_temp);
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(tool) {
  // 返回 `tool === BASH_TOOL_NAME || tool.startsWith(BASH_TOOL_NAME + "(")`，作为终端渲染这次计算的结果。
  return tool === BASH_TOOL_NAME || tool.startsWith(BASH_TOOL_NAME + "(");
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJob21lZGlyIiwiUmVhY3QiLCJsb2dFdmVudCIsInNldFNlc3Npb25UcnVzdEFjY2VwdGVkIiwiQ29tbWFuZCIsInVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyIsIkJveCIsIkxpbmsiLCJUZXh0IiwidXNlS2V5YmluZGluZyIsImdldE1jcENvbmZpZ3NCeVNjb3BlIiwiQkFTSF9UT09MX05BTUUiLCJjaGVja0hhc1RydXN0RGlhbG9nQWNjZXB0ZWQiLCJzYXZlQ3VycmVudFByb2plY3RDb25maWciLCJnZXRDd2QiLCJnZXRGc0ltcGxlbWVudGF0aW9uIiwiZ3JhY2VmdWxTaHV0ZG93blN5bmMiLCJTZWxlY3QiLCJQZXJtaXNzaW9uRGlhbG9nIiwiZ2V0QXBpS2V5SGVscGVyU291cmNlcyIsImdldEF3c0NvbW1hbmRzU291cmNlcyIsImdldEJhc2hQZXJtaXNzaW9uU291cmNlcyIsImdldERhbmdlcm91c0VudlZhcnNTb3VyY2VzIiwiZ2V0R2NwQ29tbWFuZHNTb3VyY2VzIiwiZ2V0SG9va3NTb3VyY2VzIiwiZ2V0T3RlbEhlYWRlcnNIZWxwZXJTb3VyY2VzIiwiUHJvcHMiLCJvbkRvbmUiLCJjb21tYW5kcyIsIlRydXN0RGlhbG9nIiwidDAiLCIkIiwiX2MiLCJ0MSIsIlN5bWJvbCIsImZvciIsInNlcnZlcnMiLCJwcm9qZWN0U2VydmVycyIsInQyIiwiT2JqZWN0Iiwia2V5cyIsImhhc01jcFNlcnZlcnMiLCJsZW5ndGgiLCJ0MyIsImhvb2tzU2V0dGluZ1NvdXJjZXMiLCJoYXNIb29rcyIsInQ0IiwiYmFzaFNldHRpbmdTb3VyY2VzIiwidDUiLCJhcGlLZXlIZWxwZXJTb3VyY2VzIiwiaGFzQXBpS2V5SGVscGVyIiwidDYiLCJhd3NDb21tYW5kc1NvdXJjZXMiLCJoYXNBd3NDb21tYW5kcyIsInQ3IiwiZ2NwQ29tbWFuZHNTb3VyY2VzIiwiaGFzR2NwQ29tbWFuZHMiLCJ0OCIsIm90ZWxIZWFkZXJzSGVscGVyU291cmNlcyIsImhhc090ZWxIZWFkZXJzSGVscGVyIiwidDkiLCJkYW5nZXJvdXNFbnZWYXJzU291cmNlcyIsImhhc0Rhbmdlcm91c0VudlZhcnMiLCJ0MTAiLCJzb21lIiwiX3RlbXAyIiwiaGFzU2xhc2hDb21tYW5kQmFzaCIsInQxMSIsIl90ZW1wNCIsImhhc1NraWxsc0Jhc2giLCJoYXNBbnlCYXNoRXhlY3V0aW9uIiwiaGFzVHJ1c3REaWFsb2dBY2NlcHRlZCIsInQxMiIsInQxMyIsImlzSG9tZURpciIsImhhc0Jhc2hFeGVjdXRpb24iLCJ1c2VFZmZlY3QiLCJ0MTQiLCJvbkNoYW5nZSIsInZhbHVlIiwiaXNIb21lRGlyXzAiLCJfdGVtcDUiLCJleGl0U3RhdGUiLCJfdGVtcDYiLCJ0MTUiLCJjb250ZXh0IiwiX3RlbXA3Iiwic2V0VGltZW91dCIsInQxNiIsInQxNyIsInQxOCIsImN3ZCIsInQxOSIsInQyMCIsImxhYmVsIiwidDIxIiwidmFsdWVfMCIsInQyMiIsImtleU5hbWUiLCJwZW5kaW5nIiwidDIzIiwiY3VycmVudCIsImNvbW1hbmRfMCIsImNvbW1hbmQiLCJ0eXBlIiwibG9hZGVkRnJvbSIsInNvdXJjZSIsImFsbG93ZWRUb29scyIsIl90ZW1wMyIsInRvb2xfMCIsInRvb2wiLCJzdGFydHNXaXRoIiwiX3RlbXAiXSwic291cmNlcyI6WyJUcnVzdERpYWxvZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gJ29zJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICdzcmMvc2VydmljZXMvYW5hbHl0aWNzL2luZGV4LmpzJ1xuaW1wb3J0IHsgc2V0U2Vzc2lvblRydXN0QWNjZXB0ZWQgfSBmcm9tICcuLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5pbXBvcnQgdHlwZSB7IENvbW1hbmQgfSBmcm9tICcuLi8uLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncyB9IGZyb20gJy4uLy4uL2hvb2tzL3VzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncy5qcydcbmltcG9ydCB7IEJveCwgTGluaywgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUtleWJpbmRpbmcgfSBmcm9tICcuLi8uLi9rZXliaW5kaW5ncy91c2VLZXliaW5kaW5nLmpzJ1xuaW1wb3J0IHsgZ2V0TWNwQ29uZmlnc0J5U2NvcGUgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9tY3AvY29uZmlnLmpzJ1xuaW1wb3J0IHsgQkFTSF9UT09MX05BTUUgfSBmcm9tICcuLi8uLi90b29scy9CYXNoVG9vbC90b29sTmFtZS5qcydcbmltcG9ydCB7XG4gIGNoZWNrSGFzVHJ1c3REaWFsb2dBY2NlcHRlZCxcbiAgc2F2ZUN1cnJlbnRQcm9qZWN0Q29uZmlnLFxufSBmcm9tICcuLi8uLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyBnZXRDd2QgfSBmcm9tICcuLi8uLi91dGlscy9jd2QuanMnXG5pbXBvcnQgeyBnZXRGc0ltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvZnNPcGVyYXRpb25zLmpzJ1xuaW1wb3J0IHsgZ3JhY2VmdWxTaHV0ZG93blN5bmMgfSBmcm9tICcuLi8uLi91dGlscy9ncmFjZWZ1bFNodXRkb3duLmpzJ1xuaW1wb3J0IHsgU2VsZWN0IH0gZnJvbSAnLi4vQ3VzdG9tU2VsZWN0L2luZGV4LmpzJ1xuaW1wb3J0IHsgUGVybWlzc2lvbkRpYWxvZyB9IGZyb20gJy4uL3Blcm1pc3Npb25zL1Blcm1pc3Npb25EaWFsb2cuanMnXG5pbXBvcnQge1xuICBnZXRBcGlLZXlIZWxwZXJTb3VyY2VzLFxuICBnZXRBd3NDb21tYW5kc1NvdXJjZXMsXG4gIGdldEJhc2hQZXJtaXNzaW9uU291cmNlcyxcbiAgZ2V0RGFuZ2Vyb3VzRW52VmFyc1NvdXJjZXMsXG4gIGdldEdjcENvbW1hbmRzU291cmNlcyxcbiAgZ2V0SG9va3NTb3VyY2VzLFxuICBnZXRPdGVsSGVhZGVyc0hlbHBlclNvdXJjZXMsXG59IGZyb20gJy4vdXRpbHMuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIG9uRG9uZSgpOiB2b2lkXG4gIGNvbW1hbmRzPzogQ29tbWFuZFtdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBUcnVzdERpYWxvZyh7IG9uRG9uZSwgY29tbWFuZHMgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB7IHNlcnZlcnM6IHByb2plY3RTZXJ2ZXJzIH0gPSBnZXRNY3BDb25maWdzQnlTY29wZSgncHJvamVjdCcpXG5cbiAgLy8gSW4gYWxsIGNhc2VzLCB3ZSBnZW5lcmFsbHkgY2hlY2sgb25seSB0aGUgcHJvamVjdC1sZXZlbCBhbmRcbiAgLy8gcHJvamVjdC1sb2NhbC1sZXZlbCBzZXR0aW5ncywgd2hpY2ggd2UgYXNzdW1lIHRoYXQgdXNlcnMgZG8gbm90IGNvbmZpZ3VyZVxuICAvLyBkaXJlY3RseSBjb21wYXJlZCB0byB1c2VyLWxldmVsIHNldHRpbmdzLlxuXG4gIC8vIENoZWNrIGZvciBNQ1BzXG4gIGNvbnN0IGhhc01jcFNlcnZlcnMgPSBPYmplY3Qua2V5cyhwcm9qZWN0U2VydmVycykubGVuZ3RoID4gMFxuICAvLyBDaGVjayBmb3IgaG9va3NcbiAgY29uc3QgaG9va3NTZXR0aW5nU291cmNlcyA9IGdldEhvb2tzU291cmNlcygpXG4gIGNvbnN0IGhhc0hvb2tzID0gaG9va3NTZXR0aW5nU291cmNlcy5sZW5ndGggPiAwXG4gIC8vIENoZWNrIHdoZXRoZXIgY29kZSBleGVjdXRpb24gaXMgYWxsb3dlZCBpbiBwZXJtaXNzaW9ucyBhbmQgc2xhc2ggY29tbWFuZHNcbiAgY29uc3QgYmFzaFNldHRpbmdTb3VyY2VzID0gZ2V0QmFzaFBlcm1pc3Npb25Tb3VyY2VzKClcbiAgLy8gQ2hlY2sgZm9yIGFwaUtleUhlbHBlciB3aGljaCBleGVjdXRlcyBhcmJpdHJhcnkgY29tbWFuZHNcbiAgY29uc3QgYXBpS2V5SGVscGVyU291cmNlcyA9IGdldEFwaUtleUhlbHBlclNvdXJjZXMoKVxuICBjb25zdCBoYXNBcGlLZXlIZWxwZXIgPSBhcGlLZXlIZWxwZXJTb3VyY2VzLmxlbmd0aCA+IDBcbiAgLy8gQ2hlY2sgZm9yIEFXUyBjb21tYW5kcyB3aGljaCBleGVjdXRlIGFyYml0cmFyeSBjb21tYW5kc1xuICBjb25zdCBhd3NDb21tYW5kc1NvdXJjZXMgPSBnZXRBd3NDb21tYW5kc1NvdXJjZXMoKVxuICBjb25zdCBoYXNBd3NDb21tYW5kcyA9IGF3c0NvbW1hbmRzU291cmNlcy5sZW5ndGggPiAwXG4gIC8vIENoZWNrIGZvciBHQ1AgY29tbWFuZHMgd2hpY2ggZXhlY3V0ZSBhcmJpdHJhcnkgY29tbWFuZHNcbiAgY29uc3QgZ2NwQ29tbWFuZHNTb3VyY2VzID0gZ2V0R2NwQ29tbWFuZHNTb3VyY2VzKClcbiAgY29uc3QgaGFzR2NwQ29tbWFuZHMgPSBnY3BDb21tYW5kc1NvdXJjZXMubGVuZ3RoID4gMFxuICAvLyBDaGVjayBmb3Igb3RlbEhlYWRlcnNIZWxwZXIgd2hpY2ggZXhlY3V0ZXMgYXJiaXRyYXJ5IGNvbW1hbmRzXG4gIGNvbnN0IG90ZWxIZWFkZXJzSGVscGVyU291cmNlcyA9IGdldE90ZWxIZWFkZXJzSGVscGVyU291cmNlcygpXG4gIGNvbnN0IGhhc090ZWxIZWFkZXJzSGVscGVyID0gb3RlbEhlYWRlcnNIZWxwZXJTb3VyY2VzLmxlbmd0aCA+IDBcbiAgLy8gQ2hlY2sgZm9yIGRhbmdlcm91cyBlbnZpcm9ubWVudCB2YXJpYWJsZXMgKG5vdCBpbiBTQUZFX0VOVl9WQVJTKVxuICBjb25zdCBkYW5nZXJvdXNFbnZWYXJzU291cmNlcyA9IGdldERhbmdlcm91c0VudlZhcnNTb3VyY2VzKClcbiAgY29uc3QgaGFzRGFuZ2Vyb3VzRW52VmFycyA9IGRhbmdlcm91c0VudlZhcnNTb3VyY2VzLmxlbmd0aCA+IDBcblxuICBjb25zdCBoYXNTbGFzaENvbW1hbmRCYXNoID1cbiAgICBjb21tYW5kcz8uc29tZShcbiAgICAgIGNvbW1hbmQgPT5cbiAgICAgICAgY29tbWFuZC50eXBlID09PSAncHJvbXB0JyAmJlxuICAgICAgICBjb21tYW5kLmxvYWRlZEZyb20gPT09ICdjb21tYW5kc19ERVBSRUNBVEVEJyAmJlxuICAgICAgICAoY29tbWFuZC5zb3VyY2UgPT09ICdwcm9qZWN0U2V0dGluZ3MnIHx8XG4gICAgICAgICAgY29tbWFuZC5zb3VyY2UgPT09ICdsb2NhbFNldHRpbmdzJykgJiZcbiAgICAgICAgY29tbWFuZC5hbGxvd2VkVG9vbHM/LnNvbWUoXG4gICAgICAgICAgKHRvb2w6IHN0cmluZykgPT5cbiAgICAgICAgICAgIHRvb2wgPT09IEJBU0hfVE9PTF9OQU1FIHx8IHRvb2wuc3RhcnRzV2l0aChCQVNIX1RPT0xfTkFNRSArICcoJyksXG4gICAgICAgICksXG4gICAgKSA/PyBmYWxzZVxuXG4gIGNvbnN0IGhhc1NraWxsc0Jhc2ggPVxuICAgIGNvbW1hbmRzPy5zb21lKFxuICAgICAgY29tbWFuZCA9PlxuICAgICAgICBjb21tYW5kLnR5cGUgPT09ICdwcm9tcHQnICYmXG4gICAgICAgIChjb21tYW5kLmxvYWRlZEZyb20gPT09ICdza2lsbHMnIHx8IGNvbW1hbmQubG9hZGVkRnJvbSA9PT0gJ3BsdWdpbicpICYmXG4gICAgICAgIChjb21tYW5kLnNvdXJjZSA9PT0gJ3Byb2plY3RTZXR0aW5ncycgfHxcbiAgICAgICAgICBjb21tYW5kLnNvdXJjZSA9PT0gJ2xvY2FsU2V0dGluZ3MnIHx8XG4gICAgICAgICAgY29tbWFuZC5zb3VyY2UgPT09ICdwbHVnaW4nKSAmJlxuICAgICAgICBjb21tYW5kLmFsbG93ZWRUb29scz8uc29tZShcbiAgICAgICAgICAodG9vbDogc3RyaW5nKSA9PlxuICAgICAgICAgICAgdG9vbCA9PT0gQkFTSF9UT09MX05BTUUgfHwgdG9vbC5zdGFydHNXaXRoKEJBU0hfVE9PTF9OQU1FICsgJygnKSxcbiAgICAgICAgKSxcbiAgICApID8/IGZhbHNlXG5cbiAgY29uc3QgaGFzQW55QmFzaEV4ZWN1dGlvbiA9XG4gICAgYmFzaFNldHRpbmdTb3VyY2VzLmxlbmd0aCA+IDAgfHwgaGFzU2xhc2hDb21tYW5kQmFzaCB8fCBoYXNTa2lsbHNCYXNoXG5cbiAgY29uc3QgaGFzVHJ1c3REaWFsb2dBY2NlcHRlZCA9IGNoZWNrSGFzVHJ1c3REaWFsb2dBY2NlcHRlZCgpXG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBpc0hvbWVEaXIgPSBob21lZGlyKCkgPT09IGdldEN3ZCgpXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X3RydXN0X2RpYWxvZ19zaG93bicsIHtcbiAgICAgIGlzSG9tZURpcixcbiAgICAgIGhhc01jcFNlcnZlcnMsXG4gICAgICBoYXNIb29rcyxcbiAgICAgIGhhc0Jhc2hFeGVjdXRpb246IGhhc0FueUJhc2hFeGVjdXRpb24sXG4gICAgICBoYXNBcGlLZXlIZWxwZXIsXG4gICAgICBoYXNBd3NDb21tYW5kcyxcbiAgICAgIGhhc0djcENvbW1hbmRzLFxuICAgICAgaGFzT3RlbEhlYWRlcnNIZWxwZXIsXG4gICAgICBoYXNEYW5nZXJvdXNFbnZWYXJzLFxuICAgIH0pXG4gIH0sIFtcbiAgICBoYXNNY3BTZXJ2ZXJzLFxuICAgIGhhc0hvb2tzLFxuICAgIGhhc0FueUJhc2hFeGVjdXRpb24sXG4gICAgaGFzQXBpS2V5SGVscGVyLFxuICAgIGhhc0F3c0NvbW1hbmRzLFxuICAgIGhhc0djcENvbW1hbmRzLFxuICAgIGhhc090ZWxIZWFkZXJzSGVscGVyLFxuICAgIGhhc0Rhbmdlcm91c0VudlZhcnMsXG4gIF0pXG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UodmFsdWU6ICdlbmFibGVfYWxsJyB8ICdleGl0Jykge1xuICAgIGlmICh2YWx1ZSA9PT0gJ2V4aXQnKSB7XG4gICAgICBncmFjZWZ1bFNodXRkb3duU3luYygxKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgaXNIb21lRGlyID0gaG9tZWRpcigpID09PSBnZXRDd2QoKVxuXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X3RydXN0X2RpYWxvZ19hY2NlcHQnLCB7XG4gICAgICBpc0hvbWVEaXIsXG4gICAgICBoYXNNY3BTZXJ2ZXJzLFxuICAgICAgaGFzSG9va3MsXG4gICAgICBoYXNCYXNoRXhlY3V0aW9uOiBoYXNBbnlCYXNoRXhlY3V0aW9uLFxuICAgICAgaGFzQXBpS2V5SGVscGVyLFxuICAgICAgaGFzQXdzQ29tbWFuZHMsXG4gICAgICBoYXNHY3BDb21tYW5kcyxcbiAgICAgIGhhc090ZWxIZWFkZXJzSGVscGVyLFxuICAgICAgaGFzRGFuZ2Vyb3VzRW52VmFycyxcbiAgICB9KVxuXG4gICAgaWYgKGlzSG9tZURpcikge1xuICAgICAgLy8gRm9yIGhvbWUgZGlyZWN0b3J5LCBzdG9yZSB0cnVzdCBpbiBzZXNzaW9uIG1lbW9yeSBvbmx5IChub3QgcGVyc2lzdGVkIHRvIGRpc2spXG4gICAgICAvLyBUaGlzIGFsbG93cyBob29rcyBhbmQgb3RoZXIgdHJ1c3QtcmVxdWlyaW5nIGZlYXR1cmVzIHRvIHdvcmsgZHVyaW5nIHRoaXMgc2Vzc2lvblxuICAgICAgLy8gd2hpbGUgcHJlc2VydmluZyB0aGUgc2VjdXJpdHkgaW50ZW50IG9mIG5vdCBwZXJtYW5lbnRseSB0cnVzdGluZyBob21lIGRpclxuICAgICAgc2V0U2Vzc2lvblRydXN0QWNjZXB0ZWQodHJ1ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgc2F2ZUN1cnJlbnRQcm9qZWN0Q29uZmlnKGN1cnJlbnQgPT4gKHtcbiAgICAgICAgLi4uY3VycmVudCxcbiAgICAgICAgaGFzVHJ1c3REaWFsb2dBY2NlcHRlZDogdHJ1ZSxcbiAgICAgIH0pKVxuICAgIH1cblxuICAgIC8vIERvIE5PVCB3cml0ZSBNQ1Agc2VydmVyIHNldHRpbmdzIGhlcmUuIGhhbmRsZU1jcGpzb25TZXJ2ZXJBcHByb3ZhbHMgaW5cbiAgICAvLyBpbnRlcmFjdGl2ZUhlbHBlcnMudHN4IHJ1bnMgcmlnaHQgYWZ0ZXIgdGhpcyBkaWFsb2cgYW5kIHNob3dzIHRoZSBwZXItc2VydmVyIGFwcHJvdmFsXG4gICAgLy8gVUkuIFdyaXRpbmcgZW5hYmxlZE1jcGpzb25TZXJ2ZXJzL2VuYWJsZUFsbFByb2plY3RNY3BTZXJ2ZXJzIGhlcmUgd291bGRcbiAgICAvLyBtYXJrIGV2ZXJ5IHNlcnZlciAnYXBwcm92ZWQnIGFuZCBzaWxlbnRseSBza2lwIHRoYXQgZGlhbG9nLiBTZWUgIzE1NTU4LlxuXG4gICAgb25Eb25lKClcbiAgfVxuXG4gIC8vIERlZmF1bHQgb25FeGl0IGlzIHVzZUFwcCgpLmV4aXQoKSDihpIgSW5rLnVubW91bnQoKSwgd2hpY2ggdGVhcnMgZG93biB0aGVcbiAgLy8gUmVhY3QgdHJlZSBidXQgbmV2ZXIgY2FsbHMgb25Eb25lKCkuIHNob3dTZXR1cFNjcmVlbnMoKSBpblxuICAvLyBpbnRlcmFjdGl2ZUhlbHBlcnMudHN4IGF3YWl0cyBhIFByb21pc2UgdGhhdCBvbmx5IHJlc29sdmVzIHZpYSBvbkRvbmUsXG4gIC8vIHNvIHRoZSBkZWZhdWx0IHdvdWxkIGhhbmcgdGhlIGF3YWl0IGZvcmV2ZXIuIFdpdGgga2V5YmluZGluZ1xuICAvLyBjdXN0b21pemF0aW9uIGVuYWJsZWQsIHRoZSBjaG9raWRhciB3YXRjaGVyIChwZXJzaXN0ZW50OiB0cnVlKSBrZWVwcyB0aGVcbiAgLy8gZXZlbnQgbG9vcCBhbGl2ZSBhbmQgdGhlIHByb2Nlc3MgZnJlZXplcy4gRXhwbGljaXRseSBleGl0IDEgbGlrZSBcIk5vXCIuXG4gIGNvbnN0IGV4aXRTdGF0ZSA9IHVzZUV4aXRPbkN0cmxDRFdpdGhLZXliaW5kaW5ncygoKSA9PlxuICAgIGdyYWNlZnVsU2h1dGRvd25TeW5jKDEpLFxuICApXG5cbiAgLy8gVXNlIGNvbmZpZ3VyYWJsZSBrZXliaW5kaW5nIGZvciBFU0MgdG8gY2FuY2VsL2V4aXRcbiAgdXNlS2V5YmluZGluZyhcbiAgICAnY29uZmlybTpubycsXG4gICAgKCkgPT4ge1xuICAgICAgZ3JhY2VmdWxTaHV0ZG93blN5bmMoMClcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSxcbiAgKVxuXG4gIC8vIEF1dG9tYXRpY2FsbHkgcmVzb2x2ZSB0aGUgdHJ1c3QgZGlhbG9nIGlmIHRoZXJlIGlzIG5vdGhpbmcgdG8gYmUgc2hvd24uXG4gIGlmIChoYXNUcnVzdERpYWxvZ0FjY2VwdGVkKSB7XG4gICAgc2V0VGltZW91dChvbkRvbmUpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPFBlcm1pc3Npb25EaWFsb2dcbiAgICAgIGNvbG9yPVwid2FybmluZ1wiXG4gICAgICB0aXRsZUNvbG9yPVwid2FybmluZ1wiXG4gICAgICB0aXRsZT1cIkFjY2Vzc2luZyB3b3Jrc3BhY2U6XCJcbiAgICA+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBnYXA9ezF9IHBhZGRpbmdUb3A9ezF9PlxuICAgICAgICA8VGV4dCBib2xkPntnZXRGc0ltcGxlbWVudGF0aW9uKCkuY3dkKCl9PC9UZXh0PlxuXG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIFF1aWNrIHNhZmV0eSBjaGVjazogSXMgdGhpcyBhIHByb2plY3QgeW91IGNyZWF0ZWQgb3Igb25lIHlvdSB0cnVzdD9cbiAgICAgICAgICAoTGlrZSB5b3VyIG93biBjb2RlLCBhIHdlbGwta25vd24gb3BlbiBzb3VyY2UgcHJvamVjdCwgb3Igd29yayBmcm9tXG4gICAgICAgICAgeW91ciB0ZWFtKS4gSWYgbm90LCB0YWtlIGEgbW9tZW50IHRvIHJldmlldyB3aGF0e1wiJ1wifXMgaW4gdGhpcyBmb2xkZXJcbiAgICAgICAgICBmaXJzdC5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICBDbGF1ZGUgQ29kZXtcIidcIn1sbCBiZSBhYmxlIHRvIHJlYWQsIGVkaXQsIGFuZCBleGVjdXRlIGZpbGVzIGhlcmUuXG4gICAgICAgIDwvVGV4dD5cblxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICA8TGluayB1cmw9XCJodHRwczovL2NvZGUuY2xhdWRlLmNvbS9kb2NzL2VuL3NlY3VyaXR5XCI+XG4gICAgICAgICAgICBTZWN1cml0eSBndWlkZVxuICAgICAgICAgIDwvTGluaz5cbiAgICAgICAgPC9UZXh0PlxuXG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAgICB7IGxhYmVsOiAnWWVzLCBJIHRydXN0IHRoaXMgZm9sZGVyJywgdmFsdWU6ICdlbmFibGVfYWxsJyB9LFxuICAgICAgICAgICAgeyBsYWJlbDogJ05vLCBleGl0JywgdmFsdWU6ICdleGl0JyB9LFxuICAgICAgICAgIF19XG4gICAgICAgICAgb25DaGFuZ2U9e3ZhbHVlID0+IG9uQ2hhbmdlKHZhbHVlIGFzICdlbmFibGVfYWxsJyB8ICdleGl0Jyl9XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IG9uQ2hhbmdlKCdleGl0Jyl9XG4gICAgICAgIC8+XG5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgICAge2V4aXRTdGF0ZS5wZW5kaW5nID8gKFxuICAgICAgICAgICAgPD5QcmVzcyB7ZXhpdFN0YXRlLmtleU5hbWV9IGFnYWluIHRvIGV4aXQ8Lz5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPD5FbnRlciB0byBjb25maXJtIMK3IEVzYyB0byBjYW5jZWw8Lz5cbiAgICAgICAgICApfVxuICAgICAgICA8L1RleHQ+XG4gICAgICA8L0JveD5cbiAgICA8L1Blcm1pc3Npb25EaWFsb2c+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLE9BQU8sUUFBUSxJQUFJO0FBQzVCLE9BQU9DLEtBQUssTUFBTSxPQUFPO0FBQ3pCLFNBQVNDLFFBQVEsUUFBUSxpQ0FBaUM7QUFDMUQsU0FBU0MsdUJBQXVCLFFBQVEsMEJBQTBCO0FBQ2xFLGNBQWNDLE9BQU8sUUFBUSxtQkFBbUI7QUFDaEQsU0FBU0MsOEJBQThCLFFBQVEsK0NBQStDO0FBQzlGLFNBQVNDLEdBQUcsRUFBRUMsSUFBSSxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUM5QyxTQUFTQyxhQUFhLFFBQVEsb0NBQW9DO0FBQ2xFLFNBQVNDLG9CQUFvQixRQUFRLDhCQUE4QjtBQUNuRSxTQUFTQyxjQUFjLFFBQVEsa0NBQWtDO0FBQ2pFLFNBQ0VDLDJCQUEyQixFQUMzQkMsd0JBQXdCLFFBQ25CLHVCQUF1QjtBQUM5QixTQUFTQyxNQUFNLFFBQVEsb0JBQW9CO0FBQzNDLFNBQVNDLG1CQUFtQixRQUFRLDZCQUE2QjtBQUNqRSxTQUFTQyxvQkFBb0IsUUFBUSxpQ0FBaUM7QUFDdEUsU0FBU0MsTUFBTSxRQUFRLDBCQUEwQjtBQUNqRCxTQUFTQyxnQkFBZ0IsUUFBUSxvQ0FBb0M7QUFDckUsU0FDRUMsc0JBQXNCLEVBQ3RCQyxxQkFBcUIsRUFDckJDLHdCQUF3QixFQUN4QkMsMEJBQTBCLEVBQzFCQyxxQkFBcUIsRUFDckJDLGVBQWUsRUFDZkMsMkJBQTJCLFFBQ3RCLFlBQVk7QUFFbkIsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLE1BQU0sRUFBRSxFQUFFLElBQUk7RUFDZEMsUUFBUSxDQUFDLEVBQUV4QixPQUFPLEVBQUU7QUFDdEIsQ0FBQztBQUVELE9BQU8sU0FBQXlCLFlBQUFDLEVBQUE7RUFBQSxNQUFBQyxDQUFBLEdBQUFDLEVBQUE7RUFBcUI7SUFBQUwsTUFBQTtJQUFBQztFQUFBLElBQUFFLEVBQTJCO0VBQUEsSUFBQUcsRUFBQTtFQUFBLElBQUFGLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBQ2pCRixFQUFBLEdBQUF2QixvQkFBb0IsQ0FBQyxTQUFTLENBQUM7SUFBQXFCLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQW5FO0lBQUFLLE9BQUEsRUFBQUM7RUFBQSxJQUFvQ0osRUFBK0I7RUFBQSxJQUFBSyxFQUFBO0VBQUEsSUFBQVAsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFPN0NHLEVBQUEsR0FBQUMsTUFBTSxDQUFBQyxJQUFLLENBQUNILGNBQWMsQ0FBQztJQUFBTixDQUFBLE1BQUFPLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFQLENBQUE7RUFBQTtFQUFqRCxNQUFBVSxhQUFBLEdBQXNCSCxFQUEyQixDQUFBSSxNQUFPLEdBQUcsQ0FBQztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBWixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUVoQ1EsRUFBQSxHQUFBbkIsZUFBZSxDQUFDLENBQUM7SUFBQU8sQ0FBQSxNQUFBWSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBWixDQUFBO0VBQUE7RUFBN0MsTUFBQWEsbUJBQUEsR0FBNEJELEVBQWlCO0VBQzdDLE1BQUFFLFFBQUEsR0FBaUJELG1CQUFtQixDQUFBRixNQUFPLEdBQUcsQ0FBQztFQUFBLElBQUFJLEVBQUE7RUFBQSxJQUFBZixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUVwQlcsRUFBQSxHQUFBekIsd0JBQXdCLENBQUMsQ0FBQztJQUFBVSxDQUFBLE1BQUFlLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFmLENBQUE7RUFBQTtFQUFyRCxNQUFBZ0Isa0JBQUEsR0FBMkJELEVBQTBCO0VBQUEsSUFBQUUsRUFBQTtFQUFBLElBQUFqQixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUV6QmEsRUFBQSxHQUFBN0Isc0JBQXNCLENBQUMsQ0FBQztJQUFBWSxDQUFBLE1BQUFpQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBakIsQ0FBQTtFQUFBO0VBQXBELE1BQUFrQixtQkFBQSxHQUE0QkQsRUFBd0I7RUFDcEQsTUFBQUUsZUFBQSxHQUF3QkQsbUJBQW1CLENBQUFQLE1BQU8sR0FBRyxDQUFDO0VBQUEsSUFBQVMsRUFBQTtFQUFBLElBQUFwQixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUUzQmdCLEVBQUEsR0FBQS9CLHFCQUFxQixDQUFDLENBQUM7SUFBQVcsQ0FBQSxNQUFBb0IsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQXBCLENBQUE7RUFBQTtFQUFsRCxNQUFBcUIsa0JBQUEsR0FBMkJELEVBQXVCO0VBQ2xELE1BQUFFLGNBQUEsR0FBdUJELGtCQUFrQixDQUFBVixNQUFPLEdBQUcsQ0FBQztFQUFBLElBQUFZLEVBQUE7RUFBQSxJQUFBdkIsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFFekJtQixFQUFBLEdBQUEvQixxQkFBcUIsQ0FBQyxDQUFDO0lBQUFRLENBQUEsTUFBQXVCLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUF2QixDQUFBO0VBQUE7RUFBbEQsTUFBQXdCLGtCQUFBLEdBQTJCRCxFQUF1QjtFQUNsRCxNQUFBRSxjQUFBLEdBQXVCRCxrQkFBa0IsQ0FBQWIsTUFBTyxHQUFHLENBQUM7RUFBQSxJQUFBZSxFQUFBO0VBQUEsSUFBQTFCLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBRW5Cc0IsRUFBQSxHQUFBaEMsMkJBQTJCLENBQUMsQ0FBQztJQUFBTSxDQUFBLE1BQUEwQixFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBMUIsQ0FBQTtFQUFBO0VBQTlELE1BQUEyQix3QkFBQSxHQUFpQ0QsRUFBNkI7RUFDOUQsTUFBQUUsb0JBQUEsR0FBNkJELHdCQUF3QixDQUFBaEIsTUFBTyxHQUFHLENBQUM7RUFBQSxJQUFBa0IsRUFBQTtFQUFBLElBQUE3QixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUVoQ3lCLEVBQUEsR0FBQXRDLDBCQUEwQixDQUFDLENBQUM7SUFBQVMsQ0FBQSxNQUFBNkIsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQTdCLENBQUE7RUFBQTtFQUE1RCxNQUFBOEIsdUJBQUEsR0FBZ0NELEVBQTRCO0VBQzVELE1BQUFFLG1CQUFBLEdBQTRCRCx1QkFBdUIsQ0FBQW5CLE1BQU8sR0FBRyxDQUFDO0VBQUEsSUFBQXFCLEdBQUE7RUFBQSxJQUFBaEMsQ0FBQSxRQUFBSCxRQUFBO0lBRzVEbUMsR0FBQSxHQUFBbkMsUUFBUSxFQUFBb0MsSUFVUCxDQVRDQyxNQVNPLENBQUMsSUFWVixLQVVVO0lBQUFsQyxDQUFBLE1BQUFILFFBQUE7SUFBQUcsQ0FBQSxPQUFBZ0MsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQWhDLENBQUE7RUFBQTtFQVhaLE1BQUFtQyxtQkFBQSxHQUNFSCxHQVVVO0VBQUEsSUFBQUksR0FBQTtFQUFBLElBQUFwQyxDQUFBLFNBQUFILFFBQUE7SUFHVnVDLEdBQUEsR0FBQXZDLFFBQVEsRUFBQW9DLElBV1AsQ0FWQ0ksTUFVTyxDQUFDLElBWFYsS0FXVTtJQUFBckMsQ0FBQSxPQUFBSCxRQUFBO0lBQUFHLENBQUEsT0FBQW9DLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFwQyxDQUFBO0VBQUE7RUFaWixNQUFBc0MsYUFBQSxHQUNFRixHQVdVO0VBRVosTUFBQUcsbUJBQUEsR0FDRXZCLGtCQUFrQixDQUFBTCxNQUFPLEdBQUcsQ0FBd0IsSUFBcER3QixtQkFBcUUsSUFBckVHLGFBQXFFO0VBRXZFLE1BQUFFLHNCQUFBLEdBQStCM0QsMkJBQTJCLENBQUMsQ0FBQztFQUFBLElBQUE0RCxHQUFBO0VBQUEsSUFBQUMsR0FBQTtFQUFBLElBQUExQyxDQUFBLFNBQUF1QyxtQkFBQTtJQUU1Q0UsR0FBQSxHQUFBQSxDQUFBO01BQ2QsTUFBQUUsU0FBQSxHQUFrQjFFLE9BQU8sQ0FBQyxDQUFDLEtBQUtjLE1BQU0sQ0FBQyxDQUFDO01BQ3hDWixRQUFRLENBQUMsMEJBQTBCLEVBQUU7UUFBQXdFLFNBQUE7UUFBQWpDLGFBQUE7UUFBQUksUUFBQTtRQUFBOEIsZ0JBQUEsRUFJakJMLG1CQUFtQjtRQUFBcEIsZUFBQTtRQUFBRyxjQUFBO1FBQUFHLGNBQUE7UUFBQUcsb0JBQUE7UUFBQUc7TUFNdkMsQ0FBQyxDQUFDO0lBQUEsQ0FDSDtJQUFFVyxHQUFBLElBQ0RoQyxhQUFhLEVBQ2JJLFFBQVEsRUFDUnlCLG1CQUFtQixFQUNuQnBCLGVBQWUsRUFDZkcsY0FBYyxFQUNkRyxjQUFjLEVBQ2RHLG9CQUFvQixFQUNwQkcsbUJBQW1CLENBQ3BCO0lBQUEvQixDQUFBLE9BQUF1QyxtQkFBQTtJQUFBdkMsQ0FBQSxPQUFBeUMsR0FBQTtJQUFBekMsQ0FBQSxPQUFBMEMsR0FBQTtFQUFBO0lBQUFELEdBQUEsR0FBQXpDLENBQUE7SUFBQTBDLEdBQUEsR0FBQTFDLENBQUE7RUFBQTtFQXRCRDlCLEtBQUssQ0FBQTJFLFNBQVUsQ0FBQ0osR0FhZixFQUFFQyxHQVNGLENBQUM7RUFBQSxJQUFBSSxHQUFBO0VBQUEsSUFBQTlDLENBQUEsU0FBQXVDLG1CQUFBLElBQUF2QyxDQUFBLFNBQUFKLE1BQUE7SUFFRmtELEdBQUEsWUFBQUMsU0FBQUMsS0FBQTtNQUNFLElBQUlBLEtBQUssS0FBSyxNQUFNO1FBQ2xCL0Qsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQUE7TUFBQTtNQUl6QixNQUFBZ0UsV0FBQSxHQUFrQmhGLE9BQU8sQ0FBQyxDQUFDLEtBQUtjLE1BQU0sQ0FBQyxDQUFDO01BRXhDWixRQUFRLENBQUMsMkJBQTJCLEVBQUU7UUFBQXdFLFNBQUEsRUFDcENBLFdBQVM7UUFBQWpDLGFBQUE7UUFBQUksUUFBQTtRQUFBOEIsZ0JBQUEsRUFHU0wsbUJBQW1CO1FBQUFwQixlQUFBO1FBQUFHLGNBQUE7UUFBQUcsY0FBQTtRQUFBRyxvQkFBQTtRQUFBRztNQU12QyxDQUFDLENBQUM7TUFFRixJQUFJWSxXQUFTO1FBSVh2RSx1QkFBdUIsQ0FBQyxJQUFJLENBQUM7TUFBQTtRQUU3QlUsd0JBQXdCLENBQUNvRSxNQUd2QixDQUFDO01BQUE7TUFRTHRELE1BQU0sQ0FBQyxDQUFDO0lBQUEsQ0FDVDtJQUFBSSxDQUFBLE9BQUF1QyxtQkFBQTtJQUFBdkMsQ0FBQSxPQUFBSixNQUFBO0lBQUFJLENBQUEsT0FBQThDLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUE5QyxDQUFBO0VBQUE7RUF0Q0QsTUFBQStDLFFBQUEsR0FBQUQsR0FzQ0M7RUFRRCxNQUFBSyxTQUFBLEdBQWtCN0UsOEJBQThCLENBQUM4RSxNQUVqRCxDQUFDO0VBQUEsSUFBQUMsR0FBQTtFQUFBLElBQUFyRCxDQUFBLFNBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQVFDaUQsR0FBQTtNQUFBQyxPQUFBLEVBQVc7SUFBZSxDQUFDO0lBQUF0RCxDQUFBLE9BQUFxRCxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBckQsQ0FBQTtFQUFBO0VBTDdCdEIsYUFBYSxDQUNYLFlBQVksRUFDWjZFLE1BRUMsRUFDREYsR0FDRixDQUFDO0VBR0QsSUFBSWIsc0JBQXNCO0lBQ3hCZ0IsVUFBVSxDQUFDNUQsTUFBTSxDQUFDO0lBQUEsT0FDWCxJQUFJO0VBQUE7RUFDWixJQUFBNkQsR0FBQTtFQUFBLElBQUFDLEdBQUE7RUFBQSxJQUFBQyxHQUFBO0VBQUEsSUFBQTNELENBQUEsU0FBQUcsTUFBQSxDQUFBQyxHQUFBO0lBU0txRCxHQUFBLElBQUMsSUFBSSxDQUFDLElBQUksQ0FBSixLQUFHLENBQUMsQ0FBRSxDQUFBekUsbUJBQW1CLENBQUMsQ0FBQyxDQUFBNEUsR0FBSSxDQUFDLEVBQUUsRUFBdkMsSUFBSSxDQUEwQztJQUUvQ0YsR0FBQSxJQUFDLElBQUksQ0FBQyx3TEFHNkMsSUFBRSxDQUFFLHVCQUV2RCxFQUxDLElBQUksQ0FLRTtJQUNQQyxHQUFBLElBQUMsSUFBSSxDQUFDLFdBQ1EsSUFBRSxDQUFFLGlEQUNsQixFQUZDLElBQUksQ0FFRTtJQUFBM0QsQ0FBQSxPQUFBeUQsR0FBQTtJQUFBekQsQ0FBQSxPQUFBMEQsR0FBQTtJQUFBMUQsQ0FBQSxPQUFBMkQsR0FBQTtFQUFBO0lBQUFGLEdBQUEsR0FBQXpELENBQUE7SUFBQTBELEdBQUEsR0FBQTFELENBQUE7SUFBQTJELEdBQUEsR0FBQTNELENBQUE7RUFBQTtFQUFBLElBQUE2RCxHQUFBO0VBQUEsSUFBQTdELENBQUEsU0FBQUcsTUFBQSxDQUFBQyxHQUFBO0lBRVB5RCxHQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLElBQUksQ0FBSyxHQUEwQyxDQUExQywwQ0FBMEMsQ0FBQyxjQUVyRCxFQUZDLElBQUksQ0FHUCxFQUpDLElBQUksQ0FJRTtJQUFBN0QsQ0FBQSxPQUFBNkQsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQTdELENBQUE7RUFBQTtFQUFBLElBQUE4RCxHQUFBO0VBQUEsSUFBQTlELENBQUEsU0FBQUcsTUFBQSxDQUFBQyxHQUFBO0lBR0kwRCxHQUFBLElBQ1A7TUFBQUMsS0FBQSxFQUFTLDBCQUEwQjtNQUFBZixLQUFBLEVBQVM7SUFBYSxDQUFDLEVBQzFEO01BQUFlLEtBQUEsRUFBUyxVQUFVO01BQUFmLEtBQUEsRUFBUztJQUFPLENBQUMsQ0FDckM7SUFBQWhELENBQUEsT0FBQThELEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUE5RCxDQUFBO0VBQUE7RUFBQSxJQUFBZ0UsR0FBQTtFQUFBLElBQUFoRSxDQUFBLFNBQUErQyxRQUFBO0lBSkhpQixHQUFBLElBQUMsTUFBTSxDQUNJLE9BR1IsQ0FIUSxDQUFBRixHQUdULENBQUMsQ0FDUyxRQUFpRCxDQUFqRCxDQUFBRyxPQUFBLElBQVNsQixRQUFRLENBQUNDLE9BQUssSUFBSSxZQUFZLEdBQUcsTUFBTSxFQUFDLENBQ2pELFFBQXNCLENBQXRCLE9BQU1ELFFBQVEsQ0FBQyxNQUFNLEVBQUMsR0FDaEM7SUFBQS9DLENBQUEsT0FBQStDLFFBQUE7SUFBQS9DLENBQUEsT0FBQWdFLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFoRSxDQUFBO0VBQUE7RUFBQSxJQUFBa0UsR0FBQTtFQUFBLElBQUFsRSxDQUFBLFNBQUFtRCxTQUFBLENBQUFnQixPQUFBLElBQUFuRSxDQUFBLFNBQUFtRCxTQUFBLENBQUFpQixPQUFBO0lBRUZGLEdBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUNYLENBQUFmLFNBQVMsQ0FBQWlCLE9BSVQsR0FKQSxFQUNHLE1BQU8sQ0FBQWpCLFNBQVMsQ0FBQWdCLE9BQU8sQ0FBRSxjQUFjLEdBRzFDLEdBSkEsRUFHRyxnQ0FBZ0MsR0FDcEMsQ0FDRixFQU5DLElBQUksQ0FNRTtJQUFBbkUsQ0FBQSxPQUFBbUQsU0FBQSxDQUFBZ0IsT0FBQTtJQUFBbkUsQ0FBQSxPQUFBbUQsU0FBQSxDQUFBaUIsT0FBQTtJQUFBcEUsQ0FBQSxPQUFBa0UsR0FBQTtFQUFBO0lBQUFBLEdBQUEsR0FBQWxFLENBQUE7RUFBQTtFQUFBLElBQUFxRSxHQUFBO0VBQUEsSUFBQXJFLENBQUEsU0FBQWdFLEdBQUEsSUFBQWhFLENBQUEsU0FBQWtFLEdBQUE7SUF2Q1hHLEdBQUEsSUFBQyxnQkFBZ0IsQ0FDVCxLQUFTLENBQVQsU0FBUyxDQUNKLFVBQVMsQ0FBVCxTQUFTLENBQ2QsS0FBc0IsQ0FBdEIsc0JBQXNCLENBRTVCLENBQUMsR0FBRyxDQUFlLGFBQVEsQ0FBUixRQUFRLENBQU0sR0FBQyxDQUFELEdBQUMsQ0FBYyxVQUFDLENBQUQsR0FBQyxDQUMvQyxDQUFBWixHQUE4QyxDQUU5QyxDQUFBQyxHQUtNLENBQ04sQ0FBQUMsR0FFTSxDQUVOLENBQUFFLEdBSU0sQ0FFTixDQUFBRyxHQU9DLENBRUQsQ0FBQUUsR0FNTSxDQUNSLEVBbkNDLEdBQUcsQ0FvQ04sRUF6Q0MsZ0JBQWdCLENBeUNFO0lBQUFsRSxDQUFBLE9BQUFnRSxHQUFBO0lBQUFoRSxDQUFBLE9BQUFrRSxHQUFBO0lBQUFsRSxDQUFBLE9BQUFxRSxHQUFBO0VBQUE7SUFBQUEsR0FBQSxHQUFBckUsQ0FBQTtFQUFBO0VBQUEsT0F6Q25CcUUsR0F5Q21CO0FBQUE7QUFqTWhCLFNBQUFkLE9BQUE7RUE0SUR0RSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7QUFBQTtBQTVJdEIsU0FBQW1FLE9BQUE7RUFBQSxPQXFJSG5FLG9CQUFvQixDQUFDLENBQUMsQ0FBQztBQUFBO0FBcklwQixTQUFBaUUsT0FBQW9CLE9BQUE7RUFBQSxPQWdIb0M7SUFBQSxHQUNoQ0EsT0FBTztJQUFBOUIsc0JBQUEsRUFDYztFQUMxQixDQUFDO0FBQUE7QUFuSEEsU0FBQUgsT0FBQWtDLFNBQUE7RUFBQSxPQThDQ0MsU0FBTyxDQUFBQyxJQUFLLEtBQUssUUFDbUQsS0FBbkVELFNBQU8sQ0FBQUUsVUFBVyxLQUFLLFFBQTJDLElBQS9CRixTQUFPLENBQUFFLFVBQVcsS0FBSyxRQUFTLENBR3RDLEtBRjdCRixTQUFPLENBQUFHLE1BQU8sS0FBSyxpQkFDZ0IsSUFBbENILFNBQU8sQ0FBQUcsTUFBTyxLQUFLLGVBQ1EsSUFBM0JILFNBQU8sQ0FBQUcsTUFBTyxLQUFLLFFBQVMsQ0FJN0IsSUFIREgsU0FBTyxDQUFBSSxZQUFtQixFQUFBM0MsSUFHekIsQ0FGQzRDLE1BRUYsQ0FBQztBQUFBO0FBdERGLFNBQUFBLE9BQUFDLE1BQUE7RUFBQSxPQXFES0MsTUFBSSxLQUFLbkcsY0FBdUQsSUFBckNtRyxNQUFJLENBQUFDLFVBQVcsQ0FBQ3BHLGNBQWMsR0FBRyxHQUFHLENBQUM7QUFBQTtBQXJEckUsU0FBQXNELE9BQUFzQyxPQUFBO0VBQUEsT0FpQ0NBLE9BQU8sQ0FBQUMsSUFBSyxLQUFLLFFBQzJCLElBQTVDRCxPQUFPLENBQUFFLFVBQVcsS0FBSyxxQkFFYyxLQURwQ0YsT0FBTyxDQUFBRyxNQUFPLEtBQUssaUJBQ2dCLElBQWxDSCxPQUFPLENBQUFHLE1BQU8sS0FBSyxlQUFnQixDQUlwQyxJQUhESCxPQUFPLENBQUFJLFlBQW1CLEVBQUEzQyxJQUd6QixDQUZDZ0QsS0FFRixDQUFDO0FBQUE7QUF4Q0YsU0FBQUEsTUFBQUYsSUFBQTtFQUFBLE9BdUNLQSxJQUFJLEtBQUtuRyxjQUF1RCxJQUFyQ21HLElBQUksQ0FBQUMsVUFBVyxDQUFDcEcsY0FBYyxHQUFHLEdBQUcsQ0FBQztBQUFBIiwiaWdub3JlTGlzdCI6W119