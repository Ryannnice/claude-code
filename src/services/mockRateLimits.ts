// Mock rate limits for testing [ANT-ONLY]
// This allows testing various rate limit scenarios without hitting actual limits
//
// ⚠️  WARNING: This is for internal testing/demo purposes only!
// The mock headers may not exactly match the API specification or real-world behavior.
// Always validate against actual API responses before relying on this for production features.

// 类型依赖 { SubscriptionType } 来自 ../services/oauth/types.js，用于校准服务层 mock Rate Limits的数据契约。
import type { SubscriptionType } from '../services/oauth/types.js'
// 复用 setMockBillingAccessOverride 工具函数，把通用处理留在 ../utils/billing.js 中维护。
import { setMockBillingAccessOverride } from '../utils/billing.js'
// 类型依赖 { OverageDisabledReason } 来自 ./claudeAiLimits.js，用于校准服务层 mock Rate Limits的数据契约。
import type { OverageDisabledReason } from './claudeAiLimits.js'

// MockHeaders 固化服务层 mock Rate Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type MockHeaders = {
  'anthropic-ratelimit-unified-status'?:
    | 'allowed'
    | 'allowed_warning'
    | 'rejected'
  'anthropic-ratelimit-unified-reset'?: string
  'anthropic-ratelimit-unified-representative-claim'?:
    | 'five_hour'
    | 'seven_day'
    | 'seven_day_opus'
    | 'seven_day_sonnet'
  'anthropic-ratelimit-unified-overage-status'?:
    | 'allowed'
    | 'allowed_warning'
    | 'rejected'
  'anthropic-ratelimit-unified-overage-reset'?: string
  'anthropic-ratelimit-unified-overage-disabled-reason'?: OverageDisabledReason
  'anthropic-ratelimit-unified-fallback'?: 'available'
  'anthropic-ratelimit-unified-fallback-percentage'?: string
  'retry-after'?: string
  // Early warning utilization headers
  'anthropic-ratelimit-unified-5h-utilization'?: string
  'anthropic-ratelimit-unified-5h-reset'?: string
  'anthropic-ratelimit-unified-5h-surpassed-threshold'?: string
  'anthropic-ratelimit-unified-7d-utilization'?: string
  'anthropic-ratelimit-unified-7d-reset'?: string
  'anthropic-ratelimit-unified-7d-surpassed-threshold'?: string
  'anthropic-ratelimit-unified-overage-utilization'?: string
  'anthropic-ratelimit-unified-overage-surpassed-threshold'?: string
}

// MockHeaderKey 固化服务层 mock Rate Limits里传递的数据形状，帮助调用方按同一结构读写字段。
export type MockHeaderKey =
  | 'status'
  | 'reset'
  | 'claim'
  | 'overage-status'
  | 'overage-reset'
  | 'overage-disabled-reason'
  | 'fallback'
  | 'fallback-percentage'
  | 'retry-after'
  | '5h-utilization'
  | '5h-reset'
  | '5h-surpassed-threshold'
  | '7d-utilization'
  | '7d-reset'
  | '7d-surpassed-threshold'

// MockScenario 固化服务层 mock Rate Limits里传递的数据形状，帮助调用方按同一结构读写字段。
export type MockScenario =
  | 'normal'
  | 'session-limit-reached'
  | 'approaching-weekly-limit'
  | 'weekly-limit-reached'
  | 'overage-active'
  | 'overage-warning'
  | 'overage-exhausted'
  | 'out-of-credits'
  | 'org-zero-credit-limit'
  | 'org-spend-cap-hit'
  | 'member-zero-credit-limit'
  | 'seat-tier-zero-credit-limit'
  | 'opus-limit'
  | 'opus-warning'
  | 'sonnet-limit'
  | 'sonnet-warning'
  | 'fast-mode-limit'
  | 'fast-mode-short-limit'
  | 'extra-usage-required'
  | 'clear'

// mockHeaders 集合 从空对象开始收集键值，后续按名称补齐内容。
let mockHeaders: MockHeaders = {}
// mockEnabled标记服务层 mock Rate Limits是否启用对应路径。
let mockEnabled = false
// mockHeaderless429Message 消息数据 命名 `null`，让后续代码直接表达这个值的用途。
let mockHeaderless429Message: string | null = null
// mockSubscriptionType保存`null`，作为后续空值处理的输入。
let mockSubscriptionType: SubscriptionType | null = null
// mockFastModeRateLimitDurationMs 集合 命名 `null`，让后续代码直接表达这个值的用途。
let mockFastModeRateLimitDurationMs: number | null = null
// mockFastModeRateLimitExpiresAt 命名 `null`，让后续代码直接表达这个值的用途。
let mockFastModeRateLimitExpiresAt: number | null = null
// Default subscription type for mock testing
// DEFAULT_MOCK_SUBSCRIPTION固定为 `'max'`，作为服务层 mock Rate Limits后续展示或比较的基准。
const DEFAULT_MOCK_SUBSCRIPTION: SubscriptionType = 'max'

// Track individual exceeded limits with their reset times
// ExceededLimit 固化服务层 mock Rate Limits里传递的数据形状，帮助调用方按同一结构读写字段。
type ExceededLimit = {
  type: 'five_hour' | 'seven_day' | 'seven_day_opus' | 'seven_day_sonnet'
  resetsAt: number // Unix timestamp
}

// exceededLimits 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
let exceededLimits: ExceededLimit[] = []

