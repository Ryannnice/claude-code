// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  discoverAuthorizationServerMetadata,
  discoverOAuthServerInfo,
  type OAuthClientProvider,
  type OAuthDiscoveryState,
  auth as sdkAuth,
  refreshAuthorization as sdkRefreshAuthorization,
} from '@modelcontextprotocol/sdk/client/auth.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  InvalidGrantError,
  OAuthError,
  ServerError,
  TemporarilyUnavailableError,
  TooManyRequestsError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  type AuthorizationServerMetadata,
  type OAuthClientInformation,
  type OAuthClientInformationFull,
  type OAuthClientMetadata,
  OAuthErrorResponseSchema,
  OAuthMetadataSchema,
  type OAuthTokens,
  OAuthTokensSchema,
} from '@modelcontextprotocol/sdk/shared/auth.js'
// 类型依赖 { FetchLike } 来自 @modelcontextprotocol/sdk/shared/transport.js，用于校准MCP 服务的数据契约。
import type { FetchLike } from '@modelcontextprotocol/sdk/shared/transport.js'
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { createHash, randomBytes, randomUUID } from 'crypto'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir } from 'fs/promises'
// 引入 createServer、Server，将 http 中已经封装好的能力接到本文件流程里。
import { createServer, type Server } from 'http'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 parse，将 url 中已经封装好的能力接到本文件流程里。
import { parse } from 'url'
// 引入 xss，将 xss 中已经封装好的能力接到本文件流程里。
import xss from 'xss'
// 引入 MCP_CLIENT_METADATA_URL，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { MCP_CLIENT_METADATA_URL } from '../../constants/oauth.js'
// 复用 openBrowser 工具函数，把通用处理留在 ../../utils/browser.js 中维护。
import { openBrowser } from '../../utils/browser.js'
// 复用 getClaudeConfigHomeDir 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js'
// 复用 errorMessage、getErrnoCode 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage, getErrnoCode } from '../../utils/errors.js'
// 复用 * as lockfile 工具函数，把通用处理留在 ../../utils/lockfile.js 中维护。
import * as lockfile from '../../utils/lockfile.js'
// 复用 logMCPDebug 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logMCPDebug } from '../../utils/log.js'
// 复用 getPlatform 工具函数，把通用处理留在 ../../utils/platform.js 中维护。
import { getPlatform } from '../../utils/platform.js'
// 复用 getSecureStorage 工具函数，把通用处理留在 ../../utils/secureStorage/index.js 中维护。
import { getSecureStorage } from '../../utils/secureStorage/index.js'
// 复用 clearKeychainCache 工具函数，把通用处理留在 ../../utils/secureStorage/macOsKeychainHelpers.js 中维护。
import { clearKeychainCache } from '../../utils/secureStorage/macOsKeychainHelpers.js'
// 类型依赖 { SecureStorageData } 来自 ../../utils/secureStorage/types.js，用于校准MCP 服务的数据契约。
import type { SecureStorageData } from '../../utils/secureStorage/types.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 复用 jsonParse、jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonParse, jsonStringify } from '../../utils/slowOperations.js'
// 引入 logEvent，将 ../analytics/index.js 中已经封装好的能力接到本文件流程里。
import { logEvent } from '../analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../analytics/metadata.js，用于校准MCP 服务的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../analytics/metadata.js'
// 引入 buildRedirectUri、findAvailablePort，将 ./oauthPort.js 中已经封装好的能力接到本文件流程里。
import { buildRedirectUri, findAvailablePort } from './oauthPort.js'
// 类型依赖 { McpHTTPServerConfig, McpSSEServerConfig } 来自 ./types.js，用于校准MCP 服务的数据契约。
import type { McpHTTPServerConfig, McpSSEServerConfig } from './types.js'
// 引入 getLoggingSafeMcpBaseUrl，将 ./utils.js 中已经封装好的能力接到本文件流程里。
import { getLoggingSafeMcpBaseUrl } from './utils.js'
// 引入 performCrossAppAccess、XaaTokenExchangeError，将 ./xaa.js 中已经封装好的能力接到本文件流程里。
import { performCrossAppAccess, XaaTokenExchangeError } from './xaa.js'
// 整理这一组导入，让MCP 服务后续逻辑可以直接复用这些外部能力。
import {
  acquireIdpIdToken,
  clearIdpIdToken,
  discoverOidc,
  getCachedIdpIdToken,
  getIdpClientSecret,
  getXaaIdpSettings,
  isXaaEnabled,
} from './xaaIdpLogin.js'

/**
 * Timeout for individual OAuth requests (metadata discovery, token refresh, etc.)
 */
// AUTH_REQUEST_TIMEOUT_MS 请求数据 命名 `30000`，让后续代码直接表达这个值的用途。
const AUTH_REQUEST_TIMEOUT_MS = 30000

/**
 * Failure reasons for the `tengu_mcp_oauth_refresh_failure` event. Values
 * are emitted to analytics — keep them stable (do not rename; add new ones).
 */
// MCPRefreshFailureReason 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type MCPRefreshFailureReason =
  | 'metadata_discovery_failed'
  | 'no_client_info'
  | 'no_tokens_returned'
  | 'invalid_grant'
  | 'transient_retries_exhausted'
  | 'request_failed'

/**
 * Failure reasons for the `tengu_mcp_oauth_flow_error` event. Values are
 * emitted to analytics for attribution in BigQuery. Keep stable (do not
 * rename; add new ones).
 */
// MCPOAuthFlowErrorReason 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type MCPOAuthFlowErrorReason =
  | 'cancelled'
  | 'timeout'
  | 'provider_denied'
  | 'state_mismatch'
  | 'port_unavailable'
  | 'sdk_auth_failed'
  | 'token_exchange_failed'
  | 'unknown'

// MAX_LOCK_RETRIES 集合保存`5`，供后续判断或组装使用。
const MAX_LOCK_RETRIES = 5

/**
 * OAuth query parameters that should be redacted from logs.
 * These contain sensitive values that could enable CSRF or session fixation attacks.
 */
// SENSITIVE_OAUTH_PARAMS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const SENSITIVE_OAUTH_PARAMS = [
  'state',
  'nonce',
  'code_challenge',
  'code_verifier',
  'code',
]

/**
 * Redacts sensitive OAuth query parameters from a URL for safe logging.
 * Prevents exposure of state, nonce, code_challenge, code_verifier, and authorization codes.
 */
// redactSensitiveUrlParams 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function redactSensitiveUrlParams(url: string): string {
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // parsedUrl保存`URL`，供MCP 服务后续处理使用。
    const parsedUrl = new URL(url)
    // 按顺序遍历 `SENSITIVE_OAUTH_PARAMS` 中的param，逐个交给MCP 服务处理。
    for (const param of SENSITIVE_OAUTH_PARAMS) {
      // 满足 `parsedUrl.searchParams.has(param)` 时，MCP 服务执行该分支。
      if (parsedUrl.searchParams.has(param)) {
        // parsedUrl.searchParams.set 写入新的状态值，使MCP 服务后续读取保持一致。
        parsedUrl.searchParams.set(param, '[REDACTED]')
      }
    }
    // 返回 `parsedUrl.toString()`，作为MCP 服务这次计算的结果。
    return parsedUrl.toString()
  } catch {
    // Return as-is if not a valid URL
    // 返回 `url`，作为MCP 服务这次计算的结果。
    return url
  }
}

/**
 * Some OAuth servers (notably Slack) return HTTP 200 for all responses,
 * signaling errors via the JSON body instead. The SDK's executeTokenRequest
 * only calls parseErrorResponse when !response.ok, so a 200 with
 * {"error":"invalid_grant"} gets fed to OAuthTokensSchema.parse() and
 * surfaces as a ZodError — which the refresh retry/invalidation logic
 * treats as opaque request_failed instead of invalid_grant.
 *
 * This wrapper peeks at 2xx POST response bodies and rewrites ones that
 * match OAuthErrorResponseSchema (but not OAuthTokensSchema) to a 400
 * Response, so the SDK's normal error-class mapping applies. The same
 * fetchFn is also used for DCR POSTs, but DCR success responses have no
 * {error: string} field so they don't match the rewrite condition.
 *
 * Slack uses non-standard error codes (invalid_refresh_token observed live
 * at oauth.v2.user.access; expired_refresh_token/token_expired per Slack's
 * token rotation docs) where RFC 6749 specifies invalid_grant. We normalize
 * those so OAUTH_ERRORS['invalid_grant'] → InvalidGrantError matches and
 * token invalidation fires correctly.
 */
// NONSTANDARD_INVALID_GRANT_ALIASES 集合保存`Set`，供MCP 服务后续处理使用。
const NONSTANDARD_INVALID_GRANT_ALIASES = new Set([
  'invalid_refresh_token',
  'expired_refresh_token',
  'token_expired',
])

/* eslint-disable eslint-plugin-n/no-unsupported-features/node-builtins --
 * Response has been stable in Node since 18; the rule flags it as
 * experimental-until-21 which is incorrect. Pattern matches existing
 * createAuthFetch suppressions in this file. */
// normalizeOAuthErrorBody 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function normalizeOAuthErrorBody(
  response: Response,
): Promise<Response> {
  // response.ok 响应数据缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!response.ok) {
    // 返回 `response`，作为MCP 服务这次计算的结果。
    return response
  }
  // 文本保存`response.text`，供MCP 服务后续处理使用。
  const text = await response.text()
  // 解析结果 先占位，稍后的条件分支会根据实际输入补齐它。
  let parsed: unknown
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 解析结果更新为 `jsonParse(text)`，确保MCP 服务后续读取最新状态。
    parsed = jsonParse(text)
  } catch {
    // 返回 `new Response(text, response)`，作为MCP 服务这次计算的结果。
    return new Response(text, response)
  }
  // 满足 `OAuthTokensSchema.safeParse(parsed).success` 时，MCP 服务执行该分支。
  if (OAuthTokensSchema.safeParse(parsed).success) {
    // 返回 `new Response(text, response)`，作为MCP 服务这次计算的结果。
    return new Response(text, response)
  }
  // 结果保存`OAuthErrorResponseSchema.safeParse`，供MCP 服务后续处理使用。
  const result = OAuthErrorResponseSchema.safeParse(parsed)
  // result.success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!result.success) {
    // 返回 `new Response(text, response)`，作为MCP 服务这次计算的结果。
    return new Response(text, response)
  }
  // normalized保存`NONSTANDARD_INVALID_GRANT_ALIASES.has`，供MCP 服务后续处理使用。
  const normalized = NONSTANDARD_INVALID_GRANT_ALIASES.has(result.data.error)
    ? {
        error: 'invalid_grant',
        error_description:
          result.data.error_description ??
          `Server returned non-standard error code: ${result.data.error}`,
      }
    : result.data
  // 返回 `new Response(jsonStringify(normalized), {`，作为MCP 服务这次计算的结果。
  return new Response(jsonStringify(normalized), {
    status: 400,
    statusText: 'Bad Request',
    headers: response.headers,
  })
}
/* eslint-enable eslint-plugin-n/no-unsupported-features/node-builtins */

/**
 * Creates a fetch function with a fresh 30-second timeout for each OAuth request.
 * Used by ClaudeAuthProvider for metadata discovery and token refresh.
 * Prevents stale timeout signals from affecting auth operations.
 */
// createAuthFetch 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createAuthFetch(): FetchLike {
  // 返回 `async (url: string | URL, init?: RequestInit) => {`，作为MCP 服务这次计算的结果。
  return async (url: string | URL, init?: RequestInit) => {
    // timeoutSignal保存`AbortSignal.timeout`，供MCP 服务后续处理使用。
    const timeoutSignal = AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS)
    // isPost记录 `toUpperCase` 是否成立，MCP 服务随后按该结果分支。
    const isPost = init?.method?.toUpperCase() === 'POST'

    // No existing signal - just use timeout
    // 满足 `!init?.signal` 时，MCP 服务执行该分支。
    if (!init?.signal) {
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 接口响应读取`fetch`，供MCP 服务后续处理使用。
      const response = await fetch(url, { ...init, signal: timeoutSignal })
      // 返回 `isPost ? normalizeOAuthErrorBody(response) : response`，作为MCP 服务这次计算的结果。
      return isPost ? normalizeOAuthErrorBody(response) : response
    }

    // Combine signals: abort when either fires
    // controller保存`AbortController`，供MCP 服务后续处理使用。
    const controller = new AbortController()
    // abort保存`controller.abort`，供MCP 服务后续处理使用。
    const abort = () => controller.abort()

    // 调用 init.signal.addEventListener，触发MCP 服务此处需要的副作用。
    init.signal.addEventListener('abort', abort)
    // 调用 timeoutSignal.addEventListener，触发MCP 服务此处需要的副作用。
    timeoutSignal.addEventListener('abort', abort)

    // Cleanup to prevent event listener leaks after fetch completes
    // cleanup封装成回调，供MCP 服务MCP 服务 auth在事件触发或异步步骤中调用。
    const cleanup = () => {
      // 调用 init.signal?.removeEventListener('abort', abort)，完成这一处局部操作。
      init.signal?.removeEventListener('abort', abort)
      // 调用 timeoutSignal.removeEventListener，触发MCP 服务此处需要的副作用。
      timeoutSignal.removeEventListener('abort', abort)
    }

    // 满足 `init.signal.aborted` 时，MCP 服务执行该分支。
    if (init.signal.aborted) {
      // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
      controller.abort()
    }

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // 接口响应读取`fetch`，供MCP 服务后续处理使用。
      const response = await fetch(url, { ...init, signal: controller.signal })
      // 调用 cleanup，触发MCP 服务此处需要的副作用。
      cleanup()
      // 返回 `isPost ? normalizeOAuthErrorBody(response) : response`，作为MCP 服务这次计算的结果。
      return isPost ? normalizeOAuthErrorBody(response) : response
    } catch (error) {
      // 调用 cleanup，触发MCP 服务此处需要的副作用。
      cleanup()
      // 抛出 error，阻止MCP 服务在无效状态下继续运行。
      throw error
    }
  }
}

/**
 * Fetches authorization server metadata, using a configured metadata URL if available,
 * otherwise performing RFC 9728 → RFC 8414 discovery via the SDK.
 *
 * Discovery order when no configured URL:
 * 1. RFC 9728: probe /.well-known/oauth-protected-resource on the MCP server,
 *    read authorization_servers[0], then RFC 8414 against that URL.
 * 2. Fallback: RFC 8414 directly against the MCP server URL (path-aware). Covers
 *    legacy servers that co-host auth metadata at /.well-known/oauth-authorization-server/{path}
 *    without implementing RFC 9728. The SDK's own fallback strips the path, so this
 *    preserves the pre-existing path-aware probe for backward compatibility.
 *
 * Note: configuredMetadataUrl is user-controlled via .mcp.json. Project-scoped MCP
 * servers require user approval before connecting (same trust level as the MCP server
 * URL itself). The HTTPS requirement here is defense-in-depth beyond schema validation
 * — RFC 8414 mandates OAuth metadata retrieval over TLS.
 */
