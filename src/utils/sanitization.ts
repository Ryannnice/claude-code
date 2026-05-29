/**
 * Unicode Sanitization for Hidden Character Attack Mitigation
 *
 * This module implements security measures against Unicode-based hidden character attacks,
 * specifically targeting ASCII Smuggling and Hidden Prompt Injection vulnerabilities.
 * These attacks use invisible Unicode characters (such as Tag characters, format controls,
 * private use areas, and noncharacters) to hide malicious instructions that are invisible
 * to users but processed by AI models.
 *
 * The vulnerability was demonstrated in HackerOne report #3086545 targeting Claude Desktop's
 * MCP (Model Context Protocol) implementation, where attackers could inject hidden instructions
 * using Unicode Tag characters that would be executed by Claude but remain invisible to users.
 *
 * Reference: https://embracethered.com/blog/posts/2024/hiding-and-finding-text-with-unicode-tags/
 *
 * This implementation provides comprehensive protection by:
 * 1. Applying NFKC Unicode normalization to handle composed character sequences
 * 2. Removing dangerous Unicode categories while preserving legitimate text and formatting
 * 3. Supporting recursive sanitization of complex nested data structures
 * 4. Maintaining performance with efficient regex processing
 *
 * The sanitization is always enabled to protect against these attacks.
 */

// partiallySanitizeUnicode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function partiallySanitizeUnicode(prompt: string): string {
  // current保存`prompt`，供共享工具 sanitization后续判断或输出使用。
  let current = prompt
  // previous 集合 命名 `''`，让后续代码直接表达这个值的用途。
  let previous = ''
  // iterations 集合保存`0`，供共享工具 sanitization后续判断或输出使用。
  let iterations = 0
  // MAX_ITERATIONS 集合保存`10 // Safety limit to prevent infinite loops`，供共享工具 sanitization后续判断或输出使用。
  const MAX_ITERATIONS = 10 // Safety limit to prevent infinite loops

  // Iteratively sanitize until no more changes occur or max iterations reached
  // while 使用 current !== previous && iterations < MAX_ITERATIO… 完成共享工具里的对应操作。
  while (current !== previous && iterations < MAX_ITERATIONS) {
    // previous 集合更新为 `current`，确保共享工具后续读取最新状态。
    previous = current

    // Apply NFKC normalization to handle composed character sequences
    // current更新为 `current.normalize('NFKC')`，确保共享工具后续读取最新状态。
    current = current.normalize('NFKC')

    // Remove dangerous Unicode categories using explicit character ranges

    // Method 1: Strip dangerous Unicode property classes
    // This is the primary defence and is the solution that is widely used in OSS libraries.
    // current更新为 `current.replace(/[\p{Cf}\p{Co}\p{Cn}]/gu, '')`，确保共享工具后续读取最新状态。
    current = current.replace(/[\p{Cf}\p{Co}\p{Cn}]/gu, '')

    // Method 2: Explicit character ranges. There are some subtle issues with the above method
    // failing in certain environments that don't support regexes for unicode property classes,
    // so we also implement a fallback that strips out some specifically known dangerous ranges.
    // current更新为 `current`，确保共享工具后续读取最新状态。
    current = current
      .replace(/[\u200B-\u200F]/g, '') // Zero-width spaces, LTR/RTL marks
      .replace(/[\u202A-\u202E]/g, '') // Directional formatting characters
      .replace(/[\u2066-\u2069]/g, '') // Directional isolates
      .replace(/[\uFEFF]/g, '') // Byte order mark
      .replace(/[\uE000-\uF8FF]/g, '') // Basic Multilingual Plane private use

    // 共享工具 sanitization在这里处理 `iterations++`，完成这一小步状态转换。
    iterations++
  }

  // If we hit max iterations, crash loudly. This should only ever happen if there is a bug or if someone purposefully created a deeply nested unicode string.
  // 满足 `iterations >= MAX_ITERATIONS` 时，共享工具执行该分支。
  if (iterations >= MAX_ITERATIONS) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      `Unicode sanitization reached maximum iterations (${MAX_ITERATIONS}) for input: ${prompt.slice(0, 100)}`,
    )
  }

  // 返回 `current`，作为共享工具这次计算的结果。
  return current
}

// recursivelySanitizeUnicode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recursivelySanitizeUnicode(value: string): string
export function recursivelySanitizeUnicode<T>(value: T[]): T[]
export function recursivelySanitizeUnicode<T extends object>(value: T): T
export function recursivelySanitizeUnicode<T>(value: T): T
// recursivelySanitizeUnicode 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recursivelySanitizeUnicode(value: unknown): unknown {
  // 当 `typeof value` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof value === 'string') {
    // 返回 `partiallySanitizeUnicode(value)`，作为共享工具这次计算的结果。
    return partiallySanitizeUnicode(value)
  }

  // 满足 `Array.isArray(value)` 时，共享工具执行该分支。
  if (Array.isArray(value)) {
    // 返回 `value.map(recursivelySanitizeUnicode)`，作为共享工具这次计算的结果。
    return value.map(recursivelySanitizeUnicode)
  }

  // 当 `value !== null && typeof value` 匹配 `'object'` 时，共享工具执行对应分支。
  if (value !== null && typeof value === 'object') {
    // sanitized 从空对象开始收集键值，后续按名称补齐内容。
    const sanitized: Record<string, unknown> = {}
    // 循环处理 `const [key, val] of Object.entries(value)`，让共享工具把同类条目按顺序走完。
    for (const [key, val] of Object.entries(value)) {
      // 共享工具 sanitization在这里处理 `sanitized[recursivelySanitizeUnicode(key)] =`，完成这一小步状态转换。
      sanitized[recursivelySanitizeUnicode(key)] =
        recursivelySanitizeUnicode(val)
    }
    // 返回 `sanitized`，作为共享工具这次计算的结果。
    return sanitized
  }

  // Return other primitive values (numbers, booleans, null, undefined) unchanged
  // 返回 `value`，作为共享工具这次计算的结果。
  return value
}
