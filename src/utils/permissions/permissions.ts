// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 APIUserAbortError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIUserAbortError } from '@anthropic-ai/sdk'
// 类型依赖 { CanUseToolFn } 来自 ../../hooks/useCanUseTool.js，用于校准权限判定的数据契约。
import type { CanUseToolFn } from '../../hooks/useCanUseTool.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getToolNameForPermissionCheck,
  mcpInfoFromString,
} from '../../services/mcp/mcpStringUtils.js'
// 类型依赖 { Tool, ToolPermissionContext, ToolUseContext } 来自 ../../Tool.js，用于校准权限判定的数据契约。
import type { Tool, ToolPermissionContext, ToolUseContext } from '../../Tool.js'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js'
// 接入 shouldUseSandbox 工具实现，后续工具池会按权限和开关决定是否暴露。
import { shouldUseSandbox } from '../../tools/BashTool/shouldUseSandbox.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
// 接入 POWERSHELL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { POWERSHELL_TOOL_NAME } from '../../tools/PowerShellTool/toolName.js'
// 接入 REPL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { REPL_TOOL_NAME } from '../../tools/REPLTool/constants.js'
// 类型依赖 { AssistantMessage } 来自 ../../types/message.js，用于校准权限判定的数据契约。
import type { AssistantMessage } from '../../types/message.js'
// 引入 extractOutputRedirections，将 ../bash/commands.js 中已经封装好的能力接到本文件流程里。
import { extractOutputRedirections } from '../bash/commands.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 AbortError、toError，将 ../errors.js 中已经封装好的能力接到本文件流程里。
import { AbortError, toError } from '../errors.js'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 SandboxManager，将 ../sandbox/sandbox-adapter.js 中已经封装好的能力接到本文件流程里。
import { SandboxManager } from '../sandbox/sandbox-adapter.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getSettingSourceDisplayNameLowercase,
  SETTING_SOURCES,
} from '../settings/constants.js'
// 引入 plural，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { plural } from '../stringUtils.js'
// 引入 permissionModeTitle，将 ./PermissionMode.js 中已经封装好的能力接到本文件流程里。
import { permissionModeTitle } from './PermissionMode.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionAskDecision,
  PermissionDecision,
  PermissionDecisionReason,
  PermissionDenyDecision,
  PermissionResult,
} from './PermissionResult.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionBehavior,
  PermissionRule,
  PermissionRuleSource,
  PermissionRuleValue,
} from './PermissionRule.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  applyPermissionUpdate,
  applyPermissionUpdates,
  persistPermissionUpdates,
} from './PermissionUpdate.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionUpdate,
  PermissionUpdateDestination,
} from './PermissionUpdateSchema.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  permissionRuleValueFromString,
  permissionRuleValueToString,
} from './permissionRuleParser.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  deletePermissionRuleFromSettings,
  type PermissionRuleFromEditableSettings,
  shouldAllowManagedPermissionRulesOnly,
} from './permissionsLoader.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// classifierDecisionModule保存`feature`，供权限判定后续处理使用。
const classifierDecisionModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('./classifierDecision.js') as typeof import('./classifierDecision.js'))
  : null
// autoModeStateModule 状态保存`feature`，供权限判定后续处理使用。
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('./autoModeState.js') as typeof import('./autoModeState.js'))
  : null

// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  addToTurnClassifierDuration,
  getTotalCacheCreationInputTokens,
  getTotalCacheReadInputTokens,
  getTotalInputTokens,
  getTotalOutputTokens,
} from '../../bootstrap/state.js'
// 接入 getFeatureValue_CACHED_WITH_REFRESH 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_WITH_REFRESH } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 sanitizeToolNameForAnalytics 服务层能力，把外部通信或共享状态交给 ../../services/analytics/metadata.js 处理。
import { sanitizeToolNameForAnalytics } from '../../services/analytics/metadata.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  clearClassifierChecking,
  setClassifierChecking,
} from '../classifierApprovals.js'
// 引入 isInProtectedNamespace，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isInProtectedNamespace } from '../envUtils.js'
// 引入 executePermissionRequestHooks，将 ../hooks.js 中已经封装好的能力接到本文件流程里。
import { executePermissionRequestHooks } from '../hooks.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  AUTO_REJECT_MESSAGE,
  buildClassifierUnavailableMessage,
  buildYoloRejectionMessage,
  DONT_ASK_REJECT_MESSAGE,
} from '../messages.js'
// 引入 calculateCostFromTokens，将 ../modelCost.js 中已经封装好的能力接到本文件流程里。
import { calculateCostFromTokens } from '../modelCost.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  createDenialTrackingState,
  DENIAL_LIMITS,
  type DenialTrackingState,
  recordDenial,
  recordSuccess,
  shouldFallbackToPrompting,
} from './denialTracking.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  classifyYoloAction,
  formatActionForClassifier,
} from './yoloClassifier.js'

// CLASSIFIER_FAIL_CLOSED_REFRESH_MS 集合 命名 `30 * 60 * 1000 // 30 minutes`，让后续代码直接表达这个值的用途。
const CLASSIFIER_FAIL_CLOSED_REFRESH_MS = 30 * 60 * 1000 // 30 minutes

// PERMISSION_RULE_SOURCES 权限数据 聚合成有序列表，保持后续遍历顺序稳定。
const PERMISSION_RULE_SOURCES = [
  ...SETTING_SOURCES,
  'cliArg',
  'command',
  'session',
] as const satisfies readonly PermissionRuleSource[]

// permissionRuleSourceDisplayString 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionRuleSourceDisplayString(
  source: PermissionRuleSource,
): string {
  // 返回 `getSettingSourceDisplayNameLowercase(source)`，作为权限判定这次计算的结果。
  return getSettingSourceDisplayNameLowercase(source)
}

// getAllowRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAllowRules(
  context: ToolPermissionContext,
): PermissionRule[] {
  // 返回 `PERMISSION_RULE_SOURCES.flatMap(source =>`，作为权限判定这次计算的结果。
  return PERMISSION_RULE_SOURCES.flatMap(source =>
    (context.alwaysAllowRules[source] || []).map(ruleString => ({
      source,
      ruleBehavior: 'allow',
      ruleValue: permissionRuleValueFromString(ruleString),
    })),
  )
}

/**
 * Creates a permission request message that explain the permission request
 */
