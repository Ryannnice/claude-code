// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useMemo, useRef, useState } from 'react';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 引入 Text，将 src/ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from 'src/ink.js';
// 接入 getRateLimitWarning、getUsingOverageText 服务层能力，把外部通信或共享状态交给 src/services/claudeAiLimits.js 处理。
import { getRateLimitWarning, getUsingOverageText } from 'src/services/claudeAiLimits.js';
// 接入 useClaudeAiLimits 服务层能力，把外部通信或共享状态交给 src/services/claudeAiLimitsHook.js 处理。
import { useClaudeAiLimits } from 'src/services/claudeAiLimitsHook.js';
// 复用 getSubscriptionType 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { getSubscriptionType } from 'src/utils/auth.js';
// 复用 hasClaudeAiBillingAccess 工具函数，把通用处理留在 src/utils/billing.js 中维护。
import { hasClaudeAiBillingAccess } from 'src/utils/billing.js';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// useRateLimitWarningNotification 封装useRateLimitWarningNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useRateLimitWarningNotification(model) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(17);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // claudeAiLimits 集合保存`useClaudeAiLimits`，供React hook后续处理使用。
  const claudeAiLimits = useClaudeAiLimits();
  // t0 暂存 `getRateLimitWarning(claudeAiLimits, model)` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== claudeAiLimits || $[1] !== model) {
    // t0 暂存 `getRateLimitWarning(claudeAiLimits, model)` 生成的渲染片段，后续返回路径直接复用。
    t0 = getRateLimitWarning(claudeAiLimits, model);
    // $[0] 缓存 `claudeAiLimits`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = claudeAiLimits;
    // $[1] 缓存 `model`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = model;
    // $[2] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[2];
  }
  // rateLimitWarning 警告信息保存`t0`，作为后续临时缓存值处理的输入。
  const rateLimitWarning = t0;
  // t1 暂存 `getUsingOverageText(claudeAiLimits)` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== claudeAiLimits) {
    // t1 暂存 `getUsingOverageText(claudeAiLimits)` 生成的渲染片段，后续返回路径直接复用。
    t1 = getUsingOverageText(claudeAiLimits);
    // $[3] 缓存 `claudeAiLimits`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = claudeAiLimits;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // usingOverageText 命名 `t1`，让后续代码直接表达这个值的用途。
  const usingOverageText = t1;
  // shownWarningRef 引用保存`useRef`，供React hook后续处理使用。
  const shownWarningRef = useRef(null);
  // t2 暂存 `getSubscriptionType()` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `getSubscriptionType()` 生成的渲染片段，后续返回路径直接复用。
    t2 = getSubscriptionType();
    // $[5] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[5];
  }
  // subscriptionType保存`t2`，作为后续临时缓存值处理的输入。
  const subscriptionType = t2;
  // t3 暂存 `hasClaudeAiBillingAccess()` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `hasClaudeAiBillingAccess()` 生成的渲染片段，后续返回路径直接复用。
    t3 = hasClaudeAiBillingAccess();
    // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[6];
  }
  // hasBillingAccess 集合标记React hook use Rate L...是否启用对应路径。
  const hasBillingAccess = t3;
  // isTeamOrEnterprise标记React hook use Rate L...是否启用对应路径。
  const isTeamOrEnterprise = subscriptionType === "team" || subscriptionType === "enterprise";
  // hasShownOverageNotification 由 React state 持有，setHasShownOverageNotification 会在用户操作或异步结果返回时触发刷新。
  const [hasShownOverageNotification, setHasShownOverageNotification] = useState(false);
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== addNotification || $[8] !== claudeAiLimits.isUsingOverage || $[9] !== hasShownOverageNotification || $[10] !== usingOverageText) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Rate Limit Warning N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 组合条件 `claudeAiLimits.isUsingOverage && !hasShownOverageNotification && (!isTeamOrEnterp...` 成立时，React hook 状态流才启用这条专门路径。
      if (claudeAiLimits.isUsingOverage && !hasShownOverageNotification && (!isTeamOrEnterprise || hasBillingAccess)) {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "limit-reached",
          text: usingOverageText,
          priority: "immediate"
        });
        // setHasShownOverageNotification 写入新的状态值，使React hook 状态流后续读取保持一致。
        setHasShownOverageNotification(true);
      } else {
        // 组合条件 `!claudeAiLimits.isUsingOverage && hasShownOverage` 成立时，React hook 状态流才启用这条专门路径。
        if (!claudeAiLimits.isUsingOverage && hasShownOverageNotification) {
          // setHasShownOverageNotification 写入新的状态值，使React hook 状态流后续读取保持一致。
          setHasShownOverageNotification(false);
        }
      }
    };
    // t5 暂存 `[claudeAiLimits.isUsingOverage, usingOverageText, hasShow...` 生成的渲染片段，后续返回路径直接复用。
    t5 = [claudeAiLimits.isUsingOverage, usingOverageText, hasShownOverageNotification, addNotification, hasBillingAccess, isTeamOrEnterprise];
    // $[7] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = addNotification;
    // $[8] 缓存 `claudeAiLimits.isUsingOverage`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = claudeAiLimits.isUsingOverage;
    // $[9] 缓存 `hasShownOverageNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = hasShownOverageNotification;
    // $[10] 缓存 `usingOverageText`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = usingOverageText;
    // $[11] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = t4;
    // $[12] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t5;
  } else {
    // t4 从 React 编译缓存槽 $[11] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[11];
    // t5 从 React 编译缓存槽 $[12] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[12];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t4, t5);
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // t7 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[13] !== addNotification || $[14] !== rateLimitWarning) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Rate Limit Warning N...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // `rateLimitWarning && rateLimitWarning` 与 `shownWar` 不一致时刷新派生状态，避免使用过期结果。
      if (rateLimitWarning && rateLimitWarning !== shownWarningRef.current) {
        // current更新为 `rateLimitWarning`，确保useRateLimitWarningNotification后续读取最新状态。
        shownWarningRef.current = rateLimitWarning;
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: "rate-limit-warning",
          jsx: <Text><Text color="warning">{rateLimitWarning}</Text></Text>,
          priority: "high"
        });
      }
    };
    // t7 暂存 `[rateLimitWarning, addNotification]` 生成的渲染片段，后续返回路径直接复用。
    t7 = [rateLimitWarning, addNotification];
    // $[13] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = addNotification;
    // $[14] 缓存 `rateLimitWarning`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = rateLimitWarning;
    // $[15] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = t6;
    // $[16] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = t7;
  } else {
    // t6 从 React 编译缓存槽 $[15] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[15];
    // t7 从 React 编译缓存槽 $[16] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[16];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t6, t7);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsInVzZU5vdGlmaWNhdGlvbnMiLCJUZXh0IiwiZ2V0UmF0ZUxpbWl0V2FybmluZyIsImdldFVzaW5nT3ZlcmFnZVRleHQiLCJ1c2VDbGF1ZGVBaUxpbWl0cyIsImdldFN1YnNjcmlwdGlvblR5cGUiLCJoYXNDbGF1ZGVBaUJpbGxpbmdBY2Nlc3MiLCJnZXRJc1JlbW90ZU1vZGUiLCJ1c2VSYXRlTGltaXRXYXJuaW5nTm90aWZpY2F0aW9uIiwibW9kZWwiLCIkIiwiX2MiLCJhZGROb3RpZmljYXRpb24iLCJjbGF1ZGVBaUxpbWl0cyIsInQwIiwicmF0ZUxpbWl0V2FybmluZyIsInQxIiwidXNpbmdPdmVyYWdlVGV4dCIsInNob3duV2FybmluZ1JlZiIsInQyIiwiU3ltYm9sIiwiZm9yIiwic3Vic2NyaXB0aW9uVHlwZSIsInQzIiwiaGFzQmlsbGluZ0FjY2VzcyIsImlzVGVhbU9yRW50ZXJwcmlzZSIsImhhc1Nob3duT3ZlcmFnZU5vdGlmaWNhdGlvbiIsInNldEhhc1Nob3duT3ZlcmFnZU5vdGlmaWNhdGlvbiIsInQ0IiwidDUiLCJpc1VzaW5nT3ZlcmFnZSIsImtleSIsInRleHQiLCJwcmlvcml0eSIsInQ2IiwidDciLCJjdXJyZW50IiwianN4Il0sInNvdXJjZXMiOlsidXNlUmF0ZUxpbWl0V2FybmluZ05vdGlmaWNhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZU1lbW8sIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZU5vdGlmaWNhdGlvbnMgfSBmcm9tICdzcmMvY29udGV4dC9ub3RpZmljYXRpb25zLmpzJ1xuaW1wb3J0IHsgVGV4dCB9IGZyb20gJ3NyYy9pbmsuanMnXG5pbXBvcnQge1xuICBnZXRSYXRlTGltaXRXYXJuaW5nLFxuICBnZXRVc2luZ092ZXJhZ2VUZXh0LFxufSBmcm9tICdzcmMvc2VydmljZXMvY2xhdWRlQWlMaW1pdHMuanMnXG5pbXBvcnQgeyB1c2VDbGF1ZGVBaUxpbWl0cyB9IGZyb20gJ3NyYy9zZXJ2aWNlcy9jbGF1ZGVBaUxpbWl0c0hvb2suanMnXG5pbXBvcnQgeyBnZXRTdWJzY3JpcHRpb25UeXBlIH0gZnJvbSAnc3JjL3V0aWxzL2F1dGguanMnXG5pbXBvcnQgeyBoYXNDbGF1ZGVBaUJpbGxpbmdBY2Nlc3MgfSBmcm9tICdzcmMvdXRpbHMvYmlsbGluZy5qcydcbmltcG9ydCB7IGdldElzUmVtb3RlTW9kZSB9IGZyb20gJy4uLy4uL2Jvb3RzdHJhcC9zdGF0ZS5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVJhdGVMaW1pdFdhcm5pbmdOb3RpZmljYXRpb24obW9kZWw6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB7IGFkZE5vdGlmaWNhdGlvbiB9ID0gdXNlTm90aWZpY2F0aW9ucygpXG4gIGNvbnN0IGNsYXVkZUFpTGltaXRzID0gdXNlQ2xhdWRlQWlMaW1pdHMoKVxuICAvLyBjbGF1ZGVBaUxpbWl0cyByZWZlcmVuY2UgaXMgc3RhYmxlIHVudGlsIHN0YXR1c0xpc3RlbmVycyBmaXJlIChBUElcbiAgLy8gcmVzcG9uc2UpLCBzbyB0aGVzZSBza2lwIHRoZSBJbnRsIGZvcm1hdHRpbmcgd29yayBvbiBtb3N0IFJFUEwgcmVuZGVycy5cbiAgY29uc3QgcmF0ZUxpbWl0V2FybmluZyA9IHVzZU1lbW8oXG4gICAgKCkgPT4gZ2V0UmF0ZUxpbWl0V2FybmluZyhjbGF1ZGVBaUxpbWl0cywgbW9kZWwpLFxuICAgIFtjbGF1ZGVBaUxpbWl0cywgbW9kZWxdLFxuICApXG4gIGNvbnN0IHVzaW5nT3ZlcmFnZVRleHQgPSB1c2VNZW1vKFxuICAgICgpID0+IGdldFVzaW5nT3ZlcmFnZVRleHQoY2xhdWRlQWlMaW1pdHMpLFxuICAgIFtjbGF1ZGVBaUxpbWl0c10sXG4gIClcbiAgY29uc3Qgc2hvd25XYXJuaW5nUmVmID0gdXNlUmVmPHN0cmluZyB8IG51bGw+KG51bGwpXG4gIGNvbnN0IHN1YnNjcmlwdGlvblR5cGUgPSBnZXRTdWJzY3JpcHRpb25UeXBlKClcbiAgY29uc3QgaGFzQmlsbGluZ0FjY2VzcyA9IGhhc0NsYXVkZUFpQmlsbGluZ0FjY2VzcygpXG4gIGNvbnN0IGlzVGVhbU9yRW50ZXJwcmlzZSA9XG4gICAgc3Vic2NyaXB0aW9uVHlwZSA9PT0gJ3RlYW0nIHx8IHN1YnNjcmlwdGlvblR5cGUgPT09ICdlbnRlcnByaXNlJ1xuXG4gIC8vIFRyYWNrIG92ZXJhZ2UgbW9kZSB0cmFuc2l0aW9uc1xuICBjb25zdCBbaGFzU2hvd25PdmVyYWdlTm90aWZpY2F0aW9uLCBzZXRIYXNTaG93bk92ZXJhZ2VOb3RpZmljYXRpb25dID1cbiAgICB1c2VTdGF0ZShmYWxzZSlcblxuICAvLyBTaG93IGltbWVkaWF0ZSBub3RpZmljYXRpb24gd2hlbiBlbnRlcmluZyBvdmVyYWdlIG1vZGVcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIGlmIChcbiAgICAgIGNsYXVkZUFpTGltaXRzLmlzVXNpbmdPdmVyYWdlICYmXG4gICAgICAhaGFzU2hvd25PdmVyYWdlTm90aWZpY2F0aW9uICYmXG4gICAgICAoIWlzVGVhbU9yRW50ZXJwcmlzZSB8fCBoYXNCaWxsaW5nQWNjZXNzKVxuICAgICkge1xuICAgICAgYWRkTm90aWZpY2F0aW9uKHtcbiAgICAgICAga2V5OiAnbGltaXQtcmVhY2hlZCcsXG4gICAgICAgIHRleHQ6IHVzaW5nT3ZlcmFnZVRleHQsXG4gICAgICAgIHByaW9yaXR5OiAnaW1tZWRpYXRlJyxcbiAgICAgIH0pXG4gICAgICBzZXRIYXNTaG93bk92ZXJhZ2VOb3RpZmljYXRpb24odHJ1ZSlcbiAgICB9IGVsc2UgaWYgKCFjbGF1ZGVBaUxpbWl0cy5pc1VzaW5nT3ZlcmFnZSAmJiBoYXNTaG93bk92ZXJhZ2VOb3RpZmljYXRpb24pIHtcbiAgICAgIC8vIFJlc2V0IHdoZW4gbm8gbG9uZ2VyIGluIG92ZXJhZ2UgbW9kZVxuICAgICAgc2V0SGFzU2hvd25PdmVyYWdlTm90aWZpY2F0aW9uKGZhbHNlKVxuICAgIH1cbiAgfSwgW1xuICAgIGNsYXVkZUFpTGltaXRzLmlzVXNpbmdPdmVyYWdlLFxuICAgIHVzaW5nT3ZlcmFnZVRleHQsXG4gICAgaGFzU2hvd25PdmVyYWdlTm90aWZpY2F0aW9uLFxuICAgIGFkZE5vdGlmaWNhdGlvbixcbiAgICBoYXNCaWxsaW5nQWNjZXNzLFxuICAgIGlzVGVhbU9yRW50ZXJwcmlzZSxcbiAgXSlcblxuICAvLyBTaG93IHdhcm5pbmcgbm90aWZpY2F0aW9uIGZvciBhcHByb2FjaGluZyBsaW1pdHNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIGlmIChyYXRlTGltaXRXYXJuaW5nICYmIHJhdGVMaW1pdFdhcm5pbmcgIT09IHNob3duV2FybmluZ1JlZi5jdXJyZW50KSB7XG4gICAgICBzaG93bldhcm5pbmdSZWYuY3VycmVudCA9IHJhdGVMaW1pdFdhcm5pbmdcbiAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIGtleTogJ3JhdGUtbGltaXQtd2FybmluZycsXG4gICAgICAgIGpzeDogKFxuICAgICAgICAgIDxUZXh0PlxuICAgICAgICAgICAgPFRleHQgY29sb3I9XCJ3YXJuaW5nXCI+e3JhdGVMaW1pdFdhcm5pbmd9PC9UZXh0PlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgKSxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgIH0pXG4gICAgfVxuICB9LCBbcmF0ZUxpbWl0V2FybmluZywgYWRkTm90aWZpY2F0aW9uXSlcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsU0FBUyxFQUFFQyxPQUFPLEVBQUVDLE1BQU0sRUFBRUMsUUFBUSxRQUFRLE9BQU87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LENBQUM7UUFBQTtNQUN0QztJQUFBLENBQ0Y7SUFBRUUsRUFBQSxJQUNEaEIsY0FBYyxDQUFBaUIsY0FBZSxFQUM3QmIsZ0JBQWdCLEVBQ2hCUywyQkFBMkIsRUFDM0JkLGVBQWUsRUFDZlksZ0JBQWdCLEVBQ2hCQyxrQkFBa0IsQ0FDbkI7SUFBQWYsQ0FBQSxNQUFBRSxlQUFBO0lBQUFGLENBQUEsTUFBQUcsY0FBQSxDQUFBaUIsY0FBQTtJQUFBcEIsQ0FBQSxNQUFBZ0IsMkJBQUE7SUFBQWhCLENBQUEsT0FBQU8sZ0JBQUE7SUFBQVAsQ0FBQSxPQUFBa0IsRUFBQTtJQUFBbEIsQ0FBQSxPQUFBbUIsRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQWxCLENBQUE7SUFBQW1CLEVBQUEsR0FBQW5CLENBQUE7RUFBQTtFQXhCRGQsU0FBUyxDQUFDZ0MsRUFpQlQsRUFBRUMsRUFPRixDQUFDO0VBQUEsSUFBQUssRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBekIsQ0FBQSxTQUFBRSxlQUFBLElBQUFGLENBQUEsU0FBQUssZ0JBQUE7SUFHUW1CLEVBQUEsR0FBQUEsQ0FBQTtNQUNSLElBQUkzQixlQUFlLENBQUMsQ0FBQztRQUFBO01BQUE7TUFDckIsSUFBSVEsZ0JBQWdFLElBQTVDQSxnQkFBZ0IsS0FBS0csZUFBZSxDQUFBa0IsT0FBUTtRQUNsRWxCLGVBQWUsQ0FBQWtCLE9BQUEsR0FBV3JCLGdCQUFIO1FBQ3ZCSCxlQUFlLENBQUM7VUFBQW1CLEdBQUEsRUFDVCxvQkFBb0I7VUFBQU0sR0FBQSxFQUV2QixDQUFDLElBQUksQ0FDSCxDQUFDLElBQUksQ0FBTyxLQUFTLENBQVQsU0FBUyxDQUFFdEIsaUJBQWUsQ0FBRSxFQUF2QyxJQUFJLENBQ1AsRUFGQyxJQUFJLENBRUU7VUFBQWtCLFFBQUEsRUFFQztRQUNaLENBQUMsQ0FBQztNQUFBO0lBQ0gsQ0FDRjtJQUFFRSxFQUFBLElBQUNwQixnQkFBZ0IsRUFBRUgsZUFBZSxDQUFDO0lBQUFGLENBQUEsT0FBQUUsZUFBQTtJQUFBRixDQUFBLE9BQUFLLGdCQUFBO0lBQUFMLENBQUEsT0FBQXdCLEVBQUE7SUFBQXhCLENBQUEsT0FBQXlCLEVBQUE7RUFBQTtJQUFBRCxFQUFBLEdBQUF4QixDQUFBO0lBQUF5QixFQUFBLEdBQUF6QixDQUFBO0VBQUE7RUFkdENkLFNBQVMsQ0FBQ3NDLEVBY1QsRUFBRUMsRUFBbUMsQ0FBQztBQUFBIiwiaWdub3JlTGlzdCI6W119