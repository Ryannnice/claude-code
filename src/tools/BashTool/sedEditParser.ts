/**
 * Parser for sed edit commands (-i flag substitutions)
 * Extracts file paths and substitution patterns to enable file-edit-style rendering
 */

// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes } from 'crypto'
// 复用 tryParseShellCommand 工具函数，把通用处理留在 ../../utils/bash/shellQuote.js 中维护。
import { tryParseShellCommand } from '../../utils/bash/shellQuote.js'

// BRE→ERE conversion placeholders (null-byte sentinels, never appear in user input)
// BACKSLASH_PLACEHOLDER保存`'\x00BACKSLASH\x00'`，作为后续固定文本处理的输入。
const BACKSLASH_PLACEHOLDER = '\x00BACKSLASH\x00'
// PLUS_PLACEHOLDER固定为 `'\x00PLUS\x00'`，作为Bash 工具 sed Edit Parser后续展示或比较的基准。
const PLUS_PLACEHOLDER = '\x00PLUS\x00'
// QUESTION_PLACEHOLDER保存`'\x00QUESTION\x00'`，作为后续固定文本处理的输入。
const QUESTION_PLACEHOLDER = '\x00QUESTION\x00'
// PIPE_PLACEHOLDER固定为 `'\x00PIPE\x00'`，作为Bash 工具 sed Edit Parser后续展示或比较的基准。
const PIPE_PLACEHOLDER = '\x00PIPE\x00'
// LPAREN_PLACEHOLDER保存`'\x00LPAREN\x00'`，作为后续固定文本处理的输入。
const LPAREN_PLACEHOLDER = '\x00LPAREN\x00'
// RPAREN_PLACEHOLDER固定为 `'\x00RPAREN\x00'`，作为Bash 工具 sed Edit Parser后续展示或比较的基准。
const RPAREN_PLACEHOLDER = '\x00RPAREN\x00'
// BACKSLASH_PLACEHOLDER_RE匹配`RegExp`，供工具调用后续处理使用。
const BACKSLASH_PLACEHOLDER_RE = new RegExp(BACKSLASH_PLACEHOLDER, 'g')
// PLUS_PLACEHOLDER_RE匹配`RegExp`，供工具调用后续处理使用。
const PLUS_PLACEHOLDER_RE = new RegExp(PLUS_PLACEHOLDER, 'g')
// QUESTION_PLACEHOLDER_RE匹配`RegExp`，供工具调用后续处理使用。
const QUESTION_PLACEHOLDER_RE = new RegExp(QUESTION_PLACEHOLDER, 'g')
// PIPE_PLACEHOLDER_RE匹配`RegExp`，供工具调用后续处理使用。
const PIPE_PLACEHOLDER_RE = new RegExp(PIPE_PLACEHOLDER, 'g')
// LPAREN_PLACEHOLDER_RE匹配`RegExp`，供工具调用后续处理使用。
const LPAREN_PLACEHOLDER_RE = new RegExp(LPAREN_PLACEHOLDER, 'g')
// RPAREN_PLACEHOLDER_RE匹配`RegExp`，供工具调用后续处理使用。
const RPAREN_PLACEHOLDER_RE = new RegExp(RPAREN_PLACEHOLDER, 'g')

// SedEditInfo 固化工具调用里传递的数据形状，帮助调用方按同一结构读写字段。
export type SedEditInfo = {
  /** The file path being edited */
  filePath: string
  /** The search pattern (regex) */
  pattern: string
  /** The replacement string */
  replacement: string
  /** Substitution flags (g, i, etc.) */
  flags: string
  /** Whether to use extended regex (-E or -r flag) */
  extendedRegex: boolean
}

/**
 * Check if a command is a sed in-place edit command
 * Returns true only for simple sed -i 's/pattern/replacement/flags' file commands
 */
// isSedInPlaceEdit 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isSedInPlaceEdit(command: string): boolean {
  // info解析`parseSedEditCommand`，供工具调用后续处理使用。
  const info = parseSedEditCommand(command)
  // 返回 `info !== null`，作为工具调用这次计算的结果。
  return info !== null
}

/**
 * Parse a sed edit command and extract the edit information
 * Returns null if the command is not a valid sed in-place edit
 */
