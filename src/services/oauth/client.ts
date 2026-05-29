// OAuth client for handling authentication flows with Claude services
// 引入 axios，将 axios 中已经封装好的能力接到本文件流程里。
import axios from 'axios'
// 整理这一组导入，让服务层 client后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 整理这一组导入，让服务层 client后续逻辑可以直接复用这些外部能力。
import {
  ALL_OAUTH_SCOPES,
  CLAUDE_AI_INFERENCE_SCOPE,
  CLAUDE_AI_OAUTH_SCOPES,
  getOauthConfig,
} from '../../constants/oauth.js'
// 整理这一组导入，让服务层 client后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getClaudeAIOAuthTokens,
  hasProfileScope,
  isClaudeAISubscriber,
  saveApiKey,
} from '../../utils/auth.js'
// 类型依赖 { AccountInfo } 来自 ../../utils/config.js，用于校准服务层 client的数据契约。
import type { AccountInfo } from '../../utils/config.js'
// 复用 getGlobalConfig、saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 引入 getOauthProfileFromOauthToken，将 ./getOauthProfile.js 中已经封装好的能力接到本文件流程里。
import { getOauthProfileFromOauthToken } from './getOauthProfile.js'
// 整理这一组导入，让服务层 client后续逻辑可以直接复用这些外部能力。
import type {
  BillingType,
  OAuthProfileResponse,
  OAuthTokenExchangeResponse,
  OAuthTokens,
  RateLimitTier,
  SubscriptionType,
  UserRolesResponse,
} from './types.js'

/**
 * Check if the user has Claude.ai authentication scope
 * @private Only call this if you're OAuth / auth related code!
 */
// shouldUseClaudeAIAuth 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function shouldUseClaudeAIAuth(scopes: string[] | undefined): boolean {
  // 返回 `Boolean(scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE))`，作为服务层 client这次计算的结果。
  return Boolean(scopes?.includes(CLAUDE_AI_INFERENCE_SCOPE))
}

// parseScopes 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseScopes(scopeString?: string): string[] {
  // 返回 `scopeString?.split(' ').filter(Boolean) ?? []`，作为服务层 client这次计算的结果。
  return scopeString?.split(' ').filter(Boolean) ?? []
}

// buildAuthUrl 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildAuthUrl({
  codeChallenge,
  state,
  port,
  isManual,
  loginWithClaudeAi,
  inferenceOnly,
  orgUUID,
  loginHint,
  loginMethod,
}: {
  codeChallenge: string
  state: string
  port: number
  isManual: boolean
  loginWithClaudeAi?: boolean
  inferenceOnly?: boolean
  orgUUID?: string
  loginHint?: string
  loginMethod?: string
}): string {
  // authUrlBase保存`loginWithClaudeAi`，供服务层 client后续判断或输出使用。
  const authUrlBase = loginWithClaudeAi
    ? getOauthConfig().CLAUDE_AI_AUTHORIZE_URL
    : getOauthConfig().CONSOLE_AUTHORIZE_URL

  // authUrl保存`URL`，供服务层 client后续处理使用。
  const authUrl = new URL(authUrlBase)
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('code', 'true') // this tells the login page to show Claude Max upsell
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('client_id', getOauthConfig().CLIENT_ID)
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('response_type', 'code')
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append(
    'redirect_uri',
    isManual
      ? getOauthConfig().MANUAL_REDIRECT_URL
      : `http://localhost:${port}/callback`,
  )
  // scopesToUse保存`inferenceOnly`，供后续判断或组装使用。
  const scopesToUse = inferenceOnly
    ? [CLAUDE_AI_INFERENCE_SCOPE] // Long-lived inference-only tokens
    : ALL_OAUTH_SCOPES
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('scope', scopesToUse.join(' '))
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('code_challenge', codeChallenge)
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('code_challenge_method', 'S256')
  // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
  authUrl.searchParams.append('state', state)

  // Add orgUUID as URL param if provided
  // 满足 `orgUUID` 时，服务层 client执行该分支。
  if (orgUUID) {
    // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
    authUrl.searchParams.append('orgUUID', orgUUID)
  }

  // Pre-populate email on the login form (standard OIDC parameter)
  // 满足 `loginHint` 时，服务层 client执行该分支。
  if (loginHint) {
    // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
    authUrl.searchParams.append('login_hint', loginHint)
  }

  // Request a specific login method (e.g. 'sso', 'magic_link', 'google')
  // 满足 `loginMethod` 时，服务层 client执行该分支。
  if (loginMethod) {
    // 调用 authUrl.searchParams.append，触发服务层 client此处需要的副作用。
    authUrl.searchParams.append('login_method', loginMethod)
  }

  // 返回 `authUrl.toString()`，作为服务层 client这次计算的结果。
  return authUrl.toString()
}

