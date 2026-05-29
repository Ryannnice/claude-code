// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 Anthropic 来自 @anthropic-ai/sdk，用于校准API 服务 with Retry的数据契约。
import type Anthropic from '@anthropic-ai/sdk'
// 整理这一组导入，让API 服务 with Retry后续逻辑可以直接复用这些外部能力。
import {
  APIConnectionError,
  APIError,
  APIUserAbortError,
} from '@anthropic-ai/sdk'
// 类型依赖 { QuerySource } 来自 src/constants/querySource.js，用于校准API 服务 with Retry的数据契约。
import type { QuerySource } from 'src/constants/querySource.js'
// 类型依赖 { SystemAPIErrorMessage } 来自 src/types/message.js，用于校准API 服务 with Retry的数据契约。
import type { SystemAPIErrorMessage } from 'src/types/message.js'
// 复用 isAwsCredentialsProviderError 工具函数，把通用处理留在 src/utils/aws.js 中维护。
import { isAwsCredentialsProviderError } from 'src/utils/aws.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 logError 工具函数，把通用处理留在 src/utils/log.js 中维护。
import { logError } from 'src/utils/log.js'
// 复用 createSystemAPIErrorMessage 工具函数，把通用处理留在 src/utils/messages.js 中维护。
import { createSystemAPIErrorMessage } from 'src/utils/messages.js'
// 复用 getAPIProviderForStatsig 工具函数，把通用处理留在 src/utils/model/providers.js 中维护。
import { getAPIProviderForStatsig } from 'src/utils/model/providers.js'
// 整理这一组导入，让API 服务 with Retry后续逻辑可以直接复用这些外部能力。
import {
  clearApiKeyHelperCache,
  clearAwsCredentialsCache,
  clearGcpCredentialsCache,
  getClaudeAIOAuthTokens,
  handleOAuth401Error,
  isClaudeAISubscriber,
  isEnterpriseSubscriber,
} from '../../utils/auth.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 整理这一组导入，让API 服务 with Retry后续逻辑可以直接复用这些外部能力。
import {
  type CooldownReason,
  handleFastModeOverageRejection,
  handleFastModeRejectedByAPI,
  isFastModeCooldown,
  isFastModeEnabled,
  triggerFastModeCooldown,
} from '../../utils/fastMode.js'
// 复用 isNonCustomOpusModel 工具函数，把通用处理留在 ../../utils/model/model.js 中维护。
import { isNonCustomOpusModel } from '../../utils/model/model.js'
// 复用 disableKeepAlive 工具函数，把通用处理留在 ../../utils/proxy.js 中维护。
import { disableKeepAlive } from '../../utils/proxy.js'
// 复用 sleep 工具函数，把通用处理留在 ../../utils/sleep.js 中维护。
import { sleep } from '../../utils/sleep.js'
// 类型依赖 { ThinkingConfig } 来自 ../../utils/thinking.js，用于校准API 服务 with Retry的数据契约。
import type { ThinkingConfig } from '../../utils/thinking.js'
// 引入 getFeatureValue_CACHED_MAY_BE_STALE，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../analytics/growthbook.js'
// 整理这一组导入，让API 服务 with Retry后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让API 服务 with Retry后续逻辑可以直接复用这些外部能力。
import {
  checkMockRateLimitError,
  isMockRateLimitError,
} from '../rateLimitMocking.js'
// 引入 REPEATED_529_ERROR_MESSAGE，将 ./errors.js 中已经封装好的能力接到本文件流程里。
import { REPEATED_529_ERROR_MESSAGE } from './errors.js'
// 引入 extractConnectionErrorDetails，将 ./errorUtils.js 中已经封装好的能力接到本文件流程里。
import { extractConnectionErrorDetails } from './errorUtils.js'

// abortError 错误信息保存`APIUserAbortError`，供API 服务 with Retry后续处理使用。
const abortError = () => new APIUserAbortError()

// DEFAULT_MAX_RETRIES 集合保存`10`，供API 服务 with Retry后续判断或输出使用。
const DEFAULT_MAX_RETRIES = 10
// FLOOR_OUTPUT_TOKENS 集合保存`3000`，供后续判断或组装使用。
const FLOOR_OUTPUT_TOKENS = 3000
// MAX_529_RETRIES 集合 命名 `3`，让后续代码直接表达这个值的用途。
const MAX_529_RETRIES = 3
// BASE_DELAY_MS 集合 命名 `500`，让后续代码直接表达这个值的用途。
export const BASE_DELAY_MS = 500

// Foreground query sources where the user IS blocking on the result — these
// retry on 529. Everything else (summaries, titles, suggestions, classifiers)
// bails immediately: during a capacity cascade each retry is 3-10× gateway
// amplification, and the user never sees those fail anyway. New sources
// default to no-retry — add here only if the user is waiting on the result.
// FOREGROUND_529_RETRY_SOURCES 集合构建`new Set<QuerySource>([` 整理出中间结果，供API 服务 with Retry后续步骤使用。
const FOREGROUND_529_RETRY_SOURCES = new Set<QuerySource>([
  'repl_main_thread',
  'repl_main_thread:outputStyle:custom',
  'repl_main_thread:outputStyle:Explanatory',
  'repl_main_thread:outputStyle:Learning',
  'sdk',
  'agent:custom',
  'agent:default',
  'agent:builtin',
  'compact',
  'hook_agent',
  'hook_prompt',
  'verification_agent',
  'side_question',
  // Security classifiers — must complete for auto-mode correctness.
  // yoloClassifier.ts uses 'auto_mode' (not 'yolo_classifier' — that's
  // type-only). bash_classifier is ant-only; feature-gate so the string
  // tree-shakes out of external builds (excluded-strings.txt).
  'auto_mode',
  ...(feature('BASH_CLASSIFIER') ? (['bash_classifier'] as const) : []),
])

// shouldRetry529 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldRetry529(querySource: QuerySource | undefined): boolean {
  // undefined → retry (conservative for untagged call paths)
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    querySource === undefined || FOREGROUND_529_RETRY_SOURCES.has(querySource)
  )
}

