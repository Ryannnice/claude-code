// 引入 getAllowedSettingSources，将 ../../bootstrap/state.js 中已经封装好的能力接到本文件流程里。
import { getAllowedSettingSources } from '../../bootstrap/state.js'

/**
 * All possible sources where settings can come from
 * Order matters - later sources override earlier ones
 */
// SETTING_SOURCES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const SETTING_SOURCES = [
  // User settings (global)
  'userSettings',

  // Project settings (shared per-directory)
  'projectSettings',

  // Local settings (gitignored)
  'localSettings',

  // Flag settings (from --settings flag)
  'flagSettings',

  // Policy settings (managed-settings.json or remote settings from API)
  'policySettings',
] as const

// SettingSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SettingSource = (typeof SETTING_SOURCES)[number]

// getSettingSourceName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingSourceName(source: SettingSource): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'user'`，作为共享工具这次计算的结果。
      return 'user'
    case 'projectSettings':
      // 返回 `'project'`，作为共享工具这次计算的结果。
      return 'project'
    case 'localSettings':
      // 返回 `'project, gitignored'`，作为共享工具这次计算的结果。
      return 'project, gitignored'
    case 'flagSettings':
      // 返回 `'cli flag'`，作为共享工具这次计算的结果。
      return 'cli flag'
    case 'policySettings':
      // 返回 `'managed'`，作为共享工具这次计算的结果。
      return 'managed'
  }
}

/**
 * Get short display name for a setting source (capitalized, for context/skills UI)
 * @param source The setting source or 'plugin'/'built-in'
 * @returns Short capitalized display name like 'User', 'Project', 'Plugin'
 */
// getSourceDisplayName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSourceDisplayName(
  source: SettingSource | 'plugin' | 'built-in',
): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'User'`，作为共享工具这次计算的结果。
      return 'User'
    case 'projectSettings':
      // 返回 `'Project'`，作为共享工具这次计算的结果。
      return 'Project'
    case 'localSettings':
      // 返回 `'Local'`，作为共享工具这次计算的结果。
      return 'Local'
    case 'flagSettings':
      // 返回 `'Flag'`，作为共享工具这次计算的结果。
      return 'Flag'
    case 'policySettings':
      // 返回 `'Managed'`，作为共享工具这次计算的结果。
      return 'Managed'
    case 'plugin':
      // 返回 `'Plugin'`，作为共享工具这次计算的结果。
      return 'Plugin'
    case 'built-in':
      // 返回 `'Built-in'`，作为共享工具这次计算的结果。
      return 'Built-in'
  }
}

/**
 * Get display name for a setting or permission rule source (lowercase, for inline use)
 * @param source The setting source or permission rule source
 * @returns Display name for the source in lowercase
 */
// getSettingSourceDisplayNameLowercase 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingSourceDisplayNameLowercase(
  source: SettingSource | 'cliArg' | 'command' | 'session',
): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'user settings'`，作为共享工具这次计算的结果。
      return 'user settings'
    case 'projectSettings':
      // 返回 `'shared project settings'`，作为共享工具这次计算的结果。
      return 'shared project settings'
    case 'localSettings':
      // 返回 `'project local settings'`，作为共享工具这次计算的结果。
      return 'project local settings'
    case 'flagSettings':
      // 返回 `'command line arguments'`，作为共享工具这次计算的结果。
      return 'command line arguments'
    case 'policySettings':
      // 返回 `'enterprise managed settings'`，作为共享工具这次计算的结果。
      return 'enterprise managed settings'
    case 'cliArg':
      // 返回 `'CLI argument'`，作为共享工具这次计算的结果。
      return 'CLI argument'
    case 'command':
      // 返回 `'command configuration'`，作为共享工具这次计算的结果。
      return 'command configuration'
    case 'session':
      // 返回 `'current session'`，作为共享工具这次计算的结果。
      return 'current session'
  }
}

/**
 * Get display name for a setting or permission rule source (capitalized, for UI labels)
 * @param source The setting source or permission rule source
 * @returns Display name for the source with first letter capitalized
 */
