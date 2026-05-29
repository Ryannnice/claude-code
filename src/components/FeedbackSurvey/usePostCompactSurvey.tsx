// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 useCallback、useEffect、useMemo、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// 接入 isFeedbackSurveyDisabled 服务层能力，把外部通信或共享状态交给 src/services/analytics/config.js 处理。
import { isFeedbackSurveyDisabled } from 'src/services/analytics/config.js';
// 接入 checkStatsigFeatureGate_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 接入 shouldUseSessionMemoryCompaction 服务层能力，把外部通信或共享状态交给 ../../services/compact/sessionMemoryCompact.js 处理。
import { shouldUseSessionMemoryCompaction } from '../../services/compact/sessionMemoryCompact.js';
// 类型依赖 { Message } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { Message } from '../../types/message.js';
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js';
// 复用 isCompactBoundaryMessage 工具函数，把通用处理留在 ../../utils/messages.js 中维护。
import { isCompactBoundaryMessage } from '../../utils/messages.js';
// 复用 logOTelEvent 工具函数，把通用处理留在 ../../utils/telemetry/events.js 中维护。
import { logOTelEvent } from '../../utils/telemetry/events.js';
// 引入 useSurveyState，将 ./useSurveyState.js 中已经封装好的能力接到本文件流程里。
import { useSurveyState } from './useSurveyState.js';
// 类型依赖 { FeedbackSurveyResponse } 来自 ./utils.js，用于校准终端渲染的数据契约。
import type { FeedbackSurveyResponse } from './utils.js';
// HIDE_THANKS_AFTER_MS 集合 命名 `3000`，让后续代码直接表达这个值的用途。
const HIDE_THANKS_AFTER_MS = 3000;
// POST_COMPACT_SURVEY_GATE保存`'tengu_post_compact_survey'`，作为后续固定文本处理的输入。
const POST_COMPACT_SURVEY_GATE = 'tengu_post_compact_survey';
// SURVEY_PROBABILITY保存`0.2; // Show survey 20% of the time after compaction`，供后续判断或组装使用。
const SURVEY_PROBABILITY = 0.2; // Show survey 20% of the time after compaction

