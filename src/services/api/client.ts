// 引入 Anthropic、ClientOptions，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 类型依赖 { GoogleAuth } 来自 google-auth-library，用于校准API 服务 client的数据契约。
import type { GoogleAuth } from 'google-auth-library'
// 整理这一组导入，让API 服务 client后续逻辑可以直接复用这些外部能力。
import {
  checkAndRefreshOAuthTokenIfNeeded,
  getAnthropicApiKey,
  getApiKeyFromApiKeyHelper,
  getClaudeAIOAuthTokens,
  isClaudeAISubscriber,
  refreshAndGetAwsCredentials,
  refreshGcpCredentialsIfNeeded,
} from 'src/utils/auth.js'
// 复用 getUserAgent 工具函数，把通用处理留在 src/utils/http.js 中维护。
import { getUserAgent } from 'src/utils/http.js'
// 复用 getSmallFastModel 工具函数，把通用处理留在 src/utils/model/model.js 中维护。
import { getSmallFastModel } from 'src/utils/model/model.js'
// 整理这一组导入，让API 服务 client后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from 'src/utils/model/providers.js'
// 复用 getProxyFetchOptions 工具函数，把通用处理留在 src/utils/proxy.js 中维护。
import { getProxyFetchOptions } from 'src/utils/proxy.js'
// 整理这一组导入，让API 服务 client后续逻辑可以直接复用这些外部能力。
import {
  getIsNonInteractiveSession,
  getSessionId,
} from '../../bootstrap/state.js'
// 引入 getOauthConfig，将 ../../constants/oauth.js 中已经封装好的能力接到本文件流程里。
import { getOauthConfig } from '../../constants/oauth.js'
// 复用 isDebugToStdErr、logForDebugging 工具函数，把通用处理留在 ../../utils/debug.js 中维护。
import { isDebugToStdErr, logForDebugging } from '../../utils/debug.js'
// 整理这一组导入，让API 服务 client后续逻辑可以直接复用这些外部能力。
import {
  getAWSRegion,
  getVertexRegionForModel,
  isEnvTruthy,
} from '../../utils/envUtils.js'

/**
 * Environment variables for different client types:
 *
 * Direct API:
 * - ANTHROPIC_API_KEY: Required for direct API access
 *
 * AWS Bedrock:
 * - AWS credentials configured via aws-sdk defaults
 * - AWS_REGION or AWS_DEFAULT_REGION: Sets the AWS region for all models (default: us-east-1)
 * - ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION: Optional. Override AWS region specifically for the small fast model (Haiku)
 *
 * Foundry (Azure):
 * - ANTHROPIC_FOUNDRY_RESOURCE: Your Azure resource name (e.g., 'my-resource')
 *   For the full endpoint: https://{resource}.services.ai.azure.com/anthropic/v1/messages
 * - ANTHROPIC_FOUNDRY_BASE_URL: Optional. Alternative to resource - provide full base URL directly
 *   (e.g., 'https://my-resource.services.ai.azure.com')
 *
 * Authentication (one of the following):
 * - ANTHROPIC_FOUNDRY_API_KEY: Your Microsoft Foundry API key (if using API key auth)
 * - Azure AD authentication: If no API key is provided, uses DefaultAzureCredential
 *   which supports multiple auth methods (environment variables, managed identity,
 *   Azure CLI, etc.). See: https://docs.microsoft.com/en-us/javascript/api/@azure/identity
 *
 * Vertex AI:
 * - Model-specific region variables (highest priority):
 *   - VERTEX_REGION_CLAUDE_3_5_HAIKU: Region for Claude 3.5 Haiku model
 *   - VERTEX_REGION_CLAUDE_HAIKU_4_5: Region for Claude Haiku 4.5 model
 *   - VERTEX_REGION_CLAUDE_3_5_SONNET: Region for Claude 3.5 Sonnet model
 *   - VERTEX_REGION_CLAUDE_3_7_SONNET: Region for Claude 3.7 Sonnet model
 * - CLOUD_ML_REGION: Optional. The default GCP region to use for all models
 *   If specific model region not specified above
 * - ANTHROPIC_VERTEX_PROJECT_ID: Required. Your GCP project ID
 * - Standard GCP credentials configured via google-auth-library
 *
 * Priority for determining region:
 * 1. Hardcoded model-specific environment variables
 * 2. Global CLOUD_ML_REGION variable
 * 3. Default region from config
 * 4. Fallback region (us-east5)
 */

