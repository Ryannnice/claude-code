// 复用 isEnvTruthy 工具函数，把通用处理留在 src/utils/envUtils.js 中维护。
import { isEnvTruthy } from 'src/utils/envUtils.js'

// Default to prod config, override with test/staging if enabled
// OauthConfigType 固化oauth里传递的数据形状，帮助调用方按同一结构读写字段。
type OauthConfigType = 'prod' | 'staging' | 'local'

// getOauthConfigType 封装oauth的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getOauthConfigType(): OauthConfigType {
  // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，oauth执行对应分支。
  if (process.env.USER_TYPE === 'ant') {
    // 满足 `isEnvTruthy(process.env.USE_LOCAL_OAUTH)` 时，oauth执行该分支。
    if (isEnvTruthy(process.env.USE_LOCAL_OAUTH)) {
      // 返回 `'local'`，作为oauth这次计算的结果。
      return 'local'
    }
    // 满足 `isEnvTruthy(process.env.USE_STAGING_OAUTH)` 时，oauth执行该分支。
    if (isEnvTruthy(process.env.USE_STAGING_OAUTH)) {
      // 返回 `'staging'`，作为oauth这次计算的结果。
      return 'staging'
    }
  }
  // 返回 `'prod'`，作为oauth这次计算的结果。
  return 'prod'
}

// fileSuffixForOauthConfig 封装oauth的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function fileSuffixForOauthConfig(): string {
  // 满足 `process.env.CLAUDE_CODE_CUSTOM_OAUTH_URL` 时，oauth执行该分支。
  if (process.env.CLAUDE_CODE_CUSTOM_OAUTH_URL) {
    // 返回 `'-custom-oauth'`，作为oauth这次计算的结果。
    return '-custom-oauth'
  }
  // 依据 getOauthConfigType() 的取值选择oauth的具体处理分支。
  switch (getOauthConfigType()) {
    case 'local':
      // 返回 `'-local-oauth'`，作为oauth这次计算的结果。
      return '-local-oauth'
    case 'staging':
      // 返回 `'-staging-oauth'`，作为oauth这次计算的结果。
      return '-staging-oauth'
    case 'prod':
      // No suffix for production config
      // 返回空字符串表示没有可用文本，调用方会按空输入处理。
      return ''
  }
}

// CLAUDE_AI_INFERENCE_SCOPE固定为 `'user:inference' as const`，作为oauth后续展示或比较的基准。
export const CLAUDE_AI_INFERENCE_SCOPE = 'user:inference' as const
// CLAUDE_AI_PROFILE_SCOPE 文件数据固定为 `'user:profile' as const`，作为oauth后续展示或比较的基准。
export const CLAUDE_AI_PROFILE_SCOPE = 'user:profile' as const
// CONSOLE_SCOPE固定为 `'org:create_api_key' as const`，作为oauth后续展示或比较的基准。
const CONSOLE_SCOPE = 'org:create_api_key' as const
// OAUTH_BETA_HEADER固定为 `'oauth-2025-04-20' as const`，作为oauth后续展示或比较的基准。
export const OAUTH_BETA_HEADER = 'oauth-2025-04-20' as const

// Console OAuth scopes - for API key creation via Console
// CONSOLE_OAUTH_SCOPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const CONSOLE_OAUTH_SCOPES = [
  CONSOLE_SCOPE,
  CLAUDE_AI_PROFILE_SCOPE,
] as const

// Claude.ai OAuth scopes - for Claude.ai subscribers (Pro/Max/Team/Enterprise)
// CLAUDE_AI_OAUTH_SCOPES 集合 聚合成有序列表，保持后续遍历顺序稳定。
export const CLAUDE_AI_OAUTH_SCOPES = [
  CLAUDE_AI_PROFILE_SCOPE,
  CLAUDE_AI_INFERENCE_SCOPE,
  'user:sessions:claude_code',
  'user:mcp_servers',
  'user:file_upload',
] as const