// fetchAuthServerMetadata 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function fetchAuthServerMetadata(
  serverName: string,
  serverUrl: string,
  configuredMetadataUrl: string | undefined,
  fetchFn?: FetchLike,
  resourceMetadataUrl?: URL,
): Promise<Awaited<ReturnType<typeof discoverAuthorizationServerMetadata>>> {
  // 满足 `configuredMetadataUrl` 时，MCP 服务执行该分支。
  if (configuredMetadataUrl) {
    // 满足 `!configuredMetadataUrl.startsWith('https://')` 时，MCP 服务执行该分支。
    if (!configuredMetadataUrl.startsWith('https://')) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        `authServerMetadataUrl must use https:// (got: ${configuredMetadataUrl})`,
      )
    }
    // authFetch构建`createAuthFetch`，供MCP 服务后续处理使用。
    const authFetch = fetchFn ?? createAuthFetch()
    // 接口响应保存`authFetch`，供MCP 服务后续处理使用。
    const response = await authFetch(configuredMetadataUrl, {
      headers: { Accept: 'application/json' },
    })
    // 满足 `response.ok` 时，MCP 服务执行该分支。
    if (response.ok) {
      // 返回 `OAuthMetadataSchema.parse(await response.json())`，作为MCP 服务这次计算的结果。
      return OAuthMetadataSchema.parse(await response.json())
    }
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `HTTP ${response.status} fetching configured auth server metadata from ${configuredMetadataUrl}`,
    )
  }

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await discoverOAuthServerInfo(` 解构 authorizationServerMetadata，减少MCP 服务 auth对同一对象的重复访问。
    const { authorizationServerMetadata } = await discoverOAuthServerInfo(
      serverUrl,
      {
        ...(fetchFn && { fetchFn }),
        ...(resourceMetadataUrl && { resourceMetadataUrl }),
      },
    )
    // 满足 `authorizationServerMetadata` 时，MCP 服务执行该分支。
    if (authorizationServerMetadata) {
      // 返回 `authorizationServerMetadata`，作为MCP 服务这次计算的结果。
      return authorizationServerMetadata
    }
  } catch (err) {
    // Any error from the RFC 9728 → RFC 8414 chain (5xx from the root or
    // resolved-AS probe, schema parse failure, network error) — fall through
    // to the legacy path-aware retry.
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(
      serverName,
      `RFC 9728 discovery failed, falling back: ${errorMessage(err)}`,
    )
  }

  // Fallback only when the URL has a path component; for root URLs the SDK's
  // own fallback already probed the same endpoints.
  // URL保存`URL`，供MCP 服务后续处理使用。
  const url = new URL(serverUrl)
  // 当 `url.pathname` 匹配 `'/'` 时，MCP 服务执行对应分支。
  if (url.pathname === '/') {
    // 返回 `undefined`，作为MCP 服务这次计算的结果。
    return undefined
  }
  // 返回 `discoverAuthorizationServerMetadata(url, {`，作为MCP 服务这次计算的结果。
  return discoverAuthorizationServerMetadata(url, {
    ...(fetchFn && { fetchFn }),
  })
}

// AuthenticationCancelledError 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class AuthenticationCancelledError extends Error {
  // 构造函数接收 无，把外部输入整理成实例可复用的内部状态。
  constructor() {
    // 调用 super，触发MCP 服务此处需要的副作用。
    super('Authentication was cancelled')
    // 更新实例字段 name 为 'AuthenticationCancelledError'，同步MCP 服务的内部状态。
    this.name = 'AuthenticationCancelledError'
  }
}

/**
 * Generates a unique key for server credentials based on both name and config hash
 * This prevents credentials from being reused across different servers
 * with the same name or different configurations
 */
// getServerKey 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getServerKey(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
): string {
  // configJson 配置保存`jsonStringify`，供MCP 服务后续处理使用。
  const configJson = jsonStringify({
    type: serverConfig.type,
    url: serverConfig.url,
    headers: serverConfig.headers || {},
  })

  // hash构建`createHash`，供MCP 服务后续处理使用。
  const hash = createHash('sha256')
    .update(configJson)
    .digest('hex')
    .substring(0, 16)

  // 返回 ``${serverName}|${hash}``，作为MCP 服务这次计算的结果。
  return `${serverName}|${hash}`
}

/**
 * True when we have probed this server before (OAuth discovery state is
 * stored) but hold no credentials to try. A connection attempt in this
 * state is guaranteed to 401 — the only way out is the user running
 * /mcp to authenticate.
 */
// hasMcpDiscoveryButNoToken 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasMcpDiscoveryButNoToken(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
): boolean {
  // XAA servers can silently re-auth via cached id_token even without an
  // access/refresh token — tokens() fires the xaaRefresh path. Skipping the
  // connection here would make that auto-auth branch unreachable after
  // invalidateCredentials('tokens') clears the stored tokens.
  // 组合条件 `isXaaEnabled() && serverConfig.oauth?.xaa` 成立时，MCP 服务才启用这条专门路径。
  if (isXaaEnabled() && serverConfig.oauth?.xaa) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // entry读取`getSecureStorage`，供MCP 服务后续处理使用。
  const entry = getSecureStorage().read()?.mcpOAuth?.[serverKey]
  // 返回 `entry !== undefined && !entry.accessToken && !entry.refreshToken`，作为MCP 服务这次计算的结果。
  return entry !== undefined && !entry.accessToken && !entry.refreshToken
}

/**
 * Revokes a single token on the OAuth server.
 *
 * Per RFC 7009, public clients (like Claude Code) should authenticate by including
 * client_id in the request body, NOT via an Authorization header. The Bearer token
 * in an Authorization header is meant for resource owner authentication, not client
 * authentication.
 *
 * However, the MCP spec doesn't explicitly define token revocation behavior, so some
 * servers may not be RFC 7009 compliant. As defensive programming, we:
 * 1. First try the RFC 7009 compliant approach (client_id in body, no Authorization header)
 * 2. If we get a 401, retry with Bearer auth as a fallback for non-compliant servers
 *
 * This fallback should rarely be needed - most servers either accept the compliant
 * approach or ignore unexpected headers.
 */
// revokeToken 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function revokeToken({
  serverName,
  endpoint,
  token,
  tokenTypeHint,
  clientId,
  clientSecret,
  accessToken,
  authMethod = 'client_secret_basic',
}: {
  serverName: string
  endpoint: string
  token: string
  tokenTypeHint: 'access_token' | 'refresh_token'
  clientId?: string
  clientSecret?: string
  accessToken?: string
  authMethod?: 'client_secret_basic' | 'client_secret_post'
}): Promise<void> {
  // params 集合保存`URLSearchParams`，供MCP 服务后续处理使用。
  const params = new URLSearchParams()
  // params.set 写入新的状态值，使MCP 服务后续读取保持一致。
  params.set('token', token)
  // params.set 写入新的状态值，使MCP 服务后续读取保持一致。
  params.set('token_type_hint', tokenTypeHint)

  // 请求头 集中保存MCP 服务 auth要一起传递的字段。
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  // RFC 7009 §2.1 requires client auth per RFC 6749 §2.3. XAA always uses a
  // confidential client at the AS — strict ASes (Okta/Stytch) reject public-
  // client revocation of confidential-client tokens.
  // 组合条件 `clientId && clientSecret` 成立时，MCP 服务才启用这条专门路径。
  if (clientId && clientSecret) {
    // 当 `authMethod` 匹配 `'client_secret_post'` 时，MCP 服务执行对应分支。
    if (authMethod === 'client_secret_post') {
      // params.set 写入新的状态值，使MCP 服务后续读取保持一致。
      params.set('client_id', clientId)
      // params.set 写入新的状态值，使MCP 服务后续读取保持一致。
      params.set('client_secret', clientSecret)
    } else {
      // basic保存`Buffer.from`，供MCP 服务后续处理使用。
      const basic = Buffer.from(
        `${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`,
      ).toString('base64')
      // Authorization更新为 ``Basic ${basic}``，确保MCP 服务后续读取最新状态。
      headers.Authorization = `Basic ${basic}`
    }
  // MCP 服务 auth在这里处理 `} else if (clientId) {`，完成这一小步状态转换。
  } else if (clientId) {
    // params.set 写入新的状态值，使MCP 服务后续读取保持一致。
    params.set('client_id', clientId)
  } else {
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(
      serverName,
      `No client_id available for ${tokenTypeHint} revocation - server may reject`,
    )
  }

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `axios.post(endpoint, params, { headers })` 完成，再继续MCP 服务 auth的异步流程。
    await axios.post(endpoint, params, { headers })
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, `Successfully revoked ${tokenTypeHint}`)
  } catch (error: unknown) {
    // Fallback for non-RFC-7009-compliant servers that require Bearer auth
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      accessToken
    ) {
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Got 401, retrying ${tokenTypeHint} revocation with Bearer auth`,
      )
      // RFC 6749 §2.3.1: must not send more than one auth method. The retry
      // switches to Bearer — clear any client creds from the body.
      // 调用 params.delete，触发MCP 服务此处需要的副作用。
      params.delete('client_id')
      // 调用 params.delete，触发MCP 服务此处需要的副作用。
      params.delete('client_secret')
      // 等待 `axios.post(endpoint, params, {` 完成，再继续MCP 服务 auth的异步流程。
      await axios.post(endpoint, params, {
        headers: { ...headers, Authorization: `Bearer ${accessToken}` },
      })
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Successfully revoked ${tokenTypeHint} with Bearer auth`,
      )
    } else {
      // 抛出 error，阻止MCP 服务在无效状态下继续运行。
      throw error
    }
  }
}

/**
 * Revokes tokens on the OAuth server if a revocation endpoint is available.
 * Per RFC 7009, we revoke the refresh token first (the long-lived credential),
 * then the access token. Revoking the refresh token prevents generation of new
 * access tokens and many servers implicitly invalidate associated access tokens.
 */
// revokeServerTokens 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function revokeServerTokens(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
  { preserveStepUpState = false }: { preserveStepUpState?: boolean } = {},
): Promise<void> {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existingData读取`storage.read`，供MCP 服务后续处理使用。
  const existingData = storage.read()
  // 满足 `!existingData?.mcpOAuth` 时，MCP 服务执行该分支。
  if (!existingData?.mcpOAuth) return

  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // tokenData保存`existingData.mcpOAuth[serverKey]`，供MCP 服务MCP 服务 auth后续判断或输出使用。
  const tokenData = existingData.mcpOAuth[serverKey]

  // Attempt server-side revocation if there are tokens to revoke (best-effort)
  // 组合条件 `tokenData?.accessToken || tokenData?.refreshToken` 成立时，MCP 服务才启用这条专门路径。
  if (tokenData?.accessToken || tokenData?.refreshToken) {
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // For XAA (and any PRM-discovered auth), the AS is at a different host
      // than the MCP URL — use the persisted discoveryState if we have it.
      // asUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const asUrl =
        tokenData.discoveryState?.authorizationServerUrl ?? serverConfig.url
      // metadata读取`fetchAuthServerMetadata`，供MCP 服务后续处理使用。
      const metadata = await fetchAuthServerMetadata(
        serverName,
        asUrl,
        serverConfig.oauth?.authServerMetadataUrl,
      )

      // metadata缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!metadata) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(serverName, 'No OAuth metadata found')
      } else {
        // revocationEndpoint 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const revocationEndpoint =
          'revocation_endpoint' in metadata
            ? metadata.revocation_endpoint
            : null
        // revocationEndpoint缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!revocationEndpoint) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(serverName, 'Server does not support token revocation')
        } else {
          // revocationEndpointStr保存`String`，供MCP 服务后续处理使用。
          const revocationEndpointStr = String(revocationEndpoint)
          // RFC 7009 defines revocation_endpoint_auth_methods_supported
          // separately from the token endpoint's list; prefer it if present.
          // authMethods 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const authMethods =
            ('revocation_endpoint_auth_methods_supported' in metadata
              ? metadata.revocation_endpoint_auth_methods_supported
              : undefined) ??
            ('token_endpoint_auth_methods_supported' in metadata
              ? metadata.token_endpoint_auth_methods_supported
              : undefined)
          // authMethod 先占位，稍后的条件分支会根据实际输入补齐它。
          const authMethod: 'client_secret_basic' | 'client_secret_post' =
            authMethods &&
            !authMethods.includes('client_secret_basic') &&
            authMethods.includes('client_secret_post')
              ? 'client_secret_post'
              : 'client_secret_basic'
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            serverName,
            `Revoking tokens via ${revocationEndpointStr} (${authMethod})`,
          )

          // Revoke refresh token first (more important - prevents future access token generation)
          // 满足 `tokenData.refreshToken` 时，MCP 服务执行该分支。
          if (tokenData.refreshToken) {
            // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
            try {
              // 等待 `revokeToken({` 完成，再继续MCP 服务 auth的异步流程。
              await revokeToken({
                serverName,
                endpoint: revocationEndpointStr,
                token: tokenData.refreshToken,
                tokenTypeHint: 'refresh_token',
                clientId: tokenData.clientId,
                clientSecret: tokenData.clientSecret,
                accessToken: tokenData.accessToken,
                authMethod,
              })
            } catch (error: unknown) {
              // Log but continue
              // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
              logMCPDebug(
                serverName,
                `Failed to revoke refresh token: ${errorMessage(error)}`,
              )
            }
          }

          // Then revoke access token (may already be invalidated by refresh token revocation)
          // 满足 `tokenData.accessToken` 时，MCP 服务执行该分支。
          if (tokenData.accessToken) {
            // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
            try {
              // 等待 `revokeToken({` 完成，再继续MCP 服务 auth的异步流程。
              await revokeToken({
                serverName,
                endpoint: revocationEndpointStr,
                token: tokenData.accessToken,
                tokenTypeHint: 'access_token',
                clientId: tokenData.clientId,
                clientSecret: tokenData.clientSecret,
                accessToken: tokenData.accessToken,
                authMethod,
              })
            } catch (error: unknown) {
              // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
              logMCPDebug(
                serverName,
                `Failed to revoke access token: ${errorMessage(error)}`,
              )
            }
          }
        }
      }
    } catch (error: unknown) {
      // Log error but don't throw - revocation is best-effort
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(serverName, `Failed to revoke tokens: ${errorMessage(error)}`)
    }
  } else {
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, 'No tokens to revoke')
  }

  // Always clear local tokens, regardless of server-side revocation result.
  // 调用 clearServerTokensFromLocalStorage，触发MCP 服务此处需要的副作用。
  clearServerTokensFromLocalStorage(serverName, serverConfig)

  // When re-authenticating, preserve step-up auth state (scope + discovery)
  // so the next performMCPOAuthFlow can use cached scope instead of
  // re-probing. For "Clear Auth" (default), wipe everything.
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    preserveStepUpState &&
    tokenData &&
    (tokenData.stepUpScope || tokenData.discoveryState)
  ) {
    // freshData读取`storage.read`，供MCP 服务后续处理使用。
    const freshData = storage.read() || {}
    // updatedData 集中保存MCP 服务 auth要一起传递的字段。
    const updatedData: SecureStorageData = {
      ...freshData,
      mcpOAuth: {
        ...freshData.mcpOAuth,
        [serverKey]: {
          ...freshData.mcpOAuth?.[serverKey],
          serverName,
          serverUrl: serverConfig.url,
          accessToken: freshData.mcpOAuth?.[serverKey]?.accessToken ?? '',
          expiresAt: freshData.mcpOAuth?.[serverKey]?.expiresAt ?? 0,
          ...(tokenData.stepUpScope
            ? { stepUpScope: tokenData.stepUpScope }
            : {}),
          ...(tokenData.discoveryState
            ? {
                // Strip legacy bulky metadata fields here too so users with
                // existing overflowed blobs recover on next re-auth (#30337).
                discoveryState: {
                  authorizationServerUrl:
                    tokenData.discoveryState.authorizationServerUrl,
                  resourceMetadataUrl:
                    tokenData.discoveryState.resourceMetadataUrl,
                },
              }
            : {}),
        },
      },
    }
    // 调用 storage.update，触发MCP 服务此处需要的副作用。
    storage.update(updatedData)
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, 'Preserved step-up auth state across revocation')
  }
}

// clearServerTokensFromLocalStorage 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearServerTokensFromLocalStorage(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
): void {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existingData读取`storage.read`，供MCP 服务后续处理使用。
  const existingData = storage.read()
  // 满足 `!existingData?.mcpOAuth` 时，MCP 服务执行该分支。
  if (!existingData?.mcpOAuth) return

  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // 满足 `existingData.mcpOAuth[serverKey]` 时，MCP 服务执行该分支。
  if (existingData.mcpOAuth[serverKey]) {
    // MCP 服务 auth在这里处理 `delete existingData.mcpOAuth[serverKey]`，完成这一小步状态转换。
    delete existingData.mcpOAuth[serverKey]
    // 调用 storage.update，触发MCP 服务此处需要的副作用。
    storage.update(existingData)
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, 'Cleared stored tokens')
  }
}

// WWWAuthenticateParams 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type WWWAuthenticateParams = {
  scope?: string
  resourceMetadataUrl?: URL
}

// XaaFailureStage 固化MCP 服务里传递的数据形状，帮助调用方按同一结构读写字段。
type XaaFailureStage =
  | 'idp_login'
  | 'discovery'
  | 'token_exchange'
  | 'jwt_bearer'

/**
 * XAA (Cross-App Access) auth.
 *
 * One IdP browser login is reused across all XAA-configured MCP servers:
 * 1. Acquire an id_token from the IdP (cached in keychain by issuer; if
 *    missing/expired, runs a standard OIDC authorization_code+PKCE flow
 *    — this is the one browser pop)
 * 2. Run the RFC 8693 + RFC 7523 exchange (no browser)
 * 3. Save tokens to the same keychain slot as normal OAuth
 *
 * IdP connection details come from settings.xaaIdp (configured once via
 * `claude mcp xaa setup`). Per-server config is just `oauth.xaa: true`
 * plus the AS clientId/clientSecret.
 *
 * No silent fallback: if `oauth.xaa` is set, XAA is the only path.
 * All errors are actionable — they tell the user what to run.
 */
// performMCPXaaAuth 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function performMCPXaaAuth(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
  // 这个回调绑定到 onAuthorizationUrl: (url: string) => void,，负责MCP 服务在该局部场景下的响应。
  onAuthorizationUrl: (url: string) => void,
  abortSignal?: AbortSignal,
  skipBrowserOpen?: boolean,
): Promise<void> {
  // 满足 `!serverConfig.oauth?.xaa` 时，MCP 服务执行该分支。
  if (!serverConfig.oauth?.xaa) {
    // 抛出 new Error('XAA: oauth.xaa must be set') // guarded by caller，阻止MCP 服务在无效状态下继续运行。
    throw new Error('XAA: oauth.xaa must be set') // guarded by caller
  }

  // IdP config comes from user-level settings, not per-server.
  // idp读取`getXaaIdpSettings`，供MCP 服务后续处理使用。
  const idp = getXaaIdpSettings()
  // idp缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!idp) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      "XAA: no IdP connection configured. Run 'claude mcp xaa setup --issuer <url> --client-id <id> --client-secret' to configure.",
    )
  }

  // clientId 命名 `serverConfig.oauth?.clientId`，让后续代码直接表达这个值的用途。
  const clientId = serverConfig.oauth?.clientId
  // clientId缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!clientId) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: server '${serverName}' needs an AS client_id. Re-add with --client-id.`,
    )
  }

  // clientConfig 配置读取`getMcpClientConfig`，供MCP 服务后续处理使用。
  const clientConfig = getMcpClientConfig(serverName, serverConfig)
  // clientSecret保存`clientConfig?.clientSecret`，供MCP 服务MCP 服务 auth后续判断或输出使用。
  const clientSecret = clientConfig?.clientSecret
  // clientSecret缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!clientSecret) {
    // Diagnostic context for serverKey mismatch debugging. Only computed
    // on the error path so there's no perf cost on success.
    // wantedKey读取`getServerKey`，供MCP 服务后续处理使用。
    const wantedKey = getServerKey(serverName, serverConfig)
    // haveKeys 集合派生`Object.keys`，供MCP 服务后续处理使用。
    const haveKeys = Object.keys(
      getSecureStorage().read()?.mcpOAuthClientConfig ?? {},
    )
    // headersForLogging保存`Object.fromEntries`，供MCP 服务后续处理使用。
    const headersForLogging = Object.fromEntries(
      // 调用 Object.entries，触发MCP 服务此处需要的副作用。
      Object.entries(serverConfig.headers ?? {}).map(([k, v]) =>
        k.toLowerCase() === 'authorization' ? [k, '[REDACTED]'] : [k, v],
      ),
    )
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(
      serverName,
      `XAA: secret lookup miss. wanted=${wantedKey} have=[${haveKeys.join(', ')}] configHeaders=${jsonStringify(headersForLogging)}`,
    )
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      `XAA: AS client secret not found for '${serverName}'. Re-add with --client-secret.`,
    )
  }

  // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
  logMCPDebug(serverName, 'XAA: starting cross-app access flow')

  // IdP client secret lives in a separate keychain slot (keyed by IdP issuer),
  // NOT the AS secret — different trust domain. Optional: if absent, PKCE-only.
  // idpClientSecret读取`getIdpClientSecret`，供MCP 服务后续处理使用。
  const idpClientSecret = getIdpClientSecret(idp.issuer)

  // Acquire id_token (cached or via one OIDC browser pop at the IdP).
  // Peek the cache first so we can report idTokenCacheHit in analytics before
  // acquireIdpIdToken potentially writes a fresh one.
  // idTokenCacheHit 缓存读取`getCachedIdpIdToken`，供MCP 服务后续处理使用。
  const idTokenCacheHit = getCachedIdpIdToken(idp.issuer) !== undefined

  // failureStage 命名 `'idp_login'`，让后续代码直接表达这个值的用途。
  let failureStage: XaaFailureStage = 'idp_login'
  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // idToken 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let idToken
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // idToken更新为 `await acquireIdpIdToken({`，确保MCP 服务后续读取最新状态。
      idToken = await acquireIdpIdToken({
        idpIssuer: idp.issuer,
        idpClientId: idp.clientId,
        idpClientSecret,
        callbackPort: idp.callbackPort,
        onAuthorizationUrl,
        skipBrowserOpen,
        abortSignal,
      })
    } catch (e) {
      // 满足 `abortSignal?.aborted) throw new AuthenticationCancelledError(` 时，MCP 服务执行该分支。
      if (abortSignal?.aborted) throw new AuthenticationCancelledError()
      // 抛出 e，阻止MCP 服务在无效状态下继续运行。
      throw e
    }

    // Discover the IdP's token endpoint for the RFC 8693 exchange.
    // failureStage更新为 `'discovery'`，确保MCP 服务后续读取最新状态。
    failureStage = 'discovery'
    // oidc保存`discoverOidc`，供MCP 服务后续处理使用。
    const oidc = await discoverOidc(idp.issuer)

    // Run the exchange. performCrossAppAccess throws XaaTokenExchangeError
    // for the IdP leg and "jwt-bearer grant failed" for the AS leg.
    // failureStage更新为 `'token_exchange'`，确保MCP 服务后续读取最新状态。
    failureStage = 'token_exchange'
    // tokens 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let tokens
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // token 列表更新为 `await performCrossAppAccess(`，确保MCP 服务后续读取最新状态。
      tokens = await performCrossAppAccess(
        serverConfig.url,
        {
          clientId,
          clientSecret,
          idpClientId: idp.clientId,
          idpClientSecret,
          idpIdToken: idToken,
          idpTokenEndpoint: oidc.token_endpoint,
        },
        serverName,
        abortSignal,
      )
    } catch (e) {
      // 满足 `abortSignal?.aborted) throw new AuthenticationCancelledError(` 时，MCP 服务执行该分支。
      if (abortSignal?.aborted) throw new AuthenticationCancelledError()
      // 消息保存`errorMessage`，供MCP 服务后续处理使用。
      const msg = errorMessage(e)
      // If the IdP says the id_token is bad, drop it from the cache so the
      // next attempt does a fresh IdP login. XaaTokenExchangeError carries
      // shouldClearIdToken so we key off OAuth semantics (4xx / invalid body
      // → clear; 5xx IdP outage → preserve) rather than substring matching.
      // 满足 `e instanceof XaaTokenExchangeError` 时，MCP 服务执行该分支。
      if (e instanceof XaaTokenExchangeError) {
        // 满足 `e.shouldClearIdToken` 时，MCP 服务执行该分支。
        if (e.shouldClearIdToken) {
          // 调用 clearIdpIdToken，触发MCP 服务此处需要的副作用。
          clearIdpIdToken(idp.issuer)
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(
            serverName,
            'XAA: cleared cached id_token after token-exchange failure',
          )
        }
      // MCP 服务 auth在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        msg.includes('PRM discovery failed') ||
        msg.includes('AS metadata discovery failed') ||
        msg.includes('no authorization server supports jwt-bearer')
      ) {
        // performCrossAppAccess runs PRM + AS discovery before the actual
        // exchange — don't attribute their failures to 'token_exchange'.
        // failureStage更新为 `'discovery'`，确保MCP 服务后续读取最新状态。
        failureStage = 'discovery'
      // MCP 服务 auth在这里处理 `} else if (msg.includes('jwt-bearer')) {`，完成这一小步状态转换。
      } else if (msg.includes('jwt-bearer')) {
        // failureStage更新为 `'jwt_bearer'`，确保MCP 服务后续读取最新状态。
        failureStage = 'jwt_bearer'
      }
      // 抛出 e，阻止MCP 服务在无效状态下继续运行。
      throw e
    }

    // Save tokens via the same storage path as normal OAuth. We write directly
    // (instead of ClaudeAuthProvider.saveTokens) to avoid instantiating the
    // whole provider just to write the same keys.
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // existingData读取`storage.read`，供MCP 服务后续处理使用。
    const existingData = storage.read() || {}
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(serverName, serverConfig)
    // prev 命名 `existingData.mcpOAuth?.[serverKey]`，让后续代码直接表达这个值的用途。
    const prev = existingData.mcpOAuth?.[serverKey]
    // 调用 storage.update，触发MCP 服务此处需要的副作用。
    storage.update({
      ...existingData,
      mcpOAuth: {
        ...existingData.mcpOAuth,
        [serverKey]: {
          ...prev,
          serverName,
          serverUrl: serverConfig.url,
          accessToken: tokens.access_token,
          // AS may omit refresh_token on jwt-bearer — preserve any existing one
          refreshToken: tokens.refresh_token ?? prev?.refreshToken,
          expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
          scope: tokens.scope,
          clientId,
          clientSecret,
          // Persist the AS URL so _doRefresh and revokeServerTokens can locate
          // the token/revocation endpoints when MCP URL ≠ AS URL (the common
          // XAA topology).
          discoveryState: {
            authorizationServerUrl: tokens.authorizationServerUrl,
          },
        },
      },
    })

    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, 'XAA: tokens saved')
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_oauth_flow_success', {
      authMethod:
        'xaa' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      idTokenCacheHit,
    })
  } catch (e) {
    // User-initiated cancel (Esc during IdP browser pop) isn't a failure.
    // 满足 `e instanceof AuthenticationCancelledError` 时，MCP 服务执行该分支。
    if (e instanceof AuthenticationCancelledError) {
      // 抛出 e，阻止MCP 服务在无效状态下继续运行。
      throw e
    }
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_oauth_flow_failure', {
      authMethod:
        'xaa' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      xaaFailureStage:
        failureStage as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      idTokenCacheHit,
    })
    // 抛出 e，阻止MCP 服务在无效状态下继续运行。
    throw e
  }
}

