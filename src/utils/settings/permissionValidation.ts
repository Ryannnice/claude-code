// 引入 z，将 zod/v4 中已经封装好的能力接到本文件流程里。
import { z } from 'zod/v4'
// 接入 mcpInfoFromString 服务层能力，把外部通信或共享状态交给 ../../services/mcp/mcpStringUtils.js 处理。
import { mcpInfoFromString } from '../../services/mcp/mcpStringUtils.js'
// 引入 lazySchema，将 ../lazySchema.js 中已经封装好的能力接到本文件流程里。
import { lazySchema } from '../lazySchema.js'
// 引入 permissionRuleValueFromString，将 ../permissions/permissionRuleParser.js 中已经封装好的能力接到本文件流程里。
import { permissionRuleValueFromString } from '../permissions/permissionRuleParser.js'
// 引入 capitalize，将 ../stringUtils.js 中已经封装好的能力接到本文件流程里。
import { capitalize } from '../stringUtils.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getCustomValidation,
  isBashPrefixTool,
  isFilePatternTool,
} from './toolValidationConfig.js'

/**
 * Checks if a character at a given index is escaped (preceded by odd number of backslashes).
 */
// isEscaped 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isEscaped(str: string, index: number): boolean {
  // backslashCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let backslashCount = 0
  // j保存`index - 1`，供后续判断或组装使用。
  let j = index - 1
  // while 使用 j >= 0 && str[j] === '\\' 完成共享工具里的对应操作。
  while (j >= 0 && str[j] === '\\') {
    // 共享工具 permission Validation在这里处理 `backslashCount++`，完成这一小步状态转换。
    backslashCount++
    // 共享工具 permission Validation在这里处理 `j--`，完成这一小步状态转换。
    j--
  }
  // 返回 `backslashCount % 2 !== 0`，作为共享工具这次计算的结果。
  return backslashCount % 2 !== 0
}

/**
 * Counts unescaped occurrences of a character in a string.
 * A character is considered escaped if preceded by an odd number of backslashes.
 */
// countUnescapedChar 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function countUnescapedChar(str: string, char: string): number {
  // count 数量 命名 `0`，让后续代码直接表达这个值的用途。
  let count = 0
  // 按索引扫描 `str.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < str.length; i++) {
    // 只有 `str[i] === char && !isEscaped(str, i)` 满足时，共享工具才执行该分支。
    if (str[i] === char && !isEscaped(str, i)) {
      // 共享工具 permission Validation在这里处理 `count++`，完成这一小步状态转换。
      count++
    }
  }
  // 返回 `count`，作为共享工具这次计算的结果。
  return count
}

/**
 * Checks if a string contains unescaped empty parentheses "()".
 * Returns true only if both the "(" and ")" are unescaped and adjacent.
 */