// exchangeCodeForTokens 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function exchangeCodeForTokens(
  authorizationCode: string,
  state: string,
  codeVerifier: string,
  port: number,
  useManualRedirect: boolean = false,
  expiresIn?: number,
): Promise<OAuthTokenExchangeResponse> {
  // requestBody 请求数据 集中保存服务层 client要一起传递的字段。
  const requestBody: Record<string, string | number> = {
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: useManualRedirect
      ? getOauthConfig().MANUAL_REDIRECT_URL
      : `http://localhost:${port}/callback`,
    client_id: getOauthConfig().CLIENT_ID,
    code_verifier: codeVerifier,
    state,
  }

  // `expiresIn` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
  if (expiresIn !== undefined) {
    // expires_in更新为 `expiresIn`，确保服务层后续读取最新状态。
    requestBody.expires_in = expiresIn
  }

  // 接口响应保存`axios.post`，供服务层 client后续处理使用。
  const response = await axios.post(getOauthConfig().TOKEN_URL, requestBody, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  })

  // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
  if (response.status !== 200) {
    // 抛出 new Error(，阻止服务层 client在无效状态下继续运行。
    throw new Error(
      response.status === 401
        ? 'Authentication failed: Invalid authorization code'
        : `Token exchange failed (${response.status}): ${response.statusText}`,
    )
  }
  // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_oauth_token_exchange_success', {})
  // 返回 `response.data`，作为服务层 client这次计算的结果。
  return response.data
}

