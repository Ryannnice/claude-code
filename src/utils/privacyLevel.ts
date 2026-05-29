/**
 * Privacy level controls how much nonessential network traffic and telemetry
 * Claude Code generates.
 *
 * Levels are ordered by restrictiveness:
 *   default < no-telemetry < essential-traffic
 *
 * - default:            Everything enabled.
 * - no-telemetry:       Analytics/telemetry disabled (Datadog, 1P events, feedback survey).
 * - essential-traffic:  ALL nonessential network traffic disabled
 *                       (telemetry + auto-updates, grove, release notes, model capabilities, etc.).
 *
 * The resolved level is the most restrictive signal from:
 *   CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC  →  essential-traffic
 *   DISABLE_TELEMETRY                         →  no-telemetry
 */

// PrivacyLevel 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type PrivacyLevel = 'default' | 'no-telemetry' | 'essential-traffic'

// getPrivacyLevel 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPrivacyLevel(): PrivacyLevel {
  // 满足 `process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAF` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    // 返回 `'essential-traffic'`，作为共享工具这次计算的结果。
    return 'essential-traffic'
  }
  // 满足 `process.env.DISABLE_TELEMETRY` 时，共享工具执行该分支。
  if (process.env.DISABLE_TELEMETRY) {
    // 返回 `'no-telemetry'`，作为共享工具这次计算的结果。
    return 'no-telemetry'
  }
  // 返回 `'default'`，作为共享工具这次计算的结果。
  return 'default'
}

/**
 * True when all nonessential network traffic should be suppressed.
 * Equivalent to the old `process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` check.
 */
// isEssentialTrafficOnly 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEssentialTrafficOnly(): boolean {
  // 返回 `getPrivacyLevel() === 'essential-traffic'`，作为共享工具这次计算的结果。
  return getPrivacyLevel() === 'essential-traffic'
}

/**
 * True when telemetry/analytics should be suppressed.
 * True at both `no-telemetry` and `essential-traffic` levels.
 */
// isTelemetryDisabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTelemetryDisabled(): boolean {
  // 返回 `getPrivacyLevel() !== 'default'`，作为共享工具这次计算的结果。
  return getPrivacyLevel() !== 'default'
}

/**
 * Returns the env var name responsible for the current essential-traffic restriction,
 * or null if unrestricted. Used for user-facing "unset X to re-enable" messages.
 */
// getEssentialTrafficOnlyReason 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getEssentialTrafficOnlyReason(): string | null {
  // 满足 `process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAF` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    // 返回 `'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'`，作为共享工具这次计算的结果。
    return 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'
  }
  // 返回 `null`，作为共享工具这次计算的结果。
  return null
}
