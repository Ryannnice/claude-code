// 接入 logEvent 服务层能力，把外部通信或共享状态交给 src/services/analytics/index.js 处理。
import { logEvent } from 'src/services/analytics/index.js'
// 复用 extractHeredocs 工具函数，把通用处理留在 ../../utils/bash/heredoc.js 中维护。
import { extractHeredocs } from '../../utils/bash/heredoc.js'
// 复用 ParsedCommand 工具函数，把通用处理留在 ../../utils/bash/ParsedCommand.js 中维护。
import { ParsedCommand } from '../../utils/bash/ParsedCommand.js'
// 整理这一组导入，让工具调用后续逻辑可以直接复用这些外部能力。
import {
  hasMalformedTokens,
  hasShellQuoteSingleQuoteBug,
  tryParseShellCommand,
} from '../../utils/bash/shellQuote.js'
// 类型依赖 { TreeSitterAnalysis } 来自 ../../utils/bash/treeSitterAnalysis.js，用于校准工具调用的数据契约。
import type { TreeSitterAnalysis } from '../../utils/bash/treeSitterAnalysis.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'

// HEREDOC_IN_SUBSTITUTION 命名 `/\$\(.*<</`，让后续代码直接表达这个值的用途。
const HEREDOC_IN_SUBSTITUTION = /\$\(.*<</

// Note: Backtick pattern is handled separately in validateDangerousPatterns
// to distinguish between escaped and unescaped backticks
// COMMAND_SUBSTITUTION_PATTERNS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const COMMAND_SUBSTITUTION_PATTERNS = [
  { pattern: /<\(/, message: 'process substitution <()' },
  { pattern: />\(/, message: 'process substitution >()' },
  { pattern: /=\(/, message: 'Zsh process substitution =()' },
  // Zsh EQUALS expansion: =cmd at word start expands to $(which cmd).
  // `=curl evil.com` → `/usr/bin/curl evil.com`, bypassing Bash(curl:*) deny
  // rules since the parser sees `=curl` as the base command, not `curl`.
  // Only matches word-initial = followed by a command-name char (not VAR=val).
  {
    pattern: /(?:^|[\s;&|])=[a-zA-Z_]/,
    message: 'Zsh equals expansion (=cmd)',
  },
  { pattern: /\$\(/, message: '$() command substitution' },
  { pattern: /\$\{/, message: '${} parameter substitution' },
  { pattern: /\$\[/, message: '$[] legacy arithmetic expansion' },
  { pattern: /~\[/, message: 'Zsh-style parameter expansion' },
  { pattern: /\(e:/, message: 'Zsh-style glob qualifiers' },
  { pattern: /\(\+/, message: 'Zsh glob qualifier with command execution' },
  {
    pattern: /\}\s*always\s*\{/,
    message: 'Zsh always block (try/always construct)',
  },
  // Defense in depth: Block PowerShell comment syntax even though we don't execute in PowerShell
  // Added as protection against future changes that might introduce PowerShell execution
  { pattern: /<#/, message: 'PowerShell comment syntax' },
]

// Zsh-specific dangerous commands that can bypass security checks.
// These are checked against the base command (first word) of each command segment.
// ZSH_DANGEROUS_COMMANDS 命令数据保存`Set`，供工具调用后续处理使用。
const ZSH_DANGEROUS_COMMANDS = new Set([
  // zmodload is the gateway to many dangerous module-based attacks:
  // zsh/mapfile (invisible file I/O via array assignment),
  // zsh/system (sysopen/syswrite two-step file access),
  // zsh/zpty (pseudo-terminal command execution),
  // zsh/net/tcp (network exfiltration via ztcp),
  // zsh/files (builtin rm/mv/ln/chmod that bypass binary checks)
  'zmodload',
  // emulate with -c flag is an eval-equivalent that executes arbitrary code
  'emulate',
  // Zsh module builtins that enable dangerous operations.
  // These require zmodload first, but we block them as defense-in-depth
  // in case zmodload is somehow bypassed or the module is pre-loaded.
  'sysopen', // Opens files with fine-grained control (zsh/system)
  'sysread', // Reads from file descriptors (zsh/system)
  'syswrite', // Writes to file descriptors (zsh/system)
  'sysseek', // Seeks on file descriptors (zsh/system)
  'zpty', // Executes commands on pseudo-terminals (zsh/zpty)
  'ztcp', // Creates TCP connections for exfiltration (zsh/net/tcp)
  'zsocket', // Creates Unix/TCP sockets (zsh/net/socket)
  'mapfile', // Not actually a command, but the associative array is set via zmodload
  'zf_rm', // Builtin rm from zsh/files
  'zf_mv', // Builtin mv from zsh/files
  'zf_ln', // Builtin ln from zsh/files
  'zf_chmod', // Builtin chmod from zsh/files
  'zf_chown', // Builtin chown from zsh/files
  'zf_mkdir', // Builtin mkdir from zsh/files
  'zf_rmdir', // Builtin rmdir from zsh/files
  'zf_chgrp', // Builtin chgrp from zsh/files
])

// Numeric identifiers for bash security checks (to avoid logging strings)
// BASH_SECURITY_CHECK_IDS 集合 集中保存Bash 工具 bash Security要一起传递的字段。
const BASH_SECURITY_CHECK_IDS = {
  INCOMPLETE_COMMANDS: 1,
  JQ_SYSTEM_FUNCTION: 2,
  JQ_FILE_ARGUMENTS: 3,
  OBFUSCATED_FLAGS: 4,
  SHELL_METACHARACTERS: 5,
  DANGEROUS_VARIABLES: 6,
  NEWLINES: 7,
  DANGEROUS_PATTERNS_COMMAND_SUBSTITUTION: 8,
  DANGEROUS_PATTERNS_INPUT_REDIRECTION: 9,
  DANGEROUS_PATTERNS_OUTPUT_REDIRECTION: 10,
  IFS_INJECTION: 11,
  GIT_COMMIT_SUBSTITUTION: 12,
  PROC_ENVIRON_ACCESS: 13,
  MALFORMED_TOKEN_INJECTION: 14,
  BACKSLASH_ESCAPED_WHITESPACE: 15,
  BRACE_EXPANSION: 16,
  CONTROL_CHARACTERS: 17,
  UNICODE_WHITESPACE: 18,
  MID_WORD_HASH: 19,
  ZSH_DANGEROUS_COMMANDS: 20,
  BACKSLASH_ESCAPED_OPERATORS: 21,
  COMMENT_QUOTE_DESYNC: 22,
  QUOTED_NEWLINE: 23,
} as const

// ValidationContext 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type ValidationContext = {
  originalCommand: string
  baseCommand: string
  unquotedContent: string
  fullyUnquotedContent: string
  /** fullyUnquoted before stripSafeRedirections — used by validateBraceExpansion
   * to avoid false negatives from redirection stripping creating backslash adjacencies */
  fullyUnquotedPreStrip: string
  /** Like fullyUnquotedPreStrip but preserves quote characters ('/"): e.g.,
   * echo 'x'# → echo ''# (the quote chars remain, revealing adjacency to #) */
  unquotedKeepQuoteChars: string
  /** Tree-sitter analysis data, if available. Validators can use this for
   * more accurate analysis when present, falling back to regex otherwise. */
  treeSitter?: TreeSitterAnalysis | null
}

// QuoteExtraction 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
type QuoteExtraction = {
  withDoubleQuotes: string
  fullyUnquoted: string
  /** Like fullyUnquoted but preserves quote characters ('/"): strips quoted
   * content while keeping the delimiters. Used by validateMidWordHash to detect
   * quote-adjacent # (e.g., 'x'# where quote stripping would hide adjacency). */
  unquotedKeepQuoteChars: string
}

// extractQuotedContent 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractQuotedContent(command: string, isJq = false): QuoteExtraction {
  // withDoubleQuotes 集合 命名 `''`，让后续代码直接表达这个值的用途。
  let withDoubleQuotes = ''
  // fullyUnquoted 命名 `''`，让后续代码直接表达这个值的用途。
  let fullyUnquoted = ''
  // unquotedKeepQuoteChars 集合固定为 `''`，作为Bash 工具 bash Security后续展示或比较的基准。
  let unquotedKeepQuoteChars = ''
  // inSingleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inSingleQuote = false
  // inDoubleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inDoubleQuote = false
  // escaped标记Bash 工具 bash Security是否启用对应路径。
  let escaped = false

  // 按索引扫描 `command.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < command.length; i++) {
    // char读取 `command[i]` 对应条目，后续围绕该成员继续处理。
    const char = command[i]

    // 满足 `escaped` 时，工具调用执行该分支。
    if (escaped) {
      // escaped更新为 `false`，确保Bash 工具后续读取最新状态。
      escaped = false
      // inSingleQuote缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!inSingleQuote) withDoubleQuotes += char
      // 只有 `!inSingleQuote && !inDoubleQuote` 满足时，工具调用才执行该分支。
      if (!inSingleQuote && !inDoubleQuote) fullyUnquoted += char
      // 只有 `!inSingleQuote && !inDoubleQuote` 满足时，工具调用才执行该分支。
      if (!inSingleQuote && !inDoubleQuote) unquotedKeepQuoteChars += char
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === '\\' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '\\' && !inSingleQuote) {
      // escaped更新为 `true`，确保Bash 工具后续读取最新状态。
      escaped = true
      // inSingleQuote缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!inSingleQuote) withDoubleQuotes += char
      // 只有 `!inSingleQuote && !inDoubleQuote` 满足时，工具调用才执行该分支。
      if (!inSingleQuote && !inDoubleQuote) fullyUnquoted += char
      // 只有 `!inSingleQuote && !inDoubleQuote` 满足时，工具调用才执行该分支。
      if (!inSingleQuote && !inDoubleQuote) unquotedKeepQuoteChars += char
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === "'" && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (char === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 工具后续读取最新状态。
      inSingleQuote = !inSingleQuote
      // Bash 工具 bash Security在这里处理 `unquotedKeepQuoteChars += char`，完成这一小步状态转换。
      unquotedKeepQuoteChars += char
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === '"' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // Bash 工具 bash Security在这里处理 `unquotedKeepQuoteChars += char`，完成这一小步状态转换。
      unquotedKeepQuoteChars += char
      // For jq, include quotes in extraction to ensure content is properly analyzed
      // isJq缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!isJq) continue
    }

    // inSingleQuote缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!inSingleQuote) withDoubleQuotes += char
    // 只有 `!inSingleQuote && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (!inSingleQuote && !inDoubleQuote) fullyUnquoted += char
    // 只有 `!inSingleQuote && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (!inSingleQuote && !inDoubleQuote) unquotedKeepQuoteChars += char
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { withDoubleQuotes, fullyUnquoted, unquotedKeepQuoteChars }
}

// stripSafeRedirections 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function stripSafeRedirections(content: string): string {
  // SECURITY: All three patterns MUST have a trailing boundary (?=\s|$).
  // Without it, `> /dev/nullo` matches `/dev/null` as a PREFIX, strips
  // `> /dev/null` leaving `o`, so `echo hi > /dev/nullo` becomes `echo hi o`.
  // validateRedirections then sees no `>` and passes. The file write to
  // /dev/nullo is auto-allowed via the read-only path (checkReadOnlyConstraints).
  // Main bashPermissions flow is protected (checkPathConstraints validates the
  // original command), but speculation.ts uses checkReadOnlyConstraints alone.
  // 返回 `content`，作为工具调用这次计算的结果。
  return content
    .replace(/\s+2\s*>&\s*1(?=\s|$)/g, '')
    .replace(/[012]?\s*>\s*\/dev\/null(?=\s|$)/g, '')
    .replace(/\s*<\s*\/dev\/null(?=\s|$)/g, '')
}

/**
 * Checks if content contains an unescaped occurrence of a single character.
 * Handles bash escape sequences correctly where a backslash escapes the following character.
 *
 * IMPORTANT: This function only handles single characters, not strings. If you need to extend
 * this to handle multi-character strings, be EXTREMELY CAREFUL about shell ANSI-C quoting
 * (e.g., $'\n', $'\x41', $'\u0041') which can encode arbitrary characters and strings in ways
 * that are very difficult to parse correctly. Incorrect handling could introduce security
 * vulnerabilities by allowing attackers to bypass security checks.
 *
 * @param content - The string to search (typically from extractQuotedContent)
 * @param char - Single character to search for (e.g., '`')
 * @returns true if unescaped occurrence found, false otherwise
 *
 * Examples:
 *   hasUnescapedChar("test \`safe\`", '`') → false (escaped backticks)
 *   hasUnescapedChar("test `dangerous`", '`') → true (unescaped backticks)
 *   hasUnescapedChar("test\\`date`", '`') → true (escaped backslash + unescaped backtick)
 */
// hasUnescapedChar 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasUnescapedChar(content: string, char: string): boolean {
  // `char.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
  if (char.length !== 1) {
    // 抛出 new Error('hasUnescapedChar only works with single characters')，阻止工具调用在无效状态下继续运行。
    throw new Error('hasUnescapedChar only works with single characters')
  }

  // i保存`0`，供后续判断或组装使用。
  let i = 0
  // while 使用 i < content.length 完成工具调用里的对应操作。
  while (i < content.length) {
    // If we see a backslash, skip it and the next character (they form an escape sequence)
    // 只有 `content[i] === '\\' && i + 1 < content.length` 满足时，工具调用才执行该分支。
    if (content[i] === '\\' && i + 1 < content.length) {
      // Bash 工具 bash Security在这里处理 `i += 2 // Skip backslash and escaped character`，完成这一小步状态转换。
      i += 2 // Skip backslash and escaped character
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Check if current character matches
    // 满足 `content[i] === char` 时，工具调用执行该分支。
    if (content[i] === char) {
      // 返回 `true // Found unescaped occurrence`，作为工具调用这次计算的结果。
      return true // Found unescaped occurrence
    }

    // Bash 工具 bash Security在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // 返回 `false // No unescaped occurrences found`，作为工具调用这次计算的结果。
  return false // No unescaped occurrences found
}

// validateEmpty 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateEmpty(context: ValidationContext): PermissionResult {
  // 满足 `!context.originalCommand.trim()` 时，工具调用执行该分支。
  if (!context.originalCommand.trim()) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: { command: context.originalCommand },
      decisionReason: { type: 'other', reason: 'Empty command is safe' },
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'Command is not empty' }
}

// validateIncompleteCommands 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateIncompleteCommands(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context
  // trimmed格式化`originalCommand.trim`，供工具调用后续处理使用。
  const trimmed = originalCommand.trim()

  // 满足 `/^\s*\t/.test(originalCommand)` 时，工具调用执行该分支。
  if (/^\s*\t/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.INCOMPLETE_COMMANDS,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command appears to be an incomplete fragment (starts with tab)',
    }
  }

  // 满足 `trimmed.startsWith('-')` 时，工具调用执行该分支。
  if (trimmed.startsWith('-')) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.INCOMPLETE_COMMANDS,
      subId: 2,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command appears to be an incomplete fragment (starts with flags)',
    }
  }

  // 只有 `/^\s*(&&|\|\||;|>>?|<)/.test(originalCommand)` 满足时，工具调用才执行该分支。
  if (/^\s*(&&|\|\||;|>>?|<)/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.INCOMPLETE_COMMANDS,
      subId: 3,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command appears to be a continuation line (starts with operator)',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'Command appears complete' }
}

/**
 * Checks if a command is a "safe" heredoc-in-substitution pattern that can
 * bypass the generic $() validator.
 *
 * This is an EARLY-ALLOW path: returning `true` causes bashCommandIsSafe to
 * return `passthrough`, bypassing ALL subsequent validators. Given this
 * authority, the check must be PROVABLY safe, not "probably safe".
 *
 * The only pattern we allow is:
 *   [prefix] $(cat <<'DELIM'\n
 *   [body lines]\n
 *   DELIM\n
 *   ) [suffix]
 *
 * Where:
 * - The delimiter must be single-quoted ('DELIM') or escaped (\DELIM) so the
 *   body is literal text with no expansion
 * - The closing delimiter must be on a line BY ITSELF (or with only trailing
 *   whitespace + `)` for the $(cat <<'EOF'\n...\nEOF)` inline form)
 * - The closing delimiter must be the FIRST such line — matching bash's
 *   behavior exactly (no skipping past early delimiters to find EOF))
 * - There must be non-whitespace text BEFORE the $( (i.e., the substitution
 *   is used in argument position, not as a command name). Otherwise the
 *   heredoc body becomes an arbitrary command name with [suffix] as args.
 * - The remaining text (with the heredoc stripped) must pass all validators
 *
 * This implementation uses LINE-BASED matching, not regex [\s\S]*?, to
 * precisely replicate bash's heredoc-closing behavior.
 */
// isSafeHeredoc 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSafeHeredoc(command: string): boolean {
  // 满足 `!HEREDOC_IN_SUBSTITUTION.test(command)` 时，工具调用执行该分支。
  if (!HEREDOC_IN_SUBSTITUTION.test(command)) return false

  // SECURITY: Use [ \t] (not \s) between << and the delimiter. \s matches
  // newlines, but bash requires the delimiter word on the same line as <<.
  // Matching across newlines could accept malformed syntax that bash rejects.
  // Handle quote variations: 'EOF', ''EOF'' (splitCommand may mangle quotes).
  // heredocPattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const heredocPattern =
    /\$\(cat[ \t]*<<(-?)[ \t]*(?:'+([A-Za-z_]\w*)'+|\\([A-Za-z_]\w*))/g
  // match 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let match
  // HeredocMatch 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
  type HeredocMatch = {
    start: number
    operatorEnd: number
    delimiter: string
    isDash: boolean
  }
  // safeHeredocs 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const safeHeredocs: HeredocMatch[] = []

  // 只要 (match = heredocPattern.exec(command)) !== null 成立，就持续推进工具调用中的循环处理。
  while ((match = heredocPattern.exec(command)) !== null) {
    // delimiter标记Bash 工具 bash Security是否启用对应路径。
    const delimiter = match[2] || match[3]
    // 满足 `delimiter` 时，工具调用执行该分支。
    if (delimiter) {
      // safeHeredocs 集合追加新条目，保持收集顺序与输入顺序一致。
      safeHeredocs.push({
        start: match.index,
        operatorEnd: match.index + match[0].length,
        delimiter,
        isDash: match[1] === '-',
      })
    }
  }

  // If no safe heredoc patterns found, it's not safe
  // safeHeredocs 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (safeHeredocs.length === 0) return false

  // SECURITY: For each heredoc, find the closing delimiter using LINE-BASED
  // matching that exactly replicates bash's behavior. Bash closes a heredoc
  // at the FIRST line that exactly matches the delimiter. Any subsequent
  // occurrence of the delimiter is just content (or a new command). Regex
  // [\s\S]*? can skip past the first delimiter to find a later `DELIM)`
  // pattern, hiding injected commands between the two delimiters.
  // VerifiedHeredoc 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
  type VerifiedHeredoc = { start: number; end: number }
  // verified 从空数组开始收集，后续循环会按处理顺序追加条目。
  const verified: VerifiedHeredoc[] = []

  // 循环处理 `const { start, operatorEnd, delimiter, isDash } o`，让工具调用逐项把同类条目按顺序走完。
  for (const { start, operatorEnd, delimiter, isDash } of safeHeredocs) {
    // The opening line must end immediately after the delimiter (only
    // horizontal whitespace allowed before the newline). If there's other
    // content (like `; rm -rf /`), this is not a simple safe heredoc.
    // afterOperator格式化`command.slice`，供工具调用后续处理使用。
    const afterOperator = command.slice(operatorEnd)
    // openLineEnd保存`afterOperator.indexOf`，供工具调用后续处理使用。
    const openLineEnd = afterOperator.indexOf('\n')
    // 满足 `openLineEnd === -1` 时，工具调用执行该分支。
    if (openLineEnd === -1) return false // No content at all
    // openLineTail格式化`afterOperator.slice`，供工具调用后续处理使用。
    const openLineTail = afterOperator.slice(0, openLineEnd)
    // 满足 `!/^[ \t]*$/.test(openLineTail)` 时，工具调用执行该分支。
    if (!/^[ \t]*$/.test(openLineTail)) return false // Extra content on open line

    // Body starts after the newline
    // bodyStart 命名 `operatorEnd + openLineEnd + 1`，让后续代码直接表达这个值的用途。
    const bodyStart = operatorEnd + openLineEnd + 1
    // 请求体格式化`command.slice`，供工具调用后续处理使用。
    const body = command.slice(bodyStart)
    // bodyLines 集合格式化`body.split`，供工具调用后续处理使用。
    const bodyLines = body.split('\n')

    // Find the FIRST line that closes the heredoc. There are two valid forms:
    //   1. `DELIM` alone on a line (bash-standard), followed by `)` on the
    //      next line (with only whitespace before it)
    //   2. `DELIM)` on a line (the inline $(cat <<'EOF'\n...\nEOF) form,
    //      where bash's PST_EOFTOKEN closes both heredoc and substitution)
    // For <<-, leading tabs are stripped before matching.
    // closingLineIdx 命名 `-1`，让后续代码直接表达这个值的用途。
    let closingLineIdx = -1
    // closeParenLineIdx 命名 `-1 // Line index where `)` appears`，让后续代码直接表达这个值的用途。
    let closeParenLineIdx = -1 // Line index where `)` appears
    // closeParenColIdx保存`-1 // Column index of `)` on that line`，供后续判断或组装使用。
    let closeParenColIdx = -1 // Column index of `)` on that line

    // 按索引扫描 `bodyLines.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < bodyLines.length; i++) {
      // rawLine读取 `bodyLines[i]!` 对应条目，后续围绕该成员继续处理。
      const rawLine = bodyLines[i]!
      // line格式化`rawLine.replace`，供工具调用后续处理使用。
      const line = isDash ? rawLine.replace(/^\t*/, '') : rawLine

      // Form 1: delimiter alone on a line
      // 满足 `line === delimiter` 时，工具调用执行该分支。
      if (line === delimiter) {
        // closingLineIdx更新为 `i`，确保Bash 工具后续读取最新状态。
        closingLineIdx = i
        // The `)` must be on the NEXT line with only whitespace before it
        // nextLine 命名 `bodyLines[i + 1]`，让后续代码直接表达这个值的用途。
        const nextLine = bodyLines[i + 1]
        // 满足 `nextLine === undefined) return false // No closing `` 时，工具调用执行该分支。
        if (nextLine === undefined) return false // No closing `)`
        // parenMatch匹配`nextLine.match`，供工具调用后续处理使用。
        const parenMatch = nextLine.match(/^([ \t]*)\)/)
        // 满足 `!parenMatch) return false // `` 时，工具调用执行该分支。
        if (!parenMatch) return false // `)` not at start of next line
        // closeParenLineIdx更新为 `i + 1`，确保Bash 工具后续读取最新状态。
        closeParenLineIdx = i + 1
        // closeParenColIdx更新为 `parenMatch[1]!.length // Position of `)``，确保Bash 工具后续读取最新状态。
        closeParenColIdx = parenMatch[1]!.length // Position of `)`
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      }

      // Form 2: delimiter immediately followed by `)` (PST_EOFTOKEN form)
      // Only whitespace allowed between delimiter and `)`.
      // 满足 `line.startsWith(delimiter)` 时，工具调用执行该分支。
      if (line.startsWith(delimiter)) {
        // afterDelim格式化`line.slice`，供工具调用后续处理使用。
        const afterDelim = line.slice(delimiter.length)
        // parenMatch匹配`afterDelim.match`，供工具调用后续处理使用。
        const parenMatch = afterDelim.match(/^([ \t]*)\)/)
        // 满足 `parenMatch` 时，工具调用执行该分支。
        if (parenMatch) {
          // closingLineIdx更新为 `i`，确保Bash 工具后续读取最新状态。
          closingLineIdx = i
          // closeParenLineIdx更新为 `i`，确保Bash 工具后续读取最新状态。
          closeParenLineIdx = i
          // Column is in rawLine (pre-tab-strip), so recompute
          // tabPrefix匹配`rawLine.match`，供工具调用后续处理使用。
          const tabPrefix = isDash ? (rawLine.match(/^\t*/)?.[0] ?? '') : ''
          // Bash 工具 bash Security在这里处理 `closeParenColIdx =`，完成这一小步状态转换。
          closeParenColIdx =
            tabPrefix.length + delimiter.length + parenMatch[1]!.length
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        }
        // Line starts with delimiter but has other trailing content —
        // this is NOT the closing line (bash requires exact match or EOF`)`).
        // But it's also a red flag: if this were inside $(), bash might
        // close early via PST_EOFTOKEN with other shell metacharacters.
        // We already handle that case in extractHeredocs — here we just
        // reject it as not matching our safe pattern.
        // 满足 `/^[)}`|&;(<>]/.test(afterDelim)` 时，工具调用执行该分支。
        if (/^[)}`|&;(<>]/.test(afterDelim)) {
          return false // Ambiguous early-closure pattern
        }
      }
    }

    if (closingLineIdx === -1) return false // No closing delimiter found

    // Compute the absolute end position (one past the `)` character)
    let endPos = bodyStart
    for (let i = 0; i < closeParenLineIdx; i++) {
      endPos += bodyLines[i]!.length + 1 // +1 for newline
    }
    endPos += closeParenColIdx + 1 // +1 to include the `)` itself

    verified.push({ start, end: endPos })
  }

  // SECURITY: Reject nested matches. The regex finds $(cat <<'X' patterns
  // in RAW TEXT without understanding quoted-heredoc semantics. When the
  // outer heredoc has a quoted delimiter (<<'A'), its body is LITERAL text
  // in bash — any inner $(cat <<'B' is just characters, not a real heredoc.
  // But our regex matches both, producing NESTED ranges. Stripping nested
  // ranges corrupts indices: after stripping the inner range, the outer
  // range's `end` is stale (points past the shrunken string), causing
  // `remaining.slice(end)` to return '' and silently drop any suffix
  // (e.g., `; rm -rf /`). Since all our matched heredocs have quoted/escaped
  // delimiters, a nested match inside the body is ALWAYS literal text —
  // no legitimate user writes this pattern. Bail to safe fallback.
  for (const outer of verified) {
    for (const inner of verified) {
      if (inner === outer) continue
      if (inner.start > outer.start && inner.start < outer.end) {
        return false
      }
    }
  }

  // Strip all verified heredocs from the command, building `remaining`.
  // Process in reverse order so earlier indices stay valid.
  const sortedVerified = [...verified].sort((a, b) => b.start - a.start)
  let remaining = command
  for (const { start, end } of sortedVerified) {
    remaining = remaining.slice(0, start) + remaining.slice(end)
  }

  // SECURITY: The remaining text must NOT start with only whitespace before
  // the (now-stripped) heredoc position IF there's non-whitespace after it.
  // If the $() is in COMMAND-NAME position (no prefix), its output becomes
  // the command to execute, with any suffix text as arguments:
  //   $(cat <<'EOF'\nchmod\nEOF\n) 777 /etc/shadow
  //   → runs `chmod 777 /etc/shadow`
  // We only allow the substitution in ARGUMENT position: there must be a
  // command word before the $(.
  // After stripping, `remaining` should look like `cmd args... [more args]`.
  // If remaining starts with only whitespace (or is empty), the $() WAS the
  // command — that's only safe if there are no trailing arguments.
  const trimmedRemaining = remaining.trim()
  if (trimmedRemaining.length > 0) {
    // There's a prefix command — good. But verify the original command
    // also had a non-whitespace prefix before the FIRST $( (the heredoc
    // could be one of several; we need the first one's prefix).
    const firstHeredocStart = Math.min(...verified.map(v => v.start))
    const prefix = command.slice(0, firstHeredocStart)
    if (prefix.trim().length === 0) {
      // $() is in command-name position but there's trailing text — UNSAFE.
      // The heredoc body becomes the command name, trailing text becomes args.
      return false
    }
  }

  // Check that remaining text contains only safe characters.
  // After stripping safe heredocs, the remaining text should only be command
  // names, arguments, quotes, and whitespace. Reject ANY shell metacharacter
  // to prevent operators (|, &, &&, ||, ;) or expansions ($, `, {, <, >) from
  // being used to chain dangerous commands after a safe heredoc.
  // SECURITY: Use explicit ASCII space/tab only — \s matches unicode whitespace
  // like \u00A0 which can be used to hide content. Newlines are also blocked
  // (they would indicate multi-line commands outside the heredoc body).
  // 满足 `!/^[a-zA-Z0-9 \t"'.\-/_@=,:+~]*$/.test(remaining)` 时，工具调用执行该分支。
  if (!/^[a-zA-Z0-9 \t"'.\-/_@=,:+~]*$/.test(remaining)) return false

  // SECURITY: The remaining text (command with heredocs stripped) must also
  // pass all security validators. Without this, appending a safe heredoc to a
  // dangerous command (e.g., `zmodload zsh/system $(cat <<'EOF'\nx\nEOF\n)`)
  // causes this early-allow path to return passthrough, bypassing
  // validateZshDangerousCommands, validateProcEnvironAccess, and any other
  // main validator that checks allowlist-safe character patterns.
  // No recursion risk: `remaining` has no `$(... <<` pattern, so the recursive
  // call's validateSafeCommandSubstitution returns passthrough immediately.
  // 判断 bashCommandIsSafe_DEPRECATED(remaining).behavior !== 'passthrough'，将工具调用分流到只适用于该条件的处理路径。
  if (bashCommandIsSafe_DEPRECATED(remaining).behavior !== 'passthrough')
    // 返回 false，把工具调用这个分支的结果交还调用方。
    return false

  // 返回 true，把工具调用这个分支的结果交还调用方。
  return true
}

/**
 * Detects well-formed $(cat <<'DELIM'...DELIM) heredoc substitution patterns.
 * Returns the command with matched heredocs stripped, or null if none found.
 * Used by the pre-split gate to strip safe heredocs and re-check the remainder.
 */
// stripSafeHeredocSubstitutions 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
export function stripSafeHeredocSubstitutions(command: string): string | null {
  // 判断 !HEREDOC_IN_SUBSTITUTION.test(command)，将工具调用分流到只适用于该条件的处理路径。
  if (!HEREDOC_IN_SUBSTITUTION.test(command)) return null

  // heredocPattern 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const heredocPattern =
    /\$\(cat[ \t]*<<(-?)[ \t]*(?:'+([A-Za-z_]\w*)'+|\\([A-Za-z_]\w*))/g
  // 结果保存`command`，供Bash 工具 bash Security后续步骤使用。
  let result = command
  // found记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let found = false
  // match 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let match
  // ranges 集合从空数组开始收集，后续按处理顺序追加条目。
  const ranges: Array<{ start: number; end: number }> = []
  // 只要 (match = heredocPattern.exec(command)) !== null 成立，就持续推进工具调用中的循环处理。
  while ((match = heredocPattern.exec(command)) !== null) {
    // 判断 match.index > 0 && command[match.index - 1] === '\\'，将工具调用分流到只适用于该条件的处理路径。
    if (match.index > 0 && command[match.index - 1] === '\\') continue
    // delimiter记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
    const delimiter = match[2] || match[3]
    // 判断 !delimiter，将工具调用分流到只适用于该条件的处理路径。
    if (!delimiter) continue
    // isDash记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
    const isDash = match[1] === '-'
    // operatorEnd统计`match.index + match[0].length`，供Bash 工具 bash Security后续步骤使用。
    const operatorEnd = match.index + match[0].length

    // afterOperator格式化`command.slice`，供工具调用后续处理使用。
    const afterOperator = command.slice(operatorEnd)
    // openLineEnd保存`afterOperator.indexOf`，供工具调用后续处理使用。
    const openLineEnd = afterOperator.indexOf('\n')
    // 判断 openLineEnd === -1，将工具调用分流到只适用于该条件的处理路径。
    if (openLineEnd === -1) continue
    // 判断 !/^[ \t]*$/.test(afterOperator.slice(0, openLineEnd))，将工具调用分流到只适用于该条件的处理路径。
    if (!/^[ \t]*$/.test(afterOperator.slice(0, openLineEnd))) continue

    // bodyStart保存`operatorEnd + openLineEnd + 1`，供Bash 工具 bash Security后续步骤使用。
    const bodyStart = operatorEnd + openLineEnd + 1
    // bodyLines 集合格式化`command.slice`，供工具调用后续处理使用。
    const bodyLines = command.slice(bodyStart).split('\n')
    // 遍历 let i = 0; i < bodyLines.length; i++，让工具调用逐项完成同一类处理。
    for (let i = 0; i < bodyLines.length; i++) {
      // rawLine保存`bodyLines[i]!`，供Bash 工具 bash Security后续步骤使用。
      const rawLine = bodyLines[i]!
      // line格式化`rawLine.replace`，供工具调用后续处理使用。
      const line = isDash ? rawLine.replace(/^\t*/, '') : rawLine
      // 判断 line.startsWith(delimiter)，将工具调用分流到只适用于该条件的处理路径。
      if (line.startsWith(delimiter)) {
        // after格式化`line.slice`，供工具调用后续处理使用。
        const after = line.slice(delimiter.length)
        // closePos 集合保存`-1`，供Bash 工具 bash Security后续步骤使用。
        let closePos = -1
        // 判断 /^[ \t]*\)/.test(after)，将工具调用分流到只适用于该条件的处理路径。
        if (/^[ \t]*\)/.test(after)) {
          // lineStart 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const lineStart =
            bodyStart +
            bodyLines.slice(0, i).join('\n').length +
            (i > 0 ? 1 : 0)
          // closePos 集合更新为 `command.indexOf(')', lineStart)`，确保Bash 工具后续读取最新状态。
          closePos = command.indexOf(')', lineStart)
        // `after === ''` 成立时，Bash 工具 bash Security切换到这个 else-if 分支。
        } else if (after === '') {
          // nextLine保存`bodyLines[i + 1]`，供Bash 工具 bash Security后续步骤使用。
          const nextLine = bodyLines[i + 1]
          // 判断 nextLine !== undefined && /^[ \t]*\)/.test(nextLine)，将工具调用分流到只适用于该条件的处理路径。
          if (nextLine !== undefined && /^[ \t]*\)/.test(nextLine)) {
            // nextLineStart 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
            const nextLineStart =
              bodyStart + bodyLines.slice(0, i + 1).join('\n').length + 1
            // closePos 集合更新为 `command.indexOf(')', nextLineStart)`，确保Bash 工具后续读取最新状态。
            closePos = command.indexOf(')', nextLineStart)
          }
        }
        // `closePos` 与 `-1` 不一致时刷新派生状态。
        if (closePos !== -1) {
          // ranges 集合追加新条目，保持收集顺序与输入顺序一致。
          ranges.push({ start: match.index, end: closePos + 1 })
          // found更新为 `true`，确保Bash 工具后续读取最新状态。
          found = true
        }
        // 结束这个分支或循环，避免工具调用继续落入后续路径。
        break
      }
    }
  }
  // 判断 !found，将工具调用分流到只适用于该条件的处理路径。
  if (!found) return null
  // 遍历 let i = ranges.length - 1; i >= 0; i--，让工具调用逐项完成同一类处理。
  for (let i = ranges.length - 1; i >= 0; i--) {
    // r保存`ranges[i]!`，供Bash 工具 bash Security后续步骤使用。
    const r = ranges[i]!
    // 结果更新为 `result.slice(0, r.start) + result.slice(r.end)`，确保Bash 工具后续读取最新状态。
    result = result.slice(0, r.start) + result.slice(r.end)
  }
  // 返回 result，把工具调用这个分支的结果交还调用方。
  return result
}

/** Detection-only check: does the command contain a safe heredoc substitution? */
// hasSafeHeredocSubstitution 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
export function hasSafeHeredocSubstitution(command: string): boolean {
  // 返回 stripSafeHeredocSubstitutions(command) !== null，把工具调用这个分支的结果交还调用方。
  return stripSafeHeredocSubstitutions(command) !== null
}

// validateSafeCommandSubstitution 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateSafeCommandSubstitution(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // 判断 !HEREDOC_IN_SUBSTITUTION.test(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (!HEREDOC_IN_SUBSTITUTION.test(originalCommand)) {
    // 返回 { behavior: 'passthrough', message: 'No heredoc in substitution' }，把工具调用这个分支的结果交还调用方。
    return { behavior: 'passthrough', message: 'No heredoc in substitution' }
  }

  // 判断 isSafeHeredoc(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (isSafeHeredoc(originalCommand)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'allow',
      updatedInput: { command: originalCommand },
      decisionReason: {
        type: 'other',
        reason:
          'Safe command substitution: cat with quoted/escaped heredoc delimiter',
      },
    }
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'Command substitution needs validation',
  }
}

