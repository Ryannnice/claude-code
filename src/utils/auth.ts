// 引入 chalk，将 chalk 中已经封装好的能力接到本文件流程里。
import chalk from 'chalk'
// 使用 Node/Bun 的 child_process 能力处理本地运行时资源。
import { exec } from 'child_process'
// 引入 execa，将 execa 中已经封装好的能力接到本文件流程里。
import { execa } from 'execa'
// 使用 Node/Bun 的 fs/promises 能力处理本地运行时资源。
import { mkdir, stat } from 'fs/promises'
// 引入 memoize，将 lodash-es/memoize.js 中已经封装好的能力接到本文件流程里。
import memoize from 'lodash-es/memoize.js'
// 使用 Node/Bun 的 path 能力处理本地运行时资源。
import { join } from 'path'
// 引入 CLAUDE_AI_PROFILE_SCOPE，将 src/constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { CLAUDE_AI_PROFILE_SCOPE } from 'src/constants/oauth.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from 'src/services/analytics/index.js'
// 复用 getModelStrings 工具函数，把通用处理留在 src/utils/model/modelStrings.js 中维护。
import { getModelStrings } from 'src/utils/model/modelStrings.js'
// 复用 getAPIProvider 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProvider } from 'src/utils/model/providers.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  preferThirdPartyAuthentication,
} from '../bootstrap/state.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getMockSubscriptionType,
  shouldUseMockSubscription,
} from '../services/mockRateLimits.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  isOAuthTokenExpired,
  refreshOAuthToken,
  shouldUseClaudeAIAuth,
} from '../services/oauth/client.js'
// 接入 getOauthProfileFromOauthToken 服务层能力，把外部通信或共享状态交给 ../services/oauth/getOauthProfile.js 处理。
import { getOauthProfileFromOauthToken } from '../services/oauth/getOauthProfile.js'
// 类型依赖 { OAuthTokens, SubscriptionType } 来自 ../services/oauth/types.js，用于校准共享工具的数据契约。
import type { OAuthTokens, SubscriptionType } from '../services/oauth/types.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getApiKeyFromFileDescriptor,
  getOAuthTokenFromFileDescriptor,
} from './authFileDescriptor.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  maybeRemoveApiKeyFromMacOSKeychainThrows,
  normalizeApiKeyForConfig,
} from './authPortable.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  checkStsCallerIdentity,
  clearAwsIniCache,
  isValidAwsStsOutput,
} from './aws.js'
// 引入 AwsAuthStatusManager，将 ./awsAuthStatusManager.js 中已经封装好的能力接到本文件流程里。
import { AwsAuthStatusManager } from './awsAuthStatusManager.js'
// 引入 clearBetasCaches，将 ./betas.js 中已经封装好的能力接到本文件流程里。
import { clearBetasCaches } from './betas.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  type AccountInfo,
  checkHasTrustDialogAccepted,
  getGlobalConfig,
  saveGlobalConfig,
} from './config.js'
// 引入 logAntError、logForDebugging，将 ./debug.js 中已经封装好的能力接到本文件流程里。
import { logAntError, logForDebugging } from './debug.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getClaudeConfigHomeDir,
  isBareMode,
  isEnvTruthy,
  isRunningOnHomespace,
} from './envUtils.js'
// 引入 errorMessage，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { errorMessage } from './errors.js'
// 引入 execSyncWithDefaults_DEPRECATED，将 ./execFileNoThrow.js 中已经封装好的能力接到本文件流程里。
import { execSyncWithDefaults_DEPRECATED } from './execFileNoThrow.js'
// 引入 * as lockfile，将 ./lockfile.js 中已经封装好的能力接到本文件流程里。
import * as lockfile from './lockfile.js'
// 引入 logError，将 ./log.js 中已经封装好的能力接到本文件流程里。
import { logError } from './log.js'
// 引入 memoizeWithTTLAsync，将 ./memoize.js 中已经封装好的能力接到本文件流程里。
import { memoizeWithTTLAsync } from './memoize.js'
// 引入 getSecureStorage，将 ./secureStorage/index.js 中已经封装好的能力接到本文件流程里。
import { getSecureStorage } from './secureStorage/index.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  clearLegacyApiKeyPrefetch,
  getLegacyApiKeyPrefetchResult,
} from './secureStorage/keychainPrefetch.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  clearKeychainCache,
  getMacOsKeychainStorageServiceName,
  getUsername,
} from './secureStorage/macOsKeychainHelpers.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getSettings_DEPRECATED,
  getSettingsForSource,
} from './settings/settings.js'
// 引入 sleep，将 ./sleep.js 中已经封装好的能力接到本文件流程里。
import { sleep } from './sleep.js'
// 引入 jsonParse，将 ./slowOperations.js 中已经封装好的能力接到本文件流程里。
import { jsonParse } from './slowOperations.js'
// 引入 clearToolSchemaCache，将 ./toolSchemaCache.js 中已经封装好的能力接到本文件流程里。
import { clearToolSchemaCache } from './toolSchemaCache.js'

/** Default TTL for API key helper cache in milliseconds (5 minutes) */
// DEFAULT_API_KEY_HELPER_TTL保存`5 * 60 * 1000`，供共享工具 auth后续判断或输出使用。
const DEFAULT_API_KEY_HELPER_TTL = 5 * 60 * 1000

/**
 * CCR and Claude Desktop spawn the CLI with OAuth and should never fall back
 * to the user's ~/.claude/settings.json API-key config (apiKeyHelper,
 * env.ANTHROPIC_API_KEY, env.ANTHROPIC_AUTH_TOKEN). Those settings exist for
 * the user's terminal CLI, not managed sessions. Without this guard, a user
 * who runs `claude` in their terminal with an API key sees every CCD session
 * also use that key — and fail if it's stale/wrong-org.
 */
// isManagedOAuthContext 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isManagedOAuthContext(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) ||
    process.env.CLAUDE_CODE_ENTRYPOINT === 'claude-desktop'
  )
}

/** Whether we are supporting direct 1P auth. */
// this code is closely related to getAuthTokenSource
// isAnthropicAuthEnabled 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAnthropicAuthEnabled(): boolean {
  // --bare: API-key-only, never OAuth.
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) return false

  // `claude ssh` remote: ANTHROPIC_UNIX_SOCKET tunnels API calls through a
  // local auth-injecting proxy. The launcher sets CLAUDE_CODE_OAUTH_TOKEN as a
  // placeholder iff the local side is a subscriber (so the remote includes the
  // oauth-2025 beta header to match what the proxy will inject). The remote's
  // ~/.claude settings (apiKeyHelper, settings.env.ANTHROPIC_API_KEY) MUST NOT
  // flip this — they'd cause a header mismatch with the proxy and a bogus
  // "invalid x-api-key" from the API. See src/ssh/sshAuthProxy.ts.
  // 满足 `process.env.ANTHROPIC_UNIX_SOCKET` 时，共享工具执行该分支。
  if (process.env.ANTHROPIC_UNIX_SOCKET) {
    // 返回 `!!process.env.CLAUDE_CODE_OAUTH_TOKEN`，作为共享工具这次计算的结果。
    return !!process.env.CLAUDE_CODE_OAUTH_TOKEN
  }

  // is3P 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const is3P =
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)

  // Check if user has configured an external API key source
  // This allows externally-provided API keys to work (without requiring proxy configuration)
  // settings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const settings = getSettings_DEPRECATED() || {}
  // apiKeyHelper 命名 `settings.apiKeyHelper`，让后续代码直接表达这个值的用途。
  const apiKeyHelper = settings.apiKeyHelper
  // hasExternalAuthToken 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasExternalAuthToken =
    process.env.ANTHROPIC_AUTH_TOKEN ||
    apiKeyHelper ||
    process.env.CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR

  // Check if API key is from an external source (not managed by /login)
  // 从 `getAnthropicApiKeyWithSource({` 解构 source，减少共享工具 auth对同一对象的重复访问。
  const { source: apiKeySource } = getAnthropicApiKeyWithSource({
    skipRetrievingKeyFromApiKeyHelper: true,
  })
  // hasExternalApiKey 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasExternalApiKey =
    apiKeySource === 'ANTHROPIC_API_KEY' || apiKeySource === 'apiKeyHelper'

  // Disable Anthropic auth if:
  // 1. Using 3rd party services (Bedrock/Vertex/Foundry)
  // 2. User has an external API key (regardless of proxy configuration)
  // 3. User has an external auth token (regardless of proxy configuration)
  // this may cause issues if users have complex proxy / gateway "client-side creds" auth scenarios,
  // e.g. if they want to set X-Api-Key to a gateway key but use Anthropic OAuth for the Authorization
  // if we get reports of that, we should probably add an env var to force OAuth enablement
  // shouldDisableAuth 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const shouldDisableAuth =
    is3P ||
    (hasExternalAuthToken && !isManagedOAuthContext()) ||
    (hasExternalApiKey && !isManagedOAuthContext())

  // 返回 `!shouldDisableAuth`，作为共享工具这次计算的结果。
  return !shouldDisableAuth
}

/** Where the auth token is being sourced from, if any. */
// this code is closely related to isAnthropicAuthEnabled
// getAuthTokenSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAuthTokenSource() {
  // --bare: API-key-only. apiKeyHelper (from --settings) is the only
  // bearer-token-shaped source allowed. OAuth env vars, FD tokens, and
  // keychain are ignored.
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) {
    // 满足 `getConfiguredApiKeyHelper()` 时，共享工具执行该分支。
    if (getConfiguredApiKeyHelper()) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { source: 'apiKeyHelper' as const, hasToken: true }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { source: 'none' as const, hasToken: false }
  }

  // 只有 `process.env.ANTHROPIC_AUTH_TOKEN && !isManagedOAuthContext()` 满足时，共享工具才执行该分支。
  if (process.env.ANTHROPIC_AUTH_TOKEN && !isManagedOAuthContext()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { source: 'ANTHROPIC_AUTH_TOKEN' as const, hasToken: true }
  }

  // 满足 `process.env.CLAUDE_CODE_OAUTH_TOKEN` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { source: 'CLAUDE_CODE_OAUTH_TOKEN' as const, hasToken: true }
  }

  // Check for OAuth token from file descriptor (or its CCR disk fallback)
  // oauthTokenFromFd读取`getOAuthTokenFromFileDescriptor`，供共享工具后续处理使用。
  const oauthTokenFromFd = getOAuthTokenFromFileDescriptor()
  // 满足 `oauthTokenFromFd` 时，共享工具执行该分支。
  if (oauthTokenFromFd) {
    // getOAuthTokenFromFileDescriptor has a disk fallback for CCR subprocesses
    // that can't inherit the pipe FD. Distinguish by env var presence so the
    // org-mismatch message doesn't tell the user to unset a variable that
    // doesn't exist. Call sites fall through correctly — the new source is
    // !== 'none' (cli/handlers/auth.ts → oauth_token) and not in the
    // isEnvVarToken set (auth.ts:1844 → generic re-login message).
    // 满足 `process.env.CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPT` 时，共享工具执行该分支。
    if (process.env.CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        source: 'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR' as const,
        hasToken: true,
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      source: 'CCR_OAUTH_TOKEN_FILE' as const,
      hasToken: true,
    }
  }

  // Check if apiKeyHelper is configured without executing it
  // This prevents security issues where arbitrary code could execute before trust is established
  // apiKeyHelper读取`getConfiguredApiKeyHelper`，供共享工具后续处理使用。
  const apiKeyHelper = getConfiguredApiKeyHelper()
  // 只有 `apiKeyHelper && !isManagedOAuthContext()` 满足时，共享工具才执行该分支。
  if (apiKeyHelper && !isManagedOAuthContext()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { source: 'apiKeyHelper' as const, hasToken: true }
  }

  // oauthTokens 集合读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const oauthTokens = getClaudeAIOAuthTokens()
  // 只有 `shouldUseClaudeAIAuth(oauthTokens?.scopes) && oauthTokens?.accessToken` 满足时，共享工具才执行该分支。
  if (shouldUseClaudeAIAuth(oauthTokens?.scopes) && oauthTokens?.accessToken) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { source: 'claude.ai' as const, hasToken: true }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return { source: 'none' as const, hasToken: false }
}

// ApiKeySource 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type ApiKeySource =
  | 'ANTHROPIC_API_KEY'
  | 'apiKeyHelper'
  | '/login managed key'
  | 'none'

// getAnthropicApiKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAnthropicApiKey(): null | string {
  // 从 `getAnthropicApiKeyWithSource()` 解构 key，减少共享工具 auth对同一对象的重复访问。
  const { key } = getAnthropicApiKeyWithSource()
  // 返回 `key`，作为共享工具这次计算的结果。
  return key
}

// hasAnthropicApiKeyAuth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasAnthropicApiKeyAuth(): boolean {
  // 从 `getAnthropicApiKeyWithSource({` 解构 key、source，减少共享工具 auth对同一对象的重复访问。
  const { key, source } = getAnthropicApiKeyWithSource({
    skipRetrievingKeyFromApiKeyHelper: true,
  })
  // 返回 `key !== null && source !== 'none'`，作为共享工具这次计算的结果。
  return key !== null && source !== 'none'
}

