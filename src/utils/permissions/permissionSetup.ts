// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { relative } from 'path'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getOriginalCwd,
  handleAutoModeTransition,
  handlePlanModeTransition,
  setHasExitedPlanMode,
  setNeedsAutoModeExitAttachment,
} from '../../bootstrap/state.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  ToolPermissionContext,
  ToolPermissionRulesBySource,
} from '../../Tool.js'
// 引入 getCwd，将 ../cwd.js 中已经封装好的能力接到本文件流程里。
import { getCwd } from '../cwd.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'
// 类型依赖 { SettingSource } 来自 ../settings/constants.js，用于校准权限判定的数据契约。
import type { SettingSource } from '../settings/constants.js'
// 引入 SETTING_SOURCES，将 ../settings/constants.js 中已经封装好的能力接到本文件流程里。
import { SETTING_SOURCES } from '../settings/constants.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsFilePathForSource,
  getUseAutoModeDuringPlan,
  hasAutoModeOptIn,
} from '../settings/settings.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  type PermissionMode,
  permissionModeFromString,
} from './PermissionMode.js'
// 引入 applyPermissionRulesToPermissionContext，将 ./permissions.js 中已经封装好的能力接到本文件流程里。
import { applyPermissionRulesToPermissionContext } from './permissions.js'
// 引入 loadAllPermissionRulesFromDisk，将 ./permissionsLoader.js 中已经封装好的能力接到本文件流程里。
import { loadAllPermissionRulesFromDisk } from './permissionsLoader.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// autoModeStateModule 状态保存`feature`，供权限判定后续处理使用。
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('./autoModeState.js') as typeof import('./autoModeState.js'))
  : null

// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { resolve } from 'path'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  checkSecurityRestrictionGate,
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE,
  getDynamicConfig_BLOCKS_ON_INIT,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from 'src/services/analytics/growthbook.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  addDirHelpMessage,
  validateDirectoryForWorkspace,
} from '../../commands/add-dir/validation.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js'
// 接入 BASH_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { BASH_TOOL_NAME } from '../../tools/BashTool/toolName.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 接入 POWERSHELL_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { POWERSHELL_TOOL_NAME } from '../../tools/PowerShellTool/toolName.js'
// 引入 getToolsForDefaultPreset、parseToolPreset，将 ../../tools.js 中已经封装好的能力接到本文件流程里。
import { getToolsForDefaultPreset, parseToolPreset } from '../../tools.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  getFsImplementation,
  safeResolvePath,
} from '../../utils/fsOperations.js'
// 引入 modelSupportsAutoMode，将 ../betas.js 中已经封装好的能力接到本文件流程里。
import { modelSupportsAutoMode } from '../betas.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 gracefulShutdown，将 ../gracefulShutdown.js 中已经封装好的能力接到本文件流程里。
import { gracefulShutdown } from '../gracefulShutdown.js'
// 引入 getMainLoopModel，将 ../model/model.js 中已经封装好的能力接到本文件流程里。
import { getMainLoopModel } from '../model/model.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  CROSS_PLATFORM_CODE_EXEC,
  DANGEROUS_BASH_PATTERNS,
} from './dangerousPatterns.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import type {
  PermissionRule,
  PermissionRuleSource,
  PermissionRuleValue,
} from './PermissionRule.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  type AdditionalWorkingDirectory,
  applyPermissionUpdate,
} from './PermissionUpdate.js'
// 类型依赖 { PermissionUpdateDestination } 来自 ./PermissionUpdateSchema.js，用于校准权限判定的数据契约。
import type { PermissionUpdateDestination } from './PermissionUpdateSchema.js'
// 整理这一组导入，让权限判定后续逻辑可以直接复用这些外部能力。
import {
  normalizeLegacyToolName,
  permissionRuleValueFromString,
  permissionRuleValueToString,
} from './permissionRuleParser.js'

/**
 * Checks if a Bash permission rule is dangerous for auto mode.
 * A rule is dangerous if it would auto-allow commands that execute arbitrary code,
 * bypassing the classifier's safety evaluation.
 *
 * Dangerous patterns:
 * 1. Tool-level allow (Bash with no ruleContent) - allows ALL commands
 * 2. Prefix rules for script interpreters (python:*, node:*, etc.)
 * 3. Wildcard rules matching interpreters (python*, node*, etc.)
 */
// isDangerousBashPermission 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDangerousBashPermission(
  toolName: string,
  ruleContent: string | undefined,
): boolean {
  // Only check Bash rules
  // `toolName` 与 `BASH_TOOL_NAME` 不一致时刷新派生状态，避免使用过期结果。
  if (toolName !== BASH_TOOL_NAME) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Tool-level allow (Bash with no content, or Bash(*)) - allows ALL commands
  // 只有 `ruleContent === undefined || ruleContent === ''` 满足时，权限判定才执行该分支。
  if (ruleContent === undefined || ruleContent === '') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 文本内容格式化`ruleContent.trim`，供权限判定后续处理使用。
  const content = ruleContent.trim().toLowerCase()

  // Standalone wildcard (*) matches everything
  // 当 `content` 匹配 `'*'` 时，权限判定执行对应分支。
  if (content === '*') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for dangerous patterns with prefix syntax (e.g., "python:*")
  // or wildcard syntax (e.g., "python*")
  // 按顺序遍历 `DANGEROUS_BASH_PATTERNS` 中的pattern，逐个交给权限判定处理。
  for (const pattern of DANGEROUS_BASH_PATTERNS) {
    // lowerPattern保存`pattern.toLowerCase`，供权限判定后续处理使用。
    const lowerPattern = pattern.toLowerCase()

    // Exact match to the pattern itself (e.g., "python" as a rule)
    // 满足 `content === lowerPattern` 时，权限判定执行该分支。
    if (content === lowerPattern) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Prefix syntax: "python:*" allows any python command
    // 当 `content` 匹配 ``${lowerPattern}:*`` 时，权限判定执行对应分支。
    if (content === `${lowerPattern}:*`) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Wildcard at end: "python*" matches python, python3, etc.
    // 当 `content` 匹配 ``${lowerPattern}*`` 时，权限判定执行对应分支。
    if (content === `${lowerPattern}*`) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Wildcard with space: "python *" would match "python script.py"
    // 当 `content` 匹配 ``${lowerPattern} *`` 时，权限判定执行对应分支。
    if (content === `${lowerPattern} *`) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Check for patterns like "python -*" which would match "python -c 'code'"
    // 只有 `content.startsWith(`${lowerPattern} -`) && content.endsWith('*')` 满足时，权限判定才执行该分支。
    if (content.startsWith(`${lowerPattern} -`) && content.endsWith('*')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if a PowerShell permission rule is dangerous for auto mode.
 * A rule is dangerous if it would auto-allow commands that execute arbitrary
 * code (nested shells, Invoke-Expression, Start-Process, etc.), bypassing the
 * classifier's safety evaluation.
 *
 * PowerShell is case-insensitive, so rule content is lowercased before matching.
 */
// isDangerousPowerShellPermission 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDangerousPowerShellPermission(
  toolName: string,
  ruleContent: string | undefined,
): boolean {
  // `toolName` 与 `POWERSHELL_TOOL_NAME` 不一致时刷新派生状态，避免使用过期结果。
  if (toolName !== POWERSHELL_TOOL_NAME) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Tool-level allow (PowerShell with no content, or PowerShell(*)) - allows ALL commands
  // 只有 `ruleContent === undefined || ruleContent === ''` 满足时，权限判定才执行该分支。
  if (ruleContent === undefined || ruleContent === '') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 文本内容格式化`ruleContent.trim`，供权限判定后续处理使用。
  const content = ruleContent.trim().toLowerCase()

  // Standalone wildcard (*) matches everything
  // 当 `content` 匹配 `'*'` 时，权限判定执行对应分支。
  if (content === '*') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // PS-specific cmdlet names. CROSS_PLATFORM_CODE_EXEC is shared with bash.
  // patterns 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const patterns: readonly string[] = [
    ...CROSS_PLATFORM_CODE_EXEC,
    // Nested PS + shells launchable from PS
    'pwsh',
    'powershell',
    'cmd',
    'wsl',
    // String/scriptblock evaluators
    'iex',
    'invoke-expression',
    'icm',
    'invoke-command',
    // Process spawners
    'start-process',
    'saps',
    'start',
    'start-job',
    'sajb',
    'start-threadjob', // bundled PS 6.1+; takes -ScriptBlock like Start-Job
    // Event/session code exec
    'register-objectevent',
    'register-engineevent',
    'register-wmievent',
    'register-scheduledjob',
    'new-pssession',
    'nsn', // alias
    'enter-pssession',
    'etsn', // alias
    // .NET escape hatches
    'add-type', // Add-Type -TypeDefinition '<C#>' → P/Invoke
    'new-object', // New-Object -ComObject WScript.Shell → .Run()
  ]

  // 按顺序遍历 `patterns` 中的pattern，逐个交给权限判定处理。
  for (const pattern of patterns) {
    // patterns stored lowercase; content lowercased above
    // 满足 `content === pattern` 时，权限判定执行该分支。
    if (content === pattern) return true
    // 当 `content` 匹配 ``${pattern}:*`` 时，权限判定执行对应分支。
    if (content === `${pattern}:*`) return true
    // 当 `content` 匹配 ``${pattern}*`` 时，权限判定执行对应分支。
    if (content === `${pattern}*`) return true
    // 当 `content` 匹配 ``${pattern} *`` 时，权限判定执行对应分支。
    if (content === `${pattern} *`) return true
    // 只有 `content.startsWith(`${pattern} -`) && content.endsWith('*')` 满足时，权限判定才执行该分支。
    if (content.startsWith(`${pattern} -`) && content.endsWith('*')) return true
    // .exe — goes on the FIRST word. `python` → `python.exe`.
    // `npm run` → `npm.exe run` (npm.exe is the real Windows binary name).
    // A rule like `PowerShell(npm.exe run:*)` needs to match `npm run`.
    // sp保存`pattern.indexOf`，供权限判定后续处理使用。
    const sp = pattern.indexOf(' ')
    // exe 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const exe =
      sp === -1
        ? `${pattern}.exe`
        : `${pattern.slice(0, sp)}.exe${pattern.slice(sp)}`
    // 满足 `content === exe` 时，权限判定执行该分支。
    if (content === exe) return true
    // 当 `content` 匹配 ``${exe}:*`` 时，权限判定执行对应分支。
    if (content === `${exe}:*`) return true
    // 当 `content` 匹配 ``${exe}*`` 时，权限判定执行对应分支。
    if (content === `${exe}*`) return true
    // 当 `content` 匹配 ``${exe} *`` 时，权限判定执行对应分支。
    if (content === `${exe} *`) return true
    // 只有 `content.startsWith(`${exe} -`) && content.endsWith('*')` 满足时，权限判定才执行该分支。
    if (content.startsWith(`${exe} -`) && content.endsWith('*')) return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Checks if an Agent (sub-agent) permission rule is dangerous for auto mode.
 * Any Agent allow rule would auto-approve sub-agent spawns before the auto mode classifier
 * can evaluate the sub-agent's prompt, defeating delegation attack prevention.
 */
// isDangerousTaskPermission 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDangerousTaskPermission(
  toolName: string,
  _ruleContent: string | undefined,
): boolean {
  // 返回 `normalizeLegacyToolName(toolName) === AGENT_TOOL_NAME`，作为权限判定这次计算的结果。
  return normalizeLegacyToolName(toolName) === AGENT_TOOL_NAME
}

// formatPermissionSource 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatPermissionSource(source: PermissionRuleSource): string {
  // 满足 `(SETTING_SOURCES as readonly string[]).includes(source)` 时，权限判定执行该分支。
  if ((SETTING_SOURCES as readonly string[]).includes(source)) {
    // 文件路径读取`getSettingsFilePathForSource`，供权限判定后续处理使用。
    const filePath = getSettingsFilePathForSource(source as SettingSource)
    // 满足 `filePath` 时，权限判定执行该分支。
    if (filePath) {
      // relativePath 路径数据保存`relative`，供权限判定后续处理使用。
      const relativePath = relative(getCwd(), filePath)
      // 返回 `relativePath.length < filePath.length ? relativePath : filePath`，作为权限判定这次计算的结果。
      return relativePath.length < filePath.length ? relativePath : filePath
    }
  }
  // 返回 `source`，作为权限判定这次计算的结果。
  return source
}

// DangerousPermissionInfo 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type DangerousPermissionInfo = {
  ruleValue: PermissionRuleValue
  source: PermissionRuleSource
  /** The permission rule formatted for display, e.g. "Bash(*)" or "Bash(python:*)" */
  ruleDisplay: string
  /** The source formatted for display, e.g. a file path or "--allowed-tools" */
  sourceDisplay: string
}

