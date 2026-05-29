// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaImageBlockParam,
  BetaJSONOutputFormat,
  BetaMessage,
  BetaMessageDeltaUsage,
  BetaMessageStreamParams,
  BetaOutputConfig,
  BetaRawMessageStreamEvent,
  BetaRequestDocumentBlock,
  BetaStopReason,
  BetaToolChoiceAuto,
  BetaToolChoiceTool,
  BetaToolResultBlockParam,
  BetaToolUnion,
  BetaUsage,
  BetaMessageParam as MessageParam,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
// 类型依赖 { TextBlockParam } 来自 @anthropic-ai/sdk/resources/index.mjs，用于校准API 服务 claude的数据契约。
import type { TextBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
// 类型依赖 { Stream } 来自 @anthropic-ai/sdk/streaming.mjs，用于校准API 服务 claude的数据契约。
import type { Stream } from '@anthropic-ai/sdk/streaming.mjs'
// 使用 Node/Bun 的 crypto 能力处理本地运行时资源。
import { randomUUID } from 'crypto'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getAPIProvider,
  isFirstPartyAnthropicBaseUrl,
} from 'src/utils/model/providers.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getAttributionHeader,
  getCLISyspromptPrefix,
} from '../../constants/system.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getEmptyToolPermissionContext,
  type QueryChainTracking,
  type Tool,
  type ToolPermissionContext,
  type Tools,
  toolMatchesName,
} from '../../Tool.js'
// 类型依赖 { AgentDefinition } 来自 ../../tools/AgentTool/loadAgentsDir.js，用于校准API 服务 claude的数据契约。
import type { AgentDefinition } from '../../tools/AgentTool/loadAgentsDir.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  type ConnectorTextBlock,
  type ConnectorTextDelta,
  isConnectorTextBlock,
} from '../../types/connectorText.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import type {
  AssistantMessage,
  Message,
  StreamEvent,
  SystemAPIErrorMessage,
  UserMessage,
} from '../../types/message.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  type CacheScope,
  logAPIPrefix,
  splitSysPromptPrefix,
  toolToAPISchema,
} from '../../utils/api.js'
// 复用 getOauthAccountInfo 工具函数，把通用处理留在 ../../utils/auth.js 中维护。
import { getOauthAccountInfo } from '../../utils/auth.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getBedrockExtraBodyParamsBetas,
  getMergedBetas,
  getModelBetas,
} from '../../utils/betas.js'
// 复用 getOrCreateUserID 工具函数，把通用处理留在 ../../utils/config.js 中维护。
import { getOrCreateUserID } from '../../utils/config.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  CAPPED_DEFAULT_MAX_TOKENS,
  getModelMaxOutputTokens,
  getSonnet1mExpTreatmentEnabled,
} from '../../utils/context.js'
// 复用 resolveAppliedEffort 工具函数，把通用处理留在 ../../utils/effort.js 中维护。
import { resolveAppliedEffort } from '../../utils/effort.js'
// 复用 isEnvTruthy 工具函数，把通用处理留在 ../../utils/envUtils.js 中维护。
import { isEnvTruthy } from '../../utils/envUtils.js'
// 复用 errorMessage 工具函数，把通用处理留在 ../../utils/errors.js 中维护。
import { errorMessage } from '../../utils/errors.js'
// 复用 computeFingerprintFromMessages 工具函数，把通用处理留在 ../../utils/fingerprint.js 中维护。
import { computeFingerprintFromMessages } from '../../utils/fingerprint.js'
// 复用 captureAPIRequest、logError 工具函数，把通用处理留在 ../../utils/log.js 中维护。
import { captureAPIRequest, logError } from '../../utils/log.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  createAssistantAPIErrorMessage,
  createUserMessage,
  ensureToolResultPairing,
  normalizeContentFromAPI,
  normalizeMessagesForAPI,
  stripAdvisorBlocks,
  stripCallerFieldFromAssistantMessage,
  stripToolReferenceBlocksFromUserMessage,
} from '../../utils/messages.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getDefaultOpusModel,
  getDefaultSonnetModel,
  getSmallFastModel,
  isNonCustomOpusModel,
} from '../../utils/model/model.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  asSystemPrompt,
  type SystemPrompt,
} from '../../utils/systemPromptType.js'
// 复用 tokenCountFromLastAPIResponse 工具函数，把通用处理留在 ../../utils/tokens.js 中维护。
import { tokenCountFromLastAPIResponse } from '../../utils/tokens.js'
// 引入 getDynamicConfig_BLOCKS_ON_INIT，将 ../analytics/growthbook.js 中已经封装好的能力接到本文件流程里。
import { getDynamicConfig_BLOCKS_ON_INIT } from '../analytics/growthbook.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  currentLimits,
  extractQuotaStatusFromError,
  extractQuotaStatusFromHeaders,
} from '../claudeAiLimits.js'
// 引入 getAPIContextManagement，将 ../compact/apiMicrocompact.js 中已经封装好的能力接到本文件流程里。
import { getAPIContextManagement } from '../compact/apiMicrocompact.js'

/* eslint-disable @typescript-eslint/no-require-imports */
// autoModeStateModule 状态保存`feature`，供API 服务 claude后续处理使用。
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('../../utils/permissions/autoModeState.js') as typeof import('../../utils/permissions/autoModeState.js'))
  : null

// 引入 feature，将 bun:bundle 中已经封装好的能力接到本文件流程里。
import { feature } from 'bun:bundle'
// 类型依赖 { ClientOptions } 来自 @anthropic-ai/sdk，用于校准API 服务 claude的数据契约。
import type { ClientOptions } from '@anthropic-ai/sdk'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
} from '@anthropic-ai/sdk/error'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getAfkModeHeaderLatched,
  getCacheEditingHeaderLatched,
  getFastModeHeaderLatched,
  getLastApiCompletionTimestamp,
  getPromptCache1hAllowlist,
  getPromptCache1hEligible,
  getSessionId,
  getThinkingClearLatched,
  setAfkModeHeaderLatched,
  setCacheEditingHeaderLatched,
  setFastModeHeaderLatched,
  setLastMainRequestId,
  setPromptCache1hAllowlist,
  setPromptCache1hEligible,
  setThinkingClearLatched,
} from 'src/bootstrap/state.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  AFK_MODE_BETA_HEADER,
  CONTEXT_1M_BETA_HEADER,
  CONTEXT_MANAGEMENT_BETA_HEADER,
  EFFORT_BETA_HEADER,
  FAST_MODE_BETA_HEADER,
  PROMPT_CACHING_SCOPE_BETA_HEADER,
  REDACT_THINKING_BETA_HEADER,
  STRUCTURED_OUTPUTS_BETA_HEADER,
  TASK_BUDGETS_BETA_HEADER,
} from 'src/constants/betas.js'
// 类型依赖 { QuerySource } 来自 src/constants/querySource.js，用于校准API 服务 claude的数据契约。
import type { QuerySource } from 'src/constants/querySource.js'
// 类型依赖 { Notification } 来自 src/context/notifications.js，用于校准API 服务 claude的数据契约。
import type { Notification } from 'src/context/notifications.js'
// 引入 addToTotalSessionCost，将 src/cost-tracker.js 中已经封装好的能力接到本文件流程里。
import { addToTotalSessionCost } from 'src/cost-tracker.js'
// 接入 getFeatureValue_CACHED_MAY_BE_STALE 服务层能力，把外部通信或共享状态交给 src/services/analytics/growthbook.js 处理。
import { getFeatureValue_CACHED_MAY_BE_STALE } from 'src/services/analytics/growthbook.js'
// 类型依赖 { AgentId } 来自 src/types/ids.js，用于校准API 服务 claude的数据契约。
import type { AgentId } from 'src/types/ids.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  ADVISOR_TOOL_INSTRUCTIONS,
  getExperimentAdvisorModels,
  isAdvisorEnabled,
  isValidAdvisorModel,
  modelSupportsAdvisor,
} from 'src/utils/advisor.js'
// 复用 getAgentContext 工具函数，把通用处理留在 src/utils/agentContext.js 中维护。
import { getAgentContext } from 'src/utils/agentContext.js'
// 复用 isClaudeAISubscriber 工具函数，把通用处理留在 src/utils/auth.js 中维护。
import { isClaudeAISubscriber } from 'src/utils/auth.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  getToolSearchBetaHeader,
  modelSupportsStructuredOutputs,
  shouldIncludeFirstPartyOnlyBetas,
  shouldUseGlobalCacheScope,
} from 'src/utils/betas.js'
// 复用 CLAUDE_IN_CHROME_MCP_SERVER_NAME 工具函数，把通用处理留在 src/utils/claudeInChrome/common.js 中维护。
import { CLAUDE_IN_CHROME_MCP_SERVER_NAME } from 'src/utils/claudeInChrome/common.js'
// 复用 CHROME_TOOL_SEARCH_INSTRUCTIONS 工具函数，把通用处理留在 src/utils/claudeInChrome/prompt.js 中维护。
import { CHROME_TOOL_SEARCH_INSTRUCTIONS } from 'src/utils/claudeInChrome/prompt.js'
// 复用 getMaxThinkingTokensForModel 工具函数，把通用处理留在 src/utils/context.js 中维护。
import { getMaxThinkingTokensForModel } from 'src/utils/context.js'
// 复用 logForDebugging 工具函数，把通用处理留在 src/utils/debug.js 中维护。
import { logForDebugging } from 'src/utils/debug.js'
// 复用 logForDiagnosticsNoPII 工具函数，把通用处理留在 src/utils/diagLogs.js 中维护。
import { logForDiagnosticsNoPII } from 'src/utils/diagLogs.js'
// 复用 EffortValue、modelSupportsEffort 工具函数，把通用处理留在 src/utils/effort.js 中维护。
import { type EffortValue, modelSupportsEffort } from 'src/utils/effort.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  isFastModeAvailable,
  isFastModeCooldown,
  isFastModeEnabled,
  isFastModeSupportedByModel,
} from 'src/utils/fastMode.js'
// 复用 returnValue 工具函数，把通用处理留在 src/utils/generators.js 中维护。
import { returnValue } from 'src/utils/generators.js'
// 复用 headlessProfilerCheckpoint 工具函数，把通用处理留在 src/utils/headlessProfiler.js 中维护。
import { headlessProfilerCheckpoint } from 'src/utils/headlessProfiler.js'
// 复用 isMcpInstructionsDeltaEnabled 工具函数，把通用处理留在 src/utils/mcpInstructionsDelta.js 中维护。
import { isMcpInstructionsDeltaEnabled } from 'src/utils/mcpInstructionsDelta.js'
// 复用 calculateUSDCost 工具函数，把通用处理留在 src/utils/modelCost.js 中维护。
import { calculateUSDCost } from 'src/utils/modelCost.js'
// 复用 endQueryProfile、queryCheckpoint 工具函数，把通用处理留在 src/utils/queryProfiler.js 中维护。
import { endQueryProfile, queryCheckpoint } from 'src/utils/queryProfiler.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  modelSupportsAdaptiveThinking,
  modelSupportsThinking,
  type ThinkingConfig,
} from 'src/utils/thinking.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  extractDiscoveredToolNames,
  isDeferredToolsDeltaEnabled,
  isToolSearchEnabled,
} from 'src/utils/toolSearch.js'
// 引入 API_MAX_MEDIA_PER_REQUEST，将 ../../constants/apiLimits.js 中已经封装好的能力接到本文件流程里。
import { API_MAX_MEDIA_PER_REQUEST } from '../../constants/apiLimits.js'
// 引入 ADVISOR_BETA_HEADER，将 ../../constants/betas.js 中已经封装好的能力接到本文件流程里。
import { ADVISOR_BETA_HEADER } from '../../constants/betas.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  formatDeferredToolLine,
  isDeferredTool,
  TOOL_SEARCH_TOOL_NAME,
} from '../../tools/ToolSearchTool/prompt.js'
// 复用 count 工具函数，把通用处理留在 ../../utils/array.js 中维护。
import { count } from '../../utils/array.js'
// 复用 insertBlockAfterToolResults 工具函数，把通用处理留在 ../../utils/contentArray.js 中维护。
import { insertBlockAfterToolResults } from '../../utils/contentArray.js'
// 复用 validateBoundedIntEnvVar 工具函数，把通用处理留在 ../../utils/envValidation.js 中维护。
import { validateBoundedIntEnvVar } from '../../utils/envValidation.js'
// 复用 safeParseJSON 工具函数，把通用处理留在 ../../utils/json.js 中维护。
import { safeParseJSON } from '../../utils/json.js'
// 复用 getInferenceProfileBackingModel 工具函数，把通用处理留在 ../../utils/model/bedrock.js 中维护。
import { getInferenceProfileBackingModel } from '../../utils/model/bedrock.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  normalizeModelStringForAPI,
  parseUserSpecifiedModel,
} from '../../utils/model/model.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  startSessionActivity,
  stopSessionActivity,
} from '../../utils/sessionActivity.js'
// 复用 jsonStringify 工具函数，把通用处理留在 ../../utils/slowOperations.js 中维护。
import { jsonStringify } from '../../utils/slowOperations.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  isBetaTracingEnabled,
  type LLMRequestNewContext,
  startLLMRequestSpan,
} from '../../utils/telemetry/sessionTracing.js'
/* eslint-enable @typescript-eslint/no-require-imports */
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../analytics/index.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  consumePendingCacheEdits,
  getPinnedCacheEdits,
  markToolsSentToAPIState,
  pinCacheEdits,
} from '../compact/microCompact.js'
// 引入 getInitializationStatus，将 ../lsp/manager.js 中已经封装好的能力接到本文件流程里。
import { getInitializationStatus } from '../lsp/manager.js'
// 引入 isToolFromMcpServer，将 ../mcp/utils.js 中已经封装好的能力接到本文件流程里。
import { isToolFromMcpServer } from '../mcp/utils.js'
// 引入 withStreamingVCR、withVCR，将 ../vcr.js 中已经封装好的能力接到本文件流程里。
import { withStreamingVCR, withVCR } from '../vcr.js'
// 引入 CLIENT_REQUEST_ID_HEADER、getAnthropicClient，将 ./client.js 中已经封装好的能力接到本文件流程里。
import { CLIENT_REQUEST_ID_HEADER, getAnthropicClient } from './client.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  API_ERROR_MESSAGE_PREFIX,
  CUSTOM_OFF_SWITCH_MESSAGE,
  getAssistantMessageFromError,
  getErrorMessageIfRefusal,
} from './errors.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  EMPTY_USAGE,
  type GlobalCacheStrategy,
  logAPIError,
  logAPIQuery,
  logAPISuccessAndDuration,
  type NonNullableUsage,
} from './logging.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  CACHE_TTL_1HOUR_MS,
  checkResponseForCacheBreak,
  recordPromptState,
} from './promptCacheBreakDetection.js'
// 整理这一组导入，让API 服务 claude后续逻辑可以直接复用这些外部能力。
import {
  CannotRetryError,
  FallbackTriggeredError,
  is529Error,
  type RetryContext,
  withRetry,
} from './withRetry.js'

// Define a type that represents valid JSON values
// JsonValue 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type JsonValue = string | number | boolean | null | JsonObject | JsonArray
// JsonObject 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type JsonObject = { [key: string]: JsonValue }
// JsonArray 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type JsonArray = JsonValue[]

/**
 * Assemble the extra body parameters for the API request, based on the
 * CLAUDE_CODE_EXTRA_BODY environment variable if present and on any beta
 * headers (primarily for Bedrock requests).
 *
 * @param betaHeaders - An array of beta headers to include in the request.
 * @returns A JSON object representing the extra body parameters.
 */
