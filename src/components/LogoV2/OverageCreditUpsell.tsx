// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 接入 formatGrantAmount、getCachedOverageCreditGrant、refreshOverageCreditGrantCache 服务层能力，把外部通信或共享状态交给 ../../services/api/overageCreditGrant.js 处理。
import { formatGrantAmount, getCachedOverageCreditGrant, refreshOverageCreditGrantCache } from '../../services/api/overageCreditGrant.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 truncate 工具函数，把通用处理留在 ../../utils/format.js 中维护。
import { truncate } from '../../utils/format.js';
// 类型依赖 { FeedConfig } 来自 ./Feed.js，用于校准终端渲染的数据契约。
import type { FeedConfig } from './Feed.js';
// MAX_IMPRESSIONS 集合保存`3`，供终端 UI Overage Credit Upsell后续判断或输出使用。
const MAX_IMPRESSIONS = 3;

/**
 * Whether to show the overage credit upsell on any surface.
 *
 * Eligibility comes entirely from the backend GET /overage_credit_grant
 * response — the CLI doesn't replicate tier/threshold/role checks. The
 * backend returns available: false for Team members who aren't admins,
 * so they don't see an upsell they can't act on.
 *
 * isEligibleForOverageCreditGrant — just the backend eligibility. Use for
 *   persistent reference surfaces (/usage) where the info should show
 *   whenever eligible, no impression cap.
 * shouldShowOverageCreditUpsell — adds the 3-impression cap and
 *   hasVisitedExtraUsage dismiss. Use for promotional surfaces
 *   (welcome feed, tips).
 */
// isEligibleForOverageCreditGrant 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEligibleForOverageCreditGrant(): boolean {
  // info读取`getCachedOverageCreditGrant`，供终端渲染后续处理使用。
  const info = getCachedOverageCreditGrant();
  // 只有 `!info || !info.available || info.granted` 满足时，终端渲染才执行该分支。
  if (!info || !info.available || info.granted) return false;
  // 返回 `formatGrantAmount(info) !== null`，作为终端渲染这次计算的结果。
  return formatGrantAmount(info) !== null;
}
// shouldShowOverageCreditUpsell 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowOverageCreditUpsell(): boolean {
  // 满足 `!isEligibleForOverageCreditGrant()` 时，终端渲染执行该分支。
  if (!isEligibleForOverageCreditGrant()) return false;
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 满足 `config.hasVisitedExtraUsage` 时，终端渲染执行该分支。
  if (config.hasVisitedExtraUsage) return false;
  // 满足 `(config.overageCreditUpsellSeenCount ?? 0) >= MAX_IMPRESSIONS` 时，终端渲染执行该分支。
  if ((config.overageCreditUpsellSeenCount ?? 0) >= MAX_IMPRESSIONS) return false;
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true;
}

/**
 * Kick off a background fetch if the cache is empty. Safe to call
 * unconditionally on mount — it no-ops if cache is fresh.
 */
// maybeRefreshOverageCreditCache 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function maybeRefreshOverageCreditCache(): void {
  // `getCachedOverageCreditGrant()` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (getCachedOverageCreditGrant() !== null) return;
  // 显式忽略 `refreshOverageCreditGrantCache()` 的返回值，只保留它触发的副作用。
  void refreshOverageCreditGrantCache();
}
// useShowOverageCreditUpsell 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useShowOverageCreditUpsell() {
  // show 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [show] = useState(_temp);
  // 返回 `show`，作为终端渲染这次计算的结果。
  return show;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 调用 maybeRefreshOverageCreditCache，触发终端渲染此处需要的副作用。
  maybeRefreshOverageCreditCache();
  // 返回 `shouldShowOverageCreditUpsell()`，作为终端渲染这次计算的结果。
  return shouldShowOverageCreditUpsell();
}
// incrementOverageCreditUpsellSeenCount 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function incrementOverageCreditUpsellSeenCount(): void {
  // newCount 数量保存`0`，供后续判断或组装使用。
  let newCount = 0;
  // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
  saveGlobalConfig(prev => {
    // newCount 数量更新为 `(prev.overageCreditUpsellSeenCount ?? 0) + 1`，确保终端 UI后续读取最新状态。
    newCount = (prev.overageCreditUpsellSeenCount ?? 0) + 1;
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      ...prev,
      overageCreditUpsellSeenCount: newCount
    };
  });
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_overage_credit_upsell_shown', {
    seen_count: newCount
  });
}