// All OAuth scopes - union of all scopes used in Claude CLI
// When logging in, request all scopes in order to handle both Console -> Claude.ai redirect
// Ensure that `OAuthConsentPage` in apps repo is kept in sync with this list.
// ALL_OAUTH_SCOPES 集合保存`Array.from`，供oauth后续处理使用。
export const ALL_OAUTH_SCOPES = Array.from(
  new Set([...CONSOLE_OAUTH_SCOPES, ...CLAUDE_AI_OAUTH_SCOPES]),
)

// OauthConfig 固化oauth里传递的数据形状，帮助调用方按同一结构读写字段。
type OauthConfig = {
  BASE_API_URL: string
  CONSOLE_AUTHORIZE_URL: string
  CLAUDE_AI_AUTHORIZE_URL: string
  /**
   * The claude.ai web origin. Separate from CLAUDE_AI_AUTHORIZE_URL because
   * that now routes through claude.com/cai/* for attribution — deriving
   * .origin from it would give claude.com, breaking links to /code,
   * /settings/connectors, and other claude.ai web pages.
   */
  CLAUDE_AI_ORIGIN: string
  TOKEN_URL: string
  API_KEY_URL: string
  ROLES_URL: string
  CONSOLE_SUCCESS_URL: string
  CLAUDEAI_SUCCESS_URL: string
  MANUAL_REDIRECT_URL: string
  CLIENT_ID: string
  OAUTH_FILE_SUFFIX: string
  MCP_PROXY_URL: string
  MCP_PROXY_PATH: string
}

// Production OAuth configuration - Used in normal operation
// PROD_OAUTH_CONFIG 配置 集中保存oauth要一起传递的字段。
const PROD_OAUTH_CONFIG = {
  BASE_API_URL: 'https://api.anthropic.com',
  CONSOLE_AUTHORIZE_URL: 'https://platform.claude.com/oauth/authorize',
  // Bounces through claude.com/cai/* so CLI sign-ins connect to claude.com
  // visits for attribution. 307s to claude.ai/oauth/authorize in two hops.
  CLAUDE_AI_AUTHORIZE_URL: 'https://claude.com/cai/oauth/authorize',
  CLAUDE_AI_ORIGIN: 'https://claude.ai',
  TOKEN_URL: 'https://platform.claude.com/v1/oauth/token',
  API_KEY_URL: 'https://api.anthropic.com/api/oauth/claude_cli/create_api_key',
  ROLES_URL: 'https://api.anthropic.com/api/oauth/claude_cli/roles',
  CONSOLE_SUCCESS_URL:
    'https://platform.claude.com/buy_credits?returnUrl=/oauth/code/success%3Fapp%3Dclaude-code',
  CLAUDEAI_SUCCESS_URL:
    'https://platform.claude.com/oauth/code/success?app=claude-code',
  MANUAL_REDIRECT_URL: 'https://platform.claude.com/oauth/code/callback',
  CLIENT_ID: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
  // No suffix for production config
  OAUTH_FILE_SUFFIX: '',
  MCP_PROXY_URL: 'https://mcp-proxy.anthropic.com',
  MCP_PROXY_PATH: '/v1/mcp/{server_id}',
} as const

/**
 * Client ID Metadata Document URL for MCP OAuth (CIMD / SEP-991).
 * When an MCP auth server advertises client_id_metadata_document_supported: true,
 * Claude Code uses this URL as its client_id instead of Dynamic Client Registration.
 * The URL must point to a JSON document hosted by Anthropic.
 * See: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00
 */
// MCP_CLIENT_METADATA_URL 先占位，稍后的条件分支会根据实际输入补齐它。
export const MCP_CLIENT_METADATA_URL =
  'https://claude.ai/oauth/claude-code-client-metadata'