// getAnthropicApiKeyWithSource 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAnthropicApiKeyWithSource(
  opts: { skipRetrievingKeyFromApiKeyHelper?: boolean } = {},
): {
  key: null | string
  source: ApiKeySource
} {
  // --bare: hermetic auth. Only ANTHROPIC_API_KEY env or apiKeyHelper from
  // the --settings flag. Never touches keychain, config file, or approval
  // lists. 3P (Bedrock/Vertex/Foundry) uses provider creds, not this path.
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) {
    // 满足 `process.env.ANTHROPIC_API_KEY` 时，共享工具执行该分支。
    if (process.env.ANTHROPIC_API_KEY) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return { key: process.env.ANTHROPIC_API_KEY, source: 'ANTHROPIC_API_KEY' }
    }
    // 满足 `getConfiguredApiKeyHelper()` 时，共享工具执行该分支。
    if (getConfiguredApiKeyHelper()) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        key: opts.skipRetrievingKeyFromApiKeyHelper
          ? null
          : getApiKeyFromApiKeyHelperCached(),
        source: 'apiKeyHelper',
      }
    }
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { key: null, source: 'none' }
  }

  // On homespace, don't use ANTHROPIC_API_KEY (use Console key instead)
  // https://anthropic.slack.com/archives/C08428WSLKV/p1747331773214779
  // apiKeyEnv保存`isRunningOnHomespace`，供共享工具后续处理使用。
  const apiKeyEnv = isRunningOnHomespace()
    ? undefined
    : process.env.ANTHROPIC_API_KEY

  // Always check for direct environment variable when the user ran claude --print.
  // This is useful for CI, etc.
  // 只有 `preferThirdPartyAuthentication() && apiKeyEnv` 满足时，共享工具才执行该分支。
  if (preferThirdPartyAuthentication() && apiKeyEnv) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      key: apiKeyEnv,
      source: 'ANTHROPIC_API_KEY',
    }
  }

  // 当 `isEnvTruthy(process.env.CI) || process.env....` 匹配 `'test'` 时，共享工具执行对应分支。
  if (isEnvTruthy(process.env.CI) || process.env.NODE_ENV === 'test') {
    // Check for API key from file descriptor first
    // apiKeyFromFd读取`getApiKeyFromFileDescriptor`，供共享工具后续处理使用。
    const apiKeyFromFd = getApiKeyFromFileDescriptor()
    // 满足 `apiKeyFromFd` 时，共享工具执行该分支。
    if (apiKeyFromFd) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        key: apiKeyFromFd,
        source: 'ANTHROPIC_API_KEY',
      }
    }

    // 共享工具在这里按实际状态进入对应分支。
    if (
      !apiKeyEnv &&
      !process.env.CLAUDE_CODE_OAUTH_TOKEN &&
      !process.env.CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR
    ) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        'ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN env var is required',
      )
    }

    // 满足 `apiKeyEnv` 时，共享工具执行该分支。
    if (apiKeyEnv) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        key: apiKeyEnv,
        source: 'ANTHROPIC_API_KEY',
      }
    }

    // OAuth token is present but this function returns API keys only
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      key: null,
      source: 'none',
    }
  }
  // Check for ANTHROPIC_API_KEY before checking the apiKeyHelper or /login-managed key
  // 共享工具在这里按实际状态进入对应分支。
  if (
    apiKeyEnv &&
    getGlobalConfig().customApiKeyResponses?.approved?.includes(
      normalizeApiKeyForConfig(apiKeyEnv),
    )
  ) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      key: apiKeyEnv,
      source: 'ANTHROPIC_API_KEY',
    }
  }

  // Check for API key from file descriptor
  // apiKeyFromFd读取`getApiKeyFromFileDescriptor`，供共享工具后续处理使用。
  const apiKeyFromFd = getApiKeyFromFileDescriptor()
  // 满足 `apiKeyFromFd` 时，共享工具执行该分支。
  if (apiKeyFromFd) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      key: apiKeyFromFd,
      source: 'ANTHROPIC_API_KEY',
    }
  }

  // Check for apiKeyHelper — use sync cache, never block
  // apiKeyHelperCommand 命令数据读取`getConfiguredApiKeyHelper`，供共享工具后续处理使用。
  const apiKeyHelperCommand = getConfiguredApiKeyHelper()
  // 满足 `apiKeyHelperCommand` 时，共享工具执行该分支。
  if (apiKeyHelperCommand) {
    // 满足 `opts.skipRetrievingKeyFromApiKeyHelper` 时，共享工具执行该分支。
    if (opts.skipRetrievingKeyFromApiKeyHelper) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        key: null,
        source: 'apiKeyHelper',
      }
    }
    // Cache may be cold (helper hasn't finished yet). Return null with
    // source='apiKeyHelper' rather than falling through to keychain —
    // apiKeyHelper must win. Callers needing a real key must await
    // getApiKeyFromApiKeyHelper() first (client.ts, useApiKeyVerification do).
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      key: getApiKeyFromApiKeyHelperCached(),
      source: 'apiKeyHelper',
    }
  }

  // apiKeyFromConfigOrMacOSKeychain 配置读取`getApiKeyFromConfigOrMacOSKeychain`，供共享工具后续处理使用。
  const apiKeyFromConfigOrMacOSKeychain = getApiKeyFromConfigOrMacOSKeychain()
  // 满足 `apiKeyFromConfigOrMacOSKeychain` 时，共享工具执行该分支。
  if (apiKeyFromConfigOrMacOSKeychain) {
    // 返回 `apiKeyFromConfigOrMacOSKeychain`，作为共享工具这次计算的结果。
    return apiKeyFromConfigOrMacOSKeychain
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    key: null,
    source: 'none',
  }
}

/**
 * Get the configured apiKeyHelper from settings.
 * In bare mode, only the --settings flag source is consulted — apiKeyHelper
 * from ~/.claude/settings.json or project settings is ignored.
 */
// getConfiguredApiKeyHelper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getConfiguredApiKeyHelper(): string | undefined {
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) {
    // 返回 `getSettingsForSource('flagSettings')?.apiKeyHelper`，作为共享工具这次计算的结果。
    return getSettingsForSource('flagSettings')?.apiKeyHelper
  }
  // mergedSettings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = getSettings_DEPRECATED() || {}
  // 返回 `mergedSettings.apiKeyHelper`，作为共享工具这次计算的结果。
  return mergedSettings.apiKeyHelper
}

/**
 * Check if the configured apiKeyHelper comes from project settings (projectSettings or localSettings)
 */
// isApiKeyHelperFromProjectOrLocalSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isApiKeyHelperFromProjectOrLocalSettings(): boolean {
  // apiKeyHelper读取`getConfiguredApiKeyHelper`，供共享工具后续处理使用。
  const apiKeyHelper = getConfiguredApiKeyHelper()
  // apiKeyHelper缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!apiKeyHelper) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // projectSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // localSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    projectSettings?.apiKeyHelper === apiKeyHelper ||
    localSettings?.apiKeyHelper === apiKeyHelper
  )
}

/**
 * Get the configured awsAuthRefresh from settings
 */
// getConfiguredAwsAuthRefresh 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfiguredAwsAuthRefresh(): string | undefined {
  // mergedSettings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = getSettings_DEPRECATED() || {}
  // 返回 `mergedSettings.awsAuthRefresh`，作为共享工具这次计算的结果。
  return mergedSettings.awsAuthRefresh
}

/**
 * Check if the configured awsAuthRefresh comes from project settings
 */
// isAwsAuthRefreshFromProjectSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAwsAuthRefreshFromProjectSettings(): boolean {
  // awsAuthRefresh读取`getConfiguredAwsAuthRefresh`，供共享工具后续处理使用。
  const awsAuthRefresh = getConfiguredAwsAuthRefresh()
  // awsAuthRefresh缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!awsAuthRefresh) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // projectSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // localSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    projectSettings?.awsAuthRefresh === awsAuthRefresh ||
    localSettings?.awsAuthRefresh === awsAuthRefresh
  )
}

/**
 * Get the configured awsCredentialExport from settings
 */
// getConfiguredAwsCredentialExport 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfiguredAwsCredentialExport(): string | undefined {
  // mergedSettings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = getSettings_DEPRECATED() || {}
  // 返回 `mergedSettings.awsCredentialExport`，作为共享工具这次计算的结果。
  return mergedSettings.awsCredentialExport
}

/**
 * Check if the configured awsCredentialExport comes from project settings
 */
// isAwsCredentialExportFromProjectSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isAwsCredentialExportFromProjectSettings(): boolean {
  // awsCredentialExport读取`getConfiguredAwsCredentialExport`，供共享工具后续处理使用。
  const awsCredentialExport = getConfiguredAwsCredentialExport()
  // awsCredentialExport缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!awsCredentialExport) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // projectSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // localSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    projectSettings?.awsCredentialExport === awsCredentialExport ||
    localSettings?.awsCredentialExport === awsCredentialExport
  )
}

/**
 * Calculate TTL in milliseconds for the API key helper cache
 * Uses CLAUDE_CODE_API_KEY_HELPER_TTL_MS env var if set and valid,
 * otherwise defaults to 5 minutes
 */