// getSettingSourceDisplayNameCapitalized 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSettingSourceDisplayNameCapitalized(
  source: SettingSource | 'cliArg' | 'command' | 'session',
): string {
  // 按照 source 的取值选择共享工具的具体处理分支。
  switch (source) {
    case 'userSettings':
      // 返回 `'User settings'`，作为共享工具这次计算的结果。
      return 'User settings'
    case 'projectSettings':
      // 返回 `'Shared project settings'`，作为共享工具这次计算的结果。
      return 'Shared project settings'
    case 'localSettings':
      // 返回 `'Project local settings'`，作为共享工具这次计算的结果。
      return 'Project local settings'
    case 'flagSettings':
      // 返回 `'Command line arguments'`，作为共享工具这次计算的结果。
      return 'Command line arguments'
    case 'policySettings':
      // 返回 `'Enterprise managed settings'`，作为共享工具这次计算的结果。
      return 'Enterprise managed settings'
    case 'cliArg':
      // 返回 `'CLI argument'`，作为共享工具这次计算的结果。
      return 'CLI argument'
    case 'command':
      // 返回 `'Command configuration'`，作为共享工具这次计算的结果。
      return 'Command configuration'
    case 'session':
      // 返回 `'Current session'`，作为共享工具这次计算的结果。
      return 'Current session'
  }
}

/**
 * Parse the --setting-sources CLI flag into SettingSource array
 * @param flag Comma-separated string like "user,project,local"
 * @returns Array of SettingSource values
 */
// parseSettingSourcesFlag 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSettingSourcesFlag(flag: string): SettingSource[] {
  // 满足 `flag === ''` 时，共享工具执行该分支。
  if (flag === '') return []

  // names 集合格式化`flag.split`，供共享工具后续处理使用。
  const names = flag.split(',').map(s => s.trim())
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: SettingSource[] = []

  // 按顺序遍历 `names` 中的名称，逐个交给共享工具处理。
  for (const name of names) {
    // 按照 name 的取值选择共享工具的具体处理分支。
    switch (name) {
      case 'user':
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push('userSettings')
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'project':
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push('projectSettings')
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      case 'local':
        // 结果追加新条目，保持收集顺序与输入顺序一致。
        result.push('localSettings')
        // 结束这个分支或循环，避免共享工具继续落入后续路径。
        break
      default:
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Invalid setting source: ${name}. Valid options are: user, project, local`,
        )
    }
  }

  // 返回 `result`，作为共享工具这次计算的结果。
  return result
}

/**
 * Get enabled setting sources with policy/flag always included
 * @returns Array of enabled SettingSource values
 */
// getEnabledSettingSources 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEnabledSettingSources(): SettingSource[] {
  // allowed读取`getAllowedSettingSources`，供共享工具后续处理使用。
  const allowed = getAllowedSettingSources()

  // Always include policy and flag settings
  // 结果 命名 `new Set<SettingSource>(allowed)`，让后续代码直接表达这个值的用途。
  const result = new Set<SettingSource>(allowed)
  // 调用 result.add，触发共享工具此处需要的副作用。
  result.add('policySettings')
  // 调用 result.add，触发共享工具此处需要的副作用。
  result.add('flagSettings')
  // 返回 `Array.from(result)`，作为共享工具这次计算的结果。
  return Array.from(result)
}

/**
 * Check if a specific source is enabled
 * @param source The source to check
 * @returns true if the source should be loaded
 */
// isSettingSourceEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSettingSourceEnabled(source: SettingSource): boolean {
  // enabled读取`getEnabledSettingSources`，供共享工具后续处理使用。
  const enabled = getEnabledSettingSources()
  // 返回 `enabled.includes(source)`，作为共享工具这次计算的结果。
  return enabled.includes(source)
}

/**
 * Editable setting sources (excludes policySettings and flagSettings which are read-only)
 */
// EditableSettingSource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type EditableSettingSource = Exclude<
  SettingSource,
  'policySettings' | 'flagSettings'
>

/**
 * List of sources where permission rules can be saved, in display order.
 * Used by permission-rule and hook-save UIs to present source options.
 */
// SOURCES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const SOURCES = [
  'localSettings',
  'projectSettings',
  'userSettings',
] as const satisfies readonly EditableSettingSource[]

/**
 * The JSON Schema URL for Claude Code settings
 * You can edit the contents at https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/claude-code-settings.json
 */
// CLAUDE_CODE_SETTINGS_SCHEMA_URL 先占位，稍后的条件分支会根据实际输入补齐它。
export const CLAUDE_CODE_SETTINGS_SCHEMA_URL =
  'https://json.schemastore.org/claude-code-settings.json'