// validateGitCommit 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateGitCommit(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 originalCommand、baseCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand, baseCommand } = context

  // 判断 baseCommand !== 'git' || !/^git\s+commit\s+/.test(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (baseCommand !== 'git' || !/^git\s+commit\s+/.test(originalCommand)) {
    // 返回 { behavior: 'passthrough', message: 'Not a git commit' }，把工具调用这个分支的结果交还调用方。
    return { behavior: 'passthrough', message: 'Not a git commit' }
  }

  // SECURITY: Backslashes can cause our regex to mis-identify quote boundaries
  // (e.g., `git commit -m "test\"msg" && evil`). Legitimate commit messages
  // virtually never contain backslashes, so bail to the full validator chain.
  // 判断 originalCommand.includes('\\')，将工具调用分流到只适用于该条件的处理路径。
  if (originalCommand.includes('\\')) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'passthrough',
      message: 'Git commit contains backslash, needs full validation',
    }
  }

  // SECURITY: The `.*?` before `-m` must NOT match shell operators. Previously
  // `.*?` matched anything except `\n`, including `;`, `&`, `|`, `` ` ``, `$(`.
  // For `git commit ; curl evil.com -m 'x'`, `.*?` swallowed `; curl evil.com `
  // leaving remainder=`` (falsy → remainder check skipped) → returned `allow`
  // for a compound command. Early-allow skips ALL main validators (line ~1908),
  // nullifying validateQuotedNewline, validateBackslashEscapedOperators, etc.
  // While splitCommand currently catches this downstream, early-allow is a
  // POSITIVE ASSERTION that the FULL command is safe — which it is NOT.
  //
  // Also: `\s+` between `git` and `commit` must NOT match `\n`/`\r` (command
  // separators in bash). Use `[ \t]+` for horizontal-only whitespace.
  //
  // The `[^;&|`$<>()\n\r]*?` class excludes shell metacharacters. We also
  // exclude `<` and `>` here (redirects) — they're allowed in the REMAINDER
  // for `--author="Name <email>"` but must not appear BEFORE `-m`.
  // messageMatch 消息数据匹配`originalCommand.match`，供工具调用后续处理使用。
  const messageMatch = originalCommand.match(
    /^git[ \t]+commit[ \t]+[^;&|`$<>()\n\r]*?-m[ \t]+(["'])([\s\S]*?)\1(.*)$/,
  )

  if (messageMatch) {
    const [, quote, messageContent, remainder] = messageMatch

    if (quote === '"' && messageContent && /\$\(|`|\$\{/.test(messageContent)) {
      logEvent('tengu_bash_security_check_triggered', {
        checkId: BASH_SECURITY_CHECK_IDS.GIT_COMMIT_SUBSTITUTION,
        subId: 1,
      })
      return {
        behavior: 'ask',
        message: 'Git commit message contains command substitution patterns',
      }
    }

    // SECURITY: Check remainder for shell operators that could chain commands
    // or redirect output. The `.*` before `-m` in the regex can swallow flags
    // like `--amend`, leaving `&& evil` or `> ~/.bashrc` in the remainder.
    // Previously we only checked for $() / `` / ${} here, missing operators
    // like ; | & && || < >.
    //
    // `<` and `>` can legitimately appear INSIDE quotes in --author values
    // like `--author="Name <email>"`. An UNQUOTED `>` is a shell redirect
    // operator. Because validateGitCommit is an EARLY validator, returning
    // `allow` here short-circuits bashCommandIsSafe and SKIPS
    // validateRedirections. So we must bail to passthrough on unquoted `<>`
    // to let the main validators handle it.
    //
    // Attack: `git commit --allow-empty -m 'payload' > ~/.bashrc`
    //   validateGitCommit returns allow → bashCommandIsSafe short-circuits →
    //   validateRedirections NEVER runs → ~/.bashrc overwritten with git
    //   stdout containing `payload` → RCE on next shell login.
    if (remainder && /[;|&()`]|\$\(|\$\{/.test(remainder)) {
      return {
        behavior: 'passthrough',
        message: 'Git commit remainder contains shell metacharacters',
      }
    }
    if (remainder) {
      // Strip quoted content, then check for `<` or `>`. Quoted `<>` (email
      // brackets in --author) are safe; unquoted `<>` are shell redirects.
      // NOTE: This simple quote tracker has NO backslash handling. `\'`/`\"`
      // outside quotes would desync it (bash: \' = literal ', tracker: toggles
      // SQ). BUT line 584 already bailed on ANY backslash in originalCommand,
      // so we never reach here with backslashes. For backslash-free input,
      // simple quote toggling is correct (no way to escape quotes without \\).
      // unquoted 命名 `''`，让后续代码直接表达这个值的用途。
      let unquoted = ''
      // inSQ标记Bash 工具 bash Security是否启用对应路径。
      let inSQ = false
      // inDQ标记Bash 工具 bash Security是否启用对应路径。
      let inDQ = false
      // 按索引扫描 `remainder.length`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < remainder.length; i++) {
        // c保存`remainder[i]`，供Bash 工具 bash Security后续判断或输出使用。
        const c = remainder[i]
        // 只有 `c === "'" && !inDQ` 满足时，工具调用才执行该分支。
        if (c === "'" && !inDQ) {
          // inSQ更新为 `!inSQ`，确保Bash 工具后续读取最新状态。
          inSQ = !inSQ
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
        // 只有 `c === '"' && !inSQ` 满足时，工具调用才执行该分支。
        if (c === '"' && !inSQ) {
          // inDQ更新为 `!inDQ`，确保Bash 工具后续读取最新状态。
          inDQ = !inDQ
          // 跳过当前项，继续处理工具调用中的下一轮循环。
          continue
        }
        // 只有 `!inSQ && !inDQ` 满足时，工具调用才执行该分支。
        if (!inSQ && !inDQ) unquoted += c
      }
      // 满足 `/[<>]/.test(unquoted)` 时，工具调用执行该分支。
      if (/[<>]/.test(unquoted)) {
        // 返回结构化结果，集中表达工具调用已经整理出的状态。
        return {
          behavior: 'passthrough',
          message: 'Git commit remainder contains unquoted redirect operator',
        }
      }
    }

    // Security hardening: block messages starting with dash
    // This catches potential obfuscation patterns like git commit -m "---"
    // 只有 `messageContent && messageContent.startsWith('-')` 满足时，工具调用才执行该分支。
    if (messageContent && messageContent.startsWith('-')) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bash_security_check_triggered', {
        checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
        subId: 5,
      })
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message: 'Command contains quoted characters in flag names',
      }
    }

    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'allow',
      updatedInput: { command: originalCommand },
      decisionReason: {
        type: 'other',
        reason: 'Git commit with simple quoted message is allowed',
      },
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'Git commit needs validation' }
}

// validateJqCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateJqCommand(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 originalCommand、baseCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand, baseCommand } = context

  // `baseCommand` 与 `'jq'` 不一致时刷新派生状态，避免使用过期结果。
  if (baseCommand !== 'jq') {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough', message: 'Not jq' }
  }

  // 满足 `/\bsystem\s*\(/.test(originalCommand)` 时，工具调用执行该分支。
  if (/\bsystem\s*\(/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.JQ_SYSTEM_FUNCTION,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'jq command contains system() function which executes arbitrary commands',
    }
  }

  // File arguments are now allowed - they will be validated by path validation in readOnlyValidation.ts
  // Only block dangerous flags that could read files into jq variables
  // afterJq格式化`originalCommand.substring`，供工具调用后续处理使用。
  const afterJq = originalCommand.substring(3).trim()
  // 工具调用在这里按实际状态进入对应分支。
  if (
    /(?:^|\s)(?:-f\b|--from-file|--rawfile|--slurpfile|-L\b|--library-path)/.test(
      afterJq,
    )
  ) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.JQ_FILE_ARGUMENTS,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'jq command contains dangerous flags that could execute code or read arbitrary files',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'jq command is safe' }
}

// validateShellMetacharacters 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateShellMetacharacters(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 unquotedContent，减少Bash 工具 bash Security对同一对象的重复访问。
  const { unquotedContent } = context
  // message 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const message =
    'Command contains shell metacharacters (;, |, or &) in arguments'

  // 满足 `/(?:^|\s)["'][^"']*[;&][^"']*["'](?:\s|$)/.test(unquotedContent)` 时，工具调用执行该分支。
  if (/(?:^|\s)["'][^"']*[;&][^"']*["'](?:\s|$)/.test(unquotedContent)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.SHELL_METACHARACTERS,
      subId: 1,
    })
    // 返回 { behavior: 'ask', message }，把工具调用这个分支的结果交还调用方。
    return { behavior: 'ask', message }
  }

  // globPatterns 集合聚合成有序列表，保持后续遍历顺序稳定。
  const globPatterns = [
    /-name\s+["'][^"']*[;|&][^"']*["']/,
    /-path\s+["'][^"']*[;|&][^"']*["']/,
    /-iname\s+["'][^"']*[;|&][^"']*["']/,
  ]

  // 判断 globPatterns.some(p => p.test(unquotedContent))，将工具调用分流到只适用于该条件的处理路径。
  if (globPatterns.some(p => p.test(unquotedContent))) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.SHELL_METACHARACTERS,
      subId: 2,
    })
    // 返回 { behavior: 'ask', message }，把工具调用这个分支的结果交还调用方。
    return { behavior: 'ask', message }
  }

  // 判断 /-regex\s+["'][^"']*[;&][^"']*["']/.test(unquotedContent)，将工具调用分流到只适用于该条件的处理路径。
  if (/-regex\s+["'][^"']*[;&][^"']*["']/.test(unquotedContent)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.SHELL_METACHARACTERS,
      subId: 3,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'ask', message }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'No metacharacters' }
}

// validateDangerousVariables 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateDangerousVariables(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 fullyUnquotedContent，减少Bash 工具 bash Security对同一对象的重复访问。
  const { fullyUnquotedContent } = context

  // 工具调用在这里按实际状态进入对应分支。
  if (
    /[<>|]\s*\$[A-Za-z_]/.test(fullyUnquotedContent) ||
    /\$[A-Za-z_][A-Za-z0-9_]*\s*[|<>]/.test(fullyUnquotedContent)
  ) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.DANGEROUS_VARIABLES,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains variables in dangerous contexts (redirections or pipes)',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'No dangerous variables' }
}

