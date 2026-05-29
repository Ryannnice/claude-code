// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../../services/analytics/index.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
// 引入 isEnvTruthy，将 ../envUtils.js 中已经封装好的能力接到本文件流程里。
import { isEnvTruthy } from '../envUtils.js'

// APIProvider 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry'

// getAPIProvider 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAPIProvider(): APIProvider {
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)`，作为共享工具这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)
    ? 'bedrock'
    : isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)
      ? 'vertex'
      : isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
        ? 'foundry'
        : 'firstParty'
}

// getAPIProviderForStatsig 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  // 返回 `getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FI...`，作为共享工具这次计算的结果。
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL.
 * Returns true if not set (default API) or points to api.anthropic.com
 * (or api-staging.anthropic.com for ant users).
 */
// isFirstPartyAnthropicBaseUrl 封装模型工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isFirstPartyAnthropicBaseUrl(): boolean {
  // baseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  // baseUrl缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!baseUrl) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // host保存`URL`，供共享工具后续处理使用。
    const host = new URL(baseUrl).host
    // allowedHosts 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const allowedHosts = ['api.anthropic.com']
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，共享工具执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // allowedHosts 集合追加新条目，保持收集顺序与输入顺序一致。
      allowedHosts.push('api-staging.anthropic.com')
    }
    // 返回 `allowedHosts.includes(host)`，作为共享工具这次计算的结果。
    return allowedHosts.includes(host)
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}
