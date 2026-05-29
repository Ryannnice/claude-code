// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts';
// 引入 getIsRemoteMode、getIsScrollDraining，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode, getIsScrollDraining } from '../../bootstrap/state.js';
// 引入 useNotifications，将 ../../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../../context/notifications.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 接入 getInitializationStatus、getLspServerManager 服务层能力，把外部通信或共享状态交给 ../../services/lsp/manager.js 处理。
import { getInitializationStatus, getLspServerManager } from '../../services/lsp/manager.js';
// 引入 useSetAppState，将 ../../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useSetAppState } from '../../state/AppState.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// LSP_POLL_INTERVAL_MS 集合保存`5000`，供React hook use Lsp In...后续判断或输出使用。
const LSP_POLL_INTERVAL_MS = 5000;

/**
 * Hook that polls LSP status and shows a notification when:
 * 1. Manager initialization fails
 * 2. Any LSP server enters an error state
 *
 * Also adds errors to appState.plugins.errors for /doctor display.
 *
 * Only active when ENABLE_LSP_TOOL is set.
 */
// useLspInitializationNotification 封装useLspInitializationNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useLspInitializationNotification() {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState();
  // 从 `React.useState(_temp)` 按位置拆出 shouldPoll、setShouldPoll，让React hook use Lsp Initialization N...分别处理这些返回值。
  const [shouldPoll, setShouldPoll] = React.useState(_temp);
  // t0 暂存 `new Set()` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `new Set()` 生成的渲染片段，后续返回路径直接复用。
    t0 = new Set();
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // notifiedErrorsRef 引用保存`React.useRef`，供React hook后续处理使用。
  const notifiedErrorsRef = React.useRef(t0);
  // t1 暂存 `(source, errorMessage) => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[1] !== addNotification || $[2] !== setAppState) {
    // t1 暂存 `(source, errorMessage) => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = (source, errorMessage) => {
      // errorKey 错误信息保存``${source}:${errorMessage}``，作为后续固定文本处理的输入。
      const errorKey = `${source}:${errorMessage}`;
      // 满足 `notifiedErrorsRef.current.has(errorKey)` 时，React hook执行该分支。
      if (notifiedErrorsRef.current.has(errorKey)) {
        // React hook use Lsp Initialization N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 notifiedErrorsRef.current.add，触发React hook此处需要的副作用。
      notifiedErrorsRef.current.add(errorKey);
      // 记录React hook 状态流运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`LSP error: ${source} - ${errorMessage}`);
      // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
      setAppState(prev => {
        // existingKeys 集合保存`Set`，供React hook后续处理使用。
        const existingKeys = new Set(prev.plugins.errors.map(_temp2));
        // stateErrorKey 状态固定为 ``generic-error:${source}:${errorMessage}``，作为React hook use Lsp In...后续展示或比较的基准。
        const stateErrorKey = `generic-error:${source}:${errorMessage}`;
        // 满足 `existingKeys.has(stateErrorKey)` 时，React hook执行该分支。
        if (existingKeys.has(stateErrorKey)) {
          // 返回 `prev`，作为React hook 状态流这次计算的结果。
          return prev;
        }
        // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
        return {
          ...prev,
          plugins: {
            ...prev.plugins,
            errors: [...prev.plugins.errors, {
              type: "generic-error" as const,
              source,
              error: errorMessage
            }]
          }
        };
      });
      // displayName保存`source.startsWith`，供React hook后续处理使用。
      const displayName = source.startsWith("plugin:") ? source.split(":")[1] ?? source : source;
      // 调用 addNotification，触发React hook此处需要的副作用。
      addNotification({
        key: `lsp-error-${source}`,
        jsx: <><Text color="error">LSP for {displayName} failed</Text><Text dimColor={true}> · /plugin for details</Text></>,
        priority: "medium",
        timeoutMs: 8000
      });
    };
    // $[1] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = addNotification;
    // $[2] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = setAppState;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
  }
  // addError 错误信息沿用 `t1` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const addError = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== addError) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Lsp Initialization N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `getIsScrollDraining()` 时，React hook执行该分支。
      if (getIsScrollDraining()) {
        // React hook use Lsp Initialization N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // status 集合读取`getInitializationStatus`，供React hook后续处理使用。
      const status = getInitializationStatus();
      // 当 `status.status` 匹配 `"failed"` 时，React hook执行对应分支。
      if (status.status === "failed") {
        // 调用 addError，触发React hook此处需要的副作用。
        addError("lsp-manager", status.error.message);
        // setShouldPoll 写入新的状态值，使React hook 状态流后续读取保持一致。
        setShouldPoll(false);
        // React hook use Lsp Initialization N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 组合条件 `status.status === "pending" || status.status ===` 成立时，React hook 状态流才启用这条专门路径。
      if (status.status === "pending" || status.status === "not-started") {
        // React hook use Lsp Initialization N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // manager读取`getLspServerManager`，供React hook后续处理使用。
      const manager = getLspServerManager();
      // 满足 `manager` 时，React hook执行该分支。
      if (manager) {
        // servers 集合读取`manager.getAllServers`，供React hook后续处理使用。
        const servers = manager.getAllServers();
        // 循环处理 `const [serverName, server] of servers`，让React hook 状态流逐项把同类条目按顺序走完。
        for (const [serverName, server] of servers) {
          // 组合条件 `server.state === "error" && server.lastError` 成立时，React hook 状态流才启用这条专门路径。
          if (server.state === "error" && server.lastError) {
            // 调用 addError，触发React hook此处需要的副作用。
            addError(serverName, server.lastError.message);
          }
        }
      }
    };
    // $[4] 缓存 `addError`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = addError;
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // poll保存`t2`，作为后续临时缓存值处理的输入。
  const poll = t2;
  // 调用 useInterval，触发React hook此处需要的副作用。
  useInterval(poll, shouldPoll ? LSP_POLL_INTERVAL_MS : null);
  // t3 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // t4 暂存 `[poll, shouldPoll]` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== poll || $[7] !== shouldPoll) {
    // t3 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = () => {
      // 组合条件 `getIsRemoteMode() || !shouldPoll` 成立时，React hook 状态流才启用这条专门路径。
      if (getIsRemoteMode() || !shouldPoll) {
        // React hook use Lsp Initialization N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 poll，触发React hook此处需要的副作用。
      poll();
    };
    // t4 暂存 `[poll, shouldPoll]` 生成的渲染片段，后续返回路径直接复用。
    t4 = [poll, shouldPoll];
    // $[6] 缓存 `poll`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = poll;
    // $[7] 缓存 `shouldPoll`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = shouldPoll;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // 调用 React.useEffect，触发React hook此处需要的副作用。
  React.useEffect(t3, t4);
}
// _temp2 封装useLspInitializationNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(e) {
  // 当 `e.type` 匹配 `"generic-error"` 时，React hook执行对应分支。
  if (e.type === "generic-error") {
    // 返回 ``generic-error:${e.source}:${e.error}``，作为React hook 状态流这次计算的结果。
    return `generic-error:${e.source}:${e.error}`;
  }
  // 返回 ``${e.type}:${e.source}``，作为React hook 状态流这次计算的结果。
  return `${e.type}:${e.source}`;
}
// _temp 封装useLspInitializationNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `isEnvTruthy("true")`，作为React hook 状态流这次计算的结果。
  return isEnvTruthy("true");
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUludGVydmFsIiwiZ2V0SXNSZW1vdGVNb2RlIiwiZ2V0SXNTY3JvbGxEcmFpbmluZyIsInVzZU5vdGlmaWNhdGlvbnMiLCJUZXh0IiwiZ2V0SW5pdGlhbGl6YXRpb25TdGF0dXMiLCJnZXRMc3BTZXJ2ZXJNYW5hZ2VyIiwidXNlU2V0QXBwU3RhdGUiLCJsb2dGb3JEZWJ1Z2dpbmciLCJpc0VudlRydXRoeSIsIkxTUF9QT0xMX0lOVEVSVkFMX01TIiwidXNlTHNwSW5pdGlhbGl6YXRpb25Ob3RpZmljYXRpb24iLCIkIiwiX2MiLCJhZGROb3RpZmljYXRpb24iLCJzZXRBcHBTdGF0ZSIsInNob3VsZFBvbGwiLCJzZXRTaG91bGRQb2xsIiwidXNlU3RhdGUiLCJfdGVtcCIsInQwIiwiU3ltYm9sIiwiZm9yIiwiU2V0Iiwibm90aWZpZWRFcnJvcnNSZWYiLCJ1c2VSZWYiLCJ0MSIsInNvdXJjZSIsImVycm9yTWVzc2FnZSIsImVycm9yS2V5IiwiY3VycmVudCIsImhhcyIsImFkZCIsInByZXYiLCJleGlzdGluZ0tleXMiLCJwbHVnaW5zIiwiZXJyb3JzIiwibWFwIiwiX3RlbXAyIiwic3RhdGVFcnJvcktleSIsInR5cGUiLCJjb25zdCIsImVycm9yIiwiZGlzcGxheU5hbWUiLCJzdGFydHNXaXRoIiwic3BsaXQiLCJrZXkiLCJqc3giLCJwcmlvcml0eSIsInRpbWVvdXRNcyIsImFkZEVycm9yIiwidDIiLCJzdGF0dXMiLCJtZXNzYWdlIiwibWFuYWdlciIsInNlcnZlcnMiLCJnZXRBbGxTZXJ2ZXJzIiwic2VydmVyTmFtZSIsInNlcnZlciIsInN0YXRlIiwibGFzdEVycm9yIiwicG9sbCIsInQzIiwidDQiLCJ1c2VFZmZlY3QiLCJlIl0sInNvdXJjZXMiOlsidXNlTHNwSW5pdGlhbGl6YXRpb25Ob3RpZmljYXRpb24udHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlSW50ZXJ2YWwgfSBmcm9tICd1c2Vob29rcy10cydcbmltcG9ydCB7IGdldElzUmVtb3RlTW9kZSwgZ2V0SXNTY3JvbGxEcmFpbmluZyB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcbmltcG9ydCB7IHVzZU5vdGlmaWNhdGlvbnMgfSBmcm9tICcuLi8uLi9jb250ZXh0L25vdGlmaWNhdGlvbnMuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0SW5pdGlhbGl6YXRpb25TdGF0dXMsXG4gIGdldExzcFNlcnZlck1hbmFnZXIsXG59IGZyb20gJy4uLy4uL3NlcnZpY2VzL2xzcC9tYW5hZ2VyLmpzJ1xuaW1wb3J0IHsgdXNlU2V0QXBwU3RhdGUgfSBmcm9tICcuLi8uLi9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uLy4uL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHsgaXNFbnZUcnV0aHkgfSBmcm9tICcuLi8uLi91dGlscy9lbnZVdGlscy5qcydcblxuY29uc3QgTFNQX1BPTExfSU5URVJWQUxfTVMgPSA1MDAwXG5cbi8qKlxuICogSG9vayB0aGF0IHBvbGxzIExTUCBzdGF0dXMgYW5kIHNob3dzIGEgbm90aWZpY2F0aW9uIHdoZW46XG4gKiAxLiBNYW5hZ2VyIGluaXRpYWxpemF0aW9uIGZhaWxzXG4gKiAyLiBBbnkgTFNQIHNlcnZlciBlbnRlcnMgYW4gZXJyb3Igc3RhdGVcbiAqXG4gKiBBbHNvIGFkZHMgZXJyb3JzIHRvIGFwcFN0YXRlLnBsdWdpbnMuZXJyb3JzIGZvciAvZG9jdG9yIGRpc3BsYXkuXG4gKlxuICogT25seSBhY3RpdmUgd2hlbiBFTkFCTEVfTFNQX1RPT0wgaXMgc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlTHNwSW5pdGlhbGl6YXRpb25Ob3RpZmljYXRpb24oKTogdm9pZCB7XG4gIGNvbnN0IHsgYWRkTm90aWZpY2F0aW9uIH0gPSB1c2VOb3RpZmljYXRpb25zKClcbiAgY29uc3Qgc2V0QXBwU3RhdGUgPSB1c2VTZXRBcHBTdGF0ZSgpXG4gIC8vIExhenkgaW5pdGlhbGl6ZXIg4oCUIGVhZ2VyIGZvcm0gcmUtZXZhbHVhdGVzIGlzRW52VHJ1dGh5IG9uIGV2ZXJ5IFJFUExcbiAgLy8gcmVuZGVyICh0aGUgYXJnIGV4cHJlc3Npb24gcnVucyBldmVuIHRob3VnaCB1c2VTdGF0ZSBpZ25vcmVzIGl0IGFmdGVyXG4gIC8vIG1vdW50KS4gU2hvd2VkIHVwIGFzIDcuMnMgaXNFbnZUcnV0aHkgc2VsZi10aW1lIGR1cmluZyBQYWdlVXAgc3BhbVxuICAvLyBhZnRlciAjMjQ0OTggc3dhcHBlZCBjaGVhcCAhIXByb2Nlc3MuZW52LlggZm9yIGlzRW52VHJ1dGh5KCkuXG4gIGNvbnN0IFtzaG91bGRQb2xsLCBzZXRTaG91bGRQb2xsXSA9IFJlYWN0LnVzZVN0YXRlKCgpID0+XG4gICAgaXNFbnZUcnV0aHkoXCJ0cnVlXCIpLFxuICApXG4gIC8vIFRyYWNrIHdoaWNoIGVycm9ycyB3ZSd2ZSBhbHJlYWR5IG5vdGlmaWVkIGFib3V0IHRvIGF2b2lkIGR1cGxpY2F0ZXNcbiAgY29uc3Qgbm90aWZpZWRFcnJvcnNSZWYgPSBSZWFjdC51c2VSZWY8U2V0PHN0cmluZz4+KG5ldyBTZXQoKSlcblxuICBjb25zdCBhZGRFcnJvciA9IFJlYWN0LnVzZUNhbGxiYWNrKFxuICAgIChzb3VyY2U6IHN0cmluZywgZXJyb3JNZXNzYWdlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IGVycm9yS2V5ID0gYCR7c291cmNlfToke2Vycm9yTWVzc2FnZX1gXG4gICAgICBpZiAobm90aWZpZWRFcnJvcnNSZWYuY3VycmVudC5oYXMoZXJyb3JLZXkpKSB7XG4gICAgICAgIHJldHVybiAvLyBBbHJlYWR5IG5vdGlmaWVkXG4gICAgICB9XG4gICAgICBub3RpZmllZEVycm9yc1JlZi5jdXJyZW50LmFkZChlcnJvcktleSlcblxuICAgICAgbG9nRm9yRGVidWdnaW5nKGBMU1AgZXJyb3I6ICR7c291cmNlfSAtICR7ZXJyb3JNZXNzYWdlfWApXG5cbiAgICAgIC8vIEFkZCBlcnJvciB0byBhcHBTdGF0ZS5wbHVnaW5zLmVycm9yc1xuICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiB7XG4gICAgICAgIC8vIENoZWNrIGlmIHRoaXMgZXJyb3IgYWxyZWFkeSBleGlzdHMgdG8gYXZvaWQgZHVwbGljYXRlc1xuICAgICAgICBjb25zdCBleGlzdGluZ0tleXMgPSBuZXcgU2V0KFxuICAgICAgICAgIHByZXYucGx1Z2lucy5lcnJvcnMubWFwKGUgPT4ge1xuICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gJ2dlbmVyaWMtZXJyb3InKSB7XG4gICAgICAgICAgICAgIHJldHVybiBgZ2VuZXJpYy1lcnJvcjoke2Uuc291cmNlfToke2UuZXJyb3J9YFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGAke2UudHlwZX06JHtlLnNvdXJjZX1gXG4gICAgICAgICAgfSksXG4gICAgICAgIClcblxuICAgICAgICBjb25zdCBzdGF0ZUVycm9yS2V5ID0gYGdlbmVyaWMtZXJyb3I6JHtzb3VyY2V9OiR7ZXJyb3JNZXNzYWdlfWBcbiAgICAgICAgaWYgKGV4aXN0aW5nS2V5cy5oYXMoc3RhdGVFcnJvcktleSkpIHtcbiAgICAgICAgICByZXR1cm4gcHJldlxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgIHBsdWdpbnM6IHtcbiAgICAgICAgICAgIC4uLnByZXYucGx1Z2lucyxcbiAgICAgICAgICAgIGVycm9yczogW1xuICAgICAgICAgICAgICAuLi5wcmV2LnBsdWdpbnMuZXJyb3JzLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2dlbmVyaWMtZXJyb3InIGFzIGNvbnN0LFxuICAgICAgICAgICAgICAgIHNvdXJjZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JNZXNzYWdlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBTaG93IG5vdGlmaWNhdGlvbiAtIGV4dHJhY3QgcGx1Z2luIG5hbWUgZnJvbSBzb3VyY2UgbGlrZSBcInBsdWdpbjp0eXBlc2NyaXB0LWxzcDp0eXBlc2NyaXB0XCJcbiAgICAgIGNvbnN0IGRpc3BsYXlOYW1lID0gc291cmNlLnN0YXJ0c1dpdGgoJ3BsdWdpbjonKVxuICAgICAgICA/IChzb3VyY2Uuc3BsaXQoJzonKVsxXSA/PyBzb3VyY2UpXG4gICAgICAgIDogc291cmNlXG5cbiAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIGtleTogYGxzcC1lcnJvci0ke3NvdXJjZX1gLFxuICAgICAgICBqc3g6IChcbiAgICAgICAgICA8PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJlcnJvclwiPkxTUCBmb3Ige2Rpc3BsYXlOYW1lfSBmYWlsZWQ8L1RleHQ+XG4gICAgICAgICAgICA8VGV4dCBkaW1Db2xvcj4gwrcgL3BsdWdpbiBmb3IgZGV0YWlsczwvVGV4dD5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lb3V0TXM6IDgwMDAsXG4gICAgICB9KVxuICAgIH0sXG4gICAgW2FkZE5vdGlmaWNhdGlvbiwgc2V0QXBwU3RhdGVdLFxuICApXG5cbiAgY29uc3QgcG9sbCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIC8vIFNraXAgZHVyaW5nIHNjcm9sbCBkcmFpbiDigJQgaXRlcmF0aW5nIGFsbCBMU1Agc2VydmVycyArIHNldEFwcFN0YXRlXG4gICAgLy8gY29tcGV0ZXMgZm9yIHRoZSBldmVudCBsb29wIHdpdGggc2Nyb2xsIGZyYW1lcy4gTmV4dCBpbnRlcnZhbCBwaWNrcyB1cC5cbiAgICBpZiAoZ2V0SXNTY3JvbGxEcmFpbmluZygpKSByZXR1cm5cblxuICAgIGNvbnN0IHN0YXR1cyA9IGdldEluaXRpYWxpemF0aW9uU3RhdHVzKClcblxuICAgIC8vIENoZWNrIG1hbmFnZXIgaW5pdGlhbGl6YXRpb24gc3RhdHVzXG4gICAgaWYgKHN0YXR1cy5zdGF0dXMgPT09ICdmYWlsZWQnKSB7XG4gICAgICBhZGRFcnJvcignbHNwLW1hbmFnZXInLCBzdGF0dXMuZXJyb3IubWVzc2FnZSlcbiAgICAgIHNldFNob3VsZFBvbGwoZmFsc2UpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoc3RhdHVzLnN0YXR1cyA9PT0gJ3BlbmRpbmcnIHx8IHN0YXR1cy5zdGF0dXMgPT09ICdub3Qtc3RhcnRlZCcpIHtcbiAgICAgIC8vIFN0aWxsIGluaXRpYWxpemluZywgY29udGludWUgcG9sbGluZ1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gTWFuYWdlciBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHkgLSBjaGVjayBmb3Igc2VydmVyIGVycm9yc1xuICAgIGNvbnN0IG1hbmFnZXIgPSBnZXRMc3BTZXJ2ZXJNYW5hZ2VyKClcbiAgICBpZiAobWFuYWdlcikge1xuICAgICAgY29uc3Qgc2VydmVycyA9IG1hbmFnZXIuZ2V0QWxsU2VydmVycygpXG4gICAgICBmb3IgKGNvbnN0IFtzZXJ2ZXJOYW1lLCBzZXJ2ZXJdIG9mIHNlcnZlcnMpIHtcbiAgICAgICAgaWYgKHNlcnZlci5zdGF0ZSA9PT0gJ2Vycm9yJyAmJiBzZXJ2ZXIubGFzdEVycm9yKSB7XG4gICAgICAgICAgYWRkRXJyb3Ioc2VydmVyTmFtZSwgc2VydmVyLmxhc3RFcnJvci5tZXNzYWdlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIENvbnRpbnVlIHBvbGxpbmcgdG8gZGV0ZWN0IGZ1dHVyZSBzZXJ2ZXIgZXJyb3JzXG4gIH0sIFthZGRFcnJvcl0pXG5cbiAgdXNlSW50ZXJ2YWwocG9sbCwgc2hvdWxkUG9sbCA/IExTUF9QT0xMX0lOVEVSVkFMX01TIDogbnVsbClcblxuICAvLyBJbml0aWFsIHBvbGwgb24gbW91bnRcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkgfHwgIXNob3VsZFBvbGwpIHJldHVyblxuICAgIHBvbGwoKVxuICB9LCBbcG9sbCwgc2hvdWxkUG9sbF0pXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFdBQVcsUUFBUSxhQUFhO0FBQ3pDLFNBQVNDLGVBQWUsRUFBRUMsbUJBQW1CLFFBQVEsMEJBQTBCO0FBQy9FLFNBQVNDLGdCQUFnQixRQUFRLGdDQUFnQztBQUNqRSxTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUNFQyx1QkFBdUIsRUFDdkJDLG1CQUFtQixRQUNkLCtCQUErQjtBQUN0QyxTQUFTQyxjQUFjLFFBQVEseUJBQXlCO0FBQ3hELFNBQVNDLGVBQWUsUUFBUSxzQkFBc0I7QUFDdEQsU0FBU0MsV0FBVyxRQUFRLHlCQUF5QjtBQUVyRCxNQUFNQyxvQkFBb0IsR0FBRyxJQUFJOztBQUVqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQUFDLGlDQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0w7SUFBQUM7RUFBQSxJQUE0QlgsZ0JBQWdCLENBQUMsQ0FBQztFQUM5QyxNQUFBWSxXQUFBLEdBQW9CUixjQUFjLENBQUMsQ0FBQztFQUtwQyxPQUFBUyxVQUFBLEVBQUFDLGFBQUEsSUFBb0NsQixLQUFLLENBQUFtQixRQUFTLENBQUNDLEtBRW5ELENBQUM7RUFBQSxJQUFBQyxFQUFBO0VBQUEsSUFBQVIsQ0FBQSxRQUFBUyxNQUFBLENBQUFDLEdBQUE7SUFFbURGLEVBQUEsT0FBSUcsR0FBRyxDQUFDLENBQUM7SUFBQVgsQ0FBQSxNQUFBUSxFQUFBO0VBQUE7SUFBQUEsRUFBQSxHQUFBUixDQUFBO0VBQUE7RUFBN0QsTUFBQVks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