// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 APIUserAbortError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIUserAbortError } from '@anthropic-ai/sdk'
// 类型依赖 { z } 来自 zod/v4，用于校准工具调用的数据契约。
import type { z } from 'zod/v4'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 类型依赖 { ToolPermissionContext, ToolUseContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolPermissionContext, ToolUseContext } from '../../Tool.js'
// 类型依赖 { PendingClassifierCheck } 来自 ../../types/permissions.js，用于校准工具调用的数据契约。
import type { PendingClassifierCheck } from '../../types/permissions.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  checkSemantics,
  nodeTypeId,
  type ParseForSecurityResult,
  parseForSecurityFromAst,
  type Redirect,
  type SimpleCommand,
} from '../../utils/bash/ast.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  type CommandPrefixResult,
  extractOutputRedirections,
  getCommandSubcommandPrefix,
  splitCommand_DEPRECATED,
} from '../../utils/bash/commands.js'
// 复用 parseCommandRaw 工具函数，把通用处理留在 ../../utils/bash/parser.js 中维护。
import { parseCommandRaw } from '../../utils/bash/parser.js'
// 复用 tryParseShellCommand 工具函数，把通用处理留在 ../../utils/bash/shellQuote.js 中维护。
import { tryParseShellCommand } from '../../utils/bash/shellQuote.js'
// 复用 getCwd 工具函数，把通用处理留在 ../../utils/cwd.js 中维护。
import { getCwd } from '../../utils/cwd.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 AbortError 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { AbortError } from '../../utils/errors.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  ClassifierBehavior,
  ClassifierResult,
} from '../../utils/permissions/bashClassifier.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  classifyBashCommand,
  getBashPromptAllowDescriptions,
  getBashPromptAskDescriptions,
  getBashPromptDenyDescriptions,
  isClassifierPermissionsEnabled,
} from '../../utils/permissions/bashClassifier.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  PermissionDecisionReason,
  PermissionResult,
} from '../../utils/permissions/PermissionResult.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import type {
  PermissionRule,
  PermissionRuleValue,
} from '../../utils/permissions/PermissionRule.js'
// 复用 extractRules 工具函数，把通用处理留在 ../../utils/permissions/PermissionUpdate.js 中维护。
import { extractRules } from '../../utils/permissions/PermissionUpdate.js'
// 类型依赖 { PermissionUpdate } 来自 ../../utils/permissions/PermissionUpdateSchema.js，用于校准工具调用的数据契约。
import type { PermissionUpdate } from '../../utils/permissions/PermissionUpdateSchema.js'
// 复用 permissionRuleValueToString 工具函数，把通用处理留在 ../../utils/permissions/permissionRuleParser.js 中维护。
import { permissionRuleValueToString } from '../../utils/permissions/permissionRuleParser.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  createPermissionRequestMessage,
  getRuleByContentsForTool,
} from '../../utils/permissions/permissions.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  parsePermissionRule,
  type ShellPermissionRule,
  matchWildcardPattern as sharedMatchWildcardPattern,
  permissionRuleExtractPrefix as sharedPermissionRuleExtractPrefix,
  suggestionForExactCommand as sharedSuggestionForExactCommand,
  suggestionForPrefix as sharedSuggestionForPrefix,
} from '../../utils/permissions/shellRuleMatching.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js'
// 复用 SandboxManager 工具函数，把通用处理留在 ../../utils/sandbox/sandbox-adapter.js 中维护。
import { SandboxManager } from '../../utils/sandbox/sandbox-adapter.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 复用 windowsPathToPosixPath 工具函数，把通用处理留在 ../../utils/windowsPaths.js 中维护。
import { windowsPathToPosixPath } from '../../utils/windowsPaths.js'
// 引入 BashTool，将 ./BashTool.js 中已经封装好的能力接到本文件流程里。
import { BashTool } from './BashTool.js'
// 引入 checkCommandOperatorPermissions，将 ./bashCommandHelpers.js 中已经封装好的能力接到本文件流程里。
import { checkCommandOperatorPermissions } from './bashCommandHelpers.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  bashCommandIsSafeAsync_DEPRECATED,
  stripSafeHeredocSubstitutions,
} from './bashSecurity.js'
// 引入 checkPermissionMode，将 ./modeValidation.js 中已经封装好的能力接到本文件流程里。
import { checkPermissionMode } from './modeValidation.js'
// 引入 checkPathConstraints，将 ./pathValidation.js 中已经封装好的能力接到本文件流程里。
import { checkPathConstraints } from './pathValidation.js'
// 引入 checkSedConstraints，将 ./sedValidation.js 中已经封装好的能力接到本文件流程里。
import { checkSedConstraints } from './sedValidation.js'
// 引入 shouldUseSandbox，将 ./shouldUseSandbox.js 中已经封装好的能力接到本文件流程里。
import { shouldUseSandbox } from './shouldUseSandbox.js'

// DCE cliff: Bun's feature() evaluator has a per-function complexity budget.
// bashToolHasPermission is right at the limit. `import { X as Y }` aliases
// inside the import block count toward this budget; when they push it over
// the threshold Bun can no longer prove feature('BASH_CLASSIFIER') is a
// constant and silently evaluates the ternaries to `false`, dropping every
// pendingClassifierCheck spread. Keep aliases as top-level const rebindings
// instead. (See also the comment on checkSemanticsDeny below.)
// bashCommandIsSafeAsync 命令数据保存`bashCommandIsSafeAsync_DEPRECATED`，供后续判断或组装使用。
const bashCommandIsSafeAsync = bashCommandIsSafeAsync_DEPRECATED
// splitCommand 命令数据格式化`splitCommand_DEPRECATED`，供后续判断或组装使用。
const splitCommand = splitCommand_DEPRECATED

// Env-var assignment prefix (VAR=value). Shared across three while-loops that
// skip safe env vars before extracting the command name.
// ENV_VAR_ASSIGN_RE 命名 `/^[A-Za-z_]\w*=/`，让后续代码直接表达这个值的用途。
const ENV_VAR_ASSIGN_RE = /^[A-Za-z_]\w*=/

// CC-643: On complex compound commands, splitCommand_DEPRECATED can produce a
// very large subcommands array (possible exponential growth; #21405's ReDoS fix
// may have been incomplete). Each subcommand then runs tree-sitter parse +
// ~20 validators + logEvent (bashSecurity.ts), and with memoized metadata the
// resulting microtask chain starves the event loop — REPL freeze at 100% CPU,
// strace showed /proc/self/stat reads at ~127Hz with no epoll_wait. Fifty is
// generous: legitimate user commands don't split that wide. Above the cap we
// fall back to 'ask' (safe default — we can't prove safety, so we prompt).
// MAX_SUBCOMMANDS_FOR_SECURITY_CHECK 命令数据保存`50`，供后续判断或组装使用。
export const MAX_SUBCOMMANDS_FOR_SECURITY_CHECK = 50

// GH#11380: Cap the number of per-subcommand rules suggested for compound
// commands. Beyond this, the "Yes, and don't ask again for X, Y, Z…" label
// degrades to "similar commands" anyway, and saving 10+ rules from one prompt
// is more likely noise than intent. Users chaining this many write commands
// in one && list are rare; they can always approve once and add rules manually.
// MAX_SUGGESTED_RULES_FOR_COMPOUND保存`5`，供Bash 工具 bash Permissions后续判断或输出使用。
export const MAX_SUGGESTED_RULES_FOR_COMPOUND = 5

/**
 * [ANT-ONLY] Log classifier evaluation results for analysis.
 * This helps us understand which classifier rules are being evaluated
 * and how the classifier is deciding on commands.
 */
// logClassifierResultForAnts 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logClassifierResultForAnts(
  command: string,
  behavior: ClassifierBehavior,
  descriptions: string[],
  result: ClassifierResult,
): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // Bash 工具 bash Permissions在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 记录工具调用运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_internal_bash_classifier_result', {
    behavior:
      behavior as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    descriptions: jsonStringify(
      descriptions,
    ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    matches: result.matches,
    matchedDescription: (result.matchedDescription ??
      '') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    confidence:
      result.confidence as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    reason:
      result.reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    // Note: command contains code/filepaths - this is ANT-ONLY so it's OK
    command:
      command as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}

/**
 * Extract a stable command prefix (command + subcommand) from a raw command string.
 * Skips leading env var assignments only if they are in SAFE_ENV_VARS (or
 * ANT_ONLY_SAFE_ENV_VARS for ant users). Returns null if a non-safe env var is
 * encountered (to fall back to exact match), or if the second token doesn't look
 * like a subcommand (lowercase alphanumeric, e.g., "commit", "run").
 *
 * Examples:
 *   'git commit -m "fix typo"' → 'git commit'
 *   'NODE_ENV=prod npm run build' → 'npm run' (NODE_ENV is safe)
 *   'MY_VAR=val npm run build' → null (MY_VAR is not safe)
 *   'ls -la' → null (flag, not a subcommand)
 *   'cat file.txt' → null (filename, not a subcommand)
 *   'chmod 755 file' → null (number, not a subcommand)
 */
// getSimpleCommandPrefix 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSimpleCommandPrefix(command: string): string | null {
  // token 列表格式化`command.trim`，供工具调用后续处理使用。
  const tokens = command.trim().split(/\s+/).filter(Boolean)
  // token 列表为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (tokens.length === 0) return null

  // Skip env var assignments (VAR=value) at the start, but only if they are
  // in SAFE_ENV_VARS (or ANT_ONLY_SAFE_ENV_VARS for ant users). If a non-safe
  // env var is encountered, return null to fall back to exact match. This
  // prevents generating prefix rules like Bash(npm run:*) that can never match
  // at allow-rule check time, because stripSafeWrappers only strips safe vars.
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // 只要 i < tokens.length && ENV_VAR_ASSIGN_RE.test(tokens[i]!) 成立，就持续推进工具调用中的循环处理。
  while (i < tokens.length && ENV_VAR_ASSIGN_RE.test(tokens[i]!)) {
    // varName格式化`split`，供工具调用后续处理使用。
    const varName = tokens[i]!.split('=')[0]!
    // isAntOnlySafe 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isAntOnlySafe =
      process.env.USER_TYPE === 'ant' && ANT_ONLY_SAFE_ENV_VARS.has(varName)
    // 只有 `!SAFE_ENV_VARS.has(varName) && !isAntOnlySafe` 满足时，工具调用才执行该分支。
    if (!SAFE_ENV_VARS.has(varName) && !isAntOnlySafe) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
    // Bash 工具 bash Permissions在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // remaining格式化`tokens.slice`，供工具调用后续处理使用。
  const remaining = tokens.slice(i)
  // 满足 `remaining.length < 2` 时，工具调用执行该分支。
  if (remaining.length < 2) return null
  // subcmd 命令数据 命名 `remaining[1]!`，让后续代码直接表达这个值的用途。
  const subcmd = remaining[1]!
  // Second token must look like a subcommand (e.g., "commit", "run", "compose"),
  // not a flag (-rf), filename (file.txt), path (/tmp), URL, or number (755).
  // 满足 `!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(subcmd)` 时，工具调用执行该分支。
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(subcmd)) return null
  // 返回 `remaining.slice(0, 2).join(' ')`，作为工具调用这次计算的结果。
  return remaining.slice(0, 2).join(' ')
}

// Bare-prefix suggestions like `bash:*` or `sh:*` would allow arbitrary code
// via `-c`. Wrapper suggestions like `env:*` or `sudo:*` would do the same:
// `env` is NOT in SAFE_WRAPPER_PATTERNS, so `env bash -c "evil"` survives
// stripSafeWrappers unchanged and hits the startsWith("env ") check at
// the prefix-rule matcher. Shell list mirrors DANGEROUS_SHELL_PREFIXES in
// src/utils/shell/prefix.ts which guarded the old Haiku extractor.
// BARE_SHELL_PREFIXES 集合保存`Set`，供工具调用后续处理使用。
const BARE_SHELL_PREFIXES = new Set([
  'sh',
  'bash',
  'zsh',
  'fish',
  'csh',
  'tcsh',
  'ksh',
  'dash',
  'cmd',
  'powershell',
  'pwsh',
  // wrappers that exec their args as a command
  'env',
  'xargs',
  // SECURITY: checkSemantics (ast.ts) strips these wrappers to check the
  // wrapped command. Suggesting `Bash(nice:*)` would be ≈ `Bash(*)` — users
  // would add it after a prompt, then `nice rm -rf /` passes semantics while
  // deny/cd+git gates see 'nice' (SAFE_WRAPPER_PATTERNS below didn't strip
  // bare `nice` until this fix). Block these from ever being suggested.
  'nice',
  'stdbuf',
  'nohup',
  'timeout',
  'time',
  // privilege escalation — sudo:* from `sudo -u foo ...` would auto-approve
  // any future sudo invocation
  'sudo',
  'doas',
  'pkexec',
])

/**
 * UI-only fallback: extract the first word alone when getSimpleCommandPrefix
 * declines. In external builds TREE_SITTER_BASH is off, so the async
 * tree-sitter refinement in BashPermissionRequest never fires — without this,
 * pipes and compounds (`python3 file.py 2>&1 | tail -20`) dump into the
 * editable field verbatim.
 *
 * Deliberately not used by suggestionForExactCommand: a backend-suggested
 * `Bash(rm:*)` is too broad to auto-generate, but as an editable starting
 * point it's what users expect (Slack C07VBSHV7EV/p1772670433193449).
 *
 * Reuses the same SAFE_ENV_VARS gate as getSimpleCommandPrefix — a rule like
 * `Bash(python3:*)` can never match `RUN=/path python3 ...` at check time
 * because stripSafeWrappers won't strip RUN.
 */
// getFirstWordPrefix 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getFirstWordPrefix(command: string): string | null {
  // token 列表格式化`command.trim`，供工具调用后续处理使用。
  const tokens = command.trim().split(/\s+/).filter(Boolean)

  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // 只要 i < tokens.length && ENV_VAR_ASSIGN_RE.test(tokens[i]!) 成立，就持续推进工具调用中的循环处理。
  while (i < tokens.length && ENV_VAR_ASSIGN_RE.test(tokens[i]!)) {
    // varName格式化`split`，供工具调用后续处理使用。
    const varName = tokens[i]!.split('=')[0]!
    // isAntOnlySafe 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isAntOnlySafe =
      process.env.USER_TYPE === 'ant' && ANT_ONLY_SAFE_ENV_VARS.has(varName)
    // 只有 `!SAFE_ENV_VARS.has(varName) && !isAntOnlySafe` 满足时，工具调用才执行该分支。
    if (!SAFE_ENV_VARS.has(varName) && !isAntOnlySafe) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
    // Bash 工具 bash Permissions在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // cmd 命令数据读取 `tokens[i]` 对应条目，后续围绕该成员继续处理。
  const cmd = tokens[i]
  // cmd 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!cmd) return null
  // Same shape check as the subcommand regex in getSimpleCommandPrefix:
  // rejects paths (./script.sh, /usr/bin/python), flags, numbers, filenames.
  // 满足 `!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(cmd)` 时，工具调用执行该分支。
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(cmd)) return null
  // 满足 `BARE_SHELL_PREFIXES.has(cmd)` 时，工具调用执行该分支。
  if (BARE_SHELL_PREFIXES.has(cmd)) return null
  // 返回 `cmd`，作为工具调用这次计算的结果。
  return cmd
}

// suggestionForExactCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function suggestionForExactCommand(command: string): PermissionUpdate[] {
  // Heredoc commands contain multi-line content that changes each invocation,
  // making exact-match rules useless (they'll never match again). Extract a
  // stable prefix before the heredoc operator and suggest a prefix rule instead.
  // heredocPrefix保存`extractPrefixBeforeHeredoc`，供工具调用后续处理使用。
  const heredocPrefix = extractPrefixBeforeHeredoc(command)
  // 满足 `heredocPrefix` 时，工具调用执行该分支。
  if (heredocPrefix) {
    // 返回 `sharedSuggestionForPrefix(BashTool.name, heredocPrefix)`，作为工具调用这次计算的结果。
    return sharedSuggestionForPrefix(BashTool.name, heredocPrefix)
  }

  // Multiline commands without heredoc also make poor exact-match rules.
  // Saving the full multiline text can produce patterns containing `:*` in
  // the middle, which fails permission validation and corrupts the settings
  // file. Use the first line as a prefix rule instead.
  // 满足 `command.includes('\n')` 时，工具调用执行该分支。
  if (command.includes('\n')) {
    // firstLine格式化`command.split`，供工具调用后续处理使用。
    const firstLine = command.split('\n')[0]!.trim()
    // 满足 `firstLine` 时，工具调用执行该分支。
    if (firstLine) {
      // 返回 `sharedSuggestionForPrefix(BashTool.name, firstLine)`，作为工具调用这次计算的结果。
      return sharedSuggestionForPrefix(BashTool.name, firstLine)
    }
  }

  // Single-line commands: extract a 2-word prefix for reusable rules.
  // Without this, exact-match rules are saved that never match future
  // invocations with different arguments.
  // prefix读取`getSimpleCommandPrefix`，供工具调用后续处理使用。
  const prefix = getSimpleCommandPrefix(command)
  // 满足 `prefix` 时，工具调用执行该分支。
  if (prefix) {
    // 返回 `sharedSuggestionForPrefix(BashTool.name, prefix)`，作为工具调用这次计算的结果。
    return sharedSuggestionForPrefix(BashTool.name, prefix)
  }

  // 返回 `sharedSuggestionForExactCommand(BashTool.name, command)`，作为工具调用这次计算的结果。
  return sharedSuggestionForExactCommand(BashTool.name, command)
}

