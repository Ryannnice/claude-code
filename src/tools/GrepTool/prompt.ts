// 引入 AGENT_TOOL_NAME，将 ../AgentTool/constants.js 中已经封装好的能力接到本文件流程里。
import { AGENT_TOOL_NAME } from '../AgentTool/constants.js'
// 引入 BASH_TOOL_NAME，将 ../BashTool/toolName.js 中已经封装好的能力接到本文件流程里。
import { BASH_TOOL_NAME } from '../BashTool/toolName.js'

// GREP_TOOL_NAME 命名 `'Grep'`，让后续代码直接表达这个值的用途。
export const GREP_TOOL_NAME = 'Grep'

// getDescription 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDescription(): string {
  // 返回 ``A powerful search tool built on ripgrep`，作为工具调用这次计算的结果。
  return `A powerful search tool built on ripgrep

  Usage:
  - ALWAYS use ${GREP_TOOL_NAME} for search tasks. NEVER invoke \`grep\` or \`rg\` as a ${BASH_TOOL_NAME} command. The ${GREP_TOOL_NAME} tool has been optimized for correct permissions and access.
  - Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")
  - Filter files with glob parameter (e.g., "*.js", "**/*.tsx") or type parameter (e.g., "js", "py", "rust")
  - Output modes: "content" shows matching lines, "files_with_matches" shows only file paths (default), "count" shows match counts
  - Use ${AGENT_TOOL_NAME} tool for open-ended searches requiring multiple rounds
  - Pattern syntax: Uses ripgrep (not grep) - literal braces need escaping (use \`interface\\{\\}\` to find \`interface{}\` in Go code)
  - Multiline matching: By default patterns match within single lines only. For cross-line patterns like \`struct \\{[\\s\\S]*?field\`, use \`multiline: true\`
`
}
