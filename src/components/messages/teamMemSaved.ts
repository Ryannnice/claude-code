// 类型依赖 { SystemMemorySavedMessage } 来自 ../../types/message.js，用于校准终端渲染的数据契约。
import type { SystemMemorySavedMessage } from '../../types/message.js'

/**
 * Returns the team-memory segment for the memory-saved UI, plus the count so
 * the caller can derive the private count without accessing teamCount itself.
 * Plain function (not a React component) so the React Compiler won't hoist
 * the teamCount property access for memoization. This module is only loaded
 * when feature('TEAMMEM') is true.
 */
// teamMemSavedPart 封装终端 UI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function teamMemSavedPart(
  message: SystemMemorySavedMessage,
): { segment: string; count: number } | null {
  // count 数量保存`message.teamCount ?? 0`，供终端 UI team Mem Saved后续判断或输出使用。
  const count = message.teamCount ?? 0
  // 满足 `count === 0` 时，终端渲染执行该分支。
  if (count === 0) return null
  // 返回结构化结果，集中表达终端渲染已经整理出的状态。
  return {
    segment: `${count} team ${count === 1 ? 'memory' : 'memories'}`,
    count,
  }
}