// getExtraBodyParams 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getExtraBodyParams(betaHeaders?: string[]): JsonObject {
  // Parse user's extra body parameters first
  // extraBodyStr 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const extraBodyStr = process.env.CLAUDE_CODE_EXTRA_BODY
  // 结果 从空对象开始收集键值，后续按名称补齐内容。
  let result: JsonObject = {}

  // 满足 `extraBodyStr` 时，API 服务 claude执行该分支。
  if (extraBodyStr) {
    // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
    try {
      // Parse as JSON, which can be null, boolean, number, string, array or object
      // 解析结果保存`safeParseJSON`，供API 服务 claude后续处理使用。
      const parsed = safeParseJSON(extraBodyStr)
      // We expect an object with key-value pairs to spread into API parameters
      // 组合条件 `parsed && typeof parsed === 'object' && !Array.isArray(parsed)` 成立时，API 服务 claude才启用这条专门路径。
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Shallow clone — safeParseJSON is LRU-cached and returns the same
        // object reference for the same string. Mutating `result` below
        // would poison the cache, causing stale values to persist.
        // 结果更新为 `{ ...(parsed as JsonObject) }`，确保API 服务后续读取最新状态。
        result = { ...(parsed as JsonObject) }
      } else {
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `CLAUDE_CODE_EXTRA_BODY env var must be a JSON object, but was given ${extraBodyStr}`,
          { level: 'error' },
        )
      }
    } catch (error) {
      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Error parsing CLAUDE_CODE_EXTRA_BODY: ${errorMessage(error)}`,
        { level: 'error' },
      )
    }
  }

  // Anti-distillation: send fake_tools opt-in for 1P CLI only
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    feature('ANTI_DISTILLATION_CC')
      ? process.env.CLAUDE_CODE_ENTRYPOINT === 'cli' &&
        shouldIncludeFirstPartyOnlyBetas() &&
        getFeatureValue_CACHED_MAY_BE_STALE(
          'tengu_anti_distill_fake_tool_injection',
          false,
        )
      : false
  ) {
    // anti_distillation更新为 `['fake_tools']`，确保API 服务后续读取最新状态。
    result.anti_distillation = ['fake_tools']
  }

  // Handle beta headers if provided
  // 组合条件 `betaHeaders && betaHeaders.length > 0` 成立时，API 服务 claude才启用这条专门路径。
  if (betaHeaders && betaHeaders.length > 0) {
    // 组合条件 `result.anthropic_beta && Array.isArray(result.anthropic_beta)` 成立时，API 服务 claude才启用这条专门路径。
    if (result.anthropic_beta && Array.isArray(result.anthropic_beta)) {
      // Add to existing array, avoiding duplicates
      // existingHeaders 集合 命名 `result.anthropic_beta as string[]`，让后续代码直接表达这个值的用途。
      const existingHeaders = result.anthropic_beta as string[]
      // newHeaders 集合筛选`betaHeaders.filter`，供API 服务 claude后续处理使用。
      const newHeaders = betaHeaders.filter(
        // header更新为 `> !existingHeaders.includes(header)`，确保API 服务后续读取最新状态。
        header => !existingHeaders.includes(header),
      )
      // anthropic_beta更新为 `[...existingHeaders, ...newHeaders]`，确保API 服务后续读取最新状态。
      result.anthropic_beta = [...existingHeaders, ...newHeaders]
    } else {
      // Create new array with the beta headers
      // anthropic_beta更新为 `betaHeaders`，确保API 服务后续读取最新状态。
      result.anthropic_beta = betaHeaders
    }
  }

  // 返回 `result`，作为API 服务 claude这次计算的结果。
  return result
}

// getPromptCachingEnabled 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getPromptCachingEnabled(model: string): boolean {
  // Global disable takes precedence
  // 满足 `isEnvTruthy(process.env.DISABLE_PROMPT_CACHING)` 时，API 服务 claude执行该分支。
  if (isEnvTruthy(process.env.DISABLE_PROMPT_CACHING)) return false

  // Check if we should disable for small/fast model
  // 满足 `isEnvTruthy(process.env.DISABLE_PROMPT_CACHING_HAIKU)` 时，API 服务 claude执行该分支。
  if (isEnvTruthy(process.env.DISABLE_PROMPT_CACHING_HAIKU)) {
    // smallFastModel读取`getSmallFastModel`，供API 服务 claude后续处理使用。
    const smallFastModel = getSmallFastModel()
    // 满足 `model === smallFastModel` 时，API 服务 claude执行该分支。
    if (model === smallFastModel) return false
  }

  // Check if we should disable for default Sonnet
  // 满足 `isEnvTruthy(process.env.DISABLE_PROMPT_CACHING_SONNET)` 时，API 服务 claude执行该分支。
  if (isEnvTruthy(process.env.DISABLE_PROMPT_CACHING_SONNET)) {
    // defaultSonnet读取`getDefaultSonnetModel`，供API 服务 claude后续处理使用。
    const defaultSonnet = getDefaultSonnetModel()
    // 满足 `model === defaultSonnet` 时，API 服务 claude执行该分支。
    if (model === defaultSonnet) return false
  }

  // Check if we should disable for default Opus
  // 满足 `isEnvTruthy(process.env.DISABLE_PROMPT_CACHING_OPUS)` 时，API 服务 claude执行该分支。
  if (isEnvTruthy(process.env.DISABLE_PROMPT_CACHING_OPUS)) {
    // defaultOpus 集合读取`getDefaultOpusModel`，供API 服务 claude后续处理使用。
    const defaultOpus = getDefaultOpusModel()
    // 满足 `model === defaultOpus` 时，API 服务 claude执行该分支。
    if (model === defaultOpus) return false
  }

  // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
  return true
}

// getCacheControl 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getCacheControl({
  scope,
  querySource,
}: {
  scope?: CacheScope
  querySource?: QuerySource
} = {}): {
  type: 'ephemeral'
  ttl?: '1h'
  scope?: CacheScope
} {
  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    type: 'ephemeral',
    ...(should1hCacheTTL(querySource) && { ttl: '1h' }),
    ...(scope === 'global' && { scope }),
  }
}

/**
 * Determines if 1h TTL should be used for prompt caching.
 *
 * Only applied when:
 * 1. User is eligible (ant or subscriber within rate limits)
 * 2. The query source matches a pattern in the GrowthBook allowlist
 *
 * GrowthBook config shape: { allowlist: string[] }
 * Patterns support trailing '*' for prefix matching.
 * Examples:
 * - { allowlist: ["repl_main_thread*", "sdk"] } — main thread + SDK only
 * - { allowlist: ["repl_main_thread*", "sdk", "agent:*"] } — also subagents
 * - { allowlist: ["*"] } — all sources
 *
 * The allowlist is cached in STATE for session stability — prevents mixed
 * TTLs when GrowthBook's disk cache updates mid-request.
 */
// should1hCacheTTL 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function should1hCacheTTL(querySource?: QuerySource): boolean {
  // 3P Bedrock users get 1h TTL when opted in via env var — they manage their own billing
  // No GrowthBook gating needed since 3P users don't have GrowthBook configured
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    getAPIProvider() === 'bedrock' &&
    isEnvTruthy(process.env.ENABLE_PROMPT_CACHING_1H_BEDROCK)
  ) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // Latch eligibility in bootstrap state for session stability — prevents
  // mid-session overage flips from changing the cache_control TTL, which
  // would bust the server-side prompt cache (~20K tokens per flip).
  // userEligible读取`getPromptCache1hEligible`，供API 服务 claude后续处理使用。
  let userEligible = getPromptCache1hEligible()
  // 满足 `userEligible === null` 时，API 服务 claude执行该分支。
  if (userEligible === null) {
    // API 服务 claude在这里处理 `userEligible =`，完成这一小步状态转换。
    userEligible =
      process.env.USER_TYPE === 'ant' ||
      (isClaudeAISubscriber() && !currentLimits.isUsingOverage)
    // setPromptCache1hEligible 写入新的状态值，使API 服务 claude后续读取保持一致。
    setPromptCache1hEligible(userEligible)
  }
  // userEligible缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
  if (!userEligible) return false

  // Cache allowlist in bootstrap state for session stability — prevents mixed
  // TTLs when GrowthBook's disk cache updates mid-request
  // allowlist 集合读取`getPromptCache1hAllowlist`，供API 服务 claude后续处理使用。
  let allowlist = getPromptCache1hAllowlist()
  // 满足 `allowlist === null` 时，API 服务 claude执行该分支。
  if (allowlist === null) {
    // 配置读取`getFeatureValue_CACHED_MAY_BE_STALE<{`，供后续判断或组装使用。
    const config = getFeatureValue_CACHED_MAY_BE_STALE<{
      allowlist?: string[]
    }>('tengu_prompt_cache_1h_config', {})
    // allowlist 集合更新为 `config.allowlist ?? []`，确保API 服务后续读取最新状态。
    allowlist = config.allowlist ?? []
    // setPromptCache1hAllowlist 写入新的状态值，使API 服务 claude后续读取保持一致。
    setPromptCache1hAllowlist(allowlist)
  }

  // 返回 `(`，作为API 服务 claude这次计算的结果。
  return (
    querySource !== undefined &&
    // 调用 allowlist.some，触发API 服务 claude此处需要的副作用。
    allowlist.some(pattern =>
      pattern.endsWith('*')
        ? querySource.startsWith(pattern.slice(0, -1))
        : querySource === pattern,
    )
  )
}

/**
 * Configure effort parameters for API request.
 *
 */
// configureEffortParams 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function configureEffortParams(
  effortValue: EffortValue | undefined,
  outputConfig: BetaOutputConfig,
  extraBodyParams: Record<string, unknown>,
  betas: string[],
  model: string,
): void {
  // 组合条件 `!modelSupportsEffort(model) || 'effort' in outputConfig` 成立时，API 服务 claude才启用这条专门路径。
  if (!modelSupportsEffort(model) || 'effort' in outputConfig) {
    // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // 满足 `effortValue === undefined` 时，API 服务 claude执行该分支。
  if (effortValue === undefined) {
    // betas 集合追加新条目，保持收集顺序与输入顺序一致。
    betas.push(EFFORT_BETA_HEADER)
  // API 服务 claude在这里处理 `} else if (typeof effortValue === 'string') {`，完成这一小步状态转换。
  } else if (typeof effortValue === 'string') {
    // Send string effort level as is
    // effort更新为 `effortValue`，确保API 服务后续读取最新状态。
    outputConfig.effort = effortValue
    // betas 集合追加新条目，保持收集顺序与输入顺序一致。
    betas.push(EFFORT_BETA_HEADER)
  // API 服务 claude在这里处理 `} else if (process.env.USER_TYPE === 'ant') {`，完成这一小步状态转换。
  } else if (process.env.USER_TYPE === 'ant') {
    // Numeric effort override - ant-only (uses anthropic_internal)
    // existingInternal 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const existingInternal =
      (extraBodyParams.anthropic_internal as Record<string, unknown>) || {}
    // anthropic_internal更新为 `{`，确保API 服务后续读取最新状态。
    extraBodyParams.anthropic_internal = {
      ...existingInternal,
      effort_override: effortValue,
    }
  }
}

// output_config.task_budget — API-side token budget awareness for the model.
// Stainless SDK types don't yet include task_budget on BetaOutputConfig, so we
// define the wire shape locally and cast. The API validates on receipt; see
// api/api/schemas/messages/request/output_config.py:12-39 in the monorepo.
// Beta: task-budgets-2026-03-13 (EAP, claude-strudel-eap only as of Mar 2026).
// TaskBudgetParam 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type TaskBudgetParam = {
  type: 'tokens'
  total: number
  remaining?: number
}

// configureTaskBudgetParams 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function configureTaskBudgetParams(
  taskBudget: Options['taskBudget'],
  outputConfig: BetaOutputConfig & { task_budget?: TaskBudgetParam },
  betas: string[],
): void {
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    !taskBudget ||
    'task_budget' in outputConfig ||
    !shouldIncludeFirstPartyOnlyBetas()
  ) {
    // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // task_budget更新为 `{`，确保API 服务后续读取最新状态。
  outputConfig.task_budget = {
    type: 'tokens',
    total: taskBudget.total,
    ...(taskBudget.remaining !== undefined && {
      remaining: taskBudget.remaining,
    }),
  }
  // 满足 `!betas.includes(TASK_BUDGETS_BETA_HEADER)` 时，API 服务 claude执行该分支。
  if (!betas.includes(TASK_BUDGETS_BETA_HEADER)) {
    // betas 集合追加新条目，保持收集顺序与输入顺序一致。
    betas.push(TASK_BUDGETS_BETA_HEADER)
  }
}

// getAPIMetadata 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getAPIMetadata() {
  // https://docs.google.com/document/d/1dURO9ycXXQCBS0V4Vhl4poDBRgkelFc5t2BNPoEgH5Q/edit?tab=t.0#heading=h.5g7nec5b09w5
  // extra 从空对象开始收集键值，后续按名称补齐内容。
  let extra: JsonObject = {}
  // extraStr 来自环境变量默认值，运行参数仍可在入口处覆盖。
  const extraStr = process.env.CLAUDE_CODE_EXTRA_METADATA
  // 满足 `extraStr` 时，API 服务 claude执行该分支。
  if (extraStr) {
    // 解析结果保存`safeParseJSON`，供API 服务 claude后续处理使用。
    const parsed = safeParseJSON(extraStr, false)
    // 组合条件 `parsed && typeof parsed === 'object' && !Array.isArray(parsed)` 成立时，API 服务 claude才启用这条专门路径。
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // extra更新为 `parsed as JsonObject`，确保API 服务后续读取最新状态。
      extra = parsed as JsonObject
    } else {
      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `CLAUDE_CODE_EXTRA_METADATA env var must be a JSON object, but was given ${extraStr}`,
        { level: 'error' },
      )
    }
  }

  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    user_id: jsonStringify({
      ...extra,
      device_id: getOrCreateUserID(),
      // Only include OAuth account UUID when actively using OAuth authentication
      account_uuid: getOauthAccountInfo()?.accountUuid ?? '',
      session_id: getSessionId(),
    }),
  }
}

// verifyApiKey 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function verifyApiKey(
  apiKey: string,
  isNonInteractiveSession: boolean,
): Promise<boolean> {
  // Skip API verification if running in print mode (isNonInteractiveSession)
  // 满足 `isNonInteractiveSession` 时，API 服务 claude执行该分支。
  if (isNonInteractiveSession) {
    // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
    return true
  }

  // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
  try {
    // WARNING: if you change this to use a non-Haiku model, this request will fail in 1P unless it uses getCLISyspromptPrefix.
    // 模型名称读取`getSmallFastModel`，供API 服务 claude后续处理使用。
    const model = getSmallFastModel()
    // betas 集合读取`getModelBetas`，供API 服务 claude后续处理使用。
    const betas = getModelBetas(model)
    // 等待并返回 `returnValue(`，调用方直接接收异步结果。
    return await returnValue(
      withRetry(
        // 这个回调绑定到 () =>，负责API 服务 claude在该局部场景下的响应。
        () =>
          getAnthropicClient({
            apiKey,
            maxRetries: 3,
            model,
            source: 'verify_api_key',
          }),
        // 这个回调绑定到 async anthropic => {，负责API 服务 claude在该局部场景下的响应。
        async anthropic => {
          // 对话消息 聚合成有序列表，保持后续遍历顺序稳定。
          const messages: MessageParam[] = [{ role: 'user', content: 'test' }]
          // biome-ignore lint/plugin: API key verification is intentionally a minimal direct call
          // 等待 `anthropic.beta.messages.create({` 完成，再继续API 服务 claude的异步流程。
          await anthropic.beta.messages.create({
            model,
            max_tokens: 1,
            messages,
            temperature: 1,
            ...(betas.length > 0 && { betas }),
            metadata: getAPIMetadata(),
            ...getExtraBodyParams(),
          })
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        },
        { maxRetries: 2, model, thinkingConfig: { type: 'disabled' } }, // Use fewer retries for API key verification
      ),
    )
  } catch (errorFromRetry) {
    // 错误 命名 `errorFromRetry`，让后续代码直接表达这个值的用途。
    let error = errorFromRetry
    // 满足 `errorFromRetry instanceof CannotRetryError` 时，API 服务 claude执行该分支。
    if (errorFromRetry instanceof CannotRetryError) {
      // 错误更新为 `errorFromRetry.originalError`，确保API 服务后续读取最新状态。
      error = errorFromRetry.originalError
    }
    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
    logError(error)
    // Check for authentication error
    // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
    if (
      error instanceof Error &&
      error.message.includes(
        '{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}',
      )
    ) {
      // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
      return false
    }
    // 抛出 error，阻止API 服务 claude在无效状态下继续运行。
    throw error
  }
}

// userMessageToMessageParam 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function userMessageToMessageParam(
  message: UserMessage,
  addCache = false,
  enablePromptCaching: boolean,
  querySource?: QuerySource,
): MessageParam {
  // 满足 `addCache` 时，API 服务 claude执行该分支。
  if (addCache) {
    // 当 `typeof message.message.content` 匹配 `'string'` 时，API 服务 claude执行对应分支。
    if (typeof message.message.content === 'string') {
      // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
      return {
        role: 'user',
        content: [
          {
            type: 'text',
            text: message.message.content,
            ...(enablePromptCaching && {
              cache_control: getCacheControl({ querySource }),
            }),
          },
        ],
      }
    } else {
      // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
      return {
        role: 'user',
        // 这个回调绑定到 content: message.message.content.map((_, i) => ({，负责API 服务 claude在该局部场景下的响应。
        content: message.message.content.map((_, i) => ({
          ..._,
          ...(i === message.message.content.length - 1
            ? enablePromptCaching
              ? { cache_control: getCacheControl({ querySource }) }
              : {}
            : {}),
        })),
      }
    }
  }
  // Clone array content to prevent in-place mutations (e.g., insertCacheEditsBlock's
  // splice) from contaminating the original message. Without cloning, multiple calls
  // to addCacheBreakpoints share the same array and each splices in duplicate cache_edits.
  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    role: 'user',
    content: Array.isArray(message.message.content)
      ? [...message.message.content]
      : message.message.content,
  }
}

// assistantMessageToMessageParam 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function assistantMessageToMessageParam(
  message: AssistantMessage,
  addCache = false,
  enablePromptCaching: boolean,
  querySource?: QuerySource,
): MessageParam {
  // 满足 `addCache` 时，API 服务 claude执行该分支。
  if (addCache) {
    // 当 `typeof message.message.content` 匹配 `'string'` 时，API 服务 claude执行对应分支。
    if (typeof message.message.content === 'string') {
      // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
      return {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: message.message.content,
            ...(enablePromptCaching && {
              cache_control: getCacheControl({ querySource }),
            }),
          },
        ],
      }
    } else {
      // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
      return {
        role: 'assistant',
        // 这个回调绑定到 content: message.message.content.map((_, i) => ({，负责API 服务 claude在该局部场景下的响应。
        content: message.message.content.map((_, i) => ({
          ..._,
          ...(i === message.message.content.length - 1 &&
          _.type !== 'thinking' &&
          _.type !== 'redacted_thinking' &&
          (feature('CONNECTOR_TEXT') ? !isConnectorTextBlock(_) : true)
            ? enablePromptCaching
              ? { cache_control: getCacheControl({ querySource }) }
              : {}
            : {}),
        })),
      }
    }
  }
  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    role: 'assistant',
    content: message.message.content,
  }
}

// Options 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
export type Options = {
  // 这个回调绑定到 getToolPermissionContext: () => Promise<ToolPermissionContext>，负责API 服务 claude在该局部场景下的响应。
  getToolPermissionContext: () => Promise<ToolPermissionContext>
  model: string
  toolChoice?: BetaToolChoiceTool | BetaToolChoiceAuto | undefined
  isNonInteractiveSession: boolean
  extraToolSchemas?: BetaToolUnion[]
  maxOutputTokensOverride?: number
  fallbackModel?: string
  // 这个回调绑定到 onStreamingFallback?: () => void，负责API 服务 claude在该局部场景下的响应。
  onStreamingFallback?: () => void
  querySource: QuerySource
  agents: AgentDefinition[]
  allowedAgentTypes?: string[]
  hasAppendSystemPrompt: boolean
  fetchOverride?: ClientOptions['fetch']
  enablePromptCaching?: boolean
  skipCacheWrite?: boolean
  temperatureOverride?: number
  effortValue?: EffortValue
  mcpTools: Tools
  hasPendingMcpServers?: boolean
  queryTracking?: QueryChainTracking
  agentId?: AgentId // Only set for subagents
  outputFormat?: BetaJSONOutputFormat
  fastMode?: boolean
  advisorModel?: string
  // 这个回调绑定到 addNotification?: (notif: Notification) => void，负责API 服务 claude在该局部场景下的响应。
  addNotification?: (notif: Notification) => void
  // API-side task budget (output_config.task_budget). Distinct from the
  // tokenBudget.ts +500k auto-continue feature — this one is sent to the API
  // so the model can pace itself. `remaining` is computed by the caller
  // (query.ts decrements across the agentic loop).
  taskBudget?: { total: number; remaining?: number }
}

// queryModelWithoutStreaming 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function queryModelWithoutStreaming({
  messages,
  systemPrompt,
  thinkingConfig,
  tools,
  signal,
  options,
}: {
  messages: Message[]
  systemPrompt: SystemPrompt
  thinkingConfig: ThinkingConfig
  tools: Tools
  signal: AbortSignal
  options: Options
}): Promise<AssistantMessage> {
  // Store the assistant message but continue consuming the generator to ensure
  // logAPISuccessAndDuration gets called (which happens after all yields)
  // assistantMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let assistantMessage: AssistantMessage | undefined
  // 逐项读取 `withStreamingVCR(messages, async function* (` 中的消息，按输入顺序推进API 服务 claude。
  for await (const message of withStreamingVCR(messages, async function* () {
    // 生成器产出 `yield* queryModel(`，把阶段性结果交给上层消费。
    yield* queryModel(
      messages,
      systemPrompt,
      thinkingConfig,
      tools,
      signal,
      options,
    )
  })) {
    // 当 `message.type` 匹配 `'assistant'` 时，API 服务 claude执行对应分支。
    if (message.type === 'assistant') {
      // assistantMessage 消息数据更新为 `message`，确保API 服务后续读取最新状态。
      assistantMessage = message
    }
  }
  // assistantMessage 消息数据缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
  if (!assistantMessage) {
    // If the signal was aborted, throw APIUserAbortError instead of a generic error
    // This allows callers to handle abort scenarios gracefully
    // 满足 `signal.aborted` 时，API 服务 claude执行该分支。
    if (signal.aborted) {
      // 抛出 new APIUserAbortError()，阻止API 服务 claude在无效状态下继续运行。
      throw new APIUserAbortError()
    }
    // 抛出 new Error('No assistant message found')，阻止API 服务 claude在无效状态下继续运行。
    throw new Error('No assistant message found')
  }
  // 返回 `assistantMessage`，作为API 服务 claude这次计算的结果。
  return assistantMessage
}

// API 服务 claude在这里处理 `export async function* queryModelWithStreaming({`，完成这一小步状态转换。
export async function* queryModelWithStreaming({
  messages,
  systemPrompt,
  thinkingConfig,
  tools,
  signal,
  options,
}: {
  messages: Message[]
  systemPrompt: SystemPrompt
  thinkingConfig: ThinkingConfig
  tools: Tools
  signal: AbortSignal
  options: Options
}): AsyncGenerator<
  StreamEvent | AssistantMessage | SystemAPIErrorMessage,
  void
> {
  // 返回 `yield* withStreamingVCR(messages, async function* () {`，作为API 服务 claude这次计算的结果。
  return yield* withStreamingVCR(messages, async function* () {
    // 生成器产出 `yield* queryModel(`，把阶段性结果交给上层消费。
    yield* queryModel(
      messages,
      systemPrompt,
      thinkingConfig,
      tools,
      signal,
      options,
    )
  })
}

/**
 * Determines if an LSP tool should be deferred (tool appears with defer_loading: true)
 * because LSP initialization is not yet complete.
 */
// shouldDeferLspTool 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function shouldDeferLspTool(tool: Tool): boolean {
  // 组合条件 `!('isLsp' in tool) || !tool.isLsp` 成立时，API 服务 claude才启用这条专门路径。
  if (!('isLsp' in tool) || !tool.isLsp) {
    // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
    return false
  }
  // status 集合读取`getInitializationStatus`，供API 服务 claude后续处理使用。
  const status = getInitializationStatus()
  // Defer when pending or not started
  // 返回 `status.status === 'pending' || status.status === 'not-started'`，作为API 服务 claude这次计算的结果。
  return status.status === 'pending' || status.status === 'not-started'
}

/**
 * Per-attempt timeout for non-streaming fallback requests, in milliseconds.
 * Reads API_TIMEOUT_MS when set so slow backends and the streaming path
 * share the same ceiling.
 *
 * Remote sessions default to 120s to stay under CCR's container idle-kill
 * (~5min) so a hung fallback to a wedged backend surfaces a clean
 * APIConnectionTimeoutError instead of stalling past SIGKILL.
 *
 * Otherwise defaults to 300s — long enough for slow backends without
 * approaching the API's 10-minute non-streaming boundary.
 */
// getNonstreamingFallbackTimeoutMs 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getNonstreamingFallbackTimeoutMs(): number {
  // override解析`parseInt`，供API 服务 claude后续处理使用。
  const override = parseInt(process.env.API_TIMEOUT_MS || '', 10)
  // 满足 `override` 时，API 服务 claude执行该分支。
  if (override) return override
  // 返回 `isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) ? 120_000 : 300_000`，作为API 服务 claude这次计算的结果。
  return isEnvTruthy(process.env.CLAUDE_CODE_REMOTE) ? 120_000 : 300_000
}

/**
 * Helper generator for non-streaming API requests.
 * Encapsulates the common pattern of creating a withRetry generator,
 * iterating to yield system messages, and returning the final BetaMessage.
 */
// API 服务 claude在这里处理 `export async function* executeNonStreamingRequest(`，完成这一小步状态转换。
export async function* executeNonStreamingRequest(
  clientOptions: {
    model: string
    fetchOverride?: Options['fetchOverride']
    source: string
  },
  retryOptions: {
    model: string
    fallbackModel?: string
    thinkingConfig: ThinkingConfig
    fastMode?: boolean
    signal: AbortSignal
    initialConsecutive529Errors?: number
    querySource?: QuerySource
  },
  // 这个回调绑定到 paramsFromContext: (context: RetryContext) => BetaMessageStreamParams,，负责API 服务 claude在该局部场景下的响应。
  paramsFromContext: (context: RetryContext) => BetaMessageStreamParams,
  // 这个回调绑定到 onAttempt: (attempt: number, start: number, maxOutputTokens: number) => void,，负责API 服务 claude在该局部场景下的响应。
  onAttempt: (attempt: number, start: number, maxOutputTokens: number) => void,
  // 这个回调绑定到 captureRequest: (params: BetaMessageStreamParams) => void,，负责API 服务 claude在该局部场景下的响应。
  captureRequest: (params: BetaMessageStreamParams) => void,
  /**
   * Request ID of the failed streaming attempt this fallback is recovering
   * from. Emitted in tengu_nonstreaming_fallback_error for funnel correlation.
   */
  originatingRequestId?: string | null,
): AsyncGenerator<SystemAPIErrorMessage, BetaMessage> {
  // fallbackTimeoutMs 集合读取`getNonstreamingFallbackTimeoutMs`，供API 服务 claude后续处理使用。
  const fallbackTimeoutMs = getNonstreamingFallbackTimeoutMs()
  // generator保存`withRetry`，供API 服务 claude后续处理使用。
  const generator = withRetry(
    // 这个回调绑定到 () =>，负责API 服务 claude在该局部场景下的响应。
    () =>
      getAnthropicClient({
        maxRetries: 0,
        model: clientOptions.model,
        fetchOverride: clientOptions.fetchOverride,
        source: clientOptions.source,
      }),
    // 调用 async，触发API 服务 claude此处需要的副作用。
    async (anthropic, attempt, context) => {
      // start记录时间`Date.now`，供API 服务 claude后续处理使用。
      const start = Date.now()
      // retryParams 集合保存`paramsFromContext`，供API 服务 claude后续处理使用。
      const retryParams = paramsFromContext(context)
      // 调用 captureRequest，触发API 服务 claude此处需要的副作用。
      captureRequest(retryParams)
      // 调用 onAttempt，触发API 服务 claude此处需要的副作用。
      onAttempt(attempt, start, retryParams.max_tokens)

      // adjustedParams 集合保存`adjustParamsForNonStreaming`，供API 服务 claude后续处理使用。
      const adjustedParams = adjustParamsForNonStreaming(
        retryParams,
        MAX_NON_STREAMING_TOKENS,
      )

      // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
      try {
        // biome-ignore lint/plugin: non-streaming API call
        // 等待并返回 `anthropic.beta.messages.create(`，调用方直接接收异步结果。
        return await anthropic.beta.messages.create(
          {
            ...adjustedParams,
            model: normalizeModelStringForAPI(adjustedParams.model),
          },
          {
            signal: retryOptions.signal,
            timeout: fallbackTimeoutMs,
          },
        )
      } catch (err) {
        // User aborts are not errors — re-throw immediately without logging
        // 满足 `err instanceof APIUserAbortError` 时，API 服务 claude执行该分支。
        if (err instanceof APIUserAbortError) throw err

        // Instrumentation: record when the non-streaming request errors (including
        // timeouts). Lets us distinguish "fallback hung past container kill"
        // (no event) from "fallback hit the bounded timeout" (this event).
        // 调用 logForDiagnosticsNoPII，触发API 服务 claude此处需要的副作用。
        logForDiagnosticsNoPII('error', 'cli_nonstreaming_fallback_error')
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_nonstreaming_fallback_error', {
          model:
            clientOptions.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          error:
            err instanceof Error
              ? (err.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
              : ('unknown' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS),
          attempt,
          timeout_ms: fallbackTimeoutMs,
          request_id: (originatingRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 抛出 err，阻止API 服务 claude在无效状态下继续运行。
        throw err
      }
    },
    {
      model: retryOptions.model,
      fallbackModel: retryOptions.fallbackModel,
      thinkingConfig: retryOptions.thinkingConfig,
      ...(isFastModeEnabled() && { fastMode: retryOptions.fastMode }),
      signal: retryOptions.signal,
      initialConsecutive529Errors: retryOptions.initialConsecutive529Errors,
      querySource: retryOptions.querySource,
    },
  )

  // e 的赋值跨多行展开，先保留变量名再读取后续表达式。
  let e
  // 先执行一次循环体，再按尾部条件决定是否继续API 服务 claude处理。
  do {
    // e更新为 `await generator.next()`，确保API 服务后续读取最新状态。
    e = await generator.next()
    // 当 `!e.done && e.value.type` 匹配 `'system'` 时，API 服务 claude执行对应分支。
    if (!e.done && e.value.type === 'system') {
      // 生成器产出 `e.value`，把阶段性结果交给上层消费。
      yield e.value
    }
  } while (!e.done)

  // 返回 `e.value as BetaMessage`，作为API 服务 claude这次计算的结果。
  return e.value as BetaMessage
}

/**
 * Extracts the request ID from the most recent assistant message in the
 * conversation. Used to link consecutive API requests in analytics so we can
 * join them for cache-hit-rate analysis and incremental token tracking.
 *
 * Deriving this from the message array (rather than global state) ensures each
 * query chain (main thread, subagent, teammate) tracks its own request chain
 * independently, and rollback/undo naturally updates the value.
 */
// getPreviousRequestIdFromMessages 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function getPreviousRequestIdFromMessages(
  messages: Message[],
): string | undefined {
  // 循环处理 `let i = messages.length - 1; i >= 0; i--`，让API 服务 claude逐项把同类条目按顺序走完。
  for (let i = messages.length - 1; i >= 0; i--) {
    // 消息保存`messages[i]!`，供API 服务 claude后续判断或输出使用。
    const msg = messages[i]!
    // 组合条件 `msg.type === 'assistant' && msg.requestId` 成立时，API 服务 claude才启用这条专门路径。
    if (msg.type === 'assistant' && msg.requestId) {
      // 返回 `msg.requestId`，作为API 服务 claude这次计算的结果。
      return msg.requestId
    }
  }
  // 返回 `undefined`，作为API 服务 claude这次计算的结果。
  return undefined
}

// isMedia 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMedia(
  block: BetaContentBlockParam,
): block is BetaImageBlockParam | BetaRequestDocumentBlock {
  // 返回 `block.type === 'image' || block.type === 'document'`，作为API 服务 claude这次计算的结果。
  return block.type === 'image' || block.type === 'document'
}

// isToolResult 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolResult(
  block: BetaContentBlockParam,
): block is BetaToolResultBlockParam {
  // 返回 `block.type === 'tool_result'`，作为API 服务 claude这次计算的结果。
  return block.type === 'tool_result'
}

/**
 * Ensures messages contain at most `limit` media items (images + documents).
 * Strips oldest media first to preserve the most recent.
 */
// stripExcessMediaItems 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function stripExcessMediaItems(
  messages: (UserMessage | AssistantMessage)[],
  limit: number,
): (UserMessage | AssistantMessage)[] {
  // toRemove保存`0`，供后续判断或组装使用。
  let toRemove = 0
  // 按顺序遍历 `messages` 中的消息，逐个交给API 服务 claude处理。
  for (const msg of messages) {
    // 满足 `!Array.isArray(msg.message.content)` 时，API 服务 claude执行该分支。
    if (!Array.isArray(msg.message.content)) continue
    // 按顺序遍历 `msg.message.content` 中的block，逐个交给API 服务 claude处理。
    for (const block of msg.message.content) {
      // 满足 `isMedia(block)` 时，API 服务 claude执行该分支。
      if (isMedia(block)) toRemove++
      // 组合条件 `isToolResult(block) && Array.isArray(block.content)` 成立时，API 服务 claude才启用这条专门路径。
      if (isToolResult(block) && Array.isArray(block.content)) {
        // 按顺序遍历 `block.content` 中的nested，逐个交给API 服务 claude处理。
        for (const nested of block.content) {
          // 满足 `isMedia(nested)` 时，API 服务 claude执行该分支。
          if (isMedia(nested)) toRemove++
        }
      }
    }
  }
  // API 服务 claude在这里处理 `toRemove -= limit`，完成这一小步状态转换。
  toRemove -= limit
  // 满足 `toRemove <= 0` 时，API 服务 claude执行该分支。
  if (toRemove <= 0) return messages

  // 返回 `messages.map(msg => {`，作为API 服务 claude这次计算的结果。
  return messages.map(msg => {
    // 满足 `toRemove <= 0` 时，API 服务 claude执行该分支。
    if (toRemove <= 0) return msg
    // 文本内容保存`msg.message.content`，供API 服务 claude后续判断或输出使用。
    const content = msg.message.content
    // 满足 `!Array.isArray(content)` 时，API 服务 claude执行该分支。
    if (!Array.isArray(content)) return msg

    // before保存`toRemove`，供后续判断或组装使用。
    const before = toRemove
    // stripped保存`content`，供API 服务 claude后续判断或输出使用。
    const stripped = content
      // 链式调用 map，继续加工上一行在API 服务 claude中产生的数据。
      .map(block => {
        // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
        if (
          toRemove <= 0 ||
          !isToolResult(block) ||
          !Array.isArray(block.content)
        )
          // 返回 `block`，作为API 服务 claude这次计算的结果。
          return block
        // filtered筛选`content.filter`，供API 服务 claude后续处理使用。
        const filtered = block.content.filter(n => {
          // 组合条件 `toRemove > 0 && isMedia(n)` 成立时，API 服务 claude才启用这条专门路径。
          if (toRemove > 0 && isMedia(n)) {
            // API 服务 claude在这里处理 `toRemove--`，完成这一小步状态转换。
            toRemove--
            // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
            return false
          }
          // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
          return true
        })
        // 返回 `filtered.length === block.content.length`，作为API 服务 claude这次计算的结果。
        return filtered.length === block.content.length
          ? block
          : { ...block, content: filtered }
      })
      // 链式调用 filter，继续加工上一行在API 服务 claude中产生的数据。
      .filter(block => {
        // 组合条件 `toRemove > 0 && isMedia(block)` 成立时，API 服务 claude才启用这条专门路径。
        if (toRemove > 0 && isMedia(block)) {
          // API 服务 claude在这里处理 `toRemove--`，完成这一小步状态转换。
          toRemove--
          // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
          return false
        }
        // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
        return true
      })

    // 返回 `before === toRemove`，作为API 服务 claude这次计算的结果。
    return before === toRemove
      ? msg
      : {
          ...msg,
          message: { ...msg.message, content: stripped },
        }
  }) as (UserMessage | AssistantMessage)[]
}

// API 服务 claude在这里处理 `async function* queryModel(`，完成这一小步状态转换。
async function* queryModel(
  messages: Message[],
  systemPrompt: SystemPrompt,
  thinkingConfig: ThinkingConfig,
  tools: Tools,
  signal: AbortSignal,
  options: Options,
): AsyncGenerator<
  StreamEvent | AssistantMessage | SystemAPIErrorMessage,
  void
> {
  // Check cheap conditions first — the off-switch await blocks on GrowthBook
  // init (~10ms). For non-Opus models (haiku, sonnet) this skips the await
  // entirely. Subscribers don't hit this path at all.
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    !isClaudeAISubscriber() &&
    isNonCustomOpusModel(options.model) &&
    (
      await getDynamicConfig_BLOCKS_ON_INIT<{ activated: boolean }>(
        'tengu-off-switch',
        {
          activated: false,
        },
      )
    ).activated
  ) {
    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
    logEvent('tengu_off_switch_query', {})
    // 生成器产出 `getAssistantMessageFromError(`，把阶段性结果交给上层消费。
    yield getAssistantMessageFromError(
      new Error(CUSTOM_OFF_SWITCH_MESSAGE),
      options.model,
    )
    // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }

  // Derive previous request ID from the last assistant message in this query chain.
  // This is scoped per message array (main thread, subagent, teammate each have their own),
  // so concurrent agents don't clobber each other's request chain tracking.
  // Also naturally handles rollback/undo since removed messages won't be in the array.
  // previousRequestId 请求数据读取`getPreviousRequestIdFromMessages`，供API 服务 claude后续处理使用。
  const previousRequestId = getPreviousRequestIdFromMessages(messages)

  // resolvedModel 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const resolvedModel =
    getAPIProvider() === 'bedrock' &&
    options.model.includes('application-inference-profile')
      ? ((await getInferenceProfileBackingModel(options.model)) ??
        options.model)
      : options.model

  // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
  queryCheckpoint('query_tool_schema_build_start')
  // isAgenticQuery 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isAgenticQuery =
    options.querySource.startsWith('repl_main_thread') ||
    options.querySource.startsWith('agent:') ||
    options.querySource === 'sdk' ||
    options.querySource === 'hook_agent' ||
    options.querySource === 'verification_agent'
  // betas 集合读取`getMergedBetas`，供API 服务 claude后续处理使用。
  const betas = getMergedBetas(options.model, { isAgenticQuery })

  // Always send the advisor beta header when advisor is enabled, so
  // non-agentic queries (compact, side_question, extract_memories, etc.)
  // can parse advisor server_tool_use blocks already in the conversation history.
  // 满足 `isAdvisorEnabled()` 时，API 服务 claude执行该分支。
  if (isAdvisorEnabled()) {
    // betas 集合追加新条目，保持收集顺序与输入顺序一致。
    betas.push(ADVISOR_BETA_HEADER)
  }

  // advisorModel 先占位，稍后的条件分支会根据实际输入补齐它。
  let advisorModel: string | undefined
  // 组合条件 `isAgenticQuery && isAdvisorEnabled()` 成立时，API 服务 claude才启用这条专门路径。
  if (isAgenticQuery && isAdvisorEnabled()) {
    // advisorOption保存`options.advisorModel`，供后续判断或组装使用。
    let advisorOption = options.advisorModel

    // advisorExperiment读取`getExperimentAdvisorModels`，供API 服务 claude后续处理使用。
    const advisorExperiment = getExperimentAdvisorModels()
    // `advisorExperiment` 与 `undefined` 不一致时刷新派生状态，避免使用过期结果。
    if (advisorExperiment !== undefined) {
      // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
      if (
        normalizeModelStringForAPI(advisorExperiment.baseModel) ===
        normalizeModelStringForAPI(options.model)
      ) {
        // Override the advisor model if the base model matches. We
        // should only have experiment models if the user cannot
        // configure it themselves.
        // advisorOption更新为 `advisorExperiment.advisorModel`，确保API 服务后续读取最新状态。
        advisorOption = advisorExperiment.advisorModel
      }
    }

    // 满足 `advisorOption` 时，API 服务 claude执行该分支。
    if (advisorOption) {
      // normalizedAdvisorModel保存`normalizeModelStringForAPI`，供API 服务 claude后续处理使用。
      const normalizedAdvisorModel = normalizeModelStringForAPI(
        parseUserSpecifiedModel(advisorOption),
      )
      // 满足 `!modelSupportsAdvisor(options.model)` 时，API 服务 claude执行该分支。
      if (!modelSupportsAdvisor(options.model)) {
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[AdvisorTool] Skipping advisor - base model ${options.model} does not support advisor`,
        )
      // API 服务 claude在这里处理 `} else if (!isValidAdvisorModel(normalizedAdvisorModel)) {`，完成这一小步状态转换。
      } else if (!isValidAdvisorModel(normalizedAdvisorModel)) {
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[AdvisorTool] Skipping advisor - ${normalizedAdvisorModel} is not a valid advisor model`,
        )
      } else {
        // advisorModel更新为 `normalizedAdvisorModel`，确保API 服务后续读取最新状态。
        advisorModel = normalizedAdvisorModel
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `[AdvisorTool] Server-side tool enabled with ${advisorModel} as the advisor model`,
        )
      }
    }
  }

  // Check if tool search is enabled (checks mode, model support, and threshold for auto mode)
  // This is async because it may need to calculate MCP tool description sizes for TstAuto mode
  // useToolSearch保存`isToolSearchEnabled`，供API 服务 claude后续处理使用。
  let useToolSearch = await isToolSearchEnabled(
    options.model,
    tools,
    options.getToolPermissionContext,
    options.agents,
    'query',
  )

  // Precompute once — isDeferredTool does 2 GrowthBook lookups per call
  // deferredToolNames 集合构建`new Set<string>()`，供后续判断或组装使用。
  const deferredToolNames = new Set<string>()
  // 满足 `useToolSearch` 时，API 服务 claude执行该分支。
  if (useToolSearch) {
    // 按顺序遍历 `tools` 中的t，逐个交给API 服务 claude处理。
    for (const t of tools) {
      // 满足 `isDeferredTool(t)) deferredToolNames.add(t.name` 时，API 服务 claude执行该分支。
      if (isDeferredTool(t)) deferredToolNames.add(t.name)
    }
  }

  // Even if tool search mode is enabled, skip if there are no deferred tools
  // AND no MCP servers are still connecting. When servers are pending, keep
  // ToolSearch available so the model can discover tools after they connect.
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    useToolSearch &&
    deferredToolNames.size === 0 &&
    !options.hasPendingMcpServers
  ) {
    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      'Tool search disabled: no deferred tools available to search',
    )
    // useToolSearch更新为 `false`，确保API 服务后续读取最新状态。
    useToolSearch = false
  }

  // Filter out ToolSearchTool if tool search is not enabled for this model
  // ToolSearchTool returns tool_reference blocks which unsupported models can't handle
  // filteredTools 集合 先占位，稍后的条件分支会根据实际输入补齐它。
  let filteredTools: Tools

  // 满足 `useToolSearch` 时，API 服务 claude执行该分支。
  if (useToolSearch) {
    // Dynamic tool loading: Only include deferred tools that have been discovered
    // via tool_reference blocks in the message history. This eliminates the need
    // to predeclare all deferred tools upfront and removes limits on tool quantity.
    // discoveredToolNames 集合保存`extractDiscoveredToolNames`，供API 服务 claude后续处理使用。
    const discoveredToolNames = extractDiscoveredToolNames(messages)

    // filteredTools 集合更新为 `tools.filter(tool => {`，确保API 服务后续读取最新状态。
    filteredTools = tools.filter(tool => {
      // Always include non-deferred tools
      // 满足 `!deferredToolNames.has(tool.name)` 时，API 服务 claude执行该分支。
      if (!deferredToolNames.has(tool.name)) return true
      // Always include ToolSearchTool (so it can discover more tools)
      // 满足 `toolMatchesName(tool, TOOL_SEARCH_TOOL_NAME)` 时，API 服务 claude执行该分支。
      if (toolMatchesName(tool, TOOL_SEARCH_TOOL_NAME)) return true
      // Only include deferred tools that have been discovered
      // 返回 `discoveredToolNames.has(tool.name)`，作为API 服务 claude这次计算的结果。
      return discoveredToolNames.has(tool.name)
    })
  } else {
    // filteredTools 集合更新为 `tools.filter(`，确保API 服务后续读取最新状态。
    filteredTools = tools.filter(
      // t更新为 `> !toolMatchesName(t, TOOL_SEARCH_TOOL_NAME)`，确保API 服务后续读取最新状态。
      t => !toolMatchesName(t, TOOL_SEARCH_TOOL_NAME),
    )
  }

  // Add tool search beta header if enabled - required for defer_loading to be accepted
  // Header differs by provider: 1P/Foundry use advanced-tool-use, Vertex/Bedrock use tool-search-tool
  // For Bedrock, this header must go in extraBodyParams, not the betas array
  // toolSearchHeader读取`getToolSearchBetaHeader`，供API 服务 claude后续处理使用。
  const toolSearchHeader = useToolSearch ? getToolSearchBetaHeader() : null
  // `toolSearchHeader && getAPIProvider()` 与 `'bedrock'` 不一致时刷新派生状态，避免使用过期结果。
  if (toolSearchHeader && getAPIProvider() !== 'bedrock') {
    // 满足 `!betas.includes(toolSearchHeader)` 时，API 服务 claude执行该分支。
    if (!betas.includes(toolSearchHeader)) {
      // betas 集合追加新条目，保持收集顺序与输入顺序一致。
      betas.push(toolSearchHeader)
    }
  }

  // Determine if cached microcompact is enabled for this model.
  // Computed once here (in async context) and captured by paramsFromContext.
  // The beta header is also captured here to avoid a top-level import of the
  // ant-only CACHE_EDITING_BETA_HEADER constant.
  // cachedMCEnabled 缓存标记API 服务 claude是否启用对应路径。
  let cachedMCEnabled = false
  // cacheEditingBetaHeader 缓存固定为 `''`，作为API 服务 claude后续展示或比较的基准。
  let cacheEditingBetaHeader = ''
  // 满足 `feature('CACHED_MICROCOMPACT')` 时，API 服务 claude执行该分支。
  if (feature('CACHED_MICROCOMPACT')) {
    // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
    const {
      isCachedMicrocompactEnabled,
      isModelSupportedForCacheEditing,
      getCachedMCConfig,
    } = await import('../compact/cachedMicrocompact.js')
    // betas 集合保存`import`，供API 服务 claude后续处理使用。
    const betas = await import('src/constants/betas.js')
    // cacheEditingBetaHeader 缓存更新为 `betas.CACHE_EDITING_BETA_HEADER`，确保API 服务后续读取最新状态。
    cacheEditingBetaHeader = betas.CACHE_EDITING_BETA_HEADER
    // featureEnabled保存`isCachedMicrocompactEnabled`，供API 服务 claude后续处理使用。
    const featureEnabled = isCachedMicrocompactEnabled()
    // modelSupported保存`isModelSupportedForCacheEditing`，供API 服务 claude后续处理使用。
    const modelSupported = isModelSupportedForCacheEditing(options.model)
    // cachedMCEnabled 缓存更新为 `featureEnabled && modelSupported`，确保API 服务后续读取最新状态。
    cachedMCEnabled = featureEnabled && modelSupported
    // 配置读取`getCachedMCConfig`，供API 服务 claude后续处理使用。
    const config = getCachedMCConfig()
    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Cached MC gate: enabled=${featureEnabled} modelSupported=${modelSupported} model=${options.model} supportedModels=${jsonStringify(config.supportedModels)}`,
    )
  }

  // useGlobalCacheFeature 缓存保存`shouldUseGlobalCacheScope`，供API 服务 claude后续处理使用。
  const useGlobalCacheFeature = shouldUseGlobalCacheScope()
  // willDefer封装成回调，供API 服务 claude在事件触发或异步步骤中调用。
  const willDefer = (t: Tool) =>
    useToolSearch && (deferredToolNames.has(t.name) || shouldDeferLspTool(t))
  // MCP tools are per-user → dynamic tool section → can't globally cache.
  // Only gate when an MCP tool will actually render (not defer_loading).
  // needsToolBasedCacheMarker 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const needsToolBasedCacheMarker =
    useGlobalCacheFeature &&
    // 调用 filteredTools.some，触发API 服务 claude此处需要的副作用。
    filteredTools.some(t => t.isMcp === true && !willDefer(t))

  // Ensure prompt_caching_scope beta header is present when global cache is enabled.
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    useGlobalCacheFeature &&
    !betas.includes(PROMPT_CACHING_SCOPE_BETA_HEADER)
  ) {
    // betas 集合追加新条目，保持收集顺序与输入顺序一致。
    betas.push(PROMPT_CACHING_SCOPE_BETA_HEADER)
  }

  // Determine global cache strategy for logging
  // globalCacheStrategy 缓存读取 hook 状态，供API 服务 claude本轮渲染使用。
  const globalCacheStrategy: GlobalCacheStrategy = useGlobalCacheFeature
    ? needsToolBasedCacheMarker
      ? 'none'
      : 'system_prompt'
    : 'none'

  // Build tool schemas, adding defer_loading for MCP tools when tool search is enabled
  // Note: We pass the full `tools` list (not filteredTools) to toolToAPISchema so that
  // ToolSearchTool's prompt can list ALL available MCP tools. The filtering only affects
  // which tools are actually sent to the API, not what the model sees in tool descriptions.
  // toolSchemas 集合保存`Promise.all`，供API 服务 claude后续处理使用。
  const toolSchemas = await Promise.all(
    // 调用 filteredTools.map，触发API 服务 claude此处需要的副作用。
    filteredTools.map(tool =>
      toolToAPISchema(tool, {
        getToolPermissionContext: options.getToolPermissionContext,
        tools,
        agents: options.agents,
        allowedAgentTypes: options.allowedAgentTypes,
        model: options.model,
        deferLoading: willDefer(tool),
      }),
    ),
  )

  // 满足 `useToolSearch` 时，API 服务 claude执行该分支。
  if (useToolSearch) {
    // includedDeferredTools 集合统计`count`，供API 服务 claude后续处理使用。
    const includedDeferredTools = count(filteredTools, t =>
      deferredToolNames.has(t.name),
    )
    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
    logForDebugging(
      `Dynamic tool loading: ${includedDeferredTools}/${deferredToolNames.size} deferred tools included`,
    )
  }

  // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
  queryCheckpoint('query_tool_schema_build_end')

  // Normalize messages before building system prompt (needed for fingerprinting)
  // Instrumentation: Track message count before normalization
  // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_before_normalize', {
    preNormalizedMessageCount: messages.length,
  })

  // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
  queryCheckpoint('query_message_normalization_start')
  // messagesForAPI 消息数据保存`normalizeMessagesForAPI`，供API 服务 claude后续处理使用。
  let messagesForAPI = normalizeMessagesForAPI(messages, filteredTools)
  // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
  queryCheckpoint('query_message_normalization_end')

  // Model-specific post-processing: strip tool-search-specific fields if the
  // selected model doesn't support tool search.
  //
  // Why is this needed in addition to normalizeMessagesForAPI?
  // - normalizeMessagesForAPI uses isToolSearchEnabledNoModelCheck() because it's
  //   called from ~20 places (analytics, feedback, sharing, etc.), many of which
  //   don't have model context. Adding model to its signature would be a large refactor.
  // - This post-processing uses the model-aware isToolSearchEnabled() check
  // - This handles mid-conversation model switching (e.g., Sonnet → Haiku) where
  //   stale tool-search fields from the previous model would cause 400 errors
  //
  // Note: For assistant messages, normalizeMessagesForAPI already normalized the
  // tool inputs, so stripCallerFieldFromAssistantMessage only needs to remove the
  // 'caller' field (not re-normalize inputs).
  // useToolSearch缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
  if (!useToolSearch) {
    // messagesForAPI 消息数据更新为 `messagesForAPI.map(msg => {`，确保API 服务后续读取最新状态。
    messagesForAPI = messagesForAPI.map(msg => {
      // 按照 msg.type 的取值选择API 服务 claude的具体处理分支。
      switch (msg.type) {
        case 'user':
          // Strip tool_reference blocks from tool_result content
          // 返回 `stripToolReferenceBlocksFromUserMessage(msg)`，作为API 服务 claude这次计算的结果。
          return stripToolReferenceBlocksFromUserMessage(msg)
        case 'assistant':
          // Strip 'caller' field from tool_use blocks
          // 返回 `stripCallerFieldFromAssistantMessage(msg)`，作为API 服务 claude这次计算的结果。
          return stripCallerFieldFromAssistantMessage(msg)
        default:
          // 返回 `msg`，作为API 服务 claude这次计算的结果。
          return msg
      }
    })
  }

  // Repair tool_use/tool_result pairing mismatches that can occur when resuming
  // remote/teleport sessions. Inserts synthetic error tool_results for orphaned
  // tool_uses and strips orphaned tool_results referencing non-existent tool_uses.
  // messagesForAPI 消息数据更新为 `ensureToolResultPairing(messagesForAPI)`，确保API 服务后续读取最新状态。
  messagesForAPI = ensureToolResultPairing(messagesForAPI)

  // Strip advisor blocks — the API rejects them without the beta header.
  // 满足 `!betas.includes(ADVISOR_BETA_HEADER)` 时，API 服务 claude执行该分支。
  if (!betas.includes(ADVISOR_BETA_HEADER)) {
    // messagesForAPI 消息数据更新为 `stripAdvisorBlocks(messagesForAPI)`，确保API 服务后续读取最新状态。
    messagesForAPI = stripAdvisorBlocks(messagesForAPI)
  }

  // Strip excess media items before making the API call.
  // The API rejects requests with >100 media items but returns a confusing error.
  // Rather than erroring (which is hard to recover from in Cowork/CCD), we
  // silently drop the oldest media items to stay within the limit.
  // messagesForAPI 消息数据更新为 `stripExcessMediaItems(`，确保API 服务后续读取最新状态。
  messagesForAPI = stripExcessMediaItems(
    messagesForAPI,
    API_MAX_MEDIA_PER_REQUEST,
  )

  // Instrumentation: Track message count after normalization
  // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_after_normalize', {
    postNormalizedMessageCount: messagesForAPI.length,
  })

  // Compute fingerprint from first user message for attribution.
  // Must run BEFORE injecting synthetic messages (e.g. deferred tool names)
  // so the fingerprint reflects the actual user input.
  // fingerprint保存`computeFingerprintFromMessages`，供API 服务 claude后续处理使用。
  const fingerprint = computeFingerprintFromMessages(messagesForAPI)

  // When the delta attachment is enabled, deferred tools are announced
  // via persisted deferred_tools_delta attachments instead of this
  // ephemeral prepend (which busts cache whenever the pool changes).
  // 组合条件 `useToolSearch && !isDeferredToolsDeltaEnabled()` 成立时，API 服务 claude才启用这条专门路径。
  if (useToolSearch && !isDeferredToolsDeltaEnabled()) {
    // deferredToolList 集合保存`tools`，供API 服务 claude后续判断或输出使用。
    const deferredToolList = tools
      // 链式调用 filter，继续加工上一行在API 服务 claude中产生的数据。
      .filter(t => deferredToolNames.has(t.name))
      .map(formatDeferredToolLine)
      .sort()
      .join('\n')
    // 满足 `deferredToolList` 时，API 服务 claude执行该分支。
    if (deferredToolList) {
      // messagesForAPI 消息数据更新为 `[`，确保API 服务后续读取最新状态。
      messagesForAPI = [
        createUserMessage({
          content: `<available-deferred-tools>\n${deferredToolList}\n</available-deferred-tools>`,
          isMeta: true,
        }),
        ...messagesForAPI,
      ]
    }
  }

  // Chrome tool-search instructions: when the delta attachment is enabled,
  // these are carried as a client-side block in mcp_instructions_delta
  // (attachments.ts) instead of here. This per-request sys-prompt append
  // busts the prompt cache when chrome connects late.
  // hasChromeTools 集合记录 `filteredTools.some` 是否成立，API 服务 claude随后按该结果分支。
  const hasChromeTools = filteredTools.some(t =>
    isToolFromMcpServer(t.name, CLAUDE_IN_CHROME_MCP_SERVER_NAME),
  )
  // injectChromeHere 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const injectChromeHere =
    useToolSearch && hasChromeTools && !isMcpInstructionsDeltaEnabled()

  // filter(Boolean) works by converting each element to a boolean - empty strings become false and are filtered out.
  // 系统提示词更新为 `asSystemPrompt(`，确保API 服务后续读取最新状态。
  systemPrompt = asSystemPrompt(
    [
      getAttributionHeader(fingerprint),
      getCLISyspromptPrefix({
        isNonInteractive: options.isNonInteractiveSession,
        hasAppendSystemPrompt: options.hasAppendSystemPrompt,
      }),
      ...systemPrompt,
      ...(advisorModel ? [ADVISOR_TOOL_INSTRUCTIONS] : []),
      ...(injectChromeHere ? [CHROME_TOOL_SEARCH_INSTRUCTIONS] : []),
    ].filter(Boolean),
  )

  // Prepend system prompt block for easy API identification
  // 调用 logAPIPrefix，触发API 服务 claude此处需要的副作用。
  logAPIPrefix(systemPrompt)

  // enablePromptCaching 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const enablePromptCaching =
    options.enablePromptCaching ?? getPromptCachingEnabled(options.model)
  // system构建`buildSystemPromptBlocks`，供API 服务 claude后续处理使用。
  const system = buildSystemPromptBlocks(systemPrompt, enablePromptCaching, {
    skipGlobalCacheForSystemPrompt: needsToolBasedCacheMarker,
    querySource: options.querySource,
  })
  // useBetas 集合保存 `betas.length > 0` 的判断结果，供API 服务 claude后续分支直接复用。
  const useBetas = betas.length > 0

  // Build minimal context for detailed tracing (when beta tracing is enabled)
  // Note: The actual new_context message extraction is done in sessionTracing.ts using
  // hash-based tracking per querySource (agent) from the messagesForAPI array
  // extraToolSchemas 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const extraToolSchemas = [...(options.extraToolSchemas ?? [])]
  // 满足 `advisorModel` 时，API 服务 claude执行该分支。
  if (advisorModel) {
    // Server tools must be in the tools array by API contract. Appended after
    // toolSchemas (which carries the cache_control marker) so toggling /advisor
    // only churns the small suffix, not the cached prefix.
    // extraToolSchemas 集合追加新条目，保持收集顺序与输入顺序一致。
    extraToolSchemas.push({
      type: 'advisor_20260301',
      name: 'advisor',
      model: advisorModel,
    } as unknown as BetaToolUnion)
  }
  // allTools 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const allTools = [...toolSchemas, ...extraToolSchemas]

  // isFastMode 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const isFastMode =
    isFastModeEnabled() &&
    isFastModeAvailable() &&
    !isFastModeCooldown() &&
    isFastModeSupportedByModel(options.model) &&
    !!options.fastMode

  // Sticky-on latches for dynamic beta headers. Each header, once first
  // sent, keeps being sent for the rest of the session so mid-session
  // toggles don't change the server-side cache key and bust ~50-70K tokens.
  // Latches are cleared on /clear and /compact via clearBetaHeaderLatches().
  // Per-call gates (isAgenticQuery, querySource===repl_main_thread) stay
  // per-call so non-agentic queries keep their own stable header set.

  // afkHeaderLatched读取`getAfkModeHeaderLatched`，供API 服务 claude后续处理使用。
  let afkHeaderLatched = getAfkModeHeaderLatched() === true
  // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，API 服务 claude执行该分支。
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
    if (
      !afkHeaderLatched &&
      isAgenticQuery &&
      shouldIncludeFirstPartyOnlyBetas() &&
      (autoModeStateModule?.isAutoModeActive() ?? false)
    ) {
      // afkHeaderLatched更新为 `true`，确保API 服务后续读取最新状态。
      afkHeaderLatched = true
      // setAfkModeHeaderLatched 写入新的状态值，使API 服务 claude后续读取保持一致。
      setAfkModeHeaderLatched(true)
    }
  }

  // fastModeHeaderLatched读取`getFastModeHeaderLatched`，供API 服务 claude后续处理使用。
  let fastModeHeaderLatched = getFastModeHeaderLatched() === true
  // 组合条件 `!fastModeHeaderLatched && isFastMode` 成立时，API 服务 claude才启用这条专门路径。
  if (!fastModeHeaderLatched && isFastMode) {
    // fastModeHeaderLatched更新为 `true`，确保API 服务后续读取最新状态。
    fastModeHeaderLatched = true
    // setFastModeHeaderLatched 写入新的状态值，使API 服务 claude后续读取保持一致。
    setFastModeHeaderLatched(true)
  }

  // cacheEditingHeaderLatched 缓存读取`getCacheEditingHeaderLatched`，供API 服务 claude后续处理使用。
  let cacheEditingHeaderLatched = getCacheEditingHeaderLatched() === true
  // 满足 `feature('CACHED_MICROCOMPACT')` 时，API 服务 claude执行该分支。
  if (feature('CACHED_MICROCOMPACT')) {
    // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
    if (
      !cacheEditingHeaderLatched &&
      cachedMCEnabled &&
      getAPIProvider() === 'firstParty' &&
      options.querySource === 'repl_main_thread'
    ) {
      // cacheEditingHeaderLatched 缓存更新为 `true`，确保API 服务后续读取最新状态。
      cacheEditingHeaderLatched = true
      // setCacheEditingHeaderLatched 写入新的状态值，使API 服务 claude后续读取保持一致。
      setCacheEditingHeaderLatched(true)
    }
  }

  // Only latch from agentic queries so a classifier call doesn't flip the
  // main thread's context_management mid-turn.
  // thinkingClearLatched读取`getThinkingClearLatched`，供API 服务 claude后续处理使用。
  let thinkingClearLatched = getThinkingClearLatched() === true
  // 组合条件 `!thinkingClearLatched && isAgenticQuery` 成立时，API 服务 claude才启用这条专门路径。
  if (!thinkingClearLatched && isAgenticQuery) {
    // lastCompletion读取`getLastApiCompletionTimestamp`，供API 服务 claude后续处理使用。
    const lastCompletion = getLastApiCompletionTimestamp()
    // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
    if (
      lastCompletion !== null &&
      Date.now() - lastCompletion > CACHE_TTL_1HOUR_MS
    ) {
      // thinkingClearLatched更新为 `true`，确保API 服务后续读取最新状态。
      thinkingClearLatched = true
      // setThinkingClearLatched 写入新的状态值，使API 服务 claude后续读取保持一致。
      setThinkingClearLatched(true)
    }
  }

  // effort读取`resolveAppliedEffort`，供API 服务 claude后续处理使用。
  const effort = resolveAppliedEffort(options.model, options.effortValue)

  // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，API 服务 claude执行该分支。
  if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
    // Exclude defer_loading tools from the hash -- the API strips them from the
    // prompt, so they never affect the actual cache key. Including them creates
    // false-positive "tool schemas changed" breaks when tools are discovered or
    // MCP servers reconnect.
    // toolsForCacheDetection 缓存筛选`allTools.filter`，供API 服务 claude后续处理使用。
    const toolsForCacheDetection = allTools.filter(
      // t更新为 `> !('defer_loading' in t && t.defer_loading)`，确保API 服务后续读取最新状态。
      t => !('defer_loading' in t && t.defer_loading),
    )
    // Capture everything that could affect the server-side cache key.
    // Pass latched header values (not live state) so break detection
    // reflects what we actually send, not what the user toggled.
    // 调用 recordPromptState，触发API 服务 claude此处需要的副作用。
    recordPromptState({
      system,
      toolSchemas: toolsForCacheDetection,
      querySource: options.querySource,
      model: options.model,
      agentId: options.agentId,
      fastMode: fastModeHeaderLatched,
      globalCacheStrategy,
      betas,
      autoModeActive: afkHeaderLatched,
      isUsingOverage: currentLimits.isUsingOverage ?? false,
      cachedMCEnabled: cacheEditingHeaderLatched,
      effortValue: effort,
      extraBodyParams: getExtraBodyParams(),
    })
  }

  // newContext 命名 `isBetaTracingEnabled()`，让后续代码直接表达这个值的用途。
  const newContext: LLMRequestNewContext | undefined = isBetaTracingEnabled()
    ? {
        systemPrompt: systemPrompt.join('\n\n'),
        querySource: options.querySource,
        tools: jsonStringify(allTools),
      }
    : undefined

  // Capture the span so we can pass it to endLLMRequestSpan later
  // This ensures responses are matched to the correct request when multiple requests run in parallel
  // llmSpan保存`startLLMRequestSpan`，供API 服务 claude后续处理使用。
  const llmSpan = startLLMRequestSpan(
    options.model,
    newContext,
    messagesForAPI,
    isFastMode,
  )

  // startIncludingRetries 集合记录时间`Date.now`，供API 服务 claude后续处理使用。
  const startIncludingRetries = Date.now()
  // start记录时间`Date.now`，供API 服务 claude后续处理使用。
  let start = Date.now()
  // attemptNumber保存`0`，供后续判断或组装使用。
  let attemptNumber = 0
  // attemptStartTimes 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const attemptStartTimes: number[] = []
  // stream保存`undefined`，作为后续未定义值处理的输入。
  let stream: Stream<BetaRawMessageStreamEvent> | undefined = undefined
  // streamRequestId 请求数据 命名 `undefined`，让后续代码直接表达这个值的用途。
  let streamRequestId: string | null | undefined = undefined
  // clientRequestId 请求数据 命名 `undefined`，让后续代码直接表达这个值的用途。
  let clientRequestId: string | undefined = undefined
  // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins -- Response is available in Node 18+ and is used by the SDK
  // streamResponse 响应数据保存`undefined`，作为后续未定义值处理的输入。
  let streamResponse: Response | undefined = undefined

  // Release all stream resources to prevent native memory leaks.
  // The Response object holds native TLS/socket buffers that live outside the
  // V8 heap (observed on the Node.js/npm path; see GH #32920), so we must
  // explicitly cancel and release it regardless of how the generator exits.
  // releaseStreamResources 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
  function releaseStreamResources(): void {
    // 调用 cleanupStream，触发API 服务 claude此处需要的副作用。
    cleanupStream(stream)
    // stream更新为 `undefined`，确保API 服务后续读取最新状态。
    stream = undefined
    // 满足 `streamResponse` 时，API 服务 claude执行该分支。
    if (streamResponse) {
      // 这个回调绑定到 streamResponse.body?.cancel().catch(() => {})，负责API 服务 claude在该局部场景下的响应。
      streamResponse.body?.cancel().catch(() => {})
      // streamResponse 响应数据更新为 `undefined`，确保API 服务后续读取最新状态。
      streamResponse = undefined
    }
  }

  // Consume pending cache edits ONCE before paramsFromContext is defined.
  // paramsFromContext is called multiple times (logging, retries), so consuming
  // inside it would cause the first call to steal edits from subsequent calls.
  // consumedCacheEdits 缓存保存`consumePendingCacheEdits`，供API 服务 claude后续处理使用。
  const consumedCacheEdits = cachedMCEnabled ? consumePendingCacheEdits() : null
  // consumedPinnedEdits 集合读取`getPinnedCacheEdits`，供API 服务 claude后续处理使用。
  const consumedPinnedEdits = cachedMCEnabled ? getPinnedCacheEdits() : []

  // Capture the betas sent in the last API request, including the ones that
  // were dynamically added, so we can log and send it to telemetry.
  // lastRequestBetas 请求数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let lastRequestBetas: string[] | undefined

  // paramsFromContext封装成回调，供API 服务 claude在事件触发或异步步骤中调用。
  const paramsFromContext = (retryContext: RetryContext) => {
    // betasParams 集合 聚合成有序列表，保持后续遍历顺序稳定。
    const betasParams = [...betas]

    // Append 1M beta dynamically for the Sonnet 1M experiment.
    // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
    if (
      !betasParams.includes(CONTEXT_1M_BETA_HEADER) &&
      getSonnet1mExpTreatmentEnabled(retryContext.model)
    ) {
      // betasParams 集合追加新条目，保持收集顺序与输入顺序一致。
      betasParams.push(CONTEXT_1M_BETA_HEADER)
    }

    // For Bedrock, include both model-based betas and dynamically-added tool search header
    // bedrockBetas 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const bedrockBetas =
      getAPIProvider() === 'bedrock'
        ? [
            ...getBedrockExtraBodyParamsBetas(retryContext.model),
            ...(toolSearchHeader ? [toolSearchHeader] : []),
          ]
        : []
    // extraBodyParams 集合读取`getExtraBodyParams`，供API 服务 claude后续处理使用。
    const extraBodyParams = getExtraBodyParams(bedrockBetas)

    // outputConfig 配置 集中保存API 服务 claude要一起传递的字段。
    const outputConfig: BetaOutputConfig = {
      ...((extraBodyParams.output_config as BetaOutputConfig) ?? {}),
    }

    // 调用 configureEffortParams，触发API 服务 claude此处需要的副作用。
    configureEffortParams(
      effort,
      outputConfig,
      extraBodyParams,
      betasParams,
      options.model,
    )

    // 调用 configureTaskBudgetParams，触发API 服务 claude此处需要的副作用。
    configureTaskBudgetParams(
      options.taskBudget,
      outputConfig as BetaOutputConfig & { task_budget?: TaskBudgetParam },
      betasParams,
    )

    // Merge outputFormat into extraBodyParams.output_config alongside effort
    // Requires structured-outputs beta header per SDK (see parse() in messages.mjs)
    // 组合条件 `options.outputFormat && !('format' in outputConfig)` 成立时，API 服务 claude才启用这条专门路径。
    if (options.outputFormat && !('format' in outputConfig)) {
      // format更新为 `options.outputFormat as BetaJSONOutputFormat`，确保API 服务后续读取最新状态。
      outputConfig.format = options.outputFormat as BetaJSONOutputFormat
      // Add beta header if not already present and provider supports it
      // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
      if (
        modelSupportsStructuredOutputs(options.model) &&
        !betasParams.includes(STRUCTURED_OUTPUTS_BETA_HEADER)
      ) {
        // betasParams 集合追加新条目，保持收集顺序与输入顺序一致。
        betasParams.push(STRUCTURED_OUTPUTS_BETA_HEADER)
      }
    }

    // Retry context gets preference because it tries to course correct if we exceed the context window limit
    // maxOutputTokens 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const maxOutputTokens =
      retryContext?.maxTokensOverride ||
      options.maxOutputTokensOverride ||
      getMaxOutputTokensForModel(options.model)

    // hasThinking 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const hasThinking =
      thinkingConfig.type !== 'disabled' &&
      !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_THINKING)
    // thinking保存`undefined`，作为后续未定义值处理的输入。
    let thinking: BetaMessageStreamParams['thinking'] | undefined = undefined

    // IMPORTANT: Do not change the adaptive-vs-budget thinking selection below
    // without notifying the model launch DRI and research. This is a sensitive
    // setting that can greatly affect model quality and bashing.
    // 组合条件 `hasThinking && modelSupportsThinking(options.model)` 成立时，API 服务 claude才启用这条专门路径。
    if (hasThinking && modelSupportsThinking(options.model)) {
      // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
      if (
        !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING) &&
        modelSupportsAdaptiveThinking(options.model)
      ) {
        // For models that support adaptive thinking, always use adaptive
        // thinking without a budget.
        // thinking更新为 `{`，确保API 服务后续读取最新状态。
        thinking = {
          type: 'adaptive',
        } satisfies BetaMessageStreamParams['thinking']
      } else {
        // For models that do not support adaptive thinking, use the default
        // thinking budget unless explicitly specified.
        // thinkingBudget读取`getMaxThinkingTokensForModel`，供API 服务 claude后续处理使用。
        let thinkingBudget = getMaxThinkingTokensForModel(options.model)
        // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
        if (
          thinkingConfig.type === 'enabled' &&
          thinkingConfig.budgetTokens !== undefined
        ) {
          // thinkingBudget更新为 `thinkingConfig.budgetTokens`，确保API 服务后续读取最新状态。
          thinkingBudget = thinkingConfig.budgetTokens
        }
        // thinkingBudget更新为 `Math.min(maxOutputTokens - 1, thinkingBudget)`，确保API 服务后续读取最新状态。
        thinkingBudget = Math.min(maxOutputTokens - 1, thinkingBudget)
        // thinking更新为 `{`，确保API 服务后续读取最新状态。
        thinking = {
          budget_tokens: thinkingBudget,
          type: 'enabled',
        } satisfies BetaMessageStreamParams['thinking']
      }
    }

    // Get API context management strategies if enabled
    // contextManagement读取`getAPIContextManagement`，供API 服务 claude后续处理使用。
    const contextManagement = getAPIContextManagement({
      hasThinking,
      isRedactThinkingActive: betasParams.includes(REDACT_THINKING_BETA_HEADER),
      clearAllThinking: thinkingClearLatched,
    })

    // enablePromptCaching 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const enablePromptCaching =
      options.enablePromptCaching ?? getPromptCachingEnabled(retryContext.model)

    // Fast mode: header is latched session-stable (cache-safe), but
    // `speed='fast'` stays dynamic so cooldown still suppresses the actual
    // fast-mode request without changing the cache key.
    // speed 先占位，稍后的条件分支会根据实际输入补齐它。
    let speed: BetaMessageStreamParams['speed']
    // isFastModeForRetry 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const isFastModeForRetry =
      isFastModeEnabled() &&
      isFastModeAvailable() &&
      !isFastModeCooldown() &&
      isFastModeSupportedByModel(options.model) &&
      !!retryContext.fastMode
    // 满足 `isFastModeForRetry` 时，API 服务 claude执行该分支。
    if (isFastModeForRetry) {
      // speed更新为 `'fast'`，确保API 服务后续读取最新状态。
      speed = 'fast'
    }
    // 组合条件 `fastModeHeaderLatched && !betasParams.includes(FAST_MODE_BETA_HEADER)` 成立时，API 服务 claude才启用这条专门路径。
    if (fastModeHeaderLatched && !betasParams.includes(FAST_MODE_BETA_HEADER)) {
      // betasParams 集合追加新条目，保持收集顺序与输入顺序一致。
      betasParams.push(FAST_MODE_BETA_HEADER)
    }

    // AFK mode beta: latched once auto mode is first activated. Still gated
    // by isAgenticQuery per-call so classifiers/compaction don't get it.
    // 满足 `feature('TRANSCRIPT_CLASSIFIER')` 时，API 服务 claude执行该分支。
    if (feature('TRANSCRIPT_CLASSIFIER')) {
      // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
      if (
        afkHeaderLatched &&
        shouldIncludeFirstPartyOnlyBetas() &&
        isAgenticQuery &&
        !betasParams.includes(AFK_MODE_BETA_HEADER)
      ) {
        // betasParams 集合追加新条目，保持收集顺序与输入顺序一致。
        betasParams.push(AFK_MODE_BETA_HEADER)
      }
    }

    // Cache editing beta: header is latched session-stable; useCachedMC
    // (controls cache_edits body behavior) stays live so edits stop when
    // the feature disables but the header doesn't flip.
    // useCachedMC 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const useCachedMC =
      cachedMCEnabled &&
      getAPIProvider() === 'firstParty' &&
      options.querySource === 'repl_main_thread'
    // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
    if (
      cacheEditingHeaderLatched &&
      getAPIProvider() === 'firstParty' &&
      options.querySource === 'repl_main_thread' &&
      !betasParams.includes(cacheEditingBetaHeader)
    ) {
      // betasParams 集合追加新条目，保持收集顺序与输入顺序一致。
      betasParams.push(cacheEditingBetaHeader)
      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Cache editing beta header enabled for cached microcompact',
      )
    }

    // Only send temperature when thinking is disabled — the API requires
    // temperature: 1 when thinking is enabled, which is already the default.
    // temperature标记API 服务 claude是否启用对应路径。
    const temperature = !hasThinking
      ? (options.temperatureOverride ?? 1)
      : undefined

    // lastRequestBetas 请求数据更新为 `betasParams`，确保API 服务后续读取最新状态。
    lastRequestBetas = betasParams

    // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
    return {
      model: normalizeModelStringForAPI(options.model),
      messages: addCacheBreakpoints(
        messagesForAPI,
        enablePromptCaching,
        options.querySource,
        useCachedMC,
        consumedCacheEdits,
        consumedPinnedEdits,
        options.skipCacheWrite,
      ),
      system,
      tools: allTools,
      tool_choice: options.toolChoice,
      ...(useBetas && { betas: betasParams }),
      metadata: getAPIMetadata(),
      max_tokens: maxOutputTokens,
      thinking,
      ...(temperature !== undefined && { temperature }),
      ...(contextManagement &&
        useBetas &&
        betasParams.includes(CONTEXT_MANAGEMENT_BETA_HEADER) && {
          context_management: contextManagement,
        }),
      ...extraBodyParams,
      ...(Object.keys(outputConfig).length > 0 && {
        output_config: outputConfig,
      }),
      ...(speed !== undefined && { speed }),
    }
  }

  // Compute log scalars synchronously so the fire-and-forget .then() closure
  // captures only primitives instead of paramsFromContext's full closure scope
  // (messagesForAPI, system, allTools, betas — the entire request-building
  // context), which would otherwise be pinned until the promise resolves.
  {
    // queryParams 集合保存`paramsFromContext`，供API 服务 claude后续处理使用。
    const queryParams = paramsFromContext({
      model: options.model,
      thinkingConfig,
    })
    // logMessagesLength 消息数据记录 `queryParams.messages.length` 是否成立，下一步按该结果分支。
    const logMessagesLength = queryParams.messages.length
    // logBetas 集合读取 hook 状态，供API 服务 claude本轮渲染使用。
    const logBetas = useBetas ? (queryParams.betas ?? []) : []
    // logThinkingType保存`queryParams.thinking?.type ?? 'disabled'`，供后续判断或组装使用。
    const logThinkingType = queryParams.thinking?.type ?? 'disabled'
    // logEffortValue保存`queryParams.output_config?.effort`，供API 服务 claude后续判断或输出使用。
    const logEffortValue = queryParams.output_config?.effort
    // 这个回调绑定到 void options.getToolPermissionContext().then(permissionContext => {，负责API 服务 claude在该局部场景下的响应。
    void options.getToolPermissionContext().then(permissionContext => {
      // 调用 logAPIQuery，触发API 服务 claude此处需要的副作用。
      logAPIQuery({
        model: options.model,
        messagesLength: logMessagesLength,
        temperature: options.temperatureOverride ?? 1,
        betas: logBetas,
        permissionMode: permissionContext.mode,
        querySource: options.querySource,
        queryTracking: options.queryTracking,
        thinkingType: logThinkingType,
        effortValue: logEffortValue,
        fastMode: isFastMode,
        previousRequestId,
      })
    })
  }

  // newMessages 消息数据 从空数组开始收集，后续循环会按处理顺序追加条目。
  const newMessages: AssistantMessage[] = []
  // ttftMs 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let ttftMs = 0
  // partialMessage 消息数据初始化为未定义值，后续分支会在有数据时补齐。
  let partialMessage: BetaMessage | undefined = undefined
  // contentBlocks 集合 从空数组开始收集，后续循环会按处理顺序追加条目。
  const contentBlocks: (BetaContentBlock | ConnectorTextBlock)[] = []
  // usage保存`EMPTY_USAGE`，供API 服务 claude后续判断或输出使用。
  let usage: NonNullableUsage = EMPTY_USAGE
  // costUSD保存`0`，供后续判断或组装使用。
  let costUSD = 0
  // stopReason 命名 `null`，让后续代码直接表达这个值的用途。
  let stopReason: BetaStopReason | null = null
  // didFallBackToNonStreaming标记API 服务 claude是否启用对应路径。
  let didFallBackToNonStreaming = false
  // fallbackMessage 消息数据 先占位，稍后的条件分支会根据实际输入补齐它。
  let fallbackMessage: AssistantMessage | undefined
  // maxOutputTokens 集合 命名 `0`，让后续代码直接表达这个值的用途。
  let maxOutputTokens = 0
  // responseHeaders 响应数据保存`undefined`，作为后续未定义值处理的输入。
  let responseHeaders: globalThis.Headers | undefined = undefined
  // research保存`undefined`，作为后续未定义值处理的输入。
  let research: unknown = undefined
  // isFastModeRequest 请求数据标记API 服务 claude是否启用对应路径。
  let isFastModeRequest = isFastMode // Keep separate state as it may change if falling back
  // isAdvisorInProgress 集合标记API 服务 claude是否启用对应路径。
  let isAdvisorInProgress = false

  // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
  try {
    // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
    queryCheckpoint('query_client_creation_start')
    // generator保存`withRetry`，供API 服务 claude后续处理使用。
    const generator = withRetry(
      // 这个回调绑定到 () =>，负责API 服务 claude在该局部场景下的响应。
      () =>
        getAnthropicClient({
          maxRetries: 0, // Disabled auto-retry in favor of manual implementation
          model: options.model,
          fetchOverride: options.fetchOverride,
          source: options.querySource,
        }),
      // 调用 async，触发API 服务 claude此处需要的副作用。
      async (anthropic, attempt, context) => {
        // attemptNumber更新为 `attempt`，确保API 服务后续读取最新状态。
        attemptNumber = attempt
        // isFastModeRequest 请求数据更新为 `context.fastMode ?? false`，确保API 服务后续读取最新状态。
        isFastModeRequest = context.fastMode ?? false
        // start更新为 `Date.now()`，确保API 服务后续读取最新状态。
        start = Date.now()
        // attemptStartTimes 集合追加新条目，保持收集顺序与输入顺序一致。
        attemptStartTimes.push(start)
        // Client has been created by withRetry's getClient() call. This fires
        // once per attempt; on retries the client is usually cached (withRetry
        // only calls getClient() again after auth errors), so the delta from
        // client_creation_start is meaningful on attempt 1.
        // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
        queryCheckpoint('query_client_creation_end')

        // params 集合保存`paramsFromContext`，供API 服务 claude后续处理使用。
        const params = paramsFromContext(context)
        // 调用 captureAPIRequest，触发API 服务 claude此处需要的副作用。
        captureAPIRequest(params, options.querySource) // Capture for bug reports

        // maxOutputTokens 集合更新为 `params.max_tokens`，确保API 服务后续读取最新状态。
        maxOutputTokens = params.max_tokens

        // Fire immediately before the fetch is dispatched. .withResponse() below
        // awaits until response headers arrive, so this MUST be before the await
        // or the "Network TTFB" phase measurement is wrong.
        // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
        queryCheckpoint('query_api_request_sent')
        // options.agentId缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
        if (!options.agentId) {
          // 调用 headlessProfilerCheckpoint，触发API 服务 claude此处需要的副作用。
          headlessProfilerCheckpoint('api_request_sent')
        }

        // Generate and track client request ID so timeouts (which return no
        // server request ID) can still be correlated with server logs.
        // First-party only — 3P providers don't log it (inc-4029 class).
        // API 服务 claude在这里处理 `clientRequestId =`，完成这一小步状态转换。
        clientRequestId =
          getAPIProvider() === 'firstParty' && isFirstPartyAnthropicBaseUrl()
            ? randomUUID()
            : undefined

        // Use raw stream instead of BetaMessageStream to avoid O(n²) partial JSON parsing
        // BetaMessageStream calls partialParse() on every input_json_delta, which we don't need
        // since we handle tool input accumulation ourselves
        // biome-ignore lint/plugin: main conversation loop handles attribution separately
        // 结果 等待 `anthropic.beta.messages`，确保继续执行前已有结果。
        const result = await anthropic.beta.messages
          .create(
            { ...params, stream: true },
            {
              signal,
              ...(clientRequestId && {
                headers: { [CLIENT_REQUEST_ID_HEADER]: clientRequestId },
              }),
            },
          )
          .withResponse()
        // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
        queryCheckpoint('query_response_headers_received')
        // streamRequestId 请求数据更新为 `result.request_id`，确保API 服务后续读取最新状态。
        streamRequestId = result.request_id
        // streamResponse 响应数据更新为 `result.response`，确保API 服务后续读取最新状态。
        streamResponse = result.response
        // 返回 `result.data`，作为API 服务 claude这次计算的结果。
        return result.data
      },
      {
        model: options.model,
        fallbackModel: options.fallbackModel,
        thinkingConfig,
        ...(isFastModeEnabled() ? { fastMode: isFastMode } : false),
        signal,
        querySource: options.querySource,
      },
    )

    // e 的赋值跨多行展开，先保留变量名再读取后续表达式。
    let e
    // 先执行一次循环体，再按尾部条件决定是否继续API 服务 claude处理。
    do {
      // e更新为 `await generator.next()`，确保API 服务后续读取最新状态。
      e = await generator.next()

      // yield API error messages (the stream has a 'controller' property, error messages don't)
      // 满足 `!('controller' in e.value)` 时，API 服务 claude执行该分支。
      if (!('controller' in e.value)) {
        // 生成器产出 `e.value`，把阶段性结果交给上层消费。
        yield e.value
      }
    } while (!e.done)
    // stream更新为 `e.value as Stream<BetaRawMessageStreamEvent>`，确保API 服务后续读取最新状态。
    stream = e.value as Stream<BetaRawMessageStreamEvent>

    // reset state
    // newMessages 消息数据被清空，API 服务从干净状态继续。
    newMessages.length = 0
    // ttftMs 集合更新为 `0`，确保API 服务后续读取最新状态。
    ttftMs = 0
    // partialMessage 消息数据更新为 `undefined`，确保API 服务后续读取最新状态。
    partialMessage = undefined
    // contentBlocks 集合被清空，API 服务从干净状态继续。
    contentBlocks.length = 0
    // usage更新为 `EMPTY_USAGE`，确保API 服务后续读取最新状态。
    usage = EMPTY_USAGE
    // stopReason更新为 `null`，确保API 服务后续读取最新状态。
    stopReason = null
    // isAdvisorInProgress 集合更新为 `false`，确保API 服务后续读取最新状态。
    isAdvisorInProgress = false

    // Streaming idle timeout watchdog: abort the stream if no chunks arrive
    // for STREAM_IDLE_TIMEOUT_MS. Unlike the stall detection below (which only
    // fires when the *next* chunk arrives), this uses setTimeout to actively
    // kill hung streams. Without this, a silently dropped connection can hang
    // the session indefinitely since the SDK's request timeout only covers the
    // initial fetch(), not the streaming body.
    // streamWatchdogEnabled保存`isEnvTruthy`，供API 服务 claude后续处理使用。
    const streamWatchdogEnabled = isEnvTruthy(
      process.env.CLAUDE_ENABLE_STREAM_WATCHDOG,
    )
    // STREAM_IDLE_TIMEOUT_MS 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const STREAM_IDLE_TIMEOUT_MS =
      parseInt(process.env.CLAUDE_STREAM_IDLE_TIMEOUT_MS || '', 10) || 90_000
    // STREAM_IDLE_WARNING_MS 警告信息 命名 `STREAM_IDLE_TIMEOUT_MS / 2`，让后续代码直接表达这个值的用途。
    const STREAM_IDLE_WARNING_MS = STREAM_IDLE_TIMEOUT_MS / 2
    // streamIdleAborted标记API 服务 claude是否启用对应路径。
    let streamIdleAborted = false
    // performance.now() snapshot when watchdog fires, for measuring abort propagation delay
    // streamWatchdogFiredAt初始化为空值，后续分支会在有数据时补齐。
    let streamWatchdogFiredAt: number | null = null
    // streamIdleWarningTimer 警告信息 命名 `null`，让后续代码直接表达这个值的用途。
    let streamIdleWarningTimer: ReturnType<typeof setTimeout> | null = null
    // streamIdleTimer保存`null`，作为后续空值处理的输入。
    let streamIdleTimer: ReturnType<typeof setTimeout> | null = null
    // clearStreamIdleTimers 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function clearStreamIdleTimers(): void {
      // `streamIdleWarningTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (streamIdleWarningTimer !== null) {
        // 调用 clearTimeout，触发API 服务 claude此处需要的副作用。
        clearTimeout(streamIdleWarningTimer)
        // streamIdleWarningTimer 警告信息更新为 `null`，确保API 服务后续读取最新状态。
        streamIdleWarningTimer = null
      }
      // `streamIdleTimer` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
      if (streamIdleTimer !== null) {
        // 调用 clearTimeout，触发API 服务 claude此处需要的副作用。
        clearTimeout(streamIdleTimer)
        // streamIdleTimer更新为 `null`，确保API 服务后续读取最新状态。
        streamIdleTimer = null
      }
    }
    // resetStreamIdleTimer 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
    function resetStreamIdleTimer(): void {
      // 调用 clearStreamIdleTimers，触发API 服务 claude此处需要的副作用。
      clearStreamIdleTimers()
      // streamWatchdogEnabled缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
      if (!streamWatchdogEnabled) {
        // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
      // streamIdleWarningTimer 警告信息更新为 `setTimeout(`，确保API 服务后续读取最新状态。
      streamIdleWarningTimer = setTimeout(
        // warnMs 集合更新为 `> {`，确保API 服务后续读取最新状态。
        warnMs => {
          // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Streaming idle warning: no chunks received for ${warnMs / 1000}s`,
            { level: 'warn' },
          )
          // 调用 logForDiagnosticsNoPII，触发API 服务 claude此处需要的副作用。
          logForDiagnosticsNoPII('warn', 'cli_streaming_idle_warning')
        },
        STREAM_IDLE_WARNING_MS,
        STREAM_IDLE_WARNING_MS,
      )
      // streamIdleTimer更新为 `setTimeout(() => {`，确保API 服务后续读取最新状态。
      streamIdleTimer = setTimeout(() => {
        // streamIdleAborted更新为 `true`，确保API 服务后续读取最新状态。
        streamIdleAborted = true
        // streamWatchdogFiredAt更新为 `performance.now()`，确保API 服务后续读取最新状态。
        streamWatchdogFiredAt = performance.now()
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Streaming idle timeout: no chunks received for ${STREAM_IDLE_TIMEOUT_MS / 1000}s, aborting stream`,
          { level: 'error' },
        )
        // 调用 logForDiagnosticsNoPII，触发API 服务 claude此处需要的副作用。
        logForDiagnosticsNoPII('error', 'cli_streaming_idle_timeout')
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_streaming_idle_timeout', {
          model:
            options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          request_id: (streamRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          timeout_ms: STREAM_IDLE_TIMEOUT_MS,
        })
        // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
        releaseStreamResources()
      }, STREAM_IDLE_TIMEOUT_MS)
    }
    // 调用 resetStreamIdleTimer，触发API 服务 claude此处需要的副作用。
    resetStreamIdleTimer()

    // 调用 startSessionActivity，触发API 服务 claude此处需要的副作用。
    startSessionActivity('api_call')
    // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
    try {
      // stream in and accumulate state
      // isFirstChunk标记API 服务 claude是否启用对应路径。
      let isFirstChunk = true
      // lastEventTime 命名 `null // Set after first chunk to avoid measuring TTFB as ...`，让后续代码直接表达这个值的用途。
      let lastEventTime: number | null = null // Set after first chunk to avoid measuring TTFB as a stall
      // STALL_THRESHOLD_MS 集合保存`30_000 // 30 seconds`，供API 服务 claude后续判断或输出使用。
      const STALL_THRESHOLD_MS = 30_000 // 30 seconds
      // totalStallTime 命名 `0`，让后续代码直接表达这个值的用途。
      let totalStallTime = 0
      // stallCount 数量 命名 `0`，让后续代码直接表达这个值的用途。
      let stallCount = 0

      // 逐项读取 `stream` 中的part，按输入顺序推进API 服务 claude。
      for await (const part of stream) {
        // 调用 resetStreamIdleTimer，触发API 服务 claude此处需要的副作用。
        resetStreamIdleTimer()
        // now记录时间`Date.now`，供API 服务 claude后续处理使用。
        const now = Date.now()

        // Detect and log streaming stalls (only after first event to avoid counting TTFB)
        // `lastEventTime` 与 `null` 不一致时刷新派生状态，避免使用过期结果。
        if (lastEventTime !== null) {
          // timeSinceLastEvent保存`now - lastEventTime`，供API 服务 claude后续判断或输出使用。
          const timeSinceLastEvent = now - lastEventTime
          // 满足 `timeSinceLastEvent > STALL_THRESHOLD_MS` 时，API 服务 claude执行该分支。
          if (timeSinceLastEvent > STALL_THRESHOLD_MS) {
            // API 服务 claude在这里处理 `stallCount++`，完成这一小步状态转换。
            stallCount++
            // API 服务 claude在这里处理 `totalStallTime += timeSinceLastEvent`，完成这一小步状态转换。
            totalStallTime += timeSinceLastEvent
            // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
            logForDebugging(
              `Streaming stall detected: ${(timeSinceLastEvent / 1000).toFixed(1)}s gap between events (stall #${stallCount})`,
              { level: 'warn' },
            )
            // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_streaming_stall', {
              stall_duration_ms: timeSinceLastEvent,
              stall_count: stallCount,
              total_stall_time_ms: totalStallTime,
              event_type:
                part.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              model:
                options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              request_id: (streamRequestId ??
                'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
          }
        }
        // lastEventTime更新为 `now`，确保API 服务后续读取最新状态。
        lastEventTime = now

        // 满足 `isFirstChunk` 时，API 服务 claude执行该分支。
        if (isFirstChunk) {
          // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
          logForDebugging('Stream started - received first chunk')
          // 调用 queryCheckpoint，触发API 服务 claude此处需要的副作用。
          queryCheckpoint('query_first_chunk_received')
          // options.agentId缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
          if (!options.agentId) {
            // 调用 headlessProfilerCheckpoint，触发API 服务 claude此处需要的副作用。
            headlessProfilerCheckpoint('first_chunk')
          }
          // 调用 endQueryProfile，触发API 服务 claude此处需要的副作用。
          endQueryProfile()
          // isFirstChunk更新为 `false`，确保API 服务后续读取最新状态。
          isFirstChunk = false
        }

        // 按照 part.type 的取值选择API 服务 claude的具体处理分支。
        switch (part.type) {
          case 'message_start': {
            // partialMessage 消息数据更新为 `part.message`，确保API 服务后续读取最新状态。
            partialMessage = part.message
            // ttftMs 集合更新为 `Date.now() - start`，确保API 服务后续读取最新状态。
            ttftMs = Date.now() - start
            // usage更新为 `updateUsage(usage, part.message?.usage)`，确保API 服务后续读取最新状态。
            usage = updateUsage(usage, part.message?.usage)
            // Capture research from message_start if available (internal only).
            // Always overwrite with the latest value.
            // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
            if (
              process.env.USER_TYPE === 'ant' &&
              'research' in (part.message as unknown as Record<string, unknown>)
            ) {
              // research更新为 `(part.message as unknown as Record<string, unknown>)`，确保API 服务后续读取最新状态。
              research = (part.message as unknown as Record<string, unknown>)
                .research
            }
            // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
            break
          }
          case 'content_block_start':
            // 按照 part.content_block.type 的取值选择API 服务 claude的具体处理分支。
            switch (part.content_block.type) {
              case 'tool_use':
                // index 索引更新为 `{`，确保API 服务 claude后续读取最新状态。
                contentBlocks[part.index] = {
                  ...part.content_block,
                  input: '',
                }
                // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                break
              case 'server_tool_use':
                // index 索引更新为 `{`，确保API 服务 claude后续读取最新状态。
                contentBlocks[part.index] = {
                  ...part.content_block,
                  input: '' as unknown as { [key: string]: unknown },
                }
                // 当 `(part.content_block.name as string)` 匹配 `'advisor'` 时，API 服务 claude执行对应分支。
                if ((part.content_block.name as string) === 'advisor') {
                  // isAdvisorInProgress 集合更新为 `true`，确保API 服务后续读取最新状态。
                  isAdvisorInProgress = true
                  // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(`[AdvisorTool] Advisor tool called`)
                  // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                  logEvent('tengu_advisor_tool_call', {
                    model:
                      options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    advisor_model: (advisorModel ??
                      'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                  })
                }
                // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                break
              case 'text':
                // index 索引更新为 `{`，确保API 服务 claude后续读取最新状态。
                contentBlocks[part.index] = {
                  ...part.content_block,
                  // awkwardly, the sdk sometimes returns text as part of a
                  // content_block_start message, then returns the same text
                  // again in a content_block_delta message. we ignore it here
                  // since there doesn't seem to be a way to detect when a
                  // content_block_delta message duplicates the text.
                  text: '',
                }
                // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                break
              case 'thinking':
                // index 索引更新为 `{`，确保API 服务 claude后续读取最新状态。
                contentBlocks[part.index] = {
                  ...part.content_block,
                  // also awkward
                  thinking: '',
                  // initialize signature to ensure field exists even if signature_delta never arrives
                  signature: '',
                }
                // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                break
              default:
                // even more awkwardly, the sdk mutates the contents of text blocks
                // as it works. we want the blocks to be immutable, so that we can
                // accumulate state ourselves.
                // index 索引更新为 `{ ...part.content_block }`，确保API 服务 claude后续读取最新状态。
                contentBlocks[part.index] = { ...part.content_block }
                // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
                if (
                  (part.content_block.type as string) === 'advisor_tool_result'
                ) {
                  // isAdvisorInProgress 集合更新为 `false`，确保API 服务后续读取最新状态。
                  isAdvisorInProgress = false
                  // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                  logForDebugging(`[AdvisorTool] Advisor tool result received`)
                }
                // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                break
            }
            // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
            break
          case 'content_block_delta': {
            // contentBlock读取 `contentBlocks[part.index]` 对应条目，后续围绕该成员继续处理。
            const contentBlock = contentBlocks[part.index]
            // delta 命名 `part.delta as typeof part.delta | ConnectorTextDelta`，让后续代码直接表达这个值的用途。
            const delta = part.delta as typeof part.delta | ConnectorTextDelta
            // contentBlock缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
            if (!contentBlock) {
              // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_streaming_error', {
                error_type:
                  'content_block_not_found_delta' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                part_type:
                  part.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                part_index: part.index,
              })
              // 抛出 new RangeError('Content block not found')，阻止API 服务 claude在无效状态下继续运行。
              throw new RangeError('Content block not found')
            }
            // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
            if (
              feature('CONNECTOR_TEXT') &&
              delta.type === 'connector_text_delta'
            ) {
              // `contentBlock.type` 与 `'connector_text'` 不一致时刷新派生状态，避免使用过期结果。
              if (contentBlock.type !== 'connector_text') {
                // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                logEvent('tengu_streaming_error', {
                  error_type:
                    'content_block_type_mismatch_connector_text' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                  expected_type:
                    'connector_text' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                  actual_type:
                    contentBlock.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                })
                // 抛出 new Error('Content block is not a connector_text block')，阻止API 服务 claude在无效状态下继续运行。
                throw new Error('Content block is not a connector_text block')
              }
              // API 服务 claude在这里处理 `contentBlock.connector_text += delta.connector_text`，完成这一小步状态转换。
              contentBlock.connector_text += delta.connector_text
            } else {
              // 按照 delta.type 的取值选择API 服务 claude的具体处理分支。
              switch (delta.type) {
                case 'citations_delta':
                  // TODO: handle citations
                  // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                  break
                case 'input_json_delta':
                  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
                  if (
                    contentBlock.type !== 'tool_use' &&
                    contentBlock.type !== 'server_tool_use'
                  ) {
                    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_streaming_error', {
                      error_type:
                        'content_block_type_mismatch_input_json' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      expected_type:
                        'tool_use' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      actual_type:
                        contentBlock.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    })
                    // 抛出 new Error('Content block is not a input_json block')，阻止API 服务 claude在无效状态下继续运行。
                    throw new Error('Content block is not a input_json block')
                  }
                  // `typeof contentBlock.input` 与 `'string'` 不一致时刷新派生状态，避免使用过期结果。
                  if (typeof contentBlock.input !== 'string') {
                    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_streaming_error', {
                      error_type:
                        'content_block_input_not_string' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      input_type:
                        typeof contentBlock.input as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    })
                    // 抛出 new Error('Content block input is not a string')，阻止API 服务 claude在无效状态下继续运行。
                    throw new Error('Content block input is not a string')
                  }
                  // API 服务 claude在这里处理 `contentBlock.input += delta.partial_json`，完成这一小步状态转换。
                  contentBlock.input += delta.partial_json
                  // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                  break
                case 'text_delta':
                  // `contentBlock.type` 与 `'text'` 不一致时刷新派生状态，避免使用过期结果。
                  if (contentBlock.type !== 'text') {
                    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_streaming_error', {
                      error_type:
                        'content_block_type_mismatch_text' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      expected_type:
                        'text' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      actual_type:
                        contentBlock.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    })
                    // 抛出 new Error('Content block is not a text block')，阻止API 服务 claude在无效状态下继续运行。
                    throw new Error('Content block is not a text block')
                  }
                  // API 服务 claude在这里处理 `contentBlock.text += delta.text`，完成这一小步状态转换。
                  contentBlock.text += delta.text
                  // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                  break
                case 'signature_delta':
                  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
                  if (
                    feature('CONNECTOR_TEXT') &&
                    contentBlock.type === 'connector_text'
                  ) {
                    // signature更新为 `delta.signature`，确保API 服务后续读取最新状态。
                    contentBlock.signature = delta.signature
                    // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                    break
                  }
                  // `contentBlock.type` 与 `'thinking'` 不一致时刷新派生状态，避免使用过期结果。
                  if (contentBlock.type !== 'thinking') {
                    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_streaming_error', {
                      error_type:
                        'content_block_type_mismatch_thinking_signature' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      expected_type:
                        'thinking' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      actual_type:
                        contentBlock.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    })
                    // 抛出 new Error('Content block is not a thinking block')，阻止API 服务 claude在无效状态下继续运行。
                    throw new Error('Content block is not a thinking block')
                  }
                  // signature更新为 `delta.signature`，确保API 服务后续读取最新状态。
                  contentBlock.signature = delta.signature
                  // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                  break
                case 'thinking_delta':
                  // `contentBlock.type` 与 `'thinking'` 不一致时刷新派生状态，避免使用过期结果。
                  if (contentBlock.type !== 'thinking') {
                    // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
                    logEvent('tengu_streaming_error', {
                      error_type:
                        'content_block_type_mismatch_thinking_delta' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      expected_type:
                        'thinking' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                      actual_type:
                        contentBlock.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                    })
                    // 抛出 new Error('Content block is not a thinking block')，阻止API 服务 claude在无效状态下继续运行。
                    throw new Error('Content block is not a thinking block')
                  }
                  // API 服务 claude在这里处理 `contentBlock.thinking += delta.thinking`，完成这一小步状态转换。
                  contentBlock.thinking += delta.thinking
                  // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
                  break
              }
            }
            // Capture research from content_block_delta if available (internal only).
            // Always overwrite with the latest value.
            // 组合条件 `process.env.USER_TYPE === 'ant' && 'research' in` 成立时，API 服务 claude才启用这条专门路径。
            if (process.env.USER_TYPE === 'ant' && 'research' in part) {
              // research更新为 `(part as { research: unknown }).research`，确保API 服务后续读取最新状态。
              research = (part as { research: unknown }).research
            }
            // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
            break
          }
          case 'content_block_stop': {
            // contentBlock读取 `contentBlocks[part.index]` 对应条目，后续围绕该成员继续处理。
            const contentBlock = contentBlocks[part.index]
            // contentBlock缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
            if (!contentBlock) {
              // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_streaming_error', {
                error_type:
                  'content_block_not_found_stop' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                part_type:
                  part.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                part_index: part.index,
              })
              // 抛出 new RangeError('Content block not found')，阻止API 服务 claude在无效状态下继续运行。
              throw new RangeError('Content block not found')
            }
            // partialMessage 消息数据缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
            if (!partialMessage) {
              // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_streaming_error', {
                error_type:
                  'partial_message_not_found' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
                part_type:
                  part.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              })
              // 抛出 new Error('Message not found')，阻止API 服务 claude在无效状态下继续运行。
              throw new Error('Message not found')
            }
            // m 集中保存API 服务 claude要一起传递的字段。
            const m: AssistantMessage = {
              message: {
                ...partialMessage,
                content: normalizeContentFromAPI(
                  [contentBlock] as BetaContentBlock[],
                  tools,
                  options.agentId,
                ),
              },
              requestId: streamRequestId ?? undefined,
              type: 'assistant',
              uuid: randomUUID(),
              timestamp: new Date().toISOString(),
              ...(process.env.USER_TYPE === 'ant' &&
                research !== undefined && { research }),
              ...(advisorModel && { advisorModel }),
            }
            // newMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
            newMessages.push(m)
            // 生成器产出 `m`，把阶段性结果交给上层消费。
            yield m
            // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
            break
          }
          case 'message_delta': {
            // usage更新为 `updateUsage(usage, part.usage)`，确保API 服务后续读取最新状态。
            usage = updateUsage(usage, part.usage)
            // Capture research from message_delta if available (internal only).
            // Always overwrite with the latest value. Also write back to
            // already-yielded messages since message_delta arrives after
            // content_block_stop.
            // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
            if (
              process.env.USER_TYPE === 'ant' &&
              'research' in (part as unknown as Record<string, unknown>)
            ) {
              // research更新为 `(part as unknown as Record<string, unknown>).research`，确保API 服务后续读取最新状态。
              research = (part as unknown as Record<string, unknown>).research
              // 按顺序遍历 `newMessages` 中的消息，逐个交给API 服务 claude处理。
              for (const msg of newMessages) {
                // research更新为 `research`，确保API 服务后续读取最新状态。
                msg.research = research
              }
            }

            // Write final usage and stop_reason back to the last yielded
            // message. Messages are created at content_block_stop from
            // partialMessage, which was set at message_start before any tokens
            // were generated (output_tokens: 0, stop_reason: null).
            // message_delta arrives after content_block_stop with the real
            // values.
            //
            // IMPORTANT: Use direct property mutation, not object replacement.
            // The transcript write queue holds a reference to message.message
            // and serializes it lazily (100ms flush interval). Object
            // replacement ({ ...lastMsg.message, usage }) would disconnect
            // the queued reference; direct mutation ensures the transcript
            // captures the final values.
            // stopReason更新为 `part.delta.stop_reason`，确保API 服务后续读取最新状态。
            stopReason = part.delta.stop_reason

            // lastMsg保存`newMessages.at`，供API 服务 claude后续处理使用。
            const lastMsg = newMessages.at(-1)
            // 满足 `lastMsg` 时，API 服务 claude执行该分支。
            if (lastMsg) {
              // usage更新为 `usage`，确保API 服务后续读取最新状态。
              lastMsg.message.usage = usage
              // stop_reason更新为 `stopReason`，确保API 服务后续读取最新状态。
              lastMsg.message.stop_reason = stopReason
            }

            // Update cost
            // costUSDForPart保存`calculateUSDCost`，供API 服务 claude后续处理使用。
            const costUSDForPart = calculateUSDCost(resolvedModel, usage)
            // API 服务 claude在这里处理 `costUSD += addToTotalSessionCost(`，完成这一小步状态转换。
            costUSD += addToTotalSessionCost(
              costUSDForPart,
              usage,
              options.model,
            )

            // refusalMessage 消息数据读取`getErrorMessageIfRefusal`，供API 服务 claude后续处理使用。
            const refusalMessage = getErrorMessageIfRefusal(
              part.delta.stop_reason,
              options.model,
            )
            // 满足 `refusalMessage` 时，API 服务 claude执行该分支。
            if (refusalMessage) {
              // 生成器产出 `refusalMessage`，把阶段性结果交给上层消费。
              yield refusalMessage
            }

            // 当 `stopReason` 匹配 `'max_tokens'` 时，API 服务 claude执行对应分支。
            if (stopReason === 'max_tokens') {
              // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_max_tokens_reached', {
                max_tokens: maxOutputTokens,
              })
              // 生成器产出 `createAssistantAPIErrorMessage({`，把阶段性结果交给上层消费。
              yield createAssistantAPIErrorMessage({
                content: `${API_ERROR_MESSAGE_PREFIX}: Claude's response exceeded the ${
                  maxOutputTokens
                } output token maximum. To configure this behavior, set the CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable.`,
                apiError: 'max_output_tokens',
                error: 'max_output_tokens',
              })
            }

            // 当 `stopReason` 匹配 `'model_context_window_excee...` 时，API 服务 claude执行对应分支。
            if (stopReason === 'model_context_window_exceeded') {
              // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
              logEvent('tengu_context_window_exceeded', {
                max_tokens: maxOutputTokens,
                output_tokens: usage.output_tokens,
              })
              // Reuse the max_output_tokens recovery path — from the model's
              // perspective, both mean "response was cut off, continue from
              // where you left off."
              // 生成器产出 `createAssistantAPIErrorMessage({`，把阶段性结果交给上层消费。
              yield createAssistantAPIErrorMessage({
                content: `${API_ERROR_MESSAGE_PREFIX}: The model has reached its context window limit.`,
                apiError: 'max_output_tokens',
                error: 'max_output_tokens',
              })
            }
            // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
            break
          }
          case 'message_stop':
            // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
            break
        }

        // 生成器产出 `{`，把阶段性结果交给上层消费。
        yield {
          type: 'stream_event',
          event: part,
          ...(part.type === 'message_start' ? { ttftMs } : undefined),
        }
      }
      // Clear the idle timeout watchdog now that the stream loop has exited
      // 调用 clearStreamIdleTimers，触发API 服务 claude此处需要的副作用。
      clearStreamIdleTimers()

      // If the stream was aborted by our idle timeout watchdog, fall back to
      // non-streaming retry rather than treating it as a completed stream.
      // 满足 `streamIdleAborted` 时，API 服务 claude执行该分支。
      if (streamIdleAborted) {
        // Instrumentation: proves the for-await exited after the watchdog fired
        // (vs. hung forever). exit_delay_ms measures abort propagation latency:
        // 0-10ms = abort worked; >>1000ms = something else woke the loop.
        // exitDelayMs 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const exitDelayMs =
          streamWatchdogFiredAt !== null
            ? Math.round(performance.now() - streamWatchdogFiredAt)
            : -1
        // 调用 logForDiagnosticsNoPII，触发API 服务 claude此处需要的副作用。
        logForDiagnosticsNoPII(
          'info',
          'cli_stream_loop_exited_after_watchdog_clean',
        )
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_stream_loop_exited_after_watchdog', {
          request_id: (streamRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          exit_delay_ms: exitDelayMs,
          exit_path:
            'clean' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          model:
            options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // Prevent double-emit: this throw lands in the catch block below,
        // whose exit_path='error' probe guards on streamWatchdogFiredAt.
        // streamWatchdogFiredAt更新为 `null`，确保API 服务后续读取最新状态。
        streamWatchdogFiredAt = null
        // 抛出 new Error('Stream idle timeout - no chunks received')，阻止API 服务 claude在无效状态下继续运行。
        throw new Error('Stream idle timeout - no chunks received')
      }

      // Detect when the stream completed without producing any assistant messages.
      // This covers two proxy failure modes:
      // 1. No events at all (!partialMessage): proxy returned 200 with non-SSE body
      // 2. Partial events (partialMessage set but no content blocks completed AND
      //    no stop_reason received): proxy returned message_start but stream ended
      //    before content_block_stop and before message_delta with stop_reason
      // BetaMessageStream had the first check in _endRequest() but the raw Stream
      // does not - without it the generator silently returns no assistant messages,
      // causing "Execution error" in -p mode.
      // Note: We must check stopReason to avoid false positives. For example, with
      // structured output (--json-schema), the model calls a StructuredOutput tool
      // on turn 1, then on turn 2 responds with end_turn and no content blocks.
      // That's a legitimate empty response, not an incomplete stream.
      // 组合条件 `!partialMessage || (newMessages.length === 0 && !stopReason)` 成立时，API 服务 claude才启用这条专门路径。
      if (!partialMessage || (newMessages.length === 0 && !stopReason)) {
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          !partialMessage
            ? 'Stream completed without receiving message_start event - triggering non-streaming fallback'
            : 'Stream completed with message_start but no content blocks completed - triggering non-streaming fallback',
          { level: 'error' },
        )
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_stream_no_events', {
          model:
            options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          request_id: (streamRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 抛出 new Error('Stream ended without receiving any events')，阻止API 服务 claude在无效状态下继续运行。
        throw new Error('Stream ended without receiving any events')
      }

      // Log summary if any stalls occurred during streaming
      // 满足 `stallCount > 0` 时，API 服务 claude执行该分支。
      if (stallCount > 0) {
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Streaming completed with ${stallCount} stall(s), total stall time: ${(totalStallTime / 1000).toFixed(1)}s`,
          { level: 'warn' },
        )
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_streaming_stall_summary', {
          stall_count: stallCount,
          total_stall_time_ms: totalStallTime,
          model:
            options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          request_id: (streamRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
      }

      // Check if the cache actually broke based on response tokens
      // 满足 `feature('PROMPT_CACHE_BREAK_DETECTION')` 时，API 服务 claude执行该分支。
      if (feature('PROMPT_CACHE_BREAK_DETECTION')) {
        // 显式忽略 `checkResponseForCacheBreak(` 的返回值，只保留它触发的副作用。
        void checkResponseForCacheBreak(
          options.querySource,
          usage.cache_read_input_tokens,
          usage.cache_creation_input_tokens,
          messages,
          options.agentId,
          streamRequestId,
        )
      }

      // Process fallback percentage header and quota status if available
      // streamResponse is set when the stream is created in the withRetry callback above
      // TypeScript's control flow analysis can't track that streamResponse is set in the callback
      // eslint-disable-next-line eslint-plugin-n/no-unsupported-features/node-builtins
      // resp保存`streamResponse as unknown as Response | undefined`，供后续判断或组装使用。
      const resp = streamResponse as unknown as Response | undefined
      // 满足 `resp` 时，API 服务 claude执行该分支。
      if (resp) {
        // 调用 extractQuotaStatusFromHeaders，触发API 服务 claude此处需要的副作用。
        extractQuotaStatusFromHeaders(resp.headers)
        // Store headers for gateway detection
        // responseHeaders 响应数据更新为 `resp.headers`，确保API 服务后续读取最新状态。
        responseHeaders = resp.headers
      }
    } catch (streamingError) {
      // Clear the idle timeout watchdog on error path too
      // 调用 clearStreamIdleTimers，触发API 服务 claude此处需要的副作用。
      clearStreamIdleTimers()

      // Instrumentation: if the watchdog had already fired and the for-await
      // threw (rather than exiting cleanly), record that the loop DID exit and
      // how long after the watchdog. Distinguishes true hangs from error exits.
      // `streamIdleAborted && streamWatchdogFiredAt` 与 `nu` 不一致时刷新派生状态，避免使用过期结果。
      if (streamIdleAborted && streamWatchdogFiredAt !== null) {
        // exitDelayMs 集合保存`Math.round`，供API 服务 claude后续处理使用。
        const exitDelayMs = Math.round(
          performance.now() - streamWatchdogFiredAt,
        )
        // 调用 logForDiagnosticsNoPII，触发API 服务 claude此处需要的副作用。
        logForDiagnosticsNoPII(
          'info',
          'cli_stream_loop_exited_after_watchdog_error',
        )
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_stream_loop_exited_after_watchdog', {
          request_id: (streamRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          exit_delay_ms: exitDelayMs,
          exit_path:
            'error' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          error_name:
            streamingError instanceof Error
              ? (streamingError.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
              : ('unknown' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS),
          model:
            options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
      }

      // 满足 `streamingError instanceof APIUserAbortError` 时，API 服务 claude执行该分支。
      if (streamingError instanceof APIUserAbortError) {
        // Check if the abort signal was triggered by the user (ESC key)
        // If the signal is aborted, it's a user-initiated abort
        // If not, it's likely a timeout from the SDK
        // 满足 `signal.aborted` 时，API 服务 claude执行该分支。
        if (signal.aborted) {
          // This is a real user abort (ESC key was pressed)
          // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Streaming aborted by user: ${errorMessage(streamingError)}`,
          )
          // 满足 `isAdvisorInProgress` 时，API 服务 claude执行该分支。
          if (isAdvisorInProgress) {
            // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
            logEvent('tengu_advisor_tool_interrupted', {
              model:
                options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
              advisor_model: (advisorModel ??
                'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
            })
          }
          // 抛出 streamingError，阻止API 服务 claude在无效状态下继续运行。
          throw streamingError
        } else {
          // The SDK threw APIUserAbortError but our signal wasn't aborted
          // This means it's a timeout from the SDK's internal timeout
          // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            `Streaming timeout (SDK abort): ${streamingError.message}`,
            { level: 'error' },
          )
          // Throw a more specific error for timeout
          // 抛出 new APIConnectionTimeoutError({ message: 'Request timed out' })，阻止API 服务 claude在无效状态下继续运行。
          throw new APIConnectionTimeoutError({ message: 'Request timed out' })
        }
      }

      // When the flag is enabled, skip the non-streaming fallback and let the
      // error propagate to withRetry. The mid-stream fallback causes double tool
      // execution when streaming tool execution is active: the partial stream
      // starts a tool, then the non-streaming retry produces the same tool_use
      // and runs it again. See inc-4258.
      // disableFallback 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const disableFallback =
        isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK) ||
        getFeatureValue_CACHED_MAY_BE_STALE(
          'tengu_disable_streaming_to_non_streaming_fallback',
          false,
        )

      // 满足 `disableFallback` 时，API 服务 claude执行该分支。
      if (disableFallback) {
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Error streaming (non-streaming fallback disabled): ${errorMessage(streamingError)}`,
          { level: 'error' },
        )
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logEvent('tengu_streaming_fallback_to_non_streaming', {
          model:
            options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          error:
            streamingError instanceof Error
              ? (streamingError.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
              : (String(
                  streamingError,
                ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS),
          attemptNumber,
          maxOutputTokens,
          thinkingType:
            thinkingConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          fallback_disabled: true,
          request_id: (streamRequestId ??
            'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
          fallback_cause: (streamIdleAborted
            ? 'watchdog'
            : 'other') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        })
        // 抛出 streamingError，阻止API 服务 claude在无效状态下继续运行。
        throw streamingError
      }

      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        `Error streaming, falling back to non-streaming mode: ${errorMessage(streamingError)}`,
        { level: 'error' },
      )
      // didFallBackToNonStreaming更新为 `true`，确保API 服务后续读取最新状态。
      didFallBackToNonStreaming = true
      // 满足 `options.onStreamingFallback` 时，API 服务 claude执行该分支。
      if (options.onStreamingFallback) {
        // 调用 options.onStreamingFallback，触发API 服务 claude此处需要的副作用。
        options.onStreamingFallback()
      }

      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_streaming_fallback_to_non_streaming', {
        model:
          options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        error:
          streamingError instanceof Error
            ? (streamingError.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS)
            : (String(
                streamingError,
              ) as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS),
        attemptNumber,
        maxOutputTokens,
        thinkingType:
          thinkingConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        fallback_disabled: false,
        request_id: (streamRequestId ??
          'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        fallback_cause: (streamIdleAborted
          ? 'watchdog'
          : 'other') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // Fall back to non-streaming mode with retries.
      // If the streaming failure was itself a 529, count it toward the
      // consecutive-529 budget so total 529s-before-model-fallback is the
      // same whether the overload was hit in streaming or non-streaming mode.
      // This is a speculative fix for https://github.com/anthropics/claude-code/issues/1513
      // Instrumentation: proves executeNonStreamingRequest was entered (vs. the
      // fallback event firing but the call itself hanging at dispatch).
      // 调用 logForDiagnosticsNoPII，触发API 服务 claude此处需要的副作用。
      logForDiagnosticsNoPII('info', 'cli_nonstreaming_fallback_started')
      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_nonstreaming_fallback_started', {
        request_id: (streamRequestId ??
          'unknown') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        model:
          options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        fallback_cause: (streamIdleAborted
          ? 'watchdog'
          : 'other') as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })
      // 结果保存`executeNonStreamingRequest`，供API 服务 claude后续处理使用。
      const result = yield* executeNonStreamingRequest(
        { model: options.model, source: options.querySource },
        {
          model: options.model,
          fallbackModel: options.fallbackModel,
          thinkingConfig,
          ...(isFastModeEnabled() && { fastMode: isFastMode }),
          signal,
          initialConsecutive529Errors: is529Error(streamingError) ? 1 : 0,
          querySource: options.querySource,
        },
        paramsFromContext,
        // 这个回调绑定到 (attempt, _startTime, tokens) => {，负责API 服务 claude在该局部场景下的响应。
        (attempt, _startTime, tokens) => {
          // attemptNumber更新为 `attempt`，确保API 服务后续读取最新状态。
          attemptNumber = attempt
          // maxOutputTokens 集合更新为 `tokens`，确保API 服务后续读取最新状态。
          maxOutputTokens = tokens
        },
        // params 集合更新为 `> captureAPIRequest(params, options.querySource)`，确保API 服务后续读取最新状态。
        params => captureAPIRequest(params, options.querySource),
        streamRequestId,
      )

      // m 集中保存API 服务 claude要一起传递的字段。
      const m: AssistantMessage = {
        message: {
          ...result,
          content: normalizeContentFromAPI(
            result.content,
            tools,
            options.agentId,
          ),
        },
        requestId: streamRequestId ?? undefined,
        type: 'assistant',
        uuid: randomUUID(),
        timestamp: new Date().toISOString(),
        ...(process.env.USER_TYPE === 'ant' &&
          research !== undefined && {
            research,
          }),
        ...(advisorModel && {
          advisorModel,
        }),
      }
      // newMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
      newMessages.push(m)
      // fallbackMessage 消息数据更新为 `m`，确保API 服务后续读取最新状态。
      fallbackMessage = m
      // 生成器产出 `m`，把阶段性结果交给上层消费。
      yield m
    } finally {
      // 调用 clearStreamIdleTimers，触发API 服务 claude此处需要的副作用。
      clearStreamIdleTimers()
    }
  } catch (errorFromRetry) {
    // FallbackTriggeredError must propagate to query.ts, which performs the
    // actual model switch. Swallowing it here would turn the fallback into a
    // no-op — the user would just see "Model fallback triggered: X -> Y" as
    // an error message with no actual retry on the fallback model.
    // 满足 `errorFromRetry instanceof FallbackTriggeredError` 时，API 服务 claude执行该分支。
    if (errorFromRetry instanceof FallbackTriggeredError) {
      // 抛出 errorFromRetry，阻止API 服务 claude在无效状态下继续运行。
      throw errorFromRetry
    }

    // Check if this is a 404 error during stream creation that should trigger
    // non-streaming fallback. This handles gateways that return 404 for streaming
    // endpoints but work fine with non-streaming. Before v2.1.8, BetaMessageStream
    // threw 404s during iteration (caught by inner catch with fallback), but now
    // with raw streams, 404s are thrown during creation (caught here).
    // is404StreamCreationError 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
    const is404StreamCreationError =
      !didFallBackToNonStreaming &&
      errorFromRetry instanceof CannotRetryError &&
      errorFromRetry.originalError instanceof APIError &&
      errorFromRetry.originalError.status === 404

    // 满足 `is404StreamCreationError` 时，API 服务 claude执行该分支。
    if (is404StreamCreationError) {
      // 404 is thrown at .withResponse() before streamRequestId is assigned,
      // and CannotRetryError means every retry failed — so grab the failed
      // request's ID from the error header instead.
      // failedRequestId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const failedRequestId =
        (errorFromRetry.originalError as APIError).requestID ?? 'unknown'
      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logForDebugging(
        'Streaming endpoint returned 404, falling back to non-streaming mode',
        { level: 'warn' },
      )
      // didFallBackToNonStreaming更新为 `true`，确保API 服务后续读取最新状态。
      didFallBackToNonStreaming = true
      // 满足 `options.onStreamingFallback` 时，API 服务 claude执行该分支。
      if (options.onStreamingFallback) {
        // 调用 options.onStreamingFallback，触发API 服务 claude此处需要的副作用。
        options.onStreamingFallback()
      }

      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logEvent('tengu_streaming_fallback_to_non_streaming', {
        model:
          options.model as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        error:
          '404_stream_creation' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        attemptNumber,
        maxOutputTokens,
        thinkingType:
          thinkingConfig.type as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        request_id:
          failedRequestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
        fallback_cause:
          '404_stream_creation' as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      })

      // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
      try {
        // Fall back to non-streaming mode
        // 结果保存`executeNonStreamingRequest`，供API 服务 claude后续处理使用。
        const result = yield* executeNonStreamingRequest(
          { model: options.model, source: options.querySource },
          {
            model: options.model,
            fallbackModel: options.fallbackModel,
            thinkingConfig,
            ...(isFastModeEnabled() && { fastMode: isFastMode }),
            signal,
          },
          paramsFromContext,
          // 这个回调绑定到 (attempt, _startTime, tokens) => {，负责API 服务 claude在该局部场景下的响应。
          (attempt, _startTime, tokens) => {
            // attemptNumber更新为 `attempt`，确保API 服务后续读取最新状态。
            attemptNumber = attempt
            // maxOutputTokens 集合更新为 `tokens`，确保API 服务后续读取最新状态。
            maxOutputTokens = tokens
          },
          // params 集合更新为 `> captureAPIRequest(params, options.querySource)`，确保API 服务后续读取最新状态。
          params => captureAPIRequest(params, options.querySource),
          failedRequestId,
        )

        // m 集中保存API 服务 claude要一起传递的字段。
        const m: AssistantMessage = {
          message: {
            ...result,
            content: normalizeContentFromAPI(
              result.content,
              tools,
              options.agentId,
            ),
          },
          requestId: streamRequestId ?? undefined,
          type: 'assistant',
          uuid: randomUUID(),
          timestamp: new Date().toISOString(),
          ...(process.env.USER_TYPE === 'ant' &&
            research !== undefined && { research }),
          ...(advisorModel && { advisorModel }),
        }
        // newMessages 消息数据追加新条目，保持收集顺序与输入顺序一致。
        newMessages.push(m)
        // fallbackMessage 消息数据更新为 `m`，确保API 服务后续读取最新状态。
        fallbackMessage = m
        // 生成器产出 `m`，把阶段性结果交给上层消费。
        yield m

        // Continue to success logging below
      } catch (fallbackError) {
        // Propagate model-fallback signal to query.ts (see comment above).
        // 满足 `fallbackError instanceof FallbackTriggeredError` 时，API 服务 claude执行该分支。
        if (fallbackError instanceof FallbackTriggeredError) {
          // 抛出 fallbackError，阻止API 服务 claude在无效状态下继续运行。
          throw fallbackError
        }

        // Fallback also failed, handle as normal error
        // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
        logForDebugging(
          `Non-streaming fallback also failed: ${errorMessage(fallbackError)}`,
          { level: 'error' },
        )

        // 错误保存`fallbackError`，供API 服务 claude后续判断或输出使用。
        let error = fallbackError
        // errorModel 错误信息保存`options.model`，供API 服务 claude后续判断或输出使用。
        let errorModel = options.model
        // 满足 `fallbackError instanceof CannotRetryError` 时，API 服务 claude执行该分支。
        if (fallbackError instanceof CannotRetryError) {
          // 错误更新为 `fallbackError.originalError`，确保API 服务后续读取最新状态。
          error = fallbackError.originalError
          // errorModel 错误信息更新为 `fallbackError.retryContext.model`，确保API 服务后续读取最新状态。
          errorModel = fallbackError.retryContext.model
        }

        // 满足 `error instanceof APIError` 时，API 服务 claude执行该分支。
        if (error instanceof APIError) {
          // 调用 extractQuotaStatusFromError，触发API 服务 claude此处需要的副作用。
          extractQuotaStatusFromError(error)
        }

        // requestId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
        const requestId =
          streamRequestId ||
          (error instanceof APIError ? error.requestID : undefined) ||
          (error instanceof APIError
            ? (error.error as { request_id?: string })?.request_id
            : undefined)

        // 调用 logAPIError，触发API 服务 claude此处需要的副作用。
        logAPIError({
          error,
          model: errorModel,
          messageCount: messagesForAPI.length,
          messageTokens: tokenCountFromLastAPIResponse(messagesForAPI),
          durationMs: Date.now() - start,
          durationMsIncludingRetries: Date.now() - startIncludingRetries,
          attempt: attemptNumber,
          requestId,
          clientRequestId,
          didFallBackToNonStreaming,
          queryTracking: options.queryTracking,
          querySource: options.querySource,
          llmSpan,
          fastMode: isFastModeRequest,
          previousRequestId,
        })

        // 满足 `error instanceof APIUserAbortError` 时，API 服务 claude执行该分支。
        if (error instanceof APIUserAbortError) {
          // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
          releaseStreamResources()
          // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
          return
        }

        // 生成器产出 `getAssistantMessageFromError(error, errorModel, {`，把阶段性结果交给上层消费。
        yield getAssistantMessageFromError(error, errorModel, {
          messages,
          messagesForAPI,
        })
        // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
        releaseStreamResources()
        // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }
    } else {
      // Original error handling for non-404 errors
      // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
      logForDebugging(`Error in API request: ${errorMessage(errorFromRetry)}`, {
        level: 'error',
      })

      // 错误 命名 `errorFromRetry`，让后续代码直接表达这个值的用途。
      let error = errorFromRetry
      // errorModel 错误信息保存`options.model`，供API 服务 claude后续判断或输出使用。
      let errorModel = options.model
      // 满足 `errorFromRetry instanceof CannotRetryError` 时，API 服务 claude执行该分支。
      if (errorFromRetry instanceof CannotRetryError) {
        // 错误更新为 `errorFromRetry.originalError`，确保API 服务后续读取最新状态。
        error = errorFromRetry.originalError
        // errorModel 错误信息更新为 `errorFromRetry.retryContext.model`，确保API 服务后续读取最新状态。
        errorModel = errorFromRetry.retryContext.model
      }

      // Extract quota status from error headers if it's a rate limit error
      // 满足 `error instanceof APIError` 时，API 服务 claude执行该分支。
      if (error instanceof APIError) {
        // 调用 extractQuotaStatusFromError，触发API 服务 claude此处需要的副作用。
        extractQuotaStatusFromError(error)
      }

      // Extract requestId from stream, error header, or error body
      // requestId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
      const requestId =
        streamRequestId ||
        (error instanceof APIError ? error.requestID : undefined) ||
        (error instanceof APIError
          ? (error.error as { request_id?: string })?.request_id
          : undefined)

      // 调用 logAPIError，触发API 服务 claude此处需要的副作用。
      logAPIError({
        error,
        model: errorModel,
        messageCount: messagesForAPI.length,
        messageTokens: tokenCountFromLastAPIResponse(messagesForAPI),
        durationMs: Date.now() - start,
        durationMsIncludingRetries: Date.now() - startIncludingRetries,
        attempt: attemptNumber,
        requestId,
        clientRequestId,
        didFallBackToNonStreaming,
        queryTracking: options.queryTracking,
        querySource: options.querySource,
        llmSpan,
        fastMode: isFastModeRequest,
        previousRequestId,
      })

      // Don't yield an assistant error message for user aborts
      // The interruption message is handled in query.ts
      // 满足 `error instanceof APIUserAbortError` 时，API 服务 claude执行该分支。
      if (error instanceof APIUserAbortError) {
        // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
        releaseStreamResources()
        // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
        return
      }

      // 生成器产出 `getAssistantMessageFromError(error, errorModel, {`，把阶段性结果交给上层消费。
      yield getAssistantMessageFromError(error, errorModel, {
        messages,
        messagesForAPI,
      })
      // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
      releaseStreamResources()
      // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
      return
    }
  } finally {
    // 调用 stopSessionActivity，触发API 服务 claude此处需要的副作用。
    stopSessionActivity('api_call')
    // Must be in the finally block: if the generator is terminated early
    // via .return() (e.g. consumer breaks out of for-await-of, or query.ts
    // encounters an abort), code after the try/finally never executes.
    // Without this, the Response object's native TLS/socket buffers leak
    // until the generator itself is GC'd (see GH #32920).
    // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
    releaseStreamResources()

    // Non-streaming fallback cost: the streaming path tracks cost in the
    // message_delta handler before any yield. Fallback pushes to newMessages
    // then yields, so tracking must be here to survive .return() at the yield.
    // 满足 `fallbackMessage` 时，API 服务 claude执行该分支。
    if (fallbackMessage) {
      // fallbackUsage保存`fallbackMessage.message.usage`，供API 服务 claude后续判断或输出使用。
      const fallbackUsage = fallbackMessage.message.usage
      // usage更新为 `updateUsage(EMPTY_USAGE, fallbackUsage)`，确保API 服务后续读取最新状态。
      usage = updateUsage(EMPTY_USAGE, fallbackUsage)
      // stopReason更新为 `fallbackMessage.message.stop_reason`，确保API 服务后续读取最新状态。
      stopReason = fallbackMessage.message.stop_reason
      // fallbackCost保存`calculateUSDCost`，供API 服务 claude后续处理使用。
      const fallbackCost = calculateUSDCost(resolvedModel, fallbackUsage)
      // API 服务 claude在这里处理 `costUSD += addToTotalSessionCost(`，完成这一小步状态转换。
      costUSD += addToTotalSessionCost(
        fallbackCost,
        fallbackUsage,
        options.model,
      )
    }
  }

  // Mark all registered tools as sent to API so they become eligible for deletion
  // 组合条件 `feature('CACHED_MICROCOMPACT') && cachedMCEnabled` 成立时，API 服务 claude才启用这条专门路径。
  if (feature('CACHED_MICROCOMPACT') && cachedMCEnabled) {
    // 调用 markToolsSentToAPIState，触发API 服务 claude此处需要的副作用。
    markToolsSentToAPIState()
  }

  // Track the last requestId for the main conversation chain so shutdown
  // can send a cache eviction hint to inference. Exclude backgrounded
  // sessions (Ctrl+B) which share the repl_main_thread querySource but
  // run inside an agent context — they are independent conversation chains
  // whose cache should not be evicted when the foreground session clears.
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    streamRequestId &&
    !getAgentContext() &&
    (options.querySource.startsWith('repl_main_thread') ||
      options.querySource === 'sdk')
  ) {
    // setLastMainRequestId 写入新的状态值，使API 服务 claude后续读取保持一致。
    setLastMainRequestId(streamRequestId)
  }

  // Precompute scalars so the fire-and-forget .then() closure doesn't pin the
  // full messagesForAPI array (the entire conversation up to the context window
  // limit) until getToolPermissionContext() resolves.
  // logMessageCount 消息数据保存 `messagesForAPI.length` 的判断结果，供API 服务 claude后续分支直接复用。
  const logMessageCount = messagesForAPI.length
  // logMessageTokens 消息数据保存`tokenCountFromLastAPIResponse`，供API 服务 claude后续处理使用。
  const logMessageTokens = tokenCountFromLastAPIResponse(messagesForAPI)
  // 这个回调绑定到 void options.getToolPermissionContext().then(permissionContext => {，负责API 服务 claude在该局部场景下的响应。
  void options.getToolPermissionContext().then(permissionContext => {
    // 调用 logAPISuccessAndDuration，触发API 服务 claude此处需要的副作用。
    logAPISuccessAndDuration({
      model:
        newMessages[0]?.message.model ?? partialMessage?.model ?? options.model,
      preNormalizedModel: options.model,
      usage,
      start,
      startIncludingRetries,
      attempt: attemptNumber,
      messageCount: logMessageCount,
      messageTokens: logMessageTokens,
      requestId: streamRequestId ?? null,
      stopReason,
      ttftMs,
      didFallBackToNonStreaming,
      querySource: options.querySource,
      headers: responseHeaders,
      costUSD,
      queryTracking: options.queryTracking,
      permissionMode: permissionContext.mode,
      // Pass newMessages for beta tracing - extraction happens in logging.ts
      // only when beta tracing is enabled
      newMessages,
      llmSpan,
      globalCacheStrategy,
      requestSetupMs: start - startIncludingRetries,
      attemptStartTimes,
      fastMode: isFastModeRequest,
      previousRequestId,
      betas: lastRequestBetas,
    })
  })

  // Defensive: also release on normal completion (no-op if finally already ran).
  // 调用 releaseStreamResources，触发API 服务 claude此处需要的副作用。
  releaseStreamResources()
}

/**
 * Cleans up stream resources to prevent memory leaks.
 * @internal Exported for testing
 */
// cleanupStream 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function cleanupStream(
  stream: Stream<BetaRawMessageStreamEvent> | undefined,
): void {
  // stream缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
  if (!stream) {
    // API 服务 claude在这里结束当前路径，避免继续执行不适用的后续分支。
    return
  }
  // 保护这一段可能失败的API 服务 claude操作，确保异常能进入相邻错误处理。
  try {
    // Abort the stream via its controller if not already aborted
    // stream.controller.signal.aborted缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
    if (!stream.controller.signal.aborted) {
      // 触发取消信号，通知API 服务 claude中仍在等待的异步任务尽快停止。
      stream.controller.abort()
    }
  } catch {
    // Ignore - stream may already be closed
  }
}

/**
 * Updates usage statistics with new values from streaming API events.
 * Note: Anthropic's streaming API provides cumulative usage totals, not incremental deltas.
 * Each event contains the complete usage up to that point in the stream.
 *
 * Input-related tokens (input_tokens, cache_creation_input_tokens, cache_read_input_tokens)
 * are typically set in message_start and remain constant. message_delta events may send
 * explicit 0 values for these fields, which should not overwrite the values from message_start.
 * We only update these fields if they have a non-null, non-zero value.
 */
// updateUsage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function updateUsage(
  usage: Readonly<NonNullableUsage>,
  partUsage: BetaMessageDeltaUsage | undefined,
): NonNullableUsage {
  // partUsage缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
  if (!partUsage) {
    // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
    return { ...usage }
  }
  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    input_tokens:
      partUsage.input_tokens !== null && partUsage.input_tokens > 0
        ? partUsage.input_tokens
        : usage.input_tokens,
    cache_creation_input_tokens:
      partUsage.cache_creation_input_tokens !== null &&
      partUsage.cache_creation_input_tokens > 0
        ? partUsage.cache_creation_input_tokens
        : usage.cache_creation_input_tokens,
    cache_read_input_tokens:
      partUsage.cache_read_input_tokens !== null &&
      partUsage.cache_read_input_tokens > 0
        ? partUsage.cache_read_input_tokens
        : usage.cache_read_input_tokens,
    output_tokens: partUsage.output_tokens ?? usage.output_tokens,
    server_tool_use: {
      web_search_requests:
        partUsage.server_tool_use?.web_search_requests ??
        usage.server_tool_use.web_search_requests,
      web_fetch_requests:
        partUsage.server_tool_use?.web_fetch_requests ??
        usage.server_tool_use.web_fetch_requests,
    },
    service_tier: usage.service_tier,
    cache_creation: {
      // SDK type BetaMessageDeltaUsage is missing cache_creation, but it's real!
      ephemeral_1h_input_tokens:
        (partUsage as BetaUsage).cache_creation?.ephemeral_1h_input_tokens ??
        usage.cache_creation.ephemeral_1h_input_tokens,
      ephemeral_5m_input_tokens:
        (partUsage as BetaUsage).cache_creation?.ephemeral_5m_input_tokens ??
        usage.cache_creation.ephemeral_5m_input_tokens,
    },
    // cache_deleted_input_tokens: returned by the API when cache editing
    // deletes KV cache content, but not in SDK types. Kept off NonNullableUsage
    // so the string is eliminated from external builds by dead code elimination.
    // Uses the same > 0 guard as other token fields to prevent message_delta
    // from overwriting the real value with 0.
    ...(feature('CACHED_MICROCOMPACT')
      ? {
          cache_deleted_input_tokens:
            (partUsage as unknown as { cache_deleted_input_tokens?: number })
              .cache_deleted_input_tokens != null &&
            (partUsage as unknown as { cache_deleted_input_tokens: number })
              .cache_deleted_input_tokens > 0
              ? (partUsage as unknown as { cache_deleted_input_tokens: number })
                  .cache_deleted_input_tokens
              : ((usage as unknown as { cache_deleted_input_tokens?: number })
                  .cache_deleted_input_tokens ?? 0),
        }
      : {}),
    inference_geo: usage.inference_geo,
    iterations: partUsage.iterations ?? usage.iterations,
    speed: (partUsage as BetaUsage).speed ?? usage.speed,
  }
}

/**
 * Accumulates usage from one message into a total usage object.
 * Used to track cumulative usage across multiple assistant turns.
 */
// accumulateUsage 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function accumulateUsage(
  totalUsage: Readonly<NonNullableUsage>,
  messageUsage: Readonly<NonNullableUsage>,
): NonNullableUsage {
  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    input_tokens: totalUsage.input_tokens + messageUsage.input_tokens,
    cache_creation_input_tokens:
      totalUsage.cache_creation_input_tokens +
      messageUsage.cache_creation_input_tokens,
    cache_read_input_tokens:
      totalUsage.cache_read_input_tokens + messageUsage.cache_read_input_tokens,
    output_tokens: totalUsage.output_tokens + messageUsage.output_tokens,
    server_tool_use: {
      web_search_requests:
        totalUsage.server_tool_use.web_search_requests +
        messageUsage.server_tool_use.web_search_requests,
      web_fetch_requests:
        totalUsage.server_tool_use.web_fetch_requests +
        messageUsage.server_tool_use.web_fetch_requests,
    },
    service_tier: messageUsage.service_tier, // Use the most recent service tier
    cache_creation: {
      ephemeral_1h_input_tokens:
        totalUsage.cache_creation.ephemeral_1h_input_tokens +
        messageUsage.cache_creation.ephemeral_1h_input_tokens,
      ephemeral_5m_input_tokens:
        totalUsage.cache_creation.ephemeral_5m_input_tokens +
        messageUsage.cache_creation.ephemeral_5m_input_tokens,
    },
    // See comment in updateUsage — field is not on NonNullableUsage to keep
    // the string out of external builds.
    ...(feature('CACHED_MICROCOMPACT')
      ? {
          cache_deleted_input_tokens:
            ((totalUsage as unknown as { cache_deleted_input_tokens?: number })
              .cache_deleted_input_tokens ?? 0) +
            ((
              messageUsage as unknown as { cache_deleted_input_tokens?: number }
            ).cache_deleted_input_tokens ?? 0),
        }
      : {}),
    inference_geo: messageUsage.inference_geo, // Use the most recent
    iterations: messageUsage.iterations, // Use the most recent
    speed: messageUsage.speed, // Use the most recent
  }
}

// isToolResultBlock 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isToolResultBlock(
  block: unknown,
): block is { type: 'tool_result'; tool_use_id: string } {
  // 返回 `(`，作为API 服务 claude这次计算的结果。
  return (
    block !== null &&
    typeof block === 'object' &&
    'type' in block &&
    (block as { type: string }).type === 'tool_result' &&
    'tool_use_id' in block
  )
}

// CachedMCEditsBlock 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedMCEditsBlock = {
  type: 'cache_edits'
  edits: { type: 'delete'; cache_reference: string }[]
}

// CachedMCPinnedEdits 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type CachedMCPinnedEdits = {
  userMessageIndex: number
  block: CachedMCEditsBlock
}

// Exported for testing cache_reference placement constraints
// addCacheBreakpoints 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function addCacheBreakpoints(
  messages: (UserMessage | AssistantMessage)[],
  enablePromptCaching: boolean,
  querySource?: QuerySource,
  useCachedMC = false,
  newCacheEdits?: CachedMCEditsBlock | null,
  pinnedEdits?: CachedMCPinnedEdits[],
  skipCacheWrite = false,
): MessageParam[] {
  // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_cache_breakpoints', {
    totalMessageCount: messages.length,
    cachingEnabled: enablePromptCaching,
    skipCacheWrite,
  })

  // Exactly one message-level cache_control marker per request. Mycro's
  // turn-to-turn eviction (page_manager/index.rs: Index::insert) frees
  // local-attention KV pages at any cached prefix position NOT in
  // cache_store_int_token_boundaries. With two markers the second-to-last
  // position is protected and its locals survive an extra turn even though
  // nothing will ever resume from there — with one marker they're freed
  // immediately. For fire-and-forget forks (skipCacheWrite) we shift the
  // marker to the second-to-last message: that's the last shared-prefix
  // point, so the write is a no-op merge on mycro (entry already exists)
  // and the fork doesn't leave its own tail in the KVCC. Dense pages are
  // refcounted and survive via the new hash either way.
  // markerIndex 索引 命名 `skipCacheWrite ? messages.length - 2 : messages.length - 1`，让后续代码直接表达这个值的用途。
  const markerIndex = skipCacheWrite ? messages.length - 2 : messages.length - 1
  // 结果派生`messages.map`，供API 服务 claude后续处理使用。
  const result = messages.map((msg, index) => {
    // addCache 缓存标记API 服务 claude是否启用对应路径。
    const addCache = index === markerIndex
    // 当 `msg.type` 匹配 `'user'` 时，API 服务 claude执行对应分支。
    if (msg.type === 'user') {
      // 返回 `userMessageToMessageParam(`，作为API 服务 claude这次计算的结果。
      return userMessageToMessageParam(
        msg,
        addCache,
        enablePromptCaching,
        querySource,
      )
    }
    // 返回 `assistantMessageToMessageParam(`，作为API 服务 claude这次计算的结果。
    return assistantMessageToMessageParam(
      msg,
      addCache,
      enablePromptCaching,
      querySource,
    )
  })

  // useCachedMC 缓存缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
  if (!useCachedMC) {
    // 返回 `result`，作为API 服务 claude这次计算的结果。
    return result
  }

  // Track all cache_references being deleted to prevent duplicates across blocks.
  // seenDeleteRefs 集合构建`new Set<string>()` 整理出中间结果，供API 服务 claude后续步骤使用。
  const seenDeleteRefs = new Set<string>()

  // Helper to deduplicate a cache_edits block against already-seen deletions
  // deduplicateEdits 集合封装成回调，供API 服务 claude在事件触发或异步步骤中调用。
  const deduplicateEdits = (block: CachedMCEditsBlock): CachedMCEditsBlock => {
    // uniqueEdits 集合筛选`edits.filter`，供API 服务 claude后续处理使用。
    const uniqueEdits = block.edits.filter(edit => {
      // 满足 `seenDeleteRefs.has(edit.cache_reference)` 时，API 服务 claude执行该分支。
      if (seenDeleteRefs.has(edit.cache_reference)) {
        // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
        return false
      }
      // 调用 seenDeleteRefs.add，触发API 服务 claude此处需要的副作用。
      seenDeleteRefs.add(edit.cache_reference)
      // 返回 true 表示当前检查通过，调用方可以继续走允许路径。
      return true
    })
    // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
    return { ...block, edits: uniqueEdits }
  }

  // Re-insert all previously-pinned cache_edits at their original positions
  // 按顺序遍历 `pinnedEdits ?? []` 中的pinned，逐个交给API 服务 claude处理。
  for (const pinned of pinnedEdits ?? []) {
    // 消息读取 `result[pinned.userMessageIndex]` 对应条目，后续围绕该成员继续处理。
    const msg = result[pinned.userMessageIndex]
    // 当 `msg && msg.role` 匹配 `'user'` 时，API 服务 claude执行对应分支。
    if (msg && msg.role === 'user') {
      // 满足 `!Array.isArray(msg.content)` 时，API 服务 claude执行该分支。
      if (!Array.isArray(msg.content)) {
        // 文本内容更新为 `[{ type: 'text', text: msg.content as string }]`，确保API 服务后续读取最新状态。
        msg.content = [{ type: 'text', text: msg.content as string }]
      }
      // dedupedBlock保存`deduplicateEdits`，供API 服务 claude后续处理使用。
      const dedupedBlock = deduplicateEdits(pinned.block)
      // 满足 `dedupedBlock.edits.length > 0` 时，API 服务 claude执行该分支。
      if (dedupedBlock.edits.length > 0) {
        // 调用 insertBlockAfterToolResults，触发API 服务 claude此处需要的副作用。
        insertBlockAfterToolResults(msg.content, dedupedBlock)
      }
    }
  }

  // Insert new cache_edits into the last user message and pin them
  // 组合条件 `newCacheEdits && result.length > 0` 成立时，API 服务 claude才启用这条专门路径。
  if (newCacheEdits && result.length > 0) {
    // dedupedNewEdits 集合保存`deduplicateEdits`，供API 服务 claude后续处理使用。
    const dedupedNewEdits = deduplicateEdits(newCacheEdits)
    // 满足 `dedupedNewEdits.edits.length > 0` 时，API 服务 claude执行该分支。
    if (dedupedNewEdits.edits.length > 0) {
      // 循环处理 `let i = result.length - 1; i >= 0; i--`，让API 服务 claude逐项把同类条目按顺序走完。
      for (let i = result.length - 1; i >= 0; i--) {
        // 消息读取 `result[i]` 对应条目，后续围绕该成员继续处理。
        const msg = result[i]
        // 当 `msg && msg.role` 匹配 `'user'` 时，API 服务 claude执行对应分支。
        if (msg && msg.role === 'user') {
          // 满足 `!Array.isArray(msg.content)` 时，API 服务 claude执行该分支。
          if (!Array.isArray(msg.content)) {
            // 文本内容更新为 `[{ type: 'text', text: msg.content as string }]`，确保API 服务后续读取最新状态。
            msg.content = [{ type: 'text', text: msg.content as string }]
          }
          // 调用 insertBlockAfterToolResults，触发API 服务 claude此处需要的副作用。
          insertBlockAfterToolResults(msg.content, dedupedNewEdits)
          // Pin so this block is re-sent at the same position in future calls
          // 调用 pinCacheEdits，触发API 服务 claude此处需要的副作用。
          pinCacheEdits(i, newCacheEdits)

          // 记录API 服务 claude运行诊断，方便排查异常路径或性能问题。
          logForDebugging(
            // 这个回调绑定到 `Added cache_edits block with ${dedupedNewEdits.edits.length} deletion(s) to message…，负责API 服务 claude在该局部场景下的响应。
            `Added cache_edits block with ${dedupedNewEdits.edits.length} deletion(s) to message[${i}]: ${dedupedNewEdits.edits.map(e => e.cache_reference).join(', ')}`,
          )
          // 结束这个分支或循环，避免API 服务 claude继续落入后续路径。
          break
        }
      }
    }
  }

  // Add cache_reference to tool_result blocks that are within the cached prefix.
  // Must be done AFTER cache_edits insertion since that modifies content arrays.
  // 满足 `enablePromptCaching` 时，API 服务 claude执行该分支。
  if (enablePromptCaching) {
    // Find the last message containing a cache_control marker
    // lastCCMsg 命名 `-1`，让后续代码直接表达这个值的用途。
    let lastCCMsg = -1
    // 按索引扫描 `result.length`，需要消费相邻参数时可以精确移动游标。
    for (let i = 0; i < result.length; i++) {
      // 消息 命名 `result[i]!`，让后续代码直接表达这个值的用途。
      const msg = result[i]!
      // 满足 `Array.isArray(msg.content)` 时，API 服务 claude执行该分支。
      if (Array.isArray(msg.content)) {
        // 按顺序遍历 `msg.content` 中的block，逐个交给API 服务 claude处理。
        for (const block of msg.content) {
          // 组合条件 `block && typeof block === 'object' && 'cache_cont` 成立时，API 服务 claude才启用这条专门路径。
          if (block && typeof block === 'object' && 'cache_control' in block) {
            // lastCCMsg更新为 `i`，确保API 服务后续读取最新状态。
            lastCCMsg = i
          }
        }
      }
    }

    // Add cache_reference to tool_result blocks that are strictly before
    // the last cache_control marker. The API requires cache_reference to
    // appear "before or on" the last cache_control — we use strict "before"
    // to avoid edge cases where cache_edits splicing shifts block indices.
    //
    // Create new objects instead of mutating in-place to avoid contaminating
    // blocks reused by secondary queries that use models without cache_editing support.
    // 满足 `lastCCMsg >= 0` 时，API 服务 claude执行该分支。
    if (lastCCMsg >= 0) {
      // 按索引扫描 `lastCCMsg`，需要消费相邻参数时可以精确移动游标。
      for (let i = 0; i < lastCCMsg; i++) {
        // 消息 命名 `result[i]!`，让后续代码直接表达这个值的用途。
        const msg = result[i]!
        // `msg.role` 与 `'user' || !Array.isArray(msg.co...` 不一致时刷新派生状态，避免使用过期结果。
        if (msg.role !== 'user' || !Array.isArray(msg.content)) {
          // 跳过当前项，继续处理API 服务 claude中的下一轮循环。
          continue
        }
        // cloned标记API 服务 claude是否启用对应路径。
        let cloned = false
        // 按索引扫描 `msg.content.length`，需要消费相邻参数时可以精确移动游标。
        for (let j = 0; j < msg.content.length; j++) {
          // block读取 `msg.content[j]` 对应条目，后续围绕该成员继续处理。
          const block = msg.content[j]
          // 组合条件 `block && isToolResultBlock(block)` 成立时，API 服务 claude才启用这条专门路径。
          if (block && isToolResultBlock(block)) {
            // cloned缺失时提前走兜底路径，避免API 服务 claude继续依赖无效输入。
            if (!cloned) {
              // 文本内容更新为 `[...msg.content]`，确保API 服务后续读取最新状态。
              msg.content = [...msg.content]
              // cloned更新为 `true`，确保API 服务后续读取最新状态。
              cloned = true
            }
            // content[j更新为 `Object.assign({}, block, {`，确保API 服务 claude后续读取最新状态。
            msg.content[j] = Object.assign({}, block, {
              cache_reference: block.tool_use_id,
            })
          }
        }
      }
    }
  }

  // 返回 `result`，作为API 服务 claude这次计算的结果。
  return result
}

// buildSystemPromptBlocks 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function buildSystemPromptBlocks(
  systemPrompt: SystemPrompt,
  enablePromptCaching: boolean,
  options?: {
    skipGlobalCacheForSystemPrompt?: boolean
    querySource?: QuerySource
  },
): TextBlockParam[] {
  // IMPORTANT: Do not add any more blocks for caching or you will get a 400
  // 返回 `splitSysPromptPrefix(systemPrompt, {`，作为API 服务 claude这次计算的结果。
  return splitSysPromptPrefix(systemPrompt, {
    skipGlobalCacheForSystemPrompt: options?.skipGlobalCacheForSystemPrompt,
  // 这个回调绑定到 }).map(block => {，负责API 服务 claude在该局部场景下的响应。
  }).map(block => {
    // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
    return {
      type: 'text' as const,
      text: block.text,
      ...(enablePromptCaching &&
        block.cacheScope !== null && {
          cache_control: getCacheControl({
            scope: block.cacheScope,
            querySource: options?.querySource,
          }),
        }),
    }
  })
}

// HaikuOptions 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type HaikuOptions = Omit<Options, 'model' | 'getToolPermissionContext'>

// queryHaiku 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function queryHaiku({
  systemPrompt = asSystemPrompt([]),
  userPrompt,
  outputFormat,
  signal,
  options,
}: {
  systemPrompt: SystemPrompt
  userPrompt: string
  outputFormat?: BetaJSONOutputFormat
  signal: AbortSignal
  options: HaikuOptions
}): Promise<AssistantMessage> {
  // 结果保存`withVCR`，供API 服务 claude后续处理使用。
  const result = await withVCR(
    [
      createUserMessage({
        // 这个回调绑定到 content: systemPrompt.map(text => ({ type: 'text', text })),，负责API 服务 claude在该局部场景下的响应。
        content: systemPrompt.map(text => ({ type: 'text', text })),
      }),
      createUserMessage({
        content: userPrompt,
      }),
    ],
    // 调用 async，触发API 服务 claude此处需要的副作用。
    async () => {
      // 对话消息 聚合成有序列表，保持后续遍历顺序稳定。
      const messages = [
        createUserMessage({
          content: userPrompt,
        }),
      ]

      // 结果保存`queryModelWithoutStreaming`，供API 服务 claude后续处理使用。
      const result = await queryModelWithoutStreaming({
        messages,
        systemPrompt,
        thinkingConfig: { type: 'disabled' },
        tools: [],
        signal,
        options: {
          ...options,
          model: getSmallFastModel(),
          enablePromptCaching: options.enablePromptCaching ?? false,
          outputFormat,
          // getToolPermissionContext不依赖额外参数，直接计算API 服务 claude需要的结果。
          async getToolPermissionContext() {
            // 返回 `getEmptyToolPermissionContext()`，作为API 服务 claude这次计算的结果。
            return getEmptyToolPermissionContext()
          },
        },
      })
      // 返回列表结果，保留API 服务 claude已经排好的条目顺序。
      return [result]
    },
  )
  // We don't use streaming for Haiku so this is safe
  // 返回 `result[0]! as AssistantMessage`，作为API 服务 claude这次计算的结果。
  return result[0]! as AssistantMessage
}

