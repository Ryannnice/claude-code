// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 figures，将 figures 中已经封装好的能力接到本文件流程里。
import figures from 'figures';
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path';
// 引入 React、Suspense、use、useCallback、useEffect、useMemo、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { Suspense, use, useCallback, useEffect, useMemo, useState } from 'react';
// 复用 KeybindingWarnings 终端界面组件，避免在这里重复拼装显示逻辑。
import { KeybindingWarnings } from 'src/components/KeybindingWarnings.js';
// 复用 McpParsingWarnings 终端界面组件，避免在这里重复拼装显示逻辑。
import { McpParsingWarnings } from 'src/components/mcp/McpParsingWarnings.js';
// 复用 getModelMaxOutputTokens 工具函数，把通用处理留在 src/utils/context.js 中维护。
import { getModelMaxOutputTokens } from 'src/utils/context.js';
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 src/utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from 'src/utils/envUtils.js';
// 类型依赖 { SettingSource } 来自 src/utils/settings/constants.js，用于校准终端渲染的数据契约。
import type { SettingSource } from 'src/utils/settings/constants.js';
// 引入 getOriginalCwd，将 ../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getOriginalCwd } from '../bootstrap/state.js';
// 类型依赖 { CommandResultDisplay } 来自 ../commands.js，用于校准终端渲染的数据契约。
import type { CommandResultDisplay } from '../commands.js';
// 复用 Pane 终端界面组件，避免在这里重复拼装显示逻辑。
import { Pane } from '../components/design-system/Pane.js';
// 复用 PressEnterToContinue 终端界面组件，避免在这里重复拼装显示逻辑。
import { PressEnterToContinue } from '../components/PressEnterToContinue.js';
// 复用 SandboxDoctorSection 终端界面组件，避免在这里重复拼装显示逻辑。
import { SandboxDoctorSection } from '../components/sandbox/SandboxDoctorSection.js';
// 复用 ValidationErrorsList 终端界面组件，避免在这里重复拼装显示逻辑。
import { ValidationErrorsList } from '../components/ValidationErrorsList.js';
// 引入 useSettingsErrors，将 ../hooks/notifs/useSettingsErrors.js 中已经封装好的能力接到本文件流程里。
import { useSettingsErrors } from '../hooks/notifs/useSettingsErrors.js';
// 引入 useExitOnCtrlCDWithKeybindings，将 ../hooks/useExitOnCtrlCDWithKeybindings.js 中已经封装好的能力接到本文件流程里。
import { useExitOnCtrlCDWithKeybindings } from '../hooks/useExitOnCtrlCDWithKeybindings.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybindings，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybindings } from '../keybindings/useKeybinding.js';
// 引入 useAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../state/AppState.js';
// 引入 getPluginErrorMessage，将 ../types/plugin.js 中已经封装好的能力接到本文件流程里。
import { getPluginErrorMessage } from '../types/plugin.js';
// 复用 getGcsDistTags、getNpmDistTags、NpmDistTags 工具函数，把通用处理留在 ../utils/autoUpdater.js 中维护。
import { getGcsDistTags, getNpmDistTags, type NpmDistTags } from '../utils/autoUpdater.js';
// 复用 ContextWarnings、checkContextWarnings 工具函数，把通用处理留在 ../utils/doctorContextWarnings.js 中维护。
import { type ContextWarnings, checkContextWarnings } from '../utils/doctorContextWarnings.js';
// 复用 DiagnosticInfo、getDoctorDiagnostic 工具函数，把通用处理留在 ../utils/doctorDiagnostic.js 中维护。
import { type DiagnosticInfo, getDoctorDiagnostic } from '../utils/doctorDiagnostic.js';
// 复用 validateBoundedIntEnvVar 工具函数，把通用处理留在 ../utils/envValidation.js 中维护。
import { validateBoundedIntEnvVar } from '../utils/envValidation.js';
// 复用 pathExists 工具函数，把通用处理留在 ../utils/file.js 中维护。
import { pathExists } from '../utils/file.js';
// 复用 cleanupStaleLocks、getAllLockInfo、isPidBasedLockingEnabled、LockInfo 工具函数，把通用处理留在 ../utils/nativeInstaller/pidLock.js 中维护。
import { cleanupStaleLocks, getAllLockInfo, isPidBasedLockingEnabled, type LockInfo } from '../utils/nativeInstaller/pidLock.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../utils/settings/settings.js';
// 复用 BASH_MAX_OUTPUT_DEFAULT、BASH_MAX_OUTPUT_UPPER_LIMIT 工具函数，把通用处理留在 ../utils/shell/outputLimits.js 中维护。
import { BASH_MAX_OUTPUT_DEFAULT, BASH_MAX_OUTPUT_UPPER_LIMIT } from '../utils/shell/outputLimits.js';
// 复用 TASK_MAX_OUTPUT_DEFAULT、TASK_MAX_OUTPUT_UPPER_LIMIT 工具函数，把通用处理留在 ../utils/task/outputFormatting.js 中维护。
import { TASK_MAX_OUTPUT_DEFAULT, TASK_MAX_OUTPUT_UPPER_LIMIT } from '../utils/task/outputFormatting.js';
// 复用 getXDGStateHome 工具函数，把通用处理留在 ../utils/xdg.js 中维护。
import { getXDGStateHome } from '../utils/xdg.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  onDone: (result?: string, options?: {
    display?: CommandResultDisplay;
  }) => void;
};
// AgentInfo 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type AgentInfo = {
  activeAgents: Array<{
    agentType: string;
    source: SettingSource | 'built-in' | 'plugin';
  }>;
  userAgentsDir: string;
  projectAgentsDir: string;
  userDirExists: boolean;
  projectDirExists: boolean;
  failedFiles?: Array<{
    path: string;
    error: string;
  }>;
};
// VersionLockInfo 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type VersionLockInfo = {
  enabled: boolean;
  locks: LockInfo[];
  locksDir: string;
  staleLocksCleaned: number;
};
// DistTagsDisplay 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function DistTagsDisplay(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    promise
  } = t0;
  // distTags 集合保存`use`，供终端渲染后续处理使用。
  const distTags = use(promise);
  // distTags.latest缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!distTags.latest) {
    // t1 暂存 `<Text dimColor={true}>└ Failed to fetch versions</Text>` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      // t1 暂存 `<Text dimColor={true}>└ Failed to fetch versions</Text>` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text dimColor={true}>└ Failed to fetch versions</Text>;
      // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[0] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[0];
    }
    // 返回 `t1`，作为终端渲染这次计算的结果。
    return t1;
  }
  // t1 暂存 `distTags.stable && <Text>└ Stable version: {distTags.stab...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== distTags.stable) {
    // t1 暂存 `distTags.stable && <Text>└ Stable version: {distTags.stab...` 生成的渲染片段，后续返回路径直接复用。
    t1 = distTags.stable && <Text>└ Stable version: {distTags.stable}</Text>;
    // $[1] 缓存 `distTags.stable`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = distTags.stable;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // t2 暂存 `<Text>└ Latest version: {distTags.latest}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== distTags.latest) {
    // t2 暂存 `<Text>└ Latest version: {distTags.latest}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Text>└ Latest version: {distTags.latest}</Text>;
    // $[3] 缓存 `distTags.latest`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = distTags.latest;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `<>{t1}{t2}</>` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== t1 || $[6] !== t2) {
    // t3 暂存 `<>{t1}{t2}</>` 生成的渲染片段，后续返回路径直接复用。
    t3 = <>{t1}{t2}</>;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // 返回 `t3`，作为终端渲染这次计算的结果。
  return t3;
}
// Doctor 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Doctor(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(84);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // agentDefinitions 集合保存`useAppState`，供终端渲染后续处理使用。
  const agentDefinitions = useAppState(_temp);
  // mcpTools 集合保存`useAppState`，供终端渲染后续处理使用。
  const mcpTools = useAppState(_temp2);
  // toolPermissionContext 权限数据保存`useAppState`，供终端渲染后续处理使用。
  const toolPermissionContext = useAppState(_temp3);
  // pluginsErrors 插件数据保存`useAppState`，供终端渲染后续处理使用。
  const pluginsErrors = useAppState(_temp4);
  // 调用 useExitOnCtrlCDWithKeybindings，触发终端渲染此处需要的副作用。
  useExitOnCtrlCDWithKeybindings();
  // t1 暂存 `mcpTools || []` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== mcpTools) {
    // t1 暂存 `mcpTools || []` 生成的渲染片段，后续返回路径直接复用。
    t1 = mcpTools || [];
    // $[0] 缓存 `mcpTools`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = mcpTools;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // tools 集合沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const tools = t1;
  // diagnostic 由 React state 持有，setDiagnostic 会在用户操作或异步结果返回时触发刷新。
  const [diagnostic, setDiagnostic] = useState(null);
  // agentInfo 由 React state 持有，setAgentInfo 会在用户操作或异步结果返回时触发刷新。
  const [agentInfo, setAgentInfo] = useState(null);
  // contextWarnings 警告信息 由 React state 持有，setContextWarnings 会在用户操作或异步结果返回时触发刷新。
  const [contextWarnings, setContextWarnings] = useState(null);
  // versionLockInfo 由 React state 持有，setVersionLockInfo 会在用户操作或异步结果返回时触发刷新。
  const [versionLockInfo, setVersionLockInfo] = useState(null);
  // validationErrors 错误信息保存`useSettingsErrors`，供终端渲染后续处理使用。
  const validationErrors = useSettingsErrors();
  // t2 暂存 `getDoctorDiagnostic().then(_temp6)` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getDoctorDiagnostic().then(_temp6)` 生成的渲染片段，后续返回路径直接复用。
    t2 = getDoctorDiagnostic().then(_temp6);
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // distTagsPromise 异步任务 命名 `t2`，让后续代码直接表达这个值的用途。
  const distTagsPromise = t2;
  // autoUpdatesChannel读取`getInitialSettings`，供终端渲染后续处理使用。
  const autoUpdatesChannel = getInitialSettings()?.autoUpdatesChannel ?? "latest";
  // t3 暂存 `validationErrors.filter(_temp7)` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== validationErrors) {
    // t3 暂存 `validationErrors.filter(_temp7)` 生成的渲染片段，后续返回路径直接复用。
    t3 = validationErrors.filter(_temp7);
    // $[3] 缓存 `validationErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = validationErrors;
    // $[4] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[4];
  }
  // errorsExcludingMcp 错误信息 命名 `t3`，让后续代码直接表达这个值的用途。
  const errorsExcludingMcp = t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // envVars 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const envVars = [{
      name: "BASH_MAX_OUTPUT_LENGTH",
      default: BASH_MAX_OUTPUT_DEFAULT,
      upperLimit: BASH_MAX_OUTPUT_UPPER_LIMIT
    }, {
      name: "TASK_MAX_OUTPUT_LENGTH",
      default: TASK_MAX_OUTPUT_DEFAULT,
      upperLimit: TASK_MAX_OUTPUT_UPPER_LIMIT
    }, {
      name: "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
      ...getModelMaxOutputTokens("claude-opus-4-6")
    }];
    // t4 暂存 `envVars.map(_temp8).filter(_temp9)` 生成的渲染片段，后续返回路径直接复用。
    t4 = envVars.map(_temp8).filter(_temp9);
    // $[5] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[5];
  }
  // envValidationErrors 错误信息保存`t4`，作为后续临时缓存值处理的输入。
  const envValidationErrors = t4;
  // t5 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // t6 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== agentDefinitions || $[7] !== toolPermissionContext || $[8] !== tools) {
    // t5 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t5 = () => {
      // 调用 getDoctorDiagnostic，触发终端渲染此处需要的副作用。
      getDoctorDiagnostic().then(setDiagnostic);
      // 这个回调绑定到 (async () => {，负责终端渲染在该局部场景下的响应。
      (async () => {
        // userAgentsDir格式化`join`，供终端渲染后续处理使用。
        const userAgentsDir = join(getClaudeConfigHomeDir(), "agents");
        // projectAgentsDir格式化`join`，供终端渲染后续处理使用。
        const projectAgentsDir = join(getOriginalCwd(), ".claude", "agents");
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          activeAgents,
          allAgents,
          failedFiles
        } = agentDefinitions;
        // 并行获取 userDirExists、projectDirExists，缩短终端页面 Doctor等待多个独立异步任务的时间。
        const [userDirExists, projectDirExists] = await Promise.all([pathExists(userAgentsDir), pathExists(projectAgentsDir)]);
        // agentInfoData 集中保存终端渲染终端页面 Doctor要一起传递的字段。
        const agentInfoData = {
          activeAgents: activeAgents.map(_temp0),
          userAgentsDir,
          projectAgentsDir,
          userDirExists,
          projectDirExists,
          failedFiles
        };
        // setAgentInfo 写入新的状态值，使终端渲染后续读取保持一致。
        setAgentInfo(agentInfoData);
        // 警告列表读取`checkContextWarnings`，供终端渲染后续处理使用。
        const warnings = await checkContextWarnings(tools, {
          activeAgents,
          allAgents,
          failedFiles
        // 这个回调绑定到 }, async () => toolPermissionContext);，负责终端渲染在该局部场景下的响应。
        }, async () => toolPermissionContext);
        // setContextWarnings 写入新的状态值，使终端渲染后续读取保持一致。
        setContextWarnings(warnings);
        // 满足 `isPidBasedLockingEnabled()` 时，终端渲染执行该分支。
        if (isPidBasedLockingEnabled()) {
          // locksDir格式化`join`，供终端渲染后续处理使用。
          const locksDir = join(getXDGStateHome(), "claude", "locks");
          // staleLocksCleaned保存`cleanupStaleLocks`，供终端渲染后续处理使用。
          const staleLocksCleaned = cleanupStaleLocks(locksDir);
          // locks 集合读取`getAllLockInfo`，供终端渲染后续处理使用。
          const locks = getAllLockInfo(locksDir);
          // setVersionLockInfo 写入新的状态值，使终端渲染后续读取保持一致。
          setVersionLockInfo({
            enabled: true,
            locks,
            locksDir,
            staleLocksCleaned
          });
        } else {
          // setVersionLockInfo 写入新的状态值，使终端渲染后续读取保持一致。
          setVersionLockInfo({
            enabled: false,
            locks: [],
            locksDir: "",
            staleLocksCleaned: 0
          });
        }
      })();
    };
    // t6 暂存 `[toolPermissionContext, tools, agentDefinitions]` 生成的渲染片段，后续返回路径直接复用。
    t6 = [toolPermissionContext, tools, agentDefinitions];
    // $[6] 缓存 `agentDefinitions`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = agentDefinitions;
    // $[7] 缓存 `toolPermissionContext`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = toolPermissionContext;
    // $[8] 缓存 `tools`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = tools;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
    // $[10] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t6;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
    // t6 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[10];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t5, t6);
  // t7 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== onDone) {
    // t7 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => {
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone("Claude Code diagnostics dismissed", {
        display: "system"
      });
    };
    // $[11] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = onDone;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[12];
  }
  // handleDismiss 集合保存`t7`，作为后续临时缓存值处理的输入。
  const handleDismiss = t7;
  // t8 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== handleDismiss) {
    // t8 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t8 = {
      "confirm:yes": handleDismiss,
      "confirm:no": handleDismiss
    };
    // $[13] 缓存 `handleDismiss`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = handleDismiss;
    // $[14] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[14];
  }
  // t9 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
    // t9 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t9 = {
      context: "Confirmation"
    };
    // $[15] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[15];
  }
  // 调用 useKeybindings，触发终端渲染此处需要的副作用。
  useKeybindings(t8, t9);
  // diagnostic缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!diagnostic) {
    // t10 暂存 `<Pane><Text dimColor={true}>Checking installation status…...` 的派生结果，便于缓存命中时直接复用。
    let t10;
    // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
      // t10 暂存 `<Pane><Text dimColor={true}>Checking installation status…...` 生成的渲染片段，后续返回路径直接复用。
      t10 = <Pane><Text dimColor={true}>Checking installation status…</Text></Pane>;
      // $[16] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
      $[16] = t10;
    } else {
      // t10 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
      t10 = $[16];
    }
    // 返回 `t10`，作为终端渲染这次计算的结果。
    return t10;
  }
  // t10 暂存 `<Text bold={true}>Diagnostics</Text>` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `<Text bold={true}>Diagnostics</Text>` 生成的渲染片段，后续返回路径直接复用。
    t10 = <Text bold={true}>Diagnostics</Text>;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
  }
  // t11 暂存 `<Text>└ Currently running: {diagnostic.installationType} ...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[18] !== diagnostic.installationType || $[19] !== diagnostic.version) {
    // t11 暂存 `<Text>└ Currently running: {diagnostic.installationType} ...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Text>└ Currently running: {diagnostic.installationType} ({diagnostic.version})</Text>;
    // $[18] 缓存 `diagnostic.installationType`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = diagnostic.installationType;
    // $[19] 缓存 `diagnostic.version`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = diagnostic.version;
    // $[20] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[20];
  }
  // t12 暂存 `diagnostic.packageManager && <Text>└ Package manager: {di...` 的派生结果，便于缓存命中时直接复用。
  let t12;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== diagnostic.packageManager) {
    // t12 暂存 `diagnostic.packageManager && <Text>└ Package manager: {di...` 生成的渲染片段，后续返回路径直接复用。
    t12 = diagnostic.packageManager && <Text>└ Package manager: {diagnostic.packageManager}</Text>;
    // $[21] 缓存 `diagnostic.packageManager`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = diagnostic.packageManager;
    // $[22] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t12;
  } else {
    // t12 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t12 = $[22];
  }
  // t13 暂存 `<Text>└ Path: {diagnostic.installationPath}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t13;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[23] !== diagnostic.installationPath) {
    // t13 暂存 `<Text>└ Path: {diagnostic.installationPath}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t13 = <Text>└ Path: {diagnostic.installationPath}</Text>;
    // $[23] 缓存 `diagnostic.installationPath`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = diagnostic.installationPath;
    // $[24] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t13;
  } else {
    // t13 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t13 = $[24];
  }
  // t14 暂存 `<Text>└ Invoked: {diagnostic.invokedBinary}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t14;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[25] !== diagnostic.invokedBinary) {
    // t14 暂存 `<Text>└ Invoked: {diagnostic.invokedBinary}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t14 = <Text>└ Invoked: {diagnostic.invokedBinary}</Text>;
    // $[25] 缓存 `diagnostic.invokedBinary`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = diagnostic.invokedBinary;
    // $[26] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[26] = t14;
  } else {
    // t14 从 React 编译缓存槽 $[26] 取回渲染片段，避免依赖未变时重建 JSX。
    t14 = $[26];
  }
  // t15 暂存 `<Text>└ Config install method: {diagnostic.configInstallM...` 的派生结果，便于缓存命中时直接复用。
  let t15;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[27] !== diagnostic.configInstallMethod) {
    // t15 暂存 `<Text>└ Config install method: {diagnostic.configInstallM...` 生成的渲染片段，后续返回路径直接复用。
    t15 = <Text>└ Config install method: {diagnostic.configInstallMethod}</Text>;
    // $[27] 缓存 `diagnostic.configInstallMethod`，下次依赖未变时 React 编译产物可直接复用。
    $[27] = diagnostic.configInstallMethod;
    // $[28] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[28] = t15;
  } else {
    // t15 从 React 编译缓存槽 $[28] 取回渲染片段，避免依赖未变时重建 JSX。
    t15 = $[28];
  }
  // t16保存`diagnostic.ripgrepStatus.working ? "OK" : "Not working"`，供后续判断或组装使用。
  const t16 = diagnostic.ripgrepStatus.working ? "OK" : "Not working";
  // t17标记终端渲染终端页面 Doctor是否启用对应路径。
  const t17 = diagnostic.ripgrepStatus.mode === "embedded" ? "bundled" : diagnostic.ripgrepStatus.mode === "builtin" ? "vendor" : diagnostic.ripgrepStatus.systemPath || "system";
  // t18 暂存 `<Text>└ Search: {t16} ({t17})</Text>` 的派生结果，便于缓存命中时直接复用。
  let t18;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[29] !== t16 || $[30] !== t17) {
    // t18 暂存 `<Text>└ Search: {t16} ({t17})</Text>` 生成的渲染片段，后续返回路径直接复用。
    t18 = <Text>└ Search: {t16} ({t17})</Text>;
    // $[29] 缓存 `t16`，下次依赖未变时 React 编译产物可直接复用。
    $[29] = t16;
    // $[30] 缓存 `t17`，下次依赖未变时 React 编译产物可直接复用。
    $[30] = t17;
    // $[31] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[31] = t18;
  } else {
    // t18 从 React 编译缓存槽 $[31] 取回渲染片段，避免依赖未变时重建 JSX。
    t18 = $[31];
  }
  // t19 暂存 `diagnostic.recommendation && <><Text /><Text color="warni...` 的派生结果，便于缓存命中时直接复用。
  let t19;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[32] !== diagnostic.recommendation) {
    // t19 暂存 `diagnostic.recommendation && <><Text /><Text color="warni...` 生成的渲染片段，后续返回路径直接复用。
    t19 = diagnostic.recommendation && <><Text /><Text color="warning">Recommendation: {diagnostic.recommendation.split("\n")[0]}</Text><Text dimColor={true}>{diagnostic.recommendation.split("\n")[1]}</Text></>;
    // $[32] 缓存 `diagnostic.recommendation`，下次依赖未变时 React 编译产物可直接复用。
    $[32] = diagnostic.recommendation;
    // $[33] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[33] = t19;
  } else {
    // t19 从 React 编译缓存槽 $[33] 取回渲染片段，避免依赖未变时重建 JSX。
    t19 = $[33];
  }
  // t20 暂存 `diagnostic.multipleInstallations.length > 1 && <><Text />...` 的派生结果，便于缓存命中时直接复用。
  let t20;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[34] !== diagnostic.multipleInstallations) {
    // t20 暂存 `diagnostic.multipleInstallations.length > 1 && <><Text />...` 生成的渲染片段，后续返回路径直接复用。
    t20 = diagnostic.multipleInstallations.length > 1 && <><Text /><Text color="warning">Warning: Multiple installations found</Text>{diagnostic.multipleInstallations.map(_temp1)}</>;
    // $[34] 缓存 `diagnostic.multipleInstallations`，下次依赖未变时 React 编译产物可直接复用。
    $[34] = diagnostic.multipleInstallations;
    // $[35] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[35] = t20;
  } else {
    // t20 从 React 编译缓存槽 $[35] 取回渲染片段，避免依赖未变时重建 JSX。
    t20 = $[35];
  }
  // t21 暂存 `diagnostic.warnings.length > 0 && <><Text />{diagnostic.w...` 的派生结果，便于缓存命中时直接复用。
  let t21;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[36] !== diagnostic.warnings) {
    // t21 暂存 `diagnostic.warnings.length > 0 && <><Text />{diagnostic.w...` 生成的渲染片段，后续返回路径直接复用。
    t21 = diagnostic.warnings.length > 0 && <><Text />{diagnostic.warnings.map(_temp10)}</>;
    // $[36] 缓存 `diagnostic.warnings`，下次依赖未变时 React 编译产物可直接复用。
    $[36] = diagnostic.warnings;
    // $[37] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[37] = t21;
  } else {
    // t21 从 React 编译缓存槽 $[37] 取回渲染片段，避免依赖未变时重建 JSX。
    t21 = $[37];
  }
  // t22 暂存 `errorsExcludingMcp.length > 0 && <Box flexDirection="colu...` 的派生结果，便于缓存命中时直接复用。
  let t22;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[38] !== errorsExcludingMcp) {
    // t22 暂存 `errorsExcludingMcp.length > 0 && <Box flexDirection="colu...` 生成的渲染片段，后续返回路径直接复用。
    t22 = errorsExcludingMcp.length > 0 && <Box flexDirection="column" marginTop={1} marginBottom={1}><Text bold={true}>Invalid Settings</Text><ValidationErrorsList errors={errorsExcludingMcp} /></Box>;
    // $[38] 缓存 `errorsExcludingMcp`，下次依赖未变时 React 编译产物可直接复用。
    $[38] = errorsExcludingMcp;
    // $[39] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[39] = t22;
  } else {
    // t22 从 React 编译缓存槽 $[39] 取回渲染片段，避免依赖未变时重建 JSX。
    t22 = $[39];
  }
  // t23 暂存 `<Box flexDirection="column">{t10}{t11}{t12}{t13}{t14}{t15...` 的派生结果，便于缓存命中时直接复用。
  let t23;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[40] !== t11 || $[41] !== t12 || $[42] !== t13 || $[43] !== t14 || $[44] !== t15 || $[45] !== t18 || $[46] !== t19 || $[47] !== t20 || $[48] !== t21 || $[49] !== t22) {
    // t23 暂存 `<Box flexDirection="column">{t10}{t11}{t12}{t13}{t14}{t15...` 生成的渲染片段，后续返回路径直接复用。
    t23 = <Box flexDirection="column">{t10}{t11}{t12}{t13}{t14}{t15}{t18}{t19}{t20}{t21}{t22}</Box>;
    // $[40] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[40] = t11;
    // $[41] 缓存 `t12`，下次依赖未变时 React 编译产物可直接复用。
    $[41] = t12;
    // $[42] 缓存 `t13`，下次依赖未变时 React 编译产物可直接复用。
    $[42] = t13;
    // $[43] 缓存 `t14`，下次依赖未变时 React 编译产物可直接复用。
    $[43] = t14;
    // $[44] 缓存 `t15`，下次依赖未变时 React 编译产物可直接复用。
    $[44] = t15;
    // $[45] 缓存 `t18`，下次依赖未变时 React 编译产物可直接复用。
    $[45] = t18;
    // $[46] 缓存 `t19`，下次依赖未变时 React 编译产物可直接复用。
    $[46] = t19;
    // $[47] 缓存 `t20`，下次依赖未变时 React 编译产物可直接复用。
    $[47] = t20;
    // $[48] 缓存 `t21`，下次依赖未变时 React 编译产物可直接复用。
    $[48] = t21;
    // $[49] 缓存 `t22`，下次依赖未变时 React 编译产物可直接复用。
    $[49] = t22;
    // $[50] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[50] = t23;
  } else {
    // t23 从 React 编译缓存槽 $[50] 取回渲染片段，避免依赖未变时重建 JSX。
    t23 = $[50];
  }
  // t24 暂存 `<Text bold={true}>Updates</Text>` 的派生结果，便于缓存命中时直接复用。
  let t24;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[51] === Symbol.for("react.memo_cache_sentinel")) {
    // t24 暂存 `<Text bold={true}>Updates</Text>` 生成的渲染片段，后续返回路径直接复用。
    t24 = <Text bold={true}>Updates</Text>;
    // $[51] 缓存 `t24`，下次依赖未变时 React 编译产物可直接复用。
    $[51] = t24;
  } else {
    // t24 从 React 编译缓存槽 $[51] 取回渲染片段，避免依赖未变时重建 JSX。
    t24 = $[51];
  }
  // 临时值 t25 命名 `diagnostic.packageManager ? "Managed by package manager" ...`，让后续代码直接表达这个值的用途。
  const t25 = diagnostic.packageManager ? "Managed by package manager" : diagnostic.autoUpdates;
  // t26 暂存 `<Text>└ Auto-updates:{" "}{t25}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t26;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[52] !== t25) {
    // t26 暂存 `<Text>└ Auto-updates:{" "}{t25}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t26 = <Text>└ Auto-updates:{" "}{t25}</Text>;
    // $[52] 缓存 `t25`，下次依赖未变时 React 编译产物可直接复用。
    $[52] = t25;
    // $[53] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[53] = t26;
  } else {
    // t26 从 React 编译缓存槽 $[53] 取回渲染片段，避免依赖未变时重建 JSX。
    t26 = $[53];
  }
  // t27 暂存 `diagnostic.hasUpdatePermissions !== null && <Text>└ Updat...` 的派生结果，便于缓存命中时直接复用。
  let t27;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[54] !== diagnostic.hasUpdatePermissions) {
    // t27 暂存 `diagnostic.hasUpdatePermissions !== null && <Text>└ Updat...` 生成的渲染片段，后续返回路径直接复用。
    t27 = diagnostic.hasUpdatePermissions !== null && <Text>└ Update permissions:{" "}{diagnostic.hasUpdatePermissions ? "Yes" : "No (requires sudo)"}</Text>;
    // $[54] 缓存 `diagnostic.hasUpdatePermissions`，下次依赖未变时 React 编译产物可直接复用。
    $[54] = diagnostic.hasUpdatePermissions;
    // $[55] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[55] = t27;
  } else {
    // t27 从 React 编译缓存槽 $[55] 取回渲染片段，避免依赖未变时重建 JSX。
    t27 = $[55];
  }
  // t28 暂存 `<Text>└ Auto-update channel: {autoUpdatesChannel}</Text>` 的派生结果，便于缓存命中时直接复用。
  let t28;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[56] === Symbol.for("react.memo_cache_sentinel")) {
    // t28 暂存 `<Text>└ Auto-update channel: {autoUpdatesChannel}</Text>` 生成的渲染片段，后续返回路径直接复用。
    t28 = <Text>└ Auto-update channel: {autoUpdatesChannel}</Text>;
    // $[56] 缓存 `t28`，下次依赖未变时 React 编译产物可直接复用。
    $[56] = t28;
  } else {
    // t28 从 React 编译缓存槽 $[56] 取回渲染片段，避免依赖未变时重建 JSX。
    t28 = $[56];
  }
  // t29 暂存 `<Suspense fallback={null}><DistTagsDisplay promise={distT...` 的派生结果，便于缓存命中时直接复用。
  let t29;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[57] === Symbol.for("react.memo_cache_sentinel")) {
    // t29 暂存 `<Suspense fallback={null}><DistTagsDisplay promise={distT...` 生成的渲染片段，后续返回路径直接复用。
    t29 = <Suspense fallback={null}><DistTagsDisplay promise={distTagsPromise} /></Suspense>;
    // $[57] 缓存 `t29`，下次依赖未变时 React 编译产物可直接复用。
    $[57] = t29;
  } else {
    // t29 从 React 编译缓存槽 $[57] 取回渲染片段，避免依赖未变时重建 JSX。
    t29 = $[57];
  }
  // t30 暂存 `<Box flexDirection="column">{t24}{t26}{t27}{t28}{t29}</Bo...` 的派生结果，便于缓存命中时直接复用。
  let t30;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[58] !== t26 || $[59] !== t27) {
    // t30 暂存 `<Box flexDirection="column">{t24}{t26}{t27}{t28}{t29}</Bo...` 生成的渲染片段，后续返回路径直接复用。
    t30 = <Box flexDirection="column">{t24}{t26}{t27}{t28}{t29}</Box>;
    // $[58] 缓存 `t26`，下次依赖未变时 React 编译产物可直接复用。
    $[58] = t26;
    // $[59] 缓存 `t27`，下次依赖未变时 React 编译产物可直接复用。
    $[59] = t27;
    // $[60] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[60] = t30;
  } else {
    // t30 从 React 编译缓存槽 $[60] 取回渲染片段，避免依赖未变时重建 JSX。
    t30 = $[60];
  }
  // t31 暂存 `<SandboxDoctorSection />` 的派生结果，便于缓存命中时直接复用。
  let t31;
  // t32 暂存 `<McpParsingWarnings />` 的派生结果，便于缓存命中时直接复用。
  let t32;
  // t33 暂存 `<KeybindingWarnings />` 的派生结果，便于缓存命中时直接复用。
  let t33;
  // t34 暂存 `envValidationErrors.length > 0 && <Box flexDirection="col...` 的派生结果，便于缓存命中时直接复用。
  let t34;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[61] === Symbol.for("react.memo_cache_sentinel")) {
    // t31 暂存 `<SandboxDoctorSection />` 生成的渲染片段，后续返回路径直接复用。
    t31 = <SandboxDoctorSection />;
    // t32 暂存 `<McpParsingWarnings />` 生成的渲染片段，后续返回路径直接复用。
    t32 = <McpParsingWarnings />;
    // t33 暂存 `<KeybindingWarnings />` 生成的渲染片段，后续返回路径直接复用。
    t33 = <KeybindingWarnings />;
    // t34 暂存 `envValidationErrors.length > 0 && <Box flexDirection="col...` 生成的渲染片段，后续返回路径直接复用。
    t34 = envValidationErrors.length > 0 && <Box flexDirection="column"><Text bold={true}>Environment Variables</Text>{envValidationErrors.map(_temp11)}</Box>;
    // $[61] 缓存 `t31`，下次依赖未变时 React 编译产物可直接复用。
    $[61] = t31;
    // $[62] 缓存 `t32`，下次依赖未变时 React 编译产物可直接复用。
    $[62] = t32;
    // $[63] 缓存 `t33`，下次依赖未变时 React 编译产物可直接复用。
    $[63] = t33;
    // $[64] 缓存 `t34`，下次依赖未变时 React 编译产物可直接复用。
    $[64] = t34;
  } else {
    // t31 从 React 编译缓存槽 $[61] 取回渲染片段，避免依赖未变时重建 JSX。
    t31 = $[61];
    // t32 从 React 编译缓存槽 $[62] 取回渲染片段，避免依赖未变时重建 JSX。
    t32 = $[62];
    // t33 从 React 编译缓存槽 $[63] 取回渲染片段，避免依赖未变时重建 JSX。
    t33 = $[63];
    // t34 从 React 编译缓存槽 $[64] 取回渲染片段，避免依赖未变时重建 JSX。
    t34 = $[64];
  }
  // t35 暂存 `versionLockInfo?.enabled && <Box flexDirection="column"><...` 的派生结果，便于缓存命中时直接复用。
  let t35;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[65] !== versionLockInfo) {
    // t35 暂存 `versionLockInfo?.enabled && <Box flexDirection="column"><...` 生成的渲染片段，后续返回路径直接复用。
    t35 = versionLockInfo?.enabled && <Box flexDirection="column"><Text bold={true}>Version Locks</Text>{versionLockInfo.staleLocksCleaned > 0 && <Text dimColor={true}>└ Cleaned {versionLockInfo.staleLocksCleaned} stale lock(s)</Text>}{versionLockInfo.locks.length === 0 ? <Text dimColor={true}>└ No active version locks</Text> : versionLockInfo.locks.map(_temp12)}</Box>;
    // $[65] 缓存 `versionLockInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[65] = versionLockInfo;
    // $[66] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[66] = t35;
  } else {
    // t35 从 React 编译缓存槽 $[66] 取回渲染片段，避免依赖未变时重建 JSX。
    t35 = $[66];
  }
  // t36 暂存 `agentInfo?.failedFiles && agentInfo.failedFiles.length > ...` 的派生结果，便于缓存命中时直接复用。
  let t36;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[67] !== agentInfo) {
    // t36 暂存 `agentInfo?.failedFiles && agentInfo.failedFiles.length > ...` 生成的渲染片段，后续返回路径直接复用。
    t36 = agentInfo?.failedFiles && agentInfo.failedFiles.length > 0 && <Box flexDirection="column"><Text bold={true} color="error">Agent Parse Errors</Text><Text color="error">└ Failed to parse {agentInfo.failedFiles.length} agent file(s):</Text>{agentInfo.failedFiles.map(_temp13)}</Box>;
    // $[67] 缓存 `agentInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[67] = agentInfo;
    // $[68] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[68] = t36;
  } else {
    // t36 从 React 编译缓存槽 $[68] 取回渲染片段，避免依赖未变时重建 JSX。
    t36 = $[68];
  }
  // t37 暂存 `pluginsErrors.length > 0 && <Box flexDirection="column"><...` 的派生结果，便于缓存命中时直接复用。
  let t37;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[69] !== pluginsErrors) {
    // t37 暂存 `pluginsErrors.length > 0 && <Box flexDirection="column"><...` 生成的渲染片段，后续返回路径直接复用。
    t37 = pluginsErrors.length > 0 && <Box flexDirection="column"><Text bold={true} color="error">Plugin Errors</Text><Text color="error">└ {pluginsErrors.length} plugin error(s) detected:</Text>{pluginsErrors.map(_temp14)}</Box>;
    // $[69] 缓存 `pluginsErrors`，下次依赖未变时 React 编译产物可直接复用。
    $[69] = pluginsErrors;
    // $[70] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[70] = t37;
  } else {
    // t37 从 React 编译缓存槽 $[70] 取回渲染片段，避免依赖未变时重建 JSX。
    t37 = $[70];
  }
  // t38 暂存 `contextWarnings?.unreachableRulesWarning && <Box flexDire...` 的派生结果，便于缓存命中时直接复用。
  let t38;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[71] !== contextWarnings) {
    // t38 暂存 `contextWarnings?.unreachableRulesWarning && <Box flexDire...` 生成的渲染片段，后续返回路径直接复用。
    t38 = contextWarnings?.unreachableRulesWarning && <Box flexDirection="column"><Text bold={true} color="warning">Unreachable Permission Rules</Text><Text>└{" "}<Text color="warning">{figures.warning}{" "}{contextWarnings.unreachableRulesWarning.message}</Text></Text>{contextWarnings.unreachableRulesWarning.details.map(_temp15)}</Box>;
    // $[71] 缓存 `contextWarnings`，下次依赖未变时 React 编译产物可直接复用。
    $[71] = contextWarnings;
    // $[72] 缓存 `t38`，下次依赖未变时 React 编译产物可直接复用。
    $[72] = t38;
  } else {
    // t38 从 React 编译缓存槽 $[72] 取回渲染片段，避免依赖未变时重建 JSX。
    t38 = $[72];
  }
  // t39 暂存 `contextWarnings && (contextWarnings.claudeMdWarning || co...` 的派生结果，便于缓存命中时直接复用。
  let t39;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[73] !== contextWarnings) {
    // t39 暂存 `contextWarnings && (contextWarnings.claudeMdWarning || co...` 生成的渲染片段，后续返回路径直接复用。
    t39 = contextWarnings && (contextWarnings.claudeMdWarning || contextWarnings.agentWarning || contextWarnings.mcpWarning) && <Box flexDirection="column"><Text bold={true}>Context Usage Warnings</Text>{contextWarnings.claudeMdWarning && <><Text>└{" "}<Text color="warning">{figures.warning} {contextWarnings.claudeMdWarning.message}</Text></Text><Text>{"  "}└ Files:</Text>{contextWarnings.claudeMdWarning.details.map(_temp16)}</>}{contextWarnings.agentWarning && <><Text>└{" "}<Text color="warning">{figures.warning} {contextWarnings.agentWarning.message}</Text></Text><Text>{"  "}└ Top contributors:</Text>{contextWarnings.agentWarning.details.map(_temp17)}</>}{contextWarnings.mcpWarning && <><Text>└{" "}<Text color="warning">{figures.warning} {contextWarnings.mcpWarning.message}</Text></Text><Text>{"  "}└ MCP servers:</Text>{contextWarnings.mcpWarning.details.map(_temp18)}</>}</Box>;
    // $[73] 缓存 `contextWarnings`，下次依赖未变时 React 编译产物可直接复用。
    $[73] = contextWarnings;
    // $[74] 缓存 `t39`，下次依赖未变时 React 编译产物可直接复用。
    $[74] = t39;
  } else {
    // t39 从 React 编译缓存槽 $[74] 取回渲染片段，避免依赖未变时重建 JSX。
    t39 = $[74];
  }
  // t40 暂存 `<Box><PressEnterToContinue /></Box>` 的派生结果，便于缓存命中时直接复用。
  let t40;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[75] === Symbol.for("react.memo_cache_sentinel")) {
    // t40 暂存 `<Box><PressEnterToContinue /></Box>` 生成的渲染片段，后续返回路径直接复用。
    t40 = <Box><PressEnterToContinue /></Box>;
    // $[75] 缓存 `t40`，下次依赖未变时 React 编译产物可直接复用。
    $[75] = t40;
  } else {
    // t40 从 React 编译缓存槽 $[75] 取回渲染片段，避免依赖未变时重建 JSX。
    t40 = $[75];
  }
  // t41 暂存 `<Pane>{t23}{t30}{t31}{t32}{t33}{t34}{t35}{t36}{t37}{t38}{...` 的派生结果，便于缓存命中时直接复用。
  let t41;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[76] !== t23 || $[77] !== t30 || $[78] !== t35 || $[79] !== t36 || $[80] !== t37 || $[81] !== t38 || $[82] !== t39) {
    // t41 暂存 `<Pane>{t23}{t30}{t31}{t32}{t33}{t34}{t35}{t36}{t37}{t38}{...` 生成的渲染片段，后续返回路径直接复用。
    t41 = <Pane>{t23}{t30}{t31}{t32}{t33}{t34}{t35}{t36}{t37}{t38}{t39}{t40}</Pane>;
    // $[76] 缓存 `t23`，下次依赖未变时 React 编译产物可直接复用。
    $[76] = t23;
    // $[77] 缓存 `t30`，下次依赖未变时 React 编译产物可直接复用。
    $[77] = t30;
    // $[78] 缓存 `t35`，下次依赖未变时 React 编译产物可直接复用。
    $[78] = t35;
    // $[79] 缓存 `t36`，下次依赖未变时 React 编译产物可直接复用。
    $[79] = t36;
    // $[80] 缓存 `t37`，下次依赖未变时 React 编译产物可直接复用。
    $[80] = t37;
    // $[81] 缓存 `t38`，下次依赖未变时 React 编译产物可直接复用。
    $[81] = t38;
    // $[82] 缓存 `t39`，下次依赖未变时 React 编译产物可直接复用。
    $[82] = t39;
    // $[83] 缓存 `t41`，下次依赖未变时 React 编译产物可直接复用。
    $[83] = t41;
  } else {
    // t41 从 React 编译缓存槽 $[83] 取回渲染片段，避免依赖未变时重建 JSX。
    t41 = $[83];
  }
  // 返回 `t41`，作为终端渲染这次计算的结果。
  return t41;
}
// _temp18 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp18(detail_2, i_8) {
  // 返回 `<Text key={i_8} dimColor={true}>{" "}└ {detail_2}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_8} dimColor={true}>{"    "}└ {detail_2}</Text>;
}
// _temp17 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp17(detail_1, i_7) {
  // 返回 `<Text key={i_7} dimColor={true}>{" "}└ {detail_1}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_7} dimColor={true}>{"    "}└ {detail_1}</Text>;
}
// _temp16 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp16(detail_0, i_6) {
  // 返回 `<Text key={i_6} dimColor={true}>{" "}└ {detail_0}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_6} dimColor={true}>{"    "}└ {detail_0}</Text>;
}
// _temp15 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp15(detail, i_5) {
  // 返回 `<Text key={i_5} dimColor={true}>{" "}└ {detail}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_5} dimColor={true}>{"  "}└ {detail}</Text>;
}
// _temp14 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp14(error_0, i_4) {
  // 返回 `<Text key={i_4} dimColor={true}>{" "}└ {error_0.source || "unknown"}{"p...`，作为终端渲染这次计算的结果。
  return <Text key={i_4} dimColor={true}>{"  "}└ {error_0.source || "unknown"}{"plugin" in error_0 && error_0.plugin ? ` [${error_0.plugin}]` : ""}:{" "}{getPluginErrorMessage(error_0)}</Text>;
}
// _temp13 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp13(file, i_3) {
  // 返回 `<Text key={i_3} dimColor={true}>{" "}└ {file.path}: {file.error}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i_3} dimColor={true}>{"  "}└ {file.path}: {file.error}</Text>;
}
// _temp12 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp12(lock, i_2) {
  // 返回 `<Text key={i_2}>└ {lock.version}: PID {lock.pid}{" "}{lock.isProcessRun...`，作为终端渲染这次计算的结果。
  return <Text key={i_2}>└ {lock.version}: PID {lock.pid}{" "}{lock.isProcessRunning ? <Text>(running)</Text> : <Text color="warning">(stale)</Text>}</Text>;
}
// _temp11 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp11(validation, i_1) {
  // 返回 `<Text key={i_1}>└ {validation.name}:{" "}<Text color={validation.status...`，作为终端渲染这次计算的结果。
  return <Text key={i_1}>└ {validation.name}:{" "}<Text color={validation.status === "capped" ? "warning" : "error"}>{validation.message}</Text></Text>;
}
// _temp10 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp10(warning, i_0) {
  // 返回 `<Box key={i_0} flexDirection="column"><Text color="warning">Warning: {w...`，作为终端渲染这次计算的结果。
  return <Box key={i_0} flexDirection="column"><Text color="warning">Warning: {warning.issue}</Text><Text>Fix: {warning.fix}</Text></Box>;
}
// _temp1 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp1(install, i) {
  // 返回 `<Text key={i}>└ {install.type} at {install.path}</Text>`，作为终端渲染这次计算的结果。
  return <Text key={i}>└ {install.type} at {install.path}</Text>;
}
// _temp0 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp0(a) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    agentType: a.agentType,
    source: a.source
  };
}
// _temp9 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp9(v_0) {
  // 返回 `v_0.status !== "valid"`，作为终端渲染这次计算的结果。
  return v_0.status !== "valid";
}
// _temp8 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp8(v) {
  // 取值读取 `process.env[v.name]` 对应条目，后续围绕该成员继续处理。
  const value = process.env[v.name];
  // 结果读取`validateBoundedIntEnvVar`，供终端渲染后续处理使用。
  const result = validateBoundedIntEnvVar(v.name, value, v.default, v.upperLimit);
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    name: v.name,
    ...result
  };
}
// _temp7 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp7(error) {
  // 返回 `error.mcpErrorMetadata === undefined`，作为终端渲染这次计算的结果。
  return error.mcpErrorMetadata === undefined;
}
// _temp6 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp6(diag) {
  // fetchDistTags 集合标记终端渲染终端页面 Doctor是否启用对应路径。
  const fetchDistTags = diag.installationType === "native" ? getGcsDistTags : getNpmDistTags;
  // 返回 `fetchDistTags().catch(_temp5)`，作为终端渲染这次计算的结果。
  return fetchDistTags().catch(_temp5);
}
// _temp5 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp5() {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    latest: null,
    stable: null
  };
}
// _temp4 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(s_2) {
  // 返回 `s_2.plugins.errors`，作为终端渲染这次计算的结果。
  return s_2.plugins.errors;
}
// _temp3 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(s_1) {
  // 返回 `s_1.toolPermissionContext`，作为终端渲染这次计算的结果。
  return s_1.toolPermissionContext;
}
// _temp2 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(s_0) {
  // 返回 `s_0.mcp.tools`，作为终端渲染这次计算的结果。
  return s_0.mcp.tools;
}
// _temp 封装终端页面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.agentDefinitions`，作为终端渲染这次计算的结果。
  return s.agentDefinitions;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmaWd1cmVzIiwiam9pbiIsIlJlYWN0IiwiU3VzcGVuc2UiLCJ1c2UiLCJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VTdGF0ZSIsIktleWJpbmRpbmdXYXJuaW5ncyIsIk1jcFBhcnNpbmdXYXJuaW5ncyIsImdldE1vZGVsTWF4T3V0cHV0VG9rZW5zIiwiZ2V0Q2xhdWRlQ29uZmlnSG9tZURpciIsIlNldHRpbmdTb3VyY2UiLCJnZXRPcmlnaW5hbEN3ZCIsIkNvbW1hbmRSZXN1bHREaXNwbGF5IiwiUGFuZSIsIlByZXNzRW50ZXJUb0NvbnRpbnVlIiwiU2FuZGJveERvY3RvclNlY3Rpb24iLCJWYWxpZGF0aW9uRXJyb3JzTGlzdCIsInVzZVNldHRpbmdzRXJyb3JzIiwidXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzIiwiQm94IiwiVGV4dCIsInVzZUtleWJpbmRpbmdzIiwidXNlQXBwU3RhdGUiLCJnZXRQbHVnaW5FcnJvck1lc3NhZ2UiLCJnZXRHY3NEaXN0VGFncyIsImdldE5wbURpc3RUYWdzIiwiTnBtRGlzdFRhZ3MiLCJDb250ZXh0V2FybmluZ3MiLCJjaGVja0NvbnRleHRXYXJuaW5ncyIsIkRpYWdub3N0aWNJbmZvIiwiZ2V0RG9jdG9yRGlhZ25vc3RpYyIsInZhbGlkYXRlQm91bmRlZEludEVudlZhciIsInBhdGhFeGlzdHMiLCJjbGVhbnVwU3RhbGVMb2NrcyIsImdldEFsbExvY2tJbmZvIiwiaXNQaWRCYXNlZExvY2tpbmdFbmFibGVkIiwiTG9ja0luZm8iLCJnZXRJbml0aWFsU2V0dGluZ3MiLCJCQVNIX01BWF9PVVRQVVRfREVGQVVMVCIsIkJBU0hfTUFYX09VVFBVVF9VUFBFUl9MSU1JVCIsIlRBU0tfTUFYX09VVFBVVF9ERUZBVUxUIiwiVEFTS19NQVhfT1VUUFVUX1VQUEVSX0xJTUlUIiwiZ2V0WERHU3RhdGVIb21lIiwiUHJvcHMiLCJvbkRvbmUiLCJyZXN1bHQiLCJvcHRpb25zIiwiZGlzcGxheSIsIkFnZW50SW5mbyIsImFjdGl2ZUFnZW50cyIsIkFycmF5IiwiYWdlbnRUeXBlIiwic291cmNlIiwidXNlckFnZW50c0RpciIsInByb2plY3RBZ2VudHNEaXIiLCJ1c2VyRGlyRXhpc3RzIiwicHJvamVjdERpckV4aXN0cyIsImZhaWxlZEZpbGVzIiwicGF0aCIsImVycm9yIiwiVmVyc2lvbkxvY2tJbmZvIiwiZW5hYmxlZCIsImxvY2tzIiwibG9ja3NEaXIiLCJzdGFsZUxvY2tzQ2xlYW5lZCIsIkRpc3RUYWdzRGlzcGxheSIsInQwIiwiJCIsIl9jIiwicHJvbWlzZSIsImRpc3RUYWdzIiwibGF0ZXN0IiwidDEiLCJTeW1ib2wiLCJmb3IiLCJzdGFibGUiLCJ0MiIsInQzIiwiRG9jdG9yIiwiYWdlbnREZWZpbml0aW9ucyIsIl90ZW1wIiwibWNwVG9vbHMiLCJfdGVtcDIiLCJ0b29sUGVybWlzc2lvbkNvbnRleHQiLCJfdGVtcDMiLCJwbHVnaW5zRXJyb3JzIiwiX3RlbXA0IiwidG9vbHMiLCJkaWFnbm9zdGljIiwic2V0RGlhZ25vc3RpYyIsImFnZW50SW5mbyIsInNldEFnZW50SW5mbyIsImNvbnRleHRXYXJuaW5ncyIsInNldENvbnRleHRXYXJuaW5ncyIsInZlcnNpb25Mb2NrSW5mbyIsInNldFZlcnNpb25Mb2NrSW5mbyIsInZhbGlkYXRpb25FcnJvcnMiLCJ0aGVuIiwiX3RlbXA2IiwiZGlzdFRhZ3NQcm9taXNlIiwiYXV0b1VwZGF0ZXNDaGFubmVsIiwiZmlsdGVyIiwiX3RlbXA3IiwiZXJyb3JzRXhjbHVkaW5nTWNwIiwidDQiLCJlbnZWYXJzIiwibmFtZSIsImRlZmF1bHQiLCJ1cHBlckxpbWl0IiwibWFwIiwiX3RlbXA4IiwiX3RlbXA5IiwiZW52VmFsaWRhdGlvbkVycm9ycyIsInQ1IiwidDYiLCJhbGxBZ2VudHMiLCJQcm9taXNlIiwiYWxsIiwiYWdlbnRJbmZvRGF0YSIsIl90ZW1wMCIsIndhcm5pbmdzIiwidDciLCJoYW5kbGVEaXNtaXNzIiwidDgiLCJ0OSIsImNvbnRleHQiLCJ0MTAiLCJ0MTEiLCJpbnN0YWxsYXRpb25UeXBlIiwidmVyc2lvbiIsInQxMiIsInBhY2thZ2VNYW5hZ2VyIiwidDEzIiwiaW5zdGFsbGF0aW9uUGF0aCIsInQxNCIsImludm9rZWRCaW5hcnkiLCJ0MTUiLCJjb25maWdJbnN0YWxsTWV0aG9kIiwidDE2IiwicmlwZ3JlcFN0YXR1cyIsIndvcmtpbmciLCJ0MTciLCJtb2RlIiwic3lzdGVtUGF0aCIsInQxOCIsInQxOSIsInJlY29tbWVuZGF0aW9uIiwic3BsaXQiLCJ0MjAiLCJtdWx0aXBsZUluc3RhbGxhdGlvbnMiLCJsZW5ndGgiLCJfdGVtcDEiLCJ0MjEiLCJfdGVtcDEwIiwidDIyIiwidDIzIiwidDI0IiwidDI1IiwiYXV0b1VwZGF0ZXMiLCJ0MjYiLCJ0MjciLCJoYXNVcGRhdGVQZXJtaXNzaW9ucyIsInQyOCIsInQyOSIsInQzMCIsInQzMSIsInQzMiIsInQzMyIsInQzNCIsIl90ZW1wMTEiLCJ0MzUiLCJfdGVtcDEyIiwidDM2IiwiX3RlbXAxMyIsInQzNyIsIl90ZW1wMTQiLCJ0MzgiLCJ1bnJlYWNoYWJsZVJ1bGVzV2FybmluZyIsIndhcm5pbmciLCJtZXNzYWdlIiwiZGV0YWlscyIsIl90ZW1wMTUiLCJ0MzkiLCJjbGF1ZGVNZFdhcm5pbmciLCJhZ2VudFdhcm5pbmciLCJtY3BXYXJuaW5nIiwiX3RlbXAxNiIsIl90ZW1wMTciLCJfdGVtcDE4IiwidDQwIiwidDQxIiwiZGV0YWlsXzIiLCJpXzgiLCJpIiwiZGV0YWlsIiwiZGV0YWlsXzEiLCJpXzciLCJkZXRhaWxfMCIsImlfNiIsImlfNSIsImVycm9yXzAiLCJpXzQiLCJwbHVnaW4iLCJmaWxlIiwiaV8zIiwibG9jayIsImlfMiIsInBpZCIsImlzUHJvY2Vzc1J1bm5pbmciLCJ2YWxpZGF0aW9uIiwiaV8xIiwic3RhdHVzIiwiaV8wIiwiaXNzdWUiLCJmaXgiLCJpbnN0YWxsIiwidHlwZSIsImEiLCJ2XzAiLCJ2IiwidmFsdWUiLCJwcm9jZXNzIiwiZW52IiwibWNwRXJyb3JNZXRhZGF0YSIsInVuZGVmaW5lZCIsImRpYWciLCJmZXRjaERpc3RUYWdzIiwiY2F0Y2giLCJfdGVtcDUiLCJzXzIiLCJzIiwicGx1Z2lucyIsImVycm9ycyIsInNfMSIsInNfMCIsIm1jcCJdLCJzb3VyY2VzIjpbIkRvY3Rvci50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZpZ3VyZXMgZnJvbSAnZmlndXJlcydcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJ1xuaW1wb3J0IFJlYWN0LCB7XG4gIFN1c3BlbnNlLFxuICB1c2UsXG4gIHVzZUNhbGxiYWNrLFxuICB1c2VFZmZlY3QsXG4gIHVzZU1lbW8sXG4gIHVzZVN0YXRlLFxufSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEtleWJpbmRpbmdXYXJuaW5ncyB9IGZyb20gJ3NyYy9jb21wb25lbnRzL0tleWJpbmRpbmdXYXJuaW5ncy5qcydcbmltcG9ydCB7IE1jcFBhcnNpbmdXYXJuaW5ncyB9IGZyb20gJ3NyYy9jb21wb25lbnRzL21jcC9NY3BQYXJzaW5nV2FybmluZ3MuanMnXG5pbXBvcnQgeyBnZXRNb2RlbE1heE91dHB1dFRva2VucyB9IGZyb20gJ3NyYy91dGlscy9jb250ZXh0LmpzJ1xuaW1wb3J0IHsgZ2V0Q2xhdWRlQ29uZmlnSG9tZURpciB9IGZyb20gJ3NyYy91dGlscy9lbnZVdGlscy5qcydcbmltcG9ydCB0eXBlIHsgU2V0dGluZ1NvdXJjZSB9IGZyb20gJ3NyYy91dGlscy9zZXR0aW5ncy9jb25zdGFudHMuanMnXG5pbXBvcnQgeyBnZXRPcmlnaW5hbEN3ZCB9IGZyb20gJy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB0eXBlIHsgQ29tbWFuZFJlc3VsdERpc3BsYXkgfSBmcm9tICcuLi9jb21tYW5kcy5qcydcbmltcG9ydCB7IFBhbmUgfSBmcm9tICcuLi9jb21wb25lbnRzL2Rlc2lnbi1zeXN0ZW0vUGFuZS5qcydcbmltcG9ydCB7IFByZXNzRW50ZXJUb0NvbnRpbnVlIH0gZnJvbSAnLi4vY29tcG9uZW50cy9QcmVzc0VudGVyVG9Db250aW51ZS5qcydcbmltcG9ydCB7IFNhbmRib3hEb2N0b3JTZWN0aW9uIH0gZnJvbSAnLi4vY29tcG9uZW50cy9zYW5kYm94L1NhbmRib3hEb2N0b3JTZWN0aW9uLmpzJ1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yc0xpc3QgfSBmcm9tICcuLi9jb21wb25lbnRzL1ZhbGlkYXRpb25FcnJvcnNMaXN0LmpzJ1xuaW1wb3J0IHsgdXNlU2V0dGluZ3NFcnJvcnMgfSBmcm9tICcuLi9ob29rcy9ub3RpZnMvdXNlU2V0dGluZ3NFcnJvcnMuanMnXG5pbXBvcnQgeyB1c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MgfSBmcm9tICcuLi9ob29rcy91c2VFeGl0T25DdHJsQ0RXaXRoS2V5YmluZGluZ3MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5ncyB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZUtleWJpbmRpbmcuanMnXG5pbXBvcnQgeyB1c2VBcHBTdGF0ZSB9IGZyb20gJy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHsgZ2V0UGx1Z2luRXJyb3JNZXNzYWdlIH0gZnJvbSAnLi4vdHlwZXMvcGx1Z2luLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0R2NzRGlzdFRhZ3MsXG4gIGdldE5wbURpc3RUYWdzLFxuICB0eXBlIE5wbURpc3RUYWdzLFxufSBmcm9tICcuLi91dGlscy9hdXRvVXBkYXRlci5qcydcbmltcG9ydCB7XG4gIHR5cGUgQ29udGV4dFdhcm5pbmdzLFxuICBjaGVja0NvbnRleHRXYXJuaW5ncyxcbn0gZnJvbSAnLi4vdXRpbHMvZG9jdG9yQ29udGV4dFdhcm5pbmdzLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBEaWFnbm9zdGljSW5mbyxcbiAgZ2V0RG9jdG9yRGlhZ25vc3RpYyxcbn0gZnJvbSAnLi4vdXRpbHMvZG9jdG9yRGlhZ25vc3RpYy5qcydcbmltcG9ydCB7IHZhbGlkYXRlQm91bmRlZEludEVudlZhciB9IGZyb20gJy4uL3V0aWxzL2VudlZhbGlkYXRpb24uanMnXG5pbXBvcnQgeyBwYXRoRXhpc3RzIH0gZnJvbSAnLi4vdXRpbHMvZmlsZS5qcydcbmltcG9ydCB7XG4gIGNsZWFudXBTdGFsZUxvY2tzLFxuICBnZXRBbGxMb2NrSW5mbyxcbiAgaXNQaWRCYXNlZExvY2tpbmdFbmFibGVkLFxuICB0eXBlIExvY2tJbmZvLFxufSBmcm9tICcuLi91dGlscy9uYXRpdmVJbnN0YWxsZXIvcGlkTG9jay5qcydcbmltcG9ydCB7IGdldEluaXRpYWxTZXR0aW5ncyB9IGZyb20gJy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHtcbiAgQkFTSF9NQVhfT1VUUFVUX0RFRkFVTFQsXG4gIEJBU0hfTUFYX09VVFBVVF9VUFBFUl9MSU1JVCxcbn0gZnJvbSAnLi4vdXRpbHMvc2hlbGwvb3V0cHV0TGltaXRzLmpzJ1xuaW1wb3J0IHtcbiAgVEFTS19NQVhfT1VUUFVUX0RFRkFVTFQsXG4gIFRBU0tfTUFYX09VVFBVVF9VUFBFUl9MSU1JVCxcbn0gZnJvbSAnLi4vdXRpbHMvdGFzay9vdXRwdXRGb3JtYXR0aW5nLmpzJ1xuaW1wb3J0IHsgZ2V0WERHU3RhdGVIb21lIH0gZnJvbSAnLi4vdXRpbHMveGRnLmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkRvbmU6IChcbiAgICByZXN1bHQ/OiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHsgZGlzcGxheT86IENvbW1hbmRSZXN1bHREaXNwbGF5IH0sXG4gICkgPT4gdm9pZFxufVxuXG50eXBlIEFnZW50SW5mbyA9IHtcbiAgYWN0aXZlQWdlbnRzOiBBcnJheTx7XG4gICAgYWdlbnRUeXBlOiBzdHJpbmdcbiAgICBzb3VyY2U6IFNldHRpbmdTb3VyY2UgfCAnYnVpbHQtaW4nIHwgJ3BsdWdpbidcbiAgfT5cbiAgdXNlckFnZW50c0Rpcjogc3RyaW5nXG4gIHByb2plY3RBZ2VudHNEaXI6IHN0cmluZ1xuICB1c2VyRGlyRXhpc3RzOiBib29sZWFuXG4gIHByb2plY3REaXJFeGlzdHM6IGJvb2xlYW5cbiAgZmFpbGVkRmlsZXM/OiBBcnJheTx7IHBhdGg6IHN0cmluZzsgZXJyb3I6IHN0cmluZyB9PlxufVxuXG50eXBlIFZlcnNpb25Mb2NrSW5mbyA9IHtcbiAgZW5hYmxlZDogYm9vbGVhblxuICBsb2NrczogTG9ja0luZm9bXVxuICBsb2Nrc0Rpcjogc3RyaW5nXG4gIHN0YWxlTG9ja3NDbGVhbmVkOiBudW1iZXJcbn1cblxuZnVuY3Rpb24gRGlzdFRhZ3NEaXNwbGF5KHtcbiAgcHJvbWlzZSxcbn06IHtcbiAgcHJvbWlzZTogUHJvbWlzZTxOcG1EaXN0VGFncz5cbn0pOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBkaXN0VGFncyA9IHVzZShwcm9taXNlKVxuICBpZiAoIWRpc3RUYWdzLmxhdGVzdCkge1xuICAgIHJldHVybiA8VGV4dCBkaW1Db2xvcj7ilJQgRmFpbGVkIHRvIGZldGNoIHZlcnNpb25zPC9UZXh0PlxuICB9XG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIHtkaXN0VGFncy5zdGFibGUgJiYgPFRleHQ+4pSUIFN0YWJsZSB2ZXJzaW9uOiB7ZGlzdFRhZ3Muc3RhYmxlfTwvVGV4dD59XG4gICAgICA8VGV4dD7ilJQgTGF0ZXN0IHZlcnNpb246IHtkaXN0VGFncy5sYXRlc3R9PC9UZXh0PlxuICAgIDwvPlxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBEb2N0b3IoeyBvbkRvbmUgfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBhZ2VudERlZmluaXRpb25zID0gdXNlQXBwU3RhdGUocyA9PiBzLmFnZW50RGVmaW5pdGlvbnMpXG4gIGNvbnN0IG1jcFRvb2xzID0gdXNlQXBwU3RhdGUocyA9PiBzLm1jcC50b29scylcbiAgY29uc3QgdG9vbFBlcm1pc3Npb25Db250ZXh0ID0gdXNlQXBwU3RhdGUocyA9PiBzLnRvb2xQZXJtaXNzaW9uQ29udGV4dClcbiAgY29uc3QgcGx1Z2luc0Vycm9ycyA9IHVzZUFwcFN0YXRlKHMgPT4gcy5wbHVnaW5zLmVycm9ycylcbiAgdXNlRXhpdE9uQ3RybENEV2l0aEtleWJpbmRpbmdzKClcblxuICBjb25zdCB0b29scyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIHJldHVybiBtY3BUb29scyB8fCBbXVxuICB9LCBbbWNwVG9vbHNdKVxuXG4gIGNvbnN0IFtkaWFnbm9zdGljLCBzZXREaWFnbm9zdGljXSA9IHVzZVN0YXRlPERpYWdub3N0aWNJbmZvIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW2FnZW50SW5mbywgc2V0QWdlbnRJbmZvXSA9IHVzZVN0YXRlPEFnZW50SW5mbyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFtjb250ZXh0V2FybmluZ3MsIHNldENvbnRleHRXYXJuaW5nc10gPVxuICAgIHVzZVN0YXRlPENvbnRleHRXYXJuaW5ncyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IFt2ZXJzaW9uTG9ja0luZm8sIHNldFZlcnNpb25Mb2NrSW5mb10gPVxuICAgIHVzZVN0YXRlPFZlcnNpb25Mb2NrSW5mbyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IHZhbGlkYXRpb25FcnJvcnMgPSB1c2VTZXR0aW5nc0Vycm9ycygpXG5cbiAgLy8gQ3JlYXRlIHByb21pc2Ugb25jZSBmb3IgZGlzdC10YWdzIGZldGNoIChkZXBlbmRzIG9uIGRpYWdub3N0aWMpXG4gIGNvbnN0IGRpc3RUYWdzUHJvbWlzZSA9IHVzZU1lbW8oXG4gICAgKCkgPT5cbiAgICAgIGdldERvY3RvckRpYWdub3N0aWMoKS50aGVuKGRpYWcgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaERpc3RUYWdzID1cbiAgICAgICAgICBkaWFnLmluc3RhbGxhdGlvblR5cGUgPT09ICduYXRpdmUnID8gZ2V0R2NzRGlzdFRhZ3MgOiBnZXROcG1EaXN0VGFnc1xuICAgICAgICByZXR1cm4gZmV0Y2hEaXN0VGFncygpLmNhdGNoKCgpID0+ICh7IGxhdGVzdDogbnVsbCwgc3RhYmxlOiBudWxsIH0pKVxuICAgICAgfSksXG4gICAgW10sXG4gIClcbiAgY29uc3QgYXV0b1VwZGF0ZXNDaGFubmVsID1cbiAgICBnZXRJbml0aWFsU2V0dGluZ3MoKT8uYXV0b1VwZGF0ZXNDaGFubmVsID8/ICdsYXRlc3QnXG5cbiAgY29uc3QgZXJyb3JzRXhjbHVkaW5nTWNwID0gdmFsaWRhdGlvbkVycm9ycy5maWx0ZXIoXG4gICAgZXJyb3IgPT4gZXJyb3IubWNwRXJyb3JNZXRhZGF0YSA9PT0gdW5kZWZpbmVkLFxuICApXG5cbiAgY29uc3QgZW52VmFsaWRhdGlvbkVycm9ycyA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IGVudlZhcnMgPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdCQVNIX01BWF9PVVRQVVRfTEVOR1RIJyxcbiAgICAgICAgZGVmYXVsdDogQkFTSF9NQVhfT1VUUFVUX0RFRkFVTFQsXG4gICAgICAgIHVwcGVyTGltaXQ6IEJBU0hfTUFYX09VVFBVVF9VUFBFUl9MSU1JVCxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdUQVNLX01BWF9PVVRQVVRfTEVOR1RIJyxcbiAgICAgICAgZGVmYXVsdDogVEFTS19NQVhfT1VUUFVUX0RFRkFVTFQsXG4gICAgICAgIHVwcGVyTGltaXQ6IFRBU0tfTUFYX09VVFBVVF9VUFBFUl9MSU1JVCxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdDTEFVREVfQ09ERV9NQVhfT1VUUFVUX1RPS0VOUycsXG4gICAgICAgIC8vIENoZWNrIGZvciB2YWx1ZXMgYWdhaW5zdCB0aGUgbGF0ZXN0IHN1cHBvcnRlZCBtb2RlbFxuICAgICAgICAuLi5nZXRNb2RlbE1heE91dHB1dFRva2VucygnY2xhdWRlLW9wdXMtNC02JyksXG4gICAgICB9LFxuICAgIF1cbiAgICByZXR1cm4gZW52VmFyc1xuICAgICAgLm1hcCh2ID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9jZXNzLmVudlt2Lm5hbWVdXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlQm91bmRlZEludEVudlZhcihcbiAgICAgICAgICB2Lm5hbWUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgdi5kZWZhdWx0LFxuICAgICAgICAgIHYudXBwZXJMaW1pdCxcbiAgICAgICAgKVxuICAgICAgICByZXR1cm4geyBuYW1lOiB2Lm5hbWUsIC4uLnJlc3VsdCB9XG4gICAgICB9KVxuICAgICAgLmZpbHRlcih2ID0+IHYuc3RhdHVzICE9PSAndmFsaWQnKVxuICB9LCBbXSlcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgZ2V0RG9jdG9yRGlhZ25vc3RpYygpLnRoZW4oc2V0RGlhZ25vc3RpYylcblxuICAgIHZvaWQgKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVzZXJBZ2VudHNEaXIgPSBqb2luKGdldENsYXVkZUNvbmZpZ0hvbWVEaXIoKSwgJ2FnZW50cycpXG4gICAgICBjb25zdCBwcm9qZWN0QWdlbnRzRGlyID0gam9pbihnZXRPcmlnaW5hbEN3ZCgpLCAnLmNsYXVkZScsICdhZ2VudHMnKVxuXG4gICAgICBjb25zdCB7IGFjdGl2ZUFnZW50cywgYWxsQWdlbnRzLCBmYWlsZWRGaWxlcyB9ID0gYWdlbnREZWZpbml0aW9uc1xuXG4gICAgICBjb25zdCBbdXNlckRpckV4aXN0cywgcHJvamVjdERpckV4aXN0c10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICAgIHBhdGhFeGlzdHModXNlckFnZW50c0RpciksXG4gICAgICAgIHBhdGhFeGlzdHMocHJvamVjdEFnZW50c0RpciksXG4gICAgICBdKVxuXG4gICAgICBjb25zdCBhZ2VudEluZm9EYXRhID0ge1xuICAgICAgICBhY3RpdmVBZ2VudHM6IGFjdGl2ZUFnZW50cy5tYXAoYSA9PiAoe1xuICAgICAgICAgIGFnZW50VHlwZTogYS5hZ2VudFR5cGUsXG4gICAgICAgICAgc291cmNlOiBhLnNvdXJjZSxcbiAgICAgICAgfSkpLFxuICAgICAgICB1c2VyQWdlbnRzRGlyLFxuICAgICAgICBwcm9qZWN0QWdlbnRzRGlyLFxuICAgICAgICB1c2VyRGlyRXhpc3RzLFxuICAgICAgICBwcm9qZWN0RGlyRXhpc3RzLFxuICAgICAgICBmYWlsZWRGaWxlcyxcbiAgICAgIH1cbiAgICAgIHNldEFnZW50SW5mbyhhZ2VudEluZm9EYXRhKVxuXG4gICAgICBjb25zdCB3YXJuaW5ncyA9IGF3YWl0IGNoZWNrQ29udGV4dFdhcm5pbmdzKFxuICAgICAgICB0b29scyxcbiAgICAgICAge1xuICAgICAgICAgIGFjdGl2ZUFnZW50cyxcbiAgICAgICAgICBhbGxBZ2VudHMsXG4gICAgICAgICAgZmFpbGVkRmlsZXMsXG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jICgpID0+IHRvb2xQZXJtaXNzaW9uQ29udGV4dCxcbiAgICAgIClcbiAgICAgIHNldENvbnRleHRXYXJuaW5ncyh3YXJuaW5ncylcblxuICAgICAgLy8gRmV0Y2ggdmVyc2lvbiBsb2NrIGluZm8gaWYgUElELWJhc2VkIGxvY2tpbmcgaXMgZW5hYmxlZFxuICAgICAgaWYgKGlzUGlkQmFzZWRMb2NraW5nRW5hYmxlZCgpKSB7XG4gICAgICAgIGNvbnN0IGxvY2tzRGlyID0gam9pbihnZXRYREdTdGF0ZUhvbWUoKSwgJ2NsYXVkZScsICdsb2NrcycpXG4gICAgICAgIGNvbnN0IHN0YWxlTG9ja3NDbGVhbmVkID0gY2xlYW51cFN0YWxlTG9ja3MobG9ja3NEaXIpXG4gICAgICAgIGNvbnN0IGxvY2tzID0gZ2V0QWxsTG9ja0luZm8obG9ja3NEaXIpXG4gICAgICAgIHNldFZlcnNpb25Mb2NrSW5mbyh7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBsb2NrcyxcbiAgICAgICAgICBsb2Nrc0RpcixcbiAgICAgICAgICBzdGFsZUxvY2tzQ2xlYW5lZCxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFZlcnNpb25Mb2NrSW5mbyh7XG4gICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgbG9ja3M6IFtdLFxuICAgICAgICAgIGxvY2tzRGlyOiAnJyxcbiAgICAgICAgICBzdGFsZUxvY2tzQ2xlYW5lZDogMCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KSgpXG4gIH0sIFt0b29sUGVybWlzc2lvbkNvbnRleHQsIHRvb2xzLCBhZ2VudERlZmluaXRpb25zXSlcblxuICBjb25zdCBoYW5kbGVEaXNtaXNzID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIG9uRG9uZSgnQ2xhdWRlIENvZGUgZGlhZ25vc3RpY3MgZGlzbWlzc2VkJywgeyBkaXNwbGF5OiAnc3lzdGVtJyB9KVxuICB9LCBbb25Eb25lXSlcblxuICAvLyBIYW5kbGUgZGlzbWlzcyB2aWEga2V5YmluZGluZ3MgKEVudGVyLCBFc2NhcGUsIG9yIEN0cmwrQylcbiAgdXNlS2V5YmluZGluZ3MoXG4gICAge1xuICAgICAgJ2NvbmZpcm06eWVzJzogaGFuZGxlRGlzbWlzcyxcbiAgICAgICdjb25maXJtOm5vJzogaGFuZGxlRGlzbWlzcyxcbiAgICB9LFxuICAgIHsgY29udGV4dDogJ0NvbmZpcm1hdGlvbicgfSxcbiAgKVxuXG4gIC8vIExvYWRpbmcgc3RhdGVcbiAgaWYgKCFkaWFnbm9zdGljKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxQYW5lPlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5DaGVja2luZyBpbnN0YWxsYXRpb24gc3RhdHVz4oCmPC9UZXh0PlxuICAgICAgPC9QYW5lPlxuICAgIClcbiAgfVxuXG4gIC8vIEZvcm1hdCB0aGUgZGlhZ25vc3RpYyBvdXRwdXQgYWNjb3JkaW5nIHRvIHNwZWNcbiAgcmV0dXJuIChcbiAgICA8UGFuZT5cbiAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICA8VGV4dCBib2xkPkRpYWdub3N0aWNzPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICDilJQgQ3VycmVudGx5IHJ1bm5pbmc6IHtkaWFnbm9zdGljLmluc3RhbGxhdGlvblR5cGV9IChcbiAgICAgICAgICB7ZGlhZ25vc3RpYy52ZXJzaW9ufSlcbiAgICAgICAgPC9UZXh0PlxuICAgICAgICB7ZGlhZ25vc3RpYy5wYWNrYWdlTWFuYWdlciAmJiAoXG4gICAgICAgICAgPFRleHQ+4pSUIFBhY2thZ2UgbWFuYWdlcjoge2RpYWdub3N0aWMucGFja2FnZU1hbmFnZXJ9PC9UZXh0PlxuICAgICAgICApfVxuICAgICAgICA8VGV4dD7ilJQgUGF0aDoge2RpYWdub3N0aWMuaW5zdGFsbGF0aW9uUGF0aH08L1RleHQ+XG4gICAgICAgIDxUZXh0PuKUlCBJbnZva2VkOiB7ZGlhZ25vc3RpYy5pbnZva2VkQmluYXJ5fTwvVGV4dD5cbiAgICAgICAgPFRleHQ+4pSUIENvbmZpZyBpbnN0YWxsIG1ldGhvZDoge2RpYWdub3N0aWMuY29uZmlnSW5zdGFsbE1ldGhvZH08L1RleHQ+XG4gICAgICAgIDxUZXh0PlxuICAgICAgICAgIOKUlCBTZWFyY2g6IHtkaWFnbm9zdGljLnJpcGdyZXBTdGF0dXMud29ya2luZyA/ICdPSycgOiAnTm90IHdvcmtpbmcnfSAoXG4gICAgICAgICAge2RpYWdub3N0aWMucmlwZ3JlcFN0YXR1cy5tb2RlID09PSAnZW1iZWRkZWQnXG4gICAgICAgICAgICA/ICdidW5kbGVkJ1xuICAgICAgICAgICAgOiBkaWFnbm9zdGljLnJpcGdyZXBTdGF0dXMubW9kZSA9PT0gJ2J1aWx0aW4nXG4gICAgICAgICAgICAgID8gJ3ZlbmRvcidcbiAgICAgICAgICAgICAgOiBkaWFnbm9zdGljLnJpcGdyZXBTdGF0dXMuc3lzdGVtUGF0aCB8fCAnc3lzdGVtJ31cbiAgICAgICAgICApXG4gICAgICAgIDwvVGV4dD5cblxuICAgICAgICB7LyogU2hvdyByZWNvbW1lbmRhdGlvbiBpZiBhdXRvLXVwZGF0ZXMgYXJlIGRpc2FibGVkICovfVxuICAgICAgICB7ZGlhZ25vc3RpYy5yZWNvbW1lbmRhdGlvbiAmJiAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxUZXh0PjwvVGV4dD5cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICBSZWNvbW1lbmRhdGlvbjoge2RpYWdub3N0aWMucmVjb21tZW5kYXRpb24uc3BsaXQoJ1xcbicpWzBdfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgZGltQ29sb3I+e2RpYWdub3N0aWMucmVjb21tZW5kYXRpb24uc3BsaXQoJ1xcbicpWzFdfTwvVGV4dD5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKX1cblxuICAgICAgICB7LyogU2hvdyBtdWx0aXBsZSBpbnN0YWxsYXRpb25zIHdhcm5pbmcgKi99XG4gICAgICAgIHtkaWFnbm9zdGljLm11bHRpcGxlSW5zdGFsbGF0aW9ucy5sZW5ndGggPiAxICYmIChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPFRleHQ+PC9UZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+V2FybmluZzogTXVsdGlwbGUgaW5zdGFsbGF0aW9ucyBmb3VuZDwvVGV4dD5cbiAgICAgICAgICAgIHtkaWFnbm9zdGljLm11bHRpcGxlSW5zdGFsbGF0aW9ucy5tYXAoKGluc3RhbGwsIGkpID0+IChcbiAgICAgICAgICAgICAgPFRleHQga2V5PXtpfT5cbiAgICAgICAgICAgICAgICDilJQge2luc3RhbGwudHlwZX0gYXQge2luc3RhbGwucGF0aH1cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC8+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFNob3cgY29uZmlndXJhdGlvbiB3YXJuaW5ncyAqL31cbiAgICAgICAge2RpYWdub3N0aWMud2FybmluZ3MubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIDxUZXh0PjwvVGV4dD5cbiAgICAgICAgICAgIHtkaWFnbm9zdGljLndhcm5pbmdzLm1hcCgod2FybmluZywgaSkgPT4gKFxuICAgICAgICAgICAgICA8Qm94IGtleT17aX0gZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPldhcm5pbmc6IHt3YXJuaW5nLmlzc3VlfTwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dD5GaXg6IHt3YXJuaW5nLmZpeH08L1RleHQ+XG4gICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC8+XG4gICAgICAgICl9XG5cbiAgICAgICAgey8qIFNob3cgaW52YWxpZCBzZXR0aW5ncyBlcnJvcnMgKi99XG4gICAgICAgIHtlcnJvcnNFeGNsdWRpbmdNY3AubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgbWFyZ2luVG9wPXsxfSBtYXJnaW5Cb3R0b209ezF9PlxuICAgICAgICAgICAgPFRleHQgYm9sZD5JbnZhbGlkIFNldHRpbmdzPC9UZXh0PlxuICAgICAgICAgICAgPFZhbGlkYXRpb25FcnJvcnNMaXN0IGVycm9ycz17ZXJyb3JzRXhjbHVkaW5nTWNwfSAvPlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuICAgICAgPC9Cb3g+XG5cbiAgICAgIHsvKiBVcGRhdGVzIHNlY3Rpb24gKi99XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgPFRleHQgYm9sZD5VcGRhdGVzPC9UZXh0PlxuICAgICAgICA8VGV4dD5cbiAgICAgICAgICDilJQgQXV0by11cGRhdGVzOnsnICd9XG4gICAgICAgICAge2RpYWdub3N0aWMucGFja2FnZU1hbmFnZXJcbiAgICAgICAgICAgID8gJ01hbmFnZWQgYnkgcGFja2FnZSBtYW5hZ2VyJ1xuICAgICAgICAgICAgOiBkaWFnbm9zdGljLmF1dG9VcGRhdGVzfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIHtkaWFnbm9zdGljLmhhc1VwZGF0ZVBlcm1pc3Npb25zICE9PSBudWxsICYmIChcbiAgICAgICAgICA8VGV4dD5cbiAgICAgICAgICAgIOKUlCBVcGRhdGUgcGVybWlzc2lvbnM6eycgJ31cbiAgICAgICAgICAgIHtkaWFnbm9zdGljLmhhc1VwZGF0ZVBlcm1pc3Npb25zID8gJ1llcycgOiAnTm8gKHJlcXVpcmVzIHN1ZG8pJ31cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICl9XG4gICAgICAgIDxUZXh0PuKUlCBBdXRvLXVwZGF0ZSBjaGFubmVsOiB7YXV0b1VwZGF0ZXNDaGFubmVsfTwvVGV4dD5cbiAgICAgICAgPFN1c3BlbnNlIGZhbGxiYWNrPXtudWxsfT5cbiAgICAgICAgICA8RGlzdFRhZ3NEaXNwbGF5IHByb21pc2U9e2Rpc3RUYWdzUHJvbWlzZX0gLz5cbiAgICAgICAgPC9TdXNwZW5zZT5cbiAgICAgIDwvQm94PlxuXG4gICAgICA8U2FuZGJveERvY3RvclNlY3Rpb24gLz5cblxuICAgICAgPE1jcFBhcnNpbmdXYXJuaW5ncyAvPlxuXG4gICAgICA8S2V5YmluZGluZ1dhcm5pbmdzIC8+XG5cbiAgICAgIHsvKiBFbnZpcm9ubWVudCBWYXJpYWJsZXMgKi99XG4gICAgICB7ZW52VmFsaWRhdGlvbkVycm9ycy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgPEJveCBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCI+XG4gICAgICAgICAgPFRleHQgYm9sZD5FbnZpcm9ubWVudCBWYXJpYWJsZXM8L1RleHQ+XG4gICAgICAgICAge2VudlZhbGlkYXRpb25FcnJvcnMubWFwKCh2YWxpZGF0aW9uLCBpKSA9PiAoXG4gICAgICAgICAgICA8VGV4dCBrZXk9e2l9PlxuICAgICAgICAgICAgICDilJQge3ZhbGlkYXRpb24ubmFtZX06eycgJ31cbiAgICAgICAgICAgICAgPFRleHRcbiAgICAgICAgICAgICAgICBjb2xvcj17dmFsaWRhdGlvbi5zdGF0dXMgPT09ICdjYXBwZWQnID8gJ3dhcm5pbmcnIDogJ2Vycm9yJ31cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHt2YWxpZGF0aW9uLm1lc3NhZ2V9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuXG4gICAgICB7LyogVmVyc2lvbiBMb2NrcyAoUElELWJhc2VkIGxvY2tpbmcpICovfVxuICAgICAge3ZlcnNpb25Mb2NrSW5mbz8uZW5hYmxlZCAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGJvbGQ+VmVyc2lvbiBMb2NrczwvVGV4dD5cbiAgICAgICAgICB7dmVyc2lvbkxvY2tJbmZvLnN0YWxlTG9ja3NDbGVhbmVkID4gMCAmJiAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAg4pSUIENsZWFuZWQge3ZlcnNpb25Mb2NrSW5mby5zdGFsZUxvY2tzQ2xlYW5lZH0gc3RhbGUgbG9jayhzKVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICl9XG4gICAgICAgICAge3ZlcnNpb25Mb2NrSW5mby5sb2Nrcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj7ilJQgTm8gYWN0aXZlIHZlcnNpb24gbG9ja3M8L1RleHQ+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIHZlcnNpb25Mb2NrSW5mby5sb2Nrcy5tYXAoKGxvY2ssIGkpID0+IChcbiAgICAgICAgICAgICAgPFRleHQga2V5PXtpfT5cbiAgICAgICAgICAgICAgICDilJQge2xvY2sudmVyc2lvbn06IFBJRCB7bG9jay5waWR9eycgJ31cbiAgICAgICAgICAgICAgICB7bG9jay5pc1Byb2Nlc3NSdW5uaW5nID8gKFxuICAgICAgICAgICAgICAgICAgPFRleHQ+KHJ1bm5pbmcpPC9UZXh0PlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIj4oc3RhbGUpPC9UZXh0PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICkpXG4gICAgICAgICAgKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuXG4gICAgICB7YWdlbnRJbmZvPy5mYWlsZWRGaWxlcyAmJiBhZ2VudEluZm8uZmFpbGVkRmlsZXMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgICAgQWdlbnQgUGFyc2UgRXJyb3JzXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwiZXJyb3JcIj5cbiAgICAgICAgICAgIOKUlCBGYWlsZWQgdG8gcGFyc2Uge2FnZW50SW5mby5mYWlsZWRGaWxlcy5sZW5ndGh9IGFnZW50IGZpbGUocyk6XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIHthZ2VudEluZm8uZmFpbGVkRmlsZXMubWFwKChmaWxlLCBpKSA9PiAoXG4gICAgICAgICAgICA8VGV4dCBrZXk9e2l9IGRpbUNvbG9yPlxuICAgICAgICAgICAgICB7JyAgJ33ilJQge2ZpbGUucGF0aH06IHtmaWxlLmVycm9yfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICkpfVxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBQbHVnaW4gRXJyb3JzICovfVxuICAgICAge3BsdWdpbnNFcnJvcnMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJlcnJvclwiPlxuICAgICAgICAgICAgUGx1Z2luIEVycm9yc1xuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgICDilJQge3BsdWdpbnNFcnJvcnMubGVuZ3RofSBwbHVnaW4gZXJyb3IocykgZGV0ZWN0ZWQ6XG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIHtwbHVnaW5zRXJyb3JzLm1hcCgoZXJyb3IsIGkpID0+IChcbiAgICAgICAgICAgIDxUZXh0IGtleT17aX0gZGltQ29sb3I+XG4gICAgICAgICAgICAgIHsnICAnfeKUlCB7ZXJyb3Iuc291cmNlIHx8ICd1bmtub3duJ31cbiAgICAgICAgICAgICAgeydwbHVnaW4nIGluIGVycm9yICYmIGVycm9yLnBsdWdpbiA/IGAgWyR7ZXJyb3IucGx1Z2lufV1gIDogJyd9OnsnICd9XG4gICAgICAgICAgICAgIHtnZXRQbHVnaW5FcnJvck1lc3NhZ2UoZXJyb3IpfVxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICkpfVxuICAgICAgICA8L0JveD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBVbnJlYWNoYWJsZSBQZXJtaXNzaW9uIFJ1bGVzIFdhcm5pbmcgKi99XG4gICAgICB7Y29udGV4dFdhcm5pbmdzPy51bnJlYWNoYWJsZVJ1bGVzV2FybmluZyAmJiAoXG4gICAgICAgIDxCb3ggZmxleERpcmVjdGlvbj1cImNvbHVtblwiPlxuICAgICAgICAgIDxUZXh0IGJvbGQgY29sb3I9XCJ3YXJuaW5nXCI+XG4gICAgICAgICAgICBVbnJlYWNoYWJsZSBQZXJtaXNzaW9uIFJ1bGVzXG4gICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAg4pSUeycgJ31cbiAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfXsnICd9XG4gICAgICAgICAgICAgIHtjb250ZXh0V2FybmluZ3MudW5yZWFjaGFibGVSdWxlc1dhcm5pbmcubWVzc2FnZX1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAge2NvbnRleHRXYXJuaW5ncy51bnJlYWNoYWJsZVJ1bGVzV2FybmluZy5kZXRhaWxzLm1hcCgoZGV0YWlsLCBpKSA9PiAoXG4gICAgICAgICAgICA8VGV4dCBrZXk9e2l9IGRpbUNvbG9yPlxuICAgICAgICAgICAgICB7JyAgJ33ilJQge2RldGFpbH1cbiAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuXG4gICAgICB7LyogQ29udGV4dCBVc2FnZSBXYXJuaW5ncyAqL31cbiAgICAgIHtjb250ZXh0V2FybmluZ3MgJiZcbiAgICAgICAgKGNvbnRleHRXYXJuaW5ncy5jbGF1ZGVNZFdhcm5pbmcgfHxcbiAgICAgICAgICBjb250ZXh0V2FybmluZ3MuYWdlbnRXYXJuaW5nIHx8XG4gICAgICAgICAgY29udGV4dFdhcm5pbmdzLm1jcFdhcm5pbmcpICYmIChcbiAgICAgICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIj5cbiAgICAgICAgICAgIDxUZXh0IGJvbGQ+Q29udGV4dCBVc2FnZSBXYXJuaW5nczwvVGV4dD5cblxuICAgICAgICAgICAge2NvbnRleHRXYXJuaW5ncy5jbGF1ZGVNZFdhcm5pbmcgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAg4pSUeycgJ31cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSB7Y29udGV4dFdhcm5pbmdzLmNsYXVkZU1kV2FybmluZy5tZXNzYWdlfVxuICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dD57JyAgJ33ilJQgRmlsZXM6PC9UZXh0PlxuICAgICAgICAgICAgICAgIHtjb250ZXh0V2FybmluZ3MuY2xhdWRlTWRXYXJuaW5nLmRldGFpbHMubWFwKChkZXRhaWwsIGkpID0+IChcbiAgICAgICAgICAgICAgICAgIDxUZXh0IGtleT17aX0gZGltQ29sb3I+XG4gICAgICAgICAgICAgICAgICAgIHsnICAgICd94pSUIHtkZXRhaWx9XG4gICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge2NvbnRleHRXYXJuaW5ncy5hZ2VudFdhcm5pbmcgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAg4pSUeycgJ31cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSB7Y29udGV4dFdhcm5pbmdzLmFnZW50V2FybmluZy5tZXNzYWdlfVxuICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8VGV4dD57JyAgJ33ilJQgVG9wIGNvbnRyaWJ1dG9yczo8L1RleHQ+XG4gICAgICAgICAgICAgICAge2NvbnRleHRXYXJuaW5ncy5hZ2VudFdhcm5pbmcuZGV0YWlscy5tYXAoKGRldGFpbCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgPFRleHQga2V5PXtpfSBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgICAgeycgICAgJ33ilJQge2RldGFpbH1cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICB7Y29udGV4dFdhcm5pbmdzLm1jcFdhcm5pbmcgJiYgKFxuICAgICAgICAgICAgICA8PlxuICAgICAgICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgICAgICAg4pSUeycgJ31cbiAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICB7ZmlndXJlcy53YXJuaW5nfSB7Y29udGV4dFdhcm5pbmdzLm1jcFdhcm5pbmcubWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgPFRleHQ+eycgICd94pSUIE1DUCBzZXJ2ZXJzOjwvVGV4dD5cbiAgICAgICAgICAgICAgICB7Y29udGV4dFdhcm5pbmdzLm1jcFdhcm5pbmcuZGV0YWlscy5tYXAoKGRldGFpbCwgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgPFRleHQga2V5PXtpfSBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgICAgeycgICAgJ33ilJQge2RldGFpbH1cbiAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvQm94PlxuICAgICAgICApfVxuXG4gICAgICA8Qm94PlxuICAgICAgICA8UHJlc3NFbnRlclRvQ29udGludWUgLz5cbiAgICAgIDwvQm94PlxuICAgIDwvUGFuZT5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsT0FBTyxNQUFNLFNBQVM7QUFDN0IsU0FBU0MsSUFBSSxRQUFRLE1BQU07QUFDM0IsT0FBT0MsS0FBSyxJQUNWQyxRQUFRLEVBQ1JDLEdBQUcsRUFDSEMsV0FBVyxFQUNYQyxTQUFTLEVBQ1RDLE9BQU8sRUFDUEMsUUFBUSxRQUNILE9BQU87QUFDZCxTQUFTQyxrQkFBa0IsUUFBUSxzQ0FBc0M7QUFDekUsU0FBU0Msa0JBQWtCLFFBQVEsMENBQTBDO0FBQzdFLFNBQVNDLHVCQUF1QixRQUFRLHNCQUFzQjtBQUM5RCxTQUFTQyxzQkFBc0IsUUFBUSx1QkFBdUI7QUFDOUQsY0FBY0MsYUFBYSxRQUFRLGlDQUFpQztBQUNwRSxTQUFTQyxjQUFjLFFBQVEsdUJBQXVCO0FBQ3RELGNBQWNDLG9C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