/**
 * If the command contains a heredoc (<<), extract the command prefix before it.
 * Returns the first word(s) before the heredoc operator as a stable prefix,
 * or null if the command doesn't contain a heredoc.
 *
 * Examples:
 *   'git commit -m "$(cat <<\'EOF\'\n...\nEOF\n)"' → 'git commit'
 *   'cat <<EOF\nhello\nEOF' → 'cat'
 *   'echo hello' → null (no heredoc)
 */
// extractPrefixBeforeHeredoc 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractPrefixBeforeHeredoc(command: string): string | null {
  // 满足 `!command.includes('<<')` 时，工具调用执行该分支。
  if (!command.includes('<<')) return null

  // idx保存`command.indexOf`，供工具调用后续处理使用。
  const idx = command.indexOf('<<')
  // 满足 `idx <= 0` 时，工具调用执行该分支。
  if (idx <= 0) return null

  // before格式化`command.substring`，供工具调用后续处理使用。
  const before = command.substring(0, idx).trim()
  // before缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!before) return null

  // prefix读取`getSimpleCommandPrefix`，供工具调用后续处理使用。
  const prefix = getSimpleCommandPrefix(before)
  // 满足 `prefix` 时，工具调用执行该分支。
  if (prefix) return prefix

  // Fallback: skip safe env var assignments and take up to 2 tokens.
  // This preserves flag tokens (e.g., "python3 -c" stays "python3 -c",
  // not just "python3") and skips safe env var prefixes like "NODE_ENV=test".
  // If a non-safe env var is encountered, return null to avoid generating
  // prefix rules that can never match (same rationale as getSimpleCommandPrefix).
  // token 列表格式化`before.split`，供工具调用后续处理使用。
  const tokens = before.split(/\s+/).filter(Boolean)
  // i 命名 `0`，让后续代码直接表达这个值的用途。
  let i = 0
  // 只要 i < tokens.length && ENV_VAR_ASSIGN_RE.test(tokens[i]!) 成立，就持续推进工具调用中的循环处理。
  while (i < tokens.length && ENV_VAR_ASSIGN_RE.test(tokens[i]!)) {
    // varName格式化`split`，供工具调用后续处理使用。
    const varName = tokens[i]!.split('=')[0]!
    // isAntOnlySafe 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isAntOnlySafe =
      process.env.USER_TYPE === 'ant' && ANT_ONLY_SAFE_ENV_VARS.has(varName)
    // 只有 `!SAFE_ENV_VARS.has(varName) && !isAntOnlySafe` 满足时，工具调用才执行该分支。
    if (!SAFE_ENV_VARS.has(varName) && !isAntOnlySafe) {
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
    // Bash 工具 bash Permissions在这里处理 `i++`，完成这一小步状态转换。
    i++
  }
  // 满足 `i >= tokens.length` 时，工具调用执行该分支。
  if (i >= tokens.length) return null
  // 返回 `tokens.slice(i, i + 2).join(' ') || null`，作为工具调用这次计算的结果。
  return tokens.slice(i, i + 2).join(' ') || null
}

// suggestionForPrefix 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function suggestionForPrefix(prefix: string): PermissionUpdate[] {
  // 返回 `sharedSuggestionForPrefix(BashTool.name, prefix)`，作为工具调用这次计算的结果。
  return sharedSuggestionForPrefix(BashTool.name, prefix)
}

/**
 * Extract prefix from legacy :* syntax (e.g., "npm:*" -> "npm")
 * Delegates to shared implementation.
 */
// permissionRuleExtractPrefix 权限数据保存`sharedPermissionRuleExtractPrefix`，供后续判断或组装使用。
export const permissionRuleExtractPrefix = sharedPermissionRuleExtractPrefix

/**
 * Match a command against a wildcard pattern (case-sensitive for Bash).
 * Delegates to shared implementation.
 */
// matchWildcardPattern 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchWildcardPattern(
  pattern: string,
  command: string,
): boolean {
  // 返回 `sharedMatchWildcardPattern(pattern, command)`，作为工具调用这次计算的结果。
  return sharedMatchWildcardPattern(pattern, command)
}

/**
 * Parse a permission rule into a structured rule object.
 * Delegates to shared implementation.
 */
// bashPermissionRule 权限数据 先占位，稍后的条件分支会根据实际输入补齐它。
export const bashPermissionRule: (
  permissionRule: string,
) => ShellPermissionRule = parsePermissionRule

/**
 * Whitelist of environment variables that are safe to strip from commands.
 * These variables CANNOT execute code or load libraries.
 *
 * SECURITY: These must NEVER be added to the whitelist:
 * - PATH, LD_PRELOAD, LD_LIBRARY_PATH, DYLD_* (execution/library loading)
 * - PYTHONPATH, NODE_PATH, CLASSPATH, RUBYLIB (module loading)
 * - GOFLAGS, RUSTFLAGS, NODE_OPTIONS (can contain code execution flags)
 * - HOME, TMPDIR, SHELL, BASH_ENV (affect system behavior)
 */
// SAFE_ENV_VARS 集合保存`Set`，供工具调用后续处理使用。
const SAFE_ENV_VARS = new Set([
  // Go - build/runtime settings only
  'GOEXPERIMENT', // experimental features
  'GOOS', // target OS
  'GOARCH', // target architecture
  'CGO_ENABLED', // enable/disable CGO
  'GO111MODULE', // module mode

  // Rust - logging/debugging only
  'RUST_BACKTRACE', // backtrace verbosity
  'RUST_LOG', // logging filter

  // Node - environment name only (not NODE_OPTIONS!)
  'NODE_ENV',

  // Python - behavior flags only (not PYTHONPATH!)
  'PYTHONUNBUFFERED', // disable buffering
  'PYTHONDONTWRITEBYTECODE', // no .pyc files

  // Pytest - test configuration
  'PYTEST_DISABLE_PLUGIN_AUTOLOAD', // disable plugin loading
  'PYTEST_DEBUG', // debug output

  // API keys and authentication
  'ANTHROPIC_API_KEY', // API authentication

  // Locale and character encoding
  'LANG', // default locale
  'LANGUAGE', // language preference list
  'LC_ALL', // override all locale settings
  'LC_CTYPE', // character classification
  'LC_TIME', // time format
  'CHARSET', // character set preference

  // Terminal and display
  'TERM', // terminal type
  'COLORTERM', // color terminal indicator
  'NO_COLOR', // disable color output (universal standard)
  'FORCE_COLOR', // force color output
  'TZ', // timezone

  // Color configuration for various tools
  'LS_COLORS', // colors for ls (GNU)
  'LSCOLORS', // colors for ls (BSD/macOS)
  'GREP_COLOR', // grep match color (deprecated)
  'GREP_COLORS', // grep color scheme
  'GCC_COLORS', // GCC diagnostic colors

  // Display formatting
  'TIME_STYLE', // time display format for ls
  'BLOCK_SIZE', // block size for du/df
  'BLOCKSIZE', // alternative block size
])

/**
 * ANT-ONLY environment variables that are safe to strip from commands.
 * These are only enabled when USER_TYPE === 'ant'.
 *
 * SECURITY: These env vars are stripped before permission-rule matching, which
 * means `DOCKER_HOST=tcp://evil.com docker ps` matches a `Bash(docker ps:*)`
 * rule after stripping. This is INTENTIONALLY ANT-ONLY (gated at line ~380)
 * and MUST NEVER ship to external users. DOCKER_HOST redirects the Docker
 * daemon endpoint — stripping it defeats prefix-based permission restrictions
 * by hiding the network endpoint from the permission check. KUBECONFIG
 * similarly controls which cluster kubectl talks to. These are convenience
 * strippings for internal power users who accept the risk.
 *
 * Based on analysis of 30 days of tengu_internal_bash_tool_use_permission_request events.
 */
// ANT_ONLY_SAFE_ENV_VARS 集合保存`Set`，供工具调用后续处理使用。
const ANT_ONLY_SAFE_ENV_VARS = new Set([
  // Kubernetes and container config (config file pointers, not execution)
  'KUBECONFIG', // kubectl config file path — controls which cluster kubectl uses
  'DOCKER_HOST', // Docker daemon socket/endpoint — controls which daemon docker talks to

  // Cloud provider project/profile selection (just names/identifiers)
  'AWS_PROFILE', // AWS profile name selection
  'CLOUDSDK_CORE_PROJECT', // GCP project ID
  'CLUSTER', // generic cluster name

  // Anthropic internal cluster selection (just names/identifiers)
  'COO_CLUSTER', // coo cluster name
  'COO_CLUSTER_NAME', // coo cluster name (alternate)
  'COO_NAMESPACE', // coo namespace
  'COO_LAUNCH_YAML_DRY_RUN', // dry run mode

  // Feature flags (boolean/string flags only)
  'SKIP_NODE_VERSION_CHECK', // skip version check
  'EXPECTTEST_ACCEPT', // accept test expectations
  'CI', // CI environment indicator
  'GIT_LFS_SKIP_SMUDGE', // skip LFS downloads

  // GPU/Device selection (just device IDs)
  'CUDA_VISIBLE_DEVICES', // GPU device selection
  'JAX_PLATFORMS', // JAX platform selection

  // Display/terminal settings
  'COLUMNS', // terminal width
  'TMUX', // TMUX socket info

  // Test/debug configuration
  'POSTGRESQL_VERSION', // postgres version string
  'FIRESTORE_EMULATOR_HOST', // emulator host:port
  'HARNESS_QUIET', // quiet mode flag
  'TEST_CROSSCHECK_LISTS_MATCH_UPDATE', // test update flag
  'DBT_PER_DEVELOPER_ENVIRONMENTS', // DBT config
  'STATSIG_FORD_DB_CHECKS', // statsig DB check flag

  // Build configuration
  'ANT_ENVIRONMENT', // Anthropic environment name
  'ANT_SERVICE', // Anthropic service name
  'MONOREPO_ROOT_DIR', // monorepo root path

  // Version selectors
  'PYENV_VERSION', // Python version selection

  // Credentials (approved subset - these don't change exfil risk)
  'PGPASSWORD', // Postgres password
  'GH_TOKEN', // GitHub token
  'GROWTHBOOK_API_KEY', // self-hosted growthbook
])

/**
 * Strips full-line comments from a command.
 * This handles cases where Claude adds comments in bash commands, e.g.:
 *   "# Check the logs directory\nls /home/user/logs"
 * Should be stripped to: "ls /home/user/logs"
 *
 * Only strips full-line comments (lines where the entire line is a comment),
 * not inline comments that appear after a command on the same line.
 */
// stripCommentLines 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripCommentLines(command: string): string {
  // 文本行格式化`command.split`，供工具调用后续处理使用。
  const lines = command.split('\n')
  // nonCommentLines 集合筛选`lines.filter`，供工具调用后续处理使用。
  const nonCommentLines = lines.filter(line => {
    // trimmed格式化`line.trim`，供工具调用后续处理使用。
    const trimmed = line.trim()
    // Keep lines that are not empty and don't start with #
    // 返回 `trimmed !== '' && !trimmed.startsWith('#')`，作为工具调用这次计算的结果。
    return trimmed !== '' && !trimmed.startsWith('#')
  })

  // If all lines were comments/empty, return original
  // nonCommentLines 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (nonCommentLines.length === 0) {
    // 返回 `command`，作为工具调用这次计算的结果。
    return command
  }

  // 返回 `nonCommentLines.join('\n')`，作为工具调用这次计算的结果。
  return nonCommentLines.join('\n')
}

// stripSafeWrappers 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripSafeWrappers(command: string): string {
  // SECURITY: Use [ \t]+ not \s+ — \s matches \n/\r which are command
  // separators in bash. Matching across a newline would strip the wrapper from
  // one line and leave a different command on the next line for bash to execute.
  //
  // SECURITY: `(?:--[ \t]+)?` consumes the wrapper's own `--` so
  // `nohup -- rm -- -/../foo` strips to `rm -- -/../foo` (not `-- rm ...`
  // which would skip path validation with `--` as an unknown baseCmd).
  // SAFE_WRAPPER_PATTERNS 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const SAFE_WRAPPER_PATTERNS = [
    // timeout: enumerate GNU long flags — no-value (--foreground,
    // --preserve-status, --verbose), value-taking in both =fused and
    // space-separated forms (--kill-after=5, --kill-after 5, --signal=TERM,
    // --signal TERM). Short: -v (no-arg), -k/-s with separate or fused value.
    // SECURITY: flag VALUES use allowlist [A-Za-z0-9_.+-] (signals are
    // TERM/KILL/9, durations are 5/5s/10.5). Previously [^ \t]+ matched
    // $ ( ) ` | ; & — `timeout -k$(id) 10 ls` stripped to `ls`, matched
    // Bash(ls:*), while bash expanded $(id) during word splitting BEFORE
    // timeout ran. Contrast ENV_VAR_PATTERN below which already allowlists.
    /^timeout[ \t]+(?:(?:--(?:foreground|preserve-status|verbose)|--(?:kill-after|signal)=[A-Za-z0-9_.+-]+|--(?:kill-after|signal)[ \t]+[A-Za-z0-9_.+-]+|-v|-[ks][ \t]+[A-Za-z0-9_.+-]+|-[ks][A-Za-z0-9_.+-]+)[ \t]+)*(?:--[ \t]+)?\d+(?:\.\d+)?[smhd]?[ \t]+/,
    /^time[ \t]+(?:--[ \t]+)?/,
    // SECURITY: keep in sync with checkSemantics wrapper-strip (ast.ts
    // ~:1990-2080) AND stripWrappersFromArgv (pathValidation.ts ~:1260).
    // Previously this pattern REQUIRED `-n N`; checkSemantics already handled
    // bare `nice` and legacy `-N`. Asymmetry meant checkSemantics exposed the
    // wrapped command to semantic checks but deny-rule matching and the cd+git
    // gate saw the wrapper name. `nice rm -rf /` with Bash(rm:*) deny became
    // ask instead of deny; `cd evil && nice git status` skipped the bare-repo
    // RCE gate. PR #21503 fixed stripWrappersFromArgv; this was missed.
    // Now matches: `nice cmd`, `nice -n N cmd`, `nice -N cmd` (all forms
    // checkSemantics strips).
    /^nice(?:[ \t]+-n[ \t]+-?\d+|[ \t]+-\d+)?[ \t]+(?:--[ \t]+)?/,
    // stdbuf: fused short flags only (-o0, -eL). checkSemantics handles more
    // (space-separated, long --output=MODE), but we fail-closed on those
    // above so not over-stripping here is safe. Main need: `stdbuf -o0 cmd`.
    /^stdbuf(?:[ \t]+-[ioe][LN0-9]+)+[ \t]+(?:--[ \t]+)?/,
    /^nohup[ \t]+(?:--[ \t]+)?/,
  ] as const

  // Pattern for environment variables:
  // ^([A-Za-z_][A-Za-z0-9_]*)  - Variable name (standard identifier)
  // =                           - Equals sign
  // ([A-Za-z0-9_./:-]+)         - Value: alphanumeric + safe punctuation only
  // [ \t]+                      - Required HORIZONTAL whitespace after value
  //
  // SECURITY: Only matches unquoted values with safe characters (no $(), `, $var, ;|&).
  //
  // SECURITY: Trailing whitespace MUST be [ \t]+ (horizontal only), NOT \s+.
  // \s matches \n/\r. If reconstructCommand emits an unquoted newline between
  // `TZ=UTC` and `echo`, \s+ would match across it and strip `TZ=UTC<NL>`,
  // leaving `echo curl evil.com` to match Bash(echo:*). But bash treats the
  // newline as a command separator. Defense-in-depth with needsQuoting fix.
  // ENV_VAR_PATTERN 命名 `/^([A-Za-z_][A-Za-z0-9_]*)=([A-Za-z0-9_./:-]+)[ \t]+/`，让后续代码直接表达这个值的用途。
  const ENV_VAR_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)=([A-Za-z0-9_./:-]+)[ \t]+/

  // stripped 命名 `command`，让后续代码直接表达这个值的用途。
  let stripped = command
  // previousStripped固定为 `''`，作为Bash 工具 bash Permissions后续展示或比较的基准。
  let previousStripped = ''

  // Phase 1: Strip leading env vars and comments only.
  // In bash, env var assignments before a command (VAR=val cmd) are genuine
  // shell-level assignments. These are safe to strip for permission matching.
  // while 使用 stripped !== previousStripped 完成工具调用里的对应操作。
  while (stripped !== previousStripped) {
    // previousStripped更新为 `stripped`，确保Bash 工具后续读取最新状态。
    previousStripped = stripped
    // stripped更新为 `stripCommentLines(stripped)`，确保Bash 工具后续读取最新状态。
    stripped = stripCommentLines(stripped)

    // envVarMatch匹配`stripped.match`，供工具调用后续处理使用。
    const envVarMatch = stripped.match(ENV_VAR_PATTERN)
    // 满足 `envVarMatch` 时，工具调用执行该分支。
    if (envVarMatch) {
      // varName保存`envVarMatch[1]!`，供Bash 工具 bash Permissions后续判断或输出使用。
      const varName = envVarMatch[1]!
      // isAntOnlySafe 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const isAntOnlySafe =
        process.env.USER_TYPE === 'ant' && ANT_ONLY_SAFE_ENV_VARS.has(varName)
      // 只有 `SAFE_ENV_VARS.has(varName) || isAntOnlySafe` 满足时，工具调用才执行该分支。
      if (SAFE_ENV_VARS.has(varName) || isAntOnlySafe) {
        // stripped更新为 `stripped.replace(ENV_VAR_PATTERN, '')`，确保Bash 工具后续读取最新状态。
        stripped = stripped.replace(ENV_VAR_PATTERN, '')
      }
    }
  }

  // Phase 2: Strip wrapper commands and comments only. Do NOT strip env vars.
  // Wrapper commands (timeout, time, nice, nohup) use execvp to run their
  // arguments, so VAR=val after a wrapper is treated as the COMMAND to execute,
  // not as an env var assignment. Stripping env vars here would create a
  // mismatch between what the parser sees and what actually executes.
  // (HackerOne #3543050)
  // previousStripped更新为 `''`，确保Bash 工具后续读取最新状态。
  previousStripped = ''
  // while 使用 stripped !== previousStripped 完成工具调用里的对应操作。
  while (stripped !== previousStripped) {
    // previousStripped更新为 `stripped`，确保Bash 工具后续读取最新状态。
    previousStripped = stripped
    // stripped更新为 `stripCommentLines(stripped)`，确保Bash 工具后续读取最新状态。
    stripped = stripCommentLines(stripped)

    // 按顺序遍历 `SAFE_WRAPPER_PATTERNS` 中的pattern，逐个交给工具调用处理。
    for (const pattern of SAFE_WRAPPER_PATTERNS) {
      // stripped更新为 `stripped.replace(pattern, '')`，确保Bash 工具后续读取最新状态。
      stripped = stripped.replace(pattern, '')
    }
  }

  // 返回 `stripped.trim()`，作为工具调用这次计算的结果。
  return stripped.trim()
}

