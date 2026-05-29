// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import type {
  EditableSettingSource,
  SettingSource,
} from '../settings/constants.js'
// 整理这一组导入，让插件管理后续逻辑可以直接复用这些外部能力。
import {
  ALLOWED_OFFICIAL_MARKETPLACE_NAMES,
  type PluginScope,
} from './schemas.js'

/**
 * Extended scope type that includes 'flag' for session-only plugins.
 * 'flag' scope is NOT persisted to installed_plugins.json.
 */
// ExtendedPluginScope 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExtendedPluginScope = PluginScope | 'flag'

/**
 * Scopes that are persisted to installed_plugins.json.
 * Excludes 'flag' which is session-only.
 */
// PersistablePluginScope 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type PersistablePluginScope = Exclude<ExtendedPluginScope, 'flag'>

/**
 * Map from SettingSource to plugin scope.
 * Note: flagSettings maps to 'flag' which is session-only and not persisted.
 */
// SETTING_SOURCE_TO_SCOPE 集中保存插件工具 plugin Identifier要一起传递的字段。
export const SETTING_SOURCE_TO_SCOPE = {
  policySettings: 'managed',
  userSettings: 'user',
  projectSettings: 'project',
  localSettings: 'local',
  flagSettings: 'flag',
} as const satisfies Record<SettingSource, ExtendedPluginScope>

/**
 * Parsed plugin identifier with name and optional marketplace
 */
// ParsedPluginIdentifier 固化插件管理里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedPluginIdentifier = {
  name: string
  marketplace?: string
}

/**
 * Parse a plugin identifier string into name and marketplace components
 * @param plugin The plugin identifier (name or name@marketplace)
 * @returns Parsed plugin name and optional marketplace
 *
 * Note: Only the first '@' is used as separator. If the input contains multiple '@' symbols
 * (e.g., "plugin@market@place"), everything after the second '@' is ignored.
 * This is intentional as marketplace names should not contain '@'.
 */
// parsePluginIdentifier 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parsePluginIdentifier(plugin: string): ParsedPluginIdentifier {
  // 满足 `plugin.includes('@')` 时，插件管理执行该分支。
  if (plugin.includes('@')) {
    // 片段列表格式化`plugin.split`，供插件管理后续处理使用。
    const parts = plugin.split('@')
    // 返回结构化结果，集中表达插件管理已经整理出的状态。
    return { name: parts[0] || '', marketplace: parts[1] }
  }
  // 返回结构化结果，集中表达插件管理已经整理出的状态。
  return { name: plugin }
}

/**
 * Build a plugin ID from name and marketplace
 * @param name The plugin name
 * @param marketplace Optional marketplace name
 * @returns Plugin ID in format "name" or "name@marketplace"
 */
// buildPluginId 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildPluginId(name: string, marketplace?: string): string {
  // 返回 `marketplace ? `${name}@${marketplace}` : name`，作为插件管理这次计算的结果。
  return marketplace ? `${name}@${marketplace}` : name
}

/**
 * Check if a marketplace name is an official (Anthropic-controlled) marketplace.
 * Used for telemetry redaction — official plugin identifiers are safe to log to
 * general-access additional_metadata; third-party identifiers go only to the
 * PII-tagged _PROTO_* BQ columns.
 */
// isOfficialMarketplaceName 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOfficialMarketplaceName(
  marketplace: string | undefined,
): boolean {
  // 返回 `(`，作为插件管理这次计算的结果。
  return (
    marketplace !== undefined &&
    ALLOWED_OFFICIAL_MARKETPLACE_NAMES.has(marketplace.toLowerCase())
  )
}

/**
 * Map from installable plugin scope to editable setting source.
 * This is the inverse of SETTING_SOURCE_TO_SCOPE for editable scopes only.
 * Note: 'managed' scope cannot be installed to, so it's not included here.
 */
// SCOPE_TO_EDITABLE_SOURCE 先占位，稍后的条件分支会根据实际输入补齐它。
const SCOPE_TO_EDITABLE_SOURCE: Record<
  Exclude<PluginScope, 'managed'>,
  EditableSettingSource
> = {
  user: 'userSettings',
  project: 'projectSettings',
  local: 'localSettings',
}

/**
 * Convert a plugin scope to its corresponding editable setting source
 * @param scope The plugin installation scope
 * @returns The corresponding setting source for reading/writing settings
 * @throws Error if scope is 'managed' (cannot install plugins to managed scope)
 */
// scopeToSettingSource 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function scopeToSettingSource(
  scope: PluginScope,
): EditableSettingSource {
  // 当 `scope` 匹配 `'managed'` 时，插件管理执行对应分支。
  if (scope === 'managed') {
    // 抛出 new Error('Cannot install plugins to managed scope')，阻止插件管理在无效状态下继续运行。
    throw new Error('Cannot install plugins to managed scope')
  }
  // 返回 `SCOPE_TO_EDITABLE_SOURCE[scope]`，作为插件管理这次计算的结果。
  return SCOPE_TO_EDITABLE_SOURCE[scope]
}

/**
 * Convert an editable setting source to its corresponding plugin scope.
 * Derived from SETTING_SOURCE_TO_SCOPE to maintain a single source of truth.
 * @param source The setting source
 * @returns The corresponding plugin scope
 */
// settingSourceToScope 封装插件工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function settingSourceToScope(
  source: EditableSettingSource,
): Exclude<PluginScope, 'managed'> {
  // 返回 `SETTING_SOURCE_TO_SCOPE[source] as Exclude<PluginScope, 'managed'>`，作为插件管理这次计算的结果。
  return SETTING_SOURCE_TO_SCOPE[source] as Exclude<PluginScope, 'managed'>
}