// calculateApiKeyHelperTTL 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function calculateApiKeyHelperTTL(): number {
  // envTtl 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const envTtl = process.env.CLAUDE_CODE_API_KEY_HELPER_TTL_MS

  // 满足 `envTtl` 时，共享工具执行该分支。
  if (envTtl) {
    // 解析结果解析`parseInt`，供共享工具后续处理使用。
    const parsed = parseInt(envTtl, 10)
    // 只有 `!Number.isNaN(parsed) && parsed >= 0` 满足时，共享工具才执行该分支。
    if (!Number.isNaN(parsed) && parsed >= 0) {
      // 返回 `parsed`，作为共享工具这次计算的结果。
      return parsed
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Found CLAUDE_CODE_API_KEY_HELPER_TTL_MS env var, but it was not a valid number. Got ${envTtl}`,
      { level: 'error' },
    )
  }

  // 返回 `DEFAULT_API_KEY_HELPER_TTL`，作为共享工具这次计算的结果。
  return DEFAULT_API_KEY_HELPER_TTL
}

// Async API key helper with sync cache for non-blocking reads.
// Epoch bumps on clearApiKeyHelperCache() — orphaned executions check their
// captured epoch before touching module state so a settings-change or 401-retry
// mid-flight can't clobber the newer cache/inflight.
// _apiKeyHelperCache 缓存 命名 `null`，让后续代码直接表达这个值的用途。
let _apiKeyHelperCache: { value: string; timestamp: number } | null = null
// _apiKeyHelperInflight 先占位，稍后的条件分支会根据实际输入补齐它。
let _apiKeyHelperInflight: {
  promise: Promise<string | null>
  // Only set on cold launches (user is waiting); null for SWR background refreshes.
  startedAt: number | null
} | null = null
// _apiKeyHelperEpoch保存`0`，供共享工具 auth后续判断或输出使用。
let _apiKeyHelperEpoch = 0

// getApiKeyHelperElapsedMs 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getApiKeyHelperElapsedMs(): number {
  // startedAt保存`_apiKeyHelperInflight?.startedAt`，供后续判断或组装使用。
  const startedAt = _apiKeyHelperInflight?.startedAt
  // 返回 `startedAt ? Date.now() - startedAt : 0`，作为共享工具这次计算的结果。
  return startedAt ? Date.now() - startedAt : 0
}

// getApiKeyFromApiKeyHelper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getApiKeyFromApiKeyHelper(
  isNonInteractiveSession: boolean,
): Promise<string | null> {
  // 满足 `!getConfiguredApiKeyHelper()` 时，共享工具执行该分支。
  if (!getConfiguredApiKeyHelper()) return null
  // ttl保存`calculateApiKeyHelperTTL`，供共享工具后续处理使用。
  const ttl = calculateApiKeyHelperTTL()
  // 满足 `_apiKeyHelperCache` 时，共享工具执行该分支。
  if (_apiKeyHelperCache) {
    // 满足 `Date.now() - _apiKeyHelperCache.timestamp < ttl` 时，共享工具执行该分支。
    if (Date.now() - _apiKeyHelperCache.timestamp < ttl) {
      // 返回 `_apiKeyHelperCache.value`，作为共享工具这次计算的结果。
      return _apiKeyHelperCache.value
    }
    // Stale — return stale value now, refresh in the background.
    // `??=` banned here by eslint no-nullish-assign-object-call (bun bug).
    // _apiKeyHelperInflight缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!_apiKeyHelperInflight) {
      // _apiKeyHelperInflight更新为 `{`，确保共享工具后续读取最新状态。
      _apiKeyHelperInflight = {
        promise: _runAndCache(
          isNonInteractiveSession,
          false,
          _apiKeyHelperEpoch,
        ),
        startedAt: null,
      }
    }
    // 返回 `_apiKeyHelperCache.value`，作为共享工具这次计算的结果。
    return _apiKeyHelperCache.value
  }
  // Cold cache — deduplicate concurrent calls
  // 满足 `_apiKeyHelperInflight` 时，共享工具执行该分支。
  if (_apiKeyHelperInflight) return _apiKeyHelperInflight.promise
  // _apiKeyHelperInflight更新为 `{`，确保共享工具后续读取最新状态。
  _apiKeyHelperInflight = {
    promise: _runAndCache(isNonInteractiveSession, true, _apiKeyHelperEpoch),
    startedAt: Date.now(),
  }
  // 返回 `_apiKeyHelperInflight.promise`，作为共享工具这次计算的结果。
  return _apiKeyHelperInflight.promise
}

// _runAndCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _runAndCache(
  isNonInteractiveSession: boolean,
  isCold: boolean,
  epoch: number,
): Promise<string | null> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 取值保存`_executeApiKeyHelper`，供共享工具后续处理使用。
    const value = await _executeApiKeyHelper(isNonInteractiveSession)
    // `epoch` 与 `_apiKeyHelperEpoch` 不一致时刷新派生状态，避免使用过期结果。
    if (epoch !== _apiKeyHelperEpoch) return value
    // `value` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
    if (value !== null) {
      // _apiKeyHelperCache 缓存更新为 `{ value, timestamp: Date.now() }`，确保共享工具后续读取最新状态。
      _apiKeyHelperCache = { value, timestamp: Date.now() }
    }
    // 返回 `value`，作为共享工具这次计算的结果。
    return value
  } catch (e) {
    // `epoch` 与 `_apiKeyHelperEpoch` 不一致时刷新派生状态，避免使用过期结果。
    if (epoch !== _apiKeyHelperEpoch) return ' '
    // detail保存`String`，供共享工具后续处理使用。
    const detail = e instanceof Error ? e.message : String(e)
    // biome-ignore lint/suspicious/noConsole: user-configured script failed; must be visible without --debug
    // 调用 console.error，触发共享工具此处需要的副作用。
    console.error(chalk.red(`apiKeyHelper failed: ${detail}`))
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(`Error getting API key from apiKeyHelper: ${detail}`, {
      level: 'error',
    })
    // SWR path: a transient failure shouldn't replace a working key with
    // the ' ' sentinel — keep serving the stale value and bump timestamp
    // so we don't hammer-retry every call.
    // 只有 `!isCold && _apiKeyHelperCache && _apiKeyHelperCac` 满足时，共享工具才执行该分支。
    if (!isCold && _apiKeyHelperCache && _apiKeyHelperCache.value !== ' ') {
      // _apiKeyHelperCache 缓存更新为 `{ ..._apiKeyHelperCache, timestamp: Date.now() }`，确保共享工具后续读取最新状态。
      _apiKeyHelperCache = { ..._apiKeyHelperCache, timestamp: Date.now() }
      // 返回 `_apiKeyHelperCache.value`，作为共享工具这次计算的结果。
      return _apiKeyHelperCache.value
    }
    // Cold cache or prior error — cache ' ' so callers don't fall back to OAuth
    // _apiKeyHelperCache 缓存更新为 `{ value: ' ', timestamp: Date.now() }`，确保共享工具后续读取最新状态。
    _apiKeyHelperCache = { value: ' ', timestamp: Date.now() }
    // 返回 `' '`，作为共享工具这次计算的结果。
    return ' '
  } finally {
    // 满足 `epoch === _apiKeyHelperEpoch` 时，共享工具执行该分支。
    if (epoch === _apiKeyHelperEpoch) {
      // _apiKeyHelperInflight更新为 `null`，确保共享工具后续读取最新状态。
      _apiKeyHelperInflight = null
    }
  }
}

// _executeApiKeyHelper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function _executeApiKeyHelper(
  isNonInteractiveSession: boolean,
): Promise<string | null> {
  // apiKeyHelper读取`getConfiguredApiKeyHelper`，供共享工具后续处理使用。
  const apiKeyHelper = getConfiguredApiKeyHelper()
  // apiKeyHelper缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!apiKeyHelper) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 满足 `isApiKeyHelperFromProjectOrLocalSettings()` 时，共享工具执行该分支。
  if (isApiKeyHelperFromProjectOrLocalSettings()) {
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // 只有 `!hasTrust && !isNonInteractiveSession` 满足时，共享工具才执行该分支。
    if (!hasTrust && !isNonInteractiveSession) {
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error(
        `Security: apiKeyHelper executed before workspace trust is confirmed. If you see this message, post in ${MACRO.FEEDBACK_CHANNEL}.`,
      )
      // 调用 logAntError，触发共享工具此处需要的副作用。
      logAntError('apiKeyHelper invoked before trust check', error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_apiKeyHelper_missing_trust11', {})
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }

  // 结果保存`execa`，供共享工具后续处理使用。
  const result = await execa(apiKeyHelper, {
    shell: true,
    timeout: 10 * 60 * 1000,
    reject: false,
  })
  // 满足 `result.failed` 时，共享工具执行该分支。
  if (result.failed) {
    // reject:false — execa resolves on exit≠0/timeout, stderr is on result
    // why保存`result.timedOut ? 'timed out' : `exited ${result.exitCode...`，供后续判断或组装使用。
    const why = result.timedOut ? 'timed out' : `exited ${result.exitCode}`
    // stderr格式化`trim`，供共享工具后续处理使用。
    const stderr = result.stderr?.trim()
    // 抛出 new Error(stderr ? `${why}: ${stderr}` : why)，阻止共享工具在无效状态下继续运行。
    throw new Error(stderr ? `${why}: ${stderr}` : why)
  }
  // stdout格式化`trim`，供共享工具后续处理使用。
  const stdout = result.stdout?.trim()
  // stdout缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!stdout) {
    // 抛出 new Error('did not return a value')，阻止共享工具在无效状态下继续运行。
    throw new Error('did not return a value')
  }
  // 返回 `stdout`，作为共享工具这次计算的结果。
  return stdout
}

/**
 * Sync cache reader — returns the last fetched apiKeyHelper value without executing.
 * Returns stale values to match SWR semantics of the async reader.
 * Returns null only if the async fetch hasn't completed yet.
 */
// getApiKeyFromApiKeyHelperCached 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getApiKeyFromApiKeyHelperCached(): string | null {
  // 返回 `_apiKeyHelperCache?.value ?? null`，作为共享工具这次计算的结果。
  return _apiKeyHelperCache?.value ?? null
}

// clearApiKeyHelperCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearApiKeyHelperCache(): void {
  // 共享工具 auth在这里处理 `_apiKeyHelperEpoch++`，完成这一小步状态转换。
  _apiKeyHelperEpoch++
  // _apiKeyHelperCache 缓存更新为 `null`，确保共享工具后续读取最新状态。
  _apiKeyHelperCache = null
  // _apiKeyHelperInflight更新为 `null`，确保共享工具后续读取最新状态。
  _apiKeyHelperInflight = null
}

// prefetchApiKeyFromApiKeyHelperIfSafe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prefetchApiKeyFromApiKeyHelperIfSafe(
  isNonInteractiveSession: boolean,
): void {
  // Skip if trust not yet accepted — the inner _executeApiKeyHelper check
  // would catch this too, but would fire a false-positive analytics event.
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isApiKeyHelperFromProjectOrLocalSettings() &&
    !checkHasTrustDialogAccepted()
  ) {
    // 共享工具 auth在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 显式忽略 `getApiKeyFromApiKeyHelper(isNonInteractiveSession)` 的返回值，只保留它触发的副作用。
  void getApiKeyFromApiKeyHelper(isNonInteractiveSession)
}

/** Default STS credentials are one hour. We manually manage invalidation, so not too worried about this being accurate. */
// DEFAULT_AWS_STS_TTL 命名 `60 * 60 * 1000`，让后续代码直接表达这个值的用途。
const DEFAULT_AWS_STS_TTL = 60 * 60 * 1000

/**
 * Run awsAuthRefresh to perform interactive authentication (e.g., aws sso login)
 * Streams output in real-time for user visibility
 */
// runAwsAuthRefresh 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function runAwsAuthRefresh(): Promise<boolean> {
  // awsAuthRefresh读取`getConfiguredAwsAuthRefresh`，供共享工具后续处理使用。
  const awsAuthRefresh = getConfiguredAwsAuthRefresh()

  // awsAuthRefresh缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!awsAuthRefresh) {
    // 返回 `false // Not configured, treat as success`，作为共享工具这次计算的结果。
    return false // Not configured, treat as success
  }

  // SECURITY: Check if awsAuthRefresh is from project settings
  // 满足 `isAwsAuthRefreshFromProjectSettings()` 时，共享工具执行该分支。
  if (isAwsAuthRefreshFromProjectSettings()) {
    // Check if trust has been established for this project
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // 只有 `!hasTrust && !getIsNonInteractiveSession()` 满足时，共享工具才执行该分支。
    if (!hasTrust && !getIsNonInteractiveSession()) {
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error(
        `Security: awsAuthRefresh executed before workspace trust is confirmed. If you see this message, post in ${MACRO.FEEDBACK_CHANNEL}.`,
      )
      // 调用 logAntError，触发共享工具此处需要的副作用。
      logAntError('awsAuthRefresh invoked before trust check', error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_awsAuthRefresh_missing_trust', {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Fetching AWS caller identity for AWS auth refresh command')
    // 等待 `checkStsCallerIdentity()` 完成，再继续共享工具 auth的异步流程。
    await checkStsCallerIdentity()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Fetched AWS caller identity, skipping AWS auth refresh command',
    )
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } catch {
    // only actually do the refresh if caller-identity calls
    // 返回 `refreshAwsAuth(awsAuthRefresh)`，作为共享工具这次计算的结果。
    return refreshAwsAuth(awsAuthRefresh)
  }
}

// Timeout for AWS auth refresh command (3 minutes).
// Long enough for browser-based SSO flows, short enough to prevent indefinite hangs.
// AWS_AUTH_REFRESH_TIMEOUT_MS 集合保存`3 * 60 * 1000`，供后续判断或组装使用。
const AWS_AUTH_REFRESH_TIMEOUT_MS = 3 * 60 * 1000

// refreshAwsAuth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function refreshAwsAuth(awsAuthRefresh: string): Promise<boolean> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Running AWS auth refresh command')
  // Start tracking authentication status
  // authStatusManager读取`AwsAuthStatusManager.getInstance`，供共享工具后续处理使用。
  const authStatusManager = AwsAuthStatusManager.getInstance()
  // 调用 authStatusManager.startAuthentication，触发共享工具此处需要的副作用。
  authStatusManager.startAuthentication()

  // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
  return new Promise(resolve => {
    // refreshProc保存`exec`，供共享工具后续处理使用。
    const refreshProc = exec(awsAuthRefresh, {
      timeout: AWS_AUTH_REFRESH_TIMEOUT_MS,
    })
    // 这个回调绑定到 refreshProc.stdout!.on('data', data => {，负责共享工具在该局部场景下的响应。
    refreshProc.stdout!.on('data', data => {
      // output格式化`data.toString`，供共享工具后续处理使用。
      const output = data.toString().trim()
      // 满足 `output` 时，共享工具执行该分支。
      if (output) {
        // Add output to status manager for UI display
        // 调用 authStatusManager.addOutput，触发共享工具此处需要的副作用。
        authStatusManager.addOutput(output)
        // Also log for debugging
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(output, { level: 'debug' })
      }
    })

    // 这个回调绑定到 refreshProc.stderr!.on('data', data => {，负责共享工具在该局部场景下的响应。
    refreshProc.stderr!.on('data', data => {
      // 错误格式化`data.toString`，供共享工具后续处理使用。
      const error = data.toString().trim()
      // 满足 `error` 时，共享工具执行该分支。
      if (error) {
        // authStatusManager.setError 写入新的状态值，使共享工具后续读取保持一致。
        authStatusManager.setError(error)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(error, { level: 'error' })
      }
    })

    // 调用 refreshProc.on，触发共享工具此处需要的副作用。
    refreshProc.on('close', (code, signal) => {
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('AWS auth refresh completed successfully')
        // 调用 authStatusManager.endAuthentication，触发共享工具此处需要的副作用。
        authStatusManager.endAuthentication(true)
        // 显式忽略 `resolve(true)` 的返回值，只保留它触发的副作用。
        void resolve(true)
      } else {
        // timedOut标记共享工具 auth是否启用对应路径。
        const timedOut = signal === 'SIGTERM'
        // 消息 命名 `timedOut`，让后续代码直接表达这个值的用途。
        const message = timedOut
          ? chalk.red(
              'AWS auth refresh timed out after 3 minutes. Run your auth command manually in a separate terminal.',
            )
          : chalk.red(
              'Error running awsAuthRefresh (in settings or ~/.claude.json):',
            )
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发共享工具此处需要的副作用。
        console.error(message)
        // 调用 authStatusManager.endAuthentication，触发共享工具此处需要的副作用。
        authStatusManager.endAuthentication(false)
        // 显式忽略 `resolve(false)` 的返回值，只保留它触发的副作用。
        void resolve(false)
      }
    })
  })
}

/**
 * Run awsCredentialExport to get credentials and set environment variables
 * Expects JSON output containing AWS credentials
 */