// performMCPOAuthFlow 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function performMCPOAuthFlow(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
  // 这个回调绑定到 onAuthorizationUrl: (url: string) => void,，负责MCP 服务在该局部场景下的响应。
  onAuthorizationUrl: (url: string) => void,
  abortSignal?: AbortSignal,
  options?: {
    skipBrowserOpen?: boolean
    onWaitingForCallback?: (submit: (callbackUrl: string) => void) => void
  },
): Promise<void> {
  // XAA (SEP-990): if configured, bypass the per-server consent dance.
  // If the IdP id_token isn't cached, this pops the browser once at the IdP
  // (shared across all XAA servers for that issuer). Subsequent servers hit
  // the cache and are silent. Tokens land in the same keychain slot, so the
  // rest of CC's transport wiring (ClaudeAuthProvider.tokens() in client.ts)
  // works unchanged.
  //
  // No silent fallback: if `oauth.xaa` is set, XAA is the only path. We
  // never fall through to the consent flow — that would be surprising (the
  // user explicitly asked for XAA) and security-relevant (consent flow may
  // have a different trust/scope posture than the org's IdP policy).
  //
  // Servers with `oauth.xaa` but CLAUDE_CODE_ENABLE_XAA unset hard-fail with
  // actionable copy rather than silently degrade to consent.
  // 满足 `serverConfig.oauth?.xaa` 时，MCP 服务执行该分支。
  if (serverConfig.oauth?.xaa) {
    // 满足 `!isXaaEnabled()` 时，MCP 服务执行该分支。
    if (!isXaaEnabled()) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        `XAA is not enabled (set CLAUDE_CODE_ENABLE_XAA=1). Remove 'oauth.xaa' from server '${serverName}' to use the standard consent flow.`,
      )
    }
    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_oauth_flow_start', {
      isOAuthFlow: true,
      authMethod:
        'xaa' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      transportType:
        serverConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...(getLoggingSafeMcpBaseUrl(serverConfig)
        ? {
            mcpServerBaseUrl: getLoggingSafeMcpBaseUrl(
              serverConfig,
            ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          }
        : {}),
    })
    // performMCPXaaAuth logs its own success/failure events (with
    // idTokenCacheHit + xaaFailureStage).
    // 等待 `performMCPXaaAuth(` 完成，再继续MCP 服务 auth的异步流程。
    await performMCPXaaAuth(
      serverName,
      serverConfig,
      onAuthorizationUrl,
      abortSignal,
      options?.skipBrowserOpen,
    )
    // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check for cached step-up scope and resource metadata URL before clearing
  // tokens. The transport-attached auth provider persists scope when it receives
  // a step-up 401, so we can use it here instead of making an extra probe request.
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // cachedEntry 缓存读取`storage.read`，供MCP 服务后续处理使用。
  const cachedEntry = storage.read()?.mcpOAuth?.[serverKey]
  // cachedStepUpScope 缓存保存`cachedEntry?.stepUpScope`，供MCP 服务MCP 服务 auth后续判断或输出使用。
  const cachedStepUpScope = cachedEntry?.stepUpScope
  // cachedResourceMetadataUrl 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const cachedResourceMetadataUrl =
    cachedEntry?.discoveryState?.resourceMetadataUrl

  // Clear any existing stored credentials to ensure fresh client registration.
  // Note: this deletes the entire entry (including discoveryState/stepUpScope),
  // but we already read the cached values above.
  // 调用 clearServerTokensFromLocalStorage，触发MCP 服务此处需要的副作用。
  clearServerTokensFromLocalStorage(serverName, serverConfig)

  // Use cached step-up scope and resource metadata URL if available.
  // The transport-attached auth provider caches these when it receives a
  // step-up 401, so we don't need to probe the server again.
  // resourceMetadataUrl 先占位，稍后的条件分支会根据实际输入补齐它。
  let resourceMetadataUrl: URL | undefined
  // 满足 `cachedResourceMetadataUrl` 时，MCP 服务执行该分支。
  if (cachedResourceMetadataUrl) {
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // resourceMetadataUrl更新为 `new URL(cachedResourceMetadataUrl)`，确保MCP 服务后续读取最新状态。
      resourceMetadataUrl = new URL(cachedResourceMetadataUrl)
    } catch {
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Invalid cached resourceMetadataUrl: ${cachedResourceMetadataUrl}`,
      )
    }
  }
  // wwwAuthParams 集合 集中保存MCP 服务 auth要一起传递的字段。
  const wwwAuthParams: WWWAuthenticateParams = {
    scope: cachedStepUpScope,
    resourceMetadataUrl,
  }

  // flowAttemptId保存`randomUUID`，供MCP 服务后续处理使用。
  const flowAttemptId = randomUUID()

  // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_mcp_oauth_flow_start', {
    flowAttemptId:
      flowAttemptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    isOAuthFlow: true,
    transportType:
      serverConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(getLoggingSafeMcpBaseUrl(serverConfig)
      ? {
          mcpServerBaseUrl: getLoggingSafeMcpBaseUrl(
            serverConfig,
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
  })

  // Track whether we reached the token-exchange phase so the catch block can
  // attribute the failure reason correctly.
  // authorizationCodeObtained标记MCP 服务MCP 服务 auth是否启用对应路径。
  let authorizationCodeObtained = false

  // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
  try {
    // Use configured callback port for pre-configured OAuth, otherwise find an available port
    // configuredCallbackPort 配置保存`serverConfig.oauth?.callbackPort`，供MCP 服务MCP 服务 auth后续判断或输出使用。
    const configuredCallbackPort = serverConfig.oauth?.callbackPort
    // port筛选`findAvailablePort`，供MCP 服务后续处理使用。
    const port = configuredCallbackPort ?? (await findAvailablePort())
    // redirectUri构建`buildRedirectUri`，供MCP 服务后续处理使用。
    const redirectUri = buildRedirectUri(port)
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(
      serverName,
      `Using redirect port: ${port}${configuredCallbackPort ? ' (from config)' : ''}`,
    )

    // provider保存`ClaudeAuthProvider`，供MCP 服务后续处理使用。
    const provider = new ClaudeAuthProvider(
      serverName,
      serverConfig,
      redirectUri,
      true,
      onAuthorizationUrl,
      options?.skipBrowserOpen,
    )

    // Fetch and store OAuth metadata for scope information
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // metadata读取`fetchAuthServerMetadata`，供MCP 服务后续处理使用。
      const metadata = await fetchAuthServerMetadata(
        serverName,
        serverConfig.url,
        serverConfig.oauth?.authServerMetadataUrl,
        undefined,
        wwwAuthParams.resourceMetadataUrl,
      )
      // 满足 `metadata` 时，MCP 服务执行该分支。
      if (metadata) {
        // Store metadata in provider for scope information
        // provider.setMetadata 写入新的状态值，使MCP 服务后续读取保持一致。
        provider.setMetadata(metadata)
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          serverName,
          `Fetched OAuth metadata with scope: ${getScopeFromMetadata(metadata) || 'NONE'}`,
        )
      }
    } catch (error) {
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Failed to fetch OAuth metadata: ${errorMessage(error)}`,
      )
    }

    // Get the OAuth state from the provider for validation
    // oauthState 状态保存`provider.state`，供MCP 服务后续处理使用。
    const oauthState = await provider.state()

    // Store the server, timeout, and abort listener references for cleanup
    // server初始化为空值，后续分支会在有数据时补齐。
    let server: Server | null = null
    // timeoutId初始化为空值，后续分支会在有数据时补齐。
    let timeoutId: NodeJS.Timeout | null = null
    // 这个回调绑定到 let abortHandler: (() => void) | null = null，负责MCP 服务在该局部场景下的响应。
    let abortHandler: (() => void) | null = null

    // cleanup封装成回调，供MCP 服务MCP 服务 auth在事件触发或异步步骤中调用。
    const cleanup = () => {
      // 满足 `server` 时，MCP 服务执行该分支。
      if (server) {
        // 调用 server.removeAllListeners，触发MCP 服务此处需要的副作用。
        server.removeAllListeners()
        // Defensive: removeAllListeners() strips the error handler, so swallow any late error during close
        // 调用 server.on，触发MCP 服务此处需要的副作用。
        server.on('error', () => {})
        // 调用 server.close，触发MCP 服务此处需要的副作用。
        server.close()
        // server更新为 `null`，确保MCP 服务后续读取最新状态。
        server = null
      }
      // 满足 `timeoutId` 时，MCP 服务执行该分支。
      if (timeoutId) {
        // 调用 clearTimeout，触发MCP 服务此处需要的副作用。
        clearTimeout(timeoutId)
        // timeoutId更新为 `null`，确保MCP 服务后续读取最新状态。
        timeoutId = null
      }
      // 组合条件 `abortSignal && abortHandler` 成立时，MCP 服务才启用这条专门路径。
      if (abortSignal && abortHandler) {
        // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
        abortSignal.removeEventListener('abort', abortHandler)
        // abortHandler更新为 `null`，确保MCP 服务后续读取最新状态。
        abortHandler = null
      }
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(serverName, `MCP OAuth server cleaned up`)
    }

    // Setup a server to receive the callback
    // authorizationCode 等待 `new Promise<string>((resolve, reject) => {`，确保继续执行前已有结果。
    const authorizationCode = await new Promise<string>((resolve, reject) => {
      // resolved标记MCP 服务MCP 服务 auth是否启用对应路径。
      let resolved = false
      // resolveOnce封装成回调，供MCP 服务MCP 服务 auth在事件触发或异步步骤中调用。
      const resolveOnce = (code: string) => {
        // 满足 `resolved` 时，MCP 服务执行该分支。
        if (resolved) return
        // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
        resolved = true
        // resolve 结算当前 Promise，唤醒等待这个异步结果的调用方。
        resolve(code)
      }
      // rejectOnce封装成回调，供MCP 服务MCP 服务 auth在事件触发或异步步骤中调用。
      const rejectOnce = (error: Error) => {
        // 满足 `resolved` 时，MCP 服务执行该分支。
        if (resolved) return
        // resolved更新为 `true`，确保MCP 服务后续读取最新状态。
        resolved = true
        // reject 结算当前 Promise，唤醒等待这个异步结果的调用方。
        reject(error)
      }

      // 满足 `abortSignal` 时，MCP 服务执行该分支。
      if (abortSignal) {
        // abortHandler更新为 `() => {`，确保MCP 服务后续读取最新状态。
        abortHandler = () => {
          // 调用 cleanup，触发MCP 服务此处需要的副作用。
          cleanup()
          // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          rejectOnce(new AuthenticationCancelledError())
        }
        // 满足 `abortSignal.aborted` 时，MCP 服务执行该分支。
        if (abortSignal.aborted) {
          // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
          abortHandler()
          // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }
        // 触发取消信号，通知MCP 服务中仍在等待的异步任务尽快停止。
        abortSignal.addEventListener('abort', abortHandler)
      }

      // Allow manual callback URL paste for remote/browser-based environments
      // where localhost is not reachable from the user's browser.
      // 满足 `options?.onWaitingForCallback` 时，MCP 服务执行该分支。
      if (options?.onWaitingForCallback) {
        // 调用 options.onWaitingForCallback，触发MCP 服务此处需要的副作用。
        options.onWaitingForCallback((callbackUrl: string) => {
          // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
          try {
            // 解析结果保存`URL`，供MCP 服务后续处理使用。
            const parsed = new URL(callbackUrl)
            // code读取`searchParams.get`，供MCP 服务后续处理使用。
            const code = parsed.searchParams.get('code')
            // 状态读取`searchParams.get`，供MCP 服务后续处理使用。
            const state = parsed.searchParams.get('state')
            // 错误读取`searchParams.get`，供MCP 服务后续处理使用。
            const error = parsed.searchParams.get('error')

            // 满足 `error` 时，MCP 服务执行该分支。
            if (error) {
              // errorDescription 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
              const errorDescription =
                parsed.searchParams.get('error_description') || ''
              // 调用 cleanup，触发MCP 服务此处需要的副作用。
              cleanup()
              // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
              rejectOnce(
                new Error(`OAuth error: ${error} - ${errorDescription}`),
              )
              // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // code缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
            if (!code) {
              // Not a valid callback URL, ignore so the user can try again
              // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // `state` 与 `oauthState` 不一致时刷新派生状态，避免使用过期结果。
            if (state !== oauthState) {
              // 调用 cleanup，触发MCP 服务此处需要的副作用。
              cleanup()
              // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
              rejectOnce(
                new Error('OAuth state mismatch - possible CSRF attack'),
              )
              // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
              return
            }

            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              serverName,
              `Received auth code via manual callback URL`,
            )
            // 调用 cleanup，触发MCP 服务此处需要的副作用。
            cleanup()
            // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolveOnce(code)
          } catch {
            // Invalid URL, ignore so the user can try again
          }
        })
      }

      // server更新为 `createServer((req, res) => {`，确保MCP 服务后续读取最新状态。
      server = createServer((req, res) => {
        // parsedUrl解析`parse`，供MCP 服务后续处理使用。
        const parsedUrl = parse(req.url || '', true)

        // 当 `parsedUrl.pathname` 匹配 `'/callback'` 时，MCP 服务执行对应分支。
        if (parsedUrl.pathname === '/callback') {
          // code 命名 `parsedUrl.query.code as string`，让后续代码直接表达这个值的用途。
          const code = parsedUrl.query.code as string
          // 状态 命名 `parsedUrl.query.state as string`，让后续代码直接表达这个值的用途。
          const state = parsedUrl.query.state as string
          // 错误解析`parsedUrl.query.error`，供后续判断或组装使用。
          const error = parsedUrl.query.error
          // errorDescription 错误信息解析`parsedUrl.query.error_description as string`，供后续判断或组装使用。
          const errorDescription = parsedUrl.query.error_description as string
          // errorUri 错误信息解析`parsedUrl.query.error_uri as string` 整理出中间结果，供MCP 服务MCP 服务 auth后续步骤使用。
          const errorUri = parsedUrl.query.error_uri as string

          // Validate OAuth state to prevent CSRF attacks
          // `!error && state` 与 `oauthState` 不一致时刷新派生状态，避免使用过期结果。
          if (!error && state !== oauthState) {
            // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
            res.writeHead(400, { 'Content-Type': 'text/html' })
            // 调用 res.end，触发MCP 服务此处需要的副作用。
            res.end(
              `<h1>Authentication Error</h1><p>Invalid state parameter. Please try again.</p><p>You can close this window.</p>`,
            )
            // 调用 cleanup，触发MCP 服务此处需要的副作用。
            cleanup()
            // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
            rejectOnce(new Error('OAuth state mismatch - possible CSRF attack'))
            // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // 满足 `error` 时，MCP 服务执行该分支。
          if (error) {
            // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
            res.writeHead(200, { 'Content-Type': 'text/html' })
            // Sanitize error messages to prevent XSS
            // sanitizedError 错误信息保存`xss`，供MCP 服务后续处理使用。
            const sanitizedError = xss(String(error))
            // sanitizedErrorDescription 错误信息保存`errorDescription`，供MCP 服务MCP 服务 auth后续判断或输出使用。
            const sanitizedErrorDescription = errorDescription
              ? xss(String(errorDescription))
              : ''
            // 调用 res.end，触发MCP 服务此处需要的副作用。
            res.end(
              `<h1>Authentication Error</h1><p>${sanitizedError}: ${sanitizedErrorDescription}</p><p>You can close this window.</p>`,
            )
            // 调用 cleanup，触发MCP 服务此处需要的副作用。
            cleanup()
            // errorMessage 消息数据 命名 ``OAuth error: ${error}``，让后续代码直接表达这个值的用途。
            let errorMessage = `OAuth error: ${error}`
            // 满足 `errorDescription` 时，MCP 服务执行该分支。
            if (errorDescription) {
              // MCP 服务 auth在这里处理 `errorMessage += ` - ${errorDescription}``，完成这一小步状态转换。
              errorMessage += ` - ${errorDescription}`
            }
            // 满足 `errorUri` 时，MCP 服务执行该分支。
            if (errorUri) {
              // MCP 服务 auth在这里处理 `errorMessage += ` (See: ${errorUri})``，完成这一小步状态转换。
              errorMessage += ` (See: ${errorUri})`
            }
            // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
            rejectOnce(new Error(errorMessage))
            // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
            return
          }

          // 满足 `code` 时，MCP 服务执行该分支。
          if (code) {
            // 调用 res.writeHead，触发MCP 服务此处需要的副作用。
            res.writeHead(200, { 'Content-Type': 'text/html' })
            // 调用 res.end，触发MCP 服务此处需要的副作用。
            res.end(
              `<h1>Authentication Successful</h1><p>You can close this window. Return to Claude Code.</p>`,
            )
            // 调用 cleanup，触发MCP 服务此处需要的副作用。
            cleanup()
            // resolveOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
            resolveOnce(code)
          }
        }
      })

      // 调用 server.on，触发MCP 服务此处需要的副作用。
      server.on('error', (err: NodeJS.ErrnoException) => {
        // 调用 cleanup，触发MCP 服务此处需要的副作用。
        cleanup()
        // 当 `err.code` 匹配 `'EADDRINUSE'` 时，MCP 服务执行对应分支。
        if (err.code === 'EADDRINUSE') {
          // findCmd 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const findCmd =
            getPlatform() === 'windows'
              ? `netstat -ano | findstr :${port}`
              : `lsof -ti:${port} -sTCP:LISTEN`
          // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          rejectOnce(
            new Error(
              `OAuth callback port ${port} is already in use — another process may be holding it. ` +
                `Run \`${findCmd}\` to find it.`,
            ),
          )
        } else {
          // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          rejectOnce(new Error(`OAuth callback server failed: ${err.message}`))
        }
      })

      // 调用 server.listen，触发MCP 服务此处需要的副作用。
      server.listen(port, '127.0.0.1', async () => {
        // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
        try {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(serverName, `Starting SDK auth`)
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(serverName, `Server URL: ${serverConfig.url}`)

          // First call to start the auth flow - should redirect
          // Pass the scope and resource_metadata from WWW-Authenticate header if available
          // 结果保存`sdkAuth`，供MCP 服务后续处理使用。
          const result = await sdkAuth(provider, {
            serverUrl: serverConfig.url,
            scope: wwwAuthParams.scope,
            resourceMetadataUrl: wwwAuthParams.resourceMetadataUrl,
          })
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(serverName, `Initial auth result: ${result}`)

          // `result` 与 `'REDIRECT'` 不一致时刷新派生状态，避免使用过期结果。
          if (result !== 'REDIRECT') {
            // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
            logMCPDebug(
              serverName,
              `Unexpected auth result, expected REDIRECT: ${result}`,
            )
          }
        } catch (error) {
          // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
          logMCPDebug(serverName, `SDK auth error: ${error}`)
          // 调用 cleanup，触发MCP 服务此处需要的副作用。
          cleanup()
          // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          rejectOnce(new Error(`SDK auth failed: ${errorMessage(error)}`))
        }
      })

      // Don't let the callback server or timeout pin the event loop — if the UI
      // component unmounts without aborting (e.g. parent intercepts Esc), we'd
      // rather let the process exit than stay alive for 5 minutes holding the
      // port. The abortSignal is the intended lifecycle management.
      // 调用 server.unref，触发MCP 服务此处需要的副作用。
      server.unref()

      // timeoutId更新为 `setTimeout(`，确保MCP 服务后续读取最新状态。
      timeoutId = setTimeout(
        // 这个回调绑定到 (cleanup, rejectOnce) => {，负责MCP 服务在该局部场景下的响应。
        (cleanup, rejectOnce) => {
          // 调用 cleanup，触发MCP 服务此处需要的副作用。
          cleanup()
          // rejectOnce 结算当前 Promise，唤醒等待这个异步结果的调用方。
          rejectOnce(new Error('Authentication timeout'))
        },
        5 * 60 * 1000, // 5 minutes
        cleanup,
        rejectOnce,
      )
      // 调用 timeoutId.unref，触发MCP 服务此处需要的副作用。
      timeoutId.unref()
    })

    // authorizationCodeObtained更新为 `true`，确保MCP 服务后续读取最新状态。
    authorizationCodeObtained = true

    // Now complete the auth flow with the received code
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, `Completing auth flow with authorization code`)
    // 结果保存`sdkAuth`，供MCP 服务后续处理使用。
    const result = await sdkAuth(provider, {
      serverUrl: serverConfig.url,
      authorizationCode,
      resourceMetadataUrl: wwwAuthParams.resourceMetadataUrl,
    })

    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, `Auth result: ${result}`)

    // 当 `result` 匹配 `'AUTHORIZED'` 时，MCP 服务执行对应分支。
    if (result === 'AUTHORIZED') {
      // Debug: Check if tokens were properly saved
      // savedTokens 集合保存`provider.tokens`，供MCP 服务后续处理使用。
      const savedTokens = await provider.tokens()
      // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
      logMCPDebug(
        serverName,
        `Tokens after auth: ${savedTokens ? 'Present' : 'Missing'}`,
      )
      // 满足 `savedTokens` 时，MCP 服务执行该分支。
      if (savedTokens) {
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(
          serverName,
          `Token access_token length: ${savedTokens.access_token?.length}`,
        )
        // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
        logMCPDebug(serverName, `Token expires_in: ${savedTokens.expires_in}`)
      }

      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_mcp_oauth_flow_success', {
        flowAttemptId:
          flowAttemptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        transportType:
          serverConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        ...(getLoggingSafeMcpBaseUrl(serverConfig)
          ? {
              mcpServerBaseUrl: getLoggingSafeMcpBaseUrl(
                serverConfig,
              ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            }
          : {}),
      })
    } else {
      // 抛出 new Error('Unexpected auth result: ' + result)，阻止MCP 服务在无效状态下继续运行。
      throw new Error('Unexpected auth result: ' + result)
    }
  } catch (error) {
    // 调用 logMCPDebug，触发MCP 服务此处需要的副作用。
    logMCPDebug(serverName, `Error during auth completion: ${error}`)

    // Determine failure reason for attribution telemetry. The try block covers
    // port acquisition, the callback server, the redirect flow, and token
    // exchange. Map known failure paths to stable reason codes.
    // reason保存`'unknown'`，作为后续固定文本处理的输入。
    let reason: MCPOAuthFlowErrorReason = 'unknown'
    // oauthErrorCode 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
    let oauthErrorCode: string | undefined
    // httpStatus 集合 先占位，稍后的条件分支会根据实际输入补齐它。
    let httpStatus: number | undefined

    // 满足 `error instanceof AuthenticationCancelledError` 时，MCP 服务执行该分支。
    if (error instanceof AuthenticationCancelledError) {
      // reason更新为 `'cancelled'`，确保MCP 服务后续读取最新状态。
      reason = 'cancelled'
    // MCP 服务 auth在这里处理 `} else if (authorizationCodeObtained) {`，完成这一小步状态转换。
    } else if (authorizationCodeObtained) {
      // reason更新为 `'token_exchange_failed'`，确保MCP 服务后续读取最新状态。
      reason = 'token_exchange_failed'
    } else {
      // 消息保存`errorMessage`，供MCP 服务后续处理使用。
      const msg = errorMessage(error)
      // 满足 `msg.includes('Authentication timeout')` 时，MCP 服务执行该分支。
      if (msg.includes('Authentication timeout')) {
        // reason更新为 `'timeout'`，确保MCP 服务后续读取最新状态。
        reason = 'timeout'
      // MCP 服务 auth在这里处理 `} else if (msg.includes('OAuth state mismatch')) {`，完成这一小步状态转换。
      } else if (msg.includes('OAuth state mismatch')) {
        // reason更新为 `'state_mismatch'`，确保MCP 服务后续读取最新状态。
        reason = 'state_mismatch'
      // MCP 服务 auth在这里处理 `} else if (msg.includes('OAuth error:')) {`，完成这一小步状态转换。
      } else if (msg.includes('OAuth error:')) {
        // reason更新为 `'provider_denied'`，确保MCP 服务后续读取最新状态。
        reason = 'provider_denied'
      // MCP 服务 auth在这里处理 `} else if (`，完成这一小步状态转换。
      } else if (
        msg.includes('already in use') ||
        msg.includes('EADDRINUSE') ||
        msg.includes('callback server failed') ||
        msg.includes('No available port')
      ) {
        // reason更新为 `'port_unavailable'`，确保MCP 服务后续读取最新状态。
        reason = 'port_unavailable'
      // MCP 服务 auth在这里处理 `} else if (msg.includes('SDK auth failed')) {`，完成这一小步状态转换。
      } else if (msg.includes('SDK auth failed')) {
        // reason更新为 `'sdk_auth_failed'`，确保MCP 服务后续读取最新状态。
        reason = 'sdk_auth_failed'
      }
    }

    // sdkAuth uses native fetch and throws OAuthError subclasses (InvalidGrantError,
    // ServerError, InvalidClientError, etc.) via parseErrorResponse. Extract the
    // OAuth error code directly from the SDK error instance.
    // 满足 `error instanceof OAuthError` 时，MCP 服务执行该分支。
    if (error instanceof OAuthError) {
      // oauthErrorCode 错误信息更新为 `error.errorCode`，确保MCP 服务后续读取最新状态。
      oauthErrorCode = error.errorCode
      // SDK does not attach HTTP status as a property, but the fallback ServerError
      // embeds it in the message as "HTTP {status}:" when the response body was
      // unparseable. Best-effort extraction.
      // statusMatch匹配`message.match`，供MCP 服务后续处理使用。
      const statusMatch = error.message.match(/^HTTP (\d{3}):/)
      // 满足 `statusMatch` 时，MCP 服务执行该分支。
      if (statusMatch) {
        // httpStatus 集合更新为 `Number(statusMatch[1])`，确保MCP 服务后续读取最新状态。
        httpStatus = Number(statusMatch[1])
      }
      // If client not found, clear the stored client ID and suggest retry
      // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
      if (
        error.errorCode === 'invalid_client' &&
        error.message.includes('Client not found')
      ) {
        // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
        const storage = getSecureStorage()
        // existingData读取`storage.read`，供MCP 服务后续处理使用。
        const existingData = storage.read() || {}
        // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
        const serverKey = getServerKey(serverName, serverConfig)
        // 满足 `existingData.mcpOAuth?.[serverKey]` 时，MCP 服务执行该分支。
        if (existingData.mcpOAuth?.[serverKey]) {
          // MCP 服务 auth在这里处理 `delete existingData.mcpOAuth[serverKey].clientId`，完成这一小步状态转换。
          delete existingData.mcpOAuth[serverKey].clientId
          // MCP 服务 auth在这里处理 `delete existingData.mcpOAuth[serverKey].clientSecret`，完成这一小步状态转换。
          delete existingData.mcpOAuth[serverKey].clientSecret
          // 调用 storage.update，触发MCP 服务此处需要的副作用。
          storage.update(existingData)
        }
      }
    }

    // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_mcp_oauth_flow_error', {
      flowAttemptId:
        flowAttemptId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      reason:
        reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      error_code:
        oauthErrorCode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      http_status:
        httpStatus?.toString() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      transportType:
        serverConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...(getLoggingSafeMcpBaseUrl(serverConfig)
        ? {
            mcpServerBaseUrl: getLoggingSafeMcpBaseUrl(
              serverConfig,
            ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          }
        : {}),
    })
    // 抛出 error，阻止MCP 服务在无效状态下继续运行。
    throw error
  }
}