// QueryWithModelOptions 固化API 服务 claude里传递的数据形状，帮助调用方按同一结构读写字段。
type QueryWithModelOptions = Omit<Options, 'getToolPermissionContext'>

/**
 * Query a specific model through the Claude Code infrastructure.
 * This goes through the full query pipeline including proper authentication,
 * betas, and headers - unlike direct API calls.
 */
// queryWithModel 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function queryWithModel({
  systemPrompt = asSystemPrompt([]),
  userPrompt,
  outputFormat,
  signal,
  options,
}: {
  systemPrompt: SystemPrompt
  userPrompt: string
  outputFormat?: BetaJSONOutputFormat
  signal: AbortSignal
  options: QueryWithModelOptions
}): Promise<AssistantMessage> {
  // 结果保存`withVCR`，供API 服务 claude后续处理使用。
  const result = await withVCR(
    [
      createUserMessage({
        // 这个回调绑定到 content: systemPrompt.map(text => ({ type: 'text', text })),，负责API 服务 claude在该局部场景下的响应。
        content: systemPrompt.map(text => ({ type: 'text', text })),
      }),
      createUserMessage({
        content: userPrompt,
      }),
    ],
    // 调用 async，触发API 服务 claude此处需要的副作用。
    async () => {
      // 对话消息 聚合成有序列表，保持后续遍历顺序稳定。
      const messages = [
        createUserMessage({
          content: userPrompt,
        }),
      ]

      // 结果保存`queryModelWithoutStreaming`，供API 服务 claude后续处理使用。
      const result = await queryModelWithoutStreaming({
        messages,
        systemPrompt,
        thinkingConfig: { type: 'disabled' },
        tools: [],
        signal,
        options: {
          ...options,
          enablePromptCaching: options.enablePromptCaching ?? false,
          outputFormat,
          // getToolPermissionContext不依赖额外参数，直接计算API 服务 claude需要的结果。
          async getToolPermissionContext() {
            // 返回 `getEmptyToolPermissionContext()`，作为API 服务 claude这次计算的结果。
            return getEmptyToolPermissionContext()
          },
        },
      })
      // 返回列表结果，保留API 服务 claude已经排好的条目顺序。
      return [result]
    },
  )
  // 返回 `result[0]! as AssistantMessage`，作为API 服务 claude这次计算的结果。
  return result[0]! as AssistantMessage
}

