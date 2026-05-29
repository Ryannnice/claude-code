// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 引入 getOauthConfig，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from 'src/constants/oauth.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 复用 getClaudeAIOAuthTokens 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { getClaudeAIOAuthTokens } from 'src/utils/auth.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 src/utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from 'src/utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 isEnvDefinedFalsy 工具函数，把通用处理留在 src/utils/envUtils.js 中维护。
import { isEnvDefinedFalsy } from 'src/utils/envUtils.js'
// 引入 clearMcpAuthCache，将 ./client.js 中已经封装好的能力接到本文件流程里。
import { clearMcpAuthCache } from './client.js'
// 引入 normalizeNameForMCP，将 ./normalization.js 中已经封装好的能力接到本文件流程里。
import { normalizeNameForMCP } from './normalization.js'
// 类型依赖 { ScopedMcpServerConfig } 来自 ./types.js，用于校准MCP 服务的数据契约。
import type { ScopedMcpServerConfig } from './types.js'

// ClaudeAIMcpServer 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type ClaudeAIMcpServer = {
  type: 'mcp_server'
  id: string
  display_name: string
  url: string
  created_at: string
}

// ClaudeAIMcpServersResponse 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type ClaudeAIMcpServersResponse = {
  data: ClaudeAIMcpServer[]
  has_more: boolean
  next_page: string | null
}

// FETCH_TIMEOUT_MS 集合 命名 `5000`，让后续代码直接表达这个值的用途。
const FETCH_TIMEOUT_MS = 5000
// MCP_SERVERS_BETA_HEADER固定为 `'mcp-servers-2025-12-04'`，作为MCP 服务MCP 服务 claudeai后续展示或比较的基准。
const MCP_SERVERS_BETA_HEADER = 'mcp-servers-2025-12-04'

/**
 * Fetches MCP server configurations from Claude.ai org configs.
 * These servers are managed by the organization via Claude.ai.
 *
 * Results are memoized for the session lifetime (fetch once per CLI session).
 */
