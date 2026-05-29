// 引入 * as React，将 react 中已经封装好的能力接到本文件流程里。
import * as React from 'react';
// 引入 clearTrustedDeviceTokenCache，将 ../../bridge/trustedDevice.js 中已经封装好的能力接到本文件流程里。
import { clearTrustedDeviceTokenCache } from '../../bridge/trustedDevice.js';
// 引入 Text，将 ../../ink.js 中已经封装好的能力接到本文件流程里。
import { Text } from '../../ink.js';
// 接入 refreshGrowthBookAfterAuthChange 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { refreshGrowthBookAfterAuthChange } from '../../services/analytics/growthbook.js';
// 接入 getGroveNoticeConfig、getGroveSettings 服务层能力，把外部通信或共享状态交给 ../../services/api/grove.js 处理。
import { getGroveNoticeConfig, getGroveSettings } from '../../services/api/grove.js';
// 接入 clearPolicyLimitsCache 服务层能力，把外部通信或共享状态交给 ../../services/policyLimits/index.js 处理。
import { clearPolicyLimitsCache } from '../../services/policyLimits/index.js';
// flushTelemetry is loaded lazily to avoid pulling in ~1.1MB of OpenTelemetry at startup
// 接入 clearRemoteManagedSettingsCache 服务层能力，把外部通信或共享状态交给 ../../services/remoteManagedSettings/index.js 处理。
import { clearRemoteManagedSettingsCache } from '../../services/remoteManagedSettings/index.js';
// 复用 getClaudeAIOAuthTokens、removeApiKey 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getClaudeAIOAuthTokens, removeApiKey } from '../../utils/auth.js';
// 复用 clearBetasCaches 工具函数，把通用处理留在 ../../utils/betas.js 中维护。
import { clearBetasCaches } from '../../utils/betas.js';
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { saveGlobalConfig } from '../../utils/config.js';
// 复用 gracefulShutdownSync 工具函数，把通用处理留在 ../../utils/gracefulShutdown.js 中维护。
import { gracefulShutdownSync } from '../../utils/gracefulShutdown.js';
// 复用 getSecureStorage 工具函数，把通用处理留在 ../../utils/secureStorage/index.js 中维护。
import { getSecureStorage } from '../../utils/secureStorage/index.js';
// 复用 clearToolSchemaCache 工具函数，把通用处理留在 ../../utils/toolSchemaCache.js 中维护。
import { clearToolSchemaCache } from '../../utils/toolSchemaCache.js';
// 复用 resetUserCache 工具函数，把通用处理留在 ../../utils/user.js 中维护。
import { resetUserCache } from '../../utils/user.js';
// performLogout 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function performLogout({
  clearOnboarding = false
}): Promise<void> {
  // Flush telemetry BEFORE clearing credentials to prevent org data leakage
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    flushTelemetry
  } = await import('../../utils/telemetry/instrumentation.js');
  // 等待 `flushTelemetry()` 完成，再继续斜杠命令 logout的异步流程。
  await flushTelemetry();
  // 等待 `removeApiKey()` 完成，再继续斜杠命令 logout的异步流程。
  await removeApiKey();

  // Wipe all secure storage data on logout
  // secureStorage读取`getSecureStorage`，供命令处理后续处理使用。
  const secureStorage = getSecureStorage();
  // 调用 secureStorage.delete，触发命令处理此处需要的副作用。
  secureStorage.delete();
  // 等待 `clearAuthRelatedCaches()` 完成，再继续斜杠命令 logout的异步流程。
  await clearAuthRelatedCaches();
  // 调用 saveGlobalConfig，触发命令处理此处需要的副作用。
  saveGlobalConfig(current => {
    // updated 集中保存命令处理斜杠命令 logout要一起传递的字段。
    const updated = {
      ...current
    };
    // 满足 `clearOnboarding` 时，命令处理执行该分支。
    if (clearOnboarding) {
      // hasCompletedOnboarding更新为 `false`，确保斜杠命令后续读取最新状态。
      updated.hasCompletedOnboarding = false;
      // subscriptionNoticeCount 数量更新为 `0`，确保斜杠命令后续读取最新状态。
      updated.subscriptionNoticeCount = 0;
      // hasAvailableSubscription更新为 `false`，确保斜杠命令后续读取最新状态。
      updated.hasAvailableSubscription = false;
      // 满足 `updated.customApiKeyResponses?.approved` 时，命令处理执行该分支。
      if (updated.customApiKeyResponses?.approved) {
        // customApiKeyResponses 响应数据更新为 `{`，确保斜杠命令后续读取最新状态。
        updated.customApiKeyResponses = {
          ...updated.customApiKeyResponses,
          approved: []
        };
      }
    }
    // oauthAccount 数量更新为 `undefined`，确保斜杠命令后续读取最新状态。
    updated.oauthAccount = undefined;
    // 返回 `updated`，作为命令处理这次计算的结果。
    return updated;
  });
}