// createPermissionRequestMessage 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createPermissionRequestMessage(
  toolName: string,
  decisionReason?: PermissionDecisionReason,
): string {
  // Handle different decision reason types
  // 满足 `decisionReason` 时，权限判定执行该分支。
  if (decisionReason) {
    // 权限判定在这里按实际状态进入对应分支。
    if (
      (feature('BASH_CLASSIFIER') || feature('TRANSCRIPT_CLASSIFIER')) &&
      decisionReason.type === 'classifier'
    ) {
      // 返回 ``Classifier '${decisionReason.classifier}' requires approval for this $...`，作为权限判定这次计算的结果。
      return `Classifier '${decisionReason.classifier}' requires approval for this ${toolName} command: ${decisionReason.reason}`
    }
    // 按照 decisionReason.type 的取值选择权限判定的具体处理分支。
    switch (decisionReason.type) {
      case 'hook': {
        // hookMessage 消息数据保存`decisionReason.reason`，供后续判断或组装使用。
        const hookMessage = decisionReason.reason
          ? `Hook '${decisionReason.hookName}' blocked this action: ${decisionReason.reason}`
          : `Hook '${decisionReason.hookName}' requires approval for this ${toolName} command`
        // 返回 `hookMessage`，作为权限判定这次计算的结果。
        return hookMessage
      }
      case 'rule': {
        // ruleString保存`permissionRuleValueToString`，供权限判定后续处理使用。
        const ruleString = permissionRuleValueToString(
          decisionReason.rule.ruleValue,
        )
        // sourceString保存`permissionRuleSourceDisplayString`，供权限判定后续处理使用。
        const sourceString = permissionRuleSourceDisplayString(
          decisionReason.rule.source,
        )
        // 返回 ``Permission rule '${ruleString}' from ${sourceString} requires approval...`，作为权限判定这次计算的结果。
        return `Permission rule '${ruleString}' from ${sourceString} requires approval for this ${toolName} command`
      }
      case 'subcommandResults': {
        // needsApproval 从空数组开始收集，后续循环会按处理顺序追加条目。
        const needsApproval: string[] = []
        // 循环处理 `const [cmd, result] of decisionReason.reasons`，让权限判定逐项把同类条目按顺序走完。
        for (const [cmd, result] of decisionReason.reasons) {
          // 只有 `result.behavior === 'ask' || result.behavior ===` 满足时，权限判定才执行该分支。
          if (result.behavior === 'ask' || result.behavior === 'passthrough') {
            // Strip output redirections for display to avoid showing filenames as commands
            // Only do this for Bash tool to avoid affecting other tools
            // 当 `toolName` 匹配 `'Bash'` 时，权限判定执行对应分支。
            if (toolName === 'Bash') {
              // 权限工具 permissions先整理这一处局部数据，后续分支可以直接读取。
              const { commandWithoutRedirections, redirections } =
                extractOutputRedirections(cmd)
              // Only use stripped version if there were actual redirections
              // displayCmd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const displayCmd =
                redirections.length > 0 ? commandWithoutRedirections : cmd
              // needsApproval追加新条目，保持收集顺序与输入顺序一致。
              needsApproval.push(displayCmd)
            } else {
              // needsApproval追加新条目，保持收集顺序与输入顺序一致。
              needsApproval.push(cmd)
            }
          }
        }
        // 满足 `needsApproval.length > 0` 时，权限判定执行该分支。
        if (needsApproval.length > 0) {
          // n记录 `needsApproval.length` 是否成立，下一步按该结果分支。
          const n = needsApproval.length
          // 返回 ``This ${toolName} command contains multiple operations. The following $...`，作为权限判定这次计算的结果。
          return `This ${toolName} command contains multiple operations. The following ${plural(n, 'part')} ${plural(n, 'requires', 'require')} approval: ${needsApproval.join(', ')}`
        }
        // 返回 ``This ${toolName} command contains multiple operations that require app...`，作为权限判定这次计算的结果。
        return `This ${toolName} command contains multiple operations that require approval`
      }
      case 'permissionPromptTool':
        // 返回 ``Tool '${decisionReason.permissionPromptToolName}' requires approval fo...`，作为权限判定这次计算的结果。
        return `Tool '${decisionReason.permissionPromptToolName}' requires approval for this ${toolName} command`
      case 'sandboxOverride':
        // 返回 `'Run outside of the sandbox'`，作为权限判定这次计算的结果。
        return 'Run outside of the sandbox'
      case 'workingDir':
        // 返回 `decisionReason.reason`，作为权限判定这次计算的结果。
        return decisionReason.reason
      case 'safetyCheck':
      case 'other':
        // 返回 `decisionReason.reason`，作为权限判定这次计算的结果。
        return decisionReason.reason
      case 'mode': {
        // modeTitle 标题保存`permissionModeTitle`，供权限判定后续处理使用。
        const modeTitle = permissionModeTitle(decisionReason.mode)
        // 返回 ``Current permission mode (${modeTitle}) requires approval for this ${to...`，作为权限判定这次计算的结果。
        return `Current permission mode (${modeTitle}) requires approval for this ${toolName} command`
      }
      case 'asyncAgent':
        // 返回 `decisionReason.reason`，作为权限判定这次计算的结果。
        return decisionReason.reason
    }
  }

  // Default message without listing allowed commands
  // 消息固定为 ``Claude requested permissions to use ${toolName}, but you...`，作为权限判定权限工具 permissions后续展示或比较的基准。
  const message = `Claude requested permissions to use ${toolName}, but you haven't granted it yet.`

  // 返回 `message`，作为权限判定这次计算的结果。
  return message
}

// getDenyRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDenyRules(context: ToolPermissionContext): PermissionRule[] {
  // 返回 `PERMISSION_RULE_SOURCES.flatMap(source =>`，作为权限判定这次计算的结果。
  return PERMISSION_RULE_SOURCES.flatMap(source =>
    (context.alwaysDenyRules[source] || []).map(ruleString => ({
      source,
      ruleBehavior: 'deny',
      ruleValue: permissionRuleValueFromString(ruleString),
    })),
  )
}

// getAskRules 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAskRules(context: ToolPermissionContext): PermissionRule[] {
  // 返回 `PERMISSION_RULE_SOURCES.flatMap(source =>`，作为权限判定这次计算的结果。
  return PERMISSION_RULE_SOURCES.flatMap(source =>
    (context.alwaysAskRules[source] || []).map(ruleString => ({
      source,
      ruleBehavior: 'ask',
      ruleValue: permissionRuleValueFromString(ruleString),
    })),
  )
}

/**
 * Check if the entire tool matches a rule
 * For example, this matches "Bash" but not "Bash(prefix:*)" for BashTool
 * This also matches MCP tools with a server name, e.g. the rule "mcp__server1"
 */
// toolMatchesRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function toolMatchesRule(
  tool: Pick<Tool, 'name' | 'mcpInfo'>,
  rule: PermissionRule,
): boolean {
  // Rule must not have content to match the entire tool
  // `rule.ruleValue.ruleContent` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (rule.ruleValue.ruleContent !== undefined) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // MCP tools are matched by their fully qualified mcp__server__tool name. In
  // skip-prefix mode (CLAUDE_AGENT_SDK_MCP_NO_PREFIX), MCP tools have unprefixed
  // display names (e.g., "Write") that collide with builtin names; rules targeting
  // builtins should not match their MCP replacements.
  // nameForRuleMatch读取`getToolNameForPermissionCheck`，供权限判定后续处理使用。
  const nameForRuleMatch = getToolNameForPermissionCheck(tool)

  // Direct tool name match
  // 满足 `rule.ruleValue.toolName === nameForRuleMatch` 时，权限判定执行该分支。
  if (rule.ruleValue.toolName === nameForRuleMatch) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // MCP server-level permission: rule "mcp__server1" matches tool "mcp__server1__tool1"
  // Also supports wildcard: rule "mcp__server1__*" matches all tools from server1
  // ruleInfo保存`mcpInfoFromString`，供权限判定后续处理使用。
  const ruleInfo = mcpInfoFromString(rule.ruleValue.toolName)
  // toolInfo保存`mcpInfoFromString`，供权限判定后续处理使用。
  const toolInfo = mcpInfoFromString(nameForRuleMatch)

  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    ruleInfo !== null &&
    toolInfo !== null &&
    (ruleInfo.toolName === undefined || ruleInfo.toolName === '*') &&
    ruleInfo.serverName === toolInfo.serverName
  )
}

/**
 * Check if the entire tool is listed in the always allow rules
 * For example, this finds "Bash" but not "Bash(prefix:*)" for BashTool
 */
// toolAlwaysAllowedRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toolAlwaysAllowedRule(
  context: ToolPermissionContext,
  tool: Pick<Tool, 'name' | 'mcpInfo'>,
): PermissionRule | null {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    // 调用 getAllowRules，触发权限判定此处需要的副作用。
    getAllowRules(context).find(rule => toolMatchesRule(tool, rule)) || null
  )
}

/**
 * Check if the tool is listed in the always deny rules
 */
// getDenyRuleForTool 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDenyRuleForTool(
  context: ToolPermissionContext,
  tool: Pick<Tool, 'name' | 'mcpInfo'>,
): PermissionRule | null {
  // 返回 `getDenyRules(context).find(rule => toolMatchesRule(tool, rule)) || null`，作为权限判定这次计算的结果。
  return getDenyRules(context).find(rule => toolMatchesRule(tool, rule)) || null
}

/**
 * Check if the tool is listed in the always ask rules
 */
// getAskRuleForTool 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAskRuleForTool(
  context: ToolPermissionContext,
  tool: Pick<Tool, 'name' | 'mcpInfo'>,
): PermissionRule | null {
  // 返回 `getAskRules(context).find(rule => toolMatchesRule(tool, rule)) || null`，作为权限判定这次计算的结果。
  return getAskRules(context).find(rule => toolMatchesRule(tool, rule)) || null
}

/**
 * Check if a specific agent is denied via Agent(agentType) syntax.
 * For example, Agent(Explore) would deny the Explore agent.
 */
// getDenyRuleForAgent 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDenyRuleForAgent(
  context: ToolPermissionContext,
  agentToolName: string,
  agentType: string,
): PermissionRule | null {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    getDenyRules(context).find(
      // rule更新为 `>`，确保权限工具后续读取最新状态。
      rule =>
        rule.ruleValue.toolName === agentToolName &&
        rule.ruleValue.ruleContent === agentType,
    ) || null
  )
}

/**
 * Filter agents to exclude those that are denied via Agent(agentType) syntax.
 */
// filterDeniedAgents 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function filterDeniedAgents<T extends { agentType: string }>(
  agents: T[],
  context: ToolPermissionContext,
  agentToolName: string,
): T[] {
  // Parse deny rules once and collect Agent(x) contents into a Set.
  // Previously this called getDenyRuleForAgent per agent, which re-parsed
  // every deny rule for every agent (O(agents×rules) parse calls).
  // deniedAgentTypes 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const deniedAgentTypes = new Set<string>()
  // 逐项读取 `getDenyRules(context)` 中的rule，按输入顺序推进权限判定。
  for (const rule of getDenyRules(context)) {
    // 权限判定在这里按实际状态进入对应分支。
    if (
      rule.ruleValue.toolName === agentToolName &&
      rule.ruleValue.ruleContent !== undefined
    ) {
      // 调用 deniedAgentTypes.add，触发权限判定此处需要的副作用。
      deniedAgentTypes.add(rule.ruleValue.ruleContent)
    }
  }
  // 返回 `agents.filter(agent => !deniedAgentTypes.has(agent.agentType))`，作为权限判定这次计算的结果。
  return agents.filter(agent => !deniedAgentTypes.has(agent.agentType))
}