// validateDangerousPatterns 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateDangerousPatterns(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 unquotedContent，减少Bash 工具 bash Security对同一对象的重复访问。
  const { unquotedContent } = context

  // Special handling for backticks - check for UNESCAPED backticks only
  // Escaped backticks (e.g., \`) are safe and commonly used in SQL commands
  // 满足 `hasUnescapedChar(unquotedContent, '`')` 时，工具调用执行该分支。
  if (hasUnescapedChar(unquotedContent, '`')) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command contains backticks (`) for command substitution',
    }
  }

  // Other command substitution checks (include double-quoted content)
  // 循环处理 `const { pattern, message } of COMMAND_SUBSTITUTIO`，让工具调用逐项把同类条目按顺序走完。
  for (const { pattern, message } of COMMAND_SUBSTITUTION_PATTERNS) {
    // 满足 `pattern.test(unquotedContent)` 时，工具调用执行该分支。
    if (pattern.test(unquotedContent)) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bash_security_check_triggered', {
        checkId:
          BASH_SECURITY_CHECK_IDS.DANGEROUS_PATTERNS_COMMAND_SUBSTITUTION,
        subId: 1,
      })
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return { behavior: 'ask', message: `Command contains ${message}` }
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'No dangerous patterns' }
}

// validateRedirections 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateRedirections(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 fullyUnquotedContent，减少Bash 工具 bash Security对同一对象的重复访问。
  const { fullyUnquotedContent } = context

  // 满足 `/</.test(fullyUnquotedContent)` 时，工具调用执行该分支。
  if (/</.test(fullyUnquotedContent)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.DANGEROUS_PATTERNS_INPUT_REDIRECTION,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains input redirection (<) which could read sensitive files',
    }
  }

  // 满足 `/>/.test(fullyUnquotedContent)` 时，工具调用执行该分支。
  if (/>/.test(fullyUnquotedContent)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.DANGEROUS_PATTERNS_OUTPUT_REDIRECTION,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains output redirection (>) which could write to arbitrary files',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'No redirections' }
}

// validateNewlines 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateNewlines(context: ValidationContext): PermissionResult {
  // Use fullyUnquotedPreStrip (before stripSafeRedirections) to prevent bypasses
  // where stripping `>/dev/null` creates a phantom backslash-newline continuation.
  // E.g., `cmd \>/dev/null\nwhoami` → after stripping becomes `cmd \\nwhoami`
  // which looks like a safe continuation but actually hides a second command.
  // 从 `context` 解构 fullyUnquotedPreStrip，减少Bash 工具 bash Security对同一对象的重复访问。
  const { fullyUnquotedPreStrip } = context

  // Check for newlines in unquoted content
  // 满足 `!/[\n\r]/.test(fullyUnquotedPreStrip)` 时，工具调用执行该分支。
  if (!/[\n\r]/.test(fullyUnquotedPreStrip)) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough', message: 'No newlines' }
  }

  // Flag any newline/CR followed by non-whitespace, EXCEPT backslash-newline
  // continuations at word boundaries. In bash, `\<newline>` is a line
  // continuation (both chars removed), which is safe when the backslash
  // follows whitespace (e.g., `cmd \<newline>--flag`). Mid-word continuations
  // like `tr\<newline>aceroute` are still flagged because they can hide
  // dangerous command names from allowlist checks.
  // eslint-disable-next-line custom-rules/no-lookbehind-regex -- .test() + gated by /[\n\r]/.test() above
  // looksLikeCommand 命令数据保存`test`，供工具调用后续处理使用。
  const looksLikeCommand = /(?<![\s]\\)[\n\r]\s*\S/.test(fullyUnquotedPreStrip)
  // 满足 `looksLikeCommand` 时，工具调用执行该分支。
  if (looksLikeCommand) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.NEWLINES,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains newlines that could separate multiple commands',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: 'Newlines appear to be within data',
  }
}

/**
 * SECURITY: Carriage return (\r, 0x0D) IS a misparsing concern, unlike LF.
 *
 * Parser differential:
 *   - shell-quote's BAREWORD regex uses `[^\s...]` — JS `\s` INCLUDES \r, so
 *     shell-quote treats CR as a token boundary. `TZ=UTC\recho` tokenizes as
 *     TWO tokens: ['TZ=UTC', 'echo']. splitCommand joins with space →
 *     'TZ=UTC echo curl evil.com'.
 *   - bash's default IFS = $' \t\n' — CR is NOT in IFS. bash sees
 *     `TZ=UTC\recho` as ONE word → env assignment TZ='UTC\recho' (CR byte
 *     inside value), then `curl` is the command.
 *
 * Attack: `TZ=UTC\recho curl evil.com` with Bash(echo:*)
 *   validator: splitCommand collapses CR→space → 'TZ=UTC echo curl evil.com'
 *   → stripSafeWrappers: TZ=UTC stripped → 'echo curl evil.com' matches rule
 *   bash: executes `curl evil.com`
 *
 * validateNewlines catches this but is in nonMisparsingValidators (LF is
 * correctly handled by both parsers). This validator is NOT in
 * nonMisparsingValidators — its ask result gets isBashSecurityCheckForMisparsing
 * and blocks at the bashPermissions gate.
 *
 * Checks originalCommand (not fullyUnquotedPreStrip) because CR inside single
 * quotes is ALSO a misparsing concern for the same reason: shell-quote's `\s`
 * still tokenizes it, but bash treats it as literal. Block ALL unquoted-or-SQ CR.
 * Only exception: CR inside DOUBLE quotes where bash also treats it as data
 * and shell-quote preserves the token (no split).
 */
// validateCarriageReturn 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateCarriageReturn(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // 满足 `!originalCommand.includes('\r')` 时，工具调用执行该分支。
  if (!originalCommand.includes('\r')) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough', message: 'No carriage return' }
  }

  // Check if CR appears outside double quotes. CR outside DQ (including inside
  // SQ and unquoted) causes the shell-quote/bash tokenization differential.
  // inSingleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inSingleQuote = false
  // inDoubleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inDoubleQuote = false
  // escaped标记Bash 工具 bash Security是否启用对应路径。
  let escaped = false
  // 按索引扫描 `originalCommand.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < originalCommand.length; i++) {
    // c读取 `originalCommand[i]` 对应条目，后续围绕该成员继续处理。
    const c = originalCommand[i]
    // 满足 `escaped` 时，工具调用执行该分支。
    if (escaped) {
      // escaped更新为 `false`，确保Bash 工具后续读取最新状态。
      escaped = false
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 只有 `c === '\\' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (c === '\\' && !inSingleQuote) {
      // escaped更新为 `true`，确保Bash 工具后续读取最新状态。
      escaped = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 只有 `c === "'" && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (c === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 工具后续读取最新状态。
      inSingleQuote = !inSingleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 只有 `c === '"' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (c === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 只有 `c === '\r' && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (c === '\r' && !inDoubleQuote) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bash_security_check_triggered', {
        checkId: BASH_SECURITY_CHECK_IDS.NEWLINES,
        subId: 2,
      })
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'Command contains carriage return (\\r) which shell-quote and bash tokenize differently',
      }
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'CR only inside double quotes' }
}

// validateIFSInjection 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateIFSInjection(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // Detect any usage of IFS variable which could be used to bypass regex validation
  // Check for $IFS and ${...IFS...} patterns (including parameter expansions like ${IFS:0:1}, ${#IFS}, etc.)
  // Using ${[^}]*IFS to catch all parameter expansion variations with IFS
  // 满足 `/\$IFS|\$\{[^}]*IFS/.test(originalCommand)` 时，工具调用执行该分支。
  if (/\$IFS|\$\{[^}]*IFS/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.IFS_INJECTION,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains IFS variable usage which could bypass security validation',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { behavior: 'passthrough', message: 'No IFS injection detected' }
}

// Additional hardening against reading environment variables via /proc filesystem.
// Path validation typically blocks /proc access, but this provides defense-in-depth.
// Environment files in /proc can expose sensitive data like API keys and secrets.
// validateProcEnvironAccess 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateProcEnvironAccess(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // Check for /proc paths that could expose environment variables
  // This catches patterns like:
  // - /proc/self/environ
  // - /proc/1/environ
  // - /proc/*/environ (with any PID)
  // 满足 `/\/proc\/.*\/environ/.test(originalCommand)` 时，工具调用执行该分支。
  if (/\/proc\/.*\/environ/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.PROC_ENVIRON_ACCESS,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command accesses /proc/*/environ which could expose sensitive environment variables',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: 'No /proc/environ access detected',
  }
}

/**
 * Detects commands with malformed tokens (unbalanced delimiters) combined with
 * command separators. This catches potential injection patterns where ambiguous
 * shell syntax could be exploited.
 *
 * Security: This check catches the eval bypass discovered in HackerOne review.
 * When shell-quote parses ambiguous patterns like `echo {"hi":"hi;evil"}`,
 * it may produce unbalanced tokens (e.g., `{hi:"hi`). Combined with command
 * separators, this can lead to unintended command execution via eval re-parsing.
 *
 * By forcing user approval for these patterns, we ensure the user sees exactly
 * what will be executed before approving.
 */
// validateMalformedTokenInjection 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateMalformedTokenInjection(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(originalCommand)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) {
    // Parse failed - this is handled elsewhere (bashToolHasPermission checks this)
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'Parse failed, handled elsewhere',
    }
  }

  // 解析结果解析`parseResult.tokens`，供后续判断或组装使用。
  const parsed = parseResult.tokens

  // Check for command separators (;, &&, ||)
  // hasCommandSeparator 命令数据记录 `parsed.some` 是否成立，工具调用随后按该结果分支。
  const hasCommandSeparator = parsed.some(
    // entry更新为 `>`，确保Bash 工具后续读取最新状态。
    entry =>
      typeof entry === 'object' &&
      entry !== null &&
      'op' in entry &&
      (entry.op === ';' || entry.op === '&&' || entry.op === '||'),
  )

  // hasCommandSeparator 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!hasCommandSeparator) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough', message: 'No command separators' }
  }

  // Check for malformed tokens (unbalanced delimiters)
  // 满足 `hasMalformedTokens(originalCommand, parsed)` 时，工具调用执行该分支。
  if (hasMalformedTokens(originalCommand, parsed)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.MALFORMED_TOKEN_INJECTION,
      subId: 1,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains ambiguous syntax with command separators that could be misinterpreted',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: 'No malformed token injection detected',
  }
}

