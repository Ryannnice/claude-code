// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 React、useContext、useEffect、useEffectEvent、useState、useSyncExternalStore，将 react 中已经封装好的能力接到本文件流程里。
import React, { useContext, useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react';
// 引入 MailboxProvider，将 ../context/mailbox.js 中已经封装好的能力接到本文件流程里。
import { MailboxProvider } from '../context/mailbox.js';
// 引入 useSettingsChange，将 ../hooks/useSettingsChange.js 中已经封装好的能力接到本文件流程里。
import { useSettingsChange } from '../hooks/useSettingsChange.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js';
// 复用 createDisabledBypassPermissionsContext、isBypassPermissionsModeDisabled 工具函数，把通用处理留在 ../utils/permissions/permissionSetup.js 中维护。
import { createDisabledBypassPermissionsContext, isBypassPermissionsModeDisabled } from '../utils/permissions/permissionSetup.js';
// 复用 applySettingsChange 工具函数，把通用处理留在 ../utils/settings/applySettingsChange.js 中维护。
import { applySettingsChange } from '../utils/settings/applySettingsChange.js';
// 类型依赖 { SettingSource } 来自 ../utils/settings/constants.js，用于校准应用状态管理的数据契约。
import type { SettingSource } from '../utils/settings/constants.js';
// 引入 createStore，将 ./store.js 中已经封装好的能力接到本文件流程里。
import { createStore } from './store.js';

// DCE: voice context is ant-only. External builds get a passthrough.
/* eslint-disable @typescript-eslint/no-require-imports */
// VoiceProvider 先占位，稍后的条件分支会根据实际输入补齐它。
const VoiceProvider: (props: {
  children: React.ReactNode;
// 这个回调绑定到 }) => React.ReactNode = feature('VOICE_MODE') ? require('../context/voice.js').Voice…，负责应用状态管理在该局部场景下的响应。
}) => React.ReactNode = feature('VOICE_MODE') ? require('../context/voice.js').VoiceProvider : ({
  children
}) => children;

/* eslint-enable @typescript-eslint/no-require-imports */
// 引入 AppState、AppStateStore、getDefaultAppState，将 ./AppStateStore.js 中已经封装好的能力接到本文件流程里。
import { type AppState, type AppStateStore, getDefaultAppState } from './AppStateStore.js';

// TODO: Remove these re-exports once all callers import directly from
// ./AppStateStore.js. Kept for back-compat during migration so .ts callers
// can incrementally move off the .tsx import and stop pulling React.
// 重新导出这一组成员，让应用状态管理的公共 API 保持集中入口。
export { type AppState, type AppStateStore, type CompletionBoundary, getDefaultAppState, IDLE_SPECULATION_STATE, type SpeculationResult, type SpeculationState } from './AppStateStore.js';
// AppStoreContext构建`React.createContext<AppStateStore | null>(null)`，供后续判断或组装使用。
export const AppStoreContext = React.createContext<AppStateStore | null>(null);
// Props 固化应用状态管理里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: React.ReactNode;
  initialState?: AppState;
  onChangeAppState?: (args: {
    newState: AppState;
    oldState: AppState;
  }) => void;
};
// HasAppStateContext 状态构建`React.createContext<boolean>(false)` 整理出中间结果，供应用状态管理状态管理 App State后续步骤使用。
const HasAppStateContext = React.createContext<boolean>(false);
// AppStateProvider 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AppStateProvider(t0) {
  // $保存`_c`，供应用状态管理后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    children,
    initialState,
    onChangeAppState
  } = t0;
  // hasAppStateContext 状态记录 `useContext` 是否成立，应用状态管理随后按该结果分支。
  const hasAppStateContext = useContext(HasAppStateContext);
  // 满足 `hasAppStateContext` 时，应用状态管理执行该分支。
  if (hasAppStateContext) {
    // 抛出 new Error("AppStateProvider can not be nested within another AppStateProvider");，阻止应用状态管理在无效状态下继续运行。
    throw new Error("AppStateProvider can not be nested within another AppStateProvider");
  }
  // t1 暂存 `() => createStore(initialState ?? getDefaultAppState(), o...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== initialState || $[1] !== onChangeAppState) {
    // t1 暂存 `() => createStore(initialState ?? getDefaultAppState(), o...` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => createStore(initialState ?? getDefaultAppState(), onChangeAppState);
    // $[0] 缓存 `initialState`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = initialState;
    // $[1] 缓存 `onChangeAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = onChangeAppState;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // store 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [store] = useState(t1);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== store) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
      const {
        toolPermissionContext
      } = store.getState();
      // 组合条件 `toolPermissionContext.isBypassPermissionsModeAvailable && isBypassPermissionsMode...` 成立时，应用状态管理才启用这条专门路径。
      if (toolPermissionContext.isBypassPermissionsModeAvailable && isBypassPermissionsModeDisabled()) {
        // 记录应用状态管理运行诊断，方便排查异常路径或性能问题。
        logForDebugging("Disabling bypass permissions mode on mount (remote settings loaded before mount)");
        // store.setState 写入新的状态值，使应用状态管理后续读取保持一致。
        store.setState(_temp);
      }
    };
    // $[3] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = store;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // t3 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [];
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // 调用 useEffect，触发应用状态管理此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `source => applySettingsChange(source, store.setState)` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[6] !== store.setState) {
    // t4 暂存 `source => applySettingsChange(source, store.setState)` 生成的渲染片段，后续返回路径直接复用。
    t4 = source => applySettingsChange(source, store.setState);
    // $[6] 缓存 `store.setState`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = store.setState;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[7];
  }
  // onSettingsChange保存`useEffectEvent`，供应用状态管理后续处理使用。
  const onSettingsChange = useEffectEvent(t4);
  // 调用 useSettingsChange，触发应用状态管理此处需要的副作用。
  useSettingsChange(onSettingsChange);
  // t5 暂存 `<MailboxProvider><VoiceProvider>{children}</VoiceProvider...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[8] !== children) {
    // t5 暂存 `<MailboxProvider><VoiceProvider>{children}</VoiceProvider...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <MailboxProvider><VoiceProvider>{children}</VoiceProvider></MailboxProvider>;
    // $[8] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = children;
    // $[9] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[9];
  }
  // t6 暂存 `<HasAppStateContext.Provider value={true}><AppStoreContex...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== store || $[11] !== t5) {
    // t6 暂存 `<HasAppStateContext.Provider value={true}><AppStoreContex...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <HasAppStateContext.Provider value={true}><AppStoreContext.Provider value={store}>{t5}</AppStoreContext.Provider></HasAppStateContext.Provider>;
    // $[10] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = store;
    // $[11] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t5;
    // $[12] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[12];
  }
  // 返回 `t6`，作为应用状态管理这次计算的结果。
  return t6;
}
// _temp 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(prev) {
  // 返回结构化结果，集中表达应用状态管理已经整理出的状态。
  return {
    ...prev,
    toolPermissionContext: createDisabledBypassPermissionsContext(prev.toolPermissionContext)
  };
}
// useAppStore 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function useAppStore(): AppStateStore {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // store保存`useContext`，供应用状态管理后续处理使用。
  const store = useContext(AppStoreContext);
  // store缺失时提前走兜底路径，避免应用状态管理继续依赖无效输入。
  if (!store) {
    // 抛出 new ReferenceError('useAppState/useSetAppState cannot be called outside of an <AppStatePr…，阻止应用状态管理在无效状态下继续运行。
    throw new ReferenceError('useAppState/useSetAppState cannot be called outside of an <AppStateProvider />');
  }
  // 返回 `store`，作为应用状态管理这次计算的结果。
  return store;
}