/**
 * Map of rule contents to the associated rule for a given tool.
 * e.g. the string key is "prefix:*" from "Bash(prefix:*)" for BashTool
 */
// getRuleByContentsForTool 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRuleByContentsForTool(
  context: ToolPermissionContext,
  tool: Tool,
  behavior: PermissionBehavior,
): Map<string, PermissionRule> {
  // 返回 `getRuleByContentsForToolName(`，作为权限判定这次计算的结果。
  return getRuleByContentsForToolName(
    context,
    getToolNameForPermissionCheck(tool),
    behavior,
  )
}

// Used to break circular dependency where a Tool calls this function
// getRuleByContentsForToolName 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRuleByContentsForToolName(
  context: ToolPermissionContext,
  toolName: string,
  behavior: PermissionBehavior,
): Map<string, PermissionRule> {
  // ruleByContents 集合构建`new Map<string, PermissionRule>()` 整理出中间结果，供权限判定权限工具 permissions后续步骤使用。
  const ruleByContents = new Map<string, PermissionRule>()
  // rules 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  let rules: PermissionRule[] = []
  // 按照 behavior 的取值选择权限判定的具体处理分支。
  switch (behavior) {
    case 'allow':
      // rules 集合更新为 `getAllowRules(context)`，确保权限工具后续读取最新状态。
      rules = getAllowRules(context)
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    case 'deny':
      // rules 集合更新为 `getDenyRules(context)`，确保权限工具后续读取最新状态。
      rules = getDenyRules(context)
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    case 'ask':
      // rules 集合更新为 `getAskRules(context)`，确保权限工具后续读取最新状态。
      rules = getAskRules(context)
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
  }
  // 按顺序遍历 `rules` 中的rule，逐个交给权限判定处理。
  for (const rule of rules) {
    // 权限判定在这里按实际状态进入对应分支。
    if (
      rule.ruleValue.toolName === toolName &&
      rule.ruleValue.ruleContent !== undefined &&
      rule.ruleBehavior === behavior
    ) {
      // ruleByContents.set 写入新的状态值，使权限判定后续读取保持一致。
      ruleByContents.set(rule.ruleValue.ruleContent, rule)
    }
  }
  // 返回 `ruleByContents`，作为权限判定这次计算的结果。
  return ruleByContents
}

/**
 * Runs PermissionRequest hooks for headless/async agents that cannot show
 * permission prompts. This gives hooks an opportunity to allow or deny
 * tool use before the fallback auto-deny kicks in.
 *
 * Returns a PermissionDecision if a hook made a decision, or null if no
 * hook provided a decision (caller should proceed to auto-deny).
 */
// runPermissionRequestHooksForHeadlessAgent 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function runPermissionRequestHooksForHeadlessAgent(
  tool: Tool,
  input: { [key: string]: unknown },
  toolUseID: string,
  context: ToolUseContext,
  permissionMode: string | undefined,
  suggestions: PermissionUpdate[] | undefined,
): Promise<PermissionDecision | null> {
  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // 逐项读取 `executePermissionRequestHooks(` 中的hookResult，按输入顺序推进权限工具 permissions。
    for await (const hookResult of executePermissionRequestHooks(
      tool.name,
      toolUseID,
      input,
      context,
      permissionMode,
      suggestions,
      context.abortController.signal,
    )) {
      // hookResult.permissionRequestResult 权限数据缺失时直接走兜底路径，避免权限判定使用无效输入。
      if (!hookResult.permissionRequestResult) {
        // 跳过当前项，继续处理权限判定中的下一轮循环。
        continue
      }
      // decision 命名 `hookResult.permissionRequestResult`，让后续代码直接表达这个值的用途。
      const decision = hookResult.permissionRequestResult
      // 当 `decision.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
      if (decision.behavior === 'allow') {
        // finalInput保存`decision.updatedInput ?? input`，供后续判断或组装使用。
        const finalInput = decision.updatedInput ?? input
        // Persist permission updates if provided
        // 满足 `decision.updatedPermissions?.length` 时，权限判定执行该分支。
        if (decision.updatedPermissions?.length) {
          // 调用 persistPermissionUpdates，触发权限判定此处需要的副作用。
          persistPermissionUpdates(decision.updatedPermissions)
          // context.setAppState 写入新的状态值，使权限判定后续读取保持一致。
          context.setAppState(prev => ({
            ...prev,
            toolPermissionContext: applyPermissionUpdates(
              prev.toolPermissionContext,
              decision.updatedPermissions!,
            ),
          }))
        }
        // 返回结构化结果，集中表达权限判定已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: finalInput,
          decisionReason: {
            type: 'hook',
            hookName: 'PermissionRequest',
          },
        }
      }
      // 当 `decision.behavior` 匹配 `'deny'` 时，权限判定执行对应分支。
      if (decision.behavior === 'deny') {
        // 满足 `decision.interrupt` 时，权限判定执行该分支。
        if (decision.interrupt) {
          // 记录权限判定运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Hook interrupt: tool=${tool.name} hookMessage=${decision.message}`,
          )
          // 触发取消信号，通知权限判定中仍在等待的异步任务尽快停止。
          context.abortController.abort()
        }
        // 返回结构化结果，集中表达权限判定已经整理出的状态。
        return {
          behavior: 'deny',
          message: decision.message || 'Permission denied by hook',
          decisionReason: {
            type: 'hook',
            hookName: 'PermissionRequest',
            reason: decision.message,
          },
        }
      }
    }
  } catch (error) {
    // If hooks fail, fall through to auto-deny rather than crashing
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error('PermissionRequest hook failed for headless agent', {
        cause: toError(error),
      }),
    )
  }
  // 返回 `null`，作为权限判定这次计算的结果。
  return null
}