// validateObfuscatedFlags 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateObfuscatedFlags(context: ValidationContext): PermissionResult {
  // Block shell quoting bypass patterns used to circumvent negative lookaheads we use in our regexes to block known dangerous flags

  // 从 `context` 解构 originalCommand、baseCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand, baseCommand } = context

  // Echo is safe for obfuscated flags, BUT only for simple echo commands.
  // For compound commands (with |, &, ;), we need to check the whole command
  // because the dangerous ANSI-C quoting might be after the operator.
  // hasShellOperators 集合记录 `test` 是否成立，工具调用随后按该结果分支。
  const hasShellOperators = /[|&;]/.test(originalCommand)
  // 只有 `baseCommand === 'echo' && !hasShellOperators` 满足时，工具调用才执行该分支。
  if (baseCommand === 'echo' && !hasShellOperators) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'passthrough',
      message: 'echo command is safe and has no dangerous flags',
    }
  }

  // COMPREHENSIVE OBFUSCATION DETECTION
  // These checks catch various ways to hide flags using shell quoting

  // 1. Block ANSI-C quoting ($'...') - can encode any character via escape sequences
  // Simple pattern that matches $'...' anywhere. This correctly handles:
  // - grep '$' file => no match ($ is regex anchor inside quotes, no $'...' structure)
  // - 'test'$'-exec' => match (quote concatenation with ANSI-C)
  // - Zero-width space and other invisible chars => match
  // The pattern requires $' followed by content (can be empty) followed by closing '
  // 满足 `/\$'[^']*'/.test(originalCommand)` 时，工具调用执行该分支。
  if (/\$'[^']*'/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 5,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: 'Command contains ANSI-C quoting which can hide characters',
    }
  }

  // 2. Block locale quoting ($"...")  - can also use escape sequences
  // Same simple pattern as ANSI-C quoting above
  // 判断 /\$"[^"]*"/.test(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (/\$"[^"]*"/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 6,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: 'Command contains locale quoting which can hide characters',
    }
  }

  // 3. Block empty ANSI-C or locale quotes followed by dash
  // $''-exec or $""-exec
  // 判断 /\$['"]{2}\s*-/.test(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (/\$['"]{2}\s*-/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 9,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains empty special quotes before dash (potential bypass)',
    }
  }

  // 4. Block ANY sequence of empty quotes followed by dash
  // This catches: ''-  ""-  ''""-  ""''-  ''""''-  etc.
  // The pattern looks for one or more empty quote pairs followed by optional whitespace and dash
  // 满足 `/(?:^|\s)(?:''|"")+\s*-/.test(originalCommand)` 时，工具调用执行该分支。
  if (/(?:^|\s)(?:''|"")+\s*-/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 7,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message: 'Command contains empty quotes before dash (potential bypass)',
    }
  }

  // 4b. SECURITY: Block homogeneous empty quote pair(s) immediately adjacent
  // to a quoted dash. Patterns like `"""-f"` (empty `""` + quoted `"-f"`)
  // concatenate in bash to `-f` but slip past all the above checks:
  //   - Regex (4) above: `(?:''|"")+\s*-` matches `""` pair, then expects
  //     optional space and dash — but finds a third `"` instead. No match.
  //   - Quote-content scanner (below): Sees the first `""` pair with empty
  //     content (doesn't start with dash). The third `"` opens a new quoted
  //     region handled by the main quote-state tracker.
  //   - Quote-state tracker: `""` toggles inDoubleQuote on/off; third `"`
  //     opens it again. The `-` inside `"-f"` is INSIDE quotes → skipped.
  //   - Flag scanner: Looks for `\s` before `-`. The `-` is preceded by `"`.
  //   - fullyUnquotedContent: Both `""` and `"-f"` get stripped.
  //
  // In bash, `"""-f"` = empty string + string "-f" = `-f`. This bypass works
  // for ANY dangerous-flag check (jq -f, find -exec, fc -e) with a matching
  // prefix permission (Bash(jq:*), Bash(find:*)).
  //
  // The regex `(?:""|'')+['"]-` matches:
  //   - One or more HOMOGENEOUS empty pairs (`""` or `''`) — the concatenation
  //     point where bash joins the empty string to the flag.
  //   - Immediately followed by ANY quote char — opens the flag-quoted region.
  //   - Immediately followed by `-` — the obfuscated flag.
  //
  // POSITION-AGNOSTIC: We do NOT require word-start (`(?:^|\s)`) because
  // prefixes like `$x"""-f"` (unset/empty variable) concatenate the same way.
  // The homogeneous-empty-pair requirement filters out the `'"'"'` idiom
  // (no homogeneous empty pair — it's close, double-quoted-content, open).
  //
  // FALSE POSITIVE: Matches `echo '"""-f" text'` (pattern inside single-quoted
  // string). Extremely rare (requires echoing the literal attack). Acceptable.
  // 满足 `/(?:""|'')+['"]-/.test(originalCommand)` 时，工具调用执行该分支。
  if (/(?:""|'')+['"]-/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 10,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains empty quote pair adjacent to quoted dash (potential flag obfuscation)',
    }
  }

  // 4c. SECURITY: Also block 3+ consecutive quotes at word start even without
  // an immediate dash. Broader safety net for multi-quote obfuscation patterns
  // not enumerated above (e.g., `"""x"-f` where content between quotes shifts
  // the dash position). Legitimate commands never need `"""x"` when `"x"` works.
  // 判断 /(?:^|\s)['"]{3,}/.test(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (/(?:^|\s)['"]{3,}/.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 11,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains consecutive quote characters at word start (potential obfuscation)',
    }
  }

  // Track quote state to avoid false positives for flags inside quoted strings
  // inSingleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inSingleQuote = false
  // inDoubleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inDoubleQuote = false
  // escaped标记Bash 工具 bash Security是否启用对应路径。
  let escaped = false

  // 按索引扫描 `originalCommand.length - 1`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < originalCommand.length - 1; i++) {
    // currentChar 命名 `originalCommand[i]`，让后续代码直接表达这个值的用途。
    const currentChar = originalCommand[i]
    // nextChar读取 `originalCommand[i + 1]` 对应条目，后续围绕该成员继续处理。
    const nextChar = originalCommand[i + 1]

    // Update quote state
    // 满足 `escaped` 时，工具调用执行该分支。
    if (escaped) {
      // escaped更新为 `false`，确保Bash 工具后续读取最新状态。
      escaped = false
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // SECURITY: Only treat backslash as escape OUTSIDE single quotes. In bash,
    // `\` inside `'...'` is LITERAL. Without this guard, `'\'` desyncs the
    // quote tracker: `\` sets escaped=true, closing `'` is consumed by the
    // escaped-skip above instead of toggling inSingleQuote. Parser stays in
    // single-quote mode, and the `if (inSingleQuote || inDoubleQuote) continue`
    // at line ~1121 skips ALL subsequent flag detection for the rest of the
    // command. Example: `jq '\' "-f" evil` — bash gets `-f` arg, but desynced
    // parser thinks ` "-f" evil` is inside quotes → flag detection bypassed.
    // Defense-in-depth: hasShellQuoteSingleQuoteBug catches `'\'` patterns at
    // line ~1856 before this runs. But we fix the tracker for consistency with
    // the CORRECT implementations elsewhere in this file (hasBackslashEscaped*,
    // extractQuotedContent) which all guard with `!inSingleQuote`.
    // 只有 `currentChar === '\\' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (currentChar === '\\' && !inSingleQuote) {
      // escaped更新为 `true`，确保Bash 工具后续读取最新状态。
      escaped = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `currentChar === "'" && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (currentChar === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 工具后续读取最新状态。
      inSingleQuote = !inSingleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `currentChar === '"' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (currentChar === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Only look for flags when not inside quoted strings
    // This prevents false positives like: make test TEST="file.py -v"
    // 只有 `inSingleQuote || inDoubleQuote` 满足时，工具调用才执行该分支。
    if (inSingleQuote || inDoubleQuote) {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Look for whitespace followed by quote that contains a dash (potential flag obfuscation)
    // SECURITY: Block ANY quoted content starting with dash - err on side of safety
    // Catches: "-"exec, "-file", "--flag", '-'output, etc.
    // Users can approve manually if legitimate (e.g., find . -name "-file")
    // 工具调用在这里按实际状态进入对应分支。
    if (
      currentChar &&
      nextChar &&
      /\s/.test(currentChar) &&
      /['"`]/.test(nextChar)
    ) {
      // quoteChar保存`nextChar`，供Bash 工具 bash Security后续步骤使用。
      const quoteChar = nextChar
      // j保存`i + 2 // Start after the opening quote`，供Bash 工具 bash Security后续步骤使用。
      let j = i + 2 // Start after the opening quote
      // insideQuote保存`''`，供Bash 工具 bash Security后续步骤使用。
      let insideQuote = ''

      // Collect content inside the quote
      // while 使用 j < originalCommand.length && originalCommand[j] … 完成工具调用里的对应操作。
      while (j < originalCommand.length && originalCommand[j] !== quoteChar) {
        // Bash 工具 bash Security处理 `insideQuote += originalCommand[j]!`，完成这一小步状态转换。
        insideQuote += originalCommand[j]!
        // Bash 工具 bash Security处理 `j++`，完成这一小步状态转换。
        j++
      }

      // If we found a closing quote and the content looks like an obfuscated flag, block it.
      // Three attack patterns to catch:
      //   1. Flag name inside quotes: "--flag", "-exec", "-X" (dashes + letters inside)
      //   2. Split-quote flag: "-"exec, "--"output (dashes inside, letters continue after quote)
      //   3. Chained quotes: "-""exec" (dashes in first quote, second quote contains letters)
      // Pure-dash strings like "---" or "--" followed by whitespace/separator are separators,
      // not flags, and should not trigger this check.
      // charAfterQuote保存`originalCommand[j + 1]`，供Bash 工具 bash Security后续步骤使用。
      const charAfterQuote = originalCommand[j + 1]
      // Inside double quotes, $VAR and `cmd` expand at runtime, so "-$VAR" can
      // become -exec. Blocking $ and ` here over-blocks single-quoted literals
      // like grep '-$' (where $ is literal), but main's startsWith('-') already
      // blocked those — this restores status quo, not a new false positive.
      // Brace expansion ({) does NOT happen inside quotes, so { is not needed here.
      // hasFlagCharsInside记录 `test` 是否成立，工具调用随后按该结果分支。
      const hasFlagCharsInside = /^-+[a-zA-Z0-9$`]/.test(insideQuote)
      // Characters that can continue a flag after a closing quote. This catches:
      //   a-zA-Z0-9: "-"exec → -exec (direct concatenation)
      //   \\:        "-"\exec → -exec (backslash escape is stripped)
      //   -:         "-"-output → --output (extra dashes)
      //   {:         "-"{exec,delete} → -exec -delete (brace expansion)
      //   $:         "-"$VAR → -exec when VAR=exec (variable expansion)
      //   `:         "-"`echo exec` → -exec (command substitution)
      // Note: glob chars (*?[) are omitted — they require attacker-controlled
      // filenames in CWD to exploit, and blocking them would break patterns
      // like `ls -- "-"*` for listing files that start with dash.
      // FLAG_CONTINUATION_CHARS 集合读取 `/[a-zA-Z0-9\\${`-]/` 对应条目，后续围绕该成员继续处理。
      const FLAG_CONTINUATION_CHARS = /[a-zA-Z0-9\\${`-]/
      const hasFlagCharsContinuing =
        /^-+$/.test(insideQuote) &&
        charAfterQuote !== undefined &&
        FLAG_CONTINUATION_CHARS.test(charAfterQuote)
      // Handle adjacent quote chaining: "-""exec" or "-""-"exec or """-"exec concatenates
      // to -exec in shell. Follow the chain of adjacent quoted segments until
      // we find one containing an alphanumeric char or hit a non-quote boundary.
      // Also handles empty prefix quotes: """-"exec where "" is followed by "-"exec
      // The combined segments form a flag if they contain dash(es) followed by alphanumerics.
      const hasFlagCharsInNextQuote =
        // Trigger when: first segment is only dashes OR empty (could be prefix for flag)
        (insideQuote === '' || /^-+$/.test(insideQuote)) &&
        charAfterQuote !== undefined &&
        /['"`]/.test(charAfterQuote) &&
        // 这个回调绑定到 (() => {，负责工具调用在该局部场景下的响应。
        (() => {
          // pos 集合保存`charAfterQuote`，供工具调用后续处理使用。
          let pos = j + 1 // Start at charAfterQuote (an opening quote)
          // combinedContent保存`insideQuote // Track what the shell will see`，供后续判断或组装使用。
          let combinedContent = insideQuote // Track what the shell will see
          // 调用 while，触发工具调用此处需要的副作用。
          while (
            pos < originalCommand.length &&
            /['"`]/.test(originalCommand[pos]!)
          ) {
            // segQuote保存`originalCommand[pos]!`，供Bash 工具 bash Security后续步骤使用。
            const segQuote = originalCommand[pos]!
            // end保存`pos + 1`，供Bash 工具 bash Security后续步骤使用。
            let end = pos + 1
            // while执行工具调用在此处需要的副作用或外部交互。
            while (
              end < originalCommand.length &&
              originalCommand[end] !== segQuote
            ) {
              // Bash 工具 bash Security处理 `end++`，完成这一小步状态转换。
              end++
            }
            // segment格式化`originalCommand.slice`，供工具调用后续处理使用。
            const segment = originalCommand.slice(pos + 1, end)
            // Bash 工具 bash Security处理 `combinedContent += segment`，完成这一小步状态转换。
            combinedContent += segment

            // Check if combined content so far forms a flag pattern.
            // Include $ and ` for in-quote expansion: "-""$VAR" → -exec
            // 判断 /^-+[a-zA-Z0-9$`]/.test(combinedContent)，将工具调用分流到只适用于该条件的处理路径。
            if (/^-+[a-zA-Z0-9$`]/.test(combinedContent)) return true

            // If this segment has alphanumeric/expansion and we already have dashes,
            // it's a flag. Catches "-""$*" where segment='$*' has no alnum but
            // expands to positional params at runtime.
            // Guard against segment.length === 0: slice(0, -0) → slice(0, 0) → ''.
            const priorContent =
              segment.length > 0
                ? combinedContent.slice(0, -segment.length)
                : combinedContent
            if (/^-+$/.test(priorContent)) {
              if (/[a-zA-Z0-9$`]/.test(segment)) return true
            }

            if (end >= originalCommand.length) break // Unclosed quote
            pos = end + 1 // Move past closing quote to check next segment
          }
          // Also check the unquoted char at the end of the chain
          if (
            pos < originalCommand.length &&
            FLAG_CONTINUATION_CHARS.test(originalCommand[pos]!)
          ) {
            // If we have dashes in combined content, the trailing char completes a flag
            if (/^-+$/.test(combinedContent) || combinedContent === '') {
              // Check if we're about to form a flag with the following content
              const nextChar = originalCommand[pos]!
              if (nextChar === '-') {
                // More dashes, could still form a flag
                return true
              }
              if (/[a-zA-Z0-9\\${`]/.test(nextChar) && combinedContent !== '') {
                // We have dashes and now alphanumeric/expansion follows
                return true
              }
            }
            // Original check for dashes followed by alphanumeric
            if (/^-/.test(combinedContent)) {
              return true
            }
          }
          return false
        })()
      if (
        j < originalCommand.length &&
        originalCommand[j] === quoteChar &&
        (hasFlagCharsInside ||
          hasFlagCharsContinuing ||
          hasFlagCharsInNextQuote)
      ) {
        logEvent('tengu_bash_security_check_triggered', {
          checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
          subId: 4,
        })
        return {
          behavior: 'ask',
          message: 'Command contains quoted characters in flag names',
        }
      }
    }

    // Look for whitespace followed by dash - this starts a flag
    if (currentChar && nextChar && /\s/.test(currentChar) && nextChar === '-') {
      let j = i + 1 // Start at the dash
      let flagContent = ''

      // Collect flag content
      while (j < originalCommand.length) {
        const flagChar = originalCommand[j]
        if (!flagChar) break

        // End flag content once we hit whitespace or an equals sign
        if (/[\s=]/.test(flagChar)) {
          break
        }
        // End flag collection if we hit quote followed by non-flag character. This is needed to handle cases like -d"," which should be parsed as just -d
        if (/['"`]/.test(flagChar)) {
          // Special case for cut -d flag: the delimiter value can be quoted
          // Example: cut -d'"' should parse as flag name: -d, value: '"'
          // Note: We only apply this exception to cut -d specifically to avoid bypasses.
          // Without this restriction, a command like `find -e"xec"` could be parsed as
          // flag name: -e, bypassing our blocklist for -exec. By restricting to cut -d,
          // we allow the legitimate use case while preventing obfuscation attacks on other
          // commands where quoted flag values could hide dangerous flag names.
          // 工具调用在这里按实际状态进入对应分支。
          if (
            baseCommand === 'cut' &&
            flagContent === '-d' &&
            /['"`]/.test(flagChar)
          ) {
            // This is cut -d followed by a quoted delimiter - flagContent is already '-d'
            // 结束这个分支或循环，避免工具调用继续落入后续路径。
            break
          }

          // Look ahead to see what follows the quote
          // 满足 `j + 1 < originalCommand.length` 时，工具调用执行该分支。
          if (j + 1 < originalCommand.length) {
            // nextFlagChar保存`originalCommand[j + 1]`，供Bash 工具 bash Security后续步骤使用。
            const nextFlagChar = originalCommand[j + 1]
            // 判断 nextFlagChar && !/[a-zA-Z0-9_'"-]/.test(nextFlagChar)，将工具调用分流到只适用于该条件的处理路径。
            if (nextFlagChar && !/[a-zA-Z0-9_'"-]/.test(nextFlagChar)) {
              // Quote followed by something that is clearly not part of a flag, end the parsing
              // 结束这个分支或循环，避免工具调用继续落入后续路径。
              break
            }
          }
        }
        // Bash 工具 bash Security处理 `flagContent += flagChar`，完成这一小步状态转换。
        flagContent += flagChar
        // Bash 工具 bash Security处理 `j++`，完成这一小步状态转换。
        j++
      }

      // 判断 flagContent.includes('"') || flagContent.includes("'")，将工具调用分流到只适用于该条件的处理路径。
      if (flagContent.includes('"') || flagContent.includes("'")) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bash_security_check_triggered', {
          checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
          subId: 1,
        })
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'ask',
          message: 'Command contains quoted characters in flag names',
        }
      }
    }
  }

  // Also handle flags that start with quotes: "--"output, '-'-output, etc.
  // Use fullyUnquotedContent to avoid false positives from legitimate quoted content like echo "---"
  // 判断 /\s['"`]-/.test(context.fullyUnquotedContent)，将工具调用分流到只适用于该条件的处理路径。
  if (/\s['"`]-/.test(context.fullyUnquotedContent)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 2,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: 'Command contains quoted characters in flag names',
    }
  }

  // Also handles cases like ""--output
  // Use fullyUnquotedContent to avoid false positives from legitimate quoted content
  // 判断 /['"`]{2}-/.test(context.fullyUnquotedContent)，将工具调用分流到只适用于该条件的处理路径。
  if (/['"`]{2}-/.test(context.fullyUnquotedContent)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.OBFUSCATED_FLAGS,
      subId: 3,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: 'Command contains quoted characters in flag names',
    }
  }

  // 返回 { behavior: 'passthrough', message: 'No obfuscated flags detected' }，把工具调用这个分支的结果交还调用方。
  return { behavior: 'passthrough', message: 'No obfuscated flags detected' }
}

/**
 * Detects backslash-escaped whitespace characters (space, tab) outside of quotes.
 *
 * In bash, `echo\ test` is a single token (command named "echo test"), but
 * shell-quote decodes the escape and produces `echo test` (two separate tokens).
 * This discrepancy allows path traversal attacks like:
 *   echo\ test/../../../usr/bin/touch /tmp/file
 * which the parser sees as `echo test/.../touch /tmp/file` (an echo command)
 * but bash resolves as `/usr/bin/touch /tmp/file` (via directory "echo test").
 */
// hasBackslashEscapedWhitespace 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function hasBackslashEscapedWhitespace(command: string): boolean {
  // inSingleQuote记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let inSingleQuote = false
  // inDoubleQuote记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let inDoubleQuote = false

  // 遍历 let i = 0; i < command.length; i++，让工具调用逐项完成同一类处理。
  for (let i = 0; i < command.length; i++) {
    // char保存`command[i]`，供Bash 工具 bash Security后续步骤使用。
    const char = command[i]

    // 只有 `char === '\\' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '\\' && !inSingleQuote) {
      // inDoubleQuote缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!inDoubleQuote) {
        // nextChar保存`command[i + 1]`，供Bash 工具 bash Security后续步骤使用。
        const nextChar = command[i + 1]
        // `nextChar` 命中特定值 `' ' || nextChar === '\t'` 时，进入工具调用对应处理。
        if (nextChar === ' ' || nextChar === '\t') {
          // 返回 true，把工具调用这个分支的结果交还调用方。
          return true
        }
      }
      // Skip the escaped character (both outside quotes and inside double quotes,
      // where \\, \", \$, \` are valid escape sequences)
      // Bash 工具 bash Security处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === '"' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === "'" && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (char === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 工具后续读取最新状态。
      inSingleQuote = !inSingleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
  }

  // 返回 false，把工具调用这个分支的结果交还调用方。
  return false
}

// validateBackslashEscapedWhitespace 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateBackslashEscapedWhitespace(
  context: ValidationContext,
): PermissionResult {
  // 判断 hasBackslashEscapedWhitespace(context.originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (hasBackslashEscapedWhitespace(context.originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.BACKSLASH_ESCAPED_WHITESPACE,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains backslash-escaped whitespace that could alter command parsing',
    }
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'No backslash-escaped whitespace',
  }
}

/**
 * Detects a backslash immediately preceding a shell operator outside of quotes.
 *
 * SECURITY: splitCommand normalizes `\;` to a bare `;` in its output string.
 * When downstream code (checkReadOnlyConstraints, checkPathConstraints, etc.)
 * re-parses that normalized string, the bare `;` is seen as an operator and
 * causes a false split. This enables arbitrary file read bypassing path checks:
 *
 *   cat safe.txt \; echo ~/.ssh/id_rsa
 *
 * In bash: ONE cat command reading safe.txt, ;, echo, ~/.ssh/id_rsa as files.
 * After splitCommand normalizes: "cat safe.txt ; echo ~/.ssh/id_rsa"
 * Nested re-parse: ["cat safe.txt", "echo ~/.ssh/id_rsa"] — both segments
 * pass isCommandReadOnly, sensitive path hidden in echo segment is never
 * validated by path constraints. Auto-allowed. Private key leaked.
 *
 * This check flags any \<operator> regardless of backslash parity. Even counts
 * (\\;) are dangerous in bash (\\ → \, ; separates). Odd counts (\;) are safe
 * in bash but trigger the double-parse bug above. Both must be flagged.
 *
 * Known false positive: `find . -exec cmd {} \;` — users will be prompted once.
 *
 * Note: `(` and `)` are NOT in this set — splitCommand preserves `\(` and `\)`
 * in its output (round-trip safe), so they don't trigger the double-parse bug.
 * This allows `find . \( -name x -o -name y \)` to pass without false positives.
 */
// SHELL_OPERATORS 集合保存`Set`，供工具调用后续处理使用。
const SHELL_OPERATORS = new Set([';', '|', '&', '<', '>'])

// hasBackslashEscapedOperator 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasBackslashEscapedOperator(command: string): boolean {
  // inSingleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inSingleQuote = false
  // inDoubleQuote标记Bash 工具 bash Security是否启用对应路径。
  let inDoubleQuote = false

  // 按索引扫描 `command.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < command.length; i++) {
    // char读取 `command[i]` 对应条目，后续围绕该成员继续处理。
    const char = command[i]

    // SECURITY: Handle backslash FIRST, before quote toggles. In bash, inside
    // double quotes, `\"` is an escape sequence producing a literal `"` — it
    // does NOT close the quote. If we process quote toggles first, `\"` inside
    // `"..."` desyncs the tracker:
    //   - `\` is ignored (gated by !inDoubleQuote)
    //   - `"` toggles inDoubleQuote to FALSE (wrong — bash says still inside)
    //   - next `"` (the real closing quote) toggles BACK to TRUE — locked desync
    //   - subsequent `\;` is missed because !inDoubleQuote is false
    // Exploit: `tac "x\"y" \; echo ~/.ssh/id_rsa` — bash runs ONE tac reading
    // all args as files (leaking id_rsa), but desynced tracker misses `\;` and
    // splitCommand's double-parse normalization "sees" two safe commands.
    //
    // Fix structure matches hasBackslashEscapedWhitespace (which was correctly
    // fixed for this in commit prior to d000dfe84e): backslash check first,
    // gated only by !inSingleQuote (since backslash IS literal inside '...'),
    // unconditional i++ to skip the escaped char even inside double quotes.
    // 只有 `char === '\\' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '\\' && !inSingleQuote) {
      // Only flag \<operator> when OUTSIDE double quotes (inside double quotes,
      // operators like ;|&<> are already not special, so \; is harmless there).
      // inDoubleQuote缺失时直接走兜底路径，避免工具调用使用无效输入。
      if (!inDoubleQuote) {
        // nextChar 命名 `command[i + 1]`，让后续代码直接表达这个值的用途。
        const nextChar = command[i + 1]
        // 只有 `nextChar && SHELL_OPERATORS.has(nextChar)` 满足时，工具调用才执行该分支。
        if (nextChar && SHELL_OPERATORS.has(nextChar)) {
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        }
      }
      // Skip the escaped character unconditionally. Inside double quotes, this
      // correctly consumes backslash pairs: `"x\\"` → pos 6 (`\`) skips pos 7
      // (`\`), then pos 8 (`"`) toggles inDoubleQuote off correctly. Without
      // unconditional skip, pos 7 would see `\`, see pos 8 (`"`) as nextChar,
      // skip it, and the closing quote would NEVER toggle inDoubleQuote —
      // permanently desyncing and missing subsequent `\;` outside quotes.
      // Exploit: `cat "x\\" \; echo /etc/passwd` — bash reads /etc/passwd.
      //
      // This correctly handles backslash parity: odd-count `\;` (1, 3, 5...)
      // is flagged (the unpaired `\` before `;` is detected). Even-count `\\;`
      // (2, 4...) is NOT flagged, which is CORRECT — bash treats `\\` as
      // literal `\` and `;` as a separator, so splitCommand handles it
      // normally (no double-parse bug). This matches
      // hasBackslashEscapedWhitespace line ~1340.
      // Bash 工具 bash Security在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Quote toggles come AFTER backslash handling (backslash already skipped
    // any escaped quote char, so these toggles only fire on unescaped quotes).
    // 只有 `char === "'" && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (char === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 工具后续读取最新状态。
      inSingleQuote = !inSingleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 只有 `char === '"' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// validateBackslashEscapedOperators 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateBackslashEscapedOperators(
  context: ValidationContext,
): PermissionResult {
  // Tree-sitter path: if tree-sitter confirms no actual operator nodes exist
  // in the AST, then any \; is just an escaped character in a word argument
  // (e.g., `find . -exec cmd {} \;`). Skip the expensive regex check.
  // 只有 `context.treeSitter && !context.treeSitter.hasActu` 满足时，工具调用才执行该分支。
  if (context.treeSitter && !context.treeSitter.hasActualOperatorNodes) {
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return { behavior: 'passthrough', message: 'No operator nodes in AST' }
  }

  // 满足 `hasBackslashEscapedOperator(context.originalCommand)` 时，工具调用执行该分支。
  if (hasBackslashEscapedOperator(context.originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.BACKSLASH_ESCAPED_OPERATORS,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command contains a backslash before a shell operator (;, |, &, <, >) which can hide command structure',
    }
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: 'No backslash-escaped operators',
  }
}

/**
 * Checks if a character at position `pos` in `content` is escaped by counting
 * consecutive backslashes before it. An odd number means it's escaped.
 */
// isEscapedAtPosition 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEscapedAtPosition(content: string, pos: number): boolean {
  // backslashCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let backslashCount = 0
  // i 命名 `pos - 1`，让后续代码直接表达这个值的用途。
  let i = pos - 1
  // while 使用 i >= 0 && content[i] === '\\' 完成工具调用里的对应操作。
  while (i >= 0 && content[i] === '\\') {
    // Bash 工具 bash Security在这里处理 `backslashCount++`，完成这一小步状态转换。
    backslashCount++
    // Bash 工具 bash Security在这里处理 `i--`，完成这一小步状态转换。
    i--
  }
  // 返回 `backslashCount % 2 === 1`，作为工具调用这次计算的结果。
  return backslashCount % 2 === 1
}

/**
 * Detects unquoted brace expansion syntax that Bash expands but shell-quote/tree-sitter
 * treat as literal strings. This parsing discrepancy allows permission bypass:
 *   git ls-remote {--upload-pack="touch /tmp/test",test}
 * Parser sees one literal arg, but Bash expands to: --upload-pack="touch /tmp/test" test
 *
 * Brace expansion has two forms:
 *   1. Comma-separated: {a,b,c} → a b c
 *   2. Sequence: {1..5} → 1 2 3 4 5
 *
 * Both single and double quotes suppress brace expansion in Bash, so we use
 * fullyUnquotedContent which has both quote types stripped.
 * Backslash-escaped braces (\{, \}) also suppress expansion.
 */
// validateBraceExpansion 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateBraceExpansion(context: ValidationContext): PermissionResult {
  // Use pre-strip content to avoid false negatives from stripSafeRedirections
  // creating backslash adjacencies (e.g., `\>/dev/null{a,b}` → `\{a,b}` after
  // stripping, making isEscapedAtPosition think the brace is escaped).
  // 文本内容 命名 `context.fullyUnquotedPreStrip`，让后续代码直接表达这个值的用途。
  const content = context.fullyUnquotedPreStrip

  // SECURITY: Check for MISMATCHED brace counts in fullyUnquoted content.
  // A mismatch indicates that quoted braces (e.g., `'{'` or `"{"`) were
  // stripped by extractQuotedContent, leaving unbalanced braces in the content
  // we analyze. Our depth-matching algorithm below assumes balanced braces —
  // with a mismatch, it closes at the WRONG position, missing commas that
  // bash's algorithm WOULD find.
  //
  // Exploit: `git diff {@'{'0},--output=/tmp/pwned}`
  //   - Original: 2 `{`, 2 `}` (quoted `'{'` counts as content, not operator)
  //   - fullyUnquoted: `git diff {@0},--output=/tmp/pwned}` — 1 `{`, 2 `}`!
  //   - Our depth-matcher: closes at first `}` (after `0`), inner=`@0`, no `,`
  //   - Bash (on original): quoted `{` is content; first unquoted `}` has no
  //     `,` yet → bash treats as literal content, keeps scanning → finds `,`
  //     → final `}` closes → expands to `@{0} --output=/tmp/pwned`
  //   - git writes diff to /tmp/pwned. ARBITRARY FILE WRITE, ZERO PERMISSIONS.
  //
  // We count ONLY unescaped braces (backslash-escaped braces are literal in
  // bash). If counts mismatch AND at least one unescaped `{` exists, block —
  // our depth-matching cannot be trusted on this content.
  // unescapedOpenBraces 集合保存`0`，供Bash 工具 bash Security后续判断或输出使用。
  let unescapedOpenBraces = 0
  // unescapedCloseBraces 集合保存`0`，供后续判断或组装使用。
  let unescapedCloseBraces = 0
  // 按索引扫描 `content.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < content.length; i++) {
    // 只有 `content[i] === '{' && !isEscapedAtPosition(content, i)` 满足时，工具调用才执行该分支。
    if (content[i] === '{' && !isEscapedAtPosition(content, i)) {
      // Bash 工具 bash Security在这里处理 `unescapedOpenBraces++`，完成这一小步状态转换。
      unescapedOpenBraces++
    // Bash 工具 bash Security在这里处理 `} else if (content[i] === '}' && !isEscapedAtPosition(content, i)) {`，完成这一小步状态转换。
    } else if (content[i] === '}' && !isEscapedAtPosition(content, i)) {
      // Bash 工具 bash Security在这里处理 `unescapedCloseBraces++`，完成这一小步状态转换。
      unescapedCloseBraces++
    }
  }
  // Only block when CLOSE count EXCEEDS open count — this is the specific
  // attack signature. More `}` than `{` means a quoted `{` was stripped
  // (bash saw it as content, we see extra `}` unaccounted for). The inverse
  // (more `{` than `}`) is usually legitimate unclosed/escaped braces like
  // `{foo` or `{a,b\}` where bash doesn't expand anyway.
  // 只有 `unescapedOpenBraces > 0 && unescapedCloseBraces >` 满足时，工具调用才执行该分支。
  if (unescapedOpenBraces > 0 && unescapedCloseBraces > unescapedOpenBraces) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.BRACE_EXPANSION,
      subId: 2,
    })
    // 返回结构化结果，集中表达工具调用已经整理出的状态。
    return {
      behavior: 'ask',
      message:
        'Command has excess closing braces after quote stripping, indicating possible brace expansion obfuscation',
    }
  }

  // SECURITY: Additionally, check the ORIGINAL command (before quote stripping)
  // for `'{'` or `"{"` INSIDE an unquoted brace context — this is the specific
  // attack primitive. A quoted brace inside an outer unquoted `{...}` is
  // essentially always an obfuscation attempt; legitimate commands don't nest
  // quoted braces inside brace expansion (awk/find patterns are fully quoted,
  // like `awk '{print $1}'` where the OUTER brace is inside quotes too).
  //
  // This catches the attack even if an attacker crafts a payload with balanced
  // stripped braces (defense-in-depth). We use a simple heuristic: if the
  // original command has `'{'` or `'}'` or `"{"` or `"}"` (quoted single brace)
  // AND also has an unquoted `{`, that's suspicious.
  // 满足 `unescapedOpenBraces > 0` 时，工具调用执行该分支。
  if (unescapedOpenBraces > 0) {
    // orig保存`context.originalCommand`，供后续判断或组装使用。
    const orig = context.originalCommand
    // Look for quoted single-brace patterns: '{', '}', "{",  "}"
    // These are the attack primitive — a brace char wrapped in quotes.
    // 满足 `/['"][{}]['"]/.test(orig)` 时，工具调用执行该分支。
    if (/['"][{}]['"]/.test(orig)) {
      // 记录工具调用运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_bash_security_check_triggered', {
        checkId: BASH_SECURITY_CHECK_IDS.BRACE_EXPANSION,
        subId: 3,
      })
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'ask',
        message:
          'Command contains quoted brace character inside brace context (potential brace expansion obfuscation)',
      }
    }
  }

  // Scan for unescaped `{` characters, then check if they form brace expansion.
  // We use a manual scan rather than a simple regex lookbehind because
  // lookbehinds can't handle double-escaped backslashes (\\{ is unescaped `{`).
  // 遍历 let i = 0; i < content.length; i++，让工具调用逐项完成同一类处理。
  for (let i = 0; i < content.length; i++) {
    // 判断 content[i] !== '{'，将工具调用分流到只适用于该条件的处理路径。
    if (content[i] !== '{') continue
    // 判断 isEscapedAtPosition(content, i)，将工具调用分流到只适用于该条件的处理路径。
    if (isEscapedAtPosition(content, i)) continue

    // Find matching unescaped `}` by tracking nesting depth.
    // Previous approach broke on nested `{`, missing commas between the outer
    // `{` and the nested one (e.g., `{--upload-pack="evil",{test}}`).
    // depth保存`1`，供Bash 工具 bash Security后续步骤使用。
    let depth = 1
    // matchingClose保存`-1`，供Bash 工具 bash Security后续步骤使用。
    let matchingClose = -1
    // 遍历 let j = i + 1; j < content.length; j++，让工具调用逐项完成同一类处理。
    for (let j = i + 1; j < content.length; j++) {
      // ch保存`content[j]`，供Bash 工具 bash Security后续步骤使用。
      const ch = content[j]
      // 判断 ch === '{' && !isEscapedAtPosition(content, j)，将工具调用分流到只适用于该条件的处理路径。
      if (ch === '{' && !isEscapedAtPosition(content, j)) {
        // Bash 工具 bash Security处理 `depth++`，完成这一小步状态转换。
        depth++
      // `ch === '}' && !isEscapedAtPosition(content, j)` 成立时，Bash 工具 bash Security切换到这个 else-if 分支。
      } else if (ch === '}' && !isEscapedAtPosition(content, j)) {
        // Bash 工具 bash Security处理 `depth--`，完成这一小步状态转换。
        depth--
        // 满足 `depth === 0` 时，工具调用执行该分支。
        if (depth === 0) {
          // matchingClose更新为 `j`，确保Bash 工具后续读取最新状态。
          matchingClose = j
          // 结束这个分支或循环，避免工具调用继续落入后续路径。
          break
        }
      }
    }

    // 判断 matchingClose === -1，将工具调用分流到只适用于该条件的处理路径。
    if (matchingClose === -1) continue

    // Check for `,` or `..` at the outermost nesting level between this
    // `{` and its matching `}`. Only depth-0 triggers matter — bash splits
    // brace expansion at outer-level commas/sequences.
    // innerDepth保存`0`，供Bash 工具 bash Security后续步骤使用。
    let innerDepth = 0
    // 遍历 let k = i + 1; k < matchingClose; k++，让工具调用逐项完成同一类处理。
    for (let k = i + 1; k < matchingClose; k++) {
      // ch保存`content[k]`，供Bash 工具 bash Security后续步骤使用。
      const ch = content[k]
      // 判断 ch === '{' && !isEscapedAtPosition(content, k)，将工具调用分流到只适用于该条件的处理路径。
      if (ch === '{' && !isEscapedAtPosition(content, k)) {
        // Bash 工具 bash Security处理 `innerDepth++`，完成这一小步状态转换。
        innerDepth++
      // `ch === '}' && !isEscapedAtPosition(content, k)` 成立时，Bash 工具 bash Security切换到这个 else-if 分支。
      } else if (ch === '}' && !isEscapedAtPosition(content, k)) {
        // Bash 工具 bash Security处理 `innerDepth--`，完成这一小步状态转换。
        innerDepth--
      // `innerDepth === 0` 成立时，Bash 工具 bash Security切换到这个 else-if 分支。
      } else if (innerDepth === 0) {
        // 工具调用在这里按实际状态进入对应分支。
        if (
          ch === ',' ||
          (ch === '.' && k + 1 < matchingClose && content[k + 1] === '.')
        ) {
          // 记录工具调用运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_bash_security_check_triggered', {
            checkId: BASH_SECURITY_CHECK_IDS.BRACE_EXPANSION,
            subId: 1,
          })
          // 返回 {，把工具调用这个分支的结果交还调用方。
          return {
            behavior: 'ask',
            message:
              'Command contains brace expansion that could alter command parsing',
          }
        }
      }
    }
    // No expansion at this level — don't skip past; inner pairs will be
    // caught by subsequent iterations of the outer loop.
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'No brace expansion detected',
  }
}

