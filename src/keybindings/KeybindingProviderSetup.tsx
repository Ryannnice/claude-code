// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
/**
 * Setup utilities for integrating KeybindingProvider into the app.
 *
 * This file provides the bindings and a composed provider that can be
 * added to the app's component tree. It loads both default bindings and
 * user-defined bindings from ~/.claude/keybindings.json, with hot-reload
 * support when the file changes.
 */
// 引入 React、useCallback、useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import React, { useCallback, useEffect, useRef, useState } from 'react';
// 引入 useNotifications，将 ../context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from '../context/notifications.js';
// 类型依赖 { InputEvent } 来自 ../ink/events/input-event.js，用于校准Keybinding Provider Setup的数据契约。
import type { InputEvent } from '../ink/events/input-event.js';
// ChordInterceptor intentionally uses useInput to intercept all keystrokes before
// other handlers process them - this is required for chord sequence support
// eslint-disable-next-line custom-rules/prefer-use-keybindings
// 引入 Key、useInput，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { type Key, useInput } from '../ink.js';
// 复用 count 工具函数，把通用处理留在 ../utils/array.js 中维护。
import { count } from '../utils/array.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js';
// 复用 plural 工具函数，把通用处理留在 ../utils/stringUtils.js 中维护。
import { plural } from '../utils/stringUtils.js';
// 引入 KeybindingProvider，将 ./KeybindingContext.js 中已经封装好的能力接到本文件流程里。
import { KeybindingProvider } from './KeybindingContext.js';
// 引入 initializeKeybindingWatcher、KeybindingsLoadResult、loadKeybindingsSyncWithWarnings、subscribeToKeybindingChanges，将 ./loadUserBindings.js 中已经封装好的能力接到本文件流程里。
import { initializeKeybindingWatcher, type KeybindingsLoadResult, loadKeybindingsSyncWithWarnings, subscribeToKeybindingChanges } from './loadUserBindings.js';
// 引入 resolveKeyWithChordState，将 ./resolver.js 中已经封装好的能力接到本文件流程里。
import { resolveKeyWithChordState } from './resolver.js';
// 类型依赖 { KeybindingContextName, ParsedBinding, ParsedKeystroke } 来自 ./types.js，用于校准Keybinding Provider Setup的数据契约。
import type { KeybindingContextName, ParsedBinding, ParsedKeystroke } from './types.js';
// 类型依赖 { KeybindingWarning } 来自 ./validate.js，用于校准Keybinding Provider Setup的数据契约。
import type { KeybindingWarning } from './validate.js';

/**
 * Timeout for chord sequences in milliseconds.
 * If the user doesn't complete the chord within this time, it's cancelled.
 */
// CHORD_TIMEOUT_MS 集合 命名 `1000`，让后续代码直接表达这个值的用途。
const CHORD_TIMEOUT_MS = 1000;
// Props 固化Keybinding Provider Setup里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  children: React.ReactNode;
};

/**
 * Keybinding provider with default + user bindings and hot-reload support.
 *
 * Usage: Wrap your app with this provider to enable keybinding support.
 *
 * ```tsx
 * <AppStateProvider>
 *   <KeybindingSetup>
 *     <REPL ... />
 *   </KeybindingSetup>
 * </AppStateProvider>
 * ```
 *
 * Features:
 * - Loads default bindings from code
 * - Merges with user bindings from ~/.claude/keybindings.json
 * - Watches for file changes and reloads automatically (hot-reload)
 * - User bindings override defaults (later entries win)
 * - Chord support with automatic timeout
 */
/**
 * Display keybinding warnings to the user via notifications.
 * Shows a brief message pointing to /doctor for details.
 */
