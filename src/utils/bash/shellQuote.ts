/**
 * Safe wrappers for shell-quote library functions that handle errors gracefully
 * These are drop-in replacements for the original functions
 */

// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type ParseEntry,
  parse as shellQuoteParse,
  quote as shellQuoteQuote,
} from 'shell-quote'
// 引入 logError，将 ../log.js 中已经封装好的能力接到本文件流程里。
import { logError } from '../log.js'
// 引入 jsonStringify，将 ../slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonStringify } from '../slowOperations.js'

// 导出类型定义，让其他模块沿用共享工具 shell Quote的数据契约。
export type { ParseEntry } from 'shell-quote'

// ShellParseResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellParseResult =
  | { success: true; tokens: ParseEntry[] }
  | { success: false; error: string }

// ShellQuoteResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellQuoteResult =
  | { success: true; quoted: string }
  | { success: false; error: string }

// tryParseShellCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryParseShellCommand(
  cmd: string,
  env?:
    | Record<string, string | undefined>
    | ((key: string) => string | undefined),
): ShellParseResult {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // tokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const tokens =
      typeof env === 'function'
        ? shellQuoteParse(cmd, env)
        : shellQuoteParse(cmd, env)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, tokens }
  } catch (error) {
    // 满足 `error instanceof Error` 时，共享工具执行该分支。
    if (error instanceof Error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parse error',
    }
  }
}

// tryQuoteShellArgs 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function tryQuoteShellArgs(args: unknown[]): ShellQuoteResult {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 这个回调绑定到 const validated: string[] = args.map((arg, index) => {，负责共享工具在该局部场景下的响应。
    const validated: string[] = args.map((arg, index) => {
      // 只有 `arg === null || arg === undefined` 满足时，共享工具才执行该分支。
      if (arg === null || arg === undefined) {
        // 返回 `String(arg)`，作为共享工具这次计算的结果。
        return String(arg)
      }

      // type保存`typeof arg`，供后续判断或组装使用。
      const type = typeof arg

      // 当 `type` 匹配 `'string'` 时，共享工具执行对应分支。
      if (type === 'string') {
        // 返回 `arg as string`，作为共享工具这次计算的结果。
        return arg as string
      }
      // 当 `type` 匹配 `'number' || type === 'boole...` 时，共享工具执行对应分支。
      if (type === 'number' || type === 'boolean') {
        // 返回 `String(arg)`，作为共享工具这次计算的结果。
        return String(arg)
      }

      // 当 `type` 匹配 `'object'` 时，共享工具执行对应分支。
      if (type === 'object') {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Cannot quote argument at index ${index}: object values are not supported`,
        )
      }
      // 当 `type` 匹配 `'symbol'` 时，共享工具执行对应分支。
      if (type === 'symbol') {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Cannot quote argument at index ${index}: symbol values are not supported`,
        )
      }
      // 当 `type` 匹配 `'function'` 时，共享工具执行对应分支。
      if (type === 'function') {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `Cannot quote argument at index ${index}: function values are not supported`,
        )
      }

      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        `Cannot quote argument at index ${index}: unsupported type ${type}`,
      )
    })

    // quoted保存`shellQuoteQuote`，供共享工具后续处理使用。
    const quoted = shellQuoteQuote(validated)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true, quoted }
  } catch (error) {
    // 满足 `error instanceof Error` 时，共享工具执行该分支。
    if (error instanceof Error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown quote error',
    }
  }
}

/**
 * Checks if parsed tokens contain malformed entries that suggest shell-quote
 * misinterpreted the command. This happens when input contains ambiguous
 * patterns (like JSON-like strings with semicolons) that shell-quote parses
 * according to shell rules, producing token fragments.
 *
 * For example, `echo {"hi":"hi;evil"}` gets parsed with `;` as an operator,
 * producing tokens like `{hi:"hi` (unbalanced brace). Legitimate commands
 * produce complete, balanced tokens.
 *
 * Also detects unterminated quotes in the original command: shell-quote
 * silently drops an unmatched `"` or `'` and parses the rest as unquoted,
 * leaving no trace in the tokens. `echo "hi;evil | cat` (one unmatched `"`)
 * is a bash syntax error, but shell-quote yields clean tokens with `;` as
 * an operator. The token-level checks below can't catch this, so we walk
 * the original command with bash quote semantics and flag odd parity.
 *
 * Security: This prevents command injection via HackerOne #3482049 where
 * shell-quote's correct parsing of ambiguous input can be exploited.
 */
