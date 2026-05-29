// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useMemo } from 'react';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// 引入 useNotifications，将 ../../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../../context/notifications.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 引入 useAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState } from '../../state/AppState.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js';
// 复用 plural 工具函数，把通用处理留在 ../../utils/stringUtils.js 中维护。
import { plural } from '../../utils/stringUtils.js';
// usePluginInstallationStatus 封装usePluginInstallationStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePluginInstallationStatus() {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(20);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // installationStatus 集合保存`useAppState`，供React hook后续处理使用。
  const installationStatus = useAppState(_temp);
  // t0 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t0;
  // React hook use Plugin Installation ...在这里处理 `bb0: {`，完成这一小步状态转换。
  bb0: {
    // installationStatus 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
    if (!installationStatus) {
      // t1 暂存 `{` 的派生结果，便于缓存命中时直接复用。
      let t1;
      // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        // t1 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
        t1 = {
          totalFailed: 0,
          failedMarketplacesCount: 0,
          failedPluginsCount: 0
        };
        // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
        $[0] = t1;
      } else {
        // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
        t1 = $[0];
      }
      // t0 暂存 `t1` 生成的渲染片段，后续返回路径直接复用。
      t0 = t1;
      // 结束这个分支或循环，避免React hook 状态流继续落入后续路径。
      break bb0;
    }
    // t1 暂存 `installationStatus.marketplaces.filter(_temp2)` 的派生结果，便于缓存命中时直接复用。
    let t1;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== installationStatus.marketplaces) {
      // t1 暂存 `installationStatus.marketplaces.filter(_temp2)` 生成的渲染片段，后续返回路径直接复用。
      t1 = installationStatus.marketplaces.filter(_temp2);
      // $[1] 缓存 `installationStatus.marketplaces`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = installationStatus.marketplaces;
      // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t1;
    } else {
      // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t1 = $[2];
    }
    // failedMarketplaces 市场数据 命名 `t1`，让后续代码直接表达这个值的用途。
    const failedMarketplaces = t1;
    // t2 暂存 `installationStatus.plugins.filter(_temp3)` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[3] !== installationStatus.plugins) {
      // t2 暂存 `installationStatus.plugins.filter(_temp3)` 生成的渲染片段，后续返回路径直接复用。
      t2 = installationStatus.plugins.filter(_temp3);
      // $[3] 缓存 `installationStatus.plugins`，下次依赖未变时 React 编译产物可直接复用。
      $[3] = installationStatus.plugins;
      // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[4] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[4];
    }
    // failedPlugins 插件数据沿用 `t2` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
    const failedPlugins = t2;
    // 临时值 t3 命名 `failedMarketplaces.length + failedPlugins.length`，让后续代码直接表达这个值的用途。
    const t3 = failedMarketplaces.length + failedPlugins.length;
    // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
    let t4;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[5] !== failedMarketplaces.length || $[6] !== failedPlugins.length || $[7] !== t3) {
      // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
      t4 = {
        totalFailed: t3,
        failedMarketplacesCount: failedMarketplaces.length,
        failedPluginsCount: failedPlugins.length
      };
      // $[5] 缓存 `failedMarketplaces.length`，下次依赖未变时 React 编译产物可直接复用。
      $[5] = failedMarketplaces.length;
      // $[6] 缓存 `failedPlugins.length`，下次依赖未变时 React 编译产物可直接复用。
      $[6] = failedPlugins.length;
      // $[7] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
      $[7] = t3;
      // $[8] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
      $[8] = t4;
    } else {
      // t4 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
      t4 = $[8];
    }
    // t0 暂存 `t4` 生成的渲染片段，后续返回路径直接复用。
    t0 = t4;
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    totalFailed,
    failedMarketplacesCount,
    failedPluginsCount
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== addNotification || $[10] !== failedMarketplacesCount || $[11] !== failedPluginsCount || $[12] !== installationStatus || $[13] !== totalFailed) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Plugin Installation ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // installationStatus 集合缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!installationStatus) {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging("No installation status to monitor");
        // React hook use Plugin Installation ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `totalFailed === 0` 时，React hook执行该分支。
      if (totalFailed === 0) {
        // React hook use Plugin Installation ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Plugin installation status: ${failedMarketplacesCount} failed marketplaces, ${failedPluginsCount} failed plugins`);
      // 满足 `totalFailed === 0` 时，React hook执行该分支。
      if (totalFailed === 0) {
        // React hook use Plugin Installation ...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Adding notification for ${totalFailed} failed installations`);
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: "plugin-install-failed",
        jsx: <><Text color="error">{totalFailed} {plural(totalFailed, "plugin")} failed to install</Text><Text dimColor={true}> · /plugin for details</Text></>,
        priority: "medium"
      });
    };
    // $[9] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = addNotification;
    // $[10] 缓存 `failedMarketplacesCount`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = failedMarketplacesCount;
    // $[11] 缓存 `failedPluginsCount`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = failedPluginsCount;
    // $[12] 缓存 `installationStatus`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = installationStatus;
    // $[13] 缓存 `totalFailed`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = totalFailed;
    // $[14] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[14] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[14];
  }
  // t2 暂存 `[addNotification, totalFailed, failedMarketplacesCount, f...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[15] !== addNotification || $[16] !== failedMarketplacesCount || $[17] !== failedPluginsCount || $[18] !== totalFailed) {
    // t2 暂存 `[addNotification, totalFailed, failedMarketplacesCount, f...` 生成的渲染片段，后续返回路径直接复用。
    t2 = [addNotification, totalFailed, failedMarketplacesCount, failedPluginsCount];
    // $[15] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = addNotification;
    // $[16] 缓存 `failedMarketplacesCount`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = failedMarketplacesCount;
    // $[17] 缓存 `failedPluginsCount`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = failedPluginsCount;
    // $[18] 缓存 `totalFailed`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = totalFailed;
    // $[19] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[19] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[19];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t1, t2);
}
// _temp3 封装usePluginInstallationStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(p) {
  // 返回 `p.status === "failed"`，作为React hook 状态流这次计算的结果。
  return p.status === "failed";
}
// _temp2 封装usePluginInstallationStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(m) {
  // 返回 `m.status === "failed"`，作为React hook 状态流这次计算的结果。
  return m.status === "failed";
}
// _temp 封装usePluginInstallationStatus的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.plugins.installationStatus`，作为React hook 状态流这次计算的结果。
  return s.plugins.installationStatus;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJnZXRJc1JlbW90ZU1vZGUiLCJ1c2VOb3RpZmljYXRpb25zIiwiVGV4dCIsInVzZUFwcFN0YXRlIiwibG9nRm9yRGVidWdnaW5nIiwicGx1cmFsIiwidXNlUGx1Z2luSW5zdGFsbGF0aW9uU3RhdHVzIiwiJCIsIl9jIiwiYWRkTm90aWZpY2F0aW9uIiwiaW5zdGFsbGF0aW9uU3RhdHVzIiwiX3RlbXAiLCJ0MCIsImJiMCIsInQxIiwiU3ltYm9sIiwiZm9yIiwidG90YWxGYWlsZWQiLCJmYWlsZWRNYXJrZXRwbGFjZXNDb3VudCIsImZhaWxlZFBsdWdpbnNDb3VudCIsIm1hcmtldHBsYWNlcyIsImZpbHRlciIsIl90ZW1wMiIsImZhaWxlZE1hcmtldHBsYWNlcyIsInQyIiwicGx1Z2lucyIsIl90ZW1wMyIsImZhaWxlZFBsdWdpbnMiLCJ0MyIsImxlbmd0aCIsInQ0Iiwia2V5IiwianN4IiwicHJpb3JpdHkiLCJwIiwic3RhdHVzIiwibSIsInMiXSwic291cmNlcyI6WyJ1c2VQbHVnaW5JbnN0YWxsYXRpb25TdGF0dXMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlRWZmZWN0LCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBnZXRJc1JlbW90ZU1vZGUgfSBmcm9tICcuLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5pbXBvcnQgeyB1c2VOb3RpZmljYXRpb25zIH0gZnJvbSAnLi4vLi4vY29udGV4dC9ub3RpZmljYXRpb25zLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlIH0gZnJvbSAnLi4vLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQgeyBsb2dGb3JEZWJ1Z2dpbmcgfSBmcm9tICcuLi8uLi91dGlscy9kZWJ1Zy5qcydcbmltcG9ydCB7IHBsdXJhbCB9IGZyb20gJy4uLy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlUGx1Z2luSW5zdGFsbGF0aW9uU3RhdHVzKCk6IHZvaWQge1xuICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiB9ID0gdXNlTm90aWZpY2F0aW9ucygpXG4gIGNvbnN0IGluc3RhbGxhdGlvblN0YXR1cyA9IHVzZUFwcFN0YXRlKHMgPT4gcy5wbHVnaW5zLmluc3RhbGxhdGlvblN0YXR1cylcblxuICAvLyBNZW1vaXplIHRoZSBmYWlsZWQgY291bnRzIHRvIHByZXZlbnQgdW5uZWNlc3NhcnkgZWZmZWN0IHRyaWdnZXJzXG4gIGNvbnN0IHsgdG90YWxGYWlsZWQsIGZhaWxlZE1hcmtldHBsYWNlc0NvdW50LCBmYWlsZWRQbHVnaW5zQ291bnQgfSA9XG4gICAgdXNlTWVtbygoKSA9PiB7XG4gICAgICBpZiAoIWluc3RhbGxhdGlvblN0YXR1cykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvdGFsRmFpbGVkOiAwLFxuICAgICAgICAgIGZhaWxlZE1hcmtldHBsYWNlc0NvdW50OiAwLFxuICAgICAgICAgIGZhaWxlZFBsdWdpbnNDb3VudDogMCxcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBmYWlsZWRNYXJrZXRwbGFjZXMgPSBpbnN0YWxsYXRpb25TdGF0dXMubWFya2V0cGxhY2VzLmZpbHRlcihcbiAgICAgICAgbSA9PiBtLnN0YXR1cyA9PT0gJ2ZhaWxlZCcsXG4gICAgICApXG4gICAgICBjb25zdCBmYWlsZWRQbHVnaW5zID0gaW5zdGFsbGF0aW9uU3RhdHVzLnBsdWdpbnMuZmlsdGVyKFxuICAgICAgICBwID0+IHAuc3RhdHVzID09PSAnZmFpbGVkJyxcbiAgICAgIClcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG90YWxGYWlsZWQ6IGZhaWxlZE1hcmtldHBsYWNlcy5sZW5ndGggKyBmYWlsZWRQbHVnaW5zLmxlbmd0aCxcbiAgICAgICAgZmFpbGVkTWFya2V0cGxhY2VzQ291bnQ6IGZhaWxlZE1hcmtldHBsYWNlcy5sZW5ndGgsXG4gICAgICAgIGZhaWxlZFBsdWdpbnNDb3VudDogZmFpbGVkUGx1Z2lucy5sZW5ndGgsXG4gICAgICB9XG4gICAgfSwgW2luc3RhbGxhdGlvblN0YXR1c10pXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIGlmICghaW5zdGFsbGF0aW9uU3RhdHVzKSB7XG4gICAgICBsb2dGb3JEZWJ1Z2dpbmcoJ05vIGluc3RhbGxhdGlvbiBzdGF0dXMgdG8gbW9uaXRvcicpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAodG90YWxGYWlsZWQgPT09IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgIGBQbHVnaW4gaW5zdGFsbGF0aW9uIHN0YXR1czogJHtmYWlsZWRNYXJrZXRwbGFjZXNDb3VudH0gZmFpbGVkIG1hcmtldHBsYWNlcywgJHtmYWlsZWRQbHVnaW5zQ291bnR9IGZhaWxlZCBwbHVnaW5zYCxcbiAgICApXG5cbiAgICBpZiAodG90YWxGYWlsZWQgPT09IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIEFkZCBub3RpZmljYXRpb24gZm9yIGZhaWx1cmVzXG4gICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgYEFkZGluZyBub3RpZmljYXRpb24gZm9yICR7dG90YWxGYWlsZWR9IGZhaWxlZCBpbnN0YWxsYXRpb25zYCxcbiAgICApXG4gICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgIGtleTogJ3BsdWdpbi1pbnN0YWxsLWZhaWxlZCcsXG4gICAgICBqc3g6IChcbiAgICAgICAgPD5cbiAgICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCI+XG4gICAgICAgICAgICB7dG90YWxGYWlsZWR9IHtwbHVyYWwodG90YWxGYWlsZWQsICdwbHVnaW4nKX0gZmFpbGVkIHRvIGluc3RhbGxcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgPFRleHQgZGltQ29sb3I+IMK3IC9wbHVnaW4gZm9yIGRldGFpbHM8L1RleHQ+XG4gICAgICAgIDwvPlxuICAgICAgKSxcbiAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICB9KVxuICB9LCBbXG4gICAgYWRkTm90aWZpY2F0aW9uLFxuICAgIHRvdGFsRmFpbGVkLFxuICAgIGZhaWxlZE1hcmtldHBsYWNlc0NvdW50LFxuICAgIGZhaWxlZFBsdWdpbnNDb3VudCxcbiAgXSlcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxPQUFPLFFBQVEsT0FBTztBQUMxQyxTQUFTQyxlQUFlLFFBQVEsMEJBQTBCO0FBQzFELFNBQVNDLGdCQUFnQixRQUFRLGdDQUFnQztBQUNqRSxTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUFTQyxXQUFXLFFBQVEseUJBQXlCO0FBQ3JELFNBQVNDLGVBQWUsUUFBUSxzQkFBc0I7QUFDdEQsU0FBU0MsTUFBTSxRQUFRLDRCQUE0QjtBQUVuRCxPQUFPLFNBQUFDLDRCQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0w7SUFBQUM7RUFBQSxJQUE0QlIsZ0JBQWdCLENBQUMsQ0FBQztFQUM5QyxNQUFBUyxrQkFBQSxHQUEyQlAsV0FBVyxDQUFDUSxLQUFpQyxDQUFDO0VBQUEsSUFBQUMsRUFBQTtFQUFBQyxHQUFBO0lBS3JFLElBQUksQ0FBQ0gsa0JBQWtCO01BQUEsSUFBQUksRUFBQTtNQUFBLElBQUFQLENBQUEsUUFBQVEsTUFBQSxDQUFBQyxHQUFBO1FBQ2RGLEVBQUE7VUFBQUcsV0FBQSxFQUNRLENBQUM7VUFBQUMsdUJBQUEsRUFDVyxDQUFDO1VBQUFDLGtCQUFBLEVBQ047UUFDdEIsQ0FBQztRQUFBWixDQUFBLE1BQUFPLEVBQUE7TUFBQTtRQUFBQSxFQUFBLEdBQUFQLENBQUE7TUFBQTtNQUpESyxFQUFBLEdB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