// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle';
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js';
// 引入 isVoiceModeEnabled，将 ../../voice/voiceModeEnabled.js 中已经封装好的能力接到本文件流程里。
import { isVoiceModeEnabled } from '../../voice/voiceModeEnabled.js';
// 引入 AnimatedAsterisk，将 ./AnimatedAsterisk.js 中已经封装好的能力接到本文件流程里。
import { AnimatedAsterisk } from './AnimatedAsterisk.js';
// 引入 shouldShowOpus1mMergeNotice，将 ./Opus1mMergeNotice.js 中已经封装好的能力接到本文件流程里。
import { shouldShowOpus1mMergeNotice } from './Opus1mMergeNotice.js';
// MAX_SHOW_COUNT 数量 命名 `3`，让后续代码直接表达这个值的用途。
const MAX_SHOW_COUNT = 3;
// VoiceModeNotice 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function VoiceModeNotice() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(1);
  // t0 暂存 `feature("VOICE_MODE") ? <VoiceModeNoticeInner /> : null` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t0 暂存 `feature("VOICE_MODE") ? <VoiceModeNoticeInner /> : null` 生成的渲染片段，后续返回路径直接复用。
    t0 = feature("VOICE_MODE") ? <VoiceModeNoticeInner /> : null;
    // $[0] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t0;
  } else {
    // t0 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[0];
  }
  // 返回 `t0`，作为终端渲染这次计算的结果。
  return t0;
}
// VoiceModeNoticeInner 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function VoiceModeNoticeInner() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // show 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [show] = useState(_temp);
  // t0 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t0;
  // t1 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t1;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== show) {
    // t0 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t0 = () => {
      // show缺失时直接走兜底路径，避免终端渲染使用无效输入。
      if (!show) {
        // 终端 UI 组件 Voice Mode Notice在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // newCount 数量读取`getGlobalConfig`，供终端渲染后续处理使用。
      const newCount = (getGlobalConfig().voiceNoticeSeenCount ?? 0) + 1;
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(prev => {
        // 满足 `(prev.voiceNoticeSeenCount ?? 0) >= newCount` 时，终端渲染执行该分支。
        if ((prev.voiceNoticeSeenCount ?? 0) >= newCount) {
          // 返回 `prev`，作为终端渲染这次计算的结果。
          return prev;
        }
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...prev,
          voiceNoticeSeenCount: newCount
        };
      });
    };
    // t1 暂存 `[show]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [show];
    // $[0] 缓存 `show`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = show;
    // $[1] 缓存 `t0`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t0;
    // $[2] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t1;
  } else {
    // t0 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t0 = $[1];
    // t1 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[2];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(t0, t1);
  // show缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!show) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // t2 暂存 `<Box paddingLeft={2}><AnimatedAsterisk /><Text dimColor={...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box paddingLeft={2}><AnimatedAsterisk /><Text dimColor={...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box paddingLeft={2}><AnimatedAsterisk /><Text dimColor={true}> Voice mode is now available · /voice to enable</Text></Box>;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // 返回 `isVoiceModeEnabled() && getInitialSettings().voiceEnabled !== true && (...`，作为终端渲染这次计算的结果。
  return isVoiceModeEnabled() && getInitialSettings().voiceEnabled !== true && (getGlobalConfig().voiceNoticeSeenCount ?? 0) < MAX_SHOW_COUNT && !shouldShowOpus1mMergeNotice();
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJmZWF0dXJlIiwiUmVhY3QiLCJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsIkJveCIsIlRleHQiLCJnZXRHbG9iYWxDb25maWciLCJzYXZlR2xvYmFsQ29uZmlnIiwiZ2V0SW5pdGlhbFNldHRpbmdzIiwiaXNWb2ljZU1vZGVFbmFibGVkIiwiQW5pbWF0ZWRBc3RlcmlzayIsInNob3VsZFNob3dPcHVzMW1NZXJnZU5vdGljZSIsIk1BWF9TSE9XX0NPVU5UIiwiVm9pY2VNb2RlTm90aWNlIiwiJCIsIl9jIiwidDAiLCJTeW1ib2wiLCJmb3IiLCJWb2ljZU1vZGVOb3RpY2VJbm5lciIsInNob3ciLCJfdGVtcCIsInQxIiwibmV3Q291bnQiLCJ2b2ljZU5vdGljZVNlZW5Db3VudCIsInByZXYiLCJ0MiIsInZvaWNlRW5hYmxlZCJdLCJzb3VyY2VzIjpbIlZvaWNlTW9kZU5vdGljZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmVhdHVyZSB9IGZyb20gJ2J1bjpidW5kbGUnXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGdldEdsb2JhbENvbmZpZywgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGdldEluaXRpYWxTZXR0aW5ncyB9IGZyb20gJy4uLy4uL3V0aWxzL3NldHRpbmdzL3NldHRpbmdzLmpzJ1xuaW1wb3J0IHsgaXNWb2ljZU1vZGVFbmFibGVkIH0gZnJvbSAnLi4vLi4vdm9pY2Uvdm9pY2VNb2RlRW5hYmxlZC5qcydcbmltcG9ydCB7IEFuaW1hdGVkQXN0ZXJpc2sgfSBmcm9tICcuL0FuaW1hdGVkQXN0ZXJpc2suanMnXG5pbXBvcnQgeyBzaG91bGRTaG93T3B1czFtTWVyZ2VOb3RpY2UgfSBmcm9tICcuL09wdXMxbU1lcmdlTm90aWNlLmpzJ1xuXG5jb25zdCBNQVhfU0hPV19DT1VOVCA9IDNcblxuZXhwb3J0IGZ1bmN0aW9uIFZvaWNlTW9kZU5vdGljZSgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICAvLyBQb3NpdGl2ZSB0ZXJuYXJ5IHBhdHRlcm4g4oCUIHNlZSBkb2NzL2ZlYXR1cmUtZ2F0aW5nLm1kLlxuICAvLyBBbGwgc3RyaW5ncyBtdXN0IGJlIGluc2lkZSB0aGUgZ3VhcmRlZCBicmFuY2ggZm9yIGRlYWQtY29kZSBlbGltaW5hdGlvbi5cbiAgcmV0dXJuIGZlYXR1cmUoJ1ZPSUNFX01PREUnKSA/IDxWb2ljZU1vZGVOb3RpY2VJbm5lciAvPiA6IG51bGxcbn1cblxuZnVuY3Rpb24gVm9pY2VNb2RlTm90aWNlSW5uZXIoKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgLy8gQ2FwdHVyZSBlbGlnaWJpbGl0eSBvbmNlIGF0IG1vdW50IOKAlCBubyByZWFjdGl2ZSBzdWJzY3JpcHRpb25zLiBUaGlzIHNpdHNcbiAgLy8gYXQgdGhlIHRvcCBvZiB0aGUgbWVzc2FnZSBsaXN0IGFuZCBlbnRlcnMgc2Nyb2xsYmFjayBxdWlja2x5OyBhbnlcbiAgLy8gcmUtcmVuZGVyIGFmdGVyIGl0J3MgaW4gc2Nyb2xsYmFjayB3b3VsZCBmb3JjZSBhIGZ1bGwgdGVybWluYWwgcmVzZXQuXG4gIC8vIElmIHRoZSB1c2VyIHJ1bnMgL3ZvaWNlIHRoaXMgc2Vzc2lvbiwgdGhlIG5vdGljZSBzdGF5cyB2aXNpYmxlOyBpdCB3b24ndFxuICAvLyBzaG93IG5leHQgc2Vzc2lvbiBzaW5jZSB2b2ljZUVuYWJsZWQgd2lsbCBiZSB0cnVlIG9uIGRpc2suXG4gIGNvbnN0IFtzaG93XSA9IHVzZVN0YXRlKFxuICAgICgpID0+XG4gICAgICBpc1ZvaWNlTW9kZUVuYWJsZWQoKSAmJlxuICAgICAgZ2V0SW5pdGlhbFNldHRpbmdzKCkudm9pY2VFbmFibGVkICE9PSB0cnVlICYmXG4gICAgICAoZ2V0R2xvYmFsQ29uZmlnKCkudm9pY2VOb3RpY2VTZWVuQ291bnQgPz8gMCkgPCBNQVhfU0hPV19DT1VOVCAmJlxuICAgICAgIXNob3VsZFNob3dPcHVzMW1NZXJnZU5vdGljZSgpLFxuICApXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXNob3cpIHJldHVyblxuICAgIC8vIENhcHR1cmUgb3V0c2lkZSB0aGUgdXBkYXRlciBzbyBTdHJpY3RNb2RlJ3Mgc2Vjb25kIGludm9jYXRpb24gaXMgYSBuby1vcC5cbiAgICBjb25zdCBuZXdDb3VudCA9IChnZXRHbG9iYWxDb25maWcoKS52b2ljZU5vdGljZVNlZW5Db3VudCA/PyAwKSArIDFcbiAgICBzYXZlR2xvYmFsQ29uZmlnKHByZXYgPT4ge1xuICAgICAgaWYgKChwcmV2LnZvaWNlTm90aWNlU2VlbkNvdW50ID8/IDApID49IG5ld0NvdW50KSByZXR1cm4gcHJldlxuICAgICAgcmV0dXJuIHsgLi4ucHJldiwgdm9pY2VOb3RpY2VTZWVuQ291bnQ6IG5ld0NvdW50IH1cbiAgICB9KVxuICB9LCBbc2hvd10pXG5cbiAgaWYgKCFzaG93KSByZXR1cm4gbnVsbFxuXG4gIHJldHVybiAoXG4gICAgPEJveCBwYWRkaW5nTGVmdD17Mn0+XG4gICAgICA8QW5pbWF0ZWRBc3RlcmlzayAvPlxuICAgICAgPFRleHQgZGltQ29sb3I+IFZvaWNlIG1vZGUgaXMgbm93IGF2YWlsYWJsZSDCtyAvdm9pY2UgdG8gZW5hYmxlPC9UZXh0PlxuICAgIDwvQm94PlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxTQUFTQSxPQUFPLFFBQVEsWUFBWTtBQUNwQyxPQUFPLEtBQUtDLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDM0MsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLHVCQUF1QjtBQUN6RSxTQUFTQyxrQkFBa0IsUUFBUSxrQ0FBa0M7QUFDckUsU0FBU0Ms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