/**
 * Wraps fetch to detect 403 insufficient_scope responses and mark step-up
 * pending on the provider BEFORE the SDK's 403 handler calls auth(). Without
 * this, the SDK's authInternal sees refresh_token → refreshes (uselessly, since
 * RFC 6749 §6 forbids scope elevation via refresh) → returns 'AUTHORIZED' →
 * retry → 403 again → aborts with "Server returned 403 after trying upscoping",
 * never reaching redirectToAuthorization where step-up scope is persisted.
 * With this flag set, tokens() omits refresh_token so the SDK falls through
 * to the PKCE flow. See github.com/anthropics/claude-code/issues/28258.
 */
// wrapFetchWithStepUpDetection 封装MCP 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function wrapFetchWithStepUpDetection(
  baseFetch: FetchLike,
  provider: ClaudeAuthProvider,
): FetchLike {
  // 返回 `async (url, init) => {`，作为MCP 服务这次计算的结果。
  return async (url, init) => {
    // 接口响应保存`baseFetch`，供MCP 服务后续处理使用。
    const response = await baseFetch(url, init)
    // 满足 `response.status === 403` 时，MCP 服务执行该分支。
    if (response.status === 403) {
      // wwwAuth读取`headers.get`，供MCP 服务后续处理使用。
      const wwwAuth = response.headers.get('WWW-Authenticate')
      // 满足 `wwwAuth?.includes('insufficient_scope')` 时，MCP 服务执行该分支。
      if (wwwAuth?.includes('insufficient_scope')) {
        // Match both quoted and unquoted values (RFC 6750 §3 allows either).
        // Same pattern as the SDK's extractFieldFromWwwAuth.
        // match匹配`wwwAuth.match`，供MCP 服务后续处理使用。
        const match = wwwAuth.match(/scope=(?:"([^"]+)"|([^\s,]+))/)
        // scope保存`match?.[1] ?? match?.[2]`，供MCP 服务MCP 服务 auth后续步骤使用。
        const scope = match?.[1] ?? match?.[2]
        // 满足 `scope` 时，MCP 服务执行该分支。
        if (scope) {
          // provider.markStepUpPending执行MCP 服务在此处需要的副作用或外部交互。
          provider.markStepUpPending(scope)
        }
      }
    }
    // 返回 response，把MCP 服务这个分支的结果交还调用方。
    return response
  }
}