// hasPermissionsToUseTool 权限数据封装成回调，供权限工具 permissions在事件触发或异步步骤中调用。
export const hasPermissionsToUseTool: CanUseToolFn = async (
  tool,
  input,
  context,
  assistantMessage,
  toolUseID,
): Promise<PermissionDecision> => {
  // 结果保存`hasPermissionsToUseToolInner`，供权限判定后续处理使用。
  const result = await hasPermissionsToUseToolInner(tool, input, context)


  // Reset consecutive denials on any allowed tool use in auto mode.
  // This ensures that a successful tool use (even one auto-allowed by rules)
  // breaks the consecutive denial streak.
  // 当 `result.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
  if (result.behavior === 'allow') {
    // appState 状态读取`context.getAppState`，供权限判定后续处理使用。
    const appState = context.getAppState()
    // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
    if (feature('TRANSCRIPT_CLASSIFIER')) {
      // currentDenialState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const currentDenialState =
        context.localDenialTracking ?? appState.denialTracking
      // 权限判定在这里按实际状态进入对应分支。
      if (
        appState.toolPermissionContext.mode === 'auto' &&
        currentDenialState &&
        currentDenialState.consecutiveDenials > 0
      ) {
        // newDenialState 状态保存`recordSuccess`，供权限判定后续处理使用。
        const newDenialState = recordSuccess(currentDenialState)
        // 调用 persistDenialState，触发权限判定此处需要的副作用。
        persistDenialState(context, newDenialState)
      }
    }
    // 返回 `result`，作为权限判定这次计算的结果。
    return result
  }

  // Apply dontAsk mode transformation: convert 'ask' to 'deny'
  // This is done at the end so it can't be bypassed by early returns
  // 当 `result.behavior` 匹配 `'ask'` 时，权限判定执行对应分支。
  if (result.behavior === 'ask') {
    // appState 状态读取`context.getAppState`，供权限判定后续处理使用。
    const appState = context.getAppState()

    // 当 `appState.toolPermissionContext.mode` 匹配 `'dontAsk'` 时，权限判定执行对应分支。
    if (appState.toolPermissionContext.mode === 'dontAsk') {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'deny',
        decisionReason: {
          type: 'mode',
          mode: 'dontAsk',
        },
        message: DONT_ASK_REJECT_MESSAGE(tool.name),
      }
    }
    // Apply auto mode: use AI classifier instead of prompting user
    // Check this BEFORE shouldAvoidPermissionPrompts so classifiers work in headless mode
    // 权限判定在这里按实际状态进入对应分支。
    if (
      feature('TRANSCRIPT_CLASSIFIER') &&
      (appState.toolPermissionContext.mode === 'auto' ||
        (appState.toolPermissionContext.mode === 'plan' &&
          (autoModeStateModule?.isAutoModeActive() ?? false)))
    ) {
      // Non-classifier-approvable safetyCheck decisions stay immune to ALL
      // auto-approve paths: the acceptEdits fast-path, the safe-tool allowlist,
      // and the classifier. Step 1g only guards bypassPermissions; this guards
      // auto. classifierApprovable safetyChecks (sensitive-file paths) fall
      // through to the classifier — the fast-paths below naturally don't fire
      // because the tool's own checkPermissions still returns 'ask'.
      // 权限判定在这里按实际状态进入对应分支。
      if (
        result.decisionReason?.type === 'safetyCheck' &&
        !result.decisionReason.classifierApprovable
      ) {
        // 满足 `appState.toolPermissionContext.shouldAvoidPermiss` 时，权限判定执行该分支。
        if (appState.toolPermissionContext.shouldAvoidPermissionPrompts) {
          // 返回结构化结果，集中表达权限判定已经整理出的状态。
          return {
            behavior: 'deny',
            message: result.message,
            decisionReason: {
              type: 'asyncAgent',
              reason:
                'Safety check requires interactive approval and permission prompts are not available in this context',
            },
          }
        }
        // 返回 `result`，作为权限判定这次计算的结果。
        return result
      }
      // 当 `tool.requiresUserInteraction?.() && result....` 匹配 `'ask'` 时，权限判定执行对应分支。
      if (tool.requiresUserInteraction?.() && result.behavior === 'ask') {
        // 返回 `result`，作为权限判定这次计算的结果。
        return result
      }

      // Use local denial tracking for async subagents (whose setAppState
      // is a no-op), otherwise read from appState as before.
      // denialState 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const denialState =
        context.localDenialTracking ??
        appState.denialTracking ??
        createDenialTrackingState()

      // PowerShell requires explicit user permission in auto mode unless
      // POWERSHELL_AUTO_MODE (ant-only build flag) is on. When disabled, this
      // guard keeps PS out of the classifier and skips the acceptEdits
      // fast-path below. When enabled, PS flows through to the classifier like
      // Bash — the classifier prompt gets POWERSHELL_DENY_GUIDANCE appended so
      // it recognizes `iex (iwr ...)` as download-and-execute, etc.
      // Note: this runs inside the behavior === 'ask' branch, so allow rules
      // that fire earlier (step 2b toolAlwaysAllowedRule, PS prefix allow)
      // return before reaching here. Allow-rule protection is handled by
      // permissionSetup.ts: isOverlyBroadPowerShellAllowRule strips PowerShell(*)
      // and isDangerousPowerShellPermission strips iex/pwsh/Start-Process
      // prefix rules for ant users and auto mode entry.
      // 权限判定在这里按实际状态进入对应分支。
      if (
        tool.name === POWERSHELL_TOOL_NAME &&
        !feature('POWERSHELL_AUTO_MODE')
      ) {
        // 满足 `appState.toolPermissionContext.shouldAvoidPermiss` 时，权限判定执行该分支。
        if (appState.toolPermissionContext.shouldAvoidPermissionPrompts) {
          // 返回结构化结果，集中表达权限判定已经整理出的状态。
          return {
            behavior: 'deny',
            message: 'PowerShell tool requires interactive approval',
            decisionReason: {
              type: 'asyncAgent',
              reason:
                'PowerShell tool requires interactive approval and permission prompts are not available in this context',
            },
          }
        }
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping auto mode classifier for ${tool.name}: tool requires explicit user permission`,
        )
        // 返回 `result`，作为权限判定这次计算的结果。
        return result
      }

      // Before running the auto mode classifier, check if acceptEdits mode would
      // allow this action. This avoids expensive classifier API calls for safe
      // operations like file edits in the working directory.
      // Skip for Agent and REPL — their checkPermissions returns 'allow' for
      // acceptEdits mode, which would silently bypass the classifier. REPL
      // code can contain VM escapes between inner tool calls; the classifier
      // must see the glue JavaScript, not just the inner tool calls.
      // 权限判定在这里按实际状态进入对应分支。
      if (
        result.behavior === 'ask' &&
        tool.name !== AGENT_TOOL_NAME &&
        tool.name !== REPL_TOOL_NAME
      ) {
        // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
        try {
          // parsedInput解析`inputSchema.parse`，供权限判定后续处理使用。
          const parsedInput = tool.inputSchema.parse(input)
          // acceptEditsResult读取`tool.checkPermissions`，供权限判定后续处理使用。
          const acceptEditsResult = await tool.checkPermissions(parsedInput, {
            ...context,
            // 这个回调绑定到 getAppState: () => {，负责权限判定在该局部场景下的响应。
            getAppState: () => {
              // 状态读取`context.getAppState`，供权限判定后续处理使用。
              const state = context.getAppState()
              // 返回结构化结果，集中表达权限判定已经整理出的状态。
              return {
                ...state,
                toolPermissionContext: {
                  ...state.toolPermissionContext,
                  mode: 'acceptEdits' as const,
                },
              }
            },
          })
          // 当 `acceptEditsResult.behavior` 匹配 `'allow'` 时，权限判定执行对应分支。
          if (acceptEditsResult.behavior === 'allow') {
            // newDenialState 状态保存`recordSuccess`，供权限判定后续处理使用。
            const newDenialState = recordSuccess(denialState)
            // 调用 persistDenialState，触发权限判定此处需要的副作用。
            persistDenialState(context, newDenialState)
            // 记录权限判定运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Skipping auto mode classifier for ${tool.name}: would be allowed in acceptEdits mode`,
            )
            // 记录权限判定运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_auto_mode_decision', {
              decision:
                'allowed' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              toolName: sanitizeToolNameForAnalytics(tool.name),
              inProtectedNamespace: isInProtectedNamespace(),
              // msg_id of the agent completion that produced this tool_use —
              // the action at the bottom of the classifier transcript. Joins
              // the decision back to the main agent's API response.
              agentMsgId: assistantMessage.message
                .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              confidence:
                'high' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              fastPath:
                'acceptEdits' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
            // 返回结构化结果，集中表达权限判定已经整理出的状态。
            return {
              behavior: 'allow',
              updatedInput: acceptEditsResult.updatedInput ?? input,
              decisionReason: {
                type: 'mode',
                mode: 'auto',
              },
            }
          }
        } catch (e) {
          // 只有 `e instanceof AbortError || e instanceof APIUserAb` 满足时，权限判定才执行该分支。
          if (e instanceof AbortError || e instanceof APIUserAbortError) {
            // 抛出 e，阻止权限判定在无效状态下继续运行。
            throw e
          }
          // If the acceptEdits check fails, fall through to the classifier
        }
      }

      // Allowlisted tools are safe and don't need YOLO classification.
      // This uses the safe-tool allowlist to skip unnecessary classifier API calls.
      // 满足 `classifierDecisionModule!.isAutoModeAllowlistedTool(tool.name)` 时，权限判定执行该分支。
      if (classifierDecisionModule!.isAutoModeAllowlistedTool(tool.name)) {
        // newDenialState 状态保存`recordSuccess`，供权限判定后续处理使用。
        const newDenialState = recordSuccess(denialState)
        // 调用 persistDenialState，触发权限判定此处需要的副作用。
        persistDenialState(context, newDenialState)
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Skipping auto mode classifier for ${tool.name}: tool is on the safe allowlist`,
        )
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_auto_mode_decision', {
          decision:
            'allowed' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          toolName: sanitizeToolNameForAnalytics(tool.name),
          inProtectedNamespace: isInProtectedNamespace(),
          agentMsgId: assistantMessage.message
            .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          confidence:
            'high' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          fastPath:
            'allowlist' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 返回结构化结果，集中表达权限判定已经整理出的状态。
        return {
          behavior: 'allow',
          updatedInput: input,
          decisionReason: {
            type: 'mode',
            mode: 'auto',
          },
        }
      }

      // Run the auto mode classifier
      // action格式化`formatActionForClassifier`，供权限判定后续处理使用。
      const action = formatActionForClassifier(tool.name, input)
      // setClassifierChecking 写入新的状态值，使权限判定后续读取保持一致。
      setClassifierChecking(toolUseID)
      // classifierResult 的赋值跨多行展开，先保留变量名再读取后续表达式。
      let classifierResult
      // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
      try {
        // classifierResult更新为 `await classifyYoloAction(`，确保权限工具后续读取最新状态。
        classifierResult = await classifyYoloAction(
          context.messages,
          action,
          context.options.tools,
          appState.toolPermissionContext,
          context.abortController.signal,
        )
      } finally {
        // 调用 clearClassifierChecking，触发权限判定此处需要的副作用。
        clearClassifierChecking(toolUseID)
      }

      // Notify ants when classifier error dumped prompts (will be in /share)
      // 权限判定在这里按实际状态进入对应分支。
      if (
        process.env.USER_TYPE === 'ant' &&
        classifierResult.errorDumpPath &&
        context.addNotification
      ) {
        // 调用 context.addNotification，触发权限判定此处需要的副作用。
        context.addNotification({
          key: 'auto-mode-error-dump',
          text: `Auto mode classifier error — prompts dumped to ${classifierResult.errorDumpPath} (included in /share)`,
          priority: 'immediate',
          color: 'error',
        })
      }

      // Log classifier decision for metrics (including overhead telemetry)
      // yoloDecision保存`classifierResult.unavailable`，供权限判定权限工具 permissions后续判断或输出使用。
      const yoloDecision = classifierResult.unavailable
        ? 'unavailable'
        : classifierResult.shouldBlock
          ? 'blocked'
          : 'allowed'

      // Compute classifier cost in USD for overhead analysis
      // classifierCostUSD 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const classifierCostUSD =
        classifierResult.usage && classifierResult.model
          ? calculateCostFromTokens(
              classifierResult.model,
              classifierResult.usage,
            )
          : undefined
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_auto_mode_decision', {
        decision:
          yoloDecision as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        toolName: sanitizeToolNameForAnalytics(tool.name),
        inProtectedNamespace: isInProtectedNamespace(),
        // msg_id of the agent completion that produced this tool_use —
        // the action at the bottom of the classifier transcript.
        agentMsgId: assistantMessage.message
          .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        classifierModel:
          classifierResult.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        consecutiveDenials: classifierResult.shouldBlock
          ? denialState.consecutiveDenials + 1
          : 0,
        totalDenials: classifierResult.shouldBlock
          ? denialState.totalDenials + 1
          : denialState.totalDenials,
        // Overhead telemetry: token usage and latency for the classifier API call
        classifierInputTokens: classifierResult.usage?.inputTokens,
        classifierOutputTokens: classifierResult.usage?.outputTokens,
        classifierCacheReadInputTokens:
          classifierResult.usage?.cacheReadInputTokens,
        classifierCacheCreationInputTokens:
          classifierResult.usage?.cacheCreationInputTokens,
        classifierDurationMs: classifierResult.durationMs,
        // Character lengths of the prompt components sent to the classifier
        classifierSystemPromptLength:
          classifierResult.promptLengths?.systemPrompt,
        classifierToolCallsLength: classifierResult.promptLengths?.toolCalls,
        classifierUserPromptsLength:
          classifierResult.promptLengths?.userPrompts,
        // Session totals at time of classifier call (for computing overhead %).
        // These are main-transcript-only — sideQuery (used by the classifier)
        // does NOT call addToTotalSessionCost, so classifier tokens are excluded.
        sessionInputTokens: getTotalInputTokens(),
        sessionOutputTokens: getTotalOutputTokens(),
        sessionCacheReadInputTokens: getTotalCacheReadInputTokens(),
        sessionCacheCreationInputTokens: getTotalCacheCreationInputTokens(),
        classifierCostUSD,
        classifierStage:
          classifierResult.stage as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        classifierStage1InputTokens: classifierResult.stage1Usage?.inputTokens,
        classifierStage1OutputTokens:
          classifierResult.stage1Usage?.outputTokens,
        classifierStage1CacheReadInputTokens:
          classifierResult.stage1Usage?.cacheReadInputTokens,
        classifierStage1CacheCreationInputTokens:
          classifierResult.stage1Usage?.cacheCreationInputTokens,
        classifierStage1DurationMs: classifierResult.stage1DurationMs,
        classifierStage1RequestId:
          classifierResult.stage1RequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        classifierStage1MsgId:
          classifierResult.stage1MsgId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        classifierStage1CostUSD:
          classifierResult.stage1Usage && classifierResult.model
            ? calculateCostFromTokens(
                classifierResult.model,
                classifierResult.stage1Usage,
              )
            : undefined,
        classifierStage2InputTokens: classifierResult.stage2Usage?.inputTokens,
        classifierStage2OutputTokens:
          classifierResult.stage2Usage?.outputTokens,
        classifierStage2CacheReadInputTokens:
          classifierResult.stage2Usage?.cacheReadInputTokens,
        classifierStage2CacheCreationInputTokens:
          classifierResult.stage2Usage?.cacheCreationInputTokens,
        classifierStage2DurationMs: classifierResult.stage2DurationMs,
        classifierStage2RequestId:
          classifierResult.stage2RequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        classifierStage2MsgId:
          classifierResult.stage2MsgId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        classifierStage2CostUSD:
          classifierResult.stage2Usage && classifierResult.model
            ? calculateCostFromTokens(
                classifierResult.model,
                classifierResult.stage2Usage,
              )
            : undefined,
      })

      // `classifierResult.durationMs` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (classifierResult.durationMs !== undefined) {
        // 调用 addToTurnClassifierDuration，触发权限判定此处需要的副作用。
        addToTurnClassifierDuration(classifierResult.durationMs)
      }

      // 满足 `classifierResult.shouldBlock` 时，权限判定执行该分支。
      if (classifierResult.shouldBlock) {
        // Transcript exceeded the classifier's context window — deterministic
        // error, won't recover on retry. Skip iron_gate and fall back to
        // normal prompting so the user can approve/deny manually.
        // 满足 `classifierResult.transcriptTooLong` 时，权限判定执行该分支。
        if (classifierResult.transcriptTooLong) {
          // 满足 `appState.toolPermissionContext.shouldAvoidPermiss` 时，权限判定执行该分支。
          if (appState.toolPermissionContext.shouldAvoidPermissionPrompts) {
            // Permanent condition (transcript only grows) — deny-retry-deny
            // wastes tokens without ever hitting the denial-limit abort.
            // 抛出 new AbortError(，阻止权限判定在无效状态下继续运行。
            throw new AbortError(
              'Agent aborted: auto mode classifier transcript exceeded context window in headless mode',
            )
          }
          // 记录权限判定运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            'Auto mode classifier transcript too long, falling back to normal permission handling',
            { level: 'warn' },
          )
          // 返回结构化结果，集中表达权限判定已经整理出的状态。
          return {
            ...result,
            decisionReason: {
              type: 'other',
              reason:
                'Auto mode classifier transcript exceeded context window — falling back to manual approval',
            },
          }
        }
        // When classifier is unavailable (API error), behavior depends on
        // the tengu_iron_gate_closed gate.
        // 满足 `classifierResult.unavailable` 时，权限判定执行该分支。
        if (classifierResult.unavailable) {
          // 权限判定在这里按实际状态进入对应分支。
          if (
            getFeatureValue_CACHED_WITH_REFRESH(
              'tengu_iron_gate_closed',
              true,
              CLASSIFIER_FAIL_CLOSED_REFRESH_MS,
            )
          ) {
            // 记录权限判定运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              'Auto mode classifier unavailable, denying with retry guidance (fail closed)',
              { level: 'warn' },
            )
            // 返回结构化结果，集中表达权限判定已经整理出的状态。
            return {
              behavior: 'deny',
              decisionReason: {
                type: 'classifier',
                classifier: 'auto-mode',
                reason: 'Classifier unavailable',
              },
              message: buildClassifierUnavailableMessage(
                tool.name,
                classifierResult.model,
              ),
            }
          }
          // Fail open: fall back to normal permission handling
          // 记录权限判定运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            'Auto mode classifier unavailable, falling back to normal permission handling (fail open)',
            { level: 'warn' },
          )
          // 返回 `result`，作为权限判定这次计算的结果。
          return result
        }

        // Update denial tracking and check limits
        // newDenialState 状态保存`recordDenial`，供权限判定后续处理使用。
        const newDenialState = recordDenial(denialState)
        // 调用 persistDenialState，触发权限判定此处需要的副作用。
        persistDenialState(context, newDenialState)

        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Auto mode classifier blocked action: ${classifierResult.reason}`,
          { level: 'warn' },
        )

        // If denial limit hit, fall back to prompting so the user
        // can review. We check after the classifier so we can include
        // its reason in the prompt.
        // denialLimitResult保存`handleDenialLimitExceeded`，供权限判定后续处理使用。
        const denialLimitResult = handleDenialLimitExceeded(
          newDenialState,
          appState,
          classifierResult.reason,
          assistantMessage,
          tool,
          result,
          context,
        )
        // 满足 `denialLimitResult` 时，权限判定执行该分支。
        if (denialLimitResult) {
          // 返回 `denialLimitResult`，作为权限判定这次计算的结果。
          return denialLimitResult
        }

        // 返回结构化结果，集中表达权限判定已经整理出的状态。
        return {
          behavior: 'deny',
          decisionReason: {
            type: 'classifier',
            classifier: 'auto-mode',
            reason: classifierResult.reason,
          },
          message: buildYoloRejectionMessage(classifierResult.reason),
        }
      }

      // Reset consecutive denials on success
      // newDenialState 状态保存`recordSuccess`，供权限判定后续处理使用。
      const newDenialState = recordSuccess(denialState)
      // 调用 persistDenialState，触发权限判定此处需要的副作用。
      persistDenialState(context, newDenialState)

      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'allow',
        updatedInput: input,
        decisionReason: {
          type: 'classifier',
          classifier: 'auto-mode',
          reason: classifierResult.reason,
        },
      }
    }

    // When permission prompts should be avoided (e.g., background/headless agents),
    // run PermissionRequest hooks first to give them a chance to allow/deny.
    // Only auto-deny if no hook provides a decision.
    // 满足 `appState.toolPermissionContext.shouldAvoidPermiss` 时，权限判定执行该分支。
    if (appState.toolPermissionContext.shouldAvoidPermissionPrompts) {
      // hookDecision保存`runPermissionRequestHooksForHeadlessAgent`，供权限判定后续处理使用。
      const hookDecision = await runPermissionRequestHooksForHeadlessAgent(
        tool,
        input,
        toolUseID,
        context,
        appState.toolPermissionContext.mode,
        result.suggestions,
      )
      // 满足 `hookDecision` 时，权限判定执行该分支。
      if (hookDecision) {
        // 返回 `hookDecision`，作为权限判定这次计算的结果。
        return hookDecision
      }
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'deny',
        decisionReason: {
          type: 'asyncAgent',
          reason: 'Permission prompts are not available in this context',
        },
        message: AUTO_REJECT_MESSAGE(tool.name),
      }
    }
  }

  // 返回 `result`，作为权限判定这次计算的结果。
  return result
}

