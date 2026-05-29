/**
 * Centralized rate limit message generation
 * Single source of truth for all rate limit-related messages
 */

// 整理这一组导入，让服务层 rate Limit Messages后续逻辑可以直接复用这些外部能力。
import {
  getOauthAccountInfo,
  getSubscriptionType,
  isOverageProvisioningAllowed,
} from '../utils/auth.js'
// 复用 hasClaudeAiBillingAccess 工具函数，把通用处理留在 ../utils/billing.js 中维护。
import { hasClaudeAiBillingAccess } from '../utils/billing.js'
// 复用 formatResetTime 工具函数，把通用处理留在 ../utils/format.js 中维护。
import { formatResetTime } from '../utils/format.js'
// 类型依赖 { ClaudeAILimits } 来自 ./claudeAiLimits.js，用于校准服务层 rate Limit Messages的数据契约。
import type { ClaudeAILimits } from './claudeAiLimits.js'

// FEEDBACK_CHANNEL_ANT保存`'#briarpatch-cc'`，作为后续固定文本处理的输入。
const FEEDBACK_CHANNEL_ANT = '#briarpatch-cc'

/**
 * All possible rate limit error message prefixes
 * Export this to avoid fragile string matching in UI components
 */
// RATE_LIMIT_ERROR_PREFIXES 错误信息 聚合成有序列表，保持后续遍历顺序稳定。
export const RATE_LIMIT_ERROR_PREFIXES = [
  "You've hit your",
  "You've used",
  "You're now using extra usage",
  "You're close to",
  "You're out of extra usage",
] as const

/**
 * Check if a message is a rate limit error
 */
// isRateLimitErrorMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isRateLimitErrorMessage(text: string): boolean {
  // 返回 `RATE_LIMIT_ERROR_PREFIXES.some(prefix => text.startsWith(prefix))`，作为服务层 rate Limit Messages这次计算的结果。
  return RATE_LIMIT_ERROR_PREFIXES.some(prefix => text.startsWith(prefix))
}

// RateLimitMessage 固化服务层 rate Limit Messages里传递的数据形状，帮助调用方按同一结构读写字段。
export type RateLimitMessage = {
  message: string
  severity: 'error' | 'warning'
}

/**
 * Get the appropriate rate limit message based on limit state
 * Returns null if no message should be shown
 */
// getRateLimitMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRateLimitMessage(
  limits: ClaudeAILimits,
  model: string,
): RateLimitMessage | null {
  // Check overage scenarios first (when subscription is rejected but overage is available)
  // getUsingOverageText is rendered separately from warning.
  // 满足 `limits.isUsingOverage` 时，服务层 rate Limit Messages执行该分支。
  if (limits.isUsingOverage) {
    // Show warning if approaching overage spending limit
    // 当 `limits.overageStatus` 匹配 `'allowed_warning'` 时，服务层 rate Limit Messages执行对应分支。
    if (limits.overageStatus === 'allowed_warning') {
      // 返回结构化结果，集中表达服务层 rate Limit Messages已经整理出的状态。
      return {
        message: "You're close to your extra usage spending limit",
        severity: 'warning',
      }
    }
    // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
    return null
  }

  // ERROR STATES - when limits are rejected
  // 当 `limits.status` 匹配 `'rejected'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.status === 'rejected') {
    // 返回结构化结果，集中表达服务层 rate Limit Messages已经整理出的状态。
    return { message: getLimitReachedText(limits, model), severity: 'error' }
  }

  // WARNING STATES - when approaching limits with early warning
  // 当 `limits.status` 匹配 `'allowed_warning'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.status === 'allowed_warning') {
    // Only show warnings when utilization is above threshold (70%)
    // This prevents false warnings after week reset when API may send
    // allowed_warning with stale data at low usage levels
    // WARNING_THRESHOLD 警告信息保存`0.7`，供服务层 rate Limit Messages后续判断或输出使用。
    const WARNING_THRESHOLD = 0.7
    // 服务层 rate Limit Messages在这里进入条件判断，后续代码按实际状态分流。
    if (
      limits.utilization !== undefined &&
      limits.utilization < WARNING_THRESHOLD
    ) {
      // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
      return null
    }

    // Don't warn non-billing Team/Enterprise users about approaching plan limits
    // if overages are enabled - they'll seamlessly roll into overage
    // subscriptionType读取`getSubscriptionType`，供服务层 rate Limit Messages后续处理使用。
    const subscriptionType = getSubscriptionType()
    // isTeamOrEnterprise 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isTeamOrEnterprise =
      subscriptionType === 'team' || subscriptionType === 'enterprise'
    // hasExtraUsageEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasExtraUsageEnabled =
      getOauthAccountInfo()?.hasExtraUsageEnabled === true

    // 服务层 rate Limit Messages在这里进入条件判断，后续代码按实际状态分流。
    if (
      isTeamOrEnterprise &&
      hasExtraUsageEnabled &&
      !hasClaudeAiBillingAccess()
    ) {
      // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
      return null
    }

    // 文本读取`getEarlyWarningText`，供服务层 rate Limit Messages后续处理使用。
    const text = getEarlyWarningText(limits)
    // 满足 `text` 时，服务层 rate Limit Messages执行该分支。
    if (text) {
      // 返回结构化结果，集中表达服务层 rate Limit Messages已经整理出的状态。
      return { message: text, severity: 'warning' }
    }
  }

  // No message needed
  // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
  return null
}

