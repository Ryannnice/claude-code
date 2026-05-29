// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 引入 APIError，将 @anthropic-ai/sdk 中已经封装好的能力接到本文件流程里。
import { APIError } from '@anthropic-ai/sdk'
// 整理这一组导入，让API 服务 logging后续逻辑可以直接复用这些外部能力。
import type {
  BetaStopReason,
  BetaUsage as Usage,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 整理这一组导入，让API 服务 logging后续逻辑可以直接复用这些外部能力。
import {
  addToTotalDurationState,
  consumePostCompaction,
  getIsNonInteractiveSession,
  getLastApiCompletionTimestamp,
  getTeleportedSessionInfo,
  markFirstTeleportMessageLogged,
  setLastApiCompletionTimestamp,
} from 'src/bootstrap/state.js'
// 类型依赖 { QueryChainTracking } 来自 src/Tool.js，用于校准API 服务 logging的数据契约。
import type { QueryChainTracking } from 'src/Tool.js'
// 引入 isConnectorTextBlock，将 src/types/connectorText.js 中已经封装好的能力接到本文件流程里。
import { isConnectorTextBlock } from 'src/types/connectorText.js'
// 类型依赖 { AssistantMessage } 来自 src/types/message.js，用于校准API 服务 logging的数据契约。
import type { AssistantMessage } from 'src/types/message.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 类型依赖 { EffortLevel } 来自 src/utils/effort.js，用于校准API 服务 logging的数据契约。
import type { EffortLevel } from 'src/utils/effort.js'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 复用 getAPIProviderForStatsig 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProviderForStatsig } from 'src/utils/model/providers.js'
// 类型依赖 { PermissionMode } 来自 src/utils/permissions/PermissionMode.js，用于校准API 服务 logging的数据契约。
import type { PermissionMode } from 'src/utils/permissions/PermissionMode.js'
// 复用 jsonStringify 工具函数，把通用处理留在 src/utils/slowOperations.js 中维护。
import { jsonStringify } from 'src/utils/slowOperations.js'
// 复用 logOTelEvent 工具函数，把通用处理留在 src/utils/telemetry/events.js 中维护。
import { logOTelEvent } from 'src/utils/telemetry/events.js'
// 整理这一组导入，让API 服务 logging后续逻辑可以直接复用这些外部能力。
import {
  endLLMRequestSpan,
  isBetaTracingEnabled,
  type Span,
} from 'src/utils/telemetry/sessionTracing.js'
// 类型依赖 { NonNullableUsage } 来自 ../../entrypoints/sdk/sdkUtilityTypes.js，用于校准API 服务 logging的数据契约。
import type { NonNullableUsage } from '../../entrypoints/sdk/sdkUtilityTypes.js'
// 复用 consumeInvokingRequestId 工具函数，把通用处理留在 ../../utils/agentContext.js 中维护。
import { consumeInvokingRequestId } from '../../utils/agentContext.js'
// 整理这一组导入，让API 服务 logging后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 引入 sanitizeToolNameForAnalytics，将 ../analytics/metadata.js 中已经封装好的能力接到本文件流程里。
import { sanitizeToolNameForAnalytics } from '../analytics/metadata.js'
// 引入 EMPTY_USAGE，将 ./emptyUsage.js 中已经封装好的能力接到本文件流程里。
import { EMPTY_USAGE } from './emptyUsage.js'
// 引入 classifyAPIError，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { classifyAPIError } from './errors.js'
// 引入 extractConnectionErrorDetails，将 ./errorUtils.js 中已经封装好的能力接到本文件流程里。
import { extractConnectionErrorDetails } from './errorUtils.js'

// 导出类型定义，让其他模块沿用API 服务 logging的数据契约。
export type { NonNullableUsage }
// 重新导出这一组成员，让API 服务 logging的公共 API 保持集中入口。
export { EMPTY_USAGE }

// Strategy used for global prompt caching
// GlobalCacheStrategy 固化API 服务 logging里传递的数据形状，帮助调用方按同一结构读写字段。
export type GlobalCacheStrategy = 'tool_based' | 'system_prompt' | 'none'

