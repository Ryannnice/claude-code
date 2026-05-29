// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  hasMalformedTokens,
  hasShellQuoteSingleQuoteBug,
  type ParseEntry,
  quote,
  tryParseShellCommand,
} from './shellQuote.js'

/**
 * Rearranges a command with pipes to place stdin redirect after the first command.
 * This fixes an issue where eval treats the entire piped command as a single unit,
 * causing the stdin redirect to apply to eval itself rather than the first command.
 */
// rearrangePipeCommand 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function rearrangePipeCommand(command: string): string {
  // Skip if command has backticks - shell-quote doesn't handle them well
  // 满足 `command.includes('`')` 时，共享工具执行该分支。
  if (command.includes('`')) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // Skip if command has command substitution - shell-quote parses $() incorrectly,
  // treating ( and ) as separate operators instead of recognizing command substitution
  // 满足 `command.includes('$(')` 时，共享工具执行该分支。
  if (command.includes('$(')) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // Skip if command references shell variables ($VAR, ${VAR}). shell-quote's parse()
  // expands these to empty string when no env is passed, silently dropping the
  // reference. Even if we preserved the token via an env function, quote() would
  // then escape the $ during rebuild, preventing runtime expansion. See #9732.
  // 满足 `/\$[A-Za-z_{]/.test(command)` 时，共享工具执行该分支。
  if (/\$[A-Za-z_{]/.test(command)) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // Skip if command contains bash control structures (for/while/until/if/case/select)
  // shell-quote cannot parse these correctly and will incorrectly find pipes inside
  // the control structure body, breaking the command when rearranged
  // 满足 `containsControlStructure(command)` 时，共享工具执行该分支。
  if (containsControlStructure(command)) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // Join continuation lines before parsing: shell-quote doesn't handle \<newline>
  // and produces empty string tokens for each occurrence, causing spurious empty
  // arguments in the reconstructed command
  // joined格式化`joinContinuationLines`，供共享工具后续处理使用。
  const joined = joinContinuationLines(command)

  // shell-quote treats bare newlines as whitespace, not command separators.
  // Parsing+rebuilding 'cmd1 | head\ncmd2 | grep' yields 'cmd1 | head cmd2 | grep',
  // silently merging pipelines. Line-continuation (\<newline>) is already stripped
  // above; any remaining newline is a real separator. Bail to the eval fallback,
  // which preserves the newline inside a single-quoted arg. See #32515.
  // 满足 `joined.includes('\n')` 时，共享工具执行该分支。
  if (joined.includes('\n')) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // SECURITY: shell-quote treats \' inside single quotes as an escape, but
  // bash treats it as literal \ followed by a closing quote. The pattern
  // '\' <payload> '\' makes shell-quote merge <payload> into the quoted
  // string, hiding operators like ; from the token stream. Rebuilding from
  // that merged token can expose the operators when bash re-parses.
  // 满足 `hasShellQuoteSingleQuoteBug(joined)` 时，共享工具执行该分支。
  if (hasShellQuoteSingleQuoteBug(joined)) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // parseResult保存`tryParseShellCommand`，供共享工具后续处理使用。
  const parseResult = tryParseShellCommand(joined)

  // If parsing fails (malformed syntax), fall back to quoting the whole command
  // parseResult.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!parseResult.success) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // 解析结果解析`parseResult.tokens`，供后续判断或组装使用。
  const parsed = parseResult.tokens

  // SECURITY: shell-quote tokenizes differently from bash. Input like
  // `echo {"hi":\"hi;calc.exe"}` is a bash syntax error (unbalanced quote),
  // but shell-quote parses it into tokens with `;` as an operator and
  // `calc.exe` as a separate word. Rebuilding from those tokens produces
  // valid bash that executes `calc.exe` — turning a syntax error into an
  // injection. Unbalanced delimiters in a string token signal this
  // misparsing; fall back to whole-command quoting, which preserves the
  // original (bash then rejects it with the same syntax error it would have
  // raised without us).
  // 满足 `hasMalformedTokens(joined, parsed)` 时，共享工具执行该分支。
  if (hasMalformedTokens(joined, parsed)) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // firstPipeIndex 索引筛选`findFirstPipeOperator`，供共享工具后续处理使用。
  const firstPipeIndex = findFirstPipeOperator(parsed)

  // 满足 `firstPipeIndex <= 0` 时，共享工具执行该分支。
  if (firstPipeIndex <= 0) {
    // 返回 `quoteWithEvalStdinRedirect(command)`，作为共享工具这次计算的结果。
    return quoteWithEvalStdinRedirect(command)
  }

  // Rebuild: first_command < /dev/null | rest_of_pipeline
  // 片段列表 聚合成有序列表，保持后续遍历顺序稳定。
  const parts = [
    ...buildCommandParts(parsed, 0, firstPipeIndex),
    '< /dev/null',
    ...buildCommandParts(parsed, firstPipeIndex, parsed.length),
  ]

  // 返回 `singleQuoteForEval(parts.join(' '))`，作为共享工具这次计算的结果。
  return singleQuoteForEval(parts.join(' '))
}

