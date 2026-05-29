/**
 * Plugin policy checks backed by managed settings (policySettings).
 *
 * Kept as a leaf module (only imports settings) to avoid circular dependencies
 * — marketplaceHelpers.ts imports marketplaceManager.ts which transitively
 * reaches most of the plugin subsystem.
 */

// 引入 getSettingsForSource，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsForSource } from '../settings/settings.js'

/**
 * Check if a plugin is force-disabled by org policy (managed-settings.json).
 * Policy-blocked plugins cannot be installed or enabled by the user at any
 * scope. Used as the single source of truth for policy blocking across the
 * install chokepoint, enable op, and UI filters.
 */
// isPluginBlockedByPolicy 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPluginBlockedByPolicy(pluginId: string): boolean {
  // policyEnabled读取`getSettingsForSource`，供插件管理后续处理使用。
  const policyEnabled = getSettingsForSource('policySettings')?.enabledPlugins
  // 返回 `policyEnabled?.[pluginId] === false`，作为插件管理这次计算的结果。
  return policyEnabled?.[pluginId] === false
}
