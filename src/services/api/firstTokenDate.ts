// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 getAuthHeaders 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { getAuthHeaders } from '../../utils/http.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'

/**
 * Fetch the user's first Claude Code token date and store in config.
 * This is called after successful login to cache when they started using Claude Code.
 */
// fetchAndStoreClaudeCodeFirstTokenDate 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchAndStoreClaudeCodeFirstTokenDate(): Promise<void> {
  // 保护这一段可能失败的API 服务 first Token Date操作，确保异常能进入相邻错误处理。
  try {
    // 配置读取`getGlobalConfig`，供API 服务 first Token Date后续处理使用。
    const config = getGlobalConfig()

    // `config.claudeCodeFirstTokenDate` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (config.claudeCodeFirstTokenDate !== undefined) {
      // API 服务 first Token Date在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // authHeaders 集合读取`getAuthHeaders`，供API 服务 first Token Date后续处理使用。
    const authHeaders = getAuthHeaders()
    // 满足 `authHeaders.error` 时，API 服务 first Token Date执行该分支。
    if (authHeaders.error) {
      // 记录API 服务 first Token Date运行诊断，方便排查异常路径或性能问题。
      logError(new Error(`Failed to get auth headers: ${authHeaders.error}`))
      // API 服务 first Token Date在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // oauthConfig 配置读取`getOauthConfig`，供API 服务 first Token Date后续处理使用。
    const oauthConfig = getOauthConfig()
    // URL固定为 ``${oauthConfig.BASE_API_URL}/api/organization/claude_code...`，作为API 服务 first Token Date后续展示或比较的基准。
    const url = `${oauthConfig.BASE_API_URL}/api/organization/claude_code_first_token_date`

    // 接口响应读取`axios.get`，供API 服务 first Token Date后续处理使用。
    const response = await axios.get(url, {
      headers: {
        ...authHeaders.headers,
        'User-Agent': getClaudeCodeUserAgent(),
      },
      timeout: 10000,
    })

    // firstTokenDate保存`response.data?.first_token_date ?? null`，供API 服务 first Token Date后续判断或输出使用。
    const firstTokenDate = response.data?.first_token_date ?? null

    // Validate the date if it's not null
    // `firstTokenDate` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (firstTokenDate !== null) {
      // dateTime记录时间`Date`，供API 服务 first Token Date后续处理使用。
      const dateTime = new Date(firstTokenDate).getTime()
      // 满足 `isNaN(dateTime)` 时，API 服务 first Token Date执行该分支。
      if (isNaN(dateTime)) {
        // 记录API 服务 first Token Date运行诊断，方便排查异常路径或性能问题。
        logError(
          new Error(
            `Received invalid first_token_date from API: ${firstTokenDate}`,
          ),
        )
        // Don't save invalid dates
        // API 服务 first Token Date在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    }

    // 调用 saveGlobalConfig，触发API 服务 first Token Date此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      claudeCodeFirstTokenDate: firstTokenDate,
    }))
  } catch (error) {
    // 记录API 服务 first Token Date运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}