// CLAUDE_CODE_UNATTENDED_RETRY: for unattended sessions (ant-only). Retries 429/529
// indefinitely with higher backoff and periodic keep-alive yields so the host
// environment does not mark the session idle mid-wait.
// TODO(ANT-344): the keep-alive via SystemAPIErrorMessage yields is a stopgap
// until there's a dedicated keep-alive channel.
// PERSISTENT_MAX_BACKOFF_MS 集合 命名 `5 * 60 * 1000`，让后续代码直接表达这个值的用途。
const PERSISTENT_MAX_BACKOFF_MS = 5 * 60 * 1000
// PERSISTENT_RESET_CAP_MS 集合保存`6 * 60 * 60 * 1000`，供API 服务 with Retry后续判断或输出使用。
const PERSISTENT_RESET_CAP_MS = 6 * 60 * 60 * 1000
// HEARTBEAT_INTERVAL_MS 集合保存`30_000`，供后续判断或组装使用。
const HEARTBEAT_INTERVAL_MS = 30_000

// isPersistentRetryEnabled 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isPersistentRetryEnabled(): boolean {
  // 返回 `feature('UNATTENDED_RETRY')`，作为API 服务 with Retry这次计算的结果。
  return feature('UNATTENDED_RETRY')
    ? isEnvTruthy(process.env.CLAUDE_CODE_UNATTENDED_RETRY)
    : false
}

// isTransientCapacityError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isTransientCapacityError(error: unknown): boolean {
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    is529Error(error) || (error instanceof APIError && error.status === 429)
  )
}

// isStaleConnectionError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isStaleConnectionError(error: unknown): boolean {
  // 满足 `!(error instanceof APIConnectionError)` 时，API 服务 with Retry执行该分支。
  if (!(error instanceof APIConnectionError)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // details 集合保存`extractConnectionErrorDetails`，供API 服务 with Retry后续处理使用。
  const details = extractConnectionErrorDetails(error)
  // 返回 `details?.code === 'ECONNRESET' || details?.code === 'EPIPE'`，作为API 服务 with Retry这次计算的结果。
  return details?.code === 'ECONNRESET' || details?.code === 'EPIPE'
}

// RetryContext 描述API 服务 with Retry需要实现的字段和回调，避免跨模块交互时契约漂移。
export interface RetryContext {
  maxTokensOverride?: number
  model: string
  thinkingConfig: ThinkingConfig
  fastMode?: boolean
}

// RetryOptions 描述API 服务 with Retry需要实现的字段和回调，避免跨模块交互时契约漂移。
interface RetryOptions {
  maxRetries?: number
  model: string
  fallbackModel?: string
  thinkingConfig: ThinkingConfig
  fastMode?: boolean
  signal?: AbortSignal
  querySource?: QuerySource
  /**
   * Pre-seed the consecutive 529 counter. Used when this retry loop is a
   * non-streaming fallback after a streaming 529 — the streaming 529 should
   * count toward MAX_529_RETRIES so total 529s-before-fallback is consistent
   * regardless of which request mode hit the overload.
   */
  initialConsecutive529Errors?: number
}

// CannotRetryError 聚合API 服务 with Retry相关状态与操作，把同一职责的行为收束到类实例中。
export class CannotRetryError extends Error {
  constructor(
    public readonly originalError: unknown,
    public readonly retryContext: RetryContext,
  ) {
    // 消息保存`errorMessage`，供API 服务 with Retry后续处理使用。
    const message = errorMessage(originalError)
    // 调用 super，触发API 服务 with Retry此处需要的副作用。
    super(message)
    // 更新实例字段 name 为 'RetryError'，同步API 服务 with Retry的内部状态。
    this.name = 'RetryError'

    // Preserve the original stack trace if available
    // 组合条件 `originalError instanceof Error && originalError.s` 成立时，API 服务 with Retry才启用这条专门路径。
    if (originalError instanceof Error && originalError.stack) {
      // 更新实例字段 stack 为 originalError.stack，同步API 服务 with Retry的内部状态。
      this.stack = originalError.stack
    }
  }
}

// FallbackTriggeredError 聚合API 服务 with Retry相关状态与操作，把同一职责的行为收束到类实例中。
export class FallbackTriggeredError extends Error {
  constructor(
    public readonly originalModel: string,
    public readonly fallbackModel: string,
  ) {
    // 调用 super，触发API 服务 with Retry此处需要的副作用。
    super(`Model fallback triggered: ${originalModel} -> ${fallbackModel}`)
    // 更新实例字段 name 为 'FallbackTriggeredError'，同步API 服务 with Retry的内部状态。
    this.name = 'FallbackTriggeredError'
  }
}