// Non-streaming requests have a 10min max per the docs:
// https://platform.claude.com/docs/en/api/errors#long-requests
// The SDK's 21333-token cap is derived from 10min × 128k tokens/hour, but we
// bypass it by setting a client-level timeout, so we can cap higher.
// MAX_NON_STREAMING_TOKENS 集合 命名 `64_000`，让后续代码直接表达这个值的用途。
export const MAX_NON_STREAMING_TOKENS = 64_000

/**
 * Adjusts thinking budget when max_tokens is capped for non-streaming fallback.
 * Ensures the API constraint: max_tokens > thinking.budget_tokens
 *
 * @param params - The parameters that will be sent to the API
 * @param maxTokensCap - The maximum allowed tokens (MAX_NON_STREAMING_TOKENS)
 * @returns Adjusted parameters with thinking budget capped if needed
 */
// adjustParamsForNonStreaming 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function adjustParamsForNonStreaming<
  T extends {
    max_tokens: number
    thinking?: BetaMessageStreamParams['thinking']
  },
>(params: T, maxTokensCap: number): T {
  // cappedMaxTokens 集合保存`Math.min`，供API 服务 claude后续处理使用。
  const cappedMaxTokens = Math.min(params.max_tokens, maxTokensCap)

  // Adjust thinking budget if it would exceed capped max_tokens
  // to maintain the constraint: max_tokens > thinking.budget_tokens
  // adjustedParams 集合 集中保存API 服务 claude要一起传递的字段。
  const adjustedParams = { ...params }
  // API 服务 claude在这里进入条件判断，后续代码按实际状态分流。
  if (
    adjustedParams.thinking?.type === 'enabled' &&
    adjustedParams.thinking.budget_tokens
  ) {
    // thinking更新为 `{`，确保API 服务后续读取最新状态。
    adjustedParams.thinking = {
      ...adjustedParams.thinking,
      budget_tokens: Math.min(
        adjustedParams.thinking.budget_tokens,
        cappedMaxTokens - 1, // Must be at least 1 less than max_tokens
      ),
    }
  }

  // 返回结构化结果，集中表达API 服务 claude已经整理出的状态。
  return {
    ...adjustedParams,
    max_tokens: cappedMaxTokens,
  }
}

