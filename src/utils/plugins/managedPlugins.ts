// 引入 getSettingsForSource，将 ../settings/settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsForSource } from '../settings/settings.js'

/**
 * Plugin names locked by org policy (policySettings.enabledPlugins).
 *
 * Returns null when managed settings declare no plugin entries (common
 * case — no policy in effect).
 */
// getManagedPluginNames 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getManagedPluginNames(): Set<string> | null {
  // enabledPlugins 插件数据读取`getSettingsForSource`，供插件管理后续处理使用。
  const enabledPlugins = getSettingsForSource('policySettings')?.enabledPlugins
  // enabledPlugins 插件数据缺失时直接走兜底路径，避免插件管理使用无效输入。
  if (!enabledPlugins) {
    // 返回 `null`，作为插件管理这次计算的结果。
    return null
  }
  // names 集合构建`new Set<string>()`，供后续判断或组装使用。
  const names = new Set<string>()
  // 循环处理 `const [pluginId, value] of Object.entries(enabledPlugins)`，让插件管理把同类条目按顺序走完。
  for (const [pluginId, value] of Object.entries(enabledPlugins)) {
    // Only plugin@marketplace boolean entries (true OR false) are
    // protected. Legacy owner/repo array form is not.
    // `typeof value` 与 `'boolean' || !pluginId.includes...` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof value !== 'boolean' || !pluginId.includes('@')) {
      // 跳过当前项，继续处理插件管理中的下一轮循环。
      continue
    }
    // 名称格式化`pluginId.split`，供插件管理后续处理使用。
    const name = pluginId.split('@')[0]
    // 满足 `name` 时，插件管理执行该分支。
    if (name) {
      // 调用 names.add，触发插件管理此处需要的副作用。
      names.add(name)
    }
  }
  // 返回 `names.size > 0 ? names : null`，作为插件管理这次计算的结果。
  return names.size > 0 ? names : null
}