// Copy from "OC & Bulk Overages copy" doc (#6 — CLI /usage)
// getUsageText 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUsageText(amount: string): string {
  // 返回 ``${amount} in extra usage for third-party apps · /extra-usage``，作为终端渲染这次计算的结果。
  return `${amount} in extra usage for third-party apps · /extra-usage`;
}

// Copy from "OC & Bulk Overages copy" doc (#4 — CLI Welcome screen).
// Char budgets: title ≤19, subtitle ≤48.
// FEED_SUBTITLE 标题固定为 `'On us. Works on third-party apps · /extra-usage'`，作为终端 UI Overage Credit Upsell后续展示或比较的基准。
const FEED_SUBTITLE = 'On us. Works on third-party apps · /extra-usage';
// getFeedTitle 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getFeedTitle(amount: string): string {
  // 返回 ``${amount} in extra usage``，作为终端渲染这次计算的结果。
  return `${amount} in extra usage`;
}
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  maxWidth?: number;
  twoLine?: boolean;
};
// OverageCreditUpsell 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function OverageCreditUpsell(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(8);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    maxWidth,
    twoLine
  } = t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // t2 暂存 `Symbol.for("react.early_return_sentinel")` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== maxWidth || $[1] !== twoLine) {
    // t2 暂存 `Symbol.for("react.early_return_sentinel")` 生成的渲染片段，后续返回路径直接复用。
    t2 = Symbol.for("react.early_return_sentinel");
    // 终端 UI 组件 Overage Credit Upsell在这里处理 `bb0: {`，完成这一小步状态转换。
    bb0: {
      // info读取`getCachedOverageCreditGrant`，供终端渲染后续处理使用。
      const info = getCachedOverageCreditGrant();
      // info缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!info) {
        // t2 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t2 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // amount格式化`formatGrantAmount`，供终端渲染后续处理使用。
      const amount = formatGrantAmount(info);
      // amount缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!amount) {
        // t2 暂存 `null` 生成的渲染片段，后续返回路径直接复用。
        t2 = null;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 满足 `twoLine` 时，终端渲染执行该分支。
      if (twoLine) {
        // title 标题读取`getFeedTitle`，供终端渲染后续处理使用。
        const title = getFeedTitle(amount);
        // t3 暂存 `maxWidth ? truncate(FEED_SUBTITLE, maxWidth) : FEED_SUBTI...` 的派生结果，便于缓存命中时直接复用。
        let t3;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[4] !== maxWidth) {
          // t3 暂存 `maxWidth ? truncate(FEED_SUBTITLE, maxWidth) : FEED_SUBTI...` 生成的渲染片段，后续返回路径直接复用。
          t3 = maxWidth ? truncate(FEED_SUBTITLE, maxWidth) : FEED_SUBTITLE;
          // $[4] 缓存 `maxWidth`，下次依赖未变时 React 编译产物可直接复用。
          $[4] = maxWidth;
          // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[5] = t3;
        } else {
          // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
          t3 = $[5];
        }
        // t4 暂存 `<Text dimColor={true}>{t3}</Text>` 的派生结果，便于缓存命中时直接复用。
        let t4;
        // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
        if ($[6] !== t3) {
          // t4 暂存 `<Text dimColor={true}>{t3}</Text>` 生成的渲染片段，后续返回路径直接复用。
          t4 = <Text dimColor={true}>{t3}</Text>;
          // $[6] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
          $[6] = t3;
          // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
          $[7] = t4;
        } else {
          // t4 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
          t4 = $[7];
        }
        // t2 暂存 `<><Text color="claude">{maxWidth ? truncate(title, maxWid...` 生成的渲染片段，后续返回路径直接复用。
        t2 = <><Text color="claude">{maxWidth ? truncate(title, maxWidth) : title}</Text>{t4}</>;
        // 结束这个分支或循环，避免终端渲染继续落入后续路径。
        break bb0;
      }
      // 文本读取`getUsageText`，供终端渲染后续处理使用。
      const text = getUsageText(amount);
      // display保存`truncate`，供终端渲染后续处理使用。
      const display = maxWidth ? truncate(text, maxWidth) : text;
      // highlightLen保存`Math.min`，供终端渲染后续处理使用。
      const highlightLen = Math.min(getFeedTitle(amount).length, display.length);
      // t1 暂存 `<Text dimColor={true}><Text color="claude">{display.slice...` 生成的渲染片段，后续返回路径直接复用。
      t1 = <Text dimColor={true}><Text color="claude">{display.slice(0, highlightLen)}</Text>{display.slice(highlightLen)}</Text>;
    }
    // $[0] 缓存 `maxWidth`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = maxWidth;
    // $[1] 缓存 `twoLine`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = twoLine;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // `t2` 与 `Symbol.for("react.early_return_...` 不一致时刷新派生状态，避免使用过期结果。
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // 返回 `t1`，作为终端渲染这次计算的结果。
  return t1;
}