/**
 * Checks if a permission rule is dangerous for auto mode.
 * A rule is dangerous if it would auto-allow actions before the auto mode classifier
 * can evaluate them, bypassing safety checks.
 */
// isDangerousClassifierPermission 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isDangerousClassifierPermission(
  toolName: string,
  ruleContent: string | undefined,
): boolean {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，权限判定执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // Tmux send-keys executes arbitrary shell, bypassing the classifier same as Bash(*)
    // 当 `toolName` 匹配 `'Tmux'` 时，权限判定执行对应分支。
    if (toolName === 'Tmux') return true
  }
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    isDangerousBashPermission(toolName, ruleContent) ||
    isDangerousPowerShellPermission(toolName, ruleContent) ||
    isDangerousTaskPermission(toolName, ruleContent)
  )
}

/**
 * Finds all dangerous permissions from rules loaded from disk and CLI arguments.
 * Returns structured info about each dangerous permission found.
 *
 * Checks Bash permissions (wildcard/interpreter patterns), PowerShell permissions
 * (wildcard/iex/Start-Process patterns), and Agent permissions (any allow rule
 * bypasses the classifier's sub-agent evaluation).
 */
// findDangerousClassifierPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findDangerousClassifierPermissions(
  rules: PermissionRule[],
  cliAllowedTools: string[],
): DangerousPermissionInfo[] {
  // dangerous 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const dangerous: DangerousPermissionInfo[] = []

  // Check rules loaded from settings
  // 按顺序遍历 `rules` 中的rule，逐个交给权限判定处理。
  for (const rule of rules) {
    // 权限判定在这里按实际状态进入对应分支。
    if (
      rule.ruleBehavior === 'allow' &&
      isDangerousClassifierPermission(
        rule.ruleValue.toolName,
        rule.ruleValue.ruleContent,
      )
    ) {
      // ruleString 命名 `rule.ruleValue.ruleContent`，让后续代码直接表达这个值的用途。
      const ruleString = rule.ruleValue.ruleContent
        ? `${rule.ruleValue.toolName}(${rule.ruleValue.ruleContent})`
        : `${rule.ruleValue.toolName}(*)`
      // dangerous 集合追加新条目，保持收集顺序与输入顺序一致。
      dangerous.push({
        ruleValue: rule.ruleValue,
        source: rule.source,
        ruleDisplay: ruleString,
        sourceDisplay: formatPermissionSource(rule.source),
      })
    }
  }

  // Check CLI --allowed-tools arguments
  // 按顺序遍历 `cliAllowedTools` 中的toolSpec，逐个交给权限判定处理。
  for (const toolSpec of cliAllowedTools) {
    // Parse tool spec: "Bash" or "Bash(pattern)" or "Agent" or "Agent(subagent_type)"
    // match匹配`toolSpec.match`，供权限判定后续处理使用。
    const match = toolSpec.match(/^([^(]+)(?:\(([^)]*)\))?$/)
    // 满足 `match` 时，权限判定执行该分支。
    if (match) {
      // toolName格式化`trim`，供权限判定后续处理使用。
      const toolName = match[1]!.trim()
      // ruleContent格式化`trim`，供权限判定后续处理使用。
      const ruleContent = match[2]?.trim()

      // 满足 `isDangerousClassifierPermission(toolName, ruleContent)` 时，权限判定执行该分支。
      if (isDangerousClassifierPermission(toolName, ruleContent)) {
        // dangerous 集合追加新条目，保持收集顺序与输入顺序一致。
        dangerous.push({
          ruleValue: { toolName, ruleContent },
          source: 'cliArg',
          ruleDisplay: ruleContent ? toolSpec : `${toolName}(*)`,
          sourceDisplay: '--allowed-tools',
        })
      }
    }
  }

  // 返回 `dangerous`，作为权限判定这次计算的结果。
  return dangerous
}

/**
 * Checks if a Bash allow rule is overly broad (equivalent to YOLO mode).
 * Returns true for tool-level Bash allow rules with no content restriction,
 * which auto-allow every bash command.
 *
 * Matches: Bash, Bash(*), Bash() — all parse to { toolName: 'Bash' } with no ruleContent.
 */
// isOverlyBroadBashAllowRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOverlyBroadBashAllowRule(
  ruleValue: PermissionRuleValue,
): boolean {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    ruleValue.toolName === BASH_TOOL_NAME && ruleValue.ruleContent === undefined
  )
}

/**
 * PowerShell equivalent of isOverlyBroadBashAllowRule.
 *
 * Matches: PowerShell, PowerShell(*), PowerShell() — all parse to
 * { toolName: 'PowerShell' } with no ruleContent.
 */
// isOverlyBroadPowerShellAllowRule 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOverlyBroadPowerShellAllowRule(
  ruleValue: PermissionRuleValue,
): boolean {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    ruleValue.toolName === POWERSHELL_TOOL_NAME &&
    ruleValue.ruleContent === undefined
  )
}

/**
 * Finds all overly broad Bash allow rules from settings and CLI arguments.
 * An overly broad rule allows ALL bash commands (e.g., Bash or Bash(*)),
 * which is effectively equivalent to YOLO/bypass-permissions mode.
 */
// findOverlyBroadBashPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findOverlyBroadBashPermissions(
  rules: PermissionRule[],
  cliAllowedTools: string[],
): DangerousPermissionInfo[] {
  // overlyBroad 从空数组开始收集，后续循环会按处理顺序追加条目。
  const overlyBroad: DangerousPermissionInfo[] = []

  // 按顺序遍历 `rules` 中的rule，逐个交给权限判定处理。
  for (const rule of rules) {
    // 权限判定在这里按实际状态进入对应分支。
    if (
      rule.ruleBehavior === 'allow' &&
      isOverlyBroadBashAllowRule(rule.ruleValue)
    ) {
      // overlyBroad追加新条目，保持收集顺序与输入顺序一致。
      overlyBroad.push({
        ruleValue: rule.ruleValue,
        source: rule.source,
        ruleDisplay: `${BASH_TOOL_NAME}(*)`,
        sourceDisplay: formatPermissionSource(rule.source),
      })
    }
  }

  // 按顺序遍历 `cliAllowedTools` 中的toolSpec，逐个交给权限判定处理。
  for (const toolSpec of cliAllowedTools) {
    // 解析结果保存`permissionRuleValueFromString`，供权限判定后续处理使用。
    const parsed = permissionRuleValueFromString(toolSpec)
    // 满足 `isOverlyBroadBashAllowRule(parsed)` 时，权限判定执行该分支。
    if (isOverlyBroadBashAllowRule(parsed)) {
      // overlyBroad追加新条目，保持收集顺序与输入顺序一致。
      overlyBroad.push({
        ruleValue: parsed,
        source: 'cliArg',
        ruleDisplay: `${BASH_TOOL_NAME}(*)`,
        sourceDisplay: '--allowed-tools',
      })
    }
  }

  // 返回 `overlyBroad`，作为权限判定这次计算的结果。
  return overlyBroad
}

/**
 * PowerShell equivalent of findOverlyBroadBashPermissions.
 */
// findOverlyBroadPowerShellPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function findOverlyBroadPowerShellPermissions(
  rules: PermissionRule[],
  cliAllowedTools: string[],
): DangerousPermissionInfo[] {
  // overlyBroad 从空数组开始收集，后续循环会按处理顺序追加条目。
  const overlyBroad: DangerousPermissionInfo[] = []

  // 按顺序遍历 `rules` 中的rule，逐个交给权限判定处理。
  for (const rule of rules) {
    // 权限判定在这里按实际状态进入对应分支。
    if (
      rule.ruleBehavior === 'allow' &&
      isOverlyBroadPowerShellAllowRule(rule.ruleValue)
    ) {
      // overlyBroad追加新条目，保持收集顺序与输入顺序一致。
      overlyBroad.push({
        ruleValue: rule.ruleValue,
        source: rule.source,
        ruleDisplay: `${POWERSHELL_TOOL_NAME}(*)`,
        sourceDisplay: formatPermissionSource(rule.source),
      })
    }
  }

  // 按顺序遍历 `cliAllowedTools` 中的toolSpec，逐个交给权限判定处理。
  for (const toolSpec of cliAllowedTools) {
    // 解析结果保存`permissionRuleValueFromString`，供权限判定后续处理使用。
    const parsed = permissionRuleValueFromString(toolSpec)
    // 满足 `isOverlyBroadPowerShellAllowRule(parsed)` 时，权限判定执行该分支。
    if (isOverlyBroadPowerShellAllowRule(parsed)) {
      // overlyBroad追加新条目，保持收集顺序与输入顺序一致。
      overlyBroad.push({
        ruleValue: parsed,
        source: 'cliArg',
        ruleDisplay: `${POWERSHELL_TOOL_NAME}(*)`,
        sourceDisplay: '--allowed-tools',
      })
    }
  }

  // 返回 `overlyBroad`，作为权限判定这次计算的结果。
  return overlyBroad
}