/**
 * Get error message for API errors (used in errors.ts)
 * Returns the message string or null if no error message should be shown
 */
// getRateLimitErrorMessage 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRateLimitErrorMessage(
  limits: ClaudeAILimits,
  model: string,
): string | null {
  // 消息读取`getRateLimitMessage`，供服务层 rate Limit Messages后续处理使用。
  const message = getRateLimitMessage(limits, model)

  // Only return error messages, not warnings
  // 当 `message && message.severity` 匹配 `'error'` 时，服务层 rate Limit Messages执行对应分支。
  if (message && message.severity === 'error') {
    // 返回 `message.message`，作为服务层 rate Limit Messages这次计算的结果。
    return message.message
  }

  // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
  return null
}

/**
 * Get warning message for UI footer
 * Returns the warning message string or null if no warning should be shown
 */
// getRateLimitWarning 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRateLimitWarning(
  limits: ClaudeAILimits,
  model: string,
): string | null {
  // 消息读取`getRateLimitMessage`，供服务层 rate Limit Messages后续处理使用。
  const message = getRateLimitMessage(limits, model)

  // Only return warnings for the footer - errors are shown in AssistantTextMessages
  // 当 `message && message.severity` 匹配 `'warning'` 时，服务层 rate Limit Messages执行对应分支。
  if (message && message.severity === 'warning') {
    // 返回 `message.message`，作为服务层 rate Limit Messages这次计算的结果。
    return message.message
  }

  // Don't show errors in the footer
  // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
  return null
}