// getErrorMessage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getErrorMessage(error: unknown): string {
  // 满足 `error instanceof APIError` 时，API 服务 logging执行该分支。
  if (error instanceof APIError) {
    // 请求体保存`error.error as { error?: { message?: string } } | undefin...`，供后续判断或组装使用。
    const body = error.error as { error?: { message?: string } } | undefined
    // 满足 `body?.error?.message` 时，API 服务 logging执行该分支。
    if (body?.error?.message) return body.error.message
  }
  // 返回 `error instanceof Error ? error.message : String(error)`，作为API 服务 logging这次计算的结果。
  return error instanceof Error ? error.message : String(error)
}

// KnownGateway 固化API 服务 logging里传递的数据形状，帮助调用方按同一结构读写字段。
type KnownGateway =
  | 'litellm'
  | 'helicone'
  | 'portkey'
  | 'cloudflare-ai-gateway'
  | 'kong'
  | 'braintrust'
  | 'databricks'

// Gateway fingerprints for detecting AI gateways from response headers
// GATEWAY_FINGERPRINTS 集合 先占位，稍后的条件分支会根据实际输入补齐它。
const GATEWAY_FINGERPRINTS: Partial<
  Record<KnownGateway, { prefixes: string[] }>
> = {
  // https://docs.litellm.ai/docs/proxy/response_headers
  litellm: {
    prefixes: ['x-litellm-'],
  },
  // https://docs.helicone.ai/helicone-headers/header-directory
  helicone: {
    prefixes: ['helicone-'],
  },
  // https://portkey.ai/docs/api-reference/response-schema
  portkey: {
    prefixes: ['x-portkey-'],
  },
  // https://developers.cloudflare.com/ai-gateway/evaluations/add-human-feedback-api/
  'cloudflare-ai-gateway': {
    prefixes: ['cf-aig-'],
  },
  // https://developer.konghq.com/ai-gateway/ — X-Kong-Upstream-Latency, X-Kong-Proxy-Latency
  kong: {
    prefixes: ['x-kong-'],
  },
  // https://www.braintrust.dev/docs/guides/proxy — x-bt-used-endpoint, x-bt-cached
  braintrust: {
    prefixes: ['x-bt-'],
  },
}

// Gateways that use provider-owned domains (not self-hosted), so the
// ANTHROPIC_BASE_URL hostname is a reliable signal even without a
// distinctive response header.
// GATEWAY_HOST_SUFFIXES 集合 集中保存API 服务 logging要一起传递的字段。
const GATEWAY_HOST_SUFFIXES: Partial<Record<KnownGateway, string[]>> = {
  // https://docs.databricks.com/aws/en/ai-gateway/
  databricks: [
    '.cloud.databricks.com',
    '.azuredatabricks.net',
    '.gcp.databricks.com',
  ],
}

// detectGateway 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function detectGateway({
  headers,
  baseUrl,
}: {
  headers?: globalThis.Headers
  baseUrl?: string
}): KnownGateway | undefined {
  // 满足 `headers` 时，API 服务 logging执行该分支。
  if (headers) {
    // Header names are already lowercase from the Headers API
    // headerNames 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
    const headerNames: string[] = []
    // 调用 headers.forEach，触发API 服务 logging此处需要的副作用。
    headers.forEach((_, key) => headerNames.push(key))
    // 循环处理 `const [gw, { prefixes }] of Object.entries(GATEWAY_FINGERPRINTS)`，让API 服务 logging把同类条目按顺序走完。
    for (const [gw, { prefixes }] of Object.entries(GATEWAY_FINGERPRINTS)) {
      // 满足 `prefixes.some(p => headerNames.some(h => h.startsWith(p)))` 时，API 服务 logging执行该分支。
      if (prefixes.some(p => headerNames.some(h => h.startsWith(p)))) {
        // 返回 `gw as KnownGateway`，作为API 服务 logging这次计算的结果。
        return gw as KnownGateway
      }
    }
  }

  // 满足 `baseUrl` 时，API 服务 logging执行该分支。
  if (baseUrl) {
    // 保护这一段可能失败的API 服务 logging操作，确保异常能进入相邻错误处理。
    try {
      // host保存`URL`，供API 服务 logging后续处理使用。
      const host = new URL(baseUrl).hostname.toLowerCase()
      // 循环处理 `const [gw, suffixes] of Object.entries(GATEWAY_HOST_SUFFIXES)`，让API 服务 logging把同类条目按顺序走完。
      for (const [gw, suffixes] of Object.entries(GATEWAY_HOST_SUFFIXES)) {
        // 满足 `suffixes.some(s => host.endsWith(s))` 时，API 服务 logging执行该分支。
        if (suffixes.some(s => host.endsWith(s))) {
          // 返回 `gw as KnownGateway`，作为API 服务 logging这次计算的结果。
          return gw as KnownGateway
        }
      }
    } catch {
      // malformed URL — ignore
    }
  }

  // 返回 `undefined`，作为API 服务 logging这次计算的结果。
  return undefined
}