// getAwsCredsFromCredentialExport 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function getAwsCredsFromCredentialExport(): Promise<{
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
} | null> {
  // awsCredentialExport读取`getConfiguredAwsCredentialExport`，供共享工具后续处理使用。
  const awsCredentialExport = getConfiguredAwsCredentialExport()

  // awsCredentialExport缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!awsCredentialExport) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // SECURITY: Check if awsCredentialExport is from project settings
  // 满足 `isAwsCredentialExportFromProjectSettings()` 时，共享工具执行该分支。
  if (isAwsCredentialExportFromProjectSettings()) {
    // Check if trust has been established for this project
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // 只有 `!hasTrust && !getIsNonInteractiveSession()` 满足时，共享工具才执行该分支。
    if (!hasTrust && !getIsNonInteractiveSession()) {
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error(
        `Security: awsCredentialExport executed before workspace trust is confirmed. If you see this message, post in ${MACRO.FEEDBACK_CHANNEL}.`,
      )
      // 调用 logAntError，触发共享工具此处需要的副作用。
      logAntError('awsCredentialExport invoked before trust check', error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_awsCredentialExport_missing_trust', {})
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Fetching AWS caller identity for credential export command',
    )
    // 等待 `checkStsCallerIdentity()` 完成，再继续共享工具 auth的异步流程。
    await checkStsCallerIdentity()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Fetched AWS caller identity, skipping AWS credential export command',
    )
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  } catch {
    // only actually do the export if caller-identity calls
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('Running AWS credential export command')
      // 结果保存`execa`，供共享工具后续处理使用。
      const result = await execa(awsCredentialExport, {
        shell: true,
        reject: false,
      })
      // `result.exitCode` 与 `0 || !result.stdout` 不一致时刷新派生状态，避免使用过期结果。
      if (result.exitCode !== 0 || !result.stdout) {
        // 抛出 new Error('awsCredentialExport did not return a valid value')，阻止共享工具在无效状态下继续运行。
        throw new Error('awsCredentialExport did not return a valid value')
      }

      // Parse the JSON output from aws sts commands
      // awsOutput解析`jsonParse`，供共享工具后续处理使用。
      const awsOutput = jsonParse(result.stdout.trim())

      // 满足 `!isValidAwsStsOutput(awsOutput)` 时，共享工具执行该分支。
      if (!isValidAwsStsOutput(awsOutput)) {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          'awsCredentialExport did not return valid AWS STS output structure',
        )
      }

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging('AWS credentials retrieved from awsCredentialExport')
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {
        accessKeyId: awsOutput.Credentials.AccessKeyId,
        secretAccessKey: awsOutput.Credentials.SecretAccessKey,
        sessionToken: awsOutput.Credentials.SessionToken,
      }
    } catch (e) {
      // 消息保存`chalk.red`，供共享工具后续处理使用。
      const message = chalk.red(
        'Error getting AWS credentials from awsCredentialExport (in settings or ~/.claude.json):',
      )
      // 满足 `e instanceof Error` 时，共享工具执行该分支。
      if (e instanceof Error) {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发共享工具此处需要的副作用。
        console.error(message, e.message)
      } else {
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发共享工具此处需要的副作用。
        console.error(message, e)
      }
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
  }
}

/**
 * Refresh AWS authentication and get credentials with cache clearing
 * This combines runAwsAuthRefresh, getAwsCredsFromCredentialExport, and clearAwsIniCache
 * to ensure fresh credentials are always used
 */
// refreshAndGetAwsCredentials 集合保存`memoizeWithTTLAsync`，供共享工具后续处理使用。
export const refreshAndGetAwsCredentials = memoizeWithTTLAsync(
  // 这个异步回调接收 无，串起共享工具的等待、调用和返回。
  async (): Promise<{
    accessKeyId: string
    secretAccessKey: string
    sessionToken: string
  } | null> => {
    // First run auth refresh if needed
    // refreshed保存`runAwsAuthRefresh`，供共享工具后续处理使用。
    const refreshed = await runAwsAuthRefresh()

    // Get credentials from export
    // credentials 集合读取`getAwsCredsFromCredentialExport`，供共享工具后续处理使用。
    const credentials = await getAwsCredsFromCredentialExport()

    // Clear AWS INI cache to ensure fresh credentials are used
    // 只有 `refreshed || credentials` 满足时，共享工具才执行该分支。
    if (refreshed || credentials) {
      // 等待 `clearAwsIniCache()` 完成，再继续共享工具 auth的异步流程。
      await clearAwsIniCache()
    }

    // 返回 `credentials`，作为共享工具这次计算的结果。
    return credentials
  },
  DEFAULT_AWS_STS_TTL,
)

// clearAwsCredentialsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearAwsCredentialsCache(): void {
  // 调用 refreshAndGetAwsCredentials.cache.clear，触发共享工具此处需要的副作用。
  refreshAndGetAwsCredentials.cache.clear()
}

/**
 * Get the configured gcpAuthRefresh from settings
 */
// getConfiguredGcpAuthRefresh 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfiguredGcpAuthRefresh(): string | undefined {
  // mergedSettings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = getSettings_DEPRECATED() || {}
  // 返回 `mergedSettings.gcpAuthRefresh`，作为共享工具这次计算的结果。
  return mergedSettings.gcpAuthRefresh
}

/**
 * Check if the configured gcpAuthRefresh comes from project settings
 */
// isGcpAuthRefreshFromProjectSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isGcpAuthRefreshFromProjectSettings(): boolean {
  // gcpAuthRefresh读取`getConfiguredGcpAuthRefresh`，供共享工具后续处理使用。
  const gcpAuthRefresh = getConfiguredGcpAuthRefresh()
  // gcpAuthRefresh缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gcpAuthRefresh) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // projectSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // localSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    projectSettings?.gcpAuthRefresh === gcpAuthRefresh ||
    localSettings?.gcpAuthRefresh === gcpAuthRefresh
  )
}

/** Short timeout for the GCP credentials probe. Without this, when no local
 *  credential source exists (no ADC file, no env var), google-auth-library falls
 *  through to the GCE metadata server which hangs ~12s outside GCP. */
// GCP_CREDENTIALS_CHECK_TIMEOUT_MS 集合保存`5_000`，供共享工具 auth后续判断或输出使用。
const GCP_CREDENTIALS_CHECK_TIMEOUT_MS = 5_000

/**
 * Check if GCP credentials are currently valid by attempting to get an access token.
 * This uses the same authentication chain that the Vertex SDK uses.
 */
// checkGcpCredentialsValid 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function checkGcpCredentialsValid(): Promise<boolean> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Dynamically import to avoid loading google-auth-library unnecessarily
    // 从 `await import('google-auth-library')` 解构 GoogleAuth，减少共享工具 auth对同一对象的重复访问。
    const { GoogleAuth } = await import('google-auth-library')
    // auth保存`GoogleAuth`，供共享工具后续处理使用。
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    // probe保存`async`，供共享工具后续处理使用。
    const probe = (async () => {
      // API 客户端读取`auth.getClient`，供共享工具后续处理使用。
      const client = await auth.getClient()
      // 等待 `client.getAccessToken()` 完成，再继续共享工具 auth的异步流程。
      await client.getAccessToken()
    })()
    // timeout保存`sleep`，供共享工具后续处理使用。
    const timeout = sleep(GCP_CREDENTIALS_CHECK_TIMEOUT_MS).then(() => {
      // 抛出 new GcpCredentialsTimeoutError('GCP credentials check timed out')，阻止共享工具在无效状态下继续运行。
      throw new GcpCredentialsTimeoutError('GCP credentials check timed out')
    })
    // 等待 `Promise.race([probe, timeout])` 完成，再继续共享工具 auth的异步流程。
    await Promise.race([probe, timeout])
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
}

/** Default GCP credential TTL - 1 hour to match typical ADC token lifetime */
// DEFAULT_GCP_CREDENTIAL_TTL保存`60 * 60 * 1000`，供共享工具 auth后续判断或输出使用。
const DEFAULT_GCP_CREDENTIAL_TTL = 60 * 60 * 1000

/**
 * Run gcpAuthRefresh to perform interactive authentication (e.g., gcloud auth application-default login)
 * Streams output in real-time for user visibility
 */
// runGcpAuthRefresh 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function runGcpAuthRefresh(): Promise<boolean> {
  // gcpAuthRefresh读取`getConfiguredGcpAuthRefresh`，供共享工具后续处理使用。
  const gcpAuthRefresh = getConfiguredGcpAuthRefresh()

  // gcpAuthRefresh缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gcpAuthRefresh) {
    // 返回 `false // Not configured, treat as success`，作为共享工具这次计算的结果。
    return false // Not configured, treat as success
  }

  // SECURITY: Check if gcpAuthRefresh is from project settings
  // 满足 `isGcpAuthRefreshFromProjectSettings()` 时，共享工具执行该分支。
  if (isGcpAuthRefreshFromProjectSettings()) {
    // Check if trust has been established for this project
    // Pass true to indicate this is a dangerous feature that requires trust
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // 只有 `!hasTrust && !getIsNonInteractiveSession()` 满足时，共享工具才执行该分支。
    if (!hasTrust && !getIsNonInteractiveSession()) {
      // 错误保存`Error`，供共享工具后续处理使用。
      const error = new Error(
        `Security: gcpAuthRefresh executed before workspace trust is confirmed. If you see this message, post in ${MACRO.FEEDBACK_CHANNEL}.`,
      )
      // 调用 logAntError，触发共享工具此处需要的副作用。
      logAntError('gcpAuthRefresh invoked before trust check', error)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_gcpAuthRefresh_missing_trust', {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logForDebugging('Checking GCP credentials validity for auth refresh')
    // isValid记录 `checkGcpCredentialsValid` 是否成立，共享工具随后按该结果分支。
    const isValid = await checkGcpCredentialsValid()
    // 满足 `isValid` 时，共享工具执行该分支。
    if (isValid) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'GCP credentials are valid, skipping auth refresh command',
      )
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  } catch {
    // Credentials check failed, proceed with refresh
  }

  // 返回 `refreshGcpAuth(gcpAuthRefresh)`，作为共享工具这次计算的结果。
  return refreshGcpAuth(gcpAuthRefresh)
}

// Timeout for GCP auth refresh command (3 minutes).
// Long enough for browser-based auth flows, short enough to prevent indefinite hangs.
// GCP_AUTH_REFRESH_TIMEOUT_MS 集合 命名 `3 * 60 * 1000`，让后续代码直接表达这个值的用途。
const GCP_AUTH_REFRESH_TIMEOUT_MS = 3 * 60 * 1000

// refreshGcpAuth 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function refreshGcpAuth(gcpAuthRefresh: string): Promise<boolean> {
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logForDebugging('Running GCP auth refresh command')
  // Start tracking authentication status. AwsAuthStatusManager is cloud-provider-agnostic
  // despite the name — print.ts emits its updates as generic SDK 'auth_status' messages.
  // authStatusManager读取`AwsAuthStatusManager.getInstance`，供共享工具后续处理使用。
  const authStatusManager = AwsAuthStatusManager.getInstance()
  // 调用 authStatusManager.startAuthentication，触发共享工具此处需要的副作用。
  authStatusManager.startAuthentication()

  // 返回 `new Promise(resolve => {`，作为共享工具这次计算的结果。
  return new Promise(resolve => {
    // refreshProc保存`exec`，供共享工具后续处理使用。
    const refreshProc = exec(gcpAuthRefresh, {
      timeout: GCP_AUTH_REFRESH_TIMEOUT_MS,
    })
    // 这个回调绑定到 refreshProc.stdout!.on('data', data => {，负责共享工具在该局部场景下的响应。
    refreshProc.stdout!.on('data', data => {
      // output格式化`data.toString`，供共享工具后续处理使用。
      const output = data.toString().trim()
      // 满足 `output` 时，共享工具执行该分支。
      if (output) {
        // Add output to status manager for UI display
        // 调用 authStatusManager.addOutput，触发共享工具此处需要的副作用。
        authStatusManager.addOutput(output)
        // Also log for debugging
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(output, { level: 'debug' })
      }
    })

    // 这个回调绑定到 refreshProc.stderr!.on('data', data => {，负责共享工具在该局部场景下的响应。
    refreshProc.stderr!.on('data', data => {
      // 错误格式化`data.toString`，供共享工具后续处理使用。
      const error = data.toString().trim()
      // 满足 `error` 时，共享工具执行该分支。
      if (error) {
        // authStatusManager.setError 写入新的状态值，使共享工具后续读取保持一致。
        authStatusManager.setError(error)
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging(error, { level: 'error' })
      }
    })

    // 调用 refreshProc.on，触发共享工具此处需要的副作用。
    refreshProc.on('close', (code, signal) => {
      // 满足 `code === 0` 时，共享工具执行该分支。
      if (code === 0) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logForDebugging('GCP auth refresh completed successfully')
        // 调用 authStatusManager.endAuthentication，触发共享工具此处需要的副作用。
        authStatusManager.endAuthentication(true)
        // 显式忽略 `resolve(true)` 的返回值，只保留它触发的副作用。
        void resolve(true)
      } else {
        // timedOut标记共享工具 auth是否启用对应路径。
        const timedOut = signal === 'SIGTERM'
        // 消息 命名 `timedOut`，让后续代码直接表达这个值的用途。
        const message = timedOut
          ? chalk.red(
              'GCP auth refresh timed out after 3 minutes. Run your auth command manually in a separate terminal.',
            )
          : chalk.red(
              'Error running gcpAuthRefresh (in settings or ~/.claude.json):',
            )
        // biome-ignore lint/suspicious/noConsole:: intentional console output
        // 调用 console.error，触发共享工具此处需要的副作用。
        console.error(message)
        // 调用 authStatusManager.endAuthentication，触发共享工具此处需要的副作用。
        authStatusManager.endAuthentication(false)
        // 显式忽略 `resolve(false)` 的返回值，只保留它触发的副作用。
        void resolve(false)
      }
    })
  })
}