// createStderrLogger 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function createStderrLogger(): ClientOptions['logger'] {
  // 返回结构化结果，集中表达API 服务 client已经整理出的状态。
  return {
    // 这个回调绑定到 error: (msg, ...args) =>，负责API 服务 client在该局部场景下的响应。
    error: (msg, ...args) =>
      // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
      console.error('[Anthropic SDK ERROR]', msg, ...args),
    // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
    // 这个回调绑定到 warn: (msg, ...args) => console.error('[Anthropic SDK WARN]', msg, ...args),，负责API 服务 client在该局部场景下的响应。
    warn: (msg, ...args) => console.error('[Anthropic SDK WARN]', msg, ...args),
    // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
    // 这个回调绑定到 info: (msg, ...args) => console.error('[Anthropic SDK INFO]', msg, ...args),，负责API 服务 client在该局部场景下的响应。
    info: (msg, ...args) => console.error('[Anthropic SDK INFO]', msg, ...args),
    // 这个回调绑定到 debug: (msg, ...args) =>，负责API 服务 client在该局部场景下的响应。
    debug: (msg, ...args) =>
      // biome-ignore lint/suspicious/noConsole:: intentional console output -- SDK logger must use console
      console.error('[Anthropic SDK DEBUG]', msg, ...args),
  }
}

