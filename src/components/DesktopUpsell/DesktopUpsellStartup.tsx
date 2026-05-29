// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useState } from 'react';
// 引入 Box、Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../../ink.js';
// 接入 getDynamicConfig_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getDynamicConfig_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js';
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../../services/analytics/index.js 处理。
import { logEvent } from '../../services/analytics/index.js';
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
// 引入 Select，将 ../CustomSelect/select.js 中已经封装好的能力接到本文件流程里。
import { Select } from '../CustomSelect/select.js';
// 引入 DesktopHandoff，将 ../DesktopHandoff.js 中已经封装好的能力接到本文件流程里。
import { DesktopHandoff } from '../DesktopHandoff.js';
// 引入 PermissionDialog，将 ../permissions/PermissionDialog.js 中已经封装好的能力接到本文件流程里。
import { PermissionDialog } from '../permissions/PermissionDialog.js';
// DesktopUpsellConfig 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DesktopUpsellConfig = {
  enable_shortcut_tip: boolean;
  enable_startup_dialog: boolean;
};
// DESKTOP_UPSELL_DEFAULT 集中保存终端 UI 组件 Desktop Upsell Startup要一起传递的字段。
const DESKTOP_UPSELL_DEFAULT: DesktopUpsellConfig = {
  enable_shortcut_tip: false,
  enable_startup_dialog: false
};
// getDesktopUpsellConfig 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDesktopUpsellConfig(): DesktopUpsellConfig {
  // 返回 `getDynamicConfig_CACHED_MAY_BE_STALE('tengu_desktop_upsell', DESKTOP_UP...`，作为终端渲染这次计算的结果。
  return getDynamicConfig_CACHED_MAY_BE_STALE('tengu_desktop_upsell', DESKTOP_UPSELL_DEFAULT);
}
// isSupportedPlatform 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSupportedPlatform(): boolean {
  // 返回 `process.platform === 'darwin' || process.platform === 'win32' && proces...`，作为终端渲染这次计算的结果。
  return process.platform === 'darwin' || process.platform === 'win32' && process.arch === 'x64';
}
// shouldShowDesktopUpsellStartup 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldShowDesktopUpsellStartup(): boolean {
  // 满足 `!isSupportedPlatform()` 时，终端渲染执行该分支。
  if (!isSupportedPlatform()) return false;
  // 满足 `!getDesktopUpsellConfig().enable_startup_dialog` 时，终端渲染执行该分支。
  if (!getDesktopUpsellConfig().enable_startup_dialog) return false;
  // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
  const config = getGlobalConfig();
  // 满足 `config.desktopUpsellDismissed` 时，终端渲染执行该分支。
  if (config.desktopUpsellDismissed) return false;
  // 满足 `(config.desktopUpsellSeenCount ?? 0) >= 3` 时，终端渲染执行该分支。
  if ((config.desktopUpsellSeenCount ?? 0) >= 3) return false;
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true;
}
// DesktopUpsellSelection 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type DesktopUpsellSelection = 'try' | 'not-now' | 'never';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  // 这个回调绑定到 onDone: () => void;，负责终端渲染在该局部场景下的响应。
  onDone: () => void;
};
// DesktopUpsellStartup 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function DesktopUpsellStartup(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(14);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    onDone
  } = t0;
  // showHandoff 由 React state 持有，setShowHandoff 会在用户操作或异步结果返回时触发刷新。
  const [showHandoff, setShowHandoff] = useState(false);
  // t1 暂存 `[]` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `[]` 生成的渲染片段，后续返回路径直接复用。
    t1 = [];
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(_temp, t1);
  // 满足 `showHandoff` 时，终端渲染执行该分支。
  if (showHandoff) {
    // t2 暂存 `<DesktopHandoff onDone={() => onDone()} />` 的派生结果，便于缓存命中时直接复用。
    let t2;
    // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
    if ($[1] !== onDone) {
      // t2 暂存 `<DesktopHandoff onDone={() => onDone()} />` 生成的渲染片段，后续返回路径直接复用。
      t2 = <DesktopHandoff onDone={() => onDone()} />;
      // $[1] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
      $[1] = onDone;
      // $[2] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
      $[2] = t2;
    } else {
      // t2 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
      t2 = $[2];
    }
    // 返回 `t2`，作为终端渲染这次计算的结果。
    return t2;
  }
  // t2 暂存 `function handleSelect(value) {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== onDone) {
    // t2 暂存 `function handleSelect(value) {` 生成的渲染片段，后续返回路径直接复用。
    t2 = function handleSelect(value) {
      // 按照 value 的取值选择终端渲染的具体处理分支。
      switch (value) {
        case "try":
          {
            // setShowHandoff 写入新的状态值，使终端渲染后续读取保持一致。
            setShowHandoff(true);
            // 终端 UI 组件 Desktop Upsell Startup在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
        case "never":
          {
            // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
            saveGlobalConfig(_temp2);
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 终端 UI 组件 Desktop Upsell Startup在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
        case "not-now":
          {
            // 调用 onDone，触发终端渲染此处需要的副作用。
            onDone();
            // 终端 UI 组件 Desktop Upsell Startup在这里结束当前路径，避免继续执行不适用的后续分支。
            return;
          }
      }
    };
    // $[3] 缓存 `onDone`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = onDone;
    // $[4] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t2;
  } else {
    // t2 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[4];
  }
  // handleSelect保存`t2`，作为后续临时缓存值处理的输入。
  const handleSelect = t2;
  // t3 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
    // t3 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t3 = {
      label: "Open in Claude Code Desktop",
      value: "try" as const
    };
    // $[5] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t3;
  } else {
    // t3 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[5];
  }
  // t4 暂存 `{` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    // t4 暂存 `{` 生成的渲染片段，后续返回路径直接复用。
    t4 = {
      label: "Not now",
      value: "not-now" as const
    };
    // $[6] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[6];
  }
  // t5 暂存 `[t3, t4, {` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
    // t5 暂存 `[t3, t4, {` 生成的渲染片段，后续返回路径直接复用。
    t5 = [t3, t4, {
      label: "Don't ask again",
      value: "never" as const
    }];
    // $[7] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[7] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[7];
  }
  // 选项沿用 `t5` 的缓存值，保持 React 编译产物在依赖稳定时不重建。
  const options = t5;
  // t6 暂存 `<Box marginBottom={1}><Text>Same Claude Code with visual ...` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
    // t6 暂存 `<Box marginBottom={1}><Text>Same Claude Code with visual ...` 生成的渲染片段，后续返回路径直接复用。
    t6 = <Box marginBottom={1}><Text>Same Claude Code with visual diffs, live app preview, parallel sessions, and more.</Text></Box>;
    // $[8] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[8] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[8];
  }
  // t7 暂存 `() => handleSelect("not-now")` 的派生结果，便于缓存命中时直接复用。
  let t7;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[9] !== handleSelect) {
    // t7 暂存 `() => handleSelect("not-now")` 生成的渲染片段，后续返回路径直接复用。
    t7 = () => handleSelect("not-now");
    // $[9] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = handleSelect;
    // $[10] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[10] = t7;
  } else {
    // t7 从 React 编译缓存槽 $[10] 取回渲染片段，避免依赖未变时重建 JSX。
    t7 = $[10];
  }
  // t8 暂存 `<PermissionDialog title="Try Claude Code Desktop"><Box fl...` 的派生结果，便于缓存命中时直接复用。
  let t8;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[11] !== handleSelect || $[12] !== t7) {
    // t8 暂存 `<PermissionDialog title="Try Claude Code Desktop"><Box fl...` 生成的渲染片段，后续返回路径直接复用。
    t8 = <PermissionDialog title="Try Claude Code Desktop"><Box flexDirection="column" paddingX={2} paddingY={1}>{t6}<Select options={options} onChange={handleSelect} onCancel={t7} /></Box></PermissionDialog>;
    // $[11] 缓存 `handleSelect`，下次依赖未变时 React 编译产物可直接复用。
    $[11] = handleSelect;
    // $[12] 缓存 `t7`，下次依赖未变时 React 编译产物可直接复用。
    $[12] = t7;
    // $[13] 缓存 `t8`，下次依赖未变时 React 编译产物可直接复用。
    $[13] = t8;
  } else {
    // t8 从 React 编译缓存槽 $[13] 取回渲染片段，避免依赖未变时重建 JSX。
    t8 = $[13];
  }
  // 返回 `t8`，作为终端渲染这次计算的结果。
  return t8;
}
// _temp2 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp2(prev_0) {
  // 满足 `prev_0.desktopUpsellDismissed` 时，终端渲染执行该分支。
  if (prev_0.desktopUpsellDismissed) {
    // 返回 `prev_0`，作为终端渲染这次计算的结果。
    return prev_0;
  }
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    ...prev_0,
    desktopUpsellDismissed: true
  };
}
// _temp 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function _temp() {
  // newCount 数量读取`getGlobalConfig`，供终端渲染后续处理使用。
  const newCount = (getGlobalConfig().desktopUpsellSeenCount ?? 0) + 1;
  // 调用 saveGlobalConfig，触发终端渲染此处需要的副作用。
  saveGlobalConfig(prev => {
    // 满足 `(prev.desktopUpsellSeenCount ?? 0) >= newCount` 时，终端渲染执行该分支。
    if ((prev.desktopUpsellSeenCount ?? 0) >= newCount) {
      // 返回 `prev`，作为终端渲染这次计算的结果。
      return prev;
    }
    // 返回结构化结果，集中表达终端渲染已经整理出的状态。
    return {
      ...prev,
      desktopUpsellSeenCount: newCount
    };
  });
  // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
  logEvent("tengu_desktop_upsell_shown", {
    seen_count: newCount
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiQm94IiwiVGV4dCIsImdldER5bmFtaWNDb25maWdfQ0FDSEVEX01BWV9CRV9TVEFMRSIsImxvZ0V2ZW50IiwiZ2V0R2xvYmFsQ29uZmlnIiwic2F2ZUdsb2JhbENvbmZpZyIsIlNlbGVjdCIsIkRlc2t0b3BIYW5kb2ZmIiwiUGVybWlzc2lvbkRpYWxvZyIsIkRlc2t0b3BVcHNlbGxDb25maWciLCJlbmFibGVfc2hvcnRjdXRfdGlwIiwiZW5hYmxlX3N0YXJ0dXBfZGlhbG9nIiwiREVTS1RPUF9VUFNFTExfREVGQVVMVCIsImdldERlc2t0b3BVcHNlbGxDb25maWciLCJpc1N1cHBvcnRlZFBsYXRmb3JtIiwicHJvY2VzcyIsInBsYXRmb3JtIiwiYXJjaCIsInNob3VsZFNob3dEZXNrdG9wVXBzZWxsU3RhcnR1cCIsImNvbmZpZyIsImRlc2t0b3BVcHNlbGxEaXNtaXNzZWQiLCJkZXNrdG9wVXBzZWxsU2VlbkNvdW50IiwiRGVza3RvcFVwc2VsbFNlbGVjdGlvbiIsIlByb3BzIiwib25Eb25lIiwiRGVza3RvcFVwc2VsbFN0YXJ0dXAiLCJ0MCIsIiQiLCJfYyIsInNob3dIYW5kb2ZmIiwic2V0U2hvd0hhbmRvZmYiLCJ0MSIsIlN5bWJvbCIsImZvciIsIl90ZW1wIiwidDIiLCJoYW5kbGVTZWxlY3QiLCJ2YWx1ZSIsIl90ZW1wMiIsInQzIiwibGFiZWwiLCJjb25zdCIsInQ0IiwidDUiLCJvcHRpb25zIiwidDYiLCJ0NyIsInQ4IiwicHJldl8wIiwicHJldiIsIm5ld0NvdW50Iiwic2Vlbl9jb3VudCJdLCJzb3VyY2VzIjpbIkRlc2t0b3BVcHNlbGxTdGFydHVwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IEJveCwgVGV4dCB9IGZyb20gJy4uLy4uL2luay5qcydcbmltcG9ydCB7IGdldER5bmFtaWNDb25maWdfQ0FDSEVEX01BWV9CRV9TVEFMRSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2FuYWx5dGljcy9ncm93dGhib29rLmpzJ1xuaW1wb3J0IHsgbG9nRXZlbnQgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hbmFseXRpY3MvaW5kZXguanMnXG5pbXBvcnQgeyBnZXRHbG9iYWxDb25maWcsIHNhdmVHbG9iYWxDb25maWcgfSBmcm9tICcuLi8uLi91dGlscy9jb25maWcuanMnXG5pbXBvcnQgeyBTZWxlY3QgfSBmcm9tICcuLi9DdXN0b21TZWxlY3Qvc2VsZWN0LmpzJ1xuaW1wb3J0IHsgRGVza3RvcEhhbmRvZmYgfSBmcm9tICcuLi9EZXNrdG9wSGFuZG9mZi5qcydcbmltcG9ydCB7IFBlcm1pc3Npb25EaWFsb2cgfSBmcm9tICcuLi9wZXJtaXNzaW9ucy9QZXJtaXNzaW9uRGlhbG9nLmpzJ1xuXG50eXBlIERlc2t0b3BVcHNlbGxDb25maWcgPSB7XG4gIGVuYWJsZV9zaG9ydGN1dF90aXA6IGJvb2xlYW5cbiAgZW5hYmxlX3N0YXJ0dXBfZGlhbG9nOiBib29sZWFuXG59XG5cbmNvbnN0IERFU0tUT1BfVVBTRUxMX0RFRkFVTFQ6IERlc2t0b3BVcHNlbGxDb25maWcgPSB7XG4gIGVuYWJsZV9zaG9ydGN1dF90aXA6IGZhbHNlLFxuICBlbmFibGVfc3RhcnR1cF9kaWFsb2c6IGZhbHNlLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVza3RvcFVwc2VsbENvbmZpZygpOiBEZXNrdG9wVXBzZWxsQ29uZmlnIHtcbiAgcmV0dXJuIGdldER5bmFtaWNDb25maWdfQ0FDSEVEX01BWV9CRV9TVEFMRShcbiAgICAndGVuZ3VfZGVza3RvcF91cHNlbGwnLFxuICAgIERFU0tUT1BfVVBTRUxMX0RFRkFVTFQsXG4gIClcbn1cblxuZnVuY3Rpb24gaXNTdXBwb3J0ZWRQbGF0Zm9ybSgpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJyB8fFxuICAgIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInICYmIHByb2Nlc3MuYXJjaCA9PT0gJ3g2NCcpXG4gIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZFNob3dEZXNrdG9wVXBzZWxsU3RhcnR1cCgpOiBib29sZWFuIHtcbiAgaWYgKCFpc1N1cHBvcnRlZFBsYXRmb3JtKCkpIHJldHVybiBmYWxzZVxuICBpZiAoIWdldERlc2t0b3BVcHNlbGxDb25maWcoKS5lbmFibGVfc3RhcnR1cF9kaWFsb2cpIHJldHVybiBmYWxzZVxuICBjb25zdCBjb25maWcgPSBnZXRHbG9iYWxDb25maWcoKVxuICBpZiAoY29uZmlnLmRlc2t0b3BVcHNlbGxEaXNtaXNzZWQpIHJldHVybiBmYWxzZVxuICBpZiAoKGNvbmZpZy5kZXNrdG9wVXBzZWxsU2VlbkNvdW50ID8/IDApID49IDMpIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxufVxuXG50eXBlIERlc2t0b3BVcHNlbGxTZWxlY3Rpb24gPSAndHJ5JyB8ICdub3Qtbm93JyB8ICduZXZlcidcblxudHlwZSBQcm9wcyA9IHtcbiAgb25Eb25lOiAoKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBEZXNrdG9wVXBzZWxsU3RhcnR1cCh7IG9uRG9uZSB9OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFtzaG93SGFuZG9mZiwgc2V0U2hvd0hhbmRvZmZdID0gdXNlU3RhdGUoZmFsc2UpXG5cbiAgLy8gSW5jcmVtZW50IHNlZW4gY291bnQgb24gbW91bnQgKGd1YXJkIGluIHVwZGF0ZXIgZm9yIFN0cmljdE1vZGUgc2FmZXR5KVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IG5ld0NvdW50ID0gKGdldEdsb2JhbENvbmZpZygpLmRlc2t0b3BVcHNlbGxTZWVuQ291bnQgPz8gMCkgKyAxXG4gICAgc2F2ZUdsb2JhbENvbmZpZyhwcmV2ID0+IHtcbiAgICAgIGlmICgocHJldi5kZXNrdG9wVXBzZWxsU2VlbkNvdW50ID8/IDApID49IG5ld0NvdW50KSByZXR1cm4gcHJldlxuICAgICAgcmV0dXJuIHsgLi4ucHJldiwgZGVza3RvcFVwc2VsbFNlZW5Db3VudDogbmV3Q291bnQgfVxuICAgIH0pXG4gICAgbG9nRXZlbnQoJ3Rlbmd1X2Rlc2t0b3BfdXBzZWxsX3Nob3duJywgeyBzZWVuX2NvdW50OiBuZXdDb3VudCB9KVxuICB9LCBbXSlcblxuICBpZiAoc2hvd0hhbmRvZmYpIHtcbiAgICByZXR1cm4gPERlc2t0b3BIYW5kb2ZmIG9uRG9uZT17KCkgPT4gb25Eb25lKCl9IC8+XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVTZWxlY3QodmFsdWU6IERlc2t0b3BVcHNlbGxTZWxlY3Rpb24pOiB2b2lkIHtcbiAgICBzd2l0Y2ggKHZhbHVlKSB7XG4gICAgICBjYXNlICd0cnknOlxuICAgICAgICBzZXRTaG93SGFuZG9mZih0cnVlKVxuICAgICAgICByZXR1cm5cbiAgICAgIGNhc2UgJ25ldmVyJzpcbiAgICAgICAgc2F2ZUdsb2JhbENvbmZpZyhwcmV2ID0+IHtcbiAgICAgICAgICBpZiAocHJldi5kZXNrdG9wVXBzZWxsRGlzbWlzc2VkKSByZXR1cm4gcHJldlxuICAgICAgICAgIHJldHVybiB7IC4uLnByZXYsIGRlc2t0b3BVcHNlbGxEaXNtaXNzZWQ6IHRydWUgfVxuICAgICAgICB9KVxuICAgICAgICBvbkRvbmUoKVxuICAgICAgICByZXR1cm5cbiAgICAgIGNhc2UgJ25vdC1ub3cnOlxuICAgICAgICBvbkRvbmUoKVxuICAgICAgICByZXR1cm5cbiAgICB9XG4gIH1cblxuICBjb25zdCBvcHRpb25zID0gW1xuICAgIHsgbGFiZWw6ICdPcGVuIGluIENsYXVkZSBDb2RlIERlc2t0b3AnLCB2YWx1ZTogJ3RyeScgYXMgY29uc3QgfSxcbiAgICB7IGxhYmVsOiAnTm90IG5vdycsIHZhbHVlOiAnbm90LW5vdycgYXMgY29uc3QgfSxcbiAgICB7IGxhYmVsOiBcIkRvbid0IGFzayBhZ2FpblwiLCB2YWx1ZTogJ25ldmVyJyBhcyBjb25zdCB9LFxuICBdXG5cbiAgcmV0dXJuIChcbiAgICA8UGVybWlzc2lvbkRpYWxvZyB0aXRsZT1cIlRyeSBDbGF1ZGUgQ29kZSBEZXNrdG9wXCI+XG4gICAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIiBwYWRkaW5nWD17Mn0gcGFkZGluZ1k9ezF9PlxuICAgICAgICA8Qm94IG1hcmdpbkJvdHRvbT17MX0+XG4gICAgICAgICAgPFRleHQ+XG4gICAgICAgICAgICBTYW1lIENsYXVkZSBDb2RlIHdpdGggdmlzdWFsIGRpZmZzLCBsaXZlIGFwcCBwcmV2aWV3LCBwYXJhbGxlbFxuICAgICAgICAgICAgc2Vzc2lvbnMsIGFuZCBtb3JlLlxuICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgPC9Cb3g+XG4gICAgICAgIDxTZWxlY3RcbiAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVTZWxlY3R9XG4gICAgICAgICAgb25DYW5jZWw9eygpID0+IGhhbmRsZVNlbGVjdCgnbm90LW5vdycpfVxuICAgICAgICAvPlxuICAgICAgPC9Cb3g+XG4gICAgPC9QZXJtaXNzaW9uRGlhbG9nPlxuICApXG59XG4iXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLFNBQVMsRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDM0MsU0FBU0MsR0FBRyxFQUFFQyxJQUFJLFFBQVEsY0FBYztBQUN4QyxTQUFTQyxvQ0FBb0MsUUFBUSx3Q0FBd0M7QUFDN0YsU0FBU0MsUUFBUSxRQUFRLG1DQUFtQztBQUM1RCxTQUFTQyxlQUFlLEVBQUVDLGdCQUFnQixRQUFRLHVCQUF1QjtBQUN6RSxTQUFTQyxNQUFNLFFBQVEsMkJBQTJCO0FBQ2xELFNBQVNDLGNBQWMsUUFBUSxzQkFBc0I7QUFDckQsU0FBU0MsZ0JBQWdCLFFBQVEsb0NBQW9DO0FBRXJFLEtBQUtDLG1CQUFtQixHQUFHO0VBQ3pC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