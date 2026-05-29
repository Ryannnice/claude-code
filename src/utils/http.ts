/**
 * HTTP utility constants and helpers
 */

// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 OAUTH_BETA_HEADER，将 ../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { OAUTH_BETA_HEADER } from '../constants/oauth.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAnthropicApiKey,
  getClaudeAIOAuthTokens,
  handleOAuth401Error,
  isClaudeAISubscriber,
} from './auth.js'
// 引入 getClaudeCodeUserAgent，将 ./userAgent.js 中已经封装好的能力接到本文件流程里。
import { getClaudeCodeUserAgent } from './userAgent.js'
// 引入 getWorkload，将 ./workloadContext.js 中已经封装好的能力接到本文件流程里。
import { getWorkload } from './workloadContext.js'

// WARNING: We rely on `claude-cli` in the user agent for log filtering.
// Please do NOT change this without making sure that logging also gets updated!
// getUserAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getUserAgent(): string {
  // agentSdkVersion 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const agentSdkVersion = process.env.CLAUDE_AGENT_SDK_VERSION
    ? `, agent-sdk/${process.env.CLAUDE_AGENT_SDK_VERSION}`
    : ''
  // SDK consumers can identify their app/library via CLAUDE_AGENT_SDK_CLIENT_APP
  // e.g., "my-app/1.0.0" or "my-library/2.1"
  // clientApp 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP
    ? `, client-app/${process.env.CLAUDE_AGENT_SDK_CLIENT_APP}`
    : ''
  // Turn-/process-scoped workload tag for cron-initiated requests. 1P-only
  // observability — proxies strip HTTP headers; QoS routing uses cc_workload
  // in the billing-header attribution block instead (see constants/system.ts).
  // getAnthropicClient (client.ts:98) calls this per-request inside withRetry,
  // so the read picks up the same setWorkload() value as getAttributionHeader.
  // workload读取`getWorkload`，供共享工具后续处理使用。
  const workload = getWorkload()
  // workloadSuffix 命名 `workload ? `, workload/${workload}` : ''`，让后续代码直接表达这个值的用途。
  const workloadSuffix = workload ? `, workload/${workload}` : ''
  // 返回 ``claude-cli/${MACRO.VERSION} (${process.env.USER_TYPE}, ${process.env.C...`，作为共享工具这次计算的结果。
  return `claude-cli/${MACRO.VERSION} (${process.env.USER_TYPE}, ${process.env.CLAUDE_CODE_ENTRYPOINT ?? 'cli'}${agentSdkVersion}${clientApp}${workloadSuffix})`
}

// getMCPUserAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMCPUserAgent(): string {
  // 片段列表 从空数组开始收集，后续循环会按处理顺序追加条目。
  const parts: string[] = []
  // 满足 `process.env.CLAUDE_CODE_ENTRYPOINT` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_ENTRYPOINT) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(process.env.CLAUDE_CODE_ENTRYPOINT)
  }
  // 满足 `process.env.CLAUDE_AGENT_SDK_VERSION` 时，共享工具执行该分支。
  if (process.env.CLAUDE_AGENT_SDK_VERSION) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`agent-sdk/${process.env.CLAUDE_AGENT_SDK_VERSION}`)
  }
  // 满足 `process.env.CLAUDE_AGENT_SDK_CLIENT_APP` 时，共享工具执行该分支。
  if (process.env.CLAUDE_AGENT_SDK_CLIENT_APP) {
    // 片段列表追加新条目，保持收集顺序与输入顺序一致。
    parts.push(`client-app/${process.env.CLAUDE_AGENT_SDK_CLIENT_APP}`)
  }
  // suffix格式化`parts.join`，供共享工具后续处理使用。
  const suffix = parts.length > 0 ? ` (${parts.join(', ')})` : ''
  // 返回 ``claude-code/${MACRO.VERSION}${suffix}``，作为共享工具这次计算的结果。
  return `claude-code/${MACRO.VERSION}${suffix}`
}

