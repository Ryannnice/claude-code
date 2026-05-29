// 类型依赖 { ToolPermissionContext } 来自 ../../Tool.js，用于校准工具调用的数据契约。
import type { ToolPermissionContext } from '../../Tool.js'
// 复用 splitCommand_DEPRECATED 工具函数，把通用处理留在 ../../utils/bash/commands.js 中维护。
import { splitCommand_DEPRECATED } from '../../utils/bash/commands.js'
// 复用 tryParseShellCommand 工具函数，把通用处理留在 ../../utils/bash/shellQuote.js 中维护。
import { tryParseShellCommand } from '../../utils/bash/shellQuote.js'
// 类型依赖 { PermissionResult } 来自 ../../utils/permissions/PermissionResult.js，用于校准工具调用的数据契约。
import type { PermissionResult } from '../../utils/permissions/PermissionResult.js'

/**
 * Helper: Validate flags against an allowlist
 * Handles both single flags and combined flags (e.g., -nE)
 * @param flags Array of flags to validate
 * @param allowedFlags Array of allowed single-character and long flags
 * @returns true if all flags are valid, false otherwise
 */
// validateFlagsAgainstAllowlist 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function validateFlagsAgainstAllowlist(
  flags: string[],
  allowedFlags: string[],
): boolean {
  // 按顺序遍历 `flags` 中的flag，逐个交给工具调用处理。
  for (const flag of flags) {
    // Handle combined flags like -nE or -Er
    // 只有 `flag.startsWith('-') && !flag.startsWith('--') && flag.length > 2` 满足时，工具调用才执行该分支。
    if (flag.startsWith('-') && !flag.startsWith('--') && flag.length > 2) {
      // Check each character in combined flag
      // 循环处理 `let i = 1; i < flag.length; i++`，让工具调用逐项把同类条目按顺序走完。
      for (let i = 1; i < flag.length; i++) {
        // singleFlag 命名 `'-' + flag[i]`，让后续代码直接表达这个值的用途。
        const singleFlag = '-' + flag[i]
        // 满足 `!allowedFlags.includes(singleFlag)` 时，工具调用执行该分支。
        if (!allowedFlags.includes(singleFlag)) {
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
      }
    } else {
      // Single flag or long flag
      // 满足 `!allowedFlags.includes(flag)` 时，工具调用执行该分支。
      if (!allowedFlags.includes(flag)) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
  }
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Pattern 1: Check if this is a line printing command with -n flag
 * Allows: sed -n 'N' | sed -n 'N,M' with optional -E, -r, -z flags
 * Allows semicolon-separated print commands like: sed -n '1p;2p;3p'
 * File arguments are ALLOWED for this pattern
 * @internal Exported for testing
 */
// isLinePrintingCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isLinePrintingCommand(
  command: string,
  expressions: string[],
): boolean {
  // sedMatch匹配`command.match`，供工具调用后续处理使用。
  const sedMatch = command.match(/^\s*sed\s+/)
  // sedMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!sedMatch) return false

  // withoutSed格式化`command.slice`，供工具调用后续处理使用。
  const withoutSed = command.slice(sedMatch[0].length)
  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(withoutSed)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) return false
  // 解析结果解析`parseResult.tokens` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
  const parsed = parseResult.tokens

  // Extract all flags
  // flags 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const flags: string[] = []
  // 按顺序遍历 `parsed` 中的当前参数，逐个交给工具调用处理。
  for (const arg of parsed) {
    // 当 `typeof arg` 匹配 `'string' && arg.startsWith(...` 时，工具调用执行对应分支。
    if (typeof arg === 'string' && arg.startsWith('-') && arg !== '--') {
      // flags 集合追加新条目，保持收集顺序与输入顺序一致。
      flags.push(arg)
    }
  }

  // Validate flags - only allow -n, -E, -r, -z and their long forms
  // allowedFlags 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const allowedFlags = [
    '-n',
    '--quiet',
    '--silent',
    '-E',
    '--regexp-extended',
    '-r',
    '-z',
    '--zero-terminated',
    '--posix',
  ]

  // 满足 `!validateFlagsAgainstAllowlist(flags, allowedFlags)` 时，工具调用执行该分支。
  if (!validateFlagsAgainstAllowlist(flags, allowedFlags)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if -n flag is present (required for Pattern 1)
  // hasNFlag标记Bash 工具 sed Validation是否启用对应路径。
  let hasNFlag = false
  // 按顺序遍历 `flags` 中的flag，逐个交给工具调用处理。
  for (const flag of flags) {
    // 当 `flag` 匹配 `'-n' || flag === '--quiet' ...` 时，工具调用执行对应分支。
    if (flag === '-n' || flag === '--quiet' || flag === '--silent') {
      // hasNFlag更新为 `true`，确保Bash 工具后续读取最新状态。
      hasNFlag = true
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    }
    // Check in combined flags
    // 只有 `flag.startsWith('-') && !flag.startsWith('--') && flag.includes('n')` 满足时，工具调用才执行该分支。
    if (flag.startsWith('-') && !flag.startsWith('--') && flag.includes('n')) {
      // hasNFlag更新为 `true`，确保Bash 工具后续读取最新状态。
      hasNFlag = true
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    }
  }

  // Must have -n flag for Pattern 1
  // hasNFlag缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!hasNFlag) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Must have at least one expression
  // expressions 集合为空时立即返回或跳过，避免工具调用把空集合当成可处理内容。
  if (expressions.length === 0) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // All expressions must be print commands (strict allowlist)
  // Allow semicolon-separated commands
  // 按顺序遍历 `expressions` 中的expr，逐个交给工具调用处理。
  for (const expr of expressions) {
    // commands 命令数据格式化`expr.split`，供工具调用后续处理使用。
    const commands = expr.split(';')
    // 按顺序遍历 `commands` 中的cmd 命令数据，逐个交给工具调用处理。
    for (const cmd of commands) {
      // 满足 `!isPrintCommand(cmd.trim())` 时，工具调用执行该分支。
      if (!isPrintCommand(cmd.trim())) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
    }
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Helper: Check if a single command is a valid print command
 * STRICT ALLOWLIST - only these exact forms are allowed:
 * - p (print all)
 * - Np (print line N, where N is digits)
 * - N,Mp (print lines N through M)
 * Anything else (including w, W, e, E commands) is rejected.
 * @internal Exported for testing
 */
// isPrintCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPrintCommand(cmd: string): boolean {
  // cmd 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!cmd) return false
  // Single strict regex that only matches allowed print commands
  // ^(?:\d+|\d+,\d+)?p$ matches: p, 1p, 123p, 1,5p, 10,200p
  // 返回 `/^(?:\d+|\d+,\d+)?p$/.test(cmd)`，作为工具调用这次计算的结果。
  return /^(?:\d+|\d+,\d+)?p$/.test(cmd)
}

/**
 * Pattern 2: Check if this is a substitution command
 * Allows: sed 's/pattern/replacement/flags' where flags are only: g, p, i, I, m, M, 1-9
 * When allowFileWrites is true, allows -i flag and file arguments for in-place editing
 * When allowFileWrites is false (default), requires stdout-only (no file arguments, no -i flag)
 * @internal Exported for testing
 */
// isSubstitutionCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isSubstitutionCommand(
  command: string,
  expressions: string[],
  hasFileArguments: boolean,
  options?: { allowFileWrites?: boolean },
): boolean {
  // allowFileWrites 文件数据 命名 `options?.allowFileWrites ?? false`，让后续代码直接表达这个值的用途。
  const allowFileWrites = options?.allowFileWrites ?? false

  // When not allowing file writes, must NOT have file arguments
  // 只有 `!allowFileWrites && hasFileArguments` 满足时，工具调用才执行该分支。
  if (!allowFileWrites && hasFileArguments) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // sedMatch匹配`command.match`，供工具调用后续处理使用。
  const sedMatch = command.match(/^\s*sed\s+/)
  // sedMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!sedMatch) return false

  // withoutSed格式化`command.slice`，供工具调用后续处理使用。
  const withoutSed = command.slice(sedMatch[0].length)
  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(withoutSed)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) return false
  // 解析结果解析`parseResult.tokens` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
  const parsed = parseResult.tokens

  // Extract all flags
  // flags 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const flags: string[] = []
  // 按顺序遍历 `parsed` 中的当前参数，逐个交给工具调用处理。
  for (const arg of parsed) {
    // 当 `typeof arg` 匹配 `'string' && arg.startsWith(...` 时，工具调用执行对应分支。
    if (typeof arg === 'string' && arg.startsWith('-') && arg !== '--') {
      // flags 集合追加新条目，保持收集顺序与输入顺序一致。
      flags.push(arg)
    }
  }

  // Validate flags based on mode
  // Base allowed flags for both modes
  // allowedFlags 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const allowedFlags = ['-E', '--regexp-extended', '-r', '--posix']

  // When allowing file writes, also permit -i and --in-place
  // 满足 `allowFileWrites` 时，工具调用执行该分支。
  if (allowFileWrites) {
    // allowedFlags 集合追加新条目，保持收集顺序与输入顺序一致。
    allowedFlags.push('-i', '--in-place')
  }

  // 满足 `!validateFlagsAgainstAllowlist(flags, allowedFlags)` 时，工具调用执行该分支。
  if (!validateFlagsAgainstAllowlist(flags, allowedFlags)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Must have exactly one expression
  // `expressions.length` 与 `1` 不一致时刷新派生状态，避免使用过期结果。
  if (expressions.length !== 1) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // expr格式化`trim`，供工具调用后续处理使用。
  const expr = expressions[0]!.trim()

  // STRICT ALLOWLIST: Must be exactly a substitution command starting with 's'
  // This rejects standalone commands like 'e', 'w file', etc.
  // 满足 `!expr.startsWith('s')` 时，工具调用执行该分支。
  if (!expr.startsWith('s')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Parse substitution: s/pattern/replacement/flags
  // Only allow / as delimiter (strict)
  // substitutionMatch匹配`expr.match`，供工具调用后续处理使用。
  const substitutionMatch = expr.match(/^s\/(.*?)$/)
  // substitutionMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!substitutionMatch) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // rest 命名 `substitutionMatch[1]!`，让后续代码直接表达这个值的用途。
  const rest = substitutionMatch[1]!

  // Find the positions of / delimiters
  // delimiterCount 数量保存`0`，供Bash 工具 sed Validation后续判断或输出使用。
  let delimiterCount = 0
  // lastDelimiterPos 集合 命名 `-1`，让后续代码直接表达这个值的用途。
  let lastDelimiterPos = -1
  // i保存`0`，供Bash 工具 sed Validation后续判断或输出使用。
  let i = 0
  // while 使用 i < rest.length 完成工具调用里的对应操作。
  while (i < rest.length) {
    // 当 `rest[i]` 匹配 `'\\'` 时，工具调用执行对应分支。
    if (rest[i] === '\\') {
      // Skip escaped character
      // Bash 工具 sed Validation在这里处理 `i += 2`，完成这一小步状态转换。
      i += 2
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 当 `rest[i]` 匹配 `'/'` 时，工具调用执行对应分支。
    if (rest[i] === '/') {
      // Bash 工具 sed Validation在这里处理 `delimiterCount++`，完成这一小步状态转换。
      delimiterCount++
      // lastDelimiterPos 集合更新为 `i`，确保Bash 工具后续读取最新状态。
      lastDelimiterPos = i
    }
    // Bash 工具 sed Validation在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Must have found exactly 2 delimiters (pattern and replacement)
  // `delimiterCount` 与 `2` 不一致时刷新派生状态，避免使用过期结果。
  if (delimiterCount !== 2) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Extract flags (everything after the last delimiter)
  // exprFlags 集合格式化`rest.slice`，供工具调用后续处理使用。
  const exprFlags = rest.slice(lastDelimiterPos + 1)

  // Validate flags: only allow g, p, i, I, m, M, and optionally ONE digit 1-9
  // allowedFlagChars 集合保存`/^[gpimIM]*[1-9]?[gpimIM]*$/`，供Bash 工具 sed Validation后续判断或输出使用。
  const allowedFlagChars = /^[gpimIM]*[1-9]?[gpimIM]*$/
  // 满足 `!allowedFlagChars.test(exprFlags)` 时，工具调用执行该分支。
  if (!allowedFlagChars.test(exprFlags)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Checks if a sed command is allowed by the allowlist.
 * The allowlist patterns themselves are strict enough to reject dangerous operations.
 * @param command The sed command to check
 * @param options.allowFileWrites When true, allows -i flag and file arguments for substitution commands
 * @returns true if the command is allowed (matches allowlist and passes denylist check), false otherwise
 */
// sedCommandIsAllowedByAllowlist 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function sedCommandIsAllowedByAllowlist(
  command: string,
  options?: { allowFileWrites?: boolean },
): boolean {
  // allowFileWrites 文件数据 命名 `options?.allowFileWrites ?? false`，让后续代码直接表达这个值的用途。
  const allowFileWrites = options?.allowFileWrites ?? false

  // Extract sed expressions (content inside quotes where actual sed commands live)
  // expressions 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let expressions: string[]
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // expressions 集合更新为 `extractSedExpressions(command)`，确保Bash 工具后续读取最新状态。
    expressions = extractSedExpressions(command)
  } catch (_error) {
    // If parsing failed, treat as not allowed
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check if sed command has file arguments
  // hasFileArguments 文件数据记录 `hasFileArgs` 是否成立，工具调用随后按该结果分支。
  const hasFileArguments = hasFileArgs(command)

  // Check if command matches allowlist patterns
  // isPattern1标记Bash 工具 sed Validation是否启用对应路径。
  let isPattern1 = false
  // isPattern2标记Bash 工具 sed Validation是否启用对应路径。
  let isPattern2 = false

  // 满足 `allowFileWrites` 时，工具调用执行该分支。
  if (allowFileWrites) {
    // When allowing file writes, only check substitution commands (Pattern 2 variant)
    // Pattern 1 (line printing) doesn't need file writes
    // isPattern2更新为 `isSubstitutionCommand(command, expressions, hasFileArgume...`，确保Bash 工具后续读取最新状态。
    isPattern2 = isSubstitutionCommand(command, expressions, hasFileArguments, {
      allowFileWrites: true,
    })
  } else {
    // Standard read-only mode: check both patterns
    // isPattern1更新为 `isLinePrintingCommand(command, expressions)`，确保Bash 工具后续读取最新状态。
    isPattern1 = isLinePrintingCommand(command, expressions)
    // isPattern2更新为 `isSubstitutionCommand(command, expressions, hasFileArgume...`，确保Bash 工具后续读取最新状态。
    isPattern2 = isSubstitutionCommand(command, expressions, hasFileArguments)
  }

  // 只有 `!isPattern1 && !isPattern2` 满足时，工具调用才执行该分支。
  if (!isPattern1 && !isPattern2) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Pattern 2 does not allow semicolons (command separators)
  // Pattern 1 allows semicolons for separating print commands
  // 按顺序遍历 `expressions` 中的expr，逐个交给工具调用处理。
  for (const expr of expressions) {
    // 只有 `isPattern2 && expr.includes(';')` 满足时，工具调用才执行该分支。
    if (isPattern2 && expr.includes(';')) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // Defense-in-depth: Even if allowlist matches, check denylist
  // 按顺序遍历 `expressions` 中的expr，逐个交给工具调用处理。
  for (const expr of expressions) {
    // 满足 `containsDangerousOperations(expr)` 时，工具调用执行该分支。
    if (containsDangerousOperations(expr)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Check if a sed command has file arguments (not just stdin)
 * @internal Exported for testing
 */
// hasFileArgs 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasFileArgs(command: string): boolean {
  // sedMatch匹配`command.match`，供工具调用后续处理使用。
  const sedMatch = command.match(/^\s*sed\s+/)
  // sedMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!sedMatch) return false

  // withoutSed格式化`command.slice`，供工具调用后续处理使用。
  const withoutSed = command.slice(sedMatch[0].length)
  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(withoutSed)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) return true
  // 解析结果解析`parseResult.tokens` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
  const parsed = parseResult.tokens

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // argCount 数量保存`0`，供Bash 工具 sed Validation后续判断或输出使用。
    let argCount = 0
    // hasEFlag标记Bash 工具 sed Validation是否启用对应路径。
    let hasEFlag = false

    // 按索引扫描 `parsed.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < parsed.length; i++) {
      // 当前参数解析`parsed[i]` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
      const arg = parsed[i]

      // Handle both string arguments and glob patterns (like *.log)
      // `typeof arg` 与 `'string' && typeof arg !== 'obj...` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof arg !== 'string' && typeof arg !== 'object') continue

      // If it's a glob pattern, it counts as a file argument
      // 工具调用在这里按实际状态进入对应分支。
      if (
        typeof arg === 'object' &&
        arg !== null &&
        'op' in arg &&
        arg.op === 'glob'
      ) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }

      // Skip non-string arguments that aren't glob patterns
      // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof arg !== 'string') continue

      // Handle -e flag followed by expression
      // 只有 `(arg === '-e' || arg === '--expression') && i + 1 < parsed.length` 满足时，工具调用才执行该分支。
      if ((arg === '-e' || arg === '--expression') && i + 1 < parsed.length) {
        // hasEFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        hasEFlag = true
        // Bash 工具 sed Validation在这里处理 `i++ // Skip the next argument since it's the expression`，完成这一小步状态转换。
        i++ // Skip the next argument since it's the expression
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Handle --expression=value format
      // 满足 `arg.startsWith('--expression=')` 时，工具调用执行该分支。
      if (arg.startsWith('--expression=')) {
        // hasEFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        hasEFlag = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Handle -e=value format (non-standard but defense in depth)
      // 满足 `arg.startsWith('-e=')` 时，工具调用执行该分支。
      if (arg.startsWith('-e=')) {
        // hasEFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        hasEFlag = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Skip other flags
      // 满足 `arg.startsWith('-')` 时，工具调用执行该分支。
      if (arg.startsWith('-')) continue

      // Bash 工具 sed Validation在这里处理 `argCount++`，完成这一小步状态转换。
      argCount++

      // If we used -e flags, ALL non-flag arguments are file arguments
      // 满足 `hasEFlag` 时，工具调用执行该分支。
      if (hasEFlag) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }

      // If we didn't use -e flags, the first non-flag argument is the sed expression,
      // so we need more than 1 non-flag argument to have file arguments
      // 满足 `argCount > 1` 时，工具调用执行该分支。
      if (argCount > 1) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }

    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } catch (_error) {
    // 返回 `true // Assume dangerous if parsing fails`，作为工具调用这次计算的结果。
    return true // Assume dangerous if parsing fails
  }
}

/**
 * Extract sed expressions from command, ignoring flags and filenames
 * @param command Full sed command
 * @returns Array of sed expressions to check for dangerous operations
 * @throws Error if parsing fails
 * @internal Exported for testing
 */
// extractSedExpressions 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractSedExpressions(command: string): string[] {
  // expressions 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const expressions: string[] = []

  // Calculate withoutSed by trimming off the first N characters (removing 'sed ')
  // sedMatch匹配`command.match`，供工具调用后续处理使用。
  const sedMatch = command.match(/^\s*sed\s+/)
  // sedMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!sedMatch) return expressions

  // withoutSed格式化`command.slice`，供工具调用后续处理使用。
  const withoutSed = command.slice(sedMatch[0].length)

  // Reject dangerous flag combinations like -ew, -eW, -ee, -we (combined -e/-w with dangerous commands)
  // 只有 `/-e[wWe]/.test(withoutSed) || /-w[eE]/.test(withoutSed)` 满足时，工具调用才执行该分支。
  if (/-e[wWe]/.test(withoutSed) || /-w[eE]/.test(withoutSed)) {
    // 抛出 new Error('Dangerous flag combination detected')，阻止工具调用在无效状态下继续运行。
    throw new Error('Dangerous flag combination detected')
  }

  // Use shell-quote to parse the arguments properly
  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(withoutSed)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) {
    // Malformed shell syntax - throw error to be caught by caller
    // 抛出 new Error(`Malformed shell syntax: ${parseResult.error}`)，阻止工具调用在无效状态下继续运行。
    throw new Error(`Malformed shell syntax: ${parseResult.error}`)
  }
  // 解析结果解析`parseResult.tokens` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
  const parsed = parseResult.tokens
  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // foundEFlag标记Bash 工具 sed Validation是否启用对应路径。
    let foundEFlag = false
    // foundExpression标记Bash 工具 sed Validation是否启用对应路径。
    let foundExpression = false

    // 按索引扫描 `parsed.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < parsed.length; i++) {
      // 当前参数解析`parsed[i]` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
      const arg = parsed[i]

      // Skip non-string arguments (like control operators)
      // `typeof arg` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof arg !== 'string') continue

      // Handle -e flag followed by expression
      // 只有 `(arg === '-e' || arg === '--expression') && i + 1 < parsed.length` 满足时，工具调用才执行该分支。
      if ((arg === '-e' || arg === '--expression') && i + 1 < parsed.length) {
        // foundEFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        foundEFlag = true
        // nextArg解析`parsed[i + 1]` 整理出中间结果，供Bash 工具 sed Validation后续步骤使用。
        const nextArg = parsed[i + 1]
        // 当 `typeof nextArg` 匹配 `'string'` 时，工具调用执行对应分支。
        if (typeof nextArg === 'string') {
          // expressions 集合追加新条目，保持收集顺序与输入顺序一致。
          expressions.push(nextArg)
          // Bash 工具 sed Validation在这里处理 `i++ // Skip the next argument since we consumed it`，完成这一小步状态转换。
          i++ // Skip the next argument since we consumed it
        }
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Handle --expression=value format
      // 满足 `arg.startsWith('--expression=')` 时，工具调用执行该分支。
      if (arg.startsWith('--expression=')) {
        // foundEFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        foundEFlag = true
        // expressions 集合追加新条目，保持收集顺序与输入顺序一致。
        expressions.push(arg.slice('--expression='.length))
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Handle -e=value format (non-standard but defense in depth)
      // 满足 `arg.startsWith('-e=')` 时，工具调用执行该分支。
      if (arg.startsWith('-e=')) {
        // foundEFlag更新为 `true`，确保Bash 工具后续读取最新状态。
        foundEFlag = true
        // expressions 集合追加新条目，保持收集顺序与输入顺序一致。
        expressions.push(arg.slice('-e='.length))
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // Skip other flags
      // 满足 `arg.startsWith('-')` 时，工具调用执行该分支。
      if (arg.startsWith('-')) continue

      // If we haven't found any -e flags, the first non-flag argument is the sed expression
      // 只有 `!foundEFlag && !foundExpression` 满足时，工具调用才执行该分支。
      if (!foundEFlag && !foundExpression) {
        // expressions 集合追加新条目，保持收集顺序与输入顺序一致。
        expressions.push(arg)
        // foundExpression更新为 `true`，确保Bash 工具后续读取最新状态。
        foundExpression = true
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }

      // If we've already found -e flags or a standalone expression,
      // remaining non-flag arguments are filenames
      // 结束这个分支或循环，避免工具调用继续落入后续路径。
      break
    }
  } catch (error) {
    // If shell-quote parsing fails, treat the sed command as unsafe
    // 抛出 new Error(，阻止工具调用在无效状态下继续运行。
    throw new Error(
      `Failed to parse sed command: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }

  // 返回 `expressions`，作为工具调用这次计算的结果。
  return expressions
}

/**
 * Check if a sed expression contains dangerous operations (denylist)
 * @param expression Single sed expression (without quotes)
 * @returns true if dangerous, false if safe
 */
// containsDangerousOperations 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function containsDangerousOperations(expression: string): boolean {
  // cmd 命令数据格式化`expression.trim`，供工具调用后续处理使用。
  const cmd = expression.trim()
  // cmd 命令数据缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!cmd) return false

  // CONSERVATIVE REJECTIONS: Broadly reject patterns that could be dangerous
  // When in doubt, treat as unsafe

  // Reject non-ASCII characters (Unicode homoglyphs, combining chars, etc.)
  // Examples: ｗ (fullwidth), ᴡ (small capital), w̃ (combining tilde)
  // Check for characters outside ASCII range (0x01-0x7F, excluding null byte)
  // eslint-disable-next-line no-control-regex
  // 满足 `/[^\x01-\x7F]/.test(cmd)` 时，工具调用执行该分支。
  if (/[^\x01-\x7F]/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject curly braces (blocks) - too complex to parse
  // 只有 `cmd.includes('{') || cmd.includes('}')` 满足时，工具调用才执行该分支。
  if (cmd.includes('{') || cmd.includes('}')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject newlines - multi-line commands are too complex
  // 满足 `cmd.includes('\n')` 时，工具调用执行该分支。
  if (cmd.includes('\n')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject comments (# not immediately after s command)
  // Comments look like: #comment or start with #
  // Delimiter looks like: s#pattern#replacement#
  // hashIndex 索引保存`cmd.indexOf`，供工具调用后续处理使用。
  const hashIndex = cmd.indexOf('#')
  // `hashIndex` 与 `-1 && !(hashIndex > 0 && cmd[ha...` 不一致时刷新派生状态，避免使用过期结果。
  if (hashIndex !== -1 && !(hashIndex > 0 && cmd[hashIndex - 1] === 's')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject negation operator
  // Negation can appear: at start (!/pattern/), after address (/pattern/!, 1,10!, $!)
  // Delimiter looks like: s!pattern!replacement! (has 's' before it)
  // 只有 `/^!/.test(cmd) || /[/\d$]!/.test(cmd)` 满足时，工具调用才执行该分支。
  if (/^!/.test(cmd) || /[/\d$]!/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject tilde in GNU step address format (digit~digit, ,~digit, or $~digit)
  // Allow whitespace around tilde
  // 满足 `/\d\s*~\s*\d|,\s*~\s*\d|\$\s*~\s*\d/.test(cmd)` 时，工具调用执行该分支。
  if (/\d\s*~\s*\d|,\s*~\s*\d|\$\s*~\s*\d/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject comma at start (bare comma is shorthand for 1,$ address range)
  // 满足 `/^,/.test(cmd)` 时，工具调用执行该分支。
  if (/^,/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject comma followed by +/- (GNU offset addresses)
  // 满足 `/,\s*[+-]/.test(cmd)` 时，工具调用执行该分支。
  if (/,\s*[+-]/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject backslash tricks:
  // 1. s\ (substitution with backslash delimiter)
  // 2. \X where X could be an alternate delimiter (|, #, %, etc.) - not regex escapes
  // 只有 `/s\\/.test(cmd) || /\\[|#%@]/.test(cmd)` 满足时，工具调用才执行该分支。
  if (/s\\/.test(cmd) || /\\[|#%@]/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject escaped slashes followed by w/W (patterns like /\/path\/to\/file/w)
  // 满足 `/\\\/.*[wW]/.test(cmd)` 时，工具调用执行该分支。
  if (/\\\/.*[wW]/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject malformed/suspicious patterns we don't understand
  // If there's a slash followed by non-slash chars, then whitespace, then dangerous commands
  // Examples: /pattern w file, /pattern e cmd, /foo X;w file
  // 满足 `/\/[^/]*\s+[wWeE]/.test(cmd)` 时，工具调用执行该分支。
  if (/\/[^/]*\s+[wWeE]/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Reject malformed substitution commands that don't follow normal pattern
  // Examples: s/foobareoutput.txt (missing delimiters), s/foo/bar//w (extra delimiter)
  // 只有 `/^s\//.test(cmd) && !/^s\/[^/]*\/[^/]*\/[^/]*$/.test(cmd)` 满足时，工具调用才执行该分支。
  if (/^s\//.test(cmd) && !/^s\/[^/]*\/[^/]*\/[^/]*$/.test(cmd)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // PARANOID: Reject any command starting with 's' that ends with dangerous chars (w, W, e, E)
  // and doesn't match our known safe substitution pattern. This catches malformed s commands
  // with non-slash delimiters that might be trying to use dangerous flags.
  // 只有 `/^s./.test(cmd) && /[wWeE]$/.test(cmd)` 满足时，工具调用才执行该分支。
  if (/^s./.test(cmd) && /[wWeE]$/.test(cmd)) {
    // Check if it's a properly formed substitution (any delimiter, not just /)
    // properSubst保存`s`，供工具调用后续处理使用。
    const properSubst = /^s([^\\\n]).*?\1.*?\1[^wWeE]*$/.test(cmd)
    // properSubst缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!properSubst) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check for dangerous write commands
  // Patterns: [address]w filename, [address]W filename, /pattern/w filename, /pattern/W filename
  // Simplified to avoid exponential backtracking (CodeQL issue)
  // Check for w/W in contexts where it would be a command (with optional whitespace)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    /^[wW]\s*\S+/.test(cmd) || // At start: w file
    /^\d+\s*[wW]\s*\S+/.test(cmd) || // After line number: 1w file or 1 w file
    /^\$\s*[wW]\s*\S+/.test(cmd) || // After $: $w file or $ w file
    /^\/[^/]*\/[IMim]*\s*[wW]\s*\S+/.test(cmd) || // After pattern: /pattern/w file
    /^\d+,\d+\s*[wW]\s*\S+/.test(cmd) || // After range: 1,10w file
    /^\d+,\$\s*[wW]\s*\S+/.test(cmd) || // After range: 1,$w file
    /^\/[^/]*\/[IMim]*,\/[^/]*\/[IMim]*\s*[wW]\s*\S+/.test(cmd) // After pattern range: /s/,/e/w file
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for dangerous execute commands
  // Patterns: [address]e [command], /pattern/e [command], or commands starting with e
  // Simplified to avoid exponential backtracking (CodeQL issue)
  // Check for e in contexts where it would be a command (with optional whitespace)
  // 工具调用在这里按实际状态进入对应分支。
  if (
    /^e/.test(cmd) || // At start: e cmd
    /^\d+\s*e/.test(cmd) || // After line number: 1e or 1 e
    /^\$\s*e/.test(cmd) || // After $: $e or $ e
    /^\/[^/]*\/[IMim]*\s*e/.test(cmd) || // After pattern: /pattern/e
    /^\d+,\d+\s*e/.test(cmd) || // After range: 1,10e
    /^\d+,\$\s*e/.test(cmd) || // After range: 1,$e
    /^\/[^/]*\/[IMim]*,\/[^/]*\/[IMim]*\s*e/.test(cmd) // After pattern range: /s/,/e/e
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for substitution commands with dangerous flags
  // Pattern: s<delim>pattern<delim>replacement<delim>flags where flags contain w or e
  // Per POSIX, sed allows any character except backslash and newline as delimiter
  // substitutionMatch匹配`cmd.match`，供工具调用后续处理使用。
  const substitutionMatch = cmd.match(/s([^\\\n]).*?\1.*?\1(.*?)$/)
  // 满足 `substitutionMatch` 时，工具调用执行该分支。
  if (substitutionMatch) {
    // flags 集合标记Bash 工具 sed Validation是否启用对应路径。
    const flags = substitutionMatch[2] || ''

    // Check for write flag: s/old/new/w filename or s/old/new/gw filename
    // 只有 `flags.includes('w') || flags.includes('W')` 满足时，工具调用才执行该分支。
    if (flags.includes('w') || flags.includes('W')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // Check for execute flag: s/old/new/e or s/old/new/ge
    // 只有 `flags.includes('e') || flags.includes('E')` 满足时，工具调用才执行该分支。
    if (flags.includes('e') || flags.includes('E')) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // Check for y (transliterate) command followed by dangerous operations
  // Pattern: y<delim>source<delim>dest<delim> followed by anything
  // The y command uses same delimiter syntax as s command
  // PARANOID: Reject any y command that has w/W/e/E anywhere after the delimiters
  // yCommandMatch 命令数据匹配`cmd.match`，供工具调用后续处理使用。
  const yCommandMatch = cmd.match(/y([^\\\n])/)
  // 满足 `yCommandMatch` 时，工具调用执行该分支。
  if (yCommandMatch) {
    // If we see a y command, check if there's any w, W, e, or E in the entire command
    // This is paranoid but safe - y commands are rare and w/e after y is suspicious
    // 满足 `/[wWeE]/.test(cmd)` 时，工具调用执行该分支。
    if (/[wWeE]/.test(cmd)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Cross-cutting validation step for sed commands.
 *
 * This is a constraint check that blocks dangerous sed operations regardless of mode.
 * It returns 'passthrough' for non-sed commands or safe sed commands,
 * and 'ask' for dangerous sed operations (w/W/e/E commands).
 *
 * @param input - Object containing the command string
 * @param toolPermissionContext - Context containing mode and permissions
 * @returns
 * - 'ask' if any sed command contains dangerous operations
 * - 'passthrough' if no sed commands or all are safe
 */
// checkSedConstraints 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkSedConstraints(
  input: { command: string },
  toolPermissionContext: ToolPermissionContext,
): PermissionResult {
  // commands 命令数据格式化`splitCommand_DEPRECATED`，供工具调用后续处理使用。
  const commands = splitCommand_DEPRECATED(input.command)

  // 按顺序遍历 `commands` 中的cmd 命令数据，逐个交给工具调用处理。
  for (const cmd of commands) {
    // Skip non-sed commands
    // trimmed格式化`cmd.trim`，供工具调用后续处理使用。
    const trimmed = cmd.trim()
    // 基础命令格式化`trimmed.split`，供工具调用后续处理使用。
    const baseCmd = trimmed.split(/\s+/)[0]
    // `baseCmd` 与 `'sed'` 不一致时刷新派生状态，避免使用过期结果。
    if (baseCmd !== 'sed') {
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // In acceptEdits mode, allow file writes (-i flag) but still block dangerous operations
    // allowFileWrites 文件数据标记Bash 工具 sed Validation是否启用对应路径。
    const allowFileWrites = toolPermissionContext.mode === 'acceptEdits'

    // isAllowed记录 `sedCommandIsAllowedByAllowlist` 是否成立，工具调用随后按该结果分支。
    const isAllowed = sedCommandIsAllowedByAllowlist(trimmed, {
      allowFileWrites,
    })

    // isAllowed缺失时直接走兜底路径，避免工具调用使用无效输入。
    if (!isAllowed) {
      // 返回结构化结果，集中表达工具调用已经整理出的状态。
      return {
        behavior: 'ask',
        message:
          'sed command requires approval (contains potentially dangerous operations)',
        decisionReason: {
          type: 'other',
          reason:
            'sed command contains operations that require explicit approval (e.g., write commands, execute commands)',
        },
      }
    }
  }

  // No dangerous sed commands found (or no sed commands at all)
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    behavior: 'passthrough',
    message: 'No dangerous sed operations detected',
  }
}
