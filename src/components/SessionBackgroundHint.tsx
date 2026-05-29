// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useCallback、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useState } from 'react';
// 引入 useDoublePress，将 ../hooks/useDoublePress.js 中已经封装好的能力接到本文件流程里。
import { useDoublePress } from '../hooks/useDoublePress.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 引入 useKeybinding，将 ../keybindings/useKeybinding.js 中已经封装好的能力接到本文件流程里。
import { useKeybinding } from '../keybindings/useKeybinding.js';
// 引入 useShortcutDisplay，将 ../keybindings/useShortcutDisplay.js 中已经封装好的能力接到本文件流程里。
import { useShortcutDisplay } from '../keybindings/useShortcutDisplay.js';
// 引入 useAppState、useAppStateStore、useSetAppState，将 ../state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useAppStateStore, useSetAppState } from '../state/AppState.js';
// 引入 backgroundAll、hasForegroundTasks，将 ../tasks/LocalShellTask/LocalShellTask.js 中已经封装好的能力接到本文件流程里。
import { backgroundAll, hasForegroundTasks } from '../tasks/LocalShellTask/LocalShellTask.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../utils/config.js';
// 复用 env 工具函数，把通用处理留在 ../utils/env.js 中维护。
import { env } from '../utils/env.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../utils/envUtils.js';
// 引入 KeyboardShortcutHint，将 ./design-system/KeyboardShortcutHint.js 中已经封装好的能力接到本文件流程里。
import { KeyboardShortcutHint } from './design-system/KeyboardShortcutHint.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onBackgroundSession: () => void;，负责终端渲染在该局部场景下的响应。
  onBackgroundSession: () => void;
  isLoading: boolean;
};

/**
 * Shows a hint when user presses Ctrl+B to background the current session.
 * Uses double-press pattern: first press shows hint, second press within 800ms backgrounds.
 *
 * Only activates when:
 * 1. isLoading is true (a query is in progress)
 * 2. No foreground tasks (bash/agent) are running (those take priority for Ctrl+B)
 */