// ClaudeAuthProvider 聚合MCP 服务相关状态与操作，把同一职责的行为收束到类实例中。
export class ClaudeAuthProvider implements OAuthClientProvider {
  private serverName: string
  private serverConfig: McpSSEServerConfig | McpHTTPServerConfig
  private redirectUri: string
  private handleRedirection: boolean
  private _codeVerifier?: string
  private _authorizationUrl?: string
  private _state?: string
  private _scopes?: string
  private _metadata?: Awaited<
    ReturnType<typeof discoverAuthorizationServerMetadata>
  >
  private _refreshInProgress?: Promise<OAuthTokens | undefined>
  private _pendingStepUpScope?: string
  // 这个回调绑定到 private onAuthorizationUrlCallback?: (url: string) => void，负责MCP 服务在该局部场景下的响应。
  private onAuthorizationUrlCallback?: (url: string) => void
  private skipBrowserOpen: boolean

  // constructor执行MCP 服务在此处需要的副作用或外部交互。
  constructor(
    serverName: string,
    serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
    redirectUri: string = buildRedirectUri(),
    handleRedirection = false,
    // 这个回调绑定到 onAuthorizationUrl?: (url: string) => void,，负责MCP 服务在该局部场景下的响应。
    onAuthorizationUrl?: (url: string) => void,
    skipBrowserOpen?: boolean,
  ) {
    // 更新实例字段 serverName 为 serverName，同步MCP 服务的内部状态。
    this.serverName = serverName
    // 更新实例字段 serverConfig 为 serverConfig，同步MCP 服务的内部状态。
    this.serverConfig = serverConfig
    // 更新实例字段 redirectUri 为 redirectUri，同步MCP 服务的内部状态。
    this.redirectUri = redirectUri
    // 更新实例字段 handleRedirection 为 handleRedirection，同步MCP 服务的内部状态。
    this.handleRedirection = handleRedirection
    // 更新实例字段 onAuthorizationUrlCallback 为 onAuthorizationUrl，同步MCP 服务的内部状态。
    this.onAuthorizationUrlCallback = onAuthorizationUrl
    // 更新实例字段 skipBrowserOpen 为 skipBrowserOpen ?? false，同步MCP 服务的内部状态。
    this.skipBrowserOpen = skipBrowserOpen ?? false
  }

  // MCP 服务 auth处理 `get redirectUrl(): string {`，完成这一小步状态转换。
  get redirectUrl(): string {
    // 返回 this.redirectUri，把MCP 服务这个分支的结果交还调用方。
    return this.redirectUri
  }

  // MCP 服务 auth处理 `get authorizationUrl(): string | undefined {`，完成这一小步状态转换。
  get authorizationUrl(): string | undefined {
    // 返回 this._authorizationUrl，把MCP 服务这个分支的结果交还调用方。
    return this._authorizationUrl
  }

  // MCP 服务 auth处理 `get clientMetadata(): OAuthClientMetadata {`，完成这一小步状态转换。
  get clientMetadata(): OAuthClientMetadata {
    // metadata集中保存MCP 服务 auth要一起传递的字段。
    const metadata: OAuthClientMetadata = {
      client_name: `Claude Code (${this.serverName})`,
      redirect_uris: [this.redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none', // Public client
    }

    // Include scope from metadata if available
    // metadataScope读取`getScopeFromMetadata`，供MCP 服务后续处理使用。
    const metadataScope = getScopeFromMetadata(this._metadata)
    // 满足 `metadataScope` 时，MCP 服务执行该分支。
    if (metadataScope) {
      // scope更新为 `metadataScope`，确保MCP 服务后续读取最新状态。
      metadata.scope = metadataScope
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Using scope from metadata: ${metadata.scope}`,
      )
    }

    // 返回 metadata，把MCP 服务这个分支的结果交还调用方。
    return metadata
  }

  /**
   * CIMD (SEP-991): URL-based client_id. When the auth server advertises
   * client_id_metadata_document_supported: true, the SDK uses this URL as the
   * client_id instead of performing Dynamic Client Registration.
   * Override via MCP_OAUTH_CLIENT_METADATA_URL env var (e.g. for testing, FedStart).
   */
  // MCP 服务 auth处理 `get clientMetadataUrl(): string | undefined {`，完成这一小步状态转换。
  get clientMetadataUrl(): string | undefined {
    // override保存`process.env.MCP_OAUTH_CLIENT_METADATA_URL`，供MCP 服务MCP 服务 auth后续步骤使用。
    const override = process.env.MCP_OAUTH_CLIENT_METADATA_URL
    // 满足 `override` 时，MCP 服务执行该分支。
    if (override) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `Using CIMD URL from env: ${override}`)
      // 返回 override，把MCP 服务这个分支的结果交还调用方。
      return override
    }
    // 返回 MCP_CLIENT_METADATA_URL，把MCP 服务这个分支的结果交还调用方。
    return MCP_CLIENT_METADATA_URL
  }

  // setMetadata写入新的状态值，使MCP 服务后续读取保持一致。
  setMetadata(
    metadata: Awaited<ReturnType<typeof discoverAuthorizationServerMetadata>>,
  ): void {
    // 更新实例字段 _metadata 为 metadata，同步MCP 服务的内部状态。
    this._metadata = metadata
  }

  /**
   * Called by the fetch wrapper when a 403 insufficient_scope response is
   * detected. Setting this causes tokens() to omit refresh_token, forcing
   * the SDK's authInternal to skip its (useless) refresh path and fall through
   * to startAuthorization → redirectToAuthorization → step-up persistence.
   * RFC 6749 §6 forbids scope elevation via refresh, so refreshing would just
   * return the same-scoped token and the retry would 403 again.
   */
  // markStepUpPending 使用 scope: string 完成MCP 服务里的对应操作。
  markStepUpPending(scope: string): void {
    // 更新实例字段 _pendingStepUpScope 为 scope，同步MCP 服务的内部状态。
    this._pendingStepUpScope = scope
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Marked step-up pending: ${scope}`)
  }

  // state 使用 无 完成MCP 服务里的对应操作。
  async state(): Promise<string> {
    // Generate state if not already generated for this instance
    // this._state 状态缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!this._state) {
      // 更新实例字段 _state 为 randomBytes(32).toString('base64url')，同步MCP 服务的内部状态。
      this._state = randomBytes(32).toString('base64url')
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, 'Generated new OAuth state')
    }
    // 返回 this._state，把MCP 服务这个分支的结果交还调用方。
    return this._state
  }

