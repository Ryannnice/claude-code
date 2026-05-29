/**
 * Denial tracking infrastructure for permission classifiers.
 * Tracks consecutive denials and total denials to determine
 * when to fall back to prompting.
 */

// DenialTrackingState 固化权限判定里传递的数据形状，帮助调用方按同一结构读写字段。
export type DenialTrackingState = {
  consecutiveDenials: number
  totalDenials: number
}

// DENIAL_LIMITS 集合 集中保存权限判定权限工具 denial Tracking要一起传递的字段。
export const DENIAL_LIMITS = {
  maxConsecutive: 3,
  maxTotal: 20,
} as const

// createDenialTrackingState 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createDenialTrackingState(): DenialTrackingState {
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    consecutiveDenials: 0,
    totalDenials: 0,
  }
}

// recordDenial 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordDenial(state: DenialTrackingState): DenialTrackingState {
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    ...state,
    consecutiveDenials: state.consecutiveDenials + 1,
    totalDenials: state.totalDenials + 1,
  }
}

// recordSuccess 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function recordSuccess(state: DenialTrackingState): DenialTrackingState {
  // 满足 `state.consecutiveDenials === 0` 时，权限判定执行该分支。
  if (state.consecutiveDenials === 0) return state // No change needed
  // 返回结构化结果，集中表达权限判定已经整理出的状态。
  return {
    ...state,
    consecutiveDenials: 0,
  }
}

// shouldFallbackToPrompting 封装权限工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldFallbackToPrompting(state: DenialTrackingState): boolean {
  // 返回 `(`，作为权限判定这次计算的结果。
  return (
    state.consecutiveDenials >= DENIAL_LIMITS.maxConsecutive ||
    state.totalDenials >= DENIAL_LIMITS.maxTotal
  )
}
