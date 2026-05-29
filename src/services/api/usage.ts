// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 整理这一组导入，让API 服务 usage后续逻辑可以直接复用这些外部能力。
import {
  getClaudeAIOAuthTokens,
  hasProfileScope,
  isClaudeAISubscriber,
} from '../../utils/auth.js'
// 复用 getAuthHeaders 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getAuthHeaders } from '../../utils/http.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'
// 引入 isOAuthTokenExpired，将 ../oauth/client.js 中已经封装好的能力接到本文件流程里。
import { isOAuthTokenExpired } from '../oauth/client.js'

// RateLimit 固化API 服务 usage里传递的数据形状，帮助调用方按同一结构读写字段。
export type RateLimit = {
  utilization: number | null // a percentage from 0 to 100
  resets_at: string | null // ISO 8601 timestamp
}

// ExtraUsage 固化API 服务 usage里传递的数据形状，帮助调用方按同一结构读写字段。
export type ExtraUsage = {
  is_enabled: boolean
  monthly_limit: number | null
  used_credits: number | null
  utilization: number | null
}

// Utilization 固化API 服务 usage里传递的数据形状，帮助调用方按同一结构读写字段。
export type Utilization = {
  five_hour?: RateLimit | null
  seven_day?: RateLimit | null
  seven_day_oauth_apps?: RateLimit | null
  seven_day_opus?: RateLimit | null
  seven_day_sonnet?: RateLimit | null
  extra_usage?: ExtraUsage | null
}

// fetchUtilization 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchUtilization(): Promise<Utilization | null> {
  // 组合条件 `!isClaudeAISubscriber() || !hasProfileScope()` 成立时，API 服务 usage才启用这条专门路径。
  if (!isClaudeAISubscriber() || !hasProfileScope()) {
    // 返回结构化结果，集中表达API 服务 usage已经整理出的状态。
    return {}
  }

  // Skip API call if OAuth token is expired to avoid 401 errors
  // token 列表读取`getClaudeAIOAuthTokens`，供API 服务 usage后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 组合条件 `tokens && isOAuthTokenExpired(tokens.expiresAt)` 成立时，API 服务 usage才启用这条专门路径。
  if (tokens && isOAuthTokenExpired(tokens.expiresAt)) {
    // 返回 `null`，作为API 服务 usage这次计算的结果。
    return null
  }

  // authResult读取`getAuthHeaders`，供API 服务 usage后续处理使用。
  const authResult = getAuthHeaders()
  // 满足 `authResult.error` 时，API 服务 usage执行该分支。
  if (authResult.error) {
    // 抛出 new Error(`Auth error: ${authResult.error}`)，阻止API 服务 usage在无效状态下继续运行。
    throw new Error(`Auth error: ${authResult.error}`)
  }

  // 请求头 集中保存API 服务 usage要一起传递的字段。
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': getClaudeCodeUserAgent(),
    ...authResult.headers,
  }

  // URL读取`getOauthConfig`，供API 服务 usage后续处理使用。
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/usage`

  // 接口响应 等待 `axios.get<Utilization>(url, {`，确保继续执行前已有结果。
  const response = await axios.get<Utilization>(url, {
    headers,
    timeout: 5000, // 5 second timeout
  })

  // 返回 `response.data`，作为API 服务 usage这次计算的结果。
  return response.data
}