/**
 * Subscribe to a slice of AppState. Only re-renders when the selected value
 * changes (compared via Object.is).
 *
 * For multiple independent fields, call the hook multiple times:
 * ```
 * const verbose = useAppState(s => s.verbose)
 * const model = useAppState(s => s.mainLoopModel)
 * ```
 *
 * Do NOT return new objects from the selector -- Object.is will always see
 * them as changed. Instead, select an existing sub-object reference:
 * ```
 * const { text, promptId } = useAppState(s => s.promptSuggestion) // good
 * ```
 */
// useAppState 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAppState(selector) {
  // $保存`_c`，供应用状态管理后续处理使用。
  const $ = _c(3);
  // store保存`useAppStore`，供应用状态管理后续处理使用。
  const store = useAppStore();
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== selector || $[1] !== store) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 状态读取`store.getState`，供应用状态管理后续处理使用。
      const state = store.getState();
      // selected保存`selector`，供应用状态管理后续处理使用。
      const selected = selector(state);
      // 组合条件 `false && state === selected` 成立时，应用状态管理才启用这条专门路径。
      if (false && state === selected) {
        // 抛出 new Error(`Your selector in \`useAppState(${selector.toString()})\` returned the original…，阻止应用状态管理在无效状态下继续运行。
        throw new Error(`Your selector in \`useAppState(${selector.toString()})\` returned the original state, which is not allowed. You must instead return a property for optimised rendering.`);
      }
      // 返回 `selected`，作为应用状态管理这次计算的结果。
      return selected;
    };
    // $[0] 缓存 `selector`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = selector;
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // get保存`t0`，作为后续临时缓存值处理的输入。
  const get = t0;
  // 返回 `useSyncExternalStore(store.subscribe, get, get)`，作为应用状态管理这次计算的结果。
  return useSyncExternalStore(store.subscribe, get, get);
}

