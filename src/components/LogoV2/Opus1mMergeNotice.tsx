// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 UP_ARROW，将 ../../constants/figures.js 中已经封装好的能力接到本文件流程里。
import { UP_ARROW } from '../../constants/figures.js';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 复用 isOpus1mMergeEnabled 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { isOpus1mMergeEnabled } from '../../utils/model/model.js';
// 引入 AnimatedAsterisk，将 ./AnimatedAsterisk.js 中已经封装好的能力接到本文件流程里。
import { AnimatedAsterisk } from './AnimatedAsterisk.js';
// MAX_SHOW_COUNT 数量保存`6`，供后续判断或组装使用。
const MAX_SHOW_COUNT = 6;
// shouldShowOpus1mMergeNotice 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowOpus1mMergeNotice(): boolean {
  // 返回 `isOpus1mMergeEnabled() && (getGlobalConfig().opus1mMergeNoticeSeenCount...`，作为终端渲染这次计算的结果。
  return isOpus1mMergeEnabled() && (getGlobalConfig().opus1mMergeNoticeSeenCount ?? 0) < MAX_SHOW_COUNT;
}
// Opus1mMergeNotice 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function Opus1mMergeNotice() {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(4);
  // show 由 React state 持有，setter 会在用户操作或异步结果返回时触发刷新。
  const [show] = useState(shouldShowOpus1mMergeNotice);
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
        // 终端 UI 组件 Opus1m Merge Notice在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // newCount 数量读取`getGlobalConfig`，供终端渲染后续处理使用。
      const newCount = (getGlobalConfig().opus1mMergeNoticeSeenCount ?? 0) + 1;
      // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
      saveGlobalConfig(prev => {
        // 满足 `(prev.opus1mMergeNoticeSeenCount ?? 0) >= newCount` 时，终端渲染执行该分支。
        if ((prev.opus1mMergeNoticeSeenCount ?? 0) >= newCount) {
          // 返回 `prev`，作为终端渲染这次计算的结果。
          return prev;
        }
        // 返回结构化结果，集中表达终端渲染已经整理出的状态。
        return {
          ...prev,
          opus1mMergeNoticeSeenCount: newCount
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
  // t2 暂存 `<Box paddingLeft={2}><AnimatedAsterisk char={UP_ARROW} />...` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `<Box paddingLeft={2}><AnimatedAsterisk char={UP_ARROW} />...` 生成的渲染片段，后续返回路径直接复用。
    t2 = <Box paddingLeft={2}><AnimatedAsterisk char={UP_ARROW} /><Text dimColor={true}>{" "}Opus now defaults to 1M context · 5x more room, same pricing</Text></Box>;
    // $[3] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[3] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[3];
  }
  // 返回 `t2`，作为终端渲染这次计算的结果。
  return t2;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiVVBfQVJST1ciLCJCb3giLCJUZXh0IiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsImlzT3B1czFtTWVyZ2VFbmFibGVkIiwiQW5pbWF0ZWRBc3RlcmlzayIsIk1BWF9TSE9XX0NPVU5UIiwic2hvdWxkU2hvd09wdXMxbU1lcmdlTm90aWNlIiwib3B1czFtTWVyZ2VOb3RpY2VTZWVuQ291bnQiLCJPcHVzMW1NZXJnZU5vdGljZSIsIiQiLCJfYyIsInNob3ciLCJ0MCIsInQxIiwibmV3Q291bnQiLCJwcmV2IiwidDIiLCJTeW1ib2wiLCJmb3IiXSwic291cmNlcyI6WyJPcHVzMW1NZXJnZU5vdGljZS50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBVUF9BUlJPVyB9IGZyb20gJy4uLy4uL2NvbnN0YW50cy9maWd1cmVzLmpzJ1xuaW1wb3J0IHsgQm94LCBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgZ2V0R2xvYmFsQ29uZmlnLCBzYXZlR2xvYmFsQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uZmlnLmpzJ1xuaW1wb3J0IHsgaXNPcHVzMW1NZXJnZUVuYWJsZWQgfSBmcm9tICcuLi8uLi91dGlscy9tb2RlbC9tb2RlbC5qcydcbmltcG9ydCB7IEFuaW1hdGVkQXN0ZXJpc2sgfSBmcm9tICcuL0FuaW1hdGVkQXN0ZXJpc2suanMnXG5cbmNvbnN0IE1BWF9TSE9XX0NPVU5UID0gNlxuXG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkU2hvd09wdXMxbU1lcmdlTm90aWNlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGlzT3B1czFtTWVyZ2VFbmFibGVkKCkgJiZcbiAgICAoZ2V0R2xvYmFsQ29uZmlnKCkub3B1czFtTWVyZ2VOb3RpY2VTZWVuQ291bnQgPz8gMCkgPCBNQVhfU0hPV19DT1VOVFxuICApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBPcHVzMW1NZXJnZU5vdGljZSgpOiBSZWFjdC5SZWFjdE5vZGUge1xuICBjb25zdCBbc2hvd10gPSB1c2VTdGF0ZShzaG91bGRTaG93T3B1czFtTWVyZ2VOb3RpY2UpXG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXNob3cpIHJldHVyblxuICAgIGNvbnN0IG5ld0NvdW50ID0gKGdldEdsb2JhbENvbmZpZygpLm9wdXMxbU1lcmdlTm90aWNlU2VlbkNvdW50ID8/IDApICsgMVxuICAgIHNhdmVHbG9iYWxDb25maWcocHJldiA9PiB7XG4gICAgICBpZiAoKHByZXYub3B1czFtTWVyZ2VOb3RpY2VTZWVuQ291bnQgPz8gMCkgPj0gbmV3Q291bnQpIHJldHVybiBwcmV2XG4gICAgICByZXR1cm4geyAuLi5wcmV2LCBvcHVzMW1NZXJnZU5vdGljZVNlZW5Db3VudDogbmV3Q291bnQgfVxuICAgIH0pXG4gIH0sIFtzaG93XSlcblxuICBpZiAoIXNob3cpIHJldHVybiBudWxsXG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IHBhZGRpbmdMZWZ0PXsyfT5cbiAgICAgIDxBbmltYXRlZEFzdGVyaXNrIGNoYXI9e1VQX0FSUk9XfSAvPlxuICAgICAgPFRleHQgZGltQ29sb3I+XG4gICAgICAgIHsnICd9XG4gICAgICAgIE9wdXMgbm93IGRlZmF1bHRzIHRvIDFNIGNvbnRleHQgwrcgNXggbW9yZSByb29tLCBzYW1lIHByaWNpbmdcbiAgICAgIDwvVGV4dD5cbiAgICA8L0JveD5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxTQUFTLEVBQUVDLFFBQVEsUUFBUSxPQUFPO0FBQzNDLFNBQVNDLFFBQVEsUUFBUSw0QkFBNEI7QUFDckQsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLHVCQUF1QjtBQUN6RSxTQUFTQyxvQkFBb0IsUUFBUSw0QkFBNEI7QUFDakUsU0FBU0MsZ0JBQWdCLFFBQVEsdUJBQXVCO0FBRXhELE1BQU1DLGNBQWMsR0FBRyxDQUFDO0FBRXhCLE9BQU8sU0FBU0MsMkJBQTJCQSxDQUFBLENBQUUsRUFBRSxPQUFPLENBQUM7RUFDckQsT0FDRUgsb0JBQW9CLENBQUMsQ0FBQyxJQUN0QixDQUFDRixlQUFlLENBQUMsQ0FBQyxDQUFDTSwwQkFBMEIsSUFBSSxDQUFDLElBQUlGLGNBQWM7QUFFeEU7QUFFQSxPQUFPLFNBQUFHLGtCQUFBO0VBQUEsTUFBQUMsQ0FBQSxHQUFBQyxFQUFBO0VBQ0wsT0FBQUMsSUFBQSxJQUFlZCxRQUFRLENBQUNTLDJCQUEyQixDQUFDO0VBQUEsSUFBQU0sRUFBQTtFQUFBLElBQUFDLEVBQUE7RUFBQSxJQUFBSixDQUFBLFFBQUFFLElBQUE7SUFFMUNDLEVBQUEsR0FBQUEsQ0FBQTtNQUNSLElBQUksQ0FBQ0QsSUFBSTtRQUFBO01BQUE7TUFDVCxNQUFBRyxRQUFBLEdBQWlCLENBQUNiLGVBQWUsQ0FBQyxDQUFDLENBQUFNLDBCQUFnQyxJQUFqRCxDQUFpRCxJQUFJLENBQUM7TUFDeEVMLGdCQUFnQixDQUFDYSxJQUFBO1FBQ2YsSUFBSSxDQUFDQSxJQUFJLENBQUFSLDBCQUFnQyxJQUFwQyxDQUFvQyxLQUFLTyxRQUFRO1VBQUEsT0FBU0MsSUFBSTtRQUFBO1FBQUEsT0FDNUQ7VUFBQSxHQUFLQSxJQUFJO1VBQUFSLDBCQUFBLEVBQThCTztRQUFTLENBQUM7TUFBQSxDQUN6RCxDQUFDO0lBQUEsQ0FDSDtJQUFFRCxFQUFBLElBQUNGLElBQUksQ0FBQztJQUFBRixDQUFBLE1BQUFFLElBQUE7SUFBQUYsQ0FBQSxNQUFBRyxFQUFBO0lBQUFILENBQUEsTUFBQUksRUFBQTtFQUFBO0lBQUFELEVBQUEsR0FBQUgsQ0FBQTtJQUFBSSxFQUFBLEdBQUFKLENBQUE7RUFBQTtFQVBUYixTQUFTLENBQUNnQixFQU9ULEVBQUVDLEVBQU0sQ0FBQztFQUVWLElBQUksQ0FBQ0YsSUFBSTtJQUFBLE9BQVMsSUFBSTtFQUFBO0VBQUEsSUFBQUssRUFBQTtFQUFBLElBQUFQLENBQUEsUUFBQVEsTUFBQSxDQUFBQyxHQUFBO0lBR3BCRixFQUFBLElBQUMsR0FBRyxDQUFjLFdBQUMsQ0FBRCxHQUFDLENBQ2pCLENBQUMsZ0JBQWdCLENBQU9sQixJQUFRLENBQVJBLFNBQU8sQ0FBQyxHQUNoQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQVIsS0FBTyxDQUFDLENBQ1gsSUFBRSxDQUFFLDREQUVQLEVBSEMsSUFBSSxDQUlQLEVBTkMsR0FBRyxDQU1FO0lBQUFXLENBQUEsTUFBQU8sRUFBQTtFQUFBO0lBQUFBLEVBQUEsR0FBQVAsQ0FBQTtFQUFBO0VBQUEsT0FOTk8sRUFNTTtBQUFBIiwiaWdub3JlTGlzdCI6W119