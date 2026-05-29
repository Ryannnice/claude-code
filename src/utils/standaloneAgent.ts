/**
 * Standalone agent utilities for sessions with custom names/colors
 *
 * These helpers provide access to standalone agent context (name and color)
 * for sessions that are NOT part of a swarm team. When a session is part
 * of a swarm, these functions return undefined to let swarm context take
 * precedence.
 */

// 类型依赖 { AppState } 来自 ../state/AppState.js，用于校准共享工具的数据契约。
import type { AppState } from '../state/AppState.js'
// 引入 getTeamName，将 ./teammate.js 中已经封装好的能力接到本文件流程里。
import { getTeamName } from './teammate.js'

/**
 * Returns the standalone agent name if set and not a swarm teammate.
 * Uses getTeamName() for consistency with isTeammate() swarm detection.
 */
// getStandaloneAgentName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getStandaloneAgentName(appState: AppState): string | undefined {
  // If in a team (swarm), don't return standalone name
  // 满足 `getTeamName()` 时，共享工具执行该分支。
  if (getTeamName()) {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 返回 `appState.standaloneAgentContext?.name`，作为共享工具这次计算的结果。
  return appState.standaloneAgentContext?.name
}
