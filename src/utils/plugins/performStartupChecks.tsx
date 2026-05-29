// 接入 performBackgroundPluginInstallations 服务层能力，把外部通信或共享状态交给 ../../services/plugins/PluginInstallationManager.js 处理。
import { performBackgroundPluginInstallations } from '../../services/plugins/PluginInstallationManager.js';
// 类型依赖 { AppState } 来自 ../../state/AppState.js，用于校准插件管理的数据契约。
import type { AppState } from '../../state/AppState.js';
// 引入 checkHasTrustDialogAccepted，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { checkHasTrustDialogAccepted } from '../config.js';
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js';
// 引入 clearMarketplacesCache、registerSeedMarketplaces，将 ./marketplaceManager.js 中已经封装好的能力接到本文件流程里。
import { clearMarketplacesCache, registerSeedMarketplaces } from './marketplaceManager.js';
// 引入 clearPluginCache，将 ./pluginLoader.js 中已经封装好的能力接到本文件流程里。
import { clearPluginCache } from './pluginLoader.js';
// SetAppState 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
type SetAppState = (f: (prevState: AppState) => AppState) => void;

/**
 * Perform plugin startup checks and initiate background installations
 *
 * This function starts background installation of marketplaces and plugins
 * from trusted sources (repository and user settings) without blocking startup.
 * Installation progress and errors are tracked in AppState and shown via notifications.
 *
 * SECURITY: This function is only called from REPL.tsx after the "trust this folder"
 * dialog has been confirmed. The trust dialog in cli.tsx blocks all execution until
 * the user explicitly trusts the current working directory, ensuring that plugin
 * installations only happen with user consent. This prevents malicious repositories
 * from automatically installing plugins without user approval.
 *
 * @param setAppState Function to update app state with installation progress
 */
