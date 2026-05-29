// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准权限判定的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 类型依赖 { PermissionRule, PermissionRuleSource } 来自 ./PermissionRule.js，用于校准权限判定的数据契约。
import type { PermissionRule, PermissionRuleSource } from './PermissionRule.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getAllowRules,
  getAskRules,
  getDenyRules,
  permissionRuleSourceDisplayString,
} from './permissions.js'

/**
 * Type of shadowing that makes a rule unreachable
 */
// ShadowType 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShadowType = 'ask' | 'deny'

/**
 * Represents an unreachable permission rule with explanation
 */
// UnreachableRule 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type UnreachableRule = {
  rule: PermissionRule
  reason: string
  shadowedBy: PermissionRule
  shadowType: ShadowType
  fix: string
}

/**
 * Options for detecting unreachable rules
 */
// DetectUnreachableRulesOptions 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type DetectUnreachableRulesOptions = {
  /**
   * Whether sandbox auto-allow is enabled for Bash commands.
   * When true, tool-wide Bash ask rules from personal settings don't block
   * specific Bash allow rules because sandboxed commands are auto-allowed.
   */
  sandboxAutoAllowEnabled: boolean
}

/**
 * Result of checking if a rule is shadowed.
 * Uses discriminated union for type safety.
 */
// ShadowResult 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
type ShadowResult =
  | { shadowed: false }
  | { shadowed: true; shadowedBy: PermissionRule; shadowType: ShadowType }

/**
 * Check if a permission rule source is shared (visible to other users).
 * Shared settings include:
 * - projectSettings: Committed to git, shared with team
 * - policySettings: Enterprise-managed, pushed to all users
 * - command: From slash command frontmatter, potentially shared
 *
 * Personal settings include:
 * - userSettings: User's global ~/.claude settings
 * - localSettings: Gitignored per-project settings
 * - cliArg: Runtime CLI arguments
 * - session: In-memory session rules
 * - flagSettings: From --settings flag (runtime)
 */
// isSharedSettingSource 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSharedSettingSource(source: PermissionRuleSource): boolean {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    source === 'projectSettings' ||
    source === 'policySettings' ||
    source === 'command'
  )
}

/**
 * Format a rule source for display in warning messages.
 */
// formatSource 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatSource(source: PermissionRuleSource): string {
  // 返回 `permissionRuleSourceDisplayString(source)`，作为权限判定这次计算的结果。
  return permissionRuleSourceDisplayString(source)
}

/**
 * Generate a fix suggestion based on the shadow type.
 */
// generateFixSuggestion 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function generateFixSuggestion(
  shadowType: ShadowType,
  shadowingRule: PermissionRule,
  shadowedRule: PermissionRule,
): string {
  // shadowingSource格式化`formatSource`，供权限判定后续处理使用。
  const shadowingSource = formatSource(shadowingRule.source)
  // shadowedSource格式化`formatSource`，供权限判定后续处理使用。
  const shadowedSource = formatSource(shadowedRule.source)
  // toolName保存`shadowingRule.ruleValue.toolName`，供权限判定权限工具 shadowed Rule Detection后续判断或输出使用。
  const toolName = shadowingRule.ruleValue.toolName

  // 当 `shadowType` 匹配 `'deny'` 时，权限判定执行对应分支。
  if (shadowType === 'deny') {
    // 返回 ``Remove the "${toolName}" deny rule from ${shadowingSource}, or remove ...`，作为权限判定这次计算的结果。
    return `Remove the "${toolName}" deny rule from ${shadowingSource}, or remove the specific allow rule from ${shadowedSource}`
  }
  // 返回 ``Remove the "${toolName}" ask rule from ${shadowingSource}, or remove t...`，作为权限判定这次计算的结果。
  return `Remove the "${toolName}" ask rule from ${shadowingSource}, or remove the specific allow rule from ${shadowedSource}`
}