// useKeybindingWarnings 封装KeybindingProviderSetup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function useKeybindingWarnings(warnings, isReload) {
  // $保存`_c`，供Keybinding Provider Setup后续处理使用。
  const $ = _c(9);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification,
    removeNotification
  } = useNotifications();
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== addNotification || $[1] !== removeNotification || $[2] !== warnings) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 警告列表为空时立即返回或跳过，避免Keybinding Provider Setup把空集合当成可处理内容。
      if (warnings.length === 0) {
        // 调用 removeNotification，触发Keybinding Provider Setup此处需要的副作用。
        removeNotification("keybinding-config-warning");
        // Keybinding Provider Setup在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // errorCount 错误信息统计`count`，供Keybinding Provider Setup后续处理使用。
      const errorCount = count(warnings, _temp);
      // warnCount 数量统计`count`，供Keybinding Provider Setup后续处理使用。
      const warnCount = count(warnings, _temp2);
      // 消息 先占位，稍后的条件分支会根据实际输入补齐它。
      let message;
      // 组合条件 `errorCount > 0 && warnCount > 0` 成立时，Keybinding Provider Setup才启用这条专门路径。
      if (errorCount > 0 && warnCount > 0) {
        // 消息更新为 ``Found ${errorCount} keybinding ${plural(errorCount, "err...`，确保KeybindingProviderSetup后续读取最新状态。
        message = `Found ${errorCount} keybinding ${plural(errorCount, "error")} and ${warnCount} ${plural(warnCount, "warning")}`;
      } else {
        // 满足 `errorCount > 0` 时，Keybinding Provider Setup执行该分支。
        if (errorCount > 0) {
          // 消息更新为 ``Found ${errorCount} keybinding ${plural(errorCount, "err...`，确保KeybindingProviderSetup后续读取最新状态。
          message = `Found ${errorCount} keybinding ${plural(errorCount, "error")}`;
        } else {
          // 消息更新为 ``Found ${warnCount} keybinding ${plural(warnCount, "warni...`，确保KeybindingProviderSetup后续读取最新状态。
          message = `Found ${warnCount} keybinding ${plural(warnCount, "warning")}`;
        }
      }
      // 消息更新为 `message + " \xB7 /doctor for details"`，确保KeybindingProviderSetup后续读取最新状态。
      message = message + " \xB7 /doctor for details";
      // 调用 addNotification，触发Keybinding Provider Setup此处需要的副作用。
      addNotification({
        key: "keybinding-config-warning",
        text: message,
        color: errorCount > 0 ? "error" : "warning",
        priority: errorCount > 0 ? "immediate" : "high",
        timeoutMs: 60000
      });
    };
    // $[0] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = addNotification;
    // $[1] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = removeNotification;
    // $[2] 缓存 `warnings`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = warnings;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[3];
  }
  // t1 暂存 `[warnings, isReload, addNotification, removeNotification]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== addNotification || $[5] !== isReload || $[6] !== removeNotification || $[7] !== warnings) {
    // t1 暂存 `[warnings, isReload, addNotification, removeNotification]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [warnings, isReload, addNotification, removeNotification];
    // $[4] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = addNotification;
    // $[5] 缓存 `isReload`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = isReload;
    // $[6] 缓存 `removeNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = removeNotification;
    // $[7] 缓存 `warnings`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = warnings;
    // $[8] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[8];
  }
  // 调用 useEffect，触发Keybinding Provider Setup此处需要的副作用。
  useEffect(t0, t1);
}
// _temp2 封装KeybindingProviderSetup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(w_0) {
  // 返回 `w_0.severity === "warning"`，作为Keybinding Provider Setup这次计算的结果。
  return w_0.severity === "warning";
}
// _temp 封装KeybindingProviderSetup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(w) {
  // 返回 `w.severity === "error"`，作为Keybinding Provider Setup这次计算的结果。
  return w.severity === "error";
}
// KeybindingSetup 封装KeybindingProviderSetup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function KeybindingSetup({
  children
}: Props): React.ReactNode {
  // Load bindings synchronously for initial render
  // Keybinding Provider Setup先整理这一处局部数据，后续分支可以直接读取。
  const [{
    bindings,
    warnings
  // 这个回调绑定到 }, setLoadResult] = useState<KeybindingsLoadResult>(() => {，负责Keybinding Provider Setup在该局部场景下的响应。
  }, setLoadResult] = useState<KeybindingsLoadResult>(() => {
    // 结果读取`loadKeybindingsSyncWithWarnings`，供Keybinding Provider Setup后续处理使用。
    const result = loadKeybindingsSyncWithWarnings();
    // 记录Keybinding Provider Setup运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`[keybindings] KeybindingSetup initialized with ${result.bindings.length} bindings, ${result.warnings.length} warnings`);
    // 返回 `result`，作为Keybinding Provider Setup这次计算的结果。
    return result;
  });

  // Track if this is a reload (not initial load)
  // isReload 由 React state 持有，setIsReload 会在用户操作或异步结果返回时触发刷新。
  const [isReload, setIsReload] = useState(false);

  // Display warnings via notifications
  // 调用 useKeybindingWarnings，触发Keybinding Provider Setup此处需要的副作用。
  useKeybindingWarnings(warnings, isReload);

  // Chord state management - use ref for immediate access, state for re-renders
  // The ref is used by resolve() to get the current value without waiting for re-render
  // The state is used to trigger re-renders when needed (e.g., for UI updates)
  // pendingChordRef 引用保存 hook 状态，让Keybinding Provider Setup跨渲染复用同一个容器。
  const pendingChordRef = useRef<ParsedKeystroke[] | null>(null);
  // pendingChord 由 React state 持有，setPendingChordState 会在用户操作或异步结果返回时触发刷新。
  const [pendingChord, setPendingChordState] = useState<ParsedKeystroke[] | null>(null);
  // chordTimeoutRef 引用保存 hook 状态，让Keybinding Provider Setup跨渲染复用同一个容器。
  const chordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handler registry for action callbacks (used by ChordInterceptor to invoke handlers)
  // handlerRegistryRef 引用保存`useRef`，供Keybinding Provider Setup后续处理使用。
  const handlerRegistryRef = useRef(new Map<string, Set<{
    action: string;
    context: KeybindingContextName;
    // 这个回调绑定到 handler: () => void;，负责Keybinding Provider Setup在该局部场景下的响应。
    handler: () => void;
  }>>());

  // Active context tracking for keybinding priority resolution
  // Using a ref instead of state for synchronous updates - input handlers need
  // to see the current value immediately, not after a React render cycle.
  // activeContextsRef 引用保存`Set`，供Keybinding Provider Setup后续处理使用。
  const activeContextsRef = useRef<Set<KeybindingContextName>>(new Set());
  // registerActiveContext保存`useCallback`，供Keybinding Provider Setup后续处理使用。
  const registerActiveContext = useCallback((context: KeybindingContextName) => {
    // 调用 activeContextsRef.current.add，触发Keybinding Provider Setup此处需要的副作用。
    activeContextsRef.current.add(context);
  }, []);
  // unregisterActiveContext保存`useCallback`，供Keybinding Provider Setup后续处理使用。
  const unregisterActiveContext = useCallback((context_0: KeybindingContextName) => {
    // 调用 activeContextsRef.current.delete，触发Keybinding Provider Setup此处需要的副作用。
    activeContextsRef.current.delete(context_0);
  }, []);

  // Clear chord timeout when component unmounts or chord changes
  // clearChordTimeout保存`useCallback`，供Keybinding Provider Setup后续处理使用。
  const clearChordTimeout = useCallback(() => {
    // 满足 `chordTimeoutRef.current` 时，Keybinding Provider Setup执行该分支。
    if (chordTimeoutRef.current) {
      // 调用 clearTimeout，触发Keybinding Provider Setup此处需要的副作用。
      clearTimeout(chordTimeoutRef.current);
      // current更新为 `null`，确保KeybindingProviderSetup后续读取最新状态。
      chordTimeoutRef.current = null;
    }
  }, []);

  // Wrapper for setPendingChord that manages timeout and syncs ref+state
  // setPendingChord保存`useCallback`，供Keybinding Provider Setup后续处理使用。
  const setPendingChord = useCallback((pending: ParsedKeystroke[] | null) => {
    // 调用 clearChordTimeout，触发Keybinding Provider Setup此处需要的副作用。
    clearChordTimeout();
    // `pending` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (pending !== null) {
      // Set timeout to cancel chord if not completed
      // current更新为 `setTimeout((pendingChordRef_0, setPendingChordState_0) =>...`，确保KeybindingProviderSetup后续读取最新状态。
      chordTimeoutRef.current = setTimeout((pendingChordRef_0, setPendingChordState_0) => {
        // 记录Keybinding Provider Setup运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[keybindings] Chord timeout - cancelling');
        // current更新为 `null`，确保KeybindingProviderSetup后续读取最新状态。
        pendingChordRef_0.current = null;
        // setPendingChordState_0 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
        setPendingChordState_0(null);
      }, CHORD_TIMEOUT_MS, pendingChordRef, setPendingChordState);
    }

    // Update ref immediately for synchronous access in resolve()
    // current更新为 `pending`，确保KeybindingProviderSetup后续读取最新状态。
    pendingChordRef.current = pending;
    // Update state to trigger re-renders for UI updates
    // setPendingChordState 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
    setPendingChordState(pending);
  }, [clearChordTimeout]);
  // 调用 useEffect，触发Keybinding Provider Setup此处需要的副作用。
  useEffect(() => {
    // Initialize file watcher (idempotent - only runs once)
    // 显式忽略 `initializeKeybindingWatcher()` 的返回值，只保留它触发的副作用。
    void initializeKeybindingWatcher();

    // Subscribe to changes
    // unsubscribe保存`subscribeToKeybindingChanges`，供Keybinding Provider Setup后续处理使用。
    const unsubscribe = subscribeToKeybindingChanges(result_0 => {
      // Any callback invocation is a reload since initial load happens
      // synchronously in useState, not via this subscription
      // setIsReload 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
      setIsReload(true);
      // setLoadResult 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
      setLoadResult(result_0);
      // 记录Keybinding Provider Setup运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[keybindings] Reloaded: ${result_0.bindings.length} bindings, ${result_0.warnings.length} warnings`);
    });
    // 返回 `() => {`，作为Keybinding Provider Setup这次计算的结果。
    return () => {
      // 调用 unsubscribe，触发Keybinding Provider Setup此处需要的副作用。
      unsubscribe();
      // 调用 clearChordTimeout，触发Keybinding Provider Setup此处需要的副作用。
      clearChordTimeout();
    };
  }, [clearChordTimeout]);
  // 返回 `<KeybindingProvider bindings={bindings} pendingChordRef={pendingChordRe...`，作为Keybinding Provider Setup这次计算的结果。
  return <KeybindingProvider bindings={bindings} pendingChordRef={pendingChordRef} pendingChord={pendingChord} setPendingChord={setPendingChord} activeContexts={activeContextsRef.current} registerActiveContext={registerActiveContext} unregisterActiveContext={unregisterActiveContext} handlerRegistryRef={handlerRegistryRef}>
      <ChordInterceptor bindings={bindings} pendingChordRef={pendingChordRef} setPendingChord={setPendingChord} activeContexts={activeContextsRef.current} handlerRegistryRef={handlerRegistryRef} />
      {children}
    </KeybindingProvider>;
}

/**
 * Global chord interceptor that registers useInput FIRST (before children).
 *
 * This component intercepts keystrokes that are part of chord sequences and
 * stops propagation before other handlers (like PromptInput) can see them.
 *
 * Without this, the second key of a chord (e.g., 'r' in "ctrl+c r") would be
 * captured by PromptInput and added to the input field before the keybinding
 * system could recognize it as completing a chord.
 */