/**
 * Type guard to check if a PermissionRuleSource is a valid PermissionUpdateDestination.
 * Sources like 'flagSettings', 'policySettings', and 'command' are not valid destinations.
 */
// isPermissionUpdateDestination 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isPermissionUpdateDestination(
  source: PermissionRuleSource,
): source is PermissionUpdateDestination {
  // 返回列表结果，保留权限判定已经排好的条目顺序。
  return [
    'userSettings',
    'projectSettings',
    'localSettings',
    'session',
    'cliArg',
  ].includes(source)
}

/**
 * Removes dangerous permissions from the in-memory context, and optionally
 * persists the removal to settings files on disk.
 */
// removeDangerousPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function removeDangerousPermissions(
  context: ToolPermissionContext,
  dangerousPermissions: DangerousPermissionInfo[],
): ToolPermissionContext {
  // Group dangerous rules by their source (destination for updates)
  // rulesBySource构建`new Map<` 整理出中间结果，供权限判定权限工具 permission Setup后续步骤使用。
  const rulesBySource = new Map<
    PermissionUpdateDestination,
    PermissionRuleValue[]
  >()
  // 按顺序遍历 `dangerousPermissions` 中的perm，逐个交给权限判定处理。
  for (const perm of dangerousPermissions) {
    // Skip sources that can't be persisted (flagSettings, policySettings, command)
    // 满足 `!isPermissionUpdateDestination(perm.source)` 时，权限判定执行该分支。
    if (!isPermissionUpdateDestination(perm.source)) {
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue
    }
    // destination保存`perm.source`，供权限判定权限工具 permission Setup后续判断或输出使用。
    const destination = perm.source
    // existing读取`rulesBySource.get`，供权限判定后续处理使用。
    const existing = rulesBySource.get(destination) || []
    // existing追加新条目，保持收集顺序与输入顺序一致。
    existing.push(perm.ruleValue)
    // rulesBySource.set 写入新的状态值，使权限判定后续读取保持一致。
    rulesBySource.set(destination, existing)
  }

  // updatedContext 命名 `context`，让后续代码直接表达这个值的用途。
  let updatedContext = context
  // 循环处理 `const [destination, rules] of rulesBySource`，让权限判定逐项把同类条目按顺序走完。
  for (const [destination, rules] of rulesBySource) {
    // updatedContext更新为 `applyPermissionUpdate(updatedContext, {`，确保权限工具后续读取最新状态。
    updatedContext = applyPermissionUpdate(updatedContext, {
      type: 'removeRules' as const,
      rules,
      behavior: 'allow' as const,
      destination,
    })
  }

  // 返回 `updatedContext`，作为权限判定这次计算的结果。
  return updatedContext
}

/**
 * Prepares a ToolPermissionContext for auto mode by stripping
 * dangerous permissions that would bypass the classifier.
 * Returns the cleaned context (with mode unchanged — caller sets the mode).
 */
// stripDangerousPermissionsForAutoMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripDangerousPermissionsForAutoMode(
  context: ToolPermissionContext,
): ToolPermissionContext {
  // rules 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const rules: PermissionRule[] = []
  // 调用 for，触发权限判定此处需要的副作用。
  for (const [source, ruleStrings] of Object.entries(
    context.alwaysAllowRules,
  )) {
    // ruleStrings 集合缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!ruleStrings) {
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue
    }
    // 按顺序遍历 `ruleStrings` 中的ruleString，逐个交给权限判定处理。
    for (const ruleString of ruleStrings) {
      // ruleValue保存`permissionRuleValueFromString`，供权限判定后续处理使用。
      const ruleValue = permissionRuleValueFromString(ruleString)
      // rules 集合追加新条目，保持收集顺序与输入顺序一致。
      rules.push({
        source: source as PermissionRuleSource,
        ruleBehavior: 'allow',
        ruleValue,
      })
    }
  }
  // dangerousPermissions 权限数据筛选`findDangerousClassifierPermissions`，供权限判定后续处理使用。
  const dangerousPermissions = findDangerousClassifierPermissions(rules, [])
  // dangerousPermissions 权限数据为空时立即返回或跳过，避免权限判定把空集合当成可处理内容。
  if (dangerousPermissions.length === 0) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      ...context,
      strippedDangerousRules: context.strippedDangerousRules ?? {},
    }
  }
  // 按顺序遍历 `dangerousPermissions` 中的permission 权限数据，逐个交给权限判定处理。
  for (const permission of dangerousPermissions) {
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Ignoring dangerous permission ${permission.ruleDisplay} from ${permission.sourceDisplay} (bypasses classifier)`,
    )
  }
  // Mirror removeDangerousPermissions' source filter so stash == what was actually removed.
  // stripped 从空对象开始收集键值，后续按名称补齐内容。
  const stripped: ToolPermissionRulesBySource = {}
  // 按顺序遍历 `dangerousPermissions` 中的perm，逐个交给权限判定处理。
  for (const perm of dangerousPermissions) {
    // 满足 `!isPermissionUpdateDestination(perm.source)` 时，权限判定执行该分支。
    if (!isPermissionUpdateDestination(perm.source)) continue
    // 权限工具 permission Setup在这里处理 `;(stripped[perm.source] ??= []).push(`，完成这一小步状态转换。
    ;(stripped[perm.source] ??= []).push(
      permissionRuleValueToString(perm.ruleValue),
    )
  }
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    ...removeDangerousPermissions(context, dangerousPermissions),
    strippedDangerousRules: stripped,
  }
}

/**
 * Restores dangerous allow rules previously stashed by
 * stripDangerousPermissionsForAutoMode. Called when leaving auto mode so that
 * the user's Bash(python:*), Agent(*), etc. rules work again in default mode.
 * Clears the stash so a second exit is a no-op.
 */
// restoreDangerousPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function restoreDangerousPermissions(
  context: ToolPermissionContext,
): ToolPermissionContext {
  // stash 命名 `context.strippedDangerousRules`，让后续代码直接表达这个值的用途。
  const stash = context.strippedDangerousRules
  // stash缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!stash) {
    // 返回 `context`，作为权限判定这次计算的结果。
    return context
  }
  // 结果保存`context`，供权限判定权限工具 permission Setup后续判断或输出使用。
  let result = context
  // 循环处理 `const [source, ruleStrings] of Object.entries(stash)`，让权限判定把同类条目按顺序走完。
  for (const [source, ruleStrings] of Object.entries(stash)) {
    // !ruleStrings || ruleStrings 集合为空时立即返回或跳过，避免权限判定把空集合当成可处理内容。
    if (!ruleStrings || ruleStrings.length === 0) continue
    // 结果更新为 `applyPermissionUpdate(result, {`，确保权限工具后续读取最新状态。
    result = applyPermissionUpdate(result, {
      type: 'addRules',
      rules: ruleStrings.map(permissionRuleValueFromString),
      behavior: 'allow',
      destination: source as PermissionUpdateDestination,
    })
  }
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { ...result, strippedDangerousRules: undefined }
}

/**
 * Handles all state transitions when switching permission modes.
 * Centralises side-effects so that every activation path (CLI Shift+Tab,
 * SDK control messages, etc.) behaves identically.
 *
 * Currently handles:
 * - Plan mode enter/exit attachments (via handlePlanModeTransition)
 * - Auto mode activation: setAutoModeActive, stripDangerousPermissionsForAutoMode
 *
 * Returns the (possibly modified) context. Caller is responsible for setting
 * the mode on the returned context.
 *
 * @param fromMode The current permission mode
 * @param toMode The target permission mode
 * @param context The current tool permission context
 */
// transitionPermissionMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function transitionPermissionMode(
  fromMode: string,
  toMode: string,
  context: ToolPermissionContext,
): ToolPermissionContext {
  // plan→plan (SDK set_permission_mode) would wrongly hit the leave branch below
  // 满足 `fromMode === toMode` 时，权限判定执行该分支。
  if (fromMode === toMode) return context

  // 调用 handlePlanModeTransition，触发权限判定此处需要的副作用。
  handlePlanModeTransition(fromMode, toMode)
  // 调用 handleAutoModeTransition，触发权限判定此处需要的副作用。
  handleAutoModeTransition(fromMode, toMode)

  // 当 `fromMode` 匹配 `'plan' && toMode !== 'plan'` 时，权限判定执行对应分支。
  if (fromMode === 'plan' && toMode !== 'plan') {
    // setHasExitedPlanMode 写入新的状态值，使权限判定后续读取保持一致。
    setHasExitedPlanMode(true)
  }

  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // 当 `toMode` 匹配 `'plan' && fromMode !== 'pla...` 时，权限判定执行对应分支。
    if (toMode === 'plan' && fromMode !== 'plan') {
      // 返回 `prepareContextForPlanMode(context)`，作为权限判定这次计算的结果。
      return prepareContextForPlanMode(context)
    }

    // Plan with auto active counts as using the classifier (for the leaving side).
    // isAutoModeActive() is the authoritative signal — prePlanMode/strippedDangerousRules
    // are unreliable proxies because auto can be deactivated mid-plan (non-opt-in
    // entry, transitionPlanAutoMode) while those fields remain set/unset.
    // fromUsesClassifier 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const fromUsesClassifier =
      fromMode === 'auto' ||
      (fromMode === 'plan' &&
        (autoModeStateModule?.isAutoModeActive() ?? false))
    // toUsesClassifier标记权限判定权限工具 permission Setup是否启用对应路径。
    const toUsesClassifier = toMode === 'auto' // plan entry handled above

    // 只有 `toUsesClassifier && !fromUsesClassifier` 满足时，权限判定才执行该分支。
    if (toUsesClassifier && !fromUsesClassifier) {
      // 满足 `!isAutoModeGateEnabled()` 时，权限判定执行该分支。
      if (!isAutoModeGateEnabled()) {
        // 抛出 new Error('Cannot transition to auto mode: gate is not enabled')，阻止权限判定在无效状态下继续运行。
        throw new Error('Cannot transition to auto mode: gate is not enabled')
      }
      // 调用 autoModeStateModule?.setAutoModeActive(true)，完成这一处局部操作。
      autoModeStateModule?.setAutoModeActive(true)
      // context更新为 `stripDangerousPermissionsForAutoMode(context)`，确保权限工具后续读取最新状态。
      context = stripDangerousPermissionsForAutoMode(context)
    // 权限工具 permission Setup在这里处理 `} else if (fromUsesClassifier && !toUsesClassifier) {`，完成这一小步状态转换。
    } else if (fromUsesClassifier && !toUsesClassifier) {
      // 调用 autoModeStateModule?.setAutoModeActive(false)，完成这一处局部操作。
      autoModeStateModule?.setAutoModeActive(false)
      // setNeedsAutoModeExitAttachment 写入新的状态值，使权限判定后续读取保持一致。
      setNeedsAutoModeExitAttachment(true)
      // context更新为 `restoreDangerousPermissions(context)`，确保权限工具后续读取最新状态。
      context = restoreDangerousPermissions(context)
    }
  }

  // Only spread if there's something to clear (preserves ref equality)
  // `fromMode === 'plan' && toMode` 与 `'plan' && conte` 不一致时刷新派生状态，避免使用过期结果。
  if (fromMode === 'plan' && toMode !== 'plan' && context.prePlanMode) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { ...context, prePlanMode: undefined }
  }

  // 返回 `context`，作为权限判定这次计算的结果。
  return context
}

/**
 * Parse base tools specification from CLI
 * Handles both preset names (default, none) and custom tool lists
 */
// parseBaseToolsFromCLI 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseBaseToolsFromCLI(baseTools: string[]): string[] {
  // Join all array elements and check if it's a single preset name
  // joinedInput格式化`baseTools.join`，供权限判定后续处理使用。
  const joinedInput = baseTools.join(' ').trim()
  // preset解析`parseToolPreset`，供权限判定后续处理使用。
  const preset = parseToolPreset(joinedInput)

  // 满足 `preset` 时，权限判定执行该分支。
  if (preset) {
    // 返回 `getToolsForDefaultPreset()`，作为权限判定这次计算的结果。
    return getToolsForDefaultPreset()
  }

  // Parse as a custom tool list using the same parsing logic as allowedTools/disallowedTools
  // parsedTools 集合解析`parseToolListFromCLI`，供权限判定后续处理使用。
  const parsedTools = parseToolListFromCLI(baseTools)

  // 返回 `parsedTools`，作为权限判定这次计算的结果。
  return parsedTools
}

