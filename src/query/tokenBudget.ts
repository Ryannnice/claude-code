// 复用 getBudgetContinuationMessage 工具函数，把通用处理留在 ../utils/tokenBudget.js 中维护。
import { getBudgetContinuationMessage } from '../utils/tokenBudget.js'

// COMPLETION_THRESHOLD保存`0.9`，供后续判断或组装使用。
const COMPLETION_THRESHOLD = 0.9
// DIMINISHING_THRESHOLD保存`500`，供token Budget后续判断或输出使用。
const DIMINISHING_THRESHOLD = 500

// BudgetTracker 固化token Budget里传递的数据形状，帮助调用方按同一结构读写字段。
export type BudgetTracker = {
  continuationCount: number
  lastDeltaTokens: number
  lastGlobalTurnTokens: number
  startedAt: number
}

// createBudgetTracker 封装tokenBudget的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function createBudgetTracker(): BudgetTracker {
  // 返回结构化结果，集中表达token Budget已经整理出的状态。
  return {
    continuationCount: 0,
    lastDeltaTokens: 0,
    lastGlobalTurnTokens: 0,
    startedAt: Date.now(),
  }
}

// ContinueDecision 固化token Budget里传递的数据形状，帮助调用方按同一结构读写字段。
type ContinueDecision = {
  action: 'continue'
  nudgeMessage: string
  continuationCount: number
  pct: number
  turnTokens: number
  budget: number
}

// StopDecision 固化token Budget里传递的数据形状，帮助调用方按同一结构读写字段。
type StopDecision = {
  action: 'stop'
  completionEvent: {
    continuationCount: number
    pct: number
    turnTokens: number
    budget: number
    diminishingReturns: boolean
    durationMs: number
  } | null
}

// TokenBudgetDecision 固化token Budget里传递的数据形状，帮助调用方按同一结构读写字段。
export type TokenBudgetDecision = ContinueDecision | StopDecision

// checkTokenBudget 封装tokenBudget的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkTokenBudget(
  tracker: BudgetTracker,
  agentId: string | undefined,
  budget: number | null,
  globalTurnTokens: number,
): TokenBudgetDecision {
  // 组合条件 `agentId || budget === null || budget <= 0` 成立时，token Budget才启用这条专门路径。
  if (agentId || budget === null || budget <= 0) {
    // 返回结构化结果，集中表达token Budget已经整理出的状态。
    return { action: 'stop', completionEvent: null }
  }

  // turnTokens 集合保存`globalTurnTokens`，供后续判断或组装使用。
  const turnTokens = globalTurnTokens
  // pct保存`Math.round`，供token Budget后续处理使用。
  const pct = Math.round((turnTokens / budget) * 100)
  // deltaSinceLastCheck保存`globalTurnTokens - tracker.lastGlobalTurnTokens`，供后续判断或组装使用。
  const deltaSinceLastCheck = globalTurnTokens - tracker.lastGlobalTurnTokens

  // isDiminishing 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isDiminishing =
    tracker.continuationCount >= 3 &&
    deltaSinceLastCheck < DIMINISHING_THRESHOLD &&
    tracker.lastDeltaTokens < DIMINISHING_THRESHOLD

  // 组合条件 `!isDiminishing && turnTokens < budget * COMPLETIO` 成立时，token Budget才启用这条专门路径。
  if (!isDiminishing && turnTokens < budget * COMPLETION_THRESHOLD) {
    // token Budget在这里处理 `tracker.continuationCount++`，完成这一小步状态转换。
    tracker.continuationCount++
    // lastDeltaTokens 集合更新为 `deltaSinceLastCheck`，确保tokenBudget后续读取最新状态。
    tracker.lastDeltaTokens = deltaSinceLastCheck
    // lastGlobalTurnTokens 集合更新为 `globalTurnTokens`，确保tokenBudget后续读取最新状态。
    tracker.lastGlobalTurnTokens = globalTurnTokens
    // 返回结构化结果，集中表达token Budget已经整理出的状态。
    return {
      action: 'continue',
      nudgeMessage: getBudgetContinuationMessage(pct, turnTokens, budget),
      continuationCount: tracker.continuationCount,
      pct,
      turnTokens,
      budget,
    }
  }

  // 组合条件 `isDiminishing || tracker.continuationCount > 0` 成立时，token Budget才启用这条专门路径。
  if (isDiminishing || tracker.continuationCount > 0) {
    // 返回结构化结果，集中表达token Budget已经整理出的状态。
    return {
      action: 'stop',
      completionEvent: {
        continuationCount: tracker.continuationCount,
        pct,
        turnTokens,
        budget,
        diminishingReturns: isDiminishing,
        durationMs: Date.now() - tracker.startedAt,
      },
    }
  }

  // 返回结构化结果，集中表达token Budget已经整理出的状态。
  return { action: 'stop', completionEvent: null }
}
