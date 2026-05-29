// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// 引入 useNotifications，将 ../../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../../context/notifications.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js';
// 复用 onPluginsAutoUpdated 工具函数，把通用处理留在 ../../utils/plugins/pluginAutoupdate.js 中维护。
import { onPluginsAutoUpdated } from '../../utils/plugins/pluginAutoupdate.js';

/**
 * Hook that displays a notification when plugins have been auto-updated.
 * The notification tells the user to run /reload-plugins to apply the updates.
 */
// usePluginAutoupdateNotification 封装usePluginAutoupdateNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePluginAutoupdateNotification() {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // t0 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t0 = [];
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // updatedPlugins 插件数据 由 React state 持有，setUpdatedPlugins 会在用户操作或异步结果返回时触发刷新。
  const [updatedPlugins, setUpdatedPlugins] = useState(t0);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Plugin Autoupdate No...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // unsubscribe保存`onPluginsAutoUpdated`，供React hook后续处理使用。
      const unsubscribe = onPluginsAutoUpdated(plugins => {
        // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`Plugin autoupdate notification: ${plugins.length} plugin(s) updated`);
        // setUpdatedPlugins 写入新的状态值，使React hook 状态流后续读取保持一致。
        setUpdatedPlugins(plugins);
      });
      // 返回 `unsubscribe`，作为React hook 状态流这次计算的结果。
      return unsubscribe;
    };
    // t2 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [];
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
    // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
    // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[2];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t1, t2);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== addNotification || $[4] !== updatedPlugins) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Plugin Autoupdate No...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // updatedPlugins 插件数据为空时立即返回或跳过，避免React hook 状态流把空集合当成可处理内容。
      if (updatedPlugins.length === 0) {
        // React hook use Plugin Autoupdate No...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // pluginNames 插件数据派生`updatedPlugins.map`，供React hook后续处理使用。
      const pluginNames = updatedPlugins.map(_temp);
      // displayNames 集合格式化`pluginNames.join`，供React hook后续处理使用。
      const displayNames = pluginNames.length <= 2 ? pluginNames.join(" and ") : `${pluginNames.length} plugins`;
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: "plugin-autoupdate-restart",
        jsx: <><Text color="success">{pluginNames.length === 1 ? "Plugin" : "Plugins"} updated:{" "}{displayNames}</Text><Text dimColor={true}> · Run /reload-plugins to apply</Text></>,
        priority: "low",
        timeoutMs: 10000
      });
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Showing plugin autoupdate notification for: ${pluginNames.join(", ")}`);
    };
    // t4 暂存 `[updatedPlugins, addNotification]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [updatedPlugins, addNotification];
    // $[3] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = addNotification;
    // $[4] 缓存 `updatedPlugins`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = updatedPlugins;
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t3, t4);
}
// _temp 封装usePluginAutoupdateNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(id) {
  // atIndex 索引保存`id.indexOf`，供React hook后续处理使用。
  const atIndex = id.indexOf("@");
  // 返回 `atIndex > 0 ? id.substring(0, atIndex) : id`，作为React hook 状态流这次计算的结果。
  return atIndex > 0 ? id.substring(0, atIndex) : id;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiZ2V0SXNSZW1vdGVNb2RlIiwidXNlTm90aWZpY2F0aW9ucyIsIlRleHQiLCJsb2dGb3JEZWJ1Z2dpbmciLCJvblBsdWdpbnNBdXRvVXBkYXRlZCIsInVzZVBsdWdpbkF1dG91cGRhdGVOb3RpZmljYXRpb24iLCIkIiwiX2MiLCJhZGROb3RpZmljYXRpb24iLCJ0MCIsIlN5bWJvbCIsImZvciIsInVwZGF0ZWRQbHVnaW5zIiwic2V0VXBkYXRlZFBsdWdpbnMiLCJ0MSIsInQyIiwidW5zdWJzY3JpYmUiLCJwbHVnaW5zIiwibGVuZ3RoIiwidDMiLCJ0NCIsInBsdWdpbk5hbWVzIiwibWFwIiwiX3RlbXAiLCJkaXNwbGF5TmFtZXMiLCJqb2luIiwia2V5IiwianN4IiwicHJpb3JpdHkiLCJ0aW1lb3V0TXMiLCJpZCIsImF0SW5kZXgiLCJpbmRleE9mIiwic3Vic3RyaW5nIl0sInNvdXJjZXMiOlsidXNlUGx1Z2luQXV0b3VwZGF0ZU5vdGlmaWNhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBnZXRJc1JlbW90ZU1vZGUgfSBmcm9tICcuLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5pbXBvcnQgeyB1c2VOb3RpZmljYXRpb25zIH0gZnJvbSAnLi4vLi4vY29udGV4dC9ub3RpZmljYXRpb25zLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uLy4uL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHsgb25QbHVnaW5zQXV0b1VwZGF0ZWQgfSBmcm9tICcuLi8uLi91dGlscy9wbHVnaW5zL3BsdWdpbkF1dG91cGRhdGUuanMnXG5cbi8qKlxuICogSG9vayB0aGF0IGRpc3BsYXlzIGEgbm90aWZpY2F0aW9uIHdoZW4gcGx1Z2lucyBoYXZlIGJlZW4gYXV0by11cGRhdGVkLlxuICogVGhlIG5vdGlmaWNhdGlvbiB0ZWxscyB0aGUgdXNlciB0byBydW4gL3JlbG9hZC1wbHVnaW5zIHRvIGFwcGx5IHRoZSB1cGRhdGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlUGx1Z2luQXV0b3VwZGF0ZU5vdGlmaWNhdGlvbigpOiB2b2lkIHtcbiAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IHVzZU5vdGlmaWNhdGlvbnMoKVxuICBjb25zdCBbdXBkYXRlZFBsdWdpbnMsIHNldFVwZGF0ZWRQbHVnaW5zXSA9IHVzZVN0YXRlPHN0cmluZ1tdPihbXSlcblxuICAvLyBSZWdpc3RlciBmb3IgYXV0b3VwZGF0ZSBub3RpZmljYXRpb25zXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBjb25zdCB1bnN1YnNjcmliZSA9IG9uUGx1Z2luc0F1dG9VcGRhdGVkKHBsdWdpbnMgPT4ge1xuICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICBgUGx1Z2luIGF1dG91cGRhdGUgbm90aWZpY2F0aW9uOiAke3BsdWdpbnMubGVuZ3RofSBwbHVnaW4ocykgdXBkYXRlZGAsXG4gICAgICApXG4gICAgICBzZXRVcGRhdGVkUGx1Z2lucyhwbHVnaW5zKVxuICAgIH0pXG5cbiAgICByZXR1cm4gdW5zdWJzY3JpYmVcbiAgfSwgW10pXG5cbiAgLy8gU2hvdyBub3RpZmljYXRpb24gd2hlbiBwbHVnaW5zIGFyZSB1cGRhdGVkXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBpZiAodXBkYXRlZFBsdWdpbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IHBsdWdpbiBuYW1lcyBmcm9tIHBsdWdpbiBJRHMgKGZvcm1hdDogXCJuYW1lQG1hcmtldHBsYWNlXCIpXG4gICAgY29uc3QgcGx1Z2luTmFtZXMgPSB1cGRhdGVkUGx1Z2lucy5tYXAoaWQgPT4ge1xuICAgICAgY29uc3QgYXRJbmRleCA9IGlkLmluZGV4T2YoJ0AnKVxuICAgICAgcmV0dXJuIGF0SW5kZXggPiAwID8gaWQuc3Vic3RyaW5nKDAsIGF0SW5kZXgpIDogaWRcbiAgICB9KVxuXG4gICAgY29uc3QgZGlzcGxheU5hbWVzID1cbiAgICAgIHBsdWdpbk5hbWVzLmxlbmd0aCA8PSAyXG4gICAgICAgID8gcGx1Z2luTmFtZXMuam9pbignIGFuZCAnKVxuICAgICAgICA6IGAke3BsdWdpbk5hbWVzLmxlbmd0aH0gcGx1Z2luc2BcblxuICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICBrZXk6ICdwbHVnaW4tYXV0b3VwZGF0ZS1yZXN0YXJ0JyxcbiAgICAgIGpzeDogKFxuICAgICAgICA8PlxuICAgICAgICAgIDxUZXh0IGNvbG9yPVwic3VjY2Vzc1wiPlxuICAgICAgICAgICAge3BsdWdpbk5hbWVzLmxlbmd0aCA9PT0gMSA/ICdQbHVnaW4nIDogJ1BsdWdpbnMnfSB1cGRhdGVkOnsnICd9XG4gICAgICAgICAgICB7ZGlzcGxheU5hbWVzfVxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gwrcgUnVuIC9yZWxvYWQtcGx1Z2lucyB0byBhcHBseTwvVGV4dD5cbiAgICAgICAgPC8+XG4gICAgICApLFxuICAgICAgcHJpb3JpdHk6ICdsb3cnLFxuICAgICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICB9KVxuXG4gICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgYFNob3dpbmcgcGx1Z2luIGF1dG91cGRhdGUgbm90aWZpY2F0aW9uIGZvcjogJHtwbHVnaW5OYW1lcy5qb2luKCcsICcpfWAsXG4gICAgKVxuICB9LCBbdXBkYXRlZFBsdWdpbnMsIGFkZE5vdGlmaWNhdGlvbl0pXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtB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