/**
 * Check if processPwd is a symlink that resolves to originalCwd
 */
// isSymlinkTo 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSymlinkTo({
  processPwd,
  originalCwd,
}: {
  processPwd: string
  originalCwd: string
}): boolean {
  // Use safeResolvePath to check if processPwd is a symlink and get its resolved path
  // 权限工具 permission Setup先整理这一处局部数据，后续分支可以直接读取。
  const { resolvedPath: resolvedProcessPwd, isSymlink: isProcessPwdSymlink } =
    safeResolvePath(getFsImplementation(), processPwd)

  // 返回 `isProcessPwdSymlink`，作为权限判定这次计算的结果。
  return isProcessPwdSymlink
    ? resolvedProcessPwd === resolve(originalCwd)
    : false
}

/**
 * Safely convert CLI flags to a PermissionMode
 */
// initialPermissionModeFromCLI 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function initialPermissionModeFromCLI({
  permissionModeCli,
  dangerouslySkipPermissions,
}: {
  permissionModeCli: string | undefined
  dangerouslySkipPermissions: boolean | undefined
}): { mode: PermissionMode; notification?: string } {
  // settings 集合读取`getSettings_DEPRECATED`，供权限判定后续处理使用。
  const settings = getSettings_DEPRECATED() || {}

  // Check GrowthBook gate first - highest precedence
  // growthBookDisableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const growthBookDisableBypassPermissionsMode =
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
      'tengu_disable_bypass_permissions_mode',
    )

  // Then check settings - lower precedence
  // settingsDisableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const settingsDisableBypassPermissionsMode =
    settings.permissions?.disableBypassPermissionsMode === 'disable'

  // Statsig gate takes precedence over settings
  // disableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const disableBypassPermissionsMode =
    growthBookDisableBypassPermissionsMode ||
    settingsDisableBypassPermissionsMode

  // Sync circuit-breaker check (cached GB read). Prevents the
  // AutoModeOptInDialog from showing in showSetupScreens() when auto can't
  // actually be entered. autoModeFlagCli still carries intent through to
  // verifyAutoModeGateAccess, which notifies the user why.
  // autoModeCircuitBrokenSync保存`feature`，供权限判定后续处理使用。
  const autoModeCircuitBrokenSync = feature('TRANSCRIPT_CLASSIFIER')
    ? getAutoModeEnabledStateIfCached() === 'disabled'
    : false

  // Modes in order of priority
  // orderedModes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const orderedModes: PermissionMode[] = []
  // notification 先占位，稍后的条件分支会根据实际输入补齐它。
  let notification: string | undefined

  // 满足 `dangerouslySkipPermissions` 时，权限判定执行该分支。
  if (dangerouslySkipPermissions) {
    // orderedModes 集合追加新条目，保持收集顺序与输入顺序一致。
    orderedModes.push('bypassPermissions')
  }
  // 满足 `permissionModeCli` 时，权限判定执行该分支。
  if (permissionModeCli) {
    // parsedMode保存`permissionModeFromString`，供权限判定后续处理使用。
    const parsedMode = permissionModeFromString(permissionModeCli)
    // 当 `feature('TRANSCRIPT_CLASSIFIER') && parsedM...` 匹配 `'auto'` 时，权限判定执行对应分支。
    if (feature('TRANSCRIPT_CLASSIFIER') && parsedMode === 'auto') {
      // 满足 `autoModeCircuitBrokenSync` 时，权限判定执行该分支。
      if (autoModeCircuitBrokenSync) {
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'auto mode circuit breaker active (cached) — falling back to default',
          { level: 'warn' },
        )
      } else {
        // orderedModes 集合追加新条目，保持收集顺序与输入顺序一致。
        orderedModes.push('auto')
      }
    } else {
      // orderedModes 集合追加新条目，保持收集顺序与输入顺序一致。
      orderedModes.push(parsedMode)
    }
  }
  // 满足 `settings.permissions?.defaultMode` 时，权限判定执行该分支。
  if (settings.permissions?.defaultMode) {
    // settingsMode 命名 `settings.permissions.defaultMode as PermissionMode`，让后续代码直接表达这个值的用途。
    const settingsMode = settings.permissions.defaultMode as PermissionMode
    // CCR only supports acceptEdits and plan — ignore other defaultModes from
    // settings (e.g. bypassPermissions would otherwise silently grant full
    // access in a remote environment).
    // 权限判定在这里按实际状态进入对应分支。
    if (
      isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) &&
      !['acceptEdits', 'plan', 'default'].includes(settingsMode)
    ) {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `settings defaultMode "${settingsMode}" is not supported in CLAUDE_CODE_REMOTE — only acceptEdits and plan are allowed`,
        { level: 'warn' },
      )
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_ccr_unsupported_default_mode_ignored', {
        mode: settingsMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
    }
    // auto from settings requires the same gate check as from CLI
    else if (feature('TRANSCRIPT_CLASSIFIER') && settingsMode === 'auto') {
      // 满足 `autoModeCircuitBrokenSync` 时，权限判定执行该分支。
      if (autoModeCircuitBrokenSync) {
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'auto mode circuit breaker active (cached) — falling back to default',
          { level: 'warn' },
        )
      } else {
        // orderedModes 集合追加新条目，保持收集顺序与输入顺序一致。
        orderedModes.push('auto')
      }
    } else {
      // orderedModes 集合追加新条目，保持收集顺序与输入顺序一致。
      orderedModes.push(settingsMode)
    }
  }

  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let result: { mode: PermissionMode; notification?: string } | undefined

  // 按顺序遍历 `orderedModes` 中的mode，逐个交给权限判定处理。
  for (const mode of orderedModes) {
    // 只有 `mode === 'bypassPermissions' && disableBypassPerm` 满足时，权限判定才执行该分支。
    if (mode === 'bypassPermissions' && disableBypassPermissionsMode) {
      // 满足 `growthBookDisableBypassPermissionsMode` 时，权限判定执行该分支。
      if (growthBookDisableBypassPermissionsMode) {
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging('bypassPermissions mode is disabled by Statsig gate', {
          level: 'warn',
        })
        // 权限工具 permission Setup在这里处理 `notification =`，完成这一小步状态转换。
        notification =
          'Bypass permissions mode was disabled by your organization policy'
      } else {
        // 记录权限判定运行诊断，方便排查异常路径或性能问题。
        logForDebugging('bypassPermissions mode is disabled by settings', {
          level: 'warn',
        })
        // notification更新为 `'Bypass permissions mode was disabled by settings'`，确保权限工具后续读取最新状态。
        notification = 'Bypass permissions mode was disabled by settings'
      }
      // 跳过当前项，继续处理权限判定中的下一轮循环。
      continue // Skip this mode if it's disabled
    }

    // 结果更新为 `{ mode, notification } // Use the first valid mode`，确保权限工具后续读取最新状态。
    result = { mode, notification } // Use the first valid mode
    // 结束这个分支或循环，避免权限判定继续落入后续路径。
    break
  }

  // 结果缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!result) {
    // 结果更新为 `{ mode: 'default', notification }`，确保权限工具后续读取最新状态。
    result = { mode: 'default', notification }
  }

  // 结果缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!result) {
    // 结果更新为 `{ mode: 'default', notification }`，确保权限工具后续读取最新状态。
    result = { mode: 'default', notification }
  }

  // 当 `feature('TRANSCRIPT_CLASSIFIER') && result....` 匹配 `'auto'` 时，权限判定执行对应分支。
  if (feature('TRANSCRIPT_CLASSIFIER') && result.mode === 'auto') {
    // 调用 autoModeStateModule?.setAutoModeActive(true)，完成这一处局部操作。
    autoModeStateModule?.setAutoModeActive(true)
  }

  // 返回 `result`，作为权限判定这次计算的结果。
  return result
}

