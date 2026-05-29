// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getAgentName、getTeammateColor、getTeamName 工具函数，把通用处理留在 ../../utils/teammate.js 中维护。
import { getAgentName, getTeammateColor, getTeamName } from '../../utils/teammate.js';
// 引入 Spinner，将 ../Spinner.js 中已经封装好的能力接到本文件流程里。
import { Spinner } from '../Spinner.js';
// 引入 WorkerBadge，将 ./WorkerBadge.js 中已经封装好的能力接到本文件流程里。
import { WorkerBadge } from './WorkerBadge.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  toolName: string;
  description: string;
};

/**
 * Visual indicator shown on workers while waiting for leader to approve a permission request.
 * Displays the pending tool with a spinner and information about what's being requested.
 */
// WorkerPendingPermission 封装权限确认界面的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function WorkerPendingPermission(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(15);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    toolName,
    description
  } = t0;
  // t1 暂存 `getTeamName()` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `getTeamName()` 生成的渲染片段，后续返回路径直接复用。
    t1 = getTeamName();
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // teamName沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const teamName = t1;
  // t2 暂存 `getAgentName()` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getAgentName()` 生成的渲染片段，后续返回路径直接复用。
    t2 = getAgentName();
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // agentName保存`t2`，作为后续临时缓存值处理的输入。
  const agentName = t2;
  // t3 暂存 `getTeammateColor()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `getTeammateColor()` 生成的渲染片段，后续返回路径直接复用。
    t3 = getTeammateColor();
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // agentColor 命名 `t3`，让后续代码直接表达这个值的用途。
  const agentColor = t3;
  // t4 暂存 `<Box marginBottom={1}><Spinner /><Text color="warning" bo...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 暂存 `agentName && agentColor && <Box marginBottom={1}><WorkerB...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `<Box marginBottom={1}><Spinner /><Text color="warning" bo...` 生成的渲染片段，后续返回路径直接复用。
    t4 = <Box marginBottom={1}><Spinner /><Text color="warning" bold={true}>{" "}Waiting for team lead approval</Text></Box>;
    // t5 暂存 `agentName && agentColor && <Box marginBottom={1}><WorkerB...` 生成的渲染片段，后续返回路径直接复用。
    t5 = agentName && agentColor && <Box marginBottom={1}><WorkerBadge name={agentName} color={agentColor} /></Box>;
    // $[3] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t4;
    // $[4] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t5;
  } else {
    // t4 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[3];
    // t5 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[4];
  }
  // t6 暂存 `<Text dimColor={true}>Tool: </Text>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Text dimColor={true}>Tool: </Text>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Text dimColor={true}>Tool: </Text>;
    // $[5] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[5];
  }
  // t7 暂存 `<Box>{t6}<Text>{toolName}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== toolName) {
    // t7 暂存 `<Box>{t6}<Text>{toolName}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t7 = <Box>{t6}<Text>{toolName}</Text></Box>;
    // $[6] 缓存 `toolName`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = toolName;
    // $[7] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[7];
  }
  // t8 暂存 `<Text dimColor={true}>Action: </Text>` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t8 暂存 `<Text dimColor={true}>Action: </Text>` 生成的渲染片段，后续返回路径直接复用。
    t8 = <Text dimColor={true}>Action: </Text>;
    // $[8] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[8];
  }
  // t9 暂存 `<Box>{t8}<Text>{description}</Text></Box>` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== description) {
    // t9 暂存 `<Box>{t8}<Text>{description}</Text></Box>` 生成的渲染片段，后续返回路径直接复用。
    t9 = <Box>{t8}<Text>{description}</Text></Box>;
    // $[9] 缓存 `description`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = description;
    // $[10] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t9;
  } else {
    // t9 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[10];
  }
  // t10 暂存 `teamName && <Box marginTop={1}><Text dimColor={true}>Perm...` 的派生结果，便于缓存命中时直接复用。
  let t10;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
    // t10 暂存 `teamName && <Box marginTop={1}><Text dimColor={true}>Perm...` 生成的渲染片段，后续返回路径直接复用。
    t10 = teamName && <Box marginTop={1}><Text dimColor={true}>Permission request sent to team {"\""}{teamName}{"\""} leader</Text></Box>;
    // $[11] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t10;
  } else {
    // t10 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[11];
  }
  // t11 暂存 `<Box flexDirection="column" borderStyle="round" borderCol...` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[12] !== t7 || $[13] !== t9) {
    // t11 暂存 `<Box flexDirection="column" borderStyle="round" borderCol...` 生成的渲染片段，后续返回路径直接复用。
    t11 = <Box flexDirection="column" borderStyle="round" borderColor="warning" paddingX={1}>{t4}{t5}{t7}{t9}{t10}</Box>;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
    // $[13] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t9;
    // $[14] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[14];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsIkJveCIsIlRleHQiLCJnZXRBZ2VudE5hbWUiLCJnZXRUZWFtbWF0ZUNvbG9yIiwiZ2V0VGVhbU5hbWUiLCJTcGlubmVyIiwiV29ya2VyQmFkZ2UiLCJQcm9wcyIsInRvb2xOYW1lIiwiZGVzY3JpcHRpb24iLCJXb3JrZXJQZW5kaW5nUGVybWlzc2lvbiIsInQwIiwiJCIsIl9jIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJ0ZWFtTmFtZSIsInQyIiwiYWdlbnROYW1lIiwidDMiLCJhZ2VudENvbG9yIiwidDQiLCJ0NSIsInQ2IiwidDciLCJ0OCIsInQ5IiwidDEwIiwidDExIl0sInNvdXJjZXMiOlsiV29ya2VyUGVuZGluZ1Blcm1pc3Npb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0QWdlbnROYW1lLFxuICBnZXRUZWFtbWF0ZUNvbG9yLFxuICBnZXRUZWFtTmFtZSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvdGVhbW1hdGUuanMnXG5pbXBvcnQgeyBTcGlubmVyIH0gZnJvbSAnLi4vU3Bpbm5lci5qcydcbmltcG9ydCB7IFdvcmtlckJhZGdlIH0gZnJvbSAnLi9Xb3JrZXJCYWRnZS5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgdG9vbE5hbWU6IHN0cmluZ1xuICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbi8qKlxuICogVmlzdWFsIGluZGljYXRvciBzaG93biBvbiB3b3JrZXJzIHdoaWxlIHdhaXRpbmcgZm9yIGxlYWRlciB0byBhcHByb3ZlIGEgcGVybWlzc2lvbiByZXF1ZXN0LlxuICogRGlzcGxheXMgdGhlIHBlbmRpbmcgdG9vbCB3aXRoIGEgc3Bpbm5lciBhbmQgaW5mb3JtYXRpb24gYWJvdXQgd2hhdCdzIGJlaW5nIHJlcXVlc3RlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFdvcmtlclBlbmRpbmdQZXJtaXNzaW9uKHtcbiAgdG9vbE5hbWUsXG4gIGRlc2NyaXB0aW9uLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCB0ZWFtTmFtZSA9IGdldFRlYW1OYW1lKClcbiAgY29uc3QgYWdlbnROYW1lID0gZ2V0QWdlbnROYW1lKClcbiAgY29uc3QgYWdlbnRDb2xvciA9IGdldFRlYW1tYXRlQ29sb3IoKVxuXG4gIHJldHVybiAoXG4gICAgPEJveFxuICAgICAgZmxleERpcmVjdGlvbj1cImNvbHVtblwiXG4gICAgICBib3JkZXJTdHlsZT1cInJvdW5kXCJcbiAgICAgIGJvcmRlckNvbG9yPVwid2FybmluZ1wiXG4gICAgICBwYWRkaW5nWD17MX1cbiAgICA+XG4gICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgIDxTcGlubmVyIC8+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwid2FybmluZ1wiIGJvbGQ+XG4gICAgICAgICAgeycgJ31cbiAgICAgICAgICBXYWl0aW5nIGZvciB0ZWFtIGxlYWQgYXBwcm92YWxcbiAgICAgICAgPC9UZXh0PlxuICAgICAgPC9Cb3g+XG5cbiAgICAgIHthZ2VudE5hbWUgJiYgYWdlbnRDb2xvciAmJiAoXG4gICAgICAgIDxCb3ggbWFyZ2luQm90dG9tPXsxfT5cbiAgICAgICAgICA8V29ya2VyQmFkZ2UgbmFtZT17YWdlbnROYW1lfSBjb2xvcj17YWdlbnRDb2xvcn0gLz5cbiAgICAgICAgPC9Cb3g+XG4gICAgICApfVxuXG4gICAgICA8Qm94PlxuICAgICAgICA8VGV4dCBkaW1Db2xvcj5Ub29sOiA8L1RleHQ+XG4gICAgICAgIDxUZXh0Pnt0b29sTmFtZX08L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAgPEJveD5cbiAgICAgICAgPFRleHQgZGltQ29sb3I+QWN0aW9uOiA8L1RleHQ+XG4gICAgICAgIDxUZXh0PntkZXNjcmlwdGlvbn08L1RleHQ+XG4gICAgICA8L0JveD5cblxuICAgICAge3RlYW1OYW1lICYmIChcbiAgICAgICAgPEJveCBtYXJnaW5Ub3A9ezF9PlxuICAgICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgICAgUGVybWlzc2lvbiByZXF1ZXN0IHNlbnQgdG8gdGVhbSB7J1wiJ31cbiAgICAgICAgICAgIHt0ZWFtTmFtZX1cbiAgICAgICAgICAgIHsnXCInfSBsZWFkZXJcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvQm94PlxuICAgICAgKX1cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxHQUFHLEVBQUVDLElBQUksUUFBUSxjQUFjO0FBQ3hDLFNBQ0VDLFlBQVksRUFDWkMsZ0JBQWdCLEVBQ2hCQyxXQUFXLFFBQ04seUJBQXlCO0FBQ2hDLFNBQVNDLE9BQU8sUUFBUSxlQUFlO0FBQ3ZDLFNBQVNDLFdBQVcsUUFBUSxrQkFBa0I7QUFFOUMsS0FBS0MsS0FBSyxHQUFHO0VBQ1hDLFFBQVEsRUFBRSxNQUFNO0VBQ2hCQyxXQUFXLEVBQUUsTUFBTTtBQUNyQixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTyxTQUFBQyx3QkFBQUMsRUFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFpQztJQUFBTCxRQUFBO0lBQUFDO0VBQUEsSUFBQUUsRUFHaEM7RUFBQSxJQUFBRyxFQUFBO0VBQUEsSUFBQUYsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFDV0YsRUFBQSxHQUFBVixXQUFXLENBQUMsQ0FBQztJQUFBUSxDQUFBLE1BQUFFLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFGLENBQUE7RUFBQTtFQUE5QixNQUFBSyxRQUFBLEdBQWlCSCxFQUFhO0VBQUEsSUFBQUksRUFBQTtFQUFBLElBQUFOLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBQ1pFLEVBQUEsR0FBQWhCLFlBQVksQ0FBQyxDQUFDO0lBQUFVLENBQUEsTUFBQU0sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQU4sQ0FBQTtFQUFBO0VBQWhDLE1BQUFPLFNBQUEsR0FBa0JELEVBQWM7RUFBQSxJQUFBRSxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFDYkksRUFBQSxHQUFBakIsZ0JBQWdCLENBQUMsQ0FBQztJQUFBUyxDQUFBLE1BQUFRLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFSLENBQUE7RUFBQTtFQUFyQyxNQUFBUyxVQUFBLEdBQW1CRCxFQUFrQjtFQUFBLElBQUFFLEVBQUE7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQVgsQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFTakNNLEVBQUEsSUFBQyxHQUFHLENBQWUsWUFBQyxDQUFELEdBQUMsQ0FDbEIsQ0FBQyxPQUFPLEdBQ1IsQ0FBQyxJQUFJLENBQU8sS0FBUyxDQUFULFNBQVMsQ0FBQyxJQUFJLENBQUosS0FBRyxDQUFDLENBQ3ZCLElBQUUsQ0FBRSw4QkFFUCxFQUhDLElBQUksQ0FJUCxFQU5DLEdBQUcsQ0FNRTtJQUVMQyxFQUFBLEdBQUFKLFNBQXVCLElBQXZCRSxVQUlBLElBSEMsQ0FBQyxHQUFHLENBQWUsWUFBQyxDQUFELEdBQUMsQ0FDbEIsQ0FBQyxXQUFXLENBQU9GLElBQVMsQ0FBVEEsVUFBUSxDQUFDLENBQVNFLEtBQVUsQ0FBVkEsV0FBUyxDQUFDLEdBQ2pELEVBRkMsR0FBRyxDQUdMO0lBQUFULENBQUEsTUFBQVUsRUFBQTtJQUFBVixDQUFBLE1BQUFXLEVBQUE7RUFBQTtJQUFBRCxFQUFBLEdBQUFWLENBQUE7SUFBQVcsRUFBQSxHQUFBWCxDQUFBO0VBQUE7RUFBQSxJQUFBWSxFQUFBO0VBQUEsSUFBQVosQ0FBQSxRQUFBRyxNQUFBLENBQUFDLEdBQUE7SUFHQ1EsRUFBQSxJQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQUMsTUFBTSxFQUFwQixJQUFJLENBQXVCO0lBQUFaLENBQUEsTUFBQVksRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVosQ0FBQTtFQUFBO0VBQUEsSUFBQWEsRUFBQTtFQUFBLElBQUFiLENBQUEsUUFBQUosUUFBQTtJQUQ5QmlCLEVBQUEsSUFBQyxHQUFHLENBQ0YsQ0FBQUQsRUFBMkIsQ0FDM0IsQ0FBQyxJQUFJLENBQUVoQixTQUFPLENBQUUsRUFBZixJQUFJLENBQ1AsRUFIQyxHQUFHLENBR0U7SUFBQUksQ0FBQSxNQUFBSixRQUFBO0lBQUFJLENBQUEsTUFBQWEsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQWIsQ0FBQTtFQUFBO0VBQUEsSUFBQWMsRUFBQTtFQUFBLElBQUFkLENBQUEsUUFBQUcsTUFBQSxDQUFBQyxHQUFBO0lBR0pVLEVBQUEsSUFBQyxJQUFJLENBQUMsUUFBUSxDQUFSLEtBQU8sQ0FBQyxDQUFDLFFBQVEsRUFBdEIsSUFBSSxDQUF5QjtJQUFBZCxDQUFBLE1BQUFjLEVBQUE7RUFBQTtJQUFBQSxFQUFBLEdBQUFkLENBQUE7RUFBQTtFQUFBLElBQUFlLEVBQUE7RUFBQSxJQUFBZixDQUFBLFFBQUFILFdBQUE7SUFEaENrQixFQUFBLElBQUMsR0FBRyxDQUNGLENBQUFELEVBQTZCLENBQzdCLENBQUMsSUFBSSxDQUFFakIsWUFBVSxDQUFFLEVBQWxCLElBQUksQ0FDUCxFQUhDLEdBQUcsQ0FHRTtJQUFBRyxDQUFBLE1BQUFILFdBQUE7SUFBQUcsQ0FBQSxPQUFBZSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBZixDQUFBO0VBQUE7RUFBQSxJQUFBZ0IsR0FBQTtFQUFBLElBQUFoQixDQUFBLFNBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUVMWSxHQUFBLEdBQUFYLFFBUUEsSUFQQyxDQUFDLEdBQUcsQ0FBWSxTQUFDLENBQUQsR0FBQyxDQUNmLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FBQyxnQ0FDb0IsS0FBRSxDQUNsQ0EsU0FBTyxDQUNQLEtBQUUsQ0FBRSxPQUNQLEVBSkMsSUFBSSxDQUtQLEVBTkMsR0FBRyxDQU9MO0lBQUFMLENBQUEsT0FBQWdCLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFoQixDQUFBO0VBQUE7RUFBQSxJQUFBaUIsR0FBQTtFQUFBLElBQUFqQixDQUFBLFNBQUFhLEVBQUEsSUFBQWIsQ0FBQSxTQUFBZSxFQUFBO0lBdENIRSxHQUFBLElBQUMsR0FBRyxDQUNZLGFBQVEsQ0FBUixRQUFRLENBQ1YsV0FBTyxDQUFQLE9BQU8sQ0FDUCxXQUFTLENBQVQsU0FBUyxDQUNYLFFBQUMsQ0FBRCxHQUFDLENBRVgsQ0FBQVAsRUFNSyxDQUVKLENBQUFDLEVBSUQsQ0FFQSxDQUFBRSxFQUdLLENBRUwsQ0FBQUUsRUFHSyxDQUVKLENBQUFDLEdBUUQsQ0FDRixFQXZDQyxHQUFHLENBdUNFO0lBQUFoQixDQUFBLE9BQUFhLEVBQUE7SUFBQWIsQ0FBQSxPQUFBZSxFQUFBO0lBQUFmLENBQUEsT0FBQWlCLEdBQUE7RUFBQTtJQUFBQSxHQUFBLEdBQUFqQixDQUFBO0VBQUE7RUFBQSxPQXZDTmlCLEdBdUNNO0FBQUEiLCJpZ25vcmVMaXN0IjpbXX0=