/**
 * Persist denial tracking state. For async subagents with localDenialTracking,
 * mutate the local state in place (since setAppState is a no-op). Otherwise,
 * write to appState as usual.
 */
// persistDenialState 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function persistDenialState(
  context: ToolUseContext,
  newState: DenialTrackingState,
): void {
  // 满足 `context.localDenialTracking` 时，权限判定执行该分支。
  if (context.localDenialTracking) {
    // 调用 Object.assign，触发权限判定此处需要的副作用。
    Object.assign(context.localDenialTracking, newState)
  } else {
    // context.setAppState 写入新的状态值，使权限判定后续读取保持一致。
    context.setAppState(prev => {
      // recordSuccess returns the same reference when state is
      // unchanged. Returning prev here lets store.setState's Object.is check
      // skip the listener loop entirely.
      // 满足 `prev.denialTracking === newState` 时，权限判定执行该分支。
      if (prev.denialTracking === newState) return prev
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return { ...prev, denialTracking: newState }
    })
  }
}

/**
 * Check if a denial limit was exceeded and return an 'ask' result
 * so the user can review. Returns null if no limit was hit.
 */
// handleDenialLimitExceeded 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleDenialLimitExceeded(
  denialState: DenialTrackingState,
  appState: {
    toolPermissionContext: { shouldAvoidPermissionPrompts?: boolean }
  },
  classifierReason: string,
  assistantMessage: AssistantMessage,
  tool: Tool,
  result: PermissionDecision,
  context: ToolUseContext,
): PermissionDecision | null {
  // 满足 `!shouldFallbackToPrompting(denialState)` 时，权限判定执行该分支。
  if (!shouldFallbackToPrompting(denialState)) {
    // 返回 `null`，作为权限判定这次计算的结果。
    return null
  }

  // hitTotalLimit保存`denialState.totalDenials >= DENIAL_LIMITS.maxTotal`，供后续判断或组装使用。
  const hitTotalLimit = denialState.totalDenials >= DENIAL_LIMITS.maxTotal
  // isHeadless 集合标记权限判定权限工具 permissions是否启用对应路径。
  const isHeadless = appState.toolPermissionContext.shouldAvoidPermissionPrompts
  // Capture counts before persistDenialState, which may mutate denialState
  // in-place via Object.assign for subagents with localDenialTracking.
  // totalCount 数量保存`denialState.totalDenials`，供后续判断或组装使用。
  const totalCount = denialState.totalDenials
  // consecutiveCount 数量保存`denialState.consecutiveDenials`，供后续判断或组装使用。
  const consecutiveCount = denialState.consecutiveDenials
  // warning 警告信息保存`hitTotalLimit`，供后续判断或组装使用。
  const warning = hitTotalLimit
    ? `${totalCount} actions were blocked this session. Please review the transcript before continuing.`
    : `${consecutiveCount} consecutive actions were blocked. Please review the transcript before continuing.`

  // 记录权限判定运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_auto_mode_denial_limit_exceeded', {
    limit: (hitTotalLimit
      ? 'total'
      : 'consecutive') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    mode: (isHeadless
      ? 'headless'
      : 'cli') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    messageID: assistantMessage.message
      .id as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    consecutiveDenials: consecutiveCount,
    totalDenials: totalCount,
    toolName: sanitizeToolNameForAnalytics(tool.name),
  })

  // 满足 `isHeadless` 时，权限判定执行该分支。
  if (isHeadless) {
    // 抛出 new AbortError(，阻止权限判定在无效状态下继续运行。
    throw new AbortError(
      'Agent aborted: too many classifier denials in headless mode',
    )
  }

  // 记录权限判定运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `Classifier denial limit exceeded, falling back to prompting: ${warning}`,
    { level: 'warn' },
  )

  // 满足 `hitTotalLimit` 时，权限判定执行该分支。
  if (hitTotalLimit) {
    // 调用 persistDenialState，触发权限判定此处需要的副作用。
    persistDenialState(context, {
      ...denialState,
      totalDenials: 0,
      consecutiveDenials: 0,
    })
  }

  // Preserve the original classifier value (e.g. 'dangerous-agent-action')
  // so downstream analytics in interactiveHandler can log the correct
  // user override event.
  // originalClassifier 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const originalClassifier =
    result.decisionReason?.type === 'classifier'
      ? result.decisionReason.classifier
      : 'auto-mode'

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    ...result,
    decisionReason: {
      type: 'classifier',
      classifier: originalClassifier,
      reason: `${warning}\n\nLatest blocked action: ${classifierReason}`,
    },
  }
}