// hasMessageAfterBoundary 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasMessageAfterBoundary(messages: Message[], boundaryUuid: string): boolean {
  // boundaryIndex 索引筛选`messages.findIndex`，供终端渲染后续处理使用。
  const boundaryIndex = messages.findIndex(msg => msg.uuid === boundaryUuid);
  // 满足 `boundaryIndex === -1` 时，终端渲染执行该分支。
  if (boundaryIndex === -1) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false;
  }

  // Check if there's a user or assistant message after the boundary
  // 循环处理 `let i = boundaryIndex + 1; i < messages.length; i`，让终端渲染逐项把同类条目按顺序走完。
  for (let i = boundaryIndex + 1; i < messages.length; i++) {
    // 消息读取 `messages[i]` 对应条目，后续围绕该成员继续处理。
    const msg = messages[i];
    // 只有 `msg && (msg.type === 'user' || msg.type === 'assistant')` 满足时，终端渲染才执行该分支。
    if (msg && (msg.type === 'user' || msg.type === 'assistant')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true;
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false;
}
// usePostCompactSurvey 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function usePostCompactSurvey(messages, isLoading, t0, t1) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(23);
  // hasActivePrompt标记终端 UI use Post Compact Sur...是否启用对应路径。
  const hasActivePrompt = t0 === undefined ? false : t0;
  // t2 暂存 `t1 === undefined ? {} : t1` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== t1) {
    // t2 暂存 `t1 === undefined ? {} : t1` 生成的渲染片段，后续返回路径直接复用。
    t2 = t1 === undefined ? {} : t1;
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    enabled: t3
  } = t2;
  // enabled标记终端 UI use Post Compact Sur...是否启用对应路径。
  const enabled = t3 === undefined ? true : t3;
  // gateEnabled 由 React state 持有，setGateEnabled 会在用户操作或异步结果返回时触发刷新。
  const [gateEnabled, setGateEnabled] = useState(null);
  // t4 暂存 `new Set()` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `new Set()` 生成的渲染片段，后续返回路径直接复用。
    t4 = new Set();
    // $[2] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[2];
  }
  // seenCompactBoundaries 集合保存`useRef`，供终端渲染后续处理使用。
  const seenCompactBoundaries = useRef(t4);
  // pendingCompactBoundaryUuid保存`useRef`，供终端渲染后续处理使用。
  const pendingCompactBoundaryUuid = useRef(null);
  // onOpen保存`_temp`，供后续判断或组装使用。
  const onOpen = _temp;
  // onSelect 命名 `_temp2`，让后续代码直接表达这个值的用途。
  const onSelect = _temp2;
  // t5 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t5 = {
      hideThanksAfterMs: HIDE_THANKS_AFTER_MS,
      onOpen,
      onSelect
    };
    // $[3] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[3];
  }
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    state,
    lastResponse,
    open,
    handleSelect
  } = useSurveyState(t5);
  // t6 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // t7 暂存 `[enabled]` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[4] !== enabled) {
    // t6 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t6 = () => {
      // enabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!enabled) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // setGateEnabled 写入新的状态值，使终端渲染后续读取保持一致。
      setGateEnabled(checkStatsigFeatureGate_CACHED_MAY_BE_STALE(POST_COMPACT_SURVEY_GATE));
    };
    // t7 暂存 `[enabled]` 生成的渲染片段，后续返回路径直接复用。
    t7 = [enabled];
    // $[4] 缓存 `enabled`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = enabled;
    // $[5] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t6;
    // $[6] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t7;
  } else {
    // t6 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[5];
    // t7 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[6];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t6, t7);
  // t8 暂存 `new Set(messages.filter(_temp3).map(_temp4))` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== messages) {
    // t8 暂存 `new Set(messages.filter(_temp3).map(_temp4))` 生成的渲染片段，后续返回路径直接复用。
    t8 = new Set(messages.filter(_temp3).map(_temp4));
    // $[7] 缓存 `messages`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = messages;
    // $[8] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[8];
  }
  // currentCompactBoundaries 集合 命名 `t8`，让后续代码直接表达这个值的用途。
  const currentCompactBoundaries = t8;
  // t10 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t10;
  // t9 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t9;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== currentCompactBoundaries || $[10] !== enabled || $[11] !== gateEnabled || $[12] !== hasActivePrompt || $[13] !== isLoading || $[14] !== messages || $[15] !== open || $[16] !== state) {
    // t9 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t9 = () => {
      // enabled缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!enabled) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // `state` 与 `"closed" || isLoading` 不一致时刷新派生状态，避免使用过期结果。
      if (state !== "closed" || isLoading) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `hasActivePrompt` 时，终端渲染执行该分支。
      if (hasActivePrompt) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // `gateEnabled` 与 `true` 不一致时刷新派生状态，避免使用过期结果。
      if (gateEnabled !== true) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `isFeedbackSurveyDisabled()` 时，终端渲染执行该分支。
      if (isFeedbackSurveyDisabled()) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY)` 时，终端渲染执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY)) {
        // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // `pendingCompactBoundaryUuid.current` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (pendingCompactBoundaryUuid.current !== null) {
        // 满足 `hasMessageAfterBoundary(messages, pendingCompactBoundaryUuid.current)` 时，终端渲染执行该分支。
        if (hasMessageAfterBoundary(messages, pendingCompactBoundaryUuid.current)) {
          // current更新为 `null`，确保终端 UI后续读取最新状态。
          pendingCompactBoundaryUuid.current = null;
          // 满足 `Math.random() < SURVEY_PROBABILITY` 时，终端渲染执行该分支。
          if (Math.random() < SURVEY_PROBABILITY) {
            // 调用 open，触发终端渲染此处需要的副作用。
            open();
          }
          // 终端 UI 组件 use Post Compact Survey在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
      }
      // newBoundaries 集合保存`Array.from`，供终端渲染后续处理使用。
      const newBoundaries = Array.from(currentCompactBoundaries).filter(uuid => !seenCompactBoundaries.current.has(uuid));
      // 满足 `newBoundaries.length > 0` 时，终端渲染执行该分支。
      if (newBoundaries.length > 0) {
        // current更新为 `new Set(currentCompactBoundaries)`，确保终端 UI后续读取最新状态。
        seenCompactBoundaries.current = new Set(currentCompactBoundaries);
        // current更新为 `newBoundaries[newBoundaries.length - 1]`，确保终端 UI后续读取最新状态。
        pendingCompactBoundaryUuid.current = newBoundaries[newBoundaries.length - 1];
      }
    };
    // t10 暂存 `[enabled, currentCompactBoundaries, state, isLoading, has...` 生成的渲染片段，后续返回路径直接复用。
    t10 = [enabled, currentCompactBoundaries, state, isLoading, hasActivePrompt, gateEnabled, messages, open];
    // $[9] 缓存 `currentCompactBoundaries`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = currentCompactBoundaries;
    // $[10] 缓存 `enabled`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = enabled;
    // $[11] 缓存 `gateEnabled`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = gateEnabled;
    // $[12] 缓存 `hasActivePrompt`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = hasActivePrompt;
    // $[13] 缓存 `isLoading`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = isLoading;
    // $[14] 缓存 `messages`，下次依赖未变时 React 编译产物可直接复用。
    $[14] = messages;
    // $[15] 缓存 `open`，下次依赖未变时 React 编译产物可直接复用。
    $[15] = open;
    // $[16] 缓存 `state`，下次依赖未变时 React 编译产物可直接复用。
    $[16] = state;
    // $[17] 缓存 `t10`，下次依赖未变时 React 编译产物可直接复用。
    $[17] = t10;
    // $[18] 缓存 `t9`，下次依赖未变时 React 编译产物可直接复用。
    $[18] = t9;
  } else {
    // t10 从 React 编译缓存槽 $[17] 取回渲染片段，避免依赖未变时重建 JSX。
    t10 = $[17];
    // t9 从 React 编译缓存槽 $[18] 取回渲染片段，避免依赖未变时重建 JSX。
    t9 = $[18];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t9, t10);
  // t11 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t11;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[19] !== handleSelect || $[20] !== lastResponse || $[21] !== state) {
    // t11 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t11 = {
      state,
      lastResponse,
      handleSelect
    };
    // $[19] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[19] = handleSelect;
    // $[20] 缓存 `lastResponse`，下次依赖未变时 React 编译产物可直接复用。
    $[20] = lastResponse;
    // $[21] 缓存 `state`，下次依赖未变时 React 编译产物可直接复用。
    $[21] = state;
    // $[22] 缓存 `t11`，下次依赖未变时 React 编译产物可直接复用。
    $[22] = t11;
  } else {
    // t11 从 React 编译缓存槽 $[22] 取回渲染片段，避免依赖未变时重建 JSX。
    t11 = $[22];
  }
  // 返回 `t11`，作为终端渲染这次计算的结果。
  return t11;
}
// _temp4 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp4(msg_0) {
  // 返回 `msg_0.uuid`，作为终端渲染这次计算的结果。
  return msg_0.uuid;
}
// _temp3 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp3(msg) {
  // 返回 `isCompactBoundaryMessage(msg)`，作为终端渲染这次计算的结果。
  return isCompactBoundaryMessage(msg);
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(appearanceId_0, selected) {
  // smCompactionEnabled_0保存`shouldUseSessionMemoryCompaction`，供终端渲染后续处理使用。
  const smCompactionEnabled_0 = shouldUseSessionMemoryCompaction();
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent("tengu_post_compact_survey_event", {
    event_type: "responded" as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    appearance_id: appearanceId_0 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    response: selected as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    session_memory_compaction_enabled: smCompactionEnabled_0 as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });
  // 调用 logOTelEvent，触发终端渲染此处需要的副作用。
  logOTelEvent("feedback_survey", {
    event_type: "responded",
    appearance_id: appearanceId_0,
    response: selected,
    survey_type: "post_compact"
  });
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp(appearanceId) {
  // smCompactionEnabled保存`shouldUseSessionMemoryCompaction`，供终端渲染后续处理使用。
  const smCompactionEnabled = shouldUseSessionMemoryCompaction();
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent("tengu_post_compact_survey_event", {
    event_type: "appeared" as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    appearance_id: appearanceId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    session_memory_compaction_enabled: smCompactionEnabled as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
  });
  // 调用 logOTelEvent，触发终端渲染此处需要的副作用。
  logOTelEvent("feedback_survey", {
    event_type: "appeared",
    appearance_id: appearanceId,
    survey_type: "post_compact"
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VDYWxsYmFjayIsInVzZUVmZmVjdCIsInVzZU1lbW8iLCJ1c2VSZWYiLCJ1c2VTdGF0ZSIsImlzRmVlZGJhY2tTdXJ2ZXlEaXNhYmxlZCIsImNoZWNrU3RhdHNpZ0ZlYXR1cmVHYXRlX0NBQ0hFRF9NQVlfQkVfU1RBTEUiLCJBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTIiwibG9nRXZlbnQiLCJzaG91bGRVc2VTZXNzaW9uTWVtb3J5Q29tcGFjdGlvbiIsIk1lc3NhZ2UiLCJpc0VudlRydXRoeSIsImlzQ29tcGFjdEJvdW5kYXJ5TWVzc2FnZSIsImxvZ09UZWxFdmVudCIsInVzZVN1cnZleVN0YXRlIiwiRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSIsIkhJREVfVEhBTktTX0FGVEVSX01TIiwiUE9TVF9DT01QQUNUX1NVUlZFWV9HQVRFIiwiU1VSVkVZX1BST0JBQklMSVRZIiwiaGFzTWVzc2FnZUFmdGVyQm91bmRhcnkiLCJtZXNzYWdlcyIsImJvdW5kYXJ5VXVpZCIsImJvdW5kYXJ5SW5kZXgiLCJmaW5kSW5kZXgiLCJtc2ciLCJ1dWlkIiwiaSIsImxlbmd0aCIsInR5cGUiLCJ1c2VQb3N0Q29tcGFjdFN1cnZleSIsImlzTG9hZGluZyIsInQwIiwidDEiLCIkIiwiX2MiLCJoYXNBY3RpdmVQcm9tcHQiLCJ1bmRlZmluZWQiLCJ0MiIsImVuYWJsZWQiLCJ0MyIsImdhdGVFbmFibGVkIiwic2V0R2F0ZUVuYWJsZWQiLCJ0NCIsIlN5bWJvbCIsImZvciIsIlNldCIsInNlZW5Db21wYWN0Qm91bmRhcmllcyIsInBlbmRpbmdDb21wYWN0Qm91bmRhcnlVdWlkIiwib25PcGVuIiwiX3RlbXAiLCJvblNlbGVjdCIsIl90ZW1wMiIsInQ1IiwiaGlkZVRoYW5rc0FmdGVyTXMiLCJzdGF0ZSIsImxhc3RSZXNwb25zZSIsIm9wZW4iLCJoYW5kbGVTZWxlY3QiLCJ0NiIsInQ3IiwidDgiLCJmaWx0ZXIiLCJfdGVtcDMiLCJtYXAiLCJfdGVtcDQiLCJjdXJyZW50Q29tcGFjdEJvdW5kYXJpZXMiLCJ0MTAiLCJ0OSIsInByb2Nlc3MiLCJlbnYiLCJDTEFVREVfQ09ERV9ESVNBQkxFX0ZFRURCQUNLX1NVUlZFWSIsImN1cnJlbnQiLCJNYXRoIiwicmFuZG9tIiwibmV3Qm91bmRhcmllcyIsIkFycmF5IiwiZnJvbSIsImhhcyIsInQxMSIsIm1zZ18wIiwiYXBwZWFyYW5jZUlkXzAiLCJzZWxlY3RlZCIsInNtQ29tcGFjdGlvbkVuYWJsZWRfMCIsImV2ZW50X3R5cGUiLCJhcHBlYXJhbmNlX2lkIiwiYXBwZWFyYW5jZUlkIiwicmVzcG9uc2UiLCJzZXNzaW9uX21lbW9yeV9jb21wYWN0aW9uX2VuYWJsZWQiLCJzbUNvbXBhY3Rpb25FbmFibGVkIiwic3VydmV5X3R5cGUiXSwic291cmNlcyI6WyJ1c2VQb3N0Q29tcGFjdFN1cnZleS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgaXNGZWVkYmFja1N1cnZleURpc2FibGVkIH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9jb25maWcuanMnXG5pbXBvcnQgeyBjaGVja1N0YXRzaWdGZWF0dXJlR2F0ZV9DQUNIRURfTUFZX0JFX1NUQUxFIH0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9ncm93dGhib29rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IHNob3VsZFVzZVNlc3Npb25NZW1vcnlDb21wYWN0aW9uIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvY29tcGFjdC9zZXNzaW9uTWVtb3J5Q29tcGFjdC5qcydcbmltcG9ydCB0eXBlIHsgTWVzc2FnZSB9IGZyb20gJy4uLy4uL3R5cGVzL21lc3NhZ2UuanMnXG5pbXBvcnQgeyBpc0VudlRydXRoeSB9IGZyb20gJy4uLy4uL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHsgaXNDb21wYWN0Qm91bmRhcnlNZXNzYWdlIH0gZnJvbSAnLi4vLi4vdXRpbHMvbWVzc2FnZXMuanMnXG5pbXBvcnQgeyBsb2dPVGVsRXZlbnQgfSBmcm9tICcuLi8uLi91dGlscy90ZWxlbWV0cnkvZXZlbnRzLmpzJ1xuaW1wb3J0IHsgdXNlU3VydmV5U3RhdGUgfSBmcm9tICcuL3VzZVN1cnZleVN0YXRlLmpzJ1xuaW1wb3J0IHR5cGUgeyBGZWVkYmFja1N1cnZleVJlc3BvbnNlIH0gZnJvbSAnLi91dGlscy5qcydcblxuY29uc3QgSElERV9USEFOS1NfQUZURVJfTVMgPSAzMDAwXG5jb25zdCBQT1NUX0NPTVBBQ1RfU1VSVkVZX0dBVEUgPSAndGVuZ3VfcG9zdF9jb21wYWN0X3N1cnZleSdcbmNvbnN0IFNVUlZFWV9QUk9CQUJJTElUWSA9IDAuMiAvLyBTaG93IHN1cnZleSAyMCUgb2YgdGhlIHRpbWUgYWZ0ZXIgY29tcGFjdGlvblxuXG5mdW5jdGlvbiBoYXNNZXNzYWdlQWZ0ZXJCb3VuZGFyeShcbiAgbWVzc2FnZXM6IE1lc3NhZ2VbXSxcbiAgYm91bmRhcnlVdWlkOiBzdHJpbmcsXG4pOiBib29sZWFuIHtcbiAgY29uc3QgYm91bmRhcnlJbmRleCA9IG1lc3NhZ2VzLmZpbmRJbmRleChtc2cgPT4gbXNnLnV1aWQgPT09IGJvdW5kYXJ5VXVpZClcbiAgaWYgKGJvdW5kYXJ5SW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBDaGVjayBpZiB0aGVyZSdzIGEgdXNlciBvciBhc3Npc3RhbnQgbWVzc2FnZSBhZnRlciB0aGUgYm91bmRhcnlcbiAgZm9yIChsZXQgaSA9IGJvdW5kYXJ5SW5kZXggKyAxOyBpIDwgbWVzc2FnZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBtc2cgPSBtZXNzYWdlc1tpXVxuICAgIGlmIChtc2cgJiYgKG1zZy50eXBlID09PSAndXNlcicgfHwgbXNnLnR5cGUgPT09ICdhc3Npc3RhbnQnKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VQb3N0Q29tcGFjdFN1cnZleShcbiAgbWVzc2FnZXM6IE1lc3NhZ2VbXSxcbiAgaXNMb2FkaW5nOiBib29sZWFuLFxuICBoYXNBY3RpdmVQcm9tcHQgPSBmYWxzZSxcbiAgeyBlbmFibGVkID0gdHJ1ZSB9OiB7IGVuYWJsZWQ/OiBib29sZWFuIH0gPSB7fSxcbik6IHtcbiAgc3RhdGU6XG4gICAgfCAnY2xvc2VkJ1xuICAgIHwgJ29wZW4nXG4gICAgfCAndGhhbmtzJ1xuICAgIHwgJ3RyYW5zY3JpcHRfcHJvbXB0J1xuICAgIHwgJ3N1Ym1pdHRpbmcnXG4gICAgfCAnc3VibWl0dGVkJ1xuICBsYXN0UmVzcG9uc2U6IEZlZWRiYWNrU3VydmV5UmVzcG9uc2UgfCBudWxsXG4gIGhhbmRsZVNlbGVjdDogKHNlbGVjdGVkOiBGZWVkYmFja1N1cnZleVJlc3BvbnNlKSA9PiB2b2lkXG59IHtcbiAgY29uc3QgW2dhdGVFbmFibGVkLCBzZXRHYXRlRW5hYmxlZF0gPSB1c2VTdGF0ZTxib29sZWFuIHwgbnVsbD4obnVsbClcbiAgY29uc3Qgc2VlbkNvbXBhY3RCb3VuZGFyaWVzID0gdXNlUmVmPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpXG4gIC8vIFRyYWNrIHRoZSBjb21wYWN0IGJvdW5kYXJ5IHdlJ3JlIHdhaXRpbmcgb24gKHRvIHNob3cgc3VydmV5IGFmdGVyIG5leHQgbWVzc2FnZSlcbiAgY29uc3QgcGVuZGluZ0NvbXBhY3RCb3VuZGFyeVV1aWQgPSB1c2VSZWY8c3RyaW5nIHwgbnVsbD4obnVsbClcblxuICBjb25zdCBvbk9wZW4gPSB1c2VDYWxsYmFjaygoYXBwZWFyYW5jZUlkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBzbUNvbXBhY3Rpb25FbmFibGVkID0gc2hvdWxkVXNlU2Vzc2lvbk1lbW9yeUNvbXBhY3Rpb24oKVxuICAgIGxvZ0V2ZW50KCd0ZW5ndV9wb3N0X2NvbXBhY3Rfc3VydmV5X2V2ZW50Jywge1xuICAgICAgZXZlbnRfdHlwZTpcbiAgICAgICAgJ2FwcGVhcmVkJyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgYXBwZWFyYW5jZV9pZDpcbiAgICAgICAgYXBwZWFyYW5jZUlkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICBzZXNzaW9uX21lbW9yeV9jb21wYWN0aW9uX2VuYWJsZWQ6XG4gICAgICAgIHNtQ29tcGFjdGlvbkVuYWJsZWQgYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICB9KVxuICAgIHZvaWQgbG9nT1RlbEV2ZW50KCdmZWVkYmFja19zdXJ2ZXknLCB7XG4gICAgICBldmVudF90eXBlOiAnYXBwZWFyZWQnLFxuICAgICAgYXBwZWFyYW5jZV9pZDogYXBwZWFyYW5jZUlkLFxuICAgICAgc3VydmV5X3R5cGU6ICdwb3N0X2NvbXBhY3QnLFxuICAgIH0pXG4gIH0sIFtdKVxuXG4gIGNvbnN0IG9uU2VsZWN0ID0gdXNlQ2FsbGJhY2soXG4gICAgKGFwcGVhcmFuY2VJZDogc3RyaW5nLCBzZWxlY3RlZDogRmVlZGJhY2tTdXJ2ZXlSZXNwb25zZSkgPT4ge1xuICAgICAgY29uc3Qgc21Db21wYWN0aW9uRW5hYmxlZCA9IHNob3VsZFVzZVNlc3Npb25NZW1vcnlDb21wYWN0aW9uKClcbiAgICAgIGxvZ0V2ZW50KCd0ZW5ndV9wb3N0X2NvbXBhY3Rfc3VydmV5X2V2ZW50Jywge1xuICAgICAgICBldmVudF90eXBlOlxuICAgICAgICAgICdyZXNwb25kZWQnIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIGFwcGVhcmFuY2VfaWQ6XG4gICAgICAgICAgYXBwZWFyYW5jZUlkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHJlc3BvbnNlOlxuICAgICAgICAgIHNlbGVjdGVkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIHNlc3Npb25fbWVtb3J5X2NvbXBhY3Rpb25fZW5hYmxlZDpcbiAgICAgICAgICBzbUNvbXBhY3Rpb25FbmFibGVkIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICB9KVxuICAgICAgdm9pZCBsb2dPVGVsRXZlbnQoJ2ZlZWRiYWNrX3N1cnZleScsIHtcbiAgICAgICAgZXZlbnRfdHlwZTogJ3Jlc3BvbmRlZCcsXG4gICAgICAgIGFwcGVhcmFuY2VfaWQ6IGFwcGVhcmFuY2VJZCxcbiAgICAgICAgcmVzcG9uc2U6IHNlbGVjdGVkLFxuICAgICAgICBzdXJ2ZXlfdHlwZTogJ3Bvc3RfY29tcGFjdCcsXG4gICAgICB9KVxuICAgIH0sXG4gICAgW10sXG4gIClcblxuICBjb25zdCB7IHN0YXRlLCBsYXN0UmVzcG9uc2UsIG9wZW4sIGhhbmRsZVNlbGVjdCB9ID0gdXNlU3VydmV5U3RhdGUoe1xuICAgIGhpZGVUaGFua3NBZnRlck1zOiBISURFX1RIQU5LU19BRlRFUl9NUyxcbiAgICBvbk9wZW4sXG4gICAgb25TZWxlY3QsXG4gIH0pXG5cbiAgLy8gQ2hlY2sgdGhlIGZlYXR1cmUgZ2F0ZSBvbiBtb3VudFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCkgcmV0dXJuXG4gICAgc2V0R2F0ZUVuYWJsZWQoXG4gICAgICBjaGVja1N0YXRzaWdGZWF0dXJlR2F0ZV9DQUNIRURfTUFZX0JFX1NUQUxFKFBPU1RfQ09NUEFDVF9TVVJWRVlfR0FURSksXG4gICAgKVxuICB9LCBbZW5hYmxlZF0pXG5cbiAgLy8gRmluZCBjb21wYWN0IGJvdW5kYXJ5IG1lc3NhZ2VzXG4gIGNvbnN0IGN1cnJlbnRDb21wYWN0Qm91bmRhcmllcyA9IHVzZU1lbW8oXG4gICAgKCkgPT5cbiAgICAgIG5ldyBTZXQoXG4gICAgICAgIG1lc3NhZ2VzXG4gICAgICAgICAgLmZpbHRlcihtc2cgPT4gaXNDb21wYWN0Qm91bmRhcnlNZXNzYWdlKG1zZykpXG4gICAgICAgICAgLm1hcChtc2cgPT4gbXNnLnV1aWQpLFxuICAgICAgKSxcbiAgICBbbWVzc2FnZXNdLFxuICApXG5cbiAgLy8gRGV0ZWN0IG5ldyBjb21wYWN0IGJvdW5kYXJpZXMgYW5kIGRlZmVyIHNob3dpbmcgc3VydmV5IHVudGlsIG5leHQgbWVzc2FnZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZW5hYmxlZCkgcmV0dXJuXG5cbiAgICAvLyBEb24ndCBwcm9jZXNzIGlmIGFscmVhZHkgc2hvd2luZ1xuICAgIGlmIChzdGF0ZSAhPT0gJ2Nsb3NlZCcgfHwgaXNMb2FkaW5nKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBEb24ndCBzaG93IHN1cnZleSB3aGVuIHBlcm1pc3Npb24gb3IgYXNrIHF1ZXN0aW9uIHByb21wdHMgYXJlIHZpc2libGVcbiAgICBpZiAoaGFzQWN0aXZlUHJvbXB0KSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgZ2F0ZSBpcyBlbmFibGVkXG4gICAgaWYgKGdhdGVFbmFibGVkICE9PSB0cnVlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoaXNGZWVkYmFja1N1cnZleURpc2FibGVkKCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHN1cnZleSBpcyBleHBsaWNpdGx5IGRpc2FibGVkXG4gICAgaWYgKGlzRW52VHJ1dGh5KHByb2Nlc3MuZW52LkNMQVVERV9DT0RFX0RJU0FCTEVfRkVFREJBQ0tfU1VSVkVZKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gRmlyc3QsIGNoZWNrIGlmIHdlIGhhdmUgYSBwZW5kaW5nIGNvbXBhY3QgYW5kIGEgbmV3IG1lc3NhZ2UgaGFzIGFycml2ZWRcbiAgICBpZiAocGVuZGluZ0NvbXBhY3RCb3VuZGFyeVV1aWQuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgaWYgKFxuICAgICAgICBoYXNNZXNzYWdlQWZ0ZXJCb3VuZGFyeShtZXNzYWdlcywgcGVuZGluZ0NvbXBhY3RCb3VuZGFyeVV1aWQuY3VycmVudClcbiAgICAgICkge1xuICAgICAgICAvLyBBIG5ldyBtZXNzYWdlIGFycml2ZWQgYWZ0ZXIgdGhlIGNvbXBhY3QgLSBkZWNpZGUgd2hldGhlciB0byBzaG93IHN1cnZleVxuICAgICAgICBwZW5kaW5nQ29tcGFjdEJvdW5kYXJ5VXVpZC5jdXJyZW50ID0gbnVsbFxuXG4gICAgICAgIC8vIE9ubHkgc2hvdyBzdXJ2ZXkgMjAlIG9mIHRoZSB0aW1lXG4gICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDwgU1VSVkVZX1BST0JBQklMSVRZKSB7XG4gICAgICAgICAgb3BlbigpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmluZCBuZXcgY29tcGFjdCBib3VuZGFyaWVzIHRoYXQgd2UgaGF2ZW4ndCBzZWVuIHlldFxuICAgIGNvbnN0IG5ld0JvdW5kYXJpZXMgPSBBcnJheS5mcm9tKGN1cnJlbnRDb21wYWN0Qm91bmRhcmllcykuZmlsdGVyKFxuICAgICAgdXVpZCA9PiAhc2VlbkNvbXBhY3RCb3VuZGFyaWVzLmN1cnJlbnQuaGFzKHV1aWQpLFxuICAgIClcblxuICAgIGlmIChuZXdCb3VuZGFyaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIE1hcmsgdGhlc2UgYm91bmRhcmllcyBhcyBzZWVuXG4gICAgICBzZWVuQ29tcGFjdEJvdW5kYXJpZXMuY3VycmVudCA9IG5ldyBTZXQoY3VycmVudENvbXBhY3RCb3VuZGFyaWVzKVxuXG4gICAgICAvLyBEb24ndCBzaG93IHN1cnZleSBpbW1lZGlhdGVseSAtIHdhaXQgZm9yIG5leHQgbWVzc2FnZVxuICAgICAgLy8gU3RvcmUgdGhlIG1vc3QgcmVjZW50IG5ldyBib3VuZGFyeSBVVUlEXG4gICAgICBwZW5kaW5nQ29tcGFjdEJvdW5kYXJ5VXVpZC5jdXJyZW50ID1cbiAgICAgICAgbmV3Qm91bmRhcmllc1tuZXdCb3VuZGFyaWVzLmxlbmd0aCAtIDFdIVxuICAgIH1cbiAgfSwgW1xuICAgIGVuYWJsZWQsXG4gICAgY3VycmVudENvbXBhY3RCb3VuZGFyaWVzLFxuICAgIHN0YXRlLFxuICAgIGlzTG9hZGluZyxcbiAgICBoYXNBY3RpdmVQcm9tcHQsXG4gICAgZ2F0ZUVuYWJsZWQsXG4gICAgbWVzc2FnZXMsXG4gICAgb3BlbixcbiAgXSlcblxuICByZXR1cm4geyBzdGF0ZSwgbGFzdFJlc3BvbnNlLCBoYW5kbGVTZWxlY3QgfVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsU0FBU0EsV0FBVyxFQUFFQyxTQUFTLEVBQUVDLE9BQU8sRUFBRUMsTUFBTSxFQUFFQyxRQUFRLFFBQVEsT0FBTztBQUN6RSxTQUFTQyx3QkFBd0IsUUFBUSxrQ0FBa0M7QUFDM0UsU0FBU0MsMkNBQTJDLFFBQVEsc0NBQXNDO0FBQ2xHLFNBQ0UsS0FBS0MsMERBQTBELEVBQy9EQyxRQUFRLFFBQ0gsaUNBQWlDO0FBQ3hDLFNBQVNDLGdDQUFnQyxRQUFRLGdEQUFnRDtBQUNqRyxjQUFjQyxPQUFPLFFBQVEsd0JBQXdCO0FBQ3JELFNBQVNDLFdBQVcsUUFBUSx5QkFBeUI7QUFDckQsU0FBU0Msd0JBQXdCLFFBQVEseUJBQXlCO0FBQ2xFLFNBQVNDLFlBQVksUUFBUSxpQ0FBaUM7QUFDOUQsU0FB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