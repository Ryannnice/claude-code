// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 React、createContext、RefObject、useContext、useLayoutEffect、useMemo，将 react 中已经封装好的能力接到本文件流程里。
import React, { createContext, type RefObject, useContext, useLayoutEffect, useMemo } from 'react';
// 类型依赖 { Key } 来自 ../ink.js，用于校准Keybinding Context的数据契约。
import type { Key } from '../ink.js';
// 引入 ChordResolveResult、getBindingDisplayText、resolveKeyWithChordState，将 ./resolver.js 中已经封装好的能力接到本文件流程里。
import { type ChordResolveResult, getBindingDisplayText, resolveKeyWithChordState } from './resolver.js';
// 类型依赖 { KeybindingContextName, ParsedBinding, ParsedKeystroke } 来自 ./types.js，用于校准Keybinding Context的数据契约。
import type { KeybindingContextName, ParsedBinding, ParsedKeystroke } from './types.js';

/** Handler registration for action callbacks */
// HandlerRegistration 固化Keybinding Context里传递的数据形状，帮助调用方按同一结构读写字段。
type HandlerRegistration = {
  action: string;
  context: KeybindingContextName;
  // 这个回调绑定到 handler: () => void;，负责Keybinding Context在该局部场景下的响应。
  handler: () => void;
};
// KeybindingContextValue 固化Keybinding Context里传递的数据形状，帮助调用方按同一结构读写字段。
type KeybindingContextValue = {
  /** Resolve a key input to an action name (with chord support) */
  // 这个回调绑定到 resolve: (input: string, key: Key, activeContexts: KeybindingContextName[]) => Chord…，负责Keybinding Context在该局部场景下的响应。
  resolve: (input: string, key: Key, activeContexts: KeybindingContextName[]) => ChordResolveResult;

  /** Update the pending chord state */
  // 这个回调绑定到 setPendingChord: (pending: ParsedKeystroke[] | null) => void;，负责Keybinding Context在该局部场景下的响应。
  setPendingChord: (pending: ParsedKeystroke[] | null) => void;

  /** Get display text for an action (e.g., "ctrl+t") */
  // 这个回调绑定到 getDisplayText: (action: string, context: KeybindingContextName) => string | undefin…，负责Keybinding Context在该局部场景下的响应。
  getDisplayText: (action: string, context: KeybindingContextName) => string | undefined;

  /** All parsed bindings (for help display) */
  bindings: ParsedBinding[];

  /** Current pending chord keystrokes (null if not in a chord) */
  pendingChord: ParsedKeystroke[] | null;

  /** Currently active keybinding contexts (for priority resolution) */
  activeContexts: Set<KeybindingContextName>;

  /** Register a context as active (call on mount) */
  // 这个回调绑定到 registerActiveContext: (context: KeybindingContextName) => void;，负责Keybinding Context在该局部场景下的响应。
  registerActiveContext: (context: KeybindingContextName) => void;

  /** Unregister a context (call on unmount) */
  // 这个回调绑定到 unregisterActiveContext: (context: KeybindingContextName) => void;，负责Keybinding Context在该局部场景下的响应。
  unregisterActiveContext: (context: KeybindingContextName) => void;

  /** Register a handler for an action (used by useKeybinding) */
  // 这个回调绑定到 registerHandler: (registration: HandlerRegistration) => () => void;，负责Keybinding Context在该局部场景下的响应。
  registerHandler: (registration: HandlerRegistration) => () => void;

  /** Invoke all handlers for an action (used by ChordInterceptor) */
  // 这个回调绑定到 invokeAction: (action: string) => boolean;，负责Keybinding Context在该局部场景下的响应。
  invokeAction: (action: string) => boolean;
};
// KeybindingContext构建`createContext<KeybindingContextValue | null>(null)` 整理出中间结果，供Keybinding Context后续步骤使用。
const KeybindingContext = createContext<KeybindingContextValue | null>(null);
// ProviderProps 固化Keybinding Context里传递的数据形状，帮助调用方按同一结构读写字段。
type ProviderProps = {
  bindings: ParsedBinding[];
  /** Ref for immediate access to pending chord (avoids React state delay) */
  pendingChordRef: RefObject<ParsedKeystroke[] | null>;
  /** State value for re-renders (UI updates) */
  pendingChord: ParsedKeystroke[] | null;
  // 这个回调绑定到 setPendingChord: (pending: ParsedKeystroke[] | null) => void;，负责Keybinding Context在该局部场景下的响应。
  setPendingChord: (pending: ParsedKeystroke[] | null) => void;
  activeContexts: Set<KeybindingContextName>;
  // 这个回调绑定到 registerActiveContext: (context: KeybindingContextName) => void;，负责Keybinding Context在该局部场景下的响应。
  registerActiveContext: (context: KeybindingContextName) => void;
  // 这个回调绑定到 unregisterActiveContext: (context: KeybindingContextName) => void;，负责Keybinding Context在该局部场景下的响应。
  unregisterActiveContext: (context: KeybindingContextName) => void;
  /** Ref to handler registry (used by ChordInterceptor) */
  handlerRegistryRef: RefObject<Map<string, Set<HandlerRegistration>>>;
  children: React.ReactNode;
};
// KeybindingProvider 封装KeybindingContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function KeybindingProvider(t0) {
  // $保存`_c`，供Keybinding Context后续处理使用。
  const $ = _c(24);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    bindings,
    pendingChordRef,
    pendingChord,
    setPendingChord,
    activeContexts,
    registerActiveContext,
    unregisterActiveContext,
    handlerRegistryRef,
    children
  } = t0;
  // t1 暂存 `(action, context) => getBindingDisplayText(action, contex...` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== bindings) {
    // t1 暂存 `(action, context) => getBindingDisplayText(action, contex...` 生成的渲染片段，后续返回路径直接复用。
    t1 = (action, context) => getBindingDisplayText(action, context, bindings);
    // $[0] 缓存 `bindings`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = bindings;
    // $[1] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[1];
  }
  // getDisplay 命名 `t1`，让后续代码直接表达这个值的用途。
  const getDisplay = t1;
  // t2 暂存 `registration => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[2] !== handlerRegistryRef) {
    // t2 暂存 `registration => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = registration => {
      // registry 命名 `handlerRegistryRef.current`，让后续代码直接表达这个值的用途。
      const registry = handlerRegistryRef.current;
      // registry缺失时提前走兜底路径，避免Keybinding Context继续依赖无效输入。
      if (!registry) {
        // 返回 `_temp`，作为Keybinding Context这次计算的结果。
        return _temp;
      }
      // 满足 `!registry.has(registration.action)` 时，Keybinding Context执行该分支。
      if (!registry.has(registration.action)) {
        // registry.set 写入新的状态值，使Keybinding Context后续读取保持一致。
        registry.set(registration.action, new Set());
      }
      // 调用 registry.get，触发Keybinding Context此处需要的副作用。
      registry.get(registration.action).add(registration);
      // 返回 `() => {`，作为Keybinding Context这次计算的结果。
      return () => {
        // handlers 集合读取`registry.get`，供Keybinding Context后续处理使用。
        const handlers = registry.get(registration.action);
        // 满足 `handlers` 时，Keybinding Context执行该分支。
        if (handlers) {
          // 调用 handlers.delete，触发Keybinding Context此处需要的副作用。
          handlers.delete(registration);
          // 满足 `handlers.size === 0` 时，Keybinding Context执行该分支。
          if (handlers.size === 0) {
            // 调用 registry.delete，触发Keybinding Context此处需要的副作用。
            registry.delete(registration.action);
          }
        }
      };
    };
    // $[2] 缓存 `handlerRegistryRef`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = handlerRegistryRef;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // registerHandler保存`t2`，作为后续临时缓存值处理的输入。
  const registerHandler = t2;
  // t3 暂存 `action_0 => {` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== activeContexts || $[5] !== handlerRegistryRef) {
    // t3 暂存 `action_0 => {` 生成的渲染片段，后续返回路径直接复用。
    t3 = action_0 => {
      // registry_0保存`handlerRegistryRef.current`，供后续判断或组装使用。
      const registry_0 = handlerRegistryRef.current;
      // registry_0缺失时提前走兜底路径，避免Keybinding Context继续依赖无效输入。
      if (!registry_0) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
      // handlers_0读取`registry_0.get`，供Keybinding Context后续处理使用。
      const handlers_0 = registry_0.get(action_0);
      // 组合条件 `!handlers_0 || handlers_0.size === 0` 成立时，Keybinding Context才启用这条专门路径。
      if (!handlers_0 || handlers_0.size === 0) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false;
      }
      // 按顺序遍历 `handlers_0` 中的registration_0，逐个交给Keybinding Context处理。
      for (const registration_0 of handlers_0) {
        // 满足 `activeContexts.has(registration_0.context)` 时，Keybinding Context执行该分支。
        if (activeContexts.has(registration_0.context)) {
          // 调用 registration_0.handler，触发Keybinding Context此处需要的副作用。
          registration_0.handler();
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true;
        }
      }
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false;
    };
    // $[4] 缓存 `activeContexts`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = activeContexts;
    // $[5] 缓存 `handlerRegistryRef`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = handlerRegistryRef;
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // invokeAction 命名 `t3`，让后续代码直接表达这个值的用途。
  const invokeAction = t3;
  // t4 暂存 `(input, key, contexts) => resolveKeyWithChordState(input,...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== bindings || $[8] !== pendingChordRef) {
    // t4 暂存 `(input, key, contexts) => resolveKeyWithChordState(input,...` 生成的渲染片段，后续返回路径直接复用。
    t4 = (input, key, contexts) => resolveKeyWithChordState(input, key, contexts, bindings, pendingChordRef.current);
    // $[7] 缓存 `bindings`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = bindings;
    // $[8] 缓存 `pendingChordRef`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = pendingChordRef;
    // $[9] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[9];
  }
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[10] !== activeContexts || $[11] !== bindings || $[12] !== getDisplay || $[13] !== invokeAction || $[14] !== pendingChord || $[15] !== registerActiveContext || $[16] !== registerHandler || $[17] !== setPendingChord || $[18] !== t4 || $[19] !== unregisterActiveContext) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      resolve: t4,
      setPendingChord,
      getDisplayText: getDisplay,
      bindings,
      pendingChord,
      activeContexts,
      registerActiveContext,
      unregisterActiveContext,
      registerHandler,
      invokeAction
    };
    // $[10] 缓存 `activeContexts`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = activeContexts;
    // $[11] 缓存 `bindings`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = bindings;
    // $[12] 缓存 `getDisplay`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = getDisplay;
    // $[13] 缓存 `invokeAction`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = invokeAction;
    // $[14] 缓存 `pendingChord`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = pendingChord;
    // $[15] 缓存 `registerActiveContext`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = registerActiveContext;
    // $[16] 缓存 `registerHandler`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = registerHandler;
    // $[17] 缓存 `setPendingChord`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = setPendingChord;
    // $[18] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t4;
    // $[19] 缓存 `unregisterActiveContext`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = unregisterActiveContext;
    // $[20] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[20] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[20];
  }
  // 取值保存`t5`，作为后续临时缓存值处理的输入。
  const value = t5;
  // t6 暂存 `<KeybindingContext.Provider value={value}>{children}</Key...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[21] !== children || $[22] !== value) {
    // t6 暂存 `<KeybindingContext.Provider value={value}>{children}</Key...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <KeybindingContext.Provider value={value}>{children}</KeybindingContext.Provider>;
    // $[21] 缓存 `children`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = children;
    // $[22] 缓存 `value`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = value;
    // $[23] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[23] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[23] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[23];
  }
  // 返回 `t6`，作为Keybinding Context这次计算的结果。
  return t6;
}
// _temp 封装KeybindingContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {}
// useKeybindingContext 封装KeybindingContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useKeybindingContext() {
  // ctx保存`useContext`，供Keybinding Context后续处理使用。
  const ctx = useContext(KeybindingContext);
  // ctx缺失时提前走兜底路径，避免Keybinding Context继续依赖无效输入。
  if (!ctx) {
    // 抛出 new Error("useKeybindingContext must be used within KeybindingProvider");，阻止Keybinding Context在无效状态下继续运行。
    throw new Error("useKeybindingContext must be used within KeybindingProvider");
  }
  // 返回 `ctx`，作为Keybinding Context这次计算的结果。
  return ctx;
}