// getLimitReachedText 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLimitReachedText(limits: ClaudeAILimits, model: string): string {
  // resetsAt 命名 `limits.resetsAt`，让后续代码直接表达这个值的用途。
  const resetsAt = limits.resetsAt
  // resetTime格式化`formatResetTime`，供服务层 rate Limit Messages后续处理使用。
  const resetTime = resetsAt ? formatResetTime(resetsAt, true) : undefined
  // overageResetTime 命名 `limits.overageResetsAt`，让后续代码直接表达这个值的用途。
  const overageResetTime = limits.overageResetsAt
    ? formatResetTime(limits.overageResetsAt, true)
    : undefined
  // resetMessage 消息数据保存`resetTime ? ` · resets ${resetTime}` : ''`，供后续判断或组装使用。
  const resetMessage = resetTime ? ` · resets ${resetTime}` : ''

  // if BOTH subscription (checked before this method) and overage are exhausted
  // 当 `limits.overageStatus` 匹配 `'rejected'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.overageStatus === 'rejected') {
    // Show the earliest reset time to indicate when user can resume
    // overageResetMessage 消息数据保存`''`，作为后续固定文本处理的输入。
    let overageResetMessage = ''
    // 组合条件 `resetsAt && limits.overageResetsAt` 成立时，服务层 rate Limit Messages才启用这条专门路径。
    if (resetsAt && limits.overageResetsAt) {
      // Both timestamps present - use the earlier one
      // 满足 `resetsAt < limits.overageResetsAt` 时，服务层 rate Limit Messages执行该分支。
      if (resetsAt < limits.overageResetsAt) {
        // overageResetMessage 消息数据更新为 `` · resets ${resetTime}``，确保服务层后续读取最新状态。
        overageResetMessage = ` · resets ${resetTime}`
      } else {
        // overageResetMessage 消息数据更新为 `` · resets ${overageResetTime}``，确保服务层后续读取最新状态。
        overageResetMessage = ` · resets ${overageResetTime}`
      }
    // 服务层 rate Limit Messages在这里处理 `} else if (resetTime) {`，完成这一小步状态转换。
    } else if (resetTime) {
      // overageResetMessage 消息数据更新为 `` · resets ${resetTime}``，确保服务层后续读取最新状态。
      overageResetMessage = ` · resets ${resetTime}`
    // 服务层 rate Limit Messages在这里处理 `} else if (overageResetTime) {`，完成这一小步状态转换。
    } else if (overageResetTime) {
      // overageResetMessage 消息数据更新为 `` · resets ${overageResetTime}``，确保服务层后续读取最新状态。
      overageResetMessage = ` · resets ${overageResetTime}`
    }

    // 当 `limits.overageDisabledReason` 匹配 `'out_of_credits'` 时，服务层 rate Limit Messages执行对应分支。
    if (limits.overageDisabledReason === 'out_of_credits') {
      // 返回 ``You're out of extra usage${overageResetMessage}``，作为服务层 rate Limit Messages这次计算的结果。
      return `You're out of extra usage${overageResetMessage}`
    }

    // 返回 `formatLimitReachedText('limit', overageResetMessage, model)`，作为服务层 rate Limit Messages这次计算的结果。
    return formatLimitReachedText('limit', overageResetMessage, model)
  }

  // 当 `limits.rateLimitType` 匹配 `'seven_day_sonnet'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.rateLimitType === 'seven_day_sonnet') {
    // subscriptionType读取`getSubscriptionType`，供服务层 rate Limit Messages后续处理使用。
    const subscriptionType = getSubscriptionType()
    // isProOrEnterprise 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isProOrEnterprise =
      subscriptionType === 'pro' || subscriptionType === 'enterprise'
    // For pro and enterprise, Sonnet limit is the same as weekly
    // limit保存`isProOrEnterprise ? 'weekly limit' : 'Sonnet limit'`，供服务层 rate Limit Messages后续判断或输出使用。
    const limit = isProOrEnterprise ? 'weekly limit' : 'Sonnet limit'
    // 返回 `formatLimitReachedText(limit, resetMessage, model)`，作为服务层 rate Limit Messages这次计算的结果。
    return formatLimitReachedText(limit, resetMessage, model)
  }

  // 当 `limits.rateLimitType` 匹配 `'seven_day_opus'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.rateLimitType === 'seven_day_opus') {
    // 返回 `formatLimitReachedText('Opus limit', resetMessage, model)`，作为服务层 rate Limit Messages这次计算的结果。
    return formatLimitReachedText('Opus limit', resetMessage, model)
  }

  // 当 `limits.rateLimitType` 匹配 `'seven_day'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.rateLimitType === 'seven_day') {
    // 返回 `formatLimitReachedText('weekly limit', resetMessage, model)`，作为服务层 rate Limit Messages这次计算的结果。
    return formatLimitReachedText('weekly limit', resetMessage, model)
  }

  // 当 `limits.rateLimitType` 匹配 `'five_hour'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.rateLimitType === 'five_hour') {
    // 返回 `formatLimitReachedText('session limit', resetMessage, model)`，作为服务层 rate Limit Messages这次计算的结果。
    return formatLimitReachedText('session limit', resetMessage, model)
  }

  // 返回 `formatLimitReachedText('usage limit', resetMessage, model)`，作为服务层 rate Limit Messages这次计算的结果。
  return formatLimitReachedText('usage limit', resetMessage, model)
}