// SessionBackgroundHint 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function SessionBackgroundHint(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onBackgroundSession,
    isLoading
  } = t0;
  // setAppState 状态保存`useSetAppState`，供终端渲染后续处理使用。
  const setAppState = useSetAppState();
  // appStateStore 状态保存`useAppStateStore`，供终端渲染后续处理使用。
  const appStateStore = useAppStateStore();
  // showSessionHint 会话数据 由 React state 持有，setShowSessionHint 会在用户操作或异步结果返回时触发刷新。
  const [showSessionHint, setShowSessionHint] = useState(false);
  // handleDoublePress 集合保存`useDoublePress`，供终端渲染后续处理使用。
  const handleDoublePress = useDoublePress(setShowSessionHint, onBackgroundSession, _temp);
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== appStateStore || $[1] !== handleDoublePress || $[2] !== isLoading || $[3] !== setAppState) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)` 时，终端渲染执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS)) {
        // 终端 UI 组件 Session Background Hint在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 状态读取`appStateStore.getState`，供终端渲染后续处理使用。
      const state = appStateStore.getState();
      // 满足 `hasForegroundTasks(state)` 时，终端渲染执行该分支。
      if (hasForegroundTasks(state)) {
        // 调用 backgroundAll，触发终端渲染此处需要的副作用。
        backgroundAll(() => appStateStore.getState(), setAppState);
        // 满足 `!getGlobalConfig().hasUsedBackgroundTask` 时，终端渲染执行该分支。
        if (!getGlobalConfig().hasUsedBackgroundTask) {
          // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
          saveGlobalConfig(_temp2);
        }
      } else {
        // 只有 `isEnvTruthy("false") && isLoading` 满足时，终端渲染才执行该分支。
        if (isEnvTruthy("false") && isLoading) {
          // 调用 handleDoublePress，触发终端渲染此处需要的副作用。
          handleDoublePress();
        }
      }
    };
    // $[0] 缓存 `appStateStore`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = appStateStore;
    // $[1] 缓存 `handleDoublePress`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = handleDoublePress;
    // $[2] 缓存 `isLoading`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = isLoading;
    // $[3] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setAppState;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // handleBackground保存`t1`，作为后续临时缓存值处理的输入。
  const handleBackground = t1;
  // hasForeground记录 `useAppState` 是否成立，终端渲染随后按该结果分支。
  const hasForeground = useAppState(hasForegroundTasks);
  // t2 暂存 `isEnvTruthy("false")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `isEnvTruthy("false")` 生成的渲染片段，后续返回路径直接复用。
    t2 = isEnvTruthy("false");
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // sessionBgEnabled 会话数据保存`t2`，作为后续临时缓存值处理的输入。
  const sessionBgEnabled = t2;
  // t3标记终端 UI Session Background H...是否启用对应路径。
  const t3 = hasForeground || sessionBgEnabled && isLoading;
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== t3) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      context: "Task",
      isActive: t3
    };
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // 调用 useKeybinding，触发终端渲染此处需要的副作用。
  useKeybinding("task:background", handleBackground, t4);
  // baseShortcut保存`useShortcutDisplay`，供终端渲染后续处理使用。
  const baseShortcut = useShortcutDisplay("task:background", "Task", "ctrl+b");
  // shortcut标记终端 UI Session Background H...是否启用对应路径。
  const shortcut = env.terminal === "tmux" && baseShortcut === "ctrl+b" ? "ctrl+b ctrl+b" : baseShortcut;
  // 只有 `!isLoading || !showSessionHint` 满足时，终端渲染才执行该分支。
  if (!isLoading || !showSessionHint) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t5 暂存 `<Box paddingLeft={2}><Text dimColor={true}><KeyboardShort...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== shortcut) {
    // t5 暂存 `<Box paddingLeft={2}><Text dimColor={true}><KeyboardShort...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Box paddingLeft={2}><Text dimColor={true}><KeyboardShortcutHint shortcut={shortcut} action="background" /></Text></Box>;
    // $[8] 缓存 `shortcut`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = shortcut;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // 返回 `t5`，作为终端渲染这次计算的结果。
  return t5;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(c) {
  // 返回 `c.hasUsedBackgroundTask ? c : {`，作为终端渲染这次计算的结果。
  return c.hasUsedBackgroundTask ? c : {
    ...c,
    hasUsedBackgroundTask: true
  };
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlU3RhdGUiLCJ1c2VEb3VibGVQcmVzcyIsIkJveCIsIlRleHQiLCJ1c2VLZXliaW5kaW5nIiwidXNlU2hvcnRjdXREaXNwbGF5IiwidXNlQXBwU3RhdGUiLCJ1c2VBcHBTdGF0ZVN0b3JlIiwidXNlU2V0QXBwU3RhdGUiLCJiYWNrZ3JvdW5kQWxsIiwiaGFzRm9yZWdyb3VuZFRhc2tzIiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsImVudiIsImlzRW52VHJ1dGh5IiwiS2V5Ym9hcmRTaG9ydGN1dEhpbnQiLCJQcm9wcyIsIm9uQmFja2dyb3VuZFNlc3Npb24iLCJpc0xvYWRpbmciLCJTZXNzaW9uQmFja2dyb3VuZEhpbnQiLCJ0MCIsIiQiLCJfYyIsInNldEFwcFN0YXRlIiwiYXBwU3RhdGVTdG9yZSIsInNob3dTZXNzaW9uSGludCIsInNldFNob3dTZXNzaW9uSGludCIsImhhbmRsZURvdWJsZVByZXNzIiwiX3RlbXAiLCJ0MSIsInByb2Nlc3MiLCJDTEFVREVfQ09ERV9ESVNBQkxFX0JBQ0tHUk9VTkRfVEFTS1MiLCJzdGF0ZSIsImdldFN0YXRlIiwiaGFzVXNlZEJhY2tncm91bmRUYXNrIiwiX3RlbXAyIiwiaGFuZGxlQmFja2dyb3VuZCIsImhhc0ZvcmVncm91bmQiLCJ0MiIsIlN5bWJvbCIsImZvciIsInNlc3Npb25CZ0VuYWJsZWQiLCJ0MyIsInQ0IiwiY29udGV4dCIsImlzQWN0aXZlIiwiYmFzZVNob3J0Y3V0Iiwic2hvcnRjdXQiLCJ0ZXJtaW5hbCIsInQ1IiwiYyJdLCJzb3VyY2VzIjpbIlNlc3Npb25CYWNrZ3JvdW5kSGludC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VDYWxsYmFjaywgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZURvdWJsZVByZXNzIH0gZnJvbSAnLi4vaG9va3MvdXNlRG91YmxlUHJlc3MuanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQgeyB1c2VLZXliaW5kaW5nIH0gZnJvbSAnLi4va2V5YmluZGluZ3MvdXNlS2V5YmluZGluZy5qcydcbmltcG9ydCB7IHVzZVNob3J0Y3V0RGlzcGxheSB9IGZyb20gJy4uL2tleWJpbmRpbmdzL3VzZVNob3J0Y3V0RGlzcGxheS5qcydcbmltcG9ydCB7XG4gIHVzZUFwcFN0YXRlLFxuICB1c2VBcHBTdGF0ZVN0b3JlLFxuICB1c2VTZXRBcHBTdGF0ZSxcbn0gZnJvbSAnLi4vc3RhdGUvQXBwU3RhdGUuanMnXG5pbXBvcnQge1xuICBiYWNrZ3JvdW5kQWxsLFxuICBoYXNGb3JlZ3JvdW5kVGFza3MsXG59IGZyb20gJy4uL3Rhc2tzL0xvY2FsU2hlbGxUYXNrL0xvY2FsU2hlbGxUYXNrLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgZW52IH0gZnJvbSAnLi4vdXRpbHMvZW52LmpzJ1xuaW1wb3J0IHsgaXNFbnZUcnV0aHkgfSBmcm9tICcuLi91dGlscy9lbnZVdGlscy5qcydcbmltcG9ydCB7IEtleWJvYXJkU2hvcnRjdXRIaW50IH0gZnJvbSAnLi9kZXNpZ24tc3lzdGVtL0tleWJvYXJkU2hvcnRjdXRIaW50LmpzJ1xuXG50eXBlIFByb3BzID0ge1xuICBvbkJhY2tncm91bmRTZXNzaW9uOiAoKSA9PiB2b2lkXG4gIGlzTG9hZGluZzogYm9vbGVhblxufVxuXG4vKipcbiAqIFNob3dzIGEgaGludCB3aGVuIHVzZXIgcHJlc3NlcyBDdHJsK0IgdG8gYmFja2dyb3VuZCB0aGUgY3VycmVudCBzZXNzaW9uLlxuICogVXNlcyBkb3VibGUtcHJlc3MgcGF0dGVybjogZmlyc3QgcHJlc3Mgc2hvd3MgaGludCwgc2Vjb25kIHByZXNzIHdpdGhpbiA4MDBtcyBiYWNrZ3JvdW5kcy5cbiAqXG4gKiBPbmx5IGFjdGl2YXRlcyB3aGVuOlxuICogMS4gaXNMb2FkaW5nIGlzIHRydWUgKGEgcXVlcnkgaXMgaW4gcHJvZ3Jlc3MpXG4gKiAyLiBObyBmb3JlZ3JvdW5kIHRhc2tzIChiYXNoL2FnZW50KSBhcmUgcnVubmluZyAodGhvc2UgdGFrZSBwcmlvcml0eSBmb3IgQ3RybCtCKVxuICovXG5leHBvcnQgZnVuY3Rpb24gU2Vzc2lvbkJhY2tncm91bmRIaW50KHtcbiAgb25CYWNrZ3JvdW5kU2Vzc2lvbixcbiAgaXNMb2FkaW5nLFxufTogUHJvcHMpOiBSZWFjdC5SZWFjdEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3Qgc2V0QXBwU3RhdGUgPSB1c2VTZXRBcHBTdGF0ZSgpXG4gIGNvbnN0IGFwcFN0YXRlU3RvcmUgPSB1c2VBcHBTdGF0ZVN0b3JlKClcblxuICBjb25zdCBbc2hvd1Nlc3Npb25IaW50LCBzZXRTaG93U2Vzc2lvbkhpbnRdID0gdXNlU3RhdGUoZmFsc2UpXG5cbiAgY29uc3QgaGFuZGxlRG91YmxlUHJlc3MgPSB1c2VEb3VibGVQcmVzcyhcbiAgICBzZXRTaG93U2Vzc2lvbkhpbnQsXG4gICAgb25CYWNrZ3JvdW5kU2Vzc2lvbixcbiAgICAoKSA9PiB7fSwgLy8gRmlyc3QgcHJlc3MganVzdCBzaG93cyB0aGUgaGludFxuICApXG5cbiAgLy8gSGFuZGxlciBmb3IgdGFzazpiYWNrZ3JvdW5kIC0gcHJpb3JpdGl6ZXMgZm9yZWdyb3VuZCB0YXNrcywgZmFsbHMgYmFjayB0byBzZXNzaW9uIGJhY2tncm91bmRpbmdcbiAgLy8gU2tpcCBhbGwgYmFja2dyb3VuZCBmdW5jdGlvbmFsaXR5IGlmIGJhY2tncm91bmQgdGFza3MgYXJlIGRpc2FibGVkXG4gIGNvbnN0IGhhbmRsZUJhY2tncm91bmQgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGlzRW52VHJ1dGh5KHByb2Nlc3MuZW52LkNMQVVERV9DT0RFX0RJU0FCTEVfQkFDS0dST1VORF9UQVNLUykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBzdGF0ZSA9IGFwcFN0YXRlU3RvcmUuZ2V0U3RhdGUoKVxuICAgIGlmIChoYXNGb3JlZ3JvdW5kVGFza3Moc3RhdGUpKSB7XG4gICAgICAvLyBFeGlzdGluZyBiZWhhdmlvciAtIGJhY2tncm91bmQgcnVubmluZyBiYXNoL2FnZW50IHRhc2tzXG4gICAgICBiYWNrZ3JvdW5kQWxsKCgpID0+IGFwcFN0YXRlU3RvcmUuZ2V0U3RhdGUoKSwgc2V0QXBwU3RhdGUpXG4gICAgICBpZiAoIWdldEdsb2JhbENvbmZpZygpLmhhc1VzZWRCYWNrZ3JvdW5kVGFzaykge1xuICAgICAgICBzYXZlR2xvYmFsQ29uZmlnKGMgPT5cbiAgICAgICAgICBjLmhhc1VzZWRCYWNrZ3JvdW5kVGFzayA/IGMgOiB7IC4uLmMsIGhhc1VzZWRCYWNrZ3JvdW5kVGFzazogdHJ1ZSB9LFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGlzRW52VHJ1dGh5KFwiZmFsc2VcIikgJiZcbiAgICAgIGlzTG9hZGluZ1xuICAgICkge1xuICAgICAgLy8gTmV3IGJlaGF2aW9yIC0gZG91YmxlLXByZXNzIHRvIGJhY2tncm91bmQgc2Vzc2lvbiAoZ2F0ZWQpXG4gICAgICBoYW5kbGVEb3VibGVQcmVzcygpXG4gICAgfVxuICB9LCBbc2V0QXBwU3RhdGUsIGFwcFN0YXRlU3RvcmUsIGlzTG9hZGluZywgaGFuZGxlRG91YmxlUHJlc3NdKVxuXG4gIC8vIE9ubHkgZWF0IGN0cmwrYiB3aGVuIHRoZXJlJ3Mgc29tZXRoaW5nIHRvIGJhY2tncm91bmQuIFdpdGhvdXQgdGhpcyBnYXRlXG4gIC8vIHRoZSBiaW5kaW5nIGRvdWJsZS1maXJlcyB3aXRoIHJlYWRsaW5lIGJhY2t3YXJkLWNoYXIgYXQgYW4gaWRsZSBwcm9tcHQuXG4gIGNvbnN0IGhhc0ZvcmVncm91bmQgPSB1c2VBcHBTdGF0ZShoYXNGb3JlZ3JvdW5kVGFza3MpXG4gIGNvbnN0IHNlc3Npb25CZ0VuYWJsZWQgPSBpc0VudlRydXRoeShcImZhbHNlXCIpXG4gIHVzZUtleWJpbmRpbmcoJ3Rhc2s6YmFja2dyb3VuZCcsIGhhbmRsZUJhY2tncm91bmQsIHtcbiAgICBjb250ZXh0OiAnVGFzaycsXG4gICAgaXNBY3RpdmU6IGhhc0ZvcmVncm91bmQgfHwgKHNlc3Npb25CZ0VuYWJsZWQgJiYgaXNMb2FkaW5nKSxcbiAgfSlcblxuICAvLyBHZXQgdGhlIGNvbmZpZ3VyZWQgc2hvcnRjdXQgZm9yIHRhc2s6YmFja2dyb3VuZFxuICBjb25zdCBiYXNlU2hvcnRjdXQgPSB1c2VTaG9ydGN1dERpc3BsYXkoJ3Rhc2s6YmFja2dyb3VuZCcsICdUYXNrJywgJ2N0cmwrYicpXG4gIC8vIEluIHRtdXgsIGN0cmwrYiBpcyB0aGUgcHJlZml4IGtleSwgc28gdXNlcnMgbmVlZCB0byBwcmVzcyBpdCB0d2ljZSB0byBzZW5kIGN0cmwrYlxuICBjb25zdCBzaG9ydGN1dCA9XG4gICAgZW52LnRlcm1pbmFsID09PSAndG11eCcgJiYgYmFzZVNob3J0Y3V0ID09PSAnY3RybCtiJ1xuICAgICAgPyAnY3RybCtiIGN0cmwrYidcbiAgICAgIDogYmFzZVNob3J0Y3V0XG5cbiAgaWYgKCFpc0xvYWRpbmcgfHwgIXNob3dTZXNzaW9uSGludCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxCb3ggcGFkZGluZ0xlZnQ9ezJ9PlxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIDxLZXlib2FyZFNob3J0Y3V0SGludCBzaG9ydGN1dD17c2hvcnRjdXR9IGFjdGlvbj1cImJhY2tncm91bmRcIiAvPlxuICAgICAgPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFdBQVcsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDN0MsU0FBU0MsY0FBYyxRQUFRLDRCQUE0QjtBQUMzRCxTQUFTQyxHQUFHLEVBQUVDLElB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