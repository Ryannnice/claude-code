// 类型依赖 Anthropic 来自 @anthropic-ai/sdk，用于校准共享工具的数据契约。
import type Anthropic from '@anthropic-ai/sdk'
// 类型依赖 { BetaToolUnion } 来自 @anthropic-ai/sdk/resources/beta/messages.js，用于校准共享工具的数据契约。
import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getLastApiCompletionTimestamp,
  setLastApiCompletionTimestamp,
} from '../bootstrap/state.js'
// 引入 STRUCTURED_OUTPUTS_BETA_HEADER，将 ../constants/betas.js 中已经封装好的能力接到本文件流程里。
import { STRUCTURED_OUTPUTS_BETA_HEADER } from '../constants/betas.js'
// 类型依赖 { QuerySource } 来自 ../constants/querySource.js，用于校准共享工具的数据契约。
import type { QuerySource } from '../constants/querySource.js'
// 整理这一组导入，让共享工具后续逻辑可以直接复用这些外部能力。
import {
  getAttributionHeader,
  getCLISyspromptPrefix,
} from '../constants/system.js'
// 接入 logEvent 服务层能力，把外部通信或共享状态交给 ../services/analytics/index.js 处理。
import { logEvent } from '../services/analytics/index.js'
// 类型依赖 { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATH… 来自 ../services/analytics/metadata.js，用于校准共享工具的数据契约。
import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../services/analytics/metadata.js'
// 接入 getAPIMetadata 服务层能力，把外部通信或共享状态交给 ../services/api/claude.js 处理。
import { getAPIMetadata } from '../services/api/claude.js'
// 接入 getAnthropicClient 服务层能力，把外部通信或共享状态交给 ../services/api/client.js 处理。
import { getAnthropicClient } from '../services/api/client.js'
// 引入 getModelBetas、modelSupportsStructuredOutputs，将 ./betas.js 中已经封装好的能力接到本文件流程里。
import { getModelBetas, modelSupportsStructuredOutputs } from './betas.js'
// 引入 computeFingerprint，将 ./fingerprint.js 中已经封装好的能力接到本文件流程里。
import { computeFingerprint } from './fingerprint.js'
// 引入 normalizeModelStringForAPI，将 ./model/model.js 中已经封装好的能力接到本文件流程里。
import { normalizeModelStringForAPI } from './model/model.js'

// MessageParam 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type MessageParam = Anthropic.MessageParam
// TextBlockParam 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type TextBlockParam = Anthropic.TextBlockParam
// Tool 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type Tool = Anthropic.Tool
// ToolChoice 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type ToolChoice = Anthropic.ToolChoice
// BetaMessage 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BetaMessage = Anthropic.Beta.Messages.BetaMessage
// BetaJSONOutputFormat 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BetaJSONOutputFormat = Anthropic.Beta.Messages.BetaJSONOutputFormat
// BetaThinkingConfigParam 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
type BetaThinkingConfigParam = Anthropic.Beta.Messages.BetaThinkingConfigParam

// SideQueryOptions 固化共享工具里传递的数据形状，帮助调用方按同一结构读写字段。
export type SideQueryOptions = {
  /** Model to use for the query */
  model: string
  /**
   * System prompt - string or array of text blocks (will be prefixed with CLI attribution).
   *
   * The attribution header is always placed in its own TextBlockParam block to ensure
   * server-side parsing correctly extracts the cc_entrypoint value without including
   * system prompt content.
   */
  system?: string | TextBlockParam[]
  /** Messages to send (supports cache_control on content blocks) */
  messages: MessageParam[]
  /** Optional tools (supports both standard Tool[] and BetaToolUnion[] for custom tool types) */
  tools?: Tool[] | BetaToolUnion[]
  /** Optional tool choice (use { type: 'tool', name: 'x' } for forced output) */
  tool_choice?: ToolChoice
  /** Optional JSON output format for structured responses */
  output_format?: BetaJSONOutputFormat
  /** Max tokens (default: 1024) */
  max_tokens?: number
  /** Max retries (default: 2) */
  maxRetries?: number
  /** Abort signal */
  signal?: AbortSignal
  /** Skip CLI system prompt prefix (keeps attribution header for OAuth). For internal classifiers that provide their own prompt. */
  skipSystemPromptPrefix?: boolean
  /** Temperature override */
  temperature?: number
  /** Thinking budget (enables thinking), or `false` to send `{ type: 'disabled' }`. */
  thinking?: number | false
  /** Stop sequences — generation stops when any of these strings is emitted */
  stop_sequences?: string[]
  /** Attributes this call in tengu_api_success for COGS joining against reporting.sampling_calls. */
  querySource: QuerySource
}