// refreshOAuthToken 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function refreshOAuthToken(
  refreshToken: string,
  { scopes: requestedScopes }: { scopes?: string[] } = {},
): Promise<OAuthTokens> {
  // requestBody 请求数据 集中保存服务层 client要一起传递的字段。
  const requestBody = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getOauthConfig().CLIENT_ID,
    // Request specific scopes, defaulting to the full Claude AI set. The
    // backend's refresh-token grant allows scope expansion beyond what the
    // initial authorize granted (see ALLOWED_SCOPE_EXPANSIONS), so this is
    // safe even for tokens issued before scopes were added to the app's
    // registered oauth_scope.
    scope: (requestedScopes?.length
      ? requestedScopes
      : CLAUDE_AI_OAUTH_SCOPES
    ).join(' '),
  }

  // 保护这一段可能失败的服务层 client操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应保存`axios.post`，供服务层 client后续处理使用。
    const response = await axios.post(getOauthConfig().TOKEN_URL, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    })

    // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
    if (response.status !== 200) {
      // 抛出 new Error(`Token refresh failed: ${response.statusText}`)，阻止服务层 client在无效状态下继续运行。
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    // data保存`response.data as OAuthTokenExchangeResponse`，供服务层 client后续判断或输出使用。
    const data = response.data as OAuthTokenExchangeResponse
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      access_token: accessToken,
      refresh_token: newRefreshToken = refreshToken,
      expires_in: expiresIn,
    } = data

    // expiresAt记录时间`Date.now`，供服务层 client后续处理使用。
    const expiresAt = Date.now() + expiresIn * 1000
    // scopes 集合解析`parseScopes`，供服务层 client后续处理使用。
    const scopes = parseScopes(data.scope)

    // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_success', {})

    // Skip the extra /api/oauth/profile round-trip when we already have both
    // the global-config profile fields AND the secure-storage subscription data.
    // Routine refreshes satisfy both, so we cut ~7M req/day fleet-wide.
    //
    // Checking secure storage (not just config) matters for the
    // CLAUDE_CODE_OAUTH_REFRESH_TOKEN re-login path: installOAuthTokens runs
    // performLogout() AFTER we return, wiping secure storage. If we returned
    // null for subscriptionType here, saveOAuthTokensIfNeeded would persist
    // null ?? (wiped) ?? null = null, and every future refresh would see the
    // config guard fields satisfied and skip again, permanently losing the
    // subscription type for paying users. By passing through existing values,
    // the re-login path writes cached ?? wiped ?? null = cached; and if secure
    // storage was already empty we fall through to the fetch.
    // 配置读取`getGlobalConfig`，供服务层 client后续处理使用。
    const config = getGlobalConfig()
    // existing读取`getClaudeAIOAuthTokens`，供服务层 client后续处理使用。
    const existing = getClaudeAIOAuthTokens()
    // haveProfileAlready 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const haveProfileAlready =
      config.oauthAccount?.billingType !== undefined &&
      config.oauthAccount?.accountCreatedAt !== undefined &&
      config.oauthAccount?.subscriptionCreatedAt !== undefined &&
      existing?.subscriptionType != null &&
      existing?.rateLimitTier != null

    // profileInfo 文件数据读取`haveProfileAlready`，供后续判断或组装使用。
    const profileInfo = haveProfileAlready
      ? null
      : await fetchProfileInfo(accessToken)

    // Update the stored properties if they have changed
    // 组合条件 `profileInfo && config.oauthAccount` 成立时，服务层 client才启用这条专门路径。
    if (profileInfo && config.oauthAccount) {
      // updates 集合 从空对象开始收集键值，后续按名称补齐内容。
      const updates: Partial<AccountInfo> = {}
      // `profileInfo.displayName` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (profileInfo.displayName !== undefined) {
        // displayName更新为 `profileInfo.displayName`，确保服务层后续读取最新状态。
        updates.displayName = profileInfo.displayName
      }
      // 满足 `typeof profileInfo.hasExtraUsageEnabled === 'bool` 时，服务层 client执行该分支。
      if (typeof profileInfo.hasExtraUsageEnabled === 'boolean') {
        // hasExtraUsageEnabled更新为 `profileInfo.hasExtraUsageEnabled`，确保服务层后续读取最新状态。
        updates.hasExtraUsageEnabled = profileInfo.hasExtraUsageEnabled
      }
      // `profileInfo.billingType` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (profileInfo.billingType !== null) {
        // billingType更新为 `profileInfo.billingType`，确保服务层后续读取最新状态。
        updates.billingType = profileInfo.billingType
      }
      // `profileInfo.accountCreatedAt` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (profileInfo.accountCreatedAt !== undefined) {
        // accountCreatedAt 数量更新为 `profileInfo.accountCreatedAt`，确保服务层后续读取最新状态。
        updates.accountCreatedAt = profileInfo.accountCreatedAt
      }
      // `profileInfo.subscriptionCreatedAt` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
      if (profileInfo.subscriptionCreatedAt !== undefined) {
        // subscriptionCreatedAt更新为 `profileInfo.subscriptionCreatedAt`，确保服务层后续读取最新状态。
        updates.subscriptionCreatedAt = profileInfo.subscriptionCreatedAt
      }
      // 满足 `Object.keys(updates).length > 0` 时，服务层 client执行该分支。
      if (Object.keys(updates).length > 0) {
        // 调用 saveGlobalConfig，触发服务层 client此处需要的副作用。
        saveGlobalConfig(current => ({
          ...current,
          oauthAccount: current.oauthAccount
            ? { ...current.oauthAccount, ...updates }
            : current.oauthAccount,
        }))
      }
    }

    // 返回结构化结果，集中表达服务层 client已经整理出的状态。
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresAt,
      scopes,
      subscriptionType:
        profileInfo?.subscriptionType ?? existing?.subscriptionType ?? null,
      rateLimitTier:
        profileInfo?.rateLimitTier ?? existing?.rateLimitTier ?? null,
      profile: profileInfo?.rawProfile,
      tokenAccount: data.account
        ? {
            uuid: data.account.uuid,
            emailAddress: data.account.email_address,
            organizationUuid: data.organization?.uuid,
          }
        : undefined,
    }
  } catch (error) {
    // responseBody 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const responseBody =
      axios.isAxiosError(error) && error.response?.data
        ? JSON.stringify(error.response.data)
        : undefined
    // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_failure', {
      error: (error as Error)
        .message as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      ...(responseBody && {
        responseBody:
          responseBody as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })
    // 抛出 error，阻止服务层 client在无效状态下继续运行。
    throw error
  }
}