/**
 * Get the setAppState updater without subscribing to any state.
 * Returns a stable reference that never changes -- components using only
 * this hook will never re-render from state changes.
 */
// useSetAppState 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useSetAppState() {
  // 返回 `useAppStore().setState`，作为应用状态管理这次计算的结果。
  return useAppStore().setState;
}

/**
 * Get the store directly (for passing getState/setState to non-React code).
 */
// useAppStateStore 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAppStateStore() {
  // 返回 `useAppStore()`，作为应用状态管理这次计算的结果。
  return useAppStore();
}
// NOOP_SUBSCRIBE封装成回调，供应用状态管理状态管理 App State在事件触发或异步步骤中调用。
const NOOP_SUBSCRIBE = () => () => {};

/**
 * Safe version of useAppState that returns undefined if called outside of AppStateProvider.
 * Useful for components that may be rendered in contexts where AppStateProvider isn't available.
 */
// useAppStateMaybeOutsideOfProvider 封装AppState的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useAppStateMaybeOutsideOfProvider(selector) {
  // $保存`_c`，供应用状态管理后续处理使用。
  const $ = _c(3);
  // store保存`useContext`，供应用状态管理后续处理使用。
  const store = useContext(AppStoreContext);
  // t0 暂存 `() => store ? selector(store.getState()) : undefined` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== selector || $[1] !== store) {
    // t0 暂存 `() => store ? selector(store.getState()) : undefined` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => store ? selector(store.getState()) : undefined;
    // $[0] 缓存 `selector`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = selector;
    // $[1] 缓存 `store`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = store;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // 返回 `useSyncExternalStore(store ? store.subscribe : NOOP_SUBSCRIBE, t0)`，作为应用状态管理这次计算的结果。
  return useSyncExternalStore(store ? store.subscribe : NOOP_SUBSCRIBE, t0);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJ1c2VDb250ZXh0IiwidXNlRWZmZWN0IiwidXNlRWZmZWN0RXZlbnQiLCJ1c2VTdGF0ZSIsInVzZVN5bmNFeHRlcm5hbFN0b3JlIiwiTWFpbGJveFByb3ZpZGVyIiwidXNlU2V0dGluZ3NDaGFuZ2UiLCJsb2dGb3JEZWJ1Z2dpbmciLCJjcmVhdGVEaXNhYmxlZEJ5cGFzc1Blcm1pc3Npb25zQ29udGV4dCIsImlzQnlwYXNzUGVybWlzc2lvbnNNb2RlRGlzYWJsZWQiLCJhcHBseVNldHRpbmdzQ2hhbmdlIiwiU2V0dGluZ1NvdXJjZSIsImNyZWF0ZVN0b3JlIiwiVm9pY2VQcm92aWRlciIsInByb3BzIiwiY2hpbGRyZW4iLCJSZWFjdE5vZGUiLCJyZXF1aXJlIiwiQXBwU3RhdGUiLCJBcHBTdGF0ZVN0b3JlIiwiZ2V0RGVmYXVsdEFwcFN0YXRlIiwiQ29tcGxldGlvbkJvdW5kYXJ5IiwiSURMRV9TUEVDVUxBVElPTl9TVEFURSIsIlNwZWN1bGF0aW9uUmVzdWx0IiwiU3BlY3VsYXRpb25TdGF0ZSIsIkFwcFN0b3JlQ29udGV4dCIsImNyZWF0ZUNvbnRleHQiLCJQcm9wcyIsImluaXRpYWxTdGF0ZSIsIm9uQ2hhbmdlQXBwU3RhdGUiLCJhcmdzIiwibmV3U3RhdGUiLCJvbGRTdGF0ZSIsIkhhc0FwcFN0YXRlQ29udGV4dCIsIkFwcFN0YXRlUHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsImhhc0FwcFN0YXRlQ29udGV4dCIsIkVycm9yIiwidDEiLCJzdG9yZSIsInQyIiwidG9vbFBlcm1pc3Npb25Db250ZXh0IiwiZ2V0U3RhdGUiLCJpc0J5cGFzc1Blcm1pc3Npb25zTW9kZUF2YWlsYWJsZSIsInNldFN0YXRlIiwiX3RlbXAiLCJ0MyIsIlN5bWJvbCIsImZvciIsInQ0Iiwic291cmNlIiwib25TZXR0aW5nc0NoYW5nZSIsInQ1IiwidDYiLCJwcmV2IiwidXNlQXBwU3RvcmUiLCJSZWZlcmVuY2VFcnJvciIsInVzZUFwcFN0YXRlIiwic2VsZWN0b3IiLCJzdGF0ZSIsInNlbGVjdGVkIiwidG9TdHJpbmciLCJnZXQiLCJzdWJzY3JpYmUiLCJ1c2VTZXRBcHBTdGF0ZSIsInVzZUFwcFN0YXRlU3RvcmUiLCJOT09QX1NVQlNDUklCRSIsInVzZUFwcFN0YXRlTWF5YmVPdXRzaWRlT2ZQcm92aWRlciIsInVuZGVmaW5lZCJdLCJzb3VyY2VzIjpbIkFwcFN0YXRlLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmZWF0dXJlIH0gZnJvbSAnYnVuOmJ1bmRsZSdcbmltcG9ydCBSZWFjdCwge1xuICB1c2VDb250ZXh0LFxuICB1c2VFZmZlY3QsXG4gIHVzZUVmZmVjdEV2ZW50LFxuICB1c2VTdGF0ZSxcbiAgdXNlU3luY0V4dGVybmFsU3RvcmUsXG59IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgTWFpbGJveFByb3ZpZGVyIH0gZnJvbSAnLi4vY29udGV4dC9tYWlsYm94LmpzJ1xuaW1wb3J0IHsgdXNlU2V0dGluZ3NDaGFuZ2UgfSBmcm9tICcuLi9ob29rcy91c2VTZXR0aW5nc0NoYW5nZS5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHtcbiAgY3JlYXRlRGlzYWJsZWRCeXBhc3NQZXJtaXNzaW9uc0NvbnRleHQsXG4gIGlzQnlwYXNzUGVybWlzc2lvbnNNb2RlRGlzYWJsZWQsXG59IGZyb20gJy4uL3V0aWxzL3Blcm1pc3Npb25zL3Blcm1pc3Npb25TZXR1cC5qcydcbmltcG9ydCB7IGFwcGx5U2V0dGluZ3NDaGFuZ2UgfSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy9hcHBseVNldHRpbmdzQ2hhbmdlLmpzJ1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nU291cmNlIH0gZnJvbSAnLi4vdXRpbHMvc2V0dGluZ3MvY29uc3RhbnRzLmpzJ1xuaW1wb3J0IHsgY3JlYXRlU3RvcmUgfSBmcm9tICcuL3N0b3JlLmpzJ1xuXG4vLyBEQ0U6IHZvaWNlIGNvbnRleHQgaXMgYW50LW9ubHkuIEV4dGVybmFsIGJ1aWxkcyBnZXQgYSBwYXNzdGhyb3VnaC5cbi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHMgKi9cbmNvbnN0IFZvaWNlUHJvdmlkZXI6IChwcm9wczogeyBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlIH0pID0+IFJlYWN0LlJlYWN0Tm9kZSA9XG4gIGZlYXR1cmUoJ1ZPSUNFX01PREUnKVxuICAgID8gcmVxdWlyZSgnLi4vY29udGV4dC92b2ljZS5qcycpLlZvaWNlUHJvdmlkZXJcbiAgICA6ICh7IGNoaWxkcmVuIH0pID0+IGNoaWxkcmVuXG5cbi8qIGVzbGludC1lbmFibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0cyAqL1xuaW1wb3J0IHtcbiAgdHlwZSBBcHBTdGF0ZSxcbiAgdHlwZSBBcHBTdGF0ZVN0b3JlLFxuICBnZXREZWZhdWx0QXBwU3RhdGUsXG59IGZyb20gJy4vQXBwU3RhdGVTdG9yZS5qcydcblxuLy8gVE9ETzogUmVtb3ZlIHRoZXNlIHJlLWV4cG9ydHMgb25jZSBhbGwgY2FsbGVycyBpbXBvcnQgZGlyZWN0bHkgZnJvbVxuLy8gLi9BcHBTdGF0ZVN0b3JlLmpzLiBLZXB0IGZvciBiYWNrLWNvbXBhdCBkdXJpbmcgbWlncmF0aW9uIHNvIC50cyBjYWxsZXJzXG4vLyBjYW4gaW5jcmVtZW50YWxseSBtb3ZlIG9mZiB0aGUgLnRzeCBpbXBvcnQgYW5kIHN0b3AgcHVsbGluZyBSZWFjdC5cbmV4cG9ydCB7XG4gIHR5cGUgQXBwU3RhdGUsXG4gIHR5cGUgQXBwU3RhdGVTdG9yZSxcbiAgdHlwZSBDb21wbGV0aW9uQm91bmRhcnksXG4gIGdldERlZmF1bHRBcHBTdGF0ZSxcbiAgSURMRV9TUEVDVUxBVElPTl9TVEFURSxcbiAgdHlwZSBTcGVjdWxhdGlvblJlc3VsdCxcbiAgdHlwZSBTcGVjdWxhdGlvblN0YXRlLFxufSBmcm9tICcuL0FwcFN0YXRlU3RvcmUuanMnXG5cbmV4cG9ydCBjb25zdCBBcHBTdG9yZUNvbnRleHQgPSBSZWFjdC5jcmVhdGVDb250ZXh0PEFwcFN0YXRlU3RvcmUgfCBudWxsPihudWxsKVxuXG50eXBlIFByb3BzID0ge1xuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG4gIGluaXRpYWxTdGF0ZT86IEFwcFN0YXRlXG4gIG9uQ2hhbmdlQXBwU3RhdGU/OiAoYXJnczogeyBuZXdTdGF0ZTogQXBwU3RhdGU7IG9sZFN0YXRlOiBBcHBTdGF0ZSB9KSA9PiB2b2lkXG59XG5cbmNvbnN0IEhhc0FwcFN0YXRlQ29udGV4dCA9IFJlYWN0LmNyZWF0ZUNvbnRleHQ8Ym9vbGVhbj4oZmFsc2UpXG5cbmV4cG9ydCBmdW5jdGlvbiBBcHBTdGF0ZVByb3ZpZGVyKHtcbiAgY2hpbGRyZW4sXG4gIGluaXRpYWxTdGF0ZSxcbiAgb25DaGFuZ2VBcHBTdGF0ZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gRG9uJ3QgYWxsb3cgbmVzdGVkIEFwcFN0YXRlUHJvdmlkZXJzLlxuICBjb25zdCBoYXNBcHBTdGF0ZUNvbnRleHQgPSB1c2VDb250ZXh0KEhhc0FwcFN0YXRlQ29udGV4dClcbiAgaWYgKGhhc0FwcFN0YXRlQ29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdBcHBTdGF0ZVByb3ZpZGVyIGNhbiBub3QgYmUgbmVzdGVkIHdpdGhpbiBhbm90aGVyIEFwcFN0YXRlUHJvdmlkZXInLFxuICAgIClcbiAgfVxuXG4gIC8vIFN0b3JlIGlzIGNyZWF0ZWQgb25jZSBhbmQgbmV2ZXIgY2hhbmdlcyAtLSBzdGFibGUgY29udGV4dCB2YWx1ZSBtZWFuc1xuICAvLyB0aGUgcHJvdmlkZXIgbmV2ZXIgdHJpZ2dlcnMgcmUtcmVuZGVycy4gQ29uc3VtZXJzIHN1YnNjcmliZSB0byBzbGljZXNcbiAgLy8gdmlhIHVzZVN5bmNFeHRlcm5hbFN0b3JlIGluIHVzZUFwcFN0YXRlKHNlbGVjdG9yKS5cbiAgY29uc3QgW3N0b3JlXSA9IHVzZVN0YXRlKCgpID0+XG4gICAgY3JlYXRlU3RvcmU8QXBwU3RhdGU+KFxuICAgICAgaW5pdGlhbFN0YXRlID8/IGdldERlZmF1bHRBcHBTdGF0ZSgpLFxuICAgICAgb25DaGFuZ2VBcHBTdGF0ZSxcbiAgICApLFxuICApXG5cbiAgLy8gQ2hlY2sgb24gbW91bnQgaWYgYnlwYXNzIG1vZGUgc2hvdWxkIGJlIGRpc2FibGVkXG4gIC8vIFRoaXMgaGFuZGxlcyB0aGUgcmFjZSBjb25kaXRpb24gd2hlcmUgcmVtb3RlIHNldHRpbmdzIGxvYWQgQkVGT1JFIHRoaXMgY29tcG9uZW50IG1vdW50cyxcbiAgLy8gbWVhbmluZyB0aGUgc2V0dGluZ3MgY2hhbmdlIG5vdGlmaWNhdGlvbiB3YXMgc2VudCB3aGVuIG5vIGxpc3RlbmVycyB3ZXJlIHN1YnNjcmliZWQuXG4gIC8vIE9uIHN1YnNlcXVlbnQgc2Vzc2lvbnMsIHRoZSBjYWNoZWQgcmVtb3RlLXNldHRpbmdzLmpzb24gaXMgcmVhZCBkdXJpbmcgaW5pdGlhbCBzZXR1cCxcbiAgLy8gYnV0IG9uIHRoZSBmaXJzdCBzZXNzaW9uIHRoZSByZW1vdGUgZmV0Y2ggbWF5IGNvbXBsZXRlIGJlZm9yZSBSZWFjdCBtb3VudHMuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgeyB0b29sUGVybWlzc2lvbkNvbnRleHQgfSA9IHN0b3JlLmdldFN0YXRlKClcbiAgICBpZiAoXG4gICAgICB0b29sUGVybWlzc2lvbkNvbnRleHQuaXNCeXBhc3NQZXJtaXNzaW9uc01vZGVBdmFpbGFibGUgJiZcbiAgICAgIGlzQnlwYXNzUGVybWlzc2lvbnNNb2RlRGlzYWJsZWQoKVxuICAgICkge1xuICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAnRGlzYWJsaW5nIGJ5cGFzcyBwZXJtaXNzaW9ucyBtb2RlIG9uIG1vdW50IChyZW1vdGUgc2V0dGluZ3MgbG9hZGVkIGJlZm9yZSBtb3VudCknLFxuICAgICAgKVxuICAgICAgc3RvcmUuc2V0U3RhdGUocHJldiA9PiAoe1xuICAgICAgICAuLi5wcmV2LFxuICAgICAgICB0b29sUGVybWlzc2lvbkNvbnRleHQ6IGNyZWF0ZURpc2FibGVkQnlwYXNzUGVybWlzc2lvbnNDb250ZXh0KFxuICAgICAgICAgIHByZXYudG9vbFBlcm1pc3Npb25Db250ZXh0LFxuICAgICAgICApLFxuICAgICAgfSkpXG4gICAgfVxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L2NvcnJlY3RuZXNzL3VzZUV4aGF1c3RpdmVEZXBlbmRlbmNpZXM6IGludGVudGlvbmFsIG1vdW50LW9ubHkgZWZmZWN0XG4gIH0sIFtdKVxuXG4gIC8vIExpc3RlbiBmb3IgZXh0ZXJuYWwgc2V0dGluZ3MgY2hhbmdlcyBhbmQgc3luYyB0byBBcHBTdGF0ZS5cbiAgLy8gVGhpcyBlbnN1cmVzIGZpbGUgd2F0Y2hlciBjaGFuZ2VzIHByb3BhZ2F0ZSB0aHJvdWdoIHRoZSBhcHAgLS1cbiAgLy8gc2hhcmVkIHdpdGggdGhlIGhlYWRsZXNzL1NESyBwYXRoIHZpYSBhcHBseVNldHRpbmdzQ2hhbmdlLlxuICBjb25zdCBvblNldHRpbmdzQ2hhbmdlID0gdXNlRWZmZWN0RXZlbnQoKHNvdXJjZTogU2V0dGluZ1NvdXJjZSkgPT5cbiAgICBhcHBseVNldHRpbmdzQ2hhbmdlKHNvdXJjZSwgc3RvcmUuc2V0U3RhdGUpLFxuICApXG4gIHVzZVNldHRpbmdzQ2hhbmdlKG9uU2V0dGluZ3NDaGFuZ2UpXG5cbiAgcmV0dXJuIChcbiAgICA8SGFzQXBwU3RhdGVDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt0cnVlfT5cbiAgICAgIDxBcHBTdG9yZUNvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3N0b3JlfT5cbiAgICAgICAgPE1haWxib3hQcm92aWRlcj5cbiAgICAgICAgICA8Vm9pY2VQcm92aWRlcj57Y2hpbGRyZW59PC9Wb2ljZVByb3ZpZGVyPlxuICAgICAgICA8L01haWxib3hQcm92aWRlcj5cbiAgICAgIDwvQXBwU3RvcmVDb250ZXh0LlByb3ZpZGVyPlxuICAgIDwvSGFzQXBwU3RhdGVDb250ZXh0LlByb3ZpZGVyPlxuICApXG59XG5cbmZ1bmN0aW9uIHVzZUFwcFN0b3JlKCk6IEFwcFN0YXRlU3RvcmUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvcnVsZXMtb2YtaG9va3NcbiAgY29uc3Qgc3RvcmUgPSB1c2VDb250ZXh0KEFwcFN0b3JlQ29udGV4dClcbiAgaWYgKCFzdG9yZSkge1xuICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcbiAgICAgICd1c2VBcHBTdGF0ZS91c2VTZXRBcHBTdGF0ZSBjYW5ub3QgYmUgY2FsbGVkIG91dHNpZGUgb2YgYW4gPEFwcFN0YXRlUHJvdmlkZXIgLz4nLFxuICAgIClcbiAgfVxuICByZXR1cm4gc3RvcmVcbn1cblxuLyoqXG4gKiBTdWJzY3JpYmUgdG8gYSBzbGljZSBvZiBBcHBTdGF0ZS4gT25seSByZS1yZW5kZXJzIHdoZW4gdGhlIHNlbGVjdGVkIHZhbHVlXG4gKiBjaGFuZ2VzIChjb21wYXJlZCB2aWEgT2JqZWN0LmlzKS5cbiAqXG4gKiBGb3IgbXVsdGlwbGUgaW5kZXBlbmRlbnQgZmllbGRzLCBjYWxsIHRoZSBob29rIG11bHRpcGxlIHRpbWVzOlxuICogYGBgXG4gKiBjb25zdCB2ZXJib3NlID0gdXNlQXBwU3RhdGUocyA9PiBzLnZlcmJvc2UpXG4gKiBjb25zdCBtb2RlbCA9IHVzZUFwcFN0YXRlKHMgPT4gcy5tYWluTG9vcE1vZGVsKVxuICogYGBgXG4gKlxuICogRG8gTk9UIHJldHVybiBuZXcgb2JqZWN0cyBmcm9tIHRoZSBzZWxlY3RvciAtLSBPYmplY3QuaXMgd2lsbCBhbHdheXMgc2VlXG4gKiB0aGVtIGFzIGNoYW5nZWQuIEluc3RlYWQsIHNlbGVjdCBhbiBleGlzdGluZyBzdWItb2JqZWN0IHJlZmVyZW5jZTpcbiAqIGBgYFxuICogY29uc3QgeyB0ZXh0LCBwcm9tcHRJZCB9ID0gdXNlQXBwU3RhdGUocyA9PiBzLnByb21wdFN1Z2dlc3Rpb24pIC8vIGdvb2RcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQXBwU3RhdGU8VD4oc2VsZWN0b3I6IChzdGF0ZTogQXBwU3RhdGUpID0+IFQpOiBUIHtcbiAgY29uc3Qgc3RvcmUgPSB1c2VBcHBTdG9yZSgpXG5cbiAgY29uc3QgZ2V0ID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKVxuICAgIGNvbnN0IHNlbGVjdGVkID0gc2VsZWN0b3Ioc3RhdGUpXG5cbiAgICBpZiAoXCJleHRlcm5hbFwiID09PSAnYW50JyAmJiBzdGF0ZSA9PT0gc2VsZWN0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFlvdXIgc2VsZWN0b3IgaW4gXFxgdXNlQXBwU3RhdGUoJHtzZWxlY3Rvci50b1N0cmluZygpfSlcXGAgcmV0dXJuZWQgdGhlIG9yaWdpbmFsIHN0YXRlLCB3aGljaCBpcyBub3QgYWxsb3dlZC4gWW91IG11c3QgaW5zdGVhZCByZXR1cm4gYSBwcm9wZXJ0eSBmb3Igb3B0aW1pc2VkIHJlbmRlcmluZy5gLFxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBzZWxlY3RlZFxuICB9XG5cbiAgcmV0dXJuIHVzZVN5bmNFeHRlcm5hbFN0b3JlKHN0b3JlLnN1YnNjcmliZSwgZ2V0LCBnZXQpXG59XG5cbi8qKlxuICogR2V0IHRoZSBzZXRBcHBTdGF0ZSB1cGRhdGVyIHdpdGhvdXQgc3Vic2NyaWJpbmcgdG8gYW55IHN0YXRlLlxuICogUmV0dXJucyBhIHN0YWJsZSByZWZlcmVuY2UgdGhhdCBuZXZlciBjaGFuZ2VzIC0tIGNvbXBvbmVudHMgdXNpbmcgb25seVxuICogdGhpcyBob29rIHdpbGwgbmV2ZXIgcmUtcmVuZGVyIGZyb20gc3RhdGUgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVNldEFwcFN0YXRlKCk6IChcbiAgdXBkYXRlcjogKHByZXY6IEFwcFN0YXRlKSA9PiBBcHBTdGF0ZSxcbikgPT4gdm9pZCB7XG4gIHJldHVybiB1c2VBcHBTdG9yZSgpLnNldFN0YXRlXG59XG5cbi8qKlxuICogR2V0IHRoZSBzdG9yZSBkaXJlY3RseSAoZm9yIHBhc3NpbmcgZ2V0U3RhdGUvc2V0U3RhdGUgdG8gbm9uLVJlYWN0IGNvZGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQXBwU3RhdGVTdG9yZSgpOiBBcHBTdGF0ZVN0b3JlIHtcbiAgcmV0dXJuIHVzZUFwcFN0b3JlKClcbn1cblxuY29uc3QgTk9PUF9TVUJTQ1JJQkUgPSAoKSA9PiAoKSA9PiB7fVxuXG4vKipcbiAqIFNhZmUgdmVyc2lvbiBvZiB1c2VBcHBTdGF0ZSB0aGF0IHJldHVybnMgdW5kZWZpbmVkIGlmIGNhbGxlZCBvdXRzaWRlIG9mIEFwcFN0YXRlUHJvdmlkZXIuXG4gKiBVc2VmdWwgZm9yIGNvbXBvbmVudHMgdGhhdCBtYXkgYmUgcmVuZGVyZWQgaW4gY29udGV4dHMgd2hlcmUgQXBwU3RhdGVQcm92aWRlciBpc24ndCBhdmFpbGFibGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1c2VBcHBTdGF0ZU1heWJlT3V0c2lkZU9mUHJvdmlkZXI8VD4oXG4gIHNlbGVjdG9yOiAoc3RhdGU6IEFwcFN0YXRlKSA9PiBULFxuKTogVCB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHN0b3JlID0gdXNlQ29udGV4dChBcHBTdG9yZUNvbnRleHQpXG4gIHJldHVybiB1c2VTeW5jRXh0ZXJuYWxTdG9yZShzdG9yZSA/IHN0b3JlLnN1YnNjcmliZSA6IE5PT1BfU1VCU0NSSUJFLCAoKSA9PlxuICAgIHN0b3JlID8gc2VsZWN0b3Ioc3RvcmUuZ2V0U3RhdGUoKSkgOiB1bmRlZmluZWQsXG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLE9BQU8sUUFBUSxZQUFZO0FBQ3BDLE9BQU9DLEtBQUssSUFDVkMsVUFBVSxFQUNWQyxTQUFTLEVBQ1RDLGNBQWMsRUFDZEMsUUFBUSxFQUNSQyxvQkFBb0IsUUFDZixPQUFPO0FBQ2QsU0FBU0MsZUFBZSxRQUFRLHVCQUF1QjtBQUN2RCxTQUFTQyxpQkFBaUIsUUFBUSwrQkFB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