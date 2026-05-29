// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKey,
  getAuthTokenSource,
  getSubscriptionType,
  isClaudeAISubscriber,
} from './auth.js'
// 引入 getGlobalConfig，将 ./config.js 中已经封装好的能力接到本文件流程里。
import { getGlobalConfig } from './config.js'
// 引入 isEnvTruthy，将 ./envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from './envUtils.js'

// hasConsoleBillingAccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasConsoleBillingAccess(): boolean {
  // Check if cost reporting is disabled via environment variable
  // 满足 `isEnvTruthy(process.env.DISABLE_COST_WARNINGS)` 时，共享工具执行该分支。
  if (isEnvTruthy(process.env.DISABLE_COST_WARNINGS)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // isSubscriber记录 `isClaudeAISubscriber` 是否成立，共享工具随后按该结果分支。
  const isSubscriber = isClaudeAISubscriber()

  // This might be wrong if user is signed into Max but also using an API key, but
  // we already show a warning on launch in that case
  // 满足 `isSubscriber` 时，共享工具执行该分支。
  if (isSubscriber) return false

  // Check if user has any form of authentication
  // authSource读取`getAuthTokenSource`，供共享工具后续处理使用。
  const authSource = getAuthTokenSource()
  // hasApiKey记录 `getAnthropicApiKey` 是否成立，共享工具随后按该结果分支。
  const hasApiKey = getAnthropicApiKey() !== null

  // If user has no authentication at all (logged out), don't show costs
  // 只有 `!authSource.hasToken && !hasApiKey` 满足时，共享工具才执行该分支。
  if (!authSource.hasToken && !hasApiKey) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // orgRole统计`config.oauthAccount?.organizationRole` 整理出中间结果，供共享工具 billing后续步骤使用。
  const orgRole = config.oauthAccount?.organizationRole
  // workspaceRole统计`config.oauthAccount?.workspaceRole`，供后续判断或组装使用。
  const workspaceRole = config.oauthAccount?.workspaceRole

  // 只有 `!orgRole || !workspaceRole` 满足时，共享工具才执行该分支。
  if (!orgRole || !workspaceRole) {
    // 返回 `false // hide cost for grandfathered users who have not re-authed since...`，作为共享工具这次计算的结果。
    return false // hide cost for grandfathered users who have not re-authed since we've added roles
  }

  // Users have billing access if they are admins or billing roles at either workspace or organization level
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    ['admin', 'billing'].includes(orgRole) ||
    ['workspace_admin', 'workspace_billing'].includes(workspaceRole)
  )
}

// Mock billing access for /mock-limits testing (set by mockRateLimits.ts)
// mockBillingAccessOverride初始化为空值，后续分支会在有数据时补齐。
let mockBillingAccessOverride: boolean | null = null

// setMockBillingAccessOverride 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function setMockBillingAccessOverride(value: boolean | null): void {
  // mockBillingAccessOverride更新为 `value`，确保共享工具后续读取最新状态。
  mockBillingAccessOverride = value
}

// hasClaudeAiBillingAccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasClaudeAiBillingAccess(): boolean {
  // Check for mock billing access first (for /mock-limits testing)
  // `mockBillingAccessOverride` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
  if (mockBillingAccessOverride !== null) {
    // 返回 `mockBillingAccessOverride`，作为共享工具这次计算的结果。
    return mockBillingAccessOverride
  }

  // 满足 `!isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (!isClaudeAISubscriber()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
  const subscriptionType = getSubscriptionType()

  // Consumer plans (Max/Pro) - individual users always have billing access
  // 只有 `subscriptionType === 'max' || subscriptionType ==` 满足时，共享工具才执行该分支。
  if (subscriptionType === 'max' || subscriptionType === 'pro') {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Team/Enterprise - check for admin or billing roles
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // orgRole统计`config.oauthAccount?.organizationRole` 整理出中间结果，供共享工具 billing后续步骤使用。
  const orgRole = config.oauthAccount?.organizationRole

  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    !!orgRole &&
    ['admin', 'billing', 'owner', 'primary_owner'].includes(orgRole)
  )
}
