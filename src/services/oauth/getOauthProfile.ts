// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig、OAUTH_BETA_HEADER，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig, OAUTH_BETA_HEADER } from 'src/constants/oauth.js'
// 类型依赖 { OAuthProfileResponse } 来自 src/services/oauth/types.js，用于校准服务层 get Oauth Profile的数据契约。
import type { OAuthProfileResponse } from 'src/services/oauth/types.js'
// 复用 getAnthropicApiKey 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { getAnthropicApiKey } from 'src/utils/auth.js'
// 复用 getGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { getGlobalConfig } from 'src/utils/config.js'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// getOauthProfileFromApiKey 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getOauthProfileFromApiKey(): Promise<
  OAuthProfileResponse | undefined
> {
  // Assumes interactive session
  // 配置读取`getGlobalConfig`，供服务层 get Oauth Profile后续处理使用。
  const config = getGlobalConfig()
  // accountUuid 数量统计`config.oauthAccount?.accountUuid`，供后续判断或组装使用。
  const accountUuid = config.oauthAccount?.accountUuid
  // API key读取`getAnthropicApiKey`，供服务层 get Oauth Profile后续处理使用。
  const apiKey = getAnthropicApiKey()

  // Need both account UUID and API key to check
  // 组合条件 `!accountUuid || !apiKey` 成立时，服务层 get Oauth Profile才启用这条专门路径。
  if (!accountUuid || !apiKey) {
    // 服务层 get Oauth Profile在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // endpoint读取`getOauthConfig`，供服务层 get Oauth Profile后续处理使用。
  const endpoint = `${getOauthConfig().BASE_API_URL}/api/claude_cli_profile`
  // 保护这一段可能失败的服务层 get Oauth Profile操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应 等待 `axios.get<OAuthProfileResponse>(endpoint, {`，确保继续执行前已有结果。
    const response = await axios.get<OAuthProfileResponse>(endpoint, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-beta': OAUTH_BETA_HEADER,
      },
      params: {
        account_uuid: accountUuid,
      },
      timeout: 10000,
    })
    // 返回 `response.data`，作为服务层 get Oauth Profile这次计算的结果。
    return response.data
  } catch (error) {
    // 记录服务层 get Oauth Profile运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }
}

// getOauthProfileFromOauthToken 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getOauthProfileFromOauthToken(
  accessToken: string,
): Promise<OAuthProfileResponse | undefined> {
  // endpoint读取`getOauthConfig`，供服务层 get Oauth Profile后续处理使用。
  const endpoint = `${getOauthConfig().BASE_API_URL}/api/oauth/profile`
  // 保护这一段可能失败的服务层 get Oauth Profile操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应 等待 `axios.get<OAuthProfileResponse>(endpoint, {`，确保继续执行前已有结果。
    const response = await axios.get<OAuthProfileResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })
    // 返回 `response.data`，作为服务层 get Oauth Profile这次计算的结果。
    return response.data
  } catch (error) {
    // 记录服务层 get Oauth Profile运行诊断，方便排查异常路径或性能问题。
    logError(error as Error)
  }
}