// New approach: Toggle individual headers
// setMockHeader 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMockHeader(
  key: MockHeaderKey,
  value: string | undefined,
): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // mockEnabled更新为 `true`，确保服务层后续读取最新状态。
  mockEnabled = true

  // Special case for retry-after which doesn't have the prefix
  // fullKey 命名 `(`，让后续代码直接表达这个值的用途。
  const fullKey = (
    key === 'retry-after' ? 'retry-after' : `anthropic-ratelimit-unified-${key}`
  ) as keyof MockHeaders

  // 当 `value === undefined || value` 匹配 `'clear'` 时，服务层 mock Rate Limits执行对应分支。
  if (value === undefined || value === 'clear') {
    // 服务层 mock Rate Limits在这里处理 `delete mockHeaders[fullKey]`，完成这一小步状态转换。
    delete mockHeaders[fullKey]
    // 当 `key` 匹配 `'claim'` 时，服务层 mock Rate Limits执行对应分支。
    if (key === 'claim') {
      // exceededLimits 集合更新为 `[]`，确保服务层后续读取最新状态。
      exceededLimits = []
    }
    // Update retry-after if status changed
    // 当 `key` 匹配 `'status' || key === 'overag...` 时，服务层 mock Rate Limits执行对应分支。
    if (key === 'status' || key === 'overage-status') {
      // 调用 updateRetryAfter，触发服务层 mock Rate Limits此处需要的副作用。
      updateRetryAfter()
    }
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  } else {
    // Handle special cases for reset times
    // 当 `key` 匹配 `'reset' || key === 'overage...` 时，服务层 mock Rate Limits执行对应分支。
    if (key === 'reset' || key === 'overage-reset') {
      // If user provides a number, treat it as hours from now
      // hours 集合保存`Number`，供服务层 mock Rate Limits后续处理使用。
      const hours = Number(value)
      // 满足 `!isNaN(hours)` 时，服务层 mock Rate Limits执行该分支。
      if (!isNaN(hours)) {
        // 取值更新为 `String(Math.floor(Date.now() / 1000) + hours * 3600)`，确保服务层后续读取最新状态。
        value = String(Math.floor(Date.now() / 1000) + hours * 3600)
      }
    }

    // Handle claims - add to exceeded limits
    // 当 `key` 匹配 `'claim'` 时，服务层 mock Rate Limits执行对应分支。
    if (key === 'claim') {
      // validClaims 集合 聚合成有序列表，保持后续遍历顺序稳定。
      const validClaims = [
        'five_hour',
        'seven_day',
        'seven_day_opus',
        'seven_day_sonnet',
      ]
      // 满足 `validClaims.includes(value)` 时，服务层 mock Rate Limits执行该分支。
      if (validClaims.includes(value)) {
        // Determine reset time based on claim type
        // resetsAt 先占位，稍后的条件分支会根据实际输入补齐它。
        let resetsAt: number
        // 当 `value` 匹配 `'five_hour'` 时，服务层 mock Rate Limits执行对应分支。
        if (value === 'five_hour') {
          // resetsAt更新为 `Math.floor(Date.now() / 1000) + 5 * 3600`，确保服务层后续读取最新状态。
          resetsAt = Math.floor(Date.now() / 1000) + 5 * 3600
        // 服务层 mock Rate Limits在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          value === 'seven_day' ||
          value === 'seven_day_opus' ||
          value === 'seven_day_sonnet'
        ) {
          // resetsAt更新为 `Math.floor(Date.now() / 1000) + 7 * 24 * 3600`，确保服务层后续读取最新状态。
          resetsAt = Math.floor(Date.now() / 1000) + 7 * 24 * 3600
        } else {
          // resetsAt更新为 `Math.floor(Date.now() / 1000) + 3600`，确保服务层后续读取最新状态。
          resetsAt = Math.floor(Date.now() / 1000) + 3600
        }

        // Add to exceeded limits (remove if already exists)
        // exceededLimits 集合更新为 `exceededLimits.filter(l => l.type !== value)`，确保服务层后续读取最新状态。
        exceededLimits = exceededLimits.filter(l => l.type !== value)
        // exceededLimits 集合追加新条目，保持收集顺序与输入顺序一致。
        exceededLimits.push({ type: value as ExceededLimit['type'], resetsAt })

        // Set the representative claim (furthest reset time)
        // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
        updateRepresentativeClaim()
        // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }
    // Widen to a string-valued record so dynamic key assignment is allowed.
    // MockHeaders values are string-literal unions; assigning a raw user-input
    // string requires widening, but this is mock/test code so it's acceptable.
    // 请求头保存`mockHeaders`，供服务层 mock Rate Limits后续判断或输出使用。
    const headers: Partial<Record<keyof MockHeaders, string>> = mockHeaders
    // headers[fullKey更新为 `value`，确保服务层 mock Rate Limits后续读取最新状态。
    headers[fullKey] = value

    // Update retry-after if status changed
    // 当 `key` 匹配 `'status' || key === 'overag...` 时，服务层 mock Rate Limits执行对应分支。
    if (key === 'status' || key === 'overage-status') {
      // 调用 updateRetryAfter，触发服务层 mock Rate Limits此处需要的副作用。
      updateRetryAfter()
    }
  }

  // If all headers are cleared, disable mocking
  // Object.keys(mockHeaders)为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
  if (Object.keys(mockHeaders).length === 0) {
    // mockEnabled更新为 `false`，确保服务层后续读取最新状态。
    mockEnabled = false
  }
}

// Helper to update retry-after based on current state
// updateRetryAfter 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function updateRetryAfter(): void {
  // status 集合读取 `mockHeaders['anthropic-ratelimit-unified-status']` 对应条目，后续围绕该成员继续处理。
  const status = mockHeaders['anthropic-ratelimit-unified-status']
  // overageStatus 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const overageStatus =
    mockHeaders['anthropic-ratelimit-unified-overage-status']
  // reset读取 `mockHeaders['anthropic-ratelimit-unified-reset']` 对应条目，后续围绕该成员继续处理。
  const reset = mockHeaders['anthropic-ratelimit-unified-reset']

  // 服务层 mock Rate Limits在这里进入条件判断，后续代码按实际状态分流。
  if (
    status === 'rejected' &&
    (!overageStatus || overageStatus === 'rejected') &&
    reset
  ) {
    // Calculate seconds until reset
    // resetTimestamp保存`Number`，供服务层 mock Rate Limits后续处理使用。
    const resetTimestamp = Number(reset)
    // secondsUntilReset保存`Math.max`，供服务层 mock Rate Limits后续处理使用。
    const secondsUntilReset = Math.max(
      0,
      resetTimestamp - Math.floor(Date.now() / 1000),
    )
    // mockHeaders['retry-after'更新为 `String(secondsUntilReset)`，确保服务层 mock Rate Limits后续读取最新状态。
    mockHeaders['retry-after'] = String(secondsUntilReset)
  } else {
    // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['retry-after']`，完成这一小步状态转换。
    delete mockHeaders['retry-after']
  }
}

