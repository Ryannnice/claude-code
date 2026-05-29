// 类型依赖 { SuggestionItem } 来自 src/components/PromptInput/PromptInputFooterSuggestions.js，用于校准共享工具的数据契约。
import type { SuggestionItem } from 'src/components/PromptInput/PromptInputFooterSuggestions.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ParseEntry,
  quote,
  tryParseShellCommand,
} from '../bash/shellQuote.js'
// 引入 logForDebugging，将 ../debug.js 中已经封装好的能力接到本文件流程里。
import { logForDebugging } from '../debug.js'
// 引入 getShellType，将 ../localInstaller.js 中已经封装好的能力接到本文件流程里。
import { getShellType } from '../localInstaller.js'
// 引入 * as Shell，将 ../Shell.js 中已经封装好的能力接到本文件流程里。
import * as Shell from '../Shell.js'

// Constants
// MAX_SHELL_COMPLETIONS 集合 命名 `15`，让后续代码直接表达这个值的用途。
const MAX_SHELL_COMPLETIONS = 15
// SHELL_COMPLETION_TIMEOUT_MS 集合保存`1000`，供后续判断或组装使用。
const SHELL_COMPLETION_TIMEOUT_MS = 1000
// COMMAND_OPERATORS 命令数据 聚合成有序列表，保持后续遍历顺序稳定。
const COMMAND_OPERATORS = ['|', '||', '&&', ';'] as const

// ShellCompletionType 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellCompletionType = 'command' | 'variable' | 'file'

// InputContext 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type InputContext = {
  prefix: string
  completionType: ShellCompletionType
}

/**
 * Check if a parsed token is a command operator (|, ||, &&, ;)
 */
// isCommandOperator 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCommandOperator(token: ParseEntry): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    typeof token === 'object' &&
    token !== null &&
    'op' in token &&
    (COMMAND_OPERATORS as readonly string[]).includes(token.op as string)
  )
}

/**
 * Determine completion type based solely on prefix characteristics
 */
// getCompletionTypeFromPrefix 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCompletionTypeFromPrefix(prefix: string): ShellCompletionType {
  // 满足 `prefix.startsWith('$')` 时，共享工具执行该分支。
  if (prefix.startsWith('$')) {
    // 返回 `'variable'`，作为共享工具这次计算的结果。
    return 'variable'
  }
  // 共享工具在这里按实际状态进入对应分支。
  if (
    prefix.includes('/') ||
    prefix.startsWith('~') ||
    prefix.startsWith('.')
  ) {
    // 返回 `'file'`，作为共享工具这次计算的结果。
    return 'file'
  }
  // 返回 `'command'`，作为共享工具这次计算的结果。
  return 'command'
}

/**
 * Find the last string token and its index in parsed tokens
 */
// findLastStringToken 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findLastStringToken(
  tokens: ParseEntry[],
): { token: string; index: number } | null {
  // i筛选`tokens.findLastIndex`，供共享工具后续处理使用。
  const i = tokens.findLastIndex(t => typeof t === 'string')
  // 返回 `i !== -1 ? { token: tokens[i] as string, index: i } : null`，作为共享工具这次计算的结果。
  return i !== -1 ? { token: tokens[i] as string, index: i } : null
}

/**
 * Check if we're in a context that expects a new command
 * (at start of input or after a command operator)
 */
// isNewCommandContext 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isNewCommandContext(
  tokens: ParseEntry[],
  currentTokenIndex: number,
): boolean {
  // 满足 `currentTokenIndex === 0` 时，共享工具执行该分支。
  if (currentTokenIndex === 0) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // prevToken读取 `tokens[currentTokenIndex - 1]` 对应条目，后续围绕该成员继续处理。
  const prevToken = tokens[currentTokenIndex - 1]
  // 返回 `prevToken !== undefined && isCommandOperator(prevToken)`，作为共享工具这次计算的结果。
  return prevToken !== undefined && isCommandOperator(prevToken)
}

/**
 * Parse input to extract completion context
 */
