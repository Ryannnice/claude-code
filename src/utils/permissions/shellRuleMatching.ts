/**
 * Shared permission rule matching utilities for shell tools.
 *
 * Extracts common logic for:
 * - Parsing permission rules (exact, prefix, wildcard)
 * - Matching commands against rules
 * - Generating permission suggestions
 */

// 类型依赖 { PermissionUpdate } 来自 ./PermissionUpdateSchema.js，用于校准权限判定的数据契约。
import type { PermissionUpdate } from './PermissionUpdateSchema.js'

// Null-byte sentinel placeholders for wildcard pattern escaping — module-level
// so the RegExp objects are compiled once instead of per permission check.
// ESCAPED_STAR_PLACEHOLDER 命名 `'\x00ESCAPED_STAR\x00'`，让后续代码直接表达这个值的用途。
const ESCAPED_STAR_PLACEHOLDER = '\x00ESCAPED_STAR\x00'
// ESCAPED_BACKSLASH_PLACEHOLDER保存`'\x00ESCAPED_BACKSLASH\x00'`，作为后续固定文本处理的输入。
const ESCAPED_BACKSLASH_PLACEHOLDER = '\x00ESCAPED_BACKSLASH\x00'
// ESCAPED_STAR_PLACEHOLDER_RE匹配`RegExp`，供权限判定后续处理使用。
const ESCAPED_STAR_PLACEHOLDER_RE = new RegExp(ESCAPED_STAR_PLACEHOLDER, 'g')
// ESCAPED_BACKSLASH_PLACEHOLDER_RE匹配`RegExp`，供权限判定后续处理使用。
const ESCAPED_BACKSLASH_PLACEHOLDER_RE = new RegExp(
  ESCAPED_BACKSLASH_PLACEHOLDER,
  'g',
)

/**
 * Parsed permission rule discriminated union.
 */
// ShellPermissionRule 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type ShellPermissionRule =
  | {
      type: 'exact'
      command: string
    }
  | {
      type: 'prefix'
      prefix: string
    }
  | {
      type: 'wildcard'
      pattern: string
    }

/**
 * Extract prefix from legacy :* syntax (e.g., "npm:*" -> "npm")
 * This is maintained for backwards compatibility.
 */
// permissionRuleExtractPrefix 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionRuleExtractPrefix(
  permissionRule: string,
): string | null {
  // match匹配`permissionRule.match`，供权限判定后续处理使用。
  const match = permissionRule.match(/^(.+):\*$/)
  // 返回 `match?.[1] ?? null`，作为权限判定这次计算的结果。
  return match?.[1] ?? null
}

/**
 * Check if a pattern contains unescaped wildcards (not legacy :* syntax).
 * Returns true if the pattern contains * that are not escaped with \ or part of :* at the end.
 */