// Update the representative claim based on exceeded limits
// updateRepresentativeClaim 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function updateRepresentativeClaim(): void {
  // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
  if (exceededLimits.length === 0) {
    // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-representative-claim']`，完成这一小步状态转换。
    delete mockHeaders['anthropic-ratelimit-unified-representative-claim']
    // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-reset']`，完成这一小步状态转换。
    delete mockHeaders['anthropic-ratelimit-unified-reset']
    // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['retry-after']`，完成这一小步状态转换。
    delete mockHeaders['retry-after']
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Find the limit with the furthest reset time
  // furthest派生`exceededLimits.reduce`，供服务层 mock Rate Limits后续处理使用。
  const furthest = exceededLimits.reduce((prev, curr) =>
    curr.resetsAt > prev.resetsAt ? curr : prev,
  )

  // Set the representative claim (appears for both warning and rejected)
  // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-representative-claim'] =`，完成这一小步状态转换。
  mockHeaders['anthropic-ratelimit-unified-representative-claim'] =
    furthest.type
  // mockHeaders['anthropic-ratelimit-unified-reset'更新为 `String(furthest.resetsAt)`，确保服务层 mock Rate Limits后续读取最新状态。
  mockHeaders['anthropic-ratelimit-unified-reset'] = String(furthest.resetsAt)

  // Add retry-after if rejected and no overage available
  // 满足 `mockHeaders['anthropic-ratelimit-unified-status']` 时，服务层 mock Rate Limits执行该分支。
  if (mockHeaders['anthropic-ratelimit-unified-status'] === 'rejected') {
    // overageStatus 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const overageStatus =
      mockHeaders['anthropic-ratelimit-unified-overage-status']
    // 当 `!overageStatus || overageStatus` 匹配 `'rejected'` 时，服务层 mock Rate Limits执行对应分支。
    if (!overageStatus || overageStatus === 'rejected') {
      // Calculate seconds until reset
      // secondsUntilReset保存`Math.max`，供服务层 mock Rate Limits后续处理使用。
      const secondsUntilReset = Math.max(
        0,
        furthest.resetsAt - Math.floor(Date.now() / 1000),
      )
      // mockHeaders['retry-after'更新为 `String(secondsUntilReset)`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['retry-after'] = String(secondsUntilReset)
    } else {
      // Overage is available, no retry-after
      // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['retry-after']`，完成这一小步状态转换。
      delete mockHeaders['retry-after']
    }
  } else {
    // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['retry-after']`，完成这一小步状态转换。
    delete mockHeaders['retry-after']
  }
}

// Add function to add exceeded limit with custom reset time
// addExceededLimit 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addExceededLimit(
  type: 'five_hour' | 'seven_day' | 'seven_day_opus' | 'seven_day_sonnet',
  hoursFromNow: number,
): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // mockEnabled更新为 `true`，确保服务层后续读取最新状态。
  mockEnabled = true
  // resetsAt保存`Math.floor`，供服务层 mock Rate Limits后续处理使用。
  const resetsAt = Math.floor(Date.now() / 1000) + hoursFromNow * 3600

  // Remove existing limit of same type
  // exceededLimits 集合更新为 `exceededLimits.filter(l => l.type !== type)`，确保服务层后续读取最新状态。
  exceededLimits = exceededLimits.filter(l => l.type !== type)
  // exceededLimits 集合追加新条目，保持收集顺序与输入顺序一致。
  exceededLimits.push({ type, resetsAt })

  // Update status to rejected if we have exceeded limits
  // 满足 `exceededLimits.length > 0` 时，服务层 mock Rate Limits执行该分支。
  if (exceededLimits.length > 0) {
    // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
    mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
  }

  // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
  updateRepresentativeClaim()
}

// Set mock early warning utilization for time-relative thresholds
// claimAbbrev: '5h' or '7d'
// utilization: 0-1 (e.g., 0.92 for 92% used)
// hoursFromNow: hours until reset (default: 4 for 5h, 120 for 7d)
// setMockEarlyWarning 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMockEarlyWarning(
  claimAbbrev: '5h' | '7d' | 'overage',
  utilization: number,
  hoursFromNow?: number,
): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // mockEnabled更新为 `true`，确保服务层后续读取最新状态。
  mockEnabled = true

  // Clear ALL early warning headers first (5h is checked before 7d, so we need
  // to clear 5h headers when testing 7d to avoid 5h taking priority)
  // 调用 clearMockEarlyWarning，触发服务层 mock Rate Limits此处需要的副作用。
  clearMockEarlyWarning()

  // Default hours based on claim type (early in window to trigger warning)
  // defaultHours 集合标记服务层 mock Rate Limits是否启用对应路径。
  const defaultHours = claimAbbrev === '5h' ? 4 : 5 * 24
  // hours 集合 命名 `hoursFromNow ?? defaultHours`，让后续代码直接表达这个值的用途。
  const hours = hoursFromNow ?? defaultHours
  // resetsAt保存`Math.floor`，供服务层 mock Rate Limits后续处理使用。
  const resetsAt = Math.floor(Date.now() / 1000) + hours * 3600

  // 服务层 mock Rate Limits在这里处理 `mockHeaders[`anthropic-ratelimit-unified-${claimAbbrev}-utilization`] =`，完成这一小步状态转换。
  mockHeaders[`anthropic-ratelimit-unified-${claimAbbrev}-utilization`] =
    String(utilization)
  // 服务层 mock Rate Limits在这里处理 `mockHeaders[`anthropic-ratelimit-unified-${claimAbbrev}-reset`] =`，完成这一小步状态转换。
  mockHeaders[`anthropic-ratelimit-unified-${claimAbbrev}-reset`] =
    String(resetsAt)
  // Set the surpassed-threshold header to trigger early warning
  // 服务层 mock Rate Limits在这里处理 `mockHeaders[`，完成这一小步状态转换。
  mockHeaders[
    `anthropic-ratelimit-unified-${claimAbbrev}-surpassed-threshold`
  ] = String(utilization)

  // Set status to allowed so early warning logic can upgrade it
  // 满足 `!mockHeaders['anthropic-ratelimit-unified-status']` 时，服务层 mock Rate Limits执行该分支。
  if (!mockHeaders['anthropic-ratelimit-unified-status']) {
    // 更新为 `'allowed'`，确保服务层 mock Rate Limits后续读取最新状态。
    mockHeaders['anthropic-ratelimit-unified-status'] = 'allowed'
  }
}