// getEarlyWarningText 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getEarlyWarningText(limits: ClaudeAILimits): string | null {
  // limitName保存`null`，作为后续空值处理的输入。
  let limitName: string | null = null
  // 按照 limits.rateLimitType 的取值选择服务层 rate Limit Messages的具体处理分支。
  switch (limits.rateLimitType) {
    case 'seven_day':
      // limitName更新为 `'weekly limit'`，确保服务层后续读取最新状态。
      limitName = 'weekly limit'
      // 结束这个分支或循环，避免服务层 rate Limit Messages继续落入后续路径。
      break
    case 'five_hour':
      // limitName更新为 `'session limit'`，确保服务层后续读取最新状态。
      limitName = 'session limit'
      // 结束这个分支或循环，避免服务层 rate Limit Messages继续落入后续路径。
      break
    case 'seven_day_opus':
      // limitName更新为 `'Opus limit'`，确保服务层后续读取最新状态。
      limitName = 'Opus limit'
      // 结束这个分支或循环，避免服务层 rate Limit Messages继续落入后续路径。
      break
    case 'seven_day_sonnet':
      // limitName更新为 `'Sonnet limit'`，确保服务层后续读取最新状态。
      limitName = 'Sonnet limit'
      // 结束这个分支或循环，避免服务层 rate Limit Messages继续落入后续路径。
      break
    case 'overage':
      // limitName更新为 `'extra usage'`，确保服务层后续读取最新状态。
      limitName = 'extra usage'
      // 结束这个分支或循环，避免服务层 rate Limit Messages继续落入后续路径。
      break
    case undefined:
      // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
      return null
  }

  // utilization and resetsAt should be defined since early warning is calculated with them
  // used保存`limits.utilization`，供服务层 rate Limit Messages后续判断或输出使用。
  const used = limits.utilization
    ? Math.floor(limits.utilization * 100)
    : undefined
  // resetTime保存`limits.resetsAt`，供后续判断或组装使用。
  const resetTime = limits.resetsAt
    ? formatResetTime(limits.resetsAt, true)
    : undefined

  // Get upsell command based on subscription type and limit type
  // upsell读取`getWarningUpsellText`，供服务层 rate Limit Messages后续处理使用。
  const upsell = getWarningUpsellText(limits.rateLimitType)

  // 组合条件 `used && resetTime` 成立时，服务层 rate Limit Messages才启用这条专门路径。
  if (used && resetTime) {
    // base保存``You've used ${used}% of your ${limitName} · resets ${res...`，作为后续固定文本处理的输入。
    const base = `You've used ${used}% of your ${limitName} · resets ${resetTime}`
    // 返回 `upsell ? `${base} · ${upsell}` : base`，作为服务层 rate Limit Messages这次计算的结果。
    return upsell ? `${base} · ${upsell}` : base
  }

  // 满足 `used` 时，服务层 rate Limit Messages执行该分支。
  if (used) {
    // base保存``You've used ${used}% of your ${limitName}``，作为后续固定文本处理的输入。
    const base = `You've used ${used}% of your ${limitName}`
    // 返回 `upsell ? `${base} · ${upsell}` : base`，作为服务层 rate Limit Messages这次计算的结果。
    return upsell ? `${base} · ${upsell}` : base
  }

  // 当 `limits.rateLimitType` 匹配 `'overage'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.rateLimitType === 'overage') {
    // For the "Approaching <x>" verbiage, "extra usage limit" makes more sense than "extra usage"
    // 服务层 rate Limit Messages在这里处理 `limitName += ' limit'`，完成这一小步状态转换。
    limitName += ' limit'
  }

  // 满足 `resetTime` 时，服务层 rate Limit Messages执行该分支。
  if (resetTime) {
    // base保存``Approaching ${limitName} · resets ${resetTime}``，作为后续固定文本处理的输入。
    const base = `Approaching ${limitName} · resets ${resetTime}`
    // 返回 `upsell ? `${base} · ${upsell}` : base`，作为服务层 rate Limit Messages这次计算的结果。
    return upsell ? `${base} · ${upsell}` : base
  }

  // base保存``Approaching ${limitName}``，作为后续固定文本处理的输入。
  const base = `Approaching ${limitName}`
  // 返回 `upsell ? `${base} · ${upsell}` : base`，作为服务层 rate Limit Messages这次计算的结果。
  return upsell ? `${base} · ${upsell}` : base
}