  // clientInformation 使用 无 完成MCP 服务里的对应操作。
  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // data读取`storage.read`，供MCP 服务后续处理使用。
    const data = storage.read()
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)

    // Check session credentials first (from DCR or previous auth)
    // storedInfo保存`data?.mcpOAuth?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
    const storedInfo = data?.mcpOAuth?.[serverKey]
    // 满足 `storedInfo?.clientId` 时，MCP 服务执行该分支。
    if (storedInfo?.clientId) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `Found client info`)
      // 返回 {，把MCP 服务这个分支的结果交还调用方。
      return {
        client_id: storedInfo.clientId,
        client_secret: storedInfo.clientSecret,
      }
    }

    // Fallback: pre-configured client ID from server config
    // configClientId保存`this.serverConfig.oauth?.clientId`，供MCP 服务MCP 服务 auth后续步骤使用。
    const configClientId = this.serverConfig.oauth?.clientId
    // 满足 `configClientId` 时，MCP 服务执行该分支。
    if (configClientId) {
      // clientConfig保存`data?.mcpOAuthClientConfig?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
      const clientConfig = data?.mcpOAuthClientConfig?.[serverKey]
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `Using pre-configured client ID`)
      // 返回 {，把MCP 服务这个分支的结果交还调用方。
      return {
        client_id: configClientId,
        client_secret: clientConfig?.clientSecret,
      }
    }

    // If we don't have stored client info, return undefined to trigger registration
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `No client info found`)
    // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
    return undefined
  }

  // MCP 服务 auth处理 `async saveClientInformation(`，完成这一小步状态转换。
  async saveClientInformation(
    clientInformation: OAuthClientInformationFull,
  ): Promise<void> {
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // existingData读取`storage.read`，供MCP 服务后续处理使用。
    const existingData = storage.read() || {}
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)

    // updatedData集中保存MCP 服务 auth要一起传递的字段。
    const updatedData: SecureStorageData = {
      ...existingData,
      mcpOAuth: {
        ...existingData.mcpOAuth,
        [serverKey]: {
          ...existingData.mcpOAuth?.[serverKey],
          serverName: this.serverName,
          serverUrl: this.serverConfig.url,
          clientId: clientInformation.client_id,
          clientSecret: clientInformation.client_secret,
          // Provide default values for required fields if not present
          accessToken: existingData.mcpOAuth?.[serverKey]?.accessToken || '',
          expiresAt: existingData.mcpOAuth?.[serverKey]?.expiresAt || 0,
        },
      },
    }

    // storage.update执行MCP 服务在此处需要的副作用或外部交互。
    storage.update(updatedData)
  }

  // tokens 使用 无 完成MCP 服务里的对应操作。
  async tokens(): Promise<OAuthTokens | undefined> {
    // Cross-process token changes (another CC instance refreshed or invalidated)
    // are picked up via the keychain cache TTL (see macOsKeychainStorage.ts).
    // In-process writes already invalidate the cache via storage.update().
    // We do NOT clearKeychainCache() here — tokens() is called by the MCP SDK's
    // _commonHeaders on every request, and forcing a cache miss would trigger
    // a blocking spawnSync(`security find-generic-password`) 30-40x/sec.
    // See CPU profile: spawnSync was 7.2% of total CPU after PR #19436.
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // data读取`storage.readAsync`，供MCP 服务后续处理使用。
    const data = await storage.readAsync()
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)

    // tokenData保存`data?.mcpOAuth?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
    const tokenData = data?.mcpOAuth?.[serverKey]

    // XAA: a cached id_token plays the same UX role as a refresh_token — run
    // the silent exchange to get a fresh access_token without a browser. The
    // id_token does expire (we re-acquire via `xaa login` when it does); the
    // point is that while it's valid, re-auth is zero-interaction.
    //
    // Only fire when we don't have a refresh_token. If the AS returned one,
    // the normal refresh path (below) is cheaper — 1 request vs the 4-request
    // XAA chain. If that refresh is revoked, refreshAuthorization() clears it
    // (invalidateCredentials('tokens')), and the next tokens() falls through
    // to here.
    //
    // Fires on:
    //   - never authed (!tokenData)                 → first connect, auto-auth
    //   - SDK partial write {accessToken:''}        → stale from past session
    //   - expired/expiring, no refresh_token        → proactive XAA re-auth
    //
    // No special-casing of {accessToken:'', expiresAt:0}. Yes, SDK auth()
    // writes that mid-flow (saveClientInformation defaults). But with this
    // auto-auth branch, the *first* tokens() call — before auth() writes
    // anything — fires xaaRefresh. If id_token is cached, SDK short-circuits
    // there and never reaches the write. If id_token isn't cached, xaaRefresh
    // returns undefined in ~1 keychain read, auth() proceeds, writes the
    // marker, calls tokens() again, xaaRefresh fails again identically.
    // Harmless redundancy, not a wasted exchange. And guarding on `!==''`
    // permanently bricks auto-auth when a *prior* session left that marker
    // in keychain — real bug seen with xaa.dev.
    //
    // xaaRefresh() internally short-circuits to undefined when the id_token
    // isn't cached (or settings.xaaIdp is gone) → we fall through to the
    // existing needs-auth path → user runs `xaa login`.
    //
    // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
    if (
      isXaaEnabled() &&
      this.serverConfig.oauth?.xaa &&
      !tokenData?.refreshToken &&
      (!tokenData?.accessToken ||
        (tokenData.expiresAt - Date.now()) / 1000 <= 300)
    ) {
      // this._refreshInProgress 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!this._refreshInProgress) {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          tokenData
            ? `XAA: access_token expiring, attempting silent exchange`
            : `XAA: no access_token yet, attempting silent exchange`,
        )
        // 更新实例字段 _refreshInProgress 为 this.xaaRefresh().finally(() => {，同步MCP 服务的内部状态。
        this._refreshInProgress = this.xaaRefresh().finally(() => {
          // 更新实例字段 _refreshInProgress 为 undefined，同步MCP 服务的内部状态。
          this._refreshInProgress = undefined
        })
      }
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // refreshed等待 `this._refreshInProgress`，确保继续执行前已有结果。
        const refreshed = await this._refreshInProgress
        // 判断 refreshed，将MCP 服务分流到只适用于该条件的处理路径。
        if (refreshed) return refreshed
      } catch (e) {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `XAA silent exchange failed: ${errorMessage(e)}`,
        )
      }
      // Fall through. Either id_token isn't cached (xaaRefresh returned
      // undefined) or the exchange errored. Normal path below handles both:
      // !tokenData → undefined → 401 → needs-auth; expired → undefined → same.
    }

    // tokenData缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!tokenData) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `No token data found`)
      // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
      return undefined
    }

    // Check if token is expired
    // expiresIn记录时间`Date.now`，供MCP 服务后续处理使用。
    const expiresIn = (tokenData.expiresAt - Date.now()) / 1000

    // Step-up check: if a 403 insufficient_scope was detected and the current
    // token doesn't have the requested scope, omit refresh_token below so the
    // SDK skips refresh and falls through to the PKCE flow.
    // currentScopes 集合格式化`split`，供MCP 服务后续处理使用。
    const currentScopes = tokenData.scope?.split(' ') ?? []
    // needsStepUp 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const needsStepUp =
      this._pendingStepUpScope !== undefined &&
      // this._pendingStepUpScope.split执行MCP 服务在此处需要的副作用或外部交互。
      this._pendingStepUpScope.split(' ').some(s => !currentScopes.includes(s))
    // 满足 `needsStepUp` 时，MCP 服务执行该分支。
    if (needsStepUp) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Step-up pending (${this._pendingStepUpScope}), omitting refresh_token`,
      )
    }

    // If token is expired and we don't have a refresh token, return undefined
    // 组合条件 `expiresIn <= 0 && !tokenData.refreshToken` 成立时，MCP 服务才启用这条专门路径。
    if (expiresIn <= 0 && !tokenData.refreshToken) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `Token expired without refresh token`)
      // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
      return undefined
    }

    // If token is expired or about to expire (within 5 minutes) and we have a refresh token, refresh it proactively.
    // This proactive refresh is a UX improvement - it avoids the latency of a failed request followed by token refresh.
    // While MCP servers should return 401 for expired tokens (which triggers SDK-level refresh), proactively refreshing
    // before expiry provides a smoother user experience.
    // Skip when step-up is pending — refreshing can't elevate scope (RFC 6749 §6).
    // 组合条件 `expiresIn <= 300 && tokenData.refreshToken && !ne` 成立时，MCP 服务才启用这条专门路径。
    if (expiresIn <= 300 && tokenData.refreshToken && !needsStepUp) {
      // Reuse existing refresh promise if one is in progress to prevent concurrent refreshes
      // this._refreshInProgress 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!this._refreshInProgress) {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Token expires in ${Math.floor(expiresIn)}s, attempting proactive refresh`,
        )
        // 更新实例字段 _refreshInProgress 为 this.refreshAuthorization(，同步MCP 服务的内部状态。
        this._refreshInProgress = this.refreshAuthorization(
          tokenData.refreshToken,
        // 这个回调绑定到 ).finally(() => {，负责MCP 服务在该局部场景下的响应。
        ).finally(() => {
          // 更新实例字段 _refreshInProgress 为 undefined，同步MCP 服务的内部状态。
          this._refreshInProgress = undefined
        })
      } else {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Token refresh already in progress, reusing existing promise`,
        )
      }

      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // refreshed等待 `this._refreshInProgress`，确保继续执行前已有结果。
        const refreshed = await this._refreshInProgress
        // 满足 `refreshed` 时，MCP 服务执行该分支。
        if (refreshed) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(this.serverName, `Token refreshed successfully`)
          // 返回 refreshed，把MCP 服务这个分支的结果交还调用方。
          return refreshed
        }
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Token refresh failed, returning current tokens`,
        )
      } catch (error) {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Token refresh error: ${errorMessage(error)}`,
        )
      }
    }

    // Return current tokens (may be expired if refresh failed or not needed yet)
    // tokens 集合集中保存MCP 服务MCP 服务 auth要一起传递的字段。
    const tokens = {
      access_token: tokenData.accessToken,
      refresh_token: needsStepUp ? undefined : tokenData.refreshToken,
      expires_in: expiresIn,
      scope: tokenData.scope,
      token_type: 'Bearer',
    }

    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Returning tokens`)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Token length: ${tokens.access_token?.length}`)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Has refresh token: ${!!tokens.refresh_token}`)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Expires in: ${Math.floor(expiresIn)}s`)

    // 返回 tokens，把MCP 服务这个分支的结果交还调用方。
    return tokens
  }

  // saveTokens 使用 tokens: OAuthTokens 完成MCP 服务里的对应操作。
  async saveTokens(tokens: OAuthTokens): Promise<void> {
    // 更新实例字段 _pendingStepUpScope 为 undefined，同步MCP 服务的内部状态。
    this._pendingStepUpScope = undefined
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // existingData读取`storage.read`，供MCP 服务后续处理使用。
    const existingData = storage.read() || {}
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)

    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Saving tokens`)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Token expires in: ${tokens.expires_in}`)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Has refresh token: ${!!tokens.refresh_token}`)

    // updatedData集中保存MCP 服务 auth要一起传递的字段。
    const updatedData: SecureStorageData = {
      ...existingData,
      mcpOAuth: {
        ...existingData.mcpOAuth,
        [serverKey]: {
          ...existingData.mcpOAuth?.[serverKey],
          serverName: this.serverName,
          serverUrl: this.serverConfig.url,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
          scope: tokens.scope,
        },
      },
    }

    // storage.update执行MCP 服务在此处需要的副作用或外部交互。
    storage.update(updatedData)
  }

  /**
   * XAA silent refresh: cached id_token → Layer-2 exchange → new access_token.
   * No browser.
   *
   * Returns undefined if the id_token is gone from cache — caller treats this
   * as needs-interactive-reauth (transport will 401, CC surfaces it).
   *
   * On exchange failure, clears the id_token cache so the next interactive
   * auth does a fresh IdP login (the cached id_token is likely stale/revoked).
   *
   * TODO(xaa-ga): add cross-process lockfile before GA. `_refreshInProgress`
   * only dedupes within one process — two CC instances with expiring tokens
   * both fire the full 4-request XAA chain and race on storage.update().
   * Unlike inc-4829 the id_token is not single-use so both access_tokens
   * stay valid (wasted round-trips + keychain write race, not brickage),
   * but this is the shape CLAUDE.md flags under "Token/auth caching across
   * process boundaries". Mirror refreshAuthorization()'s lockfile pattern.
   */
  // MCP 服务 auth处理 `private async xaaRefresh(): Promise<OAuthTokens | undefined> {`，完成这一小步状态转换。
  private async xaaRefresh(): Promise<OAuthTokens | undefined> {
    // idp读取`getXaaIdpSettings`，供MCP 服务后续处理使用。
    const idp = getXaaIdpSettings()
    // 判断 !idp，将MCP 服务分流到只适用于该条件的处理路径。
    if (!idp) return undefined // config was removed mid-session

    // idToken读取`getCachedIdpIdToken`，供MCP 服务后续处理使用。
    const idToken = getCachedIdpIdToken(idp.issuer)
    // idToken缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!idToken) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        'XAA: id_token not cached, needs interactive re-auth',
      )
      // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
      return undefined
    }

    // clientId保存`this.serverConfig.oauth?.clientId`，供MCP 服务MCP 服务 auth后续步骤使用。
    const clientId = this.serverConfig.oauth?.clientId
    // clientConfig读取`getMcpClientConfig`，供MCP 服务后续处理使用。
    const clientConfig = getMcpClientConfig(this.serverName, this.serverConfig)
    // 组合条件 `!clientId || !clientConfig?.clientSecret` 成立时，MCP 服务才启用这条专门路径。
    if (!clientId || !clientConfig?.clientSecret) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        'XAA: missing clientId or clientSecret in config — skipping silent refresh',
      )
      // 返回 undefined // shouldn't happen if `mcp add` was correct，把MCP 服务这个分支的结果交还调用方。
      return undefined // shouldn't happen if `mcp add` was correct
    }

    // idpClientSecret读取`getIdpClientSecret`，供MCP 服务后续处理使用。
    const idpClientSecret = getIdpClientSecret(idp.issuer)

    // Discover IdP token endpoint. Could cache (fetchCache.ts already
    // caches /.well-known/ requests), but OIDC metadata is cheap + idempotent.
    // xaaRefresh is the silent tokens() path — soft-fail to undefined so the
    // caller falls through to needs-authentication instead of throwing mid-connect.
    // oidc 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let oidc
    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // oidc更新为 `await discoverOidc(idp.issuer)`，确保MCP 服务后续读取最新状态。
      oidc = await discoverOidc(idp.issuer)
    } catch (e) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `XAA: OIDC discovery failed in silent refresh: ${errorMessage(e)}`,
      )
      // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
      return undefined
    }

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // tokens 集合保存`performCrossAppAccess`，供MCP 服务后续处理使用。
      const tokens = await performCrossAppAccess(
        this.serverConfig.url,
        {
          clientId,
          clientSecret: clientConfig.clientSecret,
          idpClientId: idp.clientId,
          idpClientSecret,
          idpIdToken: idToken,
          idpTokenEndpoint: oidc.token_endpoint,
        },
        this.serverName,
      )
      // Write directly (not via saveTokens) so clientId + clientSecret land in
      // storage even when this is the first write for serverKey. saveTokens
      // only spreads existing data; if no prior performMCPXaaAuth ran,
      // revokeServerTokens would later read tokenData.clientId as undefined
      // and send a client_id-less RFC 7009 request that strict ASes reject.
      // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
      const storage = getSecureStorage()
      // existingData读取`storage.read`，供MCP 服务后续处理使用。
      const existingData = storage.read() || {}
      // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
      const serverKey = getServerKey(this.serverName, this.serverConfig)
      // prev保存`existingData.mcpOAuth?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
      const prev = existingData.mcpOAuth?.[serverKey]
      // storage.update执行MCP 服务在此处需要的副作用或外部交互。
      storage.update({
        ...existingData,
        mcpOAuth: {
          ...existingData.mcpOAuth,
          [serverKey]: {
            ...prev,
            serverName: this.serverName,
            serverUrl: this.serverConfig.url,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? prev?.refreshToken,
            expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
            scope: tokens.scope,
            clientId,
            clientSecret: clientConfig.clientSecret,
            discoveryState: {
              authorizationServerUrl: tokens.authorizationServerUrl,
            },
          },
        },
      })
      // 返回 {，把MCP 服务这个分支的结果交还调用方。
      return {
        access_token: tokens.access_token,
        token_type: 'Bearer',
        expires_in: tokens.expires_in,
        scope: tokens.scope,
        refresh_token: tokens.refresh_token,
      }
    } catch (e) {
      // 组合条件 `e instanceof XaaTokenExchangeError && e.shouldCle` 成立时，MCP 服务才启用这条专门路径。
      if (e instanceof XaaTokenExchangeError && e.shouldClearIdToken) {
        // clearIdpIdToken执行MCP 服务在此处需要的副作用或外部交互。
        clearIdpIdToken(idp.issuer)
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          'XAA: cleared id_token after exchange failure',
        )
      }
      // 抛出 e，阻止MCP 服务在无效状态下继续运行。
      throw e
    }
  }

  // redirectToAuthorization 使用 authorizationUrl: URL 完成MCP 服务里的对应操作。
  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    // Store the authorization URL
    // 更新实例字段 _authorizationUrl 为 authorizationUrl.toString()，同步MCP 服务的内部状态。
    this._authorizationUrl = authorizationUrl.toString()

    // Extract and store scopes from the authorization URL for later use in token exchange
    // scopes 集合读取`searchParams.get`，供MCP 服务后续处理使用。
    const scopes = authorizationUrl.searchParams.get('scope')
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(
      this.serverName,
      `Authorization URL: ${redactSensitiveUrlParams(authorizationUrl.toString())}`,
    )
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Scopes in URL: ${scopes || 'NOT FOUND'}`)

    // 满足 `scopes` 时，MCP 服务执行该分支。
    if (scopes) {
      // 更新实例字段 _scopes 为 scopes，同步MCP 服务的内部状态。
      this._scopes = scopes
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Captured scopes from authorization URL: ${scopes}`,
      )
    } else {
      // If no scope in URL, try to get it from metadata
      // metadataScope读取`getScopeFromMetadata`，供MCP 服务后续处理使用。
      const metadataScope = getScopeFromMetadata(this._metadata)
      // 满足 `metadataScope` 时，MCP 服务执行该分支。
      if (metadataScope) {
        // 更新实例字段 _scopes 为 metadataScope，同步MCP 服务的内部状态。
        this._scopes = metadataScope
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Using scopes from metadata: ${metadataScope}`,
        )
      } else {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(this.serverName, `No scopes available from URL or metadata`)
      }
    }

    // Persist scope for step-up auth: only when the transport-attached provider
    // (handleRedirection=false) receives a step-up 401. The SDK calls auth()
    // which calls redirectToAuthorization with the new scope. We persist it
    // so the next performMCPOAuthFlow can use it without an extra probe request.
    // Guard with !handleRedirection to avoid persisting during normal auth flows
    // (where the scope may come from metadata scopes_supported rather than a 401).
    // 组合条件 `this._scopes && !this.handleRedirection` 成立时，MCP 服务才启用这条专门路径。
    if (this._scopes && !this.handleRedirection) {
      // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
      const storage = getSecureStorage()
      // existingData读取`storage.read`，供MCP 服务后续处理使用。
      const existingData = storage.read() || {}
      // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
      const serverKey = getServerKey(this.serverName, this.serverConfig)
      // existing保存`existingData.mcpOAuth?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
      const existing = existingData.mcpOAuth?.[serverKey]
      // 满足 `existing` 时，MCP 服务执行该分支。
      if (existing) {
        // stepUpScope更新为 `this._scopes`，确保MCP 服务后续读取最新状态。
        existing.stepUpScope = this._scopes
        // storage.update执行MCP 服务在此处需要的副作用或外部交互。
        storage.update(existingData)
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(this.serverName, `Persisted step-up scope: ${this._scopes}`)
      }
    }

    // this.handleRedirection缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!this.handleRedirection) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Redirection handling is disabled, skipping redirect`,
      )
      // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }

    // Validate URL scheme for security
    // urlString格式化`authorizationUrl.toString`，供MCP 服务后续处理使用。
    const urlString = authorizationUrl.toString()
    // 判断 !urlString.startsWith('http://') && !urlString.startsWith('https://')，将MCP 服务分流到只适用于该条件的处理路径。
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
      throw new Error(
        'Invalid authorization URL: must use http:// or https:// scheme',
      )
    }

    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Redirecting to authorization URL`)
    // redactedUrl保存`redactSensitiveUrlParams`，供MCP 服务后续处理使用。
    const redactedUrl = redactSensitiveUrlParams(urlString)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Authorization URL: ${redactedUrl}`)

    // Notify the UI about the authorization URL BEFORE opening the browser,
    // so users can see the URL as a fallback if the browser fails to open
    // 满足 `this.onAuthorizationUrlCallback` 时，MCP 服务执行该分支。
    if (this.onAuthorizationUrlCallback) {
      // this.onAuthorizationUrlCallback执行MCP 服务在此处需要的副作用或外部交互。
      this.onAuthorizationUrlCallback(urlString)
    }

    // this.skipBrowserOpen缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!this.skipBrowserOpen) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `Opening authorization URL: ${redactedUrl}`)

      // success 集合保存`openBrowser`，供MCP 服务后续处理使用。
      const success = await openBrowser(urlString)
      // success 集合缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
      if (!success) {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Browser didn't open automatically. URL is shown in UI.`,
        )
      }
    } else {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Skipping browser open (skipBrowserOpen=true). URL: ${redactedUrl}`,
      )
    }
  }

  // saveCodeVerifier 使用 codeVerifier: string 完成MCP 服务里的对应操作。
  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Saving code verifier`)
    // 更新实例字段 _codeVerifier 为 codeVerifier，同步MCP 服务的内部状态。
    this._codeVerifier = codeVerifier
  }

  // codeVerifier 使用 无 完成MCP 服务里的对应操作。
  async codeVerifier(): Promise<string> {
    // this._codeVerifier缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!this._codeVerifier) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(this.serverName, `No code verifier saved`)
      // 抛出 new Error('No code verifier saved')，阻止MCP 服务在无效状态下继续运行。
      throw new Error('No code verifier saved')
    }
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Returning code verifier`)
    // 返回 this._codeVerifier，把MCP 服务这个分支的结果交还调用方。
    return this._codeVerifier
  }

  // MCP 服务 auth处理 `async invalidateCredentials(`，完成这一小步状态转换。
  async invalidateCredentials(
    scope: 'all' | 'client' | 'tokens' | 'verifier' | 'discovery',
  ): Promise<void> {
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // existingData读取`storage.read`，供MCP 服务后续处理使用。
    const existingData = storage.read()
    // 判断 !existingData?.mcpOAuth，将MCP 服务分流到只适用于该条件的处理路径。
    if (!existingData?.mcpOAuth) return

    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)
    // tokenData保存`existingData.mcpOAuth[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
    const tokenData = existingData.mcpOAuth[serverKey]
    // 判断 !tokenData，将MCP 服务分流到只适用于该条件的处理路径。
    if (!tokenData) return

    // 按照 scope 的取值选择MCP 服务的具体处理分支。
    switch (scope) {
      case 'all':
        // MCP 服务 auth处理 `delete existingData.mcpOAuth[serverKey]`，完成这一小步状态转换。
        delete existingData.mcpOAuth[serverKey]
        // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
        break
      case 'client':
        // clientId更新为 `undefined`，确保MCP 服务后续读取最新状态。
        tokenData.clientId = undefined
        // clientSecret更新为 `undefined`，确保MCP 服务后续读取最新状态。
        tokenData.clientSecret = undefined
        // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
        break
      case 'tokens':
        // accessToken更新为 `''`，确保MCP 服务后续读取最新状态。
        tokenData.accessToken = ''
        // refreshToken更新为 `undefined`，确保MCP 服务后续读取最新状态。
        tokenData.refreshToken = undefined
        // expiresAt更新为 `0`，确保MCP 服务后续读取最新状态。
        tokenData.expiresAt = 0
        // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
        break
      case 'verifier':
        // 更新实例字段 _codeVerifier 为 undefined，同步MCP 服务的内部状态。
        this._codeVerifier = undefined
        // MCP 服务 auth在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      case 'discovery':
        // discoveryState 状态更新为 `undefined`，确保MCP 服务后续读取最新状态。
        tokenData.discoveryState = undefined
        // stepUpScope更新为 `undefined`，确保MCP 服务后续读取最新状态。
        tokenData.stepUpScope = undefined
        // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
        break
    }

    // storage.update执行MCP 服务在此处需要的副作用或外部交互。
    storage.update(existingData)
    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(this.serverName, `Invalidated credentials (scope: ${scope})`)
  }

  // saveDiscoveryState 使用 state: OAuthDiscoveryState 完成MCP 服务里的对应操作。
  async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // existingData读取`storage.read`，供MCP 服务后续处理使用。
    const existingData = storage.read() || {}
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)

    // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
    logMCPDebug(
      this.serverName,
      `Saving discovery state (authServer: ${state.authorizationServerUrl})`,
    )

    // Persist only the URLs, NOT the full metadata blobs.
    // authorizationServerMetadata alone is ~1.5-2KB per MCP server (every
    // grant type, PKCE method, endpoint the IdP supports). On macOS the
    // keychain write goes through `security -i` which has a 4096-byte stdin
    // line limit — with hex encoding that's ~2013 bytes of JSON total. Two
    // OAuth MCP servers persisting full metadata overflows it, corrupting
    // the credential store (#30337). The SDK re-fetches missing metadata
    // with one HTTP GET on the next auth — see node_modules/.../auth.js
    // `cachedState.authorizationServerMetadata ?? await discover...`.
    // updatedData集中保存MCP 服务 auth要一起传递的字段。
    const updatedData: SecureStorageData = {
      ...existingData,
      mcpOAuth: {
        ...existingData.mcpOAuth,
        [serverKey]: {
          ...existingData.mcpOAuth?.[serverKey],
          serverName: this.serverName,
          serverUrl: this.serverConfig.url,
          accessToken: existingData.mcpOAuth?.[serverKey]?.accessToken || '',
          expiresAt: existingData.mcpOAuth?.[serverKey]?.expiresAt || 0,
          discoveryState: {
            authorizationServerUrl: state.authorizationServerUrl,
            resourceMetadataUrl: state.resourceMetadataUrl,
          },
        },
      },
    }

    // storage.update执行MCP 服务在此处需要的副作用或外部交互。
    storage.update(updatedData)
  }

  // discoveryState 使用 无 完成MCP 服务里的对应操作。
  async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
    // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
    const storage = getSecureStorage()
    // data读取`storage.read`，供MCP 服务后续处理使用。
    const data = storage.read()
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)

    // cached 缓存保存`data?.mcpOAuth?.[serverKey]?.discoveryState`，供MCP 服务MCP 服务 auth后续步骤使用。
    const cached = data?.mcpOAuth?.[serverKey]?.discoveryState
    // 满足 `cached?.authorizationServerUrl` 时，MCP 服务执行该分支。
    if (cached?.authorizationServerUrl) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Returning cached discovery state (authServer: ${cached.authorizationServerUrl})`,
      )

      // 返回 {，把MCP 服务这个分支的结果交还调用方。
      return {
        authorizationServerUrl: cached.authorizationServerUrl,
        resourceMetadataUrl: cached.resourceMetadataUrl,
        resourceMetadata:
          cached.resourceMetadata as OAuthDiscoveryState['resourceMetadata'],
        authorizationServerMetadata:
          cached.authorizationServerMetadata as OAuthDiscoveryState['authorizationServerMetadata'],
      }
    }

    // Check config hint for direct metadata URL
    // metadataUrl保存`this.serverConfig.oauth?.authServerMetadataUrl`，供MCP 服务MCP 服务 auth后续步骤使用。
    const metadataUrl = this.serverConfig.oauth?.authServerMetadataUrl
    // 满足 `metadataUrl` 时，MCP 服务执行该分支。
    if (metadataUrl) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Fetching metadata from configured URL: ${metadataUrl}`,
      )
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // metadata读取`fetchAuthServerMetadata`，供MCP 服务后续处理使用。
        const metadata = await fetchAuthServerMetadata(
          this.serverName,
          this.serverConfig.url,
          metadataUrl,
        )
        // 满足 `metadata` 时，MCP 服务执行该分支。
        if (metadata) {
          // 返回 {，把MCP 服务这个分支的结果交还调用方。
          return {
            authorizationServerUrl: metadata.issuer,
            authorizationServerMetadata:
              metadata as OAuthDiscoveryState['authorizationServerMetadata'],
          }
        }
      } catch (error) {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Failed to fetch from configured metadata URL: ${errorMessage(error)}`,
        )
      }
    }

    // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
    return undefined
  }

  // MCP 服务 auth处理 `async refreshAuthorization(`，完成这一小步状态转换。
  async refreshAuthorization(
    refreshToken: string,
  ): Promise<OAuthTokens | undefined> {
    // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
    const serverKey = getServerKey(this.serverName, this.serverConfig)
    // claudeDir读取`getClaudeConfigHomeDir`，供MCP 服务后续处理使用。
    const claudeDir = getClaudeConfigHomeDir()
    // 等待 `mkdir(claudeDir, { recursive: true })` 完成，再继续MCP 服务 auth的异步流程。
    await mkdir(claudeDir, { recursive: true })
    // sanitizedKey格式化`serverKey.replace`，供MCP 服务后续处理使用。
    const sanitizedKey = serverKey.replace(/[^a-zA-Z0-9]/g, '_')
    // lockfilePath 文件数据格式化`join`，供MCP 服务后续处理使用。
    const lockfilePath = join(claudeDir, `mcp-refresh-${sanitizedKey}.lock`)

    // 这个回调绑定到 let release: (() => Promise<void>) | undefined，负责MCP 服务在该局部场景下的响应。
    let release: (() => Promise<void>) | undefined
    // 遍历 let retry = 0; retry < MAX_LOCK_RETRIES; retry++，让MCP 服务逐项完成同一类处理。
    for (let retry = 0; retry < MAX_LOCK_RETRIES; retry++) {
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Acquiring refresh lock (attempt ${retry + 1})`,
        )
        // release更新为 `await lockfile.lock(lockfilePath, {`，确保MCP 服务后续读取最新状态。
        release = await lockfile.lock(lockfilePath, {
          realpath: false,
          // 这个回调绑定到 onCompromised: () => {，负责MCP 服务在该局部场景下的响应。
          onCompromised: () => {
            // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
            logMCPDebug(this.serverName, `Refresh lock was compromised`)
          },
        })
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(this.serverName, `Acquired refresh lock`)
        // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
        break
      } catch (e: unknown) {
        // code读取`getErrnoCode`，供MCP 服务后续处理使用。
        const code = getErrnoCode(e)
        // `code` 命中特定值 `'ELOCKED'` 时，进入MCP 服务对应处理。
        if (code === 'ELOCKED') {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(
            this.serverName,
            `Refresh lock held by another process, waiting (attempt ${retry + 1}/${MAX_LOCK_RETRIES})`,
          )
          // 等待 `sleep(1000 + Math.random() * 1000)` 完成，再继续MCP 服务 auth的异步流程。
          await sleep(1000 + Math.random() * 1000)
          // 跳过当前项，继续处理MCP 服务中的下一轮循环。
          continue
        }
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Failed to acquire refresh lock: ${code}, proceeding without lock`,
        )
        // 结束这个分支或循环，避免MCP 服务继续落入后续路径。
        break
      }
    }
    // release缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
    if (!release) {
      // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
      logMCPDebug(
        this.serverName,
        `Could not acquire refresh lock after ${MAX_LOCK_RETRIES} retries, proceeding without lock`,
      )
    }

    // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
    try {
      // Re-read tokens after acquiring lock — another process may have refreshed
      // clearKeychainCache执行MCP 服务在此处需要的副作用或外部交互。
      clearKeychainCache()
      // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
      const storage = getSecureStorage()
      // data读取`storage.read`，供MCP 服务后续处理使用。
      const data = storage.read()
      // tokenData保存`data?.mcpOAuth?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
      const tokenData = data?.mcpOAuth?.[serverKey]
      // 满足 `tokenData` 时，MCP 服务执行该分支。
      if (tokenData) {
        // expiresIn记录时间`Date.now`，供MCP 服务后续处理使用。
        const expiresIn = (tokenData.expiresAt - Date.now()) / 1000
        // 满足 `expiresIn > 300` 时，MCP 服务执行该分支。
        if (expiresIn > 300) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(
            this.serverName,
            `Another process already refreshed tokens (expires in ${Math.floor(expiresIn)}s)`,
          )
          // 返回 {，把MCP 服务这个分支的结果交还调用方。
          return {
            access_token: tokenData.accessToken,
            refresh_token: tokenData.refreshToken,
            expires_in: expiresIn,
            scope: tokenData.scope,
            token_type: 'Bearer',
          }
        }
        // Use the freshest refresh token from storage
        // 满足 `tokenData.refreshToken` 时，MCP 服务执行该分支。
        if (tokenData.refreshToken) {
          // refreshToken更新为 `tokenData.refreshToken`，确保MCP 服务后续读取最新状态。
          refreshToken = tokenData.refreshToken
        }
      }
      // 返回 await this._doRefresh(refreshToken)，把MCP 服务这个分支的结果交还调用方。
      return await this._doRefresh(refreshToken)
    } finally {
      // 满足 `release` 时，MCP 服务执行该分支。
      if (release) {
        // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
        try {
          // 等待 `release()` 完成，再继续MCP 服务 auth的异步流程。
          await release()
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(this.serverName, `Released refresh lock`)
        } catch {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(this.serverName, `Failed to release refresh lock`)
        }
      }
    }
  }

  // MCP 服务 auth处理 `private async _doRefresh(`，完成这一小步状态转换。
  private async _doRefresh(
    refreshToken: string,
  ): Promise<OAuthTokens | undefined> {
    // MAX_ATTEMPTS 集合保存`3`，供MCP 服务MCP 服务 auth后续步骤使用。
    const MAX_ATTEMPTS = 3

    // mcpServerBaseUrl读取`getLoggingSafeMcpBaseUrl`，供MCP 服务后续处理使用。
    const mcpServerBaseUrl = getLoggingSafeMcpBaseUrl(this.serverConfig)
    // emitRefreshEvent保存`(`，供MCP 服务MCP 服务 auth后续步骤使用。
    const emitRefreshEvent = (
      outcome: 'success' | 'failure',
      reason?: MCPRefreshFailureReason,
    ): void => {
      // 记录MCP 服务运行诊断，方便排查异常路径或性能问题。
      logEvent(
        outcome === 'success'
          ? 'tengu_mcp_oauth_refresh_success'
          : 'tengu_mcp_oauth_refresh_failure',
        {
          transportType: this.serverConfig
            .type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          ...(mcpServerBaseUrl
            ? {
                mcpServerBaseUrl:
                  mcpServerBaseUrl as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
          ...(reason
            ? {
                reason:
                  reason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              }
            : {}),
        },
      )
    }

    // 遍历 let attempt = 1; attempt <= MAX_ATTEMPTS; attempt，让MCP 服务逐项完成同一类处理。
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // 保护这一段可能失败的MCP 服务操作，确保异常能进入相邻错误处理。
      try {
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(this.serverName, `Starting token refresh`)
        // authFetch构建`createAuthFetch`，供MCP 服务后续处理使用。
        const authFetch = createAuthFetch()

        // Reuse cached metadata from the initial OAuth flow if available,
        // since metadata (token endpoint URL, etc.) is static per auth server.
        // Priority:
        // 1. In-memory cache (same-session refreshes)
        // 2. Persisted discovery state from initial auth (cross-session) —
        //    avoids re-running RFC 9728 discovery on every refresh.
        // 3. Full RFC 9728 → RFC 8414 re-discovery via fetchAuthServerMetadata.
        // metadata保存`this._metadata`，供MCP 服务MCP 服务 auth后续步骤使用。
        let metadata = this._metadata
        // metadata缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!metadata) {
          // cached 缓存保存`this.discoveryState`，供MCP 服务后续处理使用。
          const cached = await this.discoveryState()
          // 满足 `cached?.authorizationServerMetadata` 时，MCP 服务执行该分支。
          if (cached?.authorizationServerMetadata) {
            // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
            logMCPDebug(
              this.serverName,
              `Using persisted auth server metadata for refresh`,
            )
            // metadata更新为 `cached.authorizationServerMetadata`，确保MCP 服务后续读取最新状态。
            metadata = cached.authorizationServerMetadata
          // `cached?.authorizationServerUrl` 成立时，MCP 服务 auth切换到这个 else-if 分支。
          } else if (cached?.authorizationServerUrl) {
            // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
            logMCPDebug(
              this.serverName,
              `Re-discovering metadata from persisted auth server URL: ${cached.authorizationServerUrl}`,
            )
            // metadata更新为 `await discoverAuthorizationServerMetadata(`，确保MCP 服务后续读取最新状态。
            metadata = await discoverAuthorizationServerMetadata(
              cached.authorizationServerUrl,
              { fetchFn: authFetch },
            )
          }
        }
        // metadata缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!metadata) {
          // metadata更新为 `await fetchAuthServerMetadata(`，确保MCP 服务后续读取最新状态。
          metadata = await fetchAuthServerMetadata(
            this.serverName,
            this.serverConfig.url,
            this.serverConfig.oauth?.authServerMetadataUrl,
            authFetch,
          )
        }
        // metadata缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!metadata) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(this.serverName, `Failed to discover OAuth metadata`)
          // emitRefreshEvent执行MCP 服务在此处需要的副作用或外部交互。
          emitRefreshEvent('failure', 'metadata_discovery_failed')
          // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
          return undefined
        }
        // Cache for future refreshes
        // 更新实例字段 _metadata 为 metadata，同步MCP 服务的内部状态。
        this._metadata = metadata

        // clientInfo格式化`this.clientInformation`，供MCP 服务后续处理使用。
        const clientInfo = await this.clientInformation()
        // clientInfo缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
        if (!clientInfo) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(this.serverName, `No client information available`)
          // emitRefreshEvent执行MCP 服务在此处需要的副作用或外部交互。
          emitRefreshEvent('failure', 'no_client_info')
          // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
          return undefined
        }

        // newTokens 集合保存`sdkRefreshAuthorization`，供MCP 服务后续处理使用。
        const newTokens = await sdkRefreshAuthorization(
          new URL(this.serverConfig.url),
          {
            metadata,
            clientInformation: clientInfo,
            refreshToken,
            resource: new URL(this.serverConfig.url),
            fetchFn: authFetch,
          },
        )

        // 满足 `newTokens` 时，MCP 服务执行该分支。
        if (newTokens) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(this.serverName, `Token refresh successful`)
          // 等待 `this.saveTokens(newTokens)` 完成，再继续MCP 服务 auth的异步流程。
          await this.saveTokens(newTokens)
          // emitRefreshEvent执行MCP 服务在此处需要的副作用或外部交互。
          emitRefreshEvent('success')
          // 返回 newTokens，把MCP 服务这个分支的结果交还调用方。
          return newTokens
        }

        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(this.serverName, `Token refresh returned no tokens`)
        // emitRefreshEvent执行MCP 服务在此处需要的副作用或外部交互。
        emitRefreshEvent('failure', 'no_tokens_returned')
        // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
        return undefined
      } catch (error) {
        // Invalid grant means the refresh token itself is invalid/revoked/expired.
        // But another process may have already refreshed successfully — check first.
        // 满足 `error instanceof InvalidGrantError` 时，MCP 服务执行该分支。
        if (error instanceof InvalidGrantError) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(
            this.serverName,
            `Token refresh failed with invalid_grant: ${error.message}`,
          )
          // clearKeychainCache执行MCP 服务在此处需要的副作用或外部交互。
          clearKeychainCache()
          // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
          const storage = getSecureStorage()
          // data读取`storage.read`，供MCP 服务后续处理使用。
          const data = storage.read()
          // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
          const serverKey = getServerKey(this.serverName, this.serverConfig)
          // tokenData保存`data?.mcpOAuth?.[serverKey]`，供MCP 服务MCP 服务 auth后续步骤使用。
          const tokenData = data?.mcpOAuth?.[serverKey]
          // 满足 `tokenData` 时，MCP 服务执行该分支。
          if (tokenData) {
            // expiresIn记录时间`Date.now`，供MCP 服务后续处理使用。
            const expiresIn = (tokenData.expiresAt - Date.now()) / 1000
            // 满足 `expiresIn > 300` 时，MCP 服务执行该分支。
            if (expiresIn > 300) {
              // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
              logMCPDebug(
                this.serverName,
                `Another process refreshed tokens, using those`,
              )
              // Not emitted as success: this process did not perform a
              // refresh, and the winning process already emitted its own
              // success event. Emitting here would double-count.
              // 返回 {，把MCP 服务这个分支的结果交还调用方。
              return {
                access_token: tokenData.accessToken,
                refresh_token: tokenData.refreshToken,
                expires_in: expiresIn,
                scope: tokenData.scope,
                token_type: 'Bearer',
              }
            }
          }
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(
            this.serverName,
            `No valid tokens in storage, clearing stored tokens`,
          )
          // 等待 `this.invalidateCredentials('tokens')` 完成，再继续MCP 服务 auth的异步流程。
          await this.invalidateCredentials('tokens')
          // emitRefreshEvent执行MCP 服务在此处需要的副作用或外部交互。
          emitRefreshEvent('failure', 'invalid_grant')
          // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
          return undefined
        }

        // Retry on timeouts or transient server errors
        // isTimeoutError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isTimeoutError =
          error instanceof Error &&
          /timeout|timed out|etimedout|econnreset/i.test(error.message)
        // isTransientServerError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const isTransientServerError =
          error instanceof ServerError ||
          error instanceof TemporarilyUnavailableError ||
          error instanceof TooManyRequestsError
        // isRetryable记录当前扫描状态，MCP 服务MCP 服务 auth随后按该状态分支。
        const isRetryable = isTimeoutError || isTransientServerError

        // 组合条件 `!isRetryable || attempt >= MAX_ATTEMPTS` 成立时，MCP 服务才启用这条专门路径。
        if (!isRetryable || attempt >= MAX_ATTEMPTS) {
          // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
          logMCPDebug(
            this.serverName,
            `Token refresh failed: ${errorMessage(error)}`,
          )
          // emitRefreshEvent执行MCP 服务在此处需要的副作用或外部交互。
          emitRefreshEvent(
            'failure',
            isRetryable ? 'transient_retries_exhausted' : 'request_failed',
          )
          // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
          return undefined
        }

        // delayMs 集合保存`Math.pow`，供MCP 服务后续处理使用。
        const delayMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
        // logMCPDebug执行MCP 服务在此处需要的副作用或外部交互。
        logMCPDebug(
          this.serverName,
          `Token refresh failed, retrying in ${delayMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`,
        )
        // 等待 `sleep(delayMs)` 完成，再继续MCP 服务 auth的异步流程。
        await sleep(delayMs)
      }
    }

    // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
    return undefined
  }
}

