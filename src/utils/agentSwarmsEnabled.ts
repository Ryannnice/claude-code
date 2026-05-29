// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

/**
 * Check if --agent-teams flag is provided via CLI.
 * Checks process.argv directly to avoid import cycles with bootstrap/state.
 * Note: The flag is only shown in help for ant users, but if external users
 * pass it anyway, it will work (subject to the killswitch).
 */
// isAgentTeamsFlagSet 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isAgentTeamsFlagSet(): boolean {
  // 返回 `process.argv.includes('--agent-teams')`，作为共享工具这次计算的结果。
  return process.argv.includes('--agent-teams')
}

/**
 * Centralized runtime check for agent teams/teammate features.
 * This is the single gate that should be checked everywhere teammates
 * are referenced (prompts, code, tools isEnabled, UI, etc.).
 *
 * Ant builds: always enabled.
 * External builds require both:
 * 1. Opt-in via CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS env var OR --agent-teams flag
 * 2. GrowthBook gate 'tengu_amber_flint' enabled (killswitch)
 */
// isAgentSwarmsEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAgentSwarmsEnabled(): boolean {
  // Ant: always on
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // External: require opt-in via env var or --agent-teams flag
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !isEnvTruthy(process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) &&
    !isAgentTeamsFlagSet()
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Killswitch — always respected for external users
  // 满足 `!getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_flint', true)` 时，共享工具执行该分支。
  if (!getFeatureValue_CACHED_MAY_BE_STALE('tengu_amber_flint', true)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