// SECURITY: allowlist for timeout flag VALUES (signals are TERM/KILL/9,
// durations are 5/5s/10.5). Rejects $ ( ) ` | ; & and newlines that
// previously matched via [^ \t]+ — `timeout -k$(id) 10 ls` must NOT strip.
// TIMEOUT_FLAG_VALUE_RE保存`/^[A-Za-z0-9_.+-]+$/`，供Bash 工具 bash Permissions后续判断或输出使用。
const TIMEOUT_FLAG_VALUE_RE = /^[A-Za-z0-9_.+-]+$/

/**
 * Parse timeout's GNU flags (long + short, fused + space-separated) and
 * return the argv index of the DURATION token, or -1 if flags are unparseable.
 * Enumerates: --foreground/--preserve-status/--verbose (no value),
 * --kill-after/--signal (value, both =fused and space-separated), -v (no
 * value), -k/-s (value, both fused and space-separated).
 *
 * Extracted from stripWrappersFromArgv to keep bashToolHasPermission under
 * Bun's feature() DCE complexity threshold — inlining this breaks
 * feature('BASH_CLASSIFIER') evaluation in classifier tests.
 */
// skipTimeoutFlags 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function skipTimeoutFlags(a: readonly string[]): number {
  // i保存`1`，供后续判断或组装使用。
  let i = 1
  // while 使用 i < a.length 完成工具调用里的对应操作。
  while (i < a.length) {
    // 当前参数保存`a[i]!`，供Bash 工具 bash Permissions后续判断或输出使用。
    const arg = a[i]!
    // next 命名 `a[i + 1]`，让后续代码直接表达这个值的用途。
    const next = a[i + 1]
    // 工具调用在这里按实际状态进入对应分支。
    if (
      arg === '--foreground' ||
      arg === '--preserve-status' ||
      arg === '--verbose'
    )
      // Bash 工具 bash Permissions在这里处理 `i++`，完成这一小步状态转换。
      i++
    else if (/^--(?:kill-after|signal)=[A-Za-z0-9_.+-]+$/.test(arg)) i++
    else if (
      (arg === '--kill-after' || arg === '--signal') &&
      next &&
      TIMEOUT_FLAG_VALUE_RE.test(next)
    )
      // Bash 工具 bash Permissions在这里处理 `i += 2`，完成这一小步状态转换。
      i += 2
    else if (arg === '--') {
      // Bash 工具 bash Permissions在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    } // end-of-options marker
    else if (arg.startsWith('--')) return -1
    else if (arg === '-v') i++
    else if (
      (arg === '-k' || arg === '-s') &&
      next &&
      TIMEOUT_FLAG_VALUE_RE.test(next)
    )
      // Bash 工具 bash Permissions在这里处理 `i += 2`，完成这一小步状态转换。
      i += 2
    else if (/^-[ks][A-Za-z0-9_.+-]+$/.test(arg)) i++
    else if (arg.startsWith('-')) return -1
    else break
  }
  // 返回 `i`，作为工具调用这次计算的结果。
  return i
}

/**
 * Argv-level counterpart to stripSafeWrappers. Strips the same wrapper
 * commands (timeout, time, nice, nohup) from AST-derived argv. Env vars
 * are already separated into SimpleCommand.envVars so no env-var stripping.
 *
 * KEEP IN SYNC with SAFE_WRAPPER_PATTERNS above — if you add a wrapper
 * there, add it here too.
 */
// stripWrappersFromArgv 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripWrappersFromArgv(argv: string[]): string[] {
  // SECURITY: Consume optional `--` after wrapper options, matching what the
  // wrapper does. Otherwise `['nohup','--','rm','--','-/../foo']` yields `--`
  // as baseCmd and skips path validation. See SAFE_WRAPPER_PATTERNS comment.
  // a 命名 `argv`，让后续代码直接表达这个值的用途。
  let a = argv
  // 循环处理 ``，让工具调用逐项把同类条目按顺序走完。
  for (;;) {
    // 当 `a[0]` 匹配 `'time' || a[0] === 'nohup'` 时，工具调用执行对应分支。
    if (a[0] === 'time' || a[0] === 'nohup') {
      // a更新为 `a.slice(a[1] === '--' ? 2 : 1)`，确保Bash 工具后续读取最新状态。
      a = a.slice(a[1] === '--' ? 2 : 1)
    // Bash 工具 bash Permissions在这里处理 `} else if (a[0] === 'timeout') {`，完成这一小步状态转换。
    } else if (a[0] === 'timeout') {
      // i保存`skipTimeoutFlags`，供工具调用后续处理使用。
      const i = skipTimeoutFlags(a)
      // 只有 `i < 0 || !a[i] || !/^\d+(?:\.\d+)?[smhd]?$/.test(a[i]!)` 满足时，工具调用才执行该分支。
      if (i < 0 || !a[i] || !/^\d+(?:\.\d+)?[smhd]?$/.test(a[i]!)) return a
      // a更新为 `a.slice(i + 1)`，确保Bash 工具后续读取最新状态。
      a = a.slice(i + 1)
    // Bash 工具 bash Permissions在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      a[0] === 'nice' &&
      a[1] === '-n' &&
      a[2] &&
      /^-?\d+$/.test(a[2])
    ) {
      // a更新为 `a.slice(a[3] === '--' ? 4 : 3)`，确保Bash 工具后续读取最新状态。
      a = a.slice(a[3] === '--' ? 4 : 3)
    } else {
      // 返回 `a`，作为工具调用这次计算的结果。
      return a
    }
  }
}

/**
 * Env vars that make a *different binary* run (injection or resolution hijack).
 * Heuristic only — export-&& form bypasses this, and excludedCommands isn't a
 * security boundary anyway.
 */
// BINARY_HIJACK_VARS 集合保存`/^(LD_|DYLD_|PATH$)/`，供后续判断或组装使用。
export const BINARY_HIJACK_VARS = /^(LD_|DYLD_|PATH$)/

/**
 * Strip ALL leading env var prefixes from a command, regardless of whether the
 * var name is in the safe-list.
 *
 * Used for deny/ask rule matching: when a user denies `claude` or `rm`, the
 * command should stay blocked even if prefixed with arbitrary env vars like
 * `FOO=bar claude`. The safe-list restriction in stripSafeWrappers is correct
 * for allow rules (prevents `DOCKER_HOST=evil docker ps` from auto-matching
 * `Bash(docker ps:*)`), but deny rules must be harder to circumvent.
 *
 * Also used for sandbox.excludedCommands matching (not a security boundary —
 * permission prompts are), with BINARY_HIJACK_VARS as a blocklist.
 *
 * SECURITY: Uses a broader value pattern than stripSafeWrappers. The value
 * pattern excludes only actual shell injection characters ($, backtick, ;, |,
 * &, parens, redirects, quotes, backslash) and whitespace. Characters like
 * =, +, @, ~, , are harmless in unquoted env var assignment position and must
 * be matched to prevent trivial bypass via e.g. `FOO=a=b denied_command`.
 *
 * @param blocklist - optional regex tested against each var name; matching vars
 *   are NOT stripped (and stripping stops there). Omit for deny rules; pass
 *   BINARY_HIJACK_VARS for excludedCommands.
 */
// stripAllLeadingEnvVars 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripAllLeadingEnvVars(
  command: string,
  blocklist?: RegExp,
): string {
  // Broader value pattern for deny-rule stripping. Handles:
  //
  // - Standard assignment (FOO=bar), append (FOO+=bar), array (FOO[0]=bar)
  // - Single-quoted values: '[^'\n\r]*' — bash suppresses all expansion
  // - Double-quoted values with backslash escapes: "(?:\\.|[^"$`\\\n\r])*"
  //   In bash double quotes, only \$, \`, \", \\, and \newline are special.
  //   Other \x sequences are harmless, so we allow \. inside double quotes.
  //   We still exclude raw $ and ` (without backslash) to block expansion.
  // - Unquoted values: excludes shell metacharacters, allows backslash escapes
  // - Concatenated segments: FOO='x'y"z" — bash concatenates adjacent segments
  //
  // SECURITY: Trailing whitespace MUST be [ \t]+ (horizontal only), NOT \s+.
  //
  // The outer * matches one atomic unit per iteration: a complete quoted
  // string, a backslash-escape pair, or a single unquoted safe character.
  // The inner double-quote alternation (?:...|...)* is bounded by the
  // closing ", so it cannot interact with the outer * for backtracking.
  //
  // Note: $ is excluded from unquoted/double-quoted value classes to block
  // dangerous forms like $(cmd), ${var}, and $((expr)). This means
  // FOO=$VAR is not stripped — adding $VAR matching creates ReDoS risk
  // (CodeQL #671) and $VAR bypasses are low-priority.
  // ENV_VAR_PATTERN 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const ENV_VAR_PATTERN =
    /^([A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]*\])?)\+?=(?:'[^'\n\r]*'|"(?:\\.|[^"$`\\\n\r])*"|\\.|[^ \t\n\r$`;|&()<>\\\\'"])*[ \t]+/

  // stripped保存`command`，供Bash 工具 bash Permissions后续步骤使用。
  let stripped = command
  // previousStripped保存`''`，供Bash 工具 bash Permissions后续步骤使用。
  let previousStripped = ''

  // while 使用 stripped !== previousStripped 完成工具调用里的对应操作。
  while (stripped !== previousStripped) {
    // previousStripped更新为 `stripped`，确保Bash 工具后续读取最新状态。
    previousStripped = stripped
    // stripped更新为 `stripCommentLines(stripped)`，确保Bash 工具后续读取最新状态。
    stripped = stripCommentLines(stripped)

    // m匹配`stripped.match`，供工具调用后续处理使用。
    const m = stripped.match(ENV_VAR_PATTERN)
    // 判断 !m，将工具调用分流到只适用于该条件的处理路径。
    if (!m) continue
    // 判断 blocklist?.test(m[1]!)，将工具调用分流到只适用于该条件的处理路径。
    if (blocklist?.test(m[1]!)) break
    // stripped更新为 `stripped.slice(m[0].length)`，确保Bash 工具后续读取最新状态。
    stripped = stripped.slice(m[0].length)
  }

  // 返回 stripped.trim()，把工具调用这个分支的结果交还调用方。
  return stripped.trim()
}