// parseInputContext 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function parseInputContext(input: string, cursorOffset: number): InputContext {
  // beforeCursor格式化`input.slice`，供共享工具后续处理使用。
  const beforeCursor = input.slice(0, cursorOffset)

  // Check if it's a variable prefix, before expanding with shell-quote
  // varMatch匹配`beforeCursor.match`，供共享工具后续处理使用。
  const varMatch = beforeCursor.match(/\$[a-zA-Z_][a-zA-Z0-9_]*$/)
  // 满足 `varMatch` 时，共享工具执行该分支。
  if (varMatch) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { prefix: varMatch[0], completionType: 'variable' }
  }

  // Parse with shell-quote
  // parseResult保存`tryParseShellCommand`，供共享工具后续处理使用。
  const parseResult = tryParseShellCommand(beforeCursor)
  // parseResult.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parseResult.success) {
    // Fallback to simple parsing
    // token 列表格式化`beforeCursor.split`，供共享工具后续处理使用。
    const tokens = beforeCursor.split(/\s+/)
    // prefix标记共享工具 shell Completion是否启用对应路径。
    const prefix = tokens[tokens.length - 1] || ''
    // isFirstToken记录 `beforeCursor.includes` 是否成立，共享工具随后按该结果分支。
    const isFirstToken = tokens.length === 1 && !beforeCursor.includes(' ')
    // completionType保存`isFirstToken`，供后续判断或组装使用。
    const completionType = isFirstToken
      ? 'command'
      : getCompletionTypeFromPrefix(prefix)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { prefix, completionType }
  }

  // Extract current token
  // lastToken筛选`findLastStringToken`，供共享工具后续处理使用。
  const lastToken = findLastStringToken(parseResult.tokens)
  // lastToken缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!lastToken) {
    // No string token found - check if after operator
    // lastParsedToken记录 `parseResult.tokens[parseResult.tokens.length - 1]` 是否成立，下一步按该结果分支。
    const lastParsedToken = parseResult.tokens[parseResult.tokens.length - 1]
    // completionType 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const completionType =
      lastParsedToken && isCommandOperator(lastParsedToken)
        ? 'command'
        : 'command' // Default to command at start
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { prefix: '', completionType }
  }

  // If there's a trailing space, the user is starting a new argument
  // 满足 `beforeCursor.endsWith(' ')` 时，共享工具执行该分支。
  if (beforeCursor.endsWith(' ')) {
    // After first token (command) with space = file argument expected
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { prefix: '', completionType: 'file' }
  }

  // Determine completion type from context
  // baseType读取`getCompletionTypeFromPrefix`，供共享工具后续处理使用。
  const baseType = getCompletionTypeFromPrefix(lastToken.token)

  // If it's clearly a file or variable based on prefix, use that type
  // 当 `baseType` 匹配 `'variable' || baseType === ...` 时，共享工具执行对应分支。
  if (baseType === 'variable' || baseType === 'file') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { prefix: lastToken.token, completionType: baseType }
  }

  // For command-like tokens, check context: are we starting a new command?
  // completionType保存`isNewCommandContext`，供共享工具后续处理使用。
  const completionType = isNewCommandContext(
    parseResult.tokens,
    lastToken.index,
  )
    ? 'command'
    : 'file' // Not after operator = file argument

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { prefix: lastToken.token, completionType }
}

/**
 * Generate bash completion command using compgen
 */
// getBashCompletionCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBashCompletionCommand(
  prefix: string,
  completionType: ShellCompletionType,
): string {
  // 当 `completionType` 匹配 `'variable'` 时，共享工具执行对应分支。
  if (completionType === 'variable') {
    // Variable completion - remove $ prefix
    // varName格式化`prefix.slice`，供共享工具后续处理使用。
    const varName = prefix.slice(1)
    // 返回 ``compgen -v ${quote([varName])} 2>/dev/null``，作为共享工具这次计算的结果。
    return `compgen -v ${quote([varName])} 2>/dev/null`
  // 共享工具 shell Completion在这里处理 `} else if (completionType === 'file') {`，完成这一小步状态转换。
  } else if (completionType === 'file') {
    // File completion with trailing slash for directories and trailing space for files
    // Use 'while read' to prevent command injection from filenames containing newlines
    // 返回 ``compgen -f ${quote([prefix])} 2>/dev/null | head -${MAX_SHELL_COMPLETI...`，作为共享工具这次计算的结果。
    return `compgen -f ${quote([prefix])} 2>/dev/null | head -${MAX_SHELL_COMPLETIONS} | while IFS= read -r f; do [ -d "$f" ] && echo "$f/" || echo "$f "; done`
  } else {
    // Command completion
    // 返回 ``compgen -c ${quote([prefix])} 2>/dev/null``，作为共享工具这次计算的结果。
    return `compgen -c ${quote([prefix])} 2>/dev/null`
  }
}

/**
 * Generate zsh completion command using native zsh commands
 */
// getZshCompletionCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getZshCompletionCommand(
  prefix: string,
  completionType: ShellCompletionType,
): string {
  // 当 `completionType` 匹配 `'variable'` 时，共享工具执行对应分支。
  if (completionType === 'variable') {
    // Variable completion - use zsh pattern matching for safe filtering
    // varName格式化`prefix.slice`，供共享工具后续处理使用。
    const varName = prefix.slice(1)
    // 返回 ``print -rl -- \${(k)parameters[(I)${quote([varName])}*]} 2>/dev/null``，作为共享工具这次计算的结果。
    return `print -rl -- \${(k)parameters[(I)${quote([varName])}*]} 2>/dev/null`
  // 共享工具 shell Completion在这里处理 `} else if (completionType === 'file') {`，完成这一小步状态转换。
  } else if (completionType === 'file') {
    // File completion with trailing slash for directories and trailing space for files
    // Note: zsh glob expansion is safe from command injection (unlike bash for-in loops)
    // 返回 ``for f in ${quote([prefix])}*(N[1,${MAX_SHELL_COMPLETIONS}]); do [[ -d ...`，作为共享工具这次计算的结果。
    return `for f in ${quote([prefix])}*(N[1,${MAX_SHELL_COMPLETIONS}]); do [[ -d "$f" ]] && echo "$f/" || echo "$f "; done`
  } else {
    // Command completion - use zsh pattern matching for safe filtering
    // 返回 ``print -rl -- \${(k)commands[(I)${quote([prefix])}*]} 2>/dev/null``，作为共享工具这次计算的结果。
    return `print -rl -- \${(k)commands[(I)${quote([prefix])}*]} 2>/dev/null`
  }
}

/**
 * Get completions for the given shell type
 */
// getCompletionsForShell 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getCompletionsForShell(
  shellType: 'bash' | 'zsh',
  prefix: string,
  completionType: ShellCompletionType,
  abortSignal: AbortSignal,
): Promise<SuggestionItem[]> {
  // 命令 先占位，稍后的条件分支会根据实际输入补齐它。
  let command: string

  // 当 `shellType` 匹配 `'bash'` 时，共享工具执行对应分支。
  if (shellType === 'bash') {
    // 命令更新为 `getBashCompletionCommand(prefix, completionType)`，确保Bash 解析工具后续读取最新状态。
    command = getBashCompletionCommand(prefix, completionType)
  // 共享工具 shell Completion在这里处理 `} else if (shellType === 'zsh') {`，完成这一小步状态转换。
  } else if (shellType === 'zsh') {
    // 命令更新为 `getZshCompletionCommand(prefix, completionType)`，确保Bash 解析工具后续读取最新状态。
    command = getZshCompletionCommand(prefix, completionType)
  } else {
    // Unsupported shell type
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // shellCommand 命令数据保存`Shell.exec`，供共享工具后续处理使用。
  const shellCommand = await Shell.exec(command, abortSignal, 'bash', {
    timeout: SHELL_COMPLETION_TIMEOUT_MS,
  })
  // 结果 等待 `shellCommand.result`，确保继续执行前已有结果。
  const result = await shellCommand.result
  // 返回 `result.stdout`，作为共享工具这次计算的结果。
  return result.stdout
    .split('\n')
    // 链式调用 filter，继续加工上一行在共享工具中产生的数据。
    .filter((line: string) => line.trim())
    .slice(0, MAX_SHELL_COMPLETIONS)
    // 链式调用 map，继续加工上一行在共享工具中产生的数据。
    .map((text: string) => ({
      id: text,
      displayText: text,
      description: undefined,
      metadata: { completionType },
    }))
}

/**
 * Get shell completions for the given input
 * Supports bash and zsh shells (matches Shell.ts execution support)
 */
// getShellCompletions 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getShellCompletions(
  input: string,
  cursorOffset: number,
  abortSignal: AbortSignal,
): Promise<SuggestionItem[]> {
  // shellType读取`getShellType`，供共享工具后续处理使用。
  const shellType = getShellType()

  // Only support bash/zsh (matches Shell.ts execution support)
  // `shellType` 与 `'bash' && shellType !== 'zsh'` 不一致时刷新派生状态，避免使用过期结果。
  if (shellType !== 'bash' && shellType !== 'zsh') {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `parseInputContext(input, cursorOffset)` 解构 prefix、completionType，减少共享工具 shell Completion对同一对象的重复访问。
    const { prefix, completionType } = parseInputContext(input, cursorOffset)

    // prefix缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!prefix) {
      // 返回列表结果，保留共享工具已经排好的条目顺序。
      return []
    }

    // completions 集合读取`getCompletionsForShell`，供共享工具后续处理使用。
    const completions = await getCompletionsForShell(
      shellType,
      prefix,
      completionType,
      abortSignal,
    )

    // Add inputSnapshot to all suggestions so we can detect when input changes
    // 返回 `completions.map(suggestion => ({`，作为共享工具这次计算的结果。
    return completions.map(suggestion => ({
      ...suggestion,
      metadata: {
        ...(suggestion.metadata as { completionType: ShellCompletionType }),
        inputSnapshot: input,
      },
    }))
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Shell completion failed: ${error}`)
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return [] // Silent fail
  }
}
