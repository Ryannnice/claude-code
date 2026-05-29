// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 接入 AGENT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { AGENT_TOOL_NAME } from '../../tools/AgentTool/constants.js'
// 接入 TASK_OUTPUT_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_OUTPUT_TOOL_NAME } from '../../tools/TaskOutputTool/constants.js'
// 接入 TASK_STOP_TOOL_NAME 工具实现，后续工具池会按权限和开关决定是否暴露。
import { TASK_STOP_TOOL_NAME } from '../../tools/TaskStopTool/prompt.js'
// 类型依赖 { PermissionRuleValue } 来自 ./PermissionRule.js，用于校准权限判定的数据契约。
import type { PermissionRuleValue } from './PermissionRule.js'

// Dead code elimination: ant-only tool names are conditionally required so
// their strings don't leak into external builds. Static imports always bundle.
/* eslint-disable @typescript-eslint/no-require-imports */
// BRIEF_TOOL_NAME 先占位，稍后的条件分支会根据实际输入补齐它。
const BRIEF_TOOL_NAME: string | null =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (
        require('../../tools/BriefTool/prompt.js') as typeof import('../../tools/BriefTool/prompt.js')
      ).BRIEF_TOOL_NAME
    : null
/* eslint-enable @typescript-eslint/no-require-imports */

// Maps legacy tool names to their current canonical names.
// When a tool is renamed, add old → new here so permission rules,
// hooks, and persisted wire names resolve to the canonical name.
// LEGACY_TOOL_NAME_ALIASES 集合 集中保存权限工具 permission Rule Parser要一起传递的字段。
const LEGACY_TOOL_NAME_ALIASES: Record<string, string> = {
  Task: AGENT_TOOL_NAME,
  KillShell: TASK_STOP_TOOL_NAME,
  AgentOutputTool: TASK_OUTPUT_TOOL_NAME,
  BashOutputTool: TASK_OUTPUT_TOOL_NAME,
  ...((feature('KAIROS') || feature('KAIROS_BRIEF')) && BRIEF_TOOL_NAME
    ? { Brief: BRIEF_TOOL_NAME }
    : {}),
}

// normalizeLegacyToolName 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeLegacyToolName(name: string): string {
  // 返回 `LEGACY_TOOL_NAME_ALIASES[name] ?? name`，作为权限判定这次计算的结果。
  return LEGACY_TOOL_NAME_ALIASES[name] ?? name
}

// getLegacyToolNames 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getLegacyToolNames(canonicalName: string): string[] {
  // 结果 从空数组开始收集，后续循环会按处理顺序追加条目。
  const result: string[] = []
  // 循环处理 `const [legacy, canonical] of Object.entries(LEGACY_TOOL_NAME_ALIASES)`，让权限判定把同类条目按顺序走完。
  for (const [legacy, canonical] of Object.entries(LEGACY_TOOL_NAME_ALIASES)) {
    // 满足 `canonical === canonicalName) result.push(legacy` 时，权限判定执行该分支。
    if (canonical === canonicalName) result.push(legacy)
  }
  // 返回 `result`，作为权限判定这次计算的结果。
  return result
}

/**
 * Escapes special characters in rule content for safe storage in permission rules.
 * Permission rules use the format "Tool(content)", so parentheses in content must be escaped.
 *
 * Escaping order matters:
 * 1. Escape existing backslashes first (\ -> \\)
 * 2. Then escape parentheses (( -> \(, ) -> \))
 *
 * @example
 * escapeRuleContent('psycopg2.connect()') // => 'psycopg2.connect\\(\\)'
 * escapeRuleContent('echo "test\\nvalue"') // => 'echo "test\\\\nvalue"'
 */
// escapeRuleContent 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function escapeRuleContent(content: string): string {
  // 返回 `content`，作为权限判定这次计算的结果。
  return content
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/\(/g, '\\(') // Escape opening parentheses
    .replace(/\)/g, '\\)') // Escape closing parentheses
}