// parseSedEditCommand 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSedEditCommand(command: string): SedEditInfo | null {
  // trimmed格式化`command.trim`，供工具调用后续处理使用。
  const trimmed = command.trim()

  // Must start with sed
  // sedMatch匹配`trimmed.match`，供工具调用后续处理使用。
  const sedMatch = trimmed.match(/^\s*sed\s+/)
  // sedMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!sedMatch) return null

  // withoutSed格式化`trimmed.slice`，供工具调用后续处理使用。
  const withoutSed = trimmed.slice(sedMatch[0].length)
  // parseResult保存`tryParseShellCommand`，供工具调用后续处理使用。
  const parseResult = tryParseShellCommand(withoutSed)
  // parseResult.success 集合缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!parseResult.success) return null
  // token 列表解析`parseResult.tokens` 整理出中间结果，供Bash 工具 sed Edit Parser后续步骤使用。
  const tokens = parseResult.tokens

  // Extract string tokens only
  // 参数列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const args: string[] = []
  // 按顺序遍历 `tokens` 中的token，逐个交给工具调用处理。
  for (const token of tokens) {
    // 当 `typeof token` 匹配 `'string'` 时，工具调用执行对应分支。
    if (typeof token === 'string') {
      // 参数列表追加新条目，保持收集顺序与输入顺序一致。
      args.push(token)
    // Bash 工具 sed Edit Parser在这里处理 `} else if (`，完成这一小步状态转换。
    } else if (
      typeof token === 'object' &&
      token !== null &&
      'op' in token &&
      token.op === 'glob'
    ) {
      // Glob patterns are too complex for this simple parser
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
  }

  // Parse flags and arguments
  // hasInPlaceFlag标记Bash 工具 sed Edit Parser是否启用对应路径。
  let hasInPlaceFlag = false
  // extendedRegex标记Bash 工具 sed Edit Parser是否启用对应路径。
  let extendedRegex = false
  // expression保存`null`，作为后续空值处理的输入。
  let expression: string | null = null
  // 文件路径保存`null`，作为后续空值处理的输入。
  let filePath: string | null = null

  // i保存`0`，供后续判断或组装使用。
  let i = 0
  // while 使用 i < args.length 完成工具调用里的对应操作。
  while (i < args.length) {
    // 当前参数 命名 `args[i]!`，让后续代码直接表达这个值的用途。
    const arg = args[i]!

    // Handle -i flag (with or without backup suffix)
    // 当 `arg` 匹配 `'-i' || arg === '--in-place'` 时，工具调用执行对应分支。
    if (arg === '-i' || arg === '--in-place') {
      // hasInPlaceFlag更新为 `true`，确保Bash 工具后续读取最新状态。
      hasInPlaceFlag = true
      // Bash 工具 sed Edit Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
      // On macOS, -i requires a suffix argument (even if empty string)
      // Check if next arg looks like a backup suffix (empty, or starts with dot)
      // Don't consume flags (-E, -r) or sed expressions (starting with s, y, d)
      // 满足 `i < args.length` 时，工具调用执行该分支。
      if (i < args.length) {
        // nextArg保存`args[i]`，供Bash 工具 sed Edit Parser后续判断或输出使用。
        const nextArg = args[i]
        // If next arg is empty string or starts with dot, it's a backup suffix
        // 工具调用在这里按实际状态进入对应分支。
        if (
          typeof nextArg === 'string' &&
          !nextArg.startsWith('-') &&
          (nextArg === '' || nextArg.startsWith('.'))
        ) {
          // Bash 工具 sed Edit Parser在这里处理 `i++ // Skip the backup suffix`，完成这一小步状态转换。
          i++ // Skip the backup suffix
        }
      }
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }
    // 满足 `arg.startsWith('-i')` 时，工具调用执行该分支。
    if (arg.startsWith('-i')) {
      // -i.bak or similar (inline suffix)
      // hasInPlaceFlag更新为 `true`，确保Bash 工具后续读取最新状态。
      hasInPlaceFlag = true
      // Bash 工具 sed Edit Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Handle extended regex flags
    // 只有 `arg === '-E' || arg === '-r' || arg === '--regexp` 满足时，工具调用才执行该分支。
    if (arg === '-E' || arg === '-r' || arg === '--regexp-extended') {
      // extendedRegex更新为 `true`，确保Bash 工具后续读取最新状态。
      extendedRegex = true
      // Bash 工具 sed Edit Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Handle -e flag with expression
    // 当 `arg` 匹配 `'-e' || arg === '--expressi...` 时，工具调用执行对应分支。
    if (arg === '-e' || arg === '--expression') {
      // 只有 `i + 1 < args.length && typeof args[i + 1] === 'st` 满足时，工具调用才执行该分支。
      if (i + 1 < args.length && typeof args[i + 1] === 'string') {
        // Only support single expression
        // `expression` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
        if (expression !== null) return null
        // expression更新为 `args[i + 1]!`，确保Bash 工具后续读取最新状态。
        expression = args[i + 1]!
        // Bash 工具 sed Edit Parser在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理工具调用中的下一轮循环。
        continue
      }
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }
    // 满足 `arg.startsWith('--expression=')` 时，工具调用执行该分支。
    if (arg.startsWith('--expression=')) {
      // `expression` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (expression !== null) return null
      // expression更新为 `arg.slice('--expression='.length)`，确保Bash 工具后续读取最新状态。
      expression = arg.slice('--expression='.length)
      // Bash 工具 sed Edit Parser在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // Skip other flags we don't understand
    // 满足 `arg.startsWith('-')` 时，工具调用执行该分支。
    if (arg.startsWith('-')) {
      // Unknown flag - not safe to parse
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }

    // Non-flag argument
    // 满足 `expression === null` 时，工具调用执行该分支。
    if (expression === null) {
      // First non-flag arg is the expression
      // expression更新为 `arg`，确保Bash 工具后续读取最新状态。
      expression = arg
    // Bash 工具 sed Edit Parser在这里处理 `} else if (filePath === null) {`，完成这一小步状态转换。
    } else if (filePath === null) {
      // Second non-flag arg is the file path
      // 文件路径更新为 `arg`，确保Bash 工具后续读取最新状态。
      filePath = arg
    } else {
      // More than one file - not supported for simple rendering
      // 返回 `null`，作为工具调用这次计算的结果。
      return null
    }

    // Bash 工具 sed Edit Parser在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Must have -i flag, expression, and file path
  // 只有 `!hasInPlaceFlag || !expression || !filePath` 满足时，工具调用才执行该分支。
  if (!hasInPlaceFlag || !expression || !filePath) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // Parse the substitution expression: s/pattern/replacement/flags
  // Only support / as delimiter for simplicity
  // substMatch匹配`expression.match`，供工具调用后续处理使用。
  const substMatch = expression.match(/^s\//)
  // substMatch缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!substMatch) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // rest格式化`expression.slice`，供工具调用后续处理使用。
  const rest = expression.slice(2) // Skip 's/'

  // Find pattern and replacement by tracking escaped characters
  // pattern 命名 `''`，让后续代码直接表达这个值的用途。
  let pattern = ''
  // replacement 命名 `''`，让后续代码直接表达这个值的用途。
  let replacement = ''
  // flags 集合保存`''`，作为后续固定文本处理的输入。
  let flags = ''
  // 状态固定为 `'pattern'`，作为Bash 工具 sed Edit Parser后续展示或比较的基准。
  let state: 'pattern' | 'replacement' | 'flags' = 'pattern'
  // j保存`0`，供后续判断或组装使用。
  let j = 0

  // while 使用 j < rest.length 完成工具调用里的对应操作。
  while (j < rest.length) {
    // char保存`rest[j]!`，供Bash 工具 sed Edit Parser后续判断或输出使用。
    const char = rest[j]!

    // 只有 `char === '\\' && j + 1 < rest.length` 满足时，工具调用才执行该分支。
    if (char === '\\' && j + 1 < rest.length) {
      // Escaped character
      // 当 `state` 匹配 `'pattern'` 时，工具调用执行对应分支。
      if (state === 'pattern') {
        // Bash 工具 sed Edit Parser在这里处理 `pattern += char + rest[j + 1]`，完成这一小步状态转换。
        pattern += char + rest[j + 1]
      // Bash 工具 sed Edit Parser在这里处理 `} else if (state === 'replacement') {`，完成这一小步状态转换。
      } else if (state === 'replacement') {
        // Bash 工具 sed Edit Parser在这里处理 `replacement += char + rest[j + 1]`，完成这一小步状态转换。
        replacement += char + rest[j + 1]
      } else {
        // Bash 工具 sed Edit Parser在这里处理 `flags += char + rest[j + 1]`，完成这一小步状态转换。
        flags += char + rest[j + 1]
      }
      // Bash 工具 sed Edit Parser在这里处理 `j += 2`，完成这一小步状态转换。
      j += 2
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 当 `char` 匹配 `'/'` 时，工具调用执行对应分支。
    if (char === '/') {
      // 当 `state` 匹配 `'pattern'` 时，工具调用执行对应分支。
      if (state === 'pattern') {
        // 状态更新为 `'replacement'`，确保Bash 工具后续读取最新状态。
        state = 'replacement'
      // Bash 工具 sed Edit Parser在这里处理 `} else if (state === 'replacement') {`，完成这一小步状态转换。
      } else if (state === 'replacement') {
        // 状态更新为 `'flags'`，确保Bash 工具后续读取最新状态。
        state = 'flags'
      } else {
        // Extra delimiter in flags - unexpected
        // 返回 `null`，作为工具调用这次计算的结果。
        return null
      }
      // Bash 工具 sed Edit Parser在这里处理 `j++`，完成这一小步状态转换。
      j++
      // 跳过当前项，继续处理工具调用中的下一轮循环。
      continue
    }

    // 当 `state` 匹配 `'pattern'` 时，工具调用执行对应分支。
    if (state === 'pattern') {
      // Bash 工具 sed Edit Parser在这里处理 `pattern += char`，完成这一小步状态转换。
      pattern += char
    // Bash 工具 sed Edit Parser在这里处理 `} else if (state === 'replacement') {`，完成这一小步状态转换。
    } else if (state === 'replacement') {
      // Bash 工具 sed Edit Parser在这里处理 `replacement += char`，完成这一小步状态转换。
      replacement += char
    } else {
      // Bash 工具 sed Edit Parser在这里处理 `flags += char`，完成这一小步状态转换。
      flags += char
    }
    // Bash 工具 sed Edit Parser在这里处理 `j++`，完成这一小步状态转换。
    j++
  }

  // Must have found all three parts (pattern, replacement delimiter, and optional flags)
  // `state` 与 `'flags'` 不一致时刷新派生状态，避免使用过期结果。
  if (state !== 'flags') {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // Validate flags - only allow safe substitution flags
  // validFlags 集合读取 `/^[gpimIM1-9]*$/` 对应条目，后续围绕该成员继续处理。
  const validFlags = /^[gpimIM1-9]*$/
  // 满足 `!validFlags.test(flags)` 时，工具调用执行该分支。
  if (!validFlags.test(flags)) {
    // 返回 `null`，作为工具调用这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return {
    filePath,
    pattern,
    replacement,
    flags,
    extendedRegex,
  }
}

/**
 * Apply a sed substitution to file content
 * Returns the new content after applying the substitution
 */
// applySedSubstitution 封装Bash 工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applySedSubstitution(
  content: string,
  sedInfo: SedEditInfo,
): string {
  // Convert sed pattern to JavaScript regex
  // regexFlags 集合 命名 `''`，让后续代码直接表达这个值的用途。
  let regexFlags = ''

  // Handle global flag
  // 满足 `sedInfo.flags.includes('g')` 时，工具调用执行该分支。
  if (sedInfo.flags.includes('g')) {
    // Bash 工具 sed Edit Parser在这里处理 `regexFlags += 'g'`，完成这一小步状态转换。
    regexFlags += 'g'
  }

  // Handle case-insensitive flag (i or I in sed)
  // 只有 `sedInfo.flags.includes('i') || sedInfo.flags.includes('I')` 满足时，工具调用才执行该分支。
  if (sedInfo.flags.includes('i') || sedInfo.flags.includes('I')) {
    // Bash 工具 sed Edit Parser在这里处理 `regexFlags += 'i'`，完成这一小步状态转换。
    regexFlags += 'i'
  }

  // Handle multiline flag (m or M in sed)
  // 只有 `sedInfo.flags.includes('m') || sedInfo.flags.includes('M')` 满足时，工具调用才执行该分支。
  if (sedInfo.flags.includes('m') || sedInfo.flags.includes('M')) {
    // Bash 工具 sed Edit Parser在这里处理 `regexFlags += 'm'`，完成这一小步状态转换。
    regexFlags += 'm'
  }

  // Convert sed pattern to JavaScript regex pattern
  // jsPattern保存`sedInfo.pattern`，供后续判断或组装使用。
  let jsPattern = sedInfo.pattern
    // Unescape \/ to /
    .replace(/\\\//g, '/')

  // In BRE mode (no -E flag), metacharacters have opposite escaping:
  // BRE: \+ means "one or more", + is literal
  // ERE/JS: + means "one or more", \+ is literal
  // We need to convert BRE escaping to ERE for JavaScript regex
  // sedInfo.extendedRegex缺失时直接走兜底路径，避免工具调用使用无效输入。
  if (!sedInfo.extendedRegex) {
    // jsPattern更新为 `jsPattern`，确保Bash 工具后续读取最新状态。
    jsPattern = jsPattern
      // Step 1: Protect literal backslashes (\\) first - in both BRE and ERE, \\ is literal backslash
      .replace(/\\\\/g, BACKSLASH_PLACEHOLDER)
      // Step 2: Replace escaped metacharacters with placeholders (these should become unescaped in JS)
      .replace(/\\\+/g, PLUS_PLACEHOLDER)
      .replace(/\\\?/g, QUESTION_PLACEHOLDER)
      .replace(/\\\|/g, PIPE_PLACEHOLDER)
      .replace(/\\\(/g, LPAREN_PLACEHOLDER)
      .replace(/\\\)/g, RPAREN_PLACEHOLDER)
      // Step 3: Escape unescaped metacharacters (these are literal in BRE)
      .replace(/\+/g, '\\+')
      .replace(/\?/g, '\\?')
      .replace(/\|/g, '\\|')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      // Step 4: Replace placeholders with their JS equivalents
      .replace(BACKSLASH_PLACEHOLDER_RE, '\\\\')
      .replace(PLUS_PLACEHOLDER_RE, '+')
      .replace(QUESTION_PLACEHOLDER_RE, '?')
      .replace(PIPE_PLACEHOLDER_RE, '|')
      .replace(LPAREN_PLACEHOLDER_RE, '(')
      .replace(RPAREN_PLACEHOLDER_RE, ')')
  }

  // Unescape sed-specific escapes in replacement
  // Convert \n to newline, & to $& (match), etc.
  // Use a unique placeholder with random salt to prevent injection attacks
  // salt保存`randomBytes`，供工具调用后续处理使用。
  const salt = randomBytes(8).toString('hex')
  // ESCAPED_AMP_PLACEHOLDER 命名 ``___ESCAPED_AMPERSAND_${salt}___``，让后续代码直接表达这个值的用途。
  const ESCAPED_AMP_PLACEHOLDER = `___ESCAPED_AMPERSAND_${salt}___`
  // jsReplacement 命名 `sedInfo.replacement`，让后续代码直接表达这个值的用途。
  const jsReplacement = sedInfo.replacement
    // Unescape \/ to /
    .replace(/\\\//g, '/')
    // First escape \& to a placeholder
    .replace(/\\&/g, ESCAPED_AMP_PLACEHOLDER)
    // Convert & to $& (full match) - use $$& to get literal $& in output
    .replace(/&/g, '$$&')
    // Convert placeholder back to literal &
    .replace(new RegExp(ESCAPED_AMP_PLACEHOLDER, 'g'), '&')

  // 保护这一段可能失败的工具调用操作，确保异常能进入相邻错误处理。
  try {
    // regex匹配`RegExp`，供工具调用后续处理使用。
    const regex = new RegExp(jsPattern, regexFlags)
    // 返回 `content.replace(regex, jsReplacement)`，作为工具调用这次计算的结果。
    return content.replace(regex, jsReplacement)
  } catch {
    // If regex is invalid, return original content
    // 返回 `content`，作为工具调用这次计算的结果。
    return content
  }
}