// Staging OAuth configuration - only included in ant builds with staging flag
// Uses literal check for dead code elimination
// STAGING_OAUTH_CONFIG 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
const STAGING_OAUTH_CONFIG =
  process.env.USER_TYPE === 'ant'
    ? ({
        BASE_API_URL: 'https://api-staging.anthropic.com',
        CONSOLE_AUTHORIZE_URL:
          'https://platform.staging.ant.dev/oauth/authorize',
        CLAUDE_AI_AUTHORIZE_URL:
          'https://claude-ai.staging.ant.dev/oauth/authorize',
        CLAUDE_AI_ORIGIN: 'https://claude-ai.staging.ant.dev',
        TOKEN_URL: 'https://platform.staging.ant.dev/v1/oauth/token',
        API_KEY_URL:
          'https://api-staging.anthropic.com/api/oauth/claude_cli/create_api_key',
        ROLES_URL:
          'https://api-staging.anthropic.com/api/oauth/claude_cli/roles',
        CONSOLE_SUCCESS_URL:
          'https://platform.staging.ant.dev/buy_credits?returnUrl=/oauth/code/success%3Fapp%3Dclaude-code',
        CLAUDEAI_SUCCESS_URL:
          'https://platform.staging.ant.dev/oauth/code/success?app=claude-code',
        MANUAL_REDIRECT_URL:
          'https://platform.staging.ant.dev/oauth/code/callback',
        CLIENT_ID: '22422756-60c9-4084-8eb7-27705fd5cf9a',
        OAUTH_FILE_SUFFIX: '-staging-oauth',
        MCP_PROXY_URL: 'https://mcp-proxy-staging.anthropic.com',
        MCP_PROXY_PATH: '/v1/mcp/{server_id}',
      } as const)
    : undefined

// Three local dev servers: :8000 api-proxy (`api dev start -g ccr`),
// :4000 claude-ai frontend, :3000 Console frontend. Env vars let
// scripts/claude-localhost override if your layout differs.
// getLocalOauthConfig 封装oauth的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getLocalOauthConfig(): OauthConfig {
  // api 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const api =
    process.env.CLAUDE_LOCAL_OAUTH_API_BASE?.replace(/\/$/, '') ??
    'http://localhost:8000'
  // apps 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const apps =
    process.env.CLAUDE_LOCAL_OAUTH_APPS_BASE?.replace(/\/$/, '') ??
    'http://localhost:4000'
  // consoleBase 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const consoleBase =
    process.env.CLAUDE_LOCAL_OAUTH_CONSOLE_BASE?.replace(/\/$/, '') ??
    'http://localhost:3000'
  // 返回结构化结果，集中表达oauth已经整理出的状态。
  return {
    BASE_API_URL: api,
    CONSOLE_AUTHORIZE_URL: `${consoleBase}/oauth/authorize`,
    CLAUDE_AI_AUTHORIZE_URL: `${apps}/oauth/authorize`,
    CLAUDE_AI_ORIGIN: apps,
    TOKEN_URL: `${api}/v1/oauth/token`,
    API_KEY_URL: `${api}/api/oauth/claude_cli/create_api_key`,
    ROLES_URL: `${api}/api/oauth/claude_cli/roles`,
    CONSOLE_SUCCESS_URL: `${consoleBase}/buy_credits?returnUrl=/oauth/code/success%3Fapp%3Dclaude-code`,
    CLAUDEAI_SUCCESS_URL: `${consoleBase}/oauth/code/success?app=claude-code`,
    MANUAL_REDIRECT_URL: `${consoleBase}/oauth/code/callback`,
    CLIENT_ID: '22422756-60c9-4084-8eb7-27705fd5cf9a',
    OAUTH_FILE_SUFFIX: '-local-oauth',
    MCP_PROXY_URL: 'http://localhost:8205',
    MCP_PROXY_PATH: '/v1/toolbox/shttp/mcp/{server_id}',
  }
}

