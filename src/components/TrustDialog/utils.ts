// 类型依赖 { PermissionRule } 来自 src/utils/permissions/PermissionRule.js，用于校准终端渲染的数据契约。
import type { PermissionRule } from 'src/utils/permissions/PermissionRule.js'
// 复用 getSettingsForSource 工具函数，把通用处理留在 src/utils/settings/settings.js 中维护。
import { getSettingsForSource } from 'src/utils/settings/settings.js'
// 类型依赖 { SettingsJson } 来自 src/utils/settings/types.js，用于校准终端渲染的数据契约。
import type { SettingsJson } from 'src/utils/settings/types.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 复用 SAFE_ENV_VARS 工具函数，把通用处理留在 ../../utils/managedEnvConstants.js 中维护。
import { SAFE_ENV_VARS } from '../../utils/managedEnvConstants.js'
// 复用 getPermissionRulesForSource 工具函数，把通用处理留在 ../../utils/permissions/permissionsLoader.js 中维护。
import { getPermissionRulesForSource } from '../../utils/permissions/permissionsLoader.js'

// hasHooks 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasHooks(settings: SettingsJson | null): boolean {
  // 只有 `settings === null || settings.disableAllHooks` 满足时，终端渲染才执行该分支。
  if (settings === null || settings.disableAllHooks) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 满足 `settings.statusLine` 时，终端渲染执行该分支。
  if (settings.statusLine) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 满足 `settings.fileSuggestion` 时，终端渲染执行该分支。
  if (settings.fileSuggestion) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // settings.hooks 集合缺失时直接走兜底路径，避免终端渲染使用无效输入。
  if (!settings.hooks) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 逐项读取 `Object.values(settings.hooks)` 中的hookConfig 配置，按输入顺序推进终端渲染。
  for (const hookConfig of Object.values(settings.hooks)) {
    // 满足 `hookConfig.length > 0` 时，终端渲染执行该分支。
    if (hookConfig.length > 0) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getHooksSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getHooksSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // 满足 `hasHooks(projectSettings)` 时，终端渲染执行该分支。
  if (hasHooks(projectSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 满足 `hasHooks(localSettings)` 时，终端渲染执行该分支。
  if (hasHooks(localSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}

// hasBashPermission 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasBashPermission(rules: PermissionRule[]): boolean {
  // 返回 `rules.some(`，作为终端渲染这次计算的结果。
  return rules.some(
    rule =>
      rule.ruleBehavior === 'allow' &&
      (rule.ruleValue.toolName === BASH_TOOL_NAME ||
        rule.ruleValue.toolName.startsWith(BASH_TOOL_NAME + '(')),
  )
}

/**
 * Get which setting sources have bash allow rules.
 * Returns an array of file paths that have bash permissions.
 */
// getBashPermissionSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getBashPermissionSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectRules 集合读取`getPermissionRulesForSource`，供终端渲染后续处理使用。
  const projectRules = getPermissionRulesForSource('projectSettings')
  // 满足 `hasBashPermission(projectRules)` 时，终端渲染执行该分支。
  if (hasBashPermission(projectRules)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localRules 集合读取`getPermissionRulesForSource`，供终端渲染后续处理使用。
  const localRules = getPermissionRulesForSource('localSettings')
  // 满足 `hasBashPermission(localRules)` 时，终端渲染执行该分支。
  if (hasBashPermission(localRules)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}

/**
 * Format a list of items with proper "and" conjunction.
 * @param items - Array of items to format
 * @param limit - Optional limit for how many items to show before summarizing (ignored if 0)
 */
// formatListWithAnd 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatListWithAnd(items: string[], limit?: number): string {
  // items 集合为空时立即返回或跳过，避免终端渲染把空集合当成可处理内容。
  if (items.length === 0) return ''

  // Ignore limit if it's 0
  // effectiveLimit标记终端 UI utils是否启用对应路径。
  const effectiveLimit = limit === 0 ? undefined : limit

  // If no limit or items are within limit, use normal formatting
  // 只有 `!effectiveLimit || items.length <= effectiveLimit` 满足时，终端渲染才执行该分支。
  if (!effectiveLimit || items.length <= effectiveLimit) {
    // 满足 `items.length === 1` 时，终端渲染执行该分支。
    if (items.length === 1) return items[0]!
    // 满足 `items.length === 2` 时，终端渲染执行该分支。
    if (items.length === 2) return `${items[0]} and ${items[1]}`

    // lastItem 命名 `items[items.length - 1]!`，让后续代码直接表达这个值的用途。
    const lastItem = items[items.length - 1]!
    // allButLast格式化`items.slice`，供终端渲染后续处理使用。
    const allButLast = items.slice(0, -1)
    // 返回 ``${allButLast.join(', ')}, and ${lastItem}``，作为终端渲染这次计算的结果。
    return `${allButLast.join(', ')}, and ${lastItem}`
  }

  // If we have more items than the limit, show first few and count the rest
  // shown格式化`items.slice`，供终端渲染后续处理使用。
  const shown = items.slice(0, effectiveLimit)
  // remaining 命名 `items.length - effectiveLimit`，让后续代码直接表达这个值的用途。
  const remaining = items.length - effectiveLimit

  // 满足 `shown.length === 1` 时，终端渲染执行该分支。
  if (shown.length === 1) {
    // 返回 ``${shown[0]} and ${remaining} more``，作为终端渲染这次计算的结果。
    return `${shown[0]} and ${remaining} more`
  }

  // 返回 ``${shown.join(', ')}, and ${remaining} more``，作为终端渲染这次计算的结果。
  return `${shown.join(', ')}, and ${remaining} more`
}

/**
 * Check if settings have otelHeadersHelper configured
 */
// hasOtelHeadersHelper 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasOtelHeadersHelper(settings: SettingsJson | null): boolean {
  // 返回 `!!settings?.otelHeadersHelper`，作为终端渲染这次计算的结果。
  return !!settings?.otelHeadersHelper
}

/**
 * Get which setting sources have otelHeadersHelper configured.
 * Returns an array of file paths that have otelHeadersHelper.
 */
// getOtelHeadersHelperSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOtelHeadersHelperSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // 满足 `hasOtelHeadersHelper(projectSettings)` 时，终端渲染执行该分支。
  if (hasOtelHeadersHelper(projectSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 满足 `hasOtelHeadersHelper(localSettings)` 时，终端渲染执行该分支。
  if (hasOtelHeadersHelper(localSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}

/**
 * Check if settings have apiKeyHelper configured
 */
// hasApiKeyHelper 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasApiKeyHelper(settings: SettingsJson | null): boolean {
  // 返回 `!!settings?.apiKeyHelper`，作为终端渲染这次计算的结果。
  return !!settings?.apiKeyHelper
}

/**
 * Get which setting sources have apiKeyHelper configured.
 * Returns an array of file paths that have apiKeyHelper.
 */
// getApiKeyHelperSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getApiKeyHelperSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // 满足 `hasApiKeyHelper(projectSettings)` 时，终端渲染执行该分支。
  if (hasApiKeyHelper(projectSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 满足 `hasApiKeyHelper(localSettings)` 时，终端渲染执行该分支。
  if (hasApiKeyHelper(localSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}

/**
 * Check if settings have AWS commands configured
 */
// hasAwsCommands 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasAwsCommands(settings: SettingsJson | null): boolean {
  // 返回 `!!(settings?.awsAuthRefresh || settings?.awsCredentialExport)`，作为终端渲染这次计算的结果。
  return !!(settings?.awsAuthRefresh || settings?.awsCredentialExport)
}

/**
 * Get which setting sources have AWS commands configured.
 * Returns an array of file paths that have awsAuthRefresh or awsCredentialExport.
 */
// getAwsCommandsSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAwsCommandsSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // 满足 `hasAwsCommands(projectSettings)` 时，终端渲染执行该分支。
  if (hasAwsCommands(projectSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 满足 `hasAwsCommands(localSettings)` 时，终端渲染执行该分支。
  if (hasAwsCommands(localSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}

/**
 * Check if settings have GCP commands configured
 */
// hasGcpCommands 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasGcpCommands(settings: SettingsJson | null): boolean {
  // 返回 `!!settings?.gcpAuthRefresh`，作为终端渲染这次计算的结果。
  return !!settings?.gcpAuthRefresh
}

/**
 * Get which setting sources have GCP commands configured.
 * Returns an array of file paths that have gcpAuthRefresh.
 */
// getGcpCommandsSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getGcpCommandsSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // 满足 `hasGcpCommands(projectSettings)` 时，终端渲染执行该分支。
  if (hasGcpCommands(projectSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 满足 `hasGcpCommands(localSettings)` 时，终端渲染执行该分支。
  if (hasGcpCommands(localSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}

/**
 * Check if settings have dangerous environment variables configured.
 * Any env var NOT in SAFE_ENV_VARS is considered dangerous.
 */
// hasDangerousEnvVars 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasDangerousEnvVars(settings: SettingsJson | null): boolean {
  // 满足 `!settings?.env` 时，终端渲染执行该分支。
  if (!settings?.env) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `Object.keys(settings.env).some(`，作为终端渲染这次计算的结果。
  return Object.keys(settings.env).some(
    // key更新为 `> !SAFE_ENV_VARS.has(key.toUpperCase())`，确保终端 UI后续读取最新状态。
    key => !SAFE_ENV_VARS.has(key.toUpperCase()),
  )
}

/**
 * Get which setting sources have dangerous environment variables configured.
 * Returns an array of file paths that have env vars not in SAFE_ENV_VARS.
 */
// getDangerousEnvVarsSources 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDangerousEnvVarsSources(): string[] {
  // sources 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const sources: string[] = []

  // projectSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // 满足 `hasDangerousEnvVars(projectSettings)` 时，终端渲染执行该分支。
  if (hasDangerousEnvVars(projectSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.json')
  }

  // localSettings 集合读取`getSettingsForSource`，供终端渲染后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 满足 `hasDangerousEnvVars(localSettings)` 时，终端渲染执行该分支。
  if (hasDangerousEnvVars(localSettings)) {
    // sources 集合追加新条目，保持收集顺序与输入顺序一致。
    sources.push('.claude/settings.local.json')
  }

  // 返回 `sources`，作为终端渲染这次计算的结果。
  return sources
}
