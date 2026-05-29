/**
 * Centralized utilities for parsing slash commands
 */

// ParsedSlashCommand 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ParsedSlashCommand = {
  commandName: string
  args: string
  isMcp: boolean
}

/**
 * Parses a slash command input string into its component parts
 *
 * @param input - The raw input string (should start with '/')
 * @returns Parsed command name, args, and MCP flag, or null if invalid
 *
 * @example
 * parseSlashCommand('/search foo bar')
 * // => { commandName: 'search', args: 'foo bar', isMcp: false }
 *
 * @example
 * parseSlashCommand('/mcp:tool (MCP) arg1 arg2')
 * // => { commandName: 'mcp:tool (MCP)', args: 'arg1 arg2', isMcp: true }
 */
// parseSlashCommand 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  // trimmedInput格式化`input.trim`，供共享工具后续处理使用。
  const trimmedInput = input.trim()

  // Check if input starts with '/'
  // 满足 `!trimmedInput.startsWith('/')` 时，共享工具执行该分支。
  if (!trimmedInput.startsWith('/')) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // Remove the leading '/' and split by spaces
  // withoutSlash格式化`trimmedInput.slice`，供共享工具后续处理使用。
  const withoutSlash = trimmedInput.slice(1)
  // words 集合格式化`withoutSlash.split`，供共享工具后续处理使用。
  const words = withoutSlash.split(' ')

  // 满足 `!words[0]` 时，共享工具执行该分支。
  if (!words[0]) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // commandName 命令数据 命名 `words[0]`，让后续代码直接表达这个值的用途。
  let commandName = words[0]
  // isMcp标记共享工具 slash Command Parsing是否启用对应路径。
  let isMcp = false
  // argsStartIndex 索引保存`1`，供后续判断或组装使用。
  let argsStartIndex = 1

  // Check for MCP commands (second word is '(MCP)')
  // 当 `words.length > 1 && words[1]` 匹配 `'(MCP)'` 时，共享工具执行对应分支。
  if (words.length > 1 && words[1] === '(MCP)') {
    // commandName 命令数据更新为 `commandName + ' (MCP)'`，确保共享工具后续读取最新状态。
    commandName = commandName + ' (MCP)'
    // isMcp更新为 `true`，确保共享工具后续读取最新状态。
    isMcp = true
    // argsStartIndex 索引更新为 `2`，确保共享工具后续读取最新状态。
    argsStartIndex = 2
  }

  // Extract arguments (everything after command name)
  // 参数列表格式化`words.slice`，供共享工具后续处理使用。
  const args = words.slice(argsStartIndex).join(' ')

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    commandName,
    args,
    isMcp,
  }
}