// readClientSecret 承担MCP 服务中的独立步骤，串起MCP 服务 auth需要的输入整理、状态更新和结果输出。
export async function readClientSecret(): Promise<string> {
  // envSecret保存`process.env.MCP_CLIENT_SECRET`，供MCP 服务MCP 服务 auth后续步骤使用。
  const envSecret = process.env.MCP_CLIENT_SECRET
  // 满足 `envSecret` 时，MCP 服务执行该分支。
  if (envSecret) {
    // 返回 envSecret，把MCP 服务这个分支的结果交还调用方。
    return envSecret
  }

  // process.stdin.isTTY缺失时提前走兜底路径，避免MCP 服务继续依赖无效输入。
  if (!process.stdin.isTTY) {
    // 抛出 new Error(，阻止MCP 服务在无效状态下继续运行。
    throw new Error(
      'No TTY available to prompt for client secret. Set MCP_CLIENT_SECRET env var instead.',
    )
  }

  // 返回 new Promise((resolve, reject) => {，把MCP 服务这个分支的结果交还调用方。
  return new Promise((resolve, reject) => {
    // process.stderr.write执行MCP 服务在此处需要的副作用或外部交互。
    process.stderr.write('Enter OAuth client secret: ')
    // 调用 process.stdin.setRawMode?.(true)，完成这一处局部操作。
    process.stdin.setRawMode?.(true)
    // secret保存`''`，供MCP 服务MCP 服务 auth后续步骤使用。
    let secret = ''
    // onData保存`(ch: Buffer) => {`，供MCP 服务MCP 服务 auth后续步骤使用。
    const onData = (ch: Buffer) => {
      // c格式化`ch.toString`，供MCP 服务后续处理使用。
      const c = ch.toString()
      // `c` 命中特定值 `'\n' || c === '\r'` 时，进入MCP 服务对应处理。
      if (c === '\n' || c === '\r') {
        // 调用 process.stdin.setRawMode?.(false)，完成这一处局部操作。
        process.stdin.setRawMode?.(false)
        // process.stdin.removeListener执行MCP 服务在此处需要的副作用或外部交互。
        process.stdin.removeListener('data', onData)
        // process.stderr.write执行MCP 服务在此处需要的副作用或外部交互。
        process.stderr.write('\n')
        // resolve执行MCP 服务在此处需要的副作用或外部交互。
        resolve(secret)
      // `c === '\u0003'` 成立时，MCP 服务 auth切换到这个 else-if 分支。
      } else if (c === '\u0003') {
        // 调用 process.stdin.setRawMode?.(false)，完成这一处局部操作。
        process.stdin.setRawMode?.(false)
        // process.stdin.removeListener执行MCP 服务在此处需要的副作用或外部交互。
        process.stdin.removeListener('data', onData)
        // reject执行MCP 服务在此处需要的副作用或外部交互。
        reject(new Error('Cancelled'))
      // `c === '\u007F' || c === '\b'` 成立时，MCP 服务 auth切换到这个 else-if 分支。
      } else if (c === '\u007F' || c === '\b') {
        // secret更新为 `secret.slice(0, -1)`，确保MCP 服务后续读取最新状态。
        secret = secret.slice(0, -1)
      } else {
        // MCP 服务 auth处理 `secret += c`，完成这一小步状态转换。
        secret += c
      }
    }
    // process.stdin.on执行MCP 服务在此处需要的副作用或外部交互。
    process.stdin.on('data', onData)
  })
}