// filterRulesByContentsMatchingInput 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function filterRulesByContentsMatchingInput(
  input: z.infer<typeof BashTool.inputSchema>,
  rules: Map<string, PermissionRule>,
  matchMode: 'exact' | 'prefix',
  {
    stripAllEnvVars = false,
    skipCompoundCheck = false,
  }: { stripAllEnvVars?: boolean; skipCompoundCheck?: boolean } = {},
): PermissionRule[] {
  // command 命令数据格式化`command.trim`，供工具调用后续处理使用。
  const command = input.command.trim()

  // Strip output redirections for permission matching
  // This allows rules like Bash(python:*) to match "python script.py > output.txt"
  // Security validation of redirection targets happens separately in checkPathConstraints
  // commandWithoutRedirections 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const commandWithoutRedirections =
    extractOutputRedirections(command).commandWithoutRedirections

  // For exact matching, try both the original command (to preserve quotes)
  // and the command without redirections (to allow rules without redirections to match)
  // For prefix matching, only use the command without redirections
  // commandsForMatching 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const commandsForMatching =
    matchMode === 'exact'
      ? [command, commandWithoutRedirections]
      : [commandWithoutRedirections]

  // Strip safe wrapper commands (timeout, time, nice, nohup) and env vars for matching
  // This allows rules like Bash(npm install:*) to match "timeout 10 npm install foo"
  // or "GOOS=linux go build"
  // commandsToTry 命令数据派生`commandsForMatching.flatMap`，供工具调用后续处理使用。
  const commandsToTry = commandsForMatching.flatMap(cmd => {
    // strippedCommand 命令数据保存`stripSafeWrappers`，供工具调用后续处理使用。
    const strippedCommand = stripSafeWrappers(cmd)
    // 返回 strippedCommand !== cmd ? [cmd, strippedCommand] : [cmd]，把工具调用这个分支的结果交还调用方。
    return strippedCommand !== cmd ? [cmd, strippedCommand] : [cmd]
  })

  // SECURITY: For deny/ask rules, also try matching after stripping ALL leading
  // env var prefixes. This prevents bypass via `FOO=bar denied_command` where
  // FOO is not in the safe-list. The safe-list restriction in stripSafeWrappers
  // is intentional for allow rules (see HackerOne #3543050), but deny rules
  // must be harder to circumvent — a denied command should stay denied
  // regardless of env var prefixes.
  //
  // We iteratively apply both stripping operations to all candidates until no
  // new candidates are produced (fixed-point). This handles interleaved patterns
  // like `nohup FOO=bar timeout 5 claude` where:
  //   1. stripSafeWrappers strips `nohup` → `FOO=bar timeout 5 claude`
  //   2. stripAllLeadingEnvVars strips `FOO=bar` → `timeout 5 claude`
  //   3. stripSafeWrappers strips `timeout 5` → `claude` (deny match)
  //
  // Without iteration, single-pass compositions miss multi-layer interleaving.
  // 满足 `stripAllEnvVars` 时，工具调用执行该分支。
  if (stripAllEnvVars) {
    // 已见集合保存`Set`，供工具调用后续处理使用。
    const seen = new Set(commandsToTry)
    // startIdx保存`0`，供Bash 工具 bash Permissions后续步骤使用。
    let startIdx = 0

    // Iterate until no new candidates are produced (fixed-point)
    // while 使用 startIdx < commandsToTry.length 完成工具调用里的对应操作。
    while (startIdx < commandsToTry.length) {
      // endIdx统计`commandsToTry.length`，供Bash 工具 bash Permissions后续步骤使用。
      const endIdx = commandsToTry.length
      // 遍历 let i = startIdx; i < endIdx; i++，让工具调用逐项完成同一类处理。
      for (let i = startIdx; i < endIdx; i++) {
        // cmd 命令数据保存`commandsToTry[i]`，供Bash 工具 bash Permissions后续步骤使用。
        const cmd = commandsToTry[i]
        // cmd 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
        if (!cmd) {
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
        // Try stripping env vars
        // envStripped保存`stripAllLeadingEnvVars`，供工具调用后续处理使用。
        const envStripped = stripAllLeadingEnvVars(cmd)
        // 判断 !seen.has(envStripped)，将工具调用分流到只适用于该条件的处理路径。
        if (!seen.has(envStripped)) {
          // commandsToTry 命令数据追加新条目，保持收集顺序与输入顺序一致。
          commandsToTry.push(envStripped)
          // seen.add执行工具调用在此处需要的副作用或外部交互。
          seen.add(envStripped)
        }
        // Try stripping safe wrappers
        // wrapperStripped保存`stripSafeWrappers`，供工具调用后续处理使用。
        const wrapperStripped = stripSafeWrappers(cmd)
        // 判断 !seen.has(wrapperStripped)，将工具调用分流到只适用于该条件的处理路径。
        if (!seen.has(wrapperStripped)) {
          // commandsToTry 命令数据追加新条目，保持收集顺序与输入顺序一致。
          commandsToTry.push(wrapperStripped)
          // seen.add执行工具调用在此处需要的副作用或外部交互。
          seen.add(wrapperStripped)
        }
      }
      // startIdx更新为 `endIdx`，确保Bash 工具后续读取最新状态。
      startIdx = endIdx
    }
  }

  // Precompute compound-command status for each candidate to avoid re-parsing
  // inside the rule filter loop (which would scale splitCommand calls with
  // rules.length × commandsToTry.length). The compound check only applies to
  // prefix/wildcard matching in 'prefix' mode, and only for allow rules.
  // SECURITY: deny/ask rules must match compound commands so they can't be
  // bypassed by wrapping a denied command in a compound expression.
  // isCompoundCommand 命令数据记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
  const isCompoundCommand = new Map<string, boolean>()
  // 只有 `matchMode === 'prefix' && !skipCompoundCheck` 满足时，工具调用才执行该分支。
  if (matchMode === 'prefix' && !skipCompoundCheck) {
    // 遍历 const cmd of commandsToTry，让工具调用逐项完成同一类处理。
    for (const cmd of commandsToTry) {
      // 判断 !isCompoundCommand.has(cmd)，将工具调用分流到只适用于该条件的处理路径。
      if (!isCompoundCommand.has(cmd)) {
        // isCompoundCommand.set写入新的状态值，使工具调用后续读取保持一致。
        isCompoundCommand.set(cmd, splitCommand(cmd).length > 1)
      }
    }
  }

  // 返回 Array.from(rules.entries())，把工具调用这个分支的结果交还调用方。
  return Array.from(rules.entries())
    // 链式调用 filter，继续加工上一行在工具调用中产生的数据。
    .filter(([ruleContent]) => {
      // bashRule保存`bashPermissionRule`，供工具调用后续处理使用。
      const bashRule = bashPermissionRule(ruleContent)

      // 返回 commandsToTry.some(cmdToMatch => {，把工具调用这个分支的结果交还调用方。
      return commandsToTry.some(cmdToMatch => {
        // 按照 bashRule.type 的取值选择工具调用的具体处理分支。
        switch (bashRule.type) {
          case 'exact':
            // 返回 bashRule.command === cmdToMatch，把工具调用这个分支的结果交还调用方。
            return bashRule.command === cmdToMatch
          case 'prefix':
            // 按照 matchMode 的取值选择工具调用的具体处理分支。
            switch (matchMode) {
              // In 'exact' mode, only return true if the command exactly matches the prefix rule
              case 'exact':
                // 返回 bashRule.prefix === cmdToMatch，把工具调用这个分支的结果交还调用方。
                return bashRule.prefix === cmdToMatch
              case 'prefix': {
                // SECURITY: Don't allow prefix rules to match compound commands.
                // e.g., Bash(cd:*) must NOT match "cd /path && python3 evil.py".
                // In the normal flow commands are split before reaching here, but
                // shell escaping can defeat the first splitCommand pass — e.g.,
                //   cd src\&\& python3 hello.py  →  splitCommand  →  ["cd src&& python3 hello.py"]
                // which then looks like a single command that starts with "cd ".
                // Re-splitting the candidate here catches those cases.
                // 判断 isCompoundCommand.get(cmdToMatch)，将工具调用分流到只适用于该条件的处理路径。
                if (isCompoundCommand.get(cmdToMatch)) {
                  // 返回 false，把工具调用这个分支的结果交还调用方。
                  return false
                }
                // Ensure word boundary: prefix must be followed by space or end of string
                // This prevents "ls:*" from matching "lsof" or "lsattr"
                // 满足 `cmdToMatch === bashRule.prefix` 时，工具调用执行该分支。
                if (cmdToMatch === bashRule.prefix) {
                  // 返回 true，把工具调用这个分支的结果交还调用方。
                  return true
                }
                // 判断 cmdToMatch.startsWith(bashRule.prefix + ' ')，将工具调用分流到只适用于该条件的处理路径。
                if (cmdToMatch.startsWith(bashRule.prefix + ' ')) {
                  // 返回 true，把工具调用这个分支的结果交还调用方。
                  return true
                }
                // Also match "xargs <prefix>" for bare xargs with no flags.
                // This allows Bash(grep:*) to match "xargs grep pattern",
                // and deny rules like Bash(rm:*) to block "xargs rm file".
                // Natural word-boundary: "xargs -n1 grep" does NOT start with
                // "xargs grep " so flagged xargs invocations are not matched.
                // xargsPrefix保存`'xargs ' + bashRule.prefix`，供Bash 工具 bash Permissions后续步骤使用。
                const xargsPrefix = 'xargs ' + bashRule.prefix
                // 满足 `cmdToMatch === xargsPrefix` 时，工具调用执行该分支。
                if (cmdToMatch === xargsPrefix) {
                  // 返回 true，把工具调用这个分支的结果交还调用方。
                  return true
                }
                // 返回 cmdToMatch.startsWith(xargsPrefix + ' ')，把工具调用这个分支的结果交还调用方。
                return cmdToMatch.startsWith(xargsPrefix + ' ')
              }
            }
            // 结束这个分支或循环，避免工具调用继续落入后续路径。
            break
          case 'wildcard':
            // SECURITY FIX: In exact match mode, wildcards must NOT match because we're
            // checking the full unparsed command. Wildcard matching on unparsed commands
            // allows "foo *" to match "foo arg && curl evil.com" since .* matches operators.
            // Wildcards should only match after splitting into individual subcommands.
            // `matchMode` 命中特定值 `'exact'` 时，进入工具调用对应处理。
            if (matchMode === 'exact') {
              // 返回 false，把工具调用这个分支的结果交还调用方。
              return false
            }
            // SECURITY: Same as for prefix rules, don't allow wildcard rules to match
            // compound commands in prefix mode. e.g., Bash(cd *) must not match
            // "cd /path && python3 evil.py" even though "cd *" pattern would match it.
            // 判断 isCompoundCommand.get(cmdToMatch)，将工具调用分流到只适用于该条件的处理路径。
            if (isCompoundCommand.get(cmdToMatch)) {
              // 返回 false，把工具调用这个分支的结果交还调用方。
              return false
            }
            // In prefix mode (after splitting), wildcards can safely match subcommands
            // 返回 matchWildcardPattern(bashRule.pattern, cmdToMatch)，把工具调用这个分支的结果交还调用方。
            return matchWildcardPattern(bashRule.pattern, cmdToMatch)
        }
      })
    })
    // 链式调用 map，继续加工上一行在工具调用中产生的数据。
    .map(([, rule]) => rule)
}

// matchingRulesForInput 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function matchingRulesForInput(
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
  matchMode: 'exact' | 'prefix',
  { skipCompoundCheck = false }: { skipCompoundCheck?: boolean } = {},
) {
  // denyRuleByContents 集合读取`getRuleByContentsForTool`，供工具调用后续处理使用。
  const denyRuleByContents = getRuleByContentsForTool(
    toolPermissionContext,
    BashTool,
    'deny',
  )
  // SECURITY: Deny/ask rules use aggressive env var stripping so that
  // `FOO=bar denied_command` still matches a deny rule for `denied_command`.
  // matchingDenyRules 集合筛选`filterRulesByContentsMatchingInput`，供工具调用后续处理使用。
  const matchingDenyRules = filterRulesByContentsMatchingInput(
    input,
    denyRuleByContents,
    matchMode,
    { stripAllEnvVars: true, skipCompoundCheck: true },
  )

  // askRuleByContents 集合读取`getRuleByContentsForTool`，供工具调用后续处理使用。
  const askRuleByContents = getRuleByContentsForTool(
    toolPermissionContext,
    BashTool,
    'ask',
  )
  // matchingAskRules 集合筛选`filterRulesByContentsMatchingInput`，供工具调用后续处理使用。
  const matchingAskRules = filterRulesByContentsMatchingInput(
    input,
    askRuleByContents,
    matchMode,
    { stripAllEnvVars: true, skipCompoundCheck: true },
  )

  // allowRuleByContents 集合读取`getRuleByContentsForTool`，供工具调用后续处理使用。
  const allowRuleByContents = getRuleByContentsForTool(
    toolPermissionContext,
    BashTool,
    'allow',
  )
  // matchingAllowRules 集合筛选`filterRulesByContentsMatchingInput`，供工具调用后续处理使用。
  const matchingAllowRules = filterRulesByContentsMatchingInput(
    input,
    allowRuleByContents,
    matchMode,
    { skipCompoundCheck },
  )

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    matchingDenyRules,
    matchingAskRules,
    matchingAllowRules,
  }
}

/**
 * Checks if the subcommand is an exact match for a permission rule
 */
// bashToolCheckExactMatchPermission 权限数据保存`(`，供Bash 工具 bash Permissions后续步骤使用。
export const bashToolCheckExactMatchPermission = (
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
): PermissionResult => {
  // command 命令数据格式化`command.trim`，供工具调用后续处理使用。
  const command = input.command.trim()
  // Bash 工具 bash Permissions先整理这一处局部数据，后续分支可以直接读取。
  const { matchingDenyRules, matchingAskRules, matchingAllowRules } =
    matchingRulesForInput(input, toolPermissionContext, 'exact')

  // 1. Deny if exact command was denied
  // `matchingDenyRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingDenyRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'deny',
      message: `Permission to use ${BashTool.name} with command ${command} has been denied.`,
      decisionReason: {
        type: 'rule',
        rule: matchingDenyRules[0],
      },
    }
  }

  // 2. Ask if exact command was in ask rules
  // `matchingAskRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingAskRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: createPermissionRequestMessage(BashTool.name),
      decisionReason: {
        type: 'rule',
        rule: matchingAskRules[0],
      },
    }
  }

  // 3. Allow if exact command was allowed
  // `matchingAllowRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingAllowRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'rule',
        rule: matchingAllowRules[0],
      },
    }
  }

  // 4. Otherwise, passthrough
  // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
  const decisionReason = {
    type: 'other' as const,
    reason: 'This command requires approval',
  }
  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: createPermissionRequestMessage(BashTool.name, decisionReason),
    decisionReason,
    // Suggest exact match rule to user
    // this may be overridden by prefix suggestions in `checkCommandAndSuggestRules()`
    suggestions: suggestionForExactCommand(command),
  }
}

// bashToolCheckPermission 权限数据保存`(`，供Bash 工具 bash Permissions后续步骤使用。
export const bashToolCheckPermission = (
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
  compoundCommandHasCd?: boolean,
  astCommand?: SimpleCommand,
): PermissionResult => {
  // command 命令数据格式化`command.trim`，供工具调用后续处理使用。
  const command = input.command.trim()

  // 1. Check exact match first
  // exactMatchResult保存`bashToolCheckExactMatchPermission`，供工具调用后续处理使用。
  const exactMatchResult = bashToolCheckExactMatchPermission(
    input,
    toolPermissionContext,
  )

  // 1a. Deny/ask if exact command has a rule
  // 工具调用在这里按实际状态进入对应分支。
  if (
    exactMatchResult.behavior === 'deny' ||
    exactMatchResult.behavior === 'ask'
  ) {
    // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
    return exactMatchResult
  }

  // 2. Find all matching rules (prefix or exact)
  // SECURITY FIX: Check Bash deny/ask rules BEFORE path constraints to prevent bypass
  // via absolute paths outside the project directory (HackerOne report)
  // When AST-parsed, the subcommand is already atomic — skip the legacy
  // splitCommand re-check that misparses mid-word # as compound.
  // Bash 工具 bash Permissions先整理这一处局部数据，后续分支可以直接读取。
  const { matchingDenyRules, matchingAskRules, matchingAllowRules } =
    matchingRulesForInput(input, toolPermissionContext, 'prefix', {
      skipCompoundCheck: astCommand !== undefined,
    })

  // 2a. Deny if command has a deny rule
  // `matchingDenyRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingDenyRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'deny',
      message: `Permission to use ${BashTool.name} with command ${command} has been denied.`,
      decisionReason: {
        type: 'rule',
        rule: matchingDenyRules[0],
      },
    }
  }

  // 2b. Ask if command has an ask rule
  // `matchingAskRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingAskRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: createPermissionRequestMessage(BashTool.name),
      decisionReason: {
        type: 'rule',
        rule: matchingAskRules[0],
      },
    }
  }

  // 3. Check path constraints
  // This check comes after deny/ask rules so explicit rules take precedence.
  // SECURITY: When AST-derived argv is available for this subcommand, pass
  // it through so checkPathConstraints uses it directly instead of re-parsing
  // with shell-quote (which has a single-quote backslash bug that causes
  // parseCommandArguments to return [] and silently skip path validation).
  // pathResult 文件数据读取`checkPathConstraints`，供工具调用后续处理使用。
  const pathResult = checkPathConstraints(
    input,
    getCwd(),
    toolPermissionContext,
    compoundCommandHasCd,
    astCommand?.redirects,
    astCommand ? [astCommand] : undefined,
  )
  // `pathResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (pathResult.behavior !== 'passthrough') {
    // 返回 pathResult，把工具调用这个分支的结果交还调用方。
    return pathResult
  }

  // 4. Allow if command had an exact match allow
  // `exactMatchResult.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
  if (exactMatchResult.behavior === 'allow') {
    // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
    return exactMatchResult
  }

  // 5. Allow if command has an allow rule
  // `matchingAllowRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingAllowRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'rule',
        rule: matchingAllowRules[0],
      },
    }
  }

  // 5b. Check sed constraints (blocks dangerous sed operations before mode auto-allow)
  // sedConstraintResult读取`checkSedConstraints`，供工具调用后续处理使用。
  const sedConstraintResult = checkSedConstraints(input, toolPermissionContext)
  // `sedConstraintResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (sedConstraintResult.behavior !== 'passthrough') {
    // 返回 sedConstraintResult，把工具调用这个分支的结果交还调用方。
    return sedConstraintResult
  }

  // 6. Check for mode-specific permission handling
  // modeResult读取`checkPermissionMode`，供工具调用后续处理使用。
  const modeResult = checkPermissionMode(input, toolPermissionContext)
  // `modeResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (modeResult.behavior !== 'passthrough') {
    // 返回 modeResult，把工具调用这个分支的结果交还调用方。
    return modeResult
  }

  // 7. Check read-only rules
  // 判断 BashTool.isReadOnly(input)，将工具调用分流到只适用于该条件的处理路径。
  if (BashTool.isReadOnly(input)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'other',
        reason: 'Read-only command is allowed',
      },
    }
  }

  // 8. Passthrough since no rules match, will trigger permission prompt
  // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
  const decisionReason = {
    type: 'other' as const,
    reason: 'This command requires approval',
  }
  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: createPermissionRequestMessage(BashTool.name, decisionReason),
    decisionReason,
    // Suggest exact match rule to user
    // this may be overridden by prefix suggestions in `checkCommandAndSuggestRules()`
    suggestions: suggestionForExactCommand(command),
  }
}

/**
 * Processes an individual subcommand and applies prefix checks & suggestions
 */
// checkCommandAndSuggestRules 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export async function checkCommandAndSuggestRules(
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
  commandPrefixResult: CommandPrefixResult | null | undefined,
  compoundCommandHasCd?: boolean,
  astParseSucceeded?: boolean,
): Promise<PermissionResult> {
  // 1. Check exact match first
  // exactMatchResult保存`bashToolCheckExactMatchPermission`，供工具调用后续处理使用。
  const exactMatchResult = bashToolCheckExactMatchPermission(
    input,
    toolPermissionContext,
  )
  // `exactMatchResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (exactMatchResult.behavior !== 'passthrough') {
    // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
    return exactMatchResult
  }

  // 2. Check the command prefix
  // permissionResult 权限数据保存`bashToolCheckPermission`，供工具调用后续处理使用。
  const permissionResult = bashToolCheckPermission(
    input,
    toolPermissionContext,
    compoundCommandHasCd,
  )
  // 2a. Deny/ask if command was explictly denied/asked
  // 工具调用在这里按实际状态进入对应分支。
  if (
    permissionResult.behavior === 'deny' ||
    permissionResult.behavior === 'ask'
  ) {
    // 返回 permissionResult，把工具调用这个分支的结果交还调用方。
    return permissionResult
  }

  // 3. Ask for permission if command injection is detected. Skip when the
  // AST parse already succeeded — tree-sitter has verified there are no
  // hidden substitutions or structural tricks, so the legacy regex-based
  // validators (backslash-escaped operators, etc.) would only add FPs.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    !astParseSucceeded &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_COMMAND_INJECTION_CHECK)
  ) {
    // safetyResult保存`bashCommandIsSafeAsync`，供工具调用后续处理使用。
    const safetyResult = await bashCommandIsSafeAsync(input.command)

    // `safetyResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
    if (safetyResult.behavior !== 'passthrough') {
      // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
      const decisionReason: PermissionDecisionReason = {
        type: 'other' as const,
        reason:
          safetyResult.behavior === 'ask' && safetyResult.message
            ? safetyResult.message
            : 'This command contains patterns that could pose security risks and requires approval',
      }

      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message: createPermissionRequestMessage(BashTool.name, decisionReason),
        decisionReason,
        suggestions: [], // Don't suggest saving a potentially dangerous command
      }
    }
  }

  // 4. Allow if command was allowed
  // `permissionResult.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
  if (permissionResult.behavior === 'allow') {
    // 返回 permissionResult，把工具调用这个分支的结果交还调用方。
    return permissionResult
  }

  // 5. Suggest prefix if available, otherwise exact command
  // suggestedUpdates 集合保存`commandPrefixResult?.commandPrefix`，供Bash 工具 bash Permissions后续步骤使用。
  const suggestedUpdates = commandPrefixResult?.commandPrefix
    ? suggestionForPrefix(commandPrefixResult.commandPrefix)
    : suggestionForExactCommand(input.command)

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    ...permissionResult,
    suggestions: suggestedUpdates,
  }
}