// parseToolListFromCLI 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseToolListFromCLI(tools: string[]): string[] {
  // tools 集合为空时立即返回或跳过，避免权限判定把空集合当成可处理内容。
  if (tools.length === 0) {
    // 返回列表结果，保留权限判定已经排好的条目顺序。
    return []
  }

  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: string[] = []

  // Process each string in the array
  // 按顺序遍历 `tools` 中的toolString，逐个交给权限判定处理。
  for (const toolString of tools) {
    // toolString缺失时直接走兜底路径，避免权限判定使用无效输入。
    if (!toolString) continue

    // current保存`''`，作为后续固定文本处理的输入。
    let current = ''
    // isInParens 集合标记权限判定权限工具 permission Setup是否启用对应路径。
    let isInParens = false

    // Parse each character in the string
    // 按顺序遍历 `toolString` 中的char，逐个交给权限判定处理。
    for (const char of toolString) {
      // 按照 char 的取值选择权限判定的具体处理分支。
      switch (char) {
        case '(':
          // isInParens 集合更新为 `true`，确保权限工具后续读取最新状态。
          isInParens = true
          // 权限工具 permission Setup在这里处理 `current += char`，完成这一小步状态转换。
          current += char
          // 结束这个分支或循环，避免权限判定继续落入后续路径。
          break
        case ')':
          // isInParens 集合更新为 `false`，确保权限工具后续读取最新状态。
          isInParens = false
          // 权限工具 permission Setup在这里处理 `current += char`，完成这一小步状态转换。
          current += char
          // 结束这个分支或循环，避免权限判定继续落入后续路径。
          break
        case ',':
          // 满足 `isInParens` 时，权限判定执行该分支。
          if (isInParens) {
            // 权限工具 permission Setup在这里处理 `current += char`，完成这一小步状态转换。
            current += char
          } else {
            // Comma separator - push current tool and start new one
            // 满足 `current.trim()` 时，权限判定执行该分支。
            if (current.trim()) {
              // 结果追加新条目，保持收集顺序与输入顺序一致。
              result.push(current.trim())
            }
            // current更新为 `''`，确保权限工具后续读取最新状态。
            current = ''
          }
          // 结束这个分支或循环，避免权限判定继续落入后续路径。
          break
        case ' ':
          // 满足 `isInParens` 时，权限判定执行该分支。
          if (isInParens) {
            // 权限工具 permission Setup在这里处理 `current += char`，完成这一小步状态转换。
            current += char
          // 权限工具 permission Setup在这里处理 `} else if (current.trim()) {`，完成这一小步状态转换。
          } else if (current.trim()) {
            // Space separator - push current tool and start new one
            // 结果追加新条目，保持收集顺序与输入顺序一致。
            result.push(current.trim())
            // current更新为 `''`，确保权限工具后续读取最新状态。
            current = ''
          }
          // 结束这个分支或循环，避免权限判定继续落入后续路径。
          break
        default:
          // 权限工具 permission Setup在这里处理 `current += char`，完成这一小步状态转换。
          current += char
      }
    }

    // Push any remaining tool
    // 满足 `current.trim()` 时，权限判定执行该分支。
    if (current.trim()) {
      // 结果追加新条目，保持收集顺序与输入顺序一致。
      result.push(current.trim())
    }
  }

  // 返回 `result`，作为权限判定这次计算的结果。
  return result
}

// initializeToolPermissionContext 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function initializeToolPermissionContext({
  allowedToolsCli,
  disallowedToolsCli,
  baseToolsCli,
  permissionMode,
  allowDangerouslySkipPermissions,
  addDirs,
}: {
  allowedToolsCli: string[]
  disallowedToolsCli: string[]
  baseToolsCli?: string[]
  permissionMode: PermissionMode
  allowDangerouslySkipPermissions: boolean
  addDirs: string[]
}): Promise<{
  toolPermissionContext: ToolPermissionContext
  warnings: string[]
  dangerousPermissions: DangerousPermissionInfo[]
  overlyBroadBashPermissions: DangerousPermissionInfo[]
}> {
  // Parse comma-separated allowed and disallowed tools if provided
  // Normalize legacy tool names (e.g., 'Task' → 'Agent') so that in-memory
  // rule removal in stripDangerousPermissionsForAutoMode matches correctly.
  // parsedAllowedToolsCli解析`parseToolListFromCLI`，供权限判定后续处理使用。
  const parsedAllowedToolsCli = parseToolListFromCLI(allowedToolsCli).map(
    // rule更新为 `> permissionRuleValueToString(permissionRuleValueFromStri...`，确保权限工具后续读取最新状态。
    rule => permissionRuleValueToString(permissionRuleValueFromString(rule)),
  )
  // parsedDisallowedToolsCli解析`parseToolListFromCLI`，供权限判定后续处理使用。
  let parsedDisallowedToolsCli = parseToolListFromCLI(disallowedToolsCli)

  // If base tools are specified, automatically deny all tools NOT in the base set
  // We need to check if base tools were explicitly provided (not just empty default)
  // 只有 `baseToolsCli && baseToolsCli.length > 0` 满足时，权限判定才执行该分支。
  if (baseToolsCli && baseToolsCli.length > 0) {
    // baseToolsResult解析`parseBaseToolsFromCLI`，供权限判定后续处理使用。
    const baseToolsResult = parseBaseToolsFromCLI(baseToolsCli)
    // Normalize legacy tool names (e.g., 'Task' → 'Agent') so user-provided
    // base tool lists using old names still match canonical names.
    // baseToolsSet保存`Set`，供权限判定后续处理使用。
    const baseToolsSet = new Set(baseToolsResult.map(normalizeLegacyToolName))
    // allToolNames 集合读取`getToolsForDefaultPreset`，供权限判定后续处理使用。
    const allToolNames = getToolsForDefaultPreset()
    // toolsToDisallow筛选`allToolNames.filter`，供权限判定后续处理使用。
    const toolsToDisallow = allToolNames.filter(tool => !baseToolsSet.has(tool))
    // parsedDisallowedToolsCli更新为 `[...parsedDisallowedToolsCli, ...toolsToDisallow]`，确保权限工具后续读取最新状态。
    parsedDisallowedToolsCli = [...parsedDisallowedToolsCli, ...toolsToDisallow]
  }

  // 警告列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const warnings: string[] = []
  // additionalWorkingDirectories 集合构建`new Map<`，供后续判断或组装使用。
  const additionalWorkingDirectories = new Map<
    string,
    AdditionalWorkingDirectory
  >()
  // process.env.PWD may be a symlink, while getOriginalCwd() uses the real path
  // processPwd 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const processPwd = process.env.PWD
  // 权限判定在这里按实际状态进入对应分支。
  if (
    processPwd &&
    processPwd !== getOriginalCwd() &&
    isSymlinkTo({ originalCwd: getOriginalCwd(), processPwd })
  ) {
    // additionalWorkingDirectories.set 写入新的状态值，使权限判定后续读取保持一致。
    additionalWorkingDirectories.set(processPwd, {
      path: processPwd,
      source: 'session',
    })
  }

  // Check if bypassPermissions mode is available (not disabled by Statsig gate or settings)
  // Use cached values to avoid blocking on startup
  // growthBookDisableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const growthBookDisableBypassPermissionsMode =
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
      'tengu_disable_bypass_permissions_mode',
    )
  // settings 集合读取`getSettings_DEPRECATED`，供权限判定后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // settingsDisableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const settingsDisableBypassPermissionsMode =
    settings.permissions?.disableBypassPermissionsMode === 'disable'
  // isBypassPermissionsModeAvailable 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isBypassPermissionsModeAvailable =
    (permissionMode === 'bypassPermissions' ||
      allowDangerouslySkipPermissions) &&
    !growthBookDisableBypassPermissionsMode &&
    !settingsDisableBypassPermissionsMode

  // Load all permission rules from disk
  // rulesFromDisk读取`loadAllPermissionRulesFromDisk`，供权限判定后续处理使用。
  const rulesFromDisk = loadAllPermissionRulesFromDisk()

  // Ant-only: Detect overly broad shell allow rules for all modes.
  // Bash(*) or PowerShell(*) are equivalent to YOLO mode for that shell.
  // Skip in CCR/BYOC where --allowed-tools is the intended pre-approval mechanism.
  // Variable name kept for return-field compat; contains both shells.
  // overlyBroadBashPermissions 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  let overlyBroadBashPermissions: DangerousPermissionInfo[] = []
  // 权限判定在这里按实际状态进入对应分支。
  if (
    process.env.USER_TYPE === 'ant' &&
    !isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) &&
    process.env.CLAUDE_CODE_ENTRYPOINT !== 'local-agent'
  ) {
    // overlyBroadBashPermissions 权限数据更新为 `[`，确保权限工具后续读取最新状态。
    overlyBroadBashPermissions = [
      ...findOverlyBroadBashPermissions(rulesFromDisk, parsedAllowedToolsCli),
      ...findOverlyBroadPowerShellPermissions(
        rulesFromDisk,
        parsedAllowedToolsCli,
      ),
    ]
  }

  // Ant-only: Detect dangerous shell permissions for auto mode
  // Dangerous permissions (like Bash(*), Bash(python:*), PowerShell(iex:*)) would auto-allow
  // before the classifier can evaluate them, defeating the purpose of safer YOLO mode
  // dangerousPermissions 权限数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  let dangerousPermissions: DangerousPermissionInfo[] = []
  // 当 `feature('TRANSCRIPT_CLASSIFIER') && permiss...` 匹配 `'auto'` 时，权限判定执行对应分支。
  if (feature('TRANSCRIPT_CLASSIFIER') && permissionMode === 'auto') {
    // dangerousPermissions 权限数据更新为 `findDangerousClassifierPermissions(`，确保权限工具后续读取最新状态。
    dangerousPermissions = findDangerousClassifierPermissions(
      rulesFromDisk,
      parsedAllowedToolsCli,
    )
  }

  // toolPermissionContext 权限数据保存`applyPermissionRulesToPermissionContext`，供权限判定后续处理使用。
  let toolPermissionContext = applyPermissionRulesToPermissionContext(
    {
      mode: permissionMode,
      additionalWorkingDirectories,
      alwaysAllowRules: { cliArg: parsedAllowedToolsCli },
      alwaysDenyRules: { cliArg: parsedDisallowedToolsCli },
      alwaysAskRules: {},
      isBypassPermissionsModeAvailable,
      ...(feature('TRANSCRIPT_CLASSIFIER')
        ? { isAutoModeAvailable: isAutoModeGateEnabled() }
        : {}),
    },
    rulesFromDisk,
  )

  // Add directories from settings and --add-dir
  // allAdditionalDirectories 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const allAdditionalDirectories = [
    ...(settings.permissions?.additionalDirectories || []),
    ...addDirs,
  ]
  // Parallelize fs validation; apply updates serially (cumulative context).
  // validateDirectoryForWorkspace only reads permissionContext to check if the
  // dir is already covered — behavioral difference from parallelizing is benign
  // (two overlapping --add-dirs both succeed instead of one being flagged
  // alreadyInWorkingDirectory, which was silently skipped anyway).
  // validationResults 集合保存`Promise.all`，供权限判定后续处理使用。
  const validationResults = await Promise.all(
    // 调用 allAdditionalDirectories.map，触发权限判定此处需要的副作用。
    allAdditionalDirectories.map(dir =>
      validateDirectoryForWorkspace(dir, toolPermissionContext),
    ),
  )
  // 按顺序遍历 `validationResults` 中的结果，逐个交给权限判定处理。
  for (const result of validationResults) {
    // 当 `result.resultType` 匹配 `'success'` 时，权限判定执行对应分支。
    if (result.resultType === 'success') {
      // toolPermissionContext 权限数据更新为 `applyPermissionUpdate(toolPermissionContext, {`，确保权限工具后续读取最新状态。
      toolPermissionContext = applyPermissionUpdate(toolPermissionContext, {
        type: 'addDirectories',
        directories: [result.absolutePath],
        destination: 'cliArg',
      })
    // 权限工具 permission Setup在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      result.resultType !== 'alreadyInWorkingDirectory' &&
      result.resultType !== 'pathNotFound'
    ) {
      // Warn for actual config mistakes (e.g. specifying a file instead of a
      // directory). But if the directory doesn't exist anymore (e.g. someone
      // was working under /tmp and it got cleared), silently skip. They'll get
      // prompted again if they try to access it later.
      // 警告列表追加新条目，保持收集顺序与输入顺序一致。
      warnings.push(addDirHelpMessage(result))
    }
  }

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    toolPermissionContext,
    warnings,
    dangerousPermissions,
    overlyBroadBashPermissions,
  }
}