// Matches Unicode whitespace characters that shell-quote treats as word
// separators but bash treats as literal word content. While this differential
// is defense-favorable (shell-quote over-splits), blocking these proactively
// prevents future edge cases.
// eslint-disable-next-line no-misleading-character-class
// UNICODE_WS_RE 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const UNICODE_WS_RE =
  /[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/

// validateUnicodeWhitespace 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateUnicodeWhitespace(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context
  // 判断 UNICODE_WS_RE.test(originalCommand)，将工具调用分流到只适用于该条件的处理路径。
  if (UNICODE_WS_RE.test(originalCommand)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.UNICODE_WHITESPACE,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains Unicode whitespace characters that could cause parsing inconsistencies',
    }
  }
  // 返回 { behavior: 'passthrough', message: 'No Unicode whitespace' }，把工具调用这个分支的结果交还调用方。
  return { behavior: 'passthrough', message: 'No Unicode whitespace' }
}

// validateMidWordHash 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateMidWordHash(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 unquotedKeepQuoteChars，减少Bash 工具 bash Security对同一对象的重复访问。
  const { unquotedKeepQuoteChars } = context
  // Match # preceded by a non-whitespace character (mid-word hash).
  // shell-quote treats mid-word # as comment-start but bash treats it as a
  // literal character, creating a parser differential.
  //
  // Uses unquotedKeepQuoteChars (which preserves quote delimiters but strips
  // quoted content) to catch quote-adjacent # like 'x'# — fullyUnquotedPreStrip
  // would strip both quotes and content, turning 'x'# into just # (word-start).
  //
  // SECURITY: Also check the CONTINUATION-JOINED version. The context is built
  // from the original command (pre-continuation-join). For `foo\<NL>#bar`,
  // pre-join the `#` is preceded by `\n` (whitespace → `/\S#/` doesn't match),
  // but post-join it's preceded by `o` (non-whitespace → matches). shell-quote
  // operates on the post-join text (line continuations are joined in
  // splitCommand), so the parser differential manifests on the joined text.
  // While not directly exploitable (the `#...` fragment still prompts as its
  // own subcommand), this is a defense-in-depth gap — shell-quote would drop
  // post-`#` content from path extraction.
  //
  // Exclude ${# which is bash string-length syntax (e.g., ${#var}).
  // Note: the lookbehind must be placed immediately before # (not before \S)
  // so that it checks the correct 2-char window.
  // joined格式化`unquotedKeepQuoteChars.replace`，供工具调用后续处理使用。
  const joined = unquotedKeepQuoteChars.replace(/\\+\n/g, match => {
    // backslashCount统计`match.length - 1`，供Bash 工具 bash Security后续步骤使用。
    const backslashCount = match.length - 1
    // 返回 backslashCount % 2 === 1 ? '\\'.repeat(backslashCount - 1) : match，把工具调用这个分支的结果交还调用方。
    return backslashCount % 2 === 1 ? '\\'.repeat(backslashCount - 1) : match
  })
  // 工具调用在这里按实际状态进入对应分支。
  if (
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- .test() with atom search: fast when # absent
    /\S(?<!\$\{)#/.test(unquotedKeepQuoteChars) ||
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- same as above
    /\S(?<!\$\{)#/.test(joined)
  ) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.MID_WORD_HASH,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains mid-word # which is parsed differently by shell-quote vs bash',
    }
  }
  // 返回 { behavior: 'passthrough', message: 'No mid-word hash' }，把工具调用这个分支的结果交还调用方。
  return { behavior: 'passthrough', message: 'No mid-word hash' }
}

