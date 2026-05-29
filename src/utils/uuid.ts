// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomBytes, type UUID } from 'crypto'
// 类型依赖 { AgentId } 来自 src/types/ids.js，用于校准共享工具的数据契约。
import type { AgentId } from 'src/types/ids.js'

// uuidRegex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validate uuid
 * @param maybeUUID The value to be checked if it is a uuid
 * @returns string as UUID or null if it is not valid
 */
// validateUuid 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function validateUuid(maybeUuid: unknown): UUID | null {
  // UUID format: 8-4-4-4-12 hex digits
  // `typeof maybeUuid` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
  if (typeof maybeUuid !== 'string') return null

  // 返回 `uuidRegex.test(maybeUuid) ? (maybeUuid as UUID) : null`，作为共享工具这次计算的结果。
  return uuidRegex.test(maybeUuid) ? (maybeUuid as UUID) : null
}

/**
 * Generate a new agent ID with prefix for consistency with task IDs.
 * Format: a{label-}{16 hex chars}
 * Example: aa3f2c1b4d5e6f7a8, acompact-a3f2c1b4d5e6f7a8
 */
// createAgentId 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createAgentId(label?: string): AgentId {
  // suffix保存`randomBytes`，供共享工具后续处理使用。
  const suffix = randomBytes(8).toString('hex')
  // 返回 `(label ? `a${label}-${suffix}` : `a${suffix}`) as AgentId`，作为共享工具这次计算的结果。
  return (label ? `a${label}-${suffix}` : `a${suffix}`) as AgentId
}
