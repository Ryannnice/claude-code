// 引入 getSettingsForSource，将 ./settings.js 中已经封装好的能力接到本文件流程里。
import { getSettingsForSource } from './settings.js'
// 类型依赖 { CUSTOMIZATION_SURFACES } 来自 ./types.js，用于校准共享工具的数据契约。
import type { CUSTOMIZATION_SURFACES } from './types.js'

// CustomizationSurface 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CustomizationSurface = (typeof CUSTOMIZATION_SURFACES)[number]

/**
 * Check whether a customization surface is locked to plugin-only sources
 * by the managed `strictPluginOnlyCustomization` policy.
 *
 * "Locked" means user-level (~/.claude/*) and project-level (.claude/*)
 * sources are skipped for that surface. Managed (policySettings) and
 * plugin-provided sources always load regardless — the policy is admin-set,
 * so managed sources are already admin-controlled, and plugins are gated
 * separately via `strictKnownMarketplaces`.
 *
 * `true` locks all four surfaces; array form locks only those listed.
 * Absent/undefined → nothing locked (the default).
 */
// isRestrictedToPluginOnly 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRestrictedToPluginOnly(
  surface: CustomizationSurface,
): boolean {
  // policy 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const policy =
    getSettingsForSource('policySettings')?.strictPluginOnlyCustomization
  // 满足 `policy === true` 时，共享工具执行该分支。
  if (policy === true) return true
  // 满足 `Array.isArray(policy)) return policy.includes(surface` 时，共享工具执行该分支。
  if (Array.isArray(policy)) return policy.includes(surface)
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Sources that bypass strictPluginOnlyCustomization. Admin-trusted because:
 *   plugin — gated separately by strictKnownMarketplaces
 *   policySettings — from managed settings, admin-controlled by definition
 *   built-in / builtin / bundled — ship with the CLI, not user-authored
 *
 * Everything else (userSettings, projectSettings, localSettings, flagSettings,
 * mcp, undefined) is user-controlled and blocked when the relevant surface
 * is locked. Covers both AgentDefinition.source ('built-in' with hyphen) and
 * Command.source ('builtin' no hyphen, plus 'bundled').
 */
// ADMIN_TRUSTED_SOURCES 集合 用 Set 去重，后续只需判断成员是否存在。
const ADMIN_TRUSTED_SOURCES: ReadonlySet<string> = new Set([
  'plugin',
  'policySettings',
  'built-in',
  'builtin',
  'bundled',
])

/**
 * Whether a customization's source is admin-trusted under
 * strictPluginOnlyCustomization. Use this to gate frontmatter-hook
 * registration and similar per-item checks where the item carries a
 * source tag but the surface's filesystem loader already ran.
 *
 * Pattern at call sites:
 *   const allowed = !isRestrictedToPluginOnly(surface) || isSourceAdminTrusted(item.source)
 *   if (item.hooks && allowed) { register(...) }
 */
// isSourceAdminTrusted 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSourceAdminTrusted(source: string | undefined): boolean {
  // 返回 `source !== undefined && ADMIN_TRUSTED_SOURCES.has(source)`，作为共享工具这次计算的结果。
  return source !== undefined && ADMIN_TRUSTED_SOURCES.has(source)
}