// saveMcpClientSecret 承担MCP 服务中的独立步骤，串起MCP 服务 auth需要的输入整理、状态更新和结果输出。
export function saveMcpClientSecret(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
  clientSecret: string,
): void {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existingData读取`storage.read`，供MCP 服务后续处理使用。
  const existingData = storage.read() || {}
  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // storage.update执行MCP 服务在此处需要的副作用或外部交互。
  storage.update({
    ...existingData,
    mcpOAuthClientConfig: {
      ...existingData.mcpOAuthClientConfig,
      [serverKey]: { clientSecret },
    },
  })
}

// clearMcpClientConfig 承担MCP 服务中的独立步骤，串起MCP 服务 auth需要的输入整理、状态更新和结果输出。
export function clearMcpClientConfig(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
): void {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // existingData读取`storage.read`，供MCP 服务后续处理使用。
  const existingData = storage.read()
  // 判断 !existingData?.mcpOAuthClientConfig，将MCP 服务分流到只适用于该条件的处理路径。
  if (!existingData?.mcpOAuthClientConfig) return
  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // 满足 `existingData.mcpOAuthClientConfig[serverKey]` 时，MCP 服务执行该分支。
  if (existingData.mcpOAuthClientConfig[serverKey]) {
    // MCP 服务 auth处理 `delete existingData.mcpOAuthClientConfig[serverKey]`，完成这一小步状态转换。
    delete existingData.mcpOAuthClientConfig[serverKey]
    // storage.update执行MCP 服务在此处需要的副作用或外部交互。
    storage.update(existingData)
  }
}

// getMcpClientConfig 承担MCP 服务中的独立步骤，串起MCP 服务 auth需要的输入整理、状态更新和结果输出。
export function getMcpClientConfig(
  serverName: string,
  serverConfig: McpSSEServerConfig | McpHTTPServerConfig,
): { clientSecret?: string } | undefined {
  // storage读取`getSecureStorage`，供MCP 服务后续处理使用。
  const storage = getSecureStorage()
  // data读取`storage.read`，供MCP 服务后续处理使用。
  const data = storage.read()
  // serverKey读取`getServerKey`，供MCP 服务后续处理使用。
  const serverKey = getServerKey(serverName, serverConfig)
  // 返回 data?.mcpOAuthClientConfig?.[serverKey]，把MCP 服务这个分支的结果交还调用方。
  return data?.mcpOAuthClientConfig?.[serverKey]
}

/**
 * Safely extracts scope information from AuthorizationServerMetadata.
 * The metadata can be either OAuthMetadata or OpenIdProviderDiscoveryMetadata,
 * and different providers use different fields for scope information.
 */
// getScopeFromMetadata 承担MCP 服务中的独立步骤，串起MCP 服务 auth需要的输入整理、状态更新和结果输出。
function getScopeFromMetadata(
  metadata: AuthorizationServerMetadata | undefined,
): string | undefined {
  // 判断 !metadata，将MCP 服务分流到只适用于该条件的处理路径。
  if (!metadata) return undefined
  // Try 'scope' first (non-standard but used by some providers)
  // 组合条件 `'scope' in metadata && typeof metadata.scope ===` 成立时，MCP 服务才启用这条专门路径。
  if ('scope' in metadata && typeof metadata.scope === 'string') {
    // 返回 metadata.scope，把MCP 服务这个分支的结果交还调用方。
    return metadata.scope
  }
  // Try 'default_scope' (non-standard but used by some providers)
  // MCP 服务在这里进入条件判断，后续代码按实际状态分流。
  if (
    'default_scope' in metadata &&
    typeof metadata.default_scope === 'string'
  ) {
    // 返回 metadata.default_scope，把MCP 服务这个分支的结果交还调用方。
    return metadata.default_scope
  }
  // Fall back to scopes_supported (standard OAuth 2.0 field)
  // 判断 metadata.scopes_supported && Array.isArray(metadata.scopes_supported)，将MCP 服务分流到只适用于该条件的处理路径。
  if (metadata.scopes_supported && Array.isArray(metadata.scopes_supported)) {
    // 返回 metadata.scopes_supported.join(' ')，把MCP 服务这个分支的结果交还调用方。
    return metadata.scopes_supported.join(' ')
  }
  // 返回 undefined，把MCP 服务这个分支的结果交还调用方。
  return undefined
}