// hasWildcards 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasWildcards(pattern: string): boolean {
  // If it ends with :*, it's legacy prefix syntax, not wildcard
  // 满足 `pattern.endsWith(':*')` 时，权限判定执行该分支。
  if (pattern.endsWith(':*')) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // Check for unescaped * anywhere in the pattern
  // An asterisk is unescaped if it's not preceded by a backslash,
  // or if it's preceded by an even number of backslashes (escaped backslashes)
  // 按索引扫描 `pattern.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < pattern.length; i++) {
    // 当 `pattern[i]` 匹配 `'*'` 时，权限判定执行对应分支。
    if (pattern[i] === '*') {
      // Count backslashes before this asterisk
      // backslashCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let backslashCount = 0
      // j保存`i - 1`，供权限判定权限工具 shell Rule Matching后续判断或输出使用。
      let j = i - 1
      // while 使用 j >= 0 && pattern[j] === '\\' 完成权限判定里的对应操作。
      while (j >= 0 && pattern[j] === '\\') {
        // 权限工具 shell Rule Matching在这里处理 `backslashCount++`，完成这一小步状态转换。
        backslashCount++
        // 权限工具 shell Rule Matching在这里处理 `j--`，完成这一小步状态转换。
        j--
      }
      // If even number of backslashes (including 0), the asterisk is unescaped
      // 满足 `backslashCount % 2 === 0` 时，权限判定执行该分支。
      if (backslashCount % 2 === 0) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Match a command against a wildcard pattern.
 * Wildcards (*) match any sequence of characters.
 * Use \* to match a literal asterisk character.
 * Use \\ to match a literal backslash.
 *
 * @param pattern - The permission rule pattern with wildcards
 * @param command - The command to match against
 * @returns true if the command matches the pattern
 */
// matchWildcardPattern 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function matchWildcardPattern(
  pattern: string,
  command: string,
  caseInsensitive = false,
): boolean {
  // Trim leading/trailing whitespace from pattern
  // trimmedPattern格式化`pattern.trim`，供权限判定后续处理使用。
  const trimmedPattern = pattern.trim()

  // Process the pattern to handle escape sequences: \* and \\
  // processed 命名 `''`，让后续代码直接表达这个值的用途。
  let processed = ''
  // i保存`0`，供后续判断或组装使用。
  let i = 0

  // while 使用 i < trimmedPattern.length 完成权限判定里的对应操作。
  while (i < trimmedPattern.length) {
    // char格式化`trimmedPattern[i]` 整理出中间结果，供权限判定权限工具 shell Rule Matching后续步骤使用。
    const char = trimmedPattern[i]

    // Handle escape sequences
    // 只有 `char === '\\' && i + 1 < trimmedPattern.length` 满足时，权限判定才执行该分支。
    if (char === '\\' && i + 1 < trimmedPattern.length) {
      // nextChar读取 `trimmedPattern[i + 1]` 对应条目，后续围绕该成员继续处理。
      const nextChar = trimmedPattern[i + 1]
      // 当 `nextChar` 匹配 `'*'` 时，权限判定执行对应分支。
      if (nextChar === '*') {
        // \* -> literal asterisk placeholder
        // 权限工具 shell Rule Matching在这里处理 `processed += ESCAPED_STAR_PLACEHOLDER`，完成这一小步状态转换。
        processed += ESCAPED_STAR_PLACEHOLDER
        // 权限工具 shell Rule Matching在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理权限判定中的下一轮循环。
        continue
      // 权限工具 shell Rule Matching在这里处理 `} else if (nextChar === '\\') {`，完成这一小步状态转换。
      } else if (nextChar === '\\') {
        // \\ -> literal backslash placeholder
        // 权限工具 shell Rule Matching在这里处理 `processed += ESCAPED_BACKSLASH_PLACEHOLDER`，完成这一小步状态转换。
        processed += ESCAPED_BACKSLASH_PLACEHOLDER
        // 权限工具 shell Rule Matching在这里处理 `i += 2`，完成这一小步状态转换。
        i += 2
        // 跳过当前项，继续处理权限判定中的下一轮循环。
        continue
      }
    }

    // 权限工具 shell Rule Matching在这里处理 `processed += char`，完成这一小步状态转换。
    processed += char
    // 权限工具 shell Rule Matching在这里处理 `i++`，完成这一小步状态转换。
    i++
  }

  // Escape regex special characters except *
  // escaped格式化`processed.replace`，供权限判定后续处理使用。
  const escaped = processed.replace(/[.+?^${}()|[\]\\'"]/g, '\\$&')

  // Convert unescaped * to .* for wildcard matching
  // withWildcards 集合格式化`escaped.replace`，供权限判定后续处理使用。
  const withWildcards = escaped.replace(/\*/g, '.*')

  // Convert placeholders back to escaped regex literals
  // regexPattern保存`withWildcards`，供权限判定权限工具 shell Rule Matching后续步骤使用。
  let regexPattern = withWildcards
    .replace(ESCAPED_STAR_PLACEHOLDER_RE, '\\*')
    .replace(ESCAPED_BACKSLASH_PLACEHOLDER_RE, '\\\\')

  // When a pattern ends with ' *' (space + unescaped wildcard) AND the trailing
  // wildcard is the ONLY unescaped wildcard, make the trailing space-and-args
  // optional so 'git *' matches both 'git add' and bare 'git'.
  // This aligns wildcard matching with prefix rule semantics (git:*).
  // Multi-wildcard patterns like '* run *' are excluded — making the last
  // wildcard optional would incorrectly match 'npm run' (no trailing arg).
  // unescapedStarCount匹配`processed.match`，供权限判定后续处理使用。
  const unescapedStarCount = (processed.match(/\*/g) || []).length
  // 判断 regexPattern.endsWith(' .*') && unescapedStarCount === 1，将权限判定分流到只适用于该条件的处理路径。
  if (regexPattern.endsWith(' .*') && unescapedStarCount === 1) {
    // regexPattern更新为 `regexPattern.slice(0, -3) + '( .*)?'`，确保共享工具后续读取最新状态。
    regexPattern = regexPattern.slice(0, -3) + '( .*)?'
  }

  // Create regex that matches the entire string.
  // The 's' (dotAll) flag makes '.' match newlines, so wildcards match
  // commands containing embedded newlines (e.g. heredoc content after splitCommand_DEPRECATED).
  // flags 集合保存`'s' + (caseInsensitive ? 'i' : '')`，供权限判定权限工具 shell Rule Matching后续步骤使用。
  const flags = 's' + (caseInsensitive ? 'i' : '')
  // regex匹配`RegExp`，供权限判定后续处理使用。
  const regex = new RegExp(`^${regexPattern}$`, flags)

  // 返回 regex.test(command)，把权限判定这个分支的结果交还调用方。
  return regex.test(command)
}

/**
 * Parse a permission rule string into a structured rule object.
 */
// parsePermissionRule 承担权限判定中的独立步骤，串起权限工具 shell Rule Matching需要的输入整理、状态更新和结果输出。
export function parsePermissionRule(
  permissionRule: string,
): ShellPermissionRule {
  // Check for legacy :* prefix syntax first (backwards compatibility)
  // prefix保存`permissionRuleExtractPrefix`，供权限判定后续处理使用。
  const prefix = permissionRuleExtractPrefix(permissionRule)
  // `prefix` 与 `null` 不一致时刷新派生状态。
  if (prefix !== null) {
    // 返回 {，把权限判定这个分支的结果交还调用方。
    return {
      type: 'prefix',
      prefix,
    }
  }

  // Check for new wildcard syntax (contains * but not :* at end)
  // 判断 hasWildcards(permissionRule)，将权限判定分流到只适用于该条件的处理路径。
  if (hasWildcards(permissionRule)) {
    // 返回 {，把权限判定这个分支的结果交还调用方。
    return {
      type: 'wildcard',
      pattern: permissionRule,
    }
  }

  // Otherwise, it's an exact match
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    type: 'exact',
    command: permissionRule,
  }
}

/**
 * Generate permission update suggestion for an exact command match.
 */
// suggestionForExactCommand 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function suggestionForExactCommand(
  toolName: string,
  command: string,
): PermissionUpdate[] {
  // 返回列表结果，保留权限判定已经排好的条目顺序。
  return [
    {
      type: 'addRules',
      rules: [
        {
          toolName,
          ruleContent: command,
        },
      ],
      behavior: 'allow',
      destination: 'localSettings',
    },
  ]
}

/**
 * Generate permission update suggestion for a prefix match.
 */
// suggestionForPrefix 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function suggestionForPrefix(
  toolName: string,
  prefix: string,
): PermissionUpdate[] {
  // 返回列表结果，保留权限判定已经排好的条目顺序。
  return [
    {
      type: 'addRules',
      rules: [
        {
          toolName,
          ruleContent: `${prefix}:*`,
        },
      ],
      behavior: 'allow',
      destination: 'localSettings',
    },
  ]
}