/**
 * Refresh GCP authentication if needed.
 * This function checks if credentials are valid and runs the refresh command if not.
 * Memoized with TTL to avoid excessive refresh attempts.
 */
// refreshGcpCredentialsIfNeeded保存`memoizeWithTTLAsync`，供共享工具后续处理使用。
export const refreshGcpCredentialsIfNeeded = memoizeWithTTLAsync(
  // 这个异步回调接收 无，串起共享工具的等待、调用和返回。
  async (): Promise<boolean> => {
    // Run auth refresh if needed
    // refreshed保存`runGcpAuthRefresh`，供共享工具后续处理使用。
    const refreshed = await runGcpAuthRefresh()
    // 返回 `refreshed`，作为共享工具这次计算的结果。
    return refreshed
  },
  DEFAULT_GCP_CREDENTIAL_TTL,
)

// clearGcpCredentialsCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearGcpCredentialsCache(): void {
  // 调用 refreshGcpCredentialsIfNeeded.cache.clear，触发共享工具此处需要的副作用。
  refreshGcpCredentialsIfNeeded.cache.clear()
}

/**
 * Prefetches GCP credentials only if workspace trust has already been established.
 * This allows us to start the potentially slow GCP commands early for trusted workspaces
 * while maintaining security for untrusted ones.
 *
 * Returns void to prevent misuse - use refreshGcpCredentialsIfNeeded() to actually refresh.
 */
// prefetchGcpCredentialsIfSafe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prefetchGcpCredentialsIfSafe(): void {
  // Check if gcpAuthRefresh is configured
  // gcpAuthRefresh读取`getConfiguredGcpAuthRefresh`，供共享工具后续处理使用。
  const gcpAuthRefresh = getConfiguredGcpAuthRefresh()

  // gcpAuthRefresh缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!gcpAuthRefresh) {
    // 共享工具 auth在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check if gcpAuthRefresh is from project settings
  // 满足 `isGcpAuthRefreshFromProjectSettings()` 时，共享工具执行该分支。
  if (isGcpAuthRefreshFromProjectSettings()) {
    // Only prefetch if trust has already been established
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // 只有 `!hasTrust && !getIsNonInteractiveSession()` 满足时，共享工具才执行该分支。
    if (!hasTrust && !getIsNonInteractiveSession()) {
      // Don't prefetch - wait for trust to be established first
      // 共享工具 auth在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // Safe to prefetch - either not from project settings or trust already established
  // 显式忽略 `refreshGcpCredentialsIfNeeded()` 的返回值，只保留它触发的副作用。
  void refreshGcpCredentialsIfNeeded()
}

/**
 * Prefetches AWS credentials only if workspace trust has already been established.
 * This allows us to start the potentially slow AWS commands early for trusted workspaces
 * while maintaining security for untrusted ones.
 *
 * Returns void to prevent misuse - use refreshAndGetAwsCredentials() to actually retrieve credentials.
 */
// prefetchAwsCredentialsAndBedRockInfoIfSafe 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function prefetchAwsCredentialsAndBedRockInfoIfSafe(): void {
  // Check if either AWS command is configured
  // awsAuthRefresh读取`getConfiguredAwsAuthRefresh`，供共享工具后续处理使用。
  const awsAuthRefresh = getConfiguredAwsAuthRefresh()
  // awsCredentialExport读取`getConfiguredAwsCredentialExport`，供共享工具后续处理使用。
  const awsCredentialExport = getConfiguredAwsCredentialExport()

  // 只有 `!awsAuthRefresh && !awsCredentialExport` 满足时，共享工具才执行该分支。
  if (!awsAuthRefresh && !awsCredentialExport) {
    // 共享工具 auth在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Check if either command is from project settings
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isAwsAuthRefreshFromProjectSettings() ||
    isAwsCredentialExportFromProjectSettings()
  ) {
    // Only prefetch if trust has already been established
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // 只有 `!hasTrust && !getIsNonInteractiveSession()` 满足时，共享工具才执行该分支。
    if (!hasTrust && !getIsNonInteractiveSession()) {
      // Don't prefetch - wait for trust to be established first
      // 共享工具 auth在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  }

  // Safe to prefetch - either not from project settings or trust already established
  // 显式忽略 `refreshAndGetAwsCredentials()` 的返回值，只保留它触发的副作用。
  void refreshAndGetAwsCredentials()
  // 调用 getModelStrings，触发共享工具此处需要的副作用。
  getModelStrings()
}

/** @private Use {@link getAnthropicApiKey} or {@link getAnthropicApiKeyWithSource} */
// getApiKeyFromConfigOrMacOSKeychain 配置保存`memoize`，供共享工具后续处理使用。
export const getApiKeyFromConfigOrMacOSKeychain = memoize(
  (): { key: string; source: ApiKeySource } | null => {
    // 满足 `isBareMode()` 时，共享工具执行该分支。
    if (isBareMode()) return null
    // TODO: migrate to SecureStorage
    // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
    if (process.platform === 'darwin') {
      // keychainPrefetch.ts fires this read at main.tsx top-level in parallel
      // with module imports. If it completed, use that instead of spawning a
      // sync `security` subprocess here (~33ms).
      // prefetch读取`getLegacyApiKeyPrefetchResult`，供共享工具后续处理使用。
      const prefetch = getLegacyApiKeyPrefetchResult()
      // 满足 `prefetch` 时，共享工具执行该分支。
      if (prefetch) {
        // 满足 `prefetch.stdout` 时，共享工具执行该分支。
        if (prefetch.stdout) {
          // 返回结构化结果，集中表达共享工具已经整理出的状态。
          return { key: prefetch.stdout, source: '/login managed key' }
        }
        // Prefetch completed with no key — fall through to config, not keychain.
      } else {
        // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
        const storageServiceName = getMacOsKeychainStorageServiceName()
        // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
        try {
          // 结果保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
          const result = execSyncWithDefaults_DEPRECATED(
            `security find-generic-password -a $USER -w -s "${storageServiceName}"`,
          )
          // 满足 `result` 时，共享工具执行该分支。
          if (result) {
            // 返回结构化结果，集中表达共享工具已经整理出的状态。
            return { key: result, source: '/login managed key' }
          }
        } catch (e) {
          // 记录共享工具运行诊断，方便排查异常路径或性能问题。
          logError(e)
        }
      }
    }

    // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
    const config = getGlobalConfig()
    // config.primaryApiKey 配置缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!config.primaryApiKey) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { key: config.primaryApiKey, source: '/login managed key' }
  },
)

// isValidApiKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isValidApiKey(apiKey: string): boolean {
  // Only allow alphanumeric characters, dashes, and underscores
  // 返回 `/^[a-zA-Z0-9-_]+$/.test(apiKey)`，作为共享工具这次计算的结果。
  return /^[a-zA-Z0-9-_]+$/.test(apiKey)
}

// saveApiKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function saveApiKey(apiKey: string): Promise<void> {
  // 满足 `!isValidApiKey(apiKey)` 时，共享工具执行该分支。
  if (!isValidApiKey(apiKey)) {
    // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
    throw new Error(
      'Invalid API key format. API key must contain only alphanumeric characters, dashes, and underscores.',
    )
  }

  // Store as primary API key
  // 等待 `maybeRemoveApiKeyFromMacOSKeychain()` 完成，再继续共享工具 auth的异步流程。
  await maybeRemoveApiKeyFromMacOSKeychain()
  // savedToKeychain标记共享工具 auth是否启用对应路径。
  let savedToKeychain = false
  // 当 `process.platform` 匹配 `'darwin'` 时，共享工具执行对应分支。
  if (process.platform === 'darwin') {
    // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
    try {
      // TODO: migrate to SecureStorage
      // storageServiceName读取`getMacOsKeychainStorageServiceName`，供共享工具后续处理使用。
      const storageServiceName = getMacOsKeychainStorageServiceName()
      // username读取`getUsername`，供共享工具后续处理使用。
      const username = getUsername()

      // Convert to hexadecimal to avoid any escaping issues
      // hexValue保存`Buffer.from`，供共享工具后续处理使用。
      const hexValue = Buffer.from(apiKey, 'utf-8').toString('hex')

      // Use security's interactive mode (-i) with -X (hexadecimal) option
      // This ensures credentials never appear in process command-line arguments
      // Process monitors only see "security -i", not the password
      // 命令固定为 ``add-generic-password -U -a "${username}" -s "${storageSe...`，作为共享工具 auth后续展示或比较的基准。
      const command = `add-generic-password -U -a "${username}" -s "${storageServiceName}" -X "${hexValue}"\n`

      // 等待 `execa('security', ['-i'], {` 完成，再继续共享工具 auth的异步流程。
      await execa('security', ['-i'], {
        input: command,
        reject: false,
      })

      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_api_key_saved_to_keychain', {})
      // savedToKeychain更新为 `true`，确保共享工具后续读取最新状态。
      savedToKeychain = true
    } catch (e) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logError(e)
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_api_key_keychain_error', {
        error: errorMessage(
          e,
        ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_api_key_saved_to_config', {})
    }
  } else {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_api_key_saved_to_config', {})
  }

  // normalizedKey保存`normalizeApiKeyForConfig`，供共享工具后续处理使用。
  const normalizedKey = normalizeApiKeyForConfig(apiKey)

  // Save config with all updates
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => {
    // approved保存`current.customApiKeyResponses?.approved ?? []`，供共享工具 auth后续判断或输出使用。
    const approved = current.customApiKeyResponses?.approved ?? []
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      ...current,
      // Only save to config if keychain save failed or not on darwin
      primaryApiKey: savedToKeychain ? current.primaryApiKey : apiKey,
      customApiKeyResponses: {
        ...current.customApiKeyResponses,
        approved: approved.includes(normalizedKey)
          ? approved
          : [...approved, normalizedKey],
        rejected: current.customApiKeyResponses?.rejected ?? [],
      },
    }
  })

  // Clear memo cache
  // 调用 getApiKeyFromConfigOrMacOSKeychain.cache.clear?.()，完成这一处局部操作。
  getApiKeyFromConfigOrMacOSKeychain.cache.clear?.()
  // 调用 clearLegacyApiKeyPrefetch，触发共享工具此处需要的副作用。
  clearLegacyApiKeyPrefetch()
}

// isCustomApiKeyApproved 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isCustomApiKeyApproved(apiKey: string): boolean {
  // 配置读取`getGlobalConfig`，供共享工具后续处理使用。
  const config = getGlobalConfig()
  // normalizedKey保存`normalizeApiKeyForConfig`，供共享工具后续处理使用。
  const normalizedKey = normalizeApiKeyForConfig(apiKey)
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    config.customApiKeyResponses?.approved?.includes(normalizedKey) ?? false
  )
}

// removeApiKey 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function removeApiKey(): Promise<void> {
  // 等待 `maybeRemoveApiKeyFromMacOSKeychain()` 完成，再继续共享工具 auth的异步流程。
  await maybeRemoveApiKeyFromMacOSKeychain()

  // Also remove from config instead of returning early, for older clients
  // that set keys before we supported keychain.
  // 调用 saveGlobalConfig，触发共享工具此处需要的副作用。
  saveGlobalConfig(current => ({
    ...current,
    primaryApiKey: undefined,
  }))

  // Clear memo cache
  // 调用 getApiKeyFromConfigOrMacOSKeychain.cache.clear?.()，完成这一处局部操作。
  getApiKeyFromConfigOrMacOSKeychain.cache.clear?.()
  // 调用 clearLegacyApiKeyPrefetch，触发共享工具此处需要的副作用。
  clearLegacyApiKeyPrefetch()
}

// maybeRemoveApiKeyFromMacOSKeychain 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function maybeRemoveApiKeyFromMacOSKeychain(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 等待 `maybeRemoveApiKeyFromMacOSKeychainThrows()` 完成，再继续共享工具 auth的异步流程。
    await maybeRemoveApiKeyFromMacOSKeychainThrows()
  } catch (e) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(e)
  }
}