// fetchAndStoreUserRoles 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchAndStoreUserRoles(
  accessToken: string,
): Promise<void> {
  // 接口响应读取`axios.get`，供服务层 client后续处理使用。
  const response = await axios.get(getOauthConfig().ROLES_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  // `response.status` 与 `200` 不一致时刷新派生状态，避免使用过期结果。
  if (response.status !== 200) {
    // 抛出 new Error(`Failed to fetch user roles: ${response.statusText}`)，阻止服务层 client在无效状态下继续运行。
    throw new Error(`Failed to fetch user roles: ${response.statusText}`)
  }
  // data保存`response.data as UserRolesResponse`，供服务层 client后续判断或输出使用。
  const data = response.data as UserRolesResponse
  // 配置读取`getGlobalConfig`，供服务层 client后续处理使用。
  const config = getGlobalConfig()

  // config.oauthAccount 配置缺失时提前走兜底路径，避免服务层 client继续依赖无效输入。
  if (!config.oauthAccount) {
    // 抛出 new Error('OAuth account information not found in config')，阻止服务层 client在无效状态下继续运行。
    throw new Error('OAuth account information not found in config')
  }

  // 调用 saveGlobalConfig，触发服务层 client此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    oauthAccount: current.oauthAccount
      ? {
          ...current.oauthAccount,
          organizationRole: data.organization_role,
          workspaceRole: data.workspace_role,
          organizationName: data.organization_name,
        }
      : current.oauthAccount,
  }))

  // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_oauth_roles_stored', {
    org_role:
      data.organization_role as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  })
}

// createAndStoreApiKey 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function createAndStoreApiKey(
  accessToken: string,
): Promise<string | null> {
  // 保护这一段可能失败的服务层 client操作，确保异常能进入相邻错误处理。
  try {
    // 接口响应保存`axios.post`，供服务层 client后续处理使用。
    const response = await axios.post(getOauthConfig().API_KEY_URL, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    // API key 命名 `response.data?.raw_key`，让后续代码直接表达这个值的用途。
    const apiKey = response.data?.raw_key
    // 满足 `apiKey` 时，服务层 client执行该分支。
    if (apiKey) {
      // 等待 `saveApiKey(apiKey)` 完成，再继续服务层 client的异步流程。
      await saveApiKey(apiKey)
      // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_api_key', {
        status:
          'success' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        statusCode: response.status,
      })
      // 返回 `apiKey`，作为服务层 client这次计算的结果。
      return apiKey
    }
    // 返回 `null`，作为服务层 client这次计算的结果。
    return null
  } catch (error) {
    // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_api_key', {
      status:
        'failure' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      error: (error instanceof Error
        ? error.message
        : String(
            error,
          )) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 抛出 error，阻止服务层 client在无效状态下继续运行。
    throw error
  }
}

// isOAuthTokenExpired 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOAuthTokenExpired(expiresAt: number | null): boolean {
  // 满足 `expiresAt === null` 时，服务层 client执行该分支。
  if (expiresAt === null) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // bufferTime保存`5 * 60 * 1000`，供服务层 client后续判断或输出使用。
  const bufferTime = 5 * 60 * 1000
  // now记录时间`Date.now`，供服务层 client后续处理使用。
  const now = Date.now()
  // expiresWithBuffer 命名 `now + bufferTime`，让后续代码直接表达这个值的用途。
  const expiresWithBuffer = now + bufferTime
  // 返回 `expiresWithBuffer >= expiresAt`，作为服务层 client这次计算的结果。
  return expiresWithBuffer >= expiresAt
}