/**
 * Checks if a command should be auto-allowed when sandboxed.
 * Returns early if there are explicit deny/ask rules that should be respected.
 *
 * NOTE: This function should only be called when sandboxing and auto-allow are enabled.
 *
 * @param input - The bash tool input
 * @param toolPermissionContext - The permission context
 * @returns PermissionResult with:
 *   - deny/ask if explicit rule exists (exact or prefix)
 *   - allow if no explicit rules (sandbox auto-allow applies)
 *   - passthrough should not occur since we're in auto-allow mode
 */
// checkSandboxAutoAllow 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function checkSandboxAutoAllow(
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
): PermissionResult {
  // command 命令数据格式化`command.trim`，供工具调用后续处理使用。
  const command = input.command.trim()

  // Check for explicit deny/ask rules on the full command (exact + prefix)
  // 从 `matchingRulesForInput(` 解构 matchingDenyRules、matchingAskRules，减少Bash 工具 bash Permissions对同一对象的重复访问。
  const { matchingDenyRules, matchingAskRules } = matchingRulesForInput(
    input,
    toolPermissionContext,
    'prefix',
  )

  // Return immediately if there's an explicit deny rule on the full command
  // `matchingDenyRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingDenyRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'deny',
      message: `Permission to use ${BashTool.name} with command ${command} has been denied.`,
      decisionReason: {
        type: 'rule',
        rule: matchingDenyRules[0],
      },
    }
  }

  // SECURITY: For compound commands, check each subcommand against deny/ask
  // rules. Prefix rules like Bash(rm:*) won't match the full compound command
  // (e.g., "echo hello && rm -rf /" doesn't start with "rm"), so we must
  // check each subcommand individually.
  // IMPORTANT: Subcommand deny checks must run BEFORE full-command ask returns.
  // Otherwise a wildcard ask rule matching the full command (e.g., Bash(*echo*))
  // would return 'ask' before a prefix deny rule on a subcommand (e.g., Bash(rm:*))
  // gets checked, downgrading a deny to an ask.
  // subcommands 命令数据格式化`splitCommand`，供工具调用后续处理使用。
  const subcommands = splitCommand(command)
  // 满足 `subcommands.length > 1` 时，工具调用执行该分支。
  if (subcommands.length > 1) {
    // firstAskRule先声明占位，稍后的分支会根据实际输入补齐。
    let firstAskRule: PermissionRule | undefined
    // 遍历 const sub of subcommands，让工具调用逐项完成同一类处理。
    for (const sub of subcommands) {
      // subResult保存`matchingRulesForInput`，供工具调用后续处理使用。
      const subResult = matchingRulesForInput(
        { command: sub },
        toolPermissionContext,
        'prefix',
      )
      // Deny takes priority — return immediately
      // `subResult.matchingDenyRules[0]` 与 `undefined` 不一致时刷新派生状态。
      if (subResult.matchingDenyRules[0] !== undefined) {
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'deny',
          message: `Permission to use ${BashTool.name} with command ${command} has been denied.`,
          decisionReason: {
            type: 'rule',
            rule: subResult.matchingDenyRules[0],
          },
        }
      }
      // Stash first ask match; don't return yet (deny across all subs takes priority)
      // Bash 工具 bash Permissions处理 `firstAskRule ??= subResult.matchingAskRules[0]`，完成这一小步状态转换。
      firstAskRule ??= subResult.matchingAskRules[0]
    }
    // 满足 `firstAskRule` 时，工具调用执行该分支。
    if (firstAskRule) {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message: createPermissionRequestMessage(BashTool.name),
        decisionReason: {
          type: 'rule',
          rule: firstAskRule,
        },
      }
    }
  }

  // Full-command ask check (after all deny sources have been exhausted)
  // `matchingAskRules[0]` 与 `undefined` 不一致时刷新派生状态。
  if (matchingAskRules[0] !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: createPermissionRequestMessage(BashTool.name),
      decisionReason: {
        type: 'rule',
        rule: matchingAskRules[0],
      },
    }
  }
  // No explicit rules, so auto-allow with sandbox

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'allow',
    updatedInput: input,
    decisionReason: {
      type: 'other',
      reason: 'Auto-allowed with sandbox (autoAllowBashIfSandboxed enabled)',
    },
  }
}

/**
 * Filter out `cd ${cwd}` prefix subcommands, keeping astCommands aligned.
 * Extracted to keep bashToolHasPermission under Bun's feature() DCE
 * complexity threshold — inlining this breaks pendingClassifierCheck
 * attachment in ~10 classifier tests.
 */
// filterCdCwdSubcommands 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function filterCdCwdSubcommands(
  rawSubcommands: string[],
  astCommands: SimpleCommand[] | undefined,
  cwd: string,
  cwdMingw: string,
): { subcommands: string[]; astCommandsByIdx: (SimpleCommand | undefined)[] } {
  // subcommands 命令数据从空数组开始收集，后续按处理顺序追加条目。
  const subcommands: string[] = []
  // astCommandsByIdx 命令数据从空数组开始收集，后续按处理顺序追加条目。
  const astCommandsByIdx: (SimpleCommand | undefined)[] = []
  // 遍历 let i = 0; i < rawSubcommands.length; i++，让工具调用逐项完成同一类处理。
  for (let i = 0; i < rawSubcommands.length; i++) {
    // cmd 命令数据保存`rawSubcommands[i]!`，供Bash 工具 bash Permissions后续步骤使用。
    const cmd = rawSubcommands[i]!
    // 判断 cmd === `cd ${cwd}` || cmd === `cd ${cwdMingw}`，将工具调用分流到只适用于该条件的处理路径。
    if (cmd === `cd ${cwd}` || cmd === `cd ${cwdMingw}`) continue
    // subcommands 命令数据追加新条目，保持收集顺序与输入顺序一致。
    subcommands.push(cmd)
    // astCommandsByIdx 命令数据追加新条目，保持收集顺序与输入顺序一致。
    astCommandsByIdx.push(astCommands?.[i])
  }
  // 返回 { subcommands, astCommandsByIdx }，把工具调用这个分支的结果交还调用方。
  return { subcommands, astCommandsByIdx }
}

/**
 * Early-exit deny enforcement for the AST too-complex and checkSemantics
 * paths. Returns the exact-match result if non-passthrough (deny/ask/allow),
 * then checks prefix/wildcard deny rules. Returns null if neither matched,
 * meaning the caller should fall through to ask. Extracted to keep
 * bashToolHasPermission under Bun's feature() DCE complexity threshold.
 */
// checkEarlyExitDeny 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function checkEarlyExitDeny(
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
): PermissionResult | null {
  // exactMatchResult保存`bashToolCheckExactMatchPermission`，供工具调用后续处理使用。
  const exactMatchResult = bashToolCheckExactMatchPermission(
    input,
    toolPermissionContext,
  )
  // `exactMatchResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (exactMatchResult.behavior !== 'passthrough') {
    // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
    return exactMatchResult
  }
  // denyMatch保存`matchingRulesForInput`，供工具调用后续处理使用。
  const denyMatch = matchingRulesForInput(
    input,
    toolPermissionContext,
    'prefix',
  ).matchingDenyRules[0]
  // `denyMatch` 与 `undefined` 不一致时刷新派生状态。
  if (denyMatch !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'deny',
      message: `Permission to use ${BashTool.name} with command ${input.command} has been denied.`,
      decisionReason: { type: 'rule', rule: denyMatch },
    }
  }
  // 返回 null，把工具调用这个分支的结果交还调用方。
  return null
}

/**
 * checkSemantics-path deny enforcement. Calls checkEarlyExitDeny (exact-match
 * + full-command prefix deny), then checks each individual SimpleCommand .text
 * span against prefix deny rules. The per-subcommand check is needed because
 * filterRulesByContentsMatchingInput has a compound-command guard
 * (splitCommand().length > 1 → prefix rules return false) that defeats
 * `Bash(eval:*)` matching against a full pipeline like `echo foo | eval rm`.
 * Each SimpleCommand span is a single command, so the guard doesn't fire.
 *
 * Separate helper (not folded into checkEarlyExitDeny or inlined at the call
 * site) because bashToolHasPermission is tight against Bun's feature() DCE
 * complexity threshold — adding even ~5 lines there breaks
 * feature('BASH_CLASSIFIER') evaluation and drops pendingClassifierCheck.
 */
// checkSemanticsDeny 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function checkSemanticsDeny(
  input: z.infer<typeof BashTool.inputSchema>,
  toolPermissionContext: ToolPermissionContext,
  commands: readonly { text: string }[],
): PermissionResult | null {
  // fullCmd 命令数据读取`checkEarlyExitDeny`，供工具调用后续处理使用。
  const fullCmd = checkEarlyExitDeny(input, toolPermissionContext)
  // 判断 fullCmd !== null，将工具调用分流到只适用于该条件的处理路径。
  if (fullCmd !== null) return fullCmd
  // 遍历 const cmd of commands，让工具调用逐项完成同一类处理。
  for (const cmd of commands) {
    // subDeny保存`matchingRulesForInput`，供工具调用后续处理使用。
    const subDeny = matchingRulesForInput(
      { ...input, command: cmd.text },
      toolPermissionContext,
      'prefix',
    ).matchingDenyRules[0]
    // `subDeny` 与 `undefined` 不一致时刷新派生状态。
    if (subDeny !== undefined) {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'deny',
        message: `Permission to use ${BashTool.name} with command ${input.command} has been denied.`,
        decisionReason: { type: 'rule', rule: subDeny },
      }
    }
  }
  // 返回 null，把工具调用这个分支的结果交还调用方。
  return null
}

/**
 * Builds the pending classifier check metadata if classifier is enabled and has allow descriptions.
 * Returns undefined if classifier is disabled, in auto mode, or no allow descriptions exist.
 */
// buildPendingClassifierCheck 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
function buildPendingClassifierCheck(
  command: string,
  toolPermissionContext: ToolPermissionContext,
): { command: string; cwd: string; descriptions: string[] } | undefined {
  // 判断 !isClassifierPermissionsEnabled()，将工具调用分流到只适用于该条件的处理路径。
  if (!isClassifierPermissionsEnabled()) {
    // 返回 undefined，把工具调用这个分支的结果交还调用方。
    return undefined
  }
  // Skip in auto mode - auto mode classifier handles all permission decisions
  // 判断 feature('TRANSCRIPT_CLASSIFIER') && toolPermissionContext.mode === 'auto'，将工具调用分流到只适用于该条件的处理路径。
  if (feature('TRANSCRIPT_CLASSIFIER') && toolPermissionContext.mode === 'auto')
    // 返回 undefined，把工具调用这个分支的结果交还调用方。
    return undefined
  // 判断 toolPermissionContext.mode === 'bypassPermissions'，将工具调用分流到只适用于该条件的处理路径。
  if (toolPermissionContext.mode === 'bypassPermissions') return undefined

  // allowDescriptions 集合读取`getBashPromptAllowDescriptions`，供工具调用后续处理使用。
  const allowDescriptions = getBashPromptAllowDescriptions(
    toolPermissionContext,
  )
  // 判断 allowDescriptions.length === 0，将工具调用分流到只适用于该条件的处理路径。
  if (allowDescriptions.length === 0) return undefined

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    command,
    cwd: getCwd(),
    descriptions: allowDescriptions,
  }
}

// speculativeChecks 集合构建`new Map<string, Promise<ClassifierResult>>()`，供Bash 工具 bash Permissions后续步骤使用。
const speculativeChecks = new Map<string, Promise<ClassifierResult>>()

/**
 * Start a speculative bash allow classifier check early, so it runs in
 * parallel with pre-tool hooks, deny/ask classifiers, and permission dialog setup.
 * The result can be consumed later by executeAsyncClassifierCheck via
 * consumeSpeculativeClassifierCheck.
 */
// peekSpeculativeClassifierCheck 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function peekSpeculativeClassifierCheck(
  command: string,
): Promise<ClassifierResult> | undefined {
  // 返回 speculativeChecks.get(command)，把工具调用这个分支的结果交还调用方。
  return speculativeChecks.get(command)
}

// startSpeculativeClassifierCheck 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function startSpeculativeClassifierCheck(
  command: string,
  toolPermissionContext: ToolPermissionContext,
  signal: AbortSignal,
  isNonInteractiveSession: boolean,
): boolean {
  // Same guards as buildPendingClassifierCheck
  // 判断 !isClassifierPermissionsEnabled()，将工具调用分流到只适用于该条件的处理路径。
  if (!isClassifierPermissionsEnabled()) return false
  // 判断 feature('TRANSCRIPT_CLASSIFIER') && toolPermissionContext.mode === 'auto'，将工具调用分流到只适用于该条件的处理路径。
  if (feature('TRANSCRIPT_CLASSIFIER') && toolPermissionContext.mode === 'auto')
    // 返回 false，把工具调用这个分支的结果交还调用方。
    return false
  // 判断 toolPermissionContext.mode === 'bypassPermissions'，将工具调用分流到只适用于该条件的处理路径。
  if (toolPermissionContext.mode === 'bypassPermissions') return false
  // allowDescriptions 集合读取`getBashPromptAllowDescriptions`，供工具调用后续处理使用。
  const allowDescriptions = getBashPromptAllowDescriptions(
    toolPermissionContext,
  )
  // 判断 allowDescriptions.length === 0，将工具调用分流到只适用于该条件的处理路径。
  if (allowDescriptions.length === 0) return false

  // cwd读取`getCwd`，供工具调用后续处理使用。
  const cwd = getCwd()
  // promise保存`classifyBashCommand`，供工具调用后续处理使用。
  const promise = classifyBashCommand(
    command,
    cwd,
    allowDescriptions,
    'allow',
    signal,
    isNonInteractiveSession,
  )
  // Prevent unhandled rejection if the signal aborts before this promise is consumed.
  // The original promise (which may reject) is still stored in the Map for consumers to await.
  // promise.catch执行工具调用在此处需要的副作用或外部交互。
  promise.catch(() => {})
  // speculativeChecks.set写入新的状态值，使工具调用后续读取保持一致。
  speculativeChecks.set(command, promise)
  // 返回 true，把工具调用这个分支的结果交还调用方。
  return true
}

/**
 * Consume a speculative classifier check result for the given command.
 * Returns the promise if one exists (and removes it from the map), or undefined.
 */
// consumeSpeculativeClassifierCheck 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function consumeSpeculativeClassifierCheck(
  command: string,
): Promise<ClassifierResult> | undefined {
  // promise读取`speculativeChecks.get`，供工具调用后续处理使用。
  const promise = speculativeChecks.get(command)
  // 满足 `promise` 时，工具调用执行该分支。
  if (promise) {
    // speculativeChecks.delete执行工具调用在此处需要的副作用或外部交互。
    speculativeChecks.delete(command)
  }
  // 返回 promise，把工具调用这个分支的结果交还调用方。
  return promise
}

// clearSpeculativeChecks 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function clearSpeculativeChecks(): void {
  // speculativeChecks.clear执行工具调用在此处需要的副作用或外部交互。
  speculativeChecks.clear()
}

/**
 * Await a pending classifier check and return a PermissionDecisionReason if
 * high-confidence allow, or undefined otherwise.
 *
 * Used by swarm agents (both tmux and in-process) to gate permission
 * forwarding: run the classifier first, and only escalate to the leader
 * if the classifier doesn't auto-approve.
 */
// awaitClassifierAutoApproval 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export async function awaitClassifierAutoApproval(
  pendingCheck: PendingClassifierCheck,
  signal: AbortSignal,
  isNonInteractiveSession: boolean,
): Promise<PermissionDecisionReason | undefined> {
  // 从 `pendingCheck` 解构 command、cwd、descriptions，减少Bash 工具 bash Permissions对同一对象的重复访问。
  const { command, cwd, descriptions } = pendingCheck
  // speculativeResult保存`consumeSpeculativeClassifierCheck`，供工具调用后续处理使用。
  const speculativeResult = consumeSpeculativeClassifierCheck(command)
  // classifierResult保存`speculativeResult`，供Bash 工具 bash Permissions后续步骤使用。
  const classifierResult = speculativeResult
    ? await speculativeResult
    : await classifyBashCommand(
        command,
        cwd,
        descriptions,
        'allow',
        signal,
        isNonInteractiveSession,
      )

  // logClassifierResultForAnts执行工具调用在此处需要的副作用或外部交互。
  logClassifierResultForAnts(command, 'allow', descriptions, classifierResult)

  // 工具调用在这里按实际状态进入对应分支。
  if (
    feature('BASH_CLASSIFIER') &&
    classifierResult.matches &&
    classifierResult.confidence === 'high'
  ) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      type: 'classifier',
      classifier: 'bash_allow',
      reason: `Allowed by prompt rule: "${classifierResult.matchedDescription}"`,
    }
  }
  // 返回 undefined，把工具调用这个分支的结果交还调用方。
  return undefined
}

// AsyncClassifierCheckCallbacks 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type AsyncClassifierCheckCallbacks = {
  shouldContinue: () => boolean
  onAllow: (decisionReason: PermissionDecisionReason) => void
  onComplete?: () => void
}

