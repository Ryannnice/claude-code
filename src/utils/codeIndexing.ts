/**
 * Utility functions for detecting code indexing tool usage.
 *
 * Tracks usage of common code indexing solutions like Sourcegraph, Cody, etc.
 * both via CLI commands and MCP server integrations.
 */

/**
 * Known code indexing tool identifiers.
 * These are the normalized names used in analytics events.
 */
// CodeIndexingTool 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type CodeIndexingTool =
  // Code search engines
  | 'sourcegraph'
  | 'hound'
  | 'seagoat'
  | 'bloop'
  | 'gitloop'
  // AI coding assistants with indexing
  | 'cody'
  | 'aider'
  | 'continue'
  | 'github-copilot'
  | 'cursor'
  | 'tabby'
  | 'codeium'
  | 'tabnine'
  | 'augment'
  | 'windsurf'
  | 'aide'
  | 'pieces'
  | 'qodo'
  | 'amazon-q'
  | 'gemini'
  // MCP code indexing servers
  | 'claude-context'
  | 'code-index-mcp'
  | 'local-code-search'
  | 'autodev-codebase'
  // Context providers
  | 'openctx'

/**
 * Mapping of CLI command prefixes to code indexing tools.
 * The key is the command name (first word of the command).
 */
// CLI_COMMAND_MAPPING 命令数据 集中保存共享工具 code Indexing要一起传递的字段。
const CLI_COMMAND_MAPPING: Record<string, CodeIndexingTool> = {
  // Sourcegraph ecosystem
  src: 'sourcegraph',
  cody: 'cody',
  // AI coding assistants
  aider: 'aider',
  tabby: 'tabby',
  tabnine: 'tabnine',
  augment: 'augment',
  pieces: 'pieces',
  qodo: 'qodo',
  aide: 'aide',
  // Code search tools
  hound: 'hound',
  seagoat: 'seagoat',
  bloop: 'bloop',
  gitloop: 'gitloop',
  // Cloud provider AI assistants
  q: 'amazon-q',
  gemini: 'gemini',
}

/**
 * Mapping of MCP server name patterns to code indexing tools.
 * Patterns are matched case-insensitively against the server name.
 */
// MCP_SERVER_PATTERNS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const MCP_SERVER_PATTERNS: Array<{
  pattern: RegExp
  tool: CodeIndexingTool
}> = [
  // Sourcegraph ecosystem
  { pattern: /^sourcegraph$/i, tool: 'sourcegraph' },
  { pattern: /^cody$/i, tool: 'cody' },
  { pattern: /^openctx$/i, tool: 'openctx' },
  // AI coding assistants
  { pattern: /^aider$/i, tool: 'aider' },
  { pattern: /^continue$/i, tool: 'continue' },
  { pattern: /^github[-_]?copilot$/i, tool: 'github-copilot' },
  { pattern: /^copilot$/i, tool: 'github-copilot' },
  { pattern: /^cursor$/i, tool: 'cursor' },
  { pattern: /^tabby$/i, tool: 'tabby' },
  { pattern: /^codeium$/i, tool: 'codeium' },
  { pattern: /^tabnine$/i, tool: 'tabnine' },
  { pattern: /^augment[-_]?code$/i, tool: 'augment' },
  { pattern: /^augment$/i, tool: 'augment' },
  { pattern: /^windsurf$/i, tool: 'windsurf' },
  { pattern: /^aide$/i, tool: 'aide' },
  { pattern: /^codestory$/i, tool: 'aide' },
  { pattern: /^pieces$/i, tool: 'pieces' },
  { pattern: /^qodo$/i, tool: 'qodo' },
  { pattern: /^amazon[-_]?q$/i, tool: 'amazon-q' },
  { pattern: /^gemini[-_]?code[-_]?assist$/i, tool: 'gemini' },
  { pattern: /^gemini$/i, tool: 'gemini' },
  // Code search tools
  { pattern: /^hound$/i, tool: 'hound' },
  { pattern: /^seagoat$/i, tool: 'seagoat' },
  { pattern: /^bloop$/i, tool: 'bloop' },
  { pattern: /^gitloop$/i, tool: 'gitloop' },
  // MCP code indexing servers
  { pattern: /^claude[-_]?context$/i, tool: 'claude-context' },
  { pattern: /^code[-_]?index[-_]?mcp$/i, tool: 'code-index-mcp' },
  { pattern: /^code[-_]?index$/i, tool: 'code-index-mcp' },
  { pattern: /^local[-_]?code[-_]?search$/i, tool: 'local-code-search' },
  { pattern: /^codebase$/i, tool: 'autodev-codebase' },
  { pattern: /^autodev[-_]?codebase$/i, tool: 'autodev-codebase' },
  { pattern: /^code[-_]?context$/i, tool: 'claude-context' },
]

