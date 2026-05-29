/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

// 整理这一组导入，让auth后续逻辑可以直接复用这些外部能力。
import {
  clearAuthRelatedCaches,
  performLogout,
} from '../../commands/logout/logout.js'
// 整理这一组导入，让auth后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
// 接入 getSSLErrorHint 服务层能力，把外部通信或共享状态交给 ../../services/api/errorUtils.js 处理。
import { getSSLErrorHint } from '../../services/api/errorUtils.js'
// 接入 fetchAndStoreClaudeCodeFirstTokenDate 服务层能力，把外部通信或共享状态交给 ../../services/api/firstTokenDate.js 处理。
import { fetchAndStoreClaudeCodeFirstTokenDate } from '../../services/api/firstTokenDate.js'
// 整理这一组导入，让auth后续逻辑可以直接复用这些外部能力。
import {
  createAndStoreApiKey,
  fetchAndStoreUserRoles,
  refreshOAuthToken,
  shouldUseClaudeAIAuth,
  storeOAuthAccountInfo,
} from '../../services/oauth/client.js'
// 接入 getOauthProfileFromOauthToken 服务层能力，把外部通信或共享状态交给 ../../services/oauth/getOauthProfile.js 处理。
import { getOauthProfileFromOauthToken } from '../../services/oauth/getOauthProfile.js'
// 接入 OAuthService 服务层能力，把外部通信或共享状态交给 ../../services/oauth/index.js 处理。
import { OAuthService } from '../../services/oauth/index.js'
// 类型依赖 { OAuthTokens } 来自 ../../services/oauth/types.js，用于校准auth的数据契约。
import type { OAuthTokens } from '../../services/oauth/types.js'
// 整理这一组导入，让auth后续逻辑可以直接复用这些外部能力。
import {
  clearOAuthTokenCache,
  getAnthropicApiKeyWithSource,
  getAuthTokenSource,
  getOauthAccountInfo,
  getSubscriptionType,
  isUsing3PServices,
  saveOAuthTokensIfNeeded,
  validateForceLoginOrg,
} from '../../utils/auth.js'
// 复用 saveGlobalConfig 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { saveGlobalConfig } from '../../utils/config.js'
// 复用 logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { logForDebugging } from '../../utils/debug.js'
// 复用 isRunningOnHomespace 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isRunningOnHomespace } from '../../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { logError } from '../../utils/log.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 ../../utils/model/providers.js 中维护。
import { getAPIProvider } from '../../utils/model/providers.js'
// 复用 getInitialSettings 工具函数，把通用处理留在 ../../utils/settings/settings.js 中维护。
import { getInitialSettings } from '../../utils/settings/settings.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让auth后续逻辑可以直接复用这些外部能力。
import {
  buildAccountProperties,
  buildAPIProviderProperties,
} from '../../utils/status.js'

/**
 * Shared post-token-acquisition logic. Saves tokens, fetches profile/roles,
 * and sets up the local auth state.
 */
