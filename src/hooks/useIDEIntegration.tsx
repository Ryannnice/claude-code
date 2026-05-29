// 引入 c as _c，将 react/compiler-runtime 中已经封装好的能力接到本文件流程里。
import { c as _c } from "react/compiler-runtime";
// 引入 useEffect，将 react 中已经封装好的能力接到本文件流程里。
import { useEffect } from 'react';
// 类型依赖 { ScopedMcpServerConfig } 来自 ../services/mcp/types.js，用于校准React hook 状态流的数据契约。
import type { ScopedMcpServerConfig } from '../services/mcp/types.js';
// 复用 getGlobalConfig 工具函数，把通用处理留在 ../utils/config.js 中维护。
import { getGlobalConfig } from '../utils/config.js';
// 复用 isEnvDefinedFalsy、isEnvTruthy 工具函数，把通用处理留在 ../utils/envUtils.js 中维护。
import { isEnvDefinedFalsy, isEnvTruthy } from '../utils/envUtils.js';
// 类型依赖 { DetectedIDEInfo } 来自 ../utils/ide.js，用于校准React hook 状态流的数据契约。
import type { DetectedIDEInfo } from '../utils/ide.js';
// 复用 IDEExtensionInstallationStatus、IdeType、initializeIdeIntegration、isSupportedTerminal 工具函数，把通用处理留在 ../utils/ide.js 中维护。
import { type IDEExtensionInstallationStatus, type IdeType, initializeIdeIntegration, isSupportedTerminal } from '../utils/ide.js';
// UseIDEIntegrationProps 固化React hook 状态流里传递的数据形状，帮助调用方按同一结构读写字段。
type UseIDEIntegrationProps = {
  autoConnectIdeFlag?: boolean;
  ideToInstallExtension: IdeType | null;
  setDynamicMcpConfig: React.Dispatch<React.SetStateAction<Record<string, ScopedMcpServerConfig> | undefined>>;
  setShowIdeOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
  setIDEInstallationState: React.Dispatch<React.SetStateAction<IDEExtensionInstallationStatus | null>>;
};
// useIDEIntegration 封装useIDEIntegration的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function useIDEIntegration(t0) {
  // $保存`_c`，供React hook后续处理使用。
  const $ = _c(7);
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    autoConnectIdeFlag,
    ideToInstallExtension,
    setDynamicMcpConfig,
    setShowIdeOnboarding,
    setIDEInstallationState
  } = t0;
  // t1 暂存 `() => {` 的派生结果，便于缓存命中时直接复用。
  let t1;
  // t2 作为 React 编译缓存的临时槽位，稍后会接收 JSX 或派生数据。
  let t2;
  // React 缓存槽依赖变化时重新计算，依赖稳定时沿用上一轮渲染产物。
  if ($[0] !== autoConnectIdeFlag || $[1] !== ideToInstallExtension || $[2] !== setDynamicMcpConfig || $[3] !== setIDEInstallationState || $[4] !== setShowIdeOnboarding) {
    // t1 暂存 `() => {` 生成的渲染片段，后续返回路径直接复用。
    t1 = () => {
      // addIde保存`addIde`，供React hook后续处理使用。
      const addIde = function addIde(ide) {
        // ide缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!ide) {
          // React hook use IDEIntegration在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // globalConfig 配置读取`getGlobalConfig`，供React hook后续处理使用。
        const globalConfig = getGlobalConfig();
        // autoConnectEnabled保存`isSupportedTerminal`，供React hook后续处理使用。
        const autoConnectEnabled = (globalConfig.autoConnectIde || autoConnectIdeFlag || isSupportedTerminal() || process.env.CLAUDE_CODE_SSE_PORT || ideToInstallExtension || isEnvTruthy(process.env.CLAUDE_CODE_AUTO_CONNECT_IDE)) && !isEnvDefinedFalsy(process.env.CLAUDE_CODE_AUTO_CONNECT_IDE);
        // autoConnectEnabled缺失时提前走兜底路径，避免React hook 状态流继续依赖无效输入。
        if (!autoConnectEnabled) {
          // React hook use IDEIntegration在这里结束当前路径，避免继续执行不适用的后续分支。
          return;
        }
        // setDynamicMcpConfig 写入新的状态值，使React hook 状态流后续读取保持一致。
        setDynamicMcpConfig(prev => {
          // 满足 `prev?.ide` 时，React hook执行该分支。
          if (prev?.ide) {
            // 返回 `prev`，作为React hook 状态流这次计算的结果。
            return prev;
          }
          // 返回结构化结果，集中表达React hook 状态流已经整理出的状态。
          return {
            ...prev,
            ide: {
              type: ide.url.startsWith("ws:") ? "ws-ide" : "sse-ide",
              url: ide.url,
              ideName: ide.name,
              authToken: ide.authToken,
              ideRunningInWindows: ide.ideRunningInWindows,
              scope: "dynamic" as const
            }
          };
        });
      };
      // 调用 initializeIdeIntegration，触发React hook此处需要的副作用。
      initializeIdeIntegration(addIde, ideToInstallExtension, () => setShowIdeOnboarding(true), status => setIDEInstallationState(status));
    };
    // t2 暂存 `[autoConnectIdeFlag, ideToInstallExtension, setDynamicMcp...` 生成的渲染片段，后续返回路径直接复用。
    t2 = [autoConnectIdeFlag, ideToInstallExtension, setDynamicMcpConfig, setShowIdeOnboarding, setIDEInstallationState];
    // $[0] 缓存 `autoConnectIdeFlag`，下次依赖未变时 React 编译产物可直接复用。
    $[0] = autoConnectIdeFlag;
    // $[1] 缓存 `ideToInstallExtension`，下次依赖未变时 React 编译产物可直接复用。
    $[1] = ideToInstallExtension;
    // $[2] 缓存 `setDynamicMcpConfig`，下次依赖未变时 React 编译产物可直接复用。
    $[2] = setDynamicMcpConfig;
    // $[3] 缓存 `setIDEInstallationState`，下次依赖未变时 React 编译产物可直接复用。
    $[3] = setIDEInstallationState;
    // $[4] 缓存 `setShowIdeOnboarding`，下次依赖未变时 React 编译产物可直接复用。
    $[4] = setShowIdeOnboarding;
    // $[5] 缓存 `t1`，下次依赖未变时 React 编译产物可直接复用。
    $[5] = t1;
    // $[6] 缓存 `t2`，下次依赖未变时 React 编译产物可直接复用。
    $[6] = t2;
  } else {
    // t1 从 React 编译缓存槽 $[5] 取回渲染片段，避免依赖未变时重建 JSX。
    t1 = $[5];
    // t2 从 React 编译缓存槽 $[6] 取回渲染片段，避免依赖未变时重建 JSX。
    t2 = $[6];
  }
  // 调用 useEffect，触发React hook此处需要的副作用。
  useEffect(t1, t2);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJTY29wZWRNY3BTZXJ2ZXJDb25maWciLCJnZXRHbG9iYWxDb25maWciLCJpc0VudkRlZmluZWRGYWxzeSIsImlzRW52VHJ1dGh5IiwiRGV0ZWN0ZWRJREVJbmZvIiwiSURFRXh0ZW5zaW9uSW5zdGFsbGF0aW9uU3RhdHVzIiwiSWRlVHlwZSIsImluaXRpYWxpemVJZGVJbnRlZ3JhdGlvbiIsImlzU3VwcG9ydGVkVGVybWluYWwiLCJVc2VJREVJbnRlZ3JhdGlvblByb3BzIiwiYXV0b0Nvbm5lY3RJZGVGbGFnIiwiaWRlVG9JbnN0YWxsRXh0ZW5zaW9uIiwic2V0RHluYW1pY01jcENvbmZpZyIsIlJlYWN0IiwiRGlzcGF0Y2giLCJTZXRTdGF0ZUFjdGlvbiIsIlJlY29yZCIsInNldFNob3dJZGVPbmJvYXJkaW5nIiwic2V0SURFSW5zdGFsbGF0aW9uU3RhdGUiLCJ1c2VJREVJbnRlZ3JhdGlvbiIsInQwIiwiJCIsIl9jIiwidDEiLCJ0MiIsImFkZElkZSIsImlkZSIsImdsb2JhbENvbmZpZyIsImF1dG9Db25uZWN0RW5hYmxlZCIsImF1dG9Db25uZWN0SWRlIiwicHJvY2VzcyIsImVudiIsIkNMQVVERV9DT0RFX1NTRV9QT1JUIiwiQ0xBVURFX0NPREVfQVVUT19DT05ORUNUX0lERSIsInByZXYiLCJ0eXBlIiwidXJsIiwic3RhcnRzV2l0aCIsImlkZU5hbWUiLCJuYW1lIiwiYXV0aFRva2VuIiwiaWRlUnVubmluZ0luV2luZG93cyIsInNjb3BlIiwiY29uc3QiLCJzdGF0dXMiXSwic291cmNlcyI6WyJ1c2VJREVJbnRlZ3JhdGlvbi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IFNjb3BlZE1jcFNlcnZlckNvbmZpZyB9IGZyb20gJy4uL3NlcnZpY2VzL21jcC90eXBlcy5qcydcbmltcG9ydCB7IGdldEdsb2JhbENvbmZpZyB9IGZyb20gJy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGlzRW52RGVmaW5lZEZhbHN5LCBpc0VudlRydXRoeSB9IGZyb20gJy4uL3V0aWxzL2VudlV0aWxzLmpzJ1xuaW1wb3J0IHR5cGUgeyBEZXRlY3RlZElERUluZm8gfSBmcm9tICcuLi91dGlscy9pZGUuanMnXG5pbXBvcnQge1xuICB0eXBlIElERUV4dGVuc2lvbkluc3RhbGxhdGlvblN0YXR1cyxcbiAgdHlwZSBJZGVUeXBlLFxuICBpbml0aWFsaXplSWRlSW50ZWdyYXRpb24sXG4gIGlzU3VwcG9ydGVkVGVybWluYWwsXG59IGZyb20gJy4uL3V0aWxzL2lkZS5qcydcblxudHlwZSBVc2VJREVJbnRlZ3JhdGlvblByb3BzID0ge1xuICBhdXRvQ29ubmVjdElkZUZsYWc/OiBib29sZWFuXG4gIGlkZVRvSW5zdGFsbEV4dGVuc2lvbjogSWRlVHlwZSB8IG51bGxcbiAgc2V0RHluYW1pY01jcENvbmZpZzogUmVhY3QuRGlzcGF0Y2g8XG4gICAgUmVhY3QuU2V0U3RhdGVBY3Rpb248UmVjb3JkPHN0cmluZywgU2NvcGVkTWNwU2VydmVyQ29uZmlnPiB8IHVuZGVmaW5lZD5cbiAgPlxuICBzZXRTaG93SWRlT25ib2FyZGluZzogUmVhY3QuRGlzcGF0Y2g8UmVhY3QuU2V0U3RhdGVBY3Rpb248Ym9vbGVhbj4+XG4gIHNldElERUluc3RhbGxhdGlvblN0YXRlOiBSZWFjdC5EaXNwYXRjaDxcbiAgICBSZWFjdC5TZXRTdGF0ZUFjdGlvbjxJREVFeHRlbnNpb25JbnN0YWxsYXRpb25TdGF0dXMgfCBudWxsPlxuICA+XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VJREVJbnRlZ3JhdGlvbih7XG4gIGF1dG9Db25uZWN0SWRlRmxhZyxcbiAgaWRlVG9JbnN0YWxsRXh0ZW5zaW9uLFxuICBzZXREeW5hbWljTWNwQ29uZmlnLFxuICBzZXRTaG93SWRlT25ib2FyZGluZyxcbiAgc2V0SURFSW5zdGFsbGF0aW9uU3RhdGUsXG59OiBVc2VJREVJbnRlZ3JhdGlvblByb3BzKTogdm9pZCB7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZnVuY3Rpb24gYWRkSWRlKGlkZTogRGV0ZWN0ZWRJREVJbmZvIHwgbnVsbCkge1xuICAgICAgaWYgKCFpZGUpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIGF1dG8tY29ubmVjdCBpcyBlbmFibGVkXG4gICAgICBjb25zdCBnbG9iYWxDb25maWcgPSBnZXRHbG9iYWxDb25maWcoKVxuICAgICAgY29uc3QgYXV0b0Nvbm5lY3RFbmFibGVkID1cbiAgICAgICAgKGdsb2JhbENvbmZpZy5hdXRvQ29ubmVjdElkZSB8fFxuICAgICAgICAgIGF1dG9Db25uZWN0SWRlRmxhZyB8fFxuICAgICAgICAgIGlzU3VwcG9ydGVkVGVybWluYWwoKSB8fFxuICAgICAgICAgIC8vIHRtdXgvc2NyZWVuIG92ZXJ3cml0ZSBURVJNX1BST0dSQU0sIGJyZWFraW5nIHRlcm1pbmFsIGRldGVjdGlvbiwgYnV0IHRoZVxuICAgICAgICAgIC8vIElERSBleHRlbnNpb24ncyBwb3J0IGVudiB2YXIgaXMgaW5oZXJpdGVkLiBJZiBzZXQsIGF1dG8tY29ubmVjdCBhbnl3YXkuXG4gICAgICAgICAgcHJvY2Vzcy5lbnYuQ0xBVURFX0NPREVfU1NFX1BPUlQgfHxcbiAgICAgICAgICBpZGVUb0luc3RhbGxFeHRlbnNpb24gfHxcbiAgICAgICAgICBpc0VudlRydXRoeShwcm9jZXNzLmVudi5DTEFVREVfQ09ERV9BVVRPX0NPTk5FQ1RfSURFKSkgJiZcbiAgICAgICAgIWlzRW52RGVmaW5lZEZhbHN5KHByb2Nlc3MuZW52LkNMQVVERV9DT0RFX0FVVE9fQ09OTkVDVF9JREUpXG5cbiAgICAgIGlmICghYXV0b0Nvbm5lY3RFbmFibGVkKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBzZXREeW5hbWljTWNwQ29uZmlnKHByZXYgPT4ge1xuICAgICAgICAvLyBPbmx5IGFkZCB0aGUgSURFIGlmIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBvbmVcbiAgICAgICAgaWYgKHByZXY/LmlkZSkge1xuICAgICAgICAgIHJldHVybiBwcmV2XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgIGlkZToge1xuICAgICAgICAgICAgdHlwZTogaWRlLnVybC5zdGFydHNXaXRoKCd3czonKSA/ICd3cy1pZGUnIDogJ3NzZS1pZGUnLFxuICAgICAgICAgICAgdXJsOiBpZGUudXJsLFxuICAgICAgICAgICAgaWRlTmFtZTogaWRlLm5hbWUsXG4gICAgICAgICAgICBhdXRoVG9rZW46IGlkZS5hdXRoVG9rZW4sXG4gICAgICAgICAgICBpZGVSdW5uaW5nSW5XaW5kb3dzOiBpZGUuaWRlUnVubmluZ0luV2luZG93cyxcbiAgICAgICAgICAgIHNjb3BlOiAnZHluYW1pYycgYXMgY29uc3QsXG4gICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBVc2UgdGhlIG5ldyB1dGlsaXR5IGZ1bmN0aW9uXG4gICAgdm9pZCBpbml0aWFsaXplSWRlSW50ZWdyYXRpb24oXG4gICAgICBhZGRJZGUsXG4gICAgICBpZGVUb0luc3RhbGxFeHRlbnNpb24sXG4gICAgICAoKSA9PiBzZXRTaG93SWRlT25ib2FyZGluZyh0cnVlKSxcbiAgICAgIHN0YXR1cyA9PiBzZXRJREVJbnN0YWxsYXRpb25TdGF0ZShzdGF0dXMpLFxuICAgIClcbiAgfSwgW1xuICAgIGF1dG9Db25uZWN0SWRlRmxhZyxcbiAgICBpZGVUb0luc3RhbGxFeHRlbnNpb24sXG4gICAgc2V0RHluYW1pY01jcENvbmZpZyxcbiAgICBzZXRTaG93SWRlT25ib2FyZGluZyxcbiAgICBzZXRJREVJbnN0YWxsYXRpb25TdGF0ZSxcbiAgXSlcbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUFBLFNBQVNBLFNBQVMsUUFBUSxPQUFPO0FBQ2pDLGNBQWNDLHFCQUFxQixRQUFRLDBCQUEwQjtBQUNyRSxTQUFTQyxlQUFlLFFBQVEs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