// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useState，将 react 中已经封装好的能力接到本文件流程里。
import { useState } from 'react';
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts';
// 引入 Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../ink.js';
// 复用 AutoUpdaterResult、getLatestVersionFromGcs、getMaxVersion、shouldSkipVersion 工具函数，把通用处理留在 ../utils/autoUpdater.js 中维护。
import { type AutoUpdaterResult, getLatestVersionFromGcs, getMaxVersion, shouldSkipVersion } from '../utils/autoUpdater.js';
// 复用 isAutoUpdaterDisabled 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { isAutoUpdaterDisabled } from '../utils/config.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js';
// 复用 getPackageManager、PackageManager 工具函数，把通用处理留在 ../utils/nativeInstaller/packageManagers.js 中维护。
import { getPackageManager, type PackageManager } from '../utils/nativeInstaller/packageManagers.js';
// 复用 gt、gte 工具函数，把通用处理留在 ../utils/semver.js 中维护。
import { gt, gte } from '../utils/semver.js';
// 复用 getInitialSettings 工具函数，把通用处理留在 ../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../utils/settings/settings.js';
// Props 固化终端渲染里传递的数据形状，帮助调用方按同一结构读写字段。
type Props = {
  isUpdating: boolean;
  // 这个回调绑定到 onChangeIsUpdating: (isUpdating: boolean) => void;，负责终端渲染在该局部场景下的响应。
  onChangeIsUpdating: (isUpdating: boolean) => void;
  // 这个回调绑定到 onAutoUpdaterResult: (autoUpdaterResult: AutoUpdaterResult) => void;，负责终端渲染在该局部场景下的响应。
  onAutoUpdaterResult: (autoUpdaterResult: AutoUpdaterResult) => void;
  autoUpdaterResult: AutoUpdaterResult | null;
  showSuccessMessage: boolean;
  verbose: boolean;
};
// PackageManagerAutoUpdater 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function PackageManagerAutoUpdater(t0) {
  // $保存`_c`，供终端渲染后续处理使用。
  const $ = _c(10);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    verbose
  } = t0;
  // updateAvailable 由 React state 持有，setUpdateAvailable 会在用户操作或异步结果返回时触发刷新。
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // packageManager 由 React state 持有，setPackageManager 会在用户操作或异步结果返回时触发刷新。
  const [packageManager, setPackageManager] = useState("unknown");
  // t1 暂存 `async () => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    // t1 暂存 `async () => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = async () => {
      // 终端 UI 组件 Package Manager Auto Updat...在这里处理 `false || false`，完成这一小步状态转换。
      false || false;
      // 满足 `isAutoUpdaterDisabled()` 时，终端渲染执行该分支。
      if (isAutoUpdaterDisabled()) {
        // 终端 UI 组件 Package Manager Auto Updat...在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // 并行获取 channel、pm，缩短终端 UI 组件 Package Manager Auto Updat...等待多个独立异步任务的时间。
      const [channel, pm] = await Promise.all([Promise.resolve(getInitialSettings()?.autoUpdatesChannel ?? "latest"), getPackageManager()]);
      // setPackageManager 写入新的状态值，使终端渲染后续读取保持一致。
      setPackageManager(pm);
      // latest读取`getLatestVersionFromGcs`，供终端渲染后续处理使用。
      let latest = await getLatestVersionFromGcs(channel);
      // maxVersion读取`getMaxVersion`，供终端渲染后续处理使用。
      const maxVersion = await getMaxVersion();
      // 只有 `maxVersion && latest && gt(latest, maxVersion)` 满足时，终端渲染才执行该分支。
      if (maxVersion && latest && gt(latest, maxVersion)) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`PackageManagerAutoUpdater: maxVersion ${maxVersion} is set, capping update from ${latest} to ${maxVersion}`);
        // 满足 `gte(MACRO.VERSION, maxVersion)` 时，终端渲染执行该分支。
        if (gte(MACRO.VERSION, maxVersion)) {
          // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
          logForDebugging(`PackageManagerAutoUpdater: current version ${MACRO.VERSION} is already at or above maxVersion ${maxVersion}, skipping update`);
          // setUpdateAvailable 写入新的状态值，使终端渲染后续读取保持一致。
          setUpdateAvailable(false);
          // 终端 UI 组件 Package Manager Auto Updat...在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // latest更新为 `maxVersion`，确保终端 UI后续读取最新状态。
        latest = maxVersion;
      }
      // hasUpdate记录 `gte` 是否成立，终端渲染随后按该结果分支。
      const hasUpdate = latest && !gte(MACRO.VERSION, latest) && !shouldSkipVersion(latest);
      // setUpdateAvailable 写入新的状态值，使终端渲染后续读取保持一致。
      setUpdateAvailable(!!hasUpdate);
      // 满足 `hasUpdate` 时，终端渲染执行该分支。
      if (hasUpdate) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`PackageManagerAutoUpdater: Update available ${MACRO.VERSION} -> ${latest}`);
      }
    };
    // $[0] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = t1;
  } else {
    // t1 从 React 编译缓存槽 $[0] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[0];
  }
  // checkForUpdates 集合 命名 `t1`，让后续代码直接表达这个值的用途。
  const checkForUpdates = t1;
  // t2 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t2;
  // t3 暂存 `[checkForUpdates]` 的派生结果，便于缓存命中时直接复用。
  let t3;
  // React 编译缓存还未初始化时创建新值，之后相同依赖会复用缓存。
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    // t2 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t2 = () => {
      // 调用 checkForUpdates，触发终端渲染此处需要的副作用。
      checkForUpdates();
    };
    // t3 暂存 `[checkForUpdates]` 生成的渲染片段，后续返回路径直接复用。
    t3 = [checkForUpdates];
    // $[1] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = t2;
    // $[2] 缓存 `t3`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = t3;
  } else {
    // t2 从 React 编译缓存槽 $[1] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[1];
    // t3 从 React 编译缓存槽 $[2] 取回渲染片段，避免依赖未变时重建 JSX。
    t3 = $[2];
  }
  // 调用 React.useEffect，触发终端渲染此处需要的副作用。
  React.useEffect(t2, t3);
  // 调用 useInterval，触发终端渲染此处需要的副作用。
  useInterval(checkForUpdates, 1800000);
  // updateAvailable缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!updateAvailable) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // updateCommand 命令数据标记终端 UI Package Manager Auto...是否启用对应路径。
  const updateCommand = packageManager === "homebrew" ? "brew upgrade claude-code" : packageManager === "winget" ? "winget upgrade Anthropic.ClaudeCode" : packageManager === "apk" ? "apk upgrade claude-code" : "your package manager update command";
  // t4 暂存 `verbose && <Text dimColor={true} wrap="truncate">currentV...` 的派生结果，便于缓存命中时直接复用。
  let t4;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[3] !== verbose) {
    // t4 暂存 `verbose && <Text dimColor={true} wrap="truncate">currentV...` 生成的渲染片段，后续返回路径直接复用。
    t4 = verbose && <Text dimColor={true} wrap="truncate">currentVersion: {MACRO.VERSION}</Text>;
    // $[3] 缓存 `verbose`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = verbose;
    // $[4] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = t4;
  } else {
    // t4 从 React 编译缓存槽 $[4] 取回渲染片段，避免依赖未变时重建 JSX。
    t4 = $[4];
  }
  // t5 暂存 `<Text color="warning" wrap="truncate">Update available! R...` 的派生结果，便于缓存命中时直接复用。
  let t5;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[5] !== updateCommand) {
    // t5 暂存 `<Text color="warning" wrap="truncate">Update available! R...` 生成的渲染片段，后续返回路径直接复用。
    t5 = <Text color="warning" wrap="truncate">Update available! Run: <Text bold={true}>{updateCommand}</Text></Text>;
    // $[5] 缓存 `updateCommand`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = updateCommand;
    // $[6] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t5;
  } else {
    // t5 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t5 = $[6];
  }
  // t6 暂存 `<>{t4}{t5}</>` 的派生结果，便于缓存命中时直接复用。
  let t6;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[7] !== t4 || $[8] !== t5) {
    // t6 暂存 `<>{t4}{t5}</>` 生成的渲染片段，后续返回路径直接复用。
    t6 = <>{t4}{t5}</>;
    // $[7] 缓存 `t4`，下次依赖未变时 React 编译产物可直接复用。
    $[7] = t4;
    // $[8] 缓存 `t5`，下次依赖未变时 React 编译产物可直接复用。
    $[8] = t5;
    // $[9] 缓存 `t6`，下次依赖未变时 React 编译产物可直接复用。
    $[9] = t6;
  } else {
    // t6 从 React 编译缓存槽 $[9] 取回渲染片段，避免依赖未变时重建 JSX。
    t6 = $[9];
  }
  // 返回 `t6`，作为终端渲染这次计算的结果。
  return t6;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlSW50ZXJ2YWwiLCJUZXh0IiwiQXV0b1VwZGF0ZXJSZXN1bHQiLCJnZXRMYXRlc3RWZXJzaW9uRnJvbUdjcyIsImdldE1heFZlcnNpb24iLCJzaG91bGRTa2lwVmVyc2lvbiIsImlzQXV0b1VwZGF0ZXJEaXNhYmxlZCIsImxvZ0ZvckRlYnVnZ2luZyIsImdldFBhY2thZ2VNYW5hZ2VyIiwiUGFja2FnZU1hbmFnZXIiLCJndCIsImd0ZSIsImdldEluaXRpYWxTZXR0aW5ncyIsIlByb3BzIiwiaXNVcGRhdGluZyIsIm9uQ2hhbmdlSXNVcGRhdGluZyIsIm9uQXV0b1VwZGF0ZXJSZXN1bHQiLCJhdXRvVXBkYXRlclJlc3VsdCIsInNob3dTdWNjZXNzTWVzc2FnZSIsInZlcmJvc2UiLCJQYWNrYWdlTWFuYWdlckF1dG9VcGRhdGVyIiwidDAiLCIkIiwiX2MiLCJ1cGRhdGVBdmFpbGFibGUiLCJzZXRVcGRhdGVBdmFpbGFibGUiLCJwYWNrYWdlTWFuYWdlciIsInNldFBhY2thZ2VNYW5hZ2VyIiwidDEiLCJTeW1ib2wiLCJmb3IiLCJjaGFubmVsIiwicG0iLCJQcm9taXNlIiwiYWxsIiwicmVzb2x2ZSIsImF1dG9VcGRhdGVzQ2hhbm5lbCIsImxhdGVzdCIsIm1heFZlcnNpb24iLCJNQUNSTyIsIlZFUlNJT04iLCJoYXNVcGRhdGUiLCJjaGVja0ZvclVwZGF0ZXMiLCJ0MiIsInQzIiwidXNlRWZmZWN0IiwidXBkYXRlQ29tbWFuZCIsInQ0IiwidDUiLCJ0NiJdLCJzb3VyY2VzIjpbIlBhY2thZ2VNYW5hZ2VyQXV0b1VwZGF0ZXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUludGVydmFsIH0gZnJvbSAndXNlaG9va3MtdHMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vaW5rLmpzJ1xuaW1wb3J0IHtcbiAgdHlwZSBBdXRvVXBkYXRlclJlc3VsdCxcbiAgZ2V0TGF0ZXN0VmVyc2lvbkZyb21HY3MsXG4gIGdldE1heFZlcnNpb24sXG4gIHNob3VsZFNraXBWZXJzaW9uLFxufSBmcm9tICcuLi91dGlscy9hdXRvVXBkYXRlci5qcydcbmltcG9ydCB7IGlzQXV0b1VwZGF0ZXJEaXNhYmxlZCB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHtcbiAgZ2V0UGFja2FnZU1hbmFnZXIsXG4gIHR5cGUgUGFja2FnZU1hbmFnZXIsXG59IGZyb20gJy4uL3V0aWxzL25hdGl2ZUluc3RhbGxlci9wYWNrYWdlTWFuYWdlcnMuanMnXG5pbXBvcnQgeyBndCwgZ3RlIH0gZnJvbSAnLi4vdXRpbHMvc2VtdmVyLmpzJ1xuaW1wb3J0IHsgZ2V0SW5pdGlhbFNldHRpbmdzIH0gZnJvbSAnLi4vdXRpbHMvc2V0dGluZ3Mvc2V0dGluZ3MuanMnXG5cbnR5cGUgUHJvcHMgPSB7XG4gIGlzVXBkYXRpbmc6IGJvb2xlYW5cbiAgb25DaGFuZ2VJc1VwZGF0aW5nOiAoaXNVcGRhdGluZzogYm9vbGVhbikgPT4gdm9pZFxuICBvbkF1dG9VcGRhdGVyUmVzdWx0OiAoYXV0b1VwZGF0ZXJSZXN1bHQ6IEF1dG9VcGRhdGVyUmVzdWx0KSA9PiB2b2lkXG4gIGF1dG9VcGRhdGVyUmVzdWx0OiBBdXRvVXBkYXRlclJlc3VsdCB8IG51bGxcbiAgc2hvd1N1Y2Nlc3NNZXNzYWdlOiBib29sZWFuXG4gIHZlcmJvc2U6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFBhY2thZ2VNYW5hZ2VyQXV0b1VwZGF0ZXIoeyB2ZXJib3NlIH06IFByb3BzKTogUmVhY3QuUmVhY3ROb2RlIHtcbiAgY29uc3QgW3VwZGF0ZUF2YWlsYWJsZSwgc2V0VXBkYXRlQXZhaWxhYmxlXSA9IHVzZVN0YXRlKGZhbHNlKVxuICBjb25zdCBbcGFja2FnZU1hbmFnZXIsIHNldFBhY2thZ2VNYW5hZ2VyXSA9XG4gICAgdXNlU3RhdGU8UGFja2FnZU1hbmFnZXI+KCd1bmtub3duJylcblxuICBjb25zdCBjaGVja0ZvclVwZGF0ZXMgPSBSZWFjdC51c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG4gICAgaWYgKFxuICAgICAgXCJwcm9kdWN0aW9uXCIgPT09ICd0ZXN0JyB8fFxuICAgICAgXCJwcm9kdWN0aW9uXCIgPT09ICdkZXZlbG9wbWVudCdcbiAgICApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChpc0F1dG9VcGRhdGVyRGlzYWJsZWQoKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgW2NoYW5uZWwsIHBtXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIFByb21pc2UucmVzb2x2ZShnZXRJbml0aWFsU2V0dGluZ3MoKT8uYXV0b1VwZGF0ZXNDaGFubmVsID8/ICdsYXRlc3QnKSxcbiAgICAgIGdldFBhY2thZ2VNYW5hZ2VyKCksXG4gICAgXSlcbiAgICBzZXRQYWNrYWdlTWFuYWdlcihwbSlcblxuICAgIGxldCBsYXRlc3QgPSBhd2FpdCBnZXRMYXRlc3RWZXJzaW9uRnJvbUdjcyhjaGFubmVsKVxuXG4gICAgLy8gQ2hlY2sgaWYgbWF4IHZlcnNpb24gaXMgc2V0IChzZXJ2ZXItc2lkZSBraWxsIHN3aXRjaCBmb3IgYXV0by11cGRhdGVzKVxuICAgIGNvbnN0IG1heFZlcnNpb24gPSBhd2FpdCBnZXRNYXhWZXJzaW9uKClcblxuICAgIGlmIChtYXhWZXJzaW9uICYmIGxhdGVzdCAmJiBndChsYXRlc3QsIG1heFZlcnNpb24pKSB7XG4gICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgIGBQYWNrYWdlTWFuYWdlckF1dG9VcGRhdGVyOiBtYXhWZXJzaW9uICR7bWF4VmVyc2lvbn0gaXMgc2V0LCBjYXBwaW5nIHVwZGF0ZSBmcm9tICR7bGF0ZXN0fSB0byAke21heFZlcnNpb259YCxcbiAgICAgIClcbiAgICAgIGlmIChndGUoTUFDUk8uVkVSU0lPTiwgbWF4VmVyc2lvbikpIHtcbiAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgIGBQYWNrYWdlTWFuYWdlckF1dG9VcGRhdGVyOiBjdXJyZW50IHZlcnNpb24gJHtNQUNSTy5WRVJTSU9OfSBpcyBhbHJlYWR5IGF0IG9yIGFib3ZlIG1heFZlcnNpb24gJHttYXhWZXJzaW9ufSwgc2tpcHBpbmcgdXBkYXRlYCxcbiAgICAgICAgKVxuICAgICAgICBzZXRVcGRhdGVBdmFpbGFibGUoZmFsc2UpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgbGF0ZXN0ID0gbWF4VmVyc2lvblxuICAgIH1cblxuICAgIGNvbnN0IGhhc1VwZGF0ZSA9XG4gICAgICBsYXRlc3QgJiYgIWd0ZShNQUNSTy5WRVJTSU9OLCBsYXRlc3QpICYmICFzaG91bGRTa2lwVmVyc2lvbihsYXRlc3QpXG5cbiAgICBzZXRVcGRhdGVBdmFpbGFibGUoISFoYXNVcGRhdGUpXG5cbiAgICBpZiAoaGFzVXBkYXRlKSB7XG4gICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgIGBQYWNrYWdlTWFuYWdlckF1dG9VcGRhdGVyOiBVcGRhdGUgYXZhaWxhYmxlICR7TUFDUk8uVkVSU0lPTn0gLT4gJHtsYXRlc3R9YCxcbiAgICAgIClcbiAgICB9XG4gIH0sIFtdKVxuXG4gIC8vIEluaXRpYWwgY2hlY2tcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICB2b2lkIGNoZWNrRm9yVXBkYXRlcygpXG4gIH0sIFtjaGVja0ZvclVwZGF0ZXNdKVxuXG4gIC8vIENoZWNrIGV2ZXJ5IDMwIG1pbnV0ZXNcbiAgdXNlSW50ZXJ2YWwoY2hlY2tGb3JVcGRhdGVzLCAzMCAqIDYwICogMTAwMClcblxuICBpZiAoIXVwZGF0ZUF2YWlsYWJsZSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvLyBwYWNtYW4sIGRlYiwgYW5kIHJwbSBkb24ndCBnZXQgc3BlY2lmaWMgY29tbWFuZHMgYmVjYXVzZSB0aGV5IGVhY2ggaGF2ZVxuICAvLyBtdWx0aXBsZSBmcm9udGVuZHMgKHBhY21hbjogeWF5L3BhcnUvbWFrZXBrZywgZGViOiBhcHQvYXB0LWdldC9hcHRpdHVkZS9uYWxhLFxuICAvLyBycG06IGRuZi95dW0venlwcGVyKVxuICBjb25zdCB1cGRhdGVDb21tYW5kID1cbiAgICBwYWNrYWdlTWFuYWdlciA9PT0gJ2hvbWVicmV3J1xuICAgICAgPyAnYnJldyB1cGdyYWRlIGNsYXVkZS1jb2RlJ1xuICAgICAgOiBwYWNrYWdlTWFuYWdlciA9PT0gJ3dpbmdldCdcbiAgICAgICAgPyAnd2luZ2V0IHVwZ3JhZGUgQW50aHJvcGljLkNsYXVkZUNvZGUnXG4gICAgICAgIDogcGFja2FnZU1hbmFnZXIgPT09ICdhcGsnXG4gICAgICAgICAgPyAnYXBrIHVwZ3JhZGUgY2xhdWRlLWNvZGUnXG4gICAgICAgICAgOiAneW91ciBwYWNrYWdlIG1hbmFnZXIgdXBkYXRlIGNvbW1hbmQnXG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAge3ZlcmJvc2UgJiYgKFxuICAgICAgICA8VGV4dCBkaW1Db2xvciB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAgICBjdXJyZW50VmVyc2lvbjoge01BQ1JPLlZFUlNJT059XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgICA8VGV4dCBjb2xvcj1cIndhcm5pbmdcIiB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAgVXBkYXRlIGF2YWlsYWJsZSEgUnVuOiA8VGV4dCBib2xkPnt1cGRhdGVDb21tYW5kfTwvVGV4dD5cbiAgICAgIDwvVGV4dD5cbiAgICA8Lz5cbiAgKVxufVxuIl0sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxRQUFRLFFBQVEsT0FBTztBQUNoQyxTQUFTQyxXQUFXLFFBQVEsYUFBYTtBQUN6QyxTQUFTQyxJQUFJLFFBQVEsV0FBVztBQUNoQyxTQUNFLEtBQUtDLGlC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