// installOAuthTokens 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function installOAuthTokens(tokens: OAuthTokens): Promise<void> {
  // Clear old state before saving new credentials
  // 等待 `performLogout({ clearOnboarding: false })` 完成，再继续auth的异步流程。
  await performLogout({ clearOnboarding: false })

  // Reuse pre-fetched profile if available, otherwise fetch fresh
  // profile 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const profile =
    tokens.profile ?? (await getOauthProfileFromOauthToken(tokens.accessToken))
  // 满足 `profile` 时，auth执行该分支。
  if (profile) {
    // 调用 storeOAuthAccountInfo，触发auth此处需要的副作用。
    storeOAuthAccountInfo({
      accountUuid: profile.account.uuid,
      emailAddress: profile.account.email,
      organizationUuid: profile.organization.uuid,
      displayName: profile.account.display_name || undefined,
      hasExtraUsageEnabled:
        profile.organization.has_extra_usage_enabled ?? undefined,
      billingType: profile.organization.billing_type ?? undefined,
      subscriptionCreatedAt:
        profile.organization.subscription_created_at ?? undefined,
      accountCreatedAt: profile.account.created_at,
    })
  // auth在这里处理 `} else if (tokens.tokenAccount) {`，完成这一小步状态转换。
  } else if (tokens.tokenAccount) {
    // Fallback to token exchange account data when profile endpoint fails
    // 调用 storeOAuthAccountInfo，触发auth此处需要的副作用。
    storeOAuthAccountInfo({
      accountUuid: tokens.tokenAccount.uuid,
      emailAddress: tokens.tokenAccount.emailAddress,
      organizationUuid: tokens.tokenAccount.organizationUuid,
    })
  }

  // storageResult保存`saveOAuthTokensIfNeeded`，供auth后续处理使用。
  const storageResult = saveOAuthTokensIfNeeded(tokens)
  // 清理相关缓存，确保auth下一次读取时重新加载最新数据。
  clearOAuthTokenCache()

  // 满足 `storageResult.warning` 时，auth执行该分支。
  if (storageResult.warning) {
    // 记录auth运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_storage_warning', {
      warning:
        storageResult.warning as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
  }

  // Roles and first-token-date may fail for limited-scope tokens (e.g.
  // inference-only from setup-token). They're not required for core auth.
  // 这个回调绑定到 await fetchAndStoreUserRoles(tokens.accessToken).catch(err =>，负责auth在该局部场景下的响应。
  await fetchAndStoreUserRoles(tokens.accessToken).catch(err =>
    logForDebugging(String(err), { level: 'error' }),
  )

  // 满足 `shouldUseClaudeAIAuth(tokens.scopes)` 时，auth执行该分支。
  if (shouldUseClaudeAIAuth(tokens.scopes)) {
    // 这个回调绑定到 await fetchAndStoreClaudeCodeFirstTokenDate().catch(err =>，负责auth在该局部场景下的响应。
    await fetchAndStoreClaudeCodeFirstTokenDate().catch(err =>
      logForDebugging(String(err), { level: 'error' }),
    )
  } else {
    // API key creation is critical for Console users — let it throw.
    // API key构建`createAndStoreApiKey`，供auth后续处理使用。
    const apiKey = await createAndStoreApiKey(tokens.accessToken)
    // API key缺失时提前走兜底路径，避免auth继续依赖无效输入。
    if (!apiKey) {
      // 抛出 new Error(，阻止auth在无效状态下继续运行。
      throw new Error(
        'Unable to create API key. The server accepted the request but did not return a key.',
      )
    }
  }

  // 等待 `clearAuthRelatedCaches()` 完成，再继续auth的异步流程。
  await clearAuthRelatedCaches()
}

