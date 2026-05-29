// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 isEqual，将 lodash-es/isEqual.js 中已经封装好的能力接到本文件流程里。
import isEqual from 'lodash-es/isEqual.js'
// 整理这一组导入，让API 服务 bootstrap后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKey,
  getClaudeAIOAuthTokens,
  hasProfileScope,
} from 'src/utils/auth.js'
// 引入 z，将 zod 中已经封装好的能力接到本文件流程里。
import { z } from 'zod'
// 引入 getOauthConfig、OAUTH_BETA_HEADER，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig, OAUTH_BETA_HEADER } from '../../constants/oauth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 withOAuth401Retry 工具函数，把通用处理留在 ../../utils/http.js 中维护。
import { withOAuth401Retry } from '../../utils/http.js'
// 复用 lazySchema 工具函数，把通用处理留在 ../../utils/lazySchema.js 中维护。
import { lazySchema } from '../../utils/lazySchema.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../../utils/model/providers.js 中维护。
import { getAPIProvider } from '../../utils/model/providers.js'
// 复用 isEssentialTrafficOnly 工具函数，把通用处理留在 ../../utils/privacyLevel.js 中维护。
import { isEssentialTrafficOnly } from '../../utils/privacyLevel.js'
// 复用 getClaudeCodeUserAgent 工具函数，把通用处理留在 ../../utils/userAgent.js 中维护。
import { getClaudeCodeUserAgent } from '../../utils/userAgent.js'

// bootstrapResponseSchema 响应数据保存`lazySchema`，供API 服务 bootstrap后续处理使用。
const bootstrapResponseSchema = lazySchema(() =>
  z.object({
    client_data: z.record(z.unknown()).nullish(),
    additional_model_options: z
      .array(
        z
          .object({
            model: z.string(),
            name: z.string(),
            description: z.string(),
          })
          // 链式调用 transform，继续加工上一行在API 服务 bootstrap中产生的数据。
          .transform(({ model, name, description }) => ({
            value: model,
            label: name,
            description,
          })),
      )
      .nullish(),
  }),
)

// BootstrapResponse 固化API 服务 bootstrap里传递的数据形状，帮助调用方按同一结构读写字段。
type BootstrapResponse = z.infer<ReturnType<typeof bootstrapResponseSchema>>

