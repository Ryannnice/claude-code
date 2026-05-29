/**
 * Utility for substituting $ARGUMENTS placeholders in skill/command prompts.
 *
 * Supports:
 * - $ARGUMENTS - replaced with the full arguments string
 * - $ARGUMENTS[0], $ARGUMENTS[1], etc. - replaced with individual indexed arguments
 * - $0, $1, etc. - shorthand for $ARGUMENTS[0], $ARGUMENTS[1]
 * - Named arguments (e.g., $foo, $bar) - when argument names are defined in frontmatter
 *
 * Arguments are parsed using shell-quote for proper shell argument handling.
 */

// 引入 tryParseShellCommand，将 ./bash/shellQuote.js 中已经封装好的能力接到本文件流程里。
import { tryParseShellCommand } from './bash/shellQuote.js'

/**
 * Parse an arguments string into an array of individual arguments.
 * Uses shell-quote for proper shell argument parsing including quoted strings.
 *
 * Examples:
 * - "foo bar baz" => ["foo", "bar", "baz"]
 * - 'foo "hello world" baz' => ["foo", "hello world", "baz"]
 * - "foo 'hello world' baz" => ["foo", "hello world", "baz"]
 */
// parseArguments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseArguments(args: string): string[] {
  // 只有 `!args || !args.trim()` 满足时，共享工具才执行该分支。
  if (!args || !args.trim()) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Return $KEY to preserve variable syntax literally (don't expand variables)
  // 结果保存`tryParseShellCommand`，供共享工具后续处理使用。
  const result = tryParseShellCommand(args, key => `$${key}`)
  // result.success 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!result.success) {
    // Fall back to simple whitespace split if parsing fails
    // 返回 `args.split(/\s+/).filter(Boolean)`，作为共享工具这次计算的结果。
    return args.split(/\s+/).filter(Boolean)
  }

  // Filter to only string tokens (ignore shell operators, etc.)
  // 返回 `result.tokens.filter(`，作为共享工具这次计算的结果。
  return result.tokens.filter(
    // 这个回调绑定到 (token): token is string => typeof token === 'string',，负责共享工具在该局部场景下的响应。
    (token): token is string => typeof token === 'string',
  )
}

/**
 * Parse argument names from the frontmatter 'arguments' field.
 * Accepts either a space-separated string or an array of strings.
 *
 * Examples:
 * - "foo bar baz" => ["foo", "bar", "baz"]
 * - ["foo", "bar", "baz"] => ["foo", "bar", "baz"]
 */
// parseArgumentNames 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseArgumentNames(
  argumentNames: string | string[] | undefined,
): string[] {
  // argumentNames 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!argumentNames) {
    // 返回列表结果，保留共享工具已经排好的条目顺序。
    return []
  }

  // Filter out empty strings and numeric-only names (which conflict with $0, $1 shorthand)
  // isValidName封装成回调，供共享工具 argument Substitution在事件触发或异步步骤中调用。
  const isValidName = (name: string): boolean =>
    typeof name === 'string' && name.trim() !== '' && !/^\d+$/.test(name)

  // 满足 `Array.isArray(argumentNames)` 时，共享工具执行该分支。
  if (Array.isArray(argumentNames)) {
    // 返回 `argumentNames.filter(isValidName)`，作为共享工具这次计算的结果。
    return argumentNames.filter(isValidName)
  }
  // 当 `typeof argumentNames` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof argumentNames === 'string') {
    // 返回 `argumentNames.split(/\s+/).filter(isValidName)`，作为共享工具这次计算的结果。
    return argumentNames.split(/\s+/).filter(isValidName)
  }
  // 返回列表结果，保留共享工具已经排好的条目顺序。
  return []
}

/**
 * Generate argument hint showing remaining unfilled args.
 * @param argNames - Array of argument names from frontmatter
 * @param typedArgs - Arguments the user has typed so far
 * @returns Hint string like "[arg2] [arg3]" or undefined if all filled
 */