/**
 * Detects if a bash command is using a code indexing CLI tool.
 *
 * @param command - The full bash command string
 * @returns The code indexing tool identifier, or undefined if not a code indexing command
 *
 * @example
 * detectCodeIndexingFromCommand('src search "pattern"') // returns 'sourcegraph'
 * detectCodeIndexingFromCommand('cody chat --message "help"') // returns 'cody'
 * detectCodeIndexingFromCommand('ls -la') // returns undefined
 */
// detectCodeIndexingFromCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectCodeIndexingFromCommand(
  command: string,
): CodeIndexingTool | undefined {
  // Extract the first word (command name)
  // trimmed格式化`command.trim`，供共享工具后续处理使用。
  const trimmed = command.trim()
  // firstWord格式化`trimmed.split`，供共享工具后续处理使用。
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase()

  // firstWord缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!firstWord) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // Check for npx/bunx prefixed commands
  // 当 `firstWord` 匹配 `'npx' || firstWord === 'bun...` 时，共享工具执行对应分支。
  if (firstWord === 'npx' || firstWord === 'bunx') {
    // secondWord格式化`trimmed.split`，供共享工具后续处理使用。
    const secondWord = trimmed.split(/\s+/)[1]?.toLowerCase()
    // 只有 `secondWord && secondWord in CLI_COMMAND_MAPPING` 满足时，共享工具才执行该分支。
    if (secondWord && secondWord in CLI_COMMAND_MAPPING) {
      // 返回 `CLI_COMMAND_MAPPING[secondWord]`，作为共享工具这次计算的结果。
      return CLI_COMMAND_MAPPING[secondWord]
    }
  }

  // 返回 `CLI_COMMAND_MAPPING[firstWord]`，作为共享工具这次计算的结果。
  return CLI_COMMAND_MAPPING[firstWord]
}

/**
 * Detects if an MCP tool is from a code indexing server.
 *
 * @param toolName - The MCP tool name (format: mcp__serverName__toolName)
 * @returns The code indexing tool identifier, or undefined if not a code indexing tool
 *
 * @example
 * detectCodeIndexingFromMcpTool('mcp__sourcegraph__search') // returns 'sourcegraph'
 * detectCodeIndexingFromMcpTool('mcp__cody__chat') // returns 'cody'
 * detectCodeIndexingFromMcpTool('mcp__filesystem__read') // returns undefined
 */
// detectCodeIndexingFromMcpTool 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectCodeIndexingFromMcpTool(
  toolName: string,
): CodeIndexingTool | undefined {
  // MCP tool names follow the format: mcp__serverName__toolName
  // 满足 `!toolName.startsWith('mcp__')` 时，共享工具执行该分支。
  if (!toolName.startsWith('mcp__')) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 片段列表格式化`toolName.split`，供共享工具后续处理使用。
  const parts = toolName.split('__')
  // 满足 `parts.length < 3` 时，共享工具执行该分支。
  if (parts.length < 3) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // serverName读取 `parts[1]` 对应条目，后续围绕该成员继续处理。
  const serverName = parts[1]
  // serverName缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!serverName) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }

  // 循环处理 `const { pattern, tool } of MCP_SERVER_PATTERNS`，让共享工具逐项把同类条目按顺序走完。
  for (const { pattern, tool } of MCP_SERVER_PATTERNS) {
    // 满足 `pattern.test(serverName)` 时，共享工具执行该分支。
    if (pattern.test(serverName)) {
      // 返回 `tool`，作为共享工具这次计算的结果。
      return tool
    }
  }

  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}

/**
 * Detects if an MCP server name corresponds to a code indexing tool.
 *
 * @param serverName - The MCP server name
 * @returns The code indexing tool identifier, or undefined if not a code indexing server
 *
 * @example
 * detectCodeIndexingFromMcpServerName('sourcegraph') // returns 'sourcegraph'
 * detectCodeIndexingFromMcpServerName('filesystem') // returns undefined
 */
// detectCodeIndexingFromMcpServerName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function detectCodeIndexingFromMcpServerName(
  serverName: string,
): CodeIndexingTool | undefined {
  // 循环处理 `const { pattern, tool } of MCP_SERVER_PATTERNS`，让共享工具逐项把同类条目按顺序走完。
  for (const { pattern, tool } of MCP_SERVER_PATTERNS) {
    // 满足 `pattern.test(serverName)` 时，共享工具执行该分支。
    if (pattern.test(serverName)) {
      // 返回 `tool`，作为共享工具这次计算的结果。
      return tool
    }
  }

  // 返回 `undefined`，作为共享工具这次计算的结果。
  return undefined
}