// Clear mock early warning headers
// clearMockEarlyWarning 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMockEarlyWarning(): void {
  // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-5h-utilization']`，完成这一小步状态转换。
  delete mockHeaders['anthropic-ratelimit-unified-5h-utilization']
  // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-5h-reset']`，完成这一小步状态转换。
  delete mockHeaders['anthropic-ratelimit-unified-5h-reset']
  // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-5h-surpassed-threshold']`，完成这一小步状态转换。
  delete mockHeaders['anthropic-ratelimit-unified-5h-surpassed-threshold']
  // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-7d-utilization']`，完成这一小步状态转换。
  delete mockHeaders['anthropic-ratelimit-unified-7d-utilization']
  // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-7d-reset']`，完成这一小步状态转换。
  delete mockHeaders['anthropic-ratelimit-unified-7d-reset']
  // 服务层 mock Rate Limits在这里处理 `delete mockHeaders['anthropic-ratelimit-unified-7d-surpassed-threshold']`，完成这一小步状态转换。
  delete mockHeaders['anthropic-ratelimit-unified-7d-surpassed-threshold']
}

// setMockRateLimitScenario 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMockRateLimitScenario(scenario: MockScenario): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 当 `scenario` 匹配 `'clear'` 时，服务层 mock Rate Limits执行对应分支。
  if (scenario === 'clear') {
    // mockHeaders 集合更新为 `{}`，确保服务层后续读取最新状态。
    mockHeaders = {}
    // mockHeaderless429Message 消息数据更新为 `null`，确保服务层后续读取最新状态。
    mockHeaderless429Message = null
    // mockEnabled更新为 `false`，确保服务层后续读取最新状态。
    mockEnabled = false
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // mockEnabled更新为 `true`，确保服务层后续读取最新状态。
  mockEnabled = true

  // Set reset times for demos
  // fiveHoursFromNow保存`Math.floor`，供服务层 mock Rate Limits后续处理使用。
  const fiveHoursFromNow = Math.floor(Date.now() / 1000) + 5 * 3600
  // sevenDaysFromNow保存`Math.floor`，供服务层 mock Rate Limits后续处理使用。
  const sevenDaysFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 3600

  // Clear existing headers
  // mockHeaders 集合更新为 `{}`，确保服务层后续读取最新状态。
  mockHeaders = {}
  // mockHeaderless429Message 消息数据更新为 `null`，确保服务层后续读取最新状态。
  mockHeaderless429Message = null

  // Only clear exceeded limits for scenarios that explicitly set them
  // Overage scenarios should preserve existing exceeded limits
  // preserveExceededLimits 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const preserveExceededLimits = [
    'overage-active',
    'overage-warning',
    'overage-exhausted',
  ].includes(scenario)
  // preserveExceededLimits 集合缺失时提前走兜底路径，避免服务层 mock Rate Limits继续依赖无效输入。
  if (!preserveExceededLimits) {
    // exceededLimits 集合更新为 `[]`，确保服务层后续读取最新状态。
    exceededLimits = []
  }

  // 按照 scenario 的取值选择服务层 mock Rate Limits的具体处理分支。
  switch (scenario) {
    case 'normal':
      // mockHeaders 集合更新为 `{`，确保服务层后续读取最新状态。
      mockHeaders = {
        'anthropic-ratelimit-unified-status': 'allowed',
        'anthropic-ratelimit-unified-reset': String(fiveHoursFromNow),
      }
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break

    case 'session-limit-reached':
      // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
      exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break

    case 'approaching-weekly-limit':
      // mockHeaders 集合更新为 `{`，确保服务层后续读取最新状态。
      mockHeaders = {
        'anthropic-ratelimit-unified-status': 'allowed_warning',
        'anthropic-ratelimit-unified-reset': String(sevenDaysFromNow),
        'anthropic-ratelimit-unified-representative-claim': 'seven_day',
      }
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break

    case 'weekly-limit-reached':
      // exceededLimits 集合更新为 `[{ type: 'seven_day', resetsAt: sevenDaysFromNow }]`，确保服务层后续读取最新状态。
      exceededLimits = [{ type: 'seven_day', resetsAt: sevenDaysFromNow }]
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break

    case 'overage-active': {
      // If no limits have been exceeded yet, default to 5-hour
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'allowed'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'allowed'
      // Set overage reset time (monthly)
      // endOfMonthActive记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonthActive = new Date()
      // endOfMonthActive.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthActive.setMonth(endOfMonthActive.getMonth() + 1, 1)
      // endOfMonthActive.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthActive.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonthActive.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'overage-warning': {
      // If no limits have been exceeded yet, default to 5-hour
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-overage-status'] =`，完成这一小步状态转换。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] =
        'allowed_warning'
      // Overage typically resets monthly, but for demo let's say end of month
      // endOfMonth记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonth = new Date()
      // endOfMonth.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 1)
      // endOfMonth.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonth.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonth.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'overage-exhausted': {
      // If no limits have been exceeded yet, default to 5-hour
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'rejected'
      // Both subscription and overage are exhausted
      // Subscription resets based on the exceeded limit, overage resets monthly
      // endOfMonthExhausted记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonthExhausted = new Date()
      // endOfMonthExhausted.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthExhausted.setMonth(endOfMonthExhausted.getMonth() + 1, 1)
      // endOfMonthExhausted.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthExhausted.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonthExhausted.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'out-of-credits': {
      // Out of credits - subscription limit hit, overage rejected due to insufficient credits
      // (wallet is empty)
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'rejected'
      // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =`，完成这一小步状态转换。
      mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =
        'out_of_credits'
      // endOfMonth记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonth = new Date()
      // endOfMonth.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 1)
      // endOfMonth.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonth.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonth.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'org-zero-credit-limit': {
      // Org service has zero credit limit - admin set org-level spend cap to $0
      // Non-admin Team/Enterprise users should not see "Request extra usage" option
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'rejected'
      // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =`，完成这一小步状态转换。
      mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =
        'org_service_zero_credit_limit'
      // endOfMonthZero记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonthZero = new Date()
      // endOfMonthZero.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthZero.setMonth(endOfMonthZero.getMonth() + 1, 1)
      // endOfMonthZero.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthZero.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonthZero.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'org-spend-cap-hit': {
      // Org spend cap hit for the month - org overages temporarily disabled
      // Non-admin Team/Enterprise users should not see "Request extra usage" option
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'rejected'
      // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =`，完成这一小步状态转换。
      mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =
        'org_level_disabled_until'
      // endOfMonthHit记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonthHit = new Date()
      // endOfMonthHit.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthHit.setMonth(endOfMonthHit.getMonth() + 1, 1)
      // endOfMonthHit.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthHit.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonthHit.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'member-zero-credit-limit': {
      // Member has zero credit limit - admin set this user's individual limit to $0
      // Non-admin Team/Enterprise users SHOULD see "Request extra usage" (admin can allocate more)
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'rejected'
      // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =`，完成这一小步状态转换。
      mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =
        'member_zero_credit_limit'
      // endOfMonthMember记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonthMember = new Date()
      // endOfMonthMember.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthMember.setMonth(endOfMonthMember.getMonth() + 1, 1)
      // endOfMonthMember.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthMember.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonthMember.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'seat-tier-zero-credit-limit': {
      // Seat tier has zero credit limit - admin set this seat tier's limit to $0
      // Non-admin Team/Enterprise users SHOULD see "Request extra usage" (admin can allocate more)
      // exceededLimits 集合为空时立即返回或跳过，避免服务层 mock Rate Limits把空集合当成可处理内容。
      if (exceededLimits.length === 0) {
        // exceededLimits 集合更新为 `[{ type: 'five_hour', resetsAt: fiveHoursFromNow }]`，确保服务层后续读取最新状态。
        exceededLimits = [{ type: 'five_hour', resetsAt: fiveHoursFromNow }]
      }
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-status'] = 'rejected'
      // 服务层 mock Rate Limits在这里处理 `mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =`，完成这一小步状态转换。
      mockHeaders['anthropic-ratelimit-unified-overage-disabled-reason'] =
        'seat_tier_zero_credit_limit'
      // endOfMonthSeatTier记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const endOfMonthSeatTier = new Date()
      // endOfMonthSeatTier.setMonth 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthSeatTier.setMonth(endOfMonthSeatTier.getMonth() + 1, 1)
      // endOfMonthSeatTier.setHours 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      endOfMonthSeatTier.setHours(0, 0, 0, 0)
      // 更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-overage-reset'] = String(
        Math.floor(endOfMonthSeatTier.getTime() / 1000),
      )
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'opus-limit': {
      // exceededLimits 集合更新为 `[{ type: 'seven_day_opus', resetsAt: sevenDaysFromNow }]`，确保服务层后续读取最新状态。
      exceededLimits = [{ type: 'seven_day_opus', resetsAt: sevenDaysFromNow }]
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // Always send 429 rejected status - the error handler will decide whether
      // to show an error or return NO_RESPONSE_REQUESTED based on fallback eligibility
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'opus-warning': {
      // mockHeaders 集合更新为 `{`，确保服务层后续读取最新状态。
      mockHeaders = {
        'anthropic-ratelimit-unified-status': 'allowed_warning',
        'anthropic-ratelimit-unified-reset': String(sevenDaysFromNow),
        'anthropic-ratelimit-unified-representative-claim': 'seven_day_opus',
      }
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'sonnet-limit': {
      // exceededLimits 集合更新为 `[`，确保服务层后续读取最新状态。
      exceededLimits = [
        { type: 'seven_day_sonnet', resetsAt: sevenDaysFromNow },
      ]
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'sonnet-warning': {
      // mockHeaders 集合更新为 `{`，确保服务层后续读取最新状态。
      mockHeaders = {
        'anthropic-ratelimit-unified-status': 'allowed_warning',
        'anthropic-ratelimit-unified-reset': String(sevenDaysFromNow),
        'anthropic-ratelimit-unified-representative-claim': 'seven_day_sonnet',
      }
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'fast-mode-limit': {
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // Duration in ms (> 20s threshold to trigger cooldown)
      // mockFastModeRateLimitDurationMs 集合更新为 `10 * 60 * 1000`，确保服务层后续读取最新状态。
      mockFastModeRateLimitDurationMs = 10 * 60 * 1000
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'fast-mode-short-limit': {
      // 调用 updateRepresentativeClaim，触发服务层 mock Rate Limits此处需要的副作用。
      updateRepresentativeClaim()
      // 更新为 `'rejected'`，确保服务层 mock Rate Limits后续读取最新状态。
      mockHeaders['anthropic-ratelimit-unified-status'] = 'rejected'
      // Duration in ms (< 20s threshold, won't trigger cooldown)
      // mockFastModeRateLimitDurationMs 集合更新为 `10 * 1000`，确保服务层后续读取最新状态。
      mockFastModeRateLimitDurationMs = 10 * 1000
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    case 'extra-usage-required': {
      // Headerless 429 — exercises the entitlement-rejection path in errors.ts
      // 服务层 mock Rate Limits在这里处理 `mockHeaderless429Message =`，完成这一小步状态转换。
      mockHeaderless429Message =
        'Extra usage is required for long context requests.'
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
    }

    default:
      // 结束这个分支或循环，避免服务层 mock Rate Limits继续落入后续路径。
      break
  }
}

// getMockHeaderless429Message 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMockHeaderless429Message(): string | null {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }
  // Env var path for -p / SDK testing where slash commands aren't available
  // 满足 `process.env.CLAUDE_MOCK_HEADERLESS_429` 时，服务层 mock Rate Limits执行该分支。
  if (process.env.CLAUDE_MOCK_HEADERLESS_429) {
    // 返回 `process.env.CLAUDE_MOCK_HEADERLESS_429`，作为服务层 mock Rate Limits这次计算的结果。
    return process.env.CLAUDE_MOCK_HEADERLESS_429
  }
  // mockEnabled缺失时提前走兜底路径，避免服务层 mock Rate Limits继续依赖无效输入。
  if (!mockEnabled) {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }
  // 返回 `mockHeaderless429Message`，作为服务层 mock Rate Limits这次计算的结果。
  return mockHeaderless429Message
}

// getMockHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMockHeaders(): MockHeaders | null {
  // 服务层 mock Rate Limits在这里进入条件判断，后续代码按实际状态分流。
  if (
    !mockEnabled ||
    process.env.USER_TYPE !== 'ant' ||
    Object.keys(mockHeaders).length === 0
  ) {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }
  // 返回 `mockHeaders`，作为服务层 mock Rate Limits这次计算的结果。
  return mockHeaders
}

// getMockStatus 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMockStatus(): string {
  // 服务层 mock Rate Limits在这里进入条件判断，后续代码按实际状态分流。
  if (
    !mockEnabled ||
    (Object.keys(mockHeaders).length === 0 && !mockSubscriptionType)
  ) {
    // 返回 `'No mock headers active (using real limits)'`，作为服务层 mock Rate Limits这次计算的结果。
    return 'No mock headers active (using real limits)'
  }

  // 文本行 从空数组开始收集，后续循环会按处理顺序追加条目。
  const lines: string[] = []
  // 文本行追加新条目，保持收集顺序与输入顺序一致。
  lines.push('Active mock headers:')

  // Show subscription type - either explicitly set or default
  // effectiveSubscription 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const effectiveSubscription =
    mockSubscriptionType || DEFAULT_MOCK_SUBSCRIPTION
  // 满足 `mockSubscriptionType` 时，服务层 mock Rate Limits执行该分支。
  if (mockSubscriptionType) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`  Subscription Type: ${mockSubscriptionType} (explicitly set)`)
  } else {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push(`  Subscription Type: ${effectiveSubscription} (default)`)
  }

  // 调用 Object.entries，触发服务层 mock Rate Limits此处需要的副作用。
  Object.entries(mockHeaders).forEach(([key, value]) => {
    // `value` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== undefined) {
      // Format the header name nicely
      // formattedKey 命名 `key`，让后续代码直接表达这个值的用途。
      const formattedKey = key
        .replace('anthropic-ratelimit-unified-', '')
        .replace(/-/g, ' ')
        // 链式调用 replace，继续加工上一行在服务层 mock Rate Limits中产生的数据。
        .replace(/\b\w/g, c => c.toUpperCase())

      // Format timestamps as human-readable
      // 组合条件 `key.includes('reset') && value` 成立时，服务层 mock Rate Limits才启用这条专门路径。
      if (key.includes('reset') && value) {
        // timestamp保存`Number`，供服务层 mock Rate Limits后续处理使用。
        const timestamp = Number(value)
        // date记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
        const date = new Date(timestamp * 1000)
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(`  ${formattedKey}: ${value} (${date.toLocaleString()})`)
      } else {
        // 文本行追加新条目，保持收集顺序与输入顺序一致。
        lines.push(`  ${formattedKey}: ${value}`)
      }
    }
  })

  // Show exceeded limits if any
  // 满足 `exceededLimits.length > 0` 时，服务层 mock Rate Limits执行该分支。
  if (exceededLimits.length > 0) {
    // 文本行追加新条目，保持收集顺序与输入顺序一致。
    lines.push('\nExceeded limits (contributing to representative claim):')
    // 调用 exceededLimits.forEach，触发服务层 mock Rate Limits此处需要的副作用。
    exceededLimits.forEach(limit => {
      // date记录时间`Date`，供服务层 mock Rate Limits后续处理使用。
      const date = new Date(limit.resetsAt * 1000)
      // 文本行追加新条目，保持收集顺序与输入顺序一致。
      lines.push(`  ${limit.type}: resets at ${date.toLocaleString()}`)
    })
  }

  // 返回 `lines.join('\n')`，作为服务层 mock Rate Limits这次计算的结果。
  return lines.join('\n')
}

// clearMockHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearMockHeaders(): void {
  // mockHeaders 集合更新为 `{}`，确保服务层后续读取最新状态。
  mockHeaders = {}
  // exceededLimits 集合更新为 `[]`，确保服务层后续读取最新状态。
  exceededLimits = []
  // mockSubscriptionType更新为 `null`，确保服务层后续读取最新状态。
  mockSubscriptionType = null
  // mockFastModeRateLimitDurationMs 集合更新为 `null`，确保服务层后续读取最新状态。
  mockFastModeRateLimitDurationMs = null
  // mockFastModeRateLimitExpiresAt更新为 `null`，确保服务层后续读取最新状态。
  mockFastModeRateLimitExpiresAt = null
  // mockHeaderless429Message 消息数据更新为 `null`，确保服务层后续读取最新状态。
  mockHeaderless429Message = null
  // setMockBillingAccessOverride 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
  setMockBillingAccessOverride(null)
  // mockEnabled更新为 `false`，确保服务层后续读取最新状态。
  mockEnabled = false
}

// applyMockHeaders 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function applyMockHeaders(
  headers: globalThis.Headers,
): globalThis.Headers {
  // mock读取`getMockHeaders`，供服务层 mock Rate Limits后续处理使用。
  const mock = getMockHeaders()
  // mock缺失时提前走兜底路径，避免服务层 mock Rate Limits继续依赖无效输入。
  if (!mock) {
    // 返回 `headers`，作为服务层 mock Rate Limits这次计算的结果。
    return headers
  }

  // Create a new Headers object with original headers
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  // newHeaders 集合保存`globalThis.Headers`，供服务层 mock Rate Limits后续处理使用。
  const newHeaders = new globalThis.Headers(headers)

  // Apply mock headers (overwriting originals)
  // 调用 Object.entries，触发服务层 mock Rate Limits此处需要的副作用。
  Object.entries(mock).forEach(([key, value]) => {
    // `value` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== undefined) {
      // newHeaders.set 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
      newHeaders.set(key, value)
    }
  })

  // 返回 `newHeaders`，作为服务层 mock Rate Limits这次计算的结果。
  return newHeaders
}