// fetchProfileInfo 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function fetchProfileInfo(accessToken: string): Promise<{
  subscriptionType: SubscriptionType | null
  displayName?: string
  rateLimitTier: RateLimitTier | null
  hasExtraUsageEnabled: boolean | null
  billingType: BillingType | null
  accountCreatedAt?: string
  subscriptionCreatedAt?: string
  rawProfile?: OAuthProfileResponse
}> {
  // profile 文件数据读取`getOauthProfileFromOauthToken`，供服务层 client后续处理使用。
  const profile = await getOauthProfileFromOauthToken(accessToken)
  // orgType保存`profile?.organization?.organization_type`，供服务层 client后续判断或输出使用。
  const orgType = profile?.organization?.organization_type

  // Reuse the logic from fetchSubscriptionType
  // subscriptionType保存`null`，作为后续空值处理的输入。
  let subscriptionType: SubscriptionType | null = null
  // 按照 orgType 的取值选择服务层 client的具体处理分支。
  switch (orgType) {
    case 'claude_max':
      // subscriptionType更新为 `'max'`，确保服务层后续读取最新状态。
      subscriptionType = 'max'
      // 结束这个分支或循环，避免服务层 client继续落入后续路径。
      break
    case 'claude_pro':
      // subscriptionType更新为 `'pro'`，确保服务层后续读取最新状态。
      subscriptionType = 'pro'
      // 结束这个分支或循环，避免服务层 client继续落入后续路径。
      break
    case 'claude_enterprise':
      // subscriptionType更新为 `'enterprise'`，确保服务层后续读取最新状态。
      subscriptionType = 'enterprise'
      // 结束这个分支或循环，避免服务层 client继续落入后续路径。
      break
    case 'claude_team':
      // subscriptionType更新为 `'team'`，确保服务层后续读取最新状态。
      subscriptionType = 'team'
      // 结束这个分支或循环，避免服务层 client继续落入后续路径。
      break
    default:
      // Return null for unknown organization types
      // subscriptionType更新为 `null`，确保服务层后续读取最新状态。
      subscriptionType = null
      // 结束这个分支或循环，避免服务层 client继续落入后续路径。
      break
  }

  // 结果 先占位，稍后的条件分支会根据实际输入补齐它。
  const result: {
    subscriptionType: SubscriptionType | null
    displayName?: string
    rateLimitTier: RateLimitTier | null
    hasExtraUsageEnabled: boolean | null
    billingType: BillingType | null
    accountCreatedAt?: string
    subscriptionCreatedAt?: string
  } = {
    subscriptionType,
    rateLimitTier: profile?.organization?.rate_limit_tier ?? null,
    hasExtraUsageEnabled:
      profile?.organization?.has_extra_usage_enabled ?? null,
    billingType: profile?.organization?.billing_type ?? null,
  }

  // 满足 `profile?.account?.display_name` 时，服务层 client执行该分支。
  if (profile?.account?.display_name) {
    // displayName更新为 `profile.account.display_name`，确保服务层后续读取最新状态。
    result.displayName = profile.account.display_name
  }

  // 满足 `profile?.account?.created_at` 时，服务层 client执行该分支。
  if (profile?.account?.created_at) {
    // accountCreatedAt 数量更新为 `profile.account.created_at`，确保服务层后续读取最新状态。
    result.accountCreatedAt = profile.account.created_at
  }

  // 满足 `profile?.organization?.subscription_created_at` 时，服务层 client执行该分支。
  if (profile?.organization?.subscription_created_at) {
    // subscriptionCreatedAt更新为 `profile.organization.subscription_created_at`，确保服务层后续读取最新状态。
    result.subscriptionCreatedAt = profile.organization.subscription_created_at
  }

  // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_oauth_profile_fetch_success', {})

  // 返回结构化结果，集中表达服务层 client已经整理出的状态。
  return { ...result, rawProfile: profile }
}