// AutoModeGateCheckResult 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoModeGateCheckResult = {
  // Transform function (not a pre-computed context) so callers can apply it
  // inside setAppState(prev => ...) against the CURRENT context. Pre-computing
  // the context here captured a stale snapshot: the async GrowthBook await
  // below can be outrun by a mid-turn shift-tab, and returning
  // { ...currentContext, ... } would overwrite the user's mode change.
  // 这个回调绑定到 updateContext: (ctx: ToolPermissionContext) => ToolPermissionContext，负责权限判定在该局部场景下的响应。
  updateContext: (ctx: ToolPermissionContext) => ToolPermissionContext
  notification?: string
}

// AutoModeUnavailableReason 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoModeUnavailableReason = 'settings' | 'circuit-breaker' | 'model'

// getAutoModeUnavailableNotification 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeUnavailableNotification(
  reason: AutoModeUnavailableReason,
): string {
  // base 先占位，稍后的条件分支会根据实际输入补齐它。
  let base: string
  // 按照 reason 的取值选择权限判定的具体处理分支。
  switch (reason) {
    case 'settings':
      // base更新为 `'auto mode disabled by settings'`，确保权限工具后续读取最新状态。
      base = 'auto mode disabled by settings'
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    case 'circuit-breaker':
      // base更新为 `'auto mode is unavailable for your plan'`，确保权限工具后续读取最新状态。
      base = 'auto mode is unavailable for your plan'
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
    case 'model':
      // base更新为 `'auto mode unavailable for this model'`，确保权限工具后续读取最新状态。
      base = 'auto mode unavailable for this model'
      // 结束这个分支或循环，避免权限判定继续落入后续路径。
      break
  }
  // 返回 `process.env.USER_TYPE === 'ant'`，作为权限判定这次计算的结果。
  return process.env.USER_TYPE === 'ant'
    ? `${base} · #claude-code-feedback`
    : base
}

/**
 * Async check of auto mode availability.
 *
 * Returns a transform function (not a pre-computed context) that callers
 * apply inside setAppState(prev => ...) against the CURRENT context. This
 * prevents the async GrowthBook await from clobbering mid-turn mode changes
 * (e.g., user shift-tabs to acceptEdits while this check is in flight).
 *
 * The transform re-checks mode/prePlanMode against the fresh ctx to avoid
 * kicking the user out of a mode they've already left during the await.
 */
// verifyAutoModeGateAccess 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function verifyAutoModeGateAccess(
  currentContext: ToolPermissionContext,
  // Runtime AppState.fastMode — passed from callers with AppState access so
  // the disableFastMode circuit breaker reads current state, not stale
  // settings.fastMode (which is intentionally sticky across /model auto-
  // downgrades). Optional for callers without AppState (e.g. SDK init paths).
  fastMode?: boolean,
): Promise<AutoModeGateCheckResult> {
  // Auto-mode config — runs in ALL builds (circuit breaker, carousel, kick-out)
  // Fresh read of tengu_auto_mode_config.enabled — this async check runs once
  // after GrowthBook initialization and is the authoritative source for
  // isAutoModeAvailable. The sync startup path uses stale cache; this
  // corrects it. Circuit breaker (enabled==='disabled') takes effect here.
  // autoModeConfig 配置 等待 `getDynamicConfig_BLOCKS_ON_INIT<{`，确保继续执行前已有结果。
  const autoModeConfig = await getDynamicConfig_BLOCKS_ON_INIT<{
    enabled?: AutoModeEnabledState
    disableFastMode?: boolean
  }>('tengu_auto_mode_config', {})
  // enabledState 状态解析`parseAutoModeEnabledState`，供权限判定后续处理使用。
  const enabledState = parseAutoModeEnabledState(autoModeConfig?.enabled)
  // disabledBySettings 集合保存`isAutoModeDisabledBySettings`，供权限判定后续处理使用。
  const disabledBySettings = isAutoModeDisabledBySettings()
  // Treat settings-disable the same as GrowthBook 'disabled' for circuit-breaker
  // semantics — blocks SDK/explicit re-entry via isAutoModeGateEnabled().
  // 权限工具 permission Setup在这里处理 `autoModeStateModule?.setAutoModeCircuitBroken(`，完成这一小步状态转换。
  autoModeStateModule?.setAutoModeCircuitBroken(
    enabledState === 'disabled' || disabledBySettings,
  )

  // Carousel availability: not circuit-broken, not disabled-by-settings,
  // model supports it, disableFastMode breaker not firing, and (enabled or opted-in)
  // mainModel读取`getMainLoopModel`，供权限判定后续处理使用。
  const mainModel = getMainLoopModel()
  // Temp circuit breaker: tengu_auto_mode_config.disableFastMode blocks auto
  // mode when fast mode is on. Checks runtime AppState.fastMode (if provided)
  // and, for ants, model name '-fast' substring (ant-internal fast models
  // like capybara-v2-fast[1m] encode speed in the model ID itself).
  // Remove once auto+fast mode interaction is validated.
  // disableFastModeBreakerFires 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const disableFastModeBreakerFires =
    !!autoModeConfig?.disableFastMode &&
    (!!fastMode ||
      (process.env.USER_TYPE === 'ant' &&
        mainModel.toLowerCase().includes('-fast')))
  // modelSupported 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const modelSupported =
    modelSupportsAutoMode(mainModel) && !disableFastModeBreakerFires
  // carouselAvailable标记权限判定权限工具 permission Setup是否启用对应路径。
  let carouselAvailable = false
  // `enabledState` 与 `'disabled' && !disabledBySetting` 不一致时刷新派生状态，避免使用过期结果。
  if (enabledState !== 'disabled' && !disabledBySettings && modelSupported) {
    // 权限工具 permission Setup在这里处理 `carouselAvailable =`，完成这一小步状态转换。
    carouselAvailable =
      enabledState === 'enabled' || hasAutoModeOptInAnySource()
  }
  // canEnterAuto gates explicit entry (--permission-mode auto, defaultMode: auto)
  // — explicit entry IS an opt-in, so we only block on circuit breaker + settings + model
  // canEnterAuto 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const canEnterAuto =
    enabledState !== 'disabled' && !disabledBySettings && modelSupported
  // 记录权限判定运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[auto-mode] verifyAutoModeGateAccess: enabledState=${enabledState} disabledBySettings=${disabledBySettings} model=${mainModel} modelSupported=${modelSupported} disableFastModeBreakerFires=${disableFastModeBreakerFires} carouselAvailable=${carouselAvailable} canEnterAuto=${canEnterAuto}`,
  )

  // Capture CLI-flag intent now (doesn't depend on context).
  // autoModeFlagCli读取`getAutoModeFlagCli`，供权限判定后续处理使用。
  const autoModeFlagCli = autoModeStateModule?.getAutoModeFlagCli() ?? false

  // Return a transform function that re-evaluates context-dependent conditions
  // against the CURRENT context at setAppState time. The async GrowthBook
  // results above (canEnterAuto, carouselAvailable, enabledState, reason) are
  // closure-captured — those don't depend on context. But mode, prePlanMode,
  // and isAutoModeAvailable checks MUST use the fresh ctx or a mid-await
  // shift-tab gets reverted (or worse, the user stays in auto despite the
  // circuit breaker if they entered auto DURING the await — which is possible
  // because setAutoModeCircuitBroken above runs AFTER the await).
  // setAvailable 命名 `(`，让后续代码直接表达这个值的用途。
  const setAvailable = (
    ctx: ToolPermissionContext,
    available: boolean,
  ): ToolPermissionContext => {
    // `ctx.isAutoModeAvailable` 与 `available` 不一致时刷新派生状态，避免使用过期结果。
    if (ctx.isAutoModeAvailable !== available) {
      // 记录权限判定运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[auto-mode] verifyAutoModeGateAccess setAvailable: ${ctx.isAutoModeAvailable} -> ${available}`,
      )
    }
    // 返回 `ctx.isAutoModeAvailable === available`，作为权限判定这次计算的结果。
    return ctx.isAutoModeAvailable === available
      ? ctx
      : { ...ctx, isAutoModeAvailable: available }
  }

  // 满足 `canEnterAuto` 时，权限判定执行该分支。
  if (canEnterAuto) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { updateContext: ctx => setAvailable(ctx, carouselAvailable) }
  }

  // Gate is off or circuit-broken — determine reason (context-independent).
  // reason 先占位，稍后的条件分支会根据实际输入补齐它。
  let reason: AutoModeUnavailableReason
  // 满足 `disabledBySettings` 时，权限判定执行该分支。
  if (disabledBySettings) {
    // reason更新为 `'settings'`，确保权限工具后续读取最新状态。
    reason = 'settings'
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging('auto mode disabled: disableAutoMode in settings', {
      level: 'warn',
    })
  // 权限工具 permission Setup在这里处理 `} else if (enabledState === 'disabled') {`，完成这一小步状态转换。
  } else if (enabledState === 'disabled') {
    // reason更新为 `'circuit-breaker'`，确保权限工具后续读取最新状态。
    reason = 'circuit-breaker'
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'auto mode disabled: tengu_auto_mode_config.enabled === "disabled" (circuit breaker)',
      { level: 'warn' },
    )
  } else {
    // reason更新为 `'model'`，确保权限工具后续读取最新状态。
    reason = 'model'
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `auto mode disabled: model ${getMainLoopModel()} does not support auto mode`,
      { level: 'warn' },
    )
  }
  // notification读取`getAutoModeUnavailableNotification`，供权限判定后续处理使用。
  const notification = getAutoModeUnavailableNotification(reason)

  // Unified kick-out transform. Re-checks the FRESH ctx and only fires
  // side effects (setAutoModeActive(false), setNeedsAutoModeExitAttachment)
  // when the kick-out actually applies. This keeps autoModeActive in sync
  // with toolPermissionContext.mode even if the user changed modes during
  // the await: if they already left auto on their own, handleCycleMode
  // already deactivated the classifier and we don't fire again; if they
  // ENTERED auto during the await (possible before setAutoModeCircuitBroken
  // landed), we kick them out here.
  // kickOutOfAutoIfNeeded保存`(`，供权限判定权限工具 permission Setup后续判断或输出使用。
  const kickOutOfAutoIfNeeded = (
    ctx: ToolPermissionContext,
  ): ToolPermissionContext => {
    // inAuto标记权限判定权限工具 permission Setup是否启用对应路径。
    const inAuto = ctx.mode === 'auto'
    // 记录权限判定运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[auto-mode] kickOutOfAutoIfNeeded applying: ctx.mode=${ctx.mode} ctx.prePlanMode=${ctx.prePlanMode} reason=${reason}`,
    )
    // Plan mode with auto active: either from prePlanMode='auto' (entered
    // from auto) or from opt-in (strippedDangerousRules present).
    // inPlanWithAutoActive 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const inPlanWithAutoActive =
      ctx.mode === 'plan' &&
      (ctx.prePlanMode === 'auto' || !!ctx.strippedDangerousRules)
    // 只有 `!inAuto && !inPlanWithAutoActive` 满足时，权限判定才执行该分支。
    if (!inAuto && !inPlanWithAutoActive) {
      // 返回 `setAvailable(ctx, false)`，作为权限判定这次计算的结果。
      return setAvailable(ctx, false)
    }
    // 满足 `inAuto` 时，权限判定执行该分支。
    if (inAuto) {
      // 调用 autoModeStateModule?.setAutoModeActive(false)，完成这一处局部操作。
      autoModeStateModule?.setAutoModeActive(false)
      // setNeedsAutoModeExitAttachment 写入新的状态值，使权限判定后续读取保持一致。
      setNeedsAutoModeExitAttachment(true)
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...applyPermissionUpdate(restoreDangerousPermissions(ctx), {
          type: 'setMode',
          mode: 'default',
          destination: 'session',
        }),
        isAutoModeAvailable: false,
      }
    }
    // Plan with auto active: deactivate auto, restore permissions, defuse
    // prePlanMode so ExitPlanMode goes to default.
    // 调用 autoModeStateModule?.setAutoModeActive(false)，完成这一处局部操作。
    autoModeStateModule?.setAutoModeActive(false)
    // setNeedsAutoModeExitAttachment 写入新的状态值，使权限判定后续读取保持一致。
    setNeedsAutoModeExitAttachment(true)
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return {
      ...restoreDangerousPermissions(ctx),
      prePlanMode: ctx.prePlanMode === 'auto' ? 'default' : ctx.prePlanMode,
      isAutoModeAvailable: false,
    }
  }

  // Notification decisions use the stale context — that's OK: we're deciding
  // WHETHER to notify based on what the user WAS doing when this check started.
  // (Side effects and mode mutation are decided inside the transform above,
  // against the fresh ctx.)
  // wasInAuto标记权限判定权限工具 permission Setup是否启用对应路径。
  const wasInAuto = currentContext.mode === 'auto'
  // Auto was used during plan: entered from auto or opt-in auto active
  // autoActiveDuringPlan 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const autoActiveDuringPlan =
    currentContext.mode === 'plan' &&
    (currentContext.prePlanMode === 'auto' ||
      !!currentContext.strippedDangerousRules)
  // wantedAuto标记权限判定权限工具 permission Setup是否启用对应路径。
  const wantedAuto = wasInAuto || autoActiveDuringPlan || autoModeFlagCli

  // wantedAuto缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!wantedAuto) {
    // User didn't want auto at call time — no notification. But still apply
    // the full kick-out transform: if they shift-tabbed INTO auto during the
    // await (before setAutoModeCircuitBroken landed), we need to evict them.
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { updateContext: kickOutOfAutoIfNeeded }
  }

  // 只有 `wasInAuto || autoActiveDuringPlan` 满足时，权限判定才执行该分支。
  if (wasInAuto || autoActiveDuringPlan) {
    // User was in auto or had auto active during plan — kick out + notify.
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { updateContext: kickOutOfAutoIfNeeded, notification }
  }

  // autoModeFlagCli only: defaultMode was auto but sync check rejected it.
  // Suppress notification if isAutoModeAvailable is already false (already
  // notified on a prior check; prevents repeat notifications on successive
  // unsupported-model switches).
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    updateContext: kickOutOfAutoIfNeeded,
    notification: currentContext.isAutoModeAvailable ? notification : undefined,
  }
}