// Function to store OAuth tokens in secure storage
// saveOAuthTokensIfNeeded 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function saveOAuthTokensIfNeeded(tokens: OAuthTokens): {
  success: boolean
  warning?: string
} {
  // 满足 `!shouldUseClaudeAIAuth(tokens.scopes)` 时，共享工具执行该分支。
  if (!shouldUseClaudeAIAuth(tokens.scopes)) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_tokens_not_claude_ai', {})
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true }
  }

  // Skip saving inference-only tokens (they come from env vars)
  // 只有 `!tokens.refreshToken || !tokens.expiresAt` 满足时，共享工具才执行该分支。
  if (!tokens.refreshToken || !tokens.expiresAt) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_tokens_inference_only', {})
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: true }
  }

  // secureStorage读取`getSecureStorage`，供共享工具后续处理使用。
  const secureStorage = getSecureStorage()
  // storageBackend 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const storageBackend =
    secureStorage.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // storageData读取`secureStorage.read`，供共享工具后续处理使用。
    const storageData = secureStorage.read() || {}
    // existingOauth保存`storageData.claudeAiOauth`，供后续判断或组装使用。
    const existingOauth = storageData.claudeAiOauth

    // claudeAiOauth更新为 `{`，确保共享工具后续读取最新状态。
    storageData.claudeAiOauth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      // Profile fetch in refreshOAuthToken swallows errors and returns null on
      // transient failures (network, 5xx, rate limit). Don't clobber a valid
      // stored subscription with null — fall back to the existing value.
      subscriptionType:
        tokens.subscriptionType ?? existingOauth?.subscriptionType ?? null,
      rateLimitTier:
        tokens.rateLimitTier ?? existingOauth?.rateLimitTier ?? null,
    }

    // updateStatus 集合保存`secureStorage.update`，供共享工具后续处理使用。
    const updateStatus = secureStorage.update(storageData)

    // 满足 `updateStatus.success` 时，共享工具执行该分支。
    if (updateStatus.success) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_tokens_saved', { storageBackend })
    } else {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_tokens_save_failed', { storageBackend })
    }

    // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
    getClaudeAIOAuthTokens.cache?.clear?.()
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearBetasCaches()
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearToolSchemaCache()
    // 返回 `updateStatus`，作为共享工具这次计算的结果。
    return updateStatus
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_tokens_save_exception', {
      storageBackend,
      error: errorMessage(
        error,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { success: false, warning: 'Failed to save OAuth tokens' }
  }
}

// getClaudeAIOAuthTokens 集合保存`memoize`，供共享工具后续处理使用。
export const getClaudeAIOAuthTokens = memoize((): OAuthTokens | null => {
  // --bare: API-key-only. No OAuth env tokens, no keychain, no credentials file.
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) return null

  // Check for force-set OAuth token from environment variable
  // 满足 `process.env.CLAUDE_CODE_OAUTH_TOKEN` 时，共享工具执行该分支。
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    // Return an inference-only token (unknown refresh and expiry)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      accessToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
      refreshToken: null,
      expiresAt: null,
      scopes: ['user:inference'],
      subscriptionType: null,
      rateLimitTier: null,
    }
  }

  // Check for OAuth token from file descriptor
  // oauthTokenFromFd读取`getOAuthTokenFromFileDescriptor`，供共享工具后续处理使用。
  const oauthTokenFromFd = getOAuthTokenFromFileDescriptor()
  // 满足 `oauthTokenFromFd` 时，共享工具执行该分支。
  if (oauthTokenFromFd) {
    // Return an inference-only token (unknown refresh and expiry)
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      accessToken: oauthTokenFromFd,
      refreshToken: null,
      expiresAt: null,
      scopes: ['user:inference'],
      subscriptionType: null,
      rateLimitTier: null,
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // secureStorage读取`getSecureStorage`，供共享工具后续处理使用。
    const secureStorage = getSecureStorage()
    // storageData读取`secureStorage.read`，供共享工具后续处理使用。
    const storageData = secureStorage.read()
    // oauthData保存`storageData?.claudeAiOauth`，供后续判断或组装使用。
    const oauthData = storageData?.claudeAiOauth

    // 满足 `!oauthData?.accessToken` 时，共享工具执行该分支。
    if (!oauthData?.accessToken) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }

    // 返回 `oauthData`，作为共享工具这次计算的结果。
    return oauthData
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
})

/**
 * Clears all OAuth token caches. Call this on 401 errors to ensure
 * the next token read comes from secure storage, not stale in-memory caches.
 * This handles the case where the local expiration check disagrees with the
 * server (e.g., due to clock corrections after token was issued).
 */
// clearOAuthTokenCache 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function clearOAuthTokenCache(): void {
  // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
  getClaudeAIOAuthTokens.cache?.clear?.()
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearKeychainCache()
}

// lastCredentialsMtimeMs 集合保存`0`，供共享工具 auth后续判断或输出使用。
let lastCredentialsMtimeMs = 0

// Cross-process staleness: another CC instance may write fresh tokens to
// disk (refresh or /login), but this process's memoize caches forever.
// Without this, terminal 1's /login fixes terminal 1; terminal 2's /login
// then revokes terminal 1 server-side, and terminal 1's memoize never
// re-reads — infinite /login regress (CC-1096, GH#24317).
// invalidateOAuthCacheIfDiskChanged 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function invalidateOAuthCacheIfDiskChanged(): Promise<void> {
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 从 `await stat(` 解构 mtimeMs，减少共享工具 auth对同一对象的重复访问。
    const { mtimeMs } = await stat(
      join(getClaudeConfigHomeDir(), '.credentials.json'),
    )
    // `mtimeMs` 与 `lastCredentialsMtimeMs` 不一致时刷新派生状态，避免使用过期结果。
    if (mtimeMs !== lastCredentialsMtimeMs) {
      // lastCredentialsMtimeMs 集合更新为 `mtimeMs`，确保共享工具后续读取最新状态。
      lastCredentialsMtimeMs = mtimeMs
      // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
      clearOAuthTokenCache()
    }
  } catch {
    // ENOENT — macOS keychain path (file deleted on migration). Clear only
    // the memoize so it delegates to the keychain cache's 30s TTL instead
    // of caching forever on top. `security find-generic-password` is
    // ~15ms; bounded to once per 30s by the keychain cache.
    // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
    getClaudeAIOAuthTokens.cache?.clear?.()
  }
}

// In-flight dedup: when N claude.ai proxy connectors hit 401 with the same
// token simultaneously (common at startup — #20930), only one should clear
// caches and re-read the keychain. Without this, each call's clearOAuthTokenCache()
// nukes readInFlight in macOsKeychainStorage and triggers a fresh spawn —
// sync spawns stacked to 800ms+ of blocked render frames.
// pending401Handlers 集合 命名 `new Map<string, Promise<boolean>>()`，让后续代码直接表达这个值的用途。
const pending401Handlers = new Map<string, Promise<boolean>>()

/**
 * Handle a 401 "OAuth token has expired" error from the API.
 *
 * This function forces a token refresh when the server says the token is expired,
 * even if our local expiration check disagrees (which can happen due to clock
 * issues when the token was issued).
 *
 * Safety: We compare the failed token with what's in keychain. If another tab
 * already refreshed (different token in keychain), we use that instead of
 * refreshing again. Concurrent calls with the same failedAccessToken are
 * deduplicated to a single keychain read.
 *
 * @param failedAccessToken - The access token that was rejected with 401
 * @returns true if we now have a valid token, false otherwise
 */
// handleOAuth401Error 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function handleOAuth401Error(
  failedAccessToken: string,
): Promise<boolean> {
  // pending读取`pending401Handlers.get`，供共享工具后续处理使用。
  const pending = pending401Handlers.get(failedAccessToken)
  // 满足 `pending` 时，共享工具执行该分支。
  if (pending) return pending

  // promise 异步任务保存`handleOAuth401ErrorImpl`，供共享工具后续处理使用。
  const promise = handleOAuth401ErrorImpl(failedAccessToken).finally(() => {
    // 调用 pending401Handlers.delete，触发共享工具此处需要的副作用。
    pending401Handlers.delete(failedAccessToken)
  })
  // pending401Handlers.set 写入新的状态值，使共享工具后续读取保持一致。
  pending401Handlers.set(failedAccessToken, promise)
  // 返回 `promise`，作为共享工具这次计算的结果。
  return promise
}

// handleOAuth401ErrorImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function handleOAuth401ErrorImpl(
  failedAccessToken: string,
): Promise<boolean> {
  // Clear caches and re-read from keychain (async — sync read blocks ~100ms/call)
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearOAuthTokenCache()
  // currentTokens 集合读取`getClaudeAIOAuthTokensAsync`，供共享工具后续处理使用。
  const currentTokens = await getClaudeAIOAuthTokensAsync()

  // 满足 `!currentTokens?.refreshToken` 时，共享工具执行该分支。
  if (!currentTokens?.refreshToken) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // If keychain has a different token, another tab already refreshed - use it
  // `currentTokens.accessToken` 与 `failedAccessToken` 不一致时刷新派生状态，避免使用过期结果。
  if (currentTokens.accessToken !== failedAccessToken) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_401_recovered_from_keychain', {})
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Same token that failed - force refresh, bypassing local expiration check
  // 返回 `checkAndRefreshOAuthTokenIfNeeded(0, true)`，作为共享工具这次计算的结果。
  return checkAndRefreshOAuthTokenIfNeeded(0, true)
}

/**
 * Reads OAuth tokens asynchronously, avoiding blocking keychain reads.
 * Delegates to the sync memoized version for env var / file descriptor tokens
 * (which don't hit the keychain), and only uses async for storage reads.
 */
// getClaudeAIOAuthTokensAsync 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getClaudeAIOAuthTokensAsync(): Promise<OAuthTokens | null> {
  // 满足 `isBareMode()` 时，共享工具执行该分支。
  if (isBareMode()) return null

  // Env var and FD tokens are sync and don't hit the keychain
  // 共享工具在这里按实际状态进入对应分支。
  if (
    process.env.CLAUDE_CODE_OAUTH_TOKEN ||
    getOAuthTokenFromFileDescriptor()
  ) {
    // 返回 `getClaudeAIOAuthTokens()`，作为共享工具这次计算的结果。
    return getClaudeAIOAuthTokens()
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // secureStorage读取`getSecureStorage`，供共享工具后续处理使用。
    const secureStorage = getSecureStorage()
    // storageData读取`secureStorage.readAsync`，供共享工具后续处理使用。
    const storageData = await secureStorage.readAsync()
    // oauthData保存`storageData?.claudeAiOauth`，供后续判断或组装使用。
    const oauthData = storageData?.claudeAiOauth
    // 满足 `!oauthData?.accessToken` 时，共享工具执行该分支。
    if (!oauthData?.accessToken) {
      // 返回 `null`，作为共享工具这次计算的结果。
      return null
    }
    // 返回 `oauthData`，作为共享工具这次计算的结果。
    return oauthData
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
}

// In-flight promise for deduplicating concurrent calls
// pendingRefreshCheck保存`null`，作为后续空值处理的输入。
let pendingRefreshCheck: Promise<boolean> | null = null

// checkAndRefreshOAuthTokenIfNeeded 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function checkAndRefreshOAuthTokenIfNeeded(
  retryCount = 0,
  force = false,
): Promise<boolean> {
  // Deduplicate concurrent non-retry, non-force calls
  // 只有 `retryCount === 0 && !force` 满足时，共享工具才执行该分支。
  if (retryCount === 0 && !force) {
    // 满足 `pendingRefreshCheck` 时，共享工具执行该分支。
    if (pendingRefreshCheck) {
      // 返回 `pendingRefreshCheck`，作为共享工具这次计算的结果。
      return pendingRefreshCheck
    }

    // promise 异步任务读取`checkAndRefreshOAuthTokenIfNeededImpl`，供共享工具后续处理使用。
    const promise = checkAndRefreshOAuthTokenIfNeededImpl(retryCount, force)
    // pendingRefreshCheck更新为 `promise.finally(() => {`，确保共享工具后续读取最新状态。
    pendingRefreshCheck = promise.finally(() => {
      // pendingRefreshCheck更新为 `null`，确保共享工具后续读取最新状态。
      pendingRefreshCheck = null
    })
    // 返回 `pendingRefreshCheck`，作为共享工具这次计算的结果。
    return pendingRefreshCheck
  }

  // 返回 `checkAndRefreshOAuthTokenIfNeededImpl(retryCount, force)`，作为共享工具这次计算的结果。
  return checkAndRefreshOAuthTokenIfNeededImpl(retryCount, force)
}