/**
 * Finds the index of the first pipe operator in parsed shell command
 */
// findFirstPipeOperator 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findFirstPipeOperator(parsed: ParseEntry[]): number {
  // 按索引扫描 `parsed.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < parsed.length; i++) {
    // entry解析`parsed[i]` 整理出中间结果，供共享工具 bash Pipe Command后续步骤使用。
    const entry = parsed[i]
    // 满足 `isOperator(entry, '|')` 时，共享工具执行该分支。
    if (isOperator(entry, '|')) {
      // 返回 `i`，作为共享工具这次计算的结果。
      return i
    }
  }
  // 返回 `-1`，作为共享工具这次计算的结果。
  return -1
}

/**
 * Builds command parts from parsed entries, handling strings and operators.
 * Special handling for file descriptor redirections to preserve them as single units.
 */
// buildCommandParts 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildCommandParts(
  parsed: ParseEntry[],
  start: number,
  end: number,
): string[] {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // Track if we've seen a non-env-var string token yet
  // Environment variables are only valid at the start of a command
  // seenNonEnvVar标记共享工具 bash Pipe Command是否启用对应路径。
  let seenNonEnvVar = false

  // 循环处理 `let i = start; i < end; i++`，让共享工具逐项把同类条目按顺序走完。
  for (let i = start; i < end; i++) {
    // entry解析`parsed[i]` 整理出中间结果，供共享工具 bash Pipe Command后续步骤使用。
    const entry = parsed[i]

    // Check for file descriptor redirections (e.g., 2>&1, 2>/dev/null)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      typeof entry === 'string' &&
      /^[012]$/.test(entry) &&
      i + 2 < end &&
      isOperator(parsed[i + 1])
    ) {
      // op解析`parsed[i + 1] as { op: string }` 整理出中间结果，供共享工具 bash Pipe Command后续步骤使用。
      const op = parsed[i + 1] as { op: string }
      // target读取 `parsed[i + 2]` 对应条目，后续围绕该成员继续处理。
      const target = parsed[i + 2]

      // Handle 2>&1 style redirections
      // 共享工具在这里按实际状态进入对应分支。
      if (
        op.op === '>&' &&
        typeof target === 'string' &&
        /^[012]$/.test(target)
      ) {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`${entry}>&${target}`)
        // 共享工具 bash Pipe Command在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Handle 2>/dev/null style redirections
      // 当 `op.op` 匹配 `'>' && target === '/dev/nul...` 时，共享工具执行对应分支。
      if (op.op === '>' && target === '/dev/null') {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`${entry}>/dev/null`)
        // 共享工具 bash Pipe Command在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理共享工具中的下一轮循环。
        continue
      }

      // Handle 2> &1 style (space between > and &1)
      // 共享工具在这里按实际状态进入对应分支。
      if (
        op.op === '>' &&
        typeof target === 'string' &&
        target.startsWith('&')
      ) {
        // fd格式化`target.slice`，供共享工具后续处理使用。
        const fd = target.slice(1)
        // 满足 `/^[012]$/.test(fd)` 时，共享工具执行该分支。
        if (/^[012]$/.test(fd)) {
          // 片段列表追加新条目，保持收集顺序与输入顺序一致。
          parts.push(`${entry}>&${fd}`)
          // 共享工具 bash Pipe Command在这里处理 `i += 2`，完成这一小步状态转换。
          i += 2
          // 跳过当前项，继续处理共享工具中的下一轮循环。
          continue
        }
      }
    }

    // Handle regular entries
    // 当 `typeof entry` 匹配 `'string'` 时，共享工具执行对应分支。
    if (typeof entry === 'string') {
      // Environment variable assignments are only valid at the start of a command,
      // before any non-env-var tokens (the actual command and its arguments)
      // isEnvVar记录 `isEnvironmentVariableAssignment` 是否成立，共享工具随后按该结果分支。
      const isEnvVar = !seenNonEnvVar && isEnvironmentVariableAssignment(entry)

      // 满足 `isEnvVar` 时，共享工具执行该分支。
      if (isEnvVar) {
        // For env var assignments, we need to preserve the = but quote the value if needed
        // Split into name and value parts
        // eqIndex 索引保存`entry.indexOf`，供共享工具后续处理使用。
        const eqIndex = entry.indexOf('=')
        // 名称格式化`entry.slice`，供共享工具后续处理使用。
        const name = entry.slice(0, eqIndex)
        // 取值格式化`entry.slice`，供共享工具后续处理使用。
        const value = entry.slice(eqIndex + 1)

        // Quote the value part to handle spaces and special characters
        // quotedValue保存`quote`，供共享工具后续处理使用。
        const quotedValue = quote([value])
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(`${name}=${quotedValue}`)
      } else {
        // Once we see a non-env-var string, all subsequent strings are arguments
        // seenNonEnvVar更新为 `true`，确保Bash 解析工具后续读取最新状态。
        seenNonEnvVar = true
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(quote([entry]))
      }
    // 共享工具 bash Pipe Command在这里处理 `} else if (isOperator(entry)) {`，完成这一小步状态转换。
    } else if (isOperator(entry)) {
      // Special handling for glob operators
      // 只有 `entry.op === 'glob' && 'pattern' in entry` 满足时，共享工具才执行该分支。
      if (entry.op === 'glob' && 'pattern' in entry) {
        // Don't quote glob patterns - they need to remain as-is for shell expansion
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(entry.pattern as string)
      } else {
        // 片段列表追加新条目，保持收集顺序与输入顺序一致。
        parts.push(entry.op)
        // Reset after command separators - the next command can have its own env vars
        // 满足 `isCommandSeparator(entry.op)` 时，共享工具执行该分支。
        if (isCommandSeparator(entry.op)) {
          // seenNonEnvVar更新为 `false`，确保Bash 解析工具后续读取最新状态。
          seenNonEnvVar = false
        }
      }
    }
  }

  // 返回 `parts`，作为共享工具这次计算的结果。
  return parts
}