/**
 * Core logic to check if bypassPermissions should be disabled based on Statsig gate
 */
// shouldDisableBypassPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldDisableBypassPermissions(): Promise<boolean> {
  // 返回 `checkSecurityRestrictionGate('tengu_disable_bypass_permissions_mode')`，作为权限判定这次计算的结果。
  return checkSecurityRestrictionGate('tengu_disable_bypass_permissions_mode')
}

// isAutoModeDisabledBySettings 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAutoModeDisabledBySettings(): boolean {
  // settings 集合读取`getSettings_DEPRECATED`，供权限判定后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    (settings as { disableAutoMode?: 'disable' }).disableAutoMode ===
      'disable' ||
    (settings.permissions as { disableAutoMode?: 'disable' } | undefined)
      ?.disableAutoMode === 'disable'
  )
}

/**
 * Checks if auto mode can be entered: circuit breaker is not active and settings
 * have not disabled it. Synchronous.
 */
// isAutoModeGateEnabled 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAutoModeGateEnabled(): boolean {
  // 满足 `autoModeStateModule?.isAutoModeCircuitBroken() ?? false` 时，权限判定执行该分支。
  if (autoModeStateModule?.isAutoModeCircuitBroken() ?? false) return false
  // 满足 `isAutoModeDisabledBySettings()` 时，权限判定执行该分支。
  if (isAutoModeDisabledBySettings()) return false
  // 满足 `!modelSupportsAutoMode(getMainLoopModel())` 时，权限判定执行该分支。
  if (!modelSupportsAutoMode(getMainLoopModel())) return false
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Returns the reason auto mode is currently unavailable, or null if available.
 * Synchronous — uses state populated by verifyAutoModeGateAccess.
 */
// getAutoModeUnavailableReason 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeUnavailableReason(): AutoModeUnavailableReason | null {
  // 满足 `isAutoModeDisabledBySettings()` 时，权限判定执行该分支。
  if (isAutoModeDisabledBySettings()) return 'settings'
  // 满足 `autoModeStateModule?.isAutoModeCircuitBroken() ?? false` 时，权限判定执行该分支。
  if (autoModeStateModule?.isAutoModeCircuitBroken() ?? false) {
    // 返回 `'circuit-breaker'`，作为权限判定这次计算的结果。
    return 'circuit-breaker'
  }
  // 满足 `!modelSupportsAutoMode(getMainLoopModel())` 时，权限判定执行该分支。
  if (!modelSupportsAutoMode(getMainLoopModel())) return 'model'
  // 返回 `null`，作为权限判定这次计算的结果。
  return null
}

/**
 * The `enabled` field in the tengu_auto_mode_config GrowthBook JSON config.
 * Controls auto mode availability in UI surfaces (CLI, IDE, Desktop).
 * - 'enabled': auto mode is available in the shift-tab carousel (or equivalent)
 * - 'disabled': auto mode is fully unavailable — circuit breaker for incident response
 * - 'opt-in': auto mode is available only if the user has explicitly opted in
 *   (via --enable-auto-mode in CLI, or a settings toggle in IDE/Desktop)
 */
// AutoModeEnabledState 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type AutoModeEnabledState = 'enabled' | 'disabled' | 'opt-in'

// AUTO_MODE_ENABLED_DEFAULT 命名 `'disabled'`，让后续代码直接表达这个值的用途。
const AUTO_MODE_ENABLED_DEFAULT: AutoModeEnabledState = 'disabled'

// parseAutoModeEnabledState 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseAutoModeEnabledState(value: unknown): AutoModeEnabledState {
  // 只有 `value === 'enabled' || value === 'disabled' || va` 满足时，权限判定才执行该分支。
  if (value === 'enabled' || value === 'disabled' || value === 'opt-in') {
    // 返回 `value`，作为权限判定这次计算的结果。
    return value
  }
  // 返回 `AUTO_MODE_ENABLED_DEFAULT`，作为权限判定这次计算的结果。
  return AUTO_MODE_ENABLED_DEFAULT
}

/**
 * Reads the `enabled` field from tengu_auto_mode_config (cached, may be stale).
 * Defaults to 'disabled' if GrowthBook is unavailable or the field is unset.
 * Other surfaces (IDE, Desktop) should call this to decide whether to surface
 * auto mode in their mode pickers.
 */
// getAutoModeEnabledState 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeEnabledState(): AutoModeEnabledState {
  // 配置 命名 `getFeatureValue_CACHED_MAY_BE_STALE<{`，让后续代码直接表达这个值的用途。
  const config = getFeatureValue_CACHED_MAY_BE_STALE<{
    enabled?: AutoModeEnabledState
  }>('tengu_auto_mode_config', {})
  // 返回 `parseAutoModeEnabledState(config?.enabled)`，作为权限判定这次计算的结果。
  return parseAutoModeEnabledState(config?.enabled)
}

// NO_CACHED_AUTO_MODE_CONFIG 配置保存`Symbol`，供权限判定后续处理使用。
const NO_CACHED_AUTO_MODE_CONFIG = Symbol('no-cached-auto-mode-config')

/**
 * Like getAutoModeEnabledState but returns undefined when no cached value
 * exists (cold start, before GrowthBook init). Used by the sync
 * circuit-breaker check in initialPermissionModeFromCLI, which must not
 * conflate "not yet fetched" with "fetched and disabled" — the former
 * defers to verifyAutoModeGateAccess, the latter blocks immediately.
 */