/**
 * Execute the bash allow classifier check asynchronously.
 * This runs in the background while the permission prompt is shown.
 * If the classifier allows with high confidence and the user hasn't interacted, auto-approves.
 *
 * @param pendingCheck - Classifier check metadata from bashToolHasPermission
 * @param signal - Abort signal
 * @param isNonInteractiveSession - Whether this is a non-interactive session
 * @param callbacks - Callbacks to check if we should continue and handle approval
 */
// executeAsyncClassifierCheck 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export async function executeAsyncClassifierCheck(
  pendingCheck: { command: string; cwd: string; descriptions: string[] },
  signal: AbortSignal,
  isNonInteractiveSession: boolean,
  callbacks: AsyncClassifierCheckCallbacks,
): Promise<void> {
  // 从 `pendingCheck` 解构 command、cwd、descriptions，减少Bash 工具 bash Permissions对同一对象的重复访问。
  const { command, cwd, descriptions } = pendingCheck
  // speculativeResult保存`consumeSpeculativeClassifierCheck`，供工具调用后续处理使用。
  const speculativeResult = consumeSpeculativeClassifierCheck(command)

  // classifierResult先声明占位，稍后的分支会根据实际输入补齐。
  let classifierResult: ClassifierResult
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // classifierResult更新为 `speculativeResult`，确保Bash 工具后续读取最新状态。
    classifierResult = speculativeResult
      ? await speculativeResult
      : await classifyBashCommand(
          command,
          cwd,
          descriptions,
          'allow',
          signal,
          isNonInteractiveSession,
        )
  } catch (error: unknown) {
    // When the coordinator session is cancelled, the abort signal fires and the
    // classifier API call rejects with APIUserAbortError. This is expected and
    // should not surface as an unhandled promise rejection.
    // 只有 `error instanceof APIUserAbortError || error insta` 满足时，工具调用才执行该分支。
    if (error instanceof APIUserAbortError || error instanceof AbortError) {
      // 调用 callbacks.onComplete?.()，完成这一处局部操作。
      callbacks.onComplete?.()
      // Bash 工具 bash Permissions在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
    // 调用 callbacks.onComplete?.()，完成这一处局部操作。
    callbacks.onComplete?.()
    // 抛出 error，阻止工具调用在无效状态下继续运行。
    throw error
  }

  // logClassifierResultForAnts执行工具调用在此处需要的副作用或外部交互。
  logClassifierResultForAnts(command, 'allow', descriptions, classifierResult)

  // Don't auto-approve if user already made a decision or has interacted
  // with the permission dialog (e.g., arrow keys, tab, typing)
  // 判断 !callbacks.shouldContinue()，将工具调用分流到只适用于该条件的处理路径。
  if (!callbacks.shouldContinue()) return

  // 工具调用在这里按实际状态进入对应分支。
  if (
    feature('BASH_CLASSIFIER') &&
    classifierResult.matches &&
    classifierResult.confidence === 'high'
  ) {
    // callbacks.onAllow执行工具调用在此处需要的副作用或外部交互。
    callbacks.onAllow({
      type: 'classifier',
      classifier: 'bash_allow',
      reason: `Allowed by prompt rule: "${classifierResult.matchedDescription}"`,
    })
  } else {
    // No match — notify so the checking indicator is cleared
    // 调用 callbacks.onComplete?.()，完成这一处局部操作。
    callbacks.onComplete?.()
  }
}

/**
 * The main implementation to check if we need to ask for user permission to call BashTool with a given input
 */