// authLogin 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function authLogin({
  email,
  sso,
  console: useConsole,
  claudeai,
}: {
  email?: string
  sso?: boolean
  console?: boolean
  claudeai?: boolean
}): Promise<void> {
  // 组合条件 `useConsole && claudeai` 成立时，auth才启用这条专门路径。
  if (useConsole && claudeai) {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      'Error: --console and --claudeai cannot be used together.\n',
    )
    // 调用 process.exit，触发auth此处需要的副作用。
    process.exit(1)
  }

  // settings 集合读取`getInitialSettings`，供auth后续处理使用。
  const settings = getInitialSettings()
  // forceLoginMethod is a hard constraint (enterprise setting) — matches ConsoleOAuthFlow behavior.
  // Without it, --console selects Console; --claudeai (or no flag) selects claude.ai.
  // loginWithClaudeAi 命名 `settings.forceLoginMethod`，让后续代码直接表达这个值的用途。
  const loginWithClaudeAi = settings.forceLoginMethod
    ? settings.forceLoginMethod === 'claudeai'
    : !useConsole
  // orgUUID 命名 `settings.forceLoginOrgUUID`，让后续代码直接表达这个值的用途。
  const orgUUID = settings.forceLoginOrgUUID

  // Fast path: if a refresh token is provided via env var, skip the browser
  // OAuth flow and exchange it directly for tokens.
  // envRefreshToken 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envRefreshToken = process.env.CLAUDE_CODE_OAUTH_REFRESH_TOKEN
  // 满足 `envRefreshToken` 时，auth执行该分支。
  if (envRefreshToken) {
    // envScopes 集合 来自环境变量默认值，运行参数仍可在入口处覆盖。
    const envScopes = process.env.CLAUDE_CODE_OAUTH_SCOPES
    // envScopes 集合缺失时提前走兜底路径，避免auth继续依赖无效输入。
    if (!envScopes) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        'CLAUDE_CODE_OAUTH_SCOPES is required when using CLAUDE_CODE_OAUTH_REFRESH_TOKEN.\n' +
          'Set it to the space-separated scopes the refresh token was issued with\n' +
          '(e.g. "user:inference" or "user:profile user:inference user:sessions:claude_code user:mcp_servers").\n',
      )
      // 调用 process.exit，触发auth此处需要的副作用。
      process.exit(1)
    }

    // scopes 集合格式化`envScopes.split`，供auth后续处理使用。
    const scopes = envScopes.split(/\s+/).filter(Boolean)

    // 保护这一段可能失败的auth操作，确保异常能进入相邻错误处理。
    try {
      // 记录auth运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_login_from_refresh_token', {})

      // token 列表保存`refreshOAuthToken`，供auth后续处理使用。
      const tokens = await refreshOAuthToken(envRefreshToken, { scopes })
      // 等待 `installOAuthTokens(tokens)` 完成，再继续auth的异步流程。
      await installOAuthTokens(tokens)

      // orgResult读取`validateForceLoginOrg`，供auth后续处理使用。
      const orgResult = await validateForceLoginOrg()
      // orgResult.valid缺失时提前走兜底路径，避免auth继续依赖无效输入。
      if (!orgResult.valid) {
        // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
        process.stderr.write(orgResult.message + '\n')
        // 调用 process.exit，触发auth此处需要的副作用。
        process.exit(1)
      }

      // Mark onboarding complete — interactive paths handle this via
      // the Onboarding component, but the env var path skips it.
      // 调用 saveGlobalConfig，触发auth此处需要的副作用。
      saveGlobalConfig(current => {
        // 满足 `current.hasCompletedOnboarding` 时，auth执行该分支。
        if (current.hasCompletedOnboarding) return current
        // 返回结构化结果，集中表达auth已经整理出的状态。
        return { ...current, hasCompletedOnboarding: true }
      })

      // 记录auth运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_success', {
        loginWithClaudeAi: shouldUseClaudeAIAuth(tokens.scopes),
      })
      // 向标准输出写入auth要展示给用户的文本。
      process.stdout.write('Login successful.\n')
      // 调用 process.exit，触发auth此处需要的副作用。
      process.exit(0)
    } catch (err) {
      // 记录auth运行诊断，方便排查异常路径或性能问题。
      logError(err)
      // sslHint读取`getSSLErrorHint`，供auth后续处理使用。
      const sslHint = getSSLErrorHint(err)
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(
        `Login failed: ${errorMessage(err)}\n${sslHint ? sslHint + '\n' : ''}`,
      )
      // 调用 process.exit，触发auth此处需要的副作用。
      process.exit(1)
    }
  }

  // resolvedLoginMethod 命名 `sso ? 'sso' : undefined`，让后续代码直接表达这个值的用途。
  const resolvedLoginMethod = sso ? 'sso' : undefined

  // oauthService保存`OAuthService`，供auth后续处理使用。
  const oauthService = new OAuthService()

  // 保护这一段可能失败的auth操作，确保异常能进入相邻错误处理。
  try {
    // 记录auth运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_flow_start', { loginWithClaudeAi })

    // 结果保存`oauthService.startOAuthFlow`，供auth后续处理使用。
    const result = await oauthService.startOAuthFlow(
      // 这个回调绑定到 async url => {，负责auth在该局部场景下的响应。
      async url => {
        // 向标准输出写入auth要展示给用户的文本。
        process.stdout.write('Opening browser to sign in…\n')
        // 向标准输出写入auth要展示给用户的文本。
        process.stdout.write(`If the browser didn't open, visit: ${url}\n`)
      },
      {
        loginWithClaudeAi,
        loginHint: email,
        loginMethod: resolvedLoginMethod,
        orgUUID,
      },
    )

    // 等待 `installOAuthTokens(result)` 完成，再继续auth的异步流程。
    await installOAuthTokens(result)

    // orgResult读取`validateForceLoginOrg`，供auth后续处理使用。
    const orgResult = await validateForceLoginOrg()
    // orgResult.valid缺失时提前走兜底路径，避免auth继续依赖无效输入。
    if (!orgResult.valid) {
      // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
      process.stderr.write(orgResult.message + '\n')
      // 调用 process.exit，触发auth此处需要的副作用。
      process.exit(1)
    }

    // 记录auth运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_success', { loginWithClaudeAi })

    // 向标准输出写入auth要展示给用户的文本。
    process.stdout.write('Login successful.\n')
    // 调用 process.exit，触发auth此处需要的副作用。
    process.exit(0)
  } catch (err) {
    // 记录auth运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // sslHint读取`getSSLErrorHint`，供auth后续处理使用。
    const sslHint = getSSLErrorHint(err)
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write(
      `Login failed: ${errorMessage(err)}\n${sslHint ? sslHint + '\n' : ''}`,
    )
    // 调用 process.exit，触发auth此处需要的副作用。
    process.exit(1)
  } finally {
    // 调用 oauthService.cleanup，触发auth此处需要的副作用。
    oauthService.cleanup()
  }
}

