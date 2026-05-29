/**
 * Shared analytics configuration
 *
 * Common logic for determining when analytics should be disabled
 * across all analytics systems (Datadog, 1P)
 */

// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 isTelemetryDisabled 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isTelemetryDisabled } from '../../utils/privacyLevel.js'

/**
 * Check if analytics operations should be disabled
 *
 * Analytics is disabled in the following cases:
 * - Test environment (NODE_ENV === 'test')
 * - Third-party cloud providers (Bedrock/Vertex)
 * - Privacy level is no-telemetry or essential-traffic
 */
// isAnalyticsDisabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAnalyticsDisabled(): boolean {
  // 返回 `(`，作为服务层 config这次计算的结果。
  return (
    process.env.NODE_ENV === 'test' ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY) ||
    isTelemetryDisabled()
  )
}

/**
 * Check if the feedback survey should be suppressed.
 *
 * Unlike isAnalyticsDisabled(), this does NOT block on 3P providers
 * (Bedrock/Vertex/Foundry). The survey is a local UI prompt with no
 * transcript data — enterprise customers capture responses via OTEL.
 */
// isFeedbackSurveyDisabled 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFeedbackSurveyDisabled(): boolean {
  // 返回 `process.env.NODE_ENV === 'test' || isTelemetryDisabled()`，作为服务层 config这次计算的结果。
  return process.env.NODE_ENV === 'test' || isTelemetryDisabled()
}
