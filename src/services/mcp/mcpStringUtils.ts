/**
 * Pure string utility functions for MCP tool/server name parsing.
 * This file has no heavy dependencies to keep it lightweight for
 * consumers that only need string parsing (e.g., permissionValidation).
 */

// 引入 normalizeNameForMCP，将 ./normalization.js 中已经封装好的能力接到本文件流程里。
import { normalizeNameForMCP } from './normalization.js'

/*
 * Extracts MCP server information from a tool name string
 * @param toolString The string to parse. Expected format: "mcp__serverName__toolName"
 * @returns An object containing server name and optional tool name, or null if not a valid MCP rule
 *
 * Known limitation: If a server name contains "__", parsing will be incorrect.
 * For example, "mcp__my__server__tool" would parse as server="my" and tool="server__tool"
 * instead of server="my__server" and tool="tool". This is rare in practice since server
 * names typically don't contain double underscores.
 */
// mcpInfoFromString 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function mcpInfoFromString(toolString: string): {
  serverName: string
  toolName: string | undefined
} | null {
  // 片段列表格式化`toolString.split`，供MCP 服务后续处理使用。
  const parts = toolString.split('__')
  // 从 `parts` 按位置拆出 mcpPart、serverName、其余 toolNameParts，让MCP 服务 mcp String Utils分别处理这些返回值。
  const [mcpPart, serverName, ...toolNameParts] = parts
  // `mcpPart` 与 `'mcp' || !serverName` 不一致时刷新派生状态，避免使用过期结果。
  if (mcpPart !== 'mcp' || !serverName) {
    // 返回 `null`，作为MCP 服务这次计算的结果。
    return null
  }
  // Join all parts after server name to preserve double underscores in tool names
  // toolName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const toolName =
    toolNameParts.length > 0 ? toolNameParts.join('__') : undefined
  // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
  return { serverName, toolName }
}

/**
 * Generates the MCP tool/command name prefix for a given server
 * @param serverName Name of the MCP server
 * @returns The prefix string
 */
// getMcpPrefix 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpPrefix(serverName: string): string {
  // 返回 ``mcp__${normalizeNameForMCP(serverName)}__``，作为MCP 服务这次计算的结果。
  return `mcp__${normalizeNameForMCP(serverName)}__`
}

/**
 * Builds a fully qualified MCP tool name from server and tool names.
 * Inverse of mcpInfoFromString().
 * @param serverName Name of the MCP server (unnormalized)
 * @param toolName Name of the tool (unnormalized)
 * @returns The fully qualified name, e.g., "mcp__server__tool"
 */
// buildMcpToolName 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildMcpToolName(serverName: string, toolName: string): string {
  // 返回 ``${getMcpPrefix(serverName)}${normalizeNameForMCP(toolName)}``，作为MCP 服务这次计算的结果。
  return `${getMcpPrefix(serverName)}${normalizeNameForMCP(toolName)}`
}

/**
 * Returns the name to use for permission rule matching.
 * For MCP tools, uses the fully qualified mcp__server__tool name so that
 * deny rules targeting builtins (e.g., "Write") don't match unprefixed MCP
 * replacements that share the same display name. Falls back to `tool.name`.
 */
// getToolNameForPermissionCheck 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getToolNameForPermissionCheck(tool: {
  name: string
  mcpInfo?: { serverName: string; toolName: string }
}): string {
  // 返回 `tool.mcpInfo`，作为MCP 服务这次计算的结果。
  return tool.mcpInfo
    ? buildMcpToolName(tool.mcpInfo.serverName, tool.mcpInfo.toolName)
    : tool.name
}

/*
 * Extracts the display name from an MCP tool/command name
 * @param fullName The full MCP tool/command name (e.g., "mcp__server_name__tool_name")
 * @param serverName The server name to remove from the prefix
 * @returns The display name without the MCP prefix
 */
// getMcpDisplayName 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMcpDisplayName(
  fullName: string,
  serverName: string,
): string {
  // prefix保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
  const prefix = `mcp__${normalizeNameForMCP(serverName)}__`
  // 返回 `fullName.replace(prefix, '')`，作为MCP 服务这次计算的结果。
  return fullName.replace(prefix, '')
}

/**
 * Extracts just the tool/command display name from a userFacingName
 * @param userFacingName The full user-facing name (e.g., "github - Add comment to issue (MCP)")
 * @returns The display name without server prefix and (MCP) suffix
 */
// extractMcpToolDisplayName 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function extractMcpToolDisplayName(userFacingName: string): string {
  // This is really ugly but our current Tool type doesn't make it easy to have different display names for different purposes.

  // First, remove the (MCP) suffix if present
  // withoutSuffix格式化`userFacingName.replace`，供MCP 服务后续处理使用。
  let withoutSuffix = userFacingName.replace(/\s*\(MCP\)\s*$/, '')

  // Trim the result
  // withoutSuffix更新为 `withoutSuffix.trim()`，确保MCP 服务后续读取最新状态。
  withoutSuffix = withoutSuffix.trim()

  // Then, remove the server prefix (everything before " - ")
  // dashIndex 索引保存`withoutSuffix.indexOf`，供MCP 服务后续处理使用。
  const dashIndex = withoutSuffix.indexOf(' - ')
  // `dashIndex` 与 `-1` 不一致时刷新派生状态，避免使用过期结果。
  if (dashIndex !== -1) {
    // displayName格式化`withoutSuffix.substring`，供MCP 服务后续处理使用。
    const displayName = withoutSuffix.substring(dashIndex + 3).trim()
    // 返回 `displayName`，作为MCP 服务这次计算的结果。
    return displayName
  }

  // If no dash found, return the string without (MCP)
  // 返回 `withoutSuffix`，作为MCP 服务这次计算的结果。
  return withoutSuffix
}