// checkAndRefreshOAuthTokenIfNeededImpl 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function checkAndRefreshOAuthTokenIfNeededImpl(
  retryCount: number,
  force: boolean,
): Promise<boolean> {
  // MAX_RETRIES 集合保存`5`，供后续判断或组装使用。
  const MAX_RETRIES = 5

  // 等待 `invalidateOAuthCacheIfDiskChanged()` 完成，再继续共享工具 auth的异步流程。
  await invalidateOAuthCacheIfDiskChanged()

  // First check if token is expired with cached value
  // Skip this check if force=true (server already told us token is bad)
  // token 列表读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // force缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!force) {
    // 只有 `!tokens?.refreshToken || !isOAuthTokenExpired(tokens.expiresAt)` 满足时，共享工具才执行该分支。
    if (!tokens?.refreshToken || !isOAuthTokenExpired(tokens.expiresAt)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // 满足 `!tokens?.refreshToken` 时，共享工具执行该分支。
  if (!tokens?.refreshToken) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 满足 `!shouldUseClaudeAIAuth(tokens.scopes)` 时，共享工具执行该分支。
  if (!shouldUseClaudeAIAuth(tokens.scopes)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Re-read tokens async to check if they're still expired
  // Another process might have refreshed them
  // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
  getClaudeAIOAuthTokens.cache?.clear?.()
  // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
  clearKeychainCache()
  // freshTokens 集合读取`getClaudeAIOAuthTokensAsync`，供共享工具后续处理使用。
  const freshTokens = await getClaudeAIOAuthTokensAsync()
  // 共享工具在这里按实际状态进入对应分支。
  if (
    !freshTokens?.refreshToken ||
    !isOAuthTokenExpired(freshTokens.expiresAt)
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Tokens are still expired, try to acquire lock and refresh
  // claudeDir读取`getClaudeConfigHomeDir`，供共享工具后续处理使用。
  const claudeDir = getClaudeConfigHomeDir()
  // 等待 `mkdir(claudeDir, { recursive: true })` 完成，再继续共享工具 auth的异步流程。
  await mkdir(claudeDir, { recursive: true })

  // release 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let release
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_lock_acquiring', {})
    // release更新为 `await lockfile.lock(claudeDir)`，确保共享工具后续读取最新状态。
    release = await lockfile.lock(claudeDir)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_lock_acquired', {})
  } catch (err) {
    // 当 `(err as { code?: string }).code` 匹配 `'ELOCKED'` 时，共享工具执行对应分支。
    if ((err as { code?: string }).code === 'ELOCKED') {
      // Another process has the lock, let's retry if we haven't exceeded max retries
      // 满足 `retryCount < MAX_RETRIES` 时，共享工具执行该分支。
      if (retryCount < MAX_RETRIES) {
        // 记录共享工具运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_oauth_token_refresh_lock_retry', {
          retryCount: retryCount + 1,
        })
        // Wait a bit before retrying
        // 等待 `sleep(1000 + Math.random() * 1000)` 完成，再继续共享工具 auth的异步流程。
        await sleep(1000 + Math.random() * 1000)
        // 返回 `checkAndRefreshOAuthTokenIfNeededImpl(retryCount + 1, force)`，作为共享工具这次计算的结果。
        return checkAndRefreshOAuthTokenIfNeededImpl(retryCount + 1, force)
      }
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_token_refresh_lock_retry_limit_reached', {
        maxRetries: MAX_RETRIES,
      })
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(err)
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_lock_error', {
      error: errorMessage(
        err,
      ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // Check one more time after acquiring lock
    // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
    getClaudeAIOAuthTokens.cache?.clear?.()
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearKeychainCache()
    // lockedTokens 集合读取`getClaudeAIOAuthTokensAsync`，供共享工具后续处理使用。
    const lockedTokens = await getClaudeAIOAuthTokensAsync()
    // 共享工具在这里按实际状态进入对应分支。
    if (
      !lockedTokens?.refreshToken ||
      !isOAuthTokenExpired(lockedTokens.expiresAt)
    ) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_token_refresh_race_resolved', {})
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }

    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_starting', {})
    // refreshedTokens 集合保存`refreshOAuthToken`，供共享工具后续处理使用。
    const refreshedTokens = await refreshOAuthToken(lockedTokens.refreshToken, {
      // For Claude.ai subscribers, omit scopes so the default
      // CLAUDE_AI_OAUTH_SCOPES applies — this allows scope expansion
      // (e.g. adding user:file_upload) on refresh without re-login.
      scopes: shouldUseClaudeAIAuth(lockedTokens.scopes)
        ? undefined
        : lockedTokens.scopes,
    })
    // 调用 saveOAuthTokensIfNeeded，触发共享工具此处需要的副作用。
    saveOAuthTokensIfNeeded(refreshedTokens)

    // Clear the cache after refreshing token
    // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
    getClaudeAIOAuthTokens.cache?.clear?.()
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearKeychainCache()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(error)

    // 调用 getClaudeAIOAuthTokens.cache?.clear?.()，完成这一处局部操作。
    getClaudeAIOAuthTokens.cache?.clear?.()
    // 清理相关缓存，确保共享工具下一次读取时重新加载最新数据。
    clearKeychainCache()
    // currentTokens 集合读取`getClaudeAIOAuthTokensAsync`，供共享工具后续处理使用。
    const currentTokens = await getClaudeAIOAuthTokensAsync()
    // 只有 `currentTokens && !isOAuthTokenExpired(currentTokens.expiresAt)` 满足时，共享工具才执行该分支。
    if (currentTokens && !isOAuthTokenExpired(currentTokens.expiresAt)) {
      // 记录共享工具运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_oauth_token_refresh_race_recovered', {})
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }

    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  } finally {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_lock_releasing', {})
    // 等待 `release()` 完成，再继续共享工具 auth的异步流程。
    await release()
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_oauth_token_refresh_lock_released', {})
  }
}

// isClaudeAISubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isClaudeAISubscriber(): boolean {
  // 满足 `!isAnthropicAuthEnabled()` 时，共享工具执行该分支。
  if (!isAnthropicAuthEnabled()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 `shouldUseClaudeAIAuth(getClaudeAIOAuthTokens()?.scopes)`，作为共享工具这次计算的结果。
  return shouldUseClaudeAIAuth(getClaudeAIOAuthTokens()?.scopes)
}

/**
 * Check if the current OAuth token has the user:profile scope.
 *
 * Real /login tokens always include this scope. Env-var and file-descriptor
 * tokens (service keys) hardcode scopes to ['user:inference'] only. Use this
 * to gate calls to profile-scoped endpoints so service key sessions don't
 * generate 403 storms against /api/oauth/profile, bootstrap, etc.
 */
// hasProfileScope 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasProfileScope(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getClaudeAIOAuthTokens()?.scopes?.includes(CLAUDE_AI_PROFILE_SCOPE) ?? false
  )
}

// is1PApiCustomer 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function is1PApiCustomer(): boolean {
  // 1P API customers are users who are NOT:
  // 1. Claude.ai subscribers (Max, Pro, Enterprise, Team)
  // 2. Vertex AI users
  // 3. AWS Bedrock users
  // 4. Foundry users

  // Exclude Vertex, Bedrock, and Foundry customers
  // 共享工具在这里按实际状态进入对应分支。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Exclude Claude.ai subscribers
  // 满足 `isClaudeAISubscriber()` 时，共享工具执行该分支。
  if (isClaudeAISubscriber()) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Everyone else is an API customer (OAuth API customers, direct API key users, etc.)
  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

/**
 * Gets OAuth account information when Anthropic auth is enabled.
 * Returns undefined when using external API keys or third-party services.
 */
// getOauthAccountInfo 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOauthAccountInfo(): AccountInfo | undefined {
  // 返回 `isAnthropicAuthEnabled() ? getGlobalConfig().oauthAccount : undefined`，作为共享工具这次计算的结果。
  return isAnthropicAuthEnabled() ? getGlobalConfig().oauthAccount : undefined
}

/**
 * Checks if overage/extra usage provisioning is allowed for this organization.
 * This mirrors the logic in apps/claude-ai `useIsOverageProvisioningAllowed` hook as closely as possible.
 */
// isOverageProvisioningAllowed 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOverageProvisioningAllowed(): boolean {
  // accountInfo 数量读取`getOauthAccountInfo`，供共享工具后续处理使用。
  const accountInfo = getOauthAccountInfo()
  // billingType统计`accountInfo?.billingType` 整理出中间结果，供共享工具 auth后续步骤使用。
  const billingType = accountInfo?.billingType

  // Must be a Claude subscriber with a supported subscription type
  // 只有 `!isClaudeAISubscriber() || !billingType` 满足时，共享工具才执行该分支。
  if (!isClaudeAISubscriber() || !billingType) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // only allow Stripe and mobile billing types to purchase extra usage
  // 共享工具在这里按实际状态进入对应分支。
  if (
    billingType !== 'stripe_subscription' &&
    billingType !== 'stripe_subscription_contracted' &&
    billingType !== 'apple_subscription' &&
    billingType !== 'google_play_subscription'
  ) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// Returns whether the user has Opus access at all, regardless of whether they
// are a subscriber or PayG.
// hasOpusAccess 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function hasOpusAccess(): boolean {
  // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
  const subscriptionType = getSubscriptionType()

  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    subscriptionType === 'max' ||
    subscriptionType === 'enterprise' ||
    subscriptionType === 'team' ||
    subscriptionType === 'pro' ||
    // subscriptionType === null covers both API users and the case where
    // subscribers do not have subscription type populated. For those
    // subscribers, when in doubt, we should not limit their access to Opus.
    subscriptionType === null
  )
}

// getSubscriptionType 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSubscriptionType(): SubscriptionType | null {
  // Check for mock subscription type first (ANT-only testing)
  // 满足 `shouldUseMockSubscription()` 时，共享工具执行该分支。
  if (shouldUseMockSubscription()) {
    // 返回 `getMockSubscriptionType()`，作为共享工具这次计算的结果。
    return getMockSubscriptionType()
  }

  // 满足 `!isAnthropicAuthEnabled()` 时，共享工具执行该分支。
  if (!isAnthropicAuthEnabled()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // oauthTokens 集合读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const oauthTokens = getClaudeAIOAuthTokens()
  // oauthTokens 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!oauthTokens) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回 `oauthTokens.subscriptionType ?? null`，作为共享工具这次计算的结果。
  return oauthTokens.subscriptionType ?? null
}

// isMaxSubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isMaxSubscriber(): boolean {
  // 返回 `getSubscriptionType() === 'max'`，作为共享工具这次计算的结果。
  return getSubscriptionType() === 'max'
}

// isTeamSubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamSubscriber(): boolean {
  // 返回 `getSubscriptionType() === 'team'`，作为共享工具这次计算的结果。
  return getSubscriptionType() === 'team'
}

// isTeamPremiumSubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isTeamPremiumSubscriber(): boolean {
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    getSubscriptionType() === 'team' &&
    getRateLimitTier() === 'default_claude_max_5x'
  )
}

// isEnterpriseSubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isEnterpriseSubscriber(): boolean {
  // 返回 `getSubscriptionType() === 'enterprise'`，作为共享工具这次计算的结果。
  return getSubscriptionType() === 'enterprise'
}

// isProSubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isProSubscriber(): boolean {
  // 返回 `getSubscriptionType() === 'pro'`，作为共享工具这次计算的结果。
  return getSubscriptionType() === 'pro'
}

// getRateLimitTier 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRateLimitTier(): string | null {
  // 满足 `!isAnthropicAuthEnabled()` 时，共享工具执行该分支。
  if (!isAnthropicAuthEnabled()) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }
  // oauthTokens 集合读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const oauthTokens = getClaudeAIOAuthTokens()
  // oauthTokens 集合缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!oauthTokens) {
    // 返回 `null`，作为共享工具这次计算的结果。
    return null
  }

  // 返回 `oauthTokens.rateLimitTier ?? null`，作为共享工具这次计算的结果。
  return oauthTokens.rateLimitTier ?? null
}

// getSubscriptionName 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getSubscriptionName(): string {
  // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
  const subscriptionType = getSubscriptionType()

  // 按照 subscriptionType 的取值选择共享工具的具体处理分支。
  switch (subscriptionType) {
    case 'enterprise':
      // 返回 `'Claude Enterprise'`，作为共享工具这次计算的结果。
      return 'Claude Enterprise'
    case 'team':
      // 返回 `'Claude Team'`，作为共享工具这次计算的结果。
      return 'Claude Team'
    case 'max':
      // 返回 `'Claude Max'`，作为共享工具这次计算的结果。
      return 'Claude Max'
    case 'pro':
      // 返回 `'Claude Pro'`，作为共享工具这次计算的结果。
      return 'Claude Pro'
    default:
      // 返回 `'Claude API'`，作为共享工具这次计算的结果。
      return 'Claude API'
  }
}

/** Check if using third-party services (Bedrock or Vertex or Foundry) */
// isUsing3PServices 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isUsing3PServices(): boolean {
  // 返回 `!!(`，作为共享工具这次计算的结果。
  return !!(
    isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX) ||
    isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
  )
}

/**
 * Get the configured otelHeadersHelper from settings
 */
// getConfiguredOtelHeadersHelper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getConfiguredOtelHeadersHelper(): string | undefined {
  // mergedSettings 集合读取`getSettings_DEPRECATED`，供共享工具后续处理使用。
  const mergedSettings = getSettings_DEPRECATED() || {}
  // 返回 `mergedSettings.otelHeadersHelper`，作为共享工具这次计算的结果。
  return mergedSettings.otelHeadersHelper
}

/**
 * Check if the configured otelHeadersHelper comes from project settings (projectSettings or localSettings)
 */
// isOtelHeadersHelperFromProjectOrLocalSettings 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isOtelHeadersHelperFromProjectOrLocalSettings(): boolean {
  // otelHeadersHelper读取`getConfiguredOtelHeadersHelper`，供共享工具后续处理使用。
  const otelHeadersHelper = getConfiguredOtelHeadersHelper()
  // otelHeadersHelper缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!otelHeadersHelper) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // projectSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const projectSettings = getSettingsForSource('projectSettings')
  // localSettings 集合读取`getSettingsForSource`，供共享工具后续处理使用。
  const localSettings = getSettingsForSource('localSettings')
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    projectSettings?.otelHeadersHelper === otelHeadersHelper ||
    localSettings?.otelHeadersHelper === otelHeadersHelper
  )
}

