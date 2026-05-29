// 类型依赖 { OverageDisabledReason } 来自 src/services/claudeAiLimits.js，用于校准共享工具的数据契约。
import type { OverageDisabledReason } from 'src/services/claudeAiLimits.js'
// 引入 isClaudeAISubscriber，将 ../auth.js 中已经封装好的能力接到本文件流程里。
import { isClaudeAISubscriber } from '../auth.js'
// 引入 getGlobalConfig，将 ../config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from '../config.js'
// 引入 is1mContextDisabled，将 ../context.js 中已经封装好的能力接到本文件流程里。
import { is1mContextDisabled } from '../context.js'

/**
 * Check if extra usage is enabled based on the cached disabled reason.
 * Extra usage is considered enabled if there's no disabled reason,
 * or if the disabled reason indicates it's provisioned but temporarily unavailable.
 */
// isExtraUsageEnabled 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isExtraUsageEnabled(): boolean {
  // reason读取`getGlobalConfig`，供共享工具后续处理使用。
  const reason = getGlobalConfig().cachedExtraUsageDisabledReason
  // undefined = no cache yet, treat as not enabled (conservative)
  // 满足 `reason === undefined` 时，共享工具执行该分支。
  if (reason === undefined) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // null = no disabled reason from API, extra usage is enabled
  // 满足 `reason === null` 时，共享工具执行该分支。
  if (reason === null) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // Check which disabled reasons still mean "provisioned"
  // 按照 reason as OverageDisabledReason 的取值选择共享工具的具体处理分支。
  switch (reason as OverageDisabledReason) {
    // Provisioned but credits depleted — still counts as enabled
    case 'out_of_credits':
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    // Not provisioned or actively disabled
    case 'overage_not_provisioned':
    case 'org_level_disabled':
    case 'org_level_disabled_until':
    case 'seat_tier_level_disabled':
    case 'member_level_disabled':
    case 'seat_tier_zero_credit_limit':
    case 'group_zero_credit_limit':
    case 'member_zero_credit_limit':
    case 'org_service_level_disabled':
    case 'org_service_zero_credit_limit':
    case 'no_limits_configured':
    case 'unknown':
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    default:
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
  }
}

// @[MODEL LAUNCH]: Add check if the new model supports 1M context
// checkOpus1mAccess 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkOpus1mAccess(): boolean {
  // 满足 `is1mContextDisabled()` 时，共享工具执行该分支。
  if (is1mContextDisabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // Subscribers have access if extra usage is enabled for their account
    // 返回 `isExtraUsageEnabled()`，作为共享工具这次计算的结果。
    return isExtraUsageEnabled()
  }

  // Non-subscribers (API/PAYG) have access
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// checkSonnet1mAccess 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkSonnet1mAccess(): boolean {
  // 满足 `is1mContextDisabled()` 时，共享工具执行该分支。
  if (is1mContextDisabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // Subscribers have access if extra usage is enabled for their account
    // 返回 `isExtraUsageEnabled()`，作为共享工具这次计算的结果。
    return isExtraUsageEnabled()
  }

  // Non-subscribers (API/PAYG) have access
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}
