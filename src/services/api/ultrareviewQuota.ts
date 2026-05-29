// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { isClaudeAISubscriber } from '../../utils/auth.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 getOAuthHeaders、prepareApiRequest 工具函数，把通用处理留在 ../../utils/teleport/api.js 中维护。
import { getOAuthHeaders, prepareApiRequest } from '../../utils/teleport/api.js'

// UltrareviewQuotaResponse 固化API 服务 ultrareview Quota里传递的数据形状，帮助调用方按同一结构读写字段。
export type UltrareviewQuotaResponse = {
  reviews_used: number
  reviews_limit: number
  reviews_remaining: number
  is_overage: boolean
}

/**
 * Peek the ultrareview quota for display and nudge decisions. Consume
 * happens server-side at session creation. Null when not a subscriber or
 * the endpoint errors.
 */
// fetchUltrareviewQuota 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchUltrareviewQuota(): Promise<UltrareviewQuotaResponse | null> {
  // 满足 `!isClaudeAISubscriber()` 时，API 服务 ultrareview Quota执行该分支。
  if (!isClaudeAISubscriber()) return null
  // 保护这一段可能失败的API 服务 ultrareview Quota操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await prepareApiRequest()` 解构 accessToken、orgUUID，减少API 服务 ultrareview Quota对同一对象的重复访问。
    const { accessToken, orgUUID } = await prepareApiRequest()
    // 接口响应 等待 `axios.get<UltrareviewQuotaResponse>(`，确保继续执行前已有结果。
    const response = await axios.get<UltrareviewQuotaResponse>(
      `${getOauthConfig().BASE_API_URL}/v1/ultrareview/quota`,
      {
        headers: {
          ...getOAuthHeaders(accessToken),
          'x-organization-uuid': orgUUID,
        },
        timeout: 5000,
      },
    )
    // 返回 `response.data`，作为API 服务 ultrareview Quota这次计算的结果。
    return response.data
  } catch (error) {
    // 记录API 服务 ultrareview Quota运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`fetchUltrareviewQuota failed: ${error}`)
    // 返回 `null`，作为API 服务 ultrareview Quota这次计算的结果。
    return null
  }
}
