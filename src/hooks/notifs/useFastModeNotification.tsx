// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react';
// 引入 useNotifications，将 src/context/notifications.js 中已经封装好的能力接到本文件流程里。
import { useNotifications } from 'src/context/notifications.js';
// 引入 useAppState、useSetAppState，将 src/state/AppState.js 中已经封装好的能力接到本文件流程里。
import { useAppState, useSetAppState } from 'src/state/AppState.js';
// 复用 CooldownReason、isFastModeEnabled、onCooldownExpired、onCooldownTriggered、onFastModeOverageRejection、onOrgFastModeChanged 工具函数，把通用处理留在 src/utils/fastMode.js 中维护。
import { type CooldownReason, isFastModeEnabled, onCooldownExpired, onCooldownTriggered, onFastModeOverageRejection, onOrgFastModeChanged } from 'src/utils/fastMode.js';
// 复用 formatDuration 工具函数，把通用处理留在 src/utils/format.js 中维护。
import { formatDuration } from 'src/utils/format.js';
// 引入 getIsRemoteMode，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getIsRemoteMode } from '../../bootstrap/state.js';
// COOLDOWN_STARTED_KEY保存`'fast-mode-cooldown-started'`，作为后续固定文本处理的输入。
const COOLDOWN_STARTED_KEY = 'fast-mode-cooldown-started';
// COOLDOWN_EXPIRED_KEY保存`'fast-mode-cooldown-expired'`，作为后续固定文本处理的输入。
const COOLDOWN_EXPIRED_KEY = 'fast-mode-cooldown-expired';
// ORG_CHANGED_KEY固定为 `'fast-mode-org-changed'`，作为React hook use Fast M...后续展示或比较的基准。
const ORG_CHANGED_KEY = 'fast-mode-org-changed';
// OVERAGE_REJECTED_KEY固定为 `'fast-mode-overage-rejected'`，作为React hook use Fast M...后续展示或比较的基准。
const OVERAGE_REJECTED_KEY = 'fast-mode-overage-rejected';
// useFastModeNotification 封装useFastModeNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useFastModeNotification() {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(13);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    addNotification
  } = useNotifications();
  // isFastMode记录 `useAppState` 是否成立，React hook随后按该结果分支。
  const isFastMode = useAppState(_temp);
  // setAppState 状态保存`useSetAppState`，供React hook后续处理使用。
  const setAppState = useSetAppState();
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== addNotification || $[1] !== isFastMode || $[2] !== setAppState) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Fast Mode Notificati...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `!isFastModeEnabled()` 时，React hook执行该分支。
      if (!isFastModeEnabled()) {
        // React hook use Fast Mode Notificati...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 返回 `onOrgFastModeChanged(orgEnabled => {`，作为React hook 状态流这次计算的结果。
      return onOrgFastModeChanged(orgEnabled => {
        // 满足 `orgEnabled` 时，React hook执行该分支。
        if (orgEnabled) {
          // 调用 addNotification，触发React hook此处需要的副作用。
          addNotification({
            key: ORG_CHANGED_KEY,
            color: "fastMode",
            priority: "immediate",
            text: "Fast mode is now available \xB7 /fast to turn on"
          });
        } else {
          // 满足 `isFastMode` 时，React hook执行该分支。
          if (isFastMode) {
            // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
            setAppState(_temp2);
            // 调用 addNotification，触发React hook此处需要的副作用。
            addNotification({
              key: ORG_CHANGED_KEY,
              color: "warning",
              priority: "immediate",
              text: "Fast mode has been disabled by your organization"
            });
          }
        }
      });
    };
    // t1 暂存 `[addNotification, isFastMode, setAppState]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [addNotification, isFastMode, setAppState];
    // $[0] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = addNotification;
    // $[1] 缓存 `isFastMode`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = isFastMode;
    // $[2] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = setAppState;
    // $[3] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t0;
    // $[4] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[3];
    // t1 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[4];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t0, t1);
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t3;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== addNotification || $[6] !== setAppState) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Fast Mode Notificati...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `!isFastModeEnabled()` 时，React hook执行该分支。
      if (!isFastModeEnabled()) {
        // React hook use Fast Mode Notificati...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 返回 `onFastModeOverageRejection(message => {`，作为React hook 状态流这次计算的结果。
      return onFastModeOverageRejection(message => {
        // setAppState 写入新的状态值，使React hook 状态流后续读取保持一致。
        setAppState(_temp3);
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: OVERAGE_REJECTED_KEY,
          color: "warning",
          priority: "immediate",
          text: message
        });
      });
    };
    // t3 暂存 `[addNotification, setAppState]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [addNotification, setAppState];
    // $[5] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = addNotification;
    // $[6] 缓存 `setAppState`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = setAppState;
    // $[7] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t2;
    // $[8] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[7];
    // t3 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[8];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t2, t3);
  // t4 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // t5 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== addNotification || $[10] !== isFastMode) {
    // t4 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t4 = () => {
      // 满足 `getIsRemoteMode()` 时，React hook执行该分支。
      if (getIsRemoteMode()) {
        // React hook use Fast Mode Notificati...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // isFastMode缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
      if (!isFastMode) {
        // React hook use Fast Mode Notificati...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // unsubTriggered保存`onCooldownTriggered`，供React hook后续处理使用。
      const unsubTriggered = onCooldownTriggered((resetAt, reason) => {
        // resetIn格式化`formatDuration`，供React hook后续处理使用。
        const resetIn = formatDuration(resetAt - Date.now(), {
          hideTrailingZeros: true
        });
        // message_0 消息数据读取`getCooldownMessage`，供React hook后续处理使用。
        const message_0 = getCooldownMessage(reason, resetIn);
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: COOLDOWN_STARTED_KEY,
          invalidates: [COOLDOWN_EXPIRED_KEY],
          text: message_0,
          color: "warning",
          priority: "immediate"
        });
      });
      // unsubExpired保存`onCooldownExpired`，供React hook后续处理使用。
      const unsubExpired = onCooldownExpired(() => {
        // 调用 addNotification，触发React hook此处需要的副作用。
        addNotification({
          key: COOLDOWN_EXPIRED_KEY,
          invalidates: [COOLDOWN_STARTED_KEY],
          color: "fastMode",
          text: "Fast limit reset \xB7 now using fast mode",
          priority: "immediate"
        });
      });
      // 返回 `() => {`，作为React hook 状态流这次计算的结果。
      return () => {
        // 调用 unsubTriggered，触发React hook此处需要的副作用。
        unsubTriggered();
        // 调用 unsubExpired，触发React hook此处需要的副作用。
        unsubExpired();
      };
    };
    // t5 暂存 `[addNotification, isFastMode]` 生成的渲染片段，后续返回路径直接复用。
    t5 = [addNotification, isFastMode];
    // $[9] 缓存 `addNotification`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = addNotification;
    // $[10] 缓存 `isFastMode`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = isFastMode;
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
}
// _temp3 封装useFastModeNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(prev_0) {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    ...prev_0,
    fastMode: false
  };
}
// _temp2 封装useFastModeNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(prev) {
  // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
  return {
    ...prev,
    fastMode: false
  };
}
// _temp 封装useFastModeNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(s) {
  // 返回 `s.fastMode`，作为React hook 状态流这次计算的结果。
  return s.fastMode;
}
// getCooldownMessage 封装useFastModeNotification的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCooldownMessage(reason: CooldownReason, resetIn: string): string {
  // 按照 reason 的取值选择React hook 状态流的具体处理分支。
  switch (reason) {
    case 'overloaded':
      // 返回 ``Fast mode overloaded and is temporarily unavailable · resets in ${rese...`，作为React hook 状态流这次计算的结果。
      return `Fast mode overloaded and is temporarily unavailable · resets in ${resetIn}`;
    case 'rate_limit':
      // 返回 ``Fast limit reached and temporarily disabled · resets in ${resetIn}``，作为React hook 状态流这次计算的结果。
      return `Fast limit reached and temporarily disabled · resets in ${resetIn}`;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VOb3RpZmljYXRpb25zIiwidXNlQXBwU3RhdGUiLCJ1c2VTZXRBcHBTdGF0ZSIsIkNvb2xkb3duUmVhc29uIiwiaXNGYXN0TW9kZUVuYWJsZWQiLCJvbkNvb2xkb3duRXhwaXJlZCIsIm9uQ29vbGRvd25UcmlnZ2VyZWQiLCJvbkZhc3RNb2RlT3ZlcmFnZVJlamVjdGlvbiIsIm9uT3JnRmFzdE1vZGVDaGFuZ2VkIiwiZm9ybWF0RHVyYXRpb24iLCJnZXRJc1JlbW90ZU1vZGUiLCJDT09MRE9XTl9TVEFSVEVEX0tFWSIsIkNPT0xET1dOX0VYUElSRURfS0VZIiwiT1JHX0NIQU5HRURfS0VZIiwiT1ZFUkFHRV9SRUpFQ1RFRF9LRVkiLCJ1c2VGYXN0TW9kZU5vdGlmaWNhdGlvbiIsIiQiLCJfYyIsImFkZE5vdGlmaWNhdGlvbiIsImlzRmFzdE1vZGUiLCJfdGVtcCIsInNldEFwcFN0YXRlIiwidDAiLCJ0MSIsIm9yZ0VuYWJsZWQiLCJrZXkiLCJjb2xvciIsInByaW9yaXR5IiwidGV4dCIsIl90ZW1wMiIsInQyIiwidDMiLCJtZXNzYWdlIiwiX3RlbXAzIiwidDQiLCJ0NSIsInVuc3ViVHJpZ2dlcmVkIiwicmVzZXRBdCIsInJlYXNvbiIsInJlc2V0SW4iLCJEYXRlIiwibm93IiwiaGlkZVRyYWlsaW5nWmVyb3MiLCJtZXNzYWdlXzAiLCJnZXRDb29sZG93bk1lc3NhZ2UiLCJpbnZhbGlkYXRlcyIsInVuc3ViRXhwaXJlZCIsInByZXZfMCIsInByZXYiLCJmYXN0TW9kZSIsInMiXSwic291cmNlcyI6WyJ1c2VGYXN0TW9kZU5vdGlmaWNhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VOb3RpZmljYXRpb25zIH0gZnJvbSAnc3JjL2NvbnRleHQvbm90aWZpY2F0aW9ucy5qcydcbmltcG9ydCB7IHVzZUFwcFN0YXRlLCB1c2VTZXRBcHBTdGF0ZSB9IGZyb20gJ3NyYy9zdGF0ZS9BcHBTdGF0ZS5qcydcbmltcG9ydCB7XG4gIHR5cGUgQ29vbGRvd25SZWFzb24sXG4gIGlzRmFzdE1vZGVFbmFibGVkLFxuICBvbkNvb2xkb3duRXhwaXJlZCxcbiAgb25Db29sZG93blRyaWdnZXJlZCxcbiAgb25GYXN0TW9kZU92ZXJhZ2VSZWplY3Rpb24sXG4gIG9uT3JnRmFzdE1vZGVDaGFuZ2VkLFxufSBmcm9tICdzcmMvdXRpbHMvZmFzdE1vZGUuanMnXG5pbXBvcnQgeyBmb3JtYXREdXJhdGlvbiB9IGZyb20gJ3NyYy91dGlscy9mb3JtYXQuanMnXG5pbXBvcnQgeyBnZXRJc1JlbW90ZU1vZGUgfSBmcm9tICcuLi8uLi9ib290c3RyYXAvc3RhdGUuanMnXG5cbmNvbnN0IENPT0xET1dOX1NUQVJURURfS0VZID0gJ2Zhc3QtbW9kZS1jb29sZG93bi1zdGFydGVkJ1xuY29uc3QgQ09PTERPV05fRVhQSVJFRF9LRVkgPSAnZmFzdC1tb2RlLWNvb2xkb3duLWV4cGlyZWQnXG5jb25zdCBPUkdfQ0hBTkdFRF9LRVkgPSAnZmFzdC1tb2RlLW9yZy1jaGFuZ2VkJ1xuY29uc3QgT1ZFUkFHRV9SRUpFQ1RFRF9LRVkgPSAnZmFzdC1tb2RlLW92ZXJhZ2UtcmVqZWN0ZWQnXG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VGYXN0TW9kZU5vdGlmaWNhdGlvbigpOiB2b2lkIHtcbiAgY29uc3QgeyBhZGROb3RpZmljYXRpb24gfSA9IHVzZU5vdGlmaWNhdGlvbnMoKVxuICBjb25zdCBpc0Zhc3RNb2RlID0gdXNlQXBwU3RhdGUocyA9PiBzLmZhc3RNb2RlKVxuICBjb25zdCBzZXRBcHBTdGF0ZSA9IHVzZVNldEFwcFN0YXRlKClcblxuICAvLyBOb3RpZnkgd2hlbiBvcmcgZmFzdCBtb2RlIHN0YXR1cyBjaGFuZ2VzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBpZiAoIWlzRmFzdE1vZGVFbmFibGVkKCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHJldHVybiBvbk9yZ0Zhc3RNb2RlQ2hhbmdlZChvcmdFbmFibGVkID0+IHtcbiAgICAgIGlmIChvcmdFbmFibGVkKSB7XG4gICAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAga2V5OiBPUkdfQ0hBTkdFRF9LRVksXG4gICAgICAgICAgY29sb3I6ICdmYXN0TW9kZScsXG4gICAgICAgICAgcHJpb3JpdHk6ICdpbW1lZGlhdGUnLFxuICAgICAgICAgIHRleHQ6ICdGYXN0IG1vZGUgaXMgbm93IGF2YWlsYWJsZSDCtyAvZmFzdCB0byB0dXJuIG9uJyxcbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSBpZiAoaXNGYXN0TW9kZSkge1xuICAgICAgICAvLyBPcmcgZGlzYWJsZWQgZmFzdCBtb2RlIOKAlCBwZXJtYW5lbnRseSB0dXJuIG9mZiBmYXN0IG1vZGVcbiAgICAgICAgc2V0QXBwU3RhdGUocHJldiA9PiAoeyAuLi5wcmV2LCBmYXN0TW9kZTogZmFsc2UgfSkpXG4gICAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAga2V5OiBPUkdfQ0hBTkdFRF9LRVksXG4gICAgICAgICAgY29sb3I6ICd3YXJuaW5nJyxcbiAgICAgICAgICBwcmlvcml0eTogJ2ltbWVkaWF0ZScsXG4gICAgICAgICAgdGV4dDogJ0Zhc3QgbW9kZSBoYXMgYmVlbiBkaXNhYmxlZCBieSB5b3VyIG9yZ2FuaXphdGlvbicsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfSwgW2FkZE5vdGlmaWNhdGlvbiwgaXNGYXN0TW9kZSwgc2V0QXBwU3RhdGVdKVxuXG4gIC8vIE5vdGlmeSB3aGVuIGZhc3QgbW9kZSBpcyByZWplY3RlZCBkdWUgdG8gb3ZlcmFnZS9leHRyYSB1c2FnZSBpc3N1ZXNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoZ2V0SXNSZW1vdGVNb2RlKCkpIHJldHVyblxuICAgIGlmICghaXNGYXN0TW9kZUVuYWJsZWQoKSkgcmV0dXJuXG5cbiAgICByZXR1cm4gb25GYXN0TW9kZU92ZXJhZ2VSZWplY3Rpb24obWVzc2FnZSA9PiB7XG4gICAgICBzZXRBcHBTdGF0ZShwcmV2ID0+ICh7IC4uLnByZXYsIGZhc3RNb2RlOiBmYWxzZSB9KSlcbiAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIGtleTogT1ZFUkFHRV9SRUpFQ1RFRF9LRVksXG4gICAgICAgIGNvbG9yOiAnd2FybmluZycsXG4gICAgICAgIHByaW9yaXR5OiAnaW1tZWRpYXRlJyxcbiAgICAgICAgdGV4dDogbWVzc2FnZSxcbiAgICAgIH0pXG4gICAgfSlcbiAgfSwgW2FkZE5vdGlmaWNhdGlvbiwgc2V0QXBwU3RhdGVdKVxuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKGdldElzUmVtb3RlTW9kZSgpKSByZXR1cm5cbiAgICBpZiAoIWlzRmFzdE1vZGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHVuc3ViVHJpZ2dlcmVkID0gb25Db29sZG93blRyaWdnZXJlZCgocmVzZXRBdCwgcmVhc29uKSA9PiB7XG4gICAgICBjb25zdCByZXNldEluID0gZm9ybWF0RHVyYXRpb24ocmVzZXRBdCAtIERhdGUubm93KCksIHtcbiAgICAgICAgaGlkZVRyYWlsaW5nWmVyb3M6IHRydWUsXG4gICAgICB9KVxuICAgICAgY29uc3QgbWVzc2FnZSA9IGdldENvb2xkb3duTWVzc2FnZShyZWFzb24sIHJlc2V0SW4pXG4gICAgICBhZGROb3RpZmljYXRpb24oe1xuICAgICAgICBrZXk6IENPT0xET1dOX1NUQVJURURfS0VZLFxuICAgICAgICBpbnZhbGlkYXRlczogW0NPT0xET1dOX0VYUElSRURfS0VZXSxcbiAgICAgICAgdGV4dDogbWVzc2FnZSxcbiAgICAgICAgY29sb3I6ICd3YXJuaW5nJyxcbiAgICAgICAgcHJpb3JpdHk6ICdpbW1lZGlhdGUnLFxuICAgICAgfSlcbiAgICB9KVxuICAgIGNvbnN0IHVuc3ViRXhwaXJlZCA9IG9uQ29vbGRvd25FeHBpcmVkKCgpID0+IHtcbiAgICAgIGFkZE5vdGlmaWNhdGlvbih7XG4gICAgICAgIGtleTogQ09PTERPV05fRVhQSVJFRF9LRVksXG4gICAgICAgIGludmFsaWRhdGVzOiBbQ09PTERPV05fU1RBUlRFRF9LRVldLFxuICAgICAgICBjb2xvcjogJ2Zhc3RNb2RlJyxcbiAgICAgICAgdGV4dDogYEZhc3QgbGltaXQgcmVzZXQgwrcgbm93IHVzaW5nIGZhc3QgbW9kZWAsXG4gICAgICAgIHByaW9yaXR5OiAnaW1tZWRpYXRlJyxcbiAgICAgIH0pXG4gICAgfSlcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdW5zdWJUcmlnZ2VyZWQoKVxuICAgICAgdW5zdWJFeHBpcmVkKClcbiAgICB9XG4gIH0sIFthZGROb3RpZmljYXRpb24sIGlzRmFzdE1vZGVdKVxufVxuXG5mdW5jdGlvbiBnZXRDb29sZG93bk1lc3NhZ2UocmVhc29uOiBDb29sZG93blJlYXNvbiwgcmVzZXRJbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgc3dpdGNoIChyZWFzb24pIHtcbiAgICBjYXNlICdvdmVybG9hZGVkJzpcbiAgICAgIHJldHVybiBgRmFzdCBtb2RlIG92ZXJsb2FkZWQgYW5kIGlzIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlIMK3IHJlc2V0cyBpbiAke3Jlc2V0SW59YFxuICAgIGNhc2UgJ3JhdGVfbGltaXQnOlxuICAgICAgcmV0dXJuIGBGYXN0IGxpbWl0IHJlYWNoZWQgYW5kIHRlbXBvcmFyaWx5IGRpc2FibGVkIMK3IHJlc2V0cyBpbiAke3Jlc2V0SW59YFxuICB9XG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxTQUFTLFFBQVEsT0FBTztBQUNqQyxTQUFTQyxnQkFBZ0IsUUFBUSw4QkFBOEI7QUFDL0QsU0FBU0MsV0FBVyxFQUFFQyxjQUFjLFFBQVEsdUJBQXVCO0FBQ25FLFNBQ0UsS0FBS0MsY0FBYyxFQUNuQkMsaUJBQWlCLEVBQ2pCQyxpQkFBaUIsRUFDakJDLG1CQUFtQixFQUNuQkMsMEJBQTBCLEVBQzFC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