// getAnthropicClient 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function getAnthropicClient({
  apiKey,
  maxRetries,
  model,
  fetchOverride,
  source,
}: {
  apiKey?: string
  maxRetries: number
  model?: string
  fetchOverride?: ClientOptions['fetch']
  source?: string
}): Promise<Anthropic> {
  // containerId 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const containerId = process.env.CLAUDE_CODE_CONTAINER_ID
  // remoteSessionId 会话数据 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const remoteSessionId = process.env.CLAUDE_CODE_REMOTE_SESSION_ID
  // clientApp 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const clientApp = process.env.CLAUDE_AGENT_SDK_CLIENT_APP
  // customHeaders 集合读取`getCustomHeaders`，供API 服务 client后续处理使用。
  const customHeaders = getCustomHeaders()
  // defaultHeaders 集合 集中保存API 服务 client要一起传递的字段。
  const defaultHeaders: { [key: string]: string } = {
    'x-app': 'cli',
    'User-Agent': getUserAgent(),
    'X-Claude-Code-Session-Id': getSessionId(),
    ...customHeaders,
    ...(containerId ? { 'x-claude-remote-container-id': containerId } : {}),
    ...(remoteSessionId
      ? { 'x-claude-remote-session-id': remoteSessionId }
      : {}),
    // SDK consumers can identify their app/library for backend analytics
    ...(clientApp ? { 'x-client-app': clientApp } : {}),
  }

  // Log API client configuration for HFI debugging
  // 记录API 服务 client运行诊断，方便排查异常路径或性能问题。
  logForDebugging(
    `[API:request] Creating client, ANTHROPIC_CUSTOM_HEADERS present: ${!!process.env.ANTHROPIC_CUSTOM_HEADERS}, has Authorization header: ${!!customHeaders['Authorization']}`,
  )

  // Add additional protection header if enabled via env var
  // additionalProtectionEnabled保存`isEnvTruthy`，供API 服务 client后续处理使用。
  const additionalProtectionEnabled = isEnvTruthy(
    process.env.CLAUDE_CODE_ADDITIONAL_PROTECTION,
  )
  // 满足 `additionalProtectionEnabled` 时，API 服务 client执行该分支。
  if (additionalProtectionEnabled) {
    // 更新为 `'true'`，确保API 服务 client后续读取最新状态。
    defaultHeaders['x-anthropic-additional-protection'] = 'true'
  }

  // 记录API 服务 client运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[API:auth] OAuth token check starting')
  // 等待 `checkAndRefreshOAuthTokenIfNeeded()` 完成，再继续API 服务 client的异步流程。
  await checkAndRefreshOAuthTokenIfNeeded()
  // 记录API 服务 client运行诊断，方便排查异常路径或性能问题。
  logForDebugging('[API:auth] OAuth token check complete')

  // 满足 `!isClaudeAISubscriber()` 时，API 服务 client执行该分支。
  if (!isClaudeAISubscriber()) {
    // 等待 `configureApiKeyHeaders(defaultHeaders, getIsNonInteractiveSession())` 完成，再继续API 服务 client的异步流程。
    await configureApiKeyHeaders(defaultHeaders, getIsNonInteractiveSession())
  }

  // resolvedFetch构建`buildFetch`，供API 服务 client后续处理使用。
  const resolvedFetch = buildFetch(fetchOverride, source)

  // ARGS 集合 集中保存API 服务 client要一起传递的字段。
  const ARGS = {
    defaultHeaders,
    maxRetries,
    timeout: parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
    dangerouslyAllowBrowser: true,
    fetchOptions: getProxyFetchOptions({
      forAnthropicAPI: true,
    }) as ClientOptions['fetchOptions'],
    ...(resolvedFetch && {
      fetch: resolvedFetch,
    }),
  }
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)` 时，API 服务 client执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)) {
    // 从 `await import('@anthropic-ai/bedrock-sdk')` 解构 AnthropicBedrock，减少API 服务 client对同一对象的重复访问。
    const { AnthropicBedrock } = await import('@anthropic-ai/bedrock-sdk')
    // Use region override for small fast model if specified
    // awsRegion 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const awsRegion =
      model === getSmallFastModel() &&
      process.env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION
        ? process.env.ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION
        : getAWSRegion()

    // bedrockArgs 集合 集中保存API 服务 client要一起传递的字段。
    const bedrockArgs: ConstructorParameters<typeof AnthropicBedrock>[0] = {
      ...ARGS,
      awsRegion,
      ...(isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH) && {
        skipAuth: true,
      }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }

    // Add API key authentication if available
    // 满足 `process.env.AWS_BEARER_TOKEN_BEDROCK` 时，API 服务 client执行该分支。
    if (process.env.AWS_BEARER_TOKEN_BEDROCK) {
      // skipAuth更新为 `true`，确保API 服务后续读取最新状态。
      bedrockArgs.skipAuth = true
      // Add the Bearer token for Bedrock API key authentication
      // defaultHeaders 集合更新为 `{`，确保API 服务后续读取最新状态。
      bedrockArgs.defaultHeaders = {
        ...bedrockArgs.defaultHeaders,
        Authorization: `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
      }
    // API 服务 client在这里处理 `} else if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {`，完成这一小步状态转换。
    } else if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_BEDROCK_AUTH)) {
      // Refresh auth and get credentials with cache clearing
      // cachedCredentials 缓存保存`refreshAndGetAwsCredentials`，供API 服务 client后续处理使用。
      const cachedCredentials = await refreshAndGetAwsCredentials()
      // 满足 `cachedCredentials` 时，API 服务 client执行该分支。
      if (cachedCredentials) {
        // awsAccessKey更新为 `cachedCredentials.accessKeyId`，确保API 服务后续读取最新状态。
        bedrockArgs.awsAccessKey = cachedCredentials.accessKeyId
        // awsSecretKey更新为 `cachedCredentials.secretAccessKey`，确保API 服务后续读取最新状态。
        bedrockArgs.awsSecretKey = cachedCredentials.secretAccessKey
        // awsSessionToken 会话数据更新为 `cachedCredentials.sessionToken`，确保API 服务后续读取最新状态。
        bedrockArgs.awsSessionToken = cachedCredentials.sessionToken
      }
    }
    // we have always been lying about the return type - this doesn't support batching or models
    // 返回 `new AnthropicBedrock(bedrockArgs) as unknown as Anthropic`，作为API 服务 client这次计算的结果。
    return new AnthropicBedrock(bedrockArgs) as unknown as Anthropic
  }
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)` 时，API 服务 client执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)) {
    // 从 `await import('@anthropic-ai/foundry-sdk')` 解构 AnthropicFoundry，减少API 服务 client对同一对象的重复访问。
    const { AnthropicFoundry } = await import('@anthropic-ai/foundry-sdk')
    // Determine Azure AD token provider based on configuration
    // SDK reads ANTHROPIC_FOUNDRY_API_KEY by default
    // 这个回调绑定到 let azureADTokenProvider: (() => Promise<string>) | undefined，负责API 服务 client在该局部场景下的响应。
    let azureADTokenProvider: (() => Promise<string>) | undefined
    // process.env.ANTHROPIC_FOUNDRY_API_KEY缺失时提前走兜底路径，避免API 服务 client继续依赖无效输入。
    if (!process.env.ANTHROPIC_FOUNDRY_API_KEY) {
      // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)` 时，API 服务 client执行该分支。
      if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FOUNDRY_AUTH)) {
        // Mock token provider for testing/proxy scenarios (similar to Vertex mock GoogleAuth)
        // azureADTokenProvider更新为 `() => Promise.resolve('')`，确保API 服务后续读取最新状态。
        azureADTokenProvider = () => Promise.resolve('')
      } else {
        // Use real Azure AD authentication with DefaultAzureCredential
        // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
        const {
          DefaultAzureCredential: AzureCredential,
          getBearerTokenProvider,
        } = await import('@azure/identity')
        // azureADTokenProvider更新为 `getBearerTokenProvider(`，确保API 服务后续读取最新状态。
        azureADTokenProvider = getBearerTokenProvider(
          new AzureCredential(),
          'https://cognitiveservices.azure.com/.default',
        )
      }
    }

    // foundryArgs 集合 集中保存API 服务 client要一起传递的字段。
    const foundryArgs: ConstructorParameters<typeof AnthropicFoundry>[0] = {
      ...ARGS,
      ...(azureADTokenProvider && { azureADTokenProvider }),
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    // we have always been lying about the return type - this doesn't support batching or models
    // 返回 `new AnthropicFoundry(foundryArgs) as unknown as Anthropic`，作为API 服务 client这次计算的结果。
    return new AnthropicFoundry(foundryArgs) as unknown as Anthropic
  }
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)` 时，API 服务 client执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)) {
    // Refresh GCP credentials if gcpAuthRefresh is configured and credentials are expired
    // This is similar to how we handle AWS credential refresh for Bedrock
    // 满足 `!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)` 时，API 服务 client执行该分支。
    if (!isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)) {
      // 等待 `refreshGcpCredentialsIfNeeded()` 完成，再继续API 服务 client的异步流程。
      await refreshGcpCredentialsIfNeeded()
    }

    // 并行获取 { AnthropicVertex }、{ GoogleAuth }，缩短API 服务 client等待多个独立异步任务的时间。
    const [{ AnthropicVertex }, { GoogleAuth }] = await Promise.all([
      import('@anthropic-ai/vertex-sdk'),
      import('google-auth-library'),
    ])
    // TODO: Cache either GoogleAuth instance or AuthClient to improve performance
    // Currently we create a new GoogleAuth instance for every getAnthropicClient() call
    // This could cause repeated authentication flows and metadata server checks
    // However, caching needs careful handling of:
    // - Credential refresh/expiration
    // - Environment variable changes (GOOGLE_APPLICATION_CREDENTIALS, project vars)
    // - Cross-request auth state management
    // See: https://github.com/googleapis/google-auth-library-nodejs/issues/390 for caching challenges

    // Prevent metadata server timeout by providing projectId as fallback
    // google-auth-library checks project ID in this order:
    // 1. Environment variables (GCLOUD_PROJECT, GOOGLE_CLOUD_PROJECT, etc.)
    // 2. Credential files (service account JSON, ADC file)
    // 3. gcloud config
    // 4. GCE metadata server (causes 12s timeout outside GCP)
    //
    // We only set projectId if user hasn't configured other discovery methods
    // to avoid interfering with their existing auth setup

    // Check project environment variables in same order as google-auth-library
    // See: https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts
    // hasProjectEnvVar 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasProjectEnvVar =
      process.env['GCLOUD_PROJECT'] ||
      process.env['GOOGLE_CLOUD_PROJECT'] ||
      process.env['gcloud_project'] ||
      process.env['google_cloud_project']

    // Check for credential file paths (service account or ADC)
    // Note: We're checking both standard and lowercase variants to be safe,
    // though we should verify what google-auth-library actually checks
    // hasKeyFile 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasKeyFile =
      process.env['GOOGLE_APPLICATION_CREDENTIALS'] ||
      process.env['google_application_credentials']

    // googleAuth保存`isEnvTruthy`，供API 服务 client后续处理使用。
    const googleAuth = isEnvTruthy(process.env.CLAUDE_CODE_SKIP_VERTEX_AUTH)
      ? ({
          // Mock GoogleAuth for testing/proxy scenarios
          // 这个回调绑定到 getClient: () => ({，负责API 服务 client在该局部场景下的响应。
          getClient: () => ({
            // 这个回调绑定到 getRequestHeaders: () => ({}),，负责API 服务 client在该局部场景下的响应。
            getRequestHeaders: () => ({}),
          }),
        } as unknown as GoogleAuth)
      : new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          // Only use ANTHROPIC_VERTEX_PROJECT_ID as last resort fallback
          // This prevents the 12-second metadata server timeout when:
          // - No project env vars are set AND
          // - No credential keyfile is specified AND
          // - ADC file exists but lacks project_id field
          //
          // Risk: If auth project != API target project, this could cause billing/audit issues
          // Mitigation: Users can set GOOGLE_CLOUD_PROJECT to override
          ...(hasProjectEnvVar || hasKeyFile
            ? {}
            : {
                projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID,
              }),
        })

    // vertexArgs 集合 集中保存API 服务 client要一起传递的字段。
    const vertexArgs: ConstructorParameters<typeof AnthropicVertex>[0] = {
      ...ARGS,
      region: getVertexRegionForModel(model),
      googleAuth,
      ...(isDebugToStdErr() && { logger: createStderrLogger() }),
    }
    // we have always been lying about the return type - this doesn't support batching or models
    // 返回 `new AnthropicVertex(vertexArgs) as unknown as Anthropic`，作为API 服务 client这次计算的结果。
    return new AnthropicVertex(vertexArgs) as unknown as Anthropic
  }

  // Determine authentication method based on available tokens
  // clientConfig 配置 集中保存API 服务 client要一起传递的字段。
  const clientConfig: ConstructorParameters<typeof Anthropic>[0] = {
    apiKey: isClaudeAISubscriber() ? null : apiKey || getAnthropicApiKey(),
    authToken: isClaudeAISubscriber()
      ? getClaudeAIOAuthTokens()?.accessToken
      : undefined,
    // Set baseURL from OAuth config when using staging OAuth
    ...(process.env.USER_TYPE === 'ant' &&
    isEnvTruthy(process.env.USE_STAGING_OAUTH)
      ? { baseURL: getOauthConfig().BASE_API_URL }
      : {}),
    ...ARGS,
    ...(isDebugToStdErr() && { logger: createStderrLogger() }),
  }

  // 返回 `new Anthropic(clientConfig)`，作为API 服务 client这次计算的结果。
  return new Anthropic(clientConfig)
}

// configureApiKeyHeaders 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
async function configureApiKeyHeaders(
  headers: Record<string, string>,
  isNonInteractiveSession: boolean,
): Promise<void> {
  // token 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const token =
    process.env.ANTHROPIC_AUTH_TOKEN ||
    (await getApiKeyFromApiKeyHelper(isNonInteractiveSession))
  // 满足 `token` 时，API 服务 client执行该分支。
  if (token) {
    // headers['Authorization'更新为 ``Bearer ${token}``，确保API 服务 client后续读取最新状态。
    headers['Authorization'] = `Bearer ${token}`
  }
}

// getCustomHeaders 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getCustomHeaders(): Record<string, string> {
  // customHeaders 集合 从空对象开始收集键值，后续按名称补齐内容。
  const customHeaders: Record<string, string> = {}
  // customHeadersEnv 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const customHeadersEnv = process.env.ANTHROPIC_CUSTOM_HEADERS

  // customHeadersEnv缺失时提前走兜底路径，避免API 服务 client继续依赖无效输入。
  if (!customHeadersEnv) return customHeaders

  // Split by newlines to support multiple headers
  // headerStrings 集合格式化`customHeadersEnv.split`，供API 服务 client后续处理使用。
  const headerStrings = customHeadersEnv.split(/\n|\r\n/)

  // 按顺序遍历 `headerStrings` 中的headerString，逐个交给API 服务 client处理。
  for (const headerString of headerStrings) {
    // 满足 `!headerString.trim()` 时，API 服务 client执行该分支。
    if (!headerString.trim()) continue

    // Parse header in format "Name: Value" (curl style). Split on first `:`
    // then trim — avoids regex backtracking on malformed long header lines.
    // colonIdx保存`headerString.indexOf`，供API 服务 client后续处理使用。
    const colonIdx = headerString.indexOf(':')
    // 满足 `colonIdx === -1` 时，API 服务 client执行该分支。
    if (colonIdx === -1) continue
    // 名称格式化`headerString.slice`，供API 服务 client后续处理使用。
    const name = headerString.slice(0, colonIdx).trim()
    // 取值格式化`headerString.slice`，供API 服务 client后续处理使用。
    const value = headerString.slice(colonIdx + 1).trim()
    // 满足 `name` 时，API 服务 client执行该分支。
    if (name) {
      // customHeaders[name更新为 `value`，确保API 服务 client后续读取最新状态。
      customHeaders[name] = value
    }
  }

  // 返回 `customHeaders`，作为API 服务 client这次计算的结果。
  return customHeaders
}

// CLIENT_REQUEST_ID_HEADER 请求数据保存`'x-client-request-id'`，作为后续固定文本处理的输入。
export const CLIENT_REQUEST_ID_HEADER = 'x-client-request-id'

// buildFetch 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function buildFetch(
  fetchOverride: ClientOptions['fetch'],
  source: string | undefined,
): ClientOptions['fetch'] {
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
  // inner 命名 `fetchOverride ?? globalThis.fetch`，让后续代码直接表达这个值的用途。
  const inner = fetchOverride ?? globalThis.fetch
  // Only send to the first-party API — Bedrock/Vertex/Foundry don't log it
  // and unknown headers risk rejection by strict proxies (inc-4029 class).
  // injectClientRequestId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const injectClientRequestId =
    getAPIProvider() === 'firstParty' && isFirstPartyAnthropicBaseUrl()
  // 返回 `(input, init) => {`，作为API 服务 client这次计算的结果。
  return (input, init) => {
    // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
    // 请求头保存`Headers`，供API 服务 client后续处理使用。
    const headers = new Headers(init?.headers)
    // Generate a client-side request ID so timeouts (which return no server
    // request ID) can still be correlated with server logs by the API team.
    // Callers that want to track the ID themselves can pre-set the header.
    // 组合条件 `injectClientRequestId && !headers.has(CLIENT_REQUEST_ID_HEADER)` 成立时，API 服务 client才启用这条专门路径。
    if (injectClientRequestId && !headers.has(CLIENT_REQUEST_ID_HEADER)) {
      // headers.set 写入新的状态值，使API 服务 client后续读取保持一致。
      headers.set(CLIENT_REQUEST_ID_HEADER, randomUUID())
    }
    // 保护这一段可能失败的API 服务 client操作，确保异常能进入相邻错误处理。
    try {
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // URL保存`String`，供API 服务 client后续处理使用。
      const url = input instanceof Request ? input.url : String(input)
      // 标识符读取`headers.get`，供API 服务 client后续处理使用。
      const id = headers.get(CLIENT_REQUEST_ID_HEADER)
      // 记录API 服务 client运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `[API REQUEST] ${new URL(url).pathname}${id ? ` ${CLIENT_REQUEST_ID_HEADER}=${id}` : ''} source=${source ?? 'unknown'}`,
      )
    } catch {
      // never let logging crash the fetch
    }
    // 返回 `inner(input, { ...init, headers })`，作为API 服务 client这次计算的结果。
    return inner(input, { ...init, headers })
  }
}