// hasUnescapedEmptyParens 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function hasUnescapedEmptyParens(str: string): boolean {
  // 按索引扫描 `str.length - 1`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < str.length - 1; i++) {
    // 当 `str[i]` 匹配 `'(' && str[i + 1] === ')'` 时，共享工具执行对应分支。
    if (str[i] === '(' && str[i + 1] === ')') {
      // Check if the opening paren is unescaped
      // 满足 `!isEscaped(str, i)` 时，共享工具执行该分支。
      if (!isEscaped(str, i)) {
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      }
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Validates permission rule format and content
 */
// validatePermissionRule 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validatePermissionRule(rule: string): {
  valid: boolean
  error?: string
  suggestion?: string
  examples?: string[]
} {
  // Empty rule check
  // 只有 `!rule || rule.trim() === ''` 满足时，共享工具才执行该分支。
  if (!rule || rule.trim() === '') {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: false, error: 'Permission rule cannot be empty' }
  }

  // Check parentheses matching first (only count unescaped parens)
  // openCount 数量统计`countUnescapedChar`，供共享工具后续处理使用。
  const openCount = countUnescapedChar(rule, '(')
  // closeCount 数量统计`countUnescapedChar`，供共享工具后续处理使用。
  const closeCount = countUnescapedChar(rule, ')')
  // `openCount` 与 `closeCount` 不一致时刷新派生状态，避免使用过期结果。
  if (openCount !== closeCount) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      error: 'Mismatched parentheses',
      suggestion:
        'Ensure all opening parentheses have matching closing parentheses',
    }
  }

  // Check for empty parentheses (escape-aware)
  // 满足 `hasUnescapedEmptyParens(rule)` 时，共享工具执行该分支。
  if (hasUnescapedEmptyParens(rule)) {
    // toolName格式化`rule.substring`，供共享工具后续处理使用。
    const toolName = rule.substring(0, rule.indexOf('('))
    // toolName缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!toolName) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'Empty parentheses with no tool name',
        suggestion: 'Specify a tool name before the parentheses',
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      error: 'Empty parentheses',
      suggestion: `Either specify a pattern or use just "${toolName}" without parentheses`,
      examples: [`${toolName}`, `${toolName}(some-pattern)`],
    }
  }

  // Parse the rule
  // 解析结果保存`permissionRuleValueFromString`，供共享工具后续处理使用。
  const parsed = permissionRuleValueFromString(rule)

  // MCP validation - must be done before general tool validation
  // mcpInfo保存`mcpInfoFromString`，供共享工具后续处理使用。
  const mcpInfo = mcpInfoFromString(parsed.toolName)
  // 满足 `mcpInfo` 时，共享工具执行该分支。
  if (mcpInfo) {
    // MCP rules support server-level, tool-level, and wildcard permissions
    // Valid formats:
    // - mcp__server (server-level, all tools)
    // - mcp__server__* (wildcard, all tools - equivalent to server-level)
    // - mcp__server__tool (specific tool)

    // MCP rules cannot have any pattern/content (parentheses)
    // Check both parsed content and raw string since the parser normalizes
    // standalone wildcards (e.g., "mcp__server(*)") to undefined ruleContent
    // `parsed.ruleContent` 与 `undefined || countUnescapedChar...` 不一致时刷新派生状态，避免使用过期结果。
    if (parsed.ruleContent !== undefined || countUnescapedChar(rule, '(') > 0) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'MCP rules do not support patterns in parentheses',
        suggestion: `Use "${parsed.toolName}" without parentheses, or use "mcp__${mcpInfo.serverName}__*" for all tools`,
        examples: [
          `mcp__${mcpInfo.serverName}`,
          `mcp__${mcpInfo.serverName}__*`,
          mcpInfo.toolName && mcpInfo.toolName !== '*'
            ? `mcp__${mcpInfo.serverName}__${mcpInfo.toolName}`
            : undefined,
        ].filter(Boolean) as string[],
      }
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true } // Valid MCP rule
  }

  // Tool name validation (for non-MCP tools)
  // !parsed.toolName || parsed.tool...为空时立即返回或跳过，避免共享工具把空集合当成可处理内容。
  if (!parsed.toolName || parsed.toolName.length === 0) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: false, error: 'Tool name cannot be empty' }
  }

  // Check tool name starts with uppercase (standard tools)
  // `parsed.toolName[0]` 与 `parsed.toolName[0]?.toUpperCase...` 不一致时刷新派生状态，避免使用过期结果。
  if (parsed.toolName[0] !== parsed.toolName[0]?.toUpperCase()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      error: 'Tool names must start with uppercase',
      suggestion: `Use "${capitalize(String(parsed.toolName))}"`,
    }
  }

  // Check for custom validation rules first
  // customValidation读取`getCustomValidation`，供共享工具后续处理使用。
  const customValidation = getCustomValidation(parsed.toolName)
  // `customValidation && parsed.ruleContent` 与 `undefi` 不一致时刷新派生状态，避免使用过期结果。
  if (customValidation && parsed.ruleContent !== undefined) {
    // customResult保存`customValidation`，供共享工具后续处理使用。
    const customResult = customValidation(parsed.ruleContent)
    // customResult.valid缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!customResult.valid) {
      // 返回 `customResult`，作为共享工具这次计算的结果。
      return customResult
    }
  }

  // Bash-specific validation
  // `isBashPrefixTool(parsed.toolName) && parsed...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (isBashPrefixTool(parsed.toolName) && parsed.ruleContent !== undefined) {
    // 文本内容解析`parsed.ruleContent`，供后续判断或组装使用。
    const content = parsed.ruleContent

    // Check for common :* mistakes - :* must be at the end (legacy prefix syntax)
    // 只有 `content.includes(':*') && !content.endsWith(':*')` 满足时，共享工具才执行该分支。
    if (content.includes(':*') && !content.endsWith(':*')) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'The :* pattern must be at the end',
        suggestion:
          'Move :* to the end for prefix matching, or use * for wildcard matching',
        examples: [
          'Bash(npm run:*) - prefix matching (legacy)',
          'Bash(npm run *) - wildcard matching',
        ],
      }
    }

    // Check for :* without a prefix
    // 当 `content` 匹配 `':*'` 时，共享工具执行对应分支。
    if (content === ':*') {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'Prefix cannot be empty before :*',
        suggestion: 'Specify a command prefix before :*',
        examples: ['Bash(npm:*)', 'Bash(git:*)'],
      }
    }

    // Note: We don't validate quote balancing because bash quoting rules are complex.
    // A command like `grep '"'` has valid unbalanced double quotes.
    // Users who create patterns with unintended quote mismatches will discover
    // the issue when matching doesn't work as expected.

    // Wildcards are now allowed at any position for flexible pattern matching
    // Examples of valid wildcard patterns:
    // - "npm *" matches "npm install", "npm run test", etc.
    // - "* install" matches "npm install", "yarn install", etc.
    // - "git * main" matches "git checkout main", "git push main", etc.
    // - "npm * --save" matches "npm install foo --save", etc.
    //
    // Legacy :* syntax continues to work for backwards compatibility:
    // - "npm:*" matches "npm" or "npm <anything>" (prefix matching with word boundary)
  }

  // File tool validation
  // `isFilePatternTool(parsed.toolName) && parse...` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (isFilePatternTool(parsed.toolName) && parsed.ruleContent !== undefined) {
    // 文本内容解析`parsed.ruleContent`，供后续判断或组装使用。
    const content = parsed.ruleContent

    // Check for :* in file patterns (common mistake from Bash patterns)
    // 满足 `content.includes(':*')` 时，共享工具执行该分支。
    if (content.includes(':*')) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'The ":*" syntax is only for Bash prefix rules',
        suggestion: 'Use glob patterns like "*" or "**" for file matching',
        examples: [
          `${parsed.toolName}(*.ts) - matches .ts files`,
          `${parsed.toolName}(src/**) - matches all files in src`,
          `${parsed.toolName}(**/*.test.ts) - matches test files`,
        ],
      }
    }

    // Warn about wildcards not at boundaries
    // 共享工具在这里按实际状态进入对应分支。
    if (
      content.includes('*') &&
      !content.match(/^\*|\*$|\*\*|\/\*|\*\.|\*\)/) &&
      !content.includes('**')
    ) {
      // This is a loose check - wildcards in the middle might be valid in some cases
      // but often indicate confusion
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        valid: false,
        error: 'Wildcard placement might be incorrect',
        suggestion: 'Wildcards are typically used at path boundaries',
        examples: [
          `${parsed.toolName}(*.js) - all .js files`,
          `${parsed.toolName}(src/*) - all files directly in src`,
          `${parsed.toolName}(src/**) - all files recursively in src`,
        ],
      }
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { valid: true }
}

/**
 * Custom Zod schema for permission rule arrays
 */
// PermissionRuleSchema 权限数据保存`lazySchema`，供共享工具后续处理使用。
export const PermissionRuleSchema = lazySchema(() =>
  // 调用 z.string，触发共享工具此处需要的副作用。
  z.string().superRefine((val, ctx) => {
    // 结果读取`validatePermissionRule`，供共享工具后续处理使用。
    const result = validatePermissionRule(val)
    // result.valid缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result.valid) {
      // 消息 命名 `result.error!`，让后续代码直接表达这个值的用途。
      let message = result.error!
      // 满足 `result.suggestion` 时，共享工具执行该分支。
      if (result.suggestion) {
        // 共享工具 permission Validation在这里处理 `message += `. ${result.suggestion}``，完成这一小步状态转换。
        message += `. ${result.suggestion}`
      }
      // 只有 `result.examples && result.examples.length > 0` 满足时，共享工具才执行该分支。
      if (result.examples && result.examples.length > 0) {
        // 共享工具 permission Validation在这里处理 `message += `. Examples: ${result.examples.join(', ')}``，完成这一小步状态转换。
        message += `. Examples: ${result.examples.join(', ')}`
      }
      // 调用 ctx.addIssue，触发共享工具此处需要的副作用。
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        params: { received: val },
      })
    }
  }),
)