// Allowed base URLs for CLAUDE_CODE_CUSTOM_OAUTH_URL override.
// Only FedStart/PubSec deployments are permitted to prevent OAuth tokens
// from being sent to arbitrary endpoints.
// ALLOWED_OAUTH_BASE_URLS 集合 聚合成有序列表，保持后续遍历顺序稳定。
const ALLOWED_OAUTH_BASE_URLS = [
  'https://beacon.claude-ai.staging.ant.dev',
  'https://claude.fedstart.com',
  'https://claude-staging.fedstart.com',
]

// Default to prod config, override with test/staging if enabled
// getOauthConfig 封装oauth的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOauthConfig(): OauthConfig {
  // 这个回调绑定到 let config: OauthConfig = (() => {，负责oauth在该局部场景下的响应。
  let config: OauthConfig = (() => {
    // 依据 getOauthConfigType() 的取值选择oauth的具体处理分支。
    switch (getOauthConfigType()) {
      case 'local':
        // 返回 `getLocalOauthConfig()`，作为oauth这次计算的结果。
        return getLocalOauthConfig()
      case 'staging':
        // 返回 `STAGING_OAUTH_CONFIG ?? PROD_OAUTH_CONFIG`，作为oauth这次计算的结果。
        return STAGING_OAUTH_CONFIG ?? PROD_OAUTH_CONFIG
      case 'prod':
        // 返回 `PROD_OAUTH_CONFIG`，作为oauth这次计算的结果。
        return PROD_OAUTH_CONFIG
    }
  })()

  // Allow overriding all OAuth URLs to point to an approved FedStart deployment.
  // Only allowlisted base URLs are accepted to prevent credential leakage.
  // oauthBaseUrl 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const oauthBaseUrl = process.env.CLAUDE_CODE_CUSTOM_OAUTH_URL
  // 满足 `oauthBaseUrl` 时，oauth执行该分支。
  if (oauthBaseUrl) {
    // base格式化`oauthBaseUrl.replace`，供oauth后续处理使用。
    const base = oauthBaseUrl.replace(/\/$/, '')
    // 满足 `!ALLOWED_OAUTH_BASE_URLS.includes(base)` 时，oauth执行该分支。
    if (!ALLOWED_OAUTH_BASE_URLS.includes(base)) {
      // 抛出 new Error(，阻止oauth在无效状态下继续运行。
      throw new Error(
        'CLAUDE_CODE_CUSTOM_OAUTH_URL is not an approved endpoint.',
      )
    }
    // 配置更新为 `{`，确保oauth后续读取最新状态。
    config = {
      ...config,
      BASE_API_URL: base,
      CONSOLE_AUTHORIZE_URL: `${base}/oauth/authorize`,
      CLAUDE_AI_AUTHORIZE_URL: `${base}/oauth/authorize`,
      CLAUDE_AI_ORIGIN: base,
      TOKEN_URL: `${base}/v1/oauth/token`,
      API_KEY_URL: `${base}/api/oauth/claude_cli/create_api_key`,
      ROLES_URL: `${base}/api/oauth/claude_cli/roles`,
      CONSOLE_SUCCESS_URL: `${base}/oauth/code/success?app=claude-code`,
      CLAUDEAI_SUCCESS_URL: `${base}/oauth/code/success?app=claude-code`,
      MANUAL_REDIRECT_URL: `${base}/oauth/code/callback`,
      OAUTH_FILE_SUFFIX: '-custom-oauth',
    }
  }

  // Allow CLIENT_ID override via environment variable (e.g., for Xcode integration)
  // clientIdOverride 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const clientIdOverride = process.env.CLAUDE_CODE_OAUTH_CLIENT_ID
  // 满足 `clientIdOverride` 时，oauth执行该分支。
  if (clientIdOverride) {
    // 配置更新为 `{`，确保oauth后续读取最新状态。
    config = {
      ...config,
      CLIENT_ID: clientIdOverride,
    }
  }

  // 返回 `config`，作为oauth这次计算的结果。
  return config
}