// HandlerRegistration 固化Keybinding Provider Setup里传递的数据形状，帮助调用方按同一结构读写字段。
type HandlerRegistration = {
  action: string;
  context: KeybindingContextName;
  // 这个回调绑定到 handler: () => void;，负责Keybinding Provider Setup在该局部场景下的响应。
  handler: () => void;
};
// ChordInterceptor 封装KeybindingProviderSetup的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function ChordInterceptor(t0) {
  // $保存`_c`，供Keybinding Provider Setup后续处理使用。
  const $ = _c(6);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    bindings,
    pendingChordRef,
    setPendingChord,
    activeContexts,
    handlerRegistryRef
  } = t0;
  // t1 暂存 `(input, key, event) => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== activeContexts || $[1] !== bindings || $[2] !== handlerRegistryRef || $[3] !== pendingChordRef || $[4] !== setPendingChord) {
    // t1 暂存 `(input, key, event) => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = (input, key, event) => {
      // 组合条件 `(key.wheelUp || key.wheelDown) && pendingChordRef.current === null` 成立时，Keybinding Provider Setup才启用这条专门路径。
      if ((key.wheelUp || key.wheelDown) && pendingChordRef.current === null) {
        // Keybinding Provider Setup在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // registry 命名 `handlerRegistryRef.current`，让后续代码直接表达这个值的用途。
      const registry = handlerRegistryRef.current;
      // handlerContexts 集合保存`Set`，供Keybinding Provider Setup后续处理使用。
      const handlerContexts = new Set();
      // 满足 `registry` 时，Keybinding Provider Setup执行该分支。
      if (registry) {
        // 逐项读取 `registry.values()` 中的handlers 集合，按输入顺序推进Keybinding Provider Setup。
        for (const handlers of registry.values()) {
          // 按顺序遍历 `handlers` 中的registration，逐个交给Keybinding Provider Setup处理。
          for (const registration of handlers) {
            // 调用 handlerContexts.add，触发Keybinding Provider Setup此处需要的副作用。
            handlerContexts.add(registration.context);
          }
        }
      }
      // contexts 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const contexts = [...handlerContexts, ...activeContexts, "Global"];
      // wasInChord标记Keybinding Provider Setup是否启用对应路径。
      const wasInChord = pendingChordRef.current !== null;
      // 结果读取`resolveKeyWithChordState`，供Keybinding Provider Setup后续处理使用。
      const result = resolveKeyWithChordState(input, key, contexts, bindings, pendingChordRef.current);
      // Keybinding Provider Setup在这里处理 `bb23: switch (result.type) {`，完成这一小步状态转换。
      bb23: switch (result.type) {
        case "chord_started":
          {
            // setPendingChord 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
            setPendingChord(result.pending);
            // 调用 event.stopImmediatePropagation，触发Keybinding Provider Setup此处需要的副作用。
            event.stopImmediatePropagation();
            // 结束这个分支或循环，避免Keybinding Provider Setup继续落入后续路径。
            break bb23;
          }
        case "match":
          {
            // setPendingChord 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
            setPendingChord(null);
            // 满足 `wasInChord` 时，Keybinding Provider Setup执行该分支。
            if (wasInChord) {
              // contextsSet保存`Set`，供Keybinding Provider Setup后续处理使用。
              const contextsSet = new Set(contexts);
              // 满足 `registry` 时，Keybinding Provider Setup执行该分支。
              if (registry) {
                // handlers_0读取`registry.get`，供Keybinding Provider Setup后续处理使用。
                const handlers_0 = registry.get(result.action);
                // 组合条件 `handlers_0 && handlers_0.size > 0` 成立时，Keybinding Provider Setup才启用这条专门路径。
                if (handlers_0 && handlers_0.size > 0) {
                  // 按顺序遍历 `handlers_0` 中的registration_0，逐个交给Keybinding Provider Setup处理。
                  for (const registration_0 of handlers_0) {
                    // 满足 `contextsSet.has(registration_0.context)` 时，Keybinding Provider Setup执行该分支。
                    if (contextsSet.has(registration_0.context)) {
                      // 调用 registration_0.handler，触发Keybinding Provider Setup此处需要的副作用。
                      registration_0.handler();
                      // 调用 event.stopImmediatePropagation，触发Keybinding Provider Setup此处需要的副作用。
                      event.stopImmediatePropagation();
                      // 结束这个分支或循环，避免Keybinding Provider Setup继续落入后续路径。
                      break;
                    }
                  }
                }
              }
            }
            // 结束这个分支或循环，避免Keybinding Provider Setup继续落入后续路径。
            break bb23;
          }
        case "chord_cancelled":
          {
            // setPendingChord 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
            setPendingChord(null);
            // 调用 event.stopImmediatePropagation，触发Keybinding Provider Setup此处需要的副作用。
            event.stopImmediatePropagation();
            // 结束这个分支或循环，避免Keybinding Provider Setup继续落入后续路径。
            break bb23;
          }
        case "unbound":
          {
            // setPendingChord 写入新的状态值，使Keybinding Provider Setup后续读取保持一致。
            setPendingChord(null);
            // 调用 event.stopImmediatePropagation，触发Keybinding Provider Setup此处需要的副作用。
            event.stopImmediatePropagation();
            // 结束这个分支或循环，避免Keybinding Provider Setup继续落入后续路径。
            break bb23;
          }
        case "none":
      }
    };
    // $[0] 缓存 `activeContexts`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = activeContexts;
    // $[1] 缓存 `bindings`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = bindings;
    // $[2] 缓存 `handlerRegistryRef`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = handlerRegistryRef;
    // $[3] 缓存 `pendingChordRef`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = pendingChordRef;
    // $[4] 缓存 `setPendingChord`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = setPendingChord;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
  }
  // handleInput 命名 `t1`，让后续代码直接表达这个值的用途。
  const handleInput = t1;
  // 调用 useInput，触发Keybinding Provider Setup此处需要的副作用。
  useInput(handleInput);
  // 返回 `null`，作为Keybinding Provider Setup这次计算的结果。
  return null;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUNhbGxiYWNrIiwidXNlRWZmZWN0IiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VOb3RpZmljYXRpb25zIiwiSW5wdXRFdmVudCIsIktleSIsInVzZUlucHV0IiwiY291bnQiLCJsb2dGb3JEZWJ1Z2dpbmciLCJwbHVyYWwiLCJLZXliaW5kaW5nUHJvdmlkZXIiLCJpbml0aWFsaXplS2V5YmluZGluZ1dhdGNoZXIiLCJLZXliaW5kaW5nc0xvYWRSZXN1bHQiLCJsb2FkS2V5YmluZGluZ3NTeW5jV2l0aFdhcm5pbmdzIiwic3Vic2NyaWJlVG9LZXliaW5kaW5nQ2hhbmdlcyIsInJlc29sdmVLZXlXaXRoQ2hvcmRTdGF0ZSIsIktleWJpbmRpbmdDb250ZXh0TmFtZSIsIlBhcnNlZEJpbmRpbmciLCJQYXJzZWRLZXlzdHJva2UiLCJLZXliaW5kaW5nV2FybmluZyIsIkNIT1JEX1RJTUVPVVRfTVMiLCJQcm9wcyIsImNoaWxkcmVuIiwiUmVhY3ROb2RlIiwidXNlS2V5YmluZGluZ1dhcm5pbmdzIiwid2FybmluZ3MiLCJpc1JlbG9hZCIsIiQiLCJfYyIsImFkZE5vdGlmaWNhdGlvbiIsInJlbW92ZU5vdGlmaWNhdGlvbiIsInQwIiwibGVuZ3RoIiwiZXJyb3JDb3VudCIsIl90ZW1wIiwid2FybkNvdW50IiwiX3RlbXAyIiwibWVzc2FnZSIsImtleSIsInRleHQiLCJjb2xvciIsInByaW9yaXR5IiwidGltZW91dE1zIiwidDEiLCJ3XzAiLCJ3Iiwic2V2ZXJpdHkiLCJLZXliaW5kaW5nU2V0dXAiLCJiaW5kaW5ncyIsInNldExvYWRSZXN1bHQiLCJyZXN1bHQiLCJzZXRJc1JlbG9hZCIsInBlbmRpbmdDaG9yZFJlZiIsInBlbmRpbmdDaG9yZCIsInNldFBlbmRpbmdDaG9yZFN0YXRlIiwiY2hvcmRUaW1lb3V0UmVmIiwiTm9kZUpTIiwiVGltZW91dCIsImhhbmRsZXJSZWdpc3RyeVJlZiIsIk1hcCIsIlNldCIsImFjdGlvbiIsImNvbnRleHQiLCJoYW5kbGVyIiwiYWN0aXZlQ29udGV4dHNSZWYiLCJyZWdpc3RlckFjdGl2ZUNvbnRleHQiLCJjdXJyZW50IiwiYWRkIiwidW5yZWdpc3RlckFjdGl2ZUNvbnRleHQiLCJkZWxldGUiLCJjbGVhckNob3JkVGltZW91dCIsImNsZWFyVGltZW91dCIsInNldFBlbmRpbmdDaG9yZCIsInBlbmRpbmciLCJzZXRUaW1lb3V0IiwidW5zdWJzY3JpYmUiLCJIYW5kbGVyUmVnaXN0cmF0aW9uIiwiQ2hvcmRJbnRlcmNlcHRvciIsImFjdGl2ZUNvbnRleHRzIiwiaW5wdXQiLCJldmVudCIsIndoZWVsVXAiLCJ3aGVlbERvd24iLCJyZWdpc3RyeSIsImhhbmRsZXJDb250ZXh0cyIsImhhbmRsZXJzIiwidmFsdWVzIiwicmVnaXN0cmF0aW9uIiwiY29udGV4dHMiLCJ3YXNJbkNob3JkIiwiYmIyMyIsInR5cGUiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJjb250ZXh0c1NldCIsImhhbmRsZXJzXzAiLCJnZXQiLCJzaXplIiwicmVnaXN0cmF0aW9uXzAiLCJoYXMiLCJoYW5kbGVJbnB1dCJdLCJzb3VyY2VzIjpbIktleWJpbmRpbmdQcm92aWRlclNldHVwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNldHVwIHV0aWxpdGllcyBmb3IgaW50ZWdyYXRpbmcgS2V5YmluZGluZ1Byb3ZpZGVyIGludG8gdGhlIGFwcC5cbiAqXG4gKiBUaGlzIGZpbGUgcHJvdmlkZXMgdGhlIGJpbmRpbmdzIGFuZCBhIGNvbXBvc2VkIHByb3ZpZGVyIHRoYXQgY2FuIGJlXG4gKiBhZGRlZCB0byB0aGUgYXBwJ3MgY29tcG9uZW50IHRyZWUuIEl0IGxvYWRzIGJvdGggZGVmYXVsdCBiaW5kaW5ncyBhbmRcbiAqIHVzZXItZGVmaW5lZCBiaW5kaW5ncyBmcm9tIH4vLmNsYXVkZS9rZXliaW5kaW5ncy5qc29uLCB3aXRoIGhvdC1yZWxvYWRcbiAqIHN1cHBvcnQgd2hlbiB0aGUgZmlsZSBjaGFuZ2VzLlxuICovXG5pbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlTm90aWZpY2F0aW9ucyB9IGZyb20gJy4uL2NvbnRleHQvbm90aWZpY2F0aW9ucy5qcydcbmltcG9ydCB0eXBlIHsgSW5wdXRFdmVudCB9IGZyb20gJy4uL2luay9ldmVudHMvaW5wdXQtZXZlbnQuanMnXG4vLyBDaG9yZEludGVyY2VwdG9yIGludGVudGlvbmFsbHkgdXNlcyB1c2VJbnB1dCB0byBpbnRlcmNlcHQgYWxsIGtleXN0cm9rZXMgYmVmb3JlXG4vLyBvdGhlciBoYW5kbGVycyBwcm9jZXNzIHRoZW0gLSB0aGlzIGlzIHJlcXVpcmVkIGZvciBjaG9yZCBzZXF1ZW5jZSBzdXBwb3J0XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY3VzdG9tLXJ1bGVzL3ByZWZlci11c2Uta2V5YmluZGluZ3NcbmltcG9ydCB7IHR5cGUgS2V5LCB1c2VJbnB1dCB9IGZyb20gJy4uL2luay5qcydcbmltcG9ydCB7IGNvdW50IH0gZnJvbSAnLi4vdXRpbHMvYXJyYXkuanMnXG5pbXBvcnQgeyBsb2dGb3JEZWJ1Z2dpbmcgfSBmcm9tICcuLi91dGlscy9kZWJ1Zy5qcydcbmltcG9ydCB7IHBsdXJhbCB9IGZyb20gJy4uL3V0aWxzL3N0cmluZ1V0aWxzLmpzJ1xuaW1wb3J0IHsgS2V5YmluZGluZ1Byb3ZpZGVyIH0gZnJvbSAnLi9LZXliaW5kaW5nQ29udGV4dC5qcydcbmltcG9ydCB7XG4gIGluaXRpYWxpemVLZXliaW5kaW5nV2F0Y2hlcixcbiAgdHlwZSBLZXliaW5kaW5nc0xvYWRSZXN1bHQsXG4gIGxvYWRLZXliaW5kaW5nc1N5bmNXaXRoV2FybmluZ3MsXG4gIHN1YnNjcmliZVRvS2V5YmluZGluZ0NoYW5nZXMsXG59IGZyb20gJy4vbG9hZFVzZXJCaW5kaW5ncy5qcydcbmltcG9ydCB7IHJlc29sdmVLZXlXaXRoQ2hvcmRTdGF0ZSB9IGZyb20gJy4vcmVzb2x2ZXIuanMnXG5pbXBvcnQgdHlwZSB7XG4gIEtleWJpbmRpbmdDb250ZXh0TmFtZSxcbiAgUGFyc2VkQmluZGluZyxcbiAgUGFyc2VkS2V5c3Ryb2tlLFxufSBmcm9tICcuL3R5cGVzLmpzJ1xuaW1wb3J0IHR5cGUgeyBLZXliaW5kaW5nV2FybmluZyB9IGZyb20gJy4vdmFsaWRhdGUuanMnXG5cbi8qKlxuICogVGltZW91dCBmb3IgY2hvcmQgc2VxdWVuY2VzIGluIG1pbGxpc2Vjb25kcy5cbiAqIElmIHRoZSB1c2VyIGRvZXNuJ3QgY29tcGxldGUgdGhlIGNob3JkIHdpdGhpbiB0aGlzIHRpbWUsIGl0J3MgY2FuY2VsbGVkLlxuICovXG5jb25zdCBDSE9SRF9USU1FT1VUX01TID0gMTAwMFxuXG50eXBlIFByb3BzID0ge1xuICBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlXG59XG5cbi8qKlxuICogS2V5YmluZGluZyBwcm92aWRlciB3aXRoIGRlZmF1bHQgKyB1c2VyIGJpbmRpbmdzIGFuZCBob3QtcmVsb2FkIHN1cHBvcnQuXG4gKlxuICogVXNhZ2U6IFdyYXAgeW91ciBhcHAgd2l0aCB0aGlzIHByb3ZpZGVyIHRvIGVuYWJsZSBrZXliaW5kaW5nIHN1cHBvcnQuXG4gKlxuICogYGBgdHN4XG4gKiA8QXBwU3RhdGVQcm92aWRlcj5cbiAqICAgPEtleWJpbmRpbmdTZXR1cD5cbiAqICAgICA8UkVQTCAuLi4gLz5cbiAqICAgPC9LZXliaW5kaW5nU2V0dXA+XG4gKiA8L0FwcFN0YXRlUHJvdmlkZXI+XG4gKiBgYGBcbiAqXG4gKiBGZWF0dXJlczpcbiAqIC0gTG9hZHMgZGVmYXVsdCBiaW5kaW5ncyBmcm9tIGNvZGVcbiAqIC0gTWVyZ2VzIHdpdGggdXNlciBiaW5kaW5ncyBmcm9tIH4vLmNsYXVkZS9rZXliaW5kaW5ncy5qc29uXG4gKiAtIFdhdGNoZXMgZm9yIGZpbGUgY2hhbmdlcyBhbmQgcmVsb2FkcyBhdXRvbWF0aWNhbGx5IChob3QtcmVsb2FkKVxuICogLSBVc2VyIGJpbmRpbmdzIG92ZXJyaWRlIGRlZmF1bHRzIChsYXRlciBlbnRyaWVzIHdpbilcbiAqIC0gQ2hvcmQgc3VwcG9ydCB3aXRoIGF1dG9tYXRpYyB0aW1lb3V0XG4gKi9cbi8qKlxuICogRGlzcGxheSBrZXliaW5kaW5nIHdhcm5pbmdzIHRvIHRoZSB1c2VyIHZpYSBub3RpZmljYXRpb25zLlxuICogU2hvd3MgYSBicmllZiBtZXNzYWdlIHBvaW50aW5nIHRvIC9kb2N0b3IgZm9yIGRldGFpbHMuXG4gKi9cbmZ1bmN0aW9uIHVzZUtleWJpbmRpbmdXYXJuaW5ncyhcbiAgd2FybmluZ3M6IEtleWJpbmRpbmdXYXJuaW5nW10sXG4gIGlzUmVsb2FkOiBib29sZWFuLFxuKTogdm9pZCB7XG4gIGNvbnN0IHsgYWRkTm90aWZpY2F0aW9uLCByZW1vdmVOb3RpZmljYXRpb24gfSA9IHVzZU5vdGlmaWNhdGlvbnMoKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3Qgbm90aWZpY2F0aW9uS2V5ID0gJ2tleWJpbmRpbmctY29uZmlnLXdhcm5pbmcnXG5cbiAgICBpZiAod2FybmluZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICByZW1vdmVOb3RpZmljYXRpb24obm90aWZpY2F0aW9uS2V5KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgZXJyb3JDb3VudCA9IGNvdW50KHdhcm5pbmdzLCB3ID0+IHcuc2V2ZXJpdHkgPT09ICdlcnJvcicpXG4gICAgY29uc3Qgd2FybkNvdW50ID0gY291bnQod2FybmluZ3MsIHcgPT4gdy5zZXZlcml0eSA9PT0gJ3dhcm5pbmcnKVxuXG4gICAgbGV0IG1lc3NhZ2U6IHN0cmluZ1xuICAgIGlmIChlcnJvckNvdW50ID4gMCAmJiB3YXJuQ291bnQgPiAwKSB7XG4gICAgICBtZXNzYWdlID0gYEZvdW5kICR7ZXJyb3JDb3VudH0ga2V5YmluZGluZyAke3BsdXJhbChlcnJvckNvdW50LCAnZXJyb3InKX0gYW5kICR7d2FybkNvdW50fSAke3BsdXJhbCh3YXJuQ291bnQsICd3YXJuaW5nJyl9YFxuICAgIH0gZWxzZSBpZiAoZXJyb3JDb3VudCA+IDApIHtcbiAgICAgIG1lc3NhZ2UgPSBgRm91bmQgJHtlcnJvckNvdW50fSBrZXliaW5kaW5nICR7cGx1cmFsKGVycm9yQ291bnQsICdlcnJvcicpfWBcbiAgICB9IGVsc2Uge1xuICAgICAgbWVzc2FnZSA9IGBGb3VuZCAke3dhcm5Db3VudH0ga2V5YmluZGluZyAke3BsdXJhbCh3YXJuQ291bnQsICd3YXJuaW5nJyl9YFxuICAgIH1cbiAgICBtZXNzYWdlICs9ICcgwrcgL2RvY3RvciBmb3IgZGV0YWlscydcblxuICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICBrZXk6IG5vdGlmaWNhdGlvbktleSxcbiAgICAgIHRleHQ6IG1lc3NhZ2UsXG4gICAgICBjb2xvcjogZXJyb3JDb3VudCA+IDAgPyAnZXJyb3InIDogJ3dhcm5pbmcnLFxuICAgICAgcHJpb3JpdHk6IGVycm9yQ291bnQgPiAwID8gJ2ltbWVkaWF0ZScgOiAnaGlnaCcsXG4gICAgICAvLyBLZWVwIHZpc2libGUgZm9yIDYwIHNlY29uZHMgbGlrZSBzZXR0aW5ncyBlcnJvcnNcbiAgICAgIHRpbWVvdXRNczogNjAwMDAsXG4gICAgfSlcbiAgfSwgW3dhcm5pbmdzLCBpc1JlbG9hZCwgYWRkTm90aWZpY2F0aW9uLCByZW1vdmVOb3RpZmljYXRpb25dKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gS2V5YmluZGluZ1NldHVwKHsgY2hpbGRyZW4gfTogUHJvcHMpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBMb2FkIGJpbmRpbmdzIHN5bmNocm9ub3VzbHkgZm9yIGluaXRpYWwgcmVuZGVyXG4gIGNvbnN0IFt7IGJpbmRpbmdzLCB3YXJuaW5ncyB9LCBzZXRMb2FkUmVzdWx0XSA9XG4gICAgdXNlU3RhdGU8S2V5YmluZGluZ3NMb2FkUmVzdWx0PigoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBsb2FkS2V5YmluZGluZ3NTeW5jV2l0aFdhcm5pbmdzKClcbiAgICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICAgYFtrZXliaW5kaW5nc10gS2V5YmluZGluZ1NldHVwIGluaXRpYWxpemVkIHdpdGggJHtyZXN1bHQuYmluZGluZ3MubGVuZ3RofSBiaW5kaW5ncywgJHtyZXN1bHQud2FybmluZ3MubGVuZ3RofSB3YXJuaW5nc2AsXG4gICAgICApXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSlcblxuICAvLyBUcmFjayBpZiB0aGlzIGlzIGEgcmVsb2FkIChub3QgaW5pdGlhbCBsb2FkKVxuICBjb25zdCBbaXNSZWxvYWQsIHNldElzUmVsb2FkXSA9IHVzZVN0YXRlKGZhbHNlKVxuXG4gIC8vIERpc3BsYXkgd2FybmluZ3MgdmlhIG5vdGlmaWNhdGlvbnNcbiAgdXNlS2V5YmluZGluZ1dhcm5pbmdzKHdhcm5pbmdzLCBpc1JlbG9hZClcblxuICAvLyBDaG9yZCBzdGF0ZSBtYW5hZ2VtZW50IC0gdXNlIHJlZiBmb3IgaW1tZWRpYXRlIGFjY2Vzcywgc3RhdGUgZm9yIHJlLXJlbmRlcnNcbiAgLy8gVGhlIHJlZiBpcyB1c2VkIGJ5IHJlc29sdmUoKSB0byBnZXQgdGhlIGN1cnJlbnQgdmFsdWUgd2l0aG91dCB3YWl0aW5nIGZvciByZS1yZW5kZXJcbiAgLy8gVGhlIHN0YXRlIGlzIHVzZWQgdG8gdHJpZ2dlciByZS1yZW5kZXJzIHdoZW4gbmVlZGVkIChlLmcuLCBmb3IgVUkgdXBkYXRlcylcbiAgY29uc3QgcGVuZGluZ0Nob3JkUmVmID0gdXNlUmVmPFBhcnNlZEtleXN0cm9rZVtdIHwgbnVsbD4obnVsbClcbiAgY29uc3QgW3BlbmRpbmdDaG9yZCwgc2V0UGVuZGluZ0Nob3JkU3RhdGVdID0gdXNlU3RhdGU8XG4gICAgUGFyc2VkS2V5c3Ryb2tlW10gfCBudWxsXG4gID4obnVsbClcbiAgY29uc3QgY2hvcmRUaW1lb3V0UmVmID0gdXNlUmVmPE5vZGVKUy5UaW1lb3V0IHwgbnVsbD4obnVsbClcblxuICAvLyBIYW5kbGVyIHJlZ2lzdHJ5IGZvciBhY3Rpb24gY2FsbGJhY2tzICh1c2VkIGJ5IENob3JkSW50ZXJjZXB0b3IgdG8gaW52b2tlIGhhbmRsZXJzKVxuICBjb25zdCBoYW5kbGVyUmVnaXN0cnlSZWYgPSB1c2VSZWYoXG4gICAgbmV3IE1hcDxcbiAgICAgIHN0cmluZyxcbiAgICAgIFNldDx7XG4gICAgICAgIGFjdGlvbjogc3RyaW5nXG4gICAgICAgIGNvbnRleHQ6IEtleWJpbmRpbmdDb250ZXh0TmFtZVxuICAgICAgICBoYW5kbGVyOiAoKSA9PiB2b2lkXG4gICAgICB9PlxuICAgID4oKSxcbiAgKVxuXG4gIC8vIEFjdGl2ZSBjb250ZXh0IHRyYWNraW5nIGZvciBrZXliaW5kaW5nIHByaW9yaXR5IHJlc29sdXRpb25cbiAgLy8gVXNpbmcgYSByZWYgaW5zdGVhZCBvZiBzdGF0ZSBmb3Igc3luY2hyb25vdXMgdXBkYXRlcyAtIGlucHV0IGhhbmRsZXJzIG5lZWRcbiAgLy8gdG8gc2VlIHRoZSBjdXJyZW50IHZhbHVlIGltbWVkaWF0ZWx5LCBub3QgYWZ0ZXIgYSBSZWFjdCByZW5kZXIgY3ljbGUuXG4gIGNvbnN0IGFjdGl2ZUNvbnRleHRzUmVmID0gdXNlUmVmPFNldDxLZXliaW5kaW5nQ29udGV4dE5hbWU+PihuZXcgU2V0KCkpXG5cbiAgY29uc3QgcmVnaXN0ZXJBY3RpdmVDb250ZXh0ID0gdXNlQ2FsbGJhY2soXG4gICAgKGNvbnRleHQ6IEtleWJpbmRpbmdDb250ZXh0TmFtZSkgPT4ge1xuICAgICAgYWN0aXZlQ29udGV4dHNSZWYuY3VycmVudC5hZGQoY29udGV4dClcbiAgICB9LFxuICAgIFtdLFxuICApXG5cbiAgY29uc3QgdW5yZWdpc3RlckFjdGl2ZUNvbnRleHQgPSB1c2VDYWxsYmFjayhcbiAgICAoY29udGV4dDogS2V5YmluZGluZ0NvbnRleHROYW1lKSA9PiB7XG4gICAgICBhY3RpdmVDb250ZXh0c1JlZi5jdXJyZW50LmRlbGV0ZShjb250ZXh0KVxuICAgIH0sXG4gICAgW10sXG4gIClcblxuICAvLyBDbGVhciBjaG9yZCB0aW1lb3V0IHdoZW4gY29tcG9uZW50IHVubW91bnRzIG9yIGNob3JkIGNoYW5nZXNcbiAgY29uc3QgY2xlYXJDaG9yZFRpbWVvdXQgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGNob3JkVGltZW91dFJlZi5jdXJyZW50KSB7XG4gICAgICBjbGVhclRpbWVvdXQoY2hvcmRUaW1lb3V0UmVmLmN1cnJlbnQpXG4gICAgICBjaG9yZFRpbWVvdXRSZWYuY3VycmVudCA9IG51bGxcbiAgICB9XG4gIH0sIFtdKVxuXG4gIC8vIFdyYXBwZXIgZm9yIHNldFBlbmRpbmdDaG9yZCB0aGF0IG1hbmFnZXMgdGltZW91dCBhbmQgc3luY3MgcmVmK3N0YXRlXG4gIGNvbnN0IHNldFBlbmRpbmdDaG9yZCA9IHVzZUNhbGxiYWNrKFxuICAgIChwZW5kaW5nOiBQYXJzZWRLZXlzdHJva2VbXSB8IG51bGwpID0+IHtcbiAgICAgIGNsZWFyQ2hvcmRUaW1lb3V0KClcblxuICAgICAgaWYgKHBlbmRpbmcgIT09IG51bGwpIHtcbiAgICAgICAgLy8gU2V0IHRpbWVvdXQgdG8gY2FuY2VsIGNob3JkIGlmIG5vdCBjb21wbGV0ZWRcbiAgICAgICAgY2hvcmRUaW1lb3V0UmVmLmN1cnJlbnQgPSBzZXRUaW1lb3V0KFxuICAgICAgICAgIChwZW5kaW5nQ2hvcmRSZWYsIHNldFBlbmRpbmdDaG9yZFN0YXRlKSA9PiB7XG4gICAgICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoJ1trZXliaW5kaW5nc10gQ2hvcmQgdGltZW91dCAtIGNhbmNlbGxpbmcnKVxuICAgICAgICAgICAgcGVuZGluZ0Nob3JkUmVmLmN1cnJlbnQgPSBudWxsXG4gICAgICAgICAgICBzZXRQZW5kaW5nQ2hvcmRTdGF0ZShudWxsKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgQ0hPUkRfVElNRU9VVF9NUyxcbiAgICAgICAgICBwZW5kaW5nQ2hvcmRSZWYsXG4gICAgICAgICAgc2V0UGVuZGluZ0Nob3JkU3RhdGUsXG4gICAgICAgIClcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHJlZiBpbW1lZGlhdGVseSBmb3Igc3luY2hyb25vdXMgYWNjZXNzIGluIHJlc29sdmUoKVxuICAgICAgcGVuZGluZ0Nob3JkUmVmLmN1cnJlbnQgPSBwZW5kaW5nXG4gICAgICAvLyBVcGRhdGUgc3RhdGUgdG8gdHJpZ2dlciByZS1yZW5kZXJzIGZvciBVSSB1cGRhdGVzXG4gICAgICBzZXRQZW5kaW5nQ2hvcmRTdGF0ZShwZW5kaW5nKVxuICAgIH0sXG4gICAgW2NsZWFyQ2hvcmRUaW1lb3V0XSxcbiAgKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gSW5pdGlhbGl6ZSBmaWxlIHdhdGNoZXIgKGlkZW1wb3RlbnQgLSBvbmx5IHJ1bnMgb25jZSlcbiAgICB2b2lkIGluaXRpYWxpemVLZXliaW5kaW5nV2F0Y2hlcigpXG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlc1xuICAgIGNvbnN0IHVuc3Vic2NyaWJlID0gc3Vic2NyaWJlVG9LZXliaW5kaW5nQ2hhbmdlcyhyZXN1bHQgPT4ge1xuICAgICAgLy8gQW55IGNhbGxiYWNrIGludm9jYXRpb24gaXMgYSByZWxvYWQgc2luY2UgaW5pdGlhbCBsb2FkIGhhcHBlbnNcbiAgICAgIC8vIHN5bmNocm9ub3VzbHkgaW4gdXNlU3RhdGUsIG5vdCB2aWEgdGhpcyBzdWJzY3JpcHRpb25cbiAgICAgIHNldElzUmVsb2FkKHRydWUpXG5cbiAgICAgIHNldExvYWRSZXN1bHQocmVzdWx0KVxuICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICBgW2tleWJpbmRpbmdzXSBSZWxvYWRlZDogJHtyZXN1bHQuYmluZGluZ3MubGVuZ3RofSBiaW5kaW5ncywgJHtyZXN1bHQud2FybmluZ3MubGVuZ3RofSB3YXJuaW5nc2AsXG4gICAgICApXG4gICAgfSlcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB1bnN1YnNjcmliZSgpXG4gICAgICBjbGVhckNob3JkVGltZW91dCgpXG4gICAgfVxuICB9LCBbY2xlYXJDaG9yZFRpbWVvdXRdKVxuXG4gIHJldHVybiAoXG4gICAgPEtleWJpbmRpbmdQcm92aWRlclxuICAgICAgYmluZGluZ3M9e2JpbmRpbmdzfVxuICAgICAgcGVuZGluZ0Nob3JkUmVmPXtwZW5kaW5nQ2hvcmRSZWZ9XG4gICAgICBwZW5kaW5nQ2hvcmQ9e3BlbmRpbmdDaG9yZH1cbiAgICAgIHNldFBlbmRpbmdDaG9yZD17c2V0UGVuZGluZ0Nob3JkfVxuICAgICAgYWN0aXZlQ29udGV4dHM9e2FjdGl2ZUNvbnRleHRzUmVmLmN1cnJlbnR9XG4gICAgICByZWdpc3RlckFjdGl2ZUNvbnRleHQ9e3JlZ2lzdGVyQWN0aXZlQ29udGV4dH1cbiAgICAgIHVucmVnaXN0ZXJBY3RpdmVDb250ZXh0PXt1bnJlZ2lzdGVyQWN0aXZlQ29udGV4dH1cbiAgICAgIGhhbmRsZXJSZWdpc3RyeVJlZj17aGFuZGxlclJlZ2lzdHJ5UmVmfVxuICAgID5cbiAgICAgIDxDaG9yZEludGVyY2VwdG9yXG4gICAgICAgIGJpbmRpbmdzPXtiaW5kaW5nc31cbiAgICAgICAgcGVuZGluZ0Nob3JkUmVmPXtwZW5kaW5nQ2hvcmRSZWZ9XG4gICAgICAgIHNldFBlbmRpbmdDaG9yZD17c2V0UGVuZGluZ0Nob3JkfVxuICAgICAgICBhY3RpdmVDb250ZXh0cz17YWN0aXZlQ29udGV4dHNSZWYuY3VycmVudH1cbiAgICAgICAgaGFuZGxlclJlZ2lzdHJ5UmVmPXtoYW5kbGVyUmVnaXN0cnlSZWZ9XG4gICAgICAvPlxuICAgICAge2NoaWxkcmVufVxuICAgIDwvS2V5YmluZGluZ1Byb3ZpZGVyPlxuICApXG59XG5cbi8qKlxuICogR2xvYmFsIGNob3JkIGludGVyY2VwdG9yIHRoYXQgcmVnaXN0ZXJzIHVzZUlucHV0IEZJUlNUIChiZWZvcmUgY2hpbGRyZW4pLlxuICpcbiAqIFRoaXMgY29tcG9uZW50IGludGVyY2VwdHMga2V5c3Ryb2tlcyB0aGF0IGFyZSBwYXJ0IG9mIGNob3JkIHNlcXVlbmNlcyBhbmRcbiAqIHN0b3BzIHByb3BhZ2F0aW9uIGJlZm9yZSBvdGhlciBoYW5kbGVycyAobGlrZSBQcm9tcHRJbnB1dCkgY2FuIHNlZSB0aGVtLlxuICpcbiAqIFdpdGhvdXQgdGhpcywgdGhlIHNlY29uZCBrZXkgb2YgYSBjaG9yZCAoZS5nLiwgJ3InIGluIFwiY3RybCtjIHJcIikgd291bGQgYmVcbiAqIGNhcHR1cmVkIGJ5IFByb21wdElucHV0IGFuZCBhZGRlZCB0byB0aGUgaW5wdXQgZmllbGQgYmVmb3JlIHRoZSBrZXliaW5kaW5nXG4gKiBzeXN0ZW0gY291bGQgcmVjb2duaXplIGl0IGFzIGNvbXBsZXRpbmcgYSBjaG9yZC5cbiAqL1xudHlwZSBIYW5kbGVyUmVnaXN0cmF0aW9uID0ge1xuICBhY3Rpb246IHN0cmluZ1xuICBjb250ZXh0OiBLZXliaW5kaW5nQ29udGV4dE5hbWVcbiAgaGFuZGxlcjogKCkgPT4gdm9pZFxufVxuXG5mdW5jdGlvbiBDaG9yZEludGVyY2VwdG9yKHtcbiAgYmluZGluZ3MsXG4gIHBlbmRpbmdDaG9yZFJlZixcbiAgc2V0UGVuZGluZ0Nob3JkLFxuICBhY3RpdmVDb250ZXh0cyxcbiAgaGFuZGxlclJlZ2lzdHJ5UmVmLFxufToge1xuICBiaW5kaW5nczogUGFyc2VkQmluZGluZ1tdXG4gIHBlbmRpbmdDaG9yZFJlZjogUmVhY3QuUmVmT2JqZWN0PFBhcnNlZEtleXN0cm9rZVtdIHwgbnVsbD5cbiAgc2V0UGVuZGluZ0Nob3JkOiAocGVuZGluZzogUGFyc2VkS2V5c3Ryb2tlW10gfCBudWxsKSA9PiB2b2lkXG4gIGFjdGl2ZUNvbnRleHRzOiBTZXQ8S2V5YmluZGluZ0NvbnRleHROYW1lPlxuICBoYW5kbGVyUmVnaXN0cnlSZWY6IFJlYWN0LlJlZk9iamVjdDxNYXA8c3RyaW5nLCBTZXQ8SGFuZGxlclJlZ2lzdHJhdGlvbj4+PlxufSk6IG51bGwge1xuICBjb25zdCBoYW5kbGVJbnB1dCA9IHVzZUNhbGxiYWNrKFxuICAgIChpbnB1dDogc3RyaW5nLCBrZXk6IEtleSwgZXZlbnQ6IElucHV0RXZlbnQpID0+IHtcbiAgICAgIC8vIFdoZWVsIGV2ZW50cyBjYW4gbmV2ZXIgc3RhcnQgY2hvcmQgc2VxdWVuY2VzIOKAlCBzY3JvbGw6bGluZVVwL0Rvd24gYXJlXG4gICAgICAvLyBzaW5nbGUta2V5IGJpbmRpbmdzIGhhbmRsZWQgYnkgcGVyLWNvbXBvbmVudCB1c2VLZXliaW5kaW5ncyBob29rcywgbm90XG4gICAgICAvLyBoZXJlLiBTa2lwIHRoZSByZWdpc3RyeSBzY2FuLiBNaWQtY2hvcmQgd2hlZWwgc3RpbGwgZmFsbHMgdGhyb3VnaCBzb1xuICAgICAgLy8gc2Nyb2xsaW5nIGNhbmNlbHMgdGhlIHBlbmRpbmcgY2hvcmQgbGlrZSBhbnkgb3RoZXIgbm9uLW1hdGNoaW5nIGtleS5cbiAgICAgIGlmICgoa2V5LndoZWVsVXAgfHwga2V5LndoZWVsRG93bikgJiYgcGVuZGluZ0Nob3JkUmVmLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIEJ1aWxkIGNvbnRleHQgbGlzdCBmcm9tIHJlZ2lzdGVyZWQgaGFuZGxlcnMgKyBhY3RpdmVDb250ZXh0cyArIEdsb2JhbFxuICAgICAgLy8gVGhpcyBlbnN1cmVzIHdlIGNhbiByZXNvbHZlIGNob3JkcyBmb3IgYWxsIGNvbnRleHRzIHRoYXQgaGF2ZSBoYW5kbGVyc1xuICAgICAgY29uc3QgcmVnaXN0cnkgPSBoYW5kbGVyUmVnaXN0cnlSZWYuY3VycmVudFxuICAgICAgY29uc3QgaGFuZGxlckNvbnRleHRzID0gbmV3IFNldDxLZXliaW5kaW5nQ29udGV4dE5hbWU+KClcbiAgICAgIGlmIChyZWdpc3RyeSkge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJzIG9mIHJlZ2lzdHJ5LnZhbHVlcygpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCByZWdpc3RyYXRpb24gb2YgaGFuZGxlcnMpIHtcbiAgICAgICAgICAgIGhhbmRsZXJDb250ZXh0cy5hZGQocmVnaXN0cmF0aW9uLmNvbnRleHQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBjb250ZXh0czogS2V5YmluZGluZ0NvbnRleHROYW1lW10gPSBbXG4gICAgICAgIC4uLmhhbmRsZXJDb250ZXh0cyxcbiAgICAgICAgLi4uYWN0aXZlQ29udGV4dHMsXG4gICAgICAgICdHbG9iYWwnLFxuICAgICAgXVxuXG4gICAgICAvLyBUcmFjayB3aGV0aGVyIHdlJ3JlIGNvbXBsZXRpbmcgYSBjaG9yZCAocGVuZGluZyB3YXMgbm9uLW51bGwpXG4gICAgICBjb25zdCB3YXNJbkNob3JkID0gcGVuZGluZ0Nob3JkUmVmLmN1cnJlbnQgIT09IG51bGxcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBrZXlzdHJva2UgaXMgcGFydCBvZiBhIGNob3JkIHNlcXVlbmNlXG4gICAgICBjb25zdCByZXN1bHQgPSByZXNvbHZlS2V5V2l0aENob3JkU3RhdGUoXG4gICAgICAgIGlucHV0LFxuICAgICAgICBrZXksXG4gICAgICAgIGNvbnRleHRzLFxuICAgICAgICBiaW5kaW5ncyxcbiAgICAgICAgcGVuZGluZ0Nob3JkUmVmLmN1cnJlbnQsXG4gICAgICApXG5cbiAgICAgIHN3aXRjaCAocmVzdWx0LnR5cGUpIHtcbiAgICAgICAgY2FzZSAnY2hvcmRfc3RhcnRlZCc6XG4gICAgICAgICAgLy8gVGhpcyBrZXkgc3RhcnRzIGEgY2hvcmQgLSBzdG9yZSBwZW5kaW5nIHN0YXRlIGFuZCBzdG9wIHByb3BhZ2F0aW9uXG4gICAgICAgICAgc2V0UGVuZGluZ0Nob3JkKHJlc3VsdC5wZW5kaW5nKVxuICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgICAgYnJlYWtcblxuICAgICAgICBjYXNlICdtYXRjaCc6IHtcbiAgICAgICAgICAvLyBDbGVhciBwZW5kaW5nIHN0YXRlXG4gICAgICAgICAgc2V0UGVuZGluZ0Nob3JkKG51bGwpXG5cbiAgICAgICAgICAvLyBPbmx5IGludm9rZSBoYW5kbGVycyBhbmQgc3RvcCBwcm9wYWdhdGlvbiBmb3IgY2hvcmQgY29tcGxldGlvbnNcbiAgICAgICAgICAvLyAobXVsdGkta2V5c3Ryb2tlIHNlcXVlbmNlcykuIFNpbmdsZS1rZXlzdHJva2UgbWF0Y2hlcyBzaG91bGQgcHJvcGFnYXRlXG4gICAgICAgICAgLy8gdG8gcGVyLWhvb2sgaGFuZGxlcnMgdG8gYXZvaWQgaW50ZXJmZXJpbmcgd2l0aCBvdGhlciBpbnB1dCBoYW5kbGluZ1xuICAgICAgICAgIC8vIChlLmcuLCBFbnRlciBuZWVkcyB0byByZWFjaCB1c2VUeXBlYWhlYWQgZm9yIGF1dG9jb21wbGV0ZSBhY2NlcHRhbmNlXG4gICAgICAgICAgLy8gYmVmb3JlIHRoZSBzdWJtaXQgaGFuZGxlciBmaXJlcykuXG4gICAgICAgICAgaWYgKHdhc0luQ2hvcmQpIHtcbiAgICAgICAgICAgIC8vIEZpbmQgYW5kIGludm9rZSB0aGUgaGFuZGxlciBmb3IgdGhpcyBhY3Rpb25cbiAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gY2hlY2sgdGhhdCB0aGUgaGFuZGxlcidzIGNvbnRleHQgaXMgaW4gb3VyIHJlc29sdmVkIGNvbnRleHRzXG4gICAgICAgICAgICAvLyAod2hpY2ggaW5jbHVkZXMgaGFuZGxlckNvbnRleHRzICsgYWN0aXZlQ29udGV4dHMgKyBHbG9iYWwpXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0c1NldCA9IG5ldyBTZXQoY29udGV4dHMpXG4gICAgICAgICAgICBpZiAocmVnaXN0cnkpIHtcbiAgICAgICAgICAgICAgY29uc3QgaGFuZGxlcnMgPSByZWdpc3RyeS5nZXQocmVzdWx0LmFjdGlvbilcbiAgICAgICAgICAgICAgaWYgKGhhbmRsZXJzICYmIGhhbmRsZXJzLnNpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gRmluZCBoYW5kbGVycyB3aG9zZSBjb250ZXh0IGlzIGluIG91ciByZXNvbHZlZCBjb250ZXh0c1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcmVnaXN0cmF0aW9uIG9mIGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoY29udGV4dHNTZXQuaGFzKHJlZ2lzdHJhdGlvbi5jb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICByZWdpc3RyYXRpb24uaGFuZGxlcigpXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrIC8vIE9ubHkgaW52b2tlIHRoZSBmaXJzdCBtYXRjaGluZyBoYW5kbGVyXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBjYXNlICdjaG9yZF9jYW5jZWxsZWQnOlxuICAgICAgICAgIC8vIEludmFsaWQga2V5IGR1cmluZyBjaG9yZCAtIGNsZWFyIHBlbmRpbmcgc3RhdGUgYW5kIHN3YWxsb3cgdGhlXG4gICAgICAgICAgLy8ga2V5c3Ryb2tlIHNvIGl0IGRvZXNuJ3QgcHJvcGFnYXRlIGFzIGEgc3RhbmRhbG9uZSBhY3Rpb25cbiAgICAgICAgICAvLyAoZS5nLiwgY3RybCt4IGN0cmwrYyBzaG91bGQgbm90IGZpcmUgYXBwOmludGVycnVwdCkuXG4gICAgICAgICAgc2V0UGVuZGluZ0Nob3JkKG51bGwpXG4gICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICBicmVha1xuXG4gICAgICAgIGNhc2UgJ3VuYm91bmQnOlxuICAgICAgICAgIC8vIEtleSBpcyBleHBsaWNpdGx5IHVuYm91bmQgLSBjbGVhciBwZW5kaW5nIHN0YXRlIGFuZCBzd2FsbG93XG4gICAgICAgICAgLy8gdGhlIGtleXN0cm9rZSAoaXQgd2FzIHBhcnQgb2YgYSBjaG9yZCBzZXF1ZW5jZSkuXG4gICAgICAgICAgc2V0UGVuZGluZ0Nob3JkKG51bGwpXG4gICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgICBicmVha1xuXG4gICAgICAgIGNhc2UgJ25vbmUnOlxuICAgICAgICAgIC8vIE5vIGNob3JkIGludm9sdmVtZW50IC0gbGV0IG90aGVyIGhhbmRsZXJzIHByb2Nlc3NcbiAgICAgICAgICBicmVha1xuICAgICAgfVxuICAgIH0sXG4gICAgW1xuICAgICAgYmluZGluZ3MsXG4gICAgICBwZW5kaW5nQ2hvcmRSZWYsXG4gICAgICBzZXRQZW5kaW5nQ2hvcmQsXG4gICAgICBhY3RpdmVDb250ZXh0cyxcbiAgICAgIGhhbmRsZXJSZWdpc3RyeVJlZixcbiAgICBdLFxuICApXG5cbiAgdXNlSW5wdXQoaGFuZGxlSW5wdXQpXG5cbiAgcmV0dXJuIG51bGxcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPQSxLQUFLLElBQUlDLFdBQVcsRUFBRUMsU0FBUyxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQ3ZFLFNBQVNDLGdCQUFnQixRQUFRLDZCQUE2QjtBQUM5RCxjQUFjQyxVQUFVLFFBQVEsOEJBQThCO0FBQzlEO0FBQ0E7QUFDQTtBQUNBLFNBQVMsS0FBS0MsR0FBRyxFQUFFQyxRQUFRLFFBQVEsV0FBVztBQUM5QyxTQUFTQyxLQUFLLFFBQVEsbUJBQW1CO0FBQ3pDLFNBQVNDLGVBQWUsUUFBUSxtQkFBbUI7QUFDbkQsU0FBU0MsTUFBTSxRQUFRLHlCQUF5QjtBQUNoRCxTQUFTQyxrQkFBa0IsUUFBUSx3QkFBd0I7QUFDM0QsU0FDRUMsMkJBQTJCLEVBQzNCLEtBQUtDLHFCQUFxQixFQUMxQkMsK0JBQStCLEVBQy9CQyw0QkFBNEIsUUFDdkIsdUJBQXVCO0FBQzlCLFNBQVNDLHdCQUF3QixRQUFRLGVBQWU7QUFDeEQsY0FDRUMscUJBQXFCLEVBQ3JCQyxhQUFhLEVBQ2JDLGVBQWUsUUFDVixZQUFZO0FBQ25CLGNBQWNDLGlCQUFpQixRQUFRLGVBQWU7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