/**
 * Get the upsell command text for warning messages based on subscription and limit type.
 * Returns null if no upsell should be shown.
 * Only used for warnings because actual rate limit hits will see an interactive menu of options.
 */
// getWarningUpsellText 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getWarningUpsellText(
  rateLimitType: ClaudeAILimits['rateLimitType'],
): string | null {
  // subscriptionType读取`getSubscriptionType`，供服务层 rate Limit Messages后续处理使用。
  const subscriptionType = getSubscriptionType()
  // hasExtraUsageEnabled 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasExtraUsageEnabled =
    getOauthAccountInfo()?.hasExtraUsageEnabled === true

  // 5-hour session limit warning
  // 当 `rateLimitType` 匹配 `'five_hour'` 时，服务层 rate Limit Messages执行对应分支。
  if (rateLimitType === 'five_hour') {
    // Teams/Enterprise with overages disabled: prompt to request extra usage
    // Only show if overage provisioning is allowed for this org type (e.g., not AWS marketplace)
    // 组合条件 `subscriptionType === 'team' || subscriptionType =` 成立时，服务层 rate Limit Messages才启用这条专门路径。
    if (subscriptionType === 'team' || subscriptionType === 'enterprise') {
      // 组合条件 `!hasExtraUsageEnabled && isOverageProvisioningAllowed()` 成立时，服务层 rate Limit Messages才启用这条专门路径。
      if (!hasExtraUsageEnabled && isOverageProvisioningAllowed()) {
        // 返回 `'/extra-usage to request more'`，作为服务层 rate Limit Messages这次计算的结果。
        return '/extra-usage to request more'
      }
      // Teams/Enterprise with overages enabled or unsupported billing type don't need upsell
      // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
      return null
    }

    // Pro/Max users: prompt to upgrade
    // 组合条件 `subscriptionType === 'pro' || subscriptionType ==` 成立时，服务层 rate Limit Messages才启用这条专门路径。
    if (subscriptionType === 'pro' || subscriptionType === 'max') {
      // 返回 `'/upgrade to keep using Claude Code'`，作为服务层 rate Limit Messages这次计算的结果。
      return '/upgrade to keep using Claude Code'
    }
  }

  // Overage warning (approaching spending limit)
  // 当 `rateLimitType` 匹配 `'overage'` 时，服务层 rate Limit Messages执行对应分支。
  if (rateLimitType === 'overage') {
    // 组合条件 `subscriptionType === 'team' || subscriptionType =` 成立时，服务层 rate Limit Messages才启用这条专门路径。
    if (subscriptionType === 'team' || subscriptionType === 'enterprise') {
      // 组合条件 `!hasExtraUsageEnabled && isOverageProvisioningAllowed()` 成立时，服务层 rate Limit Messages才启用这条专门路径。
      if (!hasExtraUsageEnabled && isOverageProvisioningAllowed()) {
        // 返回 `'/extra-usage to request more'`，作为服务层 rate Limit Messages这次计算的结果。
        return '/extra-usage to request more'
      }
    }
  }

  // Weekly limit warnings don't show upsell per spec
  // 返回 `null`，作为服务层 rate Limit Messages这次计算的结果。
  return null
}