/**
 * Feed config for the homescreen rotating feed. Mirrors
 * createGuestPassesFeed in feedConfigs.tsx.
 *
 * Copy from "OC & Bulk Overages copy" doc (#4 — CLI Welcome screen).
 * Char budgets: title ≤19, subtitle ≤48.
 */
// createOverageCreditFeed 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createOverageCreditFeed(): FeedConfig {
  // info读取`getCachedOverageCreditGrant`，供终端渲染后续处理使用。
  const info = getCachedOverageCreditGrant();
  // amount格式化`formatGrantAmount`，供终端渲染后续处理使用。
  const amount = info ? formatGrantAmount(info) : null;
  // title 标题读取`getFeedTitle`，供终端渲染后续处理使用。
  const title = amount ? getFeedTitle(amount) : 'extra usage credit';
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    title,
    lines: [],
    customContent: {
      content: <Text dimColor>{FEED_SUBTITLE}</Text>,
      width: Math.max(title.length, FEED_SUBTITLE.length)
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiVGV4dCIsImxvZ0V2ZW50IiwiZm9ybWF0R3JhbnRBbW91bnQiLCJnZXRDYWNoZWRPdmVyYWdlQ3JlZGl0R3JhbnQiLCJyZWZyZXNoT3ZlcmFnZUNyZWRpdEdyYW50Q2FjaGUiLCJnZXRHbG9iYWxDb25maWciLCJzYXZlR2xvYmFsQ29uZmlnIiwidHJ1bmNhdGUiLCJGZWVkQ29uZmlnIiwiTUFYX0lNUFJFU1NJT05TIiwiaXNFbGlnaWJsZUZvck92ZXJhZ2VDcmVkaXRHcmFudCIsImluZm8iLCJhdmFpbGFibGUiLCJncmFudGVkIiwic2hvdWxkU2hvd092ZXJhZ2VDcmVkaXRVcHNlbGwiLCJjb25maWciLCJoYXNWaXNpdGVkRXh0cmFVc2FnZSIsIm92ZXJhZ2VDcmVkaXRVcHNlbGxTZWVuQ291bnQiLCJtYXliZVJlZnJlc2hPdmVyYWdlQ3JlZGl0Q2FjaGUiLCJ1c2VTaG93T3ZlcmFnZUNyZWRpdFVwc2VsbCIsInNob3ciLCJfdGVtcCIsImluY3JlbWVudE92ZXJhZ2VDcmVkaXRVcHNlbGxTZWVuQ291bnQiLCJuZXdDb3VudCIsInByZXYiLCJzZWVuX2NvdW50IiwiZ2V0VXNhZ2VUZXh0IiwiYW1vdW50IiwiRkVFRF9TVUJUSVRMRSIsImdldEZlZWRUaXRsZSIsIlByb3BzIiwibWF4V2lkdGgiLCJ0d29MaW5lIiwiT3ZlcmFnZUNyZWRpdFVwc2VsbCIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsIlN5bWJvbCIsImZvciIsImJiMCIsInRpdGxlIiwidDMiLCJ0NCIsInRleHQiLCJkaXNwbGF5IiwiaGlnaGxpZ2h0TGVuIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInNsaWNlIiwiY3JlYXRlT3ZlcmFnZUNyZWRpdEZlZWQiLCJsaW5lcyIsImN1c3RvbUNvbnRlbnQiLCJjb250ZW50Iiwid2lkdGgiLCJtYXgiXSwic291cmNlcyI6WyJPdmVyYWdlQ3JlZGl0VXBzZWxsLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQge1xuICBmb3JtYXRHcmFudEFtb3VudCxcbiAgZ2V0Q2FjaGVkT3ZlcmFnZUNyZWRpdEdyYW50LFxuICByZWZyZXNoT3ZlcmFnZUNyZWRpdEdyYW50Q2FjaGUsXG59IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FwaS9vdmVyYWdlQ3JlZGl0R3JhbnQuanMnXG5pbXBvcnQgeyBnZXRHbG9iYWxDb25maWcsIHNhdmVHbG9iYWxDb25maWcgfSBmcm9tICcuLi8uLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyB0cnVuY2F0ZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Zvcm1hdC5qcydcbmltcG9ydCB0eXBlIHsgRmVlZENvbmZpZyB9IGZyb20gJy4vRmVlZC5qcydcblxuY29uc3QgTUFYX0lNUFJFU1NJT05TID0gM1xuXG4vKipcbiAqIFdoZXRoZXIgdG8gc2hvdyB0aGUgb3ZlcmFnZSBjcmVkaXQgdXBzZWxsIG9uIGFueSBzdXJmYWNlLlxuICpcbiAqIEVsaWdpYmlsaXR5IGNvbWVzIGVudGlyZWx5IGZyb20gdGhlIGJhY2tlbmQgR0VUIC9vdmVyYWdlX2NyZWRpdF9ncmFudFxuICogcmVzcG9uc2Ug4oCUIHRoZSBDTEkgZG9lc24ndCByZXBsaWNhdGUgdGllci90aHJlc2hvbGQvcm9sZSBjaGVja3MuIFRoZVxuICogYmFja2VuZCByZXR1cm5zIGF2YWlsYWJsZTogZmFsc2UgZm9yIFRlYW0gbWVtYmVycyB3aG8gYXJlbid0IGFkbWlucyxcbiAqIHNvIHRoZXkgZG9uJ3Qgc2VlIGFuIHVwc2VsbCB0aGV5IGNhbid0IGFjdCBvbi5cbiAqXG4gKiBpc0VsaWdpYmxlRm9yT3ZlcmFnZUNyZWRpdEdyYW50IOKAlCBqdXN0IHRoZSBiYWNrZW5kIGVsaWdpYmlsaXR5LiBVc2UgZm9yXG4gKiAgIHBlcnNpc3RlbnQgcmVmZXJlbmNlIHN1cmZhY2VzICgvdXNhZ2UpIHdoZXJlIHRoZSBpbmZvIHNob3VsZCBzaG93XG4gKiAgIHdoZW5ldmVyIGVsaWdpYmxlLCBubyBpbXByZXNzaW9uIGNhcC5cbiAqIHNob3VsZFNob3dPdmVyYWdlQ3JlZGl0VXBzZWxsIOKAlCBhZGRzIHRoZSAzLWltcHJlc3Npb24gY2FwIGFuZFxuICogICBoYXNWaXNpdGVkRXh0cmFVc2FnZSBkaXNtaXNzLiBVc2UgZm9yIHByb21vdGlvbmFsIHN1cmZhY2VzXG4gKiAgICh3ZWxjb21lIGZlZWQsIHRpcHMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNFbGlnaWJsZUZvck92ZXJhZ2VDcmVkaXRHcmFudCgpOiBib29sZWFuIHtcbiAgY29uc3QgaW5mbyA9IGdldENhY2hlZE92ZXJhZ2VDcmVkaXRHcmFudCgpXG4gIGlmICghaW5mbyB8fCAhaW5mby5hdmFpbGFibGUgfHwgaW5mby5ncmFudGVkKSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIGZvcm1hdEdyYW50QW1vdW50KGluZm8pICE9PSBudWxsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRTaG93T3ZlcmFnZUNyZWRpdFVwc2VsbCgpOiBib29sZWFuIHtcbiAgaWYgKCFpc0VsaWdpYmxlRm9yT3ZlcmFnZUNyZWRpdEdyYW50KCkpIHJldHVybiBmYWxzZVxuXG4gIGNvbnN0IGNvbmZpZyA9IGdldEdsb2JhbENvbmZpZygpXG4gIGlmIChjb25maWcuaGFzVmlzaXRlZEV4dHJhVXNhZ2UpIHJldHVybiBmYWxzZVxuICBpZiAoKGNvbmZpZy5vdmVyYWdlQ3JlZGl0VXBzZWxsU2VlbkNvdW50ID8/IDApID49IE1BWF9JTVBSRVNTSU9OUylcbiAgICByZXR1cm4gZmFsc2VcblxuICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIEtpY2sgb2ZmIGEgYmFja2dyb3VuZCBmZXRjaCBpZiB0aGUgY2FjaGUgaXMgZW1wdHkuIFNhZmUgdG8gY2FsbFxuICogdW5jb25kaXRpb25hbGx5IG9uIG1vdW50IOKAlCBpdCBuby1vcHMgaWYgY2FjaGUgaXMgZnJlc2guXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXliZVJlZnJlc2hPdmVyYWdlQ3JlZGl0Q2FjaGUoKTogdm9pZCB7XG4gIGlmIChnZXRDYWNoZWRPdmVyYWdlQ3JlZGl0R3JhbnQoKSAhPT0gbnVsbCkgcmV0dXJuXG4gIHZvaWQgcmVmcmVzaE92ZXJhZ2VDcmVkaXRHcmFudENhY2hlKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVNob3dPdmVyYWdlQ3JlZGl0VXBzZWxsKCk6IGJvb2xlYW4ge1xuICBjb25zdCBbc2hvd10gPSB1c2VTdGF0ZSgoKSA9PiB7XG4gICAgbWF5YmVSZWZyZXNoT3ZlcmFnZUNyZWRpdENhY2hlKClcbiAgICByZXR1cm4gc2hvdWxkU2hvd092ZXJhZ2VDcmVkaXRVcHNlbGwoKVxuICB9KVxuICByZXR1cm4gc2hvd1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50T3ZlcmFnZUNyZWRpdFVwc2VsbFNlZW5Db3VudCgpOiB2b2lkIHtcbiAgbGV0IG5ld0NvdW50ID0gMFxuICBzYXZlR2xvYmFsQ29uZmlnKHByZXYgPT4ge1xuICAgIG5ld0NvdW50ID0gKHByZXYub3ZlcmFnZUNyZWRpdFVwc2VsbFNlZW5Db3VudCA/PyAwKSArIDFcbiAgICByZXR1cm4ge1xuICAgICAgLi4ucHJldixcbiAgICAgIG92ZXJhZ2VDcmVkaXRVcHNlbGxTZWVuQ291bnQ6IG5ld0NvdW50LFxuICAgIH1cbiAgfSlcbiAgbG9nRXZlbnQoJ3Rlbmd1X292ZXJhZ2VfY3JlZGl0X3Vwc2VsbF9zaG93bicsIHsgc2Vlbl9jb3VudDogbmV3Q291bnQgfSlcbn1cblxuLy8gQ29weSBmcm9tIFwiT0MgJiBCdWxrIE92ZXJhZ2VzIGNvcHlcIiBkb2MgKCM2IOKAlCBDTEkgL3VzYWdlKVxuZnVuY3Rpb24gZ2V0VXNhZ2VUZXh0KGFtb3VudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Ftb3VudH0gaW4gZXh0cmEgdXNhZ2UgZm9yIHRoaXJkLXBhcnR5IGFwcHMgwrcgL2V4dHJhLXVzYWdlYFxufVxuXG4vLyBDb3B5IGZyb20gXCJPQyAmIEJ1bGsgT3ZlcmFnZXMgY29weVwiIGRvYyAoIzQg4oCUIENMSSBXZWxjb21lIHNjcmVlbikuXG4vLyBDaGFyIGJ1ZGdldHM6IHRpdGxlIOKJpDE5LCBzdWJ0aXRsZSDiiaQ0OC5cbmNvbnN0IEZFRURfU1VCVElUTEUgPSAnT24gdXMuIFdvcmtzIG9uIHRoaXJkLXBhcnR5IGFwcHMgwrcgL2V4dHJhLXVzYWdlJ1xuXG5mdW5jdGlvbiBnZXRGZWVkVGl0bGUoYW1vdW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7YW1vdW50fSBpbiBleHRyYSB1c2FnZWBcbn1cblxudHlwZSBQcm9wcyA9IHsgbWF4V2lkdGg/OiBudW1iZXI7IHR3b0xpbmU/OiBib29sZWFuIH1cblxuZXhwb3J0IGZ1bmN0aW9uIE92ZXJhZ2VDcmVkaXRVcHNlbGwoe1xuICBtYXhXaWR0aCxcbiAgdHdvTGluZSxcbn06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgaW5mbyA9IGdldENhY2hlZE92ZXJhZ2VDcmVkaXRHcmFudCgpXG4gIGlmICghaW5mbykgcmV0dXJuIG51bGxcbiAgY29uc3QgYW1vdW50ID0gZm9ybWF0R3JhbnRBbW91bnQoaW5mbylcbiAgaWYgKCFhbW91bnQpIHJldHVybiBudWxsXG5cbiAgaWYgKHR3b0xpbmUpIHtcbiAgICBjb25zdCB0aXRsZSA9IGdldEZlZWRUaXRsZShhbW91bnQpXG4gICAgcmV0dXJuIChcbiAgICAgIDw+XG4gICAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+XG4gICAgICAgICAge21heFdpZHRoID8gdHJ1bmNhdGUodGl0bGUsIG1heFdpZHRoKSA6IHRpdGxlfVxuICAgICAgICA8L1RleHQ+XG4gICAgICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgICAgIHttYXhXaWR0aCA/IHRydW5jYXRlKEZFRURfU1VCVElUTEUsIG1heFdpZHRoKSA6IEZFRURfU1VCVElUTEV9XG4gICAgICAgIDwvVGV4dD5cbiAgICAgIDwvPlxuICAgIClcbiAgfVxuXG4gIGNvbnN0IHRleHQgPSBnZXRVc2FnZVRleHQoYW1vdW50KVxuICBjb25zdCBkaXNwbGF5ID0gbWF4V2lkdGggPyB0cnVuY2F0ZSh0ZXh0LCBtYXhXaWR0aCkgOiB0ZXh0XG4gIGNvbnN0IGhpZ2hsaWdodExlbiA9IE1hdGgubWluKGdldEZlZWRUaXRsZShhbW91bnQpLmxlbmd0aCwgZGlzcGxheS5sZW5ndGgpXG5cbiAgcmV0dXJuIChcbiAgICA8VGV4dCBkaW1Db2xvcj5cbiAgICAgIDxUZXh0IGNvbG9yPVwiY2xhdWRlXCI+e2Rpc3BsYXkuc2xpY2UoMCwgaGlnaGxpZ2h0TGVuKX08L1RleHQ+XG4gICAgICB7ZGlzcGxheS5zbGljZShoaWdobGlnaHRMZW4pfVxuICAgIDwvVGV4dD5cbiAgKVxufVxuXG4vKipcbiAqIEZlZWQgY29uZmlnIGZvciB0aGUgaG9tZXNjcmVlbiByb3RhdGluZyBmZWVkLiBNaXJyb3JzXG4gKiBjcmVhdGVHdWVzdFBhc3Nlc0ZlZWQgaW4gZmVlZENvbmZpZ3MudHN4LlxuICpcbiAqIENvcHkgZnJvbSBcIk9DICYgQnVsayBPdmVyYWdlcyBjb3B5XCIgZG9jICgjNCDigJQgQ0xJIFdlbGNvbWUgc2NyZWVuKS5cbiAqIENoYXIgYnVkZ2V0czogdGl0bGUg4omkMTksIHN1YnRpdGxlIOKJpDQ4LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlT3ZlcmFnZUNyZWRpdEZlZWQoKTogRmVlZENvbmZpZyB7XG4gIGNvbnN0IGluZm8gPSBnZXRDYWNoZWRPdmVyYWdlQ3JlZGl0R3JhbnQoKVxuICBjb25zdCBhbW91bnQgPSBpbmZvID8gZm9ybWF0R3JhbnRBbW91bnQoaW5mbykgOiBudWxsXG4gIGNvbnN0IHRpdGxlID0gYW1vdW50ID8gZ2V0RmVlZFRpdGxlKGFtb3VudCkgOiAnZXh0cmEgdXNhZ2UgY3JlZGl0J1xuICByZXR1cm4ge1xuICAgIHRpdGxlLFxuICAgIGxpbmVzOiBbXSxcbiAgICBjdXN0b21Db250ZW50OiB7XG4gICAgICBjb250ZW50OiA8VGV4dCBkaW1Db2xvcj57RkVFRF9TVUJUSVRMRX08L1RleHQ+LFxuICAgICAgd2lkdGg6IE1hdGgubWF4KHRpdGxlLmxlbmd0aCwgRkVFRF9TVUJUSVRMRS5sZW5ndGgpLFxuICAgIH0sXG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxRQUFRLE9BQU87QUFDaEMsU0FBU0MsSUFBSSxRQUFRLGNBQWM7QUFDbkMsU0FBU0MsUUFBUSxRQUFRLG1DQUFtQztBQUM1RCxTQUNFQyxpQkFBaUIsRUFDakJDLDJCQUEyQixFQUMzQkMsOEJBQThCLFFBQ3pCLDBDQUEwQztBQUNqRCxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLHVCQUF1QjtBQUN6RSxTQUFTQyxRQUFRLFFBQVEsdUJBQXVCO0FBQ2hELGNBQWNDLFVBQVUsUUFBUSxXQUFXO0FBRTNDLE1BQU1DLGVBQWUsR0FBRyxDQUFDOztBQUV6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLFNBQVNDLCtCQUErQkEsQ0FBQSxDQUFFLEVBQUUsT0FBTyxDQUFDO0VBQ3pELE1BQU1DLElBQUksR0FBR1IsMkJBQTJCLENBQUMsQ0FBQztFQUMxQyxJQUFJLENBQUNRLElBQUksSUFBSSxDQUFDQSxJQUFJLENBQUNDLFNBQVMsSUFBSUQsSUFBSSxDQUFDRSxPQUFPLEVBQUUsT0FBTyxLQUFLO0VBQzFELE9BQU9YLGlCQUFpQixDQUFDUyxJQUFJLENBQUMsS0FBSyxJQUFJO0FBQ3pDO0FBRUEsT0FBTyxTQUFTRyw2QkFBNkJBLENBQUEsQ0FBRSxFQUFFLE9BQU8sQ0FBQztFQUN2RCxJQUFJLENBQUNKLCtCQUErQixDQUFDLENB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