/**
 * Checks if a string is an environment variable assignment (VAR=value)
 * Environment variable names must start with letter or underscore,
 * followed by letters, numbers, or underscores
 */
// isEnvironmentVariableAssignment 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEnvironmentVariableAssignment(str: string): boolean {
  // 返回 `/^[A-Za-z_][A-Za-z0-9_]*=/.test(str)`，作为共享工具这次计算的结果。
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(str)
}

/**
 * Checks if an operator is a command separator that starts a new command context.
 * After these operators, environment variable assignments are valid again.
 */
// isCommandSeparator 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isCommandSeparator(op: string): boolean {
  // 返回 `op === '&&' || op === '||' || op === ';'`，作为共享工具这次计算的结果。
  return op === '&&' || op === '||' || op === ';'
}

/**
 * Type guard to check if a parsed entry is an operator
 */
// isOperator 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOperator(entry: unknown, op?: string): entry is { op: string } {
  // `!entry || typeof entry` 与 `'object' || !('op' in entry)` 不一致时刷新派生状态，避免使用过期结果。
  if (!entry || typeof entry !== 'object' || !('op' in entry)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `op ? entry.op === op : true`，作为共享工具这次计算的结果。
  return op ? entry.op === op : true
}

/**
 * Checks if a command contains bash control structures that shell-quote cannot parse.
 * These include for/while/until/if/case/select loops and conditionals.
 * We match keywords followed by whitespace to avoid false positives with commands
 * or arguments that happen to contain these words.
 */