// hasMalformedTokens 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasMalformedTokens(
  command: string,
  parsed: ParseEntry[],
): boolean {
  // Check for unterminated quotes in the original command. shell-quote drops
  // an unmatched quote without leaving any trace in the tokens, so this must
  // inspect the raw string. Walk with bash semantics: backslash escapes the
  // next char outside single-quotes; no escapes inside single-quotes.
  // inSingle标记共享工具 shell Quote是否启用对应路径。
  let inSingle = false
  // inDouble标记共享工具 shell Quote是否启用对应路径。
  let inDouble = false
  // doubleCount 数量保存`0`，供后续判断或组装使用。
  let doubleCount = 0
  // singleCount 数量保存`0`，供后续判断或组装使用。
  let singleCount = 0
  // 按索引扫描 `command.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < command.length; i++) {
    // c保存`command[i]`，供共享工具 shell Quote后续判断或输出使用。
    const c = command[i]
    // 只有 `c === '\\' && !inSingle` 满足时，共享工具才执行该分支。
    if (c === '\\' && !inSingle) {
      // 共享工具 shell Quote在这里处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
    // 只有 `c === '"' && !inSingle` 满足时，共享工具才执行该分支。
    if (c === '"' && !inSingle) {
      // 共享工具 shell Quote在这里处理 `doubleCount++`，完成这一小步状态转换。
      doubleCount++
      // inDouble更新为 `!inDouble`，确保Bash 解析工具后续读取最新状态。
      inDouble = !inDouble
    // 共享工具 shell Quote在这里处理 `} else if (c === "'" && !inDouble) {`，完成这一小步状态转换。
    } else if (c === "'" && !inDouble) {
      // 共享工具 shell Quote在这里处理 `singleCount++`，完成这一小步状态转换。
      singleCount++
      // inSingle更新为 `!inSingle`，确保Bash 解析工具后续读取最新状态。
      inSingle = !inSingle
    }
  }
  // `doubleCount % 2` 与 `0 || singleCount % 2 !== 0` 不一致时刷新派生状态，避免使用过期结果。
  if (doubleCount % 2 !== 0 || singleCount % 2 !== 0) return true

  // 按顺序遍历 `parsed` 中的entry，逐个交给共享工具处理。
  for (const entry of parsed) {
    // `typeof entry` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
    if (typeof entry !== 'string') continue

    // Check for unbalanced curly braces
    // openBraces 集合匹配`entry.match`，供共享工具后续处理使用。
    const openBraces = (entry.match(/{/g) || []).length
    // closeBraces 集合匹配`entry.match`，供共享工具后续处理使用。
    const closeBraces = (entry.match(/}/g) || []).length
    // `openBraces` 与 `closeBraces` 不一致时刷新派生状态，避免使用过期结果。
    if (openBraces !== closeBraces) return true

    // Check for unbalanced parentheses
    // openParens 集合匹配`entry.match`，供共享工具后续处理使用。
    const openParens = (entry.match(/\(/g) || []).length
    // closeParens 集合匹配`entry.match`，供共享工具后续处理使用。
    const closeParens = (entry.match(/\)/g) || []).length
    // `openParens` 与 `closeParens` 不一致时刷新派生状态，避免使用过期结果。
    if (openParens !== closeParens) return true

    // Check for unbalanced square brackets
    // openBrackets 集合匹配`entry.match`，供共享工具后续处理使用。
    const openBrackets = (entry.match(/\[/g) || []).length
    // closeBrackets 集合匹配`entry.match`，供共享工具后续处理使用。
    const closeBrackets = (entry.match(/\]/g) || []).length
    // `openBrackets` 与 `closeBrackets` 不一致时刷新派生状态，避免使用过期结果。
    if (openBrackets !== closeBrackets) return true

    // Check for unbalanced double quotes
    // Count quotes that aren't escaped (preceded by backslash)
    // A token with an odd number of unescaped quotes is malformed
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- gated by hasCommandSeparator check at caller, runs on short per-token strings
    // doubleQuotes 集合匹配`entry.match`，供共享工具后续处理使用。
    const doubleQuotes = entry.match(/(?<!\\)"/g) || []
    // 判断 doubleQuotes.length % 2 !== 0，将共享工具分流到只适用于该条件的处理路径。
    if (doubleQuotes.length % 2 !== 0) return true

    // Check for unbalanced single quotes
    // eslint-disable-next-line custom-rules/no-lookbehind-regex -- same as above
    // singleQuotes 集合匹配`entry.match`，供共享工具后续处理使用。
    const singleQuotes = entry.match(/(?<!\\)'/g) || []
    // 判断 singleQuotes.length % 2 !== 0，将共享工具分流到只适用于该条件的处理路径。
    if (singleQuotes.length % 2 !== 0) return true
  }
  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

/**
 * Detects commands containing '\' patterns that exploit the shell-quote library's
 * incorrect handling of backslashes inside single quotes.
 *
 * In bash, single quotes preserve ALL characters literally - backslash has no
 * special meaning. So '\' is just the string \ (the quote opens, contains \,
 * and the next ' closes it). But shell-quote incorrectly treats \ as an escape
 * character inside single quotes, causing '\' to NOT close the quoted string.
 *
 * This means the pattern '\' <payload> '\' hides <payload> from security checks
 * because shell-quote thinks it's all one single-quoted string.
 */
// hasShellQuoteSingleQuoteBug 承担共享工具中的独立步骤，串起共享工具 shell Quote需要的输入整理、状态更新和结果输出。
export function hasShellQuoteSingleQuoteBug(command: string): boolean {
  // Walk the command with correct bash single-quote semantics
  // inSingleQuote记录当前扫描状态，共享工具 shell Quote随后按该状态分支。
  let inSingleQuote = false
  // inDoubleQuote记录当前扫描状态，共享工具 shell Quote随后按该状态分支。
  let inDoubleQuote = false

  // 遍历 let i = 0; i < command.length; i++，让共享工具逐项完成同一类处理。
  for (let i = 0; i < command.length; i++) {
    // char保存`command[i]`，供共享工具 shell Quote后续步骤使用。
    const char = command[i]

    // Handle backslash escaping outside of single quotes
    // 组合条件 `char === '\\' && !inSingleQuote` 成立时，共享工具才启用这条专门路径。
    if (char === '\\' && !inSingleQuote) {
      // Skip the next character (it's escaped)
      // 共享工具 shell Quote处理 `i++`，完成这一小步状态转换。
      i++
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 组合条件 `char === '"' && !inSingleQuote` 成立时，共享工具才启用这条专门路径。
    if (char === '"' && !inSingleQuote) {
      // inDoubleQuote更新为 `!inDoubleQuote`，确保Bash 解析后续读取最新状态。
      inDoubleQuote = !inDoubleQuote
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }

    // 组合条件 `char === "'" && !inDoubleQuote` 成立时，共享工具才启用这条专门路径。
    if (char === "'" && !inDoubleQuote) {
      // inSingleQuote更新为 `!inSingleQuote`，确保Bash 解析后续读取最新状态。
      inSingleQuote = !inSingleQuote

      // Check if we just closed a single quote and the content ends with
      // trailing backslashes. shell-quote's chunker regex '((\\'|[^'])*?)'
      // incorrectly treats \' as an escape sequence inside single quotes,
      // while bash treats backslash as literal. This creates a differential
      // where shell-quote merges tokens that bash treats as separate.
      //
      // Odd trailing \'s = always a bug:
      //   '\' -> shell-quote: \' = literal ', still open. bash: \, closed.
      //   'abc\' -> shell-quote: abc then \' = literal ', still open. bash: abc\, closed.
      //   '\\\'  -> shell-quote: \\ + \', still open. bash: \\\, closed.
      //
      // Even trailing \'s = bug ONLY when a later ' exists in the command:
      //   '\\' alone -> shell-quote backtracks, both parsers agree string closes. OK.
      //   '\\' 'next' -> shell-quote: \' consumes the closing ', finds next ' as
      //                   false close, merges tokens. bash: two separate tokens.
      //
      //   Detail: the regex alternation tries \' before [^']. For '\\', it matches
      //   the first \ via [^'] (next char is \, not '), then the second \ via \'
      //   (next char IS '). This consumes the closing '. The regex continues reading
      //   until it finds another ' to close the match. If none exists, it backtracks
      //   to [^'] for the second \ and closes correctly. If a later ' exists (e.g.,
      //   the opener of the next single-quoted arg), no backtracking occurs and
      //   tokens merge. See H1 report: git ls-remote 'safe\\' '--upload-pack=evil' 'repo'
      //   shell-quote: ["git","ls-remote","safe\\\\ --upload-pack=evil repo"]
      //   bash:        ["git","ls-remote","safe\\\\","--upload-pack=evil","repo"]
      // inSingleQuote缺失时提前走兜底路径，避免共享工具继续依赖无效输入。
      if (!inSingleQuote) {
        // backslashCount保存`0`，供共享工具 shell Quote后续步骤使用。
        let backslashCount = 0
        // j保存`i - 1`，供共享工具 shell Quote后续步骤使用。
        let j = i - 1
        // while 使用 j >= 0 && command[j] === '\\' 完成共享工具里的对应操作。
        while (j >= 0 && command[j] === '\\') {
          // 共享工具 shell Quote处理 `backslashCount++`，完成这一小步状态转换。
          backslashCount++
          // 共享工具 shell Quote处理 `j--`，完成这一小步状态转换。
          j--
        }
        // 组合条件 `backslashCount > 0 && backslashCount % 2 === 1` 成立时，共享工具才启用这条专门路径。
        if (backslashCount > 0 && backslashCount % 2 === 1) {
          // 返回 true，把共享工具这个分支的结果交还调用方。
          return true
        }
        // Even trailing backslashes: only a bug when a later ' exists that
        // the chunker regex can use as a false closing quote. We check for
        // ANY later ' because the regex doesn't respect bash quote state
        // (e.g., a ' inside double quotes is also consumable).
        // 共享工具在这里进入条件判断，后续代码按实际状态分流。
        if (
          backslashCount > 0 &&
          backslashCount % 2 === 0 &&
          command.indexOf("'", i + 1) !== -1
        ) {
          // 返回 true，把共享工具这个分支的结果交还调用方。
          return true
        }
      }
      // 跳过当前项，继续处理共享工具中的下一轮循环。
      continue
    }
  }

  // 返回 false，把共享工具这个分支的结果交还调用方。
  return false
}

// quote 承担共享工具中的独立步骤，串起共享工具 shell Quote需要的输入整理、状态更新和结果输出。
export function quote(args: ReadonlyArray<unknown>): string {
  // First try the strict validation
  // 结果保存`tryQuoteShellArgs`，供共享工具后续处理使用。
  const result = tryQuoteShellArgs([...args])

  // 满足 `result.success` 时，共享工具执行该分支。
  if (result.success) {
    // 返回 result.quoted，把共享工具这个分支的结果交还调用方。
    return result.quoted
  }

  // If strict validation failed, use lenient fallback
  // This handles objects, symbols, functions, etc. by converting them to strings
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // stringArgs 集合派生`args.map`，供共享工具后续处理使用。
    const stringArgs = args.map(arg => {
      // 组合条件 `arg === null || arg === undefined` 成立时，共享工具才启用这条专门路径。
      if (arg === null || arg === undefined) {
        // 返回 String(arg)，把共享工具这个分支的结果交还调用方。
        return String(arg)
      }

      // type保存`typeof arg`，供共享工具 shell Quote后续步骤使用。
      const type = typeof arg

      // 组合条件 `type === 'string' || type === 'number' || type ==` 成立时，共享工具才启用这条专门路径。
      if (type === 'string' || type === 'number' || type === 'boolean') {
        // 返回 String(arg)，把共享工具这个分支的结果交还调用方。
        return String(arg)
      }

      // For unsupported types, use JSON.stringify as a safe fallback
      // This ensures we don't crash but still get a meaningful representation
      // 返回 `jsonStringify(arg)`，作为共享工具这次计算的结果。
      return jsonStringify(arg)
    })

    // 返回 `shellQuoteQuote(stringArgs)`，作为共享工具这次计算的结果。
    return shellQuoteQuote(stringArgs)
  } catch (error) {
    // SECURITY: Never use JSON.stringify as a fallback for shell quoting.
    // JSON.stringify uses double quotes which don't prevent shell command execution.
    // For example, jsonStringify(['echo', '$(whoami)']) produces "echo" "$(whoami)"
    // 满足 `error instanceof Error` 时，共享工具执行该分支。
    if (error instanceof Error) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(error)
    }
    // 抛出 new Error('Failed to quote shell arguments safely')，阻止共享工具在无效状态下继续运行。
    throw new Error('Failed to quote shell arguments safely')
  }
}