// generateProgressiveArgumentHint 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateProgressiveArgumentHint(
  argNames: string[],
  typedArgs: string[],
): string | undefined {
  // remaining格式化`argNames.slice`，供共享工具后续处理使用。
  const remaining = argNames.slice(typedArgs.length)
  // remaining为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (remaining.length === 0) return undefined
  // 返回 `remaining.map(name => `[${name}]`).join(' ')`，作为共享工具这次计算的结果。
  return remaining.map(name => `[${name}]`).join(' ')
}

/**
 * Substitute $ARGUMENTS placeholders in content with actual argument values.
 *
 * @param content - The content containing placeholders
 * @param args - The raw arguments string (may be undefined/null)
 * @param appendIfNoPlaceholder - If true and no placeholders are found, appends "ARGUMENTS: {args}" to content
 * @param argumentNames - Optional array of named arguments (e.g., ["foo", "bar"]) that map to indexed positions
 * @returns The content with placeholders substituted
 */
// substituteArguments 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function substituteArguments(
  content: string,
  args: string | undefined,
  appendIfNoPlaceholder = true,
  argumentNames: string[] = [],
): string {
  // undefined/null means no args provided - return content unchanged
  // empty string is a valid input that should replace placeholders with empty
  // 只有 `args === undefined || args === null` 满足时，共享工具才执行该分支。
  if (args === undefined || args === null) {
    // 返回 `content`，作为共享工具这次计算的结果。
    return content
  }

  // parsedArgs 集合解析`parseArguments`，供共享工具后续处理使用。
  const parsedArgs = parseArguments(args)
  // originalContent保存`content`，供共享工具 argument Substitution后续判断或输出使用。
  const originalContent = content

  // Replace named arguments (e.g., $foo, $bar) with their values
  // Named arguments map to positions: argumentNames[0] -> parsedArgs[0], etc.
  // 按索引扫描 `argumentNames.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < argumentNames.length; i++) {
    // 名称读取 `argumentNames[i]` 对应条目，后续围绕该成员继续处理。
    const name = argumentNames[i]
    // 名称缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!name) continue

    // Match $name but not $name[...] or $nameXxx (word chars)
    // Also ensure we match word boundaries to avoid partial matches
    // 文本内容更新为 `content.replace(`，确保共享工具后续读取最新状态。
    content = content.replace(
      new RegExp(`\\$${name}(?![\\[\\w])`, 'g'),
      parsedArgs[i] ?? '',
    )
  }

  // Replace indexed arguments ($ARGUMENTS[0], $ARGUMENTS[1], etc.)
  // 文本内容更新为 `content.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, indexStr: st...`，确保共享工具后续读取最新状态。
  content = content.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, indexStr: string) => {
    // index 索引解析`parseInt`，供共享工具后续处理使用。
    const index = parseInt(indexStr, 10)
    // 返回 `parsedArgs[index] ?? ''`，作为共享工具这次计算的结果。
    return parsedArgs[index] ?? ''
  })

  // Replace shorthand indexed arguments ($0, $1, etc.)
  // 文本内容更新为 `content.replace(/\$(\d+)(?!\w)/g, (_, indexStr: string) =...`，确保共享工具后续读取最新状态。
  content = content.replace(/\$(\d+)(?!\w)/g, (_, indexStr: string) => {
    // index 索引解析`parseInt`，供共享工具后续处理使用。
    const index = parseInt(indexStr, 10)
    // 返回 `parsedArgs[index] ?? ''`，作为共享工具这次计算的结果。
    return parsedArgs[index] ?? ''
  })

  // Replace $ARGUMENTS with the full arguments string
  // 文本内容更新为 `content.replaceAll('$ARGUMENTS', args)`，确保共享工具后续读取最新状态。
  content = content.replaceAll('$ARGUMENTS', args)

  // If no placeholders were found and appendIfNoPlaceholder is true, append
  // But only if args is non-empty (empty string means command invoked with no args)
  // 只有 `content === originalContent && appendIfNoPlacehol` 满足时，共享工具才执行该分支。
  if (content === originalContent && appendIfNoPlaceholder && args) {
    // 文本内容更新为 `content + `\n\nARGUMENTS: ${args}``，确保共享工具后续读取最新状态。
    content = content + `\n\nARGUMENTS: ${args}`
  }

  // 返回 `content`，作为共享工具这次计算的结果。
  return content
}