// performStartupChecks 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function performStartupChecks(setAppState: SetAppState): Promise<void> {
  // 记录插件管理运行诊断，方便排查异常路径或性能问题。
  logForDebugging('performStartupChecks called');

  // Check if the current directory has been trusted
  // 满足 `!checkHasTrustDialogAccepted()` 时，插件管理执行该分支。
  if (!checkHasTrustDialogAccepted()) {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Trust not accepted for current directory - skipping plugin installations');
    // 插件工具 perform Startup Checks在这里结束当前路径，避免继续执行不适用的后续分支。
    return;
  }
  // 保护这一段可能失败的插件管理操作，确保异常能进入相邻错误处理。
  try {
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Starting background plugin installations');

    // Register seed marketplaces (CLAUDE_CODE_PLUGIN_SEED_DIR) before diffing.
    // Idempotent; no-op if seed not configured. Without this, background install
    // would see seed marketplaces as missing → clone → defeats seed's purpose.
    //
    // If registration changed state, clear caches so earlier plugin-load passes
    // (e.g. getAllMcpConfigs during REPL init) don't keep stale "marketplace
    // not found" results.
    // seedChanged保存`registerSeedMarketplaces`，供插件管理后续处理使用。
    const seedChanged = await registerSeedMarketplaces();
    // 满足 `seedChanged` 时，插件管理执行该分支。
    if (seedChanged) {
      // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
      clearMarketplacesCache();
      // 清理相关缓存，确保插件管理下一次读取时重新加载最新数据。
      clearPluginCache('performStartupChecks: seed marketplaces changed');
      // Set needsRefresh so useManagePlugins notifies the user to run
      // /reload-plugins. Without this signal, the initial plugin-load
      // (which raced and cached "marketplace not found") would persist
      // until the user manually reloads.
      // setAppState 写入新的状态值，使插件管理后续读取保持一致。
      setAppState(prev => {
        // 满足 `prev.plugins.needsRefresh` 时，插件管理执行该分支。
        if (prev.plugins.needsRefresh) return prev;
        // 返回结构化结果，集中表达插件管理已经整理出的状态。
        return {
          ...prev,
          plugins: {
            ...prev.plugins,
            needsRefresh: true
          }
        };
      });
    }

    // Start background installations without waiting
    // This will update AppState as installations progress
    // 等待 `performBackgroundPluginInstallations(setAppState)` 完成，再继续插件工具 perform Startup Checks的异步流程。
    await performBackgroundPluginInstallations(setAppState);
  } catch (error) {
    // Even if something fails here, don't block startup
    // 记录插件管理运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error initiating background plugin installations: ${error}`);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJwZXJmb3JtQmFja2dyb3VuZFBsdWdpbkluc3RhbGxhdGlvbnMiLCJBcHBTdGF0ZSIsImNoZWNrSGFzVHJ1c3REaWFsb2dBY2NlcHRlZCIsImxvZ0ZvckRlYnVnZ2luZyIsImNsZWFyTWFya2V0cGxhY2VzQ2FjaGUiLCJyZWdpc3RlclNlZWRNYXJrZXRwbGFjZXMiLCJjbGVhclBsdWdpbkNhY2hlIiwiU2V0QXBwU3RhdGUiLCJmIiwicHJldlN0YXRlIiwicGVyZm9ybVN0YXJ0dXBDaGVja3MiLCJzZXRBcHBTdGF0ZSIsIlByb21pc2UiLCJzZWVkQ2hhbmdlZCIsInByZXYiLCJwbHVnaW5zIiwibmVlZHNSZWZyZXNoIiwiZXJyb3IiXSwic291cmNlcyI6WyJwZXJmb3JtU3RhcnR1cENoZWNrcy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGVyZm9ybUJhY2tncm91bmRQbHVnaW5JbnN0YWxsYXRpb25zIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvcGx1Z2lucy9QbHVnaW5JbnN0YWxsYXRpb25NYW5hZ2VyLmpzJ1xuaW1wb3J0IHR5cGUgeyBBcHBTdGF0ZSB9IGZyb20gJy4uLy4uL3N0YXRlL0FwcFN0YXRlLmpzJ1xuaW1wb3J0IHsgY2hlY2tIYXNUcnVzdERpYWxvZ0FjY2VwdGVkIH0gZnJvbSAnLi4vY29uZmlnLmpzJ1xuaW1wb3J0IHsgbG9nRm9yRGVidWdnaW5nIH0gZnJvbSAnLi4vZGVidWcuanMnXG5pbXBvcnQge1xuICBjbGVhck1hcmtldHBsYWNlc0NhY2hlLFxuICByZWdpc3RlclNlZWRNYXJrZXRwbGFjZXMsXG59IGZyb20gJy4vbWFya2V0cGxhY2VNYW5hZ2VyLmpzJ1xuaW1wb3J0IHsgY2xlYXJQbHVnaW5DYWNoZSB9IGZyb20gJy4vcGx1Z2luTG9hZGVyLmpzJ1xuXG50eXBlIFNldEFwcFN0YXRlID0gKGY6IChwcmV2U3RhdGU6IEFwcFN0YXRlKSA9PiBBcHBTdGF0ZSkgPT4gdm9pZFxuXG4vKipcbiAqIFBlcmZvcm0gcGx1Z2luIHN0YXJ0dXAgY2hlY2tzIGFuZCBpbml0aWF0ZSBiYWNrZ3JvdW5kIGluc3RhbGxhdGlvbnNcbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHN0YXJ0cyBiYWNrZ3JvdW5kIGluc3RhbGxhdGlvbiBvZiBtYXJrZXRwbGFjZXMgYW5kIHBsdWdpbnNcbiAqIGZyb20gdHJ1c3RlZCBzb3VyY2VzIChyZXBvc2l0b3J5IGFuZCB1c2VyIHNldHRpbmdzKSB3aXRob3V0IGJsb2NraW5nIHN0YXJ0dXAuXG4gKiBJbnN0YWxsYXRpb24gcHJvZ3Jlc3MgYW5kIGVycm9ycyBhcmUgdHJhY2tlZCBpbiBBcHBTdGF0ZSBhbmQgc2hvd24gdmlhIG5vdGlmaWNhdGlvbnMuXG4gKlxuICogU0VDVVJJVFk6IFRoaXMgZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgZnJvbSBSRVBMLnRzeCBhZnRlciB0aGUgXCJ0cnVzdCB0aGlzIGZvbGRlclwiXG4gKiBkaWFsb2cgaGFzIGJlZW4gY29uZmlybWVkLiBUaGUgdHJ1c3QgZGlhbG9nIGluIGNsaS50c3ggYmxvY2tzIGFsbCBleGVjdXRpb24gdW50aWxcbiAqIHRoZSB1c2VyIGV4cGxpY2l0bHkgdHJ1c3RzIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LCBlbnN1cmluZyB0aGF0IHBsdWdpblxuICogaW5zdGFsbGF0aW9ucyBvbmx5IGhhcHBlbiB3aXRoIHVzZXIgY29uc2VudC4gVGhpcyBwcmV2ZW50cyBtYWxpY2lvdXMgcmVwb3NpdG9yaWVzXG4gKiBmcm9tIGF1dG9tYXRpY2FsbHkgaW5zdGFsbGluZyBwbHVnaW5zIHdpdGhvdXQgdXNlciBhcHByb3ZhbC5cbiAqXG4gKiBAcGFyYW0gc2V0QXBwU3RhdGUgRnVuY3Rpb24gdG8gdXBkYXRlIGFwcCBzdGF0ZSB3aXRoIGluc3RhbGxhdGlvbiBwcm9ncmVzc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGVyZm9ybVN0YXJ0dXBDaGVja3MoXG4gIHNldEFwcFN0YXRlOiBTZXRBcHBTdGF0ZSxcbik6IFByb21pc2U8dm9pZD4ge1xuICBsb2dGb3JEZWJ1Z2dpbmcoJ3BlcmZvcm1TdGFydHVwQ2hlY2tzIGNhbGxlZCcpXG5cbiAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgZGlyZWN0b3J5IGhhcyBiZWVuIHRydXN0ZWRcbiAgaWYgKCFjaGVja0hhc1RydXN0RGlhbG9nQWNjZXB0ZWQoKSkge1xuICAgIGxvZ0ZvckRlYnVnZ2luZyhcbiAgICAgICdUcnVzdCBub3QgYWNjZXB0ZWQgZm9yIGN1cnJlbnQgZGlyZWN0b3J5IC0gc2tpcHBpbmcgcGx1Z2luIGluc3RhbGxhdGlvbnMnLFxuICAgIClcbiAgICByZXR1cm5cbiAgfVxuXG4gIHRyeSB7XG4gICAgbG9nRm9yRGVidWdnaW5nKCdTdGFydGluZyBiYWNrZ3JvdW5kIHBsdWdpbiBpbnN0YWxsYXRpb25zJylcblxuICAgIC8vIFJlZ2lzdGVyIHNlZWQgbWFya2V0cGxhY2VzIChDTEFVREVfQ09ERV9QTFVHSU5fU0VFRF9ESVIpIGJlZm9yZSBkaWZmaW5nLlxuICAgIC8vIElkZW1wb3RlbnQ7IG5vLW9wIGlmIHNlZWQgbm90IGNvbmZpZ3VyZWQuIFdpdGhvdXQgdGhpcywgYmFja2dyb3VuZCBpbnN0YWxsXG4gICAgLy8gd291bGQgc2VlIHNlZWQgbWFya2V0cGxhY2VzIGFzIG1pc3Npbmcg4oaSIGNsb25lIOKGkiBkZWZlYXRzIHNlZWQncyBwdXJwb3NlLlxuICAgIC8vXG4gICAgLy8gSWYgcmVnaXN0cmF0aW9uIGNoYW5nZWQgc3RhdGUsIGNsZWFyIGNhY2hlcyBzbyBlYXJsaWVyIHBsdWdpbi1sb2FkIHBhc3Nlc1xuICAgIC8vIChlLmcuIGdldEFsbE1jcENvbmZpZ3MgZHVyaW5nIFJFUEwgaW5pdCkgZG9uJ3Qga2VlcCBzdGFsZSBcIm1hcmtldHBsYWNlXG4gICAgLy8gbm90IGZvdW5kXCIgcmVzdWx0cy5cbiAgICBjb25zdCBzZWVkQ2hhbmdlZCA9IGF3YWl0IHJlZ2lzdGVyU2VlZE1hcmtldHBsYWNlcygpXG4gICAgaWYgKHNlZWRDaGFuZ2VkKSB7XG4gICAgICBjbGVhck1hcmtldHBsYWNlc0NhY2hlKClcbiAgICAgIGNsZWFyUGx1Z2luQ2FjaGUoJ3BlcmZvcm1TdGFydHVwQ2hlY2tzOiBzZWVkIG1hcmtldHBsYWNlcyBjaGFuZ2VkJylcbiAgICAgIC8vIFNldCBuZWVkc1JlZnJlc2ggc28gdXNlTWFuYWdlUGx1Z2lucyBub3RpZmllcyB0aGUgdXNlciB0byBydW5cbiAgICAgIC8vIC9yZWxvYWQtcGx1Z2lucy4gV2l0aG91dCB0aGlzIHNpZ25hbCwgdGhlIGluaXRpYWwgcGx1Z2luLWxvYWRcbiAgICAgIC8vICh3aGljaCByYWNlZCBhbmQgY2FjaGVkIFwibWFya2V0cGxhY2Ugbm90IGZvdW5kXCIpIHdvdWxkIHBlcnNpc3RcbiAgICAgIC8vIHVudGlsIHRoZSB1c2VyIG1hbnVhbGx5IHJlbG9hZHMuXG4gICAgICBzZXRBcHBTdGF0ZShwcmV2ID0+IHtcbiAgICAgICAgaWYgKHByZXYucGx1Z2lucy5uZWVkc1JlZnJlc2gpIHJldHVybiBwcmV2XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICBwbHVnaW5zOiB7IC4uLnByZXYucGx1Z2lucywgbmVlZHNSZWZyZXNoOiB0cnVlIH0sXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gU3RhcnQgYmFja2dyb3VuZCBpbnN0YWxsYXRpb25zIHdpdGhvdXQgd2FpdGluZ1xuICAgIC8vIFRoaXMgd2lsbCB1cGRhdGUgQXBwU3RhdGUgYXMgaW5zdGFsbGF0aW9ucyBwcm9ncmVzc1xuICAgIGF3YWl0IHBlcmZvcm1CYWNrZ3JvdW5kUGx1Z2luSW5zdGFsbGF0aW9ucyhzZXRBcHBTdGF0ZSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBFdmVuIGlmIHNvbWV0aGluZyBmYWlscyBoZXJlLCBkb24ndCBibG9jayBzdGFydHVwXG4gICAgbG9nRm9yRGVidWdnaW5nKFxuICAgICAgYEVycm9yIGluaXRpYXRpbmcgYmFja2dyb3VuZCBwbHVnaW4gaW5zdGFsbGF0aW9uczogJHtlcnJvcn1gLFxuICAgIClcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoiQUFBQSxTQUFTQSxvQ0FBb0MsUUFBUSxxREFBcUQ7QUFDMUcsY0FBY0MsUUFBUSxRQUFRLHlCQUF5QjtBQUN2RCxTQUFTQywyQkFBMkIsUUFBUSxjQUFjO0FBQzFELFNBQVNDLGVBQWUsUUFBUSxhQUFhO0FBQzdDLFNBQ0VDLHNCQUFzQixFQUN0QkMsd0JBQXdCLFFBQ25CLHlCQUF5QjtBQUNoQyxTQUFTQyxnQkFBZ0IsUUFBUSxtQkFBbUI7QUFFcEQsS0FBS0MsV0FBVyxHQUFHLENBQUNDLENBQUMsRUFBRSxDQUFDQyxTQUFTLEVBQUVSLFFBQVEsRUFBRSxHQUFHQSxRQUFRLEVBQUUsR0FBRyxJQUFJOztBQUVqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPLGVBQWVTLG9CQUFvQkEsQ0FDeENDLFdBQVcsRUFBRUosV0FBVyxDQUN6QixFQUFFSyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDZlQsZUFBZSxDQUFDLDZCQUE2QixDQUFDOztFQUU5QztFQUNBLElBQUksQ0FBQ0QsMkJBQTJCLENBQUMsQ0FBQyxFQUFFO0lBQ2xDQyxlQUFlLENBQ2IsMEVBQ0YsQ0FBQztJQUNEO0VBQ0Y7RUFFQSxJQUFJO0lBQ0ZBLGVBQWUsQ0FBQywwQ0FBMEMsQ0FBQzs7SUFFM0Q7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxNQUFNVSxXQUFXLEdBQUcsTUFBTVIsd0JBQXdCLENBQUMsQ0FBQztJQUNwRCxJQUFJUSxXQUFXLEVBQUU7TUFDZlQsc0JBQXNCLENBQUMsQ0FBQztNQUN4QkUsZ0JBQWdCLENBQUMsaURBQWlELENBQUM7TUFDbkU7TUFDQTtNQUNBO01BQ0E7TUFDQUssV0FBVyxDQUFDRyxJQUFJLElBQUk7UUFDbEIsSUFBSUEsSUFBSSxDQUFDQyxPQUFPLENBQUNDLFlBQVksRUFBRSxPQUFPRixJQUFJO1FBQzFDLE9BQU87VUFDTCxHQUFHQSxJQUFJO1VBQ1BDLE9BQU8sRUFBRTtZQUFFLEdBQUdELElBQUksQ0FBQ0MsT0FBTztZQUFFQyxZQUFZLEVBQUU7VUFBSztRQUNqRCxDQUFDO01BQ0gsQ0FBQyxDQUFDO0lBQ0o7O0lBRUE7SUFDQTtJQUNBLE1BQU1oQixvQ0FBb0MsQ0FBQ1csV0FBVyxDQUFDO0VBQ3pELENBQUMsQ0FBQyxPQUFPTSxLQUFLLEVBQUU7SUFDZDtJQUNBZCxlQUFlLENBQ2IscURBQXFEYyxLQUFLLEVBQzVELENBQUM7RUFDSDtBQUNGIiwiaWdub3JlTGlzdCI6W119