// Check if we should process rate limits even without subscription
// This is for Ant employees testing with mocks
// shouldProcessMockLimits 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldProcessMockLimits(): boolean {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `mockEnabled || Boolean(process.env.CLAUDE_MOCK_HEADERLESS_429)`，作为服务层 mock Rate Limits这次计算的结果。
  return mockEnabled || Boolean(process.env.CLAUDE_MOCK_HEADERLESS_429)
}

// getCurrentMockScenario 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCurrentMockScenario(): MockScenario | null {
  // mockEnabled缺失时提前走兜底路径，避免服务层 mock Rate Limits继续依赖无效输入。
  if (!mockEnabled) {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }

  // Reverse lookup the scenario from current headers
  // mockHeaders 集合缺失时提前走兜底路径，避免服务层 mock Rate Limits继续依赖无效输入。
  if (!mockHeaders) return null

  // status 集合读取 `mockHeaders['anthropic-ratelimit-unified-status']` 对应条目，后续围绕该成员继续处理。
  const status = mockHeaders['anthropic-ratelimit-unified-status']
  // overage读取 `mockHeaders['anthropic-ratelimit-unified-overage-status']` 对应条目，后续围绕该成员继续处理。
  const overage = mockHeaders['anthropic-ratelimit-unified-overage-status']
  // claim 命名 `mockHeaders['anthropic-ratelimit-unified-representative-c...`，让后续代码直接表达这个值的用途。
  const claim = mockHeaders['anthropic-ratelimit-unified-representative-claim']

  // 当 `claim` 匹配 `'seven_day_opus'` 时，服务层 mock Rate Limits执行对应分支。
  if (claim === 'seven_day_opus') {
    // 返回 `status === 'rejected' ? 'opus-limit' : 'opus-warning'`，作为服务层 mock Rate Limits这次计算的结果。
    return status === 'rejected' ? 'opus-limit' : 'opus-warning'
  }

  // 当 `claim` 匹配 `'seven_day_sonnet'` 时，服务层 mock Rate Limits执行对应分支。
  if (claim === 'seven_day_sonnet') {
    // 返回 `status === 'rejected' ? 'sonnet-limit' : 'sonnet-warning'`，作为服务层 mock Rate Limits这次计算的结果。
    return status === 'rejected' ? 'sonnet-limit' : 'sonnet-warning'
  }

  // 当 `overage` 匹配 `'rejected'` 时，服务层 mock Rate Limits执行对应分支。
  if (overage === 'rejected') return 'overage-exhausted'
  // 当 `overage` 匹配 `'allowed_warning'` 时，服务层 mock Rate Limits执行对应分支。
  if (overage === 'allowed_warning') return 'overage-warning'
  // 当 `overage` 匹配 `'allowed'` 时，服务层 mock Rate Limits执行对应分支。
  if (overage === 'allowed') return 'overage-active'

  // 当 `status` 匹配 `'rejected'` 时，服务层 mock Rate Limits执行对应分支。
  if (status === 'rejected') {
    // 当 `claim` 匹配 `'five_hour'` 时，服务层 mock Rate Limits执行对应分支。
    if (claim === 'five_hour') return 'session-limit-reached'
    // 当 `claim` 匹配 `'seven_day'` 时，服务层 mock Rate Limits执行对应分支。
    if (claim === 'seven_day') return 'weekly-limit-reached'
  }

  // 当 `status` 匹配 `'allowed_warning'` 时，服务层 mock Rate Limits执行对应分支。
  if (status === 'allowed_warning') {
    // 当 `claim` 匹配 `'seven_day'` 时，服务层 mock Rate Limits执行对应分支。
    if (claim === 'seven_day') return 'approaching-weekly-limit'
  }

  // 当 `status` 匹配 `'allowed'` 时，服务层 mock Rate Limits执行对应分支。
  if (status === 'allowed') return 'normal'

  // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
  return null
}

