/**
 * Deterministic Agent ID System
 *
 * This module provides helper functions for formatting and parsing deterministic
 * agent IDs used in the swarm/teammate system.
 *
 * ## ID Formats
 *
 * **Agent IDs**: `agentName@teamName`
 * - Example: `team-lead@my-project`, `researcher@my-project`
 * - The @ symbol acts as a separator between agent name and team name
 *
 * **Request IDs**: `{requestType}-{timestamp}@{agentId}`
 * - Example: `shutdown-1702500000000@researcher@my-project`
 * - Used for shutdown requests, plan approvals, etc.
 *
 * ## Why Deterministic IDs?
 *
 * Deterministic IDs provide several benefits:
 *
 * 1. **Reproducibility**: The same agent spawned with the same name in the same team
 *    always gets the same ID, enabling reconnection after crashes/restarts.
 *
 * 2. **Human-readable**: IDs are meaningful and debuggable (e.g., `tester@my-project`).
 *
 * 3. **Predictable**: Team leads can compute a teammate's ID without looking it up,
 *    simplifying message routing and task assignment.
 *
 * ## Constraints
 *
 * - Agent names must NOT contain `@` (it's used as the separator)
 * - Use `sanitizeAgentName()` from TeammateTool.ts to strip @ from names
 */

/**
 * Formats an agent ID in the format `agentName@teamName`.
 */
// formatAgentId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function formatAgentId(agentName: string, teamName: string): string {
  // 返回 ``${agentName}@${teamName}``，作为共享工具这次计算的结果。
  return `${agentName}@${teamName}`
}

/**
 * Parses an agent ID into its components.
 * Returns null if the ID doesn't contain the @ separator.
 */
// parseAgentId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseAgentId(
  agentId: string,
): { agentName: string; teamName: string } | null {
  // atIndex 索引保存`agentId.indexOf`，供共享工具后续处理使用。
  const atIndex = agentId.indexOf('@')
  // 满足 `atIndex === -1` 时，共享工具执行该分支。
  if (atIndex === -1) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    agentName: agentId.slice(0, atIndex),
    teamName: agentId.slice(atIndex + 1),
  }
}

/**
 * Formats a request ID in the format `{requestType}-{timestamp}@{agentId}`.
 */
// generateRequestId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function generateRequestId(
  requestType: string,
  agentId: string,
): string {
  // timestamp记录时间`Date.now`，供共享工具后续处理使用。
  const timestamp = Date.now()
  // 返回 ``${requestType}-${timestamp}@${agentId}``，作为共享工具这次计算的结果。
  return `${requestType}-${timestamp}@${agentId}`
}

/**
 * Parses a request ID into its components.
 * Returns null if the request ID doesn't match the expected format.
 */
// parseRequestId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseRequestId(
  requestId: string,
): { requestType: string; timestamp: number; agentId: string } | null {
  // atIndex 索引保存`requestId.indexOf`，供共享工具后续处理使用。
  const atIndex = requestId.indexOf('@')
  // 满足 `atIndex === -1` 时，共享工具执行该分支。
  if (atIndex === -1) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // prefix格式化`requestId.slice`，供共享工具后续处理使用。
  const prefix = requestId.slice(0, atIndex)
  // agentId格式化`requestId.slice`，供共享工具后续处理使用。
  const agentId = requestId.slice(atIndex + 1)

  // lastDashIndex 索引保存`prefix.lastIndexOf`，供共享工具后续处理使用。
  const lastDashIndex = prefix.lastIndexOf('-')
  // 满足 `lastDashIndex === -1` 时，共享工具执行该分支。
  if (lastDashIndex === -1) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // requestType 请求数据格式化`prefix.slice`，供共享工具后续处理使用。
  const requestType = prefix.slice(0, lastDashIndex)
  // timestampStr格式化`prefix.slice`，供共享工具后续处理使用。
  const timestampStr = prefix.slice(lastDashIndex + 1)
  // timestamp解析`parseInt`，供共享工具后续处理使用。
  const timestamp = parseInt(timestampStr, 10)

  // 满足 `isNaN(timestamp)` 时，共享工具执行该分支。
  if (isNaN(timestamp)) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { requestType, timestamp, agentId }
}