// fetchClaudeAIMcpConfigsIfEligible 配置保存`memoize`，供MCP 服务后续处理使用。
export const fetchClaudeAIMcpConfigsIfEligible = memoize(
  async (): Promise<Record<string, ScopedMcpServerConfig>> => {
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // 满足 `isEnvDefinedFalsy(process.env.ENABLE_CLAUDEAI_MCP_SERVERS)` 时，MCP 服务执行该分支。
      if (isEnvDefinedFalsy(process.env.ENABLE_CLAUDEAI_MCP_SERVERS)) {
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[claudeai-mcp] Disabled via env var')
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_claudeai_mcp_eligibility', {
          state:
            'disabled_env_var' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {}
      }

      // token 列表读取`getClaudeAIOAuthTokens`，供MCP 服务后续处理使用。
      const tokens = getClaudeAIOAuthTokens()
      // 满足 `!tokens?.accessToken` 时，MCP 服务执行该分支。
      if (!tokens?.accessToken) {
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logForDebugging('[claudeai-mcp] No access token')
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_claudeai_mcp_eligibility', {
          state:
            'no_oauth_token' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {}
      }

      // Check for user:mcp_servers scope directly instead of isClaudeAISubscriber().
      // In non-interactive mode, isClaudeAISubscriber() returns false when ANTHROPIC_API_KEY
      // is set (even with valid OAuth tokens) because preferThirdPartyAuthentication() causes
      // isAnthropicAuthEnabled() to return false. Checking the scope directly allows users
      // with both API keys and OAuth tokens to access claude.ai MCPs in print mode.
      // 满足 `!tokens.scopes?.includes('user:mcp_servers')` 时，MCP 服务执行该分支。
      if (!tokens.scopes?.includes('user:mcp_servers')) {
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[claudeai-mcp] Missing user:mcp_servers scope (scopes=${tokens.scopes?.join(',') || 'none'})`,
        )
        // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_claudeai_mcp_eligibility', {
          state:
            'missing_scope' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
        return {}
      }

      // baseUrl读取`getOauthConfig`，供MCP 服务后续处理使用。
      const baseUrl = getOauthConfig().BASE_API_URL
      // URL 命名 ``${baseUrl}/v1/mcp_servers?limit=1000``，让后续代码直接表达这个值的用途。
      const url = `${baseUrl}/v1/mcp_servers?limit=1000`

      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[claudeai-mcp] Fetching from ${url}`)

      // 接口响应 等待 `axios.get<ClaudeAIMcpServersResponse>(url, {`，确保继续执行前已有结果。
      const response = await axios.get<ClaudeAIMcpServersResponse>(url, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
          'anthropic-beta': MCP_SERVERS_BETA_HEADER,
          'anthropic-version': '2023-06-01',
        },
        timeout: FETCH_TIMEOUT_MS,
      })

      // configs 配置 从空对象开始收集键值，后续按名称补齐内容。
      const configs: Record<string, ScopedMcpServerConfig> = {}
      // Track used normalized names to detect collisions and assign (2), (3), etc. suffixes.
      // We check the final normalized name (including suffix) to handle edge cases where
      // a suffixed name collides with another server's base name (e.g., "Example Server 2"
      // colliding with "Example Server! (2)" which both normalize to claude_ai_Example_Server_2).
      // usedNormalizedNames 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
      const usedNormalizedNames = new Set<string>()

      // 按顺序遍历 `response.data.data` 中的server，逐个交给MCP 服务处理。
      for (const server of response.data.data) {
        // baseName保存``claude.ai ${server.display_name}``，作为后续固定文本处理的输入。
        const baseName = `claude.ai ${server.display_name}`

        // Try without suffix first, then increment until we find an unused normalized name
        // finalName 命名 `baseName`，让后续代码直接表达这个值的用途。
        let finalName = baseName
        // finalNormalized保存`normalizeNameForMCP`，供MCP 服务后续处理使用。
        let finalNormalized = normalizeNameForMCP(finalName)
        // count 数量 命名 `1`，让后续代码直接表达这个值的用途。
        let count = 1
        // 只要 usedNormalizedNames.has(finalNormalized) 成立，就持续推进MCP 服务中的循环处理。
        while (usedNormalizedNames.has(finalNormalized)) {
          // MCP 服务 claudeai在这里处理 `count++`，完成这一小步状态转换。
          count++
          // finalName更新为 ``${baseName} (${count})``，确保MCP 服务后续读取最新状态。
          finalName = `${baseName} (${count})`
          // finalNormalized更新为 `normalizeNameForMCP(finalName)`，确保MCP 服务后续读取最新状态。
          finalNormalized = normalizeNameForMCP(finalName)
        }
        // 调用 usedNormalizedNames.add，触发MCP 服务此处需要的副作用。
        usedNormalizedNames.add(finalNormalized)

        // configs[finalName 配置更新为 `{`，确保MCP 服务 claudeai后续读取最新状态。
        configs[finalName] = {
          type: 'claudeai-proxy',
          url: server.url,
          id: server.id,
          scope: 'claudeai',
        }
      }

      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[claudeai-mcp] Fetched ${Object.keys(configs).length} servers`,
      )
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_claudeai_mcp_eligibility', {
        state:
          'eligible' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 返回 `configs`，作为MCP 服务这次计算的结果。
      return configs
    } catch {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`[claudeai-mcp] Fetch failed`)
      // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
      return {}
    }
  },
)

/**
 * Clears the memoized cache for fetchClaudeAIMcpConfigsIfEligible.
 * Call this after login so the next fetch will use the new auth tokens.
 */
// clearClaudeAIMcpConfigsCache 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearClaudeAIMcpConfigsCache(): void {
  // 调用 fetchClaudeAIMcpConfigsIfEligible.cache.clear?.()，完成这一处局部操作。
  fetchClaudeAIMcpConfigsIfEligible.cache.clear?.()
  // Also clear the auth cache so freshly-authorized servers get re-connected
  // 清理相关缓存，确保MCP 服务下一次读取时重新加载最新数据。
  clearMcpAuthCache()
}

/**
 * Record that a claude.ai connector successfully connected. Idempotent.
 *
 * Gates the "N connectors unavailable/need auth" startup notifications: a
 * connector that was working yesterday and is now failed is a state change
 * worth surfacing; an org-configured connector that's been needs-auth since
 * it showed up is one the user has demonstrably ignored.
 */
// markClaudeAiMcpConnected 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function markClaudeAiMcpConnected(name: string): void {
  // 调用 saveGlobalConfig，触发MCP 服务此处需要的副作用。
  saveGlobalConfig(current => {
    // seen保存`current.claudeAiMcpEverConnected ?? []`，供后续判断或组装使用。
    const seen = current.claudeAiMcpEverConnected ?? []
    // 满足 `seen.includes(name)` 时，MCP 服务执行该分支。
    if (seen.includes(name)) return current
    // 返回结构化结果，集中表达MCP 服务已经整理出的状态。
    return { ...current, claudeAiMcpEverConnected: [...seen, name] }
  })
}

// hasClaudeAiMcpEverConnected 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasClaudeAiMcpEverConnected(name: string): boolean {
  // 返回 `(getGlobalConfig().claudeAiMcpEverConnected ?? []).includes(name)`，作为MCP 服务这次计算的结果。
  return (getGlobalConfig().claudeAiMcpEverConnected ?? []).includes(name)
}