// isMaxTokensCapEnabled 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function isMaxTokensCapEnabled(): boolean {
  // 3P default: false (not validated on Bedrock/Vertex)
  // 返回 `getFeatureValue_CACHED_MAY_BE_STALE('tengu_otk_slot_v1', false)`，作为API 服务 claude这次计算的结果。
  return getFeatureValue_CACHED_MAY_BE_STALE('tengu_otk_slot_v1', false)
}

// getMaxOutputTokensForModel 封装API 服务的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function getMaxOutputTokensForModel(model: string): number {
  // maxOutputTokens 集合读取`getModelMaxOutputTokens`，供API 服务 claude后续处理使用。
  const maxOutputTokens = getModelMaxOutputTokens(model)

  // Slot-reservation cap: drop default to 8k for all models. BQ p99 output
  // = 4,911 tokens; 32k/64k defaults over-reserve 8-16× slot capacity.
  // Requests hitting the cap get one clean retry at 64k (query.ts
  // max_output_tokens_escalate). Math.min keeps models with lower native
  // defaults (e.g. claude-3-opus at 4k) at their native value. Applied
  // before the env-var override so CLAUDE_CODE_MAX_OUTPUT_TOKENS still wins.
  // defaultTokens 集合保存`isMaxTokensCapEnabled`，供API 服务 claude后续处理使用。
  const defaultTokens = isMaxTokensCapEnabled()
    ? Math.min(maxOutputTokens.default, CAPPED_DEFAULT_MAX_TOKENS)
    : maxOutputTokens.default

  // 结果读取`validateBoundedIntEnvVar`，供API 服务 claude后续处理使用。
  const result = validateBoundedIntEnvVar(
    'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
    process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS,
    defaultTokens,
    maxOutputTokens.upperLimit,
  )
  // 返回 `result.effective`，作为API 服务 claude这次计算的结果。
  return result.effective
}
