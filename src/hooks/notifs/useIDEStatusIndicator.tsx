// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、useEffect、useRef，将 react 中已经封装好的能力接到本文件流程里。
import React, { useEffect, useRef } from 'react';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 引入 Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from 'src/ink.js';
// 类型依赖 { MCPServerConnection } 来自 src/services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { MCPServerConnection } from 'src/services/mcp/types.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from 'src/utils/config.js';
// 复用 detectIDEs、IDEExtensionInstallationStatus、isJetBrainsIde、isSupportedTerminal 工具函数，把通用处理留在 src/utils/ide.js 中维护。
import { detectIDEs, type IDEExtensionInstallationStatus, isJetBrainsIde, isSupportedTerminal } from 'src/utils/ide.js';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// 引入 useIdeConnectionStatus，将 ../useIdeConnectionStatus.js 中已经封装好的能力接到本文件流程里。
import { useIdeConnectionStatus } from '../useIdeConnectionStatus.js';
// 类型依赖 { IDESelection } 来自 ../useIdeSelection.js，用于校准React hook 状态流的数据契约。
import type { IDESelection } from '../useIdeSelection.js';
// MAX_IDE_HINT_SHOW_COUNT 数量保存`5`，供后续判断或组装使用。
const MAX_IDE_HINT_SHOW_COUNT = 5;
// Props 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  ideInstallationStatus: IDEExtensionInstallationStatus | null;
  ideSelection: IDESelection | undefined;
  mcpClients: MCPServerConnection[];
};
// useIDEStatusIndicator 封装useIDEStatusIndicator的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIDEStatusIndicator(t0) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(26);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    ideSelection,
    mcpClients,
    ideInstallationStatus
  } = t0;
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification,
    removeNotification
  } = useNotifications();
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    status: ideStatus,
    ideName
  } = useIdeConnectionStatus(mcpClients);
  // hasShownHintRef 引用记录 `useRef` 是否成立，React hook随后按该结果分支。
  const hasShownHintRef = useRef(false);
  // t1 暂存 `ideInstallationStatus ? isJetBrainsIde(ideInstallationSta...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== ideInstallationStatus) {
    // t1 暂存 `ideInstallationStatus ? isJetBrainsIde(ideInstallationSta...` 生成的渲染片段，后续返回路径直接复用。
    t1 = ideInstallationStatus ? isJetBrainsIde(ideInstallationStatus?.ideType) : false;
    // $[0] 缓存 `ideInstallationStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = ideInstallationStatus;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // isJetBrains 集合标记React hook use IDESta...是否启用对应路径。
  const isJetBrains = t1;
  // showIDEInstallErrorOrJetBrainsInfo 错误信息标记React hook use IDESta...是否启用对应路径。
  const showIDEInstallErrorOrJetBrainsInfo = ideInstallationStatus?.error || isJetBrains;
  // shouldShowIdeSelection标记React hook use IDESta...是否启用对应路径。
  const shouldShowIdeSelection = ideStatus === "connected" && (ideSelection?.filePath || ideSelection?.text && ideSelection.lineCount > 0);
  // shouldShowConnected标记React hook use IDESta...是否启用对应路径。
  const shouldShowConnected = ideStatus === "connected" && !shouldShowIdeSelection;
  // showIDEInstallError 错误信息标记React hook use IDESta...是否启用对应路径。
  const showIDEInstallError = showIDEInstallErrorOrJetBrainsInfo && !isJetBrains && !shouldShowConnected && !shouldShowIdeSelection;
  // showJetBrainsInfo标记React hook use IDESta...是否启用对应路径。
  const showJetBrainsInfo = showIDEInstallErrorOrJetBrainsInfo && isJetBrains && !shouldShowConnected && !shouldShowIdeSelection;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== addNotification || $[3] !== ideStatus || $[4] !== removeNotification || $[5] !== showJetBrainsInfo) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // `isSupportedTerminal() || ideStatus` 与 `null || showJetBrainsInfo` 不一致时刷新派生状态，避免使用过期结果。
      if (isSupportedTerminal() || ideStatus !== null || showJetBrainsInfo) {
        // 调用 removeNotification，触发React hook此处需要的副作用。
        removeNotification("ide-status-hint");
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 组合条件 `hasShownHintRef.current || (getGlobalConfig().ideHintShownCount ?? 0) >= MAX_IDE_...` 成立时，React hook 状态流才启用这条专门路径。
      if (hasShownHintRef.current || (getGlobalConfig().ideHintShownCount ?? 0) >= MAX_IDE_HINT_SHOW_COUNT) {
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // timeoutId保存`setTimeout`，供React hook后续处理使用。
      const timeoutId = setTimeout(_temp2, 3000, hasShownHintRef, addNotification);
      // 返回 `() => clearTimeout(timeoutId)`，作为React hook 状态流这次计算的结果。
      return () => clearTimeout(timeoutId);
    };
    // t3 暂存 `[addNotification, removeNotification, ideStatus, showJetB...` 生成的渲染片段，后续返回路径直接复用。
    t3 = [addNotification, removeNotification, ideStatus, showJetBrainsInfo];
    // $[2] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = addNotification;
    // $[3] 缓存 `ideStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = ideStatus;
    // $[4] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = removeNotification;
    // $[5] 缓存 `showJetBrainsInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = showJetBrainsInfo;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
    // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
    // t3 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[7];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== addNotification || $[9] !== ideName || $[10] !== ideStatus || $[11] !== removeNotification || $[12] !== showIDEInstallError || $[13] !== showJetBrainsInfo) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 组合条件 `showIDEInstallError || showJetBrainsInfo || ideSt` 成立时，React hook 状态流才启用这条专门路径。
      if (showIDEInstallError || showJetBrainsInfo || ideStatus !== "disconnected" || !ideName) {
        // 调用 removeNotification，触发React hook此处需要的副作用。
        removeNotification("ide-status-disconnected");
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: "ide-status-disconnected",
        text: `${ideName} disconnected`,
        color: "error",
        priority: "medium"
      });
    };
    // t5 暂存 `[addNotification, removeNotification, ideStatus, ideName,...` 生成的渲染片段，后续返回路径直接复用。
    t5 = [addNotification, removeNotification, ideStatus, ideName, showIDEInstallError, showJetBrainsInfo];
    // $[8] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = addNotification;
    // $[9] 缓存 `ideName`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = ideName;
    // $[10] 缓存 `ideStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = ideStatus;
    // $[11] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = removeNotification;
    // $[12] 缓存 `showIDEInstallError`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = showIDEInstallError;
    // $[13] 缓存 `showJetBrainsInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = showJetBrainsInfo;
    // $[14] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t4;
    // $[15] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t5;
  } else {
    // t4 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[14];
    // t5 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[15];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t4, t5);
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // t7 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[16] !== addNotification || $[17] !== removeNotification || $[18] !== showJetBrainsInfo) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // showJetBrainsInfo缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!showJetBrainsInfo) {
        // 调用 removeNotification，触发React hook此处需要的副作用。
        removeNotification("ide-status-jetbrains-disconnected");
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: "ide-status-jetbrains-disconnected",
        text: "IDE plugin not connected \xB7 /status for info",
        priority: "medium"
      });
    };
    // t7 暂存 `[addNotification, removeNotification, showJetBrainsInfo]` 生成的渲染片段，后续返回路径直接复用。
    t7 = [addNotification, removeNotification, showJetBrainsInfo];
    // $[16] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = addNotification;
    // $[17] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = removeNotification;
    // $[18] 缓存 `showJetBrainsInfo`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = showJetBrainsInfo;
    // $[19] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t6;
    // $[20] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t7;
  } else {
    // t6 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[19];
    // t7 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[20];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t6, t7);
  // t8 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // t9 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== addNotification || $[22] !== removeNotification || $[23] !== showIDEInstallError) {
    // t8 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t8 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // showIDEInstallError 错误信息缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!showIDEInstallError) {
        // 调用 removeNotification，触发React hook此处需要的副作用。
        removeNotification("ide-status-install-error");
        // React hook use IDEStatus Indicator在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: "ide-status-install-error",
        text: "IDE extension install failed (see /status for info)",
        color: "error",
        priority: "medium"
      });
    };
    // t9 暂存 `[addNotification, removeNotification, showIDEInstallError]` 生成的渲染片段，后续返回路径直接复用。
    t9 = [addNotification, removeNotification, showIDEInstallError];
    // $[21] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = addNotification;
    // $[22] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = removeNotification;
    // $[23] 缓存 `showIDEInstallError`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = showIDEInstallError;
    // $[24] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[24] = t8;
    // $[25] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[25] = t9;
  } else {
    // t8 从 React 编译缓存槽 $[24] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[24];
    // t9 从 React 编译缓存槽 $[25] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[25];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t8, t9);
}
// _temp2 封装useIDEStatusIndicator的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(hasShownHintRef_0, addNotification_0) {
  // 调用 detectIDEs，触发React hook此处需要的副作用。
  detectIDEs(true).then(infos => {
    // ideName_0 命名 `infos[0]?.name`，让后续代码直接表达这个值的用途。
    const ideName_0 = infos[0]?.name;
    // 组合条件 `ideName_0 && !hasShownHintRef_0.current` 成立时，React hook 状态流才启用这条专门路径。
    if (ideName_0 && !hasShownHintRef_0.current) {
      // current更新为 `true`，确保useIDEStatusIndicator后续读取最新状态。
      hasShownHintRef_0.current = true;
      // 调用 saveGlobalConfig，触发React hook此处需要的副作用。
      saveGlobalConfig(_temp);
      // 调用 addNotification_0，触发React hook此处需要的副作用。
      addNotification_0({
        key: "ide-status-hint",
        jsx: <Text dimColor={true}>/ide for <Text color="ide">{ideName_0}</Text></Text>,
        priority: "low"
      });
    }
  });
}
// _temp 封装useIDEStatusIndicator的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(current) {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    ...current,
    ideHintShownCount: (current.ideHintShownCount ?? 0) + 1
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZU5vdGlmaWNhdGlvbnMiLCJUZXh0IiwiTUNQU2VydmVyQ29ubmVjdGlvbiIsImdldEdsb2JhbENvbmZpZyIsInNhdmVHbG9iYWxDb25maWciLCJkZXRlY3RJREVzIiwiSURFRXh0ZW5zaW9uSW5zdGFsbGF0aW9uU3RhdHVzIiwiaXNKZXRCcmFpbnNJZGUiLCJpc1N1cHBvcnRlZFRlcm1pbmFsIiwiZ2V0SXNSZW1vdGVNb2RlIiwidXNlSWRlQ29ubmVjdGlvblN0YXR1cyIsIklERVNlbGVjdGlvbiIsIk1BWF9JREVfSElOVF9TSE9XX0NPVU5UIiwiUHJvcHMiLCJpZGVJbnN0YWxsYXRpb25TdGF0dXMiLCJpZGVTZWxlY3Rpb24iLCJtY3BDbGllbnRzIiwidXNlSURFU3RhdHVzSW5kaWNhdG9yIiwidDAiLCIkIiwiX2MiLCJhZGROb3RpZmljYXRpb24iLCJyZW1vdmVOb3RpZmljYXRpb24iLCJzdGF0dXMiLCJpZGVTdGF0dXMiLCJpZGVOYW1lIiwiaGFzU2hvd25IaW50UmVmIiwidDEiLCJpZGVUeXBlIiwiaXNKZXRCcmFpbnMiLCJzaG93SURFSW5zdGFsbEVycm9yT3JKZXRCcmFpbnNJbmZvIiwiZXJyb3IiLCJzaG91bGRTaG93SWRlU2VsZWN0aW9uIiwiZmlsZVBhdGgiLCJ0ZXh0IiwibGluZUNvdW50Iiwic2hvdWxkU2hvd0Nvbm5lY3RlZCIsInNob3dJREVJbnN0YWxsRXJyb3IiLCJzaG93SmV0QnJhaW5zSW5mbyIsInQyIiwidDMiLCJjdXJyZW50IiwiaWRlSGludFNob3duQ291bnQiLCJ0aW1lb3V0SWQiLCJzZXRUaW1lb3V0IiwiX3RlbXAyIiwiY2xlYXJUaW1lb3V0IiwidDQiLCJ0NSIsImtleSIsImNvbG9yIiwicHJpb3JpdHkiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsImhhc1Nob3duSGludFJlZl8wIiwiYWRkTm90aWZpY2F0aW9uXzAiLCJ0aGVuIiwiaW5mb3MiLCJpZGVOYW1lXzAiLCJuYW1lIiwiX3RlbXAiLCJqc3giXSwic291cmNlcyI6WyJ1c2VJREVTdGF0dXNJbmRpY2F0b3IudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlTm90aWZpY2F0aW9ucyB9IGZyb20gJ3NyYy9jb250ZXh0L25vdGlmaWNhdGlvbnMuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnc3JjL2luay5qcydcbmltcG9ydCB0eXBlIHsgTUNQU2VydmVyQ29ubmVjdGlvbiB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9tY3AvdHlwZXMuanMnXG5pbXBvcnQgeyBnZXRHbG9iYWxDb25maWcsIHNhdmVHbG9iYWxDb25maWcgfSBmcm9tICdzcmMvdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHtcbiAgZGV0ZWN0SURFcyxcbiAgdHlwZSBJREVFeHRlbnNpb25JbnN0YWxsYXRpb25TdGF0dXMsXG4gIGlzSmV0QnJhaW5zSWRlLFxuICBpc1N1cHBvcnRlZFRlcm1pbmFsLFxufSBmcm9tICdzcmMvdXRpbHMvaWRlLmpzJ1xuaW1wb3J0IHsgZ2V0SXNSZW1vdGVNb2RlIH0gZnJvbSAnLi4vLi4vYm9vdHN0cmFwL3N0YXRlLmpzJ1xuaW1wb3J0IHsgdXNlSWRlQ29ubmVjdGlvblN0YXR1cyB9IGZyb20gJy4uL3VzZUlkZUNvbm5lY3Rpb25TdGF0dXMuanMnXG5pbXBvcnQgdHlwZSB7IElERVNlbGVjdGlvbiB9IGZyb20gJy4uL3VzZUlkZVNlbGVjdGlvbi5qcydcblxuY29uc3QgTUFYX0lERV9ISU5UX1NIT1dfQ09VTlQgPSA1XG5cbnR5cGUgUHJvcHMgPSB7XG4gIGlkZUluc3RhbGxhdGlvblN0YXR1czogSURFRXh0ZW5zaW9uSW5zdGFsbGF0aW9uU3RhdHVzIHwgbnVsbFxuICBpZGVTZWxlY3Rpb246IElERVNlbGVjdGlvbiB8IHVuZGVmaW5lZFxuICBtY3BDbGllbnRzOiBNQ1BTZXJ2ZXJDb25uZWN0aW9uW11cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZUlERVN0YXR1c0luZGljYXRvcih7XG4gIGlkZVNlbGVjdGlvbixcbiAgbWNwQ2xpZW50cyxcbiAgaWRlSW5zdGFsbGF0aW9uU3RhdHVzLFxufTogUHJvcHMpOiB2b2lkIHtcbiAgY29uc3QgeyBhZGROb3RpZmljYXRpb24sIHJlbW92ZU5vdGlmaWNhdGlvbiB9ID0gdXNlTm90aWZpY2F0aW9ucygpXG4gIGNvbnN0IHsgc3RhdHVzOiBpZGVTdGF0dXMsIGlkZU5hbWUgfSA9IHVzZUlkZUNvbm5lY3Rpb25TdGF0dXMobWNwQ2xpZW50cylcbiAgY29uc3QgaGFzU2hvd25IaW50UmVmID0gdXNlUmVmKGZhbHNlKVxuXG4gIGNvbnN0IGlzSmV0QnJhaW5zID0gaWRlSW5zdGFsbGF0aW9uU3RhdHVzXG4gICAgPyBpc0pldEJyYWluc0lkZShpZGVJbnN0YWxsYXRpb25TdGF0dXM/LmlkZVR5cGUpXG4gICAgOiBmYWxzZVxuICBjb25zdCBzaG93SURFSW5zdGFsbEVycm9yT3JKZXRCcmFpbnNJbmZvID1cbiAgICBpZGVJbnN0YWxsYXRpb25TdGF0dXM/LmVycm9yIHx8IGlzSmV0QnJhaW5zXG5cbiAgY29uc3Qgc2hvdWxkU2hvd0lkZVNlbGVjdGlvbiA9XG4gICAgaWRlU3RhdHVzID09PSAnY29ubmVjdGVkJyAmJlxuICAgIChpZGVTZWxlY3Rpb24/LmZpbGVQYXRoIHx8XG4gICAgICAoaWRlU2VsZWN0aW9uPy50ZXh0ICYmIGlkZVNlbGVjdGlvbi5saW5lQ291bnQgPiAwKSlcblxuICAvLyBPbmx5IHNob3cgdGhlIGNvbm5lY3RlZCBpZiBub3Qgc2hvd2luZyBjb250ZXh0XG4gIGNvbnN0IHNob3VsZFNob3dDb25uZWN0ZWQgPVxuICAgIGlkZVN0YXR1cyA9PT0gJ2Nvbm5lY3RlZCcgJiYgIXNob3VsZFNob3dJZGVTZWxlY3Rpb25cblxuICBjb25zdCBzaG93SURFSW5zdGFsbEVycm9yID1cbiAgICBzaG93SURFSW5zdGFsbEVycm9yT3JKZXRCcmFpbnNJbmZvICYmXG4gICAgIWlzSmV0QnJhaW5zICYmXG4gICAgIXNob3VsZFNob3dDb25uZWN0ZWQgJiZcbiAgICAhc2hvdWxkU2hvd0lkZVNlbGVjdGlvblxuXG4gIGNvbnN0IHNob3dKZXRCcmFpbnNJbmZvID1cbiAgICBzaG93SURFSW5zdGFsbEVycm9yT3JKZXRCcmFpbnNJbmZvICYmXG4gICAgaXNKZXRCcmFpbnMgJiZcbiAgICAhc2hvdWxkU2hvd0Nvbm5lY3RlZCAmJlxuICAgICFzaG91bGRTaG93SWRlU2VsZWN0aW9uXG5cbiAgLy8gU2hvdyB0aGUgL2lkZSBjb21tYW5kIGhpbnQgaWYgcnVubmluZyBmcm9tIGFuIGV4dGVybmFsIHRlcm1pbmFsIGFuZCBmb3VuZCBydW5uaW5nIElERShzKVxuICAvLyBEZWxheSBzaG93aW5nIGhpbnQgdG8gYXZvaWQgYnJpZWYgZmxhc2ggZHVyaW5nIGF1dG8tY29ubmVjdCBzdGFydHVwXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBpZiAoaXNTdXBwb3J0ZWRUZXJtaW5hbCgpIHx8IGlkZVN0YXR1cyAhPT0gbnVsbCB8fCBzaG93SmV0QnJhaW5zSW5mbykge1xuICAgICAgcmVtb3ZlTm90aWZpY2F0aW9uKCdpZGUtc3RhdHVzLWhpbnQnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIFdhaXQgYSBiaXQgdG8gbGV0IGF1dG8tY29ubmVjdCBoYXBwZW4gZmlyc3QsIGF2b2lkaW5nIGJyaWVmIGhpbnQgZmxhc2hcbiAgICBpZiAoXG4gICAgICBoYXNTaG93bkhpbnRSZWYuY3VycmVudCB8fFxuICAgICAgKGdldEdsb2JhbENvbmZpZygpLmlkZUhpbnRTaG93bkNvdW50ID8/IDApID49IE1BWF9JREVfSElOVF9TSE9XX0NPVU5UXG4gICAgKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dChcbiAgICAgIChoYXNTaG93bkhpbnRSZWYsIGFkZE5vdGlmaWNhdGlvbikgPT4ge1xuICAgICAgICB2b2lkIGRldGVjdElERXModHJ1ZSkudGhlbihpbmZvcyA9PiB7XG4gICAgICAgICAgY29uc3QgaWRlTmFtZSA9IGluZm9zWzBdPy5uYW1lXG4gICAgICAgICAgaWYgKGlkZU5hbWUgJiYgIWhhc1Nob3duSGludFJlZi5jdXJyZW50KSB7XG4gICAgICAgICAgICBoYXNTaG93bkhpbnRSZWYuY3VycmVudCA9IHRydWVcbiAgICAgICAgICAgIHNhdmVHbG9iYWxDb25maWcoY3VycmVudCA9PiAoe1xuICAgICAgICAgICAgICAuLi5jdXJyZW50LFxuICAgICAgICAgICAgICBpZGVIaW50U2hvd25Db3VudDogKGN1cnJlbnQuaWRlSGludFNob3duQ291bnQgPz8gMCkgKyAxLFxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICBhZGROb3RpZmljYXRpb24oe1xuICAgICAgICAgICAgICBrZXk6ICdpZGUtc3RhdHVzLWhpbnQnLFxuICAgICAgICAgICAgICBqc3g6IChcbiAgICAgICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgICAgICAgICAgICAgIC9pZGUgZm9yIDxUZXh0IGNvbG9yPVwiaWRlXCI+e2lkZU5hbWV9PC9UZXh0PlxuICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgcHJpb3JpdHk6ICdsb3cnLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgICAgMzAwMCxcbiAgICAgIGhhc1Nob3duSGludFJlZixcbiAgICAgIGFkZE5vdGlmaWNhdGlvbixcbiAgICApXG4gICAgcmV0dXJuICgpID0+IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpXG4gIH0sIFthZGROb3RpZmljYXRpb24sIHJlbW92ZU5vdGlmaWNhdGlvbiwgaWRlU3RhdHVzLCBzaG93SmV0QnJhaW5zSW5mb10pXG5cbiAgLy8gU2hvdyBJREUgZGlzY29ubmVjdGVkL2ZhaWxlZCBub3RpZmljYXRpb24gd2hlbiBzdGF0dXMgaXMgZGlzY29ubmVjdGVkXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBpZiAoXG4gICAgICBzaG93SURFSW5zdGFsbEVycm9yIHx8XG4gICAgICBzaG93SmV0QnJhaW5zSW5mbyB8fFxuICAgICAgaWRlU3RhdHVzICE9PSAnZGlzY29ubmVjdGVkJyB8fFxuICAgICAgIWlkZU5hbWVcbiAgICApIHtcbiAgICAgIHJlbW92ZU5vdGlmaWNhdGlvbignaWRlLXN0YXR1cy1kaXNjb25uZWN0ZWQnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICBrZXk6ICdpZGUtc3RhdHVzLWRpc2Nvbm5lY3RlZCcsXG4gICAgICB0ZXh0OiBgJHtpZGVOYW1lfSBkaXNjb25uZWN0ZWRgLFxuICAgICAgY29sb3I6ICdlcnJvcicsXG4gICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgfSlcbiAgfSwgW1xuICAgIGFkZE5vdGlmaWNhdGlvbixcbiAgICByZW1vdmVOb3RpZmljYXRpb24sXG4gICAgaWRlU3RhdHVzLFxuICAgIGlkZU5hbWUsXG4gICAgc2hvd0lERUluc3RhbGxFcnJvcixcbiAgICBzaG93SmV0QnJhaW5zSW5mbyxcbiAgXSlcblxuICAvLyBTaG93IEpldEJyYWlucyBwbHVnaW4gbm90IGNvbm5lY3RlZCBoaW50XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBpZiAoIXNob3dKZXRCcmFpbnNJbmZvKSB7XG4gICAgICByZW1vdmVOb3RpZmljYXRpb24oJ2lkZS1zdGF0dXMtamV0YnJhaW5zLWRpc2Nvbm5lY3RlZCcpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgIGtleTogJ2lkZS1zdGF0dXMtamV0YnJhaW5zLWRpc2Nvbm5lY3RlZCcsXG4gICAgICB0ZXh0OiAnSURFIHBsdWdpbiBub3QgY29ubmVjdGVkIMK3IC9zdGF0dXMgZm9yIGluZm8nLFxuICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgIH0pXG4gIH0sIFthZGROb3RpZmljYXRpb24sIHJlbW92ZU5vdGlmaWNhdGlvbiwgc2hvd0pldEJyYWluc0luZm9dKVxuXG4gIC8vIFNob3cgSURFIGluc3RhbGwgZXJyb3JcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIGlmICghc2hvd0lERUluc3RhbGxFcnJvcikge1xuICAgICAgcmVtb3ZlTm90aWZpY2F0aW9uKCdpZGUtc3RhdHVzLWluc3RhbGwtZXJyb3InKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICBrZXk6ICdpZGUtc3RhdHVzLWluc3RhbGwtZXJyb3InLFxuICAgICAgdGV4dDogJ0lERSBleHRlbnNpb24gaW5zdGFsbCBmYWlsZWQgKHNlZSAvc3RhdHVzIGZvciBpbmZvKScsXG4gICAgICBjb2xvcjogJ2Vycm9yJyxcbiAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICB9KVxuICB9LCBbYWRkTm90aWZpY2F0aW9uLCByZW1vdmVOb3RpZmljYXRpb24sIHNob3dJREVJbnN0YWxsRXJyb3JdKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUFJQyxTQUFTLEVBQUVDLE1BQU0sUUFBUSxPQUFPO0FBQ2hELFNBQVNDLGdCQUFnQixRQUFRLDhCQUE4QjtBQUMvRCxTQUFTQyxJQUFJLFFBQVEsWUFBWTtBQUNqQyxjQUFjQyxtQkFBbUIsUUFBUSwyQkFBMkI7QUFDcEUsU0FBU0MsZUFBZSxFQUFFQyxnQkFBZ0IsUUFBUSxxQkFBcUI7QUFDdkUsU0FDRUMsVUFBVSxFQUNWLEtBQUtDLDhCQUE4QixFQUNuQ0MsY0FBYyxFQUNkQyxtQkFBbUIsUUFDZCxrQkFBa0I7QUFDekIsU0FBU0MsZUFBZSxRQUFRLDBCQUEwQjtBQUMxRCxTQUFTQyxzQkFBc0IsUUFBUSw4QkFBOEI7QUFDckUsY0FBY0MsWUFBWSxRQUFRLHVCQUF1QjtBQUV6RCxNQUFNQyx1QkFBdUIsR0FBRyxDQUFDO0FBRWpDLEtBQUtDLEtBQUssR0FBRztFQUNYQyxxQkFBcUIsRUFBRVIsOEJBQThCLEdBQUcsSUFBSTtFQUM1RFMsWUFBWSxFQUFFSixZQUFZLEdBQUcsU0FBUztFQUN0Q0ssVUFBVSxFQUFFZCxtQkFBbUIsRUFBRTtBQUNuQyxDQUFDO0FBRUQsT0FBTyxTQUFBZSxzQkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUErQjtJQUFBTCxZQUFBO0lBQUFDLFVBQUE7SUFBQUY7RUFBQSxJQUFBSSxFQUk5QjtFQUNOO0lBQUFHLGVBQUE7SUFBQUM7RUFBQSxJQUFnRHRCLGdCQUFnQixDQUFDLENBQUM7RUFDbEU7SUFBQXVCLE1BQUEsRUFBQUMsU0FBQTtJQUFBQztFQUFBLElBQXVDZixzQkFBc0IsQ0FBQ00sVUFBVSxDQUFDO0VBQ3pFLE1BQUFVLGVBQUEsR0FBd0IzQixNQUFNLENBQUMsS0FBSyxDQUFDO0VBQUEsSUFBQTRCLEVBQUE7RUFBQSxJQUFBUixDQUFBLFFBQUFMLHFCQUFBO0lBRWpCYSxFQUFBLEdBQUFiLHFCQUFxQixHQUNyQ1AsY0FBYyxDQUFDTyxxQkFBcUIsRUFBQWMsT0FDaEMsQ0FBQyxHQUZXLEtBRVg7SUFBQVQsQ0FBQSxNQUFBTCxxQkFBQTtJQUFBSyxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUZULE1BQUFVLFdBQUEsR0FBb0JGLEVBRVg7RUFDVCxNQUFBRyxrQ0FBQSxHQUNFaEIscUJBQXFCLEVBQUFpQixLQUFzQixJQUEzQ0YsV0FBMkM7RUFFN0MsTUFBQUcsc0JBQUEsR0FDRVIsU0FBUyxLQUFLLFdBRXVDLEtBRHBEVCxZQUFZLEVBQUFrQixRQUN1QyxJQUFqRGxCLFlBQVksRUFBQW1CLElBQW9DLElBQTFCbkIsWUFBWSxDQUFBb0IsU0FBVSxHQUFHLENBQUc7RUFHdkQsTUFBQUMsbUJBQUEsR0FDRVosU0FBUyxLQUFLLFdBQXNDLElBQXBELENBQThCUSxzQkFBc0I7RUFFdEQsTUFBQUssbUJBQUEsR0FDRVAsa0NBQ1ksSUFEWixDQUNDRCxXQUNtQixJQUZwQixDQUVDTyxtQkFDc0IsSUFIdkIsQ0FHQ0osc0JBQXNCO0VBRXpCLE1BQUFNLGlCQUFBLEdBQ0VSLGtDQUNXLElBRFhELFdBRW9CLElBRnBCLENBRUNPLG1CQUNzQixJQUh2QixDQUdDSixzQkFBc0I7RUFBQSxJQUFBTyxFQUFBO0VBQUEsSUFBQUMsRUFBQTtFQUFBLElBQUFyQixDQUFBLFFBQUFFLGVBQUEsSUFBQUYsQ0FBQSxRQUFBSyxTQUFBLElBQUFMLENBQUEsUUFBQUcsa0JBQUEsSUFBQUgsQ0FBQSxRQUFBbUIsaUJBQUE7SUFJZkMsRUFBQSxHQUFBQSxDQUFBO01BQ1IsSUFBSTlCLGVBQWUsQ0FBQyxDQUFDO1FBQUE7TUFBQTtNQUNyQixJQUFJRCxtQkFBbUIsQ0FBdUIsQ0FBQyxJQUFsQmdCLFNBQVMsS0FBSyxJQUF5QixJQUFoRWMsaUJBQWdFO1FBQ2xFaEIsa0JBQWtCLENBQUMsaUJBQWlCLENBQUM7UUFBQTtNQUFBO01BSXZDLElBQ0VJLGVBQWUsQ0FBQWUsT0FDc0QsSUFEckUsQ0FDQ3RDLGVBQWUsQ0FBQyxDQUFDLENBQUF1QyxpQkFBdUIsSUFBeEMsQ0FBd0MsS0FBSzlCLHVCQUF1QjtRQUFBO01BQUE7TUFJdkUsTUFBQStCLFNBQUEsR0FBa0JDLFVBQVUsQ0FDMUJDLE1Bb0JDLEVBQ0QsSUFBSSxFQUNKbkIsZUFBZSxFQUNmTCxlQUNGLENBQUM7TUFBQSxPQUNNLE1BQU15QixZQUFZLENBQUNILFNBQVMsQ0FBQztJQUFBLENBQ3JDO0lBQUVILEVBQUEsSUFBQ25CLGVBQWUsRUFBRUMsa0JBQWtCLEVBQUVFLFNBQVMsRUFBRWMsaUJBQWlCLENBQUM7SUFBQW5CLENBQUEsTUFBQUUsZUFBQTtJQUFBRixDQUFBLE1BQUFLLFNBQUE7SUFBQUwsQ0FBQSxNQUFBRyxrQkFBQTtJQUFBSCxDQUFBLE1BQUFtQixpQkFBQTtJQUFBbkIsQ0FBQSxNQUFBb0IsRUFBQTtJQUFBcEIsQ0FBQSxNQUFBcUIsRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQXBCLENBQUE7SUFBQXFCLEVBQUEsR0FBQXJCLENBQUE7RUFBQTtFQXhDdEVyQixTQUFTLENBQUN5QyxFQXdDVCxFQUFFQyxFQUFtRSxDQUFDO0VBQUEsSUFBQU8sRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBN0IsQ0FBQSxRQUFBRSxlQUFBLElBQUFGLENBQUEsUUFBQU0sT0FBQSxJQUFBTixDQUFBLFNBQUFLLFNBQUEsSUFBQUwsQ0FBQSxTQUFBRyxrQkFBQSxJQUFBSCxDQUFBLFNBQUFrQixtQkFBQSxJQUFBbEIsQ0FBQSxTQUFBbUIsaUJBQUE7SUFHN0RTLEVBQUEsR0FBQUEsQ0FBQTtNQUNSLElBQUl0QyxlQUFlLENBQUMsQ0FBQztRQUFBO01BQUE7TUFDckIsSUFDRTRCLG1CQUNpQixJQURqQkMsaUJBRTRCLElBQTVCZCxTQUFTLEtBQUssY0FDTixJQUhSLENBR0NDLE9BQU87UUFFUkgsa0JBQWtCLENBQUMseUJBQXlCLENBQUM7UUFBQTtNQUFBO01BRy9DRCxlQUFlLENBQUM7UUFBQTRCLEdBQUEsRUFDVCx5QkFBeUI7UUFBQWYsSUFBQSxFQUN4QixHQUFHVCxPQUFPLGVBQWU7UUFBQXlCLEtBQUEsRUFDeEIsT0FBTztRQUFBQyxRQUFBLEVBQ0o7TUFDWixDQUFDLENBQUM7SUFBQSxDQUNIO0lBQUVILEVBQUEsSUFDRDNCLGVBQWUsRUFDZkMsa0JBQWtCLEVBQ2xCRSxTQUFTLEVBQ1RDLE9BQU8sRUFDUFksbUJBQW1CLEVBQ25CQyxpQkFBaUIsQ0FDbEI7SUFBQW5CLENBQUEsTUFBQUUsZUFBQTtJQUFBRixDQUFBLE1BQUFNLE9BQUE7SUFBQU4sQ0FBQSxPQUFBSyxTQUFBO0lBQUFMLENBQUEsT0FBQUcsa0JBQUE7SUFBQUgsQ0FBQSxPQUFBa0IsbUJBQUE7SUFBQWxCLENBQUEsT0FBQW1CLGlCQUFBO0lBQUFuQixDQUFBLE9BQUE0QixFQUFBO0lBQUE1QixDQUFBLE9BQUE2QixFQUFBO0VBQUE7SUFBQUQsRUFBQSxHQUFBNUIsQ0FBQTtJQUFBNkIsRUFBQSxHQUFBN0IsQ0FBQTtFQUFBO0VBeEJEckIsU0FBUyxDQUFDaUQsRUFpQlQsRUFBRUMsRUFPRixDQUFDO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBbEMsQ0FBQSxTQUFBRSxlQUFBLElBQUFGLENBQUEsU0FBQUcsa0JBQUEsSUFBQUgsQ0FBQSxTQUFBbUIsaUJBQUE7SUFHUWMsRUFBQSxHQUFBQSxDQUFBO01BQ1IsSUFBSTNDLGVBQWUsQ0FBQyxDQUFDO1FBQUE7TUFBQTtNQUNyQixJQUFJLENBQUM2QixpQkFBaUI7UUFDcEJoQixrQkFBa0IsQ0FBQyxtQ0FBbUMsQ0FBQztRQUFBO01BQUE7TUFHekRELGVBQWUsQ0FBQztRQUFBNEIsR0FBQSxFQUNULG1DQUFtQztRQUFBZixJQUFBLEVBQ2xDLGdEQUE2QztRQUFBaUIsUUFBQSxFQUN6QztNQUNaLENBQUMsQ0FBQztJQUFBLENBQ0g7SUFBRUUsRUFBQSxJQUFDaEMsZUFBZSxFQUFFQyxrQkFBa0IsRUFBRWdCLGlCQUFpQixDQUFDO0lBQUFuQixDQUFBLE9BQUFFLGVBQUE7SUFBQUYsQ0FBQSxPQUFBRyxrQkFBQTtJQUFBSCxDQUFBLE9BQUFtQixpQkFBQTtJQUFBbkIsQ0FBQSxPQUFBaUMsRUFBQTtJQUFBakMsQ0FBQSxPQUFBa0MsRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQWpDLENBQUE7SUFBQWtDLEVBQUEsR0FBQWxDLENBQUE7RUFBQTtFQVgzRHJCLFNBQVMsQ0FBQ3NELEVBV1QsRUFBRUMsRUFBd0QsQ0FBQztFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQXBDLENBQUEsU0FBQUUsZUFBQSxJQUFBRixDQUFBLFNBQUFHLGtCQUFBLElBQUFILENBQUEsU0FBQWtCLG1CQUFBO0lBR2xEaUIsRUFBQSxHQUFBQSxDQUFBO01BQ1IsSUFBSTdDLGVBQWUsQ0FBQyxDQUFDO1FBQUE7TUFBQTtNQUNyQixJQUFJLENBQUM0QixtQkFBbUI7UUFDdEJmLGtCQUFrQixDQUFDLDBCQUEwQixDQUFDO1FBQUE7TUFBQTtNQUdoREQsZUFBZSxDQUFDO1FBQUE0QixHQUFBLEVBQ1QsMEJBQTBCO1FBQUFmLElBQUEsRUFDekIscURBQXFEO1FBQUFnQixLQUFBLEVBQ3BELE9BQU87UUFBQUMsUUFBQSxFQUNKO01BQ1osQ0FBQyxDQUFDO0lBQUEsQ0FDSDtJQUFFSSxFQUFBLElBQUNsQyxlQUFlLEVBQUVDLGtCQUFrQixFQUFFZSxtQkFBbUIsQ0FBQztJQUFBbEIsQ0FBQSxPQUFBRSxlQUFBO0lBQUFGLENBQUEsT0FBQUcsa0JBQUE7SUFBQUgsQ0FBQSxPQUFBa0IsbUJBQUE7SUFBQWxCLENBQUEsT0FBQW1DLEVBQUE7SUFBQW5DLENBQUEsT0FBQW9DLEVBQUE7RUFBQTtJQUFBRCxFQUFBLEdBQUFuQyxDQUFBO0lBQUFvQyxFQUFBLEdBQUFwQyxDQUFBO0VBQUE7RUFaN0RyQixTQUFTLENBQUN3RCxFQVlULEVBQUVDLEVBQTBELENBQUM7QUFBQTtBQXRJekQsU0FBQVYsT0FBQVcsaUJBQUEsRUFBQUMsaUJBQUE7RUFxRE1wRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUFxRCxJQUFLLENBQUNDLEtBQUE7SUFDekIsTUFBQUMsU0FBQSxHQUFnQkQsS0FBSyxHQUFTLEVBQUFFLElBQUE7SUFDOUIsSUFBSUQsU0FBbUMsSUFBbkMsQ0FBWWxDLGlCQUFlLENBQUFlLE9BQVE7TUFDckNmLGlCQUFlLENBQUFlLE9BQUEsR0FBVyxJQUFIO01BQ3ZCckMsZ0JBQWdCLENBQUMwRCxLQUdmLENBQUM7TUFDSHpDLGlCQUFlLENBQUM7UUFBQTRCLEdBQUEsRUFDVCxpQkFBaUI7UUFBQWMsR0FBQSxFQUVwQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsU0FDSixDQUFDLElBQUksQ0FBTyxLQUFLLENBQUwsS0FBSyxDQUFFdEMsVUFBTSxDQUFFLEVBQTFCLElBQUksQ0FDaEIsRUFGQyxJQUFJLENBRUU7UUFBQTBCLFFBQUEsRUFFQztNQUNaLENBQUMsQ0FBQztJQUFBO0VBQ0gsQ0FDRixDQUFDO0FBQUE7QUF2RUgsU0FBQVcsTUFBQXJCLE9BQUE7RUFBQSxPQXlEa0M7SUFBQSxHQUN4QkEsT0FBTztJQUFBQyxpQkFBQSxFQUNTLENBQUNELE9BQU8sQ0FBQUMsaUJBQXVCLElBQTlCLENBQThCLElBQUk7RUFDeEQsQ0FBQztBQUFBIiwiaWdub3JlTGlzdCI6W119