// API 服务 with Retry在这里处理 `export async function* withRetry<T>(`，完成这一小步状态转换。
export async function* withRetry<T>(
  // 这个回调绑定到 getClient: () => Promise<Anthropic>,，负责API 服务 with Retry在该局部场景下的响应。
  getClient: () => Promise<Anthropic>,
  // API 服务 with Retry在这里处理 `operation: (`，完成这一小步状态转换。
  operation: (
    client: Anthropic,
    attempt: number,
    context: RetryContext,
  ) => Promise<T>,
  options: RetryOptions,
): AsyncGenerator<SystemAPIErrorMessage, T> {
  // maxRetries 集合读取`getMaxRetries`，供API 服务 with Retry后续处理使用。
  const maxRetries = getMaxRetries(options)
  // retryContext 集中保存API 服务 with Retry要一起传递的字段。
  const retryContext: RetryContext = {
    model: options.model,
    thinkingConfig: options.thinkingConfig,
    ...(isFastModeEnabled() && { fastMode: options.fastMode }),
  }
  // API 客户端保存`null`，作为后续空值处理的输入。
  let client: Anthropic | null = null
  // consecutive529Errors 错误信息保存`options.initialConsecutive529Errors ?? 0`，供后续判断或组装使用。
  let consecutive529Errors = options.initialConsecutive529Errors ?? 0
  // lastError 错误信息 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastError: unknown
  // persistentAttempt保存`0`，供API 服务 with Retry后续判断或输出使用。
  let persistentAttempt = 0
  // 循环处理 `let attempt = 1; attempt <= maxRetries + 1; attem`，让API 服务 with Retry逐项把同类条目按顺序走完。
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    // 满足 `options.signal?.aborted` 时，API 服务 with Retry执行该分支。
    if (options.signal?.aborted) {
      // 抛出 new APIUserAbortError()，阻止API 服务 with Retry在无效状态下继续运行。
      throw new APIUserAbortError()
    }

    // Capture whether fast mode is active before this attempt
    // (fallback may change the state mid-loop)
    // wasFastModeActive保存`isFastModeEnabled`，供API 服务 with Retry后续处理使用。
    const wasFastModeActive = isFastModeEnabled()
      ? retryContext.fastMode && !isFastModeCooldown()
      : false

    // 保护这一段可能失败的API 服务 with Retry操作，确保异常能进入相邻错误处理。
    try {
      // Check for mock rate limits (used by /mock-limits command for Ant employees)
      // 当 `process.env.USER_TYPE` 匹配 `'ant'` 时，API 服务 with Retry执行对应分支。
      if (process.env.USER_TYPE === 'ant') {
        // mockError 错误信息读取`checkMockRateLimitError`，供API 服务 with Retry后续处理使用。
        const mockError = checkMockRateLimitError(
          retryContext.model,
          wasFastModeActive,
        )
        // 满足 `mockError` 时，API 服务 with Retry执行该分支。
        if (mockError) {
          // 抛出 mockError，阻止API 服务 with Retry在无效状态下继续运行。
          throw mockError
        }
      }

      // Get a fresh client instance on first attempt or after authentication errors
      // - 401 for first-party API authentication failures
      // - 403 "OAuth token has been revoked" (another process refreshed the token)
      // - Bedrock-specific auth errors (403 or CredentialsProviderError)
      // - Vertex-specific auth errors (credential refresh failures, 401)
      // - ECONNRESET/EPIPE: stale keep-alive socket; disable pooling and reconnect
      // isStaleConnection记录 `isStaleConnectionError` 是否成立，API 服务 with Retry随后按该结果分支。
      const isStaleConnection = isStaleConnectionError(lastError)
      // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
      if (
        isStaleConnection &&
        getFeatureValue_CACHED_MAY_BE_STALE(
          'tengu_disable_keepalive_on_econnreset',
          false,
        )
      ) {
        // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          'Stale connection (ECONNRESET/EPIPE) — disabling keep-alive for retry',
        )
        // 调用 disableKeepAlive，触发API 服务 with Retry此处需要的副作用。
        disableKeepAlive()
      }

      // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
      if (
        client === null ||
        (lastError instanceof APIError && lastError.status === 401) ||
        isOAuthTokenRevokedError(lastError) ||
        isBedrockAuthError(lastError) ||
        isVertexAuthError(lastError) ||
        isStaleConnection
      ) {
        // On 401 "token expired" or 403 "token revoked", force a token refresh
        // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
        if (
          (lastError instanceof APIError && lastError.status === 401) ||
          isOAuthTokenRevokedError(lastError)
        ) {
          // failedAccessToken读取`getClaudeAIOAuthTokens`，供API 服务 with Retry后续处理使用。
          const failedAccessToken = getClaudeAIOAuthTokens()?.accessToken
          // 满足 `failedAccessToken` 时，API 服务 with Retry执行该分支。
          if (failedAccessToken) {
            // 等待 `handleOAuth401Error(failedAccessToken)` 完成，再继续API 服务 with Retry的异步流程。
            await handleOAuth401Error(failedAccessToken)
          }
        }
        // API 客户端更新为 `await getClient()`，确保API 服务后续读取最新状态。
        client = await getClient()
      }

      // 等待并返回 `operation(client, attempt, retryContext)`，调用方直接接收异步结果。
      return await operation(client, attempt, retryContext)
    } catch (error) {
      // lastError 错误信息更新为 `error`，确保API 服务后续读取最新状态。
      lastError = error
      // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `API error (attempt ${attempt}/${maxRetries + 1}): ${error instanceof APIError ? `${error.status} ${error.message}` : errorMessage(error)}`,
        { level: 'error' },
      )

      // Fast mode fallback: on 429/529, either wait and retry (short delays)
      // or fall back to standard speed (long delays) to avoid cache thrashing.
      // Skip in persistent mode: the short-retry path below loops with fast
      // mode still active, so its `continue` never reaches the attempt clamp
      // and the for-loop terminates. Persistent sessions want the chunked
      // keep-alive path instead of fast-mode cache-preservation anyway.
      // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
      if (
        wasFastModeActive &&
        !isPersistentRetryEnabled() &&
        error instanceof APIError &&
        (error.status === 429 || is529Error(error))
      ) {
        // If the 429 is specifically because extra usage (overage) is not
        // available, permanently disable fast mode with a specific message.
        // overageReason读取`get`，供API 服务 with Retry后续处理使用。
        const overageReason = error.headers?.get(
          'anthropic-ratelimit-unified-overage-disabled-reason',
        )
        // `overageReason` 与 `null && overageReason !== undef` 不一致时刷新派生状态，避免使用过期结果。
        if (overageReason !== null && overageReason !== undefined) {
          // 调用 handleFastModeOverageRejection，触发API 服务 with Retry此处需要的副作用。
          handleFastModeOverageRejection(overageReason)
          // fastMode更新为 `false`，确保API 服务后续读取最新状态。
          retryContext.fastMode = false
          // 跳过当前项，继续处理API 服务 with Retry中的下一轮循环。
          continue
        }

        // retryAfterMs 集合读取`getRetryAfterMs`，供API 服务 with Retry后续处理使用。
        const retryAfterMs = getRetryAfterMs(error)
        // `retryAfterMs` 与 `null && retryAfterMs < SHORT_RET` 不一致时刷新派生状态，避免使用过期结果。
        if (retryAfterMs !== null && retryAfterMs < SHORT_RETRY_THRESHOLD_MS) {
          // Short retry-after: wait and retry with fast mode still active
          // to preserve prompt cache (same model name on retry).
          // 等待 `sleep(retryAfterMs, options.signal, { abortError })` 完成，再继续API 服务 with Retry的异步流程。
          await sleep(retryAfterMs, options.signal, { abortError })
          // 跳过当前项，继续处理API 服务 with Retry中的下一轮循环。
          continue
        }
        // Long or unknown retry-after: enter cooldown (switches to standard
        // speed model), with a minimum floor to avoid flip-flopping.
        // cooldownMs 集合保存`Math.max`，供API 服务 with Retry后续处理使用。
        const cooldownMs = Math.max(
          retryAfterMs ?? DEFAULT_FAST_MODE_FALLBACK_HOLD_MS,
          MIN_COOLDOWN_MS,
        )
        // cooldownReason 命名 `is529Error(error)`，让后续代码直接表达这个值的用途。
        const cooldownReason: CooldownReason = is529Error(error)
          ? 'overloaded'
          : 'rate_limit'
        // 调用 triggerFastModeCooldown，触发API 服务 with Retry此处需要的副作用。
        triggerFastModeCooldown(Date.now() + cooldownMs, cooldownReason)
        // 满足 `isFastModeEnabled()` 时，API 服务 with Retry执行该分支。
        if (isFastModeEnabled()) {
          // fastMode更新为 `false`，确保API 服务后续读取最新状态。
          retryContext.fastMode = false
        }
        // 跳过当前项，继续处理API 服务 with Retry中的下一轮循环。
        continue
      }

      // Fast mode fallback: if the API rejects the fast mode parameter
      // (e.g., org doesn't have fast mode enabled), permanently disable fast
      // mode and retry at standard speed.
      // 组合条件 `wasFastModeActive && isFastModeNotEnabledError(error)` 成立时，API 服务 with Retry才启用这条专门路径。
      if (wasFastModeActive && isFastModeNotEnabledError(error)) {
        // 调用 handleFastModeRejectedByAPI，触发API 服务 with Retry此处需要的副作用。
        handleFastModeRejectedByAPI()
        // fastMode更新为 `false`，确保API 服务后续读取最新状态。
        retryContext.fastMode = false
        // 跳过当前项，继续处理API 服务 with Retry中的下一轮循环。
        continue
      }

      // Non-foreground sources bail immediately on 529 — no retry amplification
      // during capacity cascades. User never sees these fail.
      // 组合条件 `is529Error(error) && !shouldRetry529(options.querySource)` 成立时，API 服务 with Retry才启用这条专门路径。
      if (is529Error(error) && !shouldRetry529(options.querySource)) {
        // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_api_529_background_dropped', {
          query_source:
            options.querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 抛出 new CannotRetryError(error, retryContext)，阻止API 服务 with Retry在无效状态下继续运行。
        throw new CannotRetryError(error, retryContext)
      }

      // Track consecutive 529 errors
      // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
      if (
        is529Error(error) &&
        // If FALLBACK_FOR_ALL_PRIMARY_MODELS is not set, fall through only if the primary model is a non-custom Opus model.
        // TODO: Revisit if the isNonCustomOpusModel check should still exist, or if isNonCustomOpusModel is a stale artifact of when Claude Code was hardcoded on Opus.
        (process.env.FALLBACK_FOR_ALL_PRIMARY_MODELS ||
          (!isClaudeAISubscriber() && isNonCustomOpusModel(options.model)))
      ) {
        // API 服务 with Retry在这里处理 `consecutive529Errors++`，完成这一小步状态转换。
        consecutive529Errors++
        // 满足 `consecutive529Errors >= MAX_529_RETRIES` 时，API 服务 with Retry执行该分支。
        if (consecutive529Errors >= MAX_529_RETRIES) {
          // Check if fallback model is specified
          // 满足 `options.fallbackModel` 时，API 服务 with Retry执行该分支。
          if (options.fallbackModel) {
            // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_api_opus_fallback_triggered', {
              original_model:
                options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              fallback_model:
                options.fallbackModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              provider: getAPIProviderForStatsig(),
            })

            // Throw special error to indicate fallback was triggered
            // 抛出 new FallbackTriggeredError(，阻止API 服务 with Retry在无效状态下继续运行。
            throw new FallbackTriggeredError(
              options.model,
              options.fallbackModel,
            )
          }

          // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
          if (
            process.env.USER_TYPE === 'external' &&
            !process.env.IS_SANDBOX &&
            !isPersistentRetryEnabled()
          ) {
            // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_api_custom_529_overloaded_error', {})
            // 抛出 new CannotRetryError(，阻止API 服务 with Retry在无效状态下继续运行。
            throw new CannotRetryError(
              new Error(REPEATED_529_ERROR_MESSAGE),
              retryContext,
            )
          }
        }
      }

      // Only retry if the error indicates we should
      // persistent 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const persistent =
        isPersistentRetryEnabled() && isTransientCapacityError(error)
      // 组合条件 `attempt > maxRetries && !persistent` 成立时，API 服务 with Retry才启用这条专门路径。
      if (attempt > maxRetries && !persistent) {
        // 抛出 new CannotRetryError(error, retryContext)，阻止API 服务 with Retry在无效状态下继续运行。
        throw new CannotRetryError(error, retryContext)
      }

      // AWS/GCP errors aren't always APIError, but can be retried
      // handledCloudAuthError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const handledCloudAuthError =
        handleAwsCredentialError(error) || handleGcpCredentialError(error)
      // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
      if (
        !handledCloudAuthError &&
        (!(error instanceof APIError) || !shouldRetry(error))
      ) {
        // 抛出 new CannotRetryError(error, retryContext)，阻止API 服务 with Retry在无效状态下继续运行。
        throw new CannotRetryError(error, retryContext)
      }

      // Handle max tokens context overflow errors by adjusting max_tokens for the next attempt
      // NOTE: With extended-context-window beta, this 400 error should not occur.
      // The API now returns 'model_context_window_exceeded' stop_reason instead.
      // Keeping for backward compatibility.
      // 满足 `error instanceof APIError` 时，API 服务 with Retry执行该分支。
      if (error instanceof APIError) {
        // overflowData解析`parseMaxTokensContextOverflowError`，供API 服务 with Retry后续处理使用。
        const overflowData = parseMaxTokensContextOverflowError(error)
        // 满足 `overflowData` 时，API 服务 with Retry执行该分支。
        if (overflowData) {
          // 从 `overflowData` 解构 inputTokens、contextLimit，减少API 服务 with Retry对同一对象的重复访问。
          const { inputTokens, contextLimit } = overflowData

          // safetyBuffer保存`1000`，供后续判断或组装使用。
          const safetyBuffer = 1000
          // availableContext保存`Math.max`，供API 服务 with Retry后续处理使用。
          const availableContext = Math.max(
            0,
            contextLimit - inputTokens - safetyBuffer,
          )
          // 满足 `availableContext < FLOOR_OUTPUT_TOKENS` 时，API 服务 with Retry执行该分支。
          if (availableContext < FLOOR_OUTPUT_TOKENS) {
            // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
            logError(
              new Error(
                `availableContext ${availableContext} is less than FLOOR_OUTPUT_TOKENS ${FLOOR_OUTPUT_TOKENS}`,
              ),
            )
            // 抛出 error，阻止API 服务 with Retry在无效状态下继续运行。
            throw error
          }
          // Ensure we have enough tokens for thinking + at least 1 output token
          // minRequired 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
          const minRequired =
            (retryContext.thinkingConfig.type === 'enabled'
              ? retryContext.thinkingConfig.budgetTokens
              : 0) + 1
          // adjustedMaxTokens 集合保存`Math.max`，供API 服务 with Retry后续处理使用。
          const adjustedMaxTokens = Math.max(
            FLOOR_OUTPUT_TOKENS,
            availableContext,
            minRequired,
          )
          // maxTokensOverride更新为 `adjustedMaxTokens`，确保API 服务后续读取最新状态。
          retryContext.maxTokensOverride = adjustedMaxTokens

          // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_max_tokens_context_overflow_adjustment', {
            inputTokens,
            contextLimit,
            adjustedMaxTokens,
            attempt,
          })

          // 跳过当前项，继续处理API 服务 with Retry中的下一轮循环。
          continue
        }
      }

      // For other errors, proceed with normal retry logic
      // Get retry-after header if available
      // retryAfter读取`getRetryAfter`，供API 服务 with Retry后续处理使用。
      const retryAfter = getRetryAfter(error)
      // delayMs 集合 先占位，稍后的条件分支会根据实际输入补齐它。
      let delayMs: number
      // 组合条件 `persistent && error instanceof APIError && error.` 成立时，API 服务 with Retry才启用这条专门路径。
      if (persistent && error instanceof APIError && error.status === 429) {
        // API 服务 with Retry在这里处理 `persistentAttempt++`，完成这一小步状态转换。
        persistentAttempt++
        // Window-based limits (e.g. 5hr Max/Pro) include a reset timestamp.
        // Wait until reset rather than polling every 5 min uselessly.
        // resetDelay读取`getRateLimitResetDelayMs`，供API 服务 with Retry后续处理使用。
        const resetDelay = getRateLimitResetDelayMs(error)
        // API 服务 with Retry在这里处理 `delayMs =`，完成这一小步状态转换。
        delayMs =
          resetDelay ??
          Math.min(
            getRetryDelay(
              persistentAttempt,
              retryAfter,
              PERSISTENT_MAX_BACKOFF_MS,
            ),
            PERSISTENT_RESET_CAP_MS,
          )
      // API 服务 with Retry在这里处理 `} else if (persistent) {`，完成这一小步状态转换。
      } else if (persistent) {
        // API 服务 with Retry在这里处理 `persistentAttempt++`，完成这一小步状态转换。
        persistentAttempt++
        // Retry-After is a server directive and bypasses maxDelayMs inside
        // getRetryDelay (intentional — honoring it is correct). Cap at the
        // 6hr reset-cap here so a pathological header can't wait unbounded.
        // delayMs 集合更新为 `Math.min(`，确保API 服务后续读取最新状态。
        delayMs = Math.min(
          getRetryDelay(
            persistentAttempt,
            retryAfter,
            PERSISTENT_MAX_BACKOFF_MS,
          ),
          PERSISTENT_RESET_CAP_MS,
        )
      } else {
        // delayMs 集合更新为 `getRetryDelay(attempt, retryAfter)`，确保API 服务后续读取最新状态。
        delayMs = getRetryDelay(attempt, retryAfter)
      }

      // In persistent mode the for-loop `attempt` is clamped at maxRetries+1;
      // use persistentAttempt for telemetry/yields so they show the true count.
      // reportedAttempt保存`persistent ? persistentAttempt : attempt`，供API 服务 with Retry后续判断或输出使用。
      const reportedAttempt = persistent ? persistentAttempt : attempt
      // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_api_retry', {
        attempt: reportedAttempt,
        delayMs: delayMs,
        error: (error as APIError)
          .message as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        status: (error as APIError).status,
        provider: getAPIProviderForStatsig(),
      })

      // 满足 `persistent` 时，API 服务 with Retry执行该分支。
      if (persistent) {
        // 满足 `delayMs > 60_000` 时，API 服务 with Retry执行该分支。
        if (delayMs > 60_000) {
          // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
          logEvent('tengu_api_persistent_retry_wait', {
            status: (error as APIError).status,
            delayMs,
            attempt: reportedAttempt,
            provider: getAPIProviderForStatsig(),
          })
        }
        // Chunk long sleeps so the host sees periodic stdout activity and
        // does not mark the session idle. Each yield surfaces as
        // {type:'system', subtype:'api_retry'} on stdout via QueryEngine.
        // remaining保存`delayMs`，供后续判断或组装使用。
        let remaining = delayMs
        // while 使用 remaining > 0 完成API 服务 with Retry里的对应操作。
        while (remaining > 0) {
          // 满足 `options.signal?.aborted) throw new APIUserAbortError(` 时，API 服务 with Retry执行该分支。
          if (options.signal?.aborted) throw new APIUserAbortError()
          // 满足 `error instanceof APIError` 时，API 服务 with Retry执行该分支。
          if (error instanceof APIError) {
            // 生成器产出 `createSystemAPIErrorMessage(`，把阶段性结果交给上层消费。
            yield createSystemAPIErrorMessage(
              error,
              remaining,
              reportedAttempt,
              maxRetries,
            )
          }
          // chunk保存`Math.min`，供API 服务 with Retry后续处理使用。
          const chunk = Math.min(remaining, HEARTBEAT_INTERVAL_MS)
          // 等待 `sleep(chunk, options.signal, { abortError })` 完成，再继续API 服务 with Retry的异步流程。
          await sleep(chunk, options.signal, { abortError })
          // API 服务 with Retry在这里处理 `remaining -= chunk`，完成这一小步状态转换。
          remaining -= chunk
        }
        // Clamp so the for-loop never terminates. Backoff uses the separate
        // persistentAttempt counter which keeps growing to the 5-min cap.
        // 满足 `attempt >= maxRetries` 时，API 服务 with Retry执行该分支。
        if (attempt >= maxRetries) attempt = maxRetries
      } else {
        // 满足 `error instanceof APIError` 时，API 服务 with Retry执行该分支。
        if (error instanceof APIError) {
          // 生成器产出 `createSystemAPIErrorMessage(error, delayMs, attempt, maxRetries)`，把阶段性结果交给上层消费。
          yield createSystemAPIErrorMessage(error, delayMs, attempt, maxRetries)
        }
        // 等待 `sleep(delayMs, options.signal, { abortError })` 完成，再继续API 服务 with Retry的异步流程。
        await sleep(delayMs, options.signal, { abortError })
      }
    }
  }

  // 抛出 new CannotRetryError(lastError, retryContext)，阻止API 服务 with Retry在无效状态下继续运行。
  throw new CannotRetryError(lastError, retryContext)
}

