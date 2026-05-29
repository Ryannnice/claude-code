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
// 接入 checkCachedPassesEligibility、formatCreditAmount、getCachedReferrerReward、getCachedRemainingPasses 服务层能力，把外部通信或共享状态交给 ../../services/api/referral.js 处理。
import { checkCachedPassesEligibility, formatCreditAmount, getCachedReferrerReward, getCachedRemainingPasses } from '../../services/api/referral.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// resetIfPassesRefreshed 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function resetIfPassesRefreshed(): void {
  // remaining读取`getCachedRemainingPasses`，供终端渲染后续处理使用。
  const remaining = getCachedRemainingPasses();
  // 只有 `remaining == null || remaining <= 0` 满足时，终端渲染才执行该分支。
  if (remaining == null || remaining <= 0) return;
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // lastSeen 命名 `config.passesLastSeenRemaining ?? 0`，让后续代码直接表达这个值的用途。
  const lastSeen = config.passesLastSeenRemaining ?? 0;
  // 满足 `remaining > lastSeen` 时，终端渲染执行该分支。
  if (remaining > lastSeen) {
    // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
    saveGlobalConfig(prev => ({
      ...prev,
      passesUpsellSeenCount: 0,
      hasVisitedPasses: false,
      passesLastSeenRemaining: remaining
    }));
  }
}
// shouldShowGuestPassesUpsell 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldShowGuestPassesUpsell(): boolean {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    eligible,
    hasCache
  } = checkCachedPassesEligibility();
  // Only show if eligible and cache exists (don't block on fetch)
  // 只有 `!eligible || !hasCache` 满足时，终端渲染才执行该分支。
  if (!eligible || !hasCache) return false;
  // Reset upsell counters if passes were refreshed (covers both campaign change and pass refresh)
  // 调用 resetIfPassesRefreshed，触发终端渲染此处需要的副作用。
  resetIfPassesRefreshed();
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 满足 `(config.passesUpsellSeenCount ?? 0) >= 3` 时，终端渲染执行该分支。
  if ((config.passesUpsellSeenCount ?? 0) >= 3) return false;
  // 满足 `config.hasVisitedPasses` 时，终端渲染执行该分支。
  if (config.hasVisitedPasses) return false;
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true;
}
// useShowGuestPassesUpsell 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useShowGuestPassesUpsell() {
  // show 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [show] = useState(_temp);
  // 返回 `show`，作为终端渲染这次计算的结果。
  return show;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `shouldShowGuestPassesUpsell()`，作为终端渲染这次计算的结果。
  return shouldShowGuestPassesUpsell();
}
// incrementGuestPassesSeenCount 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function incrementGuestPassesSeenCount(): void {
  // newCount 数量保存`0`，供终端 UI Guest Passes Upsell后续判断或输出使用。
  let newCount = 0;
  // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
  saveGlobalConfig(prev => {
    // newCount 数量更新为 `(prev.passesUpsellSeenCount ?? 0) + 1`，确保终端 UI后续读取最新状态。
    newCount = (prev.passesUpsellSeenCount ?? 0) + 1;
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      ...prev,
      passesUpsellSeenCount: newCount
    };
  });
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_guest_passes_upsell_shown', {
    seen_count: newCount
  });
}