/**
 * Extract text from first user message for fingerprint computation.
 */
// extractFirstUserMessageText 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
function extractFirstUserMessageText(messages: MessageParam[]): string {
  // firstUserMessage 消息数据筛选`messages.find`，供共享工具后续处理使用。
  const firstUserMessage = messages.find(m => m.role === 'user')
  // firstUserMessage 消息数据缺失时直接走兜底路径，避免共享工具使用无效输入。
  if (!firstUserMessage) return ''

  // 文本内容 命名 `firstUserMessage.content`，让后续代码直接表达这个值的用途。
  const content = firstUserMessage.content
  // 当 `typeof content` 匹配 `'string'` 时，共享工具执行对应分支。
  if (typeof content === 'string') return content

  // Array of content blocks - find first text block
  // textBlock筛选`content.find`，供共享工具后续处理使用。
  const textBlock = content.find(block => block.type === 'text')
  // 返回 `textBlock?.type === 'text' ? textBlock.text : ''`，作为共享工具这次计算的结果。
  return textBlock?.type === 'text' ? textBlock.text : ''
}

/**
 * Lightweight API wrapper for "side queries" outside the main conversation loop.
 *
 * Use this instead of direct client.beta.messages.create() calls to ensure
 * proper OAuth token validation with fingerprint attribution headers.
 *
 * This handles:
 * - Fingerprint computation for OAuth validation
 * - Attribution header injection
 * - CLI system prompt prefix
 * - Proper betas for the model
 * - API metadata
 * - Model string normalization (strips [1m] suffix for API)
 *
 * @example
 * // Permission explainer
 * await sideQuery({ querySource: 'permission_explainer', model, system: SYSTEM_PROMPT, messages, tools, tool_choice })
 *
 * @example
 * // Session search
 * await sideQuery({ querySource: 'session_search', model, system: SEARCH_PROMPT, messages })
 *
 * @example
 * // Model validation
 * await sideQuery({ querySource: 'model_validation', model, max_tokens: 1, messages: [{ role: 'user', content: 'Hi' }] })
 */