// getScenarioDescription 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getScenarioDescription(scenario: MockScenario): string {
  // 按照 scenario 的取值选择服务层 mock Rate Limits的具体处理分支。
  switch (scenario) {
    case 'normal':
      // 返回 `'Normal usage, no limits'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Normal usage, no limits'
    case 'session-limit-reached':
      // 返回 `'Session rate limit exceeded'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Session rate limit exceeded'
    case 'approaching-weekly-limit':
      // 返回 `'Approaching weekly aggregate limit'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Approaching weekly aggregate limit'
    case 'weekly-limit-reached':
      // 返回 `'Weekly aggregate limit exceeded'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Weekly aggregate limit exceeded'
    case 'overage-active':
      // 返回 `'Using extra usage (overage active)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Using extra usage (overage active)'
    case 'overage-warning':
      // 返回 `'Approaching extra usage limit'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Approaching extra usage limit'
    case 'overage-exhausted':
      // 返回 `'Both subscription and extra usage limits exhausted'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Both subscription and extra usage limits exhausted'
    case 'out-of-credits':
      // 返回 `'Out of extra usage credits (wallet empty)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Out of extra usage credits (wallet empty)'
    case 'org-zero-credit-limit':
      // 返回 `'Org spend cap is zero (no extra usage budget)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Org spend cap is zero (no extra usage budget)'
    case 'org-spend-cap-hit':
      // 返回 `'Org spend cap hit for the month'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Org spend cap hit for the month'
    case 'member-zero-credit-limit':
      // 返回 `'Member limit is zero (admin can allocate more)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Member limit is zero (admin can allocate more)'
    case 'seat-tier-zero-credit-limit':
      // 返回 `'Seat tier limit is zero (admin can allocate more)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Seat tier limit is zero (admin can allocate more)'
    case 'opus-limit':
      // 返回 `'Opus limit reached'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Opus limit reached'
    case 'opus-warning':
      // 返回 `'Approaching Opus limit'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Approaching Opus limit'
    case 'sonnet-limit':
      // 返回 `'Sonnet limit reached'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Sonnet limit reached'
    case 'sonnet-warning':
      // 返回 `'Approaching Sonnet limit'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Approaching Sonnet limit'
    case 'fast-mode-limit':
      // 返回 `'Fast mode rate limit'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Fast mode rate limit'
    case 'fast-mode-short-limit':
      // 返回 `'Fast mode rate limit (short)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Fast mode rate limit (short)'
    case 'extra-usage-required':
      // 返回 `'Headerless 429: Extra usage required for 1M context'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Headerless 429: Extra usage required for 1M context'
    case 'clear':
      // 返回 `'Clear mock headers (use real limits)'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Clear mock headers (use real limits)'
    default:
      // 返回 `'Unknown scenario'`，作为服务层 mock Rate Limits这次计算的结果。
      return 'Unknown scenario'
  }
}

