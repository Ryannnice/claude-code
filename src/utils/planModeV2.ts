// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 ../services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
// 引入 getRateLimitTier、getSubscriptionType，将 ./auth.js 中已经封装好的能力接到本文件流程里。
import { getRateLimitTier, getSubscriptionType } from './auth.js'
// 引入 isEnvDefinedFalsy、isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'

// getPlanModeV2AgentCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlanModeV2AgentCount(): number {
  // Environment variable override takes precedence
  // 满足 `process.env.CLAUDE_CODE_PLAN_V2_AGENT_COUNT` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_PLAN_V2_AGENT_COUNT) {
    // 计数解析`parseInt`，供共享工具后续处理使用。
    const count = parseInt(process.env.CLAUDE_CODE_PLAN_V2_AGENT_COUNT, 10)
    // 只有 `!isNaN(count) && count > 0 && count <= 10` 满足时，共享工具才执行该分支。
    if (!isNaN(count) && count > 0 && count <= 10) {
      // 返回 `count`，作为共享工具这次计算的结果。
      return count
    }
  }

  // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
  const subscriptionType = getSubscriptionType()
  // rateLimitTier读取`getRateLimitTier`，供共享工具后续处理使用。
  const rateLimitTier = getRateLimitTier()

  // 共享工具在这里按实际状态进入对应分支。
  if (
    subscriptionType === 'max' &&
    rateLimitTier === 'default_claude_max_20x'
  ) {
    // 返回 `3`，作为共享工具这次计算的结果。
    return 3
  }

  // 只有 `subscriptionType === 'enterprise' || subscription` 满足时，共享工具才执行该分支。
  if (subscriptionType === 'enterprise' || subscriptionType === 'team') {
    // 返回 `3`，作为共享工具这次计算的结果。
    return 3
  }

  // 返回 `1`，作为共享工具这次计算的结果。
  return 1
}

// getPlanModeV2ExploreAgentCount 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPlanModeV2ExploreAgentCount(): number {
  // 满足 `process.env.CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COU` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT) {
    // 计数解析`parseInt`，供共享工具后续处理使用。
    const count = parseInt(
      process.env.CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT,
      10,
    )
    // 只有 `!isNaN(count) && count > 0 && count <= 10` 满足时，共享工具才执行该分支。
    if (!isNaN(count) && count > 0 && count <= 10) {
      // 返回 `count`，作为共享工具这次计算的结果。
      return count
    }
  }

  // 返回 `3`，作为共享工具这次计算的结果。
  return 3
}

/**
 * Check if plan mode interview phase is enabled.
 *
 * Config: ant=always_on, external=tengu_plan_mode_interview_phase gate, envVar=true
 */
// isPlanModeInterviewPhaseEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPlanModeInterviewPhaseEnabled(): boolean {
  // Always on for ants
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
  if (process.env.USER_TYPE === 'ant') return true

  // env 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const env = process.env.CLAUDE_CODE_PLAN_MODE_INTERVIEW_PHASE
  // 满足 `isEnvTruthy(env)` 时，共享工具执行该分支。
  if (isEnvTruthy(env)) return true
  // 满足 `isEnvDefinedFalsy(env)` 时，共享工具执行该分支。
  if (isEnvDefinedFalsy(env)) return false

  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE(`，作为共享工具这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE(
    'tengu_plan_mode_interview_phase',
    false,
  )
}

// PewterLedgerVariant 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type PewterLedgerVariant = 'trim' | 'cut' | 'cap' | null

/**
 * tengu_pewter_ledger — plan file structure prompt experiment.
 *
 * Controls the Phase 4 "Final Plan" bullets in the 5-phase plan mode
 * workflow (messages.ts getPlanPhase4Section). 5-phase is 99% of plan
 * traffic; interview-phase (ants) is untouched as a reference population.
 *
 * Arms: null (control), 'trim', 'cut', 'cap' — progressively stricter
 * guidance on plan file size.
 *
 * Baseline (control, 14d ending 2026-03-02, N=26.3M):
 *   p50 4,906 chars | p90 11,617 | mean 6,207 | 82% Opus 4.6
 *   Reject rate monotonic with size: 20% at <2K → 50% at 20K+
 *
 * Primary: session-level Avg Cost (fact__201omjcij85f) — Opus output is
 *   5× input price so cost is an output-weighted proxy. planLengthChars
 *   on tengu_plan_exit is the mechanism but NOT the goal — the cap arm
 *   could shrink the plan file while increasing total output via
 *   write→count→edit cycles.
 * Guardrail: feedback-bad rate, requests/session (too-thin plans →
 *   more implementation iterations), tool error rate
 */
// getPewterLedgerVariant 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPewterLedgerVariant(): PewterLedgerVariant {
  // 原始文本 命名 `getFeatureValue_CACHED_MAY_BE_STALE<string | null>(`，让后续代码直接表达这个值的用途。
  const raw = getFeatureValue_CACHED_MAY_BE_STALE<string | null>(
    'tengu_pewter_ledger',
    null,
  )
  // 当 `raw` 匹配 `'trim' || raw === 'cut' || ...` 时，共享工具执行对应分支。
  if (raw === 'trim' || raw === 'cut' || raw === 'cap') return raw
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}