/**
 * Optional hook that returns undefined outside of KeybindingProvider.
 * Useful for components that may render before provider is available.
 */
// useOptionalKeybindingContext 封装KeybindingContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useOptionalKeybindingContext() {
  // 返回 `useContext(KeybindingContext)`，作为Keybinding Context这次计算的结果。
  return useContext(KeybindingContext);
}

/**
 * Hook to register a keybinding context as active while the component is mounted.
 *
 * When a context is registered, its keybindings take precedence over Global bindings.
 * This allows context-specific bindings (like ThemePicker's ctrl+t) to override
 * global bindings (like the todo toggle) when the context is active.
 *
 * @example
 * ```tsx
 * function ThemePicker() {
 *   useRegisterKeybindingContext('ThemePicker')
 *   // Now ThemePicker's ctrl+t binding takes precedence over Global
 * }
 * ```
 */
// useRegisterKeybindingContext 封装KeybindingContext的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useRegisterKeybindingContext(context, t0) {
  // $保存`_c`，供Keybinding Context后续处理使用。
  const $ = _c(5);
  // isActive标记Keybinding Context是否启用对应路径。
  const isActive = t0 === undefined ? true : t0;
  // keybindingContext保存`useOptionalKeybindingContext`，供Keybinding Context后续处理使用。
  const keybindingContext = useOptionalKeybindingContext();
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 暂存 `[context, keybindingContext, isActive]` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== context || $[1] !== isActive || $[2] !== keybindingContext) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // 组合条件 `!keybindingContext || !isActive` 成立时，Keybinding Context才启用这条专门路径。
      if (!keybindingContext || !isActive) {
        // Keybinding Context在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 调用 keybindingContext.registerActiveContext，触发Keybinding Context此处需要的副作用。
      keybindingContext.registerActiveContext(context);
      // 返回 `() => {`，作为Keybinding Context这次计算的结果。
      return () => {
        // 调用 keybindingContext.unregisterActiveContext，触发Keybinding Context此处需要的副作用。
        keybindingContext.unregisterActiveContext(context);
      };
    };
    // t2 暂存 `[context, keybindingContext, isActive]` 生成的渲染片段，后续返回路径直接复用。
    t2 = [context, keybindingContext, isActive];
    // $[0] 缓存 `context`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = context;
    // $[1] 缓存 `isActive`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isActive;
    // $[2] 缓存 `keybindingContext`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = keybindingContext;
    // $[3] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t1;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[3];
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // 调用 useLayoutEffect，触发Keybinding Context此处需要的副作用。
  useLayoutEffect(t1, t2);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNyZWF0ZUNvbnRleHQiLCJSZWZPYmplY3QiLCJ1c2VDb250ZXh0IiwidXNlTGF5b3V0RWZmZWN0IiwidXNlTWVtbyIsIktleSIsIkNob3JkUmVzb2x2ZVJlc3VsdCIsImdldEJpbmRpbmdEaXNwbGF5VGV4dCIsInJlc29sdmVLZXlXaXRoQ2hvcmRTdGF0ZSIsIktleWJpbmRpbmdDb250ZXh0TmFtZSIsIlBhcnNlZEJpbmRpbmciLCJQYXJzZWRLZXlzdHJva2UiLCJIYW5kbGVyUmVnaXN0cmF0aW9uIiwiYWN0aW9uIiwiY29udGV4dCIsImhhbmRsZXIiLCJLZXliaW5kaW5nQ29udGV4dFZhbHVlIiwicmVzb2x2ZSIsImlucHV0Iiwia2V5IiwiYWN0aXZlQ29udGV4dHMiLCJzZXRQZW5kaW5nQ2hvcmQiLCJwZW5kaW5nIiwiZ2V0RGlzcGxheVRleHQiLCJiaW5kaW5ncyIsInBlbmRpbmdDaG9yZCIsIlNldCIsInJlZ2lzdGVyQWN0aXZlQ29udGV4dCIsInVucmVnaXN0ZXJBY3RpdmVDb250ZXh0IiwicmVnaXN0ZXJIYW5kbGVyIiwicmVnaXN0cmF0aW9uIiwiaW52b2tlQWN0aW9uIiwiS2V5YmluZGluZ0NvbnRleHQiLCJQcm92aWRlclByb3BzIiwicGVuZGluZ0Nob3JkUmVmIiwiaGFuZGxlclJlZ2lzdHJ5UmVmIiwiTWFwIiwiY2hpbGRyZW4iLCJSZWFjdE5vZGUiLCJLZXliaW5kaW5nUHJvdmlkZXIiLCJ0MCIsIiQiLCJfYyIsInQxIiwiZ2V0RGlzcGxheSIsInQyIiwicmVnaXN0cnkiLCJjdXJyZW50IiwiX3RlbXAiLCJoYXMiLCJzZXQiLCJnZXQiLCJhZGQiLCJoYW5kbGVycyIsImRlbGV0ZSIsInNpemUiLCJ0MyIsImFjdGlvbl8wIiwicmVnaXN0cnlfMCIsImhhbmRsZXJzXzAiLCJyZWdpc3RyYXRpb25fMCIsInQ0IiwiY29udGV4dHMiLCJ0NSIsInZhbHVlIiwidDYiLCJ1c2VLZXliaW5kaW5nQ29udGV4dCIsImN0eCIsIkVycm9yIiwidXNlT3B0aW9uYWxLZXliaW5kaW5nQ29udGV4dCIsInVzZVJlZ2lzdGVyS2V5YmluZGluZ0NvbnRleHQiLCJpc0FjdGl2ZSIsInVuZGVmaW5lZCIsImtleWJpbmRpbmdDb250ZXh0Il0sInNvdXJjZXMiOlsiS2V5YmluZGluZ0NvbnRleHQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwge1xuICBjcmVhdGVDb250ZXh0LFxuICB0eXBlIFJlZk9iamVjdCxcbiAgdXNlQ29udGV4dCxcbiAgdXNlTGF5b3V0RWZmZWN0LFxuICB1c2VNZW1vLFxufSBmcm9tICdyZWFjdCdcbmltcG9ydCB0eXBlIHsgS2V5IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBDaG9yZFJlc29sdmVSZXN1bHQsXG4gIGdldEJpbmRpbmdEaXNwbGF5VGV4dCxcbiAgcmVzb2x2ZUtleVdpdGhDaG9yZFN0YXRlLFxufSBmcm9tICcuL3Jlc29sdmVyLmpzJ1xuaW1wb3J0IHR5cGUge1xuICBLZXliaW5kaW5nQ29udGV4dE5hbWUsXG4gIFBhcnNlZEJpbmRpbmcsXG4gIFBhcnNlZEtleXN0cm9rZSxcbn0gZnJvbSAnLi90eXBlcy5qcydcblxuLyoqIEhhbmRsZXIgcmVnaXN0cmF0aW9uIGZvciBhY3Rpb24gY2FsbGJhY2tzICovXG50eXBlIEhhbmRsZXJSZWdpc3RyYXRpb24gPSB7XG4gIGFjdGlvbjogc3RyaW5nXG4gIGNvbnRleHQ6IEtleWJpbmRpbmdDb250ZXh0TmFtZVxuICBoYW5kbGVyOiAoKSA9PiB2b2lkXG59XG5cbnR5cGUgS2V5YmluZGluZ0NvbnRleHRWYWx1ZSA9IHtcbiAgLyoqIFJlc29sdmUgYSBrZXkgaW5wdXQgdG8gYW4gYWN0aW9uIG5hbWUgKHdpdGggY2hvcmQgc3VwcG9ydCkgKi9cbiAgcmVzb2x2ZTogKFxuICAgIGlucHV0OiBzdHJpbmcsXG4gICAga2V5OiBLZXksXG4gICAgYWN0aXZlQ29udGV4dHM6IEtleWJpbmRpbmdDb250ZXh0TmFtZVtdLFxuICApID0+IENob3JkUmVzb2x2ZVJlc3VsdFxuXG4gIC8qKiBVcGRhdGUgdGhlIHBlbmRpbmcgY2hvcmQgc3RhdGUgKi9cbiAgc2V0UGVuZGluZ0Nob3JkOiAocGVuZGluZzogUGFyc2VkS2V5c3Ryb2tlW10gfCBudWxsKSA9PiB2b2lkXG5cbiAgLyoqIEdldCBkaXNwbGF5IHRleHQgZm9yIGFuIGFjdGlvbiAoZS5nLiwgXCJjdHJsK3RcIikgKi9cbiAgZ2V0RGlzcGxheVRleHQ6IChcbiAgICBhY3Rpb246IHN0cmluZyxcbiAgICBjb250ZXh0OiBLZXliaW5kaW5nQ29udGV4dE5hbWUsXG4gICkgPT4gc3RyaW5nIHwgdW5kZWZpbmVkXG5cbiAgLyoqIEFsbCBwYXJzZWQgYmluZGluZ3MgKGZvciBoZWxwIGRpc3BsYXkpICovXG4gIGJpbmRpbmdzOiBQYXJzZWRCaW5kaW5nW11cblxuICAvKiogQ3VycmVudCBwZW5kaW5nIGNob3JkIGtleXN0cm9rZXMgKG51bGwgaWYgbm90IGluIGEgY2hvcmQpICovXG4gIHBlbmRpbmdDaG9yZDogUGFyc2VkS2V5c3Ryb2tlW10gfCBudWxsXG5cbiAgLyoqIEN1cnJlbnRseSBhY3RpdmUga2V5YmluZGluZyBjb250ZXh0cyAoZm9yIHByaW9yaXR5IHJlc29sdXRpb24pICovXG4gIGFjdGl2ZUNvbnRleHRzOiBTZXQ8S2V5YmluZGluZ0NvbnRleHROYW1lPlxuXG4gIC8qKiBSZWdpc3RlciBhIGNvbnRleHQgYXMgYWN0aXZlIChjYWxsIG9uIG1vdW50KSAqL1xuICByZWdpc3RlckFjdGl2ZUNvbnRleHQ6IChjb250ZXh0OiBLZXliaW5kaW5nQ29udGV4dE5hbWUpID0+IHZvaWRcblxuICAvKiogVW5yZWdpc3RlciBhIGNvbnRleHQgKGNhbGwgb24gdW5tb3VudCkgKi9cbiAgdW5yZWdpc3RlckFjdGl2ZUNvbnRleHQ6IChjb250ZXh0OiBLZXliaW5kaW5nQ29udGV4dE5hbWUpID0+IHZvaWRcblxuICAvKiogUmVnaXN0ZXIgYSBoYW5kbGVyIGZvciBhbiBhY3Rpb24gKHVzZWQgYnkgdXNlS2V5YmluZGluZykgKi9cbiAgcmVnaXN0ZXJIYW5kbGVyOiAocmVnaXN0cmF0aW9uOiBIYW5kbGVyUmVnaXN0cmF0aW9uKSA9PiAoKSA9PiB2b2lkXG5cbiAgLyoqIEludm9rZSBhbGwgaGFuZGxlcnMgZm9yIGFuIGFjdGlvbiAodXNlZCBieSBDaG9yZEludGVyY2VwdG9yKSAqL1xuICBpbnZva2VBY3Rpb246IChhY3Rpb246IHN0cmluZykgPT4gYm9vbGVhblxufVxuXG5jb25zdCBLZXliaW5kaW5nQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQ8S2V5YmluZGluZ0NvbnRleHRWYWx1ZSB8IG51bGw+KG51bGwpXG5cbnR5cGUgUHJvdmlkZXJQcm9wcyA9IHtcbiAgYmluZGluZ3M6IFBhcnNlZEJpbmRpbmdbXVxuICAvKiogUmVmIGZvciBpbW1lZGlhdGUgYWNjZXNzIHRvIHBlbmRpbmcgY2hvcmQgKGF2b2lkcyBSZWFjdCBzdGF0ZSBkZWxheSkgKi9cbiAgcGVuZGluZ0Nob3JkUmVmOiBSZWZPYmplY3Q8UGFyc2VkS2V5c3Ryb2tlW10gfCBudWxsPlxuICAvKiogU3RhdGUgdmFsdWUgZm9yIHJlLXJlbmRlcnMgKFVJIHVwZGF0ZXMpICovXG4gIHBlbmRpbmdDaG9yZDogUGFyc2VkS2V5c3Ryb2tlW10gfCBudWxsXG4gIHNldFBlbmRpbmdDaG9yZDogKHBlbmRpbmc6IFBhcnNlZEtleXN0cm9rZVtdIHwgbnVsbCkgPT4gdm9pZFxuICBhY3RpdmVDb250ZXh0czogU2V0PEtleWJpbmRpbmdDb250ZXh0TmFtZT5cbiAgcmVnaXN0ZXJBY3RpdmVDb250ZXh0OiAoY29udGV4dDogS2V5YmluZGluZ0NvbnRleHROYW1lKSA9PiB2b2lkXG4gIHVucmVnaXN0ZXJBY3RpdmVDb250ZXh0OiAoY29udGV4dDogS2V5YmluZGluZ0NvbnRleHROYW1lKSA9PiB2b2lkXG4gIC8qKiBSZWYgdG8gaGFuZGxlciByZWdpc3RyeSAodXNlZCBieSBDaG9yZEludGVyY2VwdG9yKSAqL1xuICBoYW5kbGVyUmVnaXN0cnlSZWY6IFJlZk9iamVjdDxNYXA8c3RyaW5nLCBTZXQ8SGFuZGxlclJlZ2lzdHJhdGlvbj4+PlxuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBLZXliaW5kaW5nUHJvdmlkZXIoe1xuICBiaW5kaW5ncyxcbiAgcGVuZGluZ0Nob3JkUmVmLFxuICBwZW5kaW5nQ2hvcmQsXG4gIHNldFBlbmRpbmdDaG9yZCxcbiAgYWN0aXZlQ29udGV4dHMsXG4gIHJlZ2lzdGVyQWN0aXZlQ29udGV4dCxcbiAgdW5yZWdpc3RlckFjdGl2ZUNvbnRleHQsXG4gIGhhbmRsZXJSZWdpc3RyeVJlZixcbiAgY2hpbGRyZW4sXG59OiBQcm92aWRlclByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgdmFsdWUgPSB1c2VNZW1vPEtleWJpbmRpbmdDb250ZXh0VmFsdWU+KCgpID0+IHtcbiAgICBjb25zdCBnZXREaXNwbGF5ID0gKGFjdGlvbjogc3RyaW5nLCBjb250ZXh0OiBLZXliaW5kaW5nQ29udGV4dE5hbWUpID0+XG4gICAgICBnZXRCaW5kaW5nRGlzcGxheVRleHQoYWN0aW9uLCBjb250ZXh0LCBiaW5kaW5ncylcblxuICAgIC8vIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3IgYW4gYWN0aW9uXG4gICAgY29uc3QgcmVnaXN0ZXJIYW5kbGVyID0gKHJlZ2lzdHJhdGlvbjogSGFuZGxlclJlZ2lzdHJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgcmVnaXN0cnkgPSBoYW5kbGVyUmVnaXN0cnlSZWYuY3VycmVudFxuICAgICAgaWYgKCFyZWdpc3RyeSkgcmV0dXJuICgpID0+IHt9XG5cbiAgICAgIGlmICghcmVnaXN0cnkuaGFzKHJlZ2lzdHJhdGlvbi5hY3Rpb24pKSB7XG4gICAgICAgIHJlZ2lzdHJ5LnNldChyZWdpc3RyYXRpb24uYWN0aW9uLCBuZXcgU2V0KCkpXG4gICAgICB9XG4gICAgICByZWdpc3RyeS5nZXQocmVnaXN0cmF0aW9uLmFjdGlvbikhLmFkZChyZWdpc3RyYXRpb24pXG5cbiAgICAgIC8vIFJldHVybiB1bnJlZ2lzdGVyIGZ1bmN0aW9uXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGVycyA9IHJlZ2lzdHJ5LmdldChyZWdpc3RyYXRpb24uYWN0aW9uKVxuICAgICAgICBpZiAoaGFuZGxlcnMpIHtcbiAgICAgICAgICBoYW5kbGVycy5kZWxldGUocmVnaXN0cmF0aW9uKVxuICAgICAgICAgIGlmIChoYW5kbGVycy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICByZWdpc3RyeS5kZWxldGUocmVnaXN0cmF0aW9uLmFjdGlvbilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbnZva2UgYWxsIGhhbmRsZXJzIGZvciBhbiBhY3Rpb25cbiAgICBjb25zdCBpbnZva2VBY3Rpb24gPSAoYWN0aW9uOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICAgIGNvbnN0IHJlZ2lzdHJ5ID0gaGFuZGxlclJlZ2lzdHJ5UmVmLmN1cnJlbnRcbiAgICAgIGlmICghcmVnaXN0cnkpIHJldHVybiBmYWxzZVxuXG4gICAgICBjb25zdCBoYW5kbGVycyA9IHJlZ2lzdHJ5LmdldChhY3Rpb24pXG4gICAgICBpZiAoIWhhbmRsZXJzIHx8IGhhbmRsZXJzLnNpemUgPT09IDApIHJldHVybiBmYWxzZVxuXG4gICAgICAvLyBGaW5kIGhhbmRsZXJzIHdob3NlIGNvbnRleHQgaXMgYWN0aXZlXG4gICAgICBmb3IgKGNvbnN0IHJlZ2lzdHJhdGlvbiBvZiBoYW5kbGVycykge1xuICAgICAgICBpZiAoYWN0aXZlQ29udGV4dHMuaGFzKHJlZ2lzdHJhdGlvbi5jb250ZXh0KSkge1xuICAgICAgICAgIHJlZ2lzdHJhdGlvbi5oYW5kbGVyKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgLy8gVXNlIHJlZiBmb3IgaW1tZWRpYXRlIGFjY2VzcyB0byBwZW5kaW5nIGNob3JkLCBhdm9pZGluZyBSZWFjdCBzdGF0ZSBkZWxheVxuICAgICAgLy8gVGhpcyBpcyBjcml0aWNhbCBmb3IgY2hvcmQgc2VxdWVuY2VzIHdoZXJlIHRoZSBzZWNvbmQga2V5IG1pZ2h0IGJlIHByZXNzZWRcbiAgICAgIC8vIGJlZm9yZSBSZWFjdCByZS1yZW5kZXJzIHdpdGggdGhlIHVwZGF0ZWQgcGVuZGluZ0Nob3JkIHN0YXRlXG4gICAgICByZXNvbHZlOiAoaW5wdXQsIGtleSwgY29udGV4dHMpID0+XG4gICAgICAgIHJlc29sdmVLZXlXaXRoQ2hvcmRTdGF0ZShcbiAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgY29udGV4dHMsXG4gICAgICAgICAgYmluZGluZ3MsXG4gICAgICAgICAgcGVuZGluZ0Nob3JkUmVmLmN1cnJlbnQsXG4gICAgICAgICksXG4gICAgICBzZXRQZW5kaW5nQ2hvcmQsXG4gICAgICBnZXREaXNwbGF5VGV4dDogZ2V0RGlzcGxheSxcbiAgICAgIGJpbmRpbmdzLFxuICAgICAgcGVuZGluZ0Nob3JkLFxuICAgICAgYWN0aXZlQ29udGV4dHMsXG4gICAgICByZWdpc3RlckFjdGl2ZUNvbnRleHQsXG4gICAgICB1bnJlZ2lzdGVyQWN0aXZlQ29udGV4dCxcbiAgICAgIHJlZ2lzdGVySGFuZGxlcixcbiAgICAgIGludm9rZUFjdGlvbixcbiAgICB9XG4gIH0sIFtcbiAgICBiaW5kaW5ncyxcbiAgICBwZW5kaW5nQ2hvcmRSZWYsXG4gICAgcGVuZGluZ0Nob3JkLFxuICAgIHNldFBlbmRpbmdDaG9yZCxcbiAgICBhY3RpdmVDb250ZXh0cyxcbiAgICByZWdpc3RlckFjdGl2ZUNvbnRleHQsXG4gICAgdW5yZWdpc3RlckFjdGl2ZUNvbnRleHQsXG4gICAgaGFuZGxlclJlZ2lzdHJ5UmVmLFxuICBdKVxuXG4gIHJldHVybiAoXG4gICAgPEtleWJpbmRpbmdDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt2YWx1ZX0+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9LZXliaW5kaW5nQ29udGV4dC5Qcm92aWRlcj5cbiAgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlS2V5YmluZGluZ0NvbnRleHQoKTogS2V5YmluZGluZ0NvbnRleHRWYWx1ZSB7XG4gIGNvbnN0IGN0eCA9IHVzZUNvbnRleHQoS2V5YmluZGluZ0NvbnRleHQpXG4gIGlmICghY3R4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ3VzZUtleWJpbmRpbmdDb250ZXh0IG11c3QgYmUgdXNlZCB3aXRoaW4gS2V5YmluZGluZ1Byb3ZpZGVyJyxcbiAgICApXG4gIH1cbiAgcmV0dXJuIGN0eFxufVxuXG4vKipcbiAqIE9wdGlvbmFsIGhvb2sgdGhhdCByZXR1cm5zIHVuZGVmaW5lZCBvdXRzaWRlIG9mIEtleWJpbmRpbmdQcm92aWRlci5cbiAqIFVzZWZ1bCBmb3IgY29tcG9uZW50cyB0aGF0IG1heSByZW5kZXIgYmVmb3JlIHByb3ZpZGVyIGlzIGF2YWlsYWJsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZU9wdGlvbmFsS2V5YmluZGluZ0NvbnRleHQoKTogS2V5YmluZGluZ0NvbnRleHRWYWx1ZSB8IG51bGwge1xuICByZXR1cm4gdXNlQ29udGV4dChLZXliaW5kaW5nQ29udGV4dClcbn1cblxuLyoqXG4gKiBIb29rIHRvIHJlZ2lzdGVyIGEga2V5YmluZGluZyBjb250ZXh0IGFzIGFjdGl2ZSB3aGlsZSB0aGUgY29tcG9uZW50IGlzIG1vdW50ZWQuXG4gKlxuICogV2hlbiBhIGNvbnRleHQgaXMgcmVnaXN0ZXJlZCwgaXRzIGtleWJpbmRpbmdzIHRha2UgcHJlY2VkZW5jZSBvdmVyIEdsb2JhbCBiaW5kaW5ncy5cbiAqIFRoaXMgYWxsb3dzIGNvbnRleHQtc3BlY2lmaWMgYmluZGluZ3MgKGxpa2UgVGhlbWVQaWNrZXIncyBjdHJsK3QpIHRvIG92ZXJyaWRlXG4gKiBnbG9iYWwgYmluZGluZ3MgKGxpa2UgdGhlIHRvZG8gdG9nZ2xlKSB3aGVuIHRoZSBjb250ZXh0IGlzIGFjdGl2ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHN4XG4gKiBmdW5jdGlvbiBUaGVtZVBpY2tlcigpIHtcbiAqICAgdXNlUmVnaXN0ZXJLZXliaW5kaW5nQ29udGV4dCgnVGhlbWVQaWNrZXInKVxuICogICAvLyBOb3cgVGhlbWVQaWNrZXIncyBjdHJsK3QgYmluZGluZyB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgR2xvYmFsXG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVzZVJlZ2lzdGVyS2V5YmluZGluZ0NvbnRleHQoXG4gIGNvbnRleHQ6IEtleWJpbmRpbmdDb250ZXh0TmFtZSxcbiAgaXNBY3RpdmU6IGJvb2xlYW4gPSB0cnVlLFxuKTogdm9pZCB7XG4gIGNvbnN0IGtleWJpbmRpbmdDb250ZXh0ID0gdXNlT3B0aW9uYWxLZXliaW5kaW5nQ29udGV4dCgpXG5cbiAgdXNlTGF5b3V0RWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIWtleWJpbmRpbmdDb250ZXh0IHx8ICFpc0FjdGl2ZSkgcmV0dXJuXG5cbiAgICBrZXliaW5kaW5nQ29udGV4dC5yZWdpc3RlckFjdGl2ZUNvbnRleHQoY29udGV4dClcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAga2V5YmluZGluZ0NvbnRleHQudW5yZWdpc3RlckFjdGl2ZUNvbnRleHQoY29udGV4dClcbiAgICB9XG4gIH0sIFtjb250ZXh0LCBrZXliaW5kaW5nQ29udGV4dCwgaXNBY3RpdmVdKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBT0EsS0FBSyxJQUNWQyxhQUFhLEVBQ2IsS0FBS0MsU0FBUyxFQUNkQyxVQUFVLEVBQ1ZDLGVBQWUsRUFDZkMsT0FBTyxRQUNGLE9BQU87QUFDZCxjQUFjQyxHQUFHLFFBQVEsV0FBVztBQUNwQyxTQUNFLEtBQUtDLGtCQUFrQixFQUN2QkMscUJBQXFCLEVBQ3JCQyx3QkFBd0IsUUFDbkIsZUFBZTtBQUN0QixjQUNFQyxxQkFBcUIs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