/**
 * Check if a specific allow rule is shadowed (unreachable) by an ask rule.
 *
 * An allow rule is unreachable when:
 * 1. There's a tool-wide ask rule (e.g., "Bash" in ask list)
 * 2. And a specific allow rule (e.g., "Bash(ls:*)" in allow list)
 *
 * The ask rule takes precedence, making the specific allow rule unreachable
 * because the user will always be prompted first.
 *
 * Exception: For Bash with sandbox auto-allow enabled, tool-wide ask rules
 * from PERSONAL settings don't shadow specific allow rules because:
 * - Sandboxed commands are auto-allowed regardless of ask rules
 * - This only applies to personal settings (userSettings, localSettings, etc.)
 * - Shared settings (projectSettings, policySettings) always warn because
 *   other team members may not have sandbox enabled
 */
// isAllowRuleShadowedByAskRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAllowRuleShadowedByAskRule(
  allowRule: PermissionRule,
  askRules: PermissionRule[],
  options: DetectUnreachableRulesOptions,
): ShadowResult {
  // 从 `allowRule.ruleValue` 解构 toolName、ruleContent，减少权限工具 shadowed Rule Detection对同一对象的重复访问。
  const { toolName, ruleContent } = allowRule.ruleValue

  // Only check allow rules that have specific content (e.g., "Bash(ls:*)")
  // Tool-wide allow rules cannot be shadowed by ask rules
  // 满足 `ruleContent === undefined` 时，权限判定执行该分支。
  if (ruleContent === undefined) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { shadowed: false }
  }

  // Find any tool-wide ask rule for the same tool
  // shadowingAskRule筛选`askRules.find`，供权限判定后续处理使用。
  const shadowingAskRule = askRules.find(
    // askRule更新为 `>`，确保权限工具后续读取最新状态。
    askRule =>
      askRule.ruleValue.toolName === toolName &&
      askRule.ruleValue.ruleContent === undefined,
  )

  // shadowingAskRule缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!shadowingAskRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { shadowed: false }
  }

  // Special case: Bash with sandbox auto-allow from personal settings
  // The sandbox exception is based on the ASK rule's source, not the allow rule's source.
  // If the ask rule is from personal settings, the user's own sandbox will auto-allow.
  // If the ask rule is from shared settings, other team members may not have sandbox enabled.
  // 只有 `toolName === BASH_TOOL_NAME && options.sandboxAut` 满足时，权限判定才执行该分支。
  if (toolName === BASH_TOOL_NAME && options.sandboxAutoAllowEnabled) {
    // 满足 `!isSharedSettingSource(shadowingAskRule.source)` 时，权限判定执行该分支。
    if (!isSharedSettingSource(shadowingAskRule.source)) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return { shadowed: false }
    }
    // Fall through to mark as shadowed - shared settings should always warn
  }

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { shadowed: true, shadowedBy: shadowingAskRule, shadowType: 'ask' }
}

/**
 * Check if an allow rule is shadowed (completely blocked) by a deny rule.
 *
 * An allow rule is unreachable when:
 * 1. There's a tool-wide deny rule (e.g., "Bash" in deny list)
 * 2. And a specific allow rule (e.g., "Bash(ls:*)" in allow list)
 *
 * Deny rules are checked first in the permission evaluation order,
 * so the allow rule will never be reached - the tool is always denied.
 * This is more severe than ask-shadowing because the rule is truly blocked.
 */
// isAllowRuleShadowedByDenyRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAllowRuleShadowedByDenyRule(
  allowRule: PermissionRule,
  denyRules: PermissionRule[],
): ShadowResult {
  // 从 `allowRule.ruleValue` 解构 toolName、ruleContent，减少权限工具 shadowed Rule Detection对同一对象的重复访问。
  const { toolName, ruleContent } = allowRule.ruleValue

  // Only check allow rules that have specific content (e.g., "Bash(ls:*)")
  // Tool-wide allow rules conflict with tool-wide deny rules but are not "shadowed"
  // 满足 `ruleContent === undefined` 时，权限判定执行该分支。
  if (ruleContent === undefined) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { shadowed: false }
  }

  // Find any tool-wide deny rule for the same tool
  // shadowingDenyRule筛选`denyRules.find`，供权限判定后续处理使用。
  const shadowingDenyRule = denyRules.find(
    // denyRule更新为 `>`，确保权限工具后续读取最新状态。
    denyRule =>
      denyRule.ruleValue.toolName === toolName &&
      denyRule.ruleValue.ruleContent === undefined,
  )

  // shadowingDenyRule缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!shadowingDenyRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { shadowed: false }
  }

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { shadowed: true, shadowedBy: shadowingDenyRule, shadowType: 'deny' }
}

/**
 * Detect all unreachable permission rules in the given context.
 *
 * Currently detects:
 * - Allow rules shadowed by tool-wide deny rules (more severe - completely blocked)
 * - Allow rules shadowed by tool-wide ask rules (will always prompt)
 */
// detectUnreachableRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectUnreachableRules(
  context: ToolPermissionContext,
  options: DetectUnreachableRulesOptions,
): UnreachableRule[] {
  // unreachable 从空数组开始收集，后续循环会按处理顺序追加条目。
  const unreachable: UnreachableRule[] = []

  // allowRules 集合读取`getAllowRules`，供权限判定后续处理使用。
  const allowRules = getAllowRules(context)
  // askRules 集合读取`getAskRules`，供权限判定后续处理使用。
  const askRules = getAskRules(context)
  // denyRules 集合读取`getDenyRules`，供权限判定后续处理使用。
  const denyRules = getDenyRules(context)

  // Check each allow rule for shadowing
  // 按顺序遍历 `allowRules` 中的allowRule，逐个交给权限判定处理。
  for (const allowRule of allowRules) {
    // Check deny shadowing first (more severe)
    // denyResult保存`isAllowRuleShadowedByDenyRule`，供权限判定后续处理使用。
    const denyResult = isAllowRuleShadowedByDenyRule(allowRule, denyRules)
    // 满足 `denyResult.shadowed` 时，权限判定执行该分支。
    if (denyResult.shadowed) {
      // shadowSource格式化`formatSource`，供权限判定后续处理使用。
      const shadowSource = formatSource(denyResult.shadowedBy.source)
      // unreachable追加新条目，保持收集顺序与输入顺序一致。
      unreachable.push({
        rule: allowRule,
        reason: `Blocked by "${denyResult.shadowedBy.ruleValue.toolName}" deny rule (from ${shadowSource})`,
        shadowedBy: denyResult.shadowedBy,
        shadowType: 'deny',
        fix: generateFixSuggestion('deny', denyResult.shadowedBy, allowRule),
      })
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue // Don't also report ask-shadowing if deny-shadowed
    }

    // Check ask shadowing
    // askResult保存`isAllowRuleShadowedByAskRule`，供权限判定后续处理使用。
    const askResult = isAllowRuleShadowedByAskRule(allowRule, askRules, options)
    // 满足 `askResult.shadowed` 时，权限判定执行该分支。
    if (askResult.shadowed) {
      // shadowSource格式化`formatSource`，供权限判定后续处理使用。
      const shadowSource = formatSource(askResult.shadowedBy.source)
      // unreachable追加新条目，保持收集顺序与输入顺序一致。
      unreachable.push({
        rule: allowRule,
        reason: `Shadowed by "${askResult.shadowedBy.ruleValue.toolName}" ask rule (from ${shadowSource})`,
        shadowedBy: askResult.shadowedBy,
        shadowType: 'ask',
        fix: generateFixSuggestion('ask', askResult.shadowedBy, allowRule),
      })
    }
  }

  // 返回 `unreachable`，作为权限判定这次计算的结果。
  return unreachable
}