// getRetryAfter 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRetryAfter(error: unknown): string | null {
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    ((error as { headers?: { 'retry-after'?: string } }).headers?.[
      'retry-after'
    ] ||
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      ((error as APIError).headers as Headers)?.get?.('retry-after')) ??
    null
  )
}

// getRetryDelay 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getRetryDelay(
  attempt: number,
  retryAfterHeader?: string | null,
  maxDelayMs = 32000,
): number {
  // 满足 `retryAfterHeader` 时，API 服务 with Retry执行该分支。
  if (retryAfterHeader) {
    // seconds 集合解析`parseInt`，供API 服务 with Retry后续处理使用。
    const seconds = parseInt(retryAfterHeader, 10)
    // 满足 `!isNaN(seconds)` 时，API 服务 with Retry执行该分支。
    if (!isNaN(seconds)) {
      // 返回 `seconds * 1000`，作为API 服务 with Retry这次计算的结果。
      return seconds * 1000
    }
  }

  // baseDelay保存`Math.min`，供API 服务 with Retry后续处理使用。
  const baseDelay = Math.min(
    BASE_DELAY_MS * Math.pow(2, attempt - 1),
    maxDelayMs,
  )
  // jitter保存`Math.random`，供API 服务 with Retry后续处理使用。
  const jitter = Math.random() * 0.25 * baseDelay
  // 返回 `baseDelay + jitter`，作为API 服务 with Retry这次计算的结果。
  return baseDelay + jitter
}