/**
 * Detects when a `#` comment contains quote characters that would desync
 * downstream quote trackers (like extractQuotedContent).
 *
 * In bash, everything after an unquoted `#` on a line is a comment — quote
 * characters inside the comment are literal text, not quote toggles. But our
 * quote-tracking functions don't handle comments, so a `'` or `"` after `#`
 * toggles their quote state. Attackers can craft `# ' "` sequences that
 * precisely desync the tracker, causing subsequent content (on following
 * lines) to appear "inside quotes" when it's actually unquoted in bash.
 *
 * Example attack:
 *   echo "it's" # ' " <<'MARKER'\n
 *   rm -rf /\n
 *   MARKER
 * In bash: `#` starts a comment, `rm -rf /` executes on line 2.
 * In extractQuotedContent: the `'` at position 14 (after #) opens a single
 * quote, and the `'` before MARKER closes it. But the `'` after MARKER opens
 * ANOTHER single quote, swallowing the newline and `rm -rf /`, so
 * validateNewlines sees no unquoted newlines.
 *
 * Defense: If we see an unquoted `#` followed by any quote character on the
 * same line, treat it as a misparsing concern. Legitimate commands rarely
 * have quote characters in their comments (and if they do, the user can
 * approve manually).
 */
// validateCommentQuoteDesync 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateCommentQuoteDesync(
  context: ValidationContext,
): PermissionResult {
  // Tree-sitter path: tree-sitter correctly identifies comment nodes and
  // quoted content. The desync concern is about regex quote tracking being
  // confused by quote characters inside comments. When tree-sitter provides
  // the quote context, this desync cannot happen — the AST is authoritative
  // regardless of whether the command contains a comment.
  // 满足 `context.treeSitter` 时，工具调用执行该分支。
  if (context.treeSitter) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'passthrough',
      message: 'Tree-sitter quote context is authoritative',
    }
  }

  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // Track quote state character-by-character using the same (correct) logic
  // as extractQuotedContent: single quotes don't toggle inside double quotes.
  // When we encounter an unquoted `#`, check if the rest of the line (until
  // newline) contains any quote characters.
  // inSingleQuote记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let inSingleQuote = false
  // inDoubleQuote记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let inDoubleQuote = false
  // escaped记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let escaped = false

  // 遍历 let i = 0; i < originalCommand.length; i++，让工具调用逐项完成同一类处理。
  for (let i = 0; i < originalCommand.length; i++) {
    // char保存`originalCommand[i]`，供Bash 工具 bash Security后续步骤使用。
    const char = originalCommand[i]

    // 满足 `escaped` 时，工具调用执行该分支。
    if (escaped) {
      // escaped更新为 `false`，确保Bash 工具后续读取最新状态。
      escaped = false
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 满足 `inSingleQuote` 时，工具调用执行该分支。
    if (inSingleQuote) {
      // 判断 char === "'"，将工具调用分流到只适用于该条件的处理路径。
      if (char === "'") inSingleQuote = false
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // `char` 命中特定值 `'\\'` 时，进入工具调用对应处理。
    if (char === '\\') {
      // escaped更新为 `true`，确保Bash 工具后续读取最新状态。
      escaped = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 满足 `inDoubleQuote` 时，工具调用执行该分支。
    if (inDoubleQuote) {
      // 判断 char === '"'，将工具调用分流到只适用于该条件的处理路径。
      if (char === '"') inDoubleQuote = false
      // Single quotes inside double quotes are literal — no toggle
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // `char` 命中特定值 `"'"` 时，进入工具调用对应处理。
    if (char === "'") {
      // inSingleQuote更新为 `true`，确保Bash 工具后续读取最新状态。
      inSingleQuote = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // `char` 命中特定值 `'"'` 时，进入工具调用对应处理。
    if (char === '"') {
      // inDoubleQuote更新为 `true`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Unquoted `#` — in bash, this starts a comment. Check if the rest of
    // the line contains quote characters that would desync other trackers.
    // `char` 命中特定值 `'#'` 时，进入工具调用对应处理。
    if (char === '#') {
      // 结束行号保存`originalCommand.indexOf`，供工具调用后续处理使用。
      const lineEnd = originalCommand.indexOf('\n', i)
      // commentText格式化`originalCommand.slice`，供工具调用后续处理使用。
      const commentText = originalCommand.slice(
        i + 1,
        lineEnd === -1 ? originalCommand.length : lineEnd,
      )
      // 判断 /['"]/.test(commentText)，将工具调用分流到只适用于该条件的处理路径。
      if (/['"]/.test(commentText)) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bash_security_check_triggered', {
          checkId: BASH_SECURITY_CHECK_IDS.COMMENT_QUOTE_DESYNC,
        })
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'ask',
          message:
            'Command contains quote characters inside a # comment which can desync quote tracking',
        }
      }
      // Skip to end of line (rest is comment)
      // 判断 lineEnd === -1，将工具调用分流到只适用于该条件的处理路径。
      if (lineEnd === -1) break
      // i更新为 `lineEnd // Loop increment will move past newline`，确保Bash 工具后续读取最新状态。
      i = lineEnd // Loop increment will move past newline
    }
  }

  // 返回 { behavior: 'passthrough', message: 'No comment quote desync' }，把工具调用这个分支的结果交还调用方。
  return { behavior: 'passthrough', message: 'No comment quote desync' }
}

/**
 * Detects a newline inside a quoted string where the NEXT line would be
 * stripped by stripCommentLines (trimmed line starts with `#`).
 *
 * In bash, `\n` inside quotes is a literal character and part of the argument.
 * But stripCommentLines (called by stripSafeWrappers in bashPermissions before
 * path validation and rule matching) processes commands LINE-BY-LINE via
 * `command.split('\n')` without tracking quote state. A quoted newline lets an
 * attacker position the next line to start with `#` (after trim), causing
 * stripCommentLines to drop that line entirely — hiding sensitive paths or
 * arguments from path validation and permission rule matching.
 *
 * Example attack (auto-allowed in acceptEdits mode without any Bash rules):
 *   mv ./decoy '<\n>#' ~/.ssh/id_rsa ./exfil_dir
 * Bash: moves ./decoy AND ~/.ssh/id_rsa into ./exfil_dir/ (errors on `\n#`).
 * stripSafeWrappers: line 2 starts with `#` → stripped → "mv ./decoy '".
 * shell-quote: drops unbalanced trailing quote → ["mv", "./decoy"].
 * checkPathConstraints: only sees ./decoy (in cwd) → passthrough.
 * acceptEdits mode: mv with all-cwd paths → ALLOW. Zero clicks, no warning.
 *
 * Also works with cp (exfil), rm/rm -rf (delete arbitrary files/dirs).
 *
 * Defense: block ONLY the specific stripCommentLines trigger — a newline inside
 * quotes where the next line starts with `#` after trim. This is the minimal
 * check that catches the parser differential while preserving legitimate
 * multi-line quoted arguments (echo 'line1\nline2', grep patterns, etc.).
 * Safe heredocs ($(cat <<'EOF'...)) and git commit -m "..." are handled by
 * early validators and never reach this check.
 *
 * This validator is NOT in nonMisparsingValidators — its ask result gets
 * isBashSecurityCheckForMisparsing: true, causing an early block in the
 * permission flow at bashPermissions.ts before any line-based processing runs.
 */
// validateQuotedNewline 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateQuotedNewline(context: ValidationContext): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // Fast path: must have both a newline byte AND a # character somewhere.
  // stripCommentLines only strips lines where trim().startsWith('#'), so
  // no # means no possible trigger.
  // 判断 !originalCommand.includes('\n') || !originalCommand.includes('#')，将工具调用分流到只适用于该条件的处理路径。
  if (!originalCommand.includes('\n') || !originalCommand.includes('#')) {
    // 返回 { behavior: 'passthrough', message: 'No newline or no hash' }，把工具调用这个分支的结果交还调用方。
    return { behavior: 'passthrough', message: 'No newline or no hash' }
  }

  // Track quote state. Mirrors extractQuotedContent / validateCommentQuoteDesync:
  // - single quotes don't toggle inside double quotes
  // - backslash escapes the next char (but not inside single quotes)
  // stripCommentLines splits on '\n' (not \r), so we only treat \n as a line
  // separator. \r inside a line is removed by trim() and doesn't change the
  // trimmed-starts-with-# check.
  // inSingleQuote记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let inSingleQuote = false
  // inDoubleQuote记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let inDoubleQuote = false
  // escaped记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
  let escaped = false

  // 遍历 let i = 0; i < originalCommand.length; i++，让工具调用逐项完成同一类处理。
  for (let i = 0; i < originalCommand.length; i++) {
    // char保存`originalCommand[i]`，供Bash 工具 bash Security后续步骤使用。
    const char = originalCommand[i]

    // 满足 `escaped` 时，工具调用执行该分支。
    if (escaped) {
      // escaped更新为 `false`，确保Bash 工具后续读取最新状态。
      escaped = false
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === '\\' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '\\' && !inSingleQuote) {
      // escaped更新为 `true`，确保Bash 工具后续读取最新状态。
      escaped = true
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === "'" && !inDoubleQuote` 满足时，工具调用才执行该分支。
    if (char === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 工具后续读取最新状态。
      inSingleQuote = !inSingleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 只有 `char === '"' && !inSingleQuote` 满足时，工具调用才执行该分支。
    if (char === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 工具后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // A newline inside quotes: the NEXT line (from bash's perspective) starts
    // inside a quoted string. Check if that line would be stripped by
    // stripCommentLines — i.e., after trim(), does it start with `#`?
    // This exactly mirrors: lines.filter(l => !l.trim().startsWith('#'))
    // 判断 char === '\n' && (inSingleQuote || inDoubleQuote)，将工具调用分流到只适用于该条件的处理路径。
    if (char === '\n' && (inSingleQuote || inDoubleQuote)) {
      // 起始行号保存`i + 1`，供Bash 工具 bash Security后续步骤使用。
      const lineStart = i + 1
      // nextNewline保存`originalCommand.indexOf`，供工具调用后续处理使用。
      const nextNewline = originalCommand.indexOf('\n', lineStart)
      // 结束行号记录当前扫描状态，Bash 工具 bash Security随后按该状态分支。
      const lineEnd = nextNewline === -1 ? originalCommand.length : nextNewline
      // nextLine格式化`originalCommand.slice`，供工具调用后续处理使用。
      const nextLine = originalCommand.slice(lineStart, lineEnd)
      // 判断 nextLine.trim().startsWith('#')，将工具调用分流到只适用于该条件的处理路径。
      if (nextLine.trim().startsWith('#')) {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_bash_security_check_triggered', {
          checkId: BASH_SECURITY_CHECK_IDS.QUOTED_NEWLINE,
        })
        // 返回 {，把工具调用这个分支的结果交还调用方。
        return {
          behavior: 'ask',
          message:
            'Command contains a quoted newline followed by a #-prefixed line, which can hide arguments from line-based permission checks',
        }
      }
    }
  }

  // 返回 { behavior: 'passthrough', message: 'No quoted newline-hash pattern' }，把工具调用这个分支的结果交还调用方。
  return { behavior: 'passthrough', message: 'No quoted newline-hash pattern' }
}

/**
 * Validates that the command doesn't use Zsh-specific dangerous commands that
 * can bypass security checks. These commands provide capabilities like loading
 * kernel modules, raw file I/O, network access, and pseudo-terminal execution
 * that circumvent normal permission checks.
 *
 * Also catches `fc -e` which can execute arbitrary editors on command history,
 * and `emulate` which with `-c` is an eval-equivalent.
 */
// validateZshDangerousCommands 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
function validateZshDangerousCommands(
  context: ValidationContext,
): PermissionResult {
  // 从 `context` 解构 originalCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { originalCommand } = context

  // Extract the base command from the original command, stripping leading
  // whitespace, env var assignments, and Zsh precommand modifiers.
  // e.g., "FOO=bar command builtin zmodload" -> "zmodload"
  // ZSH_PRECOMMAND_MODIFIERS 命令数据保存`Set`，供工具调用后续处理使用。
  const ZSH_PRECOMMAND_MODIFIERS = new Set([
    'command',
    'builtin',
    'noglob',
    'nocorrect',
  ])
  // trimmed格式化`originalCommand.trim`，供工具调用后续处理使用。
  const trimmed = originalCommand.trim()
  // tokens 集合格式化`trimmed.split`，供工具调用后续处理使用。
  const tokens = trimmed.split(/\s+/)
  // baseCmd 命令数据保存`''`，供Bash 工具 bash Security后续步骤使用。
  let baseCmd = ''
  // 遍历 const token of tokens，让工具调用逐项完成同一类处理。
  for (const token of tokens) {
    // Skip env var assignments (VAR=value)
    // 判断 /^[A-Za-z_]\w*=/.test(token)，将工具调用分流到只适用于该条件的处理路径。
    if (/^[A-Za-z_]\w*=/.test(token)) continue
    // Skip Zsh precommand modifiers (they don't change what command runs)
    // 判断 ZSH_PRECOMMAND_MODIFIERS.has(token)，将工具调用分流到只适用于该条件的处理路径。
    if (ZSH_PRECOMMAND_MODIFIERS.has(token)) continue
    // baseCmd 命令数据更新为 `token`，确保Bash 工具后续读取最新状态。
    baseCmd = token
    // 结束这个分支或循环，避免工具调用继续落入后续路径。
    break
  }

  // 判断 ZSH_DANGEROUS_COMMANDS.has(baseCmd)，将工具调用分流到只适用于该条件的处理路径。
  if (ZSH_DANGEROUS_COMMANDS.has(baseCmd)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.ZSH_DANGEROUS_COMMANDS,
      subId: 1,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message: `Command uses Zsh-specific '${baseCmd}' which can bypass security checks`,
    }
  }

  // Check for `fc -e` which allows executing arbitrary commands via editor
  // fc without -e is safe (just lists history), but -e specifies an editor
  // to run on the command, effectively an eval
  // 判断 baseCmd === 'fc' && /\s-\S*e/.test(trimmed)，将工具调用分流到只适用于该条件的处理路径。
  if (baseCmd === 'fc' && /\s-\S*e/.test(trimmed)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.ZSH_DANGEROUS_COMMANDS,
      subId: 2,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        "Command uses 'fc -e' which can execute arbitrary commands via editor",
    }
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'No Zsh dangerous commands',
  }
}

// Matches non-printable control characters that have no legitimate use in shell
// commands: 0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F. Excludes tab (0x09),
// newline (0x0A), and carriage return (0x0D) which are handled by other
// validators. Bash silently drops null bytes and ignores most control chars,
// so an attacker can use them to slip metacharacters past our checks while
// bash still executes them (e.g., "echo safe\x00; rm -rf /").
// eslint-disable-next-line no-control-regex
// CONTROL_CHAR_RE保存`/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/`，供Bash 工具 bash Security后续步骤使用。
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/

/**
 * @deprecated Legacy regex/shell-quote path. Only used when tree-sitter is
 * unavailable. The primary gate is parseForSecurity (ast.ts).
 */