// getAutoModeEnabledStateIfCached 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAutoModeEnabledStateIfCached():
  | AutoModeEnabledState
  | undefined {
  // 配置 命名 `getFeatureValue_CACHED_MAY_BE_STALE<`，让后续代码直接表达这个值的用途。
  const config = getFeatureValue_CACHED_MAY_BE_STALE<
    { enabled?: AutoModeEnabledState } | typeof NO_CACHED_AUTO_MODE_CONFIG
  >('tengu_auto_mode_config', NO_CACHED_AUTO_MODE_CONFIG)
  // 满足 `config === NO_CACHED_AUTO_MODE_CONFIG` 时，权限判定执行该分支。
  if (config === NO_CACHED_AUTO_MODE_CONFIG) return undefined
  // 返回 `parseAutoModeEnabledState(config?.enabled)`，作为权限判定这次计算的结果。
  return parseAutoModeEnabledState(config?.enabled)
}

/**
 * Returns true if the user has opted in to auto mode via any trusted mechanism:
 * - CLI flag (--enable-auto-mode / --permission-mode auto) — session-scoped
 *   availability request; the startup dialog in showSetupScreens enforces
 *   persistent consent before the REPL renders.
 * - skipAutoPermissionPrompt setting (persistent; set by accepting the opt-in
 *   dialog or by IDE/Desktop settings toggle)
 */
// hasAutoModeOptInAnySource 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasAutoModeOptInAnySource(): boolean {
  // 满足 `autoModeStateModule?.getAutoModeFlagCli() ?? false` 时，权限判定执行该分支。
  if (autoModeStateModule?.getAutoModeFlagCli() ?? false) return true
  // 返回 `hasAutoModeOptIn()`，作为权限判定这次计算的结果。
  return hasAutoModeOptIn()
}

/**
 * Checks if bypassPermissions mode is currently disabled by Statsig gate or settings.
 * This is a synchronous version that uses cached Statsig values.
 */
// isBypassPermissionsModeDisabled 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isBypassPermissionsModeDisabled(): boolean {
  // growthBookDisableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const growthBookDisableBypassPermissionsMode =
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE(
      'tengu_disable_bypass_permissions_mode',
    )
  // settings 集合读取`getSettings_DEPRECATED`，供权限判定后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // settingsDisableBypassPermissionsMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const settingsDisableBypassPermissionsMode =
    settings.permissions?.disableBypassPermissionsMode === 'disable'

  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    growthBookDisableBypassPermissionsMode ||
    settingsDisableBypassPermissionsMode
  )
}

/**
 * Creates an updated context with bypassPermissions disabled
 */
// createDisabledBypassPermissionsContext 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createDisabledBypassPermissionsContext(
  currentContext: ToolPermissionContext,
): ToolPermissionContext {
  // updatedContext保存`currentContext`，供权限判定权限工具 permission Setup后续判断或输出使用。
  let updatedContext = currentContext
  // 当 `currentContext.mode` 匹配 `'bypassPermissions'` 时，权限判定执行对应分支。
  if (currentContext.mode === 'bypassPermissions') {
    // updatedContext更新为 `applyPermissionUpdate(currentContext, {`，确保权限工具后续读取最新状态。
    updatedContext = applyPermissionUpdate(currentContext, {
      type: 'setMode',
      mode: 'default',
      destination: 'session',
    })
  }

  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    ...updatedContext,
    isBypassPermissionsModeAvailable: false,
  }
}

/**
 * Asynchronously checks if the bypassPermissions mode should be disabled based on Statsig gate
 * and returns an updated toolPermissionContext if needed
 */
// checkAndDisableBypassPermissions 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkAndDisableBypassPermissions(
  currentContext: ToolPermissionContext,
): Promise<void> {
  // Only proceed if bypassPermissions mode is available
  // currentContext.isBypassPermissionsModeAvailable 权限数据缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!currentContext.isBypassPermissionsModeAvailable) {
    // 权限工具 permission Setup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // shouldDisable记录 `shouldDisableBypassPermissions` 是否成立，权限判定随后按该结果分支。
  const shouldDisable = await shouldDisableBypassPermissions()
  // shouldDisable缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!shouldDisable) {
    // 权限工具 permission Setup在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Gate is enabled, need to disable bypassPermissions mode
  // 记录权限判定运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    'bypassPermissions mode is being disabled by Statsig gate (async check)',
    { level: 'warn' },
  )

  // 显式忽略 `gracefulShutdown(1, 'bypass_permissions_disabled')` 的返回值，只保留它触发的副作用。
  void gracefulShutdown(1, 'bypass_permissions_disabled')
}

// isDefaultPermissionModeAuto 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isDefaultPermissionModeAuto(): boolean {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // settings 集合读取`getSettings_DEPRECATED`，供权限判定后续处理使用。
    const settings = getSettings_DEPRECATED() || {}
    // 返回 `settings.permissions?.defaultMode === 'auto'`，作为权限判定这次计算的结果。
    return settings.permissions?.defaultMode === 'auto'
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Whether plan mode should use auto mode semantics (classifier runs during
 * plan). True when the user has opted in to auto mode and the gate is enabled.
 * Evaluated at permission-check time so it's reactive to config changes.
 */
// shouldPlanUseAutoMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldPlanUseAutoMode(): boolean {
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // 返回 `(`，作为权限判定这次计算的结果。
    return (
      hasAutoModeOptIn() &&
      isAutoModeGateEnabled() &&
      getUseAutoModeDuringPlan()
    )
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Centralized plan-mode entry. Stashes the current mode as prePlanMode so
 * ExitPlanMode can restore it. When the user has opted in to auto mode,
 * auto semantics stay active during plan mode.
 */
// prepareContextForPlanMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prepareContextForPlanMode(
  context: ToolPermissionContext,
): ToolPermissionContext {
  // currentMode 命名 `context.mode`，让后续代码直接表达这个值的用途。
  const currentMode = context.mode
  // 当 `currentMode` 匹配 `'plan'` 时，权限判定执行对应分支。
  if (currentMode === 'plan') return context
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // planAutoMode保存`shouldPlanUseAutoMode`，供权限判定后续处理使用。
    const planAutoMode = shouldPlanUseAutoMode()
    // 当 `currentMode` 匹配 `'auto'` 时，权限判定执行对应分支。
    if (currentMode === 'auto') {
      // 满足 `planAutoMode` 时，权限判定执行该分支。
      if (planAutoMode) {
        // 返回结构化结果，集中表达权限判定已经整理出的状态。
        return { ...context, prePlanMode: 'auto' }
      }
      // 调用 autoModeStateModule?.setAutoModeActive(false)，完成这一处局部操作。
      autoModeStateModule?.setAutoModeActive(false)
      // setNeedsAutoModeExitAttachment 写入新的状态值，使权限判定后续读取保持一致。
      setNeedsAutoModeExitAttachment(true)
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...restoreDangerousPermissions(context),
        prePlanMode: 'auto',
      }
    }
    // `planAutoMode && currentMode` 与 `'bypassPermission` 不一致时刷新派生状态，避免使用过期结果。
    if (planAutoMode && currentMode !== 'bypassPermissions') {
      // 调用 autoModeStateModule?.setAutoModeActive(true)，完成这一处局部操作。
      autoModeStateModule?.setAutoModeActive(true)
      // 返回结构化结果，集中表达权限判定已经整理出的状态。
      return {
        ...stripDangerousPermissionsForAutoMode(context),
        prePlanMode: currentMode,
      }
    }
  }
  // 记录权限判定运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[prepareContextForPlanMode] plain plan entry, prePlanMode=${currentMode}`,
    { level: 'info' },
  )
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { ...context, prePlanMode: currentMode }
}

/**
 * Reconciles auto-mode state during plan mode after a settings change.
 * Compares desired state (shouldPlanUseAutoMode) against actual state
 * (isAutoModeActive) and activates/deactivates auto accordingly. No-op when
 * not in plan mode. Called from applySettingsChange so that toggling
 * useAutoModeDuringPlan mid-plan takes effect immediately.
 */
// transitionPlanAutoMode 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function transitionPlanAutoMode(
  context: ToolPermissionContext,
): ToolPermissionContext {
  // 满足 `!feature('TRANSCRIPT_CLASSIFIER')` 时，权限判定执行该分支。
  if (!feature('TRANSCRIPT_CLASSIFIER')) return context
  // `context.mode` 与 `'plan'` 不一致时刷新派生状态，避免使用过期结果。
  if (context.mode !== 'plan') return context
  // Mirror prepareContextForPlanMode's entry-time exclusion — never activate
  // auto mid-plan when the user entered from a dangerous mode.
  // 当 `context.prePlanMode` 匹配 `'bypassPermissions'` 时，权限判定执行对应分支。
  if (context.prePlanMode === 'bypassPermissions') {
    // 返回 `context`，作为权限判定这次计算的结果。
    return context
  }

  // want保存`shouldPlanUseAutoMode`，供权限判定后续处理使用。
  const want = shouldPlanUseAutoMode()
  // have保存`isAutoModeActive`，供权限判定后续处理使用。
  const have = autoModeStateModule?.isAutoModeActive() ?? false

  // 只有 `want && have` 满足时，权限判定才执行该分支。
  if (want && have) {
    // syncPermissionRulesFromDisk (called before us in applySettingsChange)
    // re-adds dangerous rules from disk without touching strippedDangerousRules.
    // Re-strip so the classifier isn't bypassed by prefix-rule allow matches.
    // 返回 `stripDangerousPermissionsForAutoMode(context)`，作为权限判定这次计算的结果。
    return stripDangerousPermissionsForAutoMode(context)
  }
  // 只有 `!want && !have` 满足时，权限判定才执行该分支。
  if (!want && !have) return context

  // 满足 `want` 时，权限判定执行该分支。
  if (want) {
    // 调用 autoModeStateModule?.setAutoModeActive(true)，完成这一处局部操作。
    autoModeStateModule?.setAutoModeActive(true)
    // setNeedsAutoModeExitAttachment 写入新的状态值，使权限判定后续读取保持一致。
    setNeedsAutoModeExitAttachment(false)
    // 返回 `stripDangerousPermissionsForAutoMode(context)`，作为权限判定这次计算的结果。
    return stripDangerousPermissionsForAutoMode(context)
  }
  // 调用 autoModeStateModule?.setAutoModeActive(false)，完成这一处局部操作。
  autoModeStateModule?.setAutoModeActive(false)
  // setNeedsAutoModeExitAttachment 写入新的状态值，使权限判定后续读取保持一致。
  setNeedsAutoModeExitAttachment(true)
  // 返回 `restoreDangerousPermissions(context)`，作为权限判定这次计算的结果。
  return restoreDangerousPermissions(context)
}