// Mock subscription type management
// setMockSubscriptionType 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMockSubscriptionType(
  subscriptionType: SubscriptionType | null,
): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // mockEnabled更新为 `true`，确保服务层后续读取最新状态。
  mockEnabled = true
  // mockSubscriptionType更新为 `subscriptionType`，确保服务层后续读取最新状态。
  mockSubscriptionType = subscriptionType
}

// getMockSubscriptionType 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMockSubscriptionType(): SubscriptionType | null {
  // `!mockEnabled || process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (!mockEnabled || process.env.USER_TYPE !== 'ant') {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }
  // Return the explicitly set subscription type, or default to 'max'
  // 返回 `mockSubscriptionType || DEFAULT_MOCK_SUBSCRIPTION`，作为服务层 mock Rate Limits这次计算的结果。
  return mockSubscriptionType || DEFAULT_MOCK_SUBSCRIPTION
}

// Export a function that checks if we should use mock subscription
// shouldUseMockSubscription 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldUseMockSubscription(): boolean {
  // 返回 `(`，作为服务层 mock Rate Limits这次计算的结果。
  return (
    mockEnabled &&
    mockSubscriptionType !== null &&
    process.env.USER_TYPE === 'ant'
  )
}

// Mock billing access (admin vs non-admin)
// setMockBillingAccess 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMockBillingAccess(hasAccess: boolean | null): void {
  // `process.env.USER_TYPE` 与 `'ant'` 不一致时刷新派生状态，避免使用过期结果。
  if (process.env.USER_TYPE !== 'ant') {
    // 服务层 mock Rate Limits在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // mockEnabled更新为 `true`，确保服务层后续读取最新状态。
  mockEnabled = true
  // setMockBillingAccessOverride 写入新的状态值，使服务层 mock Rate Limits后续读取保持一致。
  setMockBillingAccessOverride(hasAccess)
}

// Mock fast mode rate limit handling
// isMockFastModeRateLimitScenario 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMockFastModeRateLimitScenario(): boolean {
  // 返回 `mockFastModeRateLimitDurationMs !== null`，作为服务层 mock Rate Limits这次计算的结果。
  return mockFastModeRateLimitDurationMs !== null
}

// checkMockFastModeRateLimit 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkMockFastModeRateLimit(
  isFastModeActive?: boolean,
): MockHeaders | null {
  // 满足 `mockFastModeRateLimitDurationMs === null` 时，服务层 mock Rate Limits执行该分支。
  if (mockFastModeRateLimitDurationMs === null) {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }

  // Only throw when fast mode is active
  // isFastModeActive缺失时提前走兜底路径，避免服务层 mock Rate Limits继续依赖无效输入。
  if (!isFastModeActive) {
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }

  // Check if the rate limit has expired
  // 服务层 mock Rate Limits在这里进入条件判断，后续代码按实际状态分流。
  if (
    mockFastModeRateLimitExpiresAt !== null &&
    Date.now() >= mockFastModeRateLimitExpiresAt
  ) {
    // 调用 clearMockHeaders，触发服务层 mock Rate Limits此处需要的副作用。
    clearMockHeaders()
    // 返回 `null`，作为服务层 mock Rate Limits这次计算的结果。
    return null
  }

  // Set expiry on first error (not when scenario is configured)
  // 满足 `mockFastModeRateLimitExpiresAt === null` 时，服务层 mock Rate Limits执行该分支。
  if (mockFastModeRateLimitExpiresAt === null) {
    // 服务层 mock Rate Limits在这里处理 `mockFastModeRateLimitExpiresAt =`，完成这一小步状态转换。
    mockFastModeRateLimitExpiresAt =
      Date.now() + mockFastModeRateLimitDurationMs
  }

  // Compute dynamic retry-after based on remaining time
  // remainingMs 集合记录时间`Date.now`，供服务层 mock Rate Limits后续处理使用。
  const remainingMs = mockFastModeRateLimitExpiresAt - Date.now()
  // headersToSend 集中保存服务层 mock Rate Limits要一起传递的字段。
  const headersToSend = { ...mockHeaders }
  // headersToSend['retry-after'更新为 `String(`，确保服务层 mock Rate Limits后续读取最新状态。
  headersToSend['retry-after'] = String(
    Math.max(1, Math.ceil(remainingMs / 1000)),
  )

  // 返回 `headersToSend`，作为服务层 mock Rate Limits这次计算的结果。
  return headersToSend
}