// parseMaxTokensContextOverflowError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function parseMaxTokensContextOverflowError(error: APIError):
  | {
      inputTokens: number
      maxTokens: number
      contextLimit: number
    }
  | undefined {
  // `error.status` 与 `400 || !error.message` 不一致时刷新派生状态，避免使用过期结果。
  if (error.status !== 400 || !error.message) {
    // 返回 `undefined`，作为API 服务 with Retry这次计算的结果。
    return undefined
  }

  // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
  if (
    !error.message.includes(
      'input length and `max_tokens` exceed context limit',
    )
  ) {
    // 返回 `undefined`，作为API 服务 with Retry这次计算的结果。
    return undefined
  }

  // Example format: "input length and `max_tokens` exceed context limit: 188059 + 20000 > 200000"
  // regex 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const regex =
    /input length and `max_tokens` exceed context limit: (\d+) \+ (\d+) > (\d+)/
  // match匹配`message.match`，供API 服务 with Retry后续处理使用。
  const match = error.message.match(regex)

  // `!match || match.length` 与 `4` 不一致时刷新派生状态，避免使用过期结果。
  if (!match || match.length !== 4) {
    // 返回 `undefined`，作为API 服务 with Retry这次计算的结果。
    return undefined
  }

  // 组合条件 `!match[1] || !match[2] || !match[3]` 成立时，API 服务 with Retry才启用这条专门路径。
  if (!match[1] || !match[2] || !match[3]) {
    // 记录API 服务 with Retry运行诊断，方便排查异常路径或性能问题。
    logError(
      new Error(
        'Unable to parse max_tokens from max_tokens exceed context limit error message',
      ),
    )
    // 返回 `undefined`，作为API 服务 with Retry这次计算的结果。
    return undefined
  }
  // inputTokens 集合解析`parseInt`，供API 服务 with Retry后续处理使用。
  const inputTokens = parseInt(match[1], 10)
  // maxTokens 集合解析`parseInt`，供API 服务 with Retry后续处理使用。
  const maxTokens = parseInt(match[2], 10)
  // contextLimit解析`parseInt`，供API 服务 with Retry后续处理使用。
  const contextLimit = parseInt(match[3], 10)

  // 组合条件 `isNaN(inputTokens) || isNaN(maxTokens) || isNaN(contextLimit)` 成立时，API 服务 with Retry才启用这条专门路径。
  if (isNaN(inputTokens) || isNaN(maxTokens) || isNaN(contextLimit)) {
    // 返回 `undefined`，作为API 服务 with Retry这次计算的结果。
    return undefined
  }

  // 返回结构化结果，集中表达API 服务 with Retry已经整理出的状态。
  return { inputTokens, maxTokens, contextLimit }
}