// clearing anything memoized that must be invalidated when user/session/auth changes
// clearAuthRelatedCaches 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function clearAuthRelatedCaches(): Promise<void> {
  // Clear the OAuth token cache
  // 调用 getClaudeAIOAuthTokens.cache?.clear?.();，完成这一处局部操作。
  getClaudeAIOAuthTokens.cache?.clear?.();
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearTrustedDeviceTokenCache();
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearBetasCaches();
  // 清理相关缓存，确保命令处理下一次读取时重新加载最新数据。
  clearToolSchemaCache();

  // Clear user data cache BEFORE GrowthBook refresh so it picks up fresh credentials
  // 调用 resetUserCache，触发命令处理此处需要的副作用。
  resetUserCache();
  // 调用 refreshGrowthBookAfterAuthChange，触发命令处理此处需要的副作用。
  refreshGrowthBookAfterAuthChange();

  // Clear Grove config cache
  // 调用 getGroveNoticeConfig.cache?.clear?.();，完成这一处局部操作。
  getGroveNoticeConfig.cache?.clear?.();
  // 调用 getGroveSettings.cache?.clear?.();，完成这一处局部操作。
  getGroveSettings.cache?.clear?.();

  // Clear remotely managed settings cache
  // 等待 `clearRemoteManagedSettingsCache()` 完成，再继续斜杠命令 logout的异步流程。
  await clearRemoteManagedSettingsCache();

  // Clear policy limits cache
  // 等待 `clearPolicyLimitsCache()` 完成，再继续斜杠命令 logout的异步流程。
  await clearPolicyLimitsCache();
}
// call 封装斜杠命令的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function call(): Promise<React.ReactNode> {
  // 等待 `performLogout({` 完成，再继续斜杠命令 logout的异步流程。
  await performLogout({
    clearOnboarding: true
  });
  // 消息统计`<Text>Successfully logged out from your Anthropic account...`，供后续判断或组装使用。
  const message = <Text>Successfully logged out from your Anthropic account.</Text>;
  // setTimeout 写入新的状态值，使命令处理后续读取保持一致。
  setTimeout(() => {
    // 调用 gracefulShutdownSync，触发命令处理此处需要的副作用。
    gracefulShutdownSync(0, 'logout');
  }, 200);
  // 返回 `message`，作为命令处理这次计算的结果。
  return message;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZWFjdCIsImNsZWFyVHJ1c3RlZERldmljZVRva2VuQ2FjaGUiLCJUZXh0IiwicmVmcmVzaEdyb3d0aEJvb2tBZnRlckF1dGhDaGFuZ2UiLCJnZXRHcm92ZU5vdGljZUNvbmZpZyIsImdldEdyb3ZlU2V0dGluZ3MiLCJjbGVhclBvbGljeUxpbWl0c0NhY2hlIiwiY2xlYXJSZW1vdGVNYW5hZ2VkU2V0dGluZ3NDYWNoZSIsImdldENsYXVkZUFJT0F1dGhUb2tlbnMiLCJyZW1vdmVBcGlLZXkiLCJjbGVhckJldGFzQ2FjaGVzIiwic2F2ZUdsb2JhbENvbmZpZyIsImdyYWNlZnVsU2h1dGRvd25TeW5jIiwiZ2V0U2VjdXJlU3RvcmFnZSIsImNsZWFyVG9vbFNjaGVtYUNhY2hlIiwicmVzZXRVc2VyQ2FjaGUiLCJwZXJmb3JtTG9nb3V0IiwiY2xlYXJPbmJvYXJkaW5nIiwiUHJvbWlzZSIsImZsdXNoVGVsZW1ldHJ5Iiwic2VjdXJlU3RvcmFnZSIsImRlbGV0ZSIsImNsZWFyQXV0aFJlbGF0ZWRDYWNoZXMiLCJjdXJyZW50IiwidXBkYXRlZCIsImhhc0NvbXBsZXRlZE9uYm9hcmRpbmciLCJzdWJzY3JpcHRpb25Ob3RpY2VDb3VudCIsImhhc0F2YWlsYWJsZVN1YnNjcmlwdGlvbiIsImN1c3RvbUFwaUtleVJlc3BvbnNlcyIsImFwcHJvdmVkIiwib2F1dGhBY2NvdW50IiwidW5kZWZpbmVkIiwiY2FjaGUiLCJjbGVhciIsImNhbGwiLCJSZWFjdE5vZGUiLCJtZXNzYWdlIiwic2V0VGltZW91dCJdLCJzb3VyY2VzIjpbImxvZ291dC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgeyBjbGVhclRydXN0ZWREZXZpY2VUb2tlbkNhY2hlIH0gZnJvbSAnLi4vLi4vYnJpZGdlL3RydXN0ZWREZXZpY2UuanMnXG5pbXBvcnQgeyBUZXh0IH0gZnJvbSAnLi4vLi4vaW5rLmpzJ1xuaW1wb3J0IHsgcmVmcmVzaEdyb3d0aEJvb2tBZnRlckF1dGhDaGFuZ2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hbmFseXRpY3MvZ3Jvd3RoYm9vay5qcydcbmltcG9ydCB7XG4gIGdldEdyb3ZlTm90aWNlQ29uZmlnLFxuICBnZXRHcm92ZVNldHRpbmdzLFxufSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9hcGkvZ3JvdmUuanMnXG5pbXBvcnQgeyBjbGVhclBvbGljeUxpbWl0c0NhY2hlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvcG9saWN5TGltaXRzL2luZGV4LmpzJ1xuLy8gZmx1c2hUZWxlbWV0cnkgaXMgbG9hZGVkIGxhemlseSB0byBhdm9pZCBwdWxsaW5nIGluIH4xLjFNQiBvZiBPcGVuVGVsZW1ldHJ5IGF0IHN0YXJ0dXBcbmltcG9ydCB7IGNsZWFyUmVtb3RlTWFuYWdlZFNldHRpbmdzQ2FjaGUgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9yZW1vdGVNYW5hZ2VkU2V0dGluZ3MvaW5kZXguanMnXG5pbXBvcnQgeyBnZXRDbGF1ZGVBSU9BdXRoVG9rZW5zLCByZW1vdmVBcGlLZXkgfSBmcm9tICcuLi8uLi91dGlscy9hdXRoLmpzJ1xuaW1wb3J0IHsgY2xlYXJCZXRhc0NhY2hlcyB9IGZyb20gJy4uLy4uL3V0aWxzL2JldGFzLmpzJ1xuaW1wb3J0IHsgc2F2ZUdsb2JhbENvbmZpZyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbmZpZy5qcydcbmltcG9ydCB7IGdyYWNlZnVsU2h1dGRvd25TeW5jIH0gZnJvbSAnLi4vLi4vdXRpbHMvZ3JhY2VmdWxTaHV0ZG93bi5qcydcbmltcG9ydCB7IGdldFNlY3VyZVN0b3JhZ2UgfSBmcm9tICcuLi8uLi91dGlscy9zZWN1cmVTdG9yYWdlL2luZGV4LmpzJ1xuaW1wb3J0IHsgY2xlYXJUb29sU2NoZW1hQ2FjaGUgfSBmcm9tICcuLi8uLi91dGlscy90b29sU2NoZW1hQ2FjaGUuanMnXG5pbXBvcnQgeyByZXNldFVzZXJDYWNoZSB9IGZyb20gJy4uLy4uL3V0aWxzL3VzZXIuanMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwZXJmb3JtTG9nb3V0KHtcbiAgY2xlYXJPbmJvYXJkaW5nID0gZmFsc2UsXG59KTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIEZsdXNoIHRlbGVtZXRyeSBCRUZPUkUgY2xlYXJpbmcgY3JlZGVudGlhbHMgdG8gcHJldmVudCBvcmcgZGF0YSBsZWFrYWdlXG4gIGNvbnN0IHsgZmx1c2hUZWxlbWV0cnkgfSA9IGF3YWl0IGltcG9ydChcbiAgICAnLi4vLi4vdXRpbHMvdGVsZW1ldHJ5L2luc3RydW1lbnRhdGlvbi5qcydcbiAgKVxuICBhd2FpdCBmbHVzaFRlbGVtZXRyeSgpXG5cbiAgYXdhaXQgcmVtb3ZlQXBpS2V5KClcblxuICAvLyBXaXBlIGFsbCBzZWN1cmUgc3RvcmFnZSBkYXRhIG9uIGxvZ291dFxuICBjb25zdCBzZWN1cmVTdG9yYWdlID0gZ2V0U2VjdXJlU3RvcmFnZSgpXG4gIHNlY3VyZVN0b3JhZ2UuZGVsZXRlKClcblxuICBhd2FpdCBjbGVhckF1dGhSZWxhdGVkQ2FjaGVzKClcbiAgc2F2ZUdsb2JhbENvbmZpZyhjdXJyZW50ID0+IHtcbiAgICBjb25zdCB1cGRhdGVkID0geyAuLi5jdXJyZW50IH1cbiAgICBpZiAoY2xlYXJPbmJvYXJkaW5nKSB7XG4gICAgICB1cGRhdGVkLmhhc0NvbXBsZXRlZE9uYm9hcmRpbmcgPSBmYWxzZVxuICAgICAgdXBkYXRlZC5zdWJzY3JpcHRpb25Ob3RpY2VDb3VudCA9IDBcbiAgICAgIHVwZGF0ZWQuaGFzQXZhaWxhYmxlU3Vic2NyaXB0aW9uID0gZmFsc2VcbiAgICAgIGlmICh1cGRhdGVkLmN1c3RvbUFwaUtleVJlc3BvbnNlcz8uYXBwcm92ZWQpIHtcbiAgICAgICAgdXBkYXRlZC5jdXN0b21BcGlLZXlSZXNwb25zZXMgPSB7XG4gICAgICAgICAgLi4udXBkYXRlZC5jdXN0b21BcGlLZXlSZXNwb25zZXMsXG4gICAgICAgICAgYXBwcm92ZWQ6IFtdLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZWQub2F1dGhBY2NvdW50ID0gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHVwZGF0ZWRcbiAgfSlcbn1cblxuLy8gY2xlYXJpbmcgYW55dGhpbmcgbWVtb2l6ZWQgdGhhdCBtdXN0IGJlIGludmFsaWRhdGVkIHdoZW4gdXNlci9zZXNzaW9uL2F1dGggY2hhbmdlc1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQXV0aFJlbGF0ZWRDYWNoZXMoKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIENsZWFyIHRoZSBPQXV0aCB0b2tlbiBjYWNoZVxuICBnZXRDbGF1ZGVBSU9BdXRoVG9rZW5zLmNhY2hlPy5jbGVhcj8uKClcbiAgY2xlYXJUcnVzdGVkRGV2aWNlVG9rZW5DYWNoZSgpXG4gIGNsZWFyQmV0YXNDYWNoZXMoKVxuICBjbGVhclRvb2xTY2hlbWFDYWNoZSgpXG5cbiAgLy8gQ2xlYXIgdXNlciBkYXRhIGNhY2hlIEJFRk9SRSBHcm93dGhCb29rIHJlZnJlc2ggc28gaXQgcGlja3MgdXAgZnJlc2ggY3JlZGVudGlhbHNcbiAgcmVzZXRVc2VyQ2FjaGUoKVxuICByZWZyZXNoR3Jvd3RoQm9va0FmdGVyQXV0aENoYW5nZSgpXG5cbiAgLy8gQ2xlYXIgR3JvdmUgY29uZmlnIGNhY2hlXG4gIGdldEdyb3ZlTm90aWNlQ29uZmlnLmNhY2hlPy5jbGVhcj8uKClcbiAgZ2V0R3JvdmVTZXR0aW5ncy5jYWNoZT8uY2xlYXI/LigpXG5cbiAgLy8gQ2xlYXIgcmVtb3RlbHkgbWFuYWdlZCBzZXR0aW5ncyBjYWNoZVxuICBhd2FpdCBjbGVhclJlbW90ZU1hbmFnZWRTZXR0aW5nc0NhY2hlKClcblxuICAvLyBDbGVhciBwb2xpY3kgbGltaXRzIGNhY2hlXG4gIGF3YWl0IGNsZWFyUG9saWN5TGltaXRzQ2FjaGUoKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbCgpOiBQcm9taXNlPFJlYWN0LlJlYWN0Tm9kZT4ge1xuICBhd2FpdCBwZXJmb3JtTG9nb3V0KHsgY2xlYXJPbmJvYXJkaW5nOiB0cnVlIH0pXG5cbiAgY29uc3QgbWVzc2FnZSA9IChcbiAgICA8VGV4dD5TdWNjZXNzZnVsbHkgbG9nZ2VkIG91dCBmcm9tIHlvdXIgQW50aHJvcGljIGFjY291bnQuPC9UZXh0PlxuICApXG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgZ3JhY2VmdWxTaHV0ZG93blN5bmMoMCwgJ2xvZ291dCcpXG4gIH0sIDIwMClcblxuICByZXR1cm4gbWVzc2FnZVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUtBLEtBQUssTUFBTSxPQUFPO0FBQzlCLFNBQVNDLDRCQUE0QixRQUFRLCtCQUErQjtBQUM1RSxTQUFTQyxJQUFJLFFBQVEsY0FBYztBQUNuQyxTQUFTQyxnQ0FBZ0MsUUFBUSx3Q0FBd0M7QUFDekYsU0FDRUMsb0JBQW9CLEVBQ3BCQyxnQkFBZ0IsUUFDWCw2QkFBNkI7QUFDcEMsU0FBU0Msc0JBQXNCLFFBQVEsc0NBQXNDO0FBQzdFO0FBQ0EsU0FBU0MsK0JBQStCLFFBQVEsK0NBQStDO0FBQy9GLFNBQVNDLHNCQUFzQixFQUFFQyxZQUFZLFFBQVEscUJBQXFCO0FBQzFFLFNBQVNDLGdCQUFnQixRQUFRLHNCQUFzQjtBQUN2RCxTQUFTQyxnQkFBZ0IsUUFBUSx1QkFBdUI7QUFDeEQsU0FBU0Msb0JBQW9CLFFBQVEsaUNBQWlDO0FBQ3RFLFNBQVNDLGdCQUFnQixRQUFRLG9DQUFvQztBQUNyRSxTQUFTQyxvQkFBb0IsUUFBUSxnQ0FBZ0M7QUFDckUsU0FBU0MsY0FBYyxRQUFRLHFCQUFxQjtBQUVwRCxPQUFPLGVBQWVDLGFBQWFBLENBQUM7RUFDbENDLGVBQWUsR0FBRztBQUNwQixDQUFDLENBQUMsRUFBRUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0VBQ2hCO0VBQ0EsTUFBTTtJQUFFQztFQUFlLENBQUMsR0FBRyxNQUFNLE1BQU0sQ0FDckMsMENBQ0YsQ0FBQztFQUNELE1BQU1BLGNBQWMsQ0FBQyxDQUFDO0VBRXRCLE1BQU1WLFlBQVksQ0FBQyxDQUFDOztFQUVwQjtFQUNBLE1BQU1XLGFBQWEsR0FBR1AsZ0JBQWdCLENBQUMsQ0FBQztFQUN4Q08sYUFBYSxDQUFDQyxNQUFNLENBQUMsQ0FBQztFQUV0QixNQUFNQyxzQkFBc0IsQ0FBQyxDQUFDO0VBQzlCWCxnQkFBZ0IsQ0FBQ1ksT0FBTyxJQUFJO0lBQzFCLE1BQU1DLE9BQU8sR0FBRztNQUFFLEdBQUdEO0lBQVEsQ0FBQztJQUM5QixJQUFJTixlQUFlLEVBQUU7TUFDbkJPLE9BQU8sQ0FBQ0Msc0JBQXNCLEdBQUcsS0FBSztNQUN0Q0QsT0FBTyxDQUFDRSx1QkFBdUIsR0FBRyxDQUFDO01BQ25DRixPQUFPLENBQUNHLHdCQUF3QixHQUFHLEtBQUs7TUFDeEMsSUFBSUgsT0FBTyxDQUFDSSxxQkFBcUIsRUFBRUMsUUFBUSxFQUFFO1FBQzNDTCxPQUFPLENBQUNJLHFCQUFxQixHQUFHO1VBQzlCLEdBQUdKLE9BQU8sQ0FBQ0kscUJBQXFCO1VBQ2hDQyxRQUFRLEVBQUU7UUFDWixDQUFDO01BQ0g7SUFDRjtJQUNBTCxPQUFPLENBQUNNLFlBQVksR0FBR0MsU0FBUztJQUNoQyxPQUFPUCxPQUFPO0VBQ2hCLENBQUMsQ0FBQztBQUNKOztBQUVBO0FBQ0EsT0FBTyxlQUFlRixzQkFBc0JBLENBQUEsQ0FBRSxFQUFFSixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDNUQ7RUFDQVYsc0JBQXNCLENBQUN3QixLQUFLLEVBQUVDLEtBQUssR0FBRyxDQUFDO0VBQ3ZDaEMsNEJBQTRCLENBQUMsQ0FBQztFQUM5QlMsZ0JBQWdCLENBQUMsQ0FBQztFQUNsQkksb0JBQW9CLENBQUMsQ0FBQzs7RUFFdEI7RUFDQUMsY0FBYyxDQUFDLENBQUM7RUFDaEJaLGdDQUFnQyxDQUFDLENBQUM7O0VBRWxDO0VBQ0FDLG9CQUFvQixDQUFDNEIsS0FBSyxFQUFFQyxLQUFLLEdBQUcsQ0FBQztFQUNyQzVCLGdCQUFnQixDQUFDMkIsS0FBSyxFQUFFQyxLQUFLLEdBQUcsQ0FBQzs7RUFFakM7RUFDQSxNQUFNMUIsK0JBQStCLENBQUMsQ0FBQzs7RUFFdkM7RUFDQSxNQUFNRCxzQkFBc0IsQ0FBQyxDQUFDO0FBQ2hDO0FBRUEsT0FBTyxlQUFlNEIsSUFBSUEsQ0FBQSxDQUFFLEVBQUVoQixPQUFPLENBQUNsQixLQUFLLENBQUNtQyxTQUFTLENBQUMsQ0FBQztFQUNyRCxNQUFNbkIsYUFBYSxDQUFDO0lBQUVDLGVBQWUsRUFBRTtFQUFLLENBQUMsQ0FBQztFQUU5QyxNQUFNbUIsT0FBTyxHQUNYLENBQUMsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLElBQUksQ0FDakU7RUFFREMsVUFBVSxDQUFDLE1BQU07SUFDZnpCLG9CQUFvQixDQUFDLENBQUMsRUFBRSxRQUFRLENBQUM7RUFDbkMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztFQUVQLE9BQU93QixPQUFPO0FBQ2hCIiwiaWdub3JlTGlzdCI6W119