// Condensed layout for mini welcome screen
// GuestPassesUpsell 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function GuestPassesUpsell() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `<Text dimColor={true}><Text color="claude">[✻]</Text> <Te...` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // reward读取`getCachedReferrerReward`，供终端渲染后续处理使用。
    const reward = getCachedReferrerReward();
    // t0 暂存 `<Text dimColor={true}><Text color="claude">[✻]</Text> <Te...` 生成的渲染片段，后续返回路径直接复用。
    t0 = <Text dimColor={true}><Text color="claude">[✻]</Text> <Text color="claude">[✻]</Text>{" "}<Text color="claude">[✻]</Text> ·{" "}{reward ? `Share Claude Code and earn ${formatCreditAmount(reward)} of extra usage · /passes` : "3 guest passes at /passes"}</Text>;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwiVGV4dCIsImxvZ0V2ZW50IiwiY2hlY2tDYWNoZWRQYXNzZXNFbGlnaWJpbGl0eSIsImZvcm1hdENyZWRpdEFtb3VudCIsImdldENhY2hlZFJlZmVycmVyUmV3YXJkIiwiZ2V0Q2FjaGVkUmVtYWluaW5nUGFzc2VzIiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsInJlc2V0SWZQYXNzZXNSZWZyZXNoZWQiLCJyZW1haW5pbmciLCJjb25maWciLCJsYXN0U2VlbiIsInBhc3Nlc0xhc3RTZWVuUmVtYWluaW5nIiwicHJldiIsInBhc3Nlc1Vwc2VsbFNlZW5Db3VudCIsImhhc1Zpc2l0ZWRQYXNzZXMiLCJzaG91bGRTaG93R3Vlc3RQYXNzZXNVcHNlbGwiLCJlbGlnaWJsZSIsImhhc0NhY2hlIiwidXNlU2hvd0d1ZXN0UGFzc2VzVXBzZWxsIiwic2hvdyIsIl90ZW1wIiwiaW5jcmVtZW50R3Vlc3RQYXNzZXNTZWVuQ291bnQiLCJuZXdDb3VudCIsInNlZW5fY291bnQiLCJHdWVzdFBhc3Nlc1Vwc2VsbCIsIiQiLCJfYyIsInQwIiwiU3ltYm9sIiwiZm9yIiwicmV3YXJkIl0sInNvdXJjZXMiOlsiR3Vlc3RQYXNzZXNVcHNlbGwudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IFRleHQgfSBmcm9tICcuLi8uLi9pbmsuanMnXG5pbXBvcnQgeyBsb2dFdmVudCB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7XG4gIGNoZWNrQ2FjaGVkUGFzc2VzRWxpZ2liaWxpdHksXG4gIGZvcm1hdENyZWRpdEFtb3VudCxcbiAgZ2V0Q2FjaGVkUmVmZXJyZXJSZXdhcmQsXG4gIGdldENhY2hlZFJlbWFpbmluZ1Bhc3Nlcyxcbn0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXBpL3JlZmVycmFsLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uZmlnLmpzJ1xuXG5mdW5jdGlvbiByZXNldElmUGFzc2VzUmVmcmVzaGVkKCk6IHZvaWQge1xuICBjb25zdCByZW1haW5pbmcgPSBnZXRDYWNoZWRSZW1haW5pbmdQYXNzZXMoKVxuICBpZiAocmVtYWluaW5nID09IG51bGwgfHwgcmVtYWluaW5nIDw9IDApIHJldHVyblxuICBjb25zdCBjb25maWcgPSBnZXRHbG9iYWxDb25maWcoKVxuICBjb25zdCBsYXN0U2VlbiA9IGNvbmZpZy5wYXNzZXNMYXN0U2VlblJlbWFpbmluZyA/PyAwXG4gIGlmIChyZW1haW5pbmcgPiBsYXN0U2Vlbikge1xuICAgIHNhdmVHbG9iYWxDb25maWcocHJldiA9PiAoe1xuICAgICAgLi4ucHJldixcbiAgICAgIHBhc3Nlc1Vwc2VsbFNlZW5Db3VudDogMCxcbiAgICAgIGhhc1Zpc2l0ZWRQYXNzZXM6IGZhbHNlLFxuICAgICAgcGFzc2VzTGFzdFNlZW5SZW1haW5pbmc6IHJlbWFpbmluZyxcbiAgICB9KSlcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRTaG93R3Vlc3RQYXNzZXNVcHNlbGwoKTogYm9vbGVhbiB7XG4gIGNvbnN0IHsgZWxpZ2libGUsIGhhc0NhY2hlIH0gPSBjaGVja0NhY2hlZFBhc3Nlc0VsaWdpYmlsaXR5KClcbiAgLy8gT25seSBzaG93IGlmIGVsaWdpYmxlIGFuZCBjYWNoZSBleGlzdHMgKGRvbid0IGJsb2NrIG9uIGZldGNoKVxuICBpZiAoIWVsaWdpYmxlIHx8ICFoYXNDYWNoZSkgcmV0dXJuIGZhbHNlXG4gIC8vIFJlc2V0IHVwc2VsbCBjb3VudGVycyBpZiBwYXNzZXMgd2VyZSByZWZyZXNoZWQgKGNvdmVycyBib3RoIGNhbXBhaWduIGNoYW5nZSBhbmQgcGFzcyByZWZyZXNoKVxuICByZXNldElmUGFzc2VzUmVmcmVzaGVkKClcblxuICBjb25zdCBjb25maWcgPSBnZXRHbG9iYWxDb25maWcoKVxuICBpZiAoKGNvbmZpZy5wYXNzZXNVcHNlbGxTZWVuQ291bnQgPz8gMCkgPj0gMykgcmV0dXJuIGZhbHNlXG4gIGlmIChjb25maWcuaGFzVmlzaXRlZFBhc3NlcykgcmV0dXJuIGZhbHNlXG5cbiAgcmV0dXJuIHRydWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVNob3dHdWVzdFBhc3Nlc1Vwc2VsbCgpOiBib29sZWFuIHtcbiAgY29uc3QgW3Nob3ddID0gdXNlU3RhdGUoKCkgPT4gc2hvdWxkU2hvd0d1ZXN0UGFzc2VzVXBzZWxsKCkpXG4gIHJldHVybiBzaG93XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNyZW1lbnRHdWVzdFBhc3Nlc1NlZW5Db3VudCgpOiB2b2lkIHtcbiAgbGV0IG5ld0NvdW50ID0gMFxuICBzYXZlR2xvYmFsQ29uZmlnKHByZXYgPT4ge1xuICAgIG5ld0NvdW50ID0gKHByZXYucGFzc2VzVXBzZWxsU2VlbkNvdW50ID8/IDApICsgMVxuICAgIHJldHVybiB7XG4gICAgICAuLi5wcmV2LFxuICAgICAgcGFzc2VzVXBzZWxsU2VlbkNvdW50OiBuZXdDb3VudCxcbiAgICB9XG4gIH0pXG4gIGxvZ0V2ZW50KCd0ZW5ndV9ndWVzdF9wYXNzZXNfdXBzZWxsX3Nob3duJywge1xuICAgIHNlZW5fY291bnQ6IG5ld0NvdW50LFxuICB9KVxufVxuXG4vLyBDb25kZW5zZWQgbGF5b3V0IGZvciBtaW5pIHdlbGNvbWUgc2NyZWVuXG5leHBvcnQgZnVuY3Rpb24gR3Vlc3RQYXNzZXNVcHNlbGwoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgcmV3YXJkID0gZ2V0Q2FjaGVkUmVmZXJyZXJSZXdhcmQoKVxuICByZXR1cm4gKFxuICAgIDxUZXh0IGRpbUNvbG9yPlxuICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIj5b4py7XTwvVGV4dD4gPFRleHQgY29sb3I9XCJjbGF1ZGVcIj5b4py7XTwvVGV4dD57JyAnfVxuICAgICAgPFRleHQgY29sb3I9XCJjbGF1ZGVcIj5b4py7XTwvVGV4dD4gwrd7JyAnfVxuICAgICAge3Jld2FyZFxuICAgICAgICA/IGBTaGFyZSBDbGF1ZGUgQ29kZSBhbmQgZWFybiAke2Zvcm1hdENyZWRpdEFtb3VudChyZXdhcmQpfSBvZiBleHRyYSB1c2FnZSDCtyAvcGFzc2VzYFxuICAgICAgICA6ICczIGd1ZXN0IHBhc3NlcyBhdCAvcGFzc2VzJ31cbiAgICA8L1RleHQ+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sS0FBS0EsS0FBSyxNQUFNLE9BQU87QUFDOUIsU0FBU0MsUUFBUSxRQUFRLE9BQU87QUFDaEMsU0FBU0MsSUFBSSxRQUFRLGNBQWM7QUFDbkMsU0FBU0MsUUFBUSxRQUFRLG1DQUFtQztBQUM1RCxTQUNFQyw0QkFBNEIsRUFDNUJDLGtCQUFrQixFQUNsQkMsdUJBQXVCLEVBQ3ZCQyx3QkFBd0IsUUFDbkIsZ0NBQWdDO0FBQ3ZDLFNBQVNDLGVBQWUsRUFBRUMsZ0JBQWdCLFFBQVEsdUJBQXVCO0FBRXpFLFNBQVNDLHNCQUFzQkEsQ0FBQSxDQUFFLEVBQUUsSUFBSSxDQUFDO0VBQ3RDLE1BQU1DLFNBQVMsR0FBR0osd0JBQXdCLENBQUMsQ0FBQztFQUM1QyxJQUFJSSxTQUFTLElBQUksSUFBSSxJQUFJQSxTQUFTLElBQUksQ0FBQyxFQUFFO0VBQ3pDLE1BQU1DLE1BQU0sR0FBR0osZUFBZSxDQUFDLENBQUM7RUFDaEMsTUFBTUssUUFBUSxHQUFHRCxNQUFNLENBQUNFLHVCQUF1QixJQUFJLENBQUM7RUFDcEQsSUFBSUgsU0FBUyxHQUFHRSxRQUFRLEVBQUU7SUFDeEJKLGdCQUFnQixDQUFDTSxJQUFJLEtBQUs7TUFDeEIsR0FBR0EsSUFBSTtNQUNQQyxxQkFBcUIsRUFBRSxDQUFDO01BQ3hCQyxnQkFBZ0IsRUFBRSxLQUFLO01BQ3ZCSCx1QkFBdUIsRUFBRUg7SUFDM0IsQ0FBQyxDQUFDLENBQUM7RUFDTDtBQUNGO0FBRUEsU0FBU08sMkJBQTJCQSxDQUFBLENBQUUsRUFBRSxPQUFPLENBQUM7RUFDOUMsTUFBTTtJQUFFQyxRQUFRO0lBQUVDO0VBQVMsQ0FBQyxHQUFHaEIsNEJBQTRCLENBQUMsQ0FBQztFQUM3RDtFQUNBLElBQUksQ0FBQ2UsUUFBUSxJQUFJLENBQUNDLFFBQVEsRUFBRSxPQUFPLEtBQUs7RUFDeEM7RUFDQVYsc0JBQXNCLENBQUMsQ0FBQztFQUV4QixNQUFNRSxNQUFNLEdBQUdKLGVBQWUsQ0FBQyxDQUFDO0VBQ2hDLElBQUksQ0FBQ0ksTUFBTSxDQUFDSSxxQkFBcUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sS0FBSztFQUMxRCxJQUFJSixNQUFNLENBQUNLLGdCQUFnQixFQUFFLE9BQU8sS0FBSztFQUV6QyxPQUFPLElBQUk7QUFDYjtBQUVBLE9BQU8sU0FBQUkseUJBQUE7RUFDTCxPQUFBQyxJQUFBLElBQWVyQixRQUFRLENBQUNzQixLQUFtQyxDQUFDO0VBQUEsT0FDckRELElBQUk7QUFBQTtBQUZOLFNBQUFDLE1BQUE7RUFBQSxPQUN5QkwsMkJBQTJCLENBQUMsQ0FBQztBQUFBO0FBSTdELE9BQU8sU0FBU00sNkJBQTZCQSxDQUFBLENBQUUsRUFBRSxJQUFJLENBQUM7RUFDcEQsSUFBSUMsUUFBUSxHQUFHLENBQUM7RUFDaEJoQixnQkFBZ0IsQ0FBQ00sSUFBSSxJQUFJO0lBQ3ZCVSxRQUFRLEdBQUcsQ0FBQ1YsSUFBSSxDQUFDQyxxQkFBcUIsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNoRCxPQUFPO01BQ0wsR0FBR0QsSUFBSTtNQUNQQyxxQkFBcUIsRUFBRVM7SUFDekIsQ0FBQztFQUNILENBQUMsQ0FBQztFQUNGdEIsUUFBUSxDQUFDLGlDQUFpQyxFQUFFO0lBQzFDdUIsVUFBVSxFQUFFRDtFQUNkLENBQUMsQ0FBQztBQUNKOztBQUVBO0FBQ0EsT0FBTyxTQUFBRSxrQkFBQTtFQUFBLE1BQUFDLENBQUEsR0FBQUMsRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBRixDQUFBLFFBQUFHLE1BQUEsQ0FBQUMsR0FBQTtJQUNMLE1BQUFDLE1BQUEsR0FBZTNCLHVCQUF1QixDQUFDLENBQUM7SUFFdEN3QixFQUFBLElBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBUixLQUFPLENBQUMsQ0FDWixDQUFDLElBQUksQ0FBTyxLQUFRLENBQVIsUUFBUSxDQUFDLEdBQUcsRUFBdkIsSUFBSSxDQUEwQixDQUFDLENBQUMsSUFBSSxDQUFPLEtBQVEsQ0FBUixRQUFRLENBQUMsR0FBRyxFQUF2QixJQUFJLENBQTJCLElBQUUsQ0FDbEUsQ0FBQyxJQUFJLENBQU8sS0FBUSxDQUFSLFFBQVEsQ0FBQyxHQUFHLEVBQXZCLElBQUksQ0FBMEIsRUFBRyxJQUFFLENBQ25DLENBQUFHLE1BQU0sR0FBTiw4QkFDaUM1QixrQkFBa0IsQ0FBQzRCLE1BQU0sQ0FBQywyQkFDN0IsR0FGOUIsMkJBRTZCLENBQ2hDLEVBTkMsSUFBSSxDQU1FO0lBQUFMLENBQUEsTUFBQUUsRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQUYsQ0FBQTtFQUFBO0VBQUEsT0FOUEUsRUFNTztBQUFBIiwiaWdub3JlTGlzdCI6W119