// TODO: Replace with a response header check once the API adds a dedicated
// header for fast-mode rejection (e.g., x-fast-mode-rejected). String-matching
// the error message is fragile and will break if the API wording changes.
// isFastModeNotEnabledError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isFastModeNotEnabledError(error: unknown): boolean {
  // 满足 `!(error instanceof APIError)` 时，API 服务 with Retry执行该分支。
  if (!(error instanceof APIError)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    error.status === 400 &&
    (error.message?.includes('Fast mode is not enabled') ?? false)
  )
}

// is529Error 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function is529Error(error: unknown): boolean {
  // 满足 `!(error instanceof APIError)` 时，API 服务 with Retry执行该分支。
  if (!(error instanceof APIError)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Check for 529 status code or overloaded error in message
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    error.status === 529 ||
    // See below: the SDK sometimes fails to properly pass the 529 status code during streaming
    (error.message?.includes('"type":"overloaded_error"') ?? false)
  )
}

// isOAuthTokenRevokedError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isOAuthTokenRevokedError(error: unknown): boolean {
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    error instanceof APIError &&
    error.status === 403 &&
    (error.message?.includes('OAuth token has been revoked') ?? false)
  )
}

// isBedrockAuthError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isBedrockAuthError(error: unknown): boolean {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)` 时，API 服务 with Retry执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)) {
    // AWS libs reject without an API call if .aws holds a past Expiration value
    // otherwise, API calls that receive expired tokens give generic 403
    // "The security token included in the request is invalid"
    // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
    if (
      isAwsCredentialsProviderError(error) ||
      (error instanceof APIError && error.status === 403)
    ) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Clear AWS auth caches if appropriate.
 * @returns true if action was taken.
 */
