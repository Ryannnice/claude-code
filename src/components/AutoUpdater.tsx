// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 useEffect、useRef、useState，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect, useRef, useState } from 'react';
// 接入 AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS、logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, logEvent } from 'src/services/analytics/index.js';
// 引入 useInterval，将 usehooks-ts 中已经封装好的能力接到本文件流程里。
import { useInterval } from 'usehooks-ts';
// 引入 useUpdateNotification，将 ../hooks/useUpdateNotification.js 中已经封装好的能力接到本文件流程里。
import { useUpdateNotification } from '../hooks/useUpdateNotification.js';
// 引入 Box、Text，将 ../ink.js 中已经封装好的能力接到本文件流程里。
import { Box, Text } from '../ink.js';
// 复用 AutoUpdaterResult、getLatestVersion、getMaxVersion、InstallStatus、installGlobalPackage、shouldSkipVersion 工具函数，把通用处理留在 ../utils/autoUpdater.js 中维护。
import { type AutoUpdaterResult, getLatestVersion, getMaxVersion, type InstallStatus, installGlobalPackage, shouldSkipVersion } from '../utils/autoUpdater.js';
// 复用 getGlobalConfig、isAutoUpdaterDisabled 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig, isAutoUpdaterDisabled } from '../utils/config.js';
// 复用 logForDebugging 工具函数，把通用处理留在 ../utils/debug.js 中维护。
import { logForDebugging } from '../utils/debug.js';
// 复用 getCurrentInstallationType 工具函数，把通用处理留在 ../utils/doctorDiagnostic.js 中维护。
import { getCurrentInstallationType } from '../utils/doctorDiagnostic.js';
// 复用 installOrUpdateClaudePackage、localInstallationExists 工具函数，把通用处理留在 ../utils/localInstaller.js 中维护。
import { installOrUpdateClaudePackage, localInstallationExists } from '../utils/localInstaller.js';
// 复用 removeInstalledSymlink 工具函数，把通用处理留在 ../utils/nativeInstaller/index.js 中维护。
import { removeInstalledSymlink } from '../utils/nativeInstaller/index.js';
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
// AutoUpdater 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function AutoUpdater({
  isUpdating,
  onChangeIsUpdating,
  onAutoUpdaterResult,
  autoUpdaterResult,
  showSuccessMessage,
  verbose
}: Props): React.ReactNode {
  // 从 `useState<{` 按位置拆出 versions、setVersions，让终端 UI 组件 Auto Updater分别处理这些返回值。
  const [versions, setVersions] = useState<{
    global?: string | null;
    latest?: string | null;
  }>({});
  // hasLocalInstall 由 React state 持有，setHasLocalInstall 会在用户操作或异步结果返回时触发刷新。
  const [hasLocalInstall, setHasLocalInstall] = useState(false);
  // updateSemver保存`useUpdateNotification`，供终端渲染后续处理使用。
  const updateSemver = useUpdateNotification(autoUpdaterResult?.version);
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 显式忽略 `localInstallationExists().then(setHasLocalInstall)` 的返回值，只保留它触发的副作用。
    void localInstallationExists().then(setHasLocalInstall);
  }, []);

  // Track latest isUpdating value in a ref so the memoized checkForUpdates
  // callback always sees the current value. Without this, the 30-minute
  // interval fires with a stale closure where isUpdating is false, allowing
  // a concurrent installGlobalPackage() to run while one is already in
  // progress.
  // isUpdatingRef 引用记录 `useRef` 是否成立，终端渲染随后按该结果分支。
  const isUpdatingRef = useRef(isUpdating);
  // current更新为 `isUpdating`，确保终端 UI后续读取最新状态。
  isUpdatingRef.current = isUpdating;
  // checkForUpdates 集合保存`React.useCallback`，供终端渲染后续处理使用。
  const checkForUpdates = React.useCallback(async () => {
    // 满足 `isUpdatingRef.current` 时，终端渲染执行该分支。
    if (isUpdatingRef.current) {
      // 终端 UI 组件 Auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // 只有 `"production" === 'test' || "production" === 'deve` 满足时，终端渲染才执行该分支。
    if ("production" === 'test' || "production" === 'development') {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging('AutoUpdater: Skipping update check in test/dev environment');
      // 终端 UI 组件 Auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
      return;
    }
    // currentVersion 命名 `MACRO.VERSION`，让后续代码直接表达这个值的用途。
    const currentVersion = MACRO.VERSION;
    // channel读取`getInitialSettings`，供终端渲染后续处理使用。
    const channel = getInitialSettings()?.autoUpdatesChannel ?? 'latest';
    // latestVersion读取`getLatestVersion`，供终端渲染后续处理使用。
    let latestVersion = await getLatestVersion(channel);
    // isDisabled记录 `isAutoUpdaterDisabled` 是否成立，终端渲染随后按该结果分支。
    const isDisabled = isAutoUpdaterDisabled();

    // Check if max version is set (server-side kill switch for auto-updates)
    // maxVersion读取`getMaxVersion`，供终端渲染后续处理使用。
    const maxVersion = await getMaxVersion();
    // 只有 `maxVersion && latestVersion && gt(latestVersion, maxVersion)` 满足时，终端渲染才执行该分支。
    if (maxVersion && latestVersion && gt(latestVersion, maxVersion)) {
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`AutoUpdater: maxVersion ${maxVersion} is set, capping update from ${latestVersion} to ${maxVersion}`);
      // 满足 `gte(currentVersion, maxVersion)` 时，终端渲染执行该分支。
      if (gte(currentVersion, maxVersion)) {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`AutoUpdater: current version ${currentVersion} is already at or above maxVersion ${maxVersion}, skipping update`);
        // setVersions 写入新的状态值，使终端渲染后续读取保持一致。
        setVersions({
          global: currentVersion,
          latest: latestVersion
        });
        // 终端 UI 组件 Auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }
      // latestVersion更新为 `maxVersion`，确保终端 UI后续读取最新状态。
      latestVersion = maxVersion;
    }
    // setVersions 写入新的状态值，使终端渲染后续读取保持一致。
    setVersions({
      global: currentVersion,
      latest: latestVersion
    });

    // Check if update needed and perform update
    // 只有 `!isDisabled && currentVersion && latestVersion && !gte(currentVersion, late...` 满足时，终端渲染才执行该分支。
    if (!isDisabled && currentVersion && latestVersion && !gte(currentVersion, latestVersion) && !shouldSkipVersion(latestVersion)) {
      // startTime记录时间`Date.now`，供终端渲染后续处理使用。
      const startTime = Date.now();
      // 调用 onChangeIsUpdating，触发终端渲染此处需要的副作用。
      onChangeIsUpdating(true);

      // Remove native installer symlink since we're using JS-based updates
      // But only if user hasn't migrated to native installation
      // 配置读取`getGlobalConfig`，供终端渲染后续处理使用。
      const config = getGlobalConfig();
      // `config.installMethod` 与 `'native'` 不一致时刷新派生状态，避免使用过期结果。
      if (config.installMethod !== 'native') {
        // 等待 `removeInstalledSymlink()` 完成，再继续终端 UI 组件 Auto Updater的异步流程。
        await removeInstalledSymlink();
      }

      // Detect actual running installation type
      // installationType读取`getCurrentInstallationType`，供终端渲染后续处理使用。
      const installationType = await getCurrentInstallationType();
      // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`AutoUpdater: Detected installation type: ${installationType}`);

      // Skip update for development builds
      // 当 `installationType` 匹配 `'development'` 时，终端渲染执行对应分支。
      if (installationType === 'development') {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging('AutoUpdater: Cannot auto-update development build');
        // 调用 onChangeIsUpdating，触发终端渲染此处需要的副作用。
        onChangeIsUpdating(false);
        // 终端 UI 组件 Auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      }

      // Choose the appropriate update method based on what's actually running
      // installStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let installStatus: InstallStatus;
      // updateMethod 先占位，稍后的条件分支会根据实际输入补齐它。
      let updateMethod: 'local' | 'global';
      // 当 `installationType` 匹配 `'npm-local'` 时，终端渲染执行对应分支。
      if (installationType === 'npm-local') {
        // Use local update for local installations
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging('AutoUpdater: Using local update method');
        // updateMethod更新为 `'local'`，确保终端 UI后续读取最新状态。
        updateMethod = 'local';
        // installStatus 集合更新为 `await installOrUpdateClaudePackage(channel)`，确保终端 UI后续读取最新状态。
        installStatus = await installOrUpdateClaudePackage(channel);
      // 终端 UI 组件 Auto Updater在这里处理 `} else if (installationType === 'npm-global') {`，完成这一小步状态转换。
      } else if (installationType === 'npm-global') {
        // Use global update for global installations
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging('AutoUpdater: Using global update method');
        // updateMethod更新为 `'global'`，确保终端 UI后续读取最新状态。
        updateMethod = 'global';
        // installStatus 集合更新为 `await installGlobalPackage()`，确保终端 UI后续读取最新状态。
        installStatus = await installGlobalPackage();
      // 终端 UI 组件 Auto Updater在这里处理 `} else if (installationType === 'native') {`，完成这一小步状态转换。
      } else if (installationType === 'native') {
        // This shouldn't happen - native should use NativeAutoUpdater
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging('AutoUpdater: Unexpected native installation in non-native updater');
        // 调用 onChangeIsUpdating，触发终端渲染此处需要的副作用。
        onChangeIsUpdating(false);
        // 终端 UI 组件 Auto Updater在这里结束当前路径，避免继续执行不适用的后续分支。
        return;
      } else {
        // Fallback to config-based detection for unknown types
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logForDebugging(`AutoUpdater: Unknown installation type, falling back to config`);
        // isMigrated标记终端 UI Auto Updater是否启用对应路径。
        const isMigrated = config.installMethod === 'local';
        // updateMethod更新为 `isMigrated ? 'local' : 'global'`，确保终端 UI后续读取最新状态。
        updateMethod = isMigrated ? 'local' : 'global';
        // 满足 `isMigrated` 时，终端渲染执行该分支。
        if (isMigrated) {
          // installStatus 集合更新为 `await installOrUpdateClaudePackage(channel)`，确保终端 UI后续读取最新状态。
          installStatus = await installOrUpdateClaudePackage(channel);
        } else {
          // installStatus 集合更新为 `await installGlobalPackage()`，确保终端 UI后续读取最新状态。
          installStatus = await installGlobalPackage();
        }
      }
      // 调用 onChangeIsUpdating，触发终端渲染此处需要的副作用。
      onChangeIsUpdating(false);
      // 当 `installStatus` 匹配 `'success'` 时，终端渲染执行对应分支。
      if (installStatus === 'success') {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_auto_updater_success', {
          fromVersion: currentVersion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          toVersion: latestVersion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          durationMs: Date.now() - startTime,
          wasMigrated: updateMethod === 'local',
          installationType: installationType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
        });
      } else {
        // 记录终端渲染运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_auto_updater_fail', {
          fromVersion: currentVersion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          attemptedVersion: latestVersion as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          status: installStatus as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          durationMs: Date.now() - startTime,
          wasMigrated: updateMethod === 'local',
          installationType: installationType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
        });
      }
      // 调用 onAutoUpdaterResult，触发终端渲染此处需要的副作用。
      onAutoUpdaterResult({
        version: latestVersion,
        status: installStatus
      });
    }
    // isUpdating intentionally omitted from deps; we read isUpdatingRef
    // instead so the guard is always current without changing callback
    // identity (which would re-trigger the initial-check useEffect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // biome-ignore lint/correctness/useExhaustiveDependencies: isUpdating read via ref
  }, [onAutoUpdaterResult]);

  // Initial check
  // 调用 useEffect，触发终端渲染此处需要的副作用。
  useEffect(() => {
    // 显式忽略 `checkForUpdates()` 的返回值，只保留它触发的副作用。
    void checkForUpdates();
  }, [checkForUpdates]);

  // Check every 30 minutes
  // 调用 useInterval，触发终端渲染此处需要的副作用。
  useInterval(checkForUpdates, 30 * 60 * 1000);
  // 只有 `!autoUpdaterResult?.version && (!versions.global || !versions.latest)` 满足时，终端渲染才执行该分支。
  if (!autoUpdaterResult?.version && (!versions.global || !versions.latest)) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 只有 `!autoUpdaterResult?.version && !isUpdating` 满足时，终端渲染才执行该分支。
  if (!autoUpdaterResult?.version && !isUpdating) {
    // 返回 `null`，作为终端渲染这次计算的结果。
    return null;
  }
  // 返回 `<Box flexDirection="row" gap={1}>`，作为终端渲染这次计算的结果。
  return <Box flexDirection="row" gap={1}>
      {verbose && <Text dimColor wrap="truncate">
          globalVersion: {versions.global} &middot; latestVersion:{' '}
          {versions.latest}
        </Text>}
      {isUpdating ? <>
          <Box>
            <Text color="text" dimColor wrap="truncate">
              Auto-updating…
            </Text>
          </Box>
        </> : autoUpdaterResult?.status === 'success' && showSuccessMessage && updateSemver && <Text color="success" wrap="truncate">
            ✓ Update installed · Restart to apply
          </Text>}
      {(autoUpdaterResult?.status === 'install_failed' || autoUpdaterResult?.status === 'no_permissions') && <Text color="error" wrap="truncate">
          ✗ Auto-update failed &middot; Try <Text bold>claude doctor</Text> or{' '}
          <Text bold>
            {hasLocalInstall ? `cd ~/.claude/local && npm update ${MACRO.PACKAGE_URL}` : `npm i -g ${MACRO.PACKAGE_URL}`}
          </Text>
        </Text>}
    </Box>;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwiQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyIsImxvZ0V2ZW50IiwidXNlSW50ZXJ2YWwiLCJ1c2VVcGRhdGVOb3RpZmljYXRpb24iLCJCb3giLCJUZXh0IiwiQXV0b1VwZGF0ZXJSZXN1bHQiLCJnZXRMYXRlc3RWZXJzaW9uIiwiZ2V0TWF4VmVyc2lvbiIsIkluc3RhbGxTdGF0dXMiLCJpbnN0YWxsR2xvYmFsUGFja2FnZSIsInNob3VsZFNraXBWZXJzaW9uIiwiZ2V0R2xvYmFsQ29uZmlnIiwiaXNBdXRvVXBkYXRlckRpc2FibGVkIiwibG9nRm9yRGVidWdnaW5nIiwiZ2V0Q3VycmVudEluc3RhbGxhdGlvblR5cGUiLCJpbnN0YWxsT3JVcGRhdGVDbGF1ZGVQYWNrYWdlIiwibG9jYWxJbnN0YWxsYXRpb25FeGlzdHMiLCJyZW1vdmVJbnN0YWxsZWRTeW1saW5rIiwiZ3QiLCJndGUiLCJnZXRJbml0aWFsU2V0dGluZ3MiLCJQcm9wcyIsImlzVXBkYXRpbmciLCJvbkNoYW5nZUlzVXBkYXRpbmciLCJvbkF1dG9VcGRhdGVyUmVzdWx0IiwiYXV0b1VwZGF0ZXJSZXN1bHQiLCJzaG93U3VjY2Vzc01lc3NhZ2UiLCJ2ZXJib3NlIiwiQXV0b1VwZGF0ZXIiLCJSZWFjdE5vZGUiLCJ2ZXJzaW9ucyIsInNldFZlcnNpb25zIiwiZ2xvYmFsIiwibGF0ZXN0IiwiaGFzTG9jYWxJbnN0YWxsIiwic2V0SGFzTG9jYWxJbnN0YWxsIiwidXBkYXRlU2VtdmVyIiwidmVyc2lvbiIsInRoZW4iLCJpc1VwZGF0aW5nUmVmIiwiY3VycmVudCIsImNoZWNrRm9yVXBkYXRlcyIsInVzZUNhbGxiYWNrIiwiY3VycmVudFZlcnNpb24iLCJNQUNSTyIsIlZFUlNJT04iLCJjaGFubmVsIiwiYXV0b1VwZGF0ZXNDaGFubmVsIiwibGF0ZXN0VmVyc2lvbiIsImlzRGlzYWJsZWQiLCJtYXhWZXJzaW9uIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImNvbmZpZyIsImluc3RhbGxNZXRob2QiLCJpbnN0YWxsYXRpb25UeXBlIiwiaW5zdGFsbFN0YXR1cyIsInVwZGF0ZU1ldGhvZCIsImlzTWlncmF0ZWQiLCJmcm9tVmVyc2lvbiIsInRvVmVyc2lvbiIsImR1cmF0aW9uTXMiLCJ3YXNNaWdyYXRlZCIsImF0dGVtcHRlZFZlcnNpb24iLCJzdGF0dXMiLCJQQUNLQUdFX1VSTCJdLCJzb3VyY2VzIjpbIkF1dG9VcGRhdGVyLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtcbiAgdHlwZSBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICBsb2dFdmVudCxcbn0gZnJvbSAnc3JjL3NlcnZpY2VzL2FuYWx5dGljcy9pbmRleC5qcydcbmltcG9ydCB7IHVzZUludGVydmFsIH0gZnJvbSAndXNlaG9va3MtdHMnXG5pbXBvcnQgeyB1c2VVcGRhdGVOb3RpZmljYXRpb24gfSBmcm9tICcuLi9ob29rcy91c2VVcGRhdGVOb3RpZmljYXRpb24uanMnXG5pbXBvcnQgeyBCb3gsIFRleHQgfSBmcm9tICcuLi9pbmsuanMnXG5pbXBvcnQge1xuICB0eXBlIEF1dG9VcGRhdGVyUmVzdWx0LFxuICBnZXRMYXRlc3RWZXJzaW9uLFxuICBnZXRNYXhWZXJzaW9uLFxuICB0eXBlIEluc3RhbGxTdGF0dXMsXG4gIGluc3RhbGxHbG9iYWxQYWNrYWdlLFxuICBzaG91bGRTa2lwVmVyc2lvbixcbn0gZnJvbSAnLi4vdXRpbHMvYXV0b1VwZGF0ZXIuanMnXG5pbXBvcnQgeyBnZXRHbG9iYWxDb25maWcsIGlzQXV0b1VwZGF0ZXJEaXNhYmxlZCB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGxvZ0ZvckRlYnVnZ2luZyB9IGZyb20gJy4uL3V0aWxzL2RlYnVnLmpzJ1xuaW1wb3J0IHsgZ2V0Q3VycmVudEluc3RhbGxhdGlvblR5cGUgfSBmcm9tICcuLi91dGlscy9kb2N0b3JEaWFnbm9zdGljLmpzJ1xuaW1wb3J0IHtcbiAgaW5zdGFsbE9yVXBkYXRlQ2xhdWRlUGFja2FnZSxcbiAgbG9jYWxJbnN0YWxsYXRpb25FeGlzdHMsXG59IGZyb20gJy4uL3V0aWxzL2xvY2FsSW5zdGFsbGVyLmpzJ1xuaW1wb3J0IHsgcmVtb3ZlSW5zdGFsbGVkU3ltbGluayB9IGZyb20gJy4uL3V0aWxzL25hdGl2ZUluc3RhbGxlci9pbmRleC5qcydcbmltcG9ydCB7IGd0LCBndGUgfSBmcm9tICcuLi91dGlscy9zZW12ZXIuanMnXG5pbXBvcnQgeyBnZXRJbml0aWFsU2V0dGluZ3MgfSBmcm9tICcuLi91dGlscy9zZXR0aW5ncy9zZXR0aW5ncy5qcydcblxudHlwZSBQcm9wcyA9IHtcbiAgaXNVcGRhdGluZzogYm9vbGVhblxuICBvbkNoYW5nZUlzVXBkYXRpbmc6IChpc1VwZGF0aW5nOiBib29sZWFuKSA9PiB2b2lkXG4gIG9uQXV0b1VwZGF0ZXJSZXN1bHQ6IChhdXRvVXBkYXRlclJlc3VsdDogQXV0b1VwZGF0ZXJSZXN1bHQpID0+IHZvaWRcbiAgYXV0b1VwZGF0ZXJSZXN1bHQ6IEF1dG9VcGRhdGVyUmVzdWx0IHwgbnVsbFxuICBzaG93U3VjY2Vzc01lc3NhZ2U6IGJvb2xlYW5cbiAgdmVyYm9zZTogYm9vbGVhblxufVxuXG5leHBvcnQgZnVuY3Rpb24gQXV0b1VwZGF0ZXIoe1xuICBpc1VwZGF0aW5nLFxuICBvbkNoYW5nZUlzVXBkYXRpbmcsXG4gIG9uQXV0b1VwZGF0ZXJSZXN1bHQsXG4gIGF1dG9VcGRhdGVyUmVzdWx0LFxuICBzaG93U3VjY2Vzc01lc3NhZ2UsXG4gIHZlcmJvc2UsXG59OiBQcm9wcyk6IFJlYWN0LlJlYWN0Tm9kZSB7XG4gIGNvbnN0IFt2ZXJzaW9ucywgc2V0VmVyc2lvbnNdID0gdXNlU3RhdGU8e1xuICAgIGdsb2JhbD86IHN0cmluZyB8IG51bGxcbiAgICBsYXRlc3Q/OiBzdHJpbmcgfCBudWxsXG4gIH0+KHt9KVxuICBjb25zdCBbaGFzTG9jYWxJbnN0YWxsLCBzZXRIYXNMb2NhbEluc3RhbGxdID0gdXNlU3RhdGUoZmFsc2UpXG4gIGNvbnN0IHVwZGF0ZVNlbXZlciA9IHVzZVVwZGF0ZU5vdGlmaWNhdGlvbihhdXRvVXBkYXRlclJlc3VsdD8udmVyc2lvbilcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHZvaWQgbG9jYWxJbnN0YWxsYXRpb25FeGlzdHMoKS50aGVuKHNldEhhc0xvY2FsSW5zdGFsbClcbiAgfSwgW10pXG5cbiAgLy8gVHJhY2sgbGF0ZXN0IGlzVXBkYXRpbmcgdmFsdWUgaW4gYSByZWYgc28gdGhlIG1lbW9pemVkIGNoZWNrRm9yVXBkYXRlc1xuICAvLyBjYWxsYmFjayBhbHdheXMgc2VlcyB0aGUgY3VycmVudCB2YWx1ZS4gV2l0aG91dCB0aGlzLCB0aGUgMzAtbWludXRlXG4gIC8vIGludGVydmFsIGZpcmVzIHdpdGggYSBzdGFsZSBjbG9zdXJlIHdoZXJlIGlzVXBkYXRpbmcgaXMgZmFsc2UsIGFsbG93aW5nXG4gIC8vIGEgY29uY3VycmVudCBpbnN0YWxsR2xvYmFsUGFja2FnZSgpIHRvIHJ1biB3aGlsZSBvbmUgaXMgYWxyZWFkeSBpblxuICAvLyBwcm9ncmVzcy5cbiAgY29uc3QgaXNVcGRhdGluZ1JlZiA9IHVzZVJlZihpc1VwZGF0aW5nKVxuICBpc1VwZGF0aW5nUmVmLmN1cnJlbnQgPSBpc1VwZGF0aW5nXG5cbiAgY29uc3QgY2hlY2tGb3JVcGRhdGVzID0gUmVhY3QudXNlQ2FsbGJhY2soYXN5bmMgKCkgPT4ge1xuICAgIGlmIChpc1VwZGF0aW5nUmVmLmN1cnJlbnQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChcbiAgICAgIFwicHJvZHVjdGlvblwiID09PSAndGVzdCcgfHxcbiAgICAgIFwicHJvZHVjdGlvblwiID09PSAnZGV2ZWxvcG1lbnQnXG4gICAgKSB7XG4gICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgICdBdXRvVXBkYXRlcjogU2tpcHBpbmcgdXBkYXRlIGNoZWNrIGluIHRlc3QvZGV2IGVudmlyb25tZW50JyxcbiAgICAgIClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gTUFDUk8uVkVSU0lPTlxuICAgIGNvbnN0IGNoYW5uZWwgPSBnZXRJbml0aWFsU2V0dGluZ3MoKT8uYXV0b1VwZGF0ZXNDaGFubmVsID8/ICdsYXRlc3QnXG4gICAgbGV0IGxhdGVzdFZlcnNpb24gPSBhd2FpdCBnZXRMYXRlc3RWZXJzaW9uKGNoYW5uZWwpXG4gICAgY29uc3QgaXNEaXNhYmxlZCA9IGlzQXV0b1VwZGF0ZXJEaXNhYmxlZCgpXG5cbiAgICAvLyBDaGVjayBpZiBtYXggdmVyc2lvbiBpcyBzZXQgKHNlcnZlci1zaWRlIGtpbGwgc3dpdGNoIGZvciBhdXRvLXVwZGF0ZXMpXG4gICAgY29uc3QgbWF4VmVyc2lvbiA9IGF3YWl0IGdldE1heFZlcnNpb24oKVxuICAgIGlmIChtYXhWZXJzaW9uICYmIGxhdGVzdFZlcnNpb24gJiYgZ3QobGF0ZXN0VmVyc2lvbiwgbWF4VmVyc2lvbikpIHtcbiAgICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICAgYEF1dG9VcGRhdGVyOiBtYXhWZXJzaW9uICR7bWF4VmVyc2lvbn0gaXMgc2V0LCBjYXBwaW5nIHVwZGF0ZSBmcm9tICR7bGF0ZXN0VmVyc2lvbn0gdG8gJHttYXhWZXJzaW9ufWAsXG4gICAgICApXG4gICAgICBpZiAoZ3RlKGN1cnJlbnRWZXJzaW9uLCBtYXhWZXJzaW9uKSkge1xuICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoXG4gICAgICAgICAgYEF1dG9VcGRhdGVyOiBjdXJyZW50IHZlcnNpb24gJHtjdXJyZW50VmVyc2lvbn0gaXMgYWxyZWFkeSBhdCBvciBhYm92ZSBtYXhWZXJzaW9uICR7bWF4VmVyc2lvbn0sIHNraXBwaW5nIHVwZGF0ZWAsXG4gICAgICAgIClcbiAgICAgICAgc2V0VmVyc2lvbnMoeyBnbG9iYWw6IGN1cnJlbnRWZXJzaW9uLCBsYXRlc3Q6IGxhdGVzdFZlcnNpb24gfSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBsYXRlc3RWZXJzaW9uID0gbWF4VmVyc2lvblxuICAgIH1cblxuICAgIHNldFZlcnNpb25zKHsgZ2xvYmFsOiBjdXJyZW50VmVyc2lvbiwgbGF0ZXN0OiBsYXRlc3RWZXJzaW9uIH0pXG5cbiAgICAvLyBDaGVjayBpZiB1cGRhdGUgbmVlZGVkIGFuZCBwZXJmb3JtIHVwZGF0ZVxuICAgIGlmIChcbiAgICAgICFpc0Rpc2FibGVkICYmXG4gICAgICBjdXJyZW50VmVyc2lvbiAmJlxuICAgICAgbGF0ZXN0VmVyc2lvbiAmJlxuICAgICAgIWd0ZShjdXJyZW50VmVyc2lvbiwgbGF0ZXN0VmVyc2lvbikgJiZcbiAgICAgICFzaG91bGRTa2lwVmVyc2lvbihsYXRlc3RWZXJzaW9uKVxuICAgICkge1xuICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgb25DaGFuZ2VJc1VwZGF0aW5nKHRydWUpXG5cbiAgICAgIC8vIFJlbW92ZSBuYXRpdmUgaW5zdGFsbGVyIHN5bWxpbmsgc2luY2Ugd2UncmUgdXNpbmcgSlMtYmFzZWQgdXBkYXRlc1xuICAgICAgLy8gQnV0IG9ubHkgaWYgdXNlciBoYXNuJ3QgbWlncmF0ZWQgdG8gbmF0aXZlIGluc3RhbGxhdGlvblxuICAgICAgY29uc3QgY29uZmlnID0gZ2V0R2xvYmFsQ29uZmlnKClcbiAgICAgIGlmIChjb25maWcuaW5zdGFsbE1ldGhvZCAhPT0gJ25hdGl2ZScpIHtcbiAgICAgICAgYXdhaXQgcmVtb3ZlSW5zdGFsbGVkU3ltbGluaygpXG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBhY3R1YWwgcnVubmluZyBpbnN0YWxsYXRpb24gdHlwZVxuICAgICAgY29uc3QgaW5zdGFsbGF0aW9uVHlwZSA9IGF3YWl0IGdldEN1cnJlbnRJbnN0YWxsYXRpb25UeXBlKClcbiAgICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICAgYEF1dG9VcGRhdGVyOiBEZXRlY3RlZCBpbnN0YWxsYXRpb24gdHlwZTogJHtpbnN0YWxsYXRpb25UeXBlfWAsXG4gICAgICApXG5cbiAgICAgIC8vIFNraXAgdXBkYXRlIGZvciBkZXZlbG9wbWVudCBidWlsZHNcbiAgICAgIGlmIChpbnN0YWxsYXRpb25UeXBlID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgICAgIGxvZ0ZvckRlYnVnZ2luZygnQXV0b1VwZGF0ZXI6IENhbm5vdCBhdXRvLXVwZGF0ZSBkZXZlbG9wbWVudCBidWlsZCcpXG4gICAgICAgIG9uQ2hhbmdlSXNVcGRhdGluZyhmYWxzZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIENob29zZSB0aGUgYXBwcm9wcmlhdGUgdXBkYXRlIG1ldGhvZCBiYXNlZCBvbiB3aGF0J3MgYWN0dWFsbHkgcnVubmluZ1xuICAgICAgbGV0IGluc3RhbGxTdGF0dXM6IEluc3RhbGxTdGF0dXNcbiAgICAgIGxldCB1cGRhdGVNZXRob2Q6ICdsb2NhbCcgfCAnZ2xvYmFsJ1xuXG4gICAgICBpZiAoaW5zdGFsbGF0aW9uVHlwZSA9PT0gJ25wbS1sb2NhbCcpIHtcbiAgICAgICAgLy8gVXNlIGxvY2FsIHVwZGF0ZSBmb3IgbG9jYWwgaW5zdGFsbGF0aW9uc1xuICAgICAgICBsb2dGb3JEZWJ1Z2dpbmcoJ0F1dG9VcGRhdGVyOiBVc2luZyBsb2NhbCB1cGRhdGUgbWV0aG9kJylcbiAgICAgICAgdXBkYXRlTWV0aG9kID0gJ2xvY2FsJ1xuICAgICAgICBpbnN0YWxsU3RhdHVzID0gYXdhaXQgaW5zdGFsbE9yVXBkYXRlQ2xhdWRlUGFja2FnZShjaGFubmVsKVxuICAgICAgfSBlbHNlIGlmIChpbnN0YWxsYXRpb25UeXBlID09PSAnbnBtLWdsb2JhbCcpIHtcbiAgICAgICAgLy8gVXNlIGdsb2JhbCB1cGRhdGUgZm9yIGdsb2JhbCBpbnN0YWxsYXRpb25zXG4gICAgICAgIGxvZ0ZvckRlYnVnZ2luZygnQXV0b1VwZGF0ZXI6IFVzaW5nIGdsb2JhbCB1cGRhdGUgbWV0aG9kJylcbiAgICAgICAgdXBkYXRlTWV0aG9kID0gJ2dsb2JhbCdcbiAgICAgICAgaW5zdGFsbFN0YXR1cyA9IGF3YWl0IGluc3RhbGxHbG9iYWxQYWNrYWdlKClcbiAgICAgIH0gZWxzZSBpZiAoaW5zdGFsbGF0aW9uVHlwZSA9PT0gJ25hdGl2ZScpIHtcbiAgICAgICAgLy8gVGhpcyBzaG91bGRuJ3QgaGFwcGVuIC0gbmF0aXZlIHNob3VsZCB1c2UgTmF0aXZlQXV0b1VwZGF0ZXJcbiAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgICdBdXRvVXBkYXRlcjogVW5leHBlY3RlZCBuYXRpdmUgaW5zdGFsbGF0aW9uIGluIG5vbi1uYXRpdmUgdXBkYXRlcicsXG4gICAgICAgIClcbiAgICAgICAgb25DaGFuZ2VJc1VwZGF0aW5nKGZhbHNlKVxuICAgICAgICByZXR1cm5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZhbGxiYWNrIHRvIGNvbmZpZy1iYXNlZCBkZXRlY3Rpb24gZm9yIHVua25vd24gdHlwZXNcbiAgICAgICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgICAgIGBBdXRvVXBkYXRlcjogVW5rbm93biBpbnN0YWxsYXRpb24gdHlwZSwgZmFsbGluZyBiYWNrIHRvIGNvbmZpZ2AsXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgaXNNaWdyYXRlZCA9IGNvbmZpZy5pbnN0YWxsTWV0aG9kID09PSAnbG9jYWwnXG4gICAgICAgIHVwZGF0ZU1ldGhvZCA9IGlzTWlncmF0ZWQgPyAnbG9jYWwnIDogJ2dsb2JhbCdcblxuICAgICAgICBpZiAoaXNNaWdyYXRlZCkge1xuICAgICAgICAgIGluc3RhbGxTdGF0dXMgPSBhd2FpdCBpbnN0YWxsT3JVcGRhdGVDbGF1ZGVQYWNrYWdlKGNoYW5uZWwpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5zdGFsbFN0YXR1cyA9IGF3YWl0IGluc3RhbGxHbG9iYWxQYWNrYWdlKClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBvbkNoYW5nZUlzVXBkYXRpbmcoZmFsc2UpXG5cbiAgICAgIGlmIChpbnN0YWxsU3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgbG9nRXZlbnQoJ3Rlbmd1X2F1dG9fdXBkYXRlcl9zdWNjZXNzJywge1xuICAgICAgICAgIGZyb21WZXJzaW9uOlxuICAgICAgICAgICAgY3VycmVudFZlcnNpb24gYXMgQW5hbHl0aWNzTWV0YWRhdGFfSV9WRVJJRklFRF9USElTX0lTX05PVF9DT0RFX09SX0ZJTEVQQVRIUyxcbiAgICAgICAgICB0b1ZlcnNpb246XG4gICAgICAgICAgICBsYXRlc3RWZXJzaW9uIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgICAgZHVyYXRpb25NczogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgICB3YXNNaWdyYXRlZDogdXBkYXRlTWV0aG9kID09PSAnbG9jYWwnLFxuICAgICAgICAgIGluc3RhbGxhdGlvblR5cGU6XG4gICAgICAgICAgICBpbnN0YWxsYXRpb25UeXBlIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2dFdmVudCgndGVuZ3VfYXV0b191cGRhdGVyX2ZhaWwnLCB7XG4gICAgICAgICAgZnJvbVZlcnNpb246XG4gICAgICAgICAgICBjdXJyZW50VmVyc2lvbiBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICAgIGF0dGVtcHRlZFZlcnNpb246XG4gICAgICAgICAgICBsYXRlc3RWZXJzaW9uIGFzIEFuYWx5dGljc01ldGFkYXRhX0lfVkVSSUZJRURfVEhJU19JU19OT1RfQ09ERV9PUl9GSUxFUEFUSFMsXG4gICAgICAgICAgc3RhdHVzOlxuICAgICAgICAgICAgaW5zdGFsbFN0YXR1cyBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICAgIGR1cmF0aW9uTXM6IERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgICAgd2FzTWlncmF0ZWQ6IHVwZGF0ZU1ldGhvZCA9PT0gJ2xvY2FsJyxcbiAgICAgICAgICBpbnN0YWxsYXRpb25UeXBlOlxuICAgICAgICAgICAgaW5zdGFsbGF0aW9uVHlwZSBhcyBBbmFseXRpY3NNZXRhZGF0YV9JX1ZFUklGSUVEX1RISVNfSVNfTk9UX0NPREVfT1JfRklMRVBBVEhTLFxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBvbkF1dG9VcGRhdGVyUmVzdWx0KHtcbiAgICAgICAgdmVyc2lvbjogbGF0ZXN0VmVyc2lvbixcbiAgICAgICAgc3RhdHVzOiBpbnN0YWxsU3RhdHVzLFxuICAgICAgfSlcbiAgICB9XG4gICAgLy8gaXNVcGRhdGluZyBpbnRlbnRpb25hbGx5IG9taXR0ZWQgZnJvbSBkZXBzOyB3ZSByZWFkIGlzVXBkYXRpbmdSZWZcbiAgICAvLyBpbnN0ZWFkIHNvIHRoZSBndWFyZCBpcyBhbHdheXMgY3VycmVudCB3aXRob3V0IGNoYW5naW5nIGNhbGxiYWNrXG4gICAgLy8gaWRlbnRpdHkgKHdoaWNoIHdvdWxkIHJlLXRyaWdnZXIgdGhlIGluaXRpYWwtY2hlY2sgdXNlRWZmZWN0IGJlbG93KS5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvY29ycmVjdG5lc3MvdXNlRXhoYXVzdGl2ZURlcGVuZGVuY2llczogaXNVcGRhdGluZyByZWFkIHZpYSByZWZcbiAgfSwgW29uQXV0b1VwZGF0ZXJSZXN1bHRdKVxuXG4gIC8vIEluaXRpYWwgY2hlY2tcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICB2b2lkIGNoZWNrRm9yVXBkYXRlcygpXG4gIH0sIFtjaGVja0ZvclVwZGF0ZXNdKVxuXG4gIC8vIENoZWNrIGV2ZXJ5IDMwIG1pbnV0ZXNcbiAgdXNlSW50ZXJ2YWwoY2hlY2tGb3JVcGRhdGVzLCAzMCAqIDYwICogMTAwMClcblxuICBpZiAoIWF1dG9VcGRhdGVyUmVzdWx0Py52ZXJzaW9uICYmICghdmVyc2lvbnMuZ2xvYmFsIHx8ICF2ZXJzaW9ucy5sYXRlc3QpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmICghYXV0b1VwZGF0ZXJSZXN1bHQ/LnZlcnNpb24gJiYgIWlzVXBkYXRpbmcpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZsZXhEaXJlY3Rpb249XCJyb3dcIiBnYXA9ezF9PlxuICAgICAge3ZlcmJvc2UgJiYgKFxuICAgICAgICA8VGV4dCBkaW1Db2xvciB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAgICBnbG9iYWxWZXJzaW9uOiB7dmVyc2lvbnMuZ2xvYmFsfSAmbWlkZG90OyBsYXRlc3RWZXJzaW9uOnsnICd9XG4gICAgICAgICAge3ZlcnNpb25zLmxhdGVzdH1cbiAgICAgICAgPC9UZXh0PlxuICAgICAgKX1cbiAgICAgIHtpc1VwZGF0aW5nID8gKFxuICAgICAgICA8PlxuICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICA8VGV4dCBjb2xvcj1cInRleHRcIiBkaW1Db2xvciB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgQXV0by11cGRhdGluZ+KAplxuICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgIDwvQm94PlxuICAgICAgICA8Lz5cbiAgICAgICkgOiAoXG4gICAgICAgIGF1dG9VcGRhdGVyUmVzdWx0Py5zdGF0dXMgPT09ICdzdWNjZXNzJyAmJlxuICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UgJiZcbiAgICAgICAgdXBkYXRlU2VtdmVyICYmIChcbiAgICAgICAgICA8VGV4dCBjb2xvcj1cInN1Y2Nlc3NcIiB3cmFwPVwidHJ1bmNhdGVcIj5cbiAgICAgICAgICAgIOKckyBVcGRhdGUgaW5zdGFsbGVkIMK3IFJlc3RhcnQgdG8gYXBwbHlcbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIClcbiAgICAgICl9XG4gICAgICB7KGF1dG9VcGRhdGVyUmVzdWx0Py5zdGF0dXMgPT09ICdpbnN0YWxsX2ZhaWxlZCcgfHxcbiAgICAgICAgYXV0b1VwZGF0ZXJSZXN1bHQ/LnN0YXR1cyA9PT0gJ25vX3Blcm1pc3Npb25zJykgJiYgKFxuICAgICAgICA8VGV4dCBjb2xvcj1cImVycm9yXCIgd3JhcD1cInRydW5jYXRlXCI+XG4gICAgICAgICAg4pyXIEF1dG8tdXBkYXRlIGZhaWxlZCAmbWlkZG90OyBUcnkgPFRleHQgYm9sZD5jbGF1ZGUgZG9jdG9yPC9UZXh0PiBvcnsnICd9XG4gICAgICAgICAgPFRleHQgYm9sZD5cbiAgICAgICAgICAgIHtoYXNMb2NhbEluc3RhbGxcbiAgICAgICAgICAgICAgPyBgY2Qgfi8uY2xhdWRlL2xvY2FsICYmIG5wbSB1cGRhdGUgJHtNQUNSTy5QQUNLQUdFX1VSTH1gXG4gICAgICAgICAgICAgIDogYG5wbSBpIC1nICR7TUFDUk8uUEFDS0FHRV9VUkx9YH1cbiAgICAgICAgICA8L1RleHQ+XG4gICAgICAgIDwvVGV4dD5cbiAgICAgICl9XG4gICAgPC9Cb3g+XG4gIClcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLQSxLQUFLLE1BQU0sT0FBTztBQUM5QixTQUFTQyxTQUFTLEVBQUVDLE1BQU0sRUFBRUMsUUFBUSxRQUFRLE9BQU87QUFDbkQsU0FDRSxLQUFLQywwREFBMEQsRUFDL0RDLFFBQVEsUUFDSCxpQ0FBaUM7QUFDeEMsU0FBU0MsV0FBVyxRQUFRLGFBQWE7QUFDekMsU0FBU0MscUJB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QUFDLEVBQUU7SUFDekUsT0FBTyxJQUFJO0VBQ2I7RUFFQSxJQUFJLENBQUNSLGlCQUFpQixFQUFFWSxPQUFPLElBQUksQ0FBQ2YsVUFBVSxFQUFFO0lBQzlDLE9BQU8sSUFBSTtFQUNiO0VBRUEsT0FDRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxNQUFNLENBQUNLLE9BQU8sSUFDTixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDdEMseUJBQXlCLENBQUNHLFFBQVEsQ0FBQ0UsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUc7QUFDdEUsVUFBVSxDQUFDRixRQUFRLENBQUNHLE1BQU07QUFDMUIsUUFBUSxFQUFFLElBQUksQ0FDUDtBQUNQLE1BQU0sQ0FBQ1gsVUFBVSxHQUNUO0FBQ1IsVUFBVSxDQUFDLEdBQUc7QUFDZCxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVO0FBQ3ZEO0FBQ0EsWUFBWSxFQUFFLElBQUk7QUFDbEIsVUFBVSxFQUFFLEdBQUc7QUFDZixRQUFRLEdBQUcsR0FFSEcsaUJBQWlCLEVBQUV3QyxNQUFNLEtBQUssU0FBUyxJQUN2Q3ZDLGtCQUFrQixJQUNsQlUsWUFBWSxJQUNWLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDL0M7QUFDQSxVQUFVLEVBQUUsSUFBSSxDQUVUO0FBQ1AsTUFBTSxDQUFDLENBQUNYLGlCQUFpQixFQUFFd0MsTUFBTSxLQUFLLGdCQUFnQixJQUM5Q3hDLGlCQUFpQixFQUFFd0MsTUFBTSxLQUFLLGdCQUFnQixLQUM5QyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVO0FBQzNDLDRDQUE0QyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRztBQUNsRixVQUFVLENBQUMsSUFBSSxDQUFDLElBQUk7QUFDcEIsWUFBWSxDQUFDL0IsZUFBZSxHQUNaLG9DQUFvQ1UsS0FBSyxDQUFDc0IsV0FBVyxFQUFFLEdBQ3ZELFlBQVl0QixLQUFLLENBQUNzQixXQUFXLEVBQUU7QUFDL0MsVUFBVSxFQUFFLElBQUk7QUFDaEIsUUFBUSxFQUFFLElBQUksQ0FDUDtBQUNQLElBQUksRUFBRSxHQUFHLENBQUM7QUFFViIsImlnbm9yZUxpc3QiOltdfQ==