/**
 * Gets the organization UUID from the OAuth access token
 * @returns The organization UUID or null if not authenticated
 */
// getOrganizationUUID 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getOrganizationUUID(): Promise<string | null> {
  // Check global config first to avoid unnecessary API call
  // globalConfig 配置读取`getGlobalConfig`，供服务层 client后续处理使用。
  const globalConfig = getGlobalConfig()
  // orgUUID统计`globalConfig.oauthAccount?.organizationUuid`，供后续判断或组装使用。
  const orgUUID = globalConfig.oauthAccount?.organizationUuid
  // 满足 `orgUUID` 时，服务层 client执行该分支。
  if (orgUUID) {
    // 返回 `orgUUID`，作为服务层 client这次计算的结果。
    return orgUUID
  }

  // Fall back to fetching from profile (requires user:profile scope)
  // accessToken读取`getClaudeAIOAuthTokens`，供服务层 client后续处理使用。
  const accessToken = getClaudeAIOAuthTokens()?.accessToken
  // 组合条件 `accessToken === undefined || !hasProfileScope()` 成立时，服务层 client才启用这条专门路径。
  if (accessToken === undefined || !hasProfileScope()) {
    // 返回 `null`，作为服务层 client这次计算的结果。
    return null
  }
  // profile 文件数据读取`getOauthProfileFromOauthToken`，供服务层 client后续处理使用。
  const profile = await getOauthProfileFromOauthToken(accessToken)
  // profileOrgUUID 文件数据保存`profile?.organization?.uuid`，供服务层 client后续判断或输出使用。
  const profileOrgUUID = profile?.organization?.uuid
  // profileOrgUUID 文件数据缺失时提前走兜底路径，避免服务层 client继续依赖无效输入。
  if (!profileOrgUUID) {
    // 返回 `null`，作为服务层 client这次计算的结果。
    return null
  }
  // 返回 `profileOrgUUID`，作为服务层 client这次计算的结果。
  return profileOrgUUID
}

/**
 * Populate the OAuth account info if it has not already been cached in config.
 * @returns Whether or not the oauth account info was populated.
 */