/**
 * Get notification text for overage mode transitions
 * Used for transient notifications when entering overage mode
 */
// getUsingOverageText 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUsingOverageText(limits: ClaudeAILimits): string {
  // resetTime保存`limits.resetsAt`，供后续判断或组装使用。
  const resetTime = limits.resetsAt
    ? formatResetTime(limits.resetsAt, true)
    : ''

  // limitName固定为 `''`，作为服务层 rate Limit Messages后续展示或比较的基准。
  let limitName = ''
  // 当 `limits.rateLimitType` 匹配 `'five_hour'` 时，服务层 rate Limit Messages执行对应分支。
  if (limits.rateLimitType === 'five_hour') {
    // limitName更新为 `'session limit'`，确保服务层后续读取最新状态。
    limitName = 'session limit'
  // 服务层 rate Limit Messages在这里处理 `} else if (limits.rateLimitType === 'seven_day') {`，完成这一小步状态转换。
  } else if (limits.rateLimitType === 'seven_day') {
    // limitName更新为 `'weekly limit'`，确保服务层后续读取最新状态。
    limitName = 'weekly limit'
  // 服务层 rate Limit Messages在这里处理 `} else if (limits.rateLimitType === 'seven_day_opus') {`，完成这一小步状态转换。
  } else if (limits.rateLimitType === 'seven_day_opus') {
    // limitName更新为 `'Opus limit'`，确保服务层后续读取最新状态。
    limitName = 'Opus limit'
  // 服务层 rate Limit Messages在这里处理 `} else if (limits.rateLimitType === 'seven_day_sonnet') {`，完成这一小步状态转换。
  } else if (limits.rateLimitType === 'seven_day_sonnet') {
    // subscriptionType读取`getSubscriptionType`，供服务层 rate Limit Messages后续处理使用。
    const subscriptionType = getSubscriptionType()
    // isProOrEnterprise 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isProOrEnterprise =
      subscriptionType === 'pro' || subscriptionType === 'enterprise'
    // For pro and enterprise, Sonnet limit is the same as weekly
    // limitName更新为 `isProOrEnterprise ? 'weekly limit' : 'Sonnet limit'`，确保服务层后续读取最新状态。
    limitName = isProOrEnterprise ? 'weekly limit' : 'Sonnet limit'
  }

  // limitName缺失时提前走兜底路径，避免服务层 rate Limit Messages继续依赖无效输入。
  if (!limitName) {
    // 返回 `'Now using extra usage'`，作为服务层 rate Limit Messages这次计算的结果。
    return 'Now using extra usage'
  }

  // resetMessage 消息数据保存`resetTime`，供服务层 rate Limit Messages后续判断或输出使用。
  const resetMessage = resetTime
    ? ` · Your ${limitName} resets ${resetTime}`
    : ''
  // 返回 ``You're now using extra usage${resetMessage}``，作为服务层 rate Limit Messages这次计算的结果。
  return `You're now using extra usage${resetMessage}`
}

// formatLimitReachedText 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function formatLimitReachedText(
  limit: string,
  resetMessage: string,
  _model: string,
): string {
  // Enhanced messaging for Ant users
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，服务层 rate Limit Messages执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 返回 ``You've hit your ${limit}${resetMessage}. If you have feedback about th...`，作为服务层 rate Limit Messages这次计算的结果。
    return `You've hit your ${limit}${resetMessage}. If you have feedback about this limit, post in ${FEEDBACK_CHANNEL_ANT}. You can reset your limits with /reset-limits`
  }

  // 返回 ``You've hit your ${limit}${resetMessage}``，作为服务层 rate Limit Messages这次计算的结果。
  return `You've hit your ${limit}${resetMessage}`
}