/**
 * Check only the rule-based steps of the permission pipeline — the subset
 * that bypassPermissions mode respects (everything that fires before step 2a).
 *
 * Returns a deny/ask decision if a rule blocks the tool, or null if no rule
 * objects. Unlike hasPermissionsToUseTool, this does NOT run the auto mode classifier,
 * mode-based transformations (dontAsk/auto/asyncAgent), PermissionRequest hooks,
 * or bypassPermissions / always-allowed checks.
 *
 * Caller must pre-check tool.requiresUserInteraction() — step 1e is not replicated.
 */
// checkRuleBasedPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkRuleBasedPermissions(
  tool: Tool,
  input: { [key: string]: unknown },
  context: ToolUseContext,
): Promise<PermissionAskDecision | PermissionDenyDecision | null> {
  // appState 状态读取`context.getAppState`，供权限判定后续处理使用。
  const appState = context.getAppState()

  // 1a. Entire tool is denied by rule
  // denyRule读取`getDenyRuleForTool`，供权限判定后续处理使用。
  const denyRule = getDenyRuleForTool(appState.toolPermissionContext, tool)
  // 满足 `denyRule` 时，权限判定执行该分支。
  if (denyRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'deny',
      decisionReason: {
        type: 'rule',
        rule: denyRule,
      },
      message: `Permission to use ${tool.name} has been denied.`,
    }
  }

  // 1b. Entire tool has an ask rule
  // askRule读取`getAskRuleForTool`，供权限判定后续处理使用。
  const askRule = getAskRuleForTool(appState.toolPermissionContext, tool)
  // 满足 `askRule` 时，权限判定执行该分支。
  if (askRule) {
    // canSandboxAutoAllow 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const canSandboxAutoAllow =
      tool.name === BASH_TOOL_NAME &&
      SandboxManager.isSandboxingEnabled() &&
      SandboxManager.isAutoAllowBashIfSandboxedEnabled() &&
      shouldUseSandbox(input)

    // canSandboxAutoAllow缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!canSandboxAutoAllow) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'ask',
        decisionReason: {
          type: 'rule',
          rule: askRule,
        },
        message: createPermissionRequestMessage(tool.name),
      }
    }
    // Fall through to let tool.checkPermissions handle command-specific rules
  }

  // 1c. Tool-specific permission check (e.g. bash subcommand rules)
  // toolPermissionResult 权限数据 集中保存权限工具 permissions要一起传递的字段。
  let toolPermissionResult: PermissionResult = {
    behavior: 'passthrough',
    message: createPermissionRequestMessage(tool.name),
  }
  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // parsedInput解析`inputSchema.parse`，供权限判定后续处理使用。
    const parsedInput = tool.inputSchema.parse(input)
    // toolPermissionResult 权限数据更新为 `await tool.checkPermissions(parsedInput, context)`，确保权限工具后续读取最新状态。
    toolPermissionResult = await tool.checkPermissions(parsedInput, context)
  } catch (e) {
    // 只有 `e instanceof AbortError || e instanceof APIUserAb` 满足时，权限判定才执行该分支。
    if (e instanceof AbortError || e instanceof APIUserAbortError) {
      // 抛出 e，阻止权限判定在无效状态下继续运行。
      throw e
    }
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }

  // 1d. Tool implementation denied (catches bash subcommand denies wrapped
  // in subcommandResults — no need to inspect decisionReason.type)
  // 当 `toolPermissionResult?.behavior` 匹配 `'deny'` 时，权限判定执行对应分支。
  if (toolPermissionResult?.behavior === 'deny') {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // 1f. Content-specific ask rules from tool.checkPermissions
  // (e.g. Bash(npm publish:*) → {ask, type:'rule', ruleBehavior:'ask'})
  // 权限判定在这里按实际状态进入对应分支。
  if (
    toolPermissionResult?.behavior === 'ask' &&
    toolPermissionResult.decisionReason?.type === 'rule' &&
    toolPermissionResult.decisionReason.rule.ruleBehavior === 'ask'
  ) {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // 1g. Safety checks (e.g. .git/, .claude/, .vscode/, shell configs) are
  // bypass-immune — they must prompt even when a PreToolUse hook returned
  // allow. checkPathSafetyForAutoEdit returns {type:'safetyCheck'} for these.
  // 权限判定在这里按实际状态进入对应分支。
  if (
    toolPermissionResult?.behavior === 'ask' &&
    toolPermissionResult.decisionReason?.type === 'safetyCheck'
  ) {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // No rule-based objection
  // 返回 `null`，作为权限判定这次计算的结果。
  return null
}

// hasPermissionsToUseToolInner 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function hasPermissionsToUseToolInner(
  tool: Tool,
  input: { [key: string]: unknown },
  context: ToolUseContext,
): Promise<PermissionDecision> {
  // 满足 `context.abortController.signal.aborted` 时，权限判定执行该分支。
  if (context.abortController.signal.aborted) {
    // 抛出 new AbortError()，阻止权限判定在无效状态下继续运行。
    throw new AbortError()
  }

  // appState 状态读取`context.getAppState`，供权限判定后续处理使用。
  let appState = context.getAppState()

  // 1. Check if the tool is denied
  // 1a. Entire tool is denied
  // denyRule读取`getDenyRuleForTool`，供权限判定后续处理使用。
  const denyRule = getDenyRuleForTool(appState.toolPermissionContext, tool)
  // 满足 `denyRule` 时，权限判定执行该分支。
  if (denyRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'deny',
      decisionReason: {
        type: 'rule',
        rule: denyRule,
      },
      message: `Permission to use ${tool.name} has been denied.`,
    }
  }

  // 1b. Check if the entire tool should always ask for permission
  // askRule读取`getAskRuleForTool`，供权限判定后续处理使用。
  const askRule = getAskRuleForTool(appState.toolPermissionContext, tool)
  // 满足 `askRule` 时，权限判定执行该分支。
  if (askRule) {
    // When autoAllowBashIfSandboxed is on, sandboxed commands skip the ask rule and
    // auto-allow via Bash's checkPermissions. Commands that won't be sandboxed (excluded
    // commands, dangerouslyDisableSandbox) still need to respect the ask rule.
    // canSandboxAutoAllow 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const canSandboxAutoAllow =
      tool.name === BASH_TOOL_NAME &&
      SandboxManager.isSandboxingEnabled() &&
      SandboxManager.isAutoAllowBashIfSandboxedEnabled() &&
      shouldUseSandbox(input)

    // canSandboxAutoAllow缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!canSandboxAutoAllow) {
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        behavior: 'ask',
        decisionReason: {
          type: 'rule',
          rule: askRule,
        },
        message: createPermissionRequestMessage(tool.name),
      }
    }
    // Fall through to let Bash's checkPermissions handle command-specific rules
  }

  // 1c. Ask the tool implementation for a permission result
  // Overridden unless tool input schema is not valid
  // toolPermissionResult 权限数据 集中保存权限工具 permissions要一起传递的字段。
  let toolPermissionResult: PermissionResult = {
    behavior: 'passthrough',
    message: createPermissionRequestMessage(tool.name),
  }
  // 保护这一段可能失败的权限判定操作，确保异常能进入相邻错误处理。
  try {
    // parsedInput解析`inputSchema.parse`，供权限判定后续处理使用。
    const parsedInput = tool.inputSchema.parse(input)
    // toolPermissionResult 权限数据更新为 `await tool.checkPermissions(parsedInput, context)`，确保权限工具后续读取最新状态。
    toolPermissionResult = await tool.checkPermissions(parsedInput, context)
  } catch (e) {
    // Rethrow abort errors so they propagate properly
    // 只有 `e instanceof AbortError || e instanceof APIUserAb` 满足时，权限判定才执行该分支。
    if (e instanceof AbortError || e instanceof APIUserAbortError) {
      // 抛出 e，阻止权限判定在无效状态下继续运行。
      throw e
    }
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }

  // 1d. Tool implementation denied permission
  // 当 `toolPermissionResult?.behavior` 匹配 `'deny'` 时，权限判定执行对应分支。
  if (toolPermissionResult?.behavior === 'deny') {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // 1e. Tool requires user interaction even in bypass mode
  // 权限判定在这里按实际状态进入对应分支。
  if (
    tool.requiresUserInteraction?.() &&
    toolPermissionResult?.behavior === 'ask'
  ) {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // 1f. Content-specific ask rules from tool.checkPermissions take precedence
  // over bypassPermissions mode. When a user explicitly configures a
  // content-specific ask rule (e.g. Bash(npm publish:*)), the tool's
  // checkPermissions returns {behavior:'ask', decisionReason:{type:'rule',
  // rule:{ruleBehavior:'ask'}}}. This must be respected even in bypass mode,
  // just as deny rules are respected at step 1d.
  // 权限判定在这里按实际状态进入对应分支。
  if (
    toolPermissionResult?.behavior === 'ask' &&
    toolPermissionResult.decisionReason?.type === 'rule' &&
    toolPermissionResult.decisionReason.rule.ruleBehavior === 'ask'
  ) {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // 1g. Safety checks (e.g. .git/, .claude/, .vscode/, shell configs) are
  // bypass-immune — they must prompt even in bypassPermissions mode.
  // checkPathSafetyForAutoEdit returns {type:'safetyCheck'} for these paths.
  // 权限判定在这里按实际状态进入对应分支。
  if (
    toolPermissionResult?.behavior === 'ask' &&
    toolPermissionResult.decisionReason?.type === 'safetyCheck'
  ) {
    // 返回 `toolPermissionResult`，作为权限判定这次计算的结果。
    return toolPermissionResult
  }

  // 2a. Check if mode allows the tool to run
  // IMPORTANT: Call getAppState() to get the latest value
  // appState 状态更新为 `context.getAppState()`，确保权限工具后续读取最新状态。
  appState = context.getAppState()
  // Check if permissions should be bypassed:
  // - Direct bypassPermissions mode
  // - Plan mode when the user originally started with bypass mode (isBypassPermissionsModeAvailable)
  // shouldBypassPermissions 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldBypassPermissions =
    appState.toolPermissionContext.mode === 'bypassPermissions' ||
    (appState.toolPermissionContext.mode === 'plan' &&
      appState.toolPermissionContext.isBypassPermissionsModeAvailable)
  // 满足 `shouldBypassPermissions` 时，权限判定执行该分支。
  if (shouldBypassPermissions) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: getUpdatedInputOrFallback(toolPermissionResult, input),
      decisionReason: {
        type: 'mode',
        mode: appState.toolPermissionContext.mode,
      },
    }
  }

  // 2b. Entire tool is allowed
  // alwaysAllowedRule保存`toolAlwaysAllowedRule`，供权限判定后续处理使用。
  const alwaysAllowedRule = toolAlwaysAllowedRule(
    appState.toolPermissionContext,
    tool,
  )
  // 满足 `alwaysAllowedRule` 时，权限判定执行该分支。
  if (alwaysAllowedRule) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: getUpdatedInputOrFallback(toolPermissionResult, input),
      decisionReason: {
        type: 'rule',
        rule: alwaysAllowedRule,
      },
    }
  }

  // 3. Convert "passthrough" to "ask"
  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  const result: PermissionDecision =
    toolPermissionResult.behavior === 'passthrough'
      ? {
          ...toolPermissionResult,
          behavior: 'ask' as const,
          message: createPermissionRequestMessage(
            tool.name,
            toolPermissionResult.decisionReason,
          ),
        }
      : toolPermissionResult

  // 只有 `result.behavior === 'ask' && result.suggestions` 满足时，权限判定才执行该分支。
  if (result.behavior === 'ask' && result.suggestions) {
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Permission suggestions for ${tool.name}: ${jsonStringify(result.suggestions, null, 2)}`,
    )
  }

  // 返回 `result`，作为权限判定这次计算的结果。
  return result
}

// EditPermissionRuleArgs 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
type EditPermissionRuleArgs = {
  initialContext: ToolPermissionContext
  // 这个回调绑定到 setToolPermissionContext: (updatedContext: ToolPermissionContext) => void，负责权限判定在该局部场景下的响应。
  setToolPermissionContext: (updatedContext: ToolPermissionContext) => void
}

/**
 * Delete a permission rule from the appropriate destination
 */
// deletePermissionRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function deletePermissionRule({
  rule,
  initialContext,
  setToolPermissionContext,
}: EditPermissionRuleArgs & { rule: PermissionRule }): Promise<void> {
  // 权限判定在这里按实际状态进入对应分支。
  if (
    rule.source === 'policySettings' ||
    rule.source === 'flagSettings' ||
    rule.source === 'command'
  ) {
    // 抛出 new Error('Cannot delete permission rules from read-only settings')，阻止权限判定在无效状态下继续运行。
    throw new Error('Cannot delete permission rules from read-only settings')
  }

  // updatedContext保存`applyPermissionUpdate`，供权限判定后续处理使用。
  const updatedContext = applyPermissionUpdate(initialContext, {
    type: 'removeRules',
    rules: [rule.ruleValue],
    behavior: rule.ruleBehavior,
    destination: rule.source as PermissionUpdateDestination,
  })

  // Per-destination logic to delete the rule from settings
  // destination保存`rule.source`，供权限判定权限工具 permissions后续判断或输出使用。
  const destination = rule.source
  // 按照 destination 的取值选择权限判定的具体处理分支。
  switch (destination) {
    case 'localSettings':
    case 'userSettings':
    case 'projectSettings': {
      // Note: Typescript doesn't know that rule conforms to `PermissionRuleFromEditableSettings` even when we switch on `rule.source`
      // 调用 deletePermissionRuleFromSettings，触发权限判定此处需要的副作用。
      deletePermissionRuleFromSettings(
        rule as PermissionRuleFromEditableSettings,
      )
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }
    case 'cliArg':
    case 'session': {
      // No action needed for in-memory sources - not persisted to disk
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    }
  }

  // Update React state with updated context
  // setToolPermissionContext 写入新的状态值，使权限判定后续读取保持一致。
  setToolPermissionContext(updatedContext)
}

/**
 * Helper to convert PermissionRule array to PermissionUpdate array
 */
// convertRulesToUpdates 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function convertRulesToUpdates(
  rules: PermissionRule[],
  updateType: 'addRules' | 'replaceRules',
): PermissionUpdate[] {
  // Group rules by source and behavior
  // grouped构建`new Map<string, PermissionRuleValue[]>()`，供后续判断或组装使用。
  const grouped = new Map<string, PermissionRuleValue[]>()

  // 按顺序遍历 `rules` 中的rule，逐个交给权限判定处理。
  for (const rule of rules) {
    // key 命名 ``${rule.source}:${rule.ruleBehavior}``，让后续代码直接表达这个值的用途。
    const key = `${rule.source}:${rule.ruleBehavior}`
    // 满足 `!grouped.has(key)` 时，权限判定执行该分支。
    if (!grouped.has(key)) {
      // grouped.set 写入新的状态值，使权限判定后续读取保持一致。
      grouped.set(key, [])
    }
    // 调用 grouped.get，触发权限判定此处需要的副作用。
    grouped.get(key)!.push(rule.ruleValue)
  }

  // Convert to PermissionUpdate array
  // updates 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const updates: PermissionUpdate[] = []
  // 循环处理 `const [key, ruleValues] of grouped`，让权限判定逐项把同类条目按顺序走完。
  for (const [key, ruleValues] of grouped) {
    // 从 `key.split(':')` 按位置拆出 source、behavior，让权限工具 permissions分别处理这些返回值。
    const [source, behavior] = key.split(':')
    // updates 集合追加新条目，保持收集顺序与输入顺序一致。
    updates.push({
      type: updateType,
      rules: ruleValues,
      behavior: behavior as PermissionBehavior,
      destination: source as PermissionUpdateDestination,
    })
  }

  // 返回 `updates`，作为权限判定这次计算的结果。
  return updates
}

/**
 * Apply permission rules to context (additive - for initial setup)
 */
// applyPermissionRulesToPermissionContext 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyPermissionRulesToPermissionContext(
  toolPermissionContext: ToolPermissionContext,
  rules: PermissionRule[],
): ToolPermissionContext {
  // updates 集合保存`convertRulesToUpdates`，供权限判定后续处理使用。
  const updates = convertRulesToUpdates(rules, 'addRules')
  // 返回 `applyPermissionUpdates(toolPermissionContext, updates)`，作为权限判定这次计算的结果。
  return applyPermissionUpdates(toolPermissionContext, updates)
}

/**
 * Sync permission rules from disk (replacement - for settings changes)
 */
// syncPermissionRulesFromDisk 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function syncPermissionRulesFromDisk(
  toolPermissionContext: ToolPermissionContext,
  rules: PermissionRule[],
): ToolPermissionContext {
  // context保存`toolPermissionContext`，供权限判定权限工具 permissions后续判断或输出使用。
  let context = toolPermissionContext

  // When allowManagedPermissionRulesOnly is enabled, clear all non-policy sources
  // 满足 `shouldAllowManagedPermissionRulesOnly()` 时，权限判定执行该分支。
  if (shouldAllowManagedPermissionRulesOnly()) {
    // sourcesToClear 聚合成有序列表，保持后续遍历顺序稳定。
    const sourcesToClear: PermissionUpdateDestination[] = [
      'userSettings',
      'projectSettings',
      'localSettings',
      'cliArg',
      'session',
    ]
    // behaviors 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const behaviors: PermissionBehavior[] = ['allow', 'deny', 'ask']

    // 按顺序遍历 `sourcesToClear` 中的source，逐个交给权限判定处理。
    for (const source of sourcesToClear) {
      // 按顺序遍历 `behaviors` 中的behavior，逐个交给权限判定处理。
      for (const behavior of behaviors) {
        // context更新为 `applyPermissionUpdate(context, {`，确保权限工具后续读取最新状态。
        context = applyPermissionUpdate(context, {
          type: 'replaceRules',
          rules: [],
          behavior,
          destination: source,
        })
      }
    }
  }

  // Clear all disk-based source:behavior combos before applying new rules.
  // Without this, removing a rule from settings (e.g. deleting a deny entry)
  // would leave the old rule in the context because convertRulesToUpdates
  // only generates replaceRules for source:behavior pairs that have rules —
  // an empty group produces no update, so stale rules persist.
  // diskSources 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const diskSources: PermissionUpdateDestination[] = [
    'userSettings',
    'projectSettings',
    'localSettings',
  ]
  // 按顺序遍历 `diskSources` 中的diskSource，逐个交给权限判定处理。
  for (const diskSource of diskSources) {
    // 按顺序遍历 `['allow', 'deny', 'ask'] as Per` 中的behavior，逐个交给权限判定处理。
    for (const behavior of ['allow', 'deny', 'ask'] as PermissionBehavior[]) {
      // context更新为 `applyPermissionUpdate(context, {`，确保权限工具后续读取最新状态。
      context = applyPermissionUpdate(context, {
        type: 'replaceRules',
        rules: [],
        behavior,
        destination: diskSource,
      })
    }
  }

  // updates 集合保存`convertRulesToUpdates`，供权限判定后续处理使用。
  const updates = convertRulesToUpdates(rules, 'replaceRules')
  // 返回 `applyPermissionUpdates(context, updates)`，作为权限判定这次计算的结果。
  return applyPermissionUpdates(context, updates)
}

/**
 * Extract updatedInput from a permission result, falling back to the original input.
 * Handles the case where some PermissionResult variants don't have updatedInput.
 */
// getUpdatedInputOrFallback 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getUpdatedInputOrFallback(
  permissionResult: PermissionResult,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    ('updatedInput' in permissionResult
      ? permissionResult.updatedInput
      : undefined) ?? fallback
  )
}