// User-Agent for WebFetch requests to arbitrary sites. `Claude-User` is
// Anthropic's publicly documented agent for user-initiated fetches (what site
// operators match in robots.txt); the claude-code suffix lets them distinguish
// local CLI traffic from claude.ai server-side fetches.
// getWebFetchUserAgent 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getWebFetchUserAgent(): string {
  // 返回 ``Claude-User (${getClaudeCodeUserAgent()}; +https://support.anthropic.c...`，作为共享工具这次计算的结果。
  return `Claude-User (${getClaudeCodeUserAgent()}; +https://support.anthropic.com/)`
}

// AuthHeaders 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type AuthHeaders = {
  headers: Record<string, string>
  error?: string
}

/**
 * Get authentication headers for API requests
 * Returns either OAuth headers for Max/Pro users or API key headers for regular users
 */
// getAuthHeaders 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAuthHeaders(): AuthHeaders {
  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // oauthTokens 集合读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
    const oauthTokens = getClaudeAIOAuthTokens()
    // 满足 `!oauthTokens?.accessToken` 时，共享工具执行该分支。
    if (!oauthTokens?.accessToken) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        headers: {},
        error: 'No OAuth token available',
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      headers: {
        Authorization: `Bearer ${oauthTokens.accessToken}`,
        'anthropic-beta': OAUTH_BETA_HEADER,
      },
    }
  }
  // TODO: this will fail if the API key is being set to an LLM Gateway key
  // should we try to query keychain / credentials for a valid Anthropic key?
  // API key读取`getAnthropicApiKey`，供共享工具后续处理使用。
  const apiKey = getAnthropicApiKey()
  // API key缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!apiKey) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      headers: {},
      error: 'No API key available',
    }
  }
  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    headers: {
      'x-api-key': apiKey,
    },
  }
}

/**
 * Wrapper that handles OAuth 401 errors by force-refreshing the token and
 * retrying once. Addresses clock drift scenarios where the local expiration
 * check disagrees with the server.
 *
 * The request closure is called again on retry, so it should re-read auth
 * (e.g., via getAuthHeaders()) to pick up the refreshed token.
 *
 * Note: bridgeApi.ts has its own DI-injected version — handleOAuth401Error
 * transitively pulls in config.ts (~1300 modules), which breaks the SDK bundle.
 *
 * @param opts.also403Revoked - Also retry on 403 with "OAuth token has been
 *   revoked" body (some endpoints signal revocation this way instead of 401).
 */
// withOAuth401Retry 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function withOAuth401Retry<T>(
  // 这个回调绑定到 request: () => Promise<T>,，负责共享工具在该局部场景下的响应。
  request: () => Promise<T>,
  opts?: { also403Revoked?: boolean },
): Promise<T> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待并返回 `request()`，调用方直接接收异步结果。
    return await request()
  } catch (err) {
    // 满足 `!axios.isAxiosError(err)` 时，共享工具执行该分支。
    if (!axios.isAxiosError(err)) throw err
    // status 集合保存`err.response?.status`，供后续判断或组装使用。
    const status = err.response?.status
    // isAuthError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isAuthError =
      status === 401 ||
      (opts?.also403Revoked &&
        status === 403 &&
        typeof err.response?.data === 'string' &&
        err.response.data.includes('OAuth token has been revoked'))
    // isAuthError 错误信息缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!isAuthError) throw err
    // failedAccessToken读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
    const failedAccessToken = getClaudeAIOAuthTokens()?.accessToken
    // failedAccessToken缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!failedAccessToken) throw err
    // 等待 `handleOAuth401Error(failedAccessToken)` 完成，再继续共享工具 http的异步流程。
    await handleOAuth401Error(failedAccessToken)
    // 等待并返回 `request()`，调用方直接接收异步结果。
    return await request()
  }
}