// bashToolHasPermission 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export async function bashToolHasPermission(
  input: z.infer<typeof BashTool.inputSchema>,
  context: ToolUseContext,
  getCommandSubcommandPrefixFn = getCommandSubcommandPrefix,
): Promise<PermissionResult> {
  // 应用状态读取`context.getAppState`，供工具调用后续处理使用。
  let appState = context.getAppState()

  // 0. AST-based security parse. This replaces both tryParseShellCommand
  // (the shell-quote pre-check) and the bashCommandIsSafe misparsing gate.
  // tree-sitter produces either a clean SimpleCommand[] (quotes resolved,
  // no hidden substitutions) or 'too-complex' — which is exactly the signal
  // we need to decide whether splitCommand's output can be trusted.
  //
  // When tree-sitter WASM is unavailable OR the injection check is disabled
  // via env var, we fall back to the old path (legacy gate at ~1370 runs).
  // injectionCheckDisabled保存`isEnvTruthy`，供工具调用后续处理使用。
  const injectionCheckDisabled = isEnvTruthy(
    process.env.CLAUDE_CODE_DISABLE_COMMAND_INJECTION_CHECK,
  )
  // GrowthBook killswitch for shadow mode — when off, skip the native parse
  // entirely. Computed once; feature() must stay inline in the ternary below.
  // shadowEnabled保存`feature`，供工具调用后续处理使用。
  const shadowEnabled = feature('TREE_SITTER_BASH_SHADOW')
    ? getFeatureValue_CACHED_MAY_BE_STALE('tengu_birch_trellis', true)
    : false
  // Parse once here; the resulting AST feeds both parseForSecurityFromAst
  // and bashToolCheckCommandOperatorPermissions.
  // astRoot保存`injectionCheckDisabled`，供Bash 工具 bash Permissions后续步骤使用。
  let astRoot = injectionCheckDisabled
    ? null
    : feature('TREE_SITTER_BASH_SHADOW') && !shadowEnabled
      ? null
      : await parseCommandRaw(input.command)
  // astResult保存`astRoot`，供Bash 工具 bash Permissions后续步骤使用。
  let astResult: ParseForSecurityResult = astRoot
    ? parseForSecurityFromAst(input.command, astRoot)
    : { kind: 'parse-unavailable' }
  // astSubcommands 命令数据保存`null`，供Bash 工具 bash Permissions后续步骤使用。
  let astSubcommands: string[] | null = null
  // astRedirects 集合先声明占位，稍后的分支会根据实际输入补齐。
  let astRedirects: Redirect[] | undefined
  // astCommands 命令数据先声明占位，稍后的分支会根据实际输入补齐。
  let astCommands: SimpleCommand[] | undefined
  // shadowLegacySubs 集合先声明占位，稍后的分支会根据实际输入补齐。
  let shadowLegacySubs: string[] | undefined

  // Shadow-test tree-sitter: record its verdict, then force parse-unavailable
  // so the legacy path stays authoritative. parseCommand stays gated on
  // TREE_SITTER_BASH (not SHADOW) so legacy internals remain pure regex.
  // One event per bash call captures both divergence AND unavailability
  // reasons; module-load failures are separately covered by the
  // session-scoped tengu_tree_sitter_load event.
  // 判断 feature('TREE_SITTER_BASH_SHADOW')，将工具调用分流到只适用于该条件的处理路径。
  if (feature('TREE_SITTER_BASH_SHADOW')) {
    // available记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
    const available = astResult.kind !== 'parse-unavailable'
    // tooComplex记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
    let tooComplex = false
    // semanticFail记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
    let semanticFail = false
    // subsDiffer记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
    let subsDiffer = false
    // 满足 `available` 时，工具调用执行该分支。
    if (available) {
      // tooComplex更新为 `astResult.kind === 'too-complex'`，确保Bash 工具后续读取最新状态。
      tooComplex = astResult.kind === 'too-complex'
      // Bash 工具 bash Permissions处理 `semanticFail =`，完成这一小步状态转换。
      semanticFail =
        astResult.kind === 'simple' && !checkSemantics(astResult.commands).ok
      // tsSubs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const tsSubs =
        astResult.kind === 'simple'
          // 这个回调绑定到 ? astResult.commands.map(c => c.text)，负责工具调用在该局部场景下的响应。
          ? astResult.commands.map(c => c.text)
          : undefined
      // legacySubs 集合格式化`splitCommand`，供工具调用后续处理使用。
      const legacySubs = splitCommand(input.command)
      // shadowLegacySubs 集合更新为 `legacySubs`，确保Bash 工具后续读取最新状态。
      shadowLegacySubs = legacySubs
      // Bash 工具 bash Permissions处理 `subsDiffer =`，完成这一小步状态转换。
      subsDiffer =
        tsSubs !== undefined &&
        (tsSubs.length !== legacySubs.length ||
          // tsSubs.some执行工具调用在此处需要的副作用或外部交互。
          tsSubs.some((s, i) => s !== legacySubs[i]))
    }
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_tree_sitter_shadow', {
      available,
      astTooComplex: tooComplex,
      astSemanticFail: semanticFail,
      subsDiffer,
      injectionCheckDisabled,
      killswitchOff: !shadowEnabled,
      cmdOverLength: input.command.length > 10000,
    })
    // Always force legacy — shadow mode is observational only.
    // astResult更新为 `{ kind: 'parse-unavailable' }`，确保Bash 工具后续读取最新状态。
    astResult = { kind: 'parse-unavailable' }
    // astRoot更新为 `null`，确保Bash 工具后续读取最新状态。
    astRoot = null
  }

  // `astResult.kind` 命中特定值 `'too-complex'` 时，进入工具调用对应处理。
  if (astResult.kind === 'too-complex') {
    // Parse succeeded but found structure we can't statically analyze
    // (command substitution, expansion, control flow, parser differential).
    // Respect exact-match deny/ask/allow, then prefix/wildcard deny. Only
    // fall through to ask if no deny matched — don't downgrade deny to ask.
    // earlyExit读取`checkEarlyExitDeny`，供工具调用后续处理使用。
    const earlyExit = checkEarlyExitDeny(input, appState.toolPermissionContext)
    // 判断 earlyExit !== null，将工具调用分流到只适用于该条件的处理路径。
    if (earlyExit !== null) return earlyExit
    // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
    const decisionReason: PermissionDecisionReason = {
      type: 'other' as const,
      reason: astResult.reason,
    }
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_ast_too_complex', {
      nodeTypeId: nodeTypeId(astResult.nodeType),
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      decisionReason,
      message: createPermissionRequestMessage(BashTool.name, decisionReason),
      suggestions: [],
      ...(feature('BASH_CLASSIFIER')
        ? {
            pendingClassifierCheck: buildPendingClassifierCheck(
              input.command,
              appState.toolPermissionContext,
            ),
          }
        : {}),
    }
  }

  // `astResult.kind` 命中特定值 `'simple'` 时，进入工具调用对应处理。
  if (astResult.kind === 'simple') {
    // Clean parse: check semantic-level concerns (zsh builtins, eval, etc.)
    // that tokenize fine but are dangerous by name.
    // sem读取`checkSemantics`，供工具调用后续处理使用。
    const sem = checkSemantics(astResult.commands)
    // sem.ok缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!sem.ok) {
      // Same deny-rule enforcement as the too-complex path: a user with
      // `Bash(eval:*)` deny expects `eval "rm"` blocked, not downgraded.
      // earlyExit读取`checkSemanticsDeny`，供工具调用后续处理使用。
      const earlyExit = checkSemanticsDeny(
        input,
        appState.toolPermissionContext,
        astResult.commands,
      )
      // 判断 earlyExit !== null，将工具调用分流到只适用于该条件的处理路径。
      if (earlyExit !== null) return earlyExit
      // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
      const decisionReason: PermissionDecisionReason = {
        type: 'other' as const,
        reason: sem.reason,
      }
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        decisionReason,
        message: createPermissionRequestMessage(BashTool.name, decisionReason),
        suggestions: [],
      }
    }
    // Stash the tokenized subcommands for use below. Downstream code (rule
    // matching, path extraction, cd detection) still operates on strings, so
    // we pass the original source span for each SimpleCommand. Downstream
    // processing (stripSafeWrappers, parseCommandArguments) re-tokenizes
    // these spans — that re-tokenization has known bugs (stripCommentLines
    // mishandles newlines inside quotes), but checkSemantics already caught
    // any argv element containing a newline, so those bugs can't bite here.
    // Migrating downstream to operate on argv directly is a later commit.
    // astSubcommands 命令数据更新为 `astResult.commands.map(c => c.text)`，确保Bash 工具后续读取最新状态。
    astSubcommands = astResult.commands.map(c => c.text)
    // astRedirects 集合更新为 `astResult.commands.flatMap(c => c.redirects)`，确保Bash 工具后续读取最新状态。
    astRedirects = astResult.commands.flatMap(c => c.redirects)
    // astCommands 命令数据更新为 `astResult.commands`，确保Bash 工具后续读取最新状态。
    astCommands = astResult.commands
  }

  // Legacy shell-quote pre-check. Only reached on 'parse-unavailable'
  // (tree-sitter not loaded OR TREE_SITTER_BASH feature gated off). Falls
  // through to the full legacy path below.
  // `astResult.kind` 命中特定值 `'parse-unavailable'` 时，进入工具调用对应处理。
  if (astResult.kind === 'parse-unavailable') {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'bashToolHasPermission: tree-sitter unavailable, using legacy shell-quote path',
    )
    // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
    const parseResult = tryParseShellCommand(input.command)
    // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!parseResult.success) {
      // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
      const decisionReason = {
        type: 'other' as const,
        reason: `Command contains malformed syntax that cannot be parsed: ${parseResult.error}`,
      }
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        decisionReason,
        message: createPermissionRequestMessage(BashTool.name, decisionReason),
      }
    }
  }

  // Check sandbox auto-allow (which respects explicit deny/ask rules)
  // Only call this if sandboxing and auto-allow are both enabled
  // 工具调用在这里按实际状态进入对应分支。
  if (
    SandboxManager.isSandboxingEnabled() &&
    SandboxManager.isAutoAllowBashIfSandboxedEnabled() &&
    shouldUseSandbox(input)
  ) {
    // sandboxAutoAllowResult读取`checkSandboxAutoAllow`，供工具调用后续处理使用。
    const sandboxAutoAllowResult = checkSandboxAutoAllow(
      input,
      appState.toolPermissionContext,
    )
    // `sandboxAutoAllowResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
    if (sandboxAutoAllowResult.behavior !== 'passthrough') {
      // 返回 sandboxAutoAllowResult，把工具调用这个分支的结果交还调用方。
      return sandboxAutoAllowResult
    }
  }

  // Check exact match first
  // exactMatchResult保存`bashToolCheckExactMatchPermission`，供工具调用后续处理使用。
  const exactMatchResult = bashToolCheckExactMatchPermission(
    input,
    appState.toolPermissionContext,
  )

  // Exact command was denied
  // `exactMatchResult.behavior` 命中特定值 `'deny'` 时，进入工具调用对应处理。
  if (exactMatchResult.behavior === 'deny') {
    // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
    return exactMatchResult
  }

  // Check Bash prompt deny and ask rules in parallel (both use Haiku).
  // Deny takes precedence over ask, and both take precedence over allow rules.
  // Skip when in auto mode - auto mode classifier handles all permission decisions
  // 工具调用在这里按实际状态进入对应分支。
  if (
    isClassifierPermissionsEnabled() &&
    !(
      feature('TRANSCRIPT_CLASSIFIER') &&
      appState.toolPermissionContext.mode === 'auto'
    )
  ) {
    // denyDescriptions 集合读取`getBashPromptDenyDescriptions`，供工具调用后续处理使用。
    const denyDescriptions = getBashPromptDenyDescriptions(
      appState.toolPermissionContext,
    )
    // askDescriptions 集合读取`getBashPromptAskDescriptions`，供工具调用后续处理使用。
    const askDescriptions = getBashPromptAskDescriptions(
      appState.toolPermissionContext,
    )
    // hasDeny记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
    const hasDeny = denyDescriptions.length > 0
    // hasAsk记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
    const hasAsk = askDescriptions.length > 0

    // 只有 `hasDeny || hasAsk` 满足时，工具调用才执行该分支。
    if (hasDeny || hasAsk) {
      // 并行获取 denyResult、askResult，缩短Bash 工具 bash Permissions等待多个独立异步任务的时间。
      const [denyResult, askResult] = await Promise.all([
        hasDeny
          ? classifyBashCommand(
              input.command,
              getCwd(),
              denyDescriptions,
              'deny',
              context.abortController.signal,
              context.options.isNonInteractiveSession,
            )
          : null,
        hasAsk
          ? classifyBashCommand(
              input.command,
              getCwd(),
              askDescriptions,
              'ask',
              context.abortController.signal,
              context.options.isNonInteractiveSession,
            )
          : null,
      ])

      // 满足 `context.abortController.signal.aborted` 时，工具调用执行该分支。
      if (context.abortController.signal.aborted) {
        // 抛出 new AbortError()，阻止工具调用在无效状态下继续运行。
        throw new AbortError()
      }

      // 满足 `denyResult` 时，工具调用执行该分支。
      if (denyResult) {
        // logClassifierResultForAnts执行工具调用在此处需要的副作用或外部交互。
        logClassifierResultForAnts(
          input.command,
          'deny',
          denyDescriptions,
          denyResult,
        )
      }
      // 满足 `askResult` 时，工具调用执行该分支。
      if (askResult) {
        // logClassifierResultForAnts执行工具调用在此处需要的副作用或外部交互。
        logClassifierResultForAnts(
          input.command,
          'ask',
          askDescriptions,
          askResult,
        )
      }

      // Deny takes precedence
      // 只有 `denyResult?.matches && denyResult.confidence ===` 满足时，工具调用才执行该分支。
      if (denyResult?.matches && denyResult.confidence === 'high') {
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'deny',
          message: `Denied by Bash prompt rule: "${denyResult.matchedDescription}"`,
          decisionReason: {
            type: 'other',
            reason: `Denied by Bash prompt rule: "${denyResult.matchedDescription}"`,
          },
        }
      }

      // 只有 `askResult?.matches && askResult.confidence === 'h` 满足时，工具调用才执行该分支。
      if (askResult?.matches && askResult.confidence === 'high') {
        // Skip the Haiku call — the UI computes the prefix locally
        // and lets the user edit it. Still call the injected function
        // when tests override it.
        // suggestions 集合先声明占位，稍后的分支会根据实际输入补齐。
        let suggestions: PermissionUpdate[]
        // 满足 `getCommandSubcommandPrefixFn === getCommandSubcom` 时，工具调用执行该分支。
        if (getCommandSubcommandPrefixFn === getCommandSubcommandPrefix) {
          // suggestions 集合更新为 `suggestionForExactCommand(input.command)`，确保Bash 工具后续读取最新状态。
          suggestions = suggestionForExactCommand(input.command)
        } else {
          // commandPrefixResult 命令数据读取`getCommandSubcommandPrefixFn`，供工具调用后续处理使用。
          const commandPrefixResult = await getCommandSubcommandPrefixFn(
            input.command,
            context.abortController.signal,
            context.options.isNonInteractiveSession,
          )
          // 满足 `context.abortController.signal.aborted` 时，工具调用执行该分支。
          if (context.abortController.signal.aborted) {
            // 抛出 new AbortError()，阻止工具调用在无效状态下继续运行。
            throw new AbortError()
          }
          // suggestions 集合更新为 `commandPrefixResult?.commandPrefix`，确保Bash 工具后续读取最新状态。
          suggestions = commandPrefixResult?.commandPrefix
            ? suggestionForPrefix(commandPrefixResult.commandPrefix)
            : suggestionForExactCommand(input.command)
        }
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'ask',
          message: createPermissionRequestMessage(BashTool.name),
          decisionReason: {
            type: 'other',
            reason: `Required by Bash prompt rule: "${askResult.matchedDescription}"`,
          },
          suggestions,
          ...(feature('BASH_CLASSIFIER')
            ? {
                pendingClassifierCheck: buildPendingClassifierCheck(
                  input.command,
                  appState.toolPermissionContext,
                ),
              }
            : {}),
        }
      }
    }
  }

  // Check for non-subcommand Bash operators like `>`, `|`, etc.
  // This must happen before dangerous path checks so that piped commands
  // are handled by the operator logic (which generates "multiple operations" messages)
  // commandOperatorResult 命令数据读取`checkCommandOperatorPermissions`，供工具调用后续处理使用。
  const commandOperatorResult = await checkCommandOperatorPermissions(
    input,
    // 这个回调绑定到 (i: z.infer<typeof BashTool.inputSchema>) =>，负责工具调用在该局部场景下的响应。
    (i: z.infer<typeof BashTool.inputSchema>) =>
      bashToolHasPermission(i, context, getCommandSubcommandPrefixFn),
    { isNormalizedCdCommand, isNormalizedGitCommand },
    astRoot,
  )
  // `commandOperatorResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
  if (commandOperatorResult.behavior !== 'passthrough') {
    // SECURITY FIX: When pipe segment processing returns 'allow', we must still validate
    // the ORIGINAL command. The pipe segment processing strips redirections before
    // checking each segment, so commands like:
    //   echo 'x' | xargs printf '%s' >> /tmp/file
    // would have both segments allowed (echo and xargs printf) but the >> redirection
    // would bypass validation. We must check:
    // 1. Path constraints for output redirections
    // 2. Command safety for dangerous patterns (backticks, etc.) in redirect targets
    // `commandOperatorResult.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
    if (commandOperatorResult.behavior === 'allow') {
      // Check for dangerous patterns (backticks, $(), etc.) in the original command
      // This catches cases like: echo x | xargs echo > `pwd`/evil.txt
      // where the backtick is in the redirect target (stripped from segments)
      // Gate on AST: when astSubcommands is non-null, tree-sitter already
      // validated structure (backticks/$() in redirect targets would have
      // returned too-complex). Matches gating at ~1481, ~1706, ~1755.
      // Avoids FP: `find -exec {} \; | grep x` tripping on backslash-;.
      // bashCommandIsSafe runs the full legacy regex battery (~20 patterns) —
      // only call it when we'll actually use the result.
      // safetyResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const safetyResult =
        astSubcommands === null
          ? await bashCommandIsSafeAsync(input.command)
          : null
      // 工具调用在这里按实际状态进入对应分支。
      if (
        safetyResult !== null &&
        safetyResult.behavior !== 'passthrough' &&
        safetyResult.behavior !== 'allow'
      ) {
        // Attach pending classifier check - may auto-approve before user responds
        // 应用状态更新为 `context.getAppState()`，确保Bash 工具后续读取最新状态。
        appState = context.getAppState()
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'ask',
          message: createPermissionRequestMessage(BashTool.name, {
            type: 'other',
            reason:
              safetyResult.message ??
              'Command contains patterns that require approval',
          }),
          decisionReason: {
            type: 'other',
            reason:
              safetyResult.message ??
              'Command contains patterns that require approval',
          },
          ...(feature('BASH_CLASSIFIER')
            ? {
                pendingClassifierCheck: buildPendingClassifierCheck(
                  input.command,
                  appState.toolPermissionContext,
                ),
              }
            : {}),
        }
      }

      // 应用状态更新为 `context.getAppState()`，确保Bash 工具后续读取最新状态。
      appState = context.getAppState()
      // SECURITY: Compute compoundCommandHasCd from the full command, NOT
      // hardcode false. The pipe-handling path previously passed `false` here,
      // disabling the cd+redirect check at pathValidation.ts:821. Appending
      // `| echo done` to `cd .claude && echo x > settings.json` routed through
      // this path with compoundCommandHasCd=false, letting the redirect write
      // to .claude/settings.json without the cd+redirect block firing.
      // pathResult 文件数据读取`checkPathConstraints`，供工具调用后续处理使用。
      const pathResult = checkPathConstraints(
        input,
        getCwd(),
        appState.toolPermissionContext,
        commandHasAnyCd(input.command),
        astRedirects,
        astCommands,
      )
      // `pathResult.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
      if (pathResult.behavior !== 'passthrough') {
        // 返回 pathResult，把工具调用这个分支的结果交还调用方。
        return pathResult
      }
    }

    // When pipe segments return 'ask' (individual segments not allowed by rules),
    // attach pending classifier check - may auto-approve before user responds.
    // `commandOperatorResult.behavior` 命中特定值 `'ask'` 时，进入工具调用对应处理。
    if (commandOperatorResult.behavior === 'ask') {
      // 应用状态更新为 `context.getAppState()`，确保Bash 工具后续读取最新状态。
      appState = context.getAppState()
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        ...commandOperatorResult,
        ...(feature('BASH_CLASSIFIER')
          ? {
              pendingClassifierCheck: buildPendingClassifierCheck(
                input.command,
                appState.toolPermissionContext,
              ),
            }
          : {}),
      }
    }

    // 返回 commandOperatorResult，把工具调用这个分支的结果交还调用方。
    return commandOperatorResult
  }

  // SECURITY: Legacy misparsing gate. Only runs when the tree-sitter module
  // is not loaded. Timeout/abort is fail-closed via too-complex (returned
  // early above), not routed here. When the AST parse succeeded,
  // astSubcommands is non-null and we've already validated structure; this
  // block is skipped entirely. The AST's 'too-complex' result subsumes
  // everything isBashSecurityCheckForMisparsing covered — both answer the
  // same question: "can splitCommand be trusted on this input?"
  // 工具调用在这里按实际状态进入对应分支。
  if (
    astSubcommands === null &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_COMMAND_INJECTION_CHECK)
  ) {
    // originalCommandSafetyResult 命令数据保存`bashCommandIsSafeAsync`，供工具调用后续处理使用。
    const originalCommandSafetyResult = await bashCommandIsSafeAsync(
      input.command,
    )
    // 工具调用在这里按实际状态进入对应分支。
    if (
      originalCommandSafetyResult.behavior === 'ask' &&
      originalCommandSafetyResult.isBashSecurityCheckForMisparsing
    ) {
      // Compound commands with safe heredoc patterns ($(cat <<'EOF'...EOF))
      // trigger the $() check on the unsplit command. Strip the safe heredocs
      // and re-check the remainder — if other misparsing patterns exist
      // (e.g. backslash-escaped operators), they must still block.
      // remainder保存`stripSafeHeredocSubstitutions`，供工具调用后续处理使用。
      const remainder = stripSafeHeredocSubstitutions(input.command)
      // remainderResult 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const remainderResult =
        remainder !== null ? await bashCommandIsSafeAsync(remainder) : null
      // 工具调用在这里按实际状态进入对应分支。
      if (
        remainder === null ||
        (remainderResult?.behavior === 'ask' &&
          remainderResult.isBashSecurityCheckForMisparsing)
      ) {
        // Allow if the exact command has an explicit allow permission — the user
        // made a conscious choice to permit this specific command.
        // 应用状态更新为 `context.getAppState()`，确保Bash 工具后续读取最新状态。
        appState = context.getAppState()
        // exactMatchResult保存`bashToolCheckExactMatchPermission`，供工具调用后续处理使用。
        const exactMatchResult = bashToolCheckExactMatchPermission(
          input,
          appState.toolPermissionContext,
        )
        // `exactMatchResult.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
        if (exactMatchResult.behavior === 'allow') {
          // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
          return exactMatchResult
        }
        // Attach pending classifier check - may auto-approve before user responds
        // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
        const decisionReason: PermissionDecisionReason = {
          type: 'other' as const,
          reason: originalCommandSafetyResult.message,
        }
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'ask',
          message: createPermissionRequestMessage(
            BashTool.name,
            decisionReason,
          ),
          decisionReason,
          suggestions: [], // Don't suggest saving a potentially dangerous command
          ...(feature('BASH_CLASSIFIER')
            ? {
                pendingClassifierCheck: buildPendingClassifierCheck(
                  input.command,
                  appState.toolPermissionContext,
                ),
              }
            : {}),
        }
      }
    }
  }

  // Split into subcommands. Prefer the AST-extracted spans; fall back to
  // splitCommand only when tree-sitter was unavailable. The cd-cwd filter
  // strips the `cd ${cwd}` prefix that models like to prepend.
  // cwd读取`getCwd`，供工具调用后续处理使用。
  const cwd = getCwd()
  // cwdMingw 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cwdMingw =
    getPlatform() === 'windows' ? windowsPathToPosixPath(cwd) : cwd
  // rawSubcommands 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const rawSubcommands =
    astSubcommands ?? shadowLegacySubs ?? splitCommand(input.command)
  // 从 `filterCdCwdSubcommands(` 解构 subcommands、astCommandsByIdx，减少Bash 工具 bash Permissions对同一对象的重复访问。
  const { subcommands, astCommandsByIdx } = filterCdCwdSubcommands(
    rawSubcommands,
    astCommands,
    cwd,
    cwdMingw,
  )

  // CC-643: Cap subcommand fanout. Only the legacy splitCommand path can
  // explode — the AST path returns a bounded list (astSubcommands !== null)
  // or short-circuits to 'too-complex' for structures it can't represent.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    astSubcommands === null &&
    subcommands.length > MAX_SUBCOMMANDS_FOR_SECURITY_CHECK
  ) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `bashPermissions: ${subcommands.length} subcommands exceeds cap (${MAX_SUBCOMMANDS_FOR_SECURITY_CHECK}) — returning ask`,
      { level: 'debug' },
    )
    // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
    const decisionReason = {
      type: 'other' as const,
      reason: `Command splits into ${subcommands.length} subcommands, too many to safety-check individually`,
    }
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: createPermissionRequestMessage(BashTool.name, decisionReason),
      decisionReason,
    }
  }

  // Ask if there are multiple `cd` commands
  // cdCommands 命令数据筛选`subcommands.filter`，供工具调用后续处理使用。
  const cdCommands = subcommands.filter(subCommand =>
    isNormalizedCdCommand(subCommand),
  )
  // 满足 `cdCommands.length > 1` 时，工具调用执行该分支。
  if (cdCommands.length > 1) {
    // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
    const decisionReason = {
      type: 'other' as const,
      reason:
        'Multiple directory changes in one command require approval for clarity',
    }
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      decisionReason,
      message: createPermissionRequestMessage(BashTool.name, decisionReason),
    }
  }

  // Track if compound command contains cd for security validation
  // This prevents bypassing path checks via: cd .claude/ && mv test.txt settings.json
  // compoundCommandHasCd 命令数据统计`cdCommands.length > 0`，供Bash 工具 bash Permissions后续步骤使用。
  const compoundCommandHasCd = cdCommands.length > 0

  // SECURITY: Block compound commands that have both cd AND git
  // This prevents sandbox escape via: cd /malicious/dir && git status
  // where the malicious directory contains a bare git repo with core.fsmonitor.
  // This check must happen HERE (before subcommand-level permission checks)
  // because bashToolCheckPermission checks each subcommand independently via
  // BashTool.isReadOnly(), which would re-derive compoundCommandHasCd=false
  // from just "git status" alone, bypassing the readOnlyValidation.ts check.
  // 满足 `compoundCommandHasCd` 时，工具调用执行该分支。
  if (compoundCommandHasCd) {
    // hasGitCommand 命令数据筛选`subcommands.some`，供工具调用后续处理使用。
    const hasGitCommand = subcommands.some(cmd =>
      isNormalizedGitCommand(cmd.trim()),
    )
    // 满足 `hasGitCommand` 时，工具调用执行该分支。
    if (hasGitCommand) {
      // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
      const decisionReason = {
        type: 'other' as const,
        reason:
          'Compound commands with cd and git require approval to prevent bare repository attacks',
      }
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        decisionReason,
        message: createPermissionRequestMessage(BashTool.name, decisionReason),
      }
    }
  }

  // 应用状态更新为 `context.getAppState() // re-compute the latest in case th...`，确保Bash 工具后续读取最新状态。
  appState = context.getAppState() // re-compute the latest in case the user hit shift+tab

  // SECURITY FIX: Check Bash deny/ask rules BEFORE path constraints
  // This ensures that explicit deny rules like Bash(ls:*) take precedence over
  // path constraint checks that return 'ask' for paths outside the project.
  // Without this ordering, absolute paths outside the project (e.g., ls /home)
  // would bypass deny rules because checkPathConstraints would return 'ask' first.
  //
  // Note: bashToolCheckPermission calls checkPathConstraints internally, which handles
  // output redirection validation on each subcommand. However, since splitCommand strips
  // redirections before we get here, we MUST validate output redirections on the ORIGINAL
  // command AFTER checking deny rules but BEFORE returning results.
  // subcommandPermissionDecisions 权限数据派生`subcommands.map`，供工具调用后续处理使用。
  const subcommandPermissionDecisions = subcommands.map((command, i) =>
    bashToolCheckPermission(
      { command },
      appState.toolPermissionContext,
      compoundCommandHasCd,
      astCommandsByIdx[i],
    ),
  )

  // Deny if any subcommands are denied
  // deniedSubresult筛选`subcommandPermissionDecisions.find`，供工具调用后续处理使用。
  const deniedSubresult = subcommandPermissionDecisions.find(
    // _更新为 `> _.behavior === 'deny'`，确保Bash 工具后续读取最新状态。
    _ => _.behavior === 'deny',
  )
  // `deniedSubresult` 与 `undefined` 不一致时刷新派生状态。
  if (deniedSubresult !== undefined) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'deny',
      message: `Permission to use ${BashTool.name} with command ${input.command} has been denied.`,
      decisionReason: {
        type: 'subcommandResults',
        reasons: new Map(
          // subcommandPermissionDecisions.map执行工具调用在此处需要的副作用或外部交互。
          subcommandPermissionDecisions.map((result, i) => [
            subcommands[i]!,
            result,
          ]),
        ),
      },
    }
  }

  // Validate output redirections on the ORIGINAL command (before splitCommand stripped them)
  // This must happen AFTER checking deny rules but BEFORE returning results.
  // Output redirections like "> /etc/passwd" are stripped by splitCommand, so the per-subcommand
  // checkPathConstraints calls won't see them. We validate them here on the original input.
  // SECURITY: When AST data is available, pass AST-derived redirects so
  // checkPathConstraints uses them directly instead of re-parsing with
  // shell-quote (which has a known single-quote backslash misparsing bug
  // that can silently hide redirect operators).
  // pathResult 文件数据读取`checkPathConstraints`，供工具调用后续处理使用。
  const pathResult = checkPathConstraints(
    input,
    getCwd(),
    appState.toolPermissionContext,
    compoundCommandHasCd,
    astRedirects,
    astCommands,
  )
  // `pathResult.behavior` 命中特定值 `'deny'` 时，进入工具调用对应处理。
  if (pathResult.behavior === 'deny') {
    // 返回 pathResult，把工具调用这个分支的结果交还调用方。
    return pathResult
  }

  // askSubresult筛选`subcommandPermissionDecisions.find`，供工具调用后续处理使用。
  const askSubresult = subcommandPermissionDecisions.find(
    // _更新为 `> _.behavior === 'ask'`，确保Bash 工具后续读取最新状态。
    _ => _.behavior === 'ask',
  )
  // nonAllowCount统计`count`，供工具调用后续处理使用。
  const nonAllowCount = count(
    subcommandPermissionDecisions,
    // _更新为 `> _.behavior !== 'allow'`，确保Bash 工具后续读取最新状态。
    _ => _.behavior !== 'allow',
  )

  // SECURITY (GH#28784): Only short-circuit on a path-constraint 'ask' when no
  // subcommand independently produced an 'ask'. checkPathConstraints re-runs the
  // path-command loop on the full input, so `cd <outside-project> && python3 foo.py`
  // produces an ask with ONLY a Read(<dir>/**) suggestion — the UI renders it as
  // "Yes, allow reading from <dir>/" and picking that option silently approves
  // python3. When a subcommand has its own ask (e.g. the cd subcommand's own
  // path-constraint ask), fall through: either the askSubresult short-circuit
  // below fires (single non-allow subcommand) or the merge flow collects Bash
  // rule suggestions for every non-allow subcommand. The per-subcommand
  // checkPathConstraints call inside bashToolCheckPermission already captures
  // the Read rule for the cd target in that path.
  //
  // When no subcommand asked (all allow, or all passthrough like `printf > file`),
  // pathResult IS the only ask — return it so redirection checks surface.
  // 只有 `pathResult.behavior === 'ask' && askSubresult ===` 满足时，工具调用才执行该分支。
  if (pathResult.behavior === 'ask' && askSubresult === undefined) {
    // 返回 pathResult，把工具调用这个分支的结果交还调用方。
    return pathResult
  }

  // Ask if any subcommands require approval (e.g., ls/cd outside boundaries).
  // Only short-circuit when exactly ONE subcommand needs approval — if multiple
  // do (e.g. cd-outside-project ask + python3 passthrough), fall through to the
  // merge flow so the prompt surfaces Bash rule suggestions for all of them
  // instead of only the first ask's Read rule (GH#28784).
  // `askSubresult` 与 `undefined && nonAllowCount === 1` 不一致时刷新派生状态。
  if (askSubresult !== undefined && nonAllowCount === 1) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      ...askSubresult,
      ...(feature('BASH_CLASSIFIER')
        ? {
            pendingClassifierCheck: buildPendingClassifierCheck(
              input.command,
              appState.toolPermissionContext,
            ),
          }
        : {}),
    }
  }

  // Allow if exact command was allowed
  // `exactMatchResult.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
  if (exactMatchResult.behavior === 'allow') {
    // 返回 exactMatchResult，把工具调用这个分支的结果交还调用方。
    return exactMatchResult
  }

  // If all subcommands are allowed via exact or prefix match, allow the
  // command — but only if no command injection is possible. When the AST
  // parse succeeded, each subcommand is already known-safe (no hidden
  // substitutions, no structural tricks); the per-subcommand re-check is
  // redundant. When on the legacy path, re-run bashCommandIsSafeAsync per sub.
  // hasPossibleCommandInjection 命令数据记录当前扫描状态，Bash 工具 bash Permissions随后按该状态分支。
  let hasPossibleCommandInjection = false
  // 工具调用在这里按实际状态进入对应分支。
  if (
    astSubcommands === null &&
    !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_COMMAND_INJECTION_CHECK)
  ) {
    // CC-643: Batch divergence telemetry into a single logEvent. The per-sub
    // logEvent was the hot-path syscall driver (each call → /proc/self/stat
    // via process.memoryUsage()). Aggregate count preserves the signal.
    // divergenceCount保存`0`，供Bash 工具 bash Permissions后续步骤使用。
    let divergenceCount = 0
    // onDivergence保存`() => {`，供Bash 工具 bash Permissions后续步骤使用。
    const onDivergence = () => {
      // Bash 工具 bash Permissions处理 `divergenceCount++`，完成这一小步状态转换。
      divergenceCount++
    }
    // results 集合保存`Promise.all`，供工具调用后续处理使用。
    const results = await Promise.all(
      subcommands.map(c => bashCommandIsSafeAsync(c, onDivergence)),
    )
    // hasPossibleCommandInjection 命令数据更新为 `results.some(`，确保Bash 工具后续读取最新状态。
    hasPossibleCommandInjection = results.some(
      // r更新为 `> r.behavior !== 'passthrough'`，确保Bash 工具后续读取最新状态。
      r => r.behavior !== 'passthrough',
    )
    // 满足 `divergenceCount > 0` 时，工具调用执行该分支。
    if (divergenceCount > 0) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_tree_sitter_security_divergence', {
        quoteContextDivergence: true,
        count: divergenceCount,
      })
    }
  }
  // 工具调用在这里按实际状态进入对应分支。
  if (
    // subcommandPermissionDecisions.every执行工具调用在此处需要的副作用或外部交互。
    subcommandPermissionDecisions.every(_ => _.behavior === 'allow') &&
    !hasPossibleCommandInjection
  ) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'subcommandResults',
        reasons: new Map(
          // subcommandPermissionDecisions.map执行工具调用在此处需要的副作用或外部交互。
          subcommandPermissionDecisions.map((result, i) => [
            subcommands[i]!,
            result,
          ]),
        ),
      },
    }
  }

  // Query Haiku for command prefixes
  // Skip the Haiku call — the UI computes the prefix locally and
  // lets the user edit it. Still call when a custom fn is injected (tests).
  // commandSubcommandPrefix 命令数据先声明占位，稍后的分支会根据实际输入补齐。
  let commandSubcommandPrefix: Awaited<
    ReturnType<typeof getCommandSubcommandPrefixFn>
  > = null
  // `getCommandSubcommandPrefixFn` 与 `getCommandSubcom` 不一致时刷新派生状态。
  if (getCommandSubcommandPrefixFn !== getCommandSubcommandPrefix) {
    // commandSubcommandPrefix 命令数据更新为 `await getCommandSubcommandPrefixFn(`，确保Bash 工具后续读取最新状态。
    commandSubcommandPrefix = await getCommandSubcommandPrefixFn(
      input.command,
      context.abortController.signal,
      context.options.isNonInteractiveSession,
    )
    // 满足 `context.abortController.signal.aborted` 时，工具调用执行该分支。
    if (context.abortController.signal.aborted) {
      // 抛出 new AbortError()，阻止工具调用在无效状态下继续运行。
      throw new AbortError()
    }
  }

  // If there is only one command, no need to process subcommands
  // 应用状态更新为 `context.getAppState() // re-compute the latest in case th...`，确保Bash 工具后续读取最新状态。
  appState = context.getAppState() // re-compute the latest in case the user hit shift+tab
  // 满足 `subcommands.length === 1` 时，工具调用执行该分支。
  if (subcommands.length === 1) {
    // 结果读取`checkCommandAndSuggestRules`，供工具调用后续处理使用。
    const result = await checkCommandAndSuggestRules(
      { command: subcommands[0]! },
      appState.toolPermissionContext,
      commandSubcommandPrefix,
      compoundCommandHasCd,
      astSubcommands !== null,
    )
    // If command wasn't allowed, attach pending classifier check.
    // At this point, 'ask' can only come from bashCommandIsSafe (security check inside
    // checkCommandAndSuggestRules), NOT from explicit ask rules - those were already
    // filtered out at step 13 (askSubresult check). The classifier can bypass security.
    // 只有 `result.behavior === 'ask' || result.behavior ===` 满足时，工具调用才执行该分支。
    if (result.behavior === 'ask' || result.behavior === 'passthrough') {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        ...result,
        ...(feature('BASH_CLASSIFIER')
          ? {
              pendingClassifierCheck: buildPendingClassifierCheck(
                input.command,
                appState.toolPermissionContext,
              ),
            }
          : {}),
      }
    }
    // 返回 result，把工具调用这个分支的结果交还调用方。
    return result
  }

  // Check subcommand permission results
  // subcommandResults 命令数据用 Map 保存键值关系，方便Bash 工具 bash Permissions按 key 查找。
  const subcommandResults: Map<string, PermissionResult> = new Map()
  // 遍历 const subcommand of subcommands，让工具调用逐项完成同一类处理。
  for (const subcommand of subcommands) {
    // subcommandResults.set写入新的状态值，使工具调用后续读取保持一致。
    subcommandResults.set(
      subcommand,
      await checkCommandAndSuggestRules(
        {
          // Pass through input params like `sandbox`
          ...input,
          command: subcommand,
        },
        appState.toolPermissionContext,
        commandSubcommandPrefix?.subcommandPrefixes.get(subcommand),
        compoundCommandHasCd,
        astSubcommands !== null,
      ),
    )
  }

  // Allow if all subcommands are allowed
  // Note that this is different than 6b because we are checking the command injection results.
  // 工具调用在这里按实际状态进入对应分支。
  if (
    // subcommands.every执行工具调用在此处需要的副作用或外部交互。
    subcommands.every(subcommand => {
      // permissionResult 权限数据读取`subcommandResults.get`，供工具调用后续处理使用。
      const permissionResult = subcommandResults.get(subcommand)
      // 返回 permissionResult?.behavior === 'allow'，把工具调用这个分支的结果交还调用方。
      return permissionResult?.behavior === 'allow'
    })
  ) {
    // Keep subcommandResults as PermissionResult for decisionReason
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'allow',
      updatedInput: input,
      decisionReason: {
        type: 'subcommandResults',
        reasons: subcommandResults,
      },
    }
  }

  // Otherwise, ask for permission
  // collectedRules 集合用 Map 保存键值关系，方便Bash 工具 bash Permissions按 key 查找。
  const collectedRules: Map<string, PermissionRuleValue> = new Map()

  // 遍历 const [subcommand, permissionResult] of subcomman，让工具调用逐项完成同一类处理。
  for (const [subcommand, permissionResult] of subcommandResults) {
    // 工具调用在这里按实际状态进入对应分支。
    if (
      permissionResult.behavior === 'ask' ||
      permissionResult.behavior === 'passthrough'
    ) {
      // updates 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const updates =
        'suggestions' in permissionResult
          ? permissionResult.suggestions
          : undefined

      // rules 集合保存`extractRules`，供工具调用后续处理使用。
      const rules = extractRules(updates)
      // 遍历 const rule of rules，让工具调用逐项完成同一类处理。
      for (const rule of rules) {
        // Use string representation as key for deduplication
        // ruleKey保存`permissionRuleValueToString`，供工具调用后续处理使用。
        const ruleKey = permissionRuleValueToString(rule)
        // collectedRules.set写入新的状态值，使工具调用后续读取保持一致。
        collectedRules.set(ruleKey, rule)
      }

      // GH#28784 follow-up: security-check asks (compound-cd+write, process
      // substitution, etc.) carry no suggestions. In a compound command like
      // `cd ~/out && rm -rf x`, that means only cd's Read rule gets collected
      // and the UI labels the prompt "Yes, allow reading from <dir>/" — never
      // mentioning rm. Synthesize a Bash(exact) rule so the UI shows the
      // chained command. Skip explicit ask rules (decisionReason.type 'rule')
      // where the user deliberately wants to review each time.
      // 工具调用在这里按实际状态进入对应分支。
      if (
        permissionResult.behavior === 'ask' &&
        rules.length === 0 &&
        permissionResult.decisionReason?.type !== 'rule'
      ) {
        // for执行工具调用在此处需要的副作用或外部交互。
        for (const rule of extractRules(
          suggestionForExactCommand(subcommand),
        )) {
          // ruleKey保存`permissionRuleValueToString`，供工具调用后续处理使用。
          const ruleKey = permissionRuleValueToString(rule)
          // collectedRules.set写入新的状态值，使工具调用后续读取保持一致。
          collectedRules.set(ruleKey, rule)
        }
      }
      // Note: We only collect rules, not other update types like mode changes
      // This is appropriate for bash subcommands which primarily need rule suggestions
    }
  }

  // decisionReason集中保存Bash 工具 bash Permissions要一起传递的字段。
  const decisionReason = {
    type: 'subcommandResults' as const,
    reasons: subcommandResults,
  }

  // GH#11380: Cap at MAX_SUGGESTED_RULES_FOR_COMPOUND. Map preserves insertion
  // order (subcommand order), so slicing keeps the leftmost N.
  // cappedRules 集合保存`Array.from`，供工具调用后续处理使用。
  const cappedRules = Array.from(collectedRules.values()).slice(
    0,
    MAX_SUGGESTED_RULES_FOR_COMPOUND,
  )
  // suggestedUpdates 集合先声明占位，稍后的分支会根据实际输入补齐。
  const suggestedUpdates: PermissionUpdate[] | undefined =
    cappedRules.length > 0
      ? [
          {
            type: 'addRules',
            rules: cappedRules,
            behavior: 'allow',
            destination: 'localSettings',
          },
        ]
      : undefined

  // Attach pending classifier check - may auto-approve before user responds.
  // Behavior is 'ask' if any subcommand was 'ask' (e.g., path constraint or ask
  // rule) — before the GH#28784 fix, ask subresults always short-circuited above
  // so this path only saw 'passthrough' subcommands and hardcoded that.
  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: askSubresult !== undefined ? 'ask' : 'passthrough',
    message: createPermissionRequestMessage(BashTool.name, decisionReason),
    decisionReason,
    suggestions: suggestedUpdates,
    ...(feature('BASH_CLASSIFIER')
      ? {
          pendingClassifierCheck: buildPendingClassifierCheck(
            input.command,
            appState.toolPermissionContext,
          ),
        }
      : {}),
  }
}

