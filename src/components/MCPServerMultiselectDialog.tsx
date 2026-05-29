// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 partition，将 lodash-es/partition.js 中已经封装好的能力接到本文件流程里。
import partition from 'lodash-es/partition.js';
// 引入 React、useCallback，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback } from 'react';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 getSettings_DEPRECATED、updateSettingsForSource 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getSettings_DEPRECATED, updateSettingsForSource } from '../utils/settings/settings.js';
// 引入 ConfigurableShortcutHint，将 ./ConfigurableShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { ConfigurableShortcutHint } from './ConfigurableShortcutHint.js';
// 引入 SelectMulti，将 ./CustomSelect/SelectMulti.js 中已经封装好的能力接到本文件流程里。
import { SelectMulti } from './CustomSelect/SelectMulti.js';
// 引入 Byline，将 ./design-system/Byline.js 中已经封装好的能力接到本文件流程里。
import { Byline } from './design-system/Byline.js';
// 引入 Dialog，将 ./design-system/Dialog.js 中已经封装好的能力接到本文件流程里。
import { Dialog } from './design-system/Dialog.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// 引入 MCPServerDialogCopy，将 ./MCPServerDialogCopy.js 中已经封装好的能力接到本文件流程里。
import { MCPServerDialogCopy } from './MCPServerDialogCopy.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  serverNames: string[];
  onDone(): void;
};
// MCPServerMultiselectDialog 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function MCPServerMultiselectDialog(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(21);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    serverNames,
    onDone
  } = t0;
  // t1 暂存 `function onSubmit(selectedServers) {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== onDone || $[1] !== serverNames) {
    // t1 暂存 `function onSubmit(selectedServers) {` 生成的渲染片段，后续返回路径直接复用。
    t1 = function onSubmit(selectedServers) {
      // currentSettings 集合读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
      const currentSettings = getSettings_DEPRECATED() || {};
      // enabledServers 集合标记终端 UI MCPServer Multiselec...是否启用对应路径。
      const enabledServers = currentSettings.enabledMcpjsonServers || [];
      // disabledServers 集合标记终端 UI MCPServer Multiselec...是否启用对应路径。
      const disabledServers = currentSettings.disabledMcpjsonServers || [];
      // 这个回调绑定到 const [approvedServers, rejectedServers] = partition(serverNames, server => selected…，负责终端渲染在该局部场景下的响应。
      const [approvedServers, rejectedServers] = partition(serverNames, server => selectedServers.includes(server));
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logEvent("tengu_mcp_multidialog_choice", {
        approved: approvedServers.length,
        rejected: rejectedServers.length
      });
      // 满足 `approvedServers.length > 0` 时，终端渲染执行该分支。
      if (approvedServers.length > 0) {
        // newEnabledServers 集合保存`Set`，供终端渲染后续处理使用。
        const newEnabledServers = [...new Set([...enabledServers, ...approvedServers])];
        // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
        updateSettingsForSource("localSettings", {
          enabledMcpjsonServers: newEnabledServers
        });
      }
      // 满足 `rejectedServers.length > 0` 时，终端渲染执行该分支。
      if (rejectedServers.length > 0) {
        // newDisabledServers 集合保存`Set`，供终端渲染后续处理使用。
        const newDisabledServers = [...new Set([...disabledServers, ...rejectedServers])];
        // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
        updateSettingsForSource("localSettings", {
          disabledMcpjsonServers: newDisabledServers
        });
      }
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[0] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = onDone;
    // $[1] 缓存 `serverNames`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = serverNames;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // onSubmit 命名 `t1`，让后续代码直接表达这个值的用途。
  const onSubmit = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onDone || $[4] !== serverNames) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // currentSettings_0读取`getSettings_DEPRECATED`，供终端渲染后续处理使用。
      const currentSettings_0 = getSettings_DEPRECATED() || {};
      // disabledServers_0标记终端 UI MCPServer Multiselec...是否启用对应路径。
      const disabledServers_0 = currentSettings_0.disabledMcpjsonServers || [];
      // newDisabledServers_0保存`Set`，供终端渲染后续处理使用。
      const newDisabledServers_0 = [...new Set([...disabledServers_0, ...serverNames])];
      // 调用 updateSettingsForSource，触发终端渲染此处需要的副作用。
      updateSettingsForSource("localSettings", {
        disabledMcpjsonServers: newDisabledServers_0
      });
      // 调用 onDone，触发终端渲染此处需要的副作用。
      onDone();
    };
    // $[3] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onDone;
    // $[4] 缓存 `serverNames`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = serverNames;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // handleEscRejectAll保存`t2`，作为后续临时缓存值处理的输入。
  const handleEscRejectAll = t2;
  // 临时值 t3 命名 ``${serverNames.length} new MCP servers found in .mcp.json``，让后续代码直接表达这个值的用途。
  const t3 = `${serverNames.length} new MCP servers found in .mcp.json`;
  // t4 暂存 `<MCPServerDialogCopy />` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<MCPServerDialogCopy />` 生成的渲染片段，后续返回路径直接复用。
    t4 = <MCPServerDialogCopy />;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `serverNames.map(_temp)` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== serverNames) {
    // t5 暂存 `serverNames.map(_temp)` 生成的渲染片段，后续返回路径直接复用。
    t5 = serverNames.map(_temp);
    // $[7] 缓存 `serverNames`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = serverNames;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[8];
  }
  // t6 暂存 `<SelectMulti options={t5} defaultValue={serverNames} onSu...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== handleEscRejectAll || $[10] !== onSubmit || $[11] !== serverNames || $[12] !== t5) {
    // t6 暂存 `<SelectMulti options={t5} defaultValue={serverNames} onSu...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <SelectMulti options={t5} defaultValue={serverNames} onSubmit={onSubmit} onCancel={handleEscRejectAll} hideIndexes={true} />;
    // $[9] 缓存 `handleEscRejectAll`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = handleEscRejectAll;
    // $[10] 缓存 `onSubmit`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = onSubmit;
    // $[11] 缓存 `serverNames`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = serverNames;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
    // $[13] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[13];
  }
  // t7 暂存 `<Dialog title={t3} subtitle="Select any you wish to enabl...` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[14] !== handleEscRejectAll || $[15] !== t3 || $[16] !== t6) {
    // t7 暂存 `<Dialog title={t3} subtitle="Select any you wish to enabl...` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Dialog title={t3} subtitle="Select any you wish to enable." color="warning" onCancel={handleEscRejectAll} hideInputGuide={true}>{t4}{t6}</Dialog>;
    // $[14] 缓存 `handleEscRejectAll`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = handleEscRejectAll;
    // $[15] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t3;
    // $[16] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t6;
    // $[17] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[17];
  }
  // t8 暂存 `<Box paddingX={1}><Text dimColor={true} italic={true}><By...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Box paddingX={1}><Text dimColor={true} italic={true}><By...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Box paddingX={1}><Text dimColor={true} italic={true}><Byline><KeyboardShortcutHint shortcut="Space" action="select" /><KeyboardShortcutHint shortcut="Enter" action="confirm" /><ConfigurableShortcutHint action="confirm:no" context="Confirmation" fallback="Esc" description="reject all" /></Byline></Text></Box>;
    // $[18] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[18];
  }
  // t9 暂存 `<>{t7}{t8}</>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== t7) {
    // t9 暂存 `<>{t7}{t8}</>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <>{t7}{t8}</>;
    // $[19] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t7;
    // $[20] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[20];
  }
  // 返回 `t9`，作为终端渲染这次计算的结果。
  return t9;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(server_0) {
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    label: server_0,
    value: server_0
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwYXJ0aXRpb24iLCJSZWFjdCIsInVzZUNhbGxiYWNrIiwibG9nRXZlbnQiLCJCb3giLCJUZXh0IiwiZ2V0U2V0dGluZ3NfREVQUkVDQVRFRCIsInVwZGF0ZVNldHRpbmdzRm9yU291cmNlIiwiQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50IiwiU2VsZWN0TXVsdGkiLCJCeWxpbmUiLCJEaWFsb2ciLCJLZXlib2FyZFNob3J0Y3V0SGludCIsIk1DUFNlcnZlckRpYWxvZ0NvcHkiLCJQcm9wcyIsInNlcnZlck5hbWVzIiwib25Eb25lIiwiTUNQU2VydmVyTXVsdGlzZWxlY3REaWFsb2ciLCJ0MCIsIiQiLCJfYyIsInQxIiwib25TdWJtaXQiLCJzZWxlY3RlZFNlcnZlcnMiLCJjdXJyZW50U2V0dGluZ3MiLCJlbmFibGVkU2VydmVycyIsImVuYWJsZWRNY3Bqc29uU2VydmVycyIsImRpc2FibGVkU2VydmVycyIsImRpc2FibGVkTWNwanNvblNlcnZlcnMiLCJhcHByb3ZlZFNlcnZlcnMiLCJyZWplY3RlZFNlcnZlcnMiLCJzZXJ2ZXIiLCJpbmNsdWRlcyIsImFwcHJvdmVkIiwibGVuZ3RoIiwicmVqZWN0ZWQiLCJuZXdFbmFibGVkU2VydmVycyIsIlNldCIsIm5ld0Rpc2FibGVkU2VydmVycyIsInQyIiwiY3VycmVudFNldHRpbmdzXzAiLCJkaXNhYmxlZFNlcnZlcnNfMCIsIm5ld0Rpc2FibGVkU2VydmVyc18wIiwiaGFuZGxlRXNjUmVqZWN0QWxsIiwidDMiLCJ0NCIsIlN5bWJvbCIsImZvciIsInQ1IiwibWFwIiwiX3RlbXAiLCJ0NiIsInQ3IiwidDgiLCJ0OSIsInNlcnZlcl8wIiwibGFiZWwiLCJ2YWx1ZSJdLCJzb3VyY2VzIjpbIk1DUFNlcnZlck11bHRpc2VsZWN0RGlhbG9nLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGFydGl0aW9uIGZyb20gJ2xvZGFzaC1lcy9wYXJ0aXRpb24uanMnXG5pbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2sgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IGxvZ0V2ZW50IH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7XG4gIGdldFNldHRpbmdzX0RFUFJFQ0FURUQsXG4gIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlLFxufSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcbmltcG9ydCB7IENvbmZpZ3VyYWJsZVNob3J0Y3V0SGludCB9IGZyb20gJy4vQ29uZmlndXJhYmxlU2hvcnRjdXRIaW50LmpzJ1xuaW1wb3J0IHsgU2VsZWN0TXVsdGkgfSBmcm9tICcuL0N1c3RvbVNlbGVjdC9TZWxlY3RNdWx0aS5qcydcbmltcG9ydCB7IEJ5bGluZSB9IGZyb20gJy4vZGVzaWduLXN5c3RlbS9CeWxpbmUuanMnXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vRGlhbG9nLmpzJ1xuaW1wb3J0IHsgS2V5Ym9hcmRTaG9ydGN1dEhpbnQgfSBmcm9tICcuL2Rlc2lnbi1zeXN0ZW0vS2V5Ym9hcmRTaG9ydGN1dEhpbnQuanMnXG5pbXBvcnQgeyBNQ1BTZXJ2ZXJEaWFsb2dDb3B5IH0gZnJvbSAnLi9NQ1BTZXJ2ZXJEaWFsb2dDb3B5LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBzZXJ2ZXJOYW1lczogc3RyaW5nW11cbiAgb25Eb25lKCk6IHZvaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE1DUFNlcnZlck11bHRpc2VsZWN0RGlhbG9nKHtcbiAgc2VydmVyTmFtZXMsXG4gIG9uRG9uZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgZnVuY3Rpb24gb25TdWJtaXQoc2VsZWN0ZWRTZXJ2ZXJzOiBzdHJpbmdbXSkge1xuICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5ncyA9IGdldFNldHRpbmdzX0RFUFJFQ0FURUQoKSB8fCB7fVxuICAgIGNvbnN0IGVuYWJsZWRTZXJ2ZXJzID0gY3VycmVudFNldHRpbmdzLmVuYWJsZWRNY3Bqc29uU2VydmVycyB8fCBbXVxuICAgIGNvbnN0IGRpc2FibGVkU2VydmVycyA9IGN1cnJlbnRTZXR0aW5ncy5kaXNhYmxlZE1jcGpzb25TZXJ2ZXJzIHx8IFtdXG5cbiAgICAvLyBVc2UgcGFydGl0aW9uIHRvIHNlcGFyYXRlIGFwcHJvdmVkIGFuZCByZWplY3RlZCBzZXJ2ZXJzXG4gICAgY29uc3QgW2FwcHJvdmVkU2VydmVycywgcmVqZWN0ZWRTZXJ2ZXJzXSA9IHBhcnRpdGlvbihzZXJ2ZXJOYW1lcywgc2VydmVyID0+XG4gICAgICBzZWxlY3RlZFNlcnZlcnMuaW5jbHVkZXMoc2VydmVyKSxcbiAgICApXG5cbiAgICBsb2dFdmVudCgndGVuZ3VfbWNwX211bHRpZGlhbG9nX2Nob2ljZScsIHtcbiAgICAgIGFwcHJvdmVkOiBhcHByb3ZlZFNlcnZlcnMubGVuZ3RoLFxuICAgICAgcmVqZWN0ZWQ6IHJlamVjdGVkU2VydmVycy5sZW5ndGgsXG4gICAgfSlcblxuICAgIC8vIFVwZGF0ZSBzZXR0aW5ncyB3aXRoIGFwcHJvdmVkIHNlcnZlcnNcbiAgICBpZiAoYXBwcm92ZWRTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IG5ld0VuYWJsZWRTZXJ2ZXJzID0gW1xuICAgICAgICAuLi5uZXcgU2V0KFsuLi5lbmFibGVkU2VydmVycywgLi4uYXBwcm92ZWRTZXJ2ZXJzXSksXG4gICAgICBdXG4gICAgICB1cGRhdGVTZXR0aW5nc0ZvclNvdXJjZSgnbG9jYWxTZXR0aW5ncycsIHtcbiAgICAgICAgZW5hYmxlZE1jcGpzb25TZXJ2ZXJzOiBuZXdFbmFibGVkU2VydmVycyxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHNldHRpbmdzIHdpdGggcmVqZWN0ZWQgc2VydmVyc1xuICAgIGlmIChyZWplY3RlZFNlcnZlcnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbmV3RGlzYWJsZWRTZXJ2ZXJzID0gW1xuICAgICAgICAuLi5uZXcgU2V0KFsuLi5kaXNhYmxlZFNlcnZlcnMsIC4uLnJlamVjdGVkU2VydmVyc10pLFxuICAgICAgXVxuICAgICAgdXBkYXRlU2V0dGluZ3NGb3JTb3VyY2UoJ2xvY2FsU2V0dGluZ3MnLCB7XG4gICAgICAgIGRpc2FibGVkTWNwanNvblNlcnZlcnM6IG5ld0Rpc2FibGVkU2VydmVycyxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgb25Eb25lKClcbiAgfVxuXG4gIC8vIEhhbmRsZSBFU0MgdG8gcmVqZWN0IGFsbCBzZXJ2ZXJzXG4gIGNvbnN0IGhhbmRsZUVzY1JlamVjdEFsbCA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSBnZXRTZXR0aW5nc19ERVBSRUNBVEVEKCkgfHwge31cbiAgICBjb25zdCBkaXNhYmxlZFNlcnZlcnMgPSBjdXJyZW50U2V0dGluZ3MuZGlzYWJsZWRNY3Bqc29uU2VydmVycyB8fCBbXVxuXG4gICAgY29uc3QgbmV3RGlzYWJsZWRTZXJ2ZXJzID0gW1xuICAgICAgLi4ubmV3IFNldChbLi4uZGlzYWJsZWRTZXJ2ZXJzLCAuLi5zZXJ2ZXJOYW1lc10pLFxuICAgIF1cblxuICAgIHVwZGF0ZVNldHRpbmdzRm9yU291cmNlKCdsb2NhbFNldHRpbmdzJywge1xuICAgICAgZGlzYWJsZWRNY3Bqc29uU2VydmVyczogbmV3RGlzYWJsZWRTZXJ2ZXJzLFxuICAgIH0pXG5cbiAgICBvbkRvbmUoKVxuICB9LCBbc2VydmVyTmFtZXMsIG9uRG9uZV0pXG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPERpYWxvZ1xuICAgICAgICB0aXRsZT17YCR7c2VydmVyTmFtZXMubGVuZ3RofSBuZXcgTUNQIHNlcnZlcnMgZm91bmQgaW4gLm1jcC5qc29uYH1cbiAgICAgICAgc3VidGl0bGU9XCJTZWxlY3QgYW55IHlvdSB3aXNoIHRvIGVuYWJsZS5cIlxuICAgICAgICBjb2xvcj1cIndhcm5pbmdcIlxuICAgICAgICBvbkNhbmNlbD17aGFuZGxlRXNjUmVqZWN0QWxsfVxuICAgICAgICBoaWRlSW5wdXRHdWlkZVxuICAgICAgPlxuICAgICAgICA8TUNQU2VydmVyRGlhbG9nQ29weSAvPlxuXG4gICAgICAgIDxTZWxlY3RNdWx0aVxuICAgICAgICAgIG9wdGlvbnM9e3NlcnZlck5hbWVzLm1hcChzZXJ2ZXIgPT4gKHtcbiAgICAgICAgICAgIGxhYmVsOiBzZXJ2ZXIsXG4gICAgICAgICAgICB2YWx1ZTogc2VydmVyLFxuICAgICAgICAgIH0pKX1cbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NlcnZlck5hbWVzfVxuICAgICAgICAgIG9uU3VibWl0PXtvblN1Ym1pdH1cbiAgICAgICAgICBvbkNhbmNlbD17aGFuZGxlRXNjUmVqZWN0QWxsfVxuICAgICAgICAgIGhpZGVJbmRleGVzXG4gICAgICAgIC8+XG4gICAgICA8L0RpYWxvZz5cbiAgICAgIDxCb3ggcGFkZGluZ1g9ezF9PlxuICAgICAgICA8VGV4dCBkaW1Db2xvciBpdGFsaWM+XG4gICAgICAgICAgPEJ5bGluZT5cbiAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIlNwYWNlXCIgYWN0aW9uPVwic2VsZWN0XCIgLz5cbiAgICAgICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD1cIkVudGVyXCIgYWN0aW9uPVwiY29uZmlybVwiIC8+XG4gICAgICAgICAgICA8Q29uZmlndXJhYmxlU2hvcnRjdXRIaW50XG4gICAgICAgICAgICAgIGFjdGlvbj1cImNvbmZpcm06bm9cIlxuICAgICAgICAgICAgICBjb250ZXh0PVwiQ29uZmlybWF0aW9uXCJcbiAgICAgICAgICAgICAgZmFsbGJhY2s9XCJFc2NcIlxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbj1cInJlamVjdCBhbGxcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L0J5bGluZT5cbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG4gICAgPC8+XG4gIClcbn1cbiJd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