/**
 * Unescapes special characters in rule content after parsing from permission rules.
 * This reverses the escaping done by escapeRuleContent.
 *
 * Unescaping order matters (reverse of escaping):
 * 1. Unescape parentheses first (\( -> (, \) -> ))
 * 2. Then unescape backslashes (\\ -> \)
 *
 * @example
 * unescapeRuleContent('psycopg2.connect\\(\\)') // => 'psycopg2.connect()'
 * unescapeRuleContent('echo "test\\\\nvalue"') // => 'echo "test\\nvalue"'
 */
// unescapeRuleContent 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function unescapeRuleContent(content: string): string {
  // 返回 `content`，作为权限判定这次计算的结果。
  return content
    .replace(/\\\(/g, '(') // Unescape opening parentheses
    .replace(/\\\)/g, ')') // Unescape closing parentheses
    .replace(/\\\\/g, '\\') // Unescape backslashes last
}

/**
 * Parses a permission rule string into its components.
 * Handles escaped parentheses in the content portion.
 *
 * Format: "ToolName" or "ToolName(content)"
 * Content may contain escaped parentheses: \( and \)
 *
 * @example
 * permissionRuleValueFromString('Bash') // => { toolName: 'Bash' }
 * permissionRuleValueFromString('Bash(npm install)') // => { toolName: 'Bash', ruleContent: 'npm install' }
 * permissionRuleValueFromString('Bash(python -c "print\\(1\\)")') // => { toolName: 'Bash', ruleContent: 'python -c "print(1)"' }
 */
// permissionRuleValueFromString 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionRuleValueFromString(
  ruleString: string,
): PermissionRuleValue {
  // Find the first unescaped opening parenthesis
  // openParenIndex 索引筛选`findFirstUnescapedChar`，供权限判定后续处理使用。
  const openParenIndex = findFirstUnescapedChar(ruleString, '(')
  // 满足 `openParenIndex === -1` 时，权限判定执行该分支。
  if (openParenIndex === -1) {
    // No parenthesis found - this is just a tool name
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { toolName: normalizeLegacyToolName(ruleString) }
  }

  // Find the last unescaped closing parenthesis
  // closeParenIndex 索引筛选`findLastUnescapedChar`，供权限判定后续处理使用。
  const closeParenIndex = findLastUnescapedChar(ruleString, ')')
  // 只有 `closeParenIndex === -1 || closeParenIndex <= open` 满足时，权限判定才执行该分支。
  if (closeParenIndex === -1 || closeParenIndex <= openParenIndex) {
    // No matching closing paren or malformed - treat as tool name
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { toolName: normalizeLegacyToolName(ruleString) }
  }

  // Ensure the closing paren is at the end
  // `closeParenIndex` 与 `ruleString.length - 1` 不一致时刷新派生状态，避免使用过期结果。
  if (closeParenIndex !== ruleString.length - 1) {
    // Content after closing paren - treat as tool name
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { toolName: normalizeLegacyToolName(ruleString) }
  }

  // toolName格式化`ruleString.substring`，供权限判定后续处理使用。
  const toolName = ruleString.substring(0, openParenIndex)
  // rawContent格式化`ruleString.substring`，供权限判定后续处理使用。
  const rawContent = ruleString.substring(openParenIndex + 1, closeParenIndex)

  // Missing toolName (e.g., "(foo)") is malformed - treat whole string as tool name
  // toolName缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!toolName) {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { toolName: normalizeLegacyToolName(ruleString) }
  }

  // Empty content (e.g., "Bash()") or standalone wildcard (e.g., "Bash(*)")
  // should be treated as just the tool name (tool-wide rule)
  // 当 `rawContent` 匹配 `'' || rawContent === '*'` 时，权限判定执行对应分支。
  if (rawContent === '' || rawContent === '*') {
    // 返回结构化结果，集中表达权限判定已经整理出的状态。
    return { toolName: normalizeLegacyToolName(toolName) }
  }

  // Unescape the content
  // ruleContent保存`unescapeRuleContent`，供权限判定后续处理使用。
  const ruleContent = unescapeRuleContent(rawContent)
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return { toolName: normalizeLegacyToolName(toolName), ruleContent }
}

/**
 * Converts a permission rule value to its string representation.
 * Escapes parentheses in the content to prevent parsing issues.
 *
 * @example
 * permissionRuleValueToString({ toolName: 'Bash' }) // => 'Bash'
 * permissionRuleValueToString({ toolName: 'Bash', ruleContent: 'npm install' }) // => 'Bash(npm install)'
 * permissionRuleValueToString({ toolName: 'Bash', ruleContent: 'python -c "print(1)"' }) // => 'Bash(python -c "print\\(1\\)")'
 */
// permissionRuleValueToString 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function permissionRuleValueToString(
  ruleValue: PermissionRuleValue,
): string {
  // ruleValue.ruleContent缺失时直接走兜底路径，避免权限判定使用无效输入。
  if (!ruleValue.ruleContent) {
    // 返回 `ruleValue.toolName`，作为权限判定这次计算的结果。
    return ruleValue.toolName
  }
  // escapedContent保存`escapeRuleContent`，供权限判定后续处理使用。
  const escapedContent = escapeRuleContent(ruleValue.ruleContent)
  // 返回 ``${ruleValue.toolName}(${escapedContent})``，作为权限判定这次计算的结果。
  return `${ruleValue.toolName}(${escapedContent})`
}

/**
 * Find the index of the first unescaped occurrence of a character.
 * A character is escaped if preceded by an odd number of backslashes.
 */
// findFirstUnescapedChar 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findFirstUnescapedChar(str: string, char: string): number {
  // 按索引扫描 `str.length`，需要消费相邻参数时可以精确移动游标。
  for (let i = 0; i < str.length; i++) {
    // 满足 `str[i] === char` 时，权限判定执行该分支。
    if (str[i] === char) {
      // Count preceding backslashes
      // backslashCount 数量保存`0`，供后续判断或组装使用。
      let backslashCount = 0
      // j 命名 `i - 1`，让后续代码直接表达这个值的用途。
      let j = i - 1
      // while 使用 j >= 0 && str[j] === '\\' 完成权限判定里的对应操作。
      while (j >= 0 && str[j] === '\\') {
        // 权限工具 permission Rule Parser在这里处理 `backslashCount++`，完成这一小步状态转换。
        backslashCount++
        // 权限工具 permission Rule Parser在这里处理 `j--`，完成这一小步状态转换。
        j--
      }
      // If even number of backslashes, the char is unescaped
      // 满足 `backslashCount % 2 === 0` 时，权限判定执行该分支。
      if (backslashCount % 2 === 0) {
        // 返回 `i`，作为权限判定这次计算的结果。
        return i
      }
    }
  }
  // 返回 `-1`，作为权限判定这次计算的结果。
  return -1
}

/**
 * Find the index of the last unescaped occurrence of a character.
 * A character is escaped if preceded by an odd number of backslashes.
 */
// findLastUnescapedChar 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function findLastUnescapedChar(str: string, char: string): number {
  // 循环处理 `let i = str.length - 1; i >= 0; i--`，让权限判定逐项把同类条目按顺序走完。
  for (let i = str.length - 1; i >= 0; i--) {
    // 满足 `str[i] === char` 时，权限判定执行该分支。
    if (str[i] === char) {
      // Count preceding backslashes
      // backslashCount 数量保存`0`，供后续判断或组装使用。
      let backslashCount = 0
      // j 命名 `i - 1`，让后续代码直接表达这个值的用途。
      let j = i - 1
      // while 使用 j >= 0 && str[j] === '\\' 完成权限判定里的对应操作。
      while (j >= 0 && str[j] === '\\') {
        // 权限工具 permission Rule Parser在这里处理 `backslashCount++`，完成这一小步状态转换。
        backslashCount++
        // 权限工具 permission Rule Parser在这里处理 `j--`，完成这一小步状态转换。
        j--
      }
      // If even number of backslashes, the char is unescaped
      // 满足 `backslashCount % 2 === 0` 时，权限判定执行该分支。
      if (backslashCount % 2 === 0) {
        // 返回 `i`，作为权限判定这次计算的结果。
        return i
      }
    }
  }
  // 返回 `-1`，作为权限判定这次计算的结果。
  return -1
}