// authStatus 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function authStatus(opts: {
  json?: boolean
  text?: boolean
}): Promise<void> {
  // 从 `getAuthTokenSource()` 解构 source、hasToken，减少auth对同一对象的重复访问。
  const { source: authTokenSource, hasToken } = getAuthTokenSource()
  // 从 `getAnthropicApiKeyWithSource()` 解构 source，减少auth对同一对象的重复访问。
  const { source: apiKeySource } = getAnthropicApiKeyWithSource()
  // hasApiKeyEnvVar 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasApiKeyEnvVar =
    !!process.env.ANTHROPIC_API_KEY && !isRunningOnHomespace()
  // oauthAccount 数量读取`getOauthAccountInfo`，供auth后续处理使用。
  const oauthAccount = getOauthAccountInfo()
  // subscriptionType读取`getSubscriptionType`，供auth后续处理使用。
  const subscriptionType = getSubscriptionType()
  // using3P保存`isUsing3PServices`，供auth后续处理使用。
  const using3P = isUsing3PServices()
  // loggedIn 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const loggedIn =
    hasToken || apiKeySource !== 'none' || hasApiKeyEnvVar || using3P

  // Determine auth method
  // authMethod固定为 `'none'`，作为auth后续展示或比较的基准。
  let authMethod: string = 'none'
  // 满足 `using3P` 时，auth执行该分支。
  if (using3P) {
    // authMethod更新为 `'third_party'`，确保CLI后续读取最新状态。
    authMethod = 'third_party'
  // auth在这里处理 `} else if (authTokenSource === 'claude.ai') {`，完成这一小步状态转换。
  } else if (authTokenSource === 'claude.ai') {
    // authMethod更新为 `'claude.ai'`，确保CLI后续读取最新状态。
    authMethod = 'claude.ai'
  // auth在这里处理 `} else if (authTokenSource === 'apiKeyHelper') {`，完成这一小步状态转换。
  } else if (authTokenSource === 'apiKeyHelper') {
    // authMethod更新为 `'api_key_helper'`，确保CLI后续读取最新状态。
    authMethod = 'api_key_helper'
  // auth在这里处理 `} else if (authTokenSource !== 'none') {`，完成这一小步状态转换。
  } else if (authTokenSource !== 'none') {
    // authMethod更新为 `'oauth_token'`，确保CLI后续读取最新状态。
    authMethod = 'oauth_token'
  // auth在这里处理 `} else if (apiKeySource === 'ANTHROPIC_API_KEY' || hasApiKeyEnvVar) {`，完成这一小步状态转换。
  } else if (apiKeySource === 'ANTHROPIC_API_KEY' || hasApiKeyEnvVar) {
    // authMethod更新为 `'api_key'`，确保CLI后续读取最新状态。
    authMethod = 'api_key'
  // auth在这里处理 `} else if (apiKeySource === '/login managed key') {`，完成这一小步状态转换。
  } else if (apiKeySource === '/login managed key') {
    // authMethod更新为 `'claude.ai'`，确保CLI后续读取最新状态。
    authMethod = 'claude.ai'
  }

  // 满足 `opts.text` 时，auth执行该分支。
  if (opts.text) {
    // properties 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const properties = [
      ...buildAccountProperties(),
      ...buildAPIProviderProperties(),
    ]
    // hasAuthProperty标记auth是否启用对应路径。
    let hasAuthProperty = false
    // 按顺序遍历 `properties` 中的prop，逐个交给auth处理。
    for (const prop of properties) {
      // value 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const value =
        typeof prop.value === 'string'
          ? prop.value
          : Array.isArray(prop.value)
            ? prop.value.join(', ')
            : null
      // 当 `value === null || value` 匹配 `'none'` 时，auth执行对应分支。
      if (value === null || value === 'none') {
        // 跳过当前项，继续处理auth中的下一轮循环。
        continue
      }
      // hasAuthProperty更新为 `true`，确保CLI后续读取最新状态。
      hasAuthProperty = true
      // 满足 `prop.label` 时，auth执行该分支。
      if (prop.label) {
        // 向标准输出写入auth要展示给用户的文本。
        process.stdout.write(`${prop.label}: ${value}\n`)
      } else {
        // 向标准输出写入auth要展示给用户的文本。
        process.stdout.write(`${value}\n`)
      }
    }
    // 组合条件 `!hasAuthProperty && hasApiKeyEnvVar` 成立时，auth才启用这条专门路径。
    if (!hasAuthProperty && hasApiKeyEnvVar) {
      // 向标准输出写入auth要展示给用户的文本。
      process.stdout.write('API key: ANTHROPIC_API_KEY\n')
    }
    // loggedIn缺失时提前走兜底路径，避免auth继续依赖无效输入。
    if (!loggedIn) {
      // 向标准输出写入auth要展示给用户的文本。
      process.stdout.write(
        'Not logged in. Run claude auth login to authenticate.\n',
      )
    }
  } else {
    // apiProvider读取`getAPIProvider`，供auth后续处理使用。
    const apiProvider = getAPIProvider()
    // resolvedApiKeySource 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const resolvedApiKeySource =
      apiKeySource !== 'none'
        ? apiKeySource
        : hasApiKeyEnvVar
          ? 'ANTHROPIC_API_KEY'
          : null
    // output 集中保存auth要一起传递的字段。
    const output: Record<string, string | boolean | null> = {
      loggedIn,
      authMethod,
      apiProvider,
    }
    // 满足 `resolvedApiKeySource` 时，auth执行该分支。
    if (resolvedApiKeySource) {
      // apiKeySource更新为 `resolvedApiKeySource`，确保CLI后续读取最新状态。
      output.apiKeySource = resolvedApiKeySource
    }
    // 当 `authMethod` 匹配 `'claude.ai'` 时，auth执行对应分支。
    if (authMethod === 'claude.ai') {
      // email更新为 `oauthAccount?.emailAddress ?? null`，确保CLI后续读取最新状态。
      output.email = oauthAccount?.emailAddress ?? null
      // orgId更新为 `oauthAccount?.organizationUuid ?? null`，确保CLI后续读取最新状态。
      output.orgId = oauthAccount?.organizationUuid ?? null
      // orgName更新为 `oauthAccount?.organizationName ?? null`，确保CLI后续读取最新状态。
      output.orgName = oauthAccount?.organizationName ?? null
      // subscriptionType更新为 `subscriptionType ?? null`，确保CLI后续读取最新状态。
      output.subscriptionType = subscriptionType ?? null
    }

    // 向标准输出写入auth要展示给用户的文本。
    process.stdout.write(jsonStringify(output, null, 2) + '\n')
  }
  // 调用 process.exit，触发auth此处需要的副作用。
  process.exit(loggedIn ? 0 : 1)
}

// authLogout 封装CLI的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function authLogout(): Promise<void> {
  // 保护这一段可能失败的auth操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `performLogout({ clearOnboarding: false })` 完成，再继续auth的异步流程。
    await performLogout({ clearOnboarding: false })
  } catch {
    // 向标准错误写入诊断信息，便于脚本调用方识别失败原因。
    process.stderr.write('Failed to log out.\n')
    // 调用 process.exit，触发auth此处需要的副作用。
    process.exit(1)
  }
  // 向标准输出写入auth要展示给用户的文本。
  process.stdout.write('Successfully logged out from your Anthropic account.\n')
  // 调用 process.exit，触发auth此处需要的副作用。
  process.exit(0)
}