// bashCommandIsSafe_DEPRECATED 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
export function bashCommandIsSafe_DEPRECATED(
  command: string,
): PermissionResult {
  // SECURITY: Block control characters before any other processing. Null bytes
  // and other non-printable chars are silently dropped by bash but confuse our
  // validators, allowing metacharacters adjacent to them to slip through.
  // 判断 CONTROL_CHAR_RE.test(command)，将工具调用分流到只适用于该条件的处理路径。
  if (CONTROL_CHAR_RE.test(command)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.CONTROL_CHARACTERS,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains non-printable control characters that could be used to bypass security checks',
      isBashSecurityCheckForMisparsing: true,
    }
  }

  // SECURITY: Detect '\' patterns that exploit shell-quote's incorrect handling
  // of backslashes inside single quotes. Must run before shell-quote parsing.
  // 判断 hasShellQuoteSingleQuoteBug(command)，将工具调用分流到只适用于该条件的处理路径。
  if (hasShellQuoteSingleQuoteBug(command)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains single-quoted backslash pattern that could bypass security checks',
      isBashSecurityCheckForMisparsing: true,
    }
  }

  // SECURITY: Strip heredoc bodies before running security validators.
  // Only strip bodies for quoted/escaped delimiters (<<'EOF', <<\EOF) where
  // the body is literal text — $(), backticks, and ${} are NOT expanded.
  // Unquoted heredocs (<<EOF) undergo full shell expansion, so their bodies
  // may contain executable command substitutions that validators must see.
  // When extractHeredocs bails out (can't parse safely), the raw command
  // goes through all validators — which is the safe direction.
  // 从 `extractHeredocs(command, { quotedOnly: true })` 解构 processedCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { processedCommand } = extractHeredocs(command, { quotedOnly: true })

  // baseCommand 命令数据格式化`command.split`，供工具调用后续处理使用。
  const baseCommand = command.split(' ')[0] || ''
  // Bash 工具 bash Security先整理这一处局部数据，后续分支可以直接读取。
  const { withDoubleQuotes, fullyUnquoted, unquotedKeepQuoteChars } =
    extractQuotedContent(processedCommand, baseCommand === 'jq')

  // 上下文集中保存Bash 工具 bash Security要一起传递的字段。
  const context: ValidationContext = {
    originalCommand: command,
    baseCommand,
    unquotedContent: withDoubleQuotes,
    fullyUnquotedContent: stripSafeRedirections(fullyUnquoted),
    fullyUnquotedPreStrip: fullyUnquoted,
    unquotedKeepQuoteChars,
  }

  // earlyValidators 集合聚合成有序列表，保持后续遍历顺序稳定。
  const earlyValidators = [
    validateEmpty,
    validateIncompleteCommands,
    validateSafeCommandSubstitution,
    validateGitCommit,
  ]

  // 遍历 const validator of earlyValidators，让工具调用逐项完成同一类处理。
  for (const validator of earlyValidators) {
    // 结果保存`validator`，供工具调用后续处理使用。
    const result = validator(context)
    // `result.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
    if (result.behavior === 'allow') {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'passthrough',
        message:
          result.decisionReason?.type === 'other' ||
          result.decisionReason?.type === 'safetyCheck'
            ? result.decisionReason.reason
            : 'Command allowed',
      }
    }
    // `result.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
    if (result.behavior !== 'passthrough') {
      // 返回 result.behavior === 'ask'，把工具调用这个分支的结果交还调用方。
      return result.behavior === 'ask'
        ? { ...result, isBashSecurityCheckForMisparsing: true as const }
        : result
    }
  }

  // Validators that don't set isBashSecurityCheckForMisparsing — their ask
  // results go through the standard permission flow rather than being blocked
  // early. LF newlines and redirections are normal patterns that splitCommand
  // handles correctly, not misparsing concerns.
  //
  // NOTE: validateCarriageReturn is NOT here — CR IS a misparsing concern.
  // shell-quote's `[^\s]` treats CR as a word separator (JS `\s` ⊃ \r), but
  // bash IFS does NOT include CR. splitCommand collapses CR→space, which IS
  // misparsing. See validateCarriageReturn for the full attack trace.
  // nonMisparsingValidators 集合保存`Set`，供工具调用后续处理使用。
  const nonMisparsingValidators = new Set([
    validateNewlines,
    validateRedirections,
  ])

  // validators 集合聚合成有序列表，保持后续遍历顺序稳定。
  const validators = [
    validateJqCommand,
    validateObfuscatedFlags,
    validateShellMetacharacters,
    validateDangerousVariables,
    // Run comment-quote-desync BEFORE validateNewlines: it detects cases where
    // the quote tracker would miss newlines due to # comment desync.
    validateCommentQuoteDesync,
    // Run quoted-newline BEFORE validateNewlines: it detects the INVERSE case
    // (newlines INSIDE quotes, which validateNewlines ignores by design). Quoted
    // newlines let attackers split commands across lines so that line-based
    // processing (stripCommentLines) drops sensitive content.
    validateQuotedNewline,
    // CR check runs BEFORE validateNewlines — CR is a MISPARSING concern
    // (shell-quote/bash tokenization differential), LF is not.
    validateCarriageReturn,
    validateNewlines,
    validateIFSInjection,
    validateProcEnvironAccess,
    validateDangerousPatterns,
    validateRedirections,
    validateBackslashEscapedWhitespace,
    validateBackslashEscapedOperators,
    validateUnicodeWhitespace,
    validateMidWordHash,
    validateBraceExpansion,
    validateZshDangerousCommands,
    // Run malformed token check last - other validators should catch specific patterns first
    // (e.g., $() substitution, backticks, etc.) since they have more precise error messages
    validateMalformedTokenInjection,
  ]

  // SECURITY: We must NOT short-circuit when a non-misparsing validator
  // returns 'ask' if there are still misparsing validators later in the list.
  // Non-misparsing ask results are discarded at bashPermissions.ts:~1301-1303
  // (the gate only blocks when isBashSecurityCheckForMisparsing is set). If
  // validateRedirections (index 10, non-misparsing) fires first on `>`, it
  // returns ask-without-flag — but validateBackslashEscapedOperators (index 12,
  // misparsing) would have caught `\;` WITH the flag. Short-circuiting lets a
  // payload like `cat safe.txt \; echo /etc/passwd > ./out` slip through.
  //
  // Fix: defer non-misparsing ask results. Continue running validators; if any
  // misparsing validator fires, return THAT (with the flag). Only if we reach
  // the end without a misparsing ask, return the deferred non-misparsing ask.
  // deferredNonMisparsingResult保存`null`，供Bash 工具 bash Security后续步骤使用。
  let deferredNonMisparsingResult: PermissionResult | null = null
  // 遍历 const validator of validators，让工具调用逐项完成同一类处理。
  for (const validator of validators) {
    // 结果保存`validator`，供工具调用后续处理使用。
    const result = validator(context)
    // `result.behavior` 命中特定值 `'ask'` 时，进入工具调用对应处理。
    if (result.behavior === 'ask') {
      // 判断 nonMisparsingValidators.has(validator)，将工具调用分流到只适用于该条件的处理路径。
      if (nonMisparsingValidators.has(validator)) {
        // 满足 `deferredNonMisparsingResult === null` 时，工具调用执行该分支。
        if (deferredNonMisparsingResult === null) {
          // deferredNonMisparsingResult更新为 `result`，确保Bash 工具后续读取最新状态。
          deferredNonMisparsingResult = result
        }
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // 返回 { ...result, isBashSecurityCheckForMisparsing: true as const }，把工具调用这个分支的结果交还调用方。
      return { ...result, isBashSecurityCheckForMisparsing: true as const }
    }
  }
  // `deferredNonMisparsingResult` 与 `null` 不一致时刷新派生状态。
  if (deferredNonMisparsingResult !== null) {
    // 返回 deferredNonMisparsingResult，把工具调用这个分支的结果交还调用方。
    return deferredNonMisparsingResult
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'Command passed all security checks',
  }
}

/**
 * @deprecated Legacy regex/shell-quote path. Only used when tree-sitter is
 * unavailable. The primary gate is parseForSecurity (ast.ts).
 *
 * Async version of bashCommandIsSafe that uses tree-sitter when available
 * for more accurate parsing. Falls back to the sync regex version when
 * tree-sitter is not available.
 *
 * This should be used by async callers (bashPermissions.ts, bashCommandHelpers.ts).
 * Sync callers (readOnlyValidation.ts) should continue using bashCommandIsSafe().
 */
// bashCommandIsSafeAsync_DEPRECATED 承担工具调用中的独立步骤，串起Bash 工具 bash Security需要的输入整理、状态更新和结果输出。
export async function bashCommandIsSafeAsync_DEPRECATED(
  command: string,
  onDivergence?: () => void,
): Promise<PermissionResult> {
  // Try to get tree-sitter analysis
  // parsed解析`ParsedCommand.parse`，供工具调用后续处理使用。
  const parsed = await ParsedCommand.parse(command)
  // tsAnalysis 集合读取`getTreeSitterAnalysis`，供工具调用后续处理使用。
  const tsAnalysis = parsed?.getTreeSitterAnalysis() ?? null

  // If no tree-sitter, fall back to sync version
  // tsAnalysis 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!tsAnalysis) {
    // 返回 bashCommandIsSafe_DEPRECATED(command)，把工具调用这个分支的结果交还调用方。
    return bashCommandIsSafe_DEPRECATED(command)
  }

  // Run the same security checks but with tree-sitter enriched context.
  // The early checks (control chars, shell-quote bug) don't benefit from
  // tree-sitter, so we run them identically.
  // 判断 CONTROL_CHAR_RE.test(command)，将工具调用分流到只适用于该条件的处理路径。
  if (CONTROL_CHAR_RE.test(command)) {
    // 记录工具调用运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_bash_security_check_triggered', {
      checkId: BASH_SECURITY_CHECK_IDS.CONTROL_CHARACTERS,
    })
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains non-printable control characters that could be used to bypass security checks',
      isBashSecurityCheckForMisparsing: true,
    }
  }

  // 判断 hasShellQuoteSingleQuoteBug(command)，将工具调用分流到只适用于该条件的处理路径。
  if (hasShellQuoteSingleQuoteBug(command)) {
    // 返回 {，把工具调用这个分支的结果交还调用方。
    return {
      behavior: 'ask',
      message:
        'Command contains single-quoted backslash pattern that could bypass security checks',
      isBashSecurityCheckForMisparsing: true,
    }
  }

  // 从 `extractHeredocs(command, { quotedOnly: true })` 解构 processedCommand，减少Bash 工具 bash Security对同一对象的重复访问。
  const { processedCommand } = extractHeredocs(command, { quotedOnly: true })

  // baseCommand 命令数据格式化`command.split`，供工具调用后续处理使用。
  const baseCommand = command.split(' ')[0] || ''

  // Use tree-sitter quote context for more accurate analysis
  // tsQuote保存`tsAnalysis.quoteContext`，供Bash 工具 bash Security后续步骤使用。
  const tsQuote = tsAnalysis.quoteContext
  // regexQuote保存`extractQuotedContent`，供工具调用后续处理使用。
  const regexQuote = extractQuotedContent(
    processedCommand,
    baseCommand === 'jq',
  )

  // Use tree-sitter quote context as primary, but keep regex as reference
  // for divergence logging
  // withDoubleQuotes 集合保存`tsQuote.withDoubleQuotes`，供Bash 工具 bash Security后续步骤使用。
  const withDoubleQuotes = tsQuote.withDoubleQuotes
  // fullyUnquoted保存`tsQuote.fullyUnquoted`，供Bash 工具 bash Security后续步骤使用。
  const fullyUnquoted = tsQuote.fullyUnquoted
  // unquotedKeepQuoteChars 集合保存`tsQuote.unquotedKeepQuoteChars`，供Bash 工具 bash Security后续步骤使用。
  const unquotedKeepQuoteChars = tsQuote.unquotedKeepQuoteChars

  // 上下文集中保存Bash 工具 bash Security要一起传递的字段。
  const context: ValidationContext = {
    originalCommand: command,
    baseCommand,
    unquotedContent: withDoubleQuotes,
    fullyUnquotedContent: stripSafeRedirections(fullyUnquoted),
    fullyUnquotedPreStrip: fullyUnquoted,
    unquotedKeepQuoteChars,
    treeSitter: tsAnalysis,
  }

  // Log divergence between tree-sitter and regex quote extraction.
  // Skip for heredoc commands: tree-sitter strips (quoted) heredoc bodies
  // to nothing while the regex path replaces them with placeholder strings
  // (via extractHeredocs), so the two outputs can never match. Logging
  // divergence for every heredoc command would poison the signal.
  //
  // onDivergence callback: when called in a fanout loop (bashPermissions.ts
  // Promise.all over subcommands), the caller batches divergences into a
  // single logEvent instead of N separate calls. Each logEvent triggers
  // getEventMetadata() → buildProcessMetrics() → process.memoryUsage() →
  // /proc/self/stat read; with memoized metadata these resolve as microtasks
  // and starve the event loop (CC-643). Single-command callers omit the
  // callback and get the original per-call logEvent behavior.
  // tsAnalysis.dangerousPatterns.hasHeredoc缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!tsAnalysis.dangerousPatterns.hasHeredoc) {
    // hasDivergence 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasDivergence =
      tsQuote.fullyUnquoted !== regexQuote.fullyUnquoted ||
      tsQuote.withDoubleQuotes !== regexQuote.withDoubleQuotes
    // 满足 `hasDivergence` 时，工具调用执行该分支。
    if (hasDivergence) {
      // 满足 `onDivergence` 时，工具调用执行该分支。
      if (onDivergence) {
        // onDivergence执行工具调用在此处需要的副作用或外部交互。
        onDivergence()
      } else {
        // 记录工具调用运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_tree_sitter_security_divergence', {
          quoteContextDivergence: true,
        })
      }
    }
  }

  // earlyValidators 集合聚合成有序列表，保持后续遍历顺序稳定。
  const earlyValidators = [
    validateEmpty,
    validateIncompleteCommands,
    validateSafeCommandSubstitution,
    validateGitCommit,
  ]

  // 遍历 const validator of earlyValidators，让工具调用逐项完成同一类处理。
  for (const validator of earlyValidators) {
    // 结果保存`validator`，供工具调用后续处理使用。
    const result = validator(context)
    // `result.behavior` 命中特定值 `'allow'` 时，进入工具调用对应处理。
    if (result.behavior === 'allow') {
      // 返回 {，把工具调用这个分支的结果交还调用方。
      return {
        behavior: 'passthrough',
        message:
          result.decisionReason?.type === 'other' ||
          result.decisionReason?.type === 'safetyCheck'
            ? result.decisionReason.reason
            : 'Command allowed',
      }
    }
    // `result.behavior` 与 `'passthrough'` 不一致时刷新派生状态。
    if (result.behavior !== 'passthrough') {
      // 返回 result.behavior === 'ask'，把工具调用这个分支的结果交还调用方。
      return result.behavior === 'ask'
        ? { ...result, isBashSecurityCheckForMisparsing: true as const }
        : result
    }
  }

  // nonMisparsingValidators 集合保存`Set`，供工具调用后续处理使用。
  const nonMisparsingValidators = new Set([
    validateNewlines,
    validateRedirections,
  ])

  // validators 集合聚合成有序列表，保持后续遍历顺序稳定。
  const validators = [
    validateJqCommand,
    validateObfuscatedFlags,
    validateShellMetacharacters,
    validateDangerousVariables,
    validateCommentQuoteDesync,
    validateQuotedNewline,
    validateCarriageReturn,
    validateNewlines,
    validateIFSInjection,
    validateProcEnvironAccess,
    validateDangerousPatterns,
    validateRedirections,
    validateBackslashEscapedWhitespace,
    validateBackslashEscapedOperators,
    validateUnicodeWhitespace,
    validateMidWordHash,
    validateBraceExpansion,
    validateZshDangerousCommands,
    validateMalformedTokenInjection,
  ]

  // deferredNonMisparsingResult保存`null`，供Bash 工具 bash Security后续步骤使用。
  let deferredNonMisparsingResult: PermissionResult | null = null
  // 遍历 const validator of validators，让工具调用逐项完成同一类处理。
  for (const validator of validators) {
    // 结果保存`validator`，供工具调用后续处理使用。
    const result = validator(context)
    // `result.behavior` 命中特定值 `'ask'` 时，进入工具调用对应处理。
    if (result.behavior === 'ask') {
      // 判断 nonMisparsingValidators.has(validator)，将工具调用分流到只适用于该条件的处理路径。
      if (nonMisparsingValidators.has(validator)) {
        // 满足 `deferredNonMisparsingResult === null` 时，工具调用执行该分支。
        if (deferredNonMisparsingResult === null) {
          // deferredNonMisparsingResult更新为 `result`，确保Bash 工具后续读取最新状态。
          deferredNonMisparsingResult = result
        }
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // 返回 { ...result, isBashSecurityCheckForMisparsing: true as const }，把工具调用这个分支的结果交还调用方。
      return { ...result, isBashSecurityCheckForMisparsing: true as const }
    }
  }
  // `deferredNonMisparsingResult` 与 `null` 不一致时刷新派生状态。
  if (deferredNonMisparsingResult !== null) {
    // 返回 deferredNonMisparsingResult，把工具调用这个分支的结果交还调用方。
    return deferredNonMisparsingResult
  }

  // 返回 {，把工具调用这个分支的结果交还调用方。
  return {
    behavior: 'passthrough',
    message: 'Command passed all security checks',
  }
}