// fetchBootstrapAPI 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchBootstrapAPI(): Promise<BootstrapResponse | null> {
  // 满足 `isEssentialTrafficOnly()` 时，API 服务 bootstrap执行该分支。
  if (isEssentialTrafficOnly()) {
    // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[Bootstrap] Skipped: Nonessential traffic disabled')
    // 返回 `null`，作为API 服务 bootstrap这次计算的结果。
    return null
  }

  // `getAPIProvider()` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (getAPIProvider() !== 'firstParty') {
    // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[Bootstrap] Skipped: 3P provider')
    // 返回 `null`，作为API 服务 bootstrap这次计算的结果。
    return null
  }

  // OAuth preferred (requires user:profile scope — service-key OAuth tokens
  // lack it and would 403). Fall back to API key auth for console users.
  // API key读取`getAnthropicApiKey`，供API 服务 bootstrap后续处理使用。
  const apiKey = getAnthropicApiKey()
  // hasUsableOAuth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasUsableOAuth =
    getClaudeAIOAuthTokens()?.accessToken && hasProfileScope()
  // 组合条件 `!hasUsableOAuth && !apiKey` 成立时，API 服务 bootstrap才启用这条专门路径。
  if (!hasUsableOAuth && !apiKey) {
    // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[Bootstrap] Skipped: no usable OAuth or API key')
    // 返回 `null`，作为API 服务 bootstrap这次计算的结果。
    return null
  }

  // endpoint读取`getOauthConfig`，供API 服务 bootstrap后续处理使用。
  const endpoint = `${getOauthConfig().BASE_API_URL}/api/claude_cli/bootstrap`

  // withOAuth401Retry handles the refresh-and-retry. API key users fail
  // through on 401 (no refresh mechanism — no OAuth token to pass).
  // 保护这一段可能失败的API 服务 bootstrap操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `withOAuth401Retry(async () => {`，调用方直接接收异步结果。
    return await withOAuth401Retry(async () => {
      // Re-read OAuth each call so the retry picks up the refreshed token.
      // token读取`getClaudeAIOAuthTokens`，供API 服务 bootstrap后续处理使用。
      const token = getClaudeAIOAuthTokens()?.accessToken
      // authHeaders 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let authHeaders: Record<string, string>
      // 组合条件 `token && hasProfileScope()` 成立时，API 服务 bootstrap才启用这条专门路径。
      if (token && hasProfileScope()) {
        // authHeaders 集合更新为 `{`，确保API 服务后续读取最新状态。
        authHeaders = {
          Authorization: `Bearer ${token}`,
          'anthropic-beta': OAUTH_BETA_HEADER,
        }
      // API 服务 bootstrap在这里处理 `} else if (apiKey) {`，完成这一小步状态转换。
      } else if (apiKey) {
        // authHeaders 集合更新为 `{ 'x-api-key': apiKey }`，确保API 服务后续读取最新状态。
        authHeaders = { 'x-api-key': apiKey }
      } else {
        // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[Bootstrap] No auth available on retry, aborting')
        // 返回 `null`，作为API 服务 bootstrap这次计算的结果。
        return null
      }

      // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[Bootstrap] Fetching')
      // 接口响应 等待 `axios.get<unknown>(endpoint, {`，确保继续执行前已有结果。
      const response = await axios.get<unknown>(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': getClaudeCodeUserAgent(),
          ...authHeaders,
        },
        timeout: 5000,
      })
      // 解析结果保存`bootstrapResponseSchema`，供API 服务 bootstrap后续处理使用。
      const parsed = bootstrapResponseSchema().safeParse(response.data)
      // parsed.success 集合缺失时提前走兜底路径，避免API 服务 bootstrap继续依赖无效输入。
      if (!parsed.success) {
        // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[Bootstrap] Response failed validation: ${parsed.error.message}`,
        )
        // 返回 `null`，作为API 服务 bootstrap这次计算的结果。
        return null
      }
      // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[Bootstrap] Fetch ok')
      // 返回 `parsed.data`，作为API 服务 bootstrap这次计算的结果。
      return parsed.data
    })
  } catch (error) {
    // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `[Bootstrap] Fetch failed: ${axios.isAxiosError(error) ? (error.response?.status ?? error.code) : 'unknown'}`,
    )
    // 抛出 error，阻止API 服务 bootstrap在无效状态下继续运行。
    throw error
  }
}

/**
 * Fetch bootstrap data from the API and persist to disk cache.
 */
// fetchBootstrapData 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchBootstrapData(): Promise<void> {
  // 保护这一段可能失败的API 服务 bootstrap操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应读取`fetchBootstrapAPI`，供API 服务 bootstrap后续处理使用。
    const response = await fetchBootstrapAPI()
    // 接口响应缺失时提前走兜底路径，避免API 服务 bootstrap继续依赖无效输入。
    if (!response) return

    // clientData保存`response.client_data ?? null`，供后续判断或组装使用。
    const clientData = response.client_data ?? null
    // additionalModelOptions 集合保存`response.additional_model_options ?? []`，供后续判断或组装使用。
    const additionalModelOptions = response.additional_model_options ?? []

    // Only persist if data actually changed — avoids a config write on every startup.
    // 配置读取`getGlobalConfig`，供API 服务 bootstrap后续处理使用。
    const config = getGlobalConfig()
    // API 服务 bootstrap在这里进入条件判断，后续代码按实际状态分流。
    if (
      isEqual(config.clientDataCache, clientData) &&
      isEqual(config.additionalModelOptionsCache, additionalModelOptions)
    ) {
      // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
      logForDebugging('[Bootstrap] Cache unchanged, skipping write')
      // API 服务 bootstrap在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
    logForDebugging('[Bootstrap] Cache updated, persisting to disk')
    // 调用 saveGlobalConfig，触发API 服务 bootstrap此处需要的副作用。
    saveGlobalConfig(current => ({
      ...current,
      clientDataCache: clientData,
      additionalModelOptionsCache: additionalModelOptions,
    }))
  } catch (error) {
    // 记录API 服务 bootstrap运行诊断，方便排查异常路径或性能问题。
    logError(error)
  }
}
