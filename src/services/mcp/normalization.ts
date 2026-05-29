/**
 * Pure utility functions for MCP name normalization.
 * This file has no dependencies to avoid circular imports.
 */

// Claude.ai server names are prefixed with this string
// CLAUDEAI_SERVER_PREFIX 命名 `'claude.ai '`，让后续代码直接表达这个值的用途。
const CLAUDEAI_SERVER_PREFIX = 'claude.ai '

/**
 * Normalize server names to be compatible with the API pattern ^[a-zA-Z0-9_-]{1,64}$
 * Replaces any invalid characters (including dots and spaces) with underscores.
 *
 * For claude.ai servers (names starting with "claude.ai "), also collapses
 * consecutive underscores and strips leading/trailing underscores to prevent
 * interference with the __ delimiter used in MCP tool names.
 */
// normalizeNameForMCP 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function normalizeNameForMCP(name: string): string {
  // normalized格式化`name.replace`，供MCP 服务后续处理使用。
  let normalized = name.replace(/[^a-zA-Z0-9_-]/g, '_')
  // 满足 `name.startsWith(CLAUDEAI_SERVER_PREFIX)` 时，MCP 服务执行该分支。
  if (name.startsWith(CLAUDEAI_SERVER_PREFIX)) {
    // normalized更新为 `normalized.replace(/_+/g, '_').replace(/^_|_$/g, '')`，确保MCP 服务后续读取最新状态。
    normalized = normalized.replace(/_+/g, '_').replace(/^_|_$/g, '')
  }
  // 返回 `normalized`，作为MCP 服务这次计算的结果。
  return normalized
}