// sideQuery 封装共享工具的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export async function sideQuery(opts: SideQueryOptions): Promise<BetaMessage> {
  // 这里从对象中解构出后续要用的字段，减少重复访问嵌套属性。
  const {
    model,
    system,
    messages,
    tools,
    tool_choice,
    output_format,
    max_tokens = 1024,
    maxRetries = 2,
    signal,
    skipSystemPromptPrefix,
    temperature,
    thinking,
    stop_sequences,
  } = opts

  // API 客户端读取`getAnthropicClient`，供共享工具后续处理使用。
  const client = await getAnthropicClient({
    maxRetries,
    model,
    source: 'side_query',
  })
  // betas 集合读取`getModelBetas`，供共享工具后续处理使用。
  const betas = [...getModelBetas(model)]
  // Add structured-outputs beta if using output_format and provider supports it
  // 共享工具在这里按实际状态进入对应分支。
  if (
    output_format &&
    modelSupportsStructuredOutputs(model) &&
    !betas.includes(STRUCTURED_OUTPUTS_BETA_HEADER)
  ) {
    // betas 集合追加新条目，保持收集顺序与输入顺序一致。
    betas.push(STRUCTURED_OUTPUTS_BETA_HEADER)
  }

  // Extract first user message text for fingerprint
  // messageText 消息数据保存`extractFirstUserMessageText`，供共享工具后续处理使用。
  const messageText = extractFirstUserMessageText(messages)

  // Compute fingerprint for OAuth attribution
  // fingerprint保存`computeFingerprint`，供共享工具后续处理使用。
  const fingerprint = computeFingerprint(messageText, MACRO.VERSION)
  // attributionHeader读取`getAttributionHeader`，供共享工具后续处理使用。
  const attributionHeader = getAttributionHeader(fingerprint)

  // Build system as array to keep attribution header in its own block
  // (prevents server-side parsing from including system content in cc_entrypoint)
  // systemBlocks 集合 聚合成有序列表，保持后续遍历顺序稳定。
  const systemBlocks: TextBlockParam[] = [
    attributionHeader ? { type: 'text', text: attributionHeader } : null,
    // Skip CLI system prompt prefix for internal classifiers that provide their own prompt
    ...(skipSystemPromptPrefix
      ? []
      : [
          {
            type: 'text' as const,
            text: getCLISyspromptPrefix({
              isNonInteractive: false,
              hasAppendSystemPrompt: false,
            }),
          },
        ]),
    ...(Array.isArray(system)
      ? system
      : system
        ? [{ type: 'text' as const, text: system }]
        : []),
  // 这个回调绑定到 ].filter((block): block is TextBlockParam => block !== null)，负责共享工具在该局部场景下的响应。
  ].filter((block): block is TextBlockParam => block !== null)

  // thinkingConfig 配置 先占位，稍后的条件分支会根据实际输入补齐它。
  let thinkingConfig: BetaThinkingConfigParam | undefined
  // 满足 `thinking === false` 时，共享工具执行该分支。
  if (thinking === false) {
    // thinkingConfig 配置更新为 `{ type: 'disabled' }`，确保共享工具后续读取最新状态。
    thinkingConfig = { type: 'disabled' }
  // 共享工具 side Query在这里处理 `} else if (thinking !== undefined) {`，完成这一小步状态转换。
  } else if (thinking !== undefined) {
    // thinkingConfig 配置更新为 `{`，确保共享工具后续读取最新状态。
    thinkingConfig = {
      type: 'enabled',
      budget_tokens: Math.min(thinking, max_tokens - 1),
    }
  }

  // normalizedModel保存`normalizeModelStringForAPI`，供共享工具后续处理使用。
  const normalizedModel = normalizeModelStringForAPI(model)
  // start记录时间`Date.now`，供共享工具后续处理使用。
  const start = Date.now()
  // biome-ignore lint/plugin: this IS the wrapper that handles OAuth attribution
  // 接口响应构建`messages.create`，供共享工具后续处理使用。
  const response = await client.beta.messages.create(
    {
      model: normalizedModel,
      max_tokens,
      system: systemBlocks,
      messages,
      ...(tools && { tools }),
      ...(tool_choice && { tool_choice }),
      ...(output_format && { output_config: { format: output_format } }),
      ...(temperature !== undefined && { temperature }),
      ...(stop_sequences && { stop_sequences }),
      ...(thinkingConfig && { thinking: thinkingConfig }),
      ...(betas.length > 0 && { betas }),
      metadata: getAPIMetadata(),
    },
    { signal },
  )

  // requestId 的表达式跨多行展开，这里先建立变量再在后续行完成计算。
  const requestId =
    (response as { _request_id?: string | null })._request_id ?? undefined
  // now记录时间`Date.now`，供共享工具后续处理使用。
  const now = Date.now()
  // lastCompletion读取`getLastApiCompletionTimestamp`，供共享工具后续处理使用。
  const lastCompletion = getLastApiCompletionTimestamp()
  // 记录共享工具运行诊断，方便排查异常路径或性能问题。
  logEvent('tengu_api_success', {
    requestId:
      requestId as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    querySource:
      opts.querySource as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    model:
      normalizedModel as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cachedInputTokens: response.usage.cache_read_input_tokens ?? 0,
    uncachedInputTokens: response.usage.cache_creation_input_tokens ?? 0,
    durationMsIncludingRetries: now - start,
    timeSinceLastApiCallMs:
      lastCompletion !== null ? now - lastCompletion : undefined,
  })
  // setLastApiCompletionTimestamp 写入新的状态值，使共享工具后续读取保持一致。
  setLastApiCompletionTimestamp(now)

  // 返回 `response`，作为共享工具这次计算的结果。
  return response
}