// containsControlStructure 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function containsControlStructure(command: string): boolean {
  // 返回 `/\b(for|while|until|if|case|select)\s/.test(command)`，作为共享工具这次计算的结果。
  return /\b(for|while|until|if|case|select)\s/.test(command)
}

/**
 * Quotes a command and adds `< /dev/null` as a shell redirect on eval, rather than
 * as an eval argument. This is critical for pipe commands where we can't parse the
 * pipe boundary (e.g., commands with $(), backticks, or control structures).
 *
 * Using `singleQuoteForEval(cmd) + ' < /dev/null'` produces: eval 'cmd' < /dev/null
 *   → eval's stdin is /dev/null, eval evaluates 'cmd', pipes inside work correctly
 *
 * The previous approach `quote([cmd, '<', '/dev/null'])` produced: eval 'cmd' \< /dev/null
 *   → eval concatenates args to 'cmd < /dev/null', redirect applies to LAST pipe command
 */
// quoteWithEvalStdinRedirect 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function quoteWithEvalStdinRedirect(command: string): string {
  // 返回 `singleQuoteForEval(command) + ' < /dev/null'`，作为共享工具这次计算的结果。
  return singleQuoteForEval(command) + ' < /dev/null'
}

/**
 * Single-quote a string for use as an eval argument. Escapes embedded single
 * quotes via '"'"' (close-sq, literal-sq-in-dq, reopen-sq). Used instead of
 * shell-quote's quote() which switches to double-quote mode when the input
 * contains single quotes and then escapes ! -> \!, corrupting jq/awk filters
 * like `select(.x != .y)` into `select(.x \!= .y)`.
 */
// singleQuoteForEval 封装Bash 解析工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function singleQuoteForEval(s: string): string {
  // 返回 `"'" + s.replace(/'/g, `'"'"'`) + "'"`，作为共享工具这次计算的结果。
  return "'" + s.replace(/'/g, `'"'"'`) + "'"
}

/**
 * Joins shell continuation lines (backslash-newline) into a single line.
 * Only joins when there's an odd number of backslashes before the newline
 * (the last one escapes the newline). Even backslashes pair up as escape
 * sequences and the newline remains a separator.
 */
// joinContinuationLines 承担共享工具中的独立步骤，串起共享工具 bash Pipe Command需要的输入整理、状态更新和结果输出。
function joinContinuationLines(command: string): string {
  // 返回 command.replace(/\\+\n/g, match => {，把共享工具这个分支的结果交还调用方。
  return command.replace(/\\+\n/g, match => {
    // backslashCount统计`match.length - 1 // -1 for the newline`，供共享工具 bash Pipe Command后续步骤使用。
    const backslashCount = match.length - 1 // -1 for the newline
    // 满足 `backslashCount % 2 === 1` 时，共享工具执行该分支。
    if (backslashCount % 2 === 1) {
      // Odd number: last backslash escapes the newline (line continuation)
      // 返回 '\\'.repeat(backslashCount - 1)，把共享工具这个分支的结果交还调用方。
      return '\\'.repeat(backslashCount - 1)
    } else {
      // Even number: all pair up, newline is a real separator
      // 返回 match，把共享工具这个分支的结果交还调用方。
      return match
    }
  })
}