/**
 * Checks if a subcommand is a git command after normalizing away safe wrappers
 * (env vars, timeout, etc.) and shell quotes.
 *
 * SECURITY: Must normalize before matching to prevent bypasses like:
 *   'git' status    — shell quotes hide the command from a naive regex
 *   NO_COLOR=1 git status — env var prefix hides the command
 */
// isNormalizedGitCommand 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function isNormalizedGitCommand(command: string): boolean {
  // Fast path: catch the most common case before any parsing
  // 判断 command.startsWith('git ') || command === 'git'，将工具调用分流到只适用于该条件的处理路径。
  if (command.startsWith('git ') || command === 'git') {
    // 返回 true，把工具调用这个分支的结果交还调用方。
    return true
  }
  // stripped保存`stripSafeWrappers`，供工具调用后续处理使用。
  const stripped = stripSafeWrappers(command)
  // parsed保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parsed = tryParseShellCommand(stripped)
  // 只有 `parsed.success && parsed.tokens.length > 0` 满足时，工具调用才执行该分支。
  if (parsed.success && parsed.tokens.length > 0) {
    // Direct git command
    // `parsed.tokens[0]` 命中特定值 `'git'` 时，进入工具调用对应处理。
    if (parsed.tokens[0] === 'git') {
      // 返回 true，把工具调用这个分支的结果交还调用方。
      return true
    }
    // "xargs git ..." — xargs runs git in the current directory,
    // so it must be treated as a git command for cd+git security checks.
    // This matches the xargs prefix handling in filterRulesByContentsMatchingInput.
    // 判断 parsed.tokens[0] === 'xargs' && parsed.tokens.includes('git')，将工具调用分流到只适用于该条件的处理路径。
    if (parsed.tokens[0] === 'xargs' && parsed.tokens.includes('git')) {
      // 返回 true，把工具调用这个分支的结果交还调用方。
      return true
    }
    // 返回 false，把工具调用这个分支的结果交还调用方。
    return false
  }
  // 返回 /^git(?:\s|$)/.test(stripped)，把工具调用这个分支的结果交还调用方。
  return /^git(?:\s|$)/.test(stripped)
}

/**
 * Checks if a subcommand is a cd command after normalizing away safe wrappers
 * (env vars, timeout, etc.) and shell quotes.
 *
 * SECURITY: Must normalize before matching to prevent bypasses like:
 *   FORCE_COLOR=1 cd sub — env var prefix hides the cd from a naive /^cd / regex
 *   This mirrors isNormalizedGitCommand to ensure symmetric normalization.
 *
 * Also matches pushd/popd — they change cwd just like cd, so
 *   pushd /tmp/bare-repo && git status
 * must trigger the same cd+git guard. Mirrors PowerShell's
 * DIRECTORY_CHANGE_ALIASES (src/utils/powershell/parser.ts).
 */
// isNormalizedCdCommand 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function isNormalizedCdCommand(command: string): boolean {
  // stripped保存`stripSafeWrappers`，供工具调用后续处理使用。
  const stripped = stripSafeWrappers(command)
  // parsed保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parsed = tryParseShellCommand(stripped)
  // 只有 `parsed.success && parsed.tokens.length > 0` 满足时，工具调用才执行该分支。
  if (parsed.success && parsed.tokens.length > 0) {
    // cmd 命令数据解析`parsed.tokens[0]`，供Bash 工具 bash Permissions后续步骤使用。
    const cmd = parsed.tokens[0]
    // 返回 cmd === 'cd' || cmd === 'pushd' || cmd === 'popd'，把工具调用这个分支的结果交还调用方。
    return cmd === 'cd' || cmd === 'pushd' || cmd === 'popd'
  }
  // 返回 /^(?:cd|pushd|popd)(?:\s|$)/.test(stripped)，把工具调用这个分支的结果交还调用方。
  return /^(?:cd|pushd|popd)(?:\s|$)/.test(stripped)
}

/**
 * Checks if a compound command contains any cd command,
 * using normalized detection that handles env var prefixes and shell quotes.
 */
// commandHasAnyCd 承担工具调用中的独立步骤，串起Bash 工具 bash Permissions需要的输入整理、状态更新和结果输出。
export function commandHasAnyCd(command: string): boolean {
  // 返回 splitCommand(command).some(subcmd =>，把工具调用这个分支的结果交还调用方。
  return splitCommand(command).some(subcmd =>
    isNormalizedCdCommand(subcmd.trim()),
  )
}