// Cache for debouncing otelHeadersHelper calls
// cachedOtelHeaders 缓存初始化为空值，后续分支会在有数据时补齐。
let cachedOtelHeaders: Record<string, string> | null = null
// cachedOtelHeadersTimestamp 缓存 命名 `0`，让后续代码直接表达这个值的用途。
let cachedOtelHeadersTimestamp = 0
// DEFAULT_OTEL_HEADERS_DEBOUNCE_MS 集合保存`29 * 60 * 1000 // 29 minutes`，供后续判断或组装使用。
const DEFAULT_OTEL_HEADERS_DEBOUNCE_MS = 29 * 60 * 1000 // 29 minutes

// getOtelHeadersFromHelper 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getOtelHeadersFromHelper(): Record<string, string> {
  // otelHeadersHelper读取`getConfiguredOtelHeadersHelper`，供共享工具后续处理使用。
  const otelHeadersHelper = getConfiguredOtelHeadersHelper()

  // otelHeadersHelper缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!otelHeadersHelper) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {}
  }

  // Return cached headers if still valid (debounce)
  // debounceMs 集合解析`parseInt`，供共享工具后续处理使用。
  const debounceMs = parseInt(
    process.env.CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS ||
      DEFAULT_OTEL_HEADERS_DEBOUNCE_MS.toString(),
  )
  // 共享工具在这里按实际状态进入对应分支。
  if (
    cachedOtelHeaders &&
    Date.now() - cachedOtelHeadersTimestamp < debounceMs
  ) {
    // 返回 `cachedOtelHeaders`，作为共享工具这次计算的结果。
    return cachedOtelHeaders
  }

  // 满足 `isOtelHeadersHelperFromProjectOrLocalSettings()` 时，共享工具执行该分支。
  if (isOtelHeadersHelperFromProjectOrLocalSettings()) {
    // Check if trust has been established for this project
    // hasTrust记录 `checkHasTrustDialogAccepted` 是否成立，共享工具随后按该结果分支。
    const hasTrust = checkHasTrustDialogAccepted()
    // hasTrust缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!hasTrust) {
      // 返回结构化结果，集中表达共享工具已经整理出的状态。
      return {}
    }
  }

  // 保护这一段可能失败的共享工具操作，确保异常能进入相邻错误处理。
  try {
    // 结果保存`execSyncWithDefaults_DEPRECATED`，供共享工具后续处理使用。
    const result = execSyncWithDefaults_DEPRECATED(otelHeadersHelper, {
      timeout: 30000, // 30 seconds - allows for auth service latency
    })
      ?.toString()
      .trim()
    // 结果缺失时直接走兜底路径，避免共享工具使用无效输入。
    if (!result) {
      // 抛出 new Error('otelHeadersHelper did not return a valid value')，阻止共享工具在无效状态下继续运行。
      throw new Error('otelHeadersHelper did not return a valid value')
    }

    // 请求头解析`jsonParse`，供共享工具后续处理使用。
    const headers = jsonParse(result)
    // 共享工具在这里按实际状态进入对应分支。
    if (
      typeof headers !== 'object' ||
      headers === null ||
      Array.isArray(headers)
    ) {
      // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
      throw new Error(
        'otelHeadersHelper must return a JSON object with string key-value pairs',
      )
    }

    // Validate all values are strings
    // 循环处理 `const [key, value] of Object.entries(headers)`，让共享工具把同类条目按顺序走完。
    for (const [key, value] of Object.entries(headers)) {
      // `typeof value` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
      if (typeof value !== 'string') {
        // 抛出 new Error(，阻止共享工具在无效状态下继续运行。
        throw new Error(
          `otelHeadersHelper returned non-string value for key "${key}": ${typeof value}`,
        )
      }
    }

    // Cache the result
    // cachedOtelHeaders 缓存更新为 `headers as Record<string, string>`，确保共享工具后续读取最新状态。
    cachedOtelHeaders = headers as Record<string, string>
    // cachedOtelHeadersTimestamp 缓存更新为 `Date.now()`，确保共享工具后续读取最新状态。
    cachedOtelHeadersTimestamp = Date.now()

    // 返回 `cachedOtelHeaders`，作为共享工具这次计算的结果。
    return cachedOtelHeaders
  } catch (error) {
    // 记录共享工具运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        `Error getting OpenTelemetry headers from otelHeadersHelper (in settings): ${errorMessage(error)}`,
      ),
    )
    // 抛出 error，阻止共享工具在无效状态下继续运行。
    throw error
  }
}

// isConsumerPlan 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isConsumerPlan(plan: SubscriptionType): plan is 'max' | 'pro' {
  // 返回 `plan === 'max' || plan === 'pro'`，作为共享工具这次计算的结果。
  return plan === 'max' || plan === 'pro'
}

// isConsumerSubscriber 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isConsumerSubscriber(): boolean {
  // subscriptionType读取`getSubscriptionType`，供共享工具后续处理使用。
  const subscriptionType = getSubscriptionType()
  // 返回 `(`，作为共享工具这次计算的结果。
  return (
    isClaudeAISubscriber() &&
    subscriptionType !== null &&
    isConsumerPlan(subscriptionType)
  )
}

// UserAccountInfo 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type UserAccountInfo = {
  subscription?: string
  tokenSource?: string
  apiKeySource?: ApiKeySource
  organization?: string
  email?: string
}

// getAccountInformation 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAccountInformation() {
  // apiProvider读取`getAPIProvider`，供共享工具后续处理使用。
  const apiProvider = getAPIProvider()
  // Only provide account info for first-party Anthropic API
  // `apiProvider` 与 `'firstParty'` 不一致时刷新派生状态，避免使用过期结果。
  if (apiProvider !== 'firstParty') {
    // 返回 `undefined`，作为共享工具这次计算的结果。
    return undefined
  }
  // 从 `getAuthTokenSource()` 解构 source，减少共享工具 auth对同一对象的重复访问。
  const { source: authTokenSource } = getAuthTokenSource()
  // accountInfo 数量 从空对象开始收集键值，后续按名称补齐内容。
  const accountInfo: UserAccountInfo = {}
  // 共享工具在这里按实际状态进入对应分支。
  if (
    authTokenSource === 'CLAUDE_CODE_OAUTH_TOKEN' ||
    authTokenSource === 'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR'
  ) {
    // tokenSource更新为 `authTokenSource`，确保共享工具后续读取最新状态。
    accountInfo.tokenSource = authTokenSource
  // 共享工具 auth在这里处理 `} else if (isClaudeAISubscriber()) {`，完成这一小步状态转换。
  } else if (isClaudeAISubscriber()) {
    // subscription更新为 `getSubscriptionName()`，确保共享工具后续读取最新状态。
    accountInfo.subscription = getSubscriptionName()
  } else {
    // tokenSource更新为 `authTokenSource`，确保共享工具后续读取最新状态。
    accountInfo.tokenSource = authTokenSource
  }
  // 从 `getAnthropicApiKeyWithSource()` 解构 key、source，减少共享工具 auth对同一对象的重复访问。
  const { key: apiKey, source: apiKeySource } = getAnthropicApiKeyWithSource()
  // 满足 `apiKey` 时，共享工具执行该分支。
  if (apiKey) {
    // apiKeySource更新为 `apiKeySource`，确保共享工具后续读取最新状态。
    accountInfo.apiKeySource = apiKeySource
  }

  // We don't know the organization if we're relying on an external API key or auth token
  // 共享工具在这里按实际状态进入对应分支。
  if (
    authTokenSource === 'claude.ai' ||
    apiKeySource === '/login managed key'
  ) {
    // Get organization name from OAuth account info
    // orgName读取`getOauthAccountInfo`，供共享工具后续处理使用。
    const orgName = getOauthAccountInfo()?.organizationName
    // 满足 `orgName` 时，共享工具执行该分支。
    if (orgName) {
      // organization更新为 `orgName`，确保共享工具后续读取最新状态。
      accountInfo.organization = orgName
    }
  }
  // email读取`getOauthAccountInfo`，供共享工具后续处理使用。
  const email = getOauthAccountInfo()?.emailAddress
  // 共享工具在这里按实际状态进入对应分支。
  if (
    (authTokenSource === 'claude.ai' ||
      apiKeySource === '/login managed key') &&
    email
  ) {
    // email更新为 `email`，确保共享工具后续读取最新状态。
    accountInfo.email = email
  }
  // 返回 `accountInfo`，作为共享工具这次计算的结果。
  return accountInfo
}

/**
 * Result of org validation — either success or a descriptive error.
 */
// OrgValidationResult 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type OrgValidationResult =
  | { valid: true }
  | { valid: false; message: string }

/**
 * Validate that the active OAuth token belongs to the organization required
 * by `forceLoginOrgUUID` in managed settings. Returns a result object
 * rather than throwing so callers can choose how to surface the error.
 *
 * Fails closed: if `forceLoginOrgUUID` is set and we cannot determine the
 * token's org (network error, missing profile data), validation fails.
 */
// validateForceLoginOrg 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function validateForceLoginOrg(): Promise<OrgValidationResult> {
  // `claude ssh` remote: real auth lives on the local machine and is injected
  // by the proxy. The placeholder token can't be validated against the profile
  // endpoint. The local side already ran this check before establishing the session.
  // 满足 `process.env.ANTHROPIC_UNIX_SOCKET` 时，共享工具执行该分支。
  if (process.env.ANTHROPIC_UNIX_SOCKET) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // 满足 `!isAnthropicAuthEnabled()` 时，共享工具执行该分支。
  if (!isAnthropicAuthEnabled()) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // requiredOrgUuid 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const requiredOrgUuid =
    getSettingsForSource('policySettings')?.forceLoginOrgUUID
  // requiredOrgUuid缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!requiredOrgUuid) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // Ensure the access token is fresh before hitting the profile endpoint.
  // No-op for env-var tokens (refreshToken is null).
  // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续共享工具 auth的异步流程。
  await checkAndRefreshOAuthTokenIfNeeded()

  // token 列表读取`getClaudeAIOAuthTokens`，供共享工具后续处理使用。
  const tokens = getClaudeAIOAuthTokens()
  // token 列表缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!tokens) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // Always fetch the authoritative org UUID from the profile endpoint.
  // Even keychain-sourced tokens verify server-side: the cached org UUID
  // in ~/.claude.json is user-writable and cannot be trusted.
  // 从 `getAuthTokenSource()` 解构 source，减少共享工具 auth对同一对象的重复访问。
  const { source } = getAuthTokenSource()
  // isEnvVarToken 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isEnvVarToken =
    source === 'CLAUDE_CODE_OAUTH_TOKEN' ||
    source === 'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR'

  // profile 文件数据读取`getOauthProfileFromOauthToken`，供共享工具后续处理使用。
  const profile = await getOauthProfileFromOauthToken(tokens.accessToken)
  // profile 文件数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!profile) {
    // Fail closed — we can't verify the org
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      message:
        `Unable to verify organization for the current authentication token.\n` +
        `This machine requires organization ${requiredOrgUuid} but the profile could not be fetched.\n` +
        `This may be a network error, or the token may lack the user:profile scope required for\n` +
        `verification (tokens from 'claude setup-token' do not include this scope).\n` +
        `Try again, or obtain a full-scope token via 'claude auth login'.`,
    }
  }

  // tokenOrgUuid保存`profile.organization.uuid`，供共享工具 auth后续判断或输出使用。
  const tokenOrgUuid = profile.organization.uuid
  // 满足 `tokenOrgUuid === requiredOrgUuid` 时，共享工具执行该分支。
  if (tokenOrgUuid === requiredOrgUuid) {
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return { valid: true }
  }

  // 满足 `isEnvVarToken` 时，共享工具执行该分支。
  if (isEnvVarToken) {
    // envVarName 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const envVarName =
      source === 'CLAUDE_CODE_OAUTH_TOKEN'
        ? 'CLAUDE_CODE_OAUTH_TOKEN'
        : 'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR'
    // 返回结构化结果，集中表达共享工具已经整理出的状态。
    return {
      valid: false,
      message:
        `The ${envVarName} environment variable provides a token for a\n` +
        `different organization than required by this machine's managed settings.\n\n` +
        `Required organization: ${requiredOrgUuid}\n` +
        `Token organization:   ${tokenOrgUuid}\n\n` +
        `Remove the environment variable or obtain a token for the correct organization.`,
    }
  }

  // 返回结构化结果，集中表达共享工具已经整理出的状态。
  return {
    valid: false,
    message:
      `Your authentication token belongs to organization ${tokenOrgUuid},\n` +
      `but this machine requires organization ${requiredOrgUuid}.\n\n` +
      `Please log in with the correct organization: claude auth login`,
  }
}

// GcpCredentialsTimeoutError 聚合共享工具相关状态与操作，把同一职责的行为收束到类实例中。
class GcpCredentialsTimeoutError extends Error {}