// getAnthropicEnvMetadata 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getAnthropicEnvMetadata() {
  // 返回结构化结果，集中表达API 服务 logging已经整理出的状态。
  return {
    ...(process.env.ANTHROPIC_BASE_URL
      ? {
          baseUrl: process.env
            .ANTHROPIC_BASE_URL as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(process.env.ANTHROPIC_MODEL
      ? {
          envModel: process.env
            .ANTHROPIC_MODEL as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(process.env.ANTHROPIC_SMALL_FAST_MODEL
      ? {
          envSmallFastModel: process.env
            .ANTHROPIC_SMALL_FAST_MODEL as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
  }
}

// getBuildAgeMinutes 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getBuildAgeMinutes(): number | undefined {
  // MACRO.BUILD_TIME缺失时提前走兜底路径，避免API 服务 logging继续依赖无效输入。
  if (!MACRO.BUILD_TIME) return undefined
  // buildTime记录时间`Date`，供API 服务 logging后续处理使用。
  const buildTime = new Date(MACRO.BUILD_TIME).getTime()
  // 满足 `isNaN(buildTime)` 时，API 服务 logging执行该分支。
  if (isNaN(buildTime)) return undefined
  // 返回 `Math.floor((Date.now() - buildTime) / 60000)`，作为API 服务 logging这次计算的结果。
  return Math.floor((Date.now() - buildTime) / 60000)
}

// logAPIQuery 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logAPIQuery({
  model,
  messagesLength,
  temperature,
  betas,
  permissionMode,
  querySource,
  queryTracking,
  thinkingType,
  effortValue,
  fastMode,
  previousRequestId,
}: {
  model: string
  messagesLength: number
  temperature: number
  betas?: string[]
  permissionMode?: PermissionMode
  querySource: string
  queryTracking?: QueryChainTracking
  thinkingType?: 'adaptive' | 'enabled' | 'disabled'
  effortValue?: EffortLevel | null
  fastMode?: boolean
  previousRequestId?: string | null
}): void {
  // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_query', {
    model: model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    messagesLength,
    temperature: temperature,
    provider: getAPIProviderForStatsig(),
    buildAgeMins: getBuildAgeMinutes(),
    ...(betas?.length
      ? {
          betas: betas.join(
            ',',
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    permissionMode:
      permissionMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    querySource:
      querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(queryTracking
      ? {
          queryChainId:
            queryTracking.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: queryTracking.depth,
        }
      : {}),
    thinkingType:
      thinkingType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    effortValue:
      effortValue as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    fastMode,
    ...(previousRequestId
      ? {
          previousRequestId:
            previousRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...getAnthropicEnvMetadata(),
  })
}

// logAPIError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logAPIError({
  error,
  model,
  messageCount,
  messageTokens,
  durationMs,
  durationMsIncludingRetries,
  attempt,
  requestId,
  clientRequestId,
  didFallBackToNonStreaming,
  promptCategory,
  headers,
  queryTracking,
  querySource,
  llmSpan,
  fastMode,
  previousRequestId,
}: {
  error: unknown
  model: string
  messageCount: number
  messageTokens?: number
  durationMs: number
  durationMsIncludingRetries: number
  attempt: number
  requestId?: string | null
  /** Client-generated ID sent as x-client-request-id header (survives timeouts) */
  clientRequestId?: string
  didFallBackToNonStreaming?: boolean
  promptCategory?: string
  headers?: globalThis.Headers
  queryTracking?: QueryChainTracking
  querySource?: string
  /** The span from startLLMRequestSpan - pass this to correctly match responses to requests */
  llmSpan?: Span
  fastMode?: boolean
  previousRequestId?: string | null
}): void {
  // gateway读取`detectGateway`，供API 服务 logging后续处理使用。
  const gateway = detectGateway({
    headers:
      error instanceof APIError && error.headers ? error.headers : headers,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  })

  // errStr读取`getErrorMessage`，供API 服务 logging后续处理使用。
  const errStr = getErrorMessage(error)
  // status 集合保存`String`，供API 服务 logging后续处理使用。
  const status = error instanceof APIError ? String(error.status) : undefined
  // errorType 错误信息保存`classifyAPIError`，供API 服务 logging后续处理使用。
  const errorType = classifyAPIError(error)

  // Log detailed connection error info to debug logs (visible via --debug)
  // connectionDetails 集合保存`extractConnectionErrorDetails`，供API 服务 logging后续处理使用。
  const connectionDetails = extractConnectionErrorDetails(error)
  // 满足 `connectionDetails` 时，API 服务 logging执行该分支。
  if (connectionDetails) {
    // sslLabel保存`connectionDetails.isSSLError ? ' (SSL error)' : ''`，供后续判断或组装使用。
    const sslLabel = connectionDetails.isSSLError ? ' (SSL error)' : ''
    // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Connection error details: code=${connectionDetails.code}${sslLabel}, message=${connectionDetails.message}`,
      { level: 'error' },
    )
  }

  // invocation保存`consumeInvokingRequestId`，供API 服务 logging后续处理使用。
  const invocation = consumeInvokingRequestId()

  // 满足 `clientRequestId` 时，API 服务 logging执行该分支。
  if (clientRequestId) {
    // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `API error x-client-request-id=${clientRequestId} (give this to the API team for server-log lookup)`,
      { level: 'error' },
    )
  }

  // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
  logError(error as Error)
  // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_error', {
    model: model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    error: errStr as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    status:
      status as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    errorType:
      errorType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    messageCount,
    messageTokens,
    durationMs,
    durationMsIncludingRetries,
    attempt,
    provider: getAPIProviderForStatsig(),
    requestId:
      (requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS) ||
      undefined,
    ...(invocation
      ? {
          invokingRequestId:
            invocation.invokingRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          invocationKind:
            invocation.invocationKind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    clientRequestId:
      (clientRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS) ||
      undefined,
    didFallBackToNonStreaming,
    ...(promptCategory
      ? {
          promptCategory:
            promptCategory as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(gateway
      ? {
          gateway:
            gateway as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(queryTracking
      ? {
          queryChainId:
            queryTracking.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: queryTracking.depth,
        }
      : {}),
    ...(querySource
      ? {
          querySource:
            querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    fastMode,
    ...(previousRequestId
      ? {
          previousRequestId:
            previousRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...getAnthropicEnvMetadata(),
  })

  // Log API error event for OTLP
  // 显式忽略 `logOTelEvent('api_error', {` 的返回值，只保留它触发的副作用。
  void logOTelEvent('api_error', {
    model: model,
    error: errStr,
    status_code: String(status),
    duration_ms: String(durationMs),
    attempt: String(attempt),
    speed: fastMode ? 'fast' : 'normal',
  })

  // Pass the span to correctly match responses to requests when beta tracing is enabled
  // 调用 endLLMRequestSpan，触发API 服务 logging此处需要的副作用。
  endLLMRequestSpan(llmSpan, {
    success: false,
    statusCode: status ? parseInt(status) : undefined,
    error: errStr,
    attempt,
  })

  // Log first error for teleported sessions (reliability tracking)
  // teleportInfo读取`getTeleportedSessionInfo`，供API 服务 logging后续处理使用。
  const teleportInfo = getTeleportedSessionInfo()
  // 组合条件 `teleportInfo?.isTeleported && !teleportInfo.hasLo` 成立时，API 服务 logging才启用这条专门路径。
  if (teleportInfo?.isTeleported && !teleportInfo.hasLoggedFirstMessage) {
    // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_teleport_first_message_error', {
      session_id:
        teleportInfo.sessionId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      error_type:
        errorType as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 调用 markFirstTeleportMessageLogged，触发API 服务 logging此处需要的副作用。
    markFirstTeleportMessageLogged()
  }
}

// logAPISuccess 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function logAPISuccess({
  model,
  preNormalizedModel,
  messageCount,
  messageTokens,
  usage,
  durationMs,
  durationMsIncludingRetries,
  attempt,
  ttftMs,
  requestId,
  stopReason,
  costUSD,
  didFallBackToNonStreaming,
  querySource,
  gateway,
  queryTracking,
  permissionMode,
  globalCacheStrategy,
  textContentLength,
  thinkingContentLength,
  toolUseContentLengths,
  connectorTextBlockCount,
  fastMode,
  previousRequestId,
  betas,
}: {
  model: string
  preNormalizedModel: string
  messageCount: number
  messageTokens: number
  usage: Usage
  durationMs: number
  durationMsIncludingRetries: number
  attempt: number
  ttftMs: number | null
  requestId: string | null
  stopReason: BetaStopReason | null
  costUSD: number
  didFallBackToNonStreaming: boolean
  querySource: string
  gateway?: KnownGateway
  queryTracking?: QueryChainTracking
  permissionMode?: PermissionMode
  globalCacheStrategy?: GlobalCacheStrategy
  textContentLength?: number
  thinkingContentLength?: number
  toolUseContentLengths?: Record<string, number>
  connectorTextBlockCount?: number
  fastMode?: boolean
  previousRequestId?: string | null
  betas?: string[]
}): void {
  // isNonInteractiveSession 会话数据记录 `getIsNonInteractiveSession` 是否成立，API 服务 logging随后按该结果分支。
  const isNonInteractiveSession = getIsNonInteractiveSession()
  // isPostCompaction记录 `consumePostCompaction` 是否成立，API 服务 logging随后按该结果分支。
  const isPostCompaction = consumePostCompaction()
  // hasPrintFlag 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const hasPrintFlag =
    process.argv.includes('-p') || process.argv.includes('--print')

  // now记录时间`Date.now`，供API 服务 logging后续处理使用。
  const now = Date.now()
  // lastCompletion读取`getLastApiCompletionTimestamp`，供API 服务 logging后续处理使用。
  const lastCompletion = getLastApiCompletionTimestamp()
  // timeSinceLastApiCallMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const timeSinceLastApiCallMs =
    lastCompletion !== null ? now - lastCompletion : undefined

  // invocation保存`consumeInvokingRequestId`，供API 服务 logging后续处理使用。
  const invocation = consumeInvokingRequestId()

  // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_success', {
    model: model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(preNormalizedModel !== model
      ? {
          preNormalizedModel:
            preNormalizedModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(betas?.length
      ? {
          betas: betas.join(
            ',',
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    messageCount,
    messageTokens,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cachedInputTokens: usage.cache_read_input_tokens ?? 0,
    uncachedInputTokens: usage.cache_creation_input_tokens ?? 0,
    durationMs: durationMs,
    durationMsIncludingRetries: durationMsIncludingRetries,
    attempt: attempt,
    ttftMs: ttftMs ?? undefined,
    buildAgeMins: getBuildAgeMinutes(),
    provider: getAPIProviderForStatsig(),
    requestId:
      (requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS) ??
      undefined,
    ...(invocation
      ? {
          invokingRequestId:
            invocation.invokingRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          invocationKind:
            invocation.invocationKind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    stop_reason:
      (stopReason as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS) ??
      undefined,
    costUSD,
    didFallBackToNonStreaming,
    isNonInteractiveSession,
    print: hasPrintFlag,
    isTTY: process.stdout.isTTY ?? false,
    querySource:
      querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(gateway
      ? {
          gateway:
            gateway as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(queryTracking
      ? {
          queryChainId:
            queryTracking.chainId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          queryDepth: queryTracking.depth,
        }
      : {}),
    permissionMode:
      permissionMode as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    ...(globalCacheStrategy
      ? {
          globalCacheStrategy:
            globalCacheStrategy as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(textContentLength !== undefined
      ? ({
          textContentLength,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
      : {}),
    ...(thinkingContentLength !== undefined
      ? ({
          thinkingContentLength,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
      : {}),
    ...(toolUseContentLengths !== undefined
      ? ({
          toolUseContentLengths: jsonStringify(
            toolUseContentLengths,
          ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
      : {}),
    ...(connectorTextBlockCount !== undefined
      ? ({
          connectorTextBlockCount,
        } as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
      : {}),
    fastMode,
    // Log cache_deleted_input_tokens for cache editing analysis. Casts needed
    // because the field is intentionally not on NonNullableUsage (excluded from
    // external builds). Set by updateUsage() when cache editing is active.
    ...(feature('CACHED_MICROCOMPACT') &&
    ((usage as unknown as { cache_deleted_input_tokens?: number })
      .cache_deleted_input_tokens ?? 0) > 0
      ? {
          cacheDeletedInputTokens: (
            usage as unknown as { cache_deleted_input_tokens: number }
          ).cache_deleted_input_tokens,
        }
      : {}),
    ...(previousRequestId
      ? {
          previousRequestId:
            previousRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        }
      : {}),
    ...(isPostCompaction ? { isPostCompaction } : {}),
    ...getAnthropicEnvMetadata(),
    timeSinceLastApiCallMs,
  })

  // setLastApiCompletionTimestamp 写入新的状态值，使API 服务 logging后续读取保持一致。
  setLastApiCompletionTimestamp(now)
}

// logAPISuccessAndDuration 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function logAPISuccessAndDuration({
  model,
  preNormalizedModel,
  start,
  startIncludingRetries,
  ttftMs,
  usage,
  attempt,
  messageCount,
  messageTokens,
  requestId,
  stopReason,
  didFallBackToNonStreaming,
  querySource,
  headers,
  costUSD,
  queryTracking,
  permissionMode,
  newMessages,
  llmSpan,
  globalCacheStrategy,
  requestSetupMs,
  attemptStartTimes,
  fastMode,
  previousRequestId,
  betas,
}: {
  model: string
  preNormalizedModel: string
  start: number
  startIncludingRetries: number
  ttftMs: number | null
  usage: NonNullableUsage
  attempt: number
  messageCount: number
  messageTokens: number
  requestId: string | null
  stopReason: BetaStopReason | null
  didFallBackToNonStreaming: boolean
  querySource: string
  headers?: globalThis.Headers
  costUSD: number
  queryTracking?: QueryChainTracking
  permissionMode?: PermissionMode
  /** Assistant messages from the response - used to extract model_output and thinking_output
   *  when beta tracing is enabled */
  newMessages?: AssistantMessage[]
  /** The span from startLLMRequestSpan - pass this to correctly match responses to requests */
  llmSpan?: Span
  /** Strategy used for global prompt caching: 'tool_based', 'system_prompt', or 'none' */
  globalCacheStrategy?: GlobalCacheStrategy
  /** Time spent in pre-request setup before the successful attempt */
  requestSetupMs?: number
  /** Timestamps (Date.now()) of each attempt start — used for retry sub-spans in Perfetto */
  attemptStartTimes?: number[]
  fastMode?: boolean
  /** Request ID from the previous API call in this session */
  previousRequestId?: string | null
  betas?: string[]
}): void {
  // gateway读取`detectGateway`，供API 服务 logging后续处理使用。
  const gateway = detectGateway({
    headers,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
  })

  // textContentLength 数量 先占位，稍后的条件分支会根据实际输入补齐它。
  let textContentLength: number | undefined
  // thinkingContentLength 数量 先占位，稍后的条件分支会根据实际输入补齐它。
  let thinkingContentLength: number | undefined
  // toolUseContentLengths 数量 先占位，稍后的条件分支会根据实际输入补齐它。
  let toolUseContentLengths: Record<string, number> | undefined
  // connectorTextBlockCount 数量 先占位，稍后的条件分支会根据实际输入补齐它。
  let connectorTextBlockCount: number | undefined

  // 满足 `newMessages` 时，API 服务 logging执行该分支。
  if (newMessages) {
    // textLen 命名 `0`，让后续代码直接表达这个值的用途。
    let textLen = 0
    // thinkingLen保存`0`，供后续判断或组装使用。
    let thinkingLen = 0
    // hasToolUse标记API 服务 logging是否启用对应路径。
    let hasToolUse = false
    // toolLengths 数量 从空对象开始收集键值，后续按名称补齐内容。
    const toolLengths: Record<string, number> = {}
    // connectorCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
    let connectorCount = 0

    // 按顺序遍历 `newMessages` 中的消息，逐个交给API 服务 logging处理。
    for (const msg of newMessages) {
      // 按顺序遍历 `msg.message.content` 中的block，逐个交给API 服务 logging处理。
      for (const block of msg.message.content) {
        // 当 `block.type` 匹配 `'text'` 时，API 服务 logging执行对应分支。
        if (block.type === 'text') {
          // API 服务 logging在这里处理 `textLen += block.text.length`，完成这一小步状态转换。
          textLen += block.text.length
        // API 服务 logging在这里处理 `} else if (feature('CONNECTOR_TEXT') && isConnectorTextBlock(block)) {`，完成这一小步状态转换。
        } else if (feature('CONNECTOR_TEXT') && isConnectorTextBlock(block)) {
          // API 服务 logging在这里处理 `connectorCount++`，完成这一小步状态转换。
          connectorCount++
        // API 服务 logging在这里处理 `} else if (block.type === 'thinking') {`，完成这一小步状态转换。
        } else if (block.type === 'thinking') {
          // API 服务 logging在这里处理 `thinkingLen += block.thinking.length`，完成这一小步状态转换。
          thinkingLen += block.thinking.length
        // API 服务 logging在这里处理 `} else if (`，完成这一小步状态转换。
        } else if (
          block.type === 'tool_use' ||
          block.type === 'server_tool_use' ||
          block.type === 'mcp_tool_use'
        ) {
          // inputLen保存`jsonStringify`，供API 服务 logging后续处理使用。
          const inputLen = jsonStringify(block.input).length
          // sanitizedName保存`sanitizeToolNameForAnalytics`，供API 服务 logging后续处理使用。
          const sanitizedName = sanitizeToolNameForAnalytics(block.name)
          // API 服务 logging在这里处理 `toolLengths[sanitizedName] =`，完成这一小步状态转换。
          toolLengths[sanitizedName] =
            (toolLengths[sanitizedName] ?? 0) + inputLen
          // hasToolUse更新为 `true`，确保API 服务后续读取最新状态。
          hasToolUse = true
        }
      }
    }

    // textContentLength 数量更新为 `textLen`，确保API 服务后续读取最新状态。
    textContentLength = textLen
    // thinkingContentLength 数量更新为 `thinkingLen > 0 ? thinkingLen : undefined`，确保API 服务后续读取最新状态。
    thinkingContentLength = thinkingLen > 0 ? thinkingLen : undefined
    // toolUseContentLengths 数量更新为 `hasToolUse ? toolLengths : undefined`，确保API 服务后续读取最新状态。
    toolUseContentLengths = hasToolUse ? toolLengths : undefined
    // connectorTextBlockCount 数量更新为 `connectorCount > 0 ? connectorCount : undefined`，确保API 服务后续读取最新状态。
    connectorTextBlockCount = connectorCount > 0 ? connectorCount : undefined
  }

  // durationMs 集合记录时间`Date.now`，供API 服务 logging后续处理使用。
  const durationMs = Date.now() - start
  // durationMsIncludingRetries 集合记录时间`Date.now`，供API 服务 logging后续处理使用。
  const durationMsIncludingRetries = Date.now() - startIncludingRetries
  // 调用 addToTotalDurationState，触发API 服务 logging此处需要的副作用。
  addToTotalDurationState(durationMsIncludingRetries, durationMs)

  // 调用 logAPISuccess，触发API 服务 logging此处需要的副作用。
  logAPISuccess({
    model,
    preNormalizedModel,
    messageCount,
    messageTokens,
    usage,
    durationMs,
    durationMsIncludingRetries,
    attempt,
    ttftMs,
    requestId,
    stopReason,
    costUSD,
    didFallBackToNonStreaming,
    querySource,
    gateway,
    queryTracking,
    permissionMode,
    globalCacheStrategy,
    textContentLength,
    thinkingContentLength,
    toolUseContentLengths,
    connectorTextBlockCount,
    fastMode,
    previousRequestId,
    betas,
  })
  // Log API request event for OTLP
  // 显式忽略 `logOTelEvent('api_request', {` 的返回值，只保留它触发的副作用。
  void logOTelEvent('api_request', {
    model,
    input_tokens: String(usage.input_tokens),
    output_tokens: String(usage.output_tokens),
    cache_read_tokens: String(usage.cache_read_input_tokens),
    cache_creation_tokens: String(usage.cache_creation_input_tokens),
    cost_usd: String(costUSD),
    duration_ms: String(durationMs),
    speed: fastMode ? 'fast' : 'normal',
  })

  // Extract model output, thinking output, and tool call flag when beta tracing is enabled
  // modelOutput 先占位，稍后的条件分支会根据实际输入补齐它。
  let modelOutput: string | undefined
  // thinkingOutput 先占位，稍后的条件分支会根据实际输入补齐它。
  let thinkingOutput: string | undefined
  // hasToolCall 先占位，稍后的条件分支会根据实际输入补齐它。
  let hasToolCall: boolean | undefined

  // 组合条件 `isBetaTracingEnabled() && newMessages` 成立时，API 服务 logging才启用这条专门路径。
  if (isBetaTracingEnabled() && newMessages) {
    // Model output - visible to all users
    // API 服务 logging在这里处理 `modelOutput =`，完成这一小步状态转换。
    modelOutput =
      newMessages
        // 链式调用 flatMap，继续加工上一行在API 服务 logging中产生的数据。
        .flatMap(m =>
          m.message.content
            // 链式调用 filter，继续加工上一行在API 服务 logging中产生的数据。
            .filter(c => c.type === 'text')
            // 链式调用 map，继续加工上一行在API 服务 logging中产生的数据。
            .map(c => (c as { type: 'text'; text: string }).text),
        )
        .join('\n') || undefined

    // Thinking output - Ant-only (build-time gated)
    // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，API 服务 logging执行对应分支。
    if (process.env.USER_TYPE === 'ant') {
      // API 服务 logging在这里处理 `thinkingOutput =`，完成这一小步状态转换。
      thinkingOutput =
        newMessages
          // 链式调用 flatMap，继续加工上一行在API 服务 logging中产生的数据。
          .flatMap(m =>
            m.message.content
              // 链式调用 filter，继续加工上一行在API 服务 logging中产生的数据。
              .filter(c => c.type === 'thinking')
              // 链式调用 map，继续加工上一行在API 服务 logging中产生的数据。
              .map(c => (c as { type: 'thinking'; thinking: string }).thinking),
          )
          .join('\n') || undefined
    }

    // Check if any tool_use blocks were in the output
    // hasToolCall更新为 `newMessages.some(m =>`，确保API 服务后续读取最新状态。
    hasToolCall = newMessages.some(m =>
      // 调用 m.message.content.some，触发API 服务 logging此处需要的副作用。
      m.message.content.some(c => c.type === 'tool_use'),
    )
  }

  // Pass the span to correctly match responses to requests when beta tracing is enabled
  // 调用 endLLMRequestSpan，触发API 服务 logging此处需要的副作用。
  endLLMRequestSpan(llmSpan, {
    success: true,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheReadTokens: usage.cache_read_input_tokens,
    cacheCreationTokens: usage.cache_creation_input_tokens,
    attempt,
    modelOutput,
    thinkingOutput,
    hasToolCall,
    ttftMs: ttftMs ?? undefined,
    requestSetupMs,
    attemptStartTimes,
  })

  // Log first successful message for teleported sessions (reliability tracking)
  // teleportInfo读取`getTeleportedSessionInfo`，供API 服务 logging后续处理使用。
  const teleportInfo = getTeleportedSessionInfo()
  // 组合条件 `teleportInfo?.isTeleported && !teleportInfo.hasLo` 成立时，API 服务 logging才启用这条专门路径。
  if (teleportInfo?.isTeleported && !teleportInfo.hasLoggedFirstMessage) {
    // 记录API 服务 logging运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_teleport_first_message_success', {
      session_id:
        teleportInfo.sessionId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    })
    // 调用 markFirstTeleportMessageLogged，触发API 服务 logging此处需要的副作用。
    markFirstTeleportMessageLogged()
  }
}
