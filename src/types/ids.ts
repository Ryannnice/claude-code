/**
 * Branded types for session and agent IDs.
 * These prevent accidentally mixing up session IDs and agent IDs at compile time.
 */

/**
 * A session ID uniquely identifies a Claude Code session.
 * Returned by getSessionId().
 */
// SessionId 固化ids里传递的数据形状，帮助调用方按同一结构读写字段。
export type SessionId = string & { readonly __brand: 'SessionId' }

/**
 * An agent ID uniquely identifies a subagent within a session.
 * Returned by createAgentId().
 * When present, indicates the context is a subagent (not the main session).
 */
// AgentId 固化ids里传递的数据形状，帮助调用方按同一结构读写字段。
export type AgentId = string & { readonly __brand: 'AgentId' }

/**
 * Cast a raw string to SessionId.
 * Use sparingly - prefer getSessionId() when possible.
 */
// asSessionId 封装ids的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function asSessionId(id: string): SessionId {
  // 返回 `id as SessionId`，作为ids这次计算的结果。
  return id as SessionId
}

/**
 * Cast a raw string to AgentId.
 * Use sparingly - prefer createAgentId() when possible.
 */
// asAgentId 封装ids的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function asAgentId(id: string): AgentId {
  // 返回 `id as AgentId`，作为ids这次计算的结果。
  return id as AgentId
}

// AGENT_ID_PATTERN保存`a`，供ids后续处理使用。
const AGENT_ID_PATTERN = /^a(?:.+-)?[0-9a-f]{16}$/

/**
 * Validate and brand a string as AgentId.
 * Matches the format produced by createAgentId(): `a` + optional `<label>-` + 16 hex chars.
 * Returns null if the string doesn't match (e.g. teammate names, team-addressing).
 */
// toAgentId 封装ids的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function toAgentId(s: string): AgentId | null {
  // 返回 `AGENT_ID_PATTERN.test(s) ? (s as AgentId) : null`，作为ids这次计算的结果。
  return AGENT_ID_PATTERN.test(s) ? (s as AgentId) : null
}