// populateOAuthAccountInfoIfNeeded 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function populateOAuthAccountInfoIfNeeded(): Promise<boolean> {
  // Check env vars first (synchronous, no network call needed).
  // SDK callers like Cowork can provide account info directly, which also
  // eliminates the race condition where early telemetry events lack account info.
  // NB: If/when adding additional SDK-relevant functionality requiring _other_ OAuth account properties,
  // please reach out to #proj-cowork so the team can add additional env var fallbacks.
  // envAccountUuid 数量 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envAccountUuid = process.env.CLAUDE_CODE_ACCOUNT_UUID
  // envUserEmail 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envUserEmail = process.env.CLAUDE_CODE_USER_EMAIL
  // envOrganizationUuid 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envOrganizationUuid = process.env.CLAUDE_CODE_ORGANIZATION_UUID
  // hasEnvVars 集合记录 `Boolean` 是否成立，服务层 client随后按该结果分支。
  const hasEnvVars = Boolean(
    envAccountUuid && envUserEmail && envOrganizationUuid,
  )
  // 组合条件 `envAccountUuid && envUserEmail && envOrganization` 成立时，服务层 client才启用这条专门路径。
  if (envAccountUuid && envUserEmail && envOrganizationUuid) {
    // 满足 `!getGlobalConfig().oauthAccount` 时，服务层 client执行该分支。
    if (!getGlobalConfig().oauthAccount) {
      // 调用 storeOAuthAccountInfo，触发服务层 client此处需要的副作用。
      storeOAuthAccountInfo({
        accountUuid: envAccountUuid,
        emailAddress: envUserEmail,
        organizationUuid: envOrganizationUuid,
      })
    }
  }

  // Wait for any in-flight token refresh to complete first, since
  // refreshOAuthToken already fetches and stores profile info
  // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续服务层 client的异步流程。
  await checkAndRefreshOAuthTokenIfNeeded()

  // 配置读取`getGlobalConfig`，供服务层 client后续处理使用。
  const config = getGlobalConfig()
  // 服务层 client在这里进入条件判断，后续代码按实际状态分流。
  if (
    (config.oauthAccount &&
      config.oauthAccount.billingType !== undefined &&
      config.oauthAccount.accountCreatedAt !== undefined &&
      config.oauthAccount.subscriptionCreatedAt !== undefined) ||
    !isClaudeAISubscriber() ||
    !hasProfileScope()
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // token 列表读取`getClaudeAIOAuthTokens`，供服务层 client后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // 满足 `tokens?.accessToken` 时，服务层 client执行该分支。
  if (tokens?.accessToken) {
    // profile 文件数据读取`getOauthProfileFromOauthToken`，供服务层 client后续处理使用。
    const profile = await getOauthProfileFromOauthToken(tokens.accessToken)
    // 满足 `profile` 时，服务层 client执行该分支。
    if (profile) {
      // 满足 `hasEnvVars` 时，服务层 client执行该分支。
      if (hasEnvVars) {
        // 记录服务层 client运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'OAuth profile fetch succeeded, overriding env var account info',
          { level: 'info' },
        )
      }
      // 调用 storeOAuthAccountInfo，触发服务层 client此处需要的副作用。
      storeOAuthAccountInfo({
        accountUuid: profile.account.uuid,
        emailAddress: profile.account.email,
        organizationUuid: profile.organization.uuid,
        displayName: profile.account.display_name || undefined,
        hasExtraUsageEnabled:
          profile.organization.has_extra_usage_enabled ?? false,
        billingType: profile.organization.billing_type ?? undefined,
        accountCreatedAt: profile.account.created_at,
        subscriptionCreatedAt:
          profile.organization.subscription_created_at ?? undefined,
      })
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// storeOAuthAccountInfo 封装服务层的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function storeOAuthAccountInfo({
  accountUuid,
  emailAddress,
  organizationUuid,
  displayName,
  hasExtraUsageEnabled,
  billingType,
  accountCreatedAt,
  subscriptionCreatedAt,
}: {
  accountUuid: string
  emailAddress: string
  organizationUuid: string | undefined
  displayName?: string
  hasExtraUsageEnabled?: boolean
  billingType?: BillingType
  accountCreatedAt?: string
  subscriptionCreatedAt?: string
}): void {
  // accountInfo 数量 集中保存服务层 client要一起传递的字段。
  const accountInfo: AccountInfo = {
    accountUuid,
    emailAddress,
    organizationUuid,
    hasExtraUsageEnabled,
    billingType,
    accountCreatedAt,
    subscriptionCreatedAt,
  }
  // 满足 `displayName` 时，服务层 client执行该分支。
  if (displayName) {
    // displayName更新为 `displayName`，确保服务层后续读取最新状态。
    accountInfo.displayName = displayName
  }
  // 调用 saveGlobalConfig，触发服务层 client此处需要的副作用。
  saveGlobalConfig(current => {
    // For oauthAccount we need to compare content since it's an object
    // 服务层 client在这里进入条件判断，后续代码按实际状态分流。
    if (
      current.oauthAccount?.accountUuid === accountInfo.accountUuid &&
      current.oauthAccount?.emailAddress === accountInfo.emailAddress &&
      current.oauthAccount?.organizationUuid === accountInfo.organizationUuid &&
      current.oauthAccount?.displayName === accountInfo.displayName &&
      current.oauthAccount?.hasExtraUsageEnabled ===
        accountInfo.hasExtraUsageEnabled &&
      current.oauthAccount?.billingType === accountInfo.billingType &&
      current.oauthAccount?.accountCreatedAt === accountInfo.accountCreatedAt &&
      current.oauthAccount?.subscriptionCreatedAt ===
        accountInfo.subscriptionCreatedAt
    ) {
      // 返回 `current`，作为服务层 client这次计算的结果。
      return current
    }
    // 返回结构化结果，集中表达服务层 client已经整理出的状态。
    return { ...current, oauthAccount: accountInfo }
  })
}