// handleAwsCredentialError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleAwsCredentialError(error: unknown): boolean {
  // 满足 `isBedrockAuthError(error)` 时，API 服务 with Retry执行该分支。
  if (isBedrockAuthError(error)) {
    // 清理相关缓存，确保API 服务 with Retry下一次读取时重新加载最新数据。
    clearAwsCredentialsCache()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// google-auth-library throws plain Error (no typed name like AWS's
// CredentialsProviderError). Match common SDK-level credential-failure messages.
// isGoogleAuthLibraryCredentialError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isGoogleAuthLibraryCredentialError(error: unknown): boolean {
  // 满足 `!(error instanceof Error)` 时，API 服务 with Retry执行该分支。
  if (!(error instanceof Error)) return false
  // 消息保存`error.message`，供后续判断或组装使用。
  const msg = error.message
  // 返回 `(`，作为API 服务 with Retry这次计算的结果。
  return (
    msg.includes('Could not load the default credentials') ||
    msg.includes('Could not refresh access token') ||
    msg.includes('invalid_grant')
  )
}

// isVertexAuthError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isVertexAuthError(error: unknown): boolean {
  // 满足 `isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)` 时，API 服务 with Retry执行该分支。
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)) {
    // SDK-level: google-auth-library fails in prepareOptions() before the HTTP call
    // 满足 `isGoogleAuthLibraryCredentialError(error)` 时，API 服务 with Retry执行该分支。
    if (isGoogleAuthLibraryCredentialError(error)) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
    // Server-side: Vertex returns 401 for expired/invalid tokens
    // 组合条件 `error instanceof APIError && error.status === 401` 成立时，API 服务 with Retry才启用这条专门路径。
    if (error instanceof APIError && error.status === 401) {
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

/**
 * Clear GCP auth caches if appropriate.
 * @returns true if action was taken.
 */
// handleGcpCredentialError 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function handleGcpCredentialError(error: unknown): boolean {
  // 满足 `isVertexAuthError(error)` 时，API 服务 with Retry执行该分支。
  if (isVertexAuthError(error)) {
    // 清理相关缓存，确保API 服务 with Retry下一次读取时重新加载最新数据。
    clearGcpCredentialsCache()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// shouldRetry 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldRetry(error: APIError): boolean {
  // Never retry mock errors - they're from /mock-limits command for testing
  // 满足 `isMockRateLimitError(error)` 时，API 服务 with Retry执行该分支。
  if (isMockRateLimitError(error)) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }

  // Persistent mode: 429/529 always retryable, bypass subscriber gates and
  // x-should-retry header.
  // 组合条件 `isPersistentRetryEnabled() && isTransientCapacityError(error)` 成立时，API 服务 with Retry才启用这条专门路径。
  if (isPersistentRetryEnabled() && isTransientCapacityError(error)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // CCR mode: auth is via infrastructure-provided JWTs, so a 401/403 is a
  // transient blip (auth service flap, network hiccup) rather than bad
  // credentials. Bypass x-should-retry:false — the server assumes we'd retry
  // the same bad key, but our key is fine.
  // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
  if (
    isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) &&
    (error.status === 401 || error.status === 403)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for overloaded errors first by examining the message content
  // The SDK sometimes fails to properly pass the 529 status code during streaming,
  // so we need to check the error message directly
  // 满足 `error.message?.includes('"type":"overloaded_error"')` 时，API 服务 with Retry执行该分支。
  if (error.message?.includes('"type":"overloaded_error"')) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Check for max tokens context overflow errors that we can handle
  // 满足 `parseMaxTokensContextOverflowError(error)` 时，API 服务 with Retry执行该分支。
  if (parseMaxTokensContextOverflowError(error)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Note this is not a standard header.
  // shouldRetryHeader记录 `get` 是否成立，API 服务 with Retry随后按该结果分支。
  const shouldRetryHeader = error.headers?.get('x-should-retry')

  // If the server explicitly says whether or not to retry, obey.
  // For Max and Pro users, should-retry is true, but in several hours, so we shouldn't.
  // Enterprise users can retry because they typically use PAYG instead of rate limits.
  // API 服务 with Retry在这里进入条件判断，后续代码按实际状态分流。
  if (
    shouldRetryHeader === 'true' &&
    (!isClaudeAISubscriber() || isEnterpriseSubscriber())
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Ants can ignore x-should-retry: false for 5xx server errors only.
  // For other status codes (401, 403, 400, 429, etc.), respect the header.
  // 当 `shouldRetryHeader` 匹配 `'false'` 时，API 服务 with Retry执行对应分支。
  if (shouldRetryHeader === 'false') {
    // is5xxError 错误信息标记API 服务 with Retry是否启用对应路径。
    const is5xxError = error.status !== undefined && error.status >= 500
    // 组合条件 `!(process.env.USER_TYPE === 'ant' && is5xxError)` 成立时，API 服务 with Retry才启用这条专门路径。
    if (!(process.env.USER_TYPE === 'ant' && is5xxError)) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
  }

  // 满足 `error instanceof APIConnectionError` 时，API 服务 with Retry执行该分支。
  if (error instanceof APIConnectionError) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // error.status 错误信息缺失时提前走兜底路径，避免API 服务 with Retry继续依赖无效输入。
  if (!error.status) return false

  // Retry on request timeouts.
  // 满足 `error.status === 408` 时，API 服务 with Retry执行该分支。
  if (error.status === 408) return true

  // Retry on lock timeouts.
  // 满足 `error.status === 409` 时，API 服务 with Retry执行该分支。
  if (error.status === 409) return true

  // Retry on rate limits, but not for ClaudeAI Subscription users
  // Enterprise users can retry because they typically use PAYG instead of rate limits
  // 满足 `error.status === 429` 时，API 服务 with Retry执行该分支。
  if (error.status === 429) {
    // 返回 `!isClaudeAISubscriber() || isEnterpriseSubscriber()`，作为API 服务 with Retry这次计算的结果。
    return !isClaudeAISubscriber() || isEnterpriseSubscriber()
  }

  // Clear API key cache on 401 and allow retry.
  // OAuth token handling is done in the main retry loop via handleOAuth401Error.
  // 满足 `error.status === 401` 时，API 服务 with Retry执行该分支。
  if (error.status === 401) {
    // 清理相关缓存，确保API 服务 with Retry下一次读取时重新加载最新数据。
    clearApiKeyHelperCache()
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Retry on 403 "token revoked" (same refresh logic as 401, see above)
  // 满足 `isOAuthTokenRevokedError(error)` 时，API 服务 with Retry执行该分支。
  if (isOAuthTokenRevokedError(error)) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Retry internal errors.
  // 组合条件 `error.status && error.status >= 500` 成立时，API 服务 with Retry才启用这条专门路径。
  if (error.status && error.status >= 500) return true

  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}

// getDefaultMaxRetries 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getDefaultMaxRetries(): number {
  // 满足 `process.env.CLAUDE_CODE_MAX_RETRIES` 时，API 服务 with Retry执行该分支。
  if (process.env.CLAUDE_CODE_MAX_RETRIES) {
    // 返回 `parseInt(process.env.CLAUDE_CODE_MAX_RETRIES, 10)`，作为API 服务 with Retry这次计算的结果。
    return parseInt(process.env.CLAUDE_CODE_MAX_RETRIES, 10)
  }
  // 返回 `DEFAULT_MAX_RETRIES`，作为API 服务 with Retry这次计算的结果。
  return DEFAULT_MAX_RETRIES
}
// getMaxRetries 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getMaxRetries(options: RetryOptions): number {
  // 返回 `options.maxRetries ?? getDefaultMaxRetries()`，作为API 服务 with Retry这次计算的结果。
  return options.maxRetries ?? getDefaultMaxRetries()
}

// DEFAULT_FAST_MODE_FALLBACK_HOLD_MS 集合保存`30 * 60 * 1000 // 30 minutes`，供后续判断或组装使用。
const DEFAULT_FAST_MODE_FALLBACK_HOLD_MS = 30 * 60 * 1000 // 30 minutes
// SHORT_RETRY_THRESHOLD_MS 集合保存`20 * 1000 // 20 seconds`，供后续判断或组装使用。
const SHORT_RETRY_THRESHOLD_MS = 20 * 1000 // 20 seconds
// MIN_COOLDOWN_MS 集合保存`10 * 60 * 1000 // 10 minutes`，供API 服务 with Retry后续判断或输出使用。
const MIN_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

// getRetryAfterMs 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRetryAfterMs(error: APIError): number | null {
  // retryAfter读取`getRetryAfter`，供API 服务 with Retry后续处理使用。
  const retryAfter = getRetryAfter(error)
  // 满足 `retryAfter` 时，API 服务 with Retry执行该分支。
  if (retryAfter) {
    // seconds 集合解析`parseInt`，供API 服务 with Retry后续处理使用。
    const seconds = parseInt(retryAfter, 10)
    // 满足 `!isNaN(seconds)` 时，API 服务 with Retry执行该分支。
    if (!isNaN(seconds)) {
      // 返回 `seconds * 1000`，作为API 服务 with Retry这次计算的结果。
      return seconds * 1000
    }
  }
  // 返回 `null`，作为API 服务 with Retry这次计算的结果。
  return null
}

// getRateLimitResetDelayMs 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getRateLimitResetDelayMs(error: APIError): number | null {
  // resetHeader读取`error.headers?.get?.('anthropic-ratelimit-unified-reset')` 整理出中间结果，供API 服务 with Retry后续步骤使用。
  const resetHeader = error.headers?.get?.('anthropic-ratelimit-unified-reset')
  // resetHeader缺失时提前走兜底路径，避免API 服务 with Retry继续依赖无效输入。
  if (!resetHeader) return null
  // resetUnixSec保存`Number`，供API 服务 with Retry后续处理使用。
  const resetUnixSec = Number(resetHeader)
  // 满足 `!Number.isFinite(resetUnixSec)` 时，API 服务 with Retry执行该分支。
  if (!Number.isFinite(resetUnixSec)) return null
  // delayMs 集合记录时间`Date.now`，供API 服务 with Retry后续处理使用。
  const delayMs = resetUnixSec * 1000 - Date.now()
  // 满足 `delayMs <= 0` 时，API 服务 with Retry执行该分支。
  if (delayMs <= 0) return null
  // 返回 `Math.min(delayMs, PERSISTENT_RESET_CAP_MS)`，作为API 服务 with Retry这次计算的结果。
  return Math.min(delayMs, PERSISTENT